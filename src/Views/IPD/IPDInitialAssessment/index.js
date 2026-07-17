import React, { useState } from "react";

// ------------------------- DROPDOWN / OPTION DATA -------------------------
const consciousnessOptions = ["Alert", "Drowsy", "Confused", "Disoriented", "Stuporous", "Unconscious"];

const painScoreOptions = [
  { value: "0", label: "0 - No Pain" },
  { value: "1", label: "1 - Minimal" },
  { value: "2", label: "2 - Mild" },
  { value: "3", label: "3 - Mild" },
  { value: "4", label: "4 - Moderate" },
  { value: "5", label: "5 - Moderate" },
  { value: "6", label: "6 - Moderate" },
  { value: "7", label: "7 - Severe" },
  { value: "8", label: "8 - Severe" },
  { value: "9", label: "9 - Very Severe" },
  { value: "10", label: "10 - Worst Pain" },
];

const mobilityOptions = ["Independent", "Walks with Support", "Walker", "Wheelchair Bound", "Bedridden", "Immobile"];
const fallRiskOptions = ["Low", "Moderate", "High"];
const pressureSoreOptions = ["Low", "Moderate", "High", "Very High"];
const skinConditionOptions = ["Intact", "Dry", "Pale", "Redness", "Rash", "Wound", "Pressure Sore", "Bruises", "Edema", "Other"];
const ivSiteOptions = ["Left Hand", "Right Hand", "Left Forearm", "Right Forearm", "Left Arm", "Right Arm", "Other"];
const catheterTypeOptions = ["Foley", "Condom", "Suprapubic", "Intermittent", "Other"];
const drainTypeOptions = ["Jackson-Pratt", "Hemovac", "Chest Drain", "Abdominal Drain", "Biliary Drain", "Wound Drain", "Other"];
const nutritionRiskOptions = ["Low", "Moderate", "High"];
const infectionRiskOptions = ["Low", "Moderate", "High"];

// ------------------------- INITIAL FORM STATE -------------------------
const initialNursing = {
  consciousness: "",
  gcsScore: "",
  painScore: "",
  mobility: "",
  fallRiskScore: "",
  pressureSoreRisk: "",
  skinCondition: "",
  skinRemarks: "",
  ivLine: "",
  ivSite: "",
  catheter: "",
  catheterType: "",
  drain: "",
  drainType: "",
  nutritionRisk: "",
  nutritionRemarks: "",
  infectionRisk: "",
  infectionRemarks: "",
  patientOrientation: "",
  relativeOrientation: "",
  nursingCarePlan: "",
};

const initialMedical = {
  chiefComplaint: "",
  historyOfPresentIllness: "",
  familyHistory: "",
  medicationHistory: "",
  allergies: "",
  pulse: "",
  bp: "",
  temperature: "",
  rr: "",
  spo2: "",
  generalExamNotes: "",
  rs: "",
  cvs: "",
  pa: "",
  cns: "",
  provisionalDiagnosis: "",
};

// Small helper for a required-field asterisk
const Required = () => <span className="text-danger">*</span>;

// Reusable Yes/No radio group
const YesNoRadio = ({ name, value, onChange }) => (
  <div className="d-flex align-items-center gap-3">
    <label className="d-flex align-items-center mb-0">
      <input
        type="radio"
        name={name}
        value="Yes"
        checked={value === "Yes"}
        onChange={(e) => onChange(e.target.value)}
        className="me-1"
      />
      Yes
    </label>
    <label className="d-flex align-items-center mb-0">
      <input
        type="radio"
        name={name}
        value="No"
        checked={value === "No"}
        onChange={(e) => onChange(e.target.value)}
        className="me-1"
      />
      No
    </label>
  </div>
);

