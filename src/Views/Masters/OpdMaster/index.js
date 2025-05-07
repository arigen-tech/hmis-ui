

import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import { GET_SESSION, OPD_SESSION } from "../../../config/apiConfig"
import LoadingScreen from "../../../Components/Loading"
import { postRequest, putRequest, getRequest } from "../../../service/apiService"

const OpdSessionMaster = () => {
  const [opdSessionData, setOpdSessionData] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const itemsPerPage = 5
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, sessionId: null, newStatus: false })
  const [popupMessage, setPopupMessage] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [isFormValid, setIsFormValid] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    sessionName: "",
    fromTime: "",
    endTime: "",
  })
  const [loading, setLoading] = useState(true)

  const SESSION_NAME_MAX_LENGTH = 255

  useEffect(() => {
    fetchOpdSessionData(0)
  }, [])

  const fetchOpdSessionData = async (flag = 0) => {
    try {
      setLoading(true)
      const response = await getRequest(`${GET_SESSION}${flag}`)
      if (response && response.response) {
        setOpdSessionData(response.response)
      }
    } catch (err) {
      console.error("Error fetching OPD session data:", err)
      showPopup("Failed to load OPD session data", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const filteredSessions = (opdSessionData || []).filter((session) =>
    session?.sessionName?.toLowerCase().includes(searchQuery?.toLowerCase() || ""),
  )

  const currentItems = filteredSessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const filteredTotalPages = Math.ceil(filteredSessions.length / itemsPerPage)

  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
      setCurrentPage(pageNumber)
    } else {
      alert("Please enter a valid page number.")
    }
  }

  const handleEdit = (session) => {
    setEditingSession(session)
    // Keep the full time format HH:MM:SS for editing
    setFormData({
      sessionName: session.sessionName,
      fromTime: session.fromTime,
      endTime: session.endTime,
    })
    setIsFormValid(true)
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!isFormValid) return

    try {
      setLoading(true)

      // Check for duplicate OPD session name
      const isDuplicate = opdSessionData.some(
        (session) =>
          session.sessionName === formData.sessionName && (!editingSession || session.id !== editingSession.id),
      )

      if (isDuplicate && !editingSession) {
        showPopup("OPD Session with the same name already exists!", "error")
        setLoading(false)
        return
      }

      // Validate time range
      if (formData.fromTime >= formData.endTime) {
        showPopup("End time must be after start time", "error")
        setLoading(false)
        return
      }

      if (editingSession) {
        // Update existing OPD session
        const response = await putRequest(`${OPD_SESSION}/update/${editingSession.id}`, {
          sessionName: formData.sessionName,
          fromTime: formData.fromTime,
          endTime: formData.endTime,
          status: editingSession.status,
        })

        if (response && response.status === 200) {
          fetchOpdSessionData()
          showPopup("OPD Session updated successfully!", "success")
        }
      } else {
        // Add new OPD session
        const response = await postRequest(`${OPD_SESSION}/add`, {
          sessionName: formData.sessionName,
          fromTime: formData.fromTime,
          endTime: formData.endTime,
          status: "y",
        })

        if (response && response.status === 200) {
          fetchOpdSessionData()
          showPopup("New OPD Session added successfully!", "success")
        }
      }

      // Reset form and state
      setEditingSession(null)
      setFormData({ sessionName: "", fromTime: "", endTime: "" })
      setShowForm(false)
    } catch (err) {
      console.error("Error saving OPD session:", err)
      showPopup(`Failed to save changes: ${err.response?.data?.message || err.message}`, "error")
    } finally {
      setLoading(false)
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

  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, sessionId: id, newStatus })
  }

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.sessionId !== null) {
      try {
        setLoading(true)
        const response = await putRequest(
          `${OPD_SESSION}/status/${confirmDialog.sessionId}?status=${confirmDialog.newStatus}`,
        )
        if (response && response.status === 200) {
          setOpdSessionData((prevData) =>
            prevData.map((session) =>
              session.id === confirmDialog.sessionId ? { ...session, status: confirmDialog.newStatus } : session,
            ),
          )
          showPopup(
            `OPD Session ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
            "success",
          )
        }
      } catch (err) {
        console.error("Error updating OPD session status:", err)
        showPopup(`Failed to update status: ${err.response?.data?.message || err.message}`, "error")
      } finally {
        setLoading(false)
      }
    }
    setConfirmDialog({ isOpen: false, sessionId: null, newStatus: null })
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData((prevData) => ({ ...prevData, [id]: value }))

    // Validate form
    const updatedFormData = { ...formData, [id]: value }
    setIsFormValid(
      updatedFormData.sessionName.trim() !== "" &&
        updatedFormData.fromTime.trim() !== "" &&
        updatedFormData.endTime.trim() !== "",
    )
  }

  const handleRefresh = () => {
    setSearchQuery("")
    setCurrentPage(1)
    fetchOpdSessionData()
  }

  // Format time for display (keep full HH:MM:SS format)
  const formatTime = (timeString) => {
    if (!timeString) return ""
    return timeString
  }

  // Function to convert time input to HH:MM:SS format
  const formatTimeInput = (timeInput) => {
    if (!timeInput) return ""
    
    if (timeInput.split(":").length === 3) return timeInput
    
    return timeInput + ":00"
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">OPD Session Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm ? (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search OPD Sessions"
                        aria-label="Search"
                        value={searchQuery}
                        onChange={handleSearchChange}
                      />
                      <span className="input-group-text" id="search-icon">
                        <i className="fa fa-search"></i>
                      </span>
                    </div>
                  </form>
                ) : (
                  <></>
                )}

                <div className="d-flex align-items-center">
                  {!showForm ? (
                    <>
                      <button type="button" className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                        <i className="mdi mdi-plus"></i> Add
                      </button>
                      <button type="button" className="btn btn-success me-2 flex-shrink-0" onClick={handleRefresh}>
                        <i className="mdi mdi-refresh"></i> Show All
                      </button>
                      <button type="button" className="btn btn-success me-2" onClick={() => setShowModal(true)}>
                        <i className="mdi mdi-plus"></i> Reports
                      </button>
                    </>
                  ) : (
                    <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                      <i className="mdi mdi-arrow-left"></i> Back
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <LoadingScreen />
              ) : !showForm ? (
                <div className="table-responsive packagelist">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Session Name</th>
                        <th>From Time</th>
                        <th>End Time</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((session) => (
                        <tr key={session.id}>
                          <td>{session.sessionName}</td>
                          <td>{formatTime(session.fromTime)}</td>
                          <td>{formatTime(session.endTime)}</td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={session.status === "y"}
                                onChange={() => handleSwitchChange(session.id, session.status === "y" ? "n" : "y")}
                                id={`switch-${session.id}`}
                              />
                              <label className="form-check-label px-0" htmlFor={`switch-${session.id}`}>
                                {session.status === "y" ? "Active" : "Deactivated"}
                              </label>
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleEdit(session)}
                              disabled={session.status !== "y"}
                            >
                              <i className="fa fa-pencil"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <nav className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                      <span>
                        Page {currentPage} of {filteredTotalPages} | Total Records: {filteredSessions.length}
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
                      {[...Array(filteredTotalPages)].map((_, index) => (
                        <li className={`page-item ${currentPage === index + 1 ? "active" : ""}`} key={index}>
                          <button className="page-link" onClick={() => setCurrentPage(index + 1)}>
                            {index + 1}
                          </button>
                        </li>
                      ))}
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
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="form-group col-md-12">
                    <label>
                      Session Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="sessionName"
                      placeholder="Session Name"
                      value={formData.sessionName}
                      onChange={handleInputChange}
                      maxLength={SESSION_NAME_MAX_LENGTH}
                      required
                    />
                  </div>
                  <div className="form-group col-md-6">
                    <label>
                      From Time <span className="text-danger">*</span>
                    </label>
                    <div className="input-group mt-1">
                      <input
                        type="time"
                        className="form-control"
                        id="fromTime"
                        value={formData.fromTime.substring(0, 5)} // Show only HH:MM in the input
                        onChange={(e) => {
                          const timeWithSeconds = formatTimeInput(e.target.value)
                          handleInputChange({
                            target: { id: "fromTime", value: timeWithSeconds },
                          })
                        }}
                        required
                        step="1" // Allow seconds input
                      />
                      <span className="input-group-text">
                        <small>{formData.fromTime}</small>
                      </span>
                    </div>
                  </div>
                  <div className="form-group col-md-6">
                    <label>
                      End Time <span className="text-danger">*</span>
                    </label>
                    <div className="input-group mt-1">
                      <input
                        type="time"
                        className="form-control"
                        id="endTime"
                        value={formData.endTime.substring(0, 5)} // Show only HH:MM in the input
                        onChange={(e) => {
                          const timeWithSeconds = formatTimeInput(e.target.value)
                          handleInputChange({
                            target: { id: "endTime", value: timeWithSeconds },
                          })
                        }}
                        required
                        step="1" // Allow seconds input
                      />
                      <span className="input-group-text">
                        <small>{formData.endTime}</small>
                      </span>
                    </div>
                  </div>
                  <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                    <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                      Save
                    </button>
                    <button type="button" className="btn btn-danger" onClick={() => setShowForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
              {showModal && (
                <div
                  className="modal fade show"
                  style={{ display: "block" }}
                  tabIndex="-1"
                  aria-labelledby="staticBackdropLabel"
                  aria-hidden="true"
                >
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h1 className="modal-title fs-5" id="staticBackdropLabel">
                          OPD Session Reports
                        </h1>
                        <button
                          type="button"
                          className="btn-close"
                          onClick={() => setShowModal(false)}
                          aria-label="Close"
                        ></button>
                      </div>
                      <div className="modal-body">
                        {/* Report content would go here */}
                        <p>Report options will be displayed here.</p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                          Close
                        </button>
                        <button type="button" className="btn btn-primary">
                          Generate Report
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {popupMessage && (
                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
              )}
              {confirmDialog.isOpen && (
                <div className="modal d-block" tabIndex="-1" role="dialog">
                  <div className="modal-dialog" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button type="button" className="close" onClick={() => handleConfirm(false)}>
                          <span>&times;</span>
                        </button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                          <strong>
                            {opdSessionData.find((session) => session.id === confirmDialog.sessionId)?.sessionName}
                          </strong>
                          ?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>
                          No
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>
                          Yes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OpdSessionMaster
