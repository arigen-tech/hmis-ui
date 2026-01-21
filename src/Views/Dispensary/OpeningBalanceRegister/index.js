import { useState } from "react";
import { ALL_REPORTS } from "../../../config/apiConfig";
import Popup from "../../../Components/popup";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";

const OpeningBalanceRegister = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);

  const hospitalId = localStorage.getItem("hospitalId") || sessionStorage.getItem("hospitalId");
  const departmentId = localStorage.getItem("departmentId") || sessionStorage.getItem("departmentId");
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
      },
    })
  }

 

  const handleViewDownload = async () => {
    if (!fromDate || !toDate) {
      showPopup("Please select both From Date and To Date", "error");
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      showPopup("From Date cannot be later than To Date", "error");
      return;
    }

    if (new Date(fromDate) > new Date() || new Date(toDate) > new Date()) {
      showPopup("Dates cannot be in the future", "error");
      return;
    }

    if (!hospitalId || !departmentId) {
      showPopup("Hospital and Department must be selected.", "error");
      return;
    }

    setIsGeneratingPDF(true);
    setPdfUrl(null);
    
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

      // Use "d" flag for download/view
      const url = `${ALL_REPORTS}/openingBalanceRegistryReport?hospitalId=${hospitalId}&departmentId=${departmentId}&fromDate=${fromDate}&toDate=${toDate}&flag=d`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
          Authorization: `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const fileURL = window.URL.createObjectURL(blob);
      setPdfUrl(fileURL);
      
    } catch (error) {
      console.error("Error generating PDF", error);
      showPopup("Report generation failed", "error");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = async () => {
    if (!fromDate || !toDate) {
      showPopup("Please select both From Date and To Date", "error");
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      showPopup("From Date cannot be later than To Date", "error");
      return;
    }

    if (new Date(fromDate) > new Date() || new Date(toDate) > new Date()) {
      showPopup("Dates cannot be in the future", "error");
      return;
    }

    if (!hospitalId || !departmentId) {
      showPopup("Hospital and Department must be selected.", "error");
      return;
    }

    setIsPrinting(true);
    
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

      // Use "p" flag for printing
      const url = `${ALL_REPORTS}/openingBalanceRegistryReport?hospitalId=${hospitalId}&departmentId=${departmentId}&fromDate=${fromDate}&toDate=${toDate}&flag=p`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
          Authorization: `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error("Failed to send to printer");
      }

      //showPopup("Report sent to printer successfully!", "success");
      
    } catch (error) {
      console.error("Error printing report", error);
      showPopup("Report printing failed", "error");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleFromDateChange = (e) => {
    const selectedDate = e.target.value;
    const today = new Date().toISOString().split('T')[0];

    if (selectedDate > today) {
      showPopup("From date cannot be in the future", "error");
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
      showPopup("To date cannot be in the future", "error");
      return;
    }

    if (fromDate && selectedDate < fromDate) {
      showPopup("To date cannot be earlier than From date", "error");
      return;
    }

    setToDate(selectedDate);
  };

  // Function to prevent the browser's auto-fill behavior
  const handleToDateFocus = (e) => {
    if (!fromDate) {
      e.preventDefault();
      e.target.blur();
      showPopup("Please select From Date first", "error");
    }
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">
                Opening Balance Register
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
                    className="btn btn-primary"
                    onClick={handleViewDownload}
                    disabled={isGeneratingPDF || isPrinting}
                  >
                    {isGeneratingPDF ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Generating...
                      </>
                    ) : (
                      <>
                        <i className="fa fa-eye me-2"></i> VIEW/DOWNLOAD
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={handlePrint}
                    disabled={isPrinting || isGeneratingPDF}
                  >
                    {isPrinting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Printing...
                      </>
                    ) : (
                      <>
                        <i className="fa fa-print me-2"></i> PRINT
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {pdfUrl && (
        <PdfViewer
          pdfUrl={pdfUrl}
          onClose={() => {
            setPdfUrl(null);
          }}
          name="Opening Balance Register"
        />
      )}

      {/* Popup Message */}
      {popupMessage && <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />}
    </div>
  );
};

export default OpeningBalanceRegister;