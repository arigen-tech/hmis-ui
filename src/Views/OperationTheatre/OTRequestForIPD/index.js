// OTRequestFromIPD.js
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination from "../../../Components/Pagination";
import { getRequest, postRequest } from "../../../service/apiService";
import { 
  ACTIVE_ADMISSION_LIST_OT, 
  MAS_WARD_GET_ALL_ACTIVE, 
  MAS_SURGERY_TYPE_GET_ALL,
  MAS_SURGERY_BY_SURGERY_TYPE,
  SAVE_OT_REQUEST,
  MAS_OPERATION_THEATRE_GET_ALL,
  GET_ALL_ACT_MAS_DEPT_FOR_DROPDOWN_END_URL,
  REQUEST_PARAM_DEPARTMENT_TYPE_CODE,
  FILTER_OPD_DEPT,
  DOCTOR_BY_SPECIALITY,
  GET_IP_DIAGNOSIS_ENTRY
} from "../../../config/apiConfig";

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
  const [wardOptions, setWardOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ----- Detail form state -----
  const [detailForm, setDetailForm] = useState({
    // Surgery Details
    departmentId: "",
    surgeryType: "",
    surgery: "",
    majorMinor: "",
    diagnosis: "",
    primarySurgeon: "",
    priority: "Elective",
    // Preferred OT Schedule
    preferredDate: "",
    preferredOT: "",
    preferredStartTime: "",
    preferredEndTime: "",
    expectedDuration: "",
    // Special Instructions
    specialInstructions: "",
  });

  // Surgery types and surgeries
  const [departments, setDepartments] = useState([]);
  const [surgeons, setSurgeons] = useState([]);
  const [surgeryTypes, setSurgeryTypes] = useState([]);
  const [surgeriesList, setSurgeriesList] = useState([]);
  const [operationTheatres, setOperationTheatres] = useState([]);

  // ----- API Fetching -----
  const fetchWards = async () => {
    try {
      const res = await getRequest(MAS_WARD_GET_ALL_ACTIVE);
      if (res?.status === 200 && Array.isArray(res.response)) {
        setWardOptions(res.response);
      }
    } catch (err) {
      console.error("Error fetching wards", err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await getRequest(`${GET_ALL_ACT_MAS_DEPT_FOR_DROPDOWN_END_URL}?${REQUEST_PARAM_DEPARTMENT_TYPE_CODE}=${FILTER_OPD_DEPT}`);
      if (res?.status === 200 && Array.isArray(res.response)) {
        setDepartments(res.response);
      }
    } catch (err) {
      console.error("Error fetching departments", err);
    }
  };

  const fetchSurgeons = async (departmentId) => {
    if (!departmentId) {
      setSurgeons([]);
      return;
    }
    try {
      const res = await getRequest(`${DOCTOR_BY_SPECIALITY}${departmentId}`);
      if (res?.status === 200 && Array.isArray(res.response)) {
        setSurgeons(res.response);
      }
    } catch (err) {
      console.error("Error fetching surgeons", err);
    }
  };

  const fetchSurgeryTypes = async () => {
    try {
      const res = await getRequest(MAS_SURGERY_TYPE_GET_ALL);
      if (res?.status === 200 && Array.isArray(res.response)) {
        setSurgeryTypes(res.response);
      }
    } catch (err) {
      console.error("Error fetching surgery types", err);
    }
  };

  const fetchSurgeries = async (surgeryTypeId) => {
    if (!surgeryTypeId) {
      setSurgeriesList([]);
      return;
    }
    try {
      const res = await getRequest(`${MAS_SURGERY_BY_SURGERY_TYPE}/${surgeryTypeId}`);
      if (res?.status === 200 && Array.isArray(res.response)) {
        setSurgeriesList(res.response);
      }
    } catch (err) {
      console.error("Error fetching surgeries", err);
    }
  };

  const fetchOperationTheatres = async () => {
    try {
      const res = await getRequest(`${MAS_OPERATION_THEATRE_GET_ALL}/1`);
      if (res?.status === 200 && Array.isArray(res.response)) {
        setOperationTheatres(res.response);
      }
    } catch (err) {
      console.error("Error fetching OTs", err);
    }
  };

  const fetchAdmissions = async (page = 1, isInitial = false) => {
    if (isInitial) setLoading(true);
    else setListLoading(true);

    try {
      const queryParams = new URLSearchParams({
        page: page - 1,
        size: 5,
        patientName: searchQuery,
        admissionNo: searchQuery,
        mobileNo: mobileNo,
        wardId: wardFilter
      });
      // Remove empty params
      const keysForDel = [];
      queryParams.forEach((value, key) => {
        if (!value) keysForDel.push(key);
      });
      keysForDel.forEach(key => queryParams.delete(key));

      const res = await getRequest(`${ACTIVE_ADMISSION_LIST_OT}?${queryParams.toString()}`);
      if (res?.status === 200 && res.response) {
        setAdmissions(res.response.content || []);
        setTotalItems(res.response.totalElements || 0);
        setTotalPages(res.response.totalPages || 0);
      } else {
        setAdmissions([]);
      }
    } catch (err) {
      console.error("Error fetching admissions", err);
    } finally {
      setLoading(false);
      setListLoading(false);
    }
  };

  // ----- Effects -----
  useEffect(() => {
    fetchWards();
    fetchSurgeryTypes();
    fetchDepartments();
    fetchOperationTheatres();
    fetchAdmissions(1, true);
  }, []);

  useEffect(() => {
    fetchSurgeons(detailForm.departmentId);
  }, [detailForm.departmentId]);

  // ----- Handlers -----
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchAdmissions(page, false);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchAdmissions(1, false);
  };

  const handleReset = () => {
    setSearchQuery("");
    setMobileNo("");
    setWardFilter("");
    setCurrentPage(1);
    // Fetch with empty params directly since state updates might be batched
    const queryParams = new URLSearchParams({ page: 0, size: 5 });
    setListLoading(true);
    getRequest(`${ACTIVE_ADMISSION_LIST_OT}?${queryParams.toString()}`)
      .then(res => {
        if (res?.status === 200 && res.response) {
          setAdmissions(res.response.content || []);
          setTotalItems(res.response.totalElements || 0);
          setTotalPages(res.response.totalPages || 0);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setListLoading(false));
  };

  // ----- Row click -> Detail view -----
  const handleRowClick = async (admission) => {
    setSelectedAdmission(admission);
    
    setLoading(true);
    let finalDiagnosis = admission.diagnosis || "";

    try {
      const res = await getRequest(`${GET_IP_DIAGNOSIS_ENTRY}/${admission.inpatientId}`);
      if (res?.status === 200 && Array.isArray(res.response) && res.response.length > 0) {
        let diagnosesList = [];
        if (admission.diagnosis) {
          diagnosesList.push(admission.diagnosis);
        }
        res.response.forEach(item => {
          if (item.diagnosis && !diagnosesList.includes(item.diagnosis)) {
             diagnosesList.push(item.diagnosis);
          }
        });
        finalDiagnosis = diagnosesList.join(", ");
      }
    } catch (err) {
      console.error("Error fetching IP diagnosis entry", err);
    }
    
    setLoading(false);

    // Pre-fill detail form with any existing data (dummy for now)
    setDetailForm({
      departmentId: "",
      surgeryType: "",
      surgery: "",
      majorMinor: "",
      diagnosis: finalDiagnosis,
      primarySurgeon: "",
      priority: "Elective",
      preferredDate: "",
      preferredOT: "",
      preferredStartTime: "",
      preferredEndTime: "",
      expectedDuration: "",
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
    setDetailForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "departmentId") {
        updated.primarySurgeon = "";
      }
      if (field === "surgeryType") {
        updated.surgery = "";
        updated.majorMinor = "";
        fetchSurgeries(value);
      }
      if (field === "surgery") {
        const selectedSurgery = surgeriesList.find(s => s.surgeryId.toString() === value.toString());
        if (selectedSurgery) {
          updated.majorMinor = selectedSurgery.surgeryLevel 
            ? selectedSurgery.surgeryLevel.charAt(0).toUpperCase() + selectedSurgery.surgeryLevel.slice(1).toLowerCase() 
            : "";
        } else {
          updated.majorMinor = "";
        }
      }
      if (field === "preferredStartTime" || field === "preferredEndTime") {
        const startTime = field === "preferredStartTime" ? value : updated.preferredStartTime;
        const endTime = field === "preferredEndTime" ? value : updated.preferredEndTime;
        if (startTime && endTime) {
          const [sHour, sMinute] = startTime.split(':').map(Number);
          const [eHour, eMinute] = endTime.split(':').map(Number);
          let sTotal = sHour * 60 + sMinute;
          let eTotal = eHour * 60 + eMinute;
          if (eTotal < sTotal) eTotal += 24 * 60; // Next day
          updated.expectedDuration = String(eTotal - sTotal);
        } else {
          updated.expectedDuration = "";
        }
      }
      return updated;
    });
  };

  // ----- Submit OT Request -----
  const handleSubmit = async () => {
    // Validate required fields
    if (!detailForm.departmentId || !detailForm.surgeryType || !detailForm.surgery || !detailForm.diagnosis || !detailForm.primarySurgeon || !detailForm.preferredDate || !detailForm.preferredOT || !detailForm.preferredStartTime || !detailForm.preferredEndTime) {
      showPopup("Please fill all required fields.", "error");
      return;
    }

    const parseTime = (timeString) => {
      if (!timeString) return null;
      if (timeString.split(':').length === 2) {
        return `${timeString}:00`;
      }
      return timeString;
    };

    const payload = {
      inpatientId: selectedAdmission?.inpatientId || 0,
      patientId: selectedAdmission?.patientId || 0,
      visitId: selectedAdmission?.visitId || 0,
      hospitalId: parseInt(sessionStorage.getItem("hospitalId"), 10) || 12,
      surgeryTypeId: parseInt(detailForm.surgeryType, 10),
      surgeryId: parseInt(detailForm.surgery, 10),
      diagnosis: detailForm.diagnosis,
      departmentId: parseInt(detailForm.departmentId, 10),
      primarySurgeonId: parseInt(detailForm.primarySurgeon, 10),
      priority: detailForm.priority,
      preferredDate: detailForm.preferredDate,
      preferredOtId: parseInt(detailForm.preferredOT, 10) || 0,
      expectedDuration: parseInt(detailForm.expectedDuration, 10) || 0,
      specialInstructions: detailForm.specialInstructions,
      preferredStartTime: parseTime(detailForm.preferredStartTime),
      preferredEndTime: parseTime(detailForm.preferredEndTime)
    };

    setIsSubmitting(true);
    try {
      const response = await postRequest(SAVE_OT_REQUEST, payload);
      if (response && response.status === 200) {
        showPopup("OT Request submitted successfully!", "success", () => {
          handleBackToList();
        });
      } else {
        showPopup(response?.message || "Failed to submit OT Request.", "error");
      }
    } catch (err) {
      console.error(err);
      showPopup("An error occurred while submitting OT Request.", "error");
    } finally {
      setIsSubmitting(false);
    }
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
                          value={selectedAdmission.age || selectedAdmission.gender ? `${selectedAdmission.age} / ${selectedAdmission.gender}` : ""}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Mobile No.</label>
                        <input
                          type="text"
                          className="form-control"
                          readOnly
                          value={selectedAdmission.mobileNo}
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
                        <label className="form-label fw-bold">Consultant</label>
                        <input
                          type="text"
                          className="form-control"
                          readOnly
                          value={selectedAdmission.doctorName || ""}
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
                            <option key={st.surgeryTypeId} value={st.surgeryTypeId}>{st.surgeryTypeName}</option>
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
                          {surgeriesList.map((s) => (
                            <option key={s.surgeryId} value={s.surgeryId}>{s.surgeryName}</option>
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
                        <label className="form-label fw-bold">Department *</label>
                        <select
                          className="form-select"
                          value={detailForm.departmentId}
                          onChange={(e) => handleDetailChange("departmentId", e.target.value)}
                        >
                          <option value="">Select Department</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>{dept.departmentName}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-bold">Primary Surgeon *</label>
                        <select
                          className="form-select"
                          value={detailForm.primarySurgeon}
                          onChange={(e) => handleDetailChange("primarySurgeon", e.target.value)}
                          disabled={!detailForm.departmentId}
                        >
                          <option value="">Select Surgeon</option>
                          {surgeons.map((s) => (
                            <option key={s.userId} value={s.userId}>{s.firstName} {s.middleName || ""} {s.lastName}</option>
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
                          {operationTheatres.map((ot) => (
                            <option key={ot.otId} value={ot.otId}>{ot.otName}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-2 mb-3">
                        <label className="form-label fw-bold">Preferred Start *</label>
                        <input
                          type="time"
                          className="form-control"
                          value={detailForm.preferredStartTime}
                          onChange={(e) => handleDetailChange("preferredStartTime", e.target.value)}
                        />
                      </div>
                      <div className="col-md-2 mb-3">
                        <label className="form-label fw-bold">Preferred End *</label>
                        <input
                          type="time"
                          className="form-control"
                          value={detailForm.preferredEndTime}
                          onChange={(e) => handleDetailChange("preferredEndTime", e.target.value)}
                        />
                      </div>
                      <div className="col-md-2 mb-3">
                        <label className="form-label fw-bold">Duration (m)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={detailForm.expectedDuration}
                          readOnly
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
                      <option value="">All Wards</option>
                      {wardOptions.map((w) => (
                        <option key={w.wardId} value={w.wardId}>{w.wardName}</option>
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
              <div className="table-responsive position-relative">
                {listLoading && (
                  <div className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)', zIndex: 10 }}>
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                )}
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Admission No.</th>
                      <th>Patient Name</th>
                      <th>Age / Gender</th>
                      <th>Admission Date</th>
                      <th>Ward</th>
                      <th>Bed</th>
                      <th>Treating Doctor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admissions.length > 0 ? (
                      admissions.map((item) => (
                        <tr
                          key={item.inpatientId}
                          onClick={() => handleRowClick(item)}
                          style={{ cursor: "pointer" }}
                        >
                          <td>{item.admissionNo}</td>
                          <td>{item.patientName}</td>
                          <td>{item.age} / {item.gender}</td>
                          <td>{item.admissionDateTime ? new Date(item.admissionDateTime).toLocaleDateString('en-GB') : ""}</td>
                          <td>{item.ward}</td>
                          <td>{item.bed}</td>
                          <td>{item.doctorName || "-"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">No records found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                totalItems={totalItems}
                itemsPerPage={5}
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