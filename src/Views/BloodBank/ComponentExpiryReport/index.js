import { useState, useEffect } from "react";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import Popup from "../../../Components/popup";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";
import { getRequest, fetchPdfReportForViewAndPrint } from "../../../service/apiService";
import { BLOOD_COMPONENTS_API, BLOOD_GROUPS_API, COMPONENT_EXPIRY_API, INVENTORY_STATUS_API, STATUS_D, STATUS_P, BLOOD_COMPONENT_EXPIRY_REPORT_URL } from "../../../config/apiConfig";

// Days presets — auto-computes expiryFromDate / expiryToDate from today
const DATE_PRESETS = [
  { label: "Custom", value: "" },
  { label: "7 Days", value: "7" },
  { label: "30 Days", value: "30" },
  { label: "90 Days", value: "90" },
  { label: "120 Days", value: "120" },
];

const DEFAULT_INVENTORY_STATUS_ID = "1";

const ComponentExpiryReport = () => {
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);

  // NEW: separate flag for pagination-only refreshes (keeps table visible)
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    datePreset: "", // "" = custom, or "7" | "30" | "90" | "120"
    expiryFromDate: "",
    expiryToDate: "",
    componentId: "",
    bloodGroupId: "",
    inventoryStatus: DEFAULT_INVENTORY_STATUS_ID, // default AVAILABLE (id=1)
  });

  // Dropdowns
  const [components, setComponents] = useState([]);
  const [bloodGroups, setBloodGroups] = useState([]);
  const [inventoryStatuses, setInventoryStatuses] = useState([]);

  // Data + pagination
  const [reportData, setReportData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    size: DEFAULT_ITEMS_PER_PAGE,
  });

  // PDF viewer state
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

  // ---- Load dropdowns on mount ----
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [compRes, bgRes, statusRes] = await Promise.all([
          getRequest(BLOOD_COMPONENTS_API),
          getRequest(BLOOD_GROUPS_API),
          getRequest(INVENTORY_STATUS_API),
        ]);
        if (compRes && compRes.response) setComponents(compRes.response);
        if (bgRes && bgRes.response) setBloodGroups(bgRes.response);
        if (statusRes && statusRes.response) setInventoryStatuses(statusRes.response);
      } catch (err) {
        console.error("Error loading dropdown data:", err);
        showPopup("Failed to load dropdown data", "error");
      }
    };
    loadDropdowns();
  }, []);

  // ---- Helpers ----
  const formatApiDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const getTodayDate = () => formatApiDate(new Date());

  // Days preset change → auto-fill from/to dates
  const handleDatePresetChange = (value) => {
    if (!value) {
      // Custom — let user pick manually, keep existing dates
      setFilters((prev) => ({ ...prev, datePreset: "" }));
      return;
    }
    const today = new Date();
    const toDate = new Date(today);
    toDate.setDate(toDate.getDate() + parseInt(value, 10));
    setFilters((prev) => ({
      ...prev,
      datePreset: value,
      expiryFromDate: formatApiDate(today),
      expiryToDate: formatApiDate(toDate),
    }));
  };

  // Grid query params — pagination + only-selected filters
  const buildQueryParams = (page) => {
    const params = new URLSearchParams();
    params.append("page", String(page - 1));
    params.append("size", String(DEFAULT_ITEMS_PER_PAGE));
    if (filters.expiryFromDate) params.append("expiryFromDate", filters.expiryFromDate);
    if (filters.expiryToDate) params.append("expiryToDate", filters.expiryToDate);
    if (filters.componentId) params.append("componentId", filters.componentId);
    if (filters.bloodGroupId) params.append("bloodGroupId", filters.bloodGroupId);
    // inventoryStatus defaults to 1 on the backend — only send when explicit (skip on "All")
    if (filters.inventoryStatus) params.append("inventoryStatus", filters.inventoryStatus);
    return params.toString();
  };

  // Report query params — same filters, no pagination
  const buildReportQueryParams = () => {
    const params = new URLSearchParams();
    if (filters.expiryFromDate) params.append("expiryFromDate", filters.expiryFromDate);
    if (filters.expiryToDate) params.append("expiryToDate", filters.expiryToDate);
    if (filters.componentId) params.append("componentId", filters.componentId);
    if (filters.bloodGroupId) params.append("bloodGroupId", filters.bloodGroupId);
    if (filters.inventoryStatus) params.append("inventoryStatus", filters.inventoryStatus);
    return params.toString();
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    const datePart = String(dateStr).split("T")[0];
    const parts = datePart.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return datePart;
  };

  const calculateDaysLeft = (expiryDateStr) => {
    if (!expiryDateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  };

  const getDaysLeftBadgeClass = (daysLeft) => {
    if (daysLeft == null) return "bg-secondary";
    if (daysLeft <= 3) return "bg-danger";
    if (daysLeft <= 7) return "bg-warning";
    if (daysLeft <= 15) return "bg-info";
    return "bg-success";
  };

  const formatDaysLeftLabel = (daysLeft) => {
    if (daysLeft == null) return "";
    if (daysLeft < 0) return "Expired";
    if (daysLeft === 0) return "Today";
    return `${daysLeft} day${daysLeft === 1 ? "" : "s"}`;
  };

  const getStatusBadgeClass = (status) => {
    const s = String(status || "").trim().toUpperCase();
    switch (s) {
      case "AVAILABLE": return "bg-success";
      case "RESERVED": return "bg-warning";
      case "ALLOCATED": return "bg-info";
      case "EXPIRED": return "bg-danger";
      case "DISCARDED": return "bg-dark";
      case "ISSUED": return "bg-primary";
      case "RECEIVED_AT_WARD": return "bg-secondary";
      default: return "bg-secondary";
    }
  };

  const formatStatusLabel = (status) => {
    const s = String(status || "").trim();
    if (!s) return "";
    return s
      .toLowerCase()
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
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
      const response = await getRequest(`${COMPONENT_EXPIRY_API}?${buildQueryParams(page)}`);
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
      // Helper appends "&flag=<flag>" to this URL — ensure "?" is always present
      const reportUrl = query
        ? `${BLOOD_COMPONENT_EXPIRY_REPORT_URL}?${query}`
        : `${BLOOD_COMPONENT_EXPIRY_REPORT_URL}?`;

      const blob = await fetchPdfReportForViewAndPrint(reportUrl, flag);

      if (flag === STATUS_D) {
        const fileURL = window.URL.createObjectURL(blob);
        setPdfUrl(fileURL);
      }
      // PRINT (STATUS_P) streams directly to printer — nothing to do here
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
    setFilters({
      datePreset: "",
      expiryFromDate: "",
      expiryToDate: "",
      componentId: "",
      bloodGroupId: "",
      inventoryStatus: DEFAULT_INVENTORY_STATUS_ID,
    });
    setPdfUrl(null);
  };

  // When dates are edited manually, drop back to "Custom"
  const handleFromDateChange = (e) => {
    setFilters({ ...filters, datePreset: "", expiryFromDate: e.target.value });
  };
  const handleToDateChange = (e) => {
    setFilters({ ...filters, datePreset: "", expiryToDate: e.target.value });
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
          name="Component Expiry Report"
        />
      )}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">COMPONENT EXPIRY REPORT</h4>
            </div>
            <div className="card-body">
              {/* Search Parameters Section */}
              <div className="row mb-4">
                {/* Select Days */}
                <div className="col-md-2">
                  <label className="form-label">Select Days</label>
                  <select
                    className="form-select"
                    value={filters.datePreset}
                    onChange={(e) => handleDatePresetChange(e.target.value)}
                  >
                    {DATE_PRESETS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expiry From Date */}
                <div className="col-md-2">
                  <label className="form-label">Expiry From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={filters.expiryFromDate}
                    max={getTodayDate()}
                    onChange={handleFromDateChange}
                  />
                </div>

                {/* Expiry To Date */}
                <div className="col-md-2">
                  <label className="form-label">Expiry To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={filters.expiryToDate}
                    onChange={handleToDateChange}
                  />
                </div>

                {/* Component */}
                <div className="col-md-2">
                  <label className="form-label">Component</label>
                  <select
                    className="form-select"
                    value={filters.componentId}
                    onChange={(e) =>
                      setFilters({ ...filters, componentId: e.target.value })
                    }
                  >
                    <option value="">All Components</option>
                    {components.map((c) => (
                      <option key={c.componentId} value={c.componentId}>
                        {c.componentName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Blood Group */}
                <div className="col-md-2">
                  <label className="form-label">Blood Group</label>
                  <select
                    className="form-select"
                    value={filters.bloodGroupId}
                    onChange={(e) =>
                      setFilters({ ...filters, bloodGroupId: e.target.value })
                    }
                  >
                    <option value="">All Blood Groups</option>
                    {bloodGroups.map((g) => (
                      <option key={g.bloodGroupId} value={g.bloodGroupId}>
                        {g.bloodGroupName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Inventory Status — default AVAILABLE */}
                <div className="col-md-2">
                  <label className="form-label">Inventory Status</label>
                  <select
                    className="form-select"
                    value={filters.inventoryStatus}
                    onChange={(e) =>
                      setFilters({ ...filters, inventoryStatus: e.target.value })
                    }
                  >
                    <option value="">All Status</option>
                    {inventoryStatuses.map((s) => (
                      <option
                        key={s.inventoryStatusId}
                        value={s.inventoryStatusId}
                      >
                        {formatStatusLabel(s.statusCode)}
                      </option>
                    ))}
                  </select>
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
                      <thead
                        style={{ backgroundColor: "#9db4c0", color: "black" }}
                      >
                        <tr>
                          <th>Unit No</th>
                          <th>Component</th>
                          <th>Blood Group</th>
                          <th>Expiry Date</th>
                          <th className="text-center">Days Left</th>
                          <th>Inventory Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isRefreshing ? (
                          renderLoadingRow(6)
                        ) : reportData.length > 0 ? (
                          reportData.map((item, idx) => {
                            const daysLeft = calculateDaysLeft(item.expiryDate);
                            return (
                              <tr key={item.inventoryId || idx}>
                                <td className="fw-bold">{item.unitNo}</td>
                                <td>
                                  {item.componentName || item.componentCode}
                                </td>
                                <td>{item.bloodGroup}</td>
                                <td>{formatDisplayDate(item.expiryDate)}</td>
                                <td className="text-center">
                                  <span
                                    className={`badge ${getDaysLeftBadgeClass(
                                      daysLeft
                                    )}`}
                                  >
                                    {formatDaysLeftLabel(daysLeft)}
                                  </span>
                                </td>
                                <td>
                                  <span
                                    className={`badge ${getStatusBadgeClass(
                                      item.inventoryStatus
                                    )}`}
                                  >
                                    {formatStatusLabel(item.inventoryStatus)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center py-4">
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

export default ComponentExpiryReport;