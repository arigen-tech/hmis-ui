"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { postRequest } from "../../../service/apiService"
import Swal from "sweetalert2"
import Popup from "../../../Components/popup"

const PaymentPage = () => {
  const location = useLocation()
  const navigate = useNavigate()

  // Get all the data passed from lab registration
  const { amount = 0, patientId, labData, selectedItems, paymentBreakdown } = location.state || {}

  const [paymentMethod, setPaymentMethod] = useState("card")
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

  // Extract bill header ID from lab data - CORRECTED with the right key name
  const getBillHeaderId = () => {
    console.log("=== EXTRACTING BILL HEADER ID ===")

    // Based on your debug output, the correct path is labData.response.billinghdId
    const billHeaderId = labData?.response?.billinghdId

    if (billHeaderId !== undefined && billHeaderId !== null) {
      console.log("Found billinghdId:", billHeaderId)
      return billHeaderId
    }

    // Fallback to other possible paths just in case
    const possiblePaths = [
      labData?.response?.billHeaderId,
      labData?.response?.billHdId,
      labData?.response?.billId,
      labData?.response?.id,
      labData?.billHeaderId,
      labData?.billHdId,
      labData?.billinghdId, // Add this as fallback
    ]

    for (const path of possiblePaths) {
      if (path !== undefined && path !== null) {
        console.log("Found billHeaderId in fallback:", path)
        return path
      }
    }

    console.error("billHeaderId not found in any expected location")
    return null
  }

  const handlePayment = async () => {
    try {
      setLoading(true)

      // Validate required fields
      if (paymentMethod !== "cash" && !paymentDetails.trim()) {
        Swal.fire("Error!", "Please enter payment details", "error")
        return
      }

      const billHeaderId = getBillHeaderId()

      if (!billHeaderId) {
        Swal.fire({
          title: "Error!",
          text: "Bill Header ID not found. Cannot proceed with payment.",
          icon: "error",
          confirmButtonText: "Go Back",
        })
        return
      }

      // Prepare payment update request
      const paymentUpdateRequest = {
        billHeaderId: Number(billHeaderId), // Convert to number as expected by backend
        amount: Number.parseFloat(amount),
        mode: paymentMethod,
        paymentReferenceNo: paymentReferenceNo,
      }

      console.log("=== PAYMENT REQUEST ===")
      console.log("Payment Update Request:", paymentUpdateRequest)
      console.log("======================")

      // Call the payment status update API
      const response = await postRequest("/lab/updatepaymentstatus", paymentUpdateRequest)

      console.log("=== PAYMENT API RESPONSE ===")
      console.log("Payment API Response:", response)
      console.log("============================")

      if (response && response.status === 200) {
        // Payment successful
        setPopupMessage({
          message: "Payment successful!",
          type: "success",
          onClose: () => {
            setPopupMessage(null)
            navigate("/lab-payment-success", {
              state: {
                amount,
                paymentReferenceNo,
                paymentMethod,
                patientId,
                billHeaderId,
                paymentResponse: response,
              },
            })
          },
        })
      } else {
        // Payment failed
        const errorMessage = response?.message || response?.response?.message || "Payment processing failed"
        Swal.fire("Payment Failed!", errorMessage, "error")
      }
    } catch (error) {
      console.error("Payment error:", error)
      Swal.fire("Error!", error.message || "Something went wrong during payment processing", "error")
    } finally {
      setLoading(false)
    }
  }

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
                {currentBillHeaderId && (
                  <div className="d-flex justify-content-between mt-1">
                    <span>Bill ID:</span>
                    <span className="text-muted">{currentBillHeaderId}</span>
                  </div>
                )}
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

              {/* Cash Payment Note */}
              {/* {paymentMethod === "cash" && (
                <div className="alert alert-info">
                  <i className="fa fa-info-circle me-2"></i>
                  Please pay the amount at the reception counter.
                </div>
              )} */}

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

              {/* Debug Info (remove in production) */}
              {/* {process.env.NODE_ENV === "development" && (
                <div className="mt-4 p-2 bg-light rounded">
                  <small className="text-muted">
                    <strong>Debug Info:</strong>
                    <br />
                    Bill Header ID: {currentBillHeaderId || "NOT FOUND"}
                    <br />
                    Patient ID: {patientId}
                    <br />
                    Amount: {amount}
                    <br />
                    <strong>Correct Path:</strong> labData.response.billinghdId = {labData?.response?.billinghdId}
                  </small>
                </div>
              )} */}
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
