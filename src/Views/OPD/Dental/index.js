import React, { useState, useEffect } from "react";

const DentalSection = ({ patientId, visitId, hideHeader = false, hideButtons = false }) => {
  // ==================== STATE VARIABLES ====================

  // Adult / Child toggle (radio button driven)
  const [dentalType, setDentalType] = useState("adult"); // "adult" | "child"

  // Teeth conditions state
  const [teethData, setTeethData] = useState({});
  const [childTeethData, setChildTeethData] = useState({});
  const [toothConditions, setToothConditions] = useState([]);
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [showConditionModal, setShowConditionModal] = useState(false);

  // Dental summary state
  const [adultDentalSummary, setAdultDentalSummary] = useState({
    totalTeeth: 32,
    missingTeeth: 0,
    unsalvageableTeeth: 0,
    otherConditionsCount: 0,
    affectedTeeth: 0,
    procedureCount: 0,
    dentalPoints: 0,
    notes: ""
  });

  const [childDentalSummary, setChildDentalSummary] = useState({
    totalTeeth: 20,
    missingTeeth: 0,
    unsalvageableTeeth: 0,
    otherConditionsCount: 0,
    affectedTeeth: 0,
    procedureCount: 0,
    dentalPoints: 0,
    notes: ""
  });

  // Dashboard state
  const [showAdultDashboard, setShowAdultDashboard] = useState(false);
  const [showChildDashboard, setShowChildDashboard] = useState(false);
  const [selectedDashboardDate, setSelectedDashboardDate] = useState(new Date().toISOString().split("T")[0]);
  const [dashboardAppointments, setDashboardAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // ==================== Dental History popup ====================
  const [showDentalHistoryModal, setShowDentalHistoryModal] = useState(false);

  // ==================== Dental Procedure History popup + View Details popup ====================
  const [showProcedureHistoryModal, setShowProcedureHistoryModal] = useState(false);
  const [showProcedureDetailModal, setShowProcedureDetailModal] = useState(false);
  const [selectedProcedureHistory, setSelectedProcedureHistory] = useState(null);

  // ==================== Dental Procedure table (Add/Remove rows) ====================
  const [procedures, setProcedures] = useState([]);
  const [procedureRows, setProcedureRows] = useState([
    {
      id: 1,
      arch: "adult",
      toothNumbers: [],
      procedureId: "",
      procedureDate: new Date().toISOString().split("T")[0],
      appointmentDate: "",
      appointmentTime: "",
      remarks: ""
    }
  ]);
  const [savedProcedures, setSavedProcedures] = useState([]);

  // Teeth selection popup (used by the Dental Procedure table's "Tooth No." cell)
  const [showTeethSelectModal, setShowTeethSelectModal] = useState(false);
  const [teethSelectRowId, setTeethSelectRowId] = useState(null);
  const [teethSelectArch, setTeethSelectArch] = useState("adult");
  const [tempSelectedTeeth, setTempSelectedTeeth] = useState([]);

  // Adult Teeth arrays
  const adultUpperRight = [18, 17, 16, 15, 14, 13, 12, 11];
  const adultUpperLeft = [21, 22, 23, 24, 25, 26, 27, 28];
  const adultLowerLeft = [31, 32, 33, 34, 35, 36, 37, 38];
  const adultLowerRight = [48, 47, 46, 45, 44, 43, 42, 41];

  // Child Teeth arrays
  const childUpperRight = [55, 54, 53, 52, 51];
  const childUpperLeft = [61, 62, 63, 64, 65];
  const childLowerLeft = [71, 72, 73, 74, 75];
  const childLowerRight = [85, 84, 83, 82, 81];

  // ==================== MOCK DATA ====================

  const mockToothConditions = [
    { conditionId: 1, conditionName: "Normal", points: 0, isMissing: false, isUnsalvageable: false },
    { conditionId: 2, conditionName: "Caries", points: 2, isMissing: false, isUnsalvageable: false },
    { conditionId: 3, conditionName: "Missing Tooth", points: 5, isMissing: true, isUnsalvageable: false },
    { conditionId: 4, conditionName: "Fractured", points: 3, isMissing: false, isUnsalvageable: false },
    { conditionId: 5, conditionName: "Unsalvageable", points: 4, isMissing: false, isUnsalvageable: true },
    { conditionId: 6, conditionName: "Impacted", points: 3, isMissing: false, isUnsalvageable: false },
    { conditionId: 7, conditionName: "Periodontitis", points: 2, isMissing: false, isUnsalvageable: false },
    { conditionId: 8, conditionName: "Mobile Tooth", points: 3, isMissing: false, isUnsalvageable: false }
  ];

  const mockProcedures = [
    { procedureId: 1, procedureName: "Root Canal Treatment (RCT)", defaultSittings: 3 },
    { procedureId: 2, procedureName: "Tooth Extraction", defaultSittings: 1 },
    { procedureId: 3, procedureName: "Dental Filling", defaultSittings: 1 },
    { procedureId: 4, procedureName: "Scaling & Polishing", defaultSittings: 1 },
    { procedureId: 5, procedureName: "Crown & Bridge", defaultSittings: 2 },
    { procedureId: 6, procedureName: "Dental Implant", defaultSittings: 4 }
  ];

  const mockAppointments = {
    "2025-01-10": [
    {
      scheduleId: 1,
      patientName: "Anil Verma",
      age: 39,
      gender: "Male",
      procedureName: "Dental Implant",
      toothNumbers: "36",
      scheduledBy: "Dr. Nair",
      scheduleStatus: "CLOSED",
      isSelected: false
    },
    {
      scheduleId: 2,
      patientName: "Pooja Sharma",
      age: 31,
      gender: "Female",
      procedureName: "Scaling & Polishing",
      toothNumbers: "11,12,21,22",
      scheduledBy: "Dr. Rao",
      scheduleStatus: "IN_PROGRESS",
      isSelected: false
    }
    ],
    "2025-01-15": [
    {
      scheduleId: 3,
      patientName: "Vikram Singh",
      age: 46,
      gender: "Male",
      procedureName: "Crown & Bridge",
      toothNumbers: "26,27",
      scheduledBy: "Dr. Patel",
      scheduleStatus: "OPEN",
      isSelected: false
    }
    ]
  };

  const dentalHistoryData = [
  { id: 1, date: "Jul 2026", dds: 4, missing: 0, decayed: 1, notes: "Stable condition" },
  { id: 2, date: "Mar 2026", dds: 7, missing: 1, decayed: 2, notes: "Needs follow-up" },
  { id: 3, date: "Nov 2025", dds: 11, missing: 2, decayed: 4, notes: "Multiple affected teeth" }
];

  const procedureHistoryData = [
    {
      id: 1,
    procedureName: "Dental Implant",
    toothNo: "36",
    status: "Completed",
    firstSittingDate: "12-Aug-2026",
    advisedBy: "Dr. Rao",
    advisedDate: "05-Aug-2026",
    plannedSittings: 4,
    completedSittings: 4,
      sittings: [
        {
          sittingNo: 1,
        scheduledDateTime: "12-Aug-2026 09:00 AM",
        performedDateTime: "12-Aug-2026 09:20 AM",
        performedBy: "Dr. Rao",
          status: "Completed",
        findings: "Healed extraction site suitable for implant placement",
        procedureNotes: "Implant placement completed successfully",
          complication: "No",
          postProcedureAdvice: "Medication advised"
        },
        {
          sittingNo: 2,
        scheduledDateTime: "19-Aug-2026 09:30 AM",
        performedDateTime: "19-Aug-2026 09:45 AM",
        performedBy: "Dr. Rao",
          status: "Completed",
        findings: "Healing satisfactory",
        procedureNotes: "Healing assessment and implant stability checked",
          complication: "No",
        postProcedureAdvice: "Continue prescribed oral hygiene routine"
        }
      ]
    },
    {
      id: 2,
    procedureName: "Dental Filling",
    toothNo: "14, 15",
      status: "Completed",
    firstSittingDate: "02-Aug-2026",
    advisedBy: "Dr. Patel",
    advisedDate: "30-Jul-2026",
      plannedSittings: 1,
      completedSittings: 1,
      sittings: [
        {
          sittingNo: 1,
        scheduledDateTime: "02-Aug-2026 11:00 AM",
        performedDateTime: "02-Aug-2026 11:20 AM",
        performedBy: "Dr. Patel",
          status: "Completed",
        findings: "Small occlusal caries lesions",
        procedureNotes: "Composite restorations completed",
          complication: "No",
        postProcedureAdvice: "Avoid hard foods for the rest of the day"
        }
      ]
    },
    {
      id: 3,
    procedureName: "Root Canal Treatment",
    toothNo: "24",
    status: "In Progress",
    firstSittingDate: "28-Jul-2026",
    advisedBy: "Dr. Nair",
    advisedDate: "25-Jul-2026",
    plannedSittings: 3,
    completedSittings: 2,
      sittings: [
        {
          sittingNo: 1,
        scheduledDateTime: "28-Jul-2026 02:00 PM",
        performedDateTime: "28-Jul-2026 02:15 PM",
        performedBy: "Dr. Nair",
          status: "Completed",
        findings: "Irreversible pulpitis suspected",
        procedureNotes: "Access opening and initial canal preparation completed",
          complication: "No",
        postProcedureAdvice: "Continue medication as prescribed"
      },
      {
        sittingNo: 2,
        scheduledDateTime: "06-Aug-2026 02:30 PM",
        performedDateTime: "06-Aug-2026 02:45 PM",
        performedBy: "Dr. Nair",
        status: "Completed",
        findings: "Canals cleaned and prepared",
        procedureNotes: "Cleaning and shaping completed",
        complication: "No",
        postProcedureAdvice: "Return for obturation appointment"
        }
      ]
    },
    {
      id: 4,
    procedureName: "Scaling & Polishing",
    toothNo: "11, 12, 21, 22, 31, 32",
      status: "Completed",
    firstSittingDate: "18-Jul-2026",
      advisedBy: "Dr. Mehta",
    advisedDate: "16-Jul-2026",
      plannedSittings: 1,
      completedSittings: 1,
      sittings: [
        {
          sittingNo: 1,
        scheduledDateTime: "18-Jul-2026 10:00 AM",
        performedDateTime: "18-Jul-2026 10:25 AM",
          performedBy: "Dr. Mehta",
          status: "Completed",
        findings: "Moderate calculus deposits",
        procedureNotes: "Full mouth scaling and polishing completed",
          complication: "No",
        postProcedureAdvice: "Brush twice daily and maintain regular follow-up"
        }
      ]
    },
    {
      id: 5,
      procedureName: "Crown Placement",
    toothNo: "27",
      status: "In Progress",
    firstSittingDate: "10-Jul-2026",
    advisedBy: "Dr. Patel",
    advisedDate: "07-Jul-2026",
      plannedSittings: 2,
      completedSittings: 1,
      sittings: [
        {
          sittingNo: 1,
        scheduledDateTime: "10-Jul-2026 01:00 PM",
        performedDateTime: "10-Jul-2026 01:25 PM",
        performedBy: "Dr. Patel",
          status: "Completed",
        findings: "Extensive crown damage",
        procedureNotes: "Tooth preparation and impression completed",
          complication: "No",
        postProcedureAdvice: "Temporary crown placed; avoid sticky foods"
        }
      ]
    }
  ];


  // ==================== INITIALIZATION ====================

  useEffect(() => {
    setToothConditions(mockToothConditions);
    setProcedures(mockProcedures);

    // Initialize adult teeth data
    const initialAdultTeeth = {};
    [...adultUpperRight, ...adultUpperLeft, ...adultLowerLeft, ...adultLowerRight].forEach(tooth => {
      initialAdultTeeth[tooth] = [];
    });
    setTeethData(initialAdultTeeth);

    // Initialize child teeth data
    const initialChildTeeth = {};
    [...childUpperRight, ...childUpperLeft, ...childLowerLeft, ...childLowerRight].forEach(tooth => {
      initialChildTeeth[tooth] = [];
    });
    setChildTeethData(initialChildTeeth);
  }, []);

  useEffect(() => {
    if (showAdultDashboard || showChildDashboard) {
      fetchDashboardAppointments();
    }
  }, [selectedDashboardDate, showAdultDashboard, showChildDashboard]);

  // ==================== API FUNCTIONS ====================

  const fetchDashboardAppointments = () => {
    setDashboardAppointments(mockAppointments[selectedDashboardDate] || []);
  };

  // ==================== HELPER FUNCTIONS ====================

  const isExclusiveToothCondition = (condition) =>
    Boolean(condition?.isMissing || condition?.isUnsalvageable);

  const hasExclusiveCondition = (conditions = []) =>
    conditions.some((condition) => isExclusiveToothCondition(condition));

  const getToothColor = (toothNumber, isAdult = true) => {
    const conditions = isAdult
      ? teethData[toothNumber] || []
      : childTeethData[toothNumber] || [];

    if (conditions.some(c => c.isMissing)) {
      return "#dc3545";
    }

    if (conditions.some(c => c.isUnsalvageable)) {
      return "#fd7e14";
    }

    if (conditions.length > 0) {
      return "#ffc107";
    }

    return "#28a745";
  };

  // ==================== EVENT HANDLERS ====================

  const handleToothClick = (toothNumber, isAdult = true) => {
    setSelectedTooth({ number: toothNumber, isAdult });
    setShowConditionModal(true);
  };

  const handleConditionSelect = (condition) => {
    if (!selectedTooth) return;

    const { number, isAdult } = selectedTooth;

    const currentData = isAdult ? teethData : childTeethData;

    const existingConditions = currentData[number] || [];

    const alreadySelected = existingConditions.some(
      (item) => item.conditionId === condition.conditionId
    );
    const alreadyLocked = hasExclusiveCondition(existingConditions);
    const selectingExclusive = isExclusiveToothCondition(condition);

    let updatedConditions = existingConditions;

    if (alreadySelected) {
      updatedConditions = existingConditions.filter(
        (item) => item.conditionId !== condition.conditionId
      );
    } else if (selectingExclusive) {
      updatedConditions = [condition];
    } else if (!alreadyLocked) {
      updatedConditions = [...existingConditions, condition];
    } else {
      return;
    }

    const updatedData = {
      ...currentData,
      [number]: updatedConditions,
    };

    if (isAdult) {
      setTeethData(updatedData);
      calculateSummary(updatedData);
    } else {
      setChildTeethData(updatedData);
      calculateChildSummary(updatedData);
    }
  };

  const handleDashboardCheckbox = (scheduleId) => {
    setDashboardAppointments(prev =>
      prev.map(app =>
        app.scheduleId === scheduleId
          ? { ...app, isSelected: !app.isSelected }
          : app
      )
    );
  };

  const calculateSummary = (updatedData) => {
    let missing = 0;
    let unsalvageable = 0;
    let points = 0;
    let otherConditions = 0;
    let affected = 0;

    Object.values(updatedData).forEach((conditions) => {
      if (conditions.length > 0) affected++;

      conditions.forEach((condition) => {
        if (condition.isMissing) missing++;
        if (condition.isUnsalvageable) unsalvageable++;
        if (
          condition.conditionName !== "Normal" &&
          !condition.isMissing &&
          !condition.isUnsalvageable
        ) {
          otherConditions++;
        }
        points += condition.points || 0;
      });
    });

    setAdultDentalSummary(prev => ({
      ...prev,
      missingTeeth: missing,
      unsalvageableTeeth: unsalvageable,
      otherConditionsCount: otherConditions,
      affectedTeeth: affected,
      dentalPoints: points
    }));
  };

  const calculateChildSummary = (updatedData) => {
    let missing = 0;
    let unsalvageable = 0;
    let points = 0;
    let otherConditions = 0;
    let affected = 0;

    Object.values(updatedData).forEach((conditions) => {
      if (conditions.length > 0) affected++;

      conditions.forEach((condition) => {
        if (condition.isMissing) missing++;
        if (condition.isUnsalvageable) unsalvageable++;
        if (
          condition.conditionName !== "Normal" &&
          !condition.isMissing &&
          !condition.isUnsalvageable
        ) {
          otherConditions++;
        }
        points += condition.points || 0;
      });
    });

    setChildDentalSummary(prev => ({
      ...prev,
      missingTeeth: missing,
      unsalvageableTeeth: unsalvageable,
      otherConditionsCount: otherConditions,
      affectedTeeth: affected,
      dentalPoints: points
    }));
  };

  // Keep the "Procedure" summary count in sync with saved procedures per arch
  useEffect(() => {
    const adultCount = savedProcedures.filter(p => p.arch === "adult").length;
    const childCount = savedProcedures.filter(p => p.arch === "child").length;
    setAdultDentalSummary(prev => ({ ...prev, procedureCount: adultCount }));
    setChildDentalSummary(prev => ({ ...prev, procedureCount: childCount }));
  }, [savedProcedures]);

  const handleSelectAll = () => {
    const allSelected = dashboardAppointments.length > 0 && dashboardAppointments.every(app => app.isSelected);
    setDashboardAppointments(prev =>
      prev.map(app => ({ ...app, isSelected: !allSelected }))
    );
  };

  const handleSaveNotes = () => {
    console.log("Saving dental notes:", { adultDentalSummary, childDentalSummary });
    alert("Dental examination saved successfully!");
  };

  // ==================== DENTAL PROCEDURE TABLE HANDLERS (Add/Remove rows) ====================

  const handleProcedureRowChange = (id, field, value) => {
    setProcedureRows(prev => prev.map(r => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleAddProcedureRow = () => {
    setProcedureRows(prev => [
      ...prev,
      {
        id: prev.length ? Math.max(...prev.map(r => r.id)) + 1 : 1,
        arch: dentalType,
        toothNumbers: [],
        procedureId: "",
        procedureDate: new Date().toISOString().split("T")[0],
        appointmentDate: "",
        appointmentTime: "",
        remarks: ""
      }
    ]);
  };

  const handleRemoveProcedureRow = (id) => {
    setProcedureRows(prev => (prev.length > 1 ? prev.filter(r => r.id !== id) : prev));
  };

  const handleResetProcedureForm = () => {
    setProcedureRows([
      {
        id: 1,
        arch: dentalType,
        toothNumbers: [],
        procedureId: "",
        procedureDate: new Date().toISOString().split("T")[0],
        appointmentDate: "",
        appointmentTime: "",
        remarks: ""
      }
    ]);
  };

  const handleSaveProcedures = () => {
    const invalid = procedureRows.some(
      r => r.toothNumbers.length === 0 || !r.procedureId || !r.appointmentDate
    );
    if (invalid) {
      alert("Please select tooth number(s), procedure and appointment date for each row.");
      return;
    }

    const newlySaved = procedureRows.map(r => ({
      ...r,
      procedureName: procedures.find(p => p.procedureId === parseInt(r.procedureId))?.procedureName || ""
    }));

    setSavedProcedures(prev => [...prev, ...newlySaved]);
    alert("Dental procedure(s) saved successfully!");
    handleResetProcedureForm();
  };

  // ---- Teeth select popup (opened from the Tooth No. cell in the procedure table) ----

  const openTeethSelectModal = (row) => {
    setTeethSelectRowId(row.id);
    setTeethSelectArch(row.arch || dentalType);
    setTempSelectedTeeth(row.toothNumbers || []);
    setShowTeethSelectModal(true);
  };

  const toggleTempTooth = (tooth) => {
    setTempSelectedTeeth(prev =>
      prev.includes(tooth) ? prev.filter(t => t !== tooth) : [...prev, tooth]
    );
  };

  const handleConfirmTeethSelect = () => {
    setProcedureRows(prev =>
      prev.map(r => (r.id === teethSelectRowId ? { ...r, toothNumbers: tempSelectedTeeth } : r))
    );
    setShowTeethSelectModal(false);
  };

  const handleCancelTeethSelect = () => {
    setShowTeethSelectModal(false);
    setTempSelectedTeeth([]);
    setTeethSelectRowId(null);
  };

  // ---- Dental Procedure History -> View Details ----

  const openProcedureDetail = (item) => {
    setSelectedProcedureHistory(item);
    setShowProcedureDetailModal(true);
  };

  const closeProcedureDetail = () => {
    setShowProcedureDetailModal(false);
    setSelectedProcedureHistory(null);
  };

  // ==================== TOOTH BOX COMPONENT ====================
  const ToothBox = ({ tooth, toothData, bgColor, onClick }) => {
    const selectedConditions = toothData || [];

    return (
      <div className="text-center mx-1 mb-1">
        <div
          className="d-flex align-items-center justify-content-center fw-bold"
          onClick={onClick}
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "8px",
            backgroundColor: bgColor,
            color: "#fff",
            cursor: "pointer",
            border: "1px solid #dee2e6",
          }}
        >
          {tooth}
        </div>

        <div className="mt-1 text-start">
          {selectedConditions.map((condition) => (
            <div
              key={condition.conditionId}
              className="d-flex align-items-center gap-1"
              style={{ fontSize: "10px" }}
            >
              <input type="checkbox" checked readOnly />
              <span>{condition.conditionName}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Small chip-style tooth button used inside the "Select Teeth" popup
  const SelectableToothChip = ({ tooth, isSelected, onClick }) => (
    <span
      onClick={onClick}
      className="d-inline-flex align-items-center justify-content-center mx-1 mb-1"
      style={{
        width: "34px",
        height: "34px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 600,
        cursor: "pointer",
        border: isSelected ? "2px solid #0d6efd" : "1px solid #ced4da",
        backgroundColor: isSelected ? "#0d6efd" : "#fff",
        color: isSelected ? "#fff" : "#212529"
      }}
    >
      {tooth}
    </span>
  );

  // ==================== RENDER FUNCTIONS ====================

  // Compact summary card used in the 6-across stat row
  const SummaryCard = ({ label, value, bg, textDark = false }) => (
    <div className="flex-fill" style={{ minWidth: 0 }}>
      <div className={`card ${bg} ${textDark ? "text-dark" : "text-white"}`}>
        <div className="card-body px-2 py-1 text-center">
          <div className="small text-truncate" style={{ fontSize: "0.68rem", lineHeight: 1.1 }}>
            {label}
          </div>
          <div className="fw-bold" style={{ fontSize: "1.05rem", lineHeight: 1.2 }}>
            {value}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSummaryRow = (summary) => (
    <div className="d-flex gap-2 mb-2 flex-nowrap" style={{ overflowX: "auto" }}>
      <SummaryCard label="Total Teeth" value={summary.totalTeeth} bg="bg-primary" />
      <SummaryCard label="Missing" value={summary.missingTeeth} bg="bg-danger" />
      <SummaryCard label="Unsalvageable" value={summary.unsalvageableTeeth} bg="bg-warning" textDark />
      <SummaryCard label="Affected Teeth" value={summary.affectedTeeth} bg="bg-info" />
      <SummaryCard label="Procedure" value={summary.procedureCount} bg="bg-secondary" />
      <SummaryCard label="DDS Points" value={summary.dentalPoints} bg="bg-success" />
    </div>
  );

  const renderToothChart = (isAdult) => {
    const upperRight = isAdult ? adultUpperRight : childUpperRight;
    const upperLeft = isAdult ? adultUpperLeft : childUpperLeft;
    const lowerLeft = isAdult ? adultLowerLeft : childLowerLeft;
    const lowerRight = isAdult ? adultLowerRight : childLowerRight;
    const data = isAdult ? teethData : childTeethData;

    return (
      <div className="mb-2">
        <h6 className={`fw-bold ${isAdult ? "text-primary" : "text-success"}`}>
          {isAdult ? "Adult Teeth" : "Child Teeth"}
        </h6>

        <div className="d-flex justify-content-center gap-2 mb-2 flex-wrap">
          <span><span className="badge bg-success">🟢</span> Normal</span>
          <span><span className="badge bg-warning">🟡</span> Condition</span>
          <span><span className="badge bg-danger">🔴</span> Missing</span>
          <span><span className="badge" style={{ backgroundColor: "#fd7e14", color: "white" }}>🟠</span> Unsalvageable</span>
        </div>
        <div className="small text-muted mb-2 text-center">
          Missing and unsalvageable teeth lock the rest of the conditions for that tooth.
        </div>

        <div className="text-center mb-2">
          <span className="badge bg-secondary">Upper Right</span>
          <span className="mx-4"></span>
          <span className="badge bg-secondary">Upper Left</span>
        </div>
        <div className="d-flex justify-content-center mb-2 flex-wrap">
          <div className="d-flex flex-wrap justify-content-center">
            {upperRight.map(tooth => (
              <ToothBox
                key={tooth}
                tooth={tooth}
                toothData={data[tooth]}
                bgColor={getToothColor(tooth, isAdult)}
                onClick={() => handleToothClick(tooth, isAdult)}
              />
            ))}
          </div>
          <div className="mx-2"></div>
          <div className="d-flex flex-wrap justify-content-center">
            {upperLeft.map(tooth => (
              <ToothBox
                key={tooth}
                tooth={tooth}
                toothData={data[tooth]}
                bgColor={getToothColor(tooth, isAdult)}
                onClick={() => handleToothClick(tooth, isAdult)}
              />
            ))}
          </div>
        </div>

        <div className="text-center small text-muted mb-2">Midline</div>

        <div className="text-center mb-2">
          <span className="badge bg-secondary">Lower Left</span>
          <span className="mx-4"></span>
          <span className="badge bg-secondary">Lower Right</span>
        </div>
        <div className="d-flex justify-content-center flex-wrap">
          <div className="d-flex flex-wrap justify-content-center">
            {lowerRight.map(tooth => (
              <ToothBox
                key={tooth}
                tooth={tooth}
                toothData={data[tooth]}
                bgColor={getToothColor(tooth, isAdult)}
                onClick={() => handleToothClick(tooth, isAdult)}
              />
            ))}
          </div>
          <div className="mx-2"></div>
          <div className="d-flex flex-wrap justify-content-center">
            {lowerLeft.map(tooth => (
              <ToothBox
                key={tooth}
                tooth={tooth}
                toothData={data[tooth]}
                bgColor={getToothColor(tooth, isAdult)}
                onClick={() => handleToothClick(tooth, isAdult)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = (type) => {
    const title = type === "adult" ? "Adult Dental Appointment Dashboard" : "Child Dental Appointment Dashboard";

    return (
      <div className="mt-4">
        <hr />
        <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap">
          <h6 className="fw-bold">{title}</h6>
          <button className="btn btn-sm btn-secondary" onClick={() => type === "adult" ? setShowAdultDashboard(false) : setShowChildDashboard(false)}>
            Hide Dashboard
          </button>
        </div>

        <div className="mb-3">
          <label className="form-label fw-bold">Select Date</label>
          <input
            type="date"
            className="form-control w-auto"
            value={selectedDashboardDate}
            onChange={(e) => setSelectedDashboardDate(e.target.value)}
          />
        </div>

        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th style={{ width: "40px" }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={dashboardAppointments.length > 0 && dashboardAppointments.every(app => app.isSelected)}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>S.No</th>
                <th>Patient Name</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Procedure</th>
                <th>Teeth</th>
                <th>Scheduled By</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {dashboardAppointments.length > 0 ? (
                dashboardAppointments.map((app, idx) => (
                  <tr key={app.scheduleId}>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={app.isSelected || false}
                        onChange={() => handleDashboardCheckbox(app.scheduleId)}
                      />
                    </td>
                    <td>{idx + 1}</td>
                    <td>{app.patientName}</td>
                    <td>{app.age}</td>
                    <td>{app.gender}</td>
                    <td>{app.procedureName}</td>
                    <td>{app.toothNumbers}</td>
                    <td>{app.scheduledBy}</td>
                    <td>
                      <span className={`badge ${app.scheduleStatus === 'CLOSED' ? 'bg-success' : app.scheduleStatus === 'IN_PROGRESS' ? 'bg-warning' : 'bg-primary'}`}>
                        {app.scheduleStatus}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-info" onClick={() => setSelectedAppointment(app)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center text-muted">
                    No appointments for this date
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // New Dental Procedure section (Add/Remove row pattern, teeth picked via popup)
  const renderDentalProcedureSection = () => (
    <div className="card mb-4">
      <div className="card-header bg-primary text-white py-2">
        <strong>Dental Procedure</strong>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-bordered table-sm align-middle" style={{ fontSize: "0.8rem" }}>
            <thead className="table-light">
              <tr>
                <th style={{ width: "40px" }}>S.No.</th>
                <th>Tooth No. <span className="text-danger">*</span></th>
                <th>Procedure Name <span className="text-danger">*</span></th>
                <th>Procedure Date</th>
                <th>Appointment <span className="text-danger">*</span></th>
                <th>Remarks</th>
                <th style={{ width: "50px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {procedureRows.map((row, idx) => (
                <tr key={row.id}>
                  <td>{idx + 1}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm w-100 text-start"
                      onClick={() => openTeethSelectModal(row)}
                    >
                      {row.toothNumbers.length > 0 ? row.toothNumbers.join(", ") : "Select teeth..."}
                    </button>
                  </td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={row.procedureId}
                      onChange={(e) => handleProcedureRowChange(row.id, "procedureId", e.target.value)}
                    >
                      <option value="">Select Procedure</option>
                      {procedures.map(proc => (
                        <option key={proc.procedureId} value={proc.procedureId}>
                          {proc.procedureName}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={row.procedureDate}
                      onChange={(e) => handleProcedureRowChange(row.id, "procedureDate", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      className="form-control form-control-sm mb-1"
                      value={row.appointmentDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => handleProcedureRowChange(row.id, "appointmentDate", e.target.value)}
                    />
                    <input
                      type="time"
                      className="form-control form-control-sm"
                      value={row.appointmentTime}
                      onChange={(e) => handleProcedureRowChange(row.id, "appointmentTime", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Optional remarks"
                      value={row.remarks}
                      onChange={(e) => handleProcedureRowChange(row.id, "remarks", e.target.value)}
                    />
                  </td>
                  <td className="text-center">
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveProcedureRow(row.id)}
                      disabled={procedureRows.length === 1}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button className="btn btn-success btn-sm mb-3" onClick={handleAddProcedureRow}>
          + Add Procedure
        </button>

        <div className="d-flex justify-content-end gap-2">
          <button className="btn btn-secondary btn-sm" onClick={handleResetProcedureForm}>
            Reset
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSaveProcedures}>
            Save Procedure
          </button>
        </div>

        {savedProcedures.length > 0 && (
          <div className="table-responsive mt-3">
            <table className="table table-bordered table-sm" style={{ fontSize: "0.75rem" }}>
              <thead className="table-light">
                <tr>
                  <th>S.No.</th>
                  <th>Arch</th>
                  <th>Tooth No.</th>
                  <th>Procedure Name</th>
                  <th>Procedure Date</th>
                  <th>Appointment</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {savedProcedures.map((p, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td className="text-capitalize">{p.arch}</td>
                    <td>{p.toothNumbers.join(", ")}</td>
                    <td>{p.procedureName}</td>
                    <td>{p.procedureDate}</td>
                    <td>{p.appointmentDate} {p.appointmentTime}</td>
                    <td>{p.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // ==================== MAIN RENDER ====================

  const currentSummary = dentalType === "adult" ? adultDentalSummary : childDentalSummary;

  return (
    <div>
      {hideHeader && (
        <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap">
          <h5 className="fw-bold mb-0">Dental Examination</h5>
          <div className="d-flex gap-2 mt-2 mt-sm-0 flex-wrap">
           
          
            <button
              className="btn btn-sm btn-outline-info"
              onClick={() => setShowDentalHistoryModal(true)}
            >
              Dental History
            </button>
            <button
              className="btn btn-sm btn-outline-dark"
              onClick={() => setShowProcedureHistoryModal(true)}
            >
              Dental Procedure History
            </button>
          </div>
        </div>
      )}

      {/* Adult / Child toggle - radio buttons */}
      <div className="d-flex gap-4 mb-3">
        <div className="form-check">
          <input
            className="form-check-input"
            type="radio"
            name="dentalType"
            id="dentalTypeAdult"
            checked={dentalType === "adult"}
            onChange={() => setDentalType("adult")}
          />
          <label className="form-check-label fw-bold" htmlFor="dentalTypeAdult">
            Adult Teeth
          </label>
        </div>
        <div className="form-check">
          <input
            className="form-check-input"
            type="radio"
            name="dentalType"
            id="dentalTypeChild"
            checked={dentalType === "child"}
            onChange={() => setDentalType("child")}
          />
          <label className="form-check-label fw-bold" htmlFor="dentalTypeChild">
            Child Teeth
          </label>
        </div>
      </div>

      {/* Active (Adult or Child) Section */}
      <div className="card mb-4 p-3">
        {renderSummaryRow(currentSummary)}
        {renderToothChart(dentalType === "adult")}
        <div className="mb-3">
          <label className="form-label fw-bold">
            {dentalType === "adult" ? "Adult" : "Child"} Notes / Remarks
          </label>
          <textarea
            className="form-control"
            rows={2}
            value={currentSummary.notes}
            onChange={(e) => {
              const value = e.target.value;
              if (dentalType === "adult") {
                setAdultDentalSummary(prev => ({ ...prev, notes: value }));
              } else {
                setChildDentalSummary(prev => ({ ...prev, notes: value }));
              }
            }}
            placeholder={`Enter ${dentalType} dental notes...`}
          />
        </div>
      </div>

      {/* New Dental Procedure section (replaces old Schedule Procedure button/modal) */}
      {renderDentalProcedureSection()}

      {/* Adult Dashboard */}
      {showAdultDashboard && renderDashboard("adult")}

      {/* Child Dashboard */}
      {showChildDashboard && renderDashboard("child")}

      {/* Save Button */}
      {!hideButtons && (
        <div className="d-flex justify-content-end mt-3">
          <button className="btn btn-primary" onClick={handleSaveNotes}>
            Save Dental Examination
          </button>
        </div>
      )}

      {/* Condition Selection Modal (Normal removed) */}
      {showConditionModal && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5>
                  Tooth {selectedTooth?.number} ({selectedTooth?.isAdult ? "Adult" : "Child"})
                </h5>
                <button className="btn-close" onClick={() => setShowConditionModal(false)} />
              </div>

              <div className="modal-body">
                <div className="row">
                  {toothConditions
                    .filter((condition) => condition.conditionName !== "Normal")
                    .map((condition) => {
                      const checked = (
                        selectedTooth?.isAdult
                          ? teethData[selectedTooth?.number]
                          : childTeethData[selectedTooth?.number]
                      )?.some((item) => item.conditionId === condition.conditionId);

                      const selectedConditions = selectedTooth?.isAdult
                        ? teethData[selectedTooth?.number] || []
                        : childTeethData[selectedTooth?.number] || [];

                      const lockedByExclusiveCondition = hasExclusiveCondition(selectedConditions);
                      const disabled =
                        !checked &&
                        lockedByExclusiveCondition &&
                        !isExclusiveToothCondition(condition);

                      return (
                        <div className="col-md-6 mb-2" key={condition.conditionId}>
                          <div
                            className="border rounded p-2 d-flex align-items-center justify-content-between"
                            style={{
                              cursor: disabled ? "not-allowed" : "pointer",
                              opacity: disabled ? 0.55 : 1,
                            }}
                            onClick={() => {
                              if (!disabled) {
                                handleConditionSelect(condition);
                              }
                            }}
                          >
                            <div className="d-flex align-items-center gap-2">
                              <input type="checkbox" checked={checked} disabled={disabled} readOnly />
                              <span>{condition.conditionName}</span>
                            </div>
                            <span className="badge bg-secondary">{condition.points} pts</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-primary" onClick={() => setShowConditionModal(false)}>
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Select Teeth Modal ====================
          Used from the Dental Procedure table's Tooth No. cell.
          Styled the same way as the Dental History / Procedure History /
          Procedure Details popups: full backdrop overlay + a fixed, offset
          modal container (width: calc(100vw - 310px), left: 285px,
          height: 90vh, margin: 5vh auto). */}
      {showTeethSelectModal && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1040
            }}
            onClick={handleCancelTeethSelect}
          />
          <div
            className="modal show d-block"
            tabIndex={-1}
            role="dialog"
            style={{
              width: "calc(100vw - 310px)",
              left: "285px",
              maxWidth: "none",
              height: "90vh",
              margin: "5vh auto",
              position: "fixed",
              zIndex: 1050,
              pointerEvents: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">Select Teeth</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={handleCancelTeethSelect}
                  />
                </div>
                <div className="modal-body">
                  <div className="text-center mb-2">
                    <span className="badge bg-secondary">Upper Right</span>
                    <span className="mx-4"></span>
                    <span className="badge bg-secondary">Upper Left</span>
                  </div>
                  <div className="d-flex justify-content-center mb-2 flex-wrap">
                    <div className="d-flex flex-wrap justify-content-center">
                      {(teethSelectArch === "adult" ? adultUpperRight : childUpperRight).map(tooth => (
                        <SelectableToothChip
                          key={tooth}
                          tooth={tooth}
                          isSelected={tempSelectedTeeth.includes(tooth)}
                          onClick={() => toggleTempTooth(tooth)}
                        />
                      ))}
                    </div>
                    <div className="mx-3"></div>
                    <div className="d-flex flex-wrap justify-content-center">
                      {(teethSelectArch === "adult" ? adultUpperLeft : childUpperLeft).map(tooth => (
                        <SelectableToothChip
                          key={tooth}
                          tooth={tooth}
                          isSelected={tempSelectedTeeth.includes(tooth)}
                          onClick={() => toggleTempTooth(tooth)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="text-center small text-muted mb-2">Midline</div>

                  <div className="text-center mb-2">
                    <span className="badge bg-secondary">Lower Right</span>
                    <span className="mx-4"></span>
                    <span className="badge bg-secondary">Lower Left</span>
                  </div>
                  <div className="d-flex justify-content-center mb-3 flex-wrap">
                    <div className="d-flex flex-wrap justify-content-center">
                      {(teethSelectArch === "adult" ? adultLowerRight : childLowerRight).map(tooth => (
                        <SelectableToothChip
                          key={tooth}
                          tooth={tooth}
                          isSelected={tempSelectedTeeth.includes(tooth)}
                          onClick={() => toggleTempTooth(tooth)}
                        />
                      ))}
                    </div>
                    <div className="mx-3"></div>
                    <div className="d-flex flex-wrap justify-content-center">
                      {(teethSelectArch === "adult" ? adultLowerLeft : childLowerLeft).map(tooth => (
                        <SelectableToothChip
                          key={tooth}
                          tooth={tooth}
                          isSelected={tempSelectedTeeth.includes(tooth)}
                          onClick={() => toggleTempTooth(tooth)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="border-top pt-2">
                    <label className="form-label fw-bold small mb-1">Selected Teeth</label>
                    <div>
                      {tempSelectedTeeth.length > 0 ? (
                        tempSelectedTeeth.map(tooth => (
                          <span key={tooth} className="badge bg-primary me-1 mb-1">
                            {tooth}{" "}
                            <span
                              style={{ cursor: "pointer" }}
                              onClick={() => toggleTempTooth(tooth)}
                            >
                              ✕
                            </span>
                          </span>
                        ))
                      ) : (
                        <span className="text-muted small">No teeth selected</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary btn-sm" onClick={handleCancelTeethSelect}>
                    Cancel
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={handleConfirmTeethSelect}>
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Appointment Detail Modal */}
      {showDetailModal && selectedAppointment && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Appointment Details</h5>
                <button type="button" className="btn-close" onClick={() => setShowDetailModal(false)}></button>
              </div>
              <div className="modal-body">
                <p><strong>Patient:</strong> {selectedAppointment.patientName}</p>
                <p><strong>Procedure:</strong> {selectedAppointment.procedureName}</p>
                <p><strong>Teeth:</strong> {selectedAppointment.toothNumbers}</p>
                <p><strong>Date:</strong> {selectedDashboardDate}</p>
                <p><strong>Scheduled By:</strong> {selectedAppointment.scheduledBy}</p>
                <p><strong>Status:</strong> {selectedAppointment.scheduleStatus}</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Dental History Modal ====================
          Styled the same way as the "Past Diet Orders History" popup:
          full backdrop overlay + a fixed, offset modal container
          (width: calc(100vw - 310px), left: 285px, height: 90vh, margin: 5vh auto) */}
      {showDentalHistoryModal && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1040
            }}
            onClick={() => setShowDentalHistoryModal(false)}
          />
          <div
            className="modal show d-block"
            tabIndex={-1}
            role="dialog"
            style={{
              width: "calc(100vw - 310px)",
              left: "285px",
              maxWidth: "none",
              height: "90vh",
              margin: "5vh auto",
              position: "fixed",
              zIndex: 1050,
              pointerEvents: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-dialog modal-dialog-centered modal-xl" role="document">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">Dental History</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowDentalHistoryModal(false)}
                  />
                </div>
                <div className="modal-body">
                  <div className="card shadow-sm">
                    <div className="card-header bg-secondary text-white py-2">
                      <strong>Past Dental Visit Records</strong>
                    </div>
                    <div className="card-body p-0">
                      <div className="table-responsive">
                        <table className="table table-bordered table-hover mb-0 align-middle" style={{ fontSize: '0.8rem' }}>
                          <thead className="table-light">
                            <tr>
                              <th>Date</th>
                              <th>DDS</th>
                              <th>Missing</th>
                              <th>Decayed</th>
                              <th>Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dentalHistoryData.length > 0 ? (
                              dentalHistoryData.map(record => (
                                <tr key={record.id}>
                                  <td>{record.date}</td>
                                  <td>{record.dds}</td>
                                  <td>{record.missing}</td>
                                  <td>{record.decayed}</td>
                                  <td>{record.notes}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="text-center text-muted py-3">
                                  No dental history is available for this patient yet.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowDentalHistoryModal(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ==================== Dental Procedure History Modal ====================
          Same backdrop + fixed offset modal styling as above. */}
      {showProcedureHistoryModal && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1040
            }}
            onClick={() => setShowProcedureHistoryModal(false)}
          />
          <div
            className="modal show d-block"
            tabIndex={-1}
            role="dialog"
            style={{
              width: "calc(100vw - 310px)",
              left: "285px",
              maxWidth: "none",
              height: "90vh",
              margin: "5vh auto",
              position: "fixed",
              zIndex: 1050,
              pointerEvents: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-dialog modal-dialog-centered modal-xl" role="document">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">Past Dental Procedure History</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowProcedureHistoryModal(false)}
                  />
                </div>
                <div className="modal-body">
                  <div className="card shadow-sm">
                    <div className="card-header bg-secondary text-white py-2">
                      <strong>Procedures</strong>
                    </div>
                    <div className="card-body p-0">
                      <div className="table-responsive">
                        <table className="table table-bordered table-hover mb-0 align-middle" style={{ fontSize: '0.8rem' }}>
                          <thead className="table-light">
                            <tr>
                              <th>S.No.</th>
                              <th>Procedure Name</th>
                              <th>Tooth No.</th>
                              <th>Status</th>
                              <th>First Sitting Date</th>
                              <th>Details</th>
                            </tr>
                          </thead>
                          <tbody>
                            {procedureHistoryData.length > 0 ? (
                              procedureHistoryData.map((item, idx) => (
                                <tr key={item.id}>
                                  <td>{idx + 1}</td>
                                  <td className="fw-bold">{item.procedureName}</td>
                                  <td>{item.toothNo}</td>
                                  <td>
                                    <span className={`badge ${item.status === 'Completed' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                      {item.status}
                                    </span>
                                  </td>
                                  <td>{item.firstSittingDate}</td>
                                  <td>
                                    <button
                                      className="btn btn-link btn-sm p-0"
                                      onClick={() => openProcedureDetail(item)}
                                    >
                                      View Details
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="text-center text-muted py-3">
                                  No dental procedure history is available for this patient yet.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowProcedureHistoryModal(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ==================== Procedure Details Modal (View Details) ====================
          Opened from a row in the Dental Procedure History table. Same popup styling family. */}
      {showProcedureDetailModal && selectedProcedureHistory && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1065
            }}
            onClick={closeProcedureDetail}
          />
          <div
            className="modal show d-block"
            tabIndex={-1}
            role="dialog"
            style={{
              width: "calc(100vw - 310px)",
              left: "285px",
              maxWidth: "none",
              height: "90vh",
              margin: "5vh auto",
              position: "fixed",
              zIndex: 1070,
              pointerEvents: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">Procedure Details</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={closeProcedureDetail}
                  />
                </div>
                <div className="modal-body">
                  <div className="row mb-3">
                    <div className="col-md-6 mb-2">
                      <strong>Procedure:</strong> {selectedProcedureHistory.procedureName}
                    </div>
                    <div className="col-md-6 mb-2">
                      <strong>Tooth No.:</strong> {selectedProcedureHistory.toothNo}
                    </div>
                    <div className="col-md-6 mb-2">
                      <strong>Advised By:</strong> {selectedProcedureHistory.advisedBy}
                    </div>
                    <div className="col-md-6 mb-2">
                      <strong>Advised Date:</strong> {selectedProcedureHistory.advisedDate}
                    </div>
                    <div className="col-md-4 mb-2">
                      <strong>Planned Sittings:</strong> {selectedProcedureHistory.plannedSittings}
                    </div>
                    <div className="col-md-4 mb-2">
                      <strong>Completed Sittings:</strong> {selectedProcedureHistory.completedSittings}
                    </div>
                    <div className="col-md-4 mb-2">
                      <strong>Procedure Status:</strong>{" "}
                      <span className={`badge ${selectedProcedureHistory.status === 'Completed' ? 'bg-success' : 'bg-warning text-dark'}`}>
                        {selectedProcedureHistory.status}
                      </span>
                    </div>
                  </div>

                  <hr />

                  <h6 className="fw-bold mb-3">Sitting History</h6>
                  {selectedProcedureHistory.sittings.map((sitting) => (
                    <div key={sitting.sittingNo} className="border rounded p-3 mb-3">
                      <h6 className="text-primary mb-2">Sitting {sitting.sittingNo}</h6>
                      <div className="row small">
                        <div className="col-md-6 mb-1">
                          <strong>Scheduled Date/Time:</strong> {sitting.scheduledDateTime}
                        </div>
                        <div className="col-md-6 mb-1">
                          <strong>Performed Date/Time:</strong> {sitting.performedDateTime}
                        </div>
                        <div className="col-md-6 mb-1">
                          <strong>Performed By:</strong> {sitting.performedBy}
                        </div>
                        <div className="col-md-6 mb-1">
                          <strong>Status:</strong> {sitting.status}
                        </div>
                        <div className="col-12 mb-1">
                          <strong>Findings:</strong> {sitting.findings}
                        </div>
                        <div className="col-12 mb-1">
                          <strong>Procedure Notes:</strong> {sitting.procedureNotes}
                        </div>
                        <div className="col-md-6 mb-1">
                          <strong>Complication:</strong> {sitting.complication}
                        </div>
                        <div className="col-md-6 mb-1">
                          <strong>Post Procedure Advice:</strong> {sitting.postProcedureAdvice}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary btn-sm" onClick={closeProcedureDetail}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DentalSection;
