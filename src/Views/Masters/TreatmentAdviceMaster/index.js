import { useState } from "react";
import Popup from "../../../Components/popup";

const TreatmentAdviceMaster = () => {
    const [formData, setFormData] = useState({
        treatmentName: "",
        department: "General",
        status: "y"
    });
    const [showForm, setShowForm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingTreatment, setEditingTreatment] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [pageInput, setPageInput] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [treatmentData, setTreatmentData] = useState([
        { id: 1, treatmentName: "Paracetamol", department: "General Medicine", status: "y" },
        { id: 2, treatmentName: "Insulin Therapy", department: "Endocrinology", status: "y" },
        { id: 3, treatmentName: "Physiotherapy", department: "Orthopedics", status: "y" },
        { id: 4, treatmentName: "Chemotherapy", department: "Oncology", status: "y" },
        { id: 5, treatmentName: "Dialysis", department: "Nephrology", status: "y" },
    ]);

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, treatmentId: null, newStatus: false });

    const filteredTreatments = treatmentData.filter(treatment =>
        treatment.treatmentName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleEdit = (treatment) => {
        setEditingTreatment(treatment);
        setFormData(treatment);
        setShowForm(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        const updatedTreatmentName = e.target.elements.treatmentName.value;
        const updatedDepartment = e.target.elements.department.value;

        if (editingTreatment) {
            setTreatmentData(treatmentData.map(treatment =>
                treatment.id === editingTreatment.id
                    ? { ...treatment, treatmentName: updatedTreatmentName, department: updatedDepartment }
                    : treatment
            ));
        } else {
            const newTreatment = {
                id: treatmentData.length + 1,
                treatmentName: updatedTreatmentName,
                department: updatedDepartment,
                status: "y"
            };
            setTreatmentData([...treatmentData, newTreatment]);
        }

        setEditingTreatment(null);
        setShowForm(false);
        setIsFormValid(false);
        showPopup("Treatment advice saved successfully!", "success");
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
        setFormData((prevData) => ({ ...prevData, [id]: value }));

        const isTreatmentNameValid = id === "treatmentName" ? value.trim() !== "" : formData.treatmentName.trim() !== "";
        const isDepartmentValid = id === "department" ? value.trim() !== "" : formData.department.trim() !== "";

        setIsFormValid(isTreatmentNameValid && isDepartmentValid);
    };

    const handleSwitchChange = (id, newStatus) => {
        setConfirmDialog({ isOpen: true, treatmentId: id, newStatus });
    };

    const handleConfirm = (confirmed) => {
        if (confirmed && confirmDialog.treatmentId !== null) {
            setTreatmentData((prevData) =>
                prevData.map((treatment) =>
                    treatment.id === confirmDialog.treatmentId ? { ...treatment, status: confirmDialog.newStatus } : treatment
                )
            );
        }
        setConfirmDialog({ isOpen: false, treatmentId: null, newStatus: null });
    };

    const filteredTotalPages = Math.ceil(filteredTreatments.length / itemsPerPage);

    const currentItems = filteredTreatments.slice(
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
                            <h4 className="card-title">Treatment Advice Master</h4>
                            <div className="d-flex justify-content-between align-items-center">
                                {!showForm ? (
                                    <form className="d-inline-block searchform me-4" role="search">
                                        <div className="input-group searchinput">
                                            <input
                                                type="search"
                                                className="form-control"
                                                placeholder="Search Treatments"
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
                                            <button type="button" className="btn btn-success me-2" onClick={() => { setShowForm(true); setFormData({ treatmentName: "", department: "General", status: "y" }); }}>
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
                                                <th>Treatment Name</th>
                                                <th>Department</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((treatment) => (
                                                <tr key={treatment.id}>
                                                    <td>{treatment.treatmentName}</td>
                                                    <td>{treatment.department}</td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={treatment.status === "y"}
                                                                onChange={() => handleSwitchChange(treatment.id, treatment.status === "y" ? "n" : "y")}
                                                                id={`switch-${treatment.id}`}
                                                            />
                                                            <label
                                                                className="form-check-label px-0"
                                                                htmlFor={`switch-${treatment.id}`}
                                                            >
                                                                {treatment.status === "y" ? 'Active' : 'Inactive'}
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-success me-2"
                                                            onClick={() => handleEdit(treatment)}
                                                            disabled={treatment.status !== "y"}
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
                                                Page {currentPage} of {filteredTotalPages} | Total Records: {filteredTreatments.length}
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
                                    <div className="form-group col-md-4">
                                        <label>Treatment Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="treatmentName"
                                            placeholder="Treatment Name"
                                            value={formData.treatmentName}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-4">
                                        <label>Department <span className="text-danger">*</span></label>
                                        <select
                                            className="form-control"
                                            id="department"
                                            value={formData.department}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="General">General</option>
                                            <option value="Endocrinology">Endocrinology</option>
                                            <option value="Orthopedics">Orthopedics</option>
                                            <option value="Oncology">Oncology</option>
                                            <option value="Nephrology">Nephrology</option>
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
                                                <h1 className="modal-title fs-5" id="staticBackdropLabel">Reports</h1>
                                                <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                                            </div>
                                            <div className="modal-body">
                                                ...
                                            </div>
                                            <div className="modal-footer">
                                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                                                <button type="button" className="btn btn-primary">Generate</button>
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
                                                    Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{treatmentData.find(treatment => treatment.id === confirmDialog.treatmentId)?.treatmentName}</strong>?
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
    );
};

export default TreatmentAdviceMaster;