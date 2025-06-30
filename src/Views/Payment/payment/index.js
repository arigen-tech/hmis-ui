import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // You can get payment data from location.state if passed
  const { amount = 0 } = location.state || {};
  const [paymentMethod, setPaymentMethod] = React.useState("card");

  const handlePayment = () => {
    // Simulate payment success
    alert("Payment successful!");
    navigate("/lab-payment-success", {
      state: {
        amount,      // the amount paid
       }
    }); // Go back or to a success page

  };

  return (
    <div className="container py-5">
      <div className="card mx-auto" style={{ maxWidth: 500 }}>
        <div className="card-header text-center">
          <h4>Complete Your Payment</h4>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label fw-bold">Amount to Pay</label>
            <div className="form-control text-success fs-4">₹{amount}</div>
          </div>
          <div className="mb-3">
            <label className="form-label">Payment Method</label>
            <select className="form-select"
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value)}
          >
              <option value="card">Credit/Debit Card</option>
              <option value="upi">UPI</option>
              <option value="netbanking">Net Banking</option>
              <option value="cash">Cash at Counter</option>
            </select>
          </div>
          {paymentMethod !== "cash" && (
  <div className="mb-3">
    <label className="form-label">Card/UPI/Account Details</label>
    <input className="form-control" placeholder="Enter details..." />
  </div>
)}
          <button className="btn btn-success w-100" onClick={handlePayment}>
            <i className="fa fa-credit-card me-2"></i> Pay Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;