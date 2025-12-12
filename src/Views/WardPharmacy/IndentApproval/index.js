import { useState, useRef, useEffect } from "react"
import ReactDOM from "react-dom"
import Popup from "../../../Components/popup"
import { Store_Internal_Indent, MAS_DRUG_MAS } from "../../../config/apiConfig"
import { getRequest, postRequest } from "../../../service/apiService"
import LoadingScreen from "../../../Components/Loading"

const IndentApproval = () => {
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
    'A': { label: "Pending for Issue Department ", badge: "bg-success", textColor: "text-white" },
  }



  const fetchPendingIndents = async (departmentId) => {
    try {
      if (!departmentId) {
        console.error("deptId is missing. Cannot fetch pending indents.");
        showPopup("Department not found. Please login again.", "error");
        return;
      }

      setLoading(true);

      const url = `${Store_Internal_Indent}/getallindentforapproved?deptId=${departmentId}`;

      console.log("Fetching pending indents from URL:", url);

      const response = await getRequest(url);
      console.log("Pending Indents API Full Response:", response);

      let data = [];
      if (response && response.response && Array.isArray(response.response)) {
        data = response.response;
      } else if (response && Array.isArray(response)) {
        data = response;
      } else {
        console.warn("Unexpected response structure, using empty array:", response);
        data = [];
      }

      console.log("Processed pending indents data:", data);
      setIndentData(data);
      setFilteredIndentData(data);

    } catch (err) {
      console.error("Error fetching pending indents:", err);
      showPopup("Error fetching pending indents. Please try again.", "error");
      setIndentData([]);
      setFilteredIndentData([]);
    } finally {
      setLoading(false);
    }
  };


  // Fetch all drugs for dropdown with current stock
  const fetchAllDrugs = async () => {
    try {
      const response = await getRequest(`${MAS_DRUG_MAS}/getAll/1`)
      console.log("Drugs API Response:", response)

      if (response && response.response && Array.isArray(response.response)) {
        const drugs = response.response.map(drug => ({
          id: drug.itemId,
          code: drug.pvmsNo || "",
          name: drug.nomenclature || "",
          unit: drug.unitAuName || drug.dispUnitName || "",
          availableStock: drug.wardstocks || drug.storestocks || 0,
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

  useEffect(() => {
    fetchPendingIndents(departmentId)
    fetchAllDrugs()
  }, [departmentId])


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

  // Handle edit click - for approval/rejection
  const handleEditClick = async (record, e) => {
    e.stopPropagation()

    console.log("Approving record:", record)
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
            approveQty: item.requestedQty || "", // Default to requested quantity for approval
            availableStock: currentStock,
            storesStock: item.storesStock || "",
            reasonForIndent: item.reason || "",
          }
        })
      )
    } else {
      console.log("No items found")
      entries = []
    }

    console.log("Setting indent entries for approval:", entries)
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

  // Handle approve quantity change
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

      if (approveQty < 0) {
        showPopup("Approve quantity cannot be negative", "error")
        return
      }
    }

    updatedEntries[index] = {
      ...updatedEntries[index],
      [field]: value,
    }

    setIndentEntries(updatedEntries)
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

  // Handle approval/rejection submission
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

    // Validate approve quantities for approved action
    if (action === "approved") {
      const invalidEntries = indentEntries.filter((entry) => {
        const approveQty = Number(entry.approveQty || 0)
        const availableStock = Number(entry.availableStock)
        const requestedQty = Number(entry.requestedQty)

        return (
          approveQty > availableStock ||
          approveQty > requestedQty ||
          approveQty < 0
        )
      })

      if (invalidEntries.length > 0) {
        showPopup(
          "Please ensure all approve quantities are valid and do not exceed available stock or requested quantity",
          "error"
        )
        return
      }
    }

    // Build payload according to IssueInternalIndentApprovalRequest
    const payload = {
      indentMId: selectedRecord?.indentMId,
      action: action, // "approved" or "rejected"
      remarks: remarks,
      // remove this line if your backend DTO doesn't have deletedT
      deletedT: dtRecord.length > 0 ? dtRecord : [],
      items: indentEntries
        .filter((entry) => entry.itemId && entry.itemName)
        .map((entry) => {
          const itemPayload = {
            itemId: Number(entry.itemId),
            requestedQty: entry.requestedQty ? Number(entry.requestedQty) : 0,
            approveQty: entry.approveQty
              ? Number(entry.approveQty)
              : action === "approved"
                ? Number(entry.requestedQty || 0)
                : 0,
            reason: entry.reasonForIndent || "",
          }

          // Only send indentTId if exists and is a number
          if (entry.id && typeof entry.id === "number") {
            itemPayload.indentTId = entry.id
          }

          return itemPayload
        }),
    }

    console.log(
      "Submitting approval payload:",
      JSON.stringify(payload, null, 2)
    )

    try {
      setProcessing(true)

      // Call ISSUE approval API endpoint
      const response = await postRequest(
        `${Store_Internal_Indent}/submitapprove`,
        payload
      )

      showPopup(`Indent ${action} successfully!`, "success")

      // Refresh the list and go back
      setTimeout(() => {
        handleBackToList()
        fetchPendingIndents(departmentId)
      }, 1500)

    } catch (error) {
      console.error("Error processing indent:", error)
      showPopup("Error processing indent. Please try again.", "error")
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

  // Format date only (without time) for display
  const formatDateOnly = (dateStr) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-GB")
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

  // Detail View - WITH APPROVAL FUNCTIONALITY
  if (currentView === "detail") {
    const statusInfo = statusMap[selectedRecord?.status] || { label: "Unknown", badge: "bg-secondary", textColor: "text-white" };

    return (
      <div className="content-wrapper">
      {loading && <LoadingScreen/>}

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
                      value={selectedRecord?.indentDate ? formatDateTime(selectedRecord.indentDate) : ""}
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
                      value={selectedRecord?.departmentName || selectedRecord?.fromDeptName || ""}
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
                </div>

                <div className="row mb-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Approved Date</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.approvedDate ? formatDateTime(selectedRecord.approvedDate) : "Pending"}
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
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Status</label>
                    <input
                      type="text"
                      className="form-control"
                      value={statusInfo.label}
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
                                disabled={action === "rejected"} // Disable if rejected
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
                      <th>Department Name</th>
                      <th>Created By</th>
                      <th>Approved Date</th>
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
                            <td>{formatDateTime(item.indentDate)}</td>
                            <td>{item.indentNo}</td>
                            <td>{item.departmentName || item.fromDeptName}</td>
                            <td>{item.createdBy}</td>
                            <td>{item.approvedDate ? formatDateTime(item.approvedDate) : "Pending"}</td>
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

export default IndentApproval