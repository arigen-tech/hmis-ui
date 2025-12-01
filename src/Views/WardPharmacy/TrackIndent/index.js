import { useState } from "react"

const TrackIndent = () => {
  const [currentView, setCurrentView] = useState("list")
  const [selectedIndent, setSelectedIndent] = useState(null)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const [indentData, setIndentData] = useState([])
  const [filteredIndentData, setFilteredIndentData] = useState([])
  const [showReceivedQtyPopup, setShowReceivedQtyPopup] = useState(false)
  const [selectedItemForPopup, setSelectedItemForPopup] = useState(null)

  // Mock data based on images
  const mockIndentData = [
    {
      indentId: 1,
      indentDate: "2025-11-18",
      indentNo: "00207762025",
      createdBy: "Rahul Dev",
      requestedDepartment: "Pharmacy Department",
      status: "Received",
      items: [
        {
          id: 1,
          drugCode: "D55",
          drugName: "Calcium Salts Tab 500mg[D55]",
          apu: "No",
          qtyRequested: 2000,
          approvedQty: 2000,
          receivedQty: 2000,
          reasonForIndent: "New stok",
          batchDetails: [
            {
              batchNo: "BATCH001",
              expiryDate: "2026-12-31",
              qty: 1000,
            },
            {
              batchNo: "BATCH002",
              expiryDate: "2027-06-30",
              qty: 1000,
            },
          ],
        },
        {
          id: 2,
          drugCode: "D396",
          drugName: "Paracetamol Syrup IP 125 mg / 5 ml[D396]",
          apu: "ML",
          qtyRequested: 200,
          approvedQty: 200,
          receivedQty: 200,
          reasonForIndent: "New stok",
          batchDetails: [
            {
              batchNo: "BATCH003",
              expiryDate: "2026-08-15",
              qty: 200,
            },
          ],
        },
      ],
    },
    {
      indentId: 2,
      indentDate: "2025-11-18",
      indentNo: "00207652025",
      createdBy: "Rahul Dev",
      requestedDepartment: "Pharmacy Department",
      status: "Received",
      items: [],
    },
    {
      indentId: 3,
      indentDate: "2025-11-17",
      indentNo: "00207432025",
      createdBy: "Rahul Dev",
      requestedDepartment: "Pharmacy Department",
      status: "Received",
      items: [],
    },
    {
      indentId: 4,
      indentDate: "2025-11-15",
      indentNo: "00207002025",
      createdBy: "Rahul Dev",
      requestedDepartment: "Pharmacy Department",
      status: "Received",
      items: [],
    },
    {
      indentId: 5,
      indentDate: "2025-11-14",
      indentNo: "00206832025",
      createdBy: "Rahul Dev",
      requestedDepartment: "Pharmacy Department",
      status: "Received",
      items: [],
    },
  ]

  useState(() => {
    setIndentData(mockIndentData)
    setFilteredIndentData(mockIndentData)
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

  const handleShowAll = () => {
    setFromDate("")
    setToDate("")
    setFilteredIndentData(indentData)
  }

  const handleRowClick = (record, e) => {
    e.stopPropagation()
    setSelectedIndent(record)
    setCurrentView("detail")
  }

  const handleBackToList = () => {
    setCurrentView("list")
    setSelectedIndent(null)
  }

  const handleReceivedQtyClick = (item) => {
    setSelectedItemForPopup(item)
    setShowReceivedQtyPopup(true)
  }

  const handleClosePopup = () => {
    setShowReceivedQtyPopup(false)
    setSelectedItemForPopup(null)
  }

  const handleIndentReport = () => {
    console.log("Generating Indent Report for:", selectedIndent)
    alert("Indent Report generated successfully!")
  }

  const handleIssueReport = () => {
    console.log("Generating Issue Report for:", selectedIndent)
    alert("Issue Report generated successfully!")
  }

  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    } else {
      alert("Please enter a valid page number.")
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

  const formatDate = (dateStr) => {
    if (!dateStr) return ""
    return dateStr.split("T")[0]
  }

  if (currentView === "detail") {
    return (
      <div className="content-wrapper">
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">INDENT DETAILS</h4>
                <button type="button" className="btn btn-secondary" onClick={handleBackToList}>
                  Back to List
                </button>
              </div>
              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Indent No</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedIndent?.indentNo || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Indent Date</label>
                    <input
                      type="text"
                      className="form-control"
                      value={
                        selectedIndent?.indentDate
                          ? new Date(selectedIndent.indentDate).toLocaleDateString("en-GB")
                          : ""
                      }
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Prepared By</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedIndent?.createdBy || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Requested Department</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedIndent?.requestedDepartment || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                </div>

                <div className="row mb-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Approved By</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedIndent?.approvedBy || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                </div>


                <div className="table-responsive" style={{ overflowX: "auto", maxWidth: "100%", overflowY: "visible" }}>
                  <table className="table table-bordered table-hover align-middle" >
                    <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                    <tr>
  {/* BIG column */}
  <th style={{ width: "400px", minWidth: "350px" }}>
    Drug Name / Drug Code
  </th>

  {/* VERY SMALL column */}
  <th style={{ width: "60px", minWidth: "50px", textAlign: "center" }}>
    A/U
  </th>

  {/* SMALL column */}
  <th style={{ width: "80px", minWidth: "70px", textAlign: "center" }}>
    Qty Requested
  </th>

  {/* SMALL column */}
  <th style={{ width: "80px", minWidth: "70px", textAlign: "center" }}>
    Approved Qty
  </th>

  {/* SMALL column */}
  <th style={{ width: "80px", minWidth: "70px", textAlign: "center" }}>
    Received Qty
  </th>

  {/* LARGE column (unchanged) */}
  <th style={{ width: "250px", minWidth: "250px" }}>
    Reason for Indent
  </th>
</tr>

                    </thead>
                    <tbody>
                      {selectedIndent?.items && selectedIndent.items.length > 0 ? (
                        selectedIndent.items.map((item, index) => (
                          <tr key={item.id || index}>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={item.drugName}
                                style={{  backgroundColor: "#e9ecef" }}
                                readOnly
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={item.apu}
                                style={{ backgroundColor: "#e9ecef" }}
                                readOnly
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={item.qtyRequested}
                                style={{ backgroundColor: "#e9ecef" }}
                                readOnly
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={item.approvedQty}
                                style={{  backgroundColor: "#e9ecef" }}
                                readOnly
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={item.receivedQty}
                                onClick={() => handleReceivedQtyClick(item)}
                                style={{
                                  color: "#0066cc",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                  backgroundColor: "#fff",
                                }}
                                readOnly
                              />
                            </td>
                            <td>
                              <textarea
                                className="form-control form-control-sm"
                                value={item.reasonForIndent}
                                style={{  minHeight: "40px", backgroundColor: "#e9ecef" }}
                                readOnly
                              />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center">
                            No records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button type="button" className="btn btn-primary" onClick={handleIndentReport}>
                    Indent Report
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleIssueReport}>
                    Issue Report
                  </button>
                  <button type="button" className="btn btn-danger" onClick={handleBackToList}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Received Qty Popup Modal */}
        {showReceivedQtyPopup && selectedItemForPopup && (
          <div
            className="modal show d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={handleClosePopup}
          >
            <div
              className="modal-dialog modal-lg modal-dialog-centered"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header" >
                  <h5 className="modal-title fw-bold">Received Quantity Details</h5>
                  <button type="button" className="btn-close" onClick={handleClosePopup}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Drug Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedItemForPopup.drugName}
                      readOnly
                      style={{ backgroundColor: "#e9ecef" }}
                    />
                  </div>

                  <div className="table-responsive">
                    <table className="table table-bordered align-middle">
                      <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                        <tr>
                          <th>Batch No</th>
                          <th>Expiry Date</th>
                          <th>Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedItemForPopup.batchDetails && selectedItemForPopup.batchDetails.length > 0 ? (
                          selectedItemForPopup.batchDetails.map((batch, index) => (
                            <tr key={index}>
                              <td>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={batch.batchNo}
                                  readOnly
                                  style={{ backgroundColor: "#e9ecef" }}
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={batch.expiryDate}
                                  readOnly
                                  style={{ backgroundColor: "#e9ecef" }}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={batch.qty}
                                  readOnly
                                  style={{ backgroundColor: "#e9ecef" }}
                                />
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="text-center">
                              No batch details available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3">
                    <label className="form-label fw-bold">Total Received Quantity</label>
                    <input
                      type="number"
                      className="form-control"
                      value={selectedItemForPopup.receivedQty}
                      readOnly
                      style={{ backgroundColor: "#e9ecef", fontWeight: "600", color: "#0066cc" }}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleClosePopup}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
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
              <h4 className="card-title p-2 mb-0">INDENT TRACKING LIST</h4>
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
                    placeholder="DD/MM/YYYY"
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-bold">To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
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

              <div className="mb-3">
                <span className="fw-bold">{filteredIndentData.length} matches</span>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                    <tr>
                      <th>Indent Date</th>
                      <th>Indent No</th>
                      <th>Created By</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center">
                          No records found.
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((item) => (
                        <tr key={item.indentId} onClick={(e) => handleRowClick(item, e)} style={{ cursor: "pointer" }}>
                          <td>{formatDate(item.indentDate)}</td>
                          <td>{item.indentNo}</td>
                          <td>{item.createdBy}</td>
                          <td>{item.status}</td>
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

export default TrackIndent