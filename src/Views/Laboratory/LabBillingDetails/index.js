"use client"

import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import Swal from "sweetalert2"
import LoadingScreen from "../../../Components/Loading"
import { MAS_SERVICE_CATEGORY } from "../../../config/apiConfig"
import { getRequest } from "../../../service/apiService"

const LabBillingDetails = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [formData, setFormData] = useState({
    billingType: "",
    patientName: "",
    mobileNo: "",
    age: "",
    sex: "",
    relation: "",
    patientId: "",
    address: "",
    type: "investigation",
    rows: [],
  })
  const [isFormValid, setIsFormValid] = useState(false)
  const [checkedRows, setCheckedRows] = useState([])
  const [activeRowIndex, setActiveRowIndex] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [investigationItems, setInvestigationItems] = useState([])
  const [packageItems, setPackageItems] = useState([])

  // Add GST configuration state - same as lab registration
  const [gstConfig, setGstConfig] = useState({
    gstApplicable: true,
    gstPercent: 0, // default fallback
  })

  const [gstConfigLoaded, setGstConfigLoaded] = useState(false)

  // Add GST configuration fetch function - same as lab registration
  async function fetchGstConfiguration() {
    try {
      console.log("=== FETCHING GST CONFIGURATION ===")
      const data = await getRequest(`${MAS_SERVICE_CATEGORY}/getGstConfig/1`)
      console.log("GST API Response:", JSON.stringify(data, null, 2))

      if (data && data.status === 200 && data.response && typeof data.response.gstApplicable !== "undefined") {
        const gstConfiguration = {
          gstApplicable: !!data.response.gstApplicable,
          gstPercent: Number(data.response.gstPercent) || 0,
        }
        console.log("Setting GST Configuration:", gstConfiguration)
        setGstConfig(gstConfiguration)
      } else {
        console.warn("Invalid GST API response, disabling GST:", data)
        // If API fails or returns invalid data, disable GST completely
        setGstConfig({
          gstApplicable: false,
          gstPercent: 0,
        })
      }
    } catch (error) {
      console.error("Error fetching GST configuration:", error)
      // On error, disable GST completely
      setGstConfig({
        gstApplicable: false,
        gstPercent: 0,
      })
    } finally {
      setGstConfigLoaded(true)
    }
  }

  useEffect(() => {
    // Fetch GST configuration on component mount
    fetchGstConfiguration()
  }, [])

  useEffect(() => {
    if (location.state && location.state.billingData) {
      // Handle both single object and array response
      const responseData = location.state.billingData
      const billingData = Array.isArray(responseData) ? responseData[0] : responseData
      const details = billingData.details || []
      console.log("Billing Data:", billingData) // Debug log

      // Extract investigations and packages from details
      const investigations = details
        .filter((item) => item.investigationId !== null && item.investigationId !== undefined)
        .map((item) => ({
          investigationId: item.investigationId,
          investigationName: item.investigationName || item.itemName,
          price: item.basePrice || item.tariff || 0,
          disc: item.discount || 0,
        }))

      const packages = details
        .filter((item) => item.packageId !== null && item.packageId !== undefined)
        .map((item) => ({
          id: item.packageId,
          packName: item.packageName || item.itemName,
          actualCost: item.amountAfterDiscount || 0,
          baseCost: item.basePrice || item.tariff || 0,
          disc: item.discount || 0,
        }))

      setInvestigationItems(investigations)
      setPackageItems(packages)

      // Format patient data - Fixed patientId mapping
      const patientData = {
        billingType: billingData.billingType||"",
        patientName: billingData.patientName || "",
        mobileNo: billingData.mobileNo || "",
        age: billingData.age || "",
        sex: billingData.sex || "",
        relation: billingData.relation || "",
        patientId: billingData.patientid?.toString() || billingData.patientId?.toString() || "", // Fixed: Convert to string
        address: billingData.address || "",
      }

      // Format rows from the details array
      const formattedRows = details.map((item, index) => {
        const isPackage = item.packageId !== null && item.packageId !== undefined
        const isInvestigation = item.investigationId !== null && item.investigationId !== undefined
        return {
          id: item.id || index + 1,
          name: item.itemName || (isPackage ? item.packageName : item.investigationName) || "",
          date: new Date().toISOString().split("T")[0],
          originalAmount: item.basePrice || item.tariff || 0,
          discountAmount: item.discount || 0,
          netAmount: item.amountAfterDiscount || item.netAmount || 0,
          type: isPackage ? "package" : "investigation",
          investigationId: item.investigationId,
          packageId: item.packageId,
          itemId: isPackage ? item.packageId : item.investigationId, // Add itemId for payment processing
          itemDetails: item,
        }
      })

      // Determine the type based on the items
      const hasPackages = formattedRows.some((row) => row.type === "package")
      const hasInvestigations = formattedRows.some((row) => row.type === "investigation")

      // Set type based on what's available, prefer investigation if mixed
      let defaultType = "investigation"
      if (hasPackages && !hasInvestigations) {
        defaultType = "package"
      }

      console.log("Patient Data:", patientData) // Debug log
      console.log("Formatted Rows:", formattedRows) // Debug log

      setFormData({
        ...patientData,
        rows: formattedRows.length > 0 ? formattedRows : [],
        type: defaultType,
      })

      // Set all rows as checked by default
      setCheckedRows(new Array(formattedRows.length).fill(true))

      // Validate form based on the data we have
      const isValid = !!(patientData.patientName && patientData.mobileNo && patientData.age && patientData.sex)
      setIsFormValid(isValid)
      setIsLoading(false)
    } else {
      console.log("No billing data found in location.state") // Debug log
      navigate("/PendingForBilling")
    }
  }, [location.state, navigate])

  // Add GST config change effect - same as lab registration
  useEffect(() => {
    console.log("GST Config changed:", gstConfig)
  }, [gstConfig])

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
          date: new Date().toISOString().split("T")[0],
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
    if (formData.rows.length === 0) return true // Allow adding first row
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

  // Enhanced payment calculation function - completely dynamic GST
  const calculatePaymentBreakdown = () => {
    console.log("=== CALCULATING PAYMENT BREAKDOWN ===")
    console.log("Current GST Config:", gstConfig)

    const checkedItems = formData.rows.filter((_, index) => checkedRows[index])
    console.log("Checked Items:", checkedItems)

    const totalOriginalAmount = checkedItems.reduce((total, item) => {
      return total + (Number.parseFloat(item.originalAmount) || 0)
    }, 0)

    const totalDiscountAmount = checkedItems.reduce((total, item) => {
      return total + (Number.parseFloat(item.discountAmount) || 0)
    }, 0)

    const totalNetAmount = totalOriginalAmount - totalDiscountAmount

    // Only calculate GST if configuration is loaded and GST is applicable
    const totalGstAmount =
      gstConfig.gstApplicable && gstConfig.gstPercent > 0
        ? checkedItems.reduce((total, item) => {
          const itemOriginalAmount = Number.parseFloat(item.originalAmount) || 0
          const itemDiscountAmount = Number.parseFloat(item.discountAmount) || 0
          const itemNetAmount = itemOriginalAmount - itemDiscountAmount
          const itemGstAmount = (itemNetAmount * gstConfig.gstPercent) / 100
          console.log(
            `Item GST Calculation - Original: ${itemOriginalAmount}, Discount: ${itemDiscountAmount}, Net: ${itemNetAmount}, GST%: ${gstConfig.gstPercent}, GST Amount: ${itemGstAmount}`,
          )
          return total + itemGstAmount
        }, 0)
        : 0

    const finalAmount = totalNetAmount + totalGstAmount

    const breakdown = {
      totalOriginalAmount: totalOriginalAmount.toFixed(2),
      totalDiscountAmount: totalDiscountAmount.toFixed(2),
      totalNetAmount: totalNetAmount.toFixed(2),
      totalGstAmount: totalGstAmount.toFixed(2),
      finalAmount: finalAmount.toFixed(2),
      gstPercent: gstConfig.gstPercent || 0, // Use actual GST percent or 0
      gstApplicable: gstConfig.gstApplicable || false, // Use actual GST applicable or false
      itemCount: checkedItems.length,
    }

    console.log("Final Payment Breakdown:", breakdown)
    console.log("=== END PAYMENT BREAKDOWN ===")
    return breakdown
  }

  // Update handleSave to navigate to payment page - fix billing header ID passing
  const handleSave = async (e) => {
    e.preventDefault()
    if (!isFormValid) return

    try {
      setIsLoading(true)

      // Validate checked rows
      const hasCheckedItems = formData.rows.some((row, index) => checkedRows[index])
      if (!hasCheckedItems) {
        Swal.fire("Error!", "Please select at least one investigation or package.", "error")
        return
      }

      // Check for any invalid rows with no itemId
      const invalidRow = formData.rows.find((row, index) => checkedRows[index] && !row.itemId)
      if (invalidRow) {
        Swal.fire(
          "Error!",
          "One or more selected rows have no valid investigation/package. Please select from dropdown.",
          "error",
        )
        return
      }

      // Calculate payment breakdown
      const paymentBreakdown = calculatePaymentBreakdown()
      const totalFinalAmount = Number.parseFloat(paymentBreakdown.finalAmount)

      // Prepare selected items for payment page
      const selectedItems = {
        investigations: formData.rows
          .filter((row, index) => checkedRows[index] && row.type === "investigation")
          .map((row) => ({
            id: row.itemId,
            name: row.name,
            originalAmount: row.originalAmount,
            discountAmount: row.discountAmount,
            netAmount: row.netAmount,
            type: "i",
          })),
        packages: formData.rows
          .filter((row, index) => checkedRows[index] && row.type === "package")
          .map((row) => ({
            id: row.itemId,
            name: row.name,
            originalAmount: row.originalAmount,
            discountAmount: row.discountAmount,
            netAmount: row.netAmount,
            type: "p",
          })),
      }

      // Get billing header ID from location state - FIXED to use correct field name
      const billingData = location.state?.billingData
      let billingHeaderId = null

      if (billingData) {
        // Try different possible field names for billing header ID - now includes billingType as fallback
        billingHeaderId =
          billingData.billinghdid ||
          billingData.billHeaderId ||
          billingData.billinghdId ||
          billingData.billingHeaderId ||
          billingData.billHdId ||
          billingData.id ||
          billingData.billingType ||
          (Array.isArray(billingData) ? billingData[0]?.billinghdid : null) ||
          (Array.isArray(billingData) ? billingData[0]?.billHeaderId : null) ||
          (Array.isArray(billingData) ? billingData[0]?.billinghdId : null) ||
          (Array.isArray(billingData) ? billingData[0]?.id : null) ||
          (Array.isArray(billingData) ? billingData[0]?.billingType : null);
      }


      console.log("Billing Data:", billingData)
      console.log("Extracted Billing Header ID:", billingHeaderId)

      if (!billingHeaderId) {
        Swal.fire({
          title: "Error!",
          text: "Billing Header ID not found. Cannot proceed with payment. Please go back and try again.",
          icon: "error",
          confirmButtonText: "Go Back",
        })
        return
      }

      // Create lab data structure for payment processing
      const labData = {
        response: {
          billingType: billingData.billingType, // Use the correct field name
          billinghdid: billingHeaderId, // Also include lowercase version
          billHeaderId: billingHeaderId, // Add both possible field names
          // Add other necessary fields from billing data
          patientId: formData.patientId,
          totalAmount: totalFinalAmount,
        },
      }

      console.log("Navigating to payment with data:", {
        amount: totalFinalAmount,
        patientId: formData.patientId,
        labData,
        selectedItems,
        paymentBreakdown,
        billingHeaderId, 
        billingType: formData.billingType || billingData.billingType || "",// Add this for debugging
      })

      // Navigate to payment page with all required data
      navigate("/payment", {
        state: {
          amount: totalFinalAmount,
          patientId: formData.patientId,
          labData: labData,
          selectedItems: selectedItems,
          paymentBreakdown: paymentBreakdown,
          billingHeaderId: billingHeaderId,
          billingType: formData.billingType || billingData.billingType || "", // Pass it directly as well
        },
      })
    } catch (error) {
      console.error("Error preparing payment:", error)
      Swal.fire("Error!", error.message || "Something went wrong while preparing payment", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    navigate("/PendingForBilling")
  }

  const paymentBreakdown = calculatePaymentBreakdown()

  if (isLoading) {
    return <LoadingScreen />
  }

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
                            type="text"
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
                          <input
                            type="text"
                            className="form-control"
                            id="sex"
                            placeholder="Sex"
                            onChange={handleInputChange}
                            value={formData.sex}
                            required
                          />
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




                {/* Rest of the component remains the same... */}
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
                                      readOnly
                                    />
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
                    </div>
                  </div>
                </div>

                {/* Enhanced Payment Summary Section - same as lab registration */}
                {gstConfigLoaded && (
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
                              style={{
                                background: "rgba(255,255,255,0.15)",
                                border: "1px solid rgba(255,255,255,0.2)",
                              }}
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
                          {/* Tax Card - only show if GST is applicable */}
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
                                  <h6 className="card-title text-white mb-1">
                                    Tax ({paymentBreakdown.gstPercent}% GST)
                                  </h6>
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
                )}

                <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary me-2"
                    disabled={!isFormValid || isLoading || !gstConfigLoaded}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="fa fa-credit-card me-1"></i>
                        Pay Now - ₹{paymentBreakdown.finalAmount}
                      </>
                    )}
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
