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

  // Dashboard grid data - UI only placeholder rows matching the wireframe
  const [dietData, setDietData] = useState([
    {
      uhid: "UHID-000101",
      patientName: "Ramesh Kumar",
      mobileNo: "98XXXX1234",
      admissionNo: "ADM-2025-000345",
      wardBed: "General Ward-A / Bed-05",
      currentDietCategory: "Liquid",
      dietStatus: "Active",
      specialInstruction: "Post-surgery",
    },
    {
      uhid: "UHID-000214",
      patientName: "Anita Sharma",
      mobileNo: "97XXXX5678",
      admissionNo: "ADM-2025-000412",
      wardBed: "ICU-1 / Bed-02",
      currentDietCategory: "Liquid",
      dietStatus: "Active",
      specialInstruction: "NPO except meds",
    },
    {
      uhid: "UHID-000178",
      patientName: "Mohan Singh",
      mobileNo: "99XXXX3344",
      admissionNo: "ADM-2025-000289",
      wardBed: "HDU-2 / Bed-01",
      currentDietCategory: "Renal",
      dietStatus: "Active",
      specialInstruction: "Low potassium, low salt",
    },
    {
      uhid: "UHID-000245",
      patientName: "Pooja Verma",
      mobileNo: "96XXXX8899",
      admissionNo: "ADM-2025-000501",
      wardBed: "Maternity Ward / Bed-07",
      currentDietCategory: "Normal",
      dietStatus: "Active",
      specialInstruction: "Lactating mother diet",
    },
    {
      uhid: "UHID-000309",
      patientName: "Suresh Patel",
      mobileNo: "95XXXX7712",
      admissionNo: "ADM-2025-000566",
      wardBed: "General Ward-B / Bed-03",
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
    patientId: "E00001",
    title: "Mr.",
    firstName: "First Name",
    lastName: "Last Name",
    gender: "Male",
    age: "65",
  });

  // ---------- Health Information (Auto-Populated, Read-Only) ----------
  const [healthInfo, setHealthInfo] = useState({
    height: "170",
    weight: "80",
    temperature: "98.6",
    bpSystolic: "140",
    bpDiastolic: "90",
    pulse: "80",
    bmi: "27.7",
    rr: "16",
    spo2: "98",
    bloodSugarLevels: "90",
    bloodCholesterolLevels: "190",
    chronicDisease: "Hypertension",
  });

  // ---------- Ward Details (Auto-Populated, Read-Only) ----------
  const [wardDetails, setWardDetails] = useState({
    wardBed: "General Ward-A / Bed-05",
    admissionNo: "ADM-2025-000345",
    admissionDate: "10-Aug-2025",
    attendingDoctor: "Dr. S. Verma",
  });

  // ---------- Diet History (Previous diet entries - shown if not first entry) ----------
  const [dietHistory, setDietHistory] = useState([
    {
      id: 1,
      dietCategory: "Diabetic",
      fromDateTime: "10-Aug-2025 08:00",
      toDateTime: "12-Aug-2025 09:00",
      specialInstruction: "No sugar, low carb",
      orderedBy: "Dietician - Dr. Neha Mehta",
      status: "Completed",
      completedOn: "12-Aug-2025 09:00",
    },
    {
      id: 2,
      dietCategory: "Liquid",
      fromDateTime: "12-Aug-2025 09:01",
      toDateTime: "14-Aug-2025 07:30",
      specialInstruction: "Post-surgery",
      orderedBy: "Doctor - Dr. S. Verma",
      status: "Completed",
      completedOn: "14-Aug-2025 07:30",
    },
    {
      id: 3,
      dietCategory: "Soft",
      fromDateTime: "14-Aug-2025 07:31",
      toDateTime: "16-Aug-2025 08:00",
      specialInstruction: "Easy digest",
      orderedBy: "Dietician - Ms. Kavita Rao",
      status: "Completed",
      completedOn: "16-Aug-2025 08:00",
    },
    {
      id: 4,
      dietCategory: "Normal",
      fromDateTime: "16-Aug-2025 08:01",
      toDateTime: null,
      specialInstruction: "High protein",
      orderedBy: "Dietician - Ms. Kavita Rao",
      status: "Active",
      completedOn: null,
    },
  ]);

  // ---------- New Diet Entry (Manual Entry) ----------
  const [newDietEntry, setNewDietEntry] = useState({
    dietCategory: "",
    specialInstruction: "",
    effectiveFrom: "",
    orderedBy: "Dietician - Ms. Kavita Rao", // auto-filled from logged in user
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
    // UI only - placeholder for stop diet action
    console.log("Stopping diet entry:", entryId);
    setIsStopping(null);
  };

  const handleSaveNewDiet = () => {
    setIsSaving(true);
    // UI only - placeholder for save action
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

  // ---------- Patient Details (Read-Only) ----------
  const [patientDetails, setPatientDetails] = useState({
    patientName: "Anita Sharma",
    admissionNo: "ADM-2025-000412",
  });

  // ---------- Diet Order (Read-Only) ----------
  const [dietOrder, setDietOrder] = useState({
    dietCategory: "Liquid",
    specialInstruction: "Post-surgery, NPO except meds",
    effectiveFrom: "12-Aug-2025 09:01 AM",
    orderedBy: "Dietician - Ms. Kavita Rao",
  });

  // ---------- Diet Execution History + Capture (Unified Table) ----------
  const [executionEntries, setExecutionEntries] = useState([
    {
      id: 1,
      meal: "Breakfast",
      date: "15-Aug-2025",
      served: "Yes",
      timeServed: "08:10 AM",
      quantity: "Full",
      reasonIfNil: "-",
      shift: "Morning",
      enteredBy: "Nurse Anita",
      status: "Finalized",
    },
    {
      id: 2,
      meal: "Lunch",
      date: "15-Aug-2025",
      served: "Yes",
      timeServed: "01:05 PM",
      quantity: "Half",
      reasonIfNil: "Nausea",
      shift: "Afternoon",
      enteredBy: "Nurse Anita",
      status: "Finalized",
    },
    {
      id: 3,
      meal: "Dinner",
      date: "15-Aug-2025",
      served: "No",
      timeServed: "-",
      quantity: "Nil",
      reasonIfNil: "NPO",
      shift: "Night",
      enteredBy: "Nurse Rohit",
      status: "Finalized",
    },
    {
      id: 4,
      meal: "New Entry",
      date: "16-Aug-2025",
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
    // UI only - placeholder for adding a new meal execution entry
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
                  <i className="icofont-clip-board me-2"></i>
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
                {/* ============ PATIENT DETAILS ============ */}
                <div className="row mb-3">
                  <div className="col-sm-12">
                    <div className="card shadow mb-3">
                      <div className="card-header border-bottom-1 py-3">
                        <h6 className="fw-bold mb-0">
                          <i className="icofont-user-alt-7 me-2"></i>
                          Patient Details
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-md-4">
                            <label className="form-label">
                              Patient Name
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={patientDetails.patientName}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">
                              Admission No
                            </label>
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

                {/* ============ DIET ORDER (READ-ONLY) ============ */}
                <div className="row mb-3">
                  <div className="col-sm-12">
                    <div className="card shadow mb-3">
                      <div className="card-header border-bottom-1 py-3">
                        <h6 className="fw-bold mb-0">
                          <i className="icofont-food-basket me-2"></i>
                          Diet Order
                          <span className="badge bg-secondary ms-2">
                            Read-Only
                          </span>
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-md-3">
                            <label className="form-label">
                              Diet Category
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={dietOrder.dietCategory}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">
                              Special Instruction
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={dietOrder.specialInstruction}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">
                              Effective From
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={dietOrder.effectiveFrom}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="col-md-2">
                            <label className="form-label">
                              Ordered By
                            </label>
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

                {/* ============ DIET EXECUTION HISTORY + CAPTURE (UNIFIED TABLE) ============ */}
                <div className="row mb-3">
                  <div className="col-sm-12">
                    <div className="card shadow mb-3">
                      <div className="card-header border-bottom-1 py-3">
                        <h6 className="fw-bold mb-0">
                          <i className="icofont-table me-2"></i>
                          Diet Execution History + Capture
                          <span className="badge bg-info text-dark ms-2">
                            Unified Table
                          </span>
                        </h6>
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

                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={handleAddNewEntry}
                        >
                          <i className="icofont-plus me-1"></i>
                          New Entry
                        </button>

                        <div className="mt-2 mb-3">
                          <small className="text-muted">
                            <i className="icofont-info-circle me-1"></i>
                            This view shows what has been captured by the
                            Nursing Station for tracking purposes.
                          </small>
                        </div>
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
                <h4 className="card-title p-2 mb-0">
                  <i className="icofont-cutlery me-2"></i>
                  Patient Diet Entry
                </h4>
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

                {/* ============ PATIENT PROFILE & HEALTH INFORMATION ============ */}
                <div className="row mb-3">
                  <div className="col-md-12">
                    <div className="card shadow mb-3">
                      <div
                        className="card-header py-2"
                       
                      >
                        <h6 className="fw-bold mb-0">
                          Patient Profile
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-md-4">
                            <label className="form-label">
                              Patient ID
                            </label>
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
                            <label className="form-label">
                              First Name
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={patientProfile.firstName}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">
                              Last Name
                            </label>
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

                  <div className="col-md-12">
                    <div className="card shadow mb-3">
                      <div
                        className="card-header py-2"
                      
                      >
                        <h6 className="fw-bold mb-0">
                          Health Information
                        </h6>
                      </div>
                      <div className="card-body">
                        <form className="vital">
                          <div className="row g-3 align-items-center">
                            {/* Patient Height */}
                            <div className="col-md-4 d-flex">
                              <label className="form-label me-2">
                                Height<span className="text-danger">*</span>
                              </label>
                              <input
                                type="number"
                                className="form-control"
                                min={0}
                                placeholder="Height"
                                name="height"
                                value={healthInfo.height}
                                readOnly
                                disabled
                              />
                              <span className="input-group-text">cm</span>
                            </div>

                            {/* Weight */}
                            <div className="col-md-4 d-flex">
                              <label className="form-label me-2">
                                Weight<span className="text-danger">*</span>
                              </label>
                              <input
                                type="number"
                                min={0}
                                className="form-control"
                                placeholder="Weight"
                                name="weight"
                                value={healthInfo.weight}
                                readOnly
                                disabled
                              />
                              <span className="input-group-text">kg</span>
                            </div>

                            {/* Temperature */}
                            <div className="col-md-4 d-flex">
                              <label className="form-label me-2">
                                Temperature<span className="text-danger">*</span>
                              </label>
                              <input
                                type="number"
                                min={0}
                                className="form-control"
                                placeholder="Temperature"
                                name="temperature"
                                value={healthInfo.temperature}
                                readOnly
                                disabled
                              />
                              <span className="input-group-text">°F</span>
                            </div>

                            {/* BP (Systolic / Diastolic) */}
                            <div className="col-md-4 d-flex">
                              <label className="form-label me-2">
                                BP<span className="text-danger">*</span>
                              </label>
                              <input
                                type="number"
                                min={0}
                                className="form-control"
                                placeholder="Systolic"
                                name="systolicBP"
                                value={healthInfo.bpSystolic}
                                readOnly
                                disabled
                              />
                              <span className="input-group-text">/</span>
                              <input
                                type="number"
                                min={0}
                                className="form-control"
                                placeholder="Diastolic"
                                name="diastolicBP"
                                value={healthInfo.bpDiastolic}
                                readOnly
                                disabled
                              />
                              <span className="input-group-text">mmHg</span>
                            </div>

                            {/* Pulse */}
                            <div className="col-md-4 d-flex">
                              <label className="form-label me-2">
                                Pulse<span className="text-danger">*</span>
                              </label>
                              <input
                                type="number"
                                min={0}
                                className="form-control"
                                placeholder="Pulse"
                                name="pulse"
                                value={healthInfo.pulse}
                                readOnly
                                disabled
                              />
                              <span className="input-group-text">/min</span>
                            </div>

                            {/* BMI */}
                            <div className="col-md-4 d-flex">
                              <label className="form-label me-2">BMI</label>
                              <input
                                type="number"
                                min={0}
                                className="form-control"
                                placeholder="BMI"
                                name="bmi"
                                value={healthInfo.bmi}
                                readOnly
                                disabled
                              />
                              <span className="input-group-text">kg/m²</span>
                            </div>

                            {/* RR */}
                            <div className="col-md-4 d-flex">
                              <label className="form-label me-2">
                                RR<span className="text-danger">*</span>
                              </label>
                              <input
                                type="number"
                                min={0}
                                className="form-control"
                                placeholder="RR"
                                name="rr"
                                value={healthInfo.rr}
                                readOnly
                                disabled
                              />
                              <span className="input-group-text">/min</span>
                            </div>

                            {/* SpO2 */}
                            <div className="col-md-4 d-flex">
                              <label className="form-label me-2">
                                SpO2<span className="text-danger">*</span>
                              </label>
                              <input
                                type="number"
                                min={0}
                                className="form-control"
                                placeholder="SpO2"
                                name="spo2"
                                value={healthInfo.spo2}
                                readOnly
                                disabled
                              />
                              <span className="input-group-text">%</span>
                            </div>
                          </div>
                        </form>
                        {/* Additional health fields not in vital form */}
                        <div className="row g-3 mt-3">
                          <div className="col-md-3">
                            <label className="form-label">
                              Blood Sugar Levels
                            </label>
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
                          <div className="col-md-3">
                            <label className="form-label">
                              Blood Cholesterol Levels
                            </label>
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
                          <div className="col-md-3">
                            <label className="form-label">
                              Chronic Disease
                            </label>
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

                {/* ============ WARD DETAILS ============ */}
                <div className="row mb-3">
                  <div className="col-md-12">
                    <div className="card shadow mb-3">
                      <div
                        className="card-header py-2"
                      
                      >
                        <h6 className="fw-bold mb-0">
                          Ward Details
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-md-3">
                            <label className="form-label">
                              Ward / Bed
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={wardDetails.wardBed}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">
                              Admission No
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={wardDetails.admissionNo}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">
                              Admission Date
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={wardDetails.admissionDate}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">
                              Attending Doctor
                            </label>
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

                {/* ============ DIET HISTORY (shown only if previous entries exist) ============ */}
                {dietHistory.length > 0 && (
                  <div className="row mb-3">
                    <div className="col-sm-12">
                      <div className="card shadow mb-3">
                        <div className="card-header  justify-content-between align-items-center">
                          <h6 className="fw-bold mb-0">
                            Diet History
                          </h6>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
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
                                        style={getStatusColor(
                                          entry.status,
                                        )}
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
                                          onClick={() =>
                                            handleStopDiet(entry.id)
                                          }
                                          disabled={
                                            isStopping === entry.id
                                          }
                                        >
                                          {isStopping === entry.id ? (
                                            <span
                                              className="spinner-border spinner-border-sm"
                                              role="status"
                                              aria-hidden="true"
                                            ></span>
                                          ) : (
                                            "Stop"
                                          )}
                                        </button>
                                      ) : (
                                        <span className="text-muted">
                                          -
                                        </span>
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

                {/* ============ NEW DIET ENTRY ============ */}
                <div className="row mb-3">
                  <div className="col-sm-12">
                    <div className="card shadow mb-3">
                      <div className="card-header border-bottom-1 py-3">
                        <h6 className="fw-bold mb-0">
                          New Diet Entry
                         
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-md-3">
                            <label className="form-label">
                              Diet Category *
                            </label>
                            <select
                              className={`form-select ${hasError("dietCategory")}`}
                              id="dietCategory"
                              value={newDietEntry.dietCategory}
                              onChange={handleNewEntryChange}
                            >
                              <option value="">
                                Select Diet Category
                              </option>
                              {dietCategoryOptions.map((option) => (
                                <option
                                  key={option.value}
                                  value={option.value}
                                >
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
                            <label className="form-label">
                              Special Instruction
                            </label>
                            <textarea
                              className="form-control"
                              id="specialInstruction"
                              placeholder="Enter Special Instruction"
                              value={newDietEntry.specialInstruction}
                              onChange={handleNewEntryChange}
                              rows={1}
                            ></textarea>
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">
                              Effective From *
                            </label>
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
                            <label className="form-label">
                              Ordered By
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={newDietEntry.orderedBy}
                              readOnly
                              disabled
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ============ ACTION BUTTONS ============ */}
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
                        ></span>
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
                <i className="fa fa-cutlery me-2"></i>
                Dashboard Grid - Diet Management
              </h4>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={handleRefresh}
                title="Refresh"
                disabled={loading || isRefreshing}
              >
                <i
                  className={`fa fa-refresh ${isRefreshing ? "fa-spin" : ""}`}
                ></i>
              </button>
            </div>

            <div className="card-body">
              {/* ============ SEARCH ============ */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <label className="form-label fw-bold">
                    Patient Name
                  </label>
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
                        ></span>
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
                        ></span>
                        Showing All...
                      </>
                    ) : (
                      "Show All"
                    )}
                  </button>
                </div>
              </div>

              {/* ============ DIET GRID TABLE ============ */}
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead
                    style={{ backgroundColor: "#95a5a6", color: "white" }}
                  >
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
                        <td
                          colSpan={8}
                          className="text-center py-4 text-muted"
                        >
                          No patients found.
                        </td>
                      </tr>
                    ) : (
                      dietData.map((item) => (
                        <tr key={item.uhid}>
                          <td>
                            {item.patientName}
                            <br />
                            <small className="text-muted">
                              {item.uhid}
                            </small>
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