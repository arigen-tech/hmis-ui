import { useState } from "react";
import Popup from "../../../Components/popup";

const OPDRegister = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [department, setDepartment] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [gender, setGender] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [isPrintLoading, setIsPrintLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);

  // Static dropdown options
  const departmentOptions = [
    { id: 1, name: "General Medicine" },
    { id: 2, name: "Pediatrics" },
    { id: 3, name: "Orthopedics" },
    { id: 4, name: "Cardiology" },
    { id: 5, name: "Dermatology" }
  ];

  const doctorOptions = [
    { id: 1, name: "Dr. Rajesh Kumar" },
    { id: 2, name: "Dr. Priya Singh" },
    { id: 3, name: "Dr. Amit Sharma" },
    { id: 4, name: "Dr. Sneha Patel" },
    { id: 5, name: "Dr. Vikram Malhotra" }
  ];

  const genderOptions = [
    { id: 1, name: "Male" },
    { id: 2, name: "Female" },
    { id: 3, name: "Other" }
  ];

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
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
    const selectedDate = e.target.value;
    const today = getTodayDate();

    if (selectedDate > today) {
      showPopup("From date cannot be in the future", "warning");
      return;
    }

    setFromDate(selectedDate);

    if (toDate && selectedDate > toDate) {
      setToDate("");
    }
  };

  const handleToDateChange = (e) => {
    const selectedDate = e.target.value;
    const today = getTodayDate();

    if (selectedDate > today) {
      showPopup("To date cannot be in the future", "warning");
      return;
    }

    if (fromDate && selectedDate < fromDate) {
      showPopup("To date cannot be earlier than From date", "warning");
      return;
    }

    setToDate(selectedDate);
  };

  const validateDates = () => {
    if (!fromDate || !toDate) {
      showPopup("Please select both From Date and To Date", "warning");
      return false;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      showPopup("To Date cannot be earlier than From Date", "warning");
      return false;
    }

    return true;
  };

  const handleSearch = () => {
    if (!validateDates()) return;
    
    setIsSearching(true);
    // Simulate search
    setTimeout(() => {
      setIsSearching(false);
      showPopup("Search completed successfully!", "success");
    }, 1500);
  };

  const handleReset = () => {
    setFromDate("");
    setToDate("");
    setDepartment("");
    setDoctorName("");
    setGender("");
    showPopup("Filters reset successfully", "info");
  };

  const handleViewReport = () => {
    if (!validateDates()) return;
    
    setIsViewLoading(true);
    // Simulate PDF generation
    setTimeout(() => {
      setIsViewLoading(false);
      showPopup("Report generated successfully!", "success");
    }, 1500);
  };

  const handlePrintReport = () => {
    if (!validateDates()) return;
    
    setIsPrintLoading(true);
    // Simulate print
    setTimeout(() => {
      setIsPrintLoading(false);
      showPopup("Report sent to printer successfully!", "success");
    }, 1500);
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

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">
                OPD Register
              </h4>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-4">
                  <label className="form-label fw-bold">Department </label>
                  <select 
                    className="form-select" 
                    value={department} 
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    <option value="">Select Department</option>
                    {departmentOptions.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold">Doctor Name </label>
                  <select 
                    className="form-select" 
                    value={doctorName} 
                    onChange={(e) => setDoctorName(e.target.value)}
                  >
                    <option value="">Select Doctor</option>
                    {doctorOptions.map((doctor) => (
                      <option key={doctor.id} value={doctor.name}>
                        {doctor.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold">Gender</label>
                  <select 
                    className="form-select" 
                    value={gender} 
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="">Select Gender</option>
                    {genderOptions.map((g) => (
                      <option key={g.id} value={g.name}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-bold">From Date <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    max={getTodayDate()}
                    onChange={handleFromDateChange}
                  />
                </div>
                
                <div className="col-md-6">
                  <label className="form-label fw-bold">To Date <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    min={fromDate}
                    max={getTodayDate()}
                    onChange={handleToDateChange}
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-12 d-flex justify-content-end">
                  
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={handleViewReport}
                      disabled={isSearching || isViewLoading || isPrintLoading}
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
                      disabled={isSearching || isViewLoading || isPrintLoading}
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OPDRegister;