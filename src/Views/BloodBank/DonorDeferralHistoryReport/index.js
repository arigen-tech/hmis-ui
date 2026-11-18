import { useState } from "react";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import Popup from "../../../Components/popup";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";
import { getRequest, fetchPdfReportForViewAndPrint } from "../../../service/apiService";
import { BLOOD_DONOR_DEFERRAL_REPORT_URL, DONOR_DEFERRAL_API, STATUS_D, STATUS_P } from "../../../config/apiConfig";
import { formatDateForDisplay } from "../../../utils/dateUtils";

// Deferral Type: "t" = Temporary, "p" = Permanent (per your backend contract)
const DEFERRAL_TYPE_OPTIONS = [
  { label: "Temporary", value: "t" },
  { label: "Permanent", value: "p" },
];

const DonorDeferralHistoryReport = () => {
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);

  // NEW: separate flag for pagination-only refreshes (keeps table visible)
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    deferralType: "",
    fromDate: "",
    toDate: "",
  });

  // Data + pagination
  const [reportData, setReportData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    size: DEFAULT_ITEMS_PER_PAGE,
  });

  // PDF viewer state (separate loading states for VIEW and PRINT)
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [isPrintLoading, setIsPrintLoading] = useState(false);

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => setPopupMessage(null),
    });
  };

  // ---- Helpers ----
  const getTodayDate = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Grid query params — always page/size, only-selected filters
  const buildQueryParams = (page) => {
    const params = new URLSearchParams();
    params.append("page", String(page - 1));
    params.append("size", String(DEFAULT_ITEMS_PER_PAGE));
    if (filters.search) params.append("search", filters.search.trim());
    if (filters.deferralType) params.append("deferralType", filters.deferralType);
    if (filters.fromDate) params.append("fromDate", filters.fromDate);
    if (filters.toDate) params.append("toDate", filters.toDate);
    return params.toString();
  };

  // Report query params — same filters, no pagination
  const buildReportQueryParams = () => {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search.trim());
    if (filters.deferralType) params.append("deferralType", filters.deferralType);
    if (filters.fromDate) params.append("fromDate", filters.fromDate);
    if (filters.toDate) params.append("toDate", filters.toDate);
    return params.toString();
  };

  // Backend sends "t" / "p" — display friendly labels
  const getDeferralTypeLabel = (type) => {
    const t = String(type || "").toLowerCase();
    if (t === "t" || t === "temporary") return "Temporary";
    if (t === "p" || t === "permanent") return "Permanent";
    return type || "";
  };

  const getDeferralTypeBadgeClass = (type) => {
    const t = String(type || "").toLowerCase();
    if (t === "t" || t === "temporary") return "bg-warning text-dark";
    if (t === "p" || t === "permanent") return "bg-danger";
    return "bg-secondary";
  };

  // ---- Fetch grid data (Search + Pagination) ----
  // isPageChange = true → don't hide table, only show in-table spinner
  const fetchReportData = async (page = 1, isPageChange = false) => {
    if (isPageChange) {
      setIsRefreshing(true);
    } else {
      setIsGenerating(true);
      setShowReport(false);
    }

    try {
      const response = await getRequest(`${DONOR_DEFERRAL_API}?${buildQueryParams(page)}`);
      if (response && response.response) {
        const data = response.response;
        setReportData(data.content || []);
        setPagination({
          page: (data.number || 0) + 1,
          total: data.totalElements || 0,
          size: data.size || DEFAULT_ITEMS_PER_PAGE,
        });
        setShowReport(true);
      }
    } catch (err) {
      console.error("Error fetching report data:", err);
      showPopup("Failed to fetch report data", "error");
    } finally {
      if (isPageChange) {
        setIsRefreshing(false);
      } else {
        setIsGenerating(false);
      }
    }
  };

  // ---- PDF generation (VIEW / PRINT) — same flow as BloodBankStockReport ----
  const generatePdfReport = async (flag) => {
    if (flag === STATUS_D) {
      setIsViewLoading(true);
    } else if (flag === STATUS_P) {
      setIsPrintLoading(true);
    }
    setPdfUrl(null);

    try {
      const query = buildReportQueryParams();
      // The helper appends "&flag=<flag>" to this URL — ensure "?" is always present
      const reportUrl = query
        ? `${BLOOD_DONOR_DEFERRAL_REPORT_URL}?${query}`
        : `${BLOOD_DONOR_DEFERRAL_REPORT_URL}?`;

      const blob = await fetchPdfReportForViewAndPrint(reportUrl, flag);

      if (flag === STATUS_D) {
        const fileURL = window.URL.createObjectURL(blob);
        setPdfUrl(fileURL);
      }
      // For PRINT (STATUS_P) the backend streams directly to printer
    } catch (error) {
      console.error("Error generating PDF:", error);
      showPopup(
        flag === STATUS_D
          ? "Failed to generate report for view/download"
          : "Failed to print report",
        "error"
      );
    } finally {
      if (flag === STATUS_D) {
        setIsViewLoading(false);
      } else if (flag === STATUS_P) {
        setIsPrintLoading(false);
      }
    }
  };

  const handleViewReport = () => generatePdfReport(STATUS_D);
  const handlePrintReport = () => generatePdfReport(STATUS_P);

  // ---- Handlers ----
  const handleSearch = () => {
    fetchReportData(1);
  };

  const handleReset = () => {
    setShowReport(false);
    setIsRefreshing(false);
    setReportData([]);
    setPagination({ page: 1, total: 0, size: DEFAULT_ITEMS_PER_PAGE });
    setFilters({ search: "", deferralType: "", fromDate: "", toDate: "" });
    setPdfUrl(null);
  };

  // In-table spinner row (used by the report table)
  const renderLoadingRow = (colSpan) => (
    <tr>
      <td colSpan={colSpan} className="text-center py-4">
        <span
          className="spinner-border spinner-border-sm me-2"
          role="status"
          aria-hidden="true"
        ></span>
        <span className="fw-bold">Loading...</span>
      </td>
    </tr>
  );

  return (
    <div className="content-wrapper">
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}

      {/* PDF Viewer */}
      {pdfUrl && (
        <PdfViewer
          pdfUrl={pdfUrl}
          onClose={() => setPdfUrl(null)}
          name="Donor Deferral History Report"
        />
      )}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">DONOR DEFERRAL HISTORY REPORT</h4>
            </div>
            <div className="card-body">
              {/* Search Parameters Section */}
              <div className="row mb-4">
                {/* Donor ID / Name */}
                <div className="col-md-3">
                  <label className="form-label">Donor ID / Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Donor ID or Name"
                    value={filters.search}
                    onChange={(e) =>
                      setFilters({ ...filters, search: e.target.value })
                    }
                  />
                </div>

                {/* Deferral Type */}
                <div className="col-md-3">
                  <label className="form-label">Deferral Type</label>
                  <select
                    className="form-select"
                    value={filters.deferralType}
                    onChange={(e) =>
                      setFilters({ ...filters, deferralType: e.target.value })
                    }
                  >
                    <option value="">All Types</option>
                    {DEFERRAL_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* From Date */}
                <div className="col-md-3">
                  <label className="form-label">From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={filters.fromDate}
                    max={getTodayDate()}
                    onChange={(e) =>
                      setFilters({ ...filters, fromDate: e.target.value })
                    }
                  />
                </div>

                {/* To Date */}
                <div className="col-md-3">
                  <label className="form-label">To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={filters.toDate}
                    max={getTodayDate()}
                    onChange={(e) =>
                      setFilters({ ...filters, toDate: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Search / Reset buttons */}
              <div className="row mb-4">
                <div className="col-12 d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSearch}
                    disabled={isGenerating || isRefreshing}
                  >
                    {isGenerating ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
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
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* View / Print buttons row */}
              <div className="row mb-4">
                <div className="col-12 d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={handleViewReport}
                    disabled={isGenerating || isRefreshing || isViewLoading}
                  >
                    {isViewLoading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Generating...
                      </>
                    ) : (
                      <>
                        <i className="fa fa-eye me-2"></i> VIEW/DOWNLOAD
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-warning btn-sm"
                    onClick={handlePrintReport}
                    disabled={isGenerating || isRefreshing || isPrintLoading}
                  >
                    {isPrintLoading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Printing...
                      </>
                    ) : (
                      <>
                        <i className="fa fa-print me-2"></i> PRINT
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Report table */}
              {!isGenerating && showReport && (
                <>
                  <div className="table-responsive">
                    <table className="table table-bordered align-middle">
                      <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                        <tr>
                          <th>Donor ID</th>
                          <th>Donor Name</th>
                          <th>Deferral Type</th>
                          <th>Deferral Reason</th>
                          <th>Start Date</th>
                          <th>End Date</th>
                          <th>Screened By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isRefreshing ? (
                          renderLoadingRow(7)
                        ) : reportData.length > 0 ? (
                          reportData.map((item, idx) => (
                            <tr key={item.donorId || idx}>
                              <td className="fw-bold">{item.donorCode}</td>
                              <td>{item.donorName}</td>
                              <td>
                                <span
                                  className={`badge ${getDeferralTypeBadgeClass(
                                    item.deferralType
                                  )}`}
                                >
                                  {getDeferralTypeLabel(item.deferralType)}
                                </span>
                              </td>
                              <td>{item.deferralReason}</td>
                              <td>{formatDateForDisplay(item.startDate)}</td>
                              <td>{formatDateForDisplay(item.endDate)}</td>
                              <td>{item.screenedBy}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="text-center py-4">
                              No Record Found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {reportData.length > 0 && (
                    <Pagination
                      totalItems={pagination.total}
                      itemsPerPage={pagination.size}
                      currentPage={pagination.page}
                      onPageChange={(p) => fetchReportData(p, true)}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorDeferralHistoryReport;