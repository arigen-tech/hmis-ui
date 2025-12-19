import { useState, useEffect, useRef } from "react"
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
    const [investigationDropdown, setInvestigationDropdown] = useState([]);
    const [investigationSearch, setInvestigationSearch] = useState([]);
    const [investigationPage, setInvestigationPage] = useState(0);
    const [investigationLastPage, setInvestigationLastPage] = useState(true);
    const [openInvestigationDropdown, setOpenInvestigationDropdown] = useState(null);

    const debounceInvestigationRef = useRef([]);
    const dropdownInvestigationRef = useRef(null);
    const [labFlag, setLabFlag] = useState("")
    const [radioFlag, setRadioFlag] = useState("")

    const getToday = () => new Date().toISOString().split("T")[0]

    // Reset form when modal opens/closes or templateType changes
    useEffect(() => {
        if (show) {
            resetForm()
            fetchTemplates()
            fetchInvestigations()

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

    const fetchInvestigations = async (page, searchText = "") => {
        try {
            let url = `${MAS_INVESTIGATION}/dynamic/all?flag=1&page=${page}&size=20`;

            if (searchText) {
                url += `&search=${encodeURIComponent(searchText)}`;
            }

            if (investigationType) {
                url += `&mainChargeCodeId=${investigationType}`;
            }

            const data = await getRequest(url);

            if (data.status === 200 && data.response?.content) {
                return {
                    list: data.response.content,
                    last: data.response.last,
                };
            }

            return { list: [], last: true };
        } catch (error) {
            console.error("Error fetching investigations:", error);
            return { list: [], last: true };
        }
    };

    const loadFirstInvestigationPage = async (index) => {
        const searchText = investigationSearch[index] || "";
        const result = await fetchInvestigations(0, searchText);

        setInvestigationDropdown(result.list);
        setInvestigationLastPage(result.last);
        setInvestigationPage(0);
    };


    const handleInvestigationSearch = (value, index) => {
        setInvestigationSearch((prev) => {
            const updated = [...prev];
            updated[index] = value;
            return updated;
        });

        if (debounceInvestigationRef.current[index]) {
            clearTimeout(debounceInvestigationRef.current[index]);
        }

        debounceInvestigationRef.current[index] = setTimeout(async () => {
            if (!value.trim()) {
                setInvestigationDropdown([]);
                return;
            }

            const result = await fetchInvestigations(0, value);
            setInvestigationDropdown(result.list);
            setInvestigationLastPage(result.last);
            setInvestigationPage(0);
            setOpenInvestigationDropdown(index);
        }, 700);
    };


    const loadMoreInvestigations = async () => {
        if (investigationLastPage || openInvestigationDropdown === null) return;

        const nextPage = investigationPage + 1;
        const result = await fetchInvestigations(
            nextPage,
            investigationSearch[openInvestigationDropdown] || ""
        );

        setInvestigationDropdown((prev) => [...prev, ...result.list]);
        setInvestigationLastPage(result.last);
        setInvestigationPage(nextPage);
    };


    const updateInvestigation = (selected, index) => {
        if (!selected) return;

        setInvestigationItems((prev) => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                investigationId: selected.investigationId,
                name: selected.investigationName,
            };
            return updated;
        });

        setInvestigationSearch((prev) => {
            const updated = [...prev];
            updated[index] = "";
            return updated;
        });

        setOpenInvestigationDropdown(null);
    };


    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                dropdownInvestigationRef.current &&
                !dropdownInvestigationRef.current.contains(e.target)
            ) {
                setOpenInvestigationDropdown(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);



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

    const fetchInvestigationTypes = async () => {
        const res = await getRequest("/DgMasInvestigation/uniqueInvestigation/types")
        if (res?.response) {
            setInvestigationTypes(res.response)
        }
    }
    useEffect(() => {
        fetchInvestigationTypes();
    }, []);

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
        const itemToRemove = investigationItems[index];
        const onlyOneRow = investigationItems.length === 1;

        const isEmptyRow =
            !itemToRemove.displayValue &&
            !itemToRemove.investigationId &&
            !itemToRemove.date;

        // Only one row & empty → do nothing
        if (onlyOneRow && isEmptyRow) return;

        // Remove from selected investigations if exists
        if (itemToRemove.investigationId) {
            setSelectedInvestigations((prev) =>
                prev.filter((id) => id !== itemToRemove.investigationId)
            );
        }

        let newItems = investigationItems.filter((_, i) => i !== index);

        // Only one row existed and had data → reset to empty row
        if (onlyOneRow) {
            newItems = [
                {
                    displayValue: "",
                    date: getToday(),
                    investigationId: null,
                },
            ];
        }

        setInvestigationItems(newItems);
    };


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
                                            <div key={type.id} className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="investigationType"
                                                    id={`inv-type-${type.id}`}
                                                    value={type.id}
                                                    checked={investigationType === type.id}
                                                    onChange={() => {
                                                        setInvestigationType(type.id);

                                                        if (type.name === "Laboratory") {
                                                            setLabFlag("y");
                                                            setRadioFlag("n");
                                                        } else if (type.name === "Radiology") {
                                                            setRadioFlag("y");
                                                            setLabFlag("n");
                                                        } else {
                                                            setLabFlag("n");
                                                            setRadioFlag("n");
                                                        }
                                                    }}
                                                />

                                                <label
                                                    className="form-check-label fw-bold"
                                                    htmlFor={`inv-type-${type.id}`}
                                                >
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
                                                    <td>
                                                        <div className="position-relative w-100" ref={dropdownInvestigationRef}>
                                                            {/* INPUT */}
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                placeholder="Search Investigation..."
                                                                value={
                                                                    investigationItems[index].name ||
                                                                    investigationSearch[index] ||
                                                                    ""
                                                                }
                                                                onChange={(e) =>
                                                                    handleInvestigationSearch(e.target.value, index)
                                                                }
                                                                onClick={() => {
                                                                    loadFirstInvestigationPage(index);
                                                                    setOpenInvestigationDropdown(index);
                                                                }}
                                                                onBlur={() => {
                                                                    setTimeout(() => setOpenInvestigationDropdown(null), 200);
                                                                }}
                                                                autoComplete="off"
                                                            />

                                                            {/* DROPDOWN */}
                                                            {openInvestigationDropdown === index && (
                                                                <div
                                                                    className="border rounded mt-1 bg-white position-absolute w-100"
                                                                    style={{
                                                                        maxHeight: "220px",
                                                                        zIndex: 9999,
                                                                        overflowY: "auto",
                                                                    }}
                                                                    onScroll={(e) => {
                                                                        if (
                                                                            e.target.scrollHeight - e.target.scrollTop ===
                                                                            e.target.clientHeight
                                                                        ) {
                                                                            loadMoreInvestigations();
                                                                        }
                                                                    }}
                                                                >
                                                                    {investigationDropdown.length > 0 ? (
                                                                        investigationDropdown.map((inv) => (
                                                                            <div
                                                                                key={inv.investigationId}
                                                                                className="p-2 cursor-pointer hover:bg-light"
                                                                                onMouseDown={(e) => {
                                                                                    e.preventDefault(); // prevent blur
                                                                                    updateInvestigation(inv, index);
                                                                                }}
                                                                            >
                                                                                <strong>{inv.investigationName}</strong>
                                                                                <div className="text-muted small">
                                                                                    {inv.mainChargeCodeName} •{" "}
                                                                                    {inv.subChargeCodeName}
                                                                                </div>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="p-2 text-muted">No results found</div>
                                                                    )}

                                                                    {!investigationLastPage && (
                                                                        <div className="text-center p-2 text-primary small">
                                                                            Loading...
                                                                        </div>
                                                                    )}
                                                                </div>
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
                                                            disabled={
                                                                investigationItems.length === 1 &&
                                                                !investigationItems[0].displayValue &&
                                                                !investigationItems[0].investigationId
                                                            }
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