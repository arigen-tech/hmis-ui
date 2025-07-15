import { useState, useRef, useEffect } from "react"
import Popup from "../../../Components/popup"

const DrugExpiry = () => {
  const [drugExpiryList, setDrugExpiryList] = useState([
    {
      id: 1,
      drug_code: "DRG001",
      drug_name: "Paracetamol 500mg",
      batch_no: "BATCH001",
      closing_stock: 150,
      expiry_date: "2025-12-31",
      au: "Strip",
      mmu: "Ambikapur-MMU01",
      from_date: "2024-01-01",
      to_date: "2025-12-31",
    },
    {
      id: 2,
      drug_code: "DRG002",
      drug_name: "Amoxicillin 250mg",
      batch_no: "BATCH002",
      closing_stock: 75,
      expiry_date: "2025-08-15",
      au: "Capsule",
      mmu: "Ambikapur-MMU02",
      from_date: "2024-01-01",
      to_date: "2025-12-31",
    },
    {
      id: 3,
      drug_code: "DRG003",
      drug_name: "Aspirin 75mg",
      batch_no: "BATCH003",
      closing_stock: 200,
      expiry_date: "2025-06-30",
      au: "Tablet",
      mmu: "Ambikapur-MMU01",
      from_date: "2024-01-01",
      to_date: "2025-12-31",
    },
    {
      id: 4,
      drug_code: "DRG004",
      drug_name: "Ibuprofen 400mg",
      batch_no: "BATCH004",
      closing_stock: 90,
      expiry_date: "2025-09-20",
      au: "Tablet",
      mmu: "Ambikapur-MMU02",
      from_date: "2024-01-01",
      to_date: "2025-12-31",
    },
    {
      id: 5,
      drug_code: "DRG005",
      drug_name: "Cough Syrup 100ml",
      batch_no: "BATCH005",
      closing_stock: 45,
      expiry_date: "2025-07-10",
      au: "Bottle",
      mmu: "Ambikapur-MMU01",
      from_date: "2024-01-01",
      to_date: "2025-12-31",
    },
  ])

  const drugMasterList = [
    { code: "DRG001", name: "Paracetamol 500mg" },
    { code: "DRG002", name: "Amoxicillin 250mg" },
    { code: "DRG003", name: "Aspirin 75mg" },
    { code: "DRG004", name: "Ibuprofen 400mg" },
    { code: "DRG005", name: "Cough Syrup 100ml" },
    { code: "DRG006", name: "Vitamin D3 1000IU" },
    { code: "DRG007", name: "Omeprazole 20mg" },
    { code: "DRG008", name: "Metformin 500mg" },
  ]

  const [searchFormData, setSearchFormData] = useState({
    drugCode: "",
    drugName: "",
    fromDate: "",
    toDate: "",
  })

  const [filteredResults, setFilteredResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const [showDrugDropdown, setShowDrugDropdown] = useState(false)
  const [drugSearchQuery, setDrugSearchQuery] = useState("")
  const drugDropdownRef = useRef(null)

  useEffect(() => {
    if (!showDrugDropdown) return;
    function handleClickOutside(event) {
      if (drugDropdownRef.current && !drugDropdownRef.current.contains(event.target)) {
        setShowDrugDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDrugDropdown]);

  const itemsPerPage = 5

  const filteredDrugList = drugMasterList.filter(
    (drug) =>
      drug.code.toLowerCase().includes(drugSearchQuery.toLowerCase()) ||
      drug.name.toLowerCase().includes(drugSearchQuery.toLowerCase()),
  )

  const handleSearchInputChange = (e) => {
    const { id, value } = e.target
    setSearchFormData((prevData) => ({ ...prevData, [id]: value }))
  }

  const handleDrugCodeSearch = (e) => {
    const value = e.target.value
    setDrugSearchQuery(value)
    setSearchFormData((prevData) => ({ ...prevData, drugCode: value }))
    setShowDrugDropdown(true)

    // Auto-populate drug name if exact match found
    const exactMatch = drugMasterList.find((drug) => drug.code.toLowerCase() === value.toLowerCase())
    if (exactMatch) {
      setSearchFormData((prevData) => ({ ...prevData, drugName: exactMatch.name }))
    }
  }

  const handleDrugSelection = (drug) => {
    setSearchFormData((prevData) => ({
      ...prevData,
      drugCode: drug.code,
      drugName: drug.name,
    }))
    setDrugSearchQuery(drug.code)
    setShowDrugDropdown(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()

    // Validate mandatory fields
    if (!searchFormData.drugCode || !searchFormData.fromDate || !searchFormData.toDate) {
      showPopup("Please fill all mandatory fields (Drug Code, From Date, To Date)", "error")
      return
    }

    // Filter results based on search criteria
    const results = drugExpiryList.filter((item) => {
      const matchesDrugCode =
        !searchFormData.drugCode || item.drug_code.toLowerCase().includes(searchFormData.drugCode.toLowerCase())
      const matchesDrugName =
        !searchFormData.drugName || item.drug_name.toLowerCase().includes(searchFormData.drugName.toLowerCase())

      const itemFromDate = new Date(item.from_date)
      const itemToDate = new Date(item.to_date)
      const searchFromDate = new Date(searchFormData.fromDate)
      const searchToDate = new Date(searchFormData.toDate)

      const matchesDateRange = itemFromDate <= searchToDate && itemToDate >= searchFromDate

      return matchesDrugCode && matchesDrugName && matchesDateRange
    })

    setFilteredResults(results)
    setShowResults(true)
    setCurrentPage(1)

    if (results.length === 0) {
      showPopup("No records found matching the search criteria", "info")
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

  const handlePrint = () => {
    window.print()
  }

  const filteredTotalPages = Math.ceil(filteredResults.length / itemsPerPage)
  const currentItems = filteredResults.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

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
              <h4 className="card-title p-2 mb-0">Drug Expiry</h4>
            </div>
            <div className="card-body">
              <form className="forms row" onSubmit={handleSearch}>
                <div className="row">
                  <div className="form-group col-md-4 mt-3">
                    <label>
                      From Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      id="fromDate"
                      onChange={handleSearchInputChange}
                      value={searchFormData.fromDate}
                      required
                    />
                  </div>
                  <div className="form-group col-md-4 mt-3">
                    <label>
                      To Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      id="toDate"
                      onChange={handleSearchInputChange}
                      value={searchFormData.toDate}
                      required
                    />
                  </div>
                  <div className="form-group col-md-4 mt-3 position-relative" ref={drugDropdownRef}>
                    <label>
                      Drug Code <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="drugCode"
                      placeholder="Search Drug Code"
                      onChange={handleDrugCodeSearch}
                      value={drugSearchQuery}
                      onFocus={() => setShowDrugDropdown(true)}
                      required
                    />
                    {showDrugDropdown && drugSearchQuery && filteredDrugList.length > 0 && (
                      <ul className="list-group position-absolute w-100 mt-1" style={{ zIndex: 1050, maxHeight: "250px", overflowY: "auto" }}>
                        {filteredDrugList.map((drug) => (
                          <li
                            key={drug.code}
                            className="list-group-item list-group-item-action"
                            onClick={() => handleDrugSelection(drug)}
                            style={{ cursor: "pointer" }}
                          >
                            <strong>{drug.code}</strong> - {drug.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="form-group col-md-4 mt-3">
                    <label>Drug Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="drugName"
                      placeholder="Drug Name"
                      onChange={handleSearchInputChange}
                      value={searchFormData.drugName}
                    />
                  </div>
                  <div className="form-group col-md-4 mt-3 d-flex align-items-end">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                    >
                      Search
                    </button>
                  </div>
                </div>
              </form>

              {showResults && (
                <>
                  {filteredResults.length === 0 ? (
                    <div className="mt-4">
                      <div className="alert alert-success" role="alert">
                        <strong>No Record Found</strong>
                      </div>
                      <div className="table-responsive">
                        <table className="table table-bordered table-hover align-middle">
                          <thead >
                            <tr>
                              <th>Drug Code</th>
                              <th>Drug Name</th>
                              <th>A/U</th>
                              <th>Batch No.</th>
                              <th>Closing Stock</th>
                              <th>Expiry Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td colSpan="6" className="text-center text-muted">
                                No Record Found
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <div className="table-responsive">
                        <table className="table table-bordered table-hover align-middle">
                          <thead >
                            <tr>
                              <th>Drug Code</th>
                              <th>Drug Name</th>
                              <th>A/U</th>
                              <th>Batch No.</th>
                              <th>Closing Stock</th>
                              <th>Expiry Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentItems.map((item) => (
                              <tr key={item.id}>
                                <td>{item.drug_code}</td>
                                <td>{item.drug_name}</td>
                                <td>{item.au}</td>
                                <td>{item.batch_no}</td>
                                <td>{item.closing_stock}</td>
                                <td>{new Date(item.expiry_date).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {filteredTotalPages > 1 && (
                        <nav className="d-flex justify-content-between align-items-center mt-3">
                          <div>
                            <span>
                              Page {currentPage} of {filteredTotalPages} | Total Records: {filteredResults.length}
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
                              overflow="auto"
                            />
                            <button className="btn btn-primary" onClick={handlePageNavigation}>
                              Go
                            </button>
                          </div>
                        </nav>
                      )}
                    </div>
                  )}

                  <div className="d-flex justify-content-end mt-3">
                    <button
                      type="button"
                      className="btn btn-primary "
                      onClick={handlePrint}
                      
                    >
                      Print
                    </button>
                  </div>
                </>
              )}

              {popupMessage && (
                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DrugExpiry
