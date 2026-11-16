import { useState, useEffect, useRef } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { Link } from "react-router-dom";
import { getRequest, postRequest } from "../../../service/apiService";
import {
  PAC_PENDING_LIST,
  MAS_ANAESTHESIA_INSTRUCTION,
  MAS_ANAESTHESIA_TYPE,
  MAS_ASA_GRADE,
  PAC_ASSESSMENT,
  PAC_ASSESSMENT_BY_BOOKING,
} from "../../../config/apiConfig";
import {
  SAVE_PAC_ASSESSMENT_SUCCESS,
  SAVE_PAC_DRAFT_SUCCESS,
  SAVE_PAC_ASSESSMENT_ERROR,
} from "../../../config/constants";

// Helper to get logged-in user name from storage
const getLoggedInUserName = () => {
  try {
    return (
      sessionStorage.getItem("loggedInUserName") ||
      localStorage.getItem("loggedInUserName") ||
      sessionStorage.getItem("userName") ||
      localStorage.getItem("userName") ||
      "Nurse Priya"
    );
  } catch (e) {
    return "Nurse Priya";
  }
};

// Helper to format scheduled date and time
const formatScheduledDateTime = (item) => {
  const date = item.scheduledDate || item.preferredDate || "";
  const start = item.scheduledStartTime || item.preferredStartTime || "";
  const end = item.scheduledEndTime || item.preferredEndTime || "";
  if (!date && !start) return "-";
  if (start && end) {
    return `${date} (${start} - ${end})`.trim();
  }
  return `${date} ${start}`.trim();
};

