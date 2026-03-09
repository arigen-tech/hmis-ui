import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import { Store_Internal_Indent, MAS_DRUG_MAS, INVENTORY } from "../../../config/apiConfig"
import { getRequest, postRequest } from "../../../service/apiService"
import LoadingScreen from "../../../Components/Loading"
import DatePicker from "../../../Components/DatePicker"
import Pagination, {DEFAULT_ITEMS_PER_PAGE} from "../../../Components/Pagination";

const IndentApproval = () => {
  const [currentView, setCurrentView] = useState("list")
  const [processing, setProcessing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [itemOptions, setItemOptions] = useState([])
  const [indentEntries, setIndentEntries] = useState([])
  const [popupMessage, setPopupMessage] = useState(null)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [indentData, setIndentData] = useState([])
  const [filteredIndentData, setFilteredIndentData] = useState([])
  const [action, setAction] = useState("")
  const [remarks, setRemarks] = useState("")

  const departmentId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId")

  // Status mapping - updated to use statusName
  const statusMap = {
    'Approved': { label: "Pending for Issue Department", badge: "bg-success", textColor: "text-white" },
  }

  // Fetch pending indents (list view) - UPDATED to use new endpoint
  const fetchPendingIndents = async (deptId) => {
    try {
      if (!deptId) {
        console.error("deptId is missing. Cannot fetch pending indents.");
        showPopup("Department not found. Please login again.", "error");
        return;
      }

      setLoading(true);

      // Updated URL to use the new endpoint
      const url = `${INVENTORY}/indents/approvedForIssueDept?deptId=${deptId}`;

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

  // Fetch indent details by indentMId - NEW FUNCTION
  const fetchIndentDetails = async (indentMId) => {
    try {
      setLoadingDetails(true)
      // Use the new endpoint with indentMId and departmentId
      const url = `${INVENTORY}/indentDetailsForIssueWithAvailableStock/${indentMId}?departmentId=${departmentId}`

      console.log("Fetching indent details from URL:", url)

      const response = await getRequest(url)
      console.log("Indent Details API Full Response:", response)

      let items = []
      if (response && response.response && Array.isArray(response.response)) {
        items = response.response
      } else if (response && Array.isArray(response)) {
        items = response
      } else {
        console.warn("Unexpected response structure, using empty array:", response)
        items = []
      }

      // Transform the API response to match the indentEntries format
      const entries = items.map((item) => {
        // Try to get current stock from drug list first
        const drugInfo = itemOptions.find(drug => drug.name === item.itemName)
        
        return {
          id: item.indentTId || null,
          itemId: item.itemId || "", // Note: itemId might not be in the response
          itemCode: item.itemCode || "", // Note: itemCode might not be in the response
          itemName: item.itemName || "",
          apu: item.itemUnitName || "",
          requestedQty: item.qtyRequested || "",
          approveQty: item.qtyRequested || "", // Default to requested quantity for approval
          availableStock: item.availableStock || drugInfo?.availableStock || 0,
          storesStock: drugInfo?.storesStock || "",
          reasonForIndent: item.reasonForIndent || "",
        }
      })

      console.log("Setting indent entries from details:", entries)
      setIndentEntries(entries)

    } catch (err) {
      console.error("Error fetching indent details:", err)
      showPopup("Error fetching indent details. Please try again.", "error")
      setIndentEntries([])
    } finally {
      setLoadingDetails(false)
    }
  }

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
  }, [departmentId]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // Handle edit click - UPDATED to fetch indent details using indentMId
  const handleEditClick = async (record, e) => {
    e.stopPropagation()

    console.log("Approving record:", record)
    setSelectedRecord(record)

    // Fetch the detailed items for this indent using indentMId
    await fetchIndentDetails(record.indentMId)

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
      deletedT: [], // Always send empty array
      items: indentEntries
        .filter((entry) => entry.itemName) // Filter out empty entries
        .map((entry) => {
          const itemPayload = {
            itemId: entry.itemId ? Number(entry.itemId) : 0, // Use 0 if itemId is not available
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
      await postRequest(
        `${INVENTORY}/indent/approvedByIssueDept`,
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
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredIndentData.slice(indexOfFirst, indexOfLast);

  // Detail View - WITH APPROVAL FUNCTIONALITY
  if (currentView === "detail") {
    // Use statusName from the new API response
    const statusInfo = statusMap[selectedRecord?.statusName] || { label: selectedRecord?.statusName || "Unknown", badge: "bg-secondary", textColor: "text-white" };

    return (
      <div className="content-wrapper">
        {(loading || loadingDetails) && <LoadingScreen />}

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
                      value={selectedRecord?.deptName || selectedRecord?.departmentName || ""}
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
                        <th style={{ width: "300px", minWidth: "300px" }}>Item Name</th>
                        <th style={{ width: "100px", minWidth: "100px" }}>A/U</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>Requested Quantity</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>Approve Quantity</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>Available Stock</th>
                        <th style={{ width: "200px", minWidth: "200px" }}>Reason for Indent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingDetails ? (
                        <tr>
                          <td colSpan={7} className="text-center">
                            <LoadingScreen />
                          </td>
                        </tr>
                      ) : indentEntries.length === 0 ? (
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
                                disabled={action === "rejected" || loadingDetails} // Disable if rejected or loading
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
                      disabled={loadingDetails}
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
                      disabled={loadingDetails}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={processing || !action || !remarks.trim() || loadingDetails}
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
                  <DatePicker
                    label="From Date"
                    value={fromDate}
                    onChange={setFromDate}  
                    compact={true}
                  />
                </div>
                <div className="col-md-2">
                  <DatePicker
                    label="To Date"
                    value={toDate}
                    onChange={setToDate}  
                    compact={true}
                  />
                </div>
                <div className="col-md-2 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-primary me-2"
                    onClick={handleSearch}
                    disabled={loading}
                  >
                    {loading ? <LoadingScreen/> : "Search"}
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
                          {loading ? <LoadingScreen/> : "No pending indents found."}
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((item) => {
                        // Use statusName from the new API response
                        const statusInfo = statusMap[item.statusName] || { label: item.statusName || "Unknown", badge: "bg-secondary", textColor: "text-white" };
                        return (
                          <tr key={item.indentMId} onClick={(e) => handleEditClick(item, e)} style={{ cursor: "pointer" }}>
                            <td>{formatDateTime(item.indentDate)}</td>
                            <td>{item.indentNo}</td>
                            <td>{item.deptName}</td>
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

              <Pagination
                totalItems={filteredIndentData.length}
                itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
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