import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import Popup from "../../../Components/popup"
import LoadingScreen from "../../../Components/Loading"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination"
import { getRequest, putRequest, postRequest } from "../../../service/apiService"
import { MAS_SURGERY_PRICING, MAS_SURGERY, MAS_IPD_BILLING_TYPE } from "../../../config/apiConfig"
import { ADD_SURGERY_PRICING_SUCC_MSG, UPDATE_SURGERY_PRICING_SUCC_MSG, FAIL_TO_SAVE_CHANGES, FAIL_TO_UPDATE_STS } from "../../../config/constants"

// PortalDropdown component
const PortalDropdown = ({ anchorRef, show, children }) => {
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (!show || !anchorRef?.current) return;

    const updatePosition = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      setStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 99999,
        maxHeight: "250px",
        overflowY: "auto",
        background: "#fff",
        border: "1px solid #dee2e6",
        borderRadius: "4px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [show, anchorRef]);

  if (!show) return null;
  return createPortal(<div style={style}>{children}</div>, document.body);
};

const SurgeryPricing = () => {
  // State for list view
  const [surgeryPricingData, setSurgeryPricingData] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [process, setProcess] = useState(false)

  // Search criteria
  const [surgeryNameSearch, setSurgeryNameSearch] = useState("")
  const [billingTypeSearch, setBillingTypeSearch] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isShowAllLoading, setIsShowAllLoading] = useState(false)

  // Form mode
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [popupMessage, setPopupMessage] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, itemId: null, newStatus: "", itemName: "" })

  // Form data
  const [formData, setFormData] = useState({
    surgeryId: "",
    billingTypeId: "",
    amount: "",
    discountAllowed: "",
    effectiveFrom: "",
    effectiveTo: ""
  })
  const [isFormValid, setIsFormValid] = useState(false)

  // Dropdown options
  const [billingTypeOptions, setBillingTypeOptions] = useState([])
  const discountAllowedOptions = [
    { value: "Y", label: "Yes" },
    { value: "N", label: "No" }
  ]

  // Autocomplete for Surgery Name
  const surgeryInputRef = useRef(null)
  const [showSurgeryDropdown, setShowSurgeryDropdown] = useState(false)
  const [surgerySearchText, setSurgerySearchText] = useState("")
  const [surgeryOptions, setSurgeryOptions] = useState([])
  const [filteredSurgeries, setFilteredSurgeries] = useState([])
  const [isSurgeryLoading, setIsSurgeryLoading] = useState(false)

  // Fetch surgery options for autocomplete
  const fetchSurgeryOptions = async () => {
    setIsSurgeryLoading(true)
    try {
      const data = await getRequest(`${MAS_SURGERY}/getAll/0`)
      if (data.status === 200 && data.response) {
        setSurgeryOptions(data.response)
      }
    } catch (error) {
      console.error("Error fetching surgery options:", error)
    } finally {
      setIsSurgeryLoading(false)
    }
  }

  // Filter surgeries based on search text
  useEffect(() => {
    if (!surgerySearchText.trim()) {
      setFilteredSurgeries([])
      return
    }
    const filtered = surgeryOptions.filter(surg =>
      surg.surgeryName?.toLowerCase().includes(surgerySearchText.toLowerCase())
    )
    setFilteredSurgeries(filtered)
  }, [surgerySearchText, surgeryOptions])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (surgeryInputRef.current && !surgeryInputRef.current.contains(event.target)) {
        setShowSurgeryDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Handle search input change
  const handleSurgerySearch = (e) => {
    const value = e.target.value
    setSurgerySearchText(value)
    setShowSurgeryDropdown(value.trim() !== "")
  }

  // Handle selection from dropdown
  const handleSurgerySelect = (surgery) => {
    setSurgerySearchText(surgery.surgeryName)
    setFormData(prev => ({ ...prev, surgeryId: surgery.surgeryId.toString() }))
    setShowSurgeryDropdown(false)
  }

  // Fetch billing type options
  const fetchBillingTypeOptions = async () => {
    try {
      const data = await getRequest(`${MAS_IPD_BILLING_TYPE}/getAll/1`)
      if (data.status === 200 && Array.isArray(data.response)) {
        setBillingTypeOptions(data.response)
      }
    } catch (error) {
      console.error("Error fetching billing types:", error)
    }
  }

  // Fetch surgery pricing list with pagination and filters
  const fetchSurgeryPricingData = async (page = 0, isInitialLoad = false) => {
    if (isInitialLoad) setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("page", page)
      params.append("size", DEFAULT_ITEMS_PER_PAGE)
      if (billingTypeSearch) params.append("billingTypeId", billingTypeSearch)
      if (surgeryNameSearch) params.append("surgeryName", surgeryNameSearch)

      const data = await getRequest(`${MAS_SURGERY_PRICING}/getAll?${params.toString()}`)
      
      if (data.status === 200 && data.response) {
        setSurgeryPricingData(data.response.content || [])
        setTotalItems(data.response.totalElements || 0)
        setTotalPages(data.response.totalPages || 0)
      } else {
        setSurgeryPricingData([])
        setTotalItems(0)
        setTotalPages(0)
      }
    } catch (error) {
      console.error("Error fetching surgery pricing data:", error)
      setSurgeryPricingData([])
      showPopup("Failed to fetch data", "error")
    } finally {
      if (isInitialLoad) setLoading(false)
      setIsSearching(false)
      setIsShowAllLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchSurgeryPricingData(0, true)
    fetchSurgeryOptions()
    fetchBillingTypeOptions()
  }, [])

  // Re-fetch when search criteria change
  useEffect(() => {
    if (!showForm) {
      fetchSurgeryPricingData(0, false)
      setCurrentPage(1)
    }
  }, [surgeryNameSearch, billingTypeSearch])

  // Search handlers
  const handleSearch = () => {
    if (!surgeryNameSearch.trim() && !billingTypeSearch) {
      showPopup("Please enter at least one search criterion", "warning")
      return
    }
    setIsSearching(true)
    setCurrentPage(1)
    fetchSurgeryPricingData(0, false)
  }

  const handleShowAll = () => {
    setIsShowAllLoading(true)
    setSurgeryNameSearch("")
    setBillingTypeSearch("")
    setCurrentPage(1)
    fetchSurgeryPricingData(0, false)
  }

  // Pagination
  const handlePageChange = (page) => {
    setCurrentPage(page)
    fetchSurgeryPricingData(page - 1, false)
  }

  // Form handling
  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  // Validate form
  useEffect(() => {
    const requiredValid = 
      formData.surgeryId !== "" &&
      formData.billingTypeId !== "" &&
      formData.amount !== "" &&
      !isNaN(parseFloat(formData.amount)) &&
      parseFloat(formData.amount) > 0 &&
      formData.effectiveFrom !== "" &&
      formData.discountAllowed !== ""
    
    let toDateValid = true
    if (formData.effectiveTo) {
      toDateValid = new Date(formData.effectiveTo) >= new Date(formData.effectiveFrom)
    }
    setIsFormValid(requiredValid && toDateValid)
  }, [formData])

  const handleAddClick = () => {
    setEditingItem(null)
    setFormData({
      surgeryId: "",
      billingTypeId: "",
      amount: "",
      discountAllowed: "",
      effectiveFrom: "",
      effectiveTo: ""
    })
    setSurgerySearchText("")
    setShowSurgeryDropdown(false)
    setShowForm(true)
  }

  const handleEdit = async (item) => {
    setEditingItem(item)
    setFormData({
      surgeryId: item.surgeryId?.toString() || "",
      billingTypeId: item.billingTypeId?.toString() || "",
      amount: item.amount?.toString() || "",
      discountAllowed: item.discountAllowed || "",
      effectiveFrom: item.effectiveFrom || "",
      effectiveTo: item.effectiveTo || ""
    })
    setSurgerySearchText(item.surgeryName || "")
    setShowSurgeryDropdown(false)
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!isFormValid) return
    setProcess(true)

    const payload = {
      surgeryId: parseInt(formData.surgeryId, 10),
      billingTypeId: parseInt(formData.billingTypeId, 10),
      amount: parseFloat(formData.amount),
      discountAllowed: formData.discountAllowed,
      effectiveFrom: formData.effectiveFrom,
      effectiveTo: formData.effectiveTo || null
    }

    try {
      let response
      if (editingItem) {
        response = await putRequest(
          `${MAS_SURGERY_PRICING}/update/${editingItem.surgeryPricingId}`,
          payload
        )
        if (response.status === 200) {
          setPopupMessage({
            message: "Surgery pricing updated successfully!",
            type: "success",
            onClose: () => {
              setPopupMessage(null)
              resetForm()
              fetchSurgeryPricingData(0, false)
              setCurrentPage(1)
            }
          })
        } else {
          throw new Error(response.message || "Update failed")
        }
      } else {
        response = await postRequest(`${MAS_SURGERY_PRICING}/create`, payload)
        if (response.status === 201 || response.status === 200) {
          setPopupMessage({
            message: "Surgery pricing added successfully!",
            type: "success",
            onClose: () => {
              setPopupMessage(null)
              resetForm()
              fetchSurgeryPricingData(0, false)
              setCurrentPage(1)
            }
          })
        } else {
          throw new Error(response.message || "Save failed")
        }
      }
    } catch (error) {
      console.error("Error saving surgery pricing:", error)
      showPopup(FAIL_TO_SAVE_CHANGES, "error")
    } finally {
      setProcess(false)
    }
  }

  const resetForm = () => {
    setEditingItem(null)
    setShowForm(false)
    setFormData({
      surgeryId: "",
      billingTypeId: "",
      amount: "",
      discountAllowed: "",
      effectiveFrom: "",
      effectiveTo: ""
    })
    setSurgerySearchText("")
  }

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) })
  }

  // Status toggle
  const handleSwitchChange = (id, name, newStatus) => {
    setConfirmDialog({ 
      isOpen: true, 
      itemId: id, 
      newStatus, 
      itemName: name 
    })
  }

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.itemId) {
      setProcess(true)
      try {
        const response = await putRequest(
          `${MAS_SURGERY_PRICING}/status/${confirmDialog.itemId}?status=${confirmDialog.newStatus}`
        )
        if (response.status === 200) {
          setPopupMessage({
            message: `Surgery pricing ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
            type: "success",
            onClose: () => {
              setPopupMessage(null)
              fetchSurgeryPricingData(currentPage - 1, false)
            }
          })
        } else {
          throw new Error(response.message || "Failed to update status")
        }
      } catch (error) {
        console.error("Error updating status:", error)
        showPopup(FAIL_TO_UPDATE_STS, "error")
      } finally {
        setProcess(false)
      }
    }
    setConfirmDialog({ isOpen: false, itemId: null, newStatus: "", itemName: "" })
  }

  // Format date for display (dd/mm/yyyy)
  const formatDate = (dateString) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Surgery Pricing Master</h4>
              <div className="d-flex align-items-center">
                {!showForm && (
                  <>
                    <button type="button" className="btn btn-success me-2" onClick={handleAddClick}>
                      <i className="mdi mdi-plus"></i> Add
                    </button>
                    <button type="button" className="btn btn-success me-2" onClick={handleShowAll} disabled={isShowAllLoading}>
                      {isShowAllLoading ? <><span className="spinner-border spinner-border-sm me-2" />Loading...</> : <><i className="mdi mdi-refresh"></i> Show All</>}
                    </button>
                  </>
                )}
                {showForm && (
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>
                    <i className="mdi mdi-arrow-left"></i> Back
                  </button>
                )}
              </div>
            </div>

            <div className="card-body">
              {loading ? (
                <LoadingScreen />
              ) : !showForm ? (
                <>
                  {/* Search Section */}
                  <div className="d-flex align-items-center gap-2 mb-4 flex-wrap">
                    <div className="col-md-3">
                      <label className="mb-1"><b>Surgery Name</b></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by surgery name..."
                        value={surgeryNameSearch}
                        onChange={(e) => setSurgeryNameSearch(e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="mb-1"><b>Billing Type</b></label>
                      <select
                        className="form-select"
                        value={billingTypeSearch}
                        onChange={(e) => setBillingTypeSearch(e.target.value)}
                      >
                        <option value="">All</option>
                        {billingTypeOptions.map(opt => (
                          <option key={opt.billingTypeId} value={opt.billingTypeId}>{opt.billingTypeName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-2" style={{ marginTop: '28px' }}>
                      <button
                        type="button"
                        className="btn btn-primary me-2"
                        onClick={handleSearch}
                        disabled={isSearching}
                      >
                        {isSearching ? <><span className="spinner-border spinner-border-sm me-2" />Searching...</> : "Search"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleShowAll}
                        disabled={isShowAllLoading}
                      >
                        {isShowAllLoading ? <><span className="spinner-border spinner-border-sm me-2" />Show All...</> : "Show All"}
                      </button>
                    </div>
                  </div>

                  {/* Data Table */}
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Surgery Name</th>
                          <th>Billing Type</th>
                          <th>Amount (₹)</th>
                          <th>Discount Allowed</th>
                          <th>Effective From</th>
                          <th>Effective To</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {surgeryPricingData.length > 0 ? (
                          surgeryPricingData.map(item => {
                            const discountAllowedLabel = item.discountAllowed === "Y" ? "Yes" : "No"
                            return (
                              <tr key={item.surgeryPricingId}>
                                <td>{item.surgeryName || '-'}</td>
                                <td>{item.billingTypeName || '-'}</td>
                                <td>₹{item.amount?.toLocaleString() || 0}</td>
                                <td>{discountAllowedLabel}</td>
                                <td>{formatDate(item.effectiveFrom)}</td>
                                <td>{formatDate(item.effectiveTo)}</td>
                                <td>
                                  <div className="form-check form-switch">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      checked={item.status === "y"}
                                      onChange={() => handleSwitchChange(
                                        item.surgeryPricingId,
                                        item.surgeryName,
                                        item.status === "y" ? "n" : "y"
                                      )}
                                      id={`switch-${item.surgeryPricingId}`}
                                    />
                                    <label className="form-check-label px-0" htmlFor={`switch-${item.surgeryPricingId}`}>
                                      {item.status === "y" ? "Active" : "Inactive"}
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
                            )
                          })
                        ) : (
                          <tr>
                            <td colSpan="8" className="text-center py-4">No records found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalItems > 0 && totalPages > 0 && (
                    <Pagination
                      totalItems={totalItems}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={handlePageChange}
                      totalPages={totalPages}
                    />
                  )}
                </>
              ) : (
                // Add / Edit Form with Autocomplete for Surgery Name
                <form onSubmit={handleSave}>
                  <div className="row">
                    {/* Surgery Name with Autocomplete */}
                    <div className="form-group col-md-4 mt-3">
                      <label>Surgery Name <span className="text-danger">*</span></label>
                      <div className="dropdown-search-container position-relative">
                        <input
                          ref={surgeryInputRef}
                          type="text"
                          className="form-control"
                          placeholder="Type surgery name..."
                          value={surgerySearchText}
                          onChange={handleSurgerySearch}
                          onClick={() => {
                            if (surgerySearchText.trim()) {
                              setShowSurgeryDropdown(true)
                            }
                          }}
                          autoComplete="off"
                          required
                        />
                        <PortalDropdown
                          anchorRef={surgeryInputRef}
                          show={showSurgeryDropdown}
                        >
                          {isSurgeryLoading && filteredSurgeries.length === 0 ? (
                            <div className="text-center p-3">
                              <div className="spinner-border spinner-border-sm text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            </div>
                          ) : filteredSurgeries.length > 0 ? (
                            filteredSurgeries.map((surg) => (
                              <div
                                key={surg.surgeryId}
                                className="p-2"
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  handleSurgerySelect(surg)
                                }}
                                style={{ cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <div className="fw-bold">{surg.surgeryName}</div>
                                <div className="small text-muted">Code: {surg.surgeryCode}</div>
                              </div>
                            ))
                          ) : surgerySearchText.trim() ? (
                            <div className="p-2 text-muted text-center">No surgeries found</div>
                          ) : (
                            <div className="p-2 text-muted text-center">Type to search surgeries...</div>
                          )}
                        </PortalDropdown>
                      </div>
                    </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>Billing Type <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        id="billingTypeId"
                        value={formData.billingTypeId}
                        onChange={handleSelectChange}
                        required
                        disabled={process}
                      >
                        <option value="">Select Billing Type</option>
                        {billingTypeOptions.map(opt => (
                          <option key={opt.billingTypeId} value={opt.billingTypeId}>{opt.billingTypeName}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>Amount (₹) <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className="form-control"
                        id="amount"
                        placeholder="Enter amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        required
                        disabled={process}
                      />
                    </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>Discount Allowed <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        id="discountAllowed"
                        value={formData.discountAllowed}
                        onChange={handleSelectChange}
                        required
                        disabled={process}
                      >
                        <option value="">Select Option</option>
                        {discountAllowedOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>Effective From <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        className="form-control"
                        id="effectiveFrom"
                        value={formData.effectiveFrom}
                        onChange={handleInputChange}
                        required
                        disabled={process}
                      />
                    </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>Effective To</label>
                      <input
                        type="date"
                        className="form-control"
                        id="effectiveTo"
                        value={formData.effectiveTo}
                        onChange={handleInputChange}
                        disabled={process}
                      />
                      {formData.effectiveTo && new Date(formData.effectiveTo) < new Date(formData.effectiveFrom) && (
                        <div className="text-danger mt-1">Effective To cannot be before Effective From</div>
                      )}
                    </div>
                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={process || !isFormValid}
                    >
                      {process ? "Processing..." : (editingItem ? "Update" : "Save")}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={resetForm}
                      disabled={process}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {popupMessage && (
                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
              )}

              {confirmDialog.isOpen && (
                <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button type="button" className="btn-close" onClick={() => handleConfirm(false)}></button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"} 
                          <strong> {confirmDialog.itemName}</strong> surgery pricing?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)} disabled={process}>
                          Cancel
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)} disabled={process}>
                          {process ? "Processing..." : "Confirm"}
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

export default SurgeryPricing