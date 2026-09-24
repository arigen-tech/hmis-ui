import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import Popup from "../../../Components/popup"
import ConfirmationPopup from "../../../Components/ConfirmationPopup"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination"
import { getRequest, postRequest } from "../../../service/apiService"
import {
  GET_ALLOCATED_BLOOD_REQUEST_LIST,
  MAS_DEPARTMENT_GET_ALL,
  MAS_WARD_GET_ALL_ACTIVE,
  MAS_CROSS_MATCH_TYPE,
  SAVE_CROSSMATCH,
} from "../../../config/apiConfig"
import {
  CROSS_MATCH_RESULT_OPTIONS,
  DEFAULT_CROSS_MATCH_TYPES,
  CROSS_MATCH_RESULTS,
} from "../../../config/constants"


// PortalDropdown Component - Fixed positioning
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
        maxHeight: "250px",
        overflowY: "auto",
        background: "#fff",
        border: "1px solid #dee2e6",
        borderRadius: "4px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
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

const PendingForCrossMatch = () => {
  const [isTableLoading, setIsTableLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [confirmationPopup, setConfirmationPopup] = useState(null)
  const [popupMessage, setPopupMessage] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [currentView, setCurrentView] = useState("list") // "list" or "detail"
  const [currentPage, setCurrentPage] = useState(1)

  // Search state
  const [searchFilters, setSearchFilters] = useState({
    patientName: "",
    wardId: "",
  });
  const [requestList, setRequestList] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [totalItems, setTotalItems] = useState(0);

  // Wards / Departments options state
  const [wardOptions, setWardOptions] = useState([]);

  // Selected request / patient header
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Patient sample section
  const [sampleCollected, setSampleCollected] = useState(false);
  const [sampleCollectedDateTime, setSampleCollectedDateTime] = useState("");
  const [sampleReceivedBy, setSampleReceivedBy] = useState("");
  const [crossMatchTypes, setCrossMatchTypes] = useState(DEFAULT_CROSS_MATCH_TYPES);
  const [selectedCrossMatchTypeId, setSelectedCrossMatchTypeId] = useState("");
  const [overallRemarks, setOverallRemarks] = useState("");

  // Cross-match grid
  const [crossMatchEntries, setCrossMatchEntries] = useState([]);

  // Dropdown search for patient name
  const [patientDropdown, setPatientDropdown] = useState([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [isPatientLoading, setIsPatientLoading] = useState(false);
  const debouncePatientRef = useRef(null);
  const patientInputRef = useRef(null);

  // Load master cross-match types on mount
  useEffect(() => {
    const loadCrossMatchTypes = async () => {
      try {
        const res = await getRequest(`${MAS_CROSS_MATCH_TYPE}/getAll/1`);
        const list = res?.response || res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(list) && list.length > 0) {
          const activeList = list.filter(
            (item) => !item.status || String(item.status).toUpperCase() === "Y"
          );
          setCrossMatchTypes(activeList.length > 0 ? activeList : list);
        }
      } catch (err) {
        console.error("Failed to load cross-match types:", err);
      }
    };
    loadCrossMatchTypes();
  }, []);

  // Load master wards and departments on mount
  useEffect(() => {
    const loadWards = async () => {
      try {
        const [wardsRes, deptsRes] = await Promise.allSettled([
          getRequest(MAS_WARD_GET_ALL_ACTIVE),
          getRequest(MAS_DEPARTMENT_GET_ALL),
        ]);

        const options = [];
        const seenIds = new Set();
        const seenNames = new Set();

        if (wardsRes.status === "fulfilled") {
          const res = wardsRes.value;
          const list = res?.response || res?.data || (Array.isArray(res) ? res : []);
          if (Array.isArray(list)) {
            list.forEach((w) => {
              const id = w.wardId ?? w.id;
              const name = w.wardName ?? w.name;
              if (id !== undefined && id !== null && name) {
                const strId = String(id);
                const strName = String(name);
                if (!seenIds.has(strId)) {
                  seenIds.add(strId);
                  seenNames.add(strName.toLowerCase());
                  options.push({ id: strId, name: strName });
                }
              }
            });
          }
        }

        if (deptsRes.status === "fulfilled") {
          const res = deptsRes.value;
          const list = res?.response || res?.data || (Array.isArray(res) ? res : []);
          if (Array.isArray(list)) {
            list.forEach((d) => {
              const id = d.departmentId ?? d.id;
              const name = d.departmentName ?? d.name ?? d.deptName;
              if (id !== undefined && id !== null && name) {
                const strId = String(id);
                const strName = String(name);
                if (!seenIds.has(strId) && !seenNames.has(strName.toLowerCase())) {
                  seenIds.add(strId);
                  seenNames.add(strName.toLowerCase());
                  options.push({ id: strId, name: strName });
                }
              }
            });
          }
        }

        setWardOptions(options);
      } catch (err) {
        console.error("Failed to load wards/departments:", err);
      }
    };
    loadWards();
  }, []);

  // Combined options including any ward present in live requests
  const allWardOptions = [
    ...wardOptions,
    ...Array.from(
      new Set(
        requestList
          .map((r) => r.requestDept || r.ward)
          .filter(
            (d) =>
              Boolean(d) &&
              !wardOptions.some(
                (w) => w.name.toLowerCase() === String(d).toLowerCase()
              )
          )
      )
    ).map((d) => ({ id: d, name: d })),
  ];

  const searchFiltersRef = useRef(searchFilters);
  useEffect(() => {
    searchFiltersRef.current = searchFilters;
  }, [searchFilters]);

  // Fetch allocated blood requests from backend with server-side query filters
  const fetchAllocatedRequests = useCallback(
    async (page = 0, filters = null, size = DEFAULT_ITEMS_PER_PAGE) => {
      setIsTableLoading(true);
      try {
        const activeFilters = filters || searchFiltersRef.current;
        const params = new URLSearchParams({
          page: String(page),
          size: String(size),
        });

        if (activeFilters?.patientName?.trim()) {
          params.set("patientName", activeFilters.patientName.trim());
        }

        if (
          activeFilters?.wardId !== undefined &&
          activeFilters?.wardId !== null &&
          String(activeFilters.wardId).trim() !== ""
        ) {
          params.set("wardId", String(activeFilters.wardId).trim());
        }

        const response = await getRequest(
          `${GET_ALLOCATED_BLOOD_REQUEST_LIST}?${params.toString()}`
        );
        const pageData = response?.data || response?.response || response;
        const content = Array.isArray(pageData?.content)
          ? pageData.content
          : Array.isArray(pageData)
            ? pageData
            : [];

        // Map and group items by requestDtId so multiple allocated units for the same request detail are combined
        const groupedMap = new Map();

        content.forEach((item, idx) => {
          const key = item.requestDtId || `${item.requestHdId || ''}_${idx}`;
          const unitObj = (item.unitNumber || item.inventoryId) ? {
            inventoryId: item.inventoryId ?? item.bloodInventoryId ?? item.unitId ?? null,
            unitNo: item.unitNumber || "",
            bloodGroup: item.bloodGroup || "",
            volume: item.unitVolume ? (String(item.unitVolume).toLowerCase().includes('ml') ? item.unitVolume : `${item.unitVolume} ml`) : "",
            expiry: item.unitExpiryDate || "",
          } : null;

          if (!groupedMap.has(key)) {
            const reqNo = item.requestNo || "";
            const ipNo = item.inpatientNo || item.inpatient || "";
            const patientName = item.patientName || "";
            const bloodGroup = item.bloodGroup || "";
            const component = item.component || "";
            const unitsReq = item.unitsRequired ?? item.unitsReq ?? "";
            const unitsAlloc = item.unitsAllocated ?? item.unitsAlloc ?? "";
            const ward = item.ward || item.requestDept || "";
            const urgency = item.urgency || "";
            const requestedOn = item.requestedOn || "";
            const requiredBy = item.requiredBy || "";
            const ageGender = item.ageGender || (
              item.age !== undefined && item.age !== null && item.gender
                ? `${item.age} / ${item.gender}`
                : (item.age !== undefined && item.age !== null ? `${item.age}` : (item.gender || ""))
            );

            let initialUnits = [];
            if (Array.isArray(item.allocatedUnits) && item.allocatedUnits.length > 0) {
              initialUnits = item.allocatedUnits.map((u) => ({
                requestDtId: u.requestDtId ?? item.requestDtId ?? null,
                inventoryId: u.inventoryId ?? u.bloodInventoryId ?? u.unitId ?? item.inventoryId ?? null,
                unitNo: u.unitNumber || u.unitNo || "",
                bloodGroup: u.bloodGroup || bloodGroup || "",
                volume: u.unitVolume ? (String(u.unitVolume).toLowerCase().includes('ml') ? u.unitVolume : `${u.unitVolume} ml`) : (u.volume || ""),
                expiry: u.unitExpiryDate || u.expiry || "",
              }));
            } else if (unitObj) {
              initialUnits = [{
                ...unitObj,
                requestDtId: item.requestDtId ?? null,
              }];
            }

            groupedMap.set(key, {
              ...item,
              id: item.requestDtId || item.id || idx,
              requestHdId: item.requestHdId,
              requestDtId: item.requestDtId,
              inventoryId: item.inventoryId ?? item.bloodInventoryId ?? item.unitId ?? null,
              requestNo: reqNo,
              inpatient: ipNo,
              inpatientNo: ipNo,
              inpatientId: item.inpatientId,
              patientId: item.patientId,
              patientName,
              age: item.age,
              gender: item.gender,
              bloodGroup,
              component,
              unitsReq,
              unitsAlloc,
              unitsRequired: unitsReq,
              unitsAllocated: unitsAlloc,
              unitNumber: item.unitNumber || "",
              unitVolume: item.unitVolume || "",
              unitExpiryDate: item.unitExpiryDate || "",
              requestDept: ward,
              ward,
              urgency,
              requestedOn,
              requiredBy,
              trackingStatusId: item.trackingStatusId,
              ageGender,
              headerInfo: {
                requestNo: reqNo,
                patientName,
                inpatientNo: ipNo,
                ageGender,
                bloodGroup,
                department: ward,
                urgency,
                requestDate: requestedOn,
                component,
                unitsRequired: unitsReq,
                unitsAllocated: unitsAlloc,
                inventoryId: item.inventoryId ?? item.bloodInventoryId ?? item.unitId ?? null,
              },
              allocatedUnits: initialUnits,
            });
          } else {
            const existing = groupedMap.get(key);
            if (unitObj) {
              const alreadyExists = existing.allocatedUnits.some(
                (u) =>
                  (unitObj.inventoryId && u.inventoryId === unitObj.inventoryId) ||
                  (unitObj.unitNo && u.unitNo === unitObj.unitNo)
              );
              if (!alreadyExists) {
                existing.allocatedUnits.push({
                  ...unitObj,
                  requestDtId: item.requestDtId ?? existing.requestDtId ?? null,
                });
                existing.unitsAlloc = existing.allocatedUnits.length;
                existing.unitsAllocated = existing.allocatedUnits.length;
                if (existing.headerInfo) {
                  existing.headerInfo.unitsAllocated = existing.allocatedUnits.length;
                }
              }
            }
          }
        });

        const mapped = Array.from(groupedMap.values());
        mapped.forEach((record) => {
          if (record.allocatedUnits.length === 0 && Number(record.unitsAlloc) > 0) {
            record.allocatedUnits = Array.from({ length: Number(record.unitsAlloc) }, () => ({
              inventoryId: record.inventoryId ?? null,
              unitNo: "",
              bloodGroup: record.bloodGroup || "",
              volume: "",
              expiry: "",
            }));
          }
        });

        setRequestList(mapped);
        setFilteredRequests(mapped);
        setTotalItems(pageData?.totalElements ?? mapped.length);
      } catch (error) {
        console.error("Error fetching allocated blood requests:", error);
        showPopup(error?.message || "Failed to load allocated blood requests", "error");
        setRequestList([]);
        setFilteredRequests([]);
        setTotalItems(0);
      } finally {
        setIsTableLoading(false);
        setIsSearching(false);
        setIsResetting(false);
      }
    }, []);

  useEffect(() => {
    fetchAllocatedRequests(currentPage - 1);
  }, [currentPage, fetchAllocatedRequests]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (patientInputRef.current && !patientInputRef.current.contains(e.target)) {
        setShowPatientDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const showConfirmationPopup = (message, type, onConfirm, onCancel = null, confirmText = "Yes", cancelText = "No") => {
    setConfirmationPopup({
      message,
      type,
      onConfirm: () => {
        onConfirm()
        setConfirmationPopup(null)
      },
      onCancel: onCancel
        ? () => {
          onCancel()
          setConfirmationPopup(null)
        }
        : () => setConfirmationPopup(null),
      confirmText,
      cancelText,
    })
  }

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => setPopupMessage(null),
    })
  }

  const handlePatientNameSearch = (value) => {
    setSearchFilters(prev => ({ ...prev, patientName: value }))

    if (debouncePatientRef.current) clearTimeout(debouncePatientRef.current)

    debouncePatientRef.current = setTimeout(async () => {
      if (!value.trim()) {
        setPatientDropdown([])
        setShowPatientDropdown(false)
        return
      }

      setIsPatientLoading(true);
      const suggestionsFromRequests = requestList
        .filter((r) => r.patientName)
        .map((r) => ({
          patientName: r.patientName,
          inpatientNo: r.inpatientNo || r.inpatient || "",
          bloodGroup: r.bloodGroup || "",
          ageGender: r.ageGender || "",
        }));
      const unique = Array.from(
        new Map(suggestionsFromRequests.map((p) => [p.patientName, p])).values()
      );
      const filtered = unique.filter((patient) =>
        patient.patientName?.toLowerCase().includes(value.toLowerCase())
      );
      setPatientDropdown(filtered);
      setShowPatientDropdown(filtered.length > 0);
      setIsPatientLoading(false);
    }, 300)
  }

  const handlePatientSelect = async (patient) => {
    const updated = { ...searchFilters, patientName: patient.patientName };
    setSearchFilters(updated);
    setShowPatientDropdown(false);
    setCurrentPage(1);
    setIsSearching(true);
    await fetchAllocatedRequests(0, updated);
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = async (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    setIsSearching(true);
    setCurrentPage(1);
    await fetchAllocatedRequests(0, searchFilters);
  };

  const handleReset = async (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    setIsResetting(true);
    const cleared = {
      patientName: "",
      wardId: "",
    };
    setSearchFilters(cleared);
    setCurrentPage(1);
    await fetchAllocatedRequests(0, cleared);
  };

  const handleRowClick = (request) => {
    setSelectedRequest(request);

    // Initialize cross-match rows from allocated units
    const units = Array.isArray(request.allocatedUnits) && request.allocatedUnits.length > 0
      ? request.allocatedUnits
      : (request.unitNumber || request.inventoryId)
        ? [{
          inventoryId: request.inventoryId ?? request.bloodInventoryId ?? null,
          unitNo: request.unitNumber || "",
          bloodGroup: request.bloodGroup || "",
          volume: request.unitVolume ? (String(request.unitVolume).toLowerCase().includes('ml') ? request.unitVolume : `${request.unitVolume} ml`) : "",
          expiry: request.unitExpiryDate || "",
        }]
        : [];

    setCrossMatchEntries(
      units.map((unit) => ({
        requestDtId: unit.requestDtId ?? request.requestDtId ?? null,
        inventoryId: unit.inventoryId ?? request.inventoryId ?? null,
        unitNo: unit.unitNo || unit.unitNumber || "",
        bloodGroup: unit.bloodGroup || request.bloodGroup || "",
        volume: unit.volume || (unit.unitVolume ? (String(unit.unitVolume).toLowerCase().includes('ml') ? unit.unitVolume : `${unit.unitVolume} ml`) : "") || "",
        expiry: unit.expiry || unit.unitExpiryDate || "",
        crossMatchResult: unit.crossMatchResult || "",
        testDate: unit.testDate || "",
        remarks: unit.remarks || "",
      }))
    );

    // Reset sample section
    setSampleCollected(false);
    setSampleCollectedDateTime("");
    setSampleReceivedBy("");
    setOverallRemarks("");
    setSelectedCrossMatchTypeId("");

    // Switch to detail view
    setCurrentView("detail");
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedRequest(null);
    setCrossMatchEntries([]);
    setSampleCollected(false);
    setSampleCollectedDateTime("");
    setSampleReceivedBy("");
    setOverallRemarks("");
  };

  const handleSampleCollectedChange = (checked) => {
    setSampleCollected(checked);
    if (checked) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const formatted = `${year}-${month}-${day}T${hours}:${minutes}`;
      const todayStr = `${year}-${month}-${day}`;

      setSampleCollectedDateTime(formatted);
      if (!sampleReceivedBy) {
        const loggedUser = sessionStorage.getItem("loggedInUserName") || localStorage.getItem("loggedInUserName") || "";
        if (loggedUser) setSampleReceivedBy(loggedUser);
      }
      if (!selectedCrossMatchTypeId && crossMatchTypes.length > 0) {
        const isEmerg = String(selectedRequest?.urgency || "").toLowerCase() === "emergency";
        if (isEmerg) {
          const emergType = crossMatchTypes.find((t) => t.isEmergencyAllowed === "Y");
          if (emergType) {
            setSelectedCrossMatchTypeId(String(emergType.id || emergType.crossMatchTypeId));
          }
        }
      }
      setCrossMatchEntries((prev) =>
        prev.map((entry) => ({
          ...entry,
          testDate: entry.testDate || todayStr,
        }))
      );
    } else {
      setSelectedCrossMatchTypeId("");
      setSampleCollectedDateTime("");
      setSampleReceivedBy("");
      setOverallRemarks("");
      // When deselected, blank out Cross-Match Result, Test Date, and Remarks
      setCrossMatchEntries((prev) =>
        prev.map((entry) => ({
          ...entry,
          crossMatchResult: "",
          testDate: "",
          remarks: "",
        }))
      );
    }
  };

  const handleCrossMatchEntryChange = (index, field, value) => {
    const updated = crossMatchEntries.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry
    );
    setCrossMatchEntries(updated);
  };

  const validateCrossMatch = () => {
    if (!selectedRequest) {
      showPopup("Please select a request first", "warning");
      return false;
    }
    if (!sampleCollected) {
      showPopup("Please confirm sample collected from patient", "warning");
      return false;
    }
    if (!sampleReceivedBy.trim()) {
      showPopup("Sample Received By is required", "warning");
      return false;
    }
    if (!sampleCollectedDateTime) {
      showPopup("Sample Collected Date & Time is required", "warning");
      return false;
    }
    if (!selectedCrossMatchTypeId) {
      showPopup("Crossmatch Type is required", "warning");
      return false;
    }
    if (crossMatchEntries.length === 0) {
      showPopup("No allocated units found for cross-matching", "warning");
      return false;
    }
    for (let i = 0; i < crossMatchEntries.length; i++) {
      if (!crossMatchEntries[i].crossMatchResult) {
        showPopup(`Cross-Match Result is required for row ${i + 1}`, "warning");
        return false;
      }
      if (!crossMatchEntries[i].testDate) {
        showPopup(`Test Date is required for row ${i + 1}`, "warning");
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateCrossMatch()) return;

    showConfirmationPopup(
      "Are you sure you want to save the cross-match details?",
      "info",
      async () => {
        setIsSaving(true);
        try {
          const now = new Date();
          const pad = (n) => String(n).padStart(2, "0");
          const currentLocalDateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
          const todayDateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

          let formattedSampleReceived = "";
          if (sampleCollectedDateTime) {
            formattedSampleReceived =
              sampleCollectedDateTime.length === 16
                ? `${sampleCollectedDateTime}:00`
                : sampleCollectedDateTime;
          } else {
            formattedSampleReceived = currentLocalDateTime;
          }

          const overallResult =
            crossMatchEntries.some((e) => e.crossMatchResult?.toLowerCase() === CROSS_MATCH_RESULTS.INCOMPATIBLE.toLowerCase())
              ? CROSS_MATCH_RESULTS.INCOMPATIBLE
              : crossMatchEntries.every((e) => e.crossMatchResult?.toLowerCase() === CROSS_MATCH_RESULTS.COMPATIBLE.toLowerCase())
                ? CROSS_MATCH_RESULTS.COMPATIBLE
                : CROSS_MATCH_RESULTS.PENDING;

          const reqDtId =
            selectedRequest.requestDtId ??
            selectedRequest.bloodRequestDtId ??
            selectedRequest.requestDetailId ??
            selectedRequest.dtId ??
            null;

          const payload = {
            requestHdId: selectedRequest.requestHdId ? Number(selectedRequest.requestHdId) : null,
            requestDtId: reqDtId ? Number(reqDtId) : null,
            inpatientId: selectedRequest.inpatientId ? Number(selectedRequest.inpatientId) : null,
            patientId: selectedRequest.patientId ? Number(selectedRequest.patientId) : null,
            crossmatchTypeId: selectedCrossMatchTypeId ? Number(selectedCrossMatchTypeId) : null,
            isEmergency: Boolean(
              selectedRequest.isEmergency ??
              (String(selectedRequest.urgency).toLowerCase() === "emergency")
            ),
            sampleReceivedDatetime: formattedSampleReceived,
            crossmatchDatetime: currentLocalDateTime,
            overallResult: overallResult,
            remarks: overallRemarks || "",
            units: crossMatchEntries.map((entry) => ({
              requestDtId: (entry.requestDtId ?? reqDtId) != null
                ? Number(entry.requestDtId ?? reqDtId)
                : null,
              inventoryId: entry.inventoryId != null
                ? Number(entry.inventoryId)
                : (selectedRequest.inventoryId != null ? Number(selectedRequest.inventoryId) : null),
              unitNo: entry.unitNo || "",
              compatibilityResult: entry.crossMatchResult || "",
              testDate: entry.testDate || todayDateStr,
              remarks: entry.remarks || "",
            })),
          };

          const response = await postRequest(SAVE_CROSSMATCH, payload);

          if (response?.status === 200 || response?.status === 201 || response?.success) {
            showConfirmationPopup(
              response?.message || "Cross-match details saved successfully.",
              "success",
              () => {
                handleBackToList();
                fetchAllocatedRequests(currentPage - 1);
              },
              () => {
                handleBackToList();
                fetchAllocatedRequests(currentPage - 1);
              },
              "OK",
              "Close"
            );
          } else {
            showConfirmationPopup(
              response?.message || "Failed to save cross-match details.",
              "error",
              () => { },
              null,
              "OK",
              "Close"
            );
          }
        } catch (error) {
          console.error("Save Cross Match Error:", error);
          showConfirmationPopup(
            error?.message || "Something went wrong. Please try again.",
            "error",
            () => { },
            null,
            "OK",
            "Close"
          );
        } finally {
          setIsSaving(false);
        }
      },
      () => console.log("Save cross match cancelled"),
      "Yes, Save",
      "Cancel"
    );
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    if (typeof dateStr === "string" && dateStr.includes("/")) {
      return dateStr;
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr || "";
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getUrgencyBadge = (urgency) => {
    if (!urgency) return "";
    switch (urgency?.toLowerCase()) {
      case "emergency":
        return <span className="badge bg-danger">Emergency</span>;
      case "urgent":
        return <span className="badge bg-warning text-dark">Urgent</span>;
      case "routine":
        return <span className="badge bg-info">Routine</span>;
      default:
        return <span className="badge bg-secondary">{urgency}</span>;
    }
  };

  // Pagination
  const isServerPaged = totalItems > requestList.length;
  const currentItems = isServerPaged
    ? filteredRequests
    : filteredRequests.slice(
      (currentPage - 1) * DEFAULT_ITEMS_PER_PAGE,
      currentPage * DEFAULT_ITEMS_PER_PAGE
    );



  // Detail View (Cross-match entry screen)
  if (currentView === "detail" && selectedRequest) {
    return (
      <div className="content-wrapper">
        <ConfirmationPopup
          show={confirmationPopup !== null}
          message={confirmationPopup?.message || ""}
          type={confirmationPopup?.type || "info"}
          onConfirm={confirmationPopup?.onConfirm || (() => { })}
          onCancel={confirmationPopup?.onCancel}
          confirmText={confirmationPopup?.confirmText || "OK"}
          cancelText={confirmationPopup?.cancelText}
        />

        {popupMessage && (
          <Popup
            message={popupMessage.message}
            type={popupMessage.type}
            onClose={popupMessage.onClose}
          />
        )}

        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">Cross-Match Entry</h4>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleBackToList}
                  disabled={isSaving}
                >
                  Back to List
                </button>
              </div>

              <div className="card-body">
                {/* Patient Details Section (Read-only) */}
                <div className="card shadow mb-4">
                  <div className="card-header py-3" style={{ backgroundColor: "#f8f9fa" }}>
                    <h6 className="mb-0 fw-bold">Patient Details</h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Request No</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedRequest.requestNo || ""}
                          readOnly
                          style={{ backgroundColor: "#f8f9fa" }}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Inpatient No</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedRequest.inpatientNo || ""}
                          readOnly
                          style={{ backgroundColor: "#f8f9fa" }}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Patient Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedRequest.patientName || ""}
                          readOnly
                          style={{ backgroundColor: "#f8f9fa" }}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Age / Gender</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedRequest.ageGender || ""}
                          readOnly
                          style={{ backgroundColor: "#f8f9fa" }}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Blood Group</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedRequest.bloodGroup || ""}
                          readOnly
                          style={{ backgroundColor: "#f8f9fa" }}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Request Dept</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedRequest.requestDept || selectedRequest.ward || ""}
                          readOnly
                          style={{ backgroundColor: "#f8f9fa" }}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Urgency</label>
                        <div>
                          {getUrgencyBadge(selectedRequest.urgency)}
                        </div>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Requested On</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formatDateTime(selectedRequest.requestedOn)}
                          readOnly
                          style={{ backgroundColor: "#f8f9fa" }}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Required By</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formatDateTime(selectedRequest.requiredBy)}
                          readOnly
                          style={{ backgroundColor: "#f8f9fa" }}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Component</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedRequest.component || ""}
                          readOnly
                          style={{ backgroundColor: "#f8f9fa" }}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Units Required</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedRequest.unitsReq ?? selectedRequest.unitsRequired ?? ""}
                          readOnly
                          style={{ backgroundColor: "#f8f9fa" }}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Units Allocated</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedRequest.unitsAlloc ?? selectedRequest.unitsAllocated ?? ""}
                          readOnly
                          style={{ backgroundColor: "#f8f9fa" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Patient Sample Details */}
                <div className="card shadow mb-4">
                  <div className="card-header py-3" style={{ backgroundColor: "#f8f9fa" }}>
                    <h6 className="mb-0 fw-bold">Patient Sample Details</h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3 align-items-end">
                      <div className="col-md-3">
                        <label className="form-label fw-bold">
                          Sample Collected from Patient
                        </label>
                        <div className="form-check mt-1">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="sampleCollected"
                            checked={sampleCollected}
                            onChange={(e) =>
                              handleSampleCollectedChange(e.target.checked)
                            }
                            style={{ width: "18px", height: "18px", cursor: "pointer" }}
                            disabled={isSaving}
                          />
                          <label
                            className="form-check-label ms-2"
                            htmlFor="sampleCollected"
                          >
                            Collected
                          </label>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">
                          Sample Collected Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          className="form-control"
                          value={sampleCollectedDateTime}
                          onChange={(e) =>
                            setSampleCollectedDateTime(e.target.value)
                          }
                          disabled={!sampleCollected || isSaving}
                          style={
                            !sampleCollected
                              ? { backgroundColor: "#f8f9fa" }
                              : {}
                          }
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Sample Received By</label>
                        <input
                          type="text"
                          className="form-control"
                          value={sampleReceivedBy}
                          onChange={(e) => setSampleReceivedBy(e.target.value)}
                          placeholder="Enter name"
                          disabled={!sampleCollected || isSaving}
                          style={
                            !sampleCollected
                              ? { backgroundColor: "#f8f9fa" }
                              : {}
                          }
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">
                          Crossmatch Type <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          value={selectedCrossMatchTypeId}
                          onChange={(e) => setSelectedCrossMatchTypeId(e.target.value)}
                          disabled={!sampleCollected || isSaving}
                          style={
                            !sampleCollected
                              ? { backgroundColor: "#f8f9fa" }
                              : {}
                          }
                        >
                          <option value="">Select Crossmatch Type</option>
                          {crossMatchTypes.map((type) => {
                            const typeId = type.id || type.crossMatchTypeId;
                            const typeName =
                              type.crossMatchName ||
                              type.crossMatchTypeName ||
                              type.crossMatchType ||
                              type.name ||
                              "";
                            const code = type.crossMatchCode ? ` (${type.crossMatchCode})` : "";
                            return (
                              <option key={typeId} value={typeId}>
                                {typeName}{code}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div className="col-md-12">
                        <label className="form-label fw-bold">Overall Remarks</label>
                        <input
                          type="text"
                          className="form-control"
                          value={overallRemarks}
                          onChange={(e) => setOverallRemarks(e.target.value)}
                          placeholder="Optional overall remarks for cross-match"
                          disabled={!sampleCollected || isSaving}
                          style={
                            !sampleCollected
                              ? { backgroundColor: "#f8f9fa" }
                              : {}
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Allocated Units – Cross-Match Grid */}
                <div className="card shadow mb-4">
                  <div className="card-header py-3" style={{ backgroundColor: "#f8f9fa" }}>
                    <h6 className="mb-0 fw-bold">Allocated Units – Cross-Match Grid</h6>
                  </div>
                  <div className="card-body">
                    <div
                      className="table-wrapper"
                      style={{ overflowX: "auto", overflowY: "visible", maxWidth: "100%", position: "relative", zIndex: 1 }}
                    >
                      <table
                        className="table table-bordered table-hover align-middle"
                        style={{ minWidth: "1000px", position: "relative", zIndex: 1 }}
                      >
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: "150px" }}>Unit No</th>
                            <th style={{ width: "100px" }}>Blood Group</th>
                            <th style={{ width: "80px" }}>Volume</th>
                            <th style={{ width: "100px" }}>Expiry</th>
                            <th style={{ width: "150px" }}>
                              Cross-Match Result <span className="text-danger">*</span>
                            </th>
                            <th style={{ width: "120px" }}>
                              Test Date <span className="text-danger">*</span>
                            </th>
                            <th style={{ width: "200px" }}>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {crossMatchEntries.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center text-muted py-3">
                                No allocated units found for this request
                              </td>
                            </tr>
                          ) : (
                            crossMatchEntries.map((entry, index) => (
                              <tr key={index}>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={entry.unitNo}
                                    readOnly
                                    style={{ backgroundColor: "#f8f9fa" }}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={entry.bloodGroup}
                                    readOnly
                                    style={{ backgroundColor: "#f8f9fa" }}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={entry.volume}
                                    readOnly
                                    style={{ backgroundColor: "#f8f9fa" }}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={entry.expiry}
                                    readOnly
                                    style={{ backgroundColor: "#f8f9fa" }}
                                  />
                                </td>
                                <td>
                                  <select
                                    className="form-select form-select-sm"
                                    value={entry.crossMatchResult}
                                    onChange={(e) =>
                                      handleCrossMatchEntryChange(
                                        index,
                                        "crossMatchResult",
                                        e.target.value
                                      )
                                    }
                                    disabled={!sampleCollected || isSaving}
                                    style={
                                      !sampleCollected
                                        ? { backgroundColor: "#f8f9fa", cursor: "not-allowed" }
                                        : {}
                                    }
                                  >
                                    {CROSS_MATCH_RESULT_OPTIONS.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td>
                                  <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={entry.testDate}
                                    onChange={(e) =>
                                      handleCrossMatchEntryChange(
                                        index,
                                        "testDate",
                                        e.target.value
                                      )
                                    }
                                    disabled={!sampleCollected || isSaving}
                                    style={
                                      !sampleCollected
                                        ? { backgroundColor: "#f8f9fa", cursor: "not-allowed" }
                                        : {}
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={entry.remarks}
                                    onChange={(e) =>
                                      handleCrossMatchEntryChange(
                                        index,
                                        "remarks",
                                        e.target.value
                                      )
                                    }
                                    placeholder={sampleCollected ? "Optional" : "Sample collection required"}
                                    disabled={!sampleCollected || isSaving}
                                    style={
                                      !sampleCollected
                                        ? { backgroundColor: "#f8f9fa", cursor: "not-allowed" }
                                        : {}
                                    }
                                  />
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleSave}
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
                      "Save Cross-Match"
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleBackToList}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View (Pending for Cross Match)
  return (
    <div className="content-wrapper">
      <ConfirmationPopup
        show={confirmationPopup !== null}
        message={confirmationPopup?.message || ""}
        type={confirmationPopup?.type || "info"}
        onConfirm={confirmationPopup?.onConfirm || (() => { })}
        onCancel={confirmationPopup?.onCancel}
        confirmText={confirmationPopup?.confirmText || "OK"}
        cancelText={confirmationPopup?.cancelText}
      />

      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Pending for Cross Match</h4>
            </div>

            <div className="card-body">
              {/* Search Section */}
              <div className="card-body">
                <div className="row g-3 align-items-end">
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Patient Name</label>
                    <div className="dropdown-search-container">
                      <input
                        ref={patientInputRef}
                        type="text"
                        className="form-control"
                        name="patientName"
                        value={searchFilters.patientName}
                        autoComplete="off"
                        onChange={(e) => handlePatientNameSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            setShowPatientDropdown(false);
                            handleSearch();
                          }
                        }}
                        placeholder="Type patient name..."
                        disabled={isSaving || isSearching || isResetting || isTableLoading}
                      />

                      <PortalDropdown
                        anchorRef={patientInputRef}
                        show={showPatientDropdown}
                      >
                        {isPatientLoading && patientDropdown.length === 0 ? (
                          <div className="text-center p-3">
                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </div>
                        ) : patientDropdown.length > 0 ? (
                          patientDropdown.map((patient, idx) => (
                            <div
                              key={idx}
                              className="p-2"
                              onMouseDown={(e) => {
                                e.preventDefault()
                                handlePatientSelect(patient)
                              }}
                              style={{
                                cursor: "pointer",
                                borderBottom: "1px solid #f0f0f0",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor = "#f8f9fa")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor = "transparent")
                              }
                            >
                              <div className="fw-bold">{patient.patientName}</div>
                              <small className="text-muted">
                                {patient.inpatientNo} | {patient.bloodGroup} | {patient.ageGender}
                              </small>
                            </div>
                          ))
                        ) : (
                          <div className="p-2 text-muted text-center">No patients found</div>
                        )}
                      </PortalDropdown>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-bold">Ward</label>
                    <select
                      className="form-select"
                      name="wardId"
                      value={searchFilters.wardId}
                      onChange={handleSearchChange}
                      disabled={isSaving || isSearching || isResetting || isTableLoading}
                    >
                      <option value="">All Wards</option>
                      {allWardOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-4 gap-2 d-flex">
                    <button
                      type="button"
                      className="btn btn-primary d-inline-flex align-items-center justify-content-center"
                      onClick={handleSearch}
                      disabled={isSaving || isSearching || isResetting || isTableLoading}
                      style={{ minWidth: "110px" }}
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
                      className="btn btn-secondary d-inline-flex align-items-center justify-content-center"
                      onClick={handleReset}
                      disabled={isSaving || isSearching || isResetting || isTableLoading}
                      style={{ minWidth: "100px" }}
                    >
                      {isResetting ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          />
                          Resetting...
                        </>
                      ) : (
                        "Reset"
                      )}
                    </button>
                  </div>


                </div>
              </div>

              {/* Request List Table */}

              <div className="card-body">

                <table
                  className="table table-bordered table-hover align-middle"
                >
                  <thead >
                    <tr>
                      <th >Request No</th>
                      <th >Inpatient</th>
                      <th >Patient Name</th>
                      <th >Blood Group</th>
                      <th >Component</th>
                      <th >Units Req</th>
                      <th >Units Alloc</th>
                      <th >Allocated Unit(s)</th>
                      <th >Request Dept</th>
                      <th >Urgency</th>
                      <th >Requested On</th>
                      <th >Required By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isTableLoading ? (
                      <tr>
                        <td colSpan={12} className="text-center py-5">
                          <div className="d-flex flex-column align-items-center justify-content-center">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <span className="mt-2 text-muted fw-semibold">
                              Loading allocated blood requests...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : currentItems.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="text-center py-4">
                          <div className="text-muted">
                            <h6 className="mt-2">No pending cross-match requests found</h6>
                            <p className="mb-0">All requests have been processed</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((req, idx) => (
                        <tr
                          key={req.requestDtId || req.id || idx}
                          onClick={() => handleRowClick(req)}
                          style={{ cursor: "pointer" }}
                          className="table-row-hover"
                        >
                          <td className="fw-bold">{req.requestNo || ""}</td>
                          <td>{req.inpatient || req.inpatientNo || ""}</td>
                          <td>{req.patientName || ""}</td>
                          <td>{req.bloodGroup ? <span className="badge bg-danger">{req.bloodGroup}</span> : ""}</td>
                          <td>{req.component || ""}</td>
                          <td className="text-center fw-bold">{req.unitsReq ?? req.unitsRequired ?? ""}</td>
                          <td className="text-center fw-bold">{req.unitsAlloc ?? req.unitsAllocated ?? ""}</td>
                          <td>
                            {req.allocatedUnits && req.allocatedUnits.length > 0 ? (
                              req.allocatedUnits.map((u, uIdx) => (
                                <span key={uIdx} className="badge bg-light text-dark border me-1">
                                  {u.unitNo || u.unitNumber}
                                </span>
                              ))
                            ) : req.unitNumber ? (
                              <span className="badge bg-light text-dark border">{req.unitNumber}</span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>{req.requestDept || req.ward || ""}</td>
                          <td>{getUrgencyBadge(req.urgency)}</td>
                          <td>{formatDateTime(req.requestedOn)}</td>
                          <td className="fw-bold">{formatDateTime(req.requiredBy)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                {(isServerPaged ? totalItems : filteredRequests.length) > 0 && (
                  <div className="mt-3">
                    <Pagination
                      totalItems={isServerPaged ? totalItems : filteredRequests.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PendingForCrossMatch