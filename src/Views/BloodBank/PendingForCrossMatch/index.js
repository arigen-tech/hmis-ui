import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import Popup from "../../../Components/popup"
import ConfirmationPopup from "../../../Components/ConfirmationPopup"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination"

// Mock data for departments
const mockDepartments = [
  { departmentId: 1, departmentName: "Emergency" },
  { departmentId: 2, departmentName: "ICU" },
  { departmentId: 3, departmentName: "General Ward" },
  { departmentId: 4, departmentName: "Surgery" },
  { departmentId: 5, departmentName: "Pediatrics" },
]

// Mock data for patient suggestions
const mockPatientSuggestions = [
  { patientName: "John Doe", inpatientNo: "IP001", bloodGroup: "A+", ageGender: "45/M" },
  { patientName: "Jane Smith", inpatientNo: "IP002", bloodGroup: "B+", ageGender: "32/F" },
  { patientName: "Robert Johnson", inpatientNo: "IP003", bloodGroup: "O+", ageGender: "58/M" },
  { patientName: "Mary Williams", inpatientNo: "IP004", bloodGroup: "AB+", ageGender: "28/F" },
  { patientName: "James Brown", inpatientNo: "IP005", bloodGroup: "A-", ageGender: "52/M" },
]

// Mock data for pending cross-match requests
const mockPendingRequests = [
  {
    requestNo: "REQ001",
    inpatient: "IP001",
    patientName: "John Doe",
    bloodGroup: "A+",
    component: "Packed RBC",
    unitsReq: 2,
    unitsAlloc: 2,
    requestDept: "Emergency",
    urgency: "Emergency",
    requestedOn: "15/03/2024",
    requiredBy: "16/03/2024",
    inpatientNo: "IP001",
    ageGender: "45/M",
    headerInfo: {
      requestNo: "REQ001",
      patientName: "John Doe",
      inpatientNo: "IP001",
      ageGender: "45/M",
      bloodGroup: "A+",
      department: "Emergency",
      urgency: "Emergency",
      requestDate: "2024-03-15T10:30:00",
    },
    allocatedUnits: [
      {
        unitNo: "U001",
        bloodGroup: "A+",
        volume: "350ml",
        expiry: "15/06/2024",
      },
      {
        unitNo: "U002",
        bloodGroup: "A+",
        volume: "350ml",
        expiry: "20/06/2024",
      },
    ],
  },
  {
    requestNo: "REQ002",
    inpatient: "IP002",
    patientName: "Jane Smith",
    bloodGroup: "B+",
    component: "FFP",
    unitsReq: 3,
    unitsAlloc: 3,
    requestDept: "ICU",
    urgency: "Urgent",
    requestedOn: "15/03/2024",
    requiredBy: "17/03/2024",
    inpatientNo: "IP002",
    ageGender: "32/F",
    headerInfo: {
      requestNo: "REQ002",
      patientName: "Jane Smith",
      inpatientNo: "IP002",
      ageGender: "32/F",
      bloodGroup: "B+",
      department: "ICU",
      urgency: "Urgent",
      requestDate: "2024-03-15T11:45:00",
    },
    allocatedUnits: [
      {
        unitNo: "U003",
        bloodGroup: "B+",
        volume: "250ml",
        expiry: "10/05/2024",
      },
      {
        unitNo: "U004",
        bloodGroup: "B+",
        volume: "250ml",
        expiry: "12/05/2024",
      },
      {
        unitNo: "U005",
        bloodGroup: "B+",
        volume: "250ml",
        expiry: "15/05/2024",
      },
    ],
  },
  {
    requestNo: "REQ003",
    inpatient: "IP003",
    patientName: "Robert Johnson",
    bloodGroup: "O+",
    component: "Platelets",
    unitsReq: 4,
    unitsAlloc: 4,
    requestDept: "Surgery",
    urgency: "Routine",
    requestedOn: "14/03/2024",
    requiredBy: "18/03/2024",
    inpatientNo: "IP003",
    ageGender: "58/M",
    headerInfo: {
      requestNo: "REQ003",
      patientName: "Robert Johnson",
      inpatientNo: "IP003",
      ageGender: "58/M",
      bloodGroup: "O+",
      department: "Surgery",
      urgency: "Routine",
      requestDate: "2024-03-14T09:15:00",
    },
    allocatedUnits: [
      {
        unitNo: "U006",
        bloodGroup: "O+",
        volume: "300ml",
        expiry: "30/04/2024",
      },
      {
        unitNo: "U007",
        bloodGroup: "O+",
        volume: "300ml",
        expiry: "02/05/2024",
      },
      {
        unitNo: "U008",
        bloodGroup: "O+",
        volume: "300ml",
        expiry: "05/05/2024",
      },
      {
        unitNo: "U009",
        bloodGroup: "O+",
        volume: "300ml",
        expiry: "07/05/2024",
      },
    ],
  },
]

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
  const [loading, setLoading] = useState(false)
  const [confirmationPopup, setConfirmationPopup] = useState(null)
  const [popupMessage, setPopupMessage] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [currentView, setCurrentView] = useState("list") // "list" or "detail"
  const [currentPage, setCurrentPage] = useState(1)

  // Search state
  const [searchFilters, setSearchFilters] = useState({
    patientName: "",
    department: ""
  })
  const [deptOptions] = useState(mockDepartments)
  const [requestList, setRequestList] = useState([])
  const [filteredRequests, setFilteredRequests] = useState([])

  // Selected request / patient header
  const [selectedRequest, setSelectedRequest] = useState(null)

  // Patient sample section
  const [sampleCollected, setSampleCollected] = useState(false)
  const [sampleCollectedDateTime, setSampleCollectedDateTime] = useState("")
  const [sampleReceivedBy, setSampleReceivedBy] = useState("")

  // Cross-match grid
  const [crossMatchEntries, setCrossMatchEntries] = useState([])

  // Dropdown search for patient name
  const [patientDropdown, setPatientDropdown] = useState([])
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const [isPatientLoading, setIsPatientLoading] = useState(false)
  const debouncePatientRef = useRef(null)
  const patientInputRef = useRef(null)

  // Cross-match result options
  const crossMatchResultOptions = [
    { value: "", label: "Select" },
    { value: "compatible", label: "Compatible" },
    { value: "incompatible", label: "Incompatible" },
    { value: "pending", label: "Pending" },
  ]

  // Department options for dropdown
  const departmentOptions = [
    { id: "", name: "All Departments" },
    { id: "Emergency", name: "Emergency" },
    { id: "ICU", name: "ICU" },
    { id: "Surgery", name: "Surgery" },
    { id: "General Ward", name: "General Ward" },
    { id: "Pediatrics", name: "Pediatrics" }
  ]

  // Get current date in DD/MM/YYYY format
  const getCurrentDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Load initial data
  useEffect(() => {
    setRequestList(mockPendingRequests)
    setFilteredRequests(mockPendingRequests)
  }, [])

  // Filter requests based on search
  useEffect(() => {
    let filtered = [...requestList];
    
    if (searchFilters.patientName.trim()) {
      filtered = filtered.filter(req =>
        req.patientName.toLowerCase().includes(searchFilters.patientName.toLowerCase())
      );
    }
    
    if (searchFilters.department) {
      filtered = filtered.filter(req => req.requestDept === searchFilters.department);
    }
    
    setFilteredRequests(filtered);
    setCurrentPage(1);
  }, [searchFilters, requestList]);

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
      
      setIsPatientLoading(true)
      // Simulate API call
      setTimeout(() => {
        const filtered = mockPatientSuggestions.filter(patient =>
          patient.patientName.toLowerCase().includes(value.toLowerCase())
        )
        setPatientDropdown(filtered)
        setShowPatientDropdown(true)
        setIsPatientLoading(false)
      }, 500)
    }, 500)
  }

  const handlePatientSelect = (patient) => {
    setSearchFilters(prev => ({ ...prev, patientName: patient.patientName }))
    setShowPatientDropdown(false)
  }

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
    setSelectedRequest(request)
    
    // Initialize cross-match rows from allocated units
    if (request.allocatedUnits && request.allocatedUnits.length > 0) {
      setCrossMatchEntries(
        request.allocatedUnits.map((unit) => ({
          unitNo: unit.unitNo,
          bloodGroup: unit.bloodGroup,
          volume: unit.volume,
          expiry: unit.expiry,
          crossMatchResult: "",
          testDate: "",
          remarks: "",
        }))
      )
    } else {
      setCrossMatchEntries([])
    }
    
    // Reset sample section
    setSampleCollected(false)
    setSampleCollectedDateTime("")
    setSampleReceivedBy("")
    
    // Switch to detail view
    setCurrentView("detail")
  }

  const handleBackToList = () => {
    setCurrentView("list")
    setSelectedRequest(null)
    setCrossMatchEntries([])
    setSampleCollected(false)
    setSampleCollectedDateTime("")
    setSampleReceivedBy("")
  }

  const handleSampleCollectedChange = (checked) => {
    setSampleCollected(checked)
    if (checked) {
      const now = new Date()
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const formatted = `${year}-${month}-${day}T${hours}:${minutes}`;
      setSampleCollectedDateTime(formatted)
    } else {
      setSampleCollectedDateTime("")
      setSampleReceivedBy("")
    }
  }

  const handleCrossMatchEntryChange = (index, field, value) => {
    const updated = crossMatchEntries.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry
    )
    setCrossMatchEntries(updated)
  }

  const validateCrossMatch = () => {
    if (!selectedRequest) {
      showPopup("Please select a request first", "warning")
      return false
    }
    if (!sampleCollected) {
      showPopup("Please confirm sample collected from patient", "warning")
      return false
    }
    if (!sampleReceivedBy.trim()) {
      showPopup("Sample Received By is required", "warning")
      return false
    }
    if (!sampleCollectedDateTime) {
      showPopup("Sample Collected Date & Time is required", "warning")
      return false
    }
    for (let i = 0; i < crossMatchEntries.length; i++) {
      if (!crossMatchEntries[i].crossMatchResult) {
        showPopup(`Cross-Match Result is required for row ${i + 1}`, "warning")
        return false
      }
      if (!crossMatchEntries[i].testDate) {
        showPopup(`Test Date is required for row ${i + 1}`, "warning")
        return false
      }
    }
    return true
  }

  const handleSave = async () => {
    if (!validateCrossMatch()) return

    showConfirmationPopup(
      "Are you sure you want to save the cross-match details?",
      "info",
      async () => {
        setIsSaving(true)
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          showConfirmationPopup(
            "Cross-match details saved successfully.",
            "success",
            () => handleBackToList(),
            () => handleBackToList(),
            "OK",
            "Close"
          )
        } catch (error) {
          console.error("Save Cross Match Error:", error)
          showConfirmationPopup(
            "Something went wrong. Please try again.",
            "error",
            () => {},
            null,
            "OK",
            "Close"
          )
        } finally {
          setIsSaving(false)
        }
      },
      () => console.log("Save cross match cancelled"),
      "Yes, Save",
      "Cancel"
    )
  }

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

  // Pagination
  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) {
    return (
      <div className="content-wrapper">
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Detail View (Cross-match entry screen)
  if (currentView === "detail" && selectedRequest) {
    return (
      <div className="content-wrapper">
        <ConfirmationPopup
          show={confirmationPopup !== null}
          message={confirmationPopup?.message || ""}
          type={confirmationPopup?.type || "info"}
          onConfirm={confirmationPopup?.onConfirm || (() => {})}
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
                          value={selectedRequest.requestDept || ""}
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
                        <label className="form-label fw-bold">Required By</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedRequest.requiredBy || ""}
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
                          value={selectedRequest.unitsReq || ""}
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
                                  >
                                    {crossMatchResultOptions.map((opt) => (
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
                                    placeholder="Optional"
                                    disabled={!sampleCollected || isSaving}
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
        onConfirm={confirmationPopup?.onConfirm || (() => {})}
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
                          placeholder="Type patient name..."
                          disabled={isSaving}
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
                      <label className="form-label fw-bold">Requested Dept</label>
                      <select
                        className="form-select"
                        name="department"
                        value={searchFilters.department}
                        onChange={handleSearchChange}
                        disabled={isSaving}
                      >
                        {departmentOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4 gap-2 d-flex ">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setCurrentPage(1)}
                        disabled={isSaving}
                      >
                        Search
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary "
                        onClick={handleReset}
                        disabled={isSaving}
                      >
                        Reset
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
                          <th >Request Dept</th>
                          <th >Urgency</th>
                          <th >Requested On</th>
                          <th >Required By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length === 0 ? (
                          <tr>
                            <td colSpan={11} className="text-center py-4">
                              <div className="text-muted">
                                <h6 className="mt-2">No pending cross-match requests found</h6>
                                <p className="mb-0">All requests have been processed</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          currentItems.map((req, idx) => (
                            <tr
                              key={idx}
                              onClick={() => handleRowClick(req)}
                              style={{ cursor: "pointer" }}
                              className="table-row-hover"
                            >
                              <td className="fw-bold">{req.requestNo}</td>
                              <td>{req.inpatient}</td>
                              <td>{req.patientName}</td>
                              <td><span className="badge bg-danger">{req.bloodGroup}</span></td>
                              <td>{req.component}</td>
                              <td className="text-center fw-bold">{req.unitsReq}</td>
                              <td className="text-center fw-bold">{req.unitsAlloc}</td>
                              <td>{req.requestDept}</td>
                              <td>{getUrgencyBadge(req.urgency)}</td>
                              <td>{req.requestedOn}</td>
                              <td className="fw-bold">{req.requiredBy}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>

                  {/* Pagination */}
                  {filteredRequests.length > 0 && (
                    <div className="mt-3">
                      <Pagination
                        totalItems={filteredRequests.length}
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