import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import placeholderImage from "../../../assets/images/placeholder.jpg";
import DatePicker from "../../../Components/DatePicker";
import {
  ALL_COUNTRY,
  ALL_DEPARTMENT,
  ALL_DISTRICT,
  ALL_GENDER,
  ALL_RELATION,
  ALL_STATE,
  API_HOST,
  DISTRICT_BY_STATE,
  DOCTOR_BY_SPECIALITY,
  GET_AVAILABILITY_TOKENS,
  GET_DOCTOR_SESSION,
  GET_SESSION,
  HOSPITAL,
  PATIENT_FOLLOW_UP,
  PATIENT_FOLLOW_UP_DETAILS,
  PATIENT_IMAGE_UPLOAD,
  PATIENT_SEARCH,
  STATE_BY_COUNTRY
} from "../../../config/apiConfig";
import { DEPARTMENT_CODE_OPD } from "../../../config/constants";
import { getRequest, postRequest } from "../../../service/apiService";

const UpdatePatientRegistration = () => {
  async function fetchHospitalDetails() {
    try {
      const data = await getRequest(`${HOSPITAL}/${sessionStorage.getItem('hospitalId')}`);
      if (data.status === 200) {
        if (data.response.preConsultationAvailable == 'y' || data.response.preConsultationAvailable == 'Y') {
          setPreConsultationFlag(true);
        }
      } else {
        console.error("Unexpected API response format:", data);
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllStateData() {
    try {
      const data = await getRequest(`${ALL_STATE}/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setStateData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setStateData([]);
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllDistrictData() {
    try {
      const data = await getRequest(`${ALL_DISTRICT}/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setDistrictData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setStateData([]);
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Fetching gender data (simulated API response)
    fetchGenderData();
    fetchAllStateData();
    fetchRelationData();
    fetchCountryData();
    fetchAllNokDistrict();
    fetchNokAllStates();
    fetchDepartment();
    fetchSesion();
    fetchAllDistrictData();
    fetchHospitalDetails();
  }, []);
  const [availableTokens, setAvailableTokens] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateResetKey, setDateResetKey] = useState(0);
  const [popupMessage, setPopupMessage] = useState(null);
  const [hospitalId, setHospitalId] = useState(12);
  const [errors, setErrors] = useState({});
  const [imageURL, setImageURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [genderData, setGenderData] = useState([]);
  const [relationData, setRelationData] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [stateData, setStateData] = useState([]);
  const [nokStateData, setNokStateData] = useState([]);
  const [districtData, setDistrictData] = useState([]);
  const [nokDistrictData, setNokDistrictData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [doctorData, setDoctorData] = useState([]);
  const [session, setSession] = useState([]);
  const [appointmentFlag, setAppointmentFlag] = useState(false);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [image, setImage] = useState(placeholderImage);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [showDetails, setShowDetails] = useState(false);
  const [preConsultationFlag, setPreConsultationFlag] = useState(false);
  const [formData, setFormData] = useState({
    mobileNo: "",
    patientName: "",
    uhidNo: "",
    appointmentDate: ""
  });
  const [patientDetailForm, setPatientDetailForm] = useState({
    patientGender: "",
    patientRelation: ""
  });
  let stream = null;
  const [patients, setPatients] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileQuery, setMobileQuery] = useState("");
  const [pageInput, setPageInput] = useState("");
  const [searchPerformed, setSearchPerformed] = useState(false);


  const [appointments, setAppointments] = useState([
    {
      id: 0,
      speciality: "",
      selDoctorId: "",
      selSession: "",
      selDate: null,
      departmentName: "",
      doctorName: "",
      sessionName: "",
      visitId: null,
      tokenNo: null,
      tokenStartTime: "",
      tokenEndTime: "",
      selectedTimeSlot: ""
    }
  ]);

  const [nextAppointmentId, setNextAppointmentId] = useState(1);
  const [doctorDataMap, setDoctorDataMap] = useState({});
  const [sessionDataMap, setSessionDataMap] = useState({});

  const isPastDate = (dateStr) => {
    const selected = new Date(dateStr);
    const today = new Date();

    selected.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return selected < today;
  };

  const addAppointmentRow = () => {
    setAppointments(prev => [
      ...prev,
      {
        id: nextAppointmentId,
        speciality: "",
        selDoctorId: "",
        selSession: "",
        selDate: null,
        tokenNo: null,
        tokenStartTime: "",
        tokenEndTime: "",
        selectedTimeSlot: "",
        departmentName: "",
        doctorName: "",
        sessionName: "",
        visitId: null
      }
    ]);
    setNextAppointmentId(prev => prev + 1);
  };

  const removeAppointmentRow = (id) => {
    // Don't remove if it's the only row
    if (appointments.length <= 1) {
      Swal.fire("Error", "At least one appointment row is required", "error");
      return;
    }

    setAppointments(prev => prev.filter(appt => appt.id !== id));
    setDoctorDataMap(prev => {
      let updated = { ...prev };
      delete updated[id];
      return updated;
    });
    setSessionDataMap(prev => {
      let updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handleSpecialityChange = async (rowId, value) => {
    const selectedDepartment = departmentData.find(d => d.id == value);

    setAppointments(prev =>
      prev.map(a =>
        a.id === rowId
          ? {
            ...a,
            speciality: value,
            selDoctorId: "",
            selSession: "",
            departmentName: selectedDepartment ? selectedDepartment.departmentName : "",
            selDate: null,
            tokenNo: null,
            tokenStartTime: "",
            tokenEndTime: "",
            selectedTimeSlot: ""
          }
          : a
      )
    );

    const fetchTokenAvailability = async (appointmentIndex = 0) => {
      try {
        setLoading(true);

        const targetAppointment = appointments[appointmentIndex];

        if (!targetAppointment.speciality || !targetAppointment.selDoctorId ||
          !targetAppointment.selSession || !targetAppointment.selDate) {
          Swal.fire({
            icon: 'warning',
            title: 'Incomplete Details',
            text: 'Please select Speciality, Doctor, and Session first.',
          });
          return;
        }

        const selectedSession = session.find(s => s.id == targetAppointment.selSession);
        const sessionName = selectedSession ? selectedSession.sessionName : targetAppointment.sessionName || "";

        const params = new URLSearchParams({
          deptId: targetAppointment.speciality,
          doctorId: targetAppointment.selDoctorId,
          appointmentDate: targetAppointment.selDate,
          sessionId: targetAppointment.selSession,
        }).toString();

        const url = `${GET_AVAILABILITY_TOKENS}?${params}`;
        const data = await getRequest(url);

        if (data.status === 200 && Array.isArray(data.response)) {
          setAvailableTokens(data.response);
          showTokenPopup(
            data.response,
            sessionName,
            targetAppointment.selDate,
            appointmentIndex
          );
        } else {
          Swal.fire({
            icon: 'error',
            title: 'No Tokens Available',
            text: data.message || 'No tokens available for the selected criteria.',
          });
          setAvailableTokens([]);
        }

      } catch (error) {
        console.error("Error fetching token availability:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to fetch token availability. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    };

    // Fetch doctors according to department
    try {
      const data = await getRequest(`${DOCTOR_BY_SPECIALITY}${value}`);
      if (data.status === 200) {
        setDoctorDataMap(prev => ({ ...prev, [rowId]: data.response }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDoctorChange = (id, value, specialityId) => {
    const doctorOptions = doctorDataMap[id] || [];
    const selectedDoctor = doctorOptions.find(doctor => doctor.userId == value);
    const doctorName = selectedDoctor ? `${selectedDoctor.firstName} ${selectedDoctor.middleName || ''} ${selectedDoctor.lastName || ''}`.trim() : "";

    setAppointments(prev =>
      prev.map(a =>
        a.id === id ? {
          ...a, selDoctorId: value, selSession: "", doctorName, selDate: null, tokenNo: null,
          tokenStartTime: "",
          tokenEndTime: "",
          selectedTimeSlot: ""
        } : a
      )
    );

    checkDoctorValid(id, value, specialityId);
  };

  const handleSessionChange = (id, value, specialityId, doctorId) => {
    const selectedSession = session.find(s => s.id == value);
    const sessionName = selectedSession ? selectedSession.sessionName : "";
    setAppointments(prev =>
      prev.map(a =>
        a.id === id ? {
          ...a, selSession: value,
          sessionName: sessionName,
          selDate: null,
          tokenNo: null,
          tokenStartTime: "",
          tokenEndTime: "",
          selectedTimeSlot: ""
        } : a
      )
    );
    checkSessionValid(id, doctorId, specialityId, value);
  };

  const handleAppointmentChange = (index, field, value) => {
    setAppointments(prev =>
      prev.map((appt, i) => {
        if (i === index) {
          if (field === "selDate") {
            const dateOnly = value.split('T')[0];
            return {
              ...appt,
              [field]: dateOnly,
              tokenNo: null,
              tokenStartTime: "",
              tokenEndTime: "",
              selectedTimeSlot: ""
            };
          }
          return { ...appt, [field]: value };
        }
        return appt;
      })
    );
  };

  async function checkDoctorValid(rowId, doctorId, deptId) {
    let date = new Date().toISOString().split("T")[0];

    const data = await getRequest(
      `${GET_DOCTOR_SESSION}deptId=${deptId}&doctorId=${doctorId}&rosterDate=${date}&sessionId=`
    );

    if (data.status !== 200) {
      Swal.fire(data.message);

      setAppointments(prev =>
        prev.map(a =>
          a.id === rowId ? { ...a, selDoctorId: "", selSession: "" } : a
        )
      );
    }
  }

  async function checkSessionValid(rowId, doctorId, deptId, sessionId) {
    let date = new Date().toISOString().split("T")[0];

    const data = await getRequest(
      `${GET_DOCTOR_SESSION}deptId=${deptId}&doctorId=${doctorId}&rosterDate=${date}&sessionId=${sessionId}`
    );

    if (data.status !== 200) {
      Swal.fire(data.message);

      setAppointments(prev =>
        prev.map(a =>
          a.id === rowId ? { ...a, selSession: "" } : a
        )
      );
    }
  }

  const handleChangeSearch = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (name === "patientName") {
      setSearchQuery(value);
    }
    if (name === "mobileNo") {
      setMobileQuery(value);
    }
    setCurrentPage(1);
  };

  function calculateDOBFromAge(age) {
    const today = new Date();
    const birthYear = today.getFullYear() - age;

    // Default to today's month and day
    return new Date(birthYear, today.getMonth(), today.getDate()).toISOString().split('T')[0];
  }

  function calculateAgeFromDOB(dob) {
    const birthDate = new Date(dob);
    const today = new Date();

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    // Adjust if the day difference is negative
    if (days < 0) {
      months--;
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }

    // Adjust if the month difference is negative
    if (months < 0) {
      years--;
      months += 12;
    }

    return `${years}Y ${months}M ${days}D`;
  }

  function checkBMI(a, b) {
    if (a === '' || b == '') {
      return;
    }
    var c = b / 100;
    var d = c * c;
    var sub = a / d;
    return (parseFloat(Math.round(sub * 100) / 100).toFixed(2));
  }

  const handleChange = (e) => {
    const { name, value } = e.target;

    // copy because patientDetailForm is object in Update component
    const next = { ...patientDetailForm };

    // keep existing BMI logic if necessary
    if (name === 'patientAge' || name === 'age') {
      // user typed age -> compute DOB
      next.patientDob = calculateDOBFromAge(value);
      next.patientAge = value; // keep raw value too
    } else if (name === 'patientDob' || name === 'dob') {
      // user selected DOB -> compute formatted age
      next.patientDob = value;
      next.patientAge = calculateAgeFromDOB(value);
    } else if (name === 'weight' && next.height !== undefined) {
      next.bmi = checkBMI(value, next.height);
      next.weight = value;
    } else if (name === 'height' && next.weight !== undefined) {
      next.bmi = checkBMI(next.weight, value);
      next.height = value;
    } else {
      next[name] = value;
    }

    // Add validation for email and mobile number
    let error = "";

    if (name === "patientEmailId" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        error = "Invalid email format.";
      }
    }

    if (name === "patientMobileNumber") {
      if (value && !/^\d{10}$/.test(value)) {
        error = "Mobile number must be exactly 10 digits.";
      }
    }

    // Update errors state
    setErrors(prevErrors => {
      const newErrors = { ...prevErrors };
      if (error) {
        newErrors[name] = error;
      } else {
        delete newErrors[name];
      }
      return newErrors;
    });

    setPatientDetailForm(next);
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const searchPayload = {
        mobileNo: formData.mobileNo || null,
        patientName: formData.patientName || null,
        uhidNo: formData.uhidNo || null,
        appointmentDate: formData.appointmentDate
          ? new Date(formData.appointmentDate).toISOString().split("T")[0]
          : null,
      };

      Object.keys(searchPayload).forEach(key => {
        if (searchPayload[key] === "" || searchPayload[key] === undefined) {
          searchPayload[key] = null;
        }
      });

      const response = await postRequest(`${PATIENT_SEARCH}`, searchPayload);

      if (Array.isArray(response.response)) {
        setPatients(response.response);
        setSearchPerformed(true);  // ADD THIS
      } else {
        setPatients([]);
        setSearchPerformed(false); // ADD THIS
        Swal.fire("Info", "No patients found matching your criteria", "info");
      }
    } catch (error) {
      console.error("Error searching patients:", error);
      Swal.fire("Error", "Failed to search patients", "error");
      setSearchPerformed(false); // ADD THIS
    } finally {
      setLoading(false);
      setCurrentPage(1);
    }
  };

  const handleReset = () => {
    setFormData({
      mobileNo: "",
      patientName: "",
      uhidNo: "",
      appointmentDate: ""
    });
    setSearchQuery("");
    setMobileQuery("");
    setPatients([]);
    setSearchPerformed(false);
    setCurrentPage(1);
    setShowPatientDetails(false);
    setShowDetails(true);
    setPatientDetailForm({
      patientGender: "",
      patientRelation: ""
    });
    setAppointments([{
      id: 0,
      speciality: "",
      selDoctorId: "",
      selSession: "",
      departmentName: "",
      doctorName: "",
      sessionName: "",
      visitId: null
    }]);
    setNextAppointmentId(1);
    setImage(placeholderImage);
    setImageURL("");
    setDoctorDataMap({});
    setSessionDataMap({});
    setErrors({});
  };

  const handleRadioChange = (event) => {
    const newAppointmentFlag = event.target.value === "appointment";
    setAppointmentFlag(newAppointmentFlag);

    setShowDetails(true);
  };

  const startCamera = async () => {
    try {
      setIsCameraOn(true); // Ensure the video element is rendered before accessing ref
      setTimeout(async () => {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Set canvas dimensions to match video stream
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = canvas.toDataURL("image/png");

      setImage(imageData);
      stopCamera();
      confirmUpload(imageData);

    }
  };

  const confirmUpload = (imageData) => {
    Swal.fire({
      title: "Confirm Upload",
      text: "Do you want to upload this photo?",
      imageUrl: imageData,
      imageWidth: 200,
      imageHeight: 150,
      showCancelButton: true,
      confirmButtonText: "Yes, Upload",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        uploadImage(imageData);
      }
    });
  };

  const uploadImage = async (base64Image) => {
    try {
      // Convert base64 to Blob
      const blob = await fetch(base64Image).then((res) => res.blob());
      const formData1 = new FormData();
      formData1.append("file", blob, "photo.png");

      // Send the formData to the server
      const response = await fetch(`${API_HOST}${PATIENT_IMAGE_UPLOAD}`, {
        method: "POST",
        body: formData1,
      });

      // Parse JSON response
      const data = await response.json();

      if (response.status === 200 && data.response) {
        // Extracting the image path
        const extractedPath = data.response;

        // Updating state with the extracted image path
        setImageURL(extractedPath);
        console.log("Uploaded Image URL:", extractedPath);

        // Show success alert
        Swal.fire("Success!", "Image uploaded successfully!", "success");
      } else {
        Swal.fire("Error!", "Failed to upload image!", "error");
      }
    } catch (error) {
      console.error("Upload error:", error);
      Swal.fire("Error!", "Something went wrong!", "error");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setIsCameraOn(false);
    }
  };

  const clearPhoto = () => {
    setImage(placeholderImage);
  };

  const handleEdit = async (patient) => {
    try {
      const patientId = patient.id;
      const response = await getRequest(`${PATIENT_FOLLOW_UP_DETAILS}/${patientId}`);

      if (response.status === 200) {
        const data = response.response;
        const genderObj = genderData.find(g => g.id == data.personal?.gender);
        const relationObj = relationData.find(r => r.id == data.personal?.relation);
        const countryObj = countryData.find(c => c.id == data.address?.country);
        const stateObj = stateData.find(s => s.id == data.address?.state);
        const districtObj = districtData.find(d => d.id == data.address?.district);

        const nokCountryObj = countryData.find(c => c.id == data.nok?.country);
        const nokStateObj = nokStateData.find(s => s.id == data.nok?.state);
        const nokDistrictObj = nokDistrictData.find(d => d.id == data.nok?.district);

        setPatientDetailForm(prev => ({
          ...prev,
          // Basic info
          id: patientId,
          uhidNo: patient.uhidNo || "",
          patientFn: data.personal?.firstName || "",
          patientMn: data.personal?.middleName || "",
          patientLn: data.personal?.lastName || "",
          patientMobileNumber: data.personal?.mobileNo || "",
          patientEmailId: data.personal?.email || "",
          patientDob: data.personal?.dob || "",
          patientAge: data.personal?.age || "",
          patientGender: genderObj || "",
          patientRelation: relationObj || "",
          patientAddress1: data.address?.address1 || "",
          patientAddress2: data.address?.address2 || "",
          patientCity: data.address?.city || "",
          patientPincode: data.address?.pinCode || "",
          patientCountry: countryObj || "",
          patientState: stateObj || "",
          patientDistrict: districtObj || "",
          nokFn: data.nok?.firstName || "",
          nokMn: data.nok?.middleName || "",
          nokLn: data.nok?.lastName || "",
          nokEmail: data.nok?.email || "",
          nokMobileNumber: data.nok?.mobileNo || "",
          nokAddress1: data.nok?.address1 || "",
          nokAddress2: data.nok?.address2 || "",
          nokCity: data.nok?.city || "",
          nokPincode: data.nok?.pinCode || "",
          nokCountry: nokCountryObj || "",
          nokState: nokStateObj || "",
          nokDistrict: nokDistrictObj || "",
          emerFn: data.emergency?.firstName || "",
          emerLn: data.emergency?.lastName || "",
          emerMobile: data.emergency?.mobileNo || "",
          height: data.vitals?.height || "",
          weight: data.vitals?.weight || "",
          temperature: data.vitals?.temperature || "",
          systolicBP: data.vitals?.bpSys || "",
          diastolicBP: data.vitals?.bpDia || "",
          pulse: data.vitals?.pulse || "",
          rr: data.vitals?.rr || "",
          spo2: data.vitals?.spo2 || "",
          bmi: data.vitals?.bmi || "",
          patientImage: data.photoUrl ? `${API_HOST}${data.photoUrl}` : placeholderImage,
        }));

        // Handle appointments - ALWAYS show appointment section even if no appointments exist
        if (data.appointments && data.appointments.length > 0) {
          const mappedAppointments = data.appointments.map((appt, index) => {

            const extractDate = (dateString) => {
      if (!dateString) return null;
      if (dateString.includes('T')) return dateString.split('T')[0];
      if (dateString.includes(' ')) return dateString.split(' ')[0];
      return dateString;
    };
           return {
             id: index,
            speciality: appt.specialityId?.toString() || "",
            selDoctorId: appt.doctorId?.toString() || "",
            selSession: appt.sessionId?.toString() || "",
            selDate: extractDate(appt.visitDate),
            departmentName: appt.specialityName || "",
            doctorName: appt.doctorName || "",
            sessionName: appt.sessionName || "",
            visitId: appt.appointmentId || null,
            tokenNo: appt.tokenNo || null,
            tokenStartTime: appt.tokenStartTime || "",
            tokenEndTime: appt.tokenEndTime || "",
            selectedTimeSlot: appt.tokenStartTime && appt.tokenEndTime
              ? `${appt.tokenStartTime} - ${appt.tokenEndTime}`
              : ""
           }
          });

          setAppointments(mappedAppointments);
          setNextAppointmentId(mappedAppointments.length);
          setAppointmentFlag(true);

          mappedAppointments.forEach(async (appt) => {
            if (appt.speciality) {
              try {
                const doctorData = await getRequest(`${DOCTOR_BY_SPECIALITY}${appt.speciality}`);
                if (doctorData.status === 200) {
                  setDoctorDataMap(prev => ({
                    ...prev,
                    [appt.id]: doctorData.response
                  }));
                }
              } catch (err) {
                console.error(`Error fetching doctors for speciality ${appt.speciality}:`, err);
              }
            }
          });
        } else {
          setAppointments([{
            id: 0,
            speciality: "",
            selDoctorId: "",
            selSession: "",
            departmentName: "",
            doctorName: "",
            sessionName: "",
            visitId: null,
            tokenNo: null
          }]);
          setNextAppointmentId(1);
          setAppointmentFlag(false);
        }

        setShowPatientDetails(true);
        setShowDetails(true);

        Swal.fire("Loaded", "Patient details loaded successfully", "success");
      } else {
        Swal.fire("Error", response.message || "Unable to load patient details", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Unable to load patient details", "error");
    }
  };

  async function fetchGenderData() {
    setLoading(true);

    try {
      const data = await getRequest(`${ALL_GENDER}/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setGenderData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setGenderData([]);
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRelationData() {
    setLoading(true);

    try {
      const data = await getRequest(`${ALL_RELATION}/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setRelationData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setRelationData([]);
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCountryData() {
    setLoading(true);

    try {
      const data = await getRequest(`${ALL_COUNTRY}/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setCountryData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setCountryData([]);
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStates(value) {
    try {
      const data = await getRequest(`${STATE_BY_COUNTRY}${value}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setStateData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setStateData([]);
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSesion() {
    try {
      const data = await getRequest(`${GET_SESSION}1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setSession(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setSession([]);
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDistrict(value) {
    try {
      const data = await getRequest(`${DISTRICT_BY_STATE}${value}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setDistrictData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setDistrictData([]);
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchNokStates(value) {
    try {
      const data = await getRequest(`${STATE_BY_COUNTRY}${value}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setNokStateData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setNokStateData([]);
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchNokAllStates(value) {
    try {
      const data = await getRequest(`${ALL_STATE}/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setNokStateData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setNokStateData([]);
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchNokDistrict(value) {
    try {
      const data = await getRequest(`${DISTRICT_BY_STATE}${value}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setNokDistrictData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setNokDistrictData([]);
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllNokDistrict(value) {
    try {
      const data = await getRequest(`${ALL_DISTRICT}/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setNokDistrictData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setNokDistrictData([]);
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDepartment() {
    try {
      const data = await getRequest(`${ALL_DEPARTMENT}/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        const filteredDepartments = data.response.filter(
          (dept) => dept.departmentTypeId === DEPARTMENT_CODE_OPD
        );
        setDepartmentData(filteredDepartments);
      } else {
        console.error("Unexpected API response format:", data);
        setDepartmentData([]);
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setPatientDetailForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    console.log("Patient Detail Form:", patientDetailForm);

    // Check if patient is selected
    if (!patientDetailForm.id) {
      Swal.fire("Error", "Please select a patient to update", "error");
      return;
    }

    // If appointmentFlag is true, validate appointments
    if (appointmentFlag) {
      const validAppointments = appointments.filter(appt =>
        appt.speciality && appt.selDoctorId && appt.selSession
      );

      if (validAppointments.length === 0) {
        Swal.fire("Error", "Please add at least one valid appointment", "error");
        return;
      }
    }

    if (imageURL !== "") {
      patientDetailForm.imageURL = imageURL;
    }

    sendPatientData();
  };

  async function fetchDoctor(value) {
    try {
      const data = await getRequest(`${DOCTOR_BY_SPECIALITY}${value}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setDoctorData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setDoctorData([]);
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSession(doc) {
    console.log(doc.target.value);
    if (patientDetailForm.speciality != '' && doc) {
      console.log(doc);
      let timestamp = Date.now();
      let value = new Date(timestamp).toJSON().split('.')[0].split('T')[0];
      console.log(value);
      const data = await getRequest(`${GET_DOCTOR_SESSION}deptId=${patientDetailForm.speciality}&doctorId=${doc.target.value}&rosterDate=${value}`);
      if (data.status == 200) {
        console.log(data.response[0].rosterVal);
        let sessionVal = [{ key: 0, value: '' }, { key: 1, value: '' }];
        if (data.response[0].rosterVal == "YY") {
          sessionVal = [{ key: 0, value: 'Morning' }, { key: 1, value: 'Evening' }]
        }
        else if (data.response[0].rosterVal == "NY") {
          sessionVal = [{ key: 0, value: 'Evening' }]
        }
        else if (data.response[0].rosterVal == "YN") {
          sessionVal = [{ key: 0, value: 'Morning' }]
        }
        // setSession(sessionVal);
      }
      else {
        Swal.fire(data.message);
      }
    }
  }

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Basic patient info validation
    if (!patientDetailForm.patientFn?.trim()) {
      newErrors.patientFn = "First name is required";
      isValid = false;
    }

    if (!patientDetailForm.patientGender) {
      newErrors.patientGender = "Gender is required";
      isValid = false;
    }

    if (!patientDetailForm.patientRelation) {
      newErrors.patientRelation = "Relation is required";
      isValid = false;
    }

    if (!patientDetailForm.patientDob) {
      newErrors.patientDob = "Date of birth is required";
      isValid = false;
    }

    // Email validation
    if (patientDetailForm.patientEmailId) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(patientDetailForm.patientEmailId)) {
        newErrors.patientEmailId = "Invalid email format";
        isValid = false;
      }
    }

    // Mobile number validation
    if (!patientDetailForm.patientMobileNumber) {
      newErrors.patientMobileNumber = "Mobile number is required";
      isValid = false;
    } else if (!/^\d{10}$/.test(patientDetailForm.patientMobileNumber)) {
      newErrors.patientMobileNumber = "Mobile must be 10 digits";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const isFormValid = () => {
    if (!patientDetailForm.id) {
      return false;
    }

    // Check if appointmentFlag is true
    if (appointmentFlag) {
      const hasValidAppointment = appointments.some(a =>
        a.speciality && a.selDoctorId && a.selSession
      );

      if (!hasValidAppointment) {
        return false;
      }

      const appointmentsWithDetails = appointments.filter(appt =>
        appt.speciality && appt.selDoctorId && appt.selSession
      );

      if (appointmentsWithDetails.length > 0) {
        const allHaveTimeSlots = appointmentsWithDetails.every(appt =>
          appt.selectedTimeSlot && appt.selectedTimeSlot.trim() !== ""
        );

        if (!allHaveTimeSlots) {
          return false;
        }
      }
    }

    return true;
  };

  const sendPatientData = async () => {
    if (!validateForm()) {
      Swal.fire("Validation Error", "Please check all required fields", "error");
      return;
    }

    const hospitalId = Number(sessionStorage.getItem('hospitalId') || 12);
    const username = sessionStorage.getItem('username') || "system";
    const currentDate = new Date().toISOString();
    const currentDateOnly = new Date().toISOString().split('T')[0];


 const toInstant = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;
    const dateOnly = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    let timeWithSeconds = timeStr;
    if (timeStr && timeStr.split(':').length === 2) {
      timeWithSeconds = `${timeStr}:00`;
    }
    
    return `${dateOnly}T${timeWithSeconds}Z`;
  };

    const toNumber = (value) => {
      if (value === null || value === undefined || value === '') return null;
      const num = Number(value);
      return isNaN(num) ? null : num;
    };

    const extractId = (value) => {
      if (!value) return null;
      if (typeof value === 'object' && value.id !== undefined) return toNumber(value.id);
      return toNumber(value);
    };

    const smartTruncate = (value, defaultMaxLength = 255) => {
      if (!value) return "";

      const strValue = String(value);

      if (strValue.startsWith('data:image')) {
        const timestamp = new Date().getTime();
        const extension = strValue.includes('image/png') ? 'png' :
          strValue.includes('image/jpeg') ? 'jpg' :
            strValue.includes('image/gif') ? 'gif' : 'img';
        return `patient_${patientDetailForm.id || 'new'}_${timestamp}.${extension}`;
      }

      if (strValue.includes('http') && strValue.length > 200) {
        try {
          const url = new URL(strValue);
          const pathname = url.pathname;
          const filename = pathname.split('/').pop() || `image_${new Date().getTime()}.jpg`;
          return filename.substring(0, defaultMaxLength);
        } catch (e) {
        }
      }

      return strValue.length > defaultMaxLength ?
        strValue.substring(0, defaultMaxLength) : strValue;
    };

    const safeStringField = (fieldName, value, context = 'patient') => {
      const strValue = smartTruncate(value);

      if (value && String(value).length > 255 && strValue.length === 255) {
        console.warn(`⚠️ Field ${context}.${fieldName} was truncated from ${String(value).length} to 255 characters`);
        console.warn(`Original value start:`, String(value).substring(0, 100));
      }

      return strValue;
    };

    const prepareData = (data, fieldName = 'root') => {
      if (typeof data === 'string') {
        return safeStringField(fieldName, data);
      }

      if (typeof data === 'number' || typeof data === 'boolean') {
        return data;
      }

      if (data === null || data === undefined) {
        return null;
      }

      if (Array.isArray(data)) {
        return data.map((item, index) => prepareData(item, `${fieldName}[${index}]`));
      }

      if (typeof data === 'object') {
        const result = {};
        for (const key in data) {
          if (data.hasOwnProperty(key)) {
            result[key] = prepareData(data[key], `${fieldName}.${key}`);
          }
        }
        return result;
      }

      return data;
    };

    // 1. Prepare patient request with dynamic field handling
    const patientRequest = {
      id: toNumber(patientDetailForm.id) || null,
      uhidNo: patientDetailForm.uhidNo || "",
      patientStatus: "",
      regDate: currentDateOnly,
      lastChgBy: username,
      patientHospitalId: hospitalId,
      patientFn: patientDetailForm.patientFn || "",
      patientMn: patientDetailForm.patientMn || "",
      patientLn: patientDetailForm.patientLn || "",
      patientDob: patientDetailForm.patientDob || null,
      patientAge: patientDetailForm.patientAge || "",
      patientGenderId: extractId(patientDetailForm.patientGender),
      patientEmailId: patientDetailForm.patientEmailId || "",
      patientMobileNumber: patientDetailForm.patientMobileNumber || "",
      // Handle patientImage specially - it's the most likely culprit
      patientImage: smartTruncate(imageURL || patientDetailForm.patientImage || ""),
      fileName: "",
      patientRelationId: extractId(patientDetailForm.patientRelation),
      patientMaritalStatusId: null,
      patientReligionId: null,
      patientAddress1: patientDetailForm.patientAddress1 || "",
      patientAddress2: patientDetailForm.patientAddress2 || "",
      patientCity: patientDetailForm.patientCity || "",
      patientPincode: patientDetailForm.patientPincode || "",
      patientDistrictId: extractId(patientDetailForm.patientDistrict),
      patientStateId: extractId(patientDetailForm.patientState),
      patientCountryId: extractId(patientDetailForm.patientCountry),
      pincode: patientDetailForm.patientPincode || "",
      emerFn: patientDetailForm.emerFn || "",
      emerLn: patientDetailForm.emerLn || "",
      emerRelationId: null,
      emerMobile: patientDetailForm.emerMobile || "",
      nokFn: patientDetailForm.nokFn || "",
      nokMn: patientDetailForm.nokMn || "",
      nokLn: patientDetailForm.nokLn || "",
      nokEmail: patientDetailForm.nokEmail || "",
      nokMobileNumber: patientDetailForm.nokMobileNumber || "",
      nokAddress1: patientDetailForm.nokAddress1 || "",
      nokAddress2: patientDetailForm.nokAddress2 || "",
      nokCity: patientDetailForm.nokCity || "",
      nokDistrictId: extractId(patientDetailForm.nokDistrict),
      nokStateId: extractId(patientDetailForm.nokState),
      nokCountryId: extractId(patientDetailForm.nokCountry),
      nokPincode: patientDetailForm.nokPincode || "",
      nokRelationId: null
    };

    // 2. Prepare OPD detail request
    const opdPatientDetailRequest = {
      height: patientDetailForm.height || "0",
      idealWeight: patientDetailForm.idealWeight || "0",
      weight: patientDetailForm.weight || "0",
      pulse: patientDetailForm.pulse || "0",
      temperature: patientDetailForm.temperature || "0",
      opdDate: currentDate,
      rr: patientDetailForm.rr || "0",
      bmi: patientDetailForm.bmi || "0",
      spo2: patientDetailForm.spo2 || "0",
      varation: null,
      bpSystolic: patientDetailForm.systolicBP || "0",
      bpDiastolic: patientDetailForm.diastolicBP || "0",
      icdDiag: "",
      workingDiag: "",
      followUpFlag: "",
      followUpDays: null,
      pastMedicalHistory: "",
      presentComplaints: "",
      familyHistory: "",
      treatmentAdvice: "",
      sosFlag: "",
      recmmdMedAdvice: "",
      medicineFlag: "s",
      labFlag: "s",
      radioFlag: "s",
      referralFlag: "s",
      mlcFlag: "s",
      policeStation: "",
      policeName: "",
      patientId: toNumber(patientDetailForm.id),
      visitId: null,
      departmentId: appointments.length > 0 ? toNumber(appointments[0].speciality) : null,
      hospitalId: hospitalId,
      doctorId: appointments.length > 0 ? toNumber(appointments[0].selDoctorId) : null,
      lastChgBy: username
    };

    // 3. Prepare visits array
    const visitsArray = appointmentFlag ?
      appointments
        .filter(appt => appt.speciality && appt.selDoctorId && appt.selSession)
        .map(appt => {

          const startTime = toInstant(appt.selDate, appt.tokenStartTime);
          const endTime = toInstant(appt.selDate,appt.tokenEndTime);

          return {
            id: appt.visitId || null,
            tokenNo: appt.tokenNo || null,
            tokenStartTime: startTime,
            tokenEndTime: endTime,
            visitDate: startTime,
            departmentId: toNumber(appt.speciality),
            doctorId: toNumber(appt.selDoctorId),
            doctorName: appt.doctorName || "",
            sessionId: toNumber(appt.selSession),
            hospitalId: hospitalId,
            priority: null,
            billingStatus: "Pending",
            patientId: toNumber(patientDetailForm.id),
            iniDoctorId: toNumber(appt.selDoctorId),
            visitType: "F",
            lastChgBy: username
          };
        }) : [];

    // 4. Create the final request and apply automatic validation
    const finalRequest = prepareData({
      appointmentFlag: appointmentFlag,
      patientDetails: {
        patient: patientRequest,
        opdPatientDetail: opdPatientDetailRequest,
        visits: visitsArray
      }
    });

    console.log("Final request ready for sending:", finalRequest);

    try {
      Swal.fire({
        title: 'Processing...',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await postRequest(PATIENT_FOLLOW_UP, finalRequest);

      Swal.close();

      if (response.status === 200) {
        const message = appointmentFlag
          ? "Patient updated and appointments scheduled successfully!"
          : "Patient information updated successfully!";

        await Swal.fire({
          icon: 'success',
          title: 'Success',
          text: message,
          confirmButtonText: 'OK'
        });

        handleReset();
      } else {
        console.error("Backend error response:", response);
        throw new Error(response.message || response.detail || "Update failed");
      }
    } catch (error) {
      console.error("Error in update:", error);

      // Provide specific guidance based on error type
      if (error.message && error.message.includes("too long")) {
        // Try to identify which field caused the issue
        const fieldMatch = error.message.match(/column "([^"]+)"/i);
        if (fieldMatch) {
          const fieldName = fieldMatch[1];
          Swal.fire({
            icon: 'error',
            title: 'Data Too Long',
            html: `The field <strong>${fieldName}</strong> contains too much data.<br/>
                   Please shorten the value and try again.`,
            confirmButtonText: 'OK'
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Data Too Long',
            text: 'Some data exceeds the maximum allowed length. Please check particularly long text fields.',
            confirmButtonText: 'OK'
          });
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: error.message || 'Failed to update patient. Please try again.',
          confirmButtonText: 'OK'
        });
      }
    }
  };

  // Pagination calculations
  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.patientFn || ""} ${patient.patientMn || ""} ${patient.patientLn || ""}`.toLowerCase();
    const mobile = patient.patientMobileNumber || "";

    return (
      fullName.includes(searchQuery.toLowerCase()) ||
      mobile.includes(mobileQuery)
    );
  });

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const currentItems = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle page change without refreshing
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };


  const handleFormSubmit = (e) => {
    e.preventDefault();
  };

  // UPDATE YOUR renderPagination METHOD - Change all buttons to type="button"
  const renderPagination = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

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
          <button
            type="button"
            className="page-link"
            onClick={() => handlePageChange(number)}
            disabled={loading}
          >
            {number}
          </button>
        ) : (
          <span className="page-link disabled">{number}</span>
        )}
      </li>
    ));
  };

  const selectToken = async (appointmentIndex, tokenNo, tokenStartTime, tokenEndTime) => {
    try {
      setAppointments(prev => prev.map((app, index) =>
        index === appointmentIndex ? {
          ...app,
          tokenNo,
          tokenStartTime,
          tokenEndTime,
          selectedTimeSlot: `${tokenStartTime} - ${tokenEndTime}`
        } : app
      ));

      Swal.fire({
        icon: 'success',
        title: 'Token Selected',
        text: `Token ${tokenStartTime} to ${tokenEndTime} has been reserved.`,
        timer: 1500,
        showConfirmButton: false
      });

      Swal.close();

    } catch (error) {
      console.error("Error selecting token:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to select token. Please try again.',
      });
    }
  };

  // UPDATE YOUR handlePageNavigation METHOD
  const handlePageNavigation = (e) => {
    e.preventDefault();
    const pageNumber = Number.parseInt(pageInput, 10);
    if (pageNumber > 0 && pageNumber <= totalPages) {
      handlePageChange(pageNumber);
      setPageInput("");
    } else {
      Swal.fire("Invalid Page", "Please enter a valid page number.", "warning");
    }
  };


  if (loading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>;
  }

  const fetchTokenAvailability = async (appointmentIndex = 0) => {
    try {
      setLoading(true);

      const targetAppointment = appointments[appointmentIndex];

      if (!targetAppointment.speciality || !targetAppointment.selDoctorId ||
        !targetAppointment.selSession || !targetAppointment.selDate) {
        Swal.fire({
          icon: 'warning',
          title: 'Incomplete Details',
          text: 'Please select Speciality, Doctor, and Session first.',
        });
        return;
      }

      const params = new URLSearchParams({
        deptId: targetAppointment.speciality,
        doctorId: targetAppointment.selDoctorId,
        appointmentDate: targetAppointment.selDate,
        sessionId: targetAppointment.selSession,
      }).toString();

      const url = `${GET_AVAILABILITY_TOKENS}?${params}`;
      const data = await getRequest(url);

      if (data.status === 200 && Array.isArray(data.response)) {
        setAvailableTokens(data.response);
        showTokenPopup(
          data.response,
          targetAppointment.sessionName,
          targetAppointment.selDate,
          appointmentIndex
        );
      } else {
        Swal.fire({
          icon: 'error',
          title: 'No Tokens Available',
          text: data.message || 'No tokens available for the selected criteria.',
        });
        setAvailableTokens([]);
      }

    } catch (error) {
      console.error("Error fetching token availability:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch token availability. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const showTokenPopup = (tokens = [], sessionName, appointmentDate, appointmentIndex) => {
    if (tokens.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'No Tokens Available',
        text: 'No tokens are available for the selected session.',
      });
      return;
    }

    Swal.fire({
      title: `Time Slots - Appointment ${appointmentIndex + 1}`,
      html: `
      <div class="container-fluid">
        <div class="text-center mb-2">
          <h5 class="fw-bold mb-1">Available Time Slots</h5>
          <p class="text-muted small">Date: ${appointmentDate} | Session: ${sessionName}</p>
        </div>
        <div class="row">
          <div class="col-12">
            <div class="card border-0 shadow-sm">
              <div class="card-body p-3">
                <h6 class="fw-bold mb-2 text-primary">${sessionName} Session</h6>
                <div class="row row-cols-4 g-1" id="token-slots">
                  ${tokens.map(token => `
                    <div class="col">
<button type="button" 
        class="btn ${token.available ? 'btn-outline-success' : 'btn-outline-secondary disabled'} w-100 d-flex flex-column align-items-center justify-content-center p-1" 
        style="height: 65px; font-size: 0.75rem;"
        data-token-id="${token.tokenNo || ''}"
        data-token-starttime="${token.startTime || '00:00:00'}"  // Ensure full time format
        data-token-endtime="${token.endTime || '00:00:00'}"      // Ensure full time format
        ${!token.available ? 'disabled' : ''}>
  <span class="fw-bold">${token.startTime.split(':')[0]}:${token.startTime.split(':')[1]}</span>
  <span>${token.endTime.split(':')[0]}:${token.endTime.split(':')[1]}</span>
  ${!token.available ? '<span class="badge bg-danger mt-0" style="font-size: 0.6rem;">Booked</span>' : ''}
</button>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
      showCloseButton: true,
      showConfirmButton: false,
      width: 550,
      padding: "1rem",
      didOpen: () => {
        document.querySelectorAll('.btn-outline-success').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const tokenNo = e.target.closest('button').getAttribute('data-token-id');
            const tokenStartTime = e.target.closest('button').getAttribute('data-token-starttime');
            const tokenEndTime = e.target.closest('button').getAttribute('data-token-endtime');
            selectToken(appointmentIndex, tokenNo, tokenStartTime, tokenEndTime);
          });
        });
      },
      customClass: {
        container: 'swal2-bootstrap',
        popup: 'border-0'
      }
    });
  };

  // Show FORM VIEW when patient is selected
  if (showPatientDetails) {
    return (
      <div className="body d-flex py-3">
        <div className="container-xxl">
          <div className="row align-items-center">
            <div className="border-0 mb-4">
              <div className="card-header py-3 no-bg bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap">
                <div className="d-flex align-items-center w-100">
                  <h3 className="fw-bold mb-0">Update Patient Registration and Followup Appointment</h3>

                  <button className="btn btn-secondary ms-auto me-3" onClick={handleReset}>
                    <i className="icofont-arrow-left me-1"></i> Back to Search
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Personal Details */}
          <div className="row mb-3">
            <div className="col-sm-12">
              <div className="card shadow mb-3">
                <div className="card-header py-3   border-bottom-1">
                  <h6 className="mb-0 fw-bold">Personal Details</h6>
                </div>
                <div className="card-body">
                  <form>
                    <div className="row g-3">
                      <div className="col-md-9">
                        <div className="row g-3">
                          <div className="col-md-4">
                            <label className="form-label">First Name <span className="text-danger">*</span></label>
                            <input type="text" name="patientFn" onChange={handleChange} className="form-control"
                              placeholder="Enter First Name" required value={patientDetailForm.patientFn || ""} />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Middle Name</label>
                            <input type="text" name="patientMn" onChange={handleChange} className="form-control"
                              placeholder="Enter Middle Name" value={patientDetailForm.patientMn || ""} />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Last Name</label>
                            <input type="text" name="patientLn" onChange={handleChange} className="form-control"
                              placeholder="Enter Last Name" value={patientDetailForm.patientLn || ""} />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Mobile No.</label>
                            <input type="text" name="patientMobileNumber" className="form-control"
                              placeholder="Enter Mobile Number" value={patientDetailForm.patientMobileNumber || ""} />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label" htmlFor="gender">Gender <span className="text-danger">*</span></label>
                            <select
                              className="form-select"
                              name="patientGender"
                              value={patientDetailForm.patientGender?.id || ""}
                              onChange={(e) => {
                                const selectedGender = genderData.find(g => g.id === Number(e.target.value));
                                handleChange({ target: { name: 'patientGender', value: selectedGender } });
                              }}
                            >
                              <option value="">Select</option>
                              {genderData.map((gender) => (
                                <option key={gender.id} value={gender.id}>
                                  {gender.genderName}
                                </option>
                              ))}
                            </select>
                            {errors.patientGender && <div className="invalid-feedback">{errors.patientGender}</div>}
                          </div>
                          <div className="col-md-4">
                            <label className="form-label" htmlFor="relation">Relation <span className="text-danger">*</span></label>
                            <select
                              className="form-select"
                              name="patientRelation"
                              value={patientDetailForm.patientRelation?.id || ""}
                              onChange={(e) => {
                                const selectedRelation = relationData.find(r => r.id === Number(e.target.value));
                                handleChange({ target: { name: 'patientRelation', value: selectedRelation } });
                              }}
                            >
                              <option value="">Select</option>
                              {relationData.map((relation) => (
                                <option key={relation.id} value={relation.id}>
                                  {relation.relationName}
                                </option>
                              ))}
                            </select>
                            {errors.patientRelation && <div className="invalid-feedback">{errors.patientRelation}</div>}
                          </div>
                          <div className="col-md-4">
                            <label className="form-label" htmlFor="dob">DOB <span className="text-danger">*</span></label>
                            <input type="date" id="dob" name="dob"
                              className={`form-control ${errors.patientDob ? 'is-invalid' : ''}`} value={patientDetailForm.patientDob}
                              max={new Date().toISOString().split("T")[0]} onChange={handleChange}
                              placeholder="Select Date of Birth" />
                            {errors.patientDob && <div className="invalid-feedback">{errors.patientDob}</div>}
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Age</label>
                            <input
                              type="text"
                              id="age"
                              name="age"
                              className={`form-control ${errors.age ? "is-invalid" : ""}`}
                              value={patientDetailForm.patientAge || ""}
                              onChange={handleChange}
                              placeholder="Enter Age"
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Email </label>
                            <input type="email" className={`form-control ${errors.patientEmailId ? 'is-invalid' : ''}`} placeholder="Enter Email Address"
                              name="patientEmailId" value={patientDetailForm.patientEmailId || ""}
                              onChange={handleChange} required />
                            {errors.patientEmailId && <div className="invalid-feedback">{errors.patientEmailId}</div>}
                          </div>
                        </div>
                      </div>

                      <div className="col-md-3">
                        <div className="text-center">
                          <div className="card p-3 shadow">
                            {isCameraOn ? (
                              <video ref={videoRef} autoPlay className="d-block mx-auto"
                                style={{ width: "100%", height: "150px" }}></video>
                            ) : (
                              <img src={image || placeholderImage} alt="Profile" className="img-fluid border"
                                style={{ width: "100%", height: "150px" }} />
                            )}
                            <canvas ref={canvasRef} width="300" height="150" style={{ display: "none" }}></canvas>
                            <div className="mt-2">
                              <button type="button" className="btn btn-primary me-2 mb-2" onClick={startCamera}
                                disabled={isCameraOn}>
                                Start Camera
                              </button>
                              {isCameraOn && (
                                <button type="button" className="btn btn-success me-2 mb-2" onClick={capturePhoto}>
                                  Take Photo
                                </button>
                              )}
                              <button type="button" className="btn btn-danger mb-2" onClick={clearPhoto}>
                                Clear Photo
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Patient address */}
          <div className="row mb-3">
            <div className="col-sm-12">
              <div className="card shadow mb-3">
                <div className="card-header py-3   border-bottom-1">
                  <h6 className="mb-0 fw-bold">Patient Address</h6>
                </div>
                <div className="card-body">
                  <form>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label">Address 1</label>
                        <input type="text" className="form-control" value={patientDetailForm.patientAddress1 || ""}
                          name="patientAddress1" placeholder="Enter Address 1" onChange={handleChange} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Address 2</label>
                        <input type="text" className="form-control" placeholder="Enter Address 2" name="patientAddress2"
                          value={patientDetailForm.patientAddress2 || ""} onChange={handleChange} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Country</label>
                        <select className="form-select" name="patientCountry"
                          value={patientDetailForm.patientCountry ? JSON.stringify(patientDetailForm.patientCountry) : ""}
                          onChange={(e) => {
                            const selectedCountry = JSON.parse(e.target.value);
                            handleAddChange({
                              target: { name: 'patientCountry', value: selectedCountry }
                            });
                            fetchStates(selectedCountry.id); // pass id to fetchStates
                          }}>
                          <option value="">Select Country</option>
                          {countryData.map((country) => (
                            <option key={country.id} value={JSON.stringify(country)}>
                              {country.countryName}
                            </option>))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">State</label>
                        <select
                          className="form-select"
                          name="patientState"
                          value={patientDetailForm.patientState ? patientDetailForm.patientState.id : ""}
                          onChange={(e) => {
                            const selectedState = stateData.find(
                              (state) => state.id === parseInt(e.target.value, 10)
                            );
                            handleAddChange({
                              target: { name: "patientState", value: selectedState }
                            });
                            fetchDistrict(selectedState.id);
                          }}
                        >
                          <option value="">Select State</option>
                          {stateData.map((state) => (
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
                          name="patientDistrict"
                          value={patientDetailForm.patientDistrict ? patientDetailForm.patientDistrict.id : ""}
                          onChange={(e) => {
                            const selectedDistrictId = parseInt(e.target.value, 10);
                            const selectedDistrict = districtData.find(
                              (district) => district.id === selectedDistrictId
                            );
                            handleAddChange({
                              target: { name: 'patientDistrict', value: selectedDistrict }
                            });
                          }}
                        >
                          <option value="">Select District</option>
                          {districtData.map((district) => (
                            <option key={district.id} value={district.id}>
                              {district.districtName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">City</label>
                        <input type="text" className="form-control" name="patientCity"
                          value={patientDetailForm.patientCity}
                          onChange={handleChange} placeholder="Enter City" />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Pin Code</label>
                        <input type="text" className="form-control" placeholder="Enter Pin Code" name="patientPincode"
                          onChange={handleChange}
                          value={patientDetailForm.patientPincode || ""} />
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* NOK Details */}
          <div className="row mb-3">
            <div className="col-sm-12">
              <div className="card shadow mb-3">
                <div className="card-header py-3   border-bottom-1">
                  <h6 className="mb-0 fw-bold">NOK Details</h6>
                </div>
                <div className="card-body">
                  <form>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label">First Name</label>
                        <input type="text" className="form-control" onChange={handleChange} name="nokFn"
                          value={patientDetailForm.nokFn || ""} placeholder="Enter First Name" />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Middle Name</label>
                        <input type="text" className="form-control" onChange={handleChange} name="nokMn"
                          placeholder="Enter Middle Name" value={patientDetailForm.nokMn || ""} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Last Name</label>
                        <input type="text" className="form-control" onChange={handleChange} name="nokLn"
                          placeholder="Enter Last Name" value={patientDetailForm.nokLn || ""} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Email</label>
                        <input type="email" className="form-control" onChange={handleChange} name="nokEmail"
                          placeholder="Enter Email" value={patientDetailForm.nokEmail || ""} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Mobile No.</label>
                        <input type="text" className="form-control" onChange={handleChange} name="nokMobileNumber"
                          placeholder="Enter Mobile Number" value={patientDetailForm.nokMobileNumber || ""} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Address 1</label>
                        <input type="text" className="form-control" onChange={handleChange} name="nokAddress1"
                          placeholder="Enter Address 1" value={patientDetailForm.nokAddress1 || ""} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Address 2</label>
                        <input type="text" className="form-control" onChange={handleChange} name="nokAddress2"
                          placeholder="Enter Address 2" value={patientDetailForm.nokAddress2 || ""} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Country</label>
                        <select className="form-select" name="nokCountry"
                          value={patientDetailForm.nokCountry ? JSON.stringify(patientDetailForm.nokCountry) : ""}
                          onChange={(e) => {
                            const selectedCountry = JSON.parse(e.target.value);
                            handleAddChange({
                              target: { name: 'nokCountry', value: selectedCountry }
                            });
                            fetchNokStates(selectedCountry.id); // pass id to fetchStates
                          }}>
                          <option value="">Select Country</option>
                          {countryData.map((country) => (
                            <option key={country.id} value={JSON.stringify(country)}>
                              {country.countryName}
                            </option>))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">State</label>
                        <select
                          className="form-select"
                          name="nokState"
                          value={patientDetailForm.nokState ? patientDetailForm.nokState.id : ""}
                          onChange={(e) => {
                            const selectedStateId = parseInt(e.target.value, 10);
                            const selectedState = nokStateData.find((state) => state.id === selectedStateId);
                            handleAddChange({
                              target: { name: 'nokState', value: selectedState }
                            });
                            fetchNokDistrict(selectedStateId); // fetch districts using selected state ID
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
                          value={patientDetailForm.nokDistrict ? patientDetailForm.nokDistrict.id : ""}
                          onChange={(e) => {
                            const selectedDistrictId = parseInt(e.target.value, 10);
                            const selectedDistrict = nokDistrictData.find((district) => district.id === selectedDistrictId);
                            handleAddChange({
                              target: { name: 'nokDistrict', value: selectedDistrict }
                            });
                          }}
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
                        <input type="text" className="form-control" placeholder="Enter City" onChange={handleChange}
                          name="nokCity" value={patientDetailForm.nokCity || ""} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Pin Code</label>
                        <input type="text" className="form-control" placeholder="Enter Pin Code" onChange={handleChange}
                          name="nokPincode" value={patientDetailForm.nokPincode || ""} />
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact Details Section */}
          <div className="row mb-3">
            <div className="col-sm-12">
              <div className="card shadow mb-3">
                <div className="card-header py-3   border-bottom-1">
                  <h6 className="mb-0 fw-bold">Emergency Contact Details</h6>
                </div>
                <div className="card-body">
                  <form>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label">First Name</label>
                        <input type="text" className="form-control" placeholder="Enter First Name" onChange={handleChange}
                          name="emerFn" value={patientDetailForm.emerFn || ""} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Last Name</label>
                        <input type="text" className="form-control" placeholder="Enter Last Name" onChange={handleChange}
                          name="emerLn" value={patientDetailForm.emerLn || ""} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Mobile No.</label>
                        <input type="text" className="form-control" placeholder="Enter Mobile Number"
                          onChange={handleChange} name="emerMobile" value={patientDetailForm.emerMobile || ""} />
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>


          {/* Vital Details Section */}
          {!preConsultationFlag && (
            <div className="row mb-3">
              <div className="col-sm-12">
                <div className="card shadow mb-3">
                  <div className="card-header py-3   border-bottom-1">
                    <h6 className="mb-0 fw-bold">Vital Details</h6>
                  </div>
                  <div className="card-body">
                    <form className="vital">
                      <div className="row g-3 align-items-center">
                        {/* Patient Height */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">Patient Height<span
                            className="text-danger">*</span></label>
                          <input type="number" className={`form-control ${errors.height ? 'is-invalid' : ''}`}
                            placeholder="Height" name="height" value={patientDetailForm.height} onChange={handleChange} />
                          <span className="input-group-text">cm</span>
                          {errors.height && (
                            <div className="invalid-feedback d-block">{errors.height}</div>
                          )}
                        </div>

                        {/* Weight */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">Weight<span className="text-danger">*</span></label>
                          <input type="text" className={`form-control ${errors.weight ? 'is-invalid' : ''}`}
                            placeholder="Weight" name="weight" value={patientDetailForm.weight} onChange={handleChange} />
                          <span className="input-group-text">kg</span>
                          {errors.weight && (
                            <div className="invalid-feedback d-block">{errors.weight}</div>
                          )}
                        </div>

                        {/* Temperature */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">Temperature<span className="text-danger">*</span></label>
                          <input type="text" className={`form-control ${errors.temperature ? 'is-invalid' : ''}`}
                            placeholder="Temperature" name="temperature" value={patientDetailForm.temperature}
                            onChange={handleChange} />
                          <span className="input-group-text">°F</span>
                          {errors.temperature && (
                            <div className="invalid-feedback d-block">{errors.temperature}</div>
                          )}
                        </div>

                        {/* BP (Systolic / Diastolic) */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">BP<span className="text-danger">*</span></label>
                          <input type="text" className={`form-control ${errors.systolicBP ? 'is-invalid' : ''}`}
                            placeholder="Systolic" name="systolicBP" value={patientDetailForm.systolicBP}
                            onChange={handleChange} />
                          <span className="input-group-text">/</span>
                          {errors.systolicBP && (
                            <div className="invalid-feedback d-block">{errors.systolicBP}</div>
                          )}
                          <input type="text" className={`form-control ${errors.diastolicBP ? 'is-invalid' : ''}`}
                            placeholder="Diastolic" name="diastolicBP" value={patientDetailForm.diastolicBP}
                            onChange={handleChange} />
                          <span className="input-group-text">mmHg</span>
                          {errors.diastolicBP && (
                            <div className="invalid-feedback d-block">{errors.diastolicBP}</div>
                          )}
                        </div>

                        {/* Pulse */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">Pulse<span className="text-danger">*</span></label>
                          <input type="text" className={`form-control ${errors.pulse ? 'is-invalid' : ''}`}
                            placeholder="Pulse" name="pulse" value={patientDetailForm.pulse} onChange={handleChange} />
                          <span className="input-group-text">/min</span>
                          {errors.pulse && (
                            <div className="invalid-feedback d-block">{errors.pulse}</div>
                          )}
                        </div>

                        {/* BMI */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">BMI</label>
                          <input type="text" className={`form-control ${errors.bmi ? 'is-invalid' : ''}`}
                            placeholder="BMI" name="bmi" value={patientDetailForm.bmi} onChange={handleChange} />
                          <span className="input-group-text">kg/m²</span>
                          {errors.bmi && (
                            <div className="invalid-feedback d-block">{errors.bmi}</div>
                          )}
                        </div>

                        {/* RR */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">RR</label>
                          <input type="text" className={`form-control ${errors.rr ? 'is-invalid' : ''}`}
                            placeholder="RR" name="rr" value={patientDetailForm.rr} onChange={handleChange} />
                          <span className="input-group-text">/min</span>
                          {errors.rr && (
                            <div className="invalid-feedback d-block">{errors.rr}</div>
                          )}
                        </div>

                        {/* SpO2 */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">SpO2</label>
                          <input type="text" className={`form-control ${errors.spo2 ? 'is-invalid' : ''}`}
                            placeholder="SpO2" name="spo2" value={patientDetailForm.spo2} onChange={handleChange} />
                          <span className="input-group-text">%</span>
                          {errors.height && (
                            <div className="invalid-feedback d-block">{errors.spo2}</div>
                          )}
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Update Options Section - Moved under Vital Details */}
          <div className="row mb-3">
            <div className="col-sm-12">
              <div className="card shadow mb-3">
                <div className="card-header py-3   border-bottom-1">
                  <h6 className="mb-0 fw-bold">Update Options</h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-12">
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="appointmentType"
                          id="updateInfo"
                          value="updateInfo"
                          onChange={handleRadioChange}
                          checked={!appointmentFlag}
                        />
                        <label className="form-check-label" htmlFor="updateInfo">
                          Update Information Only
                        </label>
                      </div>
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="appointmentType"
                          id="appointment"
                          value="appointment"
                          onChange={handleRadioChange}
                          checked={appointmentFlag}
                        />
                        <label className="form-check-label" htmlFor="appointment">
                          Update with Appointment
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Appointment Details Section - only show when appointmentFlag is true */}
          {appointmentFlag && (
            <div className="row mb-3">
              <div className="col-sm-12">
                <div className="card shadow mb-3">
                  <div className="card-header py-3 border-bottom-1 d-flex align-items-center justify-content-between">
                    <h6 className="mb-0 fw-bold">Appointment Details</h6>
                    <div className="d-flex gap-2">
                      <button type="button" className="btn btn-sm btn-outline-secondary text-white" onClick={addAppointmentRow}>
                        + Add Appointment
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    <form>
                      {appointments.map((appointment, index) => {
                        const doctorOptions = doctorDataMap[appointment.id] || [];
                        return (
                          <div className="row g-3 mb-3 border-bottom pb-3" key={`appointment-${appointment.id}`}>
                            <div className="col-12 d-flex align-items-center justify-content-between">
                              <h6 className="fw-bold text-muted mb-0">
                                Appointment {index + 1}
                                {appointment.visitId && <span className="text-success ms-2">(Existing)</span>}
                              </h6>
                              {appointments.length > 1 && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => removeAppointmentRow(appointment.id)}
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">Speciality *</label>
                              <select
                                className="form-select"
                                value={appointment.speciality}
                                onChange={(e) => handleSpecialityChange(appointment.id, e.target.value)}
                                required
                              >
                                <option value="">Select Speciality</option>
                                {departmentData.map((department) => (
                                  <option key={department.id} value={department.id}>
                                    {department.departmentName}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">Doctor Name *</label>
                              <select
                                className="form-select"
                                value={appointment.selDoctorId}
                                onChange={(e) =>
                                  handleDoctorChange(appointment.id, e.target.value, appointment.speciality)
                                }
                                required
                                disabled={!appointment.speciality}
                              >
                                <option value="">Select Doctor</option>
                                {doctorOptions.map((doctor) => (
                                  <option key={doctor.userId} value={doctor.userId}>
                                    {`${doctor.firstName} ${doctor.middleName ? doctor.middleName : ""} ${doctor.lastName ? doctor.lastName : ""}`}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">Session *</label>
                              <select
                                className="form-select"
                                value={appointment.selSession}
                                disabled={!appointment.selDoctorId}
                                onChange={(e) =>
                                  handleSessionChange(
                                    appointment.id,
                                    e.target.value,
                                    appointment.speciality,
                                    appointment.selDoctorId
                                  )
                                }
                                required
                              >
                                <option value="">Select Session</option>
                                {session.map((ses) => (
                                  <option key={ses.id} value={ses.id}>
                                    {ses.sessionName}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Add Date Picker and Show Token Button */}
                            <div className="d-flex align-items-center col-md-4">
                              <div className="col-md-9">
                                <DatePicker
                                  key={dateResetKey + "-" + index}
                                  value={appointment.selDate || null}
                                  onChange={(date) => {
                                    if (isPastDate(date)) {
                                      Swal.fire({
                                        icon: "warning",
                                        title: "Invalid Date",
                                        text: "You cannot select a past date",
                                        timer: 2000
                                      });
                                      handleAppointmentChange(index, "selDate", "");
                                      setDateResetKey(prev => prev + 1);
                                      return;
                                    }
                                    handleAppointmentChange(index, "selDate", date);
                                  }}
                                  placeholder="Select Date"
                                  className="form-control"
                                />
                              </div>
                              <div className="col-md-4 align-items-center mt-4 ms-2">
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => {
                                    if (appointment.speciality && appointment.selDoctorId && appointment.selSession) {
                                      fetchTokenAvailability(index);
                                    } else {
                                      Swal.fire({
                                        icon: 'warning',
                                        title: 'Incomplete Details',
                                        text: 'Please select Speciality, Doctor, and Session first.',
                                      });
                                    }
                                  }}
                                  disabled={!appointment.speciality || !appointment.selDoctorId || !appointment.selSession || !appointment.selDate}
                                >
                                  Show Token
                                </button>
                              </div>
                            </div>

                            {/* Add Time Slot Display */}
                            <div className="col-md-4">
                              <label className="form-label">Time Slot</label>
                              <input
                                type="text"
                                className="form-control"
                                value={appointment.selectedTimeSlot || ""}
                                placeholder="No time slot selected"
                                readOnly
                                style={{ backgroundColor: appointment.selectedTimeSlot ? '#f0fff0' : '#f8f9fa' }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit and Reset Buttons */}
          <div className="row mb-3">
            <div className="col-sm-12">
              <div className="card shadow mb-3">
                <div className="card-body">
                  <div className="row g-3">
                    <div className="mt-4">
                      <button type="button" onClick={handleSubmit} className="btn btn-primary me-2" disabled={!isFormValid()}>Update Registration</button>
                      <button type="button" onClick={handleReset} className="btn btn-secondary">Reset</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show SEARCH VIEW (default)
  return (
    <div className="body d-flex py-3">
      <div className="container-xxl">
        <div className="row align-items-center">
          <div className="border-0 mb-4">
            <div className="card-header py-3 no-bg bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap">
              <h3 className="fw-bold mb-0">Update Patient Registration and Followup Appointment</h3>
            </div>
          </div>
        </div>

        {/* Patient Search */}
        <div className="row mb-3">
          <div className="col-sm-12">
            <div className="card shadow mb-3">
              <div className="card-header py-3   border-bottom-1">
                <h6 className="mb-0 fw-bold">Search Patient</h6>
              </div>
              <div className="card-body">
                <form onSubmit={handleFormSubmit}>
                  <div className="row g-3">
                    <div className="col-md-3">
                      <label className="form-label">Mobile No.</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Mobile No."
                        name="mobileNo"
                        value={formData.mobileNo}
                        onChange={handleChangeSearch}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Patient Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Patient Name"
                        name="patientName"
                        value={formData.patientName}
                        onChange={handleChangeSearch}
                      />
                    </div>
                    {/* <div className="col-md-3">
                      <label className="form-label">UHID No.</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter UHID No."
                        name="uhidNo"
                        value={formData.uhidNo}
                        onChange={handleChangeSearch}
                      />
                    </div> */}
                    {/* <div className="col-md-3">
                      <label className="form-label">Appointment Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="appointmentDate"
                        value={formData.appointmentDate}
                        onChange={handleChangeSearch}
                      />
                    </div> */}
                  </div>
                  <div className="mt-3 mb-3">
                    <button
                      type="button"
                      className="btn btn-primary me-2"
                      onClick={handleSearch}
                      disabled={loading}
                    >
                      {loading ? 'Searching...' : 'Search'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={handleReset}>
                      Reset
                    </button>
                  </div>

                  {searchPerformed && filteredPatients.length > 0 && (
                    <div className="col-md-12">
                      <div className="table-responsive packagelist">
                        <table className="table table-bordered table-hover align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>Patient Name</th>
                              <th>Mobile No.</th>
                              <th>UHID No.</th>
                              <th>Age</th>
                              <th>Gender</th>
                              <th>Email</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentItems.map((patient, index) => (
                              <tr key={index} className="table-row-hover">
                                <td>
                                  {`${patient.patientFn || ""} ${patient.patientMn || ""} ${patient.patientLn || ""}`.trim()}
                                </td>
                                <td>{patient.patientMobileNumber || ""}</td>
                                <td>{patient.uhidNo || ""}</td>
                                <td>{patient.patientAge || ""}</td>
                                <td>{patient.patientGender?.genderName || ""}</td>
                                <td>{patient.patientEmailId || ""}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleEdit(patient)}
                                    disabled={loading}
                                  >
                                    Edit
                                    <span className="ms-2">
                                      <i className="icofont-edit"></i>
                                    </span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </form>
                {/* PAGINATION SECTION - ALL BUTTONS TYPE="button" */}
                {searchPerformed && filteredPatients.length > itemsPerPage && (
                  <nav className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                      <span>
                        Page {currentPage} of {totalPages} | Total Records: {filteredPatients.length}
                      </span>
                    </div>
                    <ul className="pagination mb-0">
                      <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                        <button
                          type="button"
                          className="page-link"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1 || loading}
                        >
                          &laquo; Previous
                        </button>
                      </li>
                      {renderPagination()}
                      <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                        <button
                          type="button"
                          className="page-link"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages || loading}
                        >
                          Next &raquo;
                        </button>
                      </li>
                    </ul>
                    <div className="d-flex align-items-center">
                      <input
                        type="number"
                        min="1"
                        max={totalPages}
                        value={pageInput}
                        onChange={(e) => setPageInput(e.target.value)}
                        placeholder="Go to page"
                        className="form-control me-2"
                        style={{ width: "120px" }}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handlePageNavigation}
                        disabled={loading}
                      >
                        GO
                      </button>
                    </div>
                  </nav>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatePatientRegistration;