import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import Popup from "../../../Components/popup"
import LoadingScreen from "../../../Components/Loading"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination"
import { getRequest, putRequest, postRequest } from "../../../service/apiService"
import { MAS_PROCEDURE_PRICING, MAS_PROCEDURE, MAS_IPD_BILLING_TYPE } from "../../../config/apiConfig"
import { ADD_PROCEDURE_PRICING_SUCC_MSG, UPDATE_PROCEDURE_PRICING_SUCC_MSG, FAIL_TO_SAVE_CHANGES, FAIL_TO_UPDATE_STS } from "../../../config/constants"

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

const ProcedurePricing = () => {
  // State for list view
  const [procedurePricingData, setProcedurePricingData] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [process, setProcess] = useState(false)

  // Search criteria
  const [procedureNameSearch, setProcedureNameSearch] = useState("")
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
    procedureId: "",
    billingTypeId: "",
    basePrice: "",
    discountAllowed: "",
    discount: "",
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

  // Autocomplete for Procedure Name
  const procedureInputRef = useRef(null)
  const [showProcedureDropdown, setShowProcedureDropdown] = useState(false)
  const [procedureSearchText, setProcedureSearchText] = useState("")
  const [procedureOptions, setProcedureOptions] = useState([])
  const [filteredProcedures, setFilteredProcedures] = useState([])
  const [isProcedureLoading, setIsProcedureLoading] = useState(false)

  // Fetch procedure options for autocomplete
  const fetchProcedureOptions = async () => {
    setIsProcedureLoading(true)
    try {
      const data = await getRequest(`${MAS_PROCEDURE}/getAll/0`)
      if (data.status === 200 && data.response) {
        setProcedureOptions(data.response)
      }
    } catch (error) {
      console.error("Error fetching procedure options:", error)
    } finally {
      setIsProcedureLoading(false)
    }
  }

  // Filter procedures based on search text
  useEffect(() => {
    if (!procedureSearchText.trim()) {
      setFilteredProcedures([])
      return
    }
    const filtered = procedureOptions.filter(proc =>
      proc.procedureName?.toLowerCase().includes(procedureSearchText.toLowerCase())
    )
    setFilteredProcedures(filtered)
  }, [procedureSearchText, procedureOptions])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (procedureInputRef.current && !procedureInputRef.current.contains(event.target)) {
        setShowProcedureDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Handle search input change
  const handleProcedureSearch = (e) => {
    const value = e.target.value
    setProcedureSearchText(value)
    setShowProcedureDropdown(value.trim() !== "")
  }

  // Handle selection from dropdown
  const handleProcedureSelect = (procedure) => {
    setProcedureSearchText(procedure.procedureName)
    setFormData(prev => ({ ...prev, procedureId: procedure.procedureId.toString() }))
    setShowProcedureDropdown(false)
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

  // Fetch procedure pricing list with pagination and filters
  const fetchProcedurePricingData = async (page = 0, isInitialLoad = false) => {
    if (isInitialLoad) setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("page", page)
      params.append("size", DEFAULT_ITEMS_PER_PAGE)
      if (billingTypeSearch) params.append("billingTypeId", billingTypeSearch)
      if (procedureNameSearch) params.append("procedureName", procedureNameSearch)

      const data = await getRequest(`${MAS_PROCEDURE_PRICING}/getAll?${params.toString()}`)
      
      if (data.status === 200 && data.response) {
        setProcedurePricingData(data.response.content || [])
        setTotalItems(data.response.totalElements || 0)
        setTotalPages(data.response.totalPages || 0)
      } else {
        setProcedurePricingData([])
        setTotalItems(0)
        setTotalPages(0)
      }
    } catch (error) {
      console.error("Error fetching procedure pricing data:", error)
      setProcedurePricingData([])
      showPopup("Failed to fetch data", "error")
    } finally {
      if (isInitialLoad) setLoading(false)
      setIsSearching(false)
      setIsShowAllLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchProcedurePricingData(0, true)
    fetchProcedureOptions()
    fetchBillingTypeOptions()
  }, [])

  // Re-fetch when search criteria change
  useEffect(() => {
    if (!showForm) {
      fetchProcedurePricingData(0, false)
      setCurrentPage(1)
    }
  }, [procedureNameSearch, billingTypeSearch])

  // Search handlers
  const handleSearch = () => {
    if (!procedureNameSearch.trim() && !billingTypeSearch) {
      showPopup("Please enter at least one search criterion", "warning")
      return
    }
    setIsSearching(true)
    setCurrentPage(1)
    fetchProcedurePricingData(0, false)
  }

  const handleShowAll = () => {
    setIsShowAllLoading(true)
    setProcedureNameSearch("")
    setBillingTypeSearch("")
    setCurrentPage(1)
    fetchProcedurePricingData(0, false)
  }

  // Pagination
  const handlePageChange = (page) => {
    setCurrentPage(page)
    fetchProcedurePricingData(page - 1, false)
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
      formData.procedureId !== "" &&
      formData.billingTypeId !== "" &&
      formData.basePrice !== "" &&
      !isNaN(parseFloat(formData.basePrice)) &&
      parseFloat(formData.basePrice) > 0 &&
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
      procedureId: "",
      billingTypeId: "",
      basePrice: "",
      discountAllowed: "",
      discount: "",
      effectiveFrom: "",
      effectiveTo: ""
    })
    setProcedureSearchText("")
    setShowProcedureDropdown(false)
    setShowForm(true)
  }

  const handleEdit = async (item) => {
    setEditingItem(item)
    setFormData({
      procedureId: item.procedureId?.toString() || "",
      billingTypeId: item.billingTypeId?.toString() || "",
      basePrice: item.basePrice?.toString() || "",
      discountAllowed: item.discountAllowed || "",
      discount: item.discount?.toString() || "",
      effectiveFrom: item.effectiveFrom || "",
      effectiveTo: item.effectiveTo || ""
    })
    setProcedureSearchText(item.procedureName || "")
    setShowProcedureDropdown(false)
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!isFormValid) return
    setProcess(true)

    const payload = {
      procedureId: parseInt(formData.procedureId, 10),
      billingTypeId: parseInt(formData.billingTypeId, 10),
      basePrice: parseFloat(formData.basePrice),
      discountAllowed: formData.discountAllowed,
      discount: formData.discount ? parseFloat(formData.discount) : 0,
      effectiveFrom: formData.effectiveFrom,
      effectiveTo: formData.effectiveTo || null
    }

    try {
      let response
      if (editingItem) {
        response = await putRequest(
          `${MAS_PROCEDURE_PRICING}/update/${editingItem.procedurePricingId}`,
          payload
        )
        if (response.status === 200) {
          setPopupMessage({
            message: "Procedure pricing updated successfully!",
            type: "success",
            onClose: () => {
              setPopupMessage(null)
              resetForm()
              fetchProcedurePricingData(0, false)
              setCurrentPage(1)
            }
          })
        } else {
          throw new Error(response.message || "Update failed")
        }
      } else {
        response = await postRequest(`${MAS_PROCEDURE_PRICING}/create`, payload)
        if (response.status === 201 || response.status === 200) {
          setPopupMessage({
            message: "Procedure pricing added successfully!",
            type: "success",
            onClose: () => {
              setPopupMessage(null)
              resetForm()
              fetchProcedurePricingData(0, false)
              setCurrentPage(1)
            }
          })
        } else {
          throw new Error(response.message || "Save failed")
        }
      }
    } catch (error) {
      console.error("Error saving procedure pricing:", error)
      showPopup(FAIL_TO_SAVE_CHANGES, "error")
    } finally {
      setProcess(false)
    }
  }

  const resetForm = () => {
    setEditingItem(null)
    setShowForm(false)
    setFormData({
      procedureId: "",
      billingTypeId: "",
      basePrice: "",
      discountAllowed: "",
      discount: "",
      effectiveFrom: "",
      effectiveTo: ""
    })
    setProcedureSearchText("")
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
          `${MAS_PROCEDURE_PRICING}/status/${confirmDialog.itemId}?status=${confirmDialog.newStatus}`
        )
        if (response.status === 200) {
          setPopupMessage({
            message: `Procedure pricing ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
            type: "success",
            onClose: () => {
              setPopupMessage(null)
              fetchProcedurePricingData(currentPage - 1, false)
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
              <h4 className="card-title">Procedure Pricing Master</h4>
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
                      <label className="mb-1"><b>Procedure Name</b></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by procedure name..."
                        value={procedureNameSearch}
                        onChange={(e) => setProcedureNameSearch(e.target.value)}
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
                          <th>Procedure Name</th>
                          <th>Billing Type</th>
                          <th>Base Price (₹)</th>
                          <th>Discount (%)</th>
                          <th>Discount Allowed</th>
                          <th>Effective From</th>
                          <th>Effective To</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {procedurePricingData.length > 0 ? (
                          procedurePricingData.map(item => {
                            const discountAllowedLabel = item.discountAllowed === "Y" ? "Yes" : "No"
                            return (
                              <tr key={item.procedurePricingId}>
                                <td>{item.procedureName || '-'}</td>
                                <td>{item.billingTypeName || '-'}</td>
                                <td>₹{item.basePrice?.toLocaleString() || 0}</td>
                                <td>{item.discount || 0}%</td>
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
                                        item.procedurePricingId,
                                        item.procedureName,
                                        item.status === "y" ? "n" : "y"
                                      )}
                                      id={`switch-${item.procedurePricingId}`}
                                    />
                                    <label className="form-check-label px-0" htmlFor={`switch-${item.procedurePricingId}`}>
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
                            <td colSpan="9" className="text-center py-4">No records found</td>
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
                // Add / Edit Form with Autocomplete for Procedure Name
                <form onSubmit={handleSave}>
                  <div className="row">
                    {/* Procedure Name with Autocomplete */}
                    <div className="form-group col-md-4 mt-3">
                      <label>Procedure Name <span className="text-danger">*</span></label>
                      <div className="dropdown-search-container position-relative">
                        <input
                          ref={procedureInputRef}
                          type="text"
                          className="form-control"
                          placeholder="Type procedure name..."
                          value={procedureSearchText}
                          onChange={handleProcedureSearch}
                          onClick={() => {
                            if (procedureSearchText.trim()) {
                              setShowProcedureDropdown(true)
                            }
                          }}
                          autoComplete="off"
                          required
                          disabled={process}
                        />
                        <PortalDropdown
                          anchorRef={procedureInputRef}
                          show={showProcedureDropdown}
                        >
                          {isProcedureLoading && filteredProcedures.length === 0 ? (
                            <div className="text-center p-3">
                              <div className="spinner-border spinner-border-sm text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            </div>
                          ) : filteredProcedures.length > 0 ? (
                            filteredProcedures.map((proc) => (
                              <div
                                key={proc.procedureId}
                                className="p-2"
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  handleProcedureSelect(proc)
                                }}
                                style={{ cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <div className="fw-bold">{proc.procedureName}</div>
                                <div className="small text-muted">Code: {proc.procedureCode}</div>
                              </div>
                            ))
                          ) : procedureSearchText.trim() ? (
                            <div className="p-2 text-muted text-center">No procedures found</div>
                          ) : (
                            <div className="p-2 text-muted text-center">Type to search procedures...</div>
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
                      <label>Base Price (₹) <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className="form-control"
                        id="basePrice"
                        placeholder="Enter base price"
                        value={formData.basePrice}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        required
                        disabled={process}
                      />
                    </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>Discount (%)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="discount"
                        placeholder="Enter discount percentage"
                        value={formData.discount}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        step="0.01"
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
                          <strong> {confirmDialog.itemName}</strong> procedure pricing?
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

export default ProcedurePricing