import { useState, useEffect } from "react";
import { getRequest } from "../../../../service/apiService";
import LoadingScreen from "../../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../../Components/Pagination";
import Popup from "../../../../Components/popup";
import PdfViewer from "../../../../Components/PdfViewModel/PdfViewer";
import { MAS_INVESTIGATION, MAX_MONTHS_BACK, ALL_REPORTS, LAB } from "../../../../config/apiConfig";
import { 
  FETCH_AMEND_REPORT_ERR_MSG, 
  INVALID_DATE_PICK_WARN_MSG, 
  SELECT_DATE_WARN_MSG,
  LAB_REPORT_GENERATION_ERR_MSG,
  LAB_REPORT_PRINT_ERR_MSG
} from "../../../../config/constants";

const ResultAmendmentReport = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [patientMobile, setPatientMobile] = useState("");
  const [patientName, setPatientName] = useState("");
  const [investigation, setInvestigation] = useState("");
  const [selectedInvestigation, setSelectedInvestigation] = useState(null);
  const [isInvestigationDropdownVisible, setInvestigationDropdownVisible] = useState(false);
  const [modality, setModality] = useState("");
  const [selectedModality, setSelectedModality] = useState(null);
  const [modalityOptions, setModalityOptions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [popupMessage, setPopupMessage] = useState(null);
  
  // API Data states
  const [investigationOptions, setInvestigationOptions] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  
  // Add PDF viewer state - SEPARATE LOADING STATES
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isViewLoading, setIsViewLoading] = useState(false); // For VIEW/DOWNLOAD button
  const [isPrintLoading, setIsPrintLoading] = useState(false); // For PRINT button
  
  // Function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => new Date().toISOString().split('T')[0];

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

  // Check if search buttons should be enabled
  const isSearchButtonEnabled = () => {
    // Check if any of the basic search fields are filled
    const hasBasicSearchField = patientMobile || patientName;
    
    // If any date field is filled, both must be filled
    if (fromDate || toDate) {
      return fromDate && toDate;
    }
    
    // If no dates are filled, need at least one basic search field (mobile or name)
    // Investigation-only or Modality-only should NOT enable buttons
    return hasBasicSearchField;
  };

  // Popup function
  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => setPopupMessage(null),
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

  // Format date time for display
  const formatDateTimeForDisplay = (dateTimeString) => {
    if (!dateTimeString) return "";
    try {
      const date = new Date(dateTimeString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      console.error("Error formatting date time:", error);
      return "";
    }
  };

  // Format result with unit
  const formatResultWithUnit = (result, unit) => {
    if (!result && !unit) return "";
    if (!result) return "";
    if (!unit) return result;
    return `${result} ${unit}`;
  };

  // Fetch investigation options
  const fetchInvestigations = async () => {
    try {
      const response = await getRequest(`${MAS_INVESTIGATION}/mas-investigation/all`);
      if (response?.response) {
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
      const response = await getRequest("/master/sub-charge-code/getAll/1"); // flag=1 for active only
      if (response?.response) {
        const filteredSubCharges = response.response.filter(item => item.mainChargeId === 12);
        setModalityOptions(filteredSubCharges.map(item => ({
          id: item.subId,
          name: item.subName,
          code: item.subCode
        })));
      }
    } catch (error) {
      console.error("Error fetching modalities:", error);
    }
  };

  // Fetch amendment audit report with pagination
  const fetchAmendAuditReport = async (page = 1, isSearchAction = false) => {
    try {
      if (isSearchAction) {
        setIsSearching(true);
      }
      
      const hospitalId = getHospitalId();
      if (!hospitalId) {
        showPopup("Hospital ID not found. Please login again.", "error");
        return;
      }
      
      const params = new URLSearchParams();
      params.append('hospitalId', hospitalId);
      if (patientMobile) params.append('phnNum', patientMobile);
      if (patientName) params.append('patientName', patientName);
      if (selectedInvestigation?.id) params.append('investigationId', selectedInvestigation.id);
      if (selectedModality?.id) params.append('subChargeCodeId', selectedModality.id);
      if (fromDate && toDate) {
        params.append('fromDate', fromDate);
        params.append('toDate', toDate);
      }
      params.append('page', page - 1);
      params.append('size', DEFAULT_ITEMS_PER_PAGE);

      const response = await getRequest(`${LAB}/amendAudit/result?${params.toString()}`);
      
      if (response?.response) {
        const pageData = response.response;
        const content = pageData.content || [];
        const total = pageData.totalElements || 0;
        
        const mappedData = content.map(item => ({
          amendId: item.amendId || "",
          sampleId: item.sampleId || "",
          patientName: item.patientName || "",
          investigationName: item.investigationName || "",
          unitName: item.unitName || "",
          oldResult: formatResultWithUnit(item.oldResult, item.unitName),
          newResult: formatResultWithUnit(item.newResult, item.unitName),
          reasonForChange: item.reasonForChange || "",
          authorizedBy: item.authorizedBy || "",
          dateTime: formatDateTimeForDisplay(item.dateTime)
        }));
        
        setReportData(mappedData);
        setTotalElements(total);
        setShowReport(true);
      } else {
        setReportData([]);
        setTotalElements(0);
        setShowReport(true);
      }
    } catch (error) {
      console.error("Error fetching amendment audit report:", error);
      showPopup(FETCH_AMEND_REPORT_ERR_MSG, "error");
      setReportData([]);
      setTotalElements(0);
      setShowReport(true);
    } finally {
      if (isSearchAction) {
        setIsSearching(false);
      }
    }
  };

  // Validate date inputs
  const validateDates = () => {
    // If both dates are provided, validate them
    if (fromDate && toDate) {
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
    }

    return true;
  };

  // Handle from date change
  const handleFromDateChange = (e) => setFromDate(e.target.value);

  // Handle to date change
  const handleToDateChange = (e) => {
    const selectedDate = e.target.value;
    const today = getTodayDate();
    setToDate(selectedDate > today ? today : selectedDate);
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
    setToDate("");
    setPatientMobile("");
    setPatientName("");
    setInvestigation("");
    setSelectedInvestigation(null);
    setModality("");
    setSelectedModality(null);
    setCurrentPage(1);
    setShowReport(false);
    setReportData([]);
    setTotalElements(0);
  }

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchAmendAuditReport(page, false);
  };

  // Handle search (grid data)
  const handleSearch = () => {
    // Check if dates are partially filled
    if ((fromDate && !toDate) || (!fromDate && toDate)) {
      showPopup(SELECT_DATE_WARN_MSG, "warning");
      return;
    }

    if (!validateDates()) return;

    setCurrentPage(1);
    fetchAmendAuditReport(1, true);
  };

  // Generate PDF report for viewing/downloading
  const generatePdfReport = async (flag = "D") => {
    // Check if dates are partially filled
    if ((fromDate && !toDate) || (!fromDate && toDate)) {
      showPopup(SELECT_DATE_WARN_MSG, "warning");
      return;
    }

    if (!validateDates()) return;

    const hospitalId = getHospitalId();
    if (!hospitalId) {
      showPopup("Hospital ID not found. Please login again.", "error");
      return;
    }

    // Set loading state based on flag
    if (flag === "D") {
      setIsViewLoading(true);
    } else if (flag === "P") {
      setIsPrintLoading(true);
    }
    
    setPdfUrl(null);

    try {
      const params = new URLSearchParams();
      params.append('hospitalId', hospitalId);
      
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);
      if (patientMobile) params.append('mobileNumber', patientMobile);
      if (patientName) params.append('patientName', patientName);
      if (selectedInvestigation?.id) params.append('investigationId', selectedInvestigation.id);
      if (selectedModality?.id) params.append('subChargeCodeId', selectedModality.id);
      params.append('flag', flag);

      const url = `${ALL_REPORTS}/resultAmendment?${params.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.statusText}`);
      }

      if (flag === "D") {
        // For viewing/downloading
        const blob = await response.blob();
        const fileURL = window.URL.createObjectURL(blob);
        setPdfUrl(fileURL);
      } 

    } catch (error) {
      console.error("Error generating PDF", error);
      const errorMsg = flag === "D" ? LAB_REPORT_GENERATION_ERR_MSG : LAB_REPORT_PRINT_ERR_MSG;
      showPopup(errorMsg, "error");
    } finally {
      // Reset the specific loading state
      if (flag === "D") {
        setIsViewLoading(false);
      } else if (flag === "P") {
        setIsPrintLoading(false);
      }
    }
  };

  // Handle view report (opens PDF viewer)
  const handleViewReport = () => {
    generatePdfReport("D");
  };

  // Handle print report
  const handlePrintReport = () => {
    generatePdfReport("P");
  };

  // Initialize
  useEffect(() => {
    fetchInvestigations();
    fetchModalities();
  }, []);

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
          name={`Result Amendment Report - ${formatDateForDisplay(fromDate)} to ${formatDateForDisplay(toDate)}`}
        />
      )}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Result Amendment/Update Report</h4>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-3">
                  <label className="form-label fw-bold">From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    onChange={handleFromDateChange}
                    max={getTodayDate()}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold">To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    onChange={handleToDateChange}
                    max={getTodayDate()}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold">Patient Mobile No</label>
                  <input
                    type="text"
                    className="form-control"
                    value={patientMobile}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 10) setPatientMobile(value);
                    }}
                    placeholder="Enter mobile number"
                    maxLength="10"
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold">Patient Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter patient name"
                  />
                </div>

                <div className="form-group col-md-3 position-relative mt-3">
                  <label className="form-label fw-bold">Investigation Name</label>
                  <input
                    type="text"
                    className="form-control mt-1"
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

                <div className="col-md-3 mt-3">
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

              <div className="row">
                <div className="col-12 d-flex justify-content-between">
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-primary"
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
                      disabled={isSearching || isViewLoading || !isSearchButtonEnabled()}
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
                      disabled={isSearching || isPrintLoading || !isSearchButtonEnabled()}
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
                        <h5 className="card-title mb-0">Result Amendment/Update Report</h5>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-bordered table-hover">
                            <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                              <tr>
                                <th>Sample ID</th>
                                <th>Patient Name</th>
                                <th>Investigation Name</th>
                                <th>Old Result</th>
                                <th>New Result</th>
                                <th>Reason for Change</th>
                                <th>Authorized By</th>
                                <th>Date & Time</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.length > 0 ? (
                                reportData.map((row, index) => (
                                  <tr key={index}>
                                    <td>{row.sampleId}</td>
                                    <td>{row.patientName}</td>
                                    <td>{row.investigationName}</td>
                                    <td>{row.oldResult}</td>
                                    <td>{row.newResult}</td>
                                    <td>{row.reasonForChange}</td>
                                    <td>{row.authorizedBy}</td>
                                    <td>{row.dateTime}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="8" className="text-center py-4">
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

export default ResultAmendmentReport;