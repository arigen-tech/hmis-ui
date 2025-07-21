import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ALL_REPORTS } from "../../../config/apiConfig";
const LabPaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { amount = 0, paymentResponse } = location.state || {};
  const billNo = paymentResponse?.response?.billNo;
  const paymentStatus = paymentResponse?.response?.paymentStatus;

  const handleDownloadReceipt = async () => {
    if (!billNo || !paymentStatus) {
      console.error("Missing bill number or payment status for receipt download.");
      return;
    }

    try {
      // ✅ Use exactly the returned status from backend!
      const url = `${ALL_REPORTS}/labReport?billNo=${encodeURIComponent(billNo)}&paymentStatus=${paymentStatus}`;

      console.log("Download URL:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to download receipt.");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `LabReceipt_${billNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error(error);
      alert("Failed to download receipt.");
    }
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

                <div className="bg-light p-3 rounded mb-4">
                  <h5 className="mb-3">Payment Details</h5>
                  <div className="row justify-content-center">
                    <div className="col-sm-6">
                      {/* <p className="mb-2">
                        <strong>Bill No:</strong> {billNo || "N/A"}
                      </p> */}
                      {/* <p className="mb-2">
                        <strong>Payment Status:</strong> {paymentStatus || "N/A"}
                      </p> */}
                      <p className="mb-2">
                        <strong>Amount Paid:</strong> ₹{amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-center gap-3">
                  <button
                    className="btn btn-primary d-flex align-items-center gap-2"
                    onClick={handleDownloadReceipt}
                  >
                    Download Receipt
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
    </div>
  );
};

export default LabPaymentSuccess;
