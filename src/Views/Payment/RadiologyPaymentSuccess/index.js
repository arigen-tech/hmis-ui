import { useLocation, useNavigate } from "react-router-dom";
import { ALL_REPORTS } from "../../../config/apiConfig";
import { useState } from "react";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";

const RadiologyPaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const { amount = 0, paymentResponse } = location.state || {};
  const billNo = paymentResponse?.response?.billNo;
  const paymentStatus = paymentResponse?.response?.paymentStatus;

  const generateRadiologyReport = async (flag = "d") => {
    if (!billNo || !paymentStatus) {
      alert("Missing bill number or payment status");
      return;
    }

    setIsGeneratingPDF(true);
    setPdfUrl(null);

    try {
      const radOrderDtId = paymentResponse?.response?.radOrderDtId;

      const url = `${ALL_REPORTS}/radiologyReport?radOrderDtId=${radOrderDtId}&flag=${flag}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/pdf" },
      });

      if (!response.ok) throw new Error("PDF failed");

      const blob = await response.blob();
      const fileURL = window.URL.createObjectURL(blob);
      setPdfUrl(fileURL);
    } catch (err) {
      console.error(err);
      alert("Failed to generate receipt");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = async () => {
    if (!billNo || !paymentStatus) {
      alert("Missing data");
      return;
    }

    setIsPrinting(true);

    try {
      const url = `${ALL_REPORTS}/radiologyReport?billNo=${encodeURIComponent(
        billNo,
      )}&paymentStatus=${encodeURIComponent(paymentStatus)}&flag=p`;

      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/pdf" },
      });

      if (response.status !== 200) {
        alert("Print failed");
      }
    } catch (err) {
      console.error(err);
      alert("Print failed");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="body d-flex py-3">
      <div className="container-xxl">

        <div className="col-md-8 mx-auto">
          <div className="card">
            <div className="card-body text-center">
              <i
                className="fa fa-check-circle text-success mb-3"
                style={{ fontSize: "4rem" }}
              ></i>

              <h4>Payment Successful!</h4>
              <p className="text-muted">
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
                  className="btn btn-primary"
                  onClick={() => generateRadiologyReport("d")}
                  disabled={isGeneratingPDF}
                >
                  {isGeneratingPDF ? "Generating..." : "VIEW/DOWNLOAD"}
                </button>

                <button
                  className="btn btn-warning"
                  onClick={handlePrint}
                  disabled={isPrinting}
                >
                  {isPrinting ? "Printing..." : "PRINT"}
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => navigate("/PendingForRadiologyBilling")}
                >
                  Back to Radiology Pending Billing
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {pdfUrl && (
        <PdfViewer
          pdfUrl={pdfUrl}
          onClose={() => setPdfUrl(null)}
          name={`Radiology Receipt - ${billNo}`}
        />
      )}
    </div>
  );
};

export default RadiologyPaymentSuccess;
