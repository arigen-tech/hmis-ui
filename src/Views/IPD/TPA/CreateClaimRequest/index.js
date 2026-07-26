import React, { useState, useEffect } from "react";

const CreateClaimRequest = () => {
  // ---------- Search Patient ----------
  const [searchValue, setSearchValue] = useState("");

  // ---------- Patient Details (Manual Entry) ----------
  const [patientDetails, setPatientDetails] = useState({
    name: "",
    uhid: "",
    admissionNo: "",
    admissionDate: "",
    dischargeDate: "",
    ward: "",
  });

  // ---------- Insurance Details (Manual Entry) ----------
  const [insuranceDetails, setInsuranceDetails] = useState({
    company: "",
    tpa: "",
    policyNo: "",
    preauthNo: "",
    preauthAmount: "",
  });

  // ---------- Claim Details ----------
  const [claimDetails, setClaimDetails] = useState({
    totalBillAmount: "",
    eligibleClaimAmount: "",
    coPayPercent: "",
    nonCoveredAmount: "",
    patientPaidAmount: "",
  });

  // ---------- Documents ----------
  const [documents, setDocuments] = useState({
    finalBill: "",
    dischargeSummary: "",
    labReports: "",
    pharmacyBills: "",
    preauthApproval: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSendingToPortal, setIsSendingToPortal] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const hasError = (field) => (errors[field] ? "is-invalid" : "");
  const getErrorMessage = (field) => errors[field] || "";

  // Auto-calculate non-covered amount and patient paid amount
  // Non-covered = Total Bill - Eligible Claim Amount
  useEffect(() => {
    const total = parseFloat(claimDetails.totalBillAmount) || 0;
    const eligible = parseFloat(claimDetails.eligibleClaimAmount) || 0;
    const coPay = parseFloat(claimDetails.coPayPercent) || 0;

    const nonCovered = total - eligible;
    const coPayAmount = (eligible * coPay) / 100;
    const patientPaid = nonCovered + coPayAmount;

    setClaimDetails((prev) => ({
      ...prev,
      nonCoveredAmount: nonCovered > 0 ? nonCovered.toFixed(2) : "0.00",
      patientPaidAmount: patientPaid > 0 ? patientPaid.toFixed(2) : "0.00",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    claimDetails.totalBillAmount,
    claimDetails.eligibleClaimAmount,
    claimDetails.coPayPercent,
  ]);

  const handleSearch = () => {
    // UI only - placeholder for search action
    console.log("Searching patient for claim:", searchValue);
  };

  // --- Patient Details Handlers ---
  const handlePatientChange = (field, value) => {
    setPatientDetails((prev) => ({ ...prev, [field]: value }));
  };

  // --- Insurance Details Handlers ---
  const handleInsuranceChange = (field, value) => {
    setInsuranceDetails((prev) => ({ ...prev, [field]: value }));
  };

  // --- Claim Details Handlers ---
  const handleTotalBillAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    setClaimDetails((prev) => ({ ...prev, totalBillAmount: value }));
  };

  const handleEligibleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    setClaimDetails((prev) => ({ ...prev, eligibleClaimAmount: value }));
    setErrors((prev) => ({ ...prev, eligibleClaimAmount: "" }));
  };

  const handleCoPayChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    setClaimDetails((prev) => ({ ...prev, coPayPercent: value }));
  };

  const handleDocumentSelect = (field, value) => {
    setDocuments((prev) => ({ ...prev, [field]: value }));
  };

  const handleViewDocument = (docLabel) => {
    console.log("Viewing document:", docLabel);
  };

  const handlePreview = () => {
    console.log("Preview claim request");
  };

  const handleDownloadAll = () => {
    setIsDownloadingAll(true);
    console.log("Download all documents");
    setIsDownloadingAll(false);
  };

  const handleSendToPortal = () => {
    setIsSendingToPortal(true);
    console.log("Send to Portal", {
      patientDetails,
      insuranceDetails,
      claimDetails,
      documents,
    });
    setIsSendingToPortal(false);
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2 mb-0">
                Create Claim Request
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

              <form
                onSubmit={(e) => e.preventDefault()}
                className="forms row"
              >
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
                                UHID / Mobile / Admission No
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Enter UHID, Mobile or Admission No"
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
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ============ PATIENT DETAILS (MANUAL ENTRY) ============ */}
                  <div className="row mb-3">
                    <div className="col-sm-12">
                      <div className="card shadow mb-3">
                        <div className="card-header border-bottom-1 py-3">
                          <h6 className="fw-bold mb-0">
                            Patient Details
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="row g-3">
                            <div className="col-md-4">
                              <label className="form-label">Name</label>
                              <input
                                type="text"
                                className="form-control"
                                value={patientDetails.name}
                                onChange={(e) =>
                                  handlePatientChange("name", e.target.value)
                                }
                              />
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">UHID</label>
                              <input
                                type="text"
                                className="form-control"
                                value={patientDetails.uhid}
                                onChange={(e) =>
                                  handlePatientChange("uhid", e.target.value)
                                }
                              />
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">
                                Admission No
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                value={patientDetails.admissionNo}
                                onChange={(e) =>
                                  handlePatientChange("admissionNo", e.target.value)
                                }
                              />
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">
                                Admission Date
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                value={patientDetails.admissionDate}
                                onChange={(e) =>
                                  handlePatientChange("admissionDate", e.target.value)
                                }
                              />
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">
                                Discharge Date
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                value={patientDetails.dischargeDate}
                                onChange={(e) =>
                                  handlePatientChange("dischargeDate", e.target.value)
                                }
                              />
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">Ward</label>
                              <input
                                type="text"
                                className="form-control"
                                value={patientDetails.ward}
                                onChange={(e) =>
                                  handlePatientChange("ward", e.target.value)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ============ INSURANCE DETAILS (MANUAL ENTRY) ============ */}
                  <div className="row mb-3">
                    <div className="col-sm-12">
                      <div className="card shadow mb-3">
                        <div className="card-header border-bottom-1 py-3">
                          <h6 className="fw-bold mb-0">
                            Insurance Details
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="row g-3">
                            <div className="col-md-4">
                              <label className="form-label">Company</label>
                              <input
                                type="text"
                                className="form-control"
                                value={insuranceDetails.company}
                                onChange={(e) =>
                                  handleInsuranceChange("company", e.target.value)
                                }
                              />
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">TPA</label>
                              <input
                                type="text"
                                className="form-control"
                                value={insuranceDetails.tpa}
                                onChange={(e) =>
                                  handleInsuranceChange("tpa", e.target.value)
                                }
                              />
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">Policy No</label>
                              <input
                                type="text"
                                className="form-control"
                                value={insuranceDetails.policyNo}
                                onChange={(e) =>
                                  handleInsuranceChange("policyNo", e.target.value)
                                }
                              />
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">
                                Preauth No
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                value={insuranceDetails.preauthNo}
                                onChange={(e) =>
                                  handleInsuranceChange("preauthNo", e.target.value)
                                }
                              />
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">
                                Preauth Amount
                              </label>
                              <div className="input-group">
                                <span className="input-group-text">₹</span>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={insuranceDetails.preauthAmount}
                                  onChange={(e) =>
                                    handleInsuranceChange("preauthAmount", e.target.value)
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ============ CLAIM DETAILS ============ */}
                  <div className="row mb-3">
                    <div className="col-sm-12">
                      <div className="card shadow mb-3">
                        <div className="card-header border-bottom-1 py-3">
                          <h6 className="fw-bold mb-0">
                            Claim Details
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="row g-3">
                            <div className="col-md-4">
                              <label className="form-label">
                                Total Bill Amount
                              </label>
                              <div className="input-group">
                                <span className="input-group-text">₹</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  className="form-control"
                                  value={claimDetails.totalBillAmount}
                                  onChange={handleTotalBillAmountChange}
                                />
                              </div>
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">
                                Eligible Claim Amount
                              </label>
                              <div className="input-group">
                                <span className="input-group-text">₹</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  className={`form-control ${hasError("eligibleClaimAmount")}`}
                                  id="eligibleClaimAmount"
                                  value={claimDetails.eligibleClaimAmount}
                                  onChange={handleEligibleAmountChange}
                                />
                              </div>
                              {getErrorMessage("eligibleClaimAmount") && (
                                <div className="invalid-feedback d-block">
                                  {getErrorMessage("eligibleClaimAmount")}
                                </div>
                              )}
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">
                                Co-pay %
                              </label>
                              <div className="input-group">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  className="form-control"
                                  value={claimDetails.coPayPercent}
                                  onChange={handleCoPayChange}
                                />
                                <span className="input-group-text">%</span>
                              </div>
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">
                                Non-covered Amount
                              </label>
                              <div className="input-group">
                                <span className="input-group-text">₹</span>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={claimDetails.nonCoveredAmount}
                                  style={{ backgroundColor: "#e9ecef" }}
                                  readOnly
                                />
                              </div>
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">
                                Patient Paid Amount
                              </label>
                              <div className="input-group">
                                <span className="input-group-text">₹</span>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={claimDetails.patientPaidAmount}
                                  style={{ backgroundColor: "#e9ecef" }}
                                  readOnly
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ============ DOCUMENTS ============ */}
                  <div className="row mb-3">
                    <div className="col-sm-12">
                      <div className="card shadow mb-3">
                        <div className="card-header border-bottom-1 py-3">
                          <h6 className="fw-bold mb-0">
                            Documents
                          </h6>
                        </div>
                        <div className="card-body">
                          <table className="table table-bordered align-middle">
                            <thead>
                              <tr>
                                <th style={{ width: "220px" }}>
                                  Document
                                </th>
                                <th>Select File</th>
                                <th style={{ width: "100px" }}>
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>Final Bill</td>
                                <td>
                                  <select
                                    className="form-select"
                                    value={documents.finalBill}
                                    onChange={(e) =>
                                      handleDocumentSelect(
                                        "finalBill",
                                        e.target.value,
                                      )
                                    }
                                  >
                                    <option value="">
                                      Select Final Bill
                                    </option>
                                  </select>
                                </td>
                                <td className="text-center">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-primary"
                                    onClick={() =>
                                      handleViewDocument("Final Bill")
                                    }
                                    title="View"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                              <tr>
                                <td>Discharge Summary</td>
                                <td>
                                  <select
                                    className="form-select"
                                    value={documents.dischargeSummary}
                                    onChange={(e) =>
                                      handleDocumentSelect(
                                        "dischargeSummary",
                                        e.target.value,
                                      )
                                    }
                                  >
                                    <option value="">
                                      Select Discharge Summary
                                    </option>
                                  </select>
                                </td>
                                <td className="text-center">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-primary"
                                    onClick={() =>
                                      handleViewDocument(
                                        "Discharge Summary",
                                      )
                                    }
                                    title="View"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                              <tr>
                                <td>Lab Reports</td>
                                <td>
                                  <select
                                    className="form-select"
                                    value={documents.labReports}
                                    onChange={(e) =>
                                      handleDocumentSelect(
                                        "labReports",
                                        e.target.value,
                                      )
                                    }
                                  >
                                    <option value="">
                                      Select Lab Reports
                                    </option>
                                  </select>
                                </td>
                                <td className="text-center">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-primary"
                                    onClick={() =>
                                      handleViewDocument("Lab Reports")
                                    }
                                    title="View"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                              <tr>
                                <td>Pharmacy Bills</td>
                                <td>
                                  <select
                                    className="form-select"
                                    value={documents.pharmacyBills}
                                    onChange={(e) =>
                                      handleDocumentSelect(
                                        "pharmacyBills",
                                        e.target.value,
                                      )
                                    }
                                  >
                                    <option value="">
                                      Select Pharmacy Bills
                                    </option>
                                  </select>
                                </td>
                                <td className="text-center">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-primary"
                                    onClick={() =>
                                      handleViewDocument("Pharmacy Bills")
                                    }
                                    title="View"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                              <tr>
                                <td>Preauth Approval</td>
                                <td>
                                  <select
                                    className="form-select"
                                    value={documents.preauthApproval}
                                    onChange={(e) =>
                                      handleDocumentSelect(
                                        "preauthApproval",
                                        e.target.value,
                                      )
                                    }
                                  >
                                    <option value="">
                                      Select Preauth Approval
                                    </option>
                                  </select>
                                </td>
                                <td className="text-center">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-primary"
                                    onClick={() =>
                                      handleViewDocument(
                                        "Preauth Approval",
                                      )
                                    }
                                    title="View"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            </tbody>
                          </table>

                          <div className="d-flex justify-content-end gap-2 mt-2">
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={handlePreview}
                            >
                              Preview
                            </button>
                            <button
                              type="button"
                              className="btn btn-info text-white"
                              onClick={handleDownloadAll}
                              disabled={isDownloadingAll}
                            >
                              {isDownloadingAll ? (
                                <>
                                  <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                    aria-hidden="true"
                                  ></span>
                                  Downloading...
                                </>
                              ) : (
                                "Download All"
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ============ ACTION BUTTONS ============ */}
                  <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={handleSendToPortal}
                      disabled={isSendingToPortal}
                    >
                      {isSendingToPortal ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Sending...
                        </>
                      ) : (
                        "Send to Portal"
                      )}
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

export default CreateClaimRequest;