import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import { MAS_SUB_CHARGE_CODE, MAS_MAIN_CHARGE_CODE } from "../../../config/apiConfig"
import LoadingScreen from "../../../Components/Loading"
import { postRequest, putRequest, getRequest } from "../../../service/apiService"

const SubChargeCode = () => {
  const [subChargeCodes, setSubChargeCodes] = useState([])
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, subChargeId: null, newStatus: false })
  const [formData, setFormData] = useState({
    subChargeCode: "",
    subChargeName: "",
    mainChargeCode: "",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)
  const [editingSubCharge, setEditingSubCharge] = useState(null)
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const itemsPerPage = 5
  const [loading, setLoading] = useState(true)
  const [mainChargeCodes, setMainChargeCodes] = useState([])

  useEffect(() => {
    fetchSubChargeCodes(0)
    fetchMainChargeCodes(1)
  }, [])

  const fetchSubChargeCodes = async (flag = 0) => {
    try {
      setLoading(true)
      const response = await getRequest(`${MAS_SUB_CHARGE_CODE}/getAll/${flag}`)

      console.log("API Response:", response)

      if (response && response.status === 200) {
        const responseData = response.response || response.data || response

        console.log("Response data to map:", responseData)

        if (Array.isArray(responseData)) {
          const mappedData = responseData.map((item) => {
            console.log("Mapping item:", item) // Log each item
            return {
              id: item.subId,
              subChargeCode: item.subCode,
              subChargeName: item.subName,
              mainChargeCode: item.mainChargeId ? item.mainChargeId.toString() : "",
              status: item.status,
              lastChgBy: item.lastChgBy,
              lastChgDate: item.lastChgDate,
              lastChgTime: item.lastChgTime,
            }
          })
          setSubChargeCodes(mappedData)
        } else if (responseData && responseData.response && Array.isArray(responseData.response)) {
          const mappedData = responseData.response.map((item) => ({
            id: item.subId,
            subChargeCode: item.subCode,
            subChargeName: item.subName,
            mainChargeCode: item.mainChargeId,
            status: item.status,
            lastChgBy: item.lastChgBy,
            lastChgDate: item.lastChgDate,
            lastChgTime: item.lastChgTime,
          }))
          setSubChargeCodes(mappedData)
        } else {
          console.error("Unexpected response structure:", responseData)
          showPopup("Failed to parse response data", "error")
        }
      } else {
        console.error("Invalid response:", response)
        showPopup("Failed to load sub-charge codes", "error")
      }
    } catch (err) {
      console.error("Error fetching sub-charge codes:", err)
      showPopup(`Failed to load sub-charge codes: ${err.message}`, "error")
    } finally {
      setLoading(false)
    }
  }

  const fetchMainChargeCodes = async (flag = 1) => {
    try {
      setLoading(true)
      const response = await getRequest(`${MAS_MAIN_CHARGE_CODE}/getAll/${flag}`)
      if (response && response.data && response.data.response) {
        setMainChargeCodes(response.data.response)
      } else if (response && response.response) {
        setMainChargeCodes(response.response)
      }
    } catch (err) {
      console.error("Error fetching main charge codes:", err)
      showPopup("Failed to load main charge codes", "error")
    } finally {
      setLoading(false)
    }
  }
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const filteredSubChargeCodes = (subChargeCodes || []).filter(
    (item) =>
      item.subChargeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subChargeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mainChargeCode.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleEdit = (item) => {
    setEditingSubCharge(item)
    setShowForm(true)
    setFormData({
      subChargeCode: item.subChargeCode,
      subChargeName: item.subChargeName,
      mainChargeCode: item.mainChargeCode,
    })
    setIsFormValid(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!isFormValid) return

    try {
      setLoading(true)

      // Check for duplicates
      const isDuplicate = subChargeCodes.some(
        (code) =>
          code.subChargeCode.toLowerCase() === formData.subChargeCode.toLowerCase() &&
          (!editingSubCharge || code.id !== editingSubCharge.id),
      )

      if (isDuplicate) {
        showPopup("A sub charge code with this code already exists!", "error")
        setLoading(false)
        return
      }

      if (editingSubCharge) {
        const response = await putRequest(`${MAS_SUB_CHARGE_CODE}/updateById/${editingSubCharge.id}`, {
          subCode: formData.subChargeCode,
          subName: formData.subChargeName,
          mainChargeId: formData.mainChargeCode,
        })

        if (response && response.status === 200) {
          fetchSubChargeCodes()
          showPopup("Sub charge code updated successfully!", "success")
        }
      } else {
        const response = await postRequest(`${MAS_SUB_CHARGE_CODE}/create`, {
          subCode: formData.subChargeCode,
          subName: formData.subChargeName,
          mainChargeId: formData.mainChargeCode,
        })

        if (response && response.status === 200) {
          fetchSubChargeCodes()
          showPopup("New sub charge code added successfully!", "success")
        }
      }

      setEditingSubCharge(null)
      setFormData({ subChargeCode: "", subChargeName: "", mainChargeCode: "" })
      setShowForm(false)
    } catch (err) {
      console.error("Error saving sub-charge code:", err)
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
    setConfirmDialog({ isOpen: true, subChargeId: id, newStatus })
  }

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.subChargeId !== null) {
      console.log("here2")

      try {
        setLoading(true)
        const response = await putRequest(
          `${MAS_SUB_CHARGE_CODE}/status/${confirmDialog.subChargeId}?status=${confirmDialog.newStatus}`,
          {},
        )

        if (response && response.status === 200) {
          setSubChargeCodes((prevData) =>
            prevData.map((item) =>
              item.id === confirmDialog.subChargeId ? { ...item, status: confirmDialog.newStatus } : item,
            ),
          )
          showPopup(
            `Sub charge code ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
            "success",
          )
        }
      } catch (err) {
        console.error("Error updating sub-charge code status:", err)
        showPopup(`Failed to update status: ${err.response?.data?.message || err.message}`, "error")
      } finally {
        setLoading(false)
      }
    }
    setConfirmDialog({ isOpen: false, subChargeId: null, newStatus: null })
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData((prevData) => ({ ...prevData, [id]: value }))

    const updatedFormData = { ...formData, [id]: value }
    setIsFormValid(
      !!updatedFormData.subChargeCode && !!updatedFormData.subChargeName && !!updatedFormData.mainChargeCode,
    )
  }

  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    if (pageNumber > 0 && pageNumber <= filteredSubChargeCodes.length) {
      setCurrentPage(pageNumber)
    } else {
      alert("Please enter a valid page number.")
    }
  }

  const renderPagination = () => {
    const pageNumbers = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(filteredSubChargeCodes.length, startPage + maxVisiblePages - 1)

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

    if (endPage < filteredSubChargeCodes.length) {
      if (endPage < filteredSubChargeCodes.length - 1) pageNumbers.push("...")
      pageNumbers.push(filteredSubChargeCodes.length)
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

  const filteredTotalPages = Math.ceil(filteredSubChargeCodes.length / itemsPerPage)

  const currentItems = filteredSubChargeCodes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">Sub Charge Code</h4>

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
                        <th>Sub Charge Code</th>
                        <th>Sub Charge Name</th>
                        <th>Main Charge Code</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.subChargeCode}</td>
                          <td>{item.subChargeName}</td>
                          <td>{item.mainChargeCode}</td>
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
                                onClick={() => handleSwitchChange(item.id, item.status === "y" ? "n" : "y")}
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
                        Sub Charge Code <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="subChargeCode"
                        placeholder="Sub Charge Code"
                        onChange={handleInputChange}
                        value={formData.subChargeCode}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Sub Charge Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="subChargeName"
                        placeholder="Sub Charge Name"
                        onChange={handleInputChange}
                        value={formData.subChargeName}
                        required
                      />
                    </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Main Charge Code <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-control"
                        id="mainChargeCode"
                        value={formData.mainChargeCode}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="" disabled>
                          Select Main Charge Code
                        </option>
                        {mainChargeCodes && mainChargeCodes.length > 0 ? (
                          mainChargeCodes.map((code) => (
                            <option key={code.chargecodeId} value={code.chargecodeId}>
                              {code.chargecodeName}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>
                            No main charge codes available
                          </option>
                        )}
                      </select>
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
                            {subChargeCodes.find((item) => item.id === confirmDialog.subChargeId)?.subChargeName}
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
                      Page {currentPage} of {filteredTotalPages} | Total Records: {filteredSubChargeCodes.length}
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

export default SubChargeCode
