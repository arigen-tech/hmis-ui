import { useState, useEffect } from "react";
import LoadingScreen from "../../../Components/Loading";
import Pagination, {
  DEFAULT_ITEMS_PER_PAGE,
} from "../../../Components/Pagination";
import Popup from "../../../Components/popup";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";
import {
  DAILY_CANCELLATION_REPORT_END_URL,
  DOCTOR_BY_SPECIALITY,
  FILTER_OPD_DEPT,
  GET_ALL_ACT_MAS_DEPT_FOR_DROPDOWN_END_URL,
  GET_ALL_REASONS,
  GET_CANCELLED_APPOINTMENTS,
  REQUEST_PARAM_CANCELLATION_ID,
  REQUEST_PARAM_CANCELLATION_REASON_ID,
  REQUEST_PARAM_DEPARTMENT_ID,
  REQUEST_PARAM_DEPARTMENT_TYPE_CODE,
  REQUEST_PARAM_DOCTOR_ID,
  REQUEST_PARAM_FLAG,
  REQUEST_PARAM_FROM_DATE,
  REQUEST_PARAM_HOSPITAL_ID,
  REQUEST_PARAM_TO_DATE,
  STATUS_D,
  STATUS_P,
} from "../../../config/apiConfig";
import { getRequest } from "../../../service/apiService";
import {
  FETCH_CANCELLATION_REASONS_ERROR_LOG,
  FETCH_DATA_ERROR,
  UNEXPECTED_API_RESPONSE_ERR,
  SELECT_DATE_WARN_MSG,
  FROM_DATE_FUTURE_ERR_MSG,
  TO_DATE_FUTURE_ERR_MSG,
  PAST_DATE_PICK_WARN_MSG,
  REPORT_GENERATION_ERR_MSG,
  DAY_RANGE_FOR_OPD_CANCELLTION_REPORT,
  EXCEDED_DAY_SELECTION_WARN,
  DATA_NOT_FOUND_WRT_SELECTION_CRITERIA_WARN_MSG,
} from "../../../config/constants";

