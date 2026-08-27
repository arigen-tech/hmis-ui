import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Popup from "../popup";
import PdfViewer from "../PdfViewModel/PdfViewer";
import { fetchPdfReportForViewAndPrint } from "../../../src/service/apiService";

const ViewDownloadWithUnlimitedButtons = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [title, setTitle] = useState("Report");
  const [fileName, setFileName] = useState("Report");
  const [returnPath, setReturnPath] = useState(-1);

  const [buttons, setButtons] = useState([]);
  const [showBack, setShowBack] = useState(true);

  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingKey, setLoadingKey] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);

  useEffect(() => {
    if (!location.state) {
      showPopup("Invalid access to report page", "error");
      setTimeout(() => navigate(-1), 2000);
      return;
    }

    setTitle(location.state.title || "Report");
    setFileName(location.state.fileName || "Report");
    setReturnPath(location.state.returnPath || -1);
    if (location.state.showBack !== undefined) setShowBack(location.state.showBack);

    let dynamicButtons = [];

    // 1. Custom "buttons" array (supports unlimited buttons)
    if (Array.isArray(location.state.buttons) && location.state.buttons.length > 0) {
      dynamicButtons = location.state.buttons.map((btn, index) => ({
        key: btn.key || `btn-${index}`,
        label: btn.label || "Button",
        type: btn.type || "view", // "view" or "print"
        url: btn.url || null,
        className: btn.className || "btn btn-primary",
        icon: btn.icon || "fa fa-file-pdf-o",
        loadingText: btn.loadingText || "Loading...",
        style: btn.style || {},
      }));
    }
    // 2. Fallback to simple two buttons from viewUrl and printUrl
    else if (location.state.viewUrl || location.state.printUrl) {
      if (location.state.viewUrl) {
        dynamicButtons.push({
          key: "view",
          label: location.state.viewButtonLabel || "VIEW / DOWNLOAD",
          type: "view",
          url: location.state.viewUrl,
          className: "btn btn-primary",
          icon: "fa fa-eye",
          loadingText: "Generating...",
          style: { backgroundColor: "#6aab9c", border: "none" },
        });
      }
      if (location.state.printUrl) {
        dynamicButtons.push({
          key: "print",
          label: location.state.printButtonLabel || "PRINT",
          type: "print",
          url: location.state.printUrl,
          className: "btn btn-warning",
          icon: "fa fa-print",
          loadingText: "Printing...",
          style: { backgroundColor: "#ffc107", border: "none", color: "#000" },
        });
      }
    }
    // 3. Legacy fallback: single reportUrl with flags
    else if (location.state.reportUrl) {
      dynamicButtons = [
        {
          key: "view",
          label: location.state.viewButtonLabel || "VIEW / DOWNLOAD",
          type: "view",
          url: location.state.reportUrl,
          className: "btn btn-primary",
          icon: "fa fa-eye",
          loadingText: "Generating...",
          style: { backgroundColor: "#6aab9c", border: "none" },
        },
        {
          key: "print",
          label: location.state.printButtonLabel || "PRINT",
          type: "print",
          url: location.state.reportUrl,
          className: "btn btn-warning",
          icon: "fa fa-print",
          loadingText: "Printing...",
          style: { backgroundColor: "#ffc107", border: "none", color: "#000" },
        },
      ];
    }
    // 4. No buttons configured
    else {
      showPopup("No report buttons configured", "error");
      setTimeout(() => navigate(-1), 2000);
    }

    setButtons(dynamicButtons);
  }, [location.state, navigate]);

  const showPopup = (message, type = "info") => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleButtonClick = async (btn) => {
    if (!btn.url) {
      showPopup(`No URL configured for ${btn.label}`, "error");
      return;
    }

    try {
      setLoadingKey(btn.key);

      // Determine flag based on button type
      const flag = btn.type === "print" ? "p" : "d";

      // Fetch PDF using apiService function (it appends &flag= automatically)
      const blob = await fetchPdfReportForViewAndPrint(btn.url, flag);

      if (btn.type === "print") {
        // Print action
        const fileURL = window.URL.createObjectURL(blob);
        const printWindow = window.open(fileURL);
        if (printWindow) {
          printWindow.onload = () => printWindow.print();
        } else {
          showPopup("Popup blocked. Please allow popups to print.", "error");
        }
      } else {
        // View/Download action (opens modal)
        const fileURL = window.URL.createObjectURL(blob);
        setPdfUrl(fileURL);
      }
    } catch (error) {
      console.error("Report fetch error:", error);
      showPopup(`Unable to ${btn.type === "print" ? "print" : "generate"} report`, "error");
    } finally {
      setLoadingKey(null);
    }
  };

  const handleBack = () => navigate(returnPath);

  return (
    <div className="content-wrapper" style={{ backgroundColor: "#f5f7f9", minHeight: "100vh", padding: "2rem" }}>
      {popupMessage && <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />}
      {pdfUrl && <PdfViewer pdfUrl={pdfUrl} name={fileName} onClose={() => setPdfUrl(null)} />}

      <div className="row justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card" style={{ borderRadius: "8px", boxShadow: "0 0.5rem 1rem rgba(0,0,0,0.15)", border: "none", overflow: "hidden" }}>
            <div className="card-header" style={{ backgroundColor: "#6aab9c", color: "white", padding: "1rem 1.5rem", borderBottom: "1px solid #245e7a", textAlign: "center" }}>
              <h4 className="modal-title fw-bold fs-6" style={{ margin: 0 }}>
                <i className="mdi mdi-file-pdf-box me-2"></i>
                {title}
              </h4>
            </div>

            <div className="card-body" style={{ padding: "2rem" }}>
              <div style={{ backgroundColor: "#f8f9fa", borderRadius: "6px", padding: "1.5rem", marginBottom: "2rem", textAlign: "center", border: "1px solid #e0e0e0" }}>
                <i className="mdi mdi-file-document-outline" style={{ fontSize: "2.5rem", color: "#6aab9c", marginBottom: "0.5rem" }}></i>
                <h6 style={{ margin: "0.5rem 0", color: "#333", fontWeight: 500 }}>Ready to Generate Report</h6>
                <p style={{ margin: 0, color: "#666", fontSize: "0.85rem" }}>Choose an action below to view, download or print your report</p>
              </div>

              <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center flex-wrap">
                {buttons.map((btn) => (
                  <button
                    key={btn.key}
                    className={btn.className}
                    onClick={() => handleButtonClick(btn)}
                    disabled={loadingKey === btn.key || !btn.url}
                    style={{
                      borderRadius: "4px",
                      padding: "8px 20px",
                      fontWeight: 500,
                      fontSize: "0.875rem",
                      ...btn.style,
                    }}
                  >
                    {loadingKey === btn.key ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        {btn.loadingText}
                      </>
                    ) : (
                      <>
                        <i className={`${btn.icon} me-2`}></i>
                        {btn.label}
                      </>
                    )}
                  </button>
                ))}

                {showBack && (
                  <button
                    className="btn btn-secondary"
                    onClick={handleBack}
                    style={{ borderRadius: "4px", padding: "8px 20px", fontWeight: 500, fontSize: "0.875rem" }}
                  >
                    <i className="fa fa-arrow-left me-2"></i>
                    BACK
                  </button>
                )}
              </div>
            </div>

            <div className="card-footer" style={{ backgroundColor: "#f8f9fa", borderTop: "1px solid #e0e0e0", padding: "0.75rem 1.5rem", fontSize: "0.75rem", color: "#666" }}>
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

export default ViewDownloadWithUnlimitedButtons;