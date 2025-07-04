"use client"

import { useState } from "react"
import Popup from "../../../Components/popup"

const PackageInvestigationMaster = () => {
  const [packageList, setPackageList] = useState([
    {
      id: 1,
      package_code: "FBC001",
      package_name: "Full Body Checkup",
      status: "y",
      investigations: [1, 3, 5], // Selected investigation IDs
    },
    {
      id: 2,
      package_code: "CBC002",
      package_name: "Cardiac Care Basic",
      status: "y",
      investigations: [2, 4],
    },
    {
      id: 3,
      package_code: "DHC003",
      package_name: "Diabetes Health Check",
      status: "y",
      investigations: [1, 2, 6],
    },
    {
      id: 4,
      package_code: "WHC004",
      package_name: "Women's Health Complete",
      status: "n",
      investigations: [3, 5, 7, 8],
    },
  ])

  const [investigationList] = useState([
    { id: 1, inv_code: "INV101", inv_name: "Complete Blood Count", category: "Hematology" },
    { id: 2, inv_code: "INV102", inv_name: "Lipid Profile", category: "Biochemistry" },
    { id: 3, inv_code: "INV103", inv_name: "Liver Function Test", category: "Biochemistry" },
    { id: 4, inv_code: "INV104", inv_name: "ECG", category: "Cardiology" },
    { id: 5, inv_code: "INV105", inv_name: "Chest X-Ray", category: "Radiology" },
    { id: 6, inv_code: "INV106", inv_name: "HbA1c", category: "Biochemistry" },
    { id: 7, inv_code: "INV107", inv_name: "Pap Smear", category: "Pathology" },
    { id: 8, inv_code: "INV108", inv_name: "Mammography", category: "Radiology" },
    { id: 9, inv_code: "INV109", inv_name: "Thyroid Profile", category: "Biochemistry" },
    { id: 10, inv_code: "INV110", inv_name: "Urine Analysis", category: "Pathology" },
  ])

  const [packageTypes] = useState([
    { id: 1, type: "Health Checkup", code_prefix: "HC" },
    { id: 2, type: "Cardiac Care", code_prefix: "CC" },
    { id: 3, type: "Diabetes Care", code_prefix: "DC" },
    { id: 4, type: "Women's Health", code_prefix: "WH" },
    { id: 5, type: "Men's Health", code_prefix: "MH" },
    { id: 6, type: "Senior Citizen", code_prefix: "SC" },
    { id: 7, type: "Pediatric Care", code_prefix: "PC" },
  ])

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, packageId: null, newStatus: false })
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [showInvestigationForm, setShowInvestigationForm] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [investigationSearchQuery, setInvestigationSearchQuery] = useState("")
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const itemsPerPage = 5

  const [formData, setFormData] = useState({
    packageName: "",
    investigations: [],
  })

  const [isFormValid, setIsFormValid] = useState(false)

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  // Create expanded rows for each package-investigation combination
  const getExpandedPackageList = () => {
    const expandedList = []
    packageList.forEach((pkg) => {
      if (pkg.investigations.length > 0) {
        pkg.investigations.forEach((invId) => {
          const investigation = investigationList.find((inv) => inv.id === invId)
          if (investigation) {
            expandedList.push({
              ...pkg,
              investigation: investigation,
              uniqueId: `${pkg.id}-${invId}`,
            })
          }
        })
      } else {
        // If no investigations, still show the package
        expandedList.push({
          ...pkg,
          investigation: null,
          uniqueId: `${pkg.id}-empty`,
        })
      }
    })
    return expandedList
  }

  const filteredPackageList = getExpandedPackageList().filter(
    (item) =>
      item.package_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.package_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.investigation &&
        (item.investigation.inv_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.investigation.inv_name.toLowerCase().includes(searchQuery.toLowerCase()))),
  )

  const filteredTotalPages = Math.ceil(filteredPackageList.length / itemsPerPage)
  const currentItems = filteredPackageList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const filteredInvestigations = investigationList.filter(
    (item) =>
      item.inv_code.toLowerCase().includes(investigationSearchQuery.toLowerCase()) ||
      item.inv_name.toLowerCase().includes(investigationSearchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(investigationSearchQuery.toLowerCase()),
  )

  const handleManageInvestigations = (packageItem) => {
    setSelectedPackage(packageItem)
    setShowInvestigationForm(true)
  }

  const handleAddPackage = () => {
    setShowAddForm(true)
    setFormData({
      packageName: "",
      investigations: [],
    })
  }

  const handleEdit = (item) => {
    // Edit functionality - you can implement as needed
    showPopup("Edit functionality to be implemented", "info")
  }

  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, packageId: id, newStatus })
  }

  const handleConfirm = (confirmed) => {
    if (confirmed && confirmDialog.packageId !== null) {
      setPackageList((prevData) =>
        prevData.map((item) =>
          item.id === confirmDialog.packageId ? { ...item, status: confirmDialog.newStatus } : item,
        ),
      )
    }
    setConfirmDialog({ isOpen: false, packageId: null, newStatus: null })
  }

  const handleInvestigationToggle = (investigationId) => {
    if (showAddForm) {
      // For add form
      const investigations = formData.investigations.includes(investigationId)
        ? formData.investigations.filter((id) => id !== investigationId)
        : [...formData.investigations, investigationId]
      setFormData({ ...formData, investigations })
    } else if (selectedPackage) {
      // For manage investigations
      const updatedPackageList = packageList.map((pkg) => {
        if (pkg.id === selectedPackage.id) {
          const investigations = pkg.investigations.includes(investigationId)
            ? pkg.investigations.filter((id) => id !== investigationId)
            : [...pkg.investigations, investigationId]
          return { ...pkg, investigations }
        }
        return pkg
      })

      setPackageList(updatedPackageList)
      setSelectedPackage({
        ...selectedPackage,
        investigations: updatedPackageList.find((pkg) => pkg.id === selectedPackage.id).investigations,
      })
    }
  }

  const getSelectedInvestigations = (investigationIds) => {
    return investigationIds.map((id) => investigationList.find((inv) => inv.id === id)).filter(Boolean)
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

  const handleSaveInvestigations = () => {
    showPopup("Investigations updated successfully!", "success")
    setShowInvestigationForm(false)
    setSelectedPackage(null)
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    const updatedFormData = { ...formData, [id]: value }

    setFormData(updatedFormData)
    setIsFormValid(!!updatedFormData.packageName)
  }

  const handleSavePackage = (e) => {
    e.preventDefault()
    if (!isFormValid) return

    const nextNumber = String(packageList.length + 1).padStart(3, "0")
    const newPackage = {
      id: Date.now(),
      package_code: `PKG${nextNumber}`,
      package_name: formData.packageName,
      status: "y",
      investigations: formData.investigations,
    }

    setPackageList([...packageList, newPackage])
    showPopup("New Package added successfully!", "success")
    setShowAddForm(false)
    setFormData({
      packageName: "",
      investigations: [],
    })
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
              <h4 className="card-title p-2">Package Investigation Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showInvestigationForm && !showAddForm && (
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
                    <button type="button" className="btn btn-success me-2" onClick={handleAddPackage}>
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
              {!showInvestigationForm && !showAddForm ? (
                <div className="table-responsive packagelist">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Package ID-Name</th>
                        <th>Investigation - Name</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((item) => (
                        <tr key={item.uniqueId}>
                          <td>
                            {item.package_code} ({item.package_name})
                          </td>
                          <td>
                            {item.investigation ? (
                              `${item.investigation.inv_code} (${item.investigation.inv_name})`
                            ) : (
                              <span className="text-muted">No investigations</span>
                            )}
                          </td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={item.status === "y"}
                                onChange={() => handleSwitchChange(item.id, item.status === "y" ? "n" : "y")}
                                id={`switch-${item.uniqueId}`}
                              />
                              <label
                                className="form-check-label px-0"
                                htmlFor={`switch-${item.uniqueId}`}
                                onClick={() => handleSwitchChange(item.id, item.status === "y" ? "n" : "y")}
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
                      ))}
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
                        id="packageName"
                        onChange={handleInputChange}
                        value={formData.packageName}
                        required
                      >
                        <option value="">Select Package Name</option>
                        {packageTypes.map((type) => (
                          <option key={type.id} value={type.type}>
                            {type.type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Investigation Selection */}
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
                            <div key={investigation.id} className="form-check mb-2">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`add-inv-${investigation.id}`}
                                checked={formData.investigations.includes(investigation.id)}
                                onChange={() => handleInvestigationToggle(investigation.id)}
                              />
                              <label className="form-check-label" htmlFor={`add-inv-${investigation.id}`}>
                                <strong>{investigation.inv_code}</strong> - {investigation.inv_name}
                                <br />
                                <small className="text-muted">Category: {investigation.category}</small>
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
                                key={investigation.id}
                                className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded"
                              >
                                <div>
                                  <span className="badge bg-primary me-2">{index + 1}</span>
                                  <strong>{investigation.inv_code}</strong> - {investigation.inv_name}
                                  <br />
                                  <small className="text-muted">Category: {investigation.category}</small>
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleInvestigationToggle(investigation.id)}
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
                        Managing Investigations for: <strong>{selectedPackage.package_code}</strong>
                      </h5>
                      <p className="text-muted">{selectedPackage.package_name}</p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowInvestigationForm(false)
                        setSelectedPackage(null)
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
                            <div key={investigation.id} className="form-check mb-2">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`inv-${investigation.id}`}
                                checked={selectedPackage.investigations.includes(investigation.id)}
                                onChange={() => handleInvestigationToggle(investigation.id)}
                              />
                              <label className="form-check-label" htmlFor={`inv-${investigation.id}`}>
                                <strong>{investigation.inv_code}</strong> - {investigation.inv_name}
                                <br />
                                <small className="text-muted">Category: {investigation.category}</small>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="card">
                        <div className="card-header">
                          <h6>Selected Investigations ({selectedPackage.investigations.length})</h6>
                        </div>
                        <div className="card-body" style={{ maxHeight: "400px", overflowY: "auto" }}>
                          {selectedPackage.investigations.length > 0 ? (
                            getSelectedInvestigations(selectedPackage.investigations).map((investigation) => (
                              <div
                                key={investigation.id}
                                className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded"
                              >
                                <div>
                                  <strong>{investigation.inv_code}</strong> - {investigation.inv_name}
                                  <br />
                                  <small className="text-muted">Category: {investigation.category}</small>
                                </div>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleInvestigationToggle(investigation.id)}
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
                    <button type="button" className="btn btn-danger" onClick={() => setShowInvestigationForm(false)}>
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
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button type="button" className="close" onClick={() => handleConfirm(false)}>
                          <span>&times;</span>
                        </button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                          <strong>
                            {packageList.find((item) => item.id === confirmDialog.packageId)?.package_name}
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

              {popupMessage && (
                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
              )}

              {!showInvestigationForm && !showAddForm && (
                <nav className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    <span>
                      Page {currentPage} of {filteredTotalPages} | Total Records: {filteredPackageList.length}
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
