import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import axios from "axios";
import { API_HOST,MAS_DEPARTMENT_TYPE } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading";
import { postRequest, putRequest, getRequest } from "../../../service/apiService"

const Departmenttype = () => {
    const [departmentTypes, setDepartmentTypes] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageInput, setPageInput] = useState("");
    const itemsPerPage = 5;
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, categoryId: null, newStatus: false });
    const [popupMessage, setPopupMessage] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [isFormValid, setIsFormValid] = useState(false);
    const [formData, setFormData] = useState({
        departmentTypeCode: "",
        departmentTypeName: "",
    });
    const [loading, setLoading] = useState(true);
    const [searchType, setSearchType] = useState("code");

    const DepartmentType__NAME_MAX_LENGTH = 30;
    const DepartmentType_CODE_MAX_LENGTH = 8;

    useEffect(() => {
        fetchDepartmentTypes(0);
    }, []);

    const fetchDepartmentTypes = async (flag = 0) => {
        try {
            setLoading(true);
            const response = await getRequest (`${MAS_DEPARTMENT_TYPE}/getAll/${flag}`);
            if (response && response.response) {
                setDepartmentTypes(response.response);
            }
        } catch (err) {
            console.error("Error fetching department types:", err);
            showPopup("Failed to load department types", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    
    const handleSearchTypeChange = (e) => {
        setSearchType(e.target.value);
        setCurrentPage(1);
    };

    const filteredDepartmentTypes = departmentTypes.filter((type) => {
        if (searchType === "code") {
            return type.departmentTypeCode.toLowerCase().includes(searchQuery.toLowerCase());
        } else {
            return type.departmentTypeName.toLowerCase().includes(searchQuery.toLowerCase());
        }
    });

    const currentItems = filteredDepartmentTypes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const filteredTotalPages = Math.ceil(filteredDepartmentTypes.length / itemsPerPage);

    const handlePageNavigation = () => {
        const pageNumber = parseInt(pageInput, 10);
        if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
            setCurrentPage(pageNumber);
        } else {
            alert("Please enter a valid page number.");
        }
    };

    const handleEdit = (type) => {
        setEditingType(type);
        setFormData({
            departmentTypeCode: type.departmentTypeCode,
            departmentTypeName: type.departmentTypeName,
        });
        setIsFormValid(true);
        setShowForm(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        try {
            setLoading(true);

            
            const isDuplicate = departmentTypes.some(
                (type) =>
                    type.departmentTypeCode === formData.departmentTypeCode ||
                    type.departmentTypeName === formData.departmentTypeName
            );

            
            if (editingType) {
                
                const response = await putRequest(`${MAS_DEPARTMENT_TYPE}/updateById/${editingType.id}`, {
                    departmentTypeCode: formData.departmentTypeCode,
                    departmentTypeName: formData.departmentTypeName,
                    status: editingType.status,
                });

                if (response && response.response) {
                    setDepartmentTypes((prevData) =>
                        prevData.map((type) =>
                            type.id === editingType.id ? response.response : type
                        )
                    );
                    showPopup("Department type updated successfully!", "success");
                }
            } else {
                if (isDuplicate) {
                showPopup("Department type with the same code or name already exists!", "error");
                setLoading(false);
                return;
            }

                
                const response = await postRequest(`${MAS_DEPARTMENT_TYPE}/create`, {
                    departmentTypeCode: formData.departmentTypeCode,
                    departmentTypeName: formData.departmentTypeName,
                    status: "y",
                });

                if (response && response.response) {
                    setDepartmentTypes([...departmentTypes, response.response]);
                    showPopup("New department type added successfully!", "success");
                }
            }

            
            setEditingType(null);
            setFormData({ departmentTypeCode: "", departmentTypeName: "" });
            setShowForm(false);
            fetchDepartmentTypes(); 
        } catch (err) {
            console.error("Error saving department type:", err);
            showPopup(`Failed to save changes: ${err.response?.data?.message || err.message}`, "error");
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
                    `${MAS_DEPARTMENT_TYPE}/status/${confirmDialog.categoryId}?status=${confirmDialog.newStatus}`
                );
                if (response && response.response) {
                    setDepartmentTypes((prevData) =>
                        prevData.map((type) =>
                            type.id === confirmDialog.categoryId
                                ? { ...type, status: confirmDialog.newStatus }
                                : type
                        )
                    );
                    showPopup(
                        `Department type ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
                        "success"
                    );
                }
            } catch (err) {
                console.error("Error updating department type status:", err);
                showPopup(`Failed to update status: ${err.response?.data?.message || err.message}`, "error");
            } finally {
                setLoading(false);
            }
        }
        setConfirmDialog({ isOpen: false, categoryId: null, newStatus: null });
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [id]: value }));
        setIsFormValid(formData.departmentTypeCode.trim() !== "" && formData.departmentTypeName.trim() !== "");
    };

    const handleRefresh = () => {
        setSearchQuery("");
        setCurrentPage(1);
        fetchDepartmentTypes();
    };

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header">
                            <h4 className="card-title p-2">Department Type</h4>
                            {!showForm && (
                                <div className="d-flex justify-content-between align-items-spacearound mt-3">
                                    <div className="d-flex align-items-center">
                                        <div className="me-3">
                                            <label>
                                                <input
                                                    type="radio"
                                                    name="searchType"
                                                    value="code"
                                                    checked={searchType === "code"}
                                                    onChange={handleSearchTypeChange}
                                                />
                                                <span style={{ marginLeft: '5px' }}>Department Type Code</span>
                                            </label>
                                        </div>
                                        <div className="me-3">
                                            <label>
                                                <input
                                                    type="radio"
                                                    name="searchType"
                                                    value="description"
                                                    checked={searchType === "description"}
                                                    onChange={handleSearchTypeChange}
                                                />
                                                <span style={{ marginLeft: '5px' }}>Department Type Name</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="d-flex flex-wrap align-items-center gap-2">
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
                                        <button type="button" className="btn btn-success me-1" onClick={() => setShowForm(true)}>
                                            <i className="mdi mdi-plus"></i> ADD
                                        </button>
                                        <button type="button" className="btn btn-success me-2 d-flex align-items-center">
                                            <i className="mdi mdi-plus d-sm-inlined-sm-inline ms-1"></i> Generate Report
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <LoadingScreen />
                            ) : !showForm ? (
                                <div className="table-responsive packagelist">
                                    <table className="table table-bordered table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Department Type Name</th>
                                                <th>Department Type Code</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((type) => (
                                                <tr key={type.id}>
                                                    <td>{type.departmentTypeName}</td>
                                                    <td>{type.departmentTypeCode}</td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={type.status === "y"}
                                                                onChange={() => handleSwitchChange(type.id, type.status === "y" ? "n" : "y")}
                                                                id={`switch-${type.id}`}
                                                            />
                                                            <label
                                                                className="form-check-label px-0"
                                                                htmlFor={`switch-${type.id}`}
                                                            >
                                                                {type.status === "y" ? "Active" : "Deactivated"}
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-success me-2"
                                                            onClick={() => handleEdit(type)}
                                                            disabled={type.status !== "y"}
                                                        >
                                                            <i className="fa fa-pencil"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="d-flex justify-content-end">
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => setShowForm(false)}
                                        >
                                            <i className="mdi mdi-arrow-left"></i> Back
                                        </button>
                                    </div>
                                    <div className="form-group col-md-4">
                                        <label>Department Type Code <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control  mt-1"
                                            id="departmentTypeCode"
                                            name="departmentTypeCode"
                                            placeholder="Code"
                                            value={formData.departmentTypeCode}
                                             maxLength = {DepartmentType_CODE_MAX_LENGTH}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-4">
                                        <label>Department Type Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control  mt-1"
                                            id="departmentTypeName"
                                            name="departmentTypeName"
                                            placeholder="Name"
                                            value={formData.departmentTypeName}
                                            onChange={handleInputChange}
                                            maxLength = {DepartmentType__NAME_MAX_LENGTH}
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
                                                    <strong>{departmentTypes.find((type) => type.id === confirmDialog.categoryId)?.departmentTypeName}</strong>?
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
                            <nav className="d-flex justify-content-between align-items-center mt-3">
                                <div>
                                    <span>
                                        Page {currentPage} of {filteredTotalPages} | Total Records: {filteredDepartmentTypes.length}
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
                                    {[...Array(filteredTotalPages)].map((_, index) => (
                                        <li
                                            className={`page-item ${currentPage === index + 1 ? "active" : ""}`}
                                            key={index}
                                        >
                                            <button className="page-link" onClick={() => setCurrentPage(index + 1)}>
                                                {index + 1}
                                            </button>
                                        </li>
                                    ))}
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
                                    <input
                                        type="number"
                                        min="1"
                                        max={filteredTotalPages}
                                        value={pageInput}
                                        onChange={(e) => setPageInput(e.target.value)}
                                        placeholder="Go to page"
                                        className="form-control me-2"
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Departmenttype;