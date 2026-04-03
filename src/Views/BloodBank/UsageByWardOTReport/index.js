import { useState } from "react";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const COMPONENTS = [
  "Whole Blood",
  "Packed Red Blood Cells (PRBC)",
  "Fresh Frozen Plasma (FFP)",
  "Platelets",
  "Cryoprecipitate",
  "Granulocytes",
];

const WARDS_OT = [
  "General Ward",
  "ICU",
  "Emergency",
  "Operation Theatre 1",
  "Operation Theatre 2",
  "Cardiology Ward",
  "Oncology Ward",
  "Pediatric Ward",
  "Maternity Ward",
  "Orthopedic Ward"
];

const UsageByWardOTReport = () => {
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      },
    });
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // UI-only handlers
  const handleSearch = () => {
    setIsGenerating(true);
    
    // Simulate search
    setTimeout(() => {
      setIsGenerating(false);
      setShowReport(true);
      setCurrentPage(1);
    }, 1000);
  };

  const handleReset = () => {
    setShowReport(false);
    setCurrentPage(1);
  };

  // Format date for display (DD-MMM-YYYY)
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
      return "";
    }
  };

  // Static data for UI demonstration - Usage by Ward/OT
  const usageData = [
    {
      id: "1",
      wardOT: "ICU",
      component: "Packed Red Blood Cells (PRBC)",
      bloodGroup: "O+",
      unitsIssued: 4,
      issueDate: "2026-03-15",
      patientId: "PAT-001234"
    },
    {
      id: "2",
      wardOT: "Operation Theatre 1",
      component: "Packed Red Blood Cells (PRBC)",
      bloodGroup: "A+",
      unitsIssued: 2,
      issueDate: "2026-03-15",
      patientId: "PAT-001235"
    },
    {
      id: "3",
      wardOT: "Emergency",
      component: "Fresh Frozen Plasma (FFP)",
      bloodGroup: "B-",
      unitsIssued: 3,
      issueDate: "2026-03-14",
      patientId: "PAT-001236"
    },
    {
      id: "4",
      wardOT: "General Ward",
      component: "Platelets",
      bloodGroup: "AB+",
      unitsIssued: 1,
      issueDate: "2026-03-14",
      patientId: "PAT-001237"
    },
    {
      id: "5",
      wardOT: "Operation Theatre 2",
      component: "Whole Blood",
      bloodGroup: "O-",
      unitsIssued: 2,
      issueDate: "2026-03-13",
      patientId: "PAT-001238"
    },
    {
      id: "6",
      wardOT: "ICU",
      component: "Cryoprecipitate",
      bloodGroup: "A-",
      unitsIssued: 2,
      issueDate: "2026-03-13",
      patientId: "PAT-001239"
    },
    {
      id: "7",
      wardOT: "Cardiology Ward",
      component: "Packed Red Blood Cells (PRBC)",
      bloodGroup: "B+",
      unitsIssued: 3,
      issueDate: "2026-03-12",
      patientId: "PAT-001240"
    },
    {
      id: "8",
      wardOT: "Emergency",
      component: "Fresh Frozen Plasma (FFP)",
      bloodGroup: "O+",
      unitsIssued: 4,
      issueDate: "2026-03-12",
      patientId: "PAT-001241"
    },
    {
      id: "9",
      wardOT: "Oncology Ward",
      component: "Platelets",
      bloodGroup: "A+",
      unitsIssued: 2,
      issueDate: "2026-03-11",
      patientId: "PAT-001242"
    },
    {
      id: "10",
      wardOT: "Maternity Ward",
      component: "Packed Red Blood Cells (PRBC)",
      bloodGroup: "O-",
      unitsIssued: 1,
      issueDate: "2026-03-11",
      patientId: "PAT-001243"
    },
    {
      id: "11",
      wardOT: "Operation Theatre 1",
      component: "Cryoprecipitate",
      bloodGroup: "AB-",
      unitsIssued: 2,
      issueDate: "2026-03-10",
      patientId: "PAT-001244"
    },
    {
      id: "12",
      wardOT: "Pediatric Ward",
      component: "Platelets",
      bloodGroup: "B+",
      unitsIssued: 1,
      issueDate: "2026-03-10",
      patientId: "PAT-001245"
    }
  ];

  // Pagination
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = usageData.slice(indexOfFirst, indexOfLast);

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
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">USAGE BY WARD / OT REPORT</h4>
            </div>
            <div className="card-body">
              {/* Search Parameters Section */}
              <div className="row mb-4">
                {/* Issue From Date */}
                <div className="col-md-2">
                  <label className="form-label fw-bold">Issue From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    defaultValue=""
                    max={getTodayDate()}
                  />
                </div>

                {/* Issue To Date */}
                <div className="col-md-2">
                  <label className="form-label fw-bold">Issue To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    defaultValue=""
                    max={getTodayDate()}
                  />
                </div>

                {/* Ward / OT Dropdown */}
                <div className="col-md-2">
                  <label className="form-label fw-bold">Ward / OT</label>
                  <select
                    className="form-select"
                    defaultValue=""
                  >
                    <option value="">All Wards/OT</option>
                    {WARDS_OT.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>

                {/* Component Dropdown */}
                <div className="col-md-2">
                  <label className="form-label fw-bold">Component</label>
                  <select
                    className="form-select"
                    defaultValue=""
                  >
                    <option value="">All Components</option>
                    {COMPONENTS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Blood Group Dropdown */}
                <div className="col-md-2">
                  <label className="form-label fw-bold">Blood Group</label>
                  <select
                    className="form-select"
                    defaultValue=""
                  >
                    <option value="">All Blood Groups</option>
                    {BLOOD_GROUPS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Buttons Row */}
              <div className="row mb-4">
                <div className="col-12 d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSearch}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Searching...
                      </>
                    ) : (
                      "Search"
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleReset}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Loading State */}
              {isGenerating && (
                <div className="text-center py-4">
                  <LoadingScreen />
                </div>
              )}

              {/* Report Table */}
              {!isGenerating && showReport && (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="fw-bold">{usageData.length} records found</span>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-bordered align-middle">
                      <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                        <tr>
                          <th>Ward / OT</th>
                          <th>Component</th>
                          <th>Blood Group</th>
                          <th>Units Issued</th>
                          <th>Issue Date</th>
                          <th>Patient ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((item) => (
                            <tr key={item.id}>
                              <td className="fw-bold">{item.wardOT}</td>
                              <td>{item.component}</td>
                              <td>{item.bloodGroup}</td>
                              <td className="text-center">
                                
                                  {item.unitsIssued}
                              </td>
                              <td>{formatDateForDisplay(item.issueDate)}</td>
                              <td className="fw-bold">{item.patientId}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center py-4">
                              No Record Found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {usageData.length > DEFAULT_ITEMS_PER_PAGE && (
                    <Pagination
                      totalItems={usageData.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              )}

             
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageByWardOTReport;