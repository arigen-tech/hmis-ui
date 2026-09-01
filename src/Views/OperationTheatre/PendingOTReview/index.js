import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination from "../../../Components/Pagination";
import { getRequest, postRequest } from "../../../service/apiService";
import { PENDING_FOR_REVIEW_OT_LIST, SAVE_ACCEPT_REJECT_OT } from "../../../config/apiConfig";

const ITEMS_PER_PAGE = 5;

const PendingOTReview = () => {
  // ----- State -----
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Filter states
  const [searchName, setSearchName] = useState("");
  const [searchMobile, setSearchMobile] = useState("");
  const [patientType, setPatientType] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(null); // "accept" or "reject"
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper: get day of week from date string like "2026-08-27"
  const getDayOfWeek = (dateStr) => {
    if (!dateStr) return "-";
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return "-";
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[dateObj.getDay()];
  };

  const fetchData = async (page = 0, isSearch = false) => {
    try {
      if (isSearch) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams({
        page: page,
        size: ITEMS_PER_PAGE,
      });

      if (searchName?.trim()) params.append("patientName", searchName.trim());
      if (searchMobile?.trim()) params.append("mobileNo", searchMobile.trim());
      if (patientType?.trim()) params.append("patientType", patientType.trim());

      const response = await getRequest(
        `${PENDING_FOR_REVIEW_OT_LIST}?${params.toString()}`
      );

      if (response?.response?.content) {
        setData(response.response.content);
        setTotalPages(response.response.totalPages);
        setTotalItems(response.response.totalElements);
      } else {
        setData([]);
        setTotalPages(0);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching pending OT reviews:", error);
      showPopup("Failed to fetch data", "error");
      setData([]);
      setTotalPages(0);
      setTotalItems(0);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  // ----- Effects -----
  useEffect(() => {
    fetchData(0, false);
  }, []);

  // ----- Handlers -----
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchData(page - 1, true);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchData(0, true);
  };

  const handleReset = () => {
    setSearchName("");
    setSearchMobile("");
    setPatientType("");
    setCurrentPage(1);
    
    // Fetch without filters
    setSearchLoading(true);
    getRequest(`${PENDING_FOR_REVIEW_OT_LIST}?page=0&size=${ITEMS_PER_PAGE}`)
      .then((response) => {
        if (response?.response?.content) {
          setData(response.response.content);
          setTotalPages(response.response.totalPages);
          setTotalItems(response.response.totalElements);
        } else {
          setData([]);
          setTotalPages(0);
          setTotalItems(0);
        }
      })
      .catch((error) => {
        console.error("Error fetching pending OT reviews:", error);
        showPopup("Failed to reset data", "error");
      })
      .finally(() => {
        setSearchLoading(false);
      });
  };

  // ----- Open modal for accept/reject -----
  const openModal = (record, action) => {
    setSelectedRecord(record);
    setModalAction(action);
    setRemarks("");
    setShowModal(true);
  };

  // ----- Close modal -----
  const closeModal = () => {
    setShowModal(false);
    setSelectedRecord(null);
    setModalAction(null);
    setRemarks("");
  };

  // ----- Confirm action (Accept / Reject) -----
  const handleConfirm = async () => {
    if (modalAction === "reject" && !remarks.trim()) {
      showPopup("Please enter reject remarks.", "error");
      return;
    }

    setIsProcessing(true);
    
    try {
      const flag = modalAction === "accept" ? "A" : "R";
      let apiUrl = `${SAVE_ACCEPT_REJECT_OT}?otBookingRequestId=${selectedRecord.otBookingRequestId}&flag=${flag}`;
      if (modalAction === "reject" && remarks.trim()) {
        apiUrl += `&remark=${encodeURIComponent(remarks.trim())}`;
      }
      
      const response = await postRequest(apiUrl, {});

      if (response?.status === 200) {
        showPopup(
          response?.response || `OT Request ${modalAction === "accept" ? "accepted" : "rejected"} successfully.`,
          "success",
          () => {
            fetchData(currentPage - 1, true);
          }
        );
        closeModal();
      } else {
        showPopup(response?.message || `Failed to ${modalAction} OT request`, "error");
      }
    } catch (error) {
      console.error(`Error processing ${modalAction} action:`, error);
      showPopup(`Failed to ${modalAction} OT request`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // ----- Popup helper -----
  const showPopup = (message, type, onCloseCallback = null) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
        if (onCloseCallback) onCloseCallback();
      },
    });
  };

  const indexOfFirstItem = (currentPage - 1) * ITEMS_PER_PAGE;

  // ============================================================
  // RENDER: MAIN LIST VIEW
  // ============================================================
  return (
    <div className="content-wrapper">
      {loading && <LoadingScreen />}
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Pending for Review at OT</h4>
            </div>
            <div className="card-body">
              {/* Search / Filter Section */}
              <div className="mb-4">
                <div className="row g-3 align-items-end">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Patient Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter patient name"
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Mobile No.</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter mobile no."
                      value={searchMobile}
                      onChange={(e) => setSearchMobile(e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label fw-bold">Patient Type</label>
                    <select
                      className="form-select"
                      value={patientType}
                      onChange={(e) => setPatientType(e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="OPD">OPD</option>
                      <option value="IPD">IPD</option>
                    </select>
                  </div>
                  <div className="col-md-4 d-flex gap-2">
                    <button 
                      className="btn btn-primary" 
                      onClick={handleSearch}
                      disabled={loading || searchLoading}
                    >
                      Search
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      onClick={handleReset}
                      disabled={loading || searchLoading}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Request No.</th>
                      <th>Patient Type</th>
                      <th>UHID / IP No.</th>
                      <th>Patient Name</th>
                      <th>Surgery</th>
                      <th>Surgeon</th>
                      <th>Priority</th>
                      <th>OT Name</th>
                      <th>Requested Date</th>
                      <th>Day</th>
                      <th>Requested Time</th>
                      <th>Requested By</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchLoading ? (
                      <tr>
                        <td colSpan="13" className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p className="mt-2 text-muted">Loading...</p>
                        </td>
                      </tr>
                    ) : data.length > 0 ? (
                      data.map((item, idx) => {
                        const surgeryNames = item.surgeryResponses
                          ?.map((s) => s.surgeryName)
                          .join(", ") || "-";

                        return (
                          <tr key={item.otBookingRequestId}>
                            <td>{indexOfFirstItem + idx + 1}</td>
                            <td>
                              <span
                                className={`badge ${
                                  item.patientType === "OPD" ? "bg-info" : "bg-warning"
                                }`}
                              >
                                {item.patientType}
                              </span>
                            </td>
                            <td>
                              {item.patientType === "OPD"
                                ? item.uhid || "-"
                                : item.admissionNo || "-"}
                            </td>
                            <td>{item.patientName || "-"}</td>
                            <td>{surgeryNames}</td>
                            <td>{item.surgeonName || "-"}</td>
                            <td>
                              <span
                                className={`badge ${
                                  item.priority?.toUpperCase() === "EMERGENCY"
                                    ? "bg-danger"
                                    : item.priority?.toUpperCase() === "URGENT"
                                    ? "bg-warning text-dark"
                                    : "bg-success"
                                }`}
                              >
                                {item.priority || "-"}
                              </span>
                            </td>
                            <td>{item.otName || "-"}</td>
                            <td>{item.requestedDate || "-"}</td>
                            <td>{getDayOfWeek(item.requestedDate)}</td>
                            <td>{item.requestedTime || "-"}</td>
                            <td>{item.requestedBy || "-"}</td>
                            <td className="text-center d-flex">
                              <button
                                className="btn btn-sm btn-success me-1"
                                onClick={() => openModal(item, "accept")}
                                title="Accept"
                              >
                                <i className="fa fa-check"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => openModal(item, "reject")}
                                title="Reject"
                              >
                                <i className="fa fa-times"></i>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="13" className="text-center py-4 text-muted">
                          <i className="fas fa-search fa-2x mb-3"></i>
                          <p>No pending requests found.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {data.length > 0 && totalPages > 0 && (
                <Pagination
                  totalItems={totalItems}
                  itemsPerPage={ITEMS_PER_PAGE}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                  totalPages={totalPages}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== ACCEPT / REJECT MODAL ===== */}
      {showModal && selectedRecord && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalAction === "accept" ? "Accept OT Request" : "Reject OT Request"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                  disabled={isProcessing}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>Patient:</strong> {selectedRecord.patientName} (
                  {selectedRecord.patientType === "OPD"
                    ? selectedRecord.uhid
                    : selectedRecord.admissionNo}
                  )
                </p>
                <p>
                  <strong>Surgery:</strong>{" "}
                  {selectedRecord.surgeryResponses
                    ?.map((s) => s.surgeryName)
                    .join(", ")}
                </p>
                <p>
                  <strong>Surgeon:</strong> {selectedRecord.surgeonName}
                </p>
                <p>
                  <strong>Requested OT:</strong> {selectedRecord.otName}
                </p>
                <p>
                  <strong>Requested Date/Time:</strong> {selectedRecord.requestedDate}{" "}
                  {selectedRecord.requestedTime}
                </p>

                {modalAction === "reject" && (
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Reject Remarks <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      disabled={isProcessing}
                    />
                  </div>
                )}

              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn ${modalAction === "accept" ? "btn-success" : "btn-danger"}`}
                  onClick={handleConfirm}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Processing...
                    </>
                  ) : modalAction === "accept" ? (
                    "Accept"
                  ) : (
                    "Reject"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {popupMessage && (
        <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
      )}
    </div>
  );
};

export default PendingOTReview;