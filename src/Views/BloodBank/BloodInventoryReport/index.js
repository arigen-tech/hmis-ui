import { useState, useEffect } from "react";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";
import { getRequest, fetchPdfReportForViewAndPrint } from "../../../service/apiService";
import { BLOOD_INVENTORY_STOCK_DETAIL_REPORT_URL, BLOOD_INVENTORY_STOCK_SUMMARY_REPORT_URL, STATUS_D, STATUS_P } from "../../../config/apiConfig";

// API paths
const BLOOD_GROUPS_API = "/master/blood-group/getAll/1";
const BLOOD_COMPONENTS_API = "/master/masBloodComponent/getAll/1";
const STOCK_SUMMARY_API = "/bloodBank/stock-summary";
const STOCK_DETAIL_API = "/bloodBank/stock-detail";

const EXPIRY_OPTIONS = [
  { label: "Expiring Today", value: "0" },
  { label: "Within 3 Days", value: "3" },
  { label: "Within 7 Days", value: "7" },
  { label: "Within 15 Days", value: "15" },
  { label: "Within 30 Days", value: "30" },
];

const BloodBankStockReport = () => {
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);

  // NEW: separate flag for pagination-only refreshes (keeps table visible)
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter / mode state
  const [viewMode, setViewMode] = useState(""); // "summary" | "detail"
  const [filters, setFilters] = useState({
    bloodGroupId: "",
    componentId: "",
    expiryWithin: "",
  });

  // Dropdowns
  const [bloodGroups, setBloodGroups] = useState([]);
  const [components, setComponents] = useState([]);

  // Data + pagination (summary)
  const [summaryData, setSummaryData] = useState([]);
  const [summaryPagination, setSummaryPagination] = useState({
    page: 1,
    total: 0,
    size: DEFAULT_ITEMS_PER_PAGE,
  });

  // Data + pagination (detail)
  const [detailData, setDetailData] = useState([]);
  const [detailPagination, setDetailPagination] = useState({
    page: 1,
    total: 0,
    size: DEFAULT_ITEMS_PER_PAGE,
  });

  // PDF viewer state (separate loading states for VIEW and PRINT — same as TATReport)
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

  // Load dropdowns on mount
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [bgRes, compRes] = await Promise.all([
          getRequest(BLOOD_GROUPS_API),
          getRequest(BLOOD_COMPONENTS_API),
        ]);
        if (bgRes && bgRes.response) setBloodGroups(bgRes.response);
        if (compRes && compRes.response) setComponents(compRes.response);
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

  const getExpiryParams = (expiryWithin) => {
    if (!expiryWithin && expiryWithin !== "0") return {};
    const today = new Date();
    const toDate = new Date(today);
    if (expiryWithin !== "0") {
      toDate.setDate(toDate.getDate() + parseInt(expiryWithin, 10));
    }
    return {
      fromDate: formatApiDate(today),
      toDate: formatApiDate(toDate),
    };
  };

  const buildQueryParams = (page) => {
    const params = new URLSearchParams();
    params.append("page", String(page - 1));
    params.append("size", String(DEFAULT_ITEMS_PER_PAGE));
    if (filters.bloodGroupId) params.append("bloodGroupId", filters.bloodGroupId);
    if (filters.componentId) params.append("componentId", filters.componentId);
    const { fromDate, toDate } = getExpiryParams(filters.expiryWithin);
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);
    return params.toString();
  };

  // Query params used by the PDF endpoints (no page/size — those aren't supported there)
  const buildReportQueryParams = () => {
    const params = new URLSearchParams();
    if (filters.bloodGroupId) params.append("bloodGroupId", filters.bloodGroupId);
    if (filters.componentId) params.append("componentId", filters.componentId);
    const { fromDate, toDate } = getExpiryParams(filters.expiryWithin);
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);
    return params.toString();
  };

  const getComponentName = (code) => {
    const c = components.find((c) => c.componentCode === code);
    return c ? c.componentName : code;
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    const parts = String(dateStr).split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const getStatusBadgeClass = (status) => {
    const s = String(status || "").toUpperCase();
    switch (s) {
      case "AVAILABLE": return "bg-success";
      case "RESERVED": return "bg-warning";
      case "ALLOCATED": return "bg-info";
      case "EXPIRED": return "bg-danger";
      default: return "bg-secondary";
    }
  };

  const formatStatusLabel = (status) => {
    if (!status) return "";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  // ---- Fetch grid data (Search + Pagination) ----
  // isPageChange = true → don't hide table, only show in-table spinner
  const fetchReportData = async (mode, page = 1, isPageChange = false) => {
    if (isPageChange) {
      setIsRefreshing(true);
    } else {
      setIsGenerating(true);
      setShowReport(false);
    }

    try {
      const url = mode === "summary" ? STOCK_SUMMARY_API : STOCK_DETAIL_API;
      const response = await getRequest(`${url}?${buildQueryParams(page)}`);
      if (response && response.response) {
        const data = response.response;
        if (mode === "summary") {
          setSummaryData(data.content || []);
          setSummaryPagination({
            page: (data.number || 0) + 1,
            total: data.totalElements || 0,
            size: data.size || DEFAULT_ITEMS_PER_PAGE,
          });
        } else {
          setDetailData(data.content || []);
          setDetailPagination({
            page: (data.number || 0) + 1,
            total: data.totalElements || 0,
            size: data.size || DEFAULT_ITEMS_PER_PAGE,
          });
        }
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

  // ---- PDF generation (VIEW / PRINT) — same flow as TATReport ----
  const generatePdfReport = async (flag) => {
    if (!viewMode) {
      showPopup("Please select Summary or Detail view", "error");
      return;
    }

    if (flag === STATUS_D) {
      setIsViewLoading(true);
    } else if (flag === STATUS_P) {
      setIsPrintLoading(true);
    }
    setPdfUrl(null);

    try {
      const baseUrl =
        viewMode === "summary" ? BLOOD_INVENTORY_STOCK_SUMMARY_REPORT_URL : BLOOD_INVENTORY_STOCK_DETAIL_REPORT_URL;
      const query = buildReportQueryParams();

      const reportUrl = query ? `${baseUrl}?${query}` : `${baseUrl}?`;
      const blob = await fetchPdfReportForViewAndPrint(reportUrl, flag);

      if (flag === STATUS_D) {
        const fileURL = window.URL.createObjectURL(blob);
        setPdfUrl(fileURL);
      }
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
    if (!viewMode) {
      showPopup("Please select Summary or Detail view", "error");
      return;
    }
    fetchReportData(viewMode, 1);
  };

  const handleClear = () => {
    setShowReport(false);
    setIsRefreshing(false);
    setSummaryData([]);
    setDetailData([]);
    setSummaryPagination({ page: 1, total: 0, size: DEFAULT_ITEMS_PER_PAGE });
    setDetailPagination({ page: 1, total: 0, size: DEFAULT_ITEMS_PER_PAGE });
    setViewMode("");
    setFilters({ bloodGroupId: "", componentId: "", expiryWithin: "" });
    setPdfUrl(null);
  };

  const handleViewModeChange = (mode) => {
    if (mode === viewMode) return;
    setViewMode(mode);
    setShowReport(false);
    setSummaryData([]);
    setDetailData([]);
  };

  // In-table spinner row (used by both summary & detail tables)
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
          name={`${viewMode === "summary" ? "Summary" : "Detail"} Blood Inventory Stock Report`}
        />
      )}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">BLOOD BANK INVENTORY</h4>
            </div>
            <div className="card-body">
              {/* Search Parameters Section */}
              <div className="row mb-4">
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
                    <option value="">Select blood group</option>
                    {bloodGroups.map((g) => (
                      <option key={g.bloodGroupId} value={g.bloodGroupId}>
                        {g.bloodGroupName}
                      </option>
                    ))}
                  </select>
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

                {/* Expiry Within */}
                <div className="col-md-2">
                  <label className="form-label">Expiry Within</label>
                  <select
                    className="form-select"
                    value={filters.expiryWithin}
                    onChange={(e) =>
                      setFilters({ ...filters, expiryWithin: e.target.value })
                    }
                  >
                    <option value="">Any Time</option>
                    {EXPIRY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* View mode radios */}
                <div className="col-md-3">
                  <label className="form-label d-block">View</label>
                  <div
                    className="d-flex align-items-center"
                    style={{ height: "38px", gap: "24px" }}
                  >
                    <div className="form-check m-0">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="viewMode"
                        id="viewSummary"
                        value="summary"
                        checked={viewMode === "summary"}
                        onChange={(e) => handleViewModeChange(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="viewSummary">
                        Summary
                      </label>
                    </div>
                    <div className="form-check m-0">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="viewMode"
                        id="viewDetail"
                        value="detail"
                        checked={viewMode === "detail"}
                        onChange={(e) => handleViewModeChange(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="viewDetail">
                        Detail
                      </label>
                    </div>
                  </div>
                </div>

                {/* Search / Reset buttons */}
                <div className="col-md-3 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-primary me-2"
                    onClick={handleSearch}
                    disabled={isGenerating || isRefreshing || !viewMode}
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
                    onClick={handleClear}
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
                    disabled={isGenerating || isRefreshing || isViewLoading || !viewMode}
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
                    disabled={isGenerating || isRefreshing || isPrintLoading || !viewMode}
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

              {/* Summary table */}
              {!isGenerating && showReport && viewMode === "summary" && (
                <>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle">
                      <thead>
                        <tr>
                          <th>Blood Group</th>
                          <th>Component</th>
                          <th className="text-center">Available Units</th>
                          <th className="text-center">Reserved Units</th>
                          <th className="text-center">Allocated Units</th>
                          <th className="text-center">Expired Units</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isRefreshing ? (
                          renderLoadingRow(6)
                        ) : summaryData.length > 0 ? (
                          summaryData.map((item, idx) => (
                            <tr key={idx}>
                              <td className="fw-bold">{item.bloodGroupName}</td>
                              <td>{getComponentName(item.componentCode)}</td>
                              <td className="text-center">
                                <span className="fw-bold">{item.available}</span>
                              </td>
                              <td className="text-center">
                                <span className="fw-bold">{item.reserved}</span>
                              </td>
                              <td className="text-center">
                                <span className="fw-bold">{item.allocated}</span>
                              </td>
                              <td className="text-center">
                                <span className="fw-bold">{item.expired}</span>
                              </td>
                            </tr>
                          ))
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

                  {summaryData.length > 0 && (
                    <Pagination
                      totalItems={summaryPagination.total}
                      itemsPerPage={summaryPagination.size}
                      currentPage={summaryPagination.page}
                      onPageChange={(p) => fetchReportData("summary", p, true)}
                    />
                  )}
                </>
              )}

              {/* Detail table */}
              {!isGenerating && showReport && viewMode === "detail" && (
                <>
                  <div className="table-responsive">
                    <table className="table table-bordered align-middle">
                      <thead
                        style={{ backgroundColor: "#9db4c0", color: "black" }}
                      >
                        <tr>
                          <th>Unit No</th>
                          <th>Bag No</th>
                          <th>Component</th>
                          <th>Blood Group</th>
                          <th>Expiry Date</th>
                          <th>Inventory Status</th>
                          <th>Volume (ml)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isRefreshing ? (
                          renderLoadingRow(7)
                        ) : detailData.length > 0 ? (
                          detailData.map((unit, idx) => (
                            <tr key={idx}>
                              <td className="fw-bold">{unit.unitNo}</td>
                              <td>{unit.bagNumber}</td>
                              <td>{getComponentName(unit.componentCode)}</td>
                              <td>{unit.bloodGroupCode}</td>
                              <td>{formatDisplayDate(unit.expiryDate)}</td>
                              <td>
                                <span
                                  className={`badge ${getStatusBadgeClass(
                                    unit.statusCode
                                  )}`}
                                >
                                  {formatStatusLabel(unit.statusCode)}
                                </span>
                              </td>
                              <td>{unit.volumeMl}</td>
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

                  {detailData.length > 0 && (
                    <Pagination
                      totalItems={detailPagination.total}
                      itemsPerPage={detailPagination.size}
                      currentPage={detailPagination.page}
                      onPageChange={(p) => fetchReportData("detail", p, true)}
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

export default BloodBankStockReport;