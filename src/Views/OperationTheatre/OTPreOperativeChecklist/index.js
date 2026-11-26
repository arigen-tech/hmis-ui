import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, postRequest } from "../../../service/apiService";
import {
  PATIENT_RECEIVED_IN_OT_LIST,
  MAS_OT_CHECKLIST,
  SUBMIT_OT_CHECKLIST,
  GET_OT_CHECKLIST,
} from "../../../config/apiConfig";
import { formatDateForDisplay, formatDateTimeForDisplay } from "../../../utils/dateUtils";

// Helper to get current logged-in user name from sessionStorage or localStorage
const getLoggedInUserName = () => {
  return (
    sessionStorage.getItem("loggedInUserName") ||
    localStorage.getItem("loggedInUserName") ||
    sessionStorage.getItem("userName") ||
    localStorage.getItem("userName") ||
    sessionStorage.getItem("username") ||
    localStorage.getItem("username") ||
    "-"
  );
};

// Allowed verification_status values (NULL is also allowed while in draft)
const VALID_VERIFICATION_STATUSES = ["YES", "NO", "NA"];

// Normalize a checklist item from either master or saved checklist response
const normalizeChecklistItem = (item) => ({
  id: item.checklistId,
  checklistId: item.checklistId,
  checklistCode: item.checklistCode || "",
  checklistStage: item.checklistStage || "PRE_OP",
  label: item.checklistName || "-",
  isMandatory: String(item.isMandatory || "N").toUpperCase(),
  allowNa: String(item.allowNa || "N").toUpperCase(),
  required: String(item.isMandatory || "").toUpperCase() === "Y",
  hasNA: String(item.allowNa || "").toUpperCase() === "Y",
  displayOrder:
    item.displayOrder !== null && item.displayOrder !== undefined
      ? Number(item.displayOrder)
      : Number.MAX_SAFE_INTEGER,
});

// Sort checklist items ascending by displayOrder
const sortChecklistItems = (items) =>
  [...items].sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) {
      return a.displayOrder - b.displayOrder;
    }
    return (a.checklistId ?? 0) - (b.checklistId ?? 0);
  });

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

