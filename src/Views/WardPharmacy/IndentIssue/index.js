import { useState, useRef, useEffect } from "react"
import ReactDOM from "react-dom"

const IndentIssue = () => {
  const [currentView, setCurrentView] = useState("list")
  const [processing, setProcessing] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [itemOptions, setItemOptions] = useState([])
  const [batchOptions, setBatchOptions] = useState([])
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

  // Mock data for Indent Issue List
  const mockIndentData = [
    {
      indentId: 1,
      indentNo: "00178592025",
      indentDate: "2025-11-07",
      submissionDateTime: "2025-11-07T10:30:00",
      approvalDateTime: "2025-11-08T14:20:00",
      department: "0",
      createdBy: "Anurag Sharma",
      approvedBy: "Store Manager",
      status: "Pending for issue",
      items: [
        {
          id: 1,
          itemCode: "D264",
          itemName: "Hydrogen Peroxide Solution IP 6%",
          apu: "ML",
          qtyDemanded: 2,
          approvedQty: 2,
          batchNo: "EX2873",
          dom: "2024-01-09",
          doe: "2025-12-31",
          qtyIssued: 0,
          balanceAfterIssue: 2,
          batchStock: 5,
          availableStock: 75,
          previousIssuedQty: 0,
        },
        {
          id: 2,
          itemCode: "D273",
          itemName: "IBUPROFEN SUSPENSION 100MG/5ML",
          apu: "ML",
          qtyDemanded: 5,
          approvedQty: 5,
          batchNo: "",
          dom: "",
          doe: "",
          qtyIssued: 0,
          balanceAfterIssue: 5,
          batchStock: 0,
          availableStock: 0,
          previousIssuedQty: 0,
        },
        {
          id: 3,
          itemCode: "D0136",
          itemName: "PANTOPRAZOLE TABLET",
          apu: "Tab",
          qtyDemanded: 300,
          approvedQty: 300,
          batchNo: "PUP2400",
          dom: "2024-01-12",
          doe: "2026-11-30",
          qtyIssued: 0,
          balanceAfterIssue: 300,
          batchStock: 25000,
          availableStock: 25990,
          previousIssuedQty: 0,
        },
      ],
    },
    {
      indentId: 2,
      indentNo: "00128872024",
      indentDate: "2024-10-17",
      submissionDateTime: "2024-10-17T09:15:00",
      approvalDateTime: "2024-10-18T11:45:00",
      department: "05",
      createdBy: "Shashikala Roy",
      approvedBy: "Store Manager",
      status: "Pending for issue",
      items: [
        {
          id: 4,
          itemCode: "AMLO005",
          itemName: "Amlodipine 5mg Tablet",
          apu: "Unit",
          qtyDemanded: 500,
          approvedQty: 500,
          batchNo: "BATCH001",
          dom: "2024-03-15",
          doe: "2026-03-15",
          qtyIssued: 0,
          balanceAfterIssue: 500,
          batchStock: 1000,
          availableStock: 2500,
          previousIssuedQty: 0,
        },
      ],
    },
    {
      indentId: 3,
      indentNo: "00111222024",
      indentDate: "2024-07-09",
      submissionDateTime: "2024-07-09T13:20:00",
      approvalDateTime: "2024-07-10T10:30:00",
      department: "09",
      createdBy: "Rajesh Kumar",
      approvedBy: "Store Manager",
      status: "Partially Issue",
      items: [],
    },
    {
      indentId: 4,
      indentNo: "00106892024",
      indentDate: "2024-06-13",
      submissionDateTime: "2024-06-13T08:45:00",
      approvalDateTime: "2024-06-14T16:20:00",
      department: "10",
      createdBy: "Priya Singh",
      approvedBy: "Store Manager",
      status: "Pending for issue",
      items: [],
    },
    {
      indentId: 5,
      indentNo: "00101602024",
      indentDate: "2024-05-13",
      submissionDateTime: "2024-05-13T11:30:00",
      approvalDateTime: "2024-05-14T09:15:00",
      department: "15",
      createdBy: "Amit Patel",
      approvedBy: "Store Manager",
      status: "Pending for issue",
      items: [],
    },
  ]

  const mockItemOptions = [
    { id: 1, code: "D264", name: "Hydrogen Peroxide Solution IP 6%" },
    { id: 2, code: "D273", name: "IBUPROFEN SUSPENSION 100MG/5ML" },
    { id: 3, code: "D0136", name: "PANTOPRAZOLE TABLET" },
    { id: 4, code: "AMLO005", name: "Amlodipine 5mg Tablet" },
    { id: 5, code: "AMOX030", name: "Amoxycillin Powder for Oral Suspension IP 125 mg/5 ml" },
  ]

  const mockBatchOptions = {
    D264: [
      { batchNo: "EX2873", dom: "2024-01-09", doe: "2025-12-31", stock: 5 },
      { batchNo: "EX2874", dom: "2024-02-15", doe: "2026-02-15", stock: 20 },
      { batchNo: "EX2875", dom: "2024-03-20", doe: "2026-03-20", stock: 50 },
    ],
    D0136: [
      { batchNo: "PUP2400", dom: "2024-01-12", doe: "2026-11-30", stock: 25000 },
      { batchNo: "PUP2401", dom: "2024-02-10", doe: "2026-12-31", stock: 15000 },
    ],
    AMLO005: [
      { batchNo: "BATCH001", dom: "2024-03-15", doe: "2026-03-15", stock: 1000 },
      { batchNo: "BATCH002", dom: "2024-04-20", doe: "2026-04-20", stock: 1500 },
    ],
  }

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

  useEffect(() => {
    setIndentData(mockIndentData)
    setFilteredIndentData(mockIndentData)
    setItemOptions(mockItemOptions)
    setBatchOptions(mockBatchOptions)
  }, [])

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

  const handleIndentEntryChange = (index, field, value) => {
    const updatedEntries = [...indentEntries]

    if (field === "itemName") {
      const selectedItem = itemOptions.find((opt) => opt.name === value)
      updatedEntries[index] = {
        ...updatedEntries[index],
        itemName: value,
        itemCode: selectedItem ? selectedItem.code : "",
      }
    } else if (field === "batchNo") {
      const selectedBatch = batchOptions[updatedEntries[index].itemCode]?.find((b) => b.batchNo === value)
      if (selectedBatch) {
        updatedEntries[index] = {
          ...updatedEntries[index],
          batchNo: value,
          dom: selectedBatch.dom,
          doe: selectedBatch.doe,
          batchStock: selectedBatch.stock,
        }
      }
    } else if (field === "qtyIssued") {
      const qtyIssued = Number(value) || 0
      const approvedQty = Number(updatedEntries[index].approvedQty) || 0
      updatedEntries[index] = {
        ...updatedEntries[index],
        qtyIssued: value,
        balanceAfterIssue: approvedQty - qtyIssued,
      }
    } else {
      updatedEntries[index] = {
        ...updatedEntries[index],
        [field]: value,
      }
    }

    setIndentEntries(updatedEntries)
  }

  const handleEditClick = (record, e) => {
    e.stopPropagation()
    setSelectedRecord(record)
    if (!record || !Array.isArray(record.items)) return

    const entries = record.items.map((entry) => ({
      id: entry.id,
      itemCode: entry.itemCode,
      itemName: entry.itemName,
      apu: entry.apu,
      qtyDemanded: entry.qtyDemanded,
      approvedQty: entry.approvedQty,
      batchNo: entry.batchNo,
      dom: entry.dom,
      doe: entry.doe,
      qtyIssued: entry.qtyIssued,
      balanceAfterIssue: entry.balanceAfterIssue,
      batchStock: entry.batchStock,
      availableStock: entry.availableStock,
      previousIssuedQty: entry.previousIssuedQty,
    }))

    setIndentEntries(entries)
    setIssueType("")
    setCurrentView("detail")
  }

  const handleBackToList = () => {
    setCurrentView("list")
    setSelectedRecord(null)
    setIssueType("")
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
      previousIssuedQty: "",
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

  const validateSubmission = () => {
    const errors = []

    // Check if all items have required fields
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

  const handleSubmit = async () => {
    const errors = validateSubmission()

    if (errors.length > 0) {
      showPopup(errors.join("\n"), "error")
      return
    }

    const payload = {
      indentId: selectedRecord.indentId,
      issueType: issueType,
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
        })),
    }

    try {
      setProcessing(true)
      console.log("Payload to submit:", payload)
      showPopup("Indent issued successfully! Report will be generated.", "success")
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
    setPreviousIssuesData(mockPreviousIssues)
    setShowPreviousIssues(true)
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
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              zIndex: 10001,
              backgroundColor: popupMessage.type === "error" ? "#dc3545" : "#28a745",
              color: "white",
              padding: "15px 20px",
              borderRadius: "5px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              whiteSpace: "pre-line",
            }}
          >
            {popupMessage.message}
            <button
              onClick={popupMessage.onClose}
              style={{
                marginLeft: "15px",
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: "18px",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>
        )}
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div
                className="card-header d-flex justify-content-between align-items-center"
              >
                <h4 className="card-title p-2 mb-0">Indent Issue ({selectedRecord?.department || "Store"})</h4>
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
                      value={formatDateTime(selectedRecord?.submissionDateTime)}
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
                      value={formatDateTime(selectedRecord?.approvalDateTime)}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                    <div className="col-md-3">
                    <label className="form-label fw-bold">Issued Date/Time</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder=""
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-bold">Issued By</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder=""
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                </div>

                

                <div className="table-responsive" style={{ overflowX: "auto", maxWidth: "100%", overflowY: "visible" }}>
                  <table className="table table-bordered table-hover align-middle text-center" >
                    <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                    <tr>
  <th className="text-center" style={{ width: "20px", padding: "0" }}>S.No.</th>

  {/* Increased width for better readability */}
  <th style={{ width: "400px",padding: "0", padding: "0", minWidth:"400px" }}>Item Name/<br/>Code</th>

  <th style={{ width: "60px",minWidth:"60px",padding: "0",  textAlign: "center" }}>A/U</th>

  <th style={{ width: "100px",minWidth:"100px", whiteSpace: "normal",padding: "0",  lineHeight: "1.2" }}>Batch<br/>No.</th>

  <th style={{ width: "100px", whiteSpace: "normal", padding: "1", lineHeight: "1" }}>DOM</th>

  <th style={{ width: "100px", whiteSpace: "normal", padding: "1", lineHeight: "1" }}>DOE</th>

  <th style={{ width: "90px", whiteSpace: "normal", padding: "1", lineHeight: "1.2" }}>Qty<br/>Demanded</th>

  <th style={{ width: "90px", whiteSpace: "normal", padding: "1", lineHeight: "1.2" }}>Approved<br/>Qty</th>

  <th style={{ width: "90px", whiteSpace: "normal", padding: "1", lineHeight: "1.2" }}>Qty<br/>Issued</th>

  <th style={{ width: "110px", whiteSpace: "normal",padding: "1",  lineHeight: "1.2" }}>Balance<br/>After Issue</th>

  <th style={{ width: "90px", whiteSpace: "normal",padding: "1",  lineHeight: "1.2" }}>Batch Stock</th>

  <th style={{ width: "100px", whiteSpace: "normal", padding: "1", lineHeight: "1.2" }}>Available<br/>Stock</th>

  <th style={{ width: "100px", whiteSpace: "normal", padding: "1", lineHeight: "1.2" }}>Previous<br/>Issued Qty</th>

  <th style={{ width: "40px", textAlign: "center" }}>Add</th>
  <th style={{ width: "50px", textAlign: "center" }}>Delete</th>
