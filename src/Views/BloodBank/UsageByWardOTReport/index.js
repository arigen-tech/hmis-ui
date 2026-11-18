import { useState, useEffect } from "react";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import Popup from "../../../Components/popup";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";
import { getRequest, fetchPdfReportForViewAndPrint } from "../../../service/apiService";
import { BLOOD_COMPONENTS_API, BLOOD_GROUPS_API, BLOOD_USAGE_BY_WARD_OT_REPORT_URL, OT_USAGE_API, STATUS_D, STATUS_P, WARDS_API } from "../../../config/apiConfig";

// ---- API paths ----

const UsageByWardOTReport = () => {
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);

  // NEW: separate flag for pagination-only refreshes (keeps table visible)
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    issueFromDate: "",
    issueToDate: "",
    wardId: "",
    componentId: "",
    bloodGroupId: "",
  });

  // Dropdowns
  const [wards, setWards] = useState([]);
  const [components, setComponents] = useState([]);
  const [bloodGroups, setBloodGroups] = useState([]);

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
        const [wardRes, compRes, bgRes] = await Promise.all([
          getRequest(WARDS_API),
          getRequest(BLOOD_COMPONENTS_API),
          getRequest(BLOOD_GROUPS_API),
        ]);
        if (wardRes && wardRes.response) setWards(wardRes.response);
        if (compRes && compRes.response) setComponents(compRes.response);
        if (bgRes && bgRes.response) setBloodGroups(bgRes.response);
      } catch (err) {
        console.error("Error loading dropdown data:", err);
        showPopup("Failed to load dropdown data", "error");
      }
    };
    loadDropdowns();
  }, []);

  // ---- Helpers ----
  const getTodayDate = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Grid query params — includes pagination + any selected filters
  const buildQueryParams = (page) => {
    const params = new URLSearchParams();
    params.append("page", String(page - 1));
    params.append("size", String(DEFAULT_ITEMS_PER_PAGE));
    if (filters.issueFromDate) params.append("issueFromDate", filters.issueFromDate);
    if (filters.issueToDate) params.append("issueToDate", filters.issueToDate);
    if (filters.wardId) params.append("wardId", filters.wardId);
    if (filters.componentId) params.append("componentId", filters.componentId);
    if (filters.bloodGroupId) params.append("bloodGroupId", filters.bloodGroupId);
    return params.toString();
  };

  // Report query params — same filters, no pagination
  const buildReportQueryParams = () => {
    const params = new URLSearchParams();
    if (filters.issueFromDate) params.append("issueFromDate", filters.issueFromDate);
    if (filters.issueToDate) params.append("issueToDate", filters.issueToDate);
    if (filters.wardId) params.append("wardId", filters.wardId);
    if (filters.componentId) params.append("componentId", filters.componentId);
    if (filters.bloodGroupId) params.append("bloodGroupId", filters.bloodGroupId);
    return params.toString();
  };

  // Handles "2026-10-28T17:31:15.625078" → "28/10/2026"
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    const datePart = String(dateStr).split("T")[0];
    const parts = datePart.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return datePart;
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
      const response = await getRequest(`${OT_USAGE_API}?${buildQueryParams(page)}`);
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
      // Helper appends "&flag=<flag>", so URL must always contain "?"
      const reportUrl = query
        ? `${BLOOD_USAGE_BY_WARD_OT_REPORT_URL}?${query}`
        : `${BLOOD_USAGE_BY_WARD_OT_REPORT_URL}?`;

      const blob = await fetchPdfReportForViewAndPrint(reportUrl, flag);

      if (flag === STATUS_D) {
        const fileURL = window.URL.createObjectURL(blob);
        setPdfUrl(fileURL);
      }
      // For PRINT (STATUS_P) the backend streams directly to printer — nothing to do here
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

  const handleClear = () => {
    setShowReport(false);
    setIsRefreshing(false);
    setReportData([]);
    setPagination({ page: 1, total: 0, size: DEFAULT_ITEMS_PER_PAGE });
    setFilters({
      issueFromDate: "",
      issueToDate: "",
      wardId: "",
      componentId: "",
      bloodGroupId: "",
    });
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
          name="Usage by Ward / OT Report"
        />
      )}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">USAGE BY WARD / OT REPORT</h4>
            </div>
            <div className="card-body">
              {/* Search Parameters Section */}
              <div className="row mb-4">
                {/* Issue From Date */}
                <div className="col-md-2">
                  <label className="form-label">Issue From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={filters.issueFromDate}
                    max={getTodayDate()}
                    onChange={(e) =>
                      setFilters({ ...filters, issueFromDate: e.target.value })
                    }
                  />
                </div>

                {/* Issue To Date */}
                <div className="col-md-2">
                  <label className="form-label">Issue To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={filters.issueToDate}
                    max={getTodayDate()}
                    onChange={(e) =>
                      setFilters({ ...filters, issueToDate: e.target.value })
                    }
                  />
                </div>

                {/* Ward / OT */}
                <div className="col-md-2">
                  <label className="form-label">Ward / OT</label>
                  <select
                    className="form-select"
                    value={filters.wardId}
                    onChange={(e) =>
                      setFilters({ ...filters, wardId: e.target.value })
                    }
                  >
                    <option value="">All Wards/OT</option>
                    {wards.map((w) => (
                      <option key={w.wardId} value={w.wardId}>
                        {w.wardName}
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

                {/* Search / Reset buttons */}
                <div className="col-md-2 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-primary me-2"
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
                          <th>Ward / OT</th>
                          <th>Component</th>
                          <th>Blood Group</th>
                          <th className="text-center">Units Issued</th>
                          <th>Issue Date</th>
                          <th>Patient Name</th>
                          <th>Issued By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isRefreshing ? (
                          renderLoadingRow(7)
                        ) : reportData.length > 0 ? (
                          reportData.map((item, idx) => (
                            <tr key={item.requestDtId || idx}>
                              <td className="fw-bold">{item.wardName}</td>
                              <td>{item.componentName || item.componentCode}</td>
                              <td>{item.bloodGroup}</td>
                              <td className="text-center">
                                <span className="fw-bold">
                                  {item.unitsIssued}
                                </span>
                              </td>
                              <td>{formatDisplayDate(item.issueDate)}</td>
                              <td>{item.patientName}</td>
                              <td>{item.issuedBy}</td>
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

export default UsageByWardOTReport;