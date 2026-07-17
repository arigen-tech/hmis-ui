import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Popup from "../../../Components/popup";
import { getRequest, postRequest, postRequestWithFormData } from "../../../service/apiService";
import { PATIENT_FOLLOW_UP_DETAILS, MAS_COUNTRY, MAS_STATE, MAS_DISTRICT, ALL_RELATION, MAS_BLOODGROUP, MAS_WARD_CATEGORY_GET_ALL, MAS_WARDS_GET_BY_ID, MAS_BED_COUNT, MAS_ADMISSION_CATEGORY_GET_ALL, MAS_ADMISSION_TYPE_GET_ALL, MAS_ADMISSION_SOURCE_GET_ALL, MAS_PATIENT_CONDITION_GET_ALL, GET_WARD_BY_CATEGORY, GET_ROOM_BY_WARD, GET_BED_BY_ROOM, GET_ALL_ACT_MAS_DEPT_FOR_DROPDOWN_END_URL, REQUEST_PARAM_DEPARTMENT_TYPE_CODE, SAVE_IPD_PATIENT_DETAILS, DOCTOR_BY_SPECIALITY, MAS_DIET_PREFERENCE_GET_ALL } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading";

const InpatientAdmission = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientId } = useParams();
  
  // Get patient data from navigation state
  const patientData = location.state?.patientData || null;
  
  // Main state
  const [formData, setFormData] = useState({
    // Patient Details 
    patientName: "Rajeev",
    patientId: "",
    visitId: "",
    uhid: "",
    mobileNo: "7777777777",
    age: "33",
    gender: "M",
    maritalStatus: "",
    nationality: "",
    dietPreference: "",
    allergies: "",
    bloodGroup: "",
    address: "",
    
    // NEW: Patient Address Section (from image)
    patientAddress1: "",
    patientAddress2: "",
    patientCountry: "",
    patientState: "",
    patientDistrict: "",
    patientCity: "",
    patientPinCode: "",
    
    // Admission Details - UPDATED
    admissionDate: "",
    admissionTime: "",
    admissionDateTime: "",
    admissionCategory: "",
    admissionType: "",
    admissionSource: "",
    patientCondition: "",
    admissionCareType: "",
    admissionAdvisedFrom: "",
    admissionRemarks: "",
    expectedStay: "",
    
    // Ward/Bed Details
    wardCategory: "",
    wardId: "",
    wardName: "",
    roomId: "",
    roomNumber: "",
    bedId: "",
    bedNumber: "",
    
    // Doctor & Diagnosis
    admittingDoctorId: "",
    admittingDoctorName: "",
    department: "",
    provisionalDiagnosis: "",
    workingDiagnosis: "",
    
    // NOK Details (Next of Kin)
    nokFirstName: "",
    nokMiddleName: "",
    nokLastName: "",
    nokEmail: "",
    nokMobile: "",
    nokAddress1: "",
    nokAddress2: "",
    nokCountry: "",
    nokState: "",
    nokDistrict: "",
    nokCity: "",
    nokPinCode: "",
    nokRelation: "",
    
    // Emergency Contact
    emergencyFirstName: "",
    emergencyLastName: "",
    emergencyMobile: "",
    emergencyRelation: "",
    
    // Consent & Legal
    consentGiven: false,
    consentType: "General",
    consentDate: "",
    legalGuardian: "",
    
    // NEW: Enhanced Consent & Legal Section
    admissionConsentTaken: "No",
    consentTakenBy: "",
    mlcCase: "No",
    policeIntimationRequired: "No",
    
    // NEW: Financial Section - UPDATED to array structure
    financialDetails: [
      {
        id: 1,
        paymentType: "",
        advanceCollected: "No",
        advanceAmount: "",
        paymentMode: "",
       
      }
    ],
    
    // NEW: Document Upload
    documents: [
      {
        id: 1,
        docType: "",
        remarks: "",
        file: null,
        fileName: ""
      }
    ]
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [errors, setErrors] = useState({});
  
  // Dropdown data states
  const [wardCategories, setWardCategories] = useState([]);
  const [wards, setWards] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [relationData, setRelationData] = useState([]);
  const [bloodGroupData, setBloodGroupData] = useState([]);
  const [bedStats, setBedStats] = useState(null);
  const [nokStateData, setNokStateData] = useState([]);
  const [nokDistrictData, setNokDistrictData] = useState([]);
  
  // NEW: Patient Address dropdown data
  const [patientStateData, setPatientStateData] = useState([]);
  const [patientDistrictData, setPatientDistrictData] = useState([]);
  const [dietPreferenceData, setDietPreferenceData] = useState([]);
  
  // Master data states - NEW
  const [admissionCategories, setAdmissionCategories] = useState([]);
  const [admissionTypes, setAdmissionTypes] = useState([]);
  const [patientConditions, setPatientConditions] = useState([]);
  const [admissionCareTypes, setAdmissionCareTypes] = useState([]);
  const [admissionSources, setAdmissionSources] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // NEW: Document Type Master Data
  const [documentTypes, setDocumentTypes] = useState([
    { id: 1, docTypeName: "Admission Consent Form", status: "Active" },
    { id: 2, docTypeName: "ID Proof (Aadhar)", status: "Active" },
    { id: 3, docTypeName: "ID Proof (PAN)", status: "Active" },
    { id: 4, docTypeName: "ID Proof (Passport)", status: "Active" },
    { id: 5, docTypeName: "ID Proof (Driving License)", status: "Active" },
    { id: 6, docTypeName: "Insurance Card", status: "Active" },
    { id: 7, docTypeName: "Insurance Pre-Authorization", status: "Active" },
    { id: 8, docTypeName: "Medical Records", status: "Active" },
    { id: 9, docTypeName: "Referral Letter", status: "Active" },
    { id: 10, docTypeName: "Lab Reports", status: "Active" },
    { id: 11, docTypeName: "Photo", status: "Active" },
    { id: 12, docTypeName: "Other", status: "Active" },
  ]);
  
  // Dropdown options
  const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];
  const maritalStatusOptions = ["Single", "Married", "Divorced", "Widowed", "Separated"];
  const nationalityOptions = ["Indian", "Other"];
  const consentTypeOptions = ["General", "Surgical", "Anesthesia", "Blood", "Other"];
  const relationOptions = ["Father", "Mother", "Spouse", "Son", "Daughter", "Brother", "Sister", "Other"];
  
  // NEW: Dropdown options for new sections
  const yesNoOptions = ["Yes", "No"];
  const consentTakenByOptions = ["Nurse Anita", "Nurse Priya", "Doctor", "Reception", "Other Staff"];
  const paymentTypeOptions = ["Self", "Insurance", "Corporate", "Government", "Other"];
  const paymentModeOptions = ["Cash", "UPI", "Card", "Cheque", "Net Banking", "Wallet"];

  // Initialize with patient data
  const fetchPatientData = async (id) => {
    try {
      setLoading(true);
      const response = await getRequest(`${PATIENT_FOLLOW_UP_DETAILS}/${id}`);
      if (response && response.response) {
        const data = response.response;

        const pCountry = data.address?.country;
        const nCountry = data.nok?.country;
        
        if (pCountry && pCountry === nCountry) {
          getRequest(`${MAS_STATE}/getByCountryId/${pCountry}`).then(res => {
            if (res?.response) {
              setPatientStateData(res.response);
              setNokStateData(res.response);
            }
          });
        } else {
          if (pCountry) fetchPatientStates(pCountry);
          if (nCountry) fetchNokStates(nCountry);
        }

        const pState = data.address?.state;
        const nState = data.nok?.state;
        
        if (pState && pState === nState) {
          getRequest(`${MAS_DISTRICT}/getByState/${pState}`).then(res => {
            if (res?.response) {
              setPatientDistrictData(res.response);
              setNokDistrictData(res.response);
            }
          });
        } else {
          if (pState) fetchPatientDistrict(pState);
          if (nState) fetchNokDistrict(nState);
        }
        setFormData(prev => ({
          ...prev,
          visitId: patientData?.visitId || patientData?.opdPatientDetailsId || null,
          patientName: [data.personal?.firstName, data.personal?.middleName, data.personal?.lastName].filter(Boolean).join(" ") || prev.patientName,
          patientId: data.patientId || prev.patientId,
          uhid: data.uhid || `UHID-${String(data.patientId).padStart(6, '0')}`,
          mobileNo: data.personal?.mobileNo || prev.mobileNo,
          age: data.personal?.age || prev.age,
          gender: data.personal?.genderName || (data.personal?.gender === 29 ? "Male" : data.personal?.gender === 30 ? "Female" : "Other") || prev.gender,
          dietPreference: data.personal?.dietPreferenceId || data.personal?.dietPreference || prev.dietPreference,

          patientAddress1: data.address?.address1 || prev.patientAddress1,
          patientAddress2: data.address?.address2 || prev.patientAddress2,
          patientCountry: data.address?.country || prev.patientCountry,
          patientState: data.address?.state || prev.patientState,
          patientDistrict: data.address?.district || prev.patientDistrict,
          patientCity: data.address?.city || prev.patientCity,
          patientPinCode: data.address?.pinCode || prev.patientPinCode,

          nokFirstName: data.nok?.firstName || prev.nokFirstName,
          nokMiddleName: data.nok?.middleName || prev.nokMiddleName,
          nokLastName: data.nok?.lastName || prev.nokLastName,
          nokEmail: data.nok?.email || prev.nokEmail,
          nokMobile: data.nok?.mobileNo || prev.nokMobile,
          nokAddress1: data.nok?.address1 || prev.nokAddress1,
          nokAddress2: data.nok?.address2 || prev.nokAddress2,
          nokCountry: data.nok?.country || prev.nokCountry,
          nokState: data.nok?.state || prev.nokState,
          nokDistrict: data.nok?.district || prev.nokDistrict,
          nokCity: data.nok?.city || prev.nokCity,
          nokPinCode: data.nok?.pinCode || prev.nokPinCode,
          nokRelation: data.nok?.relation || prev.nokRelation,

          emergencyFirstName: data.emergency?.firstName || prev.emergencyFirstName,
          emergencyLastName: data.emergency?.lastName || prev.emergencyLastName,
          emergencyMobile: data.emergency?.mobileNo || prev.emergencyMobile,
        }));
      }
    } catch (error) {
      console.error("Error fetching patient data:", error);
      showPopup("Failed to load patient data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Initialize with patient data
  useEffect(() => {
    const idToFetch = patientData?.patientId || patientData?.id || patientData?.opdPatientDetailsId || patientId;
    if (idToFetch) {
      fetchPatientData(idToFetch);
    } else if (patientData) {
      // Auto-populate patient details if no ID to fetch
      setFormData(prev => ({
        ...prev,
        patientName: patientData.patientName || prev.patientName,
        patientId: patientData.id || prev.patientId,
        uhid: patientData.uhid || `UHID-${String(patientData.id).padStart(6, '0')}`,
        mobileNo: patientData.mobileNo || prev.mobileNo,
        age: patientData.age || prev.age,
        gender: patientData.gender || prev.gender,
        admissionAdvisedFrom: patientData.department || prev.admissionAdvisedFrom,
        admissionType: patientData.admissionType || prev.admissionType,
        admissionSource: patientData.admissionSource || prev.admissionSource,
        // Optionally map care level if it matches one of the care type options
        admissionCareType: patientData.careLevel === "General" ? "General" :
          patientData.careLevel === "Critical" ? "HDU" :
            patientData.careLevel === "ICU" ? "ICU" : prev.admissionCareType,
        // Add more auto-population as needed
        dietPreference: patientData.dietPreferenceId || patientData.dietPreference || prev.dietPreference,
      }));
    }
    
    // Set default dates
    const today = new Date();
    const formattedDate = formatDateForDisplay(today);
    const formattedTime = today.toTimeString().split(' ')[0].substring(0, 5);
    const ampm = today.getHours() >= 12 ? 'PM' : 'AM';
    const hours12 = today.getHours() % 12 || 12;
    const formattedDateTime = `${formattedDate} ${hours12}:${today.getMinutes().toString().padStart(2, '0')} ${ampm}`;
    
    // Set transaction date for financial details
    const todayISO = today.toISOString().split('T')[0];
    
    setFormData(prev => ({
      ...prev,
      visitId: patientData?.visitId || patientData?.opdPatientDetailsId || null,
      admissionDate: todayISO,
      admissionTime: formattedTime,
      admissionDateTime: formattedDateTime,
      consentDate: todayISO,
      financialDetails: prev.financialDetails.map(item => ({
        ...item,
        transactionDate: todayISO
      }))
    }));
    
    // Fetch all dropdown data
    fetchDropdownData();
    fetchMasterData(); // NEW: Fetch master data
    fetchCountryData();
    fetchRelationData();
    fetchBloodGroupData();
    fetchWardCategories();
  }, [patientId, patientData]);
  
  // Format date as "16-Aug-2025"
  const formatDateForDisplay = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };
  
  // Format time as "08:10 AM"
  const formatTimeForDisplay = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  // fetchPatientData is defined above

  // NEW: Fetch master data
  const fetchMasterData = async () => {
    try {
      const response = await getRequest(MAS_ADMISSION_CATEGORY_GET_ALL);
      if (response && response.response) {
        setAdmissionCategories(response.response);
      }
      
      const typeResponse = await getRequest(MAS_ADMISSION_TYPE_GET_ALL);
      if (typeResponse && typeResponse.response) {
        setAdmissionTypes(typeResponse.response);
      }
      
      const sourceResponse = await getRequest(MAS_ADMISSION_SOURCE_GET_ALL);
      if (sourceResponse && sourceResponse.response) {
        setAdmissionSources(sourceResponse.response);
      }
      
      const conditionResponse = await getRequest(MAS_PATIENT_CONDITION_GET_ALL);
      if (conditionResponse && conditionResponse.response) {
        setPatientConditions(conditionResponse.response);
      }
      
      const deptResponse = await getRequest(`${GET_ALL_ACT_MAS_DEPT_FOR_DROPDOWN_END_URL}?${REQUEST_PARAM_DEPARTMENT_TYPE_CODE}=WARD`);
      if (deptResponse && deptResponse.response) {
        setDepartments(deptResponse.response);
      }
      
      const dietResponse = await getRequest(MAS_DIET_PREFERENCE_GET_ALL);
      if (dietResponse && dietResponse.response) {
        setDietPreferenceData(dietResponse.response);
      }
      
      setAdmissionCareTypes([
        { id: 1, careLevelName: "General", status: "Active" },
        { id: 2, careLevelName: "ICU", status: "Active" },
        { id: 3, careLevelName: "HDU", status: "Active" },
        { id: 4, careLevelName: "Isolation", status: "Active" },
      ]);
      
    } catch (error) {
      console.error("Error fetching master data:", error);
    }
  };
  
  const fetchDropdownData = async () => {
    try {
      // Dropdown data fetches
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };
  
  const fetchCountryData = async () => {
    try {
      const response = await getRequest(`${MAS_COUNTRY}/getAll/1`);
      if (response && response.response) {
        setCountryData(response.response);
      }
    } catch (error) {
      console.error("Error fetching country data:", error);
    }
  };

  const fetchRelationData = async () => {
    try {
      const response = await getRequest(`${ALL_RELATION}/1`);
      if (response && response.response) {
        setRelationData(response.response);
      }
    } catch (error) {
      console.error("Error fetching relation data:", error);
    }
  };

  const fetchBloodGroupData = async () => {
    try {
      const response = await getRequest(`${MAS_BLOODGROUP}/getAll/1`);
      if (response && response.response) {
        setBloodGroupData(response.response);
      }
    } catch (error) {
      console.error("Error fetching blood group data:", error);
    }
  };

  const fetchWardCategories = async () => {
    try {
      const response = await getRequest(MAS_WARD_CATEGORY_GET_ALL);
      if (response && response.response) {
        setWardCategories(response.response);
      }
    } catch (error) {
      console.error("Error fetching ward categories:", error);
    }
  };
  
  // NEW: Fetch patient states
  const fetchPatientStates = async (countryId) => {
    try {
      if (countryId) {
        const response = await getRequest(`${MAS_STATE}/getByCountryId/${countryId}`);
        if (response && response.response) {
          setPatientStateData(response.response);
        } else {
          setPatientStateData([]);
        }
      } else {
        setPatientStateData([]);
      }
    } catch (error) {
      console.error("Error fetching patient states:", error);
    }
  };
  
  // NEW: Fetch patient districts
  const fetchPatientDistrict = async (stateId) => {
    try {
      if (stateId) {
        const response = await getRequest(`${MAS_DISTRICT}/getByState/${stateId}`);
        if (response && response.response) {
          setPatientDistrictData(response.response);
        } else {
          setPatientDistrictData([]);
        }
      } else {
        setPatientDistrictData([]);
      }
    } catch (error) {
      console.error("Error fetching patient districts:", error);
    }
  };
  
  const fetchNokStates = async (countryId) => {
    try {
      if (countryId) {
        const response = await getRequest(`${MAS_STATE}/getByCountryId/${countryId}`);
        if (response && response.response) {
          setNokStateData(response.response);
        } else {
          setNokStateData([]);
        }
      } else {
        setNokStateData([]);
      }
    } catch (error) {
      console.error("Error fetching states:", error);
    }
  };
  
  const fetchNokDistrict = async (stateId) => {
    try {
      if (stateId) {
        const response = await getRequest(`${MAS_DISTRICT}/getByState/${stateId}`);
        if (response && response.response) {
          setNokDistrictData(response.response);
        } else {
          setNokDistrictData([]);
        }
      } else {
        setNokDistrictData([]);
      }
    } catch (error) {
      console.error("Error fetching districts:", error);
    }
  };
  
  const fetchWardsByCategory = async (categoryId) => {
    try {
      if (!categoryId) {
        setWards([]);
        setRooms([]);
        setBeds([]);
        setFormData(prev => ({
          ...prev,
          wardId: "",
          wardName: "",
          roomId: "",
          roomNumber: "",
          bedId: "",
          bedNumber: "",
        }));
        return;
      }
      
      const response = await getRequest(`${GET_WARD_BY_CATEGORY}/${categoryId}`);
      if (response && response.response) {
        setWards(response.response);
      } else {
        setWards([]);
      }
      
      // Clear room and bed selections
      setRooms([]);
      setBeds([]);
      setFormData(prev => ({
        ...prev,
        wardId: "",
        wardName: "",
        roomId: "",
        roomNumber: "",
        bedId: "",
        bedNumber: "",
      }));
      
    } catch (error) {
      console.error("Error fetching wards:", error);
      setWards([]);
    }
  };
  
  const fetchBedCountByWard = async (wardId) => {
    try {
      if (!wardId) {
        setBedStats(null);
        return;
      }
      const response = await getRequest(`${MAS_BED_COUNT}/${wardId}`);
      if (response && response.response) {
        setBedStats(response.response);
      } else {
        setBedStats(null);
      }
    } catch (error) {
      console.error("Error fetching bed count:", error);
      setBedStats(null);
    }
  };
  
  const fetchRoomsByWard = async (wardId) => {
    try {
      if (!wardId) {
        setRooms([]);
      } else {
        const response = await getRequest(`${GET_ROOM_BY_WARD}/${wardId}`);
        if (response && response.response) {
          setRooms(response.response);
        } else {
          setRooms([]);
        }
      }
      
      // Clear bed selection
      setBeds([]);
      setFormData(prev => ({
        ...prev,
        roomId: "",
        roomNumber: "",
        bedId: "",
        bedNumber: "",
      }));
      
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setRooms([]);
    }
  };
  
  const fetchBedsByRoom = async (roomId) => {
    try {
      if (!roomId) {
        setBeds([]);
      } else {
        const response = await getRequest(`${GET_BED_BY_ROOM}/${roomId}`);
        if (response && response.response) {
          setBeds(response.response);
        } else {
          setBeds([]);
        }
      }
      
      // Clear bed selection
      setFormData(prev => ({
        ...prev,
        bedId: "",
        bedNumber: "",
      }));
      
    } catch (error) {
      console.error("Error fetching beds:", error);
      setBeds([]);
    }
  };
  
  // NEW: Handle document changes
  const handleDocumentChange = (index, field, value) => {
    setFormData(prev => {
      const newDocuments = [...prev.documents];
      newDocuments[index] = {
        ...newDocuments[index],
        [field]: value
      };
      return {
        ...prev,
        documents: newDocuments
      };
    });
  };
  
  // NEW: Add new document row
  const addDocumentRow = () => {
    setFormData(prev => ({
      ...prev,
      documents: [
        ...prev.documents,
        {
          id: prev.documents.length + 1,
          docType: "",
          remarks: "",
          file: null,
          fileName: ""
        }
      ]
    }));
  };
  
  // NEW: Remove document row
  const removeDocumentRow = (index) => {
    if (formData.documents.length > 1) {
      setFormData(prev => ({
        ...prev,
        documents: prev.documents.filter((_, i) => i !== index)
      }));
    }
  };
  
  // NEW: Handle file upload
  const handleFileUpload = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      handleDocumentChange(index, 'file', file);
      handleDocumentChange(index, 'fileName', file.name);
    }
  };
  
  // NEW: Handle financial details changes
  const handleFinancialChange = (index, field, value) => {
    setFormData(prev => {
      const newFinancialDetails = [...prev.financialDetails];
      newFinancialDetails[index] = {
        ...newFinancialDetails[index],
        [field]: value
      };
      
      // Clear advanceAmount and paymentMode if advanceCollected is "No"
      if (field === "advanceCollected" && value === "No") {
        newFinancialDetails[index].advanceAmount = "";
        newFinancialDetails[index].paymentMode = "";
      }
      
      return {
        ...prev,
        financialDetails: newFinancialDetails
      };
    });
    
    // Clear error for this field
    if (errors[`financial_${index}_${field}`]) {
      setErrors(prev => ({
        ...prev,
        [`financial_${index}_${field}`]: "",
      }));
    }
  };
  
  // NEW: Add new financial details row
  const addFinancialRow = () => {
    setFormData(prev => ({
      ...prev,
      financialDetails: [
        ...prev.financialDetails,
        {
          id: prev.financialDetails.length + 1,
          paymentType: "",
          advanceCollected: "No",
          advanceAmount: "",
          paymentMode: "",
        }
      ]
    }));
  };
  
  // NEW: Remove financial details row
  const removeFinancialRow = (index) => {
    if (formData.financialDetails.length > 1) {
      setFormData(prev => ({
        ...prev,
        financialDetails: prev.financialDetails.filter((_, i) => i !== index)
      }));
    }
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
      
      // Update admissionDateTime when date or time changes
      if (name === "admissionDate" || name === "admissionTime") {
        if (updated.admissionDate && updated.admissionTime) {
          const date = new Date(updated.admissionDate);
          const [hours, minutes] = updated.admissionTime.split(':');
          date.setHours(parseInt(hours), parseInt(minutes));
          updated.admissionDateTime = formatDateForDisplay(date) + " " + formatTimeForDisplay(updated.admissionTime);
        }
      }
      
      // Clear consentTakenBy if admissionConsentTaken is "No"
      if (name === "admissionConsentTaken" && value === "No") {
        updated.consentTakenBy = "";
      }
      
      return updated;
    });
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: "",
      }));
    }
  };
  
  const handleWardCategoryChange = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      wardCategory: categoryId,
      wardId: "",
      wardName: "",
      roomId: "",
      roomNumber: "",
      bedId: "",
      bedNumber: "",
    }));
    
    setBedStats(null);
    fetchWardsByCategory(categoryId);
  };
  
  const handleWardChange = (wardId) => {
    const selectedWard = wards.find(w => w.id == wardId || w.wardId == wardId);
    setFormData(prev => ({
      ...prev,
      wardId: wardId,
      wardName: selectedWard?.wardName || "",
      roomId: "",
      roomNumber: "",
      bedId: "",
      bedNumber: "",
    }));
    
    fetchRoomsByWard(wardId);
    fetchBedCountByWard(wardId);
  };
  
  const handleRoomChange = (roomId) => {
    const selectedRoom = rooms.find(r => r.id == roomId || r.roomId == roomId);
    setFormData(prev => ({
      ...prev,
      roomId: roomId,
      roomNumber: selectedRoom?.roomName || selectedRoom?.roomNumber || "",
      bedId: "",
      bedNumber: "",
    }));
    
    fetchBedsByRoom(roomId);
  };
  
  const handleBedChange = (bedId) => {
    const selectedBed = beds.find(b => b.id == bedId || b.bedId == bedId);
    setFormData(prev => ({
      ...prev,
      bedId: bedId,
      bedNumber: selectedBed?.bedName || selectedBed?.bedNumber || "",
    }));
  };
  
  const handleDepartmentChange = async (deptId) => {
    const selectedDept = departments.find(d => d.id == deptId);
    
    setFormData(prev => ({
      ...prev,
      department: selectedDept ? selectedDept.departmentName : "",
      admittingDoctorId: "",
      admittingDoctorName: ""
    }));

    if (errors.department) {
      setErrors(prev => ({ ...prev, department: "" }));
    }
    if (errors.admittingDoctorId) {
      setErrors(prev => ({ ...prev, admittingDoctorId: "" }));
    }

    if (deptId) {
      try {
        const response = await getRequest(`${DOCTOR_BY_SPECIALITY}${deptId}`);
        if (response && response.response) {
          setDoctors(response.response);
        } else {
          setDoctors([]);
        }
      } catch (error) {
        console.error("Error fetching doctors by speciality:", error);
        setDoctors([]);
      }
    } else {
      setDoctors([]);
    }
  };

  const handleDoctorSelect = (doctorId) => {
    const selectedDoctor = doctors.find(d => (d.userId == doctorId || d.id == doctorId));
    const docName = selectedDoctor
      ? (selectedDoctor.firstName ? [selectedDoctor.firstName, selectedDoctor.middleName, selectedDoctor.lastName].filter(Boolean).join(" ") : selectedDoctor.name)
      : "";
    setFormData(prev => ({
      ...prev,
      admittingDoctorId: doctorId,
      admittingDoctorName: docName,
    }));

    if (errors.admittingDoctorId) {
      setErrors(prev => ({ ...prev, admittingDoctorId: "" }));
    }
  };
  
  const showPopup = (message, type = "info", callback = null) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
        if (callback) callback();
      },
    });
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields validation
    if (!formData.admissionCategory) newErrors.admissionCategory = "Admission Category is required";
    if (!formData.admissionType) newErrors.admissionType = "Admission Type is required";
    if (!formData.admissionSource) newErrors.admissionSource = "Admission Source is required";
    if (!formData.patientCondition) newErrors.patientCondition = "Patient Condition is required";
    if (!formData.admissionCareType) newErrors.admissionCareType = "Admission Care Type is required";
    if (!formData.admissionDate) newErrors.admissionDate = "Admission Date is required";
    if (!formData.wardCategory) newErrors.wardCategory = "Ward Category is required";
    if (!formData.wardId) newErrors.wardId = "Ward selection is required";
    if (!formData.roomId) newErrors.roomId = "Room selection is required";
    if (!formData.bedId) newErrors.bedId = "Bed selection is required";
    if (!formData.department) newErrors.department = "Department is required";
    if (!formData.admittingDoctorId) newErrors.admittingDoctorId = "Admitting Doctor is required";
    if (!formData.provisionalDiagnosis) newErrors.provisionalDiagnosis = "Provisional Diagnosis is required";
    if (!formData.nokFirstName) newErrors.nokFirstName = "NOK First Name is required";
    
    // Validate new consent fields
    if (formData.admissionConsentTaken === "Yes" && !formData.consentTakenBy) {
      newErrors.consentTakenBy = "Consent taken by is required";
    }
    
    // Validate financial details
    formData.financialDetails.forEach((financial, index) => {
      // Validate advance amount if advance collected is Yes
      if (financial.advanceCollected === "Yes") {
        if (!financial.advanceAmount) {
          newErrors[`financial_${index}_advanceAmount`] = "Advance amount is required";
        } else if (isNaN(financial.advanceAmount) || Number(financial.advanceAmount) <= 0) {
          newErrors[`financial_${index}_advanceAmount`] = "Please enter a valid advance amount";
        }
        
        if (!financial.paymentMode) {
          newErrors[`financial_${index}_paymentMode`] = "Payment mode is required";
        }
      }
      
      // Validate transaction date if provided
      if (financial.transactionDate) {
        const transactionDate = new Date(financial.transactionDate);
        const today = new Date();
        if (transactionDate > today) {
          newErrors[`financial_${index}_transactionDate`] = "Transaction date cannot be in the future";
        }
      }
    });
    
    // Mobile number validation
    if (formData.nokMobile && !/^\d{10}$/.test(formData.nokMobile)) {
      newErrors.nokMobile = "Please enter a valid 10-digit mobile number";
    }
    
    if (formData.emergencyMobile && !/^\d{10}$/.test(formData.emergencyMobile)) {
      newErrors.emergencyMobile = "Please enter a valid 10-digit mobile number";
    }
    
    // Pin code validation for patient address
    if (formData.patientPinCode && !/^\d{6}$/.test(formData.patientPinCode)) {
      newErrors.patientPinCode = "Please enter a valid 6-digit pin code";
    }
    
    // Pin code validation for NOK
    if (formData.nokPinCode && !/^\d{6}$/.test(formData.nokPinCode)) {
      newErrors.nokPinCode = "Please enter a valid 6-digit pin code";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showPopup("Please correct the errors in the form", "error");
      return;
    }
    
    try {
      setSaving(true);
      
      // Prepare payload using FormData
      const formDataToSend = new FormData();

      formDataToSend.append("patientId", formData.patientId || "");
      
      if (formData.visitId === null || formData.visitId === undefined || formData.visitId === "") {
        formDataToSend.append("visitId", "");
      } else {
        formDataToSend.append("visitId", formData.visitId);
      }

      formDataToSend.append("admissionDate", formData.admissionDate || "");
      
      let admissionTime = formData.admissionTime || "";
      if (admissionTime && admissionTime.split(":").length === 2) {
        admissionTime += ":00";
      }
      formDataToSend.append("admissionTime", admissionTime);

      const admissionCategoryObj = admissionCategories.find(c => c.admissionCategoryName === formData.admissionCategory);
      formDataToSend.append("admissionCategoryId", admissionCategoryObj?.admissionCategoryId || admissionCategoryObj?.id || "");

      const admissionTypeObj = admissionTypes.find(t => t.admissionTypeName === formData.admissionType);
      formDataToSend.append("admissionTypeId", admissionTypeObj?.admissionTypeId || admissionTypeObj?.id || "");

      const admissionSourceObj = admissionSources.find(s => s.admissionSourceName === formData.admissionSource);
      formDataToSend.append("admissionSourceId", admissionSourceObj?.admissionSourceId || admissionSourceObj?.id || "");

      const patientConditionObj = patientConditions.find(c => c.patientConditionName === formData.patientCondition);
      formDataToSend.append("patientConditionId", patientConditionObj?.patientConditionId || "");

      const careLevelObj = admissionCareTypes.find(c => c.careLevelName === formData.admissionCareType);
      formDataToSend.append("careLevelId", careLevelObj?.id || "");

      formDataToSend.append("wardCategoryId", formData.wardCategory || "");
      formDataToSend.append("conditionNotes", formData.admissionRemarks || formData.provisionalDiagnosis || "");
      formDataToSend.append("admissionConsentTaken", formData.admissionConsentTaken === "Yes" ? "y" : "n");
      formDataToSend.append("consentTakenBy", formData.consentTakenBy || "");
      formDataToSend.append("mlcCase", formData.mlcCase === "Yes" ? "y" : "n");
      formDataToSend.append("policeIntimationRequired", formData.policeIntimationRequired === "Yes" ? "y" : "n");
      formDataToSend.append("admissionAdvisedFrom", formData.admissionAdvisedFrom || "");

      const nokName = [formData.nokFirstName, formData.nokMiddleName, formData.nokLastName].filter(Boolean).join(" ");
      formDataToSend.append("nokName", nokName);
      formDataToSend.append("nokRelationId", formData.nokRelation || "");
      formDataToSend.append("contactNo", formData.nokMobile || "");
      
      const addressLine = [formData.nokAddress1, formData.nokAddress2].filter(Boolean).join(", ");
      formDataToSend.append("addressLine", addressLine);
      formDataToSend.append("city", formData.nokCity || "");

      const selectedStateObj = nokStateData.find(s => s.id == formData.nokState);
      formDataToSend.append("state", selectedStateObj?.stateName || "");
      formDataToSend.append("pincode", formData.nokPinCode || "");

      formDataToSend.append("wardId", formData.wardId || "");
      formDataToSend.append("roomId", formData.roomId || "");
      formDataToSend.append("bedId", formData.bedId || "");

      const primaryFinancial = formData.financialDetails[0] || {};
      const paymentTypeMap = {
        "Self": "1",
        "Insurance": "2",
        "Corporate": "3",
        "Government": "4",
        "Other": "5"
      };
      formDataToSend.append("paymentType", paymentTypeMap[primaryFinancial.paymentType] || "");
      formDataToSend.append("advanceCollected", primaryFinancial.advanceCollected === "Yes" ? "1" : "0");
      formDataToSend.append("advanceAmount", primaryFinancial.advanceAmount || "");

      const paymentModeMap = {
        "Cash": "1",
        "UPI": "2",
        "Card": "3",
        "Cheque": "4",
        "Net Banking": "5",
        "Wallet": "6"
      };
      formDataToSend.append("paymentMode", paymentModeMap[primaryFinancial.paymentMode] || "");

      formDataToSend.append("patientName", formData.patientName || "");
      formDataToSend.append("uhid", formData.uhid || "");
      formDataToSend.append("dietPreferenceId", formData.dietPreference || "");

      const deptObj = departments.find(d => d.departmentName === formData.department);
      formDataToSend.append("departmentId", deptObj?.id || "");
      formDataToSend.append("treatingDoctor", formData.admittingDoctorId || "");
      formDataToSend.append("workingDiagnosis", formData.workingDiagnosis || formData.provisionalDiagnosis || "");

      // Append documents
      formData.documents.forEach((doc, idx) => {
        if (doc.docType) {
          formDataToSend.append(`documents[${idx}].documentType`, doc.docType);
        }
        if (doc.file) {
          formDataToSend.append(`documents[${idx}].ipDocumentUploads`, doc.file);
        }
      });
      
      // Submit to API
      const response = await postRequestWithFormData(SAVE_IPD_PATIENT_DETAILS, formDataToSend);
      
      if (response && response.status === 200 && response.message === "success") {
        showPopup(response.response || "IPD patient details saved successfully", "success", () => {
          navigate(-1); // Go back to patient list
        });
      } else {
        showPopup(response?.response || "Failed to admit patient. Please try again.", "error");
      }
      
    } catch (error) {
      console.error("Error admitting patient:", error);
      showPopup("Failed to admit patient. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };
  
  const handleCancel = () => {
    navigate(-1);
  };
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  return (
    <div className="content-wrapper">
      {/* Popup Component */}
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}
      
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            {/* Header Section */}
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2 mb-0">Inpatient Admission - Patient Details</h4>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="card-body">
                {/* Patient Details (Auto-populated) */}
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0 fw-bold">Patient Details</h5>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Patient Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.patientName}
                          readOnly
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Patient ID / UHID</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.uhid || `UHID-${String(formData.patientId).padStart(6, '0')}`}
                          readOnly
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Mobile No</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.mobileNo}
                          readOnly
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Age / Gender</label>
                        <input
                          type="text"
                          className="form-control"
                          value={`${formData.age} / ${formData.gender}`}
                          readOnly
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Marital Status</label>
                        <select
                          className="form-select"
                          name="maritalStatus"
                          value={formData.maritalStatus}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          {maritalStatusOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Nationality</label>
                        <select
                          className="form-select"
                          name="nationality"
                          value={formData.nationality}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          {nationalityOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Diet Preference</label>
                        <select
                          className="form-select"
                          name="dietPreference"
                          value={formData.dietPreference}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          {dietPreferenceData.map(diet => (
                            <option key={diet.dietPreferenceId} value={diet.dietPreferenceId}>{diet.preferenceName}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Allergies</label>
                        <input
                          type="text"
                          className="form-control"
                          name="allergies"
                          value={formData.allergies}
                          onChange={handleChange}
                          placeholder="Enter any allergies"
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Blood Group</label>
                        <select
                          className="form-select"
                          name="bloodGroup"
                          value={formData.bloodGroup}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          {bloodGroupData.map(bg => (
                            <option key={bg.bloodGroupId || bg.id} value={bg.bloodGroupId || bg.id}>{bg.bloodGroupName}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-12">
                        <label className="form-label fw-bold">Address</label>
                        <textarea
                          className="form-control"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          rows="3"
                          placeholder="Full address"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                 {/* Emergency Contact Details */}
                <div className="card mb-4">
                  <div className="card-header py-3 border-bottom-1">
                    <h6 className="mb-0 fw-bold">Emergency Contact Details</h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label">First Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter First Name"
                          name="emergencyFirstName"
                          value={formData.emergencyFirstName || ""}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Last Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter Last Name"
                          name="emergencyLastName"
                          value={formData.emergencyLastName || ""}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Relation</label>
                        <select
                          className="form-select"
                          name="emergencyRelation"
                          value={formData.emergencyRelation || ""}
                          onChange={handleChange}
                        >
                          <option value="">Select Relation</option>
                          {relationData.map((relation) => (
                            <option key={relation.id} value={relation.id}>
                              {relation.relationName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Mobile No.</label>
                        <input
                          type="text"
                          className={`form-control ${errors.emergencyMobile ? "is-invalid" : ""}`}
                          placeholder="Enter Mobile Number"
                          name="emergencyMobile"
                          value={formData.emergencyMobile || ""}
                          maxLength={10}
                          onChange={(e) => {
                            if (/^\d*$/.test(e.target.value)) {
                              handleChange(e);
                            }
                          }}
                        />
                        {errors.emergencyMobile && <div className="invalid-feedback">{errors.emergencyMobile}</div>}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* NEW: Patient Address Section */}
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0 fw-bold">Patient Address</h5>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-bold">Address 1</label>
                        <input
                          type="text"
                          className="form-control"
                          name="patientAddress1"
                          value={formData.patientAddress1}
                          onChange={handleChange}
                          placeholder="Enter Address 1"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold">Address 2</label>
                        <input
                          type="text"
                          className="form-control"
                          name="patientAddress2"
                          value={formData.patientAddress2}
                          onChange={handleChange}
                          placeholder="Enter Address 2"
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Country</label>
                        <select
                          className="form-select"
                          name="patientCountry"
                          value={formData.patientCountry}
                          onChange={(e) => {
                            handleChange(e);
                            fetchPatientStates(e.target.value);
                          }}
                        >
                          <option value="">Select Country</option>
                          {countryData.map((country) => (
                            <option key={country.id} value={country.id}>
                              {country.countryName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">State</label>
                        <select
                          className="form-select"
                          name="patientState"
                          value={formData.patientState}
                          onChange={(e) => {
                            handleChange(e);
                            fetchPatientDistrict(e.target.value);
                          }}
                        >
                          <option value="">Select State</option>
                          {patientStateData.map((state) => (
                            <option key={state.id} value={state.id}>
                              {state.stateName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">District</label>
                        <select
                          className="form-select"
                          name="patientDistrict"
                          value={formData.patientDistrict}
                          onChange={handleChange}
                        >
                          <option value="">Select District</option>
                          {patientDistrictData.map((district) => (
                            <option key={district.id} value={district.id}>
                              {district.districtName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">City</label>
                        <input
                          type="text"
                          className="form-control"
                          name="patientCity"
                          value={formData.patientCity}
                          onChange={handleChange}
                          placeholder="Enter City"
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Pin Code</label>
                        <input
                          type="text"
                          className={`form-control ${errors.patientPinCode ? "is-invalid" : ""}`}
                          name="patientPinCode"
                          value={formData.patientPinCode}
                          onChange={(e) => {
                            if (/^\d*$/.test(e.target.value)) {
                              handleChange(e);
                            }
                          }}
                          maxLength={6}
                          placeholder="Enter Pin Code"
                        />
                        {errors.patientPinCode && <div className="invalid-feedback">{errors.patientPinCode}</div>}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Admission Details - UPDATED */}
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0 fw-bold">Admission Details</h5>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      {/* Admission Date & Time Display */}
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Admission Date & Time</label>
                        <div className="input-group">
                          <input
                            type="date"
                            className={`form-control ${errors.admissionDate ? "is-invalid" : ""}`}
                            name="admissionDate"
                            value={formData.admissionDate}
                            onChange={handleChange}
                            required
                          />
                          <input
                            type="time"
                            className="form-control"
                            name="admissionTime"
                            value={formData.admissionTime}
                            onChange={handleChange}
                          />
                        </div>
                       
                        {errors.admissionDate && <div className="invalid-feedback d-block">{errors.admissionDate}</div>}
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Admission Category <span className="text-danger">*</span></label>
                        <select
                          className={`form-select ${errors.admissionCategory ? "is-invalid" : ""}`}
                          name="admissionCategory"
                          value={formData.admissionCategory}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Category</option>
                          {admissionCategories.map(category => (
                            <option key={category.admissionCategoryId || category.id} value={category.admissionCategoryName}>
                              {category.admissionCategoryName}
                            </option>
                          ))}
                        </select>
                        {errors.admissionCategory && <div className="invalid-feedback">{errors.admissionCategory}</div>}
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Admission Type <span className="text-danger">*</span></label>
                        <select
                          className={`form-select ${errors.admissionType ? "is-invalid" : ""}`}
                          name="admissionType"
                          value={formData.admissionType}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Type</option>
                          {admissionTypes.map(type => (
                            <option key={type.admissionTypeId || type.id} value={type.admissionTypeName}>
                              {type.admissionTypeName}
                            </option>
                          ))}
                        </select>
                        {errors.admissionType && <div className="invalid-feedback">{errors.admissionType}</div>}
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Admission Source <span className="text-danger">*</span></label>
                        <select
                          className={`form-select ${errors.admissionSource ? "is-invalid" : ""}`}
                          name="admissionSource"
                          value={formData.admissionSource}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Source</option>
                          {admissionSources.map(source => (
                            <option key={source.admissionSourceId || source.id} value={source.admissionSourceName}>
                              {source.admissionSourceName}
                            </option>
                          ))}
                        </select>
                        {errors.admissionSource && <div className="invalid-feedback">{errors.admissionSource}</div>}
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Patient Condition <span className="text-danger">*</span></label>
                        <select
                          className={`form-select ${errors.patientCondition ? "is-invalid" : ""}`}
                          name="patientCondition"
                          value={formData.patientCondition}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Condition</option>
                          {patientConditions.map(condition => (
                            <option key={condition.patientConditionId} value={condition.patientConditionName}>
                              {condition.patientConditionName}
                            </option>
                          ))}
                        </select>
                        {errors.patientCondition && <div className="invalid-feedback">{errors.patientCondition}</div>}
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Admission Care Type <span className="text-danger">*</span></label>
                        <select
                          className={`form-select ${errors.admissionCareType ? "is-invalid" : ""}`}
                          name="admissionCareType"
                          value={formData.admissionCareType}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Care Type</option>
                          {admissionCareTypes.map(careType => (
                            <option key={careType.id} value={careType.careLevelName}>
                              {careType.careLevelName}
                            </option>
                          ))}
                        </select>
                        {errors.admissionCareType && <div className="invalid-feedback">{errors.admissionCareType}</div>}
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Admission Advised From</label>
                        <input
                          type="text"
                          className="form-control"
                          name="admissionAdvisedFrom"
                          value={formData.admissionAdvisedFrom}
                          onChange={handleChange}
                          placeholder="e.g., OPD - Medicine"
                        />
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Expected Stay (Days)</label>
                        <input
                          type="number"
                          className="form-control"
                          name="expectedStay"
                          value={formData.expectedStay}
                          onChange={handleChange}
                          placeholder="e.g., 5"
                          min="1"
                        />
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Remarks</label>
                        <textarea
                          className="form-control"
                          name="admissionRemarks"
                          value={formData.admissionRemarks}
                          onChange={handleChange}
                          rows="1"
                          placeholder="Any additional remarks"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Ward / Bed Details */}
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0 fw-bold">Ward / Bed Details</h5>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Ward Category <span className="text-danger">*</span></label>
                        <select
                          className={`form-select ${errors.wardCategory ? "is-invalid" : ""}`}
                          value={formData.wardCategory}
                          onChange={(e) => handleWardCategoryChange(e.target.value)}
                          required
                        >
                          <option value="">Select Category</option>
                          {wardCategories.map(category => (
                            <option key={category.categoryId || category.id} value={category.categoryId || category.id}>
                              {category.categoryName}
                            </option>
                          ))}
                        </select>
                        {errors.wardCategory && <div className="invalid-feedback">{errors.wardCategory}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Ward <span className="text-danger">*</span></label>
                        <select
                          className={`form-select ${errors.wardId ? "is-invalid" : ""}`}
                          value={formData.wardId}
                          onChange={(e) => handleWardChange(e.target.value)}
                          required
                          disabled={!formData.wardCategory}
                        >
                          <option value="">Select Ward</option>
                          {wards.map(ward => (
                            <option key={ward.wardId || ward.id} value={ward.wardId || ward.id}>
                              {ward.wardName} ({ward.availableBed || ward.vacantBed || ward.vacant || 0} beds available)
                            </option>
                          ))}
                        </select>
                        {errors.wardId && <div className="invalid-feedback">{errors.wardId}</div>}
                        {bedStats && (
                          <div className="mt-1 small fw-bold">
                            <span className="me-2 text-success">Available: {bedStats.available || 0}</span>
                            <span className="me-2 text-danger">Occupied: {bedStats.occupied || 0}</span>
                            <span className="text-warning">Cleaning: {bedStats.cleaning || 0}</span>
                          </div>
                        )}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Room No <span className="text-danger">*</span></label>
                        <select
                          className={`form-select ${errors.roomId ? "is-invalid" : ""}`}
                          value={formData.roomId}
                          onChange={(e) => handleRoomChange(e.target.value)}
                          required
                          disabled={!formData.wardId}
                        >
                          <option value="">Select Room</option>
                          {rooms.map(room => (
                            <option key={room.roomId || room.id} value={room.roomId || room.id}>
                              {room.roomName || room.roomNumber} ({room.availableBed || room.vacantBed || room.vacant || 0} beds available)
                            </option>
                          ))}
                        </select>
                        {errors.roomId && <div className="invalid-feedback">{errors.roomId}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Bed No <span className="text-danger">*</span></label>
                        <select
                          className={`form-select ${errors.bedId ? "is-invalid" : ""}`}
                          value={formData.bedId}
                          onChange={(e) => handleBedChange(e.target.value)}
                          required
                          disabled={!formData.roomId}
                        >
                          <option value="">Select Bed</option>
                          {beds.map(bed => (
                            <option key={bed.bedId || bed.id} value={bed.bedId || bed.id}>
                              {bed.bedName || bed.bedNumber} {bed.status ? `(${bed.status})` : ''}
                            </option>
                          ))}
                        </select>
                        {errors.bedId && <div className="invalid-feedback">{errors.bedId}</div>}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Doctor & Diagnosis */}
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0 fw-bold">Doctor & Diagnosis</h5>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Department <span className="text-danger">*</span></label>
                        <select
                          className={`form-select ${errors.department ? "is-invalid" : ""}`}
                          name="department"
                          value={departments.find(d => d.departmentName === formData.department)?.id || ""}
                          onChange={(e) => handleDepartmentChange(e.target.value)}
                          required
                        >
                          <option value="">Select Department</option>
                          {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>{dept.departmentName}</option>
                          ))}
                        </select>
                        {errors.department && <div className="invalid-feedback">{errors.department}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Admitting / Treating Doctor <span className="text-danger">*</span></label>
                        <select
                          className={`form-select ${errors.admittingDoctorId ? "is-invalid" : ""}`}
                          value={formData.admittingDoctorId}
                          onChange={(e) => handleDoctorSelect(e.target.value)}
                          required
                          disabled={!formData.department}
                        >
                          <option value="">Select Doctor</option>
                          {doctors.map(doctor => (
                            <option key={doctor.userId || doctor.id} value={doctor.userId || doctor.id}>
                              {doctor.firstName ? [doctor.firstName, doctor.middleName, doctor.lastName].filter(Boolean).join(" ") : doctor.name}
                            </option>
                          ))}
                        </select>
                        {errors.admittingDoctorId && <div className="invalid-feedback">{errors.admittingDoctorId}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Provisional / Working Diagnosis <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className={`form-control ${errors.provisionalDiagnosis ? "is-invalid" : ""}`}
                          name="provisionalDiagnosis"
                          value={formData.provisionalDiagnosis}
                          onChange={handleChange}
                          required
                          placeholder="e.g., Fever with dehydration"
                        />
                        {errors.provisionalDiagnosis && <div className="invalid-feedback">{errors.provisionalDiagnosis}</div>}
                      </div>
                      
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Consent & Legal Section */}
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0 fw-bold"> Consent & Legal Details</h5>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Admission Consent Taken <span className="text-danger">*</span></label>
                        <select
                          className="form-select"
                          name="admissionConsentTaken"
                          value={formData.admissionConsentTaken}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select</option>
                          {yesNoOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Consent Taken By</label>
                        <select
                          className={`form-select ${errors.consentTakenBy ? "is-invalid" : ""}`}
                          name="consentTakenBy"
                          value={formData.consentTakenBy}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          {consentTakenByOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                        {errors.consentTakenBy && <div className="invalid-feedback">{errors.consentTakenBy}</div>}
                      </div>
                      
                      <div className="col-md-3">
                        <label className="form-label fw-bold">MLC Case <span className="text-danger">*</span></label>
                        <select
                          className="form-select"
                          name="mlcCase"
                          value={formData.mlcCase}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select</option>
                          {yesNoOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Police Intimation Required <span className="text-danger">*</span></label>
                        <select
                          className="form-select"
                          name="policeIntimationRequired"
                          value={formData.policeIntimationRequired}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select</option>
                          {yesNoOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {/* Original Consent & Legal Section */}
                    <div className="row g-3 mt-2">
                      
                      {formData.consentGiven && (
                        <>
                          <div className="col-md-4">
                            <label className="form-label fw-bold">Consent Type</label>
                            <select
                              className="form-select"
                              name="consentType"
                              value={formData.consentType}
                              onChange={handleChange}
                            >
                              {consentTypeOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-bold">Consent Date</label>
                            <input
                              type="date"
                              className="form-control"
                              name="consentDate"
                              value={formData.consentDate}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-bold">Legal Guardian Name</label>
                            <input
                              type="text"
                              className="form-control"
                              name="legalGuardian"
                              value={formData.legalGuardian}
                              onChange={handleChange}
                              placeholder="If consent given by guardian"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Document Upload Section */}
                <div className="card mb-4">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold">Document Upload</h5>
                    <button 
                      type="button" 
                      className="btn btn-primary btn-sm"
                      onClick={addDocumentRow}
                    >
                       + Add Document
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-bordered">
                        <thead>
                          <tr>
                            <th width="250">Document Type</th>
                            <th>Remarks</th>
                            <th width="200">File Upload</th>
                            <th width="80">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.documents.map((doc, index) => (
                            <tr key={doc.id}>
                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={doc.docType}
                                  onChange={(e) => handleDocumentChange(index, 'docType', e.target.value)}
                                >
                                  <option value="">Select Document Type</option>
                                  {documentTypes.map(type => (
                                    <option key={type.id} value={type.docTypeName}>
                                      {type.docTypeName}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={doc.remarks}
                                  onChange={(e) => handleDocumentChange(index, 'remarks', e.target.value)}
                                  placeholder="Remarks"
                                />
                              </td>
                              <td>
                                <div className="input-group input-group-sm">
                                  <input
                                    type="file"
                                    className="form-control form-control-sm"
                                    onChange={(e) => handleFileUpload(index, e)}
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                  />
                                </div>
                                {doc.fileName && (
                                  <small className="text-muted d-block mt-1">
                                    <i className="mdi mdi-file-document me-1"></i>
                                    {doc.fileName}
                                  </small>
                                )}
                              </td>
                              <td className="text-center">
                                {formData.documents.length > 1 && (
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() => removeDocumentRow(index)}
                                  >
                                    X
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                
                {/* Financial Section with Add/Delete Functionality */}
                <div className="card mb-4">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold">Financial Details</h5>
                    <button 
                      type="button" 
                      className="btn btn-primary btn-sm"
                      onClick={addFinancialRow}
                    >
                       + Add Financial Details
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-bordered">
                        <thead>
                          <tr>
                            <th width="50">S.No</th>
                            <th width="150">Payment Type</th>
                            <th width="150">Advance Collected</th>
                            <th width="150">Advance Amount</th>
                            <th width="150">Payment Mode</th>
                            <th width="80">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.financialDetails.map((financial, index) => (
                            <tr key={financial.id}>
                              <td className="text-center">{index + 1}</td>
                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={financial.paymentType}
                                  onChange={(e) => handleFinancialChange(index, 'paymentType', e.target.value)}
                                >
                                  <option value="">Select Payment Type</option>
                                  {paymentTypeOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={financial.advanceCollected}
                                  onChange={(e) => handleFinancialChange(index, 'advanceCollected', e.target.value)}
                                >
                                  <option value="">Select</option>
                                  {yesNoOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className={`form-control form-control-sm ${errors[`financial_${index}_advanceAmount`] ? "is-invalid" : ""}`}
                                  value={financial.advanceAmount}
                                  onChange={(e) => handleFinancialChange(index, 'advanceAmount', e.target.value)}
                                  placeholder="₹5,000"
                                  min="0"
                                  step="100"
                                />
                                {errors[`financial_${index}_advanceAmount`] && (
                                  <div className="invalid-feedback d-block">{errors[`financial_${index}_advanceAmount`]}</div>
                                )}
                              </td>
                              <td>
                                <select
                                  className={`form-select form-select-sm ${errors[`financial_${index}_paymentMode`] ? "is-invalid" : ""}`}
                                  value={financial.paymentMode}
                                  onChange={(e) => handleFinancialChange(index, 'paymentMode', e.target.value)}
                                >
                                  <option value="">Select Payment Mode</option>
                                  {paymentModeOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                  ))}
                                </select>
                                {errors[`financial_${index}_paymentMode`] && (
                                  <div className="invalid-feedback d-block">{errors[`financial_${index}_paymentMode`]}</div>
                                )}
                              </td>
                              
                              
                              
                              <td className="text-center">
                                {formData.financialDetails.length > 1 && (
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() => removeFinancialRow(index)}
                                  >
                                    X
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                  </div>
                </div>
                
                {/* NOK Details (Next of Kin) */}
                <div className="card mb-4">
                  <div className="card-header py-3 border-bottom-1">
                    <h6 className="mb-0 fw-bold">NOK Details</h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label fw-bold">First Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className={`form-control ${errors.nokFirstName ? "is-invalid" : ""}`}
                          placeholder="Enter First Name"
                          name="nokFirstName"
                          value={formData.nokFirstName || ""}
                          onChange={handleChange}
                          required
                        />
                        {errors.nokFirstName && <div className="invalid-feedback">{errors.nokFirstName}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Middle Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter Middle Name"
                          name="nokMiddleName"
                          value={formData.nokMiddleName || ""}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Last Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter Last Name"
                          name="nokLastName"
                          value={formData.nokLastName || ""}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Relation</label>
                        <select
                          className="form-select"
                          name="nokRelation"
                          value={formData.nokRelation || ""}
                          onChange={handleChange}
                        >
                          <option value="">Select Relation</option>
                          {relationData.map((relation) => (
                            <option key={relation.id} value={relation.id}>
                              {relation.relationName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          placeholder="Enter Email"
                          name="nokEmail"
                          value={formData.nokEmail || ""}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Mobile No.</label>
                        <input
                          type="text"
                          className={`form-control ${errors.nokMobile ? "is-invalid" : ""}`}
                          placeholder="Enter Mobile Number"
                          name="nokMobile"
                          value={formData.nokMobile || ""}
                          maxLength={10}
                          onChange={(e) => {
                            if (/^\d*$/.test(e.target.value)) {
                              handleChange(e);
                            }
                          }}
                        />
                        {errors.nokMobile && <div className="invalid-feedback">{errors.nokMobile}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Address 1</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter Address 1"
                          name="nokAddress1"
                          value={formData.nokAddress1 || ""}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Address 2</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter Address 2"
                          name="nokAddress2"
                          value={formData.nokAddress2 || ""}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Country</label>
                        <select
                          className="form-select"
                          name="nokCountry"
                          value={formData.nokCountry || ""}
                          onChange={(e) => {
                            handleChange(e);
                            fetchNokStates(e.target.value);
                          }}
                        >
                          <option value="">Select Country</option>
                          {countryData.map((country) => (
                            <option key={country.id} value={country.id}>
                              {country.countryName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">State</label>
                        <select
                          className="form-select"
                          name="nokState"
                          value={formData.nokState || ""}
                          onChange={(e) => {
                            handleChange(e);
                            fetchNokDistrict(e.target.value);
                          }}
                        >
                          <option value="">Select State</option>
                          {nokStateData.map((state) => (
                            <option key={state.id} value={state.id}>
                              {state.stateName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">District</label>
                        <select
                          className="form-select"
                          name="nokDistrict"
                          value={formData.nokDistrict || ""}
                          onChange={handleChange}
                        >
                          <option value="">Select District</option>
                          {nokDistrictData.map((district) => (
                            <option key={district.id} value={district.id}>
                              {district.districtName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">City</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter City"
                          name="nokCity"
                          value={formData.nokCity || ""}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Pin Code</label>
                        <input
                          type="text"
                          className={`form-control ${errors.nokPinCode ? "is-invalid" : ""}`}
                          name="nokPinCode"
                          value={formData.nokPinCode || ""}
                          maxLength={6}
                          onChange={(e) => {
                            if (/^\d*$/.test(e.target.value)) {
                              handleChange(e);
                            }
                          }}
                          placeholder="Enter Pin Code"
                        />
                        {errors.nokPinCode && <div className="invalid-feedback">{errors.nokPinCode}</div>}
                      </div>
                    </div>
                  </div>
                </div>
                
               
                
                {/* Action Buttons */}
                <div className="text-center mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary me-3"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="mdi mdi-check-circle me-2"></i>
                        Admit Patient
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    <i className="mdi mdi-cancel me-2"></i>
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InpatientAdmission;