</tr>


                    </thead>
                    <tbody>
                      {indentEntries.map((entry, index) => (
                        <tr key={entry.id || index}>
                          <td  className="text-center fw-bold"
                              style={{  padding: "0",  width: "20px" }}     
                          
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
                                        {opt.code} - {opt.name}
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
                              disabled

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
                                    .map((batch) => (
                                      <li
                                        key={batch.batchNo}
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
                                        <small className="text-muted">Stock: {batch.stock}</small>
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
                              value={entry.dom}
                              onChange={(e) => handleIndentEntryChange(index, "dom", e.target.value)}
                              disabled

                            />
                          </td>

                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              style={{ width: "100px", padding: "0" }}     
                              value={entry.doe}
                              onChange={(e) => handleIndentEntryChange(index, "doe", e.target.value)}
                              disabled

                            />
                          </td>

                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={entry.qtyDemanded}
                              onChange={(e) => handleIndentEntryChange(index, "qtyDemanded", e.target.value)}
                              placeholder="0"
                              disabled

                              min="0"
                            />
                          </td>

                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              disabled

                              value={entry.approvedQty}
                              onChange={(e) => handleIndentEntryChange(index, "approvedQty", e.target.value)}
                              placeholder="0"
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
                            />
                          </td>

                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={entry.balanceAfterIssue}

                              placeholder="0"
                              style={{ backgroundColor: "#f8f9fa" }}
                            />
                          </td>

                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={entry.batchStock}
                              
                              placeholder="0"
                              disabled
                            />
                          </td>

                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={entry.availableStock}

                              placeholder="0"
                              disabled
                            />
                          </td>

                          <td>
                            <button
                              type="button"
                              className="btn btn-info btn-sm"
                              onClick={() => handleViewPreviousIssues(entry)}
                              
                            >
                              <i class="bi bi-info-circle"></i>

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
                    onClick={() => setIssueType("partially")}
                    disabled={processing}
                  >
                    Partially Issue
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setIssueType("fully")}
                    disabled={processing}
                  >
                    Fully Issue
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleBackToList}
                  >
                    Back
                  </button>
                </div>

                {issueType && (
                  <div className="d-flex justify-content-end mt-3">
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={handleSubmit}
                      disabled={processing}
                      style={{ minWidth: "120px" }}
                    >
                      {processing ? "Processing..." : "Submit"}
                    </button>
                  </div>
                )}
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
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 10001,
            backgroundColor: popupMessage.type === "error" ? "#dc3545" : "#28a745",
            color: "white",
            padding: "15px 20px",
            borderRadius: "5px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            whiteSpace: "pre-line",
          }}
        >
          {popupMessage.message}
          <button
            onClick={popupMessage.onClose}
            style={{
              marginLeft: "15px",
              background: "transparent",
              border: "none",
              color: "white",
              fontSize: "18px",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
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
                          No records found.
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((item) => (
                        <tr key={item.indentId} onClick={(e) => handleEditClick(item, e)} style={{ cursor: "pointer" }}>
                          <td>{item.department}</td>
                          <td>{item.indentNo}</td>
                          <td>{formatDate(item.indentDate)}</td>
                          <td>{formatDateTime(item.submissionDateTime)}</td>
                          <td>{formatDateTime(item.approvalDateTime)}</td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                backgroundColor:
                                  item.status === "Pending for issue"
                                    ? "#ffc107"
                                    : item.status === "Partially Issue"
                                      ? "#17a2b8"
                                      : "#28a745",
                                color: item.status === "Pending for issue" ? "#000" : "#fff",
                              }}
                            >
                              {item.status}
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