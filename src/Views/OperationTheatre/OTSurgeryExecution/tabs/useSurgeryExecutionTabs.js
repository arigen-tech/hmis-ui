import { useEffect, useRef, useState } from "react";
import { getActiveStorage, getRequest, postRequest } from "../../../../service/apiService";
import {
  GET_ALL_DRUGS_BY_SECTION,
  GET_ITEM_BATCHES,
  GET_MEDICAL_CONSUMABLE_ITEMS,
  MAS_ANAESTHESIA_TYPE,
  MAS_ASA_GRADE,
  OT_TEAM_MEMBER,
  PAC_ASSESSMENT_BY_BOOKING,
  SURGERY_ANAESTHESIA,
  SURGERY_DRUG_CONSUMABLE_TEMPLATE,
} from "../../../../config/apiConfig";

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

const useSurgeryExecutionTabs = ({
  activeTab,
  appliedFilters,
  checkAnesthesiaRequired,
  currentPage,
  fetchPatientSurgeryWorklist,
  getLoggedInUserName,
  selectedPatient,
  setActiveTab,
  setSelectedPatient,
  setView,
  showPopup,
}) => {
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

  useEffect(() => {
    fetchAnaesthesiaTypes();
    fetchAsaGrades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return {
    activeConsumableDropdownRowId,
    activeDrugDropdownRowId,
    anaesthesia,
    anaesthesiaErrors,
    anaesthesiaTypes,
    asaGrades,
    backToWorklist,
    complications,
    consumableDropdownOptions,
    consumableDropdownRect,
    consumableInputRefs,
    consumableRows,
    consumableTemplateFilterSurgeryId,
    consumableTemplateForm,
    consumableTemplateView,
    consumableTemplates,
    drugDropdownOptions,
    drugDropdownRect,
    drugErrors,
    drugInputRefs,
    drugRows,
    drugTemplateFilterSurgeryId,
    drugTemplateForm,
    drugTemplateView,
    drugTemplates,
    expandedConsumableTemplateId,
    expandedDrugTemplateId,
    fetchActiveConsumableTemplates,
    fetchActiveDrugTemplates,
    fetchAnaesthesiaTypes,
    fetchAsaGrades,
    getPatientSurgeryList,
    handleAddConsumableRow,
    handleAddDrugRow,
    handleAddImplantRow,
    handleAddSpecimenRow,
    handleAddTemplateConsumableRow,
    handleAddTemplateDrugRow,
    handleAnaesthesiaBlur,
    handleAnaesthesiaChange,
    handleApplyConsumableTemplate,
    handleApplyDrugTemplate,
    handleComplicationsChange,
    handleConsumableDropdownScroll,
    handleConsumableInputChange,
    handleConsumableInputFocus,
    handleConsumableRowChange,
    handleDeleteConsumableTemplate,
    handleDeleteDrugTemplate,
    handleDrugDropdownScroll,
    handleDrugInputChange,
    handleDrugInputFocus,
    handleDrugRowChange,
    handleEditConsumableTemplate,
    handleEditDrugTemplate,
    handleImplantRowChange,
    handleNewConsumableTemplate,
    handleNewDrugTemplate,
    handleOperativeBlur,
    handleOperativeChange,
    handleRemoveConsumableRow,
    handleRemoveDrugRow,
    handleRemoveImplantRow,
    handleRemoveSpecimenRow,
    handleRemoveTemplateConsumableRow,
    handleRemoveTemplateDrugRow,
    handleSaveAnaesthesia,
    handleSaveConsumableTemplate,
    handleSaveDrugTemplate,
    handleSaveTab,
    handleSelectConsumableDropdown,
    handleSelectDrugDropdown,
    handleSelectTemplateConsumable,
    handleSelectTemplateDrug,
    handleSignOutChange,
    handleSpecimenRowChange,
    handleTemplateConsumableInputChange,
    handleTemplateConsumableRowChange,
    handleTemplateDrugInputChange,
    handleTemplateDrugRowChange,
    implantRows,
    isSelectedPatientAnesthesiaRequired,
    isSelectedPatientPacPending,
    loadingAnaesthesiaTypes,
    loadingAsaGrades,
    loadingConsumableDropdown,
    loadingConsumableTemplates,
    loadingDrugDropdown,
    loadingDrugTemplates,
    openConsumableTemplateModal,
    openDrugTemplateModal,
    openExecution,
    operativeDetails,
    operativeErrors,
    savingAnaesthesia,
    savingConsumableTemplate,
    savingDrugTemplate,
    savingTab,
    setAnaesthesia,
    setAnaesthesiaErrors,
    setConsumableRows,
    setConsumableTemplateFilterSurgeryId,
    setConsumableTemplateForm,
    setConsumableTemplateView,
    setDrugErrors,
    setDrugRows,
    setDrugTemplateFilterSurgeryId,
    setDrugTemplateForm,
    setDrugTemplateView,
    setExpandedConsumableTemplateId,
    setExpandedDrugTemplateId,
    setShowConsumableDropdown,
    setShowConsumableTemplateModal,
    setShowDrugDropdown,
    setShowDrugTemplateModal,
    setShowTemplateConsumableDropdown,
    setShowTemplateDrugDropdown,
    setTemplateConsumableDropdownRect,
    setTemplateConsumableSearchActiveIdx,
    setTemplateDrugDropdownRect,
    setTemplateDrugSearchActiveIdx,
    showConsumableDropdown,
    showConsumableTemplateModal,
    showDrugDropdown,
    showDrugTemplateModal,
    showTemplateConsumableDropdown,
    showTemplateDrugDropdown,
    signOut,
    specimenRows,
    templateConsumableDropdownRect,
    templateConsumableInputRefs,
    templateConsumableSearchActiveIdx,
    templateDrugDropdownRect,
    templateDrugInputRefs,
    templateDrugSearchActiveIdx,
  };
};

export default useSurgeryExecutionTabs;
