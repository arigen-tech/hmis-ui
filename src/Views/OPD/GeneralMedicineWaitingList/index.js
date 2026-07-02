import { useState, useEffect, useRef } from "react";
import placeholderImage from "../../../assets/images/placeholder.jpg";
import OTDashboard from "./OTDashboard";
import InvestigationModal from "./InvestigationModal";
import TreatmentModal from "./TreatmentModal";
import ClinicalHistoryPopup from "./ClinicalHistoryPopup";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import OBGDetails from "../OBGDetails";
import EarExamination from "../EarExamination";
import GynaMaster from "../GynaMaster";
import Dental from "../Dental";
import Psychiatrist from "../Psychiatrist";

import {
  OPD_TEMPLATE,
  OPD_TEMPLATE_GET_ALL,
  MAS_INVESTIGATION,
  MAS_INVESTIGATION_UNIQUE_TYPES,
  OPD_PATIENT,
  MAS_DRUG_MAS,
  DRUG_TYPE,
  MAS_OPD_SESSION,
  MAS_OPD_SESSION_GET_ALL,
  DOCTOR,
  DOCTOR_BY_DEPARTMENT,
  MASTERS,
  MAS_FREQUENCY,
  MAS_FREQUENCY_GET_ALL,
  GET_WAITING_LIST,
  MAS_WARD_CATEGORY_GET_ALL,
  WARD_DEPARTMENT_GET_ALL_BY_CATEGORY,
  PATIENT_ACTIVE_VISIT_SEARCH,
  PATIENT_UPDATE_STATUS,
  PATIENT_OPD_BY_VISIT,
  OPD_TEMPLATE_GET_ALL_INVESTIGATIONS_TEMPLATES,
  OPD_CREATE_PATIENT_DETAILS,
  OPTH_MAS_DISTANCE_VISION,
  OPTH_MAS_NEAR_VISION,
  OPHTHALMOLOGY_DEPARTMENT_ID,
  GET_PREVIOUS_OPD_VISIT_HISTORY,
  GET_PATIENT_PRESCRIPTION_DETAILS,
  MAS_BED_COUNT,
  ALL_REPORTS,
  GET_PREVIOUS_OPD_VITALS_DETAILS_HISTORY,
  GET_ALL_DRUGS_BY_SECTION,
  OBG_DEPARTMENT_ID,
  ENT_DEPARTMENT_ID,
  DENTAL_DEPARTMENT_ID,
  MAS_WARD_GET_BY_ID,
  MAS_WARDS_GET_BY_ID,
} from "../../../config/apiConfig";
import {
  getRequest,
  putRequest,
  postRequest,
} from "../../../service/apiService";
import LoadingScreen from "../../../Components/Loading/index";
import Popup from "../../../Components/popup";
import DuplicatePopup from "../GeneralMedicineWaitingList/DuplicatePopup";
import MasFamilyModel from "./FamilyHistryModel";
import Pagination, {
  DEFAULT_ITEMS_PER_PAGE,
} from "../../../Components/Pagination";
import OpdVision from "../OpdVision";
import { FLAG } from "../../../config/constants";
import { data } from "react-router-dom";
import PregnancySection from "../Pregnancy";

const INDENT_SAVE_TITLE = "OPD Case Sheet";
const INDENT_SAVE_FILE_NAME = "OPD_case_sheet.pdf";

