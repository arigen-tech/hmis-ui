import { useState, useEffect, useRef, useCallback } from "react";
import Popup from "../../../Components/popup";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, postRequest } from "../../../service/apiService";
import {
  GET_AVAILABLE_INVENTORY_UNITS,
  ALLOCATE_BLOOD_UNITS,
  MAS_BLOODGROUP,
  GET_PENDING_BLOOD_REQUESTS,
  MAS_WARD_GET_ALL_ACTIVE,
  MAS_DEPARTMENT_GET_ALL,
} from "../../../config/apiConfig";

const PendingBloodRequests = () => {
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentView, setCurrentView] = useState("list");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Unit selection state
  const [showUnitSelection, setShowUnitSelection] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search state
  const [searchFilters, setSearchFilters] = useState({
    patientName: "",
    wardId: ""
  });

  const [isTableLoading, setIsTableLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Data is loaded from the blood request tracking API.
  const [pendingRequests, setPendingRequests] = useState([]);

  // Available units loaded dynamically from backend
  const [availableUnits, setAvailableUnits] = useState([]);

  // Blood group ID to name mapping loaded from master
  const [bloodGroupMap, setBloodGroupMap] = useState({});

  // Component availability tracking: { [componentId]: { units: [], availableCount: 0, isAvailable: false, loaded: false, error: null } }
  const [componentAvailability, setComponentAvailability] = useState({});
  const [availabilityLoading, setAvailabilityLoading] = useState({});

  // Allocated components map: { [componentId]: [selectedUnits] }
  const [allocatedComponents, setAllocatedComponents] = useState({});

  // Component details when viewing a request
  const [componentDetails, setComponentDetails] = useState([]);

  // Wards / Departments options state
  const [wardOptions, setWardOptions] = useState([]);

  const [totalItems, setTotalItems] = useState(0);

  // Fetch blood group masters
  const fetchBloodGroups = async () => {
    try {
      const response = await getRequest(`${MAS_BLOODGROUP}/getAll/1`);
      const list = Array.isArray(response?.response) ? response.response : [];
      const map = {};
      list.forEach((bg) => {
        if (bg.bloodGroupId) {
          map[bg.bloodGroupId] = bg.bloodGroupName;
        }
      });
      setBloodGroupMap(map);
    } catch (err) {
      console.error("Error fetching blood groups:", err);
    }
  };

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
        pendingRequests
          .map((r) => r.ward || r.requestedWard)
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

  const fetchPendingRequests = useCallback(async (page = 0, filters = null) => {
    setIsTableLoading(true);
    try {
      const activeFilters = filters || searchFiltersRef.current;
      const params = new URLSearchParams({
        page: String(page),
        size: String(DEFAULT_ITEMS_PER_PAGE),
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
      const response = await getRequest(`${GET_PENDING_BLOOD_REQUESTS}?${params.toString()}`);
      const responsePage = response?.response;
      const requests = Array.isArray(responsePage?.content) ? responsePage.content : [];
      setPendingRequests(requests.map((request, index) => ({
        ...request,
        requestDtId:
          request.requestDtId ??
          request.bloodRequestDtId ??
          request.requestDetailId ??
          request.bloodRequestDetailId ??
          request.bloodRequirementDetailId ??
          request.dtId ??
          (typeof request.id === "number" ? request.id : null),
        id: `${request.inpatientId || "req"}-${request.componentId || request.component || "comp"}-${request.requestedDateTime || index}-${index}`,
        requestId: request.requestNo || "",
        patientId: request.patientId,
        inpatientId: request.inpatientId,
        patientName: request.patientName || "",
        ipNo: request.inpatientNo || "",
        ward: request.requestedWard || request.ward || request.wardName || "",
        doctor: request.requestedBy || "",
        requestDate: request.requestedDateTime,
        componentType: request.component || "",
        componentId: request.componentId,
        bloodGroup: request.bloodGroup || "",
        bloodGroupId: request.bloodGroupId,
        units: request.units,
        urgency: request.urgency,
        requiredDateTime: request.requiredByDateTime,
        indication: request.indication || "",
        status: request.trackingStatus || "",
        headerInfo: {
          requestNo: request.requestNo || "",
          patientName: request.patientName || "",
          ipNo: request.inpatientNo || "",
          ageGender: request.ageGender || "",
          bloodGroup: request.bloodGroup || "",
          bloodGroupId: request.bloodGroupId,
          ward: request.requestedWard || request.ward || request.wardName || "",
          treatingDoctor: request.requestedBy || "",
          requestDate: request.requestedDateTime,
          urgency: request.urgency,
        },
        rawRequest: request,
      })));
      setTotalItems(responsePage?.totalElements || 0);
    } catch (error) {
      console.error("Error fetching pending blood requests:", error);
      setPendingRequests([]);
      setTotalItems(0);
      showPopup(error?.message || "Pending blood requests could not be loaded.", "error");
    } finally {
      setIsTableLoading(false);
      setIsSearching(false);
      setIsResetting(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingRequests(0);
    fetchBloodGroups();
  }, [fetchPendingRequests]);

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      }
    });
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReset = async (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    setIsResetting(true);
    const cleared = {
      patientName: "",
      wardId: ""
    };
    setSearchFilters(cleared);
    setCurrentPage(1);
    await fetchPendingRequests(0, cleared);
  };



  // Check inventory unit availability for each component of the request
  const fetchAvailabilityForComponents = async (components, req) => {
    const pBloodGroupId = req.bloodGroupId || req.headerInfo?.bloodGroupId;

    const initialLoading = {};
    components.forEach((c) => {
      initialLoading[c.id] = true;
    });
    setAvailabilityLoading((prev) => ({ ...prev, ...initialLoading }));

    await Promise.all(
      components.map(async (comp) => {
        const effectiveBloodGroupId = comp.bloodGroupId || pBloodGroupId;
        const effectiveComponentId = comp.componentId;

        if (!effectiveBloodGroupId || !effectiveComponentId) {
          setAvailabilityLoading((prev) => ({ ...prev, [comp.id]: false }));
          setComponentAvailability((prev) => ({
            ...prev,
            [comp.id]: {
              units: [],
              availableCount: 0,
              isAvailable: false,
              loaded: true,
              error: "Missing Blood Group ID or Component ID",
            },
          }));
          return;
        }

        try {
          const res = await getRequest(
            `${GET_AVAILABLE_INVENTORY_UNITS}?patientBloodGroupId=${effectiveBloodGroupId}&componentId=${effectiveComponentId}`
          );
          const units = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.response)
              ? res.response
              : [];

          setComponentAvailability((prev) => ({
            ...prev,
            [comp.id]: {
              units,
              availableCount: units.length,
              isAvailable: units.length > 0,
              loaded: true,
              error: null,
            },
          }));
        } catch (error) {
          console.error(`Error checking availability for component ${comp.componentType}:`, error);
          setComponentAvailability((prev) => ({
            ...prev,
            [comp.id]: {
              units: [],
              availableCount: 0,
              isAvailable: false,
              loaded: true,
              error: error?.message || "Failed to check inventory",
            },
          }));
        } finally {
          setAvailabilityLoading((prev) => ({ ...prev, [comp.id]: false }));
        }
      })
    );
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchPendingRequests(0, searchFilters.patientName);
  };

  const handleRowClick = (request) => {
    setSelectedRequest(request);
    setAllocatedComponents({});
    const components = request.requestId
      ? pendingRequests.filter((req) => req.requestId === request.requestId)
      : [request];
    setComponentDetails(components);
    setCurrentView("detail");
    fetchAvailabilityForComponents(components, request);
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedRequest(null);
    setComponentDetails([]);
    setAllocatedComponents({});
    setShowUnitSelection(false);
    setSelectedComponent(null);
    setSelectedUnits([]);
  };

  const handleAllocateUnits = async (component) => {
    setSelectedComponent(component);
    // Pre-populate if this component was already allocated
    const previouslyAllocated = allocatedComponents[component.id] || [];
    setSelectedUnits(previouslyAllocated);
    setShowUnitSelection(true);

    const cached = componentAvailability[component.id];
    if (cached && cached.loaded && Array.isArray(cached.units)) {
      setAvailableUnits(cached.units);
    } else {
      const pBloodGroupId = component.bloodGroupId || selectedRequest?.bloodGroupId || selectedRequest?.headerInfo?.bloodGroupId;
      const compId = component.componentId;
      if (pBloodGroupId && compId) {
        setModalLoading(true);
        try {
          const res = await getRequest(
            `${GET_AVAILABLE_INVENTORY_UNITS}?patientBloodGroupId=${pBloodGroupId}&componentId=${compId}`
          );
          const units = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.response)
              ? res.response
              : [];
          setAvailableUnits(units);
          setComponentAvailability((prev) => ({
            ...prev,
            [component.id]: {
              units,
              availableCount: units.length,
              isAvailable: units.length > 0,
              loaded: true,
              error: null,
            },
          }));
        } catch (err) {
          console.error("Error fetching units in modal:", err);
          setAvailableUnits([]);
        } finally {
          setModalLoading(false);
        }
      }
    }
  };

  const handleUnitSelection = (unit) => {
    const unitKey = unit.inventoryId || unit.id;
    setSelectedUnits(prev => {
      const isSelected = prev.some(u => (u.inventoryId || u.id) === unitKey);
      if (isSelected) {
        return prev.filter(u => (u.inventoryId || u.id) !== unitKey);
      } else {
        if (prev.length < selectedComponent.units) {
          return [...prev, unit];
        } else {
          showPopup(`You can only select up to ${selectedComponent.units} units for this component`, "warning");
          return prev;
        }
      }
    });
  };

  const handleConfirmAllocation = () => {
    if (selectedUnits.length === 0) {
      showPopup("Please select at least one unit", "warning");
      return;
    }
    if (selectedUnits.length > selectedComponent.units) {
      showPopup(`Cannot select more than ${selectedComponent.units} units`, "warning");
      return;
    }

    setAllocatedComponents(prev => ({
      ...prev,
      [selectedComponent.id]: selectedUnits
    }));

    showPopup(`${selectedUnits.length} unit(s) allocated successfully for ${selectedComponent.componentType}!`, "success");
    setShowUnitSelection(false);
  };

  const totalAllocatedUnits = Object.values(allocatedComponents).reduce(
    (sum, units) => sum + (units?.length || 0),
    0
  );

  const handleRemoveAllocatedUnit = (componentId, unitKey) => {
    setAllocatedComponents(prev => {
      const current = prev[componentId] || [];
      const updated = current.filter(u => (u.inventoryId || u.id) !== unitKey);
      return {
        ...prev,
        [componentId]: updated
      };
    });
  };

  const handleSubmitAllocation = async () => {
    if (totalAllocatedUnits === 0) {
      showPopup("Please allocate units for at least one component before submitting", "warning");
      return;
    }

    const details = componentDetails
      .filter((comp) => (allocatedComponents[comp.id] || []).length > 0)
      .map((comp) => {
        const rawDtId =
          comp.requestDtId ??
          comp.bloodRequestDtId ??
          comp.requestDetailId ??
          comp.bloodRequestDetailId ??
          comp.bloodRequirementDetailId ??
          comp.dtId ??
          comp.rawRequest?.requestDtId ??
          comp.rawRequest?.bloodRequestDtId ??
          comp.rawRequest?.requestDetailId ??
          comp.rawRequest?.bloodRequestDetailId ??
          comp.rawRequest?.bloodRequirementDetailId ??
          comp.rawRequest?.dtId ??
          (typeof comp.rawRequest?.id === "number" ? comp.rawRequest.id : null) ??
          (typeof comp.id === "number" ? comp.id : null);

        const requestDtId = rawDtId != null && rawDtId !== "" ? Number(rawDtId) : null;
        const inventoryIds = (allocatedComponents[comp.id] || [])
          .map((u) => Number(u.inventoryId ?? u.id))
          .filter((id) => id != null && !Number.isNaN(id));

        return {
          requestDtId,
          inventoryIds,
          componentType: comp.componentType,
        };
      });

    if (details.length === 0) {
      showPopup("Please allocate units for at least one component before submitting", "warning");
      return;
    }

    const missingDt = details.find((d) => !d.requestDtId);
    if (missingDt) {
      showPopup(
        `Request Detail ID (requestDtId) is missing for ${missingDt.componentType || "one of the components"}.`,
        "error"
      );
      return;
    }

    const payload = {
      details: details.map((d) => ({
        requestDtId: d.requestDtId,
        inventoryIds: d.inventoryIds,
      })),
    };

    setIsSubmitting(true);
    try {
      const response = await postRequest(ALLOCATE_BLOOD_UNITS, payload);
      showPopup(
        response?.message || `Allocation submitted successfully for ${totalAllocatedUnits} unit(s)!`,
        "success"
      );

      setTimeout(() => {
        handleBackToList();
        fetchPendingRequests(currentPage - 1, searchFilters.patientName);
      }, 1200);
    } catch (error) {
      console.error("Error submitting allocation:", error);
      showPopup(
        error?.response?.data?.message || error?.message || "Failed to submit allocation details",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const [year, month, day] = dateStr.slice(0, 10).split("-");
      return `${day}/${month}/${year}`;
    }
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    const pad = (number) => String(number).padStart(2, "0");
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    const pad = (number) => String(number).padStart(2, "0");
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const getUrgencyBadge = (urgency) => {
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



  const getCompatibilityBadge = (compatibility) => {
    if (compatibility === "Compatible") {
      return <span className="badge bg-success">Compatible</span>;
    } else if (compatibility === "Cross-match pending") {
      return <span className="badge bg-warning text-dark">Cross-match pending</span>;
    } else {
      return <span className="badge bg-danger">Incompatible</span>;
    }
  };



  // Detail View (Review Screen) with Unit Selection
  if (currentView === "detail" && selectedRequest) {
    return (
      <div className="content-wrapper">
        {popupMessage && (
          <Popup
            message={popupMessage.message}
            type={popupMessage.type}
            onClose={popupMessage.onClose}
          />
        )}

        {/* Unit Selection Modal - Fixed positioning from GeneralMedicineWaitingList */}
        {showUnitSelection && selectedComponent && (
          <div
            className="modal fade show"
            style={{
              display: "block",
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 9999,
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
            tabIndex="-1"
            onClick={() => {
              setShowUnitSelection(false);
              setSelectedUnits([]);
            }}
          >
            <div
              className="modal-dialog modal-xl"
              style={{
                width: "calc(100vw - 310px)",
                left: "285px",
                maxWidth: "none",
                height: "90vh",
                margin: "5vh auto",
                position: "fixed",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    Allocate Units for {selectedComponent.componentType}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowUnitSelection(false);
                      setSelectedUnits([]);
                    }}
                  ></button>
                </div>
                <div
                  className="modal-body"
                  style={{ overflowY: "auto", flex: "1 1 auto", maxHeight: "calc(90vh - 120px)" }}
                >
                  <div className="row mb-3">
                    <div className="col-md-12">
                      <div className="card bg-light">
                        <div className="card-body">
                          <div className="row">
                            <div className="col-md-3">
                              <strong>Patient:</strong> {selectedRequest.patientName}
                            </div>
                            <div className="col-md-3">
                              <strong>Blood Group:</strong> <span className="badge bg-danger">{selectedRequest.headerInfo.bloodGroup}</span>
                            </div>
                            <div className="col-md-3">
                              <strong>Component:</strong> {selectedComponent.componentType}
                            </div>
                            <div className="col-md-3">
                              <strong>Units Required:</strong> {selectedComponent.units}
                            </div>
                          </div>
                          <div className="row mt-2">
                            <div className="col-md-12">
                              <strong>Selected Units:</strong> {selectedUnits.length} / {selectedComponent.units}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "50px" }} className="text-center">Select</th>
                          <th>Unit No</th>
                          <th>Blood Group</th>
                          <th>Volume (ml)</th>
                          <th>Expiry Date</th>
                          <th>Compatibility</th>
                          {/* <th>Status</th> */}
                          <th>Preference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalLoading ? (
                          <tr>
                            <td colSpan={8} className="text-center py-4">
                              <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                              <span className="text-muted">Fetching available units from inventory...</span>
                            </td>
                          </tr>
                        ) : availableUnits.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center py-4 text-muted">
                              <i className="fa fa-info-circle me-2"></i>
                              No available units found for {selectedComponent.componentType}.
                            </td>
                          </tr>
                        ) : (
                          availableUnits.map((unit) => {
                            const unitKey = unit.inventoryId || unit.id;
                            const isSelected = selectedUnits.some((u) => (u.inventoryId || u.id) === unitKey);
                            const bgName =
                              bloodGroupMap[unit.bloodGroupId] ||
                              (unit.bloodGroupId === selectedRequest?.bloodGroupId
                                ? selectedRequest?.headerInfo?.bloodGroup
                                : unit.bloodGroup || `Group #${unit.bloodGroupId}`);
                            const isAvailable = (unit.status || "").toLowerCase() === "available";

                            return (
                              <tr key={unitKey} className={isSelected ? "table-success" : ""}>
                                <td className="text-center">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={isSelected}
                                    onChange={() => handleUnitSelection(unit)}
                                    disabled={
                                      !isAvailable ||
                                      (!isSelected && selectedUnits.length >= selectedComponent.units)
                                    }
                                  />
                                </td>
                                <td className="fw-bold">{unit.unitNo}</td>
                                <td>
                                  <span className="badge bg-danger">{bgName}</span>
                                </td>
                                <td>{unit.volumeMl ?? unit.volume ?? "N/A"}</td>
                                <td>{formatDate(unit.expiryDate)}</td>
                                <td>{getCompatibilityBadge(unit.compatibility)}</td>
                                {/* <td>{getStatusBadge(unit.status)}</td> */}
                                <td>
                                  {unit.preferred ? (
                                    <span className="badge bg-success">
                                      <i className="fa fa-star me-1"></i>Preferred Match
                                    </span>
                                  ) : (
                                    <span className="badge bg-secondary">Compatible</span>
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
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowUnitSelection(false);
                      setSelectedUnits([]);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleConfirmAllocation}
                    disabled={selectedUnits.length === 0 || selectedUnits.length > selectedComponent.units}
                  >
                    Allocate Selected Units ({selectedUnits.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              {/* Header Section */}
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">
                  Blood Request Review
                </h4>
                <button type="button" className="btn btn-secondary" onClick={handleBackToList}>
                  Back to List
                </button>
              </div>

              <div className="card-body">
                {/* HEADER SECTION - Read-only as requested */}
                <div className="card shadow mb-4">
                  <div className="card-header py-3 border-bottom-1" style={{ backgroundColor: "#f8f9fa" }}>
                    <h6 className="mb-0 fw-bold">
                      Request Details
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      {/* Request No */}
                      <div className="col-md-4">
                        <label className="form-label  mb-1">Request No</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedRequest.headerInfo.requestNo}
                          readOnly
                          style={{ backgroundColor: "#e9ecef", fontWeight: "500" }}
                        />
                      </div>

                      {/* Patient Details (combined) */}
                      <div className="col-md-4">
                        <label className="form-label  mb-1">Patient Details</label>
                        <input
                          type="text"
                          className="form-control"
                          value={`${selectedRequest.headerInfo.patientName} | ${selectedRequest.headerInfo.ageGender} | ${selectedRequest.headerInfo.ipNo}`}
                          readOnly
                          style={{ backgroundColor: "#e9ecef", fontWeight: "500" }}
                        />
                      </div>

                      {/* Blood Group */}
                      <div className="col-md-4">
                        <label className="form-label  mb-1">Blood Group</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedRequest.headerInfo.bloodGroup}
                          readOnly
                          style={{
                            backgroundColor: "#e9ecef",
                            fontWeight: "bold",
                            color: "#dc3545"
                          }}
                        />
                      </div>

                      {/* Ward */}
                      <div className="col-md-4">
                        <label className="form-label mb-1">Ward</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedRequest.headerInfo.ward}
                          readOnly
                          style={{ backgroundColor: "#e9ecef", fontWeight: "500" }}
                        />
                      </div>

                      {/* Urgency */}
                      <div className="col-md-4">
                        <label className="form-label  mb-1">Urgency</label>
                        <div>
                          {getUrgencyBadge(selectedRequest.headerInfo.urgency)}
                        </div>
                      </div>

                      {/* Requested Date */}
                      <div className="col-md-4">
                        <label className="form-label  mb-1">Requested Date</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formatDateTime(selectedRequest.headerInfo.requestDate)}
                          readOnly
                          style={{ backgroundColor: "#e9ecef", fontWeight: "500" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* COMPONENT SECTION - From details table */}
                <div className="card shadow mb-4">
                  <div className="card-header py-3 border-bottom-1" style={{ backgroundColor: "#f8f9fa" }}>
                    <h6 className="mb-0 fw-bold">
                      Component Requests
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-bordered table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Component</th>
                            <th className="text-center">Units Required</th>
                            <th>Required By</th>
                            <th>Stock Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {componentDetails.map((component) => {
                            const avail = componentAvailability[component.id];
                            const isLoading = availabilityLoading[component.id];
                            const allocated = allocatedComponents[component.id];

                            return (
                              <tr key={component.id}>
                                <td className="fw-bold">{component.componentType}</td>
                                <td className="text-center fw-bold">{component.units}</td>
                                <td>{formatDateTime(component.requiredDateTime)}</td>
                                <td>
                                  {isLoading ? (
                                    <span className="badge bg-light text-secondary">
                                      <span
                                        className="spinner-border spinner-border-sm me-1"
                                        role="status"
                                        aria-hidden="true"
                                      ></span>
                                      Checking Stock...
                                    </span>
                                  ) : allocated && allocated.length > 0 ? (
                                    <span className="badge bg-success">
                                      <i className="fa fa-check me-1"></i>
                                      {allocated.length} / {component.units} Unit(s) Allocated
                                    </span>
                                  ) : avail?.isAvailable ? (
                                    <span className="badge bg-success">
                                      {avail.availableCount} Unit(s) Available
                                    </span>
                                  ) : avail?.loaded ? (
                                    <span className="badge bg-danger">
                                      Out of Stock (0 Available)
                                    </span>
                                  ) : (
                                    <span className="badge bg-secondary">Pending Check</span>
                                  )}
                                </td>
                                <td>
                                  {isLoading ? (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-secondary"
                                      disabled
                                    >
                                      Checking...
                                    </button>
                                  ) : allocated && allocated.length > 0 ? (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-success"
                                      onClick={() => handleAllocateUnits(component)}
                                    >
                                      Edit Allocation ({allocated.length})
                                    </button>
                                  ) : avail?.isAvailable ? (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-info text-white"
                                      onClick={() => handleAllocateUnits(component)}
                                    >
                                      Allocate Units
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-secondary"
                                      disabled
                                      title="No units available in inventory"
                                    >
                                      Not Available
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* ALLOCATED UNITS SUMMARY SECTION - Displayed when units have been allocated */}
                {totalAllocatedUnits > 0 && (
                  <div className="card shadow mb-4 border-start border-success border-4">
                    <div
                      className="card-header py-3 d-flex justify-content-between align-items-center"
                      style={{ backgroundColor: "#f8f9fa" }}
                    >
                      <h6 className="mb-0 fw-bold">
                        Allocated Units Summary ({totalAllocatedUnits} Unit
                        {totalAllocatedUnits > 1 ? "s" : ""} Selected)
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="table-responsive">
                        <table className="table table-bordered table-hover align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>Component</th>
                              <th>Unit No</th>
                              <th>Blood Group</th>
                              <th>Volume (ml)</th>
                              <th>Expiry Date</th>
                              <th>Compatibility</th>
                              <th>Preference</th>
                              <th className="text-center" style={{ width: "80px" }}>
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {componentDetails.map((component) => {
                              const units = allocatedComponents[component.id] || [];
                              return units.map((unit) => {
                                const unitKey = unit.inventoryId || unit.id;
                                const bgName =
                                  bloodGroupMap[unit.bloodGroupId] ||
                                  (unit.bloodGroupId === selectedRequest?.bloodGroupId
                                    ? selectedRequest?.headerInfo?.bloodGroup
                                    : unit.bloodGroup || `Group #${unit.bloodGroupId}`);

                                return (
                                  <tr key={`${component.id}-${unitKey}`}>
                                    <td className="fw-bold">{component.componentType}</td>
                                    <td className="fw-bold">{unit.unitNo}</td>
                                    <td>
                                      <span className="badge bg-danger">{bgName}</span>
                                    </td>
                                    <td>{unit.volumeMl ?? unit.volume ?? "N/A"}</td>
                                    <td>{formatDate(unit.expiryDate)}</td>
                                    <td>{getCompatibilityBadge(unit.compatibility)}</td>
                                    <td>
                                      {unit.preferred ? (
                                        <span className="badge bg-success">
                                          <i className="fa fa-star me-1"></i>Preferred Match
                                        </span>
                                      ) : (
                                        <span className="badge bg-secondary">Compatible</span>
                                      )}
                                    </td>
                                    <td className="text-center">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                        title="Remove unit from allocation"
                                        onClick={() =>
                                          handleRemoveAllocatedUnit(component.id, unitKey)
                                        }
                                      >
                                        Remove
                                      </button>
                                    </td>
                                  </tr>
                                );
                              });
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* ACTION BUTTONS BAR */}
                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <button
                    type="button"
                    className="btn btn-secondary px-4"
                    onClick={handleBackToList}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary px-4"
                    onClick={handleSubmitAllocation}
                    disabled={isSubmitting || totalAllocatedUnits === 0}
                  >
                    {isSubmitting ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Allocation{" "}
                        {totalAllocatedUnits > 0 ? `(${totalAllocatedUnits})` : ""}
                      </>
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

  // List View (Pending Blood Requests)
  return (
    <div className="content-wrapper">
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
              <h4 className="card-title p-2 mb-0">
                PENDING BLOOD REQUESTS
              </h4>

            </div>

            <div className="card-body">
              {/* Search Section */}
              <div className="row mb-4">
                <div className="col-md-12">
                  <div className="card-body">
                    <div className="row g-3 align-items-end">
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Patient Name</label>
                        <input
                          type="text"
                          className="form-control"
                          name="patientName"
                          placeholder="Enter patient name"
                          value={searchFilters.patientName}
                          onChange={handleSearchChange}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSearch(e);
                            }
                          }}
                          disabled={isSearching || isResetting || isTableLoading}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Ward</label>
                        <select
                          className="form-select"
                          name="wardId"
                          value={searchFilters.wardId}
                          onChange={handleSearchChange}
                          disabled={isSearching || isResetting || isTableLoading}
                        >
                          <option value="">All Wards</option>
                          {allWardOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>{opt.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4 d-flex align-items-end gap-2">
                        <button
                          type="button"
                          className="btn btn-primary d-inline-flex align-items-center justify-content-center"
                          onClick={handleSearch}
                          disabled={isSearching || isResetting || isTableLoading}
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
                          disabled={isSearching || isResetting || isTableLoading}
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
                </div>
              </div>

              {/* Pending Requests Table */}
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead style={{ backgroundColor: "#95a5a6", color: "white" }}>
                    <tr>
                      <th>Request No</th>
                      <th>Inpatient No</th>
                      <th>Patient Name</th>
                      <th>Blood Group</th>
                      <th>Component</th>
                      <th>Units</th>
                      <th>Ward</th>
                      <th>Urgency</th>
                      <th>Requested Date & Time</th>
                      <th>Requested By (Due Date/Time)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isTableLoading ? (
                      <tr>
                        <td colSpan={11} className="text-center py-5">
                          <div className="d-flex flex-column align-items-center justify-content-center">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <span className="mt-2 text-muted fw-semibold">
                              Loading pending blood requests...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : pendingRequests.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="text-center py-4">
                          <div className="text-muted">
                            <h6 className="mt-2">No pending blood requests found</h6>
                            <p className="mb-0">All requests have been processed</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pendingRequests.map((request) => (
                        <tr
                          key={request.id}
                          onClick={() => handleRowClick(request)}
                          style={{ cursor: "pointer" }}
                          className="table-row-hover"
                        >
                          <td>
                            <span className="fw-bold">{request.requestId}</span>
                          </td>
                          <td>{request.ipNo}</td>
                          <td>{request.patientName}</td>
                          <td>{request.headerInfo.bloodGroup}</td>
                          <td>{request.componentType}</td>
                          <td className="text-center fw-bold">{request.units}</td>
                          <td>{request.ward}</td>
                          <td>{getUrgencyBadge(request.urgency)}</td>
                          <td>{formatDateTime(request.requestDate)}</td>
                          <td>{formatDateTime(request.requiredDateTime)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalItems > 0 && (
                <Pagination
                  totalItems={totalItems}
                  itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                  currentPage={currentPage}
                  onPageChange={(page) => {
                    setCurrentPage(page);
                    fetchPendingRequests(page - 1, searchFilters);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingBloodRequests;
