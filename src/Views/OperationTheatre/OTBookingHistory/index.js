import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import OTTeamAssignment from "../OTTeamAssignment";
import { getRequest } from "../../../service/apiService";
import { MAS_OT_BOOKING_STATUS_GET_ALL, OT_BOOKING_HISTORY } from "../../../config/apiConfig";
import { FETCH_OT_BOOKING_STATUS, FETCH_OT_BOOKING_HISTORY } from "../../../config/constants";

const OTBookingHistory = () => {
  // ----- State -----
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [statusOptions, setStatusOptions] = useState([]);
  const [appliedFilters, setAppliedFilters] = useState({ patient: "", statusId: "" });

  // Reschedule / Cancel modal
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [newOT, setNewOT] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Team Assignment view
  const [showTeamAssignment, setShowTeamAssignment] = useState(false);
  const [teamAssignmentRecord, setTeamAssignmentRecord] = useState(null);

  const otOptions = ["Operation Theatre 1", "Main OT-01", "Main OT-02", "Main OT-03", "Cardio OT"];
  const timeOptions = [
    "08:00 AM",
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "16:00:00",
  ];

  // ----- Fetch Dropdown Statuses -----
  const fetchStatusOptions = async () => {
    try {
      setStatusLoading(true);
      const res = await getRequest(MAS_OT_BOOKING_STATUS_GET_ALL);
      if (res?.response && Array.isArray(res.response)) {
        setStatusOptions(res.response.filter((item) => item.status === "Y" || !item.status));
      } else {
        setStatusOptions([]);
      }
    } catch (error) {
      console.error("Error fetching OT booking statuses:", error);
      showPopup(FETCH_OT_BOOKING_STATUS, "error");
    } finally {
      setStatusLoading(false);
    }
  };

  // ----- Fetch Booking History (Patient list) -----
  const fetchBookingHistory = async (page = 0, patientQuery = appliedFilters.patient, statusIdQuery = appliedFilters.statusId) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page,
        size: DEFAULT_ITEMS_PER_PAGE,
      });

      if (patientQuery && patientQuery.trim()) {
        params.append("patient", patientQuery.trim());
      }
      if (statusIdQuery !== "" && statusIdQuery !== undefined && statusIdQuery !== null) {
        params.append("statusId", statusIdQuery);
      }

      const res = await getRequest(`${OT_BOOKING_HISTORY}?${params.toString()}`);

      if (res?.response?.content) {
        // otBookingRequestDtId is unique for each detail/row
        const seenDtIds = new Set();
        const uniqueItems = [];

        res.response.content.forEach((item) => {
          const key = item.otBookingRequestDtId ?? item.otBookingId ?? item.id;
          if (key !== undefined && key !== null) {
            if (!seenDtIds.has(key)) {
              seenDtIds.add(key);
              uniqueItems.push(item);
            }
          } else {
            uniqueItems.push(item);
          }
        });

        const normalized = uniqueItems.map((item, idx) => ({
          ...item,
          otBookingRequestDtId: item.otBookingRequestDtId,
          otBookingRequestId: item.otBookingRequestId,
          otBookingId: item.otBookingId,
          id: item.otBookingRequestDtId || item.otBookingId || item.bookingId || item.id || item.patientId || (page * DEFAULT_ITEMS_PER_PAGE + idx + 1),
          bookingNo: item.bookingNo || "-",
          uhid: item.uhidNo || item.uhid || "-",
          uhidNo: item.uhidNo || item.uhid || "-",
          ipNo: item.ipNo || item.admissionNo || "",
          patientType: item.patientType || (item.uhidNo ? "OPD" : "IPD"),
          surgery: item.surgeryName || item.surgery || "-",
          surgeryName: item.surgeryName || item.surgery || "-",
          department: item.departmentName || item.department || "-",
          departmentName: item.departmentName || item.department || "-",
          date: item.preferredDate || item.date || "-",
          preferredDate: item.preferredDate || item.date || "-",
          time: item.preferredStartTime || item.time || "-",
          preferredStartTime: item.preferredStartTime || item.time || "-",
          endTime: item.preferredEndTime || item.endTime || "",
          preferredEndTime: item.preferredEndTime || item.endTime || "",
          status: item.statusCode || item.statusName?.toUpperCase() || item.status || "",
          statusName: item.statusName || item.status || "-",
          bookingStatusId: item.bookingStatusId,
          surgeon: item.surgeonName || item.surgeon || "-",
          surgeonName: item.surgeonName || item.surgeon || "-",
          primarySurgeon: item.surgeonName || item.primarySurgeon || item.surgeon || "-",
          pacStatus:
            item.pacStatus ||
            (item.pacRequired === "N"
              ? "Not Required"
              : item.pacDone === "Y"
                ? "Cleared"
                : item.pacRequired === "Y"
                  ? "Pending"
                  : "N/A"),
        }));

        setData(normalized);
        setTotalPages(res.response.totalPages || 0);
        setTotalItems(res.response.totalElements || 0);
      } else {
        setData([]);
        setTotalPages(0);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching OT booking history:", error);
      showPopup(FETCH_OT_BOOKING_HISTORY, "error");
      setData([]);
      setTotalPages(0);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  // ----- Effects -----
  useEffect(() => {
    fetchStatusOptions();
    fetchBookingHistory(0, "", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- Handlers -----
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchBookingHistory(page - 1, appliedFilters.patient, appliedFilters.statusId);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    const newFilters = { patient: searchQuery, statusId: statusFilter };
    setAppliedFilters(newFilters);
    fetchBookingHistory(0, searchQuery, statusFilter);
  };

  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("");
    setCurrentPage(1);
    const resetFilters = { patient: "", statusId: "" };
    setAppliedFilters(resetFilters);
    fetchBookingHistory(0, "", "");
  };

  // ----- Helper formatters -----
  const formatDateTime = (item) => {
    const date = item.preferredDate || item.date || "";
    const startTime = item.preferredStartTime || item.time || "";
    const endTime = item.preferredEndTime || item.endTime || "";
    if (!date && !startTime) return "-";
    if (startTime && endTime) {
      return `${date} (${startTime} - ${endTime})`.trim();
    }
    return `${date} ${startTime}`.trim();
  };

  const getPacBadge = (item) => {
    const pacText = item.pacStatus || "N/A";
    let badgeClass = "bg-secondary";
    if (pacText === "Cleared") badgeClass = "bg-success";
    else if (pacText === "Pending") badgeClass = "bg-warning text-dark";
    else if (pacText === "Not Required") badgeClass = "bg-info";

    return <span className={`badge ${badgeClass}`}>{pacText}</span>;
  };

  const getStatusBadge = (item) => {
    const name = item.statusName || item.statusCode || item.status || "-";
    const code = (item.statusCode || item.statusName || item.status || "").toUpperCase();
    let badgeClass = "bg-secondary";
    if (code === "SCHEDULED") badgeClass = "bg-primary";
    else if (code === "COMPLETED") badgeClass = "bg-success";
    else if (code === "CANCELLED" || code === "REJECTED") badgeClass = "bg-danger";
    else if (code.includes("PROGRESS")) badgeClass = "bg-warning text-dark";
    else if (code.includes("OT")) badgeClass = "bg-info";
    else if (code === "REQUESTED") badgeClass = "bg-warning text-dark";

    return <span className={`badge ${badgeClass}`}>{name}</span>;
  };

  // ----- Open modals -----
  const openModal = (record, action) => {
    setSelectedRecord(record);
    setModalAction(action);
    setRemarks("");
    setNewOT(record.otName || otOptions[0]);
    setNewDate(record.preferredDate || record.date || "");
    setNewTime(record.preferredStartTime || record.time || timeOptions[0]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRecord(null);
    setModalAction(null);
    setRemarks("");
    setNewOT("");
    setNewDate("");
    setNewTime("");
  };

  const handleConfirm = () => {
    if (!remarks.trim()) {
      showPopup("Please enter remarks.", "error");
      return;
    }
    if (modalAction === "reschedule" && (!newOT || !newDate || !newTime)) {
      showPopup("Please select new OT, date and time.", "error");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const updatedData = data.map((item) => {
        const isMatch = selectedRecord.otBookingRequestDtId
          ? item.otBookingRequestDtId === selectedRecord.otBookingRequestDtId
          : selectedRecord.otBookingId
            ? item.otBookingId === selectedRecord.otBookingId
            : item.id === selectedRecord.id;
        if (isMatch) {
          if (modalAction === "reschedule") {
            return {
              ...item,
              otName: newOT,
              date: newDate,
              preferredDate: newDate,
              time: newTime,
              preferredStartTime: newTime,
              status: "RESCHEDULED",
              statusName: "Rescheduled",
            };
          } else {
            return { ...item, status: "CANCELLED", statusName: "Cancelled" };
          }
        }
        return item;
      });
      setData(updatedData);
      setIsProcessing(false);
      closeModal();
      showPopup(
        modalAction === "reschedule" ? "OT booking rescheduled successfully!" : "OT booking cancelled successfully.",
        "success"
      );
    }, 500);
  };

  // ----- Team Assignment -----
  const handleViewTeam = (record) => {
    setTeamAssignmentRecord(record);
    setShowTeamAssignment(true);
  };

  const handleTeamSave = (teamData) => {
    const updatedData = data.map((item) => {
      const isMatch = teamAssignmentRecord.otBookingRequestDtId
        ? item.otBookingRequestDtId === teamAssignmentRecord.otBookingRequestDtId
        : teamAssignmentRecord.otBookingId
          ? item.otBookingId === teamAssignmentRecord.otBookingId
          : item.id === teamAssignmentRecord.id;
      if (isMatch) {
        return {
          ...item,
          primarySurgeon: teamData.primarySurgeon || item.surgeon || item.surgeonName,
          assistantSurgeon: teamData.assistantSurgeon,
          anaesthetist: teamData.anaesthetist,
          assistantAnaesthetist: teamData.assistantAnaesthetist,
          scrubNurse: teamData.scrubNurse,
          circulatingNurse: teamData.circulatingNurse,
          otTechnician: teamData.otTechnician,
        };
      }
      return item;
    });
    setData(updatedData);
    setShowTeamAssignment(false);
    setTeamAssignmentRecord(null);
    showPopup("OT Team assigned successfully!", "success");
  };

  const handleCloseTeamAssignment = () => {
    setShowTeamAssignment(false);
    setTeamAssignmentRecord(null);
  };

  // ----- Popup -----
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

  // ================================================================
  // RENDER: Team Assignment View (if active)
  // ================================================================
  if (showTeamAssignment && teamAssignmentRecord) {
    return (
      <OTTeamAssignment
        bookingRecord={teamAssignmentRecord}
        onClose={handleCloseTeamAssignment}
        onSave={handleTeamSave}
      />
    );
  }

  // ================================================================
  // RENDER: Main List View
  // ================================================================
  return (
    <div className="content-wrapper">
      {loading && <LoadingScreen />}
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">OT Booking History</h4>
            </div>
            <div className="card-body">
              {/* Search & Filters */}
              <div className="mb-4">
                <div className="row g-3 align-items-end">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Patient Name / UHID</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by Patient or UHID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSearch();
                        }
                      }}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label fw-bold">Status</label>
                    <select
                      className="form-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      disabled={statusLoading}
                    >
                      <option value="">All</option>
                      {statusOptions.map((st) => (
                        <option key={st.bookingStatusId} value={st.bookingStatusId}>
                          {st.statusName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3 d-flex gap-2">
                    <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
                      <i className="fa fa-search me-1"></i> Search
                    </button>
                    <button className="btn btn-secondary" onClick={handleReset} disabled={loading}>
                      <i className="fa fa-refresh me-1"></i> Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Booking No.</th>
                      <th>UHID / IP No.</th>
                      <th>Patient</th>
                      <th>Department</th>
                      <th>Surgery</th>
                      <th>OT</th>
                      <th>Date / Time</th>
                      <th>PAC</th>
                      <th>Status</th>
                      <th>OT Team</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.length > 0 ? (
                      data.map((item, idx) => (
                        <tr key={`booking-dt-${item.otBookingRequestDtId || item.otBookingId || item.id || idx}`}>
                          <td>{item.bookingNo || item.otBookingId || item.otBookingRequestDtId || (currentPage - 1) * DEFAULT_ITEMS_PER_PAGE + idx + 1}</td>
                          <td>{item.uhidNo || (item.patientType === "OPD" ? item.uhid : item.ipNo) || "-"}</td>
                          <td>{item.patientName || "-"}</td>
                          <td>{item.departmentName || item.department || "-"}</td>
                          <td>{item.surgeryName || item.surgery || "-"}</td>
                          <td>{item.otName || "-"}</td>
                          <td>{formatDateTime(item)}</td>
                          <td>{getPacBadge(item)}</td>
                          <td>{getStatusBadge(item)}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => handleViewTeam(item)}
                              title="View Team"
                            >
                              <i className="fa fa-users"></i> View
                            </button>
                          </td>
                          <td className="text-center">
                            {item.status === "SCHEDULED" ||
                            item.statusCode === "SCHEDULED" ||
                            item.statusName?.toUpperCase() === "SCHEDULED" ||
                            item.bookingStatusId === 3 ? (
                              <>
                                <button
                                  className="btn btn-sm btn-warning me-1"
                                  onClick={() => openModal(item, "reschedule")}
                                  title="Reschedule"
                                >
                                  <i className="fa fa-calendar"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => openModal(item, "cancel")}
                                  title="Cancel"
                                >
                                  <i className="fa fa-times"></i>
                                </button>
                              </>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="11" className="text-center py-4 text-muted">
                          <i className="fa fa-search fa-2x mb-3 d-block"></i>
                          No booking records found.
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
                  totalPages={totalPages}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== RESCHEDULE / CANCEL MODAL ===== */}
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
                  {modalAction === "reschedule" ? "Reschedule OT Booking" : "Cancel OT Booking"}
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
                  {selectedRecord.uhidNo || selectedRecord.uhid || selectedRecord.ipNo || "-"}
                  )
                </p>
                <p>
                  <strong>Surgery:</strong> {selectedRecord.surgeryName || selectedRecord.surgery || "-"}
                </p>
                <p>
                  <strong>Current OT:</strong> {selectedRecord.otName || "-"}
                </p>
                <p>
                  <strong>Current Date/Time:</strong> {formatDateTime(selectedRecord)}
                </p>

                {modalAction === "reschedule" && (
                  <>
                    <div className="mb-3">
                      <label className="form-label fw-bold">New OT *</label>
                      <select
                        className="form-select"
                        value={newOT}
                        onChange={(e) => setNewOT(e.target.value)}
                        disabled={isProcessing}
                      >
                        {otOptions.map((ot) => (
                          <option key={ot} value={ot}>
                            {ot}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold">New Date *</label>
                        <input
                          type="date"
                          className="form-control"
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          disabled={isProcessing}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold">New Time *</label>
                        <select
                          className="form-select"
                          value={newTime}
                          onChange={(e) => setNewTime(e.target.value)}
                          disabled={isProcessing}
                        >
                          {timeOptions.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div className="mb-3">
                  <label className="form-label fw-bold">
                    {modalAction === "reschedule" ? "Reschedule Remarks" : "Cancellation Reason"} *
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder={
                      modalAction === "reschedule"
                        ? "Enter reason for reschedule..."
                        : "Enter reason for cancellation..."
                    }
                    disabled={isProcessing}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeModal} disabled={isProcessing}>
                  Cancel
                </button>
                <button
                  className={`btn ${modalAction === "reschedule" ? "btn-warning" : "btn-danger"}`}
                  onClick={handleConfirm}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Processing...
                    </>
                  ) : modalAction === "reschedule" ? (
                    "Reschedule"
                  ) : (
                    "Cancel Booking"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default OTBookingHistory;
