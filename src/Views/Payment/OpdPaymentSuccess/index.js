import { useLocation, useNavigate } from "react-router-dom";
import { ALL_REPORTS } from "../../../config/apiConfig";

const OpdPaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    amount = 0,
    paymentResponse,
    billHeaderIds = [],
  } = location.state || {};

  const billPayments = paymentResponse?.response?.billPayments || [];

  const handleDownloadSingle = async (visitId, billHeaderId) => {
    if (!visitId) {
      alert("Visit ID missing for receipt.");
      return;
    }

    try {
      const url = `${ALL_REPORTS}/opdReport?visit=${visitId}`;

      console.log("Downloading:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/pdf" },
      });

      if (!response.ok) throw new Error("Failed to download receipt");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `OPD_Receipt_${billHeaderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error(error);
      alert("Failed to download receipt.");
    }
  };

  const handleDownloadAll = async () => {
    for (const bp of billPayments) {
      await handleDownloadSingle(bp.visitId, bp.billHeaderId);
    }
  };

  const handleBack = () => {
    navigate("/PendingForBilling");
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
          <div className="col-md-10 mx-auto">
            <div className="card">
              <div className="card-body text-center">
                <div className="mb-4">
                  <i className="fa fa-check-circle text-success" style={{ fontSize: "4rem" }}></i>
                </div>

                <h4 className="mb-3">Payment Successful!</h4>

                <p className="text-muted mb-4">
                  Total Payment of <strong>₹{amount.toFixed(2)}</strong> has been processed successfully.
                </p>

                <div className="bg-light p-3 rounded mb-4">
                  <h5 className="mb-3">OPD Appointment Payments</h5>

                  {billPayments.map((bp, index) => (
                    <div key={index} className="border rounded p-3 mb-3 text-start">
                      <p className="mb-1"><strong>Appointment #{index + 1}</strong></p>
                      <p className="mb-1">Bill Header ID: {bp.billHeaderId}</p>
                      <p className="mb-1">Visit ID: {bp.visitId}</p>
                      <p className="mb-1">Amount Paid: ₹{bp.netAmount.toFixed(2)}</p>

                      <button
                        className="btn btn-primary btn-sm mt-2"
                        onClick={() => handleDownloadSingle(bp.visitId, bp.billHeaderId)}
                      >
                        Download Receipt
                      </button>
                    </div>
                  ))}
                </div>

                <div className="d-flex justify-content-center gap-3">
                  <button className="btn btn-success" onClick={handleDownloadAll}>
                    Download All Receipts
                  </button>

                  <button className="btn btn-secondary" onClick={handleBack}>
                    Back to Billing Page
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