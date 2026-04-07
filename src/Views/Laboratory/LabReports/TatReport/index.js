import { useState, useEffect } from "react";
import { getRequest } from "../../../../service/apiService";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../../Components/Pagination";
import Popup from "../../../../Components/popup";
import { MAX_MONTHS_BACK, ALL_REPORTS, LAB, MAS_INVESTIGATION_DROPDOWN, MAS_SUB_CHARGE_CODE_DROPDOWN_END_URL, TAT_DETAIL_END_URL, TAT_SUMMARY_END_URL, REQUEST_PARAM_HOSPITAL_ID, REQUEST_PARAM_INVESTIGATION_ID, REQUEST_PARAM_SUB_CHARGE_CODE_ID, REQUEST_PARAM_FROM_DATE, REQUEST_PARAM_TO_DATE, REQUEST_PARAM_PAGE, REQUEST_PARAM_SIZE, STATUS_D, STATUS_P, REQUEST_PARAM_FLAG, TAT_DETAIL_REPORT_URL, TAT_SUMMARY_REPORT_URL } from "../../../../config/apiConfig";
import PdfViewer from "../../../../Components/PdfViewModel/PdfViewer";
import {formatDateTimeForDisplay} from "../../../../utils/dateUtils";
import {
  FETCH_LAB_TAT_DETAILED_REPORT_ERR_MSG, 
  FETCH_LAB_TAT_SUMMARY_REPORT_ERR_MSG, 
  INVALID_DATE_PICK_WARN_MSG, 
  SELECT_DATE_WARN_MSG,
  LAB_REPORT_GENERATION_ERR_MSG,
  LAB_REPORT_PRINT_ERR_MSG,
  HOSPITAL_ID_NOT_FOUND
} from "../../../../config/constants"

