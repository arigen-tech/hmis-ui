import { useState, useEffect } from "react"
import Popup from "../../../Components/popup";
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import { EMPLOYEE_TYPE, DEPARTMENT, API_HOST } from "../../../config/apiConfig";


const Createusermaster = () => {
    const [formData, setFormData] = useState({
        userId: "",
        Name: "",
        userName: "",
        userType: "",
        status: "y",
        rolesIdForUsers: ""
    })
    const [pageInput, setPageInput] = useState("");
    const [allUserData, setAllUserData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1)
    const [popupMessage, setPopupMessage] = useState(null);
    const itemsPerPage = 4
    const [showForm, setShowForm] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [editId, setEditId] = useState(null)
    const [employeeTypeData, setEmployeeTypeData] = useState([]);
    const [departmentData, setDepartmentData] = useState([]);
    const [allRolesData, setAllRolesData] = useState([]);
    const [availableRoles, setAvailableRoles] = useState([]);
    const [assignedRoles, setAssignedRoles] = useState([]);
    const [selectedAvailable, setSelectedAvailable] = useState([]);
    const [selectedAssigned, setSelectedAssigned] = useState([]);
    const [userDepartmentData, setUserDepartmentData] = useState([]);
    const [selectedAvailableDepartments, setSelectedAvailableDepartments] = useState([]);
    const [selectedAssignedDepartments, setSelectedAssignedDepartments] = useState([]);
    const [assignedDepartments, setAssignedDepartments] = useState([]);
    const [availableDepartments, setAvailableDepartments] = useState([]);
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        userId: null,
        newStatus: null,
        action: null,
    })
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [originalAssignedRoles, setOriginalAssignedRoles] = useState([]);
    const [originalAssignedDepartments, setOriginalAssignedDepartments] = useState([]);



    useEffect(() => {
        fetchUsersData();
        fetchEmployeeTypeData();
    }, []);

    useEffect(() => {
        if (formData?.rolesIdForUsers) {
            fetchAllRolesData();
        }
        if (formData?.userId) {
            fetchDepartmentAndUserDepartments();
        }
    }, [formData]);



    const fetchAllRolesData = async () => {
        setLoading(true);
        try {
            const data = await getRequest(`/roles/getAllRoles/1`);
            if (data.status === 200 && Array.isArray(data.response)) {
                const allRoles = data.response.filter(role => role.status === 'y');
                setAllRolesData(allRoles);

                const assignedIds = formData.rolesIdForUsers
                    ?.split(',')
                    .map(id => parseInt(id.trim()))
                    .filter(id => !isNaN(id)) || [];

                const assigned = allRoles.filter(role => assignedIds.includes(role.id));
                const available = allRoles.filter(role => !assignedIds.includes(role.id));

                setAssignedRoles(assigned);
                setAvailableRoles(available);
            } else {
                console.error("Unexpected API response format:", data);
            }
        } catch (error) {
            console.error("Error fetching roles:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsersData = async () => {
        setLoading(true);
        try {
            const data = await getRequest(`/authController/getAllUsers`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setAllUserData(data.response);
            } else {
                console.error("Unexpected API response format:", data);
                setAllUserData([]);
            }
        } catch (error) {
            console.error("Error fetching User data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployeeTypeData = async () => {
        setLoading(true);
        try {
            const data = await getRequest(`${EMPLOYEE_TYPE}/getAllUserType/1`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setEmployeeTypeData(data.response);
            } else {
                console.error("Unexpected API response format:", data);
                setEmployeeTypeData([]);
            }
        } catch (error) {
            console.error("Error fetching EmployeeType data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartmentAndUserDepartments = async () => {
        setLoading(true);
        try {
            const [userDeptRes, allDeptRes] = await Promise.all([
                getRequest(`${DEPARTMENT}/userDepartmentsByUser/${formData.userId}`),
                getRequest(`${DEPARTMENT}/getAllDepartments/1`)
            ]);

            if (
                userDeptRes.status === 200 &&
                allDeptRes.status === 200 &&
                Array.isArray(userDeptRes.response) &&
                Array.isArray(allDeptRes.response)
            ) {
                const allDepartments = allDeptRes.response.filter(dep => dep.status === 'y');
                const userDepartments = userDeptRes.response;

                // Extract assigned department IDs
                const assignedDeptIds = userDepartments.map(dep => dep.departmentId);

                // Split assigned and available
                const assigned = allDepartments.filter(dep => assignedDeptIds.includes(dep.id));
                const available = allDepartments.filter(dep => !assignedDeptIds.includes(dep.id));

                setDepartmentData(allDepartments);
                setUserDepartmentData(userDepartments);
                setAssignedDepartments(assigned);
                setAvailableDepartments(available);
            } else {
                console.error("Unexpected API response format");
                setAssignedDepartments([]);
                setAvailableDepartments([]);
            }
        } catch (error) {
            console.error("Error fetching department data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEmployeeTypeChange = (empTypeId) => {
        setFormData((prevState) => ({
            ...prevState,
            employeeTypeId: empTypeId,
        }));
    };

    const [searchFilters, setSearchFilters] = useState({
        userName: ""
    })

    const handleSearchChange = (e) => {
        const { name, value } = e.target
        setSearchFilters((prev) => ({ ...prev, [name]: value }))
        setCurrentPage(1)
    }

    const handleInputChange = (e) => {
        const { id, value } = e.target
        setFormData((prevData) => ({ ...prevData, [id]: value }))
    }

    const arraysAreEqual = (arr1, arr2, key = 'id') => {
        const ids1 = arr1.map(item => item[key]).sort();
        const ids2 = arr2.map(item => item[key]).sort();
        return JSON.stringify(ids1) === JSON.stringify(ids2);
    };

    const handleSave = async (e) => {
        e.preventDefault();

        const userId = formData.userId;
        const roleIds = assignedRoles.map(role => role.id).join(",");

        const departmentPayload = {
            userId,
            departments: assignedDepartments.map(dept => ({
                departmentId: dept.id,
                status: dept.status
            }))
        };

        const rolesChanged = !arraysAreEqual(assignedRoles, originalAssignedRoles);
        const departmentsChanged = !arraysAreEqual(assignedDepartments, originalAssignedDepartments);

        let rolesSuccess = true;
        let deptSuccess = true;

        try {
            if (rolesChanged) {
                await putRequest(`/authController/updateRoles/${userId}?roles=${roleIds}`, {});
            }
            if (departmentsChanged) {
                await putRequest(`/user-departments/addOrUpdateUserDept`, departmentPayload);
            }

            if (rolesChanged || departmentsChanged) {
                showPopup("Roles and/or departments updated successfully!", "success");
            } else {
                showPopup("No changes detected. Nothing was updated.", "info");
            }
        } catch (error) {
            console.error("Update error:", error);
            if (rolesChanged) rolesSuccess = false;
            if (departmentsChanged) deptSuccess = false;

            if (!rolesSuccess) showPopup("Error updating roles. Please try again.", "error");
            if (!deptSuccess) showPopup("Error updating departments. Please try again.", "error");
        }

        fetchUsersData();
        setShowForm(false);
        setEditMode(false);
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

    const handleRefresh = () => {
        setSearchFilters({ userName: "" });
        setFilteredUsers(allUserData);
        setCurrentPage(1);
    };

    const handleSearch = () => {
        const filtered = allUserData.filter((user) =>
            user.username.toLowerCase().includes(searchFilters.userName.toLowerCase())
        );
        setFilteredUsers(filtered);
    };

    useEffect(() => {
        setFilteredUsers(allUserData);
    }, [allUserData]);



    const handleConfirm = async (confirmed) => {
        if (confirmed && confirmDialog.userId !== null && confirmDialog.action === "status") {
            try {
                const response = await fetch(
                    `${API_HOST}/authController/updateStatus/${confirmDialog.userId}?status=${confirmDialog.newStatus}`,
                    {
                        method: "PUT",
                    }
                );

                if (!response.ok) {
                    throw new Error("Failed to update status");
                }

                const updateUserStatus = (userId, newStatus) => (user) =>
                    user.userId === userId ? { ...user, status: newStatus } : user;

                setUsers((prevData) => prevData.map(updateUserStatus(confirmDialog.userId, confirmDialog.newStatus)));
                setFilteredUsers((prevData) => prevData.map(updateUserStatus(confirmDialog.userId, confirmDialog.newStatus)));

                showPopup(
                    `User ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
                    "success"
                );
                fetchUsersData();
            } catch (error) {
                console.error("Status update failed:", error);
                showPopup("Failed to update user status. Please try again.", "error");
            }
        }

        setConfirmDialog({ isOpen: false, userId: null, newStatus: null, action: null });
    };

    const handleEditClick = (user) => {
        const fullName = [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ');

        setFormData({
            userId: user.userId,
            userName: user.username,
            Name: fullName,
            userType: user?.userType?.userTypeId,
            status: user.status,
            rolesIdForUsers: user.roleId
        });

        setShowForm(true);
        setEditMode(true);
        setEditId(user.userId);

        // Create and store deep copies for comparison later
        setOriginalAssignedRoles(JSON.parse(JSON.stringify(assignedRoles)));
        setOriginalAssignedDepartments(JSON.parse(JSON.stringify(assignedDepartments)));
    };


    const handlePageNavigation = () => {
        const pageNumber = parseInt(pageInput, 10);
        if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
            setCurrentPage(pageNumber);
        } else {
            showPopup("Please enter a valid page number.", "error"); // Use the popup for error message
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

    const handleAssignDepartments = () => {
        const toAssign = availableDepartments.filter(dept =>
            selectedAvailableDepartments.includes(dept.id)
        );

        setAssignedDepartments((prev) => [...prev, ...toAssign]);
        setAvailableDepartments((prev) =>
            prev.filter((dept) => !selectedAvailableDepartments.includes(dept.id))
        );
        setSelectedAvailableDepartments([]);
    };

    const handleRemoveDepartments = () => {
        const toRemove = assignedDepartments.filter(dept =>
            selectedAssignedDepartments.includes(dept.id)
        );

        setAvailableDepartments((prev) => [...prev, ...toRemove]);
        setAssignedDepartments((prev) =>
            prev.filter((dept) => !selectedAssignedDepartments.includes(dept.id))
        );
        setSelectedAssignedDepartments([]);
    };

    const handleSelectAvailableRoles = (e) => {
        const selected = Array.from(e.target.selectedOptions).map(opt => parseInt(opt.value));
        setSelectedAvailable(selected);
    };

    const handleSelectAssignedRoles = (e) => {
        const selected = Array.from(e.target.selectedOptions).map(opt => parseInt(opt.value));
        setSelectedAssigned(selected);
    };

    const handleAssignRoles = () => {
        const moveToAssigned = availableRoles.filter(role => selectedAvailable.includes(role.id));
        setAssignedRoles(prev => [...prev, ...moveToAssigned]);
        setAvailableRoles(prev => prev.filter(role => !selectedAvailable.includes(role.id)));
        setSelectedAvailable([]);
    };

    const handleRemoveRoles = () => {
        const moveToAvailable = assignedRoles.filter(role => selectedAssigned.includes(role.id));
        setAvailableRoles(prev => [...prev, ...moveToAvailable]);
        setAssignedRoles(prev => prev.filter(role => !selectedAssigned.includes(role.id)));
        setSelectedAssigned([]);
    };

    const currentItems = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const filteredTotalPages = Math.ceil(filteredUsers.length / itemsPerPage)
    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header">
                            <h4 className="card-title p-2">User Management</h4>
                            {!showForm && (
                                <div className="d-flex mt-3 mx-0">
                                    <div className="col-md-7 row">
                                        <div className="col-md-6 d-flex">
                                            <label htmlFor="userName" className="flex-shrink-0 mt-1">
                                                Username
                                            </label>
                                            <input
                                                type="text"
                                                id="userName"
                                                name="userName"
                                                className="form-control ms-2 me-4"
                                                placeholder="Enter Username"
                                                value={searchFilters.userName}
                                                onChange={handleSearchChange}
                                            />
                                        </div>

                                        <div className="col-md-2 d-flex">
                                            <button type="button" className="btn btn-primary ms-2" onClick={handleSearch}>
                                                <i className="mdi mdi-magnify"></i> Search
                                            </button>
                                        </div>
                                    </div>

                                    <div className="col-md-5 text-end">
                                        <button type="button" className="btn btn-success me-1" onClick={handleRefresh}>
                                            <i className="mdi mdi-plus"></i> Show All
                                        </button>

                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="card-body">
                            {!showForm ? (
                                <div className="table-responsive packagelist">
                                    <table className="table table-bordered table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Username</th>
                                                <th>Name of User</th>
                                                <th>Date of Birth</th>
                                                <th>Edit</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((user) => (
                                                <tr key={user.userId}>
                                                    <td>{user.username}</td>
                                                    <td>{[user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ')}</td>
                                                    <td>{user.dateOfBirth}</td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-success me-2"
                                                            disabled={user.status !== "y"}
                                                            onClick={() => handleEditClick(user)}
                                                        >
                                                            <i className="fa fa-pencil"></i>
                                                        </button>
                                                    </td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={user.status === "y"}
                                                                onChange={() => {
                                                                    const newStatus = user.status === "y" ? "n" : "y"
                                                                    setConfirmDialog({
                                                                        isOpen: true,
                                                                        userId: user.userId,
                                                                        newStatus: newStatus,
                                                                        action: "status",
                                                                    })
                                                                }}
                                                                id={`switch-${user.userId}`}
                                                            />
                                                            <label className="form-check-label px-0" htmlFor={`switch-${user.userId}`}>
                                                                {user.status === "y" ? "Active" : "Deactivated"}
                                                            </label>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <nav className="d-flex justify-content-between align-items-center mt-3">
                                        <div>
                                            <span>
                                                Page {currentPage} of {filteredTotalPages} | Total Records: {filteredUsers.length}
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

                                </div>
                            ) : (
                                <form className="forms row">
                                    <div className="d-flex justify-content-between">
                                        <h5>{editMode ? "Edit User" : "Add New User"}</h5>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                setShowForm(false)
                                                setEditMode(false)
                                                setFormData({ userId: "", username: "", userLevel: "", status: "y" })
                                            }}
                                        >
                                            <i className="mdi mdi-arrow-left"></i> Back
                                        </button>
                                    </div>
                                    <div className="form-group col-md-4">
                                        <label>
                                            User Name <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control mt-1"
                                            id="userName"
                                            placeholder="Username"
                                            value={formData.userName}
                                            readOnly
                                        />
                                    </div>

                                    <div className="form-group col-md-4">
                                        <label>
                                            Name <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control mt-1"
                                            id="Name"
                                            placeholder="Name"
                                            value={formData.Name}
                                            readOnly
                                        />
                                    </div>

                                    <div className="form-group col-md-4 mt-1">
                                        <label>
                                            Type of User <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className="form-select"
                                            style={{ paddingRight: "40px" }}
                                            value={formData.userType}
                                            disabled
                                        >
                                            <option value="">Select Employee Type</option>
                                            {employeeTypeData.map((empType) => (
                                                <option key={empType.userTypeId} value={empType.userTypeId}>
                                                    {empType.userTypeName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>


                                    <div className="form-group col-12 mt-3">
                                        <label><b>Role Assigned</b></label>
                                        <div className="row">
                                            {/* All Roles */}
                                            <div className="col-md-5">
                                                <label className="mb-2"><b>All Roles</b></label>
                                                <select
                                                    className="form-control w-100"
                                                    size="8"
                                                    multiple
                                                    onChange={handleSelectAvailableRoles}
                                                >
                                                    {availableRoles.map(role => (
                                                        <option key={role.id} value={role.id}>
                                                            {role.roleDesc}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Arrows */}
                                            <div className="col-md-2 d-flex flex-column align-items-center justify-content-center rollarrows">
                                                <i className="icofont-bubble-right" onClick={handleAssignRoles}></i>
                                                <i className="icofont-bubble-left" onClick={handleRemoveRoles}></i>
                                            </div>

                                            {/* Assigned Roles */}
                                            <div className="col-md-5">
                                                <label className="mb-2"><b>Assigned Roles</b></label>
                                                <select
                                                    className="form-control w-100"
                                                    size="8"
                                                    multiple
                                                    onChange={handleSelectAssignedRoles}
                                                >
                                                    {assignedRoles.map(role => (
                                                        <option key={role.id} value={role.id}>
                                                            {role.roleDesc}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>


                                    <div className="form-group col-12 mt-3">
                                        <label><b>Department Assigned</b></label>
                                        <div className="row">
                                            {/* Available Departments */}
                                            <div className="col-md-5">
                                                <label className="mb-2"><b>All Departments</b></label>
                                                <select
                                                    className="form-control w-100"
                                                    multiple
                                                    size="8"
                                                    onChange={(e) =>
                                                        setSelectedAvailableDepartments(Array.from(e.target.selectedOptions, (opt) => parseInt(opt.value)))
                                                    }
                                                >
                                                    {availableDepartments.map((dept) => (
                                                        <option key={dept.id} value={dept.id}>{dept.departmentName}</option>
                                                    ))}
                                                </select>
                                            </div>


                                            {/* Arrows */}
                                            <div className="col-md-2 d-flex flex-column align-items-center justify-content-center rollarrows">
                                                <i className="icofont-bubble-right" onClick={handleAssignDepartments}></i>
                                                <i className="icofont-bubble-left" onClick={handleRemoveDepartments}></i>
                                            </div>

                                            {/* Assigned Departments */}
                                            <div className="col-md-5">
                                                <label className="mb-2"><b>Assigned Departments</b></label>
                                                <select className="form-control w-100" multiple size="8"
                                                    onChange={(e) =>
                                                        setSelectedAssignedDepartments(Array.from(e.target.selectedOptions, (opt) => parseInt(opt.value)))
                                                    }>
                                                    {assignedDepartments.map((dept) => (
                                                        <option key={dept.id} value={dept.id}>{dept.departmentName}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>


                                    <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                                        <button onClick={handleSave} className="btn btn-primary me-2">
                                            Update
                                        </button>

                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={() => {
                                                setShowForm(false)
                                                setEditMode(false)
                                                setFormData({
                                                    userId: "",
                                                    Name: "",
                                                    userName: "",
                                                    userType: "",
                                                    status: "y",
                                                    rolesIdForUsers: ""
                                                })
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                            {confirmDialog.isOpen && (
                                <div className="modal d-block" tabIndex="-1" role="dialog">
                                    <div className="modal-dialog" role="document">
                                        <div className="modal-content">
                                            <div className="modal-header">
                                                <h5 className="modal-title">
                                                    {confirmDialog.action === "status" ? "Confirm Status Change" : "Confirm Action"}
                                                </h5>
                                                <button type="button" className="close" onClick={() => handleConfirm(false)}>
                                                    <span>&times;</span>
                                                </button>
                                            </div>
                                            <div className="modal-body">
                                                <p>
                                                    {confirmDialog.action === "status" ? (
                                                        <>
                                                            Are you sure you want to{" "}
                                                            <strong>{confirmDialog.newStatus === "y" ? "activate" : "deactivate"}</strong>{" "}
                                                            <strong>
                                                                {allUserData.find((user) => user.userId === confirmDialog.userId)?.userName}
                                                            </strong>
                                                            ?
                                                        </>
                                                    ) : (
                                                        <>Are you sure you want to proceed with this action?</>
                                                    )}
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

                            {popupMessage && (
                                <Popup
                                    message={popupMessage.message}
                                    type={popupMessage.type}
                                    onClose={popupMessage.onClose}
                                />
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Createusermaster

