import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import axios from "axios";
import { API_HOST,ROLE,ALL_ROLE } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading";
import { postRequest,putRequest,getRequest } from "../../../service/apiService";

const Rolemaster = () => {
    const [roleData, setRoleData] = useState([]);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, roleId: null, newStatus: false });
    const [formData, setFormData] = useState({ roleCode: "", roleDesc: "" });
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageInput, setPageInput] = useState("");
    const itemsPerPage = 5;


    const ROLE_CODE_MAX_LENGTH = 255;
    const ROLE_NAME_MAX_LENGTH = 255;

    useEffect(() => {
        fetchRoles(0);
    }, []);


    const fetchRoles = async (flag = 0) => {
        setLoading(true);
        setError(null);
        try {
            const response = await getRequest(`${ALL_ROLE}/${flag}`);
            console.log("API Response:", response);
    
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
    


    const showPopup = (message, type = 'info') => {
        setPopupMessage({
            message,
            type,
            onClose: () => {
                setPopupMessage(null);
            }
        });
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const filteredRoleData = roleData.filter(role =>
        role.roleCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.roleDesc.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prevData => ({ ...prevData, [id]: value }));

        // Check form validity after state update
        const updatedFormData = { ...formData, [id]: value };
        setIsFormValid(
            updatedFormData.roleCode.trim() !== "" &&
            updatedFormData.roleDesc.trim() !== ""
        );
    };

    const handleRoleEdit = (role) => {
        setEditingRole(role);
        setFormData({
            roleCode: role.roleCode,
            roleDesc: role.roleDesc
        });
        setShowForm(true);
        setIsFormValid(true);
    };

    const handleRoleSave = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;
    
        try {
            setLoading(true);
    
            // Check for duplicates excluding the current editing role
            const isDuplicate = roleData.some(
                (role) =>
                    (editingRole ? role.id !== editingRole.id : true) &&
                    (role.roleCode === formData.roleCode || role.roleDesc === formData.roleDesc)
            );
    
            if (isDuplicate) {
                showPopup("Role with the same code or description already exists!", "error");
                setLoading(false);
                return;
            }
    
            if (editingRole) {
                // Update existing role
                const response = await putRequest(`${ROLE}/update/${editingRole.id}`, {
                    roleCode: formData.roleCode,
                    roleDesc: formData.roleDesc,
                    status: editingRole.isActive,
                });
    
                console.log("Update Response:", response);
    
                if (response && response.response) {
                    const updatedRole = response.response;
    
                    setRoleData((prevData) =>
                        prevData.map((role) =>
                            role.id === editingRole.id
                                ? {
                                      ...role,
                                      roleCode: updatedRole.roleCode || formData.roleCode,
                                      roleDesc: updatedRole.roleDesc || formData.roleDesc,
                                      isActive: (updatedRole.status || role.isActive)?.toLowerCase(),
                                  }
                                : role
                        )
                    );
    
                    showPopup("Role updated successfully!", "success");
                } else {
                    throw new Error("Invalid response from server");
                }
            } else {
                // Create a new role
                const response = await postRequest(`${ROLE}/create`, {
                    roleCode: formData.roleCode,
                    roleDesc: formData.roleDesc,
                    status: "y",
                });
    
                console.log("Create Response:", response);
    
                if (response && response.response) {
                    const newRole = response.response;
    
                    setRoleData((prevData) => [
                        ...prevData,
                        {
                            id: newRole.id || Date.now(),
                            roleCode: newRole.roleCode || formData.roleCode,
                            roleDesc: newRole.roleDesc || formData.roleDesc,
                            isActive: newRole.status || "n",
                        },
                    ]);
    
                    showPopup("Role added successfully!", "success");
                } else {
                    throw new Error("Invalid response from server");
                }
            }
    
            setFormData({ roleCode: "", roleDesc: "" });
            setEditingRole(null);
        } catch (error) {
            console.error("Error saving role:", error);
            showPopup("An error occurred while saving the role!", "error");
        } finally {
            setLoading(false);
        }
    };
    


    const handleSwitchChange = (id, currentStatus) => {
        
        const newStatus = (currentStatus?.toLowerCase() === "y") ? "n" : "y";
        
        setConfirmDialog({
            isOpen: true,
            roleId: id,
            newStatus: newStatus
        });
    };

    const handleConfirm = async (confirmed) => {
        if (confirmed && confirmDialog.roleId !== null) {
            try {
                setLoading(true);
                
                const response = await putRequest(
                    `${ROLE}/status/${confirmDialog.roleId}?status=${confirmDialog.newStatus}`
                );
                
                if (response && response.status === 200) {
                    // Update the local state with the string value as received from the API
                    setRoleData(prevData =>
                        prevData.map(role =>
                            role.id === confirmDialog.roleId
                                ? { ...role, isActive: confirmDialog.newStatus }
                                : role
                        )
                    );
                    
                    showPopup(
                        `Role ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
                        "success"
                    );
                }
            } catch (err) {
                console.error("Error updating role status:", err);
                showPopup(`Failed to update status: ${err.response?.data?.message || err.message}`, "error");
            } finally {
                setLoading(false);
            }
        }
        setConfirmDialog({ isOpen: false, roleId: null, newStatus: null });
    };

    const filteredTotalPages = Math.ceil(filteredRoleData.length / itemsPerPage);
    const currentItems = filteredRoleData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageNavigation = () => {
        const pageNumber = parseInt(pageInput, 10);
        if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
            setCurrentPage(pageNumber);
        } else {
            showPopup("Please enter a valid page number.", "warning");
        }
    };

    const renderPagination = () => {
        const pageNumbers = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        const endPage = Math.min(filteredTotalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            pageNumbers.push(1);
            if (startPage > 2) pageNumbers.push("...");
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        if (endPage < filteredTotalPages) {
            if (endPage < filteredTotalPages - 1) pageNumbers.push("...");
            pageNumbers.push(filteredTotalPages);
        }

        return pageNumbers.map((number, index) => (
            <li key={index} className={`page-item ${number === currentPage ? "active" : ""}`}>
                {typeof number === "number" ? (
                    <button className="page-link" onClick={() => setCurrentPage(number)}>
                        {number}
                    </button>
                ) : (
                    <span className="page-link disabled">{number}</span>
                )}
            </li>
        ));
    };

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title p-2">Role Master</h4>
                            <div className="d-flex justify-content-between align-items-center">
                                <form className="d-inline-block searchform me-4" role="search">
                                    <div className="input-group searchinput">
                                        <input
                                            type="search"
                                            className="form-control"
                                            placeholder="Search"
                                            aria-label="Search"
                                            value={searchQuery}
                                            onChange={handleSearchChange}
                                        />
                                        <span className="input-group-text" id="search-icon">
                                            <i className="fa fa-search"></i>
                                        </span>
                                    </div>
                                </form>

                                <div className="d-flex align-items-center">
                                    {!showForm ? (
                                        <>
                                            <button
                                                type="button"
                                                className="btn btn-success me-2"
                                                onClick={() => {
                                                    setShowForm(true);
                                                    setFormData({ roleCode: "", roleDesc: "" });
                                                    setEditingRole(null);
                                                    setIsFormValid(false);
                                                }}
                                            >
                                                <i className="mdi mdi-plus"></i> Add
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-success me-2"
                                                onClick={() => fetchRoles(0)}
                                            >
                                                <i className="mdi mdi-refresh"></i> Show All
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                setShowForm(false);
                                                setEditingRole(null);
                                            }}
                                        >
                                            <i className="mdi mdi-arrow-left"></i> Back
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <LoadingScreen />
                            ) : !showForm ? (
                                <div className="table-responsive packagelist">
                                    {roleData.length === 0 ? (
                                        <div className="alert alert-info text-center">
                                            No roles found.
                                        </div>
                                    ) : (
                                        <table className="table table-bordered table-hover align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Role Code</th>
                                                    <th>Role Description</th>
                                                    <th>Status</th>
                                                    <th>Edit</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentItems.map((role) => (
                                                    <tr key={role.id}>
                                                        <td>{role.roleCode || "No Code"}</td>
                                                        <td>{role.roleDesc || "No Description"}</td>
                                                        <td>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={role.isActive?.toLowerCase() === "y"}
                                                                    onChange={() => handleSwitchChange(role.id, role.isActive)}
                                                                    id={`switch-${role.id}`}
                                                                />
                                                                <label
                                                                    className="form-check-label px-0"
                                                                    htmlFor={`switch-${role.id}`}
                                                                >
                                                                    {role.isActive?.toLowerCase() === "y" ? 'Active' : 'Deactivated'}
                                                                </label>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="btn btn-sm btn-success me-2"
                                                                onClick={() => handleRoleEdit(role)}
                                                                disabled={role.isActive?.toLowerCase() !== "y"}
                                                            >
                                                                <i className="fa fa-pencil"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}

                                    {filteredRoleData.length > 0 && (
                                        <nav className="d-flex justify-content-between align-items-center mt-3">
                                            <div>
                                                <span>
                                                    Page {currentPage} of {filteredTotalPages} | Total Records: {filteredRoleData.length}
                                                </span>
                                            </div>
                                            <ul className="pagination mb-0">
                                                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                                    <button
                                                        className="page-link"
                                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                        disabled={currentPage === 1}
                                                    >
                                                        &laquo; Previous
                                                    </button>
                                                </li>
                                                {renderPagination()}
                                                <li className={`page-item ${currentPage === filteredTotalPages ? "disabled" : ""}`}>
                                                    <button
                                                        className="page-link"
                                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, filteredTotalPages))}
                                                        disabled={currentPage === filteredTotalPages}
                                                    >
                                                        Next  &raquo;
                                                    </button>
                                                </li>
                                            </ul>
                                            <div className="d-flex align-items-center">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={filteredTotalPages}
                                                    value={pageInput}
                                                    onChange={(e) => setPageInput(e.target.value)}
                                                    placeholder="Go to page"
                                                    className="form-control me-2"
                                                    style={{ width: '100px' }}
                                                />
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={handlePageNavigation}
                                                >
                                                    Go
                                                </button>
                                            </div>
                                        </nav>
                                    )}
                                </div>
                            ) : (
                                <form className="forms row" onSubmit={handleRoleSave}>
                                    <div className="form-group col-md-4">
                                        <label>Role Code <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control  mt-1"
                                            id="roleCode"
                                            name="roleCode"
                                            placeholder="Role Code"
                                            value={formData.roleCode}
                                            onChange={handleInputChange}
                                            maxLength={ROLE_CODE_MAX_LENGTH}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-4">
                                        <label>Role Description <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control  mt-1"
                                            id="roleDesc"
                                            name="roleDesc"
                                            placeholder="Role Description"
                                            value={formData.roleDesc}
                                            onChange={handleInputChange}
                                            maxLength={ROLE_NAME_MAX_LENGTH}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                                        <button
                                            type="submit"
                                            className="btn btn-primary me-2"
                                            disabled={!isFormValid}
                                        >
                                            {editingRole ? 'Update' : 'Save'}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={() => {
                                                setShowForm(false);
                                                setEditingRole(null);
                                                setFormData({ roleCode: "", roleDesc: "" });
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Popup Component */}
                            {popupMessage && (
                                <Popup
                                    message={popupMessage.message}
                                    type={popupMessage.type}
                                    onClose={popupMessage.onClose}
                                />
                            )}

                            {/* Confirmation Dialog */}
                            {confirmDialog.isOpen && (
                                <div className="modal d-block" tabIndex="-1" role="dialog">
                                    <div className="modal-dialog" role="document">
                                        <div className="modal-content">
                                            <div className="modal-header">
                                                <h5 className="modal-title">Confirm Status Change</h5>
                                                <button
                                                    type="button"
                                                    className="close"
                                                    onClick={() => handleConfirm(false)}
                                                >
                                                    <span>&times;</span>
                                                </button>
                                            </div>
                                            <div className="modal-body">
                                                <p>
                                                    Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{roleData.find(role => role.id === confirmDialog.roleId)?.roleDesc}</strong>?
                                                </p>
                                            </div>
                                            <div className="modal-footer">
                                                <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>No</button>
                                                <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>Yes</button>
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

export default Rolemaster;