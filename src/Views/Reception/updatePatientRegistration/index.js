import React, { useState, useRef, useEffect } from "react";
import placeholderImage from "../../../assets/images/placeholder.jpg";
import { getRequest, postRequest } from "../../../service/apiService";
import {
  ALL_COUNTRY,
  ALL_DEPARTMENT, ALL_DISTRICT,
  ALL_GENDER,
  ALL_RELATION, ALL_STATE,
  API_HOST,
  DISTRICT_BY_STATE,
  DOCTOR_BY_SPECIALITY,
  GET_DOCTOR_SESSION,
  GET_SESSION, HOSPITAL, PATIENT_FOLLOW_UP,
  PATIENT_IMAGE_UPLOAD,
  PATIENT_REGISTRATION,
  PATIENT_SEARCH,
  STATE_BY_COUNTRY
} from "../../../config/apiConfig";
import { DEPARTMENT_CODE_OPD } from "../../../config/constants";
import Swal from "sweetalert2";
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
  const handleChangeSearch = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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

    return `${years}y ${months}m ${days}d`;
  }

  function checkBMI(a, b) {
    debugger;
    if (a === '' || b == '') {
      return;
    }
    var c = b / 100;
    var d = c * c;
    var sub = a / d;
    return (parseFloat(Math.round(sub * 100) / 100).toFixed(2));
  }
  const handleChange = (e) => {
    if (e.target.name == 'patientAge') {
      patientDetailForm.patientDob = calculateDOBFromAge(e.target.value);
    }
    else if (e.target.name == 'patientDob') {
      patientDetailForm.patientAge = calculateAgeFromDOB(e.target.value);
    }
    else if (e.target.name == 'weight' && patientDetailForm.height != undefined) {
      patientDetailForm.bmi = checkBMI(e.target.value, patientDetailForm.height);
    } else if (e.target.name == 'height' && patientDetailForm.weight != undefined) {
      patientDetailForm.bmi = checkBMI(patientDetailForm.weight, e.target.value);
    }
    setPatientDetailForm({
      ...patientDetailForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSearch = async () => {
    const searchPayload = {
      mobileNo: formData.mobileNo,
      patientName: formData.patientName,
      uhidNo: formData.uhidNo,
      appointmentDate: formData.appointmentDate,
    };
    try {
      const response = await postRequest(`${PATIENT_SEARCH}`, searchPayload);
      setPatients(response.response);
    } catch (error) {
      console.error("Error searching patients:", error);
    }
  };


  const handleRadioChange = (event) => {
    if (event.target.value === "appointment") {
      setAppointmentFlag(true);
      setShowDetails(true);
    } else {
      setAppointmentFlag(false);
      setShowDetails(false);
    }
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
      debugger;
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
  const handleEdit = (patient) => {
    setPatientDetailForm(patient);
    console.log(patient)
    setShowPatientDetails(true);

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
    if (e.target.name == 'patientState')
      debugger;
    const { name, value } = e.target;
    setPatientDetailForm((prev) => ({ ...prev, [name]: value }));
  };

  function handleSubmit() {
    console.log(patientDetailForm);
    if (imageURL != "") {
      patientDetailForm.patientImage = imageURL;

    }
    sendPatientData();
  }
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
    const requiredFields = ["patientFn", "patientGender", "patientRelation", "patientDob", "patientEmailId", "patientMobileNumber"];
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
      "age"
    ];

    let valid = true;
    const newErrors = {};

    requiredFields.forEach((field) => {
      if (!patientDetailForm[field] || patientDetailForm[field].toString().trim() === "") {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`;
        valid = false;
      }
    });

    if (patientDetailForm.patientEmailId && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientDetailForm.patientEmailId)) {
      newErrors.email = "Invalid email format.";
      valid = false;
    }

    if (patientDetailForm.patientMobileNumber && !/^\d{10}$/.test(patientDetailForm.patientMobileNumber)) {
      newErrors.mobileNo = "Mobile number must be exactly 10 digits.";
      valid = false;
    }

    if (patientDetailForm.patientPincode && !/^\d{6}$/.test(patientDetailForm.patientPincode)) {
      newErrors.pinCode = "Pin Code must be exactly 6 digits.";
      valid = false;
    }

    numericFields.forEach((field) => {
      const value = patientDetailForm[field];
      if (value != undefined && value !== "" && (isNaN(value) || Number(value) < 0)) {
        debugger;
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} must be a non-negative number.`;
        valid = false;
      }
      if ((field === "age" || requiredFields.includes(field)) && Number(value) <= 0) {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} must be greater than 0.`;
        valid = false;
      }
    });

    setErrors(newErrors);
    return valid;
  };
  const sendPatientData = async () => {
    if (validateForm()) {
      const requestData = {
        patient: {
          id: patientDetailForm.id,
          uhidNo: patientDetailForm.uhidNo,
          patientStatus: "",
          regDate: new Date(Date.now()).toJSON().split('.')[0].split('T')[0],
          lastChgBy: sessionStorage.getItem('username'),
          patientHospitalId: hospitalId,
          patientFn: patientDetailForm.patientFn,
          patientMn: patientDetailForm.patientMn,
          patientLn: patientDetailForm.patientLn,
          patientDob: patientDetailForm.patientDob,
          patientAge: patientDetailForm.patientAge,
          patientGenderId: patientDetailForm.patientGender.id,
          patientEmailId: patientDetailForm.patientEmailId,
          patientMobileNumber: patientDetailForm.patientMobileNumber,
          patientImage: patientDetailForm.imageURL,
          fileName: "string",
          patientRelationId: patientDetailForm.patientRelation.id,
          patientMaritalStatusId: undefined,
          patientReligionId: undefined,
          patientAddress1: patientDetailForm.patientAddress1,
          patientAddress2: patientDetailForm.patientAddress2,
          patientCity: patientDetailForm.patientCity,
          patientPincode: patientDetailForm.patientPincode,
          patientDistrictId: patientDetailForm.patientDistrict != null ? patientDetailForm.patientDistrict.id : undefined,
          patientStateId: patientDetailForm.patientState != null ? patientDetailForm.patientState.id : undefined,
          patientCountryId: patientDetailForm.patientCountry != null ? patientDetailForm.patientCountry.id : undefined,
          pincode: patientDetailForm.patientPincode,
          emerFn: patientDetailForm.emerFn,
          emerLn: patientDetailForm.emerLn,
          emerRelationId: undefined,
          emerMobile: patientDetailForm.emerMobile,
          nokFn: patientDetailForm.nokFn,
          nokLn: patientDetailForm.nokLn,
          nokEmail: patientDetailForm.nokEmail,
          nokMobileNumber: patientDetailForm.nokMobileNumber,
          nokAddress1: patientDetailForm.nokAddress1,
          nokAddress2: patientDetailForm.nokAddress2,
          nokCity: patientDetailForm.nokCity,
          nokDistrictId: patientDetailForm.nokDistrict != null ? patientDetailForm.nokDistrict.id : undefined,
          nokStateId: patientDetailForm.nokState != null ? patientDetailForm.nokState.id : undefined,
          nokCountryId: patientDetailForm.nokCountry != null ? patientDetailForm.nokCountry.id : undefined,
          nokPincode: patientDetailForm.nokPincode,
          nokRelationId: undefined
        },
        opdPatientDetail: {
          height: patientDetailForm.height,
          idealWeight: patientDetailForm.idealWeight,
          weight: patientDetailForm.weight,
          pulse: patientDetailForm.pulse,
          temperature: patientDetailForm.temperature,
          opdDate: patientDetailForm.appointmentDate,
          rr: patientDetailForm.rr,
          bmi: patientDetailForm.bmi,
          spo2: patientDetailForm.spo2,
          varation: patientDetailForm.varation,
          bpSystolic: patientDetailForm.systolicBP,
          bpDiastolic: patientDetailForm.diastolicBP,
          icdDiag: "string",
          workingDiag: "string",
          followUpFlag: "string",
          followUpDays: 0,
          pastMedicalHistory: "string",
          presentComplaints: "string",
          familyHistory: "string",
          treatmentAdvice: "string",
          sosFlag: "string",
          recmmdMedAdvice: "string",
          medicineFlag: "s",
          labFlag: "s",
          radioFlag: "s",
          referralFlag: "s",
          mlcFlag: "s",
          policeStation: "string",
          policeName: "string",
          patientId: patientDetailForm.id,
          visitId: 0,
          departmentId: Number(patientDetailForm.speciality),
          hospitalId: hospitalId,
          doctorId: Number(patientDetailForm.selDoctorId),
          lastChgBy: "string"
        },
        visit: {
          id: 0,
          tokenNo: 0,
          visitStatus: "string",
          // visitDate: new Date(Date.now()).toJSON().split('.')[0],
          visitDate: new Date(Date.now()).toJSON(),
          departmentId: Number(patientDetailForm.speciality),
          doctorId: Number(patientDetailForm.selDoctorId),
          doctorName: "",
          hospitalId: hospitalId,
          sessionId: Number(patientDetailForm.selSession),
          billingStatus: "string",
          priority: 0,
          patientId: patientDetailForm.id,
          iniDoctorId: Number(patientDetailForm.selDoctorId),
        },
      };
      debugger;
      if (isNaN(requestData.visit.doctorId))
        requestData.visit = null;
      // requestData.opdPatientDetail=null;
      console.log(new Date(Date.now()).toJSON())

      const updateReq = {
        appointmentFlag: appointmentFlag,
        patientDetails: requestData
      }
      console.log(updateReq);
      try {
        debugger;
        const data = await postRequest(`${PATIENT_FOLLOW_UP}`, updateReq);
        if (data.status === 200) {
          if (appointmentFlag) {
            await Swal.fire("Appointment Scheduled", "", "success");
          }
          else {
            await Swal.fire("Patient Details Updated", "", "success");
          }
          setShowPatientDetails(false);
        } else {
          console.error("Unexpected API response format:", data);
          setDoctorData([]);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };



  return (
    <div className="body d-flex py-3">
      <div className="container-xxl">
        <div className="row align-items-center">
          <div className="border-0 mb-4">
            <div className="card-header py-3 no-bg bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap">
              <h3 className="fw-bold mb-0">Update Patient Registration and Followup Appointment
              </h3>
            </div>
          </div>
        </div>

        {/* Patient address */}
        <div className="row mb-3">
          <div className="col-sm-12">
            <div className="card shadow mb-3">
              <div className="card-header py-3 bg-light border-bottom-1">
                <h6 className="mb-0 fw-bold">Appointment of Patient </h6>
              </div>
              <div className="card-body">
                <form>
                  <div className="row g-3">
                    {showPatientDetails && (<>
                      {/* Radio Buttons */}
                      <div className="">
                        <div className="form-check form-check-inline">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="appointmentType"
                            id="updateInfo"
                            value="updateInfo"
                            onChange={handleRadioChange}
                            defaultChecked
                          />
                          <label className="form-check-label" htmlFor="updateInfo">
                            Update Information
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
                          />
                          <label className="form-check-label" htmlFor="appointment">
                            Appointment
                          </label>
                        </div>
                      </div>
                    </>)}

                    {/* Mobile No, Patient Name, UHID No */}
                    <div className="row g-3">
                      <div className="col-md-3">
                        <label className="form-label">Mobile No.</label>
                        <input type="text" className="form-control" placeholder="Enter Mobile No."
                          name="mobileNo"
                          value={formData.mobileNo}
                          onChange={handleChangeSearch} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Patient Name</label>
                        <input type="text" className="form-control" placeholder="Enter Patient Name"
                          name="patientName"
                          value={formData.patientName}
                          onChange={handleChangeSearch} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">UHID No.</label>
                        <input type="text" className="form-control" placeholder="Enter UHID No."
                          name="uhidNo"
                          value={formData.uhidNo}
                          onChange={handleChangeSearch} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Appointment Date</label>
                        <input type="date" className="form-control"
                          name="appointmentDate"
                          value={formData.appointmentDate}
                          onChange={handleChangeSearch} />
                      </div>
                    </div>


                    {/* Buttons */}
                    <div className="mt-3">
                      <button type="button" className="btn btn-primary me-2" onClick={handleSearch}>
                        Search
                      </button>
                      <button type="reset" className="btn btn-secondary">
                        Reset
                      </button>
                    </div>

                    <div className="col-md-12">
                      <table className="table table-bordered">
                        <thead className="table-secondary">
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
                          {patients.map((patient, index) => (
                            <tr key={index}>
                              <td>{`${patient.patientFn || ''} ${patient.patientMn || ''} ${patient.patientLn || ''}`.trim()}</td>
                              <td>{patient.patientMobileNumber || ''}</td>
                              <td>{patient.uhidNo}</td>
                              <td>{patient.patientAge || ''}</td>
                              <td>{patient.patientGender.genderName}</td>
                              <td>{patient.patientEmailId}</td>
                              <td>
                                <button type="button" className="btn btn-primary btn-sm" onClick={() => handleEdit(patient)}>
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

                    {/* Pagination */}
                    <div className="d-flex align-items-center justify-content-end">
                      <span className="me-2">Go To Page</span>
                      <input type="text" className="form-control me-2" style={{ width: "60px" }} />
                      <button className="btn btn-warning">Go</button>
                      <span className="mx-3">Page 1 of 2</span>
                      <button className="btn btn-light" disabled>&laquo;</button>
                      <button className="btn btn-light" disabled>&lsaquo;</button>
                      <button className="btn btn-light">&rsaquo;</button>
                      <button className="btn btn-light">&raquo;</button>
                    </div>

                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        {showPatientDetails && (<>
          {/* Patient Personal Details */}
          <div className="row mb-3">
            <div className="col-sm-12">
              <div className="card shadow mb-3">
                <div className="card-header py-3 bg-light border-bottom-1">
                  <h6 className="mb-0 fw-bold">Personal Details</h6>
                </div>
                <div className="card-body">
                  <form>
                    <div className="row g-3">
                      <div className="col-md-9">
                        <div className="row g-3">
                          <div className="col-md-4">
                            <label className="form-label">First Name *</label>
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
                            <label className="form-label" htmlFor="gender">Gender *</label>
                            <select className={`form-select ${errors.gender ? 'is-invalid' : ''}`} id="gender"
                              name="patientGender" value={patientDetailForm.patientGender} onChange={handleChange}>
                              <option value="">Select</option>
                              {genderData.map((gender) => (
                                <option key={gender.id} value={gender}>
                                  {gender.genderName}
                                </option>
                              ))}
                            </select>
                            {errors.gender && <div className="invalid-feedback">{errors.gender}</div>}
                          </div>
                          <div className="col-md-4">
                            <label className="form-label" htmlFor="relation">Relation *</label>
                            <select className={`form-select ${errors.relation ? 'is-invalid' : ''}`} id="relation"
                              name="patientRelation" value={patientDetailForm.patientRelation}
                              onChange={handleChange}>
                              <option value="">Select</option>
                              {relationData.map((relation) => (
                                <option key={relation.id} value={relation}>
                                  {relation.relationName}
                                </option>
                              ))}
                            </select>
                            {errors.relation && <div className="invalid-feedback">{errors.relation}</div>}
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">DOB *</label>
                            <input type="date" name="patientDob" className="form-control"
                              placeholder="Select Date of Birth" required
                              value={patientDetailForm.patientDob || ""} onChange={handleChange} />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Age</label>
                            <input
                              type="text" // <<== NOT number!
                              id="age"
                              name="age"
                              className={`form-control ${errors.age ? "is-invalid" : ""}`}
                              value={formData.age || ""}
                              onChange={handleChange}
                              placeholder="Enter Age"
                            />

                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Email *</label>
                            <input type="email" className="form-control" placeholder="Enter Email Address"
                              name="patientEmailId" value={patientDetailForm.patientEmailId || ""}
                              onChange={handleChange} required />
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
                              <img src={image || "/default-profile.png"} alt="Profile" className="img-fluid border"
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
                <div className="card-header py-3 bg-light border-bottom-1">
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
                <div className="card-header py-3 bg-light border-bottom-1">
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
                <div className="card-header py-3 bg-light border-bottom-1">
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

          {showDetails && (
            <>

              {/* Vital Details Section */}
              {!preConsultationFlag && <>
                <div className="row mb-3">
                  <div className="col-sm-12">
                    <div className="card shadow mb-3">
                      <div className="card-header py-3 bg-light border-bottom-1">
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
                /</>
              }


              {/* Appointment Details Section */}
              <div className="row mb-3">
                <div className="col-sm-12">
                  <div className="card shadow mb-3">
                    <div className="card-header py-3 bg-light border-bottom-1">
                      <h6 className="mb-0 fw-bold">Appointment Details</h6>
                    </div>
                    <div className="card-body">
                      <form>
                        <div className="row g-3">
                          <div className="col-md-4">
                            <label className="form-label">Speciality</label>
                            <select className="form-select" name="speciality" value={patientDetailForm.speciality}
                              onChange={(e) => {
                                handleAddChange(e);
                                fetchDoctor(e.target.value);
                              }}>
                              <option value="">Select Speciality</option>
                              {departmentData.map((department) => (
                                <option key={department.id} value={department.id}>
                                  {department.departmentName}
                                </option>))}
                            </select>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Doctor Name</label>
                            <select className="form-select" name="selDoctorId" value={patientDetailForm.selDoctorId}
                              onChange={(e) => {
                                handleAddChange(e);
                                fetchSession(e);
                              }}
                            >
                              <option value="">Select Doctor</option>
                              {doctorData.map((doctor) => (
                                <option key={doctor.id} value={doctor.userId}>
                                  {`${doctor.firstName} ${doctor.middleName ? doctor.middleName : ""} ${doctor.lastName ? doctor.lastName : ""}`}
                                </option>))}
                              {/* Add dynamic options here */}
                            </select>
                          </div>
                          {/*<div className="col-md-4">*/}
                          {/*  <label className="form-label">Date *</label>*/}
                          {/*  <input type="date" name="appointmentDate" className="form-control" name="appointmentDate" value={patientDetailForm.appointmentDate}*/}
                          {/*         onChange={(e) => {*/}
                          {/*           handleAddChange(e);*/}
                          {/*           fetchSession(e.target.value);*/}
                          {/*         }}*/}
                          {/*         min={new Date().toISOString().split("T")[0]}*/}
                          {/*         placeholder="Select Date of Appointment"/>*/}
                          {/*</div>*/}
                          <div className="col-md-4">
                            <label className="form-label">Session</label>
                            <select className="form-select" name="selSession" value={patientDetailForm.selSession}
                              onChange={(e) => {
                                handleAddChange(e);
                              }}
                            >
                              <option value="">Select Session</option>
                              {session.map((ses) => (
                                <option key={ses.id} value={ses.id}>
                                  {ses.sessionName}
                                </option>))}
                              {/* Add dynamic options here */}
                            </select>
                            {/*<select className="form-select">*/}
                            {/*  <option value="">Select Session</option>*/}
                            {/*  /!* Add dynamic options here *!/*/}
                            {/*</select>*/}
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Submit and Reset Buttons */}
          <div className="row mb-3">
            <div className="col-sm-12">
              <div className="card shadow mb-3">
                <div className="card-body">
                  <div className="row g-3">
                    <div className="mt-4">
                      <button type="button" onClick={handleSubmit} className="btn btn-primary me-2">Registration</button>
                      <button type="reset" className="btn btn-secondary">Reset</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>)}


      </div>
    </div>
  );
};
export default UpdatePatientRegistration;