const PACClearance = () => {
  // ----- State -----
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [appliedFilters, setAppliedFilters] = useState({ search: "", type: "All" });

  // Clear PAC modal states
  const [showClearModal, setShowClearModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [clearRemarks, setClearRemarks] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [editPACClearance, setEditPACClearance] = useState(false);

  const [activeTab, setActiveTab] = useState("lab");

  const tabs = [
    { id: "lab", label: "LAB" },
    { id: "radiology", label: "Radiology" },
    { id: "previous", label: "Previous Visits" }
  ];

  // Pre-Anaesthesia Instructions states (PRE only)
  const [instructionsList, setInstructionsList] = useState([]);
  const [loadingInstructions, setLoadingInstructions] = useState(false);
  const [selectedInstructions, setSelectedInstructions] = useState([]);
  const [showAddInstructionInput, setShowAddInstructionInput] = useState(false);
  const [newInstructionText, setNewInstructionText] = useState("");

  // Planned Anaesthesia states
  const [anaesthesiaTypes, setAnaesthesiaTypes] = useState([]);
  const [loadingAnaesthesiaTypes, setLoadingAnaesthesiaTypes] = useState(false);
  const [plannedAnaesthesia, setPlannedAnaesthesia] = useState("");

  // ASA Physical Status states
  const [asaGrades, setAsaGrades] = useState([]);
  const [loadingAsaGrades, setLoadingAsaGrades] = useState(false);
  const [selectedAsaGrade, setSelectedAsaGrade] = useState("");

  // Airway Examination states
  const initialAirwayExam = {
    mallampatiClass: "",
    thyromentalDistance: "",
    mouthOpening: "",
    tmj: "",
    teethDentures: "",
    neckMovement: "",
    ivAccess: "",
    spine: "",
    spineRemarks: "",
  };
  const [airwayExam, setAirwayExam] = useState(initialAirwayExam);

  const handleAirwayChange = (field, value) => {
    setAirwayExam((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumericChange = (field, value) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      handleAirwayChange(field, value);
    }
  };

  // Medical History rows
  const [medicalHistory, setMedicalHistory] = useState([
    { diseaseName: "", duration: "" },
  ]);
  const [currentMedications, setCurrentMedications] = useState("");
  const [allergyStatus, setAllergyStatus] = useState("NONE");

  // Previous Anaesthesia state
  const [previousAnaesthesia, setPreviousAnaesthesia] = useState("N");

  // Vitals states & validation
  const initialVitals = {
    weight: "",
    bp: "",
    pulse: "",
    rr: "",
    spo2: "",
    temperature: "",
  };
  const [vitals, setVitals] = useState(initialVitals);
  const [vitalsErrors, setVitalsErrors] = useState({});

  const validateVital = (field, value) => {
    if (!value || value.trim() === "") return "";
    const val = value.trim();

    switch (field) {
      case "weight": {
        const num = parseFloat(val);
        if (isNaN(num)) return "Invalid weight";
        if (num <= 0 || num > 350) return "Typically 1-350 kg";
        return "";
      }
      case "bp": {
        if (!/^\d{2,3}\/\d{2,3}$/.test(val)) {
          return "Format: Sys/Dia (e.g. 120/80)";
        }
        const [sys, dia] = val.split("/").map(Number);
        if (sys < 50 || sys > 260) return "Sys: 50-260";
        if (dia < 30 || dia > 150) return "Dia: 30-150";
        if (sys <= dia) return "Sys must be > Dia";
        return "";
      }
      case "pulse": {
        const num = parseInt(val, 10);
        if (isNaN(num)) return "Invalid pulse";
        if (num < 30 || num > 220) return "Typically 30-220 /min";
        return "";
      }
      case "rr": {
        const num = parseInt(val, 10);
        if (isNaN(num)) return "Invalid RR";
        if (num < 8 || num > 60) return "Typically 8-60 /min";
        return "";
      }
      case "spo2": {
        const num = parseFloat(val);
        if (isNaN(num)) return "Invalid SpO2";
        if (num < 50 || num > 100) return "Typically 50-100%";
        return "";
      }
      case "temperature": {
        const num = parseFloat(val);
        if (isNaN(num)) return "Invalid temp";
        if (num > 45) return "Temp in °C (35-42°C; 98.6°F is 37°C)";
        if (num < 30) return "Typically 30-45°C";
        return "";
      }
      default:
        return "";
    }
  };

  const handleVitalChange = (field, value) => {
    if (field === "weight") {
      if (value !== "" && !/^\d{0,3}(\.\d{0,1})?$/.test(value)) return;
    } else if (field === "bp") {
      if (value !== "" && !/^\d{0,3}(\/\d{0,3})?$/.test(value)) return;
    } else if (field === "pulse" || field === "rr") {
      if (value !== "" && !/^\d{0,3}$/.test(value)) return;
    } else if (field === "spo2") {
      if (value !== "" && !/^\d{0,3}$/.test(value)) return;
      if (Number(value) > 100) return;
    } else if (field === "temperature") {
      if (value !== "" && !/^\d{0,3}(\.\d{0,1})?$/.test(value)) return;
    }

    setVitals((prev) => ({ ...prev, [field]: value }));

    if (vitalsErrors[field]) {
      const err = validateVital(field, value);
      setVitalsErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const handleVitalBlur = (field) => {
    const err = validateVital(field, vitals[field]);
    setVitalsErrors((prev) => ({ ...prev, [field]: err }));
  };

  // General Examination states (Pallor, Icterus, Cyanosis, Koilonychia, Oedema, Lymphadenopathy)
  const initialGeneralExam = {
    pallor: "N",
    icterus: "N",
    cyanosis: "N",
    koilonychia: "N",
    oedema: "N",
    lymphadenopathy: "N",
  };
  const [generalExam, setGeneralExam] = useState(initialGeneralExam);

  const handleGeneralExamChange = (field, value) => {
    setGeneralExam((prev) => ({ ...prev, [field]: value }));
  };

  // Systemic Examination states
  const initialSystemicExam = {
    cvs: "",
    rs: "",
    cns: "",
    abdomen: "",
  };
  const [systemicExam, setSystemicExam] = useState(initialSystemicExam);

  const handleSystemicChange = (field, value) => {
    setSystemicExam((prev) => ({ ...prev, [field]: value }));
  };

  // Anaesthesia Plan extra states
  const [asaEmergency, setAsaEmergency] = useState("N");
  const [specialistReferralRequired, setSpecialistReferralRequired] = useState("N");

  // Clearance Status & Remarks
  const [clearanceStatus, setClearanceStatus] = useState("P");
  const [pacRemarks, setPacRemarks] = useState("");

  // Supporting Document upload states
  const [documentName, setDocumentName] = useState("Scanned PAC Copy");
  const [scannedPacFile, setScannedPacFile] = useState(null);
  const fileInputRef = useRef(null);

  // Submission state
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false);
  const [assessmentSubmittingType, setAssessmentSubmittingType] = useState("");

  // Existing Assessment (for Update / Edit)
  const [existingAssessmentId, setExistingAssessmentId] = useState(null);
  const [loadingAssessmentDetails, setLoadingAssessmentDetails] = useState(false);
  const [existingDocuments, setExistingDocuments] = useState([]);

  const handleAddDiseaseRow = () => {
    setMedicalHistory((prev) => [...prev, { diseaseName: "", duration: "" }]);
  };

  const handleRemoveDiseaseRow = (index) => {
    setMedicalHistory((prev) => {
      if (prev.length <= 1) return [{ diseaseName: "", duration: "" }];
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDiseaseChange = (index, field, value) => {
    setMedicalHistory((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    const isImage =
      file.type.startsWith("image/") ||
      /\.(jpe?g|png|gif|bmp|webp)$/i.test(file.name);

    if (!isPdf && !isImage) {
      showPopup(
        "Only PDF and image files (PDF, JPG, PNG, JPEG) are allowed for Scanned PAC Copy.",
        "error"
      );
      e.target.value = "";
      setScannedPacFile(null);
      return;
    }

    setScannedPacFile(file);
  };

  const handleRemoveFile = () => {
    setScannedPacFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetAllFormStates = () => {
    setMedicalHistory([{ diseaseName: "", duration: "" }]);
    setCurrentMedications("");
    setAllergyStatus("NONE");
    setPreviousAnaesthesia("N");
    setVitals(initialVitals);
    setVitalsErrors({});
    setGeneralExam(initialGeneralExam);
    setAirwayExam(initialAirwayExam);
    setSystemicExam(initialSystemicExam);
    setSelectedAsaGrade("");
    setAsaEmergency("N");
    setPlannedAnaesthesia("");
    setSpecialistReferralRequired("N");
    setSelectedInstructions([]);
    setShowAddInstructionInput(false);
    setNewInstructionText("");
    setDocumentName("Scanned PAC Copy");
    setScannedPacFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setClearanceStatus("P");
    setPacRemarks("");
    setExistingAssessmentId(null);
    setExistingDocuments([]);
  };

  // ----- Fetch Existing PAC Assessment for Booking (for edit/update) -----
  const fetchAssessmentByBooking = async (otBookingId) => {
    try {
      setLoadingAssessmentDetails(true);
      const res = await getRequest(`${PAC_ASSESSMENT_BY_BOOKING}/${otBookingId}`);
      const data = res?.response;
      const asm = data?.assessment;

      if (asm) {
        if (asm.pacAssessmentId) {
          setExistingAssessmentId(asm.pacAssessmentId);
        }

        // Medications & Allergy & Previous Anaesthesia
        if (asm.currentMedications !== undefined && asm.currentMedications !== null) {
          setCurrentMedications(asm.currentMedications);
        }
        if (asm.allergyStatus) {
          setAllergyStatus(asm.allergyStatus);
        }
        if (asm.previousAnaesthesia) {
          setPreviousAnaesthesia(asm.previousAnaesthesia);
        }

        // Vitals
        const bpStr =
          asm.bpSystolic && asm.bpDiastolic
            ? `${asm.bpSystolic}/${asm.bpDiastolic}`
            : asm.bpSystolic
            ? String(asm.bpSystolic)
            : "";

        setVitals({
          weight:
            asm.weightKg !== null && asm.weightKg !== undefined
              ? String(asm.weightKg)
              : "",
          bp: bpStr,
          pulse:
            asm.pulse !== null && asm.pulse !== undefined
              ? String(asm.pulse)
              : "",
          rr:
            asm.respiratoryRate !== null && asm.respiratoryRate !== undefined
              ? String(asm.respiratoryRate)
              : "",
          spo2:
            asm.spo2 !== null && asm.spo2 !== undefined
              ? String(asm.spo2)
              : "",
          temperature:
            asm.temperature !== null && asm.temperature !== undefined
              ? String(asm.temperature)
              : "",
        });
        setVitalsErrors({});

        // General Examination
        setGeneralExam({
          pallor: asm.pallor || "N",
          icterus: asm.icterus || "N",
          cyanosis: asm.cyanosis || "N",
          koilonychia: asm.koilonychia || "N",
          oedema: asm.oedema || "N",
          lymphadenopathy: asm.lymphadenopathy || "N",
        });

        // Airway Examination
        let spineVal = "Normal";
        let spineRem = "";
        if (asm.spineFindings) {
          if (asm.spineFindings.toLowerCase().startsWith("abnormal")) {
            spineVal = "Abnormal";
            spineRem = asm.spineFindings.replace(/^Abnormal:?\s*/i, "");
          } else if (asm.spineFindings.toLowerCase() === "normal") {
            spineVal = "Normal";
          } else {
            spineVal = asm.spineFindings;
          }
        }

        setAirwayExam({
          mallampatiClass: asm.mallampatiClass || "",
          thyromentalDistance:
            asm.thyromentalDistanceCm !== null &&
            asm.thyromentalDistanceCm !== undefined
              ? String(asm.thyromentalDistanceCm)
              : "",
          mouthOpening:
            asm.mouthOpeningCm !== null && asm.mouthOpeningCm !== undefined
              ? String(asm.mouthOpeningCm)
              : "",
          tmj: asm.tmjFindings || "",
          teethDentures: asm.teethDentures || "",
          neckMovement: asm.neckMovement || "",
          ivAccess: asm.ivAccess || "",
          spine: spineVal,
          spineRemarks: spineRem,
        });

        // Systemic Examination
        setSystemicExam({
          cvs: asm.cvsFindings || "",
          rs: asm.rsFindings || "",
          cns: asm.cnsFindings || "",
          abdomen: asm.abdomenFindings || "",
        });

        // Anaesthesia Plan
        if (asm.asaGradeId) {
          setSelectedAsaGrade(String(asm.asaGradeId));
        }
        setAsaEmergency(asm.asaEmergency || "N");
        if (asm.anaesthesiaTypeId) {
          setPlannedAnaesthesia(String(asm.anaesthesiaTypeId));
        }
        setSpecialistReferralRequired(asm.specialistReferralRequired || "N");

        // Clearance Status
        let clStatus = "P";
        const rawCl = (asm.clearanceStatus || "").toUpperCase();
        if (rawCl === "CLEARED" || rawCl === "C") clStatus = "C";
        else if (rawCl === "NOT_CLEARED" || rawCl === "N") clStatus = "N";
        else clStatus = "P";
        setClearanceStatus(clStatus);

        // PAC Remarks
        setPacRemarks(asm.pacRemarks || "");

        // Medical History
        if (Array.isArray(data.medicalHistory) && data.medicalHistory.length > 0) {
          setMedicalHistory(
            data.medicalHistory.map((m) => ({
              pacMedicalHistoryId: m.pacMedicalHistoryId,
              diseaseName: m.diseaseName || "",
              duration: m.duration ? String(m.duration) : "",
            }))
          );
        }

        // Instructions
        if (Array.isArray(data.instructions) && data.instructions.length > 0) {
          const selectedIds = [];
          const additionalCustom = [];

          data.instructions.forEach((savedInst, idx) => {
            const text = savedInst.instructionText || savedInst.instruction || "";
            if (!text) return;

            const matched = instructionsList.find(
              (item) =>
                item.instruction?.trim().toLowerCase() === text.trim().toLowerCase()
            );

            if (matched) {
              selectedIds.push(matched.anaesthesiaInstructionId);
            } else {
              const customId = `custom-loaded-${savedInst.pacInstructionId || idx + 1}`;
              additionalCustom.push({
                anaesthesiaInstructionId: customId,
                instructionType: "PRE",
                instruction: text,
                status: "Y",
              });
              selectedIds.push(customId);
            }
          });

          if (additionalCustom.length > 0) {
            setInstructionsList((prev) => [...prev, ...additionalCustom]);
          }
          setSelectedInstructions(selectedIds);
        }

        // Documents
        if (Array.isArray(data.documents) && data.documents.length > 0) {
          setExistingDocuments(data.documents);
        } else {
          setExistingDocuments([]);
        }
      }
    } catch (err) {
      console.log("No existing assessment found or error fetching:", err);
    } finally {
      setLoadingAssessmentDetails(false);
    }
  };

  // ----- Open Assessment View and load data -----
  const handleOpenAssessment = async (item) => {
    setSelectedRecord(item);
    resetAllFormStates();
    if (item?.anaesthesiaTypeId) {
      setPlannedAnaesthesia(String(item.anaesthesiaTypeId));
    }
    if (item?.asaGradeId || item?.gradeId) {
      setSelectedAsaGrade(String(item.asaGradeId || item.gradeId));
    }
    setEditPACClearance(true);

    const otBookingId = item.otBookingId || item.id;
    if (otBookingId) {
      await fetchAssessmentByBooking(otBookingId);
    }
  };

  // ----- Submit PAC Assessment / Draft -----
  const handleSubmitPACAssessment = async (submissionStatus) => {
    const otBookingId = selectedRecord?.otBookingId || selectedRecord?.id;
    if (!otBookingId) {
      showPopup("Booking ID not found. Please re-select the patient.", "error");
      return;
    }

    // Validation for final Save PAC Assessment ("S")
    if (submissionStatus === "S") {
      if (!selectedAsaGrade) {
        showPopup("Please select ASA Physical Status.", "error");
        return;
      }
      if (!plannedAnaesthesia) {
        showPopup("Please select Planned Anaesthesia.", "error");
        return;
      }
      if (!clearanceStatus) {
        showPopup(
          "Please select Clearance Status (Cleared, Pending, or Not Cleared).",
          "error"
        );
        return;
      }
      const hasErrors = Object.values(vitalsErrors).some((err) => !!err);
      if (hasErrors) {
        showPopup("Please correct invalid vitals before saving.", "error");
        return;
      }
      if (airwayExam.spine === "Abnormal" && !airwayExam.spineRemarks?.trim()) {
        showPopup("Please enter Spine Remarks for abnormal spine.", "error");
        return;
      }
    }

    // Parse BP
    let bpSys = null;
    let bpDia = null;
    if (vitals.bp && vitals.bp.includes("/")) {
      const parts = vitals.bp.split("/");
      bpSys = parts[0] ? parseInt(parts[0], 10) : null;
      bpDia = parts[1] ? parseInt(parts[1], 10) : null;
    }

    // Map spine findings
    let spineFindingsVal = null;
    if (airwayExam.spine) {
      if (airwayExam.spine === "Abnormal") {
        spineFindingsVal = airwayExam.spineRemarks?.trim()
          ? `Abnormal: ${airwayExam.spineRemarks.trim()}`
          : "Abnormal";
      } else {
        spineFindingsVal = airwayExam.spine;
      }
    }

    // Map selected instructions to array of strings
    const instructionsStrings = instructionsList
      .filter((item) => selectedInstructions.includes(item.anaesthesiaInstructionId))
      .map((item) => item.instruction)
      .filter(Boolean);

    // Filter valid medical history
    const validMedicalHistory = medicalHistory
      .filter((m) => m.diseaseName && m.diseaseName.trim())
      .map((m) => ({
        diseaseName: m.diseaseName.trim(),
        duration: m.duration ? m.duration.trim() : "",
      }));

    const requestPayload = {
      otBookingId: Number(otBookingId),
      submissionStatus: submissionStatus,
      ...(existingAssessmentId ? { pacAssessmentId: Number(existingAssessmentId) } : {}),
      currentMedications: currentMedications?.trim() || "None",
      allergyStatus: allergyStatus || "NONE",
      previousAnaesthesia: previousAnaesthesia || "N",
      weightKg: vitals.weight ? parseFloat(vitals.weight) : null,
      bpSystolic: bpSys,
      bpDiastolic: bpDia,
      pulse: vitals.pulse ? parseInt(vitals.pulse, 10) : null,
      respiratoryRate: vitals.rr ? parseInt(vitals.rr, 10) : null,
      spo2: vitals.spo2 ? parseFloat(vitals.spo2) : null,
      temperature: vitals.temperature ? parseFloat(vitals.temperature) : null,
      pallor: generalExam.pallor || "N",
      icterus: generalExam.icterus || "N",
      cyanosis: generalExam.cyanosis || "N",
      koilonychia: generalExam.koilonychia || "N",
      oedema: generalExam.oedema || "N",
      lymphadenopathy: generalExam.lymphadenopathy || "N",
      mallampatiClass: airwayExam.mallampatiClass || null,
      thyromentalDistanceCm: airwayExam.thyromentalDistance
        ? parseFloat(airwayExam.thyromentalDistance)
        : null,
      mouthOpeningCm: airwayExam.mouthOpening
        ? parseFloat(airwayExam.mouthOpening)
        : null,
      tmjFindings: airwayExam.tmj || null,
      teethDentures: airwayExam.teethDentures?.trim() || null,
      neckMovement: airwayExam.neckMovement || null,
      ivAccess: airwayExam.ivAccess?.trim() || null,
      spineFindings: spineFindingsVal,
      cvsFindings: systemicExam.cvs?.trim() || null,
      rsFindings: systemicExam.rs?.trim() || null,
      cnsFindings: systemicExam.cns?.trim() || null,
      abdomenFindings: systemicExam.abdomen?.trim() || null,
      asaGradeId: selectedAsaGrade ? Number(selectedAsaGrade) : null,
      asaEmergency: asaEmergency || "N",
      anaesthesiaTypeId: plannedAnaesthesia ? Number(plannedAnaesthesia) : null,
      specialistReferralRequired: specialistReferralRequired || "N",
      clearanceStatus: clearanceStatus || "P",
      pacRemarks: pacRemarks?.trim() || "",
      medicalHistory: validMedicalHistory,
      instructions: instructionsStrings,
    };

    const formData = new FormData();
    formData.append(
      "request",
      new Blob([JSON.stringify(requestPayload)], { type: "application/json" })
    );

    if (scannedPacFile) {
      formData.append("files", scannedPacFile);
      formData.append(
        "documentNames",
        documentName?.trim() || scannedPacFile.name || "Scanned PAC Copy"
      );
    }

    try {
      setIsSubmittingAssessment(true);
      setAssessmentSubmittingType(submissionStatus);

      const res = await postRequest(PAC_ASSESSMENT, formData, { isMultipart: true });

      const successMsg =
        submissionStatus === "D"
          ? SAVE_PAC_DRAFT_SUCCESS
          : SAVE_PAC_ASSESSMENT_SUCCESS;

      showPopup(res?.message || successMsg, "success", () => {
        setEditPACClearance(false);
        setSelectedRecord(null);
        resetAllFormStates();
        fetchPacPendingList(
          currentPage - 1,
          appliedFilters.search,
          appliedFilters.type
        );
      });
    } catch (error) {
      console.error("Error saving PAC assessment:", error);
      showPopup(
        error?.message ||
          error?.response?.message ||
          SAVE_PAC_ASSESSMENT_ERROR,
        "error"
      );
    } finally {
      setIsSubmittingAssessment(false);
      setAssessmentSubmittingType("");
    }
  };

  // ----- Fetch PAC Pending List -----
  const fetchPacPendingList = async (
    page = 0,
    search = appliedFilters.search,
    type = appliedFilters.type
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: type || "All",
        page: page,
        size: DEFAULT_ITEMS_PER_PAGE,
      });

      if (search && search.trim()) {
        params.append("search", search.trim());
      }

      const res = await getRequest(`${PAC_PENDING_LIST}?${params.toString()}`);

      if (res?.response?.content) {
        const normalized = res.response.content.map((item, idx) => {
          let surgeryString = "-";
          if (Array.isArray(item.surgeries) && item.surgeries.length > 0) {
            surgeryString =
              item.surgeries.map((s) => s.surgeryName).filter(Boolean).join(", ") || "-";
          } else if (typeof item.surgeries === "string" && item.surgeries.trim()) {
            surgeryString = item.surgeries.trim();
          } else if (item.surgeryName || item.surgery) {
            surgeryString = item.surgeryName || item.surgery;
          }

          const wardBed =
            item.wardName && item.bedNumber
              ? `${item.wardName} / ${item.bedNumber}`
              : item.wardName || item.bedNumber || null;

          const uhidOrIp =
            item.patientType === "IPD"
              ? item.ipNo || item.uhidNo || "-"
              : item.uhidNo || item.ipNo || "-";

          return {
            ...item,
            id: item.otBookingId ?? item.id ?? page * DEFAULT_ITEMS_PER_PAGE + idx + 1,
            uhidOrIp,
            patientName: item.patientName || "-",
            type: item.patientType || "-",
            department: item.departmentName || "-",
            surgery: surgeryString,
            surgeon: item.primarySurgeonName || item.surgeonName || "-",
            ot: item.otName || "-",
            scheduledDateTime: formatScheduledDateTime(item),
            wardBed,
          };
        });

        setData(normalized);
        setTotalPages(res.response.totalPages || 0);
        setTotalItems(res.response.totalElements || 0);
      } else {
        setData([]);
        setTotalPages(0);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching PAC pending list:", error);
      showPopup("Failed to fetch PAC pending list.", "error");
      setData([]);
      setTotalPages(0);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  // ----- Fetch Anaesthesia Instructions (PRE only) -----
  const fetchInstructions = async () => {
    try {
      setLoadingInstructions(true);
      const res = await getRequest(`${MAS_ANAESTHESIA_INSTRUCTION}/getAll/1`);
      if (res?.response && Array.isArray(res.response)) {
        const preOnly = res.response.filter(
          (item) =>
            (item.status === "Y" || !item.status) &&
            (item.instructionType || "").toUpperCase() === "PRE"
        );
        setInstructionsList(preOnly);
      } else {
        setInstructionsList([]);
      }
    } catch (err) {
      console.error("Error fetching anaesthesia instructions:", err);
      setInstructionsList([]);
    } finally {
      setLoadingInstructions(false);
    }
  };

  // ----- Fetch Anaesthesia Types -----
  const fetchAnaesthesiaTypes = async () => {
    try {
      setLoadingAnaesthesiaTypes(true);
      const res = await getRequest(`${MAS_ANAESTHESIA_TYPE}/getAll/1`);
      if (res?.response && Array.isArray(res.response)) {
        const activeTypes = res.response.filter(
          (item) => item.status === "Y" || !item.status
        );
        setAnaesthesiaTypes(activeTypes);
      } else {
        setAnaesthesiaTypes([]);
      }
    } catch (err) {
      console.error("Error fetching anaesthesia types:", err);
      setAnaesthesiaTypes([]);
    } finally {
      setLoadingAnaesthesiaTypes(false);
    }
  };

  // ----- Fetch ASA Grades -----
  const fetchAsaGrades = async () => {
    try {
      setLoadingAsaGrades(true);
      const res = await getRequest(`${MAS_ASA_GRADE}/getAll/1?page=0&size=10`);
      const items = Array.isArray(res?.response?.content)
        ? res.response.content
        : Array.isArray(res?.response)
          ? res.response
          : [];
      const activeGrades = items.filter(
        (item) => item.status === "Y" || !item.status
      );
      setAsaGrades(activeGrades);
    } catch (err) {
      console.error("Error fetching ASA grades:", err);
      setAsaGrades([]);
    } finally {
      setLoadingAsaGrades(false);
    }
  };

  // ----- Effects -----
  useEffect(() => {
    fetchPacPendingList(0, "", "All");
    fetchInstructions();
    fetchAnaesthesiaTypes();
    fetchAsaGrades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleInstruction = (id) => {
    setSelectedInstructions((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const handleAddCustomInstruction = () => {
    if (!newInstructionText.trim()) return;
    const customId = `custom-${Date.now()}`;
    const newInst = {
      anaesthesiaInstructionId: customId,
      instructionType: "PRE",
      instruction: newInstructionText.trim(),
      status: "Y",
    };
    setInstructionsList((prev) => [...prev, newInst]);
    setSelectedInstructions((prev) => [...prev, customId]);
    setNewInstructionText("");
    setShowAddInstructionInput(false);
  };

  // ----- Handlers -----
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchPacPendingList(page - 1, appliedFilters.search, appliedFilters.type);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    const newFilters = { search: searchQuery, type: typeFilter || "All" };
    setAppliedFilters(newFilters);
    fetchPacPendingList(0, searchQuery, typeFilter || "All");
  };

  const handleReset = () => {
    setSearchQuery("");
    setTypeFilter("All");
    setCurrentPage(1);
    const resetFilters = { search: "", type: "All" };
    setAppliedFilters(resetFilters);
    fetchPacPendingList(0, "", "All");
  };

  const getCurrentDateTimeLabel = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  // ----- Open modal for Clear PAC -----
  const openClearModal = (record) => {
    setSelectedRecord(record);
    setClearRemarks("");
    setShowClearModal(true);
  };

  // ----- Close modal -----
  const closeClearModal = () => {
    setShowClearModal(false);
    setSelectedRecord(null);
    setClearRemarks("");
  };

  // ----- Confirm action (Clear PAC) -----
  // Marks is_pac_done = 'Y' on the backend equivalent - the record then
  // drops off this Pending List, same as the "patient automatically
  // disappears from the PAC Pending List" rule.
  const handleConfirmClear = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const updatedData = data.filter((item) => item.id !== selectedRecord.id);
      setData(updatedData);
      setIsProcessing(false);
      closeClearModal();
      showPopup("PAC cleared successfully!", "success");
    }, 500);
  };

  // ----- Popup helper -----
  const showPopup = (message, type, onCloseCallback = null) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
        if (onCloseCallback) onCloseCallback();
      },
    });
  };

  const selectedAsaGradeObj = asaGrades.find(
    (g) => String(g.gradeId) === String(selectedAsaGrade)
  );

  // ============================================================
  // PAC Assessment / Clearance
  // ============================================================

  if (editPACClearance) {
    return (
      <>
        <div className="content-wrapper">

          <div className="card form-card">
            <div className="card-header">
              <div className="d-flex align-items-center gap-1">
                <button className="btn-back" title="Back to PAC Pending List" onClick={() => { setEditPACClearance(false); setSelectedRecord(null); resetAllFormStates(); }}><i className="icofont-arrow-left"></i></button>
                <h4 className="card-title p-2 mb-0">PAC Assessment / Clearance</h4>
              </div>
            </div>

            <div className="card-body">
              {loadingAssessmentDetails && (
                <div className="alert alert-info py-2 d-flex align-items-center mb-3">
                  <span className="spinner-border spinner-border-sm me-2" />
                  <span>Loading existing PAC assessment details...</span>
                </div>
              )}

              {/* Patient & Surgery Details */}
              <div className="mb-2">

                <h4 className="fw-bold mb-2">Patient & Surgery Details</h4>
                <div className="row g-3 mb-4">

                  <div className="col-md-3">
                    <label className="form-label mb-1" htmlFor="PatientName">Patient Name</label>
                    <input type="text" id="PatientName" name="PatientName" className="form-control" value={selectedRecord?.patientName || "-"} readOnly />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label mb-1" htmlFor="ipdNo">IPD No.</label>
                    <input type="text" id="ipdNo" name="ipdNo" className="form-control" value={selectedRecord?.ipNo || "-"} readOnly />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label mb-1" htmlFor="uhidNo">UHID No.</label>
                    <input type="text" id="uhidNo" name="uhidNo" className="form-control" value={selectedRecord?.uhidNo || "-"} readOnly />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label mb-1" htmlFor="ageSex">Type / Dept</label>
                    <input type="text" id="ageSex" name="ageSex" className="form-control" value={selectedRecord ? `${selectedRecord.type || "-"} / ${selectedRecord.department || "-"}` : "-"} readOnly />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label mb-1" htmlFor="wardBed">Ward / Bed</label>
                    <input type="text" id="wardBed" name="wardBed" className="form-control" value={selectedRecord?.wardBed || "-"} readOnly />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label mb-1" htmlFor="surgeonName">Surgeon</label>
                    <input type="text" id="surgeonName" name="surgeonName" className="form-control" value={selectedRecord?.surgeon || "-"} readOnly />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label mb-1" htmlFor="surgeryId">Surgery</label>
                    <input type="text" id="surgeryId" name="surgeryId" className="form-control" value={selectedRecord?.surgery || "-"} readOnly />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label mb-1" htmlFor="OtId">OT</label>
                    <input type="text" id="OtId" name="OtId" className="form-control" value={selectedRecord?.ot || "-"} readOnly />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label mb-1" htmlFor="surgeryDate">Surgery Date</label>
                    <input type="text" id="surgeryDate" name="surgeryDate" className="form-control" value={selectedRecord?.scheduledDate || selectedRecord?.scheduledDateTime || "-"} readOnly />
                  </div>

                </div>

                <div className="card card-body mb-4">
                  <h4 className="fw-bold">Medical & Anaesthesia History</h4>

                  <div className="adviceWrapper">
                    <div className="cardProcedure">
                      {medicalHistory.map((item, index) => (
                        <div className="row g-3 mb-2 align-items-end" key={index}>
                          <div className="col-md-8">
                            {index === 0 && (
                              <label className="form-label fw-bold">Disease</label>
                            )}
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Disease"
                              value={item.diseaseName}
                              onChange={(e) =>
                                handleDiseaseChange(index, "diseaseName", e.target.value)
                              }
                            />
                          </div>

                          <div className="col-md-3">
                            {index === 0 && (
                              <label className="form-label fw-bold">Duration</label>
                            )}
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. 5 years"
                              value={item.duration}
                              onChange={(e) =>
                                handleDiseaseChange(index, "duration", e.target.value)
                              }
                            />
                          </div>

                          <div className="col-md-1">
                            {index === 0 && (
                              <label className="form-label fw-bold text-center d-block">
                                Action
                              </label>
                            )}
                            <div className="d-flex gap-1">
                              {index === medicalHistory.length - 1 && (
                                <button
                                  type="button"
                                  className="btn btn-primary btnAdd"
                                  title="Add Disease"
                                  onClick={handleAddDiseaseRow}
                                >
                                  <i className="icofont-plus"></i>
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btn-outline-danger btnDel"
                                title="Delete"
                                onClick={() => handleRemoveDiseaseRow(index)}
                              >
                                <i className="icofont-trash"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="row g-3 mb-2">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Current Medications</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Medication details from IPD chart / reconciliation notes (or None)"
                        value={currentMedications}
                        onChange={(e) => setCurrentMedications(e.target.value)}
                      ></textarea>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold">Allergy History</label>
                      <select
                        className="form-select"
                        value={allergyStatus}
                        onChange={(e) => setAllergyStatus(e.target.value)}
                      >
                        <option value="NONE">No Known Allergies</option>
                        <option value="KNOWN">Known Allergies</option>
                        <option value="NOT_ASSESSED">Not Assessed</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold">Previous Anaesthesia</label>
                      <select
                        className="form-select"
                        value={previousAnaesthesia}
                        onChange={(e) => setPreviousAnaesthesia(e.target.value)}
                      >
                        <option value="N">No</option>
                        <option value="Y">Yes</option>
                      </select>
                    </div>
                  </div>
                </div>


                <div className="card card-body mb-4">
                  <div className="">
                    <h4 className="fw-bold mb-3">Vitals & General Examination</h4>
                    <h6 className="text-muted fw-semibold mb-2">Vitals</h6>
                    <div className="row g-3 mb-4">
                      {/* Weight */}
                      <div className="col-md-2">
                        <label className="form-label">Weight (kg)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          className={`form-control ${vitalsErrors.weight ? "is-invalid" : ""}`}
                          placeholder="e.g. 65"
                          value={vitals.weight}
                          onChange={(e) => handleVitalChange("weight", e.target.value)}
                          onBlur={() => handleVitalBlur("weight")}
                        />
                        {vitalsErrors.weight && (
                          <div className="text-danger small mt-1" style={{ fontSize: "11px" }}>
                            {vitalsErrors.weight}
                          </div>
                        )}
                      </div>

                      {/* BP */}
                      <div className="col-md-2">
                        <label className="form-label">BP (mmHg)</label>
                        <input
                          type="text"
                          className={`form-control ${vitalsErrors.bp ? "is-invalid" : ""}`}
                          placeholder="e.g. 120/80"
                          value={vitals.bp}
                          onChange={(e) => handleVitalChange("bp", e.target.value)}
                          onBlur={() => handleVitalBlur("bp")}
                        />
                        {vitalsErrors.bp && (
                          <div className="text-danger small mt-1" style={{ fontSize: "11px" }}>
                            {vitalsErrors.bp}
                          </div>
                        )}
                      </div>

                      {/* Pulse */}
                      <div className="col-md-2">
                        <label className="form-label">Pulse (/min)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          className={`form-control ${vitalsErrors.pulse ? "is-invalid" : ""}`}
                          placeholder="e.g. 72"
                          value={vitals.pulse}
                          onChange={(e) => handleVitalChange("pulse", e.target.value)}
                          onBlur={() => handleVitalBlur("pulse")}
                        />
                        {vitalsErrors.pulse && (
                          <div className="text-danger small mt-1" style={{ fontSize: "11px" }}>
                            {vitalsErrors.pulse}
                          </div>
                        )}
                      </div>

                      {/* RR */}
                      <div className="col-md-2">
                        <label className="form-label">RR (/min)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          className={`form-control ${vitalsErrors.rr ? "is-invalid" : ""}`}
                          placeholder="e.g. 16"
                          value={vitals.rr}
                          onChange={(e) => handleVitalChange("rr", e.target.value)}
                          onBlur={() => handleVitalBlur("rr")}
                        />
                        {vitalsErrors.rr && (
                          <div className="text-danger small mt-1" style={{ fontSize: "11px" }}>
                            {vitalsErrors.rr}
                          </div>
                        )}
                      </div>

                      {/* SpO2 */}
                      <div className="col-md-2">
                        <label className="form-label">SpO2 (%)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          className={`form-control ${vitalsErrors.spo2 ? "is-invalid" : ""}`}
                          placeholder="e.g. 98"
                          value={vitals.spo2}
                          onChange={(e) => handleVitalChange("spo2", e.target.value)}
                          onBlur={() => handleVitalBlur("spo2")}
                        />
                        {vitalsErrors.spo2 && (
                          <div className="text-danger small mt-1" style={{ fontSize: "11px" }}>
                            {vitalsErrors.spo2}
                          </div>
                        )}
                      </div>

                      {/* Temperature */}
                      <div className="col-md-2">
                        <label className="form-label">Temperature (°C)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          className={`form-control ${vitalsErrors.temperature ? "is-invalid" : ""}`}
                          placeholder="e.g. 37.0"
                          value={vitals.temperature}
                          onChange={(e) => handleVitalChange("temperature", e.target.value)}
                          onBlur={() => handleVitalBlur("temperature")}
                        />
                        {vitalsErrors.temperature && (
                          <div className="text-danger small mt-1" style={{ fontSize: "11px" }}>
                            {vitalsErrors.temperature}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="">
                    <h5 className="fw-bold mb-2">General Examination</h5>
                    <div className="row g-3 mb-2">
                      <div className="col-md-2">
                        <label className="form-label">Pallor</label>
                        <select
                          className="form-select"
                          value={generalExam.pallor}
                          onChange={(e) => handleGeneralExamChange("pallor", e.target.value)}
                        >
                          <option value="N">No</option>
                          <option value="Y">Yes</option>
                        </select>
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">Icterus</label>
                        <select
                          className="form-select"
                          value={generalExam.icterus}
                          onChange={(e) => handleGeneralExamChange("icterus", e.target.value)}
                        >
                          <option value="N">No</option>
                          <option value="Y">Yes</option>
                        </select>
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">Cyanosis</label>
                        <select
                          className="form-select"
                          value={generalExam.cyanosis}
                          onChange={(e) => handleGeneralExamChange("cyanosis", e.target.value)}
                        >
                          <option value="N">No</option>
                          <option value="Y">Yes</option>
                        </select>
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">Koilonychia</label>
                        <select
                          className="form-select"
                          value={generalExam.koilonychia}
                          onChange={(e) => handleGeneralExamChange("koilonychia", e.target.value)}
                        >
                          <option value="N">No</option>
                          <option value="Y">Yes</option>
                        </select>
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">Oedema</label>
                        <select
                          className="form-select"
                          value={generalExam.oedema}
                          onChange={(e) => handleGeneralExamChange("oedema", e.target.value)}
                        >
                          <option value="N">No</option>
                          <option value="Y">Yes</option>
                        </select>
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">Lymphadenopathy</label>
                        <select
                          className="form-select"
                          value={generalExam.lymphadenopathy}
                          onChange={(e) => handleGeneralExamChange("lymphadenopathy", e.target.value)}
                        >
                          <option value="N">No</option>
                          <option value="Y">Yes</option>
                        </select>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="card card-body mb-4">
                  <div className="">
                    <h4 className="fw-bold mb-3">Airway & Systemic Examination</h4>
                    <h6 className="text-muted fw-semibold mb-2">Airway Examination</h6>
                    <div className="row g-3 mb-4">
                      {/* Mallampati Class (MPC) */}
                      <div className="col-md-3">
                        <label className="form-label">Mallampati Class (MPC)</label>
                        <select
                          className="form-select"
                          value={airwayExam.mallampatiClass}
                          onChange={(e) => handleAirwayChange("mallampatiClass", e.target.value)}
                        >
                          <option value="">Select Class</option>
                          <option value="I">I</option>
                          <option value="II">II</option>
                          <option value="III">III</option>
                          <option value="IV">IV</option>
                        </select>
                      </div>

                      {/* Thyromental Distance (TMD) */}
                      <div className="col-md-3">
                        <label className="form-label">Thyromental Distance (TMD)</label>
                        <div className="input-group">
                          <input
                            type="text"
                            inputMode="decimal"
                            className="form-control"
                            placeholder="e.g. 7"
                            value={airwayExam.thyromentalDistance}
                            onChange={(e) => handleNumericChange("thyromentalDistance", e.target.value)}
                          />
                          <span className="input-group-text">cm</span>
                        </div>
                      </div>

                      {/* Mouth Opening */}
                      <div className="col-md-3">
                        <label className="form-label">Mouth Opening</label>
                        <div className="input-group">
                          <input
                            type="text"
                            inputMode="decimal"
                            className="form-control"
                            placeholder="e.g. 4"
                            value={airwayExam.mouthOpening}
                            onChange={(e) => handleNumericChange("mouthOpening", e.target.value)}
                          />
                          <span className="input-group-text">cm</span>
                        </div>
                      </div>

                      {/* TM / TMJ */}
                      <div className="col-md-3">
                        <label className="form-label">TM / TMJ</label>
                        <select
                          className="form-select"
                          value={airwayExam.tmj}
                          onChange={(e) => handleAirwayChange("tmj", e.target.value)}
                        >
                          <option value="">Select TM</option>
                          <option value="Normal">Normal</option>
                          <option value="Restricted">Restricted</option>
                          <option value="Abnormal">Abnormal</option>
                        </select>
                      </div>

                      {/* Teeth / Dentures */}
                      <div className="col-md-3">
                        <label className="form-label">Teeth / Dentures</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Natural teeth, no loose teeth"
                          value={airwayExam.teethDentures}
                          onChange={(e) => handleAirwayChange("teethDentures", e.target.value)}
                        />
                      </div>

                      {/* Neck Movement */}
                      <div className="col-md-3">
                        <label className="form-label">Neck Movement</label>
                        <select
                          className="form-select"
                          value={airwayExam.neckMovement}
                          onChange={(e) => handleAirwayChange("neckMovement", e.target.value)}
                        >
                          <option value="">Select Neck Movement</option>
                          <option value="Normal">Normal</option>
                          <option value="Restricted">Restricted</option>
                        </select>
                      </div>

                      {/* IV Access */}
                      <div className="col-md-3">
                        <label className="form-label">IV Access</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Peripheral IV access available"
                          value={airwayExam.ivAccess}
                          onChange={(e) => handleAirwayChange("ivAccess", e.target.value)}
                        />
                      </div>

                      {/* Spine */}
                      <div className="col-md-3">
                        <label className="form-label">Spine</label>
                        <select
                          className="form-select"
                          value={airwayExam.spine}
                          onChange={(e) => handleAirwayChange("spine", e.target.value)}
                        >
                          <option value="">Select Spine</option>
                          <option value="Normal">Normal</option>
                          <option value="Abnormal">Abnormal</option>
                        </select>
                      </div>

                      {/* Spine remarks if Abnormal */}
                      {airwayExam.spine === "Abnormal" && (
                        <div className="col-md-12">
                          <label className="form-label">
                            Spine Remarks <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter spine abnormality / deformity remarks"
                            value={airwayExam.spineRemarks}
                            onChange={(e) => handleAirwayChange("spineRemarks", e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="">
                    <h5 className="fw-bold">Systemic Examination</h5>
                    <div className="row g-3 mb-2">
                      <div className="col-md-6">
                        <label className="form-label fw-bold">CVS</label>
                        <textarea
                          className="form-control"
                          rows="4"
                          placeholder="Clinical findings (e.g. S1, S2 heard; no murmur)"
                          value={systemicExam.cvs}
                          onChange={(e) => handleSystemicChange("cvs", e.target.value)}
                        ></textarea>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold">RS</label>
                        <textarea
                          className="form-control"
                          rows="4"
                          placeholder="Clinical findings (e.g. Bilateral air entry equal; no added sounds)"
                          value={systemicExam.rs}
                          onChange={(e) => handleSystemicChange("rs", e.target.value)}
                        ></textarea>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold">CNS</label>
                        <textarea
                          className="form-control"
                          rows="4"
                          placeholder="Clinical findings (e.g. Conscious, oriented; no focal deficit)"
                          value={systemicExam.cns}
                          onChange={(e) => handleSystemicChange("cns", e.target.value)}
                        ></textarea>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold">Abdomen</label>
                        <textarea
                          className="form-control"
                          rows="4"
                          placeholder="Clinical findings (e.g. Soft, non-tender; no organomegaly)"
                          value={systemicExam.abdomen}
                          onChange={(e) => handleSystemicChange("abdomen", e.target.value)}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card card-body mb-4">
                  <h4 className="fw-bold">Previous Investigations / Review</h4>

                  {/* Tabs beginning here ------ */}
                  <div className="tabs-container">
                    <div className="tabs-header">
                      {tabs.map((tab) => (
                        <button key={tab.id} className={`tab-button ${activeTab === tab.id ? "active" : ""}`} onClick={() => setActiveTab(tab.id)}>
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {activeTab === "lab" && <div className="tab-content">
                      <div className="row g-3 mb-4">
                        <div className="col-md-12">
                          <label className="form-label fw-bold">Previous LAB Investigations</label>
                          <textarea className="form-control" rows="6" readOnly defaultValue="Show investigation, result, date, abnormal flag and report preview."></textarea>
                        </div>
                      </div>
                      <div className="row g-3 mb-3">
                        <div className="col-md-12">
                          <label className="form-label fw-bold">Investigation Review Status</label>
                          <label className="radioLabel">
                            <input type="radio" name="reviewStatusType" value="Reviewed" />
                            <span>Reviewed</span>
                          </label>
                          <label className="radioLabel mt-2">
                            <input type="radio" name="reviewStatusType" value="Additional Investigation Required" />
                            <span>Additional Investigation Required</span>
                          </label>
                          <label className="radioLabel mt-2">
                            <input type="radio" name="reviewStatusType" value="Not Indicated" />
                            <span>Not Indicated</span>
                          </label>
                        </div>
                      </div>

                      <div className="row g-3 mb-1">
                        <div className="col-md-12">
                          <label className="form-label fw-bold">Investigation Findings / Additional Tests</label>
                          <textarea className="form-control" rows="6" placeholder="" defaultValue="ECG, Echo, Chest X-Ray, laboratory findings or further tests"></textarea>
                        </div>
                      </div>

                    </div>
                    }

                    {activeTab === "radiology" && <div className="tab-content">
                      <h4 className="fw-bold">Radiology Data here...</h4>
                    </div>
                    }

                    {activeTab === "previous" && <div className="tab-content">
                      <h4 className="fw-bold">Previous Visits Data here.....</h4>
                    </div>
                    }

                  </div>
                  {/* Tabs end here---- */}

                </div>

                <div className="card card-body mb-4">
                  <div className="">
                    <h4 className="fw-bold">Anaesthesia Plan</h4>
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <div className="infoStatus mb-1">
                          <label className="form-label mb-0">
                            ASA Physical Status <span className="text-danger">*</span>
                          </label>
                          <Link
                            to="#"
                            onClick={(e) => e.preventDefault()}
                            title={
                              selectedAsaGradeObj
                                ? `${selectedAsaGradeObj.gradeName}: ${selectedAsaGradeObj.description}`
                                : "American Society of Anesthesiologists (ASA) Physical Status"
                            }
                          >
                            <i className="icofont-info"></i>
                          </Link>
                        </div>
                        <select
                          className="form-select"
                          value={selectedAsaGrade}
                          onChange={(e) => setSelectedAsaGrade(e.target.value)}
                          disabled={loadingAsaGrades}
                        >
                          <option value="">
                            {loadingAsaGrades
                              ? "Loading ASA grades..."
                              : "Select ASA Grade"}
                          </option>
                          {asaGrades.map((grade) => (
                            <option
                              key={grade.gradeId}
                              value={grade.gradeId}
                              title={grade.description || ""}
                            >
                              {grade.gradeName}
                              {grade.description ? ` - ${grade.description}` : ""}
                            </option>
                          ))}
                        </select>
                        <div className="form-check mt-2">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="asaEmergencyCheck"
                            checked={asaEmergency === "Y"}
                            onChange={(e) => setAsaEmergency(e.target.checked ? "Y" : "N")}
                          />
                          <label className="form-check-label small" htmlFor="asaEmergencyCheck">
                            Emergency Procedure (Modifier 'E')
                          </label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">
                          Planned Anaesthesia <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          value={plannedAnaesthesia}
                          onChange={(e) => setPlannedAnaesthesia(e.target.value)}
                          disabled={loadingAnaesthesiaTypes}
                        >
                          <option value="">
                            {loadingAnaesthesiaTypes
                              ? "Loading anaesthesia types..."
                              : "Select Planned Anaesthesia"}
                          </option>
                          {anaesthesiaTypes.map((item) => (
                            <option
                              key={item.anaesthesiaTypeId}
                              value={item.anaesthesiaTypeId}
                            >
                              {item.anaesthesiaTypeName}
                              {item.anaesthesiaTypeCode
                                ? ` (${item.anaesthesiaTypeCode})`
                                : ""}
                            </option>
                          ))}
                        </select>
                        <div className="form-check mt-2">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="specialistReferralCheck"
                            checked={specialistReferralRequired === "Y"}
                            onChange={(e) =>
                              setSpecialistReferralRequired(e.target.checked ? "Y" : "N")
                            }
                          />
                          <label className="form-check-label small" htmlFor="specialistReferralCheck">
                            Specialist Referral Required
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="">
                    <h5 className="fw-bold mb-2">Pre-Anaesthesia Instructions</h5>

                    {loadingInstructions ? (
                      <div className="py-3 text-muted">
                        <span className="spinner-border spinner-border-sm me-2" />
                        Loading instructions...
                      </div>
                    ) : (
                      <div className="mb-3">
                        {instructionsList.map((item) => {
                          const isChecked = selectedInstructions.includes(
                            item.anaesthesiaInstructionId
                          );
                          return (
                            <label
                              key={item.anaesthesiaInstructionId}
                              className="radioLabel mt-2"
                              style={{ cursor: "pointer" }}
                            >
                              <input
                                type="checkbox"
                                className="form-check-input mt-0"
                                checked={isChecked}
                                onChange={() =>
                                  handleToggleInstruction(
                                    item.anaesthesiaInstructionId
                                  )
                                }
                              />
                              <span>{item.instruction}</span>
                            </label>
                          );
                        })}

                        {instructionsList.length === 0 && (
                          <div className="text-muted small py-2">
                            No pre-anaesthesia instructions found.
                          </div>
                        )}
                      </div>
                    )}

                    {showAddInstructionInput ? (
                      <div
                        className="d-flex gap-2 align-items-center mt-2"
                        style={{ maxWidth: "550px" }}
                      >
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Enter custom pre-anaesthesia instruction..."
                          value={newInstructionText}
                          onChange={(e) => setNewInstructionText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomInstruction();
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={handleAddCustomInstruction}
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            setShowAddInstructionInput(false);
                            setNewInstructionText("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary addBtn"
                        onClick={() => setShowAddInstructionInput(true)}
                      >
                        <i className="icofont-plus me-1"></i>
                        <span>Add Instruction</span>
                      </button>
                    )}
                  </div>

                </div>


                <div className="card card-body mb-4">
                  <h4 className="fw-bold">Supporting Documents / Scanned PAC Copy</h4>
                  {existingDocuments && existingDocuments.length > 0 && (
                    <div className="mb-3">
                      <label className="form-label fw-bold d-block text-muted">Previously Uploaded Documents</label>
                      <div className="d-flex flex-wrap gap-2">
                        {existingDocuments.map((doc, idx) => (
                          <div
                            key={doc.pacDocumentId || idx}
                            className="d-flex align-items-center gap-2 p-2 border rounded bg-light"
                          >
                            <i
                              className={
                                doc.mimeType?.includes("pdf") || doc.fileName?.toLowerCase().endsWith(".pdf")
                                  ? "icofont-file-document fs-5 text-danger"
                                  : "icofont-image fs-5 text-primary"
                              }
                            ></i>
                            <div>
                              <div className="fw-semibold small">{doc.documentName || doc.fileName}</div>
                              <div className="text-muted" style={{ fontSize: "11px" }}>
                                {doc.fileName} {doc.fileSize ? `(${(doc.fileSize / 1024).toFixed(1)} KB)` : ""}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="row mb-1">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Document Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter document name"
                        value={documentName}
                        onChange={(e) => setDocumentName(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Upload Document (PDF / Image)</label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="form-control"
                        accept="application/pdf,image/png,image/jpeg,image/jpg"
                        onChange={handleFileChange}
                      />
                      <small className="text-muted d-block mt-1">
                        Allowed file types: PDF, JPG, PNG, JPEG.
                      </small>
                      {scannedPacFile && (
                        <div className="d-flex align-items-center gap-2 mt-2 p-2 border rounded bg-light">
                          <i
                            className={
                              scannedPacFile.type === "application/pdf" ||
                              scannedPacFile.name.toLowerCase().endsWith(".pdf")
                                ? "icofont-file-document fs-5 text-danger"
                                : "icofont-image fs-5 text-primary"
                            }
                          ></i>
                          <span className="small text-truncate" style={{ maxWidth: "250px" }}>
                            {scannedPacFile.name} ({(scannedPacFile.size / 1024).toFixed(1)} KB)
                          </span>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger ms-auto py-0 px-1"
                            title="Remove file"
                            onClick={handleRemoveFile}
                          >
                            <i className="icofont-close"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="card card-body mb-3">
                  <h4 className="fw-bold">PAC Clearance</h4>
                  <div className="row g-3 mb-3">
                    <div className="col-md-12">
                      <label className="form-label fw-bold">
                        Clearance Status <span className="text-danger">*</span>
                      </label>
                      <div className="radio-options d-flex gap-4">
                        <label className="radioLabel">
                          <input
                            type="radio"
                            name="pacClearanceType"
                            value="C"
                            checked={clearanceStatus === "C"}
                            onChange={() => setClearanceStatus("C")}
                          />
                          <span className="ms-1">Cleared</span>
                        </label>
                        <label className="radioLabel">
                          <input
                            type="radio"
                            name="pacClearanceType"
                            value="P"
                            checked={clearanceStatus === "P"}
                            onChange={() => setClearanceStatus("P")}
                          />
                          <span className="ms-1">Pending</span>
                        </label>
                        <label className="radioLabel">
                          <input
                            type="radio"
                            name="pacClearanceType"
                            value="N"
                            checked={clearanceStatus === "N"}
                            onChange={() => setClearanceStatus("N")}
                          />
                          <span className="ms-1">Not Cleared</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="row mb-1">
                    <div className="col-md-12">
                      <label className="form-label fw-bold">PAC Remarks</label>
                      <textarea
                        className="form-control"
                        rows="4"
                        placeholder="Enter PAC remarks"
                        value={pacRemarks}
                        onChange={(e) => setPacRemarks(e.target.value)}
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center">
                  <div className="">
                    <button
                      className="btn btnOutline"
                      onClick={() => {
                        setEditPACClearance(false);
                        setSelectedRecord(null);
                        resetAllFormStates();
                      }}
                      disabled={isSubmittingAssessment}
                    >
                      <i className="icofont-arrow-left"></i> <span>Back</span>
                    </button>
                  </div>
                  <div className="d-flex align-items-center">
                    <button
                      type="button"
                      className="btn btn-secondary me-3"
                      disabled={isSubmittingAssessment}
                      onClick={() => handleSubmitPACAssessment("D")}
                    >
                      {isSubmittingAssessment && assessmentSubmittingType === "D" ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Saving Draft...
                        </>
                      ) : (
                        "Save Draft"
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary me-3"
                      disabled={isSubmittingAssessment}
                      onClick={() => handleSubmitPACAssessment("S")}
                    >
                      {isSubmittingAssessment && assessmentSubmittingType === "S" ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Saving PAC Assessment...
                        </>
                      ) : (
                        "Save PAC Assessment"
                      )}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

        {popupMessage && (
          <Popup
            message={popupMessage.message}
            type={popupMessage.type}
            onClose={popupMessage.onClose}
          />
        )}
      </>
    );
  }



  // ============================================================
  // RENDER: MAIN LIST VIEW
  // ============================================================
  return (
    <div className="content-wrapper">
      {loading && <LoadingScreen />}
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">PAC Pending List</h4>
            </div>

            <div className="card-body">
              {/* Search / Filter Section */}
              <div className="mb-4">
                <div className="row g-3 align-items-end">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Search</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="UHID/IP No., Patient, Surgery or Surgeon"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSearch();
                        }
                      }}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label fw-bold">Type</label>
                    <select
                      className="form-select"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    >
                      <option value="All">All</option>
                      <option value="OPD">OPD</option>
                      <option value="IPD">IPD</option>
                    </select>
                  </div>
                  <div className="col-md-3 d-flex gap-2">
                    <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
                      <i className="fa fa-search me-1"></i> Search
                    </button>
                    <button className="btn btn-secondary" onClick={handleReset} disabled={loading}>
                      <i className="fa fa-refresh me-1"></i> Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>UHID / IP No.</th>
                      <th>Patient Name</th>
                      <th>Type</th>
                      <th>Department</th>
                      <th>Surgery</th>
                      <th>Surgeon</th>
                      <th>OT</th>
                      <th>Scheduled Date / Time</th>
                      <th>Ward / Bed</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.length > 0 ? (
                      data.map((item) => (
                        <tr key={item.id}>
                          <td>{item.uhidOrIp}</td>
                          <td>{item.patientName}</td>
                          <td>{item.type}</td>
                          <td>{item.department}</td>
                          <td>{item.surgery}</td>
                          <td>{item.surgeon}</td>
                          <td>{item.ot}</td>
                          <td>{item.scheduledDateTime}</td>
                          <td>{item.wardBed || "—"}</td>
                          <td className="text-center">
                            <div className="btnCenter">
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => openClearModal(item)}
                                title="Clear PAC"
                              >
                                Clear PAC
                              </button>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleOpenAssessment(item)}
                              >
                                PAC Assessment
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10" className="text-center py-4 text-muted">
                          <i className="fa fa-info-circle me-1"></i> No patients pending PAC clearance.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalItems > 0 && (
                <Pagination
                  totalItems={totalItems}
                  itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                  totalPages={totalPages}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== CLEAR PAC MODAL ===== */}
      {showClearModal && selectedRecord && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Clear PAC</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeClearModal}
                  disabled={isProcessing}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>Patient:</strong> {selectedRecord.patientName} ({selectedRecord.uhidOrIp})
                  {selectedRecord.type}
                </p>
                <p>
                  <strong>Department:</strong> {selectedRecord.department}
                </p>
                <p>
                  <strong>Surgery:</strong> {selectedRecord.surgery}
                </p>
                <p>
                  <strong>Surgeon:</strong> {selectedRecord.surgeon}
                </p>
                <p>
                  <strong>OT:</strong> {selectedRecord.ot}
                </p>
                <p>
                  <strong>Scheduled Date/Time:</strong> {selectedRecord.scheduledDateTime}
                </p>
                {selectedRecord.wardBed && (
                  <p>
                    <strong>Ward / Bed:</strong> {selectedRecord.wardBed}
                  </p>
                )}

                <div className="mb-3">
                  <label className="form-label fw-bold">Remarks (Optional)</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={clearRemarks}
                    onChange={(e) => setClearRemarks(e.target.value)}
                    placeholder="Any additional notes..."
                    disabled={isProcessing}
                  />
                </div>

                <div className="row">
                  <div className="col-md-6 mb-2">
                    <label className="form-label fw-bold small mb-1">Cleared By</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={getLoggedInUserName()}
                      readOnly
                      style={{ backgroundColor: "#e9ecef" }}
                    />
                  </div>
                  <div className="col-md-6 mb-2">
                    <label className="form-label fw-bold small mb-1">Date / Time</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={`${getCurrentDateTimeLabel()} (Auto)`}
                      readOnly
                      style={{ backgroundColor: "#e9ecef" }}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeClearModal}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleConfirmClear}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Processing...
                    </>
                  ) : (
                    "Confirm"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {popupMessage && (
        <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
      )}
    </div>
  );
};

export default PACClearance;