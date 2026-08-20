import { useState } from "react"
import Swal from "sweetalert2"

const MAX_NOTES_LENGTH = 2000

// ─── DUMMY HISTORY DATA ──────────────────────────────────────
const DUMMY_HANDOVER_HISTORY = [
  {
    id: 1,
    dateTime: "18-Aug-2026 08:15 AM",
    enteredBy: "Nurse Priya",
    notes:
      "Patient resting comfortably. Temperature 98.4°F and blood pressure stable. Oral fluids encouraged. Patient tolerated breakfast well. No complaints of pain reported."
  },
  {
    id: 2,
    dateTime: "17-Aug-2026 10:30 PM",
    enteredBy: "Nurse Rahul",
    notes:
      "Patient alert and responsive. IV fluids continued as prescribed. Urine output adequate. Dressing checked and found clean and dry. Patient advised to call staff if discomfort occurs."
  },
  {
    id: 3,
    dateTime: "17-Aug-2026 03:45 PM",
    enteredBy: "Nurse Meena",
    notes:
      "Patient assisted with ambulation. No dizziness or weakness observed. Scheduled medication administered. Appetite improving and patient consumed approximately 75% of lunch."
  },
  {
    id: 4,
    dateTime: "17-Aug-2026 09:00 AM",
    enteredBy: "Nurse Arjun",
    notes:
      "Morning assessment completed. Patient awake and oriented to time, place, and person. Vital signs recorded and documented. Physician rounds completed with no new orders."
  }
];

const ShiftHandover = ({ selectedPatient }) => {
  const [handoverNotes, setHandoverNotes] = useState("")
  const [history, setHistory] = useState(DUMMY_HANDOVER_HISTORY)

  const handleNotesChange = (e) => {
    const value = e.target.value
    if (value.length <= MAX_NOTES_LENGTH) {
      setHandoverNotes(value)
    }
  }

  const handleClear = () => {
    setHandoverNotes("")
  }

  const handleSaveHandover = () => {
    if (!handoverNotes.trim()) {
      Swal.fire({
        title: "Warning",
        text: "Please enter handover notes before saving.",
        icon: "warning"
      })
      return
    }

    const now = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    const newEntry = {
      id: history.length ? Math.max(...history.map(h => h.id)) + 1 : 1,
      dateTime: now,
      enteredBy: "Nurse A",
      notes: handoverNotes.trim()
    }

    setHistory(prev => [newEntry, ...prev])
    setHandoverNotes("")

    Swal.fire({
      title: "Success",
      text: "Shift handover notes saved successfully.",
      icon: "success"
    })
  }

  return (
    <div>
     
        <div className="body">
         

          <label className="form-label small fw-bold">Handover Notes <span className="text-danger">*</span></label>
          <textarea
            className="form-control form-control-sm"
            rows={5}
            placeholder="Enter shift handover notes..."
            value={handoverNotes}
            onChange={handleNotesChange}
          />
          <div className="text-end text-muted mt-1" style={{ fontSize: "0.7rem" }}>
            {handoverNotes.length} / {MAX_NOTES_LENGTH}
          </div>

          <div className="d-flex justify-content-end gap-2 mt-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={handleClear}>
              Clear
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSaveHandover}>
              Save Handover
            </button>
          </div>
        </div>

      {/* ─── HANDOVER HISTORY ─── */}
      <div className="card mt-3">
        <div className="card-header bg-light py-2">
          <strong className="small">Handover History</strong>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-bordered table-sm table-hover mb-0" style={{ fontSize: "0.75rem" }}>
              <thead className="table-light">
                <tr>
                  <th style={{ width: "160px" }}>Date &amp; Time</th>
                  <th style={{ width: "120px" }}>Entered By</th>
                  <th>Handover Notes</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-3 text-muted">No handover history found.</td>
                  </tr>
                ) : (
                  history.map(h => (
                    <tr key={h.id}>
                      <td>{h.dateTime}</td>
                      <td>{h.enteredBy}</td>
                      <td style={{ whiteSpace: "pre-wrap" }}>{h.notes}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShiftHandover