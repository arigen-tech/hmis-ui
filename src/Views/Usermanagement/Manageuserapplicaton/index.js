import { useState, useEffect } from "react"
import Popup from "../../../Components/popup";
import { API_HOST,ALL_USER_APPLICATION,USER_APPLICATION } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading"
import { postRequest, putRequest, getRequest } from "../../../service/apiService";

const Manageuserapplication = () => {
    const [userApplicationData, setUserApplicationData] = useState([]);
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        applicationId: null,
        newStatus: false
    });
    const [formData, setFormData] = useState({
        menuName: "",
        url: "",
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [editingApplication, setEditingApplication] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageInput, setPageInput] = useState("");
    const itemsPerPage = 5;

    const MENU_NAME_MAX_LENGTH = 250;
    const URL_MAX_LENGTH = 250;

    useEffect(() => {
        fetchApplications(0);
    }, []);

    const fetchApplications = async (flag = 0) => {
        setLoading(true);
        setError(null);
        try {
            const response = await getRequest(`${ALL_USER_APPLICATION}/${flag}`);
            console.log("API Response:", response);

            if (response && response.response) {
                const mappedApplications = response.response.map(app => ({
                    id: app.id,
                    menuName: app.userAppName || "No Name",
                    url: app.url || "No URL",
                    status: app.status || "n"
                }));
                setUserApplicationData(mappedApplications);
            } else {
                throw new Error("Invalid response structure");
            }
        } catch (err) {
            console.error("Error fetching applications:", err);
            setError("Failed to fetch applications. Please try again later.");
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

    const filteredUserApplicationData = userApplicationData.filter(application =>
        application.menuName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        application.url.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prevData => ({ ...prevData, [id]: value }));

        // Form validation after state update
        const updatedFormData = { ...formData, [id]: value };
        setIsFormValid(
            updatedFormData.menuName.trim() !== "" &&
            updatedFormData.url.trim() !== ""
        );
    };

    const handleEdit = (application) => {
        setEditingApplication(application);
        setFormData({
            menuName: application.menuName,
            url: application.url
        });
        setShowForm(true);
        setIsFormValid(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;
    
        try {
            setLoading(true);
    
            // Check for duplicates excluding the current editing application
            const isDuplicate = userApplicationData.some(
                (app) =>
                    (editingApplication ? app.id !== editingApplication.id : true) &&
                    (app.menuName === formData.menuName)
            );
    
            if (isDuplicate) {
                showPopup("Application with the same name already exists!", "error");
                setLoading(false);
                return;
            }
    
            if (editingApplication) {
                // Update existing application
                const response = await putRequest(`${USER_APPLICATION}/edit/${editingApplication.id}`, {
                    userAppName: formData.menuName,
                    url: formData.url
                });
    
                console.log("Update Response:", response);
    
                if (response && response.response) {
                    const updatedApplication = response.response;
    
                    setUserApplicationData(prevData =>
                        prevData.map(app =>
                            app.id === editingApplication.id
                                ? {
                                    ...app,
                                    menuName: updatedApplication.userAppName || formData.menuName,
                                    url: updatedApplication.url || formData.url,
                                    status: (updatedApplication.status || app.status)
                                }
                                : app
                        )
                    );
    
                    showPopup("Application updated successfully!", "success");
                } else {
                    throw new Error("Invalid response from server");
                }
            } else {
                // Create a new application
                const response = await postRequest(`${USER_APPLICATION}/create`, {
                    userAppName: formData.menuName,
                    url: formData.url,
                    status: "y"
                });
    
                console.log("Create Response:", response);
    
                if (response && response.response) {
                    const newApplication = response.response;
    
                    setUserApplicationData(prevData => [
                        ...prevData,
                        {
                            id: newApplication.id || Date.now(),
                            menuName: newApplication.userAppName || formData.menuName,
                            url: newApplication.url || formData.url,
                            status: "y"
                        }
                    ]);
    
                    showPopup("Application added successfully!", "success");
                } else {
                    throw new Error("Invalid response from server");
                }
            }
    
            setFormData({ menuName: "", url: "" });
            setEditingApplication(null);
            setShowForm(false);
        } catch (error) {
            console.error("Error saving application:", error);
            showPopup("An error occurred while saving the application!", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSwitchChange = (id, currentStatus) => {
        const newStatus = (currentStatus?.toLowerCase() === "y") ? "n" : "y";
        
        setConfirmDialog({
            isOpen: true,
            applicationId: id,
            newStatus: newStatus
        });
    };

    const handleConfirm = async (confirmed) => {
        if (confirmed && confirmDialog.applicationId !== null) {
            try {
                setLoading(true);
                
                const response = await putRequest(
                    `${USER_APPLICATION}/status/${confirmDialog.applicationId}?status=${confirmDialog.newStatus}`
                );
                
                if (response && response.status === 200) {
                    
                    setUserApplicationData(prevData =>
                        prevData.map(app =>
                            app.id === confirmDialog.applicationId
                                ? { ...app, status: confirmDialog.newStatus }
                                : app
                        )
                    );
                    
                    showPopup(
                        `Application ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
                        "success"
                    );
                }
            } catch (err) {
                console.error("Error updating application status:", err);
                showPopup(`Failed to update status: ${err.response?.data?.message || err.message}`, "error");
            } finally {
                setLoading(false);
            }
        }
        setConfirmDialog({ isOpen: false, applicationId: null, newStatus: null });
    };

    const filteredTotalPages = Math.ceil(filteredUserApplicationData.length / itemsPerPage);
    const currentItems = filteredUserApplicationData.slice(
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
                            <h4 className="card-title p-2">Manage Menu</h4>
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
                                                    setFormData({ menuName: "", url: "" });
                                                    setEditingApplication(null);
                                                    setIsFormValid(false);
                                                }}
                                            >
                                                <i className="mdi mdi-plus"></i> Add
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-success me-2"
                                                onClick={() => fetchApplications(0)}
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
                                                setEditingApplication(null);
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
                                    {userApplicationData.length === 0 ? (
                                        <div className="alert alert-info text-center">
                                            No applications found.
                                        </div>
                                    ) : (
                                        <table className="table table-bordered table-hover align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Menu Name</th>
                                                    <th>URL</th>
                                                    <th>Status</th>
                                                    <th>Edit</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentItems.map((application) => (
                                                    <tr key={application.id}>
                                                        <td>{application.menuName || "No Name"}</td>
                                                        <td>{application.url || "No URL"}</td>
                                                        <td>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={application.status?.toLowerCase() === "y"}
                                                                    onChange={() => handleSwitchChange(application.id, application.status)}
                                                                    id={`switch-${application.id}`}
                                                                />
                                                                <label
                                                                    className="form-check-label px-0"
                                                                    htmlFor={`switch-${application.id}`}
                                                                >
                                                                    {application.status?.toLowerCase() === "y" ? 'Active' : 'Deactivated'}
                                                                </label>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="btn btn-sm btn-success me-2"
                                                                onClick={() => handleEdit(application)}
                                                                disabled={application.status?.toLowerCase() !== "y"}
                                                            >
                                                                <i className="fa fa-pencil"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}

                                    {filteredUserApplicationData.length > 0 && (
                                        <nav className="d-flex justify-content-between align-items-center mt-3">
                                            <div>
                                                <span>
                                                    Page {currentPage} of {filteredTotalPages} | Total Records: {filteredUserApplicationData.length}
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
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="form-group col-md-4">
                                        <label>Menu Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control mt-1"
                                            id="menuName"
                                            name="menuName"
                                            placeholder="Menu Name"
                                            value={formData.menuName}
                                            onChange={handleInputChange}
                                            maxLength={MENU_NAME_MAX_LENGTH}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-4">
                                        <label>URL <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control mt-1"
                                            id="url"
                                            name="url"
                                            placeholder="URL"
                                            value={formData.url}
                                            onChange={handleInputChange}
                                            maxLength={URL_MAX_LENGTH}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                                        <button
                                            type="submit"
                                            className="btn btn-primary me-2"
                                            disabled={!isFormValid}
                                        >
                                            {editingApplication ? 'Update' : 'Save'}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={() => {
                                                setShowForm(false);
                                                setEditingApplication(null);
                                                setFormData({ menuName: "", url: "" });
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
                                                    Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{userApplicationData.find(app => app.id === confirmDialog.applicationId)?.menuName}</strong>?
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

export default Manageuserapplication;