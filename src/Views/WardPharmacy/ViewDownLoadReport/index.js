import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Popup from "../../../Components/popup";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";

const ViewDownLoadReport = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [reportUrl, setReportUrl] = useState(null);
  const [returnPath, setReturnPath] = useState(null);
  const [title, setTitle] = useState("Report");
  const [fileName, setFileName] = useState("Report");

  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingView, setLoadingView] = useState(false);
  const [loadingPrint, setLoadingPrint] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);

  useEffect(() => {
    if (!location.state?.reportUrl) {
      showPopup("Invalid access to report page", "error");
      setTimeout(() => navigate(-1), 2000);
      return;
    }

    setReportUrl(location.state.reportUrl);
    setReturnPath(location.state.returnPath || -1);
    setTitle(location.state.title || "Report");
    setFileName(location.state.fileName || "Report");
  }, [location.state, navigate]);

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => setPopupMessage(null),
    });
  };

  const fetchPdf = async (flag) => {
    const response = await fetch(`${reportUrl}&flag=${flag}`, {
      method: "GET",
      headers: {
        Accept: "application/pdf",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch report");
    }

    return await response.blob();
  };

  const handleViewDownload = async () => {
    try {
      setLoadingView(true);
      const blob = await fetchPdf("d");
      const fileURL = window.URL.createObjectURL(blob);
      setPdfUrl(fileURL);
    } catch (err) {
      showPopup("Unable to generate report", "error");
    } finally {
      setLoadingView(false);
    }
  };

  const handlePrint = async () => {
    try {
      setLoadingPrint(true);
      await fetchPdf("p");
    } catch {
      showPopup("Unable to print report", "error");
    } finally {
      setLoadingPrint(false);
    }
  };

  return (
    <div className="content-wrapper" style={{
      backgroundColor: "#f5f7f9",
      minHeight: "100vh",
      padding: "2rem"
    }}>
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}

      {pdfUrl && (
        <PdfViewer
          pdfUrl={pdfUrl}
          name={fileName}
          onClose={() => setPdfUrl(null)}
        />
      )}

      <div className="row justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card" style={{
            borderRadius: "8px",
            boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.15)",
            border: "none",
            overflow: "hidden"
          }}>
            <div className="card-header" style={{
              backgroundColor: "#6aab9c",
              color: "white",
              padding: "1rem 1.5rem",
              borderBottom: "1px solid #245e7a",
              textAlign: "center"
            }}>
              <h4 className="modal-title fw-bold fs-6" style={{ margin: 0 }}>
                <i className="mdi mdi-file-pdf-box me-2"></i>
                {title}
              </h4>
            </div>

            <div className="card-body" style={{ padding: "2rem" }}>
              <div style={{
                backgroundColor: "#f8f9fa",
                borderRadius: "6px",
                padding: "1.5rem",
                marginBottom: "2rem",
                textAlign: "center",
                border: "1px solid #e0e0e0"
              }}>
                <i className="mdi mdi-file-document-outline" style={{
                  fontSize: "2.5rem",
                  color: "#6aab9c",
                  marginBottom: "0.5rem"
                }}></i>
                <h6 style={{ margin: "0.5rem 0", color: "#333", fontWeight: 500 }}>
                  Ready to Generate Report
                </h6>
                <p style={{ margin: 0, color: "#666", fontSize: "0.85rem" }}>
                  Choose an action below to view, download or print your report
                </p>
              </div>

              <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                <button
                  className="btn btn-primary"
                  onClick={handleViewDownload}
                  disabled={loadingView}
                  style={{
                    borderRadius: "4px",
                    padding: "8px 20px",
                    fontWeight: 500,
                    backgroundColor: "#6aab9c",
                    border: "none",
                    fontSize: "0.875rem"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#5a9b8c";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#6aab9c";
                  }}
                >
                  {loadingView ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <i className="fa fa-eye me-2"></i>
                      VIEW / DOWNLOAD
                    </>
                  )}
                </button>

                <button
                  className="btn btn-warning"
                  onClick={handlePrint}
                  disabled={loadingPrint}
                  style={{
                    borderRadius: "4px",
                    padding: "8px 20px",
                    fontWeight: 500,
                    backgroundColor: "#ffc107",
                    border: "none",
                    color: "#000",
                    fontSize: "0.875rem"
                  }}
                >
                  {loadingPrint ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Printing...
                    </>
                  ) : (
                    <>
                      <i className="fa fa-print me-2"></i>
                      PRINT
                    </>
                  )}
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => navigate(returnPath)}
                  style={{
                    borderRadius: "4px",
                    padding: "8px 20px",
                    fontWeight: 500,
                    fontSize: "0.875rem"
                  }}
                >
                  <i className="fa fa-arrow-left me-2"></i>
                  BACK
                </button>
              </div>
            </div>

            <div className="card-footer" style={{
              backgroundColor: "#f8f9fa",
              borderTop: "1px solid #e0e0e0",
              padding: "0.75rem 1.5rem",
              fontSize: "0.75rem",
              color: "#666"
            }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <i className="mdi mdi-information-outline me-1"></i>
                  Secure Report Generation
                </div>
                <div>
                  <i className="mdi mdi-lock me-1"></i>
                  Encrypted Transfer
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewDownLoadReport;