import { useState, useEffect } from "react";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import Popup from "../../../Components/popup";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";
import { getRequest } from "../../../service/apiService";
import { DOCTOR_BY_SPECIALITY, FILTER_OPD_DEPT, GET_APPOINTMENT_SUMMARY_REPORT_END_URL,REQUEST_PARAM_HOSPITAL_ID,REQUEST_PARAM_DOCTOR_ID,REQUEST_PARAM_DEPARTMENT_ID,REQUEST_PARAM_TO_DATE,REQUEST_PARAM_FROM_DATE, REQUEST_PARAM_FLAG, APPOINTMENT_SUMMARY_DOCTOR_REPORT_END_URL, APPOINTMENT_SUMMARY_DEPT_REPORT_END_URL, STATUS_D, STATUS_P, REQUEST_PARAM_DEPARTMENT_TYPE_CODE, GET_ALL_ACT_MAS_DEPT_FOR_DROPDOWN_END_URL } from "../../../config/apiConfig";
import { DATA_NOT_FOUND_WRT_SELECTION_CRITERIA_WARN_MSG, EXCEDED_MONTH_SELECTION_WARN, FAIL_TO_LOAD_APPOINTMENT_SUMMARY_ERR_MSG, FAIL_TO_LOAD_DEPARTMENTS, FAIL_TO_LOAD_DOCTORS_ERR_MSG, INVALID_DATE_PICK_WARN_MSG, MONTH_RANGE_FOR_APPOINTMENT_SUMMARY_REPORT, REPORT_GENERATION_ERR_MSG, SELECT_DATE_WARN_MSG, SELECT_REPORT_TYPE_WARN_MSG } from "../../../config/constants";

