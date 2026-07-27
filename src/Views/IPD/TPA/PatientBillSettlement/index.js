import React, { useState, useEffect } from "react";

const PatientBillSettlement = () => {
  // ---------- Search Patient ----------
  const [searchValue, setSearchValue] = useState("");

  // ---------- Bill Summary (Auto-Fetch) ----------
  const [billSummary, setBillSummary] = useState({
    totalBill: 0,
    insuranceCovered: 0,
    patientPayable: 0,
  });

  // ---------- Advance & Balance (Manual Entry / Auto) ----------
  const [advancePaid, setAdvancePaid] = useState("");
  const [balance, setBalance] = useState(0);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Auto-calculate balance whenever patientPayable or advancePaid changes
  useEffect(() => {
    const payable = parseFloat(billSummary.patientPayable) || 0;
    const advance = parseFloat(advancePaid) || 0;
    setBalance(payable - advance);
  }, [billSummary.patientPayable, advancePaid]);

  const hasError = (field) => (errors[field] ? "is-invalid" : "");
  const getErrorMessage = (field) => errors[field] || "";

  const handleSearch = () => {
    // UI only - placeholder for search action
    console.log("Searching patient bill for:", searchValue);
  };

  const handleAdvanceChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    setAdvancePaid(value);
    setErrors((prev) => ({ ...prev, advancePaid: "" }));
  };

  const handleCollectPayment = () => {
    setIsCollecting(true);
    // UI only - placeholder for collect payment action
    console.log("Collect Payment:", { advancePaid, balance });
    setIsCollecting(false);
  };

  const handleFinalizeBill = () => {
    setIsFinalizing(true);
    // UI only - placeholder for finalize bill action
    console.log("Finalize Bill:", { billSummary, advancePaid, balance });
    setIsFinalizing(false);
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2 mb-0">
                Patient Bill Settlement
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


                  <div className="row mb-3">
                    <div className="col-sm-12">
                      <div className="card shadow mb-3">
                        <div className="card-header border-bottom-1 py-3">
                          <h6 className="fw-bold mb-0">
                            Bill Summary
                           
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="row g-3">
                            <div className="col-md-4">
                              <label className="form-label">
                                Total Bill
                              </label>
                              <div className="input-group">
                                <span className="input-group-text">₹</span>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={billSummary.totalBill}
                                  readOnly
                                  disabled
                                />
                              </div>
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">
                                Insurance Covered
                              </label>
                              <div className="input-group">
                                <span className="input-group-text">₹</span>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={billSummary.insuranceCovered}
                                  readOnly
                                  disabled
                                />
                              </div>
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">
                                Patient Payable
                              </label>
                              <div className="input-group">
                                <span className="input-group-text">₹</span>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={billSummary.patientPayable}
                                  readOnly
                                  disabled
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ============ ADVANCE & BALANCE ============ */}
                  <div className="row mb-3">
                    <div className="col-sm-12">
                      <div className="card shadow mb-3">
                        <div className="card-header border-bottom-1 py-3">
                          <h6 className="fw-bold mb-0">
                            Advance & Balance
                          
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="row g-3">
                            <div className="col-md-4">
                              <label className="form-label">
                                Advance Paid *
                              </label>
                              <div className="input-group">
                                <span className="input-group-text">₹</span>
                                <input
                                  type="text"
                                  required
                                  inputMode="decimal"
                                  className={`form-control ${hasError("advancePaid")}`}
                                  id="advancePaid"
                                  placeholder="0.00"
                                  value={advancePaid}
                                  onChange={handleAdvanceChange}
                                />
                              </div>
                              {getErrorMessage("advancePaid") && (
                                <div className="invalid-feedback d-block">
                                  {getErrorMessage("advancePaid")}
                                </div>
                              )}
                            </div>

                            <div className="col-md-4">
                              <label className="form-label">
                                Balance Payable
                              </label>
                              <div className="input-group">
                                <span className="input-group-text">₹</span>
                                <input
                                  type="text"
                                  className="form-control fw-bold"
                                  value={balance.toFixed(2)}
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

                  {/* ============ ACTION BUTTONS ============ */}
                  <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                    <button
                      type="button"
                      className="btn btn-warning me-2"
                      onClick={handleCollectPayment}
                      disabled={isCollecting || isFinalizing}
                    >
                      {isCollecting ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Collecting...
                        </>
                      ) : (
                        "Collect Payment"
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={handleFinalizeBill}
                      disabled={isCollecting || isFinalizing}
                    >
                      {isFinalizing ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Finalizing...
                        </>
                      ) : (
                        "Finalize Bill"
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

export default PatientBillSettlement;