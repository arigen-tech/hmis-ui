import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import LoadingScreen from "../../../Components/Loading"
import { postRequest, putRequest, getRequest } from "../../../service/apiService"
import { DG_MAS_COLLECTION } from "../../../config/apiConfig"
import { ADD_SAMPLE_COLLECTION_SUCC_MSG, DUPLICATE_SAMPLE_COLLECTION_ERR_MSG, FAIL_TO_SAVE_CHANGES, FAIL_TO_UPDATE_STS, FETCH_SAMPLE_COLLECTION_ERR_MSG, UPDATE_SAMPLE_COLLECTION_SUCC_MSG } from "../../../config/constants"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination"

const SampleCollectionMaster = () => {
  const [sampleCollections, setSampleCollections] = useState([])
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, collectionId: null, newStatus: false })
  const [formData, setFormData] = useState({
    collectionCode: "",
    collectionName: "",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)
  const [editingCollection, setEditingCollection] = useState(null)
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSampleCollectionData(0)
  }, [])

  const fetchSampleCollectionData = async (flag = 0) => {
    try {
      setLoading(true)
      const response = await getRequest(`${DG_MAS_COLLECTION}/getAll/${flag}`)
      
      if (response && response.response) {
        setSampleCollections(response.response)
      }
    } catch (err) {
      console.error("Error fetching sample collection data:", err)
      showPopup(FETCH_SAMPLE_COLLECTION_ERR_MSG, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const filteredSampleCollections = Array.isArray(sampleCollections) ? sampleCollections.filter(
    (item) =>
      (item?.collectionCode?.toString().toLowerCase().includes(searchQuery.toLowerCase()) || 
       item?.collectionName?.toString().toLowerCase().includes(searchQuery.toLowerCase()))
  ) : []
  
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredSampleCollections.slice(indexOfFirst, indexOfLast);

  const handleEdit = (item) => {
    setEditingCollection(item)
    setShowForm(true)
    setFormData({
      collectionCode: item.collectionCode,
      collectionName: item.collectionName,
    })
    setIsFormValid(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!isFormValid) return

    try {
      setLoading(true)

      // Check for duplicate collection code
      const isDuplicate = sampleCollections.some(
        (code) =>
          code.collectionCode === formData.collectionCode &&
          (!editingCollection || code.collectionId !== editingCollection.collectionId)
      )

      if (isDuplicate && !editingCollection) {
        showPopup(DUPLICATE_SAMPLE_COLLECTION_ERR_MSG, "error")
        setLoading(false)
        return
      }

      if (editingCollection) {
        // Update existing sample collection
        const response = await putRequest(`${DG_MAS_COLLECTION}/update/${editingCollection.collectionId}`, {
          collectionCode: formData.collectionCode,
          collectionName: formData.collectionName,
          status: editingCollection.status,
        })

        if (response && response.status === 200) {
          fetchSampleCollectionData()
          showPopup(UPDATE_SAMPLE_COLLECTION_SUCC_MSG, "success")
        }
      } else {
        // Add new sample collection
        const response = await postRequest(`${DG_MAS_COLLECTION}/create`, {
          collectionCode: formData.collectionCode,
          collectionName: formData.collectionName,
          status: "y",
        })

        if (response && response.status === 200) {
          fetchSampleCollectionData()
          showPopup(ADD_SAMPLE_COLLECTION_SUCC_MSG, "success")
        }
      }

      // Reset form and state
      setEditingCollection(null)
      setFormData({ collectionCode: "", collectionName: "" })
      setShowForm(false)
    } catch (err) {
      console.error("Error saving sample collection:", err)
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
    setConfirmDialog({ isOpen: true, collectionId: id, newStatus })
  }

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.collectionId !== null) {
      try {
        setLoading(true)
        const response = await putRequest(
          `${DG_MAS_COLLECTION}/status/${confirmDialog.collectionId}?status=${confirmDialog.newStatus}`
        )
        if (response && response.response) {
          setSampleCollections((prevData) =>
            prevData.map((item) =>
              item.collectionId === confirmDialog.collectionId
                ? { ...item, status: confirmDialog.newStatus }
                : item
            )
          )
          showPopup(
            `Sample collection ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
            "success"
          )
        }
      } catch (err) {
        console.error("Error updating sample collection status:", err)
        showPopup(FAIL_TO_UPDATE_STS, "error")
      } finally {
        setLoading(false)
      }
    }
    setConfirmDialog({ isOpen: false, collectionId: null, newStatus: null })
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData((prevData) => ({ ...prevData, [id]: value }))

    // Check if all required fields have values
    const updatedFormData = { ...formData, [id]: value }
    setIsFormValid(!!updatedFormData.collectionCode && !!updatedFormData.collectionName)
  }

  const handleRefresh = () => {
    setSearchQuery("")
    setCurrentPage(1)
    fetchSampleCollectionData()
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">Sample Collection Master</h4>

              <div className="d-flex justify-content-between align-items-center">
                {!showForm ? (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search "
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
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={() => setShowForm(true)}
                      >
                        <i className="mdi mdi-plus"></i> Add
                      </button>
                      <button
                        type="button"
                        className="btn btn-success me-2 flex-shrink-0"
                        onClick={handleRefresh}
                      >
                        <i className="mdi mdi-refresh"></i> Show All
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
                <>
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Collection Code</th>
                          <th>Collection Name</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.map((item) => (
                          <tr key={item.collectionId}>
                            <td>{item.collectionCode}</td>
                            <td>{item.collectionName}</td>
                            <td>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={item.status === "y"}
                                  onChange={() => handleSwitchChange(item.collectionId, item.status === "y" ? "n" : "y")}
                                  id={`switch-${item.collectionId}`}
                                />
                                <label
                                  className="form-check-label px-0"
                                  htmlFor={`switch-${item.collectionId}`}
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
                  {/* PAGINATION USING REUSABLE COMPONENT */}
                  {filteredSampleCollections.length > 0 && (
                    <Pagination
                      totalItems={filteredSampleCollections.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
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
                        Collection Code <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="collectionCode"
                        placeholder="Collection Code"
                        onChange={handleInputChange}
                        value={formData.collectionCode}
                        maxLength={7}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Collection Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="collectionName"
                        placeholder="Collection Name"
                        onChange={handleInputChange}
                        value={formData.collectionName}
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
                            {sampleCollections.find((item) => item.collectionId === confirmDialog.collectionId)?.collectionName}
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

export default SampleCollectionMaster