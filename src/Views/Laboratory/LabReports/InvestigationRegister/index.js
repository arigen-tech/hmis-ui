import { useState } from "react";

const InvestigationRegister = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const [investigation, setInvestigation] = useState("");
  const [gender, setGender] = useState("");
  const [fromAge, setFromAge] = useState("");
  const [toAge, setToAge] = useState("");

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
    setTimeout(() => {
      alert("PDF generation would be implemented here");
      setIsGeneratingPDF(false);
    }, 1000);
  };

  const handleGenerateExcel = () => {
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

    setIsGeneratingExcel(true);
    setTimeout(() => {
      alert("Excel generation would be implemented here");
      setIsGeneratingExcel(false);
    }, 1000);
  };

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

    setToDate(selectedDate);
  };

  const handleToDateFocus = (e) => {
    if (!fromDate) {
      e.preventDefault();
      e.target.blur();
      alert("Please select From Date first");
    }
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">
                Investigation Register
              </h4>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-4">
                  <label className="form-label fw-bold">From Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={handleFromDateChange}
                  />
                </div>
                <div className="col-md-4">
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

                <div className="col-md-4">
                  <label className="form-label fw-bold">Investigation</label>
                  <input
                    type="text"
                    className="form-control"
                    value={investigation}
                    onChange={(e) => setInvestigation(e.target.value)}
                    placeholder="Type investigation name"
                  />
                </div>

                <div className="col-md-4 mt-3">
                  <label className="form-label fw-bold">Gender</label>
                  <select className="form-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="col-md-4 mt-3">
                  <label className="form-label fw-bold">From Age</label>
                  <input
                    type="number"
                    className="form-control"
                    value={fromAge}
                    onChange={(e) => setFromAge(e.target.value)}
                    min="0"
                    placeholder="Minimum age"
                  />
                </div>

                <div className="col-md-4 mt-3">
                  <label className="form-label fw-bold">To Age</label>
                  <input
                    type="number"
                    className="form-control"
                    value={toAge}
                    onChange={(e) => setToAge(e.target.value)}
                    min="0"
                    placeholder="Maximum age"
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-12 d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={handleGeneratePDF}
                    disabled={isGeneratingPDF}
                  >
                    {isGeneratingPDF ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Generating PDF...
                      </>
                    ) : (
                      "Generate PDF"
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleGenerateExcel}
                    disabled={isGeneratingExcel}
                  >
                    {isGeneratingExcel ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Generating Excel...
                      </>
                    ) : (
                      "Generate Excel"
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

export default InvestigationRegister;