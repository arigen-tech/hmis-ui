import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import LoadingScreen from "../../../Components/Loading"
import { postRequest, putRequest, getRequest } from "../../../service/apiService"
import { DG_UOM } from "../../../config/apiConfig"

const UOMMaster = () => {
  const [uomList, setUomList] = useState([])
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, uomId: null, newStatus: false })
  const [formData, setFormData] = useState({
    uomCode: "",
    uomName: "",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)
  const [editingUOM, setEditingUOM] = useState(null)
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const [loading, setLoading] = useState(true)
  const itemsPerPage = 5

  useEffect(() => {
    fetchUOMData(0)
  }, [])

  const fetchUOMData = async (flag = 0) => {
    try {
      setLoading(true)
      const response = await getRequest(`${DG_UOM}/getAll/${flag}`)
      
      if (response && response.response) {
        setUomList(response.response)
      }
    } catch (err) {
      console.error("Error fetching UOM data:", err)
      showPopup("Failed to load UOM data", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }
  
  const filteredUomList = Array.isArray(uomList) ? uomList.filter(
    (item) =>
      (item?.uomCode?.toString().toLowerCase().includes(searchQuery.toLowerCase()) || 
       item?.name?.toString().toLowerCase().includes(searchQuery.toLowerCase()))
  ) : []
  
  const filteredTotalPages = Math.ceil(filteredUomList.length / itemsPerPage)

  const currentItems = filteredUomList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleEdit = (item) => {
    setEditingUOM(item)
    setShowForm(true)
    setFormData({
      uomCode: item.uomCode,
      uomName: item.name,
    })
    setIsFormValid(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!isFormValid) return

    try {
      setLoading(true)

      // Check for duplicate UOM code
      const isDuplicate = uomList.some(
        (code) =>
          code.uomCode === formData.uomCode &&
          (!editingUOM || code.id !== editingUOM.id)
      )

      if (isDuplicate && !editingUOM) {
        showPopup("UOM with the same code already exists!", "error")
        setLoading(false)
        return
      }

      if (editingUOM) {
        // Update existing UOM
        const response = await putRequest(`${DG_UOM}/updateById/${editingUOM.id}`, {
          uomCode: formData.uomCode,
          name: formData.uomName,
          status: editingUOM.status,
        })

        if (response && response.status === 200) {
          fetchUOMData()
          showPopup("UOM updated successfully!", "success")
        }
      } else {
        // Add new UOM
        const response = await postRequest(`${DG_UOM}/create`, {
          uomCode: formData.uomCode,
          name: formData.uomName,
          status: "y",
        })

        if (response && response.status === 200) {
          fetchUOMData()
          showPopup("New UOM added successfully!", "success")
        }
      }

      // Reset form and state
      setEditingUOM(null)
      setFormData({ uomCode: "", uomName: "" })
      setShowForm(false)
    } catch (err) {
      console.error("Error saving UOM:", err)
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
    setConfirmDialog({ isOpen: true, uomId: id, newStatus })
  }

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.uomId !== null) {
      try {
        setLoading(true)
        const response = await putRequest(
          `${DG_UOM}/status/${confirmDialog.uomId}?status=${confirmDialog.newStatus}`
        )
        if (response && response.response) {
          setUomList((prevData) =>
            prevData.map((item) =>
              item.id === confirmDialog.uomId
                ? { ...item, status: confirmDialog.newStatus }
                : item
            )
          )
          showPopup(
            `UOM ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
            "success"
          )
        }
      } catch (err) {
        console.error("Error updating UOM status:", err)
        showPopup(`Failed to update status: ${err.response?.data?.message || err.message}`, "error")
      } finally {
        setLoading(false)
      }
    }
    setConfirmDialog({ isOpen: false, uomId: null, newStatus: null })
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData((prevData) => ({ ...prevData, [id]: value }))

    // Check if all required fields have values
    const updatedFormData = { ...formData, [id]: value }
    setIsFormValid(!!updatedFormData.uomCode && !!updatedFormData.uomName)
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
    fetchUOMData()
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
              <h4 className="card-title p-2">Unit Of Measurement Master</h4>

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
                    <button type="button" className="btn btn-success me-2">
                      <i className="mdi mdi-plus"></i> Generate Report
                    </button>
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
                        <th>UOM Code</th>
                        <th>UOM Name</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.uomCode}</td>
                          <td>{item.name}</td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={item.status === "y"}
                                onChange={() => handleSwitchChange(item.id, item.status === "y" ? "n" : "y")}
                                id={`switch-${item.id}`}
                              />
                              <label
                                className="form-check-label px-0"
                                htmlFor={`switch-${item.id}`}
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
                        UOM Code <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="uomCode"
                        placeholder="UOM Code"
                        onChange={handleInputChange}
                        value={formData.uomCode}
                        maxLength={7}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        UOM Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="uomName"
                        placeholder="UOM Name"
                        onChange={handleInputChange}
                        value={formData.uomName}
                        maxLength={30}
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
                            {uomList.find((item) => item.id === confirmDialog.uomId)?.name}
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
                      Page {currentPage} of {filteredTotalPages} | Total Records: {filteredUomList.length}
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

export default UOMMaster