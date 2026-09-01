import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const OTPatientReceiptPending = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [department, setDepartment] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [receivedBy, setReceivedBy] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // ================= NEW DUMMY DATA (only this array changed) =================
  const dummyData = [
    {
      id: 1,
      uhidOrIp: "IPD/26/00215",
      patientName: "Ramesh Patel",
      ageGender: "52 / M",
      department: "Cardiology",
      wardBed: "Cardiac Ward / A-03",
      surgery: "Coronary Artery Bypass Grafting",
      surgeon: "Dr. Desai",
      ot: "OT-02",
      scheduledDateTime: "21-Aug-2026 09:00 AM",
      sentToOTTime: "08:20 AM",
      sentBy: "Nurse Meena",
    },
    {
      id: 2,
      uhidOrIp: "IPD/26/00218",
      patientName: "Anita Sharma",
      ageGender: "37 / F",
      department: "Ophthalmology",
      wardBed: "Eye Ward / B-08",
      surgery: "Cataract Surgery",
      surgeon: "Dr. Iyer",
      ot: "OT-05",
      scheduledDateTime: "21-Aug-2026 10:30 AM",
      sentToOTTime: "09:45 AM",
      sentBy: "Nurse Ritu",
    },
    {
      id: 3,
      uhidOrIp: "IPD/26/00225",
      patientName: "Suresh Reddy",
      ageGender: "68 / M",
      department: "Urology",
      wardBed: "Urology Ward / D-07",
      surgery: "Transurethral Resection of Prostate",
      surgeon: "Dr. Rao",
      ot: "OT-03",
      scheduledDateTime: "21-Aug-2026 12:00 PM",
      sentToOTTime: "11:10 AM",
      sentBy: "Nurse Kavita",
    },
    {
      id: 4,
      uhidOrIp: "IPD/26/00230",
      patientName: "Priya Nair",
      ageGender: "29 / F",
      department: "Gynaecology",
      wardBed: "Gynae Ward / C-11",
      surgery: "Laparoscopic Ovarian Cystectomy",
      surgeon: "Dr. Menon",
      ot: "OT-01",
      scheduledDateTime: "21-Aug-2026 01:30 PM",
      sentToOTTime: "12:40 PM",
      sentBy: "Nurse Anita",
    },
    {
      id: 5,
      uhidOrIp: "IPD/26/00241",
      patientName: "Arjun Singh",
      ageGender: "44 / M",
      department: "Orthopaedics",
      wardBed: "Ortho Ward / B-05",
      surgery: "ACL Reconstruction",
      surgeon: "Dr. Kulkarni",
      ot: "OT-04",
      scheduledDateTime: "21-Aug-2026 03:00 PM",
      sentToOTTime: "02:15 PM",
      sentBy: "Nurse Priya",
    },
  ];
  // =====================================================================

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setData(dummyData);
      setTotalItems(dummyData.length);
      setTotalPages(Math.ceil(dummyData.length / DEFAULT_ITEMS_PER_PAGE));
      setLoading(false);
    }, 300);
  }, []);

  const filteredData = data.filter((item) => {
    const matchSearch =
      item.uhidOrIp.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.surgery.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.surgeon.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDepartment = department ? item.department === department : true;
    return matchSearch && matchDepartment;
  });

  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page) => setCurrentPage(page);

  const handleSearch = () => setCurrentPage(1);

  const handleReset = () => {
    setSearchQuery("");
    setDepartment("");
    setCurrentPage(1);
  };

  const openModal = (record) => {
    setSelectedRecord(record);
    setReceivedBy("");
    setRemarks("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRecord(null);
    setReceivedBy("");
    setRemarks("");
  };

 
  const handleConfirm = () => {
    if (!receivedBy.trim()) {
      showPopup("Please enter the Received By name.", "error");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const updatedData = data.filter((item) => item.id !== selectedRecord.id);
      setData(updatedData);
      setTotalItems(updatedData.length);
      setTotalPages(Math.ceil(updatedData.length / DEFAULT_ITEMS_PER_PAGE));
      setIsProcessing(false);
      closeModal();
      showPopup("Patient received in OT successfully!", "success");
    }, 500);
  };

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

  const departmentOptions = [
    "Orthopaedics",
    "Gynaecology",
    "General Surgery",
    "Urology",
    "Cardiology",
  ];

   return (
    <div className="content-wrapper">
      {loading && <LoadingScreen />}
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">OT Patient Receipt</h4>
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
                      placeholder="UHID/IP No., Patient, Surgery or Surgeon"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label fw-bold">Department</label>
                    <select
                      className="form-select"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    >
                      <option value="">All</option>
                      {departmentOptions.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
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
                      <th>Age / Gender</th>
                      <th>Department</th>
                      <th>Ward / Bed</th>
                      <th>Surgery</th>
                      <th>Surgeon</th>
                      <th>OT</th>
                      <th>Scheduled Date / Time</th>
                      <th>Sent to OT Time</th>
                      <th>Sent By</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.uhidOrIp}</td>
                          <td>{item.patientName}</td>
                          <td>{item.ageGender}</td>
                          <td>{item.department}</td>
                          <td>{item.wardBed}</td>
                          <td>{item.surgery}</td>
                          <td>{item.surgeon}</td>
                          <td>
                            {item.ot}
                          </td>
                          <td>{item.scheduledDateTime}</td>
                          <td>{item.sentToOTTime}</td>
                          <td>{item.sentBy}</td>
                          <td className="text-center">
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => openModal(item)}
                              title="Receive Patient"
                            >
                              Receive 
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="12" className="text-center">
                          No patients pending receipt.
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

      {/* ===== RECEIVE PATIENT MODAL ===== */}
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
                <h5 className="modal-title">Receive Patient in OT</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                  disabled={isProcessing}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>Patient:</strong> {selectedRecord.patientName} ({selectedRecord.uhidOrIp})
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
                  <strong>Ward / Bed:</strong> {selectedRecord.wardBed}
                </p>
                <p>
                  <strong>Scheduled Date/Time:</strong> {selectedRecord.scheduledDateTime}
                </p>
                <p>
                  <strong>Sent to OT Time:</strong> {selectedRecord.sentToOTTime} by {selectedRecord.sentBy}
                </p>

                <div className="mb-3">
                  <label className="form-label fw-bold">
                    Received By <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                    placeholder="Enter receiving nurse/staff name"
                    disabled={isProcessing}
                  />
                </div>

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
                  className="btn btn-success"
                  onClick={handleConfirm}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Processing...
                    </>
                  ) : (
                    "Confirm Receipt"
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

export default OTPatientReceiptPending; 