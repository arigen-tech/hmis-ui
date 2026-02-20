import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, putRequest } from "../../../service/apiService";
import { XRAY_MODALITY } from "../../../config/apiConfig";

const XRAYInvestigation = () => {
  const [xrayData, setXrayData] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [searchContact, setSearchContact] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    action: "", // "complete" or "cancel"
    patientName: "",
    investigationName: ""
  });

  const [popupMessage, setPopupMessage] = useState(null);
  // Arrow function to format date as dd/MM/YYYY
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  // Arrow function to extract and format time as HH:mm
  const formatTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
  };
  // Output: "12:13"

  // Fetch pending radiology investigations with server-side pagination
  const fetchPendingInvestigations = async (page = 0) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        modality: XRAY_MODALITY,
        page: page,
        size: DEFAULT_ITEMS_PER_PAGE
      });

      if (searchName?.trim()) params.append('patientName', searchName.trim());
      if (searchContact?.trim()) params.append('phoneNumber', searchContact.trim());

      const response = await getRequest(`/radiology/pendingInvestigationForRadiology?${params.toString()}`);

      if (response?.response) {
        // Map API response to match your table structure (without status)
        const mappedData = response.response.content.map(item => ({
          id: item.radOrderDtId,
          accessionNo: item.accessionNo,
          uhid: item.uhidNo,
          patientName: item.patientName,
          age: item.age,
          gender: item.gender,
          modality: item.modality,
          investigationName: item.investigationName,
          orderDate: formatDate(item.orderTime),
          orderTime: formatTimeForDisplay(item.orderTime),
          department: item.department,
          contactNo: item.phoneNumber
        }));

        setXrayData(mappedData);
        setTotalPages(response.response.totalPages);
        setTotalElements(response.response.totalElements);
      } else {
        setXrayData([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      console.error("Error fetching pending investigations:", error);
      showPopup("Failed to fetch pending investigations", "error");
      setXrayData([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  // Format time from ISO string to display format
  const formatTimeForDisplay = (dateTimeStr) => {
    if (!dateTimeStr) return "-";
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      return "-";
    }
  };

  // Initial load
  useEffect(() => {
    fetchPendingInvestigations(0);
  }, []);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(0);
    fetchPendingInvestigations(0);
  };

  // Handle reset
  const handleReset = () => {
    setSearchName("");
    setSearchContact("");
    setCurrentPage(0);
    fetchPendingInvestigations(0);
  };

  // Handle pagination page change
  const handlePageChange = (page) => {
    const newPage = page - 1;
    setCurrentPage(newPage);
    fetchPendingInvestigations(newPage);
  };

  /* ---------------- POPUP ---------------- */
  const showPopup = (message, type = "success") => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  /* ---------------- COMPLETE INVESTIGATION ---------------- */
  const handleCompleteClick = (row) => {
    setConfirmDialog({
      isOpen: true,
      id: row.id,
      action: "complete",
      patientName: row.patientName,
      investigationName: row.investigationName
    });
  };

  /* ---------------- CANCEL INVESTIGATION ---------------- */
  const handleCancelClick = (row) => {
    setConfirmDialog({
      isOpen: true,
      id: row.id,
      action: "cancel",
      patientName: row.patientName,
      investigationName: row.investigationName
    });
  };

  /* ---------------- CONFIRM ACTION ---------------- */
  const handleConfirmAction = async (confirmed) => {
    if (confirmed && confirmDialog.id) {
      try {
        setActionLoading(true);

        // Determine status based on action
        const status = confirmDialog.action === "complete" ? "y" : "c";

        // Call API to update status
        const response = await putRequest(
          `/radiology/cancelOrCompleteInvestigationRadiology?id=${confirmDialog.id}&status=${status}`
        );

        if (response?.status === 200) {
          // Show success message
          showPopup(
            `Investigation ${confirmDialog.action === "complete" ? "Completed" : "Cancelled"} Successfully`,
            "success"
          );

          // Refresh the list to reflect the change
          fetchPendingInvestigations(currentPage);
        } else {
          showPopup(`Failed to ${confirmDialog.action} investigation`, "error");
        }
      } catch (error) {
        console.error(`Error ${confirmDialog.action}ing investigation:`, error);
        showPopup(`Failed to ${confirmDialog.action} investigation`, "error");
      } finally {
        setActionLoading(false);
      }
    }

    // Close dialog
    setConfirmDialog({
      isOpen: false,
      id: null,
      action: "",
      patientName: "",
      investigationName: ""
    });
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title">XRAY Investigation</h4>
        </div>

        <div className="card-body">
          {loading ? (
            <LoadingScreen />
          ) : (
            <>
              {/* Search Fields */}
              <div className="mb-3">
                <div className="row align-items-end">
                  {/* Patient Name Search Field */}
                  <div className="col-md-4">
                    <div className="form-group mb-0">
                      <label className="form-label fw-bold mb-1">
                        Patient Name
                      </label>
                      <div className="input-group">
                        <input
                          type="search"
                          className="form-control"
                          placeholder="Enter patient name"
                          value={searchName}
                          onChange={(e) => setSearchName(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Number Search Field */}
                  <div className="col-md-4">
                    <div className="form-group mb-0">
                      <label className="form-label fw-bold mb-1">
                        Mobile No
                      </label>
                      <div className="input-group">
                        <input
                          type="search"
                          className="form-control"
                          placeholder="Enter mobile number"
                          value={searchContact}
                          onChange={(e) => setSearchContact(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Search and Reset Buttons */}
                  <div className="col-md-4">
                    <div className="form-group mb-0">
                      <label className="form-label fw-bold mb-1" style={{ visibility: "hidden" }}>
                        Actions
                      </label>
                      <div className="d-flex">
                        <button
                          className="btn btn-primary me-2"
                          onClick={handleSearch}
                          disabled={loading || actionLoading}
                          title="Search records"
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" />
                              Searching...
                            </>
                          ) : "Search"}
                        </button>

                        <button
                          className="btn btn-secondary"
                          onClick={handleReset}
                          disabled={loading || actionLoading}
                          title="Reset all search filters"
                        >
                          <i className="fas fa-redo-alt me-1"></i> Reset
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Record count row */}
                <div className="row mt-3">
                  <div className="col-md-12 text-end">
                    <span className="text-muted">
                      Showing {xrayData.length} of {totalElements} records
                    </span>
                  </div>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Accession No</th>
                      <th>UHID</th>
                      <th>Patient Name</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>Mobile No</th>
                      <th>Modality</th>
                      <th>Investigation</th>
                      <th>Order Date/Time</th>
                      {/* <th>Department</th> */}
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {xrayData.length > 0 ? (
                      xrayData.map(item => (
                        <tr key={item.id}>
                          <td>{item.accessionNo}</td>
                          <td>{item.uhid}</td>
                          <td>{item.patientName}</td>
                          <td>{item.age}</td>
                          <td>{item.gender}</td>
                          <td>{item.contactNo}</td>
                          <td>{item.modality}</td>
                          <td>{item.investigationName}</td>
                          <td>{item.orderDate} {item.orderTime}</td>
                          {/* <td>{item.department}</td> */}

                          {/* ACTIONS */}
                          <td>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm btn-success me-1"
                                onClick={() => handleCompleteClick(item)}
                                disabled={loading || actionLoading}
                                title="Mark as Completed"
                              >
                                {actionLoading && confirmDialog.id === item.id ? (
                                  <span className="spinner-border spinner-border-sm me-1" />
                                ) : null}
                                Complete
                              </button>

                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleCancelClick(item)}
                                disabled={loading || actionLoading}
                                title="Cancel Investigation"
                              >
                                {actionLoading && confirmDialog.id === item.id ? (
                                  <span className="spinner-border spinner-border-sm me-1" />
                                ) : null}
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="12" className="text-center text-muted py-4">
                          <i className="fas fa-search fa-2x mb-3"></i>
                          <p>No records found matching your search</p>
                          {(searchName || searchContact) && (
                            <button
                              className="btn btn-sm btn-outline-secondary mt-2"
                              onClick={handleReset}
                              disabled={loading || actionLoading}
                            >
                              Reset Search
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {xrayData.length > 0 && totalPages > 0 && (
                <Pagination
                  totalItems={totalElements}
                  itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                  currentPage={currentPage + 1}
                  onPageChange={handlePageChange}
                  totalPages={totalPages}
                />
              )}
            </>
          )}

          {popupMessage && <Popup {...popupMessage} />}

          {/* Confirmation Dialog */}
          {confirmDialog.isOpen && (
            <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      Confirm {confirmDialog.action === "complete" ? "Complete" : "Cancel"}
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => handleConfirmAction(false)}
                      disabled={actionLoading}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <p>
                      Are you sure you want to{" "}
                      {confirmDialog.action === "complete" ? "Complete" : "Cancel"}{" "}
                      this Request?
                    </p>
                  </div>
                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleConfirmAction(false)}
                      disabled={actionLoading}
                    >
                      No
                    </button>
                    <button
                      className={`btn ${confirmDialog.action === "complete" ? "btn-success" : "btn-danger"}`}
                      onClick={() => handleConfirmAction(true)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          {confirmDialog.action === "complete" ? "Completing..." : "Cancelling..."}
                        </>
                      ) : (
                        `Yes`
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default XRAYInvestigation;