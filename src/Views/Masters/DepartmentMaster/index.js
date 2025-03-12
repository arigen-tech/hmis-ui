import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import axios from "axios";
import { API_HOST } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading";

const DepartmentMaster = () => {
    const [departments, setDepartments] = useState([]);
    const [departmentTypes, setDepartmentTypes] = useState([]);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, categoryId: null, newStatus: false });
    const [formData, setFormData] = useState({
        departmentCode: "",
        departmentName: "",
        departmentType: "", // Keep this for display purposes
        departmentTypeId: "", // Add this to store the ID
        departmentNo: "",
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchType, setSearchType] = useState("code");
    const [pageInput, setPageInput] = useState("");
    const [loading, setLoading] = useState(true);
    const itemsPerPage = 5;

    // Constants for max lengths
    const DEPARTMENT_CODE_MAX_LENGTH = 8;
    const DEPARTMENT_NAME_MAX_LENGTH = 30;
    const DEPARTMENT_NUMBER_MAX_LENGTH = 8;

    // Fetch departments from API
    useEffect(() => {
        fetchDepartments();
        fetchDepartmentTypes();
    }, []);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_HOST}/department/all`);
            if (response.data && response.data.response) {
                setDepartments(response.data.response);
            }
        } catch (err) {
            console.error("Error fetching departments:", err);
            showPopup("Failed to load departments", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartmentTypes = async () => {
        try {
            const response = await axios.get(`${API_HOST}/department-type/all`);
            if (response.data && response.data.response) {
                setDepartmentTypes(response.data.response);
            }
        } catch (err) {
            console.error("Error fetching department types:", err);
            showPopup("Failed to load department types", "error");
        }
    };

    const getFilteredDepartments = () => {
        if (!searchQuery) return departments;

        return departments.filter((dept) => {
            if (searchType === "code") {
                return dept.departmentCode.toLowerCase().includes(searchQuery.toLowerCase());
            } else if (searchType === "description") {
                return dept.departmentName.toLowerCase().includes(searchQuery.toLowerCase());
            }
            return true;
        });
    };



    const filteredDepartments = getFilteredDepartments();
    const filteredTotalPages = Math.ceil(filteredDepartments.length / itemsPerPage);
    const totalFilteredItems = filteredDepartments.length;

    const getCurrentItems = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredDepartments.slice(startIndex, endIndex);
    };

    const currentItems = getCurrentItems();

    useEffect(() => {
        if (currentPage > filteredTotalPages && filteredTotalPages > 0) {
            setCurrentPage(1);
        }
    }, [filteredDepartments, currentPage, filteredTotalPages]);

    const handleSearchChange = (value) => {
        setSearchQuery(value);
        setCurrentPage(1);
    };

    const handleSearchTypeChange = (value) => {
        setSearchType(value);
        setCurrentPage(1);
    };

    const handlePageNavigation = () => {
        const pageNumber = Number.parseInt(pageInput, 10);
        if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
            setCurrentPage(pageNumber);
        } else {
            alert("Please enter a valid page number.");
        }
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [id]: value }));
    
        // Ensure values are always strings before calling `.trim()`
        const updatedFormData = {
            ...formData,
            [id]: value,
        };
    
        const isValid =
            (updatedFormData.departmentCode || "").trim() !== "" &&
            (updatedFormData.departmentName || "").trim() !== "" &&
            (updatedFormData.departmentType || "").trim() !== "" &&
            (updatedFormData.departmentNo || "").trim() !== "";
    
        setIsFormValid(isValid);
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

    const handleEdit = (dept) => {
        setEditingDepartment(dept);
        setFormData({
            departmentCode: dept.departmentCode,
            departmentName: dept.departmentName,
            departmentType: dept.departmentTypeName,
            departmentTypeId: dept.departmentTypeId, // Store the ID
            departmentNo: dept.departmentNo,
        });
        console.log("dept.departmentTypeId", dept.departmentTypeId);
        setIsFormValid(true);
        setShowForm(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        try {
            setLoading(true);

            // Check for duplicate department before saving
            const isDuplicate = departments.some(
                (dept) =>
                    dept.id !== (editingDepartment ? editingDepartment.id : null) &&
                    (dept.departmentCode.toLowerCase() === formData.departmentCode.toLowerCase() ||
                        dept.departmentName.toLowerCase() === formData.departmentName.toLowerCase() ||
                        dept.departmentNo.toLowerCase() === formData.departmentNo.toLowerCase())
            );

            if (isDuplicate) {
                showPopup("Department with the same code, name, or number already exists!", "error");
                setLoading(false);
                return;
            }

            if (editingDepartment) {
                // Update existing department

                console.log("form formdata", formData.departmentTypeId);
                const response = await axios.put(`${API_HOST}/department/edit/${editingDepartment.id}`, {
                    departmentCode: formData.departmentCode,
                    departmentName: formData.departmentName,
                    departmentTypeId: formData.departmentTypeId,
                    departmentNo: formData.departmentNo,
                    status: editingDepartment.status,
                });

                if (response.data && response.data.response) {
                    setDepartments((prevData) =>
                        prevData.map((dept) =>
                            dept.id === editingDepartment.id ? response.data.response : dept
                        )
                    );
                    showPopup("Department updated successfully!", "success");
                }
            } else {
                // Add new department
                const response = await axios.post(`${API_HOST}/department/add`, {
                    departmentCode: formData.departmentCode,
                    departmentName: formData.departmentName,
                    departmentTypeId: formData.departmentTypeId,
                    departmentNo: formData.departmentNo,
                    status: "n",
                });

                if (response.data && response.data.response) {
                    setDepartments([...departments, response.data.response]);
                    showPopup("New department added successfully!", "success");
                }
            }

            // Reset form and refresh data
            setEditingDepartment(null);
            setFormData({ departmentCode: "", departmentName: "", departmentType: "", departmentNo: "" });
            setShowForm(false);
            fetchDepartments(); // Refresh data from backend
        } catch (err) {
            console.error("Error saving department:", err);
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
                const status = confirmDialog.newStatus;
                const response = await axios.put(
                    `${API_HOST}/department/status/${confirmDialog.categoryId}?status=${status}`
                );

                if (response.data && response.data.status === 200) {
                    setDepartments((prevData) =>
                        prevData.map((dept) =>
                            dept.id === confirmDialog.categoryId
                                ? { ...dept, status: confirmDialog.newStatus }
                                : dept
                        )
                    );
                    showPopup(
                        `Department ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
                        "success"
                    );
                }
            } catch (err) {
                console.error("Error updating department status:", err);
                showPopup(`Failed to update status: ${err.response?.data?.message || err.message}`, "error");
            } finally {
                setLoading(false);
            }
        }
        setConfirmDialog({ isOpen: false, categoryId: null, newStatus: null });
    };

    // console.log(formData);

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header">
                            <h4 className="card-title p-2">Department Master</h4>
                            <div className="d-flex justify-content-between align-items-spacearound mt-3">
                                {!showForm && (
                                    <div className="d-flex align-items-center">
                                        <div className="me-3">
                                            <label>
                                                <input
                                                    type="radio"
                                                    name="searchType"
                                                    value="code"
                                                    checked={searchType === "code"}
                                                    onChange={() => handleSearchTypeChange("code")}
                                                />
                                                <span style={{ marginLeft: "5px" }}>Department Code</span>
                                            </label>
                                        </div>
                                        <div className="me-3">
                                            <label>
                                                <input
                                                    type="radio"
                                                    name="searchType"
                                                    value="description"
                                                    checked={searchType === "description"}
                                                    onChange={() => handleSearchTypeChange("description")}
                                                />
                                                <span style={{ marginLeft: "5px" }}>Department Name</span>
                                            </label>
                                        </div>

                                        <div className="d-flex align-items-center me-3">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Search..."
                                                value={searchQuery}
                                                onChange={(e) => handleSearchChange(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                                {!showForm && (
                                    <div className="d-flex align-items-center">
                                        <button
                                            type="button"
                                            className="btn btn-success me-2"
                                            onClick={() => handleSearchChange(searchQuery)}
                                        >
                                            <i className="mdi mdi-magnify"></i> Search
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-success me-2"
                                            onClick={() => {
                                                setShowForm(true);
                                                setEditingDepartment(null);
                                                setFormData({
                                                    departmentCode: "",
                                                    departmentName: "",
                                                    departmentType: "",
                                                    departmentNo: "",
                                                });
                                                setIsFormValid(false);
                                            }}
                                        >
                                            <i className="mdi mdi-plus"></i> Add
                                        </button>
                                        <button type="button" className="btn btn-success">
                                            <i className="mdi mdi-file-export"></i> Generate Report
                                        </button>
                                    </div>
                                )}
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
                                                <th>Department Code</th>
                                                <th>Department</th>
                                                <th>Department Type</th>
                                                <th>Department Number</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.length > 0 ? (
                                                currentItems.map((dept) => (
                                                    <tr key={dept.id}>
                                                        <td>{dept.departmentCode}</td>
                                                        <td>{dept.departmentName}</td>
                                                        <td>{dept.departmentTypeName}</td>
                                                        <td>{dept.departmentNo}</td>
                                                        <td>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={dept.status === "y"}
                                                                    onChange={() => handleSwitchChange(dept.id, dept.status === "y" ? "n" : "y")}
                                                                    id={`switch-${dept.id}`}
                                                                />
                                                                <label className="form-check-label px-0" htmlFor={`switch-${dept.id}`}>
                                                                    {dept.status === "y" ? "Active" : "Deactivated"}
                                                                </label>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="btn btn-sm btn-success me-2"
                                                                onClick={() => handleEdit(dept)}
                                                                disabled={dept.status !== "y"}
                                                            >
                                                                <i className="fa fa-pencil"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="text-center">
                                                        No departments found
                                                    </td>
                                                </tr>
                                            )}
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
                                        <label >
                                            Department Code <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control  mt-1"
                                            id="departmentCode"
                                            name="departmentCode"
                                            placeholder="Department Code"
                                            value={formData.departmentCode}
                                            onChange={handleInputChange}
                                            maxLength={DEPARTMENT_CODE_MAX_LENGTH}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-4">
                                        <label >
                                            Department <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control  mt-1"
                                            id="departmentName"
                                            name="departmentName"
                                            placeholder="Department Name"
                                            value={formData.departmentName}
                                            onChange={handleInputChange}
                                            maxLength={DEPARTMENT_NAME_MAX_LENGTH}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-4">
                                        <label >
                                            Department Type <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className="form-control  mt-1"
                                            id="departmentType"
                                            name="departmentType"
                                            value={formData.departmentType}
                                            onChange={(e) => {
                                                const selectedIndex = e.target.selectedIndex;
                                                const selectedOption = e.target.options[selectedIndex];
                                                const typeId = parseInt(selectedOption.getAttribute('data-id'), 10); // Convert to number

                                                setFormData((prev) => ({
                                                    ...prev,
                                                    departmentType: e.target.value, // Store the selected type name
                                                    departmentTypeId: isNaN(typeId) ? null : typeId, // Ensure it's a valid number
                                                }));
                                            }}
                                            required
                                        >
                                            <option value="">Select Department Type</option>
                                            {departmentTypes.map((type) => (
                                                <option key={type.id} value={type.departmentTypeName} data-id={type.id}>
                                                    {type.departmentTypeName}
                                                </option>
                                            ))}
                                        </select>


                                    </div>
                                    <div className="form-group col-md-4 mt-2">
                                        <label >
                                            Department Number <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control mt-1"
                                            id="departmentNo"
                                            name="departmentNo"
                                            placeholder="Department Number"
                                            value={formData.departmentNo}
                                            onChange={handleInputChange}
                                            maxLength={DEPARTMENT_NUMBER_MAX_LENGTH}
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
                                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
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
                                                    <strong>
                                                        {departments.find((dept) => dept.id === confirmDialog.categoryId)?.departmentName}
                                                    </strong>
                                                    ?
                                                </p>
                                            </div>
                                            <div className="modal-footer">
                                                <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>
                                                    No
                                                </button>
                                                <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>
                                                    Yes
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!showForm && filteredDepartments.length > 0 && (
                                <nav className="d-flex justify-content-between align-items-center mt-3">
                                    <div>
                                        <span>
                                            Page {currentPage} of {filteredTotalPages} | Total Records: {totalFilteredItems}
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
                                        {renderPagination()}
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
                                        <button className="btn btn-primary" onClick={handlePageNavigation}>
                                            Go
                                        </button>
                                    </div>
                                </nav>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DepartmentMaster;