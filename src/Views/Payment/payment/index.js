import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Popup from "../../../Components/popup";
import { postRequest } from "../../../service/apiService";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    billingType,
    amount = 0,
    patientId,
    labData,
    selectedItems,
    paymentBreakdown,
    billingHeaderId, // SINGLE (LAB)
    billingHeaderIds, // MULTIPLE (OPD)
    investigationandPackegBillStatus,
    paymentData,
    opdData, // FULL OPD DATA
  } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [paymentReferenceNo, setPaymentReferenceNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);

  // Auto-generate payment ref no
  useEffect(() => {
    const generateRef = () => `PAY${Date.now()}${Math.floor(Math.random() * 999)}`;
    setPaymentReferenceNo(generateRef());

    console.log("=== PAYMENT PAGE RECEIVED ===");
    console.log("location.state:", location.state);
  }, []);

  const getUniversalBillHeaderIds = () => {
    let ids = [];

    // 1) Direct OPD multiple
    if (Array.isArray(billingHeaderIds)) {
      ids.push(...billingHeaderIds);
    }

    // 2) OPD inside opdData
    if (Array.isArray(opdData?.billingHeaderIds)) {
      ids.push(...opdData.billingHeaderIds);
    }

    // 3) Appointments billinghdid
    if (Array.isArray(opdData?.appointments)) {
      opdData.appointments.forEach((appt) => {
        const id =
          appt.billinghdid ||
          appt.billingHdId ||
          appt.billingHeaderId;
        if (id) ids.push(id);
      });
    }

    // 4) LAB single billing header
    if (billingHeaderId) ids.push(billingHeaderId);
    if (labData?.response?.billinghdId) ids.push(labData.response.billinghdId);
    if (labData?.response?.billHeaderId) ids.push(labData.response.billHeaderId);
    if (paymentData?.billHeaderId) ids.push(paymentData.billHeaderId);

    ids = Array.from(new Set(ids)); // remove duplicates
    return ids;
  };


  const prepareInvestigationAndPackageStatus = () => {
    if (investigationandPackegBillStatus?.length)
      return investigationandPackegBillStatus;

    if (paymentData?.investigationandPackegBillStatus)
      return paymentData.investigationandPackegBillStatus;

    if (Array.isArray(selectedItems)) return selectedItems;

    const list = [];
    selectedItems?.investigations?.forEach(({ id }) =>
      list.push({ id, type: "i" })
    );
    selectedItems?.packages?.forEach(({ id }) =>
      list.push({ id, type: "p" })
    );
    return list;
  };

  const handlePayment = async () => {
    try {
      if (paymentMethod !== "cash" && !paymentDetails.trim()) {
        Swal.fire("Error!", "Please enter payment details", "error");
        return;
      }

      const billHeaderIdsList = getUniversalBillHeaderIds();

      if (!billHeaderIdsList.length) {
        Swal.fire("Error!", "Billing Header IDs not found.", "error");
        return;
      }

      const paymentUpdateRequest = {
        billHeaderIds: billHeaderIdsList.map(Number),
        amount: Number(amount),
        mode: paymentMethod,
        paymentReferenceNo,
        investigationandPackegBillStatus: prepareInvestigationAndPackageStatus(),

        opdBillPayments: billingType === "Consultation Services"
          ? buildOpdBillPayments()
          : [],

        isPaymentUpdate: true,
        shouldNotCreateNewBilling: true,
        useExistingBillingHeader: true,
        patientId,
        billingType,
      };
      if (billingType === "Laboratory Services") {
        paymentUpdateRequest.billHeaderId = Number(billingHeaderId);
        delete paymentUpdateRequest.billHeaderIds;  // remove multiple ids
      }


      if (paymentMethod !== "cash") {
        paymentUpdateRequest.paymentDetails = paymentDetails;
      }

      console.log("=== PAYMENT REQUEST (FINAL) ===", paymentUpdateRequest);

      await proceedWithPayment(paymentUpdateRequest);
    } catch (err) {
      console.error(err);
      Swal.fire("Error!", "Failed to start payment", "error");
    }
  };

  const buildOpdBillPayments = () => {
    if (!opdData?.appointments) return [];

    return opdData.appointments.map((appt) => ({
      billHeaderId: Number(appt.billinghdid || appt.billingHdId),
      netAmount: Number(
        appt.totalAmount ?? appt.netAmount ?? 0
      )
    }));
  };

  const proceedWithPayment = async (paymentRequest) => {
    try {
      setLoading(true);

      const enhancedPaymentRequest = {
        ...paymentRequest,
        operationType: "payment_update_only",
        timestamp: new Date().toISOString(),
      };

      const response = await postRequest(
        "/lab/updatepaymentstatus",
        enhancedPaymentRequest
      );

      console.log("=== PAYMENT RESPONSE ===", response);

      if (response?.status === 200 && response?.response?.msg === "Success") {
        handlePaymentSuccess(response, enhancedPaymentRequest);
      } else {
        throw new Error(
          response?.response?.msg || "Payment API failed"
        );
      }
    } catch (err) {
      console.error("PAYMENT ERROR", err);
      Swal.fire("Error!", err.message, "error");
    } finally {
      setLoading(false);
    }
  };


  const handlePaymentSuccess = (response, request) => {
    setPopupMessage({
      message: "Payment Successful!",
      type: "success",
      onClose: () => {
        setPopupMessage(null);
        navigateToSuccessPage(response, request);
      },
    });
  };


  const navigateToSuccessPage = (response, request) => {
    navigate(
      billingType === "Consultation Services"
        ? "/opd-payment-success"
        : "/lab-payment-success",
      {
        state: {
          billingType,
          amount: request.amount,
          paymentMethod: request.mode,
          paymentReferenceNo: request.paymentReferenceNo,
          billNo: response?.response?.billNo,
          paymentStatus: response?.response?.paymentStatus,
          billHeaderIds: request.billHeaderIds,
          patientId,
          paymentResponse: response,
        },
      }
    );
  };


  const handleCancel = () => {
    Swal.fire({
      title: "Cancel Payment?",
      text: "Do you want to cancel?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
    }).then((res) => {
      if (res.isConfirmed) navigate(-1);
    });
  };

  const finalBillHeaders = getUniversalBillHeaderIds();

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-header bg-primary text-white text-center">
              <h4>
                <i className="fa fa-credit-card me-2"></i>
                Complete Payment
              </h4>
            </div>

            <div className="card-body">
              <div className="mb-4 p-3 bg-light rounded">
                <h6 className="fw-bold mb-2">Payment Summary</h6>

                <div className="d-flex justify-content-between">
                  <span>Total Amount:</span>
                  <span className="fw-bold text-success fs-5">₹{amount}</span>
                </div>

                <div className="d-flex justify-content-between mt-1">
                  <span>Reference No:</span>
                  <span>{paymentReferenceNo}</span>
                </div>

                <div className="d-flex justify-content-between mt-1">
                  <span>Billing Header IDs:</span>
                  <span>{finalBillHeaders.join(", ")}</span>
                </div>

                {billingType !== "Consultation Services" && (
                  <div className="d-flex justify-content-between mt-1">
                    <span>Items:</span>
                    <span>
                      {prepareInvestigationAndPackageStatus().length} items
                    </span>
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label className="fw-bold">Payment Method *</label>
                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
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
                  />
                </div>
              )}

              <div className="d-grid gap-2">
                <button
                  className="btn btn-success btn-lg"
                  onClick={handlePayment}
                  disabled={!finalBillHeaders.length || loading}
                >
                  {loading ? "Processing..." : `Pay ₹${amount}`}
                </button>

                <button
                  className="btn btn-outline-secondary"
                  onClick={handleCancel}
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
