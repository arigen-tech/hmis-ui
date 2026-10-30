import { useState, useEffect, useRef } from "react";
import { getRequest } from "../../../../service/apiService";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../../Components/Pagination";
import Popup from "../../../../Components/popup";
import { INVESTIGATIONS_END_URL, LAB_REPORT_URL_WRT_ORDER_HD, MAX_MONTHS_BACK, REQUEST_PARAM_FLAG, REQUEST_PARAM_FROM_DATE, REQUEST_PARAM_HOSPITAL_ID, REQUEST_PARAM_MOBILE_NO, REQUEST_PARAM_ORDER_HD_ID, REQUEST_PARAM_PAGE, REQUEST_PARAM_PATIENT_NAME, REQUEST_PARAM_SIZE, REQUEST_PARAM_TO_DATE, STATUS_D, STATUS_P } from "../../../../config/apiConfig";
import PdfViewer from "../../../../Components/PdfViewModel/PdfViewer";
import { LAB_REPORT_GENERATION_ERR_MSG, LAB_REPORT_PRINT_ERR_MSG, INVALID_ORDER_ID_ERR_MSG, SELECT_DATE_WARN_MSG, FETCH_LAB_HISTORY_REPORT_ERR_MSG, INVALID_DATE_PICK_WARN_MSG } from '../../../../config/constants';
import { checkInRange, getResultTextStyle } from "../../../../utils/rangeCheckService";
import {formatDateForDisplay} from "../../../../utils/dateUtils";


const isTextInvestigation = (type) => String(type || "").toLowerCase() === "t";

const htmlToPlainText = (html) => {
  if (!html) return "";
  try {
    
    const spaced = String(html)
      .replace(/<\/(p|div|h[1-6]|li|ul|ol|tr|table)>/gi, " </$1>")
      .replace(/<br\s*\/?>/gi, " ");
    const doc = new DOMParser().parseFromString(spaced, "text/html");
    return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
  } catch (e) {
    return String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
};


const sanitizeHtml = (html) => {
  if (!html) return "";
  try {
    const doc = new DOMParser().parseFromString(String(html), "text/html");
    doc.querySelectorAll("script, style, iframe, object, embed, link, meta").forEach((el) => el.remove());
    doc.body.querySelectorAll("*").forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const val = (attr.value || "").trim().toLowerCase();
        if (name.startsWith("on") || val.startsWith("javascript:")) {
          el.removeAttribute(attr.name);
        }
      });
    });
    return doc.body.innerHTML;
  } catch (e) {
    return "";
  }
};


const clampedTextStyle = {
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "380px",
  cursor: "pointer",
  color: "#0d6efd",
  wordBreak: "break-word",
};

