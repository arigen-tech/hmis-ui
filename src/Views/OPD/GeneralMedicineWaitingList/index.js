import { useState, useEffect, useRef } from "react"
import placeholderImage from "../../../assets/images/placeholder.jpg"
import OTDashboard from "./OTDashboard"
import InvestigationModal from "./InvestigationModal"
import TreatmentModal from "./TreatmentModal"
import { OPD_TEMPLATE, MAS_INVESTIGATION, OPD_PATIENT, MAS_DRUG_MAS, DRUG_TYPE, ITEM_CLASS, MAS_OPD_SESSION, DOCTOR, MASTERS, MAS_FREQUENCY } from "../../../config/apiConfig"
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import LoadingScreen from "../../../Components/Loading/index";
import Popup from "../../../Components/popup";
import DuplicatePopup from "../GeneralMedicineWaitingList/DuplicatePopup";

const GeneralMedicineWaitingList = () => {
  const [waitingList, setWaitingList] = useState([])
  const [loading, setLoading] = useState(false);
  const [doctorData, setDoctorData] = useState([]);
  const [sessionData, setSessionData] = useState([]);
  const [masICDData, setMasICDData] = useState([]);
  const [opdVitalsData, setOpdVitalsData] = useState([]);
  const [duplicateItems, setDuplicateItems] = useState([]);
  const [showDuplicatePopup, setShowDuplicatePopup] = useState(false);
  const [vitalsAvlaible, setVitalsAvlaible] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [selectedTreatmentTemplateIds, setSelectedTreatmentTemplateIds] = useState(new Set());
  const [opdTemplateData, setOpdTemplateData] = useState([]);
  const [selectedTreatmentTemplateId, setSelectedTreatmentTemplateId] = useState("Select..");
  const tableContainerRef = useRef(null);
  const [activeDrugNameDropdown, setActiveDrugNameDropdown] = useState(null);
  const drugNameDropdownClickedRef = useRef(false);
  const [drugCodeOptions, setDrugCodeOptions] = useState([]);
  const [allFrequencies, setAllFrequencies] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [icdDropdown, setIcdDropdown] = useState([]);
  const [page, setPage] = useState(0);
  const [lastPage, setLastPage] = useState(false);
  const [search, setSearch] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);
  // Ref to detect click outside
  const dropdownRef = useRef(null);

  // Add new state variables for Doctor's Remarks
  const [doctorRemarksTemplates, setDoctorRemarksTemplates] = useState([
    "Minimize the intake of fried and spicy food",
    "Do exercise for at least 30-45 minutes every morning",
    "Take nutritious food daily and drink 2-3 liters of water",
    "Do not consume tobacco, alcohol and narcotics",
    "Must take 7-8 hours of sleep daily"
  ])

  const [selectedDoctorRemarks, setSelectedDoctorRemarks] = useState([])
  const [showDoctorRemarksModal, setShowDoctorRemarksModal] = useState(false)
  const [doctorRemarksText, setDoctorRemarksText] = useState("")

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
      // //console.log("Frequency API Response:", response);

      if (response && response.response) {
        setAllFrequencies(response.response)
        // //console.log("Frequencies loaded:", response.response);
      } else {
        console.warn("No frequencies found in response")
        setAllFrequencies([])
      }
    } catch (error) {
      console.error("Error fetching frequencies:", error)
      setAllFrequencies([])
    }
  }

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

  // FIRST PAGE LOAD
  const loadFirstPage = async (index) => {
    const searchText = search[index] || "";
    const result = await fetchMasICDData(0, searchText);

    setIcdDropdown(result.list);
    setLastPage(result.last);
    setPage(0);
  };

  // LOAD MORE FOR INFINITE SCROLL
  const loadMore = async () => {
    if (lastPage) return;

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
        String(item.icdDiagId) === String(selectedICD.icdId) && idx !== index
    );

    if (exists) {
      setDuplicateItems([{ icdDiagnosis: selectedICD.icdName }]);
      setShowDuplicatePopup(true);
      return;
    }

    setDiagnosisItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        icdDiagId: selectedICD.icdId,
        icdDiagnosis: selectedICD.icdName,
      };
      return updated;
    });

    // clear search after selecting
    setSearch((prev) => {
      const updated = [...prev];
      updated[index] = "";
      return updated;
    });
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

  console.log("opdTemplateData", opdTemplateData)

  const fetchDoctorData = async () => {
    setLoading(true);
    try {
      const data = await getRequest(`${DOCTOR}/allDoctor/list`);
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
      const data = await getRequest(`${MAS_OPD_SESSION}/getAll/1`);
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




  useEffect(() => {
    fetchDoctorData();
    fetchSessionData();
    fetchMasICDData();
    fetchOpdTemplateData();
    fatchDrugCodeOptions();
    fetchAllFrequencies();
  }, []);

  const [searchFilters, setSearchFilters] = useState({
    doctorList: "",
    session: "",
    mobileNo: "",
    patientName: "",
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const [showDetailView, setShowDetailView] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showOtCalendarModal, setShowOtCalendarModal] = useState(false)
  const [showCurrentMedicationModal, setShowCurrentMedicationModal] = useState(false)

  // Modal states - UPDATED
  const [showInvestigationModal, setShowInvestigationModal] = useState(false)
  const [showTreatmentModal, setShowTreatmentModal] = useState(false)
  const [investigationModalType, setInvestigationModalType] = useState("create")
  const [treatmentModalType, setTreatmentModalType] = useState("create")

  const [investigationType, setInvestigationType] = useState("lab")
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
    clinicalHistory: false,
    vitalDetail: false,
    diagnosis: false,
    investigation: false,
    treatment: false,
    nip: false,
    referral: false,
    followUp: false,
    doctorRemark: false,
    surgeryAdvice: false,
    additionalAdvice: false,
    remarks: false,
  })

  const [expandedNipSubsections, setExpandedNipSubsections] = useState({
    treatmentAdvice: true,
    procedureCare: false,
    nip: false,
    surgeryAdvice: false,
    additionalAdvice: false,
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
  const getToday = () => new Date().toISOString().split("T")[0]
  const [investigationItems, setInvestigationItems] = useState([
    {
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
      stock: "0",
      templateId: "",
    }
  ]);
  console.log("treatmentItems", treatmentItems)
  const [nipItems, setNipItems] = useState([
    {
      nip: "",
      newNIP: "",
      class: "Select",
      au: "Select",
      dispUnit: "Select",
      uomQty: "",
      dosage: "",
      frequency: "Select",
      days: "",
      total: "",
      instruction: "",
      stock: "",
    },
  ])

  const [nipSearchInput, setNipSearchInput] = useState("")
  const [isNipDropdownVisible, setIsNipDropdownVisible] = useState(false)
  const [selectedNipIndex, setSelectedNipIndex] = useState(null)

  const nipOptions = [
    { id: 1, name: "NIP-001", code: "001" },
    { id: 2, name: "NIP-002", code: "002" },
    { id: 3, name: "NIP-003", code: "003" },
    { id: 4, name: "NIP-004", code: "004" },
    { id: 5, name: "NIP-005", code: "005" },
  ]

  const [treatmentAdviceSelection, setTreatmentAdviceSelection] = useState("")
  const [generalTreatmentAdvice, setGeneralTreatmentAdvice] = useState("")
  const [procedureTreatmentAdvice, setProcedureTreatmentAdvice] = useState("")
  const [physiotherapyTreatmentAdvice, setPhysiotherapyTreatmentAdvice] = useState("")
  const [selectedTreatmentAdviceItems, setSelectedTreatmentAdviceItems] = useState([])

  const [procedureCareItems, setProcedureCareItems] = useState([
    {
      name: "",
      frequency: "",
      days: "",
      remarks: "",
    },
  ])

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
  const [admissionAdvised, setAdmissionAdvised] = useState(false)
  const [admissionDate, setAdmissionDate] = useState("")
  const [selectedWard, setSelectedWard] = useState("CHILDREN WARD")
  const [admissionNotes, setAdmissionNotes] = useState("")

  // Referral state - UPDATED
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

  const wardData = {
    "CHILDREN WARD": { occupied: 0, vacant: 20 },
    "GENERAL WARD": { occupied: 5, vacant: 15 },
    "ICU WARD": { occupied: 8, vacant: 2 },
    "MATERNITY WARD": { occupied: 3, vacant: 7 },
    "SURGICAL WARD": { occupied: 10, vacant: 10 },
  }

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

  const [selectedBloodTestTemplate, setSelectedBloodTestTemplate] = useState("Select..")

  const itemsPerPage = 10

  // NEW: Track selected templates to prevent duplicates
  const [selectedTemplateIds, setSelectedTemplateIds] = useState(new Set())

  // Modal handlers - UPDATED
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

  // Doctor's Remarks handlers
  const handleOpenDoctorRemarksModal = () => {
    setShowDoctorRemarksModal(true)
  }

  const handleCloseDoctorRemarksModal = () => {
    setShowDoctorRemarksModal(false)
  }

  const handleSaveDoctorRemarks = (selectedRemarks) => {
    setSelectedDoctorRemarks(selectedRemarks)
    setDoctorRemarksText(selectedRemarks.join("\n"))
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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".form-control")) {
        setDropdownVisible(false)
      }
    }
    window.addEventListener("click", handleClickOutside)
    return () => window.removeEventListener("click", handleClickOutside)
  }, [])

  const extractInvestigationTypes = (investigations) => {
    const uniqueTypes = []
    const typeMap = new Map()

    investigations.forEach(inv => {
      const typeId = inv.mainChargeCodeId
      const typeName = inv.mainChargeCodeName

      if (typeId && typeName && !typeMap.has(typeId)) {
        typeMap.set(typeId, typeName)
        uniqueTypes.push({
          id: typeId,
          name: typeName,
          value: typeName.toLowerCase().replace(/\s+/g, '-')
        })
      }
    })

    setInvestigationTypes(uniqueTypes)
  }

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

  const fetchAllInvestigations = async () => {
    try {
      const response = await getRequest(`${MAS_INVESTIGATION}/getAll/1`)
      if (response && response.response) {
        setAllInvestigations(response.response)
        extractInvestigationTypes(response.response)
      } else {
        setAllInvestigations([])
      }
    } catch (error) {
      console.error("Error fetching investigations:", error)
      setAllInvestigations([])
    }
  }

  const filterInvestigationsByMainChargeCode = () => {
    //console.log("Filtering investigations by type:", investigationType)

    if (!investigationType || allInvestigations.length === 0) {
      setFilteredInvestigationsByType([])
      return
    }

    const selectedType = investigationTypes.find(type => type.value === investigationType)
    //console.log("Selected type for filtering:", selectedType)

    if (selectedType) {
      const filtered = allInvestigations.filter(inv => inv.mainChargeCodeId === selectedType.id)
      //console.log(`Filtered ${filtered.length} investigations for type:`, selectedType.name)
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

  // UPDATED: Handle template selection to accumulate items
  const handleInvestigationTemplateSelect = (template) => {
    const templateId = template.templateId;

    // Prevent duplicate template selection
    if (selectedTemplateIds.has(templateId)) {
      alert("This template is already selected");
      setSelectedInvestigationTemplate("Select..");
      return;
    }

    setSelectedTemplateIds(prev => new Set([...prev, templateId]));
    setSelectedInvestigationTemplate(templateId);

    if (!template.investigationResponseList) return;

    let duplicateItemsBuffer = [];

    setInvestigationItems(prev => {
      let updated = [...prev];

      // 🟢 REMOVE EMPTY DEFAULT ITEM ON FIRST USE
      if (
        updated.length === 1 &&
        !updated[0].investigationId &&
        !updated[0].name
      ) {
        updated = [];
      }

      const existingMap = new Map(updated.map(item => [item.investigationId, item]));

      template.investigationResponseList.forEach(item => {
        const existing = existingMap.get(item.investigationId);

        if (existing) {
          // duplicate
          if (!existing.templateIds.includes(templateId)) {
            existing.templateIds = [...existing.templateIds, templateId];
          }

          duplicateItemsBuffer.push({
            investigationId: item.investigationId,
            investigationName: existing.name ?? item.investigationName
          });

        } else {
          // new investigation
          updated.push({
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

    // After updating state, check duplicates
    setTimeout(() => {
      const unique = Array.from(
        new Map(duplicateItemsBuffer.map(d => [d.investigationId, d])).values()
      );

      if (unique.length > 0) {
        setDuplicateItems(unique);
        setShowDuplicatePopup(true);
      }

      setSelectedInvestigationTemplate("Select..");
    }, 50);
  };

  // NEW: Function to clear all selected templates and items
  const handleClearAllTemplates = () => {
    setSelectedTemplateIds(new Set());

    setInvestigationItems(prev =>
      prev.filter(item => (item.templateIds ?? []).length === 0)
    );
  };

  const handleRemoveTemplateItems = (templateId) => {
    setSelectedTemplateIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(templateId);
      return newSet;
    });

    setInvestigationItems(prev =>
      prev
        .map(item => {
          const originalTemplateIds = item.templateIds ?? [];

          // Manual item → keep unchanged
          if (originalTemplateIds.length === 0) {
            return item;
          }

          return {
            ...item,
            templateIds: originalTemplateIds.filter(id => id !== templateId),
          };
        })
        .filter(item => {
          const ids = item.templateIds ?? [];

          // Remove template-created items (had templateIds before) but now ids = []
          if (ids.length === 0 && item.templateSource) return false;

          return true;
        })
    );
  };


  const handleInvestigationSelect = (index, investigation) => {

    // ---- CHECK DUPLICATE IN FULL LIST ----
    const duplicate = investigationItems.find(
      (item, idx) =>
        idx !== index && item.investigationId === investigation.investigationId
    );

    if (duplicate) {
      // Show popup with duplicate item
      setDuplicateItems([
        {
          investigationId: investigation.investigationId,
          investigationName: investigation.investigationName
        }
      ]);

      setShowDuplicatePopup(true);

      // Reset the row input
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
      name: investigation.investigationName,
      investigationId: investigation.investigationId,
    };

    setInvestigationItems(newItems);
    setActiveInvestigationRowIndex(null);
  };


  // Referral handlers - UPDATED
  const handleReferralChange = (field, value) => {
    setReferralData(prev => ({
      ...prev,
      [field]: value
    }))
  }

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

  const handleRemoveTreatmentTemplateItems = (templateId) => {
    setTreatmentItems(prev =>
      prev
        .map(item => {
          if (!item.templateId) return item;

          // Convert to array
          const ids = item.templateId
            .split(",")
            .filter(id => id !== String(templateId));

          // CASE 1: treatmentId exists → KEEP row but update templateId
          if (item.treatmentId != null) {
            return {
              ...item,
              templateId: ids.join(",")
            };
          }

          // CASE 2: no treatmentId & some templateIds left → update only
          if (ids.length > 0) {
            return {
              ...item,
              templateId: ids.join(",")
            };
          }

          // CASE 3: no treatmentId & no templateIds left → REMOVE row
          return null;
        })
        .filter(item => item !== null)
    );

    // remove template from selected list
    setSelectedTreatmentTemplateIds(prev => {
      const updated = new Set(prev);
      updated.delete(templateId);
      return updated;
    });
  };


  const handleRemoveDepartment = (index) => {
    if (departmentData.length === 1) return
    const newData = departmentData.filter((_, i) => i !== index)
    setDepartmentData(newData)
  }

  // ADD THESE USEEFFECT HOOKS

  // DEBUGGING: Add this at the top of your component to see what's happening
  //console.log("Component render - investigationType:", investigationType, "investigationTypes:", investigationTypes)

  useEffect(() => {
    if (showDetailView && selectedPatient) {
      //console.log("Fetching investigation data...")
      fetchInvestigationTemplates()
      fetchAllInvestigations()
    }
  }, [showDetailView, selectedPatient])

  useEffect(() => {
    //console.log("All investigations loaded:", allInvestigations.length)
    if (allInvestigations.length > 0) {
      extractInvestigationTypes(allInvestigations)
    }
  }, [allInvestigations])

  useEffect(() => {
    //console.log("Investigation types updated:", investigationTypes)
    if (investigationTypes.length > 0) {
      // FORCE SELECT LABORATORY
      const labType = investigationTypes.find(type =>
        type.name.toLowerCase().includes('laboratory') ||
        type.name.toLowerCase().includes('lab')
      )

      if (labType && investigationType !== labType.value) {
        //console.log("Setting default to Laboratory:", labType)
        setInvestigationType(labType.value)
      } else if (investigationTypes.length > 0 && !investigationType) {
        //console.log("Setting to first type:", investigationTypes[0])
        setInvestigationType(investigationTypes[0].value)
      }
    }
  }, [investigationTypes])

  useEffect(() => {
    //console.log("Investigation type changed to:", investigationType)
    filterInvestigationsByMainChargeCode()
  }, [investigationType])

  const handleFilterChange = (field, value) => {
    setSearchFilters((prev) => ({
      ...prev,
      [field]: value,
    }))
    setCurrentPage(1)
  }

  const userId =
    localStorage.getItem("userId") ||
    sessionStorage.getItem("userId");


  useEffect(() => {
    if (userId) {
      setSearchFilters((prev) => ({
        ...prev,
        doctorList: userId,
      }));
    }
  }, [userId]);

  useEffect(() => {
    if (searchFilters.doctorList) {
      handleSearch();
    }
  }, [searchFilters.doctorList]);



  const handleSearch = async () => {
    const userId =
      localStorage.getItem("userId") ||
      sessionStorage.getItem("userId");

    if (!userId) return;

    if (!searchFilters.doctorList) {
      alert("Doctor is required");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      doctorList: userId,
    }));

    const payload = {
      doctorId: Number(searchFilters.doctorList) || Number(userId) || null,
      sessionId: Number(searchFilters.session) || null,
      mobileNo: searchFilters.mobileNo?.trim() || null,
      patientName: searchFilters.patientName?.trim() || null,
    };

    try {
      setLoading(true);

      const data = await postRequest(`${OPD_PATIENT}/activeVisit/search`, payload);

      if (data.status === 200 && Array.isArray(data.response)) {
        setWaitingList(data.response);
      } else {
        setWaitingList([]);
      }
    } catch (error) {
      console.error("Search API Error:", error);
    } finally {
      setLoading(false);
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

  const updateVisitStatus = async (visitId, visitDate, doctorId) => {
    try {
      const response = await putRequest(
        `/patient/update-status?visitId=${visitId}&visitDate=${visitDate}&doctorId=${doctorId}`
      );

      //console.log("Status Updated:", response);
      return response;

    } catch (error) {
      console.error("Error updating status:", error);
    }
  };


  const cheackVitalPresent = async (visitId) => {
    try {
      const data = await getRequest(`${OPD_PATIENT}/getOpdByVisit?visitId=${visitId}`);

      if (data?.status === 200 && data?.response) {
        setOpdVitalsData(data.response);
        setVitalsAvlaible(true);
        return;
      }

      setOpdVitalsData(null);
      setVitalsAvlaible(false);

    } catch (error) {
      console.error("Error fetching vital data:", error);

      setOpdVitalsData(null);
      setVitalsAvlaible(false);
    }
  };




  const handleRowClick = async (patient) => {

    await updateVisitStatus(
      patient.visitId,
      patient.visitDate,
      patient.docterId
    );

    cheackVitalPresent(patient.visitId);

    setSelectedPatient(patient);
    setShowDetailView(true);
  };


  //console.log("setSelectedPatient", selectedPatient)

  const handleBackToList = () => {
    // Hide detail page
    setShowDetailView(false);

    // Clear selected patient
    setSelectedPatient(null);

    // Reset expand sections
    setExpandedSections({
      personalDetails: false,
      clinicalHistory: false,
      vitalDetail: false,
      diagnosis: false,
      investigation: false,
      treatment: false,
      nip: false,
      referral: false,
      followUp: false,
      doctorRemark: false,
      surgeryAdvice: false,
      additionalAdvice: false,
      remarks: false,
    });

    // Reset Doctor's Remarks
    setSelectedDoctorRemarks([])
    setDoctorRemarksText("")
    setShowDoctorRemarksModal(false)

    setSelectedHistoryType("");

    // Reset template selections
    setSelectedTemplateIds(new Set());
    setSelectedTreatmentTemplateIds(new Set());   // 🔥 MISSING earlier (important)

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

    // Reset investigations / treatments
    setInvestigationItems([]);
    setTreatmentItems([]);

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
  };


  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const toggleNipSubsection = (subsection) => {
    setExpandedNipSubsections((prev) => ({
      ...prev,
      [subsection]: !prev[subsection],
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
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      // Auto-calculate BMI
      if ((name === "weight" || name === "height") &&
        updated.height !== "" &&
        updated.weight !== "") {
        updated.bmi = calculateBMI(updated.weight, updated.height);
      }

      return updated;
    });

    // Clear field error
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };



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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      // ICD Diagnoses
      const icdDiagList = diagnosisItems.map(item => ({
        icdId: item.icdDiagId ?? null,
        icdDiagName: item.icdDiagnosis || ""
      }));

      // Investigations mapping → backend format
      const investigationList = investigationItems.map(item => ({
        id: item.investigationId,
        investigationName: item.name,
        investigationDate: item.date
      }));

      //console.log("inv items", investigationItems)

      // Treatment mapping → backend format
      const treatmentList = treatmentItems.map(item => ({
        itemId: item.drugId,
        dosage: item.dosage,
        frequency: item.frequency,
        days: item.days,
        total: item.total,
        instraction: item.instruction
      }));


      //console.log("treatmentItems", treatmentItems)

      const payload = {
        // ===== Vital =====
        height: formData.height,
        idealWeight: formData.idealWeight || null,
        weight: formData.weight,
        pulse: formData.pulse,
        temperature: formData.temperature,
        rr: formData.rr,
        bmi: formData.bmi,
        spo2: formData.spo2,
        bpSystolic: formData.systolicBP,
        bpDiastolic: formData.diastolicBP,
        mlcFlag: formData.mlcCase ? "y" : "n",

        // ===== Diagnosis =====
        workingDiag: workingDiagnosis,
        icdDiag: icdDiagList,

        // ===== Clinical History =====
        pastMedicalHistory: formData.pastMedicalHistory ?? null,
        familyHistory: formData.familyHistory ?? null,
        presentComplaints: formData.patientSymptoms ?? null,
        patientSignsSymptoms: formData.patientSymptoms ?? null,
        clinicalExamination: formData.clinicalExamination ?? null,
        pastMedicalHistory: formData.pastHistory ?? null,

        // ===== Investigation =====
        labFlag: "y",
        radioFlag: "n",
        investigation: investigationList,

        // ===== Treatment =====
        treatment: treatmentList,

        // ===== Doctor's Remarks =====
        doctorRemarks: doctorRemarksText,

        // ===== Mapping IDs =====
        opdPatientDetailId: vitalsAvlaible ? opdVitalsData.opdPatientDetailsId : null,
        patientId: selectedPatient.patientId,
        visitId: selectedPatient.visitId,
        departmentId: selectedPatient.deptId,
        hospitalId: selectedPatient.hospitalId,
        doctorId: selectedPatient.docterId
      };

      const response = await postRequest(`${OPD_PATIENT}/patient-details`, payload);

      if (response?.status === 200 || response?.success === true) {
        showPopup(
          "Recall patient Create successfully!",
          "success",

        );
        handleResetForm();
        setShowDetailView(false);
        setWaitingList([]);


      } else {
        alert("Updated but unexpected response received.");
      }

      //console.log("Final Payload =", payload);

    } catch (error) {
      console.error("Update Error:", error);
      showPopup("Failed to update. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }


  };



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
      pastMedicalHistory: "",
      familyHistory: "",
      presentComplaints: "",
      pastHistory: "",
    });

    // Reset diagnosis
    setDiagnosisItems([
      {
        icdDiagId: "",
        icdDiagnosis: "",
        communicableDisease: false,
        infectiousDisease: false,
      },
    ]);


    // Important resets
    setSelectedTreatmentTemplateIds(new Set());
    setSelectedTemplateIds(new Set());

    // Reset Doctor's Remarks
    setSelectedDoctorRemarks([])
    setDoctorRemarksText("")

    setWorkingDiagnosis("");
    setInvestigationItems([]);
    setTreatmentItems([]);
    setErrors({});
  };


  const handleRelease = (patientId) => {
    setWaitingList((prevList) => {
      // Copy the list to avoid mutation
      const updatedList = [...prevList];

      // Find index of clicked item
      const index = updatedList.findIndex((item) => item.id === patientId);
      if (index === -1) return prevList;

      // Take out that item
      const itemToMove = { ...updatedList[index], visitStatus: "released" };

      // Remove from current position
      updatedList.splice(index, 1);

      // Add to LAST position
      updatedList.push(itemToMove);

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
        `${OPD_PATIENT}/changeStatusForClose/${visitId}/x`
      );

      if (response?.status === 200) {
        showPopup("Update successfully.", "success");
        handleSearch();
      } else {
        showPopup("Failed to update. Please try again.", "error");
      }
    } catch (error) {
      showPopup("Failed to update. Please try again.", "error");
    }
  };


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
    setInvestigationItems((prev) => [...prev, { name: "", date: getToday() }])
  }

  const handleRemoveInvestigationItem = (index) => {
    const newItems = investigationItems.filter((_, i) => i !== index)
    setInvestigationItems(newItems)
  }

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
        icdDiagId: "",
        icdDiagnosis: "",
        communicableDisease: false,
        infectiousDisease: false,
      },
    ])
  }

  const handleRemoveDiagnosisItem = (index) => {
    const newItems = diagnosisItems.filter((_, i) => i !== index)
    setDiagnosisItems(newItems)
  }

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
    ])
  }

  const calculateTotal = (item) => {

    if (!item.frequency || item.itemClassId == null) {
      return "";
    }

    const dosage = Number(item.dosage);
    const days = Number(item.days);

    // 👉 If dosage or days is zero → return 0
    if (dosage === 0 || days === 0) {
      return "0";
    }

    // If empty OR invalid values
    if (isNaN(dosage) || isNaN(days)) {
      return "";
    }

    // Get frequency multiplier
    const selectedFrequency = allFrequencies.find(
      f => Number(f.frequencyId) === Number(item.frequency)
    );

    const frequencyMultiplier = selectedFrequency
      ? Number(selectedFrequency.feq)
      : 1;

    let total = 0;

    // --------------------------
    // SOLID ITEMS
    // --------------------------
    if (DRUG_TYPE.SOLID.includes(Number(item.itemClassId))) {
      total = Math.ceil(dosage * frequencyMultiplier * days);
    }

    // --------------------------
    // LIQUID ITEMS
    // --------------------------
    else if (DRUG_TYPE.LIQUID.includes(Number(item.itemClassId))) {
      const qtyPerUnit = Number(item.aDispQty) || 1;

      total = Math.ceil((dosage * frequencyMultiplier * days) / qtyPerUnit);
    }

    // --------------------------
    // OTHER TYPES (fallback)
    // --------------------------
    else {
      total = 1;
    }

    return total.toString();
  };




  const handleRemoveTreatmentItem = (index) => {
    if (treatmentItems.length === 1) return
    const newItems = treatmentItems.filter((_, i) => i !== index)
    setTreatmentItems(newItems)
  }


  const handleTreatmentChange = (index, field, value) => {
    const updated = [...treatmentItems];
    updated[index] = { ...updated[index], [field]: value };

    // fields that should trigger recalculation
    const recalcFields = ["dosage", "days", "frequency", "itemClassId", "aDispQty"];

    if (recalcFields.includes(field)) {
      updated[index].total = calculateTotal(updated[index]);
    }

    setTreatmentItems(updated);
  };




  const handleNipSearchChange = (value) => {
    setNipSearchInput(value)
    setIsNipDropdownVisible(true)
  }

  const handleNipSelect = (nip, index) => {
    const newItems = [...nipItems]
    newItems[index] = { ...newItems[index], nip: nip.name }
    setNipItems(newItems)
    setNipSearchInput("")
    setIsNipDropdownVisible(false)
  }

  const handleAddNipItem = () => {
    setNipItems([
      ...nipItems,
      {
        nip: "",
        newNIP: "",
        class: "Select",
        au: "Select",
        dispUnit: "Select",
        uomQty: "",
        dosage: "",
        frequency: "Select",
        days: "",
        total: "",
        instruction: "",
        stock: "",
      },
    ])
  }

  const handleRemoveNipItem = (index) => {
    if (nipItems.length === 1) return
    const newItems = nipItems.filter((_, i) => i !== index)
    setNipItems(newItems)
  }

  const handleNipChange = (index, field, value) => {
    const newItems = [...nipItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setNipItems(newItems)
  }

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

  const handleClearAllTreatmentTemplates = () => {
    setSelectedTreatmentTemplateIds(new Set());

    setTreatmentItems(prev => {
      const updated = prev
        .map(item => {
          const templateList = (item.templateId ?? "").trim();

          // CASE 1: treatmentId exists → KEEP but clear templateId
          if (item.treatmentId != null) {
            return {
              ...item,
              templateId: ""
            };
          }

          // CASE 2: New UI row (treatmentId null)
          // - If templateId was "" → this is manual item → KEEP
          if (templateList === "") {
            return {
              ...item,
              templateId: ""
            };
          }

          // CASE 3: treatmentId null + templateIds exist → REMOVE (auto-generated from template)
          return null;
        })
        .filter(item => item !== null);

      // If everything removed → add a default empty row
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


  const handleAddProcedureCareItem = () => {
    setProcedureCareItems([
      ...procedureCareItems,
      {
        name: "",
        frequency: "",
        days: "",
        remarks: "",
      },
    ])
  }

  const handleRemoveProcedureCareItem = (index) => {
    if (procedureCareItems.length === 1) return
    const newItems = procedureCareItems.filter((_, i) => i !== index)
    setProcedureCareItems(newItems)
  }

  const handleProcedureCareChange = (index, field, value) => {
    const newItems = [...procedureCareItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setProcedureCareItems(newItems)
  }

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

  const getDrugDetails = (itemId) => {
    return drugCodeOptions.find(d => d.itemId === itemId);
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

          // ➕ ADD TEMPLATE-ID to existing row
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

      // POPUP FOR DUPLICATE DRUGS
      if (duplicateItems.length > 0) {
        setDuplicateItems(duplicateItems);
        setShowDuplicatePopup(true);
      }

      // ADD ONLY NEW ITEMS
      const formattedNew = newItemsToAdd.map(t => {

        // 🟢 FETCH FULL DRUG DETAILS FROM DROPDOWN SOURCE
        const drug = getDrugDetails(t.itemId);

        const newItem = {
          treatmentId: null,
          drugId: t.itemId,
          drugName: t.itemName,
          dispUnit: drug?.dispUnitName ?? t.dispU ?? "",
          dosage: t.dosage ?? "",
          frequency: t.frequencyId ?? "",
          days: t.noOfDays ?? "",
          instruction: t.instruction ?? "",
          stock: t.stocks ?? "",
          templateId: String(templateId),

          // 🟢 MOST IMPORTANT FIELDS (MISSING EARLIER)
          itemClassId: drug?.itemClassId ?? null,
          aDispQty: drug?.aDispQty ?? 1,
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

    setSelectedTreatmentTemplateIds(prev => new Set([...prev, templateId]));
    setSelectedTreatmentTemplateId("Select..");
  };


  const handleRemovePhysiotherapyItem = (index) => {
    if (physiotherapyItems.length === 1) return
    const newItems = physiotherapyItems.filter((_, i) => i !== index)
    setPhysiotherapyItems(newItems)
  }

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

  const totalPages = Math.ceil(waitingList.length / itemsPerPage);

  const currentItems = waitingList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // HANDLE PAGE INPUT
  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10);
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // PAGINATION BUTTONS
  const renderPagination = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) pageNumbers.push("...");
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pageNumbers.push("...");
      pageNumbers.push(totalPages);
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
    ));
  };

  // PRIORITY COLOR
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Priority-1": return "bg-danger text-white";
      case "Priority-2": return "bg-warning text-dark";
      case "Priority-3": return "bg-success text-white";
      default: return "bg-secondary text-white";
    }
  };

  // Doctor's Remarks Modal Component
  const DoctorRemarksModal = ({ show, onClose, templates, onSave }) => {
    const [selectedItems, setSelectedItems] = useState(new Set())

    const handleCheckboxChange = (index) => {
      setSelectedItems(prev => {
        const newSet = new Set(prev)
        if (newSet.has(index)) {
          newSet.delete(index)
        } else {
          newSet.add(index)
        }
        return newSet
      })
    }

    const handleSelectAll = () => {
      if (selectedItems.size === templates.length) {
        setSelectedItems(new Set())
      } else {
        setSelectedItems(new Set(templates.map((_, index) => index)))
      }
    }

    const handleSave = () => {
      const selectedTemplates = Array.from(selectedItems).map(index => templates[index])
      onSave(selectedTemplates)
      onClose()
    }

    if (!show) return null

    return (
      <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">DOCTOR'S REMARKS TEMPLATE</h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
              ></button>
            </div>
            <div className="modal-body">
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead style={{ backgroundColor: "#b0c4de" }}>
                    <tr>
                      <th style={{ width: "5%" }}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedItems.size === templates.length}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th style={{ width: "95%" }}>Doctor Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((remark, index) => (
                      <tr key={index}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedItems.has(index)}
                            onChange={() => handleCheckboxChange(index)}
                          />
                        </td>
                        <td>{remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleSave}>
                OK
              </button>
              <button className="btn btn-secondary" onClick={onClose}>
                CLOSE
              </button>
            </div>
          </div>
        </div>
      </div>
    )
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
                            value={selectedPatient.dob || ""}
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
                          <input type="text" id="age" name="age" value={selectedPatient.age || ""} className="form-control" placeholder="Enter Age" readOnly />
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
                <div className="card mb-3">
                  <div
                    className="card-header py-3 bg-light border-bottom-1 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection("clinicalHistory")}
                  >
                    <h6 className="mb-0 fw-bold">Clinical History</h6>
                    <span style={{ fontSize: "18px" }}>{expandedSections.clinicalHistory ? "−" : "+"}</span>
                  </div>
                  {expandedSections.clinicalHistory && (
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-3">
                          <div className="d-flex flex-column gap-2">
                            <button
                              className={`btn btn-sm ${selectedHistoryType === "previous-visits" ? "btn-primary" : "btn-outline-primary"}`}
                              onClick={() => handleHistoryTypeClick("previous-visits")}
                            >
                              Previous Visits
                            </button>
                            <button
                              className={`btn btn-sm ${selectedHistoryType === "previous-vitals" ? "btn-primary" : "btn-outline-primary"}`}
                              onClick={() => handleHistoryTypeClick("previous-vitals")}
                            >
                              Previous Vitals
                            </button>
                            <button
                              className={`btn btn-sm ${selectedHistoryType === "previous-lab" ? "btn-primary" : "btn-outline-primary"}`}
                              onClick={() => handleHistoryTypeClick("previous-lab")}
                            >
                              Previous Lab Investigation
                            </button>
                            <button
                              className={`btn btn-sm ${selectedHistoryType === "previous-ecg" ? "btn-primary" : "btn-outline-primary"}`}
                              onClick={() => handleHistoryTypeClick("previous-ecg")}
                            >
                              Previous ECG Investigation
                            </button>
                            <button
                              className={`btn btn-sm ${selectedHistoryType === "audit-history" ? "btn-primary" : "btn-outline-primary"}`}
                              onClick={() => handleHistoryTypeClick("audit-history")}
                            >
                              Audit History
                            </button>
                          </div>
                        </div>
                        <div className="col-md-9">
                          <div className="row">
                            <div className="col-md-6">
                              <label className="form-label fw-bold">Patient signs & symptoms</label>
                              <input
                                type="text"
                                className="form-control"
                                name="patientSymptoms"
                                value={formData.patientSymptoms}
                                onChange={handleChange}
                                placeholder="Enter symptoms"
                              />
                            </div>
                            <div className="col-md-6  mb-3 ">
                              <label className="form-label fw-bold">Clinical Examination</label>
                              <textarea
                                className="form-control"
                                rows={3}
                                name="clinicalExamination"
                                value={formData.clinicalExamination}
                                onChange={handleChange}
                                placeholder="Enter clinical examination details"
                              ></textarea>
                            </div>
                            <div className="col-md-6">
                              <label className="form-label fw-bold">Past History</label>
                              <textarea
                                className="form-control"
                                value={formData.pastHistory}
                                onChange={handleChange}
                                rows={3}
                                name="pastHistory"
                                placeholder="Enter Past History"
                              ></textarea>
                            </div>
                            <div className="col-md-6">
                              <label className="form-label fw-bold">Family History</label>
                              <textarea
                                className="form-control"
                                rows={3}
                                value={formData.familyHistory}
                                onChange={handleChange}
                                name="familyHistory"
                                placeholder="Enter Family History"
                              ></textarea>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Vital Detail Section */}
                <div className="card mb-3">
                  <div
                    className="card-header py-3 bg-light border-bottom-1 d-flex justify-content-between align-items-center"
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
                    className="card-header py-3 bg-light border-bottom-1 d-flex justify-content-between align-items-center"
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

                                    {/* INPUT */}
                                    <input
                                      type="text"
                                      className="form-control"
                                      placeholder="Search ICD..."
                                      value={diagnosisItems[index].icdDiagnosis || search[index] || ""}
                                      onChange={async (e) => {
                                        const val = e.target.value;

                                        setSearch((prev) => {
                                          const updated = [...prev];
                                          updated[index] = val;
                                          return updated;
                                        });

                                        const result = await fetchMasICDData(0, val);
                                        setIcdDropdown(result.list);
                                        setLastPage(result.last);
                                        setPage(0);
                                        setOpenDropdown(index);
                                      }}
                                      onClick={() => {
                                        loadFirstPage();
                                        setOpenDropdown(index);
                                      }}
                                      onBlur={() => {
                                        setTimeout(() => {
                                          const selectedIcd = diagnosisItems[index];
                                          const searchText = search[index];

                                          // If user typed but did NOT select → clear input
                                          if (
                                            (!selectedIcd.icdId || selectedIcd.icdDiagnosis !== searchText) &&
                                            searchText !== ""
                                          ) {
                                            // Clear search text
                                            setSearch((prev) => {
                                              const updated = [...prev];
                                              updated[index] = "";
                                              return updated;
                                            });

                                            // Clear diagnosis item fields
                                            handleDiagnosisChange(index, "icdId", null);
                                            handleDiagnosisChange(index, "icdDiagnosis", "");
                                          }

                                          setOpenDropdown(null);
                                        }, 150);
                                      }}
                                    />


                                    {/* DROPDOWN */}
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
                                        {/* ICD OPTIONS */}
                                        {icdDropdown.length > 0 ? (
                                          icdDropdown.map((icd) => (
                                            <div
                                              key={icd.icdId}
                                              className="p-2 cursor-pointer hover:bg-light"
                                              onMouseDown={() => {
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
                                    disabled={diagnosisItems.length === 1}
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
                <div className="card mb-3">
                  <div
                    className="card-header py-3 bg-light border-bottom-1 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection("investigation")}
                  >
                    <h6 className="mb-0 fw-bold">Investigation</h6>
                    <span style={{ fontSize: "18px" }}>{expandedSections.investigation ? "−" : "+"}</span>
                  </div>
                  {expandedSections.investigation && (
                    <div className="card-body">
                      {/* Selected Templates Display */}
                      {selectedTemplateIds.size > 0 && (
                        <div className="row mb-3">
                          <div className="col-12">
                            <div className="card">
                              <div className="card-header py-2 bg-light">
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

                      {/* Radio Buttons */}
                      <div className="row mb-3">
                        <div className="col-12">
                          <div className="d-flex gap-4 flex-wrap">
                            {investigationTypes.length > 0 ? (
                              <>
                                {investigationTypes.map((type) => (
                                  <div key={type.value} className="form-check">
                                    <input
                                      className="form-check-input"
                                      type="radio"
                                      name="investigationType"
                                      id={`inv-type-${type.value}`}
                                      value={type.value}
                                      checked={investigationType === type.value}
                                      onChange={(e) => {
                                        //console.log("Radio button selected:", e.target.value)
                                        setInvestigationType(e.target.value)
                                      }}
                                    />
                                    <label className="form-check-label fw-bold" htmlFor={`inv-type-${type.value}`}>
                                      {type.name.toUpperCase()}
                                    </label>
                                  </div>
                                ))}
                              </>
                            ) : (
                              <div className="text-muted small">
                                Loading investigation types...
                                {allInvestigations.length > 0 && ` (${allInvestigations.length} investigations loaded)`}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Investigation Table */}
                      <div className="table-responsive">
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
                                  <div style={{ position: "relative" }}>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={item.name}
                                      onChange={(e) => {
                                        const newItems = [...investigationItems]
                                        newItems[index] = {
                                          ...newItems[index],
                                          name: e.target.value,
                                          investigationId: null,
                                        }
                                        setInvestigationItems(newItems)
                                        setActiveInvestigationRowIndex(index)
                                      }}
                                      onFocus={(e) => handleInputFocus(e, index)}
                                      placeholder="Enter investigation"
                                      autoComplete="off"
                                    />

                                    {/* Dropdown displayed as fixed overlay */}
                                    {activeInvestigationRowIndex === index && dropdownVisible && (
                                      <div
                                        style={{
                                          position: "fixed",
                                          zIndex: 99999,
                                          backgroundColor: "white",
                                          borderRadius: "4px",
                                          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
                                          maxHeight: "200px",
                                          overflowY: "auto",
                                          width: `${dropdownWidth}px`,
                                          left: `${dropdownPosition.x}px`,
                                          top: `${dropdownPosition.y + dropdownPosition.height}px`,
                                        }}
                                      >
                                        {filterInvestigationsBySearch(item.name).length > 0 ? (
                                          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                                            {filterInvestigationsBySearch(item.name).map((investigation) => (
                                              <li
                                                key={investigation.investigationId}
                                                style={{
                                                  backgroundColor: "#f8f9fa",
                                                  cursor: "pointer",
                                                  borderBottom: "1px solid #dee2e6",
                                                  padding: "8px 12px",
                                                  transition: "background-color 0.2s",
                                                }}
                                                onMouseEnter={(e) => (e.target.style.backgroundColor = "#e9ecef")}
                                                onMouseLeave={(e) => (e.target.style.backgroundColor = "#f8f9fa")}
                                                onClick={() => handleInvestigationSelect(index, investigation)}
                                              >
                                                <div>
                                                  <strong style={{ color: "#3b82f6" }}>
                                                    {investigation.investigationName}
                                                  </strong>
                                                  <div
                                                    style={{
                                                      color: "#6c757d",
                                                      fontSize: "0.8rem",
                                                      marginTop: "2px",
                                                    }}
                                                  >
                                                    {investigation.mainChargeCodeName} •{" "}
                                                    {investigation.subChargeCodeName}
                                                  </div>
                                                </div>
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <div style={{ textAlign: "center", padding: "12px", color: "#6c757d" }}>
                                            {item.name.trim() ? "No investigations found" : "Start typing to search..."}
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
                                    disabled={investigationItems.length === 1}
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
                    className="card-header py-3 bg-light border-bottom-1 d-flex justify-content-between align-items-center"
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

                      {/* Selected Templates Display */}
                      {selectedTreatmentTemplateIds.size > 0 && (
                        <div className="row mb-3">
                          <div className="col-12">
                            <div className="card">
                              <div className="card-header py-2 bg-light">
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

                      {/* Template Dropdown + Create/Update Buttons */}
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

                      {/* Treatment Table */}
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
                                                    aDispQty: opt.aDispQty ?? 1,   // FIXED
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
                                      handleTreatmentChange(index, "frequency", Number(e.target.value))
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
                                    disabled={treatmentItems.length === 1}
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

                {/* NIP Section */}
                <div className="card mb-3">
                  <div
                    className="card-header py-3 bg-light border-bottom-1 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection("nip")}
                  >
                    <h6 className="mb-0 fw-bold">NIP</h6>
                    <span style={{ fontSize: "18px" }}>{expandedSections.nip ? "−" : "+"}</span>
                  </div>
                  {expandedSections.nip && (
                    <div className="card-body">
                      {/* Treatment Advice Subsection */}
                      <div className="card mb-3">
                        <div
                          className="card-header py-2 bg-light border-bottom-1 d-flex justify-content-between align-items-center"
                          style={{ cursor: "pointer" }}
                          onClick={() => toggleNipSubsection("treatmentAdvice")}
                        >
                          <h6 className="mb-0">Treatment Advice</h6>
                          <span style={{ fontSize: "16px" }}>{expandedNipSubsections.treatmentAdvice ? "−" : "+"}</span>
                        </div>
                        {expandedNipSubsections.treatmentAdvice && (
                          <div className="card-body">
                            <div className="row align-items-end">
                              <div className="col-md-11">
                                <label className="form-label fw-bold">Treatment Advice</label>
                                <textarea
                                  className="form-control"
                                  rows={3}
                                  value={generalTreatmentAdvice}
                                  placeholder="Treatment advice will be populated here"
                                  readOnly
                                ></textarea>
                              </div>
                              <div className="col-md-1 text-center">
                                <button
                                  className="btn btn-primary"
                                  style={{ padding: "8px 12px" }}
                                  onClick={() => handleOpenTreatmentAdviceModal("general")}
                                  title="Add Treatment Advice"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* NIP Subsection */}
                      <div className="card mb-3">
                        <div
                          className="card-header py-2 bg-light border-bottom-1 d-flex justify-content-between align-items-center"
                          style={{ cursor: "pointer" }}
                          onClick={() => toggleNipSubsection("nip")}
                        >
                          <h6 className="mb-0">NIP</h6>
                          <span style={{ fontSize: "16px" }}>{expandedNipSubsections.nip ? "−" : "+"}</span>
                        </div>
                        {expandedNipSubsections.nip && (
                          <div className="card-body">
                            <div className="table-responsive">
                              <table className="table table-bordered">
                                <thead style={{ backgroundColor: "#b0c4de" }}>
                                  <tr>
                                    <th>NIP</th>
                                    <th>New NIP</th>
                                    <th>Class</th>
                                    <th>AU</th>
                                    <th>Disp. Unit</th>
                                    <th>UOM Qty</th>
                                    <th>Dosage</th>
                                    <th>Frequency</th>
                                    <th>Days</th>
                                    <th>Total</th>
                                    <th>Instruction</th>
                                    <th>Stock</th>
                                    <th className="text-center">Add</th>
                                    <th className="text-center">Delete</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {nipItems.map((item, index) => (
                                    <tr key={index}>
                                      <td className="position-relative">
                                        <input
                                          type="text"
                                          className="form-control"
                                          value={item.nip}
                                          onChange={(e) => {
                                            handleNipSearchChange(e.target.value)
                                            setSelectedNipIndex(index)
                                          }}
                                          placeholder="Search NIP"
                                          autoComplete="off"
                                        />
                                        {isNipDropdownVisible && selectedNipIndex === index && nipSearchInput && (
                                          <ul
                                            className="list-group position-absolute w-100 mt-1"
                                            style={{ zIndex: 1000, top: "100%" }}
                                          >
                                            {nipOptions
                                              .filter((nip) =>
                                                nip.name.toLowerCase().includes(nipSearchInput.toLowerCase()),
                                              )
                                              .map((nip) => (
                                                <li
                                                  key={nip.id}
                                                  className="list-group-item list-group-item-action"
                                                  onClick={() => handleNipSelect(nip, index)}
                                                >
                                                  {nip.name}
                                                </li>
                                              ))}
                                          </ul>
                                        )}
                                      </td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control"
                                          value={item.newNIP}
                                          onChange={(e) => handleNipChange(index, "newNIP", e.target.value)}
                                          placeholder="New NIP"
                                        />
                                      </td>
                                      <td>
                                        <select
                                          className="form-select"
                                          value={item.class}
                                          onChange={(e) => handleNipChange(index, "class", e.target.value)}
                                        >
                                          <option value="Select">Select</option>
                                          <option value="Class A">Class A</option>
                                          <option value="Class B">Class B</option>
                                          <option value="Class C">Class C</option>
                                        </select>
                                      </td>
                                      <td>
                                        <select
                                          className="form-select"
                                          value={item.au}
                                          onChange={(e) => handleNipChange(index, "au", e.target.value)}
                                        >
                                          <option value="Select">Select</option>
                                          <option value="AU-1">AU-1</option>
                                          <option value="AU-2">AU-2</option>
                                          <option value="AU-3">AU-3</option>
                                        </select>
                                      </td>
                                      <td>
                                        <select
                                          className="form-select"
                                          value={item.dispUnit}
                                          onChange={(e) => handleNipChange(index, "dispUnit", e.target.value)}
                                        >
                                          <option value="Select">Select</option>
                                          <option value="Tab">Tab</option>
                                          <option value="Cap">Cap</option>
                                          <option value="Syr">Syr</option>
                                        </select>
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          className="form-control"
                                          value={item.uomQty}
                                          onChange={(e) => handleNipChange(index, "uomQty", e.target.value)}
                                          placeholder="0"
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          className="form-control"
                                          value={item.dosage}
                                          onChange={(e) => handleNipChange(index, "dosage", e.target.value)}
                                          placeholder="0"
                                        />
                                      </td>
                                      <td>
                                        <select
                                          className="form-select"
                                          value={item.frequency}
                                          onChange={(e) => handleNipChange(index, "frequency", e.target.value)}
                                        >
                                          <option value="Select">Select</option>
                                          <option value="OD">OD</option>
                                          <option value="BID">BID</option>
                                          <option value="TID">TID</option>
                                          <option value="QID">QID</option>
                                        </select>
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          className="form-control"
                                          value={item.days}
                                          onChange={(e) => handleNipChange(index, "days", e.target.value)}
                                          placeholder="0"
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          className="form-control"
                                          value={item.total}
                                          onChange={(e) => handleNipChange(index, "total", e.target.value)}
                                          placeholder="0"
                                        />
                                      </td>
                                      <td>
                                        <select
                                          className="form-select"
                                          value={item.instruction}
                                          onChange={(e) => handleNipChange(index, "instruction", e.target.value)}
                                        >
                                          <option value="">Select...</option>
                                          <option value="After Meal">After Meal</option>
                                          <option value="Before Meal">Before Meal</option>
                                        </select>
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          className="form-control"
                                          value={item.stock}
                                          onChange={(e) => handleNipChange(index, "stock", e.target.value)}
                                          placeholder="0"
                                        />
                                      </td>
                                      <td className="text-center">
                                        <button className="btn btn-sm btn-success" onClick={handleAddNipItem}>
                                          +
                                        </button>
                                      </td>
                                      <td className="text-center">
                                        <button
                                          className="btn btn-sm btn-danger"
                                          onClick={() => handleRemoveNipItem(index)}
                                          disabled={nipItems.length === 1}
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

                      {/* Procedure Care Subsection */}
                      <div className="card mb-3">
                        <div
                          className="card-header py-2 bg-light border-bottom-1 d-flex justify-content-between align-items-center"
                          style={{ cursor: "pointer" }}
                          onClick={() => toggleNipSubsection("procedureCare")}
                        >
                          <h6 className="mb-0">Procedure Care</h6>
                          <span style={{ fontSize: "16px" }}>{expandedNipSubsections.procedureCare ? "−" : "+"}</span>
                        </div>
                        {expandedNipSubsections.procedureCare && (
                          <div className="card-body">
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
                                    {procedureCareItems.map((row, index) => (
                                      <tr key={index}>
                                        <td>
                                          <input
                                            type="text"
                                            className="form-control"
                                            value={row.name}
                                            onChange={(e) => handleProcedureCareChange(index, "name", e.target.value)}
                                            placeholder="Enter nursing care name"
                                          />
                                        </td>
                                        <td>
                                          <select
                                            className="form-select"
                                            value={row.frequency}
                                            onChange={(e) =>
                                              handleProcedureCareChange(index, "frequency", e.target.value)
                                            }
                                          >
                                            <option value="">Select</option>
                                            <option value="OD">OD</option>
                                            <option value="BID">BID</option>
                                            <option value="TID">TID</option>
                                            <option value="QID">QID</option>
                                          </select>
                                        </td>
                                        <td>
                                          <input
                                            type="number"
                                            className="form-control"
                                            value={row.days}
                                            onChange={(e) => handleProcedureCareChange(index, "days", e.target.value)}
                                            placeholder="0"
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
                                            disabled={procedureCareItems.length === 1}
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
                                            value={row.frequency}
                                            onChange={(e) =>
                                              handlePhysiotherapyChange(index, "frequency", e.target.value)
                                            }
                                          >
                                            <option value="">Select</option>
                                            <option value="OD">OD</option>
                                            <option value="BID">BID</option>
                                            <option value="TID">TID</option>
                                            <option value="QID">QID</option>
                                          </select>
                                        </td>
                                        <td>
                                          <input
                                            type="number"
                                            className="form-control"
                                            value={row.days}
                                            onChange={(e) => handlePhysiotherapyChange(index, "days", e.target.value)}
                                            placeholder="0"
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
                                            disabled={physiotherapyItems.length === 1}
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

                      {/* Surgery Advice Subsection */}
                      <div className="card mb-3">
                        <div
                          className="card-header py-2 bg-light border-bottom-1 d-flex justify-content-between align-items-center"
                          style={{ cursor: "pointer" }}
                          onClick={() => toggleNipSubsection("surgeryAdvice")}
                        >
                          <h6 className="mb-0">Surgery Advice</h6>
                          <span style={{ fontSize: "16px" }}>{expandedNipSubsections.surgeryAdvice ? "−" : "+"}</span>
                        </div>
                        {expandedNipSubsections.surgeryAdvice && (
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

                      {/* Additional Advice Subsection */}
                      <div className="card mb-3">
                        <div
                          className="card-header py-2 bg-light border-bottom-1 d-flex justify-content-between align-items-center"
                          style={{ cursor: "pointer" }}
                          onClick={() => toggleNipSubsection("additionalAdvice")}
                        >
                          <h6 className="mb-0">Additional Advice</h6>
                          <span style={{ fontSize: "16px" }}>
                            {expandedNipSubsections.additionalAdvice ? "−" : "+"}
                          </span>
                        </div>
                        {expandedNipSubsections.additionalAdvice && (
                          <div className="card-body">
                            {admissionAdvised && (
                              <div className="row mb-4 pb-4 border-bottom">
                                <div className="col-12">
                                  <div className="row g-3">
                                    <div className="col-md-2 d-flex align-items-center">
                                      <div className="form-check">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          id="admissionAdvised"
                                          checked={admissionAdvised}
                                          onChange={(e) => setAdmissionAdvised(e.target.checked)}
                                        />
                                        <label className="form-check-label fw-bold" htmlFor="admissionAdvised">
                                          Admission Advised
                                        </label>
                                      </div>
                                    </div>
                                    <div className="col-md-2">
                                      <label className="form-label fw-bold">Admission Date</label>
                                      <input
                                        type="date"
                                        className="form-control"
                                        value={admissionDate}
                                        onChange={(e) => setAdmissionDate(e.target.value)}
                                      />
                                    </div>
                                    <div className="col-md-2">
                                      <label className="form-label fw-bold">Ward</label>
                                      <select
                                        className="form-select border-black"
                                        value={selectedWard}
                                        onChange={(e) => setSelectedWard(e.target.value)}
                                      >
                                        <option value="CHILDREN WARD">CHILDREN WARD</option>
                                        <option value="GENERAL WARD">GENERAL WARD</option>
                                        <option value="ICU WARD">ICU WARD</option>
                                        <option value="MATERNITY WARD">MATERNITY WARD</option>
                                        <option value="SURGICAL WARD">SURGICAL WARD</option>
                                      </select>
                                    </div>
                                    <div className="col-md-1">
                                      <label className="form-label fw-bold">Occupied Bed</label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={wardData[selectedWard]?.occupied || 0}
                                        readOnly
                                      />
                                    </div>
                                    <div className="col-md-1">
                                      <label className="form-label fw-bold">Vacant Bed</label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={wardData[selectedWard]?.vacant || 0}
                                        readOnly
                                      />
                                    </div>
                                    <div className="col-md-4">
                                      <label className="form-label fw-bold">Admission Notes</label>
                                      <textarea
                                        className="form-control"
                                        rows={2}
                                        value={admissionNotes}
                                        onChange={(e) => setAdmissionNotes(e.target.value)}
                                        placeholder="Enter admission notes"
                                      ></textarea>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="row">
                              <div className="col-md-9">
                                <label className="form-label fw-bold">Additional Advice</label>
                                <textarea
                                  className="form-control"
                                  rows={4}
                                  value={additionalAdvice}
                                  onChange={(e) => setAdditionalAdvice(e.target.value)}
                                  placeholder="Enter additional advice"
                                ></textarea>
                              </div>
                              <div className="col-md-3 d-flex align-items-end">
                                <div className="form-check w-100">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="admissionAdvised"
                                    checked={admissionAdvised}
                                    onChange={(e) => setAdmissionAdvised(e.target.checked)}
                                  />
                                  <label className="form-check-label" htmlFor="admissionAdvised">
                                    Admission Advised
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="card mb-3">
                  <div
                    className="card-header py-3 bg-light border-bottom-1 d-flex justify-content-between align-items-center"
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
                              <label className="form-check-label" htmlFor="referralNo">
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
                          {/* INTERNAL REFERRAL */}
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

                          {/* EMPANEL REFERRAL */}
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

                          {/* BOTH REFERRAL */}
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

                          {/* REFERRAL NOTES (COMMON FOR ALL TYPES) */}
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


                <div className="card mb-3">
                  {/* HEADER */}
                  <div
                    className="card-header py-3 bg-light border-bottom-1 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection("followUp")}
                  >
                    <h6 className="mb-0 fw-bold">Follow Up</h6>
                    <span style={{ fontSize: "18px" }}>
                      {expandedSections.followUp ? "−" : "+"}
                    </span>
                  </div>

                  {/* BODY */}
                  {expandedSections.followUp && (
  <div className="card-body">
    <div className="d-flex align-items-center justify-content-between">

      {/* LEFT SIDE: Checkbox + Label */}
      <div className="d-flex align-items-center gap-2">
        <input
          type="checkbox"
          className="form-check-input m-0"
        />
        <h6 className="fw-bold mb-0">Follow Up</h6>
      </div>

      {/* RIGHT SIDE: Number of Days + Next Date */}
      <div className="d-flex align-items-center gap-4">

        {/* Number of Days */}
        <div className="d-flex align-items-center gap-2">
          <label className="form-label mb-0">Number of days</label>
          <select className="form-select" style={{ width: "150px" }}>
            <option value="">Select</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>

        {/* Next Date */}
        <div className="d-flex align-items-center gap-2">
          <label className="form-label mb-0">Next date</label>
          <input
            type="date"
            className="form-control"
            style={{ width: "170px" }}
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
                    className="card-header py-3 bg-light border-bottom-1 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection("remarks")}
                  >
                    <h6 className="mb-0 fw-bold">Remarks</h6>
                    <span style={{ fontSize: "18px" }}>
                      {expandedSections.remarks ? "−" : "+"}
                    </span>
                  </div>

                  {/* BODY */}
                  {expandedSections.remarks && (
                    <div className="card-body">
                      <div className="row align-items-end">
                        <div className="col-md-11">
                          <label className="form-label fw-bold">Doctor's Remarks</label>
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
                            className="btn btn-primary"
                            style={{ padding: "8px 12px" }}
                            onClick={handleOpenDoctorRemarksModal}
                            title="Select Doctor Remarks Template"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>



                <div className="text-center mt-4">
                  <button className="btn btn-primary me-3" onClick={handleSubmit} disabled={isSubmitting} type="button">
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

        {/* Modals - UPDATED */}
        <InvestigationModal
          show={showInvestigationModal}
          onClose={handleCloseInvestigationModal}
          templateType={investigationModalType}
          onTemplateSaved={(template) => {
            //console.log("Template saved:", template)
            fetchInvestigationTemplates()
          }}
        />

        <TreatmentModal
          show={showTreatmentModal}
          onClose={handleCloseTreatmentModal}
          templateType={treatmentModalType}
          onTemplateSaved={(template) => {
            //console.log("Treatment template saved:", template)
          }}
        />

        {/* Doctor's Remarks Modal */}
        <DoctorRemarksModal
          show={showDoctorRemarksModal}
          onClose={handleCloseDoctorRemarksModal}
          templates={doctorRemarksTemplates}
          onSave={handleSaveDoctorRemarks}
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

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">GENERAL MEDICINE WAITING LIST</h4>

              </div>
              {loading && <LoadingScreen />}
            </div>
            <div className="card-body">
              <div className="card mb-3">
                <div className="card-body">
                  <div className="row g-3 align-items-end">

                    <div className="col-md-3">
                      <label className="form-label fw-bold">Doctor List <span>*</span></label>
                      <select
                        className="form-select"
                        value={searchFilters.doctorList}
                        onChange={(e) => handleFilterChange("doctorList", e.target.value)}
                      >
                        <option value="">Select</option>
                        {doctorData.map((d) => (
                          <option key={d.userId} value={d.userId}>
                            {[d.firstName, d.middleName, d.lastName].filter(Boolean).join(" ")}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-2">
                      <label className="form-label fw-bold">Session</label>
                      <select
                        className="form-select"
                        value={searchFilters.session}
                        onChange={(e) => handleFilterChange("session", e.target.value)}
                      >
                        <option value="">Select</option>
                        {sessionData.map((s) => (
                          <option key={s.id} value={s.id}>{s.sessionName}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-2">
                      <label className="form-label fw-bold">Mobile No.</label>
                      <input
                        type="text"
                        className="form-control"
                        value={searchFilters.mobileNo}
                        onChange={(e) => handleFilterChange("mobileNo", e.target.value)}
                        maxLength={20}
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label fw-bold">Patient Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={searchFilters.patientName}
                        onChange={(e) => handleFilterChange("patientName", e.target.value)}
                        maxLength={30}
                      />
                    </div>

                    <div className="col-md-2 d-flex gap-2">
                      <button type="button" className="btn btn-primary w-100" onClick={handleSearch}>
                        SEARCH
                      </button>
                      <button type="button" className="btn btn-secondary w-100" onClick={handleReset}>
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
                      <th>Employee No.</th>
                      <th>Patient Name</th>
                      <th>Relation</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>OPD Type</th>
                      <th>Action</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentItems.map((item, index) => (
                      <tr
                        key={item.id}
                        onClick={() => handleRowClick(item)}
                        style={{ cursor: "pointer" }}
                      >
                        {/* SERIAL NUMBER */}
                        <td>
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>

                        <td>
                          <span className={`badge ${getPriorityColor(item.priority)}`}>
                            {item.tokenNo}
                          </span>
                        </td>

                        <td>{item.employeeNo}</td>

                        <td>{item.patientName}</td>

                        <td>{item.relation}</td>

                        <td>{item.age}</td>

                        <td>{item.gender}</td>

                        <td>{item.opdType}</td>

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
                    ))}
                  </tbody>
                </table>


              </div>

              <div className="d-flex mb-3 mt-3">
                <span className="badge bg-danger me-2">Priority-1</span>
                <span className="badge bg-warning text-dark me-2">Priority-2</span>
                <span className="badge bg-success">Priority-3</span>
              </div>

              <nav className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  <span>
                    Page {currentPage} of {totalPages} | Total Records: {waitingList.length}
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

                  <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next »
                    </button>
                  </li>
                </ul>

                <div className="d-flex align-items-center">
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
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

export default GeneralMedicineWaitingList