import { useState } from "react";

const TATReport = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [investigation, setInvestigation] = useState("");
  const [isInvestigationDropdownVisible, setInvestigationDropdownVisible] = useState(false);
  const [modality, setModality] = useState("");
  const [reportType, setReportType] = useState("detailed");
  const [dateRangeConfig, setDateRangeConfig] = useState("365");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReport, setShowReport] = useState(false);

// Mock data for detailed report
const detailedReportData = [
  {
    investigationName: "Hemoglobin (Hb)",
    sampleId: "S-20250705-101",
    sampleReceivedDateTime: "05-Jul-2025 09:00",
    reportAuthorizedDateTime: "05-Jul-2025 11:30",
    expectedTAT: 4,
    actualTAT: 2.5,
    delay: 0.0,
    iauStatus: "Within",
    technicianName: "Amit Verma",
    remarks: "–"
  },
  {
    investigationName: "Hemoglobin (Hb)",
    sampleId: "S-20250705-102",
    sampleReceivedDateTime: "05-Jul-2025 09:15",
    reportAuthorizedDateTime: "05-Jul-2025 14:00",
    expectedTAT: 4,
    actualTAT: 4.75,
    delay: 0.75,
    iauStatus: "Breach",
    technicianName: "Pooja Mehta",
    remarks: "Analyzer downtime"
  },
  {
    investigationName: "Complete Blood Count (CBC)",
    sampleId: "S-20250705-110",
    sampleReceivedDateTime: "05-Jul-2025 10:00",
    reportAuthorizedDateTime: "05-Jul-2025 15:30",
    expectedTAT: 6,
    actualTAT: 5.5,
    delay: 0.0,
    iauStatus: "Within",
    technicianName: "Rahul Iyer",
    remarks: "–"
  },
  {
    investigationName: "Kidney Function Test (KFT)",
    sampleId: "S-20250705-118",
    sampleReceivedDateTime: "05-Jul-2025 08:30",
    reportAuthorizedDateTime: "05-Jul-2025 22:00",
    expectedTAT: 12,
    actualTAT: 13.5,
    delay: 1.5,
    iauStatus: "Breach",
    technicianName: "Sneha Joshi",
    remarks: "Re-run required"
  }
];

