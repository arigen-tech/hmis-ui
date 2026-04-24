import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import Popup from "../../../Components/popup"
import LoadingScreen from "../../../Components/Loading"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination"
import { getRequest, postRequest, putRequest } from "../../../service/apiService"
import {
  SEARCH_PROCEDURE_SURGERY_URL,
  SEARCH_STORE_ITEMS_URL,
  GET_ITEM_DETAILS_URL,
  CREATE_BILLING_TEMPLATE_URL,
  UPDATE_BILLING_TEMPLATE_URL,
  UPDATE_TEMPLATE_STATUS_URL,
  SEARCH_TEMPLATES_URL,
  GET_TEMPLATE_BY_ID_URL
} from "../../../config/apiConfig"

// PortalDropdown component
const PortalDropdown = ({ anchorRef, show, children }) => {
  const [style, setStyle] = useState({})

  useEffect(() => {
    if (!show || !anchorRef?.current) return

    const updatePosition = () => {
      const rect = anchorRef.current.getBoundingClientRect()
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
      })
    }

    updatePosition()
    window.addEventListener("scroll", updatePosition, true)
    window.addEventListener("resize", updatePosition)
    return () => {
      window.removeEventListener("scroll", updatePosition, true)
      window.removeEventListener("resize", updatePosition)
    }
  }, [show, anchorRef])

  if (!show) return null
  return createPortal(<div style={style}>{children}</div>, document.body)
}

