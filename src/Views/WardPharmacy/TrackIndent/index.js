import { useState, useEffect } from "react"
import { getRequest } from "../../../service/apiService"
import LoadingScreen from "../../../Components/Loading"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination"

const TrackIndent = () => {
  const [currentView, setCurrentView] = useState("list")
  const [selectedIndent, setSelectedIndent] = useState(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [indentData, setIndentData] = useState([])
  const [showReceivedQtyPopup, setShowReceivedQtyPopup] = useState(false)
  const [selectedItemForPopup, setSelectedItemForPopup] = useState(null)
  const [loading, setLoading] = useState(false)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [departments, setDepartments] = useState([])
  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [userSessionData, setUserSessionData] = useState(null)
  const [statusMap,setStatusMap]=useState(null)

  // Fetch departments list and initial indent data
  useEffect(() => {
    fetchStatusMap()
    // Get user data from session storage
    const userData = getUserDataFromSession()
    setUserSessionData(userData)
    
    if (userData && userData.departmentId === 1) {
      // If departmentId is 1, fetch all departments for dropdown
      fetchDepartments()
    } else {
      // If departmentId is not 1, set user's department from session
      if (userData && userData.departmentName) {
        setSelectedDepartment({
          deptId: userData.departmentId,
          deptName: userData.departmentName
        })
      }
    }
    
    fetchIndentData(0) // Initial load with page 0
  }, [])

  // Get user data from session storage
  const getUserDataFromSession = () => {
    try {
      // Get departmentId and departmentName directly from sessionStorage
      const departmentId = sessionStorage.getItem('departmentId')
      const departmentName = sessionStorage.getItem('departmentName')
      
      if (departmentId && departmentName) {
        return {
          departmentId: parseInt(departmentId),
          departmentName: departmentName
        }
      }
      
      // Fallback: try to get from a user object if stored differently
      const userDataStr = sessionStorage.getItem('userData')
      if (userDataStr) {
        const userData = JSON.parse(userDataStr)
        return {
          departmentId: userData.departmentId || null,
          departmentName: userData.departmentName || ''
        }
      }
      
      return null
    } catch (error) {
      console.error("Error getting user data from session:", error)
      return null
    }
  }

  // Fetch indent data when page changes in non-search mode
  useEffect(() => {
    if (!isSearchMode) {
      fetchIndentData(currentPage)
    }
  }, [currentPage])

   const fetchStatusMap = async () => {
    try {
      // Call the new endpoint with status=y parameter
      const response = await getRequest("/indent/status-map")
      
      if (response && response.response && Array.isArray(response.response)) {
        // Map the response to extract department names and IDs
        const statusList = response.response.map(status => ({
          statusId: status.commonStatusId,
          statusCode: status.statusCode,
          statusName: status.statusName
        }))
        setStatusMap(statusList)
      } else {
        // Fallback to empty array if API fails
        console.error("Invalid status response:", response)
        setStatusMap([])
      }
    } catch (error) {
      console.error("Error fetching status:", error)
      setStatusMap([])
    }
  }

  // Fetch departments from API using the new endpoint
  const fetchDepartments = async () => {
    try {
      // Call the new endpoint with status=y parameter
      const response = await getRequest("/master/indent-department/getAll?status=y")
      
      if (response && response.response && Array.isArray(response.response)) {
        // Map the response to extract department names and IDs
        const departmentList = response.response.map(dept => ({
          deptId: dept.deptId,
          deptName: dept.deptName
        }))
        setDepartments(departmentList)
      } else {
        // Fallback to empty array if API fails
        console.error("Invalid department response:", response)
        setDepartments([])
      }
    } catch (error) {
      console.error("Error fetching departments:", error)
      setDepartments([])
    }
  }

  // Fetch initial indent data (without filters)
  const fetchIndentData = async (page = 0) => {
    try {
      setLoading(true)
      
      // If user has a specific department and it's not admin (departmentId !== 1),
      // filter by their department
      let url = `/indent/tracking?page=${page}&size=${DEFAULT_ITEMS_PER_PAGE}`
      
      if (userSessionData && userSessionData.departmentId && userSessionData.departmentId !== 1) {
        url += `&fromDepartmentId=${userSessionData.departmentId}`
      }
      
      const response = await getRequest(url)

      if (response && response.response) {
        const mappedData = mapApiData(response.response.content)
        setIndentData(mappedData)
        setTotalPages(response.response.totalPages)
        setTotalElements(response.response.totalElements)
      } else {
        setIndentData([])
        setTotalPages(0)
        setTotalElements(0)
      }
    } catch (error) {
      console.error("Error fetching indent data:", error)
      setIndentData([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }

  // Search with filters API
  const searchWithFilters = async (page = 0) => {
    try {
      setSearchLoading(true)
      
      // Build search parameters according to controller
      const params = {
        page: page,
        size: DEFAULT_ITEMS_PER_PAGE
      }
      
      // Add fromDepartmentId if selected
      if (selectedDepartment && selectedDepartment.deptId) {
        params.fromDepartmentId = selectedDepartment.deptId
      }
      
      // Add fromDate if provided
      if (fromDate) {
        params.fromDate = fromDate
      }
      
      // Add toDate if provided
      if (toDate) {
        params.toDate = toDate
      }
      
      // Build query string
      const queryParams = Object.entries(params)
        .filter(([key, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&')
      
      // Call search API endpoint
      const response = await getRequest(`/indent/tracking/search?${queryParams}`)
      
      if (response && response.response) {
        const mappedData = mapApiData(response.response.content)
        setIndentData(mappedData)
        setTotalPages(response.response.totalPages)
        setTotalElements(response.response.totalElements)
        setIsSearchMode(true)
      } else {
        setIndentData([])
        setTotalPages(0)
        setTotalElements(0)
      }
    } catch (error) {
      console.error("Error searching indent data:", error)
      setIndentData([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      setSearchLoading(false)
    }
  }

  // Check if search button should be enabled
  const isSearchEnabled = () => {
    // Enable search if at least one of the following is provided:
    // 1. Department is selected (for admin users)
    // 2. From date is provided
    // 3. To date is provided
    
    const hasDepartment = userSessionData?.departmentId === 1 
      ? (selectedDepartment && selectedDepartment.deptId)
      : true // Non-admin users always have their department
    
    const hasFromDate = fromDate !== ""
    const hasToDate = toDate !== ""
    
    return hasDepartment || hasFromDate || hasToDate
  }

  // Helper function to map API data
  const mapApiData = (apiData) => {
    return apiData.map(item => ({
      indentId: item.indentMId,
      indentDate: item.indentDate,
      indentNo: item.indentNo,
      department: item.deptName,
      toDepartment: item.toDepartmentName,
      approvedDate: item.approvedDate,
      issuedDate: item.issueDate,
      receivedDate: item.receivedDate,
      returnDate: item.returnDate,
      status: getStatusDisplayName(item.statusName),
      statusCode: item.statusName,
      items: item.indentTResponses ? item.indentTResponses.map(child => ({
        id: child.indentTId,
        drugCode: child.itemId,
        drugName: child.itemName,
        apu: child.itemUnitName,
        qtyRequested: child.qtyRequested,
        approvedQty: child.qtyApproved,
        receivedQty: child.qtyReceived,
        reasonForIndent: child.reasonForIndent
      })) : []
    }))
  }

  // Helper function to convert status code to display name
  const getStatusDisplayName = (statusCode) => {
    const statusMap = {
      'S':'Saved(Draft)',
      'Y':'Submited',
      'FI': 'Fully Issued from the issue dept',
      'AA': 'Approved at Issue Dept',
      'RR':'Rejected at Issue Dept',
      'A':'Approved',
      'R': 'Rejected',
      'RC': 'Received'
    }
    return statusMap[statusCode] || statusCode
  }

  // Handle search button click
  const handleSearch = () => {
    // Validate at least one search criteria is provided
    if (!isSearchEnabled()) {
      alert("Please select at least one search criteria (Department or Date)")
      return
    }
    
    if (fromDate && toDate) {
      const from = new Date(fromDate)
      const to = new Date(toDate)
      
      // Validate date range
      if (from > to) {
        alert("From Date cannot be greater than To Date")
        return
      }
      
      const diffTime = Math.abs(to - from)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays > 365) {
        alert("Date range cannot be more than 1 year")
        return
      }
    }
    
    setCurrentPage(0)
    searchWithFilters(0)
  }

  // Handle show all button click
  const handleShowAll = () => {
    // Reset department based on user type
    if (userSessionData && userSessionData.departmentId === 1) {
      setSelectedDepartment(null) // Admin can reset to all departments
    } else if (userSessionData && userSessionData.departmentName) {
      setSelectedDepartment({
        deptId: userSessionData.departmentId,
        deptName: userSessionData.departmentName
      })
    }
    
    setFromDate("")
    setToDate("")
    setCurrentPage(0)
    setIsSearchMode(false)
    fetchIndentData(0)
  }

  // Handle page change
  const handlePageChange = (page) => {
    const newPage = page - 1
    setCurrentPage(newPage)
    
    if (isSearchMode) {
      searchWithFilters(newPage)
    } else {
      fetchIndentData(newPage)
    }
  }

  // Handle department change (only for admin users)
  const handleDepartmentChange = (deptValue) => {
    // Find the selected department object
    const selectedDept = departments.find(dept => dept.deptId === parseInt(deptValue)) || null
    setSelectedDepartment(selectedDept)
  }

  // Fetch batch details (you'll need to implement this API)
  const fetchBatchDetails = async (itemId, indentNo) => {
    try {
      // Replace with your actual API call
      const response = await getRequest(`/batch/details?itemId=${itemId}&indentNo=${indentNo}`)
      if (response && response.response) {
        return response.response
      }
      return []
    } catch (error) {
      console.error("Error fetching batch details:", error)
      return []
    }
  }

  const handleRowClick = async (record, e) => {
    e.stopPropagation()
    setLoading(true)
    
    // Fetch batch details for items with received quantity
    if (record.items && record.items.length > 0) {
      const itemsWithBatchDetails = await Promise.all(
        record.items.map(async (item) => {
          if (item.receivedQty > 0) {
            const batchDetails = await fetchBatchDetails(item.drugCode, record.indentNo)
            return { ...item, batchDetails }
          }
          return item
        })
      )
      
      setSelectedIndent({
        ...record,
        items: itemsWithBatchDetails
      })
    } else {
      setSelectedIndent(record)
    }
    
    setCurrentView("detail")
    setLoading(false)
  }

  const handleBackToList = () => {
    setCurrentView("list")
    setSelectedIndent(null)
  }

  const handleReceivedQtyClick = (item) => {
    if (item.receivedQty > 0 && item.batchDetails) {
      setSelectedItemForPopup(item)
      setShowReceivedQtyPopup(true)
    }
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

  const formatDate = (dateStr) => {
    if (!dateStr) return "-"
    const parts = dateStr.split("-")
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return dateStr
  }

  // Check if report buttons should be enabled
  const canShowIssueReport = (indent) => indent.issuedDate !== null
  const canShowReceivingReport = (indent) => {
    return indent.items && indent.items.some(item => item.receivedQty > 0)
  }
  const canShowReturnReport = (indent) => indent.statusCode === 'R'

  // Detail View (same as before)
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
                {/* Detail view content */}
                <div className="row mb-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Indent No</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedIndent?.indentNo || ""}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Indent Date</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formatDate(selectedIndent?.indentDate) || ""}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">From Department</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedIndent?.department || ""}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">To Department</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedIndent?.toDepartment || ""}
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
                      value={formatDate(selectedIndent?.approvedDate) || "-"}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Issued Date</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formatDate(selectedIndent?.issuedDate) || "-"}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Status</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedIndent?.status || ""}
                      readOnly
                    />
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Drug Name / Drug Code</th>
                        <th>A/U</th>
                        <th>Qty Requested</th>
                        <th>Approved Qty</th>
                        <th>Received Qty</th>
                        <th>Reason for Indent</th>
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
                                value={`${item.drugName} [${item.drugCode}]`}
                                readOnly
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={item.apu}
                                readOnly
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={item.qtyRequested || 0}
                                readOnly
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={item.approvedQty || 0}
                                readOnly
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={item.receivedQty || 0}
                                onClick={() => handleReceivedQtyClick(item)}
                                style={{ cursor: item.receivedQty > 0 ? 'pointer' : 'default' }}
                                readOnly
                              />
                            </td>
                            <td>
                              <textarea
                                className="form-control form-control-sm"
                                value={item.reasonForIndent || ""}
                                readOnly
                                rows="1"
                              />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center">
                            No items found.
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
                  {canShowIssueReport(selectedIndent) && (
                    <button type="button" className="btn btn-primary" onClick={() => handleIssueReport(selectedIndent?.indentNo)}>
                      Issue Report
                    </button>
                  )}
                  {canShowReceivingReport(selectedIndent) && (
                    <button type="button" className="btn btn-primary" onClick={() => handleReceivingReport(selectedIndent?.indentNo)}>
                      Receiving Report
                    </button>
                  )}
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
          <div className="modal show d-block" onClick={handleClosePopup}>
            <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
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
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={formatDate(batch.expiryDate)}
                                  readOnly
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={batch.qty}
                                  readOnly
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
                      value={selectedItemForPopup.receivedQty || 0}
                      readOnly
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

  // List View with Search Filters
  return (
    <div className="content-wrapper">
      {(loading || searchLoading) && <LoadingScreen/>}
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">INDENT TRACKING LIST</h4>
            </div>
            <div className="card-body">
              {/* Search Filters */}
              <div className="row mb-4">
                {/* Department Field */}
                <div className="col-md-3">
                  <label className="form-label fw-bold">Department</label>
                  {userSessionData && userSessionData.departmentId === 1 ? (
                    // Admin users (departmentId = 1) see dropdown with all departments
                    <select
                      className="form-select"
                      value={selectedDepartment ? selectedDepartment.deptId : ""}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      disabled={!departments.length}
                    >
                      <option value="">All Departments</option>
                      {departments.map((dept, index) => (
                        <option key={index} value={dept.deptId}>{dept.deptName}</option>
                      ))}
                    </select>
                  ) : (
                    // Non-admin users see their department as read-only
                    <input
                      type="text"
                      className="form-control"
                      value={userSessionData?.departmentName || "Loading..."}
                      readOnly
                    />
                  )}
                </div>
                
                {/* From Date */}
                <div className="col-md-2">
                  <label className="form-label fw-bold">From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                {/* To Date */}
                <div className="col-md-2">
                  <label className="form-label fw-bold">To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                {/* Search and Show All Buttons */}
                <div className="col-md-2 d-flex align-items-end">
                  <button 
                    type="button" 
                    className="btn btn-primary me-2" 
                    onClick={handleSearch}
                    disabled={searchLoading || !isSearchEnabled()}
                  >
                    {searchLoading ? "Searching..." : "Search"}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={handleShowAll}
                    disabled={loading}
                  >
                    Show All
                  </button>
                </div>
                
                {/* Total Records */}
                <div className="col-md-3 d-flex justify-content-end align-items-end">
                  <span className="fw-bold">Total Records: {totalElements}</span>
                </div>
              </div>

              {/* Table */}
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Indent Date</th>
                      <th>Indent No</th>
                      <th>To Department</th>
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
                    {indentData.length === 0 && !loading && !searchLoading ? (
                      <tr>
                        <td colSpan={10} className="text-center">
                          No records found.
                        </td>
                      </tr>
                    ) : (
                      indentData.map((item) => (
                        <tr key={item.indentId}>
                          <td onClick={(e) => handleRowClick(item, e)} style={{ cursor: 'pointer' }}>
                            {formatDate(item.indentDate)}
                          </td>
                          <td onClick={(e) => handleRowClick(item, e)} style={{ cursor: 'pointer' }}>
                            {item.indentNo}
                          </td>
                          <td onClick={(e) => handleRowClick(item, e)} style={{ cursor: 'pointer' }}>
                            {item.toDepartment}
                          </td>
                          <td onClick={(e) => handleRowClick(item, e)} style={{ cursor: 'pointer' }}>
                            {formatDate(item.approvedDate)}
                          </td>
                          <td onClick={(e) => handleRowClick(item, e)} style={{ cursor: 'pointer' }}>
                            {formatDate(item.issuedDate)}
                          </td>
                          <td onClick={(e) => handleRowClick(item, e)} style={{ cursor: 'pointer' }}>
                            {item.status}
                          </td>
                          <td>
                            <button 
                              type="button" 
                              className="btn btn-success btn-sm text-nowrap"
                              onClick={() => handleIndentReport(item.indentNo)}
                            >
                              Indent Report
                            </button>
                          </td>
                          <td>
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
                          <td>
                            {canShowReceivingReport(item) ? (
                              <button 
                                type="button" 
                                className="btn btn-success btn-sm text-nowrap"
                                onClick={() => handleReceivingReport(item.indentNo)}
                              >
                                Receiving Report
                              </button>
                            ) : (
                              <span className="text-muted">N/A</span>
                            )}
                          </td>
                          <td>
                            {canShowReturnReport(item) ? (
                              <button 
                                type="button" 
                                className="btn btn-success btn-sm text-nowrap"
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

              {/* Pagination */}
              <Pagination
                totalItems={totalElements}
                itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                currentPage={currentPage + 1}
                onPageChange={handlePageChange}
                totalPages={totalPages}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrackIndent