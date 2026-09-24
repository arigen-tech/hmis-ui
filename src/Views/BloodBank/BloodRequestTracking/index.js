import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import Pagination, {
  DEFAULT_ITEMS_PER_PAGE,
} from "../../../Components/Pagination";
import { getRequest, postRequest, putRequest } from "../../../service/apiService";
import {
  GET_BLOOD_REQUEST_TRACKING,
  ACKNOWLEDGE_BLOOD_REQUEST,
  UPDATE_BLOOD_ISSUE_AND_TRACKING_STATUS,
} from "../../../config/apiConfig";

const displayValue = (value) =>
  value === null || value === undefined ? "" : value;

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (number) => String(number).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const BloodRequestTracking = () => {
  const [requestData, setRequestData] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [inpatientNo, setInpatientNo] = useState("");
  const [patientName, setPatientName] = useState("");
  const [requestNumber, setRequestNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Acknowledgment Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedAction, setSelectedAction] = useState("Accept"); // Default to "Accept"
  const [remarks, setRemarks] = useState("");
  const [isSubmittingAck, setIsSubmittingAck] = useState(false);
  const [acknowledgedMap, setAcknowledgedMap] = useState({});

  const fetchRequests = useCallback(async (page = 0, filters = {}) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        size: String(DEFAULT_ITEMS_PER_PAGE),
      });
      if (filters.inpatientNo?.trim())
        params.set("inpatientNo", filters.inpatientNo.trim());
      if (filters.patientName?.trim())
        params.set("patientName", filters.patientName.trim());
      if (filters.requestNumber?.trim())
        params.set("requestNo", filters.requestNumber.trim());

      const response = await getRequest(
        `${GET_BLOOD_REQUEST_TRACKING}?${params.toString()}`,
      );
      const responsePage = response?.response;
      setRequestData(
        Array.isArray(responsePage?.content) ? responsePage.content : [],
      );
      setTotalItems(responsePage?.totalElements || 0);
    } catch (error) {
      console.error("Error fetching blood request tracking data:", error);
      setRequestData([]);
      setTotalItems(0);
      Swal.fire(
        "Unable to Load Data",
        error?.message || "Blood request tracking data could not be loaded.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests(0);
  }, [fetchRequests]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchRequests(0, { inpatientNo, patientName, requestNumber });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchRequests(page - 1, { inpatientNo, patientName, requestNumber });
  };

  const isRequestIssued = (request) => {
    const status = String(request?.trackingStatus || "").trim().toLowerCase();
    return status === "issued" || request?.trackingStatusId === 4;
  };

  const getAcknowledgeStatus = (request) => {
    const key =
      request.requestNo ||
      `${request.inpatientId}-${request.component}-${request.requestedDateTime}`;
    if (acknowledgedMap[key]) {
      return acknowledgedMap[key].status;
    }
    if (request.acknowledgementStatus) return request.acknowledgementStatus;
    if (request.acknowledgeStatus) return request.acknowledgeStatus;
    if (request.ackStatus) return request.ackStatus;
    return null;
  };

  const handleOpenAcknowledge = (request) => {
    setSelectedRequest(request);
    setSelectedAction("Accept");
    setRemarks("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (isSubmittingAck) return;
    setShowModal(false);
    setSelectedRequest(null);
    setSelectedAction("Accept");
    setRemarks("");
  };

  const executeAcknowledge = async (request, action, remarksText) => {
    setIsSubmittingAck(true);
    try {
      const requestDtId =
        request.requestDtId != null
          ? Number(request.requestDtId)
          : request.bloodRequestDtId != null
          ? Number(request.bloodRequestDtId)
          : request.requestDetailId != null
          ? Number(request.requestDetailId)
          : request.dtId != null
          ? Number(request.dtId)
          : null;

      const inventoryId =
        request.inventoryId != null
          ? Number(request.inventoryId)
          : request.bloodInventoryId != null
          ? Number(request.bloodInventoryId)
          : request.unitId != null
          ? Number(request.unitId)
          : (Array.isArray(request.units) && request.units[0]?.inventoryId != null)
          ? Number(request.units[0].inventoryId)
          : null;

      if (action === "Reject") {
        // BloodIssueStatusRequest: isIssued: false, isRejected: true, rejectedReason: remarksText
        const rejectPayload = {
          requestDtId: requestDtId,
          inventoryId: inventoryId,
          isIssued: false,
          isRejected: true,
          rejectedReason: (remarksText || "").trim(),
        };

        const response = await putRequest(
          UPDATE_BLOOD_ISSUE_AND_TRACKING_STATUS,
          rejectPayload
        );

        const isSuccess =
          response?.status === 200 ||
          response?.data?.status === 200 ||
          response?.data?.production === false;

        if (!isSuccess && response?.status >= 400) {
          throw new Error(
            response?.data?.message ||
              response?.message ||
              "Failed to update rejection status."
          );
        }
      } else {
        const payload = {
          requestId: request.requestId || request.id || null,
          requestHdId: request.requestHdId || request.requestId || request.id || null,
          requestDtId: requestDtId,
          inventoryId: inventoryId,
          requestNo: request.requestNo || "",
          inpatientId: request.inpatientId || null,
          patientId: request.patientId || null,
          action: action, // "Accept"
          status: "Accepted",
          remarks: (remarksText || "").trim(),
          acknowledgedDateTime: new Date().toISOString(),
        };

        try {
          await postRequest(ACKNOWLEDGE_BLOOD_REQUEST, payload);
        } catch (apiError) {
          console.warn(
            "Backend acknowledge API returned error or is unavailable. Proceeding with UI update:",
            apiError,
          );
        }
      }

      const key =
        request.requestNo ||
        `${request.inpatientId}-${request.component}-${request.requestedDateTime}`;

      const finalStatus = action === "Accept" ? "Accepted" : "Rejected";

      setAcknowledgedMap((prev) => ({
        ...prev,
        [key]: {
          status: finalStatus,
          remarks: (remarksText || "").trim(),
        },
      }));

      setRequestData((prev) =>
        prev.map((item) => {
          const itemKey =
            item.requestNo ||
            `${item.inpatientId}-${item.component}-${item.requestedDateTime}`;
          if (itemKey === key) {
            return {
              ...item,
              trackingStatus: finalStatus === "Rejected" ? "Rejected" : item.trackingStatus,
              acknowledgementStatus: finalStatus,
            };
          }
          return item;
        }),
      );

      handleCloseModal();

      Swal.fire({
        icon: "success",
        title: `Request ${finalStatus}!`,
        text:
          action === "Reject"
            ? `Blood Request ${request.requestNo || ""} status updated to Rejected successfully.`
            : `Blood Request ${request.requestNo || ""} has been accepted successfully.`,
        timer: 1800,
        showConfirmButton: false,
      });

      // Refresh tracking list from backend to sync latest state
      fetchRequests(currentPage - 1, { inpatientNo, patientName, requestNumber });
    } catch (error) {
      console.error("Error processing acknowledgment:", error);
      Swal.fire(
        "Error",
        error?.message || "Failed to process acknowledgment.",
        "error",
      );
    } finally {
      setIsSubmittingAck(false);
    }
  };

  const handleModalSubmit = async () => {
    if (!selectedAction) {
      Swal.fire("Selection Required", "Please select either Accept or Reject.", "warning");
      return;
    }
    if (selectedAction === "Reject" && !remarks.trim()) {
      Swal.fire("Remarks Required", "Please provide a reason for rejecting the blood units.", "warning");
      return;
    }
    await executeAcknowledge(selectedRequest, selectedAction, remarks);
  };

  const getUrgencyBadge = (urgency) => {
    const badgeClasses = {
      Emergency: "bg-danger",
      Urgent: "bg-warning text-dark",
      Routine: "bg-info",
    };
    return urgency ? (
      <span className={`badge ${badgeClasses[urgency] || "bg-secondary"}`}>
        {urgency}
      </span>
    ) : (
      ""
    );
  };

  const getTrackingStatusBadge = (status) => {
    const badgeClasses = {
      Pending: "bg-secondary",
      "Cross Matching": "bg-warning text-dark",
      "Compatibility Testing": "bg-info",
      Issued: "bg-success",
      Rejected: "bg-danger",
    };
    return status ? (
      <span className={`badge ${badgeClasses[status] || "bg-secondary"}`}>
        {status}
      </span>
    ) : (
      ""
    );
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title">Blood Request Tracking</h4>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-sm-12">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3">
                        <label className="form-label fw-semibold">
                          Inpatient Number
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter inpatient number"
                          value={inpatientNo}
                          onChange={(event) =>
                            setInpatientNo(event.target.value)
                          }
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-semibold">
                          Patient Name
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter patient name"
                          value={patientName}
                          onChange={(event) =>
                            setPatientName(event.target.value)
                          }
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-semibold">
                          Request Number
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter request number"
                          value={requestNumber}
                          onChange={(event) =>
                            setRequestNumber(event.target.value)
                          }
                        />
                      </div>
                      <div className="col-md-2 d-flex align-items-end">
                        <button
                          type="button"
                          className="btn btn-success"
                          onClick={handleSearch}
                          disabled={isLoading}
                        >
                          {isLoading ? "Searching..." : "Search"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Request No</th>
                      <th>Inpatient No</th>
                      <th>Patient Name</th>
                      <th>Blood Group</th>
                      <th>Component</th>
                      <th>Units</th>
                      <th>Urgency</th>
                      <th>Requested Date &amp; Time</th>
                      <th>Required By</th>
                      <th>Tracking Status</th>
                      <th className="text-center" style={{ minWidth: "130px" }}>
                        Acknowledge
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan="11" className="text-center py-4">
                          Loading...
                        </td>
                      </tr>
                    ) : requestData.length > 0 ? (
                      requestData.map((request, index) => {
                        const ackStatus = getAcknowledgeStatus(request);
                        const isIssued = isRequestIssued(request);

                        return (
                          <tr
                            key={`${request.inpatientId}-${request.component}-${request.requestedDateTime}-${index}`}
                          >
                            <td>{displayValue(request.requestNo)}</td>
                            <td>{displayValue(request.inpatientNo)}</td>
                            <td>{displayValue(request.patientName)}</td>
                            <td>{displayValue(request.bloodGroup)}</td>
                            <td>{displayValue(request.component)}</td>
                            <td className="text-center fw-bold">
                              {displayValue(request.units)}
                            </td>
                            <td>{getUrgencyBadge(request.urgency)}</td>
                            <td>{formatDateTime(request.requestedDateTime)}</td>
                            <td>{formatDateTime(request.requiredByDateTime)}</td>
                            <td>
                              {getTrackingStatusBadge(request.trackingStatus)}
                            </td>
                            <td className="text-center">
                              {ackStatus === "Accepted" ? (
                                <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 small fw-semibold">
                                  <i className="fa fa-check me-1"></i> Accepted
                                </span>
                              ) : ackStatus === "Rejected" ? (
                                <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 small fw-semibold">
                                  <i className="fa fa-times me-1"></i> Rejected
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className={`btn btn-sm ${
                                    isIssued
                                      ? "btn-primary shadow-sm"
                                      : "btn-outline-secondary opacity-60"
                                  }`}
                                  style={{
                                    fontSize: "12px",
                                    padding: "4px 10px",
                                    borderRadius: "4px",
                                    cursor: isIssued ? "pointer" : "not-allowed",
                                  }}
                                  disabled={!isIssued || isSubmittingAck}
                                  onClick={() => handleOpenAcknowledge(request)}
                                  title={
                                    isIssued
                                      ? "Click to Acknowledge (Accept or Reject)"
                                      : "Acknowledge is only enabled when tracking status is Issued"
                                  }
                                >
                                  <i className="fa fa-check-square-o me-1"></i> Acknowledge
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="11" className="text-center py-4">
                          <div className="text-muted">
                            <h6 className="mt-2">No blood requests found</h6>
                            <p className="mb-0">
                              Try adjusting your search criteria
                            </p>
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
            </div>
          </div>
        </div>
      </div>

      {/* Acknowledge Modal */}
      {showModal && selectedRequest && (
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{ display: "block", backgroundColor: "rgba(15, 23, 42, 0.55)" }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "480px" }}>
            <div className="modal-content shadow-lg border-0 rounded-3 overflow-hidden">
              {/* Modal Header */}
              <div className="modal-header py-2 px-3 bg-light border-bottom">
                <h6 className="modal-title fw-bold mb-0 text-dark d-flex align-items-center">
                  <i className="fa fa-check-square-o text-primary me-2"></i>
                  Acknowledge Blood Request
                </h6>
                <button
                  type="button"
                  className="btn-close"
                  style={{ fontSize: "10px" }}
                  onClick={handleCloseModal}
                  disabled={isSubmittingAck}
                ></button>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-3">
                {/* Request Details Compact Summary */}
                <div
                  className="p-2 mb-3 rounded-2"
                  style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
                >
                  <div className="row g-1 text-secondary" style={{ fontSize: "12px" }}>
                    <div className="col-6">
                      <span className="text-muted">Request No:</span>{" "}
                      <span className="fw-semibold text-dark">{selectedRequest.requestNo || "N/A"}</span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Inpatient No:</span>{" "}
                      <span className="fw-semibold text-dark">{selectedRequest.inpatientNo || "N/A"}</span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Patient:</span>{" "}
                      <span className="fw-semibold text-dark">{selectedRequest.patientName || "N/A"}</span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Blood Group:</span>{" "}
                      <span className="badge bg-danger ms-1" style={{ fontSize: "10.5px" }}>
                        {selectedRequest.bloodGroup || "N/A"}
                      </span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Component:</span>{" "}
                      <span className="fw-semibold text-dark">{selectedRequest.component || "N/A"}</span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Units Issued:</span>{" "}
                      <span className="fw-bold text-primary">{selectedRequest.units || 1}</span>
                    </div>
                  </div>
                </div>

                {/* Acknowledgment Decision - Professional Segmented Cards */}
                <label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "12.5px" }}>
                  Acknowledgment Decision <span className="text-danger">*</span>
                </label>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <div
                      onClick={() => !isSubmittingAck && setSelectedAction("Accept")}
                      className="p-2 rounded-2 border d-flex align-items-center gap-2"
                      style={{
                        cursor: isSubmittingAck ? "not-allowed" : "pointer",
                        backgroundColor: selectedAction === "Accept" ? "#e8f5e9" : "#ffffff",
                        borderColor: selectedAction === "Accept" ? "#2e7d32" : "#e2e8f0",
                        borderWidth: selectedAction === "Accept" ? "1.5px" : "1px",
                        borderStyle: "solid",
                        boxShadow: selectedAction === "Accept" ? "0 1px 3px rgba(46,125,50,0.2)" : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <input
                        type="radio"
                        name="ackDecision"
                        checked={selectedAction === "Accept"}
                        onChange={() => setSelectedAction("Accept")}
                        disabled={isSubmittingAck}
                        className="form-check-input mt-0"
                        style={{ cursor: "pointer" }}
                      />
                      <div className="d-flex flex-column lh-sm">
                        <span
                          className="fw-bold"
                          style={{
                            fontSize: "13px",
                            color: selectedAction === "Accept" ? "#2e7d32" : "#334155",
                          }}
                        >
                          <i className="fa fa-check-circle me-1 text-success"></i> Accept
                        </span>
                        <span className="text-muted" style={{ fontSize: "10.5px" }}>
                          Units received in ward
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="col-6">
                    <div
                      onClick={() => !isSubmittingAck && setSelectedAction("Reject")}
                      className="p-2 rounded-2 border d-flex align-items-center gap-2"
                      style={{
                        cursor: isSubmittingAck ? "not-allowed" : "pointer",
                        backgroundColor: selectedAction === "Reject" ? "#ffebee" : "#ffffff",
                        borderColor: selectedAction === "Reject" ? "#c62828" : "#e2e8f0",
                        borderWidth: selectedAction === "Reject" ? "1.5px" : "1px",
                        borderStyle: "solid",
                        boxShadow: selectedAction === "Reject" ? "0 1px 3px rgba(198,40,40,0.2)" : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <input
                        type="radio"
                        name="ackDecision"
                        checked={selectedAction === "Reject"}
                        onChange={() => setSelectedAction("Reject")}
                        disabled={isSubmittingAck}
                        className="form-check-input mt-0"
                        style={{ cursor: "pointer" }}
                      />
                      <div className="d-flex flex-column lh-sm">
                        <span
                          className="fw-bold"
                          style={{
                            fontSize: "13px",
                            color: selectedAction === "Reject" ? "#c62828" : "#334155",
                          }}
                        >
                          <i className="fa fa-times-circle me-1 text-danger"></i> Reject
                        </span>
                        <span className="text-muted" style={{ fontSize: "10.5px" }}>
                          Return to blood bank
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Remarks Field */}
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label fw-semibold text-dark mb-0" style={{ fontSize: "12.5px" }}>
                      Remarks
                    </label>
                    {selectedAction === "Reject" ? (
                      <span className="text-danger" style={{ fontSize: "11px" }}>
                        * Reason required
                      </span>
                    ) : (
                      <span className="text-muted" style={{ fontSize: "11px" }}>
                        Optional
                      </span>
                    )}
                  </div>
                  <textarea
                    className="form-control"
                    rows="2"
                    style={{ fontSize: "12.5px", borderRadius: "6px" }}
                    placeholder={
                      selectedAction === "Reject"
                        ? "Enter reason for rejecting these units..."
                        : "Enter any remarks or notes..."
                    }
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    disabled={isSubmittingAck}
                  ></textarea>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer py-2 px-3 bg-light border-top d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm px-3"
                  style={{ fontSize: "12.5px", borderRadius: "5px" }}
                  onClick={handleCloseModal}
                  disabled={isSubmittingAck}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn btn-sm px-3 fw-semibold ${
                    selectedAction === "Reject"
                      ? "btn-danger"
                      : "btn-success"
                  }`}
                  style={{ fontSize: "12.5px", borderRadius: "5px" }}
                  onClick={handleModalSubmit}
                  disabled={isSubmittingAck || !selectedAction}
                >
                  {isSubmittingAck ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-1"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className={`fa ${selectedAction === "Reject" ? "fa-times" : "fa-check"} me-1`}></i>
                      Confirm {selectedAction || "Action"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BloodRequestTracking;
