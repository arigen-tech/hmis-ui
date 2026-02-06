import { getRequest, postRequest } from "../../../service/apiService"
import Popup from "../../../Components/popup" 
import { useState, useEffect } from "react"
import LoadingScreen from "../../../Components/Loading"

const DonorRegistration = () => {
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [genderData, setGenderData] = useState([])
  const [relationData, setRelationData] = useState([])
  const [bloodGroupData, setBloodGroupData] = useState([])
  const [countryData, setCountryData] = useState([])
  const [stateData, setStateData] = useState([])
  const [districtData, setDistrictData] = useState([])
  const [popupMessage, setPopupMessage] = useState(null)

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
    temperature: ""
  })

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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    let error = ""
    
    // Required field validation
    const requiredFields = ['firstName', 'lastName', 'mobileNo', 'gender', 'relation', 'dob', 'bloodGroup', 
                           'address1', 'country', 'state', 'district', 'city', 'pinCode', 
                           'hemoglobin', 'weight', 'height', 'bloodPressure', 'pulse', 'temperature']
    
    if (requiredFields.includes(name) && !value.trim()) {
      error = "This field is required"
    }

    // Specific validations
    if (name === "mobileNo" && value && !/^\d{10}$/.test(value)) {
      error = "Mobile number must be 10 digits"
    }

    if (name === "pinCode" && value && !/^\d{6}$/.test(value)) {
      error = "Pin Code must be 6 digits"
    }

    if (name === "bloodPressure" && value && !/^\d{2,3}\/\d{2,3}$/.test(value)) {
      error = "Format: 120/80"
    }

    if ((name === "hemoglobin" || name === "weight" || name === "height" || name === "temperature") && value) {
      const numValue = parseFloat(value)
      if (isNaN(numValue)) {
        error = "Must be a number"
      }
    }

    setErrors(prev => ({
      ...prev,
      [name]: error
    }))
  }

  const fetchGenderData = async () => {
    setLoading(true)
    try {
      const data = await getRequest("/api/master/gender/getAll/1")
      if (data.status === 200) {
        setGenderData(data.response || [])
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRelationData = async () => {
    setLoading(true)
    try {
      const data = await getRequest("/api/master/relation/getAll/1")
      if (data.status === 200) {
        setRelationData(data.response || [])
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBloodGroupData = async () => {
    setLoading(true)
    try {
      const data = await getRequest("/api/master/blood-group/getAll/1")
      if (data.status === 200) {
        setBloodGroupData(data.response || [])
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCountryData = async () => {
    setLoading(true)
    try {
      const data = await getRequest("/api/master/country/getAll/1")
      if (data.status === 200) {
        setCountryData(data.response || [])
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStates = async (countryId) => {
    try {
      const data = await getRequest(`/api/master/state/getByCountryId/${countryId}`)
      if (data.status === 200) {
        setStateData(data.response || [])
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const fetchDistrict = async (stateId) => {
    try {
      const data = await getRequest(`/api/master/district/getByState/${stateId}`)
      if (data.status === 200) {
        setDistrictData(data.response || [])
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  useEffect(() => {
    fetchGenderData()
    fetchRelationData()
    fetchBloodGroupData()
    fetchCountryData()
  }, [])

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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      showPopup("Please fill all mandatory fields", "warning")
      return
    }

    try {
      setLoading(true)
      
      const donorData = {
        donorFn: formData.firstName,
        donorMn: formData.middleName,
        donorLn: formData.lastName,
        donorMobileNumber: formData.mobileNo,
        donorGenderId: formData.gender,
        donorRelationId: formData.relation,
        donorDob: formData.dob,
        donorBloodGroupId: formData.bloodGroup,
        donorAddress1: formData.address1,
        donorAddress2: formData.address2,
        donorCountryId: formData.country,
        donorStateId: formData.state,
        donorDistrictId: formData.district,
        donorCity: formData.city,
        donorPincode: formData.pinCode,
        hemoglobin: parseFloat(formData.hemoglobin),
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        bloodPressure: formData.bloodPressure,
        pulse: parseInt(formData.pulse),
        temperature: parseFloat(formData.temperature),
        regDate: new Date().toISOString().split("T")[0]
      }

      const result = await postRequest("/donor/register", { donor: donorData })
      
      if (result.status === 200) {
        showPopup("Donor registered successfully!", "success", handleReset)
      } else {
        showPopup(result.message || "Registration failed", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showPopup("An error occurred", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
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
      temperature: ""
    })
    setErrors({})
    setStateData([])
    setDistrictData([])
  }

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div className="body d-flex py-3">
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}

      <div className="container-xxl">
        <div className="row align-items-center">
          <div className="border-0 mb-4">
            <div className="card-header py-3 no-bg bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap">
              <h3 className="fw-bold mb-0">Donor Information</h3>
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
                      onChange={(e) => {
                        handleChange(e)
                        fetchStates(e.target.value)
                      }}
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
                      onChange={(e) => {
                        handleChange(e)
                        fetchDistrict(e.target.value)
                      }}
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

        {/* Buttons */}
        <div className="row mb-3">
          <div className="col-sm-12">
            <div className="card shadow mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="fa fa-save me-2"></i>
                        Register Donor
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleReset}
                    disabled={loading}
                  >
                    <i className="fa fa-refresh me-2"></i>
                    Reset
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

export default DonorRegistration