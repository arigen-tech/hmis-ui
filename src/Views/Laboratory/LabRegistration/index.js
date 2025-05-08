import { useState, useRef, useEffect } from "react"
import placeholderImage from "../../../assets/images/placeholder.jpg"
import { getRequest } from "../../../service/apiService"
import Swal from "sweetalert2"

import {
  API_HOST,
  ALL_COUNTRY,
  ALL_GENDER,
  ALL_RELATION,
  DISTRICT_BY_STATE,
  PATIENT_IMAGE_UPLOAD,
  STATE_BY_COUNTRY,
} from "../../../config/apiConfig"

const LabRegistration = () => {
  useEffect(() => {
    // Fetching initial data
    fetchGenderData()
    fetchRelationData()
    fetchCountryData()
  }, [])

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [genderData, setGenderData] = useState([])
  const [imageURL, setImageURL] = useState("")
  const [relationData, setRelationData] = useState([])
  const [countryData, setCountryData] = useState([])
  const [stateData, setStateData] = useState([])
  const [nokStateData, setNokStateData] = useState([])
  const [districtData, setDistrictData] = useState([])
  const [nokDistrictData, setNokDistrictData] = useState([])
  const [activeRowIndex, setActiveRowIndex] = useState(null)

  // Sample investigation/package items for dropdown
  const investigationItems = [
    { id: 1, name: "Complete Blood Count", price: 500 },
    { id: 2, name: "Liver Function Test", price: 800 },
    { id: 3, name: "Thyroid Profile", price: 1200 },
    { id: 4, name: "Kidney Function Test", price: 900 },
    { id: 5, name: "Lipid Profile", price: 700 },
    { id: 6, name: "Blood Glucose", price: 300 },
    { id: 7, name: "Hemoglobin A1C", price: 650 },
    { id: 8, name: "Urine Analysis", price: 350 },
    { id: 9, name: "Chest X-Ray", price: 1000 },
    { id: 10, name: "ECG", price: 500 }
  ]

  // Form data state
  const [formData, setFormData] = useState({
    // Personal details
    imageurl: undefined,
    firstName: undefined,
    middleName: undefined,
    lastName: undefined,
    mobileNo: undefined,
    gender: undefined,
    relation: undefined,
    dob: undefined,
    age: undefined,
    email: undefined,

    // Patient address
    address1: undefined,
    address2: undefined,
    country: undefined,
    state: undefined,
    district: undefined,
    city: undefined,
    pinCode: undefined,

    // NOK details
    nokFirstName: undefined,
    nokMiddleName: undefined,
    nokLastName: undefined,
    nokEmail: undefined,
    nokMobile: undefined,
    nokAddress1: undefined,
    nokAddress2: undefined,
    nokCountry: undefined,
    nokState: undefined,
    nokDistrict: undefined,
    nokCity: undefined,
    nokPinCode: undefined,

    // Emergency contact
    emergencyFirstName: undefined,
    emergencyLastName: undefined,
    emergencyMobile: undefined,

    // Lab specific fields
    type: "investigation", // Default to investigation
    rows: [
      {
        id: 1,
        name: "",
        date: "",
        originalAmount: 0,
      },
    ],
    paymentMode: "",
  })

  const [image, setImage] = useState(placeholderImage)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  let stream = null

  const startCamera = async () => {
    try {
      setIsCameraOn(true) // Ensure the video element is rendered before accessing ref
      setTimeout(async () => {
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      }, 100)
    } catch (error) {
      console.error("Error accessing camera:", error)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current

      // Set canvas dimensions to match video stream
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const context = canvas.getContext("2d")
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = canvas.toDataURL("image/png")

      setImage(imageData)
      stopCamera()
      confirmUpload(imageData)
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop())
      setIsCameraOn(false)
    }
  }

  const clearPhoto = () => {
    setImage(placeholderImage)
  }

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
        uploadImage(imageData)
      }
    })
  }

  const uploadImage = async (base64Image) => {
    try {
      // Convert base64 to Blob
      const blob = await fetch(base64Image).then((res) => res.blob())
      const formData1 = new FormData()
      formData1.append("file", blob, "photo.png")

      // Send the formData to the server
      const response = await fetch(`${API_HOST}${PATIENT_IMAGE_UPLOAD}`, {
        method: "POST",
        body: formData1,
      })

      // Parse JSON response
      const data = await response.json()

      if (response.status === 200 && data.response) {
        // Extracting the image path
        const extractedPath = data.response

        // Updating state with the extracted image path
        setImageURL(extractedPath)
        console.log("Uploaded Image URL:", extractedPath)

        // Show success alert
        Swal.fire("Success!", "Image uploaded successfully!", "success")
      } else {
        Swal.fire("Error!", "Failed to upload image!", "error")
      }
    } catch (error) {
      console.error("Upload error:", error)
      Swal.fire("Error!", "Something went wrong!", "error")
    }
  }

  function calculateDOBFromAge(age) {
    const today = new Date()
    const birthYear = today.getFullYear() - age

    // Default to today's month and day
    return new Date(birthYear, today.getMonth(), today.getDate()).toISOString().split("T")[0]
  }

  function calculateAgeFromDOB(dob) {
    const birthDate = new Date(dob)
    const today = new Date()

    let age = today.getFullYear() - birthDate.getFullYear()

    // Adjust if birth date hasn't occurred yet this year
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    const updatedFormData = { ...formData, [name]: value }
    if (name === "dob") {
      updatedFormData.age = calculateAgeFromDOB(value)
    } else if (name === "age") {
      updatedFormData.dob = calculateDOBFromAge(value)
    }

    setFormData(updatedFormData)
    let error = ""

    if (name === "firstName" && !value.trim()) {
      error = "First Name is required."
    }

    if (name === "gender" && !value) {
      error = "Gender is required."
    }

    if (name === "relation" && !value) {
      error = "Relation is required."
    }

    if (name === "dob" && !value) {
      error = "Date of Birth is required."
    }

    if (name === "email") {
      if (!value.trim()) {
        error = "Email is required."
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = "Invalid email format."
      }
    }

    if (name === "mobileNo") {
      if (!value.trim()) {
        error = "Mobile number is required."
      } else if (!/^\d{10}$/.test(value)) {
        error = "Mobile number must be exactly 10 digits."
      }
    }

    if (name === "pinCode") {
      if (!/^\d{6}$/.test(value)) {
        error = "Pin Code must be exactly 6 digits."
      }
    }

    if (name === "age") {
      if (value !== "" && (isNaN(value) || Number(value) < 0)) {
        error = "Age can not be negative."
      }
    }

    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors }
      if (error) {
        newErrors[name] = error
      } else {
        delete newErrors[name]
      }
      return newErrors
    })
  }

  const handleAddChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Lab specific handlers
  const handleTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      type: type,
    }))
  }

  const handleRowChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      rows: prev.rows.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }))
  }

  const addRow = (e) => {
    e.preventDefault()
    setFormData((prev) => ({
      ...prev,
      rows: [
        ...prev.rows,
        {
          id: prev.rows.length + 1,
          name: "",
          date: "",
          originalAmount: 0,
        },
      ],
    }))
  }

  const removeRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      rows: prev.rows.filter((_, i) => i !== index),
    }))
  }

  // Calculate total amount based on selected type
  const calculateTotalAmount = () => {
    return formData.rows
      .reduce((total, item) => {
        return total + (Number.parseFloat(item.originalAmount) || 0)
      }, 0)
      .toFixed(2)
  }

  async function fetchGenderData() {
    setLoading(true)

    try {
      const data = await getRequest(`${ALL_GENDER}/1`)
      if (data.status === 200 && Array.isArray(data.response)) {
        setGenderData(data.response)
      } else {
        console.error("Unexpected API response format:", data)
        setGenderData([])
      }
    } catch (error) {
      console.error("Error fetching gender data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchRelationData() {
    setLoading(true)

    try {
      const data = await getRequest(`${ALL_RELATION}/1`)
      if (data.status === 200 && Array.isArray(data.response)) {
        setRelationData(data.response)
      } else {
        console.error("Unexpected API response format:", data)
        setRelationData([])
      }
    } catch (error) {
      console.error("Error fetching relation data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchCountryData() {
    setLoading(true)

    try {
      const data = await getRequest(`${ALL_COUNTRY}/1`)
      if (data.status === 200 && Array.isArray(data.response)) {
        setCountryData(data.response)
      } else {
        console.error("Unexpected API response format:", data)
        setCountryData([])
      }
    } catch (error) {
      console.error("Error fetching country data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchStates(value) {
    try {
      const data = await getRequest(`${STATE_BY_COUNTRY}${value}`)
      if (data.status === 200 && Array.isArray(data.response)) {
        setStateData(data.response)
      } else {
        console.error("Unexpected API response format:", data)
        setStateData([])
      }
    } catch (error) {
      console.error("Error fetching state data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchDistrict(value) {
    try {
      const data = await getRequest(`${DISTRICT_BY_STATE}${value}`)
      if (data.status === 200 && Array.isArray(data.response)) {
        setDistrictData(data.response)
      } else {
        console.error("Unexpected API response format:", data)
        setDistrictData([])
      }
    } catch (error) {
      console.error("Error fetching district data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchNokStates(value) {
    try {
      const data = await getRequest(`${STATE_BY_COUNTRY}${value}`)
      if (data.status === 200 && Array.isArray(data.response)) {
        setNokStateData(data.response)
      } else {
        console.error("Unexpected API response format:", data)
        setNokStateData([])
      }
    } catch (error) {
      console.error("Error fetching NOK state data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchNokDistrict(value) {
    try {
      const data = await getRequest(`${DISTRICT_BY_STATE}${value}`)
      if (data.status === 200 && Array.isArray(data.response)) {
        setNokDistrictData(data.response)
      } else {
        console.error("Unexpected API response format:", data)
        setNokDistrictData([])
      }
    } catch (error) {
      console.error("Error fetching NOK district data:", error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const requiredFields = ["firstName", "gender", "relation", "dob", "email", "mobileNo"]

    let valid = true
    const newErrors = {}

    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].toString().trim() === "") {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`
        valid = false
      }
    })

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format."
      valid = false
    }

    if (formData.mobileNo && !/^\d{10}$/.test(formData.mobileNo)) {
      newErrors.mobileNo = "Mobile number must be exactly 10 digits."
      valid = false
    }

    if (formData.pinCode && !/^\d{6}$/.test(formData.pinCode)) {
      newErrors.pinCode = "Pin Code must be exactly 6 digits."
      valid = false
    }

    // Validate lab-specific fields
    if (formData.rows.length === 0) {
      newErrors.rows = `At least one ${formData.type} is required.`
      valid = false
    }

    if (!formData.paymentMode) {
      newErrors.paymentMode = "Payment mode is required."
      valid = false
    }

    setErrors(newErrors)
    return valid
  }

  const handleSubmit = () => {
    if (validateForm()) {
      // Prepare data for submission
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
        labDetails: {
          type: formData.type,
          items: formData.rows,
          paymentMode: formData.paymentMode,
          totalAmount: calculateTotalAmount(),
          registrationDate: new Date(Date.now()).toJSON(),
        },
      }

      console.log("Submitting data:", requestData)
      Swal.fire("Success", "Lab registration submitted successfully!", "success")

      // Here you would typically send the data to your API
      // const response = await postRequest('YOUR_LAB_REGISTRATION_ENDPOINT', requestData);
    }
  }

  const handleReset = () => {
    setFormData({
      // Personal details
      imageurl: undefined,
      firstName: undefined,
      middleName: undefined,
      lastName: undefined,
      mobileNo: undefined,
      gender: undefined,
      relation: undefined,
      dob: undefined,
      age: undefined,
      email: undefined,

      // Patient address
      address1: undefined,
      address2: undefined,
      country: undefined,
      state: undefined,
      district: undefined,
      city: undefined,
      pinCode: undefined,

      // NOK details
      nokFirstName: undefined,
      nokMiddleName: undefined,
      nokLastName: undefined,
      nokEmail: undefined,
      nokMobile: undefined,
      nokAddress1: undefined,
      nokAddress2: undefined,
      nokCountry: undefined,
      nokState: undefined,
      nokDistrict: undefined,
      nokCity: undefined,
      nokPinCode: undefined,

      // Emergency contact
      emergencyFirstName: undefined,
      emergencyLastName: undefined,
      emergencyMobile: undefined,

      // Lab specific fields
      type: "investigation",
      rows: [
        {
          id: 1,
          name: "",
          date: "",
          originalAmount: 0,
        },
      ],
      paymentMode: "",
    })
    setErrors({})
    setImage(placeholderImage)
    setImageURL("")
  }

  return (
    <div className="body d-flex py-3">
      <div className="container-xxl">
        <div className="row align-items-center">
          <div className="border-0 mb-4">
            <div className="card-header py-3 no-bg bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap">
              <h3 className="fw-bold mb-0">Lab Registration</h3>
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
                          <label className="form-label" htmlFor="firstName">
                            First Name *
                          </label>
                          <input
                            type="text"
                            className={`form-control ${errors.firstName ? "is-invalid" : ""}`}
                            id="firstName"
                            name="firstName"
                            value={formData.firstName || ""}
                            onChange={handleChange}
                            placeholder="Enter First Name"
                          />
                          {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="middleName">
                            Middle Name
                          </label>
                          <input
                            type="text"
                            id="middleName"
                            value={formData.middleName || ""}
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
                            value={formData.lastName || ""}
                            name="lastName"
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Enter Last Name"
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="mobileNo">
                            Mobile No.
                          </label>
                          <input
                            type="text"
                            id="mobileNo"
                            className={`form-control ${errors.mobileNo ? "is-invalid" : ""}`}
                            name="mobileNo"
                            value={formData.mobileNo || ""}
                            onChange={handleChange}
                            placeholder="Enter Mobile Number"
                          />
                          {errors.mobileNo && <div className="invalid-feedback">{errors.mobileNo}</div>}
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="gender">
                            Gender *
                          </label>
                          <select
                            className={`form-select ${errors.gender ? "is-invalid" : ""}`}
                            id="gender"
                            name="gender"
                            value={formData.gender || ""}
                            onChange={handleChange}
                          >
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
                          <label className="form-label" htmlFor="relation">
                            Relation *
                          </label>
                          <select
                            className={`form-select ${errors.relation ? "is-invalid" : ""}`}
                            id="relation"
                            name="relation"
                            value={formData.relation || ""}
                            onChange={handleChange}
                          >
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
                          <label className="form-label" htmlFor="dob">
                            DOB *
                          </label>
                          <input
                            type="date"
                            id="dob"
                            name="dob"
                            className={`form-control ${errors.dob ? "is-invalid" : ""}`}
                            value={formData.dob || ""}
                            max={new Date().toISOString().split("T")[0]}
                            onChange={handleChange}
                            placeholder="Select Date of Birth"
                          />
                          {errors.dob && <div className="invalid-feedback">{errors.dob}</div>}
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="age">
                            Age
                          </label>
                          <input
                            type="number"
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
                          <label className="form-label" htmlFor="email">
                            Email *
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            className={`form-control ${errors.email ? "is-invalid" : ""}`}
                            value={formData.email || ""}
                            onChange={handleChange}
                            placeholder="Enter Email Address"
                          />
                          {errors.email && <div className="invalid-feedback">{errors.email}</div>}
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
                          <canvas ref={canvasRef} width="300" height="150" style={{ display: "none" }}></canvas>
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
                      <input
                        type="text"
                        className="form-control"
                        name="address1"
                        value={formData.address1 || ""}
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
                        value={formData.address2 || ""}
                        onChange={handleChange}
                        placeholder="Enter Address 2"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Country</label>
                      <select
                        className="form-select"
                        name="country"
                        value={formData.country || ""}
                        onChange={(e) => {
                          handleAddChange(e)
                          fetchStates(e.target.value)
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
                        value={formData.state || ""}
                        onChange={(e) => {
                          handleAddChange(e)
                          fetchDistrict(e.target.value)
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
                        value={formData.district || ""}
                        onChange={(e) => {
                          handleAddChange(e)
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
                        value={formData.city || ""}
                        onChange={handleChange}
                        placeholder="Enter City"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Pin Code</label>
                      <input
                        type="text"
                        className={`form-control ${errors.pinCode ? "is-invalid" : ""}`}
                        name="pinCode"
                        value={formData.pinCode || ""}
                        onChange={handleChange}
                        placeholder="Enter Pin Code"
                      />
                      {errors.pinCode && <div className="invalid-feedback">{errors.pinCode}</div>}
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
                        className="form-control"
                        placeholder="Enter Mobile Number"
                        name="nokMobile"
                        value={formData.nokMobile || ""}
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
                          handleAddChange(e)
                          fetchNokStates(e.target.value)
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
                          handleAddChange(e)
                          fetchNokDistrict(e.target.value)
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
                        onChange={(e) => {
                          handleAddChange(e)
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
                        value={formData.nokCity || ""}
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
                        value={formData.nokPinCode || ""}
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
              <div className="card-header py-3 bg-light border-bottom-1">
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
                      <label className="form-label">Mobile No.</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Mobile Number"
                        name="emergencyMobile"
                        value={formData.emergencyMobile || ""}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Lab Investigation/Package Details */}
        <div className="row mb-3">
          <div className="col-sm-12">
            <div className="card shadow mb-3">
              <div className="card-header bg-light border-bottom-1 py-3">
                <h6 className="fw-bold mb-0">
                  {formData.type === "investigation" ? "Investigation Details" : "Package Details"}
                </h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="type"
                      id="investigation"
                      value="investigation"
                      checked={formData.type === "investigation"}
                      onChange={() => handleTypeChange("investigation")}
                    />
                    <label className="form-check-label" htmlFor="investigation">
                      Investigation
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="type"
                      id="package"
                      value="package"
                      checked={formData.type === "package"}
                      onChange={() => handleTypeChange("package")}
                    />
                    <label className="form-check-label" htmlFor="package">
                      Package
                    </label>
                  </div>
                </div>

                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>{formData.type === "investigation" ? "Investigation Name" : "Package Name"}</th>
                      <th>Date</th>
                      <th>Original Amount</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.rows.map((row, index) => (
                      <tr key={index}>
                        <td>
                          <div className="dropdown-search-container position-relative">
                            <input
                              type="text"
                              className="form-control"
                              value={row.name}
                              autoComplete="off"
                              placeholder={formData.type === "investigation" ? "Investigation Name" : "Package Name"}
                              onChange={(e) => {
                                handleRowChange(index, "name", e.target.value)
                                if (e.target.value.trim() !== "") {
                                  setActiveRowIndex(index)
                                } else {
                                  setActiveRowIndex(null)
                                }
                              }}
                              onFocus={() => {
                                if (row.name.trim() !== "") {
                                  setActiveRowIndex(index)
                                }
                              }}
                              onBlur={() => setTimeout(() => setActiveRowIndex(null), 200)}
                            />
                            {activeRowIndex === index && row.name.trim() !== "" && (
                              <ul
                                className="list-group position-absolute w-100 mt-1"
                                style={{
                                  zIndex: 1000,
                                  maxHeight: '200px',
                                  overflowY: 'auto',
                                  backgroundColor: '#fff',
                                  border: '1px solid #ccc',
                                }}
                              >
                                {investigationItems
                                  .filter(item => 
                                    item.name.toLowerCase().includes(row.name.toLowerCase()) ||
                                    item.id.toString().includes(row.name)
                                  )
                                  .map((item, i) => (
                                    <li
                                      key={i}
                                      className="list-group-item list-group-item-action"
                                      style={{ backgroundColor: '#e3e8e6', cursor: 'pointer' }}
                                      onClick={() => {
                                        handleRowChange(index, "name", item.name)
                                        handleRowChange(index, "itemId", item.id)
                                        handleRowChange(index, "originalAmount", item.price)
                                        setActiveRowIndex(null)
                                      }}
                                    >
                                      {item.name} - ₹{item.price}
                                    </li>
                                  ))}
                              </ul>
                            )}
                          </div>
                        </td>
                        <td>
                          <input
                            type="date"
                            className="form-control"
                            value={row.date}
                            onChange={(e) => handleRowChange(index, "date", e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            value={row.originalAmount}
                            onChange={(e) => handleRowChange(index, "originalAmount", e.target.value)}
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => removeRow(index)}
                            disabled={formData.rows.length === 1}
                          >
                            <i className="icofont-close"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Total Amount</td>
                      <td colSpan="2" className="text-end">
                        {calculateTotalAmount()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
                <button type="button" className="btn btn-success" onClick={addRow}>
                  Add {formData.type === "investigation" ? "Investigation" : "Package"} +
                </button>
                <div className="col-md-4 mt-2">
                  <label className="form-label">Payment Mode</label>
                  <select
                    className={`form-select ${errors.paymentMode ? "is-invalid" : ""}`}
                    value={formData.paymentMode}
                    name="paymentMode"
                    onChange={(e) => setFormData((prev) => ({ ...prev, paymentMode: e.target.value }))}
                  >
                    <option value="">Select Mode</option>
                    <option value="cash">Cash</option>
                    <option value="online">Online</option>
                    <option value="pending">Set as payment pending</option>
                  </select>
                  {errors.paymentMode && <div className="invalid-feedback">{errors.paymentMode}</div>}
                </div>
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
                    <button type="button" className="btn btn-primary me-2" onClick={handleSubmit}>
                      Registration
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={handleReset}>
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
  )
}

export default LabRegistration
