"use client"

import { useState, useRef } from "react"

const drugCodeOptions = [
  { id: 1, code: "D382", name: "OMEPRAZOLE CAPSULE 20 MG[148]" },
  { id: 2, code: "PCM001", name: "Paracetamol 500mg" },
  { id: 3, code: "IBU001", name: "Ibuprofen 400mg" },
  { id: 4, code: "ASP001", name: "Aspirin 75mg" },
  { id: 5, code: "DOL001", name: "Dolo 650mg" },
  { id: 6, code: "AMX001", name: "Amoxicillin 250mg" },
  { id: 7, code: "CIP001", name: "Ciprofloxacin 500mg" },
  { id: 8, code: "MET001", name: "Metformin 500mg" },
]

const batchOptions = {
  D382: [
    { batch: "SP2436", computedStock: 151 },
    { batch: "SP2437", computedStock: 89 },
    { batch: "SP2438", computedStock: 203 },
  ],
  PCM001: [
    { batch: "PCM001A", computedStock: 75 },
    { batch: "PCM001B", computedStock: 120 },
  ],
  IBU001: [
    { batch: "IBU001X", computedStock: 45 },
    { batch: "IBU001Y", computedStock: 67 },
  ],
  ASP001: [
    { batch: "ASP001M", computedStock: 234 },
    { batch: "ASP001N", computedStock: 156 },
  ],
  DOL001: [
    { batch: "DOL001P", computedStock: 98 },
    { batch: "DOL001Q", computedStock: 134 },
  ],
}

