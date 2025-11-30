"use client"

import { useEffect, useState } from "react";
import Popup from "../../../Components/popup";
import { GET_WAITING_LIST } from "../../../config/apiConfig";
import { getRequest } from "../../../service/apiService"; // You missed this import earlier

const OpdWaitingList = () => {
  const [visits, setVisits] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const [popupMessage, setPopupMessage] = useState(null)
  const itemsPerPage = 5

  const setLoading = (b) => {}

  // Fetch waiting list from backend API
  async function fetchWaitingList() {
    try {
      const data = await getRequest(`${GET_WAITING_LIST}`)
      if (data.status === 200 && Array.isArray(data.response)) {
        console.log("Waiting List:", data.response)
        setVisits(data.response)
      } else {
        console.error("Unexpected API response format:", data)
      }
    } catch (error) {
      console.error("Error fetching waiting list:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWaitingList()
  }, [])

  // Search filter
  const filteredVisits = visits.filter((v) =>
    v.patient.patientFn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.patient.patientLn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.department.departmentName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredTotalPages = Math.ceil(filteredVisits.length / itemsPerPage)
  const currentItems = filteredVisits.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => setPopupMessage(null),
    })
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const handleClose = (patient) => {
    showPopup(`Patient ${patient.patient.patientFn} ${patient.patient.patientLn} has been closed.`, "info")
  }

  const handleRelease = (patient) => {
    showPopup(`Patient ${patient.patient.patientFn} ${patient.patient.patientLn} has been released.`, "success")
  }

  const handlePageNavigation = () => {
    const pageNumber = parseInt(pageInput, 10)
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
            <div className="card-header">
              <h4 className="card-title p-2">OPD Waiting List</h4>
              <div className="d-flex justify-content-end align-items-spacearound mt-3">
                <div className="d-flex align-items-center">
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={handleSearchChange}
                      />
                      <span className="input-group-text">
                        <i className="fa fa-search"></i>
                      </span>
                    </div>
                  </form>
                  <button type="button" className="btn btn-success me-2">
                    <i className="mdi mdi-plus"></i> Generate Report
                  </button>
                </div>
              </div>
            </div>

            <div className="card-body">
              <div className="table-responsive packagelist">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Patient Name</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>Department</th>
                      <th>Mobile No</th>
                      <th>Doctor Name</th>
                      <th>Time Slot</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((item) => (
                        <tr key={item.id}>
                          <td>{`${item.patient.patientFn} ${item.patient.patientMn || ""} ${item.patient.patientLn || ""}`}</td>
                          <td>{item.patient.patientAge}</td>
                          <td>{item.patient.patientGender.genderName}</td>
                          <td>{item.department.departmentName}</td>
                          <td>{item.patient.patientMobileNumber}</td>
                          <td>{`${item.doctor.employee.firstName} ${item.doctor.employee.middleName || ""} ${item.doctor.employee.lastName || ""}`}</td>
                          <td>{`${item.startTime?.substring(11, 16)} - ${item.endTime?.substring(11, 16)}`}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary me-2"
                              onClick={() => handleClose(item)}
                            >
                              Close
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={() => handleRelease(item)}
                            >
                              Release
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center">
                          No records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <nav className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  <span>
                    Page {currentPage} of {filteredTotalPages} | Total Records: {filteredVisits.length}
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
        <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
      )}
    </div>
  )
}

export default OpdWaitingList
