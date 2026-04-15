import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import Popup from "../../../Components/popup"
import LoadingScreen from "../../../Components/Loading"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination"

// PortalDropdown component (reused)
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

const BillingTemplate = () => {
  // ---------- State for list view ----------
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [isShowAllLoading, setIsShowAllLoading] = useState(false)

  // Search criteria
  const [searchTemplateName, setSearchTemplateName] = useState("")
  const [searchTemplateType, setSearchTemplateType] = useState("")

  // Form mode toggle
  const [showForm, setShowForm] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState(null)

  // Popup and confirmation
  const [popupMessage, setPopupMessage] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, templateId: null, newStatus: false })

  // ---------- State for form (same as before) ----------
  const [templateType, setTemplateType] = useState("")
  const [selectedEntity, setSelectedEntity] = useState(null)
  const [templateName, setTemplateName] = useState("")
  const [items, setItems] = useState([])
  const [isFormValid, setIsFormValid] = useState(false)

  // Autocomplete for Procedure/Surgery
  const entityInputRef = useRef(null)
  const [entitySearchText, setEntitySearchText] = useState("")
  const [showEntityDropdown, setShowEntityDropdown] = useState(false)
  const [entityOptions, setEntityOptions] = useState([])
  const [filteredEntities, setFilteredEntities] = useState([])
  const [isEntityLoading, setIsEntityLoading] = useState(false)

  // Item master references
  const itemInputRefs = useRef({})

  // ---------- Mock Data (replace with API calls) ----------
  const mockProcedures = [
    { id: 1, name: "Knee Replacement" },
    { id: 2, name: "Cataract Surgery" },
    { id: 3, name: "Cardiac Bypass" },
    { id: 4, name: "Appendectomy" },
    { id: 5, name: "MRI Scan" }
  ]

  const mockSurgeries = [
    { id: 1, name: "Hernia Repair" },
    { id: 2, name: "Gallbladder Removal" },
    { id: 3, name: "Hip Replacement" },
    { id: 4, name: "Spinal Fusion" },
    { id: 5, name: "Prostate Surgery" }
  ]

  const mockItemMaster = [
    { id: 1, name: "Gloves", unit: "No", type: "Consumable" },
    { id: 2, name: "Gauze", unit: "No", type: "Consumable" },
    { id: 3, name: "Syringe", unit: "No", type: "Consumable" },
    { id: 4, name: "Suture", unit: "Packet", type: "Consumable" },
    { id: 5, name: "Antibiotic Ointment", unit: "Tube", type: "Medicine" },
    { id: 6, name: "Saline", unit: "Bottle", type: "Medicine" }
  ]

  // Mock template list (for list view)
  const mockTemplateList = [
    { id: 1, templateType: "Procedure", entityName: "Knee Replacement", templateName: "Standard Knee Template", status: "y", itemsCount: 3 },
    { id: 2, templateType: "Surgery", entityName: "Hernia Repair", templateName: "Hernia Surgery Pack", status: "y", itemsCount: 5 },
    { id: 3, templateType: "Procedure", entityName: "MRI Scan", templateName: "MRI Consumables", status: "n", itemsCount: 2 },
  ]

  // ---------- List View Functions ----------
  const fetchTemplates = async (page = 0, isInitialLoad = false) => {
    if (isInitialLoad) setLoading(true)
    try {
      // Replace with actual API call
      let filtered = [...mockTemplateList]
      if (searchTemplateName.trim()) {
        filtered = filtered.filter(t => t.templateName.toLowerCase().includes(searchTemplateName.toLowerCase()))
      }
      if (searchTemplateType) {
        filtered = filtered.filter(t => t.templateType === searchTemplateType)
      }
      setTemplates(filtered)
      setTotalElements(filtered.length)
      setTotalPages(Math.ceil(filtered.length / DEFAULT_ITEMS_PER_PAGE))
    } catch (err) {
      console.error("Error fetching templates:", err)
      showPopup("Failed to fetch templates", "error")
    } finally {
      if (isInitialLoad) setLoading(false)
      setIsSearching(false)
      setIsShowAllLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchTemplates(0, true)
  }, [])

  // Re-fetch on search criteria change
  useEffect(() => {
    if (!showForm) {
      fetchTemplates(0, false)
    }
  }, [searchTemplateName, searchTemplateType])

  const handleSearch = () => {
    if (!searchTemplateName.trim() && !searchTemplateType) {
      showPopup("Please enter at least one search criterion", "warning")
      return
    }
    setIsSearching(true)
    setCurrentPage(0)
    fetchTemplates(0, false)
  }

  const handleShowAll = () => {
    setIsShowAllLoading(true)
    setSearchTemplateName("")
    setSearchTemplateType("")
    setCurrentPage(0)
    fetchTemplates(0, false)
  }

  const paginatedList = templates.slice(
    currentPage * DEFAULT_ITEMS_PER_PAGE,
    (currentPage + 1) * DEFAULT_ITEMS_PER_PAGE
  )

  const handlePageChange = (page) => {
    setCurrentPage(page - 1)
  }

  // Status toggle
  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, templateId: id, newStatus })
  }

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.templateId) {
      setTemplates(prev =>
        prev.map(t =>
          t.id === confirmDialog.templateId
            ? { ...t, status: confirmDialog.newStatus }
            : t
        )
      )
      showPopup(`Template ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`, "success")
    }
    setConfirmDialog({ isOpen: false, templateId: null, newStatus: false })
  }

  // ---------- Form Functions ----------
  const fetchEntityOptions = async (type) => {
    if (!type) {
      setEntityOptions([])
      return
    }
    setIsEntityLoading(true)
    setTimeout(() => {
      if (type === "Procedure") {
        setEntityOptions(mockProcedures)
      } else {
        setEntityOptions(mockSurgeries)
      }
      setIsEntityLoading(false)
    }, 300)
  }

  useEffect(() => {
    if (showForm) {
      fetchEntityOptions(templateType)
    }
  }, [templateType, showForm])

  // Reset form when opening Add
  const handleAddClick = () => {
    setEditingTemplateId(null)
    setTemplateType("")
    setSelectedEntity(null)
    setEntitySearchText("")
    setTemplateName("")
    setItems([])
    setShowForm(true)
  }

  // Load template data for editing (you would fetch full template details from API)
  const handleEdit = (template) => {
    // In a real app, you'd fetch full template details including items
    // For demo, we'll use mock data based on template id
    setEditingTemplateId(template.id)
    setTemplateType(template.templateType)
    setTemplateName(template.templateName)
    
    // Mock selected entity
    const entityList = template.templateType === "Procedure" ? mockProcedures : mockSurgeries
    const entity = entityList.find(e => e.name === template.entityName) || { id: 99, name: template.entityName }
    setSelectedEntity(entity)
    setEntitySearchText(entity.name)

    // Mock items for this template (in real app, fetch from API)
    if (template.id === 1) {
      setItems([
        { id: Date.now() + 1, selectedItem: mockItemMaster[0], searchText: mockItemMaster[0].name, quantity: "2", unit: mockItemMaster[0].unit, type: mockItemMaster[0].type, showDropdown: false },
        { id: Date.now() + 2, selectedItem: mockItemMaster[1], searchText: mockItemMaster[1].name, quantity: "5", unit: mockItemMaster[1].unit, type: mockItemMaster[1].type, showDropdown: false },
      ])
    } else {
      setItems([])
    }
    setShowForm(true)
  }

  const handleEntitySearchChange = (e) => {
    const value = e.target.value
    setEntitySearchText(value)
    setSelectedEntity(null)
    setShowEntityDropdown(value.trim() !== "")
  }

  const handleEntitySelect = (entity) => {
    setSelectedEntity(entity)
    setEntitySearchText(entity.name)
    setShowEntityDropdown(false)
  }

  useEffect(() => {
    if (!entitySearchText.trim()) {
      setFilteredEntities([])
      return
    }
    const filtered = entityOptions.filter(entity =>
      entity.name.toLowerCase().includes(entitySearchText.toLowerCase())
    )
    setFilteredEntities(filtered)
  }, [entitySearchText, entityOptions])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (entityInputRef.current && !entityInputRef.current.contains(event.target)) {
        setShowEntityDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Item management
  const handleAddItem = () => {
    const newItem = {
      id: Date.now() + Math.random(),
      selectedItem: null,
      searchText: "",
      quantity: "",
      unit: "",
      type: "",
      showDropdown: false
    }
    setItems([...items, newItem])
  }

  const handleDeleteItem = (itemId) => {
    setItems(items.filter(item => item.id !== itemId))
  }

  const updateItem = (itemId, field, value) => {
    setItems(items.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ))
  }

  const handleItemSelect = (itemId, selectedMasterItem) => {
    setItems(items.map(item => 
      item.id === itemId 
        ? {
            ...item,
            selectedItem: selectedMasterItem,
            searchText: selectedMasterItem.name,
            unit: selectedMasterItem.unit,
            type: selectedMasterItem.type,
            showDropdown: false
          }
        : item
    ))
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      items.forEach(item => {
        const ref = itemInputRefs.current[item.id]
        if (ref && !ref.contains(event.target)) {
          setItems(prev => prev.map(i => i.id === item.id ? { ...i, showDropdown: false } : i))
        }
      })
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [items])

  // Form validation
  useEffect(() => {
    const typeValid = templateType !== ""
    const entityValid = selectedEntity !== null
    const nameValid = templateName.trim() !== ""
    const itemsValid = items.length > 0 && items.every(item => 
      item.selectedItem !== null && 
      item.quantity && 
      parseFloat(item.quantity) > 0
    )
    setIsFormValid(typeValid && entityValid && nameValid && itemsValid)
  }, [templateType, selectedEntity, templateName, items])

  // Save handler
  const handleSave = (e) => {
    e.preventDefault()
    if (!isFormValid) {
      showPopup("Please fill all required fields and ensure all items have valid quantity", "warning")
      return
    }

    const templateData = {
      id: editingTemplateId,
      templateType,
      entityId: selectedEntity.id,
      entityName: selectedEntity.name,
      templateName,
      items: items.map(item => ({
        itemId: item.selectedItem.id,
        itemName: item.selectedItem.name,
        unit: item.unit,
        type: item.type,
        quantity: parseFloat(item.quantity)
      }))
    }

    console.log("Saving template:", templateData)
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      showPopup(editingTemplateId ? "Template updated successfully!" : "Template saved successfully!", "success")
      setShowForm(false)
      // Refresh list
      fetchTemplates(0, false)
    }, 500)
  }

  const handleCancel = () => {
    setShowForm(false)
  }

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) })
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Billing Template Master</h4>
              <div className="d-flex align-items-center">
                {!showForm ? (
                  <>
                    <button type="button" className="btn btn-success me-2" onClick={handleAddClick}>
                      <i className="mdi mdi-plus"></i> Add
                    </button>
                    <button type="button" className="btn btn-success me-2" onClick={handleShowAll}>
                      <i className="mdi mdi-refresh"></i> Refresh
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                    <i className="mdi mdi-arrow-left"></i> Back
                  </button>
                )}
              </div>
            </div>

            <div className="card-body">
              {loading && !showForm ? (
                <LoadingScreen />
              ) : !showForm ? (
                // ============= LIST VIEW =============
                <>
                  {/* Search Section */}
                  <div className="d-flex align-items-center gap-2 mb-4 flex-wrap">
                    <div className="col-md-3">
                      <label className="mb-1"><b>Template Name</b></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by template name..."
                        value={searchTemplateName}
                        onChange={(e) => setSearchTemplateName(e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="mb-1"><b>Template Type</b></label>
                      <select
                        className="form-select"
                        value={searchTemplateType}
                        onChange={(e) => setSearchTemplateType(e.target.value)}
                      >
                        <option value="">All</option>
                        <option value="Procedure">Procedure</option>
                        <option value="Surgery">Surgery</option>
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
                          <th>Template Type</th>
                          <th>Procedure / Surgery</th>
                          <th>Template Name</th>
                          <th>Items Count</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedList.length > 0 ? (
                          paginatedList.map(template => (
                            <tr key={template.id}>
                              <td>{template.templateType}</td>
                              <td>{template.entityName}</td>
                              <td>{template.templateName}</td>
                              <td>{template.itemsCount}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={template.status === "y"}
                                    onChange={() => handleSwitchChange(template.id, template.status === "y" ? "n" : "y")}
                                    id={`switch-${template.id}`}
                                  />
                                  <label className="form-check-label px-0" htmlFor={`switch-${template.id}`}>
                                    {template.status === "y" ? "Active" : "Inactive"}
                                  </label>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleEdit(template)}
                                  disabled={template.status !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center py-4">No templates found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {templates.length > 0 && totalPages > 0 && (
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
                // ============= FORM VIEW (ADD/EDIT) =============
                <form onSubmit={handleSave}>
                  {loading && <LoadingScreen />}
                  <div className="row mb-4">
                    <div className="col-md-3">
                      <label className="form-label">
                        Template Type <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={templateType}
                        onChange={(e) => setTemplateType(e.target.value)}
                        required
                        disabled={editingTemplateId !== null} // Can't change type when editing
                      >
                        <option value="">Select Type</option>
                        <option value="Procedure">Procedure</option>
                        <option value="Surgery">Surgery</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">
                        {templateType || "Procedure / Surgery"} <span className="text-danger">*</span>
                      </label>
                      <div className="position-relative">
                        <input
                          ref={entityInputRef}
                          type="text"
                          className="form-control"
                          placeholder={`Search ${templateType || "procedure/surgery"}...`}
                          value={entitySearchText}
                          onChange={handleEntitySearchChange}
                          onClick={() => {
                            if (entitySearchText.trim() && entityOptions.length > 0) {
                              setShowEntityDropdown(true)
                            }
                          }}
                          disabled={!templateType || editingTemplateId !== null} // Disable if editing
                          autoComplete="off"
                          required
                        />
                        <PortalDropdown anchorRef={entityInputRef} show={showEntityDropdown}>
                          {isEntityLoading ? (
                            <div className="text-center p-3">
                              <div className="spinner-border spinner-border-sm text-primary" />
                            </div>
                          ) : filteredEntities.length > 0 ? (
                            filteredEntities.map(entity => (
                              <div
                                key={entity.id}
                                className="p-2"
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  handleEntitySelect(entity)
                                }}
                                style={{ cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                {entity.name}
                              </div>
                            ))
                          ) : (
                            <div className="p-2 text-muted text-center">
                              {entitySearchText ? "No matches found" : "Type to search"}
                            </div>
                          )}
                        </PortalDropdown>
                      </div>
                    </div>

                    <div className="col-md-5">
                      <label className="form-label">
                        Template Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter template name"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <hr />

                  <div className="mb-3">
                    <h5>Template Items</h5>
                    <button type="button" className="btn btn-primary btn-sm mb-3" onClick={handleAddItem}>
                      <i className="mdi mdi-plus"></i> + Add Item
                    </button>

                    {items.length > 0 && (
                      <div className="table-responsive">
                        <table className="table table-bordered">
                          <thead className="table-light">
                            <tr>
                              <th>Item Name</th>
                              <th>Unit</th>
                              <th>Type</th>
                              <th>Qty</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item) => (
                              <tr key={item.id}>
                                <td style={{ minWidth: "250px" }}>
                                  <div className="position-relative">
                                    <input
                                      ref={(el) => (itemInputRefs.current[item.id] = el)}
                                      type="text"
                                      className="form-control form-control-sm"
                                      placeholder="Search item..."
                                      value={item.searchText}
                                      onChange={(e) => {
                                        const value = e.target.value
                                        updateItem(item.id, "searchText", value)
                                        updateItem(item.id, "showDropdown", value.trim() !== "")
                                        if (!value.trim()) {
                                          updateItem(item.id, "selectedItem", null)
                                          updateItem(item.id, "unit", "")
                                          updateItem(item.id, "type", "")
                                        }
                                      }}
                                      onClick={() => {
                                        if (item.searchText.trim()) {
                                          updateItem(item.id, "showDropdown", true)
                                        }
                                      }}
                                      autoComplete="off"
                                    />
                                    {item.showDropdown && (
                                      <PortalDropdown
                                        anchorRef={{ current: itemInputRefs.current[item.id] }}
                                        show={item.showDropdown}
                                      >
                                        {(() => {
                                          const searchLower = item.searchText.toLowerCase()
                                          const filtered = mockItemMaster.filter(i =>
                                            i.name.toLowerCase().includes(searchLower)
                                          )
                                          if (filtered.length === 0) {
                                            return <div className="p-2 text-muted text-center">No items found</div>
                                          }
                                          return filtered.map(masterItem => (
                                            <div
                                              key={masterItem.id}
                                              className="p-2"
                                              onMouseDown={(e) => {
                                                e.preventDefault()
                                                handleItemSelect(item.id, masterItem)
                                              }}
                                              style={{ cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                              {masterItem.name}
                                            </div>
                                          ))
                                        })()}
                                      </PortalDropdown>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <input type="text" className="form-control form-control-sm" value={item.unit} readOnly disabled />
                                </td>
                                <td>
                                  <input type="text" className="form-control form-control-sm" value={item.type} readOnly disabled />
                                </td>
                                <td style={{ width: "120px" }}>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    placeholder="Qty"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                                    min="0.01"
                                    step="0.01"
                                    required
                                  />
                                </td>
                                <td>
                                  <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDeleteItem(item.id)}>
                                    <i className="mdi mdi-delete"></i> X
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="d-flex justify-content-end mt-4">
                    <button type="submit" className="btn btn-success me-2" disabled={!isFormValid || loading}>
                      {loading ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : "SAVE"}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={loading}>
                      CANCEL
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
                        <p>Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"} this template?</p>
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

export default BillingTemplate