import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

// ----- Static option lists -----
const ANAESTHESIA_TYPE_OPTIONS = ["General Anaesthesia", "Spinal Anaesthesia", "Epidural Anaesthesia", "Regional Anaesthesia"];
const ASA_GRADE_OPTIONS = ["I", "II", "III", "IV", "V"];
const DRUG_UNIT_OPTIONS = ["Amp", "Vial", "Bottle", "Tablet", "mg", "ml"];
const CONSUMABLE_UNIT_OPTIONS = ["Nos", "Pair", "Set", "Box"];
const YES_NO_OPTIONS = ["Yes", "No"];

// Current logged-in user for auto-filled fields (dummy - no auth wiring)
const CURRENT_USER = "Nurse Priya";

const TABS = [
  { key: "anaesthesia", label: "Anaesthesia" },
  { key: "drugs", label: "Drugs" },
  { key: "consumables", label: "Consumables" },
  { key: "implants", label: "Implants" },
  { key: "operative", label: "Operative Details" },
  { key: "specimen", label: "Specimen" },
  { key: "complications", label: "Complications" },
  { key: "signout", label: "Sign-Out" },
];

const OTSurgeryExecution = () => {
  // ==================== WORKLIST STATE ====================
  const [worklistData, setWorklistData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // "worklist" | "execution"
  const [view, setView] = useState("worklist");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeTab, setActiveTab] = useState("anaesthesia");

  // ----- Dummy worklist data (patients ready for surgery post Pre-Op Checklist) -----
  const dummyWorklist = [
    {
      id: 1,
      uhidOrIp: "IPD/26/00125",
      patientName: "Rajesh Kumar",
      ageGender: "58 / Male",
      department: "Orthopaedics",
      surgery: "Total Knee Replacement - Right",
      surgeon: "Dr. Sharma",
      ot: "OT-01",
      scheduledTime: "20-Aug-2026 10:00 AM",
      pac: "Cleared",
      preOpChecklist: "Completed",
      status: "Ready",
    },
    {
      id: 2,
      uhidOrIp: "IPD/26/00131",
      patientName: "Sunita Devi",
      ageGender: "46 / Female",
      department: "Gynaecology",
      surgery: "Total Abdominal Hysterectomy",
      surgeon: "Dr. Verma",
      ot: "OT-02",
      scheduledTime: "20-Aug-2026 11:00 AM",
      pac: "Cleared",
      preOpChecklist: "Completed",
      status: "Ready",
    },
    {
      id: 3,
      uhidOrIp: "IPD/26/00138",
      patientName: "Amit Kumar",
      ageGender: "45 / Male",
      department: "General Surgery",
      surgery: "Inguinal Hernia Repair - Left",
      surgeon: "Dr. Gupta",
      ot: "OT-03",
      scheduledTime: "20-Aug-2026 12:30 PM",
      pac: "Cleared",
      preOpChecklist: "Completed",
      status: "In Progress",
    },
  ];

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setWorklistData(dummyWorklist);
      setLoading(false);
    }, 300);
  }, []);

  const filteredWorklist = worklistData.filter(
    (item) =>
      item.uhidOrIp.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.surgery.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.surgeon.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredWorklist.slice(indexOfFirstItem, indexOfLastItem);
  const handlePageChange = (page) => setCurrentPage(page);

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
    anaesthesiaType: "Spinal Anaesthesia",
    anaesthetist: "Dr. Kumar",
    assistantAnaesthetist: "Dr. Verma",
    anaesthesiaStart: "2026-08-20T09:55",
    anaesthesiaEnd: "",
    airwayManagement: "",
    asaGrade: "II",
    preInductionBP: "130/80",
    preInductionPulse: "78",
    preInductionSpO2: "99",
    anaesthesiaNotes: "",
    complication: "No",
    complicationDetails: "",
  });

  const handleAnaesthesiaChange = (field, value) => {
    setAnaesthesia((prev) => ({ ...prev, [field]: value }));
  };

  // ----- Drugs Used -----
  const [drugRows, setDrugRows] = useState([
    { id: 1, drugName: "Inj. Propofol", qty: "2", unit: "Amp", batchNo: "BAT123", usedBy: "Dr. Kumar" },
    { id: 2, drugName: "Inj. Cefuroxime", qty: "1", unit: "Vial", batchNo: "BAT456", usedBy: "Dr. Kumar" },
    { id: 3, drugName: "Inj. Ondansetron", qty: "1", unit: "Amp", batchNo: "BAT789", usedBy: "Dr. Kumar" },
    { id: 4, drugName: "Normal Saline", qty: "2", unit: "Bottle", batchNo: "BAT321", usedBy: "Nurse Priya" },
  ]);

  const handleAddDrugRow = () => {
    setDrugRows((prev) => [
      ...prev,
      { id: prev.length ? Math.max(...prev.map((r) => r.id)) + 1 : 1, drugName: "", qty: "", unit: "", batchNo: "", usedBy: "" },
    ]);
  };

  const handleRemoveDrugRow = (id) => {
    setDrugRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };

  const handleDrugRowChange = (id, field, value) => {
    setDrugRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  // ----- Medical Consumables Used -----
  // Planned qty comes from the surgery template (read-only here); Used is
  // what the OT user enters/confirms - inventory is deducted from Used, not Planned.
  const [consumableRows, setConsumableRows] = useState([
    { id: 1, item: "Surgical Gloves", planned: "6", used: "8", unit: "Pair", batch: "-" },
    { id: 2, item: "Syringe 10 ml", planned: "4", used: "5", unit: "Nos", batch: "-" },
    { id: 3, item: "IV Cannula 18G", planned: "1", used: "1", unit: "Nos", batch: "BAT101" },
    { id: 4, item: "Surgical Blade No. 22", planned: "1", used: "1", unit: "Nos", batch: "BAT102" },
    { id: 5, item: "Vicryl 2-0", planned: "2", used: "3", unit: "Nos", batch: "BAT103" },
    { id: 6, item: "Gauze Swab", planned: "20", used: "22", unit: "Nos", batch: "BAT104" },
    { id: 7, item: "Dressing Pad", planned: "2", used: "2", unit: "Nos", batch: "BAT105" },
  ]);

  const handleAddConsumableRow = () => {
    setConsumableRows((prev) => [
      ...prev,
      { id: prev.length ? Math.max(...prev.map((r) => r.id)) + 1 : 1, item: "", planned: "0", used: "", unit: "", batch: "" },
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
    { id: 1, implantName: "Total Knee Prosthesis - Femoral Component", sizeSpec: "Size 4", qty: "1", batchLotNo: "IMP-2201", usedBy: "Dr. Sharma" },
    { id: 2, implantName: "Total Knee Prosthesis - Tibial Component", sizeSpec: "Size 3", qty: "1", batchLotNo: "IMP-2202", usedBy: "Dr. Sharma" },
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

  const handleOperativeChange = (field, value) => {
    setOperativeDetails((prev) => ({ ...prev, [field]: value }));
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
    instrumentCountConfirmed: "Yes",
    spongeCountConfirmed: "Yes",
    specimenLabeled: "Yes",
    equipmentIssues: "No",
    equipmentIssuesNotes: "",
    keyConcernsForRecovery: "",
  });

  const handleSignOutChange = (field, value) => {
    setSignOut((prev) => ({ ...prev, [field]: value }));
  };

  // ==================== VIEW SWITCHING ====================

  const openExecution = (patient) => {
    setSelectedPatient(patient);
    setActiveTab("anaesthesia");
    // Pre-fill primary and assistant surgeon from patient data
    setOperativeDetails(prev => ({
      ...prev,
      primarySurgeon: patient.surgeon,
      assistantSurgeon: "Dr. (Asst)", // default assistant placeholder
    }));
    setView("execution");
  };

  const backToWorklist = () => {
    setView("worklist");
    setSelectedPatient(null);
  };

  const handleSaveTab = (tabLabel) => {
    showPopup(`${tabLabel} saved successfully!`, "success");
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
                placeholder="UHID/IP No., Patient, Surgery or Surgeon"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => openExecution(item)}
                    style={{ cursor: "pointer" }}
                    title="Click to open OT Surgery Execution"
                  >
                    <td>{item.uhidOrIp}</td>
                    <td>{item.patientName}</td>
                    <td>{item.ageGender}</td>
                    <td>{item.department}</td>
                    <td>{item.surgery}</td>
                    <td>{item.surgeon}</td>
                    <td>
                      {item.ot}
                    </td>
                    <td>{item.scheduledTime}</td>
                    <td>
                      {item.pac}
                    </td>
                    <td>
                      {item.preOpChecklist}
                    </td>
                    <td>
                      <span className={`badge ${item.status === "Ready" ? "bg-success" : "bg-warning text-dark"}`}>
                        {item.status}
                      </span>
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
          totalItems={filteredWorklist.length}
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
      <h6 className="fw-bold text-primary mb-3">Anaesthesia Details</h6>
      <div className="row">
        <div className="col-md-4 mb-3">
          <label className="form-label fw-bold">
            Anaesthesia Type <span className="text-danger">*</span>
          </label>
          <select
            className="form-select"
            value={anaesthesia.anaesthesiaType}
            onChange={(e) => handleAnaesthesiaChange("anaesthesiaType", e.target.value)}
          >
            {ANAESTHESIA_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label fw-bold">Anaesthetist</label>
          <input
            type="text"
            className="form-control"
            value={anaesthesia.anaesthetist}
            onChange={(e) => handleAnaesthesiaChange("anaesthetist", e.target.value)}
          />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label fw-bold">Assistant Anaesthetist</label>
          <input
            type="text"
            className="form-control"
            value={anaesthesia.assistantAnaesthetist}
            onChange={(e) => handleAnaesthesiaChange("assistantAnaesthetist", e.target.value)}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label fw-bold">
            Anaesthesia Start <span className="text-danger">*</span>
          </label>
          <input
            type="datetime-local"
            className="form-control"
            value={anaesthesia.anaesthesiaStart}
            onChange={(e) => handleAnaesthesiaChange("anaesthesiaStart", e.target.value)}
          />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label fw-bold">Anaesthesia End</label>
          <input
            type="datetime-local"
            className="form-control"
            value={anaesthesia.anaesthesiaEnd}
            onChange={(e) => handleAnaesthesiaChange("anaesthesiaEnd", e.target.value)}
          />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label fw-bold">Airway Management</label>
          <input
            type="text"
            className="form-control"
            value={anaesthesia.airwayManagement}
            onChange={(e) => handleAnaesthesiaChange("airwayManagement", e.target.value)}
            placeholder="e.g. Laryngeal Mask Airway"
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label fw-bold">ASA Grade</label>
          <select
            className="form-select"
            value={anaesthesia.asaGrade}
            onChange={(e) => handleAnaesthesiaChange("asaGrade", e.target.value)}
          >
            {ASA_GRADE_OPTIONS.map((grade) => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
        </div>
      </div>

      <h6 className="fw-bold text-primary mb-3 mt-2">Pre-Induction Vitals</h6>
      <div className="row">
        <div className="col-md-4 mb-3">
          <label className="form-label fw-bold">BP</label>
          <input
            type="text"
            className="form-control"
            value={anaesthesia.preInductionBP}
            onChange={(e) => handleAnaesthesiaChange("preInductionBP", e.target.value)}
            placeholder="e.g. 130/80"
          />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label fw-bold">Pulse</label>
          <input
            type="text"
            className="form-control"
            value={anaesthesia.preInductionPulse}
            onChange={(e) => handleAnaesthesiaChange("preInductionPulse", e.target.value)}
          />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label fw-bold">SpO2</label>
          <input
            type="text"
            className="form-control"
            value={anaesthesia.preInductionSpO2}
            onChange={(e) => handleAnaesthesiaChange("preInductionSpO2", e.target.value)}
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label fw-bold">Anaesthesia Notes</label>
        <textarea
          className="form-control"
          rows="2"
          value={anaesthesia.anaesthesiaNotes}
          onChange={(e) => handleAnaesthesiaChange("anaesthesiaNotes", e.target.value)}
        />
      </div>

      <div className="row">
        <div className="col-md-4 mb-3">
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
          <div className="col-md-8 mb-3">
            <label className="form-label fw-bold">If Yes</label>
            <input
              type="text"
              className="form-control"
              value={anaesthesia.complicationDetails}
              onChange={(e) => handleAnaesthesiaChange("complicationDetails", e.target.value)}
              placeholder="Describe the complication"
            />
          </div>
        )}
      </div>

      <div className="d-flex justify-content-end">
        <button className="btn btn-primary" onClick={() => handleSaveTab("Anaesthesia details")}>
          Save Anaesthesia
        </button>
      </div>
    </div>
  );

  const renderDrugsTab = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="fw-bold text-primary mb-0">Drugs Used During Surgery</h6>
        <button className="btn btn-success btn-sm" onClick={handleAddDrugRow}>
          <i className="fa fa-plus me-1"></i> Add Drug
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-sm align-middle">
          <thead className="table-light">
            <tr>
              <th>Drug</th>
              <th style={{ width: "90px" }}>Qty</th>
              <th style={{ width: "120px" }}>Unit</th>
              <th style={{ width: "140px" }}>Batch No.</th>
              <th>Used By</th>
              <th style={{ width: "50px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {drugRows.map((row) => (
              <tr key={row.id}>
                <td>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={row.drugName}
                    onChange={(e) => handleDrugRowChange(row.id, "drugName", e.target.value)}
                    placeholder="Drug name"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={row.qty}
                    onChange={(e) => handleDrugRowChange(row.id, "qty", e.target.value)}
                  />
                </td>
                <td>
                  <select
                    className="form-select form-select-sm"
                    value={row.unit}
                    onChange={(e) => handleDrugRowChange(row.id, "unit", e.target.value)}
                  >
                    <option value="">Select</option>
                    {DRUG_UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={row.batchNo}
                    onChange={(e) => handleDrugRowChange(row.id, "batchNo", e.target.value)}
                  />
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
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemoveDrugRow(row.id)}
                    disabled={drugRows.length === 1}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-end">
        <button className="btn btn-primary" onClick={() => handleSaveTab("Drugs used")}>
          Save Drugs
        </button>
      </div>
    </div>
  );

  const renderConsumablesTab = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="fw-bold text-primary mb-0">Medical Consumables Used</h6>
        <button className="btn btn-success btn-sm" onClick={handleAddConsumableRow}>
          <i className="fa fa-plus me-1"></i> Add Consumable
        </button>
      </div>
     

      <div className="table-responsive">
        <table className="table table-bordered table-sm align-middle">
          <thead className="table-light">
            <tr>
              <th>Item</th>
              <th style={{ width: "90px" }}>Planned</th>
              <th style={{ width: "90px" }}>Used</th>
              <th style={{ width: "110px" }}>Unit</th>
              <th style={{ width: "120px" }}>Batch</th>
              <th style={{ width: "50px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {consumableRows.map((row) => (
              <tr key={row.id}>
                <td>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={row.item}
                    onChange={(e) => handleConsumableRowChange(row.id, "item", e.target.value)}
                    placeholder="Item name"
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
                  <select
                    className="form-select form-select-sm"
                    value={row.unit}
                    onChange={(e) => handleConsumableRowChange(row.id, "unit", e.target.value)}
                  >
                    <option value="">Select</option>
                    {CONSUMABLE_UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={row.batch}
                    onChange={(e) => handleConsumableRowChange(row.id, "batch", e.target.value)}
                  />
                </td>
                <td className="text-center">
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemoveConsumableRow(row.id)}
                    disabled={consumableRows.length === 1}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-end">
        <button className="btn btn-primary" onClick={() => handleSaveTab("Consumables used")}>
          Save Consumables
        </button>
      </div>
    </div>
  );

  const renderImplantsTab = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="fw-bold text-primary mb-0">Implants Used</h6>
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
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemoveImplantRow(row.id)}
                    disabled={implantRows.length === 1}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-end">
        <button className="btn btn-primary" onClick={() => handleSaveTab("Implants used")}>
          Save Implants
        </button>
      </div>
    </div>
  );

  const renderOperativeTab = () => (
    <div>
      <h6 className="fw-bold text-primary mb-3">Operative Details</h6>
      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label fw-bold">Surgery Start Time</label>
          <input
            type="datetime-local"
            className="form-control"
            value={operativeDetails.surgeryStartTime}
            onChange={(e) => handleOperativeChange("surgeryStartTime", e.target.value)}
          />
        </div>
        <div className="col-md-6 mb-3">
          <label className="form-label fw-bold">Surgery End Time</label>
          <input
            type="datetime-local"
            className="form-control"
            value={operativeDetails.surgeryEndTime}
            onChange={(e) => handleOperativeChange("surgeryEndTime", e.target.value)}
          />
        </div>

        <div className="col-md-6 mb-3">
          <label className="form-label fw-bold">Primary Surgeon</label>
          <input
            type="text"
            className="form-control"
            value={operativeDetails.primarySurgeon}
            onChange={(e) => handleOperativeChange("primarySurgeon", e.target.value)}
          />
        </div>
        <div className="col-md-6 mb-3">
          <label className="form-label fw-bold">Assistant Surgeon</label>
          <input
            type="text"
            className="form-control"
            value={operativeDetails.assistantSurgeon}
            onChange={(e) => handleOperativeChange("assistantSurgeon", e.target.value)}
          />
        </div>

        <div className="col-md-6 mb-3">
          <label className="form-label fw-bold">Pre Op Diagnosis</label>
          <textarea
            className="form-control"
            rows="2"
            value={operativeDetails.preOpDiagnosis}
            onChange={(e) => handleOperativeChange("preOpDiagnosis", e.target.value)}
          />
        </div>
        <div className="col-md-6 mb-3">
          <label className="form-label fw-bold">Post Op Diagnosis</label>
          <textarea
            className="form-control"
            rows="2"
            value={operativeDetails.postOpDiagnosis}
            onChange={(e) => handleOperativeChange("postOpDiagnosis", e.target.value)}
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label fw-bold">Procedure Performed</label>
        <textarea
          className="form-control"
          rows="3"
          value={operativeDetails.procedurePerformed}
          onChange={(e) => handleOperativeChange("procedurePerformed", e.target.value)}
          placeholder="Describe the procedure performed"
        />
      </div>

      <div className="mb-3">
        <label className="form-label fw-bold">Operative Notes</label>
        <textarea
          className="form-control"
          rows="3"
          value={operativeDetails.operativeNotes}
          onChange={(e) => handleOperativeChange("operativeNotes", e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label fw-bold">Surgical Findings</label>
        <textarea
          className="form-control"
          rows="3"
          value={operativeDetails.surgicalFindings}
          onChange={(e) => handleOperativeChange("surgicalFindings", e.target.value)}
        />
      </div>

      <div className="row">
        <div className="col-md-4 mb-3">
          <label className="form-label fw-bold">Estimated Blood Loss (ml)</label>
          <input
            type="text"
            className="form-control"
            value={operativeDetails.estimatedBloodLoss}
            onChange={(e) => handleOperativeChange("estimatedBloodLoss", e.target.value)}
          />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label fw-bold">Drain Placed</label>
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
        <div className="col-md-4 mb-3">
          <label className="form-label fw-bold">Complication</label>
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
        <div className="col-md-4 mb-3">
          <label className="form-label fw-bold">Specimen Collected</label>
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
      </div>

      <div className="mb-3">
        <label className="form-label fw-bold">Additional Notes</label>
        <textarea
          className="form-control"
          rows="2"
          value={operativeDetails.additionalNotes}
          onChange={(e) => handleOperativeChange("additionalNotes", e.target.value)}
        />
      </div>

      <div className="d-flex justify-content-end">
        <button className="btn btn-primary" onClick={() => handleSaveTab("Operative details")}>
          Save Operative Details
        </button>
      </div>
    </div>
  );

  const renderSpecimenTab = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="fw-bold text-primary mb-0">Specimens Sent</h6>
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
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemoveSpecimenRow(row.id)}
                    disabled={specimenRows.length === 1}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-end">
        <button className="btn btn-primary" onClick={() => handleSaveTab("Specimen details")}>
          Save Specimen
        </button>
      </div>
    </div>
  );

  const renderComplicationsTab = () => (
    <div>
      <h6 className="fw-bold text-primary mb-3">Complications</h6>
      <div className="row">
        <div className="col-md-4 mb-3">
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
          <div className="col-md-4 mb-3">
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
      </div>

      {complications.anyComplications === "Yes" && (
        <>
          <div className="mb-3">
            <label className="form-label fw-bold">Description</label>
            <textarea
              className="form-control"
              rows="2"
              value={complications.description}
              onChange={(e) => handleComplicationsChange("description", e.target.value)}
            />
          </div>
          <div className="mb-3">
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

      <div className="d-flex justify-content-end">
        <button className="btn btn-primary" onClick={() => handleSaveTab("Complications")}>
          Save Complications
        </button>
      </div>
    </div>
  );

  const renderSignOutTab = () => (
    <div>
      <h6 className="fw-bold text-primary mb-3">Sign-Out</h6>
      <div className="row">
        <div className="col-md-4 mb-3">
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
        <div className="col-md-4 mb-3">
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
        <div className="col-md-4 mb-3">
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

        <div className="col-md-4 mb-3">
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
          <div className="col-md-8 mb-3">
            <label className="form-label fw-bold">Equipment Issue Notes</label>
            <input
              type="text"
              className="form-control"
              value={signOut.equipmentIssuesNotes}
              onChange={(e) => handleSignOutChange("equipmentIssuesNotes", e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="mb-3">
        <label className="form-label fw-bold">Key Concerns for Recovery</label>
        <textarea
          className="form-control"
          rows="2"
          value={signOut.keyConcernsForRecovery}
          onChange={(e) => handleSignOutChange("keyConcernsForRecovery", e.target.value)}
        />
      </div>

      <div className="row">
        <div className="col-md-6 mb-2">
          <label className="form-label fw-bold small mb-1">Confirmed By</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={`${CURRENT_USER} (Auto)`}
            readOnly
            style={{ backgroundColor: "#e9ecef" }}
          />
        </div>
        <div className="col-md-6 mb-2">
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
        <button className="btn btn-success" onClick={() => handleSaveTab("Sign-Out")}>
          Complete Sign-Out
        </button>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "anaesthesia": return renderAnaesthesiaTab();
      case "drugs": return renderDrugsTab();
      case "consumables": return renderConsumablesTab();
      case "implants": return renderImplantsTab();
      case "operative": return renderOperativeTab();
    //   case "specimen": return renderSpecimenTab();
    //   case "complications": return renderComplicationsTab();
    //   case "signout": return renderSignOutTab();
      default: return null;
    }
  };

  // ============================================================
  // RENDER: OT SURGERY EXECUTION (detail view)
  // ============================================================
  const renderExecution = () => (
    <div className="card form-card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h4 className="card-title p-2 mb-0">OT Surgery Execution</h4>
        <button type="button" className="btn btn-secondary" onClick={backToWorklist}>
          <i className="mdi mdi-arrow-left"></i> Back to Worklist
        </button>
      </div>
      <div className="card-body">
        {/* Patient / Booking Details */}
        <div className="card mb-3">
          <div className="card-header bg-light py-2">
            <strong>Patient / Booking Details</strong>
          </div>
          <div className="card-body py-2">
            <div className="row">
              <div className="col-md-4 mb-2"><strong>Patient:</strong> {selectedPatient.patientName}</div>
              <div className="col-md-4 mb-2"><strong>IP No.:</strong> {selectedPatient.uhidOrIp}</div>
              <div className="col-md-4 mb-2"><strong>Age / Gender:</strong> {selectedPatient.ageGender}</div>

              <div className="col-md-4 mb-2"><strong>Department:</strong> {selectedPatient.department}</div>
              <div className="col-md-4 mb-2"><strong>OT:</strong> {selectedPatient.ot}</div>
              <div className="col-md-4 mb-2"><strong>Surgeon:</strong> {selectedPatient.surgeon}</div>

              <div className="col-md-8 mb-2"><strong>Surgery:</strong> {selectedPatient.surgery}</div>
              <div className="col-md-4 mb-2"><strong>Scheduled:</strong> {selectedPatient.scheduledTime}</div>

              <div className="col-md-4 mb-2">
                <strong>PAC:</strong> <span className="badge bg-success">{selectedPatient.pac}</span>
              </div>
              <div className="col-md-4 mb-2">
                <strong>Pre-Op Checklist:</strong> <span className="badge bg-success">{selectedPatient.preOpChecklist}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <ul className="nav nav-tabs mb-3">
          {TABS.map((tab) => (
            <li className="nav-item" key={tab.key}>
              <button
                type="button"
                className={`nav-link ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Tab Content */}
        <div className="tab-content-panel">{renderTabContent()}</div>
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

      {popupMessage && (
        <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
      )}
    </div>
  );
};

export default OTSurgeryExecution;