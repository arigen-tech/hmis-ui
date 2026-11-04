import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

// ----- Pre-Operative Verification checklist items -----
// hasNA: item's dropdown offers Yes / No / N/A instead of just Yes / No
// required: shown with a red asterisk, matches the mockup
const CHECKLIST_ITEMS = [
  { id: "patientIdentity", label: "Patient Identity Verified", required: true, hasNA: false },
  { id: "correctSurgery", label: "Correct Surgery / Procedure Verified", required: true, hasNA: false },
  { id: "surgicalSite", label: "Surgical Site / Side Verified", required: true, hasNA: true },
  { id: "surgicalSiteMarked", label: "Surgical Site Marked", required: true, hasNA: true },
  { id: "surgeryConsent", label: "Surgery Consent Verified", required: true, hasNA: false },
  { id: "anaesthesiaConsent", label: "Anaesthesia Consent Verified", required: false, hasNA: false },
  { id: "pacClearance", label: "PAC Clearance Verified", required: false, hasNA: false },
  { id: "npoFasting", label: "NPO / Fasting Status Verified", required: true, hasNA: false },
  { id: "allergyStatus", label: "Allergy Status Verified", required: true, hasNA: true },
  { id: "investigations", label: "Investigations / Reports Available", required: false, hasNA: true },
  { id: "bloodAvailability", label: "Blood Availability Verified", required: false, hasNA: true },
  { id: "implantProsthesis", label: "Implant / Prosthesis Available", required: false, hasNA: true },
  { id: "instrumentsEquipment", label: "Required Instruments / Equipment Available", required: false, hasNA: true },
  { id: "preOpMedication", label: "Pre-Op Medication Verified", required: false, hasNA: false },
  { id: "ivAccess", label: "IV Access Verified", required: false, hasNA: false },
  { id: "denturesValuables", label: "Dentures / Jewellery / Valuables Checked", required: false, hasNA: false },
  { id: "otTeamAvailability", label: "OT Team Availability Confirmed", required: false, hasNA: false },
];

// Current logged-in nurse for the auto-filled "Verified By" field (dummy - no auth wiring)
const CURRENT_NURSE = "Nurse Priya";

