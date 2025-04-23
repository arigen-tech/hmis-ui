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
            const response = await getRequest(`${APPLICATION}/getAllChildren/${selectedParentId}`);
    
            if (response && response.response) {
               
                const mappedChildApplications = response.response.map((app, index) => {
                    
                    const isChecked = app.status === "y";
                    
                    return {
                        srNo: index + 1,
                        module: app.name,
                        templateId: app.appId,
                        appId: app.appId,
                        status: app.status,
                        lastChgDate: app.lastChgDate,
                        checked: isChecked 
                    };
                });
    
                setChildApplications(mappedChildApplications);
                setShowModuleTable(true);
            }
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

    // Existing template select handler
    const handleTemplateSelect = async (e) => {
        const selectedTemplateId = e.target.value;
        setSelectedTemplate(selectedTemplateId);
    
        try {
            const response = await getRequest(`${ASSIGN_TEMPLATES}/getAllTemplateById/${selectedTemplateId}`);
    
            if (response && response.response) {
                console.log("Template response:", response.response);
                
                const formattedData = response.response.map((template, index) => {
                    console.log("Individual template item:", template);
                    
                    return {
                        srNo: index + 1,
                        module: template.appName || "Unknown Module", // Use the correct property name
                        templateId: template.templateId,
                        appId: template.appId,
                        status: template.status,
                        lastChgDate: template.lastChgDate
                    };
                });
                
                setTemplateModules(formattedData);
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
            // Get the selected child applications that are checked
            const selectedChildren = childApplications.filter(item => item.checked);
            
            if (selectedChildren.length === 0) {
                setPopupMessage({
                    message: "Please select at least one child application.",
                    type: "warning",
                    onClose: () => setPopupMessage(null)
                });
                setShowModal(true);
                return;
            }
            
            // Get the current parent application information
            const parentApp = parentApplications.find(app => app.id === selectedParentApp);
            const parentName = parentApp?.applicationName;
            
            // Check if this parent is already assigned to the selected template
            const parentAlreadyAssigned = templateModules.some(
                module => module.module === parentName || 
                         module.module.startsWith(parentName + '->')
            );
            
            // Prepare application status updates for all children
            const applicationStatusUpdates = childApplications.map(child => ({
                appId: child.appId,
                status: child.checked ? "y" : "n"
            }));
            
            // Create a single assignment for the parent, but only if it's not already assigned
            const templateApplicationAssignments = [];
            if (!parentAlreadyAssigned && selectedChildren.length > 0) {
                templateApplicationAssignments.push({
                    templateId: Number(selectedTemplate),
                    appId: selectedParentApp,  // Use parent ID here
                    lastChgBy: 0,
                    orderNo: 1
                });
            }
            
            const payload = {
                applicationStatusUpdates: applicationStatusUpdates,
                templateApplicationAssignments: templateApplicationAssignments,
                parentAlreadyExists: parentAlreadyAssigned
            };
            
            console.log("Sending payload:", JSON.stringify(payload));
            
            // Proceed with API call if there are status updates or a new parent to assign
            const response = await postRequest(`${APPLICATION}/assignUpdateTemplate`, payload);
            
            if (response && (response.success || response.status === 200)) {
                let message = "Application status updated successfully!";
                if (templateApplicationAssignments.length > 0) {
                    message = "Template application assigned successfully!";
                }
                
                setPopupMessage({
                    message: message,
                    type: "success",
                    onClose: () => setPopupMessage(null)
                });
                setShowModal(true);
                setSelectedTemplate('');
                setSelectedParentApp('');
                setChildApplications([]);
                setShowModuleSection(false);
                setShowModuleTable(false);
            } else {
                throw new Error((response && response.message) || "Failed to assign template to application");
            }
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
                                                {templateModules.map((item) => (
                                                    <tr key={item.srNo}>
                                                        <td>{item.srNo}</td>
                                                        <td>{item.module}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Parent Application Children Table with Checkboxes */}
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
                                                                checked={childApplications.every(item => item.checked)}
                                                                onChange={handleSelectAllFeatures}
                                                            />
                                                            Select All
                                                        </label>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {childApplications.map((item) => (
                                                    <tr key={item.srNo}>
                                                        <td>{item.srNo}</td>
                                                        <td>
                                                            {parentApplications.find(app => app.id === selectedParentApp)?.applicationName}
                                                            {'->'} {item.module}
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
                                                ))}
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