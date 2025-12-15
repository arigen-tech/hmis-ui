import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";
import { ALL_REPORTS } from "../../../config/apiConfig";




const OpdPaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [pdfUrl, setPdfUrl] = useState(null);

  const {
    amount = 0,
    paymentResponse,
  } = location.state || {};

  const billPayments = paymentResponse?.response?.billPayments || [];

  const viewTokenReceipt = async (visitId) => {
    try {
      const url = `${ALL_REPORTS}/opdToken?visit=${visitId}`;

      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/pdf" },
      });

      if (!response.ok) throw new Error("Failed");

      const blob = await response.blob();
      const fileURL = window.URL.createObjectURL(blob);
      setPdfUrl(fileURL);
    } catch (err) {
      alert("Unable to open token receipt");
    }
  };
  const viewBillReceipt = async (visitId) => {
    try {
      const url = `${ALL_REPORTS}/opdReport?visit=${visitId}`;

      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/pdf" },
      });

      if (!response.ok) throw new Error("Failed");

      const blob = await response.blob();
      const fileURL = window.URL.createObjectURL(blob);
      setPdfUrl(fileURL);
    } catch (err) {
      alert("Unable to open bill receipt");
    }
  };



  const downloadBillingReceipt = async (visitId, billHeaderId) => {
    if (!visitId) return alert("Visit ID missing!");

    try {
      const url = `${ALL_REPORTS}/opdReport?visit=${visitId}`;

      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/pdf" },
      });

      if (!response.ok) throw new Error("Failed to download billing receipt");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `Opd_Receipt_${billHeaderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
      alert("Billing receipt download failed.");
    }
  };

  const downloadAllBillingReceipts = async () => {
    for (const bp of billPayments) {
      await downloadBillingReceipt(bp.visitId, bp.billHeaderId);
    }
  };

  return (
    <div className="body d-flex py-3">
      <div className="container-xxl">
        {/* Success Header */}
        <div className="text-center mb-4">
          <h3 className="fw-bold text-primary">Payment Confirmation</h3>
        </div>

        {/* Main Card */}
        <div className="row">
          <div className="col-lg-10 col-xl-8 mx-auto">
            <div className="card shadow-lg border-0">
              <div className="card-body p-4 p-md-5">
                {/* Success Icon */}
                <div className="text-center mb-4">
                  <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center"
                    style={{ width: "100px", height: "100px" }}>
                    <i className="fa fa-check-circle text-success" style={{ fontSize: "3.5rem" }}></i>
                  </div>
                  <h4 className="mt-3 fw-bold text-success">Payment Successful!</h4>
                  <p className="text-muted mb-0">
                    Your payment has been processed successfully
                  </p>
                </div>

                {/* Amount Display */}
                <div className="bg-light border border-success border-2 rounded-3 p-3 mb-4 text-center">
                  <p className="text-muted mb-1 small">Total Amount Paid</p>
                  <h2 className="text-success fw-bold mb-0">₹{amount.toFixed(2)}</h2>
                </div>

                {/* Appointments Section */}
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

                        <div className="d-flex gap-2 flex-wrap">
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => viewTokenReceipt(bp.visitId, bp.tokenNo)}
                          >
                            <i className="fa fa-download me-2"></i>
                            Show Token
                          </button>

                          <button
                            className="btn btn-outline-success btn-sm"
                            onClick={() => viewBillReceipt(bp.visitId)}
                          >
                            <i className="fa fa-file-invoice me-2"></i>
                            Show Bill
                          </button>
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
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="d-flex justify-content-center gap-3 flex-wrap pt-3 border-top">
                  <button
                    className="btn btn-success px-4 py-2"
                    onClick={downloadAllBillingReceipts}
                  >
                    <i className="fa fa-file-invoice me-2"></i>
                    Download All Bills
                  </button>
                  <button
                    className="btn btn-outline-secondary px-4 py-2"
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

    </div>
  );
};

export default OpdPaymentSuccess;