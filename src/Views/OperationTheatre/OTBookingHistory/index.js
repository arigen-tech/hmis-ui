import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import OTTeamAssignment from "../OTTeamAssignment";
import { getRequest, postRequest } from "../../../service/apiService";
import {
  MAS_OT_BOOKING_STATUS_GET_ALL,
  OT_BOOKING_HISTORY,
  MAS_OPERATION_THEATRE_GET_ALL,
  MAS_OT_SCHEDULE_CHANGE_REASON,
  RESCHEDULE_OT_BOOKING,
  CANCEL_OT_BOOKING,
} from "../../../config/apiConfig";
import { FETCH_OT_BOOKING_STATUS, FETCH_OT_BOOKING_HISTORY } from "../../../config/constants";

// Helper to get current date in "YYYY-MM-DD"
const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper to get current time rounded up to next 15-minute interval in "HH:mm"
const getRoundedCurrentTime = (intervalMinutes = 15) => {
  const now = new Date();
  const minutes = now.getMinutes();
  const roundedMinutes = Math.ceil((minutes + 1) / intervalMinutes) * intervalMinutes;
  now.setMinutes(roundedMinutes, 0, 0);
  const hours = String(now.getHours()).padStart(2, "0");
  const mins = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${mins}`;
};

// Helper to format "HH:mm:ss" to "HH:mm" for <input type="time" />
const formatTimeForInput = (t = "") => {
  if (!t || t === "-") return "";
  const parts = t.trim().split(":");
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  }
  return "";
};

// Helper to format "HH:mm" to "HH:mm:ss" for LocalTime backend API
const formatTimeForApi = (t = "") => {
  if (!t) return "";
  const parts = t.trim().split(":");
  if (parts.length === 2) {
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:00`;
  }
  if (parts.length >= 3) {
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:${parts[2].padStart(2, "0")}`;
  }
  return t.trim();
};

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
  const [selectedOtId, setSelectedOtId] = useState("");
  const [selectedReasonId, setSelectedReasonId] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Dynamic dropdowns for modal
  const [otList, setOtList] = useState([]);
  const [changeReasons, setChangeReasons] = useState([]);

  // Team Assignment view
  const [showTeamAssignment, setShowTeamAssignment] = useState(false);
  const [teamAssignmentRecord, setTeamAssignmentRecord] = useState(null);

  // ----- Fetch OT list for dropdown -----
  const fetchOtList = async () => {
    try {
      const res = await getRequest(`${MAS_OPERATION_THEATRE_GET_ALL}/1`);
      if (res?.response && Array.isArray(res.response)) {
        const active = res.response.filter(
          (item) => !item.status || item.status.toLowerCase() === "y"
        );
        setOtList(active);
      } else {
        setOtList([]);
      }
    } catch (error) {
      console.error("Error fetching OT list:", error);
      setOtList([]);
    }
  };

  // ----- Fetch Change Reasons for dropdown -----
  const fetchChangeReasons = async () => {
    try {
      const res = await getRequest(`${MAS_OT_SCHEDULE_CHANGE_REASON}/getAll/1`);
      if (res?.response && Array.isArray(res.response)) {
        const active = res.response.filter(
          (item) => item.status === "Y" || !item.status
        );
        setChangeReasons(active);
      } else {
        setChangeReasons([]);
      }
    } catch (error) {
      console.error("Error fetching OT schedule change reasons:", error);
      setChangeReasons([]);
    }
  };

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
        const normalized = res.response.content.map((item, idx) => {
          // Extract comma-separated surgery names from surgeries array
          const surgeryNames = Array.isArray(item.surgeries) && item.surgeries.length > 0
            ? item.surgeries.map((s) => s.surgeryName).filter(Boolean)
            : item.surgeryName
              ? [item.surgeryName]
              : [];

          const surgeryString = surgeryNames.length > 0
            ? surgeryNames.join(", ")
            : (item.surgery || "-");

          return {
            ...item,
            otBookingId: item.otBookingId,
            otBookingRequestId: item.otBookingRequestId,
            surgeries: item.surgeries || [],
            id: item.otBookingId ?? item.id ?? item.patientId ?? (page * DEFAULT_ITEMS_PER_PAGE + idx + 1),
            bookingNo: item.bookingNo || "-",
            uhid: item.uhidNo || item.uhid || "-",
            uhidNo: item.uhidNo || item.uhid || "-",
            ipNo: item.ipNo || item.admissionNo || "",
            patientType: item.patientType || (item.uhidNo ? "OPD" : "IPD"),
            surgery: surgeryString,
            surgeryName: surgeryString,
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
          };
        });

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
    fetchOtList();
    fetchChangeReasons();
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
    setSelectedReasonId("");

    const matchedOt = otList.find(
      (o) => o.otId === record.otId || o.otName === record.otName
    );
    setSelectedOtId(matchedOt ? String(matchedOt.otId) : (record.otId ? String(record.otId) : ""));

    if (action === "reschedule") {
      setNewDate(getTodayDate());
      setNewStartTime(getRoundedCurrentTime(15));
      setNewEndTime("");
    } else {
      setNewDate(
        record.preferredDate && record.preferredDate !== "-"
          ? record.preferredDate
          : record.date && record.date !== "-"
            ? record.date
            : ""
      );

      const rawStart = record.preferredStartTime || record.time || "";
      const rawEnd = record.preferredEndTime || record.endTime || "";
      setNewStartTime(formatTimeForInput(rawStart));
      setNewEndTime(formatTimeForInput(rawEnd));
    }

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRecord(null);
    setModalAction(null);
    setRemarks("");
    setSelectedOtId("");
    setSelectedReasonId("");
    setNewDate("");
    setNewStartTime("");
    setNewEndTime("");
  };

  const handleStartTimeChange = (val) => {
    setNewStartTime(val);
    setNewEndTime(""); // Reset New End Time when New Start Time is set/changed
  };

  const handleConfirm = async () => {
    if (!selectedReasonId) {
      showPopup(
        modalAction === "reschedule"
          ? "Please select a change reason."
          : "Please select a cancellation reason.",
        "error"
      );
      return;
    }

    if (modalAction === "reschedule") {
      if (!selectedOtId) {
        showPopup("Please select a new OT.", "error");
        return;
      }
      if (!newDate) {
        showPopup("Please select a new date.", "error");
        return;
      }
      if (!newStartTime) {
        showPopup("Please select a new start time.", "error");
        return;
      }
      if (!newEndTime) {
        showPopup("Please select a new end time.", "error");
        return;
      }
      if (newStartTime >= newEndTime) {
        showPopup("New End Time must be after New Start Time.", "error");
        return;
      }
    }

    const otBookingId = selectedRecord?.otBookingId || selectedRecord?.id;
    if (!otBookingId) {
      showPopup("OT Booking ID not found.", "error");
      return;
    }

    setIsProcessing(true);
    try {
      if (modalAction === "reschedule") {
        const payload = {
          otBookingId: Number(otBookingId),
          newOtId: Number(selectedOtId),
          newScheduledDate: newDate,
          newStartTime: formatTimeForApi(newStartTime),
          newEndTime: formatTimeForApi(newEndTime),
          reasonId: Number(selectedReasonId),
          remarks: remarks.trim() || undefined,
        };

        const res = await postRequest(RESCHEDULE_OT_BOOKING, payload);
        if (
          res?.status === 200 ||
          res?.status === 201 ||
          res?.statuss === "success" ||
          res?.message === "success" ||
          res?.response
        ) {
          closeModal();
          showPopup("OT booking rescheduled successfully!", "success");
          fetchBookingHistory(currentPage - 1, appliedFilters.patient, appliedFilters.statusId);
        } else {
          showPopup(
            res?.message || "Failed to nd .",
            "error"
          );
        }
      } else {
        const payload = {
          otBookingId: Number(otBookingId),
          reasonId: Number(selectedReasonId),
          remarks: remarks.trim() || undefined,
        };

        const res = await postRequest(CANCEL_OT_BOOKING, payload);
        if (
          res?.status === 200 ||
          res?.status === 201 ||
          res?.statuss === "success" ||
          res?.message === "success" ||
          res?.response
        ) {
          closeModal();
          showPopup("OT booking cancelled successfully.", "success");
          fetchBookingHistory(currentPage - 1, appliedFilters.patient, appliedFilters.statusId);
        } else {
          showPopup(
            res?.message || "Failed to cancel OT booking.",
            "error"
          );
        }
      }
    } catch (error) {
      console.error("Error processing modal action:", error);
      showPopup(
        error?.message || "Failed to process request. Please try again.",
        "error"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // ----- Team Assignment -----
  const handleViewTeam = (record) => {
    setTeamAssignmentRecord(record);
    setShowTeamAssignment(true);
  };

  const handleTeamSave = (teamData) => {
    const updatedData = data.map((item) => {
      const isMatch = teamAssignmentRecord.otBookingId
        ? item.otBookingId === teamAssignmentRecord.otBookingId
        : item.id === teamAssignmentRecord.id;
      if (isMatch) {
        return {
          ...item,
          ...teamData,
          primarySurgeon: teamData.primarySurgeon || item.surgeon || item.surgeonName,
        };
      }
      return item;
    });
    setData(updatedData);
    setShowTeamAssignment(false);
    setTeamAssignmentRecord(null);
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
                        <tr key={`booking-${item.otBookingId || item.id || idx}`}>
                          <td>{item.bookingNo || item.otBookingId || (currentPage - 1) * DEFAULT_ITEMS_PER_PAGE + idx + 1}</td>
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
          <div className="modal-dialog modal-dialog-centered modal-lg">
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
                <div className="row mb-2">
                  <div className="col-md-6">
                    <p className="mb-1">
                      <strong>Patient:</strong> {selectedRecord.patientName} (
                      {selectedRecord.uhidNo || selectedRecord.uhid || selectedRecord.ipNo || "-"}
                      )
                    </p>
                    <p className="mb-1">
                      <strong>Surgery:</strong> {selectedRecord.surgeryName || selectedRecord.surgery || "-"}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p className="mb-1">
                      <strong>Current OT:</strong> {selectedRecord.otName || "-"}
                    </p>
                    <p className="mb-1">
                      <strong>Current Date/Time:</strong> {formatDateTime(selectedRecord)}
                    </p>
                  </div>
                </div>

                <hr className="my-2" />

                {modalAction === "reschedule" && (
                  <>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold">New OT *</label>
                        <select
                          className="form-select"
                          value={selectedOtId}
                          onChange={(e) => setSelectedOtId(e.target.value)}
                          disabled={isProcessing}
                        >
                          <option value="">Select Operation Theatre</option>
                          {otList.map((ot) => (
                            <option key={ot.otId} value={ot.otId}>
                              {ot.otName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold">Change Reason *</label>
                        <select
                          className="form-select"
                          value={selectedReasonId}
                          onChange={(e) => setSelectedReasonId(e.target.value)}
                          disabled={isProcessing}
                        >
                          <option value="">Select Change Reason</option>
                          {changeReasons
                            .filter((r) => {
                              const app = (r.applicableFor || "BOTH").toUpperCase();
                              return app === "BOTH" || app === "RESCHEDULE";
                            })
                            .map((r) => (
                              <option key={r.reasonId} value={r.reasonId}>
                                {r.reason}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-bold">New Date *</label>
                        <input
                          type="date"
                          min={getTodayDate()}
                          className="form-control"
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          disabled={isProcessing}
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-bold">New Start Time *</label>
                        <input
                          type="time"
                          className="form-control"
                          value={newStartTime}
                          onChange={(e) => handleStartTimeChange(e.target.value)}
                          disabled={isProcessing}
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <label className="form-label fw-bold mb-0">New End Time *</label>
                          {newEndTime && (
                            <button
                              type="button"
                              className="btn btn-link btn-sm p-0 text-decoration-none text-danger"
                              style={{ fontSize: "0.75rem" }}
                              onClick={() => setNewEndTime("")}
                              title="Reset End Time"
                            >
                              <i className="fa fa-undo me-1"></i>Reset
                            </button>
                          )}
                        </div>
                        <input
                          type="time"
                          min={newStartTime || undefined}
                          className="form-control"
                          value={newEndTime}
                          onChange={(e) => setNewEndTime(e.target.value)}
                          disabled={isProcessing}
                        />
                      </div>
                    </div>
                  </>
                )}

                {modalAction === "cancel" && (
                  <div className="mb-3">
                    <label className="form-label fw-bold">Cancellation Reason *</label>
                    <select
                      className="form-select"
                      value={selectedReasonId}
                      onChange={(e) => setSelectedReasonId(e.target.value)}
                      disabled={isProcessing}
                    >
                      <option value="">Select Cancellation Reason</option>
                      {changeReasons
                        .filter((r) => {
                          const app = (r.applicableFor || "BOTH").toUpperCase();
                          return app === "BOTH" || app === "CANCEL";
                        })
                        .map((r) => (
                          <option key={r.reasonId} value={r.reasonId}>
                            {r.reason}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label fw-bold">
                    {modalAction === "reschedule" ? "Reschedule Remarks" : "Remarks"}
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder={
                      modalAction === "reschedule"
                        ? "Enter additional reschedule remarks (optional)..."
                        : "Enter additional cancellation remarks (optional)..."
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
