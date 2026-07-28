import React, { useState, useEffect } from "react";

// Sample patient data (JSON mock)
const patientsData = [
  {
    uhid: "UHID001",
    mobile: "9876543210",
    name: "John Doe",
    age: 45,
    gender: "Male",
    admissionNo: "ADM-2024-001",
    admissionDate: "2024-01-15",
    ward: "General Ward A"
  },
  {
    uhid: "UHID002",
    mobile: "9123456780",
    name: "Jane Smith",
    age: 32,
    gender: "Female",
    admissionNo: "ADM-2024-002",
    admissionDate: "2024-02-20",
    ward: "ICU"
  },
  {
    uhid: "UHID003",
    mobile: "9011223344",
    name: "Robert Brown",
    age: 60,
    gender: "Male",
    admissionNo: "",
    admissionDate: "",
    ward: ""
  }
];

const CreatePreauthRequest = () => {
  // ---------- Search ----------
  const [searchValue, setSearchValue] = useState("");
  const [searchMessage, setSearchMessage] = useState("");

  // ---------- Patient Info (Auto-Fetch) ----------
  const [patientInfo, setPatientInfo] = useState({
    name: "",
    uhid: "",
    ageGender: "",
  });

  // ---------- Admission Details (Auto-Detected) ----------
  const [admissionInfo, setAdmissionInfo] = useState({
    admissionNo: "",
    admissionDate: "",
    ward: "",
  });

  // ---------- Insurance Details ----------
  const [insurance, setInsurance] = useState({
    insuranceCompany: "",
    tpa: "",
    policyNo: "",
    sumInsured: "",
  });

  // ---------- Clinical Details ----------
  const [clinical, setClinical] = useState({
    diagnosis: "",
    provisionalDiagnosis: "",
    treatmentPlan: "",
  });

  // ---------- Estimated Costing ----------
  const [costing, setCosting] = useState({
    roomChargesEstimate: "",
    procedureEstimate: "",
    medicineEstimate: "",
    otherCharges: "",
  });

  // ---------- Total Estimate (Auto) ----------
  const [totalEstimate, setTotalEstimate] = useState(0);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Auto-calculate total estimate whenever costing fields change
  useEffect(() => {
    const sum =
      (parseFloat(costing.roomChargesEstimate) || 0) +
      (parseFloat(costing.procedureEstimate) || 0) +
      (parseFloat(costing.medicineEstimate) || 0) +
      (parseFloat(costing.otherCharges) || 0);
    setTotalEstimate(sum);
  }, [costing]);

  // ---------- Handlers ----------
  const handleSearch = () => {
    // Search using local patient data
    const trimmedSearch = searchValue.trim();
    if (!trimmedSearch) {
      setSearchMessage("Please enter a UHID or Mobile Number.");
      return;
    }

    const foundPatient = patientsData.find(
      (p) => p.uhid === trimmedSearch || p.mobile === trimmedSearch
    );

    if (foundPatient) {
      setPatientInfo({
        name: foundPatient.name,
        uhid: foundPatient.uhid,
        ageGender: `${foundPatient.age} / ${foundPatient.gender}`,
      });
      setAdmissionInfo({
        admissionNo: foundPatient.admissionNo || "",
        admissionDate: foundPatient.admissionDate || "",
        ward: foundPatient.ward || "",
      });
      setSearchMessage("");
    } else {
      // Clear previous patient data
      setPatientInfo({ name: "", uhid: "", ageGender: "" });
      setAdmissionInfo({ admissionNo: "", admissionDate: "", ward: "" });
      setSearchMessage("No patient found with the given UHID or Mobile Number.");
    }
  };

  const handleInsuranceChange = (e) => {
    const { id, value } = e.target;
    setInsurance((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: "" }));
  };

  const handleClinicalChange = (e) => {
    const { id, value } = e.target;
    setClinical((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: "" }));
  };

  const handleCostingChange = (e) => {
    const { id, value } = e.target;
    const numericValue = value.replace(/[^0-9.]/g, "");
    setCosting((prev) => ({ ...prev, [id]: numericValue }));
    setErrors((prev) => ({ ...prev, [id]: "" }));
  };

  const hasError = (field) => (errors[field] ? "is-invalid" : "");
  const getErrorMessage = (field) => errors[field] || "";

  const resetForm = () => {
    setSearchValue("");
    setSearchMessage("");
    setPatientInfo({ name: "", uhid: "", ageGender: "" });
    setAdmissionInfo({ admissionNo: "", admissionDate: "", ward: "" });
    setInsurance({
      insuranceCompany: "",
      tpa: "",
      policyNo: "",
      sumInsured: "",
    });
    setClinical({
      diagnosis: "",
      provisionalDiagnosis: "",
      treatmentPlan: "",
    });
    setCosting({
      roomChargesEstimate: "",
      procedureEstimate: "",
      medicineEstimate: "",
      otherCharges: "",
    });
    setErrors({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // UI only - placeholder for save action
    console.log("Preauth Request Submitted", {
      patientInfo,
      admissionInfo,
      insurance,
      clinical,
      costing,
      totalEstimate,
    });
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2 mb-0">
                Create Preauth Request
              </h4>
            </div>

            <div className="card-body p-2 pb-0">
              {loading && (
                <div className="alert alert-info d-flex align-items-center gap-2 py-2 mb-3">
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  />
                  <span>Loading data, please wait...</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="forms row">
                <fieldset>
                  {/* ============ SEARCH PATIENT ============ */}
                  <div className="row mb-3">
                    <div className="col-sm-12">
                      <div className="card shadow mb-3">
                        <div className="card-header border-bottom-1 py-3">
                          <h6 className="fw-bold mb-0">
                            Search Patient
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="row g-3 align-items-end">
                            <div className="col-md-4">
                              <label className="form-label">
                                UHID / Mobile Number
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Enter UHID or Mobile Number"
                                value={searchValue}
                                onChange={(e) =>
                                  setSearchValue(e.target.value)
                                }
                              />
                            </div>
                            <div className="col-md-2">
                              <button
                                type="button"
                                className="btn btn-primary w-100"
                                onClick={handleSearch}
                              >
                                Search
                              </button>
                            </div>
                            <div className="col-md-6">
                              {searchMessage && (
                                <div className="alert alert-warning py-1 mb-0">
                                  {searchMessage}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ============ PATIENT INFO (AUTO-FETCH) ============ */}
                  <div className="row mb-3">
                    <div className="col-sm-12">
                      <div className="card shadow mb-3">
                        <div className="card-header border-bottom-1 py-3">
                          <h6 className="fw-bold mb-0">
                            Patient Info
                          
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="row g-3">
                            <div className="col-md-4">
                              <label className="form-label">Name</label>
                              <input
                                type="text"
                                className="form-control"
                                value={patientInfo.name}
                                readOnly
                                disabled
                              />
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">UHID</label>
                              <input
                                type="text"
                                className="form-control"
                                value={patientInfo.uhid}
                                readOnly
                                disabled
                              />
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">
                                Age / Gender
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                value={patientInfo.ageGender}
                                readOnly
                                disabled
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ============ ADMISSION DETAILS (AUTO-DETECTED) ============ */}
                  <div className="row mb-3">
                    <div className="col-sm-12">
                      <div className="card shadow mb-3">
                        <div className="card-header border-bottom-1 py-3">
                          <h6 className="fw-bold mb-0">
                            Admission Details
                         
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="row g-3">
                            <div className="col-md-4">
                              <label className="form-label">
                                Admission No
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                value={admissionInfo.admissionNo}
                                readOnly
                                disabled
                              />
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">
                                Admission Date
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                value={admissionInfo.admissionDate}
                                readOnly
                                disabled
                              />
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">Ward</label>
                              <input
                                type="text"
                                className="form-control"
                                value={admissionInfo.ward}
                                readOnly
                                disabled
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ============ INSURANCE DETAILS ============ */}
                  <div className="row mb-3">
                    <div className="col-sm-12">
                      <div className="card shadow mb-3">
                        <div className="card-header border-bottom-1 py-3">
                          <h6 className="fw-bold mb-0">
                            Insurance Details
                            <span className="badge bg-info text-dark ms-2">
                               
                            </span>
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="row g-3">
                            <div className="col-md-3">
                              <label className="form-label">
                                Insurance Company *
                              </label>
                              <input
                                type="text"
                                required
                                className={`form-control ${hasError("insuranceCompany")}`}
                                id="insuranceCompany"
                                placeholder="Insurance Company"
                                value={insurance.insuranceCompany}
                                onChange={handleInsuranceChange}
                              />
                              {getErrorMessage("insuranceCompany") && (
                                <div className="invalid-feedback">
                                  {getErrorMessage("insuranceCompany")}
                                </div>
                              )}
                            </div>
                            <div className="col-md-3">
                              <label className="form-label">TPA *</label>
                              <input
                                type="text"
                                required
                                className={`form-control ${hasError("tpa")}`}
                                id="tpa"
                                placeholder="TPA"
                                value={insurance.tpa}
                                onChange={handleInsuranceChange}
                              />
                              {getErrorMessage("tpa") && (
                                <div className="invalid-feedback">
                                  {getErrorMessage("tpa")}
                                </div>
                              )}
                            </div>
                            <div className="col-md-3">
                              <label className="form-label">
                                Policy No *
                              </label>
                              <input
                                type="text"
                                required
                                className={`form-control ${hasError("policyNo")}`}
                                id="policyNo"
                                placeholder="Policy No"
                                value={insurance.policyNo}
                                onChange={handleInsuranceChange}
                              />
                              {getErrorMessage("policyNo") && (
                                <div className="invalid-feedback">
                                  {getErrorMessage("policyNo")}
                                </div>
                              )}
                            </div>
                            <div className="col-md-3">
                              <label className="form-label">
                                Sum Insured *
                              </label>
                              <div className="input-group">
                                <span className="input-group-text">₹</span>
                                <input
                                  type="text"
                                  required
                                  inputMode="numeric"
                                  className={`form-control ${hasError("sumInsured")}`}
                                  id="sumInsured"
                                  placeholder="0.00"
                                  value={insurance.sumInsured}
                                  onChange={handleInsuranceChange}
                                />
                              </div>
                              {getErrorMessage("sumInsured") && (
                                <div className="invalid-feedback d-block">
                                  {getErrorMessage("sumInsured")}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ============ CLINICAL DETAILS ============ */}
                  <div className="row mb-3">
                    <div className="col-sm-12">
                      <div className="card shadow mb-3">
                        <div className="card-header border-bottom-1 py-3">
                          <h6 className="fw-bold mb-0">
                            Clinical Details
                            <span className="badge bg-info text-dark ms-2">
                               
                            </span>
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="row g-3">
                            <div className="col-md-4">
                              <label className="form-label">
                                Diagnosis *
                              </label>
                              <textarea
                                required
                                id="diagnosis"
                                className={`form-control ${hasError("diagnosis")}`}
                                placeholder="Diagnosis"
                                value={clinical.diagnosis}
                                onChange={handleClinicalChange}
                                rows={3}
                              ></textarea>
                              {getErrorMessage("diagnosis") && (
                                <div className="invalid-feedback">
                                  {getErrorMessage("diagnosis")}
                                </div>
                              )}
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">
                                Provisional Diagnosis *
                              </label>
                              <textarea
                                required
                                id="provisionalDiagnosis"
                                className={`form-control ${hasError("provisionalDiagnosis")}`}
                                placeholder="Provisional Diagnosis"
                                value={clinical.provisionalDiagnosis}
                                onChange={handleClinicalChange}
                                rows={3}
                              ></textarea>
                              {getErrorMessage("provisionalDiagnosis") && (
                                <div className="invalid-feedback">
                                  {getErrorMessage("provisionalDiagnosis")}
                                </div>
                              )}
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">
                                Treatment Plan *
                              </label>
                              <textarea
                                required
                                id="treatmentPlan"
                                className={`form-control ${hasError("treatmentPlan")}`}
                                placeholder="Treatment Plan"
                                value={clinical.treatmentPlan}
                                onChange={handleClinicalChange}
                                rows={3}
                              ></textarea>
                              {getErrorMessage("treatmentPlan") && (
                                <div className="invalid-feedback">
                                  {getErrorMessage("treatmentPlan")}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ============ ESTIMATED COSTING ============ */}
                  <div className="row mb-3">
                    <div className="col-sm-12">
                      <div className="card shadow mb-3">
                        <div className="card-header border-bottom-1 py-3">
                          <h6 className="fw-bold mb-0">
                            Estimated Costing
                            <span className="badge bg-info text-dark ms-2">
                               
                            </span>
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="row g-3">
                            <div className="col-md-3">
                              <label className="form-label">
                                Room Charges Estimate
                              </label>
                              <div className="input-group">
                                <span className="input-group-text">₹</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  className="form-control"
                                  id="roomChargesEstimate"
                                  placeholder="0.00"
                                  value={costing.roomChargesEstimate}
                                  onChange={handleCostingChange}
                                />
                              </div>
                            </div>
                            <div className="col-md-3">
                              <label className="form-label">
                                Procedure Estimate
                              </label>
                              <div className="input-group">
                                <span className="input-group-text">₹</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  className="form-control"
                                  id="procedureEstimate"
                                  placeholder="0.00"
                                  value={costing.procedureEstimate}
                                  onChange={handleCostingChange}
                                />
                              </div>
                            </div>
                            <div className="col-md-3">
                              <label className="form-label">
                                Medicine Estimate
                              </label>
                              <div className="input-group">
                                <span className="input-group-text">₹</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  className="form-control"
                                  id="medicineEstimate"
                                  placeholder="0.00"
                                  value={costing.medicineEstimate}
                                  onChange={handleCostingChange}
                                />
                              </div>
                            </div>
                            <div className="col-md-3">
                              <label className="form-label">
                                Other Charges
                              </label>
                              <div className="input-group">
                                <span className="input-group-text">₹</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  className="form-control"
                                  id="otherCharges"
                                  placeholder="0.00"
                                  value={costing.otherCharges}
                                  onChange={handleCostingChange}
                                />
                              </div>
                            </div>
                          </div>

                          <hr className="my-3" />

                          <div className="row">
                            <div className="col-md-4 offset-md-8">
                              <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                                <span className="fw-bold">
                                  Total Estimate
                                </span>
                                <span className="fw-bold fs-5 text-success">
                                  ₹{totalEstimate.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ============ ACTION BUTTONS ============ */}
                  <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                    <button type="submit" className="btn btn-primary me-2">
                      Submit Preauth Request
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                  </div>
                </fieldset>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePreauthRequest;