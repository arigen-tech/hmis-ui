import { useState, useRef } from "react"

const OpeningBalanceApproval = () => {
  const [currentView, setCurrentView] = useState("list") // "list" or "detail"
  const [selectedRecord, setSelectedRecord] = useState(null)

  const [approvalData, setApprovalData] = useState([
    {
      id: 1,
      balanceNo: "0000043025",
      balanceEntryNumber: "93847942700023",
      openingBalanceDate: "29/05/2025",
      department: "DISPENSARY",
      status: "Pending for Approval",
      submittedBy: "sumit",
    },

    {
      id: 2,
      balanceNo: "0000043027",
      balanceEntryNumber: "93847942700025",
      openingBalanceDate: "27/05/2025",
      department: "ICU",
      status: "Pending for Approval",
      submittedBy: "Rakesh",
    },
  ])

  const [fromDate, setFromDate] = useState("29/05/2025")
  const [toDate, setToDate] = useState("29/05/2025")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")

  // Detail form state with dummy data based on selected record
  const getDetailEntriesForRecord = (record) => {
    if (record?.status === "Pending for Approval") {
      return [
        {
          id: 1,
          sNo: 1,
          drugCode: "MED001",
          drugName: "Paracetamol 500mg",
          unit: "TAB",
          batchNo: "PCM2024001",
          dom: "15/01/2024",
          doe: "15/01/2026",
          qty: "100",
          unitRate: "2.50",
          amount: "250.00",
          medicineSource: "Local",
          manufacturer: "ABC Pharma",
        },

      ]
    }
    return [
      {
        id: 1,
        sNo: 1,
        drugCode: "",
        drugName: "",
        unit: "",
        batchNo: "",
        dom: "",
        doe: "",
        qty: "",
        unitRate: "",
        amount: "",
        medicineSource: "",
        manufacturer: "",
      },
    ]
  }

  const [detailEntries, setDetailEntries] = useState([])

  const itemsPerPage = 10
  const totalPages = Math.ceil(approvalData.length / itemsPerPage)
  const currentItems = approvalData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleRowClick = (record) => {
    setSelectedRecord(record)
    setDetailEntries(getDetailEntriesForRecord(record))
    setCurrentView("detail")
  }

  const handleBackToList = () => {
    setCurrentView("list")
    setSelectedRecord(null)
  }

  const handleSearch = () => {
    console.log("Searching from", fromDate, "to", toDate)
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

  const addNewEntry = () => {
    const newEntry = {
      id: detailEntries.length + 1,
      sNo: detailEntries.length + 1,
      drugCode: "",
      drugName: "",
      unit: "",
      batchNo: "",
      dom: "",
      doe: "",
      qty: "",
      unitRate: "",
      amount: "",
      medicineSource: "",
      manufacturer: "",
    }
    setDetailEntries([...detailEntries, newEntry])
  }

  const deleteEntry = (id) => {
    setDetailEntries(detailEntries.filter((entry) => entry.id !== id))
  }

  const updateEntry = (id, field, value) => {
    setDetailEntries(detailEntries.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)))
  }

  const handleSubmit = () => {
    console.log("Submitting entries:", detailEntries)
    alert("Entries submitted successfully!")
  }

  const handleReset = () => {
    setDetailEntries([
      {
        id: 1,
        sNo: 1,
        drugCode: "",
        drugName: "",
        unit: "",
        batchNo: "",
        dom: "",
        doe: "",
        qty: "",
        unitRate: "",
        amount: "",
        medicineSource: "",
        manufacturer: "",
      },
    ])
  }

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

  const drugCodeOptions = [
    { id: 1, code: "PCM001", name: "Paracetamol" },
    { id: 2, code: "PCM002", name: "Paracetamol 500mg" },
    { id: 3, code: "IBU001", name: "Ibuprofen" },
    { id: 4, code: "ASP001", name: "Aspirin" },
    { id: 5, code: "DOL001", name: "Dolo" },
  ];
  const manufacturerOptions = [
    "Cipla Ltd",
    "Sun Pharma",
    "Dr. Reddy's",
    "Lupin Limited",
    "Aurobindo Pharma",
    "Torrent Pharma",
    "Glenmark",
    "Alkem Labs",
  ];
  const brandNameOptions = [
    "Paracetamol Plus",
    "Crocin",
    "Dolo",
    "Metacin",
    "Pyrigesic",
    "Aspirin",
    "Brufen",
    "Combiflam",
    "Saridon",
    "Disprin",
  ];
  const dropdownClickedRef = useRef(false);
  const [activeDrugCodeDropdown, setActiveDrugCodeDropdown] = useState(null);
  const [activeDrugNameDropdown, setActiveDrugNameDropdown] = useState(null);

  if (currentView === "detail") {
    return (
      <div className="content-wrapper">
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              {/* Header Section */}
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">
                  Entry Details
                </h4>
                <button type="button" className="btn btn-secondary" onClick={handleBackToList}>
                  Back to List
                </button>
              </div>

              <div className="card-body">
                {/* Entry Details Header */}
                <div className="row mb-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Balance Entry Date</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.openingBalanceDate || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Balance Entry Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.balanceEntryNumber || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Entered By</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.submittedBy || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Department</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.department || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3 mt-3">
                    <button
                      className="btn btn-success">
                      Download Invoice

                    </button>

                  </div>
                </div>

                {/* Detail Table */}
                <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "auto" }}>
                  <table className="table table-bordered align-middle">
                    <thead style={{ backgroundColor: "#6c7b7f", color: "white" }}>
                      <tr>
                        <th className="text-center" style={{ width: "60px", minWidth: "60px" }}>
                          S.No.
                        </th>
                        <th style={{ width: "120px", minWidth: "120px" }}>Drug Code</th>
                        <th style={{ width: "200px", minWidth: "200px" }}>Drug Name</th>
                        <th style={{ width: "80px", minWidth: "80px" }}>Unit</th>
                        <th style={{ width: "150px", minWidth: "150px" }}>Batch No/ Serial No</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>DOM</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>DOE</th>
                        <th style={{ width: "80px", minWidth: "80px" }}>Qty</th>
                        <th style={{ width: "100px", minWidth: "100px" }}>Units Per Pack</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>Purchase Rate/Unit</th>
                        <th style={{ width: "100px", minWidth: "100px" }}>GST Percent</th>
                        <th style={{ width: "100px", minWidth: "100px" }}>MRP/Unit</th>
                        <th style={{ width: "100px", minWidth: "100px" }}>Total Cost</th>
                        <th style={{ width: "150px", minWidth: "150px" }}>Brand Name</th>
                        <th style={{ width: "150px", minWidth: "150px" }}>Manufacturer</th>
                        <th style={{ width: "60px", minWidth: "60px" }}>Add</th>
                        <th style={{ width: "70px", minWidth: "70px" }}>Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailEntries.map((entry, index) => (
                        <tr key={entry.id}>
                          <td className="text-center">
                            <input
                              type="text"
                              className="form-control text-center"
                              value={entry.sNo}
                              style={{ width: "50px" }}
                              readOnly
                            />
                          </td>
                          <td style={{ position: "relative" }}>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.drugCode}
                              onChange={(e) => {
                                updateEntry(entry.id, "drugCode", e.target.value);
                                if (e.target.value.length > 0) {
                                  setActiveDrugCodeDropdown(index);
                                } else {
                                  setActiveDrugCodeDropdown(null);
                                }
                              }}
                              style={{ width: "110px" }}
                              autoComplete="off"
                              onFocus={() => setActiveDrugCodeDropdown(index)}
                              onBlur={() => {
                                setTimeout(() => {
                                  if (!dropdownClickedRef.current) setActiveDrugCodeDropdown(null);
                                  dropdownClickedRef.current = false;
                                }, 150);
                              }}
                            />
                            {activeDrugCodeDropdown === index && (
                              <ul className="list-group position-absolute w-100 mt-1" style={{ zIndex: 1000, maxHeight: 180, overflowY: 'auto' }}>
                                {drugCodeOptions
                                  .filter((opt) =>
                                    entry.drugCode === "" ||
                                    opt.code.toLowerCase().includes(entry.drugCode.toLowerCase()) ||
                                    opt.name.toLowerCase().includes(entry.drugCode.toLowerCase())
                                  )
                                  .map((opt) => (
                                    <li
                                      key={opt.id}
                                      className="list-group-item list-group-item-action"
                                      style={{ cursor: 'pointer' }}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        dropdownClickedRef.current = true;
                                      }}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setDetailEntries(detailEntries.map((row, i) =>
                                          i === index ? { ...row, drugCode: opt.code, drugName: opt.name } : row
                                        ));
                                        setActiveDrugCodeDropdown(null);
                                        dropdownClickedRef.current = false;
                                      }}
                                    >
                                      {opt.code} - {opt.name}
                                    </li>
                                  ))}
                                {drugCodeOptions.filter((opt) =>
                                  entry.drugCode === "" ||
                                  opt.code.toLowerCase().includes(entry.drugCode.toLowerCase()) ||
                                  opt.name.toLowerCase().includes(entry.drugCode.toLowerCase())
                                ).length === 0 && entry.drugCode !== "" && (
                                  <li className="list-group-item text-muted">No matches found</li>
                                )}
                              </ul>
                            )}
                          </td>
                          <td style={{ position: "relative" }}>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.drugName}
                              onChange={(e) => {
                                updateEntry(entry.id, "drugName", e.target.value);
                                if (e.target.value.length > 0) {
                                  setActiveDrugNameDropdown(index);
                                } else {
                                  setActiveDrugNameDropdown(null);
                                }
                              }}
                              style={{ width: "190px" }}
                              autoComplete="off"
                              onFocus={() => setActiveDrugNameDropdown(index)}
                              onBlur={() => {
                                setTimeout(() => {
                                  if (!dropdownClickedRef.current) setActiveDrugNameDropdown(null);
                                  dropdownClickedRef.current = false;
                                }, 150);
                              }}
                            />
                            {activeDrugNameDropdown === index && (
                              <ul className="list-group position-absolute w-100 mt-1" style={{ zIndex: 1000, maxHeight: 180, overflowY: 'auto' }}>
                                {drugCodeOptions
                                  .filter((opt) =>
                                    entry.drugName === "" ||
                                    opt.name.toLowerCase().includes(entry.drugName.toLowerCase()) ||
                                    opt.code.toLowerCase().includes(entry.drugName.toLowerCase())
                                  )
                                  .map((opt) => (
                                    <li
                                      key={opt.id}
                                      className="list-group-item list-group-item-action"
                                      style={{ cursor: 'pointer' }}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        dropdownClickedRef.current = true;
                                      }}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setDetailEntries(detailEntries.map((row, i) =>
                                          i === index ? { ...row, drugCode: opt.code, drugName: opt.name } : row
                                        ));
                                        setActiveDrugNameDropdown(null);
                                        dropdownClickedRef.current = false;
                                      }}
                                    >
                                      {opt.name} - {opt.code}
                                    </li>
                                  ))}
                                {drugCodeOptions.filter((opt) =>
                                  entry.drugName === "" ||
                                  opt.name.toLowerCase().includes(entry.drugName.toLowerCase()) ||
                                  opt.code.toLowerCase().includes(entry.drugName.toLowerCase())
                                ).length === 0 && entry.drugName !== "" && (
                                  <li className="list-group-item text-muted">No matches found</li>
                                )}
                              </ul>
                            )}
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.unit}
                              onChange={(e) => updateEntry(entry.id, "unit", e.target.value)}
                              style={{ width: "70px" }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.batchNo}
                              onChange={(e) => updateEntry(entry.id, "batchNo", e.target.value)}
                              style={{ width: "140px" }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="DD/MM/YYYY"
                              value={entry.dom}
                              onChange={(e) => updateEntry(entry.id, "dom", e.target.value)}
                              style={{ width: "110px" }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="DD/MM/YYYY"
                              value={entry.doe}
                              onChange={(e) => updateEntry(entry.id, "doe", e.target.value)}
                              style={{ width: "110px" }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={entry.qty}
                              onChange={(e) => updateEntry(entry.id, "qty", e.target.value)}
                              style={{ width: "70px" }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={entry.unitsPerPack || ""}
                              onChange={(e) => updateEntry(entry.id, "unitsPerPack", e.target.value)}
                              style={{ width: "90px" }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={entry.purchaseRatePerUnit || ""}
                              onChange={(e) => updateEntry(entry.id, "purchaseRatePerUnit", e.target.value)}
                              style={{ width: "110px" }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={entry.gstPercent || ""}
                              onChange={(e) => updateEntry(entry.id, "gstPercent", e.target.value)}
                              style={{ width: "90px" }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={entry.mrpPerUnit || ""}
                              onChange={(e) => updateEntry(entry.id, "mrpPerUnit", e.target.value)}
                              style={{ width: "90px" }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.totalCost || ""}
                              readOnly
                              style={{ backgroundColor: "#f8f9fa", minWidth: "90px" }}
                            />
                          </td>
                          <td>
                            <select
                              className="form-select"
                              value={entry.brandName || ""}
                              onChange={(e) => updateEntry(entry.id, "brandName", e.target.value)}
                              style={{ minWidth: "130px" }}
                            >
                              <option value="">Select Brand</option>
                              {brandNameOptions.map((option, idx) => (
                                <option key={idx} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select
                              className="form-select"
                              value={entry.manufacturer || ""}
                              onChange={(e) => updateEntry(entry.id, "manufacturer", e.target.value)}
                              style={{ minWidth: "130px" }}
                            >
                              <option value="">Select</option>
                              {manufacturerOptions.map((option, idx) => (
                                <option key={idx} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm"
                              style={{ backgroundColor: "#e67e22", color: "white" }}
                              onClick={addNewEntry}
                            >
                              +
                            </button>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => deleteEntry(entry.id)}
                              disabled={detailEntries.length === 1}
                            >
                              -
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="row mb-3 mt-3">
                  <div className="col-md-4">
                    <label className="form-label fw-bold mb-1">Action</label>
                    <select className="form-select" onChange={(e) => console.log(e.target.value)}>
                      <option value="">Select Action</option>
                      <option value="Approve">Approve</option>
                      <option value="Reject">Reject</option>
                      <option value="Review">Review</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold mb-1">Remark</label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ height: "100px" }}  // Corrected to use an object
                      placeholder="Enter your remark here"
                      onChange={(e) => console.log(e.target.value)}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-flex justify-content-end mt-4">
                  <button
                    type="button"
                    className="btn me-2"
                    style={{ backgroundColor: "#e67e22", color: "white" }}
                    onClick={handleSubmit}
                  >
                    Submit
                  </button>
                  <button type="button" className="btn btn-danger" onClick={handleReset}>
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            {/* Header Section */}
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Opening Balance Approval List</h4>
            </div>

            <div className="card-body">
              {/* Date Filter Section */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <label className="form-label fw-bold">From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <button type="button" className="btn me-2 btn-success" onClick={handleSearch}>
                    Search
                  </button>
                </div>
                <div className="col-md-3 d-flex justify-content-end align-items-end">
                  <button type="button" className="btn btn-success" onClick={handleShowAll}>
                    Show All
                  </button>
                </div>
              </div>

              {/* Table Section */}
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead style={{ backgroundColor: "#95a5a6", color: "white" }}>
                    <tr>
                      <th>Balance No.</th>
                      <th>Opening Balance Date</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Submitted By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item) => (
                      <tr
                        key={item.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => handleRowClick(item)}
                        onMouseEnter={(e) => (e.target.closest("tr").style.backgroundColor = "#f8f9fa")}
                        onMouseLeave={(e) => (e.target.closest("tr").style.backgroundColor = "")}
                      >
                        <td>{item.balanceNo}</td>
                        <td>{item.openingBalanceDate}</td>
                        <td>{item.department}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: item.status === "Pending for Approval" ? "#ffc107" : "#28a745",
                              color: item.status === "Pending for Approval" ? "#000" : "#fff",
                            }}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td>{item.submittedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <nav className="d-flex justify-content-between align-items-center mt-2">
                <div>
                  <span>
                    Page {currentPage} of {totalPages} | Total Records: {approvalData.length}
                  </span>
                </div>
                <ul className="pagination mb-0">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      &laquo; Previous
                    </button>
                  </li>
                  {renderPagination()}
                  <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next &raquo;
                    </button>
                  </li>
                </ul>
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

export default OpeningBalanceApproval
