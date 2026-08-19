import { useState } from "react"
import Swal from "sweetalert2"

const COMPONENT_TYPES = ["PRBC", "Platelet", "Plasma", "Whole Blood", "Cryoprecipitate"]
const URGENCY_OPTIONS = ["Routine", "Urgent", "Emergency"]
const INDICATION_OPTIONS = ["Anemia", "Surgery", "Trauma", "Bleeding Disorder", "Other"]

const DUMMY_TRACKING_LIST = [
  { requestNo: "BT-2026", ipNo: "IPD-1001", patientName: "John Mathew", bloodGroup: "A+", component: "PRBC", units: 1, department: "General Ward", urgency: "Routine", requestedDateTime: "01-Aug-2026 09:15 AM", requiredBy: "01-Aug-2026 01:00 PM", status: "Issued" },
  { requestNo: "BT-2026", ipNo: "IPD-1002", patientName: "Sarah Khan", bloodGroup: "O-", component: "Whole Blood", units: 2, department: "Surgery", urgency: "Urgent", requestedDateTime: "01-Aug-2026 10:30 AM", requiredBy: "01-Aug-2026 11:30 AM", status: "Ready for Issue" },
  { requestNo: "BT-2026", ipNo: "IPD-1003", patientName: "Mohammed Ali", bloodGroup: "B+", component: "Platelet", units: 1, department: "Oncology", urgency: "Emergency", requestedDateTime: "01-Aug-2026 11:45 AM", requiredBy: "ASAP", status: "Cross Matching" },
  { requestNo: "BT-2026", ipNo: "IPD-1004", patientName: "Deepa Krishnan", bloodGroup: "AB+", component: "Plasma", units: 2, department: "ICU", urgency: "Routine", requestedDateTime: "01-Aug-2026 01:20 PM", requiredBy: "01-Aug-2026 05:00 PM", status: "Pending" },
  { requestNo: "BT-2026", ipNo: "IPD-1005", patientName: "Ramesh Iyer", bloodGroup: "O+", component: "Cryoprecipitate", units: 3, department: "Trauma", urgency: "Emergency", requestedDateTime: "01-Aug-2026 02:00 PM", requiredBy: "ASAP", status: "Compatibility Testing" }
]

const DUMMY_ISSUED_UNITS = [
  { id: 1, component: "PRBC", group: "A+", unitNo: "PRBC-2026-001", expiry: "25-Sep-2026", issuedAt: "01-Aug-2026 16:45" },
  { id: 2, component: "Whole Blood", group: "O-", unitNo: "WB-2026-045", expiry: "10-Sep-2026", issuedAt: "01-Aug-2026 17:10" },
  { id: 3, component: "Platelet", group: "B+", unitNo: "PLT-2026-089", expiry: "05-Aug-2026", issuedAt: "01-Aug-2026 17:30" },
  { id: 4, component: "Plasma", group: "AB+", unitNo: "PLS-2026-023", expiry: "30-Nov-2026", issuedAt: "01-Aug-2026 18:05" }
]

