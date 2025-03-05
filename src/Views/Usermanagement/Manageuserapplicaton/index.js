import { useState } from "react"
import Popup from "../../../Components/popup";


const Manageuserapplication = () => {

    const [userApplicationData, setUserApplicationData] = useState([
        { id: 1, MenuName: "Add Form/Reports", url: "/user/addFormsAndReports", status: "y" },
        { id: 2, MenuName: "Add legacy data", url: "/master/legacyDataMaster", status: "n" },
        { id: 3, MenuName: "Admin", url: "#", status: "y" },
        { id: 4, MenuName: "Approving auth- User type mapping", url: "/master/approvingMappingMaster", status: "n" },

    ]);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, applicationId: null, newStatus: false });

    const [formData, setFormData] = useState({
        MenuName: "",
        applicationName: "",
    })
    const [searchQuery, setSearchQuery] = useState("");
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to first page when search changes
    };
    const filteredUserApplicationData = userApplicationData.filter(application =>
        application.MenuName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        application.url.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleEdit = (application) => {
        setEditingApplication(application);
        setFormData({ 
            MenuName: application.MenuName, 
            applicationName: application.url 
        });
        setShowForm(true);
    };
    const handleSave = (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        const updatedData = {
            MenuName: formData.MenuName,
            url: formData.applicationName
        };

        setUserApplicationData(userApplicationData.map(application =>
            application.id === editingApplication.id
                ? { ...application, ...updatedData }
                : application
        ));

        setEditingApplication(null);
        setShowForm(false);
        showPopup("Changes saved successfully!", "success");
    };
    const [showForm, setShowForm] = useState(false)
    const [isFormValid, setIsFormValid] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [editingApplication, setEditingApplication] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [pageInput, setPageInput] = useState("");
    const itemsPerPage = 5;

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
        setConfirmDialog({ isOpen: true, applicationId: id, newStatus });

    };
    const handleConfirm = (confirmed) => {
        if (confirmed && confirmDialog.applicationId !== null) {
            setUserApplicationData((prevData) =>
                prevData.map((application) =>
                    application.id === confirmDialog.applicationId ? { ...application, status: confirmDialog.newStatus } : application
                )
            );
        }
        setConfirmDialog({ isOpen: false, applicationId: null, newStatus: null });
    };
    const [currentPage, setCurrentPage] = useState(1);
    const filteredTotalPages = Math.ceil(filteredUserApplicationData.length / itemsPerPage);
    const [totalFilteredProducts, setTotalFilteredProducts] = useState(0);

    const handleInputChange = (e) => {
        const { id, value } = e.target
        setFormData((prevData) => ({ ...prevData, [id]: value }))
    }

    const handleCreateFormSubmit = (e) => {
        e.preventDefault();
        if (formData.MenuName && formData.applicationName) {
            setUserApplicationData([...userApplicationData, {
                id: Date.now(),
                MenuName: formData.MenuName,
                url: formData.applicationName,
                status: "y"
            }]);
            setFormData({ MenuName: "", applicationName: "" });
        } else {
            showPopup("Please fill out all required fields.", "warning");
        }
    }

    const currentItems = filteredUserApplicationData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageNavigation = () => {
        const pageNumber = parseInt(pageInput, 10);
        if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
            setCurrentPage(pageNumber);
        } else {
            showPopup("Please enter a valid page number.", "warning");
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
                            <h4 className="card-title p-2">Manage Menu</h4>
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

                                        <button type="button" className="btn btn-success me-2">
                                            <i className="mdi mdi-plus"></i> Show All
                                        </button>


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
                                                <th>Menu Name</th>
                                                <th>URL</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((application) => (
                                                <tr key={application.id}>
                                                    <td>{application.MenuName}</td>
                                                    <td>{application.url}</td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={application.status === "y"}
                                                                onChange={() => handleSwitchChange(application.id, application.status === "y" ? "n" : "y")}
                                                                id={`switch-${application.id}`}
                                                            />
                                                            <label
                                                                className="form-check-label px-0"
                                                                htmlFor={`switch-${application.id}`}
                                                                onClick={() => handleSwitchChange(application.id, application.status === "y" ? "n" : "y")}
                                                            >
                                                                {application.status === "y" ? 'Active' : 'Deactivated'}
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-success me-2"
                                                            onClick={() => handleEdit(application)}
                                                            disabled={application.status !== "y"}
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
                                            <label>Menu Name
                                                <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="MenuName"
                                                placeholder="Menu Name"
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="form-group col-md-4 mt-3">
                                            <label>URL <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="applicationName"
                                                placeholder="URL"
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                </div>

                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="form-group col-md-6">
                                        <label>Menu Name<span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="MenuName"
                                            name="MenuName"
                                            placeholder="Menu Name"
                                            value={formData.MenuName}
                                            onChange={(e) => {
                                                setFormData(prev => ({...prev, MenuName: e.target.value}));
                                                setIsFormValid(e.target.value.trim() !== "");
                                            }}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>URL<span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="applicationName"
                                            name="applicationName"
                                            placeholder="URL"
                                            value={formData.applicationName}
                                            onChange={(e) => {
                                                setFormData(prev => ({...prev, applicationName: e.target.value}));
                                                setIsFormValid(e.target.value.trim() !== "");
                                            }}
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
                                                    Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{userApplicationData.find(application => application.id === confirmDialog.applicationId)?.applicationName}</strong>?
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
                                <div className="d-flex justify-content-end mt-4">
                                    <button type="button" className="btn btn-success me-2" onClick={handleCreateFormSubmit}>
                                        <i className="mdi mdi-plus"></i> Add
                                    </button>

                                </div>
                            )

                            }
                            <nav className="d-flex justify-content-between align-items-center mt-3">
                                <div>
                                    <span>
                                        Page {currentPage} of {filteredTotalPages} | Total Records: {filteredUserApplicationData.length}
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
    )
}

export default Manageuserapplication;

