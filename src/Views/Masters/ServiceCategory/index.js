import { useState } from "react"
import Popup from "../../../Components/popup"

const ServiceCategoryMaster = () => {
  const [serviceList, setServiceList] = useState([
    {
      id: 1,
      service_cat_name: "OPD Consultation",
      sac_code: "SAAC001",
      status: "y",
      gst_applicable: "y",
    },
    {
      id: 2,
      service_cat_name: "Lab Investigation",
      sac_code: "SAAC002",
      status: "y",
      gst_applicable: "y",
    },
    {
      id: 3,
      service_cat_name: "Radiology Investigation",
      sac_code: "SAAC003",
      status: "y",
      gst_applicable: "n",
    },
    {
      id: 4,
      service_cat_name: "Minor Procedure",
      sac_code: "SAAC004",
      status: "y",
      gst_applicable: "y",
    },
    {
      id: 5,
      service_cat_name: "Major Procedure",
      sac_code: "SAAC005",
      status: "y",
      gst_applicable: "y",
    },
    {
      id: 6,
      service_cat_name: "Implant",
      sac_code: "SAAC006",
      status: "n",
      gst_applicable: "y",
    },
  ])

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, serviceId: null, newStatus: false })
  const [formData, setFormData] = useState({
    serviceCatName: "",
    sacCode: "",
    gstApplicable: "",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const itemsPerPage = 5

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const filteredServiceList = serviceList.filter(
    (item) =>
      item.service_cat_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sac_code.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredTotalPages = Math.ceil(filteredServiceList.length / itemsPerPage)

  const currentItems = filteredServiceList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleEdit = (item) => {
    setEditingService(item)
    setShowForm(true)
    setFormData({
      serviceCatName: item.service_cat_name,
      sacCode: item.sac_code,
      gstApplicable: item.gst_applicable,
    })
    setIsFormValid(true)
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!isFormValid) return

    if (editingService) {
      setServiceList(
        serviceList.map((item) =>
          item.id === editingService.id
            ? {
                ...item,
                service_cat_name: formData.serviceCatName,
                sac_code: formData.sacCode,
                gst_applicable: formData.gstApplicable,
              }
            : item,
        ),
      )
      showPopup("Service Category updated successfully!", "success")
    } else {
      const newService = {
        id: Date.now(),
        service_cat_name: formData.serviceCatName,
        sac_code: formData.sacCode,
        gst_applicable: formData.gstApplicable,
        status: "y",
      }
      setServiceList([...serviceList, newService])
      showPopup("New Service Category added successfully!", "success")
    }

    setEditingService(null)
    setShowForm(false)
    setFormData({
      serviceCatName: "",
      sacCode: "",
      gstApplicable: "",
    })
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
    setConfirmDialog({ isOpen: true, serviceId: id, newStatus })
  }

  const handleConfirm = (confirmed) => {
    if (confirmed && confirmDialog.serviceId !== null) {
      setServiceList((prevData) =>
        prevData.map((item) =>
          item.id === confirmDialog.serviceId ? { ...item, status: confirmDialog.newStatus } : item,
        ),
      )
    }
    setConfirmDialog({ isOpen: false, serviceId: null, newStatus: null })
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData((prevData) => ({ ...prevData, [id]: value }))

    const updatedFormData = { ...formData, [id]: value }
    setIsFormValid(!!updatedFormData.serviceCatName && !!updatedFormData.sacCode && !!updatedFormData.gstApplicable)
  }

  const handleSelectChange = (e) => {
    const { id, value } = e.target
    setFormData((prevData) => ({ ...prevData, [id]: value }))

    const updatedFormData = { ...formData, [id]: value }
    setIsFormValid(!!updatedFormData.serviceCatName && !!updatedFormData.sacCode && !!updatedFormData.gstApplicable)
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
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">Service Category Master</h4>

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
              {!showForm ? (
                <div className="table-responsive packagelist">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Service Category</th>
                        <th>SAC Code</th>
                        <th>GST Applicable</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.service_cat_name}</td>
                          <td>{item.sac_code}</td>
                          <td style={{ textTransform: "capitalize" }}>{item.gst_applicable === "y" ? "Yes" : "No"}</td>
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
                        Service Category Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="serviceCatName"
                        placeholder="Service Category Name"
                        onChange={handleInputChange}
                        value={formData.serviceCatName}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        SAC Code <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="sacCode"
                        placeholder="SAC Code"
                        onChange={handleInputChange}
                        value={formData.sacCode}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        GST Applicable <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        id="gstApplicable"
                        onChange={handleSelectChange}
                        value={formData.gstApplicable}
                        required
                      >
                        <option value="">Select GST Applicable</option>
                        <option value="y">Yes</option>
                        <option value="n">No</option>
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
                            {serviceList.find((item) => item.id === confirmDialog.serviceId)?.service_cat_name}
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
                      Page {currentPage} of {filteredTotalPages} | Total Records: {filteredServiceList.length}
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

export default ServiceCategoryMaster
