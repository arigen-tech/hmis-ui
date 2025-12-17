import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import LoadingScreen from "../../../Components/Loading"
import { postRequest, putRequest, getRequest } from "../../../service/apiService"
import { MAS_MAIN_CHARGE_CODE } from "../../../config/apiConfig"



const MainChargeCode = () => {
  const [mainChargeCodes, setMainChargeCodes] = useState([])
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, mainChargeId: null, newStatus: false })
  const [formData, setFormData] = useState({
    chargecodeCode: "",
    chargecodeName: "",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)
  const [editingMainCharge, setEditingMainCharge] = useState(null)
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const [loading, setLoading] = useState(true)
  const itemsPerPage = 5

  // API endpoints
  

  useEffect(() => {
    fetchMainChargeCodeData(0)
  }, [])

  const fetchMainChargeCodeData = async (flag = 0) => {
    try {
      setLoading(true)
      const response = await getRequest(`${MAS_MAIN_CHARGE_CODE}/getAll/${flag}`)
      
      if (response && response.response) {
        setMainChargeCodes(response.response)
      }
    } catch (err) {
      console.error("Error fetching main charge code data:", err)
      showPopup("Failed to load main charge code data", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }
  
  const filteredMainChargeCodes = Array.isArray(mainChargeCodes) ? mainChargeCodes.filter(
    (item) =>
      (item?.chargecodeCode?.toString().toLowerCase().includes(searchQuery.toLowerCase()) || 
       item?.chargecodeName?.toString().toLowerCase().includes(searchQuery.toLowerCase()))
  ) : []
  
  const filteredTotalPages = Math.ceil(filteredMainChargeCodes.length / itemsPerPage)

  const currentItems = filteredMainChargeCodes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleEdit = (item) => {
    setEditingMainCharge(item)
    setShowForm(true)
    setFormData({
      chargecodeCode: item.chargecodeCode,
      chargecodeName: item.chargecodeName,
    })
    setIsFormValid(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!isFormValid) return

    try {
      setLoading(true)

      // Check for duplicate main charge code
      const isDuplicate = mainChargeCodes.some(
        (code) =>
          code.chargecodeCode === formData.chargecodeCode &&
          (!editingMainCharge || code.chargecodeId !== editingMainCharge.chargecodeId)
      )

      if (isDuplicate && !editingMainCharge) {
        showPopup("Main charge code with the same code already exists!", "error")
        setLoading(false)
        return
      }

      if (editingMainCharge) {
        // Update existing main charge code
        const response = await putRequest(`${MAS_MAIN_CHARGE_CODE}/updateById/${editingMainCharge.chargecodeId}`, {
          chargecode_code: formData.chargecodeCode,
          chargecode_name: formData.chargecodeName,
          status: editingMainCharge.status,
        })

        if (response && response.status === 200) {
          fetchMainChargeCodeData()
          showPopup("Main charge code updated successfully!", "success")
        }
      } else {
        // Add new main charge code
        const response = await postRequest(`${MAS_MAIN_CHARGE_CODE}/create`, {
          chargecode_code: formData.chargecodeCode,
          chargecode_name: formData.chargecodeName,
          status: "y",
        })

        if (response && response.status === 200) {
          fetchMainChargeCodeData()
          showPopup("New main charge code added successfully!", "success")
        }
      }

      // Reset form and state
      setEditingMainCharge(null)
      setFormData({ chargecodeCode: "", chargecodeName: "" })
      setShowForm(false)
    } catch (err) {
      console.error("Error saving main charge code:", err)
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
    setConfirmDialog({ isOpen: true, mainChargeId: id, newStatus })
  }

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.mainChargeId !== null) {
      try {
        setLoading(true)
        const response = await putRequest(
          `${MAS_MAIN_CHARGE_CODE}/status/${confirmDialog.mainChargeId}?status=${confirmDialog.newStatus}`
        )
        if (response && response.response) {
          setMainChargeCodes((prevData) =>
            prevData.map((item) =>
              item.chargecodeId === confirmDialog.mainChargeId
                ? { ...item, status: confirmDialog.newStatus }
                : item
            )
          )
          showPopup(
            `Main charge code ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
            "success"
          )
        }
      } catch (err) {
        console.error("Error updating main charge code status:", err)
        showPopup(`Failed to update status: ${err.response?.data?.message || err.message}`, "error")
      } finally {
        setLoading(false)
      }
    }
    setConfirmDialog({ isOpen: false, mainChargeId: null, newStatus: null })
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData((prevData) => ({ ...prevData, [id]: value }))

    // Check if all required fields have values
    const updatedFormData = { ...formData, [id]: value }
    setIsFormValid(!!updatedFormData.chargecodeCode && !!updatedFormData.chargecodeName)
  }

  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
      setCurrentPage(pageNumber)
    } else {
      alert("Please enter a valid page number.")
    }
  }

  const handleRefresh = () => {
    setSearchQuery("")
    setCurrentPage(1)
    fetchMainChargeCodeData()
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
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">Main Charge Code</h4>

              <div className="d-flex justify-content-between align-items-center">
                {!showForm && (
                  <>
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
                    <button type="button" className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                      <i className="mdi mdi-plus"></i> Add
                    </button>
                    <button type="button" className="btn btn-success me-2" onClick={handleRefresh}>
                      <i className="mdi mdi-refresh"></i> Show All
                    </button>
                    {/* <button type="button" className="btn btn-success me-2">
                      <i className="mdi mdi-plus"></i> Generate Report
                    </button> */}
                  </>
                )}
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
                        <th>Main Charge Code</th>
                        <th>Main Charge Name</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((item) => (
                        <tr key={item.chargecodeId}>
                          <td>{item.chargecodeCode}</td>
                          <td>{item.chargecodeName}</td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={item.status === "y"}
                                onChange={() => handleSwitchChange(item.chargecodeId, item.status === "y" ? "n" : "y")}
                                id={`switch-${item.chargecodeId}`}
                              />
                              <label
                                className="form-check-label px-0"
                                htmlFor={`switch-${item.chargecodeId}`}
                              >
                                {item.status === "y" ? "Active" : "Deactivated"}
                              </label>
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleEdit(item)}
                              disabled={item.status !== "y"}
                            >
                              <i className="fa fa-pencil"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="d-flex justify-content-end">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                      <i className="mdi mdi-arrow-left"></i> Back
                    </button>
                  </div>
                  <div className="row">
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Main Charge Code <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="chargecodeCode"
                        placeholder="Main Charge Code"
                        onChange={handleInputChange}
                        value={formData.chargecodeCode}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Main Charge Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="chargecodeName"
                        placeholder="Main Charge Name"
                        onChange={handleInputChange}
                        value={formData.chargecodeName}
                        required
                      />
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
                            {mainChargeCodes.find((item) => item.chargecodeId === confirmDialog.mainChargeId)?.chargecodeName}
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

              {!showForm && (
                <nav className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    <span>
                      Page {currentPage} of {filteredTotalPages} | Total Records: {filteredMainChargeCodes.length}
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MainChargeCode