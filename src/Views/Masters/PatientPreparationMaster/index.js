import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";

const PatientPreparationMaster = () => {
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        description: "",
        type: "LAB" // Default value
    });
    const [showForm, setShowForm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingPreparation, setEditingPreparation] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [pageInput, setPageInput] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const typeOptions = ["LAB", "Radio", "Procedure"];

    const [preparationData, setPreparationData] = useState([
        { id: 1, code: "PREP001", name: "Fasting Required", description: "Patient must fast for 12 hours before test", type: "LAB", status: "y" },
        { id: 2, code: "PREP002", name: "Water Allowed", description: "Patient can drink water only", type: "LAB", status: "y" },
        { id: 3, code: "PREP003", name: "No Alcohol", description: "Avoid alcohol for 24 hours before test", type: "LAB", status: "y" },
        { id: 4, code: "PREP004", name: "Full Bladder", description: "Patient must have full bladder for ultrasound", type: "Radio", status: "y" },
        { id: 5, code: "PREP005", name: "Empty Stomach", description: "No food or drink after midnight", type: "Procedure", status: "y" },
        { id: 6, code: "PREP006", name: "Medication Hold", description: "Stop certain medications 48 hours before", type: "LAB", status: "y" },
        { id: 7, code: "PREP007", name: "Loose Clothing", description: "Wear loose comfortable clothing", type: "Radio", status: "y" },
        { id: 8, code: "PREP008", name: "No Jewelry", description: "Remove all metal jewelry", type: "Radio", status: "y" },
        { id: 9, code: "PREP009", name: "Consent Form", description: "Signed consent form required", type: "Procedure", status: "y" },
        { id: 10, code: "PREP010", name: "Morning Sample", description: "Sample must be collected in morning", type: "LAB", status: "y" },
        { id: 11, code: "PREP011", name: "No Smoking", description: "No smoking for 12 hours before test", type: "LAB", status: "y" },
        { id: 12, code: "PREP012", name: "Caffeine Free", description: "Avoid caffeine for 24 hours", type: "LAB", status: "y" },
        { id: 13, code: "PREP013", name: "Sedation Arrangement", description: "Arrange for transportation after sedation", type: "Procedure", status: "y" },
        { id: 14, code: "PREP014", name: "Clean Area", description: "Clean the area with soap and water", type: "Procedure", status: "y" },
        { id: 15, code: "PREP015", name: "No Lotions", description: "Do not apply lotions or creams", type: "Radio", status: "y" },
    ]);

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, preparationId: null, newStatus: false });
    const [totalFilteredProducts, setTotalFilteredProducts] = useState(0);

    const filteredPreparations = preparationData.filter(preparation =>
        preparation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preparation.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preparation.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to first page when search changes
    };

    const handleEdit = (preparation) => {
        setEditingPreparation(preparation);
        setFormData({
            code: preparation.code,
            name: preparation.name,
            description: preparation.description,
            type: preparation.type
        });
        setShowForm(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        if (editingPreparation) {
            setPreparationData(preparationData.map(preparation =>
                preparation.id === editingPreparation.id
                    ? { 
                        ...preparation, 
                        code: formData.code,
                        name: formData.name,
                        description: formData.description,
                        type: formData.type
                    }
                    : preparation
            ));
        } else {
            const newPreparation = {
                id: preparationData.length + 1,
                code: formData.code,
                name: formData.name,
                description: formData.description,
                type: formData.type,
                status: "y"
            };
            setPreparationData([...preparationData, newPreparation]);
        }

        setEditingPreparation(null);
        setFormData({
            code: "",
            name: "",
            description: "",
            type: "LAB"
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
                       updatedFormData.name.trim() !== "" && 
                       updatedFormData.type.trim() !== "";
        setIsFormValid(isValid);
    };

    const handleCreateFormSubmit = (e) => {
        e.preventDefault();
        if (formData.code && formData.name && formData.type) {
            setPreparationData([...preparationData, { ...formData, id: Date.now(), status: "y" }]);
            setFormData({ code: "", name: "", description: "", type: "LAB" });
            setShowForm(false);
        } else {
            alert("Please fill out all required fields.");
        }
    };

    const handleSwitchChange = (id, newStatus) => {
        setConfirmDialog({ isOpen: true, preparationId: id, newStatus });
    };

    const handleConfirm = (confirmed) => {
        if (confirmed && confirmDialog.preparationId !== null) {
            setPreparationData((prevData) =>
                prevData.map((preparation) =>
                    preparation.id === confirmDialog.preparationId ? { ...preparation, status: confirmDialog.newStatus } : preparation
                )
            );
        }
        setConfirmDialog({ isOpen: false, preparationId: null, newStatus: null });
    };

    const filteredTotalPages = Math.ceil(filteredPreparations.length / itemsPerPage);

    const currentItems = filteredPreparations.slice(
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
                            <h4 className="card-title">Patient Preparation Instructions</h4>
                            <div className="d-flex justify-content-between align-items-center">

                                {!showForm ? (
                                    <form className="d-inline-block searchform me-4" role="search">
                                        <div className="input-group searchinput">
                                            <input
                                                type="search"
                                                className="form-control"
                                                placeholder="Search Preparations"
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
                                                setEditingPreparation(null);
                                                setFormData({
                                                    code: "",
                                                    name: "",
                                                    description: "",
                                                    type: "LAB"
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
                                                <th>Type</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((preparation) => (
                                                <tr key={preparation.id}>
                                                    <td>{preparation.code}</td>
                                                    <td>{preparation.name}</td>
                                                    <td>{preparation.description}</td>
                                                    <td>{preparation.type}</td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={preparation.status === "y"}
                                                                onChange={() => handleSwitchChange(preparation.id, preparation.status === "y" ? "n" : "y")}
                                                                id={`switch-${preparation.id}`}
                                                            />
                                                            <label
                                                                className="form-check-label px-0"
                                                                htmlFor={`switch-${preparation.id}`}
                                                            >
                                                                {preparation.status === "y" ? 'Active' : 'Deactive'}
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-success me-2"
                                                            onClick={() => handleEdit(preparation)}
                                                            disabled={preparation.status !== "y"}
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
                                                Page {currentPage} of {filteredTotalPages} | Total Records: {filteredPreparations.length}
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
                                            placeholder="Preparation Code"
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
                                            placeholder="Preparation Name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-4">
                                        <label>Type <span className="text-danger">*</span></label>
                                        <select
                                            className="form-select"
                                            id="type"
                                            value={formData.type}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            {typeOptions.map((option) => (
                                                <option key={option} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group col-md-12">
                                        <label>Description</label>
                                        <textarea
                                            className="form-control"
                                            id="description"
                                            placeholder="Preparation Description"
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
                                                    Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{preparationData.find(preparation => preparation.id === confirmDialog.preparationId)?.name}</strong>?
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

export default PatientPreparationMaster;