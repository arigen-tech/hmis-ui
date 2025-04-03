import React, { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { getRequest, postRequest } from "../../../service/apiService"; 
import { ALL_ROLE, ALL_TEMPLATES, ROLE_TEMPLATE } from "../../../config/apiConfig"; 

const Rolesrights = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [popupMessage, setPopupMessage] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [roleData, setRoleData] = useState([]);
    const [templateData, setTemplateData] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [selectedRole, setSelectedRole] = useState("");
    const [selectedRoleId, setSelectedRoleId] = useState(null);
    const [originalTemplateState, setOriginalTemplateState] = useState([]);

    useEffect(() => {
        fetchRoles(1);
        fetchTemplates(1);
       
    }, []);

    const fetchRoles = async (flag = 1) => {
        setLoading(true);
        setError(null);
        try {
            const response = await getRequest(`${ALL_ROLE}/${flag}`);
            console.log("API Response (Roles):", response);
            
            if (response && response.response) {
                const mappedRoles = response.response.map(role => ({
                    id: role.id,
                    roleCode: role.roleCode,
                    roleDesc: role.roleDesc,
                    isActive: role.status?.toLowerCase()
                }));
                setRoleData(mappedRoles);
            } else {
                throw new Error("Invalid response structure");
            }
        } catch (err) {
            console.error("Error fetching roles:", err);
            setError("Failed to fetch roles. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async (flag = 1) => {
        setLoading(true);
        setError(null);
        try {
            const response = await getRequest(`${ALL_TEMPLATES}/${flag}`);
            
            if (response && response.response) {
                const templateList = response.response || [];
                const mappedTemplates = templateList.map(template => ({
                    id: template.id,
                    code: template.templateCode || "No Code",
                    name: template.templateName || "No Name",
                    status: template.status || "n",
                    checked: false
                }));
                
                setTemplateData(mappedTemplates);
                setTemplates(mappedTemplates);
            } else {
                throw new Error("Invalid template response structure");
            }
        } catch (err) {
            console.error("Error fetching templates:", err);
            setError("Failed to fetch templates. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const fetchRoleTemplateAssignments = async (roleId, flag = 1) => {
        setLoading(true);
        setError(null);
        try {
            const response = await getRequest(`${ROLE_TEMPLATE}/getAllAssignedTemplates/${roleId}/${flag}`);
            console.log("API Response (Role-Templates):", response);
            
            if (response && response.response) {
                const assignedTemplateIds = response.response.map(item => item.templateId);
                
                // Update templates with checked status based on role assignment
                const updatedTemplates = templateData.map(template => ({
                    ...template,
                    checked: assignedTemplateIds.includes(template.id)
                }));
                
                setTemplates(updatedTemplates);
                
                // Store the original state to track changes
                setOriginalTemplateState(updatedTemplates.map(template => ({
                    id: template.id,
                    checked: template.checked
                })));
            } else {
                // If no templates assigned, uncheck all
                const updatedTemplates = templateData.map(template => ({
                    ...template,
                    checked: false
                }));
                
                setTemplates(updatedTemplates);
                setOriginalTemplateState(updatedTemplates.map(template => ({
                    id: template.id,
                    checked: false
                })));
            }
        } catch (err) {
            console.error("Error fetching role-template assignments:", err);
            setError("Failed to fetch template assignments. Please try again later.");
            
            // Reset templates to unchecked state on error
            const updatedTemplates = templateData.map(template => ({
                ...template,
                checked: false
            }));
            
            setTemplates(updatedTemplates);
            setOriginalTemplateState(updatedTemplates.map(template => ({
                id: template.id,
                checked: false
            })));
        } finally {
            setLoading(false);
        }
    };

    const handleResetClick = () => {
        const selectElement = document.getElementById("roleSelect");
        if (selectElement) {
            selectElement.value = ""; // Reset dropdown to default
        }
        setSelectedRole("");
        setSelectedRoleId(null);
        
        // Reset templates to unchecked state
        setTemplates(prevTemplates => prevTemplates.map(template => ({
            ...template,
            checked: false
        })));
        
        setOriginalTemplateState([]);
    };

    const handleRoleChange = (event) => {
        const selectedValue = event.target.value;
        
        if (!selectedValue) {
            handleResetClick();
            return;
        }
        
        const role = roleData.find(r => r.roleCode === selectedValue);
        
        if (role) {
            setSelectedRole(role.roleCode);
            setSelectedRoleId(role.id);
            fetchRoleTemplateAssignments(role.id, 1); 
        } else {
            showPopup("Error: Selected role not found", "error");
        }
    };
    const handleSave = async () => {
        // Check if a role is selected
        if (!selectedRole || !selectedRoleId) {
            showPopup("Please select a role first!", "warning");
            return;
        }
        
        // Get templates whose status changed (both newly checked and newly unchecked)
        const changedTemplates = templates.filter(template => {
            const originalState = originalTemplateState.find(t => t.id === template.id);
            return originalState && originalState.checked !== template.checked;
        });
        
        if (changedTemplates.length === 0) {
            showPopup("No changes detected. Please modify at least one template assignment.", "warning");
            return;
        }
        
        // Format templates based on their checked status
        const templateUpdates = changedTemplates.map(template => ({
            roleId: selectedRoleId,
            templateId: template.id,
            status: template.checked ? "y" : "n",
            lastChgBy: 0
        }));
        
        setLoading(true);
        try {
            // Match the format from Swagger documentation
            const requestPayload = {
                applicationStatusUpdates: templateUpdates
            };
            
            console.log("Sending payload to API:", JSON.stringify(requestPayload));
            
            // Call API to save the template assignments
            const response = await postRequest(`${ROLE_TEMPLATE}/assignTemplates`, requestPayload);
            
            // Check for numeric status 200 instead of string 'SUCCESS'
            if (response && (response.status === 200 || response.message?.toLowerCase() === 'success')) {
                showPopup("Roles and rights saved successfully!", "success");
                
                // Update the original state to reflect the saved changes
                setOriginalTemplateState(templates.map(template => ({
                    id: template.id,
                    checked: template.checked
                })));
            } else {
                showPopup("Failed to save roles and rights. Please try again.", "error");
            }
        } catch (err) {
            console.error("Error saving role-template assignments:", err);
            showPopup("An error occurred while saving. Please try again later.", "error");
        } finally {
            setLoading(false);
        }
    };

    const showPopup = (message, type = 'info') => {
        setPopupMessage({
            message,
            type,
            onClose: () => {
                setPopupMessage(null);
            }
        });
        setShowModal(true);
    };

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title p-2">Role Rights</h4>
                            <div className="d-flex justify-content-between align-items-center">
                                <button
                                    type="button"
                                    className="btn btn-success me-2"
                                    onClick={() => {
                                        fetchRoles(0);
                                        fetchTemplates(0);
                                        handleResetClick();
                                    }}
                                >
                                    <i className="mdi mdi-refresh"></i> Refresh
                                </button>
                            </div>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <LoadingScreen />
                            ) : error ? (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            ) : (
                                <form className="forms row">
                                    <div className="row mb-4">
                                        <div className="col-md-4">
                                            <div className="form-group">
                                                <label className="mb-2">Select Role</label>
                                                <select
                                                    className="form-control"
                                                    id="roleSelect"
                                                    value={selectedRole}
                                                    onChange={handleRoleChange}
                                                    required
                                                >
                                                    <option value="">Select Role</option>
                                                    {roleData
                                                        .filter(role => role.isActive === "y")
                                                        .map(role => (
                                                            <option key={role.id} value={role.roleCode}>
                                                                {role.roleDesc}
                                                            </option>
                                                        ))
                                                    }
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        <table className="table table-bordered table-hover align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th colSpan="2">Templates</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {templates.length > 0 ? (
                                                    templates.map((template, index) => (
                                                        <tr key={template.id}>
                                                            <td>{template.name}</td>
                                                            <td width="100" className="text-center">
                                                                <div className="form-check form-check-muted m-0">
                                                                    <label className="form-check-label">
                                                                        <input
                                                                            type="checkbox"
                                                                            style={{ width: '20px', height: '20px', border: '2px solid #6c757d' }}
                                                                            className="form-check-input"
                                                                            checked={template.checked || false}
                                                                            onChange={() => {
                                                                                const updatedTemplates = [...templates];
                                                                                updatedTemplates[index].checked = !updatedTemplates[index].checked;
                                                                                setTemplates(updatedTemplates);
                                                                            }}
                                                                            disabled={!selectedRole}
                                                                        />
                                                                        <i className="input-helper"></i>
                                                                    </label>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="2" className="text-center">No templates available</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="d-flex justify-content-end mt-4">
                                        <button type="button" className="btn btn-primary me-2" onClick={handleSave}>
                                            <i className="mdi mdi-content-save"></i> Save
                                        </button>
                                        <button type="button" className="btn btn-warning me-2" onClick={handleResetClick}>
                                            <i className="mdi mdi-refresh"></i> Reset
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Popup Component */}
                            {showModal && popupMessage && (
                                <Popup
                                    message={popupMessage.message}
                                    type={popupMessage.type}
                                    onClose={() => {
                                        setShowModal(false);
                                        setPopupMessage(null);
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Rolesrights;