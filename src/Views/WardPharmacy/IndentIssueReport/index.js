import { useState } from "react";

const MedicineIssueRegister = () => {
  const [department, setDepartment] = useState("");
  const [drugName, setDrugName] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

  // Sample departments where indent is applicable
  const departments = [
    { value: "", label: "Select Department" },
    { value: "emergency", label: "Emergency Department" },
    { value: "icu", label: "Intensive Care Unit" },
    { value: "surgery", label: "Surgery Department" },
    { value: "pediatrics", label: "Pediatrics Department" },
    { value: "cardiology", label: "Cardiology Department" },
    { value: "orthopedics", label: "Orthopedics Department" },
    { value: "pharmacy", label: "Pharmacy Department" }
  ];

  const handleGeneratePDF = () => {
    if (!fromDate || !toDate) {
      alert("Please select both From Date and To Date");
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      alert("From Date cannot be later than To Date");
      return;
    }

    if (new Date(fromDate) > new Date() || new Date(toDate) > new Date()) {
      alert("Dates cannot be in the future");
      return;
    }

    setIsGeneratingPDF(true);
    
    // Simulate PDF generation delay
    setTimeout(() => {
      alert("PDF report generated successfully!");
      setIsGeneratingPDF(false);
    }, 1500);
  };

  const handleGenerateExcel = () => {
    if (!fromDate || !toDate) {
      alert("Please select both From Date and To Date");
      return;
    }

    setIsGeneratingExcel(true);
    
    // Simulate Excel generation delay
    setTimeout(() => {
      alert("Excel report generated successfully!");
      setIsGeneratingExcel(false);
    }, 1500);
  };

  const handleFromDateChange = (e) => {
    const selectedDate = e.target.value;
    const today = new Date().toISOString().split('T')[0];

    if (selectedDate > today) {
      alert("From date cannot be in the future");
      return;
    }

    setFromDate(selectedDate);

    // Reset To Date if it's now invalid
    if (toDate && selectedDate > toDate) {
      setToDate("");
    }
  };

  const handleToDateChange = (e) => {
    const selectedDate = e.target.value;
    const today = new Date().toISOString().split('T')[0];

    if (selectedDate > today) {
      alert("To date cannot be in the future");
      return;
    }

    if (fromDate && selectedDate < fromDate) {
      alert("To date cannot be earlier than From date");
      return;
    }

    setToDate(selectedDate);
  };

  const handleToDateFocus = (e) => {
    if (!fromDate) {
      e.preventDefault();
      e.target.blur();
      alert("Please select From Date first");
    }
  };

  const handleReset = () => {
    setDepartment("");
    setDrugName("");
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">
                Medicine Issue Register
              </h4>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-3">
                  <label className="form-label fw-bold">Department</label>
                  <select
                    className="form-select"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    {departments.map((dept) => (
                      <option key={dept.value} value={dept.value}>
                        {dept.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Drug Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={drugName}
                    onChange={(e) => setDrugName(e.target.value)}
                    placeholder="Enter drug name"
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-bold">From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={handleFromDateChange}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-bold">To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    min={fromDate}
                    onChange={handleToDateChange}
                    disabled={!fromDate}
                    onFocus={handleToDateFocus}
                  />
                </div>
                <div className="col-md-2 d-flex align-items-end gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleReset}
                  >
                    Reset
                  </button>
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-12 d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={handleGeneratePDF}
                    disabled={isGeneratingPDF || isGeneratingExcel || !fromDate || !toDate}
                  >
                    {isGeneratingPDF ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Generating...
                      </>
                    ) : (
                      "Generate PDF Report"
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleGenerateExcel}
                    disabled={isGeneratingExcel || isGeneratingPDF || !fromDate || !toDate}
                  >
                    {isGeneratingExcel ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      </>
                    ) : (
                      "Excel Report"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicineIssueRegister;