import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import { ITEM_TYPE, MAS_ITEM_TYPE, MAS_STORE_GROUP } from "../../../config/apiConfig"
import LoadingScreen from "../../../Components/Loading"
import { postRequest, putRequest, getRequest } from "../../../service/apiService"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination"
import {
  FETCH_ITEM_TYPE,
  ADD_ITEM_TYPE_SUCCESS,
  ADD_ITEM_TYPE_FAIL,
  UPDATE_ITEM_TYPE_SUCCESS,
  UPDATE_ITEM_TYPE_FAIL,
  DUPLICATE_ITEM_TYPE,
  STATUS_ITEM_TYPE_SUCCESS,
  STATUS_ITEM_TYPE_FAIL,
} from "../../../config/constants"

const ItemTypeManagement = () => {
  const [itemTypes, setItemTypes] = useState([])
  const [storeGroups, setStoreGroups] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, itemTypeId: null, newStatus: "" })
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
          itemGroup: item.masStoreGroupName || "",
          status: item.status.toLowerCase(),
          masStoreGroupId: item.masStoreGroupId,
        }))
        setItemTypes(mappedItemTypes)
      }
    } catch (err) {
      console.error("Error fetching item types:", err)
      showPopup(FETCH_ITEM_TYPE || "Failed to load item types", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredItemTypes = itemTypes.filter((type) => {
    const q = (searchQuery || "").trim().toLowerCase()
    return (
      type.itemTypeCode.toLowerCase().includes(q) ||
      type.itemTypeName.toLowerCase().includes(q) ||
      type.itemGroup.toLowerCase().includes(q) ||
      type.status.toLowerCase().includes(q)
    )
  })

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE
  const currentItems = filteredItemTypes.slice(indexOfFirst, indexOfLast)

  const validateForm = (values) => {
    return (
      values.itemTypeCode?.trim() !== "" &&
      values.itemTypeName?.trim() !== "" &&
      values.itemGroup?.trim() !== ""
    )
  }

  const handleEdit = (type) => {
    setEditingType(type)
    setFormData({
      itemTypeCode: type.itemTypeCode,
      itemTypeName: type.itemTypeName,
      itemGroup: type.masStoreGroupId?.toString() || "",
    })
    setIsFormValid(true)
    setShowForm(true)
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    const updated = { ...formData, [id]: value }
    setFormData(updated)
    setIsFormValid(validateForm(updated))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!isFormValid) return

    const isDuplicate = itemTypes.some(
      (type) =>
        (type.itemTypeCode === formData.itemTypeCode ||
          type.itemTypeName === formData.itemTypeName) &&
        (!editingType || type.itemTypeId !== editingType.itemTypeId)
    )

    if (isDuplicate) {
      showPopup(DUPLICATE_ITEM_TYPE || "Duplicate item type code or name!", "error")
      return
    }

    try {
      setLoading(true)

      const requestData = {
        code: formData.itemTypeCode,
        name: formData.itemTypeName,
        masStoreGroupId: Number(formData.itemGroup),
        status: editingType ? editingType.status : "y",
      }

      if (editingType) {
        const response = await putRequest(`${MAS_ITEM_TYPE}/updateById/${editingType.itemTypeId}`, requestData)
        if (response.status === 200) {
          setPopupMessage({
            message: UPDATE_ITEM_TYPE_SUCCESS || "Item Type updated successfully!",
            type: "success",
            onClose: () => {
              setPopupMessage(null)
              handleCancel()
              fetchItemTypes(0)
              setCurrentPage(1)
            }
          })
        }
      } else {
        const response = await postRequest(`${MAS_ITEM_TYPE}/create`, requestData)
        if (response.status === 201 || response.status === 200) {
          setPopupMessage({
            message: ADD_ITEM_TYPE_SUCCESS || "New Item Type added successfully!",
            type: "success",
            onClose: () => {
              setPopupMessage(null)
              handleCancel()
              fetchItemTypes(0)
              setCurrentPage(1)
            }
          })
        }
      }
    } catch (err) {
      console.error("Error saving:", err)
      showPopup(
        editingType 
          ? (UPDATE_ITEM_TYPE_FAIL || err.response?.data?.message || err.message)
          : (ADD_ITEM_TYPE_FAIL || err.response?.data?.message || err.message), 
        "error"
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, itemTypeId: id, newStatus })
  }

  const handleConfirm = async (confirmed) => {
    if (!confirmed) {
      setConfirmDialog({ isOpen: false, itemTypeId: null, newStatus: "" })
      return
    }

    try {
      setLoading(true)
      const response = await putRequest(
        `${MAS_ITEM_TYPE}/status/${confirmDialog.itemTypeId}?status=${confirmDialog.newStatus}`
      )
      if (response.status === 200) {
        setPopupMessage({
          message: STATUS_ITEM_TYPE_SUCCESS || "Status updated successfully!",
          type: "success",
          onClose: () => {
            setPopupMessage(null)
            fetchItemTypes(0)
            setCurrentPage(1)
          }
        })
      }
    } catch (err) {
      console.error("Status error:", err)
      showPopup(STATUS_ITEM_TYPE_FAIL || err.response?.data?.message || err.message, "error")
    } finally {
      setLoading(false)
      setConfirmDialog({ isOpen: false, itemTypeId: null, newStatus: "" })
    }
  }

  const handleRefresh = () => {
    setSearchQuery("")
    setCurrentPage(1)
    fetchItemTypes(0)
  }

  const showPopup = (message, type = "info") => {
    setPopupMessage({ 
      message, 
      type, 
      onClose: () => setPopupMessage(null) 
    })
  }

  const handleCancel = () => {
    setFormData({ itemTypeCode: "", itemTypeName: "", itemGroup: "" })
    setIsFormValid(false)
    setEditingType(null)
    setShowForm(false)
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">Item Type Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm ? (
                  <>
                    <form className="d-inline-block searchform me-4" role="search">
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
                    <div className="d-flex align-items-center ms-auto">
                      <button 
                        className="btn btn-success me-2" 
                        onClick={() => setShowForm(true)}
                        disabled={loading}
                      >
                        <i className="mdi mdi-plus"></i> Add
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-success me-2 flex-shrink-0" 
                        onClick={handleRefresh}
                        disabled={loading}
                      >
                        <i className="mdi mdi-refresh"></i> Show All
                      </button>
                    </div>
                  </>
                ) : (
                  <button 
                    className="btn btn-secondary" 
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    <i className="mdi mdi-arrow-left"></i> Back
                  </button>
                )}
              </div>
            </div>

            <div className="card-body">
              {!showForm ? (
                <>
                  {loading && <LoadingScreen />}
                  {!loading && (
                    <>
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
                            {currentItems.length > 0 ? (
                              currentItems.map((type) => (
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
                                        onChange={() =>
                                          handleSwitchChange(type.itemTypeId, type.status === "y" ? "n" : "y")
                                        }
                                        disabled={loading}
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
                                      disabled={type.status !== "y" || loading}
                                    >
                                      <i className="fa fa-pencil"></i>
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="text-center">
                                  No item types found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      
                      {filteredItemTypes.length > 0 && (
                        <Pagination
                          totalItems={filteredItemTypes.length}
                          itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                          currentPage={currentPage}
                          onPageChange={setCurrentPage}
                        />
                      )}
                    </>
                  )}
                </>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="form-group col-md-4">
                    <label>Item Type Code *</label>
                    <input
                      type="text"
                      className="form-control mt-1"
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
                      className="form-control mt-1"
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
                      className="form-select mt-1"
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
                    <button 
                      type="submit" 
                      className="btn btn-primary me-2" 
                      disabled={!isFormValid || loading}
                    >
                      {loading ? "Saving..." : editingType ? "Update" : "Save"}
                    </button>
                    <button 
                      type="button"
                      className="btn btn-danger" 
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {popupMessage && (
                <Popup 
                  message={popupMessage.message} 
                  type={popupMessage.type} 
                  onClose={popupMessage.onClose} 
                />
              )}

              {confirmDialog.isOpen && (
                <div 
                  className="modal d-block" 
                  tabIndex="-1" 
                  role="dialog"
                  style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                >
                  <div className="modal-dialog" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button 
                          className="close" 
                          onClick={() => handleConfirm(false)}
                        >
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
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => handleConfirm(false)}
                          disabled={loading}
                        >
                          No
                        </button>
                        <button 
                          className="btn btn-primary" 
                          onClick={() => handleConfirm(true)}
                          disabled={loading}
                        >
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

export default ItemTypeManagement