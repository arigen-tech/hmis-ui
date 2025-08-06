import { useState, useRef, useEffect } from "react"
import ReactDOM from "react-dom"
import { OPEN_BALANCE, MAS_DRUG_MAS } from "../../../config/apiConfig";
import { getRequest, postRequest } from "../../../service/apiService"



const PhysicalStockAdjustment = () => {
  const [reasonForTraking, setReasonForStockTaking] = useState("")
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
      stockId: "",
      itemId: "",
    },
  ])
  console.log("Initial Stock Entries:", stockEntries)
  const [popupMessage, setPopupMessage] = useState(null)
  const dropdownClickedRef = useRef(false)
  const [activeDrugCodeDropdown, setActiveDrugCodeDropdown] = useState(null)
  const [activeDrugNameDropdown, setActiveDrugNameDropdown] = useState(null)
  const [drugCodeOptions, setDrugCodeOptions] = useState([])
  const [batchData, setBatchData] = useState([])
    const [processing, setProcessing] = useState(false);
  

  // Create refs for input elements
  const drugCodeInputRefs = useRef({})
  const drugNameInputRefs = useRef({})
  const hospitalId = sessionStorage.getItem("hospitalId") || localStorage.getItem("hospitalId");
  const departmentId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId");

  const fatchDrugCodeOptions = async () => {
    try {
      const response = await getRequest(`${MAS_DRUG_MAS}/getAll2/1`);
      if (response && response.response) {
        setDrugCodeOptions(response.response);
      }
    } catch (err) {
      console.error("Error fetching drug options:", err);
    } finally {
    }
  };

  useEffect(() => {
    fatchDrugCodeOptions();
  }, []);

  const fatchBatchStockData = async (itemid) => {
    try {
      const response = await getRequest(`${OPEN_BALANCE}/getStockByItemId/${itemid}/${hospitalId}/${departmentId}`);
      if (response && response.response) {
        setBatchData(response.response);
      }
    } catch (err) {
      console.error("Error fetching drug options:", err);
    } finally {
    }
  };

  const handleStockEntryChange = (index, field, value) => {
    const updatedEntries = stockEntries.map((entry, i) => {
      if (i === index) {
        const updatedEntry = { ...entry, [field]: value }

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

        if (field === "batchNo" && entry.drugCode && batchData.length > 0) {
          const selectedBatch = batchData.find(
            (batch) => batch.batchNo === value && batch.itemCode === entry.drugCode
          );

          if (selectedBatch) {
            updatedEntry.computedStock = selectedBatch.openingQty.toString();
            updatedEntry.doe = selectedBatch.doe;
            updatedEntry.stockId = selectedBatch.stockId;

            if (entry.physicalStock) {
              const computed = Number.parseFloat(selectedBatch.openingQty) || 0;
              const physical = Number.parseFloat(entry.physicalStock) || 0;
              const difference = physical - computed;
              if (difference > 0) {
                updatedEntry.surplus = difference.toString();
                updatedEntry.deficient = "";
              } else if (difference < 0) {
                updatedEntry.deficient = Math.abs(difference).toString();
                updatedEntry.surplus = "";
              } else {
                updatedEntry.surplus = "";
                updatedEntry.deficient = "";
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


  //   const handleSave = async () => {
  //   const hasEmptyRequiredFields = stockEntries.some(
  //     (entry) => !entry.drugCode || !entry.drugName || !entry.physicalStock
  //   );

  //   if (hasEmptyRequiredFields) {
  //     showPopup("Please fill in all required fields (Drug Code, Drug Name, Physical Stock)", "error");
  //     return;
  //   }

  //   if (!reasonForTraking.trim()) {
  //     showPopup("Please provide a reason for stock taking", "error");
  //     return;
  //   }

  //   const payload = {
  //     id: "",
  //     reasonForTraking: reasonForTraking.trim(),
  //     stockEntries: stockEntries
  //       .filter((entry) => entry.drugCode || entry.drugName)
  //       .map((entry) => ({
  //         id: entry.id,
  //         drugCode: entry.drugCode,
  //         drugName: entry.drugName,
  //         batchNo: entry.batchNo,
  //         doe: entry.doe,
  //         computedStock: entry.computedStock,
  //         storeStockService: entry.physicalStock,
  //         stockSurplus: entry.surplus,
  //         stockDeficient: entry.deficient,
  //         remarks: entry.remarks,
  //         stockId: entry.stockId,
  //         itemId: entry.itemId,
  //         trakingMId: "",
  //       })),
  //   };

  //   try {
  //     setProcessing(true);

  //     const response = await postRequest(`${OPEN_BALANCE}/createPhysicalStock`, payload);
  //     if (response && response.response) {
  //       showPopup("Stock adjustment submitted successfully!", "success");
  //       handleReset();
  //     } else {
  //       showPopup("Failed to submit stock adjustment. Please try again.", "error");
  //     }
  //   } catch (error) {
  //     console.error("Error submitting stock adjustment:", error);
  //     showPopup("Error submitting stock adjustment. Please try again.", "error");
  //   }finally {
  //     setProcessing(false);
  //   }
  // };

  const handleSubmit = async (status) => {
    const hasEmptyRequiredFields = stockEntries.some(
      (entry) => !entry.drugCode || !entry.drugName || !entry.physicalStock
    );

    if (hasEmptyRequiredFields) {
      showPopup("Please fill in all required fields (Drug Code, Drug Name, Physical Stock)", "error");
      return;
    }

    if (!reasonForTraking.trim()) {
      showPopup("Please provide a reason for stock taking", "error");
      return;
    }

    const payload = {
      id: "",
      reasonForTraking: reasonForTraking.trim(),
      stockEntries: stockEntries,
      status: status
        .filter((entry) => entry.drugCode || entry.drugName)
        .map((entry) => ({
          id: entry.id,
          drugCode: entry.drugCode,
          drugName: entry.drugName,
          batchNo: entry.batchNo,
          doe: entry.doe,
          computedStock: entry.computedStock,
          storeStockService: entry.physicalStock,
          stockSurplus: entry.surplus,
          stockDeficient: entry.deficient,
          remarks: entry.remarks,
          stockId: entry.stockId,
          itemId: entry.itemId,
          trakingMId: "",
        })),
    };

    try {
      setProcessing(true);

      const response = await postRequest(`${OPEN_BALANCE}/createPhysicalStock`, payload);
      if (response && response.response) {
        showPopup("Stock adjustment submitted successfully!", "success");
        handleReset();
      } else {
        showPopup("Failed to submit stock adjustment. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error submitting stock adjustment:", error);
      showPopup("Error submitting stock adjustment. Please try again.", "error");
    }finally {
      setProcessing(false);
    }
  };


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
        stockId: "",
        itemId: "",
      },
    ])
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
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

                        <td style={{ position: "relative" }}>
                          <input
                            ref={(el) => (drugCodeInputRefs.current[index] = el)}
                            type="text"
                            className="form-control form-control-sm"
                            value={entry.drugCode}
                            onChange={(e) => {
                              const value = e.target.value;
                              handleStockEntryChange(index, "drugCode", value);
                              if (value.length > 0) {
                                setActiveDrugCodeDropdown(index);
                                // Find the drug option by code and fetch batch data
                                const selectedDrug = drugCodeOptions.find(opt => opt.code === value);
                                if (selectedDrug) {
                                  fatchBatchStockData(selectedDrug.id);
                                }
                              } else {
                                setActiveDrugCodeDropdown(null);
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
                              className="list-group position-fixed"
                              style={{
                                zIndex: 9999,
                                maxHeight: 180,
                                overflowY: "auto",
                                width: "200px",
                                top: `${drugCodeInputRefs.current[index]?.getBoundingClientRect().bottom + window.scrollY}px`,
                                left: `${drugCodeInputRefs.current[index]?.getBoundingClientRect().left + window.scrollX}px`,
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
                                            itemId: opt.id,
                                          }
                                        }
                                        return entry
                                      })
                                      setStockEntries(updatedEntries)
                                      setActiveDrugCodeDropdown(null)
                                      dropdownClickedRef.current = false
                                      // Fetch batch data for selected drug
                                      fatchBatchStockData(opt.id);
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

                        <td style={{ position: "relative" }}>
                          <input
                            ref={(el) => (drugNameInputRefs.current[index] = el)}
                            type="text"
                            className="form-control form-control-sm"
                            value={entry.drugName}
                            onChange={(e) => {
                              const value = e.target.value;
                              handleStockEntryChange(index, "drugName", value);
                              if (value.length > 0) {
                                setActiveDrugNameDropdown(index);
                                // Find the drug option by name and fetch batch data
                                const selectedDrug = drugCodeOptions.find(opt => opt.name === value);
                                if (selectedDrug) {
                                  fatchBatchStockData(selectedDrug.id);
                                }
                              } else {
                                setActiveDrugNameDropdown(null);
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
                          {activeDrugNameDropdown === index &&
                            ReactDOM.createPortal(
                              <ul
                                className="list-group position-fixed"
                                style={{
                                  zIndex: 9999,
                                  maxHeight: 180,
                                  overflowY: "auto",
                                  width: "280px",
                                  top: `${drugNameInputRefs.current[index]?.getBoundingClientRect().bottom + window.scrollY}px`,
                                  left: `${drugNameInputRefs.current[index]?.getBoundingClientRect().left + window.scrollX}px`,
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
                                              itemId: opt.id,

                                            }
                                          }
                                          return entry
                                        })
                                        setStockEntries(updatedEntries)
                                        setActiveDrugNameDropdown(null)
                                        dropdownClickedRef.current = false
                                        fatchBatchStockData(opt.id);
                                      }}
                                    >
                                      {opt.name}
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
                              </ul>,
                              document.body,
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
                              batchData
                                .filter((batch) => batch.itemCode === entry.drugCode)
                                .map((batch, idx) => (
                                  <option key={idx} value={batch.batchNo}>
                                    {batch.batchNo}
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
                            readOnly
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
                    Reason for Stock Taking
                    <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={reasonForTraking}
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
                  className="btn btn-warning"
                  disabled={processing}
                  onClick={() => handleSubmit("s")}
                >
                  Save
                </button>
                <button type="button" className="btn btn-primary" onClick={() => handleSubmit("p")} disabled={processing}>
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
