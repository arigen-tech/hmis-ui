import { useState, useRef, useEffect } from "react"
import ReactDOM from "react-dom"

const IndentViewUpdate = () => {
  const [currentView, setCurrentView] = useState("list")
  const [processing, setProcessing] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [itemOptions, setItemOptions] = useState([])
  const [dtRecord, setDtRecord] = useState([])
  const [indentEntries, setIndentEntries] = useState([
    {
      id: 1,
      itemCode: "",
      itemName: "",
      apu: "",
      requiredQty: "",
      availableStock: "",
      reasonForIndent: "",
    },
  ])
  const [popupMessage, setPopupMessage] = useState(null)
  const dropdownClickedRef = useRef(false)
  const [activeItemDropdown, setActiveItemDropdown] = useState(null)
  const itemInputRefs = useRef({})
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const [indentData, setIndentData] = useState([])
  const [filteredIndentData, setFilteredIndentData] = useState([])

  // Mock data
  const mockIndentData = [
    {
      indentId: 1,
      indentNo: "00195702025",
      indentDate: "2025-09-22",
      createdBy: "Rahul Dev",
      status: "p",
      items: [
        {
          id: 1,
          itemCode: "AMLO005",
          itemName: "Amlodipine 5mg Tablet",
          apu: "Unit",
          requiredQty: 15000,
          availableStock: 780,
          reasonForIndent: "Limited quantity",
        },
        {
          id: 2,
          itemCode: "AMOX030",
          itemName: "Amoxycillin Powder for Oral Suspension IP 125 mg/5 ml",
          apu: "BOTTLE",
          requiredQty: 200,
          availableStock: 0,
          reasonForIndent: "Insufficient",
        },
      ],
    },
    {
      indentId: 2,
      indentNo: "00031782023",
      indentDate: "2025-01-05",
      createdBy: "Rahul Dev",
      status: "s",
      items: [
        {
          id: 1,
          itemCode: "AMOX030",
          itemName: "Amoxycillin Powder for Oral Suspension IP 125 mg/5 ml",
          apu: "BOTTLE",
          requiredQty: 200,
          availableStock: 0,
          reasonForIndent: "Insufficient",
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

  const handleIndentEntryChange = (index, field, value) => {
    const updatedEntries = [...indentEntries]

    if (field === "itemName") {
      const selectedItem = itemOptions.find((opt) => opt.name === value)
      updatedEntries[index] = {
        ...updatedEntries[index],
        itemName: value,
        itemCode: selectedItem ? selectedItem.code : "",
      }
    } else {
      updatedEntries[index] = {
        ...updatedEntries[index],
        [field]: value,
      }
    }

    setIndentEntries(updatedEntries)
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
      requiredQty: entry.requiredQty,
      availableStock: entry.availableStock,
      reasonForIndent: entry.reasonForIndent,
    }))

    setIndentEntries(entries)
    setCurrentView("detail")
  }

  const handleBackToList = () => {
    setCurrentView("list")
    setSelectedRecord(null)
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

  const addNewRow = () => {
    const newEntry = {
      id: null,
      itemCode: "",
      itemName: "",
      apu: "",
      requiredQty: "",
      availableStock: "",
      reasonForIndent: "",
    }
    setIndentEntries([...indentEntries, newEntry])
  }

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

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
      },
    })
  }

  const handleSubmit = async (status) => {
    const hasEmptyRequiredFields = indentEntries.some(
      (entry) => !entry.itemCode || !entry.itemName || !entry.requiredQty,
    )

    if (hasEmptyRequiredFields) {
      showPopup("Please fill in all required fields (Item, Required Quantity)", "error")
      return
    }

    const payload = {
      id: selectedRecord.indentId,
      status: status,
      deletedT: Array.isArray(dtRecord) && dtRecord.length > 0 ? dtRecord : null,
      indentEntries: indentEntries
        .filter((entry) => entry.itemCode || entry.itemName)
        .map((entry) => ({
          id: entry.id,
          itemCode: entry.itemCode,
          itemName: entry.itemName,
          apu: entry.apu,
          requiredQty: entry.requiredQty ? Number(entry.requiredQty) : null,
          availableStock: entry.availableStock ? Number(entry.availableStock) : null,
          reasonForIndent: entry.reasonForIndent,
        })),
    }

    try {
      setProcessing(true)
      console.log("Payload to submit:", payload)
      showPopup("Indent submitted successfully!", "success")
      handleReset()
    } catch (error) {
      console.error("Error submitting indent:", error)
      showPopup("Error submitting indent. Please try again.", "error")
    } finally {
      setProcessing(false)
    }
  }

  const handleReset = () => {
    setIndentEntries([
      {
        id: 1,
        itemCode: "",
        itemName: "",
        apu: "",
        requiredQty: "",
        availableStock: "",
        reasonForIndent: "",
      },
    ])
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
    s: "Draft",
    p: "Pending for Approval",
    r: "Rejected",
    a: "Approved",
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
                      value={
                        selectedRecord?.indentDate
                          ? new Date(selectedRecord.indentDate).toLocaleDateString("en-GB")
                          : ""
                      }
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
                </div>

             
                <div className="table-responsive" style={{ overflowX: "auto", maxWidth: "100%", overflowY: "visible" }}>
                  <table className="table table-bordered table-hover align-middle" style={{ minWidth: "1200px" }}>
                    <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                      <tr>
                        <th className="text-center" style={{ width: "60px", minWidth: "60px" }}>
                          S.No.
                        </th>
                        <th style={{ width: "350px", minWidth: "350px" }}>Item Name/Code</th>
                        <th style={{ width: "100px", minWidth: "100px" }}>A/U</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>Required Quantity</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>Available Stock</th>
                        <th style={{ width: "200px", minWidth: "200px" }}>Reason for Indent</th>
                        {(selectedRecord?.status === "s" || selectedRecord?.status === "r") && (
                          <>
                            <th style={{ width: "60px", minWidth: "60px" }}>Add</th>
                            <th style={{ width: "70px", minWidth: "70px" }}>Delete</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {indentEntries.map((entry, index) => (
                        <tr key={entry.id || index}>
                          <td className="text-center fw-bold">{index + 1}</td>

                          <td style={{ position: "relative" }}>
                            <input
                              ref={(el) => (itemInputRefs.current[index] = el)}
                              type="text"
                              className="form-control form-control-sm"
                              value={entry.itemName}
                              onChange={(e) => {
                                const value = e.target.value
                                handleIndentEntryChange(index, "itemName", value)
                                if (value.length > 0) {
                                  setActiveItemDropdown(index)
                                } else {
                                  setActiveItemDropdown(null)
                                }
                              }}
                              placeholder="Item Name/Code"
                              style={{ minWidth: "320px" }}
                              autoComplete="off"
                              onFocus={() => setActiveItemDropdown(index)}
                              onBlur={() => {
                                setTimeout(() => {
                                  if (!dropdownClickedRef.current) {
                                    setActiveItemDropdown(null)
                                  }
                                  dropdownClickedRef.current = false
                                }, 150)
                              }}
                              readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                            />
                            {activeItemDropdown === index &&
                              (selectedRecord?.status === "s" || selectedRecord?.status === "r") &&
                              ReactDOM.createPortal(
                                <ul
                                  className="list-group position-fixed"
                                  style={{
                                    zIndex: 9999,
                                    maxHeight: 200,
                                    overflowY: "auto",
                                    width: "350px",
                                    top: `${itemInputRefs.current[index]?.getBoundingClientRect().bottom + window.scrollY}px`,
                                    left: `${itemInputRefs.current[index]?.getBoundingClientRect().left + window.scrollX}px`,
                                    backgroundColor: "white",
                                    border: "1px solid #dee2e6",
                                    borderRadius: "0.375rem",
                                    boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.15)",
                                  }}
                                >
                                  {itemOptions
                                    .filter(
                                      (opt) =>
                                        entry.itemName === "" ||
                                        opt.name.toLowerCase().includes(entry.itemName.toLowerCase()) ||
                                        opt.code.toLowerCase().includes(entry.itemName.toLowerCase()),
                                    )
                                    .map((opt) => (
                                      <li
                                        key={opt.id}
                                        className="list-group-item list-group-item-action"
                                        style={{ cursor: "pointer" }}
                                        onMouseDown={(e) => {
                                          e.preventDefault()
                                          dropdownClickedRef.current = true
                                        }}
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          handleIndentEntryChange(index, "itemName", opt.name)
                                          setActiveItemDropdown(null)
                                          dropdownClickedRef.current = false
                                        }}
                                      >
                                        {opt.code} - {opt.name}
                                      </li>
                                    ))}
                                  {itemOptions.filter(
                                    (opt) =>
                                      entry.itemName === "" ||
                                      opt.name.toLowerCase().includes(entry.itemName.toLowerCase()) ||
                                      opt.code.toLowerCase().includes(entry.itemName.toLowerCase()),
                                  ).length === 0 &&
                                    entry.itemName !== "" && (
                                      <li className="list-group-item text-muted">No matches found</li>
                                    )}
                                </ul>,
                                document.body,
                              )}
                          </td>

                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={entry.apu}
                              onChange={(e) => handleIndentEntryChange(index, "apu", e.target.value)}
                              placeholder="Unit"
                              style={{ minWidth: "90px" }}
                              readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={entry.requiredQty}
                              onChange={(e) => handleIndentEntryChange(index, "requiredQty", e.target.value)}
                              placeholder="0"
                              min="0"
                              step="1"
                              style={{ minWidth: "110px" }}
                              readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
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
                              style={{ minWidth: "110px" }}
                              readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                            />
                          </td>
                          <td>
                            <textarea
                              className="form-control form-control-sm"
                              value={entry.reasonForIndent}
                              onChange={(e) => handleIndentEntryChange(index, "reasonForIndent", e.target.value)}
                              placeholder="Reason"
                              style={{ minWidth: "180px", minHeight: "40px" }}
                              readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                            />
                          </td>
                          {(selectedRecord?.status === "s" || selectedRecord?.status === "r") && (
                            <>
                              <td className="text-center">
                                <button
                                  type="button"
                                  className="btn btn-success btn-sm"
                                  onClick={addNewRow}
                                  style={{
                                    color: "white",
                                    border: "none",
                                    width: "35px",
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
                                    width: "35px",
                                    height: "35px",
                                  }}
                                >
                                  −
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {(selectedRecord?.status === "s" || selectedRecord?.status === "r") && (
                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleSubmit("s")}
                      disabled={processing}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleSubmit("p")}
                      disabled={processing}
                    >
                      Submit
                    </button>
                    <button type="button" className="btn btn-danger" onClick={handleBackToList}>
                      Cancel
                    </button>
                  </div>
                )}

                {(selectedRecord?.status === "p" || selectedRecord?.status === "a") && (
                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button type="button" className="btn btn-primary" onClick={() => console.log("Print")}>
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
                          No records found.
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((item) => (
                        <tr key={item.indentId} onClick={(e) => handleEditClick(item, e)} style={{ cursor: "pointer" }}>
                          <td>{formatDate(item.indentDate)}</td>
                          <td>{item.indentNo}</td>
                          <td>{item.createdBy}</td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                backgroundColor:
                                  item.status === "p"
                                    ? "#ffc107"
                                    : item.status === "s"
                                      ? "#17a2b8"
                                      : item.status === "a"
                                        ? "#28a745"
                                        : "#dc3545",
                                color: item.status === "p" ? "#000" : "#fff",
                              }}
                            >
                              {statusMap[item.status] || item.status}
                            </span>
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

export default IndentViewUpdate
