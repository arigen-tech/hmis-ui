"use client"

import { useEffect, useState } from "react";
import Popup from "../../../Components/popup";
import { GET_WAITING_LIST } from "../../../config/apiConfig";
import { getRequest } from "../../../service/apiService"; // You missed this import earlier

const OpdWaitingList = () => {
  const [visits, setVisits] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
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
