import { useState, useEffect, useCallback, useRef } from "react";
import Popup from "../../../Components/popup";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, postRequest } from "../../../service/apiService";
import {
  GET_PENDING_BLOOD_ISSUE,
  MAS_WARD_GET_ALL_ACTIVE,
  MAS_DEPARTMENT_GET_ALL,
  SAVE_BLOOD_ISSUE,
} from "../../../config/apiConfig";

const PendingForIssue = () => {
  const [pendingList, setPendingList] = useState([]);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [wardOptions, setWardOptions] = useState([]);

  // Issue modal states
  const [selectedIssueItem, setSelectedIssueItem] = useState(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [issueForm, setIssueForm] = useState({
    issueDateTime: "",
    issuedBy: "",
  });

  const [searchParams, setSearchParams] = useState({
    requestNo: "",
    patientName: "",
    wardId: "",
  });

  const searchFiltersRef = useRef({
    requestNo: "",
    patientName: "",
    wardId: "",
  });

  const didFetchOnMount = useRef(false);

  // Fetch wards and departments for the Ward dropdown
  useEffect(() => {
    const fetchWards = async () => {
      try {
        const [wardsRes, deptsRes] = await Promise.allSettled([
          getRequest(MAS_WARD_GET_ALL_ACTIVE),
          getRequest(MAS_DEPARTMENT_GET_ALL),
        ]);

        const options = [];
        const seenNames = new Set();

        if (wardsRes.status === "fulfilled") {
          const res = wardsRes.value;
          const list = res?.response || res?.data || (Array.isArray(res) ? res : []);
          if (Array.isArray(list)) {
            list.forEach((w) => {
              const id = w.wardId ?? w.id;
              const name = w.wardName ?? w.name;
              if (id !== undefined && id !== null && name) {
                const strName = String(name).trim();
                if (!seenNames.has(strName.toLowerCase())) {
                  seenNames.add(strName.toLowerCase());
                  options.push({ id: String(id), name: strName });
                }
              }
            });
          }
        }

        if (deptsRes.status === "fulfilled") {
          const res = deptsRes.value;
          const list = res?.response || res?.data || (Array.isArray(res) ? res : []);
          if (Array.isArray(list)) {
            list.forEach((d) => {
              const id = d.departmentId ?? d.id;
              const name = d.departmentName ?? d.name ?? d.deptName;
              if (id !== undefined && id !== null && name) {
                const strName = String(name).trim();
                if (!seenNames.has(strName.toLowerCase())) {
                  seenNames.add(strName.toLowerCase());
                  options.push({ id: String(id), name: strName });
                }
              }
            });
          }
        }

        options.sort((a, b) => a.name.localeCompare(b.name));
        setWardOptions(options);
      } catch (err) {
        console.error("Error loading wards:", err);
      }
    };
    fetchWards();
  }, []);

  const fetchPendingForIssueData = useCallback(async (page = 0, filters = {}) => {
    setIsTableLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        size: String(DEFAULT_ITEMS_PER_PAGE),
      });

      if (filters.requestNo?.trim()) {
        params.set("requestNo", filters.requestNo.trim());
      }
      if (filters.patientName?.trim()) {
        params.set("patientName", filters.patientName.trim());
      }
      if (
        filters.wardId !== undefined &&
        filters.wardId !== null &&
        String(filters.wardId).trim() !== ""
      ) {
        params.set("wardId", String(filters.wardId).trim());
      }

      const response = await getRequest(`${GET_PENDING_BLOOD_ISSUE}?${params.toString()}`);
      const pageData = response?.data || response?.response || response;
      const content = Array.isArray(pageData?.content)
        ? pageData.content
        : Array.isArray(pageData)
        ? pageData
        : [];

      setPendingList(content);
      setTotalItems(pageData?.totalElements ?? content.length);
    } catch (error) {
      console.error("Error fetching pending for issue data:", error);
      setPendingList([]);
      setTotalItems(0);
      showPopup(error?.message || "Error fetching pending blood issue data", "error");
    } finally {
      setIsTableLoading(false);
      setIsSearching(false);
      setIsResetting(false);
    }
  }, []);

  // Run initial fetch on mount only once
  useEffect(() => {
    if (didFetchOnMount.current) return;
    didFetchOnMount.current = true;
    fetchPendingForIssueData(0);
  }, [fetchPendingForIssueData]);

  const handleChangeSearch = (e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    setIsSearching(true);
    searchFiltersRef.current = { ...searchParams };
    setCurrentPage(1);
    await fetchPendingForIssueData(0, searchParams);
  };

  const handleReset = async (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    setIsResetting(true);
    const resetFilters = {
      requestNo: "",
      patientName: "",
      wardId: "",
    };
    setSearchParams(resetFilters);
    searchFiltersRef.current = resetFilters;
    setCurrentPage(1);
    await fetchPendingForIssueData(0, resetFilters);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchPendingForIssueData(page - 1, searchFiltersRef.current);
  };

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      },
    });
  };

  const getTodayDateTimeLocal = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  const getLoggedInUser = () => {
    return (
      sessionStorage.getItem("loggedInUserName") ||
      localStorage.getItem("loggedInUserName") ||
      sessionStorage.getItem("userName") ||
      localStorage.getItem("userName") ||
      ""
    );
  };

  const handleOpenIssueModal = (item) => {
    setSelectedIssueItem(item);
    setIssueForm({
      issueDateTime: getTodayDateTimeLocal(),
      issuedBy: getLoggedInUser(),
    });
    setShowIssueModal(true);
  };

  const handleCloseIssueModal = () => {
    if (isIssuing) return;
    setShowIssueModal(false);
    setSelectedIssueItem(null);
  };

  const handleIssueFormChange = (e) => {
    const { name, value } = e.target;
    setIssueForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleConfirmIssue = async (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    if (!selectedIssueItem) return;

    setIsIssuing(true);
    try {
      const payload = {
        requestHdId: selectedIssueItem.requestHdId ? Number(selectedIssueItem.requestHdId) : null,
        requestDtId: selectedIssueItem.requestDtId ? Number(selectedIssueItem.requestDtId) : null,
        requestNo: selectedIssueItem.requestNo || "",
        inpatientId: selectedIssueItem.inpatientId ? Number(selectedIssueItem.inpatientId) : null,
        patientId: selectedIssueItem.patientId ? Number(selectedIssueItem.patientId) : null,
        unitsIssued: selectedIssueItem.unitsReserved ?? 1,
        issueDatetime: issueForm.issueDateTime
          ? (issueForm.issueDateTime.length === 16 ? `${issueForm.issueDateTime}:00` : issueForm.issueDateTime)
          : getTodayDateTimeLocal(),
        issuedBy: issueForm.issuedBy.trim(),
      };

      const response = await postRequest(SAVE_BLOOD_ISSUE, payload);

      if (response?.status === 200 || response?.status === 201 || response?.success) {
        showPopup(
          response?.message || `Blood units issued successfully for Request ${selectedIssueItem.requestNo}`,
          "success"
        );
        setShowIssueModal(false);
        setSelectedIssueItem(null);
        fetchPendingForIssueData(currentPage - 1, searchFiltersRef.current);
      } else {
        showPopup(response?.message || "Failed to issue blood units.", "error");
      }
    } catch (error) {
      console.error("Error issuing blood:", error);
      showPopup(error?.message || "Error occurred while issuing blood units.", "error");
    } finally {
      setIsIssuing(false);
    }
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case "emergency":
        return <span className="badge bg-danger">Emergency</span>;
      case "urgent":
        return <span className="badge bg-warning text-dark">Urgent</span>;
      case "routine":
        return <span className="badge bg-info">Routine</span>;
      default:
        return <span className="badge bg-secondary">{urgency || "N/A"}</span>;
    }
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Pending for Issue</h4>
            </div>

            <div className="card-body">
              {/* Search Filters */}
              <form onSubmit={handleSearch} className="mb-4">
                <div className="row g-3 align-items-end">
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Request No</label>
                    <input
                      type="text"
                      className="form-control"
                      name="requestNo"
                      placeholder="Enter Request No"
                      value={searchParams.requestNo}
                      onChange={handleChangeSearch}
                      disabled={isSearching || isResetting || isTableLoading}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Patient Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="patientName"
                      placeholder="Enter Patient Name"
                      value={searchParams.patientName}
                      onChange={handleChangeSearch}
                      disabled={isSearching || isResetting || isTableLoading}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Ward</label>
                    <select
                      className="form-select"
                      name="wardId"
                      value={searchParams.wardId}
                      onChange={handleChangeSearch}
                      disabled={isSearching || isResetting || isTableLoading}
                    >
                      <option value="">All Wards</option>
                      {wardOptions.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3 d-flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary d-inline-flex align-items-center justify-content-center"
                      disabled={isSearching || isResetting || isTableLoading}
                      style={{ minWidth: "110px" }}
                    >
                      {isSearching ? (
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
                      className="btn btn-secondary d-inline-flex align-items-center justify-content-center"
                      onClick={handleReset}
                      disabled={isSearching || isResetting || isTableLoading}
                      style={{ minWidth: "100px" }}
                    >
                      {isResetting ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          />
                          Resetting...
                        </>
                      ) : (
                        "Reset"
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Table */}
              <div className="table-responsive packagelist">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Request No</th>
                      <th>Inpatient</th>
                      <th>Patient</th>
                      <th>Blood Group</th>
                      <th>Component</th>
                      <th className="text-center">Units Reserved</th>
                      <th>Ward</th>
                      <th>Urgency</th>
                      <th>Required By</th>
                      <th>Reserved On</th>
                      <th className="text-center" style={{ minWidth: "100px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isTableLoading ? (
                      <tr>
                        <td colSpan="11" className="text-center py-5">
                          <div className="d-flex flex-column align-items-center justify-content-center">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <span className="mt-2 text-muted fw-semibold">
                              Loading pending blood issue requests...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : pendingList.length > 0 ? (
                      pendingList.map((item, index) => (
                        <tr key={item.requestDtId || item.requestHdId || index}>
                          <td className="fw-bold">{item.requestNo || "-"}</td>
                          <td>{item.inpatientNo || "-"}</td>
                          <td>{item.patientName || "-"}</td>
                          <td>
                            {item.bloodGroup ? (
                              <span className="badge bg-danger">{item.bloodGroup}</span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td>{item.component || "-"}</td>
                          <td className="text-center fw-bold">{item.unitsReserved ?? "-"}</td>
                          <td>
                            {item.ward ||
                              item.requestedWard ||
                              item.wardName ||
                              item.requestDept ||
                              "-"}
                          </td>
                          <td>{getUrgencyBadge(item.urgency)}</td>
                          <td className={item.requiredBy === "ASAP" ? "fw-bold text-danger" : ""}>
                            {item.requiredBy || "-"}
                          </td>
                          <td>{item.reservedOn || "-"}</td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-primary btn-sm px-3"
                              onClick={() => handleOpenIssueModal(item)}
                              disabled={isIssuing}
                            >
                              Issue
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="11" className="text-center py-4">
                          <div className="text-muted">
                            <h6 className="mt-2">No pending issue requests found</h6>
                            <p className="mb-0">All cross-matched requests have been issued</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalItems > 0 && (
                <Pagination
                  totalItems={totalItems}
                  itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                />
              )}

              {popupMessage && (
                <Popup
                  message={popupMessage.message}
                  type={popupMessage.type}
                  onClose={popupMessage.onClose}
                />
              )}

              {/* Issue Blood Modal */}
              {showIssueModal && selectedIssueItem && (
                <div
                  className="modal fade show"
                  style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
                  tabIndex="-1"
                  role="dialog"
                  aria-modal="true"
                >
                  <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">
                          Issue Blood Units - Request: {selectedIssueItem.requestNo || "-"}
                        </h5>
                        <button
                          type="button"
                          className="btn-close"
                          aria-label="Close"
                          onClick={handleCloseIssueModal}
                          disabled={isIssuing}
                        ></button>
                      </div>
                      <form onSubmit={handleConfirmIssue}>
                        <div className="modal-body">
                          {/* Summary Info Card */}
                          <div className="card bg-light border-0 mb-3">
                            <div className="card-body p-3">
                              <div className="row g-2">
                                <div className="col-md-4">
                                  <small className="text-muted d-block">Patient Name</small>
                                  <span className="fw-bold">{selectedIssueItem.patientName || "-"}</span>
                                </div>
                                <div className="col-md-4">
                                  <small className="text-muted d-block">Inpatient No</small>
                                  <span className="fw-bold">{selectedIssueItem.inpatientNo || "-"}</span>
                                </div>
                                <div className="col-md-4">
                                  <small className="text-muted d-block">Blood Group</small>
                                  {selectedIssueItem.bloodGroup ? (
                                    <span className="badge bg-danger">{selectedIssueItem.bloodGroup}</span>
                                  ) : (
                                    "-"
                                  )}
                                </div>
                                <div className="col-md-4">
                                  <small className="text-muted d-block">Component</small>
                                  <span className="fw-bold">{selectedIssueItem.component || "-"}</span>
                                </div>
                                <div className="col-md-4">
                                  <small className="text-muted d-block">Units Reserved</small>
                                  <span className="fw-bold text-primary">{selectedIssueItem.unitsReserved ?? "-"}</span>
                                </div>
                                <div className="col-md-4">
                                  <small className="text-muted d-block">Ward / Dept</small>
                                  <span>
                                    {selectedIssueItem.ward ||
                                      selectedIssueItem.requestedWard ||
                                      selectedIssueItem.wardName ||
                                      selectedIssueItem.requestDept ||
                                      "-"}
                                  </span>
                                </div>
                                <div className="col-md-4">
                                  <small className="text-muted d-block">Urgency</small>
                                  <span>{getUrgencyBadge(selectedIssueItem.urgency)}</span>
                                </div>
                                <div className="col-md-4">
                                  <small className="text-muted d-block">Required By</small>
                                  <span>{selectedIssueItem.requiredBy || "-"}</span>
                                </div>
                                <div className="col-md-4">
                                  <small className="text-muted d-block">Reserved On</small>
                                  <span>{selectedIssueItem.reservedOn || "-"}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Issue Form Fields */}
                          <div className="row g-3">
                            <div className="col-md-6">
                              <label className="form-label fw-semibold">
                                Issue Date & Time <span className="text-danger">*</span>
                              </label>
                              <input
                                type="datetime-local"
                                className="form-control"
                                name="issueDateTime"
                                value={issueForm.issueDateTime}
                                onChange={handleIssueFormChange}
                                required
                                disabled={isIssuing}
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label fw-semibold">Issued By</label>
                              <input
                                type="text"
                                className="form-control"
                                name="issuedBy"
                                placeholder="Officer / User name"
                                value={issueForm.issuedBy}
                                onChange={handleIssueFormChange}
                                disabled={isIssuing}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleCloseIssueModal}
                            disabled={isIssuing}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary d-inline-flex align-items-center"
                            disabled={isIssuing}
                          >
                            {isIssuing ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm me-2"
                                  role="status"
                                  aria-hidden="true"
                                />
                                Issuing...
                              </>
                            ) : (
                              <>
                                <i className="fa fa-check me-2"></i>
                                Confirm Issue
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingForIssue;