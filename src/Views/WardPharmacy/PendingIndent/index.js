import { useState, useEffect } from "react"
import { useNavigate } from 'react-router-dom'
import Popup from "../../../Components/popup"
import ConfirmationPopup from "../../../Components/ConfirmationPopup"
import { Store_Internal_Indent, MAS_DRUG_MAS, ALL_REPORTS } from "../../../config/apiConfig"
import { getRequest, postRequest } from "../../../service/apiService"
import LoadingScreen from "../../../Components/Loading"
import DatePicker from "../../../Components/DatePicker"
import Pagination, {DEFAULT_ITEMS_PER_PAGE} from "../../../Components/Pagination";

const PendingIndentApproval = () => {
  const [currentView, setCurrentView] = useState("list")
  const [processing, setProcessing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [itemOptions, setItemOptions] = useState([])
  const [dtRecord, setDtRecord] = useState([])
  const [indentEntries, setIndentEntries] = useState([])
  const [popupMessage, setPopupMessage] = useState(null)
  const [confirmationPopup, setConfirmationPopup] = useState(null)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [indentData, setIndentData] = useState([])
  const [filteredIndentData, setFilteredIndentData] = useState([])
  const [action, setAction] = useState("")
  const [remarks, setRemarks] = useState("")

  // Add navigate hook
  const navigate = useNavigate();

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

  // Confirmation Popup Helper Function
  const showConfirmationPopup = (message, type, onConfirm, onCancel = null, confirmText = "Yes", cancelText = "No") => {
    setConfirmationPopup({
      message,
      type,
      onConfirm: () => {
        onConfirm();
        setConfirmationPopup(null);
      },
      onCancel: onCancel ? () => {
        onCancel();
        setConfirmationPopup(null);
      } : () => setConfirmationPopup(null),
      confirmText,
      cancelText
    });
  };

  // Fetch pending indents (status 'Y')
  const fetchPendingIndents = async (deptId) => {
    try {
      setLoading(true)
      const url = `${Store_Internal_Indent}/getallindentforpending?deptId=${deptId}`

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
      setLoading(true)
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
    } finally {
      setLoading(false)
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

  // Add new row
  const addNewRow = () => {
    const newEntry = {
      id: null,
      itemId: "",
      itemCode: "",
      itemName: "",
      apu: "",
      requestedQty: "",
      availableStock: "",
      storesStock: "",
      reasonForIndent: "",
    }
    setIndentEntries([...indentEntries, newEntry])
  }

  // Remove row
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

  // Handle show all
  const handleShowAll = () => {
    setFromDate("")
    setToDate("")
    setFilteredIndentData(indentData)
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

  // Handle approval/rejection - UPDATED WITH CONFIRMATION POPUP
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
      await postRequest(`${Store_Internal_Indent}/approve`, payload)
      
      const indentMId = selectedRecord?.indentMId
      
      // Show confirmation popup based on action
      if (action === "approved") {
        showConfirmationPopup(
          `Indent approved successfully! Do you want to print report ?`,
          "success",
          () => {
            // Navigate to report page for approved indent
            navigate('/ViewDownloadReport', {
              state: {
                reportUrl: `${ALL_REPORTS}/indentReport?indentMId=${indentMId}`,
                title: 'Indent Approval Report',
                fileName: 'Indent Approval Report',
                returnPath: window.location.pathname
              }
            });
            handleBackToList();
            fetchPendingIndents(departmentId);
          },
          () => {
            // Just reset and stay on same page
            handleBackToList();
            fetchPendingIndents(departmentId);
          },
          "Yes",
          "No"
        );
      } else if (action === "rejected") {
        showConfirmationPopup(
          `Indent rejected successfully! Do you want to print report ?`,
          "success",
          () => {
            // Navigate to report page for rejected indent
            navigate('/ViewDownloadReport', {
              state: {
                reportUrl: `${ALL_REPORTS}/indentReport?indentMId=${indentMId}`,
                title: 'Indent Rejection Report',
                fileName: 'Indent Rejection Report',
                returnPath: window.location.pathname
              }
            });
            handleBackToList();
            fetchPendingIndents(departmentId);
          },
          () => {
            // Just reset and stay on same page
            handleBackToList();
            fetchPendingIndents(departmentId);
          },
          "Yes",
          "No"
        );
      }

    } catch (error) {
      console.error("Error processing indent:", error)
      
      // Show error popup
      showConfirmationPopup(
        `Error processing indent. Please try again.`,
        "error",
        () => {},
        null,
        "OK",
        "Close"
      );
      
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
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredIndentData.slice(indexOfFirst, indexOfLast);

  // Detail View
  if (currentView === "detail") {
    return (
      <div className="content-wrapper">
        {loading && <LoadingScreen />}
        
        {/* Add ConfirmationPopup component */}
        <ConfirmationPopup
          show={confirmationPopup !== null}
          message={confirmationPopup?.message || ''}
          type={confirmationPopup?.type || 'info'}
          onConfirm={confirmationPopup?.onConfirm || (() => {})}
          onCancel={confirmationPopup?.onCancel}
          confirmText={confirmationPopup?.confirmText || 'OK'}
          cancelText={confirmationPopup?.cancelText}
        />
        
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

                        <th style={{ width: "80px", minWidth: "80px", textAlign: "center" }}>
                          A/U
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
                          Req<br />Qty
                        </th>

                        <th
                          style={{
                            width: "70px",
                            minWidth: "70px",
                            whiteSpace: "normal",
                            lineHeight: "1.1",
                            textAlign: "center"
                          }}
                        >
                          Avl<br />Stk
                        </th>

                        <th style={{ width: "200px", minWidth: "180px" }}>
                          Reason for Indent
                        </th>

                        <th style={{ width: "50px", textAlign: "center" }}>
                          Add
                        </th>

                        <th style={{ width: "50px", textAlign: "center" }}>
                          Remove
                        </th>
                      </tr>

                    </thead>
                    <tbody>
                      {indentEntries.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center text-muted">
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
                                style={{ backgroundColor: "#f5f5f5" }}
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

                            </td>
                            <td>
                              <textarea
                                className="form-control form-control-sm"
                                value={entry.reasonForIndent}
                                style={{ minHeight: "40px", backgroundColor: "#f5f5f5" }}
                                readOnly
                              />
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
                                onClick={() => removeRow(index)}
                                className="btn btn-danger btn-sm"
                                style={{
                                  height: "35px",
                                }}
                                title="Delete Row"
                              >
                                −
                              </button>
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
                          {loading ? <LoadingScreen/> : "No pending indents found."}
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

export default PendingIndentApproval