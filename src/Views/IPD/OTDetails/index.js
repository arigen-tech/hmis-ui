import { useState } from "react"
import Swal from "sweetalert2"

// ─── STATUS FLOW ─────────────────────────────────────────────
// Scheduled → Sent to OT → Received in OT → In Recovery / PACU → Sent to Ward/ICU → Reported to Ward

const OT_STATUS = {
  SCHEDULED: "Scheduled",
  SENT_TO_OT: "Sent to OT",
  RECEIVED_IN_OT: "Received in OT",
  IN_RECOVERY: "In Recovery / PACU",
  SENT_TO_WARD: "Sent to Ward/ICU",
  REPORTED_TO_WARD: "Reported to Ward"
}

// ─── DUMMY BOOKING DATA ─────────────────────────────────────
const DUMMY_BOOKING = {
  surgery: "Total Knee Replacement",
  surgeryType: "Orthopaedic Surgery",
  majorMinor: "Major",
  surgeon: "Dr. Sharma",
  otRoom: "Main OT-01",
  surgeryDate: "20-Aug-2026",
  scheduledTime: "10:00 AM - 12:00 PM",
  priority: "Elective",
  otStatus: "SCHEDULED"
}

const DUMMY_ANAESTHESIA = {
  anaesthesiaType: "Spinal Anaesthesia",
  anaesthetist: "Dr. Kumar",
  anaesthesiaStatus: "Cleared",
  instructions: [
    "Keep patient NPO after 12:00 midnight",
    "Ensure IV access",
    "Review latest CBC and coagulation profile",
    "Arrange one unit PRBC if required"
  ]
}

const DUMMY_READINESS = {
  bookingConfirmed: true,
  investigationsAvailable: true,
  bloodUnitsArranged: true,
  requestNotCancelled: true
}