const BillingTemplate = () => {
  const hospitalId = sessionStorage.getItem("hospitalId") || localStorage.getItem("hospitalId") || 12

  // ---------- List view state ----------
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [isShowAllLoading, setIsShowAllLoading] = useState(false)
  const [searchTemplateName, setSearchTemplateName] = useState("")
  const [searchTemplateType, setSearchTemplateType] = useState("")

  // ---------- Form mode ----------
  const [showForm, setShowForm] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState(null)
  // KEY FIX: ref so handleSave always reads the latest value, never stale from closure
  const editingTemplateIdRef = useRef(null)

  // ---------- Popup / confirm ----------
  const [popupMessage, setPopupMessage] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, templateId: null, newStatus: false })

  // ---------- Form state ----------
  const [templateType, setTemplateType] = useState("")
  const [selectedEntity, setSelectedEntity] = useState(null)
  const [templateName, setTemplateName] = useState("")
  const [items, setItems] = useState([])
  const [isFormValid, setIsFormValid] = useState(false)
  const [deletedTemplateDetailIds, setDeletedTemplateDetailIds] = useState([])

  // ---------- Entity autocomplete ----------
  const entityInputRef = useRef(null)
  const [entitySearchText, setEntitySearchText] = useState("")
  const [showEntityDropdown, setShowEntityDropdown] = useState(false)
  const [entityOptions, setEntityOptions] = useState([])
  const [entityPage, setEntityPage] = useState(0)
  const [entityLastPage, setEntityLastPage] = useState(true)
  const [isEntityLoading, setIsEntityLoading] = useState(false)
  const debounceEntityRef = useRef(null)

  // ---------- Item autocomplete ----------
  const itemInputRefs = useRef({})
  const [itemSearchTexts, setItemSearchTexts] = useState({})
  const [itemOptions, setItemOptions] = useState({})
  const [itemPages, setItemPages] = useState({})
  const [itemLastPages, setItemLastPages] = useState({})
  const [isItemLoading, setIsItemLoading] = useState({})
  const debounceItemRefs = useRef({})

  // ---------- API ----------

  const fetchProcedureSurgery = async (type, page = 0, search = "") => {
    try {
      setIsEntityLoading(true)
      const params = new URLSearchParams({ templateType: type, page, size: DEFAULT_ITEMS_PER_PAGE })
      if (search && search.trim()) params.append("search", search)
      const response = await getRequest(`${SEARCH_PROCEDURE_SURGERY_URL}?${params.toString()}`)
      if (response?.status === 200 && response.response?.content) {
        const mappedList = response.response.content.map(item => ({
          ...item,
          name: item.procedurename || item.procedureName || item.surgeryname || item.surgeryName || ""
        }))
        return { list: mappedList, last: response.response.last ?? true }
      }
      return { list: [], last: true }
    } catch (error) {
      console.error("Error fetching procedure/surgery:", error)
      return { list: [], last: true }
    } finally {
      setIsEntityLoading(false)
    }
  }

  const fetchStoreItems = async (search = "", page = 0) => {
    try {
      const params = new URLSearchParams({ keyword: search, page, size: DEFAULT_ITEMS_PER_PAGE })
      const response = await getRequest(`${SEARCH_STORE_ITEMS_URL}?${params.toString()}`)
      if (response?.status === 200 && response.response?.content) {
        return { list: response.response.content, last: response.response.last ?? true }
      }
      return { list: [], last: true }
    } catch (error) {
      console.error("Error fetching store items:", error)
      return { list: [], last: true }
    }
  }

  const fetchItemDetails = async (itemId) => {
    try {
      const response = await getRequest(`${GET_ITEM_DETAILS_URL}/${itemId}?hospitalId=${hospitalId}`)
      if (response?.status === 200 && response.response) {
        return {
          unit: response.response.unitAuName || "",
          type: response.response.itemTypeName || ""
        }
      }
      return { unit: "", type: "" }
    } catch (error) {
      console.error("Error fetching item details:", error)
      return { unit: "", type: "" }
    }
  }

  const fetchTemplates = async (page = 0, isInitialLoad = false) => {
    if (isInitialLoad) setLoading(true)
    try {
      const params = new URLSearchParams({ page, size: DEFAULT_ITEMS_PER_PAGE })
      if (searchTemplateName?.trim()) params.append("templateName", searchTemplateName)
      if (searchTemplateType?.trim()) params.append("templateType", searchTemplateType)
      const response = await getRequest(`${SEARCH_TEMPLATES_URL}?${params.toString()}`)
      if (response?.status === 200 && response.response) {
        setTemplates(response.response.content || [])
        setTotalElements(response.response.totalElements || 0)
        setTotalPages(response.response.totalPages || 0)
      } else {
        setTemplates([])
        setTotalElements(0)
        setTotalPages(0)
      }
    } catch (err) {
      console.error("Error fetching templates:", err)
      showPopup("Failed to fetch templates", "error")
    } finally {
      if (isInitialLoad) setLoading(false)
      setIsSearching(false)
      setIsShowAllLoading(false)
    }
  }

  const fetchTemplateById = async (templateId) => {
    try {
      setLoading(true)
      const response = await getRequest(`${GET_TEMPLATE_BY_ID_URL}/${templateId}`)
      if (response?.status === 200 && response.response) {
        const data = response.response
        setTemplateType(data.templateType || "")
        setTemplateName(data.templateName || "")
        // Try all possible field name variations the backend might return for procedure/surgery ID
        const entityId =
          data.procedureId ||
          data.procedureid ||
          data.procedure ||
          data.surgeryId ||
          data.surgeryid ||
          data.surgery ||
          null

        const entityName =
          data.procedureName ||
          data.procedurename ||
          data.surgeryName ||
          data.surgeryname ||
          ""

        console.log("Template API full response:", JSON.stringify(data))
        console.log("Resolved entityId:", entityId, "entityName:", entityName)
        setSelectedEntity({ id: entityId, name: entityName })
        setEntitySearchText(entityName)

        const itemList = (data.billingTemplateDetailItemResponseList || []).map(item => ({
          id: item.templateDetailsId || Date.now() + Math.random(),
          templateDetailsId: item.templateDetailsId || null,
          itemId: item.itemId,
          itemName: item.itemName || "",
          searchText: item.itemName || "",
          quantity: item.qty ? item.qty.toString() : "",
          unit: item.unit || "",
          type: item.type || "",
          showDropdown: false
        }))
        setItems(itemList)

        const searchTexts = {}
        itemList.forEach(i => { searchTexts[i.id] = i.itemName || "" })
        setItemSearchTexts(searchTexts)
      }
    } catch (err) {
      console.error("Error fetching template details:", err)
      showPopup("Failed to load template details", "error")
    } finally {
      setLoading(false)
    }
  }

  const createTemplate = async (templateData) => {
    try {
      setLoading(true)
      const response = await postRequest(`${CREATE_BILLING_TEMPLATE_URL}`, templateData)
      if (response && (response.status === 200 || response.status === 201)) {
        showPopup("Template saved successfully!", "success")
        setShowForm(false)
        fetchTemplates(0, false)
        return true
      } else {
        showPopup(response?.message || "Failed to save template", "error")
        return false
      }
    } catch (err) {
      console.error("Error creating template:", err)
      showPopup("Failed to save template", "error")
      return false
    } finally {
      setLoading(false)
    }
  }

  const updateTemplate = async (templateId, templateData) => {
    try {
      setLoading(true)
      const response = await putRequest(`${UPDATE_BILLING_TEMPLATE_URL}/${templateId}`, templateData)
      if (response?.status === 200) {
        showPopup("Template updated successfully!", "success")
        setShowForm(false)
        fetchTemplates(0, false)
        return true
      } else {
        showPopup(response?.message || "Failed to update template", "error")
        return false
      }
    } catch (err) {
      console.error("Error updating template:", err)
      showPopup("Failed to update template", "error")
      return false
    } finally {
      setLoading(false)
    }
  }

  const updateTemplateStatus = async (templateId, status) => {
    try {
      const response = await putRequest(`${UPDATE_TEMPLATE_STATUS_URL}/${templateId}?status=${status}`)
      return response?.status === 200
    } catch (err) {
      console.error("Error updating status:", err)
      return false
    }
  }

  // ---------- Entity search ----------

  const handleEntitySearch = (value) => {
    const searchValue = value || ""
    setEntitySearchText(searchValue)
    setSelectedEntity(null)
    if (debounceEntityRef.current) clearTimeout(debounceEntityRef.current)
    if (!searchValue.trim() || !templateType) {
      setShowEntityDropdown(false)
      setEntityOptions([])
      return
    }
    debounceEntityRef.current = setTimeout(async () => {
      const result = await fetchProcedureSurgery(templateType, 0, searchValue)
      setEntityOptions(result.list || [])
      setEntityLastPage(result.last ?? true)
      setEntityPage(0)
      setShowEntityDropdown(true)
    }, 500)
  }

  const loadMoreEntities = async () => {
    if (entityLastPage) return
    const nextPage = entityPage + 1
    const result = await fetchProcedureSurgery(templateType, nextPage, entitySearchText)
    setEntityOptions(prev => [...(prev || []), ...(result.list || [])])
    setEntityLastPage(result.last ?? true)
    setEntityPage(nextPage)
  }

  const handleEntitySelect = (entity) => {
    setSelectedEntity(entity)
    setEntitySearchText(entity?.name || entity?.procedurename || entity?.procedureName || entity?.surgeryname || entity?.surgeryName || "")
    setShowEntityDropdown(false)
  }

  // ---------- Item search ----------

  const handleItemSearch = (itemId, value) => {
    const searchValue = value || ""
    setItemSearchTexts(prev => ({ ...prev, [itemId]: searchValue }))
    updateItem(itemId, "itemId", null)
    updateItem(itemId, "itemName", "")
    updateItem(itemId, "unit", "")
    updateItem(itemId, "type", "")
    if (debounceItemRefs.current[itemId]) clearTimeout(debounceItemRefs.current[itemId])
    if (!searchValue.trim()) {
      setItemOptions(prev => ({ ...prev, [itemId]: [] }))
      updateItem(itemId, "showDropdown", false)
      return
    }
    debounceItemRefs.current[itemId] = setTimeout(async () => {
      setIsItemLoading(prev => ({ ...prev, [itemId]: true }))
      const result = await fetchStoreItems(searchValue, 0)
      setItemOptions(prev => ({ ...prev, [itemId]: result.list || [] }))
      setItemLastPages(prev => ({ ...prev, [itemId]: result.last ?? true }))
      setItemPages(prev => ({ ...prev, [itemId]: 0 }))
      updateItem(itemId, "showDropdown", true)
      setIsItemLoading(prev => ({ ...prev, [itemId]: false }))
    }, 700)
  }

  const loadMoreItemsForRow = async (itemId) => {
    if (itemLastPages[itemId]) return
    const nextPage = (itemPages[itemId] || 0) + 1
    setIsItemLoading(prev => ({ ...prev, [itemId]: true }))
    const result = await fetchStoreItems(itemSearchTexts[itemId] || "", nextPage)
    setItemOptions(prev => ({ ...prev, [itemId]: [...(prev[itemId] || []), ...(result.list || [])] }))
    setItemLastPages(prev => ({ ...prev, [itemId]: result.last ?? true }))
    setItemPages(prev => ({ ...prev, [itemId]: nextPage }))
    setIsItemLoading(prev => ({ ...prev, [itemId]: false }))
  }

  const handleItemSelect = async (itemId, selectedItem) => {
    if (!selectedItem) return
    const itemName = selectedItem.nomenclature || selectedItem.itemName || selectedItem.name || ""
    setItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, itemId: selectedItem.itemId, itemName, searchText: itemName, showDropdown: false, unit: "Loading...", type: "Loading..." }
        : item
    ))
    setItemSearchTexts(prev => ({ ...prev, [itemId]: itemName }))
    try {
      const details = await fetchItemDetails(selectedItem.itemId)
      setItems(prev => prev.map(item =>
        item.id === itemId
          ? { ...item, unit: details.unit || "N/A", type: details.type || "N/A" }
          : item
      ))
    } catch {
      setItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, unit: "Error", type: "Error" } : item
      ))
    }
  }

  // ---------- List view handlers ----------

  useEffect(() => { fetchTemplates(0, true) }, [])

  useEffect(() => {
    if (!showForm) fetchTemplates(currentPage, false)
  }, [searchTemplateName, searchTemplateType, currentPage])

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

  const handlePageChange = (page) => setCurrentPage(page - 1)

  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, templateId: id, newStatus })
  }

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.templateId) {
      const success = await updateTemplateStatus(confirmDialog.templateId, confirmDialog.newStatus)
      if (success) {
        setTemplates(prev => prev.map(t =>
          t.templateId === confirmDialog.templateId ? { ...t, status: confirmDialog.newStatus } : t
        ))
        showPopup(`Template ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`, "success")
      } else {
        showPopup("Failed to update template status", "error")
      }
    }
    setConfirmDialog({ isOpen: false, templateId: null, newStatus: false })
  }

  // ---------- Form handlers ----------

  const resetForm = () => {
    setEditingTemplateId(null)
    editingTemplateIdRef.current = null  // reset ref together with state
    setTemplateType("")
    setSelectedEntity(null)
    setEntitySearchText("")
    setTemplateName("")
    setItems([])
    setItemSearchTexts({})
    setItemOptions({})
    setItemPages({})
    setItemLastPages({})
    setIsItemLoading({})
    setDeletedTemplateDetailIds([])
  }

  const handleAddClick = () => {
    resetForm()
    setShowForm(true)
  }

  const handleEdit = (template) => {
    resetForm()
    // Set BOTH state and ref so handleSave is never confused by stale closure
    setEditingTemplateId(template.templateId)
    editingTemplateIdRef.current = template.templateId
    fetchTemplateById(template.templateId)
    setShowForm(true)
  }

  const handleAddItem = () => {
    const newId = Date.now() + Math.random()
    setItems(prev => [...prev, {
      id: newId,
      templateDetailsId: null,
      itemId: null,
      itemName: "",
      searchText: "",
      quantity: "",
      unit: "",
      type: "",
      showDropdown: false
    }])
    setItemSearchTexts(prev => ({ ...prev, [newId]: "" }))
    setItemOptions(prev => ({ ...prev, [newId]: [] }))
  }

  const handleDeleteItem = (itemId) => {
    const itemToDelete = items.find(item => item.id === itemId)
    if (itemToDelete?.templateDetailsId) {
      setDeletedTemplateDetailIds(prev => [...prev, itemToDelete.templateDetailsId])
    }
    setItems(prev => prev.filter(item => item.id !== itemId))
    delete debounceItemRefs.current[itemId]
    setItemSearchTexts(prev => { const n = { ...prev }; delete n[itemId]; return n })
  }

  const updateItem = (itemId, field, value) => {
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, [field]: value } : item))
  }

  // Form validation
  useEffect(() => {
    const typeValid = templateType !== ""
    const entityValid = selectedEntity !== null
    const nameValid = templateName?.trim() !== ""
    const itemsValid = items.length > 0 && items.every(item =>
      item.itemId !== null && item.quantity && parseFloat(item.quantity) > 0
    )
    setIsFormValid(typeValid && entityValid && nameValid && itemsValid)
  }, [templateType, selectedEntity, templateName, items])

  // KEY FIX: read from ref — always has the correct value, never stale
  const handleSave = async (e) => {
    e.preventDefault()
    if (!isFormValid) {
      showPopup("Please fill all required fields and ensure all items have valid quantity", "warning")
      return
    }

    const currentEditingId = editingTemplateIdRef.current

    if (currentEditingId) {
      // UPDATE — send procedureId as API expects
      const templateData = {
        templateType: templateType,
        procedureId: selectedEntity?.id || null,
        templateName: templateName,
        deleteTemplateDetailsId: deletedTemplateDetailIds,
        templateItemRequests: items.map(item => ({
          itemId: item.itemId,
          qty: parseFloat(item.quantity)
        }))
      }
      console.log("UPDATE payload:", JSON.stringify(templateData))
      await updateTemplate(currentEditingId, templateData)
    } else {
      // CREATE
      const templateData = {
        templateType: templateType,
        procedure: selectedEntity?.id || null,
        templateName: templateName,
        templateItemRequests: items.map(item => ({
          itemId: item.itemId,
          qty: parseFloat(item.quantity)
        }))
      }
      await createTemplate(templateData)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    resetForm()
  }

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) })
  }

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (entityInputRef.current && !entityInputRef.current.contains(event.target)) {
        setShowEntityDropdown(false)
      }
      items.forEach(item => {
        const ref = itemInputRefs.current[item.id]
        if (ref && !ref.contains(event.target)) {
          updateItem(item.id, "showDropdown", false)
        }
      })
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [items])

  // ---------- Render ----------

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
                // ===== LIST VIEW =====
                <>
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
                        <option value="procedure">Procedure</option>
                        <option value="surgery">Surgery</option>
                      </select>
                    </div>
                    <div className="col-md-2" style={{ marginTop: "28px" }}>
                      <button type="button" className="btn btn-primary me-2" onClick={handleSearch} disabled={isSearching}>
                        {isSearching ? <><span className="spinner-border spinner-border-sm me-2" />Searching...</> : "Search"}
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleShowAll} disabled={isShowAllLoading}>
                        {isShowAllLoading ? <><span className="spinner-border spinner-border-sm me-2" />Show All...</> : "Show All"}
                      </button>
                    </div>
                  </div>

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
                        {templates.length > 0 ? templates.map(template => (
                          <tr key={template.templateId}>
                            <td>{template.templateType || "-"}</td>
                            <td>{template.procedure || "-"}</td>
                            <td>{template.templateName || "-"}</td>
                            <td>{template.itemCount || 0}</td>
                            <td>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={template.status === "y"}
                                  onChange={() => handleSwitchChange(template.templateId, template.status === "y" ? "n" : "y")}
                                  id={`switch-${template.templateId}`}
                                />
                                <label className="form-check-label px-0" htmlFor={`switch-${template.templateId}`}>
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
                        )) : (
                          <tr>
                            <td colSpan="6" className="text-center py-4">No templates found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

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
                // ===== FORM VIEW =====
                <form onSubmit={handleSave}>
                  {loading && <LoadingScreen />}
                  <div className="row mb-4">
                    <div className="col-md-3">
                      <label className="form-label">Template Type <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={templateType}
                        onChange={(e) => {
                          setTemplateType(e.target.value)
                          setSelectedEntity(null)
                          setEntitySearchText("")
                          setEntityOptions([])
                        }}
                        required
                        disabled={editingTemplateIdRef.current !== null}
                      >
                        <option value="">Select Type</option>
                        <option value="procedure">Procedure</option>
                        <option value="surgery">Surgery</option>
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
                          onChange={(e) => handleEntitySearch(e.target.value)}
                          onClick={() => {
                            if (entitySearchText?.trim() && entityOptions?.length > 0) {
                              setShowEntityDropdown(true)
                            }
                          }}
                          disabled={!templateType || editingTemplateIdRef.current !== null}
                          autoComplete="off"
                          required
                        />
                        <PortalDropdown anchorRef={entityInputRef} show={showEntityDropdown}>
                          {isEntityLoading && (!entityOptions || entityOptions.length === 0) ? (
                            <div className="text-center p-3">
                              <div className="spinner-border spinner-border-sm text-primary" />
                            </div>
                          ) : entityOptions?.length > 0 ? (
                            <>
                              {entityOptions.map(entity => (
                                <div
                                  key={entity.id}
                                  className="p-2"
                                  onMouseDown={(e) => { e.preventDefault(); handleEntitySelect(entity) }}
                                  style={{ cursor: "pointer", borderBottom: "1px solid #f0f0f0" }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                >
                                  {entity.name || entity.procedurename || entity.procedureName || entity.surgeryname || entity.surgeryName}
                                </div>
                              ))}
                              {!entityLastPage && (
                                <div
                                  className="text-center p-2 text-primary small"
                                  onMouseEnter={loadMoreEntities}
                                >
                                  {isEntityLoading ? "Loading..." : "Scroll to load more..."}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="p-2 text-muted text-center">
                              {entitySearchText?.trim() ? "No matches found" : "Type to search"}
                            </div>
                          )}
                        </PortalDropdown>
                      </div>
                    </div>

                    <div className="col-md-5">
                      <label className="form-label">Template Name <span className="text-danger">*</span></label>
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
                                      value={itemSearchTexts[item.id] || ""}
                                      onChange={(e) => handleItemSearch(item.id, e.target.value)}
                                      onClick={() => {
                                        const opts = itemOptions[item.id]
                                        if (itemSearchTexts[item.id]?.trim() && opts?.length > 0) {
                                          updateItem(item.id, "showDropdown", true)
                                        }
                                      }}
                                      autoComplete="off"
                                      required
                                    />
                                    {item.showDropdown && (
                                      <PortalDropdown
                                        anchorRef={{ current: itemInputRefs.current[item.id] }}
                                        show={item.showDropdown}
                                      >
                                        {isItemLoading[item.id] && (!itemOptions[item.id] || itemOptions[item.id].length === 0) ? (
                                          <div className="text-center p-3">
                                            <div className="spinner-border spinner-border-sm text-primary" />
                                          </div>
                                        ) : itemOptions[item.id]?.length > 0 ? (
                                          <>
                                            {itemOptions[item.id].map(masterItem => (
                                              <div
                                                key={masterItem.itemId}
                                                className="p-2"
                                                onMouseDown={(e) => { e.preventDefault(); handleItemSelect(item.id, masterItem) }}
                                                style={{ cursor: "pointer", borderBottom: "1px solid #f0f0f0" }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                              >
                                                <div className="fw-bold">{masterItem.nomenclature || masterItem.itemName || masterItem.name}</div>
                                                <small className="text-muted">Code: {masterItem.pvmsNo || "-"}</small>
                                              </div>
                                            ))}
                                            {!itemLastPages[item.id] && (
                                              <div
                                                className="text-center p-2 text-primary small"
                                                onMouseEnter={() => loadMoreItemsForRow(item.id)}
                                              >
                                                {isItemLoading[item.id] ? "Loading..." : "Scroll to load more..."}
                                              </div>
                                            )}
                                          </>
                                        ) : (
                                          <div className="p-2 text-muted text-center">No items found</div>
                                        )}
                                      </PortalDropdown>
                                    )}
                                  </div>
                                </td>
                                <td style={{ width: "100px" }}>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={item.unit || ""}
                                    readOnly
                                    disabled
                                    style={{ backgroundColor: "#f5f5f5" }}
                                  />
                                </td>
                                <td style={{ width: "120px" }}>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={item.type || ""}
                                    readOnly
                                    disabled
                                    style={{ backgroundColor: "#f5f5f5" }}
                                  />
                                </td>
                                <td style={{ width: "100px" }}>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    placeholder="Qty"
                                    value={item.quantity || ""}
                                    onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                                    min="0.01"
                                    step="0.01"
                                    required
                                  />
                                </td>
                                <td style={{ width: "60px" }}>
                                  <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDeleteItem(item.id)}>
                                    <i className="mdi mdi-delete"></i>
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
                <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
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