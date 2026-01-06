import { useState, useEffect } from "react"
import LoadingScreen from "../../../Components/Loading"

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
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState([])
  const [selectedDepartment, setSelectedDepartment] = useState("")
  const [userRole, setUserRole] = useState("") // "admin" or "department_user"
  const [userDepartment, setUserDepartment] = useState("") // For department users

  // Mock data based on images - updated with more fields
  const mockIndentData = [
    {
      indentId: 1,
      indentDate: "2025-11-18",
      indentNo: "00207762025",
      createdBy: "Rahul Dev",
      requestedDepartment: "Pharmacy Department",
      department: "Pharmacy Department",
      approvedDate: "2025-11-19",
      issuedDate: "2025-11-20",
      receivedDate: "2025-11-21",
      returnDate: null,
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
      department: "Pharmacy Department",
      approvedDate: "2025-11-19",
      issuedDate: "2025-11-20",
      receivedDate: null,
      returnDate: null,
      status: "Issued",
      items: [],
    },
    {
      indentId: 3,
      indentDate: "2025-11-17",
      indentNo: "00207432025",
      createdBy: "Rahul Dev",
      requestedDepartment: "Dispensary",
      department: "Dispensary",
      approvedDate: "2025-11-18",
      issuedDate: null,
      receivedDate: null,
      returnDate: "2025-11-19",
      status: "Returned",
      items: [],
    },
    {
      indentId: 4,
      indentDate: "2025-11-15",
      indentNo: "00207002025",
      createdBy: "Rahul Dev",
      requestedDepartment: "Laboratory",
      department: "Laboratory",
      approvedDate: "2025-11-16",
      issuedDate: null,
      receivedDate: null,
      returnDate: null,
      status: "Approved",
      items: [],
    },
    {
      indentId: 5,
      indentDate: "2025-11-14",
      indentNo: "00206832025",
      createdBy: "Rahul Dev",
      requestedDepartment: "Radiology",
      department: "Radiology",
      approvedDate: null,
      issuedDate: null,
      receivedDate: null,
      returnDate: null,
      status: "Pending",
      items: [],
    },
  ]

  // Mock departments data
  const mockDepartments = [
    "Pharmacy Department",
    "Dispensary",
    "Laboratory",
    "Radiology",
    "ICU",
    "OPD",
    "Emergency"
  ]

  // Initialize component - simulate user login
  useEffect(() => {
    // In real app, this would come from authentication/context
    // For demo, we'll simulate both scenarios
    const simulatedUserRole = "admin" // Change to "department_user" for department view
    const simulatedUserDepartment = "Dispensary"
    
    setUserRole(simulatedUserRole)
    setUserDepartment(simulatedUserDepartment)
    
    if (simulatedUserRole === "department_user") {
      setSelectedDepartment(simulatedUserDepartment)
    }
    
    setDepartments(mockDepartments)
    setIndentData(mockIndentData)
    
    // Filter data based on user role
    if (simulatedUserRole === "department_user") {
      const filtered = mockIndentData.filter(item => 
        item.department === simulatedUserDepartment
      )
      setFilteredIndentData(filtered)
    } else {
      setFilteredIndentData(mockIndentData)
    }
  }, [])

  const handleSearch = () => {
    if (!fromDate || !toDate) {
      // Validate date range (not more than 1 year)
      alert("Please select both From Date and To Date")
      return
    }
    
    const from = new Date(fromDate)
    const to = new Date(toDate)
    
    // Validate date range not more than 1 year
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    
    if (from < oneYearAgo) {
      alert("Date range cannot be more than 1 year from current date")
      return
    }
    
    const diffTime = Math.abs(to - from)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays > 365) {
      alert("Date range cannot be more than 1 year")
      return
    }
    
    setLoading(true)
    
    let filtered = indentData
    
    // Filter by department if selected
    if (selectedDepartment) {
      filtered = filtered.filter(item => item.department === selectedDepartment)
    }
    
    // Filter by date range
    filtered = filtered.filter((item) => {
      const itemDate = new Date(item.indentDate)
      return itemDate >= from && itemDate <= to
    })
    
    setTimeout(() => {
      setFilteredIndentData(filtered)
      setCurrentPage(1)
      setLoading(false)
    }, 300)
  }

  const handleShowAll = () => {
    setFromDate("")
    setToDate("")
    
    let filtered = indentData
    if (userRole === "department_user") {
      filtered = filtered.filter(item => item.department === userDepartment)
    } else if (selectedDepartment) {
      filtered = filtered.filter(item => item.department === selectedDepartment)
    }
    
    setFilteredIndentData(filtered)
  }

  const handleRowClick = (record, e) => {
    e.stopPropagation()
    setSelectedIndent(record)
    setLoading(true)
    setCurrentView("detail")
    setTimeout(() => setLoading(false), 300)
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

  const handleIndentReport = (indentNo) => {
    console.log("Generating Indent Report for:", indentNo)
    alert(`Indent Report generated successfully for ${indentNo}!`)
  }

  const handleIssueReport = (indentNo) => {
    console.log("Generating Issue Report for:", indentNo)
    alert(`Issue Report generated successfully for ${indentNo}!`)
  }

  const handleReceivingReport = (indentNo) => {
    console.log("Generating Receiving Report for:", indentNo)
    alert(`Receiving Report generated successfully for ${indentNo}!`)
  }

  const handleReturnReport = (indentNo) => {
    console.log("Generating Return Report for:", indentNo)
    alert(`Return Report generated successfully for ${indentNo}!`)
  }

  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    } else {
      alert("Please enter a valid page number.")
    }
  }

  const handleDepartmentChange = (dept) => {
    setSelectedDepartment(dept)
    setCurrentPage(1)
    
    let filtered = indentData
    if (dept) {
      filtered = filtered.filter(item => item.department === dept)
    }
    setFilteredIndentData(filtered)
  }

  const itemsPerPage = 5
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
    if (!dateStr) return "-"
    return dateStr.split("T")[0]
  }

  // Check if report buttons should be enabled for a given indent
  const canShowIssueReport = (indent) => indent.issuedDate !== null
  const canShowReceivingReport = (indent) => indent.receivedDate !== null
  const canShowReturnReport = (indent) => indent.returnDate !== null

  if (currentView === "detail") {
    return (
      <div className="content-wrapper">
        {loading && <LoadingScreen/>}
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
                        <th style={{ width: "400px", minWidth: "350px" }}>
                          Drug Name / Drug Code
                        </th>
                        <th style={{ width: "60px", minWidth: "50px", textAlign: "center" }}>
                          A/U
                        </th>
                        <th style={{ width: "80px", minWidth: "70px", textAlign: "center" }}>
                          Qty Requested
                        </th>
                        <th style={{ width: "80px", minWidth: "70px", textAlign: "center" }}>
                          Approved Qty
                        </th>
                        <th style={{ width: "80px", minWidth: "70px", textAlign: "center" }}>
                          Received Qty
                        </th>
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
                                style={{ backgroundColor: "#e9ecef" }}
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
                                style={{ backgroundColor: "#e9ecef" }}
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
                                style={{ minHeight: "40px", backgroundColor: "#e9ecef" }}
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
                  <button type="button" className="btn btn-primary" onClick={() => handleIndentReport(selectedIndent?.indentNo)}>
                    Indent Report
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => handleIssueReport(selectedIndent?.indentNo)}>
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
                <div className="modal-header">
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
      {loading && <LoadingScreen/>}
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">INDENT TRACKING LIST</h4>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                {/* Department Dropdown - Show for admin, auto-selected for department user */}
                <div className="col-md-3">
                  <label className="form-label fw-bold">Department</label>
                  {userRole === "admin" ? (
                    <select
                      className="form-select"
                      value={selectedDepartment}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                    >
                      <option value="">All Departments</option>
                      {departments.map((dept, index) => (
                        <option key={index} value={dept}>{dept}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="form-control"
                      value={userDepartment}
                      readOnly
                      style={{ backgroundColor: "#e9ecef" }}
                    />
                  )}
                </div>
                
                <div className="col-md-2">
                  <label className="form-label fw-bold">From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    max={new Date().toISOString().split('T')[0]}
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
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="col-md-2 d-flex align-items-end">
                  <button type="button" className="btn btn-primary me-2" onClick={handleSearch}>
                    Search
                  </button>
                  
                </div>
                
                <div className="col-md-3 d-flex justify-content-end align-items-end">
                  <button type="button" className="btn btn-secondary" onClick={handleShowAll}>
                    Show All
                  </button>
                  {/* Global report buttons removed as per requirement - now each row has its own report buttons */}
                </div>
              </div>


              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                    <tr>
                      <th>Indent Date</th>
                      <th>Indent No</th>
                      <th>Department</th>
                      <th>Approved Date</th>
                      <th>Issued Date</th>
                      <th>Status</th>
                      <th>Indent Report</th>
                      <th>Issue Report</th>
                      <th>Receiving Report</th>
                      <th>Return Report</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center">
                          No records found.
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((item) => (
                        <tr key={item.indentId}>
                          <td onClick={(e) => handleRowClick(item, e)} style={{ cursor: "pointer" }}>
                            {formatDate(item.indentDate)}
                          </td>
                          <td onClick={(e) => handleRowClick(item, e)} style={{ cursor: "pointer" }}>
                            {item.indentNo}
                          </td>
                          <td onClick={(e) => handleRowClick(item, e)} style={{ cursor: "pointer" }}>
                            {item.department}
                          </td>
                          <td onClick={(e) => handleRowClick(item, e)} style={{ cursor: "pointer" }}>
                            {formatDate(item.approvedDate)}
                          </td>
                          <td onClick={(e) => handleRowClick(item, e)} style={{ cursor: "pointer" }}>
                            {formatDate(item.issuedDate)}
                          </td>
                          <td onClick={(e) => handleRowClick(item, e)} style={{ cursor: "pointer" }}>
                            {item.status}
                          </td>
                          <td style={{ textAlign: "center", width: "120px" }}>
                            <button 
                              type="button" 
                              className="btn btn-success btn-sm"
                              onClick={() => handleIndentReport(item.indentNo)}
                            >
                              Indent Report
                            </button>
                          </td>
                          <td style={{ textAlign: "center", width: "120px" }}>
                            {canShowIssueReport(item) ? (
                              <button 
                                type="button" 
                                className="btn btn-success btn-sm"
                                onClick={() => handleIssueReport(item.indentNo)}
                              >
                                Issue Report
                              </button>
                            ) : (
                              <span className="text-muted">N/A</span>
                            )}
                          </td>
                          <td style={{ textAlign: "center", width: "130px" }}>
                            {canShowReceivingReport(item) ? (
                              <button 
                                type="button" 
                                className="btn btn-success btn-sm flex-shrink-0 text-nowrap"
                                onClick={() => handleReceivingReport(item.indentNo)}
                              >
                                Receiving Report
                              </button>
                            ) : (
                              <span className="text-muted">N/A</span>
                            )}
                          </td>
                          <td style={{ textAlign: "center", width: "120px" }}>
                            {canShowReturnReport(item) ? (
                              <button 
                                type="button" 
                                className="btn btn-success btn-sm  text-nowrap"
                                onClick={() => handleReturnReport(item.indentNo)}
                              >
                                Return Report
                              </button>
                            ) : (
                              <span className="text-muted">N/A</span>
                            )}
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

export default TrackIndent