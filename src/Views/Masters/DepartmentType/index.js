import { useState } from "react";
import Popup from "../../../Components/popup";

const Departmenttype = () => {
    const [departmentTypes, setDepartmentTypes] = useState([
        { id: 1, departmentTypeCode: "CHR", departmentTypeName: "Cashier", status: "y" },
        { id: 2, departmentTypeCode: "CSTR", departmentTypeName: "Central Store", status: "y" },
        { id: 3, departmentTypeCode: "DIAG", departmentTypeName: "Diagnostics", status: "y" },
        { id: 4, departmentTypeCode: "MNT", departmentTypeName: "Maintenance", status: "y" },
        { id: 5, departmentTypeCode: "OT", departmentTypeName: "Operation Theatre", status: "y" },
    ]);


    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageInput, setPageInput] = useState("");
    const itemsPerPage = 4;
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, categoryId: null, newStatus: false });
    const [popupMessage, setPopupMessage] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [isFormValid, setIsFormValid] = useState(false);
    const [formData, setFormData] = useState({
        departmentTypeCode: "",
        departmentTypeName: "",
    });
    const [totalFilteredItems, setTotalFilteredItems] = useState(0);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const filteredDepartmentTypes = departmentTypes.filter(type =>
        type.departmentTypeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        type.departmentTypeCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

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


    const handleEdit = (type) => {
        setEditingType(type);
        setShowForm(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        const formElement = e.target;
        const updatedDepartmentTypeName = formElement.departmentTypeName.value;
        const updatedDepartmentTypeCode = formElement.departmentTypeCode.value;

        if (editingType) {
            setDepartmentTypes(departmentTypes.map(type =>
                type.id === editingType.id
                    ? { ...type, departmentTypeName: updatedDepartmentTypeName, departmentTypeCode: updatedDepartmentTypeCode }
                    : type
            ));
        } else {
            const newType = {
                id: departmentTypes.length + 1,
                departmentTypeCode: updatedDepartmentTypeCode,
                departmentTypeName: updatedDepartmentTypeName,
                status: "y"
            };
            setDepartmentTypes([...departmentTypes, newType]);
        }

        setEditingType(null);
        setShowForm(false);
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

    const handleSwitchChange = (id, newStatus) => {
        setConfirmDialog({ isOpen: true, categoryId: id, newStatus });
    };

    const handleConfirm = (confirmed) => {
        if (confirmed && confirmDialog.categoryId !== null) {
            setDepartmentTypes((prevData) =>
                prevData.map((type) =>
                    type.id === confirmDialog.categoryId ? { ...type, status: confirmDialog.newStatus } : type
                )
            );
        }
        setConfirmDialog({ isOpen: false, categoryId: null, newStatus: null });
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [id]: value }));
    };

    const handleCreateFormSubmit = (e) => {
        e.preventDefault();
        if (formData.departmentTypeCode && formData.departmentTypeName) {
            setDepartmentTypes([...departmentTypes, { ...formData, id: Date.now(), status: "y" }]);
            setFormData({ departmentTypeCode: "", departmentTypeName: "" });
            setShowForm(false);
        } else {
            alert("Please fill out all required fields.");
        }
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
                                                <input type="radio" name="searchType" value="code" />
                                                <span style={{ marginLeft: '5px' }}>Department Type Code</span>
                                            </label>
                                        </div>
                                        <div className="me-3">
                                            <label>
                                                <input type="radio" name="searchType" value="description" />
                                                <span style={{ marginLeft: '5px' }}>Department Type Name</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center">
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
                                        <button type="button" className="btn btn-success me-2">
                                            <i className="mdi mdi-plus"></i> Generate Report
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
                                                <th>Department Type Code</th>
                                                <th>Department Type Name</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((type) => (
                                                <tr key={type.id}>
                                                    <td>{type.departmentTypeCode}</td>
                                                    <td>{type.departmentTypeName}</td>
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
                                                                onClick={() => handleSwitchChange(type.id, type.status === "y" ? "n" : "y")}
                                                            >
                                                                {type.status === "y" ? 'Active' : 'Deactivated'}
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
                                        className="btn btn-secondary" // Use btn-sm for a smaller button and float-end to align it to the right
                                        onClick={() => setShowForm(false)} // Set showForm to false to close the form
                                    >
                                        <i className="mdi mdi-arrow-left"></i> Back
                                    </button>
                                </div>
                                    <div className="form-group col-md-6">
                                        <label>Department Type Code <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="departmentTypeCode"
                                            name="departmentTypeCode"
                                            placeholder="Code"
                                            defaultValue={editingType ? editingType.departmentTypeCode : ""}
                                            onChange={(e) => setIsFormValid(e.target.value.trim() !== "")}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>Department Type Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="departmentTypeName"
                                            name="departmentTypeName"
                                            placeholder="Name"
                                            defaultValue={editingType ? editingType.departmentTypeName : ""}
                                            onChange={(e) => setIsFormValid(e.target.value.trim() !== "")}
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
                                                    Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{departmentTypes.find(type => type.id === confirmDialog.categoryId)?.departmentTypeName}</strong>?
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Departmenttype;