import { useState, useMemo, useEffect } from "react";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../../Components/Pagination";
import LoadingScreen from "../../../../Components/Loading";
import { fetchPdfReportForViewAndPrint, getRequest } from "../../../../service/apiService";
import { IP_SUMMARY_BILL_REPORT_API, IP_DETAILED_BILL_REPORT_API, STATUS_D, IP_INITIAL_ASSESSMENT_REPORT_URL, GET_NURSING_MEDICAL_ASSESSMENT, IP_VITALS_REPORT_URL, IP_DAILY_CASE_SHEET_REPORT_URL, GET_DISCHARGE_SUMMARY_REPORT_URL, ACTIVE_ADMISSION_AND_DISCHARGE_ADMISSION_LIST } from "../../../../config/apiConfig";
import PdfViewer from "../../../../Components/PdfViewModel/PdfViewer";
import ConfirmationPopup from "../../../../Components/ConfirmationPopup";
const dummyAdmissions = [
  {
    admissionNo: "IPD-1001",
    inpatientId: 55,
    assessmentId: 5,
    patientName: "Ravi Kumar",
    uhid: "UH-12345",
    age: 45,
    gender: "Male",
    mobileNo: "9876543210",
    admissionDateTime: "2026-07-15T10:30:00",
    dischargeDate: "2026-07-20T10:00:00",
    ward: "Ward A",
    room: "101",
    bed: "1",
    attendingDoctor: "Dr. Sharma",
    billingType: "Insurance",
    dailyCaseSheet: "Patient vitals stable. Chest X-ray normal. Plan: discharge tomorrow.",
    billCoveringLetter: "This bill is for services rendered during IPD stay from 15-Jul-2026 to 20-Jul-2026.",
    billSummary: "Total: ₹1,50,000 | Insurance payable: ₹1,00,000 | Patient paid: ₹50,000",
    detailedBill: "Room charges: ₹20,000\nDoctor fees: ₹30,000\nMedicines: ₹50,000\nLab tests: ₹50,000",
    dischargeSummary: "Discharge on 20-Jul-2026. Advised follow-up in 2 weeks. Medications: Tab Paracetamol 500mg TID."
  },
  {
    admissionNo: "IPD-1002",
    inpatientId: 27,
    assessmentId: 6,
    patientName: "Amit Sharma",
    uhid: "UH-12346",
    age: 38,
    gender: "Male",
    mobileNo: "9123456780",
    admissionDateTime: "2026-07-14T14:15:00",
    dischargeDate: "2026-07-20T14:00:00",
    ward: "Ward B",
    room: "205",
    bed: "2",
    attendingDoctor: "Dr. Verma",
    billingType: "Corporate",
    dailyCaseSheet: "Post-op day 2. Wound healing well. Pain controlled.",
    billCoveringLetter: "Corporate billing for IPD admission. Total charges as per package.",
    billSummary: "Total: ₹2,00,000 | Corporate covered: ₹1,80,000 | Patient paid: ₹20,000",
    detailedBill: "Surgery charges: ₹80,000\nRoom rent: ₹40,000\nICU charges: ₹60,000\nMisc: ₹20,000",
    dischargeSummary: "Discharged on 20-Jul-2026. Advised physiotherapy. Follow-up in 1 week."
  },
  {
    admissionNo: "IPD-1003",
    inpatientId: 28,
    assessmentId: 7,
    patientName: "Sneha Verma",
    uhid: "UH-12347",
    age: 29,
    gender: "Female",
    mobileNo: "9988776655",
    admissionDateTime: "2026-07-13T09:00:00",
    dischargeDate: "2026-07-18T11:00:00",
    ward: "ICU",
    room: "12",
    bed: "3",
    attendingDoctor: "Dr. Gupta",
    billingType: "Cash",
    dailyCaseSheet: "Patient is extubated. Hemodynamic stable. Transfer to ward today.",
    billCoveringLetter: "Cash bill for IPD stay. Payment received in full.",
    billSummary: "Total: ₹60,000 | Paid: ₹60,000 | Outstanding: ₹0",
    detailedBill: "ICU charges: ₹40,000\nVentilator support: ₹10,000\nMedicines: ₹10,000",
    dischargeSummary: "Discharged on 18-Jul-2026. Advised rest and follow-up in 1 month."
  },
  {
    admissionNo: "IPD-1004",
    inpatientId: 29,
    assessmentId: 8,
    patientName: "Rajesh Singh",
    uhid: "UH-12348",
    age: 52,
    gender: "Male",
    mobileNo: "9811122233",
    admissionDateTime: "2026-07-12T11:45:00",
    dischargeDate: "2026-07-22T09:30:00",
    ward: "Ward C",
    room: "310",
    bed: "4",
    attendingDoctor: "Dr. Patel",
    billingType: "Insurance",
    dailyCaseSheet: "Blood pressure under control. Renal function improving.",
    billCoveringLetter: "Insurance claim bill. All approvals obtained.",
    billSummary: "Total: ₹3,00,000 | Insurance: ₹2,50,000 | Patient: ₹50,000",
    detailedBill: "Dialysis: ₹1,20,000\nMedications: ₹80,000\nRoom charges: ₹60,000\nLab: ₹40,000",
    dischargeSummary: "Discharged on 22-Jul-2026. Advised low-protein diet. Follow-up with nephrologist."
  },
  {
    admissionNo: "IPD-1005",
    inpatientId: 30,
    assessmentId: 9,
    patientName: "Pooja Gupta",
    uhid: "UH-12349",
    age: 34,
    gender: "Female",
    mobileNo: "9090909090",
    admissionDateTime: "2026-07-11T16:20:00",
    dischargeDate: "2026-07-18T16:00:00",
    ward: "Ward A",
    room: "115",
    bed: "5",
    attendingDoctor: "Dr. Mehta",
    billingType: "Corporate",
    dailyCaseSheet: "Post-surgery day 3. Ambulating with support.",
    billCoveringLetter: "Corporate billing for maternity package.",
    billSummary: "Total: ₹1,20,000 | Corporate: ₹1,00,000 | Patient: ₹20,000",
    detailedBill: "Delivery charges: ₹50,000\nRoom rent: ₹30,000\nMedicines: ₹20,000\nLab: ₹20,000",
    dischargeSummary: "Discharged on 18-Jul-2026. Mother and baby healthy. Follow-up in 1 week."
  },
];
// Sample investigation data for Lab/Radio order tracking
const sampleInvestigations = [
  {
    orderId: "LAB-2001",
    testName: "Complete Blood Count (CBC)",
    category: "Lab",
    orderedAt: "2026-07-15T10:45:00",
    status: "Report Generated",
    patientName: "Ravi Kumar",
    mobileNo: "9876543210",
    age: 45,
    gender: "Male",
    sampleId: "SMP-1001",
    report: "Hb 13.2 g/dL; WBC 8200; Platelets 2.4L",
  },
  {
    orderId: "RAD-2002",
    testName: "Chest X-Ray",
    category: "Radio",
    orderedAt: "2026-07-15T12:00:00",
    status: "Report Generated",
    patientName: "Ravi Kumar",
    mobileNo: "9876543210",
    age: 45,
    gender: "Male",
    sampleId: "SMP-1002",
    report: "No active lung consolidation",
  },
  {
    orderId: "LAB-2003",
    testName: "Serum Creatinine",
    category: "Lab",
    orderedAt: "2026-07-16T08:10:00",
    status: "In Progress",
    patientName: "Ravi Kumar",
    mobileNo: "9876543210",
    age: 45,
    gender: "Male",
    sampleId: "SMP-1003",
    report: "",
  },
  {
    orderId: "LAB-2004",
    testName: "Urine Routine",
    category: "Lab",
    orderedAt: "2026-07-17T09:30:00",
    status: "Sample Collected",
    patientName: "Ravi Kumar",
    mobileNo: "9876543210",
    age: 45,
    gender: "Male",
    sampleId: "SMP-1004",
    report: "",
  },
];

