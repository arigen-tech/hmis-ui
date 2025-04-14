import { useState } from "react"
import Popup from "../../../Components/popup"

const Itemtype = () => {
  const [itemTypes, setItemTypes] = useState([
    { id: 1, itemTypeCode: "T1", itemTypeName: "MEDICAL ASSET", itemGroup: "ASSET", status: "y" },
    { id: 2, itemTypeCode: "T2", itemTypeName: "MEDICAL ASSET", itemGroup: "ASSET", status: "y" },
    { id: 3, itemTypeCode: "T3", itemTypeName: "MEDICAL ASSET", itemGroup: "ASSET", status: "y" },
    { id: 4, itemTypeCode: "T4", itemTypeName: "NON MEDICAL ASSET", itemGroup: "CONSUMABLE", status: "y" },
    { id: 5, itemTypeCode: "T5", itemTypeName: "NON MEDICAL ASSET", itemGroup: "CONSUMABLE", status: "y" },
  ])

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, itemTypeId: null, newStatus: false })
  const [formData, setFormData] = useState({
    itemTypeCode: "",
    itemTypeName: "",
    itemGroup: "",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)
  const [editingItemType, setEditingItemType] = useState(null)
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const itemsPerPage = 3

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const filteredItemTypes = itemTypes.filter(
    (item) =>
      item.itemTypeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemTypeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemGroup.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredTotalPages = Math.ceil(filteredItemTypes.length / itemsPerPage)

  const currentItems = filteredItemTypes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleEdit = (item) => {
    setEditingItemType(item)
    setShowForm(true)
    setFormData({
      itemTypeCode: item.itemTypeCode,
      itemTypeName: item.itemTypeName,
      itemGroup: item.itemGroup,
    })
    setIsFormValid(true)
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!isFormValid) return

    if (editingItemType) {
      setItemTypes(
        itemTypes.map((item) =>
          item.id === editingItemType.id
            ? {
                ...item,
                itemTypeCode: formData.itemTypeCode,
                itemTypeName: formData.itemTypeName,
                itemGroup: formData.itemGroup,
              }
            : item,
        ),
      )
      showPopup("Item type updated successfully!", "success")
    } else {
      const newItemType = {
        id: Date.now(),
        itemTypeCode: formData.itemTypeCode,
        itemTypeName: formData.itemTypeName,
        itemGroup: formData.itemGroup,
        status: "y",
      }
      setItemTypes([...itemTypes, newItemType])
      showPopup("New item type added successfully!", "success")
    }

    setEditingItemType(null)
    setShowForm(false)
    setFormData({ itemTypeCode: "", itemTypeName: "", itemGroup: "" })
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
    setConfirmDialog({ isOpen: true, itemTypeId: id, newStatus })
  }

  const handleConfirm = (confirmed) => {
    if (confirmed && confirmDialog.itemTypeId !== null) {
      setItemTypes((prevData) =>
        prevData.map((item) =>
          item.id === confirmDialog.itemTypeId ? { ...item, status: confirmDialog.newStatus } : item,
        ),
      )
    }
    setConfirmDialog({ isOpen: false, itemTypeId: null, newStatus: null })
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData((prevData) => ({ ...prevData, [id]: value }))

    // Check if all required fields have values
    const updatedFormData = { ...formData, [id]: value }
    setIsFormValid(!!updatedFormData.itemTypeCode && !!updatedFormData.itemTypeName && !!updatedFormData.itemGroup)
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
            <div className="card-header">
              <h4 className="card-title p-2">Item Type Master</h4>
              <div className="d-flex justify-content-between align-items-spacearound mt-3">
                {!showForm && (
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <label>
                        <input type="radio" name="searchType" value="code" />
                        <span style={{ marginLeft: "5px" }}>Item Type Code</span>
                      </label>
                    </div>
                    <div className="me-3">
                      <label>
                        <input type="radio" name="searchType" value="description" />
                        <span style={{ marginLeft: "5px" }}>Item Type Name</span>
                      </label>
                    </div>
                  </div>
                )}
                <div className="d-flex align-items-center">
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
            </div>
            <div className="card-body">
              {!showForm ? (
                <div className="table-responsive packagelist">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Item Type Code</th>
                        <th>Item Type Name</th>
                        <th>Item Group</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.itemTypeCode}</td>
                          <td>{item.itemTypeName}</td>
                          <td>{item.itemGroup}</td>
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
                        Item Type Code <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="itemTypeCode"
                        placeholder="Item Type Code"
                        onChange={handleInputChange}
                        value={formData.itemTypeCode}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Item Type Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="itemTypeName"
                        placeholder="Item Type Name"
                        onChange={handleInputChange}
                        value={formData.itemTypeName}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Item Group <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-control"
                        id="itemGroup"
                        onChange={handleInputChange}
                        value={formData.itemGroup}
                        required
                      >
                        <option value="" disabled>
                          Select Item Group
                        </option>
                        <option value="ASSET">ASSET</option>
                        <option value="CONSUMABLE">CONSUMABLE</option>
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
                            {itemTypes.find((item) => item.id === confirmDialog.itemTypeId)?.itemTypeName}
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

              <nav className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  <span>
                    Page {currentPage} of {filteredTotalPages} | Total Records: {filteredItemTypes.length}
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
    </div>
  )
}

export default Itemtype
