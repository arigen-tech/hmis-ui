

import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import {MAS_FREQUENCY } from "../../../config/apiConfig"
import LoadingScreen from "../../../Components/Loading"
import { postRequest, putRequest, getRequest } from "../../../service/apiService"
import {
FETCH_FREQUENCY_ERR_MSG,DUPLICATE_FREQUENCY,UPDATE_FREQUENCY_SUCC_MSG,ADD_FREQUENCY_SUCC_MSG,
FAIL_TO_SAVE_CHANGES,FAIL_TO_UPDATE_STS
} from "../../../config/constants";

const FrequencyMaster = () => {
  const [frequencyData, setFrequencyData] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const itemsPerPage = 5
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, frequencyId: null, newStatus: false })
  const [popupMessage, setPopupMessage] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingFrequency, setEditingFrequency] = useState(null)
  const [isFormValid, setIsFormValid] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    frequency: "",
    frequencyName: "",
    orderNo: "",
  })
  const [loading, setLoading] = useState(true)

  const FREQUENCY_NAME_MAX_LENGTH = 30
  // const FREQUENCY_MAX_LENGTH = 10
  // const ORDER_NO_MAX_LENGTH = 5

  useEffect(() => {
    fetchFrequencyData(0)
  }, [])

  const fetchFrequencyData = async (flag = 0) => {
    try {
      setLoading(true)
      const response = await getRequest(`${MAS_FREQUENCY}/getAll/${flag}`)
      if (response && response.response) {
        const mappedData = response.response.map((item) => ({
          frequencyId: item.frequencyId,
          frequency: item.feq.toString(),
          frequencyName: item.frequencyName,
          orderNo: item.orderNo,
          status: item.status,
          lastChgBy: item.lastChgBy,
          lastChgDate: item.lastChgDate,
        }))
        setFrequencyData(mappedData)
      }
    } catch (err) {
      console.error("Error fetching frequency data:", err)
      showPopup(FETCH_FREQUENCY_ERR_MSG, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const filteredFrequencies = (frequencyData || []).filter(
    (frequency) =>
      frequency?.frequencyName?.toLowerCase().includes(searchQuery?.toLowerCase() || "") ||
      frequency?.frequency?.toLowerCase().includes(searchQuery?.toLowerCase() || ""),
  )

  const currentItems = filteredFrequencies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const filteredTotalPages = Math.ceil(filteredFrequencies.length / itemsPerPage)

  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
      setCurrentPage(pageNumber)
    } else {
      alert("Please enter a valid page number.")
    }
  }

  const handleEdit = (frequency) => {
    setEditingFrequency(frequency)
    setFormData({
      frequency: frequency.frequency,
      frequencyName: frequency.frequencyName,
      orderNo: frequency.orderNo.toString(),
    })
    setIsFormValid(true)
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!isFormValid) return

    try {
      setLoading(true)

      // Check for duplicate frequency name
      const isDuplicate = frequencyData.some(
        (frequency) =>
          frequency.frequencyName === formData.frequencyName &&
          (!editingFrequency || frequency.frequencyId !== editingFrequency.frequencyId),
      )

      if (isDuplicate && !editingFrequency) {
        showPopup(DUPLICATE_FREQUENCY, "error")
        setLoading(false)
        return
      }

      if (editingFrequency) {
        // Update existing frequency
        const response = await putRequest(`${MAS_FREQUENCY}/updateById/${editingFrequency.frequencyId}`, {
          feq: Number.parseFloat(formData.frequency),
          frequencyName: formData.frequencyName,
          orderNo: Number.parseInt(formData.orderNo),
          status: editingFrequency.status,
        })

        if (response && response.status === 200) {
          fetchFrequencyData()
          showPopup(UPDATE_FREQUENCY_SUCC_MSG, "success")
        }
      } else {
        // Add new frequency
        const response = await postRequest(`${MAS_FREQUENCY}/create`, {
          feq: Number.parseFloat(formData.frequency),
          frequencyName: formData.frequencyName,
          orderNo: Number.parseInt(formData.orderNo),
          status: "y",
        })

        if (response && response.status === 200) {
          fetchFrequencyData()
          showPopup(ADD_FREQUENCY_SUCC_MSG, "success")
        }
      }

      // Reset form and state
      setEditingFrequency(null)
      setFormData({ frequency: "", frequencyName: "", orderNo: "" })
      setShowForm(false)
    } catch (err) {
      console.error("Error saving frequency:", err)
      showPopup(FAIL_TO_SAVE_CHANGES, "error")
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
    setConfirmDialog({ isOpen: true, frequencyId: id, newStatus })
  }

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.frequencyId !== null) {
      try {
        setLoading(true)
        const response = await putRequest(
          `${MAS_FREQUENCY}/status/${confirmDialog.frequencyId}/${confirmDialog.newStatus}`,
        )
        if (response && response.response) {
          setFrequencyData((prevData) =>
            prevData.map((frequency) =>
              frequency.frequencyId === confirmDialog.frequencyId
                ? { ...frequency, status: confirmDialog.newStatus }
                : frequency,
            ),
          )
          showPopup(
            `Frequency ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
            "success",
          )
        }
      } catch (err) {
        console.error("Error updating frequency status:", err)
        showPopup(FAIL_TO_UPDATE_STS, "error")
      } finally {
        setLoading(false)
      }
    }
    setConfirmDialog({ isOpen: false, frequencyId: null, newStatus: null })
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData((prevData) => ({ ...prevData, [id]: value }))

    // Validate form
    const updatedFormData = { ...formData, [id]: value }
    setIsFormValid(
      updatedFormData.frequency.trim() !== "" &&
        updatedFormData.frequencyName.trim() !== "" &&
        updatedFormData.orderNo.trim() !== "",
    )
  }

  const handleRefresh = () => {
    setSearchQuery("")
    setCurrentPage(1)
    fetchFrequencyData()
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Frequency Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm ? (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search Frequencies"
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
                        <th>Frequency</th>
                        <th>Frequency Name</th>
                        <th>Order No</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((frequency) => (
                        <tr key={frequency.frequencyId}>
                          <td>{frequency.frequency}</td>
                          <td>{frequency.frequencyName}</td>
                          <td>{frequency.orderNo}</td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={frequency.status === "y"}
                                onChange={() =>
                                  handleSwitchChange(frequency.frequencyId, frequency.status === "y" ? "n" : "y")
                                }
                                id={`switch-${frequency.frequencyId}`}
                              />
                              <label className="form-check-label px-0" htmlFor={`switch-${frequency.frequencyId}`}>
                                {frequency.status === "y" ? "Active" : "Deactivated"}
                              </label>
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleEdit(frequency)}
                              disabled={frequency.status !== "y"}
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
                        Page {currentPage} of {filteredTotalPages} | Total Records: {filteredFrequencies.length}
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
                  <div className="form-group col-md-4">
                    <label>
                      Frequency <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control mt-1"
                      id="frequency"
                      placeholder="Frequency"
                      value={formData.frequency}
                      onChange={handleInputChange}
                      // maxLength={FREQUENCY_MAX_LENGTH}
                      required
                    />
                  </div>
                  <div className="form-group col-md-4">
                    <label>
                      Frequency Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="frequencyName"
                      placeholder="Frequency Name"
                      value={formData.frequencyName}
                      onChange={handleInputChange}
                      maxLength={FREQUENCY_NAME_MAX_LENGTH}
                      required
                    />
                  </div>
                  <div className="form-group col-md-4">
                    <label>
                      Order No <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control mt-1"
                      id="orderNo"
                      placeholder="Order No"
                      value={formData.orderNo}
                      onChange={handleInputChange}
                      // maxLength={ORDER_NO_MAX_LENGTH}
                      required
                    />
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
                          Frequency Reports
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
                            {
                              frequencyData.find((frequency) => frequency.frequencyId === confirmDialog.frequencyId)
                                ?.frequencyName
                            }
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

export default FrequencyMaster
