import { useState } from "react";
import { ALL_REPORTS } from "../../../config/apiConfig";
import Popup from "../../../Components/popup";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";
import {
  SELECT_BALANCE_TYPE_ERR_MSG,
  SELECT_DATES_ERR_MSG,
  FROM_DATE_LATER_THAN_TO_DATE_ERR_MSG,
  FUTURE_DATE_ERR_MSG,
  HOSPITAL_DEPT_REQUIRED_ERR_MSG,
  REPORT_GEN_FAILED_ERR_MSG,
  PRINT_FAILED_ERR_MSG,
  SELECT_FROM_DATE_FIRST_ERR_MSG,
  FROM_DATE_FUTURE_ERR_MSG,
  TO_DATE_FUTURE_ERR_MSG,
  OPENING_BALANCE_REGISTER_PDF_NAME
} from "../../../config/constants";

const OpeningBalanceRegister = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [balanceType, setBalanceType] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);

  const balanceTypeOptions = ["Drug", "Non Drug"];

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

  // Check if all mandatory fields are filled
  const areMandatoryFieldsFilled = () => {
    // Check balance type
    if (!balanceType) {
      return false;
    }

    // Check dates
    if (!fromDate || !toDate) {
      return false;
    }

    // Check hospital/department
    if (!hospitalId || !departmentId) {
      return false;
    }

    return true;
  };

  // Reset all fields
  const handleReset = () => {
    setBalanceType("");
    setFromDate("");
    setToDate("");
    setPdfUrl(null);
    setIsGeneratingPDF(false);
    setIsPrinting(false);
  };

  const handleViewDownload = async () => {
    if (!balanceType) {
      showPopup(SELECT_BALANCE_TYPE_ERR_MSG, "error");
      return;
    }

    if (!fromDate || !toDate) {
      showPopup(SELECT_DATES_ERR_MSG, "error");
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      showPopup(FROM_DATE_LATER_THAN_TO_DATE_ERR_MSG, "error");
      return;
    }

    if (new Date(fromDate) > new Date() || new Date(toDate) > new Date()) {
      showPopup(FUTURE_DATE_ERR_MSG, "error");
      return;
    }

    if (!hospitalId || !departmentId) {
      showPopup(HOSPITAL_DEPT_REQUIRED_ERR_MSG, "error");
      return;
    }

    setIsGeneratingPDF(true);
    setPdfUrl(null);
    
    try {
      // Convert balance type to parameter (D for Drug, N for Non Drug)
      const balanceTypeParam = balanceType === "Drug" ? "D" : "N";

      // Use "d" flag for download/view with balanceType parameter
      const url = `${ALL_REPORTS}/openingBalanceRegistryReport?hospitalId=${hospitalId}&departmentId=${departmentId}&fromDate=${fromDate}&toDate=${toDate}&balanceType=${balanceTypeParam}&flag=d`;

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
      showPopup(REPORT_GEN_FAILED_ERR_MSG, "error");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = async () => {
    if (!balanceType) {
      showPopup(SELECT_BALANCE_TYPE_ERR_MSG, "error");
      return;
    }

    if (!fromDate || !toDate) {
      showPopup(SELECT_DATES_ERR_MSG, "error");
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      showPopup(FROM_DATE_LATER_THAN_TO_DATE_ERR_MSG, "error");
      return;
    }

    if (new Date(fromDate) > new Date() || new Date(toDate) > new Date()) {
      showPopup(FUTURE_DATE_ERR_MSG, "error");
      return;
    }

    if (!hospitalId || !departmentId) {
      showPopup(HOSPITAL_DEPT_REQUIRED_ERR_MSG, "error");
      return;
    }

    setIsPrinting(true);
    
    try {
      // Convert balance type to parameter (D for Drug, N for Non Drug)
      const balanceTypeParam = balanceType === "Drug" ? "D" : "N";

      // Use "p" flag for printing with balanceType parameter
      const url = `${ALL_REPORTS}/openingBalanceRegistryReport?hospitalId=${hospitalId}&departmentId=${departmentId}&fromDate=${fromDate}&toDate=${toDate}&balanceType=${balanceTypeParam}&flag=p`;

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
      
    } catch (error) {
      console.error("Error printing report", error);
      showPopup(PRINT_FAILED_ERR_MSG, "error");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleFromDateChange = (e) => {
    const selectedDate = e.target.value;
    const today = new Date().toISOString().split('T')[0];

    // Only check if date is in future, don't show popup for other validations
    if (selectedDate > today) {
      showPopup(FROM_DATE_FUTURE_ERR_MSG, "error");
      return;
    }

    setFromDate(selectedDate);

    // Reset To Date if it's now invalid (but don't show popup)
    if (toDate && selectedDate > toDate) {
      setToDate("");
    }
  };

  const handleToDateChange = (e) => {
    const selectedDate = e.target.value;
    const today = new Date().toISOString().split('T')[0];

    // Only check if date is in future
    if (selectedDate > today) {
      showPopup(TO_DATE_FUTURE_ERR_MSG, "error");
      return;
    }

    setToDate(selectedDate);
  };

  // Function to prevent the browser's auto-fill behavior
  const handleToDateFocus = (e) => {
    if (!fromDate) {
      e.preventDefault();
      e.target.blur();
      showPopup(SELECT_FROM_DATE_FIRST_ERR_MSG, "error");
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
                {/* Balance Type Dropdown */}
                <div className="col-md-4">
                  <label className="form-label fw-bold">
                    Balance Type <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-control"
                    value={balanceType}
                    onChange={(e) => setBalanceType(e.target.value)}
                    required
                  >
                    <option value="">Select Balance Type</option>
                    {balanceTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold">
                    From Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={handleFromDateChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">
                    To Date <span className="text-danger">*</span>
                  </label>
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
                <div className="col-md-6 mt-4 d-flex align-items-end gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleReset}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={handleViewDownload}
                    disabled={!areMandatoryFieldsFilled() || isGeneratingPDF || isPrinting}
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
                    disabled={!areMandatoryFieldsFilled() || isPrinting || isGeneratingPDF}
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
          name={OPENING_BALANCE_REGISTER_PDF_NAME}
        />
      )}

      {/* Popup Message */}
      {popupMessage && <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />}
    </div>
  );
};

export default OpeningBalanceRegister;