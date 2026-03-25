import { useState } from "react";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";

const COMPONENTS = [
  "Whole Blood",
  "Packed Red Blood Cells (PRBC)",
  "Fresh Frozen Plasma (FFP)",
  "Platelets",
  "Cryoprecipitate",
  "Granulocytes",
];

const DISCARD_REASONS = [
  "Expired",
  "Hemolysis",
  "Lipemic",
  "Clotted",
  "Leakage",
  "Positive Screening",
  "Contamination",
  "Insufficient Volume",
  "Technical Error",
  "Temperature Excursion"
];

const DONATION_TYPES = [
  "Voluntary",
  "Replacement",
  "Autologous",
  "Apheresis",
  "Directed"
];

const DiscardAnalysisReport = () => {
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

  // Static data for UI demonstration - Discard Analysis
  const discardData = [
    {
      id: "1",
      unitNo: "PRBC-20250215-001",
      component: "Packed Red Blood Cells (PRBC)",
      bloodGroup: "O+",
      discardReason: "Expired",
      discardDate: "2026-02-28",
      donationType: "Voluntary"
    },
    {
      id: "2",
      unitNo: "PRBC-20250220-002",
      component: "Packed Red Blood Cells (PRBC)",
      bloodGroup: "A+",
      discardReason: "Hemolysis",
      discardDate: "2026-02-25",
      donationType: "Replacement"
    },
    {
      id: "3",
      unitNo: "PLT-20250218-001",
      component: "Platelets",
      bloodGroup: "B-",
      discardReason: "Lipemic",
      discardDate: "2026-02-22",
      donationType: "Voluntary"
    },
    {
      id: "4",
      unitNo: "FFP-20250210-003",
      component: "Fresh Frozen Plasma (FFP)",
      bloodGroup: "AB+",
      discardReason: "Clotted",
      discardDate: "2026-02-18",
      donationType: "Directed"
    },
    {
      id: "5",
      unitNo: "WB-20250205-005",
      component: "Whole Blood",
      bloodGroup: "O-",
      discardReason: "Leakage",
      discardDate: "2026-02-12",
      donationType: "Voluntary"
    },
    {
      id: "6",
      unitNo: "PRBC-20250225-004",
      component: "Packed Red Blood Cells (PRBC)",
      bloodGroup: "B+",
      discardReason: "Positive Screening",
      discardDate: "2026-02-28",
      donationType: "Replacement"
    },
    {
      id: "7",
      unitNo: "PLT-20250222-002",
      component: "Platelets",
      bloodGroup: "A-",
      discardReason: "Contamination",
      discardDate: "2026-02-26",
      donationType: "Apheresis"
    },
    {
      id: "8",
      unitNo: "CRYO-20250212-001",
      component: "Cryoprecipitate",
      bloodGroup: "AB-",
      discardReason: "Insufficient Volume",
      discardDate: "2026-02-20",
      donationType: "Voluntary"
    },
    {
      id: "9",
      unitNo: "FFP-20250208-002",
      component: "Fresh Frozen Plasma (FFP)",
      bloodGroup: "O+",
      discardReason: "Technical Error",
      discardDate: "2026-02-15",
      donationType: "Replacement"
    },
    {
      id: "10",
      unitNo: "PRBC-20250228-006",
      component: "Packed Red Blood Cells (PRBC)",
      bloodGroup: "A+",
      discardReason: "Temperature Excursion",
      discardDate: "2026-03-01",
      donationType: "Voluntary"
    },
    {
      id: "11",
      unitNo: "WB-20250214-007",
      component: "Whole Blood",
      bloodGroup: "B+",
      discardReason: "Expired",
      discardDate: "2026-02-21",
      donationType: "Directed"
    },
    {
      id: "12",
      unitNo: "PLT-20250219-003",
      component: "Platelets",
      bloodGroup: "O-",
      discardReason: "Hemolysis",
      discardDate: "2026-02-24",
      donationType: "Apheresis"
    }
  ];

  // Pagination
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = discardData.slice(indexOfFirst, indexOfLast);

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
              <h4 className="card-title p-2 mb-0">DISCARD ANALYSIS REPORT</h4>
            </div>
            <div className="card-body">
              {/* Search Parameters Section */}
              <div className="row mb-4">
                {/* Discard From Date */}
                <div className="col-md-2">
                  <label className="form-label fw-bold">Discard From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    defaultValue=""
                    max={getTodayDate()}
                  />
                </div>

                {/* Discard To Date */}
                <div className="col-md-2">
                  <label className="form-label fw-bold">Discard To Date</label>
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

                {/* Discard Reason Dropdown */}
                <div className="col-md-3">
                  <label className="form-label fw-bold">Discard Reason</label>
                  <select
                    className="form-select"
                    defaultValue=""
                  >
                    <option value="">All Reasons</option>
                    {DISCARD_REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Donation Type Dropdown */}
                <div className="col-md-3">
                  <label className="form-label fw-bold">Donation Type</label>
                  <select
                    className="form-select"
                    defaultValue=""
                  >
                    <option value="">All Types</option>
                    {DONATION_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
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

              {!isGenerating && showReport && (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="fw-bold">{discardData.length} records found</span>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-bordered align-middle">
                      <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                        <tr>
                          <th>Unit No</th>
                          <th>Component</th>
                          <th>Blood Group</th>
                          <th>Discard Reason</th>
                          <th>Discard Date</th>
                          <th>Donation Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((item) => (
                            <tr key={item.id}>
                              <td className="fw-bold">{item.unitNo}</td>
                              <td>{item.component}</td>
                              <td>{item.bloodGroup}</td>
                              <td>
                                <span className="badge bg-danger">
                                  {item.discardReason}
                                </span>
                              </td>
                              <td>{formatDateForDisplay(item.discardDate)}</td>
                              <td>
                                <span className={`badge ${
                                  item.donationType === "Voluntary" ? "bg-success" :
                                  item.donationType === "Replacement" ? "bg-info" :
                                  item.donationType === "Apheresis" ? "bg-primary" :
                                  "bg-secondary"
                                }`}>
                                  {item.donationType}
                                </span>
                              </td>
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
                  {discardData.length > DEFAULT_ITEMS_PER_PAGE && (
                    <Pagination
                      totalItems={discardData.length}
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

export default DiscardAnalysisReport;