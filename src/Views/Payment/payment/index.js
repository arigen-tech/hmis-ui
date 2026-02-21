import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Popup from "../../../Components/popup";
import { postRequest } from "../../../service/apiService";
import { UPDATE_PATIENT_STATUS } from "../../../config/apiConfig";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract only the needed data
  const {
    billingType,
    amount = 0,
    patientId,
    labData,
    selectedItems,
    billingHeaderId,
    billingHeaderIds,
    investigationandPackegBillStatus,
    paymentData,
    opdData,
    registrationCost,
  } = location.state || {};


  // Treat Consultation Services same as LAB
  const isConsultation =
    (billingType || "").toLowerCase() === "consultation services";

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [paymentReferenceNo, setPaymentReferenceNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);

  // Generate payment reference no
  useEffect(() => {
    setPaymentReferenceNo(`PAY${Date.now()}${Math.floor(Math.random() * 999)}`);

    console.log("=== PAYMENT PAGE DATA ===");
    console.log(location.state);
  }, []);

  // Get Single Bill Header (LAB + Consultation)
  const getBillHeaderId = () => {
    if (billingHeaderId) return Number(billingHeaderId);
    if (labData?.response?.billinghdId) return Number(labData.response.billinghdId);
    if (labData?.response?.billHeaderId) return Number(labData.response.billHeaderId);
    if (paymentData?.billHeaderId) return Number(paymentData.billHeaderId);

    return null;
  };

  // normalize incoming OPD IDs to use in payload
  const normalizedBillHeaderIds = Array.isArray(billingHeaderIds)
    ? billingHeaderIds
    : billingHeaderIds
      ? [billingHeaderIds]
      : [];

  // build opdBillPayments from opdData.appointments (backend expects this)
  const buildOpdBillPayments = () => {
    return (opdData?.appointments || []).map(appt => ({
      billHeaderId: Number(appt.billinghdid || appt.billingHdId || appt.billingHeaderId),
      netAmount: Number(appt.netAmount || appt.netAmount || 0)
    })).filter(p => p.billHeaderId); // remove entries without id
  };


  // Prepare items list (investigations / packages)
  const prepareInvestigationAndPackageStatus = () => {
    if (investigationandPackegBillStatus?.length)
      return investigationandPackegBillStatus;

    if (paymentData?.investigationandPackegBillStatus)
      return paymentData.investigationandPackegBillStatus;

    // New structure (array)
    if (Array.isArray(selectedItems)) return selectedItems;

    // Old structure
    const statusList = [];
    selectedItems?.investigations?.forEach((e) =>
      statusList.push({ id: e.id, type: "i" })
    );
    selectedItems?.packages?.forEach((e) =>
      statusList.push({ id: e.id, type: "p" })
    );

    return statusList;
  };

  // Payment Handler
  const handlePayment = async () => {
    try {
      if (paymentMethod !== "cash" && !paymentDetails.trim()) {
        Swal.fire("Error", "Please enter payment details", "error");
        return;
      }

      let billId = getBillHeaderId();

      if (!billId && Array.isArray(billingHeaderIds) && billingHeaderIds.length > 0) {
        billId = billingHeaderIds[0];
      }

      if (!billId) {
        Swal.fire("Error", "Bill Header ID missing", "error");
        return navigate(-1);
      }

      let paymentRequest;

      if (isConsultation) {
        const opdBillPayments = buildOpdBillPayments();

        // Validate OPD payload
        if (!Array.isArray(normalizedBillHeaderIds) || normalizedBillHeaderIds.length === 0 || opdBillPayments.length === 0) {
          Swal.fire("Error", "OPD billing IDs or appointments missing", "error");
          return;
        }

        paymentRequest = {
          billingType,
          billHeaderIds: normalizedBillHeaderIds,   // NOTE: backend field name 'billHeaderIds'
          opdBillPayments,                           // backend expects this array
          amount: Number(amount),
          mode: paymentMethod,
          paymentReferenceNo,
          isPaymentUpdate: true,
          shouldNotCreateNewBilling: true,
          useExistingBillingHeader: true,
          patientId,
          registrationCost,
        };
      } else {
        paymentRequest = {
          billingType,
          billHeaderId: billId,
          amount: Number(amount),
          mode: paymentMethod,
          paymentReferenceNo,
          investigationandPackegBillStatus: prepareInvestigationAndPackageStatus(),
          isPaymentUpdate: true,
          shouldNotCreateNewBilling: true,
          useExistingBillingHeader: true,
          patientId
        };
      }



      if (paymentMethod !== "cash") {
        paymentRequest.paymentDetails = paymentDetails;
      }

      console.log("=== FINAL PAYMENT REQUEST ===", paymentRequest);
      await proceedWithPayment(paymentRequest);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to initiate payment", "error");
    }
  };

  // Payment API Call
  const proceedWithPayment = async (paymentRequest) => {
    try {
      setLoading(true);

      const finalData = {
        ...paymentRequest,
        timestamp: new Date().toISOString(),
        operationType: "payment_update_only",
      };

      let response;
      // Always call LAB API (Consultation also handled same way)
      if (finalData.billingType === "Consultation Services") {
         response = await postRequest(
          `${UPDATE_PATIENT_STATUS}`,
          finalData
        );
      } else {
         response = await postRequest(
          "/lab/updatepaymentstatus",
          finalData
        );
      }


      console.log("=== PAYMENT RESPONSE ===", response);

      if (response?.status === 200 && response?.response?.msg === "Success") {
        navigateToSuccessPage(response, finalData);
      } else {
        throw new Error(
          response?.response?.msg || "Payment API Failed"
        );
      }
    } catch (err) {
      Swal.fire("Payment Error", err.message, "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  // Success Navigation
  const navigateToSuccessPage = (response, request) => {
    const isOpd = billingType?.toLowerCase() === "consultation services";

    const successPage = isOpd
      ? "/opd-payment-success"
      : "/lab-payment-success";
    navigate(successPage, {
      state: {
        billingType,
        amount: request.amount,
        paymentMethod: request.mode,
        paymentReferenceNo: request.paymentReferenceNo,
        patientId,
        billNo: response?.response?.billNo,
        paymentStatus: response?.response?.paymentStatus,
        paymentResponse: response,
      },
    });
  };

  const currentBillHeaderId = getBillHeaderId();
  const investigationStatus = prepareInvestigationAndPackageStatus();

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-header text-center bg-primary text-white">
              <h4 className="mb-0">
                <i className="fa fa-credit-card me-2"></i>
                Complete Your Payment
              </h4>
            </div>

            <div className="card-body">
              <div className="mb-4 p-3   rounded">
                <h6 className="fw-bold mb-2">Payment Summary</h6>

                <div className="d-flex justify-content-between">
                  <span>Total Amount:</span>
                  <span className="fw-bold text-success fs-5">₹{amount}</span>
                </div>

                <div className="d-flex justify-content-between mt-1">
                  <span>Reference No:</span>
                  <span>{paymentReferenceNo}</span>
                </div>

                {billingType?.toLowerCase() !== "consultation services" && (
                  <div className="d-flex justify-content-between mt-1">
                    <span>Bill Header ID:</span>
                    <span>{currentBillHeaderId || "Not found"}</span>
                  </div>
                )}
                {billingType?.toLowerCase() !== "consultation services" && (
                  <div className="d-flex justify-content-between mt-1">
                    <span>Items to update:</span>
                    <span>{investigationStatus.length} items</span>
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label className="fw-bold">Payment Method *</label>
                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={loading}
                >
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="netbanking">Net Banking</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              {paymentMethod !== "cash" && (
                <div className="mb-3">
                  <label className="fw-bold">
                    {paymentMethod === "card"
                      ? "Card Number"
                      : paymentMethod === "upi"
                        ? "UPI ID"
                        : "Account Details"}
                  </label>
                  <input
                    className="form-control"
                    value={paymentDetails}
                    onChange={(e) => setPaymentDetails(e.target.value)}
                    disabled={loading}
                  />
                </div>
              )}

              <div className="d-grid gap-2">
                <button
                  className="btn btn-success btn-lg"
                  onClick={handlePayment}
                  disabled={
                    loading ||
                    (!isConsultation && !currentBillHeaderId) ||
                    (isConsultation && (!billingHeaderIds || billingHeaderIds.length === 0))
                  }>
                  {loading ? "Processing..." : `Pay ₹${amount}`}
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}
    </div>
  );
};

export default PaymentPage;
