import { useState, useRef, useEffect } from "react"
import ReactDOM from "react-dom"
import Popup from "../../../Components/popup"
import { Store_Internal_Indent } from "../../../config/apiConfig"
import { getRequest, postRequest } from "../../../service/apiService"

const IndentIssue = () => {
  const [currentView, setCurrentView] = useState("list")
  const [processing, setProcessing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [itemOptions, setItemOptions] = useState([])
  const [batchOptions, setBatchOptions] = useState({})
  const [dtRecord, setDtRecord] = useState([])
  const [indentEntries, setIndentEntries] = useState([])
  const [popupMessage, setPopupMessage] = useState(null)
  const dropdownClickedRef = useRef(false)
  const [activeItemDropdown, setActiveItemDropdown] = useState(null)
  const [activeBatchDropdown, setActiveBatchDropdown] = useState(null)
  const itemInputRefs = useRef({})
  const batchInputRefs = useRef({})
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const [indentData, setIndentData] = useState([])
  const [filteredIndentData, setFilteredIndentData] = useState([])
  const [issueType, setIssueType] = useState("")
  const [showPreviousIssues, setShowPreviousIssues] = useState(false)
  const [previousIssuesData, setPreviousIssuesData] = useState([])

  const departmentId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId")

  // Fetch pending indents for issue department
  const fetchPendingIndentsForIssue = async (deptId) => {
    try {
      if (!deptId) {
        console.error("deptId is missing. Cannot fetch pending indents.");
        showPopup("Department not found. Please login again.", "error");
        return;
      }

      setLoading(true);

      const url = `${Store_Internal_Indent}/getallindentforissue?deptId=${deptId}`;

      console.log("Fetching indents for issue from URL:", url);

      const response = await getRequest(url);
      console.log("Indents for Issue API Full Response:", response);

      let data = [];
      if (response && response.response && Array.isArray(response.response)) {
        data = response.response;
      } else if (response && Array.isArray(response)) {
        data = response;
      } else {
        console.warn("Unexpected response structure, using empty array:", response);
        data = [];
      }

      console.log("Processed indents data for issue:", data);
      setIndentData(data);
      setFilteredIndentData(data);

    } catch (err) {
      console.error("Error fetching indents for issue:", err);
      showPopup("Error fetching indents. Please try again.", "error");
      setIndentData([]);
      setFilteredIndentData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingIndentsForIssue(departmentId);
  }, [departmentId]);

  useEffect(() => {
    // Extract all items from indents for dropdown options
    const allItems = [];
    const batchMap = {};
    
    console.log("Processing indent data for batch options:", indentData);
    
    indentData.forEach(indent => {
      if (indent.items && Array.isArray(indent.items)) {
        indent.items.forEach(item => {
          const itemCode = item.pvmsNo || `ITEM_${item.itemId}`;
          
          // Calculate total available stock as SUM of all batch stocks
          let totalAvailableStock = 0;
          if (item.batches && Array.isArray(item.batches)) {
            totalAvailableStock = item.batches.reduce((sum, batch) => {
              return sum + (Number(batch.batchstock) || 0);
            }, 0);
          }
          
          if (!allItems.some(existing => existing.itemId === item.itemId)) {
            allItems.push({
              id: item.itemId,
              code: itemCode,
              name: item.itemName || "",
              unit: item.unitAuName || "",
              availableStock: totalAvailableStock  // SUM of all batches
            });
          }
          
          // Extract batch options for this item
          if (item.batches && Array.isArray(item.batches)) {
            console.log(`Processing batches for item ${itemCode}:`, item.batches);
            
            batchMap[itemCode] = item.batches.map(batch => ({
              batchNo: batch.batchNo,
              dom: batch.manufactureDate,
              doe: batch.expiryDate,
              stock: batch.batchstock || 0,  // Individual batch stock
              totalAvailableStock: totalAvailableStock  // SUM of all batches
            }));
          }
        });
      }
    });
    
    console.log("Batch map created:", batchMap);
    setItemOptions(allItems);
    setBatchOptions(batchMap);
  }, [indentData]);

  const handleSearch = () => {
    if (!fromDate || !toDate) {
      setFilteredIndentData(indentData)
      return
    }
    const from = new Date(fromDate)
    const to = new Date(toDate)

    const filtered = indentData.filter((item) => {
      const itemDate = new Date(item.indentDate)
      return itemDate >= from && itemDate <= to
    })
    setFilteredIndentData(filtered)
    setCurrentPage(1)
  }

  // Function to calculate auto-filled qty issued based on batch stock and approved qty
  const calculateAutoQtyIssued = (batchStock, approvedQty) => {
    const batchStockNum = Number(batchStock) || 0;
    const approvedQtyNum = Number(approvedQty) || 0;
    
    console.log("Calculating auto qty issued - batchStock:", batchStockNum, "approvedQty:", approvedQtyNum);
    
    if (batchStockNum === 0 || approvedQtyNum === 0) return "";
    
    if (batchStockNum > approvedQtyNum) {
      return approvedQtyNum.toString();
    } else {
      return batchStockNum.toString();
    }
  };

  const handleIndentEntryChange = (index, field, value) => {
    const updatedEntries = [...indentEntries];

    if (field === "itemName") {
      const selectedItem = itemOptions.find((opt) => opt.name === value);
      const itemCode = selectedItem ? selectedItem.code : "";
      
      // Get total available stock from itemOptions (SUM of all batches)
      const totalAvailableStock = selectedItem ? selectedItem.availableStock : 0;
      
      updatedEntries[index] = {
        ...updatedEntries[index],
        itemName: value,
        itemCode: itemCode,
        itemId: selectedItem ? selectedItem.id : "",
        apu: selectedItem ? selectedItem.unit : "",
        availableStock: totalAvailableStock  // SUM of all batches
      };
      
      // Reset batch-related fields when item changes
      updatedEntries[index].batchNo = "";
      updatedEntries[index].dom = "";
      updatedEntries[index].doe = "";
      updatedEntries[index].batchStock = "";
      updatedEntries[index].qtyIssued = "";
      
    } else if (field === "batchNo") {
      const selectedBatch = batchOptions[updatedEntries[index].itemCode]?.find((b) => b.batchNo === value);
      console.log("Selected batch:", selectedBatch, "for item:", updatedEntries[index].itemCode);
      if (selectedBatch) {
        const newBatchStock = selectedBatch.stock || 0;
        const approvedQty = Number(updatedEntries[index].approvedQty) || 0;
        
        // Auto-calculate qty issued based on batch stock and approved qty
        const autoQtyIssued = calculateAutoQtyIssued(newBatchStock, approvedQty);
        
        console.log("Auto calculating qty issued - batchStock:", newBatchStock, "approvedQty:", approvedQty, "autoQtyIssued:", autoQtyIssued);
        
        updatedEntries[index] = {
          ...updatedEntries[index],
          batchNo: value,
          dom: selectedBatch.dom,
          doe: selectedBatch.doe,
          batchStock: newBatchStock,  // Individual batch stock
          qtyIssued: autoQtyIssued,
          balanceAfterIssue: approvedQty - Number(autoQtyIssued) || 0,
          // availableStock remains as SUM of all batches (already set from item)
        };
      }
    } else if (field === "qtyIssued") {
      const qtyIssued = Number(value) || 0;
      const approvedQty = Number(updatedEntries[index].approvedQty) || 0;
      const batchStock = Number(updatedEntries[index].batchStock) || 0;
      
      // Validate that qty issued doesn't exceed batch stock or approved qty
      let finalQtyIssued = qtyIssued;
      if (qtyIssued > batchStock) {
        finalQtyIssued = batchStock;
      }
      if (qtyIssued > approvedQty) {
        finalQtyIssued = approvedQty;
      }
      
      updatedEntries[index] = {
        ...updatedEntries[index],
        qtyIssued: finalQtyIssued.toString(),
        balanceAfterIssue: approvedQty - finalQtyIssued,
      };
    } else {
      updatedEntries[index] = {
        ...updatedEntries[index],
        [field]: value,
      };
    }

    setIndentEntries(updatedEntries);
  };

  const handleEditClick = (record, e) => {
    e.stopPropagation();
    setSelectedRecord(record);
    if (!record || !Array.isArray(record.items)) return;

    const entries = record.items.map((item) => {
      // Get the first batch as default
      const defaultBatch = item.batches && item.batches.length > 0 ? item.batches[0] : null;
      const defaultBatchStock = defaultBatch ? defaultBatch.batchstock : 0;
      const approvedQty = item.approvedQty || 0;
      
      // Calculate total available stock as SUM of all batch stocks
      let totalAvailableStock = 0;
      if (item.batches && Array.isArray(item.batches)) {
        totalAvailableStock = item.batches.reduce((sum, batch) => {
          return sum + (Number(batch.batchstock) || 0);
        }, 0);
      }
      
      // Auto-calculate qty issued based on batch stock and approved qty
      const autoQtyIssued = calculateAutoQtyIssued(defaultBatchStock, approvedQty);
      
      console.log("Default batch for item:", item.itemName, defaultBatch);
      console.log("Default batch stock:", defaultBatchStock, "Approved Qty:", approvedQty);
      console.log("Auto calculated qty issued:", autoQtyIssued);
      console.log("Total available stock (sum of all batches):", totalAvailableStock);
      
      return {
        id: item.indentTId || null,
        itemId: item.itemId || "",
        itemCode: item.pvmsNo || `ITEM_${item.itemId}`,
        itemName: item.itemName || "",
        apu: item.unitAuName || "",
        qtyDemanded: item.requestedQty || 0,
        approvedQty: approvedQty,
        batchNo: defaultBatch ? defaultBatch.batchNo : "",
        dom: defaultBatch ? defaultBatch.manufactureDate : "",
        doe: defaultBatch ? defaultBatch.expiryDate : "",
        qtyIssued: autoQtyIssued, // Auto-filled based on condition
        balanceAfterIssue: approvedQty - Number(autoQtyIssued) || 0,
        batchStock: defaultBatchStock,  // Individual batch stock
        availableStock: totalAvailableStock,  // SUM of all batches
        previousIssuedQty: 0,
      };
    });

    console.log("Setting indent entries:", entries);
    setIndentEntries(entries);
    setIssueType("");
    setCurrentView("detail");
  };

  const handleBackToList = () => {
    setCurrentView("list")
    setSelectedRecord(null)
    setIssueType("")
    setIndentEntries([])
  }

  const handleShowAll = () => {
    setFromDate("")
    setToDate("")
    setFilteredIndentData(indentData)
  }

  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    } else {
      alert("Please enter a valid page number.")
    }
  }

  const addNewRow = () => {
    const newEntry = {
      id: null,
      itemId: "",
      itemCode: "",
      itemName: "",
      apu: "",
      qtyDemanded: "",
      approvedQty: "",
      batchNo: "",
      dom: "",
      doe: "",
      qtyIssued: "",
      balanceAfterIssue: "",
      batchStock: "",
      availableStock: "",
      previousIssuedQty: 0,
    }
    setIndentEntries([...indentEntries, newEntry])
  }

  const removeRow = (index) => {
    if (indentEntries.length > 1) {
      const entryToRemove = indentEntries[index]
      if (entryToRemove.id) {
        setDtRecord((prev) => [...prev, entryToRemove.id])
      }
      const filteredEntries = indentEntries.filter((_, i) => i !== index)
      setIndentEntries(filteredEntries)
    }
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

  // Check if all items have Approved Qty equal to Qty Issued
  const isAllItemsFullyIssued = () => {
    return indentEntries.every(entry => {
      const approvedQty = Number(entry.approvedQty) || 0;
      const qtyIssued = Number(entry.qtyIssued) || 0;
      return approvedQty === qtyIssued;
    });
  };

  const validateSubmission = () => {
    const errors = []

    indentEntries.forEach((entry, index) => {
      if (!entry.itemCode || !entry.itemName) {
        errors.push(`Row ${index + 1}: Item Name/Code is required`)
      }
      if (!entry.batchNo && entry.availableStock > 0) {
        errors.push(`Row ${index + 1}: Batch No is required`)
      }
      if (entry.qtyIssued && Number(entry.qtyIssued) > Number(entry.batchStock)) {
        errors.push(`Row ${index + 1}: Qty Issued cannot exceed Batch Stock`)
      }
      if (entry.qtyIssued && Number(entry.qtyIssued) > Number(entry.approvedQty)) {
        errors.push(`Row ${index + 1}: Qty Issued cannot exceed Approved Qty`)
      }
    })

    if (!issueType) {
      errors.push("Please select issue type (Partially Issue or Fully Issue)")
    }

    if (issueType === "fully") {
      const allFullyIssued = indentEntries.every((entry) => {
        const qtyIssued = Number(entry.qtyIssued) || 0
        const approvedQty = Number(entry.approvedQty) || 0
        return qtyIssued === approvedQty
      })

      if (!allFullyIssued) {
        errors.push("For Fully Issue, all items must have Qty Issued equal to Approved Qty")
      }
    }

    return errors
  }

  const handleSubmit = async (type) => {
    setIssueType(type);
    
    const errors = validateSubmission()

    if (errors.length > 0) {
      showPopup(errors.join("\n"), "error")
      return
    }

    const payload = {
      indentId: selectedRecord?.indentMId,
      issueType: type,
      deletedT: Array.isArray(dtRecord) && dtRecord.length > 0 ? dtRecord : null,
      indentEntries: indentEntries
        .filter((entry) => entry.itemCode || entry.itemName)
        .map((entry) => ({
          id: entry.id,
          itemCode: entry.itemCode,
          itemName: entry.itemName,
          apu: entry.apu,
          qtyDemanded: entry.qtyDemanded ? Number(entry.qtyDemanded) : null,
          approvedQty: entry.approvedQty ? Number(entry.approvedQty) : null,
          batchNo: entry.batchNo,
          dom: entry.dom,
          doe: entry.doe,
          qtyIssued: entry.qtyIssued ? Number(entry.qtyIssued) : null,
          balanceAfterIssue: entry.balanceAfterIssue ? Number(entry.balanceAfterIssue) : null,
          batchStock: entry.batchStock ? Number(entry.batchStock) : null,
          availableStock: entry.availableStock ? Number(entry.availableStock) : null,
          previousIssuedQty: entry.previousIssuedQty ? Number(entry.previousIssuedQty) : null,
        })),
    }

    try {
      setProcessing(true)
      console.log("Payload to submit:", payload)
      showPopup(`Indent ${type === "fully" ? "fully" : "partially"} issued successfully! Report will be generated.`, "success")
      setTimeout(() => {
        handleBackToList()
      }, 2000)
    } catch (error) {
      console.error("Error submitting indent:", error)
      showPopup("Error issuing indent. Please try again.", "error")
    } finally {
      setProcessing(false)
    }
  }

  const handleViewPreviousIssues = (entry) => {
    // Mock data for Previous Issues
    const mockPreviousIssues = [
      {
        issueDate: "2024-10-15",
        indentNo: "00112233",
        qtyIssued: 150,
        batchNo: "BATCH001",
      },
      {
        issueDate: "2024-09-20",
        indentNo: "00112234",
        qtyIssued: 200,
        batchNo: "BATCH002",
      },
      {
        issueDate: "2024-08-10",
        indentNo: "00112235",
        qtyIssued: 100,
        batchNo: "BATCH001",
      },
    ]
    setPreviousIssuesData(mockPreviousIssues)
    setShowPreviousIssues(true)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ""
    return dateStr.split("T")[0]
  }

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return ""
    const date = new Date(dateTimeStr)
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const itemsPerPage = 10
  const currentItems = filteredIndentData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(filteredIndentData.length / itemsPerPage)

  const renderPagination = () => {
    const pageNumbers = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    if (startPage > 1) {
      pageNumbers.push(1)
      if (startPage > 2) pageNumbers.push("...")
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pageNumbers.push("...")
      pageNumbers.push(totalPages)
    }

    return pageNumbers.map((number, index) => (
      <li key={index} className={`page-item ${number === currentPage ? "active" : ""}`}>
        {typeof number === "number" ? (
          <button className="page-link" onClick={() => setCurrentPage(number)}>
            {number}
          </button>
        ) : (
          <span className="page-link disabled">{number}</span>
        )}
      </li>
    ))
  }

  // Previous Issues Modal
  const PreviousIssuesModal = () => {
    if (!showPreviousIssues) return null

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 10000,
        }}
        onClick={() => setShowPreviousIssues(false)}
      >
        <div
          style={{
            width: "calc(100vw - 310px)",
            backgroundColor: "white",
            left: "285px",
            maxWidth: "90%",
            maxHeight: "80vh",
            margin: "5vh auto",
            position: "fixed",
            padding: "20px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h5 className="mb-3">Previous Issues</h5>
          <table className="table table-bordered">
            <thead style={{ backgroundColor: "#9db4c0" }}>
              <tr>
                <th>Issue Date</th>
                <th>Indent No</th>
                <th>Qty Issued</th>
                <th>Batch No</th>
              </tr>
            </thead>
            <tbody>
              {previousIssuesData.map((issue, index) => (
                <tr key={index}>
                  <td>{formatDate(issue.issueDate)}</td>
                  <td>{issue.indentNo}</td>
                  <td>{issue.qtyIssued}</td>
                  <td>{issue.batchNo}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn btn-secondary mt-2" onClick={() => setShowPreviousIssues(false)}>
            Close
          </button>
        </div>
      </div>
    )
  }

  if (currentView === "detail") {
    return (
      <div className="content-wrapper">
        <PreviousIssuesModal />
        {popupMessage && (
          <Popup
            message={popupMessage.message}
            type={popupMessage.type}
            onClose={popupMessage.onClose}
          />
        )}
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div
                className="card-header d-flex justify-content-between align-items-center"
              >
                <h4 className="card-title p-2 mb-0">Indent Issue ({selectedRecord?.toDeptName || "Store"})</h4>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleBackToList}
                >
                  Back
                </button>
              </div>
              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Indent No.</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.indentNo || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Indent Date</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formatDate(selectedRecord?.indentDate)}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Requested By</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.createdBy || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Submission Date/Time</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formatDateTime(selectedRecord?.indentDate)}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                </div>

                <div className="row mb-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Approval Date/Time</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formatDateTime(selectedRecord?.approvedDate)}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Approved By</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.approvedBy || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Approved Date/Time({selectedRecord?.toDeptName || "Store"})</label>
                    
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.issuedDate ? formatDateTime(selectedRecord.issuedDate) : ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-bold">Approved By  ({selectedRecord?.toDeptName || "Store"}) </label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.issuedBy || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                </div>

                <div className="table-responsive" style={{ overflowX: "auto", maxWidth: "100%", overflowY: "visible" }}>
                  <table className="table table-bordered table-hover align-middle text-center">
                    <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                      <tr>
                        <th className="text-center" style={{ width: "20px", padding: "0" }}>S.No.</th>
                        <th style={{ width: "400px", padding: "0", minWidth: "400px" }}>Item Name/<br />Code</th>
                        <th style={{ width: "60px", minWidth: "60px", padding: "0", textAlign: "center" }}>A/U</th>
                        <th style={{ width: "100px", minWidth: "100px", whiteSpace: "normal", padding: "0", lineHeight: "1.2" }}>Batch<br />No.</th>
                        <th style={{ width: "100px", whiteSpace: "normal", padding: "1", lineHeight: "1" }}>DOM</th>
                        <th style={{ width: "100px", whiteSpace: "normal", padding: "1", lineHeight: "1" }}>DOE</th>
                        <th style={{ width: "90px", whiteSpace: "normal", padding: "1", lineHeight: "1.2" }}>Qty<br />Demanded</th>
                        <th style={{ width: "90px", whiteSpace: "normal", padding: "1", lineHeight: "1.2" }}>Approved<br />Qty</th>
                        <th style={{ width: "90px", whiteSpace: "normal", padding: "1", lineHeight: "1.2" }}>Qty<br />Issued</th>
                        <th style={{ width: "110px", whiteSpace: "normal", padding: "1", lineHeight: "1.2" }}>Balance<br />After Issue</th>
                        <th style={{ width: "120px", whiteSpace: "normal", padding: "1", lineHeight: "1.2" }}>Batch Stock</th>
                        <th style={{ width: "100px", whiteSpace: "normal", padding: "1", lineHeight: "1.2" }}>Available<br />Stock</th>
                        <th style={{ width: "100px", whiteSpace: "normal", padding: "1", lineHeight: "1.2" }}>Previous<br />Issued Qty</th>
                        <th style={{ width: "40px", textAlign: "center" }}>Add</th>
                        <th style={{ width: "50px", textAlign: "center" }}>Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {indentEntries.map((entry, index) => (
                        <tr key={entry.id || index}>
                          <td className="text-center fw-bold"
                            style={{ padding: "0", width: "20px" }}
                          >{index + 1}</td>

                          <td style={{ position: "relative" }}>
                            <input
                              ref={(el) => (itemInputRefs.current[index] = el)}
                              type="text"
                              className="form-control form-control-sm"
                              value={entry.itemName}
                              onChange={(e) => {
                                const value = e.target.value
                                handleIndentEntryChange(index, "itemName", value)
                                if (value.length > 0) {
                                  setActiveItemDropdown(index)
                                } else {
                                  setActiveItemDropdown(null)
                                }
                              }}
                              placeholder="Item Name/Code"
                              autoComplete="off"
                              onFocus={() => setActiveItemDropdown(index)}
                              onBlur={() => {
                                setTimeout(() => {
                                  if (!dropdownClickedRef.current) {
                                    setActiveItemDropdown(null)
                                  }
                                  dropdownClickedRef.current = false
                                }, 150)
                              }}
                            />
                            {activeItemDropdown === index &&
                              ReactDOM.createPortal(
                                <ul
                                  className="list-group position-fixed"
                                  style={{
                                    zIndex: 9999,
                                    maxHeight: 200,
                                    overflowY: "auto",
                                    top: `${itemInputRefs.current[index]?.getBoundingClientRect().bottom + window.scrollY}px`,
                                    left: `${itemInputRefs.current[index]?.getBoundingClientRect().left + window.scrollX}px`,
                                    backgroundColor: "white",
                                    border: "1px solid #dee2e6",
                                    borderRadius: "0.375rem",
                                    boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.15)",
                                  }}
                                >
                                  {itemOptions
                                    .filter(
                                      (opt) =>
                                        entry.itemName === "" ||
                                        opt.name.toLowerCase().includes(entry.itemName.toLowerCase()) ||
                                        opt.code.toLowerCase().includes(entry.itemName.toLowerCase()),
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
                                          handleIndentEntryChange(index, "itemName", opt.name)
                                          setActiveItemDropdown(null)
                                          dropdownClickedRef.current = false
                                        }}
                                      >
                                        {opt.code} - {opt.name} (Total Stock: {opt.availableStock})
                                      </li>
                                    ))}
                                  {itemOptions.filter(
                                    (opt) =>
                                      entry.itemName === "" ||
                                      opt.name.toLowerCase().includes(entry.itemName.toLowerCase()) ||
                                      opt.code.toLowerCase().includes(entry.itemName.toLowerCase()),
                                  ).length === 0 &&
                                    entry.itemName !== "" && (
                                      <li className="list-group-item text-muted">No matches found</li>
                                    )}
                                </ul>,
                                document.body,
                              )}
                          </td>

                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={entry.apu}
                              onChange={(e) => handleIndentEntryChange(index, "apu", e.target.value)}
                              placeholder="Unit"
                              disabled
                            />
                          </td>

                          <td style={{ position: "relative" }}>
                            <input
                              ref={(el) => (batchInputRefs.current[index] = el)}
                              type="text"
                              className="form-control form-control-sm"
                              value={entry.batchNo}
                              onChange={(e) => {
                                const value = e.target.value
                                handleIndentEntryChange(index, "batchNo", value)
                                if (value.length > 0) {
                                  setActiveBatchDropdown(index)
                                } else {
                                  setActiveBatchDropdown(null)
                                }
                              }}
                              placeholder="Batch"
                              autoComplete="off"
                              onFocus={() => entry.itemCode && setActiveBatchDropdown(index)}
                              onBlur={() => {
                                setTimeout(() => {
                                  if (!dropdownClickedRef.current) {
                                    setActiveBatchDropdown(null)
                                  }
                                  dropdownClickedRef.current = false
                                }, 150)
                              }}
                            />
                            {activeBatchDropdown === index &&
                              entry.itemCode &&
                              batchOptions[entry.itemCode] &&
                              ReactDOM.createPortal(
                                <ul
                                  className="list-group position-fixed"
                                  style={{
                                    zIndex: 9999,
                                    maxHeight: 200,
                                    overflowY: "auto",
                                    top: `${batchInputRefs.current[index]?.getBoundingClientRect().bottom + window.scrollY}px`,
                                    left: `${batchInputRefs.current[index]?.getBoundingClientRect().left + window.scrollX}px`,
                                    backgroundColor: "white",
                                    border: "1px solid #dee2e6",
                                    borderRadius: "0.375rem",
                                    boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.15)",
                                  }}
                                >
                                  {batchOptions[entry.itemCode]
                                    .filter(
                                      (batch) =>
                                        entry.batchNo === "" ||
                                        batch.batchNo.toLowerCase().includes(entry.batchNo.toLowerCase()),
                                    )
                                    .map((batch, batchIndex) => (
                                      <li
                                        key={`${batch.batchNo}-${batchIndex}`}
                                        className="list-group-item list-group-item-action"
                                        style={{ cursor: "pointer" }}
                                        onMouseDown={(e) => {
                                          e.preventDefault()
                                          dropdownClickedRef.current = true
                                        }}
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          handleIndentEntryChange(index, "batchNo", batch.batchNo)
                                          setActiveBatchDropdown(null)
                                          dropdownClickedRef.current = false
                                        }}
                                      >
                                        <div>
                                          <strong>{batch.batchNo}</strong>
                                        </div>
                                        <div>
                                          <small className="text-muted">
                                            DOM: {formatDate(batch.dom)} | DOE: {formatDate(batch.doe)}
                                          </small>
                                        </div>
                                        <div>
                                          <small className="text-muted">
                                            Batch Stock: {batch.stock} | Total Available: {batch.totalAvailableStock}
                                          </small>
                                        </div>
                                      </li>
                                    ))}
                                  {batchOptions[entry.itemCode].filter(
                                    (batch) =>
                                      entry.batchNo === "" ||
                                      batch.batchNo.toLowerCase().includes(entry.batchNo.toLowerCase()),
                                  ).length === 0 &&
                                    entry.batchNo !== "" && (
                                      <li className="list-group-item text-muted">No matches found</li>
                                    )}
                                </ul>,
                                document.body,
                              )}
                          </td>

                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              style={{ width: "100px", padding: "0" }}
                              value={formatDate(entry.dom)}
                              onChange={(e) => handleIndentEntryChange(index, "dom", e.target.value)}
                              readOnly
                            />
                          </td>

                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              style={{ width: "100px", padding: "0" }}
                              value={formatDate(entry.doe)}
                              onChange={(e) => handleIndentEntryChange(index, "doe", e.target.value)}
                              readOnly
                            />
                          </td>

                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={entry.qtyDemanded}
                              onChange={(e) => handleIndentEntryChange(index, "qtyDemanded", e.target.value)}
                              placeholder="0"
                              readOnly
                              min="0"
                            />
                          </td>

                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={entry.approvedQty}
                              onChange={(e) => handleIndentEntryChange(index, "approvedQty", e.target.value)}
                              placeholder="0"
                              readOnly
                              min="0"
                            />
                          </td>

                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={entry.qtyIssued}
                              onChange={(e) => handleIndentEntryChange(index, "qtyIssued", e.target.value)}
                              placeholder="0"
                              min="0"
                              title="Auto-filled based on Batch Stock and Approved Qty"
                            />
                          </td>

                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={entry.balanceAfterIssue}
                              placeholder="0"
                              style={{ backgroundColor: "#f8f9fa" }}
                              readOnly
                            />
                          </td>

                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              style={{width: "80px"}}
                              value={entry.batchStock}
                              placeholder="0"
                              readOnly
                              title="Stock for selected batch only"
                            />
                          </td>

                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={entry.availableStock}
                              placeholder="0"
                              readOnly
                              title="Total stock across all batches for this item"
                            />
                          </td>

                          <td>
                            <button
                              type="button"
                              className="btn btn-info btn-sm"
                              onClick={() => handleViewPreviousIssues(entry)}
                            >
                              <i className="bi bi-info-circle"></i>
                            </button>
                          </td>

                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-success btn-sm"
                              onClick={addNewRow}
                              style={{
                                color: "white",
                                border: "none",
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
                              disabled={indentEntries.length === 1}
                              title="Delete Row"
                              style={{
                                height: "35px",
                              }}
                            >
                              −
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={() => handleSubmit("partially")}
                    disabled={processing || isAllItemsFullyIssued()}
                  >
                    {processing ? "Processing..." : "Partially Issue"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleSubmit("fully")}
                    disabled={processing}
                  >
                    {processing ? "Processing..." : "Fully Issue"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleBackToList}
                  >
                    Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="content-wrapper">
      <PreviousIssuesModal />
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div
              className="card-header d-flex justify-content-between align-items-center"
            >
              <h4 className="card-title p-2 mb-0">Indent Issue List</h4>
              <div>
                <button
                  type="button btn"
                  className="btn me-2 btn-primary"
                  onClick={handleShowAll}
                >
                  Show All
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-3">
                  <label className="form-label fw-bold">From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSearch}
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                    <tr>
                      <th>Department</th>
                      <th>Indent No.</th>
                      <th>Indent Date</th>
                      <th>Submission Date/Time</th>
                      <th>Approval Date/Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center">
                          {loading ? "Loading..." : "No records found."}
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((item) => (
                        <tr key={item.indentMId} onClick={(e) => handleEditClick(item, e)} style={{ cursor: "pointer" }}>
                          <td>{item.fromDeptName}</td>
                          <td>{item.indentNo}</td>
                          <td>{formatDate(item.indentDate)}</td>
                          <td>{formatDateTime(item.indentDate)}</td>
                          <td>{formatDateTime(item.approvedDate)}</td>
                          <td>
                            <span
                              className="badge bg-warning text-dark"
                            >
                              Pending for issue
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <nav className="d-flex justify-content-between align-items-center mt-2">
                <div>
                  <span>
                    Page {currentPage} of {totalPages} | Total Records: {filteredIndentData.length}
                  </span>
                </div>
                <ul className="pagination mb-0">{renderPagination()}</ul>
                <div className="d-flex align-items-center">
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    placeholder="Go to page"
                    className="form-control me-2"
                    style={{ width: "120px" }}
                  />
                  <button className="btn btn-primary" onClick={handlePageNavigation}>
                    Go
                  </button>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IndentIssue