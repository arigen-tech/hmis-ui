import { useState } from "react"
import Popup from "../../../Components/popup"

const StockStatusReport = () => {
  const [stockList, setStockList] = useState([
    {
      id: 1,
      drug_code: "D492",
      drug_name: "ORAL SUSPENSION 200 MG + 40 MG/5 ML",
      au: "BOTTLE",
      batch_no: "NOB23005ED",
      dom: "01/10/2023",
      doe: "02/10/2025",
      stock_qty: 12,
      medicine_source: "DGMSY",
      manufacturer: "Alkem",
    },
    {
      id: 2,
      drug_code: "D4",
      drug_name: "ACETYL SALICYLIC ACID (ASA) TABLET (ENTERIC COATED) 325 MG",
      au: "No.",
      batch_no: "04008214",
      dom: "14/09/2021",
      doe: "11/09/2025",
      stock_qty: 5,
      medicine_source: "DGMSY",
      manufacturer: "KNOLL HEALTHCARE PVT LTD",
    },
    {
      id: 3,
      drug_code: "D3",
      drug_name: "Acetyl salicylic acid (Aspirin) - 150 Tab. IP",
      au: "No.",
      batch_no: "04009820",
      dom: "01/08/2023",
      doe: "31/07/2025",
      stock_qty: 8640,
      medicine_source: "DGMSY",
      manufacturer: "Abott",
    },
    {
      id: 4,
      drug_code: "D2",
      drug_name: "Acetyl salicylic acid (Aspirin) - 75 Tab. IP",
      au: "No.",
      batch_no: "04009820",
      dom: "01/08/2023",
      doe: "31/07/2025",
      stock_qty: 6462,
      medicine_source: "DGMSY",
      manufacturer: "Abott",
    },
    {
      id: 5,
      drug_code: "D5",
      drug_name: "Active Charcoal Powder",
      au: "No.",
      batch_no: "ACT2023001",
      dom: "15/03/2023",
      doe: "14/03/2026",
      stock_qty: 103,
      medicine_source: "DGMSY",
      manufacturer: "Pharma Corp",
    },
    {
      id: 6,
      drug_code: "D13",
      drug_name: "Albendazole Suspension IP 200 mg / 5ml",
      au: "BOTTLE",
      batch_no: "ALB2023005",
      dom: "20/05/2023",
      doe: "19/05/2026",
      stock_qty: 9597,
      medicine_source: "DGMSY",
      manufacturer: "Sun Pharma",
    },
  ])

  const [filters, setFilters] = useState({
    class: "All",
    section: "All",
    drugCode: "",
    drugName: "",
  })

  const [reportType, setReportType] = useState("summary")
  const [searchQuery, setSearchQuery] = useState("")
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const itemsPerPage = 5
  const [reportGenerated, setReportGenerated] = useState(false);

  const handleFilterChange = (e) => {
    const { id, value } = e.target
    setFilters((prevFilters) => ({ ...prevFilters, [id]: value }))
    setCurrentPage(1)
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const filteredStockList = stockList.filter((item) => {
    const matchesSearch =
      item.drug_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.drug_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDrugCode =
      filters.drugCode === "" || item.drug_code.toLowerCase().includes(filters.drugCode.toLowerCase())

    const matchesDrugName =
      filters.drugName === "" || item.drug_name.toLowerCase().includes(filters.drugName.toLowerCase())

    // For now, class and section filters are just placeholders (no effect on data)
    const matchesClass = filters.class === "All" // or add logic if you have class info in data
    const matchesSection = filters.section === "All" // or add logic if you have section info in data

    return matchesSearch && matchesDrugCode && matchesDrugName && matchesClass && matchesSection
  })

  const filteredTotalPages = Math.ceil(filteredStockList.length / itemsPerPage)
  const currentItems = filteredStockList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
      },
    })
  }

  const handleGenerateReport = () => {
    setReportGenerated(true);
    showPopup("Report generated successfully!", "success")
  }

  const handlePrintReport = () => {
    window.print()
  }

  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
      setCurrentPage(pageNumber)
    } else {
      alert("Please enter a valid page number.")
    }
  }

  const renderPagination = () => {
    const pageNumbers = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(filteredTotalPages, startPage + maxVisiblePages - 1)

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

    if (endPage < filteredTotalPages) {
      if (endPage < filteredTotalPages - 1) pageNumbers.push("...")
      pageNumbers.push(filteredTotalPages)
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

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header" >
              <h4 className="card-title mb-0" >
                Stock Status Report
              </h4>
            </div>
            <div className="card-body">
              {/* Filters Section */}
              <div className="row mb-4">
                <div className="col-md-2">
                  <label className="form-label">Class</label>
                  <select className="form-select" id="class" value={filters.class} onChange={handleFilterChange}>
                    <option value="All">All</option>
                    <option value="Class A">Class A</option>
                    <option value="Class B">Class B</option>
                    <option value="Class C">Class C</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label">Section</label>
                  <select className="form-select" id="section" value={filters.section} onChange={handleFilterChange}>
                    <option value="All">All</option>
                    <option value="Section 1">Section 1</option>
                    <option value="Section 2">Section 2</option>
                    <option value="Section 3">Section 3</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Drug Code</label>
                  <input
                    type="text"
                    className="form-control"
                    id="drugCode"
                    placeholder="Enter Drug Code"
                    value={filters.drugCode}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Drug Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="drugName"
                    placeholder="Enter Drug Name"
                    value={filters.drugName}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>

              {/* Report Type Selection */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="reportType"
                      id="summary"
                      value="summary"
                      checked={reportType === "summary"}
                      onChange={(e) => {
                        setReportType(e.target.value);
                        setReportGenerated(false); // Reset report on type change
                      }}
                    />
                    <label className="form-check-label" htmlFor="summary">
                      Summary
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="reportType"
                      id="detail"
                      value="detail"
                      checked={reportType === "detail"}
                      onChange={(e) => {
                        setReportType(e.target.value);
                        setReportGenerated(false); // Reset report on type change
                      }}
                    />
                    <label className="form-check-label" htmlFor="detail">
                      Detail
                    </label>
                  </div>
                </div>
                <div className="col-md-6 d-flex justify-content-end align-items-end">
                  <button
                    type="button"
                    className="btn btn-success me-2"
                   
                    onClick={handleGenerateReport}
                  >
                    Generate Report
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handlePrintReport}
                  >
                    Print Report
                  </button>
                </div>
              </div>

              {/* Table Section */}
              {reportGenerated && (
                <div className="table-responsive packagelist">
                  {reportType === "summary" ? (
                    <table className="table table-bordered table-hover align-middle">
                      <thead style={{ backgroundColor: "#b0c4de" }}>
                        <tr>
                          <th>S.No.</th>
                          <th>Drug Code</th>
                          <th>Drug Name</th>
                          <th>A/U</th>
                          <th>Stock Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.map((item, index) => (
                          <tr key={item.id}>
                            <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                            <td>{item.drug_code}</td>
                            <td>{item.drug_name}</td>
                            <td>{item.au}</td>
                            <td>{item.stock_qty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table className="table table-bordered table-hover align-middle">
                      <thead style={{ backgroundColor: "#b0c4de" }}>
                        <tr>
                          <th>S.No.</th>
                          <th>Drug Code</th>
                          <th>Drug Name</th>
                          <th>A/U</th>
                          <th>Batch No.</th>
                          <th>DOM</th>
                          <th>DOE</th>
                          <th>Stock Qty</th>
                          <th>Medicine Source</th>
                          <th>Manufacturer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.map((item, index) => (
                          <tr key={item.id}>
                            <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                            <td>{item.drug_code}</td>
                            <td>{item.drug_name}</td>
                            <td>{item.au}</td>
                            <td>{item.batch_no}</td>
                            <td>{item.dom}</td>
                            <td>{item.doe}</td>
                            <td>{item.stock_qty}</td>
                            <td>{item.medicine_source}</td>
                            <td>{item.manufacturer}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Pagination */}
              <nav className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  <span>
                    Page {currentPage} of {filteredTotalPages} | Total Records: {filteredStockList.length}
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
                  <li className={`page-item ${currentPage === filteredTotalPages ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === filteredTotalPages}
                    >
                      Next &raquo;
                    </button>
                  </li>
                </ul>
                <div className="d-flex align-items-center">
                  <input
                    type="number"
                    min="1"
                    max={filteredTotalPages}
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

      {/* Popup Message */}
      {popupMessage && <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />}
    </div>
  )
}

export default StockStatusReport