const GeneralMedicineWaitingList = () => {
  const [waitingList, setWaitingList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [doctorData, setDoctorData] = useState([]);
  const [sessionData, setSessionData] = useState([]);
  const [opdVitalsData, setOpdVitalsData] = useState([]);
  const [duplicateItems, setDuplicateItems] = useState([]);
  const [showDuplicatePopup, setShowDuplicatePopup] = useState(false);
  const [vitalsAvailable, setVitalsAvailable] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [selectedTreatmentTemplateIds, setSelectedTreatmentTemplateIds] =
    useState(new Set());
  const [opdTemplateData, setOpdTemplateData] = useState([]);
  const [selectedTreatmentTemplateId, setSelectedTreatmentTemplateId] =
    useState("Select..");
  const tableContainerRef = useRef(null);
  const [activeDrugNameDropdown, setActiveDrugNameDropdown] = useState(null);
  const drugNameDropdownClickedRef = useRef(false);
  const [allFrequencies, setAllFrequencies] = useState([]);
  const initialDataLoadedRef = useRef(false);
  const opdTemplateLoadedRef = useRef(false);
  const frequencyLoadedRef = useRef(false);
  const wardCategoryLoadedRef = useRef(false);
  const investigationTypeLoadedRef = useRef(false);
  const distanceVisionLoadedRef = useRef(false);
  const nearVisionLoadedRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [icdDropdown, setIcdDropdown] = useState([]);
  const [page, setPage] = useState(0);
  const [lastPage, setLastPage] = useState(false);
  const [search, setSearch] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showModelPopup, setModelShowPopup] = useState(false);
  const [popupType, setPopupType] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const dropdownRef = useRef(null);
  const [doctorRemarksText, setDoctorRemarksText] = useState("");
  const [labFlag, setLabFlag] = useState("");
  const [radioFlag, setRadioFlag] = useState("");

  const [drugDropdown, setDrugDropdown] = useState([]);
  const [drugSearch, setDrugSearch] = useState([]);
  const [drugPage, setDrugPage] = useState(0);
  const [drugLastPage, setDrugLastPage] = useState(true);
  const [activeDrugDropdown, setActiveDrugDropdown] = useState(null);
  const drugDebounceRef = useRef([]);
  const drugDropdownRef = useRef(null);
  const visionRef = useRef();
  const earExaminationRef = useRef();
  const pregnancyRef = useRef();
  const departmentName =
    localStorage.getItem("departmentName") ||
    sessionStorage.getItem("departmentName") ||
    "";
  const loggedInDepartmentId =
    sessionStorage.getItem("departmentId") ||
    localStorage.getItem("departmentId") ||
    "";
  const isOphthalmologyDepartment =
    Number(loggedInDepartmentId) === OPHTHALMOLOGY_DEPARTMENT_ID;
  const isObgynDepartment = Number(loggedInDepartmentId) === OBG_DEPARTMENT_ID;
  const isEntDepartment = Number(loggedInDepartmentId) === ENT_DEPARTMENT_ID;
  const isDentalDepartment =
    Number(loggedInDepartmentId) === DENTAL_DEPARTMENT_ID;
  const searchTimeoutRef = useRef(null);
  const debounceRef = useRef({});

  // Add state variables for Admission

  const [wardCategory, setWardCategory] = useState("");
  const [wardCategories, setWardCategories] = useState([]);

  const [admissionCareLevel, setAdmissionCareLevel] = useState("");
  const [admissionCareLevelName, setAdmissionCareLevelName] = useState("");

  const [wardDepartments, setWardDepartments] = useState([]);
  const [wardName, setWardName] = useState("");

  const [occupiedBeds, setOccupiedBeds] = useState("0");
  const [vacantBeds, setVacantBeds] = useState("0");

  const [admissionDate, setAdmissionDate] = useState("");
  const [admissionRemarks, setAdmissionRemarks] = useState("");
  const [admissionPriority, setAdmissionPriority] = useState("Normal");
  const [admissionAdvised, setAdmissionAdvised] = useState(false);
  const [wardDepartment, setWardDepartment] = useState([]);
  const [careLevels, setCareLevels] = useState([]);
  const [cleaningBeds, setCleaningBeds] = useState("0");
  const [currentSearchParams, setCurrentSearchParams] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [admissionPriorities, setAdmissionPriorities] = useState([
    "Normal",
    "Urgent",
    "Critical",
  ]);

  const navigate = useNavigate();
  // const [showPreviousVisitsModal, setShowPreviousVisitsModal] = useState(false);
  // const [showPreviousVitalsModal, setShowPreviousVitalsModal] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [clinicalPopupType, setClinicalPopupType] = useState("visits");

  const [previousVitalsData, setPreviousVitalsData] = useState([]);
  const [previousVisitsData, setPreviousVisitsData] = useState([]);

  const [visitsCurrentPage, setVisitsCurrentPage] = useState(0);
  const [visitsTotalPages, setVisitsTotalPages] = useState(0);
  const [visitsTotalElements, setVisitsTotalElements] = useState(0);
  const [visitsPageSize, setVisitsPageSize] = useState(5);
  const [visitsLoading, setVisitsLoading] = useState(false);

  const [vitalsCurrentPage, setVitalsCurrentPage] = useState(0);
  const [vitalsTotalPages, setVitalsTotalPages] = useState(0);
  const [vitalsTotalElements, setVitalsTotalElements] = useState(0);
  const [vitalsPageSize, setVitalsPageSize] = useState(5);
  const [vitalsLoading, setVitalsLoading] = useState(false);

  const [confirmationPopup, setConfirmationPopup] = useState({
    show: false,
    message: "",
    type: "success",
    onConfirm: null,
    onCancel: null,
    confirmText: "Yes",
    cancelText: "No",
  });

  const [distanceVisionData, setDistanceVisionData] = useState([]);
  const [nearVisionData, setNearVisionData] = useState([]);

  const obgDetailsRef = useRef();

  const fetchDistanceVisionData = async () => {
    if (distanceVisionLoadedRef.current) return;
    try {
      const data = await getRequest(OPTH_MAS_DISTANCE_VISION);
      if (data.status === 200 && Array.isArray(data.response)) {
        setDistanceVisionData(data.response);
        distanceVisionLoadedRef.current = true;
      } else {
        setDistanceVisionData([]);
      }
    } catch (error) {
      console.error("Error fetching Distance Vision data:", error);
    }
  };

  const fetchNearVisionData = async () => {
    if (nearVisionLoadedRef.current) return;
    try {
      const data = await getRequest(OPTH_MAS_NEAR_VISION);
      if (data.status === 200 && Array.isArray(data.response)) {
        setNearVisionData(data.response);
        nearVisionLoadedRef.current = true;
      } else {
        setNearVisionData([]);
      }
    } catch (error) {
      console.error("Error fetching Near Vision data:", error);
    }
  };

  const fetchPreviousVisits = async (
    patientId,
    hospitalId,
    page = 0,
    size = 5,
  ) => {
    if (!patientId) return;

    try {
      setVisitsLoading(true);
      const url = `${GET_PREVIOUS_OPD_VISIT_HISTORY}?patientId=${patientId}&hospitalId=${hospitalId}&page=${page}&size=${size}`;
      console.log("Calling API:", url);

      const response = await getRequest(url);
      console.log("Response:", response);

      if (response.status === 200 && response.response) {
        const data = response.response.content || [];
        setPreviousVisitsData(data);
        setVisitsTotalPages(response.response.totalPages || 0);
        setVisitsTotalElements(response.response.totalElements || 0);
        setVisitsCurrentPage(response.response.pageable?.pageNumber || page);
      } else {
        setPreviousVisitsData([]);
        setVisitsTotalPages(0);
        setVisitsTotalElements(0);
      }
    } catch (error) {
      console.error("Error fetching previous visits:", error);
      setPreviousVisitsData([]);
      setVisitsTotalPages(0);
      setVisitsTotalElements(0);
    } finally {
      setVisitsLoading(false);
    }
  };

  const fetchPreviousVitals = async (
    patientId,
    hospitalId,
    page = 0,
    size = 5,
  ) => {
    if (!patientId) {
      console.warn("fetchPreviousVitals: patientId is required");
      return;
    }

    try {
      setVitalsLoading(true);
      const url = `${GET_PREVIOUS_OPD_VITALS_DETAILS_HISTORY}?patientId=${patientId}&hospitalId=${hospitalId}&page=${page}&size=${size}`;
      console.log("Fetching vitals from URL:", url);

      const response = await getRequest(url);
      console.log("Vitals API response:", response);

      if (response?.status === 200 && response?.response) {
        let vitalsData = response.response;
        let paginationInfo = response.response;

        // Handle paginated response
        if (vitalsData.content) {
          vitalsData = vitalsData.content;
          paginationInfo = response.response;
        }

        const vitalsList = Array.isArray(vitalsData) ? vitalsData : [];

        const formattedVitals = vitalsList.map((vital) => ({
          visitDate: vital.visitDate || vital.createdDate || "",
          height: vital.height || "",
          weight: vital.weight || "",
          bmi: vital.bmi || "",
          bpSystolic: vital.bpSystolic || vital.systolicBP || "",
          bpDiastolic: vital.bpDiastolic || vital.diastolicBP || "",
          pulse: vital.pulse || "",
          temperature: vital.temperature || "",
          rr: vital.rr || "",
          spo2: vital.spo2 || "",
        }));

        console.log("Formatted vitals:", formattedVitals);
        setPreviousVitalsData(formattedVitals);
        setVitalsTotalPages(paginationInfo.totalPages || 0);
        setVitalsTotalElements(paginationInfo.totalElements || 0);
        setVitalsCurrentPage(paginationInfo.pageable?.pageNumber || page);
      } else {
        console.warn("No vitals data received or invalid response");
        setPreviousVitalsData([]);
        setVitalsTotalPages(0);
        setVitalsTotalElements(0);
      }
    } catch (error) {
      console.error("Error fetching previous vitals:", error);
      setPreviousVitalsData([]);
      setVitalsTotalPages(0);
      setVitalsTotalElements(0);
    } finally {
      setVitalsLoading(false);
    }
  };

  const fetchWardCategoryData = async () => {
    if (wardCategoryLoadedRef.current) return;
    try {
      const data = await getRequest(MAS_WARD_CATEGORY_GET_ALL);
      if (data.status === 200 && Array.isArray(data.response)) {
        setWardCategories(data.response);
        wardCategoryLoadedRef.current = true;
      } else {
        setWardCategories([]);
      }
    } catch (error) {
      console.error("Error fetching WardCategory data:", error);
    }
  };

  const fetchWardData = async (categoryId) => {
    try {
      const data = await getRequest(
        `${MAS_WARDS_GET_BY_ID}/${categoryId}`,
      );
      if (data.status === 200 && Array.isArray(data.response)) {
        setWardDepartments(data.response);
      } else {
        setWardDepartments([]);
      }
    } catch (error) {
      console.error("Error fetching Ward data:", error);
    }
  };

  const isOnlyDefaultTreatmentRow = (items) => {
    return (
      items.length === 1 &&
      !items[0].treatmentId &&
      !items[0].drugId &&
      !items[0].drugName &&
      !items[0].dosage &&
      !items[0].frequency &&
      !items[0].days
    );
  };

  const handleSelectVisitType = (type) => {
    setClinicalPopupType(type);
    setShowPopup(true);
  };

  const handleWardCategoryChange = (categoryId) => {
    setWardCategory(categoryId);
    setWardName("");
    setOccupiedBeds("0");
    setVacantBeds("0");
    setWardDepartments([]);
    setAdmissionCareLevel("");
    setAdmissionCareLevelName("");

    const selectedCategory = wardCategories.find(
      (cat) => Number(cat.categoryId) === Number(categoryId),
    );

    if (selectedCategory) {
      setAdmissionCareLevel(selectedCategory.careId);
      setAdmissionCareLevelName(selectedCategory.careLevelName);
      fetchWardData(categoryId);
    }

    setErrors((prev) => ({
      ...prev,
      wardCategory: "",
      admissionCareLevel: "",
      wardName: "",
    }));
  };

  // Add these state declarations inside the GeneralMedicineWaitingList component
  const [visionFormData, setVisionFormData] = useState({
    fundusGlow: {
      re: { uncorrected: "", pinhole: "", bestCorrected: "" },
      le: { uncorrected: "", pinhole: "", bestCorrected: "" },
    },
    vision: { distance: "", near: "" },
    retinoscopy: { re: { axis: "" }, le: { axis: "" } },
    measurements: {
      re: {
        keratometry: "",
        pachymetry: "",
        nonContactTonometry: "",
        fieldOfVN: "",
        iol: "",
      },
      le: {
        keratometry: "",
        pachymetry: "",
        nonContactTonometry: "",
        fieldOfVN: "",
        icl: "",
      },
    },
    spectacle: {
      re: { sph: "", cyl: "", axis: "" },
      le: { sph: "", cyl: "", axis: "" },
    },
    ipd: { value: "", use: "", typeOfLens: "" },
    anteriorSegment: {
      lids: "N",
      conjuctiva: "N",
      cornea: "N",
      anteriorChamber: "N",
      iris: "N",
      pupil: "N",
      lens: "N",
    },
    posteriorSegment: {
      re: {
        vitreous: "N",
        disc: "N",
        macula: "N",
        vessel: "N",
        periphery: "N",
      },
      le: {
        vitreous: "N",
        disc: "N",
        macula: "N",
        vessel: "N",
        periphery: "N",
      },
    },
    colourVision: { re: "", le: "" },
  });

  const anteriorLabels = {
    lids: "Lids",
    conjuctiva: "Conjuctiva",
    cornea: "Cornea",
    anteriorChamber: "Ant. Chamber",
    iris: "Iris",
    pupil: "Pupil",
    lens: "Lens",
  };

  const posteriorLabels = {
    vitreous: "Vitreous",
    disc: "Disc",
    macula: "Macula",
    vessel: "Vessel",
    periphery: "Periphery",
  };

  // Handlers
  const handleSaveVision = (e) => {
    e.preventDefault();
    // Implement API call or local save logic here
    console.log("Vision data saved:", visionFormData);
    // You can add a success popup here if needed
    showPopupMessage("Vision examination saved successfully!", "success");
  };

  const handleFundusGlowChange = (eye, field, value) => {
    setVisionFormData((prev) => ({
      ...prev,
      fundusGlow: {
        ...prev.fundusGlow,
        [eye]: { ...prev.fundusGlow[eye], [field]: value },
      },
    }));
  };

  const handleVisionChange = (e) => {
    const { name, value } = e.target;
    setVisionFormData((prev) => ({
      ...prev,
      vision: { ...prev.vision, [name]: value },
    }));
  };

  const handleRetinoscopyChange = (eye, value) => {
    setVisionFormData((prev) => ({
      ...prev,
      retinoscopy: {
        ...prev.retinoscopy,
        [eye]: { axis: value },
      },
    }));
  };

  const handleMeasurementsChange = (eye, field, value) => {
    setVisionFormData((prev) => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [eye]: { ...prev.measurements[eye], [field]: value },
      },
    }));
  };

  const handleSpectacleChange = (eye, field, value) => {
    setVisionFormData((prev) => ({
      ...prev,
      spectacle: {
        ...prev.spectacle,
        [eye]: { ...prev.spectacle[eye], [field]: value },
      },
    }));
  };

  const handleIpdChange = (e) => {
    const { name, value } = e.target;
    setVisionFormData((prev) => ({
      ...prev,
      ipd: { ...prev.ipd, [name]: value },
    }));
  };

  const handleAnteriorChange = (e) => {
    const { name, value } = e.target;
    setVisionFormData((prev) => ({
      ...prev,
      anteriorSegment: { ...prev.anteriorSegment, [name]: value },
    }));
  };

  const handlePosteriorChange = (eye, field, value) => {
    setVisionFormData((prev) => ({
      ...prev,
      posteriorSegment: {
        ...prev.posteriorSegment,
        [eye]: { ...prev.posteriorSegment[eye], [field]: value },
      },
    }));
  };

  const handleColourVisionChange = (eye, value) => {
    setVisionFormData((prev) => ({
      ...prev,
      colourVision: { ...prev.colourVision, [eye]: value },
    }));
  };

  const fetchDrugOptions = async (searchText = "", page = 0) => {
    try {
      const response = await getRequest(
        `${GET_ALL_DRUGS_BY_SECTION}?flag=1&search=${encodeURIComponent(searchText)}&page=${page}&size=20`,
      );

      if (response.status === 200 && response.response?.content) {
        return {
          list: response.response.content,
          last: response.response.last,
        };
      }

      return { list: [], last: true };
    } catch (err) {
      console.error("Error fetching drug options:", err);
      return { list: [], last: true };
    }
  };

  const handleDrugSearch = (value, index) => {
    setDrugSearch((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });

    if (drugDebounceRef.current[index])
      clearTimeout(drugDebounceRef.current[index]);

    drugDebounceRef.current[index] = setTimeout(async () => {
      if (!value.trim()) {
        setDrugDropdown([]);
        return;
      }

      const result = await fetchDrugOptions(value, 0);
      setDrugDropdown(result.list);
      setDrugLastPage(result.last);
      setDrugPage(0);
      setActiveDrugDropdown(index);
    }, 700);
  };

  const loadFirstDrugPage = async (index) => {
    const searchText = drugSearch[index] || "";
    const result = await fetchDrugOptions(searchText, 0);

    setDrugDropdown(result.list);
    setDrugLastPage(result.last);
    setDrugPage(0);
    setActiveDrugDropdown(index);
  };

  const loadMoreDrugs = async () => {
    if (drugLastPage || activeDrugDropdown === null) return;

    const nextPage = drugPage + 1;
    const result = await fetchDrugOptions(
      drugSearch[activeDrugDropdown] || "",
      nextPage,
    );

    setDrugDropdown((prev) => [...prev, ...result.list]);
    setDrugLastPage(result.last);
    setDrugPage(nextPage);
  };

  const updateDrug = (selectedDrug, index) => {
    if (!selectedDrug) return;

    const isDuplicate = treatmentItems.some(
      (item, i) => item.drugId === selectedDrug.itemId && i !== index,
    );

    if (isDuplicate) {
      setDuplicateItems([selectedDrug]);
      setShowDuplicatePopup(true);
      return;
    }

    setTreatmentItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        drugName: selectedDrug.nomenclature,
        dispUnit: selectedDrug.dispUnitName,
        drugId: selectedDrug.itemId,
        itemClassId: selectedDrug.itemClassId,
        aDispQty: selectedDrug.aDispQty ?? 1,
        total: calculateTotal({
          ...updated[index],
          aDispQty: selectedDrug.aDispQty ?? 1,
        }),
      };
      return updated;
    });

    setActiveDrugDropdown(null);
  };

  const fetchAllFrequencies = async () => {
    if (frequencyLoadedRef.current) return;
    try {
      const response = await getRequest(MAS_FREQUENCY_GET_ALL);
      // //console.log("Frequency API Response:", response);

      if (response && response.response) {
        setAllFrequencies(response.response);
        frequencyLoadedRef.current = true;
        // //console.log("Frequencies loaded:", response.response);
      } else {
        console.warn("No frequencies found in response");
        setAllFrequencies([]);
      }
    } catch (error) {
      console.error("Error fetching frequencies:", error);
      setAllFrequencies([]);
    }
  };

  const fetchMasProcedureData = async (page, searchText = "") => {
    try {
      const data = await getRequest(
        `${MASTERS}/masProcedures/getAll?flag=0&page=${page}&size=20&search=${encodeURIComponent(searchText)}`,
      );

      if (data.status === 200 && data.response?.content) {
        return {
          list: data.response.content,
          last: data.response.last,
        };
      }

      return { list: [], last: true };
    } catch (error) {
      console.error("Error fetching Procedures:", error);
      return { list: [], last: true };
    }
  };

  const loadProcedureFirstPage = async (index) => {
    const searchText = procedureSearch[index] || "";
    const result = await fetchMasProcedureData(0, searchText);

    setProcedureDropdown(result.list);
    setProcedureLastPage(result.last);
    setProcedurePage(0);
  };

  const loadMoreProcedure = async () => {
    if (procedureLastPage) return;

    const nextPage = procedurePage + 1;
    const result = await fetchMasProcedureData(
      nextPage,
      procedureSearch[openProcedureDropdown] || "",
    );

    setProcedureDropdown((prev) => [...prev, ...result.list]);
    setProcedureLastPage(result.last);
    setProcedurePage(nextPage);
  };

  const updateProcedure = (selected, index) => {
    if (!selected) return;

    // prevent duplicate selection
    const exists = procedureCareItems.some(
      (item, idx) =>
        String(item.id) === String(selected.procedureId) && idx !== index,
    );

    if (exists) {
      setDuplicateItems([{ icdDiagnosis: selected.procedureName }]);
      setShowDuplicatePopup(true);
      return;
    }

    setProcedureCareItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        id: selected.procedureId,
        name: selected.procedureName,
      };
      return updated;
    });

    // clear search after selecting
    setProcedureSearch((prev) => {
      const updated = [...prev];
      updated[index] = "";
      return updated;
    });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      const refs = procedureDropdownRef.current;

      const clickedInside = refs.some(
        (ref) => ref && ref.contains && ref.contains(e.target),
      );

      if (!clickedInside) {
        setOpenProcedureDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchMasICDData = async (page, searchText = "") => {
    try {
      const data = await getRequest(
        `${MASTERS}/masIcd/all?flag=0&page=${page}&size=20&search=${encodeURIComponent(searchText)}`,
      );

      if (data.status === 200 && data.response?.content) {
        return {
          list: data.response.content,
          last: data.response.last,
        };
      }

      return { list: [], last: true };
    } catch (error) {
      console.error("Error fetching ICD:", error);
      return { list: [], last: true };
    }
  };

  // FIRST PAGE LOAD
  const loadFirstPage = async (index) => {
    const searchText = search[index] || "";
    const result = await fetchMasICDData(0, searchText);

    setIcdDropdown(result.list);
    setLastPage(result.last);
    setPage(0);
  };

  const handleIcdSearch = (value, index) => {
    setSearch((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });

    setDiagnosisItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        icdDiagId: "",
        icdDiagnosis: value,
      };
      return updated;
    });

    if (debounceRef.current[index]) {
      clearTimeout(debounceRef.current[index]);
    }

    debounceRef.current[index] = setTimeout(async () => {
      if (!value.trim()) {
        setIcdDropdown([]);
        return;
      }
      const result = await fetchMasICDData(0, value);
      setIcdDropdown(result.list);
      setLastPage(result.last);
      setPage(0);
      setOpenDropdown(index);
    }, 700);
  };

  const loadMore = async () => {
    if (lastPage || openDropdown === null) return;

    const nextPage = page + 1;
    const result = await fetchMasICDData(nextPage, search[openDropdown] || "");

    setIcdDropdown((prev) => [...prev, ...result.list]);
    setLastPage(result.last);
    setPage(nextPage);
  };

  // UPDATE SELECTED ICD
  const updateICD = (selectedICD, index) => {
    if (!selectedICD) return;

    const exists = diagnosisItems.some(
      (item, idx) =>
        String(item.icdDiagId) === String(selectedICD.icdId) && idx !== index,
    );

    if (exists) {
      setDuplicateItems([
        { icdDiagnosis: `${selectedICD.icdCode} - ${selectedICD.icdName}` },
      ]);
      setShowDuplicatePopup(true);
      return;
    }

    setDiagnosisItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        icdDiagId: selectedICD.icdId,
        icdDiagnosis: `${selectedICD.icdCode} - ${selectedICD.icdName}`,
      };
      return updated;
    });

    setSearch((prev) => {
      const updated = [...prev];
      updated[index] = "";
      return updated;
    });

    if (errors.diagnosis || errors.workingDiagnosis) {
      setErrors((prev) => ({
        ...prev,
        diagnosis: "",
        workingDiagnosis: "",
      }));
    }
  };

  // CLOSE DROPDOWN ON OUTSIDE CLICK
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchWaitingList = async () => {
    try {
      setLoading(true);
      // Initial fetch without filters (just first page)
      const queryParams = new URLSearchParams();
      queryParams.append("page", "0");
      queryParams.append("size", DEFAULT_ITEMS_PER_PAGE);

      const res = await getRequest(
        `${GET_WAITING_LIST}?${queryParams.toString()}`,
      );
      if (res?.status === 200 && res?.response) {
        setWaitingList(res.response.content || []);
        setTotalRecords(res.response.totalElements || 0);
      } else {
        setWaitingList([]);
      }
    } catch (error) {
      console.error("Error fetching waiting list:", error);
      setWaitingList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOpdTemplateData = async () => {
    try {
      const data = await getRequest(OPD_TEMPLATE_GET_ALL);

      if (data.status === 200 && Array.isArray(data.response)) {
        setOpdTemplateData(data.response);
        opdTemplateLoadedRef.current = true;
      } else {
        setOpdTemplateData([]);
      }
    } catch (error) {
      console.error("Error fetching Doctor data:", error);
    }
  };

  const fetchDoctorData = async () => {
    setLoading(true);
    try {
      const data = await getRequest(DOCTOR_BY_DEPARTMENT);
      if (data.status === 200 && Array.isArray(data.response)) {
        setDoctorData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setDoctorData([]);
      }
    } catch (error) {
      console.error("Error fetching Doctor data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionData = async () => {
    setLoading(true);
    try {
      const data = await getRequest(MAS_OPD_SESSION_GET_ALL);
      if (data.status === 200 && Array.isArray(data.response)) {
        setSessionData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setSessionData([]);
      }
    } catch (error) {
      console.error("Error fetching Session data:", error);
    } finally {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   fetchWaitingList();
  //   fetchDoctorData();
  //   fetchSessionData();
  //   fetchMasICDData();
  //   fetchMasProcedureData();
  //   fetchOpdTemplateData();
  //   fetchDrugOptions();
  //   fetchAllFrequencies();
  //   fetchWardCategoryData();
  // }, []);

  useEffect(() => {
    if (initialDataLoadedRef.current) return;
    initialDataLoadedRef.current = true;

    fetchWaitingList();
    fetchDoctorData();
    fetchSessionData();
    fetchOpdTemplateData();
    fetchAllFrequencies();
    fetchInvestigationTypes();
    fetchWardCategoryData();
    fetchDistanceVisionData();
    fetchNearVisionData();
  }, []);

  const handleDiagnosisOpen = () => {
    fetchMasICDData();
  };

  const handleProcedureOpen = () => {
    fetchMasProcedureData();
  };

  const handleTreatmentOpen = () => {
    fetchDrugOptions();
    fetchAllFrequencies();
  };

  const handleAdmissionOpen = () => {
    fetchWardCategoryData();
  };

  const handleTemplateOpen = () => {
    fetchOpdTemplateData();
  };

  const [searchFilters, setSearchFilters] = useState({
    doctorList: "",
    session: "",
    mobileNo: "",
    patientName: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showOtCalendarModal, setShowOtCalendarModal] = useState(false);
  const [showCurrentMedicationModal, setShowCurrentMedicationModal] =
    useState(false);
  const [currentMedicationActions, setCurrentMedicationActions] = useState({});

  // Modal states - UPDATED
  const [showInvestigationModal, setShowInvestigationModal] = useState(false);
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [investigationModalType, setInvestigationModalType] =
    useState("create");
  const [treatmentModalType, setTreatmentModalType] = useState("create");

  const [investigationType, setInvestigationType] = useState(null);
  const [procedureCareType, setProcedureCareType] = useState("procedure");

  const [investigationTemplates, setInvestigationTemplates] = useState([]);
  const [selectedInvestigationTemplate, setSelectedInvestigationTemplate] =
    useState("Select..");
  const [investigationTemplateLoading, setInvestigationTemplateLoading] =
    useState(false);
  const [allInvestigations, setAllInvestigations] = useState([]);
  const [filteredInvestigationsByType, setFilteredInvestigationsByType] =
    useState([]);
  const [investigationTypes, setInvestigationTypes] = useState([]);
  const [activeInvestigationRowIndex, setActiveInvestigationRowIndex] =
    useState(null);

  const [expandedSections, setExpandedSections] = useState({
    personalDetails: false,
    clinicalHistory: true,
    vitalDetail: true,
    diagnosis: true,
    investigation: false,
    treatment: false,
    treatmentAdvice: false,
    procedureCare: false,
    surgeryAdvice: false,
    admissionAdvice: false,
    referral: false,
    followUp: false,
    doctorRemark: false,
    remarks: false,
    visionExamination: false,
    obgDetails: false,
    earExamination: false,
    gynaMaster: false,
    dental: false,
    pregnancy: false,
  });

  const [selectedHistoryType, setSelectedHistoryType] = useState("");

  const [formData, setFormData] = useState({
    height: "",
    weight: "",
    temperature: "",
    systolicBP: "",
    diastolicBP: "",
    pulse: "",
    bmi: "",
    rr: "",
    spo2: "",
    patientSymptoms: "",
    clinicalExamination: "",
    pastHistory: "",
    familyHistory: "",
    treatmentAdvice: "",
    mlcCase: false,
  });
  const [psychiatristAssessment, setPsychiatristAssessment] = useState(null);

  const [errors, setErrors] = useState({});

  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [showUpdateTemplateModal, setShowUpdateTemplateModal] = useState(false);
  const [showTreatmentAdviceModal, setShowTreatmentAdviceModal] =
    useState(false);
  const [treatmentAdviceModalType, setTreatmentAdviceModalType] = useState("");

  const [selectedTemplate, setSelectedTemplate] = useState("Select..");
  const [templateName, setTemplateName] = useState("");
  const getToday = () => new Date().toISOString().split("T")[0];
  const formatDateForDisplay = (value) => {
    if (!hasValue(value)) return "";

    const normalized = String(value).trim();
    const datePart = normalized.includes("T")
      ? normalized.split("T")[0]
      : normalized;

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(datePart)) return datePart;

    const isoMatch = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${day}/${month}/${year}`;
    }

    const hyphenDisplayMatch = datePart.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (hyphenDisplayMatch) {
      const [, day, month, year] = hyphenDisplayMatch;
      return `${day}/${month}/${year}`;
    }

    const parsedDate = new Date(normalized);
    if (Number.isNaN(parsedDate.getTime())) return normalized;

    const day = String(parsedDate.getDate()).padStart(2, "0");
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const year = parsedDate.getFullYear();
    return `${day}/${month}/${year}`;
  };
  const [investigationItems, setInvestigationItems] = useState([
    {
      investigationId: "",
      templateIds: [],
      displayValue: "",
      date: getToday(),
    },
  ]);
  const [updateTemplateSelection, setUpdateTemplateSelection] =
    useState("Select..");
  const [templateType, setTemplateType] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    x: 0,
    y: 0,
    height: 0,
  });
  const [dropdownWidth, setDropdownWidth] = useState(0);

  const [workingDiagnosis, setWorkingDiagnosis] = useState("");

  const [followUps, setFollowUps] = useState({
    noOfFollowDays: "",
    followUpFlag: false,
    followUpDate: getToday(),
  });

  // console.log("followUps", followUps);

  const [diagnosisItems, setDiagnosisItems] = useState([
    {
      icdDiagId: "",
      icdDiagnosis: "",
      communicableDisease: false,
      infectiousDisease: false,
    },
  ]);

  const openPopup = (type) => {
    setPopupType(type);
    setModelShowPopup(true);
  };

  const handleModelClose = () => {
    setModelShowPopup(false);
    setSelectedItems([]);
  };

  const handleOk = () => {
    if (selectedItems.length === 0) {
      alert("Please select at least one item.");
      return;
    }

    const newNames = selectedItems.map((x) => x.name);

    const mergeValues = (oldValue, newValues) => {
      const oldArr = oldValue ? oldValue.split(",").map((x) => x.trim()) : [];
      const merged = Array.from(new Set([...oldArr, ...newValues]));
      return merged.join(", ");
    };

    if (popupType === "symptoms") {
      setFormData({
        ...formData,
        patientSymptoms: mergeValues(formData.patientSymptoms, newNames),
      });
    }

    if (popupType === "past") {
      setFormData({
        ...formData,
        pastHistory: mergeValues(formData.pastHistory, newNames),
      });
    }

    if (popupType === "family") {
      setFormData({
        ...formData,
        familyHistory: mergeValues(formData.familyHistory, newNames),
      });
    }

    if (popupType === "treatmentAdvice") {
      setGeneralTreatmentAdvice((prev) => mergeValues(prev, newNames));
    }

    if (popupType === "doctorRemark") {
      setDoctorRemarksText((prev) => mergeValues(prev, newNames));
    }

    setModelShowPopup(false);
    setSelectedItems([]);
  };

  const handleSelect = (item) => {
    setSelectedItems((prev) => {
      const exists = prev.find((x) => x.id === item.id);

      if (exists) {
        return prev.filter((x) => x.id !== item.id);
      }

      return [...prev, item];
    });
  };

  const [templates, setTemplates] = useState([
    "Blood Test Template",
    "Cardiac Template",
    "Diabetes Template",
  ]);
  const [treatmentAdviceTemplates, setTreatmentAdviceTemplates] = useState([
    "MEDICINES TO BE REPEATED AT FAC",
    "WARM WATER GARGLING, WITH/WITHOUT",
    "REVIEW AFTER 3 MONTHS WITH - FBS - P",
    "REVIEW AFTER 3 MONTHS",
    "REVIEW AFTER 6 MONTHS",
  ]);

  const [treatmentItems, setTreatmentItems] = useState([
    {
      treatmentId: null,
      drugId: "",
      drugName: "",
      dispUnit: "",
      dosage: "",
      frequency: "",
      days: "",
      total: "",
      instruction: "",
      stock: "0",
      templateId: "",
    },
  ]);
  const [currentMedications, setCurrentMedications] = useState([]);

  const [treatmentAdviceSelection, setTreatmentAdviceSelection] = useState("");
  const [generalTreatmentAdvice, setGeneralTreatmentAdvice] = useState("");
  const [procedureTreatmentAdvice, setProcedureTreatmentAdvice] = useState("");
  const [physiotherapyTreatmentAdvice, setPhysiotherapyTreatmentAdvice] =
    useState("");
  const [selectedTreatmentAdviceItems, setSelectedTreatmentAdviceItems] =
    useState([]);

  const [procedureDropdown, setProcedureDropdown] = useState([]);
  const [procedurePage, setProcedurePage] = useState(0);
  const [procedureLastPage, setProcedureLastPage] = useState(true);
  const [procedureSearch, setProcedureSearch] = useState([]);
  const [openProcedureDropdown, setOpenProcedureDropdown] = useState(null);
  const procedureDropdownRef = useRef([]);

  const [investigationDropdown, setInvestigationDropdown] = useState([]);
  const [investigationSearch, setInvestigationSearch] = useState([]);
  const [investigationPage, setInvestigationPage] = useState(0);
  const [investigationLastPage, setInvestigationLastPage] = useState(true);
  const [openInvestigationDropdown, setOpenInvestigationDropdown] =
    useState(null);

  const debounceInvestigationRef = useRef([]);
  const dropdownInvestigationRef = useRef(null);

  const [procedureCareItems, setProcedureCareItems] = useState([
    { id: "", name: "", frequency: "", days: "", remarks: "" },
  ]);

  // console.log("procedureCareItems", procedureCareItems);

  const [physiotherapyItems, setPhysiotherapyItems] = useState([
    {
      name: "",
      frequency: "",
      days: "",
      remarks: "",
    },
  ]);

  const [surgeryType, setSurgeryType] = useState("major");
  const [surgerySearchInput, setSurgerySearchInput] = useState("");
  const [isSurgeryDropdownVisible, setIsSurgeryDropdownVisible] =
    useState(false);
  const [selectedSurgeryIndex, setSelectedSurgeryIndex] = useState(null);
  const [additionalAdvice, setAdditionalAdvice] = useState("");

  const defaultReferralData = {
    isReferred: "No",
    referTo: "",
    referralDate: getToday(),
    currentPriorityNo: "",
    referredHospitalName: "",
  };

  // Referral state - UPDATED
  const [referralData, setReferralData] = useState(defaultReferralData);

  const [departmentData, setDepartmentData] = useState([
    {
      selected: false,
      doctor: "Select",
    },
  ]);

  const [referralNotes, setReferralNotes] = useState("");

  const surgeryOptions = [
    { id: 1, name: "Appendectomy", code: "APD" },
    { id: 2, name: "Cholecystectomy", code: "CHO" },
    { id: 3, name: "Hernia Repair", code: "HER" },
    { id: 4, name: "Hysterectomy", code: "HYS" },
    { id: 5, name: "Prostatectomy", code: "PRO" },
  ];

  const [surgeryItems, setSurgeryItems] = useState([
    {
      surgery: "",
      selected: false,
    },
  ]);

  const [selectedBloodTestTemplate, setSelectedBloodTestTemplate] =
    useState("Select..");

  const itemsPerPage = 5;

  const [selectedTemplateIds, setSelectedTemplateIds] = useState(new Set());

  const handleOpenInvestigationModal = (type = "create") => {
    setInvestigationModalType(type);
    setShowInvestigationModal(true);
  };

  const handleCloseInvestigationModal = () => {
    setShowInvestigationModal(false);
    setInvestigationModalType("create");
  };

  const handleOpenTreatmentModal = (type = "create") => {
    setTreatmentModalType(type);
    setShowTreatmentModal(true);
  };

  const handleCloseTreatmentModal = () => {
    setShowTreatmentModal(false);
    setTreatmentModalType("create");
  };

  const handleOpenCurrentMedicationModal = () => {
    setActiveDrugDropdown(null);
    setOpenDropdown(null);
    setOpenInvestigationDropdown(null);
    setShowCurrentMedicationModal(true);
  };

  const handleCloseCurrentMedicationModal = () => {
    setShowCurrentMedicationModal(false);
  };

  const handleInputFocus = (event, index) => {
    const rect = event.target.getBoundingClientRect();
    setDropdownPosition({
      x: rect.left,
      y: rect.top,
      height: rect.height,
    });
    setDropdownWidth(rect.width);
    setActiveInvestigationRowIndex(index);
    setDropdownVisible(true);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".form-control")) {
        setDropdownVisible(false);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const fetchCurrentMedications = async (patientId) => {
    try {
      const response = await getRequest(
        `${GET_PATIENT_PRESCRIPTION_DETAILS}/${patientId}`,
      );
      if (response?.status === 200 && Array.isArray(response.response)) {
        const medications = response.response.map((item, index) => ({
          id: item.prescriptionDtId || index + 1,
          drugId: item.drugId,
          drugName: item.drugName,
          dosage: item.dosage,
          days: item.days,
          frequency: item.frequency,
          total: item.total,
          instruction: item.instruction,
          prescribedBy: item.doctorName,
          department: item.departmentName,
          prescribedDate: item.prescribedDate,
          dispUnit: item.dispUnit,
          stock: item.stock || "0",
          itemClassId: item.itemClassId,
          aDispQty: item.aDispQty || 1,
        }));

        setCurrentMedications(medications);
      } else {
        setCurrentMedications([]);
      }
    } catch (error) {
      console.error("Error fetching current medications:", error);
      setCurrentMedications([]);
    }
  };

  const fetchInvestigationTypes = async () => {
    if (investigationTypeLoadedRef.current) return;
    const res = await getRequest(MAS_INVESTIGATION_UNIQUE_TYPES);
    if (res?.response) {
      setInvestigationTypes(res.response);
      investigationTypeLoadedRef.current = true;
    }
  };

  const fetchInvestigationTemplates = async (flag = 1) => {
    try {
      setInvestigationTemplateLoading(true);
      const response = await getRequest(
        `${OPD_TEMPLATE_GET_ALL_INVESTIGATIONS_TEMPLATES}/${flag}`,
      );
      if (response && response.response) {
        setInvestigationTemplates(response.response);
      } else {
        setInvestigationTemplates([]);
      }
    } catch (error) {
      console.error("Error fetching investigation templates:", error);
      setInvestigationTemplates([]);
    } finally {
      setInvestigationTemplateLoading(false);
    }
  };

  const fetchInvestigations = async (page, searchText = "") => {
    try {
      let url = `${MAS_INVESTIGATION}/dynamic/all?flag=1&page=${page}&size=20`;

      if (searchText) {
        url += `&search=${encodeURIComponent(searchText)}`;
      }

      if (investigationType) {
        url += `&mainChargeCodeId=${investigationType}`;
      }

      const data = await getRequest(url);

      if (data.status === 200 && data.response?.content) {
        const selectedIds = investigationItems
          .map((item) => item.investigationId)
          .filter(Boolean);

        return {
          list: data.response.content.filter(
            (item) => !selectedIds.includes(item.investigationId),
          ),
          last: data.response.last,
        };
      }

      return { list: [], last: true };
    } catch (error) {
      console.error("Error fetching investigations:", error);
      return { list: [], last: true };
    }
  };

  const loadFirstInvestigationPage = async (index) => {
    const searchText = investigationSearch[index] || "";
    const result = await fetchInvestigations(0, searchText);

    setInvestigationDropdown(result.list);
    setInvestigationLastPage(result.last);
    setInvestigationPage(0);
  };

  const handleInvestigationSearch = (value, index) => {
    setInvestigationItems((prev) => {
      const updated = [...prev];

      updated[index] = {
        ...updated[index],
        displayValue: value,
        investigationId: null,
      };

      return updated;
    });

    if (debounceInvestigationRef.current[index]) {
      clearTimeout(debounceInvestigationRef.current[index]);
    }

    debounceInvestigationRef.current[index] = setTimeout(async () => {
      if (!value.trim()) {
        setInvestigationDropdown([]);
        return;
      }

      const result = await fetchInvestigations(0, value);

      setInvestigationDropdown(result.list);
      setInvestigationLastPage(result.last);
      setInvestigationPage(0);
      setOpenInvestigationDropdown(index);
    }, 700);
  };

  const loadMoreInvestigations = async () => {
    if (investigationLastPage || openInvestigationDropdown === null) return;

    const nextPage = investigationPage + 1;
    const result = await fetchInvestigations(
      nextPage,
      investigationSearch[openInvestigationDropdown] || "",
    );

    setInvestigationDropdown((prev) => [...prev, ...result.list]);
    setInvestigationLastPage(result.last);
    setInvestigationPage(nextPage);
  };

  const updateInvestigation = (selected, index) => {
    if (!selected) return;

    setInvestigationItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        investigationId: selected.investigationId,
        displayValue: selected.investigationName,
      };
      return updated;
    });

    setInvestigationSearch((prev) => {
      const updated = [...prev];
      updated[index] = selected.investigationName;
      return updated;
    });

    setOpenInvestigationDropdown(null);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownInvestigationRef.current &&
        !dropdownInvestigationRef.current.contains(e.target)
      ) {
        setOpenInvestigationDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filterInvestigationsByMainChargeCode = () => {
    //console.log("Filtering investigations by type:", investigationType)

    if (!investigationType || allInvestigations.length === 0) {
      setFilteredInvestigationsByType([]);
      return;
    }

    const selectedType = investigationTypes.find(
      (type) => type.value === investigationType,
    );
    //console.log("Selected type for filtering:", selectedType)

    if (selectedType) {
      const filtered = allInvestigations.filter(
        (inv) => inv.mainChargeCodeId === selectedType.id,
      );
      //console.log(`Filtered ${filtered.length} investigations for type:`, selectedType.name)
      setFilteredInvestigationsByType(filtered);
    } else {
      setFilteredInvestigationsByType([]);
    }
  };

  const filterInvestigationsBySearch = (searchQuery) => {
    if (!searchQuery.trim()) {
      return filteredInvestigationsByType.slice(0, 5);
    }

    const filtered = filteredInvestigationsByType
      .filter(
        (inv) =>
          inv.investigationName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          inv.mainChargeCodeName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          inv.subChargeCodeName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()),
      )
      .slice(0, 5);

    return filtered;
  };

  useEffect(() => {
    if (activeDrugNameDropdown !== null) {
      const container = tableContainerRef.current;
      const inputEl = document.getElementById(
        `drug-name-${activeDrugNameDropdown}`,
      );
      const dropdownHeight = 200;

      if (container && inputEl) {
        const inputRect = inputEl.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        if (inputRect.bottom + dropdownHeight > containerRect.bottom) {
          container.scrollTop +=
            inputRect.bottom + dropdownHeight - containerRect.bottom + 10;
        }
      }
    }
  }, [activeDrugNameDropdown]);

  // UPDATED: Handle template selection to accumulate items
  const handleInvestigationTemplateSelect = (template) => {
    const templateId = template.templateId;

    // Prevent duplicate template selection
    if (selectedTemplateIds.has(templateId)) {
      alert("This template is already selected");
      setSelectedInvestigationTemplate("Select..");
      return;
    }

    setSelectedTemplateIds((prev) => new Set([...prev, templateId]));
    setSelectedInvestigationTemplate(templateId);

    if (!template.investigationResponseList) return;

    let duplicateItemsBuffer = [];

    setInvestigationItems((prev) => {
      let updated = [...prev];

      if (
        updated.length === 1 &&
        !updated[0].investigationId &&
        !updated[0].displayValue
      ) {
        updated = [];
      }

      const existingMap = new Map(
        updated.map((item) => [item.investigationId, item]),
      );

      template.investigationResponseList.forEach((item) => {
        const existing = existingMap.get(item.investigationId);

        if (existing) {
          if (!existing.templateIds.includes(templateId)) {
            existing.templateIds = [...existing.templateIds, templateId];
          }

          duplicateItemsBuffer.push({
            investigationId: item.investigationId,
            investigationName: existing.displayValue ?? item.investigationName,
          });
        } else {
          updated.push({
            displayValue:
              item.investigationName ??
              `Investigation #${item.investigationId}`,
            date: getToday(),
            investigationId: item.investigationId,
            templateSource: template.opdTemplateName,
            templateIds: [templateId],
          });
        }
      });

      return updated;
    });

    setTimeout(() => {
      const unique = Array.from(
        new Map(
          duplicateItemsBuffer.map((d) => [d.investigationId, d]),
        ).values(),
      );

      if (unique.length > 0) {
        setDuplicateItems(unique);
        setShowDuplicatePopup(true);
      }

      setSelectedInvestigationTemplate("Select..");
    }, 50);
  };

  const handleClearAllTemplates = () => {
    setSelectedTemplateIds(new Set());

    setInvestigationItems((prev) =>
      prev.filter((item) => (item.templateIds ?? []).length === 0),
    );
  };

  const handleRemoveTemplateItems = (templateId) => {
    setSelectedTemplateIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(templateId);
      return newSet;
    });

    setInvestigationItems((prev) =>
      prev
        .map((item) => {
          const originalTemplateIds = item.templateIds ?? [];

          if (originalTemplateIds.length === 0) {
            return item;
          }

          return {
            ...item,
            templateIds: originalTemplateIds.filter((id) => id !== templateId),
          };
        })
        .filter((item) => {
          const ids = item.templateIds ?? [];

          if (ids.length === 0 && item.templateSource) return false;

          return true;
        }),
    );
  };

  // Handle visits page change
  const handleVisitsPageChange = (newPage) => {
    if (selectedPatient) {
      const hospitalId =
        selectedPatient.hospitalId ||
        sessionStorage.getItem("hospitalId") ||
        localStorage.getItem("hospitalId");
      fetchPreviousVisits(
        selectedPatient.patientId,
        hospitalId,
        newPage,
        visitsPageSize,
      );
    }
  };

  // Handle vitals page change
  const handleVitalsPageChange = (newPage) => {
    if (selectedPatient) {
      const hospitalId =
        selectedPatient.hospitalId ||
        sessionStorage.getItem("hospitalId") ||
        localStorage.getItem("hospitalId");
      fetchPreviousVitals(
        selectedPatient.patientId,
        hospitalId,
        newPage,
        vitalsPageSize,
      );
    }
  };

  // Handle visits page size change
  const handleVisitsPageSizeChange = (newSize) => {
    setVisitsPageSize(newSize);
    if (selectedPatient) {
      const hospitalId =
        selectedPatient.hospitalId ||
        sessionStorage.getItem("hospitalId") ||
        localStorage.getItem("hospitalId");
      fetchPreviousVisits(selectedPatient.patientId, hospitalId, 0, newSize);
    }
  };

  // Handle vitals page size change
  const handleVitalsPageSizeChange = (newSize) => {
    setVitalsPageSize(newSize);
    if (selectedPatient) {
      const hospitalId =
        selectedPatient.hospitalId ||
        sessionStorage.getItem("hospitalId") ||
        localStorage.getItem("hospitalId");
      fetchPreviousVitals(selectedPatient.patientId, hospitalId, 0, newSize);
    }
  };

  const handleInvestigationSelect = (index, investigation) => {
    const duplicate = investigationItems.find(
      (item, idx) =>
        idx !== index && item.investigationId === investigation.investigationId,
    );

    if (duplicate) {
      setDuplicateItems([
        {
          investigationId: investigation.investigationId,
          investigationName: investigation.investigationName,
        },
      ]);

      setShowDuplicatePopup(true);

      const newItems = [...investigationItems];
      newItems[index] = {
        ...newItems[index],
        name: "",
        investigationId: null,
      };

      setInvestigationItems(newItems);
      setActiveInvestigationRowIndex(null);
      return;
    }

    // ---- NO DUPLICATE → UPDATE ROW ----
    const newItems = [...investigationItems];
    newItems[index] = {
      ...newItems[index],
      displayValue: investigation.investigationName,
      investigationId: investigation.investigationId,
    };

    setInvestigationItems(newItems);
    setActiveInvestigationRowIndex(null);
  };

  const handleReferralChange = (field, value) => {
    const referralErrorKeys = [
      "referralDate",
      "referTo",
      "currentPriorityNo",
      "departmentData",
      "referredHospitalName",
      "referralNotes",
    ];

    if (field === "isReferred" && value === "No") {
      setReferralData({
        ...defaultReferralData,
        isReferred: "No",
        referralDate: "",
      });
      setReferralNotes("");
    } else if (field === "isReferred" && value === "Yes") {
      setReferralData((prev) => ({
        ...prev,
        isReferred: "Yes",
        referralDate: prev.referralDate || getToday(),
      }));
    } else if (field === "referTo") {
      setReferralData((prev) => ({
        ...prev,
        referTo: value,
        currentPriorityNo: value === "Internal" ? prev.currentPriorityNo : "",
        referredHospitalName:
          value === "External" ? prev.referredHospitalName : "",
      }));
    } else {
      setReferralData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    setErrors((prev) => {
      const updated = { ...prev };
      if (field === "isReferred" || field === "referTo") {
        referralErrorKeys.forEach((key) => {
          updated[key] = "";
        });
      } else {
        updated[field] = "";
      }
      return updated;
    });
  };

  const handleDepartmentChange = (index, field, value) => {
    const newData = [...departmentData];
    newData[index] = {
      ...newData[index],
      [field]: value,
    };
    setDepartmentData(newData);
    if (errors.departmentData) {
      setErrors((prev) => ({
        ...prev,
        departmentData: "",
      }));
    }
  };

  const handleAddDepartment = () => {
    setDepartmentData([
      ...departmentData,
      {
        selected: false,
        doctor: "Select",
      },
    ]);
  };

  const handleRemoveTreatmentTemplateItems = (templateId) => {
    setTreatmentItems((prev) =>
      prev
        .map((item) => {
          if (!item.templateId) return item;

          const ids = item.templateId
            .split(",")
            .filter((id) => id !== String(templateId));

          if (item.treatmentId != null) {
            return {
              ...item,
              templateId: ids.join(","),
            };
          }

          if (ids.length > 0) {
            return {
              ...item,
              templateId: ids.join(","),
            };
          }

          return null;
        })
        .filter((item) => item !== null),
    );

    setSelectedTreatmentTemplateIds((prev) => {
      const updated = new Set(prev);
      updated.delete(templateId);
      return updated;
    });
  };

  const handleRemoveDepartment = (index) => {
    if (departmentData.length === 1) return;
    const newData = departmentData.filter((_, i) => i !== index);
    setDepartmentData(newData);
  };

  useEffect(() => {
    if (showDetailView && selectedPatient) {
      fetchInvestigationTemplates();
    }
  }, [showDetailView, selectedPatient]);

  useEffect(() => {
    filterInvestigationsByMainChargeCode();
  }, [investigationType]);

  const handleFilterChange = (field, value) => {
    setSearchFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    setCurrentPage(1);
  };

  const userId =
    localStorage.getItem("userId") || sessionStorage.getItem("userId");

  useEffect(() => {
    if (userId) {
      setSearchFilters((prev) => ({
        ...prev,
        doctorList: userId,
      }));
    }
  }, [userId]);

  // useEffect(() => {
  //   if (searchFilters.doctorList) {
  //     handleSearch();
  //   }
  // }, [searchFilters.doctorList]);

  const handleSearch = async () => {
    const userId =
      localStorage.getItem("userId") || sessionStorage.getItem("userId");

    if (!userId) return;

    if (!searchFilters.doctorList) {
      showPopupMessage("Doctor is required", "error");
      return;
    }

    try {
      setIsSearching(true);
      const queryParams = new URLSearchParams();
      queryParams.append("page", "0");
      queryParams.append("size", DEFAULT_ITEMS_PER_PAGE);

      if (searchFilters.doctorList) {
        queryParams.append("doctorId", searchFilters.doctorList);
      }
      if (searchFilters.session) {
        queryParams.append("sessionId", searchFilters.session);
      }
      if (searchFilters.mobileNo?.trim()) {
        queryParams.append("mobileNumber", searchFilters.mobileNo.trim());
      }
      if (searchFilters.patientName?.trim()) {
        queryParams.append("patientName", searchFilters.patientName.trim());
      }

      const data = await getRequest(
        `${GET_WAITING_LIST}?${queryParams.toString()}`,
      );

      if (data.status === 200 && data.response) {
        const waitingListData = data.response.content || [];
        setWaitingList(waitingListData);
        setCurrentPage(1);
      } else {
        setWaitingList([]);
      }
    } catch (error) {
      console.error("Search API Error:", error);
      setWaitingList([]);
      showPopupMessage(
        "Failed to fetch waiting list. Please try again.",
        "error",
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = () => {
    setSearchFilters({
      doctorList: "",
      session: "",
      employeeNo: "",
      patientName: "",
    });
  };

  // const updateVisitStatus = async (visitId, visitDate, doctorId) => {
  //   try {
  //     const response = await putRequest(
  //       `${PATIENT_UPDATE_STATUS}?visitId=${visitId}&visitDate=${visitDate}&doctorId=${doctorId}`,
  //     );

  //     //console.log("Status Updated:", response);
  //     return response;
  //   } catch (error) {
  //     console.error("Error updating status:", error);
  //   }
  // };

  const checkVitalPresent = async (visitId) => {
    clearVitalFields();
    setOpdVitalsData(null);
    setVitalsAvailable(false);

    try {
      const data = await getRequest(
        `${PATIENT_OPD_BY_VISIT}?visitId=${visitId}`,
      );

      if (data?.status === 200 && data?.response) {
        const res = data.response;

        setOpdVitalsData(res);
        setVitalsAvailable(true);
        const medications =
          getCurrentMedicationSource(res).map(mapCurrentMedication);

        if (medications.length > 0) {
          setCurrentMedications(medications);
        } else {
          setCurrentMedications([]);
        }

        setFormData((prev) => ({
          ...prev,
          height: res.height || "",
          weight: res.weight || "",
          temperature: res.temperature || "",
          systolicBP: res.bpSystolic || "",
          diastolicBP: res.bpDiastolic || "",
          pulse: res.pulse || "",
          bmi: res.bmi || "",
          rr: res.rr || "",
          spo2: res.spo2 || "",
          mlcCase: res.mlcFlag === "s" ? true : false,
        }));

        return;
      }

      setOpdVitalsData(null);
      setVitalsAvailable(false);
      clearVitalFields();
      setCurrentMedicationActions({});
    } catch (error) {
      console.error("Error fetching vital data:", error);

      setOpdVitalsData(null);
      setVitalsAvailable(false);
      clearVitalFields();
      setCurrentMedicationActions({});
    }
  };

  const handleRowClick = async (patient) => {
    await fetchCurrentMedications(patient.patientId);
    setSelectedPatient(patient);
    setCurrentMedicationActions({});
    setShowDetailView(true);

    if (patient.patientId) {
      const hospitalId =
        patient.hospitalId ||
        sessionStorage.getItem("hospitalId") ||
        localStorage.getItem("hospitalId");

      // Reset to first page when opening new patient
      await fetchPreviousVisits(
        patient.patientId,
        hospitalId,
        0,
        visitsPageSize,
      );
      await fetchPreviousVitals(
        patient.patientId,
        hospitalId,
        0,
        vitalsPageSize,
      );
      await checkVitalPresent(patient.visitId);
      
      if (patient.pregnancyDetails && pregnancyRef.current) {
      pregnancyRef.current.setData(patient.pregnancyDetails);
    }
    }
  };

  const showConfirmationPopup = (
    message,
    type = "success",
    onConfirm = null,
    onCancel = null,
    confirmText = "Yes",
    cancelText = "No",
  ) => {
    setConfirmationPopup({
      show: true,
      message,
      type,
      onConfirm,
      onCancel,
      confirmText,
      cancelText,
    });
  };

  // Add this function
  const handleConfirmPopupClose = (confirmed) => {
    const { onConfirm, onCancel } = confirmationPopup;

    if (confirmed && onConfirm) {
      onConfirm();
    } else if (!confirmed && onCancel) {
      onCancel();
    }

    setConfirmationPopup({
      show: false,
      message: "",
      type: "success",
      onConfirm: null,
      onCancel: null,
      confirmText: "Yes",
      cancelText: "No",
    });
  };

  const handleBackToList = () => {
    setShowDetailView(false);
    setSelectedPatient(null);
    setPsychiatristAssessment(null);
    if (earExaminationRef.current) {
      earExaminationRef.current.resetForm();
    }
    if (pregnancyRef.current) {
      pregnancyRef.current.resetForm();
    }
    setExpandedSections({
      personalDetails: false,
      clinicalHistory: false,
      vitalDetail: false,
      diagnosis: false,
      investigation: false,
      treatment: false,
      treatmentAdvice: false,
      procedureCare: false,
      surgeryAdvice: false,
      admissionAdvice: false,
      referral: false,
      followUp: false,
      doctorRemark: false,
      remarks: false,
      visionExamination: false,
      obgDetails: false,
      earExamination: false,
      gynaMaster: false,
    });

    // Reset Doctor's Remarks
    setDoctorRemarksText("");
    setGeneralTreatmentAdvice("");
    setReferralNotes("");
    setReferralData(defaultReferralData);
    setFollowUps({
      noOfFollowDays: "",
      followUpFlag: false,
      followUpDate: getToday(),
    });

    // Reset Admission fields
    setAdmissionAdvised(false);
    setAdmissionDate("");
    setAdmissionRemarks("");
    setWardCategory("");
    setAdmissionCareLevel("");
    setWardName("");
    setAdmissionPriority("Normal");
    setOccupiedBeds(0);
    setVacantBeds(0);

    setSelectedHistoryType("");

    // Reset template selections
    setSelectedTemplateIds(new Set());
    setSelectedTreatmentTemplateIds(new Set());

    // Reset diagnosis
    setDiagnosisItems([
      {
        icdDiagId: "",
        icdDiagnosis: "",
        communicableDisease: false,
        infectiousDisease: false,
      },
    ]);

    setWorkingDiagnosis("");

    // Reset investigations / treatments with default one row each
    setInvestigationItems([
      {
        investigationId: "",
        templateIds: [],
        displayValue: "",
        date: getToday(),
      },
    ]);

    setTreatmentItems([
      {
        treatmentId: null,
        drugId: "",
        drugName: "",
        dispUnit: "",
        dosage: "",
        frequency: "",
        days: "",
        total: "",
        instruction: "",
        stock: "0",
        templateId: "",
      },
    ]);

    // Reset form
    setFormData({
      height: "",
      weight: "",
      temperature: "",
      systolicBP: "",
      diastolicBP: "",
      pulse: "",
      bmi: "",
      rr: "",
      spo2: "",
      patientSymptoms: "",
      clinicalExamination: "",
      mlcCase: false,
      pastMedicalHistory: "",
      familyHistory: "",
      presentComplaints: "",
    });

    setErrors({});

    // Reset pagination states
    setVisitsCurrentPage(0);
    setVisitsTotalPages(0);
    setVisitsTotalElements(0);
    setVitalsCurrentPage(0);
    setVitalsTotalPages(0);
    setVitalsTotalElements(0);
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleHistoryTypeClick = (historyType) => {
    setSelectedHistoryType(historyType);
  };

  const clearVitalFields = () => {
    setFormData((prev) => ({
      ...prev,
      height: "",
      weight: "",
      temperature: "",
      systolicBP: "",
      diastolicBP: "",
      pulse: "",
      bmi: "",
      rr: "",
      spo2: "",
      mlcCase: false,
    }));
  };

  function calculateBMI(weight, height) {
    if (!weight || !height) return "";

    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);

    return bmi.toFixed(2);
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (
        (name === "weight" || name === "height") &&
        updated.height !== "" &&
        updated.weight !== ""
      ) {
        updated.bmi = calculateBMI(updated.weight, updated.height);
      }

      return updated;
    });

    // Clear field error
    if (
      errors[name] ||
      ((name === "weight" || name === "height") && errors.bmi)
    ) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
        ...((name === "weight" || name === "height") && { bmi: "" }),
      }));
    }
  };

  const showPopupMessage = (message, type = "info", onCloseCallback = null) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
        if (onCloseCallback) onCloseCallback();
      },
    });
  };

  const hasValue = (value) =>
    value !== null && value !== undefined && String(value).trim() !== "";

  const isPositiveNumber = (value) => hasValue(value) && Number(value) > 0;

  const toNumberOrNull = (value) => {
    if (!hasValue(value)) return null;
    const numberValue = Number(value);
    return Number.isNaN(numberValue) ? null : numberValue;
  };

  const firstValue = (...values) => values.find((value) => hasValue(value));

  const hasOphthalmologyExaminationData = (visionData) => {
    if (!visionData || typeof visionData !== "object") return false;

    return Object.values(visionData).some((value) => {
      if (!hasValue(value)) return false;
      return String(value).trim() !== "N";
    });
  };

  const buildOphthalmologyExaminationPayload = (visionData) => {
    if (!hasOphthalmologyExaminationData(visionData)) return null;

    return {
      patientId: selectedPatient.patientId,
      visitId: selectedPatient.visitId,
      opdDate: getToday(),
      ...visionData,
    };
  };

  const validateSubmitForm = () => {
    const nextErrors = {};
    const messages = [];

    const addError = (key, message) => {
      nextErrors[key] = message;
      messages.push(message);
    };

    const requiredVitals = [
      ["height", "Height"],
      ["weight", "Weight"],
      ["temperature", "Temperature"],
      ["systolicBP", "Systolic BP"],
      ["diastolicBP", "Diastolic BP"],
      ["pulse", "Pulse"],
      ["bmi", "BMI"],
      ["rr", "RR"],
      ["spo2", "SpO2"],
    ];

    if (!hasValue(formData.patientSymptoms)) {
      addError("patientSymptoms", "Patient signs & symptoms is required.");
    }

    requiredVitals.forEach(([key, label]) => {
      if (!hasValue(formData[key])) {
        addError(key, `${label} is required.`);
      }
    });

    const validateNumberRange = (key, label, min, max) => {
      if (!hasValue(formData[key])) return;

      const value = Number(formData[key]);
      if (Number.isNaN(value) || value < min || value > max) {
        addError(key, `${label} must be between ${min} and ${max}.`);
      }
    };

    validateNumberRange("height", "Height", 1, 300);
    validateNumberRange("weight", "Weight", 1, 500);
    validateNumberRange("temperature", "Temperature", 80, 110);
    validateNumberRange("systolicBP", "Systolic BP", 40, 300);
    validateNumberRange("diastolicBP", "Diastolic BP", 30, 200);
    validateNumberRange("pulse", "Pulse", 20, 250);
    validateNumberRange("bmi", "BMI", 1, 100);
    validateNumberRange("rr", "RR", 5, 80);
    validateNumberRange("spo2", "SpO2", 1, 100);

    if (
      hasValue(formData.systolicBP) &&
      hasValue(formData.diastolicBP) &&
      Number(formData.systolicBP) <= Number(formData.diastolicBP)
    ) {
      addError("systolicBP", "Systolic BP must be greater than diastolic BP.");
    }

    const hasWorkingDiagnosis = hasValue(workingDiagnosis);
    const hasSelectedIcdDiagnosis = diagnosisItems.some((item) =>
      hasValue(item.icdDiagId),
    );
    const hasDiagnosis = hasWorkingDiagnosis || hasSelectedIcdDiagnosis;

    if (!hasDiagnosis) {
      addError("diagnosis", "Working diagnosis or ICD diagnosis is required.");
      addError(
        "workingDiagnosis",
        "Working diagnosis or ICD diagnosis is required.",
      );
    }

    if (
      !hasWorkingDiagnosis &&
      diagnosisItems.some(
        (item) => hasValue(item.icdDiagnosis) && !item.icdDiagId,
      )
    ) {
      addError(
        "diagnosis",
        "Please select a valid ICD diagnosis from the dropdown.",
      );
    }

    if (
      investigationItems.some(
        (item) => hasValue(item.displayValue) && !item.investigationId,
      )
    ) {
      addError(
        "investigation",
        "Please select a valid investigation from the dropdown.",
      );
    }

    const invalidTreatment = treatmentItems.some((item) => {
      const rowStarted = [item.drugName, item.drugId].some(hasValue);

      if (!rowStarted) return false;

      return (
        !item.drugId ||
        !isPositiveNumber(item.dosage) ||
        !hasValue(item.frequency) ||
        !isPositiveNumber(item.days) ||
        !hasValue(item.instruction)
      );
    });

    if (invalidTreatment) {
      addError(
        "treatment",
        "Please complete drug, dosage, frequency, days and instruction for each selected treatment row.",
      );
    }

    if (followUps.followUpFlag) {
      if (!isPositiveNumber(followUps.noOfFollowDays)) {
        addError("noOfFollowDays", "Follow-up days must be greater than 0.");
      }

      if (!hasValue(followUps.followUpDate)) {
        addError("followUpDate", "Follow-up date is required.");
      }
    }

    if (admissionAdvised) {
      if (!hasValue(admissionDate)) {
        addError("admissionDate", "Admission date is required.");
      }
      if (!hasValue(admissionRemarks)) {
        addError("admissionRemarks", "Admission remarks is required.");
      }
      if (!hasValue(wardCategory)) {
        addError("wardCategory", "Ward category is required.");
      }
      if (!hasValue(admissionCareLevel)) {
        addError("admissionCareLevel", "Admission care level is required.");
      }
      if (!hasValue(wardName)) {
        addError("wardName", "Ward is required.");
      }
    }

    if (referralData.isReferred === "Yes") {
      if (!hasValue(referralData.referralDate)) {
        addError("referralDate", "Referral date is required.");
      }
      if (!hasValue(referralData.referTo)) {
        addError("referTo", "Referral type is required.");
      }
      if (
        referralData.referTo === "Internal" &&
        !hasValue(referralData.currentPriorityNo)
      ) {
        addError("currentPriorityNo", "Current priority number is required.");
      }
      if (
        referralData.referTo === "Internal" &&
        !departmentData.some(
          (item) =>
            item.selected && hasValue(item.doctor) && item.doctor !== "Select",
        )
      ) {
        addError(
          "departmentData",
          "Please select at least one department doctor for referral.",
        );
      }
      if (
        referralData.referTo === "External" &&
        !hasValue(referralData.referredHospitalName)
      ) {
        addError("referredHospitalName", "Referred hospital name is required.");
      }
      if (!hasValue(referralNotes)) {
        addError("referralNotes", "Referral notes is required.");
      }
    }

    setErrors(nextErrors);

    if (messages.length > 0) {
      setExpandedSections((prev) => ({
        ...prev,
        vitalDetail:
          prev.vitalDetail ||
          [
            "patientSymptoms",
            "height",
            "weight",
            "temperature",
            "systolicBP",
            "diastolicBP",
            "pulse",
            "bmi",
            "rr",
            "spo2",
          ].some((key) => nextErrors[key]),
        clinicalHistory:
          prev.clinicalHistory || Boolean(nextErrors.patientSymptoms),
        diagnosis:
          prev.diagnosis ||
          Boolean(nextErrors.diagnosis || nextErrors.workingDiagnosis),
        investigation: prev.investigation || Boolean(nextErrors.investigation),
        treatment: prev.treatment || Boolean(nextErrors.treatment),
        admissionAdvice:
          prev.admissionAdvice ||
          [
            "admissionDate",
            "admissionRemarks",
            "wardCategory",
            "admissionCareLevel",
            "wardName",
          ].some((key) => nextErrors[key]),
        referral:
          prev.referral ||
          [
            "referralDate",
            "referTo",
            "currentPriorityNo",
            "departmentData",
            "referredHospitalName",
            "referralNotes",
          ].some((key) => nextErrors[key]),
        followUp:
          prev.followUp ||
          ["noOfFollowDays", "followUpDate"].some((key) => nextErrors[key]),
      }));
      showPopupMessage(messages[0], "error");
      return false;
    }

    return true;
  };

  const handleWardNameChange = async (deptId) => {
    setWardName(deptId);

    const selectedWard = wardDepartments.find(
      (dept) => Number(dept.id) === Number(deptId),
    );

    if (selectedWard) {
      setOccupiedBeds(selectedWard.occupiedBed || "0");
      setVacantBeds(selectedWard.vacantBed || "0");
    }
    if (deptId) {
      try {
        const response = await getRequest(`${MAS_BED_COUNT}/${deptId}`);
        if (response?.status === 200 && response?.response) {
          setOccupiedBeds(response.response.occupied || "0");
          setVacantBeds(response.response.available || "0");
        }
      } catch (error) {
        console.error("Error fetching bed status:", error);
      }
    }

    if (errors.wardName) {
      setErrors((prev) => ({
        ...prev,
        wardName: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validateSubmitForm()) return;
    try {
      setIsSubmitting(true);

      let pregnancyData = null;
      if (
        selectedPatient?.gender?.toLowerCase() === "female" &&
        pregnancyRef.current &&
        pregnancyRef.current.getData
      ) {
        pregnancyData = pregnancyRef.current.getData();
      }

      let visionExaminationData = null;
      if (visionRef.current && visionRef.current.getData) {
        visionExaminationData = visionRef.current.getData();
      }
      const ophthalmologyExaminationDetails = isOphthalmologyDepartment
        ? buildOphthalmologyExaminationPayload(visionExaminationData)
        : null;

      let entExaminationDetails = null;
      if (isEntDepartment && earExaminationRef.current) {
        entExaminationDetails = earExaminationRef.current.getData();
      }

      let obgDetailsData = null;
      if (isObgynDepartment && obgDetailsRef.current) {
        obgDetailsData = obgDetailsRef.current.getData();
      }

      // ICD Diagnoses
      const icdDiagList = diagnosisItems
        .filter((item) => hasValue(item.icdDiagId))
        .map((item) => ({
          icdId: item.icdDiagId,
          icdDiagnosisName: item.icdDiagnosis || "",
        }));

      // Investigations mapping → backend format
      const invalidInvestigation = investigationItems.some(
        (item) => item.displayValue?.trim() && !item.investigationId,
      );

      if (invalidInvestigation) {
        showPopupMessage(
          "Please select a valid investigation from the dropdown before saving.",
          "error",
        );
        return;
      }

      const investigationList = investigationItems
        .filter((item) => item.investigationId)
        .map((item) => ({
          id: item.investigationId,
          investigationName: item.displayValue,
          investigationDate: item.date,
        }));

      const treatmentList = treatmentItems
        .filter((item) => {
          const hasDrug =
            item.drugId || (item.drugName && item.drugName.trim());
          const hasDosage = item.dosage && item.dosage.toString().trim();
          const hasFrequency = item.frequency && item.frequency.trim();
          const hasDays = item.days && item.days.toString().trim();
          const hasInstruction = item.instruction && item.instruction.trim();

          return (
            hasDrug && hasDosage && hasFrequency && hasDays && hasInstruction
          );
        })
        .map((item) => {
          const freq = allFrequencies.find(
            (f) =>
              f.frequencyName == item.frequency ||
              Number(f.frequencyId) == Number(item.frequency),
          );
          return {
            itemId: item.drugId,
            dosage: item.dosage,
            frequency: item.frequency || "",
            days: item.days,
            total: item.total,
            instraction: item.instruction,
          };
        });

      const selectedWardCategory = wardCategories.find(
        (category) => Number(category.categoryId) === Number(wardCategory),
      );
      const selectedWard = wardDepartments.find(
        (ward) => Number(ward.id) === Number(wardName),
      );
      const mappedDepartmentId = toNumberOrNull(
        firstValue(
          sessionStorage.getItem("departmentId"),
          localStorage.getItem("departmentId"),
        ),
      );
      const mappedHospitalId = toNumberOrNull(
        firstValue(
          sessionStorage.getItem("hospitalId"),
          localStorage.getItem("hospitalId"),
        ),
      );
      const mappedDoctorId = toNumberOrNull(
        firstValue(
          searchFilters.doctorList,
          sessionStorage.getItem("userId"),
          localStorage.getItem("userId"),
        ),
      );

      if (!mappedDepartmentId || !mappedHospitalId || !mappedDoctorId) {
        showPopupMessage(
          "Department, hospital and doctor details are required before submitting.",
          "error",
        );
        return;
      }

      const payload = {
        // ===== Mapping IDs =====
        opdPatientDetailId: vitalsAvailable
          ? opdVitalsData.opdPatientDetailsId
          : null,
        patientId: selectedPatient.patientId,
        visitId: selectedPatient.visitId,
        departmentId: mappedDepartmentId,
        hospitalId: mappedHospitalId,
        doctorId: mappedDoctorId,

        // ===== Clinical History =====
        patientSignsSymptoms: formData.patientSymptoms ?? null,
        clinicalExamination: formData.clinicalExamination ?? null,
        pastMedicalHistory: formData.pastHistory ?? null,
        familyHistory: formData.familyHistory ?? null,
        // presentComplaints: formData.patientSymptoms ?? null,

        ...(isOphthalmologyDepartment && {
          ophthalmologyExaminationDetails,
        }),

        ...(isObgynDepartment &&
          obgDetailsData && {
            opdObgDetailsRequest: obgDetailsData,
          }),

        ...(isEntDepartment &&
          entExaminationDetails && {
            entExaminationDetails: entExaminationDetails,
          }),

        ...(selectedPatient?.gender?.toLowerCase() === "female" &&
          pregnancyData && {
            pregnancyDetails: pregnancyData,
          }),

        ...(psychiatristAssessment?.topicId && {
          topicId: Number(psychiatristAssessment.topicId),
          details: psychiatristAssessment.details || [],
        }),

        // ===== Vital =====
        height: formData.height,
        weight: formData.weight,
        pulse: formData.pulse,
        temperature: formData.temperature,
        rr: formData.rr,
        bmi: formData.bmi,
        spo2: formData.spo2,
        bpSystolic: formData.systolicBP,
        bpDiastolic: formData.diastolicBP,
        mlcFlag: formData.mlcCase ? FLAG.FLAG_Y : FLAG.FLAG_N,

        // ===== Diagnosis =====
        workingDiagnosis: workingDiagnosis,
        icdDiagnosis: icdDiagList,

        // ===== Investigation =====
        labFlag: labFlag,
        radioFlag: radioFlag,
        investigation: investigationList,

        // ===== Treatment =====
        treatment: treatmentList,
        treatmentAdvice: generalTreatmentAdvice,

        // ======== procedureCare =======
        // procedureCare: procedureCareItems.map(item => ({
        //   procedureId: Number(item.id),
        //   procedureName: item.name,
        //   frequencyId: Number(item.frequency),
        //   noOfDays: Number(item.days),
        //   remarks: item.remarks
        // })),

        // ===== Doctor's Remarks =====
        doctorRemarks: doctorRemarksText,

        // ======== follow up =====
        followUpFlag: followUps.followUpFlag ? FLAG.FLAG_Y : FLAG.FLAG_N,
        followUpDate:
          followUps.followUpFlag && followUps.followUpDate
            ? new Date(followUps.followUpDate).toISOString()
            : null,
        followUpDays: followUps.followUpFlag
          ? Number(followUps.noOfFollowDays)
          : 0,

        // ===== Admission Details =====

        admissionFlag: admissionAdvised ? FLAG.FLAG_Y : FLAG.FLAG_N,
        admissionAdvisedDate:
          admissionAdvised && admissionDate
            ? new Date(admissionDate).toISOString()
            : null,
        admissionRemarks: admissionAdvised ? admissionRemarks : null,
        admissionCareLevel: admissionAdvised
          ? Number(selectedWardCategory?.careId ?? admissionCareLevel)
          : null,
        admissionWardCategory: admissionAdvised
          ? Number(selectedWardCategory?.categoryId ?? wardCategory)
          : null,
        admissionWard: admissionAdvised
          ? Number(selectedWard?.id ?? wardName)
          : null,
        admissionPriority: admissionAdvised ? admissionPriority : null,

        // ================= Referal ================
        referralFlag:
          referralData.isReferred === "Yes" ? FLAG.FLAG_Y : FLAG.FLAG_N,
        referralRemarks: referralNotes,
        referralDate: referralData.referralDate
          ? new Date(referralData.referralDate).toISOString()
          : null,
        referTo:
          referralData.isReferred === "Yes" ? referralData.referTo : null,
        referredHospitalName:
          referralData.isReferred === "Yes" &&
          referralData.referTo === "External"
            ? referralData.referredHospitalName
            : null,
      };

      const response = await postRequest(
        `${OPD_CREATE_PATIENT_DETAILS}`,
        payload,
      );

      if (response?.status === 200 || response?.success === true) {
        const indentMId = response.response?.indentMId;
        const visitId = response.response?.visitId || selectedPatient.visitId; // Capture visit ID

        showConfirmationPopup(
          "Patient consultation submitted successfully!",
          "success",
          () => {
            navigate("/ViewDownLoadReport", {
              state: {
                reportUrl: `${ALL_REPORTS}/opdCaseSheetReport?visitId=${visitId}`,
                title: INDENT_SAVE_TITLE,
                fileName: INDENT_SAVE_FILE_NAME,
                returnPath: window.location.pathname,
                visitId: response.response?.visitId || selectedPatient.visitId,
              },
            });
            handleBackToList();
          },
          () => {
            fetchWaitingList();
            handleBackToList();
          },
          "View Report",
          "Back to List",
        );
      } else {
        showConfirmationPopup(
          "Updated but unexpected response received.",
          "error",
          null,
          null,
          "OK",
          "Close",
        );
      }
    } catch (error) {
      console.error("Update Error:", error);
      showConfirmationPopup(
        "Failed to Submit Data. Please try again.",
        "error",
        null,
        null,
        "OK",
        "Close",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    // Reset main form data
    setFormData({
      height: "",
      weight: "",
      temperature: "",
      systolicBP: "",
      diastolicBP: "",
      pulse: "",
      bmi: "",
      rr: "",
      spo2: "",
      patientSymptoms: "",
      clinicalExamination: "",
      mlcCase: false,
      pastMedicalHistory: "",
      familyHistory: "",
      presentComplaints: "",
      pastHistory: "",
    });

    if (pregnancyRef.current) {
      pregnancyRef.current.resetForm();
    }

    // Reset diagnosis
    setDiagnosisItems([
      {
        icdDiagId: "",
        icdDiagnosis: "",
        communicableDisease: false,
        infectiousDisease: false,
      },
    ]);

    // Reset followUps to default
    setGeneralTreatmentAdvice("");
    setReferralNotes("");
    setReferralData(defaultReferralData);
    setFollowUps({
      noOfFollowDays: "",
      followUpFlag: false,
      followUpDate: getToday(),
    });

    // Important resets for templates
    setSelectedTreatmentTemplateIds(new Set());
    setSelectedTemplateIds(new Set());

    // Reset doctor remarks
    setDoctorRemarksText("");

    // Reset Admission fields
    setAdmissionAdvised(false);
    setAdmissionDate("");
    setAdmissionRemarks("");
    setWardCategory("");
    setAdmissionCareLevel("");
    setWardName("");
    setAdmissionPriority("Normal");
    setOccupiedBeds(0);
    setVacantBeds(0);

    // Reset working diagnosis
    setWorkingDiagnosis("");

    // Reset investigations with one default row
    setInvestigationItems([
      {
        investigationId: "",
        templateIds: [],
        name: "",
        date: getToday(),
      },
    ]);

    // Reset treatments with one default row
    setTreatmentItems([
      {
        treatmentId: null,
        drugId: "",
        drugName: "",
        dispUnit: "",
        dosage: "",
        frequency: "",
        days: "",
        total: "",
        instruction: "",
        stock: "0",
        templateId: "",
      },
    ]);

    setPsychiatristAssessment(null);

    // Reset form errors
    setErrors({});
  };

  const handleRelease = (patientId) => {
    setWaitingList((prevList) => {
      // Copy the list to avoid mutation
      const updatedList = [...prevList];

      // Find index of clicked item
      const index = updatedList.findIndex((item) => item.id === patientId);
      if (index === -1) return prevList;

      // Take out that item and update status
      const itemToMove = { ...updatedList[index], visitStatus: "released" };

      // Remove from current position
      updatedList.splice(index, 1);

      // Determine the target index (after 5th item → index 5)
      const targetIndex = Math.min(5, updatedList.length); // in case list has <5 items

      // Insert item at target position
      updatedList.splice(targetIndex, 0, itemToMove);

      // ---- Keep pagination stable ----
      const totalPagesNow = Math.ceil(updatedList.length / itemsPerPage);
      const firstIndexOfPage = (currentPage - 1) * itemsPerPage;

      // If current page becomes empty → go to previous page
      if (firstIndexOfPage >= updatedList.length && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }

      return updatedList;
    });
  };

  // CLOSE BUTTON
  const handleClose = async (visitId) => {
    try {
      const response = await putRequest(
        `${OPD_PATIENT}/changeStatusForClose/${visitId}/x`,
      );

      if (response?.status === 200) {
        showPopupMessage("Update successfully.", "success");
        handleSearch();
      } else {
        showPopupMessage("Failed to update. Please try again.", "error");
      }
    } catch (error) {
      showPopupMessage("Failed to update. Please try again.", "error");
    }
  };

  const handleCreateTemplate = () => {
    setShowCreateTemplateModal(true);
    setTemplateName("");
    setInvestigationItems([{ displayValue: "", date: getToday() }]);
  };

  const handleUpdateTemplate = () => {
    setShowUpdateTemplateModal(true);
    setUpdateTemplateSelection("Select..");
  };

  const handleAddInvestigationItem = () => {
    setInvestigationItems((prev) => [
      ...prev,
      { displayValue: "", date: getToday() },
    ]);
  };

  const handleRemoveInvestigationItem = (index) => {
    const itemToRemove = investigationItems[index];
    const onlyOneRow = investigationItems.length === 1;
    const isEmptyRow =
      !itemToRemove.displayValue &&
      (!itemToRemove.templateIds || itemToRemove.templateIds.length === 0) &&
      !itemToRemove.date;

    if (onlyOneRow && isEmptyRow) {
      return;
    }

    let updatedItems = investigationItems.filter((_, i) => i !== index);

    if (onlyOneRow) {
      updatedItems = [
        { id: null, templateIds: [], displayValue: "", date: getToday() },
      ];
    }

    setInvestigationItems(updatedItems);
  };

  const handleInvestigationItemChange = (index, field, value) => {
    const newItems = [...investigationItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setInvestigationItems(newItems);
  };

  const handleSaveTemplate = () => {
    if (templateName.trim()) {
      setTemplates([...templates, templateName]);
      setShowCreateTemplateModal(false);
      setTemplateName("");
      setInvestigationItems([{ displayValue: "", date: getToday() }]);
    }
  };

  const handleResetTemplate = () => {
    setTemplateName("");
    setInvestigationItems([{ displayValue: "", date: getToday() }]);
  };

  const handleCloseModal = () => {
    setShowCreateTemplateModal(false);
    setShowUpdateTemplateModal(false);
    setShowTreatmentAdviceModal(false);
    setTemplateName("");
    setInvestigationItems([{ displayValue: "", date: getToday() }]);
    setUpdateTemplateSelection("Select..");
    setTreatmentAdviceSelection("");
    setSelectedTreatmentAdviceItems([]);
    setTreatmentAdviceModalType("");
  };

  const handleAddDiagnosisItem = () => {
    setDiagnosisItems([
      ...diagnosisItems,
      {
        icdDiagId: "",
        icdDiagnosis: "",
        communicableDisease: false,
        infectiousDisease: false,
      },
    ]);
  };

  const handleRemoveDiagnosisItem = (index) => {
    const itemToRemove = diagnosisItems[index];
    const onlyOneRow = diagnosisItems.length === 1;
    const isEmptyRow =
      !itemToRemove.icdDiagId &&
      !itemToRemove.icdDiagnosis &&
      !itemToRemove.communicableDisease &&
      !itemToRemove.infectiousDisease;

    if (onlyOneRow && isEmptyRow) {
      return;
    }

    let newItems = diagnosisItems.filter((_, i) => i !== index);

    if (onlyOneRow) {
      newItems = [
        {
          id: null,
          icdDiagId: "",
          icdDiagnosis: "",
          communicableDisease: false,
          infectiousDisease: false,
        },
      ];
    }

    setDiagnosisItems(newItems);
  };

  const handleDiagnosisChange = (index, field, value) => {
    const newItems = [...diagnosisItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setDiagnosisItems(newItems);
  };

  const handleAddTreatmentItem = () => {
    setTreatmentItems([
      ...treatmentItems,
      {
        drugName: "",
        dispUnit: "",
        dosage: "",
        frequency: "",
        days: "",
        total: "",
        instruction: "",
        stock: "0",
        treatmentId: "",
      },
    ]);
  };

  const calculateTotal = (item) => {
    if (!item.frequency || item.itemClassId == null) {
      return "";
    }

    const dosage = Number(item.dosage);
    const days = Number(item.days);

    if (dosage === 0 || days === 0) {
      return "0";
    }

    if (isNaN(dosage) || isNaN(days)) {
      return "";
    }

    const selectedFrequency = allFrequencies.find(
      (f) =>
        f.frequencyName === item.frequency ||
        Number(f.frequencyId) === Number(item.frequency),
    );

    const frequencyMultiplier = selectedFrequency
      ? Number(selectedFrequency.feq)
      : 1;

    let total = 0;
    // SOLID types: TABLET(1), CAPSULE(2)
    if (DRUG_TYPE.SOLID.includes(Number(item.itemClassId))) {
      total = Math.ceil(dosage * frequencyMultiplier * days);
    }

    // LIQUID types: EARDROPS(7), LIQUID(15), EYEEARDROPS(52), SYRUP(57)
    else if (DRUG_TYPE.LIQUID.includes(Number(item.itemClassId))) {
      const qtyPerUnit = Number(item.aDispQty) || 1;

      total = Math.ceil((dosage * frequencyMultiplier * days) / qtyPerUnit);
    } else {
      total = 1;
    }

    return total.toString();
  };

  const mapCurrentMedication = (item, index) => ({
    id:
      item.id ??
      item.treatmentId ??
      item.opdTreatmentId ??
      item.itemId ??
      item.drugId ??
      `current-med-${index}`,
    drugId: item.drugId ?? item.itemId ?? "",
    drugName:
      item.drugName ??
      item.itemName ??
      item.nomenclature ??
      item.displayValue ??
      "",
    dispUnit: item.dispUnit ?? item.dispUnitName ?? item.dispU ?? "",
    dosage: item.dosage ?? "",
    days: item.days ?? item.noOfDays ?? "",
    frequency:
      item.frequency ??
      item.frequencyName ??
      item.frequencyCode ??
      item.frequencyId ??
      "",
    total: item.total ?? item.totalQty ?? "",
    stock: item.stock ?? item.stocks ?? "0",
    prescribedBy: item.prescribedBy ?? item.doctorName ?? "",
    department: item.department ?? item.departmentName ?? "",
    prescribedDate:
      item.prescribedDate ?? item.createdDate ?? item.opdDate ?? "",
    instruction: item.instruction ?? "",
    itemClassId: item.itemClassId ?? null,
    aDispQty: item.aDispQty ?? item.adispQty ?? 1,
  });

  const getCurrentMedicationSource = (data) =>
    data?.currentMedications ??
    data?.medications ??
    data?.treatments ??
    data?.treatment ??
    data?.opdTreatments ??
    data?.opdTreatmentList ??
    [];

  const addCurrentMedicationToTreatment = (medication) => {
    if (!medication?.drugName) return;

    setTreatmentItems((prev) => {
      const alreadyAdded = prev.some((item) => {
        if (medication.drugId && item.drugId === medication.drugId) return true;
        return (
          item.drugName?.trim().toLowerCase() ===
          medication.drugName.trim().toLowerCase()
        );
      });

      if (alreadyAdded) {
        showPopupMessage(
          "Selected medication is already added in treatment.",
          "info",
        );
        return prev;
      }

      const repeatedItem = {
        treatmentId: null,
        drugId: medication.drugId,
        drugName: medication.drugName,
        dispUnit: medication.dispUnit,
        dosage: medication.dosage,
        frequency: medication.frequency,
        days: medication.days,
        total: medication.total,
        instruction: medication.instruction,
        stock: medication.stock || "0",
        templateId: "",
        itemClassId: medication.itemClassId,
        aDispQty: medication.aDispQty,
      };

      if (isOnlyDefaultTreatmentRow(prev)) {
        return [repeatedItem];
      }

      return [...prev, repeatedItem];
    });
  };

  const handleCurrentMedicationAction = (medication, action) => {
    setCurrentMedicationActions((prev) => ({
      ...prev,
      [medication.id]: prev[medication.id] === action ? "" : action,
    }));

    if (
      action === "repeat" &&
      currentMedicationActions[medication.id] !== action
    ) {
      addCurrentMedicationToTreatment(medication);
    }
  };

  const handleRemoveTreatmentItem = (index) => {
    const itemToRemove = treatmentItems[index];
    const isLastRow = index === treatmentItems.length - 1;
    const onlyOneRow = treatmentItems.length === 1;
    const isEmptyRow =
      !itemToRemove.drugName &&
      !itemToRemove.dispUnit &&
      !itemToRemove.dosage &&
      !itemToRemove.frequency &&
      !itemToRemove.days &&
      !itemToRemove.total &&
      !itemToRemove.instruction &&
      itemToRemove.stock === "0" &&
      !itemToRemove.treatmentId;

    if (onlyOneRow && isEmptyRow) {
      return;
    }

    let newItems = treatmentItems.filter((_, i) => i !== index);

    if (onlyOneRow) {
      newItems = [
        {
          drugName: "",
          dispUnit: "",
          dosage: "",
          frequency: "",
          days: "",
          total: "",
          instruction: "",
          stock: "0",
          treatmentId: "",
        },
      ];
    }

    setTreatmentItems(newItems);
  };

  const handleTreatmentChange = (index, field, value) => {
    const updated = [...treatmentItems];
    updated[index] = { ...updated[index], [field]: value };

    // fields that should trigger recalculation
    const recalcFields = [
      "dosage",
      "days",
      "frequency",
      "itemClassId",
      "aDispQty",
    ];

    if (recalcFields.includes(field)) {
      updated[index].total = calculateTotal(updated[index]);
    }

    setTreatmentItems(updated);
    if (errors.treatment) {
      setErrors((prev) => ({
        ...prev,
        treatment: "",
      }));
    }
  };

  const handleOpenTreatmentAdviceModal = (type) => {
    setTreatmentAdviceModalType(type);
    setShowTreatmentAdviceModal(true);
    setSelectedTreatmentAdviceItems([]);
  };

  const handleTreatmentAdviceCheckboxChange = (index) => {
    setSelectedTreatmentAdviceItems((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const handleSaveTreatmentAdvice = () => {
    const selected = selectedTreatmentAdviceItems
      .map((i) => treatmentAdviceTemplates[i])
      .join(", ");

    if (treatmentAdviceModalType === "general") {
      setGeneralTreatmentAdvice(selected);
    } else if (treatmentAdviceModalType === "procedure") {
      setProcedureTreatmentAdvice(selected);
    } else if (treatmentAdviceModalType === "physiotherapy") {
      setPhysiotherapyTreatmentAdvice(selected);
    }

    handleCloseModal();
  };

  useEffect(() => {
    if (investigationTypes.length > 0 && !investigationType) {
      const firstType = investigationTypes[0];
      setInvestigationType(firstType.id);

      if (firstType.name === "Laboratory") {
        setLabFlag(FLAG.FLAG_Y);
        setRadioFlag(FLAG.FLAG_N);
      } else if (firstType.name === "Radiology") {
        setRadioFlag(FLAG.FLAG_Y);
        setLabFlag(FLAG.FLAG_N);
      }
    }
  }, [investigationTypes]);

  const handleClearAllTreatmentTemplates = () => {
    setSelectedTreatmentTemplateIds(new Set());

    setTreatmentItems((prev) => {
      const updated = prev
        .map((item) => {
          const templateList = (item.templateId ?? "").trim();
          if (item.treatmentId != null) {
            return {
              ...item,
              templateId: "",
            };
          }

          if (templateList === "") {
            return {
              ...item,
              templateId: "",
            };
          }
          return null;
        })
        .filter((item) => item !== null);
      if (updated.length === 0) {
        return [
          {
            treatmentId: null,
            drugId: "",
            drugName: "",
            dispUnit: "",
            dosage: "",
            frequency: "",
            days: "",
            total: "",
            instruction: "",
            stock: "",
            templateId: "",
          },
        ];
      }

      return updated;
    });
  };

  const handleAddProcedureCareItem = () => {
    setProcedureCareItems([
      ...procedureCareItems,
      {
        name: "",
        frequency: "",
        days: "",
        remarks: "",
      },
    ]);
  };

  const handleRemoveProcedureCareItem = (index) => {
    const itemToDelete = procedureCareItems[index];
    const onlyOneRow = procedureCareItems.length === 1;
    const isEmptyRow =
      !itemToDelete.procedureId &&
      !itemToDelete.procedureName &&
      !itemToDelete.frequencyId &&
      !itemToDelete.noOfDays &&
      !itemToDelete.remarks;

    if (onlyOneRow && isEmptyRow) {
      return;
    }

    let newItems = procedureCareItems.filter((_, i) => i !== index);

    if (onlyOneRow) {
      newItems = [
        {
          id: null,
          procedureId: null,
          procedureName: "",
          frequencyId: null,
          noOfDays: "",
          remarks: "",
        },
      ];
    }

    setProcedureCareItems(newItems);
  };

  const handleProcedureCareChange = (index, field, value) => {
    const newItems = [...procedureCareItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setProcedureCareItems(newItems);
  };

  const handleAddPhysiotherapyItem = () => {
    setPhysiotherapyItems([
      ...physiotherapyItems,
      {
        name: "",
        frequency: "",
        days: "",
        remarks: "",
      },
    ]);
  };

  const getFreqDetails = (feqId) => {
    return allFrequencies.find((d) => d.frequencyId === feqId);
  };

  const handleTreatmentTemplateSelect = (templateId) => {
    if (!templateId || templateId === "Select..") return;

    if (selectedTreatmentTemplateIds.has(templateId)) return;

    const template = opdTemplateData.find((t) => t.templateId == templateId);
    if (!template || !template.treatments) return;

    setTreatmentItems((prevList) => {
      const updatedList = [...prevList];
      const existingDrugIds = updatedList.map((i) => i.drugId);

      const duplicateItems = [];
      const newItemsToAdd = [];

      template.treatments.forEach((t) => {
        if (existingDrugIds.includes(t.itemId)) {
          duplicateItems.push(t);

          updatedList.forEach((row) => {
            if (row.drugId === t.itemId) {
              const oldIds = row.templateId ? row.templateId.split(",") : [];

              if (!oldIds.includes(String(templateId))) {
                row.templateId = [...oldIds, String(templateId)].join(",");
              }
            }
          });
        } else {
          newItemsToAdd.push(t);
        }
      });

      if (duplicateItems.length > 0) {
        setDuplicateItems(duplicateItems);
        setShowDuplicatePopup(true);
      }

      const formattedNew = newItemsToAdd.map((t) => {
        const freName = getFreqDetails(t.frequencyId);

        const newItem = {
          treatmentId: null,
          drugId: t.itemId,
          drugName: t.itemName,
          dispUnit: t?.dispUnit ?? "",
          dosage: t.dosage ?? "",
          frequency: freName?.frequencyName ?? "",
          days: t.noOfDays ?? "",
          instruction: t.instruction ?? "",
          stock: t.stocks ?? "",
          templateId: String(templateId),

          // 🟢 MOST IMPORTANT FIELDS (MISSING EARLIER)
          itemClassId: t?.itemClassId ?? null,
          aDispQty: t?.aDispQty ?? 1,
        };

        // 🟢 AUTO CALCULATE TOTAL
        newItem.total = calculateTotal(newItem);

        return newItem;
      });

      if (isOnlyDefaultTreatmentRow(updatedList)) {
        return formattedNew;
      }

      return [...updatedList, ...formattedNew];
    });

    setSelectedTreatmentTemplateIds((prev) => new Set([...prev, templateId]));
    setSelectedTreatmentTemplateId("Select..");
  };

  const handleAdmissionAdvisedChange = (e) => {
    const checked = e.target.checked;
    setAdmissionAdvised(checked);

    if (!checked) {
      // Reset all related fields
      setAdmissionDate("");
      setAdmissionRemarks("");
      setWardCategory("");
      setAdmissionCareLevel("");
      setAdmissionCareLevelName("");
      setWardName("");
      setWardDepartments([]);
      setAdmissionPriority("Normal");
      setOccupiedBeds("");
      setVacantBeds("");
    } else {
      setAdmissionDate((prev) => prev || getToday());
      setAdmissionPriority((prev) => prev || "Normal");
    }

    setErrors((prev) => ({
      ...prev,
      admissionDate: "",
      admissionRemarks: "",
      wardCategory: "",
      admissionCareLevel: "",
      wardName: "",
    }));
  };

  const handleFollowUpChange = (e) => {
    const checked = e.target.checked;

    setFollowUps({
      followUpFlag: checked,
      noOfFollowDays: checked ? followUps.noOfFollowDays : "",
      followUpDate: checked ? followUps.followUpDate || getToday() : "",
    });

    setErrors((prev) => ({
      ...prev,
      noOfFollowDays: "",
      followUpDate: "",
    }));
  };

  const handleRemovePhysiotherapyItem = (index) => {
    const itemToRemove = physiotherapyItems[index];
    const onlyOneRow = physiotherapyItems.length === 1;
    const isEmptyRow =
      !itemToRemove.name &&
      !itemToRemove.frequency &&
      !itemToRemove.days &&
      !itemToRemove.remarks;

    if (onlyOneRow && isEmptyRow) {
      return;
    }

    let newItems = physiotherapyItems.filter((_, i) => i !== index);

    if (onlyOneRow) {
      newItems = [
        {
          name: "",
          frequency: "",
          days: "",
          remarks: "",
        },
      ];
    }

    setPhysiotherapyItems(newItems);
  };

  const handlePhysiotherapyChange = (index, field, value) => {
    const newItems = [...physiotherapyItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setPhysiotherapyItems(newItems);
  };

  const handleAddSurgeryItem = () => {
    setSurgeryItems([
      ...surgeryItems,
      {
        surgery: "",
        selected: false,
      },
    ]);
  };

  const handleRemoveSurgeryItem = (index) => {
    if (surgeryItems.length === 1) return;
    const newItems = surgeryItems.filter((_, i) => i !== index);
    setSurgeryItems(newItems);
  };

  const handleSurgerySearchChange = (value, index) => {
    setSurgerySearchInput(value);
    setIsSurgeryDropdownVisible(true);
    setSelectedSurgeryIndex(index);
  };

  const handleSurgerySelect = (surgery, index) => {
    const newItems = [...surgeryItems];
    newItems[index] = { ...newItems[index], surgery: surgery.name };
    setSurgeryItems(newItems);
    setSurgerySearchInput("");
    setIsSurgeryDropdownVisible(false);
  };

  const handleSurgeryChange = (index, field, value) => {
    const newItems = [...surgeryItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setSurgeryItems(newItems);
  };

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = waitingList.slice(indexOfFirst, indexOfLast);

  const calculateFollowUpDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + Number(days || 0));
    return date.toISOString().split("T")[0];
  };

  // PRIORITY COLOR
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Priority-1":
        return "bg-danger text-white";
      case "Priority-2":
        return "bg-warning text-dark";
      case "Priority-3":
        return "bg-success text-white";
      default:
        return "bg-secondary text-white";
    }
  };

  if (showDetailView && selectedPatient) {
    return (
      <div className="content-wrapper">
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="card-title p-2 mb-0">
                    PATIENT CONSULTATION - {selectedPatient.patientName}
                  </h4>
                  <button
                    className="btn btn-secondary"
                    onClick={handleBackToList}
                  >
                    <i className="mdi mdi-arrow-left"></i> Back to List
                  </button>
                </div>
              </div>

              {popupMessage && (
                <Popup
                  message={popupMessage.message}
                  type={popupMessage.type}
                  onClose={popupMessage.onClose}
                />
              )}

              <DuplicatePopup
                show={showDuplicatePopup}
                duplicates={duplicateItems}
                onClose={() => setShowDuplicatePopup(false)}
              />

              <div className="mb-3 card" style={{ border: "none" }}>
                <div className="card-header py-3">
                  <h6 className="mb-0 fw-bold">Personal Details</h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-9">
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="mobileNo">
                            Mobile No.
                          </label>
                          <input
                            type="text"
                            id="mobileNo"
                            name="mobileNo"
                            value={selectedPatient.mobileNo || ""}
                            className="form-control"
                            maxLength={10}
                            placeholder="Enter Mobile Number"
                            readOnly
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="gender">
                            Gender
                          </label>
                          <input
                            type="text"
                            id="gender"
                            name="gender"
                            value={selectedPatient.gender || ""}
                            className="form-control"
                            placeholder="Select"
                            readOnly
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="relation">
                            Relation
                          </label>
                          <input
                            type="text"
                            id="relation"
                            value={selectedPatient.relation || ""}
                            name="relation"
                            className="form-control"
                            placeholder="Select"
                            readOnly
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="dob">
                            DOB
                          </label>
                          <input
                            type="text"
                            id="dob"
                            value={formatDateForDisplay(selectedPatient.dob)}
                            name="dob"
                            className="form-control"
                            placeholder="dd/mm/yyyy"
                            readOnly
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="age">
                            Age
                          </label>
                          <input
                            type="text"
                            id="age"
                            name="age"
                            value={selectedPatient.age || ""}
                            className="form-control"
                            placeholder="Enter Age"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-center">
                        <div className="card p-3 shadow">
                          <img
                            src={placeholderImage || "/placeholder.svg"}
                            alt="Profile photo"
                            className="img-fluid border"
                            style={{
                              width: "100%",
                              height: "150px",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-body">
                {/* Clinical History Section */}
                <div className="card mb-3 shadow-sm">
                  <div
                    className="card-header py-3   d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection("clinicalHistory")}
                  >
                    <h6 className="mb-0 fw-bold">Clinical History</h6>
                    <span style={{ fontSize: "18px" }}>
                      {expandedSections.clinicalHistory ? "−" : "+"}
                    </span>
                  </div>

                  {expandedSections.clinicalHistory && (
                    <div className="card-body">
                      <div className="row">
                        {/* Sidebar Buttons */}
                        <div className="col-md-3">
                          <div className="d-flex flex-column gap-2">
                            {[
                              {
                                id: "previous-visits",
                                label: "Previous Visits",
                              },
                              {
                                id: "previous-vitals",
                                label: "Previous Vitals",
                              },
                              {
                                id: "previous-lab",
                                label: "Previous Lab Investigation",
                              },
                              {
                                id: "previous-ecg",
                                label: "Previous ECG Investigation",
                              },
                              { id: "audit-history", label: "Audit History" },
                              { id: "psychiatrist", label: "Psychiatrist" },
                            ].map((btn) => (
                              <button
                                key={btn.id}
                                className={`btn btn-sm ${selectedHistoryType === btn.id ? "btn-primary" : "btn-outline-primary"}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (btn.id === "previous-visits") {
                                    console.log(
                                      "Opening Previous Visits Modal",
                                    );
                                    setClinicalPopupType("visits");
                                    setShowPopup(true);
                                  } else if (btn.id === "previous-vitals") {
                                    console.log(
                                      "Opening Previous Vitals Modal",
                                    );
                                    setClinicalPopupType("vitals");
                                    setShowPopup(true);
                                  } else if (btn.id === "psychiatrist") {
                                    setClinicalPopupType("psychiatrist");
                                    setShowPopup(true);
                                    handleHistoryTypeClick(btn.id);
                                  } else {
                                    handleHistoryTypeClick(btn.id);
                                  }
                                }}
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Input Area */}
                        <div className="col-md-9">
                          {/* Symptoms */}
                          <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center">
                              <label className="form-label fw-bold m-0">
                                Patient signs & symptoms
                              </label>

                              {/* <button
                                className="btn btn-sm btn-outline-success p-1 px-2"
                                onClick={() => openPopup("symptoms")}
                              >
                                +
                              </button> */}
                            </div>
                            <input
                              type="text"
                              className={`form-control mt-3 ${errors.patientSymptoms ? "is-invalid" : ""}`}
                              name="patientSymptoms"
                              value={formData.patientSymptoms}
                              onChange={handleChange}
                              placeholder="Enter symptoms"
                            />
                            {errors.patientSymptoms && (
                              <div className="invalid-feedback d-block">
                                {errors.patientSymptoms}
                              </div>
                            )}
                          </div>

                          {/* Clinical Examination */}
                          <div className="mb-3">
                            <label className="form-label fw-bold">
                              Clinical Examination
                            </label>
                            <textarea
                              className="form-control"
                              rows={3}
                              name="clinicalExamination"
                              value={formData.clinicalExamination}
                              onChange={handleChange}
                              placeholder="Enter details"
                            ></textarea>
                          </div>

                          {/* Past */}
                          <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center">
                              <label className="form-label fw-bold m-0">
                                Past History
                              </label>
                              <button
                                className="btn btn-sm btn-outline-success p-1 px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openPopup("past");
                                }}
                              >
                                +
                              </button>
                            </div>
                            <textarea
                              className="form-control mt-3"
                              rows={3}
                              name="pastHistory"
                              value={formData.pastHistory}
                              onChange={handleChange}
                              placeholder="Enter Past History"
                            ></textarea>
                          </div>

                          {/* Family */}
                          <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center">
                              <label className="form-label fw-bold m-0">
                                Family History
                              </label>
                              <button
                                className="btn btn-sm btn-outline-success p-1 px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openPopup("family");
                                }}
                              >
                                +
                              </button>
                            </div>
                            <textarea
                              className="form-control mt-3"
                              rows={3}
                              name="familyHistory"
                              value={formData.familyHistory}
                              onChange={handleChange}
                              placeholder="Enter Family History"
                            ></textarea>
                          </div>

                          {psychiatristAssessment?.rows?.length > 0 && (
                            <div className="mb-3 border rounded p-3 bg-light">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <label className="form-label fw-bold m-0">
                                  Psychiatric Assessment
                                </label>
                                <button
                                  className="btn btn-sm btn-outline-primary p-1 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setClinicalPopupType("psychiatrist");
                                    setShowPopup(true);
                                    handleHistoryTypeClick("psychiatrist");
                                  }}
                                >
                                  Edit
                                </button>
                              </div>

                              <div className="small text-muted mb-2">
                                Saved assessment data will be submitted with the patient record.
                              </div>

                              {psychiatristAssessment.rows.map((row) => (
                                <div key={`${row.headingId}-${row.headingCode}`} className="mb-3">
                                  <div className="fw-bold">
                                    {row.headingName || `Category ${row.headingId}`}
                                    {row.headingCode ? ` (${row.headingCode})` : ""}
                                  </div>
                                  <ul className="mb-0 ps-3">
                                    {row.questions.map((qa) => (
                                      <li key={`${row.headingId}-${qa.questionId}`}>
                                        <strong>{qa.questionText || `Question ${qa.questionId}`}</strong>
                                        : {qa.answerValue || `Option ${qa.answerOptionId}`}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          )}

                          {/*Pregnancy*/}
                          {selectedPatient?.gender?.toLowerCase() ===
                            "female" && (
                            <div className="mb-3">
                              <div className="d-flex justify-content-between align-items-center">
                                <label className="form-label fw-bold m-0">
                                  Pregnancy Details
                                </label>
                              </div>
                              <div className="mt-2">
                                <PregnancySection
                                  ref={pregnancyRef} // ADD THIS REF
                                  patientId={selectedPatient?.patientId}
                                  visitId={selectedPatient?.visitId}
                                  opdPatientDetailsId={
                                    vitalsAvailable
                                      ? opdVitalsData?.opdPatientDetailsId
                                      : null
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <MasFamilyModel
                  show={showModelPopup}
                  popupType={popupType}
                  onClose={handleModelClose}
                  onSelect={handleSelect}
                  onOk={handleOk}
                  selectedItems={selectedItems}
                />
                {/* Vital Detail Section */}
                <div className="card mb-3">
                  <div
                    className="card-header py-3   border-bottom-1 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection("vitalDetail")}
                  >
                    <h6 className="mb-0 fw-bold">Vital Detail</h6>
                    <span style={{ fontSize: "18px" }}>
                      {expandedSections.vitalDetail ? "−" : "+"}
                    </span>
                  </div>
                  {expandedSections.vitalDetail && (
                    <div className="card-body">
                      <div className="row g-3 align-items-center">
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">Height</label>
                          <input
                            type="number"
                            className={`form-control ${errors.height ? "is-invalid" : ""}`}
                            min={0}
                            placeholder="Height"
                            name="height"
                            value={formData.height}
                            onChange={handleChange}
                          />
                          <span className="input-group-text">cm</span>
                          {errors.height && (
                            <div className="invalid-feedback d-block">
                              {errors.height}
                            </div>
                          )}
                        </div>

                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">Weight</label>
                          <input
                            type="number"
                            min={0}
                            className={`form-control ${errors.weight ? "is-invalid" : ""}`}
                            placeholder="Weight"
                            name="weight"
                            value={formData.weight}
                            onChange={handleChange}
                          />
                          <span className="input-group-text">kg</span>
                          {errors.weight && (
                            <div className="invalid-feedback d-block">
                              {errors.weight}
                            </div>
                          )}
                        </div>

                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">Temperature</label>
                          <input
                            type="number"
                            min={0}
                            className={`form-control ${errors.temperature ? "is-invalid" : ""}`}
                            placeholder="Temperature"
                            name="temperature"
                            value={formData.temperature}
                            onChange={handleChange}
                          />
                          <span className="input-group-text">°F</span>
                          {errors.temperature && (
                            <div className="invalid-feedback d-block">
                              {errors.temperature}
                            </div>
                          )}
                        </div>

                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">BP</label>
                          <input
                            type="number"
                            min={0}
                            className={`form-control ${errors.systolicBP ? "is-invalid" : ""}`}
                            placeholder="Systolic"
                            name="systolicBP"
                            value={formData.systolicBP}
                            onChange={handleChange}
                          />
                          <span className="input-group-text">/</span>
                          {errors.systolicBP && (
                            <div className="invalid-feedback d-block">
                              {errors.systolicBP}
                            </div>
                          )}
                          <input
                            type="number"
                            min={0}
                            className={`form-control ${errors.diastolicBP ? "is-invalid" : ""}`}
                            placeholder="Diastolic"
                            name="diastolicBP"
                            value={formData.diastolicBP}
                            onChange={handleChange}
                          />
                          <span className="input-group-text">mmHg</span>
                          {errors.diastolicBP && (
                            <div className="invalid-feedback d-block">
                              {errors.diastolicBP}
                            </div>
                          )}
                        </div>

                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">Pulse</label>
                          <input
                            type="number"
                            min={0}
                            className={`form-control ${errors.pulse ? "is-invalid" : ""}`}
                            placeholder="Pulse"
                            name="pulse"
                            value={formData.pulse}
                            onChange={handleChange}
                          />
                          <span className="input-group-text">/min</span>
                          {errors.pulse && (
                            <div className="invalid-feedback d-block">
                              {errors.pulse}
                            </div>
                          )}
                        </div>

                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">BMI</label>
                          <input
                            type="number"
                            min={0}
                            className={`form-control ${errors.bmi ? "is-invalid" : ""}`}
                            placeholder="BMI"
                            name="bmi"
                            value={formData.bmi}
                            onChange={handleChange}
                            readOnly
                          />
                          <span className="input-group-text">kg/m²</span>
                          {errors.bmi && (
                            <div className="invalid-feedback d-block">
                              {errors.bmi}
                            </div>
                          )}
                        </div>

                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">RR</label>
                          <input
                            type="number"
                            min={0}
                            className={`form-control ${errors.rr ? "is-invalid" : ""}`}
                            placeholder="RR"
                            name="rr"
                            value={formData.rr}
                            onChange={handleChange}
                          />
                          <span className="input-group-text">/min</span>
                          {errors.rr && (
                            <div className="invalid-feedback d-block">
                              {errors.rr}
                            </div>
                          )}
                        </div>

                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">SpO2</label>
                          <input
                            type="number"
                            min={0}
                            className={`form-control ${errors.spo2 ? "is-invalid" : ""}`}
                            placeholder="SpO2"
                            name="spo2"
                            value={formData.spo2}
                            onChange={handleChange}
                          />
                          <span className="input-group-text">%</span>
                          {errors.spo2 && (
                            <div className="invalid-feedback d-block">
                              {errors.spo2}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="row mt-3">
                        <div className="col-12">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              name="mlcCase"
                              checked={formData.mlcCase}
                              onChange={handleChange}
                            />
                            <label className="form-check-label">
                              Mark as MLC Case
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Vision Examination Section */}
                {isOphthalmologyDepartment && (
                  <div className="card mb-3">
                    <div
                      className="card-header py-3 border-bottom-1 d-flex justify-content-between align-items-center"
                      style={{ cursor: "pointer" }}
                      onClick={() => toggleSection("visionExamination")}
                    >
                      <h6 className="mb-0 fw-bold">Opthal Examination</h6>

                      <span style={{ fontSize: "18px" }}>
                        {expandedSections.visionExamination ? "−" : "+"}
                      </span>
                    </div>

                    <div
                      className="card-body"
                      style={{
                        display: expandedSections.visionExamination
                          ? "block"
                          : "none",
                      }}
                    >
                      <OpdVision
                        ref={visionRef}
                        key={`vision-${selectedPatient?.visitId}`}
                        patientId={selectedPatient?.patientId}
                        visitId={selectedPatient?.visitId}
                        hideHeader={true}
                        hideButtons={true}
                      />
                    </div>
                  </div>
                )}
                {/* OBG Details Section */}
                {isObgynDepartment && (
                  <div className="card mb-3">
                    <div
                      className="card-header py-3 border-bottom-1 d-flex justify-content-between align-items-center"
                      style={{ cursor: "pointer" }}
                      onClick={() => toggleSection("obgDetails")}
                    >
                      <h6 className="mb-0 fw-bold">OBG Details</h6>
                      <span style={{ fontSize: "18px" }}>
                        {expandedSections.obgDetails ? "−" : "+"}
                      </span>
                    </div>
                    {expandedSections.obgDetails && (
                      <div className="card-body">
                        <OBGDetails
                          ref={obgDetailsRef}
                          patientId={selectedPatient?.patientId}
                          visitId={selectedPatient?.visitId}
                          hideHeader={true}
                          hideButtons={true}
                        />
                      </div>
                    )}
                  </div>
                )}
                {/* Ear Examination Section */}
                {isEntDepartment && (
                  <div className="card mb-3">
                    <div
                      className="card-header py-3 border-bottom-1 d-flex justify-content-between align-items-center"
                      style={{ cursor: "pointer" }}
                      onClick={() => toggleSection("earExamination")}
                    >
                      <h6 className="mb-0 fw-bold">ENT</h6>
                      <span style={{ fontSize: "18px" }}>
                        {expandedSections.earExamination ? "−" : "+"}
                      </span>
                    </div>
                    {expandedSections.earExamination && (
                      <div className="card-body">
                        <EarExamination
                          ref={earExaminationRef}
                          patientId={selectedPatient?.patientId}
                          visitId={selectedPatient?.visitId}
                          hideHeader={true}
                          hideButtons={true}
                        />
                      </div>
                    )}
                  </div>
                )}
                {/* Dental Section */}
                {isDentalDepartment && (
                  <div className="card mb-3">
                    <div
                      className="card-header py-3 border-bottom-1 d-flex justify-content-between align-items-center"
                      style={{ cursor: "pointer" }}
                      onClick={() => toggleSection("dentalExamination")}
                    >
                      <h6 className="mb-0 fw-bold">Dental</h6>
                      <span style={{ fontSize: "18px" }}>
                        {expandedSections.dentalExamination ? "−" : "+"}
                      </span>
                    </div>
                    {expandedSections.dentalExamination && (
                      <div className="card-body">
                        <Dental
                          patientId={selectedPatient?.patientId}
                          visitId={selectedPatient?.visitId}
                          hideHeader={true}
                          hideButtons={true}
                        />
                      </div>
                    )}
                  </div>
                )}
                {/* Diagnosis Section */}
                <div className="card mb-3" style={{ overflow: "visible" }}>
                  <div
                    className="card-header py-3   border-bottom-1 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection("diagnosis")}
                  >
                    <h6 className="mb-0 fw-bold">Diagnosis</h6>
                    <span style={{ fontSize: "18px" }}>
                      {expandedSections.diagnosis ? "−" : "+"}
                    </span>
                  </div>

                  {expandedSections.diagnosis && (
                    <div className="card-body" style={{ overflow: "visible" }}>
                      <div className="mb-3">
                        <label className="form-label fw-bold">
                          Working Diagnosis
                        </label>
                        <input
                          type="text"
                          className={`form-control ${errors.workingDiagnosis || errors.diagnosis ? "is-invalid" : ""}`}
                          style={{ width: "400px" }}
                          value={workingDiagnosis}
                          onChange={(e) => {
                            setWorkingDiagnosis(e.target.value);
                            if (errors.workingDiagnosis || errors.diagnosis) {
                              setErrors((prev) => ({
                                ...prev,
                                workingDiagnosis: "",
                                diagnosis: "",
                              }));
                            }
                          }}
                          placeholder="Enter working diagnosis"
                          maxLength={40}
                        />
                        {(errors.workingDiagnosis || errors.diagnosis) && (
                          <div className="invalid-feedback d-block">
                            {errors.workingDiagnosis || errors.diagnosis}
                          </div>
                        )}
                      </div>

                      <div
                        className="table-responsive"
                        style={{ overflow: "visible" }}
                      >
                        <table className="table table-bordered">
                          <thead>
                            <tr>
                              <th className="col-md-6">ICD Diagnosis</th>
                              <th className="col-md-2 text-center">
                                Communicable
                              </th>
                              <th className="col-md-2 text-center">
                                Infectious
                              </th>
                              <th className="col-md-1 text-center">Add</th>
                              <th className="col-md-1 text-center">Delete</th>
                            </tr>
                          </thead>

                          <tbody>
                            {diagnosisItems.map((item, index) => (
                              <tr key={index}>
                                <td>
                                  <div
                                    className="position-relative"
                                    style={{ width: "100%", zIndex: 20 }}
                                    ref={dropdownRef}
                                  >
                                    {/* INPUT */}
                                    <input
                                      type="text"
                                      className={`form-control ${errors.diagnosis ? "is-invalid" : ""}`}
                                      placeholder="Search ICD..."
                                      value={
                                        diagnosisItems[index].icdDiagnosis ||
                                        search[index] ||
                                        ""
                                      }
                                      onChange={(e) =>
                                        handleIcdSearch(e.target.value, index)
                                      }
                                      onClick={() => {
                                        loadFirstPage(index);
                                        setOpenDropdown(index);
                                      }}
                                      onBlur={() => {
                                        setTimeout(() => {
                                          setOpenDropdown(null);
                                        }, 200);
                                      }}
                                    />

                                    {/* DROPDOWN */}
                                    {openDropdown === index && (
                                      <div
                                        className="border rounded mt-1 bg-white position-absolute w-100"
                                        style={{
                                          maxHeight: "220px",
                                          zIndex: 9999,
                                          overflowY: "auto",
                                        }}
                                        onScroll={(e) => {
                                          if (
                                            e.target.scrollHeight -
                                              e.target.scrollTop ===
                                            e.target.clientHeight
                                          ) {
                                            loadMore();
                                          }
                                        }}
                                      >
                                        {/* ICD OPTIONS */}
                                        {icdDropdown.length > 0 ? (
                                          icdDropdown.map((icd) => (
                                            <div
                                              key={icd.icdId}
                                              className="p-2 cursor-pointer hover: "
                                              onMouseDown={(e) => {
                                                e.preventDefault(); // 👈 prevents blur
                                                updateICD(icd, index);
                                                setOpenDropdown(null);
                                              }}
                                            >
                                              {icd.icdCode} - {icd.icdName}
                                            </div>
                                          ))
                                        ) : (
                                          <div className="p-2 text-muted">
                                            No results found
                                          </div>
                                        )}

                                        {!lastPage && (
                                          <div className="text-center p-2 text-primary small">
                                            Loading...
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>

                                <td className="text-center">
                                  <input
                                    type="checkbox"
                                    className="form-check-input border-black"
                                    checked={item.communicableDisease}
                                    onChange={(e) =>
                                      handleDiagnosisChange(
                                        index,
                                        "communicableDisease",
                                        e.target.checked,
                                      )
                                    }
                                  />
                                </td>

                                <td className="text-center">
                                  <input
                                    type="checkbox"
                                    className="form-check-input border-black"
                                    checked={item.infectiousDisease}
                                    onChange={(e) =>
                                      handleDiagnosisChange(
                                        index,
                                        "infectiousDisease",
                                        e.target.checked,
                                      )
                                    }
                                  />
                                </td>

                                <td className="text-center">
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={handleAddDiagnosisItem}
                                  >
                                    +
                                  </button>
                                </td>

                                <td className="text-center">
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() =>
                                      handleRemoveDiagnosisItem(index)
                                    }
                                    disabled={
                                      diagnosisItems.length === 1 &&
                                      !diagnosisItems[0].icdDiagId &&
                                      !diagnosisItems[0].icdDiagnosis &&
                                      !diagnosisItems[0].communicableDisease &&
                                      !diagnosisItems[0].infectiousDisease
                                    }
                                  >
                                    −
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
                {/* Investigation Section - UPDATED WITH MULTIPLE TEMPLATE SUPPORT */}
                <div className="card mb-3" style={{ overflow: "visible" }}>
                  <div
                    className="card-header py-3   border-bottom-1 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection("investigation")}
                  >
                    <h6 className="mb-0 fw-bold">Investigation</h6>
                    <span style={{ fontSize: "18px" }}>
                      {expandedSections.investigation ? "−" : "+"}
                    </span>
                  </div>
                  {expandedSections.investigation && (
                    <div className="card-body" style={{ overflow: "visible" }}>
                      {/* Selected Templates Display */}
                      {selectedTemplateIds.size > 0 && (
                        <div className="row mb-3">
                          <div className="col-12">
                            <div className="card">
                              <div className="card-header py-2  ">
                                <div className="d-flex justify-content-between align-items-center">
                                  <h6 className="mb-0 fw-bold">
                                    Selected Templates
                                  </h6>
                                  <button
                                    className="btn btn-sm btn-outline-dark"
                                    onClick={handleClearAllTemplates}
                                  >
                                    Clear All Templates
                                  </button>
                                </div>
                              </div>
                              <div className="card-body">
                                <div className="d-flex flex-wrap gap-2">
                                  {Array.from(selectedTemplateIds).map(
                                    (templateId) => {
                                      const template =
                                        investigationTemplates.find(
                                          (t) => t.templateId == templateId,
                                        );
                                      return template ? (
                                        <span
                                          key={templateId}
                                          className="badge bg-primary d-flex align-items-center gap-1"
                                        >
                                          {template.opdTemplateName}
                                          <button
                                            type="button"
                                            className="btn-close btn-close-white"
                                            style={{ fontSize: "0.7rem" }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRemoveTemplateItems(
                                                templateId,
                                              );
                                            }}
                                            aria-label="Remove template"
                                          ></button>
                                        </span>
                                      ) : null;
                                    },
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="row mb-3 align-items-center">
                        <div className="col-md-2">
                          <label className="form-label fw-bold">Template</label>
                        </div>
                        <div className="col-md-4">
                          <select
                            className="form-select"
                            value={selectedInvestigationTemplate}
                            onChange={(e) => {
                              const selectedId = e.target.value;
                              if (selectedId === "Select..") return;

                              const template = investigationTemplates.find(
                                (t) => t.templateId == selectedId,
                              );
                              if (template) {
                                handleInvestigationTemplateSelect(template);
                              } else {
                                setSelectedInvestigationTemplate("Select..");
                              }
                            }}
                            disabled={investigationTemplateLoading}
                          >
                            <option value="Select..">Select..</option>
                            {investigationTemplates.map((template) => (
                              <option
                                key={template.templateId}
                                value={template.templateId}
                                disabled={selectedTemplateIds.has(
                                  template.templateId,
                                )}
                              >
                                {template.opdTemplateName} (
                                {template.opdTemplateCode})
                                {selectedTemplateIds.has(template.templateId)
                                  ? " (Already Selected)"
                                  : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-6">
                          <button
                            className="btn btn-primary me-2"
                            onClick={() =>
                              handleOpenInvestigationModal("create")
                            }
                          >
                            Create Template
                          </button>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleOpenInvestigationModal("edit")}
                          >
                            Update Template
                          </button>
                        </div>
                      </div>

                      {/* Radio Buttons */}
                      <div className="row mb-3">
                        <div className="col-12">
                          <div className="d-flex gap-4 flex-wrap">
                            {investigationTypes.length > 0 ? (
                              investigationTypes.map((type) => (
                                <div key={type.id} className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name="investigationType"
                                    id={`inv-type-${type.id}`}
                                    value={type.id}
                                    checked={investigationType === type.id}
                                    onChange={() => {
                                      setInvestigationType(type.id);

                                      if (type.name === "Laboratory") {
                                        setLabFlag(FLAG.FLAG_Y);
                                        setRadioFlag(FLAG.FLAG_N);
                                      } else if (type.name === "Radiology") {
                                        setRadioFlag(FLAG.FLAG_Y);
                                        setLabFlag(FLAG.FLAG_N);
                                      } else {
                                        setLabFlag(FLAG.FLAG_N);
                                        setRadioFlag(FLAG.FLAG_N);
                                      }
                                    }}
                                  />

                                  <label
                                    className="form-check-label fw-bold"
                                    htmlFor={`inv-type-${type.id}`}
                                  >
                                    {type.name.toUpperCase()}
                                  </label>
                                </div>
                              ))
                            ) : (
                              <div className="text-muted small">
                                Loading investigation types...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Investigation Table */}
                      <div
                        className="table-responsive"
                        style={{ overflow: "visible" }}
                      >
                        <table className="table table-bordered">
                          <thead style={{ backgroundColor: "#b0c4de" }}>
                            <tr>
                              <th style={{ width: "55%" }}>Investigation</th>
                              <th style={{ width: "15%" }}>Date</th>
                              <th style={{ width: "15%" }}>Add</th>
                              <th style={{ width: "15%" }}>Delete</th>
                            </tr>
                          </thead>
                          <tbody>
                            {investigationItems.map((item, index) => (
                              <tr key={index}>
                                <td>
                                  <div
                                    className="position-relative w-100"
                                    ref={dropdownInvestigationRef}
                                  >
                                    {/* INPUT */}
                                    <input
                                      type="text"
                                      className="form-control"
                                      placeholder="Search Investigation..."
                                      value={
                                        investigationItems[index]
                                          .displayValue || ""
                                      }
                                      onChange={(e) =>
                                        handleInvestigationSearch(
                                          e.target.value,
                                          index,
                                        )
                                      }
                                      onClick={() => {
                                        loadFirstInvestigationPage(index);
                                        setOpenInvestigationDropdown(index);
                                      }}
                                      onBlur={() => {
                                        setTimeout(
                                          () =>
                                            setOpenInvestigationDropdown(null),
                                          200,
                                        );
                                      }}
                                    />

                                    {/* DROPDOWN */}
                                    {openInvestigationDropdown === index && (
                                      <div
                                        className="border rounded mt-1 bg-white position-absolute w-100"
                                        style={{
                                          maxHeight: "220px",
                                          zIndex: 9999,
                                          overflowY: "auto",
                                        }}
                                        onScroll={(e) => {
                                          if (
                                            e.target.scrollHeight -
                                              e.target.scrollTop ===
                                            e.target.clientHeight
                                          ) {
                                            loadMoreInvestigations();
                                          }
                                        }}
                                      >
                                        {investigationDropdown.length > 0 ? (
                                          investigationDropdown.map((inv) => (
                                            <div
                                              key={inv.investigationId}
                                              className="p-2 cursor-pointer hover:bg-light"
                                              onMouseDown={(e) => {
                                                e.preventDefault(); // prevent blur
                                                updateInvestigation(inv, index);
                                              }}
                                            >
                                              <strong>
                                                {inv.investigationName}
                                              </strong>
                                              <div className="text-muted small">
                                                {inv.mainChargeCodeName} •{" "}
                                                {inv.subChargeCodeName}
                                              </div>
                                            </div>
                                          ))
                                        ) : (
                                          <div className="p-2 text-muted">
                                            No results found
                                          </div>
                                        )}

                                        {!investigationLastPage && (
                                          <div className="text-center p-2 text-primary small">
                                            Loading...
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>

                                <td>
                                  <input
                                    type="date"
                                    className="form-control"
                                    value={item.date}
                                    onChange={(e) =>
                                      handleInvestigationItemChange(
                                        index,
                                        "date",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </td>
                                <td className="text-center">
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={handleAddInvestigationItem}
                                  >
                                    +
                                  </button>
                                </td>
                                <td className="text-center">
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() =>
                                      handleRemoveInvestigationItem(index)
                                    }
                                    disabled={
                                      investigationItems.length === 1 &&
                                      !investigationItems[0].name &&
                                      (!investigationItems[0].templateIds ||
                                        investigationItems[0].templateIds
                                          .length === 0)
                                    }
                                  >
                                    −
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
                {/* Treatment Section */}
                <div className="card mb-3" style={{ overflow: "visible" }}>
                  <div
                    className="card-header py-3   border-bottom-1 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection("treatment")}
                  >
                    <h6 className="mb-0 fw-bold">Treatment</h6>
                    <span style={{ fontSize: "18px" }}>
                      {expandedSections.treatment ? "−" : "+"}
                    </span>
                  </div>

                  {expandedSections.treatment && (
                    <div className="card-body" style={{ overflow: "visible" }}>
                      {/* Selected Templates Display */}
                      {selectedTreatmentTemplateIds.size > 0 && (
                        <div className="row mb-3">
                          <div className="col-12">
                            <div className="card">
                              <div className="card-header py-2  ">
                                <div className="d-flex justify-content-between align-items-center">
                                  <h6 className="mb-0 fw-bold">
                                    Selected Templates
                                  </h6>

                                  <button
                                    className="btn btn-sm btn-outline-dark"
                                    onClick={handleClearAllTreatmentTemplates}
                                  >
                                    Clear All Templates
                                  </button>
                                </div>
                              </div>

                              <div className="card-body">
                                <div className="d-flex flex-wrap gap-2">
                                  {Array.from(selectedTreatmentTemplateIds).map(
                                    (templateId) => {
                                      const template = opdTemplateData.find(
                                        (t) => t.templateId == templateId,
                                      );
                                      return template ? (
                                        <span
                                          key={templateId}
                                          className="badge bg-primary d-flex align-items-center gap-1"
                                        >
                                          {template.opdTemplateName}
                                          <button
                                            type="button"
                                            className="btn-close btn-close-white"
                                            style={{ fontSize: "0.7rem" }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRemoveTreatmentTemplateItems(
                                                templateId,
                                              );
                                            }}
                                            aria-label="Remove template"
                                          ></button>
                                        </span>
                                      ) : null;
                                    },
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Template Dropdown + Create/Update Buttons */}
                      <div className="row mb-3 align-items-center">
                        <div className="col-md-2">
                          <label className="form-label fw-bold">Template</label>
                        </div>

                        <div className="col-md-4">
                          <select
                            className="form-select"
                            value={selectedTreatmentTemplateId}
                            onChange={(e) =>
                              handleTreatmentTemplateSelect(e.target.value)
                            }
                          >
                            <option value="Select..">Select..</option>

                            {opdTemplateData.map((item) => (
                              <option
                                key={item.templateId}
                                value={item.templateId}
                                disabled={selectedTreatmentTemplateIds.has(
                                  item.templateId,
                                )}
                              >
                                {item.opdTemplateName}
                                {selectedTreatmentTemplateIds.has(
                                  item.templateId,
                                )
                                  ? " (Already Added)"
                                  : ""}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-md-6">
                          <button
                            className="btn btn-primary me-2"
                            onClick={() => handleOpenTreatmentModal("create")}
                          >
                            Create Template
                          </button>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleOpenTreatmentModal("edit")}
                          >
                            Update Template
                          </button>
                          <button
                            className="btn btn-primary ms-2"
                            onClick={handleOpenCurrentMedicationModal}
                          >
                            Current Medication
                          </button>
                        </div>
                      </div>

                      {/* Treatment Table */}
                      <div
                        className="table-responsive"
                        ref={tableContainerRef}
                        style={{ overflow: "visible" }}
                      >
                        <table className="table table-bordered">
                          <thead style={{ backgroundColor: "#b0c4de" }}>
                            <tr>
                              <th style={{ width: "350px" }}>Drug Name</th>
                              <th
                                style={{ width: "90px" }}
                                className="text-center"
                              >
                                Disp. Unit
                              </th>
                              <th
                                style={{ width: "70px" }}
                                className="text-center"
                              >
                                Dosage
                              </th>
                              <th
                                style={{ width: "120px" }}
                                className="text-center"
                              >
                                Frequency
                              </th>
                              <th
                                style={{ width: "70px" }}
                                className="text-center"
                              >
                                Days
                              </th>
                              <th
                                style={{ width: "70px" }}
                                className="text-center"
                              >
                                Total
                              </th>
                              <th
                                style={{ width: "130px" }}
                                className="text-center"
                              >
                                Instruction
                              </th>
                              <th
                                style={{ width: "100px" }}
                                className="text-center"
                              >
                                Stock
                              </th>
                              <th
                                style={{ width: "60px" }}
                                className="text-center"
                              >
                                Add
                              </th>
                              <th
                                style={{ width: "60px" }}
                                className="text-center"
                              >
                                Delete
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {treatmentItems.map((row, index) => (
                              <tr key={index}>
                                <td>
                                  <div
                                    className="position-relative"
                                    style={{ width: "100%", zIndex: 20 }}
                                    ref={drugDropdownRef}
                                  >
                                    <input
                                      type="text"
                                      className="form-control"
                                      placeholder="Search Drug..."
                                      value={
                                        treatmentItems[index].drugName ||
                                        drugSearch[index] ||
                                        ""
                                      }
                                      onChange={(e) =>
                                        handleDrugSearch(e.target.value, index)
                                      }
                                      onClick={() => {
                                        loadFirstDrugPage(index);
                                        setActiveDrugDropdown(index);
                                      }}
                                      onBlur={() => {
                                        setTimeout(() => {
                                          setActiveDrugDropdown(null);
                                        }, 200);
                                      }}
                                      autoComplete="off"
                                    />

                                    {activeDrugDropdown === index && (
                                      <div
                                        className="border rounded mt-1 bg-white position-absolute w-100"
                                        style={{
                                          maxHeight: "220px",
                                          zIndex: 9999,
                                          overflowY: "auto",
                                        }}
                                        onScroll={(e) => {
                                          if (
                                            e.target.scrollHeight -
                                              e.target.scrollTop ===
                                            e.target.clientHeight
                                          ) {
                                            loadMoreDrugs();
                                          }
                                        }}
                                      >
                                        {drugDropdown.length > 0 ? (
                                          drugDropdown.map((drug) => (
                                            <div
                                              key={drug.itemId}
                                              className="p-2 cursor-pointer"
                                              onMouseDown={(e) =>
                                                e.preventDefault()
                                              } // prevent blur
                                              onClick={() => {
                                                updateDrug(drug, index);
                                                setActiveDrugDropdown(null);
                                              }}
                                            >
                                              <strong>
                                                {drug.nomenclature}
                                              </strong>{" "}
                                              — {drug.pvmsNo}
                                            </div>
                                          ))
                                        ) : (
                                          <div className="p-2 text-muted">
                                            No results found
                                          </div>
                                        )}
                                        {!drugLastPage && (
                                          <div className="text-center p-2 small text-primary">
                                            Loading...
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td style={{ width: "90px" }}>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={row.dispUnit}
                                    onChange={(e) =>
                                      handleTreatmentChange(
                                        index,
                                        "dispUnit",
                                        e.target.value,
                                      )
                                    }
                                    readOnly
                                  />
                                </td>

                                <td style={{ width: "70px" }}>
                                  <input
                                    type="number"
                                    className={`form-control ${errors.treatment && (row.drugName || row.drugId) && !hasValue(row.dosage) ? "is-invalid" : ""}`}
                                    value={row.dosage}
                                    onChange={(e) =>
                                      handleTreatmentChange(
                                        index,
                                        "dosage",
                                        e.target.value,
                                      )
                                    }
                                    min={0}
                                  />
                                </td>

                                <td style={{ width: "120px" }}>
                                  <select
                                    className={`form-select ${errors.treatment && (row.drugName || row.drugId) && !hasValue(row.frequency) ? "is-invalid" : ""}`}
                                    value={row.frequency || ""}
                                    onChange={(e) =>
                                      handleTreatmentChange(
                                        index,
                                        "frequency",
                                        e.target.value,
                                      )
                                    }
                                  >
                                    <option value="">Select..</option>
                                    {allFrequencies.map((f) => (
                                      <option
                                        key={f.frequencyId}
                                        value={f.frequencyName}
                                      >
                                        {f.frequencyName}
                                      </option>
                                    ))}
                                  </select>
                                </td>

                                <td style={{ width: "70px" }}>
                                  <input
                                    type="number"
                                    className={`form-control ${errors.treatment && (row.drugName || row.drugId) && !hasValue(row.days) ? "is-invalid" : ""}`}
                                    value={row.days}
                                    onChange={(e) =>
                                      handleTreatmentChange(
                                        index,
                                        "days",
                                        e.target.value,
                                      )
                                    }
                                    min={0}
                                  />
                                </td>

                                <td style={{ width: "70px" }}>
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={row.total}
                                    readOnly
                                  />
                                </td>

                                <td style={{ width: "140px" }}>
                                  <select
                                    className={`form-select ${errors.treatment && (row.drugName || row.drugId) && !hasValue(row.instruction) ? "is-invalid" : ""}`}
                                    value={row.instruction}
                                    onChange={(e) =>
                                      handleTreatmentChange(
                                        index,
                                        "instruction",
                                        e.target.value,
                                      )
                                    }
                                  >
                                    <option value="">Select...</option>
                                    <option value="After Meal">
                                      After Meal
                                    </option>
                                    <option value="Before Meal">
                                      Before Meal
                                    </option>
                                    <option value="With Food">With Food</option>
                                    <option value="both">both</option>
                                  </select>
                                </td>

                                <td style={{ width: "100px" }}>
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={row.stock || 0}
                                    readOnly
                                  />
                                </td>

                                <td
                                  style={{ width: "60px" }}
                                  className="text-center"
                                >
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={handleAddTreatmentItem}
                                  >
                                    +
                                  </button>
                                </td>

                                <td
                                  style={{ width: "60px" }}
                                  className="text-center"
                                >
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() =>
                                      handleRemoveTreatmentItem(index)
                                    }
                                    disabled={
                                      treatmentItems.length === 1 &&
                                      !treatmentItems[0].drugName &&
                                      !treatmentItems[0].dispUnit &&
                                      !treatmentItems[0].dosage &&
                                      !treatmentItems[0].frequency &&
                                      !treatmentItems[0].days &&
                                      !treatmentItems[0].total &&
                                      !treatmentItems[0].instruction &&
                                      treatmentItems[0].stock === "0" &&
                                      !treatmentItems[0].treatmentId
                                    }
                                  >
                                    −
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {errors.treatment && (
                        <div className="text-danger small mt-1">
                          {errors.treatment}
                        </div>
                      )}

                      {/* Treatment Advice Subsection */}
                      <div className="card mt-3">
                        <h6 className="mb-0 fw-bold p-3">Treatment Advice</h6>

                        <div className="card-body pt-0">
                          <div className="d-flex align-items-end">
                            <textarea
                              className="form-control me-2"
                              rows={3}
                              value={generalTreatmentAdvice}
                              placeholder="Treatment advice will be populated here"
                              onChange={(e) =>
                                setGeneralTreatmentAdvice(e.target.value)
                              }
                            />

                            <button
                              className="btn btn-sm btn-outline-success p-1 px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPopup("treatmentAdvice");
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Procedure Care Section */}
                <div className="card mb-3" style={{ overflow: "visible" }}>
                  <div
                    className="card-header py-3   border-bottom-1 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection("procedureCare")}
                  >
                    <h6 className="mb-0 fw-bold">Procedure Care</h6>
                    <span style={{ fontSize: "18px" }}>
                      {expandedSections.procedureCare ? "−" : "+"}
                    </span>
                  </div>
                  {expandedSections.procedureCare && (
                    <div className="card-body" style={{ overflow: "visible" }}>
                      <div className="row mb-3">
                        <div className="col-12 d-flex gap-4">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="procedureCareType"
                              id="procedure"
                              checked={procedureCareType === "procedure"}
                              onChange={() => setProcedureCareType("procedure")}
                            />
                            <label
                              className="form-check-label"
                              htmlFor="procedure"
                            >
                              Procedure
                            </label>
                          </div>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="procedureCareType"
                              id="physiotherapy"
                              checked={procedureCareType === "physiotherapy"}
                              onChange={() =>
                                setProcedureCareType("physiotherapy")
                              }
                            />
                            <label
                              className="form-check-label"
                              htmlFor="physiotherapy"
                            >
                              Physiotherapy
                            </label>
                          </div>
                        </div>
                      </div>

                      {procedureCareType === "procedure" ? (
                        <div
                          className="table-responsive"
                          style={{ overflow: "visible" }}
                        >
                          <table className="table table-bordered">
                            <thead style={{ backgroundColor: "#b0c4de" }}>
                              <tr>
                                <th style={{ width: "40%" }}>
                                  Nursing Care Name
                                </th>
                                <th
                                  className="text-center"
                                  style={{ width: "20%" }}
                                >
                                  Frequency
                                </th>
                                <th
                                  className="text-center"
                                  style={{ width: "15%" }}
                                >
                                  No.Of Days
                                </th>
                                <th style={{ width: "15%" }}>Remarks</th>
                                <th
                                  className="text-center"
                                  style={{ width: "5%" }}
                                >
                                  Add
                                </th>
                                <th
                                  className="text-center"
                                  style={{ width: "5%" }}
                                >
                                  Delete
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {procedureCareItems.map((row, index) => (
                                <tr key={index}>
                                  <td>
                                    <div
                                      className="procedure-wrapper"
                                      ref={(el) =>
                                        (procedureDropdownRef.current[index] =
                                          el)
                                      }
                                      style={{
                                        position: "relative",
                                        width: "100%",
                                      }}
                                    >
                                      <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search Procedure..."
                                        value={
                                          procedureCareItems[index].name ||
                                          procedureSearch[index] ||
                                          ""
                                        }
                                        onChange={async (e) => {
                                          const val = e.target.value;
                                          setProcedureSearch((prev) => {
                                            const updated = [...prev];
                                            updated[index] = val;
                                            return updated;
                                          });

                                          const result =
                                            await fetchMasProcedureData(0, val);
                                          setProcedureDropdown(result.list);
                                          setProcedureLastPage(result.last);
                                          setProcedurePage(0);
                                          setOpenProcedureDropdown(index);
                                        }}
                                        onClick={() => {
                                          loadProcedureFirstPage(index);
                                          setOpenProcedureDropdown(index);
                                        }}
                                        onBlur={() => {
                                          setTimeout(() => {
                                            const selected =
                                              procedureCareItems[index];
                                            const text = procedureSearch[index];

                                            if (
                                              (!selected.id ||
                                                selected.name !== text) &&
                                              text !== ""
                                            ) {
                                              setProcedureSearch((prev) => {
                                                const updated = [...prev];
                                                updated[index] = "";
                                                return updated;
                                              });

                                              setProcedureCareItems((prev) => {
                                                const updated = [...prev];
                                                updated[index].id = "";
                                                updated[index].name = "";
                                                return updated;
                                              });
                                            }
                                            setOpenProcedureDropdown(null);
                                          }, 150);
                                        }}
                                      />

                                      {openProcedureDropdown === index && (
                                        <div
                                          className="border rounded bg-white position-absolute w-100 shadow-lg"
                                          style={{
                                            maxHeight: "250px",
                                            overflowY: "auto",
                                            zIndex: 999999,
                                            top: "100%",
                                            left: 0,
                                          }}
                                          onScroll={(e) => {
                                            if (
                                              e.target.scrollHeight -
                                                e.target.scrollTop ===
                                              e.target.clientHeight
                                            ) {
                                              loadMoreProcedure();
                                            }
                                          }}
                                        >
                                          {procedureDropdown.length > 0 ? (
                                            procedureDropdown.map((proc) => (
                                              <div
                                                key={proc.procedureId}
                                                className="p-2 cursor-pointer hover:bg-light"
                                                onMouseDown={() => {
                                                  updateProcedure(proc, index);
                                                  setOpenProcedureDropdown(
                                                    null,
                                                  );
                                                }}
                                              >
                                                {proc.procedureCode} -{" "}
                                                {proc.procedureName}
                                              </div>
                                            ))
                                          ) : (
                                            <div className="p-2 text-muted">
                                              No results found
                                            </div>
                                          )}

                                          {!procedureLastPage && (
                                            <div className="text-center p-2 text-primary small">
                                              Loading...
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </td>

                                  <td>
                                    <select
                                      className="form-select"
                                      value={row.frequency || ""}
                                      onChange={(e) =>
                                        handleProcedureCareChange(
                                          index,
                                          "frequency",
                                          e.target.value,
                                        )
                                      }
                                    >
                                      <option value="">Select..</option>
                                      {allFrequencies.map((f) => (
                                        <option
                                          key={f.frequencyId}
                                          value={f.frequencyId}
                                        >
                                          {f.frequencyName}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      className="form-control"
                                      value={row.days}
                                      onChange={(e) =>
                                        handleProcedureCareChange(
                                          index,
                                          "days",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="0"
                                      min={0}
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={row.remarks}
                                      onChange={(e) =>
                                        handleProcedureCareChange(
                                          index,
                                          "remarks",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Enter remarks"
                                    />
                                  </td>
                                  <td className="text-center">
                                    <button
                                      className="btn btn-sm btn-success"
                                      onClick={handleAddProcedureCareItem}
                                    >
                                      +
                                    </button>
                                  </td>
                                  <td className="text-center">
                                    <button
                                      className="btn btn-sm btn-danger"
                                      onClick={() =>
                                        handleRemoveProcedureCareItem(index)
                                      }
                                      disabled={
                                        procedureCareItems.length === 1 &&
                                        !procedureCareItems[0].procedureId &&
                                        !procedureCareItems[0].procedureName &&
                                        !procedureCareItems[0].frequencyId &&
                                        procedureCareItems[0].noOfDays ===
                                          "0" &&
                                        !procedureCareItems[0].remarks
                                      }
                                    >
                                      −
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-bordered">
                            <thead style={{ backgroundColor: "#b0c4de" }}>
                              <tr>
                                <th style={{ width: "40%" }}>
                                  Nursing Care Name
                                </th>
                                <th
                                  className="text-center"
                                  style={{ width: "20%" }}
                                >
                                  Frequency
                                </th>
                                <th
                                  className="text-center"
                                  style={{ width: "15%" }}
                                >
                                  No.Of Days
                                </th>
                                <th style={{ width: "15%" }}>Remarks</th>
                                <th
                                  className="text-center"
                                  style={{ width: "5%" }}
                                >
                                  Add
                                </th>
                                <th
                                  className="text-center"
                                  style={{ width: "5%" }}
                                >
                                  Delete
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {physiotherapyItems.map((row, index) => (
                                <tr key={index}>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={row.name}
                                      onChange={(e) =>
                                        handlePhysiotherapyChange(
                                          index,
                                          "name",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Enter nursing care name"
                                    />
                                  </td>
                                  <td>
                                    <select
                                      className="form-select"
                                      value={row.frequency || ""}
                                      onChange={(e) =>
                                        handlePhysiotherapyChange(
                                          index,
                                          "frequency",
                                          e.target.value,
                                        )
                                      }
                                    >
                                      <option value="">Select..</option>
                                      {allFrequencies.map((f) => (
                                        <option
                                          key={f.frequencyId}
                                          value={f.frequencyId}
                                        >
                                          {f.frequencyName}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      className="form-control"
                                      value={row.days}
                                      onChange={(e) =>
                                        handlePhysiotherapyChange(
                                          index,
                                          "days",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="0"
                                      min={0}
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={row.remarks}
                                      onChange={(e) =>
                                        handlePhysiotherapyChange(
                                          index,
                                          "remarks",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Enter remarks"
                                    />
                                  </td>
                                  <td className="text-center">
                                    <button
                                      className="btn btn-sm btn-success"
                                      onClick={handleAddPhysiotherapyItem}
                                    >
                                      +
                                    </button>
                                  </td>
                                  <td className="text-center">
                                    <button
                                      className="btn btn-sm btn-danger"
                                      onClick={() =>
                                        handleRemovePhysiotherapyItem(index)
                                      }
                                      disabled={
                                        physiotherapyItems.length === 1 &&
                                        !physiotherapyItems[0].name &&
                                        !physiotherapyItems[0].frequency &&
                                        physiotherapyItems[0].days === "0" &&
                                        !physiotherapyItems[0].remarks
                                      }
                                    >
                                      −
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Surgery Advice Section */}
                <div className="card mb-3">
                  <div
                    className="card-header py-3   border-bottom-1 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection("surgeryAdvice")}
                  >
                    <h6 className="mb-0 fw-bold">Surgery Advice</h6>
                    <span style={{ fontSize: "18px" }}>
                      {expandedSections.surgeryAdvice ? "−" : "+"}
                    </span>
                  </div>
                  {expandedSections.surgeryAdvice && (
                    <div className="card-body">
                      <div className="row mb-3 align-items-center">
                        <div className="col-12 d-flex gap-4 mb-3">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="surgeryType"
                              id="major"
                              checked={surgeryType === "major"}
                              onChange={() => setSurgeryType("major")}
                            />
                            <label className="form-check-label" htmlFor="major">
                              Major
                            </label>
                          </div>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="surgeryType"
                              id="minor"
                              checked={surgeryType === "minor"}
                              onChange={() => setSurgeryType("minor")}
                            />
                            <label className="form-check-label" htmlFor="minor">
                              Minor
                            </label>
                          </div>

                          <div style={{ cursor: "default" }}>
                            <div className="d-flex align-items-center">
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowOtCalendarModal(true);
                                }}
                                style={{ fontSize: "12px" }}
                              >
                                OTCalendar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="table-responsive">
                        <table className="table table-bordered">
                          <thead style={{ backgroundColor: "#b0c4de" }}>
                            <tr>
                              <th style={{ width: "10%" }}>S.No</th>
                              <th style={{ width: "70%" }}>Surgery</th>
                              <th style={{ width: "15%" }}>Select</th>
                              <th style={{ width: "5%" }}>Add</th>
                              <th style={{ width: "5%" }}>Delete</th>
                            </tr>
                          </thead>
                          <tbody>
                            {surgeryItems.map((item, index) => (
                              <tr key={index}>
                                <td className="text-center">{index + 1}</td>
                                <td className="position-relative">
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={item.surgery}
                                    onChange={(e) => {
                                      handleSurgerySearchChange(
                                        e.target.value,
                                        index,
                                      );
                                    }}
                                    placeholder="Search Surgery"
                                    autoComplete="off"
                                  />
                                  {isSurgeryDropdownVisible &&
                                    selectedSurgeryIndex === index &&
                                    surgerySearchInput && (
                                      <ul
                                        className="list-group position-absolute w-100 mt-1"
                                        style={{ zIndex: 1000, top: "100%" }}
                                      >
                                        {surgeryOptions
                                          .filter((surgery) =>
                                            surgery.name
                                              .toLowerCase()
                                              .includes(
                                                surgerySearchInput.toLowerCase(),
                                              ),
                                          )
                                          .map((surgery) => (
                                            <li
                                              key={surgery.id}
                                              className="list-group-item list-group-item-action"
                                              onClick={() =>
                                                handleSurgerySelect(
                                                  surgery,
                                                  index,
                                                )
                                              }
                                            >
                                              {surgery.name}
                                            </li>
                                          ))}
                                      </ul>
                                    )}
                                </td>
                                <td className="text-center">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={item.selected}
                                    onChange={(e) =>
                                      handleSurgeryChange(
                                        index,
                                        "selected",
                                        e.target.checked,
                                      )
                                    }
                                  />
                                </td>
                                <td className="text-center">
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={handleAddSurgeryItem}
                                  >
                                    +
                                  </button>
                                </td>
                                <td className="text-center">
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() =>
                                      handleRemoveSurgeryItem(index)
                                    }
                                    disabled={surgeryItems.length === 1}
                                  >
                                    −
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
                {/* Admission Advice Section */}
                <div className="card mb-3">
                  <div
                    className="card-header py-3   border-bottom-1 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection("admissionAdvice")}
                  >
                    <h6 className="mb-0 fw-bold">Admission Advice</h6>
                    <span style={{ fontSize: "18px" }}>
                      {expandedSections.admissionAdvice ? "−" : "+"}
                    </span>
                  </div>
                  {expandedSections.admissionAdvice && (
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-12">
                          <div className="row mb-3">
                            <div className="col-md-3">
                              <div className="form-check d-flex align-items-center h-100">
                                <input
                                  className="form-check-input me-2"
                                  type="checkbox"
                                  id="admissionAdvised"
                                  checked={admissionAdvised}
                                  onChange={handleAdmissionAdvisedChange}
                                />

                                <label
                                  className="form-check-label fw-bold"
                                  htmlFor="admissionAdvised"
                                >
                                  Admission Advised
                                </label>
                              </div>
                            </div>
                          </div>

                          {admissionAdvised && (
                            <div className="border-top pt-3 mt-3">
                              <div className="row g-3">
                                <div className="col-md-3">
                                  <label className="form-label fw-bold">
                                    Admission Date
                                  </label>
                                  <input
                                    type="date"
                                    className={`form-control ${errors.admissionDate ? "is-invalid" : ""}`}
                                    value={admissionDate}
                                    onChange={(e) => {
                                      setAdmissionDate(e.target.value);
                                      if (errors.admissionDate) {
                                        setErrors((prev) => ({
                                          ...prev,
                                          admissionDate: "",
                                        }));
                                      }
                                    }}
                                  />
                                  {errors.admissionDate && (
                                    <div className="invalid-feedback d-block">
                                      {errors.admissionDate}
                                    </div>
                                  )}
                                </div>
                                <div className="col-md-9">
                                  <label className="form-label fw-bold">
                                    Admission Notes{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <textarea
                                    className={`form-control ${errors.admissionRemarks ? "is-invalid" : ""}`}
                                    rows={3}
                                    value={admissionRemarks}
                                    onChange={(e) => {
                                      setAdmissionRemarks(e.target.value);
                                      if (errors.admissionRemarks) {
                                        setErrors((prev) => ({
                                          ...prev,
                                          admissionRemarks: "",
                                        }));
                                      }
                                    }}
                                    placeholder="Enter admission advice"
                                  ></textarea>
                                  {errors.admissionRemarks && (
                                    <div className="invalid-feedback d-block">
                                      {errors.admissionRemarks}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="row g-3 mt-3">
                                <div className="col-md-3">
                                  <label className="form-label fw-bold">
                                    Ward Category
                                  </label>
                                  <select
                                    className={`form-select ${errors.wardCategory ? "is-invalid" : ""}`}
                                    value={wardCategory}
                                    onChange={(e) =>
                                      handleWardCategoryChange(
                                        Number(e.target.value),
                                      )
                                    }
                                  >
                                    <option value="">
                                      Select Ward Category
                                    </option>
                                    {wardCategories.map((category) => (
                                      <option
                                        key={category.categoryId}
                                        value={category.categoryId}
                                      >
                                        {category.categoryName}
                                      </option>
                                    ))}
                                  </select>
                                  {errors.wardCategory && (
                                    <div className="invalid-feedback d-block">
                                      {errors.wardCategory}
                                    </div>
                                  )}
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label fw-bold">
                                    Care Level
                                  </label>
                                  <input
                                    type="text"
                                    className={`form-control ${errors.admissionCareLevel ? "is-invalid" : ""}`}
                                    value={admissionCareLevelName}
                                    readOnly
                                  />
                                  {errors.admissionCareLevel && (
                                    <div className="invalid-feedback d-block">
                                      {errors.admissionCareLevel}
                                    </div>
                                  )}
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label fw-bold">
                                    Ward Name/Dept Name{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <select
                                    className={`form-select ${errors.wardName ? "is-invalid" : ""}`}
                                    value={wardName}
                                    onChange={(e) =>
                                      handleWardNameChange(
                                        Number(e.target.value),
                                      )
                                    }
                                    disabled={!wardCategory}
                                  >
                                    <option value="">Select Ward/Dept</option>
                                    {wardDepartments.map((dept) => (
                                      <option key={dept.wardId} value={dept.wardId}>
                                        {dept.wardName}
                                      </option>
                                    ))}
                                  </select>
                                  {errors.wardName && (
                                    <div className="invalid-feedback d-block">
                                      {errors.wardName}
                                    </div>
                                  )}
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label fw-bold">
                                    Admission Priority (Optional)
                                  </label>
                                  <select
                                    className="form-select"
                                    value={admissionPriority}
                                    onChange={(e) =>
                                      setAdmissionPriority(e.target.value)
                                    }
                                  >
                                    {admissionPriorities.map((priority) => (
                                      <option key={priority} value={priority}>
                                        {priority}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {/* {wardName && ( */}
                              <div className="row g-3 mt-3">
                                <div className="col-md-3">
                                  <label className="form-label fw-bold">
                                    Occupied Bed
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={occupiedBeds}
                                    readOnly
                                  />
                                </div>

                                <div className="col-md-3">
                                  <label className="form-label fw-bold">
                                    Vacant Bed
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={vacantBeds}
                                    readOnly
                                  />
                                </div>

                                <div className="col-md-3">
                                  <label className="form-label fw-bold">
                                    Cleaning Bed
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={cleaningBeds}
                                    readOnly
                                  />
                                </div>
                              </div>
                              {/* )} */}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="card mb-3">
                  <div
                    className="card-header py-3   border-bottom-1 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection("referral")}
                  >
                    <h6 className="mb-0 fw-bold">Referral</h6>
                    <span style={{ fontSize: "18px" }}>
                      {expandedSections.referral ? "−" : "+"}
                    </span>
                  </div>
                  {expandedSections.referral && (
                    <div className="card-body">
                      <div className="row mb-3">
                        <div className="col-md-2">
                          <label className="form-label fw-bold">Referral</label>
                          <div className="d-flex gap-3">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="isReferred"
                                id="referralNo"
                                value="No"
                                checked={referralData.isReferred === "No"}
                                onChange={(e) =>
                                  handleReferralChange(
                                    "isReferred",
                                    e.target.value,
                                  )
                                }
                              />
                              <label
                                className="form-check-label"
                                htmlFor="referralNo"
                              >
                                No
                              </label>
                            </div>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="isReferred"
                                id="referralYes"
                                value="Yes"
                                checked={referralData.isReferred === "Yes"}
                                onChange={(e) =>
                                  handleReferralChange(
                                    "isReferred",
                                    e.target.value,
                                  )
                                }
                              />
                              <label
                                className="form-check-label"
                                htmlFor="referralYes"
                              >
                                Yes
                              </label>
                            </div>
                          </div>
                        </div>

                        {referralData.isReferred === "Yes" && (
                          <>
                            <div className="col-md-2">
                              <label className="form-label fw-bold">
                                Refer To
                              </label>
                              <select
                                className={`form-select ${errors.referTo ? "is-invalid" : ""}`}
                                value={referralData.referTo}
                                onChange={(e) =>
                                  handleReferralChange(
                                    "referTo",
                                    e.target.value,
                                  )
                                }
                              >
                                <option value="">Select...</option>
                                <option value="Internal">Internal</option>
                                <option value="External">External</option>
                              </select>
                              {errors.referTo && (
                                <div className="invalid-feedback d-block">
                                  {errors.referTo}
                                </div>
                              )}
                            </div>

                            <div className="col-md-2">
                              <label className="form-label fw-bold">
                                Refer Date:
                              </label>
                              <input
                                type="date"
                                className={`form-control ${errors.referralDate ? "is-invalid" : ""}`}
                                value={referralData.referralDate}
                                onChange={(e) =>
                                  handleReferralChange(
                                    "referralDate",
                                    e.target.value,
                                  )
                                }
                              />
                              {errors.referralDate && (
                                <div className="invalid-feedback d-block">
                                  {errors.referralDate}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {referralData.isReferred === "Yes" && (
                        <>
                          {/* INTERNAL REFERRAL */}
                          {referralData.referTo === "Internal" && (
                            <>
                              <div className="row mb-3">
                                <div className="col-md-2">
                                  <label className="form-label fw-bold">
                                    Current Priority No.
                                  </label>
                                  <input
                                    type="text"
                                    className={`form-control ${errors.currentPriorityNo ? "is-invalid" : ""}`}
                                    value={referralData.currentPriorityNo}
                                    onChange={(e) =>
                                      handleReferralChange(
                                        "currentPriorityNo",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Enter priority no"
                                  />
                                  {errors.currentPriorityNo && (
                                    <div className="invalid-feedback d-block">
                                      {errors.currentPriorityNo}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <hr className="my-4" />

                              <div className="row mb-3">
                                <div className="col-12">
                                  <h6 className="fw-bold mb-3">Department</h6>
                                  <div className="table-responsive">
                                    <table className="table table-bordered">
                                      <thead
                                        style={{ backgroundColor: "#b0c4de" }}
                                      >
                                        <tr>
                                          <th style={{ width: "10%" }}>
                                            Select
                                          </th>
                                          <th style={{ width: "70%" }}>
                                            Doctor
                                          </th>
                                          <th style={{ width: "10%" }}>Add</th>
                                          <th style={{ width: "10%" }}>
                                            Delete
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {departmentData.map((item, index) => (
                                          <tr key={index}>
                                            <td className="text-center">
                                              <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={item.selected}
                                                onChange={(e) =>
                                                  handleDepartmentChange(
                                                    index,
                                                    "selected",
                                                    e.target.checked,
                                                  )
                                                }
                                              />
                                            </td>
                                            <td>
                                              <select
                                                className={`form-select ${errors.departmentData ? "is-invalid" : ""}`}
                                                value={item.doctor}
                                                onChange={(e) =>
                                                  handleDepartmentChange(
                                                    index,
                                                    "doctor",
                                                    e.target.value,
                                                  )
                                                }
                                              >
                                                <option value="Select">
                                                  Select
                                                </option>
                                                <option value="Dr. Smith">
                                                  Dr. Smith
                                                </option>
                                                <option value="Dr. Johnson">
                                                  Dr. Johnson
                                                </option>
                                                <option value="Dr. Williams">
                                                  Dr. Williams
                                                </option>
                                                <option value="Dr. Brown">
                                                  Dr. Brown
                                                </option>
                                              </select>
                                            </td>
                                            <td className="text-center">
                                              <button
                                                className="btn btn-sm btn-success"
                                                onClick={handleAddDepartment}
                                              >
                                                +
                                              </button>
                                            </td>
                                            <td className="text-center">
                                              <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() =>
                                                  handleRemoveDepartment(index)
                                                }
                                                disabled={
                                                  departmentData.length === 1
                                                }
                                              >
                                                −
                                              </button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                    {errors.departmentData && (
                                      <div className="text-danger small">
                                        {errors.departmentData}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

                          {/* EXTERNAL REFERRAL */}
                          {referralData.referTo === "External" && (
                            <>
                              <div className="row mb-3">
                                <div className="col-md-2">
                                  <label className="form-label fw-bold">
                                    Referred Hospital Name
                                  </label>
                                  <input
                                    type="text"
                                    className={`form-control ${errors.referredHospitalName ? "is-invalid" : ""}`}
                                    value={referralData.referredHospitalName}
                                    onChange={(e) =>
                                      handleReferralChange(
                                        "referredHospitalName",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Enter hospital name"
                                  />
                                  {errors.referredHospitalName && (
                                    <div className="invalid-feedback d-block">
                                      {errors.referredHospitalName}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </>
                          )}

                          {/* REFERRAL NOTES (COMMON FOR ALL TYPES) */}
                          <div className="row">
                            <div className="col-12">
                              <h6 className="fw-bold mb-3">Referral Notes</h6>
                              <textarea
                                className={`form-control ${errors.referralNotes ? "is-invalid" : ""}`}
                                rows={4}
                                value={referralNotes}
                                onChange={(e) => {
                                  setReferralNotes(e.target.value);
                                  if (errors.referralNotes) {
                                    setErrors((prev) => ({
                                      ...prev,
                                      referralNotes: "",
                                    }));
                                  }
                                }}
                                placeholder="Enter referral notes"
                              ></textarea>
                              {errors.referralNotes && (
                                <div className="invalid-feedback d-block">
                                  {errors.referralNotes}
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="card mb-3">
                  <div
                    className="card-header py-3   border-bottom-1 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection("followUp")}
                  >
                    <h6 className="mb-0 fw-bold">Follow Up</h6>
                    <span style={{ fontSize: "18px" }}>
                      {expandedSections.followUp ? "−" : "+"}
                    </span>
                  </div>

                  {expandedSections.followUp && (
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between">
                        {/* Checkbox */}
                        <div className="d-flex align-items-center gap-2">
                          <input
                            type="checkbox"
                            className="form-check-input m-0"
                            checked={Boolean(followUps.followUpFlag)}
                            onChange={handleFollowUpChange}
                          />

                          <h6 className="fw-bold mb-0">Follow Up</h6>
                        </div>

                        <div className="d-flex align-items-center gap-4">
                          {/* Number of Days */}
                          <div className="d-flex align-items-center gap-2">
                            <label className="form-label mb-0">
                              Number of days
                            </label>
                            <input
                              type="number"
                              min={0}
                              className={`form-control ${errors.noOfFollowDays ? "is-invalid" : ""}`}
                              value={followUps.noOfFollowDays}
                              onChange={(e) => {
                                const days = e.target.value;
                                setFollowUps({
                                  ...followUps,
                                  noOfFollowDays: days,
                                  followUpDate: calculateFollowUpDate(days),
                                });
                                if (
                                  errors.noOfFollowDays ||
                                  errors.followUpDate
                                ) {
                                  setErrors((prev) => ({
                                    ...prev,
                                    noOfFollowDays: "",
                                    followUpDate: "",
                                  }));
                                }
                              }}
                              style={{ width: "120px" }}
                              disabled={!followUps.followUpFlag}
                            />
                            {errors.noOfFollowDays && (
                              <div className="invalid-feedback d-block">
                                {errors.noOfFollowDays}
                              </div>
                            )}
                          </div>

                          {/* Follow Up Date (Read Only) */}
                          <div className="d-flex align-items-center gap-2">
                            <label className="form-label mb-0">
                              Follow Up date
                            </label>
                            <input
                              type="date"
                              className="form-control"
                              style={{ width: "170px" }}
                              value={followUps.followUpDate}
                              readOnly
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Doctor's Remarks Section */}
                <div className="card mb-3">
                  <div
                    className="card-header py-3   border-bottom-1 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection("remarks")}
                  >
                    <h6 className="mb-0 fw-bold">Final Medicine Advice</h6>
                    <span style={{ fontSize: "18px" }}>
                      {expandedSections.remarks ? "−" : "+"}
                    </span>
                  </div>

                  {/* BODY */}
                  {expandedSections.remarks && (
                    <div className="card-body">
                      <div className="row align-items-end">
                        <div className="col-md-11">
                          <textarea
                            className="form-control"
                            rows={4}
                            value={doctorRemarksText}
                            onChange={(e) =>
                              setDoctorRemarksText(e.target.value)
                            }
                            placeholder="Doctor's remarks will be populated here"
                          />
                        </div>
                        <div className="col-md-1 text-center">
                          <button
                            className="btn btn-sm btn-outline-success p-1 px-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              openPopup("doctorRemark");
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-center mt-4">
                  <button
                    className="btn btn-primary me-3"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    type="button"
                  >
                    {isSubmitting ? (
                      <>
                        <i className="mdi mdi-loading mdi-spin"></i>{" "}
                        PROCESSING...
                      </>
                    ) : (
                      <>
                        <i className="mdi mdi-content-save"></i> SUBMIT
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-secondary me-3"
                    onClick={handleResetForm}
                  >
                    <i className="mdi mdi-refresh"></i> RESET
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={handleBackToList}
                  >
                    <i className="mdi mdi-arrow-left"></i> BACK
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modals - UPDATED */}
        <InvestigationModal
          show={showInvestigationModal}
          onClose={handleCloseInvestigationModal}
          templateType={investigationModalType}
          onTemplateSaved={(template) => {
            fetchInvestigationTemplates();
          }}
        />

        <TreatmentModal
          show={showTreatmentModal}
          onClose={handleCloseTreatmentModal}
          templateType={treatmentModalType}
          onTemplateSaved={() => {
            opdTemplateLoadedRef.current = false;
            fetchOpdTemplateData();
          }}
        />

        {/* OT Calendar Modal */}
        {showOtCalendarModal && (
          <div
            className="modal fade show"
            style={{
              display: "block",
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 1055,
            }}
            tabIndex="-1"
            onClick={() => setShowOtCalendarModal(false)}
          >
            <div
              className="modal-dialog modal-lg"
              style={{
                width: "calc(100vw - 310px)",
                left: "285px",
                maxWidth: "none",
                height: "90vh",
                margin: "5vh auto",
                position: "fixed",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">OT DASHBOARD</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowOtCalendarModal(false)}
                  ></button>
                </div>
                <div
                  className="modal-body"
                  style={{
                    overflowY: "auto",
                    flex: "1 1 auto",
                    maxHeight: "calc(90vh - 120px)",
                  }}
                >
                  <OTDashboard />
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowOtCalendarModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showCurrentMedicationModal && (
          <div
            className="modal fade show"
            style={{
              display: "block",
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 1055,
            }}
            tabIndex="-1"
            onClick={() => setShowCurrentMedicationModal(false)}
          >
            <div
              className="modal-dialog modal-lg"
              style={{
                width: "calc(100vw - 310px)",
                left: "285px",
                maxWidth: "none",
                height: "90vh",
                margin: "5vh auto",
                position: "fixed",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div
                  className="modal-header"
                  style={{
                    backgroundColor: "#6aab9c",
                    color: "white",
                    borderBottom: "1px solid #6aab9c",
                    padding: "0.75rem 1.5rem",
                    borderRadius: "8px 8px 0 0",
                  }}
                >
                  <h5 className="modal-title">Current Medication</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowCurrentMedicationModal(false)}
                  ></button>
                </div>
                <div
                  className="modal-body"
                  style={{
                    overflowY: "auto",
                    flex: "1 1 auto",
                    maxHeight: "calc(90vh - 120px)",
                  }}
                >
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover">
                      <thead style={{ backgroundColor: "#b0c4de" }}>
                        <tr>
                          <th style={{ minWidth: 30 }}>Sr. No.</th>
                          <th style={{ minWidth: 320 }}>Item Name</th>
                          <th className="text-center" style={{ minWidth: 70 }}>
                            Dosage
                          </th>
                          <th className="text-center" style={{ minWidth: 70 }}>
                            No. Of Days
                          </th>
                          <th className="text-center" style={{ minWidth: 110 }}>
                            Frequency
                          </th>
                          <th className="text-center" style={{ minWidth: 70 }}>
                            Total
                          </th>
                          <th className="text-center" style={{ minWidth: 70 }}>
                            Stock
                          </th>
                          <th style={{ minWidth: 130 }}>Prescribed By</th>
                          <th style={{ minWidth: 130 }}>Department</th>
                          <th className="text-center" style={{ minWidth: 110 }}>
                            Prescribed Date
                          </th>
                          <th className="text-center" style={{ minWidth: 50 }}>
                            Stop
                          </th>
                          <th className="text-center" style={{ minWidth: 50 }}>
                            Repeat
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentMedications.length > 0 ? (
                          currentMedications.map((medication, index) => (
                            <tr key={medication.id || index}>
                              <td>{index + 1}</td>
                              <td>{medication.drugName}</td>
                              <td className="text-center">
                                {medication.dosage}
                              </td>
                              <td className="text-center">{medication.days}</td>
                              <td className="text-center">
                                {medication.frequency}
                              </td>
                              <td className="text-center">
                                {medication.total}
                              </td>
                              <td className="text-center">
                                {medication.stock || 0}
                              </td>
                              <td>{medication.prescribedBy}</td>
                              <td>{medication.department}</td>
                              <td className="text-center">
                                {formatDateForDisplay(
                                  medication.prescribedDate,
                                )}
                              </td>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={
                                    currentMedicationActions[medication.id] ===
                                    "stop"
                                  }
                                  onChange={() =>
                                    handleCurrentMedicationAction(
                                      medication,
                                      "stop",
                                    )
                                  }
                                />
                              </td>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={
                                    currentMedicationActions[medication.id] ===
                                    "repeat"
                                  }
                                  onChange={() =>
                                    handleCurrentMedicationAction(
                                      medication,
                                      "repeat",
                                    )
                                  }
                                />
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="12" className="text-center text-muted">
                              No current medication found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {Object.values(currentMedicationActions).some(Boolean) && (
                    <div className="card mt-3">
                      <div className="card-header py-2">
                        <h6 className="mb-0 fw-bold">Selected Medications</h6>
                      </div>
                      <div className="card-body">
                        <div className="d-flex flex-wrap gap-2">
                          {currentMedications
                            .filter((medication) =>
                              Boolean(currentMedicationActions[medication.id]),
                            )
                            .map((medication) => (
                              <span
                                key={medication.id}
                                className={`badge ${
                                  currentMedicationActions[medication.id] ===
                                  "repeat"
                                    ? "bg-primary"
                                    : "bg-danger"
                                }`}
                              >
                                {medication.drugName} -{" "}
                                {currentMedicationActions[medication.id] ===
                                "repeat"
                                  ? "Repeat"
                                  : "Stop"}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCurrentMedicationModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showTreatmentAdviceModal && (
          <div
            className="modal d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">TREATMENT ADVICE TEMPLATE</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowTreatmentAdviceModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <thead style={{ backgroundColor: "#b0c4de" }}>
                        <tr>
                          <th style={{ width: "5%" }}></th>
                          <th style={{ width: "95%" }}>Template Values</th>
                        </tr>
                      </thead>
                      <tbody>
                        {treatmentAdviceTemplates.map((advice, index) => (
                          <tr key={index}>
                            <td>
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={selectedTreatmentAdviceItems.includes(
                                  index,
                                )}
                                onChange={() =>
                                  handleTreatmentAdviceCheckboxChange(index)
                                }
                              />
                            </td>
                            <td>{advice}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveTreatmentAdvice}
                  >
                    OK
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowTreatmentAdviceModal(false)}
                  >
                    CLOSE
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showPopup && (
          <ClinicalHistoryPopup
            show={showPopup}
            onClose={() => setShowPopup(false)}
            onPsychiatristSave={setPsychiatristAssessment}
            psychiatristValue={psychiatristAssessment}
            visitsData={previousVisitsData}
            vitalsData={previousVitalsData}
            popupType={clinicalPopupType}
            currentPage={
              clinicalPopupType === "visits"
                ? visitsCurrentPage
                : vitalsCurrentPage
            }
            totalPages={
              clinicalPopupType === "visits"
                ? visitsTotalPages
                : vitalsTotalPages
            }
            totalElements={
              clinicalPopupType === "visits"
                ? visitsTotalElements
                : vitalsTotalElements
            }
            pageSize={
              clinicalPopupType === "visits" ? visitsPageSize : vitalsPageSize
            }
            onPageChange={
              clinicalPopupType === "visits"
                ? handleVisitsPageChange
                : handleVitalsPageChange
            }
            isLoading={
              clinicalPopupType === "visits" ? visitsLoading : vitalsLoading
            }
            patientId={selectedPatient?.patientId}
            visitId={selectedPatient?.visitId}
          />
        )}

        {confirmationPopup.show &&
          createPortal(
            <div
              className="modal fade show"
              style={{
                display: "block",
                backgroundColor: "rgba(0,0,0,0.5)",
                zIndex: 9999,
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
              tabIndex="-1"
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {confirmationPopup.type === "success"
                        ? "Success"
                        : "Information"}
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => handleConfirmPopupClose(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="text-center">
                      {confirmationPopup.type === "success" ? (
                        <i
                          className="mdi mdi-check-circle"
                          style={{ fontSize: "48px", color: "#28a745" }}
                        ></i>
                      ) : (
                        <i
                          className="mdi mdi-alert-circle"
                          style={{ fontSize: "48px", color: "#dc3545" }}
                        ></i>
                      )}
                      <p className="mt-3">{confirmationPopup.message}</p>
                    </div>
                  </div>
                  <div className="modal-footer justify-content-center">
                    {confirmationPopup.onConfirm && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleConfirmPopupClose(true)}
                      >
                        {confirmationPopup.confirmText || "Yes"}
                      </button>
                    )}
                    {confirmationPopup.onCancel && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleConfirmPopupClose(false)}
                      >
                        {confirmationPopup.cancelText || "No"}
                      </button>
                    )}
                    {!confirmationPopup.onConfirm &&
                      !confirmationPopup.onCancel && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleConfirmPopupClose(true)}
                        >
                          OK
                        </button>
                      )}
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}
      </div>
    );
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">
                  {departmentName
                    ? `${departmentName} Waiting List`
                    : "Waiting List"}
                </h4>
              </div>
              {loading && <LoadingScreen />}
            </div>
            <div className="card-body">
              <div className="card mb-3">
                <div className="card-body">
                  <div className="row g-3 align-items-end">
                    <div className="col-md-3">
                      <label className="form-label fw-bold">
                        Doctor List <span>*</span>
                      </label>
                      <select
                        className="form-select"
                        value={searchFilters.doctorList}
                        onChange={(e) =>
                          handleFilterChange("doctorList", e.target.value)
                        }
                      >
                        <option value="">Select</option>
                        {doctorData.map((d) => (
                          <option key={d.userId} value={d.userId}>
                            {[d.firstName, d.middleName, d.lastName]
                              .filter(Boolean)
                              .join(" ")}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-2">
                      <label className="form-label fw-bold">Session</label>
                      <select
                        className="form-select"
                        value={searchFilters.session}
                        onChange={(e) =>
                          handleFilterChange("session", e.target.value)
                        }
                      >
                        <option value="">Select</option>
                        {sessionData.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.sessionName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-2">
                      <label className="form-label fw-bold">Mobile No.</label>
                      <input
                        type="text"
                        className="form-control"
                        value={searchFilters.mobileNo}
                        onChange={(e) =>
                          handleFilterChange("mobileNo", e.target.value)
                        }
                        maxLength={20}
                      />
                    </div>

                    <div className="col-md-2">
                      <label className="form-label fw-bold">Patient Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={searchFilters.patientName}
                        onChange={(e) =>
                          handleFilterChange("patientName", e.target.value)
                        }
                        maxLength={30}
                      />
                    </div>

                    <div className="col-md-3 d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-primary w-100"
                        onClick={handleSearch}
                        disabled={isSearching}
                      >
                        {isSearching ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Searching...
                          </>
                        ) : (
                          <>
                            <i className="mdi mdi-magnify"></i> Search
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary w-100"
                        onClick={handleReset}
                      >
                        RESET
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>S.N.</th>
                      <th>Token No.</th>
                      <th>Patient No.</th>
                      <th>Patient Name</th>
                      <th>Relation</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>Visit Type</th>
                      <th>Action</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((item, index) => (
                        <tr
                          key={item.id}
                          onClick={() => handleRowClick(item)}
                          style={{ cursor: "pointer" }}
                        >
                          {/* SERIAL NUMBER */}
                          <td>
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td className="text-center">
                            <span className="badge btn btn-primary fs-6 px-2 py-1 rounded-pill shadow-sm">
                              {item.tokenNo}
                            </span>
                          </td>
                          <td>{item.mobileNo}</td>
                          <td>{item.patientName}</td>
                          <td>{item.relation}</td>
                          <td>{item.age}</td>
                          <td>{item.gender}</td>
                          <td>{item.visitType}</td>

                          {/* RELEASE BUTTON */}
                          <td>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRelease(item.id);
                              }}
                            >
                              RELEASE
                            </button>
                          </td>

                          {/* CLOSE BUTTON */}
                          <td>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClose(item.visitId);
                              }}
                            >
                              CLOSE
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10" className="text-center text-muted">
                          No records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="d-flex mb-3 mt-3">
                <span className="badge bg-danger me-2">Priority-1</span>
                <span className="badge bg-warning text-dark me-2">
                  Priority-2
                </span>
                <span className="badge bg-success">Priority-3</span>
              </div>

              <Pagination
                totalItems={waitingList.length}
                itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralMedicineWaitingList;
