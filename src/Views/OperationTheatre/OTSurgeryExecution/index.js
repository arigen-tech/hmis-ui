import React, { useState, useEffect, useRef } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, postRequest, getActiveStorage } from "../../../service/apiService";
import {
  MAS_ANAESTHESIA_TYPE,
  PATIENT_SURGERY_WORKLIST,
  OT_TEAM_MEMBER,
  MAS_ASA_GRADE,
  PAC_ASSESSMENT_BY_BOOKING,
  SURGERY_ANAESTHESIA,
  SURGERY_DRUG_CONSUMABLE_TEMPLATE,
  GET_ALL_DRUGS_BY_SECTION,
  GET_MEDICAL_CONSUMABLE_ITEMS,
  GET_ITEM_BATCHES,
} from "../../../config/apiConfig";
import { formatDateForDisplay, formatDateTimeForDisplay } from "../../../utils/dateUtils";

// Helper to safely convert datetime to ISO string or null
const toIsoStringOrNull = (val) => {
  if (!val) return null;
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
};

// Helper to convert "Yes"/"No" or boolean to "Y"/"N" flag for DB
const toYesNoFlag = (val, defaultVal = "N") => {
  if (val === undefined || val === null || val === "") return defaultVal;
  const s = String(val).trim().toUpperCase();
  if (s === "YES" || s === "Y" || s === "TRUE" || s === "1") return "Y";
  if (s === "NO" || s === "N" || s === "FALSE" || s === "0") return "N";
  return defaultVal;
};

// ----- Static option lists -----
const YES_NO_OPTIONS = ["Yes", "No"];

// Helper to get logged-in user name dynamically from active storage
const getLoggedInUserName = () => {
  const storage = getActiveStorage ? getActiveStorage() : sessionStorage;
  return (
    (storage && storage.getItem("loggedInUserName")) ||
    (storage && storage.getItem("username")) ||
    localStorage.getItem("loggedInUserName") ||
    localStorage.getItem("username") ||
    sessionStorage.getItem("loggedInUserName") ||
    sessionStorage.getItem("username") ||
    ""
  );
};

const TABS = [
  { key: "anaesthesia", label: "Anaesthesia" },
  { key: "drugs", label: "Drugs" },
  { key: "consumables", label: "Consumables" },
  { key: "implants", label: "Implants" },
  { key: "operative", label: "Operative Details" },
  // { key: "specimen", label: "Specimen" },
  // { key: "complications", label: "Complications" },
  // { key: "signout", label: "Sign-Out" },
];

// Helper to format scheduled date and time using dateUtils
const formatScheduledDateTime = (item) => {
  const date = item.scheduledDate || item.preferredDate || "";
  const start = item.scheduledDate
    ? item.scheduledStartTime || ""
    : item.preferredStartTime || "";
  const end = item.scheduledDate
    ? item.scheduledEndTime || ""
    : item.preferredEndTime || "";

  if (!date && !start) return "-";

  const datePart = date ? String(date).split("T")[0] : "";

  if (datePart && start) {
    const startFormatted = formatDateTimeForDisplay(`${datePart}T${start}`, "-");
    if (end) {
      const endFormatted = formatDateTimeForDisplay(`${datePart}T${end}`, "");
      const endTimePart = endFormatted ? endFormatted.split(" ")[1] : end;
      return endTimePart ? `${startFormatted} - ${endTimePart}` : startFormatted;
    }
    return startFormatted;
  }

  if (date) {
    return formatDateForDisplay(date, "-");
  }

  return end ? `${start} - ${end}` : start;
};

// Helper badges for worklist & execution banner
const getPacBadge = (item) => {
  const pacText = item?.pac || item?.pacStatus || "N/A";
  let badgeClass = "bg-secondary";
  if (pacText === "Cleared") badgeClass = "bg-success";
  else if (pacText === "Pending") badgeClass = "bg-warning text-dark";
  else if (pacText === "Not Required") badgeClass = "bg-info";

  return <span className={`badge ${badgeClass}`}>{pacText}</span>;
};

const getChecklistBadge = (item) => {
  const checklistText = item?.preOpChecklist || "Pending";
  let badgeClass = "bg-secondary";
  if (checklistText === "Completed") badgeClass = "bg-success";
  else if (checklistText === "Draft") badgeClass = "bg-warning text-dark";

  return <span className={`badge ${badgeClass}`}>{checklistText}</span>;
};

const getExecutionStatusBadge = (status) => {
  const s = String(status || "").toLowerCase().replace(/_/g, " ");
  let badgeClass = "bg-secondary";
  if (s === "completed" || s === "done" || s === "ready" || s.includes("completed")) badgeClass = "bg-success";
  else if (s === "in progress" || s.includes("progress")) badgeClass = "bg-primary";
  else if (s === "pending") badgeClass = "bg-warning text-dark";
  else if (s === "cancelled" || s === "rejected") badgeClass = "bg-danger";
  return <span className={`badge ${badgeClass}`}>{status}</span>;
};

// Helper to determine if anesthesia is required for a patient / booking
const checkAnesthesiaRequired = (patient) => {
  if (Array.isArray(patient?.surgeries) && patient.surgeries.length > 0) {
    const hasYes = patient.surgeries.some(
      (s) => String(s?.anesthesiaRequired || "").trim().toUpperCase() === "Y"
    );
    const allNo = patient.surgeries.every(
      (s) => String(s?.anesthesiaRequired || "").trim().toUpperCase() === "N"
    );
    if (hasYes) return true;
    if (allNo) return false;
  }
  if (
    patient?.anesthesiaRequired !== undefined &&
    patient?.anesthesiaRequired !== null
  ) {
    return String(patient.anesthesiaRequired).trim().toUpperCase() !== "N";
  }
  return true;
};

