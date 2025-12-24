import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import { API_HOST, MAS_DEPARTMENT, MAS_DEPARTMENT_TYPE, MAS_WARD_CATEGORY, WARD_ID } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading";
import { postRequest, putRequest, getRequest } from "../../../service/apiService"
import { ADD_DEPARTMENT_SUCC_MSG, DUPLICATE_DEPARTMENT, FAIL_TO_SAVE_CHANGES, FAIL_TO_UPDATE_STS, FETCH_DEPARTMENT_ERR_MSG, FETCH_DEPARTMENT_TYPE_ERR_MSG, FETCH_WARD_CATEGORY_ERR_MSG, UPDATE_DEPARTMENT_SUCC_MSG } from "../../../config/constants";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const DepartmentMaster = () => {
    const [departments, setDepartments] = useState([]);
    const [departmentTypes, setDepartmentTypes] = useState([]);
    const [wardCategories, setWardCategories] = useState([]);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, categoryId: null, newStatus: false });
    const [formData, setFormData] = useState({
        departmentCode: "",
        departmentName: "",
        departmentType: "",
        departmentTypeId: "",
        departmentNo: "",
        wardCategoryId: ""
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchType, setSearchType] = useState("code");
    // FIXED: Removed unused pageInput state
    const [loading, setLoading] = useState(true);

    const DEPARTMENT_CODE_MAX_LENGTH = 8;
    const DEPARTMENT_NAME_MAX_LENGTH = 30;
    const DEPARTMENT_NUMBER_MAX_LENGTH = 8;

    useEffect(() => {
        fetchDepartments(0);
        fetchDepartmentTypes(1);
        fetchWardCategories(1);
    }, []);

    // FIXED: Added useEffect to reset page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, searchType]);

    const fetchDepartments = async (flag = 0) => {
        try {
            setLoading(true);
            const response = await getRequest(`${MAS_DEPARTMENT}/getAll/${flag}`);
            if (response && response.response) {
                setDepartments(response.response);
            }
        } catch (err) {
            console.error("Error fetching departments:", err);
            showPopup(FETCH_DEPARTMENT_ERR_MSG, "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartmentTypes = async (flag = 1) => {
        try {
            const response = await getRequest(`${MAS_DEPARTMENT_TYPE}/getAll/${flag}`);
            if (response && response.response) {
                setDepartmentTypes(response.response);
            }
        } catch (err) {
            console.error("Error fetching department types:", err);
            showPopup(FETCH_DEPARTMENT_TYPE_ERR_MSG, "error");
        }
    };

    const fetchWardCategories = async (flag = 1) => {
        try {
            const response = await getRequest(`${MAS_WARD_CATEGORY}/getAll/${flag}`);
            if (response && response.response) {
                setWardCategories(response.response);
            }
        } catch (err) {
            console.error("Error fetching ward categories:", err);
            showPopup(FETCH_WARD_CATEGORY_ERR_MSG, "error");
        }
    };

    const getFilteredDepartments = () => {
        if (!searchQuery.trim()) return departments;

        const query = searchQuery.toLowerCase().trim();
        return departments.filter((dept) => {
            if (searchType === "code") {
                return dept.departmentCode?.toLowerCase().includes(query);
            } else if (searchType === "description") {
                return dept.departmentName?.toLowerCase().includes(query);
            } else if (searchType === "type") {
                return dept.departmentTypeName?.toLowerCase().includes(query);
            }
            return true;
        });
    };

    const filteredDepartments = getFilteredDepartments();

    // FIXED: Added check for empty filteredDepartments
    const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
    const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
    const currentItems = filteredDepartments.length > 0 ? 
        filteredDepartments.slice(indexOfFirst, indexOfLast) : [];

    const handleSearchChange = (value) => {
        setSearchQuery(value);
        // FIXED: Page reset is now handled by useEffect
    };

    const handleSearchTypeChange = (value) => {
        setSearchType(value);
        // FIXED: Page reset is now handled by useEffect
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [id]: value }));

        const updatedFormData = {
            ...formData,
            [id]: value,
        };

        const isValid =
            (updatedFormData.departmentCode || "").trim() !== "" &&
            (updatedFormData.departmentName || "").trim() !== "" &&
            (updatedFormData.departmentType || "").trim() !== "";

        setIsFormValid(isValid);
    };

    const handleEdit = (dept) => {
        setEditingDepartment(dept);
        setFormData({
            departmentCode: dept.departmentCode,
            departmentName: dept.departmentName,
            departmentType: dept.departmentTypeName,
            departmentTypeId: dept.departmentTypeId,
            departmentNo: dept.departmentNo || "",
            wardCategoryId: dept.wardCategoryId || ""
        });
        setIsFormValid(true);
        setShowForm(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        try {
            setLoading(true);

            const isDuplicate = departments.some(
                (dept) =>
                    dept.id !== (editingDepartment ? editingDepartment.id : null) &&
                    (dept.departmentCode === formData.departmentCode ||
                        dept.departmentName === formData.departmentName ||
                        (formData.departmentNo && dept.departmentNo === formData.departmentNo))
            );

            if (isDuplicate) {
                showPopup(DUPLICATE_DEPARTMENT, "error");
                setLoading(false);
                return;
            }

            // Prepare data to send
            const departmentData = {
                departmentCode: formData.departmentCode,
                departmentName: formData.departmentName,
                departmentTypeId: formData.departmentTypeId,
                departmentNo: formData.departmentNo || null,
                status: editingDepartment ? editingDepartment.status : "y",
            };

            // Add wardCategoryId only if department type ID is WARD_ID (10)
            if (parseInt(formData.departmentTypeId) === WARD_ID && formData.wardCategoryId) {
                departmentData.wardCategoryId = formData.wardCategoryId;
            } else {
                departmentData.wardCategoryId = null;
            }

            if (editingDepartment) {
                // Update existing department
                const response = await putRequest(`${MAS_DEPARTMENT}/updateById/${editingDepartment.id}`, departmentData);

                if (response && response.response) {
                    setDepartments((prevData) =>
                        prevData.map((dept) =>
                            dept.id === editingDepartment.id ? response.response : dept
                        )
                    );
                    showPopup(UPDATE_DEPARTMENT_SUCC_MSG, "success");
                }
            } else {
                // Add new department
                const response = await postRequest(`${MAS_DEPARTMENT}/create`, departmentData);

                if (response && response.response) {
                    setDepartments([...departments, response.response]);
                    showPopup(ADD_DEPARTMENT_SUCC_MSG, "success");
                }
            }

            setEditingDepartment(null);
            setFormData({ 
                departmentCode: "", 
                departmentName: "", 
                departmentType: "", 
                departmentTypeId: "",
                departmentNo: "",
                wardCategoryId: ""
            });
            setShowForm(false);
            fetchDepartments();
        } catch (err) {
            console.error("Error saving department:", err);
            showPopup(`${FAIL_TO_SAVE_CHANGES} ${err.response?.data?.message || err.message}`, "error");
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
                const response = await putRequest(
                    `${MAS_DEPARTMENT}/status/${confirmDialog.categoryId}?status=${status}`
                );

                if (response && response.status === 200) {
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
                showPopup(FAIL_TO_UPDATE_STS, "error");
            } finally {
                setLoading(false);
            }
        }
        setConfirmDialog({ isOpen: false, categoryId: null, newStatus: null });
    };

    // FIXED: Added refresh function like in RoomCategoryMaster
    const handleRefresh = () => {
        setSearchQuery("");
        setCurrentPage(1);
        fetchDepartments();
    };

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header">
                            <h4 className="card-title p-2">Department Master</h4>
                            <div className="d-flex justify-content-between align-items-spacearound mt-3">
                                {!showForm && (
                                    <div className="d-flex align-items-center flex-wrap">
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
                                        <div className="me-3">
                                            <label>
                                                <input
                                                    type="radio"
                                                    name="searchType"
                                                    value="type"
                                                    checked={searchType === "type"}
                                                    onChange={() => handleSearchTypeChange("type")}
                                                />
                                                <span style={{ marginLeft: "5px" }}>Department Type</span>
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
                                    <div className="d-flex flex-wrap align-items-center gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-success me-2"
                                            onClick={handleRefresh} // FIXED: Use handleRefresh function
                                        >
                                            <i className="mdi mdi-refresh"></i> Show All
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
                                                    departmentTypeId: "",
                                                    departmentNo: "",
                                                    wardCategoryId: ""
                                                });
                                                setIsFormValid(false);
                                            }}
                                        >
                                            <i className="mdi mdi-plus"></i> Add
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <LoadingScreen />
                            ) : !showForm ? (
                                <>
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
                                                            <td>{dept.departmentNo || "-"}</td>
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
                                    
                                    {/* FIXED: Only show pagination when there are filtered results */}
                                    {filteredDepartments.length > DEFAULT_ITEMS_PER_PAGE && (
                                        <Pagination
                                            totalItems={filteredDepartments.length}
                                            itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                            currentPage={currentPage}
                                            onPageChange={setCurrentPage}
                                        />
                                    )}
                                </>
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="d-flex justify-content-end mb-3">
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
                                                const typeId = parseInt(selectedOption.getAttribute('data-id'), 10);
                                                const typeName = e.target.value;

                                                setFormData((prev) => ({
                                                    ...prev,
                                                    departmentType: typeName,
                                                    departmentTypeId: isNaN(typeId) ? null : typeId,
                                                    wardCategoryId: typeId === WARD_ID ? prev.wardCategoryId : ""
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
                                    <div className="form-group col-md-4 mt-3">
                                        <label >
                                            Department Number
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
                                        />
                                    </div>

                                    {/* Ward Category Field - Only shown when department type ID is WARD_ID (10) */}
                                    {parseInt(formData.departmentTypeId) === WARD_ID && (
                                        <div className="form-group col-md-4 mt-3">
                                            <label >
                                                Ward Category <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className="form-control mt-1"
                                                id="wardCategoryId"
                                                name="wardCategoryId"
                                                value={formData.wardCategoryId}
                                                onChange={handleInputChange}
                                                required={parseInt(formData.departmentTypeId) === WARD_ID}
                                            >
                                                <option value="">Select Ward Category</option>
                                                {wardCategories.map((category) => (
                                                    <option key={category.categoryId} value={category.categoryId}>
                                                        {category.categoryName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="form-group col-md-12 d-flex justify-content-end mt-4">
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DepartmentMaster;