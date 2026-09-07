import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

// Current logged-in user for the auto-filled "Cleared By" field (dummy - no auth wiring)
const CURRENT_USER = "Nurse Priya";

const PACClearance = () => {
  // ----- State -----
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Clear PAC modal states
  const [showClearModal, setShowClearModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [clearRemarks, setClearRemarks] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // ----- Dummy data (PAC Pending List - Updated Grid) -----
  // Both OPD and IPD requests appear together; OPD shows UHID with no
  // Ward/Bed, IPD shows IP No. with Ward/Bed - matching the source table
  // (ot_booking joined with ot_booking_request_hd/dt + Patient/IPD/Visit).
  const dummyData = [
    {
      id: 1,
      uhidOrIp: "UHID/00125",
      patientName: "Rajesh Kumar",
      type: "OPD",
      department: "Orthopaedics",
      surgery: "Total Knee Replacement",
      surgeon: "Dr. Sharma",
      ot: "OT-01",
      scheduledDateTime: "20-Aug-2026 10:00",
      wardBed: null,
    },
    {
      id: 2,
      uhidOrIp: "IPD/26/00128",
      patientName: "Amit Kumar",
      type: "IPD",
      department: "General Surgery",
      surgery: "Hernia Repair",
      surgeon: "Dr. Gupta",
      ot: "OT-02",
      scheduledDateTime: "20-Aug-2026 14:00",
      wardBed: "Surgical Ward / B-12",
    },
    {
      id: 3,
      uhidOrIp: "IPD/26/00135",
      patientName: "Sunita Devi",
      type: "IPD",
      department: "Gynaecology",
      surgery: "Hysterectomy",
      surgeon: "Dr. Verma",
      ot: "OT-03",
      scheduledDateTime: "21-Aug-2026 09:00",
      wardBed: "Gynae Ward / C-05",
    },
  ];

  // ----- Effects -----
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setData(dummyData);
      setLoading(false);
    }, 300);
  }, []);

  // ----- Filtered data -----
  const filteredData = data.filter((item) => {
    const matchSearch =
      item.uhidOrIp.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.surgery.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.surgeon.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter ? item.type === typeFilter : true;
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
    setTypeFilter("");
    setCurrentPage(1);
  };

  const getCurrentDateTimeLabel = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  // ----- Open modal for Clear PAC -----
  const openClearModal = (record) => {
    setSelectedRecord(record);
    setClearRemarks("");
    setShowClearModal(true);
  };

  // ----- Close modal -----
  const closeClearModal = () => {
    setShowClearModal(false);
    setSelectedRecord(null);
    setClearRemarks("");
  };

  // ----- Confirm action (Clear PAC) -----
  // Marks is_pac_done = 'Y' on the backend equivalent - the record then
  // drops off this Pending List, same as the "patient automatically
  // disappears from the PAC Pending List" rule.
  const handleConfirmClear = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const updatedData = data.filter((item) => item.id !== selectedRecord.id);
      setData(updatedData);
      setIsProcessing(false);
      closeClearModal();
      showPopup("PAC cleared successfully!", "success");
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
              <h4 className="card-title p-2 mb-0">PAC Pending List</h4>
            </div>
            <div className="card-body">
              {/* Search / Filter Section */}
              <div className="mb-4">
                <div className="row g-3 align-items-end">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">UHID/IP No.</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="UHID/IP No., Patient, Surgery or Surgeon"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label fw-bold">Type</label>
                    <select
                      className="form-select"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
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
                      <th>UHID / IP No.</th>
                      <th>Patient Name</th>
                      <th>Type</th>
                      <th>Department</th>
                      <th>Surgery</th>
                      <th>Surgeon</th>
                      <th>OT</th>
                      <th>Scheduled Date / Time</th>
                      <th>Ward / Bed</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.uhidOrIp}</td>
                          <td>{item.patientName}</td>
                          <td>
                              {item.type}
                          </td>
                          <td>{item.department}</td>
                          <td>{item.surgery}</td>
                          <td>{item.surgeon}</td>
                          <td>
                            {item.ot}
                          </td>
                          <td>{item.scheduledDateTime}</td>
                          <td>{item.wardBed || "—"}</td>
                          <td className="text-center">
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => openClearModal(item)}
                              title="Clear PAC"
                            >
                              Clear PAC
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10" className="text-center">
                          No patients pending PAC clearance.
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

      {/* ===== CLEAR PAC MODAL ===== */}
      {showClearModal && selectedRecord && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Clear PAC</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeClearModal}
                  disabled={isProcessing}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>Patient:</strong> {selectedRecord.patientName} ({selectedRecord.uhidOrIp})
                    {selectedRecord.type}
                </p>
                <p>
                  <strong>Department:</strong> {selectedRecord.department}
                </p>
                <p>
                  <strong>Surgery:</strong> {selectedRecord.surgery}
                </p>
                <p>
                  <strong>Surgeon:</strong> {selectedRecord.surgeon}
                </p>
                <p>
                  <strong>OT:</strong> {selectedRecord.ot}
                </p>
                <p>
                  <strong>Scheduled Date/Time:</strong> {selectedRecord.scheduledDateTime}
                </p>
                {selectedRecord.wardBed && (
                  <p>
                    <strong>Ward / Bed:</strong> {selectedRecord.wardBed}
                  </p>
                )}

                <div className="mb-3">
                  <label className="form-label fw-bold">Remarks (Optional)</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={clearRemarks}
                    onChange={(e) => setClearRemarks(e.target.value)}
                    placeholder="Any additional notes..."
                    disabled={isProcessing}
                  />
                </div>

                <div className="row">
                  <div className="col-md-6 mb-2">
                    <label className="form-label fw-bold small mb-1">Cleared By</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={`${CURRENT_USER} (Auto)`}
                      readOnly
                      style={{ backgroundColor: "#e9ecef" }}
                    />
                  </div>
                  <div className="col-md-6 mb-2">
                    <label className="form-label fw-bold small mb-1">Date / Time</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={`${getCurrentDateTimeLabel()} (Auto)`}
                      readOnly
                      style={{ backgroundColor: "#e9ecef" }}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeClearModal}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleConfirmClear}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Processing...
                    </>
                  ) : (
                    "Confirm"
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

export default PACClearance;