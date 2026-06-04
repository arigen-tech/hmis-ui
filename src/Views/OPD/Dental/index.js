
import React, { useState, useEffect } from "react";

const DentalSection = ({ patientId, visitId, hideHeader = false, hideButtons = false }) => {
  // ==================== STATE VARIABLES ====================
  
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
    dentalPoints: 0,
    notes: ""
  });

  const [childDentalSummary, setChildDentalSummary] = useState({
    totalTeeth: 20,
    missingTeeth: 0,
    unsalvageableTeeth: 0,
    otherConditionsCount: 0,
    dentalPoints: 0,
    notes: ""
  });

  // Procedure scheduling state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedTeeth, setSelectedTeeth] = useState([]);
  const [scheduleData, setScheduleData] = useState({
    procedureId: "",
    appointmentDate: "",
    appointmentType: "FIRST_APPOINTMENT",
    totalSittings: 1
  });
  const [procedures, setProcedures] = useState([]);
  
  // Dental history & dashboard state
  const [showDentalHistory, setShowDentalHistory] = useState(false);
  const [dentalHistory, setDentalHistory] = useState([]);
  const [showAdultDashboard, setShowAdultDashboard] = useState(false);
  const [showChildDashboard, setShowChildDashboard] = useState(false);
  const [selectedDashboardDate, setSelectedDashboardDate] = useState(new Date().toISOString().split("T")[0]);
  const [dashboardAppointments, setDashboardAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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
      { scheduleId: 1, patientName: "Ramesh Kumar", age: 35, gender: "Male", procedureName: "Root Canal Treatment", toothNumbers: "16,17", scheduledBy: "Dr. Sharma", scheduleStatus: "OPEN", isSelected: false },
      { scheduleId: 2, patientName: "Sita Devi", age: 42, gender: "Female", procedureName: "Tooth Extraction", toothNumbers: "24", scheduledBy: "Dr. Verma", scheduleStatus: "IN_PROGRESS", isSelected: false }
    ],
    "2025-01-15": [
      { scheduleId: 3, patientName: "Amit Singh", age: 28, gender: "Male", procedureName: "Dental Filling", toothNumbers: "14,15", scheduledBy: "Dr. Sharma", scheduleStatus: "OPEN", isSelected: false }
    ]
  };

  // ==================== INITIALIZATION ====================
  
  useEffect(() => {
    setToothConditions(mockToothConditions);
    setProcedures(mockProcedures);
    
    // Initialize adult teeth data
    const initialAdultTeeth = {};
    [...adultUpperRight, ...adultUpperLeft, ...adultLowerLeft, ...adultLowerRight].forEach(tooth => {
    //   initialAdultTeeth[tooth] = mockToothConditions[0];
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
  
  const calculateAdultDentalSummary = () => {
    let missingCount = 0;
    let unsalvageableCount = 0;
    let otherConditionsCount = 0;
    let totalPoints = 0;

    Object.values(teethData).forEach(condition => {
      if (condition && condition.isMissing) missingCount++;
      else if (condition && condition.isUnsalvageable) unsalvageableCount++;
      else if (condition && condition.conditionName !== "Normal") otherConditionsCount++;
      if (condition) totalPoints += condition.points || 0;
    });

    setAdultDentalSummary(prev => ({
      totalTeeth: 32,
      missingTeeth: missingCount,
      unsalvageableTeeth: unsalvageableCount,
      otherConditionsCount: otherConditionsCount,
      dentalPoints: totalPoints,
      notes: prev.notes
    }));
  };

  const calculateChildDentalSummary = () => {
    let missingCount = 0;
    let unsalvageableCount = 0;
    let otherConditionsCount = 0;
    let totalPoints = 0;

    Object.values(childTeethData).forEach(condition => {
      if (condition && condition.isMissing) missingCount++;
      else if (condition && condition.isUnsalvageable) unsalvageableCount++;
      else if (condition && condition.conditionName !== "Normal") otherConditionsCount++;
      if (condition) totalPoints += condition.points || 0;
    });

    setChildDentalSummary(prev => ({
      totalTeeth: 20,
      missingTeeth: missingCount,
      unsalvageableTeeth: unsalvageableCount,
      otherConditionsCount: otherConditionsCount,
      dentalPoints: totalPoints,
      notes: prev.notes
    }));
  };


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
  if (showScheduleModal) {
    setSelectedTeeth(prev =>
      prev.includes(toothNumber)
        ? prev.filter(t => t !== toothNumber)
        : [...prev, toothNumber]
    );
  } else {
    setSelectedTooth({
  number: toothNumber,
  isAdult
});
    setShowConditionModal(true);
  }
};

const handleConditionSelect = (condition) => {

  if (!selectedTooth) return;

  const { number, isAdult } = selectedTooth;

  const currentData = isAdult ? teethData : childTeethData;

  const existingConditions = currentData[number] || [];

  const alreadySelected = existingConditions.find(
    (item) => item.conditionId === condition.conditionId
  );

  let updatedConditions = [];

  if (alreadySelected) {

    updatedConditions = existingConditions.filter(
      (item) => item.conditionId !== condition.conditionId
    );

  } else {

    updatedConditions = [
      ...existingConditions,
      condition,
    ];
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

  Object.values(updatedData).forEach((conditions) => {

    conditions.forEach((condition) => {

      if (condition.isMissing) {
        missing++;
      }

      if (condition.isUnsalvageable) {
        unsalvageable++;
      }

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
    dentalPoints: points
  }));
};

const calculateChildSummary = (updatedData) => {

  let missing = 0;
  let unsalvageable = 0;
  let points = 0;
  let otherConditions = 0;

  Object.values(updatedData).forEach((conditions) => {

    conditions.forEach((condition) => {

      if (condition.isMissing) {
        missing++;
      }

      if (condition.isUnsalvageable) {
        unsalvageable++;
      }

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
    dentalPoints: points
  }));
};

  const handleSelectAll = () => {
    const allSelected = dashboardAppointments.length > 0 && dashboardAppointments.every(app => app.isSelected);
    setDashboardAppointments(prev => 
      prev.map(app => ({ ...app, isSelected: !allSelected }))
    );
  };

  const handleScheduleProcedure = () => {
    if (!scheduleData.procedureId || !scheduleData.appointmentDate) {
      alert("Please select procedure and appointment date");
      return;
    }
    alert("Procedure scheduled successfully!");
    setShowScheduleModal(false);
    setSelectedTeeth([]);
    setScheduleData({
      procedureId: "",
      appointmentDate: "",
      appointmentType: "FIRST_APPOINTMENT",
      totalSittings: 1
    });
  };

  const handleSaveNotes = () => {
    console.log("Saving dental notes:", { adultDentalSummary, childDentalSummary });
    alert("Dental examination saved successfully!");
  };

  const startToothSelection = () => {
    setSelectedTeeth([]);
    setShowScheduleModal(true);
  };

  const cancelSelection = () => {
    setSelectedTeeth([]);
    setShowScheduleModal(false);
  };

  // ==================== TOOTH BOX COMPONENT ====================
const ToothBox = ({
  tooth,
  toothData,
  isSelected,
  isSelectionMode,
  bgColor,
  onClick
}) => {

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
          border: isSelected ? "3px solid #000" : "1px solid #dee2e6",
        }}
      >
        {tooth}
      </div>

      {!isSelectionMode && (
        <div className="mt-1 text-start">

          {selectedConditions.map((condition) => (
            <div
              key={condition.conditionId}
              className="d-flex align-items-center gap-1"
              style={{ fontSize: "10px" }}
            >
              <input
                type="checkbox"
                checked
                readOnly
              />

              <span>
                {condition.conditionName}
              </span>
            </div>
          ))}

        </div>
      )}

    </div>
  );
};
  // ==================== RENDER FUNCTIONS ====================
  
  const renderAdultToothChart = () => (
    <div className="mb-2">
      <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap">
        <h6 className="fw-bold text-primary">Adult Teeth</h6>
        <div className="d-flex gap-1 mt-1 mt-sm-0">
          {showScheduleModal ? (
            <>
              <button className="btn btn-sm btn-secondary" onClick={cancelSelection}>
                Cancel Selection
              </button>
              <button className="btn btn-sm btn-success" onClick={() => setShowScheduleModal(true)}>
                Proceed ({selectedTeeth.length} selected)
              </button>
            </>
          ) : (
            <button className="btn btn-sm btn-primary" onClick={startToothSelection}>
              Schedule Procedure
            </button>
          )}
        </div>
      </div>

      <div className="d-flex justify-content-center gap-2 mb-2 flex-wrap">
        <span><span className="badge bg-success">🟢</span> Normal</span>
        <span><span className="badge bg-warning">🟡</span> Condition</span>
        <span><span className="badge bg-danger">🔴</span> Missing</span>
        <span><span className="badge" style={{backgroundColor: "#fd7e14", color: "white"}}>🟠</span> Unsalvageable</span>
        {showScheduleModal && <span><span className="badge bg-primary">🔵</span> Selected</span>}
      </div>

      <div className="text-center mb-2">
        <span className="badge bg-secondary">Upper Right</span>
        <span className="mx-4"></span>
        <span className="badge bg-secondary">Upper Left</span>
      </div>
      <div className="d-flex justify-content-center mb-2 flex-wrap">
        <div className="d-flex flex-wrap justify-content-center">
          {adultUpperRight.map(tooth => (
            <ToothBox
              key={tooth}
              tooth={tooth}
              toothData={teethData[tooth]} 
              isSelected={selectedTeeth.includes(tooth)}
              isSelectionMode={showScheduleModal}
              bgColor={showScheduleModal && selectedTeeth.includes(tooth) ? "#0d6efd" : getToothColor(tooth, true)}
              onClick={() => handleToothClick(tooth, true)}
            />
          ))}
        </div>
        <div className="mx-2"></div>
        <div className="d-flex flex-wrap justify-content-center">
          {adultUpperLeft.map(tooth => (
            <ToothBox
              key={tooth}
              tooth={tooth}
              toothData={teethData[tooth]}
              isSelected={selectedTeeth.includes(tooth)}
              isSelectionMode={showScheduleModal}
              bgColor={showScheduleModal && selectedTeeth.includes(tooth) ? "#0d6efd" : getToothColor(tooth, true)}
              onClick={() => handleToothClick(tooth, true)}
            />
          ))}
        </div>
      </div>

<div className="text-center small text-muted mb-2">
  Midline
</div>
      <div className="text-center mb-2">
        <span className="badge bg-secondary">Lower Left</span>
        <span className="mx-4"></span>
        <span className="badge bg-secondary">Lower Right</span>
      </div>
      <div className="d-flex justify-content-center flex-wrap">
        <div className="d-flex flex-wrap justify-content-center">
          {adultLowerLeft.map(tooth => (
            <ToothBox
              key={tooth}
              tooth={tooth}
              toothData={teethData[tooth]}
              isSelected={selectedTeeth.includes(tooth)}
              isSelectionMode={showScheduleModal}
              bgColor={showScheduleModal && selectedTeeth.includes(tooth) ? "#0d6efd" : getToothColor(tooth, true)}
              onClick={() => handleToothClick(tooth, true)}
            />
          ))}
        </div>
        <div className="mx-2"></div>
        <div className="d-flex flex-wrap justify-content-center">
          {adultLowerRight.map(tooth => (
            <ToothBox
              key={tooth}
              tooth={tooth}
              toothData={teethData[tooth]}
              isSelected={selectedTeeth.includes(tooth)}
              isSelectionMode={showScheduleModal}
              bgColor={showScheduleModal && selectedTeeth.includes(tooth) ? "#0d6efd" : getToothColor(tooth, true)}
              onClick={() => handleToothClick(tooth, true)}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderChildToothChart = () => (
    <div className="mb-4">
      <h6 className="fw-bold text-success mb-3">Child Teeth</h6>

      <div className="d-flex justify-content-center gap-2 mb-2 flex-wrap">
        <span><span className="badge bg-success">🟢</span> Normal</span>
        <span><span className="badge bg-warning">🟡</span> Condition</span>
        <span><span className="badge bg-danger">🔴</span> Missing</span>
        <span><span className="badge" style={{backgroundColor: "#fd7e14", color: "white"}}>🟠</span> Unsalvageable</span>
      </div>

      <div className="text-center mb-2">
        <span className="badge bg-secondary">Upper Right</span>
        <span className="mx-4"></span>
        <span className="badge bg-secondary">Upper Left</span>
      </div>
      <div className="d-flex justify-content-center mb-2 flex-wrap">
        <div className="d-flex flex-wrap justify-content-center">
          {childUpperRight.map(tooth => (
            <ToothBox
              key={tooth}
              tooth={tooth}
              toothData={childTeethData[tooth]}
              isSelected={false}
              isSelectionMode={false}
              bgColor={getToothColor(tooth, false)}
              onClick={() => handleToothClick(tooth, false)}
            />
          ))}
        </div>
        <div className="mx-2"></div>
        <div className="d-flex flex-wrap justify-content-center">
          {childUpperLeft.map(tooth => (
            <ToothBox
              key={tooth}
              tooth={tooth}
              toothData={childTeethData[tooth]}
              isSelected={false}
              isSelectionMode={false}
              bgColor={getToothColor(tooth, false)}
              onClick={() => handleToothClick(tooth, false)}
            />
          ))}
        </div>
      </div>

<div className="text-center small text-muted mb-2">
  Midline
</div>
      <div className="text-center mb-2">
        <span className="badge bg-secondary">Lower Left</span>
        <span className="mx-4"></span>
        <span className="badge bg-secondary">Lower Right</span>
      </div>
      <div className="d-flex justify-content-center flex-wrap">
        <div className="d-flex flex-wrap justify-content-center">
          {childLowerLeft.map(tooth => (
            <ToothBox
              key={tooth}
              tooth={tooth}
              toothData={childTeethData[tooth]}
              isSelected={false}
              isSelectionMode={false}
              bgColor={getToothColor(tooth, false)}
              onClick={() => handleToothClick(tooth, false)}
            />
          ))}
        </div>
        <div className="mx-2"></div>
        <div className="d-flex flex-wrap justify-content-center">
          {childLowerRight.map(tooth => (
            <ToothBox
              key={tooth}
              tooth={tooth}
              toothData={childTeethData[tooth]}
              isSelected={false}
              isSelectionMode={false}
              bgColor={getToothColor(tooth, false)}
              onClick={() => handleToothClick(tooth, false)}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderAdultSummaryCards = () => (
    <div className="row mb-2">
      <div className="col-md-3 col-6 mb-2">
        <div className="card bg-primary text-white">
          <div className="card-body p-2 p-md-3">
            <h6 className="mb-0 small">Total Teeth</h6>
            <h3 className="mb-0">{adultDentalSummary.totalTeeth}</h3>
          </div>
        </div>
      </div>
      <div className="col-md-3 col-6 mb-2">
        <div className="card bg-danger text-white">
          <div className="card-body p-2 p-md-3">
            <h6 className="mb-0 small">Missing</h6>
            <h3 className="mb-0">{adultDentalSummary.missingTeeth}</h3>
          </div>
        </div>
      </div>
      <div className="col-md-3 col-6 mb-2">
        <div className="card bg-warning text-dark">
          <div className="card-body p-2 p-md-3">
            <h6 className="mb-0 small">Unsalvageable</h6>
            <h3 className="mb-0">{adultDentalSummary.unsalvageableTeeth}</h3>
          </div>
        </div>
      </div>
      <div className="col-md-3 col-6 mb-2">
        <div className="card bg-success text-white">
          <div className="card-body p-2 p-md-3">
            <h6 className="mb-0 small">DDS Points</h6>
            <h3 className="mb-0">{adultDentalSummary.dentalPoints}</h3>
          </div>
        </div>
      </div>
    </div>
  );

  const renderChildSummaryCards = () => (
    <div className="row mb-2">
      <div className="col-md-3 col-6 mb-2">
        <div className="card bg-info text-white">
          <div className="card-body p-2 p-md-3">
            <h6 className="mb-0 small">Total Teeth</h6>
            <h3 className="mb-0">{childDentalSummary.totalTeeth}</h3>
          </div>
        </div>
      </div>
      <div className="col-md-3 col-6 mb-2">
        <div className="card bg-danger text-white">
          <div className="card-body p-2 p-md-3">
            <h6 className="mb-0 small">Missing</h6>
            <h3 className="mb-0">{childDentalSummary.missingTeeth}</h3>
          </div>
        </div>
      </div>
      <div className="col-md-3 col-6 mb-2">
        <div className="card bg-warning text-dark">
          <div className="card-body p-2 p-md-3">
            <h6 className="mb-0 small">Unsalvageable</h6>
            <h3 className="mb-0">{childDentalSummary.unsalvageableTeeth}</h3>
          </div>
        </div>  
      </div>
      <div className="col-md-3 col-6 mb-2">
        <div className="card bg-success text-white">
          <div className="card-body p-2 p-md-3">
            <h6 className="mb-0 small">DDS Points</h6>
            <h3 className="mb-0">{childDentalSummary.dentalPoints}</h3>
          </div>
        </div>
      </div>
    </div>
  );

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

  // ==================== MAIN RENDER ====================
  
  return (
    <div>
      {!hideHeader && (
        <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap">
          <h5 className="fw-bold mb-0">Dental Examination</h5>
          <div className="d-flex gap-2 mt-2 mt-sm-0 flex-wrap">
            <button 
              className="btn btn-sm btn-outline-info"
              onClick={() => setShowDentalHistory(!showDentalHistory)}
            >
              {showDentalHistory ? "Hide History" : "Show History"}
            </button>
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={() => {
                setShowAdultDashboard(!showAdultDashboard);
                setShowChildDashboard(false);
              }}
            >
              {showAdultDashboard ? "Hide Adult Dashboard" : "Show Adult Dashboard"}
            </button>
            <button 
              className="btn btn-sm btn-outline-success"
              onClick={() => {
                setShowChildDashboard(!showChildDashboard);
                setShowAdultDashboard(false);
              }}
            >
              {showChildDashboard ? "Hide Child Dashboard" : "Show Child Dashboard"}
            </button>
          </div>
        </div>
      )}

      {/* Adult Section */}
      <div className="card mb-4 p-3">
        {renderAdultSummaryCards()}
        {renderAdultToothChart()}
        <div className="mb-3">
          <label className="form-label fw-bold">Adult Notes / Remarks</label>
          <textarea
            className="form-control"
            rows={2}
            value={adultDentalSummary.notes}
            onChange={(e) => setAdultDentalSummary(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Enter adult dental notes..."
          />
        </div>
      </div>

      {/* Child Section */}
      <div className="card mb-4 p-3">
        {renderChildSummaryCards()}
        {renderChildToothChart()}
        <div className="mb-3">
          <label className="form-label fw-bold">Child Notes / Remarks</label>
          <textarea
            className="form-control"
            rows={2}
            value={childDentalSummary.notes}
            onChange={(e) => setChildDentalSummary(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Enter child dental notes..."
          />
        </div>
      </div>

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

      {/* Condition Selection Modal */}
{showConditionModal && (

  <div
    className="modal d-block"
    style={{ background: "rgba(0,0,0,0.4)" }}
  >

    <div className="modal-dialog modal-dialog-centered">

      <div className="modal-content">

        <div className="modal-header">

         <h5>
  Tooth {selectedTooth?.number} ({selectedTooth?.isAdult ? "Adult" : "Child"})
</h5>

          <button
            className="btn-close"
            onClick={() => setShowConditionModal(false)}
          />

        </div>

        <div className="modal-body">

          <div className="row">

            {toothConditions.map((condition) => {

              const checked = (
  selectedTooth?.isAdult
    ? teethData[selectedTooth?.number]
    : childTeethData[selectedTooth?.number]
)?.some(
                (item) => item.conditionId === condition.conditionId
              );

              return (

                <div
                  className="col-md-6 mb-2"
                  key={condition.conditionId}
                >

                  <div
                    className="border rounded p-2 d-flex align-items-center justify-content-between"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleConditionSelect(condition)}
                  >

                    <div className="d-flex align-items-center gap-2">

                      <input
                        type="checkbox"
                        checked={checked}
                        readOnly
                      />

                      <span>
                        {condition.conditionName}
                      </span>

                    </div>

                    <span className="badge bg-secondary">
                      {condition.points} pts
                    </span>

                  </div>

                </div>
              );
            })}

          </div>

        </div>

        <div className="modal-footer">

          <button
            className="btn btn-primary"
            onClick={() => setShowConditionModal(false)}
          >
            Done
          </button>

        </div>

      </div>

    </div>

  </div>
)}
      {/* Procedure Schedule Modal */}
      {showScheduleModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Schedule Dental Procedure</h5>
                <button type="button" className="btn-close" onClick={() => setShowScheduleModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-bold">Selected Teeth</label>
                  <div className="form-control bg-light">
                    {selectedTeeth.length > 0 ? selectedTeeth.join(", ") : "No teeth selected"}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Procedure</label>
                  <select
                    className="form-select"
                    value={scheduleData.procedureId}
                    onChange={(e) => {
                      const procedure = procedures.find(p => p.procedureId === parseInt(e.target.value));
                      setScheduleData(prev => ({ 
                        ...prev, 
                        procedureId: e.target.value,
                        totalSittings: procedure?.defaultSittings || 1
                      }));
                    }}
                  >
                    <option value="">Select Procedure</option>
                    {procedures.map(proc => (
                      <option key={proc.procedureId} value={proc.procedureId}>
                        {proc.procedureName} ({proc.defaultSittings} sitting{proc.defaultSittings > 1 ? 's' : ''})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Appointment Type</label>
                  <select
                    className="form-select"
                    value={scheduleData.appointmentType}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, appointmentType: e.target.value }))}
                  >
                    <option value="FIRST_APPOINTMENT">First Appointment</option>
                    <option value="FOLLOWUP_APPOINTMENT">Follow-up Appointment</option>
                    <option value="FINAL_SITTING">Final Sitting</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Appointment Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={scheduleData.appointmentDate}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, appointmentDate: e.target.value }))}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Total Sittings Required</label>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    max="10"
                    value={scheduleData.totalSittings}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, totalSittings: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowScheduleModal(false)}>
                  Cancel                </button>
                <button className="btn btn-primary" onClick={handleScheduleProcedure}>
                  Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
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
    </div>
  );
};

export default DentalSection;