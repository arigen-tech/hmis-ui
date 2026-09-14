import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Popup from "../../../Components/popup";
import { postRequest, getRequest } from "../../../service/apiService";
import { loadRazorpayScript } from "../../../Components/LoadRazorpay";

import {
  OPD_SERVICE_CATAGORY,
  RADIOLOGY_SERVICE_CATAGORY,
  PROCESS_LAB_PAYMENT,
  PROCESS_OPD_PAYMENT,
  PROCESS_RADIOLOGY_PAYMENT,
  RAZORPAY_CREATE_ORDER,
  RAZORPAY_VERIFY,
  LAB_SERVICE_CATAGORY,
} from "../../../config/apiConfig";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ==========================================================
  // PAGE DATA
  // ==========================================================

  const {
    billingType,
    amount = 0,
    patientId,
    investigationData,
    selectedItems,
    billingHeaderId,
    billingHeaderIds,
    investigationandPackegBillStatus,
    paymentData,
    opdData,
    registrationCost,
  } = location.state || {};

  // ==========================================================
  // SERVICE TYPE
  // ==========================================================

  const isConsultation =
    billingType === OPD_SERVICE_CATAGORY;

  const isRadiology =
    billingType === RADIOLOGY_SERVICE_CATAGORY;

  // ==========================================================
  // STATE
  // ==========================================================

  const [paymentMethod, setPaymentMethod] =
    useState("CASH");

  const [loading, setLoading] =
    useState(false);

  const [popupMessage, setPopupMessage] =
    useState(null);

  const [paymentReferenceNo, setPaymentReferenceNo] =
    useState("");

  const [paymentGateways, setPaymentGateways] =
    useState([]);

  const [loadingGateways, setLoadingGateways] =
    useState(true);

  // ==========================================================
  // RAZORPAY PREFILL DATA (patient name / email / phone)
  // ==========================================================

  const [prefillData, setPrefillData] =
    useState({ patientFullName: "", email: "", phoneNumber: "" });

  // ==========================================================
  // INITIAL PAYMENT REFERENCE
  // ==========================================================

  useEffect(() => {
    setPaymentReferenceNo(
      `PAY${Date.now()}${Math.floor(Math.random() * 999)}`
    );

    console.log("=== PAYMENT PAGE DATA ===");
    console.log(location.state);
  }, [location.state]);

  // ==========================================================
  // GET PAYMENT GATEWAYS
  // ==========================================================

  useEffect(() => {
    const fetchPaymentGateways = async () => {
      try {
        const data = await getRequest(
          "/master/paymentGateway/getAll/1"
        );

        console.log(
          "Payment gateway response:",
          data
        );
        if (
          data?.status === 200 &&
          Array.isArray(data?.response)
        ) {
          setPaymentGateways(data.response);

          /*
           * Your API returns:
           *
           * {
           *   gatewayId: 1,
           *   gatewayCode: "RAZORPAY",
           *   gatewayName: "Razorpay"
           * }
           *
           * {
           *   gatewayId: 2,
           *   gatewayCode: "CASH",
           *   gatewayName: "Cash"
           * }
           */

          const defaultGateway =
            data.response.find(
              (gateway) =>
                gateway.gatewayCode === "CASH"
            ) || data.response[0];

          if (defaultGateway) {
            setPaymentMethod(
              defaultGateway.gatewayCode
            );
          }
        }
      } catch (error) {
        console.error(
          "Failed to fetch payment gateways:",
          error
        );

        // Fallback to CASH
        setPaymentMethod("CASH");
      } finally {
        setLoadingGateways(false);
      }
    };

    fetchPaymentGateways();
  }, []);

  // ==========================================================
  // GET RAZORPAY PREFILL DETAILS (patient name / email / phone)
  // ==========================================================
  //
  // Used so that when a refund is later issued for this payment,
  // Razorpay can notify the patient via the email/contact captured
  // at checkout time, instead of relying on blank/placeholder values.

  useEffect(() => {
    const fetchPrefillDetails = async () => {
      if (!patientId) {
        return;
      }

      try {
        const data = await getRequest(
          `/api/payments/razorpay-prefill/${patientId}`
        );

        console.log(
          "Razorpay prefill response:",
          data
        );

        if (
          data?.status === 200 &&
          data?.response
        ) {
          setPrefillData({
            patientFullName:
              data.response.patientFullName || "",
            email:
              data.response.email || "",
            phoneNumber:
              data.response.phoneNumber || "",
          });
        }
      } catch (error) {
        console.error(
          "Failed to fetch Razorpay prefill details:",
          error
        );
        // Non-blocking: checkout still works without prefill data
      }
    };

    fetchPrefillDetails();
  }, [patientId]);

  // ==========================================================
  // FORMAT INDIAN PHONE NUMBER FOR RAZORPAY (+91XXXXXXXXXX)
  // ==========================================================

  const formatIndianPhone = (phone) => {
    if (!phone) {
      return "";
    }

    const digitsOnly = phone.replace(/\D/g, "");

    if (digitsOnly.length === 10) {
      return `+91${digitsOnly}`;
    }

    if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
      return `+${digitsOnly}`;
    }

    return phone;
  };

  // ==========================================================
  // GET BILL HEADER ID
  // ==========================================================

  const getBillHeaderId = () => {
    if (billingHeaderId) {
      return Number(billingHeaderId);
    }

    if (
      Array.isArray(billingHeaderIds) &&
      billingHeaderIds.length > 0
    ) {
      const first =
        billingHeaderIds[0];

      if (
        typeof first === "object"
      ) {
        return Number(
          first.billingHdId ||
          first.billingHeaderId ||
          first.billHeaderId
        );
      }

      return Number(first);
    }

    if (
      investigationData?.response?.billinghdId
    ) {
      return Number(
        investigationData.response.billinghdId
      );
    }

    if (
      investigationData?.response?.billHeaderId
    ) {
      return Number(
        investigationData.response.billHeaderId
      );
    }

    if (paymentData?.billHeaderId) {
      return Number(
        paymentData.billHeaderId
      );
    }

    return null;
  };

  // ==========================================================
  // BUILD OPD BILL PAYMENTS
  // ==========================================================

  const buildOpdBillPayments = () => {
    return (opdData?.appointments || [])
      .map((appt) => ({
        billHeaderId: Number(
          appt.billinghdid ||
          appt.billingHdId ||
          appt.billingHeaderId
        ),

        netAmount: Number(
          appt.netAmount || 0
        ),
      }))
      .filter(
        (payment) =>
          payment.billHeaderId
      );
  };

  // ==========================================================
  // INVESTIGATION / PACKAGE STATUS
  // ==========================================================

  const prepareInvestigationAndPackageStatus = () => {
    if (
      investigationandPackegBillStatus?.length
    ) {
      return investigationandPackegBillStatus;
    }

    if (
      paymentData?.investigationandPackegBillStatus
    ) {
      return (
        paymentData.investigationandPackegBillStatus
      );
    }

    // New structure
    if (Array.isArray(selectedItems)) {
      return selectedItems;
    }

    // Old structure
    const statusList = [];

    selectedItems?.investigations?.forEach(
      (item) => {
        statusList.push({
          id: item.id,
          type: "i",
        });
      }
    );

    selectedItems?.packages?.forEach(
      (item) => {
        statusList.push({
          id: item.id,
          type: "p",
        });
      }
    );

    return statusList;
  };

  // ==========================================================
  // NORMALIZED RADIOLOGY IDS
  // ==========================================================

  const normalizedRadiologyIds =
    Array.isArray(billingHeaderIds)
      ? billingHeaderIds.map(Number)
      : billingHeaderIds
        ? [Number(billingHeaderIds)]
        : [];

  // ==========================================================
  // WAIT FOR WEBHOOK PAYMENT CONFIRMATION
  // ==========================================================

  const waitForPaymentConfirmation = async (
    paymentId
  ) => {
    /*
     * Webhook may take a little time to reach
     * our backend.
     *
     * Therefore:
     *
     * Attempt 1
     *   ↓
     * PENDING
     *   ↓
     * wait 2 sec
     *   ↓
     * Attempt 2
     *   ↓
     * ...
     *   ↓
     * PAID
     */

    const maxAttempts = 10;
    const pollingInterval = 30000;

    for (
      let attempt = 1;
      attempt <= maxAttempts;
      attempt++
    ) {
      try {
        console.log(
          `Checking payment status ${attempt}/${maxAttempts}`,
          paymentId
        );

        const response =
          await getRequest(
            `/api/payments/status/${paymentId}`
          );

        console.log(
          "Payment status response:",
          response
        );

        /*
         * Your backend returns PaymentGatewayStatusResponse
         *
         * {
         *   paymentId: 123,
         *   paymentStatus: "PAID",
         *   gatewayOrderId: "...",
         *   gatewayPaymentId: "...",
         *   amount: 1000,
         *   currency: "INR"
         * }
         *
         * getRequest normally returns the JSON
         * body directly.
         */

        const paymentStatus =
          response?.paymentStatus ||
          response?.response?.paymentStatus;

        console.log(
          "Current payment status:",
          paymentStatus
        );

        // ------------------------------------------------------
        // PAID
        // ------------------------------------------------------

        if (
          String(paymentStatus).toUpperCase() ===
          "PAID"
        ) {
          console.log(
            "Payment confirmed as PAID",
            response
          );

          return response;
        }

        // ------------------------------------------------------
        // FAILED
        // ------------------------------------------------------

        if (
          String(paymentStatus).toUpperCase() ===
          "FAILED"
        ) {
          throw new Error(
            "Payment failed."
          );
        }

        // ------------------------------------------------------
        // REFUNDED
        // ------------------------------------------------------

        if (
          String(paymentStatus).toUpperCase() ===
          "REFUNDED"
        ) {
          throw new Error(
            "Payment has already been refunded."
          );
        }

        // ------------------------------------------------------
        // PENDING
        // ------------------------------------------------------

        if (
          attempt < maxAttempts
        ) {
          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                pollingInterval
              )
          );
        }
      } catch (error) {
        console.error(
          "Payment status check failed:",
          error
        );

        throw error;
      }
    }

    throw new Error(
      "Payment is still pending. Please do not retry immediately. Check the payment status before making another payment."
    );
  };

  // ==========================================================
  // INITIATE RAZORPAY PAYMENT
  // ==========================================================

  const initiateRazorpayPayment = async () => {
    // --------------------------------------------------------
    // LOAD RAZORPAY SCRIPT
    // --------------------------------------------------------

    const scriptLoaded =
      await loadRazorpayScript();

    if (!scriptLoaded) {
      throw new Error(
        "Failed to load payment gateway. Check your internet connection."
      );
    }

    // --------------------------------------------------------
    // CREATE ORDER
    // --------------------------------------------------------
    //
    // We now pass billingType, billingHeaderIds and patientId
    // along with amount + billingHdId so that the backend can
    // create a payment record correctly for ALL service
    // categories (OPD / RADIOLOGY / LAB) instead of only LAB.

    const orderRes =
      await postRequest(
        RAZORPAY_CREATE_ORDER,
        {
          amount: Number(amount),
          billingHdId:
            currentBillHeaderId,
          billingType,
          billingHeaderIds:
            Array.isArray(billingHeaderIds)
              ? billingHeaderIds
              : billingHeaderIds
                ? [billingHeaderIds]
                : [],
          patientId,
        }
      );

    console.log(
      "=== CREATE ORDER RESPONSE ===",
      orderRes
    );

    if (!orderRes?.orderId) {
      throw new Error(
        "Could not create payment order."
      );
    }

    /*
     * IMPORTANT:
     *
     * Backend should return:
     *
     * paymentId
     *
     * from payment_details_v2.
     *
     * Example:
     *
     * {
     *   orderId: "order_xxx",
     *   amount: 100000,
     *   currency: "INR",
     *   paymentReferenceNo: "PAYxxx",
     *   paymentId: 123
     * }
     */

    if (!orderRes?.paymentId) {
      throw new Error(
        "Payment ID was not returned by create-order API."
      );
    }

    const paymentId =
      orderRes.paymentId;

    // --------------------------------------------------------
    // UPDATE REFERENCE DISPLAY
    // --------------------------------------------------------

    if (
      orderRes.paymentReferenceNo
    ) {
      setPaymentReferenceNo(
        orderRes.paymentReferenceNo
      );
    }

    // --------------------------------------------------------
    // OPEN RAZORPAY
    // --------------------------------------------------------

    return new Promise(
      (resolve, reject) => {
        const options = {
          key: (
            process.env
              .REACT_APP_RAZORPAY_KEY_ID ||
            ""
          ).trim(),

          amount:
            orderRes.amount,

          currency:
            orderRes.currency,

          name:
            "ARI-Hospital",

          description:
            `Payment for ${
              billingType || "Bill"
            }`,

          order_id:
            orderRes.orderId,

          // ==================================================
          // RAZORPAY SUCCESS HANDLER
          // ==================================================

          handler:
            async function (
              razorpayResponse
            ) {
              try {
                console.log(
                  "=== RAZORPAY CHECKOUT RESPONSE ===",
                  razorpayResponse
                );

                // ----------------------------------------------
                // VERIFY SIGNATURE
                // ----------------------------------------------

                const verifyRes =
                  await postRequest(
                    RAZORPAY_VERIFY,
                    {
                      razorpayOrderId:
                        razorpayResponse.razorpay_order_id,

                      razorpayPaymentId:
                        razorpayResponse.razorpay_payment_id,

                      razorpaySignature:
                        razorpayResponse.razorpay_signature,
                    }
                  );

                console.log(
                  "=== VERIFY RESPONSE ===",
                  verifyRes
                );

                /*
                 * Your verify API returns:
                 *
                 * {
                 *   status: "success"
                 * }
                 */

                if (
                  verifyRes?.status !==
                  "success"
                ) {
                  throw new Error(
                    "Payment verification failed."
                  );
                }

                // ----------------------------------------------
                // WAIT FOR WEBHOOK
                // ----------------------------------------------

                console.log(
                  "Signature verified. Waiting for webhook confirmation..."
                );

                const paymentStatus =
                  await waitForPaymentConfirmation(
                    paymentId
                  );

                console.log(
                  "=== PAYMENT CONFIRMED ===",
                  paymentStatus
                );

                /*
                 * Return Razorpay payment ID
                 * to handlePayment().
                 */

                resolve(
                  razorpayResponse
                    .razorpay_payment_id
                );
              } catch (error) {
                reject(error);
              }
            },

          // ==================================================
          // CHECKOUT DISMISSED
          // ==================================================

          modal: {
            ondismiss:
              function () {
                reject(
                  new Error(
                    "Payment cancelled by user."
                  )
                );
              },
          },

          // ==================================================
          // PREFILL
          // ==================================================
          //
          // Populated from /api/payments/razorpay-prefill/{patientId}
          // so Razorpay has the patient's real email/contact on
          // file. This is what lets Razorpay notify the patient
          // (refund mailer / RRN-ARN update mailer) when a refund
          // is later processed for this payment. The phone number
          // is formatted to E.164 (+91XXXXXXXXXX) as Razorpay
          // expects, since our backend stores it as a bare
          // 10-digit Indian number.

          prefill: {
            name: prefillData.patientFullName,
            email: prefillData.email,
            contact: formatIndianPhone(
              prefillData.phoneNumber
            ),
          },

          // ==================================================
          // THEME
          // ==================================================

          theme: {
            color: "#667eea",
          },
        };

        console.log(
          "=== RAZORPAY OPTIONS ===",
          options
        );

        const rzp =
          new window.Razorpay(
            options
          );

        // Optional Razorpay error event
        rzp.on(
          "payment.failed",
          function (
            response
          ) {
            console.error(
              "Razorpay payment.failed:",
              response
            );
          }
        );

        rzp.open();
      }
    );
  };

  // ==========================================================
  // MAIN PAYMENT HANDLER
  // ==========================================================

  const handlePayment = async () => {
    if (loading) {
      return;
    }

    try {
      let billId =
        getBillHeaderId();

      if (
        !billId &&
        Array.isArray(
          billingHeaderIds
        ) &&
        billingHeaderIds.length > 0
      ) {
        billId =
          Number(
            billingHeaderIds[0]
          );
      }

      if (!billId) {
        Swal.fire(
          "Error",
          "Bill Header ID missing",
          "error"
        );

        return navigate(-1);
      }

      // ======================================================
      // BUILD PAYMENT REQUEST
      // ======================================================

      let paymentRequest;

      // ======================================================
      // CONSULTATION / OPD
      // ======================================================

      if (isConsultation) {
        const opdBillPayments =
          buildOpdBillPayments();

        paymentRequest = {
          billingType,

          billingHeaderIds,

          opdBillPayments,

          amount:
            Number(amount),

          mode:
            paymentMethod ===
            "RAZORPAY"
              ? "online"
              : "cash",

          isPaymentUpdate:
            true,

          shouldNotCreateNewBilling:
            true,

          useExistingBillingHeader:
            true,

          patientId,

          registrationCost,
        };
      }

      // ======================================================
      // RADIOLOGY
      // ======================================================

      else if (isRadiology) {
        paymentRequest = {
          billingType,

          billHeaderId:
            billId,

          billingHeaderIds,

          amount:
            Number(amount),

          mode:
            paymentMethod ===
            "RAZORPAY"
              ? "online"
              : "cash",

          investigationandPackegBillStatus:
            prepareInvestigationAndPackageStatus(),

          isPaymentUpdate:
            true,

          shouldNotCreateNewBilling:
            true,

          useExistingBillingHeader:
            true,

          patientId,
        };
      }

      // ======================================================
      // LAB
      // ======================================================

      else {
        paymentRequest = {
          billingType,

          billHeaderId:
            billId,

          amount:
            Number(amount),

          mode:
            paymentMethod ===
            "RAZORPAY"
              ? "online"
              : "cash",

          investigationandPackegBillStatus:
            prepareInvestigationAndPackageStatus(),

          isPaymentUpdate:
            true,

          shouldNotCreateNewBilling:
            true,

          useExistingBillingHeader:
            true,

          patientId,
        };
      }

      // ======================================================
      // RAZORPAY  (works for OPD / RADIOLOGY / LAB)
      // ======================================================

      if (
        paymentMethod ===
        "RAZORPAY"
      ) {
        try {
          setLoading(true);

          console.log(
            "=== STARTING RAZORPAY PAYMENT ==="
          );

          /*
           * This method:
           *
           * 1. Creates Razorpay order
           * 2. Creates payment_details_v2 PENDING
           * 3. Opens Razorpay checkout
           * 4. Verifies signature
           * 5. Waits for payment.captured webhook
           * 6. Checks payment_details_v2
           * 7. Continues only when PAID
           */

          const razorpayPaymentId =
            await initiateRazorpayPayment();

          console.log(
            "Razorpay payment confirmed:",
            razorpayPaymentId
          );

          // --------------------------------------------------
          // ONLY NOW PROCESS BILLING (OPD / RADIOLOGY / LAB)
          // --------------------------------------------------

          paymentRequest.paymentReferenceNo =
            razorpayPaymentId;

          paymentRequest.mode =
            "online";

          await proceedWithPayment(
            paymentRequest
          );
        } catch (error) {
          console.error(
            "Razorpay payment error:",
            error
          );

          setLoading(false);

          Swal.fire(
            "Payment Failed",
            error?.message ||
              "Payment was not completed.",
            "error"
          );

          return;
        }
      }

      // ======================================================
      // CASH
      // ======================================================

      else {
        paymentRequest.paymentReferenceNo =
          paymentReferenceNo;

        await proceedWithPayment(
          paymentRequest
        );
      }
    } catch (error) {
      console.error(
        "Payment initiation error:",
        error
      );

      setLoading(false);

      Swal.fire(
        "Error",
        error?.message ||
          "Failed to initiate payment.",
        "error"
      );
    }
  };

  // ==========================================================
  // PROCESS LAB / OPD / RADIOLOGY PAYMENT
  // ==========================================================

  const proceedWithPayment =
    async (paymentRequest) => {
      try {
        setLoading(true);

        const finalData = {
          ...paymentRequest,

          timestamp:
            new Date().toISOString(),

          operationType:
            "payment_update_only",
        };

        console.log(
          "=== FINAL PAYMENT REQUEST ===",
          finalData
        );

        let response;

        // ------------------------------------------------------
        // OPD
        // ------------------------------------------------------

        if (
          finalData.billingType ===
          OPD_SERVICE_CATAGORY
        ) {
          response =
            await postRequest(
              PROCESS_OPD_PAYMENT,
              finalData
            );
        }

        // ------------------------------------------------------
        // RADIOLOGY
        // ------------------------------------------------------

        else if (
          finalData.billingType ===
          RADIOLOGY_SERVICE_CATAGORY
        ) {
          response =
            await postRequest(
              PROCESS_RADIOLOGY_PAYMENT,
              finalData
            );
        }

        // ------------------------------------------------------
        // LAB
        // ------------------------------------------------------

        else {
          response =
            await postRequest(
              PROCESS_LAB_PAYMENT,
              finalData
            );
        }

        console.log(
          "=== PROCESS PAYMENT RESPONSE ===",
          response
        );

        // ======================================================
        // SUCCESS
        // ======================================================

        if (
          response?.status === 200 &&
          response?.response?.msg ===
            "Success"
        ) {
          navigateToSuccessPage(
            response,
            finalData
          );
        } else {
          throw new Error(
            response?.response?.msg ||
              "Payment API failed."
          );
        }
      } catch (error) {
        console.error(
          "Payment processing error:",
          error
        );

        Swal.fire(
          "Payment Error",
          error?.message ||
            "Payment processing failed.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

  // ==========================================================
  // SUCCESS NAVIGATION
  // ==========================================================

  const navigateToSuccessPage = (
    response,
    request
  ) => {
    const isOpd =
      billingType ===
      OPD_SERVICE_CATAGORY;

    const isRadiology =
      billingType ===
      RADIOLOGY_SERVICE_CATAGORY;

    let successPage =
      "/lab_payment_success";

    if (isOpd) {
      successPage =
        "/opd_payment_success";
    } else if (isRadiology) {
      successPage =
        "/radiology_payment_success";
    }

    navigate(
      successPage,
      {
        state: {
          billingType,

          amount:
            request.amount,

          paymentMethod:
            request.mode,

          paymentReferenceNo:
            request.paymentReferenceNo,

          billingHeaderIds:
            response?.response
              ?.billHeaderIds ||
            response?.response
              ?.billingHeaderIds ||
            request.billingHeaderIds ||
            [],

          patientId,

          billNo:
            response?.response
              ?.billNo,

          paymentStatus:
            response?.response
              ?.paymentStatus,

          paymentResponse:
            response,

          paymentRequest:
            request,

          opdData,

          opdBillPayments:
            request.opdBillPayments ||
            [],

          source:
            location.state?.source ||
            "billing",
        },
      }
    );
  };

  // ==========================================================
  // CURRENT VALUES
  // ==========================================================

  const currentBillHeaderId =
    getBillHeaderId();

  const investigationStatus =
    prepareInvestigationAndPackageStatus();

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="container py-5">
      <div className="row justify-content-center">

        <div className="col-md-6">

          <div className="card shadow">

            {/* =================================================
                HEADER
            ================================================== */}

            <div className="card-header text-center bg-primary text-white">
              <h4 className="mb-0">
                <i className="fa fa-credit-card me-2"></i>
                Complete Your Payment
              </h4>
            </div>

            <div className="card-body">

              {/* ===============================================
                  PAYMENT SUMMARY
              ================================================ */}

              <div className="mb-4 p-3 rounded">

                <h6 className="fw-bold mb-2">
                  Payment Summary
                </h6>

                <div className="d-flex justify-content-between">
                  <span>
                    Total Amount:
                  </span>

                  <span className="fw-bold text-success fs-5">
                    ₹{amount}
                  </span>
                </div>

                <div className="d-flex justify-content-between mt-1">
                  <span>
                    Reference No:
                  </span>

                  <span>
                    {paymentReferenceNo}
                  </span>
                </div>

                <div className="d-flex justify-content-between mt-1">
                  <span>
                    Bill Header ID:
                  </span>

                  <span>
                    {currentBillHeaderId ||
                      "Not found"}
                  </span>
                </div>

                <div className="d-flex justify-content-between mt-1">
                  <span>
                    Items to update:
                  </span>

                  <span>
                    {
                      investigationStatus.length
                    }{" "}
                    items
                  </span>
                </div>

              </div>

              {/* ===============================================
                  PAYMENT METHOD
              ================================================ */}

              <div className="mb-3">

                <label className="fw-bold">
                  Payment Method *
                </label>

                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={(event) =>
                    setPaymentMethod(
                      event.target.value
                    )
                  }
                  disabled={
                    loading ||
                    loadingGateways
                  }
                >
                  {loadingGateways ? (
                    <option value="">
                      Loading...
                    </option>
                  ) : (
                    paymentGateways.map(
                      (gateway) => (
                        <option
                          key={
                            gateway.gatewayId
                          }
                          value={
                            gateway.gatewayCode
                          }
                        >
                          {
                            gateway.gatewayName
                          }
                        </option>
                      )
                    )
                  )}
                </select>

              </div>

              {/* ===============================================
                  RAZORPAY INFORMATION
              ================================================ */}

              {paymentMethod ===
                "RAZORPAY" && (
                <div className="mb-3">
                  <small className="text-muted">
                    You'll be redirected to a
                    secure Razorpay checkout to
                    complete this payment.
                  </small>
                </div>
              )}

              {/* ===============================================
                  BUTTONS
              ================================================ */}

              <div className="d-grid gap-2">
                <button
                  type="button"
                  className="btn btn-success btn-lg"
                  onClick={
                    handlePayment
                  }
                  disabled={
                    loading ||
                    loadingGateways ||
                    !currentBillHeaderId ||
                    ((billingType === LAB_SERVICE_CATAGORY || billingType === RADIOLOGY_SERVICE_CATAGORY) && investigationStatus.length === 0)
                  }
                >
                  {loading
                    ? "Processing..."
                    : `Pay ₹${amount}`}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() =>
                    navigate(-1)
                  }
                  disabled={
                    loading
                  }
                >
                  Cancel
                </button>

              </div>

            </div>
          </div>

        </div>
      </div>

      {/* =======================================================
          POPUP
      ======================================================== */}

      {popupMessage && (
        <Popup
          message={
            popupMessage.message
          }
          type={
            popupMessage.type
          }
          onClose={
            popupMessage.onClose
          }
        />
      )}
    </div>
  );
};

export default PaymentPage;