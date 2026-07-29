import React, { useState } from "react";
import LoadingScreen from "../../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../../Components/Pagination";

const DieticianDashboard = () => {
  // ---------- View switching: "list" | "dietEntry" | "tracking" ----------
  const [currentView, setCurrentView] = useState("list");
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [loading, setLoading] = useState(false);

  /* =========================================================================
     ============================ LIST VIEW STATE ===========================
     ========================================================================= */

  // States for search fields
  const [searchPatientName, setSearchPatientName] = useState("");
  const [searchMobile, setSearchMobile] = useState("");
  const [searchWard, setSearchWard] = useState("");

  // States for button spinners
  const [isSearching, setIsSearching] = useState(false);
  const [isShowingAll, setIsShowingAll] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Server-side pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Dashboard grid data - Updated with new patients
  const [dietData, setDietData] = useState([
    {
      uhid: "UHID-000512",
      patientName: "Sunita Reddy",
      mobileNo: "98XXXX6789",
      admissionNo: "ADM-2025-000789",
      wardBed: "General Ward-C / Bed-02",
      currentDietCategory: "Diabetic",
      dietStatus: "Active",
      specialInstruction: "Low sugar, no sweets",
    },
    {
      uhid: "UHID-000623",
      patientName: "Vikram Singh",
      mobileNo: "97XXXX2345",
      admissionNo: "ADM-2025-000812",
      wardBed: "ICU-2 / Bed-04",
      currentDietCategory: "Liquid",
      dietStatus: "Active",
      specialInstruction: "NPO, only clear fluids",
    },
    {
      uhid: "UHID-000734",
      patientName: "Kavita Nair",
      mobileNo: "99XXXX8765",
      admissionNo: "ADM-2025-000901",
      wardBed: "HDU-1 / Bed-03",
      currentDietCategory: "Cardiac",
      dietStatus: "Active",
      specialInstruction: "Low sodium, low fat",
    },
    {
      uhid: "UHID-000845",
      patientName: "Arjun Mehta",
      mobileNo: "96XXXX4321",
      admissionNo: "ADM-2025-001023",
      wardBed: "Maternity Ward / Bed-05",
      currentDietCategory: "Normal",
      dietStatus: "Active",
      specialInstruction: "High protein, lactation diet",
    },
    {
      uhid: "UHID-000956",
      patientName: "Lakshmi Iyer",
      mobileNo: "95XXXX7890",
      admissionNo: "ADM-2025-001145",
      wardBed: "General Ward-D / Bed-01",
      currentDietCategory: "-",
      dietStatus: "Not Assigned",
      specialInstruction: "-",
    },
  ]);

  const getDietStatusColor = (status) => {
    switch (status) {
      case "Active":
        return { backgroundColor: "#28a745", color: "#fff" };
      case "Not Assigned":
        return { backgroundColor: "#6c757d", color: "#fff" };
      case "Stopped":
        return { backgroundColor: "#dc3545", color: "#fff" };
      default:
        return { backgroundColor: "#6c757d", color: "#fff" };
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // fetchDieticianDashboard(page - 1)
  };

  // Handle search
  const handleSearch = async () => {
    setIsSearching(true);
    setCurrentPage(1);
    // await fetchDieticianDashboard(0)
    setIsSearching(false);
  };

  const handleShowAll = async () => {
    setIsShowingAll(true);

    setSearchPatientName("");
    setSearchMobile("");
    setSearchWard("");
    setCurrentPage(1);

    // await fetchDieticianDashboard(0)
    setIsShowingAll(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // await fetchDieticianDashboard(currentPage - 1)
    setIsRefreshing(false);
  };

  // Navigates to the patient diet entry screen (Change Diet / New Diet Entry)
  const handleDietAction = (item, e) => {
    e.stopPropagation();
    setSelectedPatient(item);
    setCurrentView("dietEntry");
  };

  /* =========================================================================
     =========================== DIET ENTRY VIEW STATE ======================
     ========================================================================= */

  // ---------- Patient Profile (Auto-Populated, Read-Only) ----------
  const [patientProfile, setPatientProfile] = useState({
    patientId: "P00042",
    title: "Ms.",
    firstName: "Ananya",
    lastName: "Sharma",
    gender: "Female",
    age: "42",
  });

  // ---------- Health Information (Auto-Populated, Read-Only) ----------
  const [healthInfo, setHealthInfo] = useState({
    height: "162",
    weight: "68",
    temperature: "98.4",
    bpSystolic: "135",
    bpDiastolic: "85",
    pulse: "76",
    bmi: "25.9",
    rr: "18",
    spo2: "99",
    bloodSugarLevels: "110",
    bloodCholesterolLevels: "205",
    chronicDisease: "Type 2 Diabetes, Hypertension",
  });

  // ---------- Ward Details (Auto-Populated, Read-Only) ----------
  const [wardDetails, setWardDetails] = useState({
    wardBed: "ICU-2 / Bed-04",
    admissionNo: "ADM-2025-000812",
    admissionDate: "15-Sep-2025",
    attendingDoctor: "Dr. R. Deshmukh",
  });

  // ---------- Diet History (Previous diet entries) ----------
  const [dietHistory, setDietHistory] = useState([
    {
      id: 1,
      dietCategory: "Normal",
      fromDateTime: "15-Sep-2025 10:00",
      toDateTime: "17-Sep-2025 08:00",
      specialInstruction: "Regular diet",
      orderedBy: "Dietician - Dr. Anjali Kulkarni",
      status: "Completed",
      completedOn: "17-Sep-2025 08:00",
    },
    {
      id: 2,
      dietCategory: "Liquid",
      fromDateTime: "17-Sep-2025 08:01",
      toDateTime: "19-Sep-2025 09:00",
      specialInstruction: "Clear liquids, avoid dairy",
      orderedBy: "Doctor - Dr. S. Deshmukh",
      status: "Completed",
      completedOn: "19-Sep-2025 09:00",
    },
    {
      id: 3,
      dietCategory: "Diabetic",
      fromDateTime: "19-Sep-2025 09:01",
      toDateTime: "22-Sep-2025 07:30",
      specialInstruction: "Low carb, sugar-free",
      orderedBy: "Dietician - Ms. Kavita Rao",
      status: "Completed",
      completedOn: "22-Sep-2025 07:30",
    },
    {
      id: 4,
      dietCategory: "Cardiac",
      fromDateTime: "22-Sep-2025 07:31",
      toDateTime: null,
      specialInstruction: "Low sodium, low fat",
      orderedBy: "Dietician - Ms. Kavita Rao",
      status: "Active",
      completedOn: null,
    },
  ]);

  // ---------- New Diet Entry ----------
  const [newDietEntry, setNewDietEntry] = useState({
    dietCategory: "",
    specialInstruction: "",
    effectiveFrom: "",
    orderedBy: "Dietician - Ms. Kavita Rao",
    remarks: "",
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isStopping, setIsStopping] = useState(null);

  const dietCategoryOptions = [
    { value: "Normal", label: "Normal" },
    { value: "Liquid", label: "Liquid" },
    { value: "Soft", label: "Soft" },
    { value: "Diabetic", label: "Diabetic" },
    { value: "Renal", label: "Renal" },
    { value: "Cardiac", label: "Cardiac" },
  ];

  const hasError = (field) => (errors[field] ? "is-invalid" : "");
  const getErrorMessage = (field) => errors[field] || "";

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return { backgroundColor: "#28a745", color: "#fff" };
      case "Completed":
        return { backgroundColor: "#6c757d", color: "#fff" };
      case "Stopped":
        return { backgroundColor: "#dc3545", color: "#fff" };
      case "Finalized":
        return { backgroundColor: "#28a745", color: "#fff" };
      case "Draft":
        return { backgroundColor: "#ffc107", color: "#000" };
      default:
        return { backgroundColor: "#6c757d", color: "#fff" };
    }
  };

  const handleNewEntryChange = (e) => {
    const { id, value } = e.target;
    setNewDietEntry((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: "" }));
  };

  // Stop / discontinue an existing (active) diet entry before assigning a new one
  const handleStopDiet = (entryId) => {
    setIsStopping(entryId);
    console.log("Stopping diet entry:", entryId);
    setIsStopping(null);
  };

  const handleSaveNewDiet = () => {
    setIsSaving(true);
    console.log("Saving new diet entry:", newDietEntry);
    setIsSaving(false);
  };

  const handleViewFullDietHistory = () => {
    setCurrentView("tracking");
  };

  const handleBackToDashboard = () => {
    setCurrentView("list");
    setSelectedPatient(null);
  };

  /* =========================================================================
     ============================ TRACKING VIEW STATE ========================
     ========================================================================= */

  const [patientDetails, setPatientDetails] = useState({
    patientName: "Vikram Singh",
    admissionNo: "ADM-2025-000812",
  });

  const [dietOrder, setDietOrder] = useState({
    dietCategory: "Liquid",
    specialInstruction: "NPO, only clear fluids",
    effectiveFrom: "17-Sep-2025 08:01 AM",
    orderedBy: "Doctor - Dr. S. Deshmukh",
  });

  const [executionEntries, setExecutionEntries] = useState([
    {
      id: 1,
      meal: "Breakfast",
      date: "18-Sep-2025",
      served: "Yes",
      timeServed: "08:20 AM",
      quantity: "Full",
      reasonIfNil: "-",
      shift: "Morning",
      enteredBy: "Nurse Priya",
      status: "Finalized",
    },
    {
      id: 2,
      meal: "Lunch",
      date: "18-Sep-2025",
      served: "No",
      timeServed: "-",
      quantity: "Nil",
      reasonIfNil: "Nausea, vomiting",
      shift: "Afternoon",
      enteredBy: "Nurse Priya",
      status: "Finalized",
    },
    {
      id: 3,
      meal: "Dinner",
      date: "18-Sep-2025",
      served: "Yes",
      timeServed: "07:50 PM",
      quantity: "Half",
      reasonIfNil: "-",
      shift: "Night",
      enteredBy: "Nurse Rahul",
      status: "Finalized",
    },
    {
      id: 4,
      meal: "New Entry",
      date: "19-Sep-2025",
      served: "-",
      timeServed: "-",
      quantity: "-",
      reasonIfNil: "-",
      shift: "Auto",
      enteredBy: "Auto",
      status: "Draft",
    },
  ]);

  const handleAddNewEntry = () => {
    console.log("Add new diet execution entry");
  };

  const handleBackToDietEntry = () => {
    setCurrentView("dietEntry");
  };

  /* =========================================================================
     ============================ TRACKING VIEW RENDER =======================
     ========================================================================= */
  if (currentView === "tracking") {
    return (
      <div className="content-wrapper">
        {loading && <LoadingScreen />}

        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">
                  Diet Execution History &amp; Tracking
                </h4>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleBackToDietEntry}
                >
                  Back to Diet Entry
                </button>
              </div>

              <div className="card-body p-2 pb-0">
                {/* Patient Details */}
                <div className="row mb-3">
                  <div className="col-sm-12">
                    <div className="card shadow mb-3">
                      <div className="card-header border-bottom-1 py-3">
                        <h6 className="fw-bold mb-0">Patient Details</h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-md-4">
                            <label className="form-label">Patient Name</label>
                            <input
                              type="text"
                              className="form-control"
                              value={patientDetails.patientName}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Admission No</label>
                            <input
                              type="text"
                              className="form-control"
                              value={patientDetails.admissionNo}
                              readOnly
                              disabled
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Diet Order */}
                <div className="row mb-3">
                  <div className="col-sm-12">
                    <div className="card shadow mb-3">
                      <div className="card-header border-bottom-1 py-3">
                        <h6 className="fw-bold mb-0">Diet Order</h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-md-3">
                            <label className="form-label">Diet Category</label>
                            <input
                              type="text"
                              className="form-control"
                              value={dietOrder.dietCategory}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Special Instruction</label>
                            <input
                              type="text"
                              className="form-control"
                              value={dietOrder.specialInstruction}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">Effective From</label>
                            <input
                              type="text"
                              className="form-control"
                              value={dietOrder.effectiveFrom}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="col-md-2">
                            <label className="form-label">Ordered By</label>
                            <input
                              type="text"
                              className="form-control"
                              value={dietOrder.orderedBy}
                              readOnly
                              disabled
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Diet Execution History + Capture */}
                <div className="row mb-3">
                  <div className="col-sm-12">
                    <div className="card shadow mb-3">
                      <div className="card-header border-bottom-1 py-3">
                        <h6 className="fw-bold mb-0">Diet Execution History </h6>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-bordered align-middle">
                            <thead>
                              <tr>
                                <th>Meal</th>
                                <th>Date</th>
                                <th>Served</th>
                                <th>Time Served</th>
                                <th>Quantity</th>
                                <th>Reason (if Nil)</th>
                                <th>Shift</th>
                                <th>Entered By</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {executionEntries.map((entry) => (
                                <tr key={entry.id}>
                                  <td>{entry.meal}</td>
                                  <td>{entry.date}</td>
                                  <td>{entry.served}</td>
                                  <td>{entry.timeServed}</td>
                                  <td>{entry.quantity}</td>
                                  <td>{entry.reasonIfNil}</td>
                                  <td>{entry.shift}</td>
                                  <td>{entry.enteredBy}</td>
                                  <td>
                                    <span
                                      className="badge"
                                      style={getStatusColor(entry.status)}
                                    >
                                      {entry.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* <button
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={handleAddNewEntry}
                        >
                          New Entry
                        </button> */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     ============================ DIET ENTRY VIEW RENDER =====================
     ========================================================================= */
  if (currentView === "dietEntry") {
    return (
      <div className="content-wrapper">
        {loading && <LoadingScreen />}

        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">Patient Diet Entry</h4>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleBackToDashboard}
                >
                  Back to Dashboard
                </button>
              </div>

              <div className="card-body p-2 pb-0">
                {loading && (
                  <div className="alert alert-info d-flex align-items-center gap-2 py-2 mb-3">
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    />
                    <span>Loading data, please wait...</span>
                  </div>
                )}

                {/* Patient Profile */}
                <div className="row mb-3">
                  <div className="col-md-12">
                    <div className="card shadow mb-3">
                      <div className="card-header py-2">
                        <h6 className="fw-bold mb-0">Patient Profile</h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-md-4">
                            <label className="form-label">Patient ID</label>
                            <input
                              type="text"
                              className="form-control"
                              value={patientProfile.patientId}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Title</label>
                            <input
                              type="text"
                              className="form-control"
                              value={patientProfile.title}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">First Name</label>
                            <input
                              type="text"
                              className="form-control"
                              value={patientProfile.firstName}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Last Name</label>
                            <input
                              type="text"
                              className="form-control"
                              value={patientProfile.lastName}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Gender</label>
                            <input
                              type="text"
                              className="form-control"
                              value={patientProfile.gender}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Age</label>
                            <input
                              type="text"
                              className="form-control"
                              value={patientProfile.age}
                              readOnly
                              disabled
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Health Information - redesigned for compactness */}
                  <div className="col-md-12">
                    <div className="card shadow mb-3">
                      <div className="card-header py-2">
                        <h6 className="fw-bold mb-0">Health Information</h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          {/* Height */}
                          <div className="col-md-3">
                            <label className="form-label">Height <span className="text-danger">*</span></label>
                            <div className="input-group">
                              <input
                                type="number"
                                className="form-control"
                                value={healthInfo.height}
                                readOnly
                                disabled
                              />
                              <span className="input-group-text">cm</span>
                            </div>
                          </div>

                          {/* Weight */}
                          <div className="col-md-3">
                            <label className="form-label">Weight <span className="text-danger">*</span></label>
                            <div className="input-group">
                              <input
                                type="number"
                                className="form-control"
                                value={healthInfo.weight}
                                readOnly
                                disabled
                              />
                              <span className="input-group-text">kg</span>
                            </div>
                          </div>

                          {/* BP Systolic */}
                          <div className="col-md-3">
                            <label className="form-label">BP Systolic <span className="text-danger">*</span></label>
                            <div className="input-group">
                              <input
                                type="number"
                                className="form-control"
                                value={healthInfo.bpSystolic}
                                readOnly
                                disabled
                              />
                              <span className="input-group-text">mmHg</span>
                            </div>
                          </div>

                          {/* BP Diastolic */}
                          <div className="col-md-3">
                            <label className="form-label">BP Diastolic <span className="text-danger">*</span></label>
                            <div className="input-group">
                              <input
                                type="number"
                                className="form-control"
                                value={healthInfo.bpDiastolic}
                                readOnly
                                disabled
                              />
                              <span className="input-group-text">mmHg</span>
                            </div>
                          </div>

                          {/* Pulse */}
                          <div className="col-md-3">
                            <label className="form-label">Pulse <span className="text-danger">*</span></label>
                            <div className="input-group">
                              <input
                                type="number"
                                className="form-control"
                                value={healthInfo.pulse}
                                readOnly
                                disabled
                              />
                              <span className="input-group-text">/min</span>
                            </div>
                          </div>

                          {/* Blood Sugar Levels */}
                          <div className="col-md-3">
                            <label className="form-label">Blood Sugar Levels</label>
                            <div className="input-group">
                              <input
                                type="text"
                                className="form-control"
                                value={healthInfo.bloodSugarLevels}
                                readOnly
                                disabled
                              />
                              <span className="input-group-text">mg/dl</span>
                            </div>
                          </div>

                          {/* Blood Cholesterol Levels */}
                          <div className="col-md-3">
                            <label className="form-label">Blood Cholesterol Levels</label>
                            <div className="input-group">
                              <input
                                type="text"
                                className="form-control"
                                value={healthInfo.bloodCholesterolLevels}
                                readOnly
                                disabled
                              />
                              <span className="input-group-text">mg/dl</span>
                            </div>
                          </div>

                          {/* Chronic Disease */}
                          <div className="col-md-3">
                            <label className="form-label">Chronic Disease</label>
                            <input
                              type="text"
                              className="form-control"
                              value={healthInfo.chronicDisease}
                              readOnly
                              disabled
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ward Details */}
                <div className="row mb-3">
                  <div className="col-md-12">
                    <div className="card shadow mb-3">
                      <div className="card-header py-2">
                        <h6 className="fw-bold mb-0">Ward Details</h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-md-3">
                            <label className="form-label">Ward / Bed</label>
                            <input
                              type="text"
                              className="form-control"
                              value={wardDetails.wardBed}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">Admission No</label>
                            <input
                              type="text"
                              className="form-control"
                              value={wardDetails.admissionNo}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">Admission Date</label>
                            <input
                              type="text"
                              className="form-control"
                              value={wardDetails.admissionDate}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">Attending Doctor</label>
                            <input
                              type="text"
                              className="form-control"
                              value={wardDetails.attendingDoctor}
                              readOnly
                              disabled
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Diet History */}
                {dietHistory.length > 0 && (
                  <div className="row mb-3">
                    <div className="col-sm-12">
                      <div className="card shadow mb-3">
                        <div className="card-header d-flex justify-content-between align-items-center">
                          <h6 className="fw-bold mb-0">Diet History</h6>
                          <button
                            type="button"
                            className="btn btn-light btn-sm"
                            onClick={handleViewFullDietHistory}
                          >
                            View Full Diet History / Nursing Tracking
                          </button>
                        </div>
                        <div className="card-body">
                          <div className="table-responsive">
                            <table className="table table-bordered align-middle">
                              <thead>
                                <tr>
                                  <th>Diet Category</th>
                                  <th>From Date-Time</th>
                                  <th>To Date-Time</th>
                                  <th>Special Instruction</th>
                                  <th>Ordered By</th>
                                  <th>Status</th>
                                  <th>Completed On</th>
                                  <th className="text-center">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dietHistory.map((entry) => (
                                  <tr key={entry.id}>
                                    <td>{entry.dietCategory}</td>
                                    <td>{entry.fromDateTime}</td>
                                    <td>{entry.toDateTime || "-"}</td>
                                    <td>{entry.specialInstruction}</td>
                                    <td>{entry.orderedBy}</td>
                                    <td>
                                      <span
                                        className="badge"
                                        style={getStatusColor(entry.status)}
                                      >
                                        {entry.status}
                                      </span>
                                    </td>
                                    <td>{entry.completedOn || "-"}</td>
                                    <td className="text-center">
                                      {entry.status === "Active" ? (
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-danger"
                                          onClick={() => handleStopDiet(entry.id)}
                                          disabled={isStopping === entry.id}
                                        >
                                          {isStopping === entry.id ? (
                                            <span
                                              className="spinner-border spinner-border-sm"
                                              role="status"
                                              aria-hidden="true"
                                            />
                                          ) : (
                                            "Stop"
                                          )}
                                        </button>
                                      ) : (
                                        <span className="text-muted">-</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* New Diet Entry */}
                <div className="row mb-3">
                  <div className="col-sm-12">
                    <div className="card shadow mb-3">
                      <div className="card-header border-bottom-1 py-3">
                        <h6 className="fw-bold mb-0">New Diet Entry</h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-md-2">
                            <label className="form-label">Diet Category *</label>
                            <select
                              className={`form-select ${hasError("dietCategory")}`}
                              id="dietCategory"
                              value={newDietEntry.dietCategory}
                              onChange={handleNewEntryChange}
                            >
                              <option value="">Select Diet Category</option>
                              {dietCategoryOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            {getErrorMessage("dietCategory") && (
                              <div className="invalid-feedback">
                                {getErrorMessage("dietCategory")}
                              </div>
                            )}
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Special Instruction</label>
                            <textarea
                              className="form-control"
                              id="specialInstruction"
                              placeholder="Enter Special Instruction"
                              value={newDietEntry.specialInstruction}
                              onChange={handleNewEntryChange}
                              rows={1}
                            />
                          </div>
                          <div className="col-md-2">
                            <label className="form-label">Effective From *</label>
                            <input
                              type="datetime-local"
                              required
                              className={`form-control ${hasError("effectiveFrom")}`}
                              id="effectiveFrom"
                              value={newDietEntry.effectiveFrom}
                              onChange={handleNewEntryChange}
                            />
                            {getErrorMessage("effectiveFrom") && (
                              <div className="invalid-feedback">
                                {getErrorMessage("effectiveFrom")}
                              </div>
                            )}
                          </div>
                          <div className="col-md-2">
                            <label className="form-label">Ordered By</label>
                            <input
                              type="text"
                              className="form-control"
                              value={newDietEntry.orderedBy}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="col-md-2">
                            <label className="form-label">Remarks</label>
                            <textarea
                              className="form-control"
                              id="remarks"
                              placeholder="Enter Remarks"
                              value={newDietEntry.remarks}
                              onChange={handleNewEntryChange}
                              rows={1}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="form-group col-md-12 d-flex justify-content-end mt-2 pb-3">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveNewDiet}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        />
                        Saving...
                      </>
                    ) : (
                      "Save Diet Entry"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     ============================ LIST VIEW RENDER (DEFAULT) =================
     ========================================================================= */
  return (
    <div className="content-wrapper">
      {loading && <LoadingScreen />}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2 mb-0">
                Diet Management
              </h4>
            </div>

            <div className="card-body">
              {/* Search Section */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <label className="form-label fw-bold">Patient Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Patient Name"
                    value={searchPatientName}
                    onChange={(e) => setSearchPatientName(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Mobile No</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Mobile No"
                    value={searchMobile}
                    onChange={(e) => setSearchMobile(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Ward</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Ward"
                    value={searchWard}
                    onChange={(e) => setSearchWard(e.target.value)}
                  />
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-primary me-2"
                    onClick={handleSearch}
                    disabled={loading || isSearching || isShowingAll}
                  >
                    {isSearching ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        />
                        Searching...
                      </>
                    ) : (
                      "Search"
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleShowAll}
                    disabled={loading || isSearching || isShowingAll}
                  >
                    {isShowingAll ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        />
                        Showing All...
                      </>
                    ) : (
                      "Show All"
                    )}
                  </button>
                </div>
              </div>

              {/* Diet Grid Table */}
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead style={{ backgroundColor: "#95a5a6", color: "white" }}>
                    <tr>
                      <th>Patient Name / UHID</th>
                      <th>Mobile No</th>
                      <th>Admission No</th>
                      <th>Ward / Bed</th>
                      <th>Current Diet Category</th>
                      <th>Diet Status</th>
                      <th>Special Instruction</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4">
                          <LoadingScreen />
                        </td>
                      </tr>
                    ) : dietData.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4 text-muted">
                          No patients found.
                        </td>
                      </tr>
                    ) : (
                      dietData.map((item) => (
                        <tr key={item.uhid}>
                          <td>
                            {item.patientName}
                            <br />
                            <small className="text-muted">{item.uhid}</small>
                          </td>
                          <td>{item.mobileNo}</td>
                          <td>{item.admissionNo}</td>
                          <td>{item.wardBed}</td>
                          <td>{item.currentDietCategory}</td>
                          <td>
                            <span
                              className="badge"
                              style={getDietStatusColor(item.dietStatus)}
                            >
                              {item.dietStatus}
                            </span>
                          </td>
                          <td>{item.specialInstruction}</td>
                          <td className="text-center">
                            {item.dietStatus === "Not Assigned" ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-success"
                                onClick={(e) => handleDietAction(item, e)}
                              >
                                <i className="fa fa-plus me-1"></i>
                                New Diet Entry
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                onClick={(e) => handleDietAction(item, e)}
                              >
                                Change Diet
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                totalItems={totalElements}
                itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                totalPages={totalPages}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DieticianDashboard;