import { useState } from "react"

// ─── STATUS FLOW ─────────────────────────────────────────────
// Requested (Ward 1) → Pending Acceptance (Ward 2) → Accepted (Ward 2) → Completed
// Cancel available at Requested / Pending Acceptance

const TRANSFER_STATUS = {
  REQUESTED: "Requested",
  PENDING: "Pending Acceptance",
  ACCEPTED: "Accepted",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled"
}

const TRANSFER_REASONS_MASTER = [
  { id: 1, reason: "Clinical Condition" },
  { id: 2, reason: "Patient Request" },
  { id: 3, reason: "Bed Management" },
  { id: 4, reason: "Other" }
]

const WARDS_MASTER = [
  { id: 1, name: "General Ward - 1", beds: ["GW1-B01", "GW1-B02", "GW1-B03", "GW1-B04", "GW1-B05"] },
  { id: 2, name: "General Ward - 2", beds: ["GW2-B01", "GW2-B02", "GW2-B03", "GW2-B04"] },
  { id: 3, name: "ICU", beds: ["ICU-B01", "ICU-B02", "ICU-B03"] },
  { id: 4, name: "Isolation Ward", beds: ["ISO-B01", "ISO-B02"] },
  { id: 5, name: "Deluxe Ward", beds: ["DLX-B01", "DLX-B02", "DLX-B03"] }
]

const DOCTORS_MASTER = [
  "Dr. Anita Sharma",
  "Dr. Rahul Verma",
  "Dr. Priya Menon",
  "Dr. Kavita Nair",
  "Dr. Amit Gupta"
]

