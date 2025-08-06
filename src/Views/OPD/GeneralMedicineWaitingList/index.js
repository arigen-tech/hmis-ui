import { useState } from "react"

const GeneralMedicineWaitingList = () => {
  const [waitingList, setWaitingList] = useState([
    {
      id: 1,
      tokenNo: "GM-1",
      employeeNo: "33503",
      patientName: "BHANUPRAKASH K R",
      relation: "Husband",
      designation: "MEDICAL SUPTD.",
      name: "DR. NIRMALA D",
      age: "47 Years",
      gender: "Male",
      opdType: "Normal OPD",
      priority: "Priority-1",
      status: "waiting",
    },
  ])

  const [searchFilters, setSearchFilters] = useState({
    doctorList: "Dr. G. Pradhan",
    session: "Select",
    employeeNo: "",
    patientName: "",
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const [showDetailView, setShowDetailView] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [expandedSections, setExpandedSections] = useState({
    clinicalHistory: false,
    vitalDetail: false,
    diagnosis: false,
    investigation: false,
    treatment: false,
    minorProcedure: false,
    referral: false,
    followUp: false,
    doctorRemark: false,
  })

  const [selectedHistoryType, setSelectedHistoryType] = useState("")
  const [formData, setFormData] = useState({
    height: "",
    weight: "",
    temperature: "",
    systolicBP: "",
    diastolicBP: "",
    pulse: "",
    bmi: "",
    rr: "",
    spo2: "",
    patientSymptoms: "",
    clinicalExamination: "",
    mlcCase: false,
  })

  const [errors, setErrors] = useState({})

  // Investigation template states
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false)
  const [showUpdateTemplateModal, setShowUpdateTemplateModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState("Select..")
  const [templateName, setTemplateName] = useState("")
  const [investigationItems, setInvestigationItems] = useState([""])
  const [updateTemplateSelection, setUpdateTemplateSelection] = useState("Select..")
  const [templateType, setTemplateType] = useState("");

  // Available templates
  const [templates, setTemplates] = useState([
    "Blood Test Template",
    "Cardiac Template",
    "Diabetes Template"
  ])

  const itemsPerPage = 10

  const handleFilterChange = (field, value) => {
    setSearchFilters((prev) => ({
      ...prev,
      [field]: value,
    }))
    setCurrentPage(1)
  }

  const handleSearch = () => {
    console.log("Searching with filters:", searchFilters)
  }

  const handleReset = () => {
    setSearchFilters({
      doctorList: "Dr. G. Pradhan",
      session: "Select",
      employeeNo: "",
      patientName: "",
    })
    setCurrentPage(1)
  }

  const handleRowClick = (patient) => {
    setSelectedPatient(patient)
    setShowDetailView(true)
  }

  const handleBackToList = () => {
    setShowDetailView(false)
    setSelectedPatient(null)
    setExpandedSections({
      clinicalHistory: false,
      vitalDetail: false,
      diagnosis: false,
      investigation: false,
      treatment: false,
      minorProcedure: false,
      referral: false,
      followUp: false,
      doctorRemark: false,
    })
    setSelectedHistoryType("")
  }

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleHistoryTypeClick = (historyType) => {
    setSelectedHistoryType(historyType)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const handleSubmit = () => { }

  const handleResetForm = () => {
    setFormData({
      height: "",
      weight: "",
      temperature: "",
      systolicBP: "",
      diastolicBP: "",
      pulse: "",
      bmi: "",
      rr: "",
      spo2: "",
      patientSymptoms: "",
      clinicalExamination: "",
      mlcCase: false,
    })
    setErrors({})
  }

  const handleRelease = (patientId) => {
    const updatedList = waitingList.map((patient) =>
      patient.id === patientId ? { ...patient, status: "released" } : patient,
    )
    setWaitingList(updatedList)
  }

  const handleClose = (patientId) => {
    const updatedList = waitingList.filter((patient) => patient.id !== patientId)
    setWaitingList(updatedList)
  }

  // Investigation template functions
  const handleCreateTemplate = () => {
    setShowCreateTemplateModal(true)
    setTemplateName("")
    setInvestigationItems([""])
  }

  const handleUpdateTemplate = () => {
    setShowUpdateTemplateModal(true)
    setUpdateTemplateSelection("Select..")
  }

  const handleAddInvestigationItem = () => {
    setInvestigationItems([...investigationItems, ""])
  }

  const handleRemoveInvestigationItem = (index) => {
    const newItems = investigationItems.filter((_, i) => i !== index)
    setInvestigationItems(newItems)
  }

  const handleInvestigationItemChange = (index, value) => {
    const newItems = [...investigationItems]
    newItems[index] = value
    setInvestigationItems(newItems)
  }

  const handleSaveTemplate = () => {
    if (templateName.trim()) {
      setTemplates([...templates, templateName])
      setShowCreateTemplateModal(false)
      setTemplateName("")
      setInvestigationItems([""])
    }
  }

  const handleResetTemplate = () => {
    setTemplateName("")
    setInvestigationItems([""])
  }

  const handleCloseModal = () => {
    setShowCreateTemplateModal(false)
    setShowUpdateTemplateModal(false)
    setTemplateName("")
    setInvestigationItems([""])
    setUpdateTemplateSelection("Select..")
  }

  const filteredList = waitingList.filter((item) => {
    const matchesEmployee = searchFilters.employeeNo === "" || item.employeeNo.includes(searchFilters.employeeNo)
    const matchesPatient =
      searchFilters.patientName === "" ||
      item.patientName.toLowerCase().includes(searchFilters.patientName.toLowerCase())
    return matchesEmployee && matchesPatient && item.status === "waiting"
  })

  const filteredTotalPages = Math.ceil(filteredList.length / itemsPerPage)
  const currentItems = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
      setCurrentPage(pageNumber)
    }
  }

  const renderPagination = () => {
    const pageNumbers = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(filteredTotalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    if (startPage > 1) {
      pageNumbers.push(1)
      if (startPage > 2) pageNumbers.push("...")
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }

    if (endPage < filteredTotalPages) {
      if (endPage < filteredTotalPages - 1) pageNumbers.push("...")
      pageNumbers.push(filteredTotalPages)
    }

    return pageNumbers.map((number, index) => (
      <li key={index} className={`page-item ${number === currentPage ? "active" : ""}`}>
        {typeof number === "number" ? (
          <button className="page-link" onClick={() => setCurrentPage(number)}>
            {number}
          </button>
        ) : (
          <span className="page-link disabled">{number}</span>
        )}
      </li>
    ))
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Priority-1":
        return "bg-danger text-white"
      case "Priority-2":
        return "bg-warning text-dark"
      case "Priority-3":
        return "bg-success text-white"
      default:
        return "bg-secondary text-white"
    }
  }

  if (showDetailView && selectedPatient) {
    return (
      <div className="content-wrapper">
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="card-title p-2 mb-0">PATIENT CONSULTATION - {selectedPatient.patientName}</h4>
                  <button className="btn btn-secondary" onClick={handleBackToList}>
                    <i className="mdi mdi-arrow-left"></i> Back to List
                  </button>
                </div>
              </div>
              <div className="card-body">
                {/* Clinical History Section */}
                <div className="card mb-3">
                  <div
                    className="card-header py-3 bg-light border-bottom-1 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection("clinicalHistory")}
                  >
                    <h6 className="mb-0 fw-bold">Clinical History</h6>
                    <span style={{ fontSize: "18px" }}>{expandedSections.clinicalHistory ? "−" : "+"}</span>
                  </div>
                  {expandedSections.clinicalHistory && (
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-3">
                          <div className="d-flex flex-column gap-2">
                            <button
                              className={`btn btn-sm ${selectedHistoryType === "previous-visits" ? "btn-primary" : "btn-outline-primary"
                                }`}
                              onClick={() => handleHistoryTypeClick("previous-visits")}
                            >
                              Previous Visits
                            </button>
                            <button
                              className={`btn btn-sm ${selectedHistoryType === "previous-vitals" ? "btn-primary" : "btn-outline-primary"
                                }`}
                              onClick={() => handleHistoryTypeClick("previous-vitals")}
                            >
                              Previous Vitals
                            </button>
                            <button
                              className={`btn btn-sm ${selectedHistoryType === "previous-lab" ? "btn-primary" : "btn-outline-primary"
                                }`}
                              onClick={() => handleHistoryTypeClick("previous-lab")}
                            >
                              Previous Lab Investigation
                            </button>
                            <button
                              className={`btn btn-sm ${selectedHistoryType === "previous-ecg" ? "btn-primary" : "btn-outline-primary"
                                }`}
                              onClick={() => handleHistoryTypeClick("previous-ecg")}
                            >
                              Previous ECG Investigation
                            </button>
                            <button
                              className={`btn btn-sm ${selectedHistoryType === "audit-history" ? "btn-primary" : "btn-outline-primary"
                                }`}
                              onClick={() => handleHistoryTypeClick("audit-history")}
                            >
                              Audit History
                            </button>
                          </div>
                        </div>
                        <div className="col-md-9">
                          {/* Patient Signs & Symptoms and Clinical Examination */}
                          <div className="row">
                            <div className="col-md-6">
                              <label className="form-label fw-bold">
                                Patient signs & symptoms
                                <span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                name="patientSymptoms"
                                value={formData.patientSymptoms}
                                onChange={handleChange}
                                placeholder="Enter symptoms"
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label fw-bold">Clinical Examination</label>
                              <textarea
                                className="form-control"
                                rows="3"
                                name="clinicalExamination"
                                value={formData.clinicalExamination}
                                onChange={handleChange}
                                placeholder="Enter clinical examination details"
                              ></textarea>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Vital Detail Section */}
                <div className="card mb-3">
                  <div
                    className="card-header py-3 bg-light border-bottom-1 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection("vitalDetail")}
                  >
                    <h6 className="mb-0 fw-bold">Vital Detail</h6>
                    <span style={{ fontSize: "18px" }}>{expandedSections.vitalDetail ? "−" : "+"}</span>
                  </div>
                  {expandedSections.vitalDetail && (
                    <div className="card-body">
                      <div className="row g-3 align-items-center">
                        {/* Patient Height */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">
                            Height
                            <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            className={`form-control ${errors.height ? "is-invalid" : ""}`}
                            min={0}
                            placeholder="Height"
                            name="height"
                            value={formData.height}
                            onChange={handleChange}
                          />
                          <span className="input-group-text">cm</span>
                          {errors.height && <div className="invalid-feedback d-block">{errors.height}</div>}
                        </div>

                        {/* Weight */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">
                            Weight
                            <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            className={`form-control ${errors.weight ? "is-invalid" : ""}`}
                            placeholder="Weight"
                            name="weight"
                            value={formData.weight}
                            onChange={handleChange}
                          />
                          <span className="input-group-text">kg</span>
                          {errors.weight && <div className="invalid-feedback d-block">{errors.weight}</div>}
                        </div>

                        {/* Temperature */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">
                            Temperature
                            <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            className={`form-control ${errors.temperature ? "is-invalid" : ""}`}
                            placeholder="Temperature"
                            name="temperature"
                            value={formData.temperature}
                            onChange={handleChange}
                          />
                          <span className="input-group-text">°F</span>
                          {errors.temperature && <div className="invalid-feedback d-block">{errors.temperature}</div>}
                        </div>

                        {/* BP (Systolic / Diastolic) */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">
                            BP
                            <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            className={`form-control ${errors.systolicBP ? "is-invalid" : ""}`}
                            placeholder="Systolic"
                            name="systolicBP"
                            value={formData.systolicBP}
                            onChange={handleChange}
                          />
                          <span className="input-group-text">/</span>
                          {errors.systolicBP && <div className="invalid-feedback d-block">{errors.systolicBP}</div>}
                          <input
                            type="number"
                            min={0}
                            className={`form-control ${errors.diastolicBP ? "is-invalid" : ""}`}
                            placeholder="Diastolic"
                            name="diastolicBP"
                            value={formData.diastolicBP}
                            onChange={handleChange}
                          />
                          <span className="input-group-text">mmHg</span>
                          {errors.diastolicBP && <div className="invalid-feedback d-block">{errors.diastolicBP}</div>}
                        </div>

                        {/* Pulse */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">
                            Pulse
                            <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            className={`form-control ${errors.pulse ? "is-invalid" : ""}`}
                            placeholder="Pulse"
                            name="pulse"
                            value={formData.pulse}
                            onChange={handleChange}
                          />
                          <span className="input-group-text">/min</span>
                          {errors.pulse && <div className="invalid-feedback d-block">{errors.pulse}</div>}
                        </div>

                        {/* BMI */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">BMI</label>
                          <input
                            type="number"
                            min={0}
                            className={`form-control ${errors.bmi ? "is-invalid" : ""}`}
                            placeholder="BMI"
                            name="bmi"
                            value={formData.bmi}
                            onChange={handleChange}
                          />
                          <span className="input-group-text">kg/m²</span>
                          {errors.bmi && <div className="invalid-feedback d-block">{errors.bmi}</div>}
                        </div>

                        {/* RR */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">RR</label>
                          <input
                            type="number"
                            min={0}
                            className={`form-control ${errors.rr ? "is-invalid" : ""}`}
                            placeholder="RR"
                            name="rr"
                            value={formData.rr}
                            onChange={handleChange}
                          />
                          <span className="input-group-text">/min</span>
                          {errors.rr && <div className="invalid-feedback d-block">{errors.rr}</div>}
                        </div>

                        {/* SpO2 */}
                        <div className="col-md-4 d-flex">
                          <label className="form-label me-2">SpO2</label>
                          <input
                            type="number"
                            min={0}
                            className={`form-control ${errors.spo2 ? "is-invalid" : ""}`}
                            placeholder="SpO2"
                            name="spo2"
                            value={formData.spo2}
                            onChange={handleChange}
                          />
                          <span className="input-group-text">%</span>
                          {errors.spo2 && <div className="invalid-feedback d-block">{errors.spo2}</div>}
                        </div>
                      </div>
                      <div className="row mt-3">
                        <div className="col-12">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              name="mlcCase"
                              checked={formData.mlcCase}
                              onChange={handleChange}
                            />
                            <label className="form-check-label">Mark as MLC Case</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Diagnosis Section */}
                <div className="card mb-3">
                  <div
                    className="card-header py-3 bg-light border-bottom-1 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection("diagnosis")}
                  >
                    <h6 className="mb-0 fw-bold">Diagnosis</h6>
                    <span style={{ fontSize: "18px" }}>{expandedSections.diagnosis ? "−" : "+"}</span>
                  </div>
                  {expandedSections.diagnosis && (
                    <div className="card-body">
                      <p>Content for diagnosis section will be implemented here.</p>
                    </div>
                  )}
                </div>

                {/* Investigation Section */}
                <div className="card mb-3">
                  <div
                    className="card-header py-3 bg-light border-bottom-1 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection("investigation")}
                  >
                    <h6 className="mb-0 fw-bold">Investigation</h6>
                    <span style={{ fontSize: "18px" }}>{expandedSections.investigation ? "−" : "+"}</span>
                  </div>
                  {expandedSections.investigation && (
                    <div className="card-body">
                      {/* Template Section */}
                      <div className="row mb-3 align-items-center">
                        <div className="col-md-2">
                          <label className="form-label fw-bold">Template</label>
                        </div>
                        <div className="col-md-4">
                          <select
                            className="form-select"
                            value={selectedTemplate}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                          >
                            <option value="Select..">Select..</option>
                            {templates.map((template, index) => (
                              <option key={index} value={template}>
                                {template}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-6">
                          <button className="btn btn-primary me-2" onClick={handleCreateTemplate}>
                            Create Template
                          </button>
                          <button className="btn btn-primary" onClick={handleUpdateTemplate}>
                            Update Template
                          </button>
                        </div>
                      </div>

                      {/* Lab Radio Button */}
                      <div className="row mb-3">
                        <div className="col-12">
                          <div className="form-check">
                            <input className="form-check-input" type="radio" name="investigationType" id="lab" defaultChecked />
                            <label className="form-check-label text-primary fw-bold" htmlFor="lab">
                              Lab
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Show Recommended Investigation Link */}
                      <div className="row mb-3">
                        <div className="col-12">
                          <a href="#" className="text-primary text-decoration-underline">
                            Show Recommended Investigation
                          </a>
                        </div>
                      </div>

                      {/* Investigation Table */}
                      <div className="table-responsive">
                        <table className="table table-bordered">
                          <thead style={{ backgroundColor: "#b0c4de" }}>
                            <tr>
                              <th style={{ width: "70%" }}>Investigation</th>
                              <th style={{ width: "15%" }}>Add</th>
                              <th style={{ width: "15%" }}>Delete</th>
                            </tr>
                          </thead>
                          <tbody>
                            {investigationItems.map((item, index) => (
                              <tr key={index}>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control border-0"
                                    value={item}
                                    onChange={(e) => handleInvestigationItemChange(index, e.target.value)}
                                    placeholder="Enter investigation"
                                  />
                                </td>
                                <td className="text-center">
                                  <button
                                    className="btn btn-sm text-white"
                                    style={{ backgroundColor: "#ff6b35" }}
                                    onClick={handleAddInvestigationItem}
                                  >
                                    +
                                  </button>
                                </td>
                                <td className="text-center">
                                  <button
                                    className="btn btn-sm text-white"
                                    style={{ backgroundColor: "#dc3545" }}
                                    onClick={() => handleRemoveInvestigationItem(index)}
                                    disabled={investigationItems.length === 1}
                                  >
                                    −
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Other Expandable Sections */}
                {["treatment", "minorProcedure", "referral", "followUp", "doctorRemark"].map((section) => (
                  <div key={section} className="card mb-3">
                    <div
                      className="card-header py-3 bg-light border-bottom-1 d-flex justify-content-between align-items-center"
                      style={{ cursor: "pointer" }}
                      onClick={() => toggleSection(section)}
                    >
                      <h6 className="mb-0 fw-bold">
                        {section.charAt(0).toUpperCase() + section.slice(1).replace(/([A-Z])/g, " $1")}
                      </h6>
                      <span style={{ fontSize: "18px" }}>{expandedSections[section] ? "−" : "+"}</span>
                    </div>
                    {expandedSections[section] && (
                      <div className="card-body">
                        <p>Content for {section} section will be implemented here.</p>
                      </div>
                    )}
                  </div>
                ))}

                {/* Action Buttons */}
                <div className="text-center mt-4">
                  <button className="btn btn-primary me-3" onClick={handleSubmit}>
                    <i className="mdi mdi-content-save"></i> SUBMIT
                  </button>
                  <button className="btn btn-secondary me-3" onClick={handleResetForm}>
                    <i className="mdi mdi-refresh"></i> RESET
                  </button>
                  <button className="btn btn-secondary" onClick={handleBackToList}>
                    <i className="mdi mdi-arrow-left"></i> BACK
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Create Template Modal */}
        {showCreateTemplateModal && (
          <div className="modal d-block" >
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header" >
                  <h5 className="modal-title">Investigation Template</h5>
                  <button type="button" className="btn-close btn-close" onClick={handleCloseModal}></button>
                </div>
                <div className="modal-body">
                  {/* Template Name */}
                  <div className="row mb-3">
                    <div className="col-md-3">
                      <label className="form-label fw-bold">
                        Template Name<span className="text-danger">*</span>
                      </label>
                    </div>
                    <div className="col-md-9">
                      <input
                        type="text"
                        className="form-control"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Enter template name"
                      />
                    </div>
                  </div>

                  {/* Lab Radio Button */}
                  <div className="row mb-3">
                    <div className="col-12">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          id="templateLab"
                          name="templateType"
                          checked={templateType === "lab"}
                          onChange={() => setTemplateType(templateType === "lab" ? "" : "lab")} // Toggle logic
                        />
                        <label className="form-check-label" htmlFor="templateLab">
                          Lab
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Investigation Table */}
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <thead >
                        <tr>
                          <th>Investigation</th>
                          <th>Add</th>
                          <th>Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {investigationItems.map((item, index) => (
                          <tr key={index}>
                            <td>
                              <input
                                type="text"
                                className="form-control border-0"
                                value={item}
                                onChange={(e) => handleInvestigationItemChange(index, e.target.value)}
                                placeholder="Enter investigation"
                              />
                            </td>
                            <td className="text-center">
                              <button
                                className="btn btn-sm btn-success"
                                onClick={handleAddInvestigationItem}
                              >
                                +
                              </button>
                            </td>
                            <td className="text-center">
                              <button
                                className="btn btn-sm btn-danger"

                                onClick={() => handleRemoveInvestigationItem(index)}
                                disabled={investigationItems.length === 1}
                              >
                                −
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn text-white" onClick={handleSaveTemplate}>
                    Save
                  </button>
                  <button className="btn btn-secondary" onClick={handleResetTemplate}>
                    Reset
                  </button>
                  <button className="btn btn-secondary" onClick={handleCloseModal}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Update Template Modal */}
        {showUpdateTemplateModal && (
          <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header text-white" style={{ backgroundColor: "#ff6b35" }}>
                  <h5 className="modal-title">Update Investigation Template</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={handleCloseModal}></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-4">
                      <label className="form-label fw-bold">
                        Select Template <span className="text-danger">*</span>
                      </label>
                    </div>
                    <div className="col-md-8">
                      <select
                        className="form-select"
                        value={updateTemplateSelection}
                        onChange={(e) => setUpdateTemplateSelection(e.target.value)}
                      >
                        <option value="Select..">Select..</option>
                        {templates.map((template, index) => (
                          <option key={index} value={template}>
                            {template}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={handleCloseModal}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            {/* Header */}
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">GENERAL MEDICINE WAITING LIST</h4>
                <div className="d-flex gap-2">
                  <button className="btn btn-primary">OPEN TOKEN DISPLAY</button>
                  <button className="btn btn-secondary btn-sm">CLOSE TOKEN DISPLAY</button>
                </div>
              </div>
            </div>
            <div className="card-body">
              {/* Search Filters */}
              <div className="card mb-3">
                <div className="card-body">
                  <div className="row g-3 align-items-end">
                    <div className="col-md-2">
                      <label className="form-label fw-bold">Doctor List</label>
                      <select
                        className="form-select"
                        value={searchFilters.doctorList}
                        onChange={(e) => handleFilterChange("doctorList", e.target.value)}
                      >
                        <option value="Dr. G. Pradhan">Dr. G. Pradhan</option>
                        <option value="Dr. Smith">Dr. Smith</option>
                        <option value="Dr. Johnson">Dr. Johnson</option>
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="form-label fw-bold">Session</label>
                      <select
                        className="form-select"
                        value={searchFilters.session}
                        onChange={(e) => handleFilterChange("session", e.target.value)}
                      >
                        <option value="Select">Select</option>
                        <option value="Morning">Morning</option>
                        <option value="Evening">Evening</option>
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="form-label fw-bold">Employee No.</label>
                      <input
                        type="text"
                        className="form-control"
                        value={searchFilters.employeeNo}
                        onChange={(e) => handleFilterChange("employeeNo", e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold">Patient Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={searchFilters.patientName}
                        onChange={(e) => handleFilterChange("patientName", e.target.value)}
                      />
                    </div>
                    <div className="col-md-3 d-flex gap-2">
                      <button type="button" className="btn btn-primary" onClick={handleSearch}>
                        SEARCH
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleReset}>
                        RESET
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Waiting List Table */}
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Token No.</th>
                      <th>Employee No.</th>
                      <th>Patient Name</th>
                      <th>Relation</th>
                      <th>Designation</th>
                      <th>Name</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>OPD Type</th>
                      <th>Action</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item) => (
                      <tr key={item.id} onClick={() => handleRowClick(item)} style={{ cursor: "pointer" }}>
                        <td>
                          <span className={`badge ${getPriorityColor(item.priority)}`}>{item.tokenNo}</span>
                        </td>
                        <td>{item.employeeNo}</td>
                        <td>{item.patientName}</td>
                        <td>{item.relation}</td>
                        <td>{item.designation}</td>
                        <td>{item.name}</td>
                        <td>{item.age}</td>
                        <td>{item.gender}</td>
                        <td>{item.opdType}</td>
                        <td>
                          <button className="btn btn-primary btn-sm" onClick={() => handleRelease(item.id)}>
                            RELEASE
                          </button>
                        </td>
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => handleClose(item.id)}>
                            CLOSE
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Priority Legend */}
              <div className="d-flex mb-3 mt-3">
                <span className="badge bg-danger me-2">Priority-1</span>
                <span className="badge bg-warning text-dark me-2">Priority-2</span>
                <span className="badge bg-success">Priority-3</span>
              </div>

              {/* Pagination */}
              <nav className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  <span>
                    Page {currentPage} of {filteredTotalPages} | Total Records: {filteredList.length}
                  </span>
                </div>
                <ul className="pagination mb-0">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      &laquo; Previous
                    </button>
                  </li>
                  {renderPagination()}
                  <li className={`page-item ${currentPage === filteredTotalPages ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === filteredTotalPages}
                    >
                      Next &raquo;
                    </button>
                  </li>
                </ul>
                <div className="d-flex align-items-center">
                  <input
                    type="number"
                    min="1"
                    max={filteredTotalPages}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    placeholder="Go to page"
                    className="form-control me-2"
                    style={{ width: "120px" }}
                  />
                  <button className="btn btn-primary" onClick={handlePageNavigation}>
                    GO
                  </button>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GeneralMedicineWaitingList
