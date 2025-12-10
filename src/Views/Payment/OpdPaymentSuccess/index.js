import { useLocation, useNavigate } from "react-router-dom";
import { ALL_REPORTS } from "../../../config/apiConfig";

const OpdPaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    amount = 0,
    paymentResponse,
  } = location.state || {};

  const billPayments = paymentResponse?.response?.billPayments || [];

  const downloadTokenReceipt = async (visitId, tokenNo) => {
    if (!visitId) return alert("Visit ID missing!");

    try {
      const url = `${ALL_REPORTS}/opdToken?visit=${visitId}`;


      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/pdf" },
      });


      if (!response.ok) throw new Error("Failed to download token");


      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;

      link.download = `Opd_Token_${tokenNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);


    } catch (err) {
      console.error(err);
      alert("Token receipt download failed.");
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

        <div className="text-center mb-4">
          <h3 className="fw-bold">Payment Success</h3>
        </div>
        <div className="row">
          <div className="col-md-10 mx-auto">
            <div className="card">
              <div className="card-body text-center">
                <i className="fa fa-check-circle text-success" style={{ fontSize: "4rem" }}></i>                <h4 className="mt-3">Payment Successful!</h4>
                <p className="text-muted">
                  Total Payment of <strong>₹{amount.toFixed(2)}</strong> processed successfully.
                </p>
                <div className="bg-light p-3 rounded mb-4">
                  <h5>OPD Appointment Payments</h5>
                  {billPayments.map((bp, index) => (
                    <div key={index} className="border rounded p-3 mb-3 text-start">
                      <p><strong>Appointment #{index + 1}</strong></p>
                      <p>Token No: {bp.tokenNo}</p>
                      <p>Doctor Name: {bp.doctorName}</p>
                      <p>Patient Name: {bp.patientName}</p>
                      <p>Amount Paid: ₹{bp.netAmount.toFixed(2)}</p>
                      <button
                        className="btn btn-primary btn-sm me-2"
                        onClick={() => downloadTokenReceipt(bp.visitId, bp.tokenNo)}
                      >
                        Token Receipt
                      </button>

                    </div>
                  ))}
                </div>
                <div className="d-flex justify-content-center gap-3">
                  <button className="btn btn-success" onClick={downloadAllBillingReceipts}>
                    Download Bill
                  </button>
                  <button className="btn btn-secondary" onClick={() => navigate("/PendingForBilling")}>
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
