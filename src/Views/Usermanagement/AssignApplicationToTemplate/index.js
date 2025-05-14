import React, { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import { API_HOST, MAS_TEMPLATE, ASSIGN_TEMPLATES, MAS_APPLICATION } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading"

const Assignapplication = () => {
    const [showForm, setShowForm] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 3;
    const totalProducts = 12;
    const [popupMessage, setPopupMessage] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showModuleSection, setShowModuleSection] = useState(false);
    const [selectedParentApp, setSelectedParentApp] = useState('');
    const [showModuleTable, setShowModuleTable] = useState(false);
    const [parentApplications, setParentApplications] = useState([]);
    const [childApplications, setChildApplications] = useState([]);
    const [templateModules, setTemplateModules] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

   
    useEffect(() => {
        fetchTemplates(1);
        fetchParentApplications();
    }, []);

    
    const fetchParentApplications = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getRequest(`${MAS_APPLICATION}/getAllParents/1`);

            if (response && response.response) {
               
                const allParentApps = [];

                // Recursively find apps with url="#" or parentId="0"
                const findParentApps = (apps) => {
                    apps.forEach(app => {
                        if (app.parentId === "0" || app.url === "#") {
                            allParentApps.push({
                                id: app.appId,
                                applicationCode: app.appId,
                                applicationName: app.name,
                                status: app.status || "n"
                            });
                        }
                        
                        if (app.children) {
                            findParentApps(app.children);
                        }
                    });
                };

                findParentApps(response.response);
                setParentApplications(allParentApps);
            }
        } catch (err) {
            console.error("Error fetching parent applications:", err);
            setError("Failed to fetch parent applications. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async (flag = 1) => {
        setLoading(true);
        setError(null);
        try {
            const response = await getRequest(`${MAS_TEMPLATE}/getAll/${flag}`);

            const templateList = response.response || [];
            const mappedTemplates = templateList.map(template => ({
                id: template.id,
                templateCode: template.templateCode || "No Code",
                templateName: template.templateName || "No Name",
                status: template.status || "n"
            }));

            setTemplates(mappedTemplates);
        } catch (err) {
            console.error("Error fetching templates:", err);
            setError("Failed to fetch templates. Please try again later.");
        } finally {
            setLoading(false);
        }
    };


    const processChildApplications = (apps, parentPath = "", srNoStart = 1) => {
        setLoading(true);
        let result = [];
        let currentSrNo = srNoStart;

        if (!apps || !Array.isArray(apps)) return result;

        for (const app of apps) {
            
            const displayPath = parentPath ? `${parentPath}->${app.name}` : app.name;

            
            const currentApp = {
                srNo: currentSrNo++,
                module: app.name,
                displayName: displayPath, 
                templateId: app.templateId || null,
                appId: app.appId,
                status: app.status?.toLowerCase() || 'n',
                lastChgDate: app.lastChgDate,
                checked: app.assigned && app.status?.toLowerCase() === 'y',
                parentHierarchy: parentPath,
                nestLevel: parentPath ? parentPath.split("->").length : 0,
                isParent: app.children && app.children.length > 0,
                expanded: true
            };

            result.push(currentApp);

            // Recursively process children if they exist
            if (app.children && Array.isArray(app.children) && app.children.length > 0) {
                const childResults = processChildApplications(
                    app.children,
                    displayPath,
                    currentSrNo
                );

                
                currentSrNo += childResults.length;

                
                result = [...result, ...childResults];
            }
            
        }

        return result;

        
    };


    const handleToggleExpand = (appId) => {
        setChildApplications(prevData => {
            
            const itemToToggle = prevData.find(item => item.appId === appId);
            if (!itemToToggle || !itemToToggle.isParent) return prevData;

           
            const updatedData = prevData.map(item =>
                item.appId === appId ? { ...item, expanded: !item.expanded } : item
            );

            return updatedData;
        });
    };

    const handleParentApplicationSelect = async (e) => {
        const selectedParentId = e.target.value;
        setSelectedParentApp(selectedParentId);
        setLoading(true);

        try {
            
            const childResponse = await getRequest(`${MAS_APPLICATION}/getAllChildrenByParentId/${selectedParentId}?templateId=${selectedTemplate || ''}`);

            if (!childResponse?.response) {
                throw new Error("Failed to fetch child applications");
            }

            console.log("Child applications response:", childResponse.response);

            
            const selectedParentApp = parentApplications.find(app => app.id === selectedParentId);
            const parentName = selectedParentApp?.applicationName || "";

            
            const processedChildren = processChildApplications(childResponse.response, "");

            console.log("Processed children:", processedChildren);

            setChildApplications(processedChildren);
            setShowModuleTable(true);
        } catch (error) {
            console.error("Error fetching child applications:", error);
            setPopupMessage({
                message: "Failed to load child applications",
                type: "error",
                onClose: () => setPopupMessage(null)
            });
            setShowModal(true);
           
        }
        finally {
            setLoading(false);
        }
    };

    const handleTemplateSelect = async (e) => {
        const selectedTemplateId = e.target.value;
        setSelectedTemplate(selectedTemplateId);
        setLoading(true);

        try {
            const response = await getRequest(`${ASSIGN_TEMPLATES}/getAllTemplateById/${selectedTemplateId}`);

            if (response && response.response) {
                console.log("Template response:", response.response);

               
                const formattedData = response.response.map((template, index) => {
                    console.log("Individual template item:", template);

                    return {
                        srNo: index + 1,
                        module: template.appName || "Unknown Module",
                        templateId: template.templateId,
                        appId: template.appId,
                        status: template.status,
                        lastChgDate: template.lastChgDate
                    };
                });

                setTemplateModules(formattedData);

                
                if (selectedParentApp) {
                    
                    handleParentApplicationSelect({ target: { value: selectedParentApp } });
                }
            }
        } catch (error) {
            console.error("Error fetching template details:", error);
            setPopupMessage({
                message: "Failed to load template details",
                type: "error",
                onClose: () => setPopupMessage(null)
            });
            setShowModal(true);
            
        }

        finally {
            setLoading(false);
        }
    };

    const handleEditClick = () => {
        setIsEditMode(!isEditMode);
    };

    const handleAddClick = () => {
        if (!selectedTemplate) {
            setPopupMessage({
                message: "You must select a template first.",
                type: "warning",
                onClose: () => setPopupMessage(null)
            });
            setShowModal(true);
            return;
        }

        setShowModuleSection(true);
        setPopupMessage(null);
        setShowModal(false);
    };

   
    const handleFeatureToggle = (appId) => {
        setChildApplications(prevData => {
            // Find the clicked item
            const itemIndex = prevData.findIndex(item => item.appId === appId);
            if (itemIndex === -1) return prevData;
    
            // Get the clicked item
            const clickedItem = prevData[itemIndex];
    
            // Toggle the checked state
            const newCheckedState = !clickedItem.checked;
    
            // Create a new array to avoid mutating state directly
            const newData = [...prevData];
    
            // Update the clicked item
            newData[itemIndex] = { ...clickedItem, checked: newCheckedState };
    
            // If checking a child (not unchecking), ensure all its parents are checked too
            if (newCheckedState && clickedItem.parentHierarchy) {
                // Split the parent hierarchy to get each parent in the chain
                const parentChain = clickedItem.displayName.split("->");
                
                // Remove the last item (which is the current item)
                parentChain.pop();
                
                // Start with an empty path to build up the parent paths
                let currentPath = "";
                
                // Check each parent in the hierarchy
                for (let i = 0; i < parentChain.length; i++) {
                    // Build the current parent path
                    if (i === 0) {
                        currentPath = parentChain[i];
                    } else {
                        currentPath = `${currentPath}->${parentChain[i]}`;
                    }
                    
                    // Find the parent item by its display name
                    const parentIndex = newData.findIndex(item => item.displayName === currentPath);
                    
                    if (parentIndex !== -1) {
                        // Ensure the parent is checked
                        newData[parentIndex] = { ...newData[parentIndex], checked: true };
                    }
                }
            }
            
            // If this is a parent item being unchecked, uncheck all its children
            if (!newCheckedState && clickedItem.isParent) {
                const clickedPath = clickedItem.displayName;
                
                // Find and uncheck all children
                for (let i = 0; i < newData.length; i++) {
                    const item = newData[i];
                    // Check if this item is a child of the clicked parent
                    if (item.displayName !== clickedPath && 
                        item.displayName.startsWith(clickedPath + "->")) {
                        // Uncheck this child
                        newData[i] = { ...item, checked: false };
                    }
                }
            }
    
            return newData;
        });
    };

    const handleSelectAllFeatures = () => {
        const allChecked = childApplications.every(item => item.checked);
        setChildApplications(prevData =>
            prevData.map(mod => ({ ...mod, checked: !allChecked }))
        );
    };

    const handleSave = async () => {
        try {
           
            setLoading(true);
            
            // Get the selected (checked) and unselected (unchecked) child applications
            const selectedChildren = childApplications.filter(item => item.checked);
            const unselectedChildren = childApplications.filter(item => !item.checked);
    
            console.log("Selected children:", selectedChildren);
            console.log("Unselected children:", unselectedChildren);
    
            if (childApplications.length === 0) {
                setPopupMessage({
                    message: "No child applications available to update.",
                    type: "warning",
                    onClose: () => setPopupMessage(null)
                });
                setShowModal(true);
                setLoading(false); 
                return;
            }
    
            // Get list of app IDs already assigned to this template
            const assignedAppIds = new Set(
                Array.isArray(templateModules) ? templateModules.map(module => module.appId) : []
            );
    
            console.log("Currently assigned app IDs:", Array.from(assignedAppIds));
    
           
            if (Array.isArray(templateModules)) {
                templateModules.forEach(module => {
                    console.log(`Template module check: ${module.appId}, status: ${module.status}`);
                });
            }
    
            
            const applicationStatusUpdates = [];
            const templateApplicationAssignments = [];
    
            
            if (!assignedAppIds.has(selectedParentApp)) {
                templateApplicationAssignments.push({
                    templateId: Number(selectedTemplate),
                    appId: selectedParentApp,
                    
                    
                    status: "y"  
                });
            }
    
            // Process each child application
            childApplications.forEach(child => {
                const appId = child.appId;
                const isChecked = child.checked;
                const status = isChecked ? "y" : "n";
                const isAssigned = assignedAppIds.has(appId);
    
                console.log(`Processing app ${appId}, checked: ${isChecked}, assigned: ${isAssigned}`);
    
                if (isAssigned) {
                    // For already assigned apps, always include a status update
                    applicationStatusUpdates.push({
                        appId: appId,
                        status: status
                    });
                    console.log(`Added status update for ${appId}: ${status}`);
                } else if (isChecked) {
                    
                    templateApplicationAssignments.push({
                        templateId: Number(selectedTemplate),
                        appId: appId,
                        lastChgBy: 0,
                        orderNo: 1,
                        status: "y"
                    });
                    console.log(`Added new assignment for ${appId}`);
                } else {
                    
                    applicationStatusUpdates.push({
                        appId: appId,
                        status: "n" 
                    });
                    console.log(`Added status update for unchecked app ${appId}: n`);
                }
            });
    
            
            const allTemplateApps = await getRequest(`${ASSIGN_TEMPLATES}/getAllTemplateById/${selectedTemplate}`);
            if (allTemplateApps?.response) {
                allTemplateApps.response.forEach(app => {
                    const appId = app.appId;
                   
                    if (appId === selectedParentApp) return;
    
                    
                    const childApp = childApplications.find(child => child.appId === appId);
                    if (childApp && !childApp.checked) {
                        
                        const hasUpdate = applicationStatusUpdates.some(update => update.appId === appId);
                        if (!hasUpdate) {
                            applicationStatusUpdates.push({
                                appId: appId,
                                status: "n"  
                            });
                            console.log(`Added missing status update for unchecked app ${appId}: n`);
                        }
                    }
                });
            }
    
            console.log("Status updates:", applicationStatusUpdates);
            console.log("Template assignments:", templateApplicationAssignments);
    
           
            if (applicationStatusUpdates.length === 0 && templateApplicationAssignments.length === 0) {
                setPopupMessage({
                    message: "No changes detected to apply.",
                    type: "info",
                    onClose: () => setPopupMessage(null)
                });
                setShowModal(true);
                setLoading(false); 
                return;
            }
    
            const payload = {
                applicationStatusUpdates: applicationStatusUpdates,
                templateApplicationAssignments: templateApplicationAssignments
            };
    
            console.log("Final payload being sent to API:", payload);
    
            
            const response = await postRequest(`${MAS_APPLICATION}/assignUpdateTemplate`, payload);
            console.log("API response:", response);
    
            if (response) {
                if (response.status === 200 || response.status === 207) {
                    
                    const message = response.data || "Assign template to application successfully";
    
                    setPopupMessage({
                        message: message,
                        type: response.status === 200 ? "success" : "warning",
                        onClose: () => {
                            setPopupMessage(null);
                            
                            handleParentApplicationSelect({ target: { value: selectedParentApp } });
                        }
                    });
                } else {
                   
                    throw new Error(response.message || "Failed to process request");
                }
            } else {
                throw new Error("No response received from server");
            }
    
            setShowModal(true);
        } catch (error) {
            console.error("Error saving template application:", error);
    
            setPopupMessage({
                message: error.message || "Failed to assign template to application",
                type: "error",
                onClose: () => setPopupMessage(null)
            });
            setShowModal(true);
        } finally {
            
            setLoading(false);
        }
    };

    const handlePrevious = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    
    const renderNestedItem = (item) => {
       
        const indentStyle = {
            paddingLeft: `${item.nestLevel * 20}px`,
            display: 'flex',
            alignItems: 'center'
        };

        
        const toggleIconStyle = {
            cursor: 'pointer',
            marginRight: '8px',
            fontWeight: 'bold',
            color: '#007bff',
            width: '20px',
            height: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '3px',
            background: item.isParent ? '#f0f7ff' : 'transparent'
        };

        
        const displayText = item.nestLevel === 0
            ? item.module
            : item.displayName; 

        return (
            <tr key={item.srNo} className={item.isParent ? "parent-row" : "child-row"}>
                <td>{item.srNo}</td>
                <td>
                    <div style={indentStyle}>
                       
                        {item.isParent && (
                            <span
                                style={toggleIconStyle}
                                onClick={() => handleToggleExpand(item.appId)}
                            >
                                {item.expanded ? '▼' : '►'}
                            </span>
                        )}
                        {/* Display the name with full hierarchy path */}
                        <span style={{
                            fontWeight: item.isParent ? 'bold' : 'normal',
                            color: item.isParent ? '#333' : '#555'
                        }}>
                            {displayText}
                        </span>
                    </div>
                </td>
                <td>
                    <div className="form-check form-check-muted m-0">
                        <label className="form-check-label">
                            <input
                                type="checkbox"
                                style={{ width: '20px', height: '20px', border: '2px solid black' }}
                                className="form-check-input"
                                checked={item.checked}
                                onChange={() => handleFeatureToggle(item.appId)}
                            />
                        </label>
                    </div>
                </td>
            </tr>
        );
    };

    return (
        <div className="content-wrapper">
            {loading ? (
                <LoadingScreen />
            ) : (
                <div className="row">
                    <div className="col-12 grid-margin stretch-card">
                        <div className="card form-card">
                            <div className="card-body">
                                <form className="forms row">
                                    <h5 className="bg-light p-3 rounded">Assign Application To Template</h5>
                                    <div className="row mt-4">
                                        <div className="form-group col-md-2 mt-2">
                                            <label>Template Name</label>
                                        </div>
                                        <div className="form-group col-md-4 mt-1">
                                            <select
                                                className="form-control"
                                                id="templateSelect"
                                                required
                                                onChange={handleTemplateSelect}
                                                value={selectedTemplate}
                                            >
                                                <option value="" disabled>Select Template</option>
                                                {templates.map((template) => (
                                                    <option key={template.id} value={template.id}>
                                                        {template.templateName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group col-md-4 mt-1">
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                onClick={handleAddClick}
                                            >
                                                Application
                                            </button>
                                        </div>
                                    </div>

                                    {showModuleSection && (
                                        <div className="row mt-4">
                                            <div className="form-group col-md-2 mt-2">
                                                <label>Module Name</label>
                                            </div>
                                            <div className="form-group col-md-4 mt-1">
                                                <select
                                                    className="form-control"
                                                    id="ModuleName Select"
                                                    required
                                                    onChange={handleParentApplicationSelect}
                                                    value={selectedParentApp}
                                                >
                                                    <option value="" disabled>Select Parent Application</option>
                                                    {parentApplications.map((app) => (
                                                        <option key={app.id} value={app.id}>
                                                            {app.applicationName}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {/* Template Modules Table */}
                                    {selectedTemplate && (
                                        <div className="mt-4">
                                            <h6 className="mb-3">Template Modules</h6>
                                            <table className="mt-2 table table-bordered table-hover align-middle">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Sr No</th>
                                                        <th>Assigned Module</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {templateModules.length > 0 ? (
                                                        templateModules.map((item) => (
                                                            <tr key={item.srNo}>
                                                                <td>{item.srNo}</td>
                                                                <td>{item.module}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="2" className="text-center">No modules assigned to this template</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {/* Child Applications Table with Checkboxes - IMPROVED WITH EXPANDABLE NESTED STRUCTURE */}
                                    {showModuleSection && showModuleTable && (
                                        <div className="mt-4">
                                            <h6 className="mb-3">Child Applications</h6>
                                            <table className="mt-2 table table-bordered table-hover align-middle">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Sr No</th>
                                                        <th>Assigned Module</th>
                                                        <th>
                                                            <label className="form-check-label">
                                                                <input
                                                                    type="checkbox"
                                                                    style={{
                                                                        width: "15px",
                                                                        height: '15px',
                                                                        border: '2px solid black',
                                                                        boxShadow: 'none',
                                                                        outline: 'none'
                                                                    }}
                                                                    className="form-check-input me-2"
                                                                    checked={childApplications.length > 0 && childApplications.every(item => item.checked)}
                                                                    onChange={handleSelectAllFeatures}
                                                                />
                                                                Select All
                                                            </label>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {childApplications.length > 0 ? (
                                                        // Filter to show only visible items (parents and children of expanded parents)
                                                        childApplications
                                                            .filter(item => {
                                                                // If it's a top-level item or has no parent hierarchy, always show
                                                                if (!item.parentHierarchy) return true;

                                                                // For nested items, check if their parent chain is expanded
                                                                const parentChain = item.parentHierarchy.split(" -> ");
                                                                let currentPath = "";

                                                                // Check each ancestor in the chain
                                                                for (let i = 0; i < parentChain.length; i++) {
                                                                    if (i > 0) currentPath += " -> ";
                                                                    currentPath += parentChain[i];

                                                                    // Find this ancestor
                                                                    const ancestor = childApplications.find(
                                                                        app => app.displayName === currentPath
                                                                    );

                                                                    // If any ancestor is collapsed, don't show this item
                                                                    if (ancestor && !ancestor.expanded) {
                                                                        return false;
                                                                    }
                                                                }

                                                                return true;
                                                            })
                                                            .map(item => renderNestedItem(item))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="3" className="text-center">No child applications found</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                            <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                                                <button
                                                    type="button"
                                                    className="btn btn-primary me-2"
                                                    onClick={handleSave}
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                        {showModal && popupMessage && (
                            <Popup
                                message={popupMessage.message}
                                type={popupMessage.type}
                                onClose={popupMessage.onClose}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Assignapplication;