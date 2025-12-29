import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";

const LabResultAmendment = () => {
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        description: "",
    });
    const [showForm, setShowForm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingAmendmentType, setEditingAmendmentType] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [pageInput, setPageInput] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [amendmentTypeData, setAmendmentTypeData] = useState([
        { id: 1, code: "AMT001", name: "Typographical Error", description: "Correction of spelling or typing mistakes in results", status: "y" },
        { id: 2, code: "AMT002", name: "Unit Correction", description: "Correction of measurement units (e.g., mg to g)", status: "y" },
        { id: 3, code: "AMT003", name: "Reference Range Update", description: "Update to normal reference ranges", status: "y" },
        { id: 4, code: "AMT004", name: "Methodology Change", description: "Change due to different testing methodology", status: "y" },
        { id: 5, code: "AMT005", name: "Clarification Add", description: "Adding explanatory notes to results", status: "y" },
        { id: 6, code: "AMT006", name: "Critical Value Correction", description: "Correction of critical/panic values", status: "y" },
        { id: 7, code: "AMT007", name: "Patient ID Correction", description: "Correction of patient identification details", status: "y" },
        { id: 8, code: "AMT008", name: "Date/Time Correction", description: "Correction of collection or reporting dates", status: "y" },
        { id: 9, code: "AMT009", name: "Test Name Update", description: "Correction of test procedure names", status: "y" },
        { id: 10, code: "AMT010", name: "Result Value Update", description: "Update of actual test result values", status: "y" },
        { id: 11, code: "AMT011", name: "Interpretation Update", description: "Update of result interpretation comments", status: "y" },
        { id: 12, code: "AMT012", name: "Approval Status Change", description: "Change in approval/review status", status: "y" },
        { id: 13, code: "AMT013", name: "QC Failure Correction", description: "Correction due to quality control issues", status: "y" },
        { id: 14, code: "AMT014", name: "Instrument Error", description: "Correction due to instrument malfunction", status: "y" },
        { id: 15, code: "AMT015", name: "Sample Mix-up", description: "Correction due to sample identification error", status: "y" },
        { id: 16, code: "AMT016", name: "Addendum", description: "Adding supplementary information to results", status: "y" },
        { id: 17, code: "AMT017", name: "Verification Update", description: "Update after secondary verification", status: "y" },
        { id: 18, code: "AMT018", name: "Technical Correction", description: "Technical corrections by lab technician", status: "y" },
        { id: 19, code: "AMT019", name: "Clinical Correlation", description: "Update based on clinical findings", status: "y" },
        { id: 20, code: "AMT020", name: "Regulatory Compliance", description: "Changes for regulatory compliance", status: "y" },
    ]);

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, amendmentTypeId: null, newStatus: false });
    const [totalFilteredProducts, setTotalFilteredProducts] = useState(0);

    const filteredAmendmentTypes = amendmentTypeData.filter(amendmentType =>
        amendmentType.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        amendmentType.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        amendmentType.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to first page when search changes
    };

    const handleEdit = (amendmentType) => {
        setEditingAmendmentType(amendmentType);
        setFormData({
            code: amendmentType.code,
            name: amendmentType.name,
            description: amendmentType.description,
        });
        setShowForm(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        if (editingAmendmentType) {
            setAmendmentTypeData(amendmentTypeData.map(amendmentType =>
                amendmentType.id === editingAmendmentType.id
                    ? { 
                        ...amendmentType, 
                        code: formData.code,
                        name: formData.name,
                        description: formData.description,
                    }
                    : amendmentType
            ));
        } else {
            const newAmendmentType = {
                id: amendmentTypeData.length + 1,
                code: formData.code,
                name: formData.name,
                description: formData.description,
                status: "y"
            };
            setAmendmentTypeData([...amendmentTypeData, newAmendmentType]);
        }

        setEditingAmendmentType(null);
        setFormData({
            code: "",
            name: "",
            description: "",
        });
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

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        const updatedFormData = { ...formData, [id]: value };
        setFormData(updatedFormData);
        
        // Check if all required fields are filled
        const isValid = updatedFormData.code.trim() !== "" && 
                       updatedFormData.name.trim() !== "";
        setIsFormValid(isValid);
    };

    const handleCreateFormSubmit = (e) => {
        e.preventDefault();
        if (formData.code && formData.name) {
            setAmendmentTypeData([...amendmentTypeData, { ...formData, id: Date.now(), status: "y" }]);
            setFormData({ code: "", name: "", description: "" });
            setShowForm(false);
        } else {
            alert("Please fill out all required fields.");
        }
    };

    const handleSwitchChange = (id, newStatus) => {
        setConfirmDialog({ isOpen: true, amendmentTypeId: id, newStatus });
    };

    const handleConfirm = (confirmed) => {
        if (confirmed && confirmDialog.amendmentTypeId !== null) {
            setAmendmentTypeData((prevData) =>
                prevData.map((amendmentType) =>
                    amendmentType.id === confirmDialog.amendmentTypeId ? { ...amendmentType, status: confirmDialog.newStatus } : amendmentType
                )
            );
        }
        setConfirmDialog({ isOpen: false, amendmentTypeId: null, newStatus: null });
    };

    const filteredTotalPages = Math.ceil(filteredAmendmentTypes.length / itemsPerPage);

    const currentItems = filteredAmendmentTypes.slice(
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
                            <h4 className="card-title">Lab Result Amendment Type Master</h4>
                            <div className="d-flex justify-content-between align-items-center">

                                {!showForm ? (
                                    <form className="d-inline-block searchform me-4" role="search">
                                        <div className="input-group searchinput">
                                            <input
                                                type="search"
                                                className="form-control"
                                                placeholder="Search Amendment Types"
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
                                            <button type="button" className="btn btn-success me-2" onClick={() => {
                                                setEditingAmendmentType(null);
                                                setFormData({
                                                    code: "",
                                                    name: "",
                                                    description: "",
                                                });
                                                setIsFormValid(false);
                                                setShowForm(true);
                                            }}>
                                                <i className="mdi mdi-plus"></i> Add
                                            </button>
                                            <button type="button" className="btn btn-success me-2" onClick={() => setSearchQuery("")}>
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
                                                <th>Code</th>
                                                <th>Name</th>
                                                <th>Description</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((amendmentType) => (
                                                <tr key={amendmentType.id}>
                                                    <td>{amendmentType.code}</td>
                                                    <td>{amendmentType.name}</td>
                                                    <td>{amendmentType.description}</td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={amendmentType.status === "y"}
                                                                onChange={() => handleSwitchChange(amendmentType.id, amendmentType.status === "y" ? "n" : "y")}
                                                                id={`switch-${amendmentType.id}`}
                                                            />
                                                            <label
                                                                className="form-check-label px-0"
                                                                htmlFor={`switch-${amendmentType.id}`}
                                                            >
                                                                {amendmentType.status === "y" ? 'Active' : 'Deactive'}
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-success me-2"
                                                            onClick={() => handleEdit(amendmentType)}
                                                            disabled={amendmentType.status !== "y"}
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
                                                Page {currentPage} of {filteredTotalPages} | Total Records: {filteredAmendmentTypes.length}
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
                                        <label>Code <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="code"
                                            placeholder="Amendment Type Code"
                                            value={formData.code}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-4">
                                        <label>Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="name"
                                            placeholder="Amendment Type Name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-12">
                                        <label>Description</label>
                                        <textarea
                                            className="form-control"
                                            id="description"
                                            placeholder="Amendment Type Description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows="3"
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
                            {showModal && (
                                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                                    <div className="modal-dialog">
                                        <div className="modal-content">
                                            <div className="modal-header">
                                                <h1 className="modal-title fs-5" id="staticBackdropLabel">Reports</h1>
                                                <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                                            </div>
                                            <div className="modal-body">
                                                {/* Your modal content goes here */}
                                                <p>Reports functionality would go here.</p>
                                            </div>
                                            <div className="modal-footer">
                                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                                                <button type="button" className="btn btn-primary">Generate Report</button>
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
                                                    Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{amendmentTypeData.find(amendmentType => amendmentType.id === confirmDialog.amendmentTypeId)?.name}</strong>?
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

export default LabResultAmendment;