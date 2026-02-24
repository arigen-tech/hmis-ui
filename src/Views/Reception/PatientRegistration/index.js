import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import placeholderImage from "../../../assets/images/placeholder.jpg";
import { getRequest, postRequest } from "../../../service/apiService";

import DatePicker from "../../../Components/DatePicker";
import {
  ALL_COUNTRY,
  ALL_DEPARTMENT,
  ALL_GENDER,
  ALL_RELATION,
  API_HOST,
  CHECH_DUPLICATE_PATIENT,
  DISTRICT_BY_STATE,
  DOCTOR_BY_SPECIALITY,
  GET_DOCTOR_SESSION,
  GET_SESSION,
  GET_TOKENS,
  HOSPITAL,
  MAS_SERVICE_CATEGORY,
  PATIENT_IMAGE_UPLOAD,
  PATIENT_REGISTRATION,
  STATE_BY_COUNTRY,
} from "../../../config/apiConfig";
import { DEPARTMENT_CODE_OPD,NO_TIME_SLOTS_AVAILABLE_MSG,FETCH_TOKEN_AVAILABILITY_ERROR_LOG,
FETCH_TOKEN_AVAILABILITY_ERROR,CAMERA_ACCESS_ERROR_LOG,UNEXPECTED_API_RESPONSE_ERR,FETCH_DATA_ERROR,
IMAGE_TEXT,IMAGE_TITLE,IMAGE_UPLOAD_FAIL_MSG,IMAGE_UPLOAD_SUCC_MSG,UNEXPECTED_ERROR,UNEXPECTED_RESPONSE_MSG,
FILE_UPLOAD_ERROR_LOG,PAST_DATE_WARNING,DUPLICATE_PATIENT,DUPLICATE_CHECK_FAILED_LOG,SELECT_TOKEN_ERROR_TEXT,
SELECT_TIME_SLOTS_BEFORE_REGISTRATION_MSG,INCOMPLETE_FORM_TITLE,INCOMPLETE_FORM_MSG,PATIENT_REGISTERED_SUCCESS_TITLE,
PATIENT_REGISTRATION_FAILED_MSG,NO_TOKENS_SELECTED_SESSION_MSG,NO_TOKENS_AVAILABLE,SELECT_TOKEN_ERROR_LOG,
INVALID_EMAIL_FORMAT_MSG,INVALID_MOBILE_NUMBER_MSG,PIN_CODE_INVALID_MSG,MOBILE_NUMBER_INVALID_MSG,UPLOADED_IMAGE_URL_LOG,
DOB_REQUIRED_ERROR,AGE_FORMAT_ERROR,FIRST_NAME_REQUIRED_ERROR,GENDER_REQUIRED_ERROR,INVALID_DATE_TITLE,
RELATION_REQUIRED_ERROR,MOBILE_REQUIRED_ERROR,AGE_NEGATIVE_ERROR,MISSING_TIME_SLOTS_TITLE,NOT_AVAILABLE_TITLE,
  } from "../../../config/constants";

