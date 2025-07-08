
import { useState } from "react"
import { useNavigate } from "react-router-dom"

const LabBillingDetails = () => {
  const navigate = useNavigate()

  // Sample patient data - in real app, this would come from API
  // (No longer used, but kept for reference)
  // const [patientData] = useState([...])

  const [formData, setFormData] = useState({
    patientName: "",
    mobileNo: "",
    age: "",
    sex: "",
    relation: "",
    patientId: "",
    address: "",
    type: "investigation",
    rows: [
      {
        id: 1,
        name: "",
        date: "",
        originalAmount: 0,
        discountAmount: 0,
        netAmount: 0,
        type: "investigation",
      },
    ],
  })

  const [isFormValid, setIsFormValid] = useState(false)
  const [checkedRows, setCheckedRows] = useState([true])
  const [activeRowIndex, setActiveRowIndex] = useState(null)

  // Mock data for investigations and packages
  const [investigationItems] = useState([
    { investigationId: 1, investigationName: "Blood Sugar", price: 150, disc: 10 },
    { investigationId: 2, investigationName: "Complete Blood Count", price: 300, disc: 20 },
    { investigationId: 3, investigationName: "Lipid Profile", price: 500, disc: 50 },
  ])

  const [packageItems] = useState([
    { id: 1, packName: "Basic Health Checkup", actualCost: 1200, baseCost: 1500, disc: 300 },
    { id: 2, packName: "Comprehensive Health Package", actualCost: 2500, baseCost: 3000, disc: 500 },
  ])

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData((prevData) => ({ ...prevData, [id]: value }))

    const updatedFormData = { ...formData, [id]: value }
    setIsFormValid(
      !!updatedFormData.patientName && !!updatedFormData.mobileNo && !!updatedFormData.age && !!updatedFormData.sex,
    )
  }

  const handleTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      type: type,
    }))
  }

  const handleRowChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedRows = prev.rows.map((item, i) => {
        if (i !== index) return item
        const updatedItem = { ...item, [field]: value }
        if (field === "originalAmount" || field === "discountAmount") {
          const original = Number(updatedItem.originalAmount) || 0
          const discount = Number(updatedItem.discountAmount) || 0
          updatedItem.netAmount = Math.max(0, original - discount).toFixed(2)
        }
        return updatedItem
      })
      return { ...prev, rows: updatedRows }
    })
  }

  const addRow = (e, type = formData.type) => {
    e.preventDefault()
    setFormData((prev) => ({
      ...prev,
      rows: [
        ...prev.rows,
        {
          id: Date.now(),
          name: "",
          date: "",
          originalAmount: 0,
          discountAmount: 0,
          netAmount: 0,
          type: type,
        },
      ],
    }))
    setCheckedRows((prev) => [...prev, true])
  }

  const removeRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      rows: prev.rows.filter((_, i) => i !== index),
    }))
    setCheckedRows((prev) => prev.filter((_, i) => i !== index))
  }

  const isLastRowComplete = () => {
    if (formData.rows.length === 0) return false
    const lastRow = formData.rows[formData.rows.length - 1]
    return (
      lastRow.name &&
      lastRow.name.trim() !== "" &&
      lastRow.date &&
      lastRow.date.trim() !== "" &&
      lastRow.originalAmount !== undefined &&
      lastRow.originalAmount !== "" &&
      !isNaN(lastRow.originalAmount) &&
      lastRow.discountAmount !== undefined &&
      lastRow.discountAmount !== "" &&
      !isNaN(lastRow.discountAmount)
    )
  }

  // Payment calculation function
  const calculatePaymentBreakdown = () => {
    const checkedItems = formData.rows.filter((_, index) => checkedRows[index])

    const totalOriginalAmount = checkedItems.reduce((total, item) => {
      return total + (Number.parseFloat(item.originalAmount) || 0)
    }, 0)

    const totalDiscountAmount = checkedItems.reduce((total, item) => {
      return total + (Number.parseFloat(item.discountAmount) || 0)
    }, 0)

    const totalNetAmount = totalOriginalAmount - totalDiscountAmount
    const gstPercent = 18
    const totalGstAmount = (totalNetAmount * gstPercent) / 100
    const finalAmount = totalNetAmount + totalGstAmount

    return {
      totalOriginalAmount: totalOriginalAmount.toFixed(2),
      totalDiscountAmount: totalDiscountAmount.toFixed(2),
      totalNetAmount: totalNetAmount.toFixed(2),
      totalGstAmount: totalGstAmount.toFixed(2),
      finalAmount: finalAmount.toFixed(2),
      gstPercent: gstPercent,
      gstApplicable: true,
      itemCount: checkedItems.length,
    }
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!isFormValid) return
    console.log("Saving lab billing details:", formData)
    alert("Lab billing details saved successfully!")
    navigate("/PendingForBilling")
  }

  const handleBack = () => {
    navigate("/PendingForBilling")
  }

  const paymentBreakdown = calculatePaymentBreakdown()

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">Lab Billing Details</h4>
              <button type="button" className="btn btn-secondary" onClick={handleBack}>
                <i className="mdi mdi-arrow-left"></i> Back to Pending List
              </button>
            </div>
            <div className="card-body">
              <form className="forms row" onSubmit={handleSave}>
                {/* Patient Details Section */}
                <div className="col-12 mt-4">
                  <div className="card">
                    <div className="card-header bg-light">
                      <h5 className="mb-0">
                        <i className="mdi mdi-account"></i> Patient Details
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="form-group col-md-4 mt-3">
                          <label>
                            Patient Name <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="patientName"
                            placeholder="Patient Name"
                            onChange={handleInputChange}
                            value={formData.patientName}
                            required
                          />
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>
                            Age <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            id="age"
                            placeholder="Age"
                            onChange={handleInputChange}
                            value={formData.age}
                            required
                          />
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>
                            Mobile No. <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="mobileNo"
                            placeholder="Mobile Number"
                            onChange={handleInputChange}
                            value={formData.mobileNo}
                            required
                          />
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>
                            Sex <span className="text-danger">*</span>
                          </label>
                          <select
                            className="form-select"
                            id="sex"
                            value={formData.sex}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="">Select Sex</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>Relation</label>
                          <input
                            type="text"
                            className="form-control"
                            id="relation"
                            placeholder="Relation"
                            onChange={handleInputChange}
                            value={formData.relation}
                          />
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>Patient ID</label>
                          <input
                            type="text"
                            className="form-control"
                            id="patientId"
                            placeholder="Patient ID"
                            onChange={handleInputChange}
                            value={formData.patientId}
                          />
                        </div>
                        <div className="form-group col-md-12 mt-3">
                          <label>Address</label>
                          <textarea
                            className="form-control"
                            id="address"
                            placeholder="Address"
                            onChange={handleInputChange}
                            value={formData.address}
                            rows="2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lab Investigation/Package Details */}
                <div className="col-12 mt-4">
                  <div className="card">
                    <div className="card-header bg-light">
                      <h5 className="mb-0">
                        <i className="mdi mdi-test-tube"></i>{" "}
                        {formData.type === "investigation" ? "Investigation Details" : "Package Details"}
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <div className="form-check form-check-inline">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="type"
                            id="investigation"
                            value="investigation"
                            checked={formData.type === "investigation"}
                            onChange={() => handleTypeChange("investigation")}
                          />
                          <label className="form-check-label" htmlFor="investigation">
                            Investigation
                          </label>
                        </div>
                        <div className="form-check form-check-inline">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="type"
                            id="package"
                            value="package"
                            checked={formData.type === "package"}
                            onChange={() => handleTypeChange("package")}
                          />
                          <label className="form-check-label" htmlFor="package">
                            Package
                          </label>
                        </div>
                      </div>
                      <table className="table table-bordered">
                        <thead>
                          <tr>
                            <th>{formData.type === "investigation" ? "Investigation Name" : "Package Name"}</th>
                            <th>Date</th>
                            <th>Original Amount</th>
                            <th>Discount Amount</th>
                            <th>Net Amount</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.rows.map((row, index) => (
                            <tr key={index}>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <input
                                    type="checkbox"
                                    style={{ width: "20px", height: "20px", border: "2px solid black" }}
                                    className="form-check-input"
                                    checked={checkedRows[index] || false}
                                    onChange={(e) => {
                                      const updated = [...checkedRows]
                                      updated[index] = e.target.checked
                                      setCheckedRows(updated)
                                    }}
                                  />
                                  <div className="dropdown-search-container position-relative flex-grow-1">
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={row.name}
                                      autoComplete="off"
                                      placeholder={
                                        formData.type === "investigation" ? "Investigation Name" : "Package Name"
                                      }
                                      onChange={(e) => {
                                        handleRowChange(index, "name", e.target.value)
                                        if (e.target.value.trim() !== "") {
                                          setActiveRowIndex(index)
                                        } else {
                                          setActiveRowIndex(null)
                                        }
                                      }}
                                      onFocus={() => {
                                        if (row.name.trim() !== "") {
                                          setActiveRowIndex(index)
                                        }
                                      }}
                                      onBlur={() => setTimeout(() => setActiveRowIndex(null), 200)}
                                    />
                                    {activeRowIndex === index && row.name.trim() !== "" && (
                                      <ul
                                        className="list-group position-absolute w-100 mt-1"
                                        style={{
                                          zIndex: 1000,
                                          maxHeight: "200px",
                                          overflowY: "auto",
                                          backgroundColor: "#fff",
                                          border: "1px solid #ccc",
                                        }}
                                      >
                                        {formData.type === "investigation"
                                          ? investigationItems
                                              .filter((item) =>
                                                item.investigationName.toLowerCase().includes(row.name.toLowerCase()),
                                              )
                                              .map((item, i) => {
                                                const hasDiscount = item.disc && item.disc > 0
                                                const displayPrice = item.price || 0
                                                const discountAmount = hasDiscount ? item.disc : 0
                                                const finalPrice = hasDiscount
                                                  ? displayPrice - discountAmount
                                                  : displayPrice
                                                return (
                                                  <li
                                                    key={i}
                                                    className="list-group-item list-group-item-action"
                                                    style={{ backgroundColor: "#e3e8e6", cursor: "pointer" }}
                                                    onClick={() => {
                                                      handleRowChange(index, "name", item.investigationName)
                                                      handleRowChange(index, "itemId", item.investigationId)
                                                      handleRowChange(index, "originalAmount", displayPrice)
                                                      handleRowChange(index, "discountAmount", discountAmount)
                                                      handleRowChange(index, "netAmount", finalPrice)
                                                      setActiveRowIndex(null)
                                                    }}
                                                  >
                                                    <div>
                                                      <strong>{item.investigationName}</strong>
                                                      <div className="d-flex justify-content-between">
                                                        <span>₹{finalPrice.toFixed(2)}</span>
                                                        {hasDiscount && (
                                                          <span className="text-success">
                                                            (Discount: ₹{discountAmount.toFixed(2)})
                                                          </span>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </li>
                                                )
                                              })
                                          : packageItems
                                              .filter((item) =>
                                                item.packName.toLowerCase().includes(row.name.toLowerCase()),
                                              )
                                              .map((item, i) => (
                                                <li
                                                  key={i}
                                                  className="list-group-item list-group-item-action"
                                                  style={{ backgroundColor: "#e3e8e6", cursor: "pointer" }}
                                                  onClick={() => {
                                                    handleRowChange(index, "name", item.packName)
                                                    handleRowChange(index, "itemId", item.id)
                                                    handleRowChange(index, "originalAmount", item.baseCost)
                                                    handleRowChange(index, "discountAmount", item.disc)
                                                    handleRowChange(index, "netAmount", item.actualCost)
                                                    setActiveRowIndex(null)
                                                  }}
                                                >
                                                  <div>
                                                    <strong>{item.packName}</strong>
                                                    <div className="d-flex justify-content-between">
                                                      <span>₹{item.actualCost.toFixed(2)}</span>
                                                    </div>
                                                  </div>
                                                </li>
                                              ))}
                                      </ul>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <input
                                  type="date"
                                  className="form-control"
                                  value={row.date}
                                  onChange={(e) => handleRowChange(index, "date", e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={row.originalAmount}
                                  onChange={(e) => handleRowChange(index, "originalAmount", e.target.value)}
                                  min="0"
                                  step="0.01"
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={row.discountAmount}
                                  onChange={(e) => handleRowChange(index, "discountAmount", e.target.value)}
                                  min="0"
                                  step="0.01"
                                />
                              </td>
                              <td>
                                <div className="font-weight-bold text-success">₹{row.netAmount || "0.00"}</div>
                              </td>
                              <td>
                                <div className="d-flex align-item-center gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={() => removeRow(index)}
                                    disabled={formData.rows.length === 1}
                                  >
                                    <i className="icofont-close"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="d-flex justify-content-between align-items-center">
                        <button
                          type="button"
                          className="btn btn-success"
                          onClick={addRow}
                          disabled={!isLastRowComplete()}
                        >
                          Add {formData.type === "investigation" ? "Investigation" : "Package"} +
                        </button>
                        <div className="d-flex">
                          <input
                            type="text"
                            className="form-control me-2"
                            placeholder="Enter Coupon Code"
                            style={{ width: "200px" }}
                          />
                          <button type="button" className="btn btn-primary me-2">
                            <i className="icofont-ticket me-1"></i> Apply Coupon
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Payment Summary Section */}
                <div className="col-12 mt-4">
                  <div
                    className="card shadow mb-3"
                    style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", border: "none" }}
                  >
                    <div
                      className="card-header py-3 text-white"
                      style={{ background: "rgba(255,255,255,0.1)", border: "none" }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div className="p-2 bg-white rounded" style={{ opacity: 0.9 }}>
                          <i className="fa fa-calculator text-primary"></i>
                        </div>
                        <div>
                          <h5 className="mb-0 fw-bold text-white">Payment Summary</h5>
                          <small className="text-white" style={{ opacity: 0.8 }}>
                            {paymentBreakdown.itemCount} item{paymentBreakdown.itemCount !== 1 ? "s" : ""} selected
                          </small>
                        </div>
                      </div>
                    </div>
                    <div className="card-body text-white">
                      {/* Summary Cards Grid */}
                      <div className="row g-3 mb-4">
                        {/* Total Original Amount Card */}
                        <div className="col-md-3">
                          <div
                            className="card h-100"
                            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}
                          >
                            <div className="card-body text-center">
                              <div className="mb-2">
                                <i className="fa fa-receipt fa-2x text-white" style={{ opacity: 0.8 }}></i>
                              </div>
                              <h6 className="card-title text-white mb-1">Total Amount</h6>
                              <h4 className="text-white fw-bold">₹{paymentBreakdown.totalOriginalAmount}</h4>
                            </div>
                          </div>
                        </div>
                        {/* Discount Card */}
                        <div className="col-md-3">
                          <div
                            className="card h-100"
                            style={{ background: "rgba(40,167,69,0.2)", border: "1px solid rgba(40,167,69,0.3)" }}
                          >
                            <div className="card-body text-center">
                              <div className="mb-2">
                                <i className="fa fa-percent fa-2x text-success"></i>
                              </div>
                              <h6 className="card-title text-white mb-1">Total Discount</h6>
                              <h4 className="text-success fw-bold">₹{paymentBreakdown.totalDiscountAmount}</h4>
                            </div>
                          </div>
                        </div>
                        {/* Tax Card */}
                        {paymentBreakdown.gstApplicable && (
                          <div className="col-md-3">
                            <div
                              className="card h-100"
                              style={{ background: "rgba(255,193,7,0.2)", border: "1px solid rgba(255,193,7,0.3)" }}
                            >
                              <div className="card-body text-center">
                                <div className="mb-2">
                                  <i className="fa fa-file-invoice fa-2x text-warning"></i>
                                </div>
                                <h6 className="card-title text-white mb-1">Tax ({paymentBreakdown.gstPercent}% GST)</h6>
                                <h4 className="text-warning fw-bold">₹{paymentBreakdown.totalGstAmount}</h4>
                              </div>
                            </div>
                          </div>
                        )}
                        {/* Final Amount Card */}
                        <div className="col-md-3">
                          <div
                            className="card h-100"
                            style={{
                              background: "linear-gradient(45deg, #28a745, #20c997)",
                              border: "none",
                              boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                            }}
                          >
                            <div className="card-body text-center">
                              <div className="mb-2">
                                <i className="fa fa-credit-card fa-2x text-white"></i>
                              </div>
                              <h6 className="card-title text-white mb-1">Final Amount</h6>
                              <h4 className="text-white fw-bold">₹{paymentBreakdown.finalAmount}</h4>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Detailed Breakdown */}
                      <div className="card" style={{ background: "rgba(255,255,255,0.95)", border: "none" }}>
                        <div className="card-body">
                          <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                            <i className="fa fa-list-alt text-primary"></i>
                            Payment Breakdown
                          </h6>
                          <div className="row">
                            <div className="col-md-8">
                              <div className="d-flex justify-content-between py-2 border-bottom">
                                <span className="text-muted">Subtotal ({paymentBreakdown.itemCount} items)</span>
                                <span className="fw-medium text-dark">₹{paymentBreakdown.totalOriginalAmount}</span>
                              </div>
                              {Number(paymentBreakdown.totalDiscountAmount) > 0 && (
                                <div className="d-flex justify-content-between py-2 border-bottom">
                                  <span className="text-success">Discount Applied</span>
                                  <span className="fw-medium text-success">
                                    -₹{paymentBreakdown.totalDiscountAmount}
                                  </span>
                                </div>
                              )}
                              <div className="d-flex justify-content-between py-2 border-bottom">
                                <span className="text-muted">Amount after Discount</span>
                                <span className="fw-medium text-dark">₹{paymentBreakdown.totalNetAmount}</span>
                              </div>
                              {paymentBreakdown.gstApplicable && (
                                <div className="d-flex justify-content-between py-2 border-bottom">
                                  <span className="text-muted">GST ({paymentBreakdown.gstPercent}%)</span>
                                  <span className="fw-medium text-warning">+₹{paymentBreakdown.totalGstAmount}</span>
                                </div>
                              )}
                              <div className="d-flex justify-content-between py-3 border-top">
                                <span className="h5 fw-bold text-dark">Total Payable</span>
                                <span className="h4 fw-bold text-primary">₹{paymentBreakdown.finalAmount}</span>
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="d-flex flex-wrap gap-2">
                                <span className="badge bg-secondary px-3 py-2">
                                  {paymentBreakdown.itemCount} Items Selected
                                </span>
                                {Number(paymentBreakdown.totalDiscountAmount) > 0 && (
                                  <span className="badge bg-success px-3 py-2">Discount Applied</span>
                                )}
                                {paymentBreakdown.gstApplicable && (
                                  <span className="badge bg-info px-3 py-2">GST Included</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                  <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                    Pay Now
                  </button>
                  <button type="button" className="btn btn-danger" onClick={handleBack}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LabBillingDetails
