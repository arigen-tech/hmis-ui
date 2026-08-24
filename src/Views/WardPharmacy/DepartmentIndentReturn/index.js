import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "../../../Components/Loading";
import Popup from "../../../Components/popup";
import ConfirmationPopup from "../../../Components/ConfirmationPopup";
import DatePicker from "../../../Components/DatePicker";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { formatDateForDisplay, formatDateTimeForDisplay } from "../../../utils/dateUtils";
import { getRequest, putRequest } from "../../../service/apiService";
import { GET_INDENT_APPLICABLE_DEPARTEMENTS, GET_UNVERIFIED_RETURN_DETAILS, GET_UNVERIFIED_RETURNS_HEADER, VERIFY_RETURN_INDENT } from "../../../config/apiConfig";



const DepartmentIndentReturn = () => {
  const [returnHeaders, setReturnHeaders] = useState([]);
  const [filteredReturnHeaders, setFilteredReturnHeaders] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [receivedDeptId, setReceivedDeptId] = useState("");
  const [currentView, setCurrentView] = useState("list");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [returnDetails, setReturnDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE;

  // Date filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Selected rows for verification
  const [checkedRows, setCheckedRows] = useState(new Set());
  const [isVerifying, setIsVerifying] = useState(false);

  const navigate = useNavigate();
  const hospitalId = sessionStorage.getItem("hospitalId") || localStorage.getItem("hospitalId");
  const issuedDeptId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId");

  // Helper to show popup
  const showPopup = (message, type = "default") => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  // Fetch department dropdown options
  const fetchDepartments = async () => {
    try {
      const response = await getRequest(GET_INDENT_APPLICABLE_DEPARTEMENTS);
      if (response && response.response) {
        setDepartments(response.response);
      }
    } catch (error) {
      console.error("Failed to fetch departments", error);
      showPopup("Failed to fetch departments", "error");
    }
  };

  // Fetch unverified return headers
  const fetchReturnHeaders = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("issuedDeptId", issuedDeptId);
      if (receivedDeptId) params.append("receivedDeptId", receivedDeptId);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);
      params.append("page", page - 1);
      params.append("size", itemsPerPage);

      const response = await getRequest(
        `${GET_UNVERIFIED_RETURNS_HEADER}/${hospitalId}?${params.toString()}`
      );

      if (response && response.response) {
        const pageData = response.response;
        setReturnHeaders(pageData.content || []);
        setFilteredReturnHeaders(pageData.content || []);
        setTotalPages(pageData.totalPages || 1);
        setTotalElements(pageData.totalElements || 0);
        setCurrentPage(page);
      } else {
        setReturnHeaders([]);
        setFilteredReturnHeaders([]);
        setTotalPages(1);
        setTotalElements(0);
      }
    } catch (error) {
      console.error("Failed to fetch return headers", error);
      showPopup("Failed to fetch returns", "error");
      setReturnHeaders([]);
      setFilteredReturnHeaders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unverified return details for a returnMId
  const fetchReturnDetails = async (returnMId) => {
    try {
      setLoadingDetails(true);
      const response = await getRequest(`${GET_UNVERIFIED_RETURN_DETAILS}/${returnMId}`);
      if (response && response.response) {
        setReturnDetails(response.response);
        // Reset checked rows when new details are loaded
        setCheckedRows(new Set());
      } else {
        setReturnDetails([]);
        setCheckedRows(new Set());
      }
    } catch (error) {
      console.error("Failed to fetch return details", error);
      showPopup("Failed to fetch return details", "error");
      setReturnDetails([]);
      setCheckedRows(new Set());
    } finally {
      setLoadingDetails(false);
    }
  };

  // Load departments on mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Initial fetch of return headers when component mounts
  useEffect(() => {
    fetchReturnHeaders(1);
  }, []);

  // Search handler
  const handleSearch = () => {
    setIsSearching(true);
    fetchReturnHeaders(1).finally(() => setIsSearching(false));
  };

  // Show all (reset filters and fetch all)
  const handleShowAll = () => {
    setFromDate("");
    setToDate("");
    setReceivedDeptId("");
    fetchReturnHeaders(1);
  };

  // Row click handler
  const handleRowClick = async (record) => {
    setSelectedRecord(record);
    setCurrentView("detail");
    await fetchReturnDetails(record.returnMId);
  };

  const handleBack = () => {
    setCurrentView("list");
    setSelectedRecord(null);
    setReturnDetails([]);
    setCheckedRows(new Set());
  };

  const handleReceivedDeptChange = (e) => {
    setReceivedDeptId(e.target.value);
  };

  // Individual row checkbox change handler
  const handleRowCheckChange = (returnTId) => {
    setCheckedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(returnTId)) {
        newSet.delete(returnTId);
      } else {
        newSet.add(returnTId);
      }
      return newSet;
    });
  };

  // Master checkbox change handler
  const handleMasterCheckChange = () => {
    if (allChecked) {
      setCheckedRows(new Set());
    } else {
      const allIds = returnDetails.map((item) => item.returnTId);
      setCheckedRows(new Set(allIds));
    }
  };

  // Determine if all rows are checked
  const allChecked =
    returnDetails.length > 0 &&
    returnDetails.every((item) => checkedRows.has(item.returnTId));

  // Verify button handler
  const handleVerify = async () => {
    if (checkedRows.size === 0) {
      showPopup("Please select at least one item to verify.", "info");
      return;
    }

    setIsVerifying(true);
    try {
      const detailRequests = returnDetails
        .filter((item) => checkedRows.has(item.returnTId))
        .map((item) => ({
          returnTId: item.returnTId,
          stockId: item.stockId,
          damagedQty: item.rejectedQty, // default value; adjust as needed
          reason: item.returnReason,    // default empty string; adjust as needed
        }));

      const payload = {
        returnMId: selectedRecord?.returnMId,
        sourceDeptId: issuedDeptId,
        detailRequests: detailRequests,
      };

      const response = await putRequest(VERIFY_RETURN_INDENT, payload);

      if (response && response.status === 201) {
        showPopup("Return verified successfully!", "success");
        handleBack();
        fetchReturnHeaders(1); // Refresh the list
      } else {
        showPopup(
          response?.message || "Failed to verify return.",
          "error"
        );
      }
    } catch (error) {
      console.error("Verify error:", error);
      showPopup("An error occurred while verifying the return.", "error");
    } finally {
      setIsVerifying(false);
    }
  };

  // Detail view rendering
  if (currentView === "detail") {
    return (
      <div className="content-wrapper">
        {loadingDetails && <LoadingScreen />}
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0 fw-bold">Return Details</h4>
                <button type="button" className="btn btn-secondary" onClick={handleBack}>
                  Back
                </button>
              </div>
              <div className="card-body">
                {/* Header Sections */}
                <div className="row mb-4">
                  {/* Section 1: Indent Return Header */}
                  <div className="col-12 mb-3">
                    <h5 className="fw-bold border-bottom pb-2">Return Details</h5>
                    <div className="row">
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Return No.</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedRecord?.returnNo || ""}
                          readOnly
                          style={{ backgroundColor: "#e9ecef" }}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Return Date</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formatDateTimeForDisplay(selectedRecord?.returnDate)}
                          readOnly
                          style={{ backgroundColor: "#e9ecef" }}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Returned By</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedRecord?.returnedBy || ""}
                          readOnly
                          style={{ backgroundColor: "#e9ecef" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Indent Details */}
                  <div className="col-12 mb-3">
                    <h5 className="fw-bold border-bottom pb-2">Indent Details</h5>
                    <div className="row">
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Indent No.</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedRecord?.indentNo || ""}
                          readOnly
                          style={{ backgroundColor: "#e9ecef" }}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Indent Date</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formatDateTimeForDisplay(selectedRecord?.indentDate)}
                          readOnly
                          style={{ backgroundColor: "#e9ecef" }}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Indent By</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedRecord?.indentBy || ""}
                          readOnly
                          style={{ backgroundColor: "#e9ecef" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Issue Details */}
                  <div className="col-12 mb-3">
                    <h5 className="fw-bold border-bottom pb-2">Issue Details</h5>
                    <div className="row">
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Issue No.</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedRecord?.issueNo || ""}
                          readOnly
                          style={{ backgroundColor: "#e9ecef" }}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Issued Date</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formatDateTimeForDisplay(selectedRecord?.issuedDate)}
                          readOnly
                          style={{ backgroundColor: "#e9ecef" }}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Issued By</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedRecord?.issuedBy || ""}
                          readOnly
                          style={{ backgroundColor: "#e9ecef" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Received Details */}
                  <div className="col-12 mb-3">
                    <h5 className="fw-bold border-bottom pb-2">Received Details</h5>
                    <div className="row">
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Received Dept</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedRecord?.receivedDeptName || ""}
                          readOnly
                          style={{ backgroundColor: "#e9ecef" }}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Received Time</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formatDateTimeForDisplay(selectedRecord?.receivedTime)}
                          readOnly
                          style={{ backgroundColor: "#e9ecef" }}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Received By</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedRecord?.receivedBy || ""}
                          readOnly
                          style={{ backgroundColor: "#e9ecef" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items table with checkboxes */}
                <div className="table-responsive">
                  <table className="table table-bordered align-middle text-center">
                    <thead>
                      <tr>
                        <th style={{ width: "60px" }}>S.No.</th>
                        <th>Item Name</th>
                        <th>Batch No</th>
                        <th>DOM</th>
                        <th>DOE</th>
                        <th>Manufacturer</th>
                        <th>Brand</th>
                        <th>Usable Qty</th>
                        <th>Rejected Qty</th>
                        <th>Return Reason</th>
                        <th style={{ width: "100px" }}>
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            <span>Verify</span>
                            <input
                              type="checkbox"
                              checked={allChecked}
                              onChange={handleMasterCheckChange}
                              title="Select All"
                            />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {returnDetails.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="text-center">
                            No items found for this return.
                          </td>
                        </tr>
                      ) : (
                        returnDetails.map((item, idx) => (
                          <tr key={item.returnTId || idx}>
                            <td className="fw-bold">{idx + 1}</td>
                            <td className="text-start">{item.itemName}</td>
                            <td>{item.batchNo}</td>
                            <td>{formatDateForDisplay(item.dom)}</td>
                            <td>{formatDateForDisplay(item.expiryDate)}</td>
                            <td>{item.manufacturerName}</td>
                            <td>{item.brandName}</td>
                            <td>{item.usableQty ?? "-"}</td>
                            <td>{item.rejectedQty}</td>
                            <td>{item.returnReason || "-"}</td>
                            <td>
                              <input
                                type="checkbox"
                                checked={checkedRows.has(item.returnTId)}
                                onChange={() => handleRowCheckChange(item.returnTId)}
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Verify button */}
                <div className="d-flex justify-content-end mt-3">
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleVerify}
                    disabled={checkedRows.size === 0 || isVerifying}
                  >
                    {isVerifying ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Verifying...
                      </>
                    ) : (
                      "Verify"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {popupMessage && (
          <Popup
            message={popupMessage.message}
            type={popupMessage.type}
            onClose={popupMessage.onClose}
          />
        )}
      </div>
    );
  }

  // List view rendering
  return (
    <div className="content-wrapper">
      {loading && <LoadingScreen />}
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2 mb-0 fw-bold">Unverified Department Returns</h4>
              <div>
                <button type="button" className="btn btn-primary" onClick={handleShowAll}>
                  Show All
                </button>
              </div>
            </div>
            <div className="card-body">
              {/* Search Row with Received Dept dropdown */}
              <div className="row mb-3">
                <div className="col-md-3">
                  <DatePicker
                    label="From Date"
                    value={fromDate}
                    onChange={setFromDate}
                    compact={true}
                  />
                </div>
                <div className="col-md-3">
                  <DatePicker
                    label="To Date"
                    value={toDate}
                    onChange={setToDate}
                    compact={true}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Received Dept</label>
                  <select
                    className="form-select"
                    value={receivedDeptId}
                    onChange={handleReceivedDeptChange}
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.departmentName} ({dept.departmentCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSearch}
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Searching...
                      </>
                    ) : "Search"}
                  </button>
                </div>
              </div>

              {/* Returns Table */}
              <div className="table-responsive">
                <table className="table table-bordered align-middle">
                  <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                    <tr>
                      <th>Return No</th>
                      <th>Indent No</th>
                      <th>Issue No</th>
                      <th>Received Dept</th>
                      <th>Return Date</th>
                      <th>Indent Date</th>
                      <th>Issue Date</th>
                      <th>Received Date</th>
                      <th>Returned By</th>
                      <th>Issued By</th>
                      <th>Received By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReturnHeaders.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="text-center">
                          No records found.
                        </td>
                      </tr>
                    ) : (
                      filteredReturnHeaders.map((item) => (
                        <tr
                          key={item.returnMId}
                          onClick={() => handleRowClick(item)}
                          style={{ cursor: "pointer" }}
                          className="hover-row"
                        >
                          <td>{item.returnNo}</td>
                          <td>{item.indentNo}</td>
                          <td>{item.issueNo}</td>
                          <td>{item.receivedDeptName}</td>
                          <td>{formatDateTimeForDisplay(item.returnDate)}</td>
                          <td>{formatDateTimeForDisplay(item.indentDate)}</td>
                          <td>{formatDateTimeForDisplay(item.issuedDate)}</td>
                          <td>{formatDateTimeForDisplay(item.receivedTime)}</td>
                          <td>{item.returnedBy}</td>
                          <td>{item.issuedBy}</td>
                          <td>{item.receivedBy}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <Pagination
                totalItems={totalElements}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => fetchReturnHeaders(page)}
              />
            </div>
          </div>
        </div>
      </div>

      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}
    </div>
  );
};

export default DepartmentIndentReturn;