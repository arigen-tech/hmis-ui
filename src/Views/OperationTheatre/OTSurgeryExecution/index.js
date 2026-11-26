import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, getActiveStorage } from "../../../service/apiService";
import { PATIENT_SURGERY_WORKLIST } from "../../../config/apiConfig";
import { formatDateForDisplay, formatDateTimeForDisplay } from "../../../utils/dateUtils";
import useSurgeryExecutionTabs from "./tabs/useSurgeryExecutionTabs";
import DrugTabOverlays from "./tabs/DrugTabOverlays";
import ConsumableTabOverlays from "./tabs/ConsumableTabOverlays";
import AnaesthesiaTab from "./tabs/AnaesthesiaTab";
import DrugsTab from "./tabs/DrugsTab";
import ConsumablesTab from "./tabs/ConsumablesTab";
import ImplantsTab from "./tabs/ImplantsTab";
import OperativeTab from "./tabs/OperativeTab";

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

  const executionTabs = useSurgeryExecutionTabs({
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
    });

    const {
      backToWorklist,
      complications,
      handleAddSpecimenRow,
      handleComplicationsChange,
      handleRemoveSpecimenRow,
      handleSaveTab,
      handleSignOutChange,
      handleSpecimenRowChange,
      isSelectedPatientAnesthesiaRequired,
      isSelectedPatientPacPending,
      openExecution,
      savingTab,
      signOut,
      specimenRows,
    } = executionTabs;

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
                      onClick={() => executionTabs.openExecution(item)}
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
      if (activeTab === "anaesthesia" && !executionTabs.isSelectedPatientAnesthesiaRequired) {
        return (
          <div className="alert alert-secondary py-3 text-center my-3">
            <i className="fa fa-info-circle me-2"></i>
            Anaesthesia details are not required for this surgery (Anesthesia Required: No).
          </div>
        );
      }
      switch (activeTab) {
        case "anaesthesia":
          return <AnaesthesiaTab {...executionTabs} YES_NO_OPTIONS={YES_NO_OPTIONS} />;
        case "drugs":
          return <DrugsTab {...executionTabs} />;
        case "consumables":
          return <ConsumablesTab {...executionTabs} />;
        case "implants":
          return <ImplantsTab {...executionTabs} />;
        case "operative":
          return <OperativeTab {...executionTabs} YES_NO_OPTIONS={YES_NO_OPTIONS} />;
        case "specimen": return renderSpecimenTab();
        case "complications": return renderComplicationsTab();
        case "signout": return renderSignOutTab();
        default: return null;
      }
    };

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

        <DrugTabOverlays {...executionTabs} />
        <ConsumableTabOverlays {...executionTabs} />

      </div>
    );
  };

  export default OTSurgeryExecution;