const BloodTransfusion = ({ selectedPatient }) => {
  const [activeView, setActiveView] = useState("request")

  const [requestRows, setRequestRows] = useState([
    { id: 1, componentType: "", units: "", urgency: "", requiredDateTime: "", indication: "", remarks: "" }
  ])

  const handleRowChange = (id, field, value) => {
    setRequestRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const handleAddRow = () => {
    setRequestRows(prev => [...prev, { id: prev.length ? Math.max(...prev.map(r => r.id)) + 1 : 1, componentType: "", units: "", urgency: "", requiredDateTime: "", indication: "", remarks: "" }])
  }

  const handleRemoveRow = (id) => {
    setRequestRows(prev => (prev.length > 1 ? prev.filter(r => r.id !== id) : prev))
  }

  const handleResetForm = () => {
    setRequestRows([{ id: 1, componentType: "", units: "", urgency: "", requiredDateTime: "", indication: "", remarks: "" }])
  }

  const handleSubmitRequest = () => {
    const invalid = requestRows.some(r => !r.componentType || !r.units || !r.urgency || !r.requiredDateTime)
    if (invalid) {
      Swal.fire({
        title: "Warning",
        text: "Please fill all required fields for each component.",
        icon: "warning"
      })
      return
    }

    const requestNo = "BT-2026-" + String(Math.floor(Math.random() * 900) + 100)
    Swal.fire({
      title: "Success",
      text: `Blood Request ${requestNo} submitted successfully!`,
      icon: "success"
    }).then(() => {
      handleResetForm()
      setActiveView("tracking")
    })
  }

  const [pendingUnits, setPendingUnits] = useState(DUMMY_ISSUED_UNITS)
  const [receivedUnits, setReceivedUnits] = useState([])
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [receiveTarget, setReceiveTarget] = useState(null)
  const [unitCondition, setUnitCondition] = useState("Acceptable")
  const [receiveRemarks, setReceiveRemarks] = useState("")

  const handleOpenReceive = (unit) => {
    setReceiveTarget(unit)
    setUnitCondition("Acceptable")
    setReceiveRemarks("")
    setShowReceiveModal(true)
  }

  const handleConfirmReceipt = () => {
    const now = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    setReceivedUnits(prev => [
      ...prev,
      { ...receiveTarget, receivedAt: now, receivedBy: "Nurse A", unitCondition, receiveRemarks, status: "Received in Ward" }
    ])
    setPendingUnits(prev => prev.filter(u => u.id !== receiveTarget.id))
    setShowReceiveModal(false)
    Swal.fire({
      title: "Success",
      text: `Blood unit ${receiveTarget.unitNo} received in ward.`,
      icon: "success"
    }).then(() => setReceiveTarget(null))
  }

  const [showStartModal, setShowStartModal] = useState(false)
  const [transfusionTarget, setTransfusionTarget] = useState(null)
  const [verifiedBy, setVerifiedBy] = useState("")
  const [vitals, setVitals] = useState({ temperature: "98.4", pulse: "82", bpSys: "120", bpDia: "80", respRate: "18", spo2: "98" })
  const [transfusionRemarks, setTransfusionRemarks] = useState("")

  const handleOpenStart = (unit) => {
    setTransfusionTarget(unit)
    setVerifiedBy("")
    setVitals({ temperature: "98.4", pulse: "82", bpSys: "120", bpDia: "80", respRate: "18", spo2: "98" })
    setTransfusionRemarks("")
    setShowStartModal(true)
  }

  const handleVitalsChange = (field, value) => {
    setVitals(prev => ({ ...prev, [field]: value }))
  }

  const handleStartTransfusion = () => {
    if (!verifiedBy) {
      Swal.fire({
        title: "Warning",
        text: "Please select the verifying nurse / user.",
        icon: "warning"
      })
      return
    }
    const now = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    setReceivedUnits(prev => prev.map(u =>
      u.id === transfusionTarget.id
        ? { ...u, status: "Transfusion Started", startedAt: now, verifiedBy, vitals, transfusionRemarks }
        : u
    ))
    setShowStartModal(false)
    Swal.fire({
      title: "Success",
      text: `Transfusion started for unit ${transfusionTarget.unitNo}.`,
      icon: "success"
    }).then(() => setTransfusionTarget(null))
  }

  const handleCompleteTransfusion = (unit) => {
    Swal.fire({
      title: "Complete Transfusion?",
      text: `Mark transfusion for unit ${unit.unitNo} as completed. Blood Bank / Component Charge and Blood Transfusion Charge will be posted to IPD billing.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Complete",
      cancelButtonText: "Cancel"
    }).then((result) => {
      if (result.isConfirmed) {
        const now = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        setReceivedUnits(prev => prev.map(u =>
          u.id === unit.id ? { ...u, status: "Transfusion Completed", completedAt: now } : u
        ))
        Swal.fire({
          title: "Success",
          html: `Transfusion for unit <b>${unit.unitNo}</b> marked COMPLETED.<br/><br/>
                 <div class="text-start ps-4">
                   ✓ Blood Bank / Component Charge (₹1,500 per unit) added<br/>
                   ✓ Blood Transfusion Charge (₹500 per unit) added
                 </div>`,
          icon: "success"
        })
      }
    })
  }

  const getUrgencyBadge = (urgency) => {
    const map = { Routine: "info", Urgent: "warning", Emergency: "danger" }
    return map[urgency] || "secondary"
  }

  const getTrackingBadge = (status) => {
    const map = {
      "Pending": "secondary",
      "Cross Matching": "warning",
      "Compatibility Testing": "info",
      "Ready for Issue": "primary",
      "Issued": "success"
    }
    return map[status] || "secondary"
  }

  const getTransfusionBadge = (status) => {
    const map = {
      "Received in Ward": "info",
      "Transfusion Started": "warning",
      "Transfusion Completed": "success"
    }
    return map[status] || "secondary"
  }

  return (
    <div>
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <button
          className={`btn btn-sm ${activeView === "request" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveView("request")}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
        >
          Blood Request
        </button>
        <button
          className={`btn btn-sm ${activeView === "tracking" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveView("tracking")}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
        >
          Tracking Request ({DUMMY_TRACKING_LIST.length})
        </button>
        <button
          className={`btn btn-sm ${activeView === "pending" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveView("pending")}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
        >
          Pending for Receiving ({pendingUnits.length})
        </button>
        <button
          className={`btn btn-sm ${activeView === "transfusion" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveView("transfusion")}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
        >
          Transfusion ({receivedUnits.length})
        </button>
      </div>

      {activeView === "request" && (
        <div className="card">
          <div className="card-header bg-primary text-white py-2">
            <strong>Blood Requirement Details</strong>
            {selectedPatient && (
              <span className="ms-3 small opacity-75">
                {selectedPatient.patientName} ({selectedPatient.ageGender}) | {selectedPatient.ward} / {selectedPatient.bedNo}
              </span>
            )}
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered table-sm align-middle" style={{ fontSize: "0.75rem" }}>
                <thead className="table-light">
                  <tr>
                    <th>Component Type <span className="text-danger">*</span></th>
                    <th>Units <span className="text-danger">*</span></th>
                    <th>Urgency <span className="text-danger">*</span></th>
                    <th>Required Date &amp; Time <span className="text-danger">*</span></th>
                    <th>Indication</th>
                    <th>Remarks</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requestRows.map(row => (
                    <tr key={row.id}>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={row.componentType}
                          onChange={(e) => handleRowChange(row.id, "componentType", e.target.value)}
                        >
                          <option value="">Select Component</option>
                          {COMPONENT_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          className="form-control form-control-sm"
                          placeholder="Units"
                          value={row.units}
                          onChange={(e) => handleRowChange(row.id, "units", e.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={row.urgency}
                          onChange={(e) => handleRowChange(row.id, "urgency", e.target.value)}
                        >
                          <option value="">Select</option>
                          {URGENCY_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td>
                        <input
                          type="datetime-local"
                          className="form-control form-control-sm"
                          value={row.requiredDateTime}
                          onChange={(e) => handleRowChange(row.id, "requiredDateTime", e.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={row.indication}
                          onChange={(e) => handleRowChange(row.id, "indication", e.target.value)}
                        >
                          <option value="">Select Indication</option>
                          {INDICATION_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Optional remarks"
                          value={row.remarks}
                          onChange={(e) => handleRowChange(row.id, "remarks", e.target.value)}
                        />
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveRow(row.id)}
                          disabled={requestRows.length === 1}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button className="btn btn-success btn-sm mb-3" onClick={handleAddRow}>
              + Add Another Component
            </button>

            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-secondary btn-sm" onClick={handleResetForm}>
                Reset
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleSubmitRequest}>
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {activeView === "tracking" && (
        <div className="table-responsive">
          <table className="table table-bordered table-sm table-hover" style={{ fontSize: "0.72rem" }}>
            <thead className="table-light">
              <tr>
                <th>Request No</th>
                <th>Inpatient No</th>
                <th>Patient Name</th>
                <th>Blood Group</th>
                <th>Component</th>
                <th>Units</th>
                <th>Urgency</th>
                <th>Requested Date &amp; Time</th>
                <th>Requested By (Due Date/Time)</th>
                <th>Tracking Status</th>
              </tr>
            </thead>
            <tbody>
              {DUMMY_TRACKING_LIST.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-3 text-muted">No blood requests found.</td>
                </tr>
              ) : (
                DUMMY_TRACKING_LIST.map(t => (
                  <tr key={t.requestNo}>
                    <td className="fw-bold">{t.requestNo}</td>
                    <td>{t.ipNo}</td>
                    <td>{t.patientName}</td>
                    <td>{t.bloodGroup}</td>
                    <td>{t.component}</td>
                    <td className="text-center fw-bold">{t.units}</td>
                    <td><span className={`badge bg-${getUrgencyBadge(t.urgency)}`}>{t.urgency}</span></td>
                    <td>{t.requestedDateTime}</td>
                    <td>{t.requiredBy}</td>
                    <td><span className={`badge bg-${getTrackingBadge(t.status)}`}>{t.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeView === "pending" && (
        <div className="table-responsive">
          <table className="table table-bordered table-sm table-hover" style={{ fontSize: "0.72rem" }}>
            <thead className="table-light">
              <tr>
                <th>Component</th>
                <th>Group</th>
                <th>Unit / Bag No</th>
                <th>Expiry</th>
                <th>Issued At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingUnits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-3 text-muted">No blood units pending receipt.</td>
                </tr>
              ) : (
                pendingUnits.map(u => (
                  <tr key={u.id}>
                    <td>{u.component}</td>
                    <td>{u.group}</td>
                    <td>{u.unitNo}</td>
                    <td>{u.expiry}</td>
                    <td>{u.issuedAt}</td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => handleOpenReceive(u)}>
                        Receive
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeView === "transfusion" && (
        <div className="table-responsive">
          <table className="table table-bordered table-sm table-hover" style={{ fontSize: "0.72rem" }}>
            <thead className="table-light">
              <tr>
                <th>Component</th>
                <th>Group</th>
                <th>Unit / Bag No</th>
                <th>Expiry</th>
                <th>Received At</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {receivedUnits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-3 text-muted">No received blood units yet.</td>
                </tr>
              ) : (
                receivedUnits.map(u => (
                  <tr key={u.id}>
                    <td>{u.component}</td>
                    <td>{u.group}</td>
                    <td>{u.unitNo}</td>
                    <td>{u.expiry}</td>
                    <td>{u.receivedAt}</td>
                    <td><span className={`badge bg-${getTransfusionBadge(u.status)}`}>{u.status}</span></td>
                    <td>
                      {u.status === "Received in Ward" && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleOpenStart(u)}>
                          Start
                        </button>
                      )}
                      {u.status === "Transfusion Started" && (
                        <button className="btn btn-success btn-sm" onClick={() => handleCompleteTransfusion(u)}>
                          Complete
                        </button>
                      )}
                      {u.status === "Transfusion Completed" && (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showReceiveModal && receiveTarget && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }} onClick={() => setShowReceiveModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header bg-primary text-white py-2">
                <h6 className="modal-title">Receive Blood Unit</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowReceiveModal(false)}></button>
              </div>
              <div className="modal-body">
                <p className="mb-1"><strong>Component:</strong> {receiveTarget.component}</p>
                <p className="mb-1"><strong>Blood Group:</strong> {receiveTarget.group}</p>
                <p className="mb-1"><strong>Unit / Bag No.:</strong> {receiveTarget.unitNo}</p>
                <p className="mb-1"><strong>Expiry Date:</strong> {receiveTarget.expiry}</p>
                <p className="mb-3"><strong>Issued Date/Time:</strong> {receiveTarget.issuedAt}</p>

                <p className="mb-1"><strong>Received Date/Time:</strong> <span className="text-muted"></span></p>
                <p className="mb-3"><strong>Received By:</strong> <span className="text-muted">Nurse A </span></p>

                <label className="form-label small fw-bold">Unit Condition <span className="text-danger">*</span></label>
                <select
                  className="form-select form-select-sm mb-3"
                  value={unitCondition}
                  onChange={(e) => setUnitCondition(e.target.value)}
                >
                  <option value="Acceptable">Acceptable</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Leaking">Leaking</option>
                  <option value="Temperature Excursion">Temperature Excursion</option>
                </select>

                <label className="form-label small fw-bold">Remarks</label>
                <textarea
                  className="form-control form-control-sm"
                  rows={2}
                  placeholder="Optional remarks"
                  value={receiveRemarks}
                  onChange={(e) => setReceiveRemarks(e.target.value)}
                />
              </div>
              <div className="modal-footer py-2">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowReceiveModal(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleConfirmReceipt}>Confirm Receipt</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showStartModal && transfusionTarget && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }} onClick={() => setShowStartModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header bg-primary text-white py-2">
                <h6 className="modal-title">Start Transfusion</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowStartModal(false)}></button>
              </div>
              <div className="modal-body">
                <p className="mb-1"><strong>Component:</strong> {transfusionTarget.component}</p>
                <p className="mb-1"><strong>Blood Group:</strong> {transfusionTarget.group}</p>
                <p className="mb-1"><strong>Unit / Bag No.:</strong> {transfusionTarget.unitNo}</p>
                <p className="mb-3"><strong>Expiry Date:</strong> {transfusionTarget.expiry}</p>

                <label className="form-label small fw-bold">Verified By <span className="text-danger">*</span></label>
                <select
                  className="form-select form-select-sm mb-3"
                  value={verifiedBy}
                  onChange={(e) => setVerifiedBy(e.target.value)}
                >
                  <option value="">Select Nurse / User</option>
                  <option value="Nurse A">Nurse A</option>
                  <option value="Nurse B">Nurse B</option>
                  <option value="Dr. Mehta">Dr. Mehta</option>
                </select>

                <label className="form-label small fw-bold mb-2">Pre-Transfusion Vitals</label>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small">Temperature (°F)</label>
                    <input type="text" className="form-control form-control-sm" value={vitals.temperature} onChange={(e) => handleVitalsChange("temperature", e.target.value)} />
                  </div>
                  <div className="col-6">
                    <label className="form-label small">Pulse (bpm)</label>
                    <input type="text" className="form-control form-control-sm" value={vitals.pulse} onChange={(e) => handleVitalsChange("pulse", e.target.value)} />
                  </div>
                  <div className="col-6">
                    <label className="form-label small">BP Systolic</label>
                    <input type="text" className="form-control form-control-sm" value={vitals.bpSys} onChange={(e) => handleVitalsChange("bpSys", e.target.value)} />
                  </div>
                  <div className="col-6">
                    <label className="form-label small">BP Diastolic</label>
                    <input type="text" className="form-control form-control-sm" value={vitals.bpDia} onChange={(e) => handleVitalsChange("bpDia", e.target.value)} />
                  </div>
                  <div className="col-6">
                    <label className="form-label small">Respiratory Rate (/min)</label>
                    <input type="text" className="form-control form-control-sm" value={vitals.respRate} onChange={(e) => handleVitalsChange("respRate", e.target.value)} />
                  </div>
                  <div className="col-6">
                    <label className="form-label small">SpO₂ (%)</label>
                    <input type="text" className="form-control form-control-sm" value={vitals.spo2} onChange={(e) => handleVitalsChange("spo2", e.target.value)} />
                  </div>
                </div>

                <label className="form-label small fw-bold">Remarks</label>
                <textarea
                  className="form-control form-control-sm"
                  rows={2}
                  placeholder="Optional remarks"
                  value={transfusionRemarks}
                  onChange={(e) => setTransfusionRemarks(e.target.value)}
                />
              </div>
              <div className="modal-footer py-2">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowStartModal(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleStartTransfusion}>Start Transfusion</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BloodTransfusion