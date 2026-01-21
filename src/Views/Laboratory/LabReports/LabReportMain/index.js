import { useState, useEffect } from "react";
import { getRequest } from "../../../../service/apiService";
import LoadingScreen from "../../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../../Components/Pagination";
import Popup from "../../../../Components/popup";
import { MAX_MONTHS_BACK } from "../../../../config/apiConfig";
import PdfViewer from "../../../../Components/PdfViewModel/PdfViewer";
import { ALL_REPORTS } from "../../../../config/apiConfig";
import { LAB_REPORT_GENERATION_ERR_MSG, LAB_REPORT_PRINT_ERR_MSG, INVALID_ORDER_ID_ERR_MSG, SELECT_DATE_WARN_MSG, FETCH_LAB_HISTORY_REPORT_ERR_MSG, INVALID_DATE_PICK_WARN_MSG } from '../../../../config/constants';

const LabReports = () => {
  const [mobileNo, setMobileNo] = useState("")
  const [patientName, setPatientName] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [labData, setLabData] = useState([])
  const [filteredLabData, setFilteredLabData] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [popupMessage, setPopupMessage] = useState(null);

  // Add these state variables for PDF handling
  const [pdfUrl, setPdfUrl] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Track loading states for individual records
  const [generatingPdfIds, setGeneratingPdfIds] = useState(new Set());
  const [printingIds, setPrintingIds] = useState(new Set());

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

  // Format date from API (YYYY-MM-DD) to DD/MM/YYYY for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
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

  // Fetch lab reports from API
  const fetchLabReports = async () => {
    try {
      setIsGenerating(true);

      // Build query parameters
      const params = new URLSearchParams();
      if (mobileNo) params.append('mobileNo', mobileNo);
      if (patientName) params.append('patientName', patientName);

      // Only append dates if both are provided
      if (fromDate && toDate) {
        params.append('fromDate', fromDate);
        params.append('toDate', toDate);
      }
      // If dates are not provided, don't send them to API
      // The API should handle cases without dates based on its own logic

      // Make API call
      const response = await getRequest(`/report/lab-history/all?${params.toString()}`);

      if (response && response.response) {
        // Map API response to match frontend structure
        const mappedData = response.response.map(item => ({
          id: item.resultEntryDetailsId || item.orderHdId || Math.random().toString(),
          orderHdId: item.orderHdId,
          investigationDate: formatDateForDisplay(item.investigationDate),
          patientName: item.patientName || "",
          mobileNo: item.phnNum || "",
          genderAge: getGenderAge(item.gender, item.age),
          investigationName: item.investigationName || "",
          unit: item.unit || "",
          result: item.result || "",
          range: item.range || "",
          enteredBy: item.resultEnteredBy || "",
          validatedBy: item.resultValidatedBy || "",
          // Add inRange field from API response
          inRange: item.inRange // This should be true/false/null from API
        }));

        setLabData(mappedData);
        setFilteredLabData(mappedData);
        setShowReport(true);
      } else {
        // Fallback to empty array if no data
        setLabData([]);
        setFilteredLabData([]);
        setShowReport(true);
      }
    } catch (error) {
      console.error("Error fetching lab reports:", error);
      showPopup(FETCH_LAB_HISTORY_REPORT_ERR_MSG, "error");
      // Keep existing data or set empty arrays
      if (labData.length === 0) {
        setLabData([]);
        setFilteredLabData([]);
      }
      setShowReport(true);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle search (calls API)
  const handleSearch = () => {
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

    fetchLabReports();
    setCurrentPage(1);
  }

  // Handle show all (reset filters)
  const handleShowAll = () => {
    setMobileNo("")
    setPatientName("")
    setFromDate("")
    setToDate("")
    setCurrentPage(1);
    setShowReport(false);
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

  // Function to get result style based on inRange value
  const getResultStyle = (inRange) => {
    if (inRange === true) {
      return { color: 'green', fontWeight: 'bold' };
    } else if (inRange === false) {
      return { color: 'red', fontWeight: 'bold' };
    }
    // Return empty style for null or undefined
    return {};
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
      const url = `${ALL_REPORTS}/labInvestigationReport?orderhd_id=${orderHdId}&flag=d`;

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
      const url = `${ALL_REPORTS}/labInvestigationReport?orderhd_id=${orderHdId}&flag=p`;

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
    console.log("View report for:", record);
    generateLabReport(record);
  }

  // Remove useEffect that sets default date
  // No default initialization needed

  // Calculate current items for pagination
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredLabData.slice(indexOfFirst, indexOfLast);

  return (
    <div className="content-wrapper">
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}

      {/* Add PDF Viewer Component */}
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
                    disabled={isGenerating || !isSearchButtonEnabled()}
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
                    onClick={handleShowAll}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {isGenerating && (
                <div className="text-center py-4">
                  <LoadingScreen />
                </div>
              )}

              {!isGenerating && showReport && (
                <>
                  <div className="mb-3">
                    <span className="fw-bold">{filteredLabData.length} matches</span>
                  </div>

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
                        {filteredLabData.length > 0 ? (
                          currentItems.map((item) => (
                            <tr key={item.id}>
                              <td>{item.investigationDate}</td>
                              <td>{item.patientName}</td>
                              <td>{item.mobileNo}</td>
                              <td>{item.genderAge}</td>
                              <td>{item.investigationName}</td>
                              <td>{item.unit}</td>
                              <td style={getResultStyle(item.inRange)}>
                                {item.result}
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

                  {/* PAGINATION USING REUSABLE COMPONENT */}
                  {filteredLabData.length > 0 && (
                    <Pagination
                      totalItems={filteredLabData.length}
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
  )
}

export default LabReports;