const IPDInitialAssessment = () => {
  // ---------- FORM STATE ----------
  const [nursing, setNursing] = useState(initialNursing);
  const [medical, setMedical] = useState(initialMedical);

  const updateNursing = (field, value) => {
    setNursing((prev) => ({ ...prev, [field]: value }));
  };

  const updateMedical = (field, value) => {
    setMedical((prev) => ({ ...prev, [field]: value }));
  };

  // ---------- VALIDATION ----------
  const getMissingFields = () => {
    const missing = [];

    if (!nursing.consciousness) missing.push("Consciousness");
    if (!nursing.gcsScore) missing.push("GCS Score");
    if (!nursing.painScore) missing.push("Pain Score");
    if (!nursing.mobility) missing.push("Mobility");
    if (!nursing.fallRiskScore) missing.push("Fall Risk Score");
    if (!nursing.pressureSoreRisk) missing.push("Pressure Sore Risk");
    if (!nursing.skinCondition) missing.push("Skin Condition");
    if (!nursing.ivLine) missing.push("IV Line");
    if (nursing.ivLine === "Yes" && !nursing.ivSite) missing.push("IV Line Site");
    if (!nursing.catheter) missing.push("Catheter");
    if (nursing.catheter === "Yes" && !nursing.catheterType) missing.push("Catheter Type");
    if (!nursing.drain) missing.push("Drain");
    if (nursing.drain === "Yes" && !nursing.drainType) missing.push("Drain Type");
    if (!nursing.nutritionRisk) missing.push("Nutrition Risk");
    if (!nursing.infectionRisk) missing.push("Infection Risk");
    if (!nursing.patientOrientation) missing.push("Patient Orientation");
    if (!nursing.relativeOrientation) missing.push("Relative Orientation");
    if (!nursing.nursingCarePlan) missing.push("Nursing Care Plan");

    if (!medical.chiefComplaint) missing.push("Chief Complaint");
    if (!medical.historyOfPresentIllness) missing.push("History of Present Illness");
    if (!medical.pulse) missing.push("Pulse");
    if (!medical.bp) missing.push("BP");
    if (!medical.temperature) missing.push("Temperature");
    if (!medical.rr) missing.push("RR");
    if (!medical.spo2) missing.push("SpO2");
    if (!medical.rs) missing.push("RS");
    if (!medical.cvs) missing.push("CVS");
    if (!medical.pa) missing.push("P/A");
    if (!medical.cns) missing.push("CNS");
    if (!medical.provisionalDiagnosis) missing.push("Provisional Diagnosis");

    return missing;
  };

  // ---------- ACTIONS ----------
  const handleSaveDraft = () => {
    alert("Draft saved:\n" + JSON.stringify({ nursing, medical }, null, 2));
  };

  const handleFinalize = () => {
    const missing = getMissingFields();
    if (missing.length > 0) {
      alert("Please fill all mandatory fields before finalizing:\n\n" + missing.join(", "));
      return;
    }
    alert("Assessment finalized:\n" + JSON.stringify({ nursing, medical }, null, 2));
  };

  const handleClear = () => {
    if (window.confirm("Clear all entered data on this form?")) {
      setNursing(initialNursing);
      setMedical(initialMedical);
    }
  };

  const handleCancel = () => {
    if (window.confirm("Discard this assessment and go back?")) {
      setNursing(initialNursing);
      setMedical(initialMedical);
    }
  };

  return (
    <div>
      {/* ======================= MAIN FORM ======================= */}
      <div className="row g-3">
        {/* ---------------------------------------------------------------- */}
        {/* A. NURSING ASSESSMENT                                            */}
        {/* ---------------------------------------------------------------- */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header text-white ">
              <strong>
                <i className="mdi mdi-account-heart me-1"></i>
                A. NURSING ASSESSMENT
              </strong>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {/* 1. Consciousness */}
                <div className="col-md-6">
                  <label className="form-label small">
                    1. Consciousness <Required />
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={nursing.consciousness}
                    onChange={(e) => updateNursing("consciousness", e.target.value)}
                  >
                    <option value="">Select</option>
                    {consciousnessOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* 2. GCS Score */}
                <div className="col-md-3">
                  <label className="form-label small">
                    2. GCS Score <Required />
                  </label>
                  <div className="input-group input-group-sm">
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      min="3"
                      max="15"
                      value={nursing.gcsScore}
                      onChange={(e) => updateNursing("gcsScore", e.target.value)}
                      placeholder="3-15"
                    />
                    <span className="input-group-text">/ 15</span>
                  </div>
                </div>

                {/* 3. Pain Score */}
                <div className="col-md-3">
                  <label className="form-label small">
                    3. Pain Score (0-10) <Required />
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={nursing.painScore}
                    onChange={(e) => updateNursing("painScore", e.target.value)}
                  >
                    <option value="">Select</option>
                    {painScoreOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Mobility */}
                <div className="col-md-6">
                  <label className="form-label small">
                    4. Mobility <Required />
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={nursing.mobility}
                    onChange={(e) => updateNursing("mobility", e.target.value)}
                  >
                    <option value="">Select</option>
                    {mobilityOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* 5. Fall Risk Score */}
                <div className="col-md-3">
                  <label className="form-label small">
                    5. Fall Risk Score <Required />
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={nursing.fallRiskScore}
                    onChange={(e) => updateNursing("fallRiskScore", e.target.value)}
                  >
                    <option value="">Select</option>
                    {fallRiskOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* 6. Pressure Sore Risk */}
                <div className="col-md-3">
                  <label className="form-label small">
                    6. Pressure Sore Risk <Required />
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={nursing.pressureSoreRisk}
                    onChange={(e) => updateNursing("pressureSoreRisk", e.target.value)}
                  >
                    <option value="">Select</option>
                    {pressureSoreOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* 7. Skin Condition */}
                <div className="col-md-6">
                  <label className="form-label small">
                    7. Skin Condition <Required />
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={nursing.skinCondition}
                    onChange={(e) => updateNursing("skinCondition", e.target.value)}
                  >
                    <option value="">Select</option>
                    {skinConditionOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small">Remarks</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={nursing.skinRemarks}
                    onChange={(e) => updateNursing("skinRemarks", e.target.value)}
                    placeholder="Enter remarks"
                  />
                </div>

                {/* 8. IV Line */}
                <div className="col-md-6">
                  <label className="form-label small d-block">
                    8. IV Line <Required />
                  </label>
                  <YesNoRadio
                    name="ivLine"
                    value={nursing.ivLine}
                    onChange={(val) => {
                      updateNursing("ivLine", val);
                      if (val === "No") updateNursing("ivSite", "");
                    }}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small">
                    Site {nursing.ivLine === "Yes" && <Required />}
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={nursing.ivSite}
                    onChange={(e) => updateNursing("ivSite", e.target.value)}
                    disabled={nursing.ivLine !== "Yes"}
                  >
                    <option value="">Select</option>
                    {ivSiteOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* 9. Catheter */}
                <div className="col-md-6">
                  <label className="form-label small d-block">
                    9. Catheter <Required />
                  </label>
                  <YesNoRadio
                    name="catheter"
                    value={nursing.catheter}
                    onChange={(val) => {
                      updateNursing("catheter", val);
                      if (val === "No") updateNursing("catheterType", "");
                    }}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small">
                    Type {nursing.catheter === "Yes" && <Required />}
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={nursing.catheterType}
                    onChange={(e) => updateNursing("catheterType", e.target.value)}
                    disabled={nursing.catheter !== "Yes"}
                  >
                    <option value="">Select</option>
                    {catheterTypeOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* 10. Drain */}
                <div className="col-md-6">
                  <label className="form-label small d-block">
                    10. Drain <Required />
                  </label>
                  <YesNoRadio
                    name="drain"
                    value={nursing.drain}
                    onChange={(val) => {
                      updateNursing("drain", val);
                      if (val === "No") updateNursing("drainType", "");
                    }}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small">
                    Drain Type {nursing.drain === "Yes" && <Required />}
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={nursing.drainType}
                    onChange={(e) => updateNursing("drainType", e.target.value)}
                    disabled={nursing.drain !== "Yes"}
                  >
                    <option value="">Select</option>
                    {drainTypeOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* 11. Nutrition Risk */}
                <div className="col-md-6">
                  <label className="form-label small">
                    11. Nutrition Risk <Required />
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={nursing.nutritionRisk}
                    onChange={(e) => updateNursing("nutritionRisk", e.target.value)}
                  >
                    <option value="">Select</option>
                    {nutritionRiskOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small">Remarks</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={nursing.nutritionRemarks}
                    onChange={(e) => updateNursing("nutritionRemarks", e.target.value)}
                    placeholder="Enter remarks"
                  />
                </div>

                {/* 12. Infection Risk */}
                <div className="col-md-6">
                  <label className="form-label small">
                    12. Infection Risk <Required />
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={nursing.infectionRisk}
                    onChange={(e) => updateNursing("infectionRisk", e.target.value)}
                  >
                    <option value="">Select</option>
                    {infectionRiskOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small">Remarks</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={nursing.infectionRemarks}
                    onChange={(e) => updateNursing("infectionRemarks", e.target.value)}
                    placeholder="Enter remarks"
                  />
                </div>

                {/* 13. Orientation */}
                <div className="col-md-6">
                  <label className="form-label small d-block">
                    13. Patient Orientation Done <Required />
                  </label>
                  <YesNoRadio
                    name="patientOrientation"
                    value={nursing.patientOrientation}
                    onChange={(val) => updateNursing("patientOrientation", val)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small d-block">
                    Relative Orientation Done <Required />
                  </label>
                  <YesNoRadio
                    name="relativeOrientation"
                    value={nursing.relativeOrientation}
                    onChange={(val) => updateNursing("relativeOrientation", val)}
                  />
                </div>

                {/* 14. Nursing Care Plan */}
                <div className="col-12">
                  <label className="form-label small">
                    14. Nursing Care Plan <Required />
                  </label>
                  <textarea
                    className="form-control form-control-sm"
                    rows="3"
                    value={nursing.nursingCarePlan}
                    onChange={(e) => updateNursing("nursingCarePlan", e.target.value)}
                    placeholder="Enter nursing care plan"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* B. MEDICAL ASSESSMENT                                            */}
        {/* ---------------------------------------------------------------- */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-light">
              <strong className="text-white">
                <i className="mdi mdi-stethoscope me-1"></i>
                B. MEDICAL ASSESSMENT
              </strong>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {/* 1. Chief Complaint */}
                <div className="col-12">
                  <label className="form-label small">
                    1. Chief Complaint <Required />
                  </label>
                  <textarea
                    className="form-control form-control-sm"
                    rows="2"
                    value={medical.chiefComplaint}
                    onChange={(e) => updateMedical("chiefComplaint", e.target.value)}
                    placeholder="Main reason for admission"
                  ></textarea>
                </div>

                {/* 2. History of Present Illness */}
                <div className="col-12">
                  <label className="form-label small">
                    2. History of Present Illness <Required />
                  </label>
                  <textarea
                    className="form-control form-control-sm"
                    rows="3"
                    value={medical.historyOfPresentIllness}
                    onChange={(e) => updateMedical("historyOfPresentIllness", e.target.value)}
                    placeholder="Details of current illness"
                  ></textarea>
                </div>

                {/* Family History / Medication History / Allergies */}
                <div className="col-md-4">
                  <label className="form-label small">Family History</label>
                  <textarea
                    className="form-control form-control-sm"
                    rows="2"
                    value={medical.familyHistory}
                    onChange={(e) => updateMedical("familyHistory", e.target.value)}
                    placeholder="Relevant family history"
                  ></textarea>
                </div>
                <div className="col-md-4">
                  <label className="form-label small">Medication History</label>
                  <textarea
                    className="form-control form-control-sm"
                    rows="2"
                    value={medical.medicationHistory}
                    onChange={(e) => updateMedical("medicationHistory", e.target.value)}
                    placeholder="Current / past medication"
                  ></textarea>
                </div>
                <div className="col-md-4">
                  <label className="form-label small">Allergies</label>
                  <textarea
                    className="form-control form-control-sm"
                    rows="2"
                    value={medical.allergies}
                    onChange={(e) => updateMedical("allergies", e.target.value)}
                    placeholder="Known allergies"
                  ></textarea>
                </div>

                {/* 6. General Examination */}
                <div className="col-12">
                  <label className="form-label small fw-semibold mb-1">
                    6. General Examination <Required />
                  </label>
                </div>
                <div className="col-md-7">
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label small">
                        Pulse (/min) <Required />
                      </label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={medical.pulse}
                        onChange={(e) => updateMedical("pulse", e.target.value)}
                        placeholder="e.g., 92"
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small">
                        BP (mmHg) <Required />
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={medical.bp}
                        onChange={(e) => updateMedical("bp", e.target.value)}
                        placeholder="e.g., 130/80"
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small">
                        Temperature (°F) <Required />
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={medical.temperature}
                        onChange={(e) => updateMedical("temperature", e.target.value)}
                        placeholder="e.g., 101"
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small">
                        RR (/min) <Required />
                      </label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={medical.rr}
                        onChange={(e) => updateMedical("rr", e.target.value)}
                        placeholder="e.g., 20"
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small">
                        SpO2 (%) <Required />
                      </label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={medical.spo2}
                        onChange={(e) => updateMedical("spo2", e.target.value)}
                        placeholder="e.g., 98"
                      />
                    </div>
                  </div>
                </div>
                <div className="col-md-5">
                  <label className="form-label small">General Examination Notes</label>
                  <textarea
                    className="form-control form-control-sm"
                    rows="5"
                    value={medical.generalExamNotes}
                    onChange={(e) => updateMedical("generalExamNotes", e.target.value)}
                    placeholder="General clinical findings"
                  ></textarea>
                </div>

                {/* 7. Systemic Examination */}
                <div className="col-12">
                  <label className="form-label small fw-semibold mb-1">
                    7. Systemic Examination <Required />
                  </label>
                </div>
                <div className="col-md-6">
                  <label className="form-label small">
                    RS (Respiratory System) <Required />
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={medical.rs}
                    onChange={(e) => updateMedical("rs", e.target.value)}
                    placeholder="Respiratory system findings"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small">
                    CVS (Cardiovascular System) <Required />
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={medical.cvs}
                    onChange={(e) => updateMedical("cvs", e.target.value)}
                    placeholder="Cardiovascular system findings"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small">
                    P/A (Abdomen) <Required />
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={medical.pa}
                    onChange={(e) => updateMedical("pa", e.target.value)}
                    placeholder="Abdomen examination"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small">
                    CNS (Central Nervous System) <Required />
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={medical.cns}
                    onChange={(e) => updateMedical("cns", e.target.value)}
                    placeholder="Central nervous system findings"
                  />
                </div>

                {/* 8. Provisional Diagnosis */}
                <div className="col-12">
                  <label className="form-label small">
                    8. Provisional Diagnosis <Required />
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={medical.provisionalDiagnosis}
                    onChange={(e) => updateMedical("provisionalDiagnosis", e.target.value)}
                    placeholder="ICD search or free text diagnosis"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================= BOTTOM ACTION BAR ======================= */}
      <div className=" m-3">
        <div className="card-body d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleSaveDraft}>
            <i className="mdi mdi-content-save-outline me-1"></i>Save Draft
          </button>
          <button type="button" className="btn btn-sm btn-success" onClick={handleFinalize}>
            <i className="mdi mdi-check me-1"></i>Finalize
          </button>
          <button type="button" className="btn btn-sm btn-light" onClick={handleClear}>
            <i className="mdi mdi-eraser me-1"></i>Clear
          </button>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={handleCancel}>
            <i className="mdi mdi-close me-1"></i>Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default IPDInitialAssessment;