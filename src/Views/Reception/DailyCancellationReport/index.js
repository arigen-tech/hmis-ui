import { useState, useEffect } from "react";
import LoadingScreen from "../../../Components/Loading";
import Pagination, {
  DEFAULT_ITEMS_PER_PAGE,
} from "../../../Components/Pagination";
import Popup from "../../../Components/popup";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";
import {
  ALL_DEPARTMENT,
  DOCTOR_BY_SPECIALITY,
  GET_ALL_REASONS,
  GET_CANCELLED_APPOINTMENTS,
} from "../../../config/apiConfig";
import { getRequest } from "../../../service/apiService";
import {
  DEPARTMENT_CODE_OPD,
  FETCH_CANCELLATION_REASONS_ERROR_LOG,
  FETCH_DATA_ERROR,
  UNEXPECTED_API_RESPONSE_ERR,
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
  const [filteredDoctorOptions, setFilteredDoctorOptions] = useState([]);
  const [reasonOptions, setReasonOptions] = useState([]);

  // UI states
  const [isGenerating, setIsGenerating] = useState(false);
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
  const [datePart, timePart] = isoString.split("T");
  if (!datePart || !timePart) return isoString;
  const cleanTime = timePart.split(".")[0];
  return `${datePart} ${cleanTime.substring(0, 5)}`;
};

  useEffect(() => {
    fetchDepartment();
    fetchCancellationReasons();
  }, []);
  // Initialize dates on component mount
  useEffect(() => {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // setFromDate(formatDate(sixMonthsAgo));
    // setToDate(formatDate(today));
  }, []);

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
      const data = await getRequest(`${ALL_DEPARTMENT}/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        const filteredDepartments = data.response.filter(
          (dept) => dept.departmentTypeId === DEPARTMENT_CODE_OPD,
        );
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
      const data = await getRequest(`${GET_ALL_REASONS}/1`);

      if (data.status === 200 && Array.isArray(data.response)) {
        const activeReasons = data.response.filter(
          (reason) =>
            reason &&
            (reason.status === "Y" ||
              reason.status === true ||
              reason.status === 1),
        );

        setReasonOptions(activeReasons);
      } else {
        console.error("Unexpected API response:", data);
        setReasonOptions([]);
      }
    } catch (error) {
      console.error(FETCH_CANCELLATION_REASONS_ERROR_LOG, error);
      setReasonOptions([]);
    }
  };

  const handleFromDateChange = (e) => {
    const newFromDate = e.target.value;
    setFromDate(newFromDate);

    // Validate date range doesn't exceed 6 months
    if (toDate) {
      const from = new Date(newFromDate);
      const to = new Date(toDate);
      const monthsDiff =
        (to.getFullYear() - from.getFullYear()) * 12 +
        (to.getMonth() - from.getMonth());

      if (monthsDiff > 6) {
        showPopup("Date range cannot exceed 6 months", "warning");
        // Adjust to date to be exactly 6 months from from date
        const maxToDate = new Date(from);
        maxToDate.setMonth(from.getMonth() + 6);
        const year = maxToDate.getFullYear();
        const month = String(maxToDate.getMonth() + 1).padStart(2, "0");
        const day = String(maxToDate.getDate()).padStart(2, "0");
        setToDate(`${year}-${month}-${day}`);
      }
    }
  };

  const handleToDateChange = (e) => {
    const newToDate = e.target.value;
    setToDate(newToDate);

    // Validate date range doesn't exceed 6 months
    if (fromDate) {
      const from = new Date(fromDate);
      const to = new Date(newToDate);
      const monthsDiff =
        (to.getFullYear() - from.getFullYear()) * 12 +
        (to.getMonth() - from.getMonth());

      if (monthsDiff > 6) {
        showPopup("Date range cannot exceed 6 months", "warning");
        // Adjust from date to be exactly 6 months before to date
        const minFromDate = new Date(to);
        minFromDate.setMonth(to.getMonth() - 6);
        const year = minFromDate.getFullYear();
        const month = String(minFromDate.getMonth() + 1).padStart(2, "0");
        const day = String(minFromDate.getDate()).padStart(2, "0");
        setFromDate(`${year}-${month}-${day}`);
      }
    }
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
      setLoading(true);
      const { status, response } = await getRequest(
        `${DOCTOR_BY_SPECIALITY}${deptId}`,
      );

      setDoctorOptions(
        status === 200 && Array.isArray(response) ? response : [],
      );
    } catch (error) {
      console.error(FETCH_DATA_ERROR, error);
      setDoctorOptions([]);
    } finally {
      setLoading(false);
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

  const validateFilters = () => {

    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (from > to) {
      showPopup("From date cannot be after to date", "warning");
      return false;
    }

    const monthsDiff =
      (to.getFullYear() - from.getFullYear()) * 12 +
      (to.getMonth() - from.getMonth());

    if (monthsDiff > 6) {
      showPopup("Date range cannot exceed 6 months", "warning");
      return false;
    }

    return true;
  };

  const fetchCancellationReport = async () => {
    try {
      setIsGenerating(true);
      const hospitalId = sessionStorage.getItem("hospitalId");

      const params = new URLSearchParams({
        hospitalId: hospitalId,
        ...(selectedDepartment && { departmentId: selectedDepartment }),
        ...(selectedDoctor && { doctorId: selectedDoctor }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
        ...(selectedReason && { cancellationReasonId: selectedReason }),
      });

      const { status, response, message } = await getRequest(
        `${GET_CANCELLED_APPOINTMENTS}?${params.toString()}`,
      );
      if (status === 200) {
        const data = Array.isArray(response) ? response : [];
        setReportData(data);

        if (data.length === 0) {
          showPopup("No cancellation records found", "info");
        }
      } else {
        showPopup(message || "Failed to fetch report", "error");
        setReportData([]);
      }

      setShowReport(true);
    } catch (error) {
      console.error("Cancellation report error:", error);
      showPopup("Something went wrong while fetching report", "error");
      setReportData([]);
      setShowReport(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePdfReport = async (flag = "D") => {
    //if (!validateFilters()) return;

    if (flag === "D") {
      setIsViewLoading(true);
    } else if (flag === "P") {
      setIsPrintLoading(true);
    }

    setPdfUrl(null);

    try {
      const params = new URLSearchParams();
      params.append("flag", flag);
      params.append("fromDate", fromDate);
      params.append("toDate", toDate);

      if (selectedDepartment) {
        params.append("departmentId", selectedDepartment);
      }
      if (selectedDoctor) {
        params.append("doctorId", selectedDoctor);
      }
      if (selectedReason) {
        params.append("reasonId", selectedReason);
      }

      const url = `/reports/dailyCancellationReport?${params.toString()}`;

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
        const blob = await response.blob();
        const fileURL = window.URL.createObjectURL(blob);
        setPdfUrl(fileURL);
      } else if (flag === "P") {
        const blob = await response.blob();
        const fileURL = window.URL.createObjectURL(blob);
        const printWindow = window.open(fileURL);
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      console.error("Error generating PDF", error);
      showPopup("Failed to generate report", "error");
    } finally {
      if (flag === "D") {
        setIsViewLoading(false);
      } else if (flag === "P") {
        setIsPrintLoading(false);
      }
    }
  };

  const handleSearch = () => {
    console.log("Search clicked");
    // console.log("Validation result:", validateFilters());
    // if (!validateFilters()) return;
    setCurrentPage(1);
    fetchCancellationReport();
  };

  const handleViewReport = () => {
    generatePdfReport("D");
  };

  const handlePrintReport = () => {
    generatePdfReport("P");
  };

  const handleReset = () => {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    const formatDate = (date) => date.toISOString().split("T")[0];

    setFromDate(formatDate(sixMonthsAgo));
    setToDate(formatDate(today));
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
                    From Date <span className="text-danger"></span>
                  </label>
                  <input
                    type="date"
                    className="form-control mt-1"
                    value={fromDate}
                    onChange={handleFromDateChange}
                    max={toDate}
                  />
                </div>

                <div className="col-md-3 mb-3">
                  <label className="form-label fw-bold">
                    To Date <span className="text-danger"></span>
                  </label>
                  <input
                    type="date"
                    className="form-control mt-1"
                    value={toDate}
                    onChange={handleToDateChange}
                    min={fromDate}
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
                      disabled={isGenerating}
                    >
                      Search
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleReset}
                      disabled={isGenerating}
                    >
                      Reset
                    </button>
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={handleViewReport}
                      disabled={
                        isGenerating || isViewLoading 
                      }
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
                        "View Report"
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-warning"
                      onClick={handlePrintReport}
                      disabled={
                        isGenerating || isPrintLoading
                      }
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
                                    <td>{row.appointmentDate} {row.appointmentTime}</td>
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
