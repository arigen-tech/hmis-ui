import { useState, useEffect } from "react";
import { getRequest } from "../../../../service/apiService";
import LoadingScreen from "../../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../../Components/Pagination";
import Popup from "../../../../Components/popup";
import { MAS_INVESTIGATION, MAX_MONTHS_BACK } from "../../../../config/apiConfig";
import { FETCH_AMEND_REPORT_ERR_MSG, INVALID_DATE_PICK_WARN_MSG, SELECT_DATE_WARN_MSG } from "../../../../config/constants";

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [popupMessage, setPopupMessage] = useState(null);
  
  // API Data states
  const [investigationOptions, setInvestigationOptions] = useState([]);
  const [reportData, setReportData] = useState([]);
  
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

  // Format result with unit
  const formatResultWithUnit = (result, unit) => {
    if (!result && !unit) return "";
    if (!result) return "";
    if (!unit) return result;
    return `${result} ${unit}`;
  };

  // Fetch amendment audit report
  const fetchAmendAuditReport = async () => {
    try {
      setIsGenerating(true);
      
      const params = new URLSearchParams();
      if (patientMobile) {
        params.append('phnNum', patientMobile);
      }
      if (patientName) {
        params.append('patientName', patientName);
      }
      if (selectedInvestigation?.id) {
        params.append('investigationId', selectedInvestigation.id);
      }
      if (selectedModality?.id) {
        params.append('subChargeCodeId', selectedModality.id);
      }
      params.append('fromDate', fromDate);
      params.append('toDate', toDate);

      const response = await getRequest(`/report/lab-amend-audit?${params.toString()}`);
      
      if (response && response.response) {
        const mappedData = response.response.map(item => ({
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
        setShowReport(true);
      } else {
        setReportData([]);
        setShowReport(true);
      }
    } catch (error) {
      console.error("Error fetching amendment audit report:", error);
      showPopup(FETCH_AMEND_REPORT_ERR_MSG, "error");
      setReportData([]);
      setShowReport(true);
    } finally {
      setIsGenerating(false);
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

  // Handle view report
  const handleViewReport = () => {
    if (!fromDate || !toDate) {
      showPopup(SELECT_DATE_WARN_MSG, "Warning");
      return;
    }

    // Validate that from date is not after to date
    if (new Date(fromDate) > new Date(toDate)) {
      showPopup(INVALID_DATE_PICK_WARN_MSG, "Warning");
      return;
    }

    // Validate that date range doesn't exceed MAX_MONTHS_BACK
    const monthDiff = getMonthDifference(fromDate, toDate);
    if (monthDiff > MAX_MONTHS_BACK) {
      showPopup(`Date range cannot exceed ${MAX_MONTHS_BACK} months.`, "error");
      return;
    }

    fetchAmendAuditReport();
    setCurrentPage(1);
  };

  // Handle print report
  const handlePrintReport = () => {
    if (!fromDate || !toDate) {
      showPopup(SELECT_DATE_WARN_MSG, "Warning");
      return;
    }

    // Validate that from date is not after to date
    if (new Date(fromDate) > new Date(toDate)) {
      showPopup(INVALID_DATE_PICK_WARN_MSG, "Warning");
      return;
    }

    // Validate that date range doesn't exceed MAX_MONTHS_BACK
    const monthDiff = getMonthDifference(fromDate, toDate);
    if (monthDiff > MAX_MONTHS_BACK) {
      showPopup(`Date range cannot exceed ${MAX_MONTHS_BACK} months.`, "error");
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      showPopup("Result Amendment Report would be printed here", "info");
      setIsGenerating(false);
    }, 1000);
  };

  // Initialize with today's date as default for To Date
  useEffect(() => {
    const today = getTodayDate();
    setToDate(today);
    
    // Fetch dropdown options
    fetchInvestigations();
    fetchModalities();
  }, []);

  // Calculate pagination
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = reportData.slice(indexOfFirst, indexOfLast);

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">
                Result Amendment/Update Report
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

                <div className="col-md-3">
                  <label className="form-label fw-bold">Patient Mobile No</label>
                  <input
                    type="text"
                    className="form-control"
                    value={patientMobile}
                    onChange={(e) => {
                      // Remove all non-digit characters and limit to 10 digits
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 10) {
                        setPatientMobile(value);
                      }
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
                      "Search"
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

              {!isGenerating && showReport && (
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="card-title mb-0">
                          Result Amendment/Update Report
                          {/* <span className="ms-3 text-muted">
                            ({formatDateForDisplay(fromDate)} to {formatDateForDisplay(toDate)})
                          </span> */}
                        </h5>
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
                                currentItems.map((row, index) => (
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
                        
                        {/* PAGINATION USING REUSABLE COMPONENT */}
                        {reportData.length > 0 && (
                          <Pagination
                            totalItems={reportData.length}
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

export default ResultAmendmentReport;