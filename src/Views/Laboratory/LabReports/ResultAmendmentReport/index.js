import { useState } from "react";

const ResultAmendmentReport = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [patientMobile, setPatientMobile] = useState("");
  const [patientName, setPatientName] = useState("");
  const [investigation, setInvestigation] = useState("");
  const [modality, setModality] = useState("");
  const [dateRangeConfig, setDateRangeConfig] = useState("365");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isInvestigationDropdownVisible, setIsInvestigationDropdownVisible] = useState(false);

  // Mock investigation options for autocomplete
  const investigationOptions = [
    { id: 1, name: "Hemoglobin (Hb)" },
    { id: 2, name: "CBC – Total WBC" },
    { id: 3, name: "Serum Creatinine" },
    { id: 4, name: "Blood Glucose (fasting)" },
    { id: 5, name: "ESR" },
    { id: 6, name: "Complete Blood Count (CBC)" },
    { id: 7, name: "Lipid Profile" },
    { id: 8, name: "Liver Function Test (LFT)" },
    { id: 9, name: "Kidney Function Test (KFT)" },
    { id: 10, name: "Thyroid Profile" }
  ];

  // Mock data for the report
  const reportData = [
    {
      sampleId: "SMP-20250701-00123",
      patientName: "Ramesh Kumar",
      ageGender: "45 / M",
      investigationName: "Hemoglobin (Hb)",
      oldResult: "11.2 g/dL",
      newResult: "12.4 g/dL",
      reasonForChange: "Manual entry error",
      authorizedBy: "Dr. S. Verma (Pathologist)",
      dateTime: "01-Jul-2025 14:25"
    },
    {
      sampleId: "SMP-20250701-00145",
      patientName: "Anita Sharma",
      ageGender: "32 / F",
      investigationName: "CBC – Total WBC",
      oldResult: "18,500 /μL",
      newResult: "11,800 /μL",
      reasonForChange: "Analyzer rerun after QC failure",
      authorizedBy: "Dr. P. Mehta",
      dateTime: "01-Jul-2025 16:10"
    },
    {
      sampleId: "SMP-20250702-00078",
      patientName: "Mohd. Irfan",
      ageGender: "60 / M",
      investigationName: "Serum Creatinine",
      oldResult: "1.9 mg/dL",
      newResult: "1.4 mg/dL",
      reasonForChange: "Sample dilution error",
      authorizedBy: "Dr. A. Khan",
      dateTime: "02-Jul-2025 11:42"
    },
    {
      sampleId: "SMP-20250702-00102",
      patientName: "Sunita Devi",
      ageGender: "28 / F",
      investigationName: "Blood Glucose (fasting)",
      oldResult: "240 mg/dL",
      newResult: "124 mg/dL",
      reasonForChange: "Result mapped to wrong patient",
      authorizedBy: "Dr. R. Iyer",
      dateTime: "02-Jul-2025 17:05"
    },
    {
      sampleId: "SMP-20250703-00056",
      patientName: "Aarav Patel",
      ageGender: "8 / M",
      investigationName: "ESR",
      oldResult: "85 mm/hr",
      newResult: "18 mm/hr",
      reasonForChange: "Clotted sample – repeat test",
      authorizedBy: "Dr. S. Verma",
      dateTime: "03-Jul-2025 10:30"
    }
  ];

  const handleFromDateChange = (e) => {
    const selectedDate = e.target.value;
    const today = new Date().toISOString().split('T')[0];

    if (selectedDate > today) {
      alert("From date cannot be in the future");
      return;
    }

    setFromDate(selectedDate);

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

    const fromDateObj = new Date(fromDate);
    const toDateObj = new Date(selectedDate);
    const diffTime = Math.abs(toDateObj - fromDateObj);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > parseInt(dateRangeConfig)) {
      alert(`Date range cannot exceed ${dateRangeConfig} days`);
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

  const handleInvestigationChange = (e) => {
    setInvestigation(e.target.value);
  };

  const handleInvestigationSelect = (inv) => {
    setInvestigation(inv.name);
    setIsInvestigationDropdownVisible(false);
  };

  const handleViewHtml = () => {
    if (!fromDate || !toDate) {
      alert("Please select both From Date and To Date");
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      alert("From Date cannot be later than To Date");
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      setShowReport(true);
      setIsGenerating(false);
    }, 1000);
  };

  const handleViewReport = () => {
    alert("View Report would be implemented here");
  };

  const handlePrintReport = () => {
    alert("Print Report would be implemented here");
  };

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
                  <label className="form-label fw-bold">Date Range Limit</label>
                  <select 
                    className="form-select" 
                    value={dateRangeConfig} 
                    onChange={(e) => setDateRangeConfig(e.target.value)}
                  >
                    <option value="90">3 Months (90 days)</option>
                    <option value="180">6 Months (180 days)</option>
                    <option value="365">1 Year (365 days)</option>
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold">From Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={handleFromDateChange}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold">To Date *</label>
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

                <div className="col-md-3">
                  <label className="form-label fw-bold">Patient Mobile No</label>
                  <input
                    type="text"
                    className="form-control"
                    value={patientMobile}
                    onChange={(e) => setPatientMobile(e.target.value)}
                    placeholder="Enter mobile number"
                  />
                </div>

                <div className="col-md-3 mt-3">
                  <label className="form-label fw-bold">Patient Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter patient name"
                  />
                </div>

                <div className="form-group col-md-3 mt-3 position-relative">
                  <label className="form-label fw-bold">Investigation Name</label>
                  <input
                    type="text"
                    className="form-control mt-1"
                    id="investigationName"
                    placeholder="Search Investigation Name"
                    value={investigation}
                    onChange={handleInvestigationChange}
                    onFocus={() => setIsInvestigationDropdownVisible(true)}
                    onBlur={() => setTimeout(() => setIsInvestigationDropdownVisible(false), 200)}
                    autoComplete="off"
                  />
                  {isInvestigationDropdownVisible && investigation && (
                    <ul className="list-group position-absolute w-100 mt-1" style={{ zIndex: 1000 }}>
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
                  <select className="form-select" value={modality} onChange={(e) => setModality(e.target.value)}>
                    <option value="">Select</option>
                    <option value="lab">Laboratory</option>
                    <option value="radiology">Radiology</option>
                    <option value="pathology">Pathology</option>
                    <option value="imaging">Imaging</option>
                  </select>
                </div>
              </div>

              <div className="row">
                <div className="col-12 d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleViewHtml}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Generating...
                      </>
                    ) : (
                      "View HTML"
                    )}
                  </button>
                  
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-warning"
                      onClick={handleViewReport}
                      disabled={isGenerating}
                    >
                      View Report
                    </button>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={handlePrintReport}
                      disabled={isGenerating}
                    >
                      Print Report
                    </button>
                  </div>
                </div>
              </div>

              {showReport && (
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="card-title mb-0">
                          Result Amendment/Update Report
                        </h5>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-bordered table-hover">
                            <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                              <tr>
                                <th>Sample ID</th>
                                <th>Patient Name</th>
                                <th>Age / Gender</th>
                                <th>Investigation Name</th>
                                <th>Old Result</th>
                                <th>New Result</th>
                                <th>Reason for Change</th>
                                <th>Authorized By</th>
                                <th>Date & Time</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.map((row, index) => (
                                <tr key={index}>
                                  <td>{row.sampleId}</td>
                                  <td>{row.patientName}</td>
                                  <td>{row.ageGender}</td>
                                  <td>{row.investigationName}</td>
                                  <td>{row.oldResult}</td>
                                  <td>{row.newResult}</td>
                                  <td>{row.reasonForChange}</td>
                                  <td>{row.authorizedBy}</td>
                                  <td>{row.dateTime}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
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

export default ResultAmendmentReport;