const OTSurgeryExecution = () => {
  // ==================== WORKLIST STATE ====================
  const [worklistData, setWorklistData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ search: "" });

  // "worklist" | "execution"
  const [view, setView] = useState("worklist");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeTab, setActiveTab] = useState("anaesthesia");

  // Anaesthesia Type master dropdown states
  const [anaesthesiaTypes, setAnaesthesiaTypes] = useState([]);
  const [loadingAnaesthesiaTypes, setLoadingAnaesthesiaTypes] = useState(false);

  const fetchAnaesthesiaTypes = async () => {
    setLoadingAnaesthesiaTypes(true);
    try {
      const res = await getRequest(`${MAS_ANAESTHESIA_TYPE}/getAll/1`);
      if (res?.response && Array.isArray(res.response)) {
        const activeTypes = res.response.filter(
          (item) => String(item.status || "Y").toUpperCase() === "Y"
        );
        setAnaesthesiaTypes(activeTypes);
      } else {
        setAnaesthesiaTypes([]);
      }
    } catch (error) {
      console.error("Error fetching anaesthesia types:", error);
      setAnaesthesiaTypes([]);
    } finally {
      setLoadingAnaesthesiaTypes(false);
    }
  };

  // ASA Grade master dropdown states
  const [asaGrades, setAsaGrades] = useState([]);
  const [loadingAsaGrades, setLoadingAsaGrades] = useState(false);

  const fetchAsaGrades = async () => {
    setLoadingAsaGrades(true);
    try {
      const res = await getRequest(`${MAS_ASA_GRADE}/getAll/1?page=0&size=50`);
      const items = Array.isArray(res?.response?.content)
        ? res.response.content
        : Array.isArray(res?.response)
          ? res.response
          : [];
      const activeGrades = items.filter(
        (item) => String(item.status || "Y").toUpperCase() === "Y"
      );
      setAsaGrades(activeGrades);
    } catch (error) {
      console.error("Error fetching ASA grades:", error);
      setAsaGrades([]);
    } finally {
      setLoadingAsaGrades(false);
    }
  };

  // ----- Fetch OT Surgery Worklist API -----
  const fetchPatientSurgeryWorklist = async (
    page = 0,
    search = appliedFilters.search
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page,
        size: DEFAULT_ITEMS_PER_PAGE,
        checklistStatus: "Y",
      });

      if (search && search.trim()) {
        params.append("search", search.trim());
      }

      const res = await getRequest(`${PATIENT_SURGERY_WORKLIST}?${params.toString()}`);

      if (res?.response) {
        const content = Array.isArray(res.response.content)
          ? res.response.content
          : Array.isArray(res.response)
            ? res.response
            : [];

        const normalized = content.map((item, idx) => {
          let surgeryString = "-";
          let plannedSurgeries = [];
          if (Array.isArray(item.surgeries) && item.surgeries.length > 0) {
            surgeryString =
              item.surgeries
                .map((s) => s.surgeryName)
                .filter(Boolean)
                .join(", ") || "-";
            plannedSurgeries = item.surgeries.map((s) => s.surgeryName).filter(Boolean);
          } else if (typeof item.surgeries === "string" && item.surgeries.trim()) {
            surgeryString = item.surgeries.trim();
            plannedSurgeries = [item.surgeries.trim()];
          } else if (item.surgeryName || item.surgery) {
            surgeryString = item.surgeryName || item.surgery;
            plannedSurgeries = [surgeryString];
          }

          const uhidOrIp = item.uhidNo || item.ipNo || item.uhid || item.bookingNo || "-";
          const scheduledTime = formatScheduledDateTime(item);
          const ageGender =
            item.ageGender ||
            [
              item.age ? (String(item.age).includes("Y") ? item.age : `${item.age} Y`) : null,
              item.gender,
            ].filter(Boolean).join(" / ") ||
            "-";

          const pac =
            item.pacStatus ||
            (item.pacRequired === "N"
              ? "Not Required"
              : item.pacDone === "Y"
                ? "Cleared"
                : item.pacRequired === "Y"
                  ? "Pending"
                  : "N/A");

          const rawChecklistDone = String(item.isChecklistDone || "").toUpperCase();
          const preOpChecklist =
            rawChecklistDone === "Y"
              ? "Completed"
              : rawChecklistDone === "D"
                ? "Draft"
                : "Pending";

          // status me executionStatus if null then Pending Show Kerna
          const status = item.executionStatus ? item.executionStatus : "Pending";

          const isPacPending =
            String(item.pacRequired || "").trim().toUpperCase() === "Y" &&
            String(item.pacDone || "").trim().toUpperCase() !== "Y";

          const isAnesthesiaRequired = checkAnesthesiaRequired(item);

          return {
            ...item,
            id: item.otBookingId ?? item.id ?? (page * DEFAULT_ITEMS_PER_PAGE + idx + 1),
            otBookingId: item.otBookingId,
            otBookingRequestDtId:
              item.otBookingRequestDtId ||
              (Array.isArray(item.surgeries) && item.surgeries[0]?.otBookingRequestDtId) ||
              0,
            uhidOrIp,
            patientName: item.patientName || "-",
            ageGender,
            department: item.departmentName || item.department || "-",
            surgery: surgeryString,
            plannedSurgeries,
            surgeon: item.surgeonName || item.primarySurgeonName || item.surgeon || "-",
            ot: item.otName || item.ot || "-",
            scheduledTime,
            pac,
            isPacPending,
            isAnesthesiaRequired,
            preOpChecklist,
            status,
            executionStatus: item.executionStatus,
          };
        });

        setWorklistData(normalized);
        setTotalItems(
          res.response.totalElements !== undefined
            ? res.response.totalElements
            : content.length
        );
      } else {
        setWorklistData([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching OT surgery worklist:", error);
      showPopup("Failed to fetch OT Surgery Worklist.", "error");
      setWorklistData([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientSurgeryWorklist(0, "");
    fetchAnaesthesiaTypes();
    fetchAsaGrades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchPatientSurgeryWorklist(page - 1, appliedFilters.search);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    const newFilters = { search: searchQuery };
    setAppliedFilters(newFilters);
    fetchPatientSurgeryWorklist(0, searchQuery);
  };

  const handleReset = () => {
    setSearchQuery("");
    setAppliedFilters({ search: "" });
    setCurrentPage(1);
    fetchPatientSurgeryWorklist(0, "");
  };

  const showPopup = (message, type = "info", onCloseCallback = null) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
        if (onCloseCallback) onCloseCallback();
      },
    });
  };

  const getCurrentDateTimeLabel = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  // ==================== EXECUTION VIEW: TAB STATE ====================

  // ----- Anaesthesia -----
  const [anaesthesia, setAnaesthesia] = useState({
    anaesthesiaTypeId: "",
    anaesthesiaType: "",
    anaesthetist: "",
    anaesthetistId: null,
    assistantAnaesthetist: "",
    assistantAnaesthetistId: null,
    anaesthesiaStart: "",
    anaesthesiaEnd: "",
    airwayManagement: "",
    asaGradeId: "",
    asaGrade: "",
    preInductionBP: "",
    preInductionPulse: "",
    preInductionSpO2: "",
    anaesthesiaNotes: "",
    complication: "No",
    complicationDetails: "",
  });

  const [savingAnaesthesia, setSavingAnaesthesia] = useState(false);
  const [savingDrugTemplate, setSavingDrugTemplate] = useState(false);
  const [savingConsumableTemplate, setSavingConsumableTemplate] = useState(false);
  const [savingTab, setSavingTab] = useState(null);

  // ==================== FORM VALIDATION ERRORS ====================
  const [anaesthesiaErrors, setAnaesthesiaErrors] = useState({});
  const [operativeErrors, setOperativeErrors] = useState({});
  const [drugErrors, setDrugErrors] = useState({});

  const validateAnaesthesiaField = (field, value, currentAnaesthesia = anaesthesia) => {
    switch (field) {
      case "anaesthesiaTypeId":
        if (!value) return "Anaesthesia Type is required";
        return "";
      case "anaesthesiaStart":
        if (!value) return "Anaesthesia Start Time is required";
        return "";
      case "anaesthesiaEnd":
        if (
          value &&
          currentAnaesthesia.anaesthesiaStart &&
          new Date(value) < new Date(currentAnaesthesia.anaesthesiaStart)
        ) {
          return "End time cannot be earlier than start time";
        }
        return "";
      case "asaGradeId":
        if (!value) return "ASA Grade is required";
        return "";
      case "preInductionBP": {
        if (!value) return "";
        const val = String(value).trim();
        if (!/^\d{2,3}\/\d{2,3}$/.test(val)) {
          return "Format: Sys/Dia (e.g. 120/80)";
        }
        const [sys, dia] = val.split("/").map(Number);
        if (sys < 50 || sys > 260) return "Systolic typically 50-260";
        if (dia < 30 || dia > 150) return "Diastolic typically 30-150";
        if (sys <= dia) return "Systolic must be > Diastolic";
        return "";
      }
      case "preInductionPulse": {
        if (!value && value !== 0) return "";
        const num = parseInt(value, 10);
        if (isNaN(num) || !/^\d+$/.test(String(value).trim())) return "Invalid pulse rate";
        if (num < 30 || num > 220) return "Typically 30-220 /min";
        return "";
      }
      case "preInductionSpO2": {
        if (!value && value !== 0) return "";
        const num = parseFloat(value);
        if (isNaN(num) || !/^\d+(\.\d+)?$/.test(String(value).trim())) return "Invalid SpO2";
        if (num < 50 || num > 100) return "Typically 50-100%";
        return "";
      }
      case "complicationDetails": {
        if (currentAnaesthesia.complication === "Yes" && (!value || !value.trim())) {
          return "Complication details are required when Complication is Yes";
        }
        return "";
      }
      default:
        return "";
    }
  };

  const handleAnaesthesiaChange = (field, value) => {
    if (field === "preInductionPulse" || field === "preInductionSpO2") {
      if (value !== "" && !/^\d{0,3}$/.test(value)) return;
      if (field === "preInductionSpO2" && Number(value) > 100) return;
    } else if (field === "preInductionBP") {
      if (value !== "" && !/^\d{0,3}(\/\d{0,3})?$/.test(value)) return;
    }

    const updated = { ...anaesthesia, [field]: value };
    if (field === "complication" && value === "No") {
      updated.complicationDetails = "";
    }
    setAnaesthesia(updated);

    if (anaesthesiaErrors[field]) {
      const err = validateAnaesthesiaField(field, value, updated);
      setAnaesthesiaErrors((prev) => ({ ...prev, [field]: err }));
    }
    if (field === "anaesthesiaStart" && anaesthesiaErrors.anaesthesiaEnd) {
      const err = validateAnaesthesiaField("anaesthesiaEnd", updated.anaesthesiaEnd, updated);
      setAnaesthesiaErrors((prev) => ({ ...prev, anaesthesiaEnd: err }));
    }
  };

  const handleAnaesthesiaBlur = (field) => {
    const err = validateAnaesthesiaField(field, anaesthesia[field], anaesthesia);
    setAnaesthesiaErrors((prev) => ({ ...prev, [field]: err }));
  };

  const validateAllAnaesthesia = () => {
    const fieldsToValidate = [
      "anaesthesiaTypeId",
      "anaesthesiaStart",
      "anaesthesiaEnd",
      "asaGradeId",
      "preInductionBP",
      "preInductionPulse",
      "preInductionSpO2",
      "complicationDetails",
    ];
    const newErrors = {};
    let isValid = true;
    fieldsToValidate.forEach((f) => {
      const err = validateAnaesthesiaField(f, anaesthesia[f], anaesthesia);
      if (err) {
        newErrors[f] = err;
        isValid = false;
      }
    });
    setAnaesthesiaErrors(newErrors);
    return isValid;
  };

  // ----- Drugs Used -----
  const [drugRows, setDrugRows] = useState([
    {
      id: 1,
      drugName: "",
      itemId: null,
      qty: "",
      unit: "",
      batchNo: "",
      stockId: null,
      availableStock: null,
      usedBy: getLoggedInUserName(),
      availableBatches: [],
      loadingBatches: false,
    },
  ]);

  const handleAddDrugRow = () => {
    setDrugRows((prev) => [
      ...prev,
      {
        id: prev.length ? Math.max(...prev.map((r) => r.id)) + 1 : 1,
        drugName: "",
        itemId: null,
        qty: "",
        unit: "",
        batchNo: "",
        stockId: null,
        availableStock: null,
        usedBy: getLoggedInUserName(),
        availableBatches: [],
        loadingBatches: false,
      },
    ]);
  };

  const handleRemoveDrugRow = (id) => {
    setDrugRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };

  const handleDrugRowChange = (id, field, value) => {
    setDrugRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  // ----- Inline Drug Dropdown with Scroll Pagination & Batch Fetching State -----
  const [activeDrugDropdownRowId, setActiveDrugDropdownRowId] = useState(null);
  const [showDrugDropdown, setShowDrugDropdown] = useState(false);
  const [drugDropdownOptions, setDrugDropdownOptions] = useState([]);
  const [drugSearchPage, setDrugSearchPage] = useState(0);
  const [drugSearchHasMore, setDrugSearchHasMore] = useState(true);
  const [loadingDrugDropdown, setLoadingDrugDropdown] = useState(false);
  const [drugSearchText, setDrugSearchText] = useState("");
  const [drugDropdownRect, setDrugDropdownRect] = useState(null);
  const drugInputRefs = useRef({});
  const searchTimeoutRef = useRef(null);

  const getHospitalAndDepartmentId = () => {
    const activeStorage = getActiveStorage ? getActiveStorage() : sessionStorage;
    const hospitalId =
      (activeStorage && activeStorage.getItem("hospitalId")) ||
      localStorage.getItem("hospitalId") ||
      sessionStorage.getItem("hospitalId") ||
      "";
    const departmentId =
      (activeStorage && activeStorage.getItem("departmentId")) ||
      localStorage.getItem("departmentId") ||
      sessionStorage.getItem("departmentId") ||
      "";
    return { hospitalId, departmentId };
  };

  const fetchBatchesForItem = async (rowId, itemId) => {
    if (!itemId) return;
    const { hospitalId, departmentId } = getHospitalAndDepartmentId();
    setDrugRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, loadingBatches: true } : r))
    );
    try {
      const response = await getRequest(
        `${GET_ITEM_BATCHES}/${itemId}?hospitalId=${hospitalId}&departmentId=${departmentId}`
      );
      const batches = Array.isArray(response?.response)
        ? response.response
        : Array.isArray(response?.response?.content)
          ? response.response.content
          : [];

      setDrugRows((prev) =>
        prev.map((r) => {
          if (r.id === rowId) {
            const firstBatch = batches.length > 0 ? batches[0] : null;
            return {
              ...r,
              availableBatches: batches,
              loadingBatches: false,
              batchNo: firstBatch ? firstBatch.batchName : (r.batchNo || ""),
              stockId: firstBatch ? firstBatch.stockId : null,
              availableStock: firstBatch
                ? (firstBatch.availableStock ?? firstBatch.batchStock ?? null)
                : null,
            };
          }
          return r;
        })
      );
    } catch (err) {
      console.error("Error fetching medicine batches:", err);
      setDrugRows((prev) =>
        prev.map((r) =>
          r.id === rowId ? { ...r, availableBatches: [], loadingBatches: false } : r
        )
      );
    }
  };

  const updateDrugDropdownRect = (rowId) => {
    const el = drugInputRefs.current[rowId];
    if (el) {
      const rect = el.getBoundingClientRect();
      setDrugDropdownRect({
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (!showDrugDropdown || !activeDrugDropdownRowId) return;
    const recalc = () => updateDrugDropdownRect(activeDrugDropdownRowId);
    window.addEventListener("scroll", recalc, true);
    window.addEventListener("resize", recalc);
    return () => {
      window.removeEventListener("scroll", recalc, true);
      window.removeEventListener("resize", recalc);
    };
  }, [showDrugDropdown, activeDrugDropdownRowId]);

  const fetchDrugOptions = async (query = "", page = 0, isLoadMore = false) => {
    if (!query || !query.trim()) {
      if (!isLoadMore) setDrugDropdownOptions([]);
      return;
    }
    if (loadingDrugDropdown || (!drugSearchHasMore && isLoadMore)) return;
    setLoadingDrugDropdown(true);
    try {
      const response = await getRequest(
        `${GET_ALL_DRUGS_BY_SECTION}?flag=1&search=${encodeURIComponent(query.trim())}&page=${page}&size=20`
      );
      const content =
        response?.response?.content ||
        (Array.isArray(response?.response) ? response.response : []) ||
        (Array.isArray(response) ? response : []);

      const isLast =
        response?.response?.last !== undefined
          ? response.response.last
          : content.length < 20;

      setDrugDropdownOptions((prev) =>
        isLoadMore ? [...prev, ...content] : content
      );
      setDrugSearchPage(page);
      setDrugSearchHasMore(!isLast && content.length > 0);
    } catch (err) {
      console.error("Error fetching drug options:", err);
      if (!isLoadMore) setDrugDropdownOptions([]);
    } finally {
      setLoadingDrugDropdown(false);
    }
  };

  const handleDrugDropdownScroll = (e) => {
    const bottom =
      e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 20;
    if (bottom && drugSearchHasMore && !loadingDrugDropdown) {
      fetchDrugOptions(drugSearchText, drugSearchPage + 1, true);
    }
  };

  const handleDrugInputChange = (rowId, val) => {
    setActiveDrugDropdownRowId(rowId);
    setDrugSearchText(val);
    updateDrugDropdownRect(rowId);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!val || !val.trim()) {
      setDrugRows((prev) =>
        prev.map((r) =>
          r.id === rowId
            ? {
              ...r,
              drugName: "",
              itemId: null,
              unit: "",
              batchNo: "",
              stockId: null,
              availableStock: null,
              availableBatches: [],
              loadingBatches: false,
            }
            : r
        )
      );
      setShowDrugDropdown(false);
      setDrugDropdownOptions([]);
      return;
    }

    handleDrugRowChange(rowId, "drugName", val);
    setShowDrugDropdown(true);

    searchTimeoutRef.current = setTimeout(() => {
      setDrugSearchPage(0);
      setDrugSearchHasMore(true);
      fetchDrugOptions(val.trim(), 0, false);
    }, 1000);
  };

  const handleDrugInputFocus = (rowId, currentVal) => {
    setActiveDrugDropdownRowId(rowId);
    setDrugSearchText(currentVal || "");
    updateDrugDropdownRect(rowId);
    if (currentVal && currentVal.trim() && drugDropdownOptions.length > 0) {
      setShowDrugDropdown(true);
    }
  };

  const handleSelectDrugDropdown = (rowId, item) => {
    const autoUnit =
      item.dispUnitName ||
      item.unitAuName ||
      item.unitName ||
      item.itemClassName ||
      "No";
    setDrugRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          return {
            ...r,
            drugName: item.nomenclature || "",
            itemId: item.itemId,
            unit: autoUnit,
            batchNo: "",
            stockId: null,
            availableStock: null,
            availableBatches: [],
            loadingBatches: Boolean(item.itemId),
          };
        }
        return r;
      })
    );

    setDrugErrors((prev) => ({
      ...prev,
      [`unit_${rowId}`]: "",
    }));

    setShowDrugDropdown(false);
    setActiveDrugDropdownRowId(null);
    setDrugDropdownRect(null);

    if (item.itemId) {
      fetchBatchesForItem(rowId, item.itemId);
    }
  };

  // Helper to extract assigned surgeries from current patient worklist record
  const getPatientSurgeryList = (patient = selectedPatient) => {
    if (!patient) return [];
    const list = [];
    if (Array.isArray(patient.surgeries) && patient.surgeries.length > 0) {
      patient.surgeries.forEach((s) => {
        const id = s.surgeryId || s.id;
        const name = s.surgeryName || s.name;
        if (id && name && !list.some((item) => Number(item.surgeryId) === Number(id))) {
          list.push({ surgeryId: Number(id), surgeryName: name });
        }
      });
    }
    if (list.length === 0) {
      if (patient.surgeryId && patient.surgeryName) {
        list.push({ surgeryId: Number(patient.surgeryId), surgeryName: patient.surgeryName });
      } else if (patient.surgeryName) {
        list.push({
          surgeryId: Number(patient.surgeryId || patient.id || 0),
          surgeryName: patient.surgeryName,
        });
      } else if (patient.surgery) {
        list.push({
          surgeryId: Number(patient.surgeryId || patient.id || 0),
          surgeryName: patient.surgery,
        });
      }
    }
    return list;
  };

  // ----- Drug Templates by Surgery State & Handlers -----
  const [drugTemplates, setDrugTemplates] = useState([]);
  const [loadingDrugTemplates, setLoadingDrugTemplates] = useState(false);
  const [showDrugTemplateModal, setShowDrugTemplateModal] = useState(false);
  const [drugTemplateView, setDrugTemplateView] = useState("list");
  const [drugTemplateFilterSurgeryId, setDrugTemplateFilterSurgeryId] = useState(null);
  const [expandedDrugTemplateId, setExpandedDrugTemplateId] = useState(null);
  const [drugTemplateForm, setDrugTemplateForm] = useState({
    id: null,
    templateName: "",
    surgeryId: null,
    surgeryName: "",
    description: "",
    items: [{ drugName: "", itemId: null, qty: "1", unit: "" }],
  });
  const [templateDrugSearchActiveIdx, setTemplateDrugSearchActiveIdx] = useState(null);
  const [showTemplateDrugDropdown, setShowTemplateDrugDropdown] = useState(false);
  const templateDrugInputRefs = useRef({});
  const [templateDrugDropdownRect, setTemplateDrugDropdownRect] = useState(null);

  const fetchActiveDrugTemplates = async (surgeryId) => {
    if (!surgeryId) return;
    setLoadingDrugTemplates(true);
    try {
      const response = await getRequest(
        `${SURGERY_DRUG_CONSUMABLE_TEMPLATE}/active?surgeryId=${surgeryId}&sectionCode=DRUG`
      );
      const data = response?.response || (Array.isArray(response) ? response : []);
      const templatesList = Array.isArray(data) ? data : (data?.content || []);
      const mapped = templatesList.map((t) => ({
        id: t.templateId,
        templateId: t.templateId,
        surgeryId: t.surgeryId,
        surgeryName: t.surgeryName,
        templateName: t.templateName,
        description: t.description,
        sectionCode: t.sectionCode,
        status: t.status,
        items: (t.items || []).map((it) => ({
          templateDetailId: it.templateDetailId,
          itemId: it.itemId,
          drugName: it.itemName,
          item: it.itemName,
          pvmsNo: it.pvmsNo,
          qty: String(it.plannedQuantity || 1),
          planned: String(it.plannedQuantity || 1),
          unit: it.unitName || "No",
        })),
      }));
      setDrugTemplates(mapped);
    } catch (err) {
      console.error("Error fetching active drug templates:", err);
    } finally {
      setLoadingDrugTemplates(false);
    }
  };

  const openDrugTemplateModal = () => {
    const sList = getPatientSurgeryList();
    const firstSurg = sList[0] || null;
    if (firstSurg) {
      setDrugTemplateFilterSurgeryId(firstSurg.surgeryId);
      fetchActiveDrugTemplates(firstSurg.surgeryId);
    } else {
      setDrugTemplateFilterSurgeryId(null);
      setDrugTemplates([]);
    }
    setDrugTemplateView("list");
    setExpandedDrugTemplateId(null);
    setShowDrugTemplateModal(true);
  };

  const handleNewDrugTemplate = () => {
    const sList = getPatientSurgeryList();
    const currentSurg =
      sList.find((s) => Number(s.surgeryId) === Number(drugTemplateFilterSurgeryId)) ||
      sList[0] ||
      null;
    setDrugTemplateForm({
      id: null,
      templateId: null,
      templateName: "",
      surgeryId: currentSurg?.surgeryId || null,
      surgeryName: currentSurg?.surgeryName || "",
      description: "",
      items: [{ drugName: "", itemId: null, qty: "1", unit: "" }],
    });
    setDrugTemplateView("form");
  };

  const handleEditDrugTemplate = (template) => {
    const sList = getPatientSurgeryList();
    const matchedSurg =
      sList.find(
        (s) =>
          Number(s.surgeryId) === Number(template.surgeryId) ||
          s.surgeryName === template.surgeryName
      ) ||
      sList[0] ||
      null;

    setDrugTemplateForm({
      id: template.id || template.templateId,
      templateId: template.templateId || template.id || null,
      templateName: template.templateName,
      surgeryId: template.surgeryId || matchedSurg?.surgeryId || null,
      surgeryName: template.surgeryName || matchedSurg?.surgeryName || "",
      description: template.description || "",
      items: (template.items || []).map((it) => ({
        drugName: it.drugName || it.itemName || "",
        itemId: it.itemId || null,
        qty: String(it.qty || it.plannedQuantity || "1"),
        unit: it.unit || it.unitName || "",
      })),
    });
    setDrugTemplateView("form");
  };

  const handleDeleteDrugTemplate = (id) => {
    if (window.confirm("Are you sure you want to delete this drug template?")) {
      setDrugTemplates((prev) => prev.filter((t) => t.id !== id && t.templateId !== id));
      showPopup("Drug template deleted successfully.", "success");
    }
  };

  const handleAddTemplateDrugRow = () => {
    setDrugTemplateForm((prev) => ({
      ...prev,
      items: [...prev.items, { drugName: "", itemId: null, qty: "1", unit: "Amp" }],
    }));
  };

  const handleRemoveTemplateDrugRow = (idx) => {
    if (drugTemplateForm.items.length === 1) {
      showPopup("Template must have at least one drug.", "warning");
      return;
    }
    setDrugTemplateForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const handleTemplateDrugRowChange = (idx, field, value) => {
    setDrugTemplateForm((prev) => {
      const updated = [...prev.items];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const handleTemplateDrugInputChange = (idx, val) => {
    handleTemplateDrugRowChange(idx, "drugName", val);
    setTemplateDrugSearchActiveIdx(idx);
    setDrugSearchText(val);

    const el = templateDrugInputRefs.current[idx];
    if (el) {
      const rect = el.getBoundingClientRect();
      setTemplateDrugDropdownRect({
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
      });
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!val || !val.trim()) {
      setShowTemplateDrugDropdown(false);
      setDrugDropdownOptions([]);
      return;
    }

    setShowTemplateDrugDropdown(true);
    searchTimeoutRef.current = setTimeout(() => {
      setDrugSearchPage(0);
      setDrugSearchHasMore(true);
      fetchDrugOptions(val.trim(), 0, false);
    }, 1000);
  };

  const handleSelectTemplateDrug = (idx, item) => {
    const autoUnit = item.dispUnitName || item.unitAuName || item.itemClassName || "";
    setDrugTemplateForm((prev) => {
      const updated = [...prev.items];
      updated[idx] = {
        ...updated[idx],
        drugName: item.nomenclature,
        itemId: item.itemId,
        unit: autoUnit || updated[idx].unit || "Amp",
      };
      return { ...prev, items: updated };
    });
    setShowTemplateDrugDropdown(false);
    setTemplateDrugSearchActiveIdx(null);
    setTemplateDrugDropdownRect(null);
  };

  const handleSaveDrugTemplate = async () => {
    if (!drugTemplateForm.templateName.trim()) {
      showPopup("Please enter template name.", "warning");
      return;
    }
    if (
      drugTemplateForm.items.length === 0 ||
      drugTemplateForm.items.some((it) => !it.drugName || !it.drugName.trim())
    ) {
      showPopup("Please provide medicine name for all rows in template.", "warning");
      return;
    }
    const missingItemId = drugTemplateForm.items.some((it) => !it.itemId);
    if (missingItemId) {
      showPopup(
        "Please select medicines from the search dropdown for all rows so valid item is set.",
        "warning"
      );
      return;
    }

    setSavingDrugTemplate(true);
    try {
      const templateId = drugTemplateForm.templateId || drugTemplateForm.id;
      const payload = {
        ...(templateId ? { templateId: Number(templateId) } : {}),
        surgeryId: Number(drugTemplateForm.surgeryId),
        templateName: drugTemplateForm.templateName.trim(),
        description: drugTemplateForm.description || "",
        items: drugTemplateForm.items.map((it) => ({
          itemId: Number(it.itemId),
          plannedQuantity: Number(it.qty || 1),
        })),
      };

      const res = await postRequest(SURGERY_DRUG_CONSUMABLE_TEMPLATE, payload);
      if (res?.status === 200 || res?.response) {
        showPopup(
          drugTemplateForm.id
          drugTemplateForm.id || drugTemplateForm.templateId
            ? "Drug template updated successfully!"
            : "Drug template created successfully!",
          "success"
        );
        fetchActiveDrugTemplates(drugTemplateForm.surgeryId);
        setDrugTemplateView("list");
      } else {
        showPopup(res?.message || "Failed to save drug template.", "error");
      }
    } catch (err) {
      console.error("Error saving drug template:", err);
      showPopup("Error saving drug template. Please try again.", "error");
    } finally {
      setSavingDrugTemplate(false);
    }
  };

  const handleApplyDrugTemplate = (template) => {
    if (!template || !Array.isArray(template.items) || template.items.length === 0) {
      showPopup("Selected template has no medicines.", "warning");
      return;
    }

    const newRows = template.items.map((it, idx) => ({
      id: Date.now() + idx + Math.floor(Math.random() * 1000),
      drugName: it.drugName || it.itemName || "",
      itemId: it.itemId || null,
      qty: String(it.qty || it.plannedQuantity || "1"),
      unit: it.unit || it.unitName || "Amp",
      batchNo: "",
      stockId: null,
      availableStock: null,
      usedBy: getLoggedInUserName(),
      availableBatches: [],
      loadingBatches: Boolean(it.itemId),
    }));

    setDrugRows((prev) => {
      const isOnlyOneEmptyRow =
        prev.length === 1 && (!prev[0].drugName || !prev[0].drugName.trim());
      if (isOnlyOneEmptyRow) {
        return newRows;
      }
      return [...prev, ...newRows];
    });

    showPopup(
      `Applied template "${template.templateName}" (+${newRows.length} medicines added)!`,
      "success"
    );

    newRows.forEach((r) => {
      if (r.itemId) {
        fetchBatchesForItem(r.id, r.itemId);
      }
    });
  };

  // ----- Consumables Templates by Surgery State & Handlers -----
  const [consumableTemplates, setConsumableTemplates] = useState([]);
  const [loadingConsumableTemplates, setLoadingConsumableTemplates] = useState(false);
  const [showConsumableTemplateModal, setShowConsumableTemplateModal] = useState(false);
  const [consumableTemplateView, setConsumableTemplateView] = useState("list");
  const [consumableTemplateFilterSurgeryId, setConsumableTemplateFilterSurgeryId] = useState(null);
  const [expandedConsumableTemplateId, setExpandedConsumableTemplateId] = useState(null);
  const [consumableTemplateForm, setConsumableTemplateForm] = useState({
    id: null,
    templateName: "",
    surgeryId: null,
    surgeryName: "",
    description: "",
    items: [{ item: "", itemId: null, planned: "1", unit: "" }],
  });
  const [templateConsumableSearchActiveIdx, setTemplateConsumableSearchActiveIdx] = useState(null);
  const [showTemplateConsumableDropdown, setShowTemplateConsumableDropdown] = useState(false);
  const templateConsumableInputRefs = useRef({});
  const [templateConsumableDropdownRect, setTemplateConsumableDropdownRect] = useState(null);

  const fetchActiveConsumableTemplates = async (surgeryId) => {
    if (!surgeryId) return;
    setLoadingConsumableTemplates(true);
    try {
      const response = await getRequest(
        `${SURGERY_DRUG_CONSUMABLE_TEMPLATE}/active?surgeryId=${surgeryId}&sectionCode=NON_DRUG`
      );
      const data = response?.response || (Array.isArray(response) ? response : []);
      const templatesList = Array.isArray(data) ? data : (data?.content || []);
      const mapped = templatesList.map((t) => ({
        id: t.templateId,
        templateId: t.templateId,
        surgeryId: t.surgeryId,
        surgeryName: t.surgeryName,
        templateName: t.templateName,
        description: t.description,
        sectionCode: t.sectionCode,
        status: t.status,
        items: (t.items || []).map((it) => ({
          templateDetailId: it.templateDetailId,
          itemId: it.itemId,
          item: it.itemName,
          drugName: it.itemName,
          pvmsNo: it.pvmsNo,
          planned: String(it.plannedQuantity || 1),
          qty: String(it.plannedQuantity || 1),
          unit: it.unitName || "Nos",
        })),
      }));
      setConsumableTemplates(mapped);
    } catch (err) {
      console.error("Error fetching active consumable templates:", err);
    } finally {
      setLoadingConsumableTemplates(false);
    }
  };

  const openConsumableTemplateModal = () => {
    const sList = getPatientSurgeryList();
    const firstSurg = sList[0] || null;
    if (firstSurg) {
      setConsumableTemplateFilterSurgeryId(firstSurg.surgeryId);
      fetchActiveConsumableTemplates(firstSurg.surgeryId);
    } else {
      setConsumableTemplateFilterSurgeryId(null);
      setConsumableTemplates([]);
    }
    setConsumableTemplateView("list");
    setExpandedConsumableTemplateId(null);
    setShowConsumableTemplateModal(true);
  };

  const handleNewConsumableTemplate = () => {
    const sList = getPatientSurgeryList();
    const currentSurg =
      sList.find((s) => Number(s.surgeryId) === Number(consumableTemplateFilterSurgeryId)) ||
      sList[0] ||
      null;
    setConsumableTemplateForm({
      id: null,
      templateId: null,
      templateName: "",
      surgeryId: currentSurg?.surgeryId || null,
      surgeryName: currentSurg?.surgeryName || "",
      description: "",
      items: [{ item: "", itemId: null, planned: "1", unit: "" }],
    });
    setConsumableTemplateView("form");
  };

  const handleEditConsumableTemplate = (template) => {
    const sList = getPatientSurgeryList();
    const matchedSurg =
      sList.find(
        (s) =>
          Number(s.surgeryId) === Number(template.surgeryId) ||
          s.surgeryName === template.surgeryName
      ) ||
      sList[0] ||
      null;

    setConsumableTemplateForm({
      id: template.id || template.templateId,
      templateId: template.templateId || template.id || null,
      templateName: template.templateName,
      surgeryId: template.surgeryId || matchedSurg?.surgeryId || null,
      surgeryName: template.surgeryName || matchedSurg?.surgeryName || "",
      description: template.description || "",
      items: (template.items || []).map((it) => ({
        item: it.item || it.itemName || "",
        itemId: it.itemId || null,
        planned: String(it.planned || it.plannedQuantity || "1"),
        unit: it.unit || it.unitName || "",
      })),
    });
    setConsumableTemplateView("form");
  };

  const handleDeleteConsumableTemplate = (id) => {
    if (window.confirm("Are you sure you want to delete this consumable template?")) {
      setConsumableTemplates((prev) => prev.filter((t) => t.id !== id && t.templateId !== id));
      showPopup("Consumable template deleted successfully.", "success");
    }
  };

  const handleAddTemplateConsumableRow = () => {
    setConsumableTemplateForm((prev) => ({
      ...prev,
      items: [...prev.items, { item: "", itemId: null, planned: "1", unit: "Nos" }],
    }));
  };

  const handleRemoveTemplateConsumableRow = (idx) => {
    if (consumableTemplateForm.items.length === 1) {
      showPopup("Template must have at least one consumable item.", "warning");
      return;
    }
    setConsumableTemplateForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const handleTemplateConsumableRowChange = (idx, field, value) => {
    setConsumableTemplateForm((prev) => {
      const updated = [...prev.items];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const handleTemplateConsumableInputChange = (idx, val) => {
    handleTemplateConsumableRowChange(idx, "item", val);
    setTemplateConsumableSearchActiveIdx(idx);
    setConsumableSearchText(val);

    const el = templateConsumableInputRefs.current[idx];
    if (el) {
      const rect = el.getBoundingClientRect();
      setTemplateConsumableDropdownRect({
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
      });
    }

    if (consumableSearchTimeoutRef.current) clearTimeout(consumableSearchTimeoutRef.current);

    if (!val || !val.trim()) {
      setShowTemplateConsumableDropdown(false);
      setConsumableDropdownOptions([]);
      return;
    }

    setShowTemplateConsumableDropdown(true);
    consumableSearchTimeoutRef.current = setTimeout(() => {
      setConsumableSearchPage(0);
      setConsumableSearchHasMore(true);
      fetchConsumableOptions(val.trim(), 0, false);
    }, 1000);
  };

  const handleSelectTemplateConsumable = (idx, item) => {
    const autoUnit = item.unitAuName || item.dispUnitName || item.unitName || item.itemClassName || "Nos";
    setConsumableTemplateForm((prev) => {
      const updated = [...prev.items];
      updated[idx] = {
        ...updated[idx],
        item: item.nomenclature,
        itemId: item.itemId,
        unit: autoUnit,
      };
      return { ...prev, items: updated };
    });
    setShowTemplateConsumableDropdown(false);
    setTemplateConsumableSearchActiveIdx(null);
    setTemplateConsumableDropdownRect(null);
  };

  const handleSaveConsumableTemplate = async () => {
    if (!consumableTemplateForm.templateName.trim()) {
      showPopup("Please enter template name.", "warning");
      return;
    }
    if (
      consumableTemplateForm.items.length === 0 ||
      consumableTemplateForm.items.some((it) => !it.item || !it.item.trim())
    ) {
      showPopup("Please provide item name for all rows in template.", "warning");
      return;
    }
    const missingItemId = consumableTemplateForm.items.some((it) => !it.itemId);
    if (missingItemId) {
      showPopup(
        "Please select consumable items from the search dropdown for all rows so valid item is set.",
        "warning"
      );
      return;
    }

    setSavingConsumableTemplate(true);
    try {
      const templateId = consumableTemplateForm.templateId || consumableTemplateForm.id;
      const payload = {
        ...(templateId ? { templateId: Number(templateId) } : {}),
        surgeryId: Number(consumableTemplateForm.surgeryId),
        templateName: consumableTemplateForm.templateName.trim(),
        description: consumableTemplateForm.description || "",
        items: consumableTemplateForm.items.map((it) => ({
          itemId: Number(it.itemId),
          plannedQuantity: Number(it.planned || 1),
        })),
      };

      const res = await postRequest(SURGERY_DRUG_CONSUMABLE_TEMPLATE, payload);
      if (res?.status === 200 || res?.response) {
        showPopup(
          consumableTemplateForm.id
          consumableTemplateForm.id || consumableTemplateForm.templateId
            ? "Consumable template updated successfully!"
            : "Consumable template created successfully!",
          "success"
        );
        fetchActiveConsumableTemplates(consumableTemplateForm.surgeryId);
        setConsumableTemplateView("list");
      } else {
        showPopup(res?.message || "Failed to save consumable template.", "error");
      }
    } catch (err) {
      console.error("Error saving consumable template:", err);
      showPopup("Error saving consumable template. Please try again.", "error");
    } finally {
      setSavingConsumableTemplate(false);
    }
  };

  const handleApplyConsumableTemplate = (template) => {
    if (!template || !Array.isArray(template.items) || template.items.length === 0) {
      showPopup("Selected template has no consumables.", "warning");
      return;
    }

    const newRows = template.items.map((it, idx) => ({
      id: Date.now() + idx + Math.floor(Math.random() * 1000),
      item: it.item || it.itemName || "",
      itemId: it.itemId || null,
      planned: String(it.planned || it.plannedQuantity || "0"),
      used: String(it.planned || it.plannedQuantity || "0"),
      unit: it.unit || it.unitName || "Nos",
      batchNo: "",
      stockId: null,
      availableStock: null,
      availableBatches: [],
      loadingBatches: Boolean(it.itemId),
    }));

    setConsumableRows((prev) => {
      const isOnlyOneEmptyRow =
        prev.length === 1 && (!prev[0].item || !prev[0].item.trim());
      if (isOnlyOneEmptyRow) {
        return newRows;
      }
      return [...prev, ...newRows];
    });

    showPopup(
      `Applied consumable template "${template.templateName}" (+${newRows.length} items added)!`,
      "success"
    );

    newRows.forEach((r) => {
      if (r.itemId) {
        fetchBatchesForConsumable(r.id, r.itemId);
      }
    });
  };

  // ----- Medical Consumables Used -----
  const [consumableRows, setConsumableRows] = useState([
    {
      id: 1,
      item: "",
      itemId: null,
      planned: "0",
      used: "",
      unit: "",
      batchNo: "",
      stockId: null,
      availableStock: null,
      availableBatches: [],
      loadingBatches: false,
    },
  ]);

  const [consumableDropdownOptions, setConsumableDropdownOptions] = useState([]);
  const [loadingConsumableDropdown, setLoadingConsumableDropdown] = useState(false);
  const [showConsumableDropdown, setShowConsumableDropdown] = useState(false);
  const [activeConsumableDropdownRowId, setActiveConsumableDropdownRowId] = useState(null);
  const [consumableSearchPage, setConsumableSearchPage] = useState(0);
  const [consumableSearchHasMore, setConsumableSearchHasMore] = useState(true);
  const [consumableSearchText, setConsumableSearchText] = useState("");
  const consumableInputRefs = useRef({});
  const [consumableDropdownRect, setConsumableDropdownRect] = useState(null);
  const consumableSearchTimeoutRef = useRef(null);

  const updateConsumableDropdownRect = (rowId) => {
    const el = consumableInputRefs.current[rowId];
    if (el) {
      const rect = el.getBoundingClientRect();
      setConsumableDropdownRect({
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (!showConsumableDropdown || !activeConsumableDropdownRowId) return;
    const recalc = () => updateConsumableDropdownRect(activeConsumableDropdownRowId);
    window.addEventListener("scroll", recalc, true);
    window.addEventListener("resize", recalc);
    return () => {
      window.removeEventListener("scroll", recalc, true);
      window.removeEventListener("resize", recalc);
    };
  }, [showConsumableDropdown, activeConsumableDropdownRowId]);

  const fetchConsumableOptions = async (query = "", page = 0, isLoadMore = false) => {
    if (!query || !query.trim()) {
      if (!isLoadMore) setConsumableDropdownOptions([]);
      return;
    }
    if (loadingConsumableDropdown || (!consumableSearchHasMore && isLoadMore)) return;
    setLoadingConsumableDropdown(true);
    try {
      const response = await getRequest(
        `${GET_MEDICAL_CONSUMABLE_ITEMS}?page=${page}&size=10&flag=1&itemName=${encodeURIComponent(query.trim())}`
      );
      const content =
        response?.response?.content ||
        (Array.isArray(response?.response) ? response.response : []) ||
        (Array.isArray(response) ? response : []);

      const isLast =
        response?.response?.last !== undefined
          ? response.response.last
          : content.length < 10;

      setConsumableDropdownOptions((prev) =>
        isLoadMore ? [...prev, ...content] : content
      );
      setConsumableSearchPage(page);
      setConsumableSearchHasMore(!isLast && content.length > 0);
    } catch (err) {
      console.error("Error fetching consumable options:", err);
      if (!isLoadMore) setConsumableDropdownOptions([]);
    } finally {
      setLoadingConsumableDropdown(false);
    }
  };

  const handleConsumableDropdownScroll = (e) => {
    const bottom =
      e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 20;
    if (bottom && consumableSearchHasMore && !loadingConsumableDropdown) {
      fetchConsumableOptions(consumableSearchText, consumableSearchPage + 1, true);
    }
  };

  const handleConsumableInputChange = (rowId, val) => {
    setActiveConsumableDropdownRowId(rowId);
    setConsumableSearchText(val);
    updateConsumableDropdownRect(rowId);

    if (consumableSearchTimeoutRef.current) clearTimeout(consumableSearchTimeoutRef.current);

    if (!val || !val.trim()) {
      setConsumableRows((prev) =>
        prev.map((r) =>
          r.id === rowId
            ? {
              ...r,
              item: "",
              itemId: null,
              unit: "",
              batchNo: "",
              stockId: null,
              availableStock: null,
              availableBatches: [],
              loadingBatches: false,
            }
            : r
        )
      );
      setShowConsumableDropdown(false);
      setConsumableDropdownOptions([]);
      return;
    }

    handleConsumableRowChange(rowId, "item", val);
    setShowConsumableDropdown(true);

    consumableSearchTimeoutRef.current = setTimeout(() => {
      setConsumableSearchPage(0);
      setConsumableSearchHasMore(true);
      fetchConsumableOptions(val.trim(), 0, false);
    }, 1000);
  };

  const handleConsumableInputFocus = (rowId, currentVal) => {
    setActiveConsumableDropdownRowId(rowId);
    setConsumableSearchText(currentVal || "");
    updateConsumableDropdownRect(rowId);
    if (currentVal && currentVal.trim() && consumableDropdownOptions.length > 0) {
      setShowConsumableDropdown(true);
    }
  };

  const handleSelectConsumableDropdown = (rowId, item) => {
    const autoUnit = item.unitAuName || item.dispUnitName || item.unitName || item.itemClassName || "Nos";
    setConsumableRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          return {
            ...r,
            item: item.nomenclature || "",
            itemId: item.itemId,
            unit: autoUnit,
            batchNo: "",
            stockId: null,
            availableStock: null,
            availableBatches: [],
            loadingBatches: Boolean(item.itemId),
          };
        }
        return r;
      })
    );

    setShowConsumableDropdown(false);
    setActiveConsumableDropdownRowId(null);
    setConsumableDropdownRect(null);

    if (item.itemId) {
      fetchBatchesForConsumable(rowId, item.itemId);
    }
  };

  const fetchBatchesForConsumable = async (rowId, itemId) => {
    if (!itemId) return;
    const { hospitalId, departmentId } = getHospitalAndDepartmentId();
    setConsumableRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, loadingBatches: true } : r))
    );
    try {
      const response = await getRequest(
        `${GET_ITEM_BATCHES}/${itemId}?hospitalId=${hospitalId}&departmentId=${departmentId}`
      );
      const batches = Array.isArray(response?.response)
        ? response.response
        : Array.isArray(response?.response?.content)
          ? response.response.content
          : [];

      setConsumableRows((prev) =>
        prev.map((r) => {
          if (r.id === rowId) {
            const firstBatch = batches.length > 0 ? batches[0] : null;
            return {
              ...r,
              availableBatches: batches,
              loadingBatches: false,
              batchNo: firstBatch ? firstBatch.batchName : (r.batchNo || ""),
              stockId: firstBatch ? firstBatch.stockId : null,
              availableStock: firstBatch
                ? (firstBatch.availableStock ?? firstBatch.batchStock ?? null)
                : null,
            };
          }
          return r;
        })
      );
    } catch (err) {
      console.error("Error fetching consumable batches:", err);
      setConsumableRows((prev) =>
        prev.map((r) =>
          r.id === rowId ? { ...r, availableBatches: [], loadingBatches: false } : r
        )
      );
    }
  };

  const handleAddConsumableRow = () => {
    setConsumableRows((prev) => [
      ...prev,
      {
        id: prev.length ? Math.max(...prev.map((r) => r.id)) + 1 : 1,
        item: "",
        itemId: null,
        planned: "0",
        used: "",
        unit: "",
        batchNo: "",
        stockId: null,
        availableStock: null,
        availableBatches: [],
        loadingBatches: false,
      },
    ]);
  };

  const handleRemoveConsumableRow = (id) => {
    setConsumableRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };

  const handleConsumableRowChange = (id, field, value) => {
    setConsumableRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  // ----- Implants -----
  const [implantRows, setImplantRows] = useState([
    { id: 1, implantName: "", sizeSpec: "", qty: "", batchLotNo: "", usedBy: "" },
  ]);

  const handleAddImplantRow = () => {
    setImplantRows((prev) => [
      ...prev,
      { id: prev.length ? Math.max(...prev.map((r) => r.id)) + 1 : 1, implantName: "", sizeSpec: "", qty: "", batchLotNo: "", usedBy: "" },
    ]);
  };

  const handleRemoveImplantRow = (id) => {
    setImplantRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };

  const handleImplantRowChange = (id, field, value) => {
    setImplantRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  // ----- Operative Details -----
  const [operativeDetails, setOperativeDetails] = useState({
    procedurePerformed: "",
    surgicalFindings: "",
    estimatedBloodLoss: "",
    surgeryStartTime: "",
    surgeryEndTime: "",
    additionalNotes: "",
    primarySurgeon: "",
    assistantSurgeon: "",
    preOpDiagnosis: "",
    postOpDiagnosis: "",
    operativeNotes: "",
    drainPlaced: "No",
    complication: "No",
    specimenCollected: "No",
  });

  const validateOperativeField = (field, value, currentOperative = operativeDetails) => {
    switch (field) {
      case "primarySurgeon":
        if (!value || !value.trim()) return "Primary Surgeon is required";
        return "";
      case "surgeryEndTime":
        if (
          value &&
          currentOperative.surgeryStartTime &&
          new Date(value) < new Date(currentOperative.surgeryStartTime)
        ) {
          return "Surgery End Time cannot be earlier than Start Time";
        }
        return "";
      case "estimatedBloodLoss":
        if (value !== "" && (isNaN(Number(value)) || Number(value) < 0)) {
          return "Must be a valid non-negative number";
        }
        return "";
      default:
        return "";
    }
  };

  const handleOperativeChange = (field, value) => {
    if (field === "estimatedBloodLoss") {
      if (value !== "" && !/^\d{0,6}$/.test(value)) return;
    }
    const updated = { ...operativeDetails, [field]: value };
    setOperativeDetails(updated);

    if (operativeErrors[field]) {
      const err = validateOperativeField(field, value, updated);
      setOperativeErrors((prev) => ({ ...prev, [field]: err }));
    }
    if (field === "surgeryStartTime" && operativeErrors.surgeryEndTime) {
      const err = validateOperativeField("surgeryEndTime", updated.surgeryEndTime, updated);
      setOperativeErrors((prev) => ({ ...prev, surgeryEndTime: err }));
    }
  };

  const handleOperativeBlur = (field) => {
    const err = validateOperativeField(field, operativeDetails[field], operativeDetails);
    setOperativeErrors((prev) => ({ ...prev, [field]: err }));
  };

  const validateAllOperative = () => {
    const newErrors = {};
    let isValid = true;
    ["primarySurgeon", "surgeryEndTime", "estimatedBloodLoss"].forEach((f) => {
      const err = validateOperativeField(f, operativeDetails[f], operativeDetails);
      if (err) {
        newErrors[f] = err;
        isValid = false;
      }
    });
    setOperativeErrors(newErrors);
    return isValid;
  };

  const validateAllDrugs = () => {
    let isValid = true;
    const errors = {};
    drugRows.forEach((row) => {
      if (row.drugName && row.drugName.trim()) {
        if (!row.qty || isNaN(Number(row.qty)) || Number(row.qty) <= 0) {
          errors[`qty_${row.id}`] = "Valid qty required";
          isValid = false;
        }
        if (!row.unit) {
          errors[`unit_${row.id}`] = "Unit required";
          isValid = false;
        }
      }
    });
    setDrugErrors(errors);
    return isValid;
  };

  // ----- Specimen -----
  const [specimenRows, setSpecimenRows] = useState([
    { id: 1, specimenName: "", type: "", container: "", sentToLab: "No", remarks: "" },
  ]);

  const handleAddSpecimenRow = () => {
    setSpecimenRows((prev) => [
      ...prev,
      { id: prev.length ? Math.max(...prev.map((r) => r.id)) + 1 : 1, specimenName: "", type: "", container: "", sentToLab: "No", remarks: "" },
    ]);
  };

  const handleRemoveSpecimenRow = (id) => {
    setSpecimenRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };

  const handleSpecimenRowChange = (id, field, value) => {
    setSpecimenRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  // ----- Complications -----
  const [complications, setComplications] = useState({
    anyComplications: "No",
    description: "",
    severity: "",
    actionTaken: "",
  });

  const handleComplicationsChange = (field, value) => {
    setComplications((prev) => ({ ...prev, [field]: value }));
  };

  // ----- Sign-Out -----
  const [signOut, setSignOut] = useState({
    procedureConfirmed: "Yes",
    instrumentCountConfirmed: "Yes",
    spongeCountConfirmed: "Yes",
    specimenLabeled: "Yes",
    equipmentIssues: "No",
    equipmentIssuesNotes: "",
    recoveryConcernsReviewed: "No",
    keyConcernsForRecovery: "",
  });

  const handleSignOutChange = (field, value) => {
    setSignOut((prev) => ({ ...prev, [field]: value }));
  };

  // ==================== VIEW SWITCHING ====================

  const fetchTeamMembers = async (otBookingId, patient) => {
    if (!otBookingId) {
      setOperativeDetails((prev) => ({
        ...prev,
        primarySurgeon:
          patient?.surgeon && patient?.surgeon !== "-" ? patient.surgeon : "",
        assistantSurgeon: "",
      }));
      setAnaesthesia((prev) => ({
        ...prev,
        anaesthetist: "",
        assistantAnaesthetist: "",
      }));
      return;
    }

    try {
      const res = await getRequest(`${OT_TEAM_MEMBER}?otBookingId=${otBookingId}`);
      let teamMembers = [];
      if (res?.response) {
        if (Array.isArray(res.response.teamMembers)) {
          teamMembers = res.response.teamMembers;
        } else if (Array.isArray(res.response)) {
          teamMembers = res.response;
        }
      }

      let primarySurgeon = "";
      let assistantSurgeon = "";
      let anaesthetist = "";
      let anaesthetistId = null;
      let assistantAnaesthetist = "";
      let assistantAnaesthetistId = null;

      teamMembers.forEach((member) => {
        const role = String(member.roleName || "").trim().toLowerCase();
        const roleId = Number(member.otTeamRoleId);
        const name = member.userFullName || member.userName || member.name || "";
        const uid = member.userId || member.id || null;

        if (
          roleId === 1 ||
          role === "primary surgeon" ||
          (role.includes("primary") && role.includes("surgeon")) ||
          member.isPrimary === "Y"
        ) {
          primarySurgeon = name;
        } else if (
          roleId === 2 ||
          role === "assistant surgeon" ||
          (role.includes("assistant") && role.includes("surgeon"))
        ) {
          assistantSurgeon = assistantSurgeon ? `${assistantSurgeon}, ${name}` : name;
        } else if (
          roleId === 4 ||
          role === "assistant anaesthetist" ||
          role === "assistant anesthetist" ||
          (role.includes("assistant") && (role.includes("anaesthet") || role.includes("anesthet")))
        ) {
          assistantAnaesthetist = assistantAnaesthetist ? `${assistantAnaesthetist}, ${name}` : name;
          if (!assistantAnaesthetistId && uid) assistantAnaesthetistId = uid;
        } else if (
          roleId === 3 ||
          role === "anaesthetist" ||
          role === "anesthetist" ||
          ((role.includes("anaesthet") || role.includes("anesthet")) && !role.includes("assistant"))
        ) {
          anaesthetist = anaesthetist ? `${anaesthetist}, ${name}` : name;
          if (!anaesthetistId && uid) anaesthetistId = uid;
        }
      });

      if (!primarySurgeon && patient?.surgeon && patient?.surgeon !== "-") {
        primarySurgeon = patient.surgeon;
      }

      setOperativeDetails((prev) => ({
        ...prev,
        primarySurgeon: primarySurgeon || prev.primarySurgeon || "",
        assistantSurgeon: assistantSurgeon || "",
      }));

      setAnaesthesia((prev) => ({
        ...prev,
        anaesthetist: anaesthetist || "",
        anaesthetistId: anaesthetistId || prev.anaesthetistId || null,
        assistantAnaesthetist: assistantAnaesthetist || "",
        assistantAnaesthetistId:
          assistantAnaesthetistId || prev.assistantAnaesthetistId || null,
      }));
    } catch (error) {
      console.error("Error fetching OT team members:", error);
      setOperativeDetails((prev) => ({
        ...prev,
        primarySurgeon:
          patient?.surgeon && patient?.surgeon !== "-"
            ? patient.surgeon
            : prev.primarySurgeon || "",
        assistantSurgeon: "",
      }));
      setAnaesthesia((prev) => ({
        ...prev,
        anaesthetist: "",
        anaesthetistId: null,
        assistantAnaesthetist: "",
        assistantAnaesthetistId: null,
      }));
    }
  };

  const fetchPacAssessment = async (otBookingId) => {
    if (!otBookingId) return;
    try {
      const res = await getRequest(`${PAC_ASSESSMENT_BY_BOOKING}/${otBookingId}`);
      const assessment = res?.response?.assessment || res?.response;
      if (assessment && typeof assessment === "object") {
        let bp = "";
        if (assessment.bpSystolic && assessment.bpDiastolic) {
          bp = `${assessment.bpSystolic}/${assessment.bpDiastolic}`;
        } else if (assessment.bpSystolic) {
          bp = String(assessment.bpSystolic);
        } else if (assessment.bpDiastolic) {
          bp = String(assessment.bpDiastolic);
        }

        setAnaesthesia((prev) => ({
          ...prev,
          preInductionBP: bp || prev.preInductionBP,
          preInductionPulse:
            assessment.pulse !== undefined && assessment.pulse !== null
              ? String(assessment.pulse)
              : prev.preInductionPulse,
          preInductionSpO2:
            assessment.spo2 !== undefined && assessment.spo2 !== null
              ? String(assessment.spo2)
              : prev.preInductionSpO2,
          asaGradeId:
            assessment.asaGradeId !== undefined && assessment.asaGradeId !== null
              ? String(assessment.asaGradeId)
              : prev.asaGradeId,
          anaesthesiaTypeId:
            assessment.anaesthesiaTypeId && !prev.anaesthesiaTypeId
              ? String(assessment.anaesthesiaTypeId)
              : prev.anaesthesiaTypeId,
          anaesthetistId: assessment.anaesthetistId || prev.anaesthetistId || null,
        }));
      }
    } catch (error) {
      console.error("Error fetching PAC assessment for booking:", error);
    }
  };

  const isSelectedPatientPacPending = Boolean(
    selectedPatient &&
    (selectedPatient?.isPacPending ??
      (String(selectedPatient?.pacRequired || "").trim().toUpperCase() === "Y" &&
        String(selectedPatient?.pacDone || "").trim().toUpperCase() !== "Y"))
  );

  const isSelectedPatientAnesthesiaRequired = Boolean(
    selectedPatient?.isAnesthesiaRequired ?? checkAnesthesiaRequired(selectedPatient)
  );

  const openExecution = (patient) => {
    const isPacPending = Boolean(
      patient?.isPacPending ??
      (String(patient?.pacRequired || "").trim().toUpperCase() === "Y" &&
        String(patient?.pacDone || "").trim().toUpperCase() !== "Y")
    );

    if (isPacPending) {
      showPopup(
        "PAC Clearance is pending (PAC Required: Yes, PAC Done: No). Patient surgery execution cannot be opened.",
        "warning"
      );
      return;
    }

    const anesthesiaRequired =
      patient?.isAnesthesiaRequired ?? checkAnesthesiaRequired(patient);

    setSelectedPatient(patient);
    setActiveTab(anesthesiaRequired ? "anaesthesia" : "drugs");
    // Pre-fill primary surgeon initially from patient data
    setOperativeDetails((prev) => ({
      ...prev,
      primarySurgeon:
        patient?.surgeon && patient?.surgeon !== "-" ? patient.surgeon : "",
      assistantSurgeon: "",
    }));
    setAnaesthesia((prev) => ({
      ...prev,
      anaesthesiaTypeId: "",
      anaesthesiaType: "",
      anaesthetist: "",
      anaesthetistId: null,
      assistantAnaesthetist: "",
      assistantAnaesthetistId: null,
      anaesthesiaStart: new Date().toISOString().slice(0, 16),
      anaesthesiaEnd: "",
      airwayManagement: "",
      asaGradeId: "",
      asaGrade: "",
      preInductionBP: "",
      preInductionPulse: "",
      preInductionSpO2: "",
    }));
    setAnaesthesiaErrors({});
    setOperativeErrors({});
    setDrugErrors({});
    setSignOut({
      procedureConfirmed: "Yes",
      instrumentCountConfirmed: "Yes",
      spongeCountConfirmed: "Yes",
      specimenLabeled: "Yes",
      equipmentIssues: "No",
      equipmentIssuesNotes: "",
      recoveryConcernsReviewed: "No",
      keyConcernsForRecovery: "",
    });
    setDrugRows([
      {
        id: 1,
        drugName: "",
        itemId: null,
        qty: "",
        unit: "",
        batchNo: "",
        stockId: null,
        availableStock: null,
        usedBy: getLoggedInUserName(),
        availableBatches: [],
        loadingBatches: false,
      },
    ]);
    setConsumableRows([
      {
        id: 1,
        item: "",
        itemId: null,
        planned: "0",
        used: "",
        unit: "",
        batchNo: "",
        stockId: null,
        availableStock: null,
        availableBatches: [],
        loadingBatches: false,
      },
    ]);
    setImplantRows([
      { id: 1, implantName: "", sizeSpec: "", qty: "", batchLotNo: "", usedBy: "" },
    ]);
    setView("execution");
    const bookingId = patient?.otBookingId || patient?.id;
    fetchTeamMembers(bookingId, patient);
    fetchPacAssessment(bookingId);
    const sList = getPatientSurgeryList(patient);
    if (sList.length > 0) {
      setDrugTemplateFilterSurgeryId(sList[0].surgeryId);
      setConsumableTemplateFilterSurgeryId(sList[0].surgeryId);
      fetchActiveDrugTemplates(sList[0].surgeryId);
      fetchActiveConsumableTemplates(sList[0].surgeryId);
    }
  };

  const backToWorklist = () => {
    setView("worklist");
    setSelectedPatient(null);
  };

  const handleSaveAnaesthesia = async () => {
    if (isSelectedPatientPacPending) {
      showPopup(
        "PAC Clearance is pending for this patient. Data cannot be saved.",
        "warning"
      );
      return;
    }

    if (!validateAllAnaesthesia()) {
      showPopup(
        "Please resolve validation errors in Anaesthesia details before saving.",
        "error"
      );
      return;
    }

    setSavingAnaesthesia(true);
    try {
      const username = getLoggedInUserName() || "Admin";

      const bookingId = Number(selectedPatient?.otBookingId || selectedPatient?.id) || 0;
      const bookingRequestDtId = Number(
        selectedPatient?.otBookingRequestDtId ||
        selectedPatient?.surgeries?.[0]?.otBookingRequestDtId ||
        0
      );

      if (!bookingId || bookingId <= 0) {
        showPopup("Valid OT Booking ID is required.", "error");
        setSavingAnaesthesia(false);
        return;
      }
      if (!bookingRequestDtId || bookingRequestDtId <= 0) {
        showPopup("Valid OT Booking Request Detail ID is required.", "error");
        setSavingAnaesthesia(false);
        return;
      }

      const payload = {
        otBookingId: bookingId,
        otBookingRequestDtId: bookingRequestDtId,
        surgeryStartDatetime: toIsoStringOrNull(operativeDetails?.surgeryStartTime),
        surgeryEndDatetime: toIsoStringOrNull(operativeDetails?.surgeryEndTime),
        executionStatus: selectedPatient?.executionStatus || "IN_PROGRESS",
        signoutRemarks:
          signOut?.equipmentIssuesNotes ||
          signOut?.keyConcernsForRecovery ||
          signOut?.signoutRemarks ||
          null,
        signoutVerifiedBy: signOut?.confirmedBy || null,
        signoutVerifiedDatetime: null,
        executionRemarks: operativeDetails?.additionalNotes || null,
        anaesthesiaTypeId: anaesthesia.anaesthesiaTypeId
          ? Number(anaesthesia.anaesthesiaTypeId)
          : null,
        anaesthetistId: anaesthesia.anaesthetistId
          ? Number(anaesthesia.anaesthetistId)
          : null,
        assistantAnaesthetistId: anaesthesia.assistantAnaesthetistId
          ? Number(anaesthesia.assistantAnaesthetistId)
          : null,
        anaesthesiaStartDatetime: toIsoStringOrNull(anaesthesia.anaesthesiaStart),
        anaesthesiaEndDatetime: toIsoStringOrNull(anaesthesia.anaesthesiaEnd),
        airwayManagement: anaesthesia.airwayManagement
          ? anaesthesia.airwayManagement.trim()
          : null,
        asaGradeId: anaesthesia.asaGradeId ? Number(anaesthesia.asaGradeId) : null,
        preInductionBp: anaesthesia.preInductionBP
          ? anaesthesia.preInductionBP.trim()
          : null,
        preInductionPulse: anaesthesia.preInductionPulse
          ? parseInt(anaesthesia.preInductionPulse, 10)
          : null,
        preInductionSpo2: anaesthesia.preInductionSpO2
          ? parseFloat(anaesthesia.preInductionSpO2)
          : null,
        anaesthesiaNotes: anaesthesia.anaesthesiaNotes
          ? anaesthesia.anaesthesiaNotes.trim()
          : null,
        complication: toYesNoFlag(anaesthesia.complication, "N"),
        complicationRemarks:
          toYesNoFlag(anaesthesia.complication, "N") === "Y" && anaesthesia.complicationDetails
            ? anaesthesia.complicationDetails.trim()
            : null,
        lastChgBy: username,
      };

      const res = await postRequest(SURGERY_ANAESTHESIA, payload);

      const successMsg =
        res?.message ||
        "Anaesthesia details saved successfully!";
      showPopup(successMsg, "success");

      if (res?.response?.executionStatus) {
        setSelectedPatient((prev) => ({
          ...prev,
          executionStatus: res.response.executionStatus,
          status: res.response.executionStatus,
        }));
      }

      // Refresh worklist so latest status and data reflect
      fetchPatientSurgeryWorklist(currentPage - 1, appliedFilters.search);
    } catch (error) {
      console.error("Error saving anaesthesia details:", error);
      const errorMsg =
        error?.message ||
        error?.response?.message ||
        "Failed to save Anaesthesia details. Please try again.";
      showPopup(errorMsg, "error");
    } finally {
      setSavingAnaesthesia(false);
    }
  };

  const handleSaveTab = (tabLabel) => {
    const handleSaveTab = async (tabLabel) => {
      if (isSelectedPatientPacPending) {
        showPopup(
          "PAC Clearance is pending for this patient. Data cannot be saved.",
          "warning"
        );
        return;
      }

      const currentTab = activeTab.toLowerCase();
      const labelLower = (tabLabel || "").toLowerCase();

      if (currentTab === "anaesthesia" || labelLower.includes("anaesthesia")) {
        handleSaveAnaesthesia();
        return;
      } else if (currentTab === "operative" || labelLower.includes("operative")) {
        if (!validateAllOperative()) {
          showPopup(
            "Please resolve validation errors in Operative details before saving.",
            "error"
          );
          return;
        }
      } else if (
        currentTab === "drugs" ||
        labelLower.includes("drugs") ||
        labelLower.includes("drug")
      ) {
        if (!validateAllDrugs()) {
          showPopup(
            "Please provide valid quantity and unit for entered drugs.",
            "error"
          );
          return;
        }
      }

      showPopup(`${tabLabel} saved successfully!`, "success");
      const tabKey = labelLower.includes("drug")
        ? "drugs"
        : labelLower.includes("consumable")
          ? "consumables"
          : labelLower.includes("implant")
            ? "implants"
            : labelLower.includes("operative")
              ? "operative"
              : labelLower.includes("sign")
                ? "signout"
                : currentTab;

      setSavingTab(tabKey);
      try {
        await new Promise((resolve) => setTimeout(resolve, 600));
        showPopup(`${tabLabel} saved successfully!`, "success");
      } finally {
        setSavingTab(null);
      }
    };

    // ============================================================
    // RENDER: OT SURGERY WORKLIST
    // ============================================================
    const renderWorklist = () => (
      <div className="card form-card">
        <div className="card-header">
          <h4 className="card-title p-2 mb-0">OT Surgery Worklist</h4>
        </div>
        <div className="card-body">
          <div className="mb-4">
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <label className="form-label fw-bold">Search</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by UHID, Patient, Surgery or Surgeon..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                />
              </div>
              <div className="col-md-3 d-flex gap-2">
                <button
                  className="btn btn-primary"
                  onClick={handleSearch}
                  disabled={loading}
                >
                  <i className="fa fa-search me-1"></i> Search
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-1"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Searching...
                    </>
                  ) : (
                    <>
                      <i className="fa fa-search me-1"></i> Search
                    </>
                  )}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleReset}
                  disabled={loading}
                >
                  <i className="fa fa-refresh me-1"></i> Reset
                </button>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>UHID / IP No.</th>
                  <th>Patient</th>
                  <th>Age / Gender</th>
                  <th>Department</th>
                  <th>Surgery</th>
                  <th>Surgeon</th>
                  <th>OT</th>
                  <th>Scheduled Time</th>
                  <th>PAC</th>
                  <th>Pre-Op Checklist</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {worklistData.length > 0 ? (
                  worklistData.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => openExecution(item)}
                      style={{
                        cursor: item.isPacPending ? "not-allowed" : "pointer",
                        backgroundColor: item.isPacPending ? "#fff7f7" : undefined,
                      }}
                      className={item.isPacPending ? "text-muted" : ""}
                      title={
                        item.isPacPending
                          ? "PAC Clearance is pending (PAC Required: Yes, PAC Done: No). Cannot open OT Surgery Execution."
                          : "Click to open OT Surgery Execution"
                      }
                    >
                      <td>{item.uhidOrIp}</td>
                      <td>{item.patientName}</td>
                      <td>{item.ageGender}</td>
                      <td>{item.department}</td>
                      <td>{item.surgery}</td>
                      <td>{item.surgeon}</td>
                      <td>{item.ot}</td>
                      <td>{item.scheduledTime}</td>
                      <td>{getPacBadge(item)}</td>
                      <td>{getChecklistBadge(item)}</td>
                      <td className="text-center">
                        {getExecutionStatusBadge(item.status)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" className="text-center">
                      No patients in the worklist.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            totalItems={totalItems}
            itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    );

    // ============================================================
    // RENDER: TAB CONTENT
    // ============================================================

    const renderAnaesthesiaTab = () => (
      <div>
        <h5 className="fw-bold mb-2">Anaesthesia Details</h5>
        <div className="row">
          <div className="col-md-3 mb-3">
            <label className="form-label fw-bold">
              Anaesthesia Type <span className="text-danger">*</span>
            </label>
            <select
              className={`form-select ${anaesthesiaErrors.anaesthesiaTypeId ? "is-invalid" : ""}`}
              value={anaesthesia.anaesthesiaTypeId}
              onChange={(e) => {
                const selectedId = e.target.value;
                const selectedItem = anaesthesiaTypes.find(
                  (item) => String(item.anaesthesiaTypeId) === String(selectedId)
                );
                setAnaesthesia((prev) => ({
                  ...prev,
                  anaesthesiaTypeId: selectedId,
                  anaesthesiaType: selectedItem?.anaesthesiaTypeName || "",
                }));
                if (anaesthesiaErrors.anaesthesiaTypeId) {
                  setAnaesthesiaErrors((prev) => ({ ...prev, anaesthesiaTypeId: "" }));
                }
              }}
              onBlur={() => handleAnaesthesiaBlur("anaesthesiaTypeId")}
              disabled={loadingAnaesthesiaTypes}
            >
              <option value="">
                {loadingAnaesthesiaTypes ? "Loading anaesthesia types..." : "Select Anaesthesia Type"}
              </option>
              {anaesthesiaTypes.map((item) => (
                <option key={item.anaesthesiaTypeId} value={item.anaesthesiaTypeId}>
                  {item.anaesthesiaTypeName}
                </option>
              ))}
            </select>
            {anaesthesiaErrors.anaesthesiaTypeId && (
              <div className="invalid-feedback d-block">{anaesthesiaErrors.anaesthesiaTypeId}</div>
            )}
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label fw-bold">Anaesthetist</label>
            <input
              type="text"
              className="form-control"
              value={anaesthesia.anaesthetist}
              onChange={(e) => handleAnaesthesiaChange("anaesthetist", e.target.value)}
            />
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label fw-bold">Assistant Anaesthetist</label>
            <input
              type="text"
              className="form-control"
              value={anaesthesia.assistantAnaesthetist}
              onChange={(e) => handleAnaesthesiaChange("assistantAnaesthetist", e.target.value)}
            />
          </div>

          <div className="col-md-3 mb-3">
            <label className="form-label fw-bold">
              Anaesthesia Start <span className="text-danger">*</span>
            </label>
            <input
              type="datetime-local"
              className={`form-control ${anaesthesiaErrors.anaesthesiaStart ? "is-invalid" : ""}`}
              value={anaesthesia.anaesthesiaStart}
              onChange={(e) => handleAnaesthesiaChange("anaesthesiaStart", e.target.value)}
              onBlur={() => handleAnaesthesiaBlur("anaesthesiaStart")}
            />
            {anaesthesiaErrors.anaesthesiaStart && (
              <div className="invalid-feedback d-block">{anaesthesiaErrors.anaesthesiaStart}</div>
            )}
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label fw-bold">Anaesthesia End</label>
            <input
              type="datetime-local"
              className={`form-control ${anaesthesiaErrors.anaesthesiaEnd ? "is-invalid" : ""}`}
              value={anaesthesia.anaesthesiaEnd}
              onChange={(e) => handleAnaesthesiaChange("anaesthesiaEnd", e.target.value)}
              onBlur={() => handleAnaesthesiaBlur("anaesthesiaEnd")}
            />
            {anaesthesiaErrors.anaesthesiaEnd && (
              <div className="invalid-feedback d-block">{anaesthesiaErrors.anaesthesiaEnd}</div>
            )}
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label fw-bold">Airway Management</label>
            <input
              type="text"
              className="form-control"
              value={anaesthesia.airwayManagement}
              onChange={(e) => handleAnaesthesiaChange("airwayManagement", e.target.value)}
              placeholder="e.g. Laryngeal Mask Airway"
            />
          </div>

          <div className="col-md-3 mb-3">
            <label className="form-label fw-bold">
              ASA Grade <span className="text-danger">*</span>
            </label>
            <select
              className={`form-select ${anaesthesiaErrors.asaGradeId ? "is-invalid" : ""}`}
              value={anaesthesia.asaGradeId || ""}
              onChange={(e) => {
                const val = e.target.value;
                const selectedGrade = asaGrades.find(
                  (grade) => String(grade.gradeId) === String(val)
                );
                setAnaesthesia((prev) => ({
                  ...prev,
                  asaGradeId: val,
                  asaGrade: selectedGrade?.gradeName || selectedGrade?.gradeCode || "",
                }));
                if (anaesthesiaErrors.asaGradeId) {
                  setAnaesthesiaErrors((prev) => ({ ...prev, asaGradeId: "" }));
                }
              }}
              onBlur={() => handleAnaesthesiaBlur("asaGradeId")}
              disabled={loadingAsaGrades}
            >
              <option value="">
                {loadingAsaGrades ? "Loading ASA grades..." : "Select ASA Grade"}
              </option>
              {asaGrades.map((grade) => (
                <option
                  key={grade.gradeId}
                  value={grade.gradeId}
                  title={grade.description || ""}
                >
                  {grade.gradeName || grade.gradeCode}
                  {grade.description ? ` - ${grade.description}` : ""}
                </option>
              ))}
            </select>
            {anaesthesiaErrors.asaGradeId && (
              <div className="invalid-feedback d-block">{anaesthesiaErrors.asaGradeId}</div>
            )}
          </div>
        </div>

        <h6 className="fw-bold text-primary mb-3 mt-2">Pre-Induction Vitals</h6>
        <div className="row">
          <div className="col-md-3 mb-3">
            <label className="form-label fw-bold">BP (Sys/Dia)</label>
            <input
              type="text"
              className={`form-control ${anaesthesiaErrors.preInductionBP ? "is-invalid" : ""}`}
              value={anaesthesia.preInductionBP}
              onChange={(e) => handleAnaesthesiaChange("preInductionBP", e.target.value)}
              onBlur={() => handleAnaesthesiaBlur("preInductionBP")}
              placeholder="e.g. 120/80"
            />
            {anaesthesiaErrors.preInductionBP && (
              <div className="invalid-feedback d-block">{anaesthesiaErrors.preInductionBP}</div>
            )}
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label fw-bold">Pulse (/min)</label>
            <input
              type="text"
              inputMode="numeric"
              className={`form-control ${anaesthesiaErrors.preInductionPulse ? "is-invalid" : ""}`}
              value={anaesthesia.preInductionPulse}
              onChange={(e) => handleAnaesthesiaChange("preInductionPulse", e.target.value)}
              onBlur={() => handleAnaesthesiaBlur("preInductionPulse")}
              placeholder="e.g. 78"
            />
            {anaesthesiaErrors.preInductionPulse && (
              <div className="invalid-feedback d-block">{anaesthesiaErrors.preInductionPulse}</div>
            )}
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label fw-bold">SpO2 (%)</label>
            <input
              type="text"
              inputMode="numeric"
              className={`form-control ${anaesthesiaErrors.preInductionSpO2 ? "is-invalid" : ""}`}
              value={anaesthesia.preInductionSpO2}
              onChange={(e) => handleAnaesthesiaChange("preInductionSpO2", e.target.value)}
              onBlur={() => handleAnaesthesiaBlur("preInductionSpO2")}
              placeholder="e.g. 99"
            />
            {anaesthesiaErrors.preInductionSpO2 && (
              <div className="invalid-feedback d-block">{anaesthesiaErrors.preInductionSpO2}</div>
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label fw-bold">Anaesthesia Notes</label>
            <textarea
              className="form-control"
              rows="2"
              value={anaesthesia.anaesthesiaNotes}
              onChange={(e) => handleAnaesthesiaChange("anaesthesiaNotes", e.target.value)}
            />
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label fw-bold">Complication</label>
            <select
              className="form-select"
              value={anaesthesia.complication}
              onChange={(e) => handleAnaesthesiaChange("complication", e.target.value)}
            >
              {YES_NO_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          {anaesthesia.complication === "Yes" && (
            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold">
                If Yes <span className="text-danger">*</span>
              </label>
              <textarea
                className={`form-control ${anaesthesiaErrors.complicationDetails ? "is-invalid" : ""}`}
                rows="2"
                value={anaesthesia.complicationDetails}
                onChange={(e) => handleAnaesthesiaChange("complicationDetails", e.target.value)}
                onBlur={() => handleAnaesthesiaBlur("complicationDetails")}
                placeholder="Describe the complication"
              />
              {anaesthesiaErrors.complicationDetails && (
                <div className="invalid-feedback d-block">{anaesthesiaErrors.complicationDetails}</div>
              )}
            </div>
          )}
        </div>

        <div className="d-flex justify-content-end">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSaveAnaesthesia}
            disabled={savingAnaesthesia || isSelectedPatientPacPending}
            title={
              isSelectedPatientPacPending
                ? "PAC Clearance is pending. Cannot save data."
                : ""
            }
          >
            {savingAnaesthesia ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Saving Anaesthesia...
              </>
            ) : (
              <>
                <i className="fa fa-save me-1"></i> Save Anaesthesia
              </>
            )}
          </button>
        </div>
      </div>
    );

    const renderDrugsTab = () => (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="fw-bold mb-0">Drugs Used During Surgery</h6>
          <div>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm me-2"
              onClick={openDrugTemplateModal}
            >
              <i className="fa fa-folder-open me-1"></i> Drug Templates
            </button>
            <button className="btn btn-success btn-sm" onClick={handleAddDrugRow}>
              <i className="fa fa-plus me-1"></i> Add Drug
            </button>
          </div>
        </div>

        <div className="table-responsive" style={{ minHeight: "220px" }}>
          <table className="table table-bordered table-sm align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ minWidth: "240px" }}>Drug</th>
                <th style={{ width: "90px" }}>Qty</th>
                <th style={{ width: "120px" }}>Unit</th>
                <th style={{ minWidth: "180px", width: "200px" }}>Batch No.</th>
                <th style={{ width: "150px" }}>Used By</th>
                <th style={{ width: "50px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {drugRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      type="text"
                      ref={(el) => (drugInputRefs.current[row.id] = el)}
                      className="form-control form-control-sm"
                      value={row.drugName}
                      onChange={(e) => handleDrugInputChange(row.id, e.target.value)}
                      onFocus={() => handleDrugInputFocus(row.id, row.drugName)}
                      onBlur={() => {
                        setTimeout(() => {
                          if (activeDrugDropdownRowId === row.id) {
                            setShowDrugDropdown(false);
                          }
                        }, 250);
                      }}
                      placeholder="Type drug name to search..."
                      autoComplete="off"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className={`form-control form-control-sm ${drugErrors[`qty_${row.id}`] ? "is-invalid" : ""
                        }`}
                      value={row.qty}
                      onChange={(e) => {
                        handleDrugRowChange(row.id, "qty", e.target.value);
                        if (drugErrors[`qty_${row.id}`]) {
                          setDrugErrors((prev) => ({ ...prev, [`qty_${row.id}`]: "" }));
                        }
                      }}
                    />
                    {drugErrors[`qty_${row.id}`] && (
                      <div className="invalid-feedback d-block" style={{ fontSize: "11px" }}>
                        {drugErrors[`qty_${row.id}`]}
                      </div>
                    )}
                  </td>
                  <td>
                    <input
                      type="text"
                      className={`form-control form-control-sm bg-light ${drugErrors[`unit_${row.id}`] ? "is-invalid" : ""
                        }`}
                      value={row.unit || ""}
                      readOnly
                      title="Unit is set automatically from selected drug and cannot be updated"
                      style={{ backgroundColor: "#e9ecef" }}
                      placeholder="Unit"
                    />
                    {drugErrors[`unit_${row.id}`] && (
                      <div className="invalid-feedback d-block" style={{ fontSize: "11px" }}>
                        {drugErrors[`unit_${row.id}`]}
                      </div>
                    )}
                  </td>
                  <td>
                    {row.loadingBatches ? (
                      <div className="d-flex align-items-center text-muted py-1" style={{ fontSize: "11px" }}>
                        <span className="spinner-border spinner-border-sm me-1 text-primary" role="status" aria-hidden="true"></span>
                        Loading batches...
                      </div>
                    ) : !row.itemId ? (
                      <select className="form-select form-select-sm" disabled>
                        <option value="">Select drug first</option>
                      </select>
                    ) : row.availableBatches && row.availableBatches.length > 0 ? (
                      <div>
                        <select
                          className="form-select form-select-sm"
                          value={row.batchNo}
                          onChange={(e) => {
                            const val = e.target.value;
                            const bObj = row.availableBatches.find((b) => b.batchName === val);
                            setDrugRows((prev) =>
                              prev.map((r) =>
                                r.id === row.id
                                  ? {
                                    ...r,
                                    batchNo: val,
                                    stockId: bObj?.stockId || null,
                                    availableStock:
                                      bObj?.availableStock ?? bObj?.batchStock ?? null,
                                  }
                                  : r
                              )
                            );
                          }}
                        >
                          <option value="">Select Batch</option>
                          {row.availableBatches.map((b) => (
                            <option key={b.stockId || b.batchName} value={b.batchName}>
                              {b.batchName} (Stock: {b.availableStock ?? b.batchStock ?? 0}
                              {b.doe ? `, Exp: ${b.doe}` : ""})
                            </option>
                          ))}
                        </select>
                        {row.availableStock !== undefined && row.availableStock !== null && (
                          <small className="text-muted d-block mt-1" style={{ fontSize: "10px" }}>
                            Avail Stock: {row.availableStock}
                          </small>
                        )}
                      </div>
                    ) : (
                      <select className="form-select form-select-sm" disabled>
                        <option value="">No Batch Available</option>
                      </select>
                    )}
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={row.usedBy}
                      onChange={(e) => handleDrugRowChange(row.id, "usedBy", e.target.value)}
                    />
                  </td>
                  <td className="text-center">
                    <button className="btn btn-outline-danger btnDel" title="Delete" onClick={() => handleRemoveDrugRow(row.id)}
                      disabled={drugRows.length === 1}><i className="icofont-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-end">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleSaveTab("Drugs used")}
            disabled={isSelectedPatientPacPending}
            disabled={Boolean(savingTab) || isSelectedPatientPacPending}
            title={isSelectedPatientPacPending ? "PAC Clearance is pending. Cannot save data." : ""}
          >
            Save Drugs
            {savingTab === "drugs" ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Saving Drugs...
              </>
            ) : (
              <>
                <i className="fa fa-save me-1"></i> Save Drugs
              </>
            )}
          </button>
        </div>
      </div>
    );

    const renderConsumablesTab = () => (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="fw-bold mb-0">Medical Consumables Used</h6>
          <div>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm me-2"
              onClick={openConsumableTemplateModal}
            >
              <i className="fa fa-folder-open me-1"></i> Consumable Templates
            </button>
            <button className="btn btn-success btn-sm" onClick={handleAddConsumableRow}>
              <i className="fa fa-plus me-1"></i> Add Consumable
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered table-sm align-middle">
            <thead className="table-light">
              <tr>
                <th>Item</th>
                <th style={{ width: "90px" }}>Planned</th>
                <th style={{ width: "90px" }}>Used</th>
                <th style={{ width: "110px" }}>Unit</th>
                <th style={{ width: "180px" }}>Batch</th>
                <th style={{ width: "50px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {consumableRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      type="text"
                      ref={(el) => (consumableInputRefs.current[row.id] = el)}
                      className="form-control form-control-sm"
                      value={row.item}
                      onChange={(e) => handleConsumableInputChange(row.id, e.target.value)}
                      onFocus={() => handleConsumableInputFocus(row.id, row.item)}
                      onBlur={() => {
                        setTimeout(() => {
                          if (activeConsumableDropdownRowId === row.id) {
                            setShowConsumableDropdown(false);
                          }
                        }, 250);
                      }}
                      placeholder="Type consumable name to search..."
                      autoComplete="off"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={row.planned}
                      readOnly
                      style={{ backgroundColor: "#e9ecef" }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={row.used}
                      onChange={(e) => handleConsumableRowChange(row.id, "used", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-light"
                      value={row.unit || ""}
                      readOnly
                      title="Unit is set automatically from selected item and cannot be updated"
                      style={{ backgroundColor: "#e9ecef" }}
                      placeholder="Unit"
                    />
                  </td>
                  <td>
                    {row.loadingBatches ? (
                      <div className="d-flex align-items-center text-muted py-1" style={{ fontSize: "11px" }}>
                        <span className="spinner-border spinner-border-sm me-1 text-primary" role="status" aria-hidden="true"></span>
                        Loading batches...
                      </div>
                    ) : !row.itemId ? (
                      <select className="form-select form-select-sm" disabled>
                        <option value="">Select item first</option>
                      </select>
                    ) : row.availableBatches && row.availableBatches.length > 0 ? (
                      <div>
                        <select
                          className="form-select form-select-sm"
                          value={row.batchNo}
                          onChange={(e) => {
                            const val = e.target.value;
                            const bObj = row.availableBatches.find((b) => b.batchName === val);
                            setConsumableRows((prev) =>
                              prev.map((r) =>
                                r.id === row.id
                                  ? {
                                    ...r,
                                    batchNo: val,
                                    stockId: bObj?.stockId || null,
                                    availableStock:
                                      bObj?.availableStock ?? bObj?.batchStock ?? null,
                                  }
                                  : r
                              )
                            );
                          }}
                        >
                          <option value="">Select Batch</option>
                          {row.availableBatches.map((b) => (
                            <option key={b.stockId || b.batchName} value={b.batchName}>
                              {b.batchName} (Stock: {b.availableStock ?? b.batchStock ?? 0}
                              {b.doe ? `, Exp: ${b.doe}` : ""})
                            </option>
                          ))}
                        </select>
                        {row.availableStock !== undefined && row.availableStock !== null && (
                          <small className="text-muted d-block mt-1" style={{ fontSize: "10px" }}>
                            Avail Stock: {row.availableStock}
                          </small>
                        )}
                      </div>
                    ) : (
                      <select className="form-select form-select-sm" disabled>
                        <option value="">No Batch Available</option>
                      </select>
                    )}
                  </td>
                  <td className="text-center">
                    <button className="btn btn-outline-danger btnDel" title="Delete" onClick={() => handleRemoveConsumableRow(row.id)}
                      disabled={consumableRows.length === 1}><i className="icofont-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-end">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleSaveTab("Consumables used")}
            disabled={isSelectedPatientPacPending}
            disabled={Boolean(savingTab) || isSelectedPatientPacPending}
            title={isSelectedPatientPacPending ? "PAC Clearance is pending. Cannot save data." : ""}
          >
            Save Consumables
            {savingTab === "consumables" ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Saving Consumables...
              </>
            ) : (
              <>
                <i className="fa fa-save me-1"></i> Save Consumables
              </>
            )}
          </button>
        </div>
      </div>
    );

    const renderImplantsTab = () => (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="fw-bold mb-0">Implants Used</h6>
          <button className="btn btn-success btn-sm" onClick={handleAddImplantRow}>
            <i className="fa fa-plus me-1"></i> Add Implant
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered table-sm align-middle">
            <thead className="table-light">
              <tr>
                <th>Implant</th>
                <th style={{ width: "120px" }}>Size / Spec</th>
                <th style={{ width: "80px" }}>Qty</th>
                <th style={{ width: "140px" }}>Batch / Lot No.</th>
                <th>Used By</th>
                <th style={{ width: "50px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {implantRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={row.implantName}
                      onChange={(e) => handleImplantRowChange(row.id, "implantName", e.target.value)}
                      placeholder="Implant name"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={row.sizeSpec}
                      onChange={(e) => handleImplantRowChange(row.id, "sizeSpec", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={row.qty}
                      onChange={(e) => handleImplantRowChange(row.id, "qty", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={row.batchLotNo}
                      onChange={(e) => handleImplantRowChange(row.id, "batchLotNo", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={row.usedBy}
                      onChange={(e) => handleImplantRowChange(row.id, "usedBy", e.target.value)}
                    />
                  </td>
                  <td className="text-center">
                    <button className="btn btn-outline-danger btnDel" title="Delete" onClick={() => handleRemoveImplantRow(row.id)}
                      disabled={implantRows.length === 1}><i class="icofont-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-end">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleSaveTab("Implants used")}
            disabled={isSelectedPatientPacPending}
            disabled={Boolean(savingTab) || isSelectedPatientPacPending}
            title={isSelectedPatientPacPending ? "PAC Clearance is pending. Cannot save data." : ""}
          >
            Save Implants
            {savingTab === "implants" ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Saving Implants...
              </>
            ) : (
              <>
                <i className="fa fa-save me-1"></i> Save Implants
              </>
            )}
          </button>
        </div>
      </div>
    );

    const renderOperativeTab = () => (
      <div>
        <h6 className="fw-bold mb-2">Operative Details</h6>
        <div className="row">
          <div className="col-md-3 mb-3">
            <label className="form-label">Surgery Start Time</label>
            <input
              type="datetime-local"
              className="form-control"
              value={operativeDetails.surgeryStartTime}
              onChange={(e) => handleOperativeChange("surgeryStartTime", e.target.value)}
            />
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label">Surgery End Time</label>
            <input
              type="datetime-local"
              className={`form-control ${operativeErrors.surgeryEndTime ? "is-invalid" : ""}`}
              value={operativeDetails.surgeryEndTime}
              onChange={(e) => handleOperativeChange("surgeryEndTime", e.target.value)}
              onBlur={() => handleOperativeBlur("surgeryEndTime")}
            />
            {operativeErrors.surgeryEndTime && (
              <div className="invalid-feedback d-block">{operativeErrors.surgeryEndTime}</div>
            )}
          </div>

          <div className="col-md-3 mb-3">
            <label className="form-label fw-bold">
              Primary Surgeon <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${operativeErrors.primarySurgeon ? "is-invalid" : ""}`}
              value={operativeDetails.primarySurgeon}
              onChange={(e) => handleOperativeChange("primarySurgeon", e.target.value)}
              onBlur={() => handleOperativeBlur("primarySurgeon")}
            />
            {operativeErrors.primarySurgeon && (
              <div className="invalid-feedback d-block">{operativeErrors.primarySurgeon}</div>
            )}
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label">Assistant Surgeon</label>
            <input
              type="text"
              className="form-control"
              value={operativeDetails.assistantSurgeon}
              onChange={(e) => handleOperativeChange("assistantSurgeon", e.target.value)}
            />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Pre Op Diagnosis</label>
            <textarea
              className="form-control"
              rows="2"
              value={operativeDetails.preOpDiagnosis}
              onChange={(e) => handleOperativeChange("preOpDiagnosis", e.target.value)}
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Post Op Diagnosis</label>
            <textarea
              className="form-control"
              rows="2"
              value={operativeDetails.postOpDiagnosis}
              onChange={(e) => handleOperativeChange("postOpDiagnosis", e.target.value)}
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Procedure Performed</label>
            <textarea
              className="form-control"
              rows="3"
              value={operativeDetails.procedurePerformed}
              onChange={(e) => handleOperativeChange("procedurePerformed", e.target.value)}
              placeholder="Describe the procedure performed"
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Operative Notes</label>
            <textarea
              className="form-control"
              rows="3"
              value={operativeDetails.operativeNotes}
              onChange={(e) => handleOperativeChange("operativeNotes", e.target.value)}
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Surgical Findings</label>
            <textarea
              className="form-control"
              rows="3"
              value={operativeDetails.surgicalFindings}
              onChange={(e) => handleOperativeChange("surgicalFindings", e.target.value)}
            />
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label">Estimated Blood Loss (ml)</label>
            <input
              type="text"
              inputMode="numeric"
              className={`form-control ${operativeErrors.estimatedBloodLoss ? "is-invalid" : ""}`}
              value={operativeDetails.estimatedBloodLoss}
              onChange={(e) => handleOperativeChange("estimatedBloodLoss", e.target.value)}
              onBlur={() => handleOperativeBlur("estimatedBloodLoss")}
              placeholder="e.g. 100"
            />
            {operativeErrors.estimatedBloodLoss && (
              <div className="invalid-feedback d-block">{operativeErrors.estimatedBloodLoss}</div>
            )}
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label">Drain Placed</label>
            <select
              className="form-select"
              value={operativeDetails.drainPlaced}
              onChange={(e) => handleOperativeChange("drainPlaced", e.target.value)}
            >
              {YES_NO_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label">Complication</label>
            <select
              className="form-select"
              value={operativeDetails.complication}
              onChange={(e) => handleOperativeChange("complication", e.target.value)}
            >
              {YES_NO_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label">Specimen Collected</label>
            <select
              className="form-select"
              value={operativeDetails.specimenCollected}
              onChange={(e) => handleOperativeChange("specimenCollected", e.target.value)}
            >
              {YES_NO_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Additional Notes</label>
            <textarea
              className="form-control"
              rows="2"
              value={operativeDetails.additionalNotes}
              onChange={(e) => handleOperativeChange("additionalNotes", e.target.value)}
            />
          </div>

        </div>


        <div className="d-flex justify-content-end">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleSaveTab("Operative details")}
            disabled={isSelectedPatientPacPending}
            disabled={Boolean(savingTab) || isSelectedPatientPacPending}
            title={isSelectedPatientPacPending ? "PAC Clearance is pending. Cannot save data." : ""}
          >
            Save Operative Details
            {savingTab === "operative" ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Saving Operative Details...
              </>
            ) : (
              <>
                <i className="fa fa-save me-1"></i> Save Operative Details
              </>
            )}
          </button>
        </div>
      </div>
    );

    const renderSpecimenTab = () => (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="fw-bold mb-0">Specimens Sent</h6>
          <button className="btn btn-success btn-sm" onClick={handleAddSpecimenRow}>
            <i className="fa fa-plus me-1"></i> Add Specimen
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered table-sm align-middle">
            <thead className="table-light">
              <tr>
                <th>Specimen Name</th>
                <th style={{ width: "160px" }}>Type</th>
                <th style={{ width: "160px" }}>Container</th>
                <th style={{ width: "110px" }}>Sent to Lab</th>
                <th>Remarks</th>
                <th style={{ width: "50px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {specimenRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={row.specimenName}
                      onChange={(e) => handleSpecimenRowChange(row.id, "specimenName", e.target.value)}
                      placeholder="e.g. Excised tissue"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={row.type}
                      onChange={(e) => handleSpecimenRowChange(row.id, "type", e.target.value)}
                      placeholder="e.g. Histopathology"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={row.container}
                      onChange={(e) => handleSpecimenRowChange(row.id, "container", e.target.value)}
                      placeholder="e.g. Formalin jar"
                    />
                  </td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={row.sentToLab}
                      onChange={(e) => handleSpecimenRowChange(row.id, "sentToLab", e.target.value)}
                    >
                      {YES_NO_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={row.remarks}
                      onChange={(e) => handleSpecimenRowChange(row.id, "remarks", e.target.value)}
                      placeholder="Optional"
                    />
                  </td>
                  <td className="text-center">
                    <button className="btn btn-outline-danger btnDel" title="Delete" onClick={() => handleRemoveSpecimenRow(row.id)}
                      disabled={specimenRows.length === 1}><i class="icofont-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-end">
          <button
            className="btn btn-primary"
            onClick={() => handleSaveTab("Specimen details")}
            disabled={isSelectedPatientPacPending}
            title={isSelectedPatientPacPending ? "PAC Clearance is pending. Cannot save data." : ""}
          >
            Save Specimen
          </button>
        </div>
      </div>
    );

    const renderComplicationsTab = () => (
      <div>
        <h6 className="fw-bold mb-2">Complications</h6>
        <div className="row">
          <div className="col-md-3 mb-3">
            <label className="form-label fw-bold">Any Complications</label>
            <select
              className="form-select"
              value={complications.anyComplications}
              onChange={(e) => handleComplicationsChange("anyComplications", e.target.value)}
            >
              {YES_NO_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          {complications.anyComplications === "Yes" && (
            <div className="col-md-3 mb-3">
              <label className="form-label fw-bold">Severity</label>
              <select
                className="form-select"
                value={complications.severity}
                onChange={(e) => handleComplicationsChange("severity", e.target.value)}
              >
                <option value="">Select</option>
                <option value="Minor">Minor</option>
                <option value="Major">Major</option>
              </select>
            </div>
          )}


          {complications.anyComplications === "Yes" && (
            <>
              <div className="col-md-3 mb-3">
                <label className="form-label fw-bold">Description</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={complications.description}
                  onChange={(e) => handleComplicationsChange("description", e.target.value)}
                />
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label fw-bold">Action Taken</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={complications.actionTaken}
                  onChange={(e) => handleComplicationsChange("actionTaken", e.target.value)}
                />
              </div>
            </>
          )}

        </div>

        <div className="d-flex justify-content-end">
          <button
            className="btn btn-primary"
            onClick={() => handleSaveTab("Complications")}
            disabled={isSelectedPatientPacPending}
            title={isSelectedPatientPacPending ? "PAC Clearance is pending. Cannot save data." : ""}
          >
            Save Complications
          </button>
        </div>
      </div>
    );

    const renderSignOutTab = () => (
      <div>
        <h6 className="fw-bold mb-2">Sign-Out</h6>
        <div className="row">
          <div className="col-md-3 mb-3">
            <label className="form-label fw-bold">Instrument Count Confirmed</label>
            <select
              className="form-select"
              value={signOut.instrumentCountConfirmed}
              onChange={(e) => handleSignOutChange("instrumentCountConfirmed", e.target.value)}
            >
              {YES_NO_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label fw-bold">Sponge Count Confirmed</label>
            <select
              className="form-select"
              value={signOut.spongeCountConfirmed}
              onChange={(e) => handleSignOutChange("spongeCountConfirmed", e.target.value)}
            >
              {YES_NO_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label fw-bold">Specimen Labeled</label>
            <select
              className="form-select"
              value={signOut.specimenLabeled}
              onChange={(e) => handleSignOutChange("specimenLabeled", e.target.value)}
            >
              {YES_NO_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="col-md-3 mb-3">
            <label className="form-label fw-bold">Equipment Issues</label>
            <select
              className="form-select"
              value={signOut.equipmentIssues}
              onChange={(e) => handleSignOutChange("equipmentIssues", e.target.value)}
            >
              {YES_NO_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          {signOut.equipmentIssues === "Yes" && (
            <div className="col-md-3 mb-3">
              <label className="form-label fw-bold">Equipment Issue Notes</label>
              <input
                type="text"
                className="form-control"
                value={signOut.equipmentIssuesNotes}
                onChange={(e) => handleSignOutChange("equipmentIssuesNotes", e.target.value)}
              />
            </div>
          )}

          <div className="col-md-6 mb-3">
            <label className="form-label fw-bold">Key Concerns for Recovery</label>
            <textarea
              className="form-control"
              rows="2"
              value={signOut.keyConcernsForRecovery}
              onChange={(e) => handleSignOutChange("keyConcernsForRecovery", e.target.value)}
            />
          </div>

          <div className="col-md-3 mb-2">
            <label className="form-label fw-bold small mb-1">Confirmed By</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={getLoggedInUserName() ? `${getLoggedInUserName()} (Auto)` : "Auto"}
              readOnly
              style={{ backgroundColor: "#e9ecef" }}
            />
          </div>
          <div className="col-md-3 mb-2">
            <label className="form-label fw-bold small mb-1">Date / Time</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={`${getCurrentDateTimeLabel()} (Auto)`}
              readOnly
              style={{ backgroundColor: "#e9ecef" }}
            />
          </div>

        </div>



        <div className="d-flex justify-content-end">
          <button
            type="button"
            className="btn btn-success"
            onClick={() => handleSaveTab("Sign-Out")}
            disabled={isSelectedPatientPacPending}
            disabled={Boolean(savingTab) || isSelectedPatientPacPending}
            title={isSelectedPatientPacPending ? "PAC Clearance is pending. Cannot save data." : ""}
          >
            Complete Sign-Out
            {savingTab === "signout" ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Completing Sign-Out...
              </>
            ) : (
              <>
                <i className="fa fa-check-circle me-1"></i> Complete Sign-Out
              </>
            )}
          </button>
        </div>
      </div>
    );

    const renderTabContent = () => {
      if (activeTab === "anaesthesia" && !isSelectedPatientAnesthesiaRequired) {
        return (
          <div className="alert alert-secondary py-3 text-center my-3">
            <i className="fa fa-info-circle me-2"></i>
            Anaesthesia details are not required for this surgery (Anesthesia Required: No).
          </div>
        );
      }
      switch (activeTab) {
        case "anaesthesia": return renderAnaesthesiaTab();
        case "drugs": return renderDrugsTab();
        case "consumables": return renderConsumablesTab();
        case "implants": return renderImplantsTab();
        case "operative": return renderOperativeTab();
        case "specimen": return renderSpecimenTab();
        case "complications": return renderComplicationsTab();
        case "signout": return renderSignOutTab();
        default: return null;
      }
    };

    // ============================================================
    // RENDER: OT SURGERY EXECUTION (detail view)
    // ============================================================
    const renderExecution = () => (
      <div className="card form-card">

        <div className="card-header">
          <div className="d-flex align-items-center gap-1">
            <button className="btn-back" title="Back to OT Surgery Worklist" onClick={backToWorklist}>
              <i className="icofont-arrow-left"></i>
            </button>
            <h4 className="card-title p-2 mb-0">OT Surgery Execution</h4>
          </div>
        </div>


        <div className="card-body">
          {isSelectedPatientPacPending && (
            <div className="alert alert-danger d-flex align-items-center mb-3 py-2 px-3" role="alert">
              <i className="fa fa-exclamation-triangle me-2 fs-5"></i>
              <div>
                <strong>PAC Clearance Pending:</strong> This patient has PAC Required set to Yes and PAC Done set to No. Surgery execution details cannot be saved until PAC clearance is completed.
              </div>
            </div>
          )}

          {/* Patient / Booking Details */}
          <h5 className="fw-bold mb-2">Patient / Booking Details</h5>
          <section className="patient-card mb-4">
            <div className="patient-header">
              <h4>{selectedPatient?.patientName}</h4>
              <p>UHID / IP No.: <strong> {selectedPatient?.uhidOrIp}</strong></p>
            </div>
            <div className="details-grid grid-col-4">
              <div className="detail-item">
                <span className="detail-label">Age / Gender: </span>
                <span className="detail-value">{selectedPatient?.ageGender}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Department:</span>
                <span className="detail-value">{selectedPatient?.department}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Operation Theatre:</span>
                <span className="detail-value">{selectedPatient?.ot}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Surgeon: </span>
                <span className="detail-value">{selectedPatient?.surgeon}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Surgery:</span>
                <span className="detail-value">{selectedPatient?.surgery}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Scheduled: </span>
                <span className="detail-value" style={{ color: "#059669" }}>{selectedPatient?.scheduledTime}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">PAC: </span>
                <span className="detail-value">{getPacBadge(selectedPatient)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Pre-Op Checklist:  </span>
                <span className="detail-value">{getChecklistBadge(selectedPatient)}</span>
              </div>
            </div>
          </section>


          <div className="tab-container">

            {/* Tab Navigation */}
            <ul className="nav nav-tabs">
              {TABS.map((tab) => {
                const isTabDisabled =
                  tab.key === "anaesthesia" && !isSelectedPatientAnesthesiaRequired;

                return (
                  <li className="nav-item" key={tab.key}>
                    <button
                      type="button"
                      className={`nav-link ${activeTab === tab.key ? "active" : ""} ${isTabDisabled ? "disabled text-muted" : ""
                        }`}
                      onClick={() => {
                        if (!isTabDisabled) {
                          setActiveTab(tab.key);
                        }
                      }}
                      disabled={isTabDisabled}
                      title={
                        isTabDisabled
                          ? "Anaesthesia not required for this surgery (anesthesiaRequired: N)"
                          : tab.label
                      }
                      style={
                        isTabDisabled
                          ? { cursor: "not-allowed", opacity: 0.6 }
                          : {}
                      }
                    >
                      {tab.label}
                      {isTabDisabled && (
                        <span
                          className="badge bg-secondary ms-1"
                          style={{ fontSize: "0.65rem" }}
                        >
                          N/A
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            {/* Tab Content */}
            <div className="tab-content-panel" >{renderTabContent()}</div>
          </div>



        </div>
      </div>
    );

    // ============================================================
    // MAIN RENDER
    // ============================================================
    return (
      <div className="content-wrapper">
        {loading && <LoadingScreen />}
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            {view === "worklist" ? renderWorklist() : renderExecution()}
          </div>
        </div>

        {/* Floating Dropdown for Drugs Used table row */}
        {showDrugDropdown && activeDrugDropdownRowId && drugDropdownRect && (
          <ul
            className="list-group position-fixed shadow-lg"
            style={{
              zIndex: 9999,
              maxHeight: "220px",
              overflowY: "auto",
              top: drugDropdownRect.top,
              left: drugDropdownRect.left,
              width: Math.max(drugDropdownRect.width, 320),
              backgroundColor: "#fff",
              border: "1px solid #ced4da",
            }}
            onScroll={handleDrugDropdownScroll}
          >
            {drugDropdownOptions.map((item) => (
              <li
                key={item.itemId || item.pvmsNo}
                className="list-group-item list-group-item-action py-2 px-2"
                style={{ cursor: "pointer", fontSize: "12px", borderBottom: "1px solid #f0f0f0" }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectDrugDropdown(activeDrugDropdownRowId, item);
                }}
              >
                <div className="fw-bold text-primary">{item.nomenclature}</div>
                <div className="d-flex justify-content-between text-muted mt-1" style={{ fontSize: "11px" }}>
                  <span>Code: {item.pvmsNo || "-"} | Class: {item.itemClassName || "-"}</span>
                  <span>
                    Unit: <strong className="text-dark">{item.dispUnitName || item.unitAuName || "-"}</strong> | Stock:{" "}
                    <strong className={(item.storestocks || 0) > 0 ? "text-success" : "text-danger"}>
                      {item.storestocks ?? 0}
                    </strong>
                  </span>
                </div>
              </li>
            ))}
            {loadingDrugDropdown && (
              <li className="list-group-item py-2 text-center text-muted" style={{ fontSize: "12px" }}>
                <span className="spinner-border spinner-border-sm me-1 text-primary"></span>
                Loading more drugs...
              </li>
            )}
            {!loadingDrugDropdown && drugDropdownOptions.length === 0 && (
              <li className="list-group-item py-2 text-center text-muted" style={{ fontSize: "12px" }}>
                No drugs found
              </li>
            )}
          </ul>
        )}

        {/* Floating Dropdown for Drug Template Form */}
        {showTemplateDrugDropdown && templateDrugSearchActiveIdx !== null && templateDrugDropdownRect && (
          <ul
            className="list-group position-fixed shadow-lg"
            style={{
              zIndex: 1060,
              maxHeight: "200px",
              overflowY: "auto",
              top: templateDrugDropdownRect.top,
              left: templateDrugDropdownRect.left,
              width: Math.max(templateDrugDropdownRect.width, 320),
              backgroundColor: "#fff",
              border: "1px solid #ced4da",
            }}
            onScroll={handleDrugDropdownScroll}
          >
            {drugDropdownOptions.map((item) => (
              <li
                key={item.itemId || item.pvmsNo}
                className="list-group-item list-group-item-action py-1 px-2"
                style={{ cursor: "pointer", fontSize: "12px", borderBottom: "1px solid #f0f0f0" }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectTemplateDrug(templateDrugSearchActiveIdx, item);
                }}
              >
                <div className="fw-bold text-primary">{item.nomenclature}</div>
                <div className="d-flex justify-content-between text-muted" style={{ fontSize: "10.5px" }}>
                  <span>Code: {item.pvmsNo || "-"}</span>
                  <span>Unit: {item.dispUnitName || item.unitAuName || "-"} | Stock: {item.storestocks ?? 0}</span>
                </div>
              </li>
            ))}
            {loadingDrugDropdown && (
              <li className="list-group-item py-1 text-center text-muted" style={{ fontSize: "11px" }}>
                Loading more...
              </li>
            )}
            {!loadingDrugDropdown && drugDropdownOptions.length === 0 && (
              <li className="list-group-item py-1 text-center text-muted" style={{ fontSize: "11px" }}>
                No drugs found
              </li>
            )}
          </ul>
        )}

        {/* Floating Dropdown for Medical Consumables table row */}
        {showConsumableDropdown && activeConsumableDropdownRowId && consumableDropdownRect && (
          <ul
            className="list-group position-fixed shadow-lg"
            style={{
              zIndex: 9999,
              maxHeight: "220px",
              overflowY: "auto",
              top: consumableDropdownRect.top,
              left: consumableDropdownRect.left,
              width: Math.max(consumableDropdownRect.width, 320),
              backgroundColor: "#fff",
              border: "1px solid #ced4da",
            }}
            onScroll={handleConsumableDropdownScroll}
          >
            {consumableDropdownOptions.map((item) => (
              <li
                key={item.itemId || item.pvmsNo}
                className="list-group-item list-group-item-action py-2 px-2"
                style={{ cursor: "pointer", fontSize: "12px", borderBottom: "1px solid #f0f0f0" }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectConsumableDropdown(activeConsumableDropdownRowId, item);
                }}
              >
                <div className="fw-bold text-primary">{item.nomenclature}</div>
                <div className="d-flex justify-content-between text-muted mt-1" style={{ fontSize: "11px" }}>
                  <span>Code: {item.pvmsNo || "-"} | Class: {item.itemClassName || "-"}</span>
                  <span>
                    Unit: <strong className="text-dark">{item.unitAuName || item.dispUnitName || item.unitName || "-"}</strong> | Stock:{" "}
                    <strong className={(item.storestocks || 0) > 0 ? "text-success" : "text-danger"}>
                      {item.storestocks ?? 0}
                    </strong>
                  </span>
                </div>
              </li>
            ))}
            {loadingConsumableDropdown && (
              <li className="list-group-item py-2 text-center text-muted" style={{ fontSize: "12px" }}>
                <span className="spinner-border spinner-border-sm me-1 text-primary"></span>
                Loading more items...
              </li>
            )}
            {!loadingConsumableDropdown && consumableDropdownOptions.length === 0 && (
              <li className="list-group-item py-2 text-center text-muted" style={{ fontSize: "12px" }}>
                No consumable items found
              </li>
            )}
          </ul>
        )}

        {/* Floating Dropdown for Consumable Template Form */}
        {showTemplateConsumableDropdown && templateConsumableSearchActiveIdx !== null && templateConsumableDropdownRect && (
          <ul
            className="list-group position-fixed shadow-lg"
            style={{
              zIndex: 1060,
              maxHeight: "200px",
              overflowY: "auto",
              top: templateConsumableDropdownRect.top,
              left: templateConsumableDropdownRect.left,
              width: Math.max(templateConsumableDropdownRect.width, 320),
              backgroundColor: "#fff",
              border: "1px solid #ced4da",
            }}
            onScroll={handleConsumableDropdownScroll}
          >
            {consumableDropdownOptions.map((item) => (
              <li
                key={item.itemId || item.pvmsNo}
                className="list-group-item list-group-item-action py-1 px-2"
                style={{ cursor: "pointer", fontSize: "12px", borderBottom: "1px solid #f0f0f0" }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectTemplateConsumable(templateConsumableSearchActiveIdx, item);
                }}
              >
                <div className="fw-bold text-primary">{item.nomenclature}</div>
                <div className="d-flex justify-content-between text-muted" style={{ fontSize: "10.5px" }}>
                  <span>Code: {item.pvmsNo || "-"}</span>
                  <span>Unit: {item.unitAuName || item.dispUnitName || item.unitName || "-"}</span>
                </div>
              </li>
            ))}
            {loadingConsumableDropdown && (
              <li className="list-group-item py-1 text-center text-muted" style={{ fontSize: "11px" }}>
                Loading more...
              </li>
            )}
            {!loadingConsumableDropdown && consumableDropdownOptions.length === 0 && (
              <li className="list-group-item py-1 text-center text-muted" style={{ fontSize: "11px" }}>
                No consumable items found
              </li>
            )}
          </ul>
        )}

        {/* DRUG TEMPLATE BY SURGERY MODAL */}
        {showDrugTemplateModal && (
          <div
            className="modal d-block"
            tabIndex="-1"
            role="dialog"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }}
          >
            <div className="modal-dialog modal-dialog-centered modal-xl">
              <div className="modal-content shadow">
                <div className="modal-header bg-primary text-white py-2">
                  <h6 className="modal-title fw-bold">
                    <i className="fa fa-folder-open me-2"></i>
                    Drug Templates by Surgery
                  </h6>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowDrugTemplateModal(false)}
                    aria-label="Close"
                  ></button>
                </div>

                <div className="modal-body">
                  {drugTemplateView === "list" ? (
                    <div>
                      {/* Header info bar with assigned surgery of current patient */}
                      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2 p-2 bg-light border rounded">
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-bold small text-dark">
                            Patient Assigned Surgery:
                          </span>
                          <select
                            className="form-select form-select-sm"
                            style={{ minWidth: "220px" }}
                            value={drugTemplateFilterSurgeryId}
                            onChange={(e) => {
                              const sId = Number(e.target.value);
                              setDrugTemplateFilterSurgeryId(sId);
                              fetchActiveDrugTemplates(sId);
                            }}
                          >
                            {getPatientSurgeryList().map((s) => (
                              <option key={s.surgeryId} value={s.surgeryId}>
                                {s.surgeryName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={handleNewDrugTemplate}
                        >
                          <i className="fa fa-plus me-1"></i> Create New Template
                        </button>
                      </div>

                      {/* Template Headers Table (Click row to expand details) */}
                      <div className="table-responsive border rounded">
                        <table className="table table-hover table-bordered table-sm align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th style={{ width: "35px" }} className="text-center"></th>
                              <th style={{ width: "45px" }} className="text-center">#</th>
                              <th>Template Name</th>
                              <th style={{ minWidth: "180px" }}>Assigned Surgery</th>
                              <th style={{ width: "110px" }} className="text-center">Meds Count</th>
                              <th style={{ width: "210px" }} className="text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loadingDrugTemplates ? (
                              <tr>
                                <td colSpan="6" className="text-center py-4 text-muted">
                                  <span className="spinner-border spinner-border-sm me-2 text-primary"></span>
                                  Loading active drug templates...
                                </td>
                              </tr>
                            ) : (
                              drugTemplates.map((template, idx) => {
                                const isExpanded = expandedDrugTemplateId === (template.id || template.templateId);
                                return (
                                  <React.Fragment key={template.id || template.templateId || idx}>
                                    <tr
                                      style={{
                                        cursor: "pointer",
                                        backgroundColor: isExpanded ? "#f0f7ff" : "inherit",
                                      }}
                                      onClick={() =>
                                        setExpandedDrugTemplateId((prev) =>
                                          prev === (template.id || template.templateId)
                                            ? null
                                            : (template.id || template.templateId)
                                        )
                                      }
                                      title="Click row to view/hide medicine details"
                                    >
                                      <td className="text-center text-muted">
                                        <i
                                          className={`fa fa-chevron-${isExpanded ? "down text-primary" : "right"
                                            }`}
                                        ></i>
                                      </td>
                                      <td className="text-center text-muted">{idx + 1}</td>
                                      <td>
                                        <span className="fw-semibold text-primary">
                                          {template.templateName}
                                        </span>
                                        {template.description && (
                                          <div
                                            className="text-muted"
                                            style={{ fontSize: "11px" }}
                                          >
                                            {template.description}
                                          </div>
                                        )}
                                      </td>
                                      <td>
                                        <span className="badge bg-light text-dark border">
                                          {template.surgeryName || "Assigned Surgery"}
                                        </span>
                                      </td>
                                      <td className="text-center">
                                        <span className="badge bg-info text-dark">
                                          {template.items?.length || 0} Meds
                                        </span>
                                      </td>
                                      <td
                                        className="text-center"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div className="btn-group btn-group-sm">
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-success px-2"
                                            title="Apply template to surgery drugs (appends medicines)"
                                            onClick={() => handleApplyDrugTemplate(template)}
                                          >
                                            <i className="fa fa-plus me-1"></i> Apply
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            title="Edit template"
                                            onClick={() => handleEditDrugTemplate(template)}
                                          >
                                            <i className="fa fa-pencil"></i>
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            title="Delete template"
                                            onClick={() => handleDeleteDrugTemplate(template.id || template.templateId)}
                                          >
                                            <i className="fa fa-trash"></i>
                                          </button>
                                        </div>
                                      </td>
                                    </tr>

                                    {/* Expanded Detail View */}
                                    {isExpanded && (
                                      <tr>
                                        <td colSpan="6" className="bg-light p-3">
                                          <div className="card shadow-sm border">
                                            <div className="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                                              <div>
                                                <strong className="text-dark me-2">
                                                  {template.templateName}
                                                </strong>
                                                <span className="badge bg-primary me-2">
                                                  Surgery: {template.surgeryName}
                                                </span>
                                                {template.description && (
                                                  <small className="text-muted fst-italic">
                                                    ({template.description})
                                                  </small>
                                                )}
                                              </div>
                                              <button
                                                type="button"
                                                className="btn btn-sm btn-success px-3"
                                                onClick={() => handleApplyDrugTemplate(template)}
                                              >
                                                <i className="fa fa-plus me-1"></i> Apply This Template
                                              </button>
                                            </div>
                                            <div className="card-body p-0">
                                              <table className="table table-sm table-striped mb-0 align-middle">
                                                <thead className="table-light">
                                                  <tr>
                                                    <th style={{ width: "50px" }} className="text-center">#</th>
                                                    <th>Medicine / Drug Name</th>
                                                    <th style={{ width: "100px" }}>Qty</th>
                                                    <th style={{ width: "120px" }}>Unit</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {template.items?.map((it, itemIdx) => (
                                                    <tr key={itemIdx}>
                                                      <td className="text-center text-muted">
                                                        {itemIdx + 1}
                                                      </td>
                                                      <td className="fw-semibold text-dark">
                                                        {it.drugName || it.itemName}
                                                      </td>
                                                      <td>{it.qty || it.plannedQuantity}</td>
                                                      <td>
                                                        <span className="badge bg-light text-dark border">
                                                          {it.unit || it.unitName || "No"}
                                                        </span>
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })
                            )}
                            {!loadingDrugTemplates && drugTemplates.length === 0 && (
                              <tr>
                                <td colSpan="6" className="text-center py-4 text-muted">
                                  No drug templates found for this surgery. Click "Create New Template" to add one.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold mb-0">
                          {drugTemplateForm.id ? "Edit Drug Template" : "Create New Drug Template"}
                        </h6>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => setDrugTemplateView("list")}
                        >
                          <i className="fa fa-arrow-left me-1"></i> Back to Templates
                        </button>
                      </div>

                      <div className="row g-2 mb-3">
                        <div className="col-md-6">
                          <label className="form-label small fw-semibold">Template Name *</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="e.g. Heart Transplant Intra-Op Kit"
                            value={drugTemplateForm.templateName}
                            onChange={(e) =>
                              setDrugTemplateForm({ ...drugTemplateForm, templateName: e.target.value })
                            }
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-semibold">
                            Assigned Patient Surgery *
                          </label>
                          <select
                            className="form-select form-select-sm"
                            value={drugTemplateForm.surgeryId}
                            onChange={(e) => {
                              const sId = Number(e.target.value);
                              const sObj = getPatientSurgeryList().find((s) => Number(s.surgeryId) === sId);
                              setDrugTemplateForm({
                                ...drugTemplateForm,
                                surgeryId: sId,
                                surgeryName: sObj?.surgeryName || drugTemplateForm.surgeryName,
                              });
                            }}
                          >
                            {getPatientSurgeryList().map((s) => (
                              <option key={s.surgeryId} value={s.surgeryId}>
                                {s.surgeryName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-12">
                          <label className="form-label small">Description / Notes</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Optional notes about when to use this template..."
                            value={drugTemplateForm.description}
                            onChange={(e) =>
                              setDrugTemplateForm({ ...drugTemplateForm, description: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-bold small">Template Medicines</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success"
                          onClick={handleAddTemplateDrugRow}
                        >
                          <i className="fa fa-plus me-1"></i> Add Medicine Row
                        </button>
                      </div>

                      <div className="table-responsive border rounded mb-3">
                        <table className="table table-bordered table-sm mb-0 align-middle">
                          <thead className="table-light">
                            <tr>
                              <th style={{ minWidth: "260px" }}>Drug Name *</th>
                              <th style={{ width: "90px" }}>Qty *</th>
                              <th style={{ width: "130px" }}>Unit</th>
                              <th style={{ width: "50px" }} className="text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {drugTemplateForm.items.map((it, idx) => (
                              <tr key={idx}>
                                <td>
                                  <input
                                    type="text"
                                    ref={(el) => (templateDrugInputRefs.current[idx] = el)}
                                    className="form-control form-control-sm"
                                    value={it.drugName}
                                    placeholder="Type drug name to search..."
                                    autoComplete="off"
                                    onChange={(e) => handleTemplateDrugInputChange(idx, e.target.value)}
                                    onFocus={() => {
                                      setTemplateDrugSearchActiveIdx(idx);
                                      const el = templateDrugInputRefs.current[idx];
                                      if (el) {
                                        const rect = el.getBoundingClientRect();
                                        setTemplateDrugDropdownRect({
                                          top: rect.bottom,
                                          left: rect.left,
                                          width: rect.width,
                                        });
                                      }
                                      if (it.drugName && it.drugName.trim() && drugDropdownOptions.length > 0) {
                                        setShowTemplateDrugDropdown(true);
                                      }
                                    }}
                                    onBlur={() => {
                                      setTimeout(() => {
                                        if (templateDrugSearchActiveIdx === idx) {
                                          setShowTemplateDrugDropdown(false);
                                        }
                                      }, 250);
                                    }}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={it.qty}
                                    onChange={(e) => handleTemplateDrugRowChange(idx, "qty", e.target.value)}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm bg-light"
                                    value={it.unit || "No"}
                                    readOnly
                                    style={{ backgroundColor: "#e9ecef" }}
                                    title="Unit is set automatically from selected medicine"
                                  />
                                </td>
                                <td className="text-center">
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => handleRemoveTemplateDrugRow(idx)}
                                    disabled={drugTemplateForm.items.length === 1}
                                  >
                                    <i className="icofont-trash"></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="d-flex justify-content-end gap-2">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setDrugTemplateView("list")}
                          disabled={savingDrugTemplate}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={handleSaveDrugTemplate}
                          disabled={savingDrugTemplate}
                        >
                          <i className="fa fa-save me-1"></i> {drugTemplateForm.id ? "Update Template" : "Save Template"}
                          {savingDrugTemplate ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              {drugTemplateForm.id || drugTemplateForm.templateId
                                ? "Updating Template..."
                                : "Saving Template..."}
                            </>
                          ) : (
                            <>
                              <i className="fa fa-save me-1"></i>{" "}
                              {drugTemplateForm.id || drugTemplateForm.templateId
                                ? "Update Template"
                                : "Save Template"}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONSUMABLE TEMPLATE BY SURGERY MODAL */}
        {showConsumableTemplateModal && (
          <div
            className="modal d-block"
            tabIndex="-1"
            role="dialog"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }}
          >
            <div className="modal-dialog modal-dialog-centered modal-xl">
              <div className="modal-content shadow">
                <div className="modal-header bg-primary text-white py-2">
                  <h6 className="modal-title fw-bold">
                    <i className="fa fa-folder-open me-2"></i>
                    Consumable Templates by Surgery
                  </h6>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowConsumableTemplateModal(false)}
                    aria-label="Close"
                  ></button>
                </div>

                <div className="modal-body">
                  {consumableTemplateView === "list" ? (
                    <div>
                      {/* Header info bar with assigned surgery of current patient */}
                      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2 p-2 bg-light border rounded">
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-bold small text-dark">
                            Patient Assigned Surgery:
                          </span>
                          <select
                            className="form-select form-select-sm"
                            style={{ minWidth: "220px" }}
                            value={consumableTemplateFilterSurgeryId}
                            onChange={(e) => {
                              const sId = Number(e.target.value);
                              setConsumableTemplateFilterSurgeryId(sId);
                              fetchActiveConsumableTemplates(sId);
                            }}
                          >
                            {getPatientSurgeryList().map((s) => (
                              <option key={s.surgeryId} value={s.surgeryId}>
                                {s.surgeryName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={handleNewConsumableTemplate}
                        >
                          <i className="fa fa-plus me-1"></i> Create New Template
                        </button>
                      </div>

                      {/* Template Headers Table (Click row to expand details) */}
                      <div className="table-responsive border rounded">
                        <table className="table table-hover table-bordered table-sm align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th style={{ width: "35px" }} className="text-center"></th>
                              <th style={{ width: "45px" }} className="text-center">#</th>
                              <th>Template Name</th>
                              <th style={{ minWidth: "180px" }}>Assigned Surgery</th>
                              <th style={{ width: "110px" }} className="text-center">Items Count</th>
                              <th style={{ width: "210px" }} className="text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loadingConsumableTemplates ? (
                              <tr>
                                <td colSpan="6" className="text-center py-4 text-muted">
                                  <span className="spinner-border spinner-border-sm me-2 text-primary"></span>
                                  Loading active consumable templates...
                                </td>
                              </tr>
                            ) : (
                              consumableTemplates.map((template, idx) => {
                                const isExpanded = expandedConsumableTemplateId === (template.id || template.templateId);
                                return (
                                  <React.Fragment key={template.id || template.templateId || idx}>
                                    <tr
                                      style={{
                                        cursor: "pointer",
                                        backgroundColor: isExpanded ? "#f0f7ff" : "inherit",
                                      }}
                                      onClick={() =>
                                        setExpandedConsumableTemplateId((prev) =>
                                          prev === (template.id || template.templateId)
                                            ? null
                                            : (template.id || template.templateId)
                                        )
                                      }
                                      title="Click row to view/hide consumable details"
                                    >
                                      <td className="text-center text-muted">
                                        <i
                                          className={`fa fa-chevron-${isExpanded ? "down text-primary" : "right"
                                            }`}
                                        ></i>
                                      </td>
                                      <td className="text-center text-muted">{idx + 1}</td>
                                      <td>
                                        <span className="fw-semibold text-primary">
                                          {template.templateName}
                                        </span>
                                        {template.description && (
                                          <div
                                            className="text-muted"
                                            style={{ fontSize: "11px" }}
                                          >
                                            {template.description}
                                          </div>
                                        )}
                                      </td>
                                      <td>
                                        <span className="badge bg-light text-dark border">
                                          {template.surgeryName || "Assigned Surgery"}
                                        </span>
                                      </td>
                                      <td className="text-center">
                                        <span className="badge bg-info text-dark">
                                          {template.items?.length || 0} Items
                                        </span>
                                      </td>
                                      <td
                                        className="text-center"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div className="btn-group btn-group-sm">
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-success px-2"
                                            title="Apply template to surgery consumables (appends items)"
                                            onClick={() => handleApplyConsumableTemplate(template)}
                                          >
                                            <i className="fa fa-plus me-1"></i> Apply
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            title="Edit template"
                                            onClick={() => handleEditConsumableTemplate(template)}
                                          >
                                            <i className="fa fa-pencil"></i>
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            title="Delete template"
                                            onClick={() => handleDeleteConsumableTemplate(template.id || template.templateId)}
                                          >
                                            <i className="fa fa-trash"></i>
                                          </button>
                                        </div>
                                      </td>
                                    </tr>

                                    {/* Expanded Detail View */}
                                    {isExpanded && (
                                      <tr>
                                        <td colSpan="6" className="bg-light p-3">
                                          <div className="card shadow-sm border">
                                            <div className="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                                              <div>
                                                <strong className="text-dark me-2">
                                                  {template.templateName}
                                                </strong>
                                                <span className="badge bg-primary me-2">
                                                  Surgery: {template.surgeryName}
                                                </span>
                                                {template.description && (
                                                  <small className="text-muted fst-italic">
                                                    ({template.description})
                                                  </small>
                                                )}
                                              </div>
                                              <button
                                                type="button"
                                                className="btn btn-sm btn-success px-3"
                                                onClick={() => handleApplyConsumableTemplate(template)}
                                              >
                                                <i className="fa fa-plus me-1"></i> Apply This Template
                                              </button>
                                            </div>
                                            <div className="card-body p-0">
                                              <table className="table table-sm table-striped mb-0 align-middle">
                                                <thead className="table-light">
                                                  <tr>
                                                    <th style={{ width: "50px" }} className="text-center">#</th>
                                                    <th>Consumable Item Name</th>
                                                    <th style={{ width: "100px" }}>Planned</th>
                                                    <th style={{ width: "120px" }}>Unit</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {template.items?.map((it, itemIdx) => (
                                                    <tr key={itemIdx}>
                                                      <td className="text-center text-muted">
                                                        {itemIdx + 1}
                                                      </td>
                                                      <td className="fw-semibold text-dark">
                                                        {it.item || it.itemName}
                                                      </td>
                                                      <td>{it.planned || it.plannedQuantity}</td>
                                                      <td>
                                                        <span className="badge bg-light text-dark border">
                                                          {it.unit || it.unitName || "Nos"}
                                                        </span>
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })
                            )}
                            {!loadingConsumableTemplates && consumableTemplates.length === 0 && (
                              <tr>
                                <td colSpan="6" className="text-center py-4 text-muted">
                                  No consumable templates found for this surgery. Click "Create New Template" to add one.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold mb-0">
                          {consumableTemplateForm.id ? "Edit Consumable Template" : "Create New Consumable Template"}
                        </h6>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => setConsumableTemplateView("list")}
                        >
                          <i className="fa fa-arrow-left me-1"></i> Back to Templates
                        </button>
                      </div>

                      <div className="row g-2 mb-3">
                        <div className="col-md-6">
                          <label className="form-label small fw-semibold">Template Name *</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="e.g. Heart Transplant Consumables"
                            value={consumableTemplateForm.templateName}
                            onChange={(e) =>
                              setConsumableTemplateForm({ ...consumableTemplateForm, templateName: e.target.value })
                            }
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-semibold">
                            Assigned Patient Surgery *
                          </label>
                          <select
                            className="form-select form-select-sm"
                            value={consumableTemplateForm.surgeryId}
                            onChange={(e) => {
                              const sId = Number(e.target.value);
                              const sObj = getPatientSurgeryList().find((s) => Number(s.surgeryId) === sId);
                              setConsumableTemplateForm({
                                ...consumableTemplateForm,
                                surgeryId: sId,
                                surgeryName: sObj?.surgeryName || consumableTemplateForm.surgeryName,
                              });
                            }}
                          >
                            {getPatientSurgeryList().map((s) => (
                              <option key={s.surgeryId} value={s.surgeryId}>
                                {s.surgeryName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-12">
                          <label className="form-label small">Description / Notes</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Optional notes about when to use this template..."
                            value={consumableTemplateForm.description}
                            onChange={(e) =>
                              setConsumableTemplateForm({ ...consumableTemplateForm, description: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-bold small">Template Consumable Items</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success"
                          onClick={handleAddTemplateConsumableRow}
                        >
                          <i className="fa fa-plus me-1"></i> Add Consumable Item
                        </button>
                      </div>

                      <div className="table-responsive border rounded mb-3">
                        <table className="table table-bordered table-sm mb-0 align-middle">
                          <thead className="table-light">
                            <tr>
                              <th style={{ minWidth: "260px" }}>Item Name *</th>
                              <th style={{ width: "90px" }}>Planned Qty *</th>
                              <th style={{ width: "130px" }}>Unit</th>
                              <th style={{ width: "50px" }} className="text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {consumableTemplateForm.items.map((it, idx) => (
                              <tr key={idx}>
                                <td>
                                  <input
                                    type="text"
                                    ref={(el) => (templateConsumableInputRefs.current[idx] = el)}
                                    className="form-control form-control-sm"
                                    value={it.item}
                                    placeholder="Type consumable item to search..."
                                    autoComplete="off"
                                    onChange={(e) =>
                                      handleTemplateConsumableInputChange(idx, e.target.value)
                                    }
                                    onFocus={() => {
                                      setTemplateConsumableSearchActiveIdx(idx);
                                      const el = templateConsumableInputRefs.current[idx];
                                      if (el) {
                                        const rect = el.getBoundingClientRect();
                                        setTemplateConsumableDropdownRect({
                                          top: rect.bottom,
                                          left: rect.left,
                                          width: rect.width,
                                        });
                                      }
                                      if (it.item && it.item.trim() && consumableDropdownOptions.length > 0) {
                                        setShowTemplateConsumableDropdown(true);
                                      }
                                    }}
                                    onBlur={() => {
                                      setTimeout(() => {
                                        if (templateConsumableSearchActiveIdx === idx) {
                                          setShowTemplateConsumableDropdown(false);
                                        }
                                      }, 250);
                                    }}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={it.planned}
                                    onChange={(e) =>
                                      handleTemplateConsumableRowChange(idx, "planned", e.target.value)
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm bg-light"
                                    value={it.unit || "Nos"}
                                    readOnly
                                    style={{ backgroundColor: "#e9ecef" }}
                                    title="Unit is set automatically from selected consumable item"
                                  />
                                </td>
                                <td className="text-center">
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => handleRemoveTemplateConsumableRow(idx)}
                                    disabled={consumableTemplateForm.items.length === 1}
                                  >
                                    <i className="icofont-trash"></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="d-flex justify-content-end gap-2">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setConsumableTemplateView("list")}
                          disabled={savingConsumableTemplate}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={handleSaveConsumableTemplate}
                          disabled={savingConsumableTemplate}
                        >
                          <i className="fa fa-save me-1"></i> {consumableTemplateForm.id ? "Update Template" : "Save Template"}
                          {savingConsumableTemplate ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              {consumableTemplateForm.id || consumableTemplateForm.templateId
                                ? "Updating Template..."
                                : "Saving Template..."}
                            </>
                          ) : (
                            <>
                              <i className="fa fa-save me-1"></i>{" "}
                              {consumableTemplateForm.id || consumableTemplateForm.templateId
                                ? "Update Template"
                                : "Save Template"}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {popupMessage && (
          <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
        )}
      </div>
    );
  };

  export default OTSurgeryExecution;