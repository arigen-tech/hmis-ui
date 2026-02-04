import { useState, useEffect } from "react"
import Popup from "../../../Components/popup";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";


const BloodFailureReasonMaster = () => {
    const [formData, setFormData] = useState({failureReasonName: "", description: ""});
    const [showForm, setShowForm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingFailureReason, setEditingFailureReason] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [pageInput, setPageInput] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [failureReasonData, setFailureReasonData] = useState([
        { id: 1, failureReasonName: "Hemolysis", description: "Blood sample hemolyzed during collection", status: "y" },
        { id: 2, failureReasonName: "Clotted", description: "Blood sample clotted", status: "y" },
        { id: 3, failureReasonName: "Insufficient Volume", description: "Insufficient blood volume", status: "y" },
        { id: 4, failureReasonName: "Wrong Container", description: "Wrong collection container used", status: "y" },
        { id: 5, failureReasonName: "Expired", description: "Sample collected beyond validity", status: "y" },
        { id: 6, failureReasonName: "Improper Labeling", description: "Sample not properly labeled", status: "y" },
    ]);

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, failureReasonId: null, newStatus: false });


    const filteredFailureReasons = failureReasonData.filter(failureReason =>
        failureReason.failureReasonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        failureReason.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleEdit = (failureReason) => {
        setEditingFailureReason(failureReason);
        setFormData({failureReasonName: failureReason.failureReasonName, description: failureReason.description || "" });
        setShowForm(true);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);


    const handleSave = (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        const updatedFailureReasonName = e.target.elements.failureReasonName.value;
        const updatedDescription = e.target.elements.description.value;

        if (editingFailureReason) {
            setFailureReasonData(failureReasonData.map(failureReason =>
                failureReason.id === editingFailureReason.id
                    ? { ...failureReason, failureReasonName: updatedFailureReasonName, description: updatedDescription }
                    : failureReason
            ));
        } else {
            const newFailureReason = {
                id: failureReasonData.length + 1,
                failureReasonName: updatedFailureReasonName,
                description: updatedDescription,
                status: "y"
            };
            setFailureReasonData([...failureReasonData, newFailureReason]);
        }

        setEditingFailureReason(null);
        setShowForm(false);
        setFormData({ failureReasonName: "", description: "" });
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

        const isFailureReasonNameValid = id === "failureReasonName" ? value.trim() !== "" : formData.failureReasonName.trim() !== "";
        const isDescriptionValid = true; 

        setIsFormValid(isFailureReasonNameValid && isDescriptionValid);
    };

    const handleCreateFormSubmit = (e) => {
        e.preventDefault()
        if (formData.failureReasonName) {
            setFailureReasonData([...failureReasonData, { ...formData, id: Date.now(), status: "y" }])
            setFormData({ failureReasonName: "", description: "" })
            setShowForm(false)
        } else {
            alert("Please fill out all required fields.")
        }
    }

    const handleSwitchChange = (id, newStatus) => {
        setConfirmDialog({ isOpen: true, failureReasonId: id, newStatus });
    };

    const handleConfirm = (confirmed) => {
        if (confirmed && confirmDialog.failureReasonId !== null) {
            setFailureReasonData((prevData) =>
                prevData.map((failureReason) =>
                    failureReason.id === confirmDialog.failureReasonId ? { ...failureReason, status: confirmDialog.newStatus } : failureReason
                )
            );
        }
        setConfirmDialog({ isOpen: false, failureReasonId: null, newStatus: null });
    };



    const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
    const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
    const currentItems = filteredFailureReasons.slice(indexOfFirst, indexOfLast);


    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title">Blood Failure Reason Master</h4>
                            <div className="d-flex justify-content-between align-items-center">

                                {!showForm ? (
                                    <form className="d-inline-block searchform me-4" role="search">
                                        <div className="input-group searchinput">
                                            <input
                                                type="search"
                                                className="form-control"
                                                placeholder="Search Failure Reasons"
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
                                                setFormData({ failureReasonName: "", description: "" }); 
                                                setEditingFailureReason(null);
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
                                            setEditingFailureReason(null);
                                            setFormData({ failureReasonName: "", description: "" });
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
                                                <th>Failure Reason Name</th>
                                                <th>Description</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((failureReason) => (
                                                <tr key={failureReason.id}>
                                                    <td>{failureReason.failureReasonName}</td>
                                                    <td>{failureReason.description}</td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={failureReason.status === "y"}
                                                                onChange={() => handleSwitchChange(failureReason.id, failureReason.status === "y" ? "n" : "y")}
                                                                id={`switch-${failureReason.id}`}
                                                            />
                                                            <label
                                                                className="form-check-label px-0"
                                                                htmlFor={`switch-${failureReason.id}`}
                                                            >
                                                                {failureReason.status === "y" ? 'Active' : 'Inactive'}
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-success me-2"
                                                            onClick={() => handleEdit(failureReason)}
                                                            disabled={failureReason.status !== "y"}
                                                        >
                                                            <i className="fa fa-pencil"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {filteredFailureReasons.length > 0 && (
                                        <Pagination
                                            totalItems={filteredFailureReasons.length}
                                            itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                            currentPage={currentPage}
                                            onPageChange={setCurrentPage}
                                        />
                                    )}
                                 
                                </div>
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="form-group col-md-4">
                                        <label>Failure Reason Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="failureReasonName"
                                            placeholder="Enter failure reason name"
                                            value={formData.failureReasonName}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-4">
                                        <label>Description</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="description"
                                            placeholder="Enter description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                                        <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                                            {editingFailureReason ? 'Update' : 'Save'}
                                        </button>
                                        <button type="button" className="btn btn-danger" onClick={() => {
                                            setShowForm(false);
                                            setEditingFailureReason(null);
                                            setFormData({ failureReasonName: "", description: "" });
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
                                                    Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{failureReasonData.find(failureReason => failureReason.id === confirmDialog.failureReasonId)?.failureReasonName}</strong>?
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

export default BloodFailureReasonMaster;