const PatientRegistration = () => {
  const navigate = useNavigate();
  useEffect(() => {
    // Fetching gender data (simulated API response)
    fetchGenderData();
    fetchRelationData();
    fetchCountryData();
    fetchDepartment();
    fetchSesion();
    fetchHospitalDetails();
    fetchGstConfiguration();
  }, []);

  // Add state for registration mode
  const [registrationMode, setRegistrationMode] = useState("registerOnly"); // "registerOnly" or "withAppointment"

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [genderData, setGenderData] = useState([]);
  const [imageURL, setImageURL] = useState("");
  const [relationData, setRelationData] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [stateData, setStateData] = useState([]);
  const [nokStateData, setNokStateData] = useState([]);
  const [districtData, setDistrictData] = useState([]);
  const [nokDistrictData, setNokDistrictData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [doctorDataMap, setDoctorDataMap] = useState({});
  const [session, setSession] = useState([]);
  const [isDuplicatePatient, setIsDuplicatePatient] = useState(false);
  const [availableTokens, setAvailableTokens] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [dateResetKey, setDateResetKey] = useState(0);
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
      discount: 0,
      netAmount: "0.00",
      gst: "0.00",
      totalAmount: "0.00",

      tokenNo: null,
      tokenStartTime: "",
      tokenEndTime: "",
      selectedTimeSlot: "",
    },
  ]);
  const [nextAppointmentId, setNextAppointmentId] = useState(1);
  const [formData, setFormData] = useState({
    imageurl: "",
    firstName: "",
    middleName: "",
    lastName: "",
    mobileNo: "",
    gender: "",
    relation: "",
    dob: "",
    age: "",
    email: "",
    address1: "",
    address2: "",
    country: "",
    state: "",
    district: "",
    city: "",
    pinCode: "",
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
    emergencyFirstName: "",
    emergencyLastName: "",
    emergencyMobile: "",
    height: "",
    weight: "",
    temperature: "",
    systolicBP: "",
    diastolicBP: "",
    pulse: "",
    bmi: "",
    rr: "",
    spo2: "",
    speciality: "",
    doctor: "",
    session: "",
    appointmentDate: "",
    maritalStatus: "",
    religion: "",
    emergencyRelationId: "",
    nokRelation: "",
    idealWeight: "",
    varation: "",
    department: "",
    selDoctorId: "",
    selSession: "",
    registrationCost: "",
  });
  const [image, setImage] = useState(placeholderImage);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [preConsultationFlag, setPreConsultationFlag] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  let stream = null;

  const [gstConfig, setGstConfig] = useState({
    gstApplicable: false,
    gstPercent: 0,
  });

  const isFormValid = () => {
    // Required fields
    const requiredFields = [
      "firstName",
      "gender",
      "relation",
      "dob",
      "mobileNo",
    ];

    for (let field of requiredFields) {
      if (!formData[field] || formData[field].trim() === "") {
        return false;
      }
    }

    // Only validate appointments if in "withAppointment" mode
    if (registrationMode === "withAppointment") {
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
          (appt) => appt.selectedTimeSlot && appt.selectedTimeSlot.trim() !== "",
        );

        if (!allHaveTimeSlots) {
          return false;
        }
      }
    }
    
    return true;
  };

  // Handle registration mode change
  const handleRegistrationModeChange = (mode) => {
    setRegistrationMode(mode);
    
    // If switching to "registerOnly", clear any appointment data if needed
    if (mode === "registerOnly") {
      // Optional: Reset appointments to empty state
      setAppointments([
        {
          id: 0,
          speciality: "",
          selDoctorId: "",
          selSession: "",
          selDate: null,
          departmentName: "",
          doctorName: "",
          sessionName: "",
          discount: 0,
          netAmount: "0.00",
          gst: "0.00",
          totalAmount: "0.00",
          tokenNo: null,
          tokenStartTime: "",
          tokenEndTime: "",
          selectedTimeSlot: "",
        },
      ]);
    }
  };

  const createInstant = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;

    let formattedTime = timeStr;
    if (formattedTime && formattedTime.split(":").length === 2) {
      formattedTime = `${formattedTime}:00`;
    }

    return `${dateStr}T${formattedTime}Z`;
  };

  const fetchTokenAvailability = async (appointmentIndex = 0, dateOverride) => {
    try {
      setLoading(true);

      const targetAppointment = appointments[appointmentIndex];
      const selectedDate = dateOverride;
      if (Swal.isVisible()) {
        return;
      }

      if (
        !targetAppointment.speciality ||
        !targetAppointment.selDoctorId ||
        !targetAppointment.selSession ||
        !selectedDate
      ) {
        return;
      }

      const params = new URLSearchParams({
        deptId: targetAppointment.speciality,
        doctorId: targetAppointment.selDoctorId,
        appointmentDate: selectedDate,
        sessionId: targetAppointment.selSession,
      }).toString();

      const url = `${GET_TOKENS}/0?${params}`;
      const data = await getRequest(url);

      if (data.status === 400) {
        if (!Swal.isVisible()) {
          Swal.fire({
            icon: "warning",
            title: NOT_AVAILABLE_TITLE,
            text:
              data.message,
            timer: 4000,
          });
        }
      }

      if (data.status === 200 && Array.isArray(data.response)) {
        const availableTokens = data.response;

        if (availableTokens.length > 0) {
          if (!Swal.isVisible()) {
            showTokenPopup(
              availableTokens,
              targetAppointment.sessionName,
              selectedDate,
              appointmentIndex,
            );
          }
        } else {
          if (!Swal.isVisible()) {
            Swal.fire({
              icon: "info",
              title: NO_TOKENS_AVAILABLE,
              text: NO_TIME_SLOTS_AVAILABLE_MSG,
              timer: 3000,
            });
          }
        }
      }
    } catch (error) {
      console.error(FETCH_TOKEN_AVAILABILITY_ERROR_LOG, error);
      if (!Swal.isVisible()) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: FETCH_TOKEN_AVAILABILITY_ERROR,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  async function fetchGstConfiguration() {
    try {
      const url = `${MAS_SERVICE_CATEGORY}/getGstConfig/1`;
      const data = await getRequest(url);
      if (
        data &&
        data.status === 200 &&
        data.response &&
        typeof data.response.gstApplicable !== "undefined"
      ) {
        setGstConfig({
          gstApplicable: !!data.response.gstApplicable,
          gstPercent: Number(data.response.gstPercent) || 0,
        });
      } else {
        setGstConfig({ gstApplicable: false, gstPercent: 0 });
      }
    } catch (error) {
      console.error("GST Fetch Error:", error);
      setGstConfig({ gstApplicable: false, gstPercent: 0 });
    }
  }

  const startCamera = async () => {
    try {
      setIsCameraOn(true);
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

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

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

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      setIsCameraOn(false);
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

        Swal.fire("Success!",IMAGE_UPLOAD_SUCC_MSG, "success");
      } else {
        Swal.fire("Error!",IMAGE_UPLOAD_FAIL_MSG, "error");
      }
    } catch (error) {
      console.error(FILE_UPLOAD_ERROR_LOG, error);
      Swal.fire("Error!",UNEXPECTED_ERROR, "error");
    }
  };

  const clearPhoto = () => {
    setImage(placeholderImage);
  };

  function calculateDOBFromAge(age) {
    const today = new Date();
    const birthYear = today.getFullYear() - age;

    return new Date(birthYear, today.getMonth(), today.getDate())
      .toISOString()
      .split("T")[0];
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

    const updatedFormData = { ...formData, [name]: value };
    if (name == "dob") {
      updatedFormData.age = calculateAgeFromDOB(value);
    } else if (name == "age") {
      updatedFormData.dob = calculateDOBFromAge(value);
    } else if (name == "weight" && formData.height != undefined) {
      updatedFormData.bmi = checkBMI(value, formData.height);
    } else if (name == "height" && formData.weight != undefined) {
      updatedFormData.bmi = checkBMI(formData.weight, value);
    }

    setFormData(updatedFormData);
    let error = "";

    if (name === "firstName" && !value.trim()) {
      error = FIRST_NAME_REQUIRED_ERROR;
    }

    if (name === "gender" && !value) {
      error = GENDER_REQUIRED_ERROR;
    }

    if (name === "relation" && !value) {
      error = RELATION_REQUIRED_ERROR;
    }

    if (name === "dob" && !value) {
      error = DOB_REQUIRED_ERROR;
    }

    if (name === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = INVALID_EMAIL_FORMAT_MSG;
      }
    }

    if (name === "mobileNo") {
      if (!value.trim()) {
        error = MOBILE_REQUIRED_ERROR;
      } else if (!/^\d{10}$/.test(value)) {
        error = MOBILE_NUMBER_INVALID_MSG;
      }
    }

    if (name === "pinCode") {
      if (!/^\d{6}$/.test(value)) {
        error = PIN_CODE_INVALID_MSG;
      }
    }

    if (name === "age") {
      if (value !== "" && (isNaN(value) || Number(value) < 0)) {
        error = AGE_NEGATIVE_ERROR;
      }
    }

    const numericFields = [
      "height",
      "weight",
      "temperature",
      "systolicBP",
      "diastolicBP",
      "pulse",
      "bmi",
      "rr",
      "spo2",
    ];

    if (numericFields.includes(name)) {
      if (
        value != undefined &&
        value !== "" &&
        (isNaN(value) || Number(value) < 0)
      ) {
        error = `${
          name.charAt(0).toUpperCase() + name.slice(1)
        } must be a non-negative number.`;
      }
    }

    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      if (error) {
        newErrors[name] = error;
      } else {
        delete newErrors[name];
      }
      return newErrors;
    });
  };

  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    // Only fetch token availability in "withAppointment" mode
    if (registrationMode === "withAppointment") {
      appointments.forEach((appointment, index) => {
        if (
          appointment.speciality &&
          appointment.selDoctorId &&
          appointment.selSession &&
          appointment.selDate &&
          !appointment.selectedTimeSlot
        ) {
          const timer = setTimeout(() => {
            fetchTokenAvailability(index);
          }, 500);

          return () => clearTimeout(timer);
        }
      });
    }
  }, [
    registrationMode,
    appointments
      .map(
        (app) =>
          `${app.speciality}-${app.selDoctorId}-${app.selSession}-${app.selDate}`,
      )
      .join(","),
  ]);

  const addAppointmentRow = () => {
    setAppointments((prev) => [
      ...prev,
      {
        id: nextAppointmentId,
        speciality: "",
        selDoctorId: "",
        selSession: "",
        selDate: null,
        departmentName: "",
        doctorName: "",
        sessionName: "",
        discount: 0,
        netAmount: "0.00",
        gst: "0.00",
        totalAmount: "0.00",
        tokenNo: null,
        tokenStartTime: "",
        tokenEndTime: "",
        selectedTimeSlot: "",
      },
    ]);
    setNextAppointmentId((prev) => prev + 1);
  };

  const removeAppointmentRow = (id) => {
    setAppointments((prev) => {
      if (prev.length === 1) {
        return prev;
      }
      return prev.filter((appointment) => appointment.id !== id);
    });
    setDoctorDataMap((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };
  const isPastDate = (dateStr) => {
    const selected = new Date(dateStr);
    const today = new Date();

    selected.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return selected < today;
  };

  const handleSpecialityChange = (id, value) => {
    const selectedDepartment = departmentData.find((dept) => dept.id == value);
    const departmentName = selectedDepartment
      ? selectedDepartment.departmentName
      : "";

    setAppointments((prev) =>
      prev.map((appointment) =>
        appointment.id === id
          ? {
              ...appointment,
              speciality: value,
              selDoctorId: "",
              selSession: "",
              departmentName,
              selDate: null,
              tokenNo: null,
            }
          : appointment,
      ),
    );
    if (value) {
      fetchDoctor(value, id);
    } else {
      setDoctorDataMap((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  };

  const onDateChange = async (index, date) => {
    if (!date) return;

    let dateString = "";
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      dateString = `${day}-${month}-${year}`;
    } else {
      dateString = date.split("T")[0];
    }

    if (isPastDate(dateString)) {
      Swal.fire({
        icon: "warning",
        title: INVALID_DATE_TITLE,
        text: PAST_DATE_WARNING,
        timer: 4000,
      });
      setDateResetKey((prev) => prev + 1);
      return;
    }

    const currentAppointment = appointments[index];

    handleAppointmentChange(index, "selDate", dateString);

    if (currentAppointment.selectedTimeSlot) {
      handleAppointmentChange(index, "selectedTimeSlot", "");
    }

    if (
      currentAppointment.speciality &&
      currentAppointment.selDoctorId &&
      currentAppointment.selSession
    ) {
      setTimeout(() => {
        fetchTokenAvailability(index, date);
      }, 300);
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
            }
          : a,
      ),
    );

    //checkDoctorValid(id, value, specialityId);
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
            }
          : a,
      ),
    );

 //   checkSessionValid(id, doctorId, specialityId, value);
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

  async function checkDuplicatePatient(
    firstName,
    dob,
    gender,
    mobile,
    relation,
  ) {
    const params = new URLSearchParams({
      firstName,
      dob,
      gender,
      mobile,
      relation,
    }).toString();

    const result = await getRequest(`${CHECH_DUPLICATE_PATIENT}?${params}`);
    return result === true;
  }

  useEffect(() => {
    const { firstName, dob, gender, mobileNo, relation } = formData;

    if (firstName && dob && gender && mobileNo && relation) {
      const timer = setTimeout(async () => {
        try {
          const isDuplicate = await checkDuplicatePatient(
            firstName,
            dob,
            gender,
            mobileNo,
            relation,
          );
          if (isDuplicate) {
            Swal.fire(
              "Duplicate Found!",
               DUPLICATE_PATIENT,
              "warning",
            );
            setIsDuplicatePatient(true);
          } else {
            setIsDuplicatePatient(false);
          }
        } catch (err) {
          console.error(DUPLICATE_CHECK_FAILED_LOG, err);
        }
      }, 800);

      return () => clearTimeout(timer);
    } else {
      setIsDuplicatePatient(false);
    }
  }, [
    formData.firstName,
    formData.dob,
    formData.gender,
    formData.mobileNo,
    formData.relation,
  ]);

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

  function sendRegistrationRequest() {
    if (!isFormValid()) {
      // Check specifically for time slots only in "withAppointment" mode
      if (registrationMode === "withAppointment") {
        const appointmentsWithDetails = appointments.filter(
          (appt) => appt.speciality && appt.selDoctorId && appt.selSession,
        );

        const missingTimeSlots = appointmentsWithDetails.filter(
          (appt) => !appt.selectedTimeSlot || appt.selectedTimeSlot.trim() === "",
        );

        if (missingTimeSlots.length > 0) {
          Swal.fire({
            icon: "warning",
            title: MISSING_TIME_SLOTS_TITLE,
            text: SELECT_TIME_SLOTS_BEFORE_REGISTRATION_MSG,
            timer: 3000,
          });
          return;
        }
      }

      Swal.fire({
        icon: "warning",
        title:INCOMPLETE_FORM_TITLE,
        text: INCOMPLETE_FORM_MSG,
        timer: 3000,
      });
      return;
    }

    console.log(formData);
    sendPatientData();
  }
  const validateVitalDetails = () => {
    if (preConsultationFlag) return true;

    const vitalFields = [
      "height",
      "weight",
      "temperature",
      "systolicBP",
      "diastolicBP",
      "pulse",
    ];

    let valid = true;
    const newErrors = {};

    vitalFields.forEach((field) => {
      if (!formData[field] || formData[field].toString().trim() === "") {
        newErrors[field] = `${field} is required.`;
        valid = false;
      }
    });

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return valid;
  };

  const validateForm = () => {
    const requiredFields = [
      "firstName",
      "gender",
      "relation",
      "dob",
      "mobileNo",
    ];
    const numericFields = [
      "height",
      "weight",
      "temperature",
      "systolicBP",
      "diastolicBP",
      "pulse",
      "bmi",
      "rr",
      "spo2",
      "age",
    ];

    let valid = true;
    const newErrors = {};

    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].toString().trim() === "") {
        newErrors[field] = `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } is required.`;
        valid = false;
      }
    });

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = INVALID_EMAIL_FORMAT_MSG;
      valid = false;
    }

    if (formData.mobileNo && !/^\d{10}$/.test(formData.mobileNo)) {
      newErrors.mobileNo = INVALID_MOBILE_NUMBER_MSG;
      valid = false;
    }

    if (formData.pinCode && !/^\d{6}$/.test(formData.pinCode)) {
      newErrors.pinCode =  PIN_CODE_INVALID_MSG;
      valid = false;
    }

    numericFields.forEach((field) => {
      const value = formData[field];

      if (value !== undefined && value !== "") {
        if (field === "age" || field === "patientAge") {
          // Validate correct format like "25Y 10M 2D"
          const agePattern = /^\d+Y\s\d+M\s\d+D$/;
          if (!agePattern.test(value)) {
            newErrors[field] = AGE_FORMAT_ERROR;
            valid = false;
          }
        } else {
          // Validate numeric fields
          if (isNaN(value) || Number(value) < 0) {
            newErrors[field] = `${
              field.charAt(0).toUpperCase() + field.slice(1)
            } must be a non-negative number.`;
            valid = false;
          }
        }
      }
      if (
        (field === "age" || requiredFields.includes(field)) &&
        Number(value) <= 0
      ) {
        newErrors[field] = `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } must be greater than 0.`;
        valid = false;
      }
    });

    setErrors(newErrors);
    return valid;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    if (dateStr.includes("-")) {
      const [year, month, day] = dateStr.split("-");
      return `${day}/${month}/${year}`;
    }
  };
  
  // Only create visitList for appointments with valid data
  const visitList = registrationMode === "withAppointment" 
    ? appointments
        .filter(
          (appt) =>
            appt.speciality &&
            appt.selDoctorId &&
            appt.selSession &&
            appt.tokenStartTime,
        )
        .map((appt) => {
          const dateStr = appt.selDate;
          const dateOnly = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;

          const visitDateTime = createInstant(dateOnly, appt.tokenStartTime);
          const startTime = createInstant(dateOnly, appt.tokenStartTime);
          const endTime = createInstant(dateOnly, appt.tokenEndTime);

          return {
            id: 0,
            tokenNo: appt.tokenNo || 0,
            tokenStartTime: startTime,
            tokenEndTime: endTime,
            visitStatus: "NEW",
            visitDate: visitDateTime,
            departmentId: Number(appt.speciality),
            doctorId: Number(appt.selDoctorId),
            doctorName: appt.doctorName || "",
            sessionId: Number(appt.selSession),
            hospitalId: Number(sessionStorage.getItem("hospitalId")),
            priority: 0,
            billingStatus: "Pending",
            patientId: 0,
            iniDoctorId: 0,
            billingPolicyId: "",
          };
        })
    : [];

  useEffect(() => {
    // Only run this effect in "withAppointment" mode
    if (registrationMode === "withAppointment") {
      const hasInvalidAppointment = appointments.some(
        (appt) =>
          appt.selectedTimeSlot &&
          (!appt.selDoctorId || !appt.selSession || !appt.selDate),
      );

      if (hasInvalidAppointment) {
        setAppointments((prev) =>
          prev.map((appt) => {
            if (
              appt.selectedTimeSlot &&
              (!appt.selDoctorId || !appt.selSession || !appt.selDate)
            ) {
              return {
                ...appt,
                tokenNo: null,
                tokenStartTime: "",
                tokenEndTime: "",
                selectedTimeSlot: "",
              };
            }
            return appt;
          }),
        );
      }
    }
  }, [
    registrationMode,
    appointments
      .map(
        (a) =>
          `${a.selDoctorId}-${a.selSession}-${a.selDate}-${a.selectedTimeSlot}`,
      )
      .join(","),
  ]);

  const clearTimeSlot = (appointmentIndex) => {
    setAppointments((prev) =>
      prev.map((app, index) =>
        index === appointmentIndex
          ? {
              ...app,
              tokenNo: null,
              tokenStartTime: "",
              tokenEndTime: "",
              selectedTimeSlot: "",
            }
          : app,
      ),
    );
  };

  const sendPatientData = async () => {
    if (validateForm() && validateVitalDetails()) {
      const requestData = {
        patient: {
          id: 0,
          uhidNo: "",
          patientStatus: "",
          regDate: new Date(Date.now()).toJSON().split(".")[0].split("T")[0],
          lastChgBy: sessionStorage.getItem("username"),
          patientHospitalId: Number(sessionStorage.getItem("hospitalId")),
          patientFn: formData.firstName,
          patientMn: formData.middleName,
          patientLn: formData.lastName,
          patientDob: formData.dob,
          patientAge: formData.age,
          patientGenderId: formData.gender,
          patientEmailId: formData.email,
          patientMobileNumber: formData.mobileNo,
          patientImage: imageURL,
          fileName: "string",
          patientRelationId: formData.relation,
          patientMaritalStatusId: formData.maritalStatus,
          patientReligionId: formData.religion,
          patientAddress1: formData.address1,
          patientAddress2: formData.address2,
          patientCity: formData.city,
          patientPincode: formData.pinCode,
          patientDistrictId: formData.district,
          patientStateId: formData.state,
          patientCountryId: formData.country,
          pincode: "string",
          emerFn: formData.emergencyFirstName,
          emerLn: formData.emergencyLastName,
          emerRelationId: formData.emergencyRelationId,
          emerMobile: formData.emergencyMobile,
          nokFn: formData.nokFirstName,
          nokLn: formData.nokLastName,
          nokEmail: formData.nokEmail,
          nokMobileNumber: formData.nokMobile,
          nokAddress1: formData.nokAddress1,
          nokAddress2: formData.nokAddress2,
          nokCity: formData.nokCity,
          nokDistrictId: formData.nokDistrict,
          nokStateId: formData.nokState,
          nokCountryId: formData.nokCountry,
          nokPincode: formData.nokPinCode,
          nokRelationId: formData.nokRelation,
        },
        opdPatientDetail: {
          height: formData.height,
          idealWeight: formData.idealWeight,
          weight: formData.weight,
          pulse: formData.pulse,
          temperature: formData.temperature,
          opdDate: formData.appointmentDate,
          rr: formData.rr,
          bmi: formData.bmi,
          spo2: formData.spo2,
          varation: formData.varation,
          bpSystolic: formData.systolicBP,
          bpDiastolic: formData.diastolicBP,
          icdDiag: "",
          workingDiag: "",
          followUpFlag: "",
          followUpDays: 0,
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
          patientId: 0,
          visitId: 0,
          departmentId: 0,
          hospitalId: 0,
          doctorId: 0,
          lastChgBy: "",
        },

        visits: visitList,
      };
      
      // Filter out invalid visits (doctor/session empty) only if in "withAppointment" mode
      if (registrationMode === "withAppointment") {
        requestData.visits = visitList.filter(
          (v) => !isNaN(v.doctorId) && v.doctorId > 0 && !isNaN(v.departmentId),
        );

        if (requestData.visits.length === 0) {
          requestData.visits = null;
        }
      } else {
        // For register only mode, visits should be null
        requestData.visits = null;
      }

      try {
        setLoading(true);
        const data = await postRequest(`${PATIENT_REGISTRATION}`, requestData);

        if (data.status === 200) {
          const resp = data.response?.opdBillingPatientResponse;
          const patientResp = data.response?.patient || data.response;

          const visits =
            data.response?.patient?.visits || data.response?.visits || [];
          const hasBillingStatusY =
            visits.length > 0 && visits[0]?.billingStatus === "y";

          if (hasBillingStatusY) {
            // Direct redirect to PendingForBilling without showing dialog
            Swal.fire({
              title: PATIENT_REGISTERED_SUCCESS_TITLE,
              html: `<p>Patient has been registered successfully.</p>
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
            Swal.fire({
              title: PATIENT_REGISTERED_SUCCESS_TITLE,
              html: `
          <p><strong>${resp.patientName}</strong> has been registered successfully.</p>
          <p>Do you want to proceed to billing?</p>
        `,
              icon: "success",
              showCancelButton: true,
              confirmButtonText: "Proceed to Billing",
              cancelButtonText: "Close",
              allowOutsideClick: false,
            }).then((result) => {
              if (result.isConfirmed) {
                navigate("/OPDBillingDetails", {
                  state: {
                    billingData: {
                      patientUhid: patientResp.uhidNo,
                      patientId: resp.patientid,
                      patientName: resp.patientName,
                      mobileNo: resp.mobileNo,
                      age: resp.age,
                      sex: resp.sex,
                      relation: resp.relation,
                      address: resp.address,
                      appointments: resp.appointments,
                      details: resp.details,
                      billingHeaderIds: (resp.appointments || []).map(
                        (a) => a.billingHdId,
                      ),
                      registrationCost: resp.registrationCost,
                    },
                  },
                });
              } else if (result.dismiss === Swal.DismissReason.cancel) {
                window.location.reload();
              }
            });
          } else if (patientResp) {
            // Case: no billing response but patient saved
            const displayName =
              patientResp.patientFn ||
              patientResp.patientName ||
              `${formData.firstName} ${formData.lastName}`.trim();

            Swal.fire({
              title:PATIENT_REGISTERED_SUCCESS_TITLE,
              html: `<p><strong>${
                displayName || "Patient"
              }</strong> has been registered successfully.</p>`,
              icon: "success",
              confirmButtonText: "OK",
              allowOutsideClick: false,
            }).then(() => {
              window.location.reload();
            });
          } else {
            // Fallback
            Swal.fire({
              icon: "success",
              title: "Patient Registered",
              text: PATIENT_REGISTERED_SUCCESS_TITLE,
            }).then(() => window.location.reload());
          }
        } else {
          Swal.fire({
            icon: "error",
            title: "Registration Failed",
            text:
              data.message || UNEXPECTED_RESPONSE_MSG,
          });
        }
      } catch (error) {
        console.error("Error:", error);
        Swal.fire({
          icon: "error",
          title: "Registration Failed",
          text: PATIENT_REGISTRATION_FAILED_MSG,
        });
      } finally {
        setLoading(false);
      }
    }
  };

  async function fetchDoctor(value, rowId) {
    try {
      const data = await getRequest(`${DOCTOR_BY_SPECIALITY}${value}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setDoctorDataMap((prev) => ({
          ...prev,
          [rowId]: data.response,
        }));
      } else {
        console.error(UNEXPECTED_API_RESPONSE_ERR, data);
        setDoctorDataMap((prev) => ({
          ...prev,
          [rowId]: [],
        }));
      }
    } catch (error) {
      console.error(FETCH_DATA_ERROR, error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSession(doctorId, deptId, sessionId) {
    if (!doctorId || !deptId) {
      return;
    }
    const today = new Date();
    const value = `${today.getFullYear()}-${String(
      today.getMonth() + 1,
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    console.log("value", value);

    const data = await getRequest(
      `${GET_DOCTOR_SESSION}deptId=${deptId}&doctorId=${doctorId}&rosterDate=${value}&sessionId=${sessionId}`,
    );
    if (data.status == 200) {
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

  function calculateAgeFromDOB(dob) {
    const birthDate = new Date(dob);
    const today = new Date();

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    return `${years}Y ${months}M ${days}D`;
  }

  const selectToken = async (
    appointmentIndex,
    tokenNo,
    tokenStartTime,
    tokenEndTime,
  ) => {
    try {
      const formatTime = (timeStr) => {
        if (!timeStr) return "";
        if (timeStr.length <= 5) return timeStr;
        if (timeStr.includes(":")) {
          const parts = timeStr.split(":");
          return `${parts[0]}:${parts[1]}`;
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

  const showTokenPopup = (
    tokens = [],
    sessionName,
    appointmentDate,
    appointmentIndex,
  ) => {
    if (tokens.length === 0) {
      Swal.fire({
        icon: "info",
        title: NO_TOKENS_AVAILABLE,
        text: NO_TOKENS_SELECTED_SESSION_MSG,
      });
      return;
    }
    const formatTimeForDisplay = (timeStr) => {
      if (!timeStr) return "";
      if (timeStr.includes(":")) {
        const parts = timeStr.split(":");
        return `${parts[0]}:${parts[1]}`;
      }
      return timeStr;
    };

    Swal.fire({
      title: `Time Slots - Appointment ${appointmentIndex + 1}`,
      html: `
<div class="container-fluid">
  <div class="text-center mb-2">
    <h5 class="fw-bold mb-1">Available Time Slots</h5>
    <p class="text-muted small">Date: ${formatDate(appointmentDate)} | Session: ${sessionName}</p>
  </div>
  <div class="row">
    <div class="col-12">
      <div class="card border-0 shadow-sm">
        <div class="card-body p-3">
          <h6 class="fw-bold mb-2 text-primary">${sessionName} Session</h6>
          <div class="row row-cols-4 g-1" id="token-slots">
            ${tokens
              .map((token) => {
                const displayStart = formatTimeForDisplay(token.startTime);
                const displayEnd = formatTimeForDisplay(token.endTime);
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

  return (
    <div className="body d-flex py-3">
      <div className="container-fluid">
        <div className="row align-items-center">
          <div className="border-0 mb-4">
            <div className="card-header py-3 no-bg bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap">
              <h3 className="fw-bold mb-0">Registration of New Patient</h3>
            </div>
          </div>
        </div>

        {/* Registration Mode Selection */}
<div className="row mb-3">
  <div className="col-sm-12">
    <div className="card shadow mb-3">
      <div className="card-header py-3 border-bottom-1">
        <h6 className="mb-0 fw-bold">Registration Mode</h6>
      </div>
      <div className="card-body">
        <form>
          <div className="row g-3">
            <div className="col-12">
              <div className="d-flex gap-4">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="registrationMode"
                    id="registerOnly"
                    value="registerOnly"
                    checked={registrationMode === "registerOnly"}
                    onChange={() => handleRegistrationModeChange("registerOnly")}
                  />
                  <label className="form-check-label" htmlFor="registerOnly">
                    Register Only
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="registrationMode"
                    id="withAppointment"
                    value="withAppointment"
                    checked={registrationMode === "withAppointment"}
                    onChange={() => handleRegistrationModeChange("withAppointment")}
                  />
                  <label className="form-check-label" htmlFor="withAppointment">
                    Register with Appointment
                  </label>
                </div>
              </div>
            </div>
          </div>
        </form>
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
                          <label className="form-label" htmlFor="firstName">
                            First Name <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className={`form-control ${
                              errors.firstName ? "is-invalid" : ""
                            }`}
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="Enter First Name"
                            required
                          />
                          {errors.firstName && (
                            <div className="invalid-feedback">
                              {errors.firstName}
                            </div>
                          )}
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="middleName">
                            Middle Name
                          </label>
                          <input
                            type="text"
                            id="middleName"
                            value={formData.middleName}
                            name="middleName"
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Enter Middle Name"
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="lastName">
                            Last Name
                          </label>
                          <input
                            type="text"
                            id="lastName"
                            value={formData.lastName}
                            name="lastName"
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Enter Last Name"
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="mobileNo">
                            Mobile No.<span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            id="mobileNo"
                            className={`form-control ${
                              errors.mobileNo ? "is-invalid" : ""
                            }`}
                            name="mobileNo"
                            value={formData.mobileNo}
                            onChange={handleChange}
                            placeholder="Enter Mobile Number"
                            required
                          />
                          {errors.mobileNo && (
                            <div className="invalid-feedback">
                              {errors.mobileNo}
                            </div>
                          )}
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="gender">
                            Gender <span className="text-danger">*</span>
                          </label>
                          <select
                            className={`form-select ${
                              errors.gender ? "is-invalid" : ""
                            }`}
                            id="gender"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                          >
                            <option value="">Select</option>
                            {genderData.map((gender) => (
                              <option key={gender.id} value={gender.id}>
                                {gender.genderName}
                              </option>
                            ))}
                          </select>
                          {errors.gender && (
                            <div className="invalid-feedback">
                              {errors.gender}
                            </div>
                          )}
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="relation">
                            Relation <span className="text-danger">*</span>
                          </label>
                          <select
                            className={`form-select ${
                              errors.relation ? "is-invalid" : ""
                            }`}
                            id="relation"
                            name="relation"
                            value={formData.relation}
                            onChange={handleChange}
                          >
                            <option value="">Select</option>
                            {relationData.map((relation) => (
                              <option key={relation.id} value={relation.id}>
                                {relation.relationName}
                              </option>
                            ))}
                          </select>
                          {errors.relation && (
                            <div className="invalid-feedback">
                              {errors.relation}
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
                              errors.dob ? "is-invalid" : ""
                            }`}
                            value={formData.dob}
                            max={new Date().toISOString().split("T")[0]}
                            onChange={handleChange}
                            placeholder="Select Date of Birth"
                          />
                          {errors.dob && (
                            <div className="invalid-feedback">{errors.dob}</div>
                          )}
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="age">
                            Age
                          </label>
                          <input
                            type="text" // <<== NOT number!
                            id="age"
                            name="age"
                            className={`form-control ${
                              errors.age ? "is-invalid" : ""
                            }`}
                            value={formData.age || ""}
                            onChange={handleChange}
                            placeholder="Enter Age"
                          />

                          {errors.age && (
                            <div className="invalid-feedback">{errors.age}</div>
                          )}
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="email">
                            Email{" "}
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            className={`form-control ${
                              errors.email ? "is-invalid" : ""
                            }`}
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter Email Address"
                          />
                          {errors.email && (
                            <div className="invalid-feedback">
                              {errors.email}
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
                              src={image || "/default-profile.png"}
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
                        name="address1"
                        value={formData.address1}
                        onChange={handleChange}
                        placeholder="Enter Address 1"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Address 2</label>
                      <input
                        type="text"
                        className="form-control"
                        name="address2"
                        value={formData.address2}
                        onChange={handleChange}
                        placeholder="Enter Address 2"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Country</label>
                      <select
                        className="form-select"
                        name="country"
                        value={formData.country}
                        onChange={(e) => {
                          handleAddChange(e);
                          fetchStates(e.target.value);
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
                        name="state"
                        value={formData.state}
                        onChange={(e) => {
                          handleAddChange(e);
                          fetchDistrict(e.target.value);
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
                        name="district"
                        value={formData.district}
                        onChange={(e) => {
                          handleAddChange(e);
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
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Enter City"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Pin Code</label>
                      <input
                        type="text"
                        className={`form-control ${
                          errors.pinCode ? "is-invalid" : ""
                        }`}
                        name="pinCode"
                        value={formData.pinCode}
                        onChange={handleChange}
                        placeholder="Enter Pin Code"
                      />
                      {errors.pinCode && (
                        <div className="invalid-feedback">{errors.pinCode}</div>
                      )}
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
                        placeholder="Enter First Name"
                        name="nokFirstName"
                        value={formData.nokFirstName}
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
                        value={formData.nokMiddleName}
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
                        value={formData.nokLastName}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Enter Email"
                        name="nokEmail"
                        value={formData.nokEmail}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Mobile No.</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Mobile Number"
                        name="nokMobile"
                        value={formData.nokMobile}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Address 1</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Address 1"
                        name="nokAddress1"
                        value={formData.nokAddress1}
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
                        value={formData.nokAddress2}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Country</label>
                      <select
                        className="form-select"
                        name="nokCountry"
                        value={formData.nokCountry}
                        onChange={(e) => {
                          handleAddChange(e);
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
                        value={formData.nokState}
                        onChange={(e) => {
                          handleAddChange(e);
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
                        value={formData.nokDistrict}
                        onChange={(e) => {
                          handleAddChange(e);
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
                        name="nokCity"
                        value={formData.nokCity}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Pin Code</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Pin Code"
                        name="nokPinCode"
                        value={formData.nokPinCode}
                        onChange={handleChange}
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
                        name="emergencyFirstName"
                        value={formData.emergencyFirstName}
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
                        value={formData.emergencyLastName}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Mobile No.</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Mobile Number"
                        name="emergencyMobile"
                        value={formData.emergencyMobile}
                        onChange={handleChange}
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
          <>
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
                            Height<span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            className={`form-control ${
                              errors.height ? "is-invalid" : ""
                            }`}
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

                        {/* Weight */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">
                            Weight<span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            className={`form-control ${
                              errors.weight ? "is-invalid" : ""
                            }`}
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

                        {/* Temperature */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">
                            Temperature<span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            className={`form-control ${
                              errors.temperature ? "is-invalid" : ""
                            }`}
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

                        {/* BP (Systolic / Diastolic) */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">
                            BP<span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            className={`form-control ${
                              errors.systolicBP ? "is-invalid" : ""
                            }`}
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
                            className={`form-control ${
                              errors.diastolicBP ? "is-invalid" : ""
                            }`}
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

                        {/* Pulse */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">
                            Pulse<span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            className={`form-control ${
                              errors.pulse ? "is-invalid" : ""
                            }`}
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

                        {/* BMI */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">BMI</label>
                          <input
                            type="number"
                            min={0}
                            className={`form-control ${
                              errors.bmi ? "is-invalid" : ""
                            }`}
                            placeholder="BMI"
                            name="bmi"
                            value={formData.bmi}
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
                          <label className="form-label me-2">
                            RR<span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            className={`form-control ${
                              errors.rr ? "is-invalid" : ""
                            }`}
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

                        {/* SpO2 */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">
                            SpO2<span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            className={`form-control ${
                              errors.spo2 ? "is-invalid" : ""
                            }`}
                            placeholder="SpO2"
                            name="spo2"
                            value={formData.spo2}
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
          </>
        )}

        {/* Appointment Details Section - Hidden when register only */}
        {registrationMode === "withAppointment" && (
          <div className="row mb-3">
            <div className="col-sm-12">
              <div className="card shadow mb-3">
                <div className="card-header py-3   border-bottom-1 d-flex align-items-center justify-content-between">
                  <h6 className="mb-0 fw-bold">Appointment Details</h6>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary text-white  "
                      onClick={addAppointmentRow}
                    >
                      + Add
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <form>
                    {appointments.map((appointment, index) => {
                      const doctorOptions = doctorDataMap[appointment.id] || [];
                      return (
                        <div
                          className="row g-3 mb-3"
                          key={`appointment-${appointment.id}`}
                        >
                          <div className="col-12 d-flex align-items-center justify-content-between">
                            <h6 className="fw-bold text-muted mb-0">
                              Appointment {index + 1}
                            </h6>
                            {appointments.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() =>
                                  removeAppointmentRow(appointment.id)
                                }
                              >
                                - Remove
                              </button>
                            )}
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Speciality</label>
                            <select
                              className="form-select"
                              value={appointment.speciality}
                              onChange={(e) =>
                                handleSpecialityChange(
                                  appointment.id,
                                  e.target.value,
                                )
                              }
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
                            <label className="form-label">Doctor Name</label>
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
                            >
                              <option value="">Select Doctor</option>
                              {doctorOptions.map((doctor) => (
                                <option key={doctor.id} value={doctor.userId}>
                                  {`${doctor.firstName} ${
                                    doctor.middleName ? doctor.middleName : ""
                                  } ${doctor.lastName ? doctor.lastName : ""}`}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Session</label>
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
                            >
                              <option value="">Select Session</option>
                              {session.map((ses) => (
                                <option key={ses.id} value={ses.id}>
                                  {ses.sessionName}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-4">
                            <DatePicker
                              key={dateResetKey + "-" + index}
                              value={appointment.selDate || null}
                              onChange={(date) => onDateChange(index, date)}
                              placeholder="Select Date"
                              className="form-control"
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Time Slot</label>
                            <div className="d-flex align-items-center">
                              <input
                                type="text"
                                className="form-control"
                                value={appointment.selectedTimeSlot || ""}
                                readOnly
                                style={{
                                  backgroundColor: appointment.selectedTimeSlot
                                    ? "#f0fff0"
                                    : "#f8f9fa",
                                  cursor: "pointer",
                                }}
                              />
                            </div>
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
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid()}
                      onClick={sendRegistrationRequest}
                    >
                      Registration
                    </button>
                    <button type="reset" className="btn btn-secondary">
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
};

export default PatientRegistration;