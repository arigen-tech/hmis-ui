import { useState, useEffect } from "react"
import Popup from "../../../Components/popup";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";


const BloodCompatibilityMaster = () => {
    const [formData, setFormData] = useState({bloodGroup: "", description: ""});
    const [showForm, setShowForm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingBloodGroup, setEditingBloodGroup] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [bloodGroupData, setBloodGroupData] = useState([
        { id: 1, bloodGroup: "A+", description: "Can donate to A+ and AB+, receive from A+, A-, O+, O-", status: "y" },
        { id: 2, bloodGroup: "A-", description: "Can donate to A+, A-, AB+, AB-, receive from A-, O-", status: "y" },
        { id: 3, bloodGroup: "B+", description: "Can donate to B+ and AB+, receive from B+, B-, O+, O-", status: "y" },
        { id: 4, bloodGroup: "B-", description: "Can donate to B+, B-, AB+, AB-, receive from B-, O-", status: "y" },
        { id: 5, bloodGroup: "O+", description: "Can donate to all Rh+, receive from O+, O-", status: "y" },
        { id: 6, bloodGroup: "O-", description: "Universal donor, can receive only from O-", status: "y" },
        { id: 7, bloodGroup: "AB+", description: "Universal recipient, can donate only to AB+", status: "y" },
        { id: 8, bloodGroup: "AB-", description: "Can donate to AB+ and AB-, receive from A-, B-, AB-, O-", status: "y" },
    ]);

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, bloodGroupId: null, newStatus: false });


    const filteredBloodGroups = bloodGroupData.filter(bloodGroup =>
        bloodGroup.bloodGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bloodGroup.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleEdit = (bloodGroup) => {
        setEditingBloodGroup(bloodGroup);
        setFormData({bloodGroup: bloodGroup.bloodGroup, description: bloodGroup.description || "" });
        setShowForm(true);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);


    const handleSave = (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        const updatedBloodGroup = e.target.elements.bloodGroup.value;
        const updatedDescription = e.target.elements.description.value;

        if (editingBloodGroup) {
            setBloodGroupData(bloodGroupData.map(bloodGroup =>
                bloodGroup.id === editingBloodGroup.id
                    ? { ...bloodGroup, bloodGroup: updatedBloodGroup, description: updatedDescription }
                    : bloodGroup
            ));
        } else {
            const newBloodGroup = {
                id: bloodGroupData.length + 1,
                bloodGroup: updatedBloodGroup,
                description: updatedDescription,
                status: "y"
            };
            setBloodGroupData([...bloodGroupData, newBloodGroup]);
        }

        setEditingBloodGroup(null);
        setShowForm(false);
        setFormData({ bloodGroup: "", description: "" });
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

        const isBloodGroupValid = id === "bloodGroup" ? value.trim() !== "" : formData.bloodGroup.trim() !== "";
        const isDescriptionValid = true; 

        setIsFormValid(isBloodGroupValid && isDescriptionValid);
    };

    const handleSwitchChange = (id, newStatus) => {
        setConfirmDialog({ isOpen: true, bloodGroupId: id, newStatus });
    };

    const handleConfirm = (confirmed) => {
        if (confirmed && confirmDialog.bloodGroupId !== null) {
            setBloodGroupData((prevData) =>
                prevData.map((bloodGroup) =>
                    bloodGroup.id === confirmDialog.bloodGroupId ? { ...bloodGroup, status: confirmDialog.newStatus } : bloodGroup
                )
            );
        }
        setConfirmDialog({ isOpen: false, bloodGroupId: null, newStatus: null });
    };



    const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
    const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
    const currentItems = filteredBloodGroups.slice(indexOfFirst, indexOfLast);


    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title">Blood Compatibility Master</h4>
                            <div className="d-flex justify-content-between align-items-center">

                                {!showForm ? (
                                    <form className="d-inline-block searchform me-4" role="search">
                                        <div className="input-group searchinput">
                                            <input
                                                type="search"
                                                className="form-control"
                                                placeholder="Search Blood Groups"
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
                                                setFormData({ bloodGroup: "", description: "" }); 
                                                setEditingBloodGroup(null);
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
                                            setEditingBloodGroup(null);
                                            setFormData({ bloodGroup: "", description: "" });
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
                                                <th>Blood Group</th>
                                                <th>Description</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((bloodGroup) => (
                                                <tr key={bloodGroup.id}>
                                                    <td>
                                                        <span className="badge bg-danger">
                                                            {bloodGroup.bloodGroup}
                                                        </span>
                                                    </td>
                                                    <td>{bloodGroup.description}</td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={bloodGroup.status === "y"}
                                                                onChange={() => handleSwitchChange(bloodGroup.id, bloodGroup.status === "y" ? "n" : "y")}
                                                                id={`switch-${bloodGroup.id}`}
                                                            />
                                                            <label
                                                                className="form-check-label px-0"
                                                                htmlFor={`switch-${bloodGroup.id}`}
                                                            >
                                                                {bloodGroup.status === "y" ? 'Active' : 'Inactive'}
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-success me-2"
                                                            onClick={() => handleEdit(bloodGroup)}
                                                            disabled={bloodGroup.status !== "y"}
                                                        >
                                                            <i className="fa fa-pencil"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {filteredBloodGroups.length > 0 && (
                                        <Pagination
                                            totalItems={filteredBloodGroups.length}
                                            itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                            currentPage={currentPage}
                                            onPageChange={setCurrentPage}
                                        />
                                    )}
                                 
                                </div>
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="form-group col-md-4">
                                        <label>Blood Group <span className="text-danger">*</span></label>
                                        <select
                                            className="form-control"
                                            id="bloodGroup"
                                            value={formData.bloodGroup}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">Select Blood Group</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                        </select>
                                    </div>
                                    <div className="form-group col-md-4">
                                        <label>Description</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="description"
                                            placeholder="Enter description (e.g., Can donate to...)"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                                        <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                                            {editingBloodGroup ? 'Update' : 'Save'}
                                        </button>
                                        <button type="button" className="btn btn-danger" onClick={() => {
                                            setShowForm(false);
                                            setEditingBloodGroup(null);
                                            setFormData({ bloodGroup: "", description: "" });
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
                                                <h1 className="modal-title fs-5" id="staticBackdropLabel">Blood Group Reports</h1>
                                                <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                                            </div>
                                            <div className="modal-body">
                                                <p>Total Blood Groups: {bloodGroupData.length}</p>
                                                <p>Active Blood Groups: {bloodGroupData.filter(bg => bg.status === "y").length}</p>
                                                <p>Inactive Blood Groups: {bloodGroupData.filter(bg => bg.status === "n").length}</p>
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
                                                    Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{bloodGroupData.find(bloodGroup => bloodGroup.id === confirmDialog.bloodGroupId)?.bloodGroup}</strong>?
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

export default BloodCompatibilityMaster;