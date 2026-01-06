import { useState, useEffect } from "react";
import { getRequest } from "../../../../service/apiService";
import LoadingScreen from "../../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../../Components/Pagination";
import Popup from "../../../../Components/popup";
import { MAS_INVESTIGATION, MAX_MONTHS_BACK } from "../../../../config/apiConfig";

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [popupMessage, setPopupMessage] = useState(null);
  
  // API Data states
  const [investigationOptions, setInvestigationOptions] = useState([]);
  const [detailedReportData, setDetailedReportData] = useState([]);
  const [summaryReportData, setSummaryReportData] = useState([]);
  
  // Calculate 4 months ago date
  const getFourMonthsAgoDate = () => {
    const today = new Date();
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(today.getMonth() - MAX_MONTHS_BACK);
    return fourMonthsAgo.toISOString().split('T')[0];
  };

  // Get min and max for from date
  const getFromDateMinMax = () => {
    const today = new Date();
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(today.getMonth() - MAX_MONTHS_BACK);
    
    return {
      min: fourMonthsAgo.toISOString().split('T')[0],
      max: today.toISOString().split('T')[0]
    };
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

  // Fetch investigation options
  const fetchInvestigations = async () => {
    try {
      const response = await getRequest(`${MAS_INVESTIGATION}/mas-investigation/all`);
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
      const response = await getRequest("/master/sub-charge-code/getAll/1"); // flag=1 for active only
      if (response && response.response) {
        setModalityOptions(response.response.map(item => ({
          id: item.subId,
          name: item.subName,
          code: item.subCode
        })));
      }
    } catch (error) {
      console.error("Error fetching modalities:", error);
    }
  };

  // Fetch detailed TAT report
  const fetchDetailedReport = async () => {
    try {
      setIsGenerating(true);
      
      const params = new URLSearchParams();
      if (selectedInvestigation?.id) {
        params.append('investigationId', selectedInvestigation.id);
      }
      if (selectedModality?.id) {
        params.append('subchargeCodeId', selectedModality.id);
      }
      params.append('fromDate', fromDate);
      params.append('toDate', toDate);

      const response = await getRequest(`/report/lab-tat/details?${params.toString()}`);
      
      if (response && response.response) {
        const mappedData = response.response.map(item => ({
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
        setShowReport(true);
      } else {
        setDetailedReportData([]);
      }
    } catch (error) {
      console.error("Error fetching detailed report:", error);
      showPopup("Error fetching detailed report. Please try again.", "error");
      setDetailedReportData([]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Fetch summary TAT report
  const fetchSummaryReport = async () => {
    try {
      setIsGenerating(true);
      
      const params = new URLSearchParams();
      if (selectedInvestigation?.id) {
        params.append('investigationId', selectedInvestigation.id);
      }
      if (selectedModality?.id) {
        params.append('subchargeCodeId', selectedModality.id);
      }
      params.append('fromDate', fromDate);
      params.append('toDate', toDate);

      const response = await getRequest(`/report/lab-tat/summary?${params.toString()}`);
      
      if (response && response.response) {
        const mappedData = response.response.map(item => ({
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
        setShowReport(true);
      } else {
        setSummaryReportData([]);
      }
    } catch (error) {
      console.error("Error fetching summary report:", error);
      showPopup("Error fetching summary report. Please try again.", "error");
      setSummaryReportData([]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle from date change with validation
  const handleFromDateChange = (e) => {
    const selectedDate = e.target.value;
    const today = new Date().toISOString().split('T')[0];
    const fourMonthsAgo = getFourMonthsAgoDate();

    if (selectedDate > today) {
      showPopup("From date cannot be in the future", "error");
      setFromDate(today);
      return;
    }

    if (selectedDate < fourMonthsAgo) {
      showPopup(`From date cannot be more than ${MAX_MONTHS_BACK} months back`, "error");
      setFromDate(fourMonthsAgo);
      return;
    }

    setFromDate(selectedDate);
  };

  // Handle to date change with validation
  const handleToDateChange = (e) => {
    const selectedDate = e.target.value;
    const today = new Date().toISOString().split('T')[0];

    if (selectedDate > today) {
      showPopup("To date cannot be in the future", "error");
      setToDate(today);
      return;
    }

    if (fromDate && selectedDate < fromDate) {
      showPopup("To date cannot be earlier than From date", "error");
      setToDate(fromDate);
      return;
    }

    setToDate(selectedDate);
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

  // Handle view report
  const handleViewReport = () => {
    if (!fromDate || !toDate) {
      showPopup("Please select both From Date and To Date", "error");
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      showPopup("From Date cannot be later than To Date", "error");
      return;
    }

    if (reportType === "detailed") {
      fetchDetailedReport();
    } else {
      fetchSummaryReport();
    }
    setCurrentPage(1);
  };

  // Handle print report
  const handlePrintReport = () => {
    if (!fromDate || !toDate) {
      showPopup("Please select both From Date and To Date", "error");
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      showPopup("From Date cannot be later than To Date", "error");
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      showPopup(`${reportType === "detailed" ? "Detailed TAT" : "TAT Summary"} Report would be printed here`, "info");
      setIsGenerating(false);
    }, 1000);
  };

  // Initialize dates and fetch options
  useEffect(() => {
    // Set default dates
    const today = new Date();
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(today.getMonth() - MAX_MONTHS_BACK);
    
    setFromDate(fourMonthsAgo.toISOString().split('T')[0]);
    setToDate(today.toISOString().split('T')[0]);
    
    // Fetch dropdown options
    fetchInvestigations();
    fetchModalities();
  }, []);

  // Reset page when report type changes
  useEffect(() => {
    setCurrentPage(1);
  }, [reportType]);

  // Calculate pagination
  const currentData = reportType === "detailed" ? detailedReportData : summaryReportData;
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = currentData.slice(indexOfFirst, indexOfLast);

  return (
    <div className="content-wrapper">
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
                    min={getFromDateMinMax().min}
                    max={getFromDateMinMax().max}
                    onChange={handleFromDateChange}
                  />
                  {/* <small className="text-muted">
                    Max {MAX_MONTHS_BACK} months back from today
                  </small> */}
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold">To Date <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={handleToDateChange}
                    required
                    readOnly
                  />
                  {/* <small className="text-muted">
                    Today's date
                  </small> */}
                </div>

                <div className="form-group col-md-3 position-relative">
                  <label className="form-label fw-bold">Investigation Name</label>
                  <input
                    type="text"
                    className="form-control mt-1"
                    id="investigationName"
                    placeholder="Search Investigation Name"
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
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleViewReport}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Generating...
                      </>
                    ) : (
                      "View HTML"
                    )}
                  </button>
                  
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-warning"
                      onClick={handleViewReport}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Generating...
                        </>
                      ) : (
                        "View Report"
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={handlePrintReport}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Printing...
                        </>
                      ) : (
                        "Print Report"
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {isGenerating && (
                <div className="text-center py-4">
                  <LoadingScreen />
                </div>
              )}

              {showReport && !isGenerating && currentData.length > 0 && (
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="card-title mb-0">
                          {reportType === "detailed" ? "Detailed TAT Report" : "TAT Summary Report"}
                          <span className="ms-3 text-muted">
                            ({formatDateForDisplay(fromDate)} to {formatDateForDisplay(toDate)})
                          </span>
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
                                {currentItems.map((row, index) => (
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
                                ))}
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
                                {currentItems.map((row, index) => (
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
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                        
                        {/* PAGINATION USING REUSABLE COMPONENT */}
                        {currentData.length > 0 && (
                          <Pagination
                            totalItems={currentData.length}
                            itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                            currentPage={currentPage}
                            onPageChange={setCurrentPage}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {showReport && !isGenerating && currentData.length === 0 && (
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="alert alert-info">
                      No records found for the selected criteria.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Popup Component */}
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

export default TATReport;