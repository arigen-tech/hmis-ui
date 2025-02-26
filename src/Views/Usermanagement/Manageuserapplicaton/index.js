import { useState } from "react"
import Popup from "../../../Components/popup";


const Manageuserapplication = () => {

    const [userApplicationData, setUserApplicationData] = useState([
        { id: 1, applicationCode: "Add Form/Reports", applicationName: "/user/addFormsAndReports", status: "y" },
        { id: 2, applicationCode: "Add legacy data", applicationName: "/master/legacyDataMaster", status: "n" },
        { id: 3, applicationCode: "Admin", applicationName: "#", status: "y" },
        { id: 4, applicationCode: "Approving auth- User type mapping", applicationName: "/master/approvingMappingMaster", status: "n" },
        { id: 5, applicationCode: "Assign Application To Template", applicationName: "/user/assignApplicationToTemplate", status: "n" },
    ]);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, applicationId: null, newStatus: false });

    const [formData, setFormData] = useState({
        applicationCode: "",
        applicationName: "",
    })
    const [searchQuery, setSearchQuery] = useState("");
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };
    const filteredUserApplicationData = userApplicationData.filter(application =>
        application.applicationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        application.applicationCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleEdit = (application) => {
        setEditingApplication(application);
        setShowForm(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        const formElement = e.target;
        const updatedApplicationName = formElement.applicationName.value;

        if (editingApplication) {
            setUserApplicationData(userApplicationData.map(application =>
                application.id === editingApplication.id
                    ? { ...application, applicationName: updatedApplicationName }
                    : application
            ));
        } else {
            const newApplication = {
                id: userApplicationData.length + 1,
                applicationCode: formData.applicationCode,
                applicationName: updatedApplicationName,
                status: "y"
            };
            setUserApplicationData([...userApplicationData, newApplication]);
        }

        setEditingApplication(null);
        setShowForm(false);
        showPopup("Changes saved successfully!", "success");
    };
    const [showForm, setShowForm] = useState(false)
    const [isFormValid, setIsFormValid] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [editingApplication, setEditingApplication] = useState(null);
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
    const [filteredTotalPages, setFilteredTotalPages] = useState(1);
    const [totalFilteredProducts, setTotalFilteredProducts] = useState(0);

    const handleInputChange = (e) => {
        const { id, value } = e.target
        setFormData((prevData) => ({ ...prevData, [id]: value }))
    }

    const handleCreateFormSubmit = (e) => {
        e.preventDefault()
        if (formData.applicationCode && formData.applicationName) {
            setUserApplicationData([...userApplicationData, { ...formData, id: Date.now(), status: "y" }])
            setFormData({ applicationCode: "", applicationName: "" })
            setShowForm(false)
        } else {
            alert("Please fill out all required fields.")
        }
    }

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
                                                <th>Application Code</th>
                                                <th>Application Name</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUserApplicationData.map((application) => (
                                                <tr key={application.id}>
                                                    <td>{application.applicationCode}</td>
                                                    <td>{application.applicationName}</td>
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
                                    id="Menu Name
"
                                    placeholder="Menu "
                                    required
                                />
                            </div>
                            <div className="form-group col-md-4 mt-3">
                                <label>URL <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="Url"
                                    placeholder="/url"
                                    required
                                />
                            </div>
                          </div>
                                    <nav className="d-flex justify-content-between align-items-center mt-3">
                                        <div>
                                            <span>
                                                Page {currentPage} of {filteredTotalPages} | Total Records: {totalFilteredProducts}
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

                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="form-group col-md-6">
                                        <label>Application Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="applicationName"
                                            name="applicationName"
                                            placeholder="Name"
                                            defaultValue={editingApplication ? editingApplication.applicationName : ""}
                                            onChange={(e) => setIsFormValid(e.target.value.trim() !== "")}
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
                                    <button type="button" className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                                        <i className="mdi mdi-plus"></i> Add
                                    </button>
                                    <button type="button" className="btn btn-warning" onClick={() => {
                                        setFormData({ applicationCode: "", applicationName: "" });
                                        setShowForm(false);
                                    }}>
                                        <i className="mdi mdi-refresh"></i> Reset
                                    </button>
                                </div>
                            )

                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Manageuserapplication;

