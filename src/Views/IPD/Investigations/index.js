import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import { getRequest, postRequest, fetchPdfReportForViewAndPrint } from "../../../service/apiService";
import {
  MAS_INVESTIGATION,
  SAVE_IPD_INVESTIGATION_ORDER,
  LAB_REPORT_URL_WRT_ORDER_HD,
  REQUEST_PARAM_ORDER_HD_ID,
  REQUEST_PARAM_FLAG,
  STATUS_D,
  REQUEST_PARAM_HOSPITAL_ID,
  REQUEST_PARAM_PATIENT_ID,
  REQUEST_PARAM_PAGE,
  REQUEST_PARAM_SIZE,
  LAB_ORDER_TRACKING_WRT_PATIENT_ID_GET_URL,
  IP_INVESTIGATION_REPORT_URL,
} from "../../../config/apiConfig";
import { formatDateForDisplay } from "../../../utils/dateUtils";
import { REPORT_GEN_FAILED_ERR_MSG } from "../../../config/constants";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";

// ----------------------------------------------------------------------------
// PortalDropdown Component
// ----------------------------------------------------------------------------
const PortalDropdown = ({ anchorRef, show, children }) => {
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (!show || !anchorRef?.current) return;

    const updatePosition = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      setStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 99999,
        maxHeight: "200px",
        overflowY: "auto",
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        borderRadius: "4px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [show, anchorRef]);

  if (!show) return null;
  return createPortal(<div style={style}>{children}</div>, document.body);
};

const hospitalId =
  localStorage.getItem("hospitalId") || sessionStorage.getItem("hospitalId");

// ----------------------------------------------------------------------------
// Pagination Component
// ----------------------------------------------------------------------------
const Pagination = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  return (
    <nav>
      <ul className="pagination justify-content-end mt-3">
        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
          <button
            className="page-link"
            onClick={() => onPageChange(currentPage - 1)}
            type="button"
          >
            Previous
          </button>
        </li>
        {[...Array(totalPages)].map((_, i) => (
          <li
            key={i}
            className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
          >
            <button
              className="page-link"
              onClick={() => onPageChange(i + 1)}
              type="button"
            >
              {i + 1}
            </button>
          </li>
        ))}
        <li
          className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
        >
          <button
            className="page-link"
            onClick={() => onPageChange(currentPage + 1)}
            type="button"
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
};

// ----------------------------------------------------------------------------
// Normalization helpers
// ----------------------------------------------------------------------------
const normalizeLabInvestigation = (item, index) => ({
  id: item?.investigationId ?? item?.id ?? index,
  investigationName: item?.investigationName ?? item?.testName ?? item?.name ?? "",
  testName: item?.testName ?? item?.investigationName ?? item?.name ?? "",
  sample: item?.sample ?? item?.sampleName ?? item?.sampleDescription ?? "",
  container: item?.container ?? item?.collectionName ?? item?.containerName ?? "",
  resultUnit: item?.resultUnit ?? item?.uomName ?? item?.unitName ?? "",
  price: Number(item?.price ?? item?.amount ?? item?.rate ?? 0),
  discount: Number(item?.disc ?? item?.discount ?? 0),
});

const normalizeRadiologyInvestigation = (item, index) => ({
  id: item?.investigationId ?? item?.id ?? index,
  investigationName: item?.investigationName ?? item?.name ?? "",
  testName: item?.testName ?? item?.investigationName ?? item?.name ?? "",
  name: item?.name ?? item?.investigationName ?? "",
  price: Number(item?.price ?? item?.amount ?? item?.rate ?? 0),
  discount: Number(item?.disc ?? item?.discount ?? 0),
});

const getRadiologyInvestigationLabel = (test) =>
  test?.investigationName || test?.testName || test?.name || "";

const getGenderApplicable = (selectedPatient) => {
  const rawGender =
    selectedPatient?.gender ??
    selectedPatient?.patientGender ??
    selectedPatient?.sex ??
    selectedPatient?.genderCode ??
    "";

  const ageGenderPart =
    typeof selectedPatient?.ageGender === "string"
      ? selectedPatient.ageGender.split("/").pop()?.trim()
      : "";

  const genderValue = String(rawGender || ageGenderPart || "")
    .trim()
    .toLowerCase();

  if (!genderValue) return "";
  if (genderValue === "male" || genderValue === "m") return "m";
  if (genderValue === "female" || genderValue === "f") return "f";
  return genderValue.charAt(0);
};