// Mock data for summary report
const summaryReportData = [
  {
    investigationName: "Hemoglobin (Hb)",
    expectedTAT: 4,
    totalTests: 15,
    averageTAT: 3.1,
    minimumTAT: 1.8,
    maximumTAT: 5.2,
    testsWithinTAT: 12,
    testsBreached: 3,
    compliancePercent: "80%"
  },
  {
    investigationName: "Complete Blood Count (CBC)",
    expectedTAT: 6,
    totalTests: 20,
    averageTAT: 5.2,
    minimumTAT: 2.4,
    maximumTAT: 7.9,
    testsWithinTAT: 18,
    testsBreached: 2,
    compliancePercent: "90%"
  },
  {
    investigationName: "Kidney Function Test (KFT)",
    expectedTAT: 12,
    totalTests: 8,
    averageTAT: 13.4,
    minimumTAT: 9.2,
    maximumTAT: 18.6,
    testsWithinTAT: 5,
    testsBreached: 3,
    compliancePercent: "62.5%"
  },
  {
    investigationName: "Liver Function Test (LFT)",
    expectedTAT: 24,
    totalTests: 6,
    averageTAT: 21.3,
    minimumTAT: 18.0,
    maximumTAT: 27.5,
    testsWithinTAT: 4,
    testsBreached: 2,
    compliancePercent: "66.7%"
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

  const handleViewReport = () => {
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

  const handlePrintReport = () => {
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
      alert(`${reportType === "detailed" ? "Detailed TAT" : "TAT Summary"} Report would be printed here`);
      setIsGenerating(false);
    }, 1000);
  };


  // Derive investigation options from the mock data in this file
  const investigationOptions = Array.from(new Set([
    ...detailedReportData.map(d => d.investigationName),
    ...summaryReportData.map(s => s.investigationName)
  ])).map((name, idx) => ({ id: idx + 1, name }));

  const handleInvestigationChange = (e) => {
    setInvestigation(e.target.value);
    setInvestigationDropdownVisible(true);
  }

  const handleInvestigationSelect = (inv) => {
    setInvestigation(inv.name);
    setInvestigationDropdownVisible(false);
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">
                TAT Report
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
                  <label className="form-label fw-bold">From Date <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={handleFromDateChange}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold">To Date <span className="text-danger">*</span></label>
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

                <div className="form-group col-md-3 position-relative">
                  <label className="form-label fw-bold">Investigation Name</label>
                  <input
                    type="text"
                    className="form-control mt-1"
                    id="investigationName"
                    placeholder="Search Investigation Name"
                    value={investigation}
                    onChange={handleInvestigationChange}
                    onFocus={() => setInvestigationDropdownVisible(true)}
                    onBlur={() => setTimeout(() => setInvestigationDropdownVisible(false), 200)}
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

              <div className="row mb-4">
                <div className="col-md-12">
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="reportType"
                      id="detailed"
                      value="detailed"
                      checked={reportType === "detailed"}
                      onChange={(e) => setReportType(e.target.value)}
                    />
                    <label className="form-check-label fw-bold" htmlFor="detailed">
                      Detailed TAT Report
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="reportType"
                      id="summary"
                      value="summary"
                      checked={reportType === "summary"}
                      onChange={(e) => setReportType(e.target.value)}
                    />
                    <label className="form-check-label fw-bold" htmlFor="summary">
                      TAT Summary Report
                    </label>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-12 d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleViewReport}
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
                      {isGenerating ? (
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
                      className="btn btn-success"
                      onClick={handlePrintReport}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
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

              {showReport && (
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="card-title mb-0">
                          {reportType === "detailed" ? "Detailed TAT Report" : "TAT Summary Report"}
                        </h5>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          {reportType === "detailed" ? (
                            <table className="table table-bordered table-hover">
                              <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                                <tr>
                                  <th>Investigation Name</th>
                                  <th>Sample ID</th>
                                  <th>Sample Received Date & Time</th>
                                  <th>Report Authorized Date & Time</th>
                                  <th>Expected TAT (hrs)</th>
                                  <th>Actual TAT (hrs)</th>
                                  <th>Delay (hrs)</th>
                                  <th>IAU Status (Within / Breach)</th>
                                  <th>Technician Name</th>
                                  <th>Remarks</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detailedReportData.map((row, index) => (
                                  <tr key={index}>
                                    <td>{row.investigationName}</td>
                                    <td>{row.sampleId}</td>
                                    <td>{row.sampleReceivedDateTime}</td>
                                    <td>{row.reportAuthorizedDateTime}</td>
                                    <td>{row.expectedTAT}</td>
                                    <td>{row.actualTAT}</td>
                                    <td>{row.delay}</td>
                                    <td>{row.iauStatus}</td>
                                    <td>{row.technicianName}</td>
                                    <td>{row.remarks}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <table className="table table-bordered table-hover">
                              <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                                <tr>
                                  <th>Investigation Name</th>
                                  <th>Expected TAT (hrs)</th>
                                  <th>Total Tests</th>
                                  <th>Average TAT (hrs)</th>
                                  <th>Minimum TAT (hrs)</th>
                                  <th>Maximum TAT (hrs)</th>
                                  <th>Tests Within TAT</th>
                                  <th>Tests Breached</th>
                                  <th>Compliance %</th>
                                </tr>
                              </thead>
                              <tbody>
                                {summaryReportData.map((row, index) => (
                                  <tr key={index}>
                                    <td>{row.investigationName}</td>
                                    <td>{row.expectedTAT}</td>
                                    <td>{row.totalTests}</td>
                                    <td>{row.averageTAT}</td>
                                    <td>{row.minimumTAT}</td>
                                    <td>{row.maximumTAT}</td>
                                    <td>{row.testsWithinTAT}</td>
                                    <td>{row.testsBreached}</td>
                                    <td>{row.compliancePercent}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
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

export default TATReport;