const OTPreOperativeChecklist = () => {
  // ----- State -----
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [checklistStatusFilter, setChecklistStatusFilter] = useState("");

  // Checklist modal states
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [checklistAnswers, setChecklistAnswers] = useState({});
  const [remarks, setRemarks] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // ----- Dummy data (OT Pre-Operative Checklist - Patient List) -----
  const dummyData = [

    {
      id: 3,
      uhidOrIp: "IPD/26/00138",
      patientName: "Amit Kumar",
      ageGender: "45 / Male",
      department: "General Surgery",
      wardBed: "Surgical Ward / A-07",
      surgery: "Hernia Repair",
      plannedSurgeries: ["Inguinal Hernia Repair - Left"],
      surgeon: "Dr. Gupta",
      ot: "OT-03",
      scheduledTime: "20-Aug-26 12:30 PM",
      receivedTime: "11:55 AM",
      checklistStatus: "Pending",
    },
    {
      id: 4,
      uhidOrIp: "IPD/26/00142",
      patientName: "Neha Singh",
      ageGender: "31 / Female",
      department: "General Surgery",
      wardBed: "Surgical Ward / A-09",
      surgery: "Laparoscopic Cholecystectomy",
      plannedSurgeries: ["Laparoscopic Cholecystectomy"],
      surgeon: "Dr. Mehta",
      ot: "OT-01",
      scheduledTime: "20-Aug-26 02:00 PM",
      receivedTime: "01:25 PM",
      checklistStatus: "Pending",
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
      item.uhidOrIp.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.surgery.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.surgeon.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = checklistStatusFilter ? item.checklistStatus === checklistStatusFilter : true;
    return matchSearch && matchStatus;
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
    setChecklistStatusFilter("");
    setCurrentPage(1);
  };

  const getCurrentDateTimeLabel = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[now.getMonth()];
    const year = String(now.getFullYear()).slice(-2);
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  // ----- Open the Pre-Operative Checklist modal for a patient -----
  const openChecklistModal = (record) => {
    setSelectedRecord(record);
    // Default every item to "Yes" - the nurse only needs to change exceptions
    const defaultAnswers = {};
    CHECKLIST_ITEMS.forEach((item) => {
      defaultAnswers[item.id] = "Yes";
    });
    setChecklistAnswers(defaultAnswers);
    setRemarks("");
    setShowChecklistModal(true);
  };

  const closeChecklistModal = () => {
    setShowChecklistModal(false);
    setSelectedRecord(null);
    setChecklistAnswers({});
    setRemarks("");
  };

  const handleChecklistAnswerChange = (itemId, value) => {
    setChecklistAnswers((prev) => ({ ...prev, [itemId]: value }));
  };

  // ----- Save Checklist -----
  const handleSaveChecklist = () => {
    const missingRequired = CHECKLIST_ITEMS.some(
      (item) => item.required && !checklistAnswers[item.id]
    );
    if (missingRequired) {
      showPopup("Please complete all required (*) checklist items.", "error");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const updatedData = data.map((item) =>
        item.id === selectedRecord.id ? { ...item, checklistStatus: "Completed" } : item
      );
      setData(updatedData);
      setIsProcessing(false);
      closeChecklistModal();
      showPopup("Pre-Operative Checklist saved successfully!", "success");
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
              <h4 className="card-title p-2 mb-0">OT Pre-Operative Checklist</h4>
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
                    <label className="form-label fw-bold">Checklist Status</label>
                    <select
                      className="form-select"
                      value={checklistStatusFilter}
                      onChange={(e) => setChecklistStatusFilter(e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
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
                      <th>Department</th>
                      <th>Surgery</th>
                      <th>Surgeon</th>
                      <th className="text-center">OT</th>
                      <th>Scheduled Time</th>
                      <th>Received Time</th>
                      <th className="text-center">Checklist</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.uhidOrIp}</td>
                          <td>{item.patientName}</td>
                          <td>{item.department}</td>
                          <td>{item.surgery}</td>
                          <td>{item.surgeon}</td>
                          <td className="text-center">
                            <span className="badge bg-info">{item.ot}</span>
                          </td>
                          <td>{item.scheduledTime}</td>
                          <td>{item.receivedTime}</td>
                          <td className="text-center">
                            <span
                              className={`badge ${item.checklistStatus === "Completed" ? "bg-success" : "bg-warning text-dark"
                                }`}
                            >
                              {item.checklistStatus}
                            </span>
                          </td>
                          <td className="text-center">
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => openChecklistModal(item)}
                              title="Open Pre-Operative Checklist"
                            >
                              <i className="fa fa-clipboard-list me-1"></i>
                              {item.checklistStatus === "Completed" ? "View Checklist" : "Fill Checklist"}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10" className="text-center">
                          No patients found.
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

      {/* ===== OT PRE-OPERATIVE CHECKLIST MODAL (with fixed positioning to avoid sidebar) ===== */}
      {showChecklistModal && selectedRecord && (
        <>
          {/* Backdrop overlay */}
          {/* <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1040
            }}
            onClick={closeChecklistModal}
          /> */}

          {/* Modal container */}
          <div className="modal show d-block popupModal" tabIndex={-1} role="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title fw-semibold">OT Pre-Operative Checklist</h4>
                  <button
                    type="button"
                    title="Close"
                    className="btn-close"
                    onClick={closeChecklistModal}
                    disabled={isProcessing}
                  ></button>
                </div>

                <div className="modal-body" style={{ maxHeight: "75vh", overflowY: "auto" }}>
                  {/* Patient / Booking Details */}
                  <h6 className="fw-bold text-primary mb-2">Patient / Booking Details</h6>

                   <section className="patient-card">

                    <div className="patient-header">
                        <h4>{selectedRecord.patientName}</h4>
                        <p>UHID / IP No: <strong> {selectedRecord.uhidOrIp}</strong></p>
                    </div>

                    <div className="details-grid">

                      <div className="detail-item">
                        <span className="detail-label">Age / Gender</span>
                        <span className="detail-value">{selectedRecord.ageGender}</span>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">Department</span>
                        <span className="detail-value">{selectedRecord.department}</span>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">Ward / Bed</span>
                        <span className="detail-value">{selectedRecord.wardBed}</span>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">Operation Theatre</span>
                        <span className="detail-value">{selectedRecord.ot}</span>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">Surgeon</span>
                        <span className="detail-value">{selectedRecord.surgeon}</span>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">Scheduled</span>
                        <span className="detail-value" style={{color:"#059669"}}>{selectedRecord.scheduledTime}</span>
                      </div>
                    </div>
                  </section>


                  <div className="surgery-list mb-3">
                    <h5 className="fw-semibold">Planned Surgeries:</h5>
                    <ol>
                      {selectedRecord.plannedSurgeries.map((surgery, idx) => (
                        <li key={idx}>
                        <span class="surgery-number">{idx + 1}</span> 
                        <span class="surgery-name">{surgery}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Pre-Operative Verification */}
                  <h6 className="fw-bold text-primary mb-2">Pre-Operative Verification</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Checklist Item</th>
                          <th className="text-center" style={{ width: "160px" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {CHECKLIST_ITEMS.map((item) => (
                          <tr key={item.id}>
                            <td>
                              {item.label}
                              {item.required && <span className="text-danger"> *</span>}
                            </td>
                            <td>
                              <div className="btnCenter">
                                <select
                                className="form-select form-select-sm smSelect"
                                value={checklistAnswers[item.id] || ""}
                                onChange={(e) => handleChecklistAnswerChange(item.id, e.target.value)}
                                disabled={isProcessing}
                              >
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                                {item.hasNA && <option value="N/A">N/A</option>}
                              </select>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                 
                  {/* Remarks + Auto fields */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">Remarks</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Optional remarks..."
                      disabled={isProcessing}
                      style={{height: "60px"}}
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-2">
                      <label className="form-label fw-bold small mb-1">Verified By</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={`${CURRENT_NURSE}`}
                        readOnly
                      />
                    </div>
                    <div className="col-md-6 mb-2">
                      <label className="form-label fw-bold small mb-1">Date / Time</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={`${getCurrentDateTimeLabel()} `}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeChecklistModal}
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveChecklist}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Saving...
                      </>
                    ) : (
                      "Save Checklist"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {popupMessage && (
        <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
      )}
    </div>
  );
};

export default OTPreOperativeChecklist;