const getTodayDateString = () => new Date().toISOString().split("T")[0];

let investigationRowSeq = 0;
const getUniqueInvestigationRowId = () =>
  `${Date.now()}-${investigationRowSeq++}`;

const normalizeInvestigationText = (value) =>
  String(value || "").trim().toLowerCase();

const getLabInvestigationLabel = (test) =>
  test?.investigationName || test?.testName || "";

// ----------------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------------
const InvestigationOrderandTracking = ({ selectedPatient }) => {
  const [activeTab, setActiveTab] = useState("lab");
  const [labTests, setLabTests] = useState([]);
  const [radiologyTests, setRadiologyTests] = useState([]);

  // ---------- Lab order entry state ----------
  const createLabRow = () => ({
    id: getUniqueInvestigationRowId(),
    testName: "",
    sample: "",
    container: "",
    resultUnit: "",
    remarks: "",
    dropdownOpen: false,
    searchText: "",
  });
  const [labRows, setLabRows] = useState([createLabRow()]);

  // ---------- Radiology order entry state ----------
  const createRadiologyRow = () => ({
    id: getUniqueInvestigationRowId(),
    investigationName: "",
    date: getTodayDateString(),
    remarks: "",
    dropdownOpen: false,
    searchText: "",
  });
  const [radiologyRows, setRadiologyRows] = useState([createRadiologyRow()]);

  // ---------- Tracking state ----------
  const [trackingType, setTrackingType] = useState("lab");
  const [trackingData, setTrackingData] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [trackingCurrentPage, setTrackingCurrentPage] = useState(1);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const itemsPerPage = 5;

  // PDF viewing states
  const [pdfUrl, setPdfUrl] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [reportPdfUrl, setReportPdfUrl] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [generatingPdfIds, setGeneratingPdfIds] = useState(new Set());

  // Refs for portal dropdowns
  const labInputRefs = useRef({});
  const radiologyInputRefs = useRef({});

  // ---------- Fetch investigations for dropdowns ----------
  useEffect(() => {
    const fetchInvestigations = async () => {
      const genderApplicable = getGenderApplicable(selectedPatient);
      if (!genderApplicable) {
        setLabTests([]);
        setRadiologyTests([]);
        return;
      }

      try {
        const [labRes, radiologyRes] = await Promise.all([
          getRequest(
            `${MAS_INVESTIGATION}/price-details?genderApplicable=${genderApplicable}`
          ),
          getRequest(
            `${MAS_INVESTIGATION}/price-details?genderApplicable=${genderApplicable}&radioFlag=true`
          ),
        ]);

        if (labRes?.status === 200 && Array.isArray(labRes.response)) {
          setLabTests(labRes.response.map(normalizeLabInvestigation));
        } else {
          setLabTests([]);
        }

        if (
          radiologyRes?.status === 200 &&
          Array.isArray(radiologyRes.response)
        ) {
          setRadiologyTests(
            radiologyRes.response.map(normalizeRadiologyInvestigation)
          );
        } else {
          setRadiologyTests([]);
        }
      } catch (error) {
        console.error("Error fetching investigations:", error);
        setLabTests([]);
        setRadiologyTests([]);
      }
    };

    fetchInvestigations();
  }, [selectedPatient]);

  // ---------- Fetch tracking data from API (only for lab) ----------
 const fetchTrackingData = async (page = 1) => {
    if (!selectedPatient?.patientId) {
      setTrackingData([]);
      setTotalElements(0);
      return;
    }

    setTrackingLoading(true);
    try {
      const patientId = selectedPatient.patientId;
      const queryString = new URLSearchParams({
        [REQUEST_PARAM_HOSPITAL_ID]: hospitalId || "",
        [REQUEST_PARAM_PATIENT_ID]: patientId,
        [REQUEST_PARAM_PAGE]: String(page - 1),
        [REQUEST_PARAM_SIZE]: String(itemsPerPage),
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
          orderDate: formatDateForDisplay(item.orderDate) || "",
          patientName: item.patientName || "",
          mobileNo: item.mobileNum || "",
          ageGender: `${item.age || ""} / ${item.gender || ""}`,
          sampleId: item.generatedSampleId || "",
          investigationName: item.investigationName || "",
          investigationStatus: item.orderStatusName || "N/A",
          report: item.orderStatusId === 6 ? "View / Download" : "—",
        }));

        setTrackingData(mappedData);
        setTotalElements(total);
      } else {
        setTrackingData([]);
        setTotalElements(0);
      }
    } catch (error) {
      console.error("Error fetching tracking data:", error);
      setTrackingData([]);
      setTotalElements(0);
    } finally {
      setTrackingLoading(false);
    }
  };

  // Trigger fetch only when tracking tab is active and trackingType is "lab"
  useEffect(() => {
    if (activeTab === "tracking" && trackingType === "lab") {
      fetchTrackingData(trackingCurrentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, trackingType, trackingCurrentPage, selectedPatient]);

  // ---------- Handle tracking type change with popup for radiology ----------
  const handleTrackingTypeChange = (type) => {
    if (type === "radiology") {
      Swal.fire({
        icon: "info",
        title: "Not Implemented",
        text: "Radiology orders tracking functionality is not implemented yet.",
      });
      return; // Keep current trackingType (lab)
    }
    setTrackingType(type);
    setTrackingCurrentPage(1);
  };

  // ---------- PDF Report Generation ----------
  const isGeneratingPdf = (dgOrderHdId) => generatingPdfIds.has(dgOrderHdId);

  const generateLabReport = async (record) => {
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
    setPdfUrl(null);
    setSelectedRecord(record);

    try {
      const url = `${LAB_REPORT_URL_WRT_ORDER_HD}?${REQUEST_PARAM_ORDER_HD_ID}=${dgOrderHdId}&${REQUEST_PARAM_FLAG}=${STATUS_D}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/pdf" },
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const fileURL = window.URL.createObjectURL(blob);
      setPdfUrl(fileURL);
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

  const handleViewReport = (record) => generateLabReport(record);

  const handlePrintClick = async () => {
    const inpatientId = Number(selectedPatient?.inpatientId || selectedPatient?.id || 26);
    if (inpatientId) {
      try {
        setIsGeneratingReport(true);
        const reportUrl = `${IP_INVESTIGATION_REPORT_URL}?inPatientId=${inpatientId}`;
        const blob = await fetchPdfReportForViewAndPrint(reportUrl, STATUS_D);
        const fileURL = window.URL.createObjectURL(blob);
        setReportPdfUrl(fileURL);
      } catch (error) {
        console.error("Error generating report:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: REPORT_GEN_FAILED_ERR_MSG,
        });
      } finally {
        setIsGeneratingReport(false);
      }
    } else {
      Swal.fire({
        icon: "warning",
        title: "Patient not selected",
        text: "Please select an admitted IPD patient before generating the report.",
      });
    }
  };

  // ---------- Lab order handlers ----------
  const addLabRow = () => {
    setLabRows([...labRows, createLabRow()]);
  };

  const updateLabRow = (id, field, value) => {
    setLabRows(
      labRows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const selectLabTest = (id, test) => {
    const testName = test.investigationName || test.testName || "";
    setLabRows(
      labRows.map((row) =>
        row.id === id
          ? {
              ...row,
              testName,
              sample: test.sample,
              container: test.container,
              resultUnit: test.resultUnit,
              searchText: testName,
              dropdownOpen: false,
            }
          : row
      )
    );
  };

  const deleteLabRow = (id) => {
    if (labRows.length === 1) return;
    setLabRows(labRows.filter((row) => row.id !== id));
  };

  const handleLabTestNameChange = (id, value) => {
    setLabRows(
      labRows.map((row) =>
        row.id === id
          ? {
              ...row,
              searchText: value,
              testName: "",
              sample: "",
              container: "",
              resultUnit: "",
              dropdownOpen: true,
            }
          : { ...row, dropdownOpen: false }
      )
    );
  };

  const openLabDropdown = (id) => {
    setLabRows(
      labRows.map((row) =>
        row.id === id ? { ...row, dropdownOpen: true } : row
      )
    );
  };

  const toggleLabDropdown = (id, open) => {
    setLabRows(
      labRows.map((row) =>
        row.id === id ? { ...row, dropdownOpen: open } : row
      )
    );
  };

  const handleLabBlur = (id) => {
    setTimeout(() => toggleLabDropdown(id, false), 150);
  };

  const getLabTestKey = (test) =>
    test?.id != null
      ? `id:${test.id}`
      : `name:${normalizeInvestigationText(getLabInvestigationLabel(test))}`;

  const findSelectedLabTestFromRow = (row) =>
    labTests.find(
      (test) =>
        test.id === row.selectedId ||
        test.testName === row.testName ||
        test.investigationName === row.testName ||
        test.testName === row.searchText ||
        test.investigationName === row.searchText
    );

  const getFilteredLabTests = (searchText, currentRowId) => {
    const query = (searchText || "").trim().toLowerCase();
    const selectedKeys = new Set(
      labRows
        .filter((row) => row.id !== currentRowId)
        .map(findSelectedLabTestFromRow)
        .filter(Boolean)
        .map(getLabTestKey)
    );
    return labTests.filter((test) => {
      const label = getLabInvestigationLabel(test);
      const matchesQuery = !query || normalizeInvestigationText(label).includes(query);
      return matchesQuery && !selectedKeys.has(getLabTestKey(test));
    });
  };

  // ---------- Radiology order handlers ----------
  const addRadiologyRow = () => {
    setRadiologyRows([...radiologyRows, createRadiologyRow()]);
  };

  const updateRadiologyRow = (id, field, value) => {
    setRadiologyRows(
      radiologyRows.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  const selectRadiologyTest = (id, test) => {
    const investigationName = getRadiologyInvestigationLabel(test);
    setRadiologyRows(
      radiologyRows.map((row) =>
        row.id === id
          ? {
              ...row,
              investigationName,
              searchText: investigationName,
              dropdownOpen: false,
            }
          : row
      )
    );
  };

  const deleteRadiologyRow = (id) => {
    if (radiologyRows.length === 1) return;
    setRadiologyRows(radiologyRows.filter((row) => row.id !== id));
  };

  const handleRadiologySearchChange = (id, value) => {
    setRadiologyRows(
      radiologyRows.map((row) =>
        row.id === id
          ? {
              ...row,
              searchText: value,
              investigationName: "",
              dropdownOpen: true,
            }
          : { ...row, dropdownOpen: false }
      )
    );
  };

  const openRadiologyDropdown = (id) => {
    setRadiologyRows(
      radiologyRows.map((row) =>
        row.id === id ? { ...row, dropdownOpen: true } : row
      )
    );
  };

  const toggleRadiologyDropdown = (id, open) => {
    setRadiologyRows(
      radiologyRows.map((row) =>
        row.id === id ? { ...row, dropdownOpen: open } : row
      )
    );
  };

  const handleRadiologyBlur = (id) => {
    setTimeout(() => toggleRadiologyDropdown(id, false), 150);
  };

  const getRadiologyTestKey = (test) =>
    test?.id != null
      ? `id:${test.id}`
      : `name:${normalizeInvestigationText(getRadiologyInvestigationLabel(test))}`;

  const findSelectedRadiologyTestFromRow = (row) =>
    radiologyTests.find(
      (test) =>
        test.id === row.selectedId ||
        test.investigationName === row.investigationName ||
        test.testName === row.investigationName ||
        test.name === row.investigationName ||
        test.investigationName === row.searchText ||
        test.testName === row.searchText ||
        test.name === row.searchText
    );

  const getFilteredRadiologyTests = (searchText, currentRowId) => {
    const query = (searchText || "").trim().toLowerCase();
    const selectedKeys = new Set(
      radiologyRows
        .filter((row) => row.id !== currentRowId)
        .map(findSelectedRadiologyTestFromRow)
        .filter(Boolean)
        .map(getRadiologyTestKey)
    );
    return radiologyTests.filter((test) => {
      const label = getRadiologyInvestigationLabel(test);
      const matchesQuery =
        !query || normalizeInvestigationText(label).includes(query);
      return matchesQuery && !selectedKeys.has(getRadiologyTestKey(test));
    });
  };

  // ---------- Save handlers ----------
  const handleSaveLab = () => {
    handleSaveInvestigations("lab");
  };

  const handleSaveRadiology = () => {
    handleSaveInvestigations("radiology");
  };

  const buildPayloadRows = (rows, type) =>
    rows
      .filter((row) => row.searchText?.trim())
      .map((row) => {
        const matchedTest =
          type === "lab"
            ? labTests.find(
                (test) =>
                  test.testName === row.testName ||
                  test.investigationName === row.testName ||
                  test.testName === row.searchText ||
                  test.investigationName === row.searchText
              )
            : radiologyTests.find(
                (test) =>
                  test.investigationName === row.investigationName ||
                  test.testName === row.investigationName ||
                  test.name === row.investigationName ||
                  test.investigationName === row.searchText ||
                  test.testName === row.searchText ||
                  test.name === row.searchText
              );

        return {
          id: matchedTest?.id ?? null,
          appointmentDate:
            type === "radiology" ? row.date || getTodayDateString() : null,
          checkStatus: true,
          remarks: row.remarks || "",
          type,
          sample: row.sample || "",
          container: row.container || "",
          resultUnit: row.resultUnit || "",
          investigationName:
            type === "radiology"
              ? getRadiologyInvestigationLabel(matchedTest)
              : row.testName || row.searchText || "",
        };
      })
      .filter((row) => row.id != null);

  const validateUniqueInvestigations = (rows, type) => {
    const seen = new Map();
    const rowLabel = type === "lab" ? "Lab" : "Radiology";

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      if (!row.searchText?.trim()) continue;

      const matchedTest =
        type === "lab"
          ? labTests.find(
              (test) =>
                test.testName === row.testName ||
                test.investigationName === row.testName ||
                test.testName === row.searchText ||
                test.investigationName === row.searchText
            )
          : radiologyTests.find(
              (test) =>
                test.investigationName === row.investigationName ||
                test.testName === row.investigationName ||
                test.name === row.investigationName ||
                test.investigationName === row.searchText ||
                test.testName === row.searchText ||
                test.name === row.searchText
            );

      if (!matchedTest) continue;

      const key =
        type === "lab" ? getLabTestKey(matchedTest) : getRadiologyTestKey(matchedTest);
      const previousIndex = seen.get(key);
      if (previousIndex !== undefined) {
        Swal.fire({
          icon: "warning",
          title: "Duplicate investigation",
          text: `${rowLabel} investigation "${getRadiologyInvestigationLabel(matchedTest)}" is already selected in row ${previousIndex + 1}. Please choose a different investigation.`,
        });
        return false;
      }

      seen.set(key, i);
    }

    return true;
  };

  const validateInvestigationRemarks = (rows, type) => {
    const missingRemarksRowIndex = rows.findIndex(
      (row) => row.searchText?.trim() && !row.remarks?.trim()
    );

    if (missingRemarksRowIndex !== -1) {
      const rowLabel = missingRemarksRowIndex + 1;
      const tabLabel = type === "lab" ? "Lab" : "Radiology";

      Swal.fire({
        icon: "warning",
        title: "Remarks required",
        text: `${tabLabel} investigation remarks are mandatory. Please enter remarks for row ${rowLabel} before saving.`,
      });
      return false;
    }

    return true;
  };

  const handleSaveInvestigations = async (type) => {
    if (!selectedPatient?.patientId || !selectedPatient?.inpatientId) {
      Swal.fire({
        icon: "warning",
        title: "Patient not selected",
        text: "Please select an admitted IPD patient before saving investigations.",
      });
      return;
    }

    const rows = type === "lab" ? labRows : radiologyRows;

    if (!validateInvestigationRemarks(rows, type)) {
      return;
    }

    if (!validateUniqueInvestigations(rows, type)) {
      return;
    }

    const investigationReq = buildPayloadRows(rows, type);

    if (investigationReq.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No investigations",
        text: "Please add at least one investigation before saving.",
      });
      return;
    }

    const payload = {
      patientId: selectedPatient.patientId,
      inpatientId: selectedPatient.inpatientId,
      investigationReq,
    };

    try {
      const response = await postRequest(SAVE_IPD_INVESTIGATION_ORDER, payload);
      if (response?.status === 200) {
        await Swal.fire({
          icon: "success",
          title: "Saved",
          text: response?.message || "Investigations saved successfully.",
        });
        if (type === "lab") {
          setLabRows([createLabRow()]);
        } else {
          setRadiologyRows([createRadiologyRow()]);
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Save failed",
          text: response?.message || "Unable to save investigations.",
        });
      }
    } catch (error) {
      console.error("Error saving investigations:", error);
      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: "Something went wrong while saving investigations.",
      });
    }
  };

  // ----------------------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------------------
  return (
    <div>
      {pdfUrl && selectedRecord && (
        <PdfViewer
          pdfUrl={pdfUrl}
          onClose={() => {
            setPdfUrl(null);
            setSelectedRecord(null);
          }}
          name={`Lab Report - ${selectedRecord?.patientName || "Patient"}`}
        />
      )}
      {reportPdfUrl && (
        <PdfViewer
          pdfUrl={reportPdfUrl}
          onClose={() => setReportPdfUrl(null)}
          name="Investigation Report"
        />
      )}

      {/* Tab buttons */}
      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-sm ${activeTab === "lab" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveTab("lab")}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
          type="button"
        >
          Lab Investigation
        </button>
        <button
          className={`btn btn-sm ${activeTab === "radiology" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveTab("radiology")}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
          type="button"
        >
          Radiology Investigation
        </button>
        <button
          className={`btn btn-sm ${activeTab === "tracking" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveTab("tracking")}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
          type="button"
        >
          Order Tracking
        </button>
      </div>

      {/* ========== LAB TAB ========== */}
      {activeTab === "lab" && (
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white py-2 d-flex justify-content-between align-items-center">
            <strong>Lab Investigation Order Entry</strong>
            <button
              type="button"
              className="btn btn-sm btn-success"
              onClick={addLabRow}
              title="Add test"
            >
              <i className="mdi mdi-plus"></i> + Add
            </button>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "5%" }}>S.No</th>
                    <th style={{ width: "20%" }}>Test Name</th>
                    <th style={{ width: "12%" }}>Sample</th>
                    <th style={{ width: "12%" }}>Container</th>
                    <th style={{ width: "20%" }}>Remarks</th>
                    <th style={{ width: "10%" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {labRows.map((row, idx) => {
                    const filteredTests = getFilteredLabTests(
                      row.searchText,
                      row.id
                    );
                    return (
                      <tr key={row.id}>
                        <td className="text-center">{idx + 1}</td>
                        <td className="position-relative">
                          <input
                            ref={(el) => {
                              labInputRefs.current[row.id] = el;
                            }}
                            type="text"
                            className="form-control form-control-sm"
                            value={row.searchText}
                            autoComplete="off"
                            onChange={(e) =>
                              handleLabTestNameChange(row.id, e.target.value)
                            }
                            onFocus={() => openLabDropdown(row.id)}
                            onBlur={() => handleLabBlur(row.id)}
                            placeholder="Type or select test"
                          />
                          <PortalDropdown
                            anchorRef={{
                              current: labInputRefs.current[row.id],
                            }}
                            show={row.dropdownOpen && filteredTests.length > 0}
                          >
                            <ul className="list-group mb-0">
                              {filteredTests.map((test) => {
                                const hasDiscount =
                                  test.discount && test.discount > 0;
                                const displayPrice = test.price || 0;
                                const discountAmount = hasDiscount
                                  ? test.discount
                                  : 0;
                                const finalPrice = hasDiscount
                                  ? displayPrice - discountAmount
                                  : displayPrice;

                                return (
                                  <li
                                    key={test.id}
                                    className="list-group-item list-group-item-action"
                                    style={{
                                      cursor: "pointer",
                                      backgroundColor: "#e3e8e6",
                                    }}
                                    onClick={() => selectLabTest(row.id, test)}
                                    onMouseDown={(e) => e.preventDefault()}
                                  >
                                    <div>
                                      <strong>
                                        {test.investigationName || test.testName}
                                      </strong>
                                      <div className="d-flex justify-content-between">
                                        <span>
                                          {test.price === null ||
                                          test.price === undefined
                                            ? "Price not configured"
                                            : `₹${finalPrice.toFixed(2)}`}
                                        </span>
                                      </div>
                                      {test.investigationType && (
                                        <small className="text-muted">
                                          Type: {test.investigationType}
                                        </small>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </PortalDropdown>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            disabled
                            value={row.sample}
                            placeholder="Sample type"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={row.container}
                            disabled
                            placeholder="Container"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={row.remarks}
                            onChange={(e) =>
                              updateLabRow(row.id, "remarks", e.target.value)
                            }
                            placeholder="Remarks *"
                            aria-required="true"
                          />
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteLabRow(row.id)}
                            disabled={labRows.length === 1}
                            title="Delete row"
                          >
                            <i className="mdi mdi-delete"></i> X
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="d-flex justify-content-end mt-3">
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSaveLab}
                type="button"
              >
                Save Lab Orders
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== RADIOLOGY TAB ========== */}
      {activeTab === "radiology" && (
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white py-2 d-flex justify-content-between align-items-center">
            <strong>Radiology Investigation Order Entry</strong>
            <button
              type="button"
              className="btn btn-sm btn-success"
              onClick={addRadiologyRow}
              title="Add investigation"
            >
              <i className="mdi mdi-plus"></i> + Add
            </button>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "5%" }}>S.No</th>
                    <th style={{ width: "35%" }}>Investigation</th>
                    <th style={{ width: "35%" }}>Remarks</th>
                    <th style={{ width: "10%" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {radiologyRows.map((row, idx) => {
                    const filteredTests = getFilteredRadiologyTests(
                      row.searchText,
                      row.id
                    );
                    return (
                      <tr key={row.id}>
                        <td className="text-center">{idx + 1}</td>
                        <td className="position-relative">
                          <input
                            ref={(el) => {
                              radiologyInputRefs.current[row.id] = el;
                            }}
                            type="text"
                            className="form-control form-control-sm"
                            value={row.searchText}
                            onChange={(e) =>
                              handleRadiologySearchChange(
                                row.id,
                                e.target.value
                              )
                            }
                            onFocus={() => openRadiologyDropdown(row.id)}
                            onBlur={() => handleRadiologyBlur(row.id)}
                            placeholder="Type or select investigation"
                          />
                          <PortalDropdown
                            anchorRef={{
                              current: radiologyInputRefs.current[row.id],
                            }}
                            show={
                              row.dropdownOpen && filteredTests.length > 0
                            }
                          >
                            <ul className="list-group mb-0">
                              {filteredTests.map((test) => {
                                const displayName =
                                  getRadiologyInvestigationLabel(test);
                                const hasDiscount =
                                  test.discount && test.discount > 0;
                                const displayPrice = test.price || 0;
                                const discountAmount = hasDiscount
                                  ? test.discount
                                  : 0;
                                const finalPrice = hasDiscount
                                  ? displayPrice - discountAmount
                                  : displayPrice;

                                return (
                                  <li
                                    key={test.id}
                                    className="list-group-item list-group-item-action"
                                    style={{
                                      cursor: "pointer",
                                      backgroundColor: "#e3e8e6",
                                    }}
                                    onClick={() =>
                                      selectRadiologyTest(row.id, test)
                                    }
                                    onMouseDown={(e) => e.preventDefault()}
                                  >
                                    <div>
                                      <strong>{displayName}</strong>
                                      <div className="d-flex justify-content-between">
                                        <span>
                                          {test.price === null ||
                                          test.price === undefined
                                            ? "Price not configured"
                                            : `Rs. ${finalPrice.toFixed(2)}`}
                                        </span>
                                      </div>
                                      {test.investigationType && (
                                        <small className="text-muted">
                                          Type: {test.investigationType}
                                        </small>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </PortalDropdown>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={row.remarks}
                            onChange={(e) =>
                              updateRadiologyRow(
                                row.id,
                                "remarks",
                                e.target.value
                              )
                            }
                            placeholder="Remarks *"
                            aria-required="true"
                          />
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteRadiologyRow(row.id)}
                            disabled={radiologyRows.length === 1}
                            title="Delete row"
                          >
                            <i className="mdi mdi-delete"></i> X
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="d-flex justify-content-end mt-3">
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSaveRadiology}
                type="button"
              >
                Save Radiology Orders
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== TRACKING TAB ========== */}
      {activeTab === "tracking" && (
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white py-2">
            <strong>Order Tracking</strong>
          </div>
          <div className="card-body">
            {/* Radio buttons to switch between Lab / Radiology */}
            <div className="mb-2 d-flex align-items-center justify-content-between">
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
              <button
                className="btn btn-success btn-sm"
                onClick={handlePrintClick}
                disabled={isGeneratingReport}
                type="button"
              >
                {isGeneratingReport ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-1"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Printing...
                  </>
                ) : (
                  "Print"
                )}
              </button>
            </div>

            {/* Table – removed Patient Name, Mobile No, Age/Gender columns */}
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                  <tr>
                    <th>Order No</th>
                    <th>Order Date</th>
                    <th>Sample ID</th>
                    <th>Investigation Name</th>
                    <th>Investigation Status</th>
                    <th>Report</th>
                  </tr>
                </thead>
                <tbody>
                  {trackingLoading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        Loading...
                      </td>
                    </tr>
                  ) : trackingData.length > 0 ? (
                    trackingData.map((row, index) => (
                      <tr key={index}>
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
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalElements > 0 && (
              <Pagination
                totalItems={totalElements}
                itemsPerPage={itemsPerPage}
                currentPage={trackingCurrentPage}
                onPageChange={(page) => setTrackingCurrentPage(page)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestigationOrderandTracking;
