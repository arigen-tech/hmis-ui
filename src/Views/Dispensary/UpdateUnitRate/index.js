import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"

const UpdateUnitRate = () => {
  const [drugList, setDrugList] = useState([
    {
      id: 1,
      drug_name: "ORAL SUSPENSION 200 MG + 40 MG/5 ML",
      au: "BOTTLE",
      batch: "NOB23005ED",
      expiry_date: "02/10/2025",
      available_stock: 12,
      previous_unit_rate: 114.0,
      updated_unit_rate: 114.0,
    },
    {
      id: 2,
      drug_name: "ACETYL SALICYLIC ACID (ASA) TABLET (ENTERIC COATED) 325 MG",
      au: "No.",
      batch: "04008214",
      expiry_date: "11/09/2025",
      available_stock: 5,
      previous_unit_rate: 15.0,
      updated_unit_rate: 15.0,
    },
    {
      id: 3,
      drug_name: "Acetyl salicylic acid (Aspirin) - 150 Tab. IP",
      au: "No.",
      batch: "04010774",
      expiry_date: "31/08/2026",
      available_stock: 350,
      previous_unit_rate: 11.0,
      updated_unit_rate: 11.0,
    },
    {
      id: 4,
      drug_name: "Acetyl salicylic acid (Aspirin) - 150 Tab. IP",
      au: "No.",
      batch: "04010774",
      expiry_date: "31/08/2026",
      available_stock: 200,
      previous_unit_rate: 11.0,
      updated_unit_rate: 11.0,
    },
    {
      id: 5,
      drug_name: "Acetyl salicylic acid (Aspirin) - 150 Tab. IP",
      au: "No.",
      batch: "04010774",
      expiry_date: "31/08/2026",
      available_stock: 350,
      previous_unit_rate: 11.0,
      updated_unit_rate: 11.0,
    },
    {
      id: 6,
      drug_name: "Acetyl salicylic acid (Aspirin) - 150 Tab. IP",
      au: "No.",
      batch: "04010320",
      expiry_date: "28/02/2026",
      available_stock: 250,
      previous_unit_rate: 0.8,
      updated_unit_rate: 0.8,
    },
    {
      id: 7,
      drug_name: "Acetyl salicylic acid (Aspirin) - 150 Tab. IP",
      au: "No.",
      batch: "10197",
      expiry_date: "31/12/2025",
      available_stock: 42,
      previous_unit_rate: 0.8,
      updated_unit_rate: 0.8,
    },
    {
      id: 8,
      drug_name: "Acetyl salicylic acid (Aspirin) - 150 Tab. IP",
      au: "No.",
      batch: "04010692",
      expiry_date: "31/07/2026",
      available_stock: 126,
      previous_unit_rate: 1.1,
      updated_unit_rate: 1.1,
    },
  ])

  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const itemsPerPage = 10

  const [searchParams, setSearchParams] = useState({
    drugCode: "",
    drugName: "",
  })
  const [filteredDrugList, setFilteredDrugList] = useState(drugList)

  const handleChangeSearch = (e) => {
    const { name, value } = e.target
    setSearchParams((prev) => ({ ...prev, [name]: value }))
  }

  const handleSearch = () => {
    let filtered = drugList
    if (searchParams.drugCode.trim() !== "") {
      filtered = filtered.filter((item) =>
        item.batch.toLowerCase().includes(searchParams.drugCode.trim().toLowerCase())
      )
    }
    if (searchParams.drugName.trim() !== "") {
      filtered = filtered.filter((item) =>
        item.drug_name.toLowerCase().includes(searchParams.drugName.trim().toLowerCase())
      )
    }
    setFilteredDrugList(filtered)
    setCurrentPage(1)
  }

  

  // Keep filteredDrugList in sync if drugList changes
  useEffect(() => {
    setFilteredDrugList(drugList)
  }, [drugList])

  const totalPages = Math.ceil(filteredDrugList.length / itemsPerPage)
  const currentItems = filteredDrugList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
      },
    })
  }

  const handleUnitRateChange = (id, newRate) => {
    setDrugList(
      drugList.map((item) => (item.id === id ? { ...item, updated_unit_rate: Number.parseFloat(newRate) || 0 } : item)),
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    showPopup("Unit rates updated successfully!", "success")
  }

  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    } else {
      alert("Please enter a valid page number.")
    }
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

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Update Unit Rate</h4>
            </div>
            <div className="card-body">
              {/* Search Form */}
              <form className="mb-3" onSubmit={e => { e.preventDefault(); handleSearch(); }}>
                <div className="row g-3 align-items-end">
                  <div className="col-md-3">
                    <label className="form-label">Drug Code</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Drug Code"
                      name="drugCode"
                      value={searchParams.drugCode}
                      onChange={handleChangeSearch}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Drug Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Drug Name"
                      name="drugName"
                      value={searchParams.drugName}
                      onChange={handleChangeSearch}
                    />
                  </div>
                  <div className="col-md-3 d-flex gap-2">
                    <button type="button" className="btn btn-primary me-2" onClick={handleSearch}>
                      Search
                    </button>
                    
                  </div>
                </div>
              </form>
              {/* End Search Form */}
              <form onSubmit={handleSubmit}>
                <div className="table-responsive packagelist">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Drug Name</th>
                        <th>A/U</th>
                        <th>Batch</th>
                        <th>Expiry Date</th>
                        <th>Available Stock</th>
                        <th>Previous Unit Rate</th>
                        <th>Updated Unit Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.drug_name}</td>
                          <td>{item.au}</td>
                          <td>{item.batch}</td>
                          <td>{item.expiry_date}</td>
                          <td>{item.available_stock}</td>
                          <td>{item.previous_unit_rate.toFixed(2)}</td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              className="form-control"
                              value={item.updated_unit_rate}
                              onChange={(e) => handleUnitRateChange(item.id, e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="d-flex justify-content-end mt-3">
                  <button type="submit" className="btn btn-success">
                    Submit
                  </button>
                </div>
                </div>

                <nav className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    <span>
                      Page {currentPage} of {totalPages} | Total Records: {filteredDrugList.length}
                    </span>
                  </div>
                  <ul className="pagination mb-0">
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                      <button
                        type="button"
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
                        type="button"
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
                    />
                    <button type="button" className="btn btn-primary" onClick={handlePageNavigation}>
                      Go
                    </button>
                  </div>
                </nav>

                
              </form>

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

export default UpdateUnitRate
