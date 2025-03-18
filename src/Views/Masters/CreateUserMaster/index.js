
import { useState } from "react"
import Popup from "../../../Components/popup";


const Createusermaster = () => {
    const [pageInput, setPageInput] = useState("");
    const [users, setUsers] = useState([
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },
        { id: 1, userId: "001", userName: "John Doe", userLevel: "Admin", status: "y" },

        { id: 2, userId: "002", userName: "Jane Smith", userLevel: "User", status: "n" },
    ])

    const [currentPage, setCurrentPage] = useState(1)
    const [popupMessage, setPopupMessage] = useState(null);
    const itemsPerPage = 4
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        userId: "",
        userName: "",
        userLevel: "",
        status: "y",
    })
    const [editMode, setEditMode] = useState(false)
    const [editId, setEditId] = useState(null)
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        userId: null,
        newStatus: null,
        action: null, // 'status' or 'edit'
    })

    const [searchFilters, setSearchFilters] = useState({
        userName: "",
        status: "",
    })
    const [filteredUsers, setFilteredUsers] = useState(users)

    const handleSearchChange = (e) => {
        const { name, value } = e.target
        setSearchFilters((prev) => ({ ...prev, [name]: value }))
        setCurrentPage(1)
    }

    const currentItems = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const filteredTotalPages = Math.ceil(filteredUsers.length / itemsPerPage)

    const handleInputChange = (e) => {
        const { id, value } = e.target
        setFormData((prevData) => ({ ...prevData, [id]: value }))
    }

    const handleSave = (e) => {
        e.preventDefault()
        if (editMode) {
            // Update existing user
            const updatedUsers = users.map((user) => (user.id === editId ? { ...user, ...formData } : user))
            setUsers(updatedUsers)
            setFilteredUsers(updatedUsers)
            setEditMode(false)
            setEditId(null)
        } else {
            // Add new user
            const newUser = { ...formData, id: users.length + 1 }
            const updatedUsers = [...users, newUser]
            setUsers(updatedUsers)
            setFilteredUsers(updatedUsers)
            showPopup("User added successfully!", "success");
        }
        setFormData({ userId: "", userName: "", userLevel: "", status: "y" })
        setShowForm(false)
    }

    const showPopup = (message, type = "info") => {
        setPopupMessage({
            message,
            type,
            onClose: () => {
                setPopupMessage(null);
            },
        });
    };

    // Update search handler
    const handleSearch = () => {
        const filtered = users.filter((user) => {
            const matchesName = user.userName.toLowerCase().includes(searchFilters.userName.toLowerCase())
            const matchesStatus = searchFilters.status ? user.status === searchFilters.status : true
            return matchesName && matchesStatus
        })
        setFilteredUsers(filtered)
        setCurrentPage(1)
    }

    // Update refresh handler
    const handleRefresh = () => {
        setSearchFilters({ userName: "", status: "" })
        setFilteredUsers(users)
        setCurrentPage(1)
    }

    const handleConfirm = (confirmed) => {
        if (confirmed && confirmDialog.userId !== null) {
            if (confirmDialog.action === "status") {
                // Toggle the status for the selected user
                setUsers((prevData) =>
                    prevData.map((user) =>
                        user.id === confirmDialog.userId ? { ...user, status: confirmDialog.newStatus } : user,
                    ),
                )
                // Also update the filteredUsers to reflect the change
                setFilteredUsers((prevData) =>
                    prevData.map((user) =>
                        user.id === confirmDialog.userId ? { ...user, status: confirmDialog.newStatus } : user,
                    ),
                )
                showPopup(`User ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`, "success");
            }
        }
        setConfirmDialog({ isOpen: false, userId: null, newStatus: null, action: null })
    }

    const handleEditClick = (user) => {
        setFormData({
            userId: user.userId,
            userName: user.userName,
            userLevel: user.userLevel,
            status: user.status,
        })
        setShowForm(true)
        setEditMode(true)
        setEditId(user.id)
    }

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
        const maxVisiblePages = 5; // Number of visible page buttons
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        const endPage = Math.min(filteredTotalPages, startPage + maxVisiblePages - 1);

        // Adjust startPage if there are not enough pages to show
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Add the first page and ellipsis if needed
        if (startPage > 1) {
            pageNumbers.push(1);
            if (startPage > 2) pageNumbers.push("...");
        }

        // Add the visible page numbers
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        // Add the last page and ellipsis if needed
        if (endPage < filteredTotalPages) {
            if (endPage < filteredTotalPages - 1) pageNumbers.push("...");
            pageNumbers.push(filteredTotalPages);
        }

        // Render the pagination buttons
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


    const [availableRoles, setAvailableRoles] = useState(["ADMIN", "APM", "AUDIT", "AUDITOR", "CITY OFFICER", "COMMISSIONER", "DISTRICT OFFICER", "DOCTOR"]); // Example roles
    const [assignedRoles, setAssignedRoles] = useState([]);
    const [selectedRoles, setSelectedRoles] = useState([]);

    // Handle selecting multiple roles
    const handleSelectRoles = (event) => {
        const options = event.target.options;
        const selectedValues = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                selectedValues.push(options[i].value);
            }
        }
        setSelectedRoles(selectedValues);
    };

    // Move selected roles to Assigned Roles
    const handleAssignRoles = () => {
        if (selectedRoles.length > 0) {
            setAssignedRoles([...assignedRoles, ...selectedRoles]);
            setAvailableRoles(availableRoles.filter(role => !selectedRoles.includes(role)));
            setSelectedRoles([]); // Reset selection
        }
    };

    // Remove selected roles from Assigned Roles
    const handleRemoveRoles = () => {
        if (selectedRoles.length > 0) {
            setAvailableRoles([...availableRoles, ...selectedRoles]);
            setAssignedRoles(assignedRoles.filter(role => !selectedRoles.includes(role)));
            setSelectedRoles([]); // Reset selection
        }
    };


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
                                                Name of User
                                            </label>
                                            <input
                                                type="text"
                                                id="userName"
                                                name="userName"
                                                className="form-control ms-2 me-4"
                                                placeholder="Enter Name"
                                                value={searchFilters.userName}
                                                onChange={handleSearchChange}
                                            />
                                        </div>
                                        <div className="col-md-4 d-flex">
                                            <label htmlFor="status" className="form-label flex-shrink-0 mt-1">
                                                Status
                                            </label>
                                            <select
                                                className="form-control ms-2"
                                                id="status"
                                                name="status"
                                                value={searchFilters.status}
                                                onChange={handleSearchChange}
                                            >
                                                <option value="">All</option>
                                                <option value="y">Active</option>
                                                <option value="n">Inactive</option>
                                            </select>
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
                                        <button
                                            type="button"
                                            className="btn btn-success me-1"
                                            onClick={() => {
                                                setFormData({ userId: "", userName: "", userLevel: "", status: "y" })
                                                setEditMode(false)
                                                setShowForm(true)
                                            }}
                                        >
                                            <i className="mdi mdi-plus"></i> ADD
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
                                                <th>User ID / Mobile Number</th>
                                                <th>Name of User</th>
                                                <th>Level of User</th>
                                                <th>Edit</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((user) => (
                                                <tr key={user.id}>
                                                    <td>{user.userId}</td>
                                                    <td>{user.userName}</td>
                                                    <td>{user.userLevel}</td>
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
                                                                        userId: user.id,
                                                                        newStatus: newStatus,
                                                                        action: "status",
                                                                    })
                                                                }}
                                                                id={`switch-${user.id}`}
                                                            />
                                                            <label className="form-check-label px-0" htmlFor={`switch-${user.id}`}>
                                                                {user.status === "y" ? "Active" : "Deactivated"}
                                                            </label>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="d-flex justify-content-between">
                                        <h5>{editMode ? "Edit User" : "Add New User"}</h5>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                setShowForm(false)
                                                setEditMode(false)
                                                setFormData({ userId: "", userName: "", userLevel: "", status: "y" })
                                            }}
                                        >
                                            <i className="mdi mdi-arrow-left"></i> Back
                                        </button>
                                    </div>
                                    <div className="form-group col-md-4">
                                        <label>
                                            User ID / Phone Number <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control mt-1"
                                            id="userId"
                                            placeholder="User ID"
                                            value={formData.userId}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-4">
                                        <label>
                                            Name of User <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control mt-1"
                                            id="userName"
                                            placeholder="Name"
                                            value={formData.userName}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-4">
                                        <label>
                                            Email ID <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control mt-1"
                                            id="email"
                                            placeholder="Email"
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-4 mt-1">
                                        <label>
                                            Level of User <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className="form-control mt-1"
                                            id="userLevel"
                                            value={formData.userLevel}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="State">State</option>
                                            <option value="City">City</option>
                                            <option value="District">District</option>
                                        </select>
                                    </div>
                                    <div className="form-group col-md-4 mt-1">
                                        <label>
                                            Type of User <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className="form-control mt-1"
                                            id="typeofuser"
                                            required
                                        >
                                            <option value="ANM">ANM</option>
                                            <option value="AUFITOR">AUFITOR</option>
                                            <option value="DOCTOR">DOCTOR</option>
                                        </select>
                                    </div>
                                    <div className="form-group col-12 mt-3">
                                        <label><b>Role Assigned</b></label>
                                        <div className="row">
                                            {/* All Roles Section */}
                                            <div className="col-md-5">
                                                <label className="mb-2"><b>All Roles</b></label>
                                                <select
                                                    className="form-control w-100"
                                                    size="8"
                                                    multiple
                                                    onChange={handleSelectRoles}
                                                >
                                                    {availableRoles.map((role, index) => (
                                                        <option key={index} value={role}>{role}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Transfer Buttons Section */}
                                            <div className="col-md-2 d-flex flex-column align-items-center justify-content-center rollarrows">
                                                <i class="icofont-bubble-right" onClick={handleAssignRoles}></i>
                                                <i class="icofont-bubble-left" onClick={handleRemoveRoles}></i>
                                            </div>

                                            {/* Assigned Roles Section */}
                                            <div className="col-md-5">
                                                <label className="mb-2"><b>Assigned Role</b></label>
                                                <select className="form-control w-100" size="8" multiple onChange={handleSelectRoles}>
                                                    {assignedRoles.map((role, index) => (
                                                        <option key={index} value={role}>{role}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                                        <button type="submit" className="btn btn-primary me-2">
                                            {editMode ? "Update" : "Save"}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={() => {
                                                setShowForm(false)
                                                setEditMode(false)
                                                setFormData({ userId: "", userName: "", userLevel: "", status: "y" })
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
                                                    {confirmDialog.action === "status" ? "Confirm Status Change" : "Confirm Edit"}
                                                </h5>
                                                <button type="button" className="close" onClick={() => handleConfirm(false)}>
                                                    <span>&times;</span>
                                                </button>
                                            </div>
                                            <div className="modal-body">
                                                <p>
                                                    {confirmDialog.action === "status" ? (
                                                        <>
                                                            Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                                                            <strong>{users.find((user) => user.id === confirmDialog.userId)?.userName}</strong>?
                                                        </>
                                                    ) : (
                                                        <>
                                                            Are you sure you want to edit the details of{" "}
                                                            <strong>{users.find((user) => user.id === confirmDialog.userId)?.userName}</strong>?
                                                        </>
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
                                    {renderPagination()} {/* Use the renderPagination function here */}
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
    )
}

export default Createusermaster