const AppointmentSummaryReport = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [reportType, setReportType] = useState(""); // summary, doctor, department
  
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [filteredDoctorOptions, setFilteredDoctorOptions] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [popupMessage, setPopupMessage] = useState(null);
  const [reportData, setReportData] = useState([]);
  
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [isPrintLoading, setIsPrintLoading] = useState(false);

  const hospitalId = sessionStorage.getItem("hospitalId"); 

  useEffect(() => {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - MONTH_RANGE_FOR_APPOINTMENT_SUMMARY_REPORT);
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    setFromDate(formatDate(sixMonthsAgo));
    setToDate(formatDate(today));
    
    // Fetch departments on component mount
    fetchDepartments();
  }, []);

  // Check if all mandatory fields are selected to enable buttons
  const areMandatoryFieldsSelected = () => {
    return fromDate && toDate && reportType;
  };

  // Fetch departments from API
  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const response = await getRequest(`${GET_ALL_ACT_MAS_DEPT_FOR_DROPDOWN_END_URL}?${REQUEST_PARAM_DEPARTMENT_TYPE_CODE}=${FILTER_OPD_DEPT}`);
      if (response?.status === 200 && response?.response) {
        // Filter departments where departmentCode is "OPD"
        const opdDepartments = response.response;
        setDepartmentOptions(opdDepartments);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      showPopup(FAIL_TO_LOAD_DEPARTMENTS, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch doctors when department is selected
  useEffect(() => {
    if (selectedDepartment) {
      fetchDoctorsByDepartment(selectedDepartment);
    } else {
      setFilteredDoctorOptions([]);
      setSelectedDoctor("");
    }
  }, [selectedDepartment]);

  const fetchDoctorsByDepartment = async (departmentId) => {
    try {
      const response = await getRequest(`${DOCTOR_BY_SPECIALITY}${departmentId}`);
      if (response?.status === 200 && response?.response) {
        const doctors = response.response.map(doc => ({
          id: doc.userId,
          name: `${doc.firstName} ${doc.middleName || ''} ${doc.lastName || ''}`.trim()
        }));
        setFilteredDoctorOptions(doctors);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      showPopup(FAIL_TO_LOAD_DOCTORS_ERR_MSG, "error");
    }
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

  const handleFromDateChange = (e) => {
    const newFromDate = e.target.value;
    setFromDate(newFromDate);
    
    if (toDate) {
      const from = new Date(newFromDate);
      const to = new Date(toDate);
      const monthsDiff = (to.getFullYear() - from.getFullYear()) * 12 + 
                         (to.getMonth() - from.getMonth());
      
      if (monthsDiff > MONTH_RANGE_FOR_APPOINTMENT_SUMMARY_REPORT) {
        showPopup(EXCEDED_MONTH_SELECTION_WARN(MONTH_RANGE_FOR_APPOINTMENT_SUMMARY_REPORT), "warning");
        const maxToDate = new Date(from);
        maxToDate.setMonth(from.getMonth() + MONTH_RANGE_FOR_APPOINTMENT_SUMMARY_REPORT);
        const year = maxToDate.getFullYear();
        const month = String(maxToDate.getMonth() + 1).padStart(2, '0');
        const day = String(maxToDate.getDate()).padStart(2, '0');
        setToDate(`${year}-${month}-${day}`);
      }
    }
  };

  const handleToDateChange = (e) => {
    const newToDate = e.target.value;
    setToDate(newToDate);
    
    if (fromDate) {
      const from = new Date(fromDate);
      const to = new Date(newToDate);
      const monthsDiff = (to.getFullYear() - from.getFullYear()) * 12 + 
                         (to.getMonth() - from.getMonth());
      
      if (monthsDiff > MONTH_RANGE_FOR_APPOINTMENT_SUMMARY_REPORT) {
        showPopup(EXCEDED_MONTH_SELECTION_WARN(MONTH_RANGE_FOR_APPOINTMENT_SUMMARY_REPORT), "warning");
        const minFromDate = new Date(to);
        minFromDate.setMonth(to.getMonth() - MONTH_RANGE_FOR_APPOINTMENT_SUMMARY_REPORT);
        const year = minFromDate.getFullYear();
        const month = String(minFromDate.getMonth() + 1).padStart(2, '0');
        const day = String(minFromDate.getDate()).padStart(2, '0');
        setFromDate(`${year}-${month}-${day}`);
      }
    }
  };

  const handleDepartmentChange = (e) => {
    const deptId = e.target.value;
    setSelectedDepartment(deptId);
    setSelectedDoctor(""); // Reset doctor when department changes
  };

  const handleDoctorChange = (e) => {
    const doctorId = e.target.value;
    setSelectedDoctor(doctorId);
  };

  const handleReportTypeChange = (e) => {
    setReportType(e.target.value);
    setShowReport(false); // Hide table when report type changes
  };

  const validateFilters = () => {
    if (!fromDate || !toDate) {
      showPopup(SELECT_DATE_WARN_MSG, "warning");
      return false;
    }
    
    const from = new Date(fromDate);
    const to = new Date(toDate);
    
    if (from > to) {
      showPopup(INVALID_DATE_PICK_WARN_MSG, "warning");
      return false;
    }
    
    const monthsDiff = (to.getFullYear() - from.getFullYear()) * 12 + 
                       (to.getMonth() - from.getMonth());
    
    if (monthsDiff > MONTH_RANGE_FOR_APPOINTMENT_SUMMARY_REPORT) {
      showPopup(EXCEDED_MONTH_SELECTION_WARN(MONTH_RANGE_FOR_APPOINTMENT_SUMMARY_REPORT), "warning");
      return false;
    }

    // Check if report type is selected
    if (!reportType) {
      showPopup(SELECT_REPORT_TYPE_WARN_MSG, "warning");
      return false;
    }
    
    return true;
  };

  const fetchAppointmentSummary = async () => {
    if (!validateFilters()) return;
    
    try {
      setIsSearching(true);
      
      let flag = 0; // Default for department wise
      if (reportType === "doctor") {
        flag = 1; // Doctor wise
      } else if (reportType === "summary") {
        // For summary, we might need to handle differently based on your API
        // This example assumes summary might be department wise with no filters
        flag = 0;
      }

      const params = new URLSearchParams();
      params.append(REQUEST_PARAM_HOSPITAL_ID, hospitalId);
      if (selectedDepartment) params.append(REQUEST_PARAM_DEPARTMENT_ID, selectedDepartment);
      if (selectedDoctor && reportType === "doctor") params.append(REQUEST_PARAM_DOCTOR_ID, selectedDoctor);
      params.append(REQUEST_PARAM_FROM_DATE, fromDate);
      params.append(REQUEST_PARAM_TO_DATE, toDate);
      params.append(REQUEST_PARAM_FLAG, flag);

      const response = await getRequest(`${GET_APPOINTMENT_SUMMARY_REPORT_END_URL}?${params.toString()}`);
      
      if (response?.status === 200 && response?.response) {
        let data = response.response;
        
        // Format the data based on report type
        if (reportType === "doctor") {
          data = data.map(item => ({
            id: item.doctorId,
            doctorName: item.doctorName,
            booked: item.totalCount,
            completed: item.completedCount,
            cancelled: item.cancelledCount,
            noShow: item.noShowCount,
            pending: item.pendingCount
          }));
        } else if (reportType === "department") {
          data = data.map(item => ({
            id: item.departmentId,
            department: item.departmentName,
            booked: item.totalCount,
            completed: item.completedCount,
            cancelled: item.cancelledCount,
            noShow: item.noShowCount,
            pending: item.pendingCount
          }));
        }
        
        setReportData(data);
        setShowReport(true);
      } else {
        setReportData([]);
        setShowReport(true);
        showPopup(DATA_NOT_FOUND_WRT_SELECTION_CRITERIA_WARN_MSG, "info");
      }
      
    } catch (error) {
      console.error("Error fetching appointment summary:", error);
      showPopup(FAIL_TO_LOAD_APPOINTMENT_SUMMARY_ERR_MSG, "error");
      setReportData([]);
      setShowReport(true);
    } finally {
      setIsSearching(false);
    }
  };

  const generatePdfReport = async (flag = STATUS_D) => {
    if (!validateFilters()) return;

    if (flag === STATUS_D) {
      setIsViewLoading(true);
    } else if (flag === STATUS_P) {
      setIsPrintLoading(true);
    }
    
    setPdfUrl(null);

    try {
      const params = new URLSearchParams();
      params.append(`${REQUEST_PARAM_HOSPITAL_ID}`, hospitalId);
      params.append(`${REQUEST_PARAM_FLAG}`, flag);
      
      if (selectedDepartment) {
        params.append(`${REQUEST_PARAM_DEPARTMENT_ID}`, selectedDepartment);
      }
      if (selectedDoctor) {
        params.append(`${REQUEST_PARAM_DOCTOR_ID}`, selectedDoctor);
      }
      params.append(`${REQUEST_PARAM_FROM_DATE}`, fromDate);
      params.append(`${REQUEST_PARAM_TO_DATE}`, toDate);

      // Select the appropriate endpoint based on report type
      let url;
      if (reportType === "doctor") {
        url = `${APPOINTMENT_SUMMARY_DOCTOR_REPORT_END_URL}?${params.toString()}`;
      } else if (reportType === "department") {
        url = `${APPOINTMENT_SUMMARY_DEPT_REPORT_END_URL}?${params.toString()}`;
      } 

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
        const blob = await response.blob();
        const fileURL = window.URL.createObjectURL(blob);
        setPdfUrl(fileURL);
      }

    } catch (error) {
      console.error("Error generating PDF", error);
      showPopup(REPORT_GENERATION_ERR_MSG, "error");
    } finally {
      if (flag === STATUS_D) {
        setIsViewLoading(false);
      } else if (flag === STATUS_P) {
        setIsPrintLoading(false);
      }
    }
  };

  const handleSearch = () => {
    fetchAppointmentSummary();
    setCurrentPage(1);
  };

  const handleViewReport = () => {
    generatePdfReport(STATUS_D);
  };

  const handlePrintReport = () => {
    generatePdfReport(STATUS_P);
  };

  const handleReset = () => {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - MONTH_RANGE_FOR_APPOINTMENT_SUMMARY_REPORT);
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    setFromDate(formatDate(sixMonthsAgo));
    setToDate(formatDate(today));
    setSelectedDepartment("");
    setSelectedDoctor("");
    setReportType("");
    setShowReport(false);
    setReportData([]);
    setCurrentPage(1);
    setPdfUrl(null);
  };

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = reportData.slice(indexOfFirst, indexOfLast);

  const getReportColumns = () => {
    switch(reportType) {
      case "summary":
        return ["Date", "Booked","Pending", "Completed", "Cancelled", "No-Show"];
      case "doctor":
        return ["Doctor Name", "Booked","Pending", "Completed", "Cancelled", "No-Show"];
      case "department":
        return ["Department", "Booked","Pending", "Completed", "Cancelled", "No-Show"];
      default:
        return ["Date", "Booked","Pending", "Completed", "Cancelled", "No-Show"];
    }
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

      {pdfUrl && (
        <PdfViewer
          pdfUrl={pdfUrl}
          onClose={() => {
            setPdfUrl(null);
          }}
          name={`Appointment Summary Report - ${reportType}`}
        />
      )}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Appointment Summary Report</h4>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-bold">From Date <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className="form-control mt-1"
                    value={fromDate}
                    onChange={handleFromDateChange}
                    max={toDate}
                  />
                </div>
                
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-bold">To Date <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className="form-control mt-1"
                    value={toDate}
                    onChange={handleToDateChange}
                    min={fromDate}
                  />
                </div>
                
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-bold">Department</label>
                  <select 
                    className="form-select mt-1" 
                    value={selectedDepartment} 
                    onChange={handleDepartmentChange}
                  >
                    <option value="">All Departments</option>
                    {departmentOptions.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.departmentName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-bold">Doctor</label>
                  <select 
                    className="form-select mt-1" 
                    value={selectedDoctor} 
                    onChange={handleDoctorChange}
                    disabled={!selectedDepartment}
                  >
                    <option value="">All Doctors</option>
                    {filteredDoctorOptions.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="col-12 mb-3">
                  <label className="form-label fw-bold d-block mb-2">Report Type <span className="text-danger">*</span></label>
                  <div className="d-flex flex-wrap gap-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="reportType"
                        id="doctor"
                        value="doctor"
                        checked={reportType === "doctor"}
                        onChange={handleReportTypeChange}
                      />
                      <label className="form-check-label" htmlFor="doctor">
                        Doctor Wise
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="reportType"
                        id="department"
                        value="department"
                        checked={reportType === "department"}
                        onChange={handleReportTypeChange}
                      />
                      <label className="form-check-label" htmlFor="department">
                        Department Wise
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-12 d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSearch}
                    disabled={!areMandatoryFieldsSelected() || isSearching }
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
                  
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleViewReport}
                      disabled={!areMandatoryFieldsSelected() || isSearching || isViewLoading }
                    >
                      {isViewLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Generating...
                        </>
                      ) : (
                        <>
                      <i className="fa fa-eye me-2"></i>
                      VIEW / DOWNLOAD
                    </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-warning btn-sm"
                      onClick={handlePrintReport}
                      disabled={!areMandatoryFieldsSelected() || isSearching || isPrintLoading }
                    >
                      {isPrintLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Printing...
                        </>
                      ) : (
                        <>
                      <i className="fa fa-print me-2"></i>
                      PRINT
                    </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleReset}
                      disabled={isSearching}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {(isLoading) && (
                
                  <LoadingScreen />
              )}

              {!isSearching  && showReport && (
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="card-title mb-0">
                          Appointment Summary Report - {reportType === "doctor" ? "Doctor Wise" : "Department Wise"}
                        </h5>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-bordered table-hover">
                            <thead>
                              <tr>
                                {getReportColumns().map((column, index) => (
                                  <th key={index}>{column}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.length > 0 ? (
                                currentItems.map((row, index) => (
                                  <tr key={index}>
                                    {reportType === "doctor" && (
                                      <>
                                        <td>{row.doctorName}</td>
                                        <td className="text-end">{row.booked}</td>
                                        <td className="text-end">{row.pending}</td>
                                        <td className="text-end">{row.completed}</td>
                                        <td className="text-end">{row.cancelled}</td>
                                        <td className="text-end">{row.noShow}</td>
                                        
                                      </>
                                    )}
                                    {reportType === "department" && (
                                      <>
                                        <td>{row.department}</td>
                                        <td className="text-end">{row.booked}</td>
                                        <td className="text-end">{row.pending}</td>
                                        <td className="text-end">{row.completed}</td>
                                        <td className="text-end">{row.cancelled}</td>
                                        <td className="text-end">{row.noShow}</td>
                                        
                                      </>
                                    )}
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={getReportColumns().length} className="text-center py-4">
                                    No appointment records found for the selected criteria
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        
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
    </div>
  );
};

export default AppointmentSummaryReport;