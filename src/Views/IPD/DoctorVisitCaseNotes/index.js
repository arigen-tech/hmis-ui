import React, { useState, useEffect } from "react"
import { getRequest, postRequest } from "../../../service/apiService"

import { GET_ALL_ACT_MAS_DEPT_FOR_DROPDOWN_END_URL, DOCTOR_BY_SPECIALITY, MAS_VISIT_TYPE_GET_ALL, REQUEST_PARAM_DEPARTMENT_TYPE_CODE, FILTER_WARD_DEPT, SAVE_DAILY_CASE_SHEET_ENTRY, GET_DAILY_CASE_SHEET_ENTRY } from "../../../config/apiConfig"

const DoctorVisitCaseNotes = ({ selectedPatient }) => {
  const [activeView, setActiveView] = useState("doctorVisit") // "doctorVisit" | "diagnosis"

  const [departments, setDepartments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [visitTypes, setVisitTypes] = useState([])

  // State for Doctor Visit Form
  const [doctorVisitForm, setDoctorVisitForm] = useState({
    visitDateTime: "",
    doctorId: "",
    doctorName: "",
    departmentId: "",
    department: "",
    visitType: "Normal",
    doctorNotes: "",
    investigationSummary: "",
    medicineSummary: "",
    procedureSummary: "",
    carePlanChanges: "",
    nextFollowUpPlan: ""
  })

  const [loadingHistory, setLoadingHistory] = useState(false)

  // State for storing doctor visit history
  const [doctorVisitHistory, setDoctorVisitHistory] = useState([])

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

  const fetchDoctorVisitHistory = async () => {
    const inpatientId = selectedPatient?.inpatientId || selectedPatient?.id || selectedPatient?.inPatientId || 27;
    if (!inpatientId) return;
    setLoadingHistory(true);
    try {
      const response = await getRequest(`${GET_DAILY_CASE_SHEET_ENTRY}/${inpatientId}`);
      if (response && response.response && Array.isArray(response.response)) {
        setDoctorVisitHistory(response.response);
      } else if (Array.isArray(response)) {
        setDoctorVisitHistory(response);
      } else {
        setDoctorVisitHistory([]);
      }
    } catch (error) {
      console.error("Error fetching doctor visit history:", error);
      setDoctorVisitHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchDoctorVisitHistory();
  }, [selectedPatient]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const deptRes = await getRequest(`${GET_ALL_ACT_MAS_DEPT_FOR_DROPDOWN_END_URL}?${REQUEST_PARAM_DEPARTMENT_TYPE_CODE}=${FILTER_WARD_DEPT}`);
        if (deptRes && deptRes.response) {
          setDepartments(deptRes.response);
        } else if (Array.isArray(deptRes)) {
          setDepartments(deptRes);
        }

        const visitTypeRes = await getRequest(MAS_VISIT_TYPE_GET_ALL);
        if (visitTypeRes && visitTypeRes.response) {
          setVisitTypes(visitTypeRes.response);
        } else if (Array.isArray(visitTypeRes)) {
          setVisitTypes(visitTypeRes);
        }
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };
    fetchDropdownData();
  }, []);

  const handleVisitTypeChange = (e) => {
    const val = e.target.value;
    const selectedVt = visitTypes.find(vt => (vt.visitTypeId == val || vt.id == val || vt.visitTypeName === val || vt.visitTypeCode === val));
    setDoctorVisitForm(prev => ({
      ...prev,
      visitTypeId: selectedVt?.visitTypeId || selectedVt?.id || val,
      visitType: selectedVt?.visitTypeName || val
    }));
  };

  const handleDepartmentChange = async (e) => {
    const deptId = e.target.value;
    const selectedDept = departments.find(d => (d.id == deptId || d.departmentId == deptId));
    const deptName = selectedDept ? (selectedDept.departmentName || selectedDept.name) : "";

    setDoctorVisitForm(prev => ({
      ...prev,
      departmentId: deptId,
      department: deptName,
      doctorId: "",
      doctorName: ""
    }));

    if (deptId) {
      try {
        const response = await getRequest(`${DOCTOR_BY_SPECIALITY}${deptId}`);
        if (response && response.response) {
          setDoctors(response.response);
        } else if (Array.isArray(response)) {
          setDoctors(response);
        } else {
          setDoctors([]);
        }
      } catch (error) {
        console.error("Error fetching doctors by speciality:", error);
        setDoctors([]);
      }
    } else {
      setDoctors([]);
    }
  };

  const handleDoctorChange = (e) => {
    const docId = e.target.value;
    const selectedDoc = doctors.find(d => (d.userId == docId || d.id == docId));
    let docName = "";
    if (selectedDoc) {
      if (selectedDoc.firstName) {
        docName = [selectedDoc.firstName, selectedDoc.middleName, selectedDoc.lastName].filter(Boolean).join(" ");
      } else if (selectedDoc.name) {
        docName = selectedDoc.name;
      } else if (selectedDoc.userName) {
        docName = selectedDoc.userName;
      }
    }

    setDoctorVisitForm(prev => ({
      ...prev,
      doctorId: docId,
      doctorName: docName
    }));
  };

  const handleDoctorVisitFormChange = (e) => {
    const { name, value } = e.target
    setDoctorVisitForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveDoctorVisit = async () => {
    if (!doctorVisitForm.doctorId) {
      alert("Please select Doctor Name")
      return
    }

    const inpatientId = Number(selectedPatient?.inpatientId || selectedPatient?.id || selectedPatient?.inPatientId || 27)

    const payload = {
      inpatientId: inpatientId,
      doctorId: Number(doctorVisitForm.doctorId),
      visitType: Number(doctorVisitForm.visitTypeId || doctorVisitForm.visitType || 0),
      visitDepartmentId: Number(doctorVisitForm.departmentId),
      doctorNotes: doctorVisitForm.doctorNotes || "",
      investigationSummary: doctorVisitForm.investigationSummary || "",
      medicineSummary: doctorVisitForm.medicineSummary || "",
      procedureSummary: doctorVisitForm.procedureSummary || "",
      carePlanChanges: doctorVisitForm.carePlanChanges || "",
      nextFollowUpPlan: doctorVisitForm.nextFollowUpPlan || ""
    }

    try {
      const response = await postRequest(SAVE_DAILY_CASE_SHEET_ENTRY, payload)
      if (response && (response.status === 200 || response.status === 201 || response.status === "200" || response.message === "success" || response.response || response.caseSheetEntryId)) {
        await fetchDoctorVisitHistory()
        setDoctorVisitForm({
          visitDateTime: "",
          doctorId: "",
          doctorName: "",
          departmentId: "",
          department: "",
          visitTypeId: "",
          visitType: "",
          doctorNotes: "",
          investigationSummary: "",
          medicineSummary: "",
          procedureSummary: "",
          carePlanChanges: "",
          nextFollowUpPlan: ""
        })
        setDoctors([])
        alert("Doctor visit notes saved successfully!")
      } else {
        alert(response?.message || "Failed to save doctor visit notes.")
      }
    } catch (error) {
      console.error("Error saving doctor visit notes:", error)
      alert("An error occurred while saving doctor visit notes.")
    }
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
    <div>
      {/* ─── TAB TOGGLE ─── */}
      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-sm ${activeView === "doctorVisit" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveView("doctorVisit")}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
        >
          Doctor Visit / Case Notes
        </button>
        <button
          className={`btn btn-sm ${activeView === "diagnosis" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveView("diagnosis")}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
        >
          Diagnosis ({diagnosisList.length})
        </button>
      </div>

      {/* ─── DOCTOR VISIT SECTION ─── */}
      {activeView === "doctorVisit" && (
        <div className="card">
          <div className="card-header bg-primary text-white py-2">
            <strong>Doctor Visit / Case Notes</strong>
          </div>
          <div className="card-body">
            {/* Form Fields */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="form-label">Department/Speciality</label>
                <select
                  className="form-select"
                  name="departmentId"
                  value={doctorVisitForm.departmentId}
                  onChange={handleDepartmentChange}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id || dept.departmentId} value={dept.id || dept.departmentId}>
                      {dept.departmentName || dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Doctor Name</label>
                <select
                  className="form-select"
                  name="doctorId"
                  value={doctorVisitForm.doctorId}
                  onChange={handleDoctorChange}
                  disabled={!doctorVisitForm.departmentId}
                >
                  <option value="">
                    {!doctorVisitForm.departmentId ? "Select Department First" : "Select Doctor"}
                  </option>
                  {doctors.map((doctor) => {
                    const docName = doctor.firstName
                      ? [doctor.firstName, doctor.middleName, doctor.lastName].filter(Boolean).join(" ")
                      : (doctor.name || doctor.userName || `Doctor #${doctor.userId || doctor.id}`);
                    return (
                      <option key={doctor.userId || doctor.id} value={doctor.userId || doctor.id}>
                        {docName}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Visit Type</label>
                <select
                  className="form-select"
                  name="visitType"
                  value={doctorVisitForm.visitTypeId || doctorVisitForm.visitType}
                  onChange={handleVisitTypeChange}
                >
                  <option value="">Select Visit Type</option>
                  {visitTypes.map((vt) => (
                    <option key={vt.visitTypeId || vt.id} value={vt.visitTypeId || vt.id || vt.visitTypeName}>
                      {vt.visitTypeName}
                    </option>
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
                <button className="btn btn-primary btn-sm" onClick={handleSaveDoctorVisit}>
                  <i className="fa fa-save me-1"></i> Save Visit
                </button>
              </div>
            </div>

            <hr />

            {/* Doctor Visit History */}
            <div>
              <h6 className="mb-3">Doctor Visit History</h6>
              {loadingHistory ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : doctorVisitHistory.length === 0 ? (
                <div className="text-muted text-center py-3">No doctor visit history found.</div>
              ) : (
                doctorVisitHistory.map((visit) => (
                  <div key={visit.caseSheetEntryId || visit.id} className="card mb-3">
                    <div className="card-header bg-light">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{formatDateTime(visit.visitDateTime)}</strong> | 
                          <span className="ms-2">{visit.doctorName}</span> | 
                          <span className="ms-2 text-muted">{visit.departmentName || visit.department}</span>
                        </div>
                        {visit.capturedBy && (
                          <div className="text-muted small">
                            Captured By: {visit.capturedBy}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="mb-2"><strong>Notes:</strong> {visit.notes || visit.doctorNotes}</div>
                      <div className="mb-2"><strong>Investigation:</strong> {visit.investigation || visit.investigationSummary}</div>
                      <div className="mb-2"><strong>Medicines:</strong> {visit.medicines || visit.medicineSummary}</div>
                      <div className="mb-2"><strong>Procedure:</strong> {visit.procedure || visit.procedureSummary}</div>
                      <div className="mb-2"><strong>Plan:</strong> {visit.plan || visit.carePlanChanges}</div>
                      <div><strong>Follow-up:</strong> {visit.followUp || visit.nextFollowUpPlan}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── DIAGNOSIS SECTION ─── */}
      {activeView === "diagnosis" && (
        <div className="card">
          <div className="card-header bg-primary text-white py-2">
            <strong>Diagnosis List</strong>
          </div>
          <div className="card-body">
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
        </div>
      )}

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
    </div>
  )
}

export default DoctorVisitCaseNotes