const LabReports = () => {
  const [mobileNo, setMobileNo] = useState("")
  const [patientName, setPatientName] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [labData, setLabData] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [isSearching, setIsSearching] = useState(false)  // separate search loading state
  const [showReport, setShowReport] = useState(false)
  const [popupMessage, setPopupMessage] = useState(null);

  // PDF handling
  const [pdfUrl, setPdfUrl] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Full result (HTML) popup
  const [resultPopup, setResultPopup] = useState(null); // { title, html }

  // Hover preview popup for text results: { title, patientName, html, top, left, openUp }
  const [hoverPopup, setHoverPopup] = useState(null);
  const hoverOpenTimer = useRef(null);
  const hoverCloseTimer = useRef(null);

  // Track loading states for individual records
  const [generatingPdfIds, setGeneratingPdfIds] = useState(new Set());
  const [printingIds, setPrintingIds] = useState(new Set());

  const hospitalId = sessionStorage.getItem("hospitalId");

  // Clear hover timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout(hoverOpenTimer.current);
      clearTimeout(hoverCloseTimer.current);
    };
  }, []);

  // Schedule opening the hover popup (small delay avoids accidental popups
  // while the mouse is just passing over the table)
  const handleResultMouseEnter = (e, item) => {
    e.currentTarget.style.textDecoration = "underline";
    clearTimeout(hoverCloseTimer.current);
    clearTimeout(hoverOpenTimer.current);

    const rect = e.currentTarget.getBoundingClientRect();
    hoverOpenTimer.current = setTimeout(() => {
      const popupWidth = 520;
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - popupWidth - 8));
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < 320 && rect.top > spaceBelow;

      setHoverPopup({
        title: item.investigationName || "Result",
        patientName: item.patientName,
        html: sanitizeHtml(item.result),
        left,
        top: rect.bottom + 4,
        bottom: window.innerHeight - rect.top + 4,
        openUp,
      });
    }, 250);
  };

  // Schedule closing the hover popup (delay lets the mouse move onto the popup)
  const handleResultMouseLeave = (e) => {
    e.currentTarget.style.textDecoration = "none";
    clearTimeout(hoverOpenTimer.current);
    clearTimeout(hoverCloseTimer.current);
    hoverCloseTimer.current = setTimeout(() => setHoverPopup(null), 200);
  };

  const keepHoverPopupOpen = () => {
    clearTimeout(hoverCloseTimer.current);
  };

  const closeHoverPopupSoon = () => {
    clearTimeout(hoverCloseTimer.current);
    hoverCloseTimer.current = setTimeout(() => setHoverPopup(null), 200);
  };

  // Close the result popup with the Escape key
  useEffect(() => {
    if (!resultPopup) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setResultPopup(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [resultPopup]);

  // Function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Function to calculate month difference between two dates
  const getMonthDifference = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    let months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months += d2.getMonth() - d1.getMonth();

    return months;
  };

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      },
    });
  };

  // Build gender/age string from separate fields
  const getGenderAge = (gender, age) => {
    return `${gender || ""} / ${age || ""}`.trim();
  };

  // Check if search button should be enabled
  const isSearchButtonEnabled = () => {
    // If any date field is filled, both must be filled
    if (fromDate || toDate) {
      return fromDate && toDate;
    }
    // If no date fields are filled, search button is always enabled
    return true;
  };

  // Fetch lab reports from API with pagination
  const fetchLabReports = async (page = 1) => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append([REQUEST_PARAM_HOSPITAL_ID], hospitalId);
      if (mobileNo) params.append([REQUEST_PARAM_MOBILE_NO], mobileNo);
      if (patientName) params.append([REQUEST_PARAM_PATIENT_NAME], patientName);

      // Only append dates if both are provided
      if (fromDate && toDate) {
        params.append([REQUEST_PARAM_FROM_DATE], fromDate);
        params.append([REQUEST_PARAM_TO_DATE], toDate);
      }

      // Add pagination parameters (using 0-based page number for API)
      params.append([REQUEST_PARAM_PAGE], page - 1);
      params.append([REQUEST_PARAM_SIZE], DEFAULT_ITEMS_PER_PAGE);

      // Make API call
      const response = await getRequest(`${INVESTIGATIONS_END_URL}?${params.toString()}`);

      if (response && response.status === 200 && response.response) {
        const pageData = response.response;
        const content = pageData.content || [];
        const total = pageData.totalElements || 0;

        // Map API response to match frontend structure and calculate inRange
        const mappedData = content.map(item => {
          const isText = isTextInvestigation(item.investigationType);

          // Range check only makes sense for simple (non-text) results
          const inRange = isText ? null : checkInRange(item.result, item.range);

          return {
            id: item.resultEntryDetailsId || item.orderHdId || Math.random().toString(),
            orderHdId: item.orderHdId,
            investigationDate: formatDateForDisplay(item.investigationDate),
            patientName: item.patientName || "",
            mobileNo: item.phnNum || "",
            genderAge: getGenderAge(item.gender, item.age),
            investigationName: item.investigationName || "",
            investigationType: item.investigationType || "",
            isTextResult: isText,
            unit: item.unit || "",
            result: item.result || "",
            range: item.range || "",
            enteredBy: item.resultEnteredBy || "",
            validatedBy: item.resultValidatedBy || "",
            inRange: inRange
          };
        });

        setLabData(mappedData);
        setTotalElements(total);
        setShowReport(true);
      } else {
        // Fallback to empty array if no data
        setLabData([]);
        setTotalElements(0);
        setShowReport(true);
      }
    } catch (error) {
      console.error("Error fetching lab reports:", error);
      showPopup(FETCH_LAB_HISTORY_REPORT_ERR_MSG, "error");
      setLabData([]);
      setTotalElements(0);
      setShowReport(true);
    }
  };

  // Handle search (calls API)
  const handleSearch = async () => {
    // Check if dates are partially filled
    if ((fromDate && !toDate) || (!fromDate && toDate)) {
      showPopup(SELECT_DATE_WARN_MSG, "warning");
      return;
    }

    // If both dates are provided, validate them
    if (fromDate && toDate) {
      // Validate that from date is not after to date
      if (new Date(fromDate) > new Date(toDate)) {
        showPopup(INVALID_DATE_PICK_WARN_MSG, "warning");
        return;
      }

      // Validate that date range doesn't exceed MAX_MONTHS_BACK
      const monthDiff = getMonthDifference(fromDate, toDate);
      if (monthDiff > MAX_MONTHS_BACK) {
        showPopup(`Date range cannot exceed ${MAX_MONTHS_BACK} months.`, "error");
        return;
      }
    }

    setIsSearching(true);
    setCurrentPage(1);

    try {
      await fetchLabReports(1);
    } catch (error) {
      console.error("Error during search:", error);
      showPopup(FETCH_LAB_HISTORY_REPORT_ERR_MSG, "error");
    } finally {
      setIsSearching(false);
    }
  }

  // Handle show all (reset filters)
  const handleShowAll = () => {
    setMobileNo("")
    setPatientName("")
    setFromDate("")
    setToDate("")
    setCurrentPage(1);
    setShowReport(false);
    setLabData([]);
    setTotalElements(0);
  }

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchLabReports(page);
  }

  // Handle from date change
  const handleFromDateChange = (e) => {
    const value = e.target.value;
    setFromDate(value);
  };

  // Handle to date change
  const handleToDateChange = (e) => {
    const selectedDate = e.target.value;
    const today = getTodayDate();

    // If user tries to select a date after today, set it to today
    if (selectedDate > today) {
      setToDate(today);
    } else {
      setToDate(selectedDate);
    }
  };

  // Helper function to check if a record is generating PDF
  const isGeneratingPdf = (recordId) => {
    return generatingPdfIds.has(recordId);
  };

  // Helper function to check if a record is printing
  const isPrinting = (recordId) => {
    return printingIds.has(recordId);
  };

  // Function to get result style based on inRange value using the service
  const getResultStyle = (item) => {
    // Text results are not range-checked; keep default styling
    if (item.isTextResult) return {};
    return getResultTextStyle(item.inRange);
  };

  // Open the full-result popup for a text investigation
  const openResultPopup = (item) => {
    // Click opens the full modal; hide the hover preview first
    clearTimeout(hoverOpenTimer.current);
    clearTimeout(hoverCloseTimer.current);
    setHoverPopup(null);
    setResultPopup({
      title: item.investigationName || "Result",
      patientName: item.patientName,
      html: sanitizeHtml(item.result),
    });
  };

  // Generate lab report for viewing/downloading
  const generateLabReport = async (record) => {
    const orderHdId = record.orderHdId;
    const recordId = record.id;

    if (!orderHdId) {
      showPopup(`${INVALID_ORDER_ID_ERR_MSG} for generating report`, "error");
      return;
    }

    // Add this record to generating set
    setGeneratingPdfIds(prev => new Set(prev).add(recordId));
    setPdfUrl(null);
    setSelectedRecord(record);

    try {
      const url = `${LAB_REPORT_URL_WRT_ORDER_HD}?${REQUEST_PARAM_ORDER_HD_ID}=${orderHdId}&${REQUEST_PARAM_FLAG}=${STATUS_D}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const fileURL = window.URL.createObjectURL(blob);
      setPdfUrl(fileURL);

    } catch (error) {
      console.error("Error generating PDF", error);
      showPopup(LAB_REPORT_GENERATION_ERR_MSG, "error");
    } finally {
      // Remove this record from generating set
      setGeneratingPdfIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(recordId);
        return newSet;
      });
    }
  };

  // Print report function
  const handlePrintReport = async (record) => {
    const orderHdId = record.orderHdId;
    const recordId = record.id;

    if (!orderHdId) {
      showPopup(`${INVALID_ORDER_ID_ERR_MSG} for printing`, "error");
      return;
    }

    // Add this record to printing set
    setPrintingIds(prev => new Set(prev).add(recordId));

    try {
      const url = `${LAB_REPORT_URL_WRT_ORDER_HD}?${REQUEST_PARAM_ORDER_HD_ID}=${orderHdId}&${REQUEST_PARAM_FLAG}=${STATUS_P}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
        },
      });

      if (response.status === 200) {
        // showPopup("Report sent to printer successfully!", "success");
      } else {
        showPopup(LAB_REPORT_PRINT_ERR_MSG, "error");
      }
    } catch (error) {
      console.error("Error printing report", error);
      showPopup(LAB_REPORT_PRINT_ERR_MSG, "error");
    } finally {
      // Remove this record from printing set
      setPrintingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(recordId);
        return newSet;
      });
    }
  };

  // View report handler
  const handleViewReport = (record) => {
    generateLabReport(record);
  }

  // Render the Result cell: plain value for "s", clamped clickable preview for "t"
  const renderResultCell = (item) => {
    if (!item.isTextResult) {
      return item.result;
    }

    const plainText = htmlToPlainText(item.result);
    if (!plainText) return "";

    return (
      <div
        style={clampedTextStyle}
        role="button"
        tabIndex={0}
        onClick={() => openResultPopup(item)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openResultPopup(item);
          }
        }}
        onMouseEnter={(e) => handleResultMouseEnter(e, item)}
        onMouseLeave={handleResultMouseLeave}
      >
        {plainText}
      </div>
    );
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

      {/* PDF Viewer Component */}
      {pdfUrl && selectedRecord && (
        <PdfViewer
          pdfUrl={pdfUrl}
          onClose={() => {
            setPdfUrl(null);
            setSelectedRecord(null);
          }}
          name={`Lab Report - ${selectedRecord?.patientName || 'Patient'}`}
        />
      )}

      {/* Hover preview popup (only for text results) */}
      {hoverPopup && !resultPopup && (
        <div
          onMouseEnter={keepHoverPopupOpen}
          onMouseLeave={closeHoverPopupSoon}
          style={{
            position: "fixed",
            left: hoverPopup.left,
            ...(hoverPopup.openUp
              ? { bottom: hoverPopup.bottom }
              : { top: hoverPopup.top }),
            width: "520px",
            maxWidth: "calc(100vw - 16px)",
            maxHeight: "320px",
            display: "flex",
            flexDirection: "column",
            background: "#fff",
            border: "1px solid #dee2e6",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            zIndex: 1070,
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid #dee2e6",
              fontWeight: 600,
            }}
          >
            {hoverPopup.title}
            {hoverPopup.patientName ? ` - ${hoverPopup.patientName}` : ""}
          </div>
          <div
            style={{ padding: "10px 12px", overflowY: "auto" }}
            dangerouslySetInnerHTML={{ __html: hoverPopup.html }}
          />
        </div>
      )}

      {/* Full result (HTML) popup */}
      {resultPopup && (
        <div
          onClick={() => setResultPopup(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1080,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "8px",
              width: "100%",
              maxWidth: "800px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            }}
          >
            <div
              className="d-flex justify-content-between align-items-center"
              style={{ padding: "12px 16px", borderBottom: "1px solid #dee2e6" }}
            >
              <h5 className="mb-0">
                {resultPopup.title}
                {resultPopup.patientName ? ` - ${resultPopup.patientName}` : ""}
              </h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setResultPopup(null)}
              ></button>
            </div>
            <div
              style={{ padding: "16px", overflowY: "auto" }}
              dangerouslySetInnerHTML={{ __html: resultPopup.html }}
            />
            <div
              className="d-flex justify-content-end"
              style={{ padding: "10px 16px", borderTop: "1px solid #dee2e6" }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setResultPopup(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">LAB REPORTS</h4>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-2">
                  <label className="form-label">Mobile No</label>
                  <input
                    type="text"
                    className="form-control"
                    value={mobileNo}
                    onChange={(e) => {
                      // Only allow numbers and max 10 digits
                      const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                      if (value.length <= 10) {
                        setMobileNo(value);
                      }
                    }}
                    placeholder="Enter mobile number"
                    maxLength="10"
                    pattern="\d{10}"
                    title="Please enter exactly 10 digits"
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Patient Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter patient name"
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    onChange={handleFromDateChange}
                    max={getTodayDate()} // Cannot select future dates
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    onChange={handleToDateChange}
                    max={getTodayDate()} // Cannot select future dates
                  />
                </div>
                <div className="col-md-4 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-primary me-2"
                    onClick={handleSearch}
                    disabled={isSearching || !isSearchButtonEnabled()}
                  >
                    {isSearching ? (
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
                    onClick={handleShowAll}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {!isSearching && showReport && (
                <>

                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle">
                      <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                        <tr>
                          <th>Investigation Date</th>
                          <th>Patient Name</th>
                          <th>Mobile No</th>
                          <th>Gender / Age</th>
                          <th>Investigation Name</th>
                          <th>Unit</th>
                          <th>Result</th>
                          <th>Range</th>
                          <th>Entered By</th>
                          <th>Validated By</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {labData.length > 0 ? (
                          labData.map((item) => (
                            <tr key={item.id}>
                              <td>{item.investigationDate}</td>
                              <td>{item.patientName}</td>
                              <td>{item.mobileNo}</td>
                              <td>{item.genderAge}</td>
                              <td>{item.investigationName}</td>
                              <td>{item.unit}</td>
                              <td style={getResultStyle(item)}>
                                {renderResultCell(item)}
                              </td>
                              <td>{item.range}</td>
                              <td>{item.enteredBy}</td>
                              <td>{item.validatedBy}</td>
                              <td>
                                <div className="d-flex gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-primary"
                                    onClick={() => handleViewReport(item)}
                                    disabled={isGeneratingPdf(item.id) || isPrinting(item.id)}
                                  >
                                    {isGeneratingPdf(item.id) ? (
                                      <>
                                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                        Generating...
                                      </>
                                    ) : (
                                      "View"
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => handlePrintReport(item)}
                                    disabled={isGeneratingPdf(item.id) || isPrinting(item.id)}
                                  >
                                    {isPrinting(item.id) ? (
                                      <>
                                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                        Printing...
                                      </>
                                    ) : (
                                      "Print"
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="11" className="text-center py-4">
                              No Record Found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* PAGINATION USING REUSABLE COMPONENT WITH SERVER-SIDE PAGINATION */}
                  {totalElements > 0 && (
                    <Pagination
                      totalItems={totalElements}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LabReports;