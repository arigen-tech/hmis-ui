import { useState, useRef, useEffect } from "react"
import ReactDOM from "react-dom"
import Popup from "../../../Components/popup"
import { Store_Internal_Indent, MAS_DRUG_MAS } from "../../../config/apiConfig"
import { getRequest, postRequest } from "../../../service/apiService"

const PendingIndentApproval = () => {
  const [currentView, setCurrentView] = useState("list")
  const [processing, setProcessing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [itemOptions, setItemOptions] = useState([])
  const [dtRecord, setDtRecord] = useState([])
  const [indentEntries, setIndentEntries] = useState([])
  const [popupMessage, setPopupMessage] = useState(null)
  const dropdownClickedRef = useRef(false)
  const [activeItemDropdown, setActiveItemDropdown] = useState(null)
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0, width: 0 })
  const itemInputRefs = useRef({})
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const [indentData, setIndentData] = useState([])
  const [filteredIndentData, setFilteredIndentData] = useState([])
  const [action, setAction] = useState("")
  const [remarks, setRemarks] = useState("")

  const hospitalId = sessionStorage.getItem("hospitalId") || localStorage.getItem("hospitalId")
  const departmentId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId")

  // Status mapping
  const statusMap = {
    's': { label: "Draft", badge: "bg-info", textColor: "text-white" },
    'S': { label: "Draft", badge: "bg-info", textColor: "text-white" },
    'y': { label: "Pending for Approval", badge: "bg-warning", textColor: "text-dark" },
    'Y': { label: "Pending for Approval", badge: "bg-warning", textColor: "text-dark" },
    'aa': { label: "Approved", badge: "bg-success", textColor: "text-white" },
    'AA': { label: "Approved", badge: "bg-success", textColor: "text-white" },
    'rr': { label: "Rejected", badge: "bg-danger", textColor: "text-white" },
    'RR': { label: "Rejected", badge: "bg-danger", textColor: "text-white" },
  }

  // Fetch pending indents (status 'Y')
  const fetchPendingIndents = async (departmentId) => {
    try {
      setLoading(true)
      const url = `${Store_Internal_Indent}/getallindentforpending?deptId=${departmentId}`

      console.log("Fetching pending indents from URL:", url)

      const response = await getRequest(url)
      console.log("Pending Indents API Full Response:", response)

      let data = []
      if (response && response.response && Array.isArray(response.response)) {
        data = response.response
      } else if (response && Array.isArray(response)) {
        data = response
      } else {
        console.warn("Unexpected response structure, using empty array:", response)
        data = []
      }

      console.log("Processed pending indents data:", data)
      setIndentData(data)
      setFilteredIndentData(data)

    } catch (err) {
      console.error("Error fetching pending indents:", err)
      showPopup("Error fetching pending indents. Please try again.", "error")
      setIndentData([])
      setFilteredIndentData([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch all drugs for dropdown with current stock
  const fetchAllDrugs = async () => {
    try {
      const response = await getRequest(`${MAS_DRUG_MAS}/getAll/1/${hospitalId}/${departmentId}`)
      console.log("Drugs API Response:", response)

      if (response && response.response && Array.isArray(response.response)) {
        const drugs = response.response.map(drug => ({
          id: drug.itemId,
          code: drug.pvmsNo || "",
          name: drug.nomenclature || "",
          unit: drug.unitAuName || drug.dispUnitName || "",
          availableStock: drug.wardstocks || drug.storestocks || 0, // Use available stock
          storesStock: drug.storestocks || 0
        }))
        setItemOptions(drugs)
        console.log("Loaded drugs with stock:", drugs)
      } else if (response && Array.isArray(response)) {
        const drugs = response.map(drug => ({
          id: drug.itemId,
          code: drug.pvmsNo || "",
          name: drug.nomenclature || "",
          unit: drug.unitAuName || drug.dispUnitName || "",
          availableStock: drug.wardstocks || drug.storestocks || 0,
          storesStock: drug.storestocks || 0
        }))
        setItemOptions(drugs)
        console.log("Loaded drugs with stock:", drugs)
      }
    } catch (err) {
      console.error("Error fetching drugs:", err)
    }
  }

  // Fetch current stock for specific item
  const fetchCurrentStock = async (itemId, deptId) => {
    try {
      // You might need to create an API endpoint for this
      const response = await getRequest(`${MAS_DRUG_MAS}/stock/${itemId}/${deptId}`)
      return response?.currentStock || 0
    } catch (err) {
      console.error("Error fetching current stock:", err)
      return 0
    }
  }

 useEffect(() => {
  fetchPendingIndents(departmentId)
  fetchAllDrugs()
}, [departmentId])


  // Filter drugs based on search input
  const filterDrugsBySearch = (searchTerm) => {
    if (!searchTerm) return [];

    return itemOptions.filter(drug =>
      drug.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drug.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drug.id?.toString().includes(searchTerm)
    ).slice(0, 10);
  }

  // Handle drug input focus for dropdown positioning
  const handleDrugInputFocus = (event, index) => {
    const input = event.target;
    const rect = input.getBoundingClientRect();

    setDropdownPosition({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY,
      width: rect.width
    });

    setActiveItemDropdown(index);
  }

  // Handle search by date range
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

  // Handle edit click - UPDATED to fetch current stock
  const handleEditClick = async (record, e) => {
    e.stopPropagation()

    console.log("Viewing record:", record)
    setSelectedRecord(record)

    // Initialize entries from the items array in the record
    let entries = []

    if (record.items && Array.isArray(record.items) && record.items.length > 0) {
      console.log("Items found:", record.items)
      
      // Create entries with current stock data
      entries = await Promise.all(
        record.items.map(async (item) => {
          // Try to get current stock from drug list first
          const drugInfo = itemOptions.find(drug => drug.id === item.itemId)
          let currentStock = drugInfo?.availableStock || 0
          
          // If not found in drug list, use the availableStock from backend
          if (!currentStock && item.availableStock) {
            currentStock = item.availableStock
          }
          
          return {
            id: item.indentTId || null,
            itemId: item.itemId || "",
            itemCode: item.pvmsNo || "",
            itemName: item.itemName || "",
            apu: item.unitAuName || "",
            requestedQty: item.requestedQty || "",
            availableStock: currentStock, // Use current stock
            storesStock: item.storesStock || "",
            reasonForIndent: item.reason || "",
          }
        })
      )
    } else {
      console.log("No items found")
      entries = []
    }

    console.log("Setting indent entries with current stock:", entries)
    setIndentEntries(entries)
    setAction("")
    setRemarks("")
    setCurrentView("detail")
  }

  // Handle back to list
  const handleBackToList = () => {
    setCurrentView("list")
    setSelectedRecord(null)
    setIndentEntries([])
    setAction("")
    setRemarks("")
  }

  // Handle show all
  const handleShowAll = () => {
    setFromDate("")
    setToDate("")
    setFilteredIndentData(indentData)
  }

  // Handle page navigation
  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    } else {
      showPopup("Please enter a valid page number.", "warning")
    }
  }

  // Show popup
  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
      },
    })
  }

  // Handle approval/rejection
  const handleSubmit = async () => {
    // Validate action selection
    if (!action) {
      showPopup("Please select an action (Approved or Rejected)", "error")
      return
    }

    // Validate remarks
    if (!remarks.trim()) {
      showPopup("Remarks are mandatory", "error")
      return
    }

    // Determine the new status based on action
    const newStatus = action === "approved" ? "AA" : "RR"

    const payload = {
      indentMId: selectedRecord?.indentMId,
      action: action,
      remarks: remarks,
      status: newStatus,
      deletedT: dtRecord.length > 0 ? dtRecord : [],
      items: indentEntries
        .filter(entry => entry.itemId && entry.itemName)
        .map((entry) => {
          const itemPayload = {
            itemId: Number(entry.itemId),
            requestedQty: entry.requestedQty ? Number(entry.requestedQty) : 0,
            reason: entry.reasonForIndent || "",
            availableStock: entry.availableStock ? Number(entry.availableStock) : 0,
          }

          // Only send indentTId if it exists and is a number
          if (entry.id && typeof entry.id === 'number') {
            itemPayload.indentTId = entry.id
          }

          return itemPayload
        }),
    }

    console.log("Submitting approval payload:", JSON.stringify(payload, null, 2))

    try {
      setProcessing(true)

      // Call approval API endpoint
      const response = await postRequest(`${Store_Internal_Indent}/approve`, payload)

      showPopup(`Indent ${action} successfully!`, "success")
      
      // Refresh the list and go back
      handleBackToList()
      fetchPendingIndents(departmentId)
      
    } catch (error) {
      console.error("Error processing indent:", error)
      showPopup(`Error processing indent. Please try again.`, "error")
    } finally {
      setProcessing(false)
    }
  }

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-GB")
  }

  // Format date time for display
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

  // Pagination
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeItemDropdown !== null && !event.target.closest('.dropdown-search-container')) {
        setActiveItemDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeItemDropdown]);

  // Detail View - UPDATED to show available stock
  if (currentView === "detail") {
    const statusInfo = statusMap[selectedRecord?.status] || { label: "Unknown", badge: "bg-secondary", textColor: "text-white" };

    return (
      <div className="content-wrapper">
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">Pending for Indent Approval</h4>
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
                    <label className="form-label fw-bold">Created By</label>
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
                      value={formatDateTime(selectedRecord?.submissionDateTime || selectedRecord?.createdDate)}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                </div>

                <div className="table-responsive" style={{ overflowX: "auto", maxWidth: "100%", overflowY: "visible" }}>
                  <table className="table table-bordered table-hover align-middle" >
                    <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                    <tr>
  <th className="text-center" style={{ width: "50px", minWidth: "50px" }}>
    S.No.
  </th>

  <th style={{ width: "350px", minWidth: "300px" }}>
    Item Name/Code
  </th>

  <th style={{ width: "60px", minWidth: "50px", textAlign: "center" }}>
    A/U
  </th>

  <th
    style={{
      width: "40px",
      minWidth: "40px",
      whiteSpace: "normal",
      lineHeight: "1.1",
      textAlign: "center"
    }}
  >
    Req<br/>Qty
  </th>

  <th
    style={{
      width: "60px",
      minWidth: "60px",
      whiteSpace: "normal",
      lineHeight: "1.1",
      textAlign: "center"
    }}
  >
    Avl<br/>Stk
  </th>

  <th style={{ width: "200px", minWidth: "180px" }}>
    Reason for Indent
  </th>
</tr>

                    </thead>
                    <tbody>
                      {indentEntries.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center text-muted">
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
                                style={{  backgroundColor: "#f5f5f5" }}
                                readOnly
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={entry.requestedQty}
                                style={{ backgroundColor: "#f5f5f5" }}
                                readOnly
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={entry.availableStock || 0}
                                style={{ 
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
                                style={{ minHeight: "40px", backgroundColor: "#f5f5f5" }}
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
                      placeholder="Enter remarks"
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
              <h4 className="card-title p-2 mb-0">Pending For Indent Approval</h4>
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
                    disabled={loading}
                  >
                    {loading ? "Searching..." : "Search"}
                  </button>
                </div>
                <div className="col-md-6 d-flex justify-content-end align-items-end">
                  <button type="button" className="btn btn-primary" onClick={handleShowAll}>
                    Show All
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                    <tr>
                      <th>Indent Date</th>
                      <th>Indent No</th>
                      <th>From Department</th>
                      <th>To Department</th>
                      <th>Created By</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center">
                          {loading ? "Loading..." : "No pending indents found."}
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((item) => {
                        const statusInfo = statusMap[item.status] || { label: "Unknown", badge: "bg-secondary", textColor: "text-white" };
                        return (
                          <tr key={item.indentMId} onClick={(e) => handleEditClick(item, e)} style={{ cursor: "pointer" }}>
                            <td>{formatDate(item.indentDate)}</td>
                            <td>{item.indentNo}</td>
                            <td>{item.fromDeptName}</td>
                            <td>{item.toDeptName}</td>
                            <td>{item.createdBy}</td>
                            <td>
                              <span
                                className={`badge ${statusInfo.badge} ${statusInfo.textColor}`}
                              >
                                {statusInfo.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })
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

export default PendingIndentApproval