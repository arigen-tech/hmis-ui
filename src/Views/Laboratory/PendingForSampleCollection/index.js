"use client"

import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"

const PendingSampleCollection = () => {
  const [sampleList, setSampleList] = useState([
    {
      id: 1,
      order_date: "15/07/2025",
      patient_name: "John Doe",
      mobile_no: "9876543210",
      age: 35,
      gender: "Male",
      department: "Cardiology",
    },
    {
      id: 2,
      order_date: "15/07/2025",
      patient_name: "Jane Smith",
      mobile_no: "9876543211",
      age: 28,
      gender: "Female",
      department: "Neurology",
    },
    {
      id: 3,
      order_date: "14/07/2025",
      patient_name: "Robert Johnson",
      mobile_no: "9876543212",
      age: 42,
      gender: "Male",
      department: "Orthopedics",
    },
    {
      id: 4,
      order_date: "14/07/2025",
      patient_name: "Emily Davis",
      mobile_no: "9876543213",
      age: 31,
      gender: "Female",
      department: "Dermatology",
    },
    {
      id: 5,
      order_date: "13/07/2025",
      patient_name: "Michael Wilson",
      mobile_no: "9876543214",
      age: 55,
      gender: "Male",
      department: "Gastroenterology",
    },
  ])

  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const itemsPerPage = 5

  const [searchParams, setSearchParams] = useState({
    patientName: "",
    mobileNo: "",
  })

  const [filteredSampleList, setFilteredSampleList] = useState(sampleList)

  const handleChangeSearch = (e) => {
    const { name, value } = e.target
    setSearchParams((prev) => ({ ...prev, [name]: value }))
  }

  const handleSearch = () => {
    let filtered = sampleList

    if (searchParams.patientName.trim() !== "") {
      filtered = filtered.filter((item) =>
        item.patient_name.toLowerCase().includes(searchParams.patientName.trim().toLowerCase()),
      )
    }

    if (searchParams.mobileNo.trim() !== "") {
      filtered = filtered.filter((item) => item.mobile_no.includes(searchParams.mobileNo.trim()))
    }

    setFilteredSampleList(filtered)
    setCurrentPage(1)
  }

  const handleShowAll = () => {
    setSearchParams({
      patientName: "",
      mobileNo: "",
    })
    setFilteredSampleList(sampleList)
    setCurrentPage(1)
  }

  // Keep filteredSampleList in sync if sampleList changes
  useEffect(() => {
    setFilteredSampleList(sampleList)
  }, [sampleList])

  const totalPages = Math.ceil(filteredSampleList.length / itemsPerPage)
  const currentItems = filteredSampleList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
      },
    })
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
            <div className="card-header" >
              <h4 className="card-title p-2 mb-0">Pending For Sample Collection and Validation</h4>
            </div>
            <div className="card-body">
              {/* Search Form */}
              <form
                className="mb-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSearch()
                }}
              >
                <div className="row g-3 align-items-end">
                  <div className="col-md-3">
                    <label className="form-label">Patient Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Patient Name"
                      name="patientName"
                      value={searchParams.patientName}
                      onChange={handleChangeSearch}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Mobile No</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Mobile No"
                      name="mobileNo"
                      value={searchParams.mobileNo}
                      onChange={handleChangeSearch}
                    />
                  </div>
                  <div className="col-md-3 d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-primary me-2"
                      onClick={handleSearch}
                    >
                      Search
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleShowAll}
                    >
                      Show All
                    </button>
                  </div>
                </div>
              </form>
              {/* End Search Form */}

              <div className="table-responsive packagelist">
                <table className="table table-bordered table-hover align-middle">
                  <thead >
                    <tr>
                      <th>Order Date</th>
                      <th>Patient Name</th>
                      <th>Mobile No</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.order_date}</td>
                        <td>{item.patient_name}</td>
                        <td>{item.mobile_no}</td>
                        <td>{item.age}</td>
                        <td>{item.gender}</td>
                        <td>{item.department}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <nav className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  <span>
                    Page {currentPage} of {totalPages} | Total Records: {filteredSampleList.length}
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
                    style={{ width: "120px" }}
                  />
                  <button type="button" className="btn btn-primary" onClick={handlePageNavigation}>
                    Go
                  </button>
                </div>
              </nav>

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

export default PendingSampleCollection
