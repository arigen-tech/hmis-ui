import React, { useState } from 'react';

const DischargeFromWard = () => {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'medications', 'history'

  // ---------- Dummy Patient Data (view only) ----------
  const patientDetails = {
    patientName: 'Ramesh Kumar',
    uhid: 'UHID-12345',
    ipNo: 'IP-2026-001',
    age: '45 years',
    gender: 'Male',
    admissionDate: '10-Apr-2026 10:30 AM',
    consultant: 'Dr. Vinay Sharma',
    ward: 'General Ward',
    bed: 'Bed No. 12',
  };

  // ---------- Discharge Summary Form State ----------
  const [dischargeData, setDischargeData] = useState({
    finalDiagnosis: '',
    presentComplaints: '',
    historyPresentIllness: '',
    personalPastHistory: '',
    onExamination: '',
    procedureNotes: '',
    courseOfHospitalStay: '',
    medicationOnDischarge: '',
    adviseOnDischarge: '',
    followUp: '',
    // Payment details (auto, can be overridden for demo)
    billStatus: 'FINAL',
    paymentStatus: 'PAID', // Change to 'UNPAID' to test submit disable
    // Discharge details
    dischargeDateTime: '',
    patientCondition: '',
    dischargeReason: '',
    dischargeTo: 'home', // 'home' or 'otherHospital'
    otherHospitalName: '',
  });

  // Dropdown options (mock)
  const conditionOptions = ['Stable', 'Improved', 'Critical', 'Palliative'];
  const reasonOptions = ['Recovered', 'LAMA', 'Death', 'Referred'];

  // ---------- Discharge Medications (dynamic rows) ----------
  const [dischargeMeds, setDischargeMeds] = useState([
    { id: Date.now() + 1, medicineName: 'Paracetamol', dose: '500 mg', duration: '5 days', instructions: 'After meals' },
    { id: Date.now() + 2, medicineName: 'Ceftriaxone', dose: '1 gm', duration: '3 days', instructions: 'IV once daily' },
  ]);

  // ---------- Discharge History (dummy) ----------
  const [dischargeHistory, setDischargeHistory] = useState([
    {
      id: 1,
      dischargeDate: '15-Mar-2026',
      dischargeType: 'Routine',
      admittingDoctor: 'Dr. Vinay Sharma',
      diagnosis: 'Dengue Fever',
      summary: 'Patient recovered well, discharged in stable condition.',
    },
    {
      id: 2,
      dischargeDate: '02-Feb-2026',
      dischargeType: 'LAMA',
      admittingDoctor: 'Dr. Priya Nair',
      diagnosis: 'Pneumonia',
      summary: 'Left against medical advice.',
    },
  ]);

  // ---------- Helper: update discharge summary fields ----------
  const handleDischargeChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'radio') {
      setDischargeData(prev => ({ ...prev, [name]: value }));
    } else {
      setDischargeData(prev => ({ ...prev, [name]: value }));
    }
  };

  // ---------- Discharge Medications Handlers ----------
  const addMedicationRow = () => {
    const newRow = {
      id: Date.now(),
      medicineName: '',
      dose: '',
      duration: '',
      instructions: '',
    };
    setDischargeMeds([...dischargeMeds, newRow]);
  };

  const updateMedicationRow = (id, field, value) => {
    setDischargeMeds(prev =>
      prev.map(med => (med.id === id ? { ...med, [field]: value } : med))
    );
  };

  const deleteMedicationRow = (id) => {
    if (dischargeMeds.length === 1) return;
    setDischargeMeds(prev => prev.filter(med => med.id !== id));
  };

  // ---------- Save Draft (minimal validation) ----------
  const handleSaveDraft = () => {
    alert('Draft saved successfully! (No validation applied)');
    // In real implementation, you would save to backend as draft
  };

  // ---------- Submit Discharge (full validation, payment check) ----------
  const handleSubmitDischarge = () => {
    // Check payment status
    if (dischargeData.paymentStatus !== 'PAID') {
      alert('Payment is not completed against the FINAL bill. Please clear payment before discharge.');
      return;
    }

    // Validation: required fields
    const requiredFields = [
      'finalDiagnosis',
      'presentComplaints',
      'historyPresentIllness',
      'onExamination',
      'courseOfHospitalStay',
      'medicationOnDischarge',
      'adviseOnDischarge',
      'dischargeDateTime',
      'patientCondition',
      'dischargeReason',
    ];
    const missing = requiredFields.filter(field => !dischargeData[field]?.trim());
    if (missing.length > 0) {
      alert(`Please fill all required fields: ${missing.join(', ')}`);
      return;
    }
    if (dischargeData.dischargeTo === 'otherHospital' && !dischargeData.otherHospitalName.trim()) {
      alert('Please enter the name of the hospital for transfer.');
      return;
    }

    alert('Discharge completed! Bed will be released, patient status updated to DISCHARGED.');
    // In real implementation: call API to update bed, admission status, etc.
  };

  // Determine if Submit button is disabled (payment not PAID)
  const isSubmitDisabled = dischargeData.paymentStatus !== 'PAID';

  return (
    <div>
      {/* Tab Toggle */}
      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-sm ${activeTab === 'summary' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setActiveTab('summary')}
          style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}
        >
          Discharge Summary
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'medications' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setActiveTab('medications')}
          style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}
        >
          Discharge Medications
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'history' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setActiveTab('history')}
          style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}
        >
          Discharge History
        </button>
      </div>

      {/* ======================= DISCHARGE SUMMARY TAB ======================= */}
      {activeTab === 'summary' && (
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white py-2">
            <strong>Discharge Summary</strong>
          </div>
          <div className="card-body">
            {/* Patient Details / Admission Details (View only) */}
            <div className="card mb-3 bg-light">
              <div className="card-header bg-secondary text-white py-1">
                <strong>Patient & Admission Details</strong>
              </div>
              <div className="card-body py-2">
                <div className="row g-2">
                  <div className="col-md-3"><strong>Patient Name:</strong> {patientDetails.patientName}</div>
                  <div className="col-md-3"><strong>UHID / IP No:</strong> {patientDetails.uhid} / {patientDetails.ipNo}</div>
                  <div className="col-md-2"><strong>Age / Gender:</strong> {patientDetails.age} / {patientDetails.gender}</div>
                  <div className="col-md-4"><strong>Admission Date:</strong> {patientDetails.admissionDate}</div>
                  <div className="col-md-3"><strong>Consultant:</strong> {patientDetails.consultant}</div>
                  <div className="col-md-3"><strong>Ward / Bed:</strong> {patientDetails.ward} / {patientDetails.bed}</div>
                  <div className="col-md-3"><strong>Discharge Date:</strong> {dischargeData.dischargeDateTime ? new Date(dischargeData.dischargeDateTime).toLocaleString() : 'Not set'}</div>
                </div>
              </div>
            </div>

            {/* Clinical Information */}
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Final Diagnosis <span className="text-danger">*</span></label>
                <textarea className="form-control" rows="2" name="finalDiagnosis" value={dischargeData.finalDiagnosis} onChange={handleDischargeChange} placeholder="Enter final diagnosis" />
              </div>
              <div className="col-md-6">
                <label className="form-label">Present Complaints <span className="text-danger">*</span></label>
                <textarea className="form-control" rows="2" name="presentComplaints" value={dischargeData.presentComplaints} onChange={handleDischargeChange} placeholder="Enter present complaints" />
              </div>
              <div className="col-12">
                <label className="form-label">History of Present Illness <span className="text-danger">*</span></label>
                <textarea className="form-control" rows="2" name="historyPresentIllness" value={dischargeData.historyPresentIllness} onChange={handleDischargeChange} placeholder="Describe HPI" />
              </div>
              <div className="col-12">
                <label className="form-label">Personal / Past History</label>
                <textarea className="form-control" rows="2" name="personalPastHistory" value={dischargeData.personalPastHistory} onChange={handleDischargeChange} placeholder="Any relevant past medical history" />
              </div>
              <div className="col-12">
                <label className="form-label">On Examination <span className="text-danger">*</span></label>
                <textarea className="form-control" rows="2" name="onExamination" value={dischargeData.onExamination} onChange={handleDischargeChange} placeholder="Physical exam findings" />
              </div>
              <div className="col-12">
                <label className="form-label">Procedure Details / Operative Notes</label>
                <textarea className="form-control" rows="2" name="procedureNotes" value={dischargeData.procedureNotes} onChange={handleDischargeChange} placeholder="Any procedures or operations" />
              </div>
              <div className="col-12">
                <label className="form-label">Course of Hospital Stay <span className="text-danger">*</span></label>
                <textarea className="form-control" rows="3" name="courseOfHospitalStay" value={dischargeData.courseOfHospitalStay} onChange={handleDischargeChange} placeholder="Summarise hospital course" />
              </div>
              <div className="col-12">
                <label className="form-label">Medication on Discharge <span className="text-danger">*</span></label>
                <textarea className="form-control" rows="2" name="medicationOnDischarge" value={dischargeData.medicationOnDischarge} onChange={handleDischargeChange} placeholder="Medications prescribed at discharge" />
              </div>
              <div className="col-12">
                <label className="form-label">Advise on Discharge <span className="text-danger">*</span></label>
                <textarea className="form-control" rows="2" name="adviseOnDischarge" value={dischargeData.adviseOnDischarge} onChange={handleDischargeChange} placeholder="Diet, activity, lifestyle advice" />
              </div>
              <div className="col-12">
                <label className="form-label">Follow Up</label>
                <textarea className="form-control" rows="2" name="followUp" value={dischargeData.followUp} onChange={handleDischargeChange} placeholder="Follow-up instructions" />
              </div>
            </div>

            {/* Payment Details (auto) */}
            <div className="card mt-3 mb-3 bg-light">
              <div className="card-header bg-secondary text-white py-1">
                <strong>Payment Details</strong>
              </div>
              <div className="card-body py-2">
                <div className="row">
                  <div className="col-md-4"><strong>Bill Status:</strong> {dischargeData.billStatus}</div>
                  <div className="col-md-4">
                    <strong>Payment Status:</strong>{' '}
                    <span className={dischargeData.paymentStatus === 'PAID' ? 'text-success' : 'text-danger'}>
                      {dischargeData.paymentStatus}
                    </span>
                  </div>
                  <div className="col-md-4">
                    {dischargeData.paymentStatus !== 'PAID' && (
                      <small className="text-danger">(Payment required before discharge)</small>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Discharge Details */}
            <div className="card mt-3">
              <div className="card-header bg-secondary text-white py-1">
                <strong>Discharge Details</strong>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Discharge Date & Time <span className="text-danger">*</span></label>
                    <input type="datetime-local" className="form-control" name="dischargeDateTime" value={dischargeData.dischargeDateTime} onChange={handleDischargeChange} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Patient Condition on Discharge <span className="text-danger">*</span></label>
                    <select className="form-select" name="patientCondition" value={dischargeData.patientCondition} onChange={handleDischargeChange}>
                      <option value="">Select condition</option>
                      {conditionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Discharge Reason <span className="text-danger">*</span></label>
                    <select className="form-select" name="dischargeReason" value={dischargeData.dischargeReason} onChange={handleDischargeChange}>
                      <option value="">Select reason</option>
                      {reasonOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Discharge to:</label>
                    <div className="d-flex gap-4">
                      <div className="form-check">
                        <input className="form-check-input" type="radio" name="dischargeTo" value="home" checked={dischargeData.dischargeTo === 'home'} onChange={handleDischargeChange} />
                        <label className="form-check-label">Home</label>
                      </div>
                      <div className="form-check">
                        <input className="form-check-input" type="radio" name="dischargeTo" value="otherHospital" checked={dischargeData.dischargeTo === 'otherHospital'} onChange={handleDischargeChange} />
                        <label className="form-check-label">Other Hospital</label>
                      </div>
                    </div>
                  </div>
                  {dischargeData.dischargeTo === 'otherHospital' && (
                    <div className="col-md-6">
                      <label className="form-label">Hospital Name <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" name="otherHospitalName" value={dischargeData.otherHospitalName} onChange={handleDischargeChange} placeholder="Enter hospital name" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="d-flex justify-content-between mt-4">
              <button className="btn btn-secondary btn-sm" onClick={handleSaveDraft}>
                <i className="fa fa-save me-1"></i> Save (Draft)
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleSubmitDischarge}
                disabled={isSubmitDisabled}
                title={isSubmitDisabled ? 'Payment not completed' : ''}
              >
                Submit for Discharge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= DISCHARGE MEDICATIONS TAB ======================= */}
      {activeTab === 'medications' && (
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <strong>Discharge Medications</strong>
            <button className="btn btn-sm btn-light" onClick={addMedicationRow}>
              + Add Medication
            </button>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-bordered mb-0 align-middle" style={{ fontSize: '0.85rem' }}>
                <thead className="table-light">
                  <tr>
                    <th>Medicine Name</th><th>Dose</th><th>Duration</th><th>Instructions</th><th style={{ width: '50px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dischargeMeds.map((med, idx) => (
                    <tr key={med.id}>
                      <td><input type="text" className="form-control form-control-sm" value={med.medicineName} onChange={e => updateMedicationRow(med.id, 'medicineName', e.target.value)} placeholder="Medicine name" /></td>
                      <td><input type="text" className="form-control form-control-sm" value={med.dose} onChange={e => updateMedicationRow(med.id, 'dose', e.target.value)} placeholder="e.g., 500 mg" /></td>
                      <td><input type="text" className="form-control form-control-sm" value={med.duration} onChange={e => updateMedicationRow(med.id, 'duration', e.target.value)} placeholder="e.g., 5 days" /></td>
                      <td><input type="text" className="form-control form-control-sm" value={med.instructions} onChange={e => updateMedicationRow(med.id, 'instructions', e.target.value)} placeholder="e.g., After meals" /></td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteMedicationRow(med.id)} disabled={dischargeMeds.length === 1}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card-footer d-flex justify-content-end">
            <button className="btn btn-success btn-sm" onClick={() => alert('Discharge medications saved (draft)')}>
              Save Medications
            </button>
          </div>
        </div>
      )}

      {/* ======================= DISCHARGE HISTORY TAB ======================= */}
      {activeTab === 'history' && (
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white py-2">
            <strong>Previous Discharge History</strong>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-bordered mb-0 align-middle" style={{ fontSize: '0.85rem' }}>
                <thead className="table-light">
                  <tr><th>Discharge Date</th><th>Type</th><th>Admitting Doctor</th><th>Diagnosis</th><th>Summary</th></tr>
                </thead>
                <tbody>
                  {dischargeHistory.map(record => (
                    <tr key={record.id}>
                      <td>{record.dischargeDate}</td>
                      <td>{record.dischargeType}</td>
                      <td>{record.admittingDoctor}</td>
                      <td>{record.diagnosis}</td>
                      <td>{record.summary}</td>
                    </tr>
                  ))}
                  {dischargeHistory.length === 0 && (
                    <tr><td colSpan="5" className="text-center">No previous discharge records</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DischargeFromWard;