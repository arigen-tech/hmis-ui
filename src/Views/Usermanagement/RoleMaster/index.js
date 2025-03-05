import { useState } from "react"
import Popup from "../../../Components/popup";

const Rolemaster = () => {
    const [roleData, setRoleData] = useState([
        { id: 1, roleCode: "R1", roleName: "Doctor", status: "y" },
        { id: 2, roleCode: "R3", roleName: "PHARMACIST", status: "y" },
        { id: 3, roleCode: "R4", roleName: "ANM", status: "y" },
        { id: 4, roleCode: "R5", roleName: "DRIVER", status: "y" },
        { id: 5, roleCode: "R6", roleName: "APM", status: "y" },
    ]);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, roleId: null, newStatus: false });

    const [formData, setFormData] = useState({
        roleCode: "",
        roleName: "",
    })
    const [searchQuery, setSearchQuery] = useState("");
   

    const handleRoleEdit = (role) => {
        setEditingRole(role);
        setShowForm(true);
    };

    const handleRoleSave = (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        const formElement = e.target;
        const updatedRoleName = formElement.roleName.value;
        const updatedRoleCode = formElement.roleCode.value;

        if (editingRole) {
            setRoleData(roleData.map(role =>
                role.id === editingRole.id
                    ? { ...role, roleName: updatedRoleName, roleCode: updatedRoleCode }
                    : role
            ));
        } else {
            const newRole = {
                id: roleData.length + 1,
                roleCode: updatedRoleCode,
                roleName: updatedRoleName,
                status: "y"
            };
            setRoleData([...roleData, newRole]);
        }

        setEditingRole(null);
        setShowForm(false);
        showPopup("Changes saved successfully!", "success");
    };

    const [showForm, setShowForm] = useState(false)
    const [isFormValid, setIsFormValid] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);

    const showPopup = (message, type = 'info') => {
        setPopupMessage({
            message,
            type,
            onClose: () => {
                setPopupMessage(null);
            }
        });
    };

    const handleSwitchChange = (id, newStatus) => {
        setConfirmDialog({ isOpen: true, roleId: id, newStatus });
    };

    const handleConfirm = (confirmed) => {
        if (confirmed && confirmDialog.roleId !== null) {
            setRoleData((prevData) =>
                prevData.map((role) =>
                    role.id === confirmDialog.roleId ? { ...role, status: confirmDialog.newStatus } : role
                )
            );
        }
        setConfirmDialog({ isOpen: false, roleId: null, newStatus: null });
    };

    const [currentPage, setCurrentPage] = useState(1);
    const [totalFilteredProducts, setTotalFilteredProducts] = useState(0);

    const handleInputChange = (e) => {
        const { id, value } = e.target
        setFormData((prevData) => ({ ...prevData, [id]: value }))
    }

    const handleCreateFormSubmit = (e) => {
        e.preventDefault()
        if (formData.roleCode && formData.roleName) {
            setRoleData([...roleData, { ...formData, id: Date.now(), status: "y" }])
            setFormData({ roleCode: "", roleName: "" })
            setShowForm(false)
        } else {
            alert("Please fill out all required fields.")
        }
    }

    const [pageInput, setPageInput] = useState("");
    const itemsPerPage = 5; // You can adjust this number as needed
    // ... existing state declarations ...

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to first page when search changes
    };

    const filteredRoleData = roleData.filter(role =>
        role.roleCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.roleName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredTotalPages = Math.ceil(filteredRoleData.length / itemsPerPage);

    const currentItems = filteredRoleData.slice(
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
        const maxVisiblePages = 5; // Maximum number of visible page links
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        const endPage = Math.min(filteredTotalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            pageNumbers.push(1);
            if (startPage > 2) pageNumbers.push("..."); // Add ellipsis
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        if (endPage < filteredTotalPages) {
            if (endPage < filteredTotalPages - 1) pageNumbers.push("..."); // Add ellipsis
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
                            <h4 className="card-title p-2">Role Master</h4>
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
<button type="button" className="btn btn-success me-2" onClick={() => setShowForm(true)}>
<i className="mdi mdi-plus"></i> Add
</button>
                                        <button type="button" className="btn btn-success me-2">
                                            <i className="mdi mdi-plus"></i> Show All
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
                                                <th>Role Code</th>
                                                <th>Role Name</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
        {currentItems.map((role) => (
            <tr key={role.id}>
                <td>{role.roleCode}</td>
                <td>{role.roleName}</td>
                <td>
                    <div className="form-check form-switch">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            checked={role.status === "y"}
                            onChange={() => handleSwitchChange(role.id, role.status === "y" ? "n" : "y")}
                            id={`switch-${role.id}`}
                        />
                        <label
                            className="form-check-label px-0"
                            htmlFor={`switch-${role.id}`}
                        >
                            {role.status === "y" ? 'Active' : 'Inactive'}
                        </label>
                    </div>
                </td>
                <td>
                    <button
                        className="btn btn-sm btn-success me-2"
                        onClick={() => handleRoleEdit(role)}
                        disabled={role.status !== "y"}
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
                Page {currentPage} of {filteredTotalPages} | Total Records: {filteredRoleData.length}
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
                                <form className="forms row" onSubmit={handleRoleSave}>
                                    <div className="form-group col-md-6">
                                        <label>Role Code <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="roleCode"
                                            name="roleCode"
                                            placeholder="Role Code"
                                            defaultValue={editingRole ? editingRole.roleCode : ""}
                                            onChange={(e) => setIsFormValid(e.target.value.trim() !== "")}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>Role Name <span className="text-danger">*</span></label>
                                        <input
                                                                                    type="text"
                                                                                    className="form-control"
                                                                                    id="roleName"
                                                                                    name="roleName"
                                                                                    placeholder="Role Name"
                                                                                    defaultValue={editingRole ? editingRole.roleName : ""}
                                                                                    required
                                                                                />
                                                                            </div>
                                                                            <div className="form-group col-md-12 d-flex justify-content-end">
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
                                                                                            Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{roleData.find(role => role.id === confirmDialog.roleId)?.roleName}</strong>?
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
                                        
                                        export default Rolemaster;