const OTPreOperativeChecklist = () => {
  // ----- State -----
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [checklistStatusFilter, setChecklistStatusFilter] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ search: "", status: "" });

  // Checklist modal states
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [checklistItems, setChecklistItems] = useState([]);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [checklistAnswers, setChecklistAnswers] = useState({});
  const [itemRemarks, setItemRemarks] = useState({});
  const [initialSavedItems, setInitialSavedItems] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [remarks, setRemarks] = useState("");
  const [checklistMeta, setChecklistMeta] = useState(null);
  const [isChecklistReadOnly, setIsChecklistReadOnly] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [savingMode, setSavingMode] = useState(null);

  const [fillChecklist, setFillChecklist] = useState(false);

  // ----- Fetch Patient Received in OT List -----
  const fetchPatientList = async (
    page = 0,
    search = appliedFilters.search,
    status = appliedFilters.status
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page,
        size: DEFAULT_ITEMS_PER_PAGE,
      });

      if (search && search.trim()) {
        params.append("search", search.trim());
      }

      if (status && (status.trim() === "N" || status.trim() === "D")) {
        params.append("checklistStatus", status.trim());
      }

      const res = await getRequest(`${PATIENT_RECEIVED_IN_OT_LIST}?${params.toString()}`);

      if (res?.response) {
        const content = Array.isArray(res.response.content)
          ? res.response.content
          : Array.isArray(res.response)
            ? res.response
            : [];

        // Only show Pending (N) and Draft (D) checklists; exclude Completed (Y)
        const pendingOrDraftContent = content.filter(
          (item) => String(item.isChecklistDone || "").toUpperCase() !== "Y"
        );

        const normalized = pendingOrDraftContent.map((item, idx) => {
          let surgeryString = "-";
          let plannedSurgeries = [];
          if (Array.isArray(item.surgeries) && item.surgeries.length > 0) {
            surgeryString =
              item.surgeries.map((s) => s.surgeryName).filter(Boolean).join(", ") || "-";
            plannedSurgeries = item.surgeries.map((s) => s.surgeryName).filter(Boolean);
          } else if (typeof item.surgeries === "string" && item.surgeries.trim()) {
            surgeryString = item.surgeries.trim();
            plannedSurgeries = [item.surgeries.trim()];
          } else if (item.surgeryName || item.surgery) {
            surgeryString = item.surgeryName || item.surgery;
            plannedSurgeries = [surgeryString];
          }

          const uhidOrIp = item.uhidNo || item.ipNo || "-";
          const scheduledTime = formatScheduledDateTime(item);
          const receivedTime = formatDateTimeForDisplay(item.receivedTime, "-");
          const rawChecklistFlag = String(item.isChecklistDone || "").toUpperCase();
          const checklistStatus =
            rawChecklistFlag === "Y"
              ? "Completed"
              : rawChecklistFlag === "D"
                ? "Draft"
                : "Pending";
          const ageGender = [item.age, item.gender].filter(Boolean).join(" / ") || "-";
          const wardBed = [item.wardName, item.bedNumber].filter(Boolean).join(" / ") || "-";

          return {
            ...item,
            id: item.otBookingId ?? item.id ?? page * DEFAULT_ITEMS_PER_PAGE + idx + 1,
            uhidOrIp,
            patientName: item.patientName || "-",
            department: item.departmentName || item.department || "-",
            surgery: surgeryString,
            plannedSurgeries,
            surgeon: item.surgeonName || item.primarySurgeonName || item.surgeon || "-",
            ot: item.otName || item.ot || "-",
            scheduledTime,
            receivedTime,
            checklistStatus,
            ageGender,
            wardBed,
          };
        });

        setData(normalized);
        const excludedCount = content.length - pendingOrDraftContent.length;
        const adjustedTotalItems =
          excludedCount > 0
            ? Math.max(0, (res.response.totalElements ?? content.length) - excludedCount)
            : (res.response.totalElements ?? normalized.length);
        setTotalItems(adjustedTotalItems);
        setTotalPages(
          adjustedTotalItems > 0
            ? (res.response.totalPages ?? Math.ceil(adjustedTotalItems / DEFAULT_ITEMS_PER_PAGE))
            : 0
        );
        setCurrentPage((res.response.pageable?.pageNumber ?? page) + 1);
      } else {
        setData([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error("Error fetching patient received in OT list:", error);
      showPopup(error?.message || "Failed to fetch patient list.", "error");
      setData([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // ----- Effects -----
  useEffect(() => {
    fetchPatientList(0, "", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- Handlers -----
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchPatientList(page - 1, appliedFilters.search, appliedFilters.status);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    const newFilters = { search: searchQuery, status: checklistStatusFilter };
    setAppliedFilters(newFilters);
    fetchPatientList(0, searchQuery, checklistStatusFilter);
  };

  const handleReset = () => {
    setSearchQuery("");
    setChecklistStatusFilter("");
    setAppliedFilters({ search: "", status: "" });
    setCurrentPage(1);
    fetchPatientList(0, "", "");
  };

  // ----- Apply Master + Saved Checklist State -----
  const applyChecklistData = (masterItems, preOpSaved, masterFetchFailed = false) => {
    if (preOpSaved) {
      const rawStatus = String(preOpSaved.checklistStatus || "").toUpperCase();
      const storedStatus =
        rawStatus === "D"
          ? "DRAFT"
          : rawStatus === "Y"
            ? "COMPLETED"
            : rawStatus || "DRAFT";
      const isDraft = storedStatus === "DRAFT";
      const readOnly = !isDraft;

      setIsChecklistReadOnly(readOnly);
      setChecklistMeta({
        otChecklistId: preOpSaved.otChecklistId ?? null,
        checklistStatus: storedStatus,
        verifiedBy: preOpSaved.verifiedBy || null,
        verifiedDatetime: preOpSaved.verifiedDatetime || null,
        lastChgBy: preOpSaved.lastChgBy || null,
        lastChgDate: preOpSaved.lastChgDate || null,
      });
      setRemarks(preOpSaved.remarks || "");

      const savedItemsRaw = Array.isArray(preOpSaved.items) ? preOpSaved.items : [];
      const savedItemMap = {};
      savedItemsRaw.forEach((si) => {
        if (si?.checklistId !== undefined && si?.checklistId !== null) {
          savedItemMap[si.checklistId] = si;
        }
      });

      let finalItems = [];
      if (readOnly || masterItems.length === 0) {
        finalItems = sortChecklistItems(savedItemsRaw.map(normalizeChecklistItem));
      } else {
        const mergedMap = new Map();
        masterItems.forEach((mi) => mergedMap.set(mi.checklistId, mi));
        savedItemsRaw.forEach((si) => {
          if (!mergedMap.has(si.checklistId)) {
            mergedMap.set(si.checklistId, normalizeChecklistItem(si));
          }
        });
        finalItems = sortChecklistItems(Array.from(mergedMap.values()));
      }

      const initialAnswers = {};
      const initialRemarks = {};
      const savedSnapshot = {};
      finalItems.forEach((item) => {
        const savedItem = savedItemMap[item.checklistId];
        const rawItemStatus = savedItem?.verificationStatus;
        const normalizedStatus = rawItemStatus ? String(rawItemStatus).trim().toUpperCase() : null;
        const savedRemark = savedItem?.remarks ?? "";
        initialAnswers[item.id] = normalizedStatus;
        initialRemarks[item.id] = savedRemark;
        savedSnapshot[item.id] = {
          verificationStatus: normalizedStatus,
          remarks: savedRemark.trim(),
        };
      });

      setChecklistItems(finalItems);
      setChecklistAnswers(initialAnswers);
      setItemRemarks(initialRemarks);
      setInitialSavedItems(savedSnapshot);
      setValidationErrors({});
    } else {
      setIsChecklistReadOnly(false);
      setChecklistMeta(null);
      setChecklistItems(masterItems);

      // Initialize verification_status to null while the checklist is in draft
      const defaultAnswers = {};
      const defaultRemarks = {};
      const defaultSnapshot = {};
      masterItems.forEach((item) => {
        defaultAnswers[item.id] = null;
        defaultRemarks[item.id] = "";
        defaultSnapshot[item.id] = {
          verificationStatus: null,
          remarks: "",
        };
      });
      setChecklistAnswers(defaultAnswers);
      setItemRemarks(defaultRemarks);
      setInitialSavedItems(defaultSnapshot);
      setValidationErrors({});

      if (masterItems.length === 0 && masterFetchFailed) {
        showPopup("Failed to fetch checklist items.", "error");
      }
    }
  };

  // ----- Fetch Master + Saved PRE_OP Checklist for Booking -----
  const loadChecklistForBooking = async (record, fallbackSavedResponse = null) => {
    const otBookingId = record?.otBookingId ?? record?.id;
    setChecklistLoading(true);

    try {
      const [masterRes, savedRes] = await Promise.all([
        getRequest(`${MAS_OT_CHECKLIST}/getAll/1?checklistStage=PRE_OP`).catch((err) => {
          console.error("Error fetching pre-operative checklist master items:", err);
          return null;
        }),
        otBookingId
          ? getRequest(`${GET_OT_CHECKLIST}/${otBookingId}`).catch((err) => {
              console.warn("No existing OT checklist found or error fetching:", err);
              return null;
            })
          : Promise.resolve(null),
      ]);

      const rawMasterList = Array.isArray(masterRes?.response)
        ? masterRes.response
        : Array.isArray(masterRes?.response?.content)
          ? masterRes.response.content
          : [];
      const masterItems = sortChecklistItems(rawMasterList.map(normalizeChecklistItem));

      const savedSource = savedRes?.response ?? fallbackSavedResponse;
      const savedList = Array.isArray(savedSource)
        ? savedSource
        : savedSource && typeof savedSource === "object"
          ? [savedSource]
          : [];

      const preOpSaved = savedList.find(
        (entry) => String(entry?.checklistStage || "").toUpperCase() === "PRE_OP"
      );

      applyChecklistData(masterItems, preOpSaved, !masterRes);
    } catch (error) {
      console.error("Error loading pre-operative checklist:", error);
      showPopup(error?.message || "Failed to load checklist.", "error");
    } finally {
      setChecklistLoading(false);
    }
  };

  // ----- Open the Pre-Operative Checklist modal for a patient -----
  const openChecklistModal = async (record) => {
    setSelectedRecord(record);
    setChecklistItems([]);
    setChecklistAnswers({});
    setItemRemarks({});
    setInitialSavedItems({});
    setValidationErrors({});
    setRemarks("");
    setChecklistMeta(null);
    setIsChecklistReadOnly(false);
    setFillChecklist(true);

    await loadChecklistForBooking(record);
  };

  const closeChecklistModal = () => {
    setFillChecklist(false);
    setSelectedRecord(null);
    setChecklistItems([]);
    setChecklistAnswers({});
    setItemRemarks({});
    setInitialSavedItems({});
    setValidationErrors({});
    setRemarks("");
    setChecklistMeta(null);
    setIsChecklistReadOnly(false);
  };

  const handleItemRemarkChange = (itemId, value) => {
    if (isChecklistReadOnly) return;
    setItemRemarks((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleChecklistAnswerChange = (item, rawValue) => {
    if (isChecklistReadOnly) return;
    const normalizedValue = rawValue ? String(rawValue).trim().toUpperCase() : null;

    if (normalizedValue !== null && !VALID_VERIFICATION_STATUSES.includes(normalizedValue)) {
      showPopup(
        "Invalid verification status. Allowed values are YES, NO, NA, or empty while in draft.",
        "error"
      );
      return;
    }

    if (normalizedValue === "NA" && item.allowNa !== "Y") {
      showPopup(`N/A is permitted only when Allow N/A is enabled ("${item.label}").`, "error");
      return;
    }

    setChecklistAnswers((prev) => ({ ...prev, [item.id]: normalizedValue }));
    setValidationErrors((prev) => {
      if (!prev[item.id]) return prev;
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
  };

  // ----- Validate Checklist -----
  const validateChecklist = (isDraft = false) => {
    const errors = {};
    let firstErrorMessage = "";

    for (const item of checklistItems) {
      const status = checklistAnswers[item.id] ?? null;

      // 1. verification_status can be YES, NO, NA, or NULL while the checklist is in draft
      if (status !== null && !VALID_VERIFICATION_STATUSES.includes(status)) {
        const msg = `Invalid verification status for "${item.label}". Allowed values: YES, NO, NA, or empty in draft.`;
        errors[item.id] = msg;
        if (!firstErrorMessage) firstErrorMessage = msg;
        continue;
      }

      // 2. NA is permitted only when the master has allow_na = 'Y'
      if (status === "NA" && item.allowNa !== "Y") {
        const msg = `N/A is permitted only when Allow N/A is 'Y' ("${item.label}").`;
        errors[item.id] = msg;
        if (!firstErrorMessage) firstErrorMessage = msg;
        continue;
      }

      // 3. Before submitting as complete, every checklist item must be answered
      if (!isDraft && status === null) {
        const msg = "Please select a status.";
        errors[item.id] = msg;
        if (!firstErrorMessage) {
          firstErrorMessage = "Please answer every checklist item before completing the checklist.";
        }
      }
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      showPopup(firstErrorMessage, "error");
      return false;
    }

    return true;
  };

  // ----- Save Checklist (Draft = "D" or Complete = "Y") -----
  const handleSaveChecklist = async (isDraft = false) => {
    if (isChecklistReadOnly) {
      showPopup("This checklist is already completed and cannot be updated.", "error");
      return;
    }

    if (!validateChecklist(isDraft)) {
      return;
    }

    const checklistStatus = isDraft ? "D" : "Y";

    // Send only changed checklist items; unchanged saved items are preserved by the API.
    const itemsToSubmit = checklistItems
      .filter((item) => {
        const initial = initialSavedItems[item.id] || {
          verificationStatus: null,
          remarks: "",
        };
        const currStatus = checklistAnswers[item.id] ?? null;
        const currRemarks = itemRemarks[item.id]?.trim() || "";
        return (
          currStatus !== initial.verificationStatus ||
          currRemarks !== initial.remarks
        );
      })
      .map((item) => ({
        checklistId: item.checklistId,
        verificationStatus: checklistAnswers[item.id] ?? null,
        remarks: itemRemarks[item.id]?.trim() || "",
      }));

    const payload = {
      otBookingId: selectedRecord?.otBookingId ?? selectedRecord?.id,
      checklistStage: "PRE_OP",
      checklistStatus,
      remarks: remarks?.trim() || "",
      items: itemsToSubmit,
    };

    setIsProcessing(true);
    setSavingMode(isDraft ? "draft" : "final");
    try {
      const res = await postRequest(SUBMIT_OT_CHECKLIST, payload);

      if (res?.status && res.status !== 200 && res.status !== 201) {
        throw new Error(res?.message || "Failed to save Pre-Operative Checklist.");
      }

      // Refresh checklist from GET endpoint (with POST response fallback) & refresh background list
      await loadChecklistForBooking(selectedRecord, res?.response ?? null);
      fetchPatientList(currentPage - 1, appliedFilters.search, appliedFilters.status);

      const successMessage =
        res?.message && res.message.toLowerCase() !== "success"
          ? res.message
          : isDraft
            ? "Pre-Operative Checklist saved as draft!"
            : "Pre-Operative Checklist completed successfully!";

      showPopup(successMessage, "success");
    } catch (error) {
      console.error("Error submitting OT checklist:", error);
      showPopup(error?.message || "Failed to save Pre-Operative Checklist.", "error");
    } finally {
      setIsProcessing(false);
      setSavingMode(null);
    }
  };

  // ----- Popup helper -----
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
  // OT PRE-OPERATIVE CHECKLIST MODAL (with fixed positioning to avoid sidebar)
  // ============================================================
  if (fillChecklist && selectedRecord) {
    const storedStatusLabel = checklistMeta?.checklistStatus || "";
    const isSavedDraft = storedStatusLabel === "DRAFT";
    const allMandatoryFilled =
      checklistItems.length > 0 &&
      checklistItems
        .filter((item) => item.required)
        .every((item) => Boolean(checklistAnswers[item.id]));
    const verifiedByDisplay =
      checklistMeta?.verifiedBy ||
      checklistMeta?.lastChgBy ||
      getLoggedInUserName();
    const verifiedDateTimeDisplay = checklistMeta?.verifiedDatetime
      ? formatDateTimeForDisplay(checklistMeta.verifiedDatetime, "-")
      : checklistMeta?.lastChgDate
        ? formatDateTimeForDisplay(checklistMeta.lastChgDate, "-")
        : formatDateTimeForDisplay(new Date(), "-");

    return (
      <>
        <div className="content-wrapper">
          {checklistLoading && <LoadingScreen />}
          <div className="card form-card">

            <div className="card-header">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-1">
                  <button className="btn-back" title="Back to OT Pre-Operative Checklist List" onClick={closeChecklistModal}><i className="icofont-arrow-left"></i></button>
                  <h4 className="card-title p-2 mb-0">OT Pre-Operative Checklist</h4>
                </div>
                {storedStatusLabel && (
                  <span
                    className={`badge ${
                      isSavedDraft ? "bg-warning text-dark" : "bg-success"
                    }`}
                  >
                    {storedStatusLabel}
                  </span>
                )}
              </div>
            </div>

            <div className="card-body" tabIndex={-1} onClick={(e) => e.stopPropagation()}>
              <div className="">
                {/* Patient / Booking Details */}
                <h6 className="fw-bold text-primary mb-2">Patient / Booking Details</h6>

                <section className="patient-card">
                  <div className="patient-header">
                    <h4>{selectedRecord.patientName}</h4>
                    <p>UHID / IP No: <strong> {selectedRecord.uhidOrIp}</strong></p>
                  </div>

                  <div className="details-grid grid-col-3">
                    <div className="detail-item">
                      <span className="detail-label">Age / Gender</span>
                      <span className="detail-value">{selectedRecord.ageGender}</span>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Department</span>
                      <span className="detail-value">{selectedRecord.department}</span>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Ward / Bed</span>
                      <span className="detail-value">{selectedRecord.wardBed}</span>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Operation Theatre</span>
                      <span className="detail-value">{selectedRecord.ot}</span>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Surgeon</span>
                      <span className="detail-value">{selectedRecord.surgeon}</span>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Scheduled</span>
                      <span className="detail-value" style={{ color: "#059669" }}>{selectedRecord.scheduledTime}</span>
                    </div>
                  </div>
                </section>

                <div className="surgery-list mb-3">
                  <h5 className="fw-semibold">Planned Surgeries:</h5>
                  {selectedRecord.plannedSurgeries && selectedRecord.plannedSurgeries.length > 0 ? (
                    <ol>
                      {selectedRecord.plannedSurgeries.map((surgery, idx) => (
                        <li key={idx}>
                          <span className="surgery-number">{idx + 1}</span>
                          <span className="surgery-name">{surgery}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-muted mb-0">-</p>
                  )}
                </div>

                {/* Pre-Operative Verification */}
                <h6 className="fw-bold text-primary mb-2">Pre-Operative Verification</h6>
                <div className="table-responsive">
                  <table className="table table-sm table-bordered align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Checklist Item</th>
                        <th className="text-center" style={{ width: "160px" }}>Status</th>
                        <th style={{ width: "280px" }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checklistItems.length > 0 ? (
                        checklistItems.map((item) => (
                          <tr key={item.id}>
                            <td>
                              {item.label}
                              {item.required && <span className="text-danger"> *</span>}
                            </td>
                            <td>
                              <div className="btnCenter flex-column">
                                <select
                                  className={`form-select form-select-sm smSelect${validationErrors[item.id] ? " is-invalid" : ""}`}
                                  value={checklistAnswers[item.id] ?? ""}
                                  onChange={(e) => handleChecklistAnswerChange(item, e.target.value)}
                                  disabled={isProcessing || checklistLoading || isChecklistReadOnly}
                                >
                                  <option value="">-- Select --</option>
                                  <option value="YES">Yes</option>
                                  <option value="NO">No</option>
                                  {item.hasNA && <option value="NA">N/A</option>}
                                </select>
                                {validationErrors[item.id] && (
                                  <small className="text-danger mt-1">{validationErrors[item.id]}</small>
                                )}
                              </div>
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder={isChecklistReadOnly ? "-" : "Enter remarks..."}
                                value={itemRemarks[item.id] || ""}
                                onChange={(e) => handleItemRemarkChange(item.id, e.target.value)}
                                disabled={isProcessing || checklistLoading || isChecklistReadOnly}
                              />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center">
                            {checklistLoading ? "Loading checklist items..." : "No checklist items found."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="row">
                  <div className="col-md-4 mb-2">
                    {/* Remarks + Auto fields */}
                    <label className="form-label fw-bold">Remarks</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder={isChecklistReadOnly ? "-" : "Optional remarks..."}
                      disabled={isProcessing || isChecklistReadOnly}
                      style={{ height: "60px" }}
                    />
                  </div>
                  <div className="col-md-4 mb-2">
                    <label className="form-label fw-bold small mb-1">Verified By</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={verifiedByDisplay}
                      readOnly
                    />
                  </div>
                  <div className="col-md-4 mb-2">
                    <label className="form-label fw-bold small mb-1">Date / Time</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={verifiedDateTimeDisplay}
                      readOnly />
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-2">
                <div className="">
                  <button className="btn btnOutline" onClick={closeChecklistModal}><i className="icofont-arrow-left"></i> <span>Back</span></button>
                </div>
                {!isChecklistReadOnly && (
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleSaveChecklist(true)}
                      disabled={isProcessing || checklistLoading || checklistItems.length === 0}
                    >
                      {isProcessing && savingMode === "draft" ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Saving Draft...
                        </>
                      ) : (
                        "Save Draft"
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleSaveChecklist(false)}
                      disabled={isProcessing || checklistLoading || !allMandatoryFilled}
                      title={!allMandatoryFilled ? "Please fill all mandatory (*) checklist items" : ""}
                    >
                      {isProcessing && savingMode === "final" ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Saving...
                        </>
                      ) : (
                        "Save Checklist"
                      )}
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {popupMessage && (
          <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
        )}
      </>
    );
  }

  // ============================================================
  // RENDER: MAIN LIST VIEW
  // ============================================================
  return (
    <>
      <div className="content-wrapper">
        {loading && <LoadingScreen />}
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header">
                <h4 className="card-title p-2 mb-0 ps-0">OT Pre-Operative Checklist</h4>
              </div>
              <div className="card-body">
                {/* Search / Filter Section */}
                <div className="mb-4">
                  <div className="row g-3 align-items-end">
                    <div className="col-md-3">
                      <label className="form-label fw-bold">Search</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="UHID/IP No., Patient, Surgery or Surgeon"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSearch();
                          }
                        }}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label fw-bold">Checklist Status</label>
                      <select
                        className="form-select"
                        value={checklistStatusFilter}
                        onChange={(e) => setChecklistStatusFilter(e.target.value)}
                      >
                        <option value="">All</option>
                        <option value="N">Pending</option>
                        <option value="D">Draft</option>
                      </select>
                    </div>
                    <div className="col-md-2 d-flex gap-2">
                      <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
                        <i className="fa fa-search me-1"></i> Search
                      </button>
                      <button className="btn btn-secondary" onClick={handleReset} disabled={loading}>
                        <i className="fa fa-refresh me-1"></i> Reset
                      </button>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="table-responsive">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>UHID / IP No.</th>
                        <th>Patient Name</th>
                        <th>Department</th>
                        <th>Surgery</th>
                        <th>Surgeon</th>
                        <th className="text-center">OT</th>
                        <th>Scheduled Time</th>
                        <th>Received Time</th>
                        <th className="text-center">Checklist</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.length > 0 ? (
                        data.map((item) => (
                          <tr key={item.id}>
                            <td>{item.uhidOrIp}</td>
                            <td>{item.patientName}</td>
                            <td>{item.department}</td>
                            <td>{item.surgery}</td>
                            <td>{item.surgeon}</td>
                            <td className="text-center">
                              <span className="badge bg-info">{item.ot}</span>
                            </td>
                            <td>{item.scheduledTime}</td>
                            <td>{item.receivedTime}</td>
                            <td className="text-center">
                              <span
                                className={`badge ${
                                  item.checklistStatus === "Completed"
                                    ? "bg-success"
                                    : item.checklistStatus === "Draft"
                                      ? "bg-info text-dark"
                                      : "bg-warning text-dark"
                                }`}
                              >
                                {item.checklistStatus}
                              </span>
                            </td>
                            <td className="text-center">
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => openChecklistModal(item)}
                                title="Open Pre-Operative Checklist"
                              >
                                {item.checklistStatus === "Completed"
                                  ? "View Checklist"
                                  : item.checklistStatus === "Draft"
                                    ? "Update Checklist"
                                    : "Fill Checklist"}
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="10" className="text-center">
                            {loading ? "Loading patients..." : "No patients found."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {totalItems > 0 && (
                  <Pagination
                    totalItems={totalItems}
                    itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                    totalPages={totalPages}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {popupMessage && (
        <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
      )}
    </>
  );
};

export default OTPreOperativeChecklist;