const BedTransfer = ({ selectedPatient, setSelectedPatient }) => {
  const [activeView, setActiveView] = useState("request") // "request" | "pendingList" | "transferredList"
  const [selectedPendingTransfer, setSelectedPendingTransfer] = useState(null) // for detail view
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelTargetId, setCancelTargetId] = useState(null)
  const [cancelRemarks, setCancelRemarks] = useState("")
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewTransfer, setReviewTransfer] = useState(null)
  const [reviewAllocatedBed, setReviewAllocatedBed] = useState("")
  
  // Store selected beds for each pending transfer (in detail view)
  const [selectedBedForTransfer, setSelectedBedForTransfer] = useState("")

  // Request form
  const [requestForm, setRequestForm] = useState({
    targetWardId: "",
    targetBed: "",
    doctorInCharge: "",
    reason: "",
    otherReason: "",
    priority: "Normal",
    clinicalNotes: ""
  })

  // Transfer list (tx table: ip_transfer_request)
  const [transfers, setTransfers] = useState([
    {
      id: 1,
      trfNo: "TRF000121",
      transferDate: "2026-03-24T08:45",
      patientName: "Ramesh Kumar",
      gender: "M", age: 56,
      admissionNo: "ADM1023",
      admissionDate: "2026-03-22",
      fromWard: "General Ward - 1", fromBed: "GW1-B04",
      targetWard: "ICU", targetBed: "ICU-B02",
      allocatedBed: "",
      doctorInCharge: "Dr. Sharma",
      reason: "Clinical Condition",
      priority: "Emergency",
      clinicalNotes: "Patient requires ICU monitoring due to oxygen drop.",
      status: TRANSFER_STATUS.COMPLETED,
      cancelRemarks: ""
    },
    {
      id: 2,
      trfNo: "TRF000122",
      transferDate: "2026-03-24T09:10",
      patientName: "Sita Devi",
      gender: "F", age: 62,
      admissionNo: "ADM1045",
      admissionDate: "2026-03-23",
      fromWard: "General Ward - 2", fromBed: "GW2-B02",
      targetWard: "General Ward - 1", targetBed: "GW1-B03",
      allocatedBed: "",
      doctorInCharge: "Dr. Anita Sharma",
      reason: "Patient Request",
      priority: "Normal",
      clinicalNotes: "Patient requested shift closer to family.",
      status: TRANSFER_STATUS.PENDING,
      cancelRemarks: ""
    },
    {
      id: 3,
      trfNo: "TRF000123",
      transferDate: "2026-03-24T09:25",
      patientName: "Mohan Singh",
      gender: "M", age: 48,
      admissionNo: "ADM1050",
      admissionDate: "2026-03-24",
      fromWard: "Emergency", fromBed: "ER-B01",
      targetWard: "ICU", targetBed: "ICU-B01",
      allocatedBed: "",
      doctorInCharge: "Dr. Priya Menon",
      reason: "Bed Management",
      priority: "Normal",
      clinicalNotes: "Shifting from ER to main ward.",
      status: TRANSFER_STATUS.REQUESTED,
      cancelRemarks: ""
    }
  ])

  const generateTRFNo = () => {
    const maxId = transfers.length > 0 ? Math.max(...transfers.map(t => parseInt(t.trfNo.replace("TRF", "")))) : 0
    return "TRF" + String(maxId + 1).padStart(6, "0")
  }

  const formatDateTime = (str) => {
    if (!str) return ""
    return new Date(str).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (str) => {
    if (!str) return ""
    return new Date(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const handleRequestFormChange = (e) => {
    const { name, value } = e.target
    setRequestForm(prev => ({ ...prev, [name]: value, ...(name === "targetWardId" ? { targetBed: "" } : {}) }))
  }

  const selectedWard = WARDS_MASTER.find(w => w.id === parseInt(requestForm.targetWardId))

  const handleSubmitRequest = () => {
    if (!requestForm.targetWardId || !requestForm.doctorInCharge || !requestForm.reason) {
      alert("Please fill Target Ward, Doctor In Charge, and Reason")
      return
    }
    const ward = WARDS_MASTER.find(w => w.id === parseInt(requestForm.targetWardId))
    const now = new Date().toISOString()
    const newTransfer = {
      id: transfers.length + 1,
      trfNo: generateTRFNo(),
      transferDate: now,
      patientName: selectedPatient?.patientName || "Unknown Patient",
      gender: selectedPatient?.ageGender?.split("/")[1]?.trim() || "M",
      age: selectedPatient?.ageGender?.split("/")[0]?.trim() || "",
      admissionNo: selectedPatient?.admissionNo || "",
      admissionDate: selectedPatient?.admissionDate || "",
      fromWard: selectedPatient?.ward || "",
      fromBed: selectedPatient?.bedNo || "",
      targetWard: ward?.name || "",
      targetBed: requestForm.targetBed || "",
      allocatedBed: "",
      doctorInCharge: requestForm.doctorInCharge,
      reason: requestForm.reason === "Other" ? requestForm.otherReason : requestForm.reason,
      priority: requestForm.priority,
      clinicalNotes: requestForm.clinicalNotes,
      status: TRANSFER_STATUS.REQUESTED,
      cancelRemarks: ""
    }
    setTransfers([newTransfer, ...transfers])
    setRequestForm({ targetWardId: "", targetBed: "", doctorInCharge: "", reason: "", otherReason: "", priority: "Normal", clinicalNotes: "" })
    alert(`Transfer Request ${newTransfer.trfNo} submitted successfully!`)
    setActiveView("pendingList")
  }

  const handleOpenReview = (transfer) => {
    setReviewTransfer(transfer)
    setReviewAllocatedBed(transfer.targetBed || "")
    setShowReviewModal(true)
  }

  const handleAccept = () => {
    if (!reviewAllocatedBed) { alert("Please allocate a bed before accepting"); return }
    
    setTransfers(prev => prev.map(t =>
      t.id === reviewTransfer.id
        ? { ...t, status: TRANSFER_STATUS.ACCEPTED, allocatedBed: reviewAllocatedBed }
        : t
    ))
    
    if (setSelectedPatient && selectedPatient && selectedPatient.admissionNo === reviewTransfer.admissionNo) {
      const updatedPatient = {
        ...selectedPatient,
        ward: reviewTransfer.targetWard,
        bedNo: reviewAllocatedBed
      }
      setSelectedPatient(updatedPatient)
    }
    
    alert(`Transfer ${reviewTransfer.trfNo} ACCEPTED. Bed ${reviewAllocatedBed} allocated.\n\n✓ ip_transfer_request updated to ACCEPTED\n✓ ip_bed_allocation new entry created\n✓ Main inpatient table Ward/Bed updated\n✓ Billing table updated (ward change)`)
    
    setShowReviewModal(false)
    setReviewTransfer(null)
    setActiveView("pendingList")
    setSelectedPendingTransfer(null)
  }

  const handleMarkCompleted = (id) => {
    setTransfers(prev => prev.map(t => t.id === id ? { ...t, status: TRANSFER_STATUS.COMPLETED } : t))
  }

  const handleOpenCancel = (id) => {
    setCancelTargetId(id)
    setCancelRemarks("")
    setShowCancelModal(true)
  }

  const handleConfirmCancel = () => {
    if (!cancelRemarks.trim()) { alert("Please enter cancel remarks"); return }
    setTransfers(prev => prev.map(t =>
      t.id === cancelTargetId
        ? { ...t, status: TRANSFER_STATUS.CANCELLED, cancelRemarks }
        : t
    ))
    setShowCancelModal(false)
    setCancelTargetId(null)
    alert("Transfer cancelled. Main inpatient record NOT changed.")
    // If we were viewing a pending transfer detail, go back to list
    if (selectedPendingTransfer) {
      setSelectedPendingTransfer(null)
      setActiveView("pendingList")
    }
  }

  const handleAcceptTransfer = (transfer, allocatedBed) => {
    if (!allocatedBed) {
      alert("Please allocate a bed before accepting")
      return
    }
    
    setTransfers(prev => prev.map(t =>
      t.id === transfer.id
        ? { ...t, status: TRANSFER_STATUS.ACCEPTED, allocatedBed: allocatedBed }
        : t
    ))
    
    if (setSelectedPatient && selectedPatient && selectedPatient.admissionNo === transfer.admissionNo) {
      const updatedPatient = {
        ...selectedPatient,
        ward: transfer.targetWard,
        bedNo: allocatedBed
      }
      setSelectedPatient(updatedPatient)
    }
    
    alert(`Transfer ${transfer.trfNo} ACCEPTED. Bed ${allocatedBed} allocated.\n\n✓ Main inpatient table Ward/Bed updated`)
    setActiveView("pendingList")
    setSelectedPendingTransfer(null)
  }

  const getStatusBadge = (status) => {
    const map = {
      [TRANSFER_STATUS.REQUESTED]: "warning",
      [TRANSFER_STATUS.PENDING]: "info",
      [TRANSFER_STATUS.ACCEPTED]: "primary",
      [TRANSFER_STATUS.COMPLETED]: "success",
      [TRANSFER_STATUS.CANCELLED]: "secondary"
    }
    return map[status] || "secondary"
  }

  const getStatusIcon = (status) => {
    const map = {
      [TRANSFER_STATUS.REQUESTED]: "⏳",
      [TRANSFER_STATUS.PENDING]: "🔵",
      [TRANSFER_STATUS.ACCEPTED]: "✅",
      [TRANSFER_STATUS.COMPLETED]: "🏁",
      [TRANSFER_STATUS.CANCELLED]: "❌"
    }
    return map[status] || "•"
  }

  const reviewWard = reviewTransfer ? WARDS_MASTER.find(w => w.name === reviewTransfer.targetWard) : null

  // Filter transfers
  const pendingTransfers = transfers.filter(t => t.status === TRANSFER_STATUS.PENDING || t.status === TRANSFER_STATUS.REQUESTED)
  const transferredList = transfers.filter(t => 
    t.status === TRANSFER_STATUS.ACCEPTED || 
    t.status === TRANSFER_STATUS.COMPLETED || 
    t.status === TRANSFER_STATUS.CANCELLED
  )

  // Detail view for a pending transfer
  const renderPendingDetail = (transfer) => {
    const targetWardDetails = WARDS_MASTER.find(w => w.name === transfer.targetWard)
    const currentSelectedBed = selectedBedForTransfer || transfer.targetBed || ""

    return (
      <div>
        <div className="mb-3">
          <button 
            className="btn btn-outline-secondary btn-sm"
            onClick={() => {
              setSelectedPendingTransfer(null)
              setActiveView("pendingList")
              setSelectedBedForTransfer("")
            }}
          >
            ← Back to Pending List
          </button>
        </div>
        <div className="card">
          <div className="card-header bg-info text-white">
            <strong>TRANSFER DETAILS</strong>
            <span className="ms-2 small opacity-75">{transfer.trfNo}</span>
          </div>
          <div className="card-body">
            <div className="row g-2">
              <div className="col-md-6">
                <p className="mb-1"><strong>Transfer No:</strong> {transfer.trfNo}</p>
                <p className="mb-1"><strong>Date/Time:</strong> {formatDateTime(transfer.transferDate)}</p>
                <p className="mb-1"><strong>Patient:</strong> {transfer.patientName}</p>
                <p className="mb-1"><strong>UHID:</strong> {transfer.admissionNo}</p>
              </div>
              <div className="col-md-6">
                <p className="mb-1"><strong>From:</strong> {transfer.fromWard} / {transfer.fromBed}</p>
                <p className="mb-1"><strong>To (Requested):</strong> {transfer.targetWard} / {transfer.targetBed || "TBD"}</p>
                <p className="mb-1"><strong>Doctor:</strong> {transfer.doctorInCharge}</p>
                <p className="mb-1"><strong>Reason:</strong> {transfer.reason}</p>
              </div>
              <div className="col-12">
                <strong>Clinical Notes:</strong>
                <p className="text-muted mb-2">{transfer.clinicalNotes || "—"}</p>
              </div>
              
              <div className="col-12 mt-2">
                <div className="border rounded p-3 bg-light">
                  <label className="form-label fw-bold mb-2">
                    Allocate Bed in {transfer.targetWard}
                  </label>
                  <select
                    className="form-select form-select-sm mb-2"
                    value={currentSelectedBed}
                    onChange={(e) => setSelectedBedForTransfer(e.target.value)}
                  >
                    <option value="">Select Bed</option>
                    {targetWardDetails?.beds.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="card-footer bg-white">
            <button 
              className="btn btn-success btn-sm me-2"
              onClick={() => handleAcceptTransfer(transfer, currentSelectedBed)}
            >
              Accept Transfer
            </button>
            <button 
              className="btn btn-danger btn-sm"
              onClick={() => handleOpenCancel(transfer.id)}
            >
              Reject Transfer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* ─── TAB TOGGLE ─── */}
      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-sm ${activeView === "request" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => {
            setActiveView("request")
            setSelectedPendingTransfer(null)
            
          }}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
        >
          New Transfer Request
        </button>
        <button
          className={`btn btn-sm ${activeView === "pendingList" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => {
            setActiveView("pendingList")
            setSelectedPendingTransfer(null)
          }}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
        >
          Pending for Transfer ({pendingTransfers.length})
        </button>
        <button
          className={`btn btn-sm ${activeView === "transferredList" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => {
            setActiveView("transferredList")
            setSelectedPendingTransfer(null)
          }}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
        >
          Transferred List ({transferredList.length})
        </button>
      </div>

      {/* ─── NEW REQUEST FORM ─── */}
      {activeView === "request" && (
        <div className="card">
          <div className="card-header bg-primary text-white py-2">
            <strong>BED TRANSFER REQUEST</strong>
            <span className="ms-3 small opacity-75">[{generateTRFNo()}] | {formatDateTime(new Date().toISOString())}</span>
          </div>
          <div className="card-body">
            {selectedPatient && (
              <div className="row g-2 mb-3 p-2 bg-light rounded">
                <div className="col-md-12 small">
                  <strong>Patient:</strong> {selectedPatient.patientName} ({selectedPatient.ageGender}) | 
                  <strong> UHID:</strong> {selectedPatient.admissionNo} | 
                  <strong> Current Location:</strong> {selectedPatient.ward} / {selectedPatient.bedNo}
                </div>
              </div>
            )}

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-bold">Target Ward</label>
                <select className="form-select form-select-sm" name="targetWardId" value={requestForm.targetWardId} onChange={handleRequestFormChange}>
                  <option value="">Select Ward </option>
                  {WARDS_MASTER.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">Preferred Bed</label>
                <select className="form-select form-select-sm" name="targetBed" value={requestForm.targetBed} onChange={handleRequestFormChange} disabled={!selectedWard}>
                  <option value="">Any Available</option>
                  {selectedWard?.beds.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">Doctor In Charge <span className="text-danger">*</span></label>
                <select className="form-select form-select-sm" name="doctorInCharge" value={requestForm.doctorInCharge} onChange={handleRequestFormChange}>
                  <option value=""> Select Doctor </option>
                  {DOCTORS_MASTER.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">Priority</label>
                <div className="d-flex gap-3">
                  {["Normal", "Emergency"].map(p => (
                    <div className="form-check" key={p}>
                      <input
                        className="form-check-input"
                        type="radio"
                        name="priority"
                        value={p}
                        checked={requestForm.priority === p}
                        onChange={handleRequestFormChange}
                      />
                      <label className="form-check-label small">{p}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-12">
                <label className="form-label small fw-bold">Reason for Transfer</label>
                <div className="d-flex gap-3 flex-wrap mb-2">
                  {TRANSFER_REASONS_MASTER.map(r => (
                    <div className="form-check" key={r.id}>
                      <input
                        className="form-check-input"
                        type="radio"
                        name="reason"
                        value={r.reason}
                        checked={requestForm.reason === r.reason}
                        onChange={handleRequestFormChange}
                      />
                      <label className="form-check-label small">{r.reason}</label>
                    </div>
                  ))}
                </div>
                {requestForm.reason === "Other" && (
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Please specify..."
                    name="otherReason"
                    value={requestForm.otherReason}
                    onChange={handleRequestFormChange}
                  />
                )}
              </div>

              <div className="col-12">
                <label className="form-label small fw-bold">Clinical Notes</label>
                <textarea
                  className="form-control form-control-sm"
                  rows={2}
                  placeholder="Add any clinical notes or remarks..."
                  name="clinicalNotes"
                  value={requestForm.clinicalNotes}
                  onChange={handleRequestFormChange}
                />
              </div>

              <div className="col-12">
                <button className="btn btn-primary btn-sm me-2" onClick={handleSubmitRequest}>
                  Submit Request
                </button>
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setRequestForm({ targetWardId: "", targetBed: "", doctorInCharge: "", reason: "", otherReason: "", priority: "Normal", clinicalNotes: "" })}>
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PENDING FOR TRANSFER LIST (clickable rows) ─── */}
      {activeView === "pendingList" && !selectedPendingTransfer && (
        <div>
          <div className="table-responsive">
            <table className="table table-bordered table-sm table-hover" style={{ fontSize: "0.72rem" }}>
              <thead className="">
                <tr>
                  <th>TRF No</th>
                  <th>Transfer Date/Time</th>
                  <th>Patient Name</th>
                  <th>Gender/Age</th>
                  <th>Admission No / Date</th>
                  <th>From Ward/Bed</th>
                  <th>To Ward</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingTransfers.map(t => (
                  <tr 
                    key={t.id} 
                    style={{ cursor: "pointer" }} 
                    onClick={() => {
                      setSelectedPendingTransfer(t)
                      setSelectedBedForTransfer(t.targetBed || "")
                    }}
                  >
                    <td >{t.trfNo}</td>
                    <td>{formatDateTime(t.transferDate)}</td>
                    <td>{t.patientName}</td>
                    <td>{t.gender} / {t.age}</td>
                    <td>{t.admissionNo} / {formatDate(t.admissionDate)}</td>
                    <td>{t.fromWard} / {t.fromBed}</td>
                    <td>{t.targetWard}</td>
                    <td>{t.reason}</td>
                    <td>
                      <span className={`badge bg-${getStatusBadge(t.status)}`}>
                         {t.status}
                      </span>
                      {t.cancelRemarks && <div className="text-muted mt-1" style={{ fontSize: "0.6rem" }}>Note: {t.cancelRemarks}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── PENDING TRANSFER DETAIL VIEW ─── */}
      {activeView === "pendingList" && selectedPendingTransfer && renderPendingDetail(selectedPendingTransfer)}

      {/* ─── TRANSFERRED LIST (history) ─── */}
      {activeView === "transferredList" && (
        <div>
          <div className="table-responsive">
            <table className="table table-bordered table-sm table-hover" >
              <thead className="">
                <tr>
                  <th>TRF No</th>
                  <th>Transfer Date/Time</th>
                  <th>Patient Name</th>
                  <th>Gender/Age</th>
                  <th>Admission No / Date</th>
                  <th>From Ward/Bed</th>
                  <th>To Ward</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transferredList.map(t => (
                  <tr key={t.id}>
                    <td >{t.trfNo}</td>
                    <td>{formatDateTime(t.transferDate)}</td>
                    <td>{t.patientName}</td>
                    <td>{t.gender} / {t.age}</td>
                    <td>{t.admissionNo} / {formatDate(t.admissionDate)}</td>
                    <td>{t.fromWard} / {t.fromBed}</td>
                    <td>{t.targetWard} {t.allocatedBed ? `/ ${t.allocatedBed}` : ""}</td>
                    <td>{t.reason}</td>
                    <td>
                      <span >
                         {t.status}
                      </span>
                      {t.cancelRemarks && <div className="text-muted mt-1" >Note: {t.cancelRemarks}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── REVIEW / ACCEPT MODAL (backup, kept for compatibility) ─── */}
      {showReviewModal && reviewTransfer && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }} onClick={() => setShowReviewModal(false)}>
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h6 className="modal-title">🔍 TRANSFER DETAILS — {reviewTransfer.trfNo}</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowReviewModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-2">
                  <div className="col-md-6">
                    <p className="mb-1"><strong>Transfer No:</strong> {reviewTransfer.trfNo}</p>
                    <p className="mb-1"><strong>Date/Time:</strong> {formatDateTime(reviewTransfer.transferDate)}</p>
                    <p className="mb-1"><strong>Patient:</strong> {reviewTransfer.patientName}</p>
                    <p className="mb-1"><strong>UHID:</strong> {reviewTransfer.admissionNo}</p>
                  </div>
                  <div className="col-md-6">
                    <p className="mb-1"><strong>From:</strong> {reviewTransfer.fromWard} / {reviewTransfer.fromBed}</p>
                    <p className="mb-1"><strong>To (Requested):</strong> {reviewTransfer.targetWard} / {reviewTransfer.targetBed || "TBD"}</p>
                    <p className="mb-1"><strong>Doctor:</strong> {reviewTransfer.doctorInCharge}</p>
                    <p className="mb-1"><strong>Reason:</strong> {reviewTransfer.reason}</p>
                    <p className="mb-1"><strong>Priority:</strong> <span className={`badge ${reviewTransfer.priority === "Emergency" ? "bg-danger" : "bg-secondary"}`}>{reviewTransfer.priority}</span></p>
                    <p className="mb-1"><strong>Status:</strong> <span className={`badge bg-${getStatusBadge(reviewTransfer.status)}`}>{reviewTransfer.status}</span></p>
                  </div>
                  <div className="col-12">
                    <strong>Clinical Notes:</strong>
                    <p className="text-muted mb-0">{reviewTransfer.clinicalNotes || "—"}</p>
                  </div>
                </div>

                {reviewTransfer.status === TRANSFER_STATUS.PENDING && (
                  <div className="mt-3 p-3 bg-light rounded border border-success">
                    <label className="form-label fw-bold text-success">
                      Allocate Bed in {reviewTransfer.targetWard}
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={reviewAllocatedBed}
                      onChange={e => setReviewAllocatedBed(e.target.value)}
                    >
                      <option value="">Select Bed </option>
                      {(reviewWard?.beds || []).map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                )}

                {reviewTransfer.allocatedBed && (
                  <div className="mt-2 p-2 bg-success bg-opacity-10 rounded">
                    <strong>Allocated Bed:</strong> {reviewTransfer.allocatedBed}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                {reviewTransfer.status === TRANSFER_STATUS.PENDING && (
                  <>
                    <button className="btn btn-success btn-sm" onClick={handleAccept}>
                      ✅ Accept & Allocate Bed
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => { setShowReviewModal(false); handleOpenCancel(reviewTransfer.id) }}>
                      ❌ Reject / Cancel
                    </button>
                  </>
                )}
                <button className="btn btn-secondary btn-sm" onClick={() => setShowReviewModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CANCEL MODAL ─── */}
      {showCancelModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }} onClick={() => setShowCancelModal(false)}>
          <div className="modal-dialog modal-sm modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header bg-danger text-white py-2">
                <h6 className="modal-title">Cancel / Reject Transfer</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCancelModal(false)}></button>
              </div>
              <div className="modal-body">
                <label className="form-label small fw-bold">Cancel Remarks <span className="text-danger">*</span></label>
                <textarea
                  className="form-control form-control-sm"
                  rows={3}
                  placeholder="Enter reason for cancellation..."
                  value={cancelRemarks}
                  onChange={e => setCancelRemarks(e.target.value)}
                />
                <div className="small text-muted mt-2">Main inpatient record will NOT be updated on cancellation.</div>
              </div>
              <div className="modal-footer py-2">
                <button className="btn btn-danger btn-sm" onClick={handleConfirmCancel}>Confirm Cancel</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowCancelModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BedTransfer