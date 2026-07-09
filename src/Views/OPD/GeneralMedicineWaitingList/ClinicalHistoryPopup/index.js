import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { ALL_REPORTS } from "../../../../config/apiConfig";
import Pagination from "../../../../Components/Pagination";
import Psychiatrist from "../../Psychiatrist";

const ClinicalHistoryPopup = ({
  show,
  onClose,
  visitsData,
  vitalsData,
  popupType,
  currentPage,
  totalPages,
  totalElements,
  pageSize = 5,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  patientId,
  visitId,
  onPsychiatristSave,
  psychiatristValue,
  psychiatristHistoryData = [],
  psychiatristHistoryLoading = false,
  psychiatristHistoryCurrentPage = 0,
  psychiatristHistoryTotalPages = 0,
  psychiatristHistoryTotalElements = 0,
  psychiatristHistoryPageSize = 5,
  onPsychiatristHistoryPageChange,
  selectedPsychiatristHistory,
  setSelectedPsychiatristHistory,
  showPsychiatristDetailModal,
  setShowPsychiatristDetailModal,
}) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const psychiatristRef = useRef(null);
  const [loadingStates, setLoadingStates] = useState({
    generating: null,
    printing: null,
  });

  // Helper to set loading state
  const setLoading = (type, value) => {
    setLoadingStates((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  // Function to handle OPD Case Sheet - View/Download
  const handleViewDownloadCaseSheet = async (visitId) => {
    console.log("View/Download clicked for visitId:", visitId);

    if (!visitId) {
      alert("Missing visit ID for generating OPD Case Sheet");
      return;
    }

    setLoading("generating", visitId);
    setPdfUrl(null);

    try {
      const url = `${ALL_REPORTS}/opdCaseSheetReport?visitId=${visitId}&flag=d`;
      console.log("Calling URL:", url);

      const response = await axios.get(url, {
        responseType: "blob",
      });

      console.log("Response status:", response.status);

      if (response.status === 200) {
        const blob = new Blob([response.data], { type: "application/pdf" });
        const fileURL = window.URL.createObjectURL(blob);
        setPdfUrl(fileURL);
        setShowPdfModal(true);
      } else {
        throw new Error("Failed to generate PDF");
      }
    } catch (error) {
      console.error("Error generating OPD Case Sheet:", error);
      alert("Failed to generate OPD Case Sheet. Please try again.");
    } finally {
      setLoading("generating", null);
    }
  };

  // Function to handle Print
  const handlePrintCaseSheet = async (visitId) => {
    console.log("Print clicked for visitId:", visitId);

    if (!visitId) {
      alert("Missing visit ID for printing OPD Case Sheet");
      return;
    }

    setLoading("printing", visitId);

    try {
      const url = `${ALL_REPORTS}/opdCaseSheetReport?visitId=${visitId}&flag=p`;
      console.log("Print URL:", url);

      const response = await axios.get(url, {
        responseType: "blob",
      });

      if (response.status === 200) {
        const blob = new Blob([response.data], { type: "application/pdf" });
        const fileURL = window.URL.createObjectURL(blob);

        // Open in new window and trigger print
        const printWindow = window.open(fileURL, "_blank");
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }

        // Clean up
        setTimeout(() => {
          window.URL.revokeObjectURL(fileURL);
        }, 1000);
      } else {
        alert("Failed to print OPD Case Sheet");
      }
    } catch (error) {
      console.error("Error printing OPD Case Sheet:", error);
      alert("Failed to print OPD Case Sheet. Please try again.");
    } finally {
      setLoading("printing", null);
    }
  };

  const formatDate = (date) => {
    if (!date || date === "-") return "-";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return String(date);
    return parsed.toLocaleDateString("en-GB");
  };

  const handleDownloadPdf = () => {
    if (pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `OPD_Case_Sheet_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePrintPdf = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  const closePdfModal = () => {
    if (pdfUrl) {
      window.URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setShowPdfModal(false);
  };

  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [show]);

  if (!show) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getTitle = () => {
    if (popupType === "vitals") {
      return "PREVIOUS VITALS HISTORY";
    }
    if (popupType === "psychiatrist-history") {
      return "Assessment History";
    }
    if (popupType === "psychiatrist") {
      return "PSYCHIATRIST ASSESSMENT";
    }
    return "PREVIOUS VISITS HISTORY";
  };

  const getIcon = () => {
    if (popupType === "vitals") {
      return "mdi mdi-heart-pulse me-2";
    }
    if (popupType === "psychiatrist-history") {
      return "mdi mdi-brain me-2";
    }
    if (popupType === "psychiatrist") {
      return "mdi mdi-brain me-2";
    }
    return "mdi mdi-clock-history me-2";
  };

  const isGenerating = (visitId) => loadingStates.generating === visitId;
  const isPrinting = (visitId) => loadingStates.printing === visitId;

  // Convert 0-based page to 1-based for Pagination component
  const handlePageChange = (newPage) => {
    // Pagination component uses 1-based indexing, convert to 0-based
    onPageChange(newPage - 1);
  };

  const totalRecords =
    popupType === "psychiatrist-history"
      ? psychiatristHistoryTotalElements
      : totalElements || 0;

  const selectedPsychiatristAssessments = Array.isArray(
    selectedPsychiatristHistory?.assessment?.assessments,
  )
    ? selectedPsychiatristHistory.assessment.assessments
    : Array.isArray(selectedPsychiatristHistory?.assessments)
      ? selectedPsychiatristHistory.assessments
      : [];

  const selectedPsychiatristTopicName =
    selectedPsychiatristHistory?.topicName ||
    selectedPsychiatristHistory?.assessment?.topicName ||
    "";

  const visiblePsychiatristAssessments =
    selectedPsychiatristTopicName &&
    selectedPsychiatristAssessments.length > 1
      ? selectedPsychiatristAssessments.filter(
          (assessment) =>
            (assessment.topicName || "").trim() ===
            selectedPsychiatristTopicName.trim(),
        )
      : selectedPsychiatristAssessments;

  const getAssessmentQuestions = (assessment) => {
    const questionList = Array.isArray(assessment?.questionsResponses)
      ? assessment.questionsResponses
      : Array.isArray(assessment?.questions)
        ? assessment.questions
        : Array.isArray(assessment?.details)
          ? assessment.details
          : Array.isArray(assessment?.answers)
            ? assessment.answers
            : [];

    if (questionList.length > 0) {
      return questionList;
    }

    if (Array.isArray(selectedPsychiatristHistory?.assessment?.details)) {
      return selectedPsychiatristHistory.assessment.details;
    }

    if (Array.isArray(selectedPsychiatristHistory?.assessment?.rows)) {
      return selectedPsychiatristHistory.assessment.rows.flatMap((row) =>
        Array.isArray(row?.questions) ? row.questions : [],
      );
    }

    return [];
  };

  return ReactDOM.createPortal(
    <>
      {/* Main Modal */}
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
            top: "5vh",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="modal-content"
            style={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            {/* Header */}
            <div
              className="modal-header"
              style={{
                backgroundColor: "#6aab9c",
                color: "white",
                borderBottom: "1px solid #245e7a",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px 8px 0 0",
                flexShrink: 0,
              }}
            >
              <h5 className="modal-title fw-bold fs-6">
                <i className={getIcon()}></i>
                {getTitle()}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
                style={{ margin: 0 }}
              />
            </div>

            {/* Body */}
            <div
              className="modal-body"
              style={{
                padding: "1.5rem",
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
              }}
            >
              {/* Loading State */}
              {isLoading && (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading data...</p>
                </div>
              )}

              {/* Visits Table */}
              {!isLoading && popupType === "visits" && (
                <>
                  {visitsData?.length > 0 ? (
                    <div>
                      <div className="table-responsive">
                        <table
                          className="table table-bordered table-sm"
                          style={{ marginBottom: 0 }}
                        >
                          <thead className="table-light">
                            <tr>
                              <th
                                style={{
                                  padding: "8px",
                                  fontSize: "0.750rem",
                                  fontWeight: "bold",
                                }}
                              >
                                Visit Date
                              </th>
                              <th
                                style={{
                                  padding: "8px",
                                  fontSize: "0.750rem",
                                  fontWeight: "bold",
                                }}
                              >
                                Doctor Name
                              </th>
                              <th
                                style={{
                                  padding: "8px",
                                  fontSize: "0.750rem",
                                  fontWeight: "bold",
                                }}
                              >
                                Department
                              </th>
                              <th
                                style={{
                                  padding: "8px",
                                  fontSize: "0.750rem",
                                  fontWeight: "bold",
                                }}
                              >
                                ICD Diagnosis
                              </th>
                              <th
                                style={{
                                  padding: "8px",
                                  fontSize: "0.750rem",
                                  fontWeight: "bold",
                                }}
                              >
                                Working Diagnosis
                              </th>
                              <th
                                style={{
                                  padding: "8px",
                                  fontSize: "0.750rem",
                                  fontWeight: "bold",
                                  textAlign: "center",
                                }}
                              >
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {visitsData.map((visit, index) => (
                              <tr key={visit.visitId || index}>
                                <td
                                  style={{
                                    padding: "8px",
                                    verticalAlign: "middle",
                                  }}
                                >
                                  {formatDate(visit.visitDate)}
                                </td>
                                <td
                                  style={{
                                    padding: "8px",
                                    verticalAlign: "middle",
                                  }}
                                >
                                  {visit.doctorName || "-"}
                                </td>
                                <td
                                  style={{
                                    padding: "8px",
                                    verticalAlign: "middle",
                                  }}
                                >
                                  {visit.department || "-"}
                                </td>
                                <td
                                  style={{
                                    padding: "8px",
                                    verticalAlign: "middle",
                                  }}
                                >
                                  <span style={{ color: "#0d6efd" }}>
                                    {visit.icdDiag || "-"}
                                  </span>
                                </td>
                                <td
                                  style={{
                                    padding: "8px",
                                    verticalAlign: "middle",
                                  }}
                                >
                                  {visit.workingDiag || "-"}
                                </td>
                                <td
                                  style={{
                                    padding: "8px",
                                    verticalAlign: "middle",
                                    textAlign: "center",
                                  }}
                                >
                                  <div className="d-flex gap-2 justify-content-center">
                                    <button
                                      className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                                      onClick={() =>
                                        handleViewDownloadCaseSheet(
                                          visit.visitId,
                                        )
                                      }
                                      disabled={
                                        isGenerating(visit.visitId) ||
                                        isPrinting(visit.visitId)
                                      }
                                    >
                                      {isGenerating(visit.visitId) ? (
                                        <>
                                          <span
                                            className="spinner-border spinner-border-sm"
                                            role="status"
                                          ></span>
                                          <span className="ms-1">
                                            Loading...
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <i className="fa fa-eye"></i>
                                          <span>View</span>
                                        </>
                                      )}
                                    </button>
                                    <button
                                      className="btn btn-sm btn-warning d-flex align-items-center gap-1"
                                      onClick={() =>
                                        handlePrintCaseSheet(visit.visitId)
                                      }
                                      disabled={
                                        isPrinting(visit.visitId) ||
                                        isGenerating(visit.visitId)
                                      }
                                    >
                                      {isPrinting(visit.visitId) ? (
                                        <>
                                          <span
                                            className="spinner-border spinner-border-sm"
                                            role="status"
                                          ></span>
                                          <span className="ms-1">
                                            Printing...
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <i className="fa fa-print"></i>
                                          <span>Print</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Component */}
                      {totalElements > 0 && (
                        <div className="mt-3">
                          <Pagination
                            totalItems={totalElements}
                            itemsPerPage={pageSize}
                            currentPage={currentPage + 1} // Convert to 1-based for component
                            onPageChange={handlePageChange}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <i
                        className="mdi mdi-inbox"
                        style={{ fontSize: "48px", color: "#6c757d" }}
                      />
                      <p className="mt-2 mb-0 text-muted">
                        No Previous Visits Found
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Vitals Table */}
              {!isLoading && popupType === "vitals" && (
                <>
                  {vitalsData?.length > 0 ? (
                    <div>
                      <div className="table-responsive">
                        <table
                          className="table table-bordered table-sm"
                          style={{ marginBottom: 0 }}
                        >
                          <thead className="table-light">
                            <tr>
                              <th
                                style={{
                                  padding: "8px",
                                  fontSize: "0.750rem",
                                  fontWeight: "bold",
                                }}
                              >
                                Visit Date
                              </th>
                              <th
                                style={{
                                  padding: "8px",
                                  fontSize: "0.750rem",
                                  fontWeight: "bold",
                                }}
                              >
                                Height (cm)
                              </th>
                              <th
                                style={{
                                  padding: "8px",
                                  fontSize: "0.750rem",
                                  fontWeight: "bold",
                                }}
                              >
                                Weight (kg)
                              </th>
                              <th
                                style={{
                                  padding: "8px",
                                  fontSize: "0.750rem",
                                  fontWeight: "bold",
                                }}
                              >
                                BMI (kg/m²)
                              </th>
                              <th
                                style={{
                                  padding: "8px",
                                  fontSize: "0.750rem",
                                  fontWeight: "bold",
                                }}
                              >
                                BP (mmHg)
                              </th>
                              <th
                                style={{
                                  padding: "8px",
                                  fontSize: "0.750rem",
                                  fontWeight: "bold",
                                }}
                              >
                                Pulse (bpm)
                              </th>
                              <th
                                style={{
                                  padding: "8px",
                                  fontSize: "0.750rem",
                                  fontWeight: "bold",
                                }}
                              >
                                Temp (°F)
                              </th>
                              <th
                                style={{
                                  padding: "8px",
                                  fontSize: "0.750rem",
                                  fontWeight: "bold",
                                }}
                              >
                                RR
                              </th>
                              <th
                                style={{
                                  padding: "8px",
                                  fontSize: "0.750rem",
                                  fontWeight: "bold",
                                }}
                              >
                                SpO₂ (%)
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {vitalsData.map((vital, idx) => (
                              <tr key={idx}>
                                <td
                                  style={{
                                    padding: "8px",
                                    verticalAlign: "middle",
                                  }}
                                >
                                  {formatDate(vital.visitDate)}
                                </td>
                                <td
                                  style={{
                                    padding: "8px",
                                    verticalAlign: "middle",
                                  }}
                                >
                                  {vital.height || "-"}
                                </td>
                                <td
                                  style={{
                                    padding: "8px",
                                    verticalAlign: "middle",
                                  }}
                                >
                                  {vital.weight || "-"}
                                </td>
                                <td
                                  style={{
                                    padding: "8px",
                                    verticalAlign: "middle",
                                  }}
                                >
                                  {vital.bmi || "-"}
                                </td>
                                <td
                                  style={{
                                    padding: "8px",
                                    verticalAlign: "middle",
                                  }}
                                >
                                  {vital.bpSystolic && vital.bpDiastolic
                                    ? `${vital.bpSystolic}/${vital.bpDiastolic}`
                                    : "-"}
                                </td>
                                <td
                                  style={{
                                    padding: "8px",
                                    verticalAlign: "middle",
                                  }}
                                >
                                  {vital.pulse || "-"}
                                </td>
                                <td
                                  style={{
                                    padding: "8px",
                                    verticalAlign: "middle",
                                  }}
                                >
                                  {vital.temperature || "-"}
                                </td>
                                <td
                                  style={{
                                    padding: "8px",
                                    verticalAlign: "middle",
                                  }}
                                >
                                  {vital.rr || "-"}
                                </td>
                                <td
                                  style={{
                                    padding: "8px",
                                    verticalAlign: "middle",
                                  }}
                                >
                                  {vital.spo2 || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Component for Vitals */}
                      {totalElements > 0 && (
                        <div className="mt-3">
                          <Pagination
                            totalItems={totalElements}
                            itemsPerPage={pageSize}
                            currentPage={currentPage + 1} // Convert to 1-based for component
                            onPageChange={handlePageChange}
                          />
                        </div>
                      )}
                    </div>
              ) : (
                    <div className="text-center py-5">
                      <i
                        className="mdi mdi-heart-pulse"
                        style={{ fontSize: "48px", color: "#6c757d" }}
                      />
                      <p className="mt-2 mb-0 text-muted">
                        No Previous Vitals Found
                      </p>
                    </div>
                  )}
                </>
              )}
              {/* Psychiatrist History Table */}
              {!isLoading && popupType === "psychiatrist-history" && (
                <>
                  {psychiatristHistoryLoading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2 text-muted">Loading data...</p>
                    </div>
                  ) : psychiatristHistoryData?.length > 0 ? (
                    <div>
                      <div className="table-responsive">
                        <table
                          className="table table-bordered table-sm"
                          style={{ marginBottom: 0 }}
                        >
                          <thead className="table-light">
                            <tr>
                              <th style={{ padding: "8px", fontSize: "0.750rem", fontWeight: "bold" }}>
                                Assessment Date
                              </th>
                              <th style={{ padding: "8px", fontSize: "0.750rem", fontWeight: "bold" }}>
                                Topic name
                              </th>
                              <th style={{ padding: "8px", fontSize: "0.750rem", fontWeight: "bold" }}>
                                Doctor Name
                              </th>
                              <th style={{ padding: "8px", fontSize: "0.750rem", fontWeight: "bold" }}>
                                Score
                              </th>
                              <th style={{ padding: "8px", fontSize: "0.750rem", fontWeight: "bold", textAlign: "center" }}>
                                View
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {psychiatristHistoryData.map((record, idx) => (
                              <tr key={`${record.assessmentDate || "record"}-${idx}`}>
                                <td style={{ padding: "8px", verticalAlign: "middle" }}>
                                  {formatDate(record.assessmentDate)}
                                </td>
                                <td style={{ padding: "8px", verticalAlign: "middle" }}>
                                  {record.topicName || "-"}
                                </td>
                                <td style={{ padding: "8px", verticalAlign: "middle" }}>
                                  {record.doctorName || "-"}
                                </td>
                                <td style={{ padding: "8px", verticalAlign: "middle" }}>
                                  {record.score ?? "-"}
                                </td>
                                <td style={{ padding: "8px", verticalAlign: "middle", textAlign: "center" }}>
                                  <button
                                    className="btn btn-sm btn-primary d-flex align-items-center gap-1 mx-auto"
                                    onClick={() => {
                                      setSelectedPsychiatristHistory?.(record);
                                      setShowPsychiatristDetailModal?.(true);
                                    }}
                                  >
                                    <i className="fa fa-eye"></i>
                                    <span>View</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {psychiatristHistoryTotalElements > 0 && (
                        <div className="mt-3">
                          <Pagination
                            totalItems={psychiatristHistoryTotalElements}
                            itemsPerPage={psychiatristHistoryPageSize}
                            currentPage={psychiatristHistoryCurrentPage + 1}
                            onPageChange={(newPage) =>
                              onPsychiatristHistoryPageChange?.(newPage - 1)
                            }
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <i
                        className="mdi mdi-brain"
                        style={{ fontSize: "48px", color: "#6c757d" }}
                      />
                      <p className="mt-2 mb-0 text-muted">
                        No Psychiatrist History Found
                      </p>
                    </div>
                  )}
                </>
              )}
              {/* Psychiatrist Assessment */}
              {!isLoading && popupType === "psychiatrist" && (
                <div>
                  <Psychiatrist
                    ref={psychiatristRef}
                    onSave={onPsychiatristSave}
                    value={psychiatristValue}
                    hideSaveButton
                    readOnly={false}
                  />
                </div>
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
                  <i className="mdi mdi-information-outline me-1" />
                  Total: {totalRecords} record(s)
                </div>
                <div className="d-flex gap-2">
                  {popupType === "psychiatrist" && (
                    <button
                      className="btn btn-success btn-sm px-3"
                      onClick={() => psychiatristRef.current?.save?.()}
                      style={{
                        borderRadius: "4px",
                        border: "none",
                      }}
                    >
                      <i className="mdi mdi-content-save me-2" />
                      SAVE
                    </button>
                  )}
                  <button
                    className="btn btn-primary btn-sm px-3"
                    onClick={onClose}
                    style={{
                      borderRadius: "4px",
                      backgroundColor: "#6aab9c",
                      border: "none",
                    }}
                  >
                    <i className="mdi mdi-check-circle me-2" />
                    CLOSE
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {popupType === "psychiatrist-history" &&
        showPsychiatristDetailModal &&
        selectedPsychiatristHistory && (
          <div
            className="modal fade show"
            style={{
              display: "block",
              backgroundColor: "rgba(0,0,0,0.65)",
              zIndex: 1060,
            }}
            tabIndex="-1"
            onClick={() => setShowPsychiatristDetailModal?.(false)}
          >
            <div
              className="modal-dialog modal-xl"
              style={{
                width: "calc(100vw - 340px)",
                left: "305px",
                maxWidth: "none",
                height: "auto",
                maxHeight: "85vh",
                margin: "4vh auto",
                position: "fixed",
                top: "4vh",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="modal-content"
                style={{ height: "100%", display: "flex", flexDirection: "column" }}
              >
                <div
                  className="modal-header"
                  style={{
                    backgroundColor: "#6aab9c",
                    color: "white",
                    borderBottom: "1px solid #245e7a",
                    padding: "0.75rem 1.5rem",
                    borderRadius: "8px 8px 0 0",
                    flexShrink: 0,
                  }}
                >
                  <h5 className="modal-title fw-bold fs-6">
                    <i className="mdi mdi-brain me-2" />
                    Assessment History Details
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowPsychiatristDetailModal?.(false)}
                    style={{ margin: 0 }}
                  />
                </div>

                <div
                  className="modal-body"
                  style={{
                    padding: "1.5rem",
                    flex: 1,
                    overflowY: "auto",
                    overflowX: "hidden",
                  }}
                >
                  <div className="row g-3 mb-3">
                    <div className="col-md-3">
                      <label className="form-label fw-bold mb-1">
                        Assessment Date
                      </label>
                      <div className="form-control bg-light">
                        {formatDate(selectedPsychiatristHistory.assessmentDate)}
                      </div>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold mb-1">
                        Topic Name
                      </label>
                      <div className="form-control bg-light">
                        {selectedPsychiatristHistory.topicName || "-"}
                      </div>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold mb-1">
                        Doctor Name
                      </label>
                      <div className="form-control bg-light">
                        {selectedPsychiatristHistory.doctorName || "-"}
                      </div>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold mb-1">Score</label>
                      <div className="form-control bg-light">
                        {selectedPsychiatristHistory.score ?? "-"}
                      </div>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-bordered table-sm mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "65%", padding: "8px" }}>Question</th>
                          <th style={{ width: "35%", padding: "8px" }}>Answer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visiblePsychiatristAssessments.length > 0 ? (
                          visiblePsychiatristAssessments.map((assessment, assessmentIndex) => (
                            <React.Fragment
                              key={`${assessment.assessmentHeaderId || assessment.topicName || "assessment"}-${assessmentIndex}`}
                            >
                              <tr className="table-secondary">
                                <td colSpan="2" style={{ padding: "8px", fontWeight: 700 }}>
                                  {assessment.topicName || `Topic ${assessmentIndex + 1}`}
                                </td>
                              </tr>
                              {getAssessmentQuestions(assessment).map((question, questionIndex) => (
                                  <tr
                                    key={`${assessment.assessmentHeaderId || assessmentIndex}-${questionIndex}`}
                                  >
                                    <td style={{ padding: "8px", verticalAlign: "top" }}>
                                      {question.questionName || question.questionText || `Question ${questionIndex + 1}`}
                                    </td>
                                    <td style={{ padding: "8px", verticalAlign: "top" }}>
                                      {question.questionsAns ?? question.answerValue ?? "-"}
                                    </td>
                                  </tr>
                                ))}
                            </React.Fragment>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="2" className="text-center text-muted py-4">
                              No question and answer details available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div
                  style={{
                    padding: "1rem 1.5rem",
                    borderTop: "1px solid #e0e0e0",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "0 0 8px 8px",
                    flexShrink: 0,
                  }}
                >
                  <div className="d-flex justify-content-end">
                    <button
                      className="btn btn-primary btn-sm px-3"
                      onClick={() => setShowPsychiatristDetailModal?.(false)}
                      style={{
                        borderRadius: "4px",
                        backgroundColor: "#6aab9c",
                        border: "none",
                      }}
                    >
                      <i className="mdi mdi-check-circle me-2" />
                      CLOSE
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* PDF Modal */}
      {showPdfModal && pdfUrl && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(0,0,0,0.9)",
            zIndex: 999999,
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: "auto",
          }}
          onClick={closePdfModal}
        >
          <div
            className="modal-dialog modal-xl"
            style={{
              margin: "1rem auto",
              maxWidth: "95vw",
              width: "95%",
              height: "95vh",
              position: "relative",
              top: "50%",
              transform: "translateY(-50%)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-content"
              style={{ height: "100%", border: "none", borderRadius: "8px" }}
            >
              <div
                className="modal-header"
                style={{
                  backgroundColor: "#6aab9c",
                  color: "white",
                  borderBottom: "1px solid #245e7a",
                  padding: "0.75rem 1rem",
                }}
              >
                <h5 className="modal-title">
                  <i className="mdi mdi-file-pdf-box me-2"></i>
                  OPD Case Sheet
                </h5>
                <div>
                  <button
                    className="btn btn-light btn-sm me-2"
                    onClick={handleDownloadPdf}
                    style={{ fontWeight: 500 }}
                  >
                    <i className="fa fa-download me-1"></i>
                    Download
                  </button>
                  <button
                    className="btn btn-light btn-sm me-2"
                    onClick={handlePrintPdf}
                    style={{ fontWeight: 500 }}
                  >
                    <i className="fa fa-print me-1"></i>
                    Print
                  </button>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={closePdfModal}
                    style={{ filter: "brightness(0) invert(1)" }}
                  ></button>
                </div>
              </div>
              <div className="modal-body p-0">
                <iframe
                  src={pdfUrl}
                  style={{
                    width: "100%",
                    height: "calc(100% - 60px)",
                    border: "none",
                    minHeight: "80vh",
                  }}
                  title="OPD Case Sheet"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
};

export default ClinicalHistoryPopup;

