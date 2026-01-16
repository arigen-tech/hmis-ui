import { useState } from "react"
import Popup from "../../../Components/popup"
import Pagination from "../../../Components/Pagination"
import MasPreparationModel from "../../Masters/InvestigationMaster/Masprep/masprep"

const RadiologyInvestigationMaster = () => {
  const [investigations, setInvestigations] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedInvestigation, setSelectedInvestigation] = useState(null)
  const [showPreparationModal, setShowPreparationModal] = useState(false)
  
  const [formData, setFormData] = useState({
    investigationName: "",
    departmentId: "",
    departmentName: "",
    modalityId: "",
    modalityName: "",
    contrastRequired: "Select",
    resultType: "Select",
    preparationRequired: "",
    turnaroundTime: "",
    estimatedDays: "",
    confidential: false,
    status: "n",
  })
  
  const [dropdownOptions, setDropdownOptions] = useState({
    departments: [],
    modalities: [],
  })
  
  const [popupMessage, setPopupMessage] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    investigationId: null,
    newStatus: null,
  })

  // Mock data for dropdowns
  const mockDepartments = [
    { id: 1, name: "Radiology" },
    { id: 2, name: "CT Scan" },
    { id: 3, name: "MRI" },
    { id: 4, name: "X-Ray" },
    { id: 5, name: "Ultrasound" },
  ]

  const mockModalities = [
    { id: 1, name: "CT" },
    { id: 2, name: "MRI" },
    { id: 3, name: "X-Ray" },
    { id: 4, name: "Ultrasound" },
    { id: 5, name: "Mammography" },
  ]

  // Mock data for table - INCLUDING PATIENT READY
  const mockInvestigations = [
    {
      id: 1,
      investigationName: "CT Brain",
      modalityName: "CT",
      contrastRequired: "No",
      turnaroundTime: "2",
      estimatedDays: "1",
      patientReady: "Same Day",
      status: "y"
    },
    {
      id: 2,
      investigationName: "MRI Spine",
      modalityName: "MRI",
      contrastRequired: "Yes",
      turnaroundTime: "24",
      estimatedDays: "2",
      patientReady: "Next Day",
      status: "y"
    },
    {
      id: 3,
      investigationName: "X-Ray Chest",
      modalityName: "X-Ray",
      contrastRequired: "No",
      turnaroundTime: "1",
      estimatedDays: "1",
      patientReady: "Same Day",
      status: "n"
    },
    {
      id: 4,
      investigationName: "Ultrasound Abdomen",
      modalityName: "Ultrasound",
      contrastRequired: "No",
      turnaroundTime: "4",
      estimatedDays: "1",
      patientReady: "Same Day",
      status: "y"
    },
    {
      id: 5,
      investigationName: "CT Angiography",
      modalityName: "CT",
      contrastRequired: "Yes",
      turnaroundTime: "6",
      estimatedDays: "2",
      patientReady: "2 Days",
      status: "y"
    },
    {
      id: 6,
      investigationName: "MRI Brain with Contrast",
      modalityName: "MRI",
      contrastRequired: "Yes",
      turnaroundTime: "12",
      estimatedDays: "2",
      patientReady: "Next Day",
      status: "y"
    },
    {
      id: 7,
      investigationName: "Mammography",
      modalityName: "Mammography",
      contrastRequired: "No",
      turnaroundTime: "3",
      estimatedDays: "1",
      patientReady: "Same Day",
      status: "y"
    },
  ]

  // Initialize with mock data
  useState(() => {
    setDropdownOptions({
      departments: mockDepartments,
      modalities: mockModalities,
    })
    setInvestigations(mockInvestigations)
  }, [])

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => setPopupMessage(null),
    })
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleRefresh = () => {
    setSearchQuery("")
    setCurrentPage(1)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleReset = () => {
    setFormData({
      investigationName: "",
      departmentId: "",
      departmentName: "",
      modalityId: "",
      modalityName: "",
      contrastRequired: "Select",
      resultType: "Select",
      preparationRequired: "",
      turnaroundTime: "",
      estimatedDays: "",
      confidential: false,
      status: "n",
    })
    setSelectedInvestigation(null)
  }

  const handleStatusToggle = (id) => {
    const investigation = investigations.find((item) => item.id === id)
    if (investigation) {
      const newStatus = investigation.status === "y" ? "n" : "y"
      setConfirmDialog({ isOpen: true, investigationId: id, newStatus })
    }
  }

  const handleConfirm = (confirmed) => {
    if (confirmed && confirmDialog.investigationId !== null) {
      // Update local state only
      const updatedInvestigations = investigations.map((item) => {
        if (item.id === confirmDialog.investigationId) {
          return { ...item, status: confirmDialog.newStatus }
        }
        return item
      })

      setInvestigations(updatedInvestigations)

      // Update the selected investigation and form data if it's currently selected
      if (selectedInvestigation && selectedInvestigation.id === confirmDialog.investigationId) {
        setSelectedInvestigation({ ...selectedInvestigation, status: confirmDialog.newStatus })
        setFormData({ ...formData, status: confirmDialog.newStatus })
      }

      showPopup(
        `Investigation ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
        "success",
      )
    }
    setConfirmDialog({ isOpen: false, investigationId: null, newStatus: null })
  }

  const handleRowClick = (investigation) => {
    setSelectedInvestigation(investigation)
    setFormData({
      investigationName: investigation.investigationName || "",
      departmentId: investigation.departmentId || "",
      departmentName: investigation.departmentName || "",
      modalityId: investigation.modalityId || "",
      modalityName: investigation.modalityName || "",
      contrastRequired: investigation.contrastRequired || "Select",
      resultType: investigation.resultType || "Select",
      preparationRequired: investigation.preparationRequired || "",
      turnaroundTime: investigation.turnaroundTime || "",
      estimatedDays: investigation.estimatedDays || "",
      confidential: investigation.confidential === true || false,
      status: investigation.status || "n",
    })
  }

  const handleOpenPreparationModal = () => {
    setShowPreparationModal(true)
  }

  const handleClosePreparationModal = () => {
    setShowPreparationModal(false)
  }

  const handlePreparationOk = (data) => {
    if (data && Array.isArray(data)) {
      const concatenatedText = data.map(item => item.preparationText).join('\n')
      setFormData(prev => ({
        ...prev,
        preparationRequired: concatenatedText,
      }))
    }
    setShowPreparationModal(false)
  }

  const handleSubmit = () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    
    // Simulate API call delay
    setTimeout(() => {
      if (selectedInvestigation) {
        showPopup("Investigation updated successfully!", "success")
      } else {
        showPopup("Investigation created successfully!", "success")
        handleReset()
      }
      setLoading(false)
    }, 1000)
  }

  const validateForm = () => {
    if (!formData.investigationName.trim()) {
      showPopup("Investigation Name is required", "error")
      return false
    }
    if (!formData.departmentId) {
      showPopup("Department is required", "error")
      return false
    }
    if (!formData.modalityId) {
      showPopup("Modality is required", "error")
      return false
    }
    if (formData.contrastRequired === "Select") {
      showPopup("Contrast Required is required", "error")
      return false
    }
    if (formData.resultType === "Select") {
      showPopup("Result Type is required", "error")
      return false
    }
    return true
  }

  const filteredInvestigations = investigations.filter(
    (item) =>
      item.investigationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.modalityName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.contrastRequired?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.patientReady?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const indexOfLast = currentPage * 10 // DEFAULT_ITEMS_PER_PAGE
  const indexOfFirst = indexOfLast - 10
  const currentItems = filteredInvestigations.slice(indexOfFirst, indexOfLast)

  return (
    <div className="content-wrapper">
      {popupMessage && <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />}
      {loading && <div className="loading-overlay">Loading...</div>}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Radiology Investigation Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                <form className="d-inline-block searchform me-4" role="search">
                  <div className="input-group searchinput">
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search "
                      aria-label="Search"
                      value={searchQuery}
                      onChange={handleSearchChange}
                    />
                    <span className="input-group-text" id="search-icon">
                      <i className="fa fa-search"></i>
                    </span>
                  </div>
                </form>

                <div className="d-flex align-items-center">
                  <button
                    type="button"
                    className="btn btn-success me-2"
                    onClick={() => {}}
                  >
                    <i className="mdi mdi-magnify"></i> Search
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
                </div>
              </div>
            </div>
            
            <div className="card-body">
              <div className="table-responsive packagelist">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Investigation Name</th>
                      <th>Modality</th>
                      <th>Contrast Required</th>
                      <th>Turnaround Time (hrs)</th>
                      <th>Patient Ready</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => handleRowClick(item)}
                          className={
                            selectedInvestigation && selectedInvestigation.id === item.id
                              ? "table-primary"
                              : ""
                          }
                          style={{ cursor: "pointer" }}
                        >
                          <td>{item.investigationName}</td>
                          <td>{item.modalityName || "-"}</td>
                          <td>{item.contrastRequired || "-"}</td>
                          <td>{item.turnaroundTime || "-"}</td>
                          <td>{item.patientReady || "-"}</td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={item.status === "y"}
                                onChange={() => handleStatusToggle(item.id)}
                                id={`switch-${item.id}`}
                              />
                              <label className="form-check-label" htmlFor={`switch-${item.id}`}>
                                {item.status === "y" ? "Active" : "Deactivated"}
                              </label>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          {loading ? "Loading..." : "No investigations found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Form Section */}
              <div className="row mb-3 mt-3">
                <div className="col-sm-12">
                  <div className="card shadow mb-3">
                    <div className="card-body">
                      <div className="row g-3 align-items-center">
                        <div className="col-md-4">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-1">
                              Investigation Name<span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              name="investigationName"
                              value={formData.investigationName}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-1">
                              Department<span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
                              name="departmentId"
                              value={formData.departmentId}
                              onChange={handleInputChange}
                            >
                              <option value="">Select Department</option>
                              {dropdownOptions.departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                  {dept.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-1">
                              Modality<span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
                              name="modalityId"
                              value={formData.modalityId}
                              onChange={handleInputChange}
                            >
                              <option value="">Select Modality</option>
                              {dropdownOptions.modalities.map((mod) => (
                                <option key={mod.id} value={mod.id}>
                                  {mod.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-1">
                              Contrast Required<span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
                              name="contrastRequired"
                              value={formData.contrastRequired}
                              onChange={handleInputChange}
                            >
                              <option value="Select">Select</option>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                              <option value="Conditional">Conditional</option>
                            </select>
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-1">
                              Result Type<span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
                              name="resultType"
                              value={formData.resultType}
                              onChange={handleInputChange}
                            >
                              <option value="Select">Select</option>
                              <option value="Single">Single</option>
                              <option value="Multiple">Multiple</option>
                              <option value="Range">Range</option>
                              <option value="Template">Template</option>
                            </select>
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-1">
                              Preparation Required
                            </label>
                            <div className="d-flex align-items-center gap-2">
                              <textarea
                                className="form-control"
                                name="preparationRequired"
                                value={formData.preparationRequired}
                                onChange={handleInputChange}
                                placeholder="Select from preparation list"
                                rows="2"
                              />
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={handleOpenPreparationModal}
                                title="Select Preparation"
                              >
                                <i className="icofont-search"></i>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-1">
                              Turnaround Time (hours)
                            </label>
                            <input
                              type="number"
                              className="form-control"
                              name="turnaroundTime"
                              value={formData.turnaroundTime}
                              onChange={handleInputChange}
                              placeholder="Enter hours"
                              min="0"
                            />
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-1">
                              Estimated Days (days)
                            </label>
                            <input
                              type="number"
                              className="form-control"
                              name="estimatedDays"
                              value={formData.estimatedDays}
                              onChange={handleInputChange}
                              placeholder="Enter days"
                              min="0"
                            />
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="mb-2">
                            <label className="form-label mb-1">Options</label>
                            <div className="form-control d-flex align-items-center">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="confidential"
                                  name="confidential"
                                  checked={formData.confidential}
                                  onChange={handleInputChange}
                                />
                                <label className="form-check-label" htmlFor="confidential">
                                  Confidential
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="col-12 text-end mt-2 mb-3">
                          <button className="btn btn-success me-2" onClick={handleSubmit} disabled={loading}>
                            {loading ? "Saving..." : selectedInvestigation ? "Update" : "Save"}
                          </button>
                          <button className="btn btn-secondary" onClick={handleReset} disabled={loading}>
                            Reset
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmation Modal */}
              {confirmDialog.isOpen && (
                <div
                  className="modal d-block"
                  tabIndex="-1"
                  role="dialog"
                  style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                >
                  <div className="modal-dialog" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button type="button" className="btn-close" onClick={() => handleConfirm(false)}></button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                          <strong>
                            {
                              investigations.find((item) => item.id === confirmDialog.investigationId)
                                ?.investigationName
                            }
                          </strong>
                          ?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>
                          Cancel
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>
                          Confirm
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PAGINATION */}
              {filteredInvestigations.length > 0 && (
                <Pagination
                  totalItems={filteredInvestigations.length}
                  itemsPerPage={10}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <MasPreparationModel
        show={showPreparationModal}
        onClose={handleClosePreparationModal}
        onOk={handlePreparationOk}
        selectedItems={[]}
      />
    </div>
  )
}

export default RadiologyInvestigationMaster