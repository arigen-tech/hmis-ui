import { useState } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { fetchPdfReportForViewAndPrint } from "../../../service/apiService";
import { NIS_MEDICINE_REGISTER_REPORT_URL, STATUS_D } from "../../../config/apiConfig";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";

const NISRegister = () => {
  // ----- State -----
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [reportPdfUrl, setReportPdfUrl] = useState(null);

  // ----- Handlers -----
  const handleGenerateReport = async () => {
    setLoading(true);
    const hospitalId = sessionStorage.getItem("hospitalId") || localStorage.getItem("hospitalId") || 12;
    try {
      const reportUrl = `${NIS_MEDICINE_REGISTER_REPORT_URL}?hospitalId=${hospitalId}&fromDate=${fromDate}&toDate=${toDate}`;
      const blob = await fetchPdfReportForViewAndPrint(reportUrl, STATUS_D);
      const fileURL = window.URL.createObjectURL(blob);
      setReportPdfUrl(fileURL);
    } catch (error) {
      console.error("Error generating report:", error);
      showPopup("Failed to generate report", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
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
      {loading && <LoadingScreen />}
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
                    disabled={loading || !fromDate || !toDate}
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

      {/* Report PDF Viewer */}
      {reportPdfUrl && (
        <PdfViewer
          pdfUrl={reportPdfUrl}
          name="NIS Register Report"
          onClose={() => setReportPdfUrl(null)}
        />
      )}
    </div>
  );
};

export default NISRegister;