const TATReport = () => {
  
  // State variables
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [investigation, setInvestigation] = useState("");
  const [selectedInvestigation, setSelectedInvestigation] = useState(null);
  const [isInvestigationDropdownVisible, setInvestigationDropdownVisible] = useState(false);
  const [modality, setModality] = useState("");
  const [selectedModality, setSelectedModality] = useState(null);
  const [modalityOptions, setModalityOptions] = useState([]);
  const [reportType, setReportType] = useState("detailed");
  const [isSearching, setIsSearching] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [popupMessage, setPopupMessage] = useState(null);
  
  // API Data states with pagination
  const [investigationOptions, setInvestigationOptions] = useState([]);
  const [detailedReportData, setDetailedReportData] = useState([]);
  const [summaryReportData, setSummaryReportData] = useState([]);
  const [detailedTotalElements, setDetailedTotalElements] = useState(0);
  const [summaryTotalElements, setSummaryTotalElements] = useState(0);
  
  // Add PDF viewer state - SEPARATE LOADING STATES
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isViewLoading, setIsViewLoading] = useState(false); // For VIEW/DOWNLOAD button
  const [isPrintLoading, setIsPrintLoading] = useState(false); // For PRINT button
  
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

  // Get hospitalId from sessionStorage
  const getHospitalId = () => {
    try {
      return sessionStorage.getItem('hospitalId');
    } catch (error) {
      console.error("Error getting hospitalId from sessionStorage:", error);
      return null;
    }
  };

  // Popup function
  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      },
    });
  };

  // Format date for display
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

  // Fetch investigation options
  const fetchInvestigations = async () => {
    try {
      const response = await getRequest(`${MAS_INVESTIGATION_DROPDOWN}`);
      if (response && response.response) {
        setInvestigationOptions(response.response.map(item => ({
          id: item.investigationId,
          name: item.investigationName
        })));
      }
    } catch (error) {
      console.error("Error fetching investigations:", error);
    }
  };

  // Fetch modality options (sub charge codes)
  const fetchModalities = async () => {
    try {
      const response = await getRequest(`${MAS_SUB_CHARGE_CODE_DROPDOWN_END_URL}`); // flag=1 for active only
      if (response && response.response) {
        const filterModality= response.response.filter(item => item.mainChargeId === 12);
        setModalityOptions(filterModality.map(item => ({
          id: item.subId,
          name: item.subName,
          code: item.subCode
        })));
      }
    } catch (error) {
      console.error("Error fetching modalities:", error);
    }
  };

  // Fetch detailed TAT report with pagination
  const fetchDetailedReport = async (page = 1, isSearchAction = false) => {
    try {
      if (isSearchAction) {
        setIsSearching(true);
      }
      
      const params = new URLSearchParams();
      params.append([REQUEST_PARAM_HOSPITAL_ID], getHospitalId());
      if (selectedInvestigation?.id) {
        params.append([REQUEST_PARAM_INVESTIGATION_ID], selectedInvestigation.id);
      }
      if (selectedModality?.id) {
        params.append([REQUEST_PARAM_SUB_CHARGE_CODE_ID], selectedModality.id);
      }
      params.append([REQUEST_PARAM_FROM_DATE], fromDate);
      params.append([REQUEST_PARAM_TO_DATE], toDate);
      params.append([REQUEST_PARAM_PAGE], page - 1);
      params.append([REQUEST_PARAM_SIZE], DEFAULT_ITEMS_PER_PAGE);

      const response = await getRequest(`${TAT_DETAIL_END_URL}?${params.toString()}`);
      
      if (response && response.status === 200 && response.response) {
        const pageData = response.response;
        const content = pageData.content || [];
        const total = pageData.totalElements || 0;
        
        const mappedData = content.map(item => ({
          investigationName: item.investigationName || "",
          sampleId: item.generatedSampleId || "",
          sampleReceivedDateTime: formatDateTimeForDisplay(item.sampleReceivedDate),
          reportAuthorizedDateTime: formatDateTimeForDisplay(item.reportAuthorizedDate),
          expectedTAT: item.expectedTatHours || 0,
          actualTAT: item.actualTatHours || 0,
          delay: item.delay || 0,
          iauStatus: item.tatStatus || "",
          technicianName: item.technicianName || ""
        }));
        
        setDetailedReportData(mappedData);
        setDetailedTotalElements(total);
        setShowReport(true);
      } else {
        setDetailedReportData([]);
        setDetailedTotalElements(0);
        setShowReport(true);
      }
    } catch (error) {
      console.error("Error fetching detailed report:", error);
      showPopup(FETCH_LAB_TAT_DETAILED_REPORT_ERR_MSG, "error");
      setDetailedReportData([]);
      setDetailedTotalElements(0);
      setShowReport(true);
    } finally {
      if (isSearchAction) {
        setIsSearching(false);
      }
    }
  };

  // Fetch summary TAT report with pagination
  const fetchSummaryReport = async (page = 1, isSearchAction = false) => {
    try {
      if (isSearchAction) {
        setIsSearching(true);
      }
      
      const params = new URLSearchParams();
      params.append('hospitalId', getHospitalId());
      if (selectedInvestigation?.id) {
        params.append('investigationId', selectedInvestigation.id);
      }
      if (selectedModality?.id) {
        params.append('subChargeCodeId', selectedModality.id);
      }
      params.append('fromDate', fromDate);
      params.append('toDate', toDate);
      params.append('page', page - 1);
      params.append('size', DEFAULT_ITEMS_PER_PAGE);

      const response = await getRequest(`${TAT_SUMMARY_END_URL}?${params.toString()}`);
      
      if (response && response.status === 200 && response.response) {
        const pageData = response.response;
        const content = pageData.content || [];
        const total = pageData.totalElements || 0;
        
        const mappedData = content.map(item => ({
          investigationName: item.investigationName || "",
          expectedTAT: item.expectedTatHours || 0,
          totalTests: item.totalTests || 0,
          averageTAT: item.averageTatHours || 0,
          minimumTAT: item.minTatHours || 0,
          maximumTAT: item.maxTatHours || 0,
          testsWithinTAT: item.noOfTestsWithinTatHour || 0,
          testsBreached: item.noOfTestsBreached || 0,
          compliancePercent: item.compliance ? `${item.compliance}%` : "0%"
        }));
        
        setSummaryReportData(mappedData);
        setSummaryTotalElements(total);
        setShowReport(true);
      } else {
        setSummaryReportData([]);
        setSummaryTotalElements(0);
        setShowReport(true);
      }
    } catch (error) {
      console.error("Error fetching summary report:", error);
      showPopup(FETCH_LAB_TAT_SUMMARY_REPORT_ERR_MSG, "error");
      setSummaryReportData([]);
      setSummaryTotalElements(0);
      setShowReport(true);
    } finally {
      if (isSearchAction) {
        setIsSearching(false);
      }
    }
  };

  // Handle from date change
  const handleFromDateChange = (e) => {
    setFromDate(e.target.value);
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

  // Handle investigation change
  const handleInvestigationChange = (e) => {
    setInvestigation(e.target.value);
    setInvestigationDropdownVisible(true);
  }

  // Handle investigation selection
  const handleInvestigationSelect = (inv) => {
    setInvestigation(inv.name);
    setSelectedInvestigation(inv);
    setInvestigationDropdownVisible(false);
  }

  // Handle modality change
  const handleModalityChange = (e) => {
    const selectedModalityId = e.target.value;
    const modality = modalityOptions.find(m => m.id == selectedModalityId);
    setModality(selectedModalityId);
    setSelectedModality(modality);
  }

  // Handle reset button
  const handleReset = () => {
    setFromDate("");
    setToDate(getTodayDate());
    setInvestigation("");
    setSelectedInvestigation(null);
    setModality("");
    setSelectedModality(null);
    setCurrentPage(1);
    setShowReport(false);
    setDetailedReportData([]);
    setSummaryReportData([]);
    setDetailedTotalElements(0);
    setSummaryTotalElements(0);
  }

  // Validate date inputs
  const validateDates = () => {
    if (!fromDate || !toDate) {
      showPopup(SELECT_DATE_WARN_MSG, "warning");
      return false;
    }

    // Validate that from date is not after to date
    if (new Date(fromDate) > new Date(toDate)) {
      showPopup(INVALID_DATE_PICK_WARN_MSG, "warning");
      return false;
    }

    // Validate that date range doesn't exceed MAX_MONTHS_BACK
    const monthDiff = getMonthDifference(fromDate, toDate);
    if (monthDiff > MAX_MONTHS_BACK) {
      showPopup(`Date range cannot exceed ${MAX_MONTHS_BACK} months.`, "error");
      return false;
    }

    return true;
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (reportType === "detailed") {
      fetchDetailedReport(page, false);
    } else {
      fetchSummaryReport(page, false);
    }
  };

  // Handle search (grid data)
  const handleSearch = () => {
    if (!validateDates()) return;

    setCurrentPage(1);
    if (reportType === "detailed") {
      fetchDetailedReport(1, true);
    } else {
      fetchSummaryReport(1, true);
    }
  };

  // Generate PDF report for viewing/downloading
  const generatePdfReport = async (flag = STATUS_D) => {
    if (!validateDates()) return;

    const hospitalId = getHospitalId();
    if (!hospitalId) {
      showPopup(HOSPITAL_ID_NOT_FOUND, "error");
      return;
    }

    // Set loading state based on flag
    if (flag === STATUS_D) {
      setIsViewLoading(true);
    } else if (flag === STATUS_P) {
      setIsPrintLoading(true);
    }
    
    setPdfUrl(null);

    try {
      const params = new URLSearchParams();
      params.append(REQUEST_PARAM_FROM_DATE, fromDate);
      params.append(REQUEST_PARAM_TO_DATE, toDate);
      params.append(REQUEST_PARAM_HOSPITAL_ID, hospitalId);
      params.append(REQUEST_PARAM_FLAG, flag);

      if (selectedInvestigation?.id) {
        params.append(REQUEST_PARAM_INVESTIGATION_ID, selectedInvestigation.id);
      }
      if (selectedModality?.id) {
        params.append(REQUEST_PARAM_SUB_CHARGE_CODE_ID, selectedModality.id);
      }

      // Determine the endpoint based on report type
      const endpoint = reportType === "detailed" 
        ? `${TAT_DETAIL_REPORT_URL}`
        : `${TAT_SUMMARY_REPORT_URL}`;

      const url = `${endpoint}?${params.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.statusText}`);
      }

      if (flag === STATUS_D) {
        // For viewing/downloading
        const blob = await response.blob();
        const fileURL = window.URL.createObjectURL(blob);
        setPdfUrl(fileURL);
      } else if (flag === STATUS_P) {
        // For printing
        // showPopup("Report sent to printer successfully!", "success");
      }

    } catch (error) {
      console.error("Error generating PDF", error);
      const errorMsg = flag === STATUS_D ? LAB_REPORT_GENERATION_ERR_MSG : LAB_REPORT_PRINT_ERR_MSG;
      showPopup(errorMsg, "error");
    } finally {
      // Reset the specific loading state
      if (flag === STATUS_D) {
        setIsViewLoading(false);
      } else if (flag === STATUS_P) {
        setIsPrintLoading(false);
      }
    }
  };

  // Handle view report (opens PDF viewer)
  const handleViewReport = () => {
    generatePdfReport(STATUS_D);
  };

  // Handle print report
  const handlePrintReport = () => {
    generatePdfReport(STATUS_P);
  };

  // Initialize with today's date as default for To Date
  useEffect(() => {
    const today = getTodayDate();
    setToDate(today);
    
    // Fetch dropdown options
    fetchInvestigations();
    fetchModalities();
  }, []);

  // Reset page when report type changes
  useEffect(() => {
    setCurrentPage(1);
    setShowReport(false);
    setDetailedReportData([]);
    setSummaryReportData([]);
    setDetailedTotalElements(0);
    setSummaryTotalElements(0);
  }, [reportType]);

  // Get current data and total elements based on report type
  const currentData = reportType === "detailed" ? detailedReportData : summaryReportData;
  const totalElements = reportType === "detailed" ? detailedTotalElements : summaryTotalElements;

  return (
    <div className="content-wrapper">
      {/* Add Popup Component */}
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}

      {/* Add PDF Viewer Component */}
      {pdfUrl && (
        <PdfViewer
          pdfUrl={pdfUrl}
          onClose={() => {
            setPdfUrl(null);
          }}
          name={`${reportType === "detailed" ? "Detailed" : "Summary"} TAT Report - ${formatDateForDisplay(fromDate)} to ${formatDateForDisplay(toDate)}`}
        />
      )}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">
                TAT Report
              </h4>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-3">
                  <label className="form-label fw-bold">From Date <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    onChange={handleFromDateChange}
                    max={getTodayDate()} // Cannot select future dates
                    required
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold">To Date <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    onChange={handleToDateChange}
                    max={getTodayDate()} // Cannot select future dates
                    required
                  />
                </div>

                <div className="form-group col-md-3 position-relative">
                  <label className="form-label fw-bold">Investigation Name</label>
                  <input
                    type="text"
                    className="form-control mt-1"
                    id="investigationName"
                    placeholder="Investigation Name"
                    value={investigation}
                    onChange={handleInvestigationChange}
                    onFocus={() => setInvestigationDropdownVisible(true)}
                    onBlur={() => setTimeout(() => setInvestigationDropdownVisible(false), 200)}
                    autoComplete="off"
                  />
                  {isInvestigationDropdownVisible && investigation && (
                    <ul className="list-group position-absolute w-100 mt-1" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                      {investigationOptions
                        .filter((inv) => inv.name.toLowerCase().includes(investigation.toLowerCase()))
                        .map((inv) => (
                          <li
                            key={inv.id}
                            className="list-group-item list-group-item-action"
                            onClick={() => handleInvestigationSelect(inv)}
                          >
                            {inv.name}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>

                <div className="col-md-3 mt-1">
                  <label className="form-label fw-bold">Modality</label>
                  <select 
                    className="form-select" 
                    value={modality} 
                    onChange={handleModalityChange}
                  >
                    <option value="">Select Modality</option>
                    {modalityOptions.map((mod) => (
                      <option key={mod.id} value={mod.id}>
                        {mod.name} ({mod.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-md-12">
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="reportType"
                      id="detailed"
                      value="detailed"
                      checked={reportType === "detailed"}
                      onChange={(e) => setReportType(e.target.value)}
                    />
                    <label className="form-check-label fw-bold" htmlFor="detailed">
                      Detailed TAT Report
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="reportType"
                      id="summary"
                      value="summary"
                      checked={reportType === "summary"}
                      onChange={(e) => setReportType(e.target.value)}
                    />
                    <label className="form-check-label fw-bold" htmlFor="summary">
                      TAT Summary Report
                    </label>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-12 d-flex justify-content-between">
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSearch}
                      disabled={isSearching}
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
                      onClick={handleReset}
                      disabled={isSearching}
                    >
                      <i className="mdi mdi-refresh me-1"></i> Reset
                    </button>
                  </div>
                  
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      onClick={handleViewReport}
                      disabled={isSearching || isViewLoading || !fromDate || !toDate}
                    >
                      {isViewLoading ? (
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
                      className="btn btn-warning btn-sm"
                      onClick={handlePrintReport}
                      disabled={isSearching || isPrintLoading || !fromDate || !toDate}
                    >
                      {isPrintLoading ? (
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

             

              {!isSearching && showReport && (
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="card-title mb-0">
                          {reportType === "detailed" ? "Detailed TAT Report" : "TAT Summary Report"}
                        </h5>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          {reportType === "detailed" ? (
                            <table className="table table-bordered table-hover">
                              <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                                <tr>
                                  <th>Investigation Name</th>
                                  <th>Sample ID</th>
                                  <th>Sample Received Date & Time</th>
                                  <th>Report Authorized Date & Time</th>
                                  <th>Expected TAT (hrs)</th>
                                  <th>Actual TAT (hrs)</th>
                                  <th>Delay (hrs)</th>
                                  <th>IAU Status (Within / Breach)</th>
                                  <th>Technician Name</th>
                                </tr>
                              </thead>
                              <tbody>
                                {currentData.length > 0 ? (
                                  currentData.map((row, index) => (
                                    <tr key={index}>
                                      <td>{row.investigationName}</td>
                                      <td>{row.sampleId}</td>
                                      <td>{row.sampleReceivedDateTime}</td>
                                      <td>{row.reportAuthorizedDateTime}</td>
                                      <td>{row.expectedTAT}</td>
                                      <td>{row.actualTAT}</td>
                                      <td>{row.delay}</td>
                                      <td>{row.iauStatus}</td>
                                      <td>{row.technicianName}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="9" className="text-center py-4">
                                      No Record Found
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          ) : (
                            <table className="table table-bordered table-hover">
                              <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                                <tr>
                                  <th>Investigation Name</th>
                                  <th>Expected TAT (hrs)</th>
                                  <th>Total Tests</th>
                                  <th>Average TAT (hrs)</th>
                                  <th>Minimum TAT (hrs)</th>
                                  <th>Maximum TAT (hrs)</th>
                                  <th>Tests Within TAT</th>
                                  <th>Tests Breached</th>
                                  <th>Compliance %</th>
                                </tr>
                              </thead>
                              <tbody>
                                {currentData.length > 0 ? (
                                  currentData.map((row, index) => (
                                    <tr key={index}>
                                      <td>{row.investigationName}</td>
                                      <td>{row.expectedTAT}</td>
                                      <td>{row.totalTests}</td>
                                      <td>{row.averageTAT}</td>
                                      <td>{row.minimumTAT}</td>
                                      <td>{row.maximumTAT}</td>
                                      <td>{row.testsWithinTAT}</td>
                                      <td>{row.testsBreached}</td>
                                      <td>{row.compliancePercent}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="9" className="text-center py-4">
                                      No Record Found
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          )}
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
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TATReport;