const IPDDischargeRecords = () => {
  // ---------- STATE ----------
  const [searchMobileNo, setSearchMobileNo] = useState("");
  const [displayData, setDisplayData] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Detail view state
  const [showDetails, setShowDetails] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);

  // Report states
  const [reportPdfUrl, setReportPdfUrl] = useState(null);
  const [generatingReportType, setGeneratingReportType] = useState(null);
  const [confirmationPopup, setConfirmationPopup] = useState(null);

  // Report tab state (only main tabs)
  const [activeReportTab, setActiveReportTab] = useState("admission"); // admission | clinicalNursing | investigation | discharge | billing

  // ---------- FORMATTING HELPERS ----------
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
  const fetchAdmissions = async (page = 1, mobile = "") => {
    setIsLoading(true);
    try {
      const url = `${ACTIVE_ADMISSION_AND_DISCHARGE_ADMISSION_LIST}?page=${page - 1}&size=${DEFAULT_ITEMS_PER_PAGE}&admissionStatus=2${mobile ? `&mobileNo=${mobile}` : ""}`;
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
      console.error("Error fetching admissions:", error);
      setDisplayData([]);
      setTotalElements(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- SEARCH & FILTER ----------
  const handleSearch = () => {
    setCurrentPage(1);
    fetchAdmissions(1, searchMobileNo.trim());
  };

  const handleClear = () => {
    setSearchMobileNo("");
    setCurrentPage(1);
    fetchAdmissions(1, "");
  };

  // Initial load
  useEffect(() => {
    fetchAdmissions(1, "");
  }, []);

  // Pagination change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchAdmissions(page, searchMobileNo.trim());
  };

  // ---------- ROW CLICK (open details) ----------
  const handleRowClick = (admission) => {
    setSelectedAdmission(admission);
    setShowDetails(true);
    // Reset main report tab
    setActiveReportTab("admission");
  };

  const showConfirmationPopup = (message, type, onConfirm, onCancel = null, confirmText = "OK", cancelText = "") => {
    setConfirmationPopup({
      show: true,
      message,
      type,
      onConfirm: () => {
        onConfirm();
        setConfirmationPopup(null);
      },
      onCancel: onCancel ? () => {
        onCancel();
        setConfirmationPopup(null);
      } : null,
      confirmText,
      cancelText
    });
  };

  const handleReportSummaryClick = async () => {
    const inpatientId = Number(selectedAdmission?.inpatientId);
    if (inpatientId) {
      try {
        setGeneratingReportType("summary");
        const reportUrl = `${IP_SUMMARY_BILL_REPORT_API}?inpatientId=${inpatientId}`;
        const blob = await fetchPdfReportForViewAndPrint(reportUrl, STATUS_D);
        const fileURL = window.URL.createObjectURL(blob);
        setReportPdfUrl(fileURL);
      } catch (error) {
        console.error("Error generating report:", error);
        showConfirmationPopup("Failed to generate report", "error", () => { }, null, "OK", "");
      } finally {
        setGeneratingReportType(null);
      }
    } else {
      showConfirmationPopup("Patient ID not found", "error", () => { }, null, "OK", "");
    }
  };

  const handleDetailedReportClick = async () => {
    const inpatientId = Number(selectedAdmission?.inpatientId);
    if (inpatientId) {
      try {
        setGeneratingReportType("detailed");
        const reportUrl = `${IP_DETAILED_BILL_REPORT_API}?inpatientId=${inpatientId}`;
        const blob = await fetchPdfReportForViewAndPrint(reportUrl, STATUS_D);
        const fileURL = window.URL.createObjectURL(blob);
        setReportPdfUrl(fileURL);
      } catch (error) {
        console.error("Error generating report:", error);
        showConfirmationPopup("Failed to generate report", "error", () => { }, null, "OK", "");
      } finally {
        setGeneratingReportType(null);
      }
    } else {
      showConfirmationPopup("Patient ID not found", "error", () => { }, null, "OK", "");
    }
  };

  const handleInternalMedicalAssessmentClick = async () => {
    const inpatientId = Number(selectedAdmission?.inpatientId);
    if (!inpatientId) {
      alert("Patient ID not found");
      return;
    }

    try {
      setGeneratingReportType("internal_medical_assessment");
      const res = await getRequest(`${GET_NURSING_MEDICAL_ASSESSMENT}/${inpatientId}`);
      console.log(res);
      if (res?.status === 200 && res?.response?.assessmentId) {
        const assessmentId = res.response.assessmentId;
        const reportUrl = `${IP_INITIAL_ASSESSMENT_REPORT_URL}?assessmentId=${assessmentId}`;
        const blob = await fetchPdfReportForViewAndPrint(reportUrl, STATUS_D);
        const fileURL = window.URL.createObjectURL(blob);
        setReportPdfUrl(fileURL);
      } else if (res?.status === 404) {
        alert(res?.message || "Assessment data not found for this patient");
      } else {
        alert("Assessment data not found for this patient");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report");
    } finally {
      setGeneratingReportType(null);
    }
  };

  const handleVitalsReportClick = async () => {
    const inpatientId = Number(selectedAdmission?.inpatientId);
    if (inpatientId) {
      try {
        setGeneratingReportType("vitals");
        const reportUrl = `${IP_VITALS_REPORT_URL}?inPatientId=${inpatientId}`;
        const blob = await fetchPdfReportForViewAndPrint(reportUrl, STATUS_D);
        const fileURL = window.URL.createObjectURL(blob);
        setReportPdfUrl(fileURL);
      } catch (error) {
        console.error("Error generating report:", error);
        showConfirmationPopup("Failed to generate report", "error", () => { }, null, "OK", "");
      } finally {
        setGeneratingReportType(null);
      }
    } else {
      showConfirmationPopup("Patient ID not found", "error", () => { }, null, "OK", "");
    }
  };

  const handleIpdCaseSheetClick = async () => {
    const inpatientId = Number(selectedAdmission?.inpatientId);
    if (inpatientId) {
      try {
        setGeneratingReportType("ipd_case_sheet");
        const reportUrl = `${IP_DAILY_CASE_SHEET_REPORT_URL}?inPatientId=${inpatientId}`;
        const blob = await fetchPdfReportForViewAndPrint(reportUrl, STATUS_D);
        const fileURL = window.URL.createObjectURL(blob);
        setReportPdfUrl(fileURL);
      } catch (error) {
        console.error("Error generating report:", error);
        showConfirmationPopup("Failed to generate report", "error", () => { }, null, "OK", "");
      } finally {
        setGeneratingReportType(null);
      }
    } else {
      showConfirmationPopup("Patient ID not found", "error", () => { }, null, "OK", "");
    }
  };

  const handleDischargeSummaryClick = async () => {
    const inpatientId = Number(selectedAdmission?.inpatientId);
    if (inpatientId) {
      try {
        setGeneratingReportType("discharge_summary");
        const reportUrl = `${GET_DISCHARGE_SUMMARY_REPORT_URL}?inPatientId=${inpatientId}`;
        const blob = await fetchPdfReportForViewAndPrint(reportUrl, STATUS_D);
        const fileURL = window.URL.createObjectURL(blob);
        setReportPdfUrl(fileURL);
      } catch (error) {
        console.error("Error generating report:", error);
        showConfirmationPopup("Failed to generate report", "error", () => { }, null, "OK", "");
      } finally {
        setGeneratingReportType(null);
      }
    } else {
      showConfirmationPopup("Patient ID not found", "error", () => { }, null, "OK", "");
    }
  };

  // ---------- BACK TO LIST ----------
  const handleBackToList = () => {
    setShowDetails(false);
    setSelectedAdmission(null);
  };

  // ---------- RENDER ----------
  return (
    <div className="content-wrapper">
      {reportPdfUrl && (
        <PdfViewer
          pdfUrl={reportPdfUrl}
          name="IPD Bill Report"
          onClose={() => setReportPdfUrl(null)}
        />
      )}
      {confirmationPopup && confirmationPopup.show && (
        <ConfirmationPopup
          message={confirmationPopup.message}
          type={confirmationPopup.type}
          onConfirm={confirmationPopup.onConfirm}
          onCancel={confirmationPopup.onCancel}
          confirmText={confirmationPopup.confirmText}
          cancelText={confirmationPopup.cancelText}
        />
      )}
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">
                {showDetails ? "Discharge Records Details" : "Patient Discharge Records"}
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
              {/* ---------- LIST VIEW ---------- */}
              {!showDetails && (
                <>
                  {/* Search Section - only mobile no */}
                  <div className="mb-4">
                    <div className="card-body">
                      <div className="row g-3 align-items-end">
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Mobile No</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter mobile number"
                            value={searchMobileNo}
                            onChange={(e) => setSearchMobileNo(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                          />
                        </div>
                        <div className="col-md-4">
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={handleSearch}
                            >
                              <i className="mdi mdi-magnify"></i> Search
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={handleClear}
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Admission No</th>
                          <th>UHID</th>
                          <th>Patient Name</th>
                          <th>Age/Gender</th>
                          <th>Mobile</th>
                          <th>Ward/Room/Bed</th>
                          <th>Admission Date</th>
                          <th>Discharge Date</th>
                          <th>Billing Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr>
                            <td colSpan="9" className="text-center py-4">
                              <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            </td>
                          </tr>
                        ) : displayData.length === 0 ? (
                          <tr>
                            <td colSpan="9" className="text-center py-3 text-muted">
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
                              <td>{item.uhid}</td>
                              <td>{item.patientName}</td>
                              <td>{item.age} / {item.gender}</td>
                              <td>{item.mobileNo}</td>
                              <td>{item.ward}/{item.room}/{item.bed}</td>
                              <td>{formatDate(item.admissionDateTime)}</td>
                              <td>{formatDate(item.dischargeDate)}</td>
                              <td>
                                <span className="badge bg-info">{item.billingType}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
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

              {/* ---------- DETAILS VIEW ---------- */}
              {showDetails && selectedAdmission && (
                <>
                  {/* Admission Details */}
                  <div className="row mb-3">
                    <div className="col-sm-12">
                      <div className="card shadow mb-3">
                        <div className="card-header py-3 border-bottom-1">
                          <h6 className="mb-0 fw-bold">Admission Details</h6>
                        </div>
                        <div className="card-body">
                          <div className="row g-3">
                            <div className="form-group col-md-4">
                              <label>Admission No</label>
                              <input
                                type="text"
                                className="form-control"
                                value={selectedAdmission.admissionNo || ""}
                                readOnly
                              />
                            </div>
                            <div className="form-group col-md-4">
                              <label>Patient Name</label>
                              <input
                                type="text"
                                className="form-control"
                                value={selectedAdmission.patientName || ""}
                                readOnly
                              />
                            </div>
                            <div className="form-group col-md-4">
                              <label>UHID</label>
                              <input
                                type="text"
                                className="form-control"
                                value={selectedAdmission.uhid || ""}
                                readOnly
                              />
                            </div>
                            <div className="form-group col-md-4">
                              <label>Age / Gender</label>
                              <input
                                type="text"
                                className="form-control"
                                value={`${selectedAdmission.age || ""} / ${selectedAdmission.gender || ""}`}
                                readOnly
                              />
                            </div>
                            <div className="form-group col-md-4">
                              <label>Mobile No</label>
                              <input
                                type="text"
                                className="form-control"
                                value={selectedAdmission.mobileNo || ""}
                                readOnly
                              />
                            </div>
                            <div className="form-group col-md-4">
                              <label>Admission Date</label>
                              <input
                                type="text"
                                className="form-control"
                                value={formatDate(selectedAdmission.admissionDateTime)}
                                readOnly
                              />
                            </div>
                            <div className="form-group col-md-4">
                              <label>Discharge Date</label>
                              <input
                                type="text"
                                className="form-control"
                                value={formatDate(selectedAdmission.dischargeDate)}
                                readOnly
                              />
                            </div>
                            <div className="form-group col-md-4">
                              <label>Ward / Room / Bed</label>
                              <input
                                type="text"
                                className="form-control"
                                value={`${selectedAdmission.ward || "N/A"} / ${selectedAdmission.room || "N/A"} / ${selectedAdmission.bed || "N/A"}`}
                                readOnly
                              />
                            </div>
                            <div className="form-group col-md-4">
                              <label>Attending Doctor</label>
                              <input
                                type="text"
                                className="form-control"
                                value={selectedAdmission.doctorName || "N/A"}
                                readOnly
                              />
                            </div>
                            <div className="form-group col-md-4">
                              <label>Billing Type</label>
                              <input
                                type="text"
                                className="form-control"
                                value={selectedAdmission.billingType || ""}
                                readOnly
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reports Section */}
                  <div className="row mb-3">
                    <div className="col-sm-12">
                      <div className="card shadow">
                        <div className="card-header py-3 border-bottom-1">
                          <h6 className="mb-0 fw-bold">Reports</h6>
                        </div>

                        <div className="card-body">
                          {/* Main report tabs */}
                          <ul className="nav nav-tabs mb-3">
                            <li className="nav-item">
                              <button
                                className={`nav-link ${activeReportTab === "admission" ? "active" : ""}`}
                                onClick={() => setActiveReportTab("admission")}
                              >
                                Admission & Internal Assessment
                              </button>
                            </li>
                            <li className="nav-item">
                              <button
                                className={`nav-link ${activeReportTab === "clinicalNursing" ? "active" : ""}`}
                                onClick={() => setActiveReportTab("clinicalNursing")}
                              >
                                Clinical Nursing
                              </button>
                            </li>
                            <li className="nav-item">
                              <button
                                className={`nav-link ${activeReportTab === "investigation" ? "active" : ""}`}
                                onClick={() => setActiveReportTab("investigation")}
                              >
                                Investigation
                              </button>
                            </li>
                            <li className="nav-item">
                              <button
                                className={`nav-link ${activeReportTab === "discharge" ? "active" : ""}`}
                                onClick={() => setActiveReportTab("discharge")}
                              >
                                Discharge
                              </button>
                            </li>
                            <li className="nav-item">
                              <button
                                className={`nav-link ${activeReportTab === "billing" ? "active" : ""}`}
                                onClick={() => setActiveReportTab("billing")}
                              >
                                Billing
                              </button>
                            </li>
                          </ul>

                          {/* Admission & Internal Assessment – buttons only */}
                          {activeReportTab === "admission" && (
                            <div className="d-flex flex-wrap gap-2">
                              <button type="button" className="btn btn-outline-primary">Admission Slip</button>
                              <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={handleInternalMedicalAssessmentClick}
                                disabled={generatingReportType !== null}
                              >
                                {generatingReportType === "internal_medical_assessment" ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    Generating...
                                  </>
                                ) : (
                                  "Internal Medical Assessment"
                                )}
                              </button>
                              <button type="button" className="btn btn-outline-primary">Consent Form</button>
                              <button type="button" className="btn btn-outline-primary">Patient Labels / Wristband</button>
                            </div>
                          )}

                          {/* Clinical Nursing – buttons only */}
                          {activeReportTab === "clinicalNursing" && (
                            <div className="d-flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={handleIpdCaseSheetClick}
                                disabled={generatingReportType !== null}
                              >
                                {generatingReportType === "ipd_case_sheet" ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    Generating...
                                  </>
                                ) : (
                                  "IPD Case Sheet"
                                )}
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={handleVitalsReportClick}
                                disabled={generatingReportType !== null}
                              >
                                {generatingReportType === "vitals" ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    Generating...
                                  </>
                                ) : (
                                  "Vital Chart"
                                )}
                              </button>
                              <button type="button" className="btn btn-outline-primary">Intake / Outtake</button>
                            </div>
                          )}

                          {/* Investigation – table with new headings */}
                          {activeReportTab === "investigation" && (
                            <div className="border p-3">
                              <h6 className="fw-bold"> Order Tracking</h6>

                              <table className="table table-bordered table-hover">
                                <thead>
                                  <tr>
                                    <th>Order No</th>
                                    <th>Order Date</th>
                                    <th>Patient Name</th>
                                    <th>Mobile No</th>
                                    <th>Age / Gender</th>
                                    <th>Sample ID</th>
                                    <th>Investigation Name</th>
                                    <th>Investigation Status</th>
                                    <th>Report</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sampleInvestigations.map((inv) => (
                                    <tr key={inv.orderId}>
                                      <td>{inv.orderId}</td>
                                      <td>{formatDate(inv.orderedAt)}</td>
                                      <td>{inv.patientName}</td>
                                      <td>{inv.mobileNo}</td>
                                      <td>{inv.age} / {inv.gender}</td>
                                      <td>{inv.sampleId}</td>
                                      <td>{inv.testName}</td>
                                      <td>
                                        <span
                                          className={`badge ${inv.status === "Report Generated"
                                            ? "bg-success"
                                            : inv.status === "In Progress"
                                              ? "bg-warning text-dark"
                                              : inv.status === "Sample Collected"
                                                ? "bg-info"
                                                : "bg-secondary"
                                            }`}
                                        >
                                          {inv.status}
                                        </span>
                                      </td>
                                      <td>{inv.report || "-"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>


                            </div>
                          )}

                          {/* Discharge – buttons only */}
                          {activeReportTab === "discharge" && (
                            <div className="d-flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={handleDischargeSummaryClick}
                                disabled={generatingReportType !== null}
                              >
                                {generatingReportType === "discharge_summary" ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    Generating...
                                  </>
                                ) : (
                                  "Discharge Summary"
                                )}
                              </button>
                              <button type="button" className="btn btn-outline-primary">Discharge Slip</button>
                            </div>
                          )}

                          {/* Billing – buttons only */}
                          {activeReportTab === "billing" && (
                            <div className="d-flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={handleReportSummaryClick}
                                disabled={generatingReportType !== null}
                              >
                                {generatingReportType === "summary" ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    Generating...
                                  </>
                                ) : (
                                  "Bill Summary"
                                )}
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={handleDetailedReportClick}
                                disabled={generatingReportType !== null}
                              >
                                {generatingReportType === "detailed" ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    Generating...
                                  </>
                                ) : (
                                  "Detailed Billing Report"
                                )}
                              </button>
                              <button type="button" className="btn btn-outline-primary">Advance Payment</button>
                              <button type="button" className="btn btn-outline-primary">Final Payment</button>
                              <button type="button" className="btn btn-outline-primary">Refund Receipt</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IPDDischargeRecords;