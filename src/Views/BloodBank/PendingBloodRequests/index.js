import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const PendingBloodRequests = () => {
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentView, setCurrentView] = useState("list");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Unit selection state
  const [showUnitSelection, setShowUnitSelection] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [selectedUnits, setSelectedUnits] = useState([]);

  // Search state
  const [searchFilters, setSearchFilters] = useState({
    patientName: "",
    department: ""
  });

  // Mock data for pending requests (from details table)
  const [pendingRequests, setPendingRequests] = useState([
    {
      id: 1,
      requestId: "BR-101",
      patientName: "Rahul Sharma",
      ipNo: "IP-000123",
      department: "ICU",
      doctor: "Dr. Mehta",
      requestDate: "2026-03-10T10:30:00",
      componentType: "PRBC - Packed Red Blood Cells",
      units: 2,
      urgency: "Emergency",
      requiredDateTime: "2026-03-10T12:30",
      indication: "Surgery",
      status: "Pending",
      headerInfo: {
        requestNo: "BR-101",
        patientName: "Rahul Sharma",
        ipNo: "IP-000123",
        ageGender: "45 / Male",
        bloodGroup: "B+",
        department: "ICU",
        treatingDoctor: "Dr. Mehta",
        requestDate: "2026-03-10T10:30:00",
        urgency: "Emergency"
      }
    },
    {
      id: 2,
      requestId: "BR-101",
      patientName: "Rahul Sharma",
      ipNo: "IP-000123",
      department: "ICU",
      doctor: "Dr. Mehta",
      requestDate: "2026-03-10T10:30:00",
      componentType: "Platelets",
      units: 1,
      urgency: "Routine",
      requiredDateTime: "2026-03-10T18:00",
      indication: "Bleeding",
      status: "Pending",
      headerInfo: {
        requestNo: "BR-101",
        patientName: "Rahul Sharma",
        ipNo: "IP-000123",
        ageGender: "45 / Male",
        bloodGroup: "B+",
        department: "ICU",
        treatingDoctor: "Dr. Mehta",
        requestDate: "2026-03-10T10:30:00",
        urgency: "Routine"
      }
    },
    {
      id: 3,
      requestId: "BR-102",
      patientName: "Neha Singh",
      ipNo: "IP-000145",
      department: "OT",
      doctor: "Dr. Gupta",
      requestDate: "2026-03-10T11:15:00",
      componentType: "PRBC - Packed Red Blood Cells",
      units: 3,
      urgency: "Emergency",
      requiredDateTime: "2026-03-10T13:00",
      indication: "Surgery",
      status: "Pending",
      headerInfo: {
        requestNo: "BR-102",
        patientName: "Neha Singh",
        ipNo: "IP-000145",
        ageGender: "32 / Female",
        bloodGroup: "O+",
        department: "OT",
        treatingDoctor: "Dr. Gupta",
        requestDate: "2026-03-10T11:15:00",
        urgency: "Emergency"
      }
    },
    {
      id: 4,
      requestId: "BR-103",
      patientName: "Amit Kumar",
      ipNo: "IP-000178",
      department: "Emergency",
      doctor: "Dr. Sharma",
      requestDate: "2026-03-09T22:45:00",
      componentType: "Plasma",
      units: 2,
      urgency: "Urgent",
      requiredDateTime: "2026-03-10T01:00",
      indication: "Trauma",
      status: "Pending",
      headerInfo: {
        requestNo: "BR-103",
        patientName: "Amit Kumar",
        ipNo: "IP-000178",
        ageGender: "28 / Male",
        bloodGroup: "AB+",
        department: "Emergency",
        treatingDoctor: "Dr. Sharma",
        requestDate: "2026-03-09T22:45:00",
        urgency: "Urgent"
      }
    },
    {
      id: 5,
      requestId: "BR-103",
      patientName: "Amit Kumar",
      ipNo: "IP-000178",
      department: "Emergency",
      doctor: "Dr. Sharma",
      requestDate: "2026-03-09T22:45:00",
      componentType: "PRBC - Packed Red Blood Cells",
      units: 4,
      urgency: "Emergency",
      requiredDateTime: "2026-03-10T01:00",
      indication: "Trauma",
      status: "Pending",
      headerInfo: {
        requestNo: "BR-103",
        patientName: "Amit Kumar",
        ipNo: "IP-000178",
        ageGender: "28 / Male",
        bloodGroup: "AB+",
        department: "Emergency",
        treatingDoctor: "Dr. Sharma",
        requestDate: "2026-03-09T22:45:00",
        urgency: "Emergency"
      }
    }
  ]);

  // Mock data for available PRBC units
  const [availableUnits, setAvailableUnits] = useState([
    { 
      id: 1, 
      unitNo: "BAG-2026-001", 
      bloodGroup: "B+", 
      volume: 350, 
      expiryDate: "2026-05-15", 
      compatibility: "Compatible", 
      status: "Available" 
    },
    { 
      id: 2, 
      unitNo: "BAG-2026-002", 
      bloodGroup: "B+", 
      volume: 350, 
      expiryDate: "2026-05-20", 
      compatibility: "Compatible", 
      status: "Available" 
    },
    { 
      id: 3, 
      unitNo: "BAG-2026-003", 
      bloodGroup: "O+", 
      volume: 350, 
      expiryDate: "2026-04-30", 
      compatibility: "Compatible", 
      status: "Available" 
    },
    { 
      id: 4, 
      unitNo: "BAG-2026-004", 
      bloodGroup: "O+", 
      volume: 350, 
      expiryDate: "2026-06-10", 
      compatibility: "Compatible", 
      status: "Available" 
    },
    { 
      id: 5, 
      unitNo: "BAG-2026-005", 
      bloodGroup: "B-", 
      volume: 350, 
      expiryDate: "2026-05-05", 
      compatibility: "Cross-match pending", 
      status: "Quarantined" 
    },
    { 
      id: 6, 
      unitNo: "BAG-2026-006", 
      bloodGroup: "AB+", 
      volume: 350, 
      expiryDate: "2026-04-25", 
      compatibility: "Compatible", 
      status: "Available" 
    }
  ]);

  // Mock data for component details when viewing a request
  const [componentDetails, setComponentDetails] = useState([]);

  // Department options for dropdown
  const departmentOptions = [
    { id: "", name: "All Departments" },
    { id: "Ward", name: "Ward" },
    { id: "ICU", name: "ICU" },
    { id: "OT", name: "OT" },
    { id: "Emergency", name: "Emergency" }
  ];

  // Filtered requests based on search
  const [filteredRequests, setFilteredRequests] = useState([]);

  useEffect(() => {
    let filtered = [...pendingRequests];
    if (searchFilters.patientName.trim()) {
      filtered = filtered.filter(req =>
        req.patientName.toLowerCase().includes(searchFilters.patientName.toLowerCase())
      );
    }
    if (searchFilters.department) {
      filtered = filtered.filter(req => req.department === searchFilters.department);
    }
    setFilteredRequests(filtered);
    setCurrentPage(1);
  }, [searchFilters, pendingRequests]);

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

  const handleReset = () => {
    setSearchFilters({
      patientName: "",
      department: ""
    });
  };

  const handleRowClick = (request) => {
    setSelectedRequest(request);
    const components = pendingRequests.filter(
      req => req.requestId === request.requestId
    );
    setComponentDetails(components);
    setCurrentView("detail");
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedRequest(null);
    setComponentDetails([]);
    setShowUnitSelection(false);
    setSelectedComponent(null);
    setSelectedUnits([]);
  };

  const handleAllocateUnits = (component) => {
    setSelectedComponent(component);
    setShowUnitSelection(true);
  };

  const handleUnitSelection = (unit) => {
    setSelectedUnits(prev => {
      const isSelected = prev.some(u => u.id === unit.id);
      if (isSelected) {
        return prev.filter(u => u.id !== unit.id);
      } else {
        if (prev.length < selectedComponent.units) {
          return [...prev, unit];
        } else {
          showPopup(`You can only select up to ${selectedComponent.units} units`, "warning");
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
    showPopup(`${selectedUnits.length} unit(s) allocated successfully!`, "success");
    setShowUnitSelection(false);
    setSelectedUnits([]);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
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

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "available":
        return <span className="badge bg-success">Available</span>;
      case "quarantined":
        return <span className="badge bg-warning text-dark">Quarantined</span>;
      case "issued":
        return <span className="badge bg-primary">Issued</span>;
      case "expired":
        return <span className="badge bg-danger">Expired</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
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

  // Pagination
  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) {
    return <LoadingScreen />;
  }

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
                    <table className="table table-bordered table-hover">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "50px" }}>Select</th>
                          <th>Unit No</th>
                          <th>Blood Group</th>
                          <th>Volume (ml)</th>
                          <th>Expiry Date</th>
                          <th>Compatibility</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availableUnits.map((unit) => (
                          <tr key={unit.id} className={selectedUnits.some(u => u.id === unit.id) ? 'table-success' : ''}>
                            <td className="text-center">
                              <input 
                                type="checkbox" 
                                className="form-check-input"
                                checked={selectedUnits.some(u => u.id === unit.id)}
                                onChange={() => handleUnitSelection(unit)}
                                disabled={unit.status !== "Available" || 
                                  (!selectedUnits.some(u => u.id === unit.id) && 
                                   selectedUnits.length >= selectedComponent.units)}
                              />
                            </td>
                            <td className="fw-bold">{unit.unitNo}</td>
                            <td><span className="badge bg-danger">{unit.bloodGroup}</span></td>
                            <td>{unit.volume}</td>
                            <td>{formatDate(unit.expiryDate)}</td>
                            <td>{getCompatibilityBadge(unit.compatibility)}</td>
                            <td>{getStatusBadge(unit.status)}</td>
                          </tr>
                        ))}
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
                      
                      {/* Request Department */}
                      <div className="col-md-4">
                        <label className="form-label mb-1">Request Department</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedRequest.headerInfo.department}
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
                            <th>Units Required</th>
                            <th>Required By</th>
                            <th>Allocate Units</th>
                          </tr>
                        </thead>
                        <tbody>
                          {componentDetails.map((component) => (
                            <tr key={component.id}>
                              <td className="fw-bold">{component.componentType}</td>
                              <td className="text-center fw-bold">{component.units}</td>
                              <td>{formatDateTime(component.requiredDateTime)}</td>
                              <td>
                                {component.componentType.includes("PRBC") ? (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-info"
                                    onClick={() => handleAllocateUnits(component)}
                                  >
                                    Allocate Units
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-secondary"
                                    disabled
                                  >
                                    Not Available
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
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
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Requested Department</label>
                          <select
                            className="form-select"
                            name="department"
                            value={searchFilters.department}
                            onChange={handleSearchChange}
                          >
                            {departmentOptions.map(opt => (
                              <option key={opt.id} value={opt.id}>{opt.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-4">
                          <button
                            type="button"
                            className="btn btn-primary me-2"
                            onClick={() => setCurrentPage(1)}
                          >
                            Search
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
                      <th>Request Department</th>
                      <th>Urgency</th>
                      <th>Requested Date & Time</th>
                      <th>Requested By (Due Date/Time)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="text-center py-4">
                          <div className="text-muted">
                            <h6 className="mt-2">No pending blood requests found</h6>
                            <p className="mb-0">All requests have been processed</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((request) => (
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
                          <td>{request.department}</td>
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
              {filteredRequests.length > 0 && (
                <Pagination
                  totalItems={filteredRequests.length}
                  itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
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