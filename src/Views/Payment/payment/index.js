import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import Swal from "sweetalert2"
import Popup from "../../../Components/popup"
import { postRequest } from "../../../service/apiService"

const PaymentPage = () => {
  const location = useLocation()
  const navigate = useNavigate()

  // Get all the data passed from lab registration or billing details
  const {
    billingType,
    amount = 0,
    patientId,
    labData,
    selectedItems,
    paymentBreakdown,
    billingHeaderId, // Direct billing header ID
    investigationandPackegBillStatus, // ✅ THIS IS WHAT YOU'RE ACTUALLY SENDING
    paymentData // ✅ Check if paymentData is passed
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
    
    // ✅ DEBUG: Log what we're receiving
    console.log("=== PAYMENT PAGE - RECEIVED DATA ===")
    console.log("location.state:", location.state)
    console.log("investigationandPackegBillStatus:", investigationandPackegBillStatus)
    console.log("selectedItems:", selectedItems)
    console.log("paymentData:", paymentData)
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

    // Try from paymentData if available
    if (paymentData?.billHeaderId !== undefined && paymentData?.billHeaderId !== null) {
      console.log("Using paymentData.billHeaderId:", paymentData.billHeaderId)
      return paymentData.billHeaderId
    }

    console.log("No bill header ID found!")
    return null
  }

  // ✅ FIXED: Prepare investigation and package status list
  const prepareInvestigationAndPackageStatus = () => {
    console.log("=== PREPARING INVESTIGATION AND PACKAGE STATUS ===")
    
    // ✅ Option 1: Use investigationandPackegBillStatus if provided directly
    if (investigationandPackegBillStatus && investigationandPackegBillStatus.length > 0) {
      console.log("Using investigationandPackegBillStatus:", investigationandPackegBillStatus)
      return investigationandPackegBillStatus
    }
    
    // ✅ Option 2: Use paymentData if available
    if (paymentData?.investigationandPackegBillStatus) {
      console.log("Using paymentData.investigationandPackegBillStatus:", paymentData.investigationandPackegBillStatus)
      return paymentData.investigationandPackegBillStatus
    }
    
    // ✅ Option 3: Use selectedItems (old structure) for backward compatibility
    const statusList = []

    // Check if selectedItems has the new structure (array of items)
    if (Array.isArray(selectedItems)) {
      console.log("Using selectedItems as array:", selectedItems)
      return selectedItems
    }

    // Old structure: selectedItems with investigations and packages
    if (selectedItems?.investigations) {
      selectedItems.investigations.forEach((investigation) => {
        statusList.push({
          id: investigation.id,
          type: "i", // 'i' for investigation
        })
      })
    }

    if (selectedItems?.packages) {
      selectedItems.packages.forEach((pkg) => {
        statusList.push({
          id: pkg.id,
          type: "p", // 'p' for package
        })
      })
    }

    console.log("Final status list:", statusList)
    return statusList
  }

  const handlePayment = async () => {
  try {
    // Basic validation
    if (paymentMethod !== "cash" && !paymentDetails.trim()) {
      Swal.fire("Error!", "Please enter payment details", "error");
      return;
    }

    const billHeaderId = getBillHeaderId();
    console.log("Final Bill Header ID for payment:", billHeaderId);

    if (!billHeaderId) {
      await Swal.fire({
        title: "Error!",
        text: "Bill Header ID not found. Cannot proceed with payment.",
        icon: "error",
        confirmButtonText: "Go Back",
      });
      navigate(-1);
      return;
    }

    // ✅ PREPARE PAYMENT DATA WITH EXPLICIT FLAGS
    const paymentUpdateRequest = {
      // Core payment data
      billHeaderId: Number(billHeaderId),
      amount: Number.parseFloat(amount),
      mode: paymentMethod,
      paymentReferenceNo: paymentReferenceNo,
      investigationandPackegBillStatus: prepareInvestigationAndPackageStatus(),
      
      // ✅ EXPLICIT FLAGS TO PREVENT DUPLICATES
      isPaymentUpdate: true,
      shouldNotCreateNewBilling: true,
      useExistingBillingHeader: true,
      
      // Additional context
      patientId: patientId,
      billingType: billingType
    };

    // Add payment details for non-cash methods
    if (paymentMethod !== "cash") {
      paymentUpdateRequest.paymentDetails = paymentDetails;
    }

    console.log("=== FINAL PAYMENT REQUEST ===");
    console.log("Payment Request:", paymentUpdateRequest);

    // ✅ PROCEED WITH PAYMENT
    await proceedWithPayment(paymentUpdateRequest);

  } catch (error) {
    console.error("Payment initialization error:", error);
    Swal.fire("Error!", "Failed to initialize payment", "error");
  }
};

  // ✅ Extract payment logic to separate function
 const proceedWithPayment = async (paymentUpdateRequest) => {
  try {
    setLoading(true);
    
    console.log("=== PAYMENT PROCESS START ===");
    console.log("Original Payment Request:", paymentUpdateRequest);

    // ✅ CRITICAL: Validate required fields
    if (!paymentUpdateRequest.billHeaderId) {
      throw new Error("Bill Header ID is missing. Cannot process payment.");
    }

    if (!paymentUpdateRequest.amount || paymentUpdateRequest.amount <= 0) {
      throw new Error("Invalid payment amount.");
    }

    // ✅ ENHANCED PAYMENT REQUEST WITH SAFETY FLAGS
    const enhancedPaymentRequest = {
      // Core payment data
      billHeaderId: Number(paymentUpdateRequest.billHeaderId),
      amount: Number.parseFloat(paymentUpdateRequest.amount),
      mode: paymentUpdateRequest.mode || "cash",
      paymentReferenceNo: paymentUpdateRequest.paymentReferenceNo || `PAY${Date.now()}`,
      investigationandPackegBillStatus: paymentUpdateRequest.investigationandPackegBillStatus || [],
      
      // ✅ CRITICAL SAFETY FLAGS TO PREVENT DUPLICATE BILLING
      isPaymentUpdate: true,
      shouldNotCreateNewBilling: true,
      useExistingBillingHeader: true,
      operationType: "payment_update_only",
      
      // Additional context for backend
      patientId: paymentUpdateRequest.patientId,
      billingType: paymentUpdateRequest.billingType,
      timestamp: new Date().toISOString()
    };

    console.log("=== ENHANCED PAYMENT REQUEST ===");
    console.log("With Safety Flags:", enhancedPaymentRequest);

    // ✅ CALL PAYMENT API (NOT REGISTRATION API)
    const response = await postRequest("/lab/updatepaymentstatus", enhancedPaymentRequest);

    console.log("=== PAYMENT API RESPONSE ===");
    console.log("Full Response:", response);

    // ✅ ENHANCED RESPONSE VALIDATION
    if (response && response.status === 200) {
      
      // ✅ CRITICAL CHECK: Detect if backend created a new billing header (SHOULD NOT HAPPEN)
      const newBillinghdId = response?.response?.billinghdId;
      const originalBillHeaderId = enhancedPaymentRequest.billHeaderId;
      
      if (newBillinghdId && newBillinghdId !== originalBillHeaderId) {
        console.error("❌ BACKEND ERROR: DUPLICATE BILLING HEADER CREATED!");
        console.error("Original BillHeaderId:", originalBillHeaderId);
        console.error("New BillinghdId created:", newBillinghdId);
        
        // Show specific error for backend issue
        await Swal.fire({
          title: "Backend Configuration Error!",
          html: `
            <div style="text-align:left">
              <p><strong>Payment API created duplicate billing header!</strong></p>
              <p><strong>Original ID:</strong> ${originalBillHeaderId}</p>
              <p><strong>New ID Created:</strong> ${newBillinghdId}</p>
              <p class="text-danger">This is a backend issue - payment API should not create new billing headers.</p>
              <p class="text-warning">Contact administrator to fix the payment API endpoint.</p>
            </div>
          `,
          icon: "error",
          confirmButtonText: "Understand"
        });
        
        // Still proceed with success if payment was processed
        if (response.response.msg === "Success") {
          console.warn("⚠️ Payment processed but with duplicate billing header");
          handlePaymentSuccess(response, enhancedPaymentRequest);
        }
        return;
      }

      // ✅ NORMAL SUCCESS FLOW - No duplicate created
      if (response.message === "success" && response.response?.msg === "Success") {
        handlePaymentSuccess(response, enhancedPaymentRequest);
      } else {
        const errorMessage = response?.response?.msg || 
                            response?.message || 
                            "Payment processing failed";
        throw new Error(errorMessage);
      }
      
    } else {
      // ✅ IMPROVED ERROR HANDLING
      const errorMessage = response?.response?.msg || 
                          response?.message || 
                          "Payment API returned error status";
      
      console.error("Payment API Error Details:", {
        status: response?.status,
        message: response?.message,
        response: response?.response
      });
      
      throw new Error(errorMessage);
    }

  } catch (error) {
    console.error("❌ Payment processing error:", error);
    
    // ✅ USER-FRIENDLY ERROR MESSAGES
    let errorTitle = "Payment Error!";
    let errorText = error.message || "Something went wrong during payment processing";
    
    // Specific error for network issues
    if (error.message.includes("Network Error") || error.message.includes("Failed to fetch")) {
      errorTitle = "Network Error!";
      errorText = "Unable to connect to payment server. Please check your internet connection.";
    }
    
    // Specific error for duplicate billing
    if (error.message.includes("duplicate") || error.message.includes("billing header")) {
      errorTitle = "Backend Error!";
      errorText = "Payment system configuration error. Please contact administrator.";
    }

    await Swal.fire({
      title: errorTitle,
      text: errorText,
      icon: "error",
      confirmButtonText: "OK"
    });
    
  } finally {
    setLoading(false);
  }
};

// ✅ EXTRACTED SUCCESS HANDLING METHOD
const handlePaymentSuccess = (response, paymentRequest) => {
  const billNo = response?.response?.billNo;
  const paymentStatus = response?.response?.paymentStatus;
  const msg = response?.response?.msg;

  console.log("=== PAYMENT SUCCESS ===");
  console.log("Bill No:", billNo);
  console.log("Payment Status:", paymentStatus);
  console.log("Original BillHeaderId:", paymentRequest.billHeaderId);

  setPopupMessage({
    message: `Payment Successful!`,
    type: "success",
    onClose: () => {
      setPopupMessage(null);
      navigateToSuccessPage(response, paymentRequest);
    },
  });
};

// ✅ EXTRACTED NAVIGATION METHOD
const navigateToSuccessPage = (response, paymentRequest) => {
  const successState = {
    // Payment details
    billingType: billingType,
    amount: paymentRequest.amount,
    paymentReferenceNo: paymentRequest.paymentReferenceNo,
    paymentMethod: paymentRequest.mode,
    
    // Patient details
    patientId: patientId,
    
    // Response details
    billNo: response?.response?.billNo,
    paymentStatus: response?.response?.paymentStatus,
    paymentResponse: response,
    
    // ✅ CRITICAL: Debug information to track duplicates
    originalBillHeaderId: paymentRequest.billHeaderId,
    newBillinghdId: response?.response?.billinghdId, // Should be same as original
    hasDuplicate: response?.response?.billinghdId && 
                  response.response.billinghdId !== paymentRequest.billHeaderId,
    paymentRequest: paymentRequest
  };

  console.log("=== NAVIGATING TO SUCCESS PAGE ===");
  console.log("Success State:", successState);

  // Choose the correct success page based on billing type
  const successPage = (billingType && billingType.toLowerCase() === "consultation services") 
    ? "/opd-payment-success" 
    : "/lab-payment-success";

  navigate(successPage, { state: successState });
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
  const investigationStatus = prepareInvestigationAndPackageStatus()

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
                <div className="d-flex justify-content-between mt-1">
                  <span>Bill Header ID:</span>
                  <span className="text-muted">{currentBillHeaderId || "Not found"}</span>
                </div>
                <div className="d-flex justify-content-between mt-1">
                  <span>Items to update:</span>
                  <span className="text-muted">{investigationStatus?.length || 0} items</span>
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

              {/* Show warning if no items to update */}
              {currentBillHeaderId && (!investigationStatus || investigationStatus.length === 0) && (
                <div className="alert alert-warning mt-3">
                  <i className="fa fa-exclamation-triangle me-2"></i>
                  <strong>Warning:</strong> No specific items selected for payment update. 
                  The payment will be processed but individual items may not be marked as paid.
                </div>
              )}

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