// OTRequestFromIPD.js
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const OTRequestFromIPD = () => {
  // ----- State -----
  const [currentView, setCurrentView] = useState("list"); // "list" | "detail"
  const [selectedAdmission, setSelectedAdmission] = useState(null);

  // List filters
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [wardFilter, setWardFilter] = useState("");

  // Data
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ----- Detail form state -----
  const [detailForm, setDetailForm] = useState({
    // Surgery Details
    surgeryType: "",
    surgery: "",
    majorMinor: "Major",
    diagnosis: "",
    primarySurgeon: "",
    priority: "Elective",
    // Preferred OT Schedule
    preferredDate: "",
    preferredOT: "",
    preferredSession: "",
    expectedDuration: "120",
    // Special Instructions
    specialInstructions: "",
  });

  // ----- Dummy data -----
  const dummyAdmissions = [
    {
      id: 1,
      admissionNo: "IPD/26/00125",
      patientName: "Rajesh Kumar",
      ageGender: "52 / Male",
      admissionDate: "15-Aug-2026",
      department: "Orthopaedics",
      ward: "Ortho Ward",
      bed: "B-12",
      treatingDoctor: "Dr. Sharma",
      uhid: "P000125",
      mobile: "9800000000",
      consultant: "Dr. Sharma",
    },
    {
      id: 2,
      admissionNo: "IPD/26/00128",
      patientName: "Amit Kumar",
      ageGender: "45 / Male",
      admissionDate: "16-Aug-2026",
      department: "General Surgery",
      ward: "Surgical Ward",
      bed: "B-08",
      treatingDoctor: "Dr. Gupta",
      uhid: "P000128",
      mobile: "9812345678",
      consultant: "Dr. Gupta",
    },
    {
      id: 3,
      admissionNo: "IPD/26/00131",
      patientName: "Sunita Devi",
      ageGender: "38 / Female",
      admissionDate: "16-Aug-2026",
      department: "Gynaecology",
      ward: "Gynae Ward",
      bed: "B-04",
      treatingDoctor: "Dr. Verma",
      uhid: "P000131",
      mobile: "9823456789",
      consultant: "Dr. Verma",
    },
  ];

  // Unique wards for filter
  const wardOptions = ["All Wards", ...new Set(dummyAdmissions.map((a) => a.ward))];

  // Surgery types and surgeries (dummy)
  const surgeryTypes = ["Orthopaedic Surgery", "General Surgery", "Cardiothoracic"];
  const surgeries = ["Total Knee Replacement", "Hernia Repair", "CABG"];
  const surgeons = ["Dr. Sharma", "Dr. Gupta", "Dr. Verma", "Dr. Patel"];
  const sessions = ["08:00 AM - 02:00 PM", "02:00 PM - 08:00 PM", "08:00 PM - 08:00 AM"];

  // ----- Effects -----
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setAdmissions(dummyAdmissions);
      setTotalItems(dummyAdmissions.length);
      setTotalPages(Math.ceil(dummyAdmissions.length / DEFAULT_ITEMS_PER_PAGE));
      setLoading(false);
    }, 300);
  }, []);

  // ----- Filtered data (list view) -----
  const filteredData = admissions.filter((item) => {
    const matchSearch =
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.admissionNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchMobile = item.mobile.includes(mobileNo);
    const matchWard = wardFilter && wardFilter !== "All Wards" ? item.ward === wardFilter : true;
    return matchSearch && matchMobile && matchWard;
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
    setMobileNo("");
    setWardFilter("");
    setCurrentPage(1);
  };

  // ----- Row click -> Detail view -----
  const handleRowClick = (admission) => {
    setSelectedAdmission(admission);
    // Pre-fill detail form with any existing data (dummy for now)
    setDetailForm({
      surgeryType: "",
      surgery: "",
      majorMinor: "Major",
      diagnosis: "",
      primarySurgeon: "",
      priority: "Elective",
      preferredDate: "",
      preferredOT: "",
      preferredSession: "",
      expectedDuration: "120",
      specialInstructions: "",
    });
    setCurrentView("detail");
  };

  // ----- Back to list -----
  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedAdmission(null);
  };

  // ----- Detail form field changes -----
  const handleDetailChange = (field, value) => {
    setDetailForm((prev) => ({ ...prev, [field]: value }));
  };

  // ----- Submit OT Request -----
  const handleSubmit = () => {
    // Validate required fields
    if (!detailForm.surgeryType || !detailForm.surgery || !detailForm.diagnosis || !detailForm.primarySurgeon || !detailForm.preferredDate || !detailForm.preferredOT || !detailForm.preferredSession) {
      showPopup("Please fill all required fields.", "error");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      showPopup("OT Request submitted successfully!", "success", () => {
        handleBackToList();
      });
    }, 1000);
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

  // ============================================================
  // RENDER: DETAIL VIEW
  // ============================================================
  if (currentView === "detail" && selectedAdmission) {
    return (
      <div className="content-wrapper">
        {loading && <LoadingScreen />}
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">OT Request – {selectedAdmission.patientName}</h4>
                <button className="btn btn-secondary" onClick={handleBackToList}>
                  <i className="mdi mdi-arrow-left"></i> Back
                </button>
              </div>
              <div className="card-body">
                {/* ===== PATIENT DETAILS ===== */}
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">PATIENT DETAILS</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3">
                        <label className="form-label fw-bold">UHID</label>
                        <input
                          type="text"
                          className="form-control"
                          readOnly
                          value={selectedAdmission.uhid}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Patient Name</label>
                        <input
                          type="text"
                          className="form-control"
                          readOnly
                          value={selectedAdmission.patientName}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Age / Gender</label>
                        <input
                          type="text"
                          className="form-control"
                          readOnly
                          value={selectedAdmission.ageGender}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Mobile No.</label>
                        <input
                          type="text"
                          className="form-control"
                          readOnly
                          value={selectedAdmission.mobile}
                        />
                      </div>
                    </div>
                    <div className="row mt-3">
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Admission No.</label>
                        <input
                          type="text"
                          className="form-control"
                          readOnly
                          value={selectedAdmission.admissionNo}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Ward / Bed</label>
                        <input
                          type="text"
                          className="form-control"
                          readOnly
                          value={`${selectedAdmission.ward} / ${selectedAdmission.bed}`}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Department</label>
                        <input
                          type="text"
                          className="form-control"
                          readOnly
                          value={selectedAdmission.department}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Consultant</label>
                        <input
                          type="text"
                          className="form-control"
                          readOnly
                          value={selectedAdmission.consultant}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ===== SURGERY DETAILS ===== */}
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">SURGERY DETAILS</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-bold">Surgery Type *</label>
                        <select
                          className="form-select"
                          value={detailForm.surgeryType}
                          onChange={(e) => handleDetailChange("surgeryType", e.target.value)}
                        >
                          <option value="">Select Surgery Type</option>
                          {surgeryTypes.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-bold">Surgery *</label>
                        <select
                          className="form-select"
                          value={detailForm.surgery}
                          onChange={(e) => handleDetailChange("surgery", e.target.value)}
                        >
                          <option value="">Select Surgery</option>
                          {surgeries.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-bold">Major / Minor</label>
                        <input
                          type="text"
                          className="form-control"
                          value={detailForm.majorMinor}
                          readOnly
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-bold">Diagnosis *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter diagnosis"
                          value={detailForm.diagnosis}
                          onChange={(e) => handleDetailChange("diagnosis", e.target.value)}
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-bold">Primary Surgeon *</label>
                        <select
                          className="form-select"
                          value={detailForm.primarySurgeon}
                          onChange={(e) => handleDetailChange("primarySurgeon", e.target.value)}
                        >
                          <option value="">Select Surgeon</option>
                          {surgeons.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-bold">Priority *</label>
                        <select
                          className="form-select"
                          value={detailForm.priority}
                          onChange={(e) => handleDetailChange("priority", e.target.value)}
                        >
                          <option value="Elective">Elective</option>
                          <option value="Urgent">Urgent</option>
                          <option value="Emergency">Emergency</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ===== PREFERRED OT SCHEDULE & REMARKS ===== */}
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">PREFERRED OT SCHEDULE & REMARKS</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3 mb-3">
                        <label className="form-label fw-bold">Preferred Date *</label>
                        <input
                          type="date"
                          className="form-control"
                          value={detailForm.preferredDate}
                          onChange={(e) => handleDetailChange("preferredDate", e.target.value)}
                        />
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label fw-bold">Preferred OT *</label>
                        <select
                          className="form-select"
                          value={detailForm.preferredOT}
                          onChange={(e) => handleDetailChange("preferredOT", e.target.value)}
                        >
                          <option value="">Select OT</option>
                          <option value="Main OT-01">Main OT-01</option>
                          <option value="Main OT-02">Main OT-02</option>
                          <option value="Cardio OT">Cardio OT</option>
                        </select>
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label fw-bold">Preferred Session *</label>
                        <select
                          className="form-select"
                          value={detailForm.preferredSession}
                          onChange={(e) => handleDetailChange("preferredSession", e.target.value)}
                        >
                          <option value="">Select Session</option>
                          {sessions.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label fw-bold">Expected Duration</label>
                        <input
                          type="number"
                          className="form-control"
                          value={detailForm.expectedDuration}
                          onChange={(e) => handleDetailChange("expectedDuration", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="row mt-2">
                      <div className="col-12">
                        <label className="form-label fw-bold">Special Instructions / Remarks</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={detailForm.specialInstructions}
                          onChange={(e) => handleDetailChange("specialInstructions", e.target.value)}
                          placeholder="Any special instructions for the OT team..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ===== ACTION BUTTONS ===== */}
                <div className="d-flex justify-content-end mt-4">
                  <button className="btn btn-secondary me-2" onClick={handleBackToList} disabled={isSubmitting}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Submitting...
                      </>
                    ) : (
                      "Submit OT Request"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {popupMessage && (
          <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
        )}
      </div>
    );
  }

  // ============================================================
  // RENDER: LIST VIEW
  // ============================================================
  return (
    <div className="content-wrapper">
      <div className="row">
        {loading && <LoadingScreen />}
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Active Admission List </h4>
            </div>
            <div className="card-body">
              {/* Search / Filter Section */}
              <div className="mb-4">
                <div className="row g-3 align-items-end">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Patient Name / Admission No.</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by name or admission..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label fw-bold">Mobile No.</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter mobile"
                      value={mobileNo}
                      onChange={(e) => setMobileNo(e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label fw-bold">Ward</label>
                    <select
                      className="form-select"
                      value={wardFilter}
                      onChange={(e) => setWardFilter(e.target.value)}
                    >
                      {wardOptions.map((w) => (
                        <option key={w} value={w}>{w}</option>
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
                      <th>Admission No.</th>
                      <th>Patient Name</th>
                      <th>Age / Gender</th>
                      <th>Admission Date</th>
                      <th>Department</th>
                      <th>Ward</th>
                      <th>Bed</th>
                      <th>Treating Doctor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => handleRowClick(item)}
                          style={{ cursor: "pointer" }}
                        >
                          <td>{item.admissionNo}</td>
                          <td>{item.patientName}</td>
                          <td>{item.ageGender}</td>
                          <td>{item.admissionDate}</td>
                          <td>{item.department}</td>
                          <td>{item.ward}</td>
                          <td>{item.bed}</td>
                          <td>{item.treatingDoctor}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center">No records found</td>
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

      {popupMessage && (
        <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
      )}
    </div>
  );
};

export default OTRequestFromIPD;