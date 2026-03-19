import { useState, useEffect, useRef } from "react";
import Popup from "../../../Components/popup";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";
import { getRequest } from "../../../service/apiService";
import LoadingScreen from "../../../Components/Loading";
import {  GET_MODALITY_DROPDOWN_WRT_DEPARTMENT, REQUEST_PARAM_CODE, RADIOLOGY_DEPARTMENT_CODE, PACS_STUDY_LIST_GET_API, RADIOLOGY_REPORT_END_URL, REQUEST_PARAM_RAD_ORDER_DT_ID, REQUEST_PARAM_FLAG, STATUS_Y, STATUS_N, STATUS_S } from "../../../config/apiConfig";
import { FETCH_MODALITY_OPTION_ERR_MSG, FETCH_STUDY_LIST_ERR_MSG, REPORT_GENERATION_ERR_MSG, SEARCH_CRITERIA_MANDATORY_WARN_MSG } from "../../../config/constants";

const RadiologyPACSStudyList = () => {
  // State for form inputs
  const [patientName, setPatientName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [modalityId, setModalityId] = useState("");
  const [modalityOptions, setModalityOptions] = useState([]);
  
  // State for pagination and search
  const [currentPage, setCurrentPage] = useState(0);
  const [reportData, setReportData] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [paginationLoading, setPaginationLoading] = useState(false); // New state for pagination loading
  const [isSearching, setIsSearching] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isShowAllLoading, setIsShowAllLoading] = useState(false);
  const [loading,setLoading] = useState(false);
  // State for PDF operations
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);
  
  // State for popup messages
  const [popupMessage, setPopupMessage] = useState(null);
  
  // Refs
  const isMounted = useRef(true);

  // Fetch modality dropdown options and initial data on component mount
  useEffect(() => {
    fetchModalityOptions();
    fetchInitialData();
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch initial data on page load
  const fetchInitialData = async () => {
    try {
      setSearchLoading(true);
      await fetchPACSStudyList(0, true); // Pass true to indicate this is initial load
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Check if search is enabled (at least one search criteria)
  const isSearchEnabled = () => {
    return patientName?.trim() !== "" || phoneNumber?.trim() !== "" || modalityId?.trim() !== "";
  };

  // Fetch modality options from API
  const fetchModalityOptions = async () => {
    try {

      setLoading(true);
      const response = await getRequest(`${GET_MODALITY_DROPDOWN_WRT_DEPARTMENT}?${REQUEST_PARAM_CODE}=${RADIOLOGY_DEPARTMENT_CODE}`);
      
      if (response?.status === 200 && response?.response) {
        setModalityOptions(response.response);
      }
    } catch (error) {
      console.error("Error fetching modality options:", error);
      showPopup(FETCH_MODALITY_OPTION_ERR_MSG, "error");
    }finally {
      setLoading(false);
    }
  };

  // Fetch PACS study list from API
  const fetchPACSStudyList = async (page = 0, isInitialLoad = false) => {
    try {
      // Only show loading for initial load, not for pagination
      if (isInitialLoad) {
        setSearchLoading(true);
      } else {
        setPaginationLoading(true); // Show pagination loading only
      }
      
      const params = new URLSearchParams({
        page: page,
        size: DEFAULT_ITEMS_PER_PAGE
      });
      
      // Add search parameters if they exist (for search mode)
      if (modalityId) params.append('modality', modalityId);
      if (patientName?.trim()) params.append('patientName', patientName.trim());
      if (phoneNumber?.trim()) params.append('phoneNumber', phoneNumber.trim());
      
      const response = await getRequest(`${PACS_STUDY_LIST_GET_API}?${params.toString()}`);
      
      if (response?.status === 200 && response?.response) {
        const mappedData = mapApiData(response.response.content);
        setReportData(mappedData);
        setTotalPages(response.response.totalPages);
        setTotalElements(response.response.totalElements);
        setShowReport(true);
      } else {
        resetReportData();
      }
    } catch (error) {
      console.error("Error fetching PACS study list:", error);
      showPopup(FETCH_STUDY_LIST_ERR_MSG, "error");
      resetReportData();
    } finally {
      if (isInitialLoad) {
        setSearchLoading(false);
      } else {
        setPaginationLoading(false); // Hide pagination loading
      }
      setIsSearching(false);
      setIsShowAllLoading(false);
    }
  };

  // Reset report data to initial state
  const resetReportData = () => {
    setReportData([]);
    setTotalPages(0);
    setTotalElements(0);
    setShowReport(true);
  };

  // Handle pagination page change
  const handlePageChange = (page) => {
    const newPage = page - 1;
    setCurrentPage(newPage);
    
    // If in search mode with criteria, use search, otherwise fetch all data
    if (isSearchMode && isSearchEnabled()) {
      fetchPACSStudyList(newPage, false);
    } else {
      // For regular pagination without search criteria
      fetchPACSStudyList(newPage, false);
    }
  };

  // Map API data to match table structure
  const mapApiData = (apiData) => {
    return apiData.map(item => ({
      id: item.radOrderDtId,
      accessionNo: item.accessionNo || "-",
      uhidNo: item.uhidNo || "-",
      patientName: item.patientName || "-",
      age: item.age || "-",
      gender: item.gender || "-",
      phoneNumber: item.phoneNumber || "-",
      modality: item.modality || "-",
      modalityId: item.modalityId,
      investigationName: item.investigationName || "-",
      orderDate: formatOrderDateTime(item.orderDate, item.orderTime),
      studyDate: formatStudyDateTime(item.studyDate, item.studyTime),
      reportStatus: item.reportStatus || "n",
      studyStatus: item.studyStatus || "n",
      department: item.department || "-"
    }));
  };

  // Format order date and time
  const formatOrderDateTime = (date, time) => {
    if (!date) return "-";
    const formattedDate = formatDateForDisplay(date);
    if (!time) return formattedDate;
    
    try {
      const timeStr = new Date(time).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      return `${formattedDate} ${timeStr}`;
    } catch {
      return formattedDate;
    }
  };

  // Format study date and time
  const formatStudyDateTime = (date, time) => {
    if (!date) return "-";
    const formattedDate = formatDateForDisplay(date);
    if (!time) return formattedDate;
    
    try {
      const timeStr = new Date(time).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      return `${formattedDate} ${timeStr}`;
    } catch {
      return formattedDate;
    }
  };

  // Format date from "2026-01-28" to "28/01/2026"
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Show popup message
  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => setPopupMessage(null),
    });
  };

  // Handle search button click
  const handleSearch = () => {
    if (!isSearchEnabled()) {
      showPopup(SEARCH_CRITERIA_MANDATORY_WARN_MSG, "warning");
      return;
    }
    setIsSearching(true);
    setCurrentPage(0);
    setIsSearchMode(true);
    fetchPACSStudyList(0, false);
  };

  // Handle reset button click - clears all fields and fetches all data again
  const handleShowAll = async () => {
    setIsShowAllLoading(true);
    
    // Clear all search fields
    setPatientName("");
    setPhoneNumber("");
    setModalityId("");
    setCurrentPage(0);
    setIsSearchMode(false);
    setIsSearching(false);
    
    // Fetch all data without any search criteria from page 0
    try {
      const params = new URLSearchParams({
        page: 0,
        size: DEFAULT_ITEMS_PER_PAGE
      });
      
      const response = await getRequest(`${PACS_STUDY_LIST_GET_API}?${params.toString()}`);
      
      if (response?.status === 200 && response?.response) {
        const mappedData = mapApiData(response.response.content);
        setReportData(mappedData);
        setTotalPages(response.response.totalPages);
        setTotalElements(response.response.totalElements);
        setShowReport(true);
      } else {
        resetReportData();
      }
    } catch (error) {
      console.error("Error fetching PACS study list:", error);
      showPopup(FETCH_STUDY_LIST_ERR_MSG, "error");
      resetReportData();
    } finally {
      setIsShowAllLoading(false);
    }
  };

  // Handle view report button
  const handleViewReport = async (radOrderDtId) => {
    try {
      setIsViewLoading(true);
      setSelectedReportId(radOrderDtId);
      
      // Construct the report URL
      const reportUrl = `${RADIOLOGY_REPORT_END_URL}?${REQUEST_PARAM_RAD_ORDER_DT_ID}=${radOrderDtId}&${REQUEST_PARAM_FLAG}=d`;
      
      // Fetch the PDF
      const response = await fetch(reportUrl, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch report");
      }

      const blob = await response.blob();
      const fileURL = window.URL.createObjectURL(blob);
      setPdfUrl(fileURL);
      
    } catch (err) {
      console.error("Error generating PDF:", err);
      showPopup(REPORT_GENERATION_ERR_MSG, "error");
    } finally {
      setIsViewLoading(false);
      setSelectedReportId(null);
    }
  };

  // Handle DICOM view (placeholder for now)
  const handleDicomView = (item) => {
    showPopup(`DICOM viewer for ${item.patientName} - Coming soon`, "info");
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch(status?.toLowerCase()) {
      case `${STATUS_Y}`.toLowerCase():
        return 'badge bg-success';
      case `${STATUS_N}`.toLowerCase():
        return 'badge bg-warning';
      case `${STATUS_S}`.toLowerCase():
        return 'badge bg-info';
      default:
        return 'badge bg-secondary';
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch(status?.toLowerCase()) {
      case `${STATUS_Y}`.toLowerCase():
        return 'Completed';
      case `${STATUS_N}`.toLowerCase():
        return 'Pending';
      case `${STATUS_S}`.toLowerCase():
        return 'Draft';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="content-wrapper">
      {loading && <LoadingScreen/>}
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}

      {pdfUrl && (
        <PdfViewer
          pdfUrl={pdfUrl}
          onClose={() => setPdfUrl(null)}
          name={`Radiology Report - ${selectedReportId}`}
        />
      )}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Radiology PACS Study List</h4>
            </div>
            <div className="card-body">
              {/* Search Form */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <label className="form-label fw-bold">Patient Name</label>
                  <input
                    type="text"
                    className="form-control mt-1"
                    placeholder="Enter patient name..."
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold">Phone Number</label>
                  <input
                    type="text"
                    className="form-control mt-1"
                    placeholder="Enter phone number..."
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold">Modality</label>
                  <select 
                    className="form-select mt-1"
                    value={modalityId}
                    onChange={(e) => setModalityId(e.target.value)}
                  >
                    <option value="">--Select Modality--</option>
                    {modalityOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.modalityName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3 d-flex align-items-end gap-2">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSearch}
                    disabled={searchLoading || isSearching || !isSearchEnabled()}
                  >
                    {isSearching ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Searching...
                      </>
                    ) : (
                      <>
                        Search
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleShowAll}
                    disabled={searchLoading || isShowAllLoading}
                  >
                    {isShowAllLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Showing All...
                      </>
                    ) : (
                      <>
                        <i className="mdi mdi-format-list-bulleted me-2"></i>
                        Show All
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Loading Indicator - Only for initial load and search */}
              {(searchLoading) && (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}

              {/* Report Table */}
              {!searchLoading && showReport && (
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="card-title mb-0">
                          PACS Study List
                          {(patientName || phoneNumber || modalityId) && (
                            <small className="text-muted ms-2">
                              - Search Results
                            </small>
                          )}
                        </h5>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-bordered table-hover">
                            <thead>
                              <tr>
                                <th>Accession No</th>
                                <th>UHID</th>
                                <th>Patient Name</th>
                                <th>Age/Gender</th>
                                <th>Contact No</th>
                                <th>Modality</th>
                                <th>Investigation</th>
                                <th>Order Date/Time</th>
                                <th>Study Date/Time</th>
                                <th>Report Status</th>
                                <th>Report</th>
                                <th>DICOM</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginationLoading ? (
                                <tr>
                                  <td colSpan="12" className="text-center py-4">
                                    <div className="spinner-border text-primary spinner-sm" role="status">
                                      <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <span className="ms-2">Loading page...</span>
                                  </td>
                                </tr>
                              ) : reportData.length > 0 ? (
                                reportData.map((row) => (
                                  <tr key={row.id}>
                                    <td>{row.accessionNo}</td>
                                    <td>{row.uhidNo}</td>
                                    <td>{row.patientName}</td>
                                    <td>{row.age} / {row.gender}</td>
                                    <td>{row.phoneNumber}</td>
                                    <td>{row.modality}</td>
                                    <td>{row.investigationName}</td>
                                    <td>{row.orderDate}</td>
                                    <td>{row.studyDate}</td>
                                    <td>
                                      <span className={getStatusBadgeClass(row.reportStatus)}>
                                        {getStatusText(row.reportStatus)}
                                      </span>
                                    </td>
                                    <td className="text-center">
                                      {row.reportStatus?.toLowerCase() === `${STATUS_Y}`.toLowerCase() && (
                                        <button
                                          className="btn btn-sm btn-success"
                                          onClick={() => handleViewReport(row.id)}
                                          disabled={isViewLoading && selectedReportId === row.id}
                                        >
                                          {isViewLoading && selectedReportId === row.id ? (
                                            <>
                                              <span className="spinner-border spinner-border-sm me-1" />
                                              Generating...
                                            </>
                                          ) : (
                                            <>
                                              <i className="fa fa-eye me-1"></i>
                                              View
                                            </>
                                          )}
                                        </button>
                                      )}
                                    </td>
                                    <td className="text-center">
                                      <button
                                        className="btn btn-sm btn-success"
                                        onClick={() => handleDicomView(row)}
                                      >
                                        <i className="fa fa-eye"></i>
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="12" className="text-center py-4">
                                    No records found
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Pagination */}
                        {reportData.length > 0 && totalPages > 0 && (
                          <Pagination
                            totalItems={totalElements}
                            itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                            currentPage={currentPage + 1}
                            onPageChange={handlePageChange}
                            totalPages={totalPages}
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

export default RadiologyPACSStudyList;