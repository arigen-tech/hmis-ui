import { useState } from "react"

const PhysicalStockAdjustmentApproval = () => {
  const [currentView, setCurrentView] = useState("list") // "list" or "detail"
  const [selectedRecord, setSelectedRecord] = useState(null)

  // List view data
  const [approvalData, setApprovalData] = useState([
    {
      id: 1,
      stockTakingNo: "001-2025",
      stockTakingDate: "17/07/2025",
      department: "DISPENSARY",
      status: "Pending for Approval",
      submittedBy: "Korba_Nodal Officer",
    },
    {
      id: 2,
      stockTakingNo: "002-2025",
      stockTakingDate: "16/07/2025",
      department: "ICU",
      status: "Pending for Approval",
      submittedBy: "Admin_User",
    },
  ])

  const [fromDate, setFromDate] = useState("2025-07-17")
  const [toDate, setToDate] = useState("2025-07-17")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")

  // Detail form state
  const getDetailEntriesForRecord = (record) => {
    if (record?.status === "Pending for Approval") {
      return [
        {
          id: 1,
          sNo: 1,
          drugCode: "D382",
          drugName: "OMEPRAZOLE CAPSULE 20 MG[148]",
          batchNo: "SP2436",
          doe: "31/12/2025",
          computedStock: "151",
          physicalStock: "145",
          surplus: "",
          deficient: "6",
          remarks: "Stock discrepancy found during monthly verification",
        },
      ]
    }
    return [
      {
        id: 1,
        sNo: 1,
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
    ]
  }

  const [detailEntries, setDetailEntries] = useState([])
  const [selectedAction, setSelectedAction] = useState("")
  const [remark, setRemark] = useState("")

  const itemsPerPage = 10
  const totalPages = Math.ceil(approvalData.length / itemsPerPage)
  const currentItems = approvalData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleEdit = (item) => {
    setSelectedRecord(item)
    setDetailEntries(getDetailEntriesForRecord(item))
    setCurrentView("detail")
  }

  const handleBackToList = () => {
    setCurrentView("list")
    setSelectedRecord(null)
    setSelectedAction("")
    setRemark("")
  }

  const handleSearch = () => {
    console.log("Searching from", fromDate, "to", toDate)
  }

  const handleShowAll = () => {
    setFromDate("")
    setToDate("")
  }

  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    } else {
      alert("Please enter a valid page number.")
    }
  }

  const handleSubmit = () => {
    if (!selectedAction) {
      alert("Please select an action")
      return
    }
    if (!remark.trim()) {
      alert("Please enter a remark")
      return
    }
    console.log("Submitting approval:", { action: selectedAction, remark, entries: detailEntries })
    alert(`Stock adjustment ${selectedAction.toLowerCase()}d successfully!`)
    handleBackToList()
  }

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

  if (currentView === "detail") {
    return (
      <div className="content-wrapper">
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              {/* Header Section */}
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">Physical Stock Adjustment Approval Details</h4>
                <button type="button" className="btn btn-secondary" onClick={handleBackToList}>
                  Back to List
                </button>
              </div>
              <div className="card-body">
                {/* Entry Details Header */}
                <div className="row mb-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Stock Taking Date</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.stockTakingDate || ""}
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
                      value={selectedRecord?.submittedBy || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Department</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.department || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                </div>

                {/* Detail Table */}
                <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "auto" }}>
                  <table className="table table-bordered align-middle">
                    <thead >
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
                        <th style={{ width: "200px", minWidth: "200px" }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailEntries.map((entry, index) => (
                        <tr key={entry.id}>
                          <td className="text-center">
                            <input
                              type="text"
                              className="form-control text-center"
                              value={entry.sNo}
                              style={{ width: "50px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.drugCode}
                              style={{ width: "110px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.drugName}
                              style={{ width: "280px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.batchNo}
                              style={{ width: "110px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.doe}
                              style={{ width: "110px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.computedStock}
                              style={{ width: "110px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.physicalStock}
                              style={{ width: "110px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.surplus}
                              style={{ width: "90px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.deficient}
                              style={{ width: "90px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.remarks}
                              style={{ width: "180px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Approval Section */}
                <div className="row mb-3 mt-3">
                  <div className="col-md-4">
                    <label className="form-label fw-bold mb-1">Action</label>
                    <select
                      className="form-select"
                      value={selectedAction}
                      onChange={(e) => setSelectedAction(e.target.value)}
                    >
                      <option value="">Select Action</option>
                      <option value="Approve">Approve</option>
                      <option value="Reject">Reject</option>
                      <option value="Review">Review</option>
                    </select>
                  </div>
                  <div className="col-md-8">
                    <label className="form-label fw-bold mb-1">Remark</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={remark}
                      placeholder="Enter your remark here"
                      onChange={(e) => setRemark(e.target.value)}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-flex justify-content-end mt-4">
                  <button
                    type="button"
                    className="btn me-2"
                    style={{ backgroundColor: "#e67e22", color: "white" }}
                    onClick={handleSubmit}
                  >
                    Submit
                  </button>
                  <button type="button" className="btn btn-danger" onClick={handleBackToList}>
                    Cancel
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
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            {/* Header Section */}
            <div className="card-header" >
              <h4 className="card-title p-2 mb-0">Physical Stock Taking/Stock Adjustment Approval</h4>
            </div>
            <div className="card-body">
              {/* Date Filter Section */}
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

             

              {/* Table Section */}
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
                    {currentItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.stockTakingNo}</td>
                        <td>{item.stockTakingDate}</td>
                        <td>{item.department}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: item.status === "Pending for Approval" ? "#ffc107" : "#28a745",
                              color: item.status === "Pending for Approval" ? "#000" : "#fff",
                            }}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td>{item.submittedBy}</td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-success me-2"
                            onClick={() => handleEdit(item)}
                            disabled={item.status !== "Pending for Approval"}
                          >
                            <i className="fa fa-eye"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <nav className="d-flex justify-content-between align-items-center mt-2">
                <div>
                  <span>
                    Page {currentPage} of {totalPages} | Total Records: {approvalData.length}
                  </span>
                </div>
                <ul className="pagination mb-0">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      &laquo; Previous
                    </button>
                  </li>
                  {renderPagination()}
                  <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next &raquo;
                    </button>
                  </li>
                </ul>
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

export default PhysicalStockAdjustmentApproval
