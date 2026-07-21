import { useCallback, useEffect, useRef, useState } from "react";
import LoadingScreen from "../../../Components/Loading";
import Swal from "sweetalert2";
import placeholderImage from "../../../assets/images/placeholder.jpg";
import DatePicker from "../../../Components/DatePicker";
import { useLocation, useNavigate } from "react-router-dom";
import ABHACreationModal from "../ABHACreationModel";
import ABHAVerificationModal from "../ABHAVerificationModel";
import { integrationService } from "../../../service/integrationService";
import { isValidAadhaarNumber } from "../../../utils/ABDMValidations";
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
  GET_DOCTOR_SESSION,
  GET_SESSION,
  GET_TOKENS,
  HOSPITAL,
  PATIENT_FOLLOW_UP,
  PATIENT_FOLLOW_UP_DETAILS,
  PATIENT_IMAGE_UPLOAD,
  PATIENT_SEARCH,
  SEARCH_PATIENT,
  FOLLOWUP_PATIENTS_LIST,
  STATE_BY_COUNTRY,
  MAS_BLOODGROUP,
  MAS_GENDER,
} from "../../../config/apiConfig";
import {
  DEPARTMENT_CODE_OPD,
  IMAGE_TITLE,
  IMAGE_TEXT,
  IMAGE_UPLOAD_SUCC_MSG,
  IMAGE_UPLOAD_FAIL_MSG,
  PAST_DATE_WARNING,
  INVALID_PAGE_NO_WARN_MSG,
  UNEXPECTED_API_RESPONSE_ERR,
  FETCH_DATA_ERROR,
  AT_LEAST_ONE_APPOINTMENT_REQUIRED,
  INVALID_MOBILE_NUMBER_MSG,
  INVALID_EMAIL_FORMAT_MSG,
  NO_PATIENTS_FOUND_MSG,
  SEARCH_PATIENTS_ERROR_LOG,
  SEARCH_PATIENTS_FAILED_MSG,
  CAMERA_ACCESS_ERROR_LOG,
  SOMETHING_WENT_WRONG_MSG,
  FILE_UPLOAD_ERROR_LOG,
  UPLOADED_IMAGE_URL_LOG,
  UNABLE_TO_LOAD_PATIENT_DETAILS,
  SELECT_PATIENT_TO_UPDATE_ERROR,
  ADD_AT_LEAST_ONE_APPOINTMENT_ERROR,
  CHECK_REQUIRED_FIELDS_ERROR,
  FINAL_REQUEST_READY_LOG,
  PATIENT_UPDATE_SUCCESS,
  PATIENT_UPDATE_WITH_APPOINTMENT_SUCCESS,
  PATIENT_UPDATED_SUCCESS_TITLE,
  BACKEND_ERROR_RESPONSE_LOG,
  MAX_LENGTH_EXCEEDED_ERROR_TEXT,
  FAILED_TO_UPDATE_PATIENT_ERROR,
  FETCH_TOKEN_AVAILABILITY_ERROR,
  SELECT_TOKEN_ERROR_LOG,
  NO_TOKENS_AVAILABLE,
  SELECT_SPECIALITY_DOCTOR_SESSION_MSG,
  SELECT_TOKEN_ERROR_TEXT,
  FETCH_TOKEN_AVAILABILITY_ERROR_LOG,
  NO_TOKENS_AVAILABLE_TEXT,
  NO_TOKENS_AVAILABLE_INFO,
} from "../../../config/constants";
import { getRequest, postRequest } from "../../../service/apiService";

const UpdatePatientRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  async function fetchHospitalDetails() {
    try {
      setLoading(true);
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
      setLoading(true);
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
      setLoading(true);
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

  const loadMasterData = async () => {
    setLoading(true);
    try {
      await Promise.allSettled([
        fetchGenderData(),
        fetchRelationData(),
        fetchCountryData(),
        fetchDepartment(),
        fetchAllSessions(),
        fetchHospitalDetails(),
      ]);
      await Promise.allSettled([
        fetchAllStateData(),
        fetchAllDistrictData(),
        fetchNokAllStates(),
      ]);
    } catch (err) {
      console.error("Error loading master data", err);
      Swal.fire({
        icon: "warning",
        title: "Partial Data Load",
        text: "Some master data could not be loaded. You may need to refresh the page.",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
    }
  };
  const [availableTokens, setAvailableTokens] = useState([]);
  const [dateResetKey, setDateResetKey] = useState(0);
  const [errors, setErrors] = useState({});
  const [imageURL, setImageURL] = useState("");
  const [genderData, setGenderData] = useState([]);
  const [loading, setLoading] = useState(false);
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
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    mobileNo: "",
    patientName: "",
    uhidNo: "",
    appointmentDate: "",
  });
  const [patientDetailForm, setPatientDetailForm] = useState({
    patientGender: "",
    patientRelation: "",
    abhaNumber: "",
  });
  let stream = null;
  const [patients, setPatients] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileQuery, setMobileQuery] = useState("");
  const [pageInput, setPageInput] = useState("");
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [editLoadingId, setEditLoadingId] = useState(null);
  const prefillSearchRef = useRef(null);
  // ABHA State
  const [showAbhaCreationModal, setShowAbhaCreationModal] = useState(false);
  const [showAbhaVerificationModal, setShowAbhaVerificationModal] =
    useState(false);
  const [abhaMode, setAbhaMode] = useState("existing");
  const [abhaData, setAbhaData] = useState({
    abhaNumber: "",
    consentName: "",
    aadhaarNo: "",
    consent1: true,
    consent2: true,
    consent3: true,
    consent4: true,
    consent5: true,
    consent6: true,
    consent7: true,
    otp: "",
    verified: false,
    abhaAddress: "",
  });

  const createInitialCreateState = () => ({
    loading: false,
    txnId: "",
    xtoken: "",
    isType: "",
    needsMobileVerification: false,
    mobileVerificationTxnId: "",
    heldIsNew: null,
    heldXtoken: "",
    suggestions: [],
    verifiedProfile: null,
    createdAbha: null,
    banner: null,
  });

  const [createState, setCreateState] = useState(createInitialCreateState);
  const [showConsentModal, setShowConsentModal] = useState(false);

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
  const masterDataLoadedRef = useRef(false);
  const patientDetailsCacheRef = useRef(new Map());
  const patientDetailsInFlightRef = useRef(new Map());
  const doctorsBySpecialityCacheRef = useRef(new Map());
  const doctorsBySpecialityInFlightRef = useRef(new Map());
  const statesByCountryCacheRef = useRef(new Map());
  const districtsByStateCacheRef = useRef(new Map());
  const tokenRequestsInFlightRef = useRef(new Set());

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

  const getDoctorsBySpeciality = async (specialityId) => {
    if (!specialityId) return [];

    const cacheKey = String(specialityId);
    if (doctorsBySpecialityCacheRef.current.has(cacheKey)) {
      return doctorsBySpecialityCacheRef.current.get(cacheKey);
    }

    if (doctorsBySpecialityInFlightRef.current.has(cacheKey)) {
      return doctorsBySpecialityInFlightRef.current.get(cacheKey);
    }

    const request = getRequest(`${DOCTOR_BY_SPECIALITY}${specialityId}`)
      .then((data) => {
        const doctors =
          data.status === 200 && Array.isArray(data.response)
            ? data.response
            : [];
        doctorsBySpecialityCacheRef.current.set(cacheKey, doctors);
        return doctors;
      })
      .finally(() => {
        doctorsBySpecialityInFlightRef.current.delete(cacheKey);
      });

    doctorsBySpecialityInFlightRef.current.set(cacheKey, request);
    return request;
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

    try {
      const doctors = await getDoctorsBySpeciality(value);
      setDoctorDataMap((prev) => ({ ...prev, [rowId]: doctors }));
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
              tokenStartTime: "",
              tokenEndTime: "",
              selectedTimeSlot: "",
            }
          : a,
      ),
    );
    //checkSessionValid(id, doctorId, specialityId, value);
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

  const handleSearch = useCallback(
    async (page = 0, searchOverride = null) => {
      setCurrentPage(page + 1);

      if (typeof page !== "number") {
        page = 0;
      }
      setSearchLoading(true);
      try {
        const searchPayload = {
          mobileNo: searchOverride?.mobileNo ?? formData.mobileNo ?? null,
          patientName: searchOverride?.patientName ?? formData.patientName ?? null,
        };

        const payload = {
          mobileNo: searchPayload.mobileNo || null,
          patientName: searchPayload.patientName || null,
        };

        const response = await postRequest(
          `${FOLLOWUP_PATIENTS_LIST}?page=${page}&size=${itemsPerPage}`,
          payload,
        );

        if (response?.response) {
          const pageData = response.response;

          setPatients(pageData.content || []);
          setTotalPages(Number(response.response.totalPages) || 1);
          setTotalElements(
            response.response?.totalElements ||
              response.response?.total_elements ||
              0,
          );
          setSearchPerformed(true);
        } else {
          setPatients([]);
          Swal.fire("Info", NO_PATIENTS_FOUND_MSG, "info");
        }
      } catch (error) {
        console.error(error);
        Swal.fire("Error", SEARCH_PATIENTS_FAILED_MSG, "error");
      } finally {
        setSearchLoading(false);
      }
    },
    [formData.mobileNo, formData.patientName, itemsPerPage],
  );

  useEffect(() => {
    const prefillSearch = location.state;

    if (!prefillSearch?.patientName && !prefillSearch?.mobileNo) {
      return;
    }

    // React.StrictMode can mount this screen twice in development.
    // Guard by location key so the auto-prefill/search only runs once per navigation.
    if (prefillSearchRef.current === location.key) {
      return;
    }
    prefillSearchRef.current = location.key;

    const patientName = prefillSearch.patientName || "";
    const mobileNo = prefillSearch.mobileNo || "";

    setFormData((prev) => ({
      ...prev,
      patientName,
      mobileNo,
    }));
    setSearchQuery(patientName);
    setMobileQuery(mobileNo);

    handleSearch(0, {
      patientName,
      mobileNo,
    });
  }, [location.key]);

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
    setAbhaData({
      abhaNumber: "",
      consentName: "",
      aadhaarNo: "",
      consent1: false,
      consent2: false,
      consent3: false,
      consent4: false,
      consent5: false,
      consent6: false,
      consent7: false,
      otp: "",
      verified: false,
      abhaAddress: "",
    });
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

  // Helper function to format ABHA number
  const formatAbhaNumber = (value = "") => {
    if (!value) return "";
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 14) return value;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}-${digits.slice(10, 14)}`;
  };

  // Handle ABHA Creation Success
  const handleAbhaCreationSuccess = (abhaData) => {
    console.log("ABHA Data received:", abhaData);

    // Auto-fill the form data with ABHA information
    const updatedFormData = { ...patientDetailForm };

    // Fill name
    if (abhaData.consentName) {
      const nameParts = abhaData.consentName.trim().split(/\s+/);
      updatedFormData.patientFn =
        updatedFormData.patientFn || nameParts[0] || "";
      updatedFormData.patientLn =
        updatedFormData.patientLn || nameParts.slice(1).join(" ") || "";
    }

    // Fill mobile
    if (abhaData.mobileNumber) {
      updatedFormData.patientMobileNumber =
        updatedFormData.patientMobileNumber || abhaData.mobileNumber;
    }

    // Fill gender using the mapped ID from ABHA data
    if (abhaData.genderId) {
      const selectedGender = genderData.find(
        (g) => g.id === Number(abhaData.genderId),
      );
      if (selectedGender) {
        updatedFormData.patientGender = selectedGender;
      }
    } else if (abhaData.gender) {
      const genderMap = {
        Male: 1,
        Female: 2,
        Other: 3,
        Transgender: 3,
      };
      const genderId = genderMap[abhaData.gender];
      if (genderId) {
        const selectedGender = genderData.find((g) => g.id === genderId);
        if (selectedGender) {
          updatedFormData.patientGender = selectedGender;
        }
      }
    }

    // Fill date of birth
    if (abhaData.dateOfBirth) {
      const dateParts = abhaData.dateOfBirth.split("-");
      if (dateParts.length === 3) {
        const formattedDate = `${dateParts[2]}-${dateParts[1].padStart(2, "0")}-${dateParts[0].padStart(2, "0")}`;
        updatedFormData.patientDob =
          updatedFormData.patientDob || formattedDate;
        if (!updatedFormData.patientAge) {
          updatedFormData.patientAge = calculateAgeFromDOB(formattedDate);
        }
      }
    }

    // Fill address
    if (abhaData.address) {
      const addressParts = abhaData.address.split(",");
      updatedFormData.patientAddress1 =
        updatedFormData.patientAddress1 || addressParts[0]?.trim() || "";
      if (addressParts.length > 1) {
        updatedFormData.patientAddress2 =
          updatedFormData.patientAddress2 ||
          addressParts.slice(1).join(",").trim() ||
          "";
      }
    }

    // Fill state using the mapped ID from ABHA data
    if (abhaData.stateId) {
      const selectedState = stateData.find(
        (s) => s.id === Number(abhaData.stateId),
      );
      if (selectedState) {
        updatedFormData.patientState = selectedState;
      }
    } else if (abhaData.stateName) {
      const state = stateData.find(
        (s) => s.stateName?.toLowerCase() === abhaData.stateName.toLowerCase(),
      );
      if (state) {
        updatedFormData.patientState = state;
      }
    }

    // Fill district using the mapped ID from ABHA data
    if (abhaData.districtId) {
      const selectedDistrict = districtData.find(
        (d) => d.id === Number(abhaData.districtId),
      );
      if (selectedDistrict) {
        updatedFormData.patientDistrict = selectedDistrict;
      }
    } else if (abhaData.districtName) {
      const district = districtData.find(
        (d) =>
          d.districtName?.toLowerCase() === abhaData.districtName.toLowerCase(),
      );
      if (district) {
        updatedFormData.patientDistrict = district;
      }
    }

    // Fill pincode
    if (abhaData.pincode) {
      updatedFormData.patientPincode =
        updatedFormData.patientPincode || abhaData.pincode;
    }

    // Handle profile photo
    if (abhaData.photo) {
      const photoUrl = abhaData.photo.startsWith("data:")
        ? abhaData.photo
        : `data:image/jpeg;base64,${abhaData.photo}`;
      setImage(photoUrl);
    }

    // Store ABHA number in form data
    if (abhaData.abhaNumber) {
      updatedFormData.abhaNumber = abhaData.abhaNumber;
    }

    // Update form data
    setPatientDetailForm(updatedFormData);

    // Store ABHA data for reference
    setAbhaData((prev) => ({
      ...prev,
      abhaNumber: abhaData.abhaNumber,
      abhaAddress: abhaData.abhaAddress,
      consentName: abhaData.consentName || prev.consentName,
      verified: true,
    }));

    // Show success message
    const filledFields = [];
    if (abhaData.consentName) filledFields.push("Name");
    if (abhaData.mobileNumber) filledFields.push("Mobile");
    if (abhaData.dateOfBirth) filledFields.push("DOB");
    if (abhaData.address) filledFields.push("Address");
    if (abhaData.gender) filledFields.push("Gender");
    if (abhaData.stateName) filledFields.push("State");
    if (abhaData.districtName) filledFields.push("District");
    if (abhaData.pincode) filledFields.push("Pincode");
    if (abhaData.abhaNumber) filledFields.push("ABHA Number");

    Swal.fire({
      icon: "success",
      title: "ABHA Linked Successfully!",
      html: `
      <div>
        <p><strong>ABHA Number:</strong> ${formatAbhaNumber(abhaData.abhaNumber)}</p>
        <p><strong>ABHA Address:</strong> ${abhaData.abhaAddress || "Not set"}</p>
        ${
          abhaData.isExistingAbha
            ? '<p class="text-info"><i class="fa fa-info-circle"></i> This is an existing ABHA profile.</p>'
            : '<p class="text-success"><i class="fa fa-check-circle"></i> New ABHA created successfully.</p>'
        }
        <hr>
        <p class="text-muted">The following fields have been auto-filled:</p>
        <p><strong>${filledFields.join(", ") || "No fields were auto-filled"}</strong></p>
      </div>
    `,
      timer: 4000,
      timerProgressBar: true,
    });
  };

  // Handle ABHA Verification Success
  const handleAbhaVerificationSuccess = (abhaData) => {
    console.log("ABHA Verification Data received:", abhaData);

    const updatedFormData = { ...patientDetailForm };

    // Fill name
    if (abhaData.consentName) {
      const nameParts = abhaData.consentName.trim().split(/\s+/);
      updatedFormData.patientFn =
        updatedFormData.patientFn || nameParts[0] || "";
      updatedFormData.patientLn =
        updatedFormData.patientLn || nameParts.slice(1).join(" ") || "";
    }

    // Fill mobile
    if (abhaData.mobileNumber) {
      updatedFormData.patientMobileNumber =
        updatedFormData.patientMobileNumber || String(abhaData.mobileNumber);
    }

    // Fill gender using the mapped ID
    if (abhaData.genderId) {
      const selectedGender = genderData.find(
        (g) => g.id === Number(abhaData.genderId),
      );
      if (selectedGender) {
        updatedFormData.patientGender = selectedGender;
      }
    } else if (abhaData.gender) {
      const genderMap = {
        Male: 29,
        Female: 30,
        Other: 32,
        Transgender: 31,
      };
      const genderId = genderMap[abhaData.gender];
      if (genderId) {
        const selectedGender = genderData.find((g) => g.id === genderId);
        if (selectedGender) {
          updatedFormData.patientGender = selectedGender;
        }
      }
    }

    if (abhaData.dateOfBirth) {
      const dateParts = abhaData.dateOfBirth.split("-");
      if (dateParts.length === 3) {
        const formattedDate = `${dateParts[2]}-${dateParts[1].padStart(2, "0")}-${dateParts[0].padStart(2, "0")}`;
        updatedFormData.patientDob =
          updatedFormData.patientDob || formattedDate;
        if (!updatedFormData.patientAge) {
          updatedFormData.patientAge = calculateAgeFromDOB(formattedDate);
        }
      }
    }

    if (abhaData.address) {
      const addressParts = abhaData.address.split(",");
      updatedFormData.patientAddress1 =
        updatedFormData.patientAddress1 || addressParts[0]?.trim() || "";
      if (addressParts.length > 1) {
        updatedFormData.patientAddress2 =
          updatedFormData.patientAddress2 ||
          addressParts.slice(1).join(",").trim() ||
          "";
      }
    }

    if (abhaData.stateId) {
      const selectedState = stateData.find(
        (s) => s.id === Number(abhaData.stateId),
      );
      if (selectedState) {
        updatedFormData.patientState = selectedState;
      }
    } else if (abhaData.stateName) {
      const state = stateData.find(
        (s) => s.stateName?.toLowerCase() === abhaData.stateName.toLowerCase(),
      );
      if (state) {
        updatedFormData.patientState = state;
      }
    }

    if (abhaData.districtId) {
      const selectedDistrict = districtData.find(
        (d) => d.id === Number(abhaData.districtId),
      );
      if (selectedDistrict) {
        updatedFormData.patientDistrict = selectedDistrict;
      }
    } else if (abhaData.districtName) {
      const district = districtData.find(
        (d) =>
          d.districtName?.toLowerCase() === abhaData.districtName.toLowerCase(),
      );
      if (district) {
        updatedFormData.patientDistrict = district;
      }
    }

    if (abhaData.pincode) {
      updatedFormData.patientPincode =
        updatedFormData.patientPincode || String(abhaData.pincode);
    }

    if (abhaData.photo) {
      const photoUrl = abhaData.photo.startsWith("data:")
        ? abhaData.photo
        : `data:image/jpeg;base64,${abhaData.photo}`;
      setImage(photoUrl);
    }

    if (abhaData.abhaNumber) {
      updatedFormData.abhaNumber = abhaData.abhaNumber;
    }

    setPatientDetailForm(updatedFormData);

    setAbhaData((prev) => ({
      ...prev,
      abhaNumber: abhaData.abhaNumber,
      abhaAddress: abhaData.abhaAddress,
      consentName: abhaData.consentName || prev.consentName,
      verified: true,
    }));

    const filledFields = [];
    if (abhaData.consentName) filledFields.push("Name");
    if (abhaData.mobileNumber) filledFields.push("Mobile");
    if (abhaData.dateOfBirth) filledFields.push("DOB");
    if (abhaData.address) filledFields.push("Address");
    if (abhaData.gender) filledFields.push("Gender");
    if (abhaData.stateName) filledFields.push("State");
    if (abhaData.districtName) filledFields.push("District");
    if (abhaData.pincode) filledFields.push("Pincode");
    if (abhaData.abhaNumber) filledFields.push("ABHA Number");

    Swal.fire({
      icon: "success",
      title: "ABHA Verified Successfully!",
      html: `
      <div>
        <p><strong>ABHA Number:</strong> ${formatAbhaNumber(abhaData.abhaNumber)}</p>
        <p><strong>ABHA Address:</strong> ${abhaData.abhaAddress || "Not set"}</p>
        <hr>
        <p class="text-muted">The following fields have been auto-filled:</p>
        <p><strong>${filledFields.join(", ") || "No fields were auto-filled"}</strong></p>
      </div>
    `,
      timer: 4000,
      timerProgressBar: true,
    });
  };

  const useAbhaData = () => {
    Swal.fire({
      icon: "success",
      title: "ABHA Details Applied",
      text: "ABHA details have been applied to the form.",
      timer: 1500,
    });
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
        Swal.fire("Error!", IMAGE_UPLOAD_FAIL_MSG, "error");
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

  useEffect(() => {
    if (masterDataLoadedRef.current) return;
    masterDataLoadedRef.current = true;
    loadMasterData();
  }, []);

  const handleEdit = async (patient) => {
    try {
      const patientId = patient.id;
      if (!patientId) return;

      setEditLoadingId(patientId);

      let response = patientDetailsCacheRef.current.get(patientId);
      if (!response) {
        if (patientDetailsInFlightRef.current.has(patientId)) {
          response = await patientDetailsInFlightRef.current.get(patientId);
        } else {
          const request = getRequest(
            `${PATIENT_FOLLOW_UP_DETAILS}/${patientId}`,
          )
            .then((res) => {
              if (res.status === 200) {
                patientDetailsCacheRef.current.set(patientId, res);
              }
              return res;
            })
            .finally(() => {
              patientDetailsInFlightRef.current.delete(patientId);
            });

          patientDetailsInFlightRef.current.set(patientId, request);
          response = await request;
        }
      }
      debugger;
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
          patientGender: personal.gender
            ? { id: personal.gender, name: personal.genderName }
            : "",
          patientAbhaId: personal.patientAbhaId || "",
          patientRelation: personal.relation
            ? { id: personal.relation, name: personal.relationName }
            : "",
          patientAddress1: address.address1 || "",
          patientAddress2: address.address2 || "",
          patientCity: address.city || "",
          patientPincode: address.pinCode || "",
          patientDistrict: address.district
            ? { id: address.district, name: address.districtName }
            : "",
          patientState: address.state
            ? { id: address.state, name: address.stateName }
            : "",
          patientCountry: address.country
            ? { id: address.country, name: address.countryName }
            : "",
          nokFn: nok.firstName || "",
          nokMn: nok.middleName || "",
          nokLn: nok.lastName || "",
          nokEmail: nok.email || "",
          nokMobileNumber: nok.mobileNo || "",
          nokAddress1: nok.address1 || "",
          nokAddress2: nok.address2 || "",
          nokCity: nok.city || "",
          nokPincode: nok.pinCode || "",
          nokDistrict: nok.district
            ? { id: nok.district, name: nok.districtName }
            : "",
          nokState: nok.state ? { id: nok.state, name: nok.stateName } : "",
          nokCountry: nok.country
            ? { id: nok.country, name: nok.countryName }
            : "",
          emerFn: emergency.firstName || "",
          emerLn: emergency.lastName || "",
          emerMobile: emergency.mobileNo || "",
          abhaNumber: personal.abhaNumber || "",
        };

        setPatientDetailForm(mappedPatientData);

        if (address.country) {
          await fetchStates(address.country);
          if (address.state) {
            const selectedState = stateData.find((s) => s.id === address.state);
            if (selectedState) {
              await fetchDistrict(address.state);
            }
          }
        }

        if (nok.country) {
          await fetchNokStates(nok.country);
          if (nok.state) {
            await fetchNokDistrict(nok.state);
          }
        }

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
              visitType: appt.visitType || null,
              tokenStartTime: startTime,
              tokenEndTime: endTime,
              selectedTimeSlot:
                startTime && endTime ? `${startTime} - ${endTime}` : "",
            };
          });

          setAppointments(mappedAppointments);
          setNextAppointmentId(mappedAppointments.length);
          setAppointmentFlag(true);

          const uniqueSpecialities = [
            ...new Set(
              mappedAppointments.map((appt) => appt.speciality).filter(Boolean),
            ),
          ];

          const doctorsBySpeciality = await Promise.all(
            uniqueSpecialities.map(async (speciality) => [
              speciality,
              await getDoctorsBySpeciality(speciality),
            ]),
          );
          const doctorMap = Object.fromEntries(doctorsBySpeciality);

          setDoctorDataMap((prev) => {
            const next = { ...prev };
            mappedAppointments.forEach((appt) => {
              if (appt.speciality) {
                next[appt.id] = doctorMap[appt.speciality] || [];
              }
            });
            return next;
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
      Swal.fire("Error", UNABLE_TO_LOAD_PATIENT_DETAILS, "error");
    } finally {
      setEditLoadingId(null);
    }
  };

  async function fetchGenderData() {
    try {
      const data = await getRequest(`${MAS_GENDER}/getAll/1`);
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
    // setLoading(true);

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
    }
    // finally {
    //   setLoading(false);
    // }
  }

  async function fetchCountryData() {
    // setLoading(true);

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
    }
    // finally {
    //   setLoading(false);
    // }
  }

  async function fetchStates(value) {
    if (!value) return;
    const cacheKey = String(value);
    if (statesByCountryCacheRef.current.has(cacheKey)) {
      setStateData(statesByCountryCacheRef.current.get(cacheKey));
      return;
    }

    try {
      setLoading(true);
      const data = await getRequest(`${STATE_BY_COUNTRY}${value}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        statesByCountryCacheRef.current.set(cacheKey, data.response);
        setStateData(data.response);
      } else {
        console.error(UNEXPECTED_API_RESPONSE_ERR, data);
        setStateData([]);
      }
    } catch (error) {
      console.error(FETCH_DATA_ERROR, error);
    }
    // finally {
    //   setLoading(false);
    // }
  }

  async function fetchAllSessions() {
    try {
      setLoading(true);
      const data = await getRequest(`${GET_SESSION}1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setSession(data.response);
      } else {
        console.error(UNEXPECTED_API_RESPONSE_ERR, data);
        setSession([]);
      }
    } catch (error) {
      console.error(FETCH_DATA_ERROR, error);
    }
    //  finally {
    //   setLoading(false);
    // }
  }

  async function fetchDistrict(value) {
    if (!value) return;
    const cacheKey = String(value);
    if (districtsByStateCacheRef.current.has(cacheKey)) {
      setDistrictData(districtsByStateCacheRef.current.get(cacheKey));
      return;
    }

    try {
      setLoading(true);
      const data = await getRequest(`${DISTRICT_BY_STATE}${value}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        districtsByStateCacheRef.current.set(cacheKey, data.response);
        setDistrictData(data.response);
      } else {
        console.error(UNEXPECTED_API_RESPONSE_ERR, data);
        setDistrictData([]);
      }
    } catch (error) {
      console.error(FETCH_DATA_ERROR, error);
    }
    // finally {
    //   setLoading(false);
    // }
  }

  async function fetchNokStates(value) {
    if (!value) return;
    const cacheKey = String(value);
    if (statesByCountryCacheRef.current.has(cacheKey)) {
      setNokStateData(statesByCountryCacheRef.current.get(cacheKey));
      return;
    }

    try {
      setLoading(true);
      const data = await getRequest(`${STATE_BY_COUNTRY}${value}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        statesByCountryCacheRef.current.set(cacheKey, data.response);
        setNokStateData(data.response);
      } else {
        console.error(UNEXPECTED_API_RESPONSE_ERR, data);
        setNokStateData([]);
      }
    } catch (error) {
      console.error(FETCH_DATA_ERROR, error);
    }
    // finally {
    //   setLoading(false);
    // }
  }

  async function fetchNokAllStates(value) {
    try {
      setLoading(true);
      const data = await getRequest(`${ALL_STATE}/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setNokStateData(data.response);
      } else {
        console.error(UNEXPECTED_API_RESPONSE_ERR, data);
        setNokStateData([]);
      }
    } catch (error) {
      console.error(FETCH_DATA_ERROR, error);
    }
    // finally {
    //   setLoading(false);
    // }
  }

  async function fetchNokDistrict(value) {
    if (!value) return;
    const cacheKey = String(value);
    if (districtsByStateCacheRef.current.has(cacheKey)) {
      setNokDistrictData(districtsByStateCacheRef.current.get(cacheKey));
      return;
    }

    try {
      setLoading(true);
      const data = await getRequest(`${DISTRICT_BY_STATE}${value}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        districtsByStateCacheRef.current.set(cacheKey, data.response);
        setNokDistrictData(data.response);
      } else {
        console.error(UNEXPECTED_API_RESPONSE_ERR, data);
        setNokDistrictData([]);
      }
    } catch (error) {
      console.error(FETCH_DATA_ERROR, error);
    }
    //  finally {
    //   setLoading(false);
    // }
  }

  async function fetchDepartment() {
    try {
      setLoading(true);
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
    }
    // finally {
    //   setLoading(false);
    // }
  }

  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setPatientDetailForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    console.log("Patient Detail Form:", patientDetailForm);

    if (!patientDetailForm.id) {
      Swal.fire("Error", SELECT_PATIENT_TO_UPDATE_ERROR, "error");
      return;
    }

    if (appointmentFlag) {
      const validAppointments = appointments.filter(
        (appt) => appt.speciality && appt.selDoctorId && appt.selSession,
      );

      if (validAppointments.length === 0) {
        Swal.fire("Error", ADD_AT_LEAST_ONE_APPOINTMENT_ERROR, "error");
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
      setLoading(true);
      const data = await getRequest(`${DOCTOR_BY_SPECIALITY}${value}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setDoctorData(data.response);
      } else {
        console.error(UNEXPECTED_API_RESPONSE_ERR, data);
        setDoctorData([]);
      }
    } catch (error) {
      console.error(FETCH_DATA_ERROR, error);
    }
    // finally {
    //   setLoading(false);
    // }
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
      Swal.fire("Validation Error", CHECK_REQUIRED_FIELDS_ERROR, "error");
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
      patientImage: smartTruncate(
        imageURL || patientDetailForm.patientImage || "",
      ),
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
      patientAbhaId: patientDetailForm.abhaNumber || "",
    };

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
              visitType: appt.visitType || "F",
              lastChgBy: username,
            };
          })
      : [];

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

        const visits = patientResp?.visits || [];
        const hasBillingStatusY =
          visits.length > 0 && visits[0]?.billingStatus === "y";

        if (hasBillingStatusY) {
          Swal.fire({
            title: PATIENT_UPDATED_SUCCESS_TITLE,
            html: `<p>Patient has been updated successfully.</p>
                 <p>Redirecting to pending billing...</p>`,
            icon: "success",
            showConfirmButton: false,
            timer: 1000,
            allowOutsideClick: false,
          }).then(() => {
            navigate("/OPDBillingDetails", { replace: true });
          });
        } else if (resp) {
          Swal.fire({
            title: PATIENT_UPDATED_SUCCESS_TITLE,
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
              navigate("/OPDBillingDetails", {
                state: {
                  source: "billing",
                  patientId: resp.patientid,
                },
              });
            } else if (result.dismiss === Swal.DismissReason.cancel) {
              handleReset();
            }
          });
        } else if (patientResp) {
          const displayName =
            patientResp.patientName ||
            `${patientDetailForm.patientFn || ""} ${patientDetailForm.patientLn || ""}`.trim();

          Swal.fire({
            title: PATIENT_UPDATED_SUCCESS_TITLE,
            html: `<p><strong>${displayName || "Patient"}</strong> has been updated successfully.</p>`,
            icon: "success",
            confirmButtonText: "OK",
            allowOutsideClick: false,
          }).then(() => {
            handleReset();
          });
        } else {
          Swal.fire({
            icon: "success",
            title: "Update Successful",
            text: PATIENT_UPDATE_SUCCESS,
          }).then(() => {
            handleReset();
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
    } finally {
      setLoading(false);
    }
  };

  const currentItems = patients;

  // Handle page change without refreshing
  const handlePageChange = (page) => {
    setCurrentPage(page);
    handleSearch(page - 1);
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
      Swal.fire("Invalid Page", INVALID_PAGE_NO_WARN_MSG, "warning");
    }
  };

  // if (loading) {
  //   return (
  //     <div
  //       className="d-flex justify-content-center align-items-center"
  //       style={{ height: "100vh" }}
  //     >
  //       <div className="spinner-border text-primary" role="status">
  //         <span className="visually-hidden">Loading...</span>
  //       </div>
  //     </div>
  //   );
  // }

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
      //setLoading(true);

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

      const url = `${GET_TOKENS}/0?${params}`;
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
          text: data.message || NO_TOKENS_AVAILABLE_TEXT,
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
    }
    //  finally {
    //   setLoading(false);
    // }
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
    {
      loading && (
        <div className="text-center py-4">
          <LoadingScreen />
        </div>
      );
    }

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

          {/* ABHA Integration Section - Add this after Personal Details and before Patient Address */}
          <div className="row mb-3">
            <div className="col-sm-12">
              <div className="card shadow">
                <div className="card-header py-3 border-bottom-1">
                  <h6 className="mb-0 fw-bold">ABHA Health ID Integration</h6>
                </div>

                <div className="card-body">
                  <div className="row">
                    {/* Existing ABHA - Verify Section */}
                    <div className="col-md-6 border-end">
                      <div className="form-check mb-3">
                        <input
                          type="radio"
                          name="abhaMode"
                          checked={abhaMode === "existing"}
                          onChange={() => setAbhaMode("existing")}
                        />
                        <label className="form-check-label fw-bold">
                          I have ABHA
                        </label>
                      </div>

                      <p className="text-muted small mb-3">
                        Verify an existing ABHA Health ID. You can verify using
                        Mobile Number, Aadhaar Number, ABHA Number, or ABHA
                        Address.
                      </p>

                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setShowAbhaVerificationModal(true)}
                        disabled={abhaMode !== "existing"}
                      >
                        <i className="bi bi-check-circle me-2"></i>
                        Verify ABHA
                      </button>

                      {abhaData.verified && (
                        <div className="alert alert-success mt-3">
                          <h6>✓ Verified Successfully</h6>
                          {abhaData.consentName && (
                            <div>
                              <strong>Name:</strong> {abhaData.consentName}
                            </div>
                          )}
                          <div>
                            <strong>ABHA Number:</strong> {abhaData.abhaNumber}
                          </div>
                          {abhaData.abhaAddress && (
                            <div>
                              <strong>ABHA Address:</strong>{" "}
                              {abhaData.abhaAddress}
                            </div>
                          )}
                          <button
                            className="btn btn-outline-primary btn-sm mt-2"
                            onClick={useAbhaData}
                          >
                            <i className="bi bi-arrow-right me-1"></i>
                            Use Details
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Create New ABHA */}
                    <div className="col-md-6">
                      <div className="form-check mb-3">
                        <input
                          type="radio"
                          name="abhaMode"
                          checked={abhaMode === "new"}
                          onChange={() => setAbhaMode("new")}
                        />
                        <label className="form-check-label fw-bold">
                          Create New ABHA
                        </label>
                      </div>

                      <p className="text-muted small mb-3">
                        Create a new ABHA Health ID for the patient. This will
                        link their Aadhaar to create a unique health identifier.
                      </p>

                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setShowAbhaCreationModal(true)}
                        disabled={abhaMode !== "new"}
                      >
                        <i className="bi bi-plus-circle me-2"></i>
                        Create New ABHA
                      </button>

                      {abhaData.verified && abhaMode === "new" && (
                        <div className="alert alert-success mt-3">
                          <h6>✓ ABHA Created Successfully</h6>
                          <div>
                            <strong>ABHA Number:</strong> {abhaData.abhaNumber}
                          </div>
                          <div>
                            <strong>ABHA Address:</strong>{" "}
                            {abhaData.abhaAddress}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ABHA Verification Modal */}
          <ABHAVerificationModal
            show={showAbhaVerificationModal}
            onClose={() => setShowAbhaVerificationModal(false)}
            onSuccess={handleAbhaVerificationSuccess}
            patientData={{
              firstName: patientDetailForm.patientFn,
              lastName: patientDetailForm.patientLn,
              mobileNo: patientDetailForm.patientMobileNumber,
              aadhaarNo: abhaData.aadhaarNo,
              email: patientDetailForm.patientEmailId,
              patientAbhaId: patientDetailForm.abhaNumber || patientDetailForm.patientAbhaId || "",
            }}
            genderData={genderData}
            stateData={stateData}
            districtData={districtData}
          />

          {/* ABHA Creation Modal */}
          <ABHACreationModal
            show={showAbhaCreationModal}
            onClose={() => setShowAbhaCreationModal(false)}
            onSuccess={handleAbhaCreationSuccess}
            patientData={{
              firstName: patientDetailForm.patientFn,
              lastName: patientDetailForm.patientLn,
              mobileNo: patientDetailForm.patientMobileNumber,
              email: patientDetailForm.patientEmailId,
            }}
            genderData={genderData}
            stateData={stateData}
            districtData={districtData}
          />

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
                          <div className="col-md-4">
                            <label className="form-label" htmlFor="abhaNumber">
                              ABHA Number
                            </label>
                            <input
                              type="text"
                              id="abhaNumber"
                              name="abhaNumber"
                              className="form-control"
                              value={patientDetailForm.abhaNumber ||patientDetailForm.patientAbhaId|| ""}
                              readOnly
                              placeholder="Not linked"
                              style={{ backgroundColor: "#f8f9fa" }}
                            />
                            <small className="text-muted">
                              ABHA number will be auto-filled after verification
                              or creation
                            </small>
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
                          value={patientDetailForm.patientCountry?.id || ""}
                          onChange={(e) => {
                            const selected = countryData.find(
                              (c) => c.id === Number(e.target.value),
                            );
                            handleAddChange({
                              target: {
                                name: "patientCountry",
                                value: selected,
                              },
                            });
                            fetchStates(selected.id);
                          }}
                        >
                          <option value="">Select Country</option>
                          {countryData.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.countryName}
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
                          name="patientCountry"
                          value={patientDetailForm.patientCountry?.id || ""}
                          onChange={(e) => {
                            const selected = countryData.find(
                              (c) => c.id === Number(e.target.value),
                            );
                            handleAddChange({
                              target: {
                                name: "patientCountry",
                                value: selected,
                              },
                            });
                            fetchStates(selected.id);
                          }}
                        >
                          <option value="">Select Country</option>
                          {countryData.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.countryName}
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

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="body d-flex py-3">
      <div className="container-fluid">
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
                      onClick={() => {
                        setCurrentPage(1);
                        handleSearch(0);
                      }}
                      disabled={searchLoading} // Use searchLoading instead of loading
                    >
                      {searchLoading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Searching...
                        </>
                      ) : (
                        "Search"
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleReset}
                    >
                      Reset
                    </button>
                  </div>

                  {searchPerformed && patients.length > 0 && (
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
                              <th>ABHA ID</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentItems.map((patient, index) => (
                              <tr key={index} className="table-row-hover">
                                <td>{`${patient.fullName || ""}`.trim()}</td>
                                <td>{patient.patientMobileNumber || ""}</td>
                                <td>{patient.uhidNo || ""}</td>
                                <td>{patient.patientAge || ""}</td>
                                <td>{patient.gender || ""}</td>
                                <td>{patient.patientEmailId || ""}</td>
                                <td>{patient.patientAbhaId || "N/A"}</td>
                                <td>
                                  {/* <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleEdit(patient)}
                                    disabled={loading}
                                  >
                                    Edit
                                    <span className="ms-2">
                                      <i className="icofont-edit"></i>
                                    </span>
                                  </button> */}
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={async () => {
                                      setEditLoadingId(patient.id);

                                      try {
                                        await handleEdit(patient);
                                      } finally {
                                        setEditLoadingId(null);
                                      }
                                    }}
                                    disabled={editLoadingId === patient.id}
                                  >
                                    {editLoadingId === patient.id ? (
                                      <>
                                        <span
                                          className="spinner-border spinner-border-sm me-2"
                                          role="status"
                                          aria-hidden="true"
                                        ></span>
                                        Editing...
                                      </>
                                    ) : (
                                      <>
                                        Edit
                                        <span className="ms-2">
                                          <i className="icofont-edit"></i>
                                        </span>
                                      </>
                                    )}
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
                {searchPerformed && totalPages >= 1 && (
                  <nav className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                      <span>
                        Page {currentPage} of {totalPages} | Total:{" "}
                        {totalElements}
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
