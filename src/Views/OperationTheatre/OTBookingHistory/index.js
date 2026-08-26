// OTBookingHistory/OTBookingHistory.js
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import OTTeamAssignment from "../OTTeamAssignment"; // import the separate component

const OTBookingHistory = () => {
  // ----- State -----
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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

  // ----- Dummy data -----
  const dummyData = [
    {
      id: 1,
      patientName: "Rajesh Kumar",
      uhid: "OPD/26/00125",
      ipNo: null,
      patientType: "OPD",
      surgery: "Total Knee Replacement",
      priority: "Elective",
      otName: "Main OT-01",
      date: "2026-08-28",
      time: "10:00 AM",
      endTime: "12:00 PM",
      status: "SCHEDULED",
      department: "Orthopaedics",
      surgeon: "Dr. Sharma",
      pacStatus: "Cleared",
      primarySurgeon: "Dr. Sharma",
      assistantSurgeon: "Dr. Verma",
      anaesthetist: "Dr. Kumar",
      assistantAnaesthetist: "",
      scrubNurse: "Nurse Priya",
      circulatingNurse: "Nurse Anita",
      otTechnician: "Ravi Kumar",
    },
    // ... more dummy records as before (keep all 6 entries)
    // (I'll include the full set for completeness)
    {
      id: 2,
      patientName: "Amit Kumar",
      uhid: null,
      ipNo: "IPD/26/00128",
      patientType: "IPD",
      surgery: "Hernia Repair",
      priority: "Urgent",
      otName: "Main OT-02",
      date: "2026-08-28",
      time: "02:00 PM",
      endTime: "04:00 PM",
      status: "SCHEDULED",
      department: "General Surgery",
      surgeon: "Dr. Gupta",
      pacStatus: "Pending",
      primarySurgeon: "Dr. Gupta",
      assistantSurgeon: "",
      anaesthetist: "",
      assistantAnaesthetist: "",
      scrubNurse: "",
      circulatingNurse: "",
      otTechnician: "",
    },
    {
      id: 3,
      patientName: "Sunita Devi",
      uhid: "OPD/26/00131",
      ipNo: null,
      patientType: "OPD",
      surgery: "CABG",
      priority: "Emergency",
      otName: "Cardio OT",
      date: "2026-08-29",
      time: "09:00 AM",
      endTime: "11:00 AM",
      status: "COMPLETED",
      department: "Cardiology",
      surgeon: "Dr. Verma",
      pacStatus: "Cleared",
      primarySurgeon: "Dr. Verma",
      assistantSurgeon: "Dr. Patel",
      anaesthetist: "Dr. Reddy",
      assistantAnaesthetist: "Dr. Joshi",
      scrubNurse: "Nurse Sneha",
      circulatingNurse: "Nurse Rani",
      otTechnician: "Suresh",
    },
    {
      id: 4,
      patientName: "Neha Singh",
      uhid: null,
      ipNo: "IPD/26/00135",
      patientType: "IPD",
      surgery: "Laparoscopic Cholecystectomy",
      priority: "Elective",
      otName: "Main OT-01",
      date: "2026-08-30",
      time: "11:30 AM",
      endTime: "01:30 PM",
      status: "CANCELLED",
      department: "General Surgery",
      surgeon: "Dr. Mehta",
      pacStatus: "Not Required",
      primarySurgeon: "Dr. Mehta",
      assistantSurgeon: "",
      anaesthetist: "",
      assistantAnaesthetist: "",
      scrubNurse: "",
      circulatingNurse: "",
      otTechnician: "",
    },
    {
      id: 5,
      patientName: "Vikram Singh",
      uhid: "OPD/26/00142",
      ipNo: null,
      patientType: "OPD",
      surgery: "Prostatectomy",
      priority: "Urgent",
      otName: "Main OT-03",
      date: "2026-08-30",
      time: "03:00 PM",
      endTime: "05:00 PM",
      status: "SCHEDULED",
      department: "Urology",
      surgeon: "Dr. Rao",
      pacStatus: "Pending",
      primarySurgeon: "Dr. Rao",
      assistantSurgeon: "",
      anaesthetist: "",
      assistantAnaesthetist: "",
      scrubNurse: "",
      circulatingNurse: "",
      otTechnician: "",
    },
    {
      id: 6,
      patientName: "Pooja Sharma",
      uhid: null,
      ipNo: "IPD/26/00150",
      patientType: "IPD",
      surgery: "Appendectomy",
      priority: "Emergency",
      otName: "Main OT-02",
      date: "2026-08-31",
      time: "08:00 AM",
      endTime: "10:00 AM",
      status: "SCHEDULED",
      department: "General Surgery",
      surgeon: "Dr. Gupta",
      pacStatus: "Cleared",
      primarySurgeon: "Dr. Gupta",
      assistantSurgeon: "Dr. Mehta",
      anaesthetist: "Dr. Singh",
      assistantAnaesthetist: "",
      scrubNurse: "Nurse Kavita",
      circulatingNurse: "Nurse Priya",
      otTechnician: "Mahesh",
    },
  ];

  const otOptions = ["Main OT-01", "Main OT-02", "Main OT-03", "Cardio OT"];
  const timeOptions = ["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"];

  // ----- Effects -----
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setData(dummyData);
      setTotalItems(dummyData.length);
      setTotalPages(Math.ceil(dummyData.length / DEFAULT_ITEMS_PER_PAGE));
      setLoading(false);
    }, 300);
  }, []);

  // ----- Filtered data -----
  const filteredData = data.filter((item) => {
    const matchSearch =
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.uhid && item.uhid.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.ipNo && item.ipNo.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  // ----- Pagination -----
  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  // ----- Handlers -----
  const handlePageChange = (page) => setCurrentPage(page);
  const handleSearch = () => setCurrentPage(1);
  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  // ----- Open modals -----
  const openModal = (record, action) => {
    setSelectedRecord(record);
    setModalAction(action);
    setRemarks("");
    setNewOT(record.otName);
    setNewDate(record.date);
    setNewTime(record.time);
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
        if (item.id === selectedRecord.id) {
          if (modalAction === "reschedule") {
            return { ...item, otName: newOT, date: newDate, time: newTime, status: "RESCHEDULED" };
          } else {
            return { ...item, status: "CANCELLED" };
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
      if (item.id === teamAssignmentRecord.id) {
        return {
          ...item,
          primarySurgeon: teamData.primarySurgeon || item.surgeon,
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
              {/* Search */}
              <div className="mb-4">
                <div className="row g-3 align-items-end">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Patient Name / UHID / IP No.</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label fw-bold">Status</label>
                    <select
                      className="form-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="RESCHEDULED">Rescheduled</option>
                    </select>
                  </div>
                  <div className="col-md-3 d-flex gap-2">
                    <button className="btn btn-primary" onClick={handleSearch}>Search</button>
                    <button className="btn btn-secondary" onClick={handleReset}>Reset</button>
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
                      <th>OT Team</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((item, idx) => (
                        <tr key={item.id}>
                          <td>{indexOfFirstItem + idx + 1}</td>
                          <td>{item.patientType === "OPD" ? item.uhid : item.ipNo}</td>
                          <td>{item.patientName}</td>
                          <td>{item.department}</td>
                          <td>{item.surgery}</td>
                          <td>{item.otName}</td>
                          <td>{`${item.date} ${item.time}`}</td>
                          <td>
                            <span className={`badge ${item.pacStatus === "Cleared" ? "bg-success" : item.pacStatus === "Pending" ? "bg-warning text-dark" : "bg-secondary"}`}>
                              {item.pacStatus || "N/A"}
                            </span>
                          </td>
                          <td>
                            <button className="btn btn-sm btn-info" onClick={() => handleViewTeam(item)} title="View Team">
                              <i className="fa fa-users"></i> View
                            </button>
                          </td>
                          <td className="text-center">
                            {item.status === "SCHEDULED" ? (
                              <>
                                <button className="btn btn-sm btn-warning me-1" onClick={() => openModal(item, "reschedule")} title="Reschedule">
                                  <i className="fa fa-calendar"></i>
                                </button>
                                <button className="btn btn-sm btn-danger" onClick={() => openModal(item, "cancel")} title="Cancel">
                                  <i className="fa fa-times"></i>
                                </button>
                              </>
                            ) : <span className="text-muted">—</span>}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="10" className="text-center">No booking records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                totalItems={filteredData.length}
                itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===== RESCHEDULE / CANCEL MODAL ===== */}
      {showModal && selectedRecord && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{modalAction === "reschedule" ? "Reschedule OT Booking" : "Cancel OT Booking"}</h5>
                <button type="button" className="btn-close" onClick={closeModal} disabled={isProcessing}></button>
              </div>
              <div className="modal-body">
                <p><strong>Patient:</strong> {selectedRecord.patientName} ({selectedRecord.patientType === "OPD" ? selectedRecord.uhid : selectedRecord.ipNo})</p>
                <p><strong>Surgery:</strong> {selectedRecord.surgery}</p>
                <p><strong>Current OT:</strong> {selectedRecord.otName}</p>
                <p><strong>Current Date/Time:</strong> {selectedRecord.date} {selectedRecord.time}</p>

                {modalAction === "reschedule" && (
                  <>
                    <div className="mb-3">
                      <label className="form-label fw-bold">New OT *</label>
                      <select className="form-select" value={newOT} onChange={(e) => setNewOT(e.target.value)} disabled={isProcessing}>
                        {otOptions.map((ot) => <option key={ot} value={ot}>{ot}</option>)}
                      </select>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold">New Date *</label>
                        <input type="date" className="form-control" value={newDate} onChange={(e) => setNewDate(e.target.value)} disabled={isProcessing} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold">New Time *</label>
                        <select className="form-select" value={newTime} onChange={(e) => setNewTime(e.target.value)} disabled={isProcessing}>
                          {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div className="mb-3">
                  <label className="form-label fw-bold">{modalAction === "reschedule" ? "Reschedule Remarks" : "Cancellation Reason"} *</label>
                  <textarea className="form-control" rows="3" value={remarks} onChange={(e) => setRemarks(e.target.value)}
                    placeholder={modalAction === "reschedule" ? "Enter reason for reschedule..." : "Enter reason for cancellation..."} disabled={isProcessing} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeModal} disabled={isProcessing}>Cancel</button>
                <button className={`btn ${modalAction === "reschedule" ? "btn-warning" : "btn-danger"}`} onClick={handleConfirm} disabled={isProcessing}>
                  {isProcessing ? <><span className="spinner-border spinner-border-sm me-2" />Processing...</> : (modalAction === "reschedule" ? "Reschedule" : "Cancel Booking")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {popupMessage && <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />}
    </div>
  );
};

export default OTBookingHistory;