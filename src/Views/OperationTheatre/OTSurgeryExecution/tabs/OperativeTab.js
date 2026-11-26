import React from "react";

const OperativeTab = ({
  YES_NO_OPTIONS,
  handleOperativeBlur,
  handleOperativeChange,
  handleSaveTab,
  isSelectedPatientPacPending,
  operativeDetails,
  operativeErrors,
  savingTab,
}) => (
  <div>
    <h6 className="fw-bold mb-2">Operative Details</h6>
    <div className="row">
      <div className="col-md-3 mb-3">
        <label className="form-label">Surgery Start Time</label>
        <input
          type="datetime-local"
          className="form-control"
          value={operativeDetails.surgeryStartTime}
          onChange={(e) => handleOperativeChange("surgeryStartTime", e.target.value)}
        />
      </div>
      <div className="col-md-3 mb-3">
        <label className="form-label">Surgery End Time</label>
        <input
          type="datetime-local"
          className={`form-control ${operativeErrors.surgeryEndTime ? "is-invalid" : ""}`}
          value={operativeDetails.surgeryEndTime}
          onChange={(e) => handleOperativeChange("surgeryEndTime", e.target.value)}
          onBlur={() => handleOperativeBlur("surgeryEndTime")}
        />
        {operativeErrors.surgeryEndTime && (
          <div className="invalid-feedback d-block">{operativeErrors.surgeryEndTime}</div>
        )}
      </div>

      <div className="col-md-3 mb-3">
        <label className="form-label fw-bold">
          Primary Surgeon <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className={`form-control ${operativeErrors.primarySurgeon ? "is-invalid" : ""}`}
          value={operativeDetails.primarySurgeon}
          onChange={(e) => handleOperativeChange("primarySurgeon", e.target.value)}
          onBlur={() => handleOperativeBlur("primarySurgeon")}
        />
        {operativeErrors.primarySurgeon && (
          <div className="invalid-feedback d-block">{operativeErrors.primarySurgeon}</div>
        )}
      </div>
      <div className="col-md-3 mb-3">
        <label className="form-label">Assistant Surgeon</label>
        <input
          type="text"
          className="form-control"
          value={operativeDetails.assistantSurgeon}
          onChange={(e) => handleOperativeChange("assistantSurgeon", e.target.value)}
        />
      </div>

      <div className="col-md-6 mb-3">
        <label className="form-label">Pre Op Diagnosis</label>
        <textarea
          className="form-control"
          rows="2"
          value={operativeDetails.preOpDiagnosis}
          onChange={(e) => handleOperativeChange("preOpDiagnosis", e.target.value)}
        />
      </div>
      <div className="col-md-6 mb-3">
        <label className="form-label">Post Op Diagnosis</label>
        <textarea
          className="form-control"
          rows="2"
          value={operativeDetails.postOpDiagnosis}
          onChange={(e) => handleOperativeChange("postOpDiagnosis", e.target.value)}
        />
      </div>
      <div className="col-md-6 mb-3">
        <label className="form-label">Procedure Performed</label>
        <textarea
          className="form-control"
          rows="3"
          value={operativeDetails.procedurePerformed}
          onChange={(e) => handleOperativeChange("procedurePerformed", e.target.value)}
          placeholder="Describe the procedure performed"
        />
      </div>
      <div className="col-md-6 mb-3">
        <label className="form-label">Operative Notes</label>
        <textarea
          className="form-control"
          rows="3"
          value={operativeDetails.operativeNotes}
          onChange={(e) => handleOperativeChange("operativeNotes", e.target.value)}
        />
      </div>
      <div className="col-md-6 mb-3">
        <label className="form-label">Surgical Findings</label>
        <textarea
          className="form-control"
          rows="3"
          value={operativeDetails.surgicalFindings}
          onChange={(e) => handleOperativeChange("surgicalFindings", e.target.value)}
        />
      </div>
      <div className="col-md-3 mb-3">
        <label className="form-label">Estimated Blood Loss (ml)</label>
        <input
          type="text"
          inputMode="numeric"
          className={`form-control ${operativeErrors.estimatedBloodLoss ? "is-invalid" : ""}`}
          value={operativeDetails.estimatedBloodLoss}
          onChange={(e) => handleOperativeChange("estimatedBloodLoss", e.target.value)}
          onBlur={() => handleOperativeBlur("estimatedBloodLoss")}
          placeholder="e.g. 100"
        />
        {operativeErrors.estimatedBloodLoss && (
          <div className="invalid-feedback d-block">{operativeErrors.estimatedBloodLoss}</div>
        )}
      </div>
      <div className="col-md-3 mb-3">
        <label className="form-label">Drain Placed</label>
        <select
          className="form-select"
          value={operativeDetails.drainPlaced}
          onChange={(e) => handleOperativeChange("drainPlaced", e.target.value)}
        >
          {YES_NO_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <div className="col-md-3 mb-3">
        <label className="form-label">Complication</label>
        <select
          className="form-select"
          value={operativeDetails.complication}
          onChange={(e) => handleOperativeChange("complication", e.target.value)}
        >
          {YES_NO_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <div className="col-md-3 mb-3">
        <label className="form-label">Specimen Collected</label>
        <select
          className="form-select"
          value={operativeDetails.specimenCollected}
          onChange={(e) => handleOperativeChange("specimenCollected", e.target.value)}
        >
          {YES_NO_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <div className="col-md-6 mb-3">
        <label className="form-label">Additional Notes</label>
        <textarea
          className="form-control"
          rows="2"
          value={operativeDetails.additionalNotes}
          onChange={(e) => handleOperativeChange("additionalNotes", e.target.value)}
        />
      </div>

    </div>


    <div className="d-flex justify-content-end">
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => handleSaveTab("Operative details")}
        disabled={Boolean(savingTab) || isSelectedPatientPacPending}
        title={isSelectedPatientPacPending ? "PAC Clearance is pending. Cannot save data." : ""}
      >
        Save Operative Details
        {savingTab === "operative" ? (
          <>
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            Saving Operative Details...
          </>
        ) : (
          <>
            <i className="fa fa-save me-1"></i> Save Operative Details
          </>
        )}
      </button>
    </div>
  </div>
);

export default OperativeTab;
