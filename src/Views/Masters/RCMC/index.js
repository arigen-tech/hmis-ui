import { useState, useEffect } from "react"
import Popup from "../../../Components/popup";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";


const RCMC = () => {
    const [formData, setFormData] = useState({
        complaintName: "",
        type: "PC",
    });
    const [showForm, setShowForm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingComplaint, setEditingComplaint] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [pageInput, setPageInput] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [complaintData, setComplaintData] = useState([
        { id: 1, complaintName: "Fever", status: "y", type: "PC" },
        { id: 2, complaintName: "Cough", status: "y", type: "PC" },
        { id: 3, complaintName: "Headache", status: "y", type: "PC" },
        { id: 4, complaintName: "Diabetes", status: "y", type: "MH" },
        { id: 5, complaintName: "Hypertension", status: "y", type: "MH" },
        { id: 6, complaintName: "Asthma", status: "y", type: "MH" },
    ]);

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, complaintId: null, newStatus: false });


    const filteredComplaints = complaintData.filter(complaint =>
        complaint.complaintName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleEdit = (complaint) => {
        setEditingComplaint(complaint);
        setShowForm(true);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);


    const handleSave = (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        const updatedComplaintName = e.target.elements.complaintName.value;
        const updatedType = e.target.elements.type.value;

        if (editingComplaint) {
            setComplaintData(complaintData.map(complaint =>
                complaint.id === editingComplaint.id
                    ? { ...complaint, complaintName: updatedComplaintName, type: updatedType }
                    : complaint
            ));
        } else {
            const newComplaint = {
                id: complaintData.length + 1,
                complaintName: updatedComplaintName,
                type: updatedType,
                status: "y"
            };
            setComplaintData([...complaintData, newComplaint]);
        }

        setEditingComplaint(null);
        setShowForm(false);
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

        const isComplaintNameValid = id === "complaintName" ? value.trim() !== "" : formData.complaintName.trim() !== "";
        const isTypeValid = id === "type" ? value.trim() !== "" : formData.type.trim() !== "";

        setIsFormValid(isComplaintNameValid && isTypeValid);
    };

    const handleCreateFormSubmit = (e) => {
        e.preventDefault()
        if (formData.complaintName) {
            setComplaintData([...complaintData, { ...formData, id: Date.now(), status: "y" }])
            setFormData({ complaintName: "" })
            setShowForm(false)
        } else {
            alert("Please fill out all required fields.")
        }
    }

    const handleSwitchChange = (id, newStatus) => {
        setConfirmDialog({ isOpen: true, complaintId: id, newStatus });
    };

    const handleConfirm = (confirmed) => {
        if (confirmed && confirmDialog.complaintId !== null) {
            setComplaintData((prevData) =>
                prevData.map((complaint) =>
                    complaint.id === confirmDialog.complaintId ? { ...complaint, status: confirmDialog.newStatus } : complaint
                )
            );
        }
        setConfirmDialog({ isOpen: false, complaintId: null, newStatus: null });
    };



    const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
    const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
    const currentItems = filteredComplaints.slice(indexOfFirst, indexOfLast);

    

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title">Present Complaint and Medical History Master </h4>
                            <div className="d-flex justify-content-between align-items-center">

                                {!showForm ? (
                                    <form className="d-inline-block searchform me-4" role="search">
                                        <div className="input-group searchinput">
                                            <input
                                                type="search"
                                                className="form-control"
                                                placeholder="Search Complaints"
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

                                            <button type="button" className="btn btn-success me-2" onClick={() => { setShowForm(true); setFormData({ complaintName: "", type: "PC" }); }}>
                                                <i className="mdi mdi-plus"></i> Add
                                            </button>
                                            <button type="button" className="btn btn-success me-2 flex-shrink-0">
                                                <i className="mdi mdi-plus"></i> Show All
                                            </button>
                                            {/* <button type="button" className="btn btn-success me-2" onClick={() => setShowModal(true)}>
                                                <i className="mdi mdi-plus"></i> Reports
                                            </button> */}
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
                                                <th> Name</th>
                                                <th>Type</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((complaint) => (
                                                <tr key={complaint.id}>
                                                    <td>{complaint.complaintName}</td>
                                                    <td>{complaint.type}</td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={complaint.status === "y"}
                                                                onChange={() => handleSwitchChange(complaint.id, complaint.status === "y" ? "n" : "y")}
                                                                id={`switch-${complaint.id}`}
                                                            />
                                                            <label
                                                                className="form-check-label px-0"
                                                                htmlFor={`switch-${complaint.id}`}
                                                            >
                                                                {complaint.status === "y" ? 'Active' : 'Inactive'}
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-success me-2"
                                                            onClick={() => handleEdit(complaint)}
                                                            disabled={complaint.status !== "y"}
                                                        >
                                                            <i className="fa fa-pencil"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {filteredComplaints.length > 0 && (
                                        <Pagination
                                            totalItems={filteredComplaints.length}
                                            itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                            currentPage={currentPage}
                                            onPageChange={setCurrentPage}
                                        />
                                    )}
                                 
                                </div>
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="form-group col-md-4">
                                        <label>Complaint Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="complaintName"
                                            placeholder="Complaint Name"
                                            value={formData.complaintName}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-4">
                                        <label>Type <span className="text-danger">*</span></label>
                                        <select
                                            className="form-control"
                                            id="type"
                                            value={formData.type}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="PC">Present Complaint</option>
                                            <option value="MH">Medical History</option>
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
                                                    Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{complaintData.find(complaint => complaint.id === confirmDialog.complaintId)?.complaintName}</strong>?
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

export default RCMC;