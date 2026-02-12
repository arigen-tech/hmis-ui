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
    <div className="content-wrapper">
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

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="lead">{title} generated successfully</h4>
            </div>

            <div className="card-body mt-4">
              <div className="d-flex gap-4">
                <button
                  className="btn btn-success btn-sm"
                  onClick={handleViewDownload}
                  disabled={loadingView}
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
                  className="btn btn-warning btn-sm"
                  onClick={handlePrint}
                  disabled={loadingPrint}
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
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(returnPath)}
                >
                  <i className="mdi mdi-format-list-bulleted me-2"></i>
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewDownLoadReport;
