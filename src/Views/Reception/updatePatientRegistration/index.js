import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import placeholderImage from "../../../assets/images/placeholder.jpg";
import DatePicker from "../../../Components/DatePicker";
import { useNavigate } from "react-router-dom";
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
  STATE_BY_COUNTRY,
} from "../../../config/apiConfig";
import { DEPARTMENT_CODE_OPD,IMAGE_TITLE,IMAGE_TEXT,IMAGE_UPLOAD_SUCC_MSG,IMAGE_UPLOAD_FAIL_MSG,
  PAST_DATE_WARNING,INVALID_PAGE_NO_WARN_MSG,UNEXPECTED_API_RESPONSE_ERR,FETCH_DATA_ERROR,
  AT_LEAST_ONE_APPOINTMENT_REQUIRED,INVALID_MOBILE_NUMBER_MSG,INVALID_EMAIL_FORMAT_MSG,NO_PATIENTS_FOUND_MSG,
  SEARCH_PATIENTS_ERROR_LOG,SEARCH_PATIENTS_FAILED_MSG,CAMERA_ACCESS_ERROR_LOG,SOMETHING_WENT_WRONG_MSG,FILE_UPLOAD_ERROR_LOG,
UPLOADED_IMAGE_URL_LOG,UNABLE_TO_LOAD_PATIENT_DETAILS,SELECT_PATIENT_TO_UPDATE_ERROR,ADD_AT_LEAST_ONE_APPOINTMENT_ERROR,
CHECK_REQUIRED_FIELDS_ERROR,FINAL_REQUEST_READY_LOG,PATIENT_UPDATE_SUCCESS,PATIENT_UPDATE_WITH_APPOINTMENT_SUCCESS,
PATIENT_UPDATED_SUCCESS_TITLE,BACKEND_ERROR_RESPONSE_LOG,MAX_LENGTH_EXCEEDED_ERROR_TEXT,FAILED_TO_UPDATE_PATIENT_ERROR,
FETCH_TOKEN_AVAILABILITY_ERROR,SELECT_TOKEN_ERROR_LOG,NO_TOKENS_AVAILABLE,SELECT_SPECIALITY_DOCTOR_SESSION_MSG,
SELECT_TOKEN_ERROR_TEXT,FETCH_TOKEN_AVAILABILITY_ERROR_LOG,NO_TOKENS_AVAILABLE_TEXT,NO_TOKENS_AVAILABLE_INFO,} from "../../../config/constants";
import { getRequest, postRequest } from "../../../service/apiService";

