import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const LabPaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { amount = 0, patientId, labData } = location.state || {};

  const handleDownloadReceipt = () => {
    console.log("Downloading receipt...");
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
                {/* Success Icon */}
                <div className="mb-4">
                  <i className="fa fa-check-circle text-success" style={{ fontSize: "4rem" }}></i>
                </div>

                {/* Success Message */}
                <h4 className="mb-3">Payment Successful!</h4>
                <p className="text-muted mb-4">
                  Your payment of ₹{amount.toFixed(2)} has been processed successfully.
                </p>

                {/* Amount Details */}
                <div className="bg-light p-3 rounded mb-4">
                  <h5 className="mb-3">Payment Details</h5>
                  <div className="row justify-content-center">
                    <div className="col-sm-6">
                      <p className="mb-2">
                        <strong>Amount Paid:</strong> ₹{amount.toFixed(2)}
                      </p>
                      <p className="mb-2">
                        <strong>Transaction ID:</strong> {labData?.id || "N/A"}
                      </p>
                      <p className="mb-0">
                        <strong>Patient ID:</strong> {patientId || "Rakesh Kumar"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
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