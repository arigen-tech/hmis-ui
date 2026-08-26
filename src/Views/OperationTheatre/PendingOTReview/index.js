import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const PendingOTReview = () => {
  // ----- State -----
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [patientType, setPatientType] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(null); // "accept" or "reject"
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper: get day of week from date string like "28-Aug-2026"
  const getDayOfWeek = (dateStr) => {
    const parts = dateStr.split("-");
    const day = parseInt(parts[0]);
    const monthMap = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
    const month = monthMap[parts[1]];
    const year = parseInt(parts[2]);
    const dateObj = new Date(year, month, day);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[dateObj.getDay()];
  };

  // ----- Dummy data (with Surgeon field added) -----
  const dummyData = [
    {
      id: 1,
      patientType: "OPD",
      uhid: "OPD/26/00125",
      ipNo: null,
      patientName: "Rajesh Kumar",
      ageGender: "52 / Male",
      surgery: "Total Knee Replacement",
      surgeon: "Dr. Sharma",
      priority: "Elective",
      requestedOT: "Main OT-01",
      requestedDate: "28-Aug-2026",
      requestedTime: "10:00 AM",
      requestedBy: "Dr. Sharma",
      requestedOn: "25-Aug-2026 09:30 AM",
      department: "Orthopaedics",
      status: "REQUESTED",
    },
    {
      id: 2,
      patientType: "IPD",
      uhid: null,
      ipNo: "IPD/26/00128",
      patientName: "Amit Kumar",
      ageGender: "45 / Male",
      surgery: "Hernia Repair",
      surgeon: "Dr. Gupta",
      priority: "Urgent",
      requestedOT: "Main OT-02",
      requestedDate: "28-Aug-2026",
      requestedTime: "02:00 PM",
      requestedBy: "Dr. Gupta",
      requestedOn: "26-Aug-2026 11:15 AM",
      department: "General Surgery",
      status: "REQUESTED",
    },
    {
      id: 3,
      patientType: "OPD",
      uhid: "OPD/26/00131",
      ipNo: null,
      patientName: "Sunita Devi",
      ageGender: "38 / Female",
      surgery: "CABG",
      surgeon: "Dr. Verma",
      priority: "Emergency",
      requestedOT: "Cardio OT",
      requestedDate: "29-Aug-2026",
      requestedTime: "09:00 AM",
      requestedBy: "Dr. Verma",
      requestedOn: "26-Aug-2026 08:45 AM",
      department: "Cardiology",
      status: "REQUESTED",
    },
    {
      id: 4,
      patientType: "IPD",
      uhid: null,
      ipNo: "IPD/26/00135",
      patientName: "Neha Singh",
      ageGender: "31 / Female",
      surgery: "Laparoscopic Cholecystectomy",
      surgeon: "Dr. Mehta",
      priority: "Elective",
      requestedOT: "Main OT-01",
      requestedDate: "30-Aug-2026",
      requestedTime: "11:30 AM",
      requestedBy: "Dr. Mehta",
      requestedOn: "27-Aug-2026 10:00 AM",
      department: "General Surgery",
      status: "REQUESTED",
    },
    {
      id: 5,
      patientType: "OPD",
      uhid: "OPD/26/00142",
      ipNo: null,
      patientName: "Vikram Singh",
      ageGender: "60 / Male",
      surgery: "Prostatectomy",
      surgeon: "Dr. Rao",
      priority: "Urgent",
      requestedOT: "Main OT-03",
      requestedDate: "30-Aug-2026",
      requestedTime: "03:00 PM",
      requestedBy: "Dr. Rao",
      requestedOn: "27-Aug-2026 02:20 PM",
      department: "Urology",
      status: "REQUESTED",
    },
  ];

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
      (item.uhid && item.uhid.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.ipNo && item.ipNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.surgery.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.surgeon.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = patientType ? item.patientType === patientType : true;
    return matchSearch && matchType;
  });

  // ----- Pagination slice -----
  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  // ----- Handlers -----
  const handlePageChange = (page) => setCurrentPage(page);

  const handleSearch = () => setCurrentPage(1);

  const handleReset = () => {
    setSearchQuery("");
    setPatientType("");
    setCurrentPage(1);
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
  const handleConfirm = () => {
    if (modalAction === "reject" && !remarks.trim()) {
      showPopup("Please enter reject remarks.", "error");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      // Simulate API call
      const updatedData = data.map((item) => {
        if (item.id === selectedRecord.id) {
          if (modalAction === "accept") {
            return {
              ...item,
              status: "ACCEPTED",
              bookingStatus: "SCHEDULED",
            };
          } else {
            return {
              ...item,
              status: "REJECTED",
              rejectRemarks: remarks,
            };
          }
        }
        return item;
      });
      setData(updatedData);
      setIsProcessing(false);
      closeModal();
      showPopup(
        modalAction === "accept"
          ? "OT Request accepted successfully!"
          : "OT Request rejected successfully.",
        "success"
      );
    }, 500);
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
                    <label className="form-label fw-bold">Search</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Name, UHID, IP No., Surgery or Surgeon"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
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
                  <div className="col-md-2 d-flex gap-2">
                    <button className="btn btn-primary" onClick={handleSearch}>
                      Search
                    </button>
                    <button className="btn btn-secondary" onClick={handleReset}>
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
                    {currentItems.length > 0 ? (
                      currentItems.map((item, idx) => (
                        <tr key={item.id}>
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
                          <td>{item.patientType === "OPD" ? item.uhid : item.ipNo}</td>
                          <td>{item.patientName}</td>
                          <td>{item.surgery}</td>
                          <td>{item.surgeon}</td>
                          <td>
                            <span
                              className={`badge ${
                                item.priority === "Emergency"
                                  ? "bg-danger"
                                  : item.priority === "Urgent"
                                  ? "bg-warning text-dark"
                                  : "bg-success"
                              }`}
                            >
                              {item.priority}
                            </span>
                          </td>
                          <td>{item.requestedOT}</td>
                          <td>{item.requestedDate}</td>
                          <td>{getDayOfWeek(item.requestedDate)}</td>
                          <td>{item.requestedTime}</td>
                          <td>{item.requestedBy}</td>
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
                      ))
                    ) : (
                      <tr>
                        <td colSpan="12" className="text-center">
                          No pending requests found.
                        </td>
                      </tr>
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
                    : selectedRecord.ipNo}
                  )
                </p>
                <p>
                  <strong>Surgery:</strong> {selectedRecord.surgery}
                </p>
                <p>
                  <strong>Surgeon:</strong> {selectedRecord.surgeon}
                </p>
                <p>
                  <strong>Requested OT:</strong> {selectedRecord.requestedOT}
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

                {modalAction === "accept" && (
                  <div className="mb-3">
                    <label className="form-label fw-bold">Remarks (Optional)</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Any additional notes..."
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