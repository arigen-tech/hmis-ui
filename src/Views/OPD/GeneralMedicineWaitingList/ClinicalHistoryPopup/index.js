
import React, { useEffect } from "react";
import ReactDOM from "react-dom";

const ClinicalHistoryPopup = ({ show, onClose, visitsData, vitalsData, popupType }) => {
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [show]);

  if (!show) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Get title based on popupType
  const getTitle = () => {
    if (popupType === "vitals") {
      return "PREVIOUS VITALS HISTORY";
    }
    return "PREVIOUS VISITS HISTORY";
  };

  // Get icon based on popupType
  const getIcon = () => {
    if (popupType === "vitals") {
      return "mdi mdi-heart-pulse me-2";
    }
    return "mdi mdi-clock-history me-2";
  };

  return ReactDOM.createPortal(
    <div
      className="modal fade show"
      style={{
        display: "block",
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 1050,
      }}
      tabIndex="-1"
      onClick={handleBackdropClick}
    >
      <div
        className="modal-dialog modal-lg"
        style={{
          width: "calc(100vw - 310px)",
          left: "285px",
          maxWidth: "none",
          height: "auto",
          maxHeight: "80vh",
          margin: "5vh auto",
          position: "fixed",
            top: "20vh",     

        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <div className="modal-header" style={{
            backgroundColor: "#6aab9c",
            color: "white",
            borderBottom: "1px solid #245e7a",
            padding: "0.75rem 1.5rem",
            borderRadius: "8px 8px 0 0",
            flexShrink: 0,
          }}>
            <h5 className="modal-title fw-bold fs-6">
              <i className={getIcon()}></i>
              {getTitle()}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              style={{ margin: 0 }}
            ></button>
          </div>

          {/* Body - Show table based on popupType */}
          <div
            className="modal-body"
            style={{
              padding: "1.5rem",
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            {/* Show Visits Table when popupType is "visits" */}
            {popupType === "visits" && (
              <>
                {visitsData?.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-bordered table-sm" style={{ marginBottom: 0 }}>
                      <thead className="table-light">
                        <tr>
                          <th style={{ padding: "8px", fontSize: "0.875rem" }}>Visit Date</th>
                          <th style={{ padding: "8px", fontSize: "0.875rem" }}>Doctor Name</th>
                          <th style={{ padding: "8px", fontSize: "0.875rem" }}>Department</th>
                          <th style={{ padding: "8px", fontSize: "0.875rem" }}>ICD Diagnosis</th>
                          <th style={{ padding: "8px", fontSize: "0.875rem" }}>Working Diagnosis</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visitsData.map((visit, index) => (
                          <tr key={index}>
                            <td style={{ padding: "8px", verticalAlign: "middle" }}>{visit.visitDate || "-"}</td>
                            <td style={{ padding: "8px", verticalAlign: "middle" }}>{visit.doctorName || "-"}</td>
                            <td style={{ padding: "8px", verticalAlign: "middle" }}>{visit.department || "-"}</td>
                            <td style={{ padding: "8px", verticalAlign: "middle" }}>
                              <span style={{ color: "#0d6efd" }}>{visit.icdDiag || "-"}</span>
                            </td>
                            <td style={{ padding: "8px", verticalAlign: "middle" }}>{visit.workingDiag || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="mdi mdi-inbox" style={{ fontSize: "48px", color: "#6c757d" }}></i>
                    <p className="mt-2 mb-0 text-muted">No Previous Visits Found</p>
                  </div>
                )}
              </>
            )}

            {/* Show Vitals Table when popupType is "vitals" */}
            {popupType === "vitals" && (
              <>
                {vitalsData?.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-bordered table-sm" style={{ marginBottom: 0 }}>
                      <thead className="table-light">
                        <tr>
                          <th style={{ padding: "8px", fontSize: "0.875rem" }}>Visit Date</th>
                          <th style={{ padding: "8px", fontSize: "0.875rem" }}>Height (cm)</th>
                          <th style={{ padding: "8px", fontSize: "0.875rem" }}>Weight (kg)</th>
                          <th style={{ padding: "8px", fontSize: "0.875rem" }}>BMI</th>
                          <th style={{ padding: "8px", fontSize: "0.875rem" }}>BP</th>
                          <th style={{ padding: "8px", fontSize: "0.875rem" }}>Pulse</th>
                          <th style={{ padding: "8px", fontSize: "0.875rem" }}>Temp (°F)</th>
                          <th style={{ padding: "8px", fontSize: "0.875rem" }}>RR</th>
                          <th style={{ padding: "8px", fontSize: "0.875rem" }}>SpO2 (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vitalsData.map((vital, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: "8px", verticalAlign: "middle" }}>{vital.visitDate || "-"}</td>
                            <td style={{ padding: "8px", verticalAlign: "middle" }}>{vital.height || "-"}</td>
                            <td style={{ padding: "8px", verticalAlign: "middle" }}>{vital.weight || "-"}</td>
                            <td style={{ padding: "8px", verticalAlign: "middle" }}>{vital.bmi || "-"}</td>
                            <td style={{ padding: "8px", verticalAlign: "middle" }}>
                              {vital.bpSystolic && vital.bpDiastolic 
                                ? `${vital.bpSystolic}/${vital.bpDiastolic}` 
                                : "-"}
                            </td>
                            <td style={{ padding: "8px", verticalAlign: "middle" }}>{vital.pulse || "-"}</td>
                            <td style={{ padding: "8px", verticalAlign: "middle" }}>{vital.temperature || "-"}</td>
                            <td style={{ padding: "8px", verticalAlign: "middle" }}>{vital.rr || "-"}</td>
                            <td style={{ padding: "8px", verticalAlign: "middle" }}>{vital.spo2 || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="mdi mdi-heart-pulse" style={{ fontSize: "48px", color: "#6c757d" }}></i>
                    <p className="mt-2 mb-0 text-muted">No Previous Vitals Found</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: "1px solid #e0e0e0",
              backgroundColor: "#f8f9fa",
              borderRadius: "0 0 8px 8px",
              flexShrink: 0,
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted small">
                <i className="mdi mdi-information-outline me-1"></i>
                Total: {popupType === "vitals" ? (vitalsData?.length || 0) : (visitsData?.length || 0)} record(s)
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-primary btn-sm px-3"
                  onClick={onClose}
                  style={{
                    borderRadius: "4px",
                    backgroundColor: "#6aab9c",
                    border: "none",
                  }}
                >
                  <i className="mdi mdi-check-circle me-2"></i>
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ClinicalHistoryPopup;