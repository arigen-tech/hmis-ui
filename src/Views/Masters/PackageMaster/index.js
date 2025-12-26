import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import LoadingScreen from "../../../Components/Loading"
import { postRequest, putRequest, getRequest } from "../../../service/apiService"

import { INVESTIGATION_PACKAGE_API } from "../../../config/apiConfig";
import {
  FETCH_PACKAGE_ERR_MSG,
  UPDATE_PACKAGE_SUCC_MSG,
  ADD_PACKAGE_SUCC_MSG,
  VALID_BASE_COST,DISCOUNT_CANOT_NAGATIVE,DISCOUNT_PERCENTAGE
} from "../../../config/constants"

const PackageMaster = () => {
  const [packageData, setPackageData] = useState([])
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, packageId: null, newStatus: false })
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    packName: "",
    descrp: "",
    baseCost: "",
    disc: "",
    discPer: "",
    actualCost: "",
    fromDt: "",
    toDt: "",
    category: "",
    discFlag: "y",
  })
  const [dateError, setDateError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingPackage, setEditingPackage] = useState(null)
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [filteredTotalPages, setFilteredTotalPages] = useState(1)
  const [totalFilteredProducts, setTotalFilteredProducts] = useState(0)
  const [itemsPerPage] = useState(5)
  const [pageInput, setPageInput] = useState(1)

  useEffect(() => {
    fetchPackageData(0)
  }, [])

  const fetchPackageData = async (flag = 0) => {
    try {
      setLoading(true)
      const response = await getRequest(`${INVESTIGATION_PACKAGE_API}/getAllPackInvestigation/${flag}`)
      if (response && response.response) {
        setPackageData(response.response)
        setTotalFilteredProducts(response.response.length)
        setFilteredTotalPages(Math.ceil(response.response.length / itemsPerPage))
      }
    } catch (err) {
      console.error("Error fetching Package data:", err)
      showPopup(FETCH_PACKAGE_ERR_MSG, "error")
    } finally {
      setLoading(false)
    }
  }

  const validateDates = () => {
    if (formData.toDt && formData.fromDt && new Date(formData.toDt) < new Date(formData.fromDt)) {
      setDateError("To date cannot be before From date")
      return false
    }
    setDateError("")
    return true
  }

  const calculateActualCost = (baseCost, disc, discPer) => {
    const base = Number.parseFloat(baseCost) || 0
    const flatDiscount = Number.parseFloat(disc) || 0
    const discountPercentage = Number.parseFloat(discPer) || 0

    const afterFlatDiscount = base - flatDiscount
    const percentageDiscount = (afterFlatDiscount * discountPercentage) / 100
    const actualCost = afterFlatDiscount - percentageDiscount

    return Math.max(0, actualCost).toFixed(2)
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const filteredPackageData = packageData.filter(
    (pkg) =>
      pkg.packName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.descrp.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredPackageData.slice(indexOfFirstItem, indexOfLastItem)

  const handleEdit = (pkg) => {
    setEditingPackage(pkg)
    setFormData({
      packName: pkg.packName,
      descrp: pkg.descrp,
      baseCost: pkg.baseCost.toString(),
      disc: pkg.disc.toString(),
      discPer: pkg.discPer.toString(),
      actualCost: pkg.actualCost.toString(),
      fromDt: pkg.fromDt,
      toDt: pkg.toDt || "",
      category: pkg.category,
      discFlag: pkg.discFlag,
    })
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()

    if (!validateDates()) return

    // Validate costs
    const baseCostValue = Number.parseFloat(formData.baseCost)
    const discValue = Number.parseFloat(formData.disc) || 0
    const discPerValue = Number.parseFloat(formData.discPer) || 0

    if (isNaN(baseCostValue) || baseCostValue < 0) {
      showPopup(VALID_BASE_COST, "error")
      return
    }

    if (discValue < 0) {
      showPopup(DISCOUNT_CANOT_NAGATIVE, "error")
      return
    }

    if (discPerValue < 0 || discPerValue > 100) {
      showPopup(DISCOUNT_PERCENTAGE, "error")
      return
    }

    try {
      setLoading(true)

      const actualCost = calculateActualCost(formData.baseCost, formData.disc, formData.discPer)

      const payload = {
        packName: formData.packName,
        descrp: formData.descrp,
        baseCost: baseCostValue,
        disc: discValue,
        discPer: discPerValue,
        actualCost: Number.parseFloat(actualCost),
        fromDt: formData.fromDt,
        toDt: formData.toDt || null,
        category: formData.category,
        discFlag: formData.discFlag,
        status: editingPackage ? editingPackage.status : "y",
      }

      let response
      if (editingPackage) {
        response = await putRequest(`${INVESTIGATION_PACKAGE_API}/update/${editingPackage.packId}`, payload)
        if (response && response.response) {
          setPackageData((prevData) =>
            prevData.map((pkg) => (pkg.packId === editingPackage.packId ? response.response : pkg)),
          )
          showPopup(UPDATE_PACKAGE_SUCC_MSG, "success")
        }
      } else {
        response = await postRequest(`${INVESTIGATION_PACKAGE_API}/add`, payload)
        if (response && response.response) {
          setPackageData((prevData) => [...prevData, response.response])
          showPopup(ADD_PACKAGE_SUCC_MSG, "success")
        }
      }

      setEditingPackage(null)
      setFormData({
        packName: "",
        descrp: "",
        baseCost: "",
        disc: "",
        discPer: "",
        actualCost: "",
        fromDt: "",
        toDt: "",
        category: "",
        discFlag: "y",
      })
      setShowForm(false)
      fetchPackageData()
    } catch (err) {
      console.error("Error saving Package data:", err)
      const errorMessage = err.response?.data?.message || err.message || "Failed to save changes due to server error"
      showPopup(errorMessage, "error")
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

  const handleSwitchChange = (packId, newStatus) => {
    setConfirmDialog({ isOpen: true, packageId: packId, newStatus })
  }

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.packageId !== null) {
      try {
        setLoading(true)

        const response = await putRequest(
          `${INVESTIGATION_PACKAGE_API}/status/${confirmDialog.packageId}?status=${confirmDialog.newStatus}`,
        )

        if (response && response.response) {
          setPackageData((prevData) =>
            prevData.map((pkg) =>
              pkg.packId === confirmDialog.packageId ? { ...pkg, status: confirmDialog.newStatus } : pkg,
            ),
          )
          showPopup(`Package ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`, "success")
        }
      } catch (err) {
        console.error("Error updating Package status:", err)
        const errorMessage = err.response?.data?.message || err.message || "Failed to update status due to server error"
        showPopup(errorMessage, "error")
      } finally {
        setLoading(false)
      }
    }
    setConfirmDialog({ isOpen: false, packageId: null, newStatus: null })
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    const updatedFormData = { ...formData, [id]: value }

    // Auto-calculate actual cost when base cost, discount, or discount percentage changes
    if (id === "baseCost" || id === "disc" || id === "discPer") {
      const actualCost = calculateActualCost(
        id === "baseCost" ? value : formData.baseCost,
        id === "disc" ? value : formData.disc,
        id === "discPer" ? value : formData.discPer,
      )
      updatedFormData.actualCost = actualCost
    }

    setFormData(updatedFormData)
  }

  const handleSelectChange = (e) => {
    const { id, value } = e.target
    setFormData((prevData) => ({ ...prevData, [id]: value }))
  }

  const handleDateChange = (e) => {
    const { id, value } = e.target
    setFormData((prevData) => ({ ...prevData, [id]: value }))
    validateDates()
  }

  const handleRefresh = () => {
    setSearchQuery("")
    setCurrentPage(1)
    fetchPackageData()
  }

  const handlePageNavigation = () => {
    const pageNumber = Number(pageInput)
    if (pageNumber >= 1 && pageNumber <= filteredTotalPages) {
      setCurrentPage(pageNumber)
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
              <h4 className="card-title">Investigation Package Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm ? (
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
                ) : (
                  <></>
                )}
                <div className="d-flex align-items-center">
                  {!showForm ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={() => {
                          setEditingPackage(null)
                          setFormData({
                            packName: "",
                            descrp: "",
                            baseCost: "",
                            disc: "",
                            discPer: "",
                            actualCost: "",
                            fromDt: "",
                            toDt: "",
                            category: "",
                            discFlag: "y",
                          })
                          setShowForm(true)
                        }}
                      >
                        <i className="mdi mdi-plus"></i> Add
                      </button>
                      <button type="button" className="btn btn-success me-2 flex-shrink-0" onClick={handleRefresh}>
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
                <div className="table-responsive packagelist">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Package Name</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Base Cost</th>
                        <th>Flat Discount</th>
                        <th>Discount %</th>
                        <th>Actual Cost</th>
                        <th>From Date</th>
                        <th>To Date</th>
                        {/* <th>Discount Flag</th> */}
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.length > 0 ? (
                        currentItems.map((pkg) => (
                          <tr key={pkg.packId}>
                            <td>{pkg.packName}</td>
                            <td>{pkg.descrp}</td>
                            <td>{pkg.category}</td>
                            <td>₹{pkg.baseCost.toFixed(2)}</td>
                            <td>₹{pkg.disc.toFixed(2)}</td>
                            <td>{pkg.discPer.toFixed(2)}%</td>
                            <td>₹{pkg.actualCost.toFixed(2)}</td>
                            <td>{pkg.fromDt}</td>
                            <td>{pkg.toDt || "NULL"}</td>
                            {/* <td style={{ textTransform: "uppercase" }}>{pkg.discFlag}</td> */}
                            <td>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={pkg.status === "y"}
                                  onChange={() => handleSwitchChange(pkg.packId, pkg.status === "y" ? "n" : "y")}
                                  id={`switch-${pkg.packId}`}
                                />
                                <label className="form-check-label px-0" htmlFor={`switch-${pkg.packId}`}>
                                  {pkg.status === "y" ? "Active" : "Deactivated"}
                                </label>
                              </div>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleEdit(pkg)}
                                disabled={pkg.status !== "y"}
                              >
                                <i className="fa fa-pencil"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="12" className="text-center">
                            No Package data found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {filteredPackageData.length > 0 && (
                    <nav className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        <span>
                          Page {currentPage} of {filteredTotalPages} | Total Records: {filteredPackageData.length}
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
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="row">
                    <div className="form-group col-md-4">
                      <label>
                        Package Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control mt-1"
                        id="packName"
                        placeholder="Package Name"
                        value={formData.packName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4">
                      <label>
                        Description <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className="form-control mt-1"
                        id="descrp"
                        placeholder="Package Description"
                        value={formData.descrp}
                        onChange={handleInputChange}
                        rows="3"
                        required
                      />
                    </div>
                    <div className="form-group col-md-4">
                      <label>
                        Category <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control mt-1"
                        id="category"
                        placeholder="Package Category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4">
                      <label>
                        Base Cost <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control mt-1"
                        id="baseCost"
                        placeholder="Base Cost"
                        value={formData.baseCost}
                        onChange={handleInputChange}
                        min="0"
                        required
                      />
                    </div>
                    <div className="form-group col-md-4">
                      <label>Flat Discount</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control mt-1"
                        id="disc"
                        placeholder="Flat Discount"
                        value={formData.disc}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>
                    <div className="form-group col-md-4">
                      <label>Discount Percentage</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control mt-1"
                        id="discPer"
                        placeholder="Discount Percentage"
                        value={formData.discPer}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                      />
                    </div>
                    <div className="form-group col-md-4">
                      <label>Actual Cost</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control mt-1"
                        id="actualCost"
                        placeholder="Actual Cost"
                        value={formData.actualCost}
                        readOnly
                      />
                    </div>
                    <div className="form-group col-md-4">
                      <label>
                        From Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control mt-1"
                        id="fromDt"
                        value={formData.fromDt}
                        onChange={handleDateChange}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4">
                      <label>To Date</label>
                      <input
                        type="date"
                        className={`form-control mt-1 ${dateError ? "is-invalid" : ""}`}
                        id="toDt"
                        value={formData.toDt}
                        onChange={handleDateChange}
                        min={formData.fromDt || undefined}
                      />
                      {dateError && <div className="invalid-feedback">{dateError}</div>}
                    </div>
                    <div className="form-group col-md-4">
                      <label>
                        Discount Flag <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-control mt-1"
                        id="discFlag"
                        value={formData.discFlag}
                        onChange={handleSelectChange}
                        required
                      >
                        <option value="y">Yes</option>
                        <option value="n">No</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                    <button type="submit" className="btn btn-primary me-2">
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
                          <strong>{packageData.find((pkg) => pkg.packId === confirmDialog.packageId)?.packName}</strong>
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

export default PackageMaster
