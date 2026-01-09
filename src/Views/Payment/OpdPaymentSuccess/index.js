import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";
import { ALL_REPORTS } from "../../../config/apiConfig";

const OpdPaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingStates, setLoadingStates] = useState({
    generating: null, // format: "token-{visitId}" or "bill-{visitId}"
    printing: null,   // format: "token-{visitId}" or "bill-{visitId}"
    allBills: false   // for download all bills
  });

  const { amount = 0, paymentResponse } = location.state || {};
  const billPayments = paymentResponse?.response?.billPayments || [];

  // Helper to set loading state
  const setLoading = (type, value) => {
    setLoadingStates(prev => ({
      ...prev,
      [type]: value
    }));
  };

  // Generic function to generate report
  const generateReport = async (visitId, receiptType = "bill", flag = "d") => {
    if (!visitId) {
      alert(`Missing visit ID for generating ${receiptType} receipt`);
      return;
    }

    setLoading("generating", `${receiptType}-${visitId}`);
    setPdfUrl(null);

    try {
      const endpoint = receiptType === "token" ? "opdToken" : "opdReport";
      const url = `${ALL_REPORTS}/${endpoint}?visit=${visitId}&flag=${flag}`;

      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/pdf" },
      });

      if (!response.ok) {
        throw new Error(`Failed to generate ${receiptType} receipt`);
      }

      const blob = await response.blob();
      const fileURL = window.URL.createObjectURL(blob);
      setPdfUrl(fileURL);
    } catch (err) {
      console.error(`Error generating ${receiptType} receipt`, err);
      alert(`Failed to generate ${receiptType} receipt`);
    } finally {
      setLoading("generating", null);
    }
  };

  // Generic function to print
  const handlePrint = async (visitId, receiptType = "bill") => {
    if (!visitId) {
      alert(`Missing visit ID for printing ${receiptType} receipt`);
      return;
    }

    setLoading("printing", `${receiptType}-${visitId}`);

    try {
      const endpoint = receiptType === "token" ? "opdToken" : "opdReport";
      const url = `${ALL_REPORTS}/${endpoint}?visit=${visitId}&flag=p`;

      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/pdf" },
      });

      if (response.status === 200) {
        // Success
      } else {
        alert(`Failed to print ${receiptType} receipt`);
      }
    } catch (error) {
      console.error(`Error printing ${receiptType} receipt`, error);
      alert(`Failed to print ${receiptType} receipt`);
    } finally {
      setLoading("printing", null);
    }
  };

  // View/Download functions
  const handleViewDownloadToken = (visitId) => {
    generateReport(visitId, "token", "d");
  };

  const handleViewDownloadBill = (visitId) => {
    generateReport(visitId, "bill", "d");
  };

  // Print functions
  const handlePrintToken = (visitId) => {
    handlePrint(visitId, "token");
  };

  const handlePrintBill = (visitId) => {
    handlePrint(visitId, "bill");
  };

  // Download all billing receipts
  const downloadAllBillingReceipts = async () => {
    setLoading("allBills", true);
    
    try {
      for (const bp of billPayments) {
        const url = `${ALL_REPORTS}/opdReport?visit=${bp.visitId}&flag=d`;
        const response = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/pdf" },
        });

        if (response.ok) {
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = `Opd_Receipt_${bp.billHeaderId}.pdf`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(downloadUrl);
        }
      }
    } catch (err) {
      console.error("Error downloading all receipts", err);
      alert("Failed to download some receipts");
    } finally {
      setLoading("allBills", false);
    }
  };

  // Print all billing receipts
  const printAllBillingReceipts = async () => {
    setLoading("printing", "all-bills");
    
    try {
      for (const bp of billPayments) {
        const url = `${ALL_REPORTS}/opdReport?visit=${bp.visitId}&flag=p`;
        const response = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/pdf" },
        });

        if (!response.ok) {
          console.error(`Failed to print receipt for visit ${bp.visitId}`);
        }
      }
    } catch (err) {
      console.error("Error printing all receipts", err);
      alert("Failed to print some receipts");
    } finally {
      setLoading("printing", null);
    }
  };

  // Check if a specific button is loading
  const isGenerating = (visitId, type) => 
    loadingStates.generating === `${type}-${visitId}`;
  
  const isPrinting = (visitId, type) => 
    loadingStates.printing === `${type}-${visitId}`;

  return (
    <div className="body d-flex py-3">
      <div className="container-xxl">
        <div className="text-center mb-4">
          <h3 className="fw-bold text-primary">Payment Confirmation</h3>
        </div>

        <div className="row">
          <div className="col-lg-10 col-xl-8 mx-auto">
            <div className="card shadow-lg border-0">
              <div className="card-body p-4 p-md-5">
                <div className="text-center mb-4">
                  <div
                    className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center"
                    style={{ width: "100px", height: "100px" }}
                  >
                    <i
                      className="fa fa-check-circle text-success"
                      style={{ fontSize: "3.5rem" }}
                    ></i>
                  </div>
                  <h4 className="mt-3 fw-bold text-success">Payment Successful!</h4>
                  <p className="text-muted mb-0">
                    Your payment has been processed successfully
                  </p>
                </div>

                <div className="border border-success border-2 rounded-3 p-3 mb-4 text-center">
                  <p className="text-muted mb-1 small">Total Amount Paid</p>
                  <h2 className="text-success fw-bold mb-0">₹{amount.toFixed(2)}</h2>
                </div>

                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <i className="fa fa-calendar-check text-primary me-2"></i>
                    <h5 className="mb-0 fw-bold">OPD Appointment Details</h5>
                  </div>

                  {billPayments.map((bp, index) => (
                    <div key={index} className="card border border-primary mb-3 shadow-sm">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <h6 className="fw-bold text-primary mb-2">
                              <i className="fa fa-file-medical me-2"></i>
                              Appointment #{index + 1}
                            </h6>
                          </div>
                          <span className="badge bg-success">Paid</span>
                        </div>

                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <i className="fa fa-hashtag text-muted me-2 mt-1"></i>
                              <div>
                                <small className="text-muted d-block">Token No</small>
                                <strong>{bp.tokenNo}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <i className="fa fa-user-md text-muted me-2 mt-1"></i>
                              <div>
                                <small className="text-muted d-block">Doctor Name</small>
                                <strong>{bp.doctorName}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <i className="fa fa-user text-muted me-2 mt-1"></i>
                              <div>
                                <small className="text-muted d-block">Patient Name</small>
                                <strong>{bp.patientName}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <i className="fa fa-rupee-sign text-muted me-2 mt-1"></i>
                              <div>
                                <small className="text-muted d-block">Amount Paid</small>
                                <strong className="text-success">₹{bp.netAmount.toFixed(2)}</strong>
                              </div>
                            </div>
                          </div>
                        </div>

                        <hr className="my-3" />

                        <div className="d-flex justify-content-center gap-3 flex-wrap">
                          {/* Token Buttons */}
                          <div className="d-flex flex-column align-items-center gap-2">
                            <button
                              className="btn btn-primary d-flex align-items-center gap-2"
                              onClick={() => handleViewDownloadToken(bp.visitId)}
                              disabled={loadingStates.generating || loadingStates.printing}
                            >
                              {isGenerating(bp.visitId, "token") ? (
                                <>
                                  <span className="spinner-border spinner-border-sm" role="status"></span>
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <i className="fa fa-eye"></i> View/Download Token
                                </>
                              )}
                            </button>
                            
                            <button
                              className="btn btn-warning d-flex align-items-center gap-2"
                              onClick={() => handlePrintToken(bp.visitId)}
                              disabled={loadingStates.generating || loadingStates.printing}
                            >
                              {isPrinting(bp.visitId, "token") ? (
                                <>
                                  <span className="spinner-border spinner-border-sm" role="status"></span>
                                  Printing...
                                </>
                              ) : (
                                <>
                                  <i className="fa fa-print"></i> Print Token
                                </>
                              )}
                            </button>
                          </div>

                          {/* Bill Buttons */}
                          <div className="d-flex flex-column align-items-center gap-2">
                            <button
                              className="btn btn-success d-flex align-items-center gap-2"
                              onClick={() => handleViewDownloadBill(bp.visitId)}
                              disabled={loadingStates.generating || loadingStates.printing}
                            >
                              {isGenerating(bp.visitId, "bill") ? (
                                <>
                                  <span className="spinner-border spinner-border-sm" role="status"></span>
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <i className="fa fa-eye"></i> View/Download Bill
                                </>
                              )}
                            </button>
                            
                            <button
                              className="btn btn-warning d-flex align-items-center gap-2"
                              onClick={() => handlePrintBill(bp.visitId)}
                              disabled={loadingStates.generating || loadingStates.printing}
                            >
                              {isPrinting(bp.visitId, "bill") ? (
                                <>
                                  <span className="spinner-border spinner-border-sm" role="status"></span>
                                  Printing...
                                </>
                              ) : (
                                <>
                                  <i className="fa fa-print"></i> Print Bill
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="d-flex justify-content-center gap-3 flex-wrap pt-3 border-top">
                  <button
                    className="btn btn-primary d-flex align-items-center gap-2"
                    onClick={downloadAllBillingReceipts}
                    disabled={loadingStates.allBills || loadingStates.generating || loadingStates.printing}
                  >
                    {loadingStates.allBills ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        Generating...
                      </>
                    ) : (
                      <>
                        <i className="fa fa-file-invoice me-2"></i>
                        Download All Bills
                      </>
                    )}
                  </button>

                  <button
                    className="btn btn-warning d-flex align-items-center gap-2"
                    onClick={printAllBillingReceipts}
                    disabled={loadingStates.printing === "all-bills" || loadingStates.generating || loadingStates.printing}
                  >
                    {loadingStates.printing === "all-bills" ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        Printing...
                      </>
                    ) : (
                      <>
                        <i className="fa fa-print me-2"></i>
                        Print All Bills
                      </>
                    )}
                  </button>

                  <button
                    className="btn btn-secondary d-flex align-items-center gap-2"
                    onClick={() => navigate("/PendingForBilling")}
                  >
                    <i className="fa fa-arrow-left me-2"></i>
                    Back to Billing
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
          name="OPD Receipt"
          onClose={() => setPdfUrl(null)}
        />
      )}
    </div>
  );
};

export default OpdPaymentSuccess;