const OTDetails = ({ selectedPatient, selectedWard }) => {
  // ─── OT PREPARATION FORM ─────────────────────────────────
  const [preparation, setPreparation] = useState({
    npoSinceDate: "",
    npoSinceTime: "",
    consentAvailable: "",
    patientPrepared: "",
    preOpMedication: "",
    remarks: ""
  })
  const [preparationSaved, setPreparationSaved] = useState(false)

  const handlePreparationChange = (field, value) => {
    setPreparation(prev => ({ ...prev, [field]: value }))
  }

  const handleSavePreparation = () => {
    if (!preparation.npoSinceDate || !preparation.consentAvailable || !preparation.patientPrepared || !preparation.preOpMedication) {
      Swal.fire({
        title: "Warning",
        text: "Please fill all required OT preparation fields.",
        icon: "warning"
      })
      return
    }
    setPreparationSaved(true)
    Swal.fire({
      title: "Success",
      text: "OT Preparation saved successfully.",
      icon: "success"
    })
  }

  // ─── EMERGENCY OVERRIDE ───────────────────────────────────
  const [isEmergency, setIsEmergency] = useState(false)
  const [overrideReason, setOverrideReason] = useState("")

  // ─── PATIENT MOVEMENT / AUDIT TRAIL ──────────────────────
  const [currentStatus, setCurrentStatus] = useState(OT_STATUS.SCHEDULED)
  const [movementHistory, setMovementHistory] = useState([])

  const addHistory = (event, by, details) => {
    const now = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    setMovementHistory(prev => [...prev, { event, by, dateTime: now, details }])
  }

  // Readiness checklist derived from preparation + booking + anaesthesia
  const readinessChecklist = [
    { label: "OT Booking Scheduled / Confirmed", met: DUMMY_READINESS.bookingConfirmed },
    { label: "Anaesthesia Clearance", met: DUMMY_ANAESTHESIA.anaesthesiaStatus === "Cleared" },
    { label: "Pre-OT Preparation Completed", met: preparationSaved },
    { label: "Consent Available / Confirmed", met: preparation.consentAvailable === "Yes" },
    { label: "NPO Status Confirmed", met: !!preparation.npoSinceDate },
    { label: "Required Investigations Available", met: DUMMY_READINESS.investigationsAvailable },
    { label: "Required Blood Units Arranged", met: DUMMY_READINESS.bloodUnitsArranged },
    { label: "Pre-Op Medication Given / N/A", met: preparation.preOpMedication === "Given" || preparation.preOpMedication === "N/A" },
    { label: "OT Request Not Cancelled / Postponed", met: DUMMY_READINESS.requestNotCancelled }
  ]

  const allReady = readinessChecklist.every(c => c.met)
  const canSendToOT = allReady || (isEmergency && overrideReason.trim().length > 0)

  const handleSendToOT = () => {
    if (!allReady && !isEmergency) {
      Swal.fire({
        title: "Cannot Send to OT",
        text: "All readiness checklist items must be completed, or mark this as an Emergency OT with an override reason.",
        icon: "warning"
      })
      return
    }
    if (isEmergency && !allReady && !overrideReason.trim()) {
      Swal.fire({
        title: "Warning",
        text: "Please enter an override reason for the unmet readiness criteria.",
        icon: "warning"
      })
      return
    }

    const fromWardBed = `${selectedWard?.wardName || selectedPatient?.ward || "Ward"} / ${selectedPatient?.bedNo || ""}`

    Swal.fire({
      title: "Send Patient to OT?",
      html: `Destination: <b>${DUMMY_BOOKING.otRoom}</b><br/>From: <b>${fromWardBed}</b>${!allReady && isEmergency ? `<br/><span class="text-danger">Emergency override in effect</span>` : ""}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Send to OT",
      cancelButtonText: "Cancel"
    }).then((result) => {
      if (result.isConfirmed) {
        setCurrentStatus(OT_STATUS.SENT_TO_OT)
        addHistory(
          "Sent to OT",
          "Nurse A",
          !allReady && isEmergency
            ? `From ${fromWardBed} to ${DUMMY_BOOKING.otRoom}. Emergency override reason: ${overrideReason}`
            : `From ${fromWardBed} to ${DUMMY_BOOKING.otRoom}`
        )
        Swal.fire({
          title: "Success",
          text: "Patient sent to OT. Bed remains reserved.",
          icon: "success"
        })
      }
    })
  }

  const handleReceivedInOT = () => {
    setCurrentStatus(OT_STATUS.RECEIVED_IN_OT)
    addHistory("Received in OT", "OT Nurse", `Received at ${DUMMY_BOOKING.otRoom}`)
  }

  const handleInRecovery = () => {
    setCurrentStatus(OT_STATUS.IN_RECOVERY)
    addHistory("Moved to Recovery / PACU", "OT Nurse", "Surgery completed")
  }

  const handleSentToWard = () => {
    setCurrentStatus(OT_STATUS.SENT_TO_WARD)
    addHistory("Sent to Ward/ICU", "PACU Nurse", "Patient appears in destination ward's Pending Transfers")
  }

  const handleReceivedInWard = () => {
    setCurrentStatus(OT_STATUS.REPORTED_TO_WARD)
    addHistory("Reported to Ward", "Nurse A", "Status returned to RW - Reported to Ward")
  }

  const getStatusBadge = (status) => {
    const map = {
      [OT_STATUS.SCHEDULED]: "secondary",
      [OT_STATUS.SENT_TO_OT]: "warning",
      [OT_STATUS.RECEIVED_IN_OT]: "info",
      [OT_STATUS.IN_RECOVERY]: "primary",
      [OT_STATUS.SENT_TO_WARD]: "warning",
      [OT_STATUS.REPORTED_TO_WARD]: "success"
    }
    return map[status] || "secondary"
  }

  return (
    <div>
       

          {/* ─── SURGERY / BOOKING (read-only) ─── */}
          <div className="mb-4">
            <h6 className="fw-bold border-bottom pb-1 mb-3">Surgery / Booking</h6>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label small text-muted mb-1">Surgery</label>
                <div className="fw-semibold">{DUMMY_BOOKING.surgery}</div>
              </div>
              <div className="col-md-4">
                <label className="form-label small text-muted mb-1">Surgery Type</label>
                <div className="fw-semibold">{DUMMY_BOOKING.surgeryType}</div>
              </div>
              <div className="col-md-4">
                <label className="form-label small text-muted mb-1">Major / Minor</label>
                <div className="fw-semibold">{DUMMY_BOOKING.majorMinor}</div>
              </div>
              <div className="col-md-4">
                <label className="form-label small text-muted mb-1">Surgeon</label>
                <div className="fw-semibold">{DUMMY_BOOKING.surgeon}</div>
              </div>
              <div className="col-md-4">
                <label className="form-label small text-muted mb-1">OT</label>
                <div className="fw-semibold">{DUMMY_BOOKING.otRoom}</div>
              </div>
              <div className="col-md-4">
                <label className="form-label small text-muted mb-1">Priority</label>
                <div>{DUMMY_BOOKING.priority}
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label small text-muted mb-1">Surgery Date</label>
                <div className="fw-semibold">{DUMMY_BOOKING.surgeryDate}</div>
              </div>
              <div className="col-md-4">
                <label className="form-label small text-muted mb-1">Scheduled Time</label>
                <div className="fw-semibold">{DUMMY_BOOKING.scheduledTime}</div>
              </div>
              <div className="col-md-4">
                <label className="form-label small text-muted mb-1">OT Status</label>
                <div>{DUMMY_BOOKING.otStatus}</div>
              </div>
            </div>
          </div>

          {/* ─── PRE-ANAESTHESIA (read-only) ─── */}
          <div className="mb-4">
            <h6 className="fw-bold border-bottom pb-1 mb-3">Pre-Anaesthesia</h6>
            <div className="row g-3 mb-2">
              <div className="col-md-4">
                <label className="form-label small text-muted mb-1">Anaesthesia Type</label>
                <div className="fw-semibold">{DUMMY_ANAESTHESIA.anaesthesiaType}</div>
              </div>
              <div className="col-md-4">
                <label className="form-label small text-muted mb-1">Anaesthetist</label>
                <div className="fw-semibold">{DUMMY_ANAESTHESIA.anaesthetist}</div>
              </div>
              <div className="col-md-4">
                <label className="form-label small text-muted mb-1">Anaesthesia Status</label>
                <div>{DUMMY_ANAESTHESIA.anaesthesiaStatus}</div>
              </div>
            </div>
            <label className="form-label small text-muted mb-1">Pre-Anaesthesia Instructions</label>
            <ul className="mb-0 small">
              {DUMMY_ANAESTHESIA.instructions.map((ins, idx) => <li key={idx}>{ins}</li>)}
            </ul>
          </div>

          {/* ─── OT PREPARATION (editable) ─── */}
          <div className="mb-4">
            <h6 className="fw-bold border-bottom pb-1 mb-3">OT Preparation</h6>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label small fw-bold">NPO Since Date <span className="text-danger">*</span></label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={preparation.npoSinceDate}
                  onChange={(e) => handlePreparationChange("npoSinceDate", e.target.value)}
                  disabled={preparationSaved}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold">NPO Since Time <span className="text-danger">*</span></label>
                <input
                  type="time"
                  className="form-control form-control-sm"
                  value={preparation.npoSinceTime}
                  onChange={(e) => handlePreparationChange("npoSinceTime", e.target.value)}
                  disabled={preparationSaved}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold">Consent Available <span className="text-danger">*</span></label>
                <select
                  className="form-select form-select-sm"
                  value={preparation.consentAvailable}
                  onChange={(e) => handlePreparationChange("consentAvailable", e.target.value)}
                  disabled={preparationSaved}
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold">Patient Prepared <span className="text-danger">*</span></label>
                <select
                  className="form-select form-select-sm"
                  value={preparation.patientPrepared}
                  onChange={(e) => handlePreparationChange("patientPrepared", e.target.value)}
                  disabled={preparationSaved}
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold">Pre-Op Medication <span className="text-danger">*</span></label>
                <select
                  className="form-select form-select-sm"
                  value={preparation.preOpMedication}
                  onChange={(e) => handlePreparationChange("preOpMedication", e.target.value)}
                  disabled={preparationSaved}
                >
                  <option value="">Select</option>
                  <option value="Given">Given</option>
                  <option value="Not Given">Not Given</option>
                  <option value="N/A">N/A</option>
                </select>
              </div>
              <div className="col-md-9">
                <label className="form-label small fw-bold">Remarks</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Optional remarks"
                  value={preparation.remarks}
                  onChange={(e) => handlePreparationChange("remarks", e.target.value)}
                  disabled={preparationSaved}
                />
              </div>
              <div className="col-12">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSavePreparation}
                  disabled={preparationSaved}
                >
                  {preparationSaved ? "Preparation Saved" : "Save Preparation"}
                </button>
              </div>
            </div>
          </div>

        
          {/* ─── EMERGENCY OVERRIDE ─── */}
          <div className="mb-4">
           
            {isEmergency && (
              <div className="mt-2">
                <label className="form-label small fw-bold">Override Reason <span className="text-danger">*</span></label>
                <textarea
                  className="form-control form-control-sm"
                  rows={2}
                  placeholder="Enter reason for overriding readiness checks..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* ─── PATIENT MOVEMENT ─── */}


          {/* ─── MOVEMENT / AUDIT TRAIL ─── */}
          {movementHistory.length > 0 && (
            <div className="mt-4">
              <h6 className="fw-bold border-bottom pb-1 mb-3">Movement / Audit Trail</h6>
              <div className="table-responsive">
                <table className="table table-bordered table-sm" style={{ fontSize: "0.72rem" }}>
                  <thead className="table-light">
                    <tr>
                      <th>Event</th>
                      <th>By</th>
                      <th>Date/Time</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movementHistory.map((h, idx) => (
                      <tr key={idx}>
                        <td>{h.event}</td>
                        <td>{h.by}</td>
                        <td>{h.dateTime}</td>
                        <td>{h.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

    </div>
  )
}

export default OTDetails
