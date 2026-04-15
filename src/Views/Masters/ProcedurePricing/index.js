import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import Popup from "../../../Components/popup"
import LoadingScreen from "../../../Components/Loading"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination"

// PortalDropdown component (as provided)
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
  // ---------- State for list view ----------
  const [procedureList, setProcedureList] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [isShowAllLoading, setIsShowAllLoading] = useState(false)

  // Search criteria
  const [procedureNameSearch, setProcedureNameSearch] = useState("")
  const [billingTypeSearch, setBillingTypeSearch] = useState("")

  // Form mode
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [popupMessage, setPopupMessage] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, itemId: null, newStatus: false })

  // Form data
  const [formData, setFormData] = useState({
    procedureName: "",
    billingType: "CASH",
    amount: "",
    discount: "",
    discountApplicable: "No",
    fromDate: "",
    toDate: ""
  })
  const [isFormValid, setIsFormValid] = useState(false)

  // Dropdown options
  const billingTypeOptions = ["CASH", "INSURANCE", "BOTH"]
  const discountApplicableOptions = ["Yes", "No"]

  // ---------- Autocomplete for Procedure Name ----------
  const procedureInputRef = useRef(null)
  const [showProcedureDropdown, setShowProcedureDropdown] = useState(false)
  const [procedureSearchText, setProcedureSearchText] = useState("")
  const [procedureOptions, setProcedureOptions] = useState([])      // full list from API/mock
  const [filteredProcedures, setFilteredProcedures] = useState([])  // filtered by search
  const [isProcedureLoading, setIsProcedureLoading] = useState(false)

  // Mock procedure list – replace with API call
  const mockProcedureList = [
    "Knee Replacement",
    "Cataract Surgery",
    "Cardiac Bypass",
    "Appendectomy",
    "MRI Scan",
    "CT Scan",
    "X-Ray Chest",
    "Blood Test",
    "Urine Analysis",
    "Ultrasound Abdomen"
  ]

  // Simulate fetching procedure options (like API)
  const fetchProcedureOptions = async () => {
    setIsProcedureLoading(true)
    // Simulate network delay
    setTimeout(() => {
      setProcedureOptions(mockProcedureList)
      setIsProcedureLoading(false)
    }, 300)
  }

  // Filter procedures based on search text
  useEffect(() => {
    if (!procedureSearchText.trim()) {
      setFilteredProcedures([])
      return
    }
    const filtered = procedureOptions.filter(proc =>
      proc.toLowerCase().includes(procedureSearchText.toLowerCase())
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
    setFormData(prev => ({ ...prev, procedureName: value }))
    setShowProcedureDropdown(value.trim() !== "")
  }

  // Handle selection from dropdown
  const handleProcedureSelect = (procedureName) => {
    setProcedureSearchText(procedureName)
    setFormData(prev => ({ ...prev, procedureName }))
    setShowProcedureDropdown(false)
  }

  // ---------- Mock data & helper functions (replace with API calls) ----------
  const fetchProcedurePricingList = async (page = 0, isInitialLoad = false) => {
    if (isInitialLoad) setLoading(true)
    try {
      // Simulate API response – replace with actual getRequest
      const mockData = [
        { id: 1, procedureName: "Knee Replacement", billingType: "CASH", amount: 50000, discount: 10, discountApplicable: "Yes", fromDate: "2025-01-01", toDate: "2025-12-31", status: "y" },
        { id: 2, procedureName: "Cataract Surgery", billingType: "INSURANCE", amount: 25000, discount: 0, discountApplicable: "No", fromDate: "2025-02-01", toDate: "", status: "y" },
        { id: 3, procedureName: "Cardiac Bypass", billingType: "BOTH", amount: 150000, discount: 5, discountApplicable: "Yes", fromDate: "2025-01-15", toDate: "2025-06-30", status: "n" }
      ]
      // Apply filters
      let filtered = mockData
      if (procedureNameSearch.trim()) {
        filtered = filtered.filter(p => p.procedureName.toLowerCase().includes(procedureNameSearch.toLowerCase()))
      }
      if (billingTypeSearch) {
        filtered = filtered.filter(p => p.billingType === billingTypeSearch)
      }
      setProcedureList(filtered)
      setTotalElements(filtered.length)
      setTotalPages(Math.ceil(filtered.length / DEFAULT_ITEMS_PER_PAGE))
    } catch (err) {
      console.error("Error fetching procedure pricing:", err)
      showPopup("Failed to fetch data", "error")
    } finally {
      if (isInitialLoad) setLoading(false)
      setIsSearching(false)
      setIsShowAllLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchProcedurePricingList(0, true)
    fetchProcedureOptions() // load procedure list for autocomplete
  }, [])

  // Re-fetch when search criteria change
  useEffect(() => {
    if (!showForm) {
      fetchProcedurePricingList(0, false)
    }
  }, [procedureNameSearch, billingTypeSearch])

  // Search handlers
  const handleSearch = () => {
    if (!procedureNameSearch.trim() && !billingTypeSearch) {
      showPopup("Please enter at least one search criterion", "warning")
      return
    }
    setIsSearching(true)
    setCurrentPage(0)
    fetchProcedurePricingList(0, false)
  }

  const handleShowAll = () => {
    setIsShowAllLoading(true)
    setProcedureNameSearch("")
    setBillingTypeSearch("")
    setCurrentPage(0)
    fetchProcedurePricingList(0, false)
  }

  // Pagination
  const paginatedList = procedureList.slice(
    currentPage * DEFAULT_ITEMS_PER_PAGE,
    (currentPage + 1) * DEFAULT_ITEMS_PER_PAGE
  )

  const handlePageChange = (page) => {
    setCurrentPage(page - 1)
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

  // Validation: fromDate mandatory; toDate optional but must be >= fromDate
  useEffect(() => {
    const requiredValid = formData.procedureName.trim() !== "" &&
                          formData.billingType !== "" &&
                          formData.amount !== "" &&
                          !isNaN(parseFloat(formData.amount)) &&
                          parseFloat(formData.amount) > 0 &&
                          formData.fromDate !== ""
    let toDateValid = true
    if (formData.toDate) {
      toDateValid = new Date(formData.toDate) >= new Date(formData.fromDate)
    }
    setIsFormValid(requiredValid && toDateValid)
  }, [formData])

  const handleAddClick = () => {
    setEditingItem(null)
    setFormData({
      procedureName: "",
      billingType: "CASH",
      amount: "",
      discount: "",
      discountApplicable: "No",
      fromDate: "",
      toDate: ""
    })
    setProcedureSearchText("")
    setShowProcedureDropdown(false)
    setShowForm(true)
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      procedureName: item.procedureName,
      billingType: item.billingType,
      amount: item.amount.toString(),
      discount: item.discount.toString(),
      discountApplicable: item.discountApplicable,
      fromDate: item.fromDate,
      toDate: item.toDate || ""
    })
    setProcedureSearchText(item.procedureName)
    setShowProcedureDropdown(false)
    setShowForm(true)
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!isFormValid) return

    const newItem = {
      id: editingItem ? editingItem.id : Date.now(),
      procedureName: formData.procedureName,
      billingType: formData.billingType,
      amount: parseFloat(formData.amount),
      discount: parseFloat(formData.discount) || 0,
      discountApplicable: formData.discountApplicable,
      fromDate: formData.fromDate,
      toDate: formData.toDate || "",
      status: editingItem ? editingItem.status : "y"
    }

    if (editingItem) {
      setProcedureList(prev => prev.map(item => item.id === editingItem.id ? newItem : item))
      showPopup("Procedure pricing updated successfully!", "success")
    } else {
      setProcedureList(prev => [newItem, ...prev])
      showPopup("Procedure pricing added successfully!", "success")
    }
    setShowForm(false)
  }

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) })
  }

  // Status toggle
  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, itemId: id, newStatus })
  }

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.itemId) {
      setProcedureList(prev =>
        prev.map(item =>
          item.id === confirmDialog.itemId
            ? { ...item, status: confirmDialog.newStatus }
            : item
        )
      )
      showPopup(`Procedure ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`, "success")
    }
    setConfirmDialog({ isOpen: false, itemId: null, newStatus: false })
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
                    <button type="button" className="btn btn-success me-2" onClick={handleShowAll}>
                      <i className="mdi mdi-refresh"></i> Refresh
                    </button>
                  </>
                )}
                {showForm && (
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
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
                          <option key={opt} value={opt}>{opt}</option>
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
                          <th>Procedure</th>
                          <th>Billing Type</th>
                          <th>Amount (₹)</th>
                          <th>Discount (%)</th>
                          <th>Discount Applicable</th>
                          <th>Effective From</th>
                          <th>To Date</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedList.length > 0 ? (
                          paginatedList.map(item => (
                            <tr key={item.id}>
                              <td>{item.procedureName}</td>
                              <td>{item.billingType}</td>
                              <td>₹{item.amount.toLocaleString()}</td>
                              <td>{item.discount}%</td>
                              <td>{item.discountApplicable}</td>
                              <td>{formatDate(item.fromDate)}</td>
                              <td>{formatDate(item.toDate)}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={item.status === "y"}
                                    onChange={() => handleSwitchChange(item.id, item.status === "y" ? "n" : "y")}
                                    id={`switch-${item.id}`}
                                  />
                                  <label className="form-check-label px-0" htmlFor={`switch-${item.id}`}>
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
                          ))
                        ) : (
                          <tr>
                            <td colSpan="9" className="text-center py-4">No records found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {procedureList.length > 0 && totalPages > 0 && (
                    <Pagination
                      totalItems={totalElements}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage + 1}
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
                                key={proc}
                                className="p-2"
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  handleProcedureSelect(proc)
                                }}
                                style={{ cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <div className="fw-bold">{proc}</div>
                              </div>
                            ))
                          ) : (
                            <div className="p-2 text-muted text-center">No procedures found</div>
                          )}
                        </PortalDropdown>
                      </div>
                    </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>Billing Type <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        id="billingType"
                        value={formData.billingType}
                        onChange={handleSelectChange}
                        required
                      >
                        {billingTypeOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
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
                      />
                    </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>Discount Applicable <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        id="discountApplicable"
                        value={formData.discountApplicable}
                        onChange={handleSelectChange}
                        required
                      >
                        {discountApplicableOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>Effective From <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        className="form-control"
                        id="fromDate"
                        value={formData.fromDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>To Date</label>
                      <input
                        type="date"
                        className="form-control"
                        id="toDate"
                        value={formData.toDate}
                        onChange={handleInputChange}
                      />
                      {formData.toDate && new Date(formData.toDate) < new Date(formData.fromDate) && (
                        <div className="text-danger mt-1">To Date cannot be before From Date</div>
                      )}
                    </div>
                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid}
                    >
                      {editingItem ? "Update" : "Save"}
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
                <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button type="button" className="btn-close" onClick={() => handleConfirm(false)}></button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"} this procedure pricing?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>Cancel</button>
                        <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>Confirm</button>
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