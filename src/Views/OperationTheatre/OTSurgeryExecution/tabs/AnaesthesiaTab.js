import React from "react";

const AnaesthesiaTab = ({
  YES_NO_OPTIONS,
  anaesthesia,
  anaesthesiaErrors,
  anaesthesiaTypes,
  asaGrades,
  handleAnaesthesiaBlur,
  handleAnaesthesiaChange,
  handleSaveAnaesthesia,
  isSelectedPatientPacPending,
  loadingAnaesthesiaTypes,
  loadingAsaGrades,
  savingAnaesthesia,
  setAnaesthesia,
  setAnaesthesiaErrors,
}) => (
  <div>
    <h5 className="fw-bold mb-2">Anaesthesia Details</h5>
    <div className="row">
      <div className="col-md-3 mb-3">
        <label className="form-label fw-bold">
          Anaesthesia Type <span className="text-danger">*</span>
        </label>
        <select
          className={`form-select ${anaesthesiaErrors.anaesthesiaTypeId ? "is-invalid" : ""}`}
          value={anaesthesia.anaesthesiaTypeId}
          onChange={(e) => {
            const selectedId = e.target.value;
            const selectedItem = anaesthesiaTypes.find(
              (item) => String(item.anaesthesiaTypeId) === String(selectedId)
            );
            setAnaesthesia((prev) => ({
              ...prev,
              anaesthesiaTypeId: selectedId,
              anaesthesiaType: selectedItem?.anaesthesiaTypeName || "",
            }));
            if (anaesthesiaErrors.anaesthesiaTypeId) {
              setAnaesthesiaErrors((prev) => ({ ...prev, anaesthesiaTypeId: "" }));
            }
          }}
          onBlur={() => handleAnaesthesiaBlur("anaesthesiaTypeId")}
          disabled={loadingAnaesthesiaTypes}
        >
          <option value="">
            {loadingAnaesthesiaTypes ? "Loading anaesthesia types..." : "Select Anaesthesia Type"}
          </option>
          {anaesthesiaTypes.map((item) => (
            <option key={item.anaesthesiaTypeId} value={item.anaesthesiaTypeId}>
              {item.anaesthesiaTypeName}
            </option>
          ))}
        </select>
        {anaesthesiaErrors.anaesthesiaTypeId && (
          <div className="invalid-feedback d-block">{anaesthesiaErrors.anaesthesiaTypeId}</div>
        )}
      </div>
      <div className="col-md-3 mb-3">
        <label className="form-label fw-bold">Anaesthetist</label>
        <input
          type="text"
          className="form-control"
          value={anaesthesia.anaesthetist}
          onChange={(e) => handleAnaesthesiaChange("anaesthetist", e.target.value)}
        />
      </div>
      <div className="col-md-3 mb-3">
        <label className="form-label fw-bold">Assistant Anaesthetist</label>
        <input
          type="text"
          className="form-control"
          value={anaesthesia.assistantAnaesthetist}
          onChange={(e) => handleAnaesthesiaChange("assistantAnaesthetist", e.target.value)}
        />
      </div>

      <div className="col-md-3 mb-3">
        <label className="form-label fw-bold">
          Anaesthesia Start <span className="text-danger">*</span>
        </label>
        <input
          type="datetime-local"
          className={`form-control ${anaesthesiaErrors.anaesthesiaStart ? "is-invalid" : ""}`}
          value={anaesthesia.anaesthesiaStart}
          onChange={(e) => handleAnaesthesiaChange("anaesthesiaStart", e.target.value)}
          onBlur={() => handleAnaesthesiaBlur("anaesthesiaStart")}
        />
        {anaesthesiaErrors.anaesthesiaStart && (
          <div className="invalid-feedback d-block">{anaesthesiaErrors.anaesthesiaStart}</div>
        )}
      </div>
      <div className="col-md-3 mb-3">
        <label className="form-label fw-bold">Anaesthesia End</label>
        <input
          type="datetime-local"
          className={`form-control ${anaesthesiaErrors.anaesthesiaEnd ? "is-invalid" : ""}`}
          value={anaesthesia.anaesthesiaEnd}
          onChange={(e) => handleAnaesthesiaChange("anaesthesiaEnd", e.target.value)}
          onBlur={() => handleAnaesthesiaBlur("anaesthesiaEnd")}
        />
        {anaesthesiaErrors.anaesthesiaEnd && (
          <div className="invalid-feedback d-block">{anaesthesiaErrors.anaesthesiaEnd}</div>
        )}
      </div>
      <div className="col-md-3 mb-3">
        <label className="form-label fw-bold">Airway Management</label>
        <input
          type="text"
          className="form-control"
          value={anaesthesia.airwayManagement}
          onChange={(e) => handleAnaesthesiaChange("airwayManagement", e.target.value)}
          placeholder="e.g. Laryngeal Mask Airway"
        />
      </div>

      <div className="col-md-3 mb-3">
        <label className="form-label fw-bold">
          ASA Grade <span className="text-danger">*</span>
        </label>
        <select
          className={`form-select ${anaesthesiaErrors.asaGradeId ? "is-invalid" : ""}`}
          value={anaesthesia.asaGradeId || ""}
          onChange={(e) => {
            const val = e.target.value;
            const selectedGrade = asaGrades.find(
              (grade) => String(grade.gradeId) === String(val)
            );
            setAnaesthesia((prev) => ({
              ...prev,
              asaGradeId: val,
              asaGrade: selectedGrade?.gradeName || selectedGrade?.gradeCode || "",
            }));
            if (anaesthesiaErrors.asaGradeId) {
              setAnaesthesiaErrors((prev) => ({ ...prev, asaGradeId: "" }));
            }
          }}
          onBlur={() => handleAnaesthesiaBlur("asaGradeId")}
          disabled={loadingAsaGrades}
        >
          <option value="">
            {loadingAsaGrades ? "Loading ASA grades..." : "Select ASA Grade"}
          </option>
          {asaGrades.map((grade) => (
            <option
              key={grade.gradeId}
              value={grade.gradeId}
              title={grade.description || ""}
            >
              {grade.gradeName || grade.gradeCode}
              {grade.description ? ` - ${grade.description}` : ""}
            </option>
          ))}
        </select>
        {anaesthesiaErrors.asaGradeId && (
          <div className="invalid-feedback d-block">{anaesthesiaErrors.asaGradeId}</div>
        )}
      </div>
    </div>

    <h6 className="fw-bold text-primary mb-3 mt-2">Pre-Induction Vitals</h6>
    <div className="row">
      <div className="col-md-3 mb-3">
        <label className="form-label fw-bold">BP (Sys/Dia)</label>
        <input
          type="text"
          className={`form-control ${anaesthesiaErrors.preInductionBP ? "is-invalid" : ""}`}
          value={anaesthesia.preInductionBP}
          onChange={(e) => handleAnaesthesiaChange("preInductionBP", e.target.value)}
          onBlur={() => handleAnaesthesiaBlur("preInductionBP")}
          placeholder="e.g. 120/80"
        />
        {anaesthesiaErrors.preInductionBP && (
          <div className="invalid-feedback d-block">{anaesthesiaErrors.preInductionBP}</div>
        )}
      </div>
      <div className="col-md-3 mb-3">
        <label className="form-label fw-bold">Pulse (/min)</label>
        <input
          type="text"
          inputMode="numeric"
          className={`form-control ${anaesthesiaErrors.preInductionPulse ? "is-invalid" : ""}`}
          value={anaesthesia.preInductionPulse}
          onChange={(e) => handleAnaesthesiaChange("preInductionPulse", e.target.value)}
          onBlur={() => handleAnaesthesiaBlur("preInductionPulse")}
          placeholder="e.g. 78"
        />
        {anaesthesiaErrors.preInductionPulse && (
          <div className="invalid-feedback d-block">{anaesthesiaErrors.preInductionPulse}</div>
        )}
      </div>
      <div className="col-md-3 mb-3">
        <label className="form-label fw-bold">SpO2 (%)</label>
        <input
          type="text"
          inputMode="numeric"
          className={`form-control ${anaesthesiaErrors.preInductionSpO2 ? "is-invalid" : ""}`}
          value={anaesthesia.preInductionSpO2}
          onChange={(e) => handleAnaesthesiaChange("preInductionSpO2", e.target.value)}
          onBlur={() => handleAnaesthesiaBlur("preInductionSpO2")}
          placeholder="e.g. 99"
        />
        {anaesthesiaErrors.preInductionSpO2 && (
          <div className="invalid-feedback d-block">{anaesthesiaErrors.preInductionSpO2}</div>
        )}
      </div>
    </div>

    <div className="row">
      <div className="col-md-6 mb-3">
        <label className="form-label fw-bold">Anaesthesia Notes</label>
        <textarea
          className="form-control"
          rows="2"
          value={anaesthesia.anaesthesiaNotes}
          onChange={(e) => handleAnaesthesiaChange("anaesthesiaNotes", e.target.value)}
        />
      </div>
      <div className="col-md-3 mb-3">
        <label className="form-label fw-bold">Complication</label>
        <select
          className="form-select"
          value={anaesthesia.complication}
          onChange={(e) => handleAnaesthesiaChange("complication", e.target.value)}
        >
          {YES_NO_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      {anaesthesia.complication === "Yes" && (
        <div className="col-md-6 mb-3">
          <label className="form-label fw-bold">
            If Yes <span className="text-danger">*</span>
          </label>
          <textarea
            className={`form-control ${anaesthesiaErrors.complicationDetails ? "is-invalid" : ""}`}
            rows="2"
            value={anaesthesia.complicationDetails}
            onChange={(e) => handleAnaesthesiaChange("complicationDetails", e.target.value)}
            onBlur={() => handleAnaesthesiaBlur("complicationDetails")}
            placeholder="Describe the complication"
          />
          {anaesthesiaErrors.complicationDetails && (
            <div className="invalid-feedback d-block">{anaesthesiaErrors.complicationDetails}</div>
          )}
        </div>
      )}
    </div>

    <div className="d-flex justify-content-end">
      <button
        type="button"
        className="btn btn-primary"
        onClick={handleSaveAnaesthesia}
        disabled={savingAnaesthesia || isSelectedPatientPacPending}
        title={
          isSelectedPatientPacPending
            ? "PAC Clearance is pending. Cannot save data."
            : ""
        }
      >
        {savingAnaesthesia ? (
          <>
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            Saving Anaesthesia...
          </>
        ) : (
          <>
            <i className="fa fa-save me-1"></i> Save Anaesthesia
          </>
        )}
      </button>
    </div>
  </div>
);

export default AnaesthesiaTab;
