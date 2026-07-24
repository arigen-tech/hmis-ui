import { useEffect, useMemo, useState } from "react";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import Popup from "../../../Components/popup";
import {
  BILLING_REFUND_PATIENT_LIST,
  FILTER_LAB_DEPT,
  FILTER_OPD_DEPT,
  FILTER_RADIO_DEPT,
  PATIENT_BILLING_REFUND_DETAILS,
  REQUEST_PARAM_FROM_DATE,
  REQUEST_PARAM_PAGE,
  REQUEST_PARAM_PATIENT_NAME,
  REQUEST_PARAM_SIZE,
  REQUEST_PARAM_TO_DATE,
} from "../../../config/apiConfig";
import { getRequest } from "../../../service/apiService";

const SERVICE_OPTIONS = [
  { value: "All", label: "All" },
  { value: FILTER_OPD_DEPT, label: "OPD" },
  { value: FILTER_LAB_DEPT, label: "Laboratory" },
  { value: FILTER_RADIO_DEPT, label: "Radiology" },
];

const DEFAULT_FILTERS = {
  patientName: "",
  mobileNo: "",
  billingService: "All",
  refundStatus: "All",
  fromDate: "",
  toDate: "",
};

const BillingRefundDetails = () => {
  const [patientName, setPatientName] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [billingService, setBillingService] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [refundStatus, setRefundStatus] = useState("All");

  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [refundRows, setRefundRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [viewData, setViewData] = useState(null);
  const [showViewPopup, setShowViewPopup] = useState(false);
  const [detailRows, setDetailRows] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);

  const totalPages = Math.ceil(totalElements / DEFAULT_ITEMS_PER_PAGE);

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => setPopupMessage(null),
    });
  };

  const formatApiDate = (value) => {
    if (!value) return "-";

    const text = String(value).trim();
    if (!text || text === "-") return "-";

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      const [year, month, day] = text.split("-");
      return `${day}/${month}/${year}`;
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
      return text;
    }

    const date = new Date(text);
    if (Number.isNaN(date.getTime())) {
      return text;
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatAgeGender = (age, gender) => {
    const ageText = age === null || age === undefined || String(age).trim() === "" ? "-" : String(age).trim();
    const genderText = gender === null || gender === undefined || String(gender).trim() === "" ? "-" : String(gender).trim();

    if (ageText === "-" && genderText === "-") {
      return "-";
    }

    if (ageText === "-") {
      return genderText;
    }

    if (genderText === "-") {
      return ageText;
    }

    return `${ageText} / ${genderText}`;
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    const amount = Number(value);
    if (Number.isNaN(amount)) {
      return String(value);
    }

    return `Rs. ${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const normalizeRefundStatus = (value) => {
    const status = String(value || "").trim().toLowerCase();

    if (!status) return "";
    if (["completed", "complete", "done", "paid", "y", "yes"].includes(status)) {
      return "Completed";
    }
    if (["pending", "p", "n"].includes(status)) {
      return "Pending";
    }

    return String(value).trim();
  };

  const getRefundBadgeClass = (status) => {
    return normalizeRefundStatus(status) === "Completed"
      ? "bg-success"
      : "bg-warning text-dark";
  };

  const fetchRefundList = async (page = 0, filters = appliedFilters) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        [REQUEST_PARAM_PAGE]: String(page),
        [REQUEST_PARAM_SIZE]: String(DEFAULT_ITEMS_PER_PAGE),
      });

      if (filters.patientName.trim()) {
        params.append(REQUEST_PARAM_PATIENT_NAME, filters.patientName.trim());
      }

      if (filters.mobileNo.trim()) {
        params.append("mobileNo", filters.mobileNo.trim());
      }

      if (filters.billingService !== "All") {
        params.append("billingServiceType", filters.billingService);
      }

      if (filters.refundStatus !== "All") {
        params.append("refundStatus", filters.refundStatus);
      }

      if (filters.fromDate) {
        params.append(REQUEST_PARAM_FROM_DATE, filters.fromDate);
      }

      if (filters.toDate) {
        params.append(REQUEST_PARAM_TO_DATE, filters.toDate);
      }

      const data = await getRequest(`${BILLING_REFUND_PATIENT_LIST}?${params.toString()}`);
      const pageData = data?.response ?? {};
      const content = Array.isArray(pageData.content) ? pageData.content : [];

      setRefundRows(content);
      setTotalElements(Number(pageData.totalElements || 0));
    } catch (error) {
      console.error("Failed to fetch billing refund list:", error);
      setRefundRows([]);
      setTotalElements(0);
      showPopup("Unable to load billing refund records.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchRefundDetails = async (billingHeaderId) => {
    if (!billingHeaderId) {
      setDetailRows([]);
      showPopup("Unable to load refund details because the billing ID is missing.", "error");
      return;
    }

    try {
      setDetailLoading(true);
      const data = await getRequest(`${PATIENT_BILLING_REFUND_DETAILS}/${billingHeaderId}`);
      setDetailRows(Array.isArray(data?.response) ? data.response : []);
    } catch (error) {
      console.error("Failed to fetch billing refund details:", error);
      setDetailRows([]);
      showPopup("Unable to load refund details.", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchRefundList(currentPage - 1, appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, appliedFilters]);

  const visibleRows = useMemo(() => refundRows, [refundRows]);

  const handleSearch = () => {
    setCurrentPage(1);
    setAppliedFilters({
      patientName,
      mobileNo,
      billingService,
      refundStatus,
      fromDate,
      toDate,
    });
  };

  const handleReset = () => {
    setPatientName("");
    setMobileNo("");
    setBillingService("All");
    setRefundStatus("All");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
    setAppliedFilters(DEFAULT_FILTERS);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleView = async (item) => {
    setViewData(item);
    setShowViewPopup(true);
    setDetailRows([]);
    await fetchRefundDetails(item.billingHeaderId);
  };

  const handleExport = () => {
    showPopup("Export refund register is not wired yet.", "info");
  };

  const selectedRefundDetail = detailRows[0] ?? null;

  if (loading && refundRows.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <div className="content-wrapper">
      {popupMessage && <Popup {...popupMessage} />}

      {showViewPopup && viewData && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{
              margin: "0 auto",
              position: "fixed",
              top: "50%",
              left: "55%",
              transform: "translate(-50%, -50%)",
              width: "50%",
              maxWidth: "560px",
              height: "auto",
              maxHeight: "80vh",
            }}
          >
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Refund Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowViewPopup(false);
                    setViewData(null);
                    setDetailRows([]);
                    setDetailLoading(false);
                  }}
                />
              </div>
              <div className="modal-body">
                {/* <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="fw-bold">Registration No.</label>
                    <p>{viewData.registrationNo || "-"}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="fw-bold">Patient Name</label>
                    <p>{viewData.patientName || "-"}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="fw-bold">Mobile No.</label>
                    <p>{viewData.mobileNo || "-"}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="fw-bold">Age / Gender</label>
                    <p>{formatAgeGender(viewData.age, viewData.gender)}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="fw-bold">Billing Type</label>
                    <p>{viewData.billingType || "-"}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="fw-bold">Department</label>
                    <p>{viewData.departmentName || "-"}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="fw-bold">Registration Date</label>
                    <p>{formatApiDate(viewData.date)}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="fw-bold">Cancelled Date</label>
                    <p>{formatApiDate(viewData.cancelledDate)}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="fw-bold">Refund Date</label>
                    <p>{formatApiDate(viewData.refundDate)}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="fw-bold">Billing Amount</label>
                    <p>Rs. {viewData.billingAmount ?? "-"}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="fw-bold">Refund Status</label>
                    <p>
                      <span
                        className={`badge ${getRefundBadgeClass(
                          viewData.refundStatus,
                        )}`}
                      >
                        {normalizeRefundStatus(viewData.refundStatus) ||
                          viewData.refundStatus ||
                          "-"}
                      </span>
                    </p>
                  </div>
                </div> */}

                <hr className="my-4" />

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0">Refund Details</h6>
                  {detailLoading && (
                    <span className="text-muted small">Loading details...</span>
                  )}
                </div>

                {!detailLoading && !selectedRefundDetail ? (
                  <div className="text-center text-muted py-4 border rounded">
                    No refund details found
                  </div>
                ) : (
                  <div className="border rounded overflow-hidden">
                    <div className="detail-row d-flex justify-content-between align-items-center px-3 py-3 border-bottom">
                      <span className="text-muted">Refund Status</span>
                      <span
                        className={`badge ${getRefundBadgeClass(
                          selectedRefundDetail?.refundStatus ?? viewData.refundStatus,
                        )}`}
                      >
                        {normalizeRefundStatus(
                          selectedRefundDetail?.refundStatus ?? viewData.refundStatus,
                        ) || "-"}
                      </span>
                    </div>
                    <div className="detail-row d-flex justify-content-between align-items-center px-3 py-3 border-bottom">
                      <span className="text-muted">Refund Amount</span>
                      <span className="fw-semibold">
                        {formatCurrency(selectedRefundDetail?.refundAmount)}
                      </span>
                    </div>
                    <div className="detail-row d-flex justify-content-between align-items-center px-3 py-3 border-bottom">
                      <span className="text-muted">Refund Mode</span>
                      <span className="fw-semibold">
                        {selectedRefundDetail?.refundMode || "-"}
                      </span>
                    </div>
                    <div className="detail-row d-flex justify-content-between align-items-center px-3 py-3 border-bottom">
                      <span className="text-muted">Transaction / Reference No.</span>
                      <span className="fw-semibold">
                        {selectedRefundDetail?.transactionNumber || "-"}
                      </span>
                    </div>
                    <div className="detail-row d-flex justify-content-between align-items-center px-3 py-3 border-bottom">
                      <span className="text-muted">Refund Date</span>
                      <span className="fw-semibold">
                        {formatApiDate(
                          selectedRefundDetail?.refundDate ?? viewData.refundDate,
                        )}
                      </span>
                    </div>
                    <div className="detail-row d-flex justify-content-between align-items-center px-3 py-3">
                      <span className="text-muted">Processed By</span>
                      <span className="fw-semibold">
                        {selectedRefundDetail?.processedBy || "-"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowViewPopup(false);
                    setViewData(null);
                    setDetailRows([]);
                    setDetailLoading(false);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title">Billing Refund Details</h4>
        </div>

        <div className="card-body">
          <div className="mb-3">
            <div className="row g-3 align-items-end">
              <div className="col-md-2">
                <div className="form-group mb-0">
                  <label className="form-label fw-bold mb-1">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter patient name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-2">
                <div className="form-group mb-0">
                  <label className="form-label fw-bold mb-1">
                    Patient Mobile No.
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter mobile number"
                    value={mobileNo}
                    onChange={(e) => setMobileNo(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-2">
                <div className="form-group mb-0">
                  <label className="form-label fw-bold mb-1">
                    Billing Service
                  </label>
                  <select
                    className="form-select"
                    value={billingService}
                    onChange={(e) => setBillingService(e.target.value)}
                  >
                    {SERVICE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="col-md-2">
                <div className="form-group mb-0">
                  <label className="form-label fw-bold mb-1">From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-2">
                <div className="form-group mb-0">
                  <label className="form-label fw-bold mb-1">To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-4">
                <div className="form-group mb-0">
                  <label className="form-label fw-bold mb-1">
                    Refund Status
                  </label>
                  <div className="d-flex gap-3 flex-wrap">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="refundStatus"
                        id="statusPending"
                        value="Pending"
                        checked={refundStatus === "Pending"}
                        onChange={(e) => setRefundStatus(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="statusPending">
                        Pending
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="refundStatus"
                        id="statusCompleted"
                        value="Completed"
                        checked={refundStatus === "Completed"}
                        onChange={(e) => setRefundStatus(e.target.value)}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="statusCompleted"
                      >
                        Completed
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="refundStatus"
                        id="statusAll"
                        value="All"
                        checked={refundStatus === "All"}
                        onChange={(e) => setRefundStatus(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="statusAll">
                        All
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-md-12 d-flex justify-content-end gap-2">
                <button className="btn btn-primary" onClick={handleSearch}>
                  Search
                </button>
                  <button className="btn btn-secondary" onClick={handleReset}>
                    <i className="fas fa-redo-alt me-1"></i> Reset
                  </button>
                  <button className="btn btn-info" onClick={handleExport}>
                    <i className="me-1"></i> Export Refund Register
                </button>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Registration No.</th>
                  <th>Patient Name</th>
                  <th>Mobile No.</th>
                  <th>Age/Gender</th>
                  <th>Billing Type</th>
                  <th>Registration Date</th>
                  <th>Billing Amount</th>
                  <th>Cancelled Date</th>
                  <th>Refund Date</th>
                  <th>Refund Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.length > 0 ? (
                  visibleRows.map((item) => (
                    <tr key={item.visitId || item.billingHeaderId || item.registrationNo}>
                      <td>{item.registrationNo || "-"}</td>
                      <td>{item.patientName || "-"}</td>
                      <td>{item.mobileNo || "-"}</td>
                      <td>{formatAgeGender(item.age, item.gender)}</td>
                      <td>{item.billingType || "-"}</td>
                      <td>{formatApiDate(item.date)}</td>
                      <td>Rs. {item.billingAmount ?? "-"}</td>
                      <td>{formatApiDate(item.cancelledDate)}</td>
                      <td>{formatApiDate(item.refundDate)}</td>
                      <td>
                        <span
                          className={`badge ${getRefundBadgeClass(
                            item.refundStatus,
                          )}`}
                        >
                          {normalizeRefundStatus(item.refundStatus) ||
                            item.refundStatus ||
                            "-"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleView(item)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" className="text-center text-muted py-4">
                  No refund records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalElements > 0 && (
            <Pagination
              totalItems={totalElements}
              itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              totalPages={totalPages}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingRefundDetails;
