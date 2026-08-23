import { useState, useEffect } from "react";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest } from "../../../service/apiService";
import { ACTIVE_ADMISSION_AND_DISCHARGE_ADMISSION_LIST, MAS_WARD_GET_ALL_ACTIVE, GET_ADMISSION_DETAILS_BY_INPATIENT } from "../../../config/apiConfig";
import DocumentPreview from "../../../Components/DocumentPreview";

// ---------- DUMMY ADMISSION DATA ----------
const dummyAdmissions = [
  {
    admissionNo: "IPD/2026/0129",
    patientName: "Farah Khan",
    uhid: "UH-90129",
    ageGender: "33 Y / Female",
    age: 33,
    gender: "Female",
    emergencyContact: "99XXXXXX77",
    mobileNo: "99XXXXXX77",
    patientContactNo: "99XXXXXX77",
    emergencyContactNo: "99XXXXXX77",
    admissionDateTime: "2026-08-16T11:00:00",
    category: "Female Surgical Ward",
    ward: "Female Surgical Ward",
    room: "R-06",
    bed: "B-02",
    doctorName: "Dr. Nair",
    los: "1 Day",
    status: "DISCHARGE IN PROCESS",
    diagnosis: "Laparoscopic cholecystectomy - post op day 1",
    address: "3, Rajouri Garden, Delhi",
    department: "General Surgery",
    admittingWard: "Female Surgical Ward",
    careLevel: "Normal",
    reasonForAdmission: "Gallstone disease with severe abdominal pain",
    initialDiagnosis: "Cholelithiasis with acute cholecystitis",
    icdDiagnosis: "K80 – Cholelithiasis",
    patientCondition: "Stable",
    admissionPriority: "Routine",
    remarks: "Post-operative day 1, recovering well",
    nokName: "Imran Khan",
    nokRelationship: "Spouse",
    nokContactNo: "99XXXXXX77",
    nokAddress: "3, Rajouri Garden, Delhi",
    admissionCategory: "IPD",
    admissionType: "Surgical",
    admissionSource: "OPD",
    referralTransfer: null,
    documents: [
      { id: 1, name: "Admission Slip", remarks: "Signed copy", fileName: "AdmissionSlip_IPD20260129.pdf" },
      { id: 2, name: "Consent Form", remarks: "Signed by patient", fileName: "ConsentForm_IPD20260129.pdf" },
      { id: 3, name: "Initial Assessment", remarks: "Completed by doctor", fileName: "InitialAssessment_IPD20260129.pdf" }
    ]
  },
  {
    admissionNo: "IPD/2026/0130",
    patientName: "Deepak Yadav",
    uhid: "UH-90130",
    ageGender: "52 Y / Male",
    age: 52,
    gender: "Male",
    emergencyContact: "91XXXXXX23",
    mobileNo: "91XXXXXX23",
    patientContactNo: "91XXXXXX23",
    emergencyContactNo: "91XXXXXX23",
    admissionDateTime: "2026-08-17T07:45:00",
    category: "ICU",
    ward: "ICU",
    room: "ICU-2",
    bed: "B-05",
    doctorName: "Dr. Mehta",
    los: "1 Day",
    status: "ADMITTED",
    diagnosis: "Acute MI - under observation",
    address: "18, Vikaspuri, Delhi",
    department: "Cardiology",
    admittingWard: "ICU",
    careLevel: "Critical",
    reasonForAdmission: "Chest pain and shortness of breath",
    initialDiagnosis: "Acute Myocardial Infarction",
    icdDiagnosis: "I21 – Acute myocardial infarction",
    patientCondition: "Critical",
    admissionPriority: "Emergency",
    remarks: "Under continuous cardiac monitoring",
    nokName: "Ramesh Yadav",
    nokRelationship: "Brother",
    nokContactNo: "91XXXXXX23",
    nokAddress: "18, Vikaspuri, Delhi",
    admissionCategory: "IPD",
    admissionType: "Emergency",
    admissionSource: "Emergency / Casualty",
    referralTransfer: {
      fromWard: "Emergency",
      toWard: "ICU",
      reason: "Critical care required"
    },
    documents: [
      { id: 1, name: "Admission Slip", remarks: "Signed copy", fileName: "AdmissionSlip_IPD20260130.pdf" },
      { id: 2, name: "Consent Form", remarks: "Signed by patient", fileName: "ConsentForm_IPD20260130.pdf" },
      { id: 3, name: "Initial Assessment", remarks: "Completed by doctor", fileName: "InitialAssessment_IPD20260130.pdf" }
    ]
  },
];

