import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"

const Investigationpricing = () => {
  const [investigationList, setInvestigationList] = useState([
    { id: 1, investigationId: "INV001", fromDate: "-", toDate: "-", price: "23", status: "y" },
    { id: 2, investigationId: "INV002", fromDate: "-", toDate: "-", price: "2342", status: "y" },
    { id: 3, investigationId: "INV003", fromDate: "-", toDate: "-", price: "23422", status: "y" },
    { id: 4, investigationId: "INV004", fromDate: "-", toDate: "-", price: "4323", status: "y" },
    { id: 5, investigationId: "INV005", fromDate: "-", toDate: "-", price: "2342", status: "y" },
  ])

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, investigationId: null, newStatus: false })
  const [formData, setFormData] = useState({
    investigationId: "",
    fromDate: "-",
    toDate: "-",
    price: "",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)
  const [editingInvestigation, setEditingInvestigation] = useState(null)
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const itemsPerPage = 5

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const filteredInvestigationList = investigationList.filter(
    (item) =>
      item.investigationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.price.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredTotalPages = Math.ceil(filteredInvestigationList.length / itemsPerPage)

  const currentItems = filteredInvestigationList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleEdit = (item) => {
    setEditingInvestigation(item)
    setShowForm(true)
    setFormData({
      investigationId: item.investigationId,
      fromDate: item.fromDate,
      toDate: item.toDate,
      price: item.price,
    })
    setIsFormValid(true)
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!isFormValid) return

    if (editingInvestigation) {
      setInvestigationList(
        investigationList.map((item) =>
          item.id === editingInvestigation.id
            ? {
              ...item,
              investigationId: formData.investigationId,
              fromDate: formData.fromDate,
              toDate: formData.toDate,
              price: formData.price,
            }
            : item,
        ),
      )
      showPopup("Investigation pricing updated successfully!", "success")
    } else {
      const newInvestigation = {
        id: Date.now(),
        investigationId: formData.investigationId,
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        price: formData.price,
        status: "y",
      }
      setInvestigationList([...investigationList, newInvestigation])
      showPopup("New investigation pricing added successfully!", "success")
    }

    setEditingInvestigation(null)
    setShowForm(false)
    setFormData({ investigationId: "", fromDate: "-", toDate: "-", price: "" })
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
    setConfirmDialog({ isOpen: true, investigationId: id, newStatus })
  }

  const handleConfirm = (confirmed) => {
    if (confirmed && confirmDialog.investigationId !== null) {
      setInvestigationList((prevData) =>
        prevData.map((item) =>
          item.id === confirmDialog.investigationId ? { ...item, status: confirmDialog.newStatus } : item,
        ),
      )
    }
    setConfirmDialog({ isOpen: false, investigationId: null, newStatus: null })
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target

    // Validate the price input to allow only numbers and decimal points
    if (id === "price") {
      // Check if the value is a valid number (including empty string)
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        setFormData((prevData) => ({ ...prevData, [id]: value }));
      }
      return; // Exit the function after validation
    }

    setFormData((prevData) => ({ ...prevData, [id]: value }))

    // Check if all required fields have values
    const updatedFormData = { ...formData, [id]: value }
    setIsFormValid(!!updatedFormData.investigationId && !!updatedFormData.price)
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

  const handleAddClick = () => {
    setFormData({ InvestigationId: "", FromDate: "", ToDate: "", Price: "" })
    setShowForm(true)
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownOpen && !event.target.closest(".dropdown-search-container")) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [dropdownOpen])

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">Investigation Pricing Master</h4>

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
                    <button type="button" className="btn btn-success me-2" onClick={handleAddClick}>
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
                        <th>Investigation ID</th>
                        <th>From Date</th>
                        <th>To Date</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.investigationId}</td>
                          <td>{item.fromDate}</td>
                          <td>{item.toDate}</td>
                          <td>{item.price}</td>
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
                        Investigation ID <span className="text-danger">*</span>
                      </label>
                      <div className="dropdown-search-container position-relative">
                        <input
                          type="text"
                          className="form-control"
                          id="investigationId"
                          placeholder="Search Investigation ID"
                          onChange={(e) => {
                            handleInputChange(e)
                            setDropdownOpen(e.target.value.trim() !== "");
                          }}
                          value={formData.investigationId}
                          required
                          autoComplete="off"
                        />
                        {dropdownOpen && (
                          <ul className="list-group position-absolute w-100 mt-1" style={{
                            zIndex: 1000,
                            maxHeight: '200px', // Set a maximum height
                            overflowY: 'auto', // Enable vertical scrolling
                            backgroundColor: '#fff', // Optional: Set a background color for better visibility
                            border: '1px solid #ccc', // Optional: Add a border for better definition
                        }}>

                            {investigationList
                              .filter(
                                (item) =>
                                  item.investigationId.toLowerCase().includes(formData.investigationId.toLowerCase()) &&
                                  item.investigationId !== formData.investigationId,
                              )
                              .map((item, index) => (
                                <li
                                  key={index}
                                  className="list-group-item list-group-item-action"
                                  style={{ backgroundColor: '#e3e8e6' }}
                                  onClick={() => {
                                    setFormData({ ...formData, investigationId: item.investigationId })
                                    setDropdownOpen(false)
                                  }}
                                >
                                  {item.investigationId}
                                </li>
                              ))}
                          </ul>
                        )}
                      </div>
                    </div>


                    <div className="form-group col-md-4 mt-3">
                      <label>
                        From Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        id="fromDate"
                        onChange={handleInputChange}
                        value={formData.fromDate !== "-" ? formData.fromDate : ""}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        To Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        id="toDate"
                        onChange={handleInputChange}
                        value={formData.toDate !== "-" ? formData.toDate : ""}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Price <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">₹</span> {/* Currency symbol */}
                        <input
                          type="text"
                          className="form-control"
                          id="price"
                          placeholder="Price"
                          onChange={handleInputChange}
                          value={formData.price}
                          required
                        />
                      </div>
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
                            {
                              investigationList.find((item) => item.id === confirmDialog.investigationId)
                                ?.investigationId
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

              {!showForm && (
                <nav className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    <span>
                      Page {currentPage} of {filteredTotalPages} | Total Records: {filteredInvestigationList.length}
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

export default Investigationpricing
