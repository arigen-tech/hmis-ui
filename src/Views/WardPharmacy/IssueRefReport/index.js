import { useState, useEffect, useRef } from "react";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";
import Popup from "../../../Components/popup";
import { ALL_REPORTS, INVENTORY, MAS_DEPARTMENT, GET_STORE_ISSUE_LIST } from "../../../config/apiConfig";
import { getRequest } from "../../../service/apiService";

const IssueReferenceReport = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const [departmentId, setDepartmentId] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [issueNo, setIssueNo] = useState("");
  const [issuesList, setIssuesList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Show popup function
  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      },
    });
  };

  // Fetch current department by ID
  const fetchCurrentDepartment = async () => {
    try {
      const deptId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId");
      
      console.log("=== Fetching Department Info ===");
      console.log("Department ID from storage:", deptId);
      
      if (!deptId) {
        console.warn("No department ID found in session/local storage");
        setDepartmentName("Unknown Department");
        return;
      }

      setDepartmentId(deptId);

      const response = await getRequest(`${MAS_DEPARTMENT}/getById/${deptId}`);
      console.log("Department API Response:", response);

      if (response && response.data) {
        setDepartmentName(response.data.departmentName || response.data.name || "Unknown Department");
        console.log("✅ Department Name set to:", response.data.departmentName || response.data.name);
      } else if (response && response.response) {
        setDepartmentName(response.response.departmentName || response.response.name || "Unknown Department");
        console.log("✅ Department Name set to:", response.response.departmentName || response.response.name);
      } else {
        console.warn("Unexpected department response structure:", response);
        setDepartmentName("Unknown Department");
      }
    } catch (err) {
      console.error("Error fetching current department:", err);
      setDepartmentName("Error loading department");
    }
  };

  // Auto-fill department on component mount
  useEffect(() => {
    fetchCurrentDepartment();
  }, []);

  // Fetch issues when both dates are selected
  useEffect(() => {
    const fetchIssues = async () => {
      if (!fromDate || !toDate || !departmentId) return;

      // Validate dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      const to = new Date(toDate);
      to.setHours(0, 0, 0, 0);

      if (from > today || to > today || from > to) {
        console.log("Invalid dates, skipping API call");
        return;
      }
      setIsLoading(true);
      try {
        const response = await getRequest(
          `${GET_STORE_ISSUE_LIST}?toDeptId=${departmentId}&fromDate=${fromDate}&toDate=${toDate}`
        );
        
        console.log("Issues API response:", response);
        
        if (response && response.response) {
          // Handle the response structure you provided
          if (Array.isArray(response.response)) {
            setIssuesList(response.response);
            if (response.response.length === 0) {
              showPopup("No issues found for the selected criteria", "info");
            }
          } else {
            setIssuesList([]);
            showPopup("No issues found for the selected criteria", "info");
          }
        } else if (response && response.data) {
          // Alternative response structure
          if (Array.isArray(response.data)) {
            setIssuesList(response.data);
          } else if (response.data.data && Array.isArray(response.data.data)) {
            setIssuesList(response.data.data);
          } else {
            setIssuesList([]);
            showPopup(response.data.message || "No issues found for the selected criteria", "info");
          }
        } else {
          setIssuesList([]);
          showPopup("No issues found for the selected criteria", "info");
        }
      } catch (error) {
        console.error("Error fetching issues:", error);
        showPopup("Failed to fetch issues. Please try again.", "error");
        setIssuesList([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIssues();
  }, [fromDate, toDate, departmentId]);

  const formatDateForDisplay = (dateTimeStr) => {
    if (!dateTimeStr) return "-";
    
    // Handle different possible formats
    try {
      // If it's already a Date object or can be parsed
      const date = new Date(dateTimeStr);
      
      // Check if date is valid
      if (isNaN(date.getTime())) return "-";
      
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "-";
    }
  };

  const getIndentTypeLabel = (indentType) => {
    const normalizedType = (indentType || "").toString().trim().toUpperCase();

    if (normalizedType === "D") return "Drug";
    if (normalizedType === "N") return "Non Drug";

    return "-";
  };

  const handlePrint = async (flag = "P") => {
    if (!fromDate || !toDate) {
      showPopup("Please select both From Date and To Date", "warning");
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      showPopup("From Date cannot be later than To Date", "warning");
      return;
    }

    if (new Date(fromDate) > new Date() || new Date(toDate) > new Date()) {
      showPopup("Dates cannot be in the future", "warning");
      return;
    }

    if (!issueNo && !selectedIssue) {
      showPopup("Please select an issue from the dropdown", "warning");
      return;
    }

    // Get the storeIssueMId for the report API, not the id
    const issueMId = selectedIssue?.storeIssueMId;
    
    if (!issueMId) {
      showPopup("Invalid issue selected. Please select another issue.", "error");
      return;
    }

    console.log("Selected Issue for report:", selectedIssue);
    console.log("Using issueMId for report:", issueMId);
    console.log("Flag:", flag);

    if (flag === "P") {
      setIsPrinting(true);
    } else {
      setIsGeneratingPDF(true);
    }

    try {
      // Use the correct endpoint /indentIssue with issueMId parameter
      const url = `${ALL_REPORTS}/indentIssue?issueMId=${issueMId}&flag=${flag}`;
      
      console.log("Report Request URL:", url);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
        },
      });

      console.log("Report response status:", response.status);
      console.log("Report response headers:", response.headers);

      if (flag === "P") {
        // For printing
        if (response.status === 200) {
          // showPopup("Report sent to printer successfully!", "success");
        } else {
          const errorText = await response.text();
          throw new Error(`Failed to print report: ${errorText}`);
        }
      } else if (flag === "D") {
        // For viewing/downloading
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to generate PDF: ${errorText}`);
        }

        const blob = await response.blob();
        
        // Check if blob is valid
        if (blob.size === 0) {
          throw new Error("Empty PDF response from server");
        }
        
        console.log("PDF blob size:", blob.size, "type:", blob.type);
        
        const fileURL = window.URL.createObjectURL(blob);
        setPdfUrl(fileURL);
      }
    } catch (error) {
      console.error("Error in print operation:", error);
      showPopup(`Failed to ${flag === 'P' ? 'print' : 'generate'} report: ${error.message}`, "error");
    } finally {
      if (flag === "P") {
        setIsPrinting(false);
      } else {
        setIsGeneratingPDF(false);
      }
    }
  };

  const handleViewDownload = () => {
    handlePrint("D");
  };

  const handleFromDateChange = (e) => {
    const selectedDate = e.target.value;
    
    // Don't process if empty
    if (!selectedDate) {
      setFromDate("");
      return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    if (selected > today) {
      showPopup("From date cannot be in the future", "warning");
      return; // Don't update state
    }

    setFromDate(selectedDate);
    setIssuesList([]);
    setIssueNo("");
    setSelectedIssue(null);

    // Clear toDate if it's now invalid
    if (toDate && selectedDate > toDate) {
      setToDate("");
    }
  };

  const handleToDateChange = (e) => {
    const selectedDate = e.target.value;
    
    // Don't process if empty
    if (!selectedDate) {
      setToDate("");
      return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    if (selected > today) {
      showPopup("To date cannot be in the future", "warning");
      return; // Don't update state
    }

    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      
      if (selected < from) {
        showPopup("To date cannot be earlier than From date", "warning");
        return; // Don't update state
      }
    }

    setToDate(selectedDate);
    setIssuesList([]);
    setIssueNo("");
    setSelectedIssue(null);
  };

  const handleToDateFocus = (e) => {
    if (!fromDate) {
      e.preventDefault();
      e.target.blur();
      showPopup("Please select From Date first", "warning");
    }
  };

  const handleIssueSelect = (issue) => {
    setIssueNo(issue.issueNo);
    setSelectedIssue(issue);
    setDropdownOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">
                Indent Issue Report
              </h4>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-4">
                  <label className="form-label fw-bold">Department</label>
                  <input
                    type="text"
                    className="form-control"
                    value={departmentName}
                    readOnly
                    style={{ backgroundColor: "#f5f5f5" }}
                    placeholder={!departmentName ? "Loading..." : ""}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold">From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={handleFromDateChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    min={fromDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={handleToDateChange}
                    disabled={!fromDate}
                    onFocus={handleToDateFocus}
                  />
                </div>

                {/* Custom Dropdown for Issue Reference No */}
                <div className="col-md-4 mt-3" ref={dropdownRef}>
                  <label className="form-label fw-bold">Issue Reference No</label>
                  <div className="dropdown-wrapper" style={{ position: "relative" }}>
                    <div
                      className="d-flex align-items-center justify-content-between"
                      style={{
                        cursor: !fromDate || !toDate || isLoading || issuesList.length === 0 ? "not-allowed" : "pointer",
                        padding: "0.375rem 0.75rem",
                        paddingRight: "2rem",
                        backgroundColor: "#fff",
                        border: "1px solid #ced4da",
                        borderRadius: "0.25rem",
                        minHeight: "calc(1.5em + 0.75rem + 2px)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        opacity: !fromDate || !toDate || isLoading ? 0.65 : 1,
                        userSelect: "none",
                      }}
                      onClick={() => {
                        if (!fromDate || !toDate || isLoading || issuesList.length === 0) return;
                        setDropdownOpen(!dropdownOpen);
                      }}
                    >
                      <span className="text-truncate" style={{ flex: 1 }}>
                        {selectedIssue ? (
                          <>
                            <div style={{ fontWeight: "500" }}>
                              {selectedIssue.issueNo || "-"} / {selectedIssue.indentNo || "-"}
                            </div>
                            <div style={{ fontSize: "0.8em", color: "#6c757d" }}>
                              {selectedIssue.requestedDeptName || selectedIssue.requestedDepartmentName || "-"} | {formatDateForDisplay(selectedIssue.issueDate)} | {getIndentTypeLabel(selectedIssue.indentType)}
                            </div>
                          </>
                        ) : (
                          <span className="text-muted">
                            {isLoading ? "Loading issues..." :
                             issuesList.length === 0 ? (fromDate && toDate ? "No issues found" : "Select dates first") :
                             "Select Issue"}
                          </span>
                        )}
                      </span>
                      <span style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)" }}>
                        <i className="fa fa-chevron-down" />
                      </span>
                    </div>
                    {dropdownOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          zIndex: 1000,
                          backgroundColor: "#fff",
                          border: "1px solid #ced4da",
                          borderRadius: "0.25rem",
                          maxHeight: "250px",
                          overflowY: "auto",
                          marginTop: "2px",
                          boxShadow: "0 0.5rem 1rem rgba(0,0,0,0.15)",
                        }}
                      >
                        {issuesList.map((issue, index) => {
                          const requestedDeptName = issue.requestedDeptName || issue.requestedDepartmentName || issue.requestedDept || "-";
                          const issueDate = formatDateForDisplay(issue.issueDate) || "-";
                          const optionLabel = `${issue.issueNo || "-"} / ${issue.indentNo || "-"}`;
                          const optionSubLabel = `${requestedDeptName} | ${issueDate} | ${getIndentTypeLabel(issue.indentType)}`;

                          return (
                            <div
                              key={issue.issueNo || `issue-${index}`}
                              className="dropdown-item"
                              style={{
                                padding: "0.375rem 0.75rem",
                                cursor: "pointer",
                                borderBottom: index < issuesList.length - 1 ? "1px solid #f0f0f0" : "none",
                                backgroundColor: issue.issueNo === issueNo ? "#e9ecef" : "transparent",
                              }}
                              onClick={() => handleIssueSelect(issue)}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                              onMouseLeave={(e) => {
                                if (issue.issueNo !== issueNo) {
                                  e.currentTarget.style.backgroundColor = "transparent";
                                }
                              }}
                            >
                              <div style={{ fontWeight: "500" }}>{optionLabel}</div>
                              <div style={{ fontSize: "0.8em", color: "#6c757d" }}>{optionSubLabel}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {fromDate && toDate && !isLoading && issuesList.length === 0 && (
                    <small className="text-warning">
                      No issues found for the selected date range
                    </small>
                  )}
                </div>
              </div>

              {selectedIssue && (
                <div className="row mb-4">
                  <div className="col-12">
                    {/* Optional: show selected issue details */}
                  </div>
                </div>
              )}

              <div className="row">
                <div className="col-12 d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleViewDownload}
                    disabled={isGeneratingPDF || !issueNo || !fromDate || !toDate || !selectedIssue?.storeIssueMId}
                  >
                    {isGeneratingPDF ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Generating...
                      </>
                    ) : (
                      <>
                        <i className="fa fa-eye me-2"></i> VIEW/DOWNLOAD
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={() => handlePrint("P")}
                    disabled={isPrinting || !issueNo || !fromDate || !toDate || !selectedIssue?.storeIssueMId}
                  >
                    {isPrinting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Printing...
                      </>
                    ) : (
                      <>
                        <i className="fa fa-print me-2"></i> PRINT
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {pdfUrl && (
        <PdfViewer
          pdfUrl={pdfUrl}
          onClose={() => {
            setPdfUrl(null);
          }}
          name={`Issue Report - ${selectedIssue?.issueNo || 'Report'}`}
        />
      )}

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

export default IssueReferenceReport;