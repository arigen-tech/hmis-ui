"use client"

import { useState, useRef, useEffect } from "react"
import placeholderImage from "../../../assets/images/placeholder.jpg"
import Swal from "sweetalert2"

const UpdateLabRegistration = () => {
  useEffect(() => {
    // Mock data initialization
    setGenderData([
      { id: 1, genderName: "Male", genderCode: "M" },
      { id: 2, genderName: "Female", genderCode: "F" },
      { id: 3, genderName: "Other", genderCode: "O" },
    ])
    setRelationData([
      { id: 1, relationName: "Self" },
      { id: 2, relationName: "Father" },
      { id: 3, relationName: "Mother" },
      { id: 4, relationName: "Spouse" },
    ])
    setCountryData([
      { id: 1, countryName: "India" },
      { id: 2, countryName: "USA" },
    ])
    setStateData([
      { id: 1, stateName: "Maharashtra" },
      { id: 2, stateName: "Karnataka" },
    ])
    setDistrictData([
      { id: 1, districtName: "Mumbai" },
      { id: 2, districtName: "Pune" },
    ])
    setNokStateData([
      { id: 1, stateName: "Maharashtra" },
      { id: 2, stateName: "Karnataka" },
    ])
    setNokDistrictData([
      { id: 1, districtName: "Mumbai" },
      { id: 2, districtName: "Pune" },
    ])
    setInvestigationItems([
      { id: 1, investigationName: "Blood Test", investigationId: 1, price: 500, disc: 50, investigationType: "Blood" },
      { id: 2, investigationName: "X-Ray", investigationId: 2, price: 800, disc: 0, investigationType: "Radiology" },
      {
        id: 3,
        investigationName: "MRI Scan",
        investigationId: 3,
        price: 5000,
        disc: 500,
        investigationType: "Radiology",
      },
    ])
    setPackageItems([
      { id: 1, packName: "Health Checkup Basic", actualCost: 2000 },
      { id: 2, packName: "Health Checkup Premium", actualCost: 5000 },
      { id: 3, packName: "Cardiac Package", actualCost: 3500 },
    ])
    setGstConfig({ gstApplicable: true, gstPercent: 18 })
  }, [])

  const [errors, setErrors] = useState({})
  const [imageURL, setImageURL] = useState("")
  const [loading, setLoading] = useState(false)
  const [genderData, setGenderData] = useState([])
  const [relationData, setRelationData] = useState([])
  const [countryData, setCountryData] = useState([])
  const [stateData, setStateData] = useState([])
  const [nokStateData, setNokStateData] = useState([])
  const [districtData, setDistrictData] = useState([])
  const [nokDistrictData, setNokDistrictData] = useState([])
  const [showPatientDetails, setShowPatientDetails] = useState(false)
  const [image, setImage] = useState(placeholderImage)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [activeRowIndex, setActiveRowIndex] = useState(null)
  const [investigationItems, setInvestigationItems] = useState([])
  const [packageItems, setPackageItems] = useState([])
  const [checkedRows, setCheckedRows] = useState([true])

  const [gstConfig, setGstConfig] = useState({
    gstApplicable: true,
    gstPercent: 0,
  })

  let stream = null
  const [patients, setPatients] = useState([])

  const [formData, setFormData] = useState({
    mobileNo: "",
    patientName: "",
    uhidNo: "",
    appointmentDate: "",
  })

  const [patientDetailForm, setPatientDetailForm] = useState({
    patientGender: "",
    patientRelation: "",
    type: "investigation",
    rows: [
      {
        id: 1,
        name: "",
        date: "",
        originalAmount: 0,
        discountAmount: 0,
        netAmount: 0,
        type: "investigation",
      },
    ],
  })

  const handleChangeSearch = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  function calculateDOBFromAge(age) {
    const today = new Date()
    const birthYear = today.getFullYear() - age
    return new Date(birthYear, today.getMonth(), today.getDate()).toISOString().split("T")[0]
  }

  function calculateAgeFromDOB(dob) {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const handleChange = (e) => {
    if (e.target.name == "patientAge") {
      patientDetailForm.patientDob = calculateDOBFromAge(e.target.value)
    } else if (e.target.name == "patientDob") {
      patientDetailForm.patientAge = calculateAgeFromDOB(e.target.value)
    }
    setPatientDetailForm({
      ...patientDetailForm,
      [e.target.name]: e.target.value,
    })
  }

  const handleSearch = async () => {
    // Mock search results
    const mockPatients = [
      {
        id: 1,
        patientFn: "John",
        patientMn: "M",
        patientLn: "Doe",
        patientMobileNumber: "9876543210",
        uhidNo: "UH001",
        patientAge: 30,
        patientGender: { genderName: "Male" },
        patientEmailId: "john@example.com",
      },
      {
        id: 2,
        patientFn: "Jane",
        patientMn: "",
        patientLn: "Smith",
        patientMobileNumber: "9876543211",
        uhidNo: "UH002",
        patientAge: 25,
        patientGender: { genderName: "Female" },
        patientEmailId: "jane@example.com",
      },
    ]
    setPatients(mockPatients)
  }

  const startCamera = async () => {
    try {
      setIsCameraOn(true)
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
      // Mock upload success
      setImageURL("mock-image-url.jpg")
      console.log("Mock image upload successful")
      Swal.fire("Success!", "Image uploaded successfully!", "success")
    } catch (error) {
      console.error("Upload error:", error)
      Swal.fire("Error!", "Something went wrong!", "error")
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

  const handleEdit = (patient) => {
    // Fixed: Properly merge patient data with lab form structure
    setPatientDetailForm({
      ...patient,
      // Preserve lab-specific fields
      type: "investigation",
      rows: [
        {
          id: 1,
          name: "",
          date: "",
          originalAmount: 0,
          discountAmount: 0,
          netAmount: 0,
          type: "investigation",
        },
      ],
    })
    console.log("Patient selected:", patient)
    setShowPatientDetails(true)
  }

  const handleAddChange = (e) => {
    const { name, value } = e.target
    setPatientDetailForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleTypeChange = (type) => {
    setPatientDetailForm((prev) => ({
      ...prev,
      type: type,
    }))
  }

  const handleRowChange = (index, field, value) => {
    setPatientDetailForm((prev) => {
      const updatedRows = prev.rows.map((item, i) => {
        if (i !== index) return item
        const updatedItem = { ...item, [field]: value }
        if (field === "originalAmount" || field === "discountAmount") {
          const original = Number(updatedItem.originalAmount) || 0
          const discount = Number(updatedItem.discountAmount) || 0
          updatedItem.netAmount = Math.max(0, original - discount).toFixed(2)
        }
        return updatedItem
      })
      return { ...prev, rows: updatedRows }
    })
  }

  const addRow = (e, type = patientDetailForm.type) => {
    e.preventDefault()
    setPatientDetailForm((prev) => ({
      ...prev,
      rows: [
        ...prev.rows,
        {
          id: Date.now(),
          name: "",
          date: "",
          originalAmount: 0,
          discountAmount: 0,
          netAmount: 0,
          type: type,
        },
      ],
    }))
    setCheckedRows((prev) => [...prev, true])
  }

  const removeRow = (index) => {
    setPatientDetailForm((prev) => ({
      ...prev,
      rows: prev.rows.filter((_, i) => i !== index),
    }))
    setCheckedRows((prev) => prev.filter((_, i) => i !== index))
  }

  const calculatePaymentBreakdown = () => {
    // Fixed: Add safety check for rows
    if (!patientDetailForm.rows || !Array.isArray(patientDetailForm.rows)) {
      return {
        totalOriginalAmount: "0.00",
        totalDiscountAmount: "0.00",
        totalNetAmount: "0.00",
        totalGstAmount: "0.00",
        finalAmount: "0.00",
        gstPercent: gstConfig.gstPercent,
        gstApplicable: gstConfig.gstApplicable,
        itemCount: 0,
      }
    }

    const checkedItems = patientDetailForm.rows.filter((_, index) => checkedRows[index])
    const totalOriginalAmount = checkedItems.reduce((total, item) => {
      return total + (Number.parseFloat(item.originalAmount) || 0)
    }, 0)
    const totalDiscountAmount = checkedItems.reduce((total, item) => {
      return total + (Number.parseFloat(item.discountAmount) || 0)
    }, 0)
    const totalNetAmount = totalOriginalAmount - totalDiscountAmount
    const totalGstAmount = checkedItems.reduce((total, item) => {
      const itemOriginalAmount = Number.parseFloat(item.originalAmount) || 0
      const itemDiscountAmount = Number.parseFloat(item.discountAmount) || 0
      const itemNetAmount = itemOriginalAmount - itemDiscountAmount
      const itemGstAmount = gstConfig.gstApplicable ? (itemNetAmount * gstConfig.gstPercent) / 100 : 0
      return total + itemGstAmount
    }, 0)
    const finalAmount = totalNetAmount + totalGstAmount

    return {
      totalOriginalAmount: totalOriginalAmount.toFixed(2),
      totalDiscountAmount: totalDiscountAmount.toFixed(2),
      totalNetAmount: totalNetAmount.toFixed(2),
      totalGstAmount: totalGstAmount.toFixed(2),
      finalAmount: finalAmount.toFixed(2),
      gstPercent: gstConfig.gstPercent,
      gstApplicable: gstConfig.gstApplicable,
      itemCount: checkedItems.length,
    }
  }

  const validateForm = () => {
    const requiredFields = [
      "patientFn",
      "patientGender",
      "patientRelation",
      "patientDob",
      "patientEmailId",
      "patientMobileNumber",
    ]
    let valid = true
    const newErrors = {}

    requiredFields.forEach((field) => {
      if (!patientDetailForm[field] || patientDetailForm[field].toString().trim() === "") {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`
        valid = false
      }
    })

    if (patientDetailForm.patientEmailId && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientDetailForm.patientEmailId)) {
      newErrors.email = "Invalid email format."
      valid = false
    }

    if (patientDetailForm.patientMobileNumber && !/^\d{10}$/.test(patientDetailForm.patientMobileNumber)) {
      newErrors.mobileNo = "Mobile number must be exactly 10 digits."
      valid = false
    }

    if (patientDetailForm.patientPincode && !/^\d{6}$/.test(patientDetailForm.patientPincode)) {
      newErrors.pinCode = "Pin Code must be exactly 6 digits."
      valid = false
    }

    setErrors(newErrors)
    return valid
  }

  function handleSubmit() {
    console.log("Form Data:", patientDetailForm)
    if (imageURL != "") {
      patientDetailForm.patientImage = imageURL
    }
    sendLabData()
  }

  const sendLabData = async () => {
    if (validateForm()) {
      try {
        // Fixed: Add safety check for rows
        if (!patientDetailForm.rows || !Array.isArray(patientDetailForm.rows)) {
          throw new Error("No investigation or package data found.")
        }

        const hasCheckedItems = patientDetailForm.rows.some((row, index) => checkedRows && checkedRows[index] === true)
        if (!hasCheckedItems) {
          throw new Error("Please select at least one investigation or package to proceed.")
        }

        // Mock lab data submission
        console.log("Lab data would be submitted:", {
          patientId: patientDetailForm.id,
          labInvestigationReq: patientDetailForm.rows.map((row, index) => ({
            id: row.itemId,
            appointmentDate: row.date || new Date().toISOString().split("T")[0],
            checkStatus: checkedRows && checkedRows[index] === true,
            actualAmount: Number.parseFloat(row.originalAmount) || 0,
            discountedAmount: Number.parseFloat(row.discountAmount) || 0,
            type: row.type === "investigation" ? "i" : "p",
          })),
        })

        await Swal.fire("Lab Registration Updated", "Lab registration has been successfully updated!", "success")
        setShowPatientDetails(false)
      } catch (error) {
        console.error("Error:", error)
        Swal.fire("Error!", error.message || "Update failed", "error")
      }
    }
  }

  const isLastRowComplete = () => {
    if (!patientDetailForm.rows || patientDetailForm.rows.length === 0) return false
    const lastRow = patientDetailForm.rows[patientDetailForm.rows.length - 1]
    return (
      lastRow.name &&
      lastRow.name.trim() !== "" &&
      lastRow.date &&
      lastRow.date.trim() !== "" &&
      lastRow.originalAmount !== undefined &&
      lastRow.originalAmount !== "" &&
      !isNaN(lastRow.originalAmount) &&
      lastRow.discountAmount !== undefined &&
      lastRow.discountAmount !== "" &&
      !isNaN(lastRow.discountAmount)
    )
  }

  const paymentBreakdown = calculatePaymentBreakdown()

  return (
    <div className="body d-flex py-3">
      <div className="container-xxl">
        <div className="row align-items-center">
          <div className="border-0 mb-4">
            <div className="card-header py-3 no-bg bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap">
              <h3 className="fw-bold mb-0">Update Lab Registration</h3>
            </div>
          </div>
        </div>

        {/* Patient Search */}
        <div className="row mb-3">
          <div className="col-sm-12">
            <div className="card shadow mb-3">
              <div className="card-header py-3 bg-light border-bottom-1">
                <h6 className="mb-0 fw-bold">Search Patient</h6>
              </div>
              <div className="card-body">
                <form>
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
                    <div className="col-md-3">
                      <label className="form-label">UHID No.</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter UHID No."
                        name="uhidNo"
                        value={formData.uhidNo}
                        onChange={handleChangeSearch}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="appointmentDate"
                        value={formData.appointmentDate}
                        onChange={handleChangeSearch}
                      />
                    </div>
                  </div>

                  <div className="mt-3 mb-2">
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
                            <td>
                              {`${patient.patientFn || ""} ${patient.patientMn || ""} ${patient.patientLn || ""}`.trim()}
                            </td>
                            <td>{patient.patientMobileNumber || ""}</td>
                            <td>{patient.uhidNo}</td>
                            <td>{patient.patientAge || ""}</td>
                            <td>{patient.patientGender.genderName}</td>
                            <td>{patient.patientEmailId}</td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => handleEdit(patient)}
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
                </form>
              </div>
            </div>
          </div>
        </div>

        {showPatientDetails && (
          <>
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
                                value={patientDetailForm.patientMobileNumber || ""}
                                onChange={handleChange}
                              />
                            </div>
                            <div className="col-md-4">
                              <label className="form-label" htmlFor="gender">
                                Gender *
                              </label>
                              <select
                                className={`form-select ${errors.gender ? "is-invalid" : ""}`}
                                id="gender"
                                name="patientGender"
                                value={patientDetailForm.patientGender}
                                onChange={handleChange}
                              >
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
                              <label className="form-label" htmlFor="relation">
                                Relation *
                              </label>
                              <select
                                className={`form-select ${errors.relation ? "is-invalid" : ""}`}
                                id="relation"
                                name="patientRelation"
                                value={patientDetailForm.patientRelation}
                                onChange={handleChange}
                              >
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
                              <input
                                type="date"
                                name="patientDob"
                                className="form-control"
                                placeholder="Select Date of Birth"
                                required
                                value={patientDetailForm.patientDob || ""}
                                onChange={handleChange}
                              />
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">Age</label>
                              <input
                                type="number"
                                className="form-control"
                                placeholder="Enter Age"
                                name="patientAge"
                                value={patientDetailForm.patientAge || ""}
                                onChange={handleChange}
                              />
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">Email *</label>
                              <input
                                type="email"
                                className="form-control"
                                placeholder="Enter Email Address"
                                name="patientEmailId"
                                value={patientDetailForm.patientEmailId || ""}
                                onChange={handleChange}
                                required
                              />
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

            {/* Patient Address */}
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
                              patientDetailForm.patientCountry ? JSON.stringify(patientDetailForm.patientCountry) : ""
                            }
                            onChange={(e) => {
                              const selectedCountry = JSON.parse(e.target.value)
                              handleAddChange({ target: { name: "patientCountry", value: selectedCountry } })
                            }}
                          >
                            <option value="">Select Country</option>
                            {countryData.map((country) => (
                              <option key={country.id} value={JSON.stringify(country)}>
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
                            value={patientDetailForm.patientState ? patientDetailForm.patientState.id : ""}
                            onChange={(e) => {
                              const selectedState = stateData.find(
                                (state) => state.id === Number.parseInt(e.target.value, 10),
                              )
                              handleAddChange({ target: { name: "patientState", value: selectedState } })
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
                              const selectedDistrictId = Number.parseInt(e.target.value, 10)
                              const selectedDistrict = districtData.find(
                                (district) => district.id === selectedDistrictId,
                              )
                              handleAddChange({ target: { name: "patientDistrict", value: selectedDistrict } })
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
                            value={patientDetailForm.patientCity || ""}
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
                            value={patientDetailForm.nokCountry ? JSON.stringify(patientDetailForm.nokCountry) : ""}
                            onChange={(e) => {
                              const selectedCountry = JSON.parse(e.target.value)
                              handleAddChange({ target: { name: "nokCountry", value: selectedCountry } })
                            }}
                          >
                            <option value="">Select Country</option>
                            {countryData.map((country) => (
                              <option key={country.id} value={JSON.stringify(country)}>
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
                            value={patientDetailForm.nokState ? patientDetailForm.nokState.id : ""}
                            onChange={(e) => {
                              const selectedStateId = Number.parseInt(e.target.value, 10)
                              const selectedState = nokStateData.find((state) => state.id === selectedStateId)
                              handleAddChange({ target: { name: "nokState", value: selectedState } })
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
                              const selectedDistrictId = Number.parseInt(e.target.value, 10)
                              const selectedDistrict = nokDistrictData.find(
                                (district) => district.id === selectedDistrictId,
                              )
                              handleAddChange({ target: { name: "nokDistrict", value: selectedDistrict } })
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

            {/* Lab Investigation/Package Details */}
            <div className="row mb-3">
              <div className="col-sm-12">
                <div className="card shadow mb-3">
                  <div className="card-header bg-light border-bottom-1 py-3">
                    <h6 className="fw-bold mb-0">
                      {patientDetailForm.type === "investigation" ? "Investigation Details" : "Package Details"}
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
                          checked={patientDetailForm.type === "investigation"}
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
                          checked={patientDetailForm.type === "package"}
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
                          <th>{patientDetailForm.type === "investigation" ? "Investigation Name" : "Package Name"}</th>
                          <th>Date</th>
                          <th>Original Amount</th>
                          <th>Discount Amount</th>
                          <th>Net Amount</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientDetailForm.rows &&
                          patientDetailForm.rows.map((row, index) => (
                            <tr key={index}>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <input
                                    type="checkbox"
                                    style={{ width: "20px", height: "20px", border: "2px solid black" }}
                                    className="form-check-input"
                                    checked={checkedRows[index] || false}
                                    onChange={(e) => {
                                      const updated = [...checkedRows]
                                      updated[index] = e.target.checked
                                      setCheckedRows(updated)
                                    }}
                                  />
                                  <div className="dropdown-search-container position-relative flex-grow-1">
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={row.name}
                                      autoComplete="off"
                                      placeholder={
                                        patientDetailForm.type === "investigation"
                                          ? "Investigation Name"
                                          : "Package Name"
                                      }
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
                                          maxHeight: "200px",
                                          overflowY: "auto",
                                          backgroundColor: "#fff",
                                          border: "1px solid #ccc",
                                        }}
                                      >
                                        {patientDetailForm.type === "investigation"
                                          ? investigationItems
                                              .filter((item) =>
                                                item.investigationName.toLowerCase().includes(row.name.toLowerCase()),
                                              )
                                              .map((item, i) => {
                                                const hasDiscount = item.disc && item.disc > 0
                                                const displayPrice = item.price || 0
                                                const discountAmount = hasDiscount ? item.disc : 0
                                                const finalPrice = hasDiscount
                                                  ? displayPrice - discountAmount
                                                  : displayPrice
                                                return (
                                                  <li
                                                    key={i}
                                                    className="list-group-item list-group-item-action"
                                                    style={{ backgroundColor: "#e3e8e6", cursor: "pointer" }}
                                                    onClick={() => {
                                                      if (
                                                        item.price === null ||
                                                        item.price === 0 ||
                                                        item.price === "0"
                                                      ) {
                                                        Swal.fire(
                                                          "Warning",
                                                          "Price has not been configured for this Investigation",
                                                          "warning",
                                                        )
                                                      } else {
                                                        handleRowChange(index, "name", item.investigationName)
                                                        handleRowChange(index, "itemId", item.investigationId)
                                                        handleRowChange(index, "originalAmount", displayPrice)
                                                        handleRowChange(index, "discountAmount", discountAmount)
                                                        handleRowChange(index, "netAmount", finalPrice)
                                                        setActiveRowIndex(null)
                                                      }
                                                    }}
                                                  >
                                                    <div>
                                                      <strong>{item.investigationName}</strong>
                                                      <div className="d-flex justify-content-between">
                                                        <span>
                                                          {item.price === null
                                                            ? "Price not configured"
                                                            : `₹${finalPrice.toFixed(2)}`}
                                                        </span>
                                                        {hasDiscount && (
                                                          <span className="text-success">
                                                            (Discount: ₹{discountAmount.toFixed(2)})
                                                          </span>
                                                        )}
                                                      </div>
                                                      {item.investigationType && (
                                                        <small className="text-muted">
                                                          Type: {item.investigationType}
                                                        </small>
                                                      )}
                                                    </div>
                                                  </li>
                                                )
                                              })
                                          : packageItems
                                              .filter((item) =>
                                                item.packName.toLowerCase().includes(row.name.toLowerCase()),
                                              )
                                              .map((item, i) => (
                                                <li
                                                  key={i}
                                                  className="list-group-item list-group-item-action"
                                                  style={{ backgroundColor: "#e3e8e6", cursor: "pointer" }}
                                                  onClick={() => {
                                                    handleRowChange(index, "name", item.packName)
                                                    handleRowChange(index, "itemId", item.id)
                                                    handleRowChange(index, "originalAmount", item.actualCost)
                                                    handleRowChange(index, "discountAmount", 0)
                                                    handleRowChange(index, "netAmount", item.actualCost)
                                                    setActiveRowIndex(null)
                                                  }}
                                                >
                                                  <div>
                                                    <strong>{item.packName}</strong>
                                                    <div className="d-flex justify-content-between">
                                                      <span>₹{item.actualCost.toFixed(2)}</span>
                                                    </div>
                                                  </div>
                                                </li>
                                              ))}
                                      </ul>
                                    )}
                                  </div>
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
                                <input
                                  type="number"
                                  className="form-control"
                                  value={row.discountAmount}
                                  onChange={(e) => handleRowChange(index, "discountAmount", e.target.value)}
                                  min="0"
                                  step="0.01"
                                />
                              </td>
                              <td>
                                <div className="font-weight-bold text-success">₹{row.netAmount || "0.00"}</div>
                              </td>
                              <td>
                                <div className="d-flex align-item-center gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={() => removeRow(index)}
                                    disabled={patientDetailForm.rows.length === 1}
                                  >
                                    <i className="icofont-close"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    <div className="d-flex justify-content-between align-items-center">
                      <button
                        type="button"
                        className="btn btn-success"
                        onClick={addRow}
                        disabled={!isLastRowComplete()}
                      >
                        Add {patientDetailForm.type === "investigation" ? "Investigation" : "Package"} +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary Section */}
            <div className="row mb-3">
              <div className="col-sm-12">
                <div
                  className="card shadow mb-3"
                  style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", border: "none" }}
                >
                  <div
                    className="card-header py-3 text-white"
                    style={{ background: "rgba(255,255,255,0.1)", border: "none" }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-2 bg-white rounded" style={{ opacity: 0.9 }}>
                        <i className="fa fa-calculator text-primary"></i>
                      </div>
                      <div>
                        <h5 className="mb-0 fw-bold text-white">Payment Summary</h5>
                        <small className="text-white" style={{ opacity: 0.8 }}>
                          {paymentBreakdown.itemCount} item{paymentBreakdown.itemCount !== 1 ? "s" : ""} selected
                        </small>
                      </div>
                    </div>
                  </div>
                  <div className="card-body text-white">
                    <div className="row g-3 mb-4">
                      <div className="col-md-3">
                        <div
                          className="card h-100"
                          style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}
                        >
                          <div className="card-body text-center">
                            <div className="mb-2">
                              <i className="fa fa-receipt fa-2x text-white" style={{ opacity: 0.8 }}></i>
                            </div>
                            <h6 className="card-title text-white mb-1">Total Amount</h6>
                            <h4 className="text-white fw-bold">₹{paymentBreakdown.totalOriginalAmount}</h4>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div
                          className="card h-100"
                          style={{ background: "rgba(40,167,69,0.2)", border: "1px solid rgba(40,167,69,0.3)" }}
                        >
                          <div className="card-body text-center">
                            <div className="mb-2">
                              <i className="fa fa-percent fa-2x text-success"></i>
                            </div>
                            <h6 className="card-title text-white mb-1">Total Discount</h6>
                            <h4 className="text-success fw-bold">₹{paymentBreakdown.totalDiscountAmount}</h4>
                          </div>
                        </div>
                      </div>
                      {paymentBreakdown.gstApplicable && (
                        <div className="col-md-3">
                          <div
                            className="card h-100"
                            style={{ background: "rgba(255,193,7,0.2)", border: "1px solid rgba(255,193,7,0.3)" }}
                          >
                            <div className="card-body text-center">
                              <div className="mb-2">
                                <i className="fa fa-file-invoice fa-2x text-warning"></i>
                              </div>
                              <h6 className="card-title text-white mb-1">Tax ({paymentBreakdown.gstPercent}% GST)</h6>
                              <h4 className="text-warning fw-bold">₹{paymentBreakdown.totalGstAmount}</h4>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="col-md-3">
                        <div
                          className="card h-100"
                          style={{
                            background: "linear-gradient(45deg, #28a745, #20c997)",
                            border: "none",
                            boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                          }}
                        >
                          <div className="card-body text-center">
                            <div className="mb-2">
                              <i className="fa fa-credit-card fa-2x text-white"></i>
                            </div>
                            <h6 className="card-title text-white mb-1">Final Amount</h6>
                            <h4 className="text-white fw-bold">₹{paymentBreakdown.finalAmount}</h4>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="card" style={{ background: "rgba(255,255,255,0.95)", border: "none" }}>
                      <div className="card-body">
                        <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                          <i className="fa fa-list-alt text-primary"></i>
                          Payment Breakdown
                        </h6>
                        <div className="row">
                          <div className="col-md-8">
                            <div className="d-flex justify-content-between py-2 border-bottom">
                              <span className="text-muted">Subtotal ({paymentBreakdown.itemCount} items)</span>
                              <span className="fw-medium text-dark">₹{paymentBreakdown.totalOriginalAmount}</span>
                            </div>
                            {Number(paymentBreakdown.totalDiscountAmount) > 0 && (
                              <div className="d-flex justify-content-between py-2 border-bottom">
                                <span className="text-success">Discount Applied</span>
                                <span className="fw-medium text-success">-₹{paymentBreakdown.totalDiscountAmount}</span>
                              </div>
                            )}
                            <div className="d-flex justify-content-between py-2 border-bottom">
                              <span className="text-muted">Amount after Discount</span>
                              <span className="fw-medium text-dark">₹{paymentBreakdown.totalNetAmount}</span>
                            </div>
                            {paymentBreakdown.gstApplicable && (
                              <div className="d-flex justify-content-between py-2 border-bottom">
                                <span className="text-muted">GST ({paymentBreakdown.gstPercent}%)</span>
                                <span className="fw-medium text-warning">+₹{paymentBreakdown.totalGstAmount}</span>
                              </div>
                            )}
                            <div className="d-flex justify-content-between py-3 border-top">
                              <span className="h5 fw-bold text-dark">Total Payable</span>
                              <span className="h4 fw-bold text-primary">₹{paymentBreakdown.finalAmount}</span>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="d-flex flex-wrap gap-2">
                              <span className="badge bg-secondary px-3 py-2">
                                {paymentBreakdown.itemCount} Items Selected
                              </span>
                              {Number(paymentBreakdown.totalDiscountAmount) > 0 && (
                                <span className="badge bg-success px-3 py-2">Discount Applied</span>
                              )}
                              {paymentBreakdown.gstApplicable && (
                                <span className="badge bg-info px-3 py-2">GST Included</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
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
                        <button type="button" onClick={handleSubmit} className="btn btn-primary me-2">
                          Update Lab Registration
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
          </>
        )}
      </div>
    </div>
  )
}

export default UpdateLabRegistration
