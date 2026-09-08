import { useState, useMemo, useEffect } from "react";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../../Components/Pagination";
import LoadingScreen from "../../../../Components/Loading";
import { fetchPdfReportForViewAndPrint, getRequest } from "../../../../service/apiService";
import {
  IP_SUMMARY_BILL_REPORT_API,
  IP_DETAILED_BILL_REPORT_API,
  STATUS_D,
  IP_INITIAL_ASSESSMENT_REPORT_URL,
  GET_NURSING_MEDICAL_ASSESSMENT,
  IP_VITALS_REPORT_URL,
  IP_DAILY_CASE_SHEET_REPORT_URL,
  GET_DISCHARGE_SUMMARY_REPORT_URL,
  ACTIVE_ADMISSION_AND_DISCHARGE_ADMISSION_LIST,
  LAB_REPORT_URL_WRT_ORDER_HD,
  REQUEST_PARAM_ORDER_HD_ID,
  REQUEST_PARAM_HOSPITAL_ID,
  REQUEST_PARAM_IN_PATIENT_ID,
  REQUEST_PARAM_PAGE,
  REQUEST_PARAM_SIZE,
  LAB_ORDER_TRACKING_WRT_PATIENT_ID_GET_URL,
  RADIOLOGY_ORDER_TRACKING_BY_INPATIENT_ID,
  GET_WEASIS_LAUNCH_URL_API,
  RADIOLOGY_REPORT_END_URL,
  REQUEST_PARAM_RAD_ORDER_DT_ID,
  STATUS_Y,
  STATUS_N,
  STATUS_S
} from "../../../../config/apiConfig";
import PdfViewer from "../../../../Components/PdfViewModel/PdfViewer";
import ConfirmationPopup from "../../../../Components/ConfirmationPopup";
import { formatDateTimeForDisplay, formatDateForDisplay } from "../../../../utils/dateUtils";
import { HOSPITAL_ID } from "../../../../config/constants";
import Swal from "sweetalert2";

