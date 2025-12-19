import { useState, useEffect, useRef } from "react"
import placeholderImage from "../../../assets/images/placeholder.jpg"
import OTDashboard from "../GeneralMedicineWaitingList/OTDashboard"
import InvestigationModal from "../GeneralMedicineWaitingList/InvestigationModal"
import TreatmentModal from "../GeneralMedicineWaitingList/TreatmentModal"
import { OPD_PATIENT, OPD_TEMPLATE, MAS_FREQUENCY, MAS_DRUG_MAS, DRUG_TYPE, ITEM_CLASS, MAS_INVESTIGATION, MASTERS } from "../../../config/apiConfig";
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import LoadingScreen from "../../../Components/Loading/index";
import Popup from "../../../Components/popup/index";
import DuplicatePopup from "../GeneralMedicineWaitingList/DuplicatePopup";
import MasFamilyModel from "../GeneralMedicineWaitingList/FaimalyHistryModel"

const OpdRRecallPatient = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const [showDetailView, setShowDetailView] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showOtCalendarModal, setShowOtCalendarModal] = useState(false)
  const [showCurrentMedicationModal, setShowCurrentMedicationModal] = useState(false)
  const [selectedTreatmentTemplateIds, setSelectedTreatmentTemplateIds] = useState(new Set());
  const [removedInvestigationIds, setRemovedInvestigationIds] = useState([]);
  const [activeDrugNameDropdown, setActiveDrugNameDropdown] = useState(null);
  const drugNameDropdownClickedRef = useRef(false);
  const tableContainerRef = useRef(null);
  const [drugCodeOptions, setDrugCodeOptions] = useState([]);
  const [removedTreatmentIds, setRemovedTreatmentIds] = useState([]);
  const [removeIcdIds, setRemoveIcdIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTreatmentTemplateId, setSelectedTreatmentTemplateId] = useState("Select..");
  const [usedTemplateIds, setUsedTemplateIds] = useState(new Set());
  const [recallPatientOpd, setRecallPatientOpd] = useState([]);
  const [opdTemplateData, setOpdTemplateData] = useState([]);
  const [allFrequencies, setAllFrequencies] = useState([])
  const today = new Date().toISOString().split("T")[0];
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState("");
  const [masICDData, setMasICDData] = useState([]);
  const [popupMessage, setPopupMessage] = useState("");
  const [showModelPopup, setModelShowPopup] = useState(false);
  const [popupType, setPopupType] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [icdDropdown, setIcdDropdown] = useState([]);
  const [page, setPage] = useState(0);
  const [lastPage, setLastPage] = useState(false);
  const [search, setSearch] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const [duplicateItems, setDuplicateItems] = useState([]);
  const [showDuplicatePopup, setShowDuplicatePopup] = useState(false);
  const getToday = () => new Date().toISOString().split("T")[0]
  const [doctorRemarksText, setDoctorRemarksText] = useState("");
  const [searchFilters, setSearchFilters] = useState({
    mobileNumber: "",
    patientName: "",
    date: getToday(),
  });
  const debounceRef = useRef({});

  const [followUps, setFollowUps] = useState({
    noOfFollowDays: "",
    followUpFlag: "n",
    FolloUpDate: getToday(),
  });

  const [labFlag, setLabFlag] = useState("")
  const [radioFlag, setRadioFlag] = useState("")

  // Admission state


  const [wardCategory, setWardCategory] = useState("")
  const [wardCategories, setWardCategories] = useState([])

  const [admissionCareLevel, setAdmissionCareLevel] = useState("")
  const [admissionCareLevelName, setAdmissionCareLevelName] = useState("")

  const [wardDepartments, setWardDepartments] = useState([])
  const [wardName, setWardName] = useState("")

  const [occupiedBeds, setOccupiedBeds] = useState("0")
  const [vacantBeds, setVacantBeds] = useState("0")



  const [admissionDate, setAdmissionDate] = useState("")
  const [admissionRemarks, setAdmissionRemarks] = useState("")
  const [admissionPriority, setAdmissionPriority] = useState("Normal")
  const [admissionAdvised, setAdmissionAdvised] = useState(false)
  const [wardDepartment, setWardDepartment] = useState([])
  const [careLevels, setCareLevels] = useState([])
  const [admissionPriorities, setAdmissionPriorities] = useState([
    "Normal", "Urgent", "Critical"
  ])



  const fetchWardCategoryData = async () => {
    try {
      const data = await getRequest(`${MASTERS}/masWardCategory/getAll/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setWardCategories(data.response);
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
        `${MASTERS}/ward-department/getAllBy/${categoryId}`
      )

      if (data.status === 200 && Array.isArray(data.response)) {
        setWardDepartments(data.response)
      } else {
        setWardDepartments([])
      }
    } catch (error) {
      console.error("Error fetching Ward data:", error)
    }
  }


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

  const handleWardCategoryChange = (categoryId) => {
    setWardCategory(categoryId)
    setWardName("")
    setOccupiedBeds("0")
    setVacantBeds("0")
    setWardDepartments([])

    const selectedCategory = wardCategories.find(
      (cat) => cat.categoryId === categoryId
    )

    if (selectedCategory) {
      // store care id
      setAdmissionCareLevel(selectedCategory.careId)

      // show care level name
      setAdmissionCareLevelName(selectedCategory.careLevelName)

      // fetch ward list
      fetchWardData(categoryId)
    }
  }

  const handleWardNameChange = (deptId) => {
    setWardName(deptId)

    const selectedWard = wardDepartments.find(
      (dept) => dept.id === deptId
    )

    if (selectedWard) {
      setOccupiedBeds(selectedWard.occupiedBed)
      setVacantBeds(selectedWard.vacantBed)
    }
  }


  const fatchDrugCodeOptions = async () => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_DRUG_MAS}/getAllBySectionOnly/1`);
      if (response && response.response) {
        setDrugCodeOptions(response.response);
      }
    } catch (err) {
      console.error("Error fetching drug options:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllFrequencies = async () => {
    try {
      const response = await getRequest(`${MAS_FREQUENCY}/getAll/1`)
      if (response && response.response) {
        setAllFrequencies(response.response)
      } else {
        setAllFrequencies([])
      }
    } catch (error) {
      console.error("Error fetching frequencies:", error)
      setAllFrequencies([])
    }
  }

  const fetchMasProcedureData = async (page, searchText = "") => {
    try {
      const data = await getRequest(
        `${MASTERS}/masProcedureFilter/getAll?flag=0&page=${page}&size=20&search=${encodeURIComponent(searchText)}`
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
    const result = await fetchMasProcedureData(nextPage, procedureSearch[openProcedureDropdown] || "");

    setProcedureDropdown((prev) => [...prev, ...result.list]);
    setProcedureLastPage(result.last);
    setProcedurePage(nextPage);
  };

  const updateProcedure = (selected, index) => {
    if (!selected) return;

    // prevent duplicate procedureId
    const exists = procedureCareItems.some(
      (item, idx) =>
        String(item.procedureId) === String(selected.procedureId) && idx !== index
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
        procedureId: selected.procedureId,
        procedureName: selected.procedureName
      };
      return updated;
    });

    // clear search text
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
        (ref) => ref && ref.contains && ref.contains(e.target)
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
        `${MASTERS}/masIcd/all?flag=0&page=${page}&size=20&search=${encodeURIComponent(searchText)}`
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

  const loadFirstPage = async (index) => {
    const searchText = search[index] || "";
    const result = await fetchMasICDData(0, searchText);

    setIcdDropdown(result.list);
    setLastPage(result.last);
    setPage(0);
  };


  const handleIcdSearch = (value, index) => {
    // Update text
    setSearch((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });

    // Clear previous debounce for this row
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
    const result = await fetchMasICDData(
      nextPage,
      search[openDropdown] || ""
    );

    setIcdDropdown((prev) => [...prev, ...result.list]);
    setLastPage(result.last);
    setPage(nextPage);
  };


  const updateICD = (selectedICD, index) => {
    if (!selectedICD) return;

    const exists = diagnosisItems.some(
      (item, idx) =>
        String(item.icdDiagId) === String(selectedICD.icdId) && idx !== index
    );

    if (exists) {
      setDuplicateItems([
        { icdDiagnosis: `${selectedICD.icdCode} - ${selectedICD.icdName}` }
      ]);
      setShowDuplicatePopup(true);
      return;
    }

    setDiagnosisItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        icdDiagId: selectedICD.icdId,
        icdDiagnosis: `${selectedICD.icdCode} - ${selectedICD.icdName}`, // ✅ code + name
      };
      return updated;
    });

    setSearch((prev) => {
      const updated = [...prev];
      updated[index] = "";
      return updated;
    });
  };


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);



  const [investigationDropdown, setInvestigationDropdown] = useState([]);
  const [investigationSearch, setInvestigationSearch] = useState([]);
  const [investigationPage, setInvestigationPage] = useState(0);
  const [investigationLastPage, setInvestigationLastPage] = useState(true);
  const [openInvestigationDropdown, setOpenInvestigationDropdown] = useState(null);

  const debounceInvestigationRef = useRef([]);
  const dropdownInvestigationRef = useRef(null);



  const fetchOpdTemplateData = async () => {
    try {
      const data = await getRequest(`${OPD_TEMPLATE}/getAll/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setOpdTemplateData(data.response);
      } else {
        setOpdTemplateData([]);
      }
    } catch (error) {
      console.error("Error fetching Doctor data:", error);
    }
  };

  const openPopup = (type) => {
    setPopupType(type);
    setModelShowPopup(true);
  };

  const handleClose = () => {
    setModelShowPopup(false);
    setSelectedItems([]);
  };

  const handleOk = () => {
    if (selectedItems.length === 0) {
      alert("Please select at least one item.");
      return;
    }

    const newNames = selectedItems.map(x => x.name);

    const mergeValues = (oldValue, newValues) => {
      const oldArr = oldValue ? oldValue.split(",").map(x => x.trim()) : [];
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
      setGeneralTreatmentAdvice(prev =>
        mergeValues(prev, newNames)
      );
    }

    if (popupType === "doctorRemark") {
      setDoctorRemarksText(prev =>
        mergeValues(prev, newNames)
      );
    }

    setModelShowPopup(false);
    setSelectedItems([]);
  };


  const handleSelect = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(x => x.id === item.id);

      if (exists) {
        return prev.filter(x => x.id !== item.id);
      }

      return [...prev, item];
    });
  };

  const handleSearch = async () => {
    await fetchOpdPatientData();
  };

  useEffect(() => {
    if (activeDrugNameDropdown !== null) {
      const container = tableContainerRef.current;
      const inputEl = document.getElementById(`drug-name-${activeDrugNameDropdown}`);
      const dropdownHeight = 200;

      if (container && inputEl) {
        const inputRect = inputEl.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        if (inputRect.bottom + dropdownHeight > containerRect.bottom) {
          container.scrollTop += (inputRect.bottom + dropdownHeight) - containerRect.bottom + 10;
        }
      }
    }
  }, [activeDrugNameDropdown]);

  const showPopup = (message, type = "info", onCloseCallback = null) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
        if (onCloseCallback) onCloseCallback();
      },
    });
  };

  const handleReset = () => {
    const today = new Date().toISOString().split("T")[0];

    setSearchFilters({
      mobileNumber: "",
      patientName: "",
      date: today,
    });

    fetchOpdPatientData();
  };

  const fetchOpdPatientData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (searchFilters.mobileNumber) params.append("mobile", searchFilters.mobileNumber);
      if (searchFilters.patientName) params.append("name", searchFilters.patientName);
      if (searchFilters.date) params.append("visitDate", searchFilters.date);

      const data = await getRequest(`${OPD_PATIENT}/recallVisit?${params.toString()}`);

      if (data.status === 200 && Array.isArray(data.response)) {
        setRecallPatientOpd(data.response);
      } else {
        setRecallPatientOpd([]);
      }
    } catch (error) {
      console.error("Error fetching Doctor data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpdPatientData();
    fetchOpdTemplateData();
    fetchAllFrequencies();
    fatchDrugCodeOptions();
    fetchMasICDData();
    fetchWardCategoryData();
  }, []);

  const handleClearAllTreatmentTemplates = () => {
    setSelectedTreatmentTemplateIds(new Set());

    setTreatmentItems(prev => {
      const updated = prev.filter(item => {
        const tpl = (item.templateId ?? "").trim();
        if (item.treatmentId !== null) return true;
        if (tpl === "") return true;
        return false;
      })
        .map(item => {
          if (item.treatmentId !== null) {
            return { ...item, templateId: "" };
          }
          return item;
        });

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
            templateId: ""
          }
        ];
      }

      return updated;
    });
  };

  const handleRemoveTreatmentTemplateItems = (templateId) => {
    setTreatmentItems(prev =>
      prev
        .map(item => {
          if (!item.templateId) return item;

          const ids = item.templateId
            .split(",")
            .filter(id => id !== String(templateId));

          if (item.treatmentId != null) {
            return {
              ...item,
              templateId: ids.join(",")
            };
          }

          if (ids.length > 0) {
            return {
              ...item,
              templateId: ids.join(",")
            };
          }

          return null;
        })
        .filter(item => item !== null)
    );

    setSelectedTreatmentTemplateIds(prev => {
      const updated = new Set(prev);
      updated.delete(templateId);
      return updated;
    });
  };

  const handleUpdateRecallPatient = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (!selectedPatient.visitId) {
        alert("Recall ID missing!");
        setIsSubmitting(false);
        return;
      }

      const icdObjList = diagnosisItems.map(item => ({
        id: item.id,
        icdId: item.icdDiagId ?? null,
        icdDiagName: item.icdDiagnosis || ""
      }));

      const icdDiagnosisStr = diagnosisItems
        .map(item => item.icdDiagnosis?.trim())
        .filter(v => v?.length > 0)
        .join(",");

      const payload = {
        ...formData,
        mlcCase: formData.mlcCase ? "y" : "n",
        workingDiagnosis,
        icdDiagnosis: icdDiagnosisStr,
        icdObj: icdObjList,
        doctorRemarks: doctorRemarksText,
        treatments: treatmentItems,
        // procedureCare: procedureCareItems,
        followUpFlag: followUps.followUpFlag ? "y" : "n",
        followUpDate: followUps.FolloUpDate ? new Date(followUps.FolloUpDate).toISOString() : null,
        followUpDays: Number(followUps.noOfFollowDays),
        // ===== Admission Details =====
        admissionFlag: admissionAdvised ? "y" : "n",
        admissionAdvisedDate: admissionAdvised && admissionDate ? new Date(admissionDate).toISOString() : null,
        admissionRemarks: additionalAdvice || null,
        admissionCareLevel: admissionAdvised ? Number(admissionCareLevel) : null,
        admissionWardCategory: admissionAdvised ? Number(wardCategory) : null,
        admissionWard: admissionAdvised ? Number(wardName) : null,
        admissionPriority: admissionAdvised ? admissionPriority : null,
        referralFlag: referralData.isReferred === "Yes" ? "y" : "n",
        referralRemarks: referralNotes,
        referralDate: referralData.referralDate ? new Date(referralData.referralDate).toISOString() : null,
        investigations: investigationItems,
        labFlag: labFlag,
        radioFlag: radioFlag,
        treatmentAdvice: generalTreatmentAdvice,
        removeIcdIds,
        removedTreatmentIds,
        removedInvestigationIds,
        removeprocedureCareIds: deletedProcedureCareIds,
        opdPatientId: selectedPatient.opdPatientId,
        patientId: selectedPatient.patientId,
        visitId: selectedPatient.visitId,
        departmentId: selectedPatient.deptId,
        hospitalId: selectedPatient.hospitalId ?? null,
        doctorId: selectedPatient.docterId
      };

      const response = await putRequest(`${OPD_PATIENT}/update-recall-patient`, payload);

      if (response?.status === 200 || response?.success === true) {
        showPopup(
          "Recall patient updated successfully!",
          "success",
          () => handleBackWithFatch()
        );
      } else {
        alert("Updated but unexpected response received.");
      }

    } catch (error) {
      console.error("Update Error:", error);
      showPopup("Failed to update. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackWithFatch = async () => {
    handleBackToList();
    handleSearch();
  };

  // Modal states
  const [showInvestigationModal, setShowInvestigationModal] = useState(false)
  const [showTreatmentModal, setShowTreatmentModal] = useState(false)
  const [investigationModalType, setInvestigationModalType] = useState("create")
  const [treatmentModalType, setTreatmentModalType] = useState("create")
  const [investigationType, setInvestigationType] = useState(null)
  const [procedureCareType, setProcedureCareType] = useState("procedure")
  const [investigationTemplates, setInvestigationTemplates] = useState([])
  const [selectedInvestigationTemplate, setSelectedInvestigationTemplate] = useState("Select..")
  const [investigationTemplateLoading, setInvestigationTemplateLoading] = useState(false)
  const [allInvestigations, setAllInvestigations] = useState([])
  const [filteredInvestigationsByType, setFilteredInvestigationsByType] = useState([])
  const [investigationTypes, setInvestigationTypes] = useState([])
  const [activeInvestigationRowIndex, setActiveInvestigationRowIndex] = useState(null)

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
  })

  const [selectedHistoryType, setSelectedHistoryType] = useState("")

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
    treatmentAdvice: "",
    pastHistory: "",
    familyHistory: "",
    mlcCase: false,
  })

  const [errors, setErrors] = useState({})

  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false)
  const [showUpdateTemplateModal, setShowUpdateTemplateModal] = useState(false)
  const [showTreatmentAdviceModal, setShowTreatmentAdviceModal] = useState(false)
  const [treatmentAdviceModalType, setTreatmentAdviceModalType] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("Select..")
  const [templateName, setTemplateName] = useState("")
  const [investigationItems, setInvestigationItems] = useState([
    {
      id: null,
      investigationId: "",
      templateIds: [],
      name: "",
      date: getToday()
    }
  ]);
  const [updateTemplateSelection, setUpdateTemplateSelection] = useState("Select..")
  const [templateType, setTemplateType] = useState("")
  const [dropdownVisible, setDropdownVisible] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({
    x: 0,
    y: 0,
    height: 0,
  })
  const [dropdownWidth, setDropdownWidth] = useState(0)

  const [workingDiagnosis, setWorkingDiagnosis] = useState("")

  const [diagnosisItems, setDiagnosisItems] = useState([
    {
      id: null,
      icdDiagId: "",
      icdDiagnosis: "",
      communicableDisease: false,
      infectiousDisease: false,
    },
  ])

  const [templates, setTemplates] = useState(["Blood Test Template", "Cardiac Template", "Diabetes Template"])
  const [treatmentAdviceTemplates, setTreatmentAdviceTemplates] = useState([
    "MEDICINES TO BE REPEATED AT FAC",
    "WARM WATER GARGLING, WITH/WITHOUT",
    "REVIEW AFTER 3 MONTHS WITH - FBS - P",
    "REVIEW AFTER 3 MONTHS",
    "REVIEW AFTER 6 MONTHS",
  ])

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
      stock: "",
      templateId: "",
    }
  ]);

  console.log("treat", treatmentItems)

  const [treatmentAdviceSelection, setTreatmentAdviceSelection] = useState("")
  const [generalTreatmentAdvice, setGeneralTreatmentAdvice] = useState("")
  const [procedureTreatmentAdvice, setProcedureTreatmentAdvice] = useState("")
  const [physiotherapyTreatmentAdvice, setPhysiotherapyTreatmentAdvice] = useState("")
  const [selectedTreatmentAdviceItems, setSelectedTreatmentAdviceItems] = useState([])

  const [procedureDropdown, setProcedureDropdown] = useState([]);
  const [procedurePage, setProcedurePage] = useState(0);
  const [procedureLastPage, setProcedureLastPage] = useState(true);
  const [procedureSearch, setProcedureSearch] = useState([]);
  const [openProcedureDropdown, setOpenProcedureDropdown] = useState(null);
  const procedureDropdownRef = useRef([]);
  const [procedureCareItems, setProcedureCareItems] = useState([
    {
      id: null,
      procedureId: null,
      procedureName: "",
      frequencyId: null,
      noOfDays: "",
      remarks: ""
    }
  ]);

  // store deleted ids
  const [deletedProcedureCareIds, setDeletedProcedureCareIds] = useState([]);

  console.log("procedureCareItems", procedureCareItems)


  const [physiotherapyItems, setPhysiotherapyItems] = useState([
    {
      name: "",
      frequency: "",
      days: "",
      remarks: "",
    },
  ])

  const [surgeryType, setSurgeryType] = useState("major")
  const [surgerySearchInput, setSurgerySearchInput] = useState("")
  const [isSurgeryDropdownVisible, setIsSurgeryDropdownVisible] = useState(false)
  const [selectedSurgeryIndex, setSelectedSurgeryIndex] = useState(null)
  const [additionalAdvice, setAdditionalAdvice] = useState("")

  // Referral state
  const [referralData, setReferralData] = useState({
    isReferred: "No",
    referTo: "",
    referralType: "Internal",
    referralScope: "Internal",
    referralDate: getToday(),
    empanel: false,
    currentPriorityNo: "",
    select: "",
    noOfDays: "",
    treatmentType: "OPD",
    referredFor: "",
    hospital: "",
  })

  const [departmentData, setDepartmentData] = useState([
    {
      selected: false,
      doctor: "Select",
    }
  ])

  const [referralNotes, setReferralNotes] = useState("")

  const surgeryOptions = [
    { id: 1, name: "Appendectomy", code: "APD" },
    { id: 2, name: "Cholecystectomy", code: "CHO" },
    { id: 3, name: "Hernia Repair", code: "HER" },
    { id: 4, name: "Hysterectomy", code: "HYS" },
    { id: 5, name: "Prostatectomy", code: "PRO" },
  ]

  const [surgeryItems, setSurgeryItems] = useState([
    {
      surgery: "",
      selected: false,
    },
  ])

  const [selectedBloodTestTemplate, setSelectedBloodTestTemplate] = useState("");

  const itemsPerPage = 10

  // Track selected templates to prevent duplicates
  const [selectedTemplateIds, setSelectedTemplateIds] = useState(new Set())

  // Modal handlers
  const handleOpenInvestigationModal = (type = "create") => {
    setInvestigationModalType(type)
    setShowInvestigationModal(true)
  }

  const handleCloseInvestigationModal = () => {
    setShowInvestigationModal(false)
    setInvestigationModalType("create")
  }

  const handleOpenTreatmentModal = (type = "create") => {
    setTreatmentModalType(type)
    setShowTreatmentModal(true)
  }

  const handleCloseTreatmentModal = () => {
    setShowTreatmentModal(false)
    setTreatmentModalType("create")
  }

  const handleOpenCurrentMedicationModal = () => {
    setShowCurrentMedicationModal(true)
  }

  const handleCloseCurrentMedicationModal = () => {
    setShowCurrentMedicationModal(false)
  }


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".form-control")) {
        setDropdownVisible(false)
      }
    }
    window.addEventListener("click", handleClickOutside)
    return () => window.removeEventListener("click", handleClickOutside)
  }, [])

  const fetchInvestigationTypes = async () => {
    const res = await getRequest("/DgMasInvestigation/uniqueInvestigation/types")
    if (res?.response) {
      setInvestigationTypes(res.response)
    }
  }
  useEffect(() => {
    fetchInvestigationTypes();
  }, []);

  const fetchInvestigationTemplates = async (flag = 1) => {
    try {
      setInvestigationTemplateLoading(true)
      const response = await getRequest(`${OPD_TEMPLATE}/getAllTemplateInvestigations/${flag}`)
      if (response && response.response) {
        setInvestigationTemplates(response.response)
      } else {
        setInvestigationTemplates([])
      }
    } catch (error) {
      console.error("Error fetching investigation templates:", error)
      setInvestigationTemplates([])
    } finally {
      setInvestigationTemplateLoading(false)
    }
  }

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
        return {
          list: data.response.content,
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
    setInvestigationSearch((prev) => {
      const updated = [...prev];
      updated[index] = value;
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
      investigationSearch[openInvestigationDropdown] || ""
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
        name: selected.investigationName,
      };
      return updated;
    });

    setInvestigationSearch((prev) => {
      const updated = [...prev];
      updated[index] = "";
      return updated;
    });

    setOpenInvestigationDropdown(null);
  };


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownInvestigationRef.current && !dropdownInvestigationRef.current.contains(e.target)) {
        setOpenInvestigationDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  console.log("allInvestigations", allInvestigations)

  const filterInvestigationsByMainChargeCode = () => {
    if (!investigationType || allInvestigations.length === 0) {
      setFilteredInvestigationsByType([])
      return
    }

    const selectedType = investigationTypes.find(type => type.value === investigationType)
    if (selectedType) {
      const filtered = allInvestigations.filter(inv => inv.mainChargeCodeId === selectedType.id)
      setFilteredInvestigationsByType(filtered)
    } else {
      setFilteredInvestigationsByType([])
    }
  }

  const filterInvestigationsBySearch = (searchQuery) => {
    if (!searchQuery.trim()) {
      return filteredInvestigationsByType.slice(0, 5)
    }

    const filtered = filteredInvestigationsByType
      .filter(inv =>
        inv.investigationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.mainChargeCodeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.subChargeCodeName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5)

    return filtered
  }

  const handleInvestigationTemplateSelect = (template) => {
    const templateId = template.templateId;

    // Prevent selecting same template twice
    if (selectedTemplateIds.has(templateId)) {
      alert("This template is already selected");
      setSelectedInvestigationTemplate("Select..");
      return;
    }

    setSelectedTemplateIds(prev => new Set([...prev, templateId]));
    setSelectedInvestigationTemplate(templateId);

    if (!template.investigationResponseList) {
      setSelectedInvestigationTemplate("Select..");
      return;
    }

    let duplicateItemsBuffer = [];

    setInvestigationItems(prev => {
      const updated = [...prev];

      const existingMap = new Map(
        prev.map(item => [item.investigationId, item])
      );

      template.investigationResponseList.forEach(item => {
        const existing = existingMap.get(item.investigationId);

        if (existing) {
          // ✅ SAFE templateIds handling
          const templateIds = Array.isArray(existing.templateIds)
            ? existing.templateIds
            : [];

          if (!templateIds.includes(templateId)) {
            const index = updated.findIndex(
              i => i.investigationId === item.investigationId
            );

            updated[index] = {
              ...existing,
              templateIds: [...templateIds, templateId]
            };
          }

          duplicateItemsBuffer.push({
            investigationId: item.investigationId,
            investigationName:
              existing.name ?? item.investigationName
          });

        } else {
          // ✅ Always initialize templateIds
          updated.push({
            id: null,
            name: item.investigationName ?? `Investigation #${item.investigationId}`,
            date: getToday(),
            investigationId: item.investigationId,
            templateSource: template.opdTemplateName,
            templateIds: [templateId]
          });
        }
      });

      return updated;
    });

    setTimeout(() => {
      const unique = Array.from(
        new Map(
          duplicateItemsBuffer.map(d => [d.investigationId, d])
        ).values()
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

    setInvestigationItems(prevItems => {
      return prevItems.filter(item => {
        const ids = item.templateIds ?? [];

        if (item.id !== null) return true;
        if (ids.length === 0) return true;
        return false;
      });
    });
  };

  const handleRemoveTemplateItems = (templateId) => {
    setSelectedTemplateIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(templateId);
      return newSet;
    });

    setInvestigationItems(prev => {
      return prev
        .map(item => {
          const newTemplateIds = item.templateIds?.filter(id => id !== templateId) || [];
          return {
            ...item,
            templateIds: newTemplateIds
          };
        })
        .filter(item => {
          if (item.templateIds.length === 0 && item.id === null) return false;
          return true;
        });
    });
  };

  const handleInvestigationSelect = (index, investigation) => {
    const duplicate = investigationItems.find(
      (item, idx) =>
        idx !== index && item.investigationId === investigation.investigationId
    );

    if (duplicate) {
      setDuplicateItems([
        {
          investigationId: investigation.investigationId,
          investigationName: investigation.investigationName
        }
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

    const newItems = [...investigationItems];
    newItems[index] = {
      ...newItems[index],
      name: investigation.investigationName,
      investigationId: investigation.investigationId,
    };
    setInvestigationItems(newItems);
    setActiveInvestigationRowIndex(null);
  };

  // Referral handlers
  const handleReferralChange = (field, value) => {
    if (field === "isReferred" && value === "No") {
      setReferralData(prev => ({
        ...prev,
        isReferred: "No",
        referralDate: "",
      }));
      setReferralNotes("");
    } else {
      setReferralData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };


  const handleDepartmentChange = (index, field, value) => {
    const newData = [...departmentData]
    newData[index] = {
      ...newData[index],
      [field]: value
    }
    setDepartmentData(newData)
  }

  const handleAddDepartment = () => {
    setDepartmentData([
      ...departmentData,
      {
        selected: false,
        doctor: "Select",
      }
    ])
  }

  const handleRemoveDepartment = (index) => {
    if (departmentData.length === 1) return
    const newData = departmentData.filter((_, i) => i !== index)
    setDepartmentData(newData)
  }

  useEffect(() => {
    if (showDetailView && selectedPatient) {
      fetchInvestigationTemplates()
    }
  }, [showDetailView, selectedPatient])


  useEffect(() => {
    if (investigationTypes.length > 0 && !investigationType) {
      setInvestigationType(investigationTypes[0].id);
    }
  }, [investigationTypes]);

  useEffect(() => {
    filterInvestigationsByMainChargeCode()
  }, [investigationType])

  const handleFilterChange = (field, value) => {
    setSearchFilters((prev) => ({
      ...prev,
      [field]: value,
    }))
    setCurrentPage(1)
  }

  const handleMobileChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 10) value = value.slice(0, 10);
    if (value.length > 0 && value.length < 10) {
      console.error("Mobile number must be 10 digits");
    }
    handleFilterChange("mobileNumber", value);
  };

  const handleRowClick = async (patient) => {
    setSelectedPatient(patient);

    /* -------------------- VITALS / BASIC DATA -------------------- */
    setFormData({
      height: patient.height || "",
      weight: patient.weight || "",
      temperature: patient.temperature || "",
      systolicBP: patient.bpSystolic || "",
      diastolicBP: patient.bpDiastolic || "",
      pulse: patient.pulse || "",
      bmi: patient.bmi || "",
      rr: patient.rr || "",
      spo2: patient.spo2 || "",
      patientSymptoms: patient.patientSignsSymptoms || "",
      clinicalExamination: patient.clinicalExamination || "",
      pastHistory: patient.pastMedicalHistory || "",
      familyHistory: patient.familyHistory || "",
      mlcCase: patient.mlcFlag === "y",
    });

    setGeneralTreatmentAdvice(patient.treatmentAdvice || "");
    setWorkingDiagnosis(patient?.workingDiag || "");

    /* -------------------- DIAGNOSIS -------------------- */
    setDiagnosisItems(
      patient.icdDiag?.length
        ? patient.icdDiag.map(item => ({
          id: item.id ?? null,
          icdDiagId: item.icdId ?? "",
          icdDiagnosis: item.icdDiagName ?? "",
          communicableDisease: false,
          infectiousDisease: false,
        }))
        : [{
          id: null,
          icdDiagId: "",
          icdDiagnosis: "",
          communicableDisease: false,
          infectiousDisease: false,
        }]
    );

    /* -------------------- INVESTIGATIONS -------------------- */
    const investigationList =
      patient.dgOrderHdList?.length
        ? patient.dgOrderHdList.flatMap(hd =>
          hd.dgOrderDts.map(dt => ({
            id: dt.dgOrderDtId || "",
            name: dt.investigationName || "",
            date: dt.appointmentDate || getToday(),
            investigationId: dt.investigationId,
          }))
        )
        : [{ id: "", name: "", date: getToday() }];

    setInvestigationItems(investigationList);

    /* -------------------- TREATMENT -------------------- */
    setTreatmentItems(
      patient.patientPrescriptionDts?.length
        ? patient.patientPrescriptionDts.map(item => {
          const freq = getFreqDetails(item.frequencyId);

          const obj = {
            treatmentId: item.prescriptionDtId,
            drugId: item.itemId,
            drugName: item.itemName,
            dispUnit: item.dispUnit ?? "",
            dosage: Number(item.dosage) || "",
            frequency: freq?.frequencyName ?? item.frequencyId ?? "",
            days: Number(item.days) || "",
            instruction: item.instraction ?? "",
            stock: item.stocks ?? "",
            itemClassId: item.itemClassId ?? null,
            aDispQty: item.adispQty ?? 1,
          };

          obj.total = calculateTotal(obj);
          return obj;
        })
        : [{
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
        }]
    );

    /*-------------------- final remark --------------- */
    setDoctorRemarksText(patient.doctorRemarks || "")

    /* -------------------- FOLLOW UP -------------------- */
    setFollowUps({
      followUpFlag: patient.followUpFlag === "y",
      FolloUpDate: patient.followUpDate
        ? patient.followUpDate.split("T")[0]
        : "",
      noOfFollowDays: patient.followUpDays
        ? String(patient.followUpDays)
        : "",
    });

    /* -------------------- REFERRAL -------------------- */
    setReferralData(prev => ({
      ...prev,
      isReferred: patient.referralFlag === "y" ? "Yes" : "No",
      referralDate: patient.referralDate
        ? patient.referralDate.split("T")[0]
        : "",
    }));
    setReferralNotes(patient.referralRemarks);

    /* -------------------- ADMISSION ADVICE -------------------- */
    const admissionAdvised = patient.admissionFlag === "y";
    setAdmissionAdvised(admissionAdvised);

    if (admissionAdvised) {
      setAdmissionDate(
        patient.admissionAdvisedDate
          ? patient.admissionAdvisedDate.split("T")[0]
          : ""
      );
      setAdditionalAdvice(patient.admissionRemarks || "");
      setAdmissionPriority(patient.admissionPriority || "Normal");

      setWardCategory(patient.admissionWardCategory || "");
      setAdmissionCareLevel(patient.admissionCareLevel || "");
      setAdmissionCareLevelName(patient.admissionCareLevelName || "");

      if (patient.admissionWardCategory) {
        await fetchWardData(patient.admissionWardCategory);
      }

      setWardName(patient.admissionWard || "");
      setOccupiedBeds(String(patient.occupiedBed ?? "0"));
      setVacantBeds(String(patient.vacantBed ?? "0"));
    }

    /* -------------------- SHOW DETAIL VIEW -------------------- */
    setShowDetailView(true);
  };

  const handleAdmissionAdvisedChange = (e) => {
    const checked = e.target.checked;
    setAdmissionAdvised(checked);

    if (!checked) {
      setAdmissionDate("");
      setAdditionalAdvice("");
      setWardCategory("");
      setAdmissionCareLevelName("");
      setWardName("");
      setWardDepartments([]);
      setAdmissionPriority("");
      setOccupiedBeds("");
      setVacantBeds("");
    }
  };


  const handleFollowUpChange = (e) => {
    const checked = e.target.checked;

    setFollowUps({
      followUpFlag: checked,
      noOfFollowDays: checked ? followUps.noOfFollowDays : "",
      followUpDate: checked ? followUps.followUpDate : "",
    });
  };



  const handleBackToList = () => {
    setShowDetailView(false)
    setSelectedPatient(null)
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
      pastHistory: "",
      familyHistory: "",
      mlcCase: false,
    });
    setDiagnosisItems([
      {
        id: null,
        icdDiagId: "",
        icdDiagnosis: "",
        communicableDisease: false,
        infectiousDisease: false,
      }
    ]);
    setWorkingDiagnosis("")
    setInvestigationItems([{ id: "", name: "", date: getToday() }]);
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
        stock: "",
      }
    ]);
    setGeneralTreatmentAdvice("")
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
    })
    setProcedureCareItems([
      {
        id: null,
        procedureId: null,
        procedureName: "",
        frequencyId: null,
        noOfDays: "",
        remarks: ""
      }
    ]);
    setReferralNotes("");
    setReferralData({
      isReferred: "No",
      referTo: "",
      referralType: "Internal",
      referralScope: "Internal",
      referralDate: getToday(),
      empanel: false,
      currentPriorityNo: "",
      select: "",
      noOfDays: "",
      treatmentType: "OPD",
      referredFor: "",
      hospital: "",
    });
    setDeletedProcedureCareIds([]);

    setSelectedHistoryType("")
    setRemovedInvestigationIds([])
    setSelectedTemplateIds(new Set())
    setSelectedTreatmentTemplateIds(new Set())
    setDoctorRemarksText("")
    setAdmissionAdvised(false)
    setAdmissionDate("")
    setAdmissionRemarks("")
    setWardCategory("")
    setAdmissionCareLevel("")
    setWardName("")
    setAdmissionPriority("Normal")
    setOccupiedBeds(0)
    setVacantBeds(0)
  }



  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleHistoryTypeClick = (historyType) => {
    setSelectedHistoryType(historyType)
  }

  function calculateBMI(weight, height) {
    if (!weight || !height) return "";

    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);

    return bmi.toFixed(2);
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if ((name === "weight" || name === "height") &&
        updated.height !== "" &&
        updated.weight !== "") {
        updated.bmi = calculateBMI(updated.weight, updated.height);
      }

      return updated;
    });
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const handleResetForm = () => {
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
    })
    setErrors({})
  }

  const handleCreateTemplate = () => {
    setShowCreateTemplateModal(true)
    setTemplateName("")
    setInvestigationItems([{ name: "", date: getToday() }])
  }

  const handleUpdateTemplate = () => {
    setShowUpdateTemplateModal(true)
    setUpdateTemplateSelection("Select..")
  }

  const handleAddInvestigationItem = () => {
    setInvestigationItems((prev) => [...prev, { id: null, templateIds: [], name: "", date: getToday() }])
  }

  const handleRemoveInvestigationItem = (index) => {
    const itemToRemove = investigationItems[index];
    const onlyOneRow = investigationItems.length === 1;
    const isEmptyRow =
      !itemToRemove.name &&
      (!itemToRemove.templateIds || itemToRemove.templateIds.length === 0) &&
      !itemToRemove.date;

    if (onlyOneRow && isEmptyRow) {
      // Only one row left and empty -> do nothing
      return;
    }

    if (itemToRemove.id !== null) {
      setRemovedInvestigationIds(prev => [...prev, itemToRemove.id]);
    }

    let updatedItems = investigationItems.filter((_, i) => i !== index);

    if (onlyOneRow) {
      // Only one row existed and had data -> reset to empty row
      updatedItems = [{ id: null, templateIds: [], name: "", date: getToday() }];
    }

    setInvestigationItems(updatedItems);
  };


  const handleInvestigationItemChange = (index, field, value) => {
    const newItems = [...investigationItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setInvestigationItems(newItems)
  }

  const handleSaveTemplate = () => {
    if (templateName.trim()) {
      setTemplates([...templates, templateName])
      setShowCreateTemplateModal(false)
      setTemplateName("")
      setInvestigationItems([{ name: "", date: getToday() }])
    }
  }

  const handleResetTemplate = () => {
    setTemplateName("")
    setInvestigationItems([{ name: "", date: getToday() }])
  }

  const handleCloseModal = () => {
    setShowCreateTemplateModal(false)
    setShowUpdateTemplateModal(false)
    setShowTreatmentAdviceModal(false)
    setTemplateName("")
    setInvestigationItems([{ name: "", date: getToday() }])
    setUpdateTemplateSelection("Select..")
    setTreatmentAdviceSelection("")
    setSelectedTreatmentAdviceItems([])
    setTreatmentAdviceModalType("")
  }

  const handleAddDiagnosisItem = () => {
    setDiagnosisItems([
      ...diagnosisItems,
      {
        id: null,
        icdDiagId: "",
        icdDiagnosis: "",
        communicableDisease: false,
        infectiousDisease: false,
      },
    ])
  }

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

    if (itemToRemove?.id != null) {
      setRemoveIcdIds((prev) => [...prev, itemToRemove.id]);
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
        treatmentId: null,
        drugIdId: "",
        drugName: "",
        dispUnit: "",
        dosage: "",
        frequency: "",
        days: "",
        total: "",
        instruction: "",
        stock: "",
      },
    ]);
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

    if (itemToRemove.treatmentId) {
      setRemovedTreatmentIds((prev) => [...prev, itemToRemove.treatmentId]);
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



  const getDrugDetails = (itemId) => {
    return drugCodeOptions.find(d => d.itemId === itemId);
  };

  const getFreqDetails = (feqId) => {
    return allFrequencies.find(d => d.frequencyId === feqId);
  };

  const handleTreatmentTemplateSelect = (templateId) => {
    if (!templateId || templateId === "Select..") return;
    if (selectedTreatmentTemplateIds.has(templateId)) return;

    const template = opdTemplateData.find(t => t.templateId == templateId);
    if (!template || !template.treatments) return;

    setTreatmentItems(prevList => {
      const updatedList = [...prevList];
      const existingDrugIds = updatedList.map(i => i.drugId);

      const duplicateItems = [];
      const newItemsToAdd = [];

      template.treatments.forEach(t => {
        if (existingDrugIds.includes(t.itemId)) {
          duplicateItems.push(t);
          updatedList.forEach(row => {
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

      const formattedNew = newItemsToAdd.map(t => {
        const drug = getDrugDetails(t.itemId);
        const freName = getFreqDetails(t.frequencyId);
        const newItem = {
          treatmentId: null,
          drugId: t.itemId,
          drugName: t.itemName,
          dispUnit: t.dispUnit ?? "",
          dosage: t.dosage ?? "",
          frequency: freName?.frequencyName ?? "",
          days: t.noOfDays ?? "",
          instruction: t.instruction ?? "",
          stock: t.stocks ?? "",
          templateId: String(templateId),
          itemClassId: t?.itemClassId ?? null,
          aDispQty: t?.aDispQty ?? 1,
        };
        newItem.total = calculateTotal(newItem);
        return newItem;
      });

      console.log("new  data", newItemsToAdd)

      if (isOnlyDefaultTreatmentRow(updatedList)) {
        return formattedNew;
      }

      return [...updatedList, ...formattedNew];
    });

    setSelectedTreatmentTemplateIds(prev => new Set([...prev, templateId]));
    setSelectedTreatmentTemplateId("Select..");
  };

  const calculateTotal = (item) => {
    if (!item.frequency || item.itemClassId == null) {
      return "0";
    }

    const dosage = Number(item.dosage);
    const days = Number(item.days);

    if (dosage === 0 || days === 0) {
      return "0";
    }

    if (isNaN(dosage) || isNaN(days)) {
      return "0";
    }

    const selectedFrequency = allFrequencies.find(
      f => Number(f.frequencyId) === Number(item.frequency)
    );
    const frequencyMultiplier = selectedFrequency
      ? Number(selectedFrequency.feq)
      : 1;

    let total = 0;


    if (DRUG_TYPE.SOLID.includes(Number(item.itemClassId))) {
      total = Math.ceil(dosage * frequencyMultiplier * days);
    }
    else if (DRUG_TYPE.LIQUID.includes(Number(item.itemClassId))) {
      const qtyPerUnit = Number(item.aDispQty) || 1;
      total = Math.ceil((dosage * frequencyMultiplier * days) / qtyPerUnit);
    }
    else {
      total = 1;
    }

    return String(total);
  };

  const handleTreatmentChange = (index, field, value) => {
    const updated = [...treatmentItems];
    updated[index] = { ...updated[index], [field]: value };

    const recalcFields = ["dosage", "days", "frequency", "itemClassId", "aDispQty"];
    if (recalcFields.includes(field)) {
      updated[index].total = calculateTotal(updated[index]);
    }

    setTreatmentItems(updated);
  };

  const handleOpenTreatmentAdviceModal = (type) => {
    setTreatmentAdviceModalType(type)
    setShowTreatmentAdviceModal(true)
    setSelectedTreatmentAdviceItems([])
  }

  const handleTreatmentAdviceCheckboxChange = (index) => {
    setSelectedTreatmentAdviceItems((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index)
      } else {
        return [...prev, index]
      }
    })
  }

  const handleSaveTreatmentAdvice = () => {
    const selected = selectedTreatmentAdviceItems.map((i) => treatmentAdviceTemplates[i]).join(", ")

    if (treatmentAdviceModalType === "general") {
      setGeneralTreatmentAdvice(selected)
    } else if (treatmentAdviceModalType === "procedure") {
      setProcedureTreatmentAdvice(selected)
    } else if (treatmentAdviceModalType === "physiotherapy") {
      setPhysiotherapyTreatmentAdvice(selected)
    }

    handleCloseModal()
  }

  const handleAddProcedureCareItem = () => {
    setProcedureCareItems((prev) => [
      ...prev,
      {
        id: null,
        procedureId: null,
        procedureName: "",
        frequencyId: null,
        noOfDays: "",
        remarks: ""
      }
    ]);
  };


  const calculateFollowUpDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + Number(days || 0));
    return date.toISOString().split("T")[0];
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

    // Don't delete if it's the only row and it's empty
    if (onlyOneRow && isEmptyRow) return;

    // Track deleted items if they have an ID
    if (itemToDelete.id !== null) {
      setDeletedProcedureCareIds((prev) => [...prev, itemToDelete.id]);
    }

    // Remove the selected item
    let newItems = procedureCareItems.filter((_, i) => i !== index);

    // If it was the only row, reset to a blank row
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
    setProcedureCareItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
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
    ])
  }

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
    const newItems = [...physiotherapyItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setPhysiotherapyItems(newItems)
  }

  const handleAddSurgeryItem = () => {
    setSurgeryItems([
      ...surgeryItems,
      {
        surgery: "",
        selected: false,
      },
    ])
  }

  const handleRemoveSurgeryItem = (index) => {
    if (surgeryItems.length === 1) return
    const newItems = surgeryItems.filter((_, i) => i !== index)
    setSurgeryItems(newItems)
  }

  const handleSurgerySearchChange = (value, index) => {
    setSurgerySearchInput(value)
    setIsSurgeryDropdownVisible(true)
    setSelectedSurgeryIndex(index)
  }

  const handleSurgerySelect = (surgery, index) => {
    const newItems = [...surgeryItems]
    newItems[index] = { ...newItems[index], surgery: surgery.name }
    setSurgeryItems(newItems)
    setSurgerySearchInput("")
    setIsSurgeryDropdownVisible(false)
  }

  const handleSurgeryChange = (index, field, value) => {
    const newItems = [...surgeryItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setSurgeryItems(newItems)
  }

  const filteredTotalPages = Math.ceil(recallPatientOpd.length / itemsPerPage)
  const currentItems = recallPatientOpd.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
      setCurrentPage(pageNumber)
    }
  }

  const handleInputFocus = (event, index) => {
    const rect = event.target.getBoundingClientRect()
    setDropdownPosition({
      x: rect.left,
      y: rect.top,
      height: rect.height,
    })
    setDropdownWidth(rect.width)
    setActiveInvestigationRowIndex(index)
    setDropdownVisible(true)
  }

  const renderPagination = () => {
    const pageNumbers = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(filteredTotalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    if (startPage > 1) {
      pageNumbers.push(1)
      if (startPage > 2) pageNumbers.push("...")
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }

    if (endPage < filteredTotalPages) {
      if (endPage < filteredTotalPages - 1) pageNumbers.push("...")
      pageNumbers.push(filteredTotalPages)
    }

    return pageNumbers.map((number, index) => (
      <li key={index} className={`page-item ${number === currentPage ? "active" : ""}`}>
        {typeof number === "number" ? (
          <button className="page-link" onClick={() => setCurrentPage(number)}>
            {number}
          </button>
        ) : (
          <span className="page-link disabled">{number}</span>
        )}
      </li>
    ))
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Priority-1":
        return "bg-danger text-white"
      case "Priority-2":
        return "bg-warning text-dark"
      case "Priority-3":
        return "bg-success text-white"
      default:
        return "bg-secondary text-white"
    }
  }



  if (showDetailView && selectedPatient) {
    return (
      <div className="content-wrapper">
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="card-title p-2 mb-0">PATIENT CONSULTATION - {selectedPatient.patientName}</h4>
                  <button className="btn btn-secondary" onClick={handleBackToList}>
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
                            className="form-control"
                            value={selectedPatient?.mobileNo}
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
                            value={selectedPatient?.gender}
                            name="gender"
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
                            value={selectedPatient?.relation}
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
                            value={selectedPatient?.dob}
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
                          <input type="text" id="age" value={selectedPatient?.age} name="age" className="form-control" placeholder="Enter Age" readOnly />
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
                            style={{ width: "100%", height: "150px", objectFit: "cover" }}
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
                        <div className="col-md-3">
                          <div className="d-flex flex-column gap-2">
                            {[
                              { id: "previous-visits", label: "Previous Visits" },
                              { id: "previous-vitals", label: "Previous Vitals" },
                              { id: "previous-lab", label: "Previous Lab Investigation" },
                              { id: "previous-ecg", label: "Previous ECG Investigation" },
                              { id: "audit-history", label: "Audit History" },
                            ].map((btn) => (
                              <button
                                key={btn.id}
                                className={`btn btn-sm ${selectedHistoryType === btn.id ? "btn-primary" : "btn-outline-primary"
                                  }`}
                                onClick={() => handleHistoryTypeClick(btn.id)}
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="col-md-9">
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
                              className="form-control mt-3"
                              name="patientSymptoms"
                              value={formData.patientSymptoms}
                              onChange={handleChange}
                              placeholder="Enter symptoms"
                            />
                          </div>

                          <div className="mb-3">
                            <label className="form-label fw-bold">Clinical Examination</label>
                            <textarea
                              className="form-control"
                              rows={3}
                              name="clinicalExamination"
                              value={formData.clinicalExamination}
                              onChange={handleChange}
                              placeholder="Enter details"
                            ></textarea>
                          </div>

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
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <MasFamilyModel
                  show={showModelPopup}
                  popupType={popupType}
                  onClose={handleClose}
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
                    <span style={{ fontSize: "18px" }}>{expandedSections.vitalDetail ? "−" : "+"}</span>
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
                          {errors.height && <div className="invalid-feedback d-block">{errors.height}</div>}
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
                          {errors.weight && <div className="invalid-feedback d-block">{errors.weight}</div>}
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
                          {errors.temperature && <div className="invalid-feedback d-block">{errors.temperature}</div>}
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
                          {errors.systolicBP && <div className="invalid-feedback d-block">{errors.systolicBP}</div>}
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
                          {errors.diastolicBP && <div className="invalid-feedback d-block">{errors.diastolicBP}</div>}
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
                          {errors.pulse && <div className="invalid-feedback d-block">{errors.pulse}</div>}
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
                          {errors.bmi && <div className="invalid-feedback d-block">{errors.bmi}</div>}
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
                          {errors.rr && <div className="invalid-feedback d-block">{errors.rr}</div>}
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
                          {errors.spo2 && <div className="invalid-feedback d-block">{errors.spo2}</div>}
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
                            <label className="form-check-label">Mark as MLC Case</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Diagnosis Section */}
                <div className="card mb-3" style={{ overflow: "visible" }}>
                  <div
                    className="card-header py-3   border-bottom-1 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection("diagnosis")}
                  >
                    <h6 className="mb-0 fw-bold">Diagnosis</h6>
                    <span style={{ fontSize: "18px" }}>{expandedSections.diagnosis ? "−" : "+"}</span>
                  </div>
                  {expandedSections.diagnosis && (
                    <div className="card-body" style={{ overflow: "visible" }}>
                      <div className="mb-3">
                        <label className="form-label fw-bold">Working Diagnosis</label>
                        <input
                          type="text"
                          className="form-control"
                          style={{ width: "400px" }}
                          value={workingDiagnosis}
                          onChange={(e) => setWorkingDiagnosis(e.target.value)}
                          placeholder="Enter working diagnosis"
                          maxLength={40}
                        />
                      </div>

                      <div className="table-responsive" style={{ overflow: "visible" }}>
                        <table className="table table-bordered">
                          <thead>
                            <tr>
                              <th className="col-md-6">ICD Diagnosis</th>
                              <th className="col-md-2 text-center">Communicable</th>
                              <th className="col-md-2 text-center">Infectious</th>
                              <th className="col-md-1 text-center">Add</th>
                              <th className="col-md-1 text-center">Delete</th>
                            </tr>
                          </thead>
                          <tbody>
                            {diagnosisItems.map((item, index) => (
                              <tr key={index}>
                                <td>
                                  <div className="position-relative" style={{ width: "100%", zIndex: 20 }} ref={dropdownRef}>
                                    <input
                                      type="text"
                                      className="form-control"
                                      placeholder="Search ICD..."
                                      value={diagnosisItems[index].icdDiagnosis || search[index] || ""}
                                      onChange={(e) => handleIcdSearch(e.target.value, index)}
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

                                    {openDropdown === index && (
                                      <div
                                        className="border rounded mt-1 bg-white position-absolute w-100"
                                        style={{ maxHeight: "220px", zIndex: 9999, overflowY: "auto" }}
                                        onScroll={(e) => {
                                          if (e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight) {
                                            loadMore();
                                          }
                                        }}
                                      >
                                        {icdDropdown.length > 0 ? (
                                          icdDropdown.map((icd) => (
                                            <div
                                              key={icd.icdId}
                                              className="p-2 cursor-pointer hover: "
                                              onMouseDown={(e) => {
                                                e.preventDefault();
                                                updateICD(icd, index);
                                                setOpenDropdown(null);
                                              }}
                                            >
                                              {icd.icdCode} - {icd.icdName}
                                            </div>

                                          ))
                                        ) : (
                                          <div className="p-2 text-muted">No results found</div>
                                        )}
                                        {!lastPage && (
                                          <div className="text-center p-2 text-primary small">Loading...</div>
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
                                      handleDiagnosisChange(index, "communicableDisease", e.target.checked)
                                    }
                                  />
                                </td>
                                <td className="text-center">
                                  <input
                                    type="checkbox"
                                    className="form-check-input border-black"
                                    checked={item.infectiousDisease}
                                    onChange={(e) =>
                                      handleDiagnosisChange(index, "infectiousDisease", e.target.checked)
                                    }
                                  />
                                </td>
                                <td className="text-center">
                                  <button className="btn btn-sm btn-success" onClick={handleAddDiagnosisItem}>
                                    +
                                  </button>
                                </td>
                                <td className="text-center">
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleRemoveDiagnosisItem(index)}
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

                {/* Investigation Section */}
                <div className="card mb-3" style={{ overflow: "visible" }}>
                  <div
                    className="card-header py-3   border-bottom-1 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection("investigation")}
                  >
                    <h6 className="mb-0 fw-bold">Investigation</h6>
                    <span style={{ fontSize: "18px" }}>{expandedSections.investigation ? "−" : "+"}</span>
                  </div>
                  {expandedSections.investigation && (
                    <div className="card-body" style={{ overflow: "visible" }}>
                      {selectedTemplateIds.size > 0 && (
                        <div className="row mb-3">
                          <div className="col-12">
                            <div className="card">
                              <div className="card-header py-2  ">
                                <div className="d-flex justify-content-between align-items-center">
                                  <h6 className="mb-0 fw-bold">Selected Templates</h6>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={handleClearAllTemplates}
                                  >
                                    Clear All Templates
                                  </button>
                                </div>
                              </div>
                              <div className="card-body">
                                <div className="d-flex flex-wrap gap-2">
                                  {Array.from(selectedTemplateIds).map(templateId => {
                                    const template = investigationTemplates.find(t => t.templateId == templateId)
                                    return template ? (
                                      <span key={templateId} className="badge bg-primary d-flex align-items-center gap-1">
                                        {template.opdTemplateName}
                                        <button
                                          type="button"
                                          className="btn-close btn-close-white"
                                          style={{ fontSize: '0.7rem' }}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleRemoveTemplateItems(templateId)
                                          }}
                                          aria-label="Remove template"
                                        ></button>
                                      </span>
                                    ) : null
                                  })}
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
                              const selectedId = e.target.value
                              if (selectedId === "Select..") return

                              const template = investigationTemplates.find(t => t.templateId == selectedId)
                              if (template) {
                                handleInvestigationTemplateSelect(template)
                              } else {
                                setSelectedInvestigationTemplate("Select..")
                              }
                            }}
                            disabled={investigationTemplateLoading}
                          >
                            <option value="Select..">Select..</option>
                            {investigationTemplates.map((template) => (
                              <option
                                key={template.templateId}
                                value={template.templateId}
                                disabled={selectedTemplateIds.has(template.templateId)}
                              >
                                {template.opdTemplateName} ({template.opdTemplateCode})
                                {selectedTemplateIds.has(template.templateId) ? ' (Already Selected)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-6">
                          <button
                            className="btn btn-primary me-2"
                            onClick={() => handleOpenInvestigationModal("create")}
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
                                        setLabFlag("y");
                                        setRadioFlag("n");
                                      } else if (type.name === "Radiology") {
                                        setRadioFlag("y");
                                        setLabFlag("n");
                                      } else {
                                        setLabFlag("n");
                                        setRadioFlag("n");
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



                      <div className="table-responsive" style={{ overflow: "visible" }}>
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
                                  <div className="position-relative w-100" ref={dropdownInvestigationRef}>

                                    {/* INPUT */}
                                    <input
                                      type="text"
                                      className="form-control"
                                      placeholder="Search Investigation..."
                                      value={investigationItems[index].name || investigationSearch[index] || ""}
                                      onChange={(e) => handleInvestigationSearch(e.target.value, index)}
                                      onClick={() => {
                                        loadFirstInvestigationPage(index);
                                        setOpenInvestigationDropdown(index);
                                      }}
                                      onBlur={() => {
                                        setTimeout(() => setOpenInvestigationDropdown(null), 200);
                                      }}
                                    />

                                    {/* DROPDOWN */}
                                    {openInvestigationDropdown === index && (
                                      <div
                                        className="border rounded mt-1 bg-white position-absolute w-100"
                                        style={{ maxHeight: "220px", zIndex: 9999, overflowY: "auto" }}
                                        onScroll={(e) => {
                                          if (
                                            e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight
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
                                              <strong>{inv.investigationName}</strong>
                                              <div className="text-muted small">
                                                {inv.mainChargeCodeName} • {inv.subChargeCodeName}
                                              </div>
                                            </div>
                                          ))
                                        ) : (
                                          <div className="p-2 text-muted">No results found</div>
                                        )}

                                        {!investigationLastPage && (
                                          <div className="text-center p-2 text-primary small">Loading...</div>
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
                                    onChange={(e) => handleInvestigationItemChange(index, "date", e.target.value)}
                                  />
                                </td>
                                <td className="text-center">
                                  <button className="btn btn-sm btn-success" onClick={handleAddInvestigationItem}>
                                    +
                                  </button>
                                </td>
                                <td className="text-center">
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleRemoveInvestigationItem(index)}
                                    disabled={
                                      investigationItems.length === 1 &&
                                      !investigationItems[0].name &&
                                      (!investigationItems[0].templateIds || investigationItems[0].templateIds.length === 0)
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
                <div className="card mb-3">
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
                    <div className="card-body">
                      {selectedTreatmentTemplateIds.size > 0 && (
                        <div className="row mb-3">
                          <div className="col-12">
                            <div className="card">
                              <div className="card-header py-2  ">
                                <div className="d-flex justify-content-between align-items-center">
                                  <h6 className="mb-0 fw-bold">Selected Templates</h6>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={handleClearAllTreatmentTemplates}
                                  >
                                    Clear All Templates
                                  </button>
                                </div>
                              </div>
                              <div className="card-body">
                                <div className="d-flex flex-wrap gap-2">
                                  {Array.from(selectedTreatmentTemplateIds).map((templateId) => {
                                    const template = opdTemplateData.find(t => t.templateId == templateId)
                                    return template ? (
                                      <span key={templateId} className="badge bg-primary d-flex align-items-center gap-1">
                                        {template.opdTemplateName}
                                        <button
                                          type="button"
                                          className="btn-close btn-close-white"
                                          style={{ fontSize: "0.7rem" }}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleRemoveTreatmentTemplateItems(templateId)
                                          }}
                                          aria-label="Remove template"
                                        ></button>
                                      </span>
                                    ) : null
                                  })}
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
                            value={selectedTreatmentTemplateId}
                            onChange={(e) => handleTreatmentTemplateSelect(e.target.value)}
                          >
                            <option value="Select..">Select..</option>
                            {opdTemplateData.map((item) => (
                              <option
                                key={item.templateId}
                                value={item.templateId}
                                disabled={selectedTreatmentTemplateIds.has(item.templateId)}
                              >
                                {item.opdTemplateName}
                                {selectedTreatmentTemplateIds.has(item.templateId) ? " (Already Added)" : ""}
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

                      <div className="table-responsive" ref={tableContainerRef}>
                        <table className="table table-bordered">
                          <thead style={{ backgroundColor: "#b0c4de" }}>
                            <tr>
                              <th style={{ width: "350px" }}>Drug Name</th>
                              <th style={{ width: "90px" }} className="text-center">Disp. Unit</th>
                              <th style={{ width: "70px" }} className="text-center">Dosage</th>
                              <th style={{ width: "120px" }} className="text-center">Frequency</th>
                              <th style={{ width: "70px" }} className="text-center">Days</th>
                              <th style={{ width: "70px" }} className="text-center">Total</th>
                              <th style={{ width: "130px" }} className="text-center">Instruction</th>
                              <th style={{ width: "100px" }} className="text-center">Stock</th>
                              <th style={{ width: "60px" }} className="text-center">Add</th>
                              <th style={{ width: "60px" }} className="text-center">Delete</th>
                            </tr>
                          </thead>
                          <tbody>
                            {treatmentItems.map((row, index) => (
                              <tr key={index}>
                                <td style={{ position: "relative" }}>
                                  <input
                                    id={`drug-name-${index}`}
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={row.drugName}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      handleTreatmentChange(index, "drugName", value);
                                      if (value.length > 0) {
                                        setActiveDrugNameDropdown(index);
                                      } else {
                                        setActiveDrugNameDropdown(null);
                                      }
                                    }}
                                    placeholder="Drug Name"
                                    style={{ width: "100%" }}
                                    autoComplete="off"
                                    onFocus={() => setActiveDrugNameDropdown(index)}
                                    onBlur={() => {
                                      setTimeout(() => {
                                        if (!drugNameDropdownClickedRef.current) {
                                          setActiveDrugNameDropdown(null);
                                        }
                                        drugNameDropdownClickedRef.current = false;
                                      }, 150);
                                    }}
                                  />
                                  {activeDrugNameDropdown === index && (
                                    <ul
                                      className="list-group"
                                      style={{
                                        position: "absolute",
                                        top: "100%",
                                        left: 0,
                                        width: "100%",
                                        maxHeight: "130px",
                                        overflowY: "auto",
                                        backgroundColor: "white",
                                        border: "1px solid #dee2e6",
                                        borderRadius: "0.375rem",
                                        zIndex: 9999,
                                        boxShadow: "0 0.5rem 1rem rgba(0,0,0,0.15)",
                                      }}
                                    >
                                      {drugCodeOptions
                                        .filter((opt) =>
                                          opt.nomenclature.toLowerCase().includes(row.drugName.toLowerCase())
                                        )
                                        .map((opt) => (
                                          <li
                                            key={opt.itemId}
                                            className="list-group-item list-group-item-action"
                                            style={{ cursor: "pointer" }}
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              drugNameDropdownClickedRef.current = true;
                                            }}
                                            onClick={() => {
                                              const isDuplicate = treatmentItems.some(
                                                (item, i) => item.drugId === opt.itemId && i !== index
                                              );
                                              if (isDuplicate) {
                                                setDuplicateItems([opt]);
                                                setShowDuplicatePopup(true);
                                                return;
                                              }
                                              const updatedRows = treatmentItems.map((r, i) => {
                                                if (i === index) {
                                                  const updatedItem = {
                                                    ...r,
                                                    drugName: opt.nomenclature,
                                                    dispUnit: opt.dispUnitName,
                                                    drugId: opt.itemId,
                                                    itemClassId: opt.itemClassId,
                                                    aDispQty: opt.aDispQty ?? 1,
                                                  };
                                                  updatedItem.total = calculateTotal(updatedItem);
                                                  return updatedItem;
                                                }
                                                return r;
                                              });
                                              setTreatmentItems(updatedRows);
                                              setActiveDrugNameDropdown(null);
                                              drugNameDropdownClickedRef.current = false;
                                            }}
                                          >
                                            <strong>{opt.nomenclature}</strong> — {opt.pvmsNo}
                                          </li>
                                        ))}
                                      {drugCodeOptions.filter((opt) =>
                                        opt.nomenclature.toLowerCase().includes(row.drugName.toLowerCase())
                                      ).length === 0 &&
                                        row.drugName !== "" && (
                                          <li className="list-group-item text-muted">No matches found</li>
                                        )}
                                    </ul>
                                  )}
                                </td>
                                <td style={{ width: "90px" }}>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={row.dispUnit}
                                    onChange={(e) =>
                                      handleTreatmentChange(index, "dispUnit", e.target.value)
                                    }
                                    readOnly
                                  />
                                </td>
                                <td style={{ width: "70px" }}>
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={row.dosage}
                                    onChange={(e) =>
                                      handleTreatmentChange(index, "dosage", e.target.value)
                                    }
                                    min={0}
                                  />
                                </td>
                                <td style={{ width: "120px" }}>
                                  <select
                                    className="form-select"
                                    value={row.frequency || ""}
                                    onChange={(e) =>
                                      handleTreatmentChange(index, "frequency", e.target.value)
                                    }
                                  >
                                    <option value="">Select..</option>
                                    {allFrequencies.map((f) => (
                                      <option key={f.frequencyId} value={f.frequencyName}>
                                        {f.frequencyName}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td style={{ width: "70px" }}>
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={row.days}
                                    onChange={(e) =>
                                      handleTreatmentChange(index, "days", e.target.value)
                                    }
                                    min={0}
                                  />
                                </td>
                                <td style={{ width: "70px" }}>
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={row.total}
                                    onChange={(e) =>
                                      handleTreatmentChange(index, "total", e.target.value)
                                    }
                                    readOnly
                                  />
                                </td>
                                <td style={{ width: "140px" }}>
                                  <select
                                    className="form-select"
                                    value={row.instruction}
                                    onChange={(e) =>
                                      handleTreatmentChange(index, "instruction", e.target.value)
                                    }
                                  >
                                    <option value="">Select...</option>
                                    <option value="After Meal">After Meal</option>
                                    <option value="Before Meal">Before Meal</option>
                                    <option value="With Food">With Food</option>
                                  </select>
                                </td>
                                <td style={{ width: "100px" }}>
                                  <input type="number" className="form-control" value={row.stock || 0} readOnly />
                                </td>
                                <td style={{ width: "60px" }} className="text-center">
                                  <button className="btn btn-sm btn-success" onClick={handleAddTreatmentItem}>
                                    +
                                  </button>
                                </td>
                                <td style={{ width: "60px" }} className="text-center">
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleRemoveTreatmentItem(index)}
                                    disabled={treatmentItems.length === 1 &&
                                      !treatmentItems[0].drugName &&
                                      !treatmentItems[0].dispUnit &&
                                      !treatmentItems[0].dosage &&
                                      !treatmentItems[0].frequency &&
                                      !treatmentItems[0].days &&
                                      !treatmentItems[0].total &&
                                      !treatmentItems[0].instruction &&
                                      treatmentItems[0].stock === "0" &&
                                      !treatmentItems[0].treatmentId}
                                  >
                                    −
                                  </button>


                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

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
                              onChange={(e) => setGeneralTreatmentAdvice(e.target.value)}
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
                    <span style={{ fontSize: "18px" }}>{expandedSections.procedureCare ? "−" : "+"}</span>
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
                            <label className="form-check-label" htmlFor="procedure">
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
                              onChange={() => setProcedureCareType("physiotherapy")}
                            />
                            <label className="form-check-label" htmlFor="physiotherapy">
                              Physiotherapy
                            </label>
                          </div>
                        </div>
                      </div>

                      {procedureCareType === "procedure" ? (
                        <div className="table-responsive" style={{ overflow: "visible" }}>
                          <table className="table table-bordered">
                            <thead style={{ backgroundColor: "#b0c4de" }}>
                              <tr>
                                <th style={{ width: "40%" }}>Nursing Care Name</th>
                                <th className="text-center" style={{ width: "20%" }}>
                                  Frequency
                                </th>
                                <th className="text-center" style={{ width: "15%" }}>
                                  No.Of Days
                                </th>
                                <th style={{ width: "15%" }}>Remarks</th>
                                <th className="text-center" style={{ width: "5%" }}>
                                  Add
                                </th>
                                <th className="text-center" style={{ width: "5%" }}>
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
                                      ref={(el) => (procedureDropdownRef.current[index] = el)}
                                      style={{ position: "relative", width: "100%" }}
                                    >

                                      <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search Procedure..."
                                        value={row.procedureName || procedureSearch[index] || ""}
                                        onChange={async (e) => {
                                          const val = e.target.value;
                                          setProcedureSearch((prev) => {
                                            const updated = [...prev];
                                            updated[index] = val;
                                            return updated;
                                          });

                                          const result = await fetchMasProcedureData(0, val);
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
                                            const selected = procedureCareItems[index];
                                            const text = procedureSearch[index];

                                            if ((!selected.id || selected.name !== text) && text !== "") {
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
                                            left: 0
                                          }}
                                          onScroll={(e) => {
                                            if (e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight) {
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
                                                  setOpenProcedureDropdown(null);
                                                }}
                                              >
                                                {proc.procedureCode} - {proc.procedureName}
                                              </div>
                                            ))
                                          ) : (
                                            <div className="p-2 text-muted">No results found</div>
                                          )}

                                          {!procedureLastPage && (
                                            <div className="text-center p-2 text-primary small">Loading...</div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </td>

                                  <td>
                                    <select
                                      className="form-select"
                                      value={row.frequencyId || ""}
                                      onChange={(e) =>
                                        handleProcedureCareChange(index, "frequencyId", e.target.value)
                                      }
                                    >
                                      <option value="">Select..</option>
                                      {allFrequencies.map((f) => (
                                        <option key={f.frequencyId} value={f.frequencyId}>
                                          {f.frequencyName}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      className="form-control"
                                      value={row.noOfDays}
                                      onChange={(e) =>
                                        handleProcedureCareChange(index, "noOfDays", e.target.value)
                                      }
                                      placeholder="num"
                                      min={0}
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={row.remarks}
                                      onChange={(e) =>
                                        handleProcedureCareChange(index, "remarks", e.target.value)
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
                                      onClick={() => handleRemoveProcedureCareItem(index)}
                                      disabled={
                                        procedureCareItems.length === 1 &&
                                        !procedureCareItems[0].procedureId &&
                                        !procedureCareItems[0].procedureName &&
                                        !procedureCareItems[0].frequencyId &&
                                        (procedureCareItems[0].noOfDays === "" || procedureCareItems[0].noOfDays === 0) &&
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
                                <th style={{ width: "40%" }}>Nursing Care Name</th>
                                <th className="text-center" style={{ width: "20%" }}>
                                  Frequency
                                </th>
                                <th className="text-center" style={{ width: "15%" }}>
                                  No.Of Days
                                </th>
                                <th style={{ width: "15%" }}>Remarks</th>
                                <th className="text-center" style={{ width: "5%" }}>
                                  Add
                                </th>
                                <th className="text-center" style={{ width: "5%" }}>
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
                                      onChange={(e) => handlePhysiotherapyChange(index, "name", e.target.value)}
                                      placeholder="Enter nursing care name"
                                    />
                                  </td>
                                  <td>
                                    <select
                                      className="form-select"
                                      value={row.frequency || ""}
                                      onChange={(e) =>
                                        handlePhysiotherapyChange(index, "frequency", e.target.value)
                                      }
                                    >
                                      <option value="">Select..</option>
                                      {allFrequencies.map((f) => (
                                        <option key={f.frequencyId} value={f.frequencyId}>
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
                                      onChange={(e) => handlePhysiotherapyChange(index, "days", e.target.value)}
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
                                        handlePhysiotherapyChange(index, "remarks", e.target.value)
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
                                      onClick={() => handleRemovePhysiotherapyItem(index)}
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
                    <span style={{ fontSize: "18px" }}>{expandedSections.surgeryAdvice ? "−" : "+"}</span>
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
                                  e.stopPropagation()
                                  setShowOtCalendarModal(true)
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
                                      handleSurgerySearchChange(e.target.value, index)
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
                                            surgery.name.toLowerCase().includes(surgerySearchInput.toLowerCase()),
                                          )
                                          .map((surgery) => (
                                            <li
                                              key={surgery.id}
                                              className="list-group-item list-group-item-action"
                                              onClick={() => handleSurgerySelect(surgery, index)}
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
                                    onChange={(e) => handleSurgeryChange(index, "selected", e.target.checked)}
                                  />
                                </td>
                                <td className="text-center">
                                  <button className="btn btn-sm btn-success" onClick={handleAddSurgeryItem}>
                                    +
                                  </button>
                                </td>
                                <td className="text-center">
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleRemoveSurgeryItem(index)}
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

                                <label className="form-check-label fw-bold" htmlFor="admissionAdvised">
                                  Admission Advised
                                </label>
                              </div>
                            </div>

                          </div>

                          {admissionAdvised && (
                            <div className="border-top pt-3 mt-3">
                              <div className="row g-3">
                                <div className="col-md-3">
                                  <label className="form-label fw-bold">Admission Date</label>
                                  <input
                                    type="date"
                                    className="form-control"
                                    value={admissionDate}
                                    onChange={(e) => setAdmissionDate(e.target.value)}
                                  />
                                </div>
                                <div className="col-md-9">
                                  <label className="form-label fw-bold">Admission Notes <span className="text-danger">*</span></label>
                                  <textarea
                                    className="form-control"
                                    rows={3}
                                    value={additionalAdvice}
                                    onChange={(e) => setAdditionalAdvice(e.target.value)}
                                    placeholder="Enter admission advice"
                                  ></textarea>
                                </div>
                              </div>

                              <div className="row g-3 mt-3">
                                <div className="col-md-3">
                                  <label className="form-label fw-bold">Ward Category</label>
                                  <select
                                    className="form-select"
                                    value={wardCategory}
                                    onChange={(e) => handleWardCategoryChange(Number(e.target.value))}
                                  >
                                    <option value="">Select Ward Category</option>
                                    {wardCategories.map((category) => (
                                      <option key={category.categoryId} value={category.categoryId}>
                                        {category.categoryName}
                                      </option>
                                    ))}
                                  </select>

                                </div>
                                <div className="col-md-3">
                                  <label className="form-label fw-bold">Care Level</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={admissionCareLevelName}
                                    readOnly
                                  />

                                </div>
                                <div className="col-md-3">
                                  <label className="form-label fw-bold">Ward Name/Dept Name <span className="text-danger">*</span></label>
                                  <select
                                    className="form-select"
                                    value={wardName}
                                    onChange={(e) => handleWardNameChange(Number(e.target.value))}
                                    disabled={!wardCategory}
                                  >
                                    <option value="">Select Ward/Dept</option>
                                    {wardDepartments.map((dept) => (
                                      <option key={dept.id} value={dept.id}>
                                        {dept.departmentName}
                                      </option>
                                    ))}
                                  </select>

                                </div>
                                <div className="col-md-3">
                                  <label className="form-label fw-bold">Admission Priority (Optional)</label>
                                  <select
                                    className="form-select"
                                    value={admissionPriority}
                                    onChange={(e) => setAdmissionPriority(e.target.value)}
                                  >
                                    {admissionPriorities.map((priority) => (
                                      <option key={priority} value={priority}>
                                        {priority}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {wardName && (
                                <div className="row g-3 mt-3">
                                  <div className="col-md-3">
                                    <label className="form-label fw-bold">Occupied Bed</label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={occupiedBeds}
                                      readOnly
                                    />
                                  </div>

                                  <div className="col-md-3">
                                    <label className="form-label fw-bold">Vacant Bed</label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={vacantBeds}
                                      readOnly
                                    />
                                  </div>
                                </div>
                              )}

                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Referral Section */}
                <div className="card mb-3">
                  <div
                    className="card-header py-3   border-bottom-1 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection("referral")}
                  >
                    <h6 className="mb-0 fw-bold">Referral</h6>
                    <span style={{ fontSize: "18px" }}>{expandedSections.referral ? "−" : "+"}</span>
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
                                onChange={(e) => handleReferralChange("isReferred", e.target.value)}
                              />
                            </div>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="isReferred"
                                id="referralYes"
                                value="Yes"
                                checked={referralData.isReferred === "Yes"}
                                onChange={(e) => handleReferralChange("isReferred", e.target.value)}
                              />
                              <label className="form-check-label" htmlFor="referralYes">
                                Yes
                              </label>
                            </div>
                          </div>
                        </div>

                        {referralData.isReferred === "Yes" && (
                          <>
                            <div className="col-md-2">
                              <label className="form-label fw-bold">Refer To</label>
                              <select
                                className="form-select"
                                value={referralData.referTo}
                                onChange={(e) => handleReferralChange("referTo", e.target.value)}
                              >
                                <option value="">Select...</option>
                                <option value="Internal">Internal</option>
                                <option value="Empanel">Empanel</option>
                                <option value="Both">Both</option>
                              </select>
                            </div>

                            <div className="col-md-2">
                              <label className="form-label fw-bold">Refer Date:</label>
                              <input
                                type="date"
                                className="form-control"
                                value={referralData.referralDate}
                                onChange={(e) => handleReferralChange("referralDate", e.target.value)}
                              />
                            </div>
                          </>
                        )}
                      </div>

                      {referralData.isReferred === "Yes" && (
                        <>
                          {referralData.referTo === "Internal" && (
                            <>
                              <div className="row mb-3">
                                <div className="col-md-2">
                                  <label className="form-label fw-bold">Current Priority No.</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={referralData.currentPriorityNo}
                                    onChange={(e) => handleReferralChange("currentPriorityNo", e.target.value)}
                                    placeholder="Enter priority no"
                                  />
                                </div>
                              </div>

                              <hr className="my-4" />

                              <div className="row mb-3">
                                <div className="col-12">
                                  <h6 className="fw-bold mb-3">Department</h6>
                                  <div className="table-responsive">
                                    <table className="table table-bordered">
                                      <thead style={{ backgroundColor: "#b0c4de" }}>
                                        <tr>
                                          <th style={{ width: "10%" }}>Select</th>
                                          <th style={{ width: "70%" }}>Doctor</th>
                                          <th style={{ width: "10%" }}>Add</th>
                                          <th style={{ width: "10%" }}>Delete</th>
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
                                                onChange={(e) => handleDepartmentChange(index, "selected", e.target.checked)}
                                              />
                                            </td>
                                            <td>
                                              <select
                                                className="form-select"
                                                value={item.doctor}
                                                onChange={(e) => handleDepartmentChange(index, "doctor", e.target.value)}
                                              >
                                                <option value="Select">Select</option>
                                                <option value="Dr. Smith">Dr. Smith</option>
                                                <option value="Dr. Johnson">Dr. Johnson</option>
                                                <option value="Dr. Williams">Dr. Williams</option>
                                                <option value="Dr. Brown">Dr. Brown</option>
                                              </select>
                                            </td>
                                            <td className="text-center">
                                              <button className="btn btn-sm btn-success" onClick={handleAddDepartment}>
                                                +
                                              </button>
                                            </td>
                                            <td className="text-center">
                                              <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleRemoveDepartment(index)}
                                                disabled={departmentData.length === 1}
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
                              </div>
                            </>
                          )}

                          {referralData.referTo === "Empanel" && (
                            <>
                              <div className="row mb-3">
                                <div className="col-md-2">
                                  <label className="form-label fw-bold">Hospital *</label>
                                  <select
                                    className="form-select"
                                    value={referralData.hospital}
                                    onChange={(e) => handleReferralChange("hospital", e.target.value)}
                                  >
                                    <option value="">Select...</option>
                                    <option value="Hospital A">Hospital A</option>
                                    <option value="Hospital B">Hospital B</option>
                                    <option value="Hospital C">Hospital C</option>
                                  </select>
                                </div>
                                <div className="col-md-2">
                                  <label className="form-label fw-bold">No. of Days</label>
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={referralData.noOfDays}
                                    onChange={(e) => handleReferralChange("noOfDays", e.target.value)}
                                    placeholder="0"
                                  />
                                </div>
                                <div className="col-md-2">
                                  <label className="form-label fw-bold">Treatment Type *</label>
                                  <select
                                    className="form-select"
                                    value={referralData.treatmentType}
                                    onChange={(e) => handleReferralChange("treatmentType", e.target.value)}
                                  >
                                    <option value="OPD">OPD</option>
                                    <option value="IPD">IPD</option>
                                  </select>
                                </div>
                                <div className="col-md-2">
                                  <label className="form-label fw-bold">Referred For*</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={referralData.referredFor}
                                    onChange={(e) => handleReferralChange("referredFor", e.target.value)}
                                    placeholder="Referred for"
                                  />
                                </div>
                              </div>
                            </>
                          )}

                          {referralData.referTo === "Both" && (
                            <>
                              <div className="row mb-3">
                                <div className="col-md-2">
                                  <label className="form-label fw-bold">Current Priority No.</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={referralData.currentPriorityNo}
                                    onChange={(e) => handleReferralChange("currentPriorityNo", e.target.value)}
                                    placeholder="Enter priority no"
                                  />
                                </div>
                                <div className="col-md-2">
                                  <label className="form-label fw-bold">Hospital *</label>
                                  <select
                                    className="form-select"
                                    value={referralData.hospital}
                                    onChange={(e) => handleReferralChange("hospital", e.target.value)}
                                  >
                                    <option value="">Select...</option>
                                    <option value="Hospital A">Hospital A</option>
                                    <option value="Hospital B">Hospital B</option>
                                    <option value="Hospital C">Hospital C</option>
                                  </select>
                                </div>
                                <div className="col-md-2">
                                  <label className="form-label fw-bold">No. of Days</label>
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={referralData.noOfDays}
                                    onChange={(e) => handleReferralChange("noOfDays", e.target.value)}
                                    placeholder="0"
                                  />
                                </div>
                                <div className="col-md-2">
                                  <label className="form-label fw-bold">Treatment Type *</label>
                                  <select
                                    className="form-select"
                                    value={referralData.treatmentType}
                                    onChange={(e) => handleReferralChange("treatmentType", e.target.value)}
                                  >
                                    <option value="OPD">OPD</option>
                                    <option value="IPD">IPD</option>
                                  </select>
                                </div>
                                <div className="col-md-2">
                                  <label className="form-label fw-bold">Referred For*</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={referralData.referredFor}
                                    onChange={(e) => handleReferralChange("referredFor", e.target.value)}
                                    placeholder="Referred for"
                                  />
                                </div>
                              </div>

                              <hr className="my-4" />

                              <div className="row mb-3">
                                <div className="col-12">
                                  <h6 className="fw-bold mb-3">Department</h6>
                                  <div className="table-responsive">
                                    <table className="table table-bordered">
                                      <thead style={{ backgroundColor: "#b0c4de" }}>
                                        <tr>
                                          <th style={{ width: "10%" }}>Select</th>
                                          <th style={{ width: "70%" }}>Doctor</th>
                                          <th style={{ width: "10%" }}>Add</th>
                                          <th style={{ width: "10%" }}>Delete</th>
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
                                                onChange={(e) => handleDepartmentChange(index, "selected", e.target.checked)}
                                              />
                                            </td>
                                            <td>
                                              <select
                                                className="form-select"
                                                value={item.doctor}
                                                onChange={(e) => handleDepartmentChange(index, "doctor", e.target.value)}
                                              >
                                                <option value="Select">Select</option>
                                                <option value="Dr. Smith">Dr. Smith</option>
                                                <option value="Dr. Johnson">Dr. Johnson</option>
                                                <option value="Dr. Williams">Dr. Williams</option>
                                                <option value="Dr. Brown">Dr. Brown</option>
                                              </select>
                                            </td>
                                            <td className="text-center">
                                              <button className="btn btn-sm btn-success" onClick={handleAddDepartment}>
                                                +
                                              </button>
                                            </td>
                                            <td className="text-center">
                                              <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleRemoveDepartment(index)}
                                                disabled={departmentData.length === 1}
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
                              </div>
                            </>
                          )}

                          <div className="row">
                            <div className="col-12">
                              <h6 className="fw-bold mb-3">Referral Notes</h6>
                              <textarea
                                className="form-control"
                                rows={4}
                                value={referralNotes}
                                onChange={(e) => setReferralNotes(e.target.value)}
                                placeholder="Enter referral notes"
                              ></textarea>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Follow Up Section */}
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
                            checked={followUps.followUpFlag}
                            onChange={handleFollowUpChange}
                          />


                          <h6 className="fw-bold mb-0">Follow Up</h6>
                        </div>

                        <div className="d-flex align-items-center gap-4">

                          {/* Number of Days */}
                          <div className="d-flex align-items-center gap-2">
                            <label className="form-label mb-0">Number of days</label>
                            <input
                              type="number"
                              min={0}
                              className="form-control"
                              value={followUps.noOfFollowDays}
                              onChange={(e) => {
                                const days = e.target.value;
                                setFollowUps({
                                  ...followUps,
                                  noOfFollowDays: days,
                                  followUpDate: calculateFollowUpDate(days),
                                });
                              }}
                              style={{ width: "120px" }}
                              disabled={!followUps.followUpFlag}
                            />

                          </div>

                          {/* Follow Up Date (Read Only) */}
                          <div className="d-flex align-items-center gap-2">
                            <label className="form-label mb-0">Follow Up date</label>
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
                  {expandedSections.remarks && (
                    <div className="card-body">
                      <div className="row align-items-end">
                        <div className="col-md-11">
                          <textarea
                            className="form-control"
                            rows={4}
                            value={doctorRemarksText}
                            onChange={(e) => setDoctorRemarksText(e.target.value)}
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
                    type="button"
                    className="btn btn-primary me-3"
                    onClick={handleUpdateRecallPatient}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <i className="mdi mdi-loading mdi-spin"></i> PROCESSING...
                      </>
                    ) : (
                      <>
                        <i className="mdi mdi-content-save"></i> SUBMIT
                      </>
                    )}
                  </button>
                  <button className="btn btn-secondary me-3" onClick={handleResetForm}>
                    <i className="mdi mdi-refresh"></i> RESET
                  </button>
                  <button className="btn btn-secondary" onClick={handleBackToList}>
                    <i className="mdi mdi-arrow-left"></i> BACK
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <InvestigationModal
          show={showInvestigationModal}
          onClose={handleCloseInvestigationModal}
          templateType={investigationModalType}
          onTemplateSaved={(template) => {
            fetchInvestigationTemplates()
          }}
        />

        <TreatmentModal
          show={showTreatmentModal}
          onClose={handleCloseTreatmentModal}
          templateType={treatmentModalType}
          onTemplateSaved={(template) => {
          }}
        />


        {/* OT Calendar Modal */}
        {showOtCalendarModal && (
          <div
            className="modal fade show"
            style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 0 }}
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
                  <button type="button" className="btn-close" onClick={() => setShowOtCalendarModal(false)}></button>
                </div>
                <div
                  className="modal-body"
                  style={{ overflowY: "auto", flex: "1 1 auto", maxHeight: "calc(90vh - 120px)" }}
                >
                  <OTDashboard />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowOtCalendarModal(false)}>
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
            style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 0 }}
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
                <div className="modal-header">
                  <h5 className="modal-title">Current Medication</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowCurrentMedicationModal(false)}
                  ></button>
                </div>
                <div
                  className="modal-body"
                  style={{ overflowY: "auto", flex: "1 1 auto", maxHeight: "calc(90vh - 120px)" }}
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
                        <tr>
                          <td>1</td>
                          <td>CHOLECALCIFEROL (VITAMIN D3) 60000 IU TABLET</td>
                          <td className="text-center">1</td>
                          <td className="text-center">30</td>
                          <td className="text-center">ONCE IN 7 DAYS</td>
                          <td className="text-center">4</td>
                          <td className="text-center">0</td>
                          <td>Dr. M.G.Prashanth</td>
                          <td>GENERAL MEDICINE</td>
                          <td className="text-center">19/12/2020</td>
                          <td className="text-center">
                            <input type="checkbox" />
                          </td>
                          <td className="text-center">
                            <input type="checkbox" />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: "15px" }}>
                    <button className="btn btn-primary me-2">STOP</button>
                    <button className="btn btn-primary me-2">REPEAT</button>
                  </div>
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
          <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
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
                                checked={selectedTreatmentAdviceItems.includes(index)}
                                onChange={() => handleTreatmentAdviceCheckboxChange(index)}
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
                  <button className="btn btn-primary" onClick={handleSaveTreatmentAdvice}>
                    OK
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowTreatmentAdviceModal(false)}>
                    CLOSE
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Main OPD Recall List view
  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">OPD Recall List</h4>
              </div>
            </div>
            {loading && <LoadingScreen />}
            <div className="card-body">
              {/* Search Filters Section */}
              <div className="card mb-3">
                <div className="card-body">
                  <div className="row g-3 align-items-end">
                    <div className="col-md-3">
                      <label className="form-label fw-bold">Mobile No.</label>
                      <input
                        type="text"
                        className="form-control"
                        value={searchFilters.mobileNumber}
                        onChange={(e) => handleMobileChange(e)}
                        placeholder="Mobile Number"
                        maxLength={10}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold">Patient Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={searchFilters.patientName}
                        onChange={(e) => handleFilterChange("patientName", e.target.value)}
                        placeholder="Patient Name"
                        maxLength={30}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold">Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={searchFilters.date}
                        onChange={(e) => handleFilterChange("date", e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold" style={{ visibility: "hidden" }}>
                        DUALWYYYY
                      </label>
                      <div className="d-flex gap-2">
                        <button type="button" className="btn btn-primary" onClick={handleSearch}>
                          Search
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={handleReset}>
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Count */}
              <div className="mb-3">
                <h6 className="text-muted">{recallPatientOpd.length} matches</h6>
              </div>

              {/* Patients Table */}
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Patient Name</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>Department</th>
                      <th>Mobile No.</th>
                      <th>Doctor</th>
                      <th>Type Of Patient</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems && currentItems.length > 0 ? (
                      currentItems.map((item) => (
                        <tr
                          key={item.visitId}
                          onClick={() => handleRowClick(item)}
                          style={{ cursor: "pointer" }}
                        >
                          <td>{item.patientName}</td>
                          <td>{item.age}</td>
                          <td>{item.gender}</td>
                          <td>{item.deptName}</td>
                          <td>{item.mobileNo}</td>
                          <td>{item.docterName}</td>
                          <td>{item?.typeOfPatient || " "}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center text-muted">
                          No records found
                        </td>
                      </tr>
                    )}
                  </tbody>

                </table>
              </div>

              {/* Pagination */}
              <nav className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  <span>
                    Page {currentPage} of {filteredTotalPages} | Total Records: {recallPatientOpd.length}
                  </span>
                </div>
                <ul className="pagination mb-0">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      « Previous
                    </button>
                  </li>
                  {renderPagination()}
                  <li className={`page-item ${currentPage === filteredTotalPages ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === filteredTotalPages}
                    >
                      Next »
                    </button>
                  </li>
                </ul>
                <div className="d-flex align-items-center">
                  <input
                    type="number"
                    min={1}
                    max={filteredTotalPages}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    placeholder="Go to page"
                    className="form-control me-2"
                    style={{ width: "120px" }}
                  />
                  <button className="btn btn-primary" onClick={handlePageNavigation}>
                    GO
                  </button>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OpdRRecallPatient