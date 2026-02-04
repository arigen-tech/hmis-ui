import { useState, useEffect } from "react"
import Popup from "../../../Components/popup";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";


const BloodDonationStatusMaster = () => {
    const [formData, setFormData] = useState({
        statusName: "",
        description: "",
    });
    const [showForm, setShowForm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingDonationStatus, setEditingDonationStatus] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [pageInput, setPageInput] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [donationStatusData, setDonationStatusData] = useState([
        { id: 1, statusName: "Pending", description: "Donation request pending", status: "y" },
        { id: 2, statusName: "Scheduled", description: "Donation appointment scheduled", status: "y" },
        { id: 3, statusName: "In Progress", description: "Donation in progress", status: "y" },
        { id: 4, statusName: "Completed", description: "Donation successfully completed", status: "y" },
        { id: 5, statusName: "Cancelled", description: "Donation cancelled", status: "y" },
        { id: 6, statusName: "Deferred", description: "Donor temporarily deferred", status: "y" },
        { id: 7, statusName: "Rejected", description: "Donation rejected", status: "y" },
    ]);

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, donationStatusId: null, newStatus: false });


    const filteredDonationStatuses = donationStatusData.filter(donationStatus =>
        donationStatus.statusName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (donationStatus.description && donationStatus.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleEdit = (donationStatus) => {
        setEditingDonationStatus(donationStatus);
        setFormData({
            statusName: donationStatus.statusName,
            description: donationStatus.description || "",
        });
        setShowForm(true);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);


    const handleSave = (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        const updatedStatusName = e.target.elements.statusName.value;
        const updatedDescription = e.target.elements.description.value;

        if (editingDonationStatus) {
            setDonationStatusData(donationStatusData.map(donationStatus =>
                donationStatus.id === editingDonationStatus.id
                    ? { ...donationStatus, statusName: updatedStatusName, description: updatedDescription }
                    : donationStatus
            ));
        } else {
            const newDonationStatus = {
                id: donationStatusData.length + 1,
                statusName: updatedStatusName,
                description: updatedDescription,
                status: "y"
            };
            setDonationStatusData([...donationStatusData, newDonationStatus]);
        }

        setEditingDonationStatus(null);
        setShowForm(false);
        setFormData({ statusName: "", description: "" });
        setIsFormValid(false);
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
        setFormData((prevData) => ({ ...prevData, [id]: value }));

        const isStatusNameValid = id === "statusName" ? value.trim() !== "" : formData.statusName.trim() !== "";
        const isDescriptionValid = true; // Description is optional

        setIsFormValid(isStatusNameValid && isDescriptionValid);
    };

    const handleCreateFormSubmit = (e) => {
        e.preventDefault()
        if (formData.statusName) {
            setDonationStatusData([...donationStatusData, { ...formData, id: Date.now(), status: "y" }])
            setFormData({ statusName: "", description: "" })
            setShowForm(false)
        } else {
            alert("Please fill out all required fields.")
        }
    }

    const handleSwitchChange = (id, newStatus) => {
        setConfirmDialog({ isOpen: true, donationStatusId: id, newStatus });
    };

    const handleConfirm = (confirmed) => {
        if (confirmed && confirmDialog.donationStatusId !== null) {
            setDonationStatusData((prevData) =>
                prevData.map((donationStatus) =>
                    donationStatus.id === confirmDialog.donationStatusId ? { ...donationStatus, status: confirmDialog.newStatus } : donationStatus
                )
            );
        }
        setConfirmDialog({ isOpen: false, donationStatusId: null, newStatus: null });
    };



    const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
    const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
    const currentItems = filteredDonationStatuses.slice(indexOfFirst, indexOfLast);

    

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title">Blood Donation Status Master</h4>
                            <div className="d-flex justify-content-between align-items-center">

                                {!showForm ? (
                                    <form className="d-inline-block searchform me-4" role="search">
                                        <div className="input-group searchinput">
                                            <input
                                                type="search"
                                                className="form-control"
                                                placeholder="Search Donation Status"
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
                                                setShowForm(true); 
                                                setFormData({ statusName: "", description: "" }); 
                                                setEditingDonationStatus(null);
                                            }}>
                                                <i className="mdi mdi-plus"></i> Add
                                            </button>
                                            <button type="button" className="btn btn-success me-2 flex-shrink-0">
                                                <i className="mdi mdi-plus"></i> Show All
                                            </button>
                                        </>
                                    ) : (
                                        <button type="button" className="btn btn-secondary" onClick={() => {
                                            setShowForm(false);
                                            setEditingDonationStatus(null);
                                            setFormData({ statusName: "", description: "" });
                                        }}>
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
                                                <th>Status Name</th>
                                                <th>Description</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((donationStatus) => (
                                                <tr key={donationStatus.id}>
                                                    <td>{donationStatus.statusName}</td>
                                                    <td>{donationStatus.description}</td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={donationStatus.status === "y"}
                                                                onChange={() => handleSwitchChange(donationStatus.id, donationStatus.status === "y" ? "n" : "y")}
                                                                id={`switch-${donationStatus.id}`}
                                                            />
                                                            <label
                                                                className="form-check-label px-0"
                                                                htmlFor={`switch-${donationStatus.id}`}
                                                            >
                                                                {donationStatus.status === "y" ? 'Active' : 'Inactive'}
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-success me-2"
                                                            onClick={() => handleEdit(donationStatus)}
                                                            disabled={donationStatus.status !== "y"}
                                                        >
                                                            <i className="fa fa-pencil"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {filteredDonationStatuses.length > 0 && (
                                        <Pagination
                                            totalItems={filteredDonationStatuses.length}
                                            itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                            currentPage={currentPage}
                                            onPageChange={setCurrentPage}
                                        />
                                    )}
                                 
                                </div>
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="form-group col-md-4">
                                        <label>Status Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="statusName"
                                            placeholder="Enter status name"
                                            value={formData.statusName}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-4">
                                        <label>Description</label>
                                        <input
                                            className="form-control"
                                            id="description"
                                            placeholder="Enter description (optional)"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows="3"
                                        />
                                    </div>
                                    <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                                        <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                                            {editingDonationStatus ? 'Update' : 'Save'}
                                        </button>
                                        <button type="button" className="btn btn-danger" onClick={() => {
                                            setShowForm(false);
                                            setEditingDonationStatus(null);
                                            setFormData({ statusName: "", description: "" });
                                        }}>
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
                                                    Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{donationStatusData.find(donationStatus => donationStatus.id === confirmDialog.donationStatusId)?.statusName}</strong>?
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

export default BloodDonationStatusMaster;