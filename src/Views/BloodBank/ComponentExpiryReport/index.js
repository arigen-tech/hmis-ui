import { useState, useEffect } from "react";
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

const INVENTORY_STATUS = ["Available", "Reserved", "Allocated", "Expired"];

const STORAGE_LOCATIONS = [
  "Main BB - Rack A, Shelf 1",
  "Main BB - Rack A, Shelf 2",
  "Main BB - Rack A, Shelf 3",
  "Main BB - Rack A, Shelf 4",
  "Main BB - Rack B, Shelf 1",
  "Main BB - Rack B, Shelf 2",
  "Main BB - Rack B, Shelf 3",
  "Main BB - Rack C, Shelf 1",
  "Main BB - Rack C, Shelf 2",
  "Main BB - Rack D, Shelf 1",
];

const ComponentExpiryReport = () => {
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

  const handlereset = () => {
    setShowReport(false);
    setCurrentPage(1);
  };

  // Calculate days left until expiry
  const calculateDaysLeft = (expiryDateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiryDate = new Date(expiryDateStr);
    expiryDate.setHours(0, 0, 0, 0);
    
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Static data for UI demonstration
  const expiryData = [
    {
      id: "1",
      unitNo: "PRBC-20250301-001",
      component: "Packed Red Blood Cells (PRBC)",
      bloodGroup: "O+",
      expiryDate: "2026-03-05",
      daysLeft: calculateDaysLeft("2026-03-05"),
      status: "Available",
      storageLocation: "Main BB - Rack A, Shelf 2"
    },
    {
      id: "2",
      unitNo: "PRBC-20250301-002",
      component: "Packed Red Blood Cells (PRBC)",
      bloodGroup: "O+",
      expiryDate: "2026-03-07",
      daysLeft: calculateDaysLeft("2026-03-07"),
      status: "Available",
      storageLocation: "Main BB - Rack A, Shelf 3"
    },
    {
      id: "3",
      unitNo: "PRBC-20250301-003",
      component: "Packed Red Blood Cells (PRBC)",
      bloodGroup: "A+",
      expiryDate: "2026-03-10",
      daysLeft: calculateDaysLeft("2026-03-10"),
      status: "Reserved",
      storageLocation: "Main BB - Rack A, Shelf 4"
    },
    {
      id: "4",
      unitNo: "PLT-20250301-001",
      component: "Platelets",
      bloodGroup: "A+",
      expiryDate: "2026-03-08",
      daysLeft: calculateDaysLeft("2026-03-08"),
      status: "Available",
      storageLocation: "Main BB - Rack B, Shelf 1"
    },
    {
      id: "5",
      unitNo: "PLT-20250301-002",
      component: "Platelets",
      bloodGroup: "A+",
      expiryDate: "2026-03-09",
      daysLeft: calculateDaysLeft("2026-03-09"),
      status: "Reserved",
      storageLocation: "Main BB - Rack B, Shelf 2"
    },
    {
      id: "6",
      unitNo: "FFP-20250301-001",
      component: "Fresh Frozen Plasma (FFP)",
      bloodGroup: "B-",
      expiryDate: "2026-03-15",
      daysLeft: calculateDaysLeft("2026-03-15"),
      status: "Available",
      storageLocation: "Main BB - Rack C, Shelf 1"
    },
    {
      id: "7",
      unitNo: "FFP-20250301-002",
      component: "Fresh Frozen Plasma (FFP)",
      bloodGroup: "B-",
      expiryDate: "2026-03-18",
      daysLeft: calculateDaysLeft("2026-03-18"),
      status: "Allocated",
      storageLocation: "Main BB - Rack C, Shelf 2"
    },
    {
      id: "8",
      unitNo: "CRYO-20250301-001",
      component: "Cryoprecipitate",
      bloodGroup: "AB+",
      expiryDate: "2026-03-20",
      daysLeft: calculateDaysLeft("2026-03-20"),
      status: "Available",
      storageLocation: "Main BB - Rack D, Shelf 1"
    },
    {
      id: "9",
      unitNo: "CRYO-20250301-002",
      component: "Cryoprecipitate",
      bloodGroup: "AB+",
      expiryDate: "2026-03-22",
      daysLeft: calculateDaysLeft("2026-03-22"),
      status: "Available",
      storageLocation: "Main BB - Rack D, Shelf 2"
    },
    {
      id: "10",
      unitNo: "WB-20250301-001",
      component: "Whole Blood",
      bloodGroup: "O-",
      expiryDate: "2026-03-20",
      daysLeft: calculateDaysLeft("2026-03-20"),
      status: "Available",
      storageLocation: "Main BB - Rack E, Shelf 1"
    },
    {
      id: "11",
      unitNo: "WB-20250301-002",
      component: "Whole Blood",
      bloodGroup: "O-",
      expiryDate: "2026-02-28",
      daysLeft: calculateDaysLeft("2026-02-28"),
      status: "Expired",
      storageLocation: "Main BB - Rack E, Shelf 2"
    },
    {
      id: "12",
      unitNo: "PLT-20250301-003",
      component: "Platelets",
      bloodGroup: "B+",
      expiryDate: "2026-03-25",
      daysLeft: calculateDaysLeft("2026-03-25"),
      status: "Available",
      storageLocation: "Main BB - Rack B, Shelf 3"
    }
  ];

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

  // Get badge class for days left
  const getDaysLeftBadgeClass = (daysLeft) => {
    if (daysLeft < 0) return "bg-danger";
    if (daysLeft <= 3) return "bg-danger";
    if (daysLeft <= 7) return "bg-warning";
    if (daysLeft <= 15) return "bg-info";
    return "bg-success";
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case "Available":
        return "bg-success";
      case "Reserved":
        return "bg-warning";
      case "Allocated":
        return "bg-info";
      case "Expired":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  // Pagination
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = expiryData.slice(indexOfFirst, indexOfLast);

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
              <h4 className="card-title p-2 mb-0">COMPONENT EXPIRY REPORT</h4>
            </div>
            <div className="card-body">
              {/* Search Parameters Section */}
              <div className="row mb-4">
                {/* Expiry From Date */}
                <div className="col-md-2">
                  <label className="form-label fw-bold">Expiry From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    defaultValue=""
                    max={getTodayDate()}
                  />
                </div>

                {/* Expiry To Date */}
                <div className="col-md-2">
                  <label className="form-label fw-bold">Expiry To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    defaultValue=""
                    max={getTodayDate()}
                  />
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

                {/* Inventory Status Dropdown - Default: AVAILABLE */}
                <div className="col-md-2">
                  <label className="form-label fw-bold">Inventory Status</label>
                  <select
                    className="form-select"
                    defaultValue="Available"
                  >
                    <option value="">All Status</option>
                    {INVENTORY_STATUS.map((s) => (
                      <option key={s} value={s}>{s}</option>
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
                    onClick={handlereset}
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
                  <div className="table-responsive">
                    <table className="table table-bordered align-middle">
                      <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                        <tr>
                          <th>Unit No</th>
                          <th>Component</th>
                          <th>Blood Group</th>
                          <th>Expiry Date</th>
                          <th className="text-center">Days Left</th>
                          <th>Inventory Status</th>
                          <th>Storage Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((item) => (
                            <tr key={item.id}>
                              <td className="fw-bold">{item.unitNo}</td>
                              <td>{item.component}</td>
                              <td>{item.bloodGroup}</td>
                              <td>{formatDateForDisplay(item.expiryDate)}</td>
                              <td className="text-center">
                                <span className={`badge ${getDaysLeftBadgeClass(item.daysLeft)}`}>
                                  {item.daysLeft > 0 ? `${item.daysLeft} days` : item.daysLeft === 0 ? 'Today' : 'Expired'}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                                  {item.status}
                                </span>
                              </td>
                              <td>{item.storageLocation}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="text-center py-4">
                              No Record Found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {expiryData.length > DEFAULT_ITEMS_PER_PAGE && (
                    <Pagination
                      totalItems={expiryData.length}
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

export default ComponentExpiryReport;