const PhysicalStockAdjustment = () => {
  const [reasonForStockTaking, setReasonForStockTaking] = useState("")

  const [stockEntries, setStockEntries] = useState([
    {
      id: 1,
      drugCode: "",
      drugName: "",
      batchNo: "",
      doe: "",
      computedStock: "",
      physicalStock: "",
      surplus: "",
      deficient: "",
      remarks: "",
    },
  ])

  const [popupMessage, setPopupMessage] = useState(null)
  const dropdownClickedRef = useRef(false)
  const [activeDrugCodeDropdown, setActiveDrugCodeDropdown] = useState(null)
  const [activeDrugNameDropdown, setActiveDrugNameDropdown] = useState(null)

  const handleStockEntryChange = (index, field, value) => {
    const updatedEntries = stockEntries.map((entry, i) => {
      if (i === index) {
        const updatedEntry = { ...entry, [field]: value }

        // Calculate surplus/deficient when physical stock changes
        if (field === "physicalStock" && entry.computedStock) {
          const computed = Number.parseFloat(entry.computedStock) || 0
          const physical = Number.parseFloat(value) || 0
          const difference = physical - computed

          if (difference > 0) {
            updatedEntry.surplus = difference.toString()
            updatedEntry.deficient = ""
          } else if (difference < 0) {
            updatedEntry.deficient = Math.abs(difference).toString()
            updatedEntry.surplus = ""
          } else {
            updatedEntry.surplus = ""
            updatedEntry.deficient = ""
          }
        }

        // When batch is selected, populate computed stock
        if (field === "batchNo" && entry.drugCode && batchOptions[entry.drugCode]) {
          const selectedBatch = batchOptions[entry.drugCode].find((batch) => batch.batch === value)
          if (selectedBatch) {
            updatedEntry.computedStock = selectedBatch.computedStock.toString()
            // Recalculate surplus/deficient if physical stock exists
            if (entry.physicalStock) {
              const computed = selectedBatch.computedStock
              const physical = Number.parseFloat(entry.physicalStock) || 0
              const difference = physical - computed

              if (difference > 0) {
                updatedEntry.surplus = difference.toString()
                updatedEntry.deficient = ""
              } else if (difference < 0) {
                updatedEntry.deficient = Math.abs(difference).toString()
                updatedEntry.surplus = ""
              } else {
                updatedEntry.surplus = ""
                updatedEntry.deficient = ""
              }
            }
          }
        }

        return updatedEntry
      }
      return entry
    })
    setStockEntries(updatedEntries)
  }

  const addNewRow = () => {
    const newEntry = {
      id: Date.now(),
      drugCode: "",
      drugName: "",
      batchNo: "",
      doe: "",
      computedStock: "",
      physicalStock: "",
      surplus: "",
      deficient: "",
      remarks: "",
    }
    setStockEntries([...stockEntries, newEntry])
  }

  const removeRow = (index) => {
    if (stockEntries.length > 1) {
      const filteredEntries = stockEntries.filter((_, i) => i !== index)
      setStockEntries(filteredEntries)
    }
  }

  const handleSubmit = () => {
    const hasEmptyRequiredFields = stockEntries.some(
      (entry) => !entry.drugCode || !entry.drugName || !entry.physicalStock,
    )

    if (hasEmptyRequiredFields) {
      showPopup("Please fill in all required fields (Drug Code, Drug Name, Physical Stock)", "error")
      return
    }

    if (!reasonForStockTaking.trim()) {
      showPopup("Please provide a reason for stock taking", "error")
      return
    }

    const submissionData = {
      reasonForStockTaking,
      stockEntries: stockEntries.filter((entry) => entry.drugCode || entry.drugName),
    }

    console.log("Submitting:", submissionData)
    showPopup("Stock adjustment submitted successfully!", "success")
  }

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
      },
    })
  }

  const handleReset = () => {
    setReasonForStockTaking("")
    setStockEntries([
      {
        id: 1,
        drugCode: "",
        drugName: "",
        batchNo: "",
        doe: "",
        computedStock: "",
        physicalStock: "",
        surplus: "",
        deficient: "",
        remarks: "",
      },
    ])
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header" >
              <h4 className="card-title p-2 mb-0">Physical Stock Taking/Stock Adjustment</h4>
            </div>
            <div className="card-body">
              {/* Stock Entry Table - Horizontally Scrollable */}
              <div
                className="table-responsive"
                style={{
                  overflowX: "auto",
                  maxWidth: "100%",
                  overflowY: "visible",
                }}
              >
                <table className="table table-bordered table-hover align-middle" style={{ minWidth: "1800px" }}>
                  <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                    <tr>
                      <th className="text-center" style={{ width: "60px", minWidth: "60px" }}>
                        S.No.
                      </th>
                      <th style={{ width: "120px", minWidth: "120px" }}>Drug Code</th>
                      <th style={{ width: "300px", minWidth: "300px" }}>Drug Name</th>
                      <th style={{ width: "120px", minWidth: "120px" }}>Batch No.</th>
                      <th style={{ width: "120px", minWidth: "120px" }}>DOE</th>
                      <th style={{ width: "120px", minWidth: "120px" }}>Computed Stock</th>
                      <th style={{ width: "120px", minWidth: "120px" }}>Physical Stock</th>
                      <th style={{ width: "100px", minWidth: "100px" }}>Surplus</th>
                      <th style={{ width: "100px", minWidth: "100px" }}>Deficient</th>
                      <th style={{ width: "150px", minWidth: "150px" }}>Remarks</th>
                      <th style={{ width: "60px", minWidth: "60px" }}>Add</th>
                      <th style={{ width: "70px", minWidth: "70px" }}>Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockEntries.map((entry, index) => (
                      <tr key={entry.id}>
                        <td className="text-center fw-bold">{index + 1}</td>

                        {/* Drug Code with Dropdown */}
                        <td style={{ position: "relative" }}>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={entry.drugCode}
                            onChange={(e) => {
                              const value = e.target.value
                              handleStockEntryChange(index, "drugCode", value)
                              if (value.length > 0) {
                                setActiveDrugCodeDropdown(index)
                              } else {
                                setActiveDrugCodeDropdown(null)
                              }
                            }}
                            placeholder="Code"
                            style={{ minWidth: "100px" }}
                            autoComplete="off"
                            onFocus={() => setActiveDrugCodeDropdown(index)}
                            onBlur={() => {
                              setTimeout(() => {
                                if (!dropdownClickedRef.current) {
                                  setActiveDrugCodeDropdown(null)
                                }
                                dropdownClickedRef.current = false
                              }, 150)
                            }}
                          />
                          {activeDrugCodeDropdown === index && (
                            <ul
                              className="list-group position-absolute w-100 mt-1"
                              style={{
                                zIndex: 9999,
                                maxHeight: 180,
                                overflowY: "auto",
                                backgroundColor: "white",
                                border: "1px solid #dee2e6",
                                borderRadius: "0.375rem",
                                boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.15)",
                              }}
                            >
                              {drugCodeOptions
                                .filter(
                                  (opt) =>
                                    entry.drugCode === "" ||
                                    opt.code.toLowerCase().includes(entry.drugCode.toLowerCase()) ||
                                    opt.name.toLowerCase().includes(entry.drugCode.toLowerCase()),
                                )
                                .map((opt) => (
                                  <li
                                    key={opt.id}
                                    className="list-group-item list-group-item-action"
                                    style={{ cursor: "pointer" }}
                                    onMouseDown={(e) => {
                                      e.preventDefault()
                                      dropdownClickedRef.current = true
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      const updatedEntries = stockEntries.map((entry, i) => {
                                        if (i === index) {
                                          return {
                                            ...entry,
                                            drugCode: opt.code,
                                            drugName: opt.name,
                                            batchNo: "",
                                            computedStock: "",
                                          }
                                        }
                                        return entry
                                      })
                                      setStockEntries(updatedEntries)
                                      setActiveDrugCodeDropdown(null)
                                      dropdownClickedRef.current = false
                                    }}
                                  >
                                    {opt.code} - {opt.name}
                                  </li>
                                ))}
                              {drugCodeOptions.filter(
                                (opt) =>
                                  entry.drugCode === "" ||
                                  opt.code.toLowerCase().includes(entry.drugCode.toLowerCase()) ||
                                  opt.name.toLowerCase().includes(entry.drugCode.toLowerCase()),
                              ).length === 0 &&
                                entry.drugCode !== "" && (
                                  <li className="list-group-item text-muted">No matches found</li>
                                )}
                            </ul>
                          )}
                        </td>

                        {/* Drug Name with Dropdown */}
                        <td style={{ position: "relative" }}>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={entry.drugName}
                            onChange={(e) => {
                              const value = e.target.value
                              handleStockEntryChange(index, "drugName", value)
                              if (value.length > 0) {
                                setActiveDrugNameDropdown(index)
                              } else {
                                setActiveDrugNameDropdown(null)
                              }
                            }}
                            placeholder="Drug Name"
                            style={{ minWidth: "280px" }}
                            autoComplete="off"
                            onFocus={() => setActiveDrugNameDropdown(index)}
                            onBlur={() => {
                              setTimeout(() => {
                                if (!dropdownClickedRef.current) {
                                  setActiveDrugNameDropdown(null)
                                }
                                dropdownClickedRef.current = false
                              }, 150)
                            }}
                          />
                          {activeDrugNameDropdown === index && (
                            <ul
                              className="list-group position-absolute w-100 mt-1"
                              style={{
                                zIndex: 9999,
                                maxHeight: 180,
                                overflowY: "auto",
                                backgroundColor: "white",
                                border: "1px solid #dee2e6",
                                borderRadius: "0.375rem",
                                boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.15)",
                              }}
                            >
                              {drugCodeOptions
                                .filter(
                                  (opt) =>
                                    entry.drugName === "" ||
                                    opt.name.toLowerCase().includes(entry.drugName.toLowerCase()) ||
                                    opt.code.toLowerCase().includes(entry.drugName.toLowerCase()),
                                )
                                .map((opt) => (
                                  <li
                                    key={opt.id}
                                    className="list-group-item list-group-item-action"
                                    style={{ cursor: "pointer" }}
                                    onMouseDown={(e) => {
                                      e.preventDefault()
                                      dropdownClickedRef.current = true
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      const updatedEntries = stockEntries.map((entry, i) => {
                                        if (i === index) {
                                          return {
                                            ...entry,
                                            drugCode: opt.code,
                                            drugName: opt.name,
                                            batchNo: "",
                                            computedStock: "",
                                          }
                                        }
                                        return entry
                                      })
                                      setStockEntries(updatedEntries)
                                      setActiveDrugNameDropdown(null)
                                      dropdownClickedRef.current = false
                                    }}
                                  >
                                    {opt.code} - {opt.name}
                                  </li>
                                ))}
                              {drugCodeOptions.filter(
                                (opt) =>
                                  entry.drugName === "" ||
                                  opt.name.toLowerCase().includes(entry.drugName.toLowerCase()) ||
                                  opt.code.toLowerCase().includes(entry.drugName.toLowerCase()),
                              ).length === 0 &&
                                entry.drugName !== "" && (
                                  <li className="list-group-item text-muted">No matches found</li>
                                )}
                            </ul>
                          )}
                        </td>

                        {/* Batch No Dropdown */}
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={entry.batchNo}
                            onChange={(e) => handleStockEntryChange(index, "batchNo", e.target.value)}
                            style={{ minWidth: "110px" }}
                            disabled={!entry.drugCode}
                          >
                            <option value="">Select Batch</option>
                            {entry.drugCode &&
                              batchOptions[entry.drugCode] &&
                              batchOptions[entry.drugCode].map((batch, idx) => (
                                <option key={idx} value={batch.batch}>
                                  {batch.batch}
                                </option>
                              ))}
                          </select>
                        </td>

                        <td>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            value={entry.doe}
                            onChange={(e) => handleStockEntryChange(index, "doe", e.target.value)}
                            style={{ minWidth: "120px" }}
                          />
                        </td>

                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={entry.computedStock}
                            readOnly
                            style={{ backgroundColor: "#f8f9fa", minWidth: "110px" }}
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={entry.physicalStock}
                            onChange={(e) => handleStockEntryChange(index, "physicalStock", e.target.value)}
                            placeholder="0"
                            min="0"
                            step="1"
                            style={{ minWidth: "110px" }}
                          />
                        </td>

                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={entry.surplus}
                            readOnly
                            style={{ backgroundColor: "#f8f9fa", minWidth: "90px" }}
                          />
                        </td>

                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={entry.deficient}
                            readOnly
                            style={{ backgroundColor: "#f8f9fa", minWidth: "90px" }}
                          />
                        </td>

                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={entry.remarks}
                            onChange={(e) => handleStockEntryChange(index, "remarks", e.target.value)}
                            placeholder="Remarks"
                            style={{ minWidth: "130px" }}
                          />
                        </td>

                        <td className="text-center">
                          <button
                            type="button"
                            className="btn"
                            onClick={addNewRow}
                            style={{
                              backgroundColor: "#d2691e",
                              color: "white",
                              border: "none",
                              width: "35px",
                              height: "35px",
                            }}
                            title="Add Row"
                          >
                            +
                          </button>
                        </td>

                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => removeRow(index)}
                            disabled={stockEntries.length === 1}
                            title="Delete Row"
                            style={{
                              width: "35px",
                              height: "35px",
                            }}
                          >
                            -
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Reason for Stock Taking */}
              <div className="row mt-4">
                <div className="col-md-6">
                  <label className="form-label fw-bold">
                    Reason for Stock Taking<span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={reasonForStockTaking}
                    onChange={(e) => setReasonForStockTaking(e.target.value)}
                    placeholder="Enter reason for stock taking..."
                  />
                </div>
              </div>

              {/* Popup Message */}
              {popupMessage && (
                <div className={`alert ${popupMessage.type === "success" ? "alert-success" : "alert-danger"} mt-3`}>
                  {popupMessage.message}
                  <button type="button" className="btn-close float-end" onClick={popupMessage.onClose}></button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSubmit}
                >
                  Submit
                </button>
                <button type="button" className="btn btn-danger" onClick={handleReset}>
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PhysicalStockAdjustment
