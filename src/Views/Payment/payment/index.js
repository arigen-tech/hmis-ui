import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { postRequest } from "../../../service/apiService"
import Swal from "sweetalert2"
import Popup from "../../../Components/popup"

const PaymentPage = () => {
  const location = useLocation()
  const navigate = useNavigate()

  // Get all the data passed from lab registration or billing details
  const {
    amount = 0,
    patientId,
    labData,
    selectedItems,
    paymentBreakdown,
    billingHeaderId, // Direct billing header ID
  } = location.state || {}

  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [paymentDetails, setPaymentDetails] = useState("")
  const [paymentReferenceNo, setPaymentReferenceNo] = useState("")
  const [loading, setLoading] = useState(false)
  const [popupMessage, setPopupMessage] = useState(null)

  // Generate a reference number when component mounts
  useEffect(() => {
    const generateReferenceNo = () => {
      const timestamp = Date.now()
      const random = Math.floor(Math.random() * 1000)
      return `PAY${timestamp}${random}`
    }
    setPaymentReferenceNo(generateReferenceNo())
  }, [])

  // Enhanced function to get bill header ID - try multiple sources
  const getBillHeaderId = () => {
    console.log("=== GETTING BILL HEADER ID ===")
    console.log("Direct billingHeaderId:", billingHeaderId)
    console.log("Lab Data:", labData)
    console.log("Location State:", location.state)

    // Try direct billing header ID first
    if (billingHeaderId !== undefined && billingHeaderId !== null) {
      console.log("Using direct billingHeaderId:", billingHeaderId)
      return billingHeaderId
    }

    // Try from lab data response
    if (labData?.response?.billinghdId !== undefined && labData?.response?.billinghdId !== null) {
      console.log("Using labData.response.billinghdId:", labData.response.billinghdId)
      return labData.response.billinghdId
    }

    if (labData?.response?.billHeaderId !== undefined && labData?.response?.billHeaderId !== null) {
      console.log("Using labData.response.billHeaderId:", labData.response.billHeaderId)
      return labData.response.billHeaderId
    }

    // Try other possible paths
    const possiblePaths = [
      labData?.response?.billHdId,
      labData?.response?.billId,
      labData?.response?.id,
      labData?.billHeaderId,
      labData?.billHdId,
      labData?.billinghdId,
    ]

    for (const path of possiblePaths) {
      if (path !== undefined && path !== null) {
        console.log("Using fallback path:", path)
        return path
      }
    }

    console.log("No bill header ID found!")
    return null
  }

  // Prepare investigation and package status list for the payment request
  const prepareInvestigationAndPackageStatus = () => {
    const statusList = []

    // Add selected investigations
    if (selectedItems?.investigations) {
      selectedItems.investigations.forEach((investigation) => {
        statusList.push({
          id: investigation.id,
          type: "i", // 'i' for investigation
        })
      })
    }

    // Add selected packages
    if (selectedItems?.packages) {
      selectedItems.packages.forEach((pkg) => {
        statusList.push({
          id: pkg.id,
          type: "p", // 'p' for package
        })
      })
    }

    return statusList
  }

  const handlePayment = async () => {
    try {
      setLoading(true);

      if (paymentMethod !== "cash" && !paymentDetails.trim()) {
        Swal.fire("Error!", "Please enter payment details", "error");
        return;
      }

      const billHeaderId = getBillHeaderId();
      console.log("Final Bill Header ID for payment:", billHeaderId);

      if (!billHeaderId) {
        Swal.fire({
          title: "Error!",
          text: "Bill Header ID not found. Cannot proceed with payment. Please go back and try again.",
          icon: "error",
          confirmButtonText: "Go Back",
        }).then(() => {
          navigate(-1);
        });
        return;
      }

      const paymentUpdateRequest = {
        billHeaderId: Number(billHeaderId),
        amount: Number.parseFloat(amount),
        mode: paymentMethod,
        paymentReferenceNo: paymentReferenceNo,
        investigationandPackegBillStatus: prepareInvestigationAndPackageStatus(),
      };

      console.log("Payment Update Request:", paymentUpdateRequest);

      const response = await postRequest("/lab/updatepaymentstatus", paymentUpdateRequest);

      console.log("Payment API Response:", response);

      // ✅ Check based on your actual API response structure
      if (response && response.status === 200 && response.message === "success") {
        const billNo = response?.response?.billNo;
        const msg = response?.response?.msg;
        const paymentStatus = response?.response?.paymentStatus;

        console.log("Extracted billNo:", billNo);
        console.log("Extracted msg:", msg);
        console.log("Extracted paymentStatus:", paymentStatus);

        // ✅ Success condition based on your API: status 200, message "success", and billNo exists
        if (billNo && msg === "Success") {
          setPopupMessage({
            message: "Payment successful!",
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              navigate("/lab-payment-success", {
                state: {
                  amount,
                  paymentReferenceNo,
                  paymentMethod,
                  patientId,
                  billNo,
                  paymentStatus,
                  paymentResponse: response,
                },
              });
            },
          });
        } else {
          const errorMessage = msg || "Payment processing failed";
          Swal.fire("Payment Failed!", errorMessage, "error");
        }
      } else {
        const errorMessage =
          response?.response?.msg ||
          response?.message ||
          "Payment processing failed";
        Swal.fire("Payment Failed!", errorMessage, "error");
      }
    } catch (error) {
      console.error("Payment error:", error);
      Swal.fire(
        "Error!",
        error.message || "Something went wrong during payment processing",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Swal.fire({
      title: "Cancel Payment?",
      text: "Are you sure you want to cancel the payment?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, cancel it!",
    }).then((result) => {
      if (result.isConfirmed) {
        navigate(-1) // Go back to previous page
      }
    })
  }

  // Get the current billHeaderId for display
  const currentBillHeaderId = getBillHeaderId()

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
              {/* Payment Summary */}
              <div className="mb-4 p-3 bg-light rounded">
                <h6 className="fw-bold mb-2">Payment Summary</h6>
                <div className="d-flex justify-content-between">
                  <span>Total Amount:</span>
                  <span className="fw-bold text-success fs-5">₹{amount}</span>
                </div>
                <div className="d-flex justify-content-between mt-1">
                  <span>Reference No:</span>
                  <span className="text-muted">{paymentReferenceNo}</span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="mb-3">
                <label className="form-label fw-bold">Payment Method *</label>
                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={loading}
                >
                  <option value="card">Credit/Debit Card</option>
                  <option value="upi">UPI</option>
                  <option value="netbanking">Net Banking</option>
                  <option value="cash">Cash at Counter</option>
                </select>
              </div>

              {/* Payment Details Input */}
              {paymentMethod !== "cash" && (
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    {paymentMethod === "card" && "Card Number"}
                    {paymentMethod === "upi" && "UPI ID"}
                    {paymentMethod === "netbanking" && "Account Details"}*
                  </label>
                  <input
                    className="form-control"
                    placeholder={
                      paymentMethod === "card"
                        ? "Enter card number..."
                        : paymentMethod === "upi"
                          ? "Enter UPI ID..."
                          : "Enter account details..."
                    }
                    value={paymentDetails}
                    onChange={(e) => setPaymentDetails(e.target.value)}
                    disabled={loading}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="d-grid gap-2">
                <button
                  className="btn btn-success btn-lg"
                  onClick={handlePayment}
                  disabled={loading || !currentBillHeaderId}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="fa fa-credit-card me-2"></i>
                      {paymentMethod === "cash" ? "Confirm Cash Payment" : `Pay ₹${amount}`}
                    </>
                  )}
                </button>
                <button className="btn btn-outline-secondary" onClick={handleCancel} disabled={loading}>
                  <i className="fa fa-times me-2"></i>
                  Cancel Payment
                </button>
              </div>

              {/* Show error if no bill header ID */}
              {!currentBillHeaderId && (
                <div className="alert alert-danger mt-3">
                  <i className="fa fa-exclamation-triangle me-2"></i>
                  <strong>Error:</strong> Billing information is missing. Please go back and try again.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Popup Component */}
      {popupMessage && <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />}
    </div>
  )
}

export default PaymentPage