import { useState, useEffect } from "react"
import Popup from "../../../Components/popup";
import axios from "axios";
import { API_HOST } from "../../../config/apiConfig";

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

    // Fetch all applications
    const fetchApplications = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_HOST}/applications/all`);
            console.log("API Response:", response.data); // Log the full response
    
            const applicationList = response.data.response || [];
            const mappedApplications = applicationList.map(app => ({
                id: app.id,
                menuName: app.userAppName || "No Name", // Use userAppName instead of menuName
                url: app.url || "No URL",
                status: app.status || "n"
            }));
    
            setUserApplicationData(mappedApplications);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching applications:", err);
            setError("Failed to fetch applications. Please try again later.");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
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

    const filteredUserApplicationData = userApplicationData.filter(application =>
        application.menuName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        application.url.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prevData => ({ ...prevData, [id]: value }));

        // Form validation
        setIsFormValid(
            formData.menuName.trim() !== "" &&
            formData.url.trim() !== ""
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
    
            // Check for duplicate application
            const isDuplicate = userApplicationData.some(
                (app) =>
                    app.menuName.toLowerCase() === formData.menuName.toLowerCase() ||
                    app.url.toLowerCase() === formData.url.toLowerCase()
            );
    
            if (isDuplicate) {
                showPopup("Application already exists!", "error");
                setLoading(false);
                return;
            }
    
            if (editingApplication) {
                // Update existing application
                const response = await axios.put(`${API_HOST}/applications/edit/${editingApplication.id}`, {
                    userAppName: formData.menuName,
                    url: formData.url
                });
    
                console.log("Update Response:", response.data);
    
                // Update local state using the response from backend
                const updatedApplication = response.data.data || {};
                setUserApplicationData(prevData =>
                    prevData.map(application =>
                        application.id === editingApplication.id
                            ? {
                                id: updatedApplication.id || editingApplication.id,
                                menuName: updatedApplication.userAppName || formData.menuName,
                                url: updatedApplication.url || formData.url,
                                status: updatedApplication.status || editingApplication.status
                            }
                            : application
                    )
                );
    
                showPopup("Application updated successfully!", "success");
            } else {
                // Create new application
                const response = await axios.post(`${API_HOST}/applications/create`, {
                    userAppName: formData.menuName,
                    url: formData.url,
                    status: "y"
                });
    
                console.log("Create Response:", response.data);
    
                // Add new entry to local state using the response from backend
                const newApplication = response.data.data || {};
                setUserApplicationData(prevData => [
                    ...prevData,
                    {
                        id: newApplication.id || Date.now(),
                        menuName: newApplication.userAppName || formData.menuName,
                        url: newApplication.url || formData.url,
                        status: newApplication.status || "y"
                    }
                ]);
    
                showPopup("New application added successfully!", "success");
            }
    
            // Reset form
            setFormData({ menuName: "", url: "" });
            setShowForm(false);
            setEditingApplication(null);
            setIsFormValid(false);
        } catch (err) {
            console.error("Error saving application:", err);
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
                const response = await axios.put(
                    `${API_HOST}/applications/status/${confirmDialog.applicationId}`,
                    null,
                    {
                        params: { status: confirmDialog.newStatus }
                    }
                );
    
                console.log("API Response:", response.data); // Log the full response
                console.log("Updated Application:", response.data.data); // Log the updated application
    
                // Update local state using the response from backend
                const updatedApplication = response.data.data || { status: confirmDialog.newStatus };
                if (!updatedApplication.status) {
                    throw new Error("Invalid response from server");
                }
    
                setUserApplicationData(prevData => {
                    console.log("Previous Data:", prevData); // Log the previous state
                    return prevData.map(application => {
                        if (application.id === confirmDialog.applicationId) {
                            console.log("Matched Application:", application); // Log the matched application
                            return {
                                ...application,
                                status: updatedApplication.status
                            };
                        }
                        return application;
                    });
                });
    
                showPopup(
                    `Application ${confirmDialog.newStatus === 'y' ? 'activated' : 'deactivated'} successfully!`,
                    "success"
                );
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
                                                onClick={fetchApplications}
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
                                <div className="text-center">
                                    <div className="spinner-border" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
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
                                                                    checked={application.status === "y"}
                                                                    onChange={() => handleSwitchChange(application.id, application.status)}
                                                                    id={`switch-${application.id}`}
                                                                />
                                                                <label
                                                                    className="form-check-label px-0"
                                                                    htmlFor={`switch-${application.id}`}
                                                                >
                                                                    {application.status === "y" ? 'Active' : 'Deactivated'}
                                                                </label>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="btn btn-sm btn-success me-2"
                                                                onClick={() => handleEdit(application)}
                                                                disabled={application.status !== "y"}
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
                                        <label>Menu Name<span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control mt-1"
                                            id="menuName"
                                            name="menuName"
                                            placeholder="Menu Name"
                                            value={formData.menuName}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div><div className="form-group col-md-4">
                                        <label>URL<span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control  mt-1"
                                            id="url"
                                            name="url"
                                            placeholder="URL"
                                            value={formData.url}
                                            onChange={handleInputChange}
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
                                                    Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>
                                                        {userApplicationData.find(app => app.id === confirmDialog.applicationId)?.menuName}
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

export default Manageuserapplication;