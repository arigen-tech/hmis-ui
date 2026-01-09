import { useLocation, useNavigate } from "react-router-dom";
import { ALL_REPORTS } from "../../../config/apiConfig";
import { useState } from "react";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";

const LabPaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const { amount = 0, paymentResponse } = location.state || {};
  const billNo = paymentResponse?.response?.billNo;
  const paymentStatus = paymentResponse?.response?.paymentStatus;

  const generateLabReport = async (flag = "d") => {
    if (!billNo || !paymentStatus) {
      alert("Missing bill number or payment status for generating report");
      return;
    }
    
    setIsGeneratingPDF(true);
    setPdfUrl(null);
    
    try {
      const url = `${ALL_REPORTS}/labReport?billNo=${encodeURIComponent(billNo)}&paymentStatus=${encodeURIComponent(paymentStatus)}&flag=${flag}`;
      
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
      alert("Failed to generate receipt");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = async () => {
    if (!billNo || !paymentStatus) {
      alert("Missing bill number or payment status for printing");
      return;
    }
    
    setIsPrinting(true);
    
    try {
      const url = `${ALL_REPORTS}/labReport?billNo=${encodeURIComponent(billNo)}&paymentStatus=${encodeURIComponent(paymentStatus)}&flag=p`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
        },
      });
      
      if (response.status === 200) {
        // alert("Receipt sent to printer successfully!");
      } else {
        alert("Failed to print receipt");
      }
    } catch (error) {
      console.error("Error printing receipt", error);
      alert("Failed to print receipt");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleViewDownload = () => {
    generateLabReport("d");
  };

  const handleBackToRegistration = () => {
    navigate("/labregistration");
  };

  return (
    <div className="body d-flex py-3">
      <div className="container-xxl">
        <div className="row align-items-center">
          <div className="border-0 mb-4">
            <div className="card-header py-3 no-bg bg-transparent d-flex align-items-center px-0 justify-content-center border-bottom flex-wrap">
              <h3 className="fw-bold mb-0">Payment Success</h3>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-8 mx-auto">
            <div className="card">
              <div className="card-body text-center">
                <div className="mb-4">
                  <i className="fa fa-check-circle text-success" style={{ fontSize: "4rem" }}></i>
                </div>

                <h4 className="mb-3">Payment Successful!</h4>
                <p className="text-muted mb-4">
                  Your payment of ₹{amount.toFixed(2)} has been processed successfully.
                </p>

                <div className="p-3 rounded mb-4">
                  <h5 className="mb-3">Payment Details</h5>
                  <div className="row justify-content-center">
                    <div className="col-sm-6">
                      <p className="mb-2">
                        <strong>Bill No:</strong> {billNo || "N/A"}
                      </p>
                      <p className="mb-2">
                        <strong>Amount Paid:</strong> ₹{amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-center gap-3">
                  <button
                    className="btn btn-primary d-flex align-items-center gap-2"
                    onClick={handleViewDownload}
                    disabled={isGeneratingPDF || !billNo || !paymentStatus}
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
                    className="btn btn-warning d-flex align-items-center gap-2"
                    onClick={handlePrint}
                    disabled={isPrinting || !billNo || !paymentStatus}
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
                    className="btn btn-secondary d-flex align-items-center gap-2"
                    onClick={handleBackToRegistration}
                  >
                    Back to Lab Registration
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {pdfUrl && (
        <PdfViewer
          pdfUrl={pdfUrl}
          onClose={() => {
            setPdfUrl(null);
          }}
          name={`Lab Receipt - ${billNo || 'Receipt'}`}
        />
      )}
    </div>
  );
};

export default LabPaymentSuccess;