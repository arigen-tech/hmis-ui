import { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { OPEN_BALANCE, MAS_DRUG_MAS, ALL_REPORTS } from "../../../config/apiConfig";
import { getRequest, putRequest } from "../../../service/apiService";
import Pagination, {DEFAULT_ITEMS_PER_PAGE} from "../../../Components/Pagination";

const PhysicalStockAdjustmentViewUpdate = () => {
  const [currentView, setCurrentView] = useState("list");
  const [processing, setProcessing] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [drugCodeOptions, setDrugCodeOptions] = useState([]);
  const [batchData, setBatchData] = useState([]);
  const [dtRecord, setDtRecord] = useState([]);
  const [detailEntries, setDetailEntries] = useState([]);
  const [physicalStockData, setPhysicalStockData] = useState([]);
  const [filteredPhysicalStockData, setFilteredPhysicalStockData] = useState([]);
  const [reasonForStockTaking, setReasonForStockTaking] = useState("");
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
      batchData: [],
    },
  ]);
  const [popupMessage, setPopupMessage] = useState(null);
  const dropdownClickedRef = useRef(false);
  const [activeDrugCodeDropdown, setActiveDrugCodeDropdown] = useState(null);
  const [activeDrugNameDropdown, setActiveDrugNameDropdown] = useState(null);
  const drugCodeInputRefs = useRef({});
  const drugNameInputRefs = useRef({});
  const [fromDate, setFromDate] = useState("2025-07-17");
  const [toDate, setToDate] = useState("2025-07-17");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
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
    }
  };

  const fatchPhysicalStock = async () => {
    try {
      const status = "s,p,r,a";
      const response = await getRequest(`${OPEN_BALANCE}/listPhysical/${status}/${hospitalId}/${departmentId}`);
      if (response) {
        setPhysicalStockData(response);
      }
    } catch (err) {
      console.error("Error fetching drug options:", err);
    }
  };

  useEffect(() => {
    fatchDrugCodeOptions();
    fatchPhysicalStock();
  }, []);

  useEffect(() => {
    setFilteredPhysicalStockData(physicalStockData);
  }, [physicalStockData]);

  const handleSearch = () => {
    if (!fromDate || !toDate) {
      setFilteredPhysicalStockData(physicalStockData);
      return;
    }
    const from = new Date(fromDate);
    const to = new Date(toDate);

    const filtered = physicalStockData.filter(item => {
      const itemDate = new Date(item.physicalDate);
      return itemDate >= from && itemDate <= to;
    });
    setFilteredPhysicalStockData(filtered);
    setCurrentPage(1);
  };

  const fetchBatchStockData = async (itemid, index) => {
    try {
      const response = await getRequest(`${OPEN_BALANCE}/getStockByItemId/${itemid}/${hospitalId}/${departmentId}`);
      if (response && response.response) {
        const updatedEntries = [...stockEntries];
        updatedEntries[index].batchData = response.response;
        setStockEntries(updatedEntries);
        setBatchData(response.response);

        console.log("Batch data fetched successfully:", updatedEntries);
      }
    } catch (err) {
      console.error("Error fetching batch data:", err);
    }
  };

  const handleStockEntryChange = async (index, field, value) => {
    let updatedEntries = [...stockEntries];

    if (field === "drugCode") {
      const selectedDrug = drugCodeOptions.find(opt => opt.code === value);
      updatedEntries[index] = {
        ...updatedEntries[index],
        drugCode: value,
        drugName: selectedDrug ? selectedDrug.name : "",
        batchNo: "",
        computedStock: "",
        doe: "",
        surplus: "",
        deficient: "",
        remarks: "",
        batchData: [],
      };
      if (selectedDrug) {
        await fetchBatchStockData(selectedDrug.id, index);
      }
    } else if (field === "drugName") {
      const selectedDrug = drugCodeOptions.find(opt => opt.name === value);
      updatedEntries[index] = {
        ...updatedEntries[index],
        drugName: value,
        drugCode: selectedDrug ? selectedDrug.code : "",
        batchNo: "",
        computedStock: "",
        doe: "",
        surplus: "",
        deficient: "",
        remarks: "",
        batchData: [],
      };
      if (selectedDrug) {
        await fetchBatchStockData(selectedDrug.id, index);
      }
    } else if (field === "batchNo") {
      updatedEntries[index] = {
        ...updatedEntries[index],
        batchNo: value,
      };
      const selectedBatch = updatedEntries[index].batchData?.find(
        batch => batch.batchNo === value
      );
      if (selectedBatch) {
        updatedEntries[index].computedStock = selectedBatch.openingQty.toString();
        updatedEntries[index].doe = selectedBatch.doe;
        updatedEntries[index].stockId = selectedBatch.stockId;
      }
    } else {
      updatedEntries[index] = {
        ...updatedEntries[index],
        [field]: value,
      };
    }

    // Surplus/Deficient calculation
    if (field === "physicalStock" && updatedEntries[index].computedStock) {
      const computed = Number.parseFloat(updatedEntries[index].computedStock) || 0;
      const physical = Number.parseFloat(value) || 0;
      const difference = physical - computed;
      if (difference > 0) {
        updatedEntries[index].surplus = difference.toString();
        updatedEntries[index].deficient = "";
      } else if (difference < 0) {
        updatedEntries[index].deficient = Math.abs(difference).toString();
        updatedEntries[index].surplus = "";
      } else {
        updatedEntries[index].surplus = "";
        updatedEntries[index].deficient = "";
      }
    }

    setStockEntries(updatedEntries);
  };
  const handleEditClick = async (record, e) => {
    e.stopPropagation();
    setSelectedRecord(record);
    if (!record || !Array.isArray(record.storeStockTakingTResponseList)) return;

    const entries = record.storeStockTakingTResponseList.map((entry) => ({
      id: entry.takingTId,
      batchNo: entry.batchNo,
      doe: entry.expiryDate,
      computedStock: entry.computedStock,
      physicalStock: entry.storeStockService,
      remarks: entry.remarks,
      surplus: entry.stockSurplus,
      deficient: entry.stockDeficient,
      drugName: entry.itemName,
      drugCode: entry.itemCode,
      stockId: entry.stockId,
      itemId: entry.itemId,
      batchData: [], // Initialize with empty batchData
    }));

    // Fetch batch data for each entry individually
    const entriesWithBatchData = await Promise.all(entries.map(async (entry) => {
      try {
        const response = await getRequest(`${OPEN_BALANCE}/getStockByItemId/${entry.itemId}/${hospitalId}/${departmentId}`);
        if (response && response.response) {
          return {
            ...entry,
            batchData: response.response,
          };
        }
      } catch (err) {
        console.error("Error fetching batch data for itemId:", entry.itemId, err);
      }
      return entry;
    }));

    setStockEntries(entriesWithBatchData);
    setReasonForStockTaking(record.reason);
    const entriesWithId = (record.openingBalanceDtResponseList || []).map((entry, idx) => ({
      ...entry,
      id: entry.id || entry.balanceTId || `row-${idx + 1}`,
    }));
    setDetailEntries(entriesWithId);
    setCurrentView("detail");
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedRecord(null);
  };

  const handleShowAll = () => {
    setFromDate("");
    setToDate("");
  };

  const addNewRow = () => {
    const newEntry = {
      id: null,
      drugCode: "",
      drugName: "",
      batchNo: "",
      doe: "",
      computedStock: "",
      physicalStock: "",
      surplus: "",
      deficient: "",
      remarks: "",
      batchData: [],
    };
    setStockEntries([...stockEntries, newEntry]);
  };

  const removeRow = (index) => {
    if (stockEntries.length > 1) {
      const entryToRemove = stockEntries[index];
      if (entryToRemove.id) {
        setDtRecord((prev) => [...prev, entryToRemove.id]);
      }
      const filteredEntries = stockEntries.filter((_, i) => i !== index);
      setStockEntries(filteredEntries);
    }
  };

  const deleteEntry = (id) => {
    setDetailEntries(detailEntries.filter((entry) => entry.id !== id));
    setDtRecord((prev) => [...prev, id]);
  };

  const handleSubmit = async (status) => {
    const hasEmptyRequiredFields = stockEntries.some(
      (entry) => !entry.drugCode || !entry.drugName || !entry.physicalStock
    );

    if (hasEmptyRequiredFields) {
      showPopup("Please fill in all required fields (Drug Code, Drug Name, Physical Stock)", "error");
      return;
    }

    if (!reasonForStockTaking.trim()) {
      showPopup("Please provide a reason for stock taking", "error");
      return;
    }

    const payload = {
      id: selectedRecord.takingMId,
      reasonForTraking: reasonForStockTaking.trim(),
      status: status,
      deletedT: Array.isArray(dtRecord) && dtRecord.length > 0 ? dtRecord : null,
      stockEntries: stockEntries
        .filter((entry) => entry.drugCode || entry.drugName)
        .map((entry) => ({
          id: entry.id,
          batchNo: entry.batchNo,
          doe: entry.doe,
          computedStock: entry.computedStock ? Number(entry.computedStock) : null,
          storeStockService: entry.physicalStock ? Number(entry.physicalStock) : null,
          stockSurplus: entry.surplus !== "" ? Number(entry.surplus) : null,
          stockDeficient: entry.deficient !== "" ? Number(entry.deficient) : null,
          remarks: entry.remarks,
          stockId: entry.stockId,
          itemId: entry.itemId,
          trakingMId: entry.takingMId,
        })),
    };

    try {
      setProcessing(true);
      const response = await putRequest(`${OPEN_BALANCE}/updatePhysicalById/${selectedRecord.takingMId}`, payload);
      if (response && response.response) {
        showPopup("Stock adjustment submitted successfully!", "success");
        handleReset();
      } else {
        showPopup("Failed to submit stock adjustment. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error submitting stock adjustment:", error);
      showPopup("Error submitting stock adjustment. Please try again.", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setReasonForStockTaking("");
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
        batchData: [],
      },
    ]);
  };

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      },
    });
  };

  const generatereport = async (id) => {

    if (!id) {
      alert("Please select List");
      return;
    }


    setIsGeneratingPDF(true);

    try {

      const url = `${ALL_REPORTS}/stockTakingReport?takingMId=${id}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const fileURL = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = fileURL;
      link.setAttribute("download", "DrugExpiryReport.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Error generating PDF", error);
      alert("Error generating PDF report. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredPhysicalStockData.slice(indexOfFirst, indexOfLast);

  const statusMap = {
    s: "Saved",
    p: "Pending for Approval",
    r: "Rejected",
    a: "Approved",
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return dateStr.split("T")[0];
  };

  if (currentView === "detail") {
    return (
      <div className="content-wrapper">
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">View And Edit Physical Stock Taking/Stock Adjustment</h4>
                <button type="button" className="btn btn-secondary" onClick={handleBackToList}>
                  Back to List
                </button>
              </div>
              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Stock Taking Date</label>
                    <input
                      type="text"
                      className="form-control"
                      value={
                        selectedRecord?.physicalDate
                          ? new Date(selectedRecord.physicalDate).toLocaleDateString("en-GB")
                          : ""
                      }
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Stock Taking Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.stockTakingNo || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Entered By</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.createdBy || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Department</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.departmentName || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3 mt-3">
                    <button
                      onClick={() => generatereport(selectedRecord?.takingMId)}
                      className="btn btn-success"
                      disabled={isGeneratingPDF}
                      type="button"
                    >
                      {isGeneratingPDF ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Generating...
                        </>
                      ) : (
                        " Download Invoice"
                      )}

                    </button>



                  </div>
                </div>

                <div className="table-responsive" style={{ overflowX: "auto", maxWidth: "100%", overflowY: "visible" }}>
                  <table className="table table-bordered table-hover align-middle" style={{ minWidth: "1800px" }}>
                    <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                      <tr>
                        <th className="text-center" style={{ width: "60px", minWidth: "60px" }}>S.No.</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>Drug Code</th>
                        <th style={{ width: "300px", minWidth: "300px" }}>Drug Name</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>Batch No.</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>DOE</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>Computed Stock</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>Physical Stock</th>
                        <th style={{ width: "100px", minWidth: "100px" }}>Surplus</th>
                        <th style={{ width: "100px", minWidth: "100px" }}>Deficient</th>
                        <th style={{ width: "150px", minWidth: "150px" }}>Remarks</th>
                        {(selectedRecord?.status === "s" || selectedRecord?.status === "r") && (
                          <>
                            <th style={{ width: "60px", minWidth: "60px" }}>Add</th>
                            <th style={{ width: "70px", minWidth: "70px" }}>Delete</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {stockEntries.map((entry, index) => (
                        <tr key={entry.id || index}>
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
                                    setActiveDrugCodeDropdown(null);
                                  }
                                  dropdownClickedRef.current = false;
                                }, 150);
                              }}
                              readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                            />
                            {(activeDrugCodeDropdown === index &&
                              (selectedRecord?.status === "s" || selectedRecord?.status === "r")) &&
                              ReactDOM.createPortal(
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
                                          e.preventDefault();
                                          dropdownClickedRef.current = true;
                                        }}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleStockEntryChange(index, "drugCode", opt.code);
                                          setActiveDrugCodeDropdown(null);
                                          dropdownClickedRef.current = false;
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
                                </ul>,
                                document.body
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
                                    setActiveDrugNameDropdown(null);
                                  }
                                  dropdownClickedRef.current = false;
                                }, 150);
                              }}
                              readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                            />
                            {(activeDrugNameDropdown === index &&
                              (selectedRecord?.status === "s" || selectedRecord?.status === "r")) &&
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
                                          e.preventDefault();
                                          dropdownClickedRef.current = true;
                                        }}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleStockEntryChange(index, "drugName", opt.name);
                                          setActiveDrugNameDropdown(null);
                                          dropdownClickedRef.current = false;
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

                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={entry.batchNo}
                              onChange={(e) => handleStockEntryChange(index, "batchNo", e.target.value)}
                              style={{ minWidth: "110px" }}
                              disabled={
                                selectedRecord?.status === "a" ||
                                (selectedRecord?.status === "p" && !entry.drugCode)
                              }
                            >
                              <option value="">Select Batch</option>
                              {entry.batchData?.map((batch, idx) => (
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
                              readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
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
                              readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                            />
                          </td>
                          {(selectedRecord?.status === "s" || selectedRecord?.status === "r") && (
                            <>
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
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="row mt-4">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      Reason for Stock Taking
                      <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={reasonForStockTaking}
                      onChange={(e) => setReasonForStockTaking(e.target.value)}
                      readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                      placeholder="Enter reason for stock taking..."
                    />
                  </div>
                </div>

                {(selectedRecord?.status === "s" || selectedRecord?.status === "r") && (
                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button type="button" className="btn btn-primary" onClick={() => handleSubmit("s")} disabled={processing}>
                      Update
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => handleSubmit("p")} disabled={processing}>
                      Submit
                    </button>
                    <button type="button" className="btn btn-danger" onClick={handleReset}>
                      Reset
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Physical Stock Taking/Stock Adjustment View & Update</h4>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-2">
                  <label className="form-label fw-bold">From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-bold">To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
                <div className="col-md-2 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-primary me-2"
                    onClick={handleSearch}
                  >
                    Search
                  </button>
                </div>
                <div className="col-md-6 d-flex justify-content-end align-items-end">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleShowAll}
                  >
                    Show All
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead style={{ backgroundColor: "#95a5a6", color: "white" }}>
                    <tr>
                      <th>Stock Taking No.</th>
                      <th>Stock Taking Date</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Submitted By</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center">No records found.</td>
                      </tr>
                    ) : (
                      currentItems.map((item) => (
                        <tr key={item.takingMId}>
                          <td>{item.stockTakingNo}</td>
                          <td>{formatDate(item.physicalDate)}</td>
                          <td>{item.departmentName}</td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                backgroundColor:
                                  statusMap[item.status] === "Pending for Approval"
                                    ? "#ffc107"
                                    : statusMap[item.status] === "Saved"
                                      ? "#17a2b8"
                                      : statusMap[item.status] === "Rejected"
                                        ? "#dc3545"
                                        : "#28a745",
                                color: statusMap[item.status] === "Pending for Approval" ? "#000" : "#fff",
                              }}
                            >
                              {statusMap[item.status] || item.status}
                            </span>
                          </td>
                          <td>{item.createdBy}</td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={(e) => handleEditClick(item, e)}
                              title={item.status === "s" || item.status === "r" ? "Edit Entry" : "View Entry"}
                            >
                              <i
                                className={
                                  item.status === "s" || item.status === "r"
                                    ? "fa fa-pencil"
                                    : "fa fa-eye"
                                }
                              ></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                                            totalItems={filteredPhysicalStockData.length}
                                            itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                            currentPage={currentPage}
                                            onPageChange={setCurrentPage}
                                        />

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhysicalStockAdjustmentViewUpdate;