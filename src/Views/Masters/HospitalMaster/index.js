import { useEffect, useState } from "react"
import LoadingScreen from "../../../Components/Loading"
import Popup from "../../../Components/popup"
import { MAS_COUNTRY, MAS_DISTRICT, MAS_HOSPITAL, MAS_STATE } from "../../../config/apiConfig"
import { getRequest, postRequest, putRequest } from "../../../service/apiService"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination"

const HospitalMaster = () => {
  const [hospitals, setHospitals] = useState([])
  const [countries, setCountries] = useState([])
  const [states, setStates] = useState([])
  const [districts, setDistricts] = useState([])
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, hospitalId: null, newStatus: false })
  const [formData, setFormData] = useState({
    hospitalCode: "",
    hospitalName: "",
    address: "",
    country: "",
    countryId: "",
    state: "",
    stateId: "",
    district: "",
    districtId: "",
    city: "",
    pincode: "",
    contactNumber1: "",
    contactNumber2: "",
    email: "",
    regCostApplicable: "",
    appCostApplicable: "",
    preConsultationAvailable: "",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)
  const [editingHospital, setEditingHospital] = useState(null)
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filteredStates, setFilteredStates] = useState([])
  const [filteredDistricts, setFilteredDistricts] = useState([])

  const HOSPITAL_CODE_MAX_LENGTH = 8
  const HOSPITAL_NAME_MAX_LENGTH = 30
  const ADDRESS_MAX_LENGTH = 50
  const PINCODE_MAX_LENGTH = 10
  const CONTACT_NUMBER_MAX_LENGTH = 10
  const EMAIL_MAX_LENGTH = 50

  useEffect(() => {
    fetchHospitals(0)
    fetchCountries(1)
  }, [])

  const fetchHospitals = async (flag = 0) => {
    try {
      setLoading(true)
      const response = await getRequest(`${MAS_HOSPITAL}/getAll/${flag}`)
      if (response && response.response) {
        setHospitals(response.response)
      }
    } catch (err) {
      console.error("Error fetching hospitals:", err)
      showPopup("Failed to load hospitals", "error")
    } finally {
      setLoading(false)
    }
  }

  const fetchCountries = async (flag = 1) => {
    try {
      const response = await getRequest(`${MAS_COUNTRY}/getAll/${flag}`)
      if (response && response.response) {
        setCountries(response.response)
      }
    } catch (err) {
      console.error("Error fetching countries:", err)
      showPopup("Failed to load countries", "error")
    }
  }

  const fetchStatesByCountryId = async (countryId) => {
    try {
      setLoading(true)
      const response = await getRequest(`${MAS_STATE}/getByCountryId/${countryId}`)
      if (response && response.response) {
        setFilteredStates(response.response)
      } else {
        console.error("Unexpected API response format:", response)
        setFilteredStates([])
      }
    } catch (err) {
      console.error("Error fetching states by country:", err)
      showPopup("Failed to load states for selected country", "error")
      setFilteredStates([])
    } finally {
      setLoading(false)
    }
  }

  const fetchDistrictsByStateId = async (stateId) => {
    try {
      setLoading(true)
      const response = await getRequest(`${MAS_DISTRICT}/getByState/${stateId}`)
      if (response && response.response) {
        setFilteredDistricts(response.response)
      } else {
        console.error("Unexpected API response format:", response)
        setFilteredDistricts([])
      }
    } catch (err) {
      console.error("Error fetching districts by state:", err)
      showPopup("Failed to load districts for selected state", "error")
      setFilteredDistricts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const handleRefresh = () => {
    setSearchQuery("")
    setCurrentPage(1)
    fetchHospitals()
  }

  const filteredHospitals = hospitals.filter(hospital =>
    hospital.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hospital.hospitalCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hospital.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hospital.stateName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE
  const currentItems = filteredHospitals.slice(indexOfFirst, indexOfLast)

  const handleCountryChange = (e) => {
    const selectedIndex = e.target.selectedIndex
    const selectedOption = e.target.options[selectedIndex]
    const countryId = Number.parseInt(selectedOption.getAttribute("data-id"), 10)

    setFormData((prev) => ({
      ...prev,
      country: e.target.value,
      countryId: isNaN(countryId) ? null : countryId,
      state: "",
      stateId: "",
      district: "",
      districtId: "",
    }))

    if (!isNaN(countryId)) {
      fetchStatesByCountryId(countryId)
    }
  }

  const handleStateChange = (e) => {
    const selectedIndex = e.target.selectedIndex
    const selectedOption = e.target.options[selectedIndex]
    const stateId = Number.parseInt(selectedOption.getAttribute("data-id"), 10)

    setFormData((prev) => ({
      ...prev,
      state: e.target.value,
      stateId: isNaN(stateId) ? null : stateId,
      district: "",
      districtId: "",
    }))

    if (!isNaN(stateId)) {
      fetchDistrictsByStateId(stateId)
    }
  }

  const handleDistrictChange = (e) => {
    const selectedIndex = e.target.selectedIndex
    const selectedOption = e.target.options[selectedIndex]
    const districtId = Number.parseInt(selectedOption.getAttribute("data-id"), 10)

    setFormData((prev) => ({
      ...prev,
      district: e.target.value,
      districtId: isNaN(districtId) ? null : districtId,
    }))
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target

    setFormData((prevData) => {
      const updatedFormData = {
        ...prevData,
        [name]: value,
      }

      const isValid =
        (updatedFormData.hospitalCode || "").trim() !== "" &&
        (updatedFormData.hospitalName || "").trim() !== "" &&
        (updatedFormData.address || "").trim() !== "" &&
        (updatedFormData.countryId || "") !== "" &&
        (updatedFormData.stateId || "") !== "" &&
        (updatedFormData.city || "").trim() !== "" &&
        (updatedFormData.regCostApplicable || "").trim() !== "" &&
        (updatedFormData.appCostApplicable || "").trim() !== "" &&
        (updatedFormData.preConsultationAvailable || "").trim() !== ""

      setIsFormValid(isValid)
      return updatedFormData
    })
  }

  const handleEdit = (hospital) => {
    const regCostValue = hospital.regCostApplicable === "y" ? "Yes" : "No"
    const appCostValue = hospital.appCostApplicable === "y" ? "Yes" : "No"
    const preConsultationValue = hospital.preConsultationAvailable === "y" ? "Yes" : "No"

    setEditingHospital(hospital)

    setFormData({
      hospitalCode: hospital.hospitalCode,
      hospitalName: hospital.hospitalName,
      address: hospital.address,
      country: hospital.countryName,
      countryId: hospital.countryId,
      state: hospital.stateName,
      stateId: hospital.stateId,
      district: hospital.districtName,
      districtId: hospital.districtId,
      city: hospital.city,
      pincode: hospital.pincode,
      contactNumber1: hospital.contactNumber1,
      contactNumber2: hospital.contactNumber2,
      email: hospital.email,
      regCostApplicable: regCostValue,
      appCostApplicable: appCostValue,
      preConsultationAvailable: preConsultationValue,
    })

    if (hospital.countryId) {
      fetchStatesByCountryId(hospital.countryId)
    }
    if (hospital.stateId) {
      fetchDistrictsByStateId(hospital.stateId)
    }

    setIsFormValid(true)
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!isFormValid) return

    try {
      setLoading(true)

      const isDuplicate = hospitals.some(
        (hospital) =>
          hospital.id !== (editingHospital ? editingHospital.id : null) &&
          (hospital.hospitalCode === formData.hospitalCode ||
            hospital.hospitalName === formData.hospitalName ||
            hospital.email === formData.email),
      )

      if (isDuplicate) {
        showPopup("Hospital with the same code or name already exists!", "error")
        setLoading(false)
        return
      }

      const regCostValue = formData.regCostApplicable === "Yes" ? "y" : "n"
      const appCostValue = formData.appCostApplicable === "Yes" ? "y" : "n"
      const preConsultationValue = formData.preConsultationAvailable === "Yes" ? "y" : "n"

      if (editingHospital) {
        const response = await putRequest(`${MAS_HOSPITAL}/updateById/${editingHospital.id}`, {
          hospitalCode: formData.hospitalCode,
          hospitalName: formData.hospitalName,
          address: formData.address,
          countryId: formData.countryId,
          stateId: formData.stateId,
          districtId: formData.districtId,
          city: formData.city,
          pincode: formData.pincode,
          contactNumber1: formData.contactNumber1,
          contactNumber2: formData.contactNumber2,
          email: formData.email,
          regCostApplicable: regCostValue,
          appCostApplicable: appCostValue,
          preConsultationAvailable: preConsultationValue,
          status: editingHospital.status,
        })

        if (response && response.response) {
          setHospitals((prevData) =>
            prevData.map((hospital) => (hospital.id === editingHospital.id ? response.response : hospital)),
          )
          showPopup("Hospital updated successfully!", "success")
        }
      } else {
        const response = await postRequest(`${MAS_HOSPITAL}/create`, {
          hospitalCode: formData.hospitalCode,
          hospitalName: formData.hospitalName,
          address: formData.address,
          countryId: formData.countryId,
          stateId: formData.stateId,
          districtId: formData.districtId,
          city: formData.city,
          pincode: formData.pincode,
          contactNumber1: formData.contactNumber1,
          contactNumber2: formData.contactNumber2,
          email: formData.email,
          regCostApplicable: regCostValue,
          appCostApplicable: appCostValue,
          preConsultationAvailable: preConsultationValue,
          status: "y",
        })

        if (response && response.response) {
          setHospitals([...hospitals, response.response])
          showPopup("New hospital added successfully!", "success")
        }
      }

      setEditingHospital(null)
      setFormData({
        hospitalCode: "",
        hospitalName: "",
        address: "",
        country: "",
        countryId: "",
        state: "",
        stateId: "",
        district: "",
        districtId: "",
        city: "",
        pincode: "",
        contactNumber1: "",
        contactNumber2: "",
        email: "",
        regCostApplicable: "",
        appCostApplicable: "",
        preConsultationAvailable: "",
      })
      setShowForm(false)
      fetchHospitals()
    } catch (err) {
      console.error("Error saving hospital:", err)
      showPopup(`Failed to save changes: ${err.response?.data?.message || err.message}`, "error")
    } finally {
      setLoading(false)
    }
  }

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
      },
    })
  }

  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, hospitalId: id, newStatus })
  }

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.hospitalId !== null) {
      try {
        setLoading(true)
        const status = confirmDialog.newStatus
        const response = await putRequest(`${MAS_HOSPITAL}/status/${confirmDialog.hospitalId}?status=${status}`)

        if (response && response.status === 200) {
          setHospitals((prevData) =>
            prevData.map((hospital) =>
              hospital.id === confirmDialog.hospitalId ? { ...hospital, status: confirmDialog.newStatus } : hospital,
            ),
          )
          showPopup(
            `Hospital ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
            "success",
          )
        }
      } catch (err) {
        console.error("Error updating hospital status:", err)
        showPopup(`Failed to update status: ${err.response?.data?.message || err.message}`, "error")
      } finally {
        setLoading(false)
      }
    }
    setConfirmDialog({ isOpen: false, hospitalId: null, newStatus: null })
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Hospital Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm ? (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search"
                        aria-label="Search"
                        value={searchQuery}
                        onChange={handleSearchChange}
                      />
                      <span className="input-group-text" id="search-icon">
                        <i className="fa fa-search"></i>
                      </span>
                    </div>
                  </form>
                ) : (
                  <></>
                )}

                <div className="d-flex align-items-center">
                  {!showForm ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={() => {
                          setEditingHospital(null);
                          setFormData({
                            hospitalCode: "",
                            hospitalName: "",
                            address: "",
                            country: "",
                            countryId: "",
                            state: "",
                            stateId: "",
                            district: "",
                            districtId: "",
                            city: "",
                            pincode: "",
                            contactNumber1: "",
                            contactNumber2: "",
                            email: "",
                            regCostApplicable: "",
                            appCostApplicable: "",
                            preConsultationAvailable: "",
                          });
                          setIsFormValid(false);
                          setShowForm(true);
                        }}
                      >
                        <i className="mdi mdi-plus"></i> Add
                      </button>
                      <button
                        type="button"
                        className="btn btn-success me-2 flex-shrink-0"
                        onClick={handleRefresh}
                      >
                        <i className="mdi mdi-refresh"></i> Show All
                      </button>
                      <button type="button" className="btn btn-success d-flex align-items-center">
                        <i className="mdi mdi-file-export d-sm-inlined-sm-inline ms-1"></i> Generate Report
                      </button>
                    </>
                  ) : (
                    <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                      <i className="mdi mdi-arrow-left"></i> Back
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <LoadingScreen />
              ) : !showForm ? (
                <>
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Hospital Code</th>
                          <th>Hospital Name</th>
                          <th>State</th>
                          <th>City</th>
                          <th>Registration Cost</th>
                          <th>Appointment Cost</th>
                          <th>Pre Consultation</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((hospital) => (
                            <tr key={hospital.id}>
                              <td>{hospital.hospitalCode}</td>
                              <td>{hospital.hospitalName}</td>
                              <td>{hospital.stateName}</td>
                              <td>{hospital.city}</td>
                              <td>{hospital.regCostApplicable === "y" ? "Yes" : "No"}</td>
                              <td>{hospital.appCostApplicable === "y" ? "Yes" : "No"}</td>
                              <td>{hospital.preConsultationAvailable === "y" ? "Yes" : "No"}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={hospital.status === "y"}
                                    onChange={() => handleSwitchChange(hospital.id, hospital.status === "y" ? "n" : "y")}
                                    id={`switch-${hospital.id}`}
                                  />
                                  <label className="form-check-label px-0" htmlFor={`switch-${hospital.id}`}>
                                    {hospital.status === "y" ? "Active" : "Deactivated"}
                                  </label>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(hospital)}
                                  disabled={hospital.status !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={9} className="text-center">
                              No hospitals found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* PAGINATION USING REUSABLE COMPONENT */}
                  {filteredHospitals.length > 0 && (
                    <Pagination
                      totalItems={filteredHospitals.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="card-body">
                    <div className="row g-3 align-items-center">
                      <div className="col-md-6">
                        <label htmlFor="hospitalCode" className="form-label">
                          Hospital Code <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="hospitalCode"
                          name="hospitalCode"
                          value={formData.hospitalCode}
                          onChange={handleInputChange}
                          placeholder="Enter hospital code"
                          maxLength={HOSPITAL_CODE_MAX_LENGTH}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="hospitalName" className="form-label">
                          Hospital Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="hospitalName"
                          name="hospitalName"
                          value={formData.hospitalName}
                          onChange={handleInputChange}
                          placeholder="Enter hospital name"
                          maxLength={HOSPITAL_NAME_MAX_LENGTH}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="address" className="form-label">
                          Address <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Enter address"
                          maxLength={ADDRESS_MAX_LENGTH}
                          required
                        />
                      </div>
                      {/* Country Select */}
                      <div className="col-md-6">
                        <label htmlFor="country" className="form-label">
                          Country <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleCountryChange}
                          required
                        >
                          <option value="">Select Country</option>
                          {countries.map((country) => (
                            <option key={country.id} value={country.countryName} data-id={country.id}>
                              {country.countryName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* State Select */}
                      <div className="col-md-6">
                        <label htmlFor="state" className="form-label">
                          State <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleStateChange}
                          required
                        >
                          <option value="">Select State</option>
                          {filteredStates.map((state) => (
                            <option key={state.id} value={state.stateName} data-id={state.id}>
                              {state.stateName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* District Select */}
                      <div className="col-md-6">
                        <label htmlFor="district" className="form-label">
                          District
                        </label>
                        <select
                          className="form-select"
                          id="district"
                          name="district"
                          value={formData.district}
                          onChange={handleDistrictChange}
                        >
                          <option value="">Select District</option>
                          {filteredDistricts.map((district) => (
                            <option key={district.id} value={district.districtName} data-id={district.id}>
                              {district.districtName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label htmlFor="city" className="form-label">
                          City <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="Enter city"
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="pincode" className="form-label">
                          Pin Code
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="pincode"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleInputChange}
                          placeholder="Enter pincode"
                          maxLength={PINCODE_MAX_LENGTH}
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="contactNumber1" className="form-label">
                          Contact Number 1
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="contactNumber1"
                          name="contactNumber1"
                          value={formData.contactNumber1}
                          onChange={handleInputChange}
                          placeholder="Enter contact number"
                          maxLength={CONTACT_NUMBER_MAX_LENGTH}
                          onInput={(e) => (e.target.value = e.target.value.replace(/\D/g, ""))}
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="contactNumber2" className="form-label">
                          Contact Number 2
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="contactNumber2"
                          name="contactNumber2"
                          value={formData.contactNumber2}
                          onChange={handleInputChange}
                          placeholder="Enter alternate contact number"
                          maxLength={CONTACT_NUMBER_MAX_LENGTH}
                          onInput={(e) => (e.target.value = e.target.value.replace(/\D/g, ""))}
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="email" className="form-label">
                          Email
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Enter email address"
                          maxLength={EMAIL_MAX_LENGTH}
                        />
                      </div>
                      {/* Registration Cost */}
                      <div className="col-md-6">
                        <label htmlFor="regCostApplicable" className="form-label">
                          Registration Cost <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-control"
                          id="regCostApplicable"
                          name="regCostApplicable"
                          value={formData.regCostApplicable}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label htmlFor="appCostApplicable" className="form-label">
                          Appointment Cost <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-control"
                          id="appCostApplicable"
                          name="appCostApplicable"
                          value={formData.appCostApplicable}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="preConsultationAvailable" className="form-label">
                          Pre-Consultation Available <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-control"
                          id="preConsultationAvailable"
                          name="preConsultationAvailable"
                          value={formData.preConsultationAvailable}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>
                    <div className="d-flex justify-content-end mt-4">
                      <button type="button" className="btn btn-secondary me-2" onClick={() => setShowForm(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-success" disabled={!isFormValid}>
                        {editingHospital ? "Update" : "Save"}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      {popupMessage && <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />}
      {confirmDialog.isOpen && (
        <div className="modal d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Status Change</h5>
                <button type="button" className="close" onClick={() => handleConfirm(false)}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                  <strong>
                    {hospitals.find((hospital) => hospital.id === confirmDialog.hospitalId)?.hospitalName}
                  </strong>
                  ?
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>
                  No
                </button>
                <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>
                  Yes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HospitalMaster