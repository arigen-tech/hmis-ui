import { useState } from "react";
import Popup from "../../../Components/popup";

const DepartmentMaster = () => {
    const [departments, setDepartments] = useState([
        { id: 1, departmentCode: "OPD", department: "Outpatient Department", departmentType: "Clinic", departmentNumber: "0601", division: "Medical", status: "y" },
        { id: 2, departmentCode: "RADIO", department: "Radiology", departmentType: "Diagnostics", departmentNumber: "0602", division: "Medical", status: "y" },
        { id: 3, departmentCode: "PHARM", department: "Pharmacy", departmentType: "Dispensary", departmentNumber: "0603", division: "Medical", status: "y" },
        { id: 4, departmentCode: "CSTR", department: "Central Store", departmentType: "Stores", departmentNumber: "0604", division: "Administration", status: "y" },
        { id: 5, departmentCode: "CHILD", department: "Children Ward", departmentType: "Ward", departmentNumber: "0605", division: "Medical", status: "y" },
    ]);

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, categoryId: null, newStatus: false });
    const [formData, setFormData] = useState({
        departmentCode: "",
        department: "",
        departmentType: "",
        departmentNumber: "",
        division: ""
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [filteredTotalPages, setFilteredTotalPages] = useState(1);
    const [totalFilteredItems, setTotalFilteredItems] = useState(0);
    const [searchType, setSearchType] = useState("code");
    const [selectedDivision, setSelectedDivision] = useState("");

    const handleSearch = () => {
        // Implement search logic based on searchType, searchQuery, and selectedDivision
        const filteredDepartments = departments.filter(dept => {
            const matchesSearchQuery = (searchType === "code" ? dept.departmentCode : dept.department).toLowerCase().includes(searchQuery.toLowerCase());
            const matchesDivision = selectedDivision ? dept.division === selectedDivision : true; // Check if division is selected
            return matchesSearchQuery && matchesDivision; // Return true if both conditions are met
        });
        setDepartments(filteredDepartments);
    };

    const filteredDepartments = departments.filter(dept =>
        dept.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.departmentCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleEdit = (dept) => {
        setEditingType(dept);
        setShowForm(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        const formElement = e.target;
        const updatedDepartment = {
            department: formElement.department.value,
            departmentType: formElement.departmentType.value,
            departmentNumber: formElement.departmentNumber.value,
            division: formElement.division.value
        };

        if (editingType) {
            setDepartments(departments.map(dept =>
                dept.id === editingType.id
                    ? { ...dept, ...updatedDepartment }
                    : dept
            ));
        } else {
            const newDept = {
                id: departments.length + 1,
                departmentCode: formData.departmentCode,
                ...updatedDepartment,
                status: "y"
            };
            setDepartments([...departments, newDept]);
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
            setDepartments((prevData) =>
                prevData.map((dept) =>
                    dept.id === confirmDialog.categoryId ? { ...dept, status: confirmDialog.newStatus } : dept
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
        if (formData.departmentCode && formData.department && formData.departmentType && formData.departmentNumber && formData.division) {
            setDepartments([...departments, { ...formData, id: Date.now(), status: "y" }]);
            setFormData({ departmentCode: "", department: "", departmentType: "", departmentNumber: "", division: "" });
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
                            <h4 className="card-title p-2">Department Master</h4>
                            <div className="d-flex justify-content-between align-items-spacearound mt-3">
                                <div className="d-flex align-items-center">
                                    <div className="me-3">
                                        <label>
                                            <input type="radio" name="searchType" value="code" />
                                            <span style={{ marginLeft: '5px' }}>Department Code</span>
                                        </label>
                                    </div>
                                    <div className="me-3">
                                        <label>
                                            <input type="radio" name="searchType" value="description" />
                                            <span style={{ marginLeft: '5px' }}>Department Name</span>
                                        </label>
                                    </div>
                                    <div className="d-flex align-items-center me-3">
                                        <label className="me-2">Division </label>
                                        <select
                                            className="form-control"
                                            id="division"
                                            required
                                            value={selectedDivision} // Bind the select value to the state
                                            onChange={(e) => setSelectedDivision(e.target.value)} // Update state on change
                                        >
                                            <option value="" disabled>Select</option>
                                            {departments.map(dept => (
                                                <option key={dept.id} value={dept.division}>{dept.division}</option> // Populate options from departments
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center">

                                    <button type="button" className="btn btn-success me-2" onClick={handleSearch}>
                                        <i className="mdi mdi-plus"></i> Search
                                    </button>
                                    <div className="ms-3">
                                        {!showForm ? (
                                            <button type="button" className="btn btn-success me-2">
                                                <i className="mdi mdi-plus"></i> Generate Report
                                            </button>
                                        ) : (
                                            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                                <i className="mdi mdi-arrow-left"></i> Back
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card-body">
                            {!showForm ? (
                                <div className="table-responsive packagelist">
                                    <table className="table table-bordered table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Department Code</th>
                                                <th>Department</th>
                                                <th>Department Type</th>
                                                <th>Department Number</th>
                                                <th>Division</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredDepartments.map((dept) => (
                                                <tr key={dept.id}>
                                                    <td>{dept.departmentCode}</td>
                                                    <td>{dept.department}</td>
                                                    <td>{dept.departmentType}</td>
                                                    <td>{dept.departmentNumber}</td>
                                                    <td>{dept.division}</td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={dept.status === "y"}
                                                                onChange={() => handleSwitchChange(dept.id, dept.status === "y" ? "n" : "y")}
                                                                id={`switch-${dept.id}`}
                                                            />
                                                            <label
                                                                className="form-check-label px-0"
                                                                htmlFor={`switch-${dept.id}`}
                                                                onClick={() => handleSwitchChange(dept.id, dept.status === "y" ? "n" : "y")}
                                                            >
                                                                {dept.status === "y" ? 'Active' : 'Deactivated'}
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
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="row">
                                        <div className="form-group col-md-4 mt-3">
                                            <label>Department Code <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="departmentCode"
                                                placeholder="Department Code"
                                                required
                                            />
                                        </div>
                                        <div className="form-group col-md-4 mt-3">
                                            <label>Department <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="department"
                                                placeholder="Department"
                                                required
                                            />
                                        </div>
                                        <div className="form-group col-md-4 mt-3">
                                            <label>Department Type <span className="text-danger">*</span></label>
                                            <div className="col-md-4">
                                                <select
                                                    className="form-control"
                                                    id="departmenttype"
                                                    required
                                                >
                                                    <option value="" disabled>Select</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="form-group col-md-4 mt-3">
                                            <label>Department Number <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="departmentNumber"
                                                placeholder="Department Number"
                                                required
                                            />
                                        </div>
                                        <div className="form-group col-md-4 mt-3">
                                            <label>Division <span className="text-danger">*</span></label>
                                            <div className="col-md-4">
                                                <select
                                                    className="form-control"
                                                    id="division"
                                                    required
                                                >
                                                    <option value="" disabled>Select</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="form-group col-md-6">
                                        <label>Department <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="department"
                                            name="department"
                                            placeholder="Department Name"
                                            defaultValue={editingType ? editingType.department : ""}
                                            onChange={(e) => setIsFormValid(e.target.value.trim() !== "")}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>Department Type <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="departmentType"
                                            name="departmentType"
                                            placeholder="Department Type"
                                            defaultValue={editingType ? editingType.departmentType : ""}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>Department Number <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="departmentNumber"
                                            name="departmentNumber"
                                            placeholder="Department Number"
                                            defaultValue={editingType ? editingType.departmentNumber : ""}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>Division <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="division"
                                            name="division"
                                            placeholder="Division"
                                            defaultValue={editingType ? editingType.division : ""}
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
                                                    Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{departments.find(dept => dept.id === confirmDialog.categoryId)?.department}</strong>?
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
                            {!showForm && (
                                <div className="d-flex justify-content-start mb-2 mt-3">
                                    <button type="button" className="btn btn-warning me-2" onClick={() => setShowForm(true)}>
                                        <i className="mdi mdi-plus"></i> Add
                                    </button>
                                    <button type="button" className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                                        <i className="mdi mdi-plus"></i> Update
                                    </button>
                                    <button type="button" className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                                        <i className="mdi mdi-plus"></i> Activate
                                    </button>
                                    <button type="button" className="btn btn-danger" onClick={() => {
                                        setFormData({ departmentCode: "", department: "", departmentType: "", departmentNumber: "", division: "" });
                                        setShowForm(false);
                                    }}>
                                        <i className="mdi mdi-refresh"></i> Reset
                                    </button>
                                </div>
                            )}
                            <div className="row mb-3">
                                <div className="col-md-4 d-flex align-items-center">
                                    <label htmlFor="changedBy" className="me-2 flex-shrink-0">Changed By</label>
                                    <input
                                        type="text"
                                        id="changedBy"
                                        className="form-control"
                                        placeholder="Enter Changed By"
                                        defaultValue="54321"
                                    />
                                </div>
                                <div className="col-md-4 d-flex align-items-center">
                                    <label htmlFor="changedDate" className="me-2 flex-shrink-0">Changed Date</label>
                                    <input
                                        type="date"
                                        id="changedDate"
                                        className="form-control"
                                        defaultValue="2025-02-28"
                                    />
                                </div>
                                <div className="col-md-4 d-flex align-items-center">
                                    <label htmlFor="changedTime" className="me-2 flex-shrink-0">Changed Time</label>
                                    <input
                                        type="time"
                                        id="changedTime"
                                        className="form-control"
                                        defaultValue="12:33"
                                    />
                                </div>
                            </div>
                            <nav className="d-flex justify-content-between align-items-center mt-3">
                                <div>
                                    <span>
                                        Page {currentPage} of {filteredTotalPages} | Total Records: {totalFilteredItems}
                                    </span>
                                </div>
                                <ul className="pagination mb-0">
                                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                        <button className="page-link" disabled>
                                            &laquo;
                                        </button>
                                    </li>
                                    {[...Array(filteredTotalPages)].map((_, index) => (
                                        <li
                                            className={`page-item ${currentPage === index + 1 ? "active" : ""}`}
                                            key={index}
                                        >
                                            <button className="page-link" disabled>
                                                {index + 1}
                                            </button>
                                        </li>
                                    ))}
                                    <li className={`page-item ${currentPage === filteredTotalPages ? "disabled" : ""}`}>
                                        <button className="page-link" disabled>
                                            &raquo;
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DepartmentMaster;