const UpdatePatientRegistration = () => {
  const navigate = useNavigate();
  async function fetchHospitalDetails() {
    try {
      const data = await getRequest(
        `${HOSPITAL}/${sessionStorage.getItem("hospitalId")}`,
      );
      if (data.status === 200) {
        if (
          data.response.preConsultationAvailable == "y" ||
          data.response.preConsultationAvailable == "Y"
        ) {
          setPreConsultationFlag(true);
        }
      } else {
        console.error(UNEXPECTED_API_RESPONSE_ERR, data);
      }
    } catch (error) {
      console.error(FETCH_DATA_ERROR, error);
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
        console.error(UNEXPECTED_API_RESPONSE_ERR, data);
        setStateData([]);
      }
    } catch (error) {
      console.error(FETCH_DATA_ERROR, error);
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
        console.error(UNEXPECTED_API_RESPONSE_ERR, data);
        setStateData([]);
      }
    } catch (error) {
      console.error(FETCH_DATA_ERROR, error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
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
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
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
    appointmentDate: "",
  });
  const [patientDetailForm, setPatientDetailForm] = useState({
    patientGender: "",
    patientRelation: "",
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
      selectedTimeSlot: "",
    },
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
    setAppointments((prev) => [
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
        visitId: null,
      },
    ]);
    setNextAppointmentId((prev) => prev + 1);
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    try {
      const [year, month, day] = dateString.split("-");
      return `${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  };

  const removeAppointmentRow = (id) => {
    if (appointments.length <= 1) {
      Swal.fire("Error", AT_LEAST_ONE_APPOINTMENT_REQUIRED, "error");
      return;
    }

    setAppointments((prev) => prev.filter((appt) => appt.id !== id));
    setDoctorDataMap((prev) => {
      let updated = { ...prev };
      delete updated[id];
      return updated;
    });
    setSessionDataMap((prev) => {
      let updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handleSpecialityChange = async (rowId, value) => {
    const selectedDepartment = departmentData.find((d) => d.id == value);

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === rowId
          ? {
              ...a,
              speciality: value,
              selDoctorId: "",
              selSession: "",
              departmentName: selectedDepartment
                ? selectedDepartment.departmentName
                : "",
              selDate: null,
              tokenNo: null,
              tokenStartTime: "",
              tokenEndTime: "",
              selectedTimeSlot: "",
            }
          : a,
      ),
    );

    // Fetch doctors according to department
    try {
      const data = await getRequest(`${DOCTOR_BY_SPECIALITY}${value}`);
      if (data.status === 200) {
        setDoctorDataMap((prev) => ({ ...prev, [rowId]: data.response }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDoctorChange = (id, value, specialityId) => {
    const doctorOptions = doctorDataMap[id] || [];
    const selectedDoctor = doctorOptions.find(
      (doctor) => doctor.userId == value,
    );
    const doctorName = selectedDoctor
      ? `${selectedDoctor.firstName} ${selectedDoctor.middleName || ""} ${
          selectedDoctor.lastName || ""
        }`.trim()
      : "";

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              selDoctorId: value,
              selSession: "",
              doctorName,
              selDate: null,
              tokenNo: null,
              tokenStartTime: "",
              tokenEndTime: "",
              selectedTimeSlot: "",
            }
          : a,
      ),
    );

    checkDoctorValid(id, value, specialityId);
  };

  const handleSessionChange = (id, value, specialityId, doctorId) => {
    const selectedSession = session.find((s) => s.id == value);
    const sessionName = selectedSession ? selectedSession.sessionName : "";
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              selSession: value,
              sessionName: sessionName,
              selDate: null,
              tokenNo: null,
              tokenStartTime: "",
              tokenEndTime: "",
              selectedTimeSlot: "",
            }
          : a,
      ),
    );
    checkSessionValid(id, doctorId, specialityId, value);
  };

  const handleAppointmentChange = (index, field, value) => {
    setAppointments((prev) =>
      prev.map((appt, i) => {
        if (i === index) {
          if (field === "selDate") {
            const dateOnly = value.split("T")[0];
            return {
              ...appt,
              [field]: dateOnly,
              tokenNo: null,
              tokenStartTime: "",
              tokenEndTime: "",
              selectedTimeSlot: "",
            };
          }
          return { ...appt, [field]: value };
        }
        return appt;
      }),
    );
  };

  async function checkDoctorValid(rowId, doctorId, deptId) {
    let date = new Date().toISOString().split("T")[0];

    const data = await getRequest(
      `${GET_DOCTOR_SESSION}deptId=${deptId}&doctorId=${doctorId}&rosterDate=${date}&sessionId=`,
    );

    if (data.status !== 200) {
      Swal.fire(data.message);

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === rowId ? { ...a, selDoctorId: "", selSession: "" } : a,
        ),
      );
    }
  }

  async function checkSessionValid(rowId, doctorId, deptId, sessionId) {
    let date = new Date().toISOString().split("T")[0];

    const data = await getRequest(
      `${GET_DOCTOR_SESSION}deptId=${deptId}&doctorId=${doctorId}&rosterDate=${date}&sessionId=${sessionId}`,
    );

    if (data.status !== 200) {
      Swal.fire(data.message);

      setAppointments((prev) =>
        prev.map((a) => (a.id === rowId ? { ...a, selSession: "" } : a)),
      );
    }
  }

  const handleChangeSearch = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
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
    return new Date(birthYear, today.getMonth(), today.getDate())
      .toISOString()
      .split("T")[0];
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
    if (a === "" || b == "") {
      return;
    }
    var c = b / 100;
    var d = c * c;
    var sub = a / d;
    return parseFloat(Math.round(sub * 100) / 100).toFixed(2);
  }

  const handleChange = (e) => {
    const { name, value } = e.target;

    // copy because patientDetailForm is object in Update component
    const next = { ...patientDetailForm };

    // keep existing BMI logic if necessary
    if (name === "patientAge" || name === "age") {
      // user typed age -> compute DOB
      next.patientDob = calculateDOBFromAge(value);
      next.patientAge = value; // keep raw value too
    } else if (name === "patientDob" || name === "dob") {
      // user selected DOB -> compute formatted age
      next.patientDob = value;
      next.patientAge = calculateAgeFromDOB(value);
    } else if (name === "weight" && next.height !== undefined) {
      next.bmi = checkBMI(value, next.height);
      next.weight = value;
    } else if (name === "height" && next.weight !== undefined) {
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
        error = INVALID_EMAIL_FORMAT_MSG;

      }
    }

    if (name === "patientMobileNumber") {
      if (value && !/^\d{10}$/.test(value)) {
        error = INVALID_MOBILE_NUMBER_MSG;
      }
    }

    // Update errors state
    setErrors((prevErrors) => {
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

      Object.keys(searchPayload).forEach((key) => {
        if (searchPayload[key] === "" || searchPayload[key] === undefined) {
          searchPayload[key] = null;
        }
      });

      const response = await postRequest(`${PATIENT_SEARCH}`, searchPayload);

      if (Array.isArray(response.response)) {
        setPatients(response.response);
        setSearchPerformed(true);
      } else {
        setPatients([]);
        setSearchPerformed(false);
        Swal.fire("Info",NO_PATIENTS_FOUND_MSG, "info");
      }
    } catch (error) {
      console.error(SEARCH_PATIENTS_ERROR_LOG, error);
      Swal.fire("Error",SEARCH_PATIENTS_FAILED_MSG, "error");
      setSearchPerformed(false);
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
      appointmentDate: "",
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
      patientRelation: "",
    });
    setAppointments([
      {
        id: 0,
        speciality: "",
        selDoctorId: "",
        selSession: "",
        departmentName: "",
        doctorName: "",
        sessionName: "",
        visitId: null,
      },
    ]);
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
      console.error(CAMERA_ACCESS_ERROR_LOG, error);
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
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/png");

      setImage(imageData);
      stopCamera();
      confirmUpload(imageData);
    }
  };

  const confirmUpload = (imageData) => {
    Swal.fire({
      title: IMAGE_TITLE,
      text: IMAGE_TEXT,
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
      const blob = await fetch(base64Image).then((res) => res.blob());
      const formData1 = new FormData();
      formData1.append("file", blob, "photo.png");

      const response = await fetch(`${API_HOST}${PATIENT_IMAGE_UPLOAD}`, {
        method: "POST",
        body: formData1,
      });

      const data = await response.json();

      if (response.status === 200 && data.response) {
        const extractedPath = data.response;

        setImageURL(extractedPath);
        console.log(UPLOADED_IMAGE_URL_LOG, extractedPath);

        Swal.fire("Success!", IMAGE_UPLOAD_SUCC_MSG, "success");
      } else {
        Swal.fire("Error!",IMAGE_UPLOAD_FAIL_MSG, "error");
      }
    } catch (error) {
      console.error(FILE_UPLOAD_ERROR_LOG, error);
      Swal.fire("Error!", SOMETHING_WENT_WRONG_MSG, "error");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      setIsCameraOn(false);
    }
  };

  const clearPhoto = () => {
    setImage(placeholderImage);
  };

  const handleEdit = async (patient) => {
    try {
      const patientId = patient.id;
      const response = await getRequest(
        `${PATIENT_FOLLOW_UP_DETAILS}/${patientId}`,
      );

      if (response.status === 200) {
        const data = response.response;
        const personal = data.personal || {};
        const address = data.address || {};
        const nok = data.nok || {};
        const emergency = data.emergency || {};

        const mappedPatientData = {
          id: patientId,
          uhidNo: patient.uhidNo || "",
          patientFn: personal.firstName || "",
          patientMn: personal.middleName || "",
          patientLn: personal.lastName || "",
          patientMobileNumber: personal.mobileNo || "",
          patientEmailId: personal.email || "",
          patientDob: personal.dob || "",
          patientAge: personal.age || "",
          patientGender: personal.gender ? { id: personal.gender } : "",
          patientRelation: personal.relation ? { id: personal.relation } : "",
          patientAddress1: address.address1 || "",
          patientAddress2: address.address2 || "",
          patientCity: address.city || "",
          patientPincode: address.pinCode || "",
          patientDistrict: address.district ? { id: address.district } : "",
          patientState: address.state ? { id: address.state } : "",
          patientCountry: address.country ? { id: address.country } : "",
          nokFn: nok.firstName || "",
          nokMn: nok.middleName || "",
          nokLn: nok.lastName || "",
          nokEmail: nok.email || "",
          nokMobileNumber: nok.mobileNo || "",
          nokAddress1: nok.address1 || "",
          nokAddress2: nok.address2 || "",
          nokCity: nok.city || "",
          nokPincode: nok.pinCode || "",
          nokDistrict: nok.district ? { id: nok.district } : "",
          nokState: nok.state ? { id: nok.state } : "",
          nokCountry: nok.country ? { id: nok.country } : "",
          emerFn: emergency.firstName || "",
          emerLn: emergency.lastName || "",
          emerMobile: emergency.mobileNo || "",
        };

        setPatientDetailForm(mappedPatientData);

        if (data.appointments && data.appointments.length > 0) {
          const mappedAppointments = data.appointments.map((appt, index) => {
            const extractDate = (dateString) => {
              if (!dateString) return null;
              if (dateString.includes("T")) return dateString.split("T")[0];
              if (dateString.includes(" ")) return dateString.split(" ")[0];
              return dateString;
            };

            const formatTimeToHHMM = (timeStr) => {
              if (!timeStr) return "";
              if (timeStr.includes(":")) {
                const parts = timeStr.split(":");
                if (parts.length >= 2) {
                  return `${parts[0]}:${parts[1]}`;
                }
              }
              return timeStr;
            };

            const startTime = formatTimeToHHMM(appt.tokenStartTime);
            const endTime = formatTimeToHHMM(appt.tokenEndTime);

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
              visitType:appt.visitType||null,
              tokenStartTime: startTime,
              tokenEndTime: endTime,
              selectedTimeSlot:
                startTime && endTime ? `${startTime} - ${endTime}` : "",
            };
          });

          setAppointments(mappedAppointments);
          setNextAppointmentId(mappedAppointments.length);
          setAppointmentFlag(true);

          mappedAppointments.forEach(async (appt) => {
            if (appt.speciality) {
              try {
                const doctorData = await getRequest(
                  `${DOCTOR_BY_SPECIALITY}${appt.speciality}`,
                );
                if (doctorData.status === 200) {
                  setDoctorDataMap((prev) => ({
                    ...prev,
                    [appt.id]: doctorData.response,
                  }));
                }
              } catch (err) {
                console.error(
                  `Error fetching doctors for speciality ${appt.speciality}:`,
                  err,
                );
              }
            }
          });
        } else {
          setAppointments([
            {
              id: 0,
              speciality: "",
              selDoctorId: "",
              selSession: "",
              departmentName: "",
              doctorName: "",
              sessionName: "",
              visitId: null,
              tokenNo: null,
              tokenStartTime: "",
              tokenEndTime: "",
              selectedTimeSlot: "",
            },
          ]);
          setNextAppointmentId(1);
          setAppointmentFlag(false);
        }

        setShowPatientDetails(true);
        setShowDetails(true);
      } else {
        Swal.fire(
          "Error",
          response.message || UNABLE_TO_LOAD_PATIENT_DETAILS,
          "error",
        );
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error",UNABLE_TO_LOAD_PATIENT_DETAILS, "error");
    }
  };

  async function fetchGenderData() {
    setLoading(true);

    try {
      const data = await getRequest(`${ALL_GENDER}/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setGenderData(data.response);
      } else {
        console.error(UNEXPECTED_API_RESPONSE_ERR, data);
        setGenderData([]);
      }
    } catch (error) {
      console.error(FETCH_DATA_ERROR, error);
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
        console.error(UNEXPECTED_API_RESPONSE_ERR, data);
        setRelationData([]);
      }
    } catch (error) {
      console.error(FETCH_DATA_ERROR, error);
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
        console.error(UNEXPECTED_API_RESPONSE_ERR, data);
        setCountryData([]);
      }
    } catch (error) {
      console.error(FETCH_DATA_ERROR, error);
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
        console.error(UNEXPECTED_API_RESPONSE_ERR, data);
        setStateData([]);
      }
    } catch (error) {
      console.error(FETCH_DATA_ERROR, error);
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
        console.error(UNEXPECTED_API_RESPONSE_ERR, data);
        setSession([]);
      }
    } catch (error) {
      console.error(FETCH_DATA_ERROR, error);
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
        console.error(UNEXPECTED_API_RESPONSE_ERR, data);
        setDistrictData([]);
      }
    } catch (error) {
      console.error(FETCH_DATA_ERROR, error);
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
        console.error(UNEXPECTED_API_RESPONSE_ERR, data);
        setNokStateData([]);
      }
    } catch (error) {
      console.error(FETCH_DATA_ERROR, error);
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
        console.error(UNEXPECTED_API_RESPONSE_ERR, data);
        setNokStateData([]);
      }
    } catch (error) {
      console.error(FETCH_DATA_ERROR, error);
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
        console.error(UNEXPECTED_API_RESPONSE_ERR, data);
        setNokDistrictData([]);
      }
    } catch (error) {
      console.error(FETCH_DATA_ERROR, error);
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
        console.error(UNEXPECTED_API_RESPONSE_ERR, data);
        setNokDistrictData([]);
      }
    } catch (error) {
      console.error(FETCH_DATA_ERROR, error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDepartment() {
    try {
      const data = await getRequest(`${ALL_DEPARTMENT}/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        const filteredDepartments = data.response.filter(
          (dept) => dept.departmentTypeId === DEPARTMENT_CODE_OPD,
        );
        setDepartmentData(filteredDepartments);
      } else {
        console.error(UNEXPECTED_API_RESPONSE_ERR, data);
        setDepartmentData([]);
      }
    } catch (error) {
      console.error(FETCH_DATA_ERROR, error);
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

    if (!patientDetailForm.id) {
      Swal.fire("Error",SELECT_PATIENT_TO_UPDATE_ERROR, "error");
      return;
    }

    if (appointmentFlag) {
      const validAppointments = appointments.filter(
        (appt) => appt.speciality && appt.selDoctorId && appt.selSession,
      );

      if (validAppointments.length === 0) {
        Swal.fire(
          "Error",
          ADD_AT_LEAST_ONE_APPOINTMENT_ERROR,
          "error",
        );
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
        console.error(UNEXPECTED_API_RESPONSE_ERR, data);
        setDoctorData([]);
      }
    } catch (error) {
      console.error(FETCH_DATA_ERROR, error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSession(doc) {
    console.log(doc.target.value);
    if (patientDetailForm.speciality != "" && doc) {
      console.log(doc);
      let timestamp = Date.now();
      let value = new Date(timestamp).toJSON().split(".")[0].split("T")[0];
      console.log(value);
      const data = await getRequest(
        `${GET_DOCTOR_SESSION}deptId=${patientDetailForm.speciality}&doctorId=${doc.target.value}&rosterDate=${value}`,
      );
      if (data.status == 200) {
        console.log(data.response[0].rosterVal);
        let sessionVal = [
          { key: 0, value: "" },
          { key: 1, value: "" },
        ];
        if (data.response[0].rosterVal == "YY") {
          sessionVal = [
            { key: 0, value: "Morning" },
            { key: 1, value: "Evening" },
          ];
        } else if (data.response[0].rosterVal == "NY") {
          sessionVal = [{ key: 0, value: "Evening" }];
        } else if (data.response[0].rosterVal == "YN") {
          sessionVal = [{ key: 0, value: "Morning" }];
        }
      } else {
        Swal.fire(data.message);
      }
    }
  }

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

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
      const hasValidAppointment = appointments.some(
        (a) => a.speciality && a.selDoctorId && a.selSession,
      );

      if (!hasValidAppointment) {
        return false;
      }

      const appointmentsWithDetails = appointments.filter(
        (appt) => appt.speciality && appt.selDoctorId && appt.selSession,
      );

      if (appointmentsWithDetails.length > 0) {
        const allHaveTimeSlots = appointmentsWithDetails.every(
          (appt) =>
            appt.selectedTimeSlot && appt.selectedTimeSlot.trim() !== "",
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
      Swal.fire(
        "Validation Error",
       CHECK_REQUIRED_FIELDS_ERROR,
        "error",
      );
      return;
    }

    const hospitalId = Number(sessionStorage.getItem("hospitalId"));
    const username = sessionStorage.getItem("username");
    const currentDate = new Date().toISOString();
    const currentDateOnly = new Date().toISOString().split("T")[0];

    const toInstant = (dateStr, timeStr) => {
      if (!dateStr || !timeStr) return null;
      const dateOnly = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;

      let timeWithSeconds = timeStr;
      if (timeStr && timeStr.split(":").length === 2) {
        timeWithSeconds = `${timeStr}:00`;
      }

      return `${dateOnly}T${timeWithSeconds}Z`;
    };

    const toNumber = (value) => {
      if (value === null || value === undefined || value === "") return null;
      const num = Number(value);
      return isNaN(num) ? null : num;
    };

    const extractId = (value) => {
      if (!value) return null;
      if (typeof value === "object" && value.id !== undefined)
        return toNumber(value.id);
      return toNumber(value);
    };

    const smartTruncate = (value, defaultMaxLength = 255) => {
      if (!value) return "";

      const strValue = String(value);

      if (strValue.startsWith("data:image")) {
        const timestamp = new Date().getTime();
        const extension = strValue.includes("image/png")
          ? "png"
          : strValue.includes("image/jpeg")
            ? "jpg"
            : strValue.includes("image/gif")
              ? "gif"
              : "img";
        return `patient_${
          patientDetailForm.id || "new"
        }_${timestamp}.${extension}`;
      }

      if (strValue.includes("http") && strValue.length > 200) {
        try {
          const url = new URL(strValue);
          const pathname = url.pathname;
          const filename =
            pathname.split("/").pop() || `image_${new Date().getTime()}.jpg`;
          return filename.substring(0, defaultMaxLength);
        } catch (e) {}
      }

      return strValue.length > defaultMaxLength
        ? strValue.substring(0, defaultMaxLength)
        : strValue;
    };

    const safeStringField = (fieldName, value, context = "patient") => {
      const strValue = smartTruncate(value);

      if (value && String(value).length > 255 && strValue.length === 255) {
        console.warn(
          `Field ${context}.${fieldName} was truncated from ${
            String(value).length
          } to 255 characters`,
        );
        console.warn(`Original value start:`, String(value).substring(0, 100));
      }

      return strValue;
    };

    const prepareData = (data, fieldName = "root") => {
      if (typeof data === "string") {
        return safeStringField(fieldName, data);
      }

      if (typeof data === "number" || typeof data === "boolean") {
        return data;
      }

      if (data === null || data === undefined) {
        return null;
      }

      if (Array.isArray(data)) {
        return data.map((item, index) =>
          prepareData(item, `${fieldName}[${index}]`),
        );
      }

      if (typeof data === "object") {
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
      patientImage: smartTruncate(imageURL || patientDetailForm.patientImage || "",),
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
      nokRelationId: null,
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
      departmentId:
        appointments.length > 0 ? toNumber(appointments[0].speciality) : null,
      hospitalId: hospitalId,
      doctorId:
        appointments.length > 0 ? toNumber(appointments[0].selDoctorId) : null,
      lastChgBy: username,
    };

    // 3. Prepare visits array
    const visitsArray = appointmentFlag
      ? appointments
          .filter(
            (appt) => appt.speciality && appt.selDoctorId && appt.selSession,
          )
          .map((appt) => {
            const startTime = toInstant(appt.selDate, appt.tokenStartTime);
            const endTime = toInstant(appt.selDate, appt.tokenEndTime);

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
              visitType: appt.visitType||"F",
              lastChgBy: username,
            };
          })
      : [];

    // 4. Create the final request and apply automatic validation
    const finalRequest = prepareData({
      appointmentFlag: appointmentFlag,
      patientDetails: {
        patient: patientRequest,
        opdPatientDetail: opdPatientDetailRequest,
        visits: visitsArray,
      },
    });

    console.log(FINAL_REQUEST_READY_LOG, finalRequest);

    try {
      Swal.fire({
        title: "Processing...",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await postRequest(PATIENT_FOLLOW_UP, finalRequest);

      Swal.close();

      if (response.status === 200) {
        const message = appointmentFlag
          ? PATIENT_UPDATE_WITH_APPOINTMENT_SUCCESS
          : PATIENT_UPDATE_SUCCESS;

        const resp = response.response?.opdBillingPatientResponse;
        const patientResp = response.response?.patient || response.response;

        // Get visit information
        const visits = patientResp?.visits || [];
        const hasBillingStatusY =
          visits.length > 0 && visits[0]?.billingStatus === "y";

        // Handle different scenarios like in registration page
        if (hasBillingStatusY) {
          // Direct redirect to PendingForBilling
          Swal.fire({
            title:PATIENT_UPDATED_SUCCESS_TITLE,
            html: `<p>Patient has been updated successfully.</p>
                 <p>Redirecting to pending billing...</p>`,
            icon: "success",
            showConfirmButton: false,
            timer: 1000,
            allowOutsideClick: false,
          }).then(() => {
            navigate("/PendingForBilling");
            window.location.reload();
          });
        } else if (resp) {
          // Show success dialog with option to go to billing
          Swal.fire({
            title:PATIENT_UPDATED_SUCCESS_TITLE,
            html: `
            <p><strong>${resp.patientName}</strong> has been updated successfully.</p>
            ${appointmentFlag ? `<p>Appointments have been scheduled.</p>` : ""}
            <p>Do you want to proceed to billing?</p>
          `,
            icon: "success",
            showCancelButton: true,
            confirmButtonText: "Proceed to Billing",
            cancelButtonText: "Close",
            allowOutsideClick: false,
          }).then((result) => {
            if (result.isConfirmed) {
              // Navigate to OPD billing details with patient data
              navigate("/OPDBillingDetails", {
                state: {
                  billingData: {
                    patientUhid: patientResp.uhidNo || patientDetailForm.uhidNo,
                    patientId: resp.patientid || patientDetailForm.id,
                    patientName:
                      resp.patientName ||
                      `${patientDetailForm.patientFn || ""} ${patientDetailForm.patientLn || ""}`.trim(),
                    mobileNo:
                      resp.mobileNo || patientDetailForm.patientMobileNumber,
                    age: resp.age || patientDetailForm.patientAge,
                    sex:
                      resp.sex ||
                      genderData.find(
                        (g) => g.id === patientDetailForm.patientGender?.id,
                      )?.genderName ||
                      "",
                    relation:
                      resp.relation ||
                      relationData.find(
                        (r) => r.id === patientDetailForm.patientRelation?.id,
                      )?.relationName ||
                      "",
                    address: resp.address || patientDetailForm.patientAddress1,
                    appointments:
                      resp.appointments ||
                      appointments.map((appt) => ({
                        departmentName: appt.departmentName,
                        doctorName: appt.doctorName,
                        sessionName: appt.sessionName,
                        visitDate: appt.selDate,
                        timeSlot: appt.selectedTimeSlot,
                      })),
                    details: resp.details || {},
                    billingHeaderIds: (resp.appointments || []).map(
                      (a) => a.billingHdId,
                    ),
                    registrationCost: resp.registrationCost || "0.00",
                  },
                },
              });
            } else if (result.dismiss === Swal.DismissReason.cancel) {
              // Reset form and go back to search
              handleReset();
            }
          });
        } else if (patientResp) {
          // Case: no billing response but patient saved (update without appointments)
          const displayName =
            patientResp.patientName ||
            `${patientDetailForm.patientFn || ""} ${patientDetailForm.patientLn || ""}`.trim();

          Swal.fire({
            title:PATIENT_UPDATED_SUCCESS_TITLE,
            html: `<p><strong>${displayName || "Patient"}</strong> has been updated successfully.</p>`,
            icon: "success",
            confirmButtonText: "OK",
            allowOutsideClick: false,
          }).then(() => {
            handleReset(); // Go back to search
          });
        } else {
          // Fallback success message
          Swal.fire({
            icon: "success",
            title: "Update Successful",
            text: PATIENT_UPDATE_SUCCESS,
          }).then(() => {
            handleReset(); // Go back to search
          });
        }
      } else {
        console.error(BACKEND_ERROR_RESPONSE_LOG, response);
        throw new Error(response.message || response.detail || "Update failed");
      }
    } catch (error) {
      console.error("Error in update:", error);

      if (error.message && error.message.includes("too long")) {
        const fieldMatch = error.message.match(/column "([^"]+)"/i);
        if (fieldMatch) {
          const fieldName = fieldMatch[1];
          Swal.fire({
            icon: "error",
            title: "Data Too Long",
            html: `The field <strong>${fieldName}</strong> contains too much data.<br/>
                 Please shorten the value and try again.`,
            confirmButtonText: "OK",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Data Too Long",
            text: MAX_LENGTH_EXCEEDED_ERROR_TEXT,
            confirmButtonText: "OK",
          });
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: error.message || FAILED_TO_UPDATE_PATIENT_ERROR,
          confirmButtonText: "OK",
        });
      }
    }
  };

  // Pagination calculations
  const filteredPatients = patients.filter((patient) => {
    const fullName = `${patient.patientFn || ""} ${patient.patientMn || ""} ${
      patient.patientLn || ""
    }`.toLowerCase();
    const mobile = patient.patientMobileNumber || "";

    return (
      fullName.includes(searchQuery.toLowerCase()) ||
      mobile.includes(mobileQuery)
    );
  });

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const currentItems = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Handle page change without refreshing
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
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
      <li
        key={index}
        className={`page-item ${number === currentPage ? "active" : ""}`}
      >
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

  const selectToken = async (
    appointmentIndex,
    tokenNo,
    tokenStartTime,
    tokenEndTime,
  ) => {
    try {
      const formatTime = (timeStr) => {
        if (!timeStr) return "";
        if (timeStr.includes(":")) {
          const parts = timeStr.split(":");
          if (parts.length === 3) {
            return `${parts[0]}:${parts[1]}`;
          }
          return timeStr;
        }
        return timeStr;
      };

      const formattedStartTime = formatTime(tokenStartTime);
      const formattedEndTime = formatTime(tokenEndTime);

      setAppointments((prev) =>
        prev.map((app, index) =>
          index === appointmentIndex
            ? {
                ...app,
                tokenNo,
                tokenStartTime: formattedStartTime,
                tokenEndTime: formattedEndTime,
                selectedTimeSlot: `${formattedStartTime} - ${formattedEndTime}`,
              }
            : app,
        ),
      );

      Swal.fire({
        icon: "success",
        title: "Token Selected",
        text: `Token ${formattedStartTime} to ${formattedEndTime} has been reserved.`,
        timer: 1500,
        showConfirmButton: false,
      });

      Swal.close();
    } catch (error) {
      console.error(SELECT_TOKEN_ERROR_LOG, error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: SELECT_TOKEN_ERROR_TEXT,
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
      Swal.fire("Invalid Page",INVALID_PAGE_NO_WARN_MSG, "warning");
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const onDateChange = (index, date) => {
    if (!date) return;

    // 1. Convert Date Object to YYYY-MM-DD safely
    let dateString = "";
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      dateString = `${year}-${month}-${day}`;
    } else {
      dateString = date.split("T")[0];
    }

    // 2. Validate using the fresh variable
    if (isPastDate(dateString)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Date",
        text: PAST_DATE_WARNING,
        timer: 2000,
      });
      setDateResetKey((prev) => prev + 1);
      return;
    }

    // 3. Get current appointment details
    const currentAppointment = appointments[index];

    // 4. Immediately fetch tokens with new date if all fields are selected
    if (
      currentAppointment.speciality &&
      currentAppointment.selDoctorId &&
      currentAppointment.selSession
    ) {
      fetchTokenAvailability(index, dateString);
    }

    // 5. Update State
    handleAppointmentChange(index, "selDate", dateString);
  };

  const fetchTokenAvailability = async (
    appointmentIndex = 0,
    dateOverride = null,
  ) => {
    try {
      setLoading(true);

      const targetAppointment = appointments[appointmentIndex];

      // Use the dateOverride if provided, otherwise use the stored date
      const selectedDate = dateOverride || targetAppointment.selDate;

      if (
        !targetAppointment.speciality ||
        !targetAppointment.selDoctorId ||
        !targetAppointment.selSession ||
        !selectedDate
      ) {
        Swal.fire({
          icon: "warning",
          title: "Incomplete Details",
          text: SELECT_SPECIALITY_DOCTOR_SESSION_MSG,
        });
        return;
      }

      const params = new URLSearchParams({
        deptId: targetAppointment.speciality,
        doctorId: targetAppointment.selDoctorId,
        appointmentDate: selectedDate,
        sessionId: targetAppointment.selSession,
      }).toString();

      const url = `${GET_AVAILABILITY_TOKENS}/0?${params}`;
      const data = await getRequest(url);

      if (data.status === 200 && Array.isArray(data.response)) {
        setAvailableTokens(data.response);
        showTokenPopup(
          data.response,
          targetAppointment.sessionName,
          selectedDate,
          appointmentIndex,
        );
      } else {
        Swal.fire({
          icon: "error",
          title: NO_TOKENS_AVAILABLE,
          text:
            data.message || NO_TOKENS_AVAILABLE_TEXT,
        });
        setAvailableTokens([]);
      }
    } catch (error) {
      console.error(FETCH_TOKEN_AVAILABILITY_ERROR_LOG, error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: FETCH_TOKEN_AVAILABILITY_ERROR,
      });
    } finally {
      setLoading(false);
    }
  };

  const showTokenPopup = (
    tokens = [],
    sessionName,
    appointmentDate,
    appointmentIndex,
  ) => {
    if (tokens.length === 0) {
      Swal.fire({
        icon: "info",
        title: "No Tokens Available",
        text: NO_TOKENS_AVAILABLE_INFO,
      });
      return;
    }

    Swal.fire({
      title: `Time Slots - Appointment ${appointmentIndex + 1}`,
      html: `
<div class="container-fluid">
  <div class="text-center mb-2">
    <h5 class="fw-bold mb-1">Available Time Slots</h5>
    <p class="text-muted small">Date: ${formatDateForDisplay(appointmentDate)} | Session: ${sessionName}</p>
  </div>
  <div class="row">
    <div class="col-12">
      <div class="card border-0 shadow-sm">
        <div class="card-body p-3">
          <h6 class="fw-bold mb-2 text-primary">${sessionName} Session</h6>
          <div class="row row-cols-4 g-1" id="token-slots">
            ${tokens
              .map((token) => {
                // Format display times to remove seconds
                const formatDisplayTime = (timeStr) => {
                  if (!timeStr) return "";
                  if (timeStr.includes(":")) {
                    const parts = timeStr.split(":");
                    if (parts.length >= 2) {
                      return `${parts[0]}:${parts[1]}`; // HH:mm
                    }
                  }
                  return timeStr;
                };

                const displayStart = formatDisplayTime(token.startTime);
                const displayEnd = formatDisplayTime(token.endTime);

                return `
                <div class="col">
                  <button type="button" 
                          class="btn ${
                            token.available
                              ? "btn-outline-success"
                              : "btn-outline-secondary disabled"
                          } w-100 d-flex flex-column align-items-center justify-content-center p-1" 
                          style="height: 65px; font-size: 0.75rem;"
                          data-token-id="${token.tokenNo || ""}"
                          data-token-starttime="${token.startTime || ""}"
                          data-token-endtime="${token.endTime || ""}"
                          ${!token.available ? "disabled" : ""}>
                    <span class="fw-bold">${displayStart}</span>
                    <span>${displayEnd}</span>
                    ${
                      !token.available
                        ? '<span class="badge bg-danger mt-0" style="font-size: 0.6rem;">Booked</span>'
                        : ""
                    }
                  </button>
                </div>
              `;
              })
              .join("")}
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
        document.querySelectorAll(".btn-outline-success").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const tokenNo = e.target
              .closest("button")
              .getAttribute("data-token-id");
            const tokenStartTime = e.target
              .closest("button")
              .getAttribute("data-token-starttime");
            const tokenEndTime = e.target
              .closest("button")
              .getAttribute("data-token-endtime");
            selectToken(
              appointmentIndex,
              tokenNo,
              tokenStartTime,
              tokenEndTime,
            );
          });
        });
      },
      customClass: {
        container: "swal2-bootstrap",
        popup: "border-0",
      },
    });
  };

  //for testing
  // const showTokenPopup = (
  //   tokens = [],
  //   sessionName,
  //   appointmentDate,
  //   appointmentIndex
  // ) => {
  //   if (tokens.length === 0) {
  //     Swal.fire({
  //       icon: "info",
  //       title: "No Tokens Available",
  //       text: "No tokens are available for the selected session.",
  //     });
  //     return;
  //   }

  //   Swal.fire({
  //     title: `Time Slots - Appointment ${appointmentIndex + 1}`,
  //     html: `
  // <div class="container-fluid">
  //   <div class="text-center mb-2">
  //     <h5 class="fw-bold mb-1">Available Time Slots</h5>
  //     <p class="text-muted small">Date: ${formatDateForDisplay(appointmentDate)} | Session: ${sessionName}</p>
  //     <p class="text-danger small"><strong>TESTING MODE:</strong> All tokens enabled regardless of availability</p>
  //   </div>
  //   <div class="row">
  //     <div class="col-12">
  //       <div class="card border-0 shadow-sm">
  //         <div class="card-body p-3">
  //           <h6 class="fw-bold mb-2 text-primary">${sessionName} Session</h6>
  //           <div class="row row-cols-4 g-1" id="token-slots">
  //             ${tokens
  //           .map((token) => {
  //             // Format display times to remove seconds
  //             const formatDisplayTime = (timeStr) => {
  //               if (!timeStr) return "";
  //               if (timeStr.includes(":")) {
  //                 const parts = timeStr.split(":");
  //                 if (parts.length >= 2) {
  //                   return `${parts[0]}:${parts[1]}`; // HH:mm
  //                 }
  //               }
  //               return timeStr;
  //             };

  //             const displayStart = formatDisplayTime(token.startTime);
  //             const displayEnd = formatDisplayTime(token.endTime);

  //             // TESTING MODIFICATION: Always show as available
  //             const isAvailable = true; // Force all tokens to be available for testing

  //             // Color coding based on original availability for visual reference
  //             const buttonClass = token.available
  //               ? "btn-outline-success"
  //               : "btn-outline-warning"; // Changed from disabled to warning for unavailable tokens

  //             return `
  //                 <div class="col">
  //                   <button type="button"
  //                           class="btn ${buttonClass} w-100 d-flex flex-column align-items-center justify-content-center p-1"
  //                           style="height: 65px; font-size: 0.75rem;"
  //                           data-token-id="${token.tokenNo || ""}"
  //                           data-token-starttime="${token.startTime || ""}"
  //                           data-token-endtime="${token.endTime || ""}"
  //                           data-original-available="${token.available}">
  //                     <span class="fw-bold">${displayStart}</span>
  //                     <span>${displayEnd}</span>
  //                     ${!token.available
  //                 ? '<span class="badge bg-danger mt-0" style="font-size: 0.6rem;">Booked</span>'
  //                 : ""
  //               }
  //                   </button>
  //                 </div>
  //               `;
  //           })
  //           .join("")}
  //           </div>
  //           <div class="mt-3 text-center">
  //             <small class="text-muted">
  //               <span class="badge bg-success me-2">Available</span>
  //               <span class="badge bg-warning me-2">Originally Unavailable (Testing)</span>
  //               <span class="badge bg-danger">Booked</span>
  //             </small>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // </div>
  // `,
  //     showCloseButton: true,
  //     showConfirmButton: false,
  //     width: 550,
  //     padding: "1rem",
  //     didOpen: () => {
  //       document.querySelectorAll("#token-slots button").forEach((btn) => {
  //         btn.addEventListener("click", (e) => {
  //           const tokenNo = e.target
  //             .closest("button")
  //             .getAttribute("data-token-id");
  //           const tokenStartTime = e.target
  //             .closest("button")
  //             .getAttribute("data-token-starttime");
  //           const tokenEndTime = e.target
  //             .closest("button")
  //             .getAttribute("data-token-endtime");
  //           const originalAvailable = e.target
  //             .closest("button")
  //             .getAttribute("data-original-available");

  //           // Log for testing
  //           console.log("Token selected for testing:", {
  //             tokenNo,
  //             tokenStartTime,
  //             tokenEndTime,
  //             originalAvailable: originalAvailable === "true",
  //             appointmentIndex
  //           });

  //           selectToken(
  //             appointmentIndex,
  //             tokenNo,
  //             tokenStartTime,
  //             tokenEndTime
  //           );
  //         });
  //       });
  //     },
  //     customClass: {
  //       container: "swal2-bootstrap",
  //       popup: "border-0",
  //     },
  //   });
  // };

  if (showPatientDetails) {
    return (
      <div className="body d-flex py-3">
        <div className="container-xxl">
          <div className="row align-items-center">
            <div className="border-0 mb-4">
              <div className="card-header py-3 no-bg bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap">
                <div className="d-flex align-items-center w-100">
                  <h3 className="fw-bold mb-0">
                    Update Patient Registration and Followup Appointment
                  </h3>

                  <button
                    className="btn btn-secondary ms-auto me-3"
                    onClick={handleReset}
                  >
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
                            <label className="form-label">
                              First Name <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              name="patientFn"
                              onChange={handleChange}
                              className="form-control"
                              placeholder="Enter First Name"
                              required
                              value={patientDetailForm.patientFn || ""}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Middle Name</label>
                            <input
                              type="text"
                              name="patientMn"
                              onChange={handleChange}
                              className="form-control"
                              placeholder="Enter Middle Name"
                              value={patientDetailForm.patientMn || ""}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Last Name</label>
                            <input
                              type="text"
                              name="patientLn"
                              onChange={handleChange}
                              className="form-control"
                              placeholder="Enter Last Name"
                              value={patientDetailForm.patientLn || ""}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Mobile No.</label>
                            <input
                              type="text"
                              name="patientMobileNumber"
                              className="form-control"
                              placeholder="Enter Mobile Number"
                              value={
                                patientDetailForm.patientMobileNumber || ""
                              }
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label" htmlFor="gender">
                              Gender <span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
                              name="patientGender"
                              value={patientDetailForm.patientGender?.id || ""}
                              onChange={(e) => {
                                const selectedGender = genderData.find(
                                  (g) => g.id === Number(e.target.value),
                                );
                                handleChange({
                                  target: {
                                    name: "patientGender",
                                    value: selectedGender,
                                  },
                                });
                              }}
                            >
                              <option value="">Select</option>
                              {genderData.map((gender) => (
                                <option key={gender.id} value={gender.id}>
                                  {gender.genderName}
                                </option>
                              ))}
                            </select>
                            {errors.patientGender && (
                              <div className="invalid-feedback">
                                {errors.patientGender}
                              </div>
                            )}
                          </div>
                          <div className="col-md-4">
                            <label className="form-label" htmlFor="relation">
                              Relation <span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
                              name="patientRelation"
                              value={
                                patientDetailForm.patientRelation?.id || ""
                              }
                              onChange={(e) => {
                                const selectedRelation = relationData.find(
                                  (r) => r.id === Number(e.target.value),
                                );
                                handleChange({
                                  target: {
                                    name: "patientRelation",
                                    value: selectedRelation,
                                  },
                                });
                              }}
                            >
                              <option value="">Select</option>
                              {relationData.map((relation) => (
                                <option key={relation.id} value={relation.id}>
                                  {relation.relationName}
                                </option>
                              ))}
                            </select>
                            {errors.patientRelation && (
                              <div className="invalid-feedback">
                                {errors.patientRelation}
                              </div>
                            )}
                          </div>
                          <div className="col-md-4">
                            <label className="form-label" htmlFor="dob">
                              DOB <span className="text-danger">*</span>
                            </label>
                            <input
                              type="date"
                              id="dob"
                              name="dob"
                              className={`form-control ${
                                errors.patientDob ? "is-invalid" : ""
                              }`}
                              value={patientDetailForm.patientDob}
                              max={new Date().toISOString().split("T")[0]}
                              onChange={handleChange}
                              placeholder="Select Date of Birth"
                            />
                            {errors.patientDob && (
                              <div className="invalid-feedback">
                                {errors.patientDob}
                              </div>
                            )}
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Age</label>
                            <input
                              type="text"
                              id="age"
                              name="age"
                              className={`form-control ${
                                errors.age ? "is-invalid" : ""
                              }`}
                              value={patientDetailForm.patientAge || ""}
                              onChange={handleChange}
                              placeholder="Enter Age"
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Email </label>
                            <input
                              type="email"
                              className={`form-control ${
                                errors.patientEmailId ? "is-invalid" : ""
                              }`}
                              placeholder="Enter Email Address"
                              name="patientEmailId"
                              value={patientDetailForm.patientEmailId || ""}
                              onChange={handleChange}
                              required
                            />
                            {errors.patientEmailId && (
                              <div className="invalid-feedback">
                                {errors.patientEmailId}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="col-md-3">
                        <div className="text-center">
                          <div className="card p-3 shadow">
                            {isCameraOn ? (
                              <video
                                ref={videoRef}
                                autoPlay
                                className="d-block mx-auto"
                                style={{ width: "100%", height: "150px" }}
                              ></video>
                            ) : (
                              <img
                                src={image || placeholderImage}
                                alt="Profile"
                                className="img-fluid border"
                                style={{ width: "100%", height: "150px" }}
                              />
                            )}
                            <canvas
                              ref={canvasRef}
                              width="300"
                              height="150"
                              style={{ display: "none" }}
                            ></canvas>
                            <div className="mt-2">
                              <button
                                type="button"
                                className="btn btn-primary me-2 mb-2"
                                onClick={startCamera}
                                disabled={isCameraOn}
                              >
                                Start Camera
                              </button>
                              {isCameraOn && (
                                <button
                                  type="button"
                                  className="btn btn-success me-2 mb-2"
                                  onClick={capturePhoto}
                                >
                                  Take Photo
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btn-danger mb-2"
                                onClick={clearPhoto}
                              >
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
                        <input
                          type="text"
                          className="form-control"
                          value={patientDetailForm.patientAddress1 || ""}
                          name="patientAddress1"
                          placeholder="Enter Address 1"
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Address 2</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter Address 2"
                          name="patientAddress2"
                          value={patientDetailForm.patientAddress2 || ""}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Country</label>
                        <select
                          className="form-select"
                          name="patientCountry"
                          value={
                            patientDetailForm.patientCountry
                              ? JSON.stringify(patientDetailForm.patientCountry)
                              : ""
                          }
                          onChange={(e) => {
                            const selectedCountry = JSON.parse(e.target.value);
                            handleAddChange({
                              target: {
                                name: "patientCountry",
                                value: selectedCountry,
                              },
                            });
                            fetchStates(selectedCountry.id);
                          }}
                        >
                          <option value="">Select Country</option>
                          {countryData.map((country) => (
                            <option
                              key={country.id}
                              value={JSON.stringify(country)}
                            >
                              {country.countryName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">State</label>
                        <select
                          className="form-select"
                          name="patientState"
                          value={
                            patientDetailForm.patientState
                              ? patientDetailForm.patientState.id
                              : ""
                          }
                          onChange={(e) => {
                            const selectedState = stateData.find(
                              (state) =>
                                state.id === parseInt(e.target.value, 10),
                            );
                            handleAddChange({
                              target: {
                                name: "patientState",
                                value: selectedState,
                              },
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
                          value={
                            patientDetailForm.patientDistrict
                              ? patientDetailForm.patientDistrict.id
                              : ""
                          }
                          onChange={(e) => {
                            const selectedDistrictId = parseInt(
                              e.target.value,
                              10,
                            );
                            const selectedDistrict = districtData.find(
                              (district) => district.id === selectedDistrictId,
                            );
                            handleAddChange({
                              target: {
                                name: "patientDistrict",
                                value: selectedDistrict,
                              },
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
                        <input
                          type="text"
                          className="form-control"
                          name="patientCity"
                          value={patientDetailForm.patientCity}
                          onChange={handleChange}
                          placeholder="Enter City"
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Pin Code</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter Pin Code"
                          name="patientPincode"
                          onChange={handleChange}
                          value={patientDetailForm.patientPincode || ""}
                        />
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
                        <input
                          type="text"
                          className="form-control"
                          onChange={handleChange}
                          name="nokFn"
                          value={patientDetailForm.nokFn || ""}
                          placeholder="Enter First Name"
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Middle Name</label>
                        <input
                          type="text"
                          className="form-control"
                          onChange={handleChange}
                          name="nokMn"
                          placeholder="Enter Middle Name"
                          value={patientDetailForm.nokMn || ""}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Last Name</label>
                        <input
                          type="text"
                          className="form-control"
                          onChange={handleChange}
                          name="nokLn"
                          placeholder="Enter Last Name"
                          value={patientDetailForm.nokLn || ""}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          onChange={handleChange}
                          name="nokEmail"
                          placeholder="Enter Email"
                          value={patientDetailForm.nokEmail || ""}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Mobile No.</label>
                        <input
                          type="text"
                          className="form-control"
                          onChange={handleChange}
                          name="nokMobileNumber"
                          placeholder="Enter Mobile Number"
                          value={patientDetailForm.nokMobileNumber || ""}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Address 1</label>
                        <input
                          type="text"
                          className="form-control"
                          onChange={handleChange}
                          name="nokAddress1"
                          placeholder="Enter Address 1"
                          value={patientDetailForm.nokAddress1 || ""}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Address 2</label>
                        <input
                          type="text"
                          className="form-control"
                          onChange={handleChange}
                          name="nokAddress2"
                          placeholder="Enter Address 2"
                          value={patientDetailForm.nokAddress2 || ""}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Country</label>
                        <select
                          className="form-select"
                          name="nokCountry"
                          value={
                            patientDetailForm.nokCountry
                              ? JSON.stringify(patientDetailForm.nokCountry)
                              : ""
                          }
                          onChange={(e) => {
                            const selectedCountry = JSON.parse(e.target.value);
                            handleAddChange({
                              target: {
                                name: "nokCountry",
                                value: selectedCountry,
                              },
                            });
                            fetchNokStates(selectedCountry.id);
                          }}
                        >
                          <option value="">Select Country</option>
                          {countryData.map((country) => (
                            <option
                              key={country.id}
                              value={JSON.stringify(country)}
                            >
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
                          value={
                            patientDetailForm.nokState
                              ? patientDetailForm.nokState.id
                              : ""
                          }
                          onChange={(e) => {
                            const selectedStateId = parseInt(
                              e.target.value,
                              10,
                            );
                            const selectedState = nokStateData.find(
                              (state) => state.id === selectedStateId,
                            );
                            handleAddChange({
                              target: {
                                name: "nokState",
                                value: selectedState,
                              },
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
                          value={
                            patientDetailForm.nokDistrict
                              ? patientDetailForm.nokDistrict.id
                              : ""
                          }
                          onChange={(e) => {
                            const selectedDistrictId = parseInt(
                              e.target.value,
                              10,
                            );
                            const selectedDistrict = nokDistrictData.find(
                              (district) => district.id === selectedDistrictId,
                            );
                            handleAddChange({
                              target: {
                                name: "nokDistrict",
                                value: selectedDistrict,
                              },
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
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter City"
                          onChange={handleChange}
                          name="nokCity"
                          value={patientDetailForm.nokCity || ""}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Pin Code</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter Pin Code"
                          onChange={handleChange}
                          name="nokPincode"
                          value={patientDetailForm.nokPincode || ""}
                        />
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
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter First Name"
                          onChange={handleChange}
                          name="emerFn"
                          value={patientDetailForm.emerFn || ""}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Last Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter Last Name"
                          onChange={handleChange}
                          name="emerLn"
                          value={patientDetailForm.emerLn || ""}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Mobile No.</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter Mobile Number"
                          onChange={handleChange}
                          name="emerMobile"
                          value={patientDetailForm.emerMobile || ""}
                        />
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
                          <label className="form-label me-2">
                            Patient Height<span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            className={`form-control ${
                              errors.height ? "is-invalid" : ""
                            }`}
                            placeholder="Height"
                            name="height"
                            value={patientDetailForm.height}
                            onChange={handleChange}
                          />
                          <span className="input-group-text">cm</span>
                          {errors.height && (
                            <div className="invalid-feedback d-block">
                              {errors.height}
                            </div>
                          )}
                        </div>

                        {/* Weight */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">
                            Weight<span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className={`form-control ${
                              errors.weight ? "is-invalid" : ""
                            }`}
                            placeholder="Weight"
                            name="weight"
                            value={patientDetailForm.weight}
                            onChange={handleChange}
                          />
                          <span className="input-group-text">kg</span>
                          {errors.weight && (
                            <div className="invalid-feedback d-block">
                              {errors.weight}
                            </div>
                          )}
                        </div>

                        {/* Temperature */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">
                            Temperature<span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className={`form-control ${
                              errors.temperature ? "is-invalid" : ""
                            }`}
                            placeholder="Temperature"
                            name="temperature"
                            value={patientDetailForm.temperature}
                            onChange={handleChange}
                          />
                          <span className="input-group-text">°F</span>
                          {errors.temperature && (
                            <div className="invalid-feedback d-block">
                              {errors.temperature}
                            </div>
                          )}
                        </div>

                        {/* BP (Systolic / Diastolic) */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">
                            BP<span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className={`form-control ${
                              errors.systolicBP ? "is-invalid" : ""
                            }`}
                            placeholder="Systolic"
                            name="systolicBP"
                            value={patientDetailForm.systolicBP}
                            onChange={handleChange}
                          />
                          <span className="input-group-text">/</span>
                          {errors.systolicBP && (
                            <div className="invalid-feedback d-block">
                              {errors.systolicBP}
                            </div>
                          )}
                          <input
                            type="text"
                            className={`form-control ${
                              errors.diastolicBP ? "is-invalid" : ""
                            }`}
                            placeholder="Diastolic"
                            name="diastolicBP"
                            value={patientDetailForm.diastolicBP}
                            onChange={handleChange}
                          />
                          <span className="input-group-text">mmHg</span>
                          {errors.diastolicBP && (
                            <div className="invalid-feedback d-block">
                              {errors.diastolicBP}
                            </div>
                          )}
                        </div>

                        {/* Pulse */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">
                            Pulse<span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className={`form-control ${
                              errors.pulse ? "is-invalid" : ""
                            }`}
                            placeholder="Pulse"
                            name="pulse"
                            value={patientDetailForm.pulse}
                            onChange={handleChange}
                          />
                          <span className="input-group-text">/min</span>
                          {errors.pulse && (
                            <div className="invalid-feedback d-block">
                              {errors.pulse}
                            </div>
                          )}
                        </div>

                        {/* BMI */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">BMI</label>
                          <input
                            type="text"
                            className={`form-control ${
                              errors.bmi ? "is-invalid" : ""
                            }`}
                            placeholder="BMI"
                            name="bmi"
                            value={patientDetailForm.bmi}
                            onChange={handleChange}
                          />
                          <span className="input-group-text">kg/m²</span>
                          {errors.bmi && (
                            <div className="invalid-feedback d-block">
                              {errors.bmi}
                            </div>
                          )}
                        </div>

                        {/* RR */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">RR</label>
                          <input
                            type="text"
                            className={`form-control ${
                              errors.rr ? "is-invalid" : ""
                            }`}
                            placeholder="RR"
                            name="rr"
                            value={patientDetailForm.rr}
                            onChange={handleChange}
                          />
                          <span className="input-group-text">/min</span>
                          {errors.rr && (
                            <div className="invalid-feedback d-block">
                              {errors.rr}
                            </div>
                          )}
                        </div>

                        {/* SpO2 */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">SpO2</label>
                          <input
                            type="text"
                            className={`form-control ${
                              errors.spo2 ? "is-invalid" : ""
                            }`}
                            placeholder="SpO2"
                            name="spo2"
                            value={patientDetailForm.spo2}
                            onChange={handleChange}
                          />
                          <span className="input-group-text">%</span>
                          {errors.height && (
                            <div className="invalid-feedback d-block">
                              {errors.spo2}
                            </div>
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
                        <label
                          className="form-check-label"
                          htmlFor="updateInfo"
                        >
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
                        <label
                          className="form-check-label"
                          htmlFor="appointment"
                        >
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
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary text-white"
                        onClick={addAppointmentRow}
                      >
                        + Add Appointment
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    <form>
                      {appointments.map((appointment, index) => {
                        const doctorOptions =
                          doctorDataMap[appointment.id] || [];
                        return (
                          <div
                            className="row g-3 mb-3 border-bottom pb-3"
                            key={`appointment-${appointment.id}`}
                          >
                            <div className="col-12 d-flex align-items-center justify-content-between">
                              <h6 className="fw-bold text-muted mb-0">
                                Appointment {index + 1}
                                {appointment.visitId && (
                                  <span className="text-success ms-2">
                                    (Existing)
                                  </span>
                                )}
                              </h6>
                              {appointments.length > 1 && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() =>
                                    removeAppointmentRow(appointment.id)
                                  }
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
                                onChange={(e) =>
                                  handleSpecialityChange(
                                    appointment.id,
                                    e.target.value,
                                  )
                                }
                                required
                              >
                                <option value="">Select Speciality</option>
                                {departmentData.map((department) => (
                                  <option
                                    key={department.id}
                                    value={department.id}
                                  >
                                    {department.departmentName}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">
                                Doctor Name *
                              </label>
                              <select
                                className="form-select"
                                value={appointment.selDoctorId}
                                onChange={(e) =>
                                  handleDoctorChange(
                                    appointment.id,
                                    e.target.value,
                                    appointment.speciality,
                                  )
                                }
                                required
                                disabled={!appointment.speciality}
                              >
                                <option value="">Select Doctor</option>
                                {doctorOptions.map((doctor) => (
                                  <option
                                    key={doctor.userId}
                                    value={doctor.userId}
                                  >
                                    {`${doctor.firstName} ${
                                      doctor.middleName ? doctor.middleName : ""
                                    } ${
                                      doctor.lastName ? doctor.lastName : ""
                                    }`}
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
                                    appointment.selDoctorId,
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
                              <div className="col-md-12">
                                <DatePicker
                                  key={dateResetKey + "-" + index}
                                  value={appointment.selDate || null}
                                  onChange={(date) => onDateChange(index, date)}
                                  placeholder="Select Date"
                                  className="form-control"
                                />
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
                                style={{
                                  backgroundColor: appointment.selectedTimeSlot
                                    ? "#f0fff0"
                                    : "#f8f9fa",
                                }}
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
                      <button
                        type="button"
                        onClick={handleSubmit}
                        className="btn btn-primary me-2"
                        disabled={!isFormValid()}
                      >
                        Update Registration
                      </button>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="btn btn-secondary"
                      >
                        Reset
                      </button>
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

  return (
    <div className="body d-flex py-3">
      <div className="container-xxl">
        <div className="row align-items-center">
          <div className="border-0 mb-4">
            <div className="card-header py-3 no-bg bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap">
              <h3 className="fw-bold mb-0">
                Update Patient Registration and Followup Appointment
              </h3>
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
                      {loading ? "Searching..." : "Search"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleReset}
                    >
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
                                  {`${patient.patientFn || ""} ${
                                    patient.patientMn || ""
                                  } ${patient.patientLn || ""}`.trim()}
                                </td>
                                <td>{patient.patientMobileNumber || ""}</td>
                                <td>{patient.uhidNo || ""}</td>
                                <td>{patient.patientAge || ""}</td>
                                <td>
                                  {patient.patientGender?.genderName || ""}
                                </td>
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
                        Page {currentPage} of {totalPages} | Total Records:{" "}
                        {filteredPatients.length}
                      </span>
                    </div>
                    <ul className="pagination mb-0">
                      <li
                        className={`page-item ${
                          currentPage === 1 ? "disabled" : ""
                        }`}
                      >
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
                      <li
                        className={`page-item ${
                          currentPage === totalPages ? "disabled" : ""
                        }`}
                      >
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
