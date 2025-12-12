"use client"

import { useEffect, useState } from "react"
import LoadingScreen from "../../../Components/Loading"

const ItemReceivingMainScreen = () => {
  // Mock list data (frontend only)
  const [indentData, setIndentData] = useState([])
  const [filteredIndentData, setFilteredIndentData] = useState([])
  const [currentView, setCurrentView] = useState("list")
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [receivingItems, setReceivingItems] = useState([])
  const [loading, setLoading] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const itemsPerPage = 10

  // Date filters (kept for UI completeness; no backend)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  // Seed mock data
  useEffect(() => {
    const mock = [
      {
        indentMId: 1,
        indentNo: "IND-001",
        indentDate: "2025-12-05T05:48:00",
        issueNo: "ISS-001",
        issueDate: "2025-12-10T17:19:00",
        items: [
          {
            id: 1,
            drugCode: "DRG-001",
            drugName: "Paracetamol 500mg",
            apu: "TAB",
            batchNo: "BAT-2025-001",
            dom: "2025-01-15",
            doe: "2027-01-15",
            qtyDemanded: 100,
            qtyIssued: 80,
            qtyReceived: 0,
            previousReceivedQty: 0,
          },
          {
            id: 2,
            drugCode: "DRG-002",
            drugName: "Amoxicillin 250mg",
            apu: "CAP",
            batchNo: "BAT-2025-002",
            dom: "2025-02-20",
            doe: "2027-02-20",
            qtyDemanded: 50,
            qtyIssued: 50,
            qtyReceived: 0,
            previousReceivedQty: 0,
          },
        ],
      },
      {
        indentMId: 2,
        indentNo: "IND-002",
        indentDate: "2025-12-06T10:30:00",
        issueNo: "ISS-002",
        issueDate: "2025-12-11T14:45:00",
        items: [
          {
            id: 3,
            drugCode: "DRG-003",
            drugName: "Ibuprofen 400mg",
            apu: "TAB",
            batchNo: "BAT-2025-003",
            dom: "2025-03-10",
            doe: "2027-03-10",
            qtyDemanded: 200,
            qtyIssued: 150,
            qtyReceived: 0,
            previousReceivedQty: 50,
          },
        ],
      },
    ]
    setIndentData(mock)
    setFilteredIndentData(mock)
  }, [])

  const formatDate = (value) => {
    if (!value) return ""
    const d = new Date(value)
    return d.toLocaleDateString("en-GB")
  }

  const formatDateTime = (value) => {
    if (!value) return ""
    const d = new Date(value)
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const handleSearch = () => {
    if (!fromDate || !toDate) {
      setFilteredIndentData(indentData)
      setCurrentPage(1)
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
    setCurrentPage(1)
  }

  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    const totalPages = Math.ceil(filteredIndentData.length / itemsPerPage)
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    } else {
      alert("Please enter a valid page number.")
    }
  }

  const handleRowClick = (record) => {
    setSelectedRecord(record)
    setReceivingItems(record.items || [])
    setCurrentView("detail")
  }

  const handleBack = () => {
    setCurrentView("list")
    setSelectedRecord(null)
    setReceivingItems([])
  }

  const handleQtyReceivedChange = (index, value) => {
    const updated = [...receivingItems]
    updated[index] = {
      ...updated[index],
      qtyReceived: value === "" ? "" : Number(value),
    }
    setReceivingItems(updated)
  }

  // Pagination slice
  const totalPages = Math.ceil(filteredIndentData.length / itemsPerPage) || 1
  const currentItems = filteredIndentData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Pagination renderer
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

    return pageNumbers.map((number, idx) => (
      <li key={idx} className={`page-item ${number === currentPage ? "active" : ""}`}>
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

  // Detail view
  if (currentView === "detail") {
    return (
      <div className="content-wrapper">
        {loading && <LoadingScreen />}
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0 fw-bold">Item Receiving</h4>
                <button type="button" className="btn btn-secondary" onClick={handleBack}>
                  Back
                </button>
              </div>
              <div className="card-body">
                {/* Header fields */}
                <div className="row mb-4">
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Indent No.</label>
                    <input type="text" className="form-control" value={selectedRecord?.indentNo || ""} readOnly style={{ backgroundColor: "#e9ecef" }} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Indent Date</label>
                    <input type="text" className="form-control" value={formatDateTime(selectedRecord?.indentDate)} readOnly style={{ backgroundColor: "#e9ecef" }} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Issue Date</label>
                    <input type="text" className="form-control" value={formatDateTime(selectedRecord?.issueDate)} readOnly style={{ backgroundColor: "#e9ecef" }} />
                  </div>
                  <div className="col-md-4 mt-2">
                    <label className="form-label fw-bold">Issue No.</label>
                    <input type="text" className="form-control" value={selectedRecord?.issueNo || ""} readOnly style={{ backgroundColor: "#e9ecef" }} />
                  </div>
                  <div className="col-md-4 mt-2">
                    <label className="form-label fw-bold">Receiving Date</label>
                    <input type="text" className="form-control" value={formatDateTime(new Date().toISOString())} readOnly style={{ backgroundColor: "#e9ecef" }} />
                  </div>
                </div>

                {/* Items table */}
                <div className="table-responsive">
                  <table className="table table-bordered table-hover align-middle text-center">
                    <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                      <tr>
                        <th style={{ width: "60px" }}>S.No.</th>
                        <th style={{ minWidth: "140px" }}>Drug Code</th>
                        <th style={{ minWidth: "240px" }}>Drug Name</th>
                        <th style={{ width: "80px" }}>A/U</th>
                        <th style={{ width: "140px" }}>Batch No.</th>
                        <th style={{ width: "120px" }}>DOM</th>
                        <th style={{ width: "120px" }}>DOE</th>
                        <th style={{ width: "120px" }}>Qty Demanded</th>
                        <th style={{ width: "120px" }}>Qty Issued</th>
                        <th style={{ width: "140px" }}>Qty Received</th>
                        <th style={{ width: "160px" }}>Previous Received Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receivingItems.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="fw-bold">{idx + 1}</td>
                          <td>{item.drugCode}</td>
                          <td className="text-start">{item.drugName}</td>
                          <td>{item.apu}</td>
                          <td>{item.batchNo}</td>
                          <td>{formatDate(item.dom)}</td>
                          <td>{formatDate(item.doe)}</td>
                          <td>{item.qtyDemanded}</td>
                          <td>{item.qtyIssued}</td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm text-center"
                              value={item.qtyReceived}
                              onChange={(e) => handleQtyReceivedChange(idx, e.target.value)}
                              min="0"
                              max={item.qtyIssued}
                            />
                          </td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                backgroundColor: item.previousReceivedQty > 0 ? "#d1ecf1" : "#f8f9fa",
                                color: item.previousReceivedQty > 0 ? "#0c5460" : "#6c757d",
                                padding: "6px 12px",
                                borderRadius: "4px",
                              }}
                            >
                              {item.previousReceivedQty}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button type="button" className="btn btn-primary">
                    Save Receiving
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleBack}>
                    Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className="content-wrapper">
      {loading && <LoadingScreen />}
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2 mb-0 fw-bold">Item Receiving Main Screen</h4>
              <div>
                <button type="button" className="btn btn-primary" onClick={handleShowAll}>
                  Show All
                </button>
              </div>
            </div>
            <div className="card-body">
              {/* Search Row */}
             

              {/* Table */}
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                    <tr>
                      <th>Indent No.</th>
                      <th>Indent Date</th>
                      <th>Indent Number</th>
                      <th>Issue Date</th>
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
                      currentItems.map((item) => (
                        <tr key={item.indentMId} onClick={() => handleRowClick(item)} style={{ cursor: "pointer" }}>
                          <td>{item.indentNo}</td>
                          <td>{formatDate(item.indentDate)}</td>
                          <td>{item.indentNo}</td>
                          <td>{formatDate(item.issueDate)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
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

export default ItemReceivingMainScreen