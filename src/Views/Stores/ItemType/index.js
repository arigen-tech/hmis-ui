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
  const itemsPerPage = 5
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, itemTypeId: null, newStatus: false })
  const [popupMessage, setPopupMessage] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingType, setEditingType] = useState(null)
  const [isFormValid, setIsFormValid] = useState(false)
  const [formData, setFormData] = useState({
    itemTypeCode: "",
    itemTypeName: "",
    itemGroup: "",
  })
  const [loading, setLoading] = useState(true)

  const ITEM_TYPE_NAME_MAX_LENGTH = 30
  const ITEM_TYPE_CODE_MAX_LENGTH = 8

  useEffect(() => {
    const init = async () => {
      await fetchStoreGroups(1)
      await fetchItemTypes(0)
    }
    init()
  }, [])

  const fetchStoreGroups = async (flag = 1) => {
    try {
      const response = await getRequest(`${MAS_STORE_GROUP}/getAll/${flag}`)
      if (response && response.response) {
        const mappedStoreGroups = response.response.map((group) => ({
          id: group.id,
          groupName: group.groupName,
          groupCode: group.groupCode,
          status: group.status,
        }))
        setStoreGroups(mappedStoreGroups)
      }
    } catch (err) {
      console.error("Error fetching store groups:", err)
      showPopup("Failed to load store groups. Using default values.", "error")
    }
  }

  const fetchItemTypes = async (flag = 0) => {
    try {
      setLoading(true)
      const response = await getRequest(`${MAS_ITEM_TYPE}/getByAll/${flag}`)
      if (response && response.response) {
        const mappedItemTypes = response.response.map((item) => ({
          itemTypeId: item.id,
          itemTypeCode: item.code,
          itemTypeName: item.name,
          itemGroup: item.masStoreGroupName || "",   // ✅ FIXED
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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const filteredItemTypes = itemTypes.filter((type) => {
    const q = (searchQuery || "").trim().toLowerCase()
    return (
      type.itemTypeCode.toLowerCase().includes(q) ||
      type.itemTypeName.toLowerCase().includes(q) ||
      type.itemGroup.toLowerCase().includes(q) ||
      type.status.toLowerCase().includes(q)
    )
  })

  const currentItems = filteredItemTypes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const filteredTotalPages = Math.ceil(filteredItemTypes.length / itemsPerPage)

  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    if (pageNumber > 0 && pageNumber <= filteredTotalPages) setCurrentPage(pageNumber)
    else alert("Invalid page number")
  }

  const handleEdit = (type) => {
    setEditingType(type)
    setFormData({
      itemTypeCode: type.itemTypeCode,
      itemTypeName: type.itemTypeName,
      itemGroup: type.masStoreGroupId.toString(),
    })
    setIsFormValid(true)
    setShowForm(true)
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    const updated = { ...formData, [id]: value }
    setFormData(updated)
    setIsFormValid(
      updated.itemTypeCode.trim() !== "" &&
      updated.itemTypeName.trim() !== "" &&
      updated.itemGroup.trim() !== ""
    )
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!isFormValid) return

    try {
      setLoading(true)

      const isDuplicate = itemTypes.some(
        (type) =>
          (type.itemTypeCode === formData.itemTypeCode ||
            type.itemTypeName === formData.itemTypeName) &&
          (!editingType || type.itemTypeId !== editingType.itemTypeId)
      )

      if (isDuplicate) {
        showPopup("Duplicate item type code or name!", "error")
        return
      }

      const requestData = {
        code: formData.itemTypeCode,
        name: formData.itemTypeName,
        masStoreGroupId: Number(formData.itemGroup),
        status: editingType ? editingType.status : "y",
      }

      if (editingType) {
        const response = await putRequest(`${MAS_ITEM_TYPE}/updateById/${editingType.itemTypeId}`, requestData)
        if (response && response.response) {
          const updatedItem = {
            itemTypeId: response.response.id,
            itemTypeCode: response.response.code,
            itemTypeName: response.response.name,
            itemGroup: response.response.masStoreGroupName || "",  // ✅ FIXED
            status: response.response.status.toLowerCase(),
            masStoreGroupId: response.response.masStoreGroupId,
          }
          setItemTypes((prev) =>
            prev.map((t) => (t.itemTypeId === editingType.itemTypeId ? updatedItem : t))
          )
          showPopup("Item Type updated successfully!", "success")
        }
      } else {
        const response = await postRequest(`${MAS_ITEM_TYPE}/create`, requestData)
        if (response && response.response) {
          const newItem = {
            itemTypeId: response.response.id,
            itemTypeCode: response.response.code,
            itemTypeName: response.response.name,
            itemGroup: response.response.masStoreGroupName || "",  // ✅ FIXED
            status: response.response.status.toLowerCase(),
            masStoreGroupId: response.response.masStoreGroupId,
          }
          setItemTypes([...itemTypes, newItem])
          showPopup("New Item Type added successfully!", "success")
        }
      }

      setShowForm(false)
      setEditingType(null)
      setFormData({ itemTypeCode: "", itemTypeName: "", itemGroup: "" })
      fetchItemTypes()
    } catch (err) {
      console.error("Error saving:", err)
      showPopup(err.response?.data?.message || err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, itemTypeId: id, newStatus })
  }

  const handleConfirm = async () => {
    try {
      setLoading(true)
      const response = await putRequest(
        `${MAS_ITEM_TYPE}/status/${confirmDialog.itemTypeId}?status=${confirmDialog.newStatus}`
      )
      if (response && response.response) {
        setItemTypes((prev) =>
          prev.map((t) =>
            t.itemTypeId === confirmDialog.itemTypeId
              ? { ...t, status: confirmDialog.newStatus }
              : t
          )
        )
        showPopup("Status updated successfully!", "success")
      }
    } catch (err) {
      console.error("Status error:", err)
      showPopup(err.response?.data?.message || err.message, "error")
    } finally {
      setLoading(false)
      setConfirmDialog({ isOpen: false })
    }
  }

  const handleRefresh = () => {
    setSearchQuery("")
    setCurrentPage(1)
    fetchItemTypes()
  }

  const showPopup = (message, type = "info") => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) })
  }

  const renderPagination = () => {
    const pageNumbers = []
    const max = 5
    let start = Math.max(1, currentPage - Math.floor(max / 2))
    const end = Math.min(filteredTotalPages, start + max - 1)
    if (end - start < max - 1) start = Math.max(1, end - max + 1)

    if (start > 1) {
      pageNumbers.push(1)
      if (start > 2) pageNumbers.push("...")
    }

    for (let i = start; i <= end; i++) pageNumbers.push(i)

    if (end < filteredTotalPages) {
      if (end < filteredTotalPages - 1) pageNumbers.push("...")
      pageNumbers.push(filteredTotalPages)
    }

    return pageNumbers.map((num, i) => (
      <li key={i} className={`page-item ${num === currentPage ? "active" : ""}`}>
        {typeof num === "number" ? (
          <button className="page-link" onClick={() => setCurrentPage(num)}>
            {num}
          </button>
        ) : (
          <span className="page-link disabled">{num}</span>
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
                <div className="d-flex justify-content-between mt-3">
                  <div className="d-flex align-items-center">
                    <form className="searchform me-4" role="search">
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
                    <button className="btn btn-success me-1" onClick={() => setShowForm(true)}>
                      <i className="mdi mdi-plus"></i> ADD
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
                          <td>{type.itemGroup}</td> {/* ✅ FIXED */}
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={type.status === "y"}
                                onChange={() =>
                                  handleSwitchChange(type.itemTypeId, type.status === "y" ? "n" : "y")
                                }
                              />
                              <label className="form-check-label">
                                {type.status === "y" ? "Active" : "Deactivated"}
                              </label>
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-success"
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
                    <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                      <i className="mdi mdi-arrow-left"></i> Back
                    </button>
                  </div>

                  <div className="form-group col-md-4">
                    <label>Item Type Code *</label>
                    <input
                      type="text"
                      className="form-control"
                      id="itemTypeCode"
                      value={formData.itemTypeCode}
                      maxLength={ITEM_TYPE_CODE_MAX_LENGTH}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group col-md-4">
                    <label>Item Type Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      id="itemTypeName"
                      value={formData.itemTypeName}
                      maxLength={ITEM_TYPE_NAME_MAX_LENGTH}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group col-md-4">
                    <label>Item Group *</label>
                    <select
                      className="form-select"
                      id="itemGroup"
                      value={formData.itemGroup}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="" disabled>
                        Select Item Group
                      </option>
                      {storeGroups
                        .filter((g) => g.status.toLowerCase() === "y")
                        .map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.groupName}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                    <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                      Save
                    </button>
                    <button className="btn btn-danger" onClick={() => setShowForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {popupMessage && (
                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
              )}

              {confirmDialog.isOpen && (
                <div className="modal d-block">
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button className="close" onClick={() => setConfirmDialog({ isOpen: false })}>
                          <span>&times;</span>
                        </button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to{" "}
                          {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                          <strong>
                            {itemTypes.find((t) => t.itemTypeId === confirmDialog.itemTypeId)?.itemTypeName}
                          </strong>
                          ?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={() => setConfirmDialog({ isOpen: false })}>
                          No
                        </button>
                        <button className="btn btn-primary" onClick={handleConfirm}>
                          Yes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <nav className="d-flex justify-content-between mt-3">
                <span>
                  Page {currentPage} of {filteredTotalPages} | Total: {filteredItemTypes.length}
                </span>
                <ul className="pagination mb-0">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                  </li>
                  {renderPagination()}
                  <li className={`page-item ${currentPage === filteredTotalPages ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === filteredTotalPages}
                    >
                      Next
                    </button>
                  </li>
                </ul>

                <div className="d-flex align-items-center">
                  <input
                    type="number"
                    className="form-control form-control-sm me-2"
                    placeholder="Go to"
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                  />
                  <button className="btn btn-sm btn-primary" onClick={handlePageNavigation}>
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
