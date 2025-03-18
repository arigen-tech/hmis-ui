import { useState, useEffect } from "react"
import Popup from "../../../Components/popup";

const Userdepartment = () => {
    const [formData, setFormData] = useState({
        userName: "",
        departmentName: ""
    });
    const [showForm, setShowForm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [pageInput, setPageInput] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [users, setUsers] = useState([
        { id: 1, name: "ANM" },
        { id: 2, name: "AUFITOR" },
        { id: 3, name: "DOCTOR" },
        { id: 4, name: "NURSE" },
        { id: 5, name: "ADMIN" }
    ]);

    const [departments, setDepartments] = useState([
        { id: 1, name: "CARDIOLOGY" },
        { id: 2, name: "NEUROLOGY" },
        { id: 3, name: "PEDIATRICS" },
        { id: 4, name: "ORTHOPEDICS" },
        { id: 5, name: "EMERGENCY" }
    ]);

    const [userDepartmentData, setUserDepartmentData] = useState([
        { id: 1, userName: "John Doe", departmentName: "Cardiology", status: "y" },
        { id: 2, userName: "Jane Smith", departmentName: "Neurology", status: "y" },
        { id: 3, userName: "Alice Johnson", departmentName: "Pediatrics", status: "y" },
        // ... add more sample data as needed ...
    ]);

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, departmentId: null, newStatus: false });
    const [totalFilteredProducts, setTotalFilteredProducts] = useState(0);

    const filteredDepartments = userDepartmentData.filter(department =>
        department.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        department.departmentName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to first page when search changes
    };

    const handleEdit = (department) => {
        setEditingDepartment(department);
        setFormData({
            userName: department.userName,
            departmentName: department.departmentName
        });
        setIsFormValid(true); // Since we're editing, form is already valid
        setShowForm(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!formData.userName || !formData.departmentName) {
            alert("Please fill out all required fields.");
            return;
        }

        const newDepartment = {
            id: editingDepartment ? editingDepartment.id : userDepartmentData.length + 1,
            userName: formData.userName,
            departmentName: formData.departmentName,
            status: "y"
        };

        if (editingDepartment) {
            setUserDepartmentData(userDepartmentData.map(department =>
                department.id === editingDepartment.id ? newDepartment : department
            ));
        } else {
            setUserDepartmentData([...userDepartmentData, newDepartment]);
        }

        setEditingDepartment(null);
        setShowForm(false);
        setFormData({ userName: "", departmentName: "" });
        showPopup("Changes saved successfully!", "success");
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

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        const newFormData = { ...formData, [id]: value };
        setFormData(newFormData);

        // Validate form immediately
        const isValid = newFormData.userName && newFormData.departmentName;
        setIsFormValid(isValid);
    };

    const handleCreateFormSubmit = (e) => {
        e.preventDefault()
        if (formData.userName && formData.departmentName) {
            setUserDepartmentData([...userDepartmentData, { ...formData, id: Date.now(), status: "y" }])
            setFormData({ userName: "", departmentName: "" })
            setShowForm(false)
        } else {
            alert("Please fill out all required fields.")
        }
    }

    const handleSwitchChange = (id, newStatus) => {
        setConfirmDialog({ isOpen: true, departmentId: id, newStatus });
    };

    const handleConfirm = (confirmed) => {
        if (confirmed && confirmDialog.departmentId !== null) {
            setUserDepartmentData((prevData) =>
                prevData.map((department) =>
                    department.id === confirmDialog.departmentId ? { ...department, status: confirmDialog.newStatus } : department
                )
            );
        }
        setConfirmDialog({ isOpen: false, departmentId: null, newStatus: null });
    };

    const filteredTotalPages = Math.ceil(filteredDepartments.length / itemsPerPage);

    const currentItems = filteredDepartments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageNavigation = () => {
        const pageNumber = parseInt(pageInput, 10);
        if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
            setCurrentPage(pageNumber);
        } else {
            alert("Please enter a valid page number.");
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
                            <h4 className="card-title">User Department Master</h4>
                            <div className="d-flex justify-content-between align-items-center">

                                {!showForm ? (
                                    <form className="d-inline-block searchform me-4" role="search">
                                        <div className="input-group searchinput">
                                            <input
                                                type="search"
                                                className="form-control"
                                                placeholder="Search Departments"
                                                aria-label="Search"
                                                value={searchQuery}
                                                onChange={handleSearch}

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
                                            <button type="button" className="btn btn-success me-2">
                                                <i className="mdi mdi-plus"></i> Show All
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
                            {!showForm ? (
                                <div className="table-responsive packagelist">
                                    <table className="table table-bordered table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>User Name</th>
                                                <th>Department Name</th>
                                                <th>Edit</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((department) => (
                                                <tr key={department.id}>
                                                    <td>{department.userName}</td>
                                                    <td>{department.departmentName}</td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={department.status === "y"}
                                                                onChange={() => handleSwitchChange(department.id, department.status === "y" ? "n" : "y")}
                                                                id={`switch-${department.id}`}
                                                            />
                                                            <label
                                                                className="form-check-label px-0"
                                                                htmlFor={`switch-${department.id}`}
                                                            >
                                                                {department.status === "y" ? 'Active' : 'Deactive'}
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-success me-2"
                                                            onClick={() => handleEdit(department)}
                                                            disabled={department.status !== "y"}
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
                                            <span>
                                                Page {currentPage} of {filteredTotalPages} | Total Records: {filteredDepartments.length}
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
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="form-group col-md-4 mt-1">
                                        <label>
                                            User Name <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className="form-control mt-1"
                                            id="userName" // Ensure this matches the key in formData
                                            required
                                            value={formData.userName} // Use value instead of defaultValue
                                            onChange={handleInputChange} // Call handleInputChange on change
                                        >
                                            <option value="">Select User</option>
                                            <option value="ANM">ANM</option>
                                            <option value="AUFITOR">AUFITOR</option>
                                            <option value="DOCTOR">DOCTOR</option>
                                            <option value="NURSE">NURSE</option>
                                            <option value="ADMIN">ADMIN</option>
                                            {users.map(user => (
                                                <option key={user.id} value={user.name}>
                                                    {user.name}
                                                </option>
                                            ))}
                                        </select>

                                    </div>

                                    <div className="form-group col-md-4 mt-1">
                                        <label>
                                            Department Name <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className="form-control mt-1"
                                            id="departmentName" // Ensure this matches the key in formData
                                            required
                                            value={formData.departmentName} // Use value instead of defaultValue
                                            onChange={handleInputChange} // Call handleInputChange on change
                                        >
                                            <option value="">Select Department</option>
                                            <option value="CARDIOLOGY">Cardiology</option>
                                            <option value="NEUROLOGY">Neurology</option>
                                            <option value="PEDIATRICS">Pediatrics</option>
                                            <option value="ORTHOPEDICS">Orthopedics</option>
                                            <option value="EMERGENCY">Emergency</option>
                                            {departments.map(dept => (
                                                <option key={dept.id} value={dept.name}>
                                                    {dept.name}
                                                </option>
                                            ))}
                                        </select>

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
                                                <h1 className="modal-title fs-5" id="staticBackdropLabel">Modal title</h1>
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
                                                    Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{userDepartmentData.find(department => department.id === confirmDialog.departmentId)?.userName} - {userDepartmentData.find(department => department.id === confirmDialog.departmentId)?.departmentName}</strong>?
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
        </div >
    )
}

export default Userdepartment;