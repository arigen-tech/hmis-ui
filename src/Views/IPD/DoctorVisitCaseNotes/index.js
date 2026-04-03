import { useState } from "react"

const DoctorVisitCaseNotes = ({ selectedPatient }) => {
  const [showDoctorVisitSection, setShowDoctorVisitSection] = useState(true)
  const [showDiagnosisSection, setShowDiagnosisSection] = useState(true)

  // State for Doctor Visit Form
  const [doctorVisitForm, setDoctorVisitForm] = useState({
    visitDateTime: "",
    doctorName: "",
    department: "",
    visitType: "Normal",
    doctorNotes: "",
    investigationSummary: "",
    medicineSummary: "",
    procedureSummary: "",
    carePlanChanges: "",
    nextFollowUpPlan: ""
  })

  // State for storing doctor visit history
  const [doctorVisitHistory, setDoctorVisitHistory] = useState([
    {
      id: 1,
      visitDateTime: "2026-03-24T10:15",
      doctorName: "Dr. Vinay",
      department: "Ortho",
      visitType: "Normal",
      capturedBy: "Nurse A",
      doctorNotes: "Fever improved, platelet stabilizing",
      investigationSummary: "CBC, Dengue NS1",
      medicineSummary: "Inj Ceftriaxone 1g IV BD, PCM 650 mg",
      procedureSummary: "Nil",
      carePlanChanges: "Continue IV fluids",
      nextFollowUpPlan: "Review platelets tomorrow"
    },
    {
      id: 2,
      visitDateTime: "2026-03-24T06:30",
      doctorName: "Dr. Sharma",
      department: "GenMed",
      visitType: "Emergency",
      capturedBy: "Nurse B",
      doctorNotes: "Patient had high fever, weakness",
      investigationSummary: "CBC advised",
      medicineSummary: "PCM given",
      procedureSummary: "Nil",
      carePlanChanges: "Monitor vitals",
      nextFollowUpPlan: "Review in evening"
    },
    {
      id: 3,
      visitDateTime: "2026-03-23T09:00",
      doctorName: "Dr. Vinay",
      department: "Ortho",
      visitType: "ICU",
      capturedBy: "Nurse A",
      doctorNotes: "Platelets low, under observation",
      investigationSummary: "Repeat CBC",
      medicineSummary: "IV fluids started",
      procedureSummary: "Nil",
      carePlanChanges: "Continue monitoring",
      nextFollowUpPlan: "Review CBC report"
    }
  ])

  // Diagnosis state
  const [diagnosisList, setDiagnosisList] = useState([
    {
      id: 1,
      date: "15-Nov-25",
      type: "ICD",
      diagnosisText: "Dengue Fever",
      icdCode: "A90",
      status: "Confirmed",
      remarks: "Confirmed after NS1 positive"
    },
    {
      id: 2,
      date: "13-Nov-25",
      type: "WORKING",
      diagnosisText: "Probable Dengue",
      icdCode: "-",
      status: "Active",
      remarks: ""
    },
    {
      id: 3,
      date: "11-Nov-25",
      type: "WORKING",
      diagnosisText: "Fever with thrombocytopenia",
      icdCode: "-",
      status: "Active",
      remarks: ""
    }
  ])

  // Diagnosis modals state
  const [showViewDiagnosisModal, setShowViewDiagnosisModal] = useState(false)
  const [showAddDiagnosisModal, setShowAddDiagnosisModal] = useState(false)
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null)

  // Add Diagnosis Form state
  const [addDiagnosisForm, setAddDiagnosisForm] = useState({
    diagnosisType: "",
    diagnosisText: "",
    icdSearch: "",
    icdCode: "",
    icdName: "",
    status: "",
    date: new Date().toISOString().slice(0, 16),
    remarks: ""
  })

  // ICD search results mock
  const icdDatabase = [
    { code: "A90", name: "Dengue Fever" },
    { code: "A91", name: "Dengue Haemorrhagic Fever" },
    { code: "J18", name: "Pneumonia" },
    { code: "I10", name: "Hypertension" },
    { code: "E11", name: "Type 2 Diabetes Mellitus" },
    { code: "K37", name: "Appendicitis" },
    { code: "N20", name: "Calculus of Kidney" },
    { code: "J45", name: "Asthma" },
    { code: "A01", name: "Typhoid Fever" },
    { code: "G43", name: "Migraine" }
  ]
  const [icdSearchResults, setIcdSearchResults] = useState([])

  const doctorOptions = [...new Set(doctorVisitHistory.map((item) => item.doctorName))]
  const departmentOptions = [...new Set(doctorVisitHistory.map((item) => item.department))]
  const visitTypeOptions = ["Normal", "ICU", "Emergency"]

  const handleDoctorVisitFormChange = (e) => {
    const { name, value } = e.target
    setDoctorVisitForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveDoctorVisit = () => {
    if (!doctorVisitForm.visitDateTime || !doctorVisitForm.doctorName) {
      alert("Please fill in Visit Date/Time and Doctor Name")
      return
    }
    const newVisit = {
      id: doctorVisitHistory.length + 1,
      ...doctorVisitForm,
      capturedBy: "Current Nurse"
    }
    setDoctorVisitHistory([newVisit, ...doctorVisitHistory])
    setDoctorVisitForm({
      visitDateTime: "",
      doctorName: "",
      department: "",
      visitType: "Normal",
      doctorNotes: "",
      investigationSummary: "",
      medicineSummary: "",
      procedureSummary: "",
      carePlanChanges: "",
      nextFollowUpPlan: ""
    })
    alert("Doctor visit notes saved successfully!")
  }

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return ""
    const date = new Date(dateTimeStr)
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Diagnosis handlers
  const handleViewDiagnosis = (diagnosis) => {
    setSelectedDiagnosis(diagnosis)
    setShowViewDiagnosisModal(true)
  }

  const handleCloseViewModal = () => {
    setShowViewDiagnosisModal(false)
    setSelectedDiagnosis(null)
  }

  const handleOpenAddDiagnosis = () => {
    setAddDiagnosisForm({
      diagnosisType: "",
      diagnosisText: "",
      icdSearch: "",
      icdCode: "",
      icdName: "",
      status: "",
      date: new Date().toISOString().slice(0, 16),
      remarks: ""
    })
    setIcdSearchResults([])
    setShowAddDiagnosisModal(true)
  }

  const handleCloseAddModal = () => {
    setShowAddDiagnosisModal(false)
  }

  const handleAddDiagnosisFormChange = (e) => {
    const { name, value } = e.target
    setAddDiagnosisForm(prev => ({ ...prev, [name]: value }))

    if (name === "icdSearch") {
      if (value.trim().length > 1) {
        const results = icdDatabase.filter(
          icd =>
            icd.code.toLowerCase().includes(value.toLowerCase()) ||
            icd.name.toLowerCase().includes(value.toLowerCase())
        )
        setIcdSearchResults(results)
      } else {
        setIcdSearchResults([])
      }
    }
  }

  const handleSelectIcd = (icd) => {
    setAddDiagnosisForm(prev => ({
      ...prev,
      icdSearch: `${icd.code} - ${icd.name}`,
      icdCode: icd.code,
      icdName: icd.name
    }))
    setIcdSearchResults([])
  }

  const handleSaveDiagnosis = () => {
    if (!addDiagnosisForm.diagnosisType) {
      alert("Please select Diagnosis Type")
      return
    }
    if (!addDiagnosisForm.status) {
      alert("Please select Status")
      return
    }
    if (addDiagnosisForm.diagnosisType === "WORKING" && !addDiagnosisForm.diagnosisText) {
      alert("Please enter Diagnosis Text")
      return
    }
    if (addDiagnosisForm.diagnosisType === "ICD" && !addDiagnosisForm.icdCode) {
      alert("Please search and select an ICD Code")
      return
    }

    const dateObj = new Date(addDiagnosisForm.date)
    const formattedDate = dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    }).replace(/ /g, '-')

    const newDiagnosis = {
      id: diagnosisList.length + 1,
      date: formattedDate,
      type: addDiagnosisForm.diagnosisType,
      diagnosisText: addDiagnosisForm.diagnosisType === "ICD"
        ? addDiagnosisForm.icdName
        : addDiagnosisForm.diagnosisText,
      icdCode: addDiagnosisForm.diagnosisType === "ICD" ? addDiagnosisForm.icdCode : "-",
      status: addDiagnosisForm.status,
      remarks: addDiagnosisForm.remarks
    }

    setDiagnosisList([newDiagnosis, ...diagnosisList])
    setShowAddDiagnosisModal(false)
    alert("Diagnosis added successfully!")
  }

  return (
    <>
      {/* Doctor Visit Section */}
      <div className="mb-2">
        <div 
          className="d-flex justify-content-between align-items-center  border border-primary rounded px-1"
          style={{ cursor: "pointer" }}
          onClick={() => setShowDoctorVisitSection(!showDoctorVisitSection)}
        >
          <h6 className="mb-0 text-primary">
            Doctor Visit / Case Notes
          </h6>
          <button className="btn btn-sm ">
            {showDoctorVisitSection ? "−" : "+"}
          </button>
        </div>

        {showDoctorVisitSection && (
          <div>
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="form-label">Doctor Name</label>
                <select
                  className="form-select"
                  name="doctorName"
                  value={doctorVisitForm.doctorName}
                  onChange={handleDoctorVisitFormChange}
                >
                  <option value="">Select Doctor</option>
                  {doctorOptions.map((doctor) => (
                    <option key={doctor} value={doctor}>{doctor}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Department/Speciality</label>
                <select
                  className="form-select"
                  name="department"
                  value={doctorVisitForm.department}
                  onChange={handleDoctorVisitFormChange}
                >
                  <option value="">Select Department</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Visit Type</label>
                <select
                  className="form-select"
                  name="visitType"
                  value={doctorVisitForm.visitType}
                  onChange={handleDoctorVisitFormChange}
                >
                  {visitTypeOptions.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Doctor Notes</label>
                <textarea
                  className="form-control"
                  rows="2"
                  name="doctorNotes"
                  placeholder="Enter doctor's notes..."
                  value={doctorVisitForm.doctorNotes}
                  onChange={handleDoctorVisitFormChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Investigation Summary</label>
                <textarea
                  className="form-control"
                  rows="2"
                  name="investigationSummary"
                  placeholder="Enter investigation summary..."
                  value={doctorVisitForm.investigationSummary}
                  onChange={handleDoctorVisitFormChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Medicine Summary</label>
                <textarea
                  className="form-control"
                  rows="2"
                  name="medicineSummary"
                  placeholder="Enter medicine summary..."
                  value={doctorVisitForm.medicineSummary}
                  onChange={handleDoctorVisitFormChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Procedure Summary</label>
                <textarea
                  className="form-control"
                  rows="2"
                  name="procedureSummary"
                  placeholder="Enter procedure summary..."
                  value={doctorVisitForm.procedureSummary}
                  onChange={handleDoctorVisitFormChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Care Plan Changes</label>
                <textarea
                  className="form-control"
                  rows="2"
                  name="carePlanChanges"
                  placeholder="Enter care plan changes..."
                  value={doctorVisitForm.carePlanChanges}
                  onChange={handleDoctorVisitFormChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Next Follow-up Plan</label>
                <textarea
                  className="form-control"
                  rows="2"
                  name="nextFollowUpPlan"
                  placeholder="Enter next follow-up plan..."
                  value={doctorVisitForm.nextFollowUpPlan}
                  onChange={handleDoctorVisitFormChange}
                />
              </div>
              <div className="col-12">
                <button className="btn btn-primary" onClick={handleSaveDoctorVisit}>
                  <i className="fa fa-save me-1"></i> SAVE
                </button>
              </div>
            </div>

            <hr />

            <div>
              <h6 className="mb-3">Doctor Visit History</h6>
              {doctorVisitHistory.map((visit) => (
                <div key={visit.id} className="card mb-3">
                  <div className="card-header bg-light">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{formatDateTime(visit.visitDateTime)}</strong> | 
                        <span className="ms-2">{visit.doctorName}</span> | 
                        <span className="ms-2 text-muted">{visit.department}</span>
                      </div>
                      <div className="text-muted small">
                        Captured By: {visit.capturedBy}
                      </div>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="mb-2"><strong>Notes:</strong> {visit.doctorNotes}</div>
                    <div className="mb-2"><strong>Investigation:</strong> {visit.investigationSummary}</div>
                    <div className="mb-2"><strong>Medicines:</strong> {visit.medicineSummary}</div>
                    <div className="mb-2"><strong>Procedure:</strong> {visit.procedureSummary}</div>
                    <div className="mb-2"><strong>Plan:</strong> {visit.carePlanChanges}</div>
                    <div><strong>Follow-up:</strong> {visit.nextFollowUpPlan}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <hr />

      {/* Diagnosis Section */}
      <div>
        <div 
          className="d-flex justify-content-between align-items-center border border-primary rounded px-1"
          style={{ cursor: "pointer" }}
          onClick={() => setShowDiagnosisSection(!showDiagnosisSection)}
        >
          <h6 className="mb-0 text-primary">Diagnosis</h6>
          <button className="btn btn-sm ">
            {showDiagnosisSection ? "−" : "+"}
          </button>
        </div>

        {showDiagnosisSection && (
          <div>
            <div className="table-responsive mb-3">
              <table className="table table-bordered table-sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Diagnosis</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {diagnosisList.map((diag) => (
                    <tr key={diag.id}>
                      <td>{diag.date}</td>
                      <td>{diag.type}</td>
                      <td>{diag.diagnosisText}</td>
                      <td>{diag.status}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-info"
                          onClick={() => handleViewDiagnosis(diag)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              className="btn btn-success btn-sm"
              onClick={handleOpenAddDiagnosis}
            >
              <i className="fa fa-plus me-1"></i> Add Diagnosis
            </button>
          </div>
        )}
      </div>

      {/* View Diagnosis Modal */}
      {showViewDiagnosisModal && selectedDiagnosis && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }} onClick={handleCloseViewModal}>
          <div className="modal-dialog modal-md modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">Diagnosis Details</h6>
                <button type="button" className="btn-close" onClick={handleCloseViewModal}></button>
              </div>
              <div className="modal-body">
                <p><strong>Type:</strong> {selectedDiagnosis.type}</p>
                <p><strong>Diagnosis:</strong> {selectedDiagnosis.diagnosisText}</p>
                <p><strong>ICD Code:</strong> {selectedDiagnosis.icdCode}</p>
                <p><strong>Status:</strong> {selectedDiagnosis.status}</p>
                <p><strong>Date:</strong> {selectedDiagnosis.date}</p>
                {selectedDiagnosis.remarks && <p><strong>Remarks:</strong> {selectedDiagnosis.remarks}</p>}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={handleCloseViewModal}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Diagnosis Modal */}
      {showAddDiagnosisModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }} onClick={handleCloseAddModal}>
          <div className="modal-dialog modal-md modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">Add Diagnosis</h6>
                <button type="button" className="btn-close" onClick={handleCloseAddModal}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Diagnosis Type:</label>
                  <div className="d-flex gap-3">
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="diagnosisType" value="WORKING" checked={addDiagnosisForm.diagnosisType === "WORKING"} onChange={handleAddDiagnosisFormChange} />
                      <label className="form-check-label">Working Diagnosis</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="diagnosisType" value="ICD" checked={addDiagnosisForm.diagnosisType === "ICD"} onChange={handleAddDiagnosisFormChange} />
                      <label className="form-check-label">ICD Diagnosis</label>
                    </div>
                  </div>
                </div>

                {addDiagnosisForm.diagnosisType === "WORKING" && (
                  <div className="mb-3">
                    <label className="form-label">Diagnosis Text:</label>
                    <input type="text" className="form-control" name="diagnosisText" value={addDiagnosisForm.diagnosisText} onChange={handleAddDiagnosisFormChange} />
                  </div>
                )}

                {addDiagnosisForm.diagnosisType === "ICD" && (
                  <div className="mb-3">
                    <label className="form-label">Search ICD Code:</label>
                    <input type="text" className="form-control" name="icdSearch" placeholder="Search by code or name..." value={addDiagnosisForm.icdSearch} onChange={handleAddDiagnosisFormChange} autoComplete="off" />
                    {icdSearchResults.length > 0 && (
                      <div className="border rounded bg-white mt-1" style={{ maxHeight: "150px", overflowY: "auto" }}>
                        {icdSearchResults.map((icd) => (
                          <div key={icd.code} className="px-3 py-2 border-bottom" style={{ cursor: "pointer" }} onClick={() => handleSelectIcd(icd)}>
                            <strong>{icd.code}</strong> - {icd.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">Status:</label>
                  <div className="d-flex gap-3">
                    {["Active", "Confirmed", "Inactive"].map((s) => (
                      <div className="form-check" key={s}>
                        <input className="form-check-input" type="radio" name="status" value={s} checked={addDiagnosisForm.status === s} onChange={handleAddDiagnosisFormChange} />
                        <label className="form-check-label">{s}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Date:</label>
                  <input type="datetime-local" className="form-control" name="date" value={addDiagnosisForm.date} onChange={handleAddDiagnosisFormChange} />
                </div>

                <div className="mb-3">
                  <label className="form-label">Remarks:</label>
                  <input type="text" className="form-control" name="remarks" placeholder="Enter remarks..." value={addDiagnosisForm.remarks} onChange={handleAddDiagnosisFormChange} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={handleCloseAddModal}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveDiagnosis}>Save Diagnosis</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DoctorVisitCaseNotes