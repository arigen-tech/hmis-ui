import { useEffect, useMemo, useState } from "react";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import Popup from "../../../Components/popup";
import { formatDateTimeWithSecondsForDisplay } from "../../../utils/dateUtils";

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

// API constants
const BILLING_REFUND_GATEWAY_DETAILS = "/billing/refundDetails";
const PAYMENT_MODE_LIST = "/master/paymentMode/getAll/1";

const SERVICE_OPTIONS = [
  { value: "All", label: "All" },
  { value: FILTER_OPD_DEPT, label: "OPD" },
  { value: FILTER_LAB_DEPT, label: "Laboratory" },
  { value: FILTER_RADIO_DEPT, label: "Radiology" },
];

const REFUND_STATUS_FILTER_OPTIONS = [
  { value: "All", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSED", label: "Processed" },
  { value: "REFUNDED", label: "Completed" },
];

const DEFAULT_FILTERS = {
  patientName: "",
  mobileNo: "",
  billingService: "All",
  refundStatus: "All",
  paymentMode: "All",
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
  const [paymentMode, setPaymentMode] = useState("All");

  const [paymentModeOptions, setPaymentModeOptions] = useState([]);

  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [refundRows, setRefundRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  const [viewData, setViewData] = useState(null);
  const [showViewPopup, setShowViewPopup] = useState(false);
  const [detailRows, setDetailRows] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);

  const [showProcessRefundPopup, setShowProcessRefundPopup] = useState(false);
  const [processRefundData, setProcessRefundData] = useState(null);

  const [gatewayDetailData, setGatewayDetailData] = useState(null);
  const [gatewayDetailLoading, setGatewayDetailLoading] = useState(false);
  const [isGatewayOnly, setIsGatewayOnly] = useState(false);

  const totalPages = Math.ceil(totalElements / DEFAULT_ITEMS_PER_PAGE);

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => setPopupMessage(null),
    });
  };

  const formatAgeGender = (age, gender) => {
    const ageText =
      age === null || age === undefined || String(age).trim() === ""
        ? "-"
        : String(age).trim();
    const genderText =
      gender === null || gender === undefined || String(gender).trim() === ""
        ? "-"
        : String(gender).trim();

    if (ageText === "-" && genderText === "-") return "-";
    if (ageText === "-") return genderText;
    if (genderText === "-") return ageText;
    return `${ageText} / ${genderText}`;
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    const amount = Number(value);
    if (Number.isNaN(amount)) return String(value);
    return `Rs. ${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const normalizeRefundStatus = (value) => {
    const status = String(value || "").trim().toLowerCase();
    if (!status) return "Pending";

    if (
      [
        "completed",
        "complete",
        "done",
        "paid",
        "y",
        "yes",
        "refunded",
        "refunded.",
        "refunded ",
      ].includes(status)
    ) {
      return "Completed";
    }

    if (
      [
        "refund pending",
        "refundpending",
        "refund_pending",
        "processed",
        "processing",
      ].includes(status)
    ) {
      return "Processed";
    }

    if (
      [
        "pending",
        "refund_pending_cash",
        "refundpendingcash",
        "refund pending cash",
      ].includes(status)
    ) {
      return "Pending";
    }

    return "Pending";
  };

  const getRefundBadgeClass = (status) => {
    const normalized = normalizeRefundStatus(status);
    if (normalized === "Completed") return "bg-success";
    if (normalized === "Processed") return "bg-warning";
    return "bg-danger";
  };

  // Fetch payment gateway options for the filter
  const fetchPaymentGatewayOptions = async () => {
    try {
      const data = await getRequest(PAYMENT_MODE_LIST);
      if (data?.status === 200 && Array.isArray(data.response)) {
        setPaymentModeOptions(data.response);
      } else {
        setPaymentModeOptions([]);
      }
    } catch (error) {
      console.error("Failed to fetch payment gateway list:", error);
      setPaymentModeOptions([]);
    }
  };

  const fetchRefundList = async (page = 0, filters = appliedFilters) => {
    const shouldShowPageLoading = refundRows.length === 0;

    try {
      setTableLoading(true);
      if (shouldShowPageLoading) {
        setLoading(true);
      }

      const params = new URLSearchParams({
        [REQUEST_PARAM_PAGE]: String(page),
        [REQUEST_PARAM_SIZE]: String(DEFAULT_ITEMS_PER_PAGE),
      });

      if (filters.patientName && filters.patientName.trim()) {
        params.append(REQUEST_PARAM_PATIENT_NAME, filters.patientName.trim());
      }

      if (filters.mobileNo && filters.mobileNo.trim()) {
        params.append("mobileNo", filters.mobileNo.trim());
      }

      if (filters.billingService && filters.billingService !== "All") {
        params.append("billingServiceType", filters.billingService);
      }

      if (filters.refundStatus && filters.refundStatus !== "All") {
        params.append("refundStatus", filters.refundStatus);
      }

      // Payment mode: send only when a specific gateway is selected.
      // When "All", omit the param entirely so the backend receives null.
      if (
        filters.paymentMode &&
        filters.paymentMode !== "All" &&
        filters.paymentMode !== null &&
        filters.paymentMode !== undefined
      ) {
        params.append("paymentModeId", String(filters.paymentMode));
      }

      if (filters.fromDate) {
        params.append(REQUEST_PARAM_FROM_DATE, filters.fromDate);
      }

      if (filters.toDate) {
        params.append(REQUEST_PARAM_TO_DATE, filters.toDate);
      }

      const data = await getRequest(
        `${BILLING_REFUND_PATIENT_LIST}?${params.toString()}`,
      );
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
      setTableLoading(false);
      if (shouldShowPageLoading) {
        setLoading(false);
      }
      setSearchLoading(false);
      setResetLoading(false);
    }
  };

  const fetchRefundDetails = async (billingHeaderId) => {
    if (!billingHeaderId) {
      setDetailRows([]);
      showPopup(
        "Unable to load refund details because the billing ID is missing.",
        "error",
      );
      return;
    }

    try {
      setDetailLoading(true);
      const data = await getRequest(
        `${PATIENT_BILLING_REFUND_DETAILS}/${billingHeaderId}`,
      );
      setDetailRows(Array.isArray(data?.response) ? data.response : []);
    } catch (error) {
      console.error("Failed to fetch billing refund details:", error);
      setDetailRows([]);
      showPopup("Unable to load refund details.", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchGatewayRefundDetails = async (refundId) => {
    if (!refundId) {
      showPopup("Refund ID is missing for this record.", "error");
      return;
    }

    try {
      setGatewayDetailLoading(true);
      const data = await getRequest(
        `${BILLING_REFUND_GATEWAY_DETAILS}/${refundId}`,
      );

      if (data.status !== 200) {
        throw new Error(
          data.message || "Failed to fetch gateway refund details",
        );
      }

      setGatewayDetailData(data.response || null);
    } catch (error) {
      console.error("Failed to fetch gateway refund details:", error);
      setGatewayDetailData(null);
      showPopup(
        error.message || "Unable to load gateway refund details.",
        "error",
      );
    } finally {
      setGatewayDetailLoading(false);
    }
  };

  // Initial load — payment gateways + refund list
  useEffect(() => {
    fetchPaymentGatewayOptions();
  }, []);

  useEffect(() => {
    fetchRefundList(currentPage - 1, appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, appliedFilters]);

  const visibleRows = useMemo(() => refundRows, [refundRows]);

  const handleSearch = () => {
    setSearchLoading(true);
    setCurrentPage(1);
    setAppliedFilters({
      patientName,
      mobileNo,
      billingService,
      refundStatus,
      paymentMode,
      fromDate,
      toDate,
    });
  };

  const handleBillingServiceChange = (value) => {
    setBillingService(value);
  };

  const handleRefundStatusChange = (value) => {
    setRefundStatus(value);
  };

  const handlePaymentModeChange = (value) => {
    setPaymentMode(value);
  };

  const handleReset = async () => {
    setResetLoading(true);
    setPatientName("");
    setMobileNo("");
    setBillingService("All");
    setRefundStatus("All");
    setPaymentMode("All");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
    const defaultFilters = {
      ...DEFAULT_FILTERS,
      patientName: "",
      mobileNo: "",
      billingService: "All",
      refundStatus: "All",
      paymentMode: "All",
      fromDate: "",
      toDate: "",
    };
    setAppliedFilters(defaultFilters);
    await fetchRefundList(0, defaultFilters);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleView = (item) => {
    setViewData(item);
    setShowViewPopup(true);
    setDetailRows([]);
    setDetailLoading(false);
    setGatewayDetailData(null);
    setGatewayDetailLoading(false);

    const normalizedStatus = normalizeRefundStatus(item.refundStatus);

    if (normalizedStatus === "Completed" || normalizedStatus === "Processed") {
      setIsGatewayOnly(true);
      if (item.refundId) {
        fetchGatewayRefundDetails(item.refundId);
      } else {
        showPopup("Refund ID is missing for this record.", "error");
      }
    } else {
      setIsGatewayOnly(false);
      fetchRefundDetails(item.billingHeaderId);
    }
  };

  const handleProcessRefund = (item) => {
    setProcessRefundData(item);
    setShowProcessRefundPopup(true);
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

      {/* ===================== View Popup ===================== */}
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
                <h5 className="modal-title">
                  {isGatewayOnly ? "Gateway Refund Details" : "Refund Details"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowViewPopup(false);
                    setViewData(null);
                    setDetailRows([]);
                    setDetailLoading(false);
                    setGatewayDetailData(null);
                    setGatewayDetailLoading(false);
                    setIsGatewayOnly(false);
                  }}
                />
              </div>
              <div className="modal-body">
                {!isGatewayOnly && (
                  <>
                    <hr className="my-4" />

                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0">Refund Details</h6>
                      {detailLoading && (
                        <span className="text-muted small">
                          Loading details...
                        </span>
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
                              selectedRefundDetail?.refundStatus ??
                                viewData.refundStatus,
                            )}`}
                          >
                            {normalizeRefundStatus(
                              selectedRefundDetail?.refundStatus ??
                                viewData.refundStatus,
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
                          <span className="text-muted">
                            Transaction / Reference No.
                          </span>
                          <span className="fw-semibold">
                            {selectedRefundDetail?.transactionNumber || "-"}
                          </span>
                        </div>
                        <div className="detail-row d-flex justify-content-between align-items-center px-3 py-3 border-bottom">
                          <span className="text-muted">Refund Date</span>
                          <span className="fw-semibold">
                            {formatDateTimeWithSecondsForDisplay(
                              selectedRefundDetail?.refundDate ??
                                viewData.refundDate,
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
                  </>
                )}

                {isGatewayOnly && (
                  <>
                    <h6 className="fw-bold mb-3">Gateway Refund Details</h6>

                    {gatewayDetailLoading && (
                      <div className="text-center py-3">
                        <div
                          className="spinner-border text-primary"
                          role="status"
                        />
                      </div>
                    )}

                    {!gatewayDetailLoading && gatewayDetailData && (
  <div className="border rounded overflow-hidden">
    <div className="detail-row d-flex justify-content-between align-items-center px-3 py-3 border-bottom">
      <span className="text-muted">Gateway Refund ID</span>
      <span className="fw-semibold">
        {gatewayDetailData.gatewayRefundId || "-"}
      </span>
    </div>
    {/* ❌ Removed: Refund Number row */}
    <div className="detail-row d-flex justify-content-between align-items-center px-3 py-3 border-bottom">
      <span className="text-muted">Refund Amount</span>
      <span className="fw-semibold">
        {formatCurrency(gatewayDetailData.refundAmount)}
      </span>
    </div>
    <div className="detail-row d-flex justify-content-between align-items-center px-3 py-3 border-bottom">
      <span className="text-muted">Refund Reason</span>
      <span className="fw-semibold">
        {gatewayDetailData.refundReason || "-"}
      </span>
    </div>
    <div className="detail-row d-flex justify-content-between align-items-center px-3 py-3 border-bottom">
      <span className="text-muted">Payment Amount</span>
      <span className="fw-semibold">
        {formatCurrency(gatewayDetailData.paymentAmount)}
      </span>
    </div>
    <div className="detail-row d-flex justify-content-between align-items-center px-3 py-3 border-bottom">
      <span className="text-muted">Initiated On</span>
      <span className="fw-semibold">
        {formatDateTimeWithSecondsForDisplay(
          gatewayDetailData.initiatedOn,
        )}
      </span>
    </div>
    <div className="detail-row d-flex justify-content-between align-items-center px-3 py-3 border-bottom">
      <span className="text-muted">Gateway Payment ID</span>
      <span className="fw-semibold">
        {gatewayDetailData.gatewayPaymentId || "-"}
      </span>
    </div>
    <div className="detail-row d-flex justify-content-between align-items-center px-3 py-3 border-bottom">
      <span className="text-muted">Payment Mode</span>
      <span className="fw-semibold">
        {gatewayDetailData.paymentMode || "-"}
      </span>
    </div>
    <div
      className={`detail-row d-flex justify-content-between align-items-center px-3 py-3 ${
        gatewayDetailData.gatewayReferenceType &&
        gatewayDetailData.gatewayReferenceNo
          ? "border-bottom"
          : ""
      }`}
    >
      <span className="text-muted">Payment Via</span>
      <span className="fw-semibold">
        {gatewayDetailData.paymentVia || "-"}
      </span>
    </div>

    {/* ✅ New: Only render when both values are present */}
    {gatewayDetailData.gatewayReferenceType &&
      gatewayDetailData.gatewayReferenceNo && (
        <div className="detail-row d-flex justify-content-between align-items-center px-3 py-3">
          <span className="text-muted">
            {gatewayDetailData.gatewayReferenceType}
          </span>
          <span className="fw-semibold">
            {gatewayDetailData.gatewayReferenceNo}
          </span>
        </div>
      )}
  </div>
)}

                    {!gatewayDetailLoading && !gatewayDetailData && (
                      <div className="text-center text-muted py-3">
                        No gateway details available.
                      </div>
                    )}
                  </>
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
                    setGatewayDetailData(null);
                    setGatewayDetailLoading(false);
                    setIsGatewayOnly(false);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== Process Refund Placeholder Popup ===================== */}
      {showProcessRefundPopup && processRefundData && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-warning">
                <h5 className="modal-title">Process Refund</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowProcessRefundPopup(false);
                    setProcessRefundData(null);
                  }}
                />
              </div>
              <div className="modal-body">
                <p className="mb-2">
                  <strong>Patient:</strong> {processRefundData.patientName}
                </p>
                <p className="mb-2">
                  <strong>Billing Amount:</strong>{" "}
                  {formatCurrency(processRefundData.billingAmount)}
                </p>
                <p className="mb-2">
                  <strong>Payment Mode:</strong>{" "}
                  {processRefundData.paymentModeName || "-"}
                </p>
                <p className="text-muted mb-0">
                  Process Refund flow will be implemented here.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowProcessRefundPopup(false);
                    setProcessRefundData(null);
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
                    onChange={(e) => handleBillingServiceChange(e.target.value)}
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
                  <label className="form-label fw-bold mb-1">
                    Payment Mode
                  </label>
                  <select
                    className="form-select"
                    value={paymentMode}
                    onChange={(e) => handlePaymentModeChange(e.target.value)}
                  >
                    <option value="All">All</option>
                    {paymentModeOptions.map((pm) => (
                      <option
                        key={pm.paymentModeId || pm.modeCode}
                        value={pm.paymentModeId}
                      >
                        {pm.modeName || pm.modeCode}
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

              <div className="col-md-2">
                <div className="form-group mb-0">
                  <label className="form-label fw-bold mb-1">
                    Refund Status
                  </label>
                  <select
                    className="form-select"
                    value={refundStatus}
                    onChange={(e) =>
                      handleRefundStatusChange(e.target.value)
                    }
                  >
                    {REFUND_STATUS_FILTER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-md-12 d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSearch}
                  disabled={searchLoading}
                >
                  {searchLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      />
                      Searching...
                    </>
                  ) : (
                    "Search"
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleReset}
                  disabled={resetLoading}
                >
                  {resetLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-redo-alt me-1"></i> Reset
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-info"
                  onClick={handleExport}
                >
                  <i className="me-1"></i> Export Refund Register
                </button>
              </div>
            </div>
          </div>

          <div className="table-responsive packagelist position-relative">
            {tableLoading && refundRows.length > 0 && (
              <div
                className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                style={{
                  backgroundColor: "rgba(255,255,255,0.7)",
                  zIndex: 2,
                }}
              >
                <div className="text-center">
                  <div className="spinner-border text-primary" role="status" />
                  <div className="mt-2 text-muted">Loading table...</div>
                </div>
              </div>
            )}
            <table className="table table-bordered table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Patient Name</th>
                  <th>Mobile No.</th>
                  <th>Age/Gender</th>
                  <th>Billing Type</th>
                  <th>Payment Mode</th>
                  <th>Billing Amount</th>
                  <th>Billing Date</th>
                  <th>Cancelled Date</th>
                  <th>Refund Process Date</th>
                  <th>Refund Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.length > 0 ? (
                  visibleRows.map((item) => {
                    const normalizedStatus = normalizeRefundStatus(
                      item.refundStatus,
                    );
                    const isPending = normalizedStatus === "Pending";

                    return (
                      <tr
                        key={
                          item.visitId ||
                          item.billingHeaderId ||
                          item.registrationNo
                        }
                      >
                        <td>{item.patientName || "-"}</td>
                        <td>{item.mobileNo || "-"}</td>
                        <td>{formatAgeGender(item.age, item.gender)}</td>
                        <td>{item.billingType || "-"}</td>
                        <td>{item.paymentModeName || "-"}</td>
                        <td>Rs. {item.billingAmount ?? "-"}</td>
                        <td>
                          {formatDateTimeWithSecondsForDisplay(
                            item.billDate || item.date,
                          )}
                        </td>
                        <td>
                          {formatDateTimeWithSecondsForDisplay(
                            item.cancelledDate,
                          )}
                        </td>
                        <td>
                          {formatDateTimeWithSecondsForDisplay(item.refundDate)}
                        </td>
                        <td>
                          <span
                            className={`badge ${getRefundBadgeClass(
                              item.refundStatus,
                            )}`}
                          >
                            {normalizedStatus}
                          </span>
                        </td>
                        <td>
                          {isPending ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-warning"
                              onClick={() => handleProcessRefund(item)}
                            >
                              Process Refund
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleView(item)}
                            >
                              View
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
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