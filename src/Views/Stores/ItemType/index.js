
// export const MAS_ITEM_TYPE = `${MASTERS}/masItemType`;
// export const MAS_STORE_GROUP = `${MASTERS}/masStoreGroup`;


import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import { ITEM_TYPE, MAS_ITEM_TYPE, MAS_STORE_GROUP } from "../../../config/apiConfig"

import LoadingScreen from "../../../Components/Loading"
import { postRequest, putRequest, getRequest } from "../../../service/apiService"

const ItemTypeManagement = () => {
  const [itemTypes, setItemTypes] = useState([])
  const [storeGroups, setStoreGroups] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const itemsPerPage = 4
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, itemTypeId: null, newStatus: false })
  const [popupMessage, setPopupMessage] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [itemTypeId, setItemTypeId] = useState("")

  const [editingType, setEditingType] = useState(null)
  const [isFormValid, setIsFormValid] = useState(false)
  const [formData, setFormData] = useState({
    itemTypeCode: "",
    itemTypeName: "",
    itemGroup: "",
  })
  const [loading, setLoading] = useState(true)
  const [searchType, setSearchType] = useState("code")

  const ITEM_TYPE_NAME_MAX_LENGTH = 30
  const ITEM_TYPE_CODE_MAX_LENGTH = 8

  useEffect(() => {
    fetchItemTypes(0)
    fetchStoreGroups(1)
  }, [])

  const fetchItemTypes = async (flag = 0) => {
    try {
      setLoading(true)
      const response = await getRequest(`${MAS_ITEM_TYPE}/getByAll/${flag}`)
      if (response && response.response) {
        // Map the response to match our component's expected structure
        const mappedItemTypes = response.response.map((item) => ({
          itemTypeId: item.id,
          itemTypeCode: item.code,
          itemTypeName: item.name,
          itemGroup: storeGroups.find((group) => group.id === item.masStoreGroupId)?.groupName || "",
          status: item.status.toLowerCase(),
          masStoreGroupId: item.masStoreGroupId,
        }))
        setItemTypes(mappedItemTypes)
      }
    } catch (err) {
      console.error("Error fetching item types:", err)
      showPopup("Failed to load item types", "error")
    } finally {
      setLoading(false)
    }
  }

  const fetchStoreGroups = async (flag=1) => {
    try {
      // Based on your error and response, we need to adjust the endpoint
      const response = await getRequest(`${MAS_STORE_GROUP}/getAll/${flag}`)

      if (response && response.response) {
        const mappedStoreGroups = response.response.map((group) => ({
          id: group.id,
          groupName: group.groupName,
          groupCode: group.groupCode,
          status: group.status,
        }))
        setStoreGroups(mappedStoreGroups)

        // Refresh item types to ensure they have the correct group names
        if (itemTypes.length > 0) {
          const updatedItemTypes = itemTypes.map((item) => ({
            ...item,
            itemGroup: mappedStoreGroups.find((group) => group.id === item.masStoreGroupId)?.groupName || "",
          }))
          setItemTypes(updatedItemTypes)
        }
      }
    } catch (err) {
      console.error("Error fetching store groups:", err)
      showPopup("Failed to load store groups. Using default values.", "error")

     
     
    }
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const handleSearchTypeChange = (e) => {
    setSearchType(e.target.value)
    setCurrentPage(1)
  }

  const filteredItemTypes = itemTypes.filter((type) => {
    if (searchType === "code") {
      return type.itemTypeCode.toLowerCase().includes(searchQuery.toLowerCase())
    } else {
      return type.itemTypeName.toLowerCase().includes(searchQuery.toLowerCase())
    }
  })

  const currentItems = filteredItemTypes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const filteredTotalPages = Math.ceil(filteredItemTypes.length / itemsPerPage)

  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
      setCurrentPage(pageNumber)
    } else {
      alert("Please enter a valid page number.")
    }
  }

  const handleEdit = (type) => {
    setEditingType({
      ...type,
      itemTypeId: type.itemTypeId,
    })
    setFormData({
      itemTypeCode: type.itemTypeCode,
      itemTypeName: type.itemTypeName,
      itemGroup: type.masStoreGroupId.toString(), // Store the ID instead of the name
    })
    setIsFormValid(true)
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!isFormValid) return

    try {
      setLoading(true)

      const isDuplicate = itemTypes.some(
        (type) =>
          (type.itemTypeCode === formData.itemTypeCode || type.itemTypeName === formData.itemTypeName) &&
          (!editingType || type.itemTypeId !== editingType.itemTypeId),
      )

      if (isDuplicate) {
        showPopup("Item type with the same code or name already exists!", "error")
        setLoading(false)
        return
      }

      // Convert request to match API expectations
      const requestData = {
        code: formData.itemTypeCode,
        name: formData.itemTypeName,
        masStoreGroupId: Number.parseInt(formData.itemGroup, 10),
        status: editingType ? editingType.status : "y",
      }

      if (editingType) {
        const response = await putRequest(`${MAS_ITEM_TYPE}/updateById/${editingType.itemTypeId}`, requestData)

        if (response && response.response) {
          // Map the response to match our component's expected structure
          const updatedItem = {
            itemTypeId: response.response.id,
            itemTypeCode: response.response.code,
            itemTypeName: response.response.name,
            itemGroup: storeGroups.find((group) => group.id === response.response.masStoreGroupId)?.groupName || "",
            status: response.response.status.toLowerCase(),
            masStoreGroupId: response.response.masStoreGroupId,
          }

          setItemTypes((prevData) =>
            prevData.map((type) => (type.itemTypeId === editingType.itemTypeId ? updatedItem : type)),
          )
          showPopup("Item type updated successfully!", "success")
        }
      } else {
        const response = await postRequest(`${MAS_ITEM_TYPE}/create`, requestData)

        if (response && response.response) {
          // Map the response to match our component's expected structure
          const newItem = {
            itemTypeId: response.response.id,
            itemTypeCode: response.response.code,
            itemTypeName: response.response.name,
            itemGroup: storeGroups.find((group) => group.id === response.response.masStoreGroupId)?.groupName || "",
            status: response.response.status.toLowerCase(),
            masStoreGroupId: response.response.masStoreGroupId,
          }

          setItemTypes([...itemTypes, newItem])
          showPopup("New item type added successfully!", "success")
        }
      }

      setEditingType(null)
      setFormData({ itemTypeCode: "", itemTypeName: "", itemGroup: "" })
      setShowForm(false)
      fetchItemTypes()
    } catch (err) {
      console.error("Error saving item type:", err)
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
    setItemTypeId(id)
    setNewStatus(newStatus)
    setConfirmDialog({ isOpen: true, itemTypeId: id, newStatus })
  }

  const handleConfirm = async () => {
    try {
      setLoading(true)

      const response = await putRequest(

        `${MAS_ITEM_TYPE}/status/${confirmDialog.itemTypeId}?status=${confirmDialog.newStatus}`,
      )

      if (response && response.response) {
        setItemTypes((prevData) =>
          prevData.map((type) =>
            type.itemTypeId === confirmDialog.itemTypeId ? { ...type, status: confirmDialog.newStatus } : type,
          ),
        )
        showPopup(`Item type ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`, "success")
      }
    } catch (err) {
      console.error("Error updating item type status:", err)
      showPopup(`Failed to update status: ${err.response?.data?.message || err.message}`, "error")
    } finally {
      setLoading(false)
      setConfirmDialog({ isOpen: false, itemTypeId: null, newStatus: null })
    }
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData((prevData) => ({ ...prevData, [id]: value }))

    // Check if all required fields have values
    const updatedFormData = { ...formData, [id]: value }
    setIsFormValid(
      updatedFormData.itemTypeCode.trim() !== "" &&
        updatedFormData.itemTypeName.trim() !== "" &&
        updatedFormData.itemGroup.trim() !== "",
    )
  }

  const handleRefresh = () => {
    setSearchQuery("")
    setCurrentPage(1)
    fetchItemTypes()
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
              {!showForm && (
                <div className="d-flex justify-content-between align-items-spacearound mt-3">
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <label>
                        <input
                          type="radio"
                          name="searchType"
                          value="code"
                          checked={searchType === "code"}
                          onChange={handleSearchTypeChange}
                        />
                        <span style={{ marginLeft: "5px" }}>Item Type Code</span>
                      </label>
                    </div>
                    <div className="me-3">
                      <label>
                        <input
                          type="radio"
                          name="searchType"
                          value="description"
                          checked={searchType === "description"}
                          onChange={handleSearchTypeChange}
                        />
                        <span style={{ marginLeft: "5px" }}>Item Type Name</span>
                      </label>
                    </div>
                  </div>
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
                    <button type="button" className="btn btn-success me-1" onClick={() => setShowForm(true)}>
                      <i className="mdi mdi-plus"></i> ADD
                    </button>
                    <button type="button" className="btn btn-success me-2">
                      <i className="mdi mdi-plus"></i> Generate Report
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="card-body">
              {loading ? (
                <LoadingScreen />
              ) : !showForm ? (
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
                      {currentItems.map((type) => (
                        <tr key={type.itemTypeId}>
                          <td>{type.itemTypeCode}</td>
                          <td>{type.itemTypeName}</td>
                          <td>{type.itemGroup}</td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={type.status === "y"}
                                onChange={() => handleSwitchChange(type.itemTypeId, type.status === "y" ? "n" : "y")}
                                id={`switch-${type.itemTypeId}`}
                              />
                              <label className="form-check-label px-0" htmlFor={`switch-${type.itemTypeId}`}>
                                {type.status === "y" ? "Active" : "Deactivated"}
                              </label>
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleEdit(type)}
                              disabled={type.status !== "y"}
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
                  <div className="form-group col-md-4">
                    <label>
                      Item Type Code <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="itemTypeCode"
                      name="itemTypeCode"
                      placeholder="Code"
                      value={formData.itemTypeCode}
                      maxLength={ITEM_TYPE_CODE_MAX_LENGTH}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group col-md-4">
                    <label>
                      Item Type Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="itemTypeName"
                      name="itemTypeName"
                      placeholder="Name"
                      value={formData.itemTypeName}
                      onChange={handleInputChange}
                      maxLength={ITEM_TYPE_NAME_MAX_LENGTH}
                      required
                    />
                  </div>
                  <div className="form-group col-md-4">
                    <label>
                      Item Group <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-control mt-1"
                      id="itemGroup"
                      name="itemGroup"
                      value={formData.itemGroup}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="" disabled>
                        Select Item Group
                      </option>
                      {storeGroups
                        .filter((group) => group.status.toLowerCase() === "y")
                        .map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.groupName}
                          </option>
                        ))}

                      {/* Fallback options if no store groups are loaded */}
                      {storeGroups.length === 0 && (
                        <>
                          <option value="1">ASSET</option>
                          <option value="2">CONSUMABLE</option>
                        </>
                      )}
                    </select>
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
                        <button type="button" className="close" onClick={() => setConfirmDialog({ isOpen: false })}>
                          <span>&times;</span>
                        </button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                          <strong>
                            {itemTypes.find((type) => type.itemTypeId === confirmDialog.itemTypeId)?.itemTypeName}
                          </strong>
                          ?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setConfirmDialog({ isOpen: false })}
                        >
                          No
                        </button>
                        <button type="button" className="btn btn-primary" onClick={handleConfirm}>
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

export default ItemTypeManagement
