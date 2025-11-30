import { useState, useEffect } from "react"
import Popup from "../../../../Components/popup";
import LoadingScreen from "../../../../Components/Loading"
import { postRequest, putRequest, getRequest } from "../../../../service/apiService"
import { MAS_INVESTIGATION, OPD_TEMPLATE } from "../../../../config/apiConfig";

const InvestigationModal = ({
    show,
    onClose,
    templateType = "create",
    selectedTemplate = null,
    onTemplateSaved
}) => {
    // State management
    const [templateName, setTemplateName] = useState("")
    const [templateCode, setTemplateCode] = useState("")
    const [investigationType, setInvestigationType] = useState("")
    const [investigationItems, setInvestigationItems] = useState([{
        displayValue: "",
        date: new Date().toISOString().split("T")[0],
        investigationId: null
    }])
    const [templates, setTemplates] = useState([])
    const [allInvestigations, setAllInvestigations] = useState([])
    const [filteredInvestigations, setFilteredInvestigations] = useState([])
    const [loading, setLoading] = useState(false)
    const [popupMessage, setPopupMessage] = useState(null)
    const [selectedInvestigations, setSelectedInvestigations] = useState([])
    const [investigationTypes, setInvestigationTypes] = useState([])
    const [selectedTemplateId, setSelectedTemplateId] = useState("")
    const [activeRowIndex, setActiveRowIndex] = useState(null)

    const getToday = () => new Date().toISOString().split("T")[0]

    // Reset form when modal opens/closes or templateType changes
    useEffect(() => {
        if (show) {
            resetForm()
            fetchTemplates()
            fetchAllInvestigations()

            if (templateType === "edit" && selectedTemplate) {
                setSelectedTemplateId(selectedTemplate.templateId)
                loadTemplateData(selectedTemplate)
            }
        }
    }, [show, templateType, selectedTemplate])

    // Extract investigation types from API response
    useEffect(() => {
        if (allInvestigations.length > 0) {
            extractInvestigationTypes()
        }
    }, [allInvestigations])

    // Set default investigation type when types are loaded
    useEffect(() => {
        if (investigationTypes.length > 0 && !investigationType) {
            setInvestigationType(investigationTypes[0].value)
        }
    }, [investigationTypes])

    // Load template data when template is selected from dropdown
    useEffect(() => {
        if (templateType === 'edit' && selectedTemplateId && templates.length > 0 && !selectedTemplate) {
            const template = templates.find(t => t.templateId == selectedTemplateId)
            if (template) {
                loadTemplateData(template)
            }
        }
    }, [selectedTemplateId, templates, templateType, selectedTemplate])

    // Filter investigations based on type
    useEffect(() => {
        filterInvestigations()
    }, [investigationType, allInvestigations])

    const extractInvestigationTypes = () => {
        const uniqueTypes = []
        const typeMap = new Map()

        allInvestigations.forEach(inv => {
            const typeId = inv.mainChargeCodeId
            const typeName = inv.mainChargeCodeName

            if (typeId && typeName && !typeMap.has(typeId)) {
                typeMap.set(typeId, typeName)
                uniqueTypes.push({
                    id: typeId,
                    name: typeName,
                    value: typeName.toLowerCase().replace(/\s+/g, '-')
                })
            }
        })

        setInvestigationTypes(uniqueTypes)
    }

    const fetchTemplates = async (flag = 1) => {
        try {
            setLoading(true);
            const response = await getRequest(`${OPD_TEMPLATE}/getAllTemplateInvestigations/${flag}`);
            if (response && response.response) {
                setTemplates(response.response);
            } else {
                showPopup("No templates found", "warning");
            }
        } catch (error) {
            console.error("Error fetching templates:", error);
            showPopup("Failed to load templates", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchAllInvestigations = async () => {
        try {
            setLoading(true)
            const response = await getRequest(`${MAS_INVESTIGATION}/getAll/1`)
            if (response && response.response) {
                setAllInvestigations(response.response)
            } else {
                console.warn("No investigations found in response")
                setAllInvestigations([])
            }
        } catch (error) {
            console.error("Error fetching investigations:", error)
            showPopup("Failed to load investigations", "error")
            setAllInvestigations([])
        } finally {
            setLoading(false)
        }
    }

    const filterInvestigations = () => {
        let filtered = allInvestigations

        if (investigationType && investigationTypes.length > 0) {
            const selectedType = investigationTypes.find(type => type.value === investigationType)
            if (selectedType) {
                filtered = filtered.filter(inv => inv.mainChargeCodeId === selectedType.id)
            }
        }

        setFilteredInvestigations(filtered)
    }

    const filterInvestigationsBySearch = (searchQuery) => {
        if (!searchQuery.trim()) {
            return filteredInvestigations.slice(0, 5)
        }

        const filtered = filteredInvestigations.filter(inv =>
            inv.investigationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.mainChargeCodeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.subChargeCodeName?.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5)

        return filtered
    }

    const loadTemplateData = (template) => {
        setTemplateName(template.opdTemplateName || "")
        setTemplateCode(template.opdTemplateCode || "")

        if (template.investigationResponseList && template.investigationResponseList.length > 0) {
            const items = template.investigationResponseList.map(item => {
                const investigation = allInvestigations.find(inv => inv.investigationId === item.investigationId)
                return {
                    investigationId: item.investigationId,
                    displayValue: investigation ? investigation.investigationName : `Investigation #${item.investigationId}`,
                    date: getToday(),
                    templateInvestigationId: item.templateInvestigationId // Store this for updates
                }
            })
            setInvestigationItems(items)
            setSelectedInvestigations(template.investigationResponseList.map(item => item.investigationId))
        } else {
            setInvestigationItems([{
                displayValue: "",
                date: getToday(),
                investigationId: null
            }])
            setSelectedInvestigations([])
        }
    }

    const resetForm = () => {
        setTemplateName("")
        setTemplateCode("")
        setInvestigationType(investigationTypes[0]?.value || "")
        setInvestigationItems([{
            displayValue: "",
            date: getToday(),
            investigationId: null
        }])
        setSelectedInvestigations([])
        setSelectedTemplateId("")
        setActiveRowIndex(null)
    }

    const handleAddInvestigationItem = () => {
        setInvestigationItems((prev) => [...prev, {
            displayValue: "",
            date: getToday(),
            investigationId: null
        }])
    }

    const handleRemoveInvestigationItem = (index) => {
        if (investigationItems.length === 1) return
        const newItems = investigationItems.filter((_, i) => i !== index)
        setInvestigationItems(newItems)

        if (investigationItems[index].investigationId) {
            setSelectedInvestigations(prev =>
                prev.filter(id => id !== investigationItems[index].investigationId)
            )
        }
    }

    const handleRowChange = (index, field, value) => {
        const newItems = [...investigationItems]
        newItems[index] = { ...newItems[index], [field]: value }
        setInvestigationItems(newItems)
    }

    const handleInvestigationSelect = (index, investigation) => {
        // Check if this investigation is already selected in a DIFFERENT row
        const investigationIdAlreadyInOtherRow = selectedInvestigations.some(
            id => id === investigation.investigationId && investigationItems[index]?.investigationId !== investigation.investigationId
        )

        if (investigationIdAlreadyInOtherRow) {
            showPopup("This investigation is already added to the template", "error")
            return
        }

        const newItems = [...investigationItems]

        // Preserve existing templateInvestigationId if this investigation was already in the template
        const existingItem = newItems.find(item => item.investigationId === investigation.investigationId)
        const existingTemplateInvestigationId = existingItem ? existingItem.templateInvestigationId : null

        newItems[index] = {
            ...newItems[index],
            displayValue: investigation.investigationName,
            investigationId: investigation.investigationId,
            templateInvestigationId: existingTemplateInvestigationId // Preserve existing ID if any
        }
        setInvestigationItems(newItems)

        // Update selectedInvestigations
        setSelectedInvestigations(prev => {
            const withoutCurrent = prev.filter(id => id !== investigationItems[index]?.investigationId)
            return [...withoutCurrent, investigation.investigationId]
        })

        setActiveRowIndex(null)
    }

    // Only check for duplicates during CREATE operation
    const isTemplateNameDuplicate = () => {
        // Skip duplicate check for edit operations
        if (templateType === 'edit') return false

        return templates.some(template =>
            template.opdTemplateName.toLowerCase() === templateName.trim().toLowerCase()
        )
    }

    // Only check for duplicates during CREATE operation
    const isTemplateCodeDuplicate = () => {
        // Skip duplicate check for edit operations
        if (templateType === 'edit') return false

        return templates.some(template =>
            template.opdTemplateCode.toLowerCase() === templateCode.trim().toLowerCase()
        )
    }

    const handleSaveTemplate = async () => {
        if (!templateName.trim() || !templateCode.trim()) {
            showPopup("Please fill in template name and code", "error")
            return
        }

        if (selectedInvestigations.length === 0) {
            showPopup("Please add at least one investigation", "error")
            return
        }

        const uniqueInvestigations = [...new Set(selectedInvestigations)]
        if (uniqueInvestigations.length !== selectedInvestigations.length) {
            showPopup("Duplicate investigations found. Please remove duplicates before saving.", "error")
            return
        }

        try {
            setLoading(true)

            // Only validate duplicates for create operation
            if (templateType === "create") {
                if (isTemplateNameDuplicate()) {
                    showPopup("Template name already exists. Please use a different name.", "error")
                    return
                }
                if (isTemplateCodeDuplicate()) {
                    showPopup("Template code already exists. Please use a different code.", "error")
                    return
                }
            }

            // For CREATE operation
            if (templateType === "create") {
                const requestData = {
                    opdTemplateName: templateName.trim(),
                    opdTemplateCode: templateCode.trim(),
                    investigationRequestList: selectedInvestigations.map(invId => ({
                        templateInvestigationId: 0,
                        investigationId: invId
                    })),
                    treatments: []
                }

                const response = await postRequest(`${OPD_TEMPLATE}/create-opdTemplate`, requestData)

                if (response && response.status === 200) {
                    showPopup("Template created successfully!", "success")
                    resetForm()
                    if (onTemplateSaved) {
                        onTemplateSaved(response.response)
                    }
                } else {
                    throw new Error(response?.message || "Failed to save template")
                }
            }
            // For UPDATE operation - use the correct structure
            else if (templateType === "edit") {
                const templateId = selectedTemplate ? selectedTemplate.templateId : selectedTemplateId
                if (!templateId) {
                    showPopup("Please select a template to update", "error")
                    return
                }

                // Get the current template to find existing investigation mappings
                const currentTemplate = selectedTemplate || templates.find(t => t.templateId == templateId)

                // Create a map of investigationId to templateInvestigationId from existing template
                const existingInvestigationMap = new Map()
                if (currentTemplate?.investigationResponseList) {
                    currentTemplate.investigationResponseList.forEach(item => {
                        existingInvestigationMap.set(item.investigationId, item.templateInvestigationId)
                    })
                }

                // Prepare opdTempInvest array with correct templateInvestigationId
                const opdTempInvest = selectedInvestigations.map(invId => {
                    const existingTemplateInvestigationId = existingInvestigationMap.get(invId)

                    return {
                        templateInvestigationId: existingTemplateInvestigationId || null, // Use null for new investigations, not 0
                        investigationId: parseInt(invId)
                    }
                })

                // Find investigations that were removed (for deletedTempIvs)
                const deletedTempIvs = []
                if (currentTemplate?.investigationResponseList) {
                    currentTemplate.investigationResponseList.forEach(item => {
                        if (!selectedInvestigations.includes(item.investigationId)) {
                            deletedTempIvs.push(item.templateInvestigationId)
                        }
                    })
                }

                const requestData = {
                    templateId: parseInt(templateId),
                    opdTempInvest: opdTempInvest,
                    deletedTempIvs: deletedTempIvs
                }

                console.log("Update Request Data:", requestData) // For debugging

                const response = await putRequest(
                    `${OPD_TEMPLATE}/update-opdTemplate/${templateId}`,
                    requestData
                )

                if (response && response.status === 200) {
                    showPopup("Template updated successfully!", "success")
                    resetForm()
                    if (onTemplateSaved) {
                        onTemplateSaved(response.response)
                    }
                } else {
                    throw new Error(response?.message || "Failed to update template")
                }
            }
        } catch (error) {
            console.error("Error saving template:", error)
            if (error.response?.data?.message?.includes('duplicate') ||
                error.message?.includes('duplicate') ||
                error.response?.data?.message?.includes('already exists')) {
                showPopup(
                    "Template name or code already exists. Please use different values.",
                    "error"
                )
            } else {
                showPopup(
                    `Failed to ${templateType === 'create' ? 'create' : 'update'} template: ${error.message}`,
                    "error"
                )
            }
        } finally {
            setLoading(false)
        }
    }

    const handleResetTemplate = () => {
        resetForm()
    }

    const showPopup = (message, type = 'info') => {
        setPopupMessage({
            message,
            type,
            onClose: () => {
                setPopupMessage(null)
            }
        })
    }

    const handleCloseModal = () => {
        // Close any open popup first, then close the modal
        if (popupMessage) {
            setPopupMessage(null)
        }
        onClose()
    }

    if (!show) return null

    return (
        <div className="modal fade show d-block" style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1050
        }}>
            <div className="modal-dialog" style={{
                margin: '0 auto',
                position: 'fixed',
                top: '50%',
                left: '55%',
                transform: 'translate(-50%, -50%)',
                width: '70%',
                maxWidth: '800px',
                height: 'auto',
                maxHeight: '80vh'
            }}>
                <div className="modal-content" style={{
                    height: 'auto',
                    maxHeight: '80vh',
                    overflow: 'hidden',
                    borderRadius: '8px',
                    border: 'none',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* Header */}
                    <div className="modal-header" style={{
                        backgroundColor: '#0d6efd',
                        color: 'white',
                        borderBottom: '2px solid #0b5ed7',
                        padding: '1rem 1.5rem',
                        borderRadius: '8px 8px 0 0'
                    }}>
                        <h5 className="modal-title fw-bold fs-6">
                            {templateType === 'create' ? 'CREATE' : 'EDIT'} INVESTIGATION TEMPLATE
                        </h5>
                        <button
                            type="button"
                            className="btn-close btn-close-white"
                            onClick={handleCloseModal}
                            style={{ margin: 0 }}
                        ></button>
                    </div>

                    <div className="modal-body" style={{
                        padding: '1.5rem',
                        flex: 1,
                        overflowY: 'auto',
                        overflowX: 'hidden'
                    }}>
                        {loading && <LoadingScreen />}

                        {/* Template Selection Dropdown */}
                        {templateType === 'edit' && !selectedTemplate && (
                            <div className="row mb-4">
                                <div className="col-12">
                                    <label className="form-label fw-bold small">Select Template *</label>
                                    <select
                                        className="form-control form-control-sm"
                                        value={selectedTemplateId}
                                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                                        style={{ borderRadius: '4px' }}
                                    >
                                        <option value="">Select a template</option>
                                        {templates.map(template => (
                                            <option key={template.templateId} value={template.templateId}>
                                                {template.opdTemplateName} ({template.opdTemplateCode})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}




                        {/* Template Name and Code */}
                        <div className="row mb-4">
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-bold small">Template Name *</label>
                                <input
                                    type="text"
                                    className={`form-control form-control-sm ${templateType === 'create' && isTemplateNameDuplicate() ? 'is-invalid' : ''}`}
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    placeholder="Enter template name"
                                    style={{ borderRadius: '4px' }}
                                />
                                {templateType === 'create' && isTemplateNameDuplicate() && (
                                    <div className="text-danger small mt-1">Template name already exists</div>
                                )}
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-bold small">Template Code *</label>
                                <input
                                    type="text"
                                    className={`form-control form-control-sm ${templateType === 'create' && isTemplateCodeDuplicate() ? 'is-invalid' : ''}`}
                                    value={templateCode}
                                    onChange={(e) => setTemplateCode(e.target.value)}
                                    placeholder="Enter template code"
                                    style={{ borderRadius: '4px' }}
                                />
                                {templateType === 'create' && isTemplateCodeDuplicate() && (
                                    <div className="text-danger small mt-1">Template code already exists</div>
                                )}
                            </div>
                        </div>

                        {/* Investigation Type Radio Buttons */}
                        <div className="row mb-4">
                            <div className="col-12">
                                <label className="form-label fw-bold small mb-2">Investigation Type</label>
                                <div className="d-flex gap-4">
                                    {investigationTypes.length > 0 ? (
                                        investigationTypes.map((type) => (
                                            <div key={type.value} className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="investigationType"
                                                    id={type.value}
                                                    checked={investigationType === type.value}
                                                    onChange={() => setInvestigationType(type.value)}
                                                />
                                                <label className="form-check-label fw-bold small" htmlFor={type.value}>
                                                    {type.name.toUpperCase()}
                                                </label>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-muted small">Loading investigation types...</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Investigation Items Table with Search Dropdown */}
                        <div className="row mb-3">
                            <div className="col-12">
                                <label className="form-label fw-bold small mb-2">INVESTIGATION ITEMS</label>
                                <div className="table-responsive" style={{ overflow: 'visible' }}>
                                    <table className="table table-bordered table-sm" style={{ marginBottom: 0 }}>
                                        <thead className="table-light">
                                            <tr>
                                                <th style={{ width: "60%", padding: "8px", fontSize: "0.875rem" }}>Investigation</th>
                                                <th style={{ width: "25%", padding: "8px", fontSize: "0.875rem" }}>Date</th>
                                                <th style={{ width: "7.5%", padding: "8px", fontSize: "0.875rem" }} className="text-center">Add</th>
                                                <th style={{ width: "7.5%", padding: "8px", fontSize: "0.875rem" }} className="text-center">Delete</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {investigationItems.map((item, index) => (
                                                <tr key={index}>
                                                    <td style={{ padding: "6px", position: 'relative' }}>
                                                        <div className="dropdown-search-container position-relative">
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                value={item.displayValue}
                                                                autoComplete="off"
                                                                placeholder="Investigation Name"
                                                                onChange={(e) => {
                                                                    const newItems = [...investigationItems]
                                                                    newItems[index] = {
                                                                        ...newItems[index],
                                                                        displayValue: e.target.value,
                                                                        investigationId: null
                                                                    }
                                                                    setInvestigationItems(newItems)
                                                                    if (e.target.value.trim() !== "") {
                                                                        setActiveRowIndex(index)
                                                                    } else {
                                                                        setActiveRowIndex(null)
                                                                    }
                                                                }}
                                                                onFocus={() => {
                                                                    if (item.displayValue.trim() !== "") {
                                                                        setActiveRowIndex(index)
                                                                    }
                                                                }}
                                                                onBlur={() => setTimeout(() => setActiveRowIndex(null), 200)}
                                                                style={{ borderRadius: '4px', border: '1px solid #ced4da' }}
                                                            />

                                                            {/* Search Dropdown */}
                                                            {activeRowIndex === index && item.displayValue.trim() !== "" && (
                                                                <ul className="list-group position-absolute w-100 mt-1"
                                                                    style={{
                                                                        zIndex: 1000,
                                                                        maxHeight: "200px",
                                                                        overflowY: "auto",
                                                                        backgroundColor: "#fff",
                                                                        border: "1px solid #ccc",
                                                                    }}>
                                                                    {filterInvestigationsBySearch(item.displayValue).length > 0 ? (
                                                                        filterInvestigationsBySearch(item.displayValue).map((investigation) => {
                                                                            // Only show as selected if it's in OTHER rows (not the current one)
                                                                            const isSelectedInOtherRow = selectedInvestigations.some(
                                                                                id => id === investigation.investigationId && investigationItems[index]?.investigationId !== investigation.investigationId
                                                                            )
                                                                            return (
                                                                                <li
                                                                                    key={investigation.investigationId}
                                                                                    className="list-group-item list-group-item-action"
                                                                                    style={{
                                                                                        backgroundColor: isSelectedInOtherRow ? '#ffc107' : "#e3e8e6",
                                                                                        cursor: isSelectedInOtherRow ? 'not-allowed' : 'pointer'
                                                                                    }}
                                                                                    onClick={() => {
                                                                                        if (!isSelectedInOtherRow) {
                                                                                            handleInvestigationSelect(index, investigation)
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <div>
                                                                                        <strong>{investigation.investigationName}</strong>
                                                                                        <div className="d-flex justify-content-between">
                                                                                            <span>
                                                                                                {investigation.mainChargeCodeName} • {investigation.subChargeCodeName}
                                                                                            </span>
                                                                                            {isSelectedInOtherRow && (
                                                                                                <span className="text-success">
                                                                                                    <i className="fas fa-check-circle me-1"></i> Added
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </li>
                                                                            )
                                                                        })
                                                                    ) : (
                                                                        <li className="list-group-item text-muted text-center">
                                                                            {allInvestigations.length === 0 ?
                                                                                'No investigations available' :
                                                                                'No investigations found'
                                                                            }
                                                                        </li>
                                                                    )}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "6px" }}>
                                                        <input
                                                            type="date"
                                                            className="form-control form-control-sm"
                                                            value={item.date}
                                                            onChange={(e) => handleRowChange(index, "date", e.target.value)}
                                                            style={{ borderRadius: '4px', border: '1px solid #ced4da' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: "6px" }} className="text-center align-middle">
                                                        <button
                                                            className="btn btn-success btn-sm"
                                                            onClick={handleAddInvestigationItem}
                                                            style={{
                                                                borderRadius: '4px',
                                                                width: '30px',
                                                                height: '30px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                margin: '0 auto',
                                                                fontSize: '0.875rem'
                                                            }}
                                                        >
                                                            +
                                                        </button>
                                                    </td>
                                                    <td style={{ padding: "6px" }} className="text-center align-middle">
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => handleRemoveInvestigationItem(index)}
                                                            disabled={investigationItems.length === 1}
                                                            style={{
                                                                borderRadius: '4px',
                                                                width: '30px',
                                                                height: '30px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                margin: '0 auto',
                                                                fontSize: '0.875rem'
                                                            }}
                                                        >
                                                            −
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons - Fixed at bottom */}
                    <div style={{
                        padding: '1rem 1.5rem',
                        borderTop: '1px solid #e0e0e0',
                        backgroundColor: '#f8f9fa'
                    }}>
                        <div className="d-flex gap-2 justify-content-start">
                            <button
                                className="btn btn-primary btn-sm px-3"
                                onClick={handleSaveTemplate}
                                disabled={loading || !templateName.trim() || !templateCode.trim() || selectedInvestigations.length === 0 || (templateType === 'create' && (isTemplateNameDuplicate() || isTemplateCodeDuplicate())) || (templateType === 'edit' && !selectedTemplateId && !selectedTemplate)}
                                style={{ borderRadius: '4px', fontSize: '0.875rem' }}
                            >
                                {loading ? 'SAVING...' : templateType === 'create' ? 'SAVE' : 'UPDATE'}
                            </button>
                            <button
                                className="btn btn-secondary btn-sm px-3"
                                onClick={handleResetTemplate}
                                disabled={loading}
                                style={{ borderRadius: '4px', fontSize: '0.875rem' }}
                            >
                                RESET
                            </button>
                            <button
                                className="btn btn-secondary btn-sm px-3"
                                onClick={handleCloseModal}
                                disabled={loading}
                                style={{ borderRadius: '4px', fontSize: '0.875rem' }}
                            >
                                CLOSE
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Popup Message */}
            {popupMessage && (
                <Popup
                    message={popupMessage.message}
                    type={popupMessage.type}
                    onClose={popupMessage.onClose}
                />
            )}
        </div>
    )
}

export default InvestigationModal