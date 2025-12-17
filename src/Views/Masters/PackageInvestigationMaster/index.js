"use client"

import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import LoadingScreen from "../../../Components/Loading"
import { postRequest, putRequest, getRequest } from "../../../service/apiService"
import { INVESTIGATION_PACKAGE_API, INVESTIGATION_PACKAGE_Mapping, MAS_INVESTIGATION } from "../../../config/apiConfig"

const PackageInvestigationMaster = () => {
  const [mappingList, setMappingList] = useState([])
  const [investigationList, setInvestigationList] = useState([])
  const [packageList, setPackageList] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    mappingId: null,
    newStatus: false,
    packageId: null,
    packageName: "",
  })
  const [selectedMapping, setSelectedMapping] = useState(null)
  const [showInvestigationForm, setShowInvestigationForm] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [investigationSearchQuery, setInvestigationSearchQuery] = useState("")
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const itemsPerPage = 5

  const [formData, setFormData] = useState({
    packageId: "",
    investigations: [],
  })

  const [isFormValid, setIsFormValid] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedMapping) {
      console.log("Selected Mapping Data:", {
        ...selectedMapping,
        investigations: getSelectedInvestigations(selectedMapping.investigations),
      })
    }
  }, [selectedMapping])

  useEffect(() => {
    setIsFormValid(!!formData.packageId && formData.investigations.length > 0)
  }, [formData])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      await Promise.all([fetchMappings(), fetchInvestigations(), fetchPackages()])
    } catch (error) {
      console.error("Error fetching initial data:", error)
      showPopup("Failed to load data", "error")
    } finally {
      setLoading(false)
    }
  }

  const fetchMappings = async () => {
    try {
      const response = await getRequest(`${INVESTIGATION_PACKAGE_Mapping}/getAll/0`)
      if (response && response.response) {
        console.log("Mappings Data:", response.response)
        setMappingList(response.response)
      }
    } catch (error) {
      console.error("Error fetching mappings:", error)
      throw error
    }
  }

  const fetchInvestigations = async () => {
    try {
      const response = await getRequest(`${MAS_INVESTIGATION}/getAll/1`)
      if (response && response.response) {
        console.log("Investigations Data:", response.response)
        setInvestigationList(response.response)
      }
    } catch (error) {
      console.error("Error fetching investigations:", error)
      throw error
    }
  }

  const fetchPackages = async () => {
    try {
      const response = await getRequest(`${INVESTIGATION_PACKAGE_API}/getAllPackInvestigation/1`)
      if (response && response.response) {
        setPackageList(response.response)
      }
    } catch (error) {
      console.error("Error fetching packages:", error)
      throw error
    }
  }

  const fetchInvestigationsByPackageId = async (packageId) => {
    try {
      const response = await getRequest(`${INVESTIGATION_PACKAGE_Mapping}/getByPackageId/${packageId}`)
      if (response && response.response) {
        return response.response.map((mapping) => Number(mapping.investId))
      }
      return []
    } catch (error) {
      console.error("Error fetching investigations by package ID:", error)
      return []
    }
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const filteredMappingList = mappingList.filter((item) => {
    const searchTerm = searchQuery.toLowerCase()
    return (
      item.packName?.toLowerCase().includes(searchTerm) || item.investigationName?.toLowerCase().includes(searchTerm)
    )
  })

  const filteredTotalPages = Math.ceil(filteredMappingList.length / itemsPerPage)
  const currentItems = filteredMappingList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const filteredInvestigations = investigationList.filter(
    (item) =>
      item.invCode?.toLowerCase().includes(investigationSearchQuery.toLowerCase()) ||
      item.investigationName?.toLowerCase().includes(investigationSearchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(investigationSearchQuery.toLowerCase()),
  )

  const handleManageInvestigations = async (mappingItem) => {
    try {
      setLoading(true)
      const packageId = mappingItem.packageId
      const packageName = mappingItem.packName

      const existingInvestigations = await fetchInvestigationsByPackageId(packageId)
      console.log("Fetched investigations for package:", packageId, existingInvestigations)

      setSelectedMapping({
        packageId: packageId,
        packName: packageName,
        investigations: existingInvestigations,
      })

      setShowInvestigationForm(true)
      setInvestigationSearchQuery("")
    } catch (error) {
      console.error("Error loading package investigations:", error)
      showPopup("Failed to load package investigations", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleAddPackage = () => {
    setShowAddForm(true)
    setFormData({
      packageId: "",
      investigations: [],
    })
    setInvestigationSearchQuery("")
  }

  const handleSwitchChange = (mappingItem, newStatus) => {
    setConfirmDialog({
      isOpen: true,
      mappingId: mappingItem.pimId,
      newStatus,
      packageId: mappingItem.packageId,
      packageName: mappingItem.packName,
    })
  }

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.mappingId !== null) {
      try {
        setLoading(true)
        await putRequest(
          `${INVESTIGATION_PACKAGE_Mapping}/updateStatus/${confirmDialog.mappingId}?status=${confirmDialog.newStatus}`,
        )

        // Update all mappings for this package in the local state
        setMappingList((prevData) =>
          prevData.map((item) =>
            item.packageId === confirmDialog.packageId ? { ...item, status: confirmDialog.newStatus } : item,
          ),
        )

        showPopup(
          `All investigations for package "${confirmDialog.packageName}" have been ${
            confirmDialog.newStatus === "y" ? "activated" : "deactivated"
          } successfully!`,
          "success",
        )
      } catch (error) {
        console.error("Error updating status:", error)
        showPopup("Failed to update status", "error")
      } finally {
        setLoading(false)
      }
    }
    setConfirmDialog({
      isOpen: false,
      mappingId: null,
      newStatus: null,
      packageId: null,
      packageName: "",
    })
  }

  const handleInvestigationToggle = (investigationId) => {
    const numId = Number(investigationId)
    if (isNaN(numId)) {
      console.error("Invalid investigation ID:", investigationId)
      return
    }

    if (showAddForm) {
      setFormData((prev) => {
        const newInvestigations = prev.investigations.includes(numId)
          ? prev.investigations.filter((id) => id !== numId)
          : [...prev.investigations, numId]
        return {
          ...prev,
          investigations: newInvestigations,
        }
      })
    } else if (selectedMapping) {
      setSelectedMapping((prev) => ({
        ...prev,
        investigations: prev.investigations.includes(numId)
          ? prev.investigations.filter((id) => id !== numId)
          : [...prev.investigations, numId],
      }))
    }
  }

  const getSelectedInvestigations = (investigationIds) => {
    if (!investigationIds || investigationIds.length === 0) return []
    return investigationIds
      .map((id) => {
        const numId = Number(id)
        if (isNaN(numId)) {
          console.warn("Invalid investigation ID:", id)
          return undefined
        }
        const found = investigationList.find((inv) => Number(inv.investigationId) === numId)
        if (!found) {
          console.warn("Investigation not found for ID:", numId)
        }
        return found
      })
      .filter((inv) => inv !== undefined)
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

  const handleSaveInvestigations = async () => {
    try {
      setLoading(true)
      const packageId = selectedMapping.packageId
      const investigationIds = selectedMapping.investigations.map((id) => Number(id)).filter((id) => !isNaN(id))

      if (investigationIds.length !== selectedMapping.investigations.length) {
        showPopup("Some investigation IDs were invalid", "error")
        return
      }

      const mappingRequest = {
        packageId: Number(packageId),
        investigationIds: investigationIds,
      }

      console.log("Updating package investigations with:", mappingRequest)

      const response = await putRequest(
        `${INVESTIGATION_PACKAGE_Mapping}/updatePackageInvestigations/${packageId}`,
        mappingRequest,
      )

      if (response && (response.response || response.status === 200)) {
        await fetchMappings()
        showPopup("Investigations updated successfully!", "success")
        setShowInvestigationForm(false)
        setSelectedMapping(null)
      } else {
        throw new Error(response?.message || "Failed to update investigations")
      }
    } catch (error) {
      console.error("Error updating investigations:", error)
      showPopup(error.message || "Failed to update investigations", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleSavePackage = async (e) => {
    e.preventDefault()
    if (!isFormValid) {
      showPopup("Please select a package and at least one investigation.", "error")
      return
    }

    try {
      setLoading(true)

      const existingMappings = mappingList.filter((mapping) => mapping.packageId == formData.packageId)
      if (existingMappings.length > 0) {
        showPopup("Package already has investigation mappings. Please edit existing mappings instead.", "error")
        return
      }

      const investigationIds = formData.investigations.map((id) => Number(id)).filter((id) => !isNaN(id))
      if (investigationIds.length !== formData.investigations.length) {
        showPopup("Some investigation IDs were invalid", "error")
        return
      }

      const mappingRequest = {
        packageId: Number(formData.packageId),
        investigationIds: investigationIds,
      }

      const response = await postRequest(`${INVESTIGATION_PACKAGE_Mapping}/add`, mappingRequest)

      if (response && (response.response || response.status === 200)) {
        await fetchMappings()
        showPopup("Package mappings added successfully!", "success")
        setShowAddForm(false)
        setFormData({
          packageId: "",
          investigations: [],
        })
      } else {
        throw new Error("Failed to save package mappings")
      }
    } catch (error) {
      console.error("Error saving package mappings:", error)
      showPopup("Failed to save package mappings. Please try again.", "error")
    } finally {
      setLoading(false)
    }
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

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">Package Investigation Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showInvestigationForm && !showAddForm && (
                  <>
                    <form className="d-inline-block searchform me-4" role="search">
                      <div className="input-group searchinput">
                        <input
                          type="search"
                          className="form-control"
                          placeholder="Search by package or investigation name"
                          aria-label="Search"
                          value={searchQuery}
                          onChange={handleSearchChange}
                        />
                        <span className="input-group-text" id="search-icon">
                          <i className="fa fa-search"></i>
                        </span>
                      </div>
                    </form>
                    <button type="button" className="btn btn-success me-2" onClick={handleAddPackage}>
                      <i className="mdi mdi-plus"></i> Add
                    </button>
                    {/* <button type="button" className="btn btn-success me-2">
                      <i className="mdi mdi-plus"></i> Generate Report
                    </button> */}
                  </>
                )}
              </div>
            </div>

            <div className="card-body">
              {!showInvestigationForm && !showAddForm ? (
                <div className="table-responsive packagelist">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Package Name</th>
                        <th>Investigation Name</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.length > 0 ? (
                        currentItems.map((item) => (
                          <tr key={item.pimId}>
                            <td>
                              <strong>{item.packName || "N/A"}</strong>
                            </td>
                            <td>{item.investigationName || "No investigation"}</td>
                            <td>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={item.status === "y"}
                                  onChange={() => handleSwitchChange(item, item.status === "y" ? "n" : "y")}
                                  id={`switch-${item.pimId}`}
                                />
                                <label
                                  className="form-check-label px-0"
                                  htmlFor={`switch-${item.pimId}`}
                                  onClick={() => handleSwitchChange(item, item.status === "y" ? "n" : "y")}
                                >
                                  {item.status === "y" ? "Active" : "Deactivated"}
                                </label>
                              </div>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleManageInvestigations(item)}
                                disabled={item.status !== "y"}
                              >
                                <i className="fa fa-pencil"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center">
                            No package investigation mappings found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : showAddForm ? (
                <form className="forms row" onSubmit={handleSavePackage}>
                  <div className="d-flex justify-content-end">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                      <i className="mdi mdi-arrow-left"></i> Back
                    </button>
                  </div>

                  <div className="row">
                    <div className="form-group col-md-6 mt-3">
                      <label>
                        Package Name <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-control"
                        id="packageId"
                        onChange={handleInputChange}
                        value={formData.packageId}
                        required
                      >
                        <option value="">Select Package</option>
                        {packageList.map((pkg) => (
                          <option key={pkg.packId} value={pkg.packId}>
                            {pkg.packName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row mt-4">
                    <div className="col-md-6">
                      <div className="card">
                        <div className="card-header">
                          <h6>Available Investigations</h6>
                          <div className="mt-2">
                            <input
                              type="search"
                              className="form-control"
                              placeholder="Search investigations..."
                              value={investigationSearchQuery}
                              onChange={(e) => setInvestigationSearchQuery(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="card-body" style={{ maxHeight: "300px", overflowY: "auto" }}>
                          {filteredInvestigations.map((investigation) => (
                            <div key={`add-inv-${investigation.investigationId}`} className="form-check mb-2">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`add-inv-${investigation.investigationId}`}
                                checked={formData.investigations.includes(Number(investigation.investigationId))}
                                onChange={() => handleInvestigationToggle(investigation.investigationId)}
                              />
                              <label className="form-check-label" htmlFor={`add-inv-${investigation.investigationId}`}>
                                {investigation.investigationName}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="card">
                        <div className="card-header">
                          <h6>Selected Investigations ({formData.investigations.length})</h6>
                        </div>
                        <div className="card-body" style={{ maxHeight: "300px", overflowY: "auto" }}>
                          {formData.investigations.length > 0 ? (
                            getSelectedInvestigations(formData.investigations).map((investigation, index) => (
                              <div
                                key={`selected-add-inv-${investigation.investigationId}`}
                                className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded"
                              >
                                <div>
                                  <span className="badge bg-primary me-2">{index + 1}</span>
                                  {investigation.investigationName}
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleInvestigationToggle(investigation.investigationId)}
                                >
                                  <i className="fa fa-times"></i>
                                </button>
                              </div>
                            ))
                          ) : (
                            <p className="text-muted">No investigations selected</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                    <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                      Save
                    </button>
                    <button type="button" className="btn btn-danger" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="investigation-management">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <h5>
                        Managing Investigations for: <strong>{selectedMapping?.packName}</strong>
                      </h5>
                      <p className="text-muted">
                        Currently selected: {selectedMapping?.investigations?.length || 0} investigation(s)
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowInvestigationForm(false)
                        setSelectedMapping(null)
                      }}
                    >
                      <i className="mdi mdi-arrow-left"></i> Back
                    </button>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="card">
                        <div className="card-header">
                          <h6>Available Investigations</h6>
                          <div className="mt-2">
                            <input
                              type="search"
                              className="form-control"
                              placeholder="Search investigations..."
                              value={investigationSearchQuery}
                              onChange={(e) => setInvestigationSearchQuery(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="card-body" style={{ maxHeight: "400px", overflowY: "auto" }}>
                          {filteredInvestigations.map((investigation) => (
                            <div key={`inv-${investigation.investigationId}`} className="form-check mb-2">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`inv-${investigation.investigationId}`}
                                checked={selectedMapping?.investigations?.includes(
                                  Number(investigation.investigationId),
                                )}
                                onChange={() => handleInvestigationToggle(investigation.investigationId)}
                              />
                              <label className="form-check-label" htmlFor={`inv-${investigation.investigationId}`}>
                                {investigation.investigationName}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="card">
                        <div className="card-header">
                          <h6>Selected Investigations ({selectedMapping?.investigations?.length || 0})</h6>
                        </div>
                        <div className="card-body" style={{ maxHeight: "400px", overflowY: "auto" }}>
                          {selectedMapping?.investigations?.length > 0 ? (
                            getSelectedInvestigations(selectedMapping.investigations).map((investigation, index) => (
                              <div
                                key={`selected-inv-${investigation.investigationId}`}
                                className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded"
                              >
                                <div>
                                  <span className="badge bg-primary me-2">{index + 1}</span>
                                  {investigation.investigationName}
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleInvestigationToggle(investigation.investigationId)}
                                >
                                  <i className="fa fa-times"></i>
                                </button>
                              </div>
                            ))
                          ) : (
                            <p className="text-muted">No investigations selected</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end mt-3">
                    <button type="button" className="btn btn-primary me-2" onClick={handleSaveInvestigations}>
                      Save Changes
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => {
                        setShowInvestigationForm(false)
                        setSelectedMapping(null)
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {confirmDialog.isOpen && (
                <div className="modal d-block" tabIndex="-1" role="dialog">
                  <div className="modal-dialog" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Package Status Change</h5>
                        <button type="button" className="close" onClick={() => handleConfirm(false)}>
                          <span>&times;</span>
                        </button>
                      </div>
                      <div className="modal-body">
                        <p>
                          <strong>Warning:</strong> This action will{" "}
                          {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}
                          <strong> ALL investigations</strong> for the package "{confirmDialog.packageName}".
                        </p>
                        <p>Are you sure you want to continue?</p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>
                          Cancel
                        </button>
                        <button
                          type="button"
                          className={`btn ${confirmDialog.newStatus === "y" ? "btn-success" : "btn-warning"}`}
                          onClick={() => handleConfirm(true)}
                        >
                          {confirmDialog.newStatus === "y" ? "Activate All" : "Deactivate All"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {popupMessage && (
                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
              )}

              {!showInvestigationForm && !showAddForm && (
                <nav className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    <span>
                      Page {currentPage} of {filteredTotalPages} | Total Records: {filteredMappingList.length}
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

export default PackageInvestigationMaster
