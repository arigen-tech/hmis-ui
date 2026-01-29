import { useState, useEffect } from "react";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import Popup from "../../../Components/popup";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";

const DailyCancellationReport = () => {
  // State for filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  
  // State for dropdowns
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [doctorOptions, setDoctorOptions] = useState([]);
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

  // Mock data
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

  const cancellationReasons = [
    { id: 1, reason: "Patient Unwell" },
    { id: 2, reason: "Doctor Unavailable" },
    { id: 3, reason: "Emergency" },
    { id: 4, reason: "Personal Reasons" },
    { id: 5, reason: "Weather Conditions" },
    { id: 6, reason: "Travel Issues" },
    { id: 7, reason: "Financial Constraints" },
    { id: 8, reason: "Found Alternative Doctor" },
    { id: 9, reason: "Hospital Issues" },
    { id: 10, reason: "Others" }
  ];

  // Sample report data
  const sampleCancellationData = [
    {
      id: 1,
      patientName: "Rahul Sharma",
      mobileNumber: "9876543210",
      ageGender: "32 Y 5M / M",
      doctorName: "Dr. Anil Sharma",
      department: "Cardiology",
      appointmentDateTime: "15-Jan-2025 10:30 AM",
      cancellationDateTime: "14-Jan-2025 04:15 PM",
      cancelledBy: "Patient",
      cancellationReason: "Patient Unwell"
    },
    {
      id: 2,
      patientName: "Priya Patel",
      mobileNumber: "8765432109",
      ageGender: "28 Y / F",
      doctorName: "Dr. Sunita Reddy",
      department: "Neurology",
      appointmentDateTime: "16-Jan-2025 02:00 PM",
      cancellationDateTime: "15-Jan-2025 11:30 AM",
      cancelledBy: "Patient",
      cancellationReason: "Travel Issues"
    },
    {
      id: 3,
      patientName: "Amit Kumar",
      mobileNumber: "7654321098",
      ageGender: "45 Y 2M / M",
      doctorName: "Dr. Amit Gupta",
      department: "Orthopedics",
      appointmentDateTime: "17-Jan-2025 11:00 AM",
      cancellationDateTime: "16-Jan-2025 09:45 AM",
      cancelledBy: "Hospital",
      cancellationReason: "Doctor Unavailable"
    },
    {
      id: 4,
      patientName: "Neha Singh",
      mobileNumber: "6543210987",
      ageGender: "26 Y 8M / F",
      doctorName: "Dr. Priya Patel",
      department: "Cardiology",
      appointmentDateTime: "18-Jan-2025 03:30 PM",
      cancellationDateTime: "17-Jan-2025 05:20 PM",
      cancelledBy: "Patient",
      cancellationReason: "Personal Reasons"
    },
    {
      id: 5,
      patientName: "Rajesh Verma",
      mobileNumber: "5432109876",
      ageGender: "52 Y / M",
      doctorName: "Dr. Rajesh Kumar",
      department: "Neurology",
      appointmentDateTime: "19-Jan-2025 09:15 AM",
      cancellationDateTime: "18-Jan-2025 02:45 PM",
      cancelledBy: "Patient",
      cancellationReason: "Emergency"
    },
    {
      id: 6,
      patientName: "Sunita Reddy",
      mobileNumber: "4321098765",
      ageGender: "35 Y 3M / F",
      doctorName: "Dr. Vikram Joshi",
      department: "Pediatrics",
      appointmentDateTime: "20-Jan-2025 01:45 PM",
      cancellationDateTime: "19-Jan-2025 10:30 AM",
      cancelledBy: "Hospital",
      cancellationReason: "Hospital Issues"
    },
    {
      id: 7,
      patientName: "Vikram Singh",
      mobileNumber: "3210987654",
      ageGender: "40 Y 6M / M",
      doctorName: "Dr. Neha Singh",
      department: "Orthopedics",
      appointmentDateTime: "21-Jan-2025 04:00 PM",
      cancellationDateTime: "20-Jan-2025 03:15 PM",
      cancelledBy: "Patient",
      cancellationReason: "Financial Constraints"
    },
    {
      id: 8,
      patientName: "Anjali Desai",
      mobileNumber: "2109876543",
      ageGender: "29 Y / F",
      doctorName: "Dr. Meera Nair",
      department: "Pediatrics",
      appointmentDateTime: "22-Jan-2025 11:30 AM",
      cancellationDateTime: "21-Jan-2025 08:45 AM",
      cancelledBy: "Patient",
      cancellationReason: "Weather Conditions"
    },
    {
      id: 9,
      patientName: "Sanjay Gupta",
      mobileNumber: "1098765432",
      ageGender: "48 Y 4M / M",
      doctorName: "Dr. Sanjay Verma",
      department: "General Medicine",
      appointmentDateTime: "23-Jan-2025 02:15 PM",
      cancellationDateTime: "22-Jan-2025 01:30 PM",
      cancelledBy: "Patient",
      cancellationReason: "Found Alternative Doctor"
    },
    {
      id: 10,
      patientName: "Meera Nair",
      mobileNumber: "0987654321",
      ageGender: "31 Y 7M / F",
      doctorName: "Dr. Anjali Desai",
      department: "General Medicine",
      appointmentDateTime: "24-Jan-2025 10:00 AM",
      cancellationDateTime: "23-Jan-2025 06:45 PM",
      cancelledBy: "Hospital",
      cancellationReason: "Others"
    },
    {
      id: 11,
      patientName: "Kiran Patel",
      mobileNumber: "9876543211",
      ageGender: "25 Y 2M / M",
      doctorName: "Dr. Anil Sharma",
      department: "Cardiology",
      appointmentDateTime: "25-Jan-2025 03:45 PM",
      cancellationDateTime: "24-Jan-2025 11:20 AM",
      cancelledBy: "Patient",
      cancellationReason: "Personal Reasons"
    },
    {
      id: 12,
      patientName: "Ritu Sharma",
      mobileNumber: "8765432110",
      ageGender: "37 Y / F",
      doctorName: "Dr. Sunita Reddy",
      department: "Neurology",
      appointmentDateTime: "26-Jan-2025 09:30 AM",
      cancellationDateTime: "25-Jan-2025 04:15 PM",
      cancelledBy: "Patient",
      cancellationReason: "Patient Unwell"
    }
  ];

  // Initialize dates on component mount
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
    setReasonOptions(cancellationReasons);
  }, []);

  // Filter doctors when department changes
  useEffect(() => {
    if (selectedDepartment) {
      const filtered = doctorOptions.filter(doctor => 
        doctor.departmentId === parseInt(selectedDepartment)
      );
      setFilteredDoctorOptions(filtered);
      // Reset doctor selection if current doctor doesn't belong to selected department
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
    
    // Validate date range doesn't exceed 6 months
    if (toDate) {
      const from = new Date(newFromDate);
      const to = new Date(toDate);
      const monthsDiff = (to.getFullYear() - from.getFullYear()) * 12 + 
                         (to.getMonth() - from.getMonth());
      
      if (monthsDiff > 6) {
        showPopup("Date range cannot exceed 6 months", "warning");
        // Adjust to date to be exactly 6 months from from date
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
    
    // Validate date range doesn't exceed 6 months
    if (fromDate) {
      const from = new Date(fromDate);
      const to = new Date(newToDate);
      const monthsDiff = (to.getFullYear() - from.getFullYear()) * 12 + 
                         (to.getMonth() - from.getMonth());
      
      if (monthsDiff > 6) {
        showPopup("Date range cannot exceed 6 months", "warning");
        // Adjust from date to be exactly 6 months before to date
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

  const handleReasonChange = (e) => {
    const reasonId = e.target.value;
    setSelectedReason(reasonId);
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

  const fetchCancellationReport = async () => {
    try {
      setIsGenerating(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let data = sampleCancellationData;
      
      // Apply department filter
      if (selectedDepartment) {
        const deptName = departments.find(d => d.id === parseInt(selectedDepartment))?.name;
        data = data.filter(item => item.department === deptName);
      }
      
      // Apply doctor filter
      if (selectedDoctor) {
        const doctorName = doctors.find(d => d.id === parseInt(selectedDoctor))?.name;
        data = data.filter(item => item.doctorName === doctorName);
      }
      
      // Apply reason filter
      if (selectedReason) {
        const reasonText = cancellationReasons.find(r => r.id === parseInt(selectedReason))?.reason;
        data = data.filter(item => item.cancellationReason === reasonText);
      }
      
      setReportData(data);
      setShowReport(true);
      
    } catch (error) {
      console.error("Error fetching cancellation report:", error);
      showPopup("Failed to fetch cancellation report", "error");
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
      params.append('fromDate', fromDate);
      params.append('toDate', toDate);
      
      if (selectedDepartment) {
        params.append('departmentId', selectedDepartment);
      }
      if (selectedDoctor) {
        params.append('doctorId', selectedDoctor);
      }
      if (selectedReason) {
        params.append('reasonId', selectedReason);
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
    if (!validateFilters()) return;
    
    fetchCancellationReport();
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
    "Cancellation Reason"
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
                  <label className="form-label fw-bold">From Date <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className="form-control mt-1"
                    value={fromDate}
                    onChange={handleFromDateChange}
                    max={toDate}
                  />
                </div>
                
                <div className="col-md-3 mb-3">
                  <label className="form-label fw-bold">To Date <span className="text-danger">*</span></label>
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
                    {departmentOptions.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
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
                      <option key={reason.id} value={reason.id}>
                        {reason.reason}
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
                                    <td>{row.ageGender}</td>
                                    <td>{row.doctorName}</td>
                                    <td>{row.department}</td>
                                    <td>{row.appointmentDateTime}</td>
                                    <td>{row.cancellationDateTime}</td>
                                    <td>{row.cancelledBy}</td>
                                    <td>{row.cancellationReason}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={reportColumns.length} className="text-center py-4">
                                    No cancellation records found for the selected criteria
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