import { useState } from "react";

const IssueReferenceReport = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
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

    setIsPrinting(true);
    setTimeout(() => {
      alert("Print functionality would be implemented here");
      setIsPrinting(false);
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
                Issue Reference Report
              </h4>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-4">
                  <label className="form-label fw-bold">City</label>
                  <select className="form-select">
                    <option>Select</option>
                  
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Issue Reference No*</label>
                  <select className="form-select">
                    <option>Select</option>
                      <option>Indent-no</option>
                    <option>Issue No</option>
                    <option>Issue date</option>
                  </select>
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
              </div>

              <div className="row">
                <div className="col-12 d-flex justify-content-end">
                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={handlePrint}
                    disabled={isPrinting}
                  >
                    {isPrinting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Printing...
                      </>
                    ) : (
                      "Print"
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

export default IssueReferenceReport;