import React, { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import { API_HOST, ALL_TEMPLATES, ASSIGN_TEMPLATES, APPLICATION } from "../../../config/apiConfig";

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

    // Fetch parent applications on component mount
    useEffect(() => {
        fetchTemplates(1);
        fetchParentApplications();
    }, []);

    // Fetch parent applications from API
    const fetchParentApplications = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getRequest(`${APPLICATION}/getAllParents/1`);

            if (response && response.response) {
                const mappedApplications = response.response
                    // Filter only applications where parentId matches appId (parent applications)
                    .filter(app => app.parentId === "0")
                    .map(app => ({
                        id: app.appId,
                        applicationCode: app.appId,
                        applicationName: app.name,
                        status: app.status || "n"
                    }));

                setParentApplications(mappedApplications);
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
            const response = await getRequest(`${ALL_TEMPLATES}/${flag}`);

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


    const handleParentApplicationSelect = async (e) => {
        const selectedParentId = e.target.value;
        setSelectedParentApp(selectedParentId);

        try {
            // 1. Fetch child applications for the selected parent
            const childResponse = await getRequest(`${APPLICATION}/getAllChildren/${selectedParentId}?templateId=${selectedTemplate || ''}`);

            if (!childResponse?.response) {
                throw new Error("Failed to fetch child applications");
            }

            // 2. Transform the response data
            const mappedChildApplications = childResponse.response.map((app, index) => ({
                srNo: index + 1,
                module: app.name,
                templateId: app.templateId || null,
                appId: app.appId,
                status: app.status?.toLowerCase() || 'n', // Ensure lowercase
                lastChgDate: app.lastChgDate,
                checked: app.assigned && app.status?.toLowerCase() === 'y' // Only checked if assigned AND status is 'y'
            }));

            setChildApplications(mappedChildApplications);
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
    };



    // Existing template select handler with minor improvements
    const handleTemplateSelect = async (e) => {
        const selectedTemplateId = e.target.value;
        setSelectedTemplate(selectedTemplateId);

        try {
            const response = await getRequest(`${ASSIGN_TEMPLATES}/getAllTemplateById/${selectedTemplateId}`);

            if (response && response.response) {
                console.log("Template response:", response.response);

                // The backend is already returning only parent modules (parentId = 0)
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

                // If a parent application is already selected, refresh the child applications
                if (selectedParentApp) {
                    // Re-fetch child applications with updated assigned status
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

    const handleFeatureToggle = (srNo) => {
        setChildApplications(prevData =>
            prevData.map(mod =>
                mod.srNo === srNo ? { ...mod, checked: !mod.checked } : mod
            )
        );
    };

    const handleSelectAllFeatures = () => {
        const allChecked = childApplications.every(item => item.checked);
        setChildApplications(prevData =>
            prevData.map(mod => ({ ...mod, checked: !allChecked }))
        );
    };


    const handleSave = async () => {
        try {
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
                return;
            }

            // Get list of app IDs already assigned to this template
            const assignedAppIds = new Set(
                Array.isArray(templateModules) ? templateModules.map(module => module.appId) : []
            );

            console.log("Currently assigned app IDs:", Array.from(assignedAppIds));

            // Debug template modules
            if (Array.isArray(templateModules)) {
                templateModules.forEach(module => {
                    console.log(`Template module check: ${module.appId}, status: ${module.status}`);
                });
            }

            // Prepare application status updates and template assignments
            const applicationStatusUpdates = [];
            const templateApplicationAssignments = [];

            // If parent app is not assigned yet, add it
            if (!assignedAppIds.has(selectedParentApp)) {
                templateApplicationAssignments.push({
                    templateId: Number(selectedTemplate),
                    appId: selectedParentApp,
                    lastChgBy: 0,
                    orderNo: 1,
                    status: "y"  // Always set parent as active
                });
            }

            // Process each child application
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
                    // For new assignments, only include checked ones
                    templateApplicationAssignments.push({
                        templateId: Number(selectedTemplate),
                        appId: appId,
                        lastChgBy: 0,
                        orderNo: 1,
                        status: "y"
                    });
                    console.log(`Added new assignment for ${appId}`);
                } else {
                    // CHANGE HERE: Don't skip unchecked applications - add a status update to explicitly mark them as inactive
                    applicationStatusUpdates.push({
                        appId: appId,
                        status: "n" // Set unchecked apps to inactive
                    });
                    console.log(`Added status update for unchecked app ${appId}: n`);
                }
            });

            // CRITICAL ADDITION: Make sure to get all template applications for the template
            // and explicitly set unchecked ones to status: 'n'
            const allTemplateApps = await getRequest(`${ASSIGN_TEMPLATES}/getAllTemplateById/${selectedTemplate}`);
            if (allTemplateApps?.response) {
                allTemplateApps.response.forEach(app => {
                    const appId = app.appId;
                    // Skip the parent app
                    if (appId === selectedParentApp) return;

                    // Find if this app is checked or not in our current state
                    const childApp = childApplications.find(child => child.appId === appId);
                    if (childApp && !childApp.checked) {
                        // Make sure we have a status update for this unchecked app
                        const hasUpdate = applicationStatusUpdates.some(update => update.appId === appId);
                        if (!hasUpdate) {
                            applicationStatusUpdates.push({
                                appId: appId,
                                status: "n"  // Explicitly set to 'n' for unchecked
                            });
                            console.log(`Added missing status update for unchecked app ${appId}: n`);
                        }
                    }
                });
            }

            console.log("Status updates:", applicationStatusUpdates);
            console.log("Template assignments:", templateApplicationAssignments);

            // Only proceed if we have something to update
            if (applicationStatusUpdates.length === 0 && templateApplicationAssignments.length === 0) {
                setPopupMessage({
                    message: "No changes detected to apply.",
                    type: "info",
                    onClose: () => setPopupMessage(null)
                });
                setShowModal(true);
                return;
            }

            const payload = {
                applicationStatusUpdates: applicationStatusUpdates,
                templateApplicationAssignments: templateApplicationAssignments
            };

            console.log("Final payload being sent to API:", payload);

            // Make the API call
            const response = await postRequest(`${APPLICATION}/assignUpdateTemplate`, payload);
            console.log("API response:", response);

            if (response) {
                if (response.status === 200 || response.status === 207) {
                    // Success or partial success
                    const message = response.data || "Assign template to application successfully";

                    setPopupMessage({
                        message: message,
                        type: response.status === 200 ? "success" : "warning",
                        onClose: () => {
                            setPopupMessage(null);
                            // Instead of refreshData, just reload the current data
                            handleParentApplicationSelect({ target: { value: selectedParentApp } });
                        }
                    }); // Increased timeout to ensure backend processing completes
                } else {
                    // Error case
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

    return (
        <div className="content-wrapper">
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



                                {/* Child Applications Table with Checkboxes */}
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
                                                                style={{ width: "15px", height: '15px', border: '2px solid black' }}
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
                                                    childApplications.map((item) => (
                                                        <tr key={item.srNo}>
                                                            <td>{item.srNo}</td>
                                                            <td>
                                                                {/* If the module name is the same as parent name, show only the module name */}
                                                                {item.module === parentApplications.find(app => app.id === selectedParentApp)?.applicationName
                                                                    ? item.module
                                                                    : `${parentApplications.find(app => app.id === selectedParentApp)?.applicationName} -> ${item.module}`}
                                                            </td>
                                                            <td>
                                                                <div className="form-check form-check-muted m-0">
                                                                    <label className="form-check-label">
                                                                        <input
                                                                            type="checkbox"
                                                                            style={{ width: '20px', height: '20px', border: '2px solid black' }}
                                                                            className="form-check-input"
                                                                            checked={item.checked}
                                                                            onChange={() => handleFeatureToggle(item.srNo)}
                                                                        />
                                                                    </label>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
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
        </div>
    );
};

export default Assignapplication;
