import { useState } from "react";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";

const DEFERRAL_TYPES = [
  "Temporary",
  "Permanent"
];

const DonorDeferralHistoryReport = () => {
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
    if (dateString === "NA") return "NA";
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

  // Static dummy data for Donor Deferral History
  const deferralData = [
    {
      id: "1",
      donorId: "DON-20045",
      donorName: "Rahul Sharma",
      deferralType: "Temporary",
      deferralReason: "Low Hemoglobin",
      startDate: "2026-02-01",
      endDate: "2026-05-01",
      screenedBy: "Dr. Mehta"
    },
    {
      id: "2",
      donorId: "DON-20012",
      donorName: "Anita Verma",
      deferralType: "Permanent",
      deferralReason: "Hepatitis B",
      startDate: "2026-01-15",
      endDate: "NA",
      screenedBy: "Dr. Singh"
    }
  ];

  // Pagination
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = deferralData.slice(indexOfFirst, indexOfLast);

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
              <h4 className="card-title p-2 mb-0">DONOR DEFERRAL HISTORY REPORT</h4>
            </div>
            <div className="card-body">
              {/* Search Parameters Section */}
              <div className="row mb-4">
                {/* Donor ID / Name */}
                <div className="col-md-3">
                  <label className="form-label fw-bold">Donor ID / Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Donor ID or Name"
                    defaultValue=""
                  />
                </div>

                {/* Deferral Type */}
                <div className="col-md-3">
                  <label className="form-label fw-bold">Deferral Type</label>
                  <select
                    className="form-select"
                    defaultValue=""
                  >
                    <option value="">All Types</option>
                    {DEFERRAL_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* From Date */}
                <div className="col-md-3">
                  <label className="form-label fw-bold">From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    defaultValue=""
                    max={getTodayDate()}
                  />
                </div>

                {/* To Date */}
                <div className="col-md-3">
                  <label className="form-label fw-bold">To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    defaultValue=""
                    max={getTodayDate()}
                  />
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
                    <span className="fw-bold">{deferralData.length} records found</span>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-bordered align-middle">
                      <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                        <tr>
                          <th>Donor ID</th>
                          <th>Donor Name</th>
                          <th>Deferral Type</th>
                          <th>Deferral Reason</th>
                          <th>Start Date</th>
                          <th>End Date</th>
                          <th>Screened By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((item) => (
                            <tr key={item.id}>
                              <td className="fw-bold">{item.donorId}</td>
                              <td>{item.donorName}</td>
                              <td>
                                <span className={`badge ${
                                  item.deferralType === "Temporary" ? "bg-warning text-dark" : 
                                  item.deferralType === "Permanent" ? "bg-danger" : 
                                  "bg-secondary"
                                }`}>
                                  {item.deferralType}
                                </span>
                              </td>
                              <td>{item.deferralReason}</td>
                              <td>{formatDateForDisplay(item.startDate)}</td>
                              <td>{formatDateForDisplay(item.endDate)}</td>
                              <td>{item.screenedBy}</td>
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
                  {deferralData.length > DEFAULT_ITEMS_PER_PAGE && (
                    <Pagination
                      totalItems={deferralData.length}
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

export default DonorDeferralHistoryReport;