import { useState, useEffect, useRef, useMemo } from "react";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import Popup from "../../../Components/popup";
import { getRequest, postRequest } from "../../../service/apiService";
import { BLOOD_COMPONENTS_API, BLOOD_GROUPS_API ,DISCARD_REASONS_API,STOCK_DETAIL_API,BLOOD_COMPONENT_DISCARD_API, OTHER_REASON_CODE, EXPIRED_REASON_CODE} from "../../../config/apiConfig";


const BloodComponentDiscard = () => {
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    bloodGroupId: "",
    componentId: "",
  });

  // Dropdowns
  const [bloodGroups, setBloodGroups] = useState([]);
  const [components, setComponents] = useState([]);
  const [discardReasonList, setDiscardReasonList] = useState([]);

  // Data (client-side pagination) — API returns a flat array
  const [allData, setAllData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Selection state
  // { [inventoryId]: unitObject }
  const [selectedRows, setSelectedRows] = useState({});
  // { [inventoryId]: reasonId }
  const [discardReasons, setDiscardReasons] = useState({});
  // { [inventoryId]: remarksText }
  const [remarks, setRemarks] = useState({});

  // Refs
  const masterCheckboxRef = useRef(null);
  const reasonsRef = useRef([]); // holds latest reasons for auto-selection after async fetch

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => setPopupMessage(null),
    });
  };

  // ---- Helpers ----
  const getUnitKey = (unit) =>
    String(unit?.inventoryId ?? unit?.unitNo ?? "");

  const getComponentName = (code) => {
    const c = components.find((x) => x.componentCode === code);
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
      case "AVAILABLE":
        return "bg-success";
      case "RESERVED":
        return "bg-warning";
      case "ALLOCATED":
        return "bg-info";
      case "EXPIRED":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  const formatStatusLabel = (status) => {
    if (!status) return "";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const getReasonById = (reasonId) =>
    discardReasonList.find(
      (r) => String(r.reasonId) === String(reasonId)
    );

  // ---- Load master data (blood groups, components, discard reasons) ----
  const loadMasterData = async () => {
    try {
      const [bgRes, compRes, reasonRes] = await Promise.all([
        getRequest(BLOOD_GROUPS_API),
        getRequest(BLOOD_COMPONENTS_API),
        getRequest(DISCARD_REASONS_API),
      ]);

      if (bgRes && bgRes.response) setBloodGroups(bgRes.response);
      if (compRes && compRes.response) setComponents(compRes.response);
      if (reasonRes && reasonRes.response) {
        setDiscardReasonList(reasonRes.response);
        reasonsRef.current = reasonRes.response;
      }
    } catch (err) {
      console.error("Error loading master data:", err);
      showPopup("Failed to load master data", "error");
    }
  };

  // ---- Auto-select expired units with "Expired" reason ----
  const applyAutoSelection = (rows) => {
    const expiredReason = (reasonsRef.current || []).find(
      (r) => r.reasonCode === EXPIRED_REASON_CODE
    );

    const newSelected = {};
    const newReasons = {};

    rows.forEach((unit) => {
      if (unit && unit.isExpired) {
        const key = getUnitKey(unit);
        newSelected[key] = unit;
        if (expiredReason) {
          newReasons[key] = String(expiredReason.reasonId);
        }
      }
    });

    setSelectedRows(newSelected);
    setDiscardReasons(newReasons);
    setRemarks({});
    setShowValidationErrors(false);
  };

  // ---- Fetch grid data (no server-side pagination) ----
  const fetchData = async (filterOverride = null) => {
    const activeFilters = filterOverride || filters;
    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      if (activeFilters.fromDate) params.append("fromDate", activeFilters.fromDate);
      if (activeFilters.toDate) params.append("toDate", activeFilters.toDate);
      if (activeFilters.bloodGroupId)
        params.append("bloodGroupId", activeFilters.bloodGroupId);
      if (activeFilters.componentId)
        params.append("componentId", activeFilters.componentId);

      const query = params.toString();
      const url = query ? `${STOCK_DETAIL_API}?${query}` : STOCK_DETAIL_API;

      const response = await getRequest(url);
      const rows =
        response && Array.isArray(response.response) ? response.response : [];

      setAllData(rows);
      setCurrentPage(1);
      applyAutoSelection(rows);
    } catch (err) {
      console.error("Error fetching stock data:", err);
      showPopup("Failed to fetch stock data", "error");
      setAllData([]);
      setSelectedRows({});
      setDiscardReasons({});
      setRemarks({});
    } finally {
      setIsLoading(false);
    }
  };

  // Load master data first, then fetch stocks so that
  // auto-selection of expired units can resolve the "Expired" reason id
  useEffect(() => {
    const init = async () => {
      await loadMasterData();
      await fetchData();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Client-side pagination ----
  const pageSize = DEFAULT_ITEMS_PER_PAGE;

  const pagedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allData.slice(start, start + pageSize);
  }, [allData, currentPage, pageSize]);

  const currentPageKeys = pagedData.map((unit) => getUnitKey(unit));

  const selectedOnPageCount = currentPageKeys.filter(
    (key) => selectedRows[key]
  ).length;

  const allSelected =
    currentPageKeys.length > 0 &&
    selectedOnPageCount === currentPageKeys.length;

  const selectedCount = Object.keys(selectedRows).length;

  useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate =
        selectedOnPageCount > 0 && !allSelected;
    }
  }, [selectedOnPageCount, allSelected]);

  // ---- Selection handlers ----
  const handleRowToggle = (unit) => {
    const key = getUnitKey(unit);
    const wasSelected = !!selectedRows[key];

    setSelectedRows((prev) => {
      const next = { ...prev };
      if (wasSelected) {
        delete next[key];
      } else {
        next[key] = unit;
      }
      return next;
    });

    // Clear reason / remarks when the row is unchecked
    if (wasSelected) {
      setDiscardReasons((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setRemarks((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSelectAll = () => {
    if (allSelected) {
      // Uncheck all rows of current page
      setSelectedRows((prev) => {
        const next = { ...prev };
        currentPageKeys.forEach((key) => delete next[key]);
        return next;
      });
      setDiscardReasons((prev) => {
        const next = { ...prev };
        currentPageKeys.forEach((key) => delete next[key]);
        return next;
      });
      setRemarks((prev) => {
        const next = { ...prev };
        currentPageKeys.forEach((key) => delete next[key]);
        return next;
      });
    } else {
      // Check all rows of current page
      setSelectedRows((prev) => {
        const next = { ...prev };
        pagedData.forEach((unit) => {
          next[getUnitKey(unit)] = unit;
        });
        return next;
      });
    }
  };

  const handleReasonChange = (key, value) => {
    setDiscardReasons((prev) => ({ ...prev, [key]: value }));
  };

  const handleRemarksChange = (key, value) => {
    setRemarks((prev) => ({ ...prev, [key]: value }));
  };

  // ---- Search / Reset ----
  const handleSearch = () => {
    if (filters.fromDate && filters.toDate && filters.fromDate > filters.toDate) {
      showPopup("From Date cannot be greater than To Date", "error");
      return;
    }
    fetchData();
  };

  const handleReset = () => {
    const clearedFilters = {
      fromDate: "",
      toDate: "",
      bloodGroupId: "",
      componentId: "",
    };
    setFilters(clearedFilters);
    setSelectedRows({});
    setDiscardReasons({});
    setRemarks({});
    setShowValidationErrors(false);
    setAllData([]);
    setCurrentPage(1);
    fetchData(clearedFilters);
  };

  // ---- Discard submit ----
  const handleDiscard = async () => {
    const selectedKeys = Object.keys(selectedRows);

    if (selectedKeys.length === 0) {
      showPopup("Please select at least one unit to discard", "error");
      return;
    }

    // 1. Discard reason is mandatory for every selected row
    const missingReasons = selectedKeys.filter((key) => !discardReasons[key]);
    if (missingReasons.length > 0) {
      setShowValidationErrors(true);
      showPopup(
        "Discard reason is mandatory for the selected unit(s)",
        "error"
      );
      return;
    }

    // 2. Remarks are mandatory when reason is "OTHER"
    const missingRemarks = selectedKeys.filter((key) => {
      const reason = getReasonById(discardReasons[key]);
      const isOther = reason && reason.reasonCode === OTHER_REASON_CODE;
      return isOther && !String(remarks[key] || "").trim();
    });

    if (missingRemarks.length > 0) {
      setShowValidationErrors(true);
      showPopup(
        "Remarks are mandatory when discard reason is 'Other'",
        "error"
      );
      return;
    }

    const payload = selectedKeys.map((key) => {
      const unit = selectedRows[key];
      const remarksText = String(remarks[key] || "").trim();
      return {
        inventoryId: unit?.inventoryId,
        discardReasonId: Number(discardReasons[key]),
        remarks: remarksText ? remarksText : null,
      };
    });

    setIsDiscarding(true);
    try {
      const response = await postRequest(BLOOD_COMPONENT_DISCARD_API, payload);
      if (response) {
        showPopup("Unit(s) discarded successfully", "success");
        setSelectedRows({});
        setDiscardReasons({});
        setRemarks({});
        setShowValidationErrors(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error discarding units:", error);
      showPopup("Failed to discard the selected unit(s)", "error");
    } finally {
      setIsDiscarding(false);
    }
  };

  // In-table spinner row
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

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">BLOOD COMPONENT DISCARD</h4>
            </div>
            <div className="card-body">
              {/* ---------- Search Parameters ---------- */}
              <div className="row mb-4">
                {/* From Date */}
                <div className="col-md-2">
                  <label className="form-label">From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={filters.fromDate}
                    max={filters.toDate || undefined}
                    onChange={(e) =>
                      setFilters({ ...filters, fromDate: e.target.value })
                    }
                  />
                </div>

                {/* To Date */}
                <div className="col-md-2">
                  <label className="form-label">To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={filters.toDate}
                    min={filters.fromDate || undefined}
                    onChange={(e) =>
                      setFilters({ ...filters, toDate: e.target.value })
                    }
                  />
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

                {/* Search */}
                <div className="col-md-4 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSearch}
                    disabled={isLoading || isDiscarding}
                  >
                    {isLoading ? (
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
                </div>
              </div>

              {/* ---------- Detail Table ---------- */}
              <div className="table-responsive">
                <table className="table table-bordered align-middle">
                  <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                    <tr>
                      <th>Unit No</th>
                      <th>Bag No</th>
                      <th>Component</th>
                      <th>Blood Group</th>
                      <th>Expiry Date</th>
                      <th>Inventory Status</th>
                      <th>Volume (ml)</th>
                      <th style={{ minWidth: "200px" }}>Discard Reason</th>
                      <th style={{ minWidth: "180px" }}>Remarks</th>
                      <th className="text-center" style={{ width: "95px" }}>
                        <div className="d-flex flex-column align-items-center">
                          <span className="mb-1">Discard</span>
                          <input
                            ref={masterCheckboxRef}
                            type="checkbox"
                            className="form-check-input m-0"
                            checked={allSelected}
                            onChange={handleSelectAll}
                            disabled={pagedData.length === 0 || isLoading}
                          />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      renderLoadingRow(10)
                    ) : pagedData.length > 0 ? (
                      pagedData.map((unit) => {
                        const key = getUnitKey(unit);
                        const isSelected = !!selectedRows[key];
                        const reasonId = discardReasons[key] || "";
                        const reasonObj = getReasonById(reasonId);
                        const isOther =
                          !!reasonObj &&
                          reasonObj.reasonCode === OTHER_REASON_CODE;

                        const isReasonInvalid =
                          showValidationErrors && isSelected && !reasonId;
                        const isRemarksInvalid =
                          showValidationErrors &&
                          isSelected &&
                          isOther &&
                          !String(remarks[key] || "").trim();

                        return (
                          <tr
                            key={key}
                            style={
                              unit.isExpired
                                ? { backgroundColor: "rgba(255, 0, 0, 0.12)" }
                                : undefined
                            }
                          >
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
                            <td>
                              <select
                                className={`form-select form-select-sm ${
                                  isReasonInvalid ? "is-invalid" : ""
                                }`}
                                value={reasonId}
                                onChange={(e) =>
                                  handleReasonChange(key, e.target.value)
                                }
                                disabled={!isSelected}
                              >
                                <option value="">Select reason</option>
                                {discardReasonList.map((r) => (
                                  <option key={r.reasonId} value={r.reasonId}>
                                    {r.reasonName}
                                  </option>
                                ))}
                              </select>
                              {isReasonInvalid && (
                                <div className="invalid-feedback d-block">
                                  Reason is required
                                </div>
                              )}
                            </td>
                            <td>
                              <input
                                type="text"
                                className={`form-control form-control-sm ${
                                  isRemarksInvalid ? "is-invalid" : ""
                                }`}
                                value={remarks[key] || ""}
                                onChange={(e) =>
                                  handleRemarksChange(key, e.target.value)
                                }
                                disabled={!isSelected}
                                placeholder={
                                  isOther ? "Required for Other" : "Optional"
                                }
                                maxLength={250}
                              />
                              {isRemarksInvalid && (
                                <div className="invalid-feedback d-block">
                                  Remarks required for Other
                                </div>
                              )}
                            </td>
                            <td className="text-center">
                              <input
                                type="checkbox"
                                className="form-check-input m-0"
                                checked={isSelected}
                                onChange={() => handleRowToggle(unit)}
                              />
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="10" className="text-center py-4">
                          No Record Found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ---------- Pagination (client-side) ---------- */}
              {!isLoading && allData.length > 0 && (
                <Pagination
                  totalItems={allData.length}
                  itemsPerPage={pageSize}
                  currentPage={currentPage}
                  onPageChange={(p) => setCurrentPage(p)}
                />
              )}

              {/* ---------- Bottom actions ---------- */}
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  {selectedCount > 0 && (
                    <span className="fw-bold">
                      Selected Units: {selectedCount}
                    </span>
                  )}
                </div>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleReset}
                    disabled={isDiscarding}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDiscard}
                    disabled={isDiscarding || isLoading}
                  >
                    {isDiscarding ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Discarding...
                      </>
                    ) : (
                      <>
                        <i className="fa fa-trash me-2"></i> Discard
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodComponentDiscard;