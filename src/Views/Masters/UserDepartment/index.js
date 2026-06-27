import { useState, useEffect } from "react"
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import axios from "axios";
import { API_HOST,MAS_DEPARTMENT,MAS_USER_DEPARTMENT } from "../../../config/apiConfig";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import {
    FETCH_USER_DEPARTMENT_ERR_MSG,
    DUPLICATE_USER_DEPARTMENT,
    UPDATE_USER_DEPARTMENT_SUCC_MSG,
    ADD_USER_DEPARTMENT_SUCC_MSG,
    FAIL_TO_SAVE_CHANGES,
    INVALID_PAGE_NO_WARN_MSG,
    FAIL_TO_LOAD_USERS,
    FAIL_TO_LOAD_DEPARTMENTS
} from "../../../config/constants";


const Userdepartment = () => {
    const [formData, setFormData] = useState({
        userId: "",
        userName: "",
        departmentId: "",
        departmentName: ""
    });
    const [showForm, setShowForm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [filteredTotalPages, setFilteredTotalPages] = useState(1);
    const [totalFilteredProducts, setTotalFilteredProducts] = useState(0);
    const [itemsPerPage] = useState(5);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [pageInput, setPageInput] = useState("");

    
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [userDepartmentData, setUserDepartmentData] = useState([]);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, departmentId: null, newStatus: false });


    useEffect(() => {
        fetchUserDepartmentData();
        fetchUsers(1);
        fetchDepartments(1);
        console.log("Departments:", departments);
    }, []);

    useEffect(() => {
    const filtered = userDepartmentData.filter(userDept =>
        (userDept.userName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (userDept.departmentName?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );
    setTotalFilteredProducts(filtered.length);
    setFilteredTotalPages(Math.ceil(filtered.length / itemsPerPage));
}, [userDepartmentData, searchQuery]);


    const fetchUserDepartmentData = async () => {
        try {
            setLoading(true);
            const response = await getRequest(`${MAS_USER_DEPARTMENT}/getAll`);

            if (response && response.response) {
                const transformedData = response.response.map(userDept => ({
                    id: userDept.id,
                    userId: userDept.userId,
                    userName: userDept.username,
                    departmentId: userDept.departmentId,
                    departmentName: userDept.departmentName,

                }));
setUserDepartmentData([...transformedData].reverse());
                // setTotalFilteredProducts(transformedData.length);
                // setFilteredTotalPages(Math.ceil(transformedData.length / itemsPerPage));
            }
        } catch (err) {
            console.error("Error fetching user department data:", err);
            showPopup(FETCH_USER_DEPARTMENT_ERR_MSG, "error");
        } finally {
            setLoading(false);
        }
    };


    const fetchUsers = async (flag = 1) => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_HOST}/users/getAll/${flag}`);

            if (response.data && response.data.response) {

                const mappedUsers = response.data.response.map(user => ({
                    userId: user.userId,
                    userName: user.userName,
                    userFirstName: user.firstName,
                    userMiddleName: user.middleName,
                    userLastName: user.lastName,
                    email: user.email
                }));
                setUsers(mappedUsers);
            }
        } catch (err) {
            console.error("Error fetching users:", err);
            showPopup(FAIL_TO_LOAD_USERS, "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async (flag = 1) => {
        try {
            setLoading(true);
            const response = await getRequest(`${MAS_DEPARTMENT}/getAll/${flag}`);

            if (response && response.response) {
                setDepartments(response.response);
            }
        } catch (err) {
            console.error("Error fetching departments:", err);
            showPopup(FAIL_TO_LOAD_DEPARTMENTS, "error");
        } finally {
            setLoading(false);
        }
    };


    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
        const filtered = userDepartmentData.filter(userDept =>
        (userDept.userName?.toLowerCase() || "").includes(e.target.value.toLowerCase()) ||
        (userDept.departmentName?.toLowerCase() || "").includes(e.target.value.toLowerCase())
    );
    setFilteredTotalPages(Math.ceil(filtered.length / itemsPerPage));
    };

    const filteredUserDepartmentData = userDepartmentData.filter(userDept =>
        (userDept.userName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (userDept.departmentName?.toLowerCase() || "").includes(searchQuery.toLowerCase())

    );

   
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredUserDepartmentData.slice(indexOfFirstItem, indexOfLastItem);

    const handleEdit = (userDept) => {
        setEditingDepartment(userDept);
        setFormData({
            userId: userDept.userId,
            userName: userDept.userName,
            departmentId: userDept.departmentId,
            departmentName: userDept.departmentName
        });
        setIsFormValid(true);
        setShowForm(true);
    };

   
   const handleSave = async (e) => {
    e.preventDefault();

    if (!isFormValid) return;

    try {
        setLoading(true);

        if (editingDepartment) {

            const isDuplicate = userDepartmentData.some(
                (userDept) =>
                    String(userDept.userId) === String(formData.userId) &&
                    String(userDept.departmentId) === String(formData.departmentId) &&
                    userDept.id !== editingDepartment.id
            );

            if (isDuplicate) {
                showPopup(DUPLICATE_USER_DEPARTMENT, "error");
                setLoading(false);
                return;
            }

            const response = await putRequest(
                `${MAS_USER_DEPARTMENT}/updateById/${editingDepartment.id}`,
                {
                    id: editingDepartment.id,
                    userId: formData.userId,
                    departmentId: formData.departmentId,
                    status: editingDepartment.status
                }
            );

           if (response?.status === 200) {

    showPopup(
        UPDATE_USER_DEPARTMENT_SUCC_MSG,
        "success",
        async () => {

           
            await setCurrentPage(1);
            setEditingDepartment(null);

            setFormData({
                userId: "",
                userName: "",
                departmentId: "",
                departmentName: ""
            });

            setShowForm(false);
        }
    );
}

        } else {

            const isDuplicate = userDepartmentData.some(
                (userDept) =>
                    String(userDept.userId) === String(formData.userId) &&
                    String(userDept.departmentId) === String(formData.departmentId)
            );

            if (isDuplicate) {
                showPopup(DUPLICATE_USER_DEPARTMENT, "error");
                setLoading(false);
                return;
            }

            const response = await postRequest(
                `${MAS_USER_DEPARTMENT}/create`,
                {
                    userId: formData.userId,
                    departmentId: formData.departmentId,
                }
            );

            if (response && response.response) {

                showPopup(
                    ADD_USER_DEPARTMENT_SUCC_MSG,
                    "success",
                    async () => {
                        
                        await setCurrentPage(1);

                        setEditingDepartment(null);

                        setFormData({
                            userId: "",
                            userName: "",
                            departmentId: "",
                            departmentName: ""
                        });

                        setShowForm(false);
                    }
                );
            }
        }

    } catch (err) {

        console.error("Error saving user department data:", err);
        showPopup(FAIL_TO_SAVE_CHANGES, "error");

    } finally {

        setLoading(false);
    }
};

   const showPopup = (message, type = "info", callback = null) => {
    setPopupMessage({
        message,
        type,
        onClose: async () => {
            setPopupMessage(null);

            if (callback) {
                await callback();
            }
        }
    });
};

        const handlePageNavigation = () => {
        const pageNumber = parseInt(pageInput);
        if (pageNumber >= 1 && pageNumber <= filteredTotalPages) {
            setCurrentPage(pageNumber);
        } else {
           
            showPopup(INVALID_PAGE_NO_WARN_MSG, "error");
        }
    };

    
   const handleUserSelect = (user) => {

    const updatedFormData = {
        ...formData,
        userId: user.userId,
        userName: user.userName
    };

    setFormData(updatedFormData);

    setIsDropdownVisible(false);

    setIsFormValid(
        updatedFormData.userId !== "" &&
        updatedFormData.departmentId !== ""
    );
};

   const handleDepartmentChange = (e) => {

    const selectedDepartmentId = e.target.value;

    const selectedDepartment = departments.find(
        dept => dept.id.toString() === selectedDepartmentId
    );

    const updatedFormData = {
        ...formData,
        departmentId: selectedDepartmentId,
        departmentName: selectedDepartment
            ? selectedDepartment.departmentName
            : ""
    };

    setFormData(updatedFormData);

    setIsFormValid(
        updatedFormData.userId !== "" &&
        updatedFormData.departmentId !== ""
    );
};

    const handleRefresh = () => {
        setSearchQuery("");
        setCurrentPage(1);
        fetchUserDepartmentData(0); 
    };

    const renderPagination = () => {
        const pageNumbers = [];
        const maxVisiblePages = 5; 
        
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(filteredTotalPages, startPage + maxVisiblePages - 1);
        
        // Adjust startPage if we're near the end
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // First page
        if (startPage > 1) {
            pageNumbers.push(
                <li key={1} className="page-item">
                    <button className="page-link" onClick={() => setCurrentPage(1)}>1</button>
                </li>
            );
            if (startPage > 2) {
                pageNumbers.push(<li key="ellipsis1" className="page-item disabled"><span className="page-link">...</span></li>);
            }
        }
        
        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(
                <li key={i} className={`page-item ${currentPage === i ? "active" : ""}`}>
                    <button className="page-link" onClick={() => setCurrentPage(i)}>{i}</button>
                </li>
            );
        }
        
        // Last page
        if (endPage < filteredTotalPages) {
            if (endPage < filteredTotalPages - 1) {
                pageNumbers.push(<li key="ellipsis2" className="page-item disabled"><span className="page-link">...</span></li>);
            }
            pageNumbers.push(
                <li key={filteredTotalPages} className="page-item">
                    <button className="page-link" onClick={() => setCurrentPage(filteredTotalPages)}>{filteredTotalPages}</button>
                </li>
            );
        }
        
        return pageNumbers;
    };

    
    
   
    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title">User Department Master</h4>
                            <div className="d-flex justify-content-between align-items-center">
                                {!showForm && (
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
                                )}

                                <div className="d-flex align-items-center">
                                    {!showForm ? (
                                        <>
                                            <button
                                                type="button"
                                                className="btn btn-success me-2"
                                                onClick={() => {
                                                    setEditingDepartment(null);
                                                    setFormData({
                                                        userId: "",
                                                        userName: "",
                                                        departmentId: "",
                                                        departmentName: ""
                                                    });
                                                    setIsFormValid(false);
                                                    setShowForm(true);
                                                }}
                                            >
                                                <i className="mdi mdi-plus"></i> Add
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-success me-2 flex-shrink-0"
                                                onClick={handleRefresh}
                                            >
                                                <i className="mdi mdi-refresh"></i> Show All
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
                                                <th>User Name</th>
                                                <th>Department Name</th>
                                                {/* <th>Status</th> */}
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.length > 0 ? (
                                                currentItems.map((userDept) => (
                                                    <tr key={userDept.id}>
                                                        <td>{userDept.userName}</td>
                                                        <td>{userDept.departmentName}</td>
                                                        {/* <td>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={userDept.status?.toLowerCase() === "y"}
                                                                    onChange={() => handleSwitchChange(userDept.id, userDept.status?.toLowerCase() === "y" ? "n" : "y")}
                                                                    id={`switch-${userDept.id}`}
                                                                />
                                                                <label
                                                                    className="form-check-label px-0"
                                                                    htmlFor={`switch-${userDept.id}`}
                                                                >
                                                                    {userDept.status?.toLowerCase() === "y" ? 'Active' : 'Deactivated'}
                                                                </label>
                                                            </div>
                                                        </td> */}
                                                        <td>
                                                            <button
                                                                className="btn btn-sm btn-success me-2"
                                                                onClick={() => handleEdit(userDept)}
                                                            // disabled={userDept.status?.toLowerCase() !== "y"}
                                                            >
                                                                <i className="fa fa-pencil"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="text-center">No user department data found</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>

                                     {filteredUserDepartmentData.length > 0 && (
                                        <nav className="d-flex justify-content-between align-items-center mt-3">
                                            <div>
                                                <span>
                                                    Page {currentPage} of {filteredTotalPages} | Total Records: {totalFilteredProducts}
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
                                    <div className="form-group col-md-4 position-relative">
                                        <label>User Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control mt-1"
                                            id="userName"
                                            placeholder="Search User"
                                            value={formData.userName}
                                            onChange={(e) => {
                                                setFormData({
                                                    ...formData,
                                                    userId: "",
                                                    userName: e.target.value
                                                });
                                                setIsDropdownVisible(true);
                                                setIsFormValid(false);
                                            }}
                                            autoComplete="off"
                                            required
                                        />
                                        {isDropdownVisible && formData.userName && (
                                            <ul className="list-group position-absolute w-100 mt-1" style={{ zIndex: 1000 }}>
                                                {users
                                                    .filter(user => user.userName.toLowerCase().includes(formData.userName.toLowerCase()))
                                                    .map(user => (
                                                        <li
                                                            key={user.userId}
                                                            className="list-group-item list-group-item-action"
                                                            onClick={() => handleUserSelect(user)}
                                                        >
                                                            {user.userName} ({user.userFirstName} {user.userMiddleName} {user.userLastName})
                                                        </li>
                                                    ))}
                                            </ul>
                                        )}
                                    </div>

                                    <div className="form-group col-md-4">
                                        <label>Department <span className="text-danger">*</span></label>
                                        <select
                                            className="form-control mt-1"
                                            id="departmentId"
                                            value={formData.departmentId}
                                            onChange={handleDepartmentChange}
                                            required
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map(dept => (
                                                <option key={dept.id} value={dept.id}>
                                                    {dept.departmentName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                                        <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                                                          {editingDepartment ? "Update" : "Save"}
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
                            {/* {confirmDialog.isOpen && (
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
                                                    Are you sure you want to {confirmDialog.newStatus?.toLowerCase() === "y" ? 'activate' : 'deactivate'} <strong>
                                                    {userDepartmentData.find(userDept => userDept.id === confirmDialog.departmentId)?.userName} - 
                                                    {userDepartmentData.find(userDept => userDept.id === confirmDialog.departmentId)?.departmentName}
                                                    </strong>?
                                                </p>
                                            </div>
                                            <div className="modal-footer">
                                                <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>No</button>
                                                <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>Yes</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )} */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Userdepartment;