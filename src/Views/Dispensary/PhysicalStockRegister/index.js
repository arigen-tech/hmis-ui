import { useState } from "react";
import { ALL_REPORTS } from "../../../config/apiConfig";

const PhysicalStockTakingRegister = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

  const handleGeneratePDF = async () => {
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

    const hospitalId =
      localStorage.getItem("hospitalId") || sessionStorage.getItem("hospitalId");
    const departmentId =
      localStorage.getItem("departmentId") ||
      sessionStorage.getItem("departmentId");

    if (!hospitalId || !departmentId) {
      alert("Hospital and Department must be selected.");
      return;
    }

    setIsGeneratingPDF(true);

    try {
      const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      };

      const formattedFromDate = formatDate(fromDate);
      const formattedToDate = formatDate(toDate);

      const url = `${ALL_REPORTS}/stockTakingRegister?hospitalId=${hospitalId}&departmentId=${departmentId}&fromDate=${formattedFromDate}&toDate=${formattedToDate}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const fileURL = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = fileURL;
      link.setAttribute("download", "PhysicalStockTakingRegister.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Error generating PDF", error);
      alert("Error generating PDF report. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleGenerateExcel = () => {
    setIsGeneratingExcel(true);
    setTimeout(() => {
      alert("Excel report service is currently unavailable");
      setIsGeneratingExcel(false);
    }, 500);
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

  // Function to prevent the browser's auto-fill behavior
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
                Physical Stock Taking Register
              </h4>
            </div>
            <div className="card-body">
              <div className="row mb-4">
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
                <div className="col-md-8 d-flex align-items-end gap-2">
                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={handleGeneratePDF}
                    disabled={isGeneratingPDF || isGeneratingExcel}
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
                    disabled={isGeneratingExcel || isGeneratingPDF}
                  >
                    {isGeneratingExcel ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Generating...
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

export default PhysicalStockTakingRegister;