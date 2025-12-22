import { useState, useRef, useEffect } from "react"
import ReactDOM from "react-dom"
import Popup from "../../../Components/popup"
import { Store_Internal_Indent, MAS_DRUG_MAS } from "../../../config/apiConfig"
import { getRequest, postRequest } from "../../../service/apiService"
import LoadingScreen from "../../../Components/Loading"

const IndentViewUpdate = () => {
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
  const [statusFilter, setStatusFilter] = useState("")
  const [selectedDrugs, setSelectedDrugs] = useState([])

  const hospitalId = sessionStorage.getItem("hospitalId") || localStorage.getItem("hospitalId")
  const departmentId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId")

  // Dynamic status mapping
  const getStatusInfo = (status) => {
    const statusMap = {
      's': { label: "Draft", badge: "bg-info", textColor: "text-white", editable: true },
      'S': { label: "Draft", badge: "bg-info", textColor: "text-white", editable: true },
      'y': { label: "Pending for Approval", badge: "bg-warning", textColor: "text-dark", editable: false },
      'Y': { label: "Pending for Approval", badge: "bg-warning", textColor: "text-dark", editable: false },
    };

    return statusMap[status] || { label: status, badge: "bg-secondary", textColor: "text-white", editable: false };
  }

  // Check if record is editable based on status
  const isEditable = (record) => {
    return getStatusInfo(record?.status).editable;
  }

  // Helper function to get display value with drug code in unique format
  const getDrugDisplayValue = (drugName, drugCode) => {
    if (!drugName && !drugCode) return "";
    if (drugName && drugCode) {
      return `${drugName} [${drugCode}]`;
    }
    return drugName || drugCode;
  };

  // Helper function to extract drug name from display value (for search)
  const extractDrugName = (displayValue) => {
    if (!displayValue) return "";
    // Remove the code part in brackets for searching
    const bracketIndex = displayValue.lastIndexOf('[');
    if (bracketIndex > -1) {
      return displayValue.substring(0, bracketIndex).trim();
    }
    return displayValue;
  };

  // Fetch all indents
  const fetchIndents = async (status = "") => {
    try {
      setLoading(true)
      let url = `${Store_Internal_Indent}/getallindent`
     

      console.log("Fetching indents from URL:", url)

      const response = await getRequest(url)
      console.log("Indents API Full Response:", response)

      let data = []
      if (response && response.response && Array.isArray(response.response)) {
        data = response.response
      } else if (response && Array.isArray(response)) {
        data = response
      } else {
        console.warn("Unexpected response structure, using empty array:", response)
        data = []
      }

      console.log("Processed indents data:", data)
      setIndentData(data)
      setFilteredIndentData(data)

    } catch (err) {
      console.error("Error fetching indents:", err)
      showPopup("Error fetching indents. Please try again.", "error")
      setIndentData([])
      setFilteredIndentData([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch all drugs for dropdown
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
          availableStock: drug.wardstocks || 0,
          storesStock: drug.storestocks || 0
        }))
        setItemOptions(drugs)
      } else if (response && Array.isArray(response)) {
        const drugs = response.map(drug => ({
          id: drug.itemId,
          code: drug.pvmsNo || "",
          name: drug.nomenclature || "",
          unit: drug.unitAuName || drug.dispUnitName || "",
          availableStock: drug.wardstocks || 0,
          storesStock: drug.storestocks || 0
        }))
        setItemOptions(drugs)
      }
    } catch (err) {
      setLoading(false)
      console.error("Error fetching drugs:", err)
    }
  }

  useEffect(() => {
    fetchIndents()
    fetchAllDrugs()
  }, [])

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

  // Handle drug selection from dropdown
  const handleDrugSelect = (index, drug) => {
    // Check if drug is already selected in another row
    const isDuplicate = selectedDrugs.some(id => id === drug.id && indentEntries[index]?.itemId !== drug.id);

    if (isDuplicate) {
      showPopup("This drug is already added in another row. Please select a different drug.", "warning");
      return;
    }

    const newEntries = [...indentEntries];

    // Update the selected row with drug information
    newEntries[index] = {
      ...newEntries[index],
      itemId: drug.id,
      itemCode: drug.code || "",
      itemName: drug.name || "",
      apu: drug.unit || "",
      availableStock: drug.availableStock || 0,
      storesStock: drug.storesStock || 0
    };

    setIndentEntries(newEntries);

    // Update selected drugs tracking
    const newSelectedDrugs = selectedDrugs.filter(id => id !== newEntries[index].itemId);
    newSelectedDrugs.push(drug.id);
    setSelectedDrugs(newSelectedDrugs);

    setActiveItemDropdown(null);
  };

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

  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    const status = e.target.value
    setStatusFilter(status)
    const backendStatus = status ? status.toUpperCase() : "";
    fetchIndents(backendStatus)
  }

  // Handle indent entry change
  const handleIndentEntryChange = (index, field, value) => {
    const updatedEntries = [...indentEntries]

    if (field === "itemName") {
      const displayValue = value;
      const drugName = extractDrugName(displayValue);
      
      const selectedItem = itemOptions.find((opt) => 
        opt.name.toLowerCase().includes(drugName.toLowerCase()) ||
        opt.code.toLowerCase().includes(drugName.toLowerCase())
      );
      
      updatedEntries[index] = {
        ...updatedEntries[index],
        itemId: selectedItem ? selectedItem.id : "",
        itemName: selectedItem ? selectedItem.name : drugName,
        itemCode: selectedItem ? selectedItem.code : "",
        apu: selectedItem ? selectedItem.unit : "",
        availableStock: selectedItem ? selectedItem.availableStock : "",
        storesStock: selectedItem ? selectedItem.storesStock : ""
      }
    } else {
      updatedEntries[index] = {
        ...updatedEntries[index],
        [field]: value,
      }
    }

    setIndentEntries(updatedEntries)
  }

  // Handle edit click
  const handleEditClick = (record, e) => {
    e.stopPropagation()

    console.log("Editing record:", record)
    setSelectedRecord(record)

    // Initialize entries from the items array in the record
    let entries = []

    if (record.items && Array.isArray(record.items) && record.items.length > 0) {
      console.log("Items found:", record.items)
      entries = record.items.map((item) => ({
        // Only use the actual indentTId from backend for existing items
        id: item.indentTId || null,
        itemId: item.itemId || "",
        itemCode: item.pvmsNo || "",
        itemName: item.itemName || "",
        apu: item.unitAuName || "",
        requestedQty: item.requestedQty || "",
        availableStock: item.availableStock || "",
        storesStock: item.storesStock || "",
        reasonForIndent: item.reason || "",
      }))

      // Update selected drugs tracking
      const drugIds = entries.filter(entry => entry.itemId).map(entry => entry.itemId)
      setSelectedDrugs(drugIds)
    } else {
      console.log("No items found, creating empty entry")
      // Create empty entry for new items WITHOUT any ID
      entries = [{
        id: null,
        itemId: "",
        itemCode: "",
        itemName: "",
        apu: "",
        requestedQty: "",
        availableStock: "",
        storesStock: "",
        reasonForIndent: "",
      }]
      setSelectedDrugs([])
    }

    console.log("Setting indent entries:", entries)
    setIndentEntries(entries)
    setDtRecord([])
    setCurrentView("detail")
  }

  // Handle back to list
  const handleBackToList = () => {
    setCurrentView("list")
    setSelectedRecord(null)
    setIndentEntries([])
    setSelectedDrugs([])
    setDtRecord([])
  }

  // Handle show all
  const handleShowAll = () => {
    setFromDate("")
    setToDate("")
    setStatusFilter("")
    fetchIndents()
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

      // Remove from selected drugs if it has an itemId
      if (entryToRemove.itemId) {
        setSelectedDrugs(selectedDrugs.filter(drugId => drugId !== entryToRemove.itemId))
      }

      // Only add to deletion list if it's an existing record with numeric ID
      if (entryToRemove.id && typeof entryToRemove.id === 'number') {
        setDtRecord((prev) => [...prev, entryToRemove.id])
      }

      const filteredEntries = indentEntries.filter((_, i) => i !== index)
      setIndentEntries(filteredEntries)
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

  // Handle save/submit
  const handleSubmit = async (status) => {
    // Check if we have at least one valid item
    const validItems = indentEntries.filter(entry =>
      entry.itemId && entry.itemName && entry.requestedQty && entry.requestedQty > 0
    )

    if (validItems.length === 0) {
      showPopup("Please add at least one item with requested quantity", "error")
      return
    }

    // Convert status to uppercase for backend
    const backendStatus = status.toUpperCase();


    const payload = {
      indentMId: selectedRecord?.indentMId || null,
      indentDate: selectedRecord?.indentDate || new Date().toISOString().slice(0, 19),
      toDeptId: selectedRecord?.toDeptId || null,
      status: backendStatus,
      deletedT: dtRecord.length > 0 ? dtRecord : [], // Always send as array, even if empty
      items: validItems.map((entry) => {
        const itemPayload = {
          itemId: Number(entry.itemId),
          requestedQty: entry.requestedQty ? Number(entry.requestedQty) : 0,
          reason: entry.reasonForIndent || "",
          availableStock: entry.availableStock ? Number(entry.availableStock) : 0,
        }

        // ONLY send indentTId if it exists and is a number (existing backend record)
        if (entry.id && typeof entry.id === 'number') {
          itemPayload.indentTId = entry.id
        }

        return itemPayload
      }),
    }

    console.log("Submitting payload:", JSON.stringify(payload, null, 2))

    try {
      setProcessing(true)

      const endpoint = backendStatus === "S" ? "save" : "submit"
      const response = await postRequest(`${Store_Internal_Indent}/${endpoint}`, payload)

      showPopup(`Indent ${backendStatus === 'S' ? 'saved' : 'submitted'} successfully!`, "success")
      handleBackToList()
      fetchIndents()
    } catch (error) {
      console.error("Error submitting indent:", error)
      showPopup(`Error ${backendStatus === 'S' ? 'saving' : 'submitting'} indent. Please try again.`, "error")
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

  // Pagination
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

  // Detail View
  if (currentView === "detail") {
    const statusInfo = getStatusInfo(selectedRecord?.status);
    const isRecordEditable = isEditable(selectedRecord);

    return (
      <div className="content-wrapper">
        {loading && <LoadingScreen/>}
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">INDENT VIEW / UPDATE</h4>
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
                    <label className="form-label fw-bold">Status</label>
                    <input
                      type="text"
                      className="form-control"
                      value={statusInfo.label}
                      style={{
                        backgroundColor: "#e9ecef",
                        fontWeight: "bold"
                      }}
                      readOnly
                    />
                  </div>
                </div>

                <div className="table-responsive" style={{ overflowX: "auto", maxWidth: "100%", overflowY: "visible" }}>
                  <table className="table table-bordered table-hover align-middle" >
                    <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
            <tr>
  <th
    className="text-center"
    style={{ width: "20px" }}
  >
    S.No.
  </th>

  <th style={{ width: "350px" }}>
    Item Name/Code
  </th>

  <th style={{ width: "35px" }}>
    A/U
  </th>

  <th
    style={{
      width: "35px",
      whiteSpace: "normal",
      lineHeight: "1.1",
      textAlign: "center"
    }}
  >
    Req <br /> Qty
  </th>

  <th
    style={{
      width: "20px",            // reduced from 25px → 20px
      whiteSpace: "normal",
      lineHeight: "1.1",
      textAlign: "center"
    }}
  >
    Avl <br /> Stk
  </th>

  <th style={{ width: "100px" }}>   {/* increased from 70px → 100px */}
    Reason for Indent
  </th>

  {isRecordEditable && (
    <>
      <th style={{ width: "60px" }}>Add</th>
      <th style={{ width: "70px" }}>Delete</th>
    </>
  )}
</tr>






                    </thead>
                    <tbody>
                      {indentEntries.length === 0 ? (
                        <tr>
                          <td colSpan={isRecordEditable ? 8 : 6} className="text-center text-muted">
                            No items found. {isRecordEditable && "Click 'Add' to add items."}
                          </td>
                        </tr>
                      ) : (
                        indentEntries.map((entry, index) => (
                          <tr key={entry.id || index}>
                            <td className="text-center fw-bold">{index + 1}</td>

                            <td style={{ position: "relative" }}>
                              <div className="dropdown-search-container position-relative">
                                <input
                                  ref={(el) => (itemInputRefs.current[index] = el)}
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={getDrugDisplayValue(entry.itemName, entry.itemCode)}
                                  onChange={(e) => {
                                    const displayValue = e.target.value;
                                    const drugName = extractDrugName(displayValue);
                                    handleIndentEntryChange(index, "itemName", displayValue);
                                    if (drugName.trim() !== "") {
                                      setActiveItemDropdown(index);
                                    } else {
                                      setActiveItemDropdown(null);
                                    }
                                  }}
                                  placeholder="Item Name/Code"
                                  style={{ minWidth: "320px" }}
                                  autoComplete="off"
                                  onFocus={(e) => handleDrugInputFocus(e, index)}
                                  readOnly={!isRecordEditable}
                                />
                                {/* Search Dropdown */}
                                {activeItemDropdown === index && 
                                 extractDrugName(getDrugDisplayValue(entry.itemName, entry.itemCode)).trim() !== "" && 
                                 isRecordEditable && (
                                  <ul
                                    className="list-group position-fixed dropdown-list"
                                    style={{
                                      top: `${dropdownPosition.y}px`,
                                      left: `${dropdownPosition.x}px`,
                                      width: `${dropdownPosition.width}px`,
                                      zIndex: 99999,
                                      backgroundColor: "#fff",
                                      border: "1px solid #ccc",
                                      borderRadius: "4px",
                                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                      maxHeight: "250px",
                                      overflowY: "auto",
                                    }}
                                  >
                                    {filterDrugsBySearch(extractDrugName(getDrugDisplayValue(entry.itemName, entry.itemCode))).length > 0 ? (
                                      filterDrugsBySearch(extractDrugName(getDrugDisplayValue(entry.itemName, entry.itemCode))).map((drug) => {
                                        const isSelectedInOtherRow = selectedDrugs.some(
                                          (id) => id === drug.id && indentEntries[index]?.itemId !== drug.id
                                        );
                                        return (
                                          <li
                                            key={drug.id}
                                            className="list-group-item list-group-item-action"
                                            style={{
                                              backgroundColor: isSelectedInOtherRow ? "#ffc107" : "#f8f9fa",
                                              cursor: isSelectedInOtherRow ? "not-allowed" : "pointer",
                                              padding: "8px 12px",
                                            }}
                                            onClick={() => {
                                              if (!isSelectedInOtherRow) handleDrugSelect(index, drug);
                                            }}
                                          >
                                            <div>
                                              <strong>{drug.name}</strong>
                                              <div
                                                style={{
                                                  color: "#6c757d",
                                                  fontSize: "0.8rem",
                                                  marginTop: "2px",
                                                  display: "flex",
                                                  justifyContent: "space-between",
                                                  alignItems: "center"
                                                }}
                                              >
                                                <div>
                                                  <span className="badge bg-info me-1" style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                                                    <i className="fas fa-hashtag me-1"></i>{drug.code}
                                                  </span>
                                                  <span className="badge bg-secondary" style={{ fontSize: "0.75rem" }}>
                                                    ID: {drug.id}
                                                  </span>
                                                </div>
                                                {isSelectedInOtherRow && (
                                                  <span className="text-success">
                                                    <i className="fas fa-check-circle me-1"></i> Added
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </li>
                                        );
                                      })
                                    ) : (
                                      <li className="list-group-item text-muted text-center">
                                        {itemOptions.length === 0 ? "No drugs available" : "No drugs found"}
                                      </li>
                                    )}
                                  </ul>
                                )}
                              </div>
                            </td>

                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={entry.apu}
                                onChange={(e) => handleIndentEntryChange(index, "apu", e.target.value)}
                                placeholder="Unit"
                                readOnly
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={entry.requestedQty}
                                onChange={(e) => handleIndentEntryChange(index, "requestedQty", e.target.value)}
                                placeholder="0"
                                min="0"
                                step="1"
                                readOnly={!isRecordEditable}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={entry.availableStock}
                                onChange={(e) => handleIndentEntryChange(index, "availableStock", e.target.value)}
                                placeholder="0"
                                min="0"
                                step="1"
                                style={{  backgroundColor: "#f5f5f5" }}
                                readOnly
                              />
                            </td>
                            <td>
                              <textarea
                                className="form-control form-control-sm"
                                value={entry.reasonForIndent}
                                onChange={(e) => handleIndentEntryChange(index, "reasonForIndent", e.target.value)}
                                placeholder="Reason"
                                readOnly={!isRecordEditable}
                              />
                            </td>
                            {/* Show Add/Delete only for editable records */}
                            {isRecordEditable && (
                              <>
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
                              </>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Action buttons based on editability */}
                {isRecordEditable ? (
                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleSubmit("s")}
                      disabled={processing}
                    >
                      {processing ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-warning"
                      onClick={() => handleSubmit("y")}
                      disabled={processing}
                    >
                      {processing ? "Submitting..." : "Submit"}
                    </button>
                    <button type="button" className="btn btn-danger" onClick={handleBackToList}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                      Print
                    </button>
                    <button type="button" className="btn btn-danger" onClick={handleBackToList}>
                      Close
                    </button>
                  </div>
                )}
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
              <h4 className="card-title p-2 mb-0">Indent List</h4>
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
                <div className="col-md-2">
                  <label className="form-label fw-bold">Status</label>
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={handleStatusFilterChange}
                  >
                    <option value="">All Status</option>
                    <option value="s">Draft</option>
                    <option value="y">Pending for Approval</option>
                  </select>
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
                <div className="col-md-4 d-flex justify-content-end align-items-end">
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
                      <th>Created By</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center">
                          {loading ? "Loading..." : "No records found."}
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((item) => {
                        const statusInfo = getStatusInfo(item.status);
                        return (
                          <tr key={item.indentMId} onClick={(e) => handleEditClick(item, e)} style={{ cursor: "pointer" }}>
                            <td>{formatDate(item.indentDate)}</td>
                            <td>{item.indentNo}</td>
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

export default IndentViewUpdate