const hospitalId = localStorage.getItem("hospitalId") || sessionStorage.getItem("hospitalId");
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

  // ---------- Tracking state ----------
  const [trackingType, setTrackingType] = useState("lab");
  const [trackingData, setTrackingData] = useState([]);
  const [trackingTotalElements, setTrackingTotalElements] = useState(0);
  const [trackingCurrentPage, setTrackingCurrentPage] = useState(1);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const trackingItemsPerPage = 5;

  const [generatingPdfIds, setGeneratingPdfIds] = useState(new Set());
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [isDicomLoading, setIsDicomLoading] = useState(false);
  const [selectedDicomRow, setSelectedDicomRow] = useState(null);

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

  // ---------- TRACKING FETCH LOGIC ----------
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case `${STATUS_Y}`.toLowerCase(): return 'badge bg-success';
      case `${STATUS_N}`.toLowerCase(): return 'badge bg-warning';
      case `${STATUS_S}`.toLowerCase(): return 'badge bg-info';
      default: return 'badge bg-secondary';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case `${STATUS_Y}`.toLowerCase(): return 'Completed';
      case `${STATUS_N}`.toLowerCase(): return 'Pending';
      case `${STATUS_S}`.toLowerCase(): return 'Draft';
      default: return 'Unknown';
    }
  };

  const fetchTrackingData = async (page = 1) => {
    setTrackingLoading(true);
    try {
      if (trackingType === "lab") {
        if (!selectedAdmission?.uhid && !selectedAdmission?.patientId) {
          setTrackingData([]);
          setTrackingTotalElements(0);
          return;
        }
        const patientId = selectedAdmission.inpatientId;
        const queryString = new URLSearchParams({
          [REQUEST_PARAM_HOSPITAL_ID]: hospitalId || HOSPITAL_ID,
          [REQUEST_PARAM_IN_PATIENT_ID]: patientId,
          [REQUEST_PARAM_PAGE]: String(page - 1),
          [REQUEST_PARAM_SIZE]: String(trackingItemsPerPage),
        }).toString();
        const url = `${LAB_ORDER_TRACKING_WRT_PATIENT_ID_GET_URL}?${queryString}`;
        const response = await getRequest(url);

        if (response?.status === 200 && response?.response) {
          const pageData = response.response;
          const content = pageData.content || [];
          const total = pageData.totalElements || 0;

          const mappedData = content.map((item) => ({
            dgOrderHdId: item.dgOrderHdId,
            orderNo: item.orderNum || "",
            orderDate: formatDateTimeForDisplay(item.orderDate) || "",
            patientName: item.patientName || "",
            mobileNo: item.mobileNum || "",
            ageGender: `${item.age || ""} / ${item.gender || ""}`,
            sampleId: item.generatedSampleId || "",
            investigationName: item.investigationName || "",
            investigationStatus: item.orderStatusName || "N/A",
            report: item.orderStatusId === 6 ? "View / Download" : "—",
          }));

          setTrackingData(mappedData);
          setTrackingTotalElements(total);
        } else {
          setTrackingData([]);
          setTrackingTotalElements(0);
        }
      } else if (trackingType === "radiology") {
        const inpatientId = selectedAdmission?.inpatientId;
        if (!inpatientId) {
          setTrackingData([]);
          setTrackingTotalElements(0);
          return;
        }
        const url = `${RADIOLOGY_ORDER_TRACKING_BY_INPATIENT_ID}?inpatientId=${inpatientId}`;
        const response = await getRequest(url);

        if (response?.status === 200 && Array.isArray(response?.response)) {
          const content = response.response;
          const mappedData = content.map((item) => {
            return {
              id: item.radorderdtid,
              accessionNo: item.orderaccessionno || "-",
              uhidNo: item.uhid || "-",
              patientName: item.patientname || "-",
              orderDate: item.orderdate ? formatDateTimeForDisplay(item.orderdate) : "-",
              studyDate: item.studydatetime ? formatDateTimeForDisplay(item.studydatetime) : "-",
              modalityName: item.modalityname || "-",
              investigationName: item.investigationname || "-",
              studyStatus: item.studystatus || "n",
              reportStatus: item.reportstatus || "n",
            };
          });

          setTrackingData(mappedData);
          setTrackingTotalElements(mappedData.length);
        } else {
          setTrackingData([]);
          setTrackingTotalElements(0);
        }
      }
    } catch (error) {
      console.error("Error fetching tracking data:", error);
      setTrackingData([]);
      setTrackingTotalElements(0);
    } finally {
      setTrackingLoading(false);
    }
  };

  useEffect(() => {
    if (activeReportTab === "investigation") {
      fetchTrackingData(trackingCurrentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReportTab, trackingType, trackingCurrentPage, selectedAdmission]);

  const handleTrackingTypeChange = (type) => {
    setTrackingType(type);
    setTrackingCurrentPage(1);
  };

  const isGeneratingPdf = (dgOrderHdId) => generatingPdfIds.has(dgOrderHdId);

  const handleViewReport = async (record) => {
    const dgOrderHdId = record.dgOrderHdId;
    if (!dgOrderHdId) {
      Swal.fire({
        icon: "error",
        title: "Invalid Order ID",
        text: "Cannot generate report without an order ID.",
      });
      return;
    }

    setGeneratingPdfIds((prev) => new Set(prev).add(dgOrderHdId));
    setReportPdfUrl(null);

    try {
      const url = `${LAB_REPORT_URL_WRT_ORDER_HD}?${REQUEST_PARAM_ORDER_HD_ID}=${dgOrderHdId}`;
      const blob = await fetchPdfReportForViewAndPrint(url, STATUS_D);
      const fileURL = window.URL.createObjectURL(blob);
      setReportPdfUrl(fileURL);
    } catch (error) {
      console.error("Error generating PDF", error);
      Swal.fire({
        icon: "error",
        title: "PDF Generation Failed",
        text: "Could not generate lab report. Please try again.",
      });
    } finally {
      setGeneratingPdfIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(dgOrderHdId);
        return newSet;
      });
    }
  };

  const handleRadiologyViewReport = async (radOrderDtId) => {
    try {
      setIsViewLoading(true);
      setSelectedReportId(radOrderDtId);

      const reportUrl = `${RADIOLOGY_REPORT_END_URL}?${REQUEST_PARAM_RAD_ORDER_DT_ID}=${radOrderDtId}`;
      const blob = await fetchPdfReportForViewAndPrint(reportUrl, "d");
      const fileURL = window.URL.createObjectURL(blob);
      setReportPdfUrl(fileURL);
    } catch (err) {
      console.error("Error generating PDF:", err);
      Swal.fire({
        icon: "error",
        title: "Report Generation Failed",
        text: "Could not generate report. Please try again.",
      });
    } finally {
      setIsViewLoading(false);
      setSelectedReportId(null);
    }
  };

  const handleDicomView = async (item) => {
    try {
      setIsDicomLoading(true);
      setSelectedDicomRow(item.id);

      const params = new URLSearchParams({
        uhid: item.uhidNo,
        orderNo: item.accessionNo,
      });

      const response = await getRequest(
        `${GET_WEASIS_LAUNCH_URL_API}?${params.toString()}`
      );

      const payload = response?.response ?? response;
      const weasisUrl = payload?.weasisUrl;

      if (!weasisUrl) {
        Swal.fire({
          icon: "info",
          title: "Info",
          text: `No DICOM study found for ${item.patientName}.`,
        });
        return;
      }

      window.open(weasisUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error launching Weasis:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to open DICOM study. Please try again.",
      });
    } finally {
      setIsDicomLoading(false);
      setSelectedDicomRow(null);
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

                          {/* Investigation – tracking component */}
                          {activeReportTab === "investigation" && (
                            <div className="border p-3">
                              <div className="d-flex align-items-center justify-content-between mb-3">
                                <h6 className="fw-bold mb-0">Order Tracking</h6>
                                <div className="d-flex align-items-center">
                                  <label className="me-3 mb-0">
                                    <input
                                      type="radio"
                                      name="trackingType"
                                      value="lab"
                                      checked={trackingType === "lab"}
                                      onChange={() => handleTrackingTypeChange("lab")}
                                      className="me-1"
                                    />
                                    Lab Orders
                                  </label>
                                  <label className="mb-0">
                                    <input
                                      type="radio"
                                      name="trackingType"
                                      value="radiology"
                                      checked={trackingType === "radiology"}
                                      onChange={() => handleTrackingTypeChange("radiology")}
                                      className="me-1"
                                    />
                                    Radiology Orders
                                  </label>
                                </div>
                              </div>

                              <div className="table-responsive">
                                <table className="table table-bordered table-hover">
                                  <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                                    {trackingType === "lab" ? (
                                      <tr>
                                        <th>Order No</th>
                                        <th>Order Date</th>
                                        <th>Sample ID</th>
                                        <th>Investigation Name</th>
                                        <th>Investigation Status</th>
                                        <th>Report</th>
                                      </tr>
                                    ) : (
                                      <tr>
                                        <th>Accession NO</th>
                                        <th>Order Date/Time</th>
                                        <th>Study Date/Time</th>
                                        <th>Modality Name</th>
                                        <th>Investigation name</th>
                                        <th>Study Status</th>
                                        <th>Report Status</th>
                                        <th>Report</th>
                                        <th>DICOM</th>
                                      </tr>
                                    )}
                                  </thead>
                                  <tbody>
                                    {trackingLoading ? (
                                      <tr>
                                        <td colSpan={trackingType === "lab" ? "6" : "9"} className="text-center py-4">
                                          Loading...
                                        </td>
                                      </tr>
                                    ) : trackingData.length > 0 ? (
                                      trackingData.map((row, index) => (
                                        <tr key={index}>
                                          {trackingType === "lab" ? (
                                            <>
                                              <td>{row.orderNo}</td>
                                              <td>{row.orderDate}</td>
                                              <td>{row.sampleId}</td>
                                              <td>{row.investigationName}</td>
                                              <td>{row.investigationStatus}</td>
                                              <td>
                                                {row.report === "View / Download" ? (
                                                  <button
                                                    type="button"
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => handleViewReport(row)}
                                                    disabled={isGeneratingPdf(row.dgOrderHdId)}
                                                  >
                                                    {isGeneratingPdf(row.dgOrderHdId) ? (
                                                      <>
                                                        <span
                                                          className="spinner-border spinner-border-sm me-1"
                                                          role="status"
                                                          aria-hidden="true"
                                                        ></span>
                                                        Generating...
                                                      </>
                                                    ) : (
                                                      "View"
                                                    )}
                                                  </button>
                                                ) : (
                                                  <span>{row.report}</span>
                                                )}
                                              </td>
                                            </>
                                          ) : (
                                            <>
                                              <td>{row.accessionNo}</td>
                                              <td>{row.orderDate}</td>
                                              <td>{row.studyDate}</td>
                                              <td>{row.modalityName}</td>
                                              <td>{row.investigationName}</td>
                                              <td>
                                                <span className={getStatusBadgeClass(row.studyStatus)}>
                                                  {getStatusText(row.studyStatus)}
                                                </span>
                                              </td>
                                              <td>
                                                <span className={getStatusBadgeClass(row.reportStatus)}>
                                                  {getStatusText(row.reportStatus)}
                                                </span>
                                              </td>
                                              <td className="text-center">
                                                {row.reportStatus?.toLowerCase() === `${STATUS_Y}`.toLowerCase() && (
                                                  <button
                                                    type="button"
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => handleRadiologyViewReport(row.id)}
                                                    disabled={isViewLoading && selectedReportId === row.id}
                                                  >
                                                    {isViewLoading && selectedReportId === row.id ? (
                                                      <>
                                                        <span className="spinner-border spinner-border-sm me-1" />
                                                        Generating...
                                                      </>
                                                    ) : (
                                                      <>
                                                        <i className="fa fa-eye me-1"></i>
                                                        View
                                                      </>
                                                    )}
                                                  </button>
                                                )}
                                              </td>
                                              <td className="text-center">
                                                <button
                                                  type="button"
                                                  className="btn btn-sm btn-success"
                                                  onClick={() => handleDicomView(row)}
                                                  disabled={isDicomLoading && selectedDicomRow === row.id}
                                                >
                                                  {isDicomLoading && selectedDicomRow === row.id ? (
                                                    <>
                                                      <span className="spinner-border spinner-border-sm me-1" />
                                                    </>
                                                  ) : (
                                                    <i className="fa fa-eye"></i>
                                                  )}
                                                </button>
                                              </td>
                                            </>
                                          )}
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan={trackingType === "lab" ? "6" : "9"} className="text-center py-4">
                                          No records found
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                              {/* Pagination */}
                              {trackingTotalElements > 0 && (
                                <Pagination
                                  totalItems={trackingTotalElements}
                                  itemsPerPage={trackingItemsPerPage}
                                  currentPage={trackingCurrentPage}
                                  onPageChange={(page) => setTrackingCurrentPage(page)}
                                />
                              )}
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