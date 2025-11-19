import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import placeholderImage from "../../../assets/images/placeholder.jpg";
import { getRequest, postRequest } from "../../../service/apiService";
import Swal from "sweetalert2";

import {
  API_HOST,
  ALL_COUNTRY, ALL_DEPARTMENT,
  ALL_GENDER,
  ALL_RELATION,
  DISTRICT_BY_STATE, DOCTOR_BY_SPECIALITY, PATIENT_IMAGE_UPLOAD,
  STATE_BY_COUNTRY, GET_DOCTOR_SESSION, PATIENT_REGISTRATION, GET_SESSION, HOSPITAL, MAS_OPD_SERVICE, MAS_SERVICE_CATEGORY
} from "../../../config/apiConfig";
import { DEPARTMENT_CODE_OPD } from "../../../config/constants";
import axios from "axios";

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
  const [appointments, setAppointments] = useState([{
    id: 0,
    speciality: "",
    selDoctorId: "",
    selSession: "",
    departmentName: "",
    doctorName: "",
    sessionName: "",
    discount: 0,
    netAmount: "0.00",
    gst: "0.00",
    totalAmount: "0.00"
  }]);
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
    selSession: ""
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

  async function fetchGstConfiguration() {
    try {
      const url = `${MAS_SERVICE_CATEGORY}/getGstConfig/1`;
      const data = await getRequest(url);
      if (data && data.status === 200 && data.response && typeof data.response.gstApplicable !== "undefined") {
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
      // //debugger
      confirmUpload(imageData);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setIsCameraOn(false);
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

  const clearPhoto = () => {
    setImage(placeholderImage);
  };

  function calculateDOBFromAge(age) {
    const today = new Date();
    const birthYear = today.getFullYear() - age;

    // Default to today's month and day
    return new Date(birthYear, today.getMonth(), today.getDate()).toISOString().split('T')[0];
  }
  
  function checkBMI(a, b) {
    //debugger
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

    const updatedFormData = { ...formData, [name]: value };
    if (name == 'dob') {
      updatedFormData.age = calculateAgeFromDOB(value);
    }
    else if (name == 'age') {
      updatedFormData.dob = calculateDOBFromAge(value)
    }
    else if (name == 'weight' && formData.height != undefined) {
      updatedFormData.bmi = checkBMI(value, formData.height);
    } else if (name == 'height' && formData.weight != undefined) {
      updatedFormData.bmi = checkBMI(formData.weight, value);
    }

    setFormData(updatedFormData);
    let error = "";

    if (name === "firstName" && !value.trim()) {
      error = "First Name is required.";
    }

    if (name === "gender" && !value) {
      error = "Gender is required.";
    }

    if (name === "relation" && !value) {
      error = "Relation is required.";
    }

    if (name === "dob" && !value) {
      error = "Date of Birth is required.";
    }

    if (name === "email") {
      if (!value.trim()) {
        error = "Email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = "Invalid email format.";
      }
    }

    if (name === "mobileNo") {
      if (!value.trim()) {
        error = "Mobile number is required.";
      } else if (!/^\d{10}$/.test(value)) {
        error = "Mobile number must be exactly 10 digits.";
      }
    }

    if (name === "pinCode") {
      if (!/^\d{6}$/.test(value)) {
        error = "Pin Code must be exactly 6 digits.";
      }
    }

    if (name === "age") {
      if (value !== "" && (isNaN(value) || Number(value) < 0)) {
        error = "Age can not be negative.";
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
      "spo2"
    ];

    if (numericFields.includes(name)) {
      if (value != undefined && (value !== "" && (isNaN(value) || Number(value) < 0))) {
        error = `${name.charAt(0).toUpperCase() + name.slice(1)} must be a non-negative number.`;
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
    //debugger
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  useEffect(() => {
    if (appointments.length === 0) {
      setFormData((prev) => ({
        ...prev,
        speciality: "",
        selDoctorId: "",
        selSession: ""
      }));
      return;
    }
    const primary = appointments[0];
    setFormData((prev) => ({
      ...prev,
      speciality: primary.speciality,
      selDoctorId: primary.selDoctorId,
      selSession: primary.selSession
    }));
  }, [appointments]);

  const addAppointmentRow = () => {
    setAppointments((prev) => [
      ...prev,
      {
        id: nextAppointmentId,
        speciality: "",
        selDoctorId: "",
        selSession: "",
        departmentName: "",
        doctorName: "",
        sessionName: "",
        discount: 0,
        netAmount: "0.00",
        gst: "0.00",
        totalAmount: "0.00"
      }
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

  const handleSpecialityChange = (id, value) => {
    const selectedDepartment = departmentData.find(dept => dept.id == value);
    const departmentName = selectedDepartment ? selectedDepartment.departmentName : "";
    
    setAppointments((prev) =>
      prev.map((appointment) =>
        appointment.id === id
          ? { ...appointment, speciality: value, selDoctorId: "", selSession: "", departmentName }
          : appointment
      )
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

  const handleDoctorChange = (id, value, specialityId) => {
    const doctorOptions = doctorDataMap[id] || [];
    const selectedDoctor = doctorOptions.find(doctor => doctor.userId == value);
    const doctorName = selectedDoctor ? `${selectedDoctor.firstName} ${selectedDoctor.middleName || ''} ${selectedDoctor.lastName || ''}`.trim() : "";
    
    setAppointments((prev) =>
      prev.map((appointment) =>
        appointment.id === id
          ? { ...appointment, selDoctorId: value, selSession: "", doctorName }
          : appointment
      )
    );
    if (value && specialityId) {
      fetchSession(value, specialityId);
    }
  };

  const handleSessionChange = (id, value) => {
    const selectedSession = session.find(ses => ses.id == value);
    const sessionName = selectedSession ? selectedSession.sessionName : "";
    
    setAppointments((prev) =>
      prev.map((appointment) =>
        appointment.id === id ? { ...appointment, selSession: value, sessionName } : appointment
      )
    );
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
  };
  
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

  function sendRegistrationRequest() {
    console.log(formData);
    sendPatientData();
  }
  
  const validateForm = () => {
    const requiredFields = ["firstName", "gender", "relation", "dob", "email", "mobileNo"];
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
      if (!formData[field] || formData[field].toString().trim() === "") {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`;
        valid = false;
      }
    });

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format.";
      valid = false;
    }

    if (formData.mobileNo && !/^\d{10}$/.test(formData.mobileNo)) {
      newErrors.mobileNo = "Mobile number must be exactly 10 digits.";
      valid = false;
    }

    if (formData.pinCode && !/^\d{6}$/.test(formData.pinCode)) {
      newErrors.pinCode = "Pin Code must be exactly 6 digits.";
      valid = false;
    }

    numericFields.forEach((field) => {
      const value = formData[field];
      
      if (value !== undefined && value !== "") {
        if (field === "age" || field === "patientAge") {
          // Validate correct format like "25Y 10M 2D"
          const agePattern = /^\d+Y\s\d+M\s\d+D$/;
          if (!agePattern.test(value)) {
            newErrors[field] = "Age must be in format '25Y 10M 2D'.";
            valid = false;
          }
        } else {
          // Validate numeric fields
          if (isNaN(value) || Number(value) < 0) {
            newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} must be a non-negative number.`;
            valid = false;
          }
        }
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
          id: 0,
          uhidNo: "",
          patientStatus: "",
          regDate: new Date(Date.now()).toJSON().split('.')[0].split('T')[0],
          lastChgBy: sessionStorage.getItem('username'),
          patientHospitalId: Number(sessionStorage.getItem('hospitalId')),
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
          patientStateId: formData.district,
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
          nokRelationId: formData.nokRelation
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
          patientId: 0,
          visitId: 0,
          departmentId: 0,
          hospitalId: 0,
          doctorId: 0,
          lastChgBy: "string"
        },
        visit: {
          id: 0,
          tokenNo: 0,
          visitStatus: "string",
          // visitDate: new Date(Date.now()).toJSON().split('.')[0],
          visitDate: new Date(Date.now()).toJSON(),
          departmentId: Number(formData.speciality),
          doctorId: Number(formData.selDoctorId),
          doctorName: "",
          hospitalId: sessionStorage.getItem('hospitalId'),
          sessionId: Number(formData.selSession),
          billingStatus: "string",
          priority: 0,
          patientId: 0,
          iniDoctorId: 0,
        },
      };
      //debugger
      if (isNaN(requestData.visit.doctorId))
        requestData.visit = null;
      // requestData.opdPatientDetail=null;
      console.log(new Date(Date.now()).toJSON())

      try {
        setLoading(true);
        const data = await postRequest(`${PATIENT_REGISTRATION}`, requestData);
        if (data.status === 200) {
          Swal.fire({
            icon: "success",
            title: "Patient Registration Successful",
            text: "The patient has been registered successfully."
          }).then(() => {
            // Navigate to OPDBillingDetails with all appointment data
            const appointmentsWithBilling = appointments.map(appointment => {
              const base = parseFloat("500.00") || 0; // Base price is fixed as per existing logic
              const discountVal = parseFloat(appointment.discount) || 0;
              const net = Math.max(0, base - discountVal);
              const gstPercent = gstConfig?.gstApplicable ? gstConfig?.gstPercent : 0;
              const gstAmount = (net * gstPercent) / 100;
              const total = net + gstAmount;

              return {
                ...appointment,
                basePrice: "500.00", // Fixed base price for now
                discount: appointment.discount,
                netAmount: net.toFixed(2),
                gst: gstAmount.toFixed(2),
                totalAmount: total.toFixed(2),
                registrationCost: "100.00",
                visitType: "New"
              };
            });

            navigate("/OPDBillingDetails", {
              state: {
                billingData: {
                  patientName: `${formData.firstName} ${formData.middleName || ''} ${formData.lastName || ''}`.trim(),
                  mobileNo: formData.mobileNo,
                  age: formData.age,
                  patientGender: genderData.find(g => g.id === formData.gender)?.genderName || formData.gender,
                  relation: relationData.find(r => r.id === formData.relation)?.relationName || formData.relation,
                  patientAddress1: formData.address1,
                  patientCity: formData.city,
                  appointments: appointmentsWithBilling, // Pass the entire array of appointments with billing details
                  patientId: data.response.patientId || 0,
                  visitType: "New",
                }
              }
            });
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Registration Failed",
            text: data.message || "Unexpected response received. Please try again."
          });
        }
      } catch (error) {
        console.error("Error:", error);
        Swal.fire({
          icon: "error",
          title: "Registration Failed",
          text: "Something went wrong while registering the patient. Please try again."
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
          [rowId]: data.response
        }));
      } else {
        console.error("Unexpected API response format:", data);
        setDoctorDataMap((prev) => ({
          ...prev,
          [rowId]: []
        }));
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSession(doctorId, deptId) {
    if (!doctorId || !deptId) {
      return;
    }
    let timestamp = Date.now();
    let value = new Date(timestamp).toJSON().split('.')[0].split('T')[0];
    const data = await getRequest(`${GET_DOCTOR_SESSION}deptId=${deptId}&doctorId=${doctorId}&rosterDate=${value}`);
    if (data.status == 200) {
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

  return (
    <div className="body d-flex py-3">
      <div className="container-xxl">
        <div className="row align-items-center">
          <div className="border-0 mb-4">
            <div className="card-header py-3 no-bg bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap">
              <h3 className="fw-bold mb-0">Registration of Other Patient</h3>
            </div>
          </div>
        </div>

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
                          <label className="form-label" htmlFor="firstName">First Name *</label>
                          <input type="text" className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                            id="firstName" name="firstName" value={formData.firstName} onChange={handleChange}
                            placeholder="Enter First Name" />
                          {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="middleName">Middle Name</label>
                          <input type="text" id="middleName" value={formData.middleName} name="middleName"
                            onChange={handleChange} className="form-control" placeholder="Enter Middle Name" />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="lastName">Last Name</label>
                          <input type="text" id="lastName" value={formData.lastName} name="lastName"
                            onChange={handleChange} className="form-control" placeholder="Enter Last Name" />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="mobileNo">Mobile No.</label>
                          <input type="text" id="mobileNo"
                            className={`form-control ${errors.mobileNo ? 'is-invalid' : ''}`} name="mobileNo"
                            value={formData.mobileNo} onChange={handleChange} placeholder="Enter Mobile Number" />
                          {errors.mobileNo && <div className="invalid-feedback">{errors.mobileNo}</div>}
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="gender">Gender *</label>
                          <select className={`form-select ${errors.gender ? 'is-invalid' : ''}`} id="gender"
                            name="gender" value={formData.gender} onChange={handleChange}>
                            <option value="">Select</option>
                            {genderData.map((gender) => (
                              <option key={gender.id} value={gender.id}>
                                {gender.genderName}
                              </option>
                            ))}
                          </select>
                          {errors.gender && <div className="invalid-feedback">{errors.gender}</div>}
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="relation">Relation *</label>
                          <select className={`form-select ${errors.relation ? 'is-invalid' : ''}`} id="relation"
                            name="relation" value={formData.relation} onChange={handleChange}>
                            <option value="">Select</option>
                            {relationData.map((relation) => (
                              <option key={relation.id} value={relation.id}>
                                {relation.relationName}
                              </option>
                            ))}
                          </select>
                          {errors.relation && <div className="invalid-feedback">{errors.relation}</div>}
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="dob">DOB *</label>
                          <input type="date" id="dob" name="dob"
                            className={`form-control ${errors.dob ? 'is-invalid' : ''}`} value={formData.dob}
                            max={new Date().toISOString().split("T")[0]} onChange={handleChange}
                            placeholder="Select Date of Birth" />
                          {errors.dob && <div className="invalid-feedback">{errors.dob}</div>}
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="age">Age</label>
                          <input
                            type="text" // <<== NOT number!
                            id="age"
                            name="age"
                            className={`form-control ${errors.age ? "is-invalid" : ""}`}
                            value={formData.age || ""}
                            onChange={handleChange}
                            placeholder="Enter Age"
                          />

                          {errors.age && <div className="invalid-feedback">{errors.age}</div>}
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="email">Email *</label>
                          <input type="email" id="email" name="email"
                            className={`form-control ${errors.email ? 'is-invalid' : ''}`} value={formData.email}
                            onChange={handleChange} placeholder="Enter Email Address" />
                          {errors.email && <div className="invalid-feedback">{errors.email}</div>}
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
                      <input type="text" className="form-control" name="address1" value={formData.address1}
                        onChange={handleChange} placeholder="Enter Address 1" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Address 2</label>
                      <input type="text" className="form-control" name="address2" value={formData.address2}
                        onChange={handleChange} placeholder="Enter Address 2" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Country</label>
                      <select className="form-select" name="country" value={formData.country} onChange={(e) => {
                        handleAddChange(e);
                        fetchStates(e.target.value);
                      }}>
                        <option value="">Select Country</option>
                        {countryData.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.countryName}
                          </option>))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">State</label>
                      <select className="form-select" name="state" value={formData.state} onChange={(e) => {
                        handleAddChange(e);
                        fetchDistrict(e.target.value);
                      }}>
                        <option value="">Select State</option>
                        {stateData.map((state) => (
                          <option key={state.id} value={state.id}>
                            {state.stateName}
                          </option>))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">District</label>
                      <select className="form-select" name="district" value={formData.district} onChange={(e) => {
                        handleAddChange(e);
                      }}>
                        <option value="">Select District</option>
                        {districtData.map((district) => (
                          <option key={district.id} value={district.id}>
                            {district.districtName}
                          </option>))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">City</label>
                      <input type="text" className="form-control" name="city" value={formData.city}
                        onChange={handleChange} placeholder="Enter City" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Pin Code</label>
                      <input type="text" className={`form-control ${errors.pinCode ? 'is-invalid' : ''}`} name="pinCode" value={formData.pinCode}
                        onChange={handleChange} placeholder="Enter Pin Code" />
                      {errors.pinCode && (
                        <div className="invalid-feedback">{errors.pinCode}</div>
                      )}</div>
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
                      <input type="text" className="form-control" placeholder="Enter First Name" name="nokFirstName"
                        value={formData.nokFirstName}
                        onChange={handleChange} />

                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Middle Name</label>
                      <input type="text" className="form-control" placeholder="Enter Middle Name" name="nokMiddleName"
                        value={formData.nokMiddleName}
                        onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Last Name</label>
                      <input type="text" className="form-control" placeholder="Enter Last Name" name="nokLastName"
                        value={formData.nokLastName}
                        onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Email</label>
                      <input type="email" className="form-control" placeholder="Enter Email" name="nokEmail"
                        value={formData.nokEmail}
                        onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Mobile No.</label>
                      <input type="text" className="form-control" placeholder="Enter Mobile Number" name="nokMobile"
                        value={formData.nokMobile}
                        onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Address 1</label>
                      <input type="text" className="form-control" placeholder="Enter Address 1" name="nokAddress1" value={formData.nokAddress1}
                        onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Address 2</label>
                      <input type="text" className="form-control" placeholder="Enter Address 2" name="nokAddress2" value={formData.nokAddress2}
                        onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Country</label>
                      <select className="form-select" name="nokCountry" value={formData.nokCountry}
                        onChange={(e) => {
                          handleAddChange(e);
                          fetchNokStates(e.target.value);
                        }}>
                        <option value="">Select Country</option>
                        {countryData.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.countryName}
                          </option>))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">State</label>
                      <select className="form-select" name="nokState" value={formData.nokState}
                        onChange={(e) => {
                          handleAddChange(e);
                          fetchNokDistrict(e.target.value);
                        }}>
                        <option value="">Select State</option>
                        {nokStateData.map((state) => (
                          <option key={state.id} value={state.id}>
                            {state.stateName}
                          </option>))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">District</label>
                      <select className="form-select" name="nokDistrict" value={formData.nokDistrict} onChange={(e) => {
                        handleAddChange(e)
                      }}>
                        <option value="">Select District</option>
                        {nokDistrictData.map((district) => (
                          <option key={district.id} value={district.id}>
                            {district.districtName}
                          </option>))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">City</label>
                      <input type="text" className="form-control" placeholder="Enter City" name="nokCity" value={formData.nokCity}
                        onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Pin Code</label>
                      <input type="text" className="form-control" placeholder="Enter Pin Code" name="nokPinCode" value={formData.nokPinCode}
                        onChange={handleChange} />
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
                      <input type="text" className="form-control" placeholder="Enter First Name" name="emergencyFirstName" value={formData.emergencyFirstName} onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Last Name</label>
                      <input type="text" className="form-control" placeholder="Enter Last Name" name="emergencyLastName" value={formData.emergencyLastName} onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Mobile No.</label>
                      <input type="text" className="form-control" placeholder="Enter Mobile Number" name="emergencyMobile" value={formData.emergencyMobile} onChange={handleChange} />
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        {/* Vital Details Section */}
        {!preConsultationFlag && (<>

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
                        <label className="form-label me-2">Height<span className="text-danger">*</span></label>
                        <input type="number" className={`form-control ${errors.height ? 'is-invalid' : ''}`} min={0}
                          placeholder="Height" name="height" value={formData.height} onChange={handleChange} />
                        <span className="input-group-text">cm</span>
                        {errors.height && (
                          <div className="invalid-feedback d-block">{errors.height}</div>
                        )}
                      </div>

                      {/* Weight */}
                      <div className="col-md-4 d-flex">
                        <label className="form-label me-2">Weight<span className="text-danger">*</span></label>
                        <input type="number" min={0} className={`form-control ${errors.weight ? 'is-invalid' : ''}`}
                          placeholder="Weight" name="weight" value={formData.weight} onChange={handleChange} />
                        <span className="input-group-text">kg</span>
                        {errors.weight && (
                          <div className="invalid-feedback d-block">{errors.weight}</div>
                        )}
                      </div>

                      {/* Temperature */}
                      <div className="col-md-4 d-flex">
                        <label className="form-label me-2">Temperature<span className="text-danger">*</span></label>
                        <input type="number" min={0}
                          className={`form-control ${errors.temperature ? 'is-invalid' : ''}`}
                          placeholder="Temperature" name="temperature" value={formData.temperature}
                          onChange={handleChange} />
                        <span className="input-group-text">°F</span>
                        {errors.temperature && (
                          <div className="invalid-feedback d-block">{errors.temperature}</div>
                        )}
                      </div>

                      {/* BP (Systolic / Diastolic) */}
                      <div className="col-md-4 d-flex">
                        <label className="form-label me-2">BP<span className="text-danger">*</span></label>
                        <input type="number" min={0} className={`form-control ${errors.systolicBP ? 'is-invalid' : ''}`}
                          placeholder="Systolic" name="systolicBP" value={formData.systolicBP}
                          onChange={handleChange} />
                        <span className="input-group-text">/</span>
                        {errors.systolicBP && (
                          <div className="invalid-feedback d-block">{errors.systolicBP}</div>
                        )}
                        <input type="number" min={0}
                          className={`form-control ${errors.diastolicBP ? 'is-invalid' : ''}`}
                          placeholder="Diastolic" name="diastolicBP" value={formData.diastolicBP}
                          onChange={handleChange} />
                        <span className="input-group-text">mmHg</span>
                        {errors.diastolicBP && (
                          <div className="invalid-feedback d-block">{errors.diastolicBP}</div>
                        )}
                      </div>

                      {/* Pulse */}
                      <div className="col-md-4 d-flex">
                        <label className="form-label me-2">Pulse<span className="text-danger">*</span></label>
                        <input type="number" min={0} className={`form-control ${errors.pulse ? 'is-invalid' : ''}`}
                          placeholder="Pulse" name="pulse" value={formData.pulse} onChange={handleChange} />
                        <span className="input-group-text">/min</span>
                        {errors.pulse && (
                          <div className="invalid-feedback d-block">{errors.pulse}</div>
                        )}
                      </div>

                      {/* BMI */}
                      <div className="col-md-4 d-flex">
                        <label className="form-label me-2">BMI</label>
                        <input type="number" min={0} className={`form-control ${errors.bmi ? 'is-invalid' : ''}`}
                          placeholder="BMI" name="bmi" value={formData.bmi} onChange={handleChange} />
                        <span className="input-group-text">kg/m²</span>
                        {errors.bmi && (
                          <div className="invalid-feedback d-block">{errors.bmi}</div>
                        )}
                      </div>

                      {/* RR */}
                      <div className="col-md-4 d-flex">
                        <label className="form-label me-2">RR</label>
                        <input type="number" min={0} className={`form-control ${errors.rr ? 'is-invalid' : ''}`}
                          placeholder="RR" name="rr" value={formData.rr} onChange={handleChange} />
                        <span className="input-group-text">/min</span>
                        {errors.rr && (
                          <div className="invalid-feedback d-block">{errors.rr}</div>
                        )}
                      </div>

                      {/* SpO2 */}
                      <div className="col-md-4 d-flex">
                        <label className="form-label me-2">SpO2</label>
                        <input type="number" min={0} className={`form-control ${errors.spo2 ? 'is-invalid' : ''}`}
                          placeholder="SpO2" name="spo2" value={formData.spo2} onChange={handleChange} />
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
        </>)}

        {/* Appointment Details Section */}
        <div className="row mb-3">
          <div className="col-sm-12">
            <div className="card shadow mb-3">
              <div className="card-header py-3 bg-light border-bottom-1 d-flex align-items-center justify-content-between">
                  <h6 className="mb-0 fw-bold">Appointment Details</h6>
                  <div className="d-flex gap-2">
                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={addAppointmentRow}>
                      + Add
                    </button>
                  </div>
              </div>
              <div className="card-body">
                <form>
                  {appointments.map((appointment, index) => {
                    const doctorOptions = doctorDataMap[appointment.id] || [];
                    return (
                      <div className="row g-3 mb-3" key={`appointment-${appointment.id}`}>
                        <div className="col-12 d-flex align-items-center justify-content-between">
                          <h6 className="fw-bold text-muted mb-0">Appointment {index + 1}</h6>
                          {appointments.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeAppointmentRow(appointment.id)}
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
                            onChange={(e) => handleSpecialityChange(appointment.id, e.target.value)}
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
                              handleDoctorChange(appointment.id, e.target.value, appointment.speciality)
                            }
                          >
                            <option value="">Select Doctor</option>
                            {doctorOptions.map((doctor) => (
                              <option key={doctor.id} value={doctor.userId}>
                                {`${doctor.firstName} ${doctor.middleName ? doctor.middleName : ""} ${doctor.lastName ? doctor.lastName : ""}`}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Session</label>
                          <select
                            className="form-select"
                            value={appointment.selSession}
                            onChange={(e) => handleSessionChange(appointment.id, e.target.value)}
                          >
                            <option value="">Select Session</option>
                            {session.map((ses) => (
                              <option key={ses.id} value={ses.id}>
                                {ses.sessionName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Submit and Reset Buttons */}
        <div className="row mb-3">
          <div className="col-sm-12">
            <div className="card shadow mb-3">
              <div className="card-body">
                <div className="row g-3">
                  <div className="mt-4">
                    <button type="submit" className="btn btn-primary me-2"
                      onClick={sendRegistrationRequest}>Registration
                    </button>
                    <button type="reset" className="btn btn-secondary">Reset</button>
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