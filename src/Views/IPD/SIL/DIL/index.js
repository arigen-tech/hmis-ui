// SILDIL.jsx
import { useState } from "react";

const SILDIL = ({ selectedPatient }) => {
  // ----- Helper: format date/time for display -----
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB").split("/").join("/");
  };

  const formatDisplayTime = (timeStr) => {
    return timeStr; // already HH:mm
  };

  // ----- Initial empty entry row -----
  const emptyEntry = () => ({
    id: Date.now(),
    date: new Date().toISOString().split("T")[0],
    time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    status: "",        // "Normal", "SIL", "DIL"
    condition: "",
    placedBy: "",
    nokInformed: "No",
    remarks: ""
  });

  // ----- History state (with sample data) -----
  const [history, setHistory] = useState([
    {
      id: 1,
      date: "2026-03-23",
      time: "21:33",
      status: "SIL",
      condition: "Critical",
      nokInformed: "Yes",
      remarks: "na"
    },
    {
      id: 2,
      date: "2026-03-23",
      time: "22:08",
      status: "Normal",
      condition: "Critical",
      nokInformed: "Yes",
      remarks: ""
    }
  ]);

  // ----- Current entry state -----
  const [currentEntry, setCurrentEntry] = useState(emptyEntry());

  // ----- Handlers -----
  const handleCurrentChange = (field, value) => {
    setCurrentEntry(prev => ({ ...prev, [field]: value }));
  };

  const handleStatusSelect = (status) => {
    setCurrentEntry(prev => ({ ...prev, status }));
  };

  const handleSubmit = () => {
    if (!currentEntry.status) {
      alert("Please select a status (Normal/SIL/DIL)");
      return;
    }
    if (!currentEntry.condition) {
      alert("Please select a condition");
      return;
    }
    // Add to history (newest first)
    const newHistoryEntry = {
      ...currentEntry,
      id: Date.now(),
      // Keep date as YYYY-MM-DD for sorting, display will format later
    };
    setHistory(prev => [newHistoryEntry, ...prev]);
    // Reset form
    setCurrentEntry(emptyEntry());
  };

  // ----- Helper: get background color based on status -----
  const getStatusBgColor = (status) => {
    switch (status) {
      case "Normal": return "#d4edda"; // green
      case "SIL": return "#fff3cd";    // yellow
      case "DIL": return "#f8d7da";    // red
      default: return "transparent";
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "Normal": return "success";
      case "SIL": return "warning";
      case "DIL": return "danger";
      default: return "secondary";
    }
  };

  // ----- Sort history by date/time descending -----
  const sortedHistory = [...history].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateB - dateA;
  });

  return (
    <div className="sildil-container">
      {/* Patient Info Header (as in description) */}
      {selectedPatient && (
        <div className="alert alert-info py-2 mb-3">
          <strong>
            {selectedPatient.patientName} ({selectedPatient.ageGender}) | {selectedPatient.admissionNo} •{" "}
            {selectedPatient.admissionDate} {selectedPatient.admissionTime} | DAY {selectedPatient.currentDay} |{" "}
            Dr: {selectedPatient.doctorName?.split(" ")[1] || selectedPatient.doctorName} | Dx:{" "}
            {selectedPatient.diagnosis || "Not specified"}
          </strong>
        </div>
      )}

      {/* ----- SIL/DIL ENTRY SECTION ----- */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-primary text-white py-2">
          <strong>SIL / DIL Status Entry</strong>
        </div>
        <div className="card-body p-3">
          <div className="row g-3 align-items-end">
            {/* Date */}
            <div className="col-md-2">
              <label className="form-label small">Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={currentEntry.date}
                onChange={(e) => handleCurrentChange("date", e.target.value)}
              />
            </div>
            {/* Time (manual entry) */}
            <div className="col-md-2">
              <label className="form-label small">Time</label>
              <input
                type="time"
                className="form-control form-control-sm"
                value={currentEntry.time}
                onChange={(e) => handleCurrentChange("time", e.target.value)}
              />
            </div>
            {/* Status Toggle: Normal / SIL / DIL */}
            <div className="col-md-3">
              <label className="form-label small">Status</label>
              <div className="btn-group" role="group">
                <button
                  type="button"
                  className={`btn btn-sm ${currentEntry.status === "Normal" ? "btn-success" : "btn-outline-success"}`}
                  onClick={() => handleStatusSelect("Normal")}
                >
                  Normal
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${currentEntry.status === "SIL" ? "btn-warning" : "btn-outline-warning"}`}
                  onClick={() => handleStatusSelect("SIL")}
                >
                  SIL
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${currentEntry.status === "DIL" ? "btn-danger" : "btn-outline-danger"}`}
                  onClick={() => handleStatusSelect("DIL")}
                >
                  DIL
                </button>
              </div>
            </div>
            {/* Condition Dropdown */}
            <div className="col-md-2">
              <label className="form-label small">Condition</label>
              <select
                className="form-select form-select-sm"
                value={currentEntry.condition}
                onChange={(e) => handleCurrentChange("condition", e.target.value)}
              >
                <option value="">Select</option>
                <option value="Critical">Critical</option>
                <option value="Serious">Serious</option>
                <option value="Stable">Stable</option>
                <option value="Improving">Improving</option>
              </select>
            </div>
            {/* Placed By (free text) */}
            <div className="col-md-2">
              <label className="form-label small">Placed By</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Enter name"
                value={currentEntry.placedBy}
                onChange={(e) => handleCurrentChange("placedBy", e.target.value)}
              />
            </div>
            {/* NOK Informed */}
            <div className="col-md-2">
              <label className="form-label small">NOK Informed</label>
              <select
                className="form-select form-select-sm"
                value={currentEntry.nokInformed}
                onChange={(e) => handleCurrentChange("nokInformed", e.target.value)}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            {/* Remarks */}
            <div className="col-md-3">
              <label className="form-label small">Remarks</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Optional"
                value={currentEntry.remarks}
                onChange={(e) => handleCurrentChange("remarks", e.target.value)}
              />
            </div>
            {/* Submit Button */}
            <div className="col-md-2">
              <button className="btn btn-success btn-sm w-100" onClick={handleSubmit}>
                Save Entry
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ----- SIL/DIL HISTORY SECTION ----- */}
      <div className="card shadow-sm">
        <div className="card-header bg-secondary text-white py-2">
          <strong>SIL / DIL History</strong>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-bordered table-hover mb-0 align-middle" style={{ fontSize: "0.85rem" }}>
              <thead className="table-light">
                <tr>
                  <th>No.</th>
                  <th>Date</th>
                  <th>Time</th>
                  {/* List Status removed per instruction */}
                  <th>Condition</th>
                  <th>NOK Informed</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {sortedHistory.length > 0 ? (
                  sortedHistory.map((entry, index) => (
                    <tr
                      key={entry.id}
                      style={{ backgroundColor: getStatusBgColor(entry.status) }}
                    >
                      <td>{index + 1}</td>
                      <td>{formatDisplayDate(entry.date)}</td>
                      <td>{entry.time}</td>
                      <td>
                        <span className={`badge bg-${getStatusBadgeColor(entry.status)}`}>
                          {entry.status}
                        </span>{" "}
                        {entry.condition}
                      </td>
                      <td>{entry.nokInformed}</td>
                      <td>{entry.remarks || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-3 text-muted">
                      No history records
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SILDIL;