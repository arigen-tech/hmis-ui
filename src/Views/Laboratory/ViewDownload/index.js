import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getRequest, postRequest } from "../../../service/apiService";
import { ALL_REPORTS, PRINT } from "../../../config/apiConfig";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";
import Popup from "../../../Components/popup";

const ViewDownload = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [resultData, setResultData] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (location.state && location.state.resultData) {
      setResultData(location.state.resultData);
    } else {
      // If no data passed, show error and redirect back
      showPopup("No result data found. Redirecting back...", "error");
      setTimeout(() => {
        navigate(-1);
      }, 2000);
    }
  }, [location.state, navigate]);

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      },
    });
  };

  const generateLabReport = async () => {
    if (!resultData || !resultData.orderHdId) {
      showPopup("Order ID not found for generating report", "error");
      return;
    }
    
    setIsGeneratingPDF(true);
    setPdfUrl(null);
    
    try {
      const hospitalId = sessionStorage.getItem("hospitalId") || localStorage.getItem("hospitalId");
      const departmentId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId");
      const orderhd_id = resultData.orderHdId;
      
      const url = `${ALL_REPORTS}/labInvestigationReport?orderhd_id=${orderhd_id}&hospitalId=${hospitalId}&departmentId=${departmentId}`;
      
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
      showPopup("Error generating lab report. Please try again.", "error");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = async () => {
    if (!resultData || !resultData.orderHdId) {
      showPopup("Order ID not found for printing", "error");
      return;
    }
    
    setIsPrinting(true);
    
    try {
      const orderhd_id = resultData.orderHdId;
      
      // Call the backend print API
      const response = await postRequest(`${PRINT}/lab-investigation?orderhd_id=${orderhd_id}`, {});
      
      if (response.status === 200) {
        showPopup("Report sent to printer successfully!", "success");
      } else {
        showPopup( "Internal Server Error ","error");
      }
    } catch (error) {
      console.error("Error printing report ", "error");
      showPopup("Error printing report" , "error");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleView = () => {
    generateLabReport();
  };

  const handleBackToValidation = () => {
    navigate('/ResultValidation');
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
      
      {pdfUrl && (
        <PdfViewer
          pdfUrl={pdfUrl}
          onClose={() => {
            setPdfUrl(null);
          }}
          name={`Lab Report - ${resultData?.patient_name || 'Patient'}`}
        />
      )}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="lead">Result validated. Do you want to print?</h4>
            </div>

            <div className="card-body">
              {/* Patient Information Section */}
              {resultData && (
                <div className="mb-4">
                  <h5>Patient Information:</h5>
                  <div className="row mt-3">
                    <div className="col-md-4">
                      <p><strong>Patient Name:</strong> {resultData.patient_name}</p>
                    </div>
                    <div className="col-md-4">
                      <p><strong>Diag No:</strong> {resultData.diag_no}</p>
                    </div>
                    <div className="col-md-4">
                      <p><strong>Mobile No:</strong> {resultData.mobile_no}</p>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4">
                      <p><strong>Department:</strong> {resultData.department}</p>
                    </div>
                    <div className="col-md-4">
                      <p><strong>Doctor:</strong> {resultData.doctor_name}</p>
                    </div>
                    {/* <div className="col-md-4">
                      <p><strong>Result Date:</strong> {resultData.result_date}</p>
                    </div> */}
                  </div>
                </div>
              )}

              {/* Buttons aligned to left top */}
              <div className="d-flex gap-4">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleView}
                  disabled={isGeneratingPDF}
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
                  className="btn btn-success btn-sm"
                  onClick={handlePrint}
                  disabled={isPrinting}
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

                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleBackToValidation}
                >
                  <i className="mdi mdi-format-list-bulleted me-2"></i> 
                  Back to List
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewDownload;