import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import axios from "axios";
import { API_HOST, MAS_ROOM_CATEGORY } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading"
import { postRequest, putRequest, getRequest } from "../../../service/apiService"
import { ADD_ROOM_CAT_SUCC_MSG, DUPLICATE_ROOM_CAT, FAIL_TO_SAVE_CHANGES, FAIL_TO_UPDATE_STS, FETCH_ROOM_CAT_ERR_MSG, INVALID_PAGE_NO_WARN_MSG, UPDATE_ROOM_CAT_SUCC_MSG } from "../../../config/constants";


const RoomCategoryMaster = () => {
    const [categoryData, setCategoryData] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageInput, setPageInput] = useState("1");
    const itemsPerPage = 5;
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, categoryId: null, newStatus: false });
    const [popupMessage, setPopupMessage] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [isFormValid, setIsFormValid] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        categoryName: "",
    });
    const [loading, setLoading] = useState(true);

    const CATEGORY_NAME_MAX_LENGTH = 50;

    
    useEffect(() => {
        fetchCategoryData(0);
    }, []);

    // Function to format date as dd-MM-YYYY
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        
        try {
            const date = new Date(dateString);
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return "N/A";
            }
            
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
            const year = date.getFullYear();
            
            return `${day}/${month}/${year}`;
        } catch (error) {
            console.error("Error formatting date:", error);
            return "N/A";
        }
    };
    const fetchCategoryData = async (flag = 0) => {
        try {
            setLoading(true);
            const response = await getRequest(`${MAS_ROOM_CATEGORY}/getAll/${flag}`);
            if (response && response.response) {
                
                const mappedData = response.response.map(item => ({
                    id: item.roomCategoryId,
                    categoryName: item.roomCategoryName,
                    status: item.status,
                    lastUpdated: formatDate(item.lastUpdatedDate)
                }));
                setCategoryData(mappedData);
            }
        } catch (err) {
            console.error("Error fetching category data:", err);
            showPopup(FETCH_ROOM_CAT_ERR_MSG, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const filteredCategories = (categoryData || []).filter(
        (category) =>
            category?.categoryName?.toLowerCase().includes(searchQuery?.toLowerCase() || "")
    );
    
    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
        setPageInput("1");
    }, [searchQuery]);

    // Update page input when current page changes
    useEffect(() => {
        setPageInput(currentPage.toString());
    }, [currentPage]);

    const currentItems = filteredCategories.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const filteredTotalPages = Math.ceil(filteredCategories.length / itemsPerPage);

    // Go to page functionality
    const handlePageNavigation = () => {
        const pageNumber = parseInt(pageInput);
        if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= filteredTotalPages) {
            setCurrentPage(pageNumber);
        } else {
            showPopup(INVALID_PAGE_NO_WARN_MSG, "error");
            setPageInput(currentPage.toString());
        }
    };

    const handlePageInputChange = (e) => {
        setPageInput(e.target.value);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handlePageNavigation();
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            categoryName: category.categoryName,
        });
        setIsFormValid(true);
        setShowForm(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;
    
        try {
            setLoading(true);
    
           
            const isDuplicate = categoryData.some(
                (category) =>
                    category.categoryName === formData.categoryName
            );
    
            if (isDuplicate && !editingCategory) {
                showPopup(DUPLICATE_ROOM_CAT, "error");
                setLoading(false);
                return;
            }
    
            if (editingCategory) {
                
                const response = await putRequest(`${MAS_ROOM_CATEGORY}/update/${editingCategory.id}`, {
                    roomCategoryName: formData.categoryName,
                });
    
                if (response && response.status === 200) {
                   
                    fetchCategoryData();
                    showPopup(UPDATE_ROOM_CAT_SUCC_MSG, "success");
                }
            } else {
                
                const response = await postRequest(`${MAS_ROOM_CATEGORY}/create`, {
                    roomCategoryName: formData.categoryName,
                });
    
                if (response && response.status === 200) {
                    
                    fetchCategoryData();
                    showPopup(ADD_ROOM_CAT_SUCC_MSG, "success");
                }
            }
    
           
            setEditingCategory(null);
            setFormData({ categoryName: "" });
            setShowForm(false);
        } catch (err) {
            console.error("Error saving room category:", err);
            showPopup(FAIL_TO_SAVE_CHANGES, "error");
        } finally {
            setLoading(false);
        }
    };

    const showPopup = (message, type = "info") => {
        setPopupMessage({
            message,
            type,
            onClose: () => {
                setPopupMessage(null);
            },
        });
    };

    const handleSwitchChange = (id, newStatus) => {
        setConfirmDialog({ isOpen: true, categoryId: id, newStatus });
    };

    const handleConfirm = async (confirmed) => {
        if (confirmed && confirmDialog.categoryId !== null) {
            try {
                setLoading(true);
                const response = await putRequest(
                    `${MAS_ROOM_CATEGORY}/status/${confirmDialog.categoryId}?status=${confirmDialog.newStatus}`
                );
                if (response && response.response) {
                    setCategoryData((prevData) =>
                        prevData.map((category) =>
                            category.id === confirmDialog.categoryId
                                ? { ...category, status: confirmDialog.newStatus }
                                : category
                        )
                    );
                    showPopup(
                        `Room Category ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
                        "success"
                    );
                }
            } catch (err) {
                console.error("Error updating room category status:", err);
                showPopup(FAIL_TO_UPDATE_STS, "error");
            } finally {
                setLoading(false);
            }
        }
        setConfirmDialog({ isOpen: false, categoryId: null, newStatus: null });
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [id]: value }));
        setIsFormValid(formData.categoryName.trim() !== "");
    };

    const handleRefresh = () => {
        setSearchQuery("");
        setCurrentPage(1);
        setPageInput("1");
        fetchCategoryData();
    };

    // Render page numbers with ellipsis
    const renderPageNumbers = () => {
        const pageNumbers = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(filteredTotalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // First page and ellipsis
        if (startPage > 1) {
            pageNumbers.push(1);
            if (startPage > 2) {
                pageNumbers.push("ellipsis-left");
            }
        }

        // Visible pages
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        // Last page and ellipsis
        if (endPage < filteredTotalPages) {
            if (endPage < filteredTotalPages - 1) {
                pageNumbers.push("ellipsis-right");
            }
            pageNumbers.push(filteredTotalPages);
        }

        return pageNumbers.map((number, index) => {
            if (number === "ellipsis-left" || number === "ellipsis-right") {
                return (
                    <li key={index} className="page-item disabled">
                        <span className="page-link">...</span>
                    </li>
                );
            }

            return (
                <li key={index} className={`page-item ${number === currentPage ? "active" : ""}`}>
                    <button
                        className="page-link"
                        onClick={() => {
                            setCurrentPage(number);
                            setPageInput(number.toString());
                        }}
                    >
                        {number}
                    </button>
                </li>
            );
        });
    };

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title">Room Category Master</h4>
                            <div className="d-flex justify-content-between align-items-center">
                                {!showForm ? (
                                    <form className="d-inline-block searchform me-4" role="search">
                                        <div className="input-group searchinput">
                                            <input
                                                type="search"
                                                className="form-control"
                                                placeholder="Search Room Category"
                                                aria-label="Search"
                                                value={searchQuery}
                                                onChange={handleSearchChange}
                                            />
                                            <span className="input-group-text" id="search-icon">
                                                <i className="fa fa-search"></i>
                                            </span>
                                        </div>
                                    </form>
                                ) : (
                                    <></>
                                )}

                                <div className="d-flex align-items-center">
                                    {!showForm ? (
                                        <>
                                            <button type="button" className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                                                <i className="mdi mdi-plus"></i> Add
                                            </button>
                                            <button type="button" className="btn btn-success me-2 flex-shrink-0" onClick={handleRefresh}>
                                                <i className="mdi mdi-refresh"></i> Show All
                                            </button>
                                            <button type="button" className="btn btn-success me-2" onClick={() => setShowModal(true)}>
                                                <i className="mdi mdi-plus"></i> Reports
                                            </button>
                                        </>
                                    ) : (
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
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
                                    <table className="table table-bordered table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Room Category Name</th>
                                                <th>Status</th>
                                                <th>Last Updated</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((category) => (
                                                <tr key={category.id}>
                                                    <td>{category.categoryName}</td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={category.status === "y"}
                                                                onChange={() => handleSwitchChange(category.id, category.status === "y" ? "n" : "y")}
                                                                id={`switch-${category.id}`}
                                                            />
                                                            <label
                                                                className="form-check-label px-0"
                                                                htmlFor={`switch-${category.id}`}
                                                            >
                                                                {category.status === "y" ? "Active" : "Deactivated"}
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td>{category.lastUpdated || "N/A"}</td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-success me-2"
                                                            onClick={() => handleEdit(category)}
                                                            disabled={category.status !== "y"}
                                                        >
                                                            <i className="fa fa-pencil"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <nav className="d-flex justify-content-between align-items-center mt-3">
                                        <div>
                                            <span className="text-muted">
                                                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredCategories.length)} of {filteredCategories.length} entries
                                            </span>
                                        </div>
                                        <ul className="pagination mb-0">
                                            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => setCurrentPage(currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                >
                                                    &laquo; Previous
                                                </button>
                                            </li>
                                            
                                            {renderPageNumbers()}
                                            
                                            <li className={`page-item ${currentPage === filteredTotalPages ? "disabled" : ""}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => setCurrentPage(currentPage + 1)}
                                                    disabled={currentPage === filteredTotalPages}
                                                >
                                                    Next &raquo;
                                                </button>
                                            </li>
                                        </ul>
                                        <div className="d-flex align-items-center">
                                            <span className="me-2">Go to:</span>
                                            <input
                                                type="number"
                                                min="1"
                                                max={filteredTotalPages}
                                                value={pageInput}
                                                onChange={handlePageInputChange}
                                                onKeyPress={handleKeyPress}
                                                className="form-control me-2"
                                                style={{ width: "80px" }}
                                            />
                                            <button
                                                className="btn btn-primary"
                                                onClick={handlePageNavigation}
                                            >
                                                Go
                                            </button>
                                        </div>
                                    </nav>
                                </div>
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="form-group col-md-4">
                                        <label>Room Category Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control  mt-1"
                                            id="categoryName"
                                            placeholder="Enter Room Category Name"
                                            value={formData.categoryName}
                                            onChange={handleInputChange}
                                            maxLength={CATEGORY_NAME_MAX_LENGTH}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                                        <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                                            Save
                                        </button>
                                        <button type="button" className="btn btn-danger" onClick={() => setShowForm(false)}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                            {showModal && (
                                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                                    <div className="modal-dialog">
                                        <div className="modal-content">
                                            <div className="modal-header">
                                                <h1 className="modal-title fs-5" id="staticBackdropLabel">Reports</h1>
                                                <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                                            </div>
                                            <div className="modal-body">
                                                {/* Your modal content goes here */}
                                                ...
                                            </div>
                                            <div className="modal-footer">
                                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                                                <button type="button" className="btn btn-primary">Understood</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {popupMessage && (
                                <Popup
                                    message={popupMessage.message}
                                    type={popupMessage.type}
                                    onClose={popupMessage.onClose}
                                />
                            )}
                            {confirmDialog.isOpen && (
                                <div className="modal d-block" tabIndex="-1" role="dialog">
                                    <div className="modal-dialog" role="document">
                                        <div className="modal-content">
                                            <div className="modal-header">
                                                <h5 className="modal-title">Confirm Status Change</h5>
                                                <button type="button" className="close" onClick={() => handleConfirm(false)}>
                                                    <span>&times;</span>
                                                </button>
                                            </div>
                                            <div className="modal-body">
                                                <p>
                                                    Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                                                    <strong>{categoryData.find((category) => category.id === confirmDialog.categoryId)?.categoryName}</strong>?
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
    );
};

export default RoomCategoryMaster;