import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import { API_HOST,ALL_TEMPLATES,TEMPLATES } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";

const Templatemaster = () => {
    const [templateData, setTemplateData] = useState([]);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, applicationId: null, newStatus: false });
    const [formData, setFormData] = useState({ templateCode: "", templateName: "" });
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageInput, setPageInput] = useState("");
    const itemsPerPage = 5;

    const TEMPLATE_CODE_MAX_LENGTH = 48;
    const TEMPLATE_NAME_MAX_LENGTH = 120;

   
    const fetchTemplates = async (flag = 0) => {
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

            setTemplateData(mappedTemplates);
        } catch (err) {
            console.error("Error fetching templates:", err);
            setError("Failed to fetch templates. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates(0);
    }, []);

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

    const filteredTemplateData = templateData.filter(template =>
        template.templateCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.templateName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prevData => ({ ...prevData, [id]: value }));

        // Form validation
        setIsFormValid(
            formData.templateCode.trim() !== "" &&
            formData.templateName.trim() !== ""
        );
    };

    const handleTemplateEdit = (template) => {
        setEditingTemplate(template);
        setFormData({
            templateCode: template.templateCode,
            templateName: template.templateName
        });
        setShowForm(true);
        setIsFormValid(true);
    };

    const handleTemplateSave = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;
    
        try {
            setLoading(true);
    
            
            const isDuplicate = templateData.some(
                (template) =>
                    template.templateCode === formData.templateCode ||
                    template.templateName === formData.templateName
            );
    
            if (isDuplicate) {
                showPopup("Template with the same code or name already exists!", "error");
                setLoading(false);
                return;
            }
    
            if (editingTemplate) {
                // Update existing template
                const response = await putRequest(`${TEMPLATES}/edit/${editingTemplate.id}`, {
                    templateCode: formData.templateCode,
                    templateName: formData.templateName
                });
    
                console.log("Update Response:", response);
    
                if (response && response.response) {
                    const updatedTemplate = response.response;
    
                    // Update local state using the response from backend
                    setTemplateData(prevData =>
                        prevData.map(template =>
                            template.id === editingTemplate.id
                                ? {
                                    id: updatedTemplate.id || editingTemplate.id,
                                    templateCode: updatedTemplate.templateCode || formData.templateCode,
                                    templateName: updatedTemplate.templateName || formData.templateName,
                                    status: updatedTemplate.status || editingTemplate.status
                                }
                                : template
                        )
                    );
    
                    showPopup("Template updated successfully!", "success");
                } else {
                    throw new Error("Invalid response from server");
                }
            } else {
                // Create new template
                const response = await postRequest(`${TEMPLATES}/create`, {
                    templateCode: formData.templateCode,
                    templateName: formData.templateName,
                    status: "y"
                });
    
                console.log("Create Response:", response);
    
                if (response && response.response) {
                    const newTemplate = response.response;
    
                    // Add new entry to local state using the response from backend
                    setTemplateData(prevData => [
                        ...prevData,
                        {
                            id: newTemplate.id || Date.now(),
                            templateCode: newTemplate.templateCode || formData.templateCode,
                            templateName: newTemplate.templateName || formData.templateName,
                            status:  "n"
                        }
                    ]);
    
                    showPopup("New template added successfully!", "success");
                } else {
                    throw new Error("Invalid response from server");
                }
            }
    
            // Reset form
            setFormData({ templateCode: "", templateName: "" });
            setShowForm(false);
            setEditingTemplate(null);
            setIsFormValid(false);
        } catch (err) {
            console.error("Error saving template:", err);
            showPopup(`Failed to save: ${err.response?.data?.message || err.message}`, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSwitchChange = (id, currentStatus) => {
        setConfirmDialog({
            isOpen: true,
            applicationId: id,
            newStatus: currentStatus === "y" ? "n" : "y"
        });
    };

    const handleConfirm = async (confirmed) => {
        if (confirmed && confirmDialog.applicationId !== null) {
            try {
                setLoading(true);
                const response = await putRequest(
                    `${TEMPLATES}/status/${confirmDialog.applicationId}?status=${confirmDialog.newStatus}`
                );

                console.log("API Response:", response);

                if (response && response.response) {
                    const updatedTemplate = response.response;

                   
                    setTemplateData(prevData =>
                        prevData.map(template =>
                            template.id === confirmDialog.applicationId
                                ? {
                                    ...template,
                                    status: updatedTemplate.status || confirmDialog.newStatus
                                }
                                : template
                        )
                    );

                    showPopup(
                        `Template ${confirmDialog.newStatus === 'y' ? 'activated' : 'deactivated'} successfully!`,
                        "success"
                    );
                } else {
                    throw new Error("Invalid response from server");
                }
            } catch (err) {
                console.error("Error updating status:", err);
                showPopup("Failed to change status", "error");
            } finally {
                setLoading(false);
                setConfirmDialog({ isOpen: false, applicationId: null, newStatus: null });
            }
        } else {
            setConfirmDialog({ isOpen: false, applicationId: null, newStatus: null });
        }
    };

    // Pagination calculations
    const filteredTotalPages = Math.ceil(filteredTemplateData.length / itemsPerPage);
    const currentItems = filteredTemplateData.slice(
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
                            <h4 className="card-title p-2">Template Master</h4>
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
                                                    setFormData({ templateCode: "", templateName: "" });
                                                    setEditingTemplate(null);
                                                    setIsFormValid(false);
                                                }}
                                            >
                                                <i className="mdi mdi-plus"></i> Add
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-success me-2"
                                                onClick={fetchTemplates}
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
                                                setEditingTemplate(null);
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
                                    {templateData.length === 0 ? (
                                        <div className="alert alert-info text-center">
                                            No templates found.
                                        </div>
                                    ) : (
                                        <table className="table table-bordered table-hover align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Template Code</th>
                                                    <th>Template Name</th>
                                                    <th>Status</th>
                                                    <th>Edit</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentItems.map((template) => (
                                                    <tr key={template.id}>
                                                        <td>{template.templateCode || "No Code"}</td>
                                                        <td>{template.templateName || "No Name"}</td>
                                                        <td>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={template.status === "y"}
                                                                    onChange={() => handleSwitchChange(template.id, template.status)}
                                                                    id={`switch-${template.id}`}
                                                                />
                                                                <label
                                                                    className="form-check-label px-0"
                                                                    htmlFor={`switch-${template.id}`}
                                                                >
                                                                    {template.status === "y" ? 'Active' : 'Deactivated'}
                                                                </label>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="btn btn-sm btn-success me-2"
                                                                onClick={() => handleTemplateEdit(template)}
                                                                disabled={template.status !== "y"}
                                                            >
                                                                <i className="fa fa-pencil"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}

                                    {filteredTemplateData.length > 0 && (
                                        <nav className="d-flex justify-content-between align-items-center mt-3">
                                            <div>
                                                <span>
                                                    Page {currentPage} of {filteredTotalPages} | Total Records: {filteredTemplateData.length}
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
                                <form className="forms row" onSubmit={handleTemplateSave}>
                                    <div className="form-group col-md-4">
                                        <label>Template Code <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control  mt-1"
                                            id="templateCode"
                                            name="templateCode"
                                            placeholder="Template Code"
                                            value={formData.templateCode}
                                            onChange={handleInputChange}
                                            maxLength={TEMPLATE_CODE_MAX_LENGTH}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-4">
                                        <label>Template Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control  mt-1"
                                            id="templateName"
                                            name="templateName"
                                            placeholder="Template Name"
                                            value={formData.templateName}
                                            onChange={handleInputChange}
                                            maxLength={TEMPLATE_NAME_MAX_LENGTH}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                                        <button
                                            type="submit"
                                            className="btn btn-primary me-2"
                                            disabled={!isFormValid}
                                        >
                                            {editingTemplate ? 'Update' : 'Save'}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={() => {
                                                setShowForm(false);
                                                setEditingTemplate(null);
                                                setFormData({ templateCode: "", templateName: "" });
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
                                                    Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>
                                                        {templateData.find(template => template.id === confirmDialog.applicationId)?.templateName}
                                                    </strong>?
                                                </p>
                                            </div>
                                            <div className="modal-footer">
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary"
                                                   
                                                    onClick={() => handleConfirm(false)}
                                                >
                                                    No
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-primary"
                                                    onClick={() => handleConfirm(true)}
                                                >
                                                    Yes
                                                </button>
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

export default Templatemaster;