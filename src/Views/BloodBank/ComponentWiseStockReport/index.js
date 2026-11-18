import { useState, useEffect } from "react";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";
import { getRequest, fetchPdfReportForViewAndPrint } from "../../../service/apiService";
import {
  STATUS_D,
  STATUS_P,
  COMPONENT_WISE_STOCK_REPORT_URL,
  MASTERS,
} from "../../../config/apiConfig";

// API Paths
const BLOOD_GROUPS_API = `${MASTERS}/blood-group/getAll/1`;
const BLOOD_COMPONENTS_API = "/master/masBloodComponent/getAll/1";
const COMPONENT_WISE_STOCK_API = "/bloodBank/component-wise-stock";

// Mapping the SQL values you provided to the dropdown options
const INVENTORY_STATUS_OPTIONS = [
  { label: "Available", value: "1" },
  { label: "Allocated", value: "2" },
  { label: "Reserved", value: "3" },
  { label: "Expired", value: "5" },
];

const ComponentWiseStockReport = () => {
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);

  // NEW: separate flag for pagination-only refreshes (keeps table visible)
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    componentId: "",
    bloodGroupId: "",
    filterStatusId: "",
  });

  // Dropdowns
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

  const getComponentName = (code) => {
    const c = components.find((c) => c.componentCode === code);
    return c ? c.componentName : code;
  };

  // ---- Fetch Grid Data (Search + Pagination) ----
  // isPageChange = true → don't hide table, only show in-table spinner
  const fetchReportData = async (page = 1, isPageChange = false) => {
    if (isPageChange) {
      setIsRefreshing(true);
    } else {
      setIsGenerating(true);
      setShowReport(false);
    }

    try {
      const query = new URLSearchParams();
      query.append("componentId", filters.componentId || "0");
      query.append("bloodGroupId", filters.bloodGroupId || "0");
      query.append("filterStatusId", filters.filterStatusId || "0");
      query.append("page", String(page - 1));
      query.append("size", String(DEFAULT_ITEMS_PER_PAGE));

      const response = await getRequest(`${COMPONENT_WISE_STOCK_API}?${query.toString()}`);
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
      console.error("Error fetching component-wise stock report:", err);
      showPopup("Failed to fetch component-wise stock report", "error");
    } finally {
      if (isPageChange) {
        setIsRefreshing(false);
      } else {
        setIsGenerating(false);
      }
    }
  };

  const handleSearch = () => {
    fetchReportData(1);
  };

  const handleClear = () => {
    setShowReport(false);
    setIsRefreshing(false);
    setReportData([]);
    setPagination({ page: 1, total: 0, size: DEFAULT_ITEMS_PER_PAGE });
    setFilters({ componentId: "", bloodGroupId: "", filterStatusId: "" });
    setPdfUrl(null);
  };

  // ---- PDF Generation (VIEW / PRINT) ----
  const generatePdfReport = async (flag) => {
    if (flag === STATUS_D) {
      setIsViewLoading(true);
    } else if (flag === STATUS_P) {
      setIsPrintLoading(true);
    }
    setPdfUrl(null);

    try {
      const baseUrl = COMPONENT_WISE_STOCK_REPORT_URL;
      const params = new URLSearchParams();

      if (filters.bloodGroupId) params.append("bloodGroupId", filters.bloodGroupId);
      if (filters.componentId) params.append("componentId", filters.componentId);
      // Note: Backend PDF controller does not accept filterStatusId based on the provided signature

      const query = params.toString();
      // Ensure URL ends with "?" so appended "&flag=..." works
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

      {pdfUrl && (
        <PdfViewer
          pdfUrl={pdfUrl}
          onClose={() => setPdfUrl(null)}
          name="Component Wise Stock Report"
        />
      )}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">COMPONENT-WISE STOCK REPORT</h4>
            </div>
            <div className="card-body">
              {/* Search Parameters Section */}
              <div className="row mb-4">
                {/* Component Dropdown */}
                <div className="col-md-3">
                  <label className="form-label fw-bold">Component</label>
                  <select
                    className="form-select"
                    value={filters.componentId}
                    onChange={(e) => setFilters({ ...filters, componentId: e.target.value })}
                  >
                    <option value="">All Components</option>
                    {components.map((c) => (
                      <option key={c.componentId} value={c.componentId}>
                        {c.componentName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Blood Group Dropdown */}
                <div className="col-md-3">
                  <label className="form-label fw-bold">Blood Group</label>
                  <select
                    className="form-select"
                    value={filters.bloodGroupId}
                    onChange={(e) => setFilters({ ...filters, bloodGroupId: e.target.value })}
                  >
                    <option value="">All Blood Groups</option>
                    {bloodGroups.map((g) => (
                      <option key={g.bloodGroupId} value={g.bloodGroupId}>
                        {g.bloodGroupName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Inventory Status Dropdown */}
                <div className="col-md-3">
                  <label className="form-label fw-bold">Inventory Status</label>
                  <select
                    className="form-select"
                    value={filters.filterStatusId}
                    onChange={(e) => setFilters({ ...filters, filterStatusId: e.target.value })}
                  >
                    <option value="">All Status</option>
                    {INVENTORY_STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search / Reset buttons */}
                <div className="col-md-3 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-primary me-2"
                    onClick={handleSearch}
                    disabled={isGenerating || isRefreshing}
                  >
                    {isGenerating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
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
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
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
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
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

              {/* Report Table */}
              {!isGenerating && showReport && (
                <>
                  <div className="table-responsive">
                    <table className="table table-bordered align-middle">
                      <thead>
                        <tr>
                          <th>Component</th>
                          <th>Blood Group</th>
                          <th className="text-center">Available Units</th>
                          <th className="text-center">Reserved Units</th>
                          <th className="text-center">Allocated Units</th>
                          <th className="text-center">Expired Units</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isRefreshing ? (
                          renderLoadingRow(6)
                        ) : reportData.length > 0 ? (
                          reportData.map((item, idx) => (
                            <tr key={idx}>
                              <td>{getComponentName(item.componentCode)}</td>
                              <td className="fw-bold">{item.bloodGroupName}</td>
                              <td className="text-center">
                                <span className="fw-bold ">{item.availableUnits}</span>
                              </td>
                              <td className="text-center">
                                <span className="fw-bold ">{item.reservedUnits}</span>
                              </td>
                              <td className="text-center">
                                <span className="fw-bold ">{item.allocatedUnits}</span>
                              </td>
                              <td className="text-center">
                                <span className="fw-bold ">{item.expiredUnits}</span>
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

                  {pagination.total > 0 && (
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

export default ComponentWiseStockReport;