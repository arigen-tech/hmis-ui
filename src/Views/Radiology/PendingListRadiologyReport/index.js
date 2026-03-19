import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest } from "../../../service/apiService";
import { GET_MODALITY_DROPDOWN_WRT_DEPARTMENT, REQUEST_PARAM_CODE, RADIOLOGY_DEPARTMENT_CODE } from "../../../config/apiConfig";
import { FETCH_PENDING_LIST_ERR_MSG, FETCH_RADIOLOGY_TEMPLATE_ERR_MSG } from "../../../config/constants";

const PendingListRadiologyReport = () => {
  const navigate = useNavigate();
  
  // State for data
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [modalityOptions, setModalityOptions] = useState([]);
  const [loadingModality, setLoadingModality] = useState(false);

  // Search states
  const [searchPatientName, setSearchPatientName] = useState("");
  const [searchMobileNo, setSearchMobileNo] = useState("");
  const [searchModalityId, setSearchModalityId] = useState("");

  // Fetch modality options from API (same as PACS list)
  const fetchModalityOptions = async () => {
    try {
      setLoadingModality(true);
      const response = await getRequest(`${GET_MODALITY_DROPDOWN_WRT_DEPARTMENT}?${REQUEST_PARAM_CODE}=${RADIOLOGY_DEPARTMENT_CODE}`);
      
      if (response?.status === 200 && response?.response) {
        setModalityOptions(response.response);
      }
    } catch (error) {
      console.error("Error fetching modality options:", error);
    } finally {
      setLoadingModality(false);
    }
  };

  // Format date as dd/MM/yyyy
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return "-";
    }
  };

  // Format time from ISO string
  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return "-";
    try {
      const date = new Date(dateTimeString);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (error) {
      return "-";
    }
  };

  // Format study time from the studyTime object
  const formatStudyTime = (studyTime) => {
    if (!studyTime) return "-";
    try {
      const hours = String(studyTime.hour || 0).padStart(2, '0');
      const minutes = String(studyTime.minute || 0).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (error) {
      return "-";
    }
  };

  // Fetch pending radiology reports with server-side pagination
  const fetchPendingReports = async (page = 0, patientName = "", phoneNumber = "", modalityId = "", isSearch = false) => {
    try {
      if (isSearch) {
        setSearchLoading(true);
      } else if (!isSearch && page === 0 && !loading) {
        // For reset/show all, don't show any loading
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams({
        page: page,
        size: DEFAULT_ITEMS_PER_PAGE
      });

      if (patientName?.trim()) params.append('patientName', patientName.trim());
      if (phoneNumber?.trim()) params.append('phoneNumber', phoneNumber.trim());
      // Send modality ID for search
      if (modalityId?.trim()) params.append('modality', modalityId.trim());

      const response = await getRequest(`/radiology/pendingListForRadiologyReport?${params.toString()}`);

      if (response?.response) {
        const mappedData = response.response.content.map(item => ({
          id: item.radOrderDtId,
          accessionNo: item.accessionNo,
          uhid: item.uhidNo,
          patientName: item.patientName,
          age: item.age,
          gender: item.gender,
          contactNo: item.phoneNumber,
          modality: item.modality,
          modalityId: item.modalityId,
          investigationName: item.investigationName,
          orderDate: formatDate(item.orderDate),
          orderTime: formatTime(item.orderTime),
          studyDate: formatDate(item.studyDate),
          studyTime: formatStudyTime(item.studyTime),
          reportStatus: item.reportStatus,
          studyStatus: item.studyStatus,
          department: item.department
        }));

        setReportData(mappedData);
        setTotalPages(response.response.totalPages);
        setTotalElements(response.response.totalElements);
      } else {
        setReportData([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      console.error("Error fetching pending reports:", error);
      showPopup(FETCH_PENDING_LIST_ERR_MSG, "error");
      setReportData([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  // Fetch modality options on component mount
  useEffect(() => {
    fetchModalityOptions();
  }, []);

  // Initial load
  useEffect(() => {
    fetchPendingReports(0, "", "", "", false);
  }, []);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(0);
    setIsSearchMode(true);
    fetchPendingReports(0, searchPatientName, searchMobileNo, searchModalityId, true);
  };

  // Handle reset
  const handleReset = () => {
    setSearchPatientName("");
    setSearchMobileNo("");
    setSearchModalityId("");
    setCurrentPage(0);
    setIsSearchMode(false);
    fetchPendingReports(0, "", "", "", false);
  };

  // Handle page change
  const handlePageChange = (page) => {
    const newPage = page - 1;
    setCurrentPage(newPage);
    
    if (isSearchMode) {
      fetchPendingReports(newPage, searchPatientName, searchMobileNo, searchModalityId, true);
    } else {
      fetchPendingReports(newPage, "", "", "", false);
    }
  };

  // Navigate to detailed report page with modalityId
  const handleRowClick = (item) => {
    try {
      // Navigate to detailed report page with all required data
      navigate('/DetailedRadiologyReportPage', { 
        state: { 
          radOrderDtId: item.id,
          accessionNo: item.accessionNo,
          patientName: item.patientName,
          uhid: item.uhid,
          modalityId: item.modalityId, // Pass modalityId to fetch templates on the next page
          modality: item.modality,
          investigationName: item.investigationName,
          // Pass any other required fields from the row
          age: item.age,
          gender: item.gender,
          contactNo: item.contactNo,
          orderDate: item.orderDate,
          orderTime: item.orderTime,
          studyDate: item.studyDate,
          studyTime: item.studyTime,
          department: item.department
        } 
      });
    } catch (error) {
      console.error("Error navigating to detailed report:", error);
      showPopup(FETCH_RADIOLOGY_TEMPLATE_ERR_MSG, "error");
    }
  };

  // Show popup
  const showPopup = (message, type = 'success') => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Pending List for Radiology Report</h4>
            </div>

            <div className="card-body">
              {loading ? (
                <LoadingScreen />
              ) : (
                <>
                  {/* Search Fields */}
                  <div className="mb-4">
                    <div className="row align-items-end">
                      {/* Patient Name Search */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="form-label fw-bold">Patient Name</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter patient name"
                            value={searchPatientName}
                            onChange={(e) => setSearchPatientName(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Mobile Number Search */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="form-label fw-bold">Mobile Number</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter mobile number"
                            value={searchMobileNo}
                            onChange={(e) => setSearchMobileNo(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Modality Filter - Using options from API with ID as value */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="form-label fw-bold">Modality</label>
                          <select
                            className="form-select"
                            value={searchModalityId}
                            onChange={(e) => setSearchModalityId(e.target.value)}
                            disabled={loadingModality}
                          >
                            <option value="">All Modalities</option>
                            {modalityOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.modalityName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Search and Reset Buttons */}
                      <div className="col-md-2">
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-primary flex-grow-1"
                            onClick={handleSearch}
                            disabled={loading || searchLoading || loadingModality}
                          >
                            {searchLoading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" />
                                Searching...
                              </>
                            ) : (
                              <>
                                <i className="mdi mdi-magnify"></i> Search
                              </>
                            )}
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={handleReset}
                            disabled={loading || searchLoading}
                          >
                            <i className="mdi mdi-refresh"></i> Reset
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Accession No</th>
                          <th>UHID</th>
                          <th>Patient Name</th>
                          <th>Age/Gender</th>
                          <th>Mobile No</th>
                          <th>Modality</th>
                          <th>Investigation</th>
                          <th>Order Date/Time</th>
                          <th>Study Date/Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.length > 0 ? (
                          reportData.map((item) => (
                            <tr 
                              key={item.id} 
                              onClick={() => handleRowClick(item)}
                              style={{ cursor: 'pointer' }}
                              className="table-row-hover"
                            >
                              <td>
                                <span>{item.accessionNo}</span>
                              </td>
                              <td>
                                <span>{item.uhid}</span>
                              </td>
                              <td>
                                <span>{item.patientName}</span>
                              </td>
                              <td>{item.age} / {item.gender}</td>
                              <td>{item.contactNo}</td>
                              <td>
                                <span>{item.modality}</span>
                              </td>
                              <td>{item.investigationName}</td>
                              <td>
                                <div>{item.orderDate} {item.orderTime}</div>
                              </td>
                              <td>
                                <div>{item.studyDate} {item.studyTime}</div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="9" className="text-center py-4">
                              <p className="mt-2 text-muted">No investigations found matching your criteria</p>
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
                </>
              )}

              {/* Popup Message */}
              {popupMessage && (
                <Popup
                  message={popupMessage.message}
                  type={popupMessage.type}
                  onClose={popupMessage.onClose}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingListRadiologyReport;