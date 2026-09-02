import { useState } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const NISRegister = () => {
  // ----- State -----
  const [department, setDepartment] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);

  // Dummy department options (can be replaced with real data later)
  const departmentOptions = [
    "Pharmacy",
    "General Store",
    "CSSD",
    "Lab",
    "Radiology",
  ];

  // ----- Handlers -----
  const handleGenerateReport = () => {
    setLoading(true);
    // Simulate a short delay (no API call)
    setTimeout(() => {
      setLoading(false);
      setReportGenerated(true);
      showPopup("Report generated successfully!", "success");
    }, 500);
  };

  const handleReset = () => {
    setDepartment("");
    setFromDate("");
    setToDate("");
    setReportGenerated(false);
  };

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => setPopupMessage(null),
    });
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title mb-0">NIS Register</h4>
            </div>
            <div className="card-body">
              {/* Filter Section */}
              <div className="row mb-4 align-items-end">
                <div className="col-md-3">
                  <label className="form-label">Department</label>
                  <select
                    className="form-select"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    <option value="">Select Department</option>
                    {departmentOptions.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label">From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label">To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>

                <div className="col-md-3 d-flex justify-content-end">
                  <button
                    className="btn btn-primary"
                    onClick={handleGenerateReport}
                    disabled={loading || !department || !fromDate || !toDate}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Generating...
                      </>
                    ) : (
                      "Generate Report"
                    )}
                  </button>
                  <button
                    className="btn btn-secondary ms-2"
                    onClick={handleReset}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Report Display Area (conditionally rendered after generation) */}
              {reportGenerated && (
                <div className="table-responsive packagelist">
                  <table className="table table-bordered table-hover align-middle">
                    <thead style={{ backgroundColor: "#b0c4de" }}>
                      <tr>
                        <th>S.No.</th>
                        <th>Item Code</th>
                        <th>Item Name</th>
                        <th>Batch No.</th>
                        <th>Quantity</th>
                        {/* Add more columns as per NIS Register requirements */}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-4">
                          No records found
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination (shown only if there are items, but here no data) */}
              {reportGenerated && false && (
                <Pagination
                  totalItems={0}
                  itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                  currentPage={1}
                  onPageChange={() => {}}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Popup Message */}
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}
    </div>
  );
};

export default NISRegister;