const DailyCancellationReport = () => {
  // State for filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [doctorOptions, setDoctorOptions] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [departmentData, setDepartmentData] = useState([]);

  // State for dropdowns
  const [reasonOptions, setReasonOptions] = useState([]);

  // UI states
  const [isSearching, setIsSearching] = useState(false); // New state for search spinner
  const [showReport, setShowReport] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [popupMessage, setPopupMessage] = useState(null);
  const [reportData, setReportData] = useState([]);

  // PDF states
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [isPrintLoading, setIsPrintLoading] = useState(false);

  const formatDateTimeWithoutTZ = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const formatAppointmentDateTime = (appointmentDate, appointmentTime) => {
    if (!appointmentDate || !appointmentTime) return "-";
    
    // Parse the date (assuming format YYYY-MM-DD)
    const [year, month, day] = appointmentDate.split('-');
    
    // Parse time range (format: HH:MM - HH:MM)
    const timeRange = appointmentTime;
    
    return `${day}/${month}/${year} ${timeRange}`;
  };

  useEffect(() => {
    fetchDepartment();
    fetchCancellationReasons();
  }, []);
  
  // Initialize dates on component mount
  useEffect(() => {
    const today = new Date();
    const daysAgo = new Date(today);
    daysAgo.setDate(today.getDate() - DAY_RANGE_FOR_OPD_CANCELLTION_REPORT);

    setToDate(formatDateForInput(today));
    setFromDate(formatDateForInput(daysAgo));
  }, []);

  // Format date to YYYY-MM-DD for input fields
  const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0];
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

  async function fetchDepartment() {
    try {
      setLoading(true);
      const data = await getRequest(`${GET_ALL_ACT_MAS_DEPT_FOR_DROPDOWN_END_URL}?${REQUEST_PARAM_DEPARTMENT_TYPE_CODE}=${FILTER_OPD_DEPT}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        const filteredDepartments = data.response;
        console.log(filteredDepartments);
        setDepartmentData(filteredDepartments);
      } else {
        console.error(UNEXPECTED_API_RESPONSE_ERR, data);
        setDepartmentData([]);
      }
    } catch (error) {
      console.error(FETCH_DATA_ERROR, error);
    } finally {
      setLoading(false);
    }
  }

  const fetchCancellationReasons = async () => {
    try {
      setLoading(true);
      const data = await getRequest(`${GET_ALL_REASONS}/1`);

      if (data.status === 200 && Array.isArray(data.response)) {
        const activeReasons = data.response;
        setReasonOptions(activeReasons);
      } else {
        console.error("Unexpected API response:", data);
        setReasonOptions([]);
      }
    } catch (error) {
      setLoading(false);
      console.error(FETCH_CANCELLATION_REASONS_ERROR_LOG, error);
      setReasonOptions([]);
    }
  };

  const handleFromDateChange = (e) => {
    const selectedDate = e.target.value;
    const today = formatDateForInput(new Date());

    if (selectedDate > today) {
      showPopup(FROM_DATE_FUTURE_ERR_MSG, "warning");
      return;
    }

    setFromDate(selectedDate);

    // Validate date range doesn't exceed 30 days
    if (toDate) {
      const fromDateTime = new Date(selectedDate).getTime();
      const toDateTime = new Date(toDate).getTime();
      const diffDays = Math.ceil(Math.abs(toDateTime - fromDateTime) / (1000 * 60 * 60 * 24));

      if (diffDays > DAY_RANGE_FOR_OPD_CANCELLTION_REPORT) {
        showPopup(EXCEDED_DAY_SELECTION_WARN(DAY_RANGE_FOR_OPD_CANCELLTION_REPORT), "warning");
        // Adjust to date to be exactly 30 days from from date
        const newToDate = new Date(selectedDate);
        newToDate.setDate(newToDate.getDate() + DAY_RANGE_FOR_OPD_CANCELLTION_REPORT);
        setToDate(formatDateForInput(newToDate));
      }
    }
  };

  const handleToDateChange = (e) => {
    const selectedDate = e.target.value;
    const today = formatDateForInput(new Date());

    if (selectedDate > today) {
      showPopup(TO_DATE_FUTURE_ERR_MSG, "warning");
      return;
    }

    if (fromDate) {
      const fromDateTime = new Date(fromDate).getTime();
      const toDateTime = new Date(selectedDate).getTime();
      const diffDays = Math.ceil(Math.abs(toDateTime - fromDateTime) / (1000 * 60 * 60 * 24));

      if (diffDays > DAY_RANGE_FOR_OPD_CANCELLTION_REPORT) {
        showPopup(EXCEDED_DAY_SELECTION_WARN(DAY_RANGE_FOR_OPD_CANCELLTION_REPORT), "warning");
        return;
      }

      if (selectedDate < fromDate) {
        showPopup(PAST_DATE_PICK_WARN_MSG, "warning");
        return;
      }
    }

    setToDate(selectedDate);
  };

  const validateDates = () => {
    if (!fromDate || !toDate) {
      showPopup(SELECT_DATE_WARN_MSG, "warning");
      return false;
    }

    const fromDateTime = new Date(fromDate).getTime();
    const toDateTime = new Date(toDate).getTime();
    const diffDays = Math.ceil(Math.abs(toDateTime - fromDateTime) / (1000 * 60 * 60 * 24));

    if (diffDays > DAY_RANGE_FOR_OPD_CANCELLTION_REPORT) {
      showPopup(EXCEDED_DAY_SELECTION_WARN(DAY_RANGE_FOR_OPD_CANCELLTION_REPORT), "warning");
      return false;
    }

    if (fromDate > toDate) {
      showPopup(PAST_DATE_PICK_WARN_MSG, "warning");
      return false;
    }

    return true;
  };

  const handleDepartmentChange = async (e) => {
    const deptId = e.target.value;
    setSelectedDepartment(deptId);
    setSelectedDoctor("");

    if (!deptId) {
      setDoctorOptions([]);
      return;
    }

    try {
     
      const { status, response } = await getRequest(
        `${DOCTOR_BY_SPECIALITY}${deptId}`,
      );

      setDoctorOptions(
        status === 200 && Array.isArray(response) ? response : [],
      );
    } catch (error) {
      console.error(FETCH_DATA_ERROR, error);
      setDoctorOptions([]);
    } 
  };

  const handleDoctorChange = (e) => {
    const doctorId = e.target.value;
    setSelectedDoctor(doctorId);
  };

  const handleReasonChange = (e) => {
    const reasonId = e.target.value;
    setSelectedReason(reasonId);
  };

  const fetchCancellationReport = async () => {
    if (!validateDates()) return;

    try {
      setIsSearching(true); // Set searching state to true
      const hospitalId = sessionStorage.getItem("hospitalId");

      const params = new URLSearchParams({
        [REQUEST_PARAM_HOSPITAL_ID]: hospitalId,
        [REQUEST_PARAM_FROM_DATE]: fromDate,
        [REQUEST_PARAM_TO_DATE]: toDate,
        ...(selectedDepartment && { [REQUEST_PARAM_DEPARTMENT_ID]: selectedDepartment }),
        ...(selectedDoctor && { [REQUEST_PARAM_DOCTOR_ID]: selectedDoctor }),
        ...(selectedReason && { [REQUEST_PARAM_CANCELLATION_REASON_ID]: selectedReason }),
      });

      const { status, response } = await getRequest(
        `${GET_CANCELLED_APPOINTMENTS}?${params.toString()}`,
      );
      if (status === 200) {
        const data = Array.isArray(response) ? response : [];
        setReportData(data);
      } else {
        setReportData([]);
      }

      setShowReport(true);
    } catch (error) {
      console.error("Cancellation report error:", error);
      showPopup(DATA_NOT_FOUND_WRT_SELECTION_CRITERIA_WARN_MSG, "error");
      setReportData([]);
      setShowReport(true);
    } finally {
      setIsSearching(false); // Set searching state to false
    }
  };

  const generatePdfReport = async (flag) => {
    if (!validateDates()) return;

    try {
      if (flag === STATUS_D) {
        setIsViewLoading(true);
      } else {
        setIsPrintLoading(true);
      }

      setPdfUrl(null);

      const hospitalId = sessionStorage.getItem("hospitalId");

      const params = new URLSearchParams({
        [REQUEST_PARAM_HOSPITAL_ID]: hospitalId,
        [REQUEST_PARAM_FROM_DATE]: fromDate,
        [REQUEST_PARAM_TO_DATE]: toDate,
        [REQUEST_PARAM_FLAG]: flag
      });

      if (selectedDepartment) {
        params.append(REQUEST_PARAM_DEPARTMENT_ID, selectedDepartment);
      }
      if (selectedDoctor) {
        params.append(REQUEST_PARAM_DOCTOR_ID, selectedDoctor);
      }
      if (selectedReason) {
        params.append(REQUEST_PARAM_CANCELLATION_ID, selectedReason);
      }

      const reportUrl = `${DAILY_CANCELLATION_REPORT_END_URL}?${params.toString()}`;

      const response = await fetch(reportUrl, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.statusText}`);
      }

      const blob = await response.blob();
      const fileURL = window.URL.createObjectURL(blob);

      if (flag === STATUS_D) {
        setPdfUrl(fileURL);
      } else if (flag === STATUS_P) {
        const printWindow = window.open(fileURL);
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      console.error("Error generating PDF", error);
      showPopup(REPORT_GENERATION_ERR_MSG, "error");
    } finally {
      if (flag === STATUS_D) {
        setIsViewLoading(false);
      } else {
        setIsPrintLoading(false);
      }
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchCancellationReport();
  };

  const handleViewReport = () => {
    generatePdfReport(STATUS_D);
  };

  const handlePrintReport = () => {
    generatePdfReport(STATUS_P);
  };

  const handleReset = () => {
    const today = new Date();
    const daysAgo = new Date(today);
    daysAgo.setDate(today.getDate() - DAY_RANGE_FOR_OPD_CANCELLTION_REPORT);

    setFromDate(formatDateForInput(daysAgo));
    setToDate(formatDateForInput(today));
    setSelectedDepartment("");
    setSelectedDoctor("");
    setSelectedReason("");
    setShowReport(false);
    setReportData([]);
    setCurrentPage(1);
    setPdfUrl(null);
  };

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = reportData.slice(indexOfFirst, indexOfLast);

  // Report columns
  const reportColumns = [
    "Patient Name",
    "Mobile Number",
    "Age/Gender",
    "Doctor Name",
    "Department",
    "Appointment Date & Time",
    "Cancellation Date & Time",
    "Cancelled By",
    "Cancellation Reason",
  ];

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
          name={`Daily Cancellation Report`}
        />
      )}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Daily Cancellation Report</h4>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                {/* Date Range */}
                <div className="col-md-3 mb-3">
                  <label className="form-label fw-bold">
                    From Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control mt-1"
                    value={fromDate}
                    onChange={handleFromDateChange}
                    max={formatDateForInput(new Date())}
                  />
                </div>

                <div className="col-md-3 mb-3">
                  <label className="form-label fw-bold">
                    To Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control mt-1"
                    value={toDate}
                    onChange={handleToDateChange}
                    min={fromDate}
                    max={formatDateForInput(new Date())}
                  />
                </div>

                {/* Department Dropdown */}
                <div className="col-md-3 mb-3">
                  <label className="form-label fw-bold">Department</label>
                  <select
                    className="form-select mt-1"
                    value={selectedDepartment}
                    onChange={handleDepartmentChange}
                  >
                    <option value="">All Departments</option>
                    {departmentData.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.departmentName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Doctor Dropdown */}
                <div className="col-md-3 mb-3">
                  <label className="form-label fw-bold">Doctor</label>
                  <select
                    className="form-select mt-1"
                    value={selectedDoctor}
                    onChange={handleDoctorChange}
                    disabled={!selectedDepartment}
                  >
                    <option value="">All Doctors</option>
                    {doctorOptions.map((doctor) => (
                      <option key={doctor.userId} value={doctor.userId}>
                        {`${doctor.firstName} ${doctor.middleName || ""} ${doctor.lastName || ""}`.trim()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cancellation Reason Dropdown */}
                <div className="col-md-3 mb-3">
                  <label className="form-label fw-bold">Select Reason</label>
                  <select
                    className="form-select mt-1"
                    value={selectedReason}
                    onChange={handleReasonChange}
                  >
                    <option value="">All Reasons</option>
                    {reasonOptions.map((reason) => (
                      <option key={reason.reasonId} value={reason.reasonId}>
                        {reason.reasonName}
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
                      disabled={isSearching || isViewLoading || isPrintLoading}
                    >
                      {isSearching ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
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
                      disabled={isSearching || isViewLoading || isPrintLoading}
                    >
                      Reset
                    </button>
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      onClick={handleViewReport}
                      disabled={isSearching || isViewLoading || isPrintLoading}
                    >
                      {isViewLoading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Generating...
                        </>
                      ) : (
                        <>
                          <i className="fa fa-eye me-2"></i>
                          VIEW/DOWNLOAD
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-warning btn-sm"
                      onClick={handlePrintReport}
                      disabled={isSearching || isViewLoading || isPrintLoading}
                    >
                      {isPrintLoading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Printing...
                        </>
                      ) : (
                        <>
                          <i className="fa fa-print me-2"></i>
                          PRINT
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {loading && (
                <div className="text-center py-4">
                  <LoadingScreen />
                </div>
              )}

              {!isSearching && showReport && (
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="card-title mb-0">
                          Daily Cancellation Report
                        </h5>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-bordered table-hover">
                            <thead>
                              <tr>
                                {reportColumns.map((column, index) => (
                                  <th key={index}>{column}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.length > 0 ? (
                                currentItems.map((row, index) => (
                                  <tr key={index}>
                                    <td>{row.patientName}</td>
                                    <td>{row.mobileNumber}</td>
                                    <td>{row.age}</td>
                                    <td>{row.doctorName}</td>
                                    <td>{row.departmentName}</td>
                                    <td>{formatAppointmentDateTime(row.appointmentDate, row.appointmentTime)}</td>
                                    <td>{formatDateTimeWithoutTZ(row.cancellationDateTime)}</td>
                                    <td>{row.cancelledBy}</td>
                                    <td>{row.cancellationReason}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td
                                    colSpan={reportColumns.length}
                                    className="text-center py-4"
                                  >
                                    No cancellation records found for the
                                    selected criteria
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

export default DailyCancellationReport;