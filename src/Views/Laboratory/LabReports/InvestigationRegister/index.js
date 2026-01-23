import { useState, useEffect } from "react";
import { getRequest } from "../../../../service/apiService";
import Popup from "../../../../Components/popup";
import { MAS_GENDER, MAS_INVESTIGATION, MAX_MONTHS_BACK } from "../../../../config/apiConfig";
import { ALL_REPORTS } from "../../../../config/apiConfig";
import {
  SELECT_DATE_WARN_MSG,
  INVALID_DATE_PICK_WARN_MSG,
  LAB_REPORT_GENERATION_ERR_MSG,
  LAB_REPORT_PRINT_ERR_MSG
} from '../../../../config/constants';
import PdfViewer from "../../../../Components/PdfViewModel/PdfViewer";

const InvestigationRegister = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [investigation, setInvestigation] = useState("");
  const [selectedInvestigation, setSelectedInvestigation] = useState(null);
  const [isInvestigationDropdownVisible, setInvestigationDropdownVisible] = useState(false);
  const [gender, setGender] = useState("");
  const [fromAge, setFromAge] = useState("");
  const [toAge, setToAge] = useState("");
  
  const [investigationOptions, setInvestigationOptions] = useState([]);
  const [genderList, setGenderList] = useState([]);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getMonthDifference = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    let months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months += d2.getMonth() - d1.getMonth();
    
    return months;
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

  const fetchInvestigations = async () => {
    try {
      const response = await getRequest(`${MAS_INVESTIGATION}/mas-investigation/all`);
      if (response && response.response) {
        setInvestigationOptions(response.response.map(item => ({
          investigationId: item.investigationId,
          investigationName: item.investigationName
        })));
      } else if (response && Array.isArray(response)) {
        setInvestigationOptions(response.map(item => ({
          investigationId: item.InvestigationId,
          investigationName: item.investigationName
        })));
      }
    } catch (error) {
      console.error("Error fetching investigations:", error);
    }
  };

  const fetchGenders = async () => {
    try {
      const response = await getRequest(`${MAS_GENDER}/getAll/1`);
      if (response && response.response && Array.isArray(response.response)) {
        setGenderList(response.response);
      }
    } catch (error) {
      console.error("Error fetching genders:", error);
    }
  };

  const handleInvestigationChange = (e) => {
    setInvestigation(e.target.value);
    setInvestigationDropdownVisible(true);
  };

  const handleInvestigationSelect = (inv) => {
    setInvestigation(inv.investigationName);
    setSelectedInvestigation(inv);
    setInvestigationDropdownVisible(false);
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
      showPopup(SELECT_DATE_WARN_MSG, "warning");
      return false;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      showPopup(INVALID_DATE_PICK_WARN_MSG, "warning");
      return false;
    }

    const monthDiff = getMonthDifference(fromDate, toDate);
    if (monthDiff > MAX_MONTHS_BACK) {
      showPopup(`Date range cannot exceed ${MAX_MONTHS_BACK} months.`, "error");
      return false;
    }

    return true;
  };

  const handleViewDownloadReport = async () => {
    if (!validateDates()) return;

    setIsGeneratingPDF(true);
    setPdfUrl(null);

    try {
      const params = new URLSearchParams();
      params.append('fromDate',fromDate);
      params.append('toDate', toDate);
      
      const selectedGender = genderList.find(g => g.genderName === gender);
      if(selectedGender){
              params.append('genderId',selectedGender.id);
      }
      if(selectedInvestigation){
              params.append('investigationId', selectedInvestigation.investigationId);
      }
      if(fromAge){
              params.append('fromAge', fromAge);
      }
      if(toAge ){
              params.append('toAge', toAge);
      }
      params.append('flag', 'D');
      
console.log("Final prams ::",params);
      const url = `${ALL_REPORTS}/labRegister?${params.toString()}`;
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
      setPdfUrl(fileURL);

    } catch (error) {
      console.error("Error generating PDF", error);
      showPopup(LAB_REPORT_GENERATION_ERR_MSG, "error");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrintReport = async () => {
    if (!validateDates()) return;

    setIsPrinting(true);

    try {
      const params = new URLSearchParams();
      params.append('fromDate', formatDateForAPI(fromDate));
      params.append('toDate', formatDateForAPI(toDate));
      
      const selectedGender = genderList.find(g => g.genderName === gender);
      params.append('genderId', selectedGender ? selectedGender.id : '');
      params.append('investigationId', selectedInvestigation ? selectedInvestigation.investigationId : '');
      params.append('fromAge', fromAge || '0');
      params.append('toAge', toAge || '0');
      params.append('flag', 'P');

      const url = `${ALL_REPORTS}/labRegister?${params.toString()}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
        },
      });

      if (response.status === 200) {
        // showPopup("Report sent to printer successfully!", "success");
      } else {
        showPopup(LAB_REPORT_PRINT_ERR_MSG, "error");
      }
    } catch (error) {
      console.error("Error printing report", error);
      showPopup(LAB_REPORT_PRINT_ERR_MSG, "error");
    } finally {
      setIsPrinting(false);
    }
  };

  const formatDateForAPI = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  useEffect(() => {
    const today = getTodayDate();
    setToDate(today);
    fetchInvestigations();
    fetchGenders();
  }, []);

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
          name={`Investigation Register - ${fromDate} to ${toDate}`}
        />
      )}

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
                  <label className="form-label fw-bold">From Date <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    max={getTodayDate()}
                    onChange={handleFromDateChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">To Date <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    min={fromDate}
                    onChange={handleToDateChange}
                    // disabled={!fromDate}
                  />
                </div>

                <div className="form-group col-md-4 position-relative">
                  <label className="form-label fw-bold">Investigation</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type investigation name"
                    value={investigation}
                    onChange={handleInvestigationChange}
                    onFocus={() => setInvestigationDropdownVisible(true)}
                    onBlur={() => setTimeout(() => setInvestigationDropdownVisible(false), 200)}
                    autoComplete="off"
                  />
                  {isInvestigationDropdownVisible && investigation && (
                    <ul className="list-group position-absolute w-100 mt-1" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                      {investigationOptions
                        .filter((inv) => inv.investigationName.toLowerCase().includes(investigation.toLowerCase()))
                        .map((inv) => (
                          <li
                            key={inv.investigationId}
                            className="list-group-item list-group-item-action"
                            onClick={() => handleInvestigationSelect(inv)}
                          >
                            {inv.investigationName}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>

                <div className="col-md-4 mt-3">
                  <label className="form-label fw-bold">Gender</label>
                  <select 
                    className="form-select" 
                    value={gender} 
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="">Select</option>
                    {genderList.map((genderItem) => (
                      <option key={genderItem.id} value={genderItem.genderName}>
                        {genderItem.genderName}
                      </option>
                    ))}
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
                    className="btn btn-primary"
                    onClick={handleViewDownloadReport}
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
                    onClick={handlePrintReport}
                    disabled={isGeneratingPDF || isPrinting}
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
    </div>
  );
};

export default InvestigationRegister;