import React, { useState } from 'react';

const MedicationModule = () => {
  // ---------- Tab State ----------
  const [activeView, setActiveView] = useState("medications"); // "medications" | "adverse"

  // ---------- State ----------
  // Active medications (only those with stopDate === null)
  const [activeMeds, setActiveMeds] = useState([
    {
      id: 1,
      medicineName: 'Paracetamol',
      route: 'Oral',
      dose: '500 mg',
      frequency: 'TDS',
      startDate: '2025-04-05T08:00',
      prescribedBy: 'Dr. Smith',
      administeredBy: 'Nurse A',
      stopDate: null,
      stopReason: null,
      totalDays: 5, // not displayed in table
    },
    {
      id: 2,
      medicineName: 'Ceftriaxone',
      route: 'IV',
      dose: '1 gm',
      frequency: 'BD',
      startDate: '2025-04-05T09:00',
      prescribedBy: 'Dr. Jones',
      administeredBy: 'Nurse B',
      stopDate: null,
      stopReason: null,
      totalDays: 7,
    },
    {
      id: 3,
      medicineName: 'DNS',
      route: 'IV',
      dose: '500 ml',
      frequency: 'Continuous',
      startDate: '2025-04-05T10:00',
      prescribedBy: 'Dr. Smith',
      administeredBy: 'Nurse A',
      stopDate: null,
      stopReason: null,
      totalDays: 3,
    },
  ]);

  // MAR administration logs (history)
  const [marLogs, setMarLogs] = useState([
    {
      id: 101,
      dateTime: '2025-04-05T10:30',
      medicineName: 'Paracetamol',
      route: 'Oral',
      dose: '500 mg',
      qty: 1,
      batch: 'B123',
      expiry: '2026-12-30',
      givenBy: 'Nurse A',
      total: 50,
      remarks: '',
    },
    {
      id: 102,
      dateTime: '2025-04-05T11:00',
      medicineName: 'Ceftriaxone',
      route: 'IV',
      dose: '1 gm',
      qty: 1,
      batch: 'B456',
      expiry: '2026-02-28',
      givenBy: 'Nurse B',
      total: 120,
      remarks: '',
    },
    {
      id: 103,
      dateTime: '2025-04-05T12:00',
      medicineName: 'DNS',
      route: 'IV',
      dose: '500 ml',
      qty: 1,
      batch: 'B789',
      expiry: '2027-01-15',
      givenBy: 'Nurse A',
      total: 80,
      remarks: '',
    },
    {
      id: 104,
      dateTime: '2025-04-05T16:00',
      medicineName: 'Paracetamol',
      route: 'Oral',
      dose: '500 mg',
      qty: 1,
      batch: 'B124',
      expiry: '2026-12-30',
      givenBy: 'Nurse B',
      total: 50,
      remarks: '',
    },
  ]);

  // Adverse events
  const [adverseEvents, setAdverseEvents] = useState([]);

  // UI states
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showMarEntryModal, setShowMarEntryModal] = useState(false);
  const [showAdverseModal, setShowAdverseModal] = useState(false);

  // Selected medication for stop/logs
  const [selectedMedForAction, setSelectedMedForAction] = useState(null);
  const [stopReason, setStopReason] = useState('');

  // Multi-select for MAR entry
  const [selectedMedIds, setSelectedMedIds] = useState([]);

  // MAR entry form data
  const [marEntryItems, setMarEntryItems] = useState([]);

  // Filter for MAR log
  const [logFilterMedicine, setLogFilterMedicine] = useState('');

  // New medication form (no class, added totalDays)
  const [newMed, setNewMed] = useState({
    medicineName: '',
    route: '',
    dose: '',
    frequency: '',
    totalDays: '',
    startDate: '',
    prescribedBy: '',
    administeredBy: '',
    remarks: '',
  });

  // New adverse event form
  const [newAdverse, setNewAdverse] = useState({
    medicineName: '',
    reaction: '',
    severity: '',
    actionTaken: '',
    reportedBy: '',
  });

  // Helper: get current datetime-local string
  const nowDateTimeLocal = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const local = new Date(now - tzOffset);
    return local.toISOString().slice(0, 16);
  };

  // ---------- Handlers: Add Medication ----------
  const handleAddMed = () => {
    if (!newMed.medicineName || !newMed.route || !newMed.dose || !newMed.frequency || !newMed.startDate || !newMed.totalDays) {
      alert('Please fill all required fields (Medicine Name, Route, Dose, Frequency, Start Date, Total Days)');
      return;
    }
    const newId = Date.now();
    const medToAdd = {
      id: newId,
      ...newMed,
      totalDays: parseInt(newMed.totalDays, 10),
      stopDate: null,
      stopReason: null,
    };
    setActiveMeds([...activeMeds, medToAdd]);
    setShowAddMedModal(false);
    setNewMed({
      medicineName: '',
      route: '',
      dose: '',
      frequency: '',
      totalDays: '',
      startDate: '',
      prescribedBy: '',
      administeredBy: '',
      remarks: '',
    });
  };

  // ---------- Handlers: Stop Medication ----------
  const openStopModal = (med) => {
    setSelectedMedForAction(med);
    setStopReason('');
    setShowStopModal(true);
  };

  const confirmStop = () => {
    if (!stopReason.trim()) {
      alert('Please enter a reason for stopping the medication.');
      return;
    }
    setActiveMeds(activeMeds.filter(med => med.id !== selectedMedForAction.id));
    setShowStopModal(false);
    setSelectedMedForAction(null);
    setStopReason('');
  };

  // ---------- Handlers: View Logs ----------
  const openLogsModal = (med) => {
    setSelectedMedForAction(med);
    setShowLogsModal(true);
  };

  const medLogs = selectedMedForAction
    ? marLogs.filter(log => log.medicineName === selectedMedForAction.medicineName).sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
    : [];

  // ---------- Handlers: MAR Entry ----------
  const toggleSelectMed = (medId) => {
    setSelectedMedIds(prev =>
      prev.includes(medId) ? prev.filter(id => id !== medId) : [...prev, medId]
    );
  };

  const openMarEntry = () => {
    if (selectedMedIds.length === 0) {
      alert('Please select at least one medication.');
      return;
    }
    const selectedMeds = activeMeds.filter(med => selectedMedIds.includes(med.id));
    const initialItems = selectedMeds.map(med => ({
      medId: med.id,
      medicineName: med.medicineName,
      route: med.route,
      dose: med.dose,
      qty: 1,
      batch: '',
      expiry: '',
      givenBy: '',
      remarks: '',
      dateTime: nowDateTimeLocal(),
    }));
    setMarEntryItems(initialItems);
    setShowMarEntryModal(true);
  };

  const handleMarEntryChange = (index, field, value) => {
    const updated = [...marEntryItems];
    updated[index][field] = value;
    setMarEntryItems(updated);
  };

  const saveMarEntries = () => {
    for (let item of marEntryItems) {
      if (!item.batch || !item.expiry || !item.givenBy) {
        alert('Please fill Batch, Expiry, and Given By for all selected medications.');
        return;
      }
    }
    const newLogs = marEntryItems.map(item => ({
      id: Date.now() + Math.random(),
      dateTime: item.dateTime,
      medicineName: item.medicineName,
      route: item.route,
      dose: item.dose,
      qty: item.qty,
      batch: item.batch,
      expiry: item.expiry,
      givenBy: item.givenBy,
      total: 0,
      remarks: item.remarks,
    }));
    setMarLogs([...newLogs, ...marLogs]);
    setShowMarEntryModal(false);
    setSelectedMedIds([]);
    setMarEntryItems([]);
  };

  // ---------- Handlers: Adverse Events ----------
  const handleAddAdverse = () => {
    if (!newAdverse.medicineName || !newAdverse.reaction || !newAdverse.severity || !newAdverse.actionTaken || !newAdverse.reportedBy) {
      alert('Please fill all fields.');
      return;
    }
    setAdverseEvents([...adverseEvents, { id: Date.now(), ...newAdverse }]);
    setShowAdverseModal(false);
    setNewAdverse({
      medicineName: '',
      reaction: '',
      severity: '',
      actionTaken: '',
      reportedBy: '',
    });
  };

  // Filtered MAR logs
  const filteredLogs = marLogs
    .filter(log => logFilterMedicine === '' || log.medicineName === logFilterMedicine)
    .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

  // Active medicine names for dropdowns
  const activeMedicineNames = [...new Set(activeMeds.map(m => m.medicineName))];

  return (
    <div>
      {/* ─── TAB TOGGLE ─── */}
      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-sm ${activeView === "medications" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveView("medications")}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
        >
          Medications
        </button>
        <button
          className={`btn btn-sm ${activeView === "adverse" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveView("adverse")}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
        >
          Adverse Events ({adverseEvents.length})
        </button>
      </div>

      {/* ─── MEDICATIONS TAB ─── */}
      {activeView === "medications" && (
        <>
          {/* Current Medications Section */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <strong>Current Medications (Active Orders)</strong>
              <button className="btn btn-sm btn-light" onClick={() => setShowAddMedModal(true)}>
                + Add Medication
              </button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-bordered mb-0 align-middle" style={{ fontSize: '0.85rem' }}>
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '40px' }}>Select</th>
                      <th>Medicine</th>
                      <th>Route</th>
                      <th>Dose</th>
                      <th>Frequency</th>
                      <th>Start Date</th>
                      <th>Administered By</th>
                      <th>Stop Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeMeds.map(med => (
                      <tr key={med.id}>
                        <td className="text-center">
                          <input
                            type="checkbox"
                            checked={selectedMedIds.includes(med.id)}
                            onChange={() => toggleSelectMed(med.id)}
                          />
                        </td>
                        <td>{med.medicineName}</td>
                        <td>{med.route}</td>
                        <td>{med.dose}</td>
                        <td>{med.frequency}</td>
                        <td>{med.startDate ? new Date(med.startDate).toLocaleString() : ''}</td>
                        <td>{med.administeredBy || '—'}</td>
                        <td>{med.stopDate ? new Date(med.stopDate).toLocaleString() : '—'}</td>
                        <td>
                          <button className="btn btn-sm btn-outline-danger me-1" onClick={() => openStopModal(med)}>Stop</button>
                          <button className="btn btn-sm btn-outline-info" onClick={() => openLogsModal(med)}>Logs</button>
                        </td>
                      </tr>
                    ))}
                    {activeMeds.length === 0 && (
                      <tr><td colSpan="9" className="text-center">No active medications.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card-footer d-flex justify-content-end">
              <button className="btn btn-success btn-sm" onClick={openMarEntry}>
                Enter MAR for Selected
              </button>
            </div>
          </div>

          {/* MAR Administration Log */}
          <div className="card shadow-sm">
            <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
              <strong>MAR Administration Log</strong>
              <div style={{ width: '250px' }}>
                <select
                  className="form-select form-select-sm"
                  value={logFilterMedicine}
                  onChange={(e) => setLogFilterMedicine(e.target.value)}
                >
                  <option value="">All (active medications only)</option>
                  {activeMedicineNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle" style={{ fontSize: '0.8rem' }}>
                  <thead className="table-light">
                    <tr>
                      <th>Date & Time</th>
                      <th>Medicine</th>
                      <th>Route</th>
                      <th>Dose</th>
                      <th>Qty</th>
                      <th>Batch</th>
                      <th>Expiry</th>
                      <th>Given By</th>
                      <th>Total</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map(log => (
                      <tr key={log.id}>
                        <td>{new Date(log.dateTime).toLocaleString()}</td>
                        <td>{log.medicineName}</td>
                        <td>{log.route}</td>
                        <td>{log.dose}</td>
                        <td>{log.qty}</td>
                        <td>{log.batch}</td>
                        <td>{log.expiry}</td>
                        <td>{log.givenBy}</td>
                        <td>{log.total}</td>
                        <td>{log.remarks || '—'}</td>
                      </tr>
                    ))}
                    {filteredLogs.length === 0 && (
                      <tr><td colSpan="10" className="text-center">No administration records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── ADVERSE EVENTS TAB ─── */}
      {activeView === "adverse" && (
        <div className="card shadow-sm">
          <div className="card-header bg-danger text-white d-flex justify-content-between align-items-center">
            <strong>Adverse Events</strong>
            <button className="btn btn-sm btn-light" onClick={() => setShowAdverseModal(true)}>
              + Report Event
            </button>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-bordered mb-0 align-middle" style={{ fontSize: '0.85rem' }}>
                <thead className="table-light">
                  <tr>
                    <th>Medicine Name</th>
                    <th>Reaction</th>
                    <th>Severity</th>
                    <th>Action Taken</th>
                    <th>Reported By</th>
                  </tr>
                </thead>
                <tbody>
                  {adverseEvents.map(event => (
                    <tr key={event.id}>
                      <td>{event.medicineName}</td>
                      <td>{event.reaction}</td>
                      <td>{event.severity}</td>
                      <td>{event.actionTaken}</td>
                      <td>{event.reportedBy}</td>
                    </tr>
                  ))}
                  {adverseEvents.length === 0 && (
                    <tr><td colSpan="5" className="text-center">No adverse events reported.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------- MODALS ---------- */}

      {/* Add Medication Modal - Updated */}
      {showAddMedModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Add New Medication</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddMedModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-2">
                  {/* Medicine Name - full row */}
                  <div className="col-12">
                    <label className="form-label small">Medicine Name *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={newMed.medicineName}
                      onChange={e => setNewMed({...newMed, medicineName: e.target.value})}
                      placeholder="Enter medicine name"
                    />
                  </div>
                  {/* Route, Dose, Frequency */}
                  <div className="col-md-4">
                    <label className="form-label small">Route *</label>
                    <select
                      className="form-select form-select-sm"
                      value={newMed.route}
                      onChange={e => setNewMed({...newMed, route: e.target.value})}
                    >
                      <option value="">Select</option>
                      <option>Oral</option><option>IV</option><option>IM</option><option>SC</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small">Dose *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={newMed.dose}
                      onChange={e => setNewMed({...newMed, dose: e.target.value})}
                      placeholder="e.g., 500 mg"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small">Frequency *</label>
                    <select
                      className="form-select form-select-sm"
                      value={newMed.frequency}
                      onChange={e => setNewMed({...newMed, frequency: e.target.value})}
                    >
                      <option value="">Select</option>
                      <option>OD</option><option>BD</option><option>TDS</option><option>QID</option><option>Continuous</option>
                    </select>
                  </div>
                  {/* Start Date, Total Days, Prescribed By */}
                  <div className="col-md-4">
                    <label className="form-label small">Start Date & Time *</label>
                    <input
                      type="datetime-local"
                      className="form-control form-control-sm"
                      value={newMed.startDate}
                      onChange={e => setNewMed({...newMed, startDate: e.target.value})}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small">Total No. of Days *</label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={newMed.totalDays}
                      onChange={e => setNewMed({...newMed, totalDays: e.target.value})}
                      placeholder="e.g., 7"
                      min="1"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small">Prescribed By</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={newMed.prescribedBy}
                      onChange={e => setNewMed({...newMed, prescribedBy: e.target.value})}
                      placeholder="Doctor name"
                    />
                  </div>
                  {/* Administered By, Remarks */}
                  <div className="col-md-6">
                    <label className="form-label small">Administered By</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={newMed.administeredBy}
                      onChange={e => setNewMed({...newMed, administeredBy: e.target.value})}
                      placeholder="Nurse name"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small">Remarks</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={newMed.remarks}
                      onChange={e => setNewMed({...newMed, remarks: e.target.value})}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAddMedModal(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleAddMed}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stop Medication Modal (unchanged) */}
      {showStopModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Stop Medication</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowStopModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Stopping: <strong>{selectedMedForAction?.medicineName}</strong></p>
                <label className="form-label">Reason / Doctor's Advice *</label>
                <textarea className="form-control" rows="3" value={stopReason} onChange={e => setStopReason(e.target.value)} placeholder="Enter reason or reference of instruction..."></textarea>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowStopModal(false)}>Cancel</button>
                <button className="btn btn-danger btn-sm" onClick={confirmStop}>Confirm Stop</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal (unchanged) */}
      {showLogsModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title">MAR Logs: {selectedMedForAction?.medicineName}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowLogsModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="table-responsive">
                  <table className="table table-sm table-bordered">
                    <thead>
                      <tr><th>Date & Time</th><th>Dose</th><th>Qty</th><th>Batch</th><th>Given By</th><th>Remarks</th></tr>
                    </thead>
                    <tbody>
                      {medLogs.map(log => (
                        <tr key={log.id}>
                          <td>{new Date(log.dateTime).toLocaleString()}</td>
                          <td>{log.dose}</td>
                          <td>{log.qty}</td>
                          <td>{log.batch}</td>
                          <td>{log.givenBy}</td>
                          <td>{log.remarks || '—'}</td>
                        </tr>
                      ))}
                      {medLogs.length === 0 && <tr><td colSpan="6" className="text-center">No administration records.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowLogsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAR Entry Modal (unchanged) */}
      {showMarEntryModal && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1040
            }}
            onClick={() => setShowMarEntryModal(false)}
          />
          <div
            className="modal show d-block"
            tabIndex={-1}
            role="dialog"
            style={{
              width: "calc(100vw - 310px)",
              left: "285px",
              maxWidth: "none",
              height: "90vh",
              margin: "5vh auto",
              position: "fixed",
              zIndex: 1050,
              pointerEvents: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-dialog modal-dialog-centered modal-xl" role="document">
              <div className="modal-content">
                <div className="modal-header bg-success text-white">
                  <h5 className="modal-title">MAR Entry</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowMarEntryModal(false)}
                  />
                </div>
                <div className="modal-body">
                  <div className="table-responsive">
                    <table className="table table-bordered align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Medicine</th><th>Route</th><th>Dose</th>
                          <th>Date & Time</th><th>Qty</th><th>Batch *</th><th>Expiry *</th>
                          <th>Given By *</th><th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marEntryItems.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.medicineName}</td><td>{item.route}</td><td>{item.dose}</td>
                            <td><input type="datetime-local" className="form-control form-control-sm" value={item.dateTime} onChange={e => handleMarEntryChange(idx, 'dateTime', e.target.value)} /></td>
                            <td><input type="number" className="form-control form-control-sm" value={item.qty} onChange={e => handleMarEntryChange(idx, 'qty', parseInt(e.target.value) || 0)} min="1" /></td>
                            <td><input type="text" className="form-control form-control-sm" value={item.batch} onChange={e => handleMarEntryChange(idx, 'batch', e.target.value)} placeholder="Batch" /></td>
                            <td><input type="date" className="form-control form-control-sm" value={item.expiry} onChange={e => handleMarEntryChange(idx, 'expiry', e.target.value)} /></td>
                            <td><input type="text" className="form-control form-control-sm" value={item.givenBy} onChange={e => handleMarEntryChange(idx, 'givenBy', e.target.value)} placeholder="Nurse name" /></td>
                            <td><input type="text" className="form-control form-control-sm" value={item.remarks} onChange={e => handleMarEntryChange(idx, 'remarks', e.target.value)} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowMarEntryModal(false)}>Cancel</button>
                  <button className="btn btn-success btn-sm" onClick={saveMarEntries}>Save All Entries</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Adverse Event Modal (unchanged) */}
      {showAdverseModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Report Adverse Event</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAdverseModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label className="form-label small">Medicine Name *</label>
                  <select className="form-select form-select-sm" value={newAdverse.medicineName} onChange={e => setNewAdverse({...newAdverse, medicineName: e.target.value})}>
                    <option value="">Select</option>
                    {activeMedicineNames.map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label small">Reaction *</label>
                  <input type="text" className="form-control form-control-sm" value={newAdverse.reaction} onChange={e => setNewAdverse({...newAdverse, reaction: e.target.value})} />
                </div>
                <div className="mb-2">
                  <label className="form-label small">Severity *</label>
                  <select className="form-select form-select-sm" value={newAdverse.severity} onChange={e => setNewAdverse({...newAdverse, severity: e.target.value})}>
                    <option value="">Select</option><option>Mild</option><option>Moderate</option><option>Severe</option>
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label small">Action Taken *</label>
                  <input type="text" className="form-control form-control-sm" value={newAdverse.actionTaken} onChange={e => setNewAdverse({...newAdverse, actionTaken: e.target.value})} />
                </div>
                <div className="mb-2">
                  <label className="form-label small">Reported By *</label>
                  <input type="text" className="form-control form-control-sm" value={newAdverse.reportedBy} onChange={e => setNewAdverse({...newAdverse, reportedBy: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAdverseModal(false)}>Cancel</button>
                <button className="btn btn-success btn-sm" onClick={handleAddAdverse}>Save Event</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationModule;