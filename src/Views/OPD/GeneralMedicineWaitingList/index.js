import { useState, useEffect } from "react"
import placeholderImage from "../../../assets/images/placeholder.jpg"
import OTDashboard from "./OTDashboard"
import InvestigationModal from "./InvestigationModal"
import TreatmentModal from "./TreatmentModal"
import { getRequest } from "../../../service/apiService"
import { OPD_TEMPLATE, MAS_INVESTIGATION } from "../../../config/apiConfig"

const GeneralMedicineWaitingList = () => {
  const [waitingList, setWaitingList] = useState([
    {
      id: 1,
      tokenNo: "GM-1",
      employeeNo: "33503",
      patientName: "BHANUPRAKASH K R",
      relation: "Husband",
      designation: "MEDICAL SUPTD.",
      name: "DR. NIRMALA D",
      age: "47 Years",
      gender: "Male",
      opdType: "Normal OPD",
      priority: "Priority-1",
      status: "waiting",
    },
  ])

  const [searchFilters, setSearchFilters] = useState({
    doctorList: "Dr. G. Pradhan",
    session: "Select",
    employeeNo: "",
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
  const [investigationItems, setInvestigationItems] = useState([{ name: "", date: getToday() }])
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
      drugName: "Diclofenac Sodium Tab. IP 50 mg[D168]",
      dispUnit: "Tab",
      dosage: "1",
      frequency: "BID",
      days: "5",
      total: "10",
      instruction: "",
      stock: "",
    },
    {
      drugName: "TAB CETIRIZINE 10 MG[D00162]",
      dispUnit: "Tab",
      dosage: "1",
      frequency: "OD",
      days: "5",
      total: "5",
      instruction: "",
      stock: "",
    },
    {
      drugName: "Ferrous Sulphate with Folic Acid Tab. [D00078]",
      dispUnit: "Tab",
      dosage: "1",
      frequency: "OD",
      days: "15",
      total: "15",
      instruction: "",
      stock: "",
    },
  ])

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
    console.log("Filtering investigations by type:", investigationType)

    if (!investigationType || allInvestigations.length === 0) {
      setFilteredInvestigationsByType([])
      return
    }

    const selectedType = investigationTypes.find(type => type.value === investigationType)
    console.log("Selected type for filtering:", selectedType)

    if (selectedType) {
      const filtered = allInvestigations.filter(inv => inv.mainChargeCodeId === selectedType.id)
      console.log(`Filtered ${filtered.length} investigations for type:`, selectedType.name)
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

  // UPDATED: Handle template selection to accumulate items
  const handleInvestigationTemplateSelect = (template) => {
    const templateId = template.templateId
    
    // Check if template is already selected
    if (selectedTemplateIds.has(templateId)) {
      alert("This template is already selected")
      setSelectedInvestigationTemplate("Select..")
      return
    }

    setSelectedInvestigationTemplate(templateId)
    
    // Add template to selected templates set
    setSelectedTemplateIds(prev => new Set([...prev, templateId]))

    if (template.investigationResponseList && template.investigationResponseList.length > 0) {
      const newItems = template.investigationResponseList.map(item => ({
        name: item.investigationName || `Investigation #${item.investigationId}`,
        date: getToday(),
        investigationId: item.investigationId,
        templateSource: template.opdTemplateName // Track which template this came from
      }))
      
      // Add new items to existing items, avoiding duplicates
      setInvestigationItems(prev => {
        const existingIds = new Set(prev.map(item => item.investigationId))
        const uniqueNewItems = newItems.filter(item => !existingIds.has(item.investigationId))
        return [...prev.filter(item => item.name !== ""), ...uniqueNewItems]
      })
    }
    
    // Reset dropdown to "Select.." for next selection
    setTimeout(() => {
      setSelectedInvestigationTemplate("Select..")
    }, 100)
  }

  // NEW: Function to clear all selected templates and items
  const handleClearAllTemplates = () => {
    setSelectedTemplateIds(new Set())
    setInvestigationItems([{ name: "", date: getToday() }])
  }

  // NEW: Function to remove specific template items
  const handleRemoveTemplateItems = (templateId) => {
    const template = investigationTemplates.find(t => t.templateId == templateId)
    if (!template) return

    // Remove items from this template
    setInvestigationItems(prev => 
      prev.filter(item => 
        !template.investigationResponseList?.some(templateItem => 
          templateItem.investigationId === item.investigationId
        )
      )
    )

    // Remove template from selected set
    setSelectedTemplateIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(templateId)
      return newSet
    })
  }

  const handleInvestigationSelect = (index, investigation) => {
    const newItems = [...investigationItems]
    newItems[index] = {
      ...newItems[index],
      name: investigation.investigationName,
      investigationId: investigation.investigationId
    }
    setInvestigationItems(newItems)
    setActiveInvestigationRowIndex(null)
  }

  // ADD THESE USEEFFECT HOOKS

  // DEBUGGING: Add this at the top of your component to see what's happening
  console.log("Component render - investigationType:", investigationType, "investigationTypes:", investigationTypes)

  useEffect(() => {
    if (showDetailView && selectedPatient) {
      console.log("Fetching investigation data...")
      fetchInvestigationTemplates()
      fetchAllInvestigations()
    }
  }, [showDetailView, selectedPatient])

  useEffect(() => {
    console.log("All investigations loaded:", allInvestigations.length)
    if (allInvestigations.length > 0) {
      extractInvestigationTypes(allInvestigations)
    }
  }, [allInvestigations])

  useEffect(() => {
    console.log("Investigation types updated:", investigationTypes)
    if (investigationTypes.length > 0) {
      // FORCE SELECT LABORATORY
      const labType = investigationTypes.find(type =>
        type.name.toLowerCase().includes('laboratory') ||
        type.name.toLowerCase().includes('lab')
      )

      if (labType && investigationType !== labType.value) {
        console.log("Setting default to Laboratory:", labType)
        setInvestigationType(labType.value)
      } else if (investigationTypes.length > 0 && !investigationType) {
        console.log("Setting to first type:", investigationTypes[0])
        setInvestigationType(investigationTypes[0].value)
      }
    }
  }, [investigationTypes])

  useEffect(() => {
    console.log("Investigation type changed to:", investigationType)
    filterInvestigationsByMainChargeCode()
  }, [investigationType])

  const handleFilterChange = (field, value) => {
    setSearchFilters((prev) => ({
      ...prev,
      [field]: value,
    }))
    setCurrentPage(1)
  }

  const handleSearch = () => {
    console.log("Searching with filters:", searchFilters)
  }

  const handleReset = () => {
    setSearchFilters({
      doctorList: "Dr. G. Pradhan",
      session: "Select",
      employeeNo: "",
      patientName: "",
    })
    setCurrentPage(1)
  }

  const handleRowClick = (patient) => {
    setSelectedPatient(patient)
    setShowDetailView(true)
  }

  const handleBackToList = () => {
    setShowDetailView(false)
    setSelectedPatient(null)
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
    })
    setSelectedHistoryType("")
    // Clear templates when going back to list
    setSelectedTemplateIds(new Set())
  }

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const handleSubmit = () => {
    console.log("Form submitted")
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

  const handleRelease = (patientId) => {
    const updatedList = waitingList.map((patient) =>
      patient.id === patientId ? { ...patient, status: "released" } : patient,
    )
    setWaitingList(updatedList)
  }

  const handleClose = (patientId) => {
    const updatedList = waitingList.filter((patient) => patient.id !== patientId)
    setWaitingList(updatedList)
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
    const newItems = [...diagnosisItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setDiagnosisItems(newItems)
  }

  const handleAddTreatmentItem = () => {
    setTreatmentItems([
      ...treatmentItems,
      {
        drugName: "",
        dispUnit: "Tab",
        dosage: "",
        frequency: "OD",
        days: "",
        total: "",
        instruction: "",
        stock: "",
      },
    ])
  }

  const handleRemoveTreatmentItem = (index) => {
    if (treatmentItems.length === 1) return
    const newItems = treatmentItems.filter((_, i) => i !== index)
    setTreatmentItems(newItems)
  }

  const handleTreatmentChange = (index, field, value) => {
    const newItems = [...treatmentItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setTreatmentItems(newItems)
  }

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

  const filteredList = waitingList.filter((item) => {
    const matchesEmployee = searchFilters.employeeNo === "" || item.employeeNo.includes(searchFilters.employeeNo)
    const matchesPatient =
      searchFilters.patientName === "" ||
      item.patientName.toLowerCase().includes(searchFilters.patientName.toLowerCase())
    return matchesEmployee && matchesPatient && item.status === "waiting"
  })

  const filteredTotalPages = Math.ceil(filteredList.length / itemsPerPage)
  const currentItems = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
      setCurrentPage(pageNumber)
    }
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
                          <input type="text" id="age" name="age" className="form-control" placeholder="Enter Age" readOnly />
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
                                name="FamilyHistory"
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
                <div className="card mb-3">
                  <div
                    className="card-header py-3 bg-light border-bottom-1 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection("diagnosis")}
                  >
                    <h6 className="mb-0 fw-bold">Diagnosis</h6>
                    <span style={{ fontSize: "18px" }}>{expandedSections.diagnosis ? "−" : "+"}</span>
                  </div>
                  {expandedSections.diagnosis && (
                    <div className="card-body">
                      <div className="mb-3">
                        <label className="form-label fw-bold">Working Diagnosis</label>
                        <input
                          type="text"
                          className="form-control"
                          style={{ width: "200px" }}
                          value={workingDiagnosis}
                          onChange={(e) => setWorkingDiagnosis(e.target.value)}
                          placeholder="Enter working diagnosis"
                        />
                      </div>

                      <div className="table-responsive">
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
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={item.icdDiagnosis}
                                    onChange={(e) => handleDiagnosisChange(index, "icdDiagnosis", e.target.value)}
                                    placeholder="Enter ICD diagnosis"
                                  />
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
                                    Clear All
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
                                        console.log("Radio button selected:", e.target.value)
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
                    <span style={{ fontSize: "18px" }}>{expandedSections.treatment ? "−" : "+"}</span>
                  </div>
                  {expandedSections.treatment && (
                    <div className="card-body">
                      <div className="row g-3 mb-3">
                        <div className="col-md-4">
                          <label className="form-label fw-bold">Template</label>
                          <select
                            className="form-select"
                            value={selectedBloodTestTemplate}
                            onChange={(e) => setSelectedBloodTestTemplate(e.target.value)}
                          >
                            <option value="Select..">Select..</option>
                            <option value="Blood Test Template">Blood Test Template</option>
                          </select>
                        </div>
                        <div className="col-md-8 d-flex align-items-end gap-2">
                          <button
                            className="btn btn-primary"
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
                          <button className="btn btn-primary" onClick={handleOpenCurrentMedicationModal}>
                            Current Medication
                          </button>
                        </div>
                      </div>

                      <div className="table-responsive">
                        <table className="table table-bordered">
                          <thead style={{ backgroundColor: "#b0c4de" }}>
                            <tr>
                              <th style={{ minWidth: 370 }}>Drugs Name/Drugs Code</th>
                              <th className="text-center" style={{ minWidth: 100, maxWidth: 140 }}>
                                Disp. Unit
                              </th>
                              <th className="text-center" style={{ minWidth: 50, maxWidth: 80 }}>
                                Dosage
                              </th>
                              <th className="text-center" style={{ minWidth: 120, maxWidth: 180 }}>
                                Frequency
                              </th>
                              <th className="text-center" style={{ minWidth: 80, maxWidth: 100 }}>
                                Days
                              </th>
                              <th className="text-center" style={{ minWidth: 80, maxWidth: 100 }}>
                                Total
                              </th>
                              <th className="text-center" style={{ minWidth: 10 }}>
                                Instruction
                              </th>
                              <th className="text-center" style={{ minWidth: 10 }}>
                                Add
                              </th>
                              <th className="text-center" style={{ minWidth: 10 }}>
                                Delete
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {treatmentItems.map((row, index) => (
                              <tr key={index}>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control"
                                    style={{ fontSize: "1.125rem" }}
                                    value={row.drugName}
                                    onChange={(e) => handleTreatmentChange(index, "drugName", e.target.value)}
                                    placeholder="Enter drug name or code"
                                  />
                                </td>
                                <td>
                                  <select
                                    className="form-select"
                                    style={{ fontSize: "1.05rem" }}
                                    value={row.dispUnit}
                                    onChange={(e) => handleTreatmentChange(index, "dispUnit", e.target.value)}
                                  >
                                    <option value="Tab">Tab</option>
                                    <option value="Cap">Cap</option>
                                    <option value="Syr">Syr</option>
                                  </select>
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control"
                                    style={{ fontSize: "0.75rem" }}
                                    value={row.dosage}
                                    onChange={(e) => handleTreatmentChange(index, "dosage", e.target.value)}
                                    placeholder="1"
                                  />
                                </td>
                                <td>
                                  <select
                                    className="form-select"
                                    style={{ fontSize: "1.125rem" }}
                                    value={row.frequency}
                                    onChange={(e) => handleTreatmentChange(index, "frequency", e.target.value)}
                                  >
                                    <option value="OD">OD</option>
                                    <option value="BID">BID</option>
                                    <option value="TID">TID</option>
                                    <option value="QID">QID</option>
                                    <option value="HS">HS</option>
                                    <option value="SOS">SOS</option>
                                  </select>
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control"
                                    style={{ fontSize: "0.875rem" }}
                                    value={row.days}
                                    onChange={(e) => handleTreatmentChange(index, "days", e.target.value)}
                                    placeholder="0"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control"
                                    style={{ fontSize: "0.875rem" }}
                                    value={row.total}
                                    onChange={(e) => handleTreatmentChange(index, "total", e.target.value)}
                                    placeholder="0"
                                  />
                                </td>
                                <td>
                                  <select
                                    className="form-select"
                                    value={row.instruction}
                                    onChange={(e) => handleTreatmentChange(index, "instruction", e.target.value)}
                                  >
                                    <option value="">Select...</option>
                                    <option value="After Meal">After Meal</option>
                                    <option value="Before Meal">Before Meal</option>
                                  </select>
                                </td>

                                <td className="text-center">
                                  <button className="btn btn-sm btn-success" onClick={handleAddTreatmentItem}>
                                    +
                                  </button>
                                </td>
                                <td className="text-center">
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

                {["referral", "followUp", "doctorRemark"].map((section) => (
                  <div key={section} className="card mb-3">
                    <div
                      className="card-header py-3 bg-light border-bottom-1 d-flex justify-content-between align-items-center"
                      style={{ cursor: "pointer" }}
                      onClick={() => toggleSection(section)}
                    >
                      <h6 className="mb-0 fw-bold">
                        {section.charAt(0).toUpperCase() + section.slice(1).replace(/([A-Z])/g, " $1")}
                      </h6>
                      <span style={{ fontSize: "18px" }}>{expandedSections[section] ? "−" : "+"}</span>
                    </div>
                    {expandedSections[section] && (
                      <div className="card-body">
                        <p>Content for {section} section will be implemented here.</p>
                      </div>
                    )}
                  </div>
                ))}

                <div className="text-center mt-4">
                  <button className="btn btn-primary me-3" onClick={handleSubmit}>
                    <i className="mdi mdi-content-save"></i> SUBMIT
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
            console.log("Template saved:", template)
            fetchInvestigationTemplates()
          }}
        />

        <TreatmentModal
          show={showTreatmentModal}
          onClose={handleCloseTreatmentModal}
          templateType={treatmentModalType}
          onTemplateSaved={(template) => {
            console.log("Treatment template saved:", template)
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

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">GENERAL MEDICINE WAITING LIST</h4>
                <div className="d-flex gap-2">
                  <button className="btn btn-primary">OPEN TOKEN DISPLAY</button>
                  <button className="btn btn-secondary btn-sm">CLOSE TOKEN DISPLAY</button>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="card mb-3">
                <div className="card-body">
                  <div className="row g-3 align-items-end">
                    <div className="col-md-2">
                      <label className="form-label fw-bold">Doctor List</label>
                      <select
                        className="form-select"
                        value={searchFilters.doctorList}
                        onChange={(e) => handleFilterChange("doctorList", e.target.value)}
                      >
                        <option value="Dr. G. Pradhan">Dr. G. Pradhan</option>
                        <option value="Dr. Smith">Dr. Smith</option>
                        <option value="Dr. Johnson">Dr. Johnson</option>
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="form-label fw-bold">Session</label>
                      <select
                        className="form-select"
                        value={searchFilters.session}
                        onChange={(e) => handleFilterChange("session", e.target.value)}
                      >
                        <option value="Select">Select</option>
                        <option value="Morning">Morning</option>
                        <option value="Evening">Evening</option>
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="form-label fw-bold">Employee No.</label>
                      <input
                        type="text"
                        className="form-control"
                        value={searchFilters.employeeNo}
                        onChange={(e) => handleFilterChange("employeeNo", e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold">Patient Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={searchFilters.patientName}
                        onChange={(e) => handleFilterChange("patientName", e.target.value)}
                      />
                    </div>
                    <div className="col-md-3 d-flex gap-2">
                      <button type="button" className="btn btn-primary" onClick={handleSearch}>
                        SEARCH
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleReset}>
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
                      <th>Token No.</th>
                      <th>Employee No.</th>
                      <th>Patient Name</th>
                      <th>Relation</th>
                      <th>Designation</th>
                      <th>Name</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>OPD Type</th>
                      <th>Action</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item) => (
                      <tr key={item.id} onClick={() => handleRowClick(item)} style={{ cursor: "pointer" }}>
                        <td>
                          <span className={`badge ${getPriorityColor(item.priority)}`}>{item.tokenNo}</span>
                        </td>
                        <td>{item.employeeNo}</td>
                        <td>{item.patientName}</td>
                        <td>{item.relation}</td>
                        <td>{item.designation}</td>
                        <td>{item.name}</td>
                        <td>{item.age}</td>
                        <td>{item.gender}</td>
                        <td>{item.opdType}</td>
                        <td>
                          <button className="btn btn-primary btn-sm" onClick={() => handleRelease(item.id)}>
                            RELEASE
                          </button>
                        </td>
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => handleClose(item.id)}>
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
                    Page {currentPage} of {filteredTotalPages} | Total Records: {filteredList.length}
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

export default GeneralMedicineWaitingList

