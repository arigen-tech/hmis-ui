import { useState } from "react"
import Popup from "../../../Components/popup"
import LoadingScreen from "../../../Components/Loading"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination"

const DonorRegistrationViewUpdate = () => {
  const [currentView, setCurrentView] = useState("list")
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [donorList, setDonorList] = useState([
    {
      id: 1,
      donorUhid: "DON001",
      donorFn: "John",
      donorMn: "",
      donorLn: "Doe",
      donorMobileNumber: "9876543210",
      donorGenderId: "1",
      donorRelationId: "1",
      donorDob: "1990-01-15T00:00:00",
      donorBloodGroupId: "1",
      donorAddress1: "123 Main Street",
      donorAddress2: "Apt 4B",
      donorCountryId: "1",
      donorStateId: "1",
      donorDistrictId: "1",
      donorCity: "Mumbai",
      donorPincode: "400001",
      hemoglobin: "14.5",
      weight: "65.5",
      height: "175",
      bloodPressure: "120/80",
      pulse: "72",
      temperature: "36.8",
      screenResult: "pass",
      deferralType: "",
      deferralReason: "",
      regDate: "2024-01-15T10:30:00",
      createdBy: "Admin",
      donorStatus: "Active"
    },
    {
      id: 2,
      donorUhid: "DON002",
      donorFn: "Jane",
      donorMn: "Marie",
      donorLn: "Smith",
      donorMobileNumber: "9876543211",
      donorGenderId: "2",
      donorRelationId: "2",
      donorDob: "1985-05-20T00:00:00",
      donorBloodGroupId: "2",
      donorAddress1: "456 Oak Avenue",
      donorAddress2: "",
      donorCountryId: "1",
      donorStateId: "2",
      donorDistrictId: "2",
      donorCity: "Delhi",
      donorPincode: "110001",
      hemoglobin: "13.2",
      weight: "58.0",
      height: "162",
      bloodPressure: "118/76",
      pulse: "68",
      temperature: "36.5",
      screenResult: "fail",
      deferralType: "temporary",
      deferralReason: "Low hemoglobin level",
      regDate: "2024-01-16T14:20:00",
      createdBy: "Admin",
      donorStatus: "Active"
    }
  ])
  const [filteredDonorList, setFilteredDonorList] = useState([])
  const [genderData, setGenderData] = useState([
    { id: "1", genderName: "Male" },
    { id: "2", genderName: "Female" },
    { id: "3", genderName: "Other" }
  ])
  const [relationData, setRelationData] = useState([
    { id: "1", relationName: "Self" },
    { id: "2", relationName: "Spouse" },
    { id: "3", relationName: "Child" },
    { id: "4", relationName: "Parent" }
  ])
  const [bloodGroupData, setBloodGroupData] = useState([
    { id: "1", bloodGroupName: "A+" },
    { id: "2", bloodGroupName: "A-" },
    { id: "3", bloodGroupName: "B+" },
    { id: "4", bloodGroupName: "B-" },
    { id: "5", bloodGroupName: "O+" },
    { id: "6", bloodGroupName: "O-" },
    { id: "7", bloodGroupName: "AB+" },
    { id: "8", bloodGroupName: "AB-" }
  ])
  const [countryData, setCountryData] = useState([
    { id: "1", countryName: "India" },
    { id: "2", countryName: "USA" },
    { id: "3", countryName: "UK" }
  ])
  const [stateData, setStateData] = useState([])
  const [districtData, setDistrictData] = useState([])
  const [popupMessage, setPopupMessage] = useState(null)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    mobileNo: "",
    gender: "",
    relation: "",
    dob: "",
    bloodGroup: "",
    address1: "",
    address2: "",
    country: "",
    state: "",
    district: "",
    city: "",
    pinCode: "",
    hemoglobin: "",
    weight: "",
    height: "",
    bloodPressure: "",
    pulse: "",
    temperature: "",
    screenResult: "",
    deferralType: "",
    deferralReason: ""
  })

  const [errors, setErrors] = useState({})

  const showPopup = (message, type = "info", onCloseCallback = null) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
        if (onCloseCallback) {
          onCloseCallback()
        }
      }
    })
  }

  useState(() => {
    setFilteredDonorList(donorList)
  }, [])

  const handleSearch = () => {
    let filtered = donorList

    // Date range filter
    if (fromDate && toDate) {
      const from = new Date(fromDate)
      const to = new Date(toDate)
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.regDate)
        return itemDate >= from && itemDate <= to
      })
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.donorFn?.toLowerCase().includes(query) ||
        item.donorLn?.toLowerCase().includes(query) ||
        item.donorMobileNumber?.includes(query) ||
        item.donorUhid?.toLowerCase().includes(query)
      )
    }

    setFilteredDonorList(filtered)
    setCurrentPage(1)
  }

  const handleShowAll = () => {
    setFromDate("")
    setToDate("")
    setSearchQuery("")
    setFilteredDonorList(donorList)
    setCurrentPage(1)
  }

  const handleEditClick = (record) => {
    setSelectedRecord(record)
    
    // Set states based on country
    if (record.donorCountryId === "1") {
      setStateData([
        { id: "1", stateName: "Maharashtra" },
        { id: "2", stateName: "Delhi" },
        { id: "3", stateName: "Karnataka" }
      ])
    } else {
      setStateData([])
    }

    // Set districts based on state
    if (record.donorStateId === "1") {
      setDistrictData([
        { id: "1", districtName: "Mumbai" },
        { id: "2", districtName: "Pune" }
      ])
    } else if (record.donorStateId === "2") {
      setDistrictData([
        { id: "1", districtName: "New Delhi" },
        { id: "2", districtName: "South Delhi" }
      ])
    } else {
      setDistrictData([])
    }

    // Map record data to formData
    setFormData({
      firstName: record.donorFn || "",
      middleName: record.donorMn || "",
      lastName: record.donorLn || "",
      mobileNo: record.donorMobileNumber || "",
      gender: record.donorGenderId || "",
      relation: record.donorRelationId || "",
      dob: record.donorDob ? record.donorDob.split("T")[0] : "",
      bloodGroup: record.donorBloodGroupId || "",
      address1: record.donorAddress1 || "",
      address2: record.donorAddress2 || "",
      country: record.donorCountryId || "",
      state: record.donorStateId || "",
      district: record.donorDistrictId || "",
      city: record.donorCity || "",
      pinCode: record.donorPincode || "",
      hemoglobin: record.hemoglobin || "",
      weight: record.weight || "",
      height: record.height || "",
      bloodPressure: record.bloodPressure || "",
      pulse: record.pulse || "",
      temperature: record.temperature || "",
      screenResult: record.screenResult || "",
      deferralType: record.deferralType || "",
      deferralReason: record.deferralReason || ""
    })

    setCurrentView("detail")
  }

  const handleBackToList = () => {
    setCurrentView("list")
    setSelectedRecord(null)
    setFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      mobileNo: "",
      gender: "",
      relation: "",
      dob: "",
      bloodGroup: "",
      address1: "",
      address2: "",
      country: "",
      state: "",
      district: "",
      city: "",
      pinCode: "",
      hemoglobin: "",
      weight: "",
      height: "",
      bloodPressure: "",
      pulse: "",
      temperature: "",
      screenResult: "",
      deferralType: "",
      deferralReason: ""
    })
    setErrors({})
    setStateData([])
    setDistrictData([])
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    const updatedForm = { ...formData, [name]: value }

    // If screen result changes to "pass", clear deferral fields
    if (name === "screenResult") {
      if (value === "pass") {
        updatedForm.deferralType = ""
        updatedForm.deferralReason = ""
      }
    }

    // If country changes, set states
    if (name === "country") {
      if (value === "1") {
        setStateData([
          { id: "1", stateName: "Maharashtra" },
          { id: "2", stateName: "Delhi" },
          { id: "3", stateName: "Karnataka" }
        ])
      } else {
        setStateData([])
      }
      updatedForm.state = ""
      updatedForm.district = ""
      setDistrictData([])
    }

    // If state changes, set districts
    if (name === "state") {
      if (value === "1") {
        setDistrictData([
          { id: "1", districtName: "Mumbai" },
          { id: "2", districtName: "Pune" }
        ])
      } else if (value === "2") {
        setDistrictData([
          { id: "1", districtName: "New Delhi" },
          { id: "2", districtName: "South Delhi" }
        ])
      } else {
        setDistrictData([])
      }
      updatedForm.district = ""
    }

    setFormData(updatedForm)

    // Clear error for this field
    setErrors(prev => ({ ...prev, [name]: "" }))
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.firstName.trim()) newErrors.firstName = "First Name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last Name is required"
    if (!formData.mobileNo.trim()) newErrors.mobileNo = "Mobile number is required"
    else if (!/^\d{10}$/.test(formData.mobileNo)) newErrors.mobileNo = "Must be 10 digits"
    
    if (!formData.gender) newErrors.gender = "Gender is required"
    if (!formData.relation) newErrors.relation = "Relation is required"
    if (!formData.dob) newErrors.dob = "Date of Birth is required"
    if (!formData.bloodGroup) newErrors.bloodGroup = "Blood Group is required"
    
    if (!formData.address1.trim()) newErrors.address1 = "Address 1 is required"
    if (!formData.country) newErrors.country = "Country is required"
    if (!formData.state) newErrors.state = "State is required"
    if (!formData.district) newErrors.district = "District is required"
    if (!formData.city.trim()) newErrors.city = "City is required"
    if (!formData.pinCode.trim()) newErrors.pinCode = "Pin Code is required"
    else if (!/^\d{6}$/.test(formData.pinCode)) newErrors.pinCode = "Must be 6 digits"
    
    if (!formData.hemoglobin.trim()) newErrors.hemoglobin = "Hemoglobin is required"
    if (!formData.weight.trim()) newErrors.weight = "Weight is required"
    if (!formData.height.trim()) newErrors.height = "Height is required"
    if (!formData.bloodPressure.trim()) newErrors.bloodPressure = "Blood Pressure is required"
    else if (!/^\d{2,3}\/\d{2,3}$/.test(formData.bloodPressure)) newErrors.bloodPressure = "Format: 120/80"
    if (!formData.pulse.trim()) newErrors.pulse = "Pulse is required"
    if (!formData.temperature.trim()) newErrors.temperature = "Temperature is required"

    // Screen Result validation
    if (!formData.screenResult) {
      newErrors.screenResult = "Screen Result is required"
    }

    // Deferral fields validation when screen fails
    if (formData.screenResult === "fail") {
      if (!formData.deferralType.trim()) {
        newErrors.deferralType = "Deferral Type is required when screen fails"
      }
      if (!formData.deferralReason.trim()) {
        newErrors.deferralReason = "Deferral Reason is required when screen fails"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      showPopup("Please fill all mandatory fields", "warning")
      return
    }

    try {
      setProcessing(true)
      
      // Update donor in local list
      const updatedDonorList = donorList.map(donor => {
        if (donor.id === selectedRecord.id) {
          return {
            ...donor,
            donorFn: formData.firstName,
            donorMn: formData.middleName,
            donorLn: formData.lastName,
            donorMobileNumber: formData.mobileNo,
            donorGenderId: formData.gender,
            donorRelationId: formData.relation,
            donorDob: formData.dob + "T00:00:00",
            donorBloodGroupId: formData.bloodGroup,
            donorAddress1: formData.address1,
            donorAddress2: formData.address2,
            donorCountryId: formData.country,
            donorStateId: formData.state,
            donorDistrictId: formData.district,
            donorCity: formData.city,
            donorPincode: formData.pinCode,
            hemoglobin: formData.hemoglobin,
            weight: formData.weight,
            height: formData.height,
            bloodPressure: formData.bloodPressure,
            pulse: formData.pulse,
            temperature: formData.temperature,
            screenResult: formData.screenResult,
            deferralType: formData.deferralType,
            deferralReason: formData.deferralReason
          }
        }
        return donor
      })

      setDonorList(updatedDonorList)
      setFilteredDonorList(updatedDonorList)
      
      showPopup("Donor updated successfully!", "success", () => {
        handleBackToList()
      })
    } catch (error) {
      console.error("Error:", error)
      showPopup("An error occurred", "error")
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ""
    return dateStr.split("T")[0]
  }

  const getStatusBadge = (screenResult) => {
    if (screenResult === "pass") {
      return <span className="badge bg-success">Passed</span>
    } else if (screenResult === "fail") {
      return <span className="badge bg-danger">Failed</span>
    }
    return <span className="badge bg-secondary">Not Screened</span>
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (currentView === "detail") {
    return (
      <div className="body d-flex py-3">
        {popupMessage && (
          <Popup
            message={popupMessage.message}
            type={popupMessage.type}
            onClose={popupMessage.onClose}
          />
        )}

        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="border-0 mb-4">
              <div className="card-header py-3 no-bg bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap">
                <h3 className="fw-bold mb-0">View/Edit Donor Information</h3>
                <button type="button" className="btn btn-secondary" onClick={handleBackToList}>
                  Back to List
                </button>
              </div>
            </div>
          </div>

          {/* Donor Basic Info Card */}
          <div className="row mb-3">
            <div className="col-sm-12">
              <div className="card shadow mb-3">
                <div className="card-header py-3 border-bottom-1">
                  <h6 className="mb-0 fw-bold">Donor Information</h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-3">
                      <label className="form-label">Donor ID</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedRecord?.donorUhid || "N/A"}
                        readOnly
                        style={{ backgroundColor: "#e9ecef" }}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Registration Date</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formatDate(selectedRecord?.regDate) || "N/A"}
                        readOnly
                        style={{ backgroundColor: "#e9ecef" }}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Status</label>
                      <div className="form-control" style={{ backgroundColor: "#e9ecef" }}>
                        {getStatusBadge(selectedRecord?.screenResult)}
                      </div>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Registered By</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedRecord?.createdBy || "N/A"}
                        readOnly
                        style={{ backgroundColor: "#e9ecef" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="row mb-3">
            <div className="col-sm-12">
              <div className="card shadow mb-3">
                <div className="card-header py-3 border-bottom-1">
                  <h6 className="mb-0 fw-bold">Personal Details</h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">First Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className={`form-control ${errors.firstName ? "is-invalid" : ""}`}
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="Enter First Name"
                      />
                      {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Middle Name</label>
                      <input
                        type="text"
                        name="middleName"
                        value={formData.middleName}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="Enter Middle Name"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Last Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className={`form-control ${errors.lastName ? "is-invalid" : ""}`}
                        placeholder="Enter Last Name"
                      />
                      {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Mobile No. <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className={`form-control ${errors.mobileNo ? "is-invalid" : ""}`}
                        name="mobileNo"
                        value={formData.mobileNo}
                        maxLength={10}
                        onChange={handleChange}
                        placeholder="Enter Mobile Number"
                      />
                      {errors.mobileNo && <div className="invalid-feedback">{errors.mobileNo}</div>}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Gender <span className="text-danger">*</span></label>
                      <select
                        className={`form-select ${errors.gender ? "is-invalid" : ""}`}
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                      >
                        <option value="">Select Gender</option>
                        {genderData.map(gender => (
                          <option key={gender.id} value={gender.id}>{gender.genderName}</option>
                        ))}
                      </select>
                      {errors.gender && <div className="invalid-feedback">{errors.gender}</div>}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Relation <span className="text-danger">*</span></label>
                      <select
                        className={`form-select ${errors.relation ? "is-invalid" : ""}`}
                        name="relation"
                        value={formData.relation}
                        onChange={handleChange}
                      >
                        <option value="">Select Relation</option>
                        {relationData.map(relation => (
                          <option key={relation.id} value={relation.id}>{relation.relationName}</option>
                        ))}
                      </select>
                      {errors.relation && <div className="invalid-feedback">{errors.relation}</div>}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Date of Birth <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        name="dob"
                        className={`form-control ${errors.dob ? "is-invalid" : ""}`}
                        value={formData.dob}
                        max={new Date().toISOString().split("T")[0]}
                        onChange={handleChange}
                      />
                      {errors.dob && <div className="invalid-feedback">{errors.dob}</div>}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Blood Group <span className="text-danger">*</span></label>
                      <select
                        className={`form-select ${errors.bloodGroup ? "is-invalid" : ""}`}
                        name="bloodGroup"
                        value={formData.bloodGroup}
                        onChange={handleChange}
                      >
                        <option value="">Select Blood Group</option>
                        {bloodGroupData.map(bloodGroup => (
                          <option key={bloodGroup.id} value={bloodGroup.id}>{bloodGroup.bloodGroupName}</option>
                        ))}
                      </select>
                      {errors.bloodGroup && <div className="invalid-feedback">{errors.bloodGroup}</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className="row mb-3">
            <div className="col-sm-12">
              <div className="card shadow mb-3">
                <div className="card-header py-3 border-bottom-1">
                  <h6 className="mb-0 fw-bold">Address Details</h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Address 1 <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className={`form-control ${errors.address1 ? "is-invalid" : ""}`}
                        name="address1"
                        value={formData.address1}
                        onChange={handleChange}
                        placeholder="Enter Address 1"
                      />
                      {errors.address1 && <div className="invalid-feedback">{errors.address1}</div>}
                    </div>
                    <div className="col-md-6">
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
                      <label className="form-label">Country <span className="text-danger">*</span></label>
                      <select
                        className={`form-select ${errors.country ? "is-invalid" : ""}`}
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                      >
                        <option value="">Select Country</option>
                        {countryData.map(country => (
                          <option key={country.id} value={country.id}>{country.countryName}</option>
                        ))}
                      </select>
                      {errors.country && <div className="invalid-feedback">{errors.country}</div>}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">State <span className="text-danger">*</span></label>
                      <select
                        className={`form-select ${errors.state ? "is-invalid" : ""}`}
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        disabled={!formData.country}
                      >
                        <option value="">Select State</option>
                        {stateData.map(state => (
                          <option key={state.id} value={state.id}>{state.stateName}</option>
                        ))}
                      </select>
                      {errors.state && <div className="invalid-feedback">{errors.state}</div>}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">District <span className="text-danger">*</span></label>
                      <select
                        className={`form-select ${errors.district ? "is-invalid" : ""}`}
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        disabled={!formData.state}
                      >
                        <option value="">Select District</option>
                        {districtData.map(district => (
                          <option key={district.id} value={district.id}>{district.districtName}</option>
                        ))}
                      </select>
                      {errors.district && <div className="invalid-feedback">{errors.district}</div>}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">City <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className={`form-control ${errors.city ? "is-invalid" : ""}`}
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Enter City"
                      />
                      {errors.city && <div className="invalid-feedback">{errors.city}</div>}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Pin Code <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className={`form-control ${errors.pinCode ? "is-invalid" : ""}`}
                        name="pinCode"
                        value={formData.pinCode}
                        maxLength={6}
                        onChange={handleChange}
                        placeholder="Enter Pin Code"
                      />
                      {errors.pinCode && <div className="invalid-feedback">{errors.pinCode}</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Screening Details */}
          <div className="row mb-3">
            <div className="col-sm-12">
              <div className="card shadow mb-3">
                <div className="card-header py-3 border-bottom-1">
                  <h6 className="mb-0 fw-bold">Screening Details</h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">Hemoglobin (g/dL) <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className={`form-control ${errors.hemoglobin ? "is-invalid" : ""}`}
                        name="hemoglobin"
                        value={formData.hemoglobin}
                        onChange={handleChange}
                        placeholder="Enter Hemoglobin"
                        step="0.1"
                      />
                      {errors.hemoglobin && <div className="invalid-feedback">{errors.hemoglobin}</div>}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Weight (kg) <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className={`form-control ${errors.weight ? "is-invalid" : ""}`}
                        name="weight"
                        value={formData.weight}
                        onChange={handleChange}
                        placeholder="Enter Weight"
                        step="0.1"
                      />
                      {errors.weight && <div className="invalid-feedback">{errors.weight}</div>}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Height (cm) <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className={`form-control ${errors.height ? "is-invalid" : ""}`}
                        name="height"
                        value={formData.height}
                        onChange={handleChange}
                        placeholder="Enter Height"
                        step="0.1"
                      />
                      {errors.height && <div className="invalid-feedback">{errors.height}</div>}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Blood Pressure <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className={`form-control ${errors.bloodPressure ? "is-invalid" : ""}`}
                        name="bloodPressure"
                        value={formData.bloodPressure}
                        onChange={handleChange}
                        placeholder="120/80"
                      />
                      {errors.bloodPressure && <div className="invalid-feedback">{errors.bloodPressure}</div>}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Pulse Rate (bpm) <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className={`form-control ${errors.pulse ? "is-invalid" : ""}`}
                        name="pulse"
                        value={formData.pulse}
                        onChange={handleChange}
                        placeholder="Enter Pulse Rate"
                      />
                      {errors.pulse && <div className="invalid-feedback">{errors.pulse}</div>}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Temperature (°C) <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className={`form-control ${errors.temperature ? "is-invalid" : ""}`}
                        name="temperature"
                        value={formData.temperature}
                        onChange={handleChange}
                        placeholder="Enter Temperature"
                        step="0.1"
                      />
                      {errors.temperature && <div className="invalid-feedback">{errors.temperature}</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Screening Result Section */}
          <div className="row mb-3">
            <div className="col-sm-12">
              <div className="card shadow mb-3">
                <div className="card-header py-3 border-bottom-1">
                  <h6 className="mb-0 fw-bold">Screening Result</h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">Screen Result <span className="text-danger">*</span></label>
                      <div>
                        <div className="form-check form-check-inline">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="screenResult"
                            id="screenPass"
                            value="pass"
                            checked={formData.screenResult === "pass"}
                            onChange={handleChange}
                          />
                          <label className="form-check-label" htmlFor="screenPass">
                            Pass
                          </label>
                        </div>
                        <div className="form-check form-check-inline">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="screenResult"
                            id="screenFail"
                            value="fail"
                            checked={formData.screenResult === "fail"}
                            onChange={handleChange}
                          />
                          <label className="form-check-label" htmlFor="screenFail">
                            Fail
                          </label>
                        </div>
                      </div>
                      {errors.screenResult && <div className="text-danger small mt-1">{errors.screenResult}</div>}
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">Deferral Type</label>
                      <div>
                        <div className="form-check form-check-inline">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="deferralType"
                            id="deferralTemporary"
                            value="temporary"
                            checked={formData.deferralType === "temporary"}
                            onChange={handleChange}
                            disabled={formData.screenResult === "pass"}
                          />
                          <label className="form-check-label" htmlFor="deferralTemporary">
                            Temporary
                          </label>
                        </div>
                        <div className="form-check form-check-inline">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="deferralType"
                            id="deferralPermanent"
                            value="permanent"
                            checked={formData.deferralType === "permanent"}
                            onChange={handleChange}
                            disabled={formData.screenResult === "pass"}
                          />
                          <label className="form-check-label" htmlFor="deferralPermanent">
                            Permanent
                          </label>
                        </div>
                      </div>
                      {errors.deferralType && <div className="text-danger small mt-1">{errors.deferralType}</div>}
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">Deferral Reason</label>
                      <textarea
                        className={`form-control ${errors.deferralReason ? "is-invalid" : ""}`}
                        name="deferralReason"
                        value={formData.deferralReason}
                        onChange={handleChange}
                        placeholder="Enter deferral reason"
                        rows="2"
                        disabled={formData.screenResult === "pass"}
                      />
                      {errors.deferralReason && <div className="invalid-feedback">{errors.deferralReason}</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="row mb-3">
            <div className="col-sm-12">
              <div className="card shadow mb-3">
                <div className="card-body">
                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSubmit}
                      disabled={processing}
                    >
                      {processing ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Updating...
                        </>
                      ) : (
                        <>
                          <i className="fa fa-save me-2"></i>
                          Update Donor
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleBackToList}
                      disabled={processing}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // List View
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE
  const currentItems = filteredDonorList.slice(indexOfFirst, indexOfLast)

  return (
    <div className="body d-flex py-3">
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}

      <div className="container-fluid">
        <div className="row align-items-center">
          <div className="border-0 mb-4">
            <div className="card-header py-3 no-bg bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap">
              <h3 className="fw-bold mb-0">Donor Registration View & Update</h3>
            </div>
          </div>
        </div>

        {/* Search Filters */}
        <div className="row mb-3">
          <div className="col-sm-12">
            <div className="card shadow mb-3">
              <div className="card-header py-3 border-bottom-1">
                <h6 className="mb-0 fw-bold">Search Filters</h6>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label">From Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">To Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Search (Name/Mobile/UHID)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, mobile, or UHID"
                    />
                  </div>
                  <div className="col-md-2 d-flex align-items-end">
                    <button
                      type="button"
                      className="btn btn-primary me-2"
                      onClick={handleSearch}
                    >
                      Search
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleShowAll}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Donor List Table */}
        <div className="row mb-3">
          <div className="col-sm-12">
            <div className="card shadow mb-3">
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-bordered table-hover align-middle">
                    <thead style={{ backgroundColor: "#95a5a6", color: "white" }}>
                      <tr>
                        <th>Donor ID</th>
                        <th>Name</th>
                        <th>Mobile</th>
                        <th>Gender</th>
                        <th>Blood Group</th>
                        <th>Registration Date</th>
                        <th>Screening Result</th>
                        <th>Status</th>
                        <th className="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center">No donors found.</td>
                        </tr>
                      ) : (
                        currentItems.map((donor) => (
                          <tr key={donor.id}>
                            <td>{donor.donorUhid || "N/A"}</td>
                            <td>{`${donor.donorFn || ""} ${donor.donorMn || ""} ${donor.donorLn || ""}`.trim()}</td>
                            <td>{donor.donorMobileNumber || "N/A"}</td>
                            <td>
                              {genderData.find(g => g.id === donor.donorGenderId)?.genderName || "N/A"}
                            </td>
                            <td>
                              {bloodGroupData.find(bg => bg.id === donor.donorBloodGroupId)?.bloodGroupName || "N/A"}
                            </td>
                            <td>{formatDate(donor.regDate)}</td>
                            <td>{getStatusBadge(donor.screenResult)}</td>
                            <td>
                              <span className={`badge ${donor.donorStatus === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                                {donor.donorStatus || 'Active'}
                              </span>
                            </td>
                            <td className="text-center">
                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                onClick={() => handleEditClick(donor)}
                                title="Edit Donor"
                              >
                                <i className="fa fa-pencil"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                <Pagination
                  totalItems={filteredDonorList.length}
                  itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DonorRegistrationViewUpdate