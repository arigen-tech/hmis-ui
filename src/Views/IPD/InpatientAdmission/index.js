import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Popup from "../../../Components/popup";
import { getRequest, postRequest } from "../../../service/apiService";
import LoadingScreen from "../../../Components/Loading";

// API endpoints (configure these in your config)
// import { 
//   INPATIENT_ADMISSION_API, 
//   WARD_API, 
//   ROOM_API, 
//   BED_API, 
//   DOCTOR_API,
//   MAS_ADMISSION_CATEGORY,
//   MAS_ADMISSION_TYPE,
//   MAS_CARE_LEVEL,
//   MAS_PATIENT_CONDITION
// } from "../../../config/apiConfig";

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
    
    // NEW: Financial Section
    paymentType: "",
    advanceCollected: "No",
    advanceAmount: "",
    paymentMode: "",
    
    // NEW: Document Upload
    documents: [
      {
        id: 1,
        docType: "",
        docNumber: "",
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
  const [nokStateData, setNokStateData] = useState([]);
  const [nokDistrictData, setNokDistrictData] = useState([]);
  
  // NEW: Patient Address dropdown data
  const [patientStateData, setPatientStateData] = useState([]);
  const [patientDistrictData, setPatientDistrictData] = useState([]);
  
  // Master data states - NEW
  const [admissionCategories, setAdmissionCategories] = useState([]);
  const [admissionTypes, setAdmissionTypes] = useState([]);
  const [patientConditions, setPatientConditions] = useState([]);
  const [admissionCareTypes, setAdmissionCareTypes] = useState([]);
  const [admissionSources, setAdmissionSources] = useState([
    { id: "OPD", name: "OPD" },
    { id: "Emergency", name: "Emergency" },
    { id: "Referral", name: "Referral" },
  ]);
  
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
  const dietOptions = ["Veg", "Non-Veg", "Jain", "Diabetic", "Other"];
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
  useEffect(() => {
    if (patientData) {
      // Auto-populate patient details
      setFormData(prev => ({
        ...prev,
        patientName: patientData.patientName || "",
        patientId: patientData.id || "",
        uhid: patientData.uhid || `UHID-${String(patientData.id).padStart(6, '0')}`,
        mobileNo: patientData.mobileNo || "",
        age: patientData.age || "",
        gender: patientData.gender || "",
        admissionAdvisedFrom: patientData.department || "OPD - Medicine",
        // Add more auto-population as needed
      }));
    } else if (patientId) {
      // Fetch patient data by ID
      fetchPatientData();
    }
    
    // Set default dates
    const today = new Date();
    const formattedDate = formatDateForDisplay(today);
    const formattedTime = today.toTimeString().split(' ')[0].substring(0, 5);
    const ampm = today.getHours() >= 12 ? 'PM' : 'AM';
    const hours12 = today.getHours() % 12 || 12;
    const formattedDateTime = `${formattedDate} ${hours12}:${today.getMinutes().toString().padStart(2, '0')} ${ampm}`;
    
    setFormData(prev => ({
      ...prev,
      admissionDate: today.toISOString().split('T')[0],
      admissionTime: formattedTime,
      admissionDateTime: formattedDateTime,
      consentDate: today.toISOString().split('T')[0],
    }));
    
    // Fetch all dropdown data
    fetchDropdownData();
    fetchMasterData(); // NEW: Fetch master data
    fetchCountryData();
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
  
  const fetchPatientData = async () => {
    try {
      setLoading(true);
      // Fetch patient data from API
      // const response = await getRequest(`${INPATIENT_ADMISSION_API}/patient/${patientId}`);
      // if (response) {
      //   setFormData(prev => ({
      //     ...prev,
      //     ...response
      //   }));
      // }
    } catch (error) {
      console.error("Error fetching patient data:", error);
      showPopup("Failed to load patient data", "error");
    } finally {
      setLoading(false);
    }
  };
  
  // NEW: Fetch master data
  const fetchMasterData = async () => {
    try {
      // Mock data for now
      setAdmissionCategories([
        { id: 1, admissionCategoryName: "IPD", status: "Active" },
        { id: 2, admissionCategoryName: "Day Care", status: "Active" },
        { id: 3, admissionCategoryName: "Emergency IPD", status: "Active" },
      ]);
      
      setAdmissionTypes([
        { id: 1, admissionTypeName: "Planned", status: "Active" },
        { id: 2, admissionTypeName: "Emergency", status: "Active" },
        { id: 3, admissionTypeName: "Semi-Emergency", status: "Active" },
      ]);
      
      setPatientConditions([
        { id: 1, conditionName: "Stable", status: "Active" },
        { id: 2, conditionName: "Serious", status: "Active" },
        { id: 3, conditionName: "Critical", status: "Active" },
      ]);
      
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
      // Mock data for now
      setWardCategories([
        { id: 1, name: "General Ward", code: "GW" },
        { id: 2, name: "Critical Ward", code: "CW" },
        { id: 3, name: "ICU", code: "ICU" },
        { id: 4, name: "HDU", code: "HDU" },
        { id: 5, name: "Private Room", code: "PR" },
      ]);
      
      setDoctors([
        { id: 1, name: "Dr. S. Verma", department: "Medicine" },
        { id: 2, name: "Dr. A. Mehta", department: "Gynae" },
        { id: 3, name: "Dr. K. Rao", department: "Cardiology" },
        { id: 4, name: "Dr. R. Sharma", department: "Pediatrics" },
        { id: 5, name: "Dr. P. Gupta", department: "Surgery" },
      ]);
      
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };
  
  const fetchCountryData = async () => {
    try {
      // Mock data
      setCountryData([
        { id: 1, countryName: "India" },
        { id: 2, countryName: "USA" },
        { id: 3, countryName: "UK" },
      ]);
    } catch (error) {
      console.error("Error fetching country data:", error);
    }
  };
  
  // NEW: Fetch patient states
  const fetchPatientStates = async (countryId) => {
    try {
      // Mock data for India
      if (countryId == 1) {
        setPatientStateData([
          { id: 1, stateName: "Maharashtra" },
          { id: 2, stateName: "Delhi" },
          { id: 3, stateName: "Karnataka" },
          { id: 4, stateName: "Gujarat" },
          { id: 5, stateName: "Tamil Nadu" },
        ]);
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
      // Mock data
      if (stateId == 1) { // Maharashtra
        setPatientDistrictData([
          { id: 1, districtName: "Mumbai" },
          { id: 2, districtName: "Pune" },
          { id: 3, districtName: "Nagpur" },
          { id: 4, districtName: "Nashik" },
          { id: 5, districtName: "Aurangabad" },
        ]);
      } else if (stateId == 3) { // Karnataka
        setPatientDistrictData([
          { id: 6, districtName: "Bangalore" },
          { id: 7, districtName: "Mysore" },
          { id: 8, districtName: "Hubli" },
          { id: 9, districtName: "Mangalore" },
        ]);
      } else {
        setPatientDistrictData([]);
      }
    } catch (error) {
      console.error("Error fetching patient districts:", error);
    }
  };
  
  const fetchNokStates = async (countryId) => {
    try {
      // Mock data for India
      if (countryId == 1) {
        setNokStateData([
          { id: 1, stateName: "Maharashtra" },
          { id: 2, stateName: "Delhi" },
          { id: 3, stateName: "Karnataka" },
        ]);
      } else {
        setNokStateData([]);
      }
    } catch (error) {
      console.error("Error fetching states:", error);
    }
  };
  
  const fetchNokDistrict = async (stateId) => {
    try {
      // Mock data
      if (stateId == 1) {
        setNokDistrictData([
          { id: 1, districtName: "Mumbai" },
          { id: 2, districtName: "Pune" },
          { id: 3, districtName: "Nagpur" },
        ]);
      } else {
        setNokDistrictData([]);
      }
    } catch (error) {
      console.error("Error fetching districts:", error);
    }
  };
  
  const fetchWardsByCategory = async (categoryId) => {
    try {
      // Mock data
      if (categoryId == 1) { // General Ward
        setWards([
          { id: 1, name: "General Ward - A", code: "GW-A", availableBeds: 5 },
          { id: 2, name: "General Ward - B", code: "GW-B", availableBeds: 3 },
        ]);
      } else if (categoryId == 3) { // ICU
        setWards([
          { id: 3, name: "ICU - 1", code: "ICU-1", availableBeds: 2 },
          { id: 4, name: "ICU - 2", code: "ICU-2", availableBeds: 1 },
        ]);
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
  
  const fetchRoomsByWard = async (wardId) => {
    try {
      // Mock data
      if (wardId == 1) { // General Ward - A
        setRooms([
          { id: 1, roomNumber: "GW-Room-01", wardId: 1 },
          { id: 2, roomNumber: "GW-Room-02", wardId: 1 },
          { id: 3, roomNumber: "GW-Room-03", wardId: 1 },
        ]);
      } else if (wardId == 3) { // ICU - 1
        setRooms([
          { id: 4, roomNumber: "ICU-Room-01", wardId: 3 },
          { id: 5, roomNumber: "ICU-Room-02", wardId: 3 },
        ]);
      } else {
        setRooms([]);
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
      // Mock data
      if (roomId == 1) { // GW-Room-01
        setBeds([
          { id: 1, bedNumber: "GW-01", roomId: 1, status: "available" },
          { id: 2, bedNumber: "GW-02", roomId: 1, status: "occupied" },
          { id: 3, bedNumber: "GW-03", roomId: 1, status: "available" },
        ]);
      } else if (roomId == 4) { // ICU-Room-01
        setBeds([
          { id: 4, bedNumber: "ICU-01", roomId: 4, status: "available" },
          { id: 5, bedNumber: "ICU-02", roomId: 4, status: "available" },
        ]);
      } else {
        setBeds([]);
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
          docNumber: "",
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
      
      // Clear advanceAmount if advanceCollected is "No"
      if (name === "advanceCollected" && value === "No") {
        updated.advanceAmount = "";
        updated.paymentMode = "";
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
    
    fetchWardsByCategory(categoryId);
  };
  
  const handleWardChange = (wardId) => {
    const selectedWard = wards.find(w => w.id == wardId);
    setFormData(prev => ({
      ...prev,
      wardId: wardId,
      wardName: selectedWard?.name || "",
      roomId: "",
      roomNumber: "",
      bedId: "",
      bedNumber: "",
    }));
    
    fetchRoomsByWard(wardId);
  };
  
  const handleRoomChange = (roomId) => {
    const selectedRoom = rooms.find(r => r.id == roomId);
    setFormData(prev => ({
      ...prev,
      roomId: roomId,
      roomNumber: selectedRoom?.roomNumber || "",
      bedId: "",
      bedNumber: "",
    }));
    
    fetchBedsByRoom(roomId);
  };
  
  const handleBedChange = (bedId) => {
    const selectedBed = beds.find(b => b.id == bedId);
    setFormData(prev => ({
      ...prev,
      bedId: bedId,
      bedNumber: selectedBed?.bedNumber || "",
    }));
  };
  
  const handleDoctorSelect = (doctorId) => {
    const selectedDoctor = doctors.find(d => d.id == doctorId);
    setFormData(prev => ({
      ...prev,
      admittingDoctorId: doctorId,
      admittingDoctorName: selectedDoctor?.name || "",
    }));
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
    if (!formData.admittingDoctorId) newErrors.admittingDoctorId = "Admitting Doctor is required";
    if (!formData.provisionalDiagnosis) newErrors.provisionalDiagnosis = "Provisional Diagnosis is required";
    
    // Validate new consent fields
    if (formData.admissionConsentTaken === "Yes" && !formData.consentTakenBy) {
      newErrors.consentTakenBy = "Consent taken by is required";
    }
    
    // Validate advance amount if advance collected is Yes
    if (formData.advanceCollected === "Yes") {
      if (!formData.advanceAmount) {
        newErrors.advanceAmount = "Advance amount is required";
      } else if (isNaN(formData.advanceAmount) || Number(formData.advanceAmount) <= 0) {
        newErrors.advanceAmount = "Please enter a valid advance amount";
      }
      
      if (!formData.paymentMode) {
        newErrors.paymentMode = "Payment mode is required";
      }
    }
    
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
      
      // Prepare payload
      const payload = {
        patientId: formData.patientId,
        uhid: formData.uhid,
        patientName: formData.patientName,
        
        // UPDATED Admission Details
        admissionDetails: {
          date: formData.admissionDate,
          time: formData.admissionTime,
          dateTime: formData.admissionDateTime,
          category: formData.admissionCategory,
          type: formData.admissionType,
          source: formData.admissionSource,
          patientCondition: formData.patientCondition,
          careType: formData.admissionCareType,
          advisedFrom: formData.admissionAdvisedFrom,
          remarks: formData.admissionRemarks,
          expectedStay: formData.expectedStay,
        },
        
        wardDetails: {
          wardCategory: formData.wardCategory,
          wardId: formData.wardId,
          wardName: formData.wardName,
          roomId: formData.roomId,
          roomNumber: formData.roomNumber,
          bedId: formData.bedId,
          bedNumber: formData.bedNumber,
        },
        
        medicalDetails: {
          admittingDoctorId: formData.admittingDoctorId,
          admittingDoctorName: formData.admittingDoctorName,
          provisionalDiagnosis: formData.provisionalDiagnosis,
          workingDiagnosis: formData.workingDiagnosis,
        },
        
        patientDetails: {
          dietPreference: formData.dietPreference,
          allergies: formData.allergies,
          bloodGroup: formData.bloodGroup,
          maritalStatus: formData.maritalStatus,
          nationality: formData.nationality,
          address: formData.address,
        },
        
        // NEW: Patient Address Details
        patientAddress: {
          address1: formData.patientAddress1,
          address2: formData.patientAddress2,
          country: formData.patientCountry,
          state: formData.patientState,
          district: formData.patientDistrict,
          city: formData.patientCity,
          pinCode: formData.patientPinCode,
        },
        
        nokDetails: {
          firstName: formData.nokFirstName,
          middleName: formData.nokMiddleName,
          lastName: formData.nokLastName,
          email: formData.nokEmail,
          mobile: formData.nokMobile,
          address1: formData.nokAddress1,
          address2: formData.nokAddress2,
          country: formData.nokCountry,
          state: formData.nokState,
          district: formData.nokDistrict,
          city: formData.nokCity,
          pinCode: formData.nokPinCode,
          relation: formData.nokRelation,
        },
        
        emergencyContact: {
          firstName: formData.emergencyFirstName,
          lastName: formData.emergencyLastName,
          mobile: formData.emergencyMobile,
          relation: formData.emergencyRelation,
        },
        
        consentDetails: {
          given: formData.consentGiven,
          type: formData.consentType,
          date: formData.consentDate,
          legalGuardian: formData.legalGuardian,
          admissionConsentTaken: formData.admissionConsentTaken,
          consentTakenBy: formData.consentTakenBy,
          mlcCase: formData.mlcCase,
          policeIntimationRequired: formData.policeIntimationRequired,
        },
        
        financialDetails: {
          paymentType: formData.paymentType,
          advanceCollected: formData.advanceCollected,
          advanceAmount: formData.advanceAmount,
          paymentMode: formData.paymentMode,
        },
        
        documents: formData.documents.map(doc => ({
          docType: doc.docType,
          docNumber: doc.docNumber,
          remarks: doc.remarks,
          fileName: doc.fileName,
          // Note: File upload would need to be handled separately via FormData
        })),
      };
      
      console.log("Admission payload:", payload);
      
      // Submit to API
      // const response = await postRequest(INPATIENT_ADMISSION_API, payload);
      
      // Show success and redirect
      showPopup("Patient admitted successfully!", "success", () => {
        navigate(-1); // Go back to patient list
      });
      
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
                          {dietOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
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
                          {bloodGroupOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
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
                            <option key={category.id} value={category.admissionCategoryName}>
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
                            <option key={type.id} value={type.admissionTypeName}>
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
                            <option key={source.id} value={source.id}>
                              {source.name}
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
                            <option key={condition.id} value={condition.conditionName}>
                              {condition.conditionName}
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
                            <option key={category.id} value={category.id}>
                              {category.name} ({category.code})
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
                            <option key={ward.id} value={ward.id}>
                              {ward.name} ({ward.availableBeds || 0} beds available)
                            </option>
                          ))}
                        </select>
                        {errors.wardId && <div className="invalid-feedback">{errors.wardId}</div>}
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
                            <option key={room.id} value={room.id}>
                              {room.roomNumber}
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
                            <option key={bed.id} value={bed.id}>
                              {bed.bedNumber} ({bed.status})
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
                      <div className="col-md-6">
                        <label className="form-label fw-bold">Admitting / Treating Doctor <span className="text-danger">*</span></label>
                        <select
                          className={`form-select ${errors.admittingDoctorId ? "is-invalid" : ""}`}
                          value={formData.admittingDoctorId}
                          onChange={(e) => handleDoctorSelect(e.target.value)}
                          required
                        >
                          <option value="">Select Doctor</option>
                          {doctors.map(doctor => (
                            <option key={doctor.id} value={doctor.id}>
                              {doctor.name} - {doctor.department}
                            </option>
                          ))}
                        </select>
                        {errors.admittingDoctorId && <div className="invalid-feedback">{errors.admittingDoctorId}</div>}
                      </div>
                      <div className="col-md-6">
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
                            <th width="50">S.No</th>
                            <th width="250">Document Type</th>
                            <th width="150">Document Number</th>
                            <th>Remarks</th>
                            <th width="200">File Upload</th>
                            <th width="80">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.documents.map((doc, index) => (
                            <tr key={doc.id}>
                              <td className="text-center">{index + 1}</td>
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
                                  value={doc.docNumber}
                                  onChange={(e) => handleDocumentChange(index, 'docNumber', e.target.value)}
                                  placeholder="Doc Number"
                                />
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
                
                {/* Financial Section (Optional) */}
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0 fw-bold">Financial Details</h5>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Payment Type</label>
                        <select
                          className="form-select"
                          name="paymentType"
                          value={formData.paymentType}
                          onChange={handleChange}
                        >
                          <option value="">Select Payment Type</option>
                          {paymentTypeOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Advance Collected <span className="text-danger">*</span></label>
                        <select
                          className="form-select"
                          name="advanceCollected"
                          value={formData.advanceCollected}
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
                        <label className="form-label fw-bold">Advance Amount</label>
                        <input
                          type="number"
                          className={`form-control ${errors.advanceAmount ? "is-invalid" : ""}`}
                          name="advanceAmount"
                          value={formData.advanceAmount}
                          onChange={handleChange}
                          placeholder="₹5,000"
                          min="0"
                          step="100"
                        />
                        {errors.advanceAmount && <div className="invalid-feedback">{errors.advanceAmount}</div>}
                      </div>
                      
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Payment Mode</label>
                        <select
                          className={`form-select ${errors.paymentMode ? "is-invalid" : ""}`}
                          name="paymentMode"
                          value={formData.paymentMode}
                          onChange={handleChange}
                        >
                          <option value="">Select Payment Mode</option>
                          {paymentModeOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                        {errors.paymentMode && <div className="invalid-feedback">{errors.paymentMode}</div>}
                      </div>
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
                        <label className="form-label">First Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter First Name"
                          name="nokFirstName"
                          value={formData.nokFirstName || ""}
                          onChange={handleChange}
                        />
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
                          {relationOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
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
                          {relationOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
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