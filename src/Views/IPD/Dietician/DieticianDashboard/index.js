import React, { useState, useEffect } from "react";
import LoadingScreen from "../../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../../Components/Pagination";
import { getRequest, postRequest } from "../../../../service/apiService";
import { MAS_WARD_GET_ALL_ACTIVE, ACTIVE_DIET_BY_INPATIENT, GET_PREVIOUS_DIET_ORDER_HISTORY, SAVE_DIET_ORDER_BY_INPATIENT, MAS_DIET_TYPE_GET_ALL, GET_CURRENT_USER_PROFILE_BY_NAME, GET_VITALS_DETAILS_BY_INPATIENT_ID, GET_CURRENT_ACTIVE_DIET_SCHEDULE } from "../../../../config/apiConfig";
import Swal from "sweetalert2";

const DieticianDashboard = () => {
  // ---------- View switching: "list" | "dietEntry" | "tracking" ----------
  const [currentView, setCurrentView] = useState("list");
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [tableLoading, setTableLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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

  const [dietData, setDietData] = useState([]);
  
  // Wards and Diet Categories data for dropdowns
  const [wards, setWards] = useState([]);
  const [dietCategoryOptions, setDietCategoryOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserName, setCurrentUserName] = useState(sessionStorage.getItem("username") || "System");

  // Fetch Wards and Diet Categories on component mount
  useEffect(() => {
    const fetchDropdowns = async () => {
      setIsLoading(true);
      try {
        const username = localStorage.getItem("username") || sessionStorage.getItem("username");
        let userProfilePromise = null;
        if (username) {
          userProfilePromise = getRequest(`${GET_CURRENT_USER_PROFILE_BY_NAME}/${username}`);
        }

        const [wardsRes, categoriesRes, userProfileRes] = await Promise.all([
          getRequest(MAS_WARD_GET_ALL_ACTIVE),
          getRequest(MAS_DIET_TYPE_GET_ALL),
          userProfilePromise
        ]);
        
        if (wardsRes?.status === 200 && wardsRes.response) {
          setWards(wardsRes.response);
        }
        
        if (categoriesRes?.status === 200 && categoriesRes.response) {
          setDietCategoryOptions(categoriesRes.response.map(cat => ({
            value: cat.dietTypeId,
            label: cat.dietTypeName
          })));
        }

        if (userProfileRes?.status === 200 && userProfileRes.response) {
          const docName = userProfileRes.response.firstName
            ? [userProfileRes.response.firstName, userProfileRes.response.middleName, userProfileRes.response.lastName].filter(Boolean).join(" ")
            : (userProfileRes.response.name || userProfileRes.response.userName || username);
          
          setCurrentUserName(docName);
          setNewDietEntry(prev => ({ ...prev, orderedBy: docName }));
        }

      } catch (err) {
        console.error("Error fetching dropdowns:", err);
      } finally {
        setIsLoading(false);
      }
    };
    const init = async () => {
      setIsInitialLoad(true);
      await fetchDropdowns();
      await fetchDieticianDashboard(0);
      setIsInitialLoad(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDieticianDashboard = async (page = 0) => {
    setTableLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page,
        size: DEFAULT_ITEMS_PER_PAGE,
      });

      if (searchPatientName) queryParams.append("patientName", searchPatientName);
      if (searchMobile) queryParams.append("mobileNo", searchMobile);
      if (searchWard) queryParams.append("wardId", searchWard);

      const res = await getRequest(`${ACTIVE_DIET_BY_INPATIENT}?${queryParams.toString()}`);
      if (res?.status === 200 && res.response) {
        setDietData(res.response.content || []);
        setTotalElements(res.response.totalElements || 0);
        setTotalPages(res.response.totalPages || 0);
      } else {
        setDietData([]);
        setTotalElements(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error("Error fetching dietician dashboard:", error);
      setDietData([]);
    } finally {
      setTableLoading(false);
    }
  };

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
    fetchDieticianDashboard(page - 1)
  };

  // Handle search
  const handleSearch = async () => {
    setIsSearching(true);
    setCurrentPage(1);
    await fetchDieticianDashboard(0);
    setIsSearching(false);
  };

  const handleShowAll = async () => {
    setIsShowingAll(true);

    setSearchPatientName("");
    setSearchMobile("");
    setSearchWard("");
    setCurrentPage(1);

    // Call API with empty filters
    setTableLoading(true);
    try {
      const res = await getRequest(`${ACTIVE_DIET_BY_INPATIENT}?page=0&size=${DEFAULT_ITEMS_PER_PAGE}`);
      if (res?.status === 200 && res.response) {
        setDietData(res.response.content || []);
        setTotalElements(res.response.totalElements || 0);
        setTotalPages(res.response.totalPages || 0);
      } else {
        setDietData([]);
      }
    } catch (error) {
      console.error("Error fetching dietician dashboard:", error);
    } finally {
      setTableLoading(false);
    }
    setIsShowingAll(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDieticianDashboard(currentPage - 1)
    setIsRefreshing(false);
  };

  // Navigates to the patient diet entry screen (Change Diet / New Diet Entry)
  const handleDietAction = (item, e) => {
    e.stopPropagation();
    setSelectedPatient(item);

    // Auto-fill patient profile
    setPatientProfile({
      patientId: item.uhid,
      patientName: item.patientName,
      gender: item.gender,
      age: item.age,
    });

    // Auto-fill ward details
    setWardDetails({
      wardBed: (item.ward && item.bed) ? `${item.ward} / ${item.bed}` : '-',
      admissionNo: item.admissionNo,
      admissionDate: item.admissionDateTime ? new Date(item.admissionDateTime).toLocaleDateString('en-GB') : '-',
      attendingDoctor: item.doctorName || '-',
    });

    fetchDietHistory(item.inpatientId);
    fetchVitalsDetails(item.inpatientId);
    setCurrentView("dietEntry");
  };

  const fetchDietHistory = async (inpatientId) => {
    try {
      const res = await getRequest(`${GET_PREVIOUS_DIET_ORDER_HISTORY}?inpatientId=${inpatientId}`);
      if (res?.status === 200 && res.response) {
        setDietHistory(res.response);
      } else {
        setDietHistory([]);
      }
    } catch (err) {
      console.error("Error fetching diet history:", err);
      setDietHistory([]);
    }
  };

  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [vitalsLoading, setVitalsLoading] = useState(false);

  const formatDateAndTime = (datetimeStr) => {
    if (!datetimeStr) return { date: "", time: "" }
    const d = new Date(datetimeStr)
    if (isNaN(d.getTime())) return { date: "", time: "" }
    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, "0")
    const minutes = String(d.getMinutes()).padStart(2, "0")
    return {
      date: `${day}/${month}/${year}`,
      time: `${hours}:${minutes}`
    }
  }

  const fetchVitalsDetails = async (inpatientId) => {
    if (!inpatientId) {
      setVitalsHistory([]);
      return;
    }
    setVitalsLoading(true);
    try {
      const response = await getRequest(`${GET_VITALS_DETAILS_BY_INPATIENT_ID}/${inpatientId}`);
      if (response?.status === 200 && Array.isArray(response.response)) {
        const sorted = [...response.response].sort((a, b) => new Date(b.observationDatetime) - new Date(a.observationDatetime));
        const mapped = sorted.map(item => {
          const { date, time } = formatDateAndTime(item.observationDatetime);
          return {
            id: item.vitalId || Date.now() + Math.random(),
            date: date,
            time: time,
            temperature: item.temperature !== null && item.temperature !== undefined ? `${item.temperature} °F` : "-",
            pulse: item.pulse !== null && item.pulse !== undefined ? String(item.pulse) : "-",
            respiration: item.respiration !== null && item.respiration !== undefined ? String(item.respiration) : "-",
            bp: item.bpSystolic && item.bpDiastolic ? `${item.bpSystolic}/${item.bpDiastolic}` : "-",
            o2Saturation: item.spo2 !== null && item.spo2 !== undefined ? `${item.spo2}%` : "-",
            pain: item.painScore !== null && item.painScore !== undefined ? String(item.painScore) : "-"
          }
        });
        setVitalsHistory(mapped);
      } else {
        setVitalsHistory([]);
      }
    } catch (error) {
      console.error("Error fetching vitals details:", error);
      setVitalsHistory([]);
    } finally {
      setVitalsLoading(false);
    }
  };

  /* =========================================================================
     =========================== DIET ENTRY VIEW STATE ======================
     ========================================================================= */

  // ---------- Patient Profile (Auto-Populated, Read-Only) ----------
  const [patientProfile, setPatientProfile] = useState({
    patientId: "P00042",
    patientName: "Ananya Sharma",
    gender: "Female",
    age: "42",
  });

  // ---------- Ward Details (Auto-Populated, Read-Only) ----------
  const [wardDetails, setWardDetails] = useState({
    wardBed: "ICU-2 / Bed-04",
    admissionNo: "ADM-2025-000812",
    admissionDate: "15-Sep-2025",
    attendingDoctor: "Dr. R. Deshmukh",
  });

  // ---------- Diet History (Previous diet entries) ----------
  const [dietHistory, setDietHistory] = useState([]);

  // ---------- New Diet Entry ----------
  const [newDietEntry, setNewDietEntry] = useState({
    dietCategory: "",
    specialInstruction: "",
    effectiveFrom: "",
    orderedBy: currentUserName,
    remarks: "",
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isStopping, setIsStopping] = useState(null);

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

  const validateNewEntry = () => {
    const newErrors = {};
    if (!newDietEntry.dietCategory) newErrors.dietCategory = "Diet category is required";
    if (!newDietEntry.effectiveFrom) newErrors.effectiveFrom = "Date is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveNewDiet = async (e) => {
    e.preventDefault();
    if (!validateNewEntry()) return;
    
    setIsSaving(true);
    try {
      const payload = {
        dietTypeId: parseInt(newDietEntry.dietCategory),
        specialInstruction: newDietEntry.specialInstruction,
        effectiveFrom: newDietEntry.effectiveFrom.split("T")[0],
        orderedBy: parseInt(localStorage.getItem("userId") || "0", 10),
        remark: newDietEntry.remarks,
        inpatientId: selectedPatient?.inpatientId || 0
      };

      const res = await postRequest(SAVE_DIET_ORDER_BY_INPATIENT, payload);
      
      if (res?.status === 200) {
        
        // Reset form
        setNewDietEntry({
          ...newDietEntry,
          dietCategory: "",
          specialInstruction: "",
          effectiveFrom: "",
          remarks: "",
          orderedBy: currentUserName,
        });
        setErrors({});
        
        await Swal.fire({
          icon: "success",
          title: "Success",
          text: "Diet order saved successfully!",
        });

        // Refresh diet history after OK is clicked
        if (selectedPatient?.inpatientId) {
          fetchDietHistory(selectedPatient.inpatientId);
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to save diet order: " + (res?.message || "Unknown error"),
        });
      }
    } catch (err) {
      console.error("Error saving new diet:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error saving new diet order.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewFullDietHistory = () => {
    if (selectedPatient) {
      setPatientDetails({
        patientName: selectedPatient.patientName || "Unknown",
        admissionNo: selectedPatient.admissionNo || "Unknown",
      });
    }

    const activeDiet = dietHistory.find(d => d.status === 'A') || dietHistory[0] || {};
    setDietOrder({
      dietCategory: activeDiet.dietTypeName || "-",
      specialInstruction: activeDiet.specialInstruction || "-",
      effectiveFrom: activeDiet.fromDate || "-",
      orderedBy: activeDiet.orderedBy || "-",
    });

    fetchDietExecutionHistory(selectedPatient?.inpatientId || selectedPatient?.id || selectedPatient?.admissionNo, activeDiet.dietOrderId);
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

  const [executionEntries, setExecutionEntries] = useState([]);
  const [executionLoading, setExecutionLoading] = useState(false);

  const fetchDietExecutionHistory = async (inpatientId, dietOrderId) => {
    if (!inpatientId || !dietOrderId) {
      setExecutionEntries([]);
      return;
    }
    setExecutionLoading(true);
    try {
      const response = await getRequest(`${GET_CURRENT_ACTIVE_DIET_SCHEDULE}?inpatientId=${inpatientId}&dietOrderId=${dietOrderId}`);
      if (response?.status === 200 && Array.isArray(response.response)) {
        const mapped = response.response.map(entry => ({
          id: entry.dietScheduleId || Date.now() + Math.random(),
          meal: entry.mealType || "-",
          date: entry.date || "-",
          served: entry.status === "SERVED" ? "Yes" : (entry.status ? "No" : "-"),
          timeServed: entry.actualTime || "-",
          quantity: entry.consumed !== null && entry.consumed !== undefined ? `${entry.consumed}%` : "-",
          reasonIfNil: entry.remark || "-",
          shift: "-",
          enteredBy: entry.givenBy || "-",
          status: entry.status || "-",
        }));
        setExecutionEntries(mapped);
      } else {
        setExecutionEntries([]);
      }
    } catch (error) {
      console.error("Error fetching diet execution history:", error);
      setExecutionEntries([]);
    } finally {
      setExecutionLoading(false);
    }
  };

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
        {(isLoading || isInitialLoad) && <LoadingScreen />}

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
                        {executionLoading ? (
                          <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </div>
                        ) : executionEntries.length === 0 ? (
                          <div className="text-center py-4 text-muted">
                            No execution history found.
                          </div>
                        ) : (
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
                        )}

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
        {(isLoading || isInitialLoad) && <LoadingScreen />}

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
                {isLoading && (
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
                          <div className="col-md-3">
                            <label className="form-label">Patient ID (UHID)</label>
                            <input
                              type="text"
                              className="form-control"
                              value={patientProfile.patientId}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">Patient Name</label>
                            <input
                              type="text"
                              className="form-control"
                              value={patientProfile.patientName}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">Gender</label>
                            <input
                              type="text"
                              className="form-control"
                              value={patientProfile.gender}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="col-md-3">
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

                  {/* Vitals Entry (Read-only for Dietician) */}
                  <div className="col-md-12">
                    <div className="card shadow mb-3">
                      <div className="card-header py-2">
                        <h6 className="fw-bold mb-0">Health Information</h6>
                      </div>
                      <div className="card-body p-0">
                        {vitalsLoading ? (
                          <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </div>
                        ) : vitalsHistory.length === 0 ? (
                          <div className="text-center py-4 text-muted">
                            No vitals recorded.
                          </div>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-bordered table-hover mb-0 align-middle" style={{ fontSize: "0.8rem" }}>
                              <thead className="table-light">
                                <tr>
                                  <th style={{ maxWidth: "60px" }}>Date</th>
                                  <th style={{ minWidth: "60px" }}>Time</th>
                                  <th style={{ minWidth: "90px" }}>Temp.</th>
                                  <th style={{ minWidth: "90px" }}>Pulse (bpm)</th>
                                  <th style={{ minWidth: "60px" }}>Respiration</th>
                                  <th style={{ minWidth: "60px" }}>BP (mm/Hg)</th>
                                  <th style={{ minWidth: "60px" }}>O₂ Saturation</th>
                                  <th style={{ minWidth: "60px" }}>Pain</th>
                                </tr>
                              </thead>
                              <tbody>
                                {vitalsHistory.map((vitals) => (
                                  <tr key={vitals.id}>
                                    <td>{vitals.date}</td>
                                    <td>{vitals.time}</td>
                                    <td>{vitals.temperature}</td>
                                    <td>{vitals.pulse}</td>
                                    <td>{vitals.respiration}</td>
                                    <td>{vitals.bp}</td>
                                    <td>{vitals.o2Saturation}</td>
                                    <td>{vitals.pain}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
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
                                </tr>
                              </thead>
                              <tbody>
                                {dietHistory.map((entry) => {
                                  const displayStatus = entry.status === 'A' ? 'Active' : entry.status === 'C' ? 'Completed' : entry.status;
                                  return (
                                    <tr key={entry.dietOrderId || Math.random()}>
                                      <td>{entry.dietTypeName}</td>
                                      <td>{entry.fromDate}</td>
                                      <td>{entry.toDate || "-"}</td>
                                      <td>{entry.specialInstruction}</td>
                                      <td>{entry.orderedBy}</td>
                                      <td>
                                        <span
                                          className="badge"
                                          style={getStatusColor(displayStatus)}
                                        >
                                          {displayStatus}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
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
      {(isLoading || isInitialLoad) && <LoadingScreen />}

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
                  <select
                    className="form-select form-select-sm shadow-sm"
                    value={searchWard}
                    onChange={(e) => setSearchWard(e.target.value)}
                  >
                    <option value="">Select Ward</option>
                    {wards.map((ward) => (
                      <option key={ward.wardId} value={ward.wardId}>
                        {ward.wardName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-primary me-2"
                    onClick={handleSearch}
                    disabled={tableLoading || isSearching || isShowingAll}
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
                    disabled={tableLoading || isSearching || isShowingAll}
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
              <div style={{ position: "relative", minHeight: "200px" }}>
                {tableLoading && !isInitialLoad && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      backgroundColor: "rgba(255, 255, 255, 0.7)",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      zIndex: 5,
                    }}
                  >
                    <div className="d-flex flex-column align-items-center">
                      <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span className="mt-2 fw-bold text-primary">Loading Patients...</span>
                    </div>
                  </div>
                )}
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
                    {dietData.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4 text-muted">
                          No patients found.
                        </td>
                      </tr>
                    ) : (
                      dietData.map((item, index) => {
                        const displayStatus = item.dietStatus === 'A' ? 'Active' : item.dietStatus === 'C' ? 'Complete' : 'Not Assigned';
                        return (
                          <tr key={`${item.uhid || 'row'}-${index}`}>
                            <td>
                              {item.patientName}
                              <br />
                              <small className="text-muted">{item.uhid}</small>
                            </td>
                            <td>{item.mobileNo}</td>
                            <td>{item.admissionNo}</td>
                            <td>{item.ward && item.bed ? `${item.ward} / ${item.bed}` : '-'}</td>
                            <td>{item.dietTypeName || '-'}</td>
                            <td>
                              <span
                                className="badge"
                                style={getDietStatusColor(displayStatus)}
                              >
                                {displayStatus}
                              </span>
                            </td>
                            <td>{item.specialInstruction || "-"}</td>
                            <td className="text-center">
                              {displayStatus === "Not Assigned" ? (
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
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
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