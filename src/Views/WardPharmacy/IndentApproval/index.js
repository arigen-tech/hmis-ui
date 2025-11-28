import { useState, useRef, useEffect } from "react"
import ReactDOM from "react-dom"

const IndentApproval = () => {
  const [currentView, setCurrentView] = useState("list")
  const [processing, setProcessing] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [itemOptions, setItemOptions] = useState([])
  const [indentEntries, setIndentEntries] = useState([])
  const [popupMessage, setPopupMessage] = useState(null)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const [indentData, setIndentData] = useState([])
  const [filteredIndentData, setFilteredIndentData] = useState([])
  const [remarks, setRemarks] = useState("")
  const [action, setAction] = useState("")

  // Mock data for Issue Department approval
  const mockIndentData = [
    {
      indentId: 1,
      indentNo: "00195702025",
      indentDate: "2025-09-22",
      createdBy: "Rahul Dev",
      departmentName: "Cardiology Department",
      approvedDate: "",
      submissionDateTime: "2025-09-22 14:30:00",
      status: "p",
      items: [
        {
          id: 1,
          itemCode: "AMLO005",
          itemName: "Amlodipine 5mg Tablet",
          apu: "Unit",
          requestedQty: 15000,
          availableStock: 25000,
          reasonForIndent: "Limited quantity",
        },
        {
          id: 2,
          itemCode: "AMOX030",
          itemName: "Amoxycillin Powder for Oral Suspension IP 125 mg/5 ml",
          apu: "BOTTLE",
          requestedQty: 200,
          availableStock: 500,
          reasonForIndent: "Insufficient stock",
        },
      ],
    },
    {
      indentId: 2,
      indentNo: "00031782023",
      indentDate: "2025-01-05",
      createdBy: "Priya Sharma",
      departmentName: "Pediatrics Department",
      approvedDate: "",
      submissionDateTime: "2025-01-05 10:15:00",
      status: "p",
      items: [
        {
          id: 1,
          itemCode: "AMOX030",
          itemName: "Amoxycillin Powder for Oral Suspension IP 125 mg/5 ml",
          apu: "BOTTLE",
          requestedQty: 200,
          availableStock: 0,
          reasonForIndent: "Out of stock",
        },
      ],
    },
  ]

  const mockItemOptions = [
    { id: 1, code: "AMLO005", name: "Amlodipine 5mg Tablet" },
    { id: 2, code: "AMOX030", name: "Amoxycillin Powder for Oral Suspension IP 125 mg/5 ml" },
    { id: 3, code: "AMOXCAP", name: "Amoxycillin Cap IP 500 mg" },
    { id: 4, code: "AZIT250", name: "Azithromycin 250 Tablet" },
  ]

  useEffect(() => {
    setIndentData(mockIndentData)
    setFilteredIndentData(mockIndentData)
    setItemOptions(mockItemOptions)
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

  const handleEditClick = (record, e) => {
    e.stopPropagation()
    setSelectedRecord(record)
    if (!record || !Array.isArray(record.items)) return

    const entries = record.items.map((entry) => ({
      id: entry.id,
      itemCode: entry.itemCode,
      itemName: entry.itemName,
      apu: entry.apu,
      requestedQty: entry.requestedQty,
      approveQty: entry.requestedQty, // Default to requested quantity
      availableStock: entry.availableStock,
      reasonForIndent: entry.reasonForIndent,
    }))

    setIndentEntries(entries)
    setCurrentView("detail")
    setRemarks("")
    setAction("")
  }

  const handleBackToList = () => {
    setCurrentView("list")
    setSelectedRecord(null)
    setRemarks("")
    setAction("")
  }

  const handleShowAll = () => {
    setFromDate("")
    setToDate("")
    setFilteredIndentData(indentData)
    setCurrentPage(1)
  }

  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    } else {
      alert("Please enter a valid page number.")
    }
  }

  const handleIndentEntryChange = (index, field, value) => {
    const updatedEntries = [...indentEntries]
    
    if (field === "approveQty") {
      // Validate that approve quantity doesn't exceed available stock
      const availableStock = Number(updatedEntries[index].availableStock)
      const approveQty = Number(value)
      const requestedQty = Number(updatedEntries[index].requestedQty)
      
      if (approveQty > availableStock) {
        showPopup(`Approve quantity cannot exceed available stock (${availableStock})`, "error")
        return
      }
      
      if (approveQty > requestedQty) {
        showPopup(`Approve quantity cannot exceed requested quantity (${requestedQty})`, "error")
        return
      }
    }

    updatedEntries[index] = {
      ...updatedEntries[index],
      [field]: value,
    }

    setIndentEntries(updatedEntries)
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

  const handleSubmit = async () => {
    if (!action) {
      showPopup("Please select an action", "error")
      return
    }

    if (!remarks.trim()) {
      showPopup("Please enter remarks", "error")
      return
    }

    // Validate approve quantities
    const invalidEntries = indentEntries.filter(entry => {
      const approveQty = Number(entry.approveQty || 0)
      const availableStock = Number(entry.availableStock)
      const requestedQty = Number(entry.requestedQty)
      
      return approveQty > availableStock || approveQty > requestedQty || approveQty < 0
    })

    if (invalidEntries.length > 0) {
      showPopup("Please ensure all approve quantities are valid and do not exceed available stock or requested quantity", "error")
      return
    }

    const payload = {
      id: selectedRecord.indentId,
      status: action === "approved" ? "a" : "r",
      remarks: remarks,
      approvedDate: action === "approved" ? new Date().toISOString().split('T')[0] : "",
      rejectedDate: action === "rejected" ? new Date().toISOString().split('T')[0] : "",
      indentEntries: indentEntries.map((entry) => ({
        id: entry.id,
        itemCode: entry.itemCode,
        itemName: entry.itemName,
        apu: entry.apu,
        requestedQty: entry.requestedQty ? Number(entry.requestedQty) : null,
        approveQty: entry.approveQty ? Number(entry.approveQty) : null,
        availableStock: entry.availableStock ? Number(entry.availableStock) : null,
        reasonForIndent: entry.reasonForIndent,
      })),
    }

    try {
      setProcessing(true)
      console.log("Submission Payload:", payload)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      showPopup(`Indent ${action} successfully!`, "success")
      setTimeout(() => {
        handleBackToList()
        // Update the mock data to reflect the change
        const updatedData = indentData.map(item => 
          item.indentId === selectedRecord.indentId 
            ? { 
                ...item, 
                status: action === "approved" ? "a" : "r",
                approvedDate: action === "approved" ? new Date().toISOString().split('T')[0] : ""
              } 
            : item
        )
        setIndentData(updatedData)
        setFilteredIndentData(updatedData)
      }, 1500)
    } catch (error) {
      console.error("Error submitting indent:", error)
      showPopup("Error submitting indent. Please try again.", "error")
    } finally {
      setProcessing(false)
    }
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

  const statusMap = {
    s: { label: "Draft", badge: "bg-secondary", textColor: "text-white" },
    p: { label: "Pending for Approval", badge: "bg-warning", textColor: "text-dark" },
    r: { label: "Rejected", badge: "bg-danger", textColor: "text-white" },
    a: { label: "Approved", badge: "bg-success", textColor: "text-white" },
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString("en-GB")
  }

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return ""
    return new Date(dateTimeStr).toLocaleString("en-GB")
  }

  // Popup Component
  const Popup = ({ message, type, onClose }) => {
    useEffect(() => {
      const timer = setTimeout(() => {
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }, [onClose])

    const bgColor = type === "success" ? "bg-success" : type === "error" ? "bg-danger" : "bg-info"

    return ReactDOM.createPortal(
      <div className="position-fixed top-0 start-50 translate-middle-x mt-3" style={{ zIndex: 9999 }}>
        <div className={`toast show ${bgColor} text-white`}>
          <div className="toast-body d-flex justify-content-between align-items-center">
            <span>{message}</span>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  if (currentView === "detail") {
    const statusInfo = statusMap[selectedRecord?.status] || { label: "Unknown", badge: "bg-secondary", textColor: "text-white" }

    return (
      <div className="content-wrapper">
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">Pending for Indent Approval - Issue Department</h4>
                <button type="button" className="btn btn-secondary" onClick={handleBackToList}>
                  Back to List
                </button>
              </div>
              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Indent Date</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.indentDate ? formatDate(selectedRecord.indentDate) : ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Indent Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.indentNo || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Department Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.departmentName || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Submitted By</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.createdBy || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                </div>

                <div className="row mb-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Approved Date</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.approvedDate ? formatDate(selectedRecord.approvedDate) : "Pending"}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Submission Date/Time</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formatDateTime(selectedRecord?.submissionDateTime || selectedRecord?.createdDate)}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                 
                </div>

                <div className="table-responsive" style={{ overflowX: "auto", maxWidth: "100%", overflowY: "visible" }}>
                  <table className="table table-bordered table-hover align-middle" style={{ minWidth: "1400px" }}>
                    <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                      <tr>
                        <th className="text-center" style={{ width: "60px", minWidth: "60px" }}>
                          S.No.
                        </th>
                        <th style={{ width: "300px", minWidth: "300px" }}>Item Name/Code</th>
                        <th style={{ width: "100px", minWidth: "100px" }}>A/U</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>Requested Quantity</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>Approve Quantity</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>Available Stock</th>
                        <th style={{ width: "200px", minWidth: "200px" }}>Reason for Indent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {indentEntries.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center text-muted">
                            No items found.
                          </td>
                        </tr>
                      ) : (
                        indentEntries.map((entry, index) => (
                          <tr key={entry.id || index}>
                            <td className="text-center fw-bold">{index + 1}</td>
                            <td>
                              <div className="d-flex flex-column">
                                <strong>{entry.itemName}</strong>
                                <small className="text-muted">{entry.itemCode}</small>
                              </div>
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={entry.apu}
                                style={{ minWidth: "90px", backgroundColor: "#f5f5f5" }}
                                readOnly
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={entry.requestedQty}
                                style={{ minWidth: "110px", backgroundColor: "#f5f5f5" }}
                                readOnly
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={entry.approveQty}
                                onChange={(e) => handleIndentEntryChange(index, "approveQty", e.target.value)}
                                placeholder="0"
                                min="0"
                                max={Math.min(entry.availableStock, entry.requestedQty)}
                                step="1"
                                style={{ minWidth: "110px" }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={entry.availableStock || 0}
                                style={{ 
                                  minWidth: "110px", 
                                  backgroundColor: entry.availableStock > 0 ? "#f5f5f5" : "#ffe6e6",
                                  color: entry.availableStock === 0 ? "#dc3545" : "inherit"
                                }}
                                readOnly
                              />
                              {entry.availableStock === 0 && (
                                <small className="text-danger">Out of stock</small>
                              )}
                            </td>
                            <td>
                              <textarea
                                className="form-control form-control-sm"
                                value={entry.reasonForIndent}
                                style={{ minWidth: "180px", minHeight: "40px", backgroundColor: "#f5f5f5" }}
                                readOnly
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="row mt-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">
                      Action<span className="text-danger">*</span>
                    </label>
                    <select 
                      className="form-select" 
                      value={action} 
                      onChange={(e) => setAction(e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="col-md-9">
                    <label className="form-label fw-bold">
                      Remarks<span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter remarks for approval or rejection"
                      rows="3"
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleSubmit} 
                    disabled={processing || !action || !remarks.trim()}
                  >
                    {processing ? "Processing..." : "Submit"}
                  </button>
                  <button type="button" className="btn btn-danger" onClick={handleBackToList}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {popupMessage && (
          <Popup
            message={popupMessage.message}
            type={popupMessage.type}
            onClose={popupMessage.onClose}
          />
        )}
      </div>
    )
  }

  // List View
  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Pending for Approval - Issue Department</h4>
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
                  <button type="button" className="btn btn-primary me-2" onClick={handleSearch}>
                    Search
                  </button>
                </div>
                <div className="col-md-6 d-flex justify-content-end align-items-end">
                  <button type="button" className="btn btn-primary" onClick={handleShowAll}>
                    Show All
                  </button>
                </div>
              </div>

              {/* List Table */}
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                    <tr>
                      <th>Indent Date</th>
                      <th>Indent No</th>
                      <th>Department Name</th>
                      <th>Submitted By</th>
                      <th>Approved Date</th>
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
                          <td>{formatDate(item.indentDate)}</td>
                          <td>{item.indentNo}</td>
                          <td>{item.departmentName}</td>
                          <td>{item.createdBy}</td>
                          <td>{item.approvedDate ? formatDate(item.approvedDate) : "Pending"}</td>
                          <td>
                            <span className={`badge ${statusMap[item.status]?.badge} ${statusMap[item.status]?.textColor}`}>
                              {statusMap[item.status]?.label}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
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

export default IndentApproval