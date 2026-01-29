import { useState, useEffect } from "react";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import Popup from "../../../Components/popup";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";

const AppointmentSummaryReport = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [reportType, setReportType] = useState("summary"); // summary, doctor, department
  
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [doctorOptions, setDoctorOptions] = useState([]);
  const [filteredDoctorOptions, setFilteredDoctorOptions] = useState([]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [popupMessage, setPopupMessage] = useState(null);
  const [reportData, setReportData] = useState([]);
  
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [isPrintLoading, setIsPrintLoading] = useState(false);

  const departments = [
    { id: 1, name: "Cardiology", code: "CARD" },
    { id: 2, name: "Neurology", code: "NEURO" },
    { id: 3, name: "Orthopedics", code: "ORTHO" },
    { id: 4, name: "Pediatrics", code: "PED" },
    { id: 5, name: "Dermatology", code: "DERMA" },
    { id: 6, name: "Ophthalmology", code: "OPHTHA" },
    { id: 7, name: "General Medicine", code: "GM" },
    { id: 8, name: "ENT", code: "ENT" },
    { id: 9, name: "Gynecology", code: "GYNO" },
    { id: 10, name: "Urology", code: "URO" }
  ];

  const doctors = [
    { id: 1, name: "Dr. Anil Sharma", departmentId: 1, department: "Cardiology" },
    { id: 2, name: "Dr. Priya Patel", departmentId: 1, department: "Cardiology" },
    { id: 3, name: "Dr. Rajesh Kumar", departmentId: 2, department: "Neurology" },
    { id: 4, name: "Dr. Sunita Reddy", departmentId: 2, department: "Neurology" },
    { id: 5, name: "Dr. Amit Gupta", departmentId: 3, department: "Orthopedics" },
    { id: 6, name: "Dr. Neha Singh", departmentId: 3, department: "Orthopedics" },
    { id: 7, name: "Dr. Vikram Joshi", departmentId: 4, department: "Pediatrics" },
    { id: 8, name: "Dr. Meera Nair", departmentId: 4, department: "Pediatrics" },
    { id: 9, name: "Dr. Sanjay Verma", departmentId: 7, department: "General Medicine" },
    { id: 10, name: "Dr. Anjali Desai", departmentId: 7, department: "General Medicine" }
  ];

  const sampleSummaryData = [
    { id: 1, date: "01-Jan-2025", booked: 85, completed: 72, cancelled: 8, noShow: 5 },
    { id: 2, date: "02-Jan-2025", booked: 92, completed: 80, cancelled: 7, noShow: 5 },
    { id: 3, date: "03-Jan-2025", booked: 78, completed: 68, cancelled: 6, noShow: 4 },
    { id: 4, date: "04-Jan-2025", booked: 105, completed: 92, cancelled: 9, noShow: 4 },
    { id: 5, date: "05-Jan-2025", booked: 88, completed: 75, cancelled: 8, noShow: 5 },
    { id: 6, date: "06-Jan-2025", booked: 95, completed: 82, cancelled: 8, noShow: 5 },
    { id: 7, date: "07-Jan-2025", booked: 82, completed: 70, cancelled: 7, noShow: 5 },
    { id: 8, date: "08-Jan-2025", booked: 110, completed: 98, cancelled: 8, noShow: 4 }
  ];

  const sampleDoctorWiseData = [
    { id: 1, doctorName: "Dr. John Smith", booked: 160, completed: 145, cancelled: 7, noShow: 8 },
    { id: 2, doctorName: "Dr. Sarah Johnson", booked: 140, completed: 125, cancelled: 5, noShow: 10 },
    { id: 3, doctorName: "Dr. Michael Brown", booked: 180, completed: 160, cancelled: 10, noShow: 10 },
    { id: 4, doctorName: "Dr. Emily Davis", booked: 120, completed: 105, cancelled: 8, noShow: 7 },
    { id: 5, doctorName: "Dr. Robert Wilson", booked: 200, completed: 180, cancelled: 12, noShow: 8 },
    { id: 6, doctorName: "Dr. Lisa Anderson", booked: 150, completed: 135, cancelled: 6, noShow: 9 }
  ];

  const sampleDepartmentWiseData = [
    { id: 1, department: "OPD", booked: 80, completed: 65, cancelled: 7, noShow: 8 },
    { id: 2, department: "Dental", booked: 40, completed: 30, cancelled: 3, noShow: 7 },
    { id: 3, department: "Cardiology", booked: 120, completed: 105, cancelled: 8, noShow: 7 },
    { id: 4, department: "Orthopedics", booked: 90, completed: 75, cancelled: 10, noShow: 5 },
    { id: 5, department: "Pediatrics", booked: 110, completed: 95, cancelled: 6, noShow: 9 },
    { id: 6, department: "Gynecology", booked: 70, completed: 60, cancelled: 5, noShow: 5 },
    { id: 7, department: "Neurology", booked: 85, completed: 70, cancelled: 8, noShow: 7 },
    { id: 8, department: "Dermatology", booked: 60, completed: 50, cancelled: 4, noShow: 6 }
  ];

  useEffect(() => {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    setFromDate(formatDate(sixMonthsAgo));
    setToDate(formatDate(today));
    setDepartmentOptions(departments);
    setDoctorOptions(doctors);
    setFilteredDoctorOptions(doctors);
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      const filtered = doctorOptions.filter(doctor => 
        doctor.departmentId === parseInt(selectedDepartment)
      );
      setFilteredDoctorOptions(filtered);
      if (selectedDoctor && !filtered.some(d => d.id === parseInt(selectedDoctor))) {
        setSelectedDoctor("");
      }
    } else {
      setFilteredDoctorOptions(doctorOptions);
    }
  }, [selectedDepartment, doctorOptions, selectedDoctor]);

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
      
      if (monthsDiff > 6) {
        showPopup("Date range cannot exceed 6 months", "warning");
        const maxToDate = new Date(from);
        maxToDate.setMonth(from.getMonth() + 6);
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
      
      if (monthsDiff > 6) {
        showPopup("Date range cannot exceed 6 months", "warning");
        const minFromDate = new Date(to);
        minFromDate.setMonth(to.getMonth() - 6);
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
  };

  const handleDoctorChange = (e) => {
    const doctorId = e.target.value;
    setSelectedDoctor(doctorId);
  };

  const validateFilters = () => {
    if (!fromDate || !toDate) {
      showPopup("Please select both from and to dates", "warning");
      return false;
    }
    
    const from = new Date(fromDate);
    const to = new Date(toDate);
    
    if (from > to) {
      showPopup("From date cannot be after to date", "warning");
      return false;
    }
    
    const monthsDiff = (to.getFullYear() - from.getFullYear()) * 12 + 
                       (to.getMonth() - from.getMonth());
    
    if (monthsDiff > 6) {
      showPopup("Date range cannot exceed 6 months", "warning");
      return false;
    }
    
    return true;
  };

  const fetchAppointmentSummary = async () => {
    try {
      setIsGenerating(true);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let data = [];
      
      switch(reportType) {
        case "summary":
          data = sampleSummaryData;
          break;
        case "doctor":
          data = sampleDoctorWiseData;
          break;
        case "department":
          data = sampleDepartmentWiseData;
          break;
        default:
          data = sampleSummaryData;
      }
      
      if (selectedDepartment && reportType === "doctor") {
        const filtered = data.filter(item => {
          const doctor = doctors.find(d => d.name === item.doctorName);
          return doctor && doctor.departmentId === parseInt(selectedDepartment);
        });
        data = filtered;
      }
      
      setReportData(data);
      setShowReport(true);
      
    } catch (error) {
      console.error("Error fetching appointment summary:", error);
      showPopup("Failed to fetch appointment summary", "error");
      setReportData([]);
      setShowReport(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePdfReport = async (flag = "D") => {
    if (!validateFilters()) return;

    if (flag === "D") {
      setIsViewLoading(true);
    } else if (flag === "P") {
      setIsPrintLoading(true);
    }
    
    setPdfUrl(null);

    try {
      const params = new URLSearchParams();
      params.append('flag', flag);
      params.append('reportType', reportType);
      params.append('fromDate', fromDate);
      params.append('toDate', toDate);
      
      if (selectedDepartment) {
        params.append('departmentId', selectedDepartment);
      }
      if (selectedDoctor) {
        params.append('doctorId', selectedDoctor);
      }

      const url = `/reports/appointmentSummaryReport?${params.toString()}`;

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
    if (!validateFilters()) return;
    
    fetchAppointmentSummary();
    setCurrentPage(1);
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
    setReportType("summary");
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
        return ["Date", "Booked", "Completed", "Cancelled", "No-Show"];
      case "doctor":
        return ["Doctor Name", "Booked", "Completed", "Cancelled", "No-Show"];
      case "department":
        return ["Department", "Booked", "Completed", "Cancelled", "No-Show"];
      default:
        return ["Date", "Booked", "Completed", "Cancelled", "No-Show"];
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
                        {dept.name}
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
                    disabled={!selectedDepartment && doctorOptions.length > 0}
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
                  <label className="form-label fw-bold d-block mb-2">Report Type</label>
                  <div className="d-flex flex-wrap gap-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="reportType"
                        id="summary"
                        value="summary"
                        checked={reportType === "summary"}
                        onChange={(e) => setReportType(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="summary">
                        Summary
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="reportType"
                        id="doctor"
                        value="doctor"
                        checked={reportType === "doctor"}
                        onChange={(e) => setReportType(e.target.value)}
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
                        onChange={(e) => setReportType(e.target.value)}
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
                    disabled={isGenerating}
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
                  
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={handleViewReport}
                      disabled={isGenerating || isViewLoading || !fromDate || !toDate}
                    >
                      {isViewLoading ? (
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
                      className="btn btn-warning"
                      onClick={handlePrintReport}
                      disabled={isGenerating || isPrintLoading || !fromDate || !toDate}
                    >
                      {isPrintLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Printing...
                        </>
                      ) : (
                        "Print Report"
                      )}
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
                          Appointment Summary Report - {reportType.charAt(0).toUpperCase() + reportType.slice(1)}
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
                                    {reportType === "summary" && (
                                      <>
                                        <td>{row.date}</td>
                                        <td className="text-end">{row.booked}</td>
                                        <td className="text-end">{row.completed}</td>
                                        <td className="text-end">{row.cancelled}</td>
                                        <td className="text-end">{row.noShow}</td>
                                      </>
                                    )}
                                    {reportType === "doctor" && (
                                      <>
                                        <td>{row.doctorName}</td>
                                        <td className="text-end">{row.booked}</td>
                                        <td className="text-end">{row.completed}</td>
                                        <td className="text-end">{row.cancelled}</td>
                                        <td className="text-end">{row.noShow}</td>
                                      </>
                                    )}
                                    {reportType === "department" && (
                                      <>
                                        <td>{row.department}</td>
                                        <td className="text-end">{row.booked}</td>
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