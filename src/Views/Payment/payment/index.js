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

      // ✅ Prepare the investigation status
      const investigationStatus = prepareInvestigationAndPackageStatus();
      console.log("Final investigationStatus to send:", investigationStatus);

      // ✅ Use paymentData if available, otherwise create new request
      const paymentUpdateRequest = paymentData ? {
        ...paymentData, // Use the complete payment data from previous component
        mode: paymentMethod, // Update payment method if changed
        paymentReferenceNo: paymentReferenceNo, // Use generated reference
      } : {
        billingType: billingType,
        billHeaderId: Number(billHeaderId),
        amount: Number.parseFloat(amount),
        mode: paymentMethod,
        paymentReferenceNo: paymentReferenceNo,
        investigationandPackegBillStatus: investigationStatus,
      };

      console.log("Final Payment Update Request:", paymentUpdateRequest);

      // ✅ Validate that we have items to update
      if (!paymentUpdateRequest.investigationandPackegBillStatus || 
          paymentUpdateRequest.investigationandPackegBillStatus.length === 0) {
        Swal.fire({
          title: "Warning!",
          html: `No items selected for payment update.<br/>
                 The payment will be processed but no specific items will be marked as paid.<br/>
                 <small>Bill Header ID: ${billHeaderId}</small>`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Proceed Anyway",
          cancelButtonText: "Go Back",
        }).then((result) => {
          if (!result.isConfirmed) {
            setLoading(false);
            return;
          }
          // Continue with payment even if no items
          proceedWithPayment(paymentUpdateRequest);
        });
      } else {
        proceedWithPayment(paymentUpdateRequest);
      }
    } catch (error) {
      console.error("Payment error:", error);
      Swal.fire(
        "Error!",
        error.message || "Something went wrong during payment processing",
        "error"
      );
      setLoading(false);
    }
  };

  // ✅ Extract payment logic to separate function
  const proceedWithPayment = async (paymentUpdateRequest) => {
    try {
      const response = await postRequest("/lab/updatepaymentstatus", paymentUpdateRequest);

      console.log("Payment API Response:", response);

      

      if (response && response.status === 200 && response.message === "success") {
        const billNo = response?.response?.billNo;
        const msg = response?.response?.msg;
        const paymentStatus = response?.response?.paymentStatus;

        console.log("Extracted billNo:", billNo);
        console.log("Extracted msg:", msg);
        console.log("Extracted paymentStatus:", paymentStatus);

        if (billNo && msg === "Success") {
          setPopupMessage({
            message: "Payment successful!",
            type: "success",
            onClose: () => {
              setPopupMessage(null);

              if (billingType && billingType.toLowerCase() === "consultation services") {
                navigate("/opd-payment-success", {
                  state: {
                    billingType,
                    amount,
                    paymentReferenceNo,
                    paymentMethod,
                    patientId,
                    billNo,
                    paymentStatus,
                    paymentResponse: response,
                  },
                });
              } else {
                navigate("/lab-payment-success", {
                  state: {
                    billingType,
                    amount,
                    paymentReferenceNo,
                    paymentMethod,
                    patientId,
                    billNo,
                    paymentStatus,
                    paymentResponse: response,
                  },
                });
              }
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
      console.error("Payment processing error:", error);
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