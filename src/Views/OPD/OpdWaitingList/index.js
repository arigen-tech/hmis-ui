"use client"

import { useEffect, useState } from "react"
import Popup from "../../../Components/popup"

const OpdWaitingList = () => {
  const setLoading = (b) => {}

  // Mock data to replace API calls
  const mockVisits = [
    {
      id: 1,
      patient: {
        id: 1,
        patientFn: "John",
        patientMn: "Michael",
        patientLn: "Doe",
        patientAge: 35,
        patientGender: { genderName: "Male" },
        patientMobileNumber: "9876543210",
      },
      department: {
        id: 1,
        departmentName: "Cardiology",
      },
      typeOfPatient: "OPD",
      doctor: {
        userId: 1,
        employee: {
          firstName: "Dr. Sarah",
          middleName: "Jane",
          lastName: "Smith",
        },
      },
      visitDate: "2024-01-15",
      startTime: "2024-01-15T09:00:00",
      endTime: "2024-01-15T09:30:00",
    },
    {
      id: 2,
      patient: {
        id: 2,
        patientFn: "Jane",
        patientMn: null,
        patientLn: "Wilson",
        patientAge: 28,
        patientGender: { genderName: "Female" },
        patientMobileNumber: "9876543211",
      },
      department: {
        id: 2,
        departmentName: "Neurology",
      },
      typeOfPatient: "Emergency",
      doctor: {
        userId: 2,
        employee: {
          firstName: "Dr. Robert",
          middleName: null,
          lastName: "Johnson",
        },
      },
      visitDate: "2024-01-15",
      startTime: "2024-01-15T10:00:00",
      endTime: "2024-01-15T10:30:00",
    },
    {
      id: 3,
      patient: {
        id: 3,
        patientFn: "Mike",
        patientMn: "David",
        patientLn: "Brown",
        patientAge: 42,
        patientGender: { genderName: "Male" },
        patientMobileNumber: "9876543212",
      },
      department: {
        id: 3,
        departmentName: "Orthopedics",
      },
      typeOfPatient: "OPD",
      doctor: {
        userId: 3,
        employee: {
          firstName: "Dr. Emily",
          middleName: "Rose",
          lastName: "Davis",
        },
      },
      visitDate: "2024-01-15",
      startTime: "2024-01-15T11:00:00",
      endTime: "2024-01-15T11:30:00",
    },
    {
      id: 4,
      patient: {
        id: 4,
        patientFn: "Lisa",
        patientMn: null,
        patientLn: "Anderson",
        patientAge: 31,
        patientGender: { genderName: "Female" },
        patientMobileNumber: "9876543213",
      },
      department: {
        id: 4,
        departmentName: "Dermatology",
      },
      typeOfPatient: "OPD",
      doctor: {
        userId: 4,
        employee: {
          firstName: "Dr. Mark",
          middleName: "Anthony",
          lastName: "Taylor",
        },
      },
      visitDate: "2024-01-15",
      startTime: "2024-01-15T14:00:00",
      endTime: "2024-01-15T14:30:00",
    },
  ]

  async function fetchPendingPreconsultation() {
    try {
      // Simulate API call with mock data
      setVisits(mockVisits)
    } catch (error) {
      console.error("Error fetching Department data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Fetching gender data (simulated API response)
    fetchPendingPreconsultation()
  }, [])

  const [visits, setVisits] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const itemsPerPage = 3
  const [popupMessage, setPopupMessage] = useState(null)

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
      },
    })
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const filteredTotalPages = Math.ceil(visits.length / itemsPerPage)
  const currentItems = visits.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleClose = (patient) => {
    showPopup(`Patient ${patient.patient.patientFn} ${patient.patient.patientLn} has been closed.`, "info")
  }

  const handleRelease = (patient) => {
    showPopup(`Patient ${patient.patient.patientFn} ${patient.patient.patientLn} has been released.`, "success")
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
            <div className="card-header ">
              <h4 className="card-title p-2">OPD Pre-consultation</h4>
              <div className="d-flex justify-content-end align-items-spacearound mt-3">
                <div className="d-flex align-items-center">
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search"
                        aria-label="Search"
                        value={searchQuery}
                        onChange={handleSearchChange}
                      />
                      <span className="input-group-text" id="search-icon">
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
                    {visits.map((item) => (
                      <tr key={item.id}>
                        <td>{`${item.patient.patientFn} ${item.patient.patientMn != null ? item.patient.patientMn : ""} ${item.patient.patientLn != null ? item.patient.patientLn : ""}`}</td>
                        <td>{item.patient.patientAge}</td>
                        <td>{item.patient.patientGender.genderName}</td>
                        <td>{item.department.departmentName}</td>
                        <td>{item.patient.patientMobileNumber}</td>
                        <td>{`${item.doctor.employee.firstName} ${item.doctor.employee.middleName != null ? item.doctor.employee.middleName : ""} ${item.doctor.employee.lastName != null ? item.doctor.employee.middleName : ""}`}</td>
                        <td>{`${item.startTime.substring(11, 16)} - ${item.endTime.substring(11, 16)}`}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary me-2"
                            onClick={() => handleClose(item)}
                          >
                            Close
                          </button>
                          <button type="button" className="btn btn-sm btn-primary" onClick={() => handleRelease(item)}>
                            Release
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <nav className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  <span>
                    Page {currentPage} of {filteredTotalPages} | Total Records: {visits.length}
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
      {popupMessage && <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />}
    </div>
  )
}

export default OpdWaitingList
