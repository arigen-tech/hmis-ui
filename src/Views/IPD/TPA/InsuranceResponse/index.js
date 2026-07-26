import React, { useState } from "react";

const InsuranceResponse = () => {
  // ---------- Insurance Response (Editable Section) ----------
  const [insuranceResponse, setInsuranceResponse] = useState({
    preauthNo: "",
    approvedAmount: "",
    status: "",
    approvalDate: "",
  });

  const [errors, setErrors] = useState({});

  const statusOptions = [
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
    { value: "PARTIALLY_APPROVED", label: "Partially Approved" },
    { value: "PENDING", label: "Pending" },
  ];

  const hasError = (field) => (errors[field] ? "is-invalid" : "");
  const getErrorMessage = (field) => errors[field] || "";

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setInsuranceResponse((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: "" }));
  };

  const handleAmountChange = (e) => {
    const { id, value } = e.target;
    const numericValue = value.replace(/[^0-9.]/g, "");
    setInsuranceResponse((prev) => ({ ...prev, [id]: numericValue }));
    setErrors((prev) => ({ ...prev, [id]: "" }));
  };

  const handleStatusChange = (e) => {
    setInsuranceResponse((prev) => ({ ...prev, status: e.target.value }));
    setErrors((prev) => ({ ...prev, status: "" }));
  };

  return (
    <div className="row mb-3">
      <div className="col-sm-12">
        <div className="card shadow mb-3">
          <div className="card-header border-bottom-1 py-3">
            <h6 className="fw-bold mb-0">
              Insurance Response
             
            </h6>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Preauth No <span className="text-danger"> *</span></label>
                <input
                  type="text"
                  required
                  className={`form-control ${hasError("preauthNo")}`}
                  id="preauthNo"
                  placeholder="Enter Preauth No"
                  value={insuranceResponse.preauthNo}
                  onChange={handleInputChange}
                />
                {getErrorMessage("preauthNo") && (
                  <div className="invalid-feedback">
                    {getErrorMessage("preauthNo")}
                  </div>
                )}
              </div>

              <div className="col-md-3">
                <label className="form-label">Approved Amount <span className="text-danger">*</span></label>
                <div className="input-group">
                  <span className="input-group-text">₹</span>
                  <input
                    type="text"
                    required
                    inputMode="decimal"
                    className={`form-control ${hasError("approvedAmount")}`}
                    id="approvedAmount"
                    placeholder="0.00"
                    value={insuranceResponse.approvedAmount}
                    onChange={handleAmountChange}
                  />
                </div>
                {getErrorMessage("approvedAmount") && (
                  <div className="invalid-feedback d-block">
                    {getErrorMessage("approvedAmount")}
                  </div>
                )}
              </div>

              <div className="col-md-3">
                <label className="form-label">Status <span className="text-danger">*</span></label>
                <select
                  className={`form-select ${hasError("status")}`}
                  style={{ paddingRight: "40px" }}
                  id="status"
                  value={insuranceResponse.status}
                  onChange={handleStatusChange}
                >
                  <option value="">Select Status</option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {getErrorMessage("status") && (
                  <div className="invalid-feedback">
                    {getErrorMessage("status")}
                  </div>
                )}
              </div>

              <div className="col-md-3">
                <label className="form-label">Approval Date</label>
                <input
                  type="text"
                  className="form-control"
                  id="approvalDate"
                  value={insuranceResponse.approvalDate}
                  style={{ backgroundColor: "#e9ecef" }}
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsuranceResponse;