const ActiveAdmissionList = () => {
  // ---------- SEARCH STATE ----------
  const [searchPatientName, setSearchPatientName] = useState("");
  const [searchAdmissionNo, setSearchAdmissionNo] = useState("");
  const [searchMobileNo, setSearchMobileNo] = useState("");
  const [searchWard, setSearchWard] = useState("");
  const [wardOptions, setWardOptions] = useState([]);

  // ---------- LIST / PAGINATION STATE ----------
  const [displayData, setDisplayData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // ---------- DETAILS VIEW STATE ----------
  const [showDetails, setShowDetails] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [previewFilePath, setPreviewFilePath] = useState(null);

  // ---------- FORMAT HELPER ----------
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ---------- API FETCH ----------
  const fetchAdmissions = async (page = 1, pName = "", aNo = "", mobile = "", wId = "") => {
    setIsLoading(true);
    try {
      let url = `${ACTIVE_ADMISSION_AND_DISCHARGE_ADMISSION_LIST}?page=${page - 1}&size=${DEFAULT_ITEMS_PER_PAGE}&admissionStatus=1`;
      if (pName) url += `&patientName=${pName}`;
      if (aNo) url += `&admissionNo=${aNo}`;
      if (mobile) url += `&mobileNo=${mobile}`;
      if (wId) url += `&wardId=${wId}`;

      const res = await getRequest(url);
      if (res?.status === 200 && res?.response) {
        const content = res.response.content || [];
        setDisplayData(content);
        setTotalElements(res.response.totalElements || 0);
        setTotalPages(res.response.totalPages || 1);
      } else {
        setDisplayData([]);
        setTotalElements(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching active admissions:", error);
      setDisplayData([]);
      setTotalElements(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWards = async () => {
    try {
      const res = await getRequest(MAS_WARD_GET_ALL_ACTIVE);
      if (res?.status === 200 && res?.response) {
        setWardOptions(res.response);
      }
    } catch (error) {
      console.error("Error fetching wards:", error);
    }
  };

  // ---------- INITIAL LOAD ----------
  useEffect(() => {
    fetchWards();
    fetchAdmissions(1, "", "", "", "");
  }, []);

  // ---------- SEARCH ----------
  const handleSearch = () => {
    setCurrentPage(1);
    fetchAdmissions(1, searchPatientName.trim(), searchAdmissionNo.trim(), searchMobileNo.trim(), searchWard);
  };

  // ---------- SHOW ALL ----------
  const handleShowAll = () => {
    setSearchPatientName("");
    setSearchAdmissionNo("");
    setSearchMobileNo("");
    setSearchWard("");
    setCurrentPage(1);
    fetchAdmissions(1, "", "", "", "");
  };

  // ---------- PAGINATION ----------
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchAdmissions(page, searchPatientName.trim(), searchAdmissionNo.trim(), searchMobileNo.trim(), searchWard);
  };

  // ---------- ROW / VIEW CLICK -> OPEN DETAILS ----------
  const handleRowClick = async (admission) => {
    setIsLoading(true);
    try {
      const res = await getRequest(`${GET_ADMISSION_DETAILS_BY_INPATIENT}/${admission.inpatientId}`);
      if (res?.status === 200 && res?.response) {
        setSelectedAdmission(res.response);
        setShowDetails(true);
      }
    } catch (error) {
      console.error("Error fetching admission details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- BACK TO LIST ----------
  const handleBackToList = () => {
    setShowDetails(false);
    setSelectedAdmission(null);
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">
                {showDetails ? "Active Admission Details" : "Active Admission List"}
              </h4>
              {showDetails && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleBackToList}
                >
                  Back to list
                </button>
              )}
            </div>

            <div className="card-body">
              {/* ================= LIST VIEW ================= */}
              {!showDetails && (
                <>
                  {/* ---------- Search Section ---------- */}
                  <div className="mb-4">
                    <div className="card-body">
                      <div className="row g-3 align-items-end">
                        <div className="col-md-2">
                          <label className="form-label fw-semibold">Patient Name</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter patient name"
                            value={searchPatientName}
                            onChange={(e) => setSearchPatientName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                          />
                        </div>
                        <div className="col-md-2">
                          <label className="form-label fw-semibold">Admission No.</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter admission no."
                            value={searchAdmissionNo}
                            onChange={(e) => setSearchAdmissionNo(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                          />
                        </div>
                        <div className="col-md-2">
                          <label className="form-label fw-semibold">Mobile No.</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter mobile number"
                            value={searchMobileNo}
                            onChange={(e) => setSearchMobileNo(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-semibold">Ward</label>
                          <select
                            className="form-select"
                            value={searchWard}
                            onChange={(e) => setSearchWard(e.target.value)}
                          >
                            <option value="">All Wards</option>
                            {wardOptions.map((w) => (
                              <option key={w.wardId} value={w.wardId}>
                                {w.wardName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-3">
                          <div className="d-flex align-items-end gap-2">
                            <button
                              type="button"
                              className="btn btn-primary me-2"
                              onClick={handleSearch}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Searching...</>
                              ) : "Search"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={handleShowAll}
                              disabled={isLoading}
                            >
                              Show All
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ---------- Table ---------- */}
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Admission No.</th>
                          <th>Patient Name</th>
                          <th>Age / Gender</th>
                          <th>Patient Contact</th>
                          <th>Emergency Contact</th>
                          <th>Admission Date &amp; Time</th>
                          <th>Category</th>
                          <th>Ward</th>
                          <th>Room / Bed</th>
                          <th>Doctor Name</th>
                          <th>LOS</th>
                          <th>Current Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr>
                            <td colSpan="12" className="text-center py-4">
                              <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            </td>
                          </tr>
                        ) : displayData.length === 0 ? (
                          <tr>
                            <td colSpan="12" className="text-center py-3 text-muted">
                              No records found.
                            </td>
                          </tr>
                        ) : (
                          displayData.map((item) => (
                            <tr
                              key={item.admissionNo}
                              onClick={() => handleRowClick(item)}
                              role="button"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") handleRowClick(item);
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              <td>{item.admissionNo}</td>
                              <td>{item.patientName}</td>
                              <td>{item.age} / {item.gender}</td>
                              <td>{item.mobileNo}</td>
                              <td>{item.emergencyMobileNo}</td>
                              <td>{formatDate(item.admissionDateTime)}</td>
                              <td>{item.categoryName}</td>
                              <td>{item.ward}</td>
                              <td>{item.room} / {item.bed}</td>
                              <td>{item.doctorName}</td>
                              <td>{item.los}</td>
                              <td>{item.status}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* ---------- Pagination ---------- */}
                  {totalElements > 0 && !isLoading && (
                    <Pagination
                      totalItems={totalElements}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={handlePageChange}
                      totalPages={totalPages}
                    />
                  )}
                </>
              )}

              {/* ================= DETAILS VIEW (READ ONLY - ORIGINAL UI) ================= */}
              {showDetails && selectedAdmission && (
                <div className="row mb-3">
                  <div className="col-sm-12">
                    {/* Section 1: Patient Information */}
                    <div className="card shadow mb-3">
                      <div className="card-header bg-light">
                        <h6 className="mb-0 fw-bold">Patient Information</h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="form-group col-md-3">
                            <label>Patient Name</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedAdmission.patientName || ""}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                          <div className="form-group col-md-3">
                            <label>UHID</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedAdmission.uhid || ""}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                          <div className="form-group col-md-3">
                            <label>Age / Gender</label>
                            <input
                              type="text"
                              className="form-control"
                              value={`${selectedAdmission.age || ""} / ${selectedAdmission.gender || ""}`}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                          <div className="form-group col-md-3">
                            <label>Patient Contact No.</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedAdmission.contactNo || selectedAdmission.mobileNo || ""}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                          <div className="form-group col-md-3">
                            <label>Emergency Contact No.</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedAdmission.emergencyContactNo || selectedAdmission.emergencyMobileNo || ""}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Admission Information */}
                    <div className="card shadow mb-3">
                      <div className="card-header bg-light">
                        <h6 className="mb-0 fw-bold">Admission Information</h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="form-group col-md-3">
                            <label>Admission No.</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedAdmission.admissionNo || ""}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                          <div className="form-group col-md-3">
                            <label>Admission Date &amp; Time</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedAdmission.admissionDate ? formatDate(`${selectedAdmission.admissionDate}T${selectedAdmission.admissionTime || "00:00:00"}`) : ""}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                          <div className="form-group col-md-3">
                            <label>Admission Category</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedAdmission.admissionCategory || selectedAdmission.categoryName || ""}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                          <div className="form-group col-md-3">
                            <label>Admission Type</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedAdmission.admissionType || ""}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                          <div className="form-group col-md-3">
                            <label>Admission Source</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedAdmission.admissionSource || ""}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                          <div className="form-group col-md-3">
                            <label>Current Status</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedAdmission.currentStatus || selectedAdmission.status || ""}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                          <div className="form-group col-md-3">
                            <label>LOS</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedAdmission.los || ""}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Doctor & Location */}
                    <div className="card shadow mb-3">
                      <div className="card-header bg-light">
                        <h6 className="mb-0 fw-bold">Doctor & Location</h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="form-group col-md-3">
                            <label>Admitting Doctor</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedAdmission.admittingDoctor || selectedAdmission.doctorName || ""}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                          <div className="form-group col-md-3">
                            <label>Department / Speciality</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedAdmission.department || ""}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                          <div className="form-group col-md-3">
                            <label>Admitting Ward</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedAdmission.admittingWard || ""}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                          <div className="form-group col-md-3">
                            <label>Current Ward</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedAdmission.currentWard || selectedAdmission.ward || ""}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                          <div className="form-group col-md-3">
                            <label>Room</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedAdmission.room || ""}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                          <div className="form-group col-md-3">
                            <label>Bed</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedAdmission.bed || ""}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                          <div className="form-group col-md-3">
                            <label>Care Level</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedAdmission.careLevel || ""}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Clinical Details at Admission */}
                    <div className="card shadow mb-3">
                      <div className="card-header bg-light">
                        <h6 className="mb-0 fw-bold">Clinical Details at Admission</h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="form-group col-md-3">
                            <label>Reason for Admission</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedAdmission.reasonForAdmission || ""}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                          <div className="form-group col-md-3">
                            <label>Initial Diagnosis</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedAdmission.initialDiagnosis || ""}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                          <div className="form-group col-md-3">
                            <label>ICD Diagnosis</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedAdmission.icdDiagnosis || ""}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                          <div className="form-group col-md-3">
                            <label>Patient Condition</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedAdmission.patientCondition || ""}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                          <div className="form-group col-md-3">
                            <label>Admission Priority</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedAdmission.admissionPriority || ""}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                          <div className="form-group col-md-9">
                            <label>Remarks</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedAdmission.remark || selectedAdmission.remarks || ""}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 5: NOK Details */}
                    <div className="card shadow mb-3">
                      <div className="card-header bg-light">
                        <h6 className="mb-0 fw-bold">NOK Details</h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="form-group col-md-3">
                            <label>NOK Name</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedAdmission.nokName || ""}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                          <div className="form-group col-md-3">
                            <label>Relationship</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedAdmission.relationship || selectedAdmission.nokRelationship || ""}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                          <div className="form-group col-md-3">
                            <label>Contact No.</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedAdmission.contact || selectedAdmission.nokContactNo || ""}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                          <div className="form-group col-md-3">
                            <label>Address</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedAdmission.address || selectedAdmission.nokAddress || ""}
                              readOnly
                              style={{ backgroundColor: "#e9ecef" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 6: Referral / Transfer Details (conditional) */}
                    {selectedAdmission.referralTransfer && (
                      <div className="card shadow mb-3">
                        <div className="card-header bg-light">
                          <h6 className="mb-0 fw-bold">Referral / Transfer Details</h6>
                        </div>
                        <div className="card-body">
                          <div className="row g-3">
                            <div className="form-group col-md-3">
                              <label>From Ward</label>
                              <input
                                type="text"
                                className="form-control"
                                value={selectedAdmission.referralTransfer.fromWard || ""}
                                readOnly
                                style={{ backgroundColor: "#e9ecef" }}
                              />
                            </div>
                            <div className="form-group col-md-3">
                              <label>To Ward</label>
                              <input
                                type="text"
                                className="form-control"
                                value={selectedAdmission.referralTransfer.toWard || ""}
                                readOnly
                                style={{ backgroundColor: "#e9ecef" }}
                              />
                            </div>
                            <div className="form-group col-md-6">
                              <label>Reason</label>
                              <input
                                type="text"
                                className="form-control"
                                value={selectedAdmission.referralTransfer.reason || ""}
                                readOnly
                                style={{ backgroundColor: "#e9ecef" }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Section 7: Document Details */}
                    <div className="card shadow mb-3">
                      <div className="card-header bg-light">
                        <h6 className="mb-0 fw-bold">Document Details</h6>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-sm table-bordered table-hover">
                            <thead className="table-light">
                              <tr>
                                <th>S.no</th>
                                <th>Document Name</th>
                                <th>Remarks</th>
                                <th>File Name</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedAdmission.documentListList?.map((doc, index) => (
                                <tr key={index}>
                                  <td>{index + 1}</td>
                                  <td>{doc.documentName}</td>
                                  <td>{doc.documentRemarks || ""}</td>
                                  <td>{doc.fileName}</td>
                                  <td>
                                    <button 
                                      className="btn btn-sm btn-outline-primary me-1" 
                                      title="View"
                                      onClick={() => {
                                        if (doc.filePath) {
                                          setPreviewFilePath(doc.filePath);
                                        }
                                      }}
                                    >
                                      <i className="fa fa-eye"></i>
                                    </button>
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
            </div>
          </div>
        </div>
      </div>
      {previewFilePath && (
        <DocumentPreview filePath={previewFilePath} onClose={() => setPreviewFilePath(null)} />
      )}
    </div>
  );
};

export default ActiveAdmissionList;