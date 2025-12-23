import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import { API_HOST, MAS_RELIGION } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading"
import { postRequest, putRequest, getRequest } from "../../../service/apiService"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination"



const Religionmaster = () => {
    const [religionData, setReligionData] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    // FIXED: Removed unused pageInput state (handled by Pagination component)
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, religionId: null, newStatus: false });
    const [popupMessage, setPopupMessage] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingReligion, setEditingReligion] = useState(null);
    const [isFormValid, setIsFormValid] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        religionName: "",
    });
    const [loading, setLoading] = useState(true);

    const RELIGION_NAME_MAX_LENGTH = 30;

    
    useEffect(() => {
        fetchReligionData(0);
    }, []);

    // FIXED: Added useEffect to reset page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const fetchReligionData = async (flag = 0) => {
        try {
            setLoading(true);
            const response = await getRequest(`${MAS_RELIGION}/getAll/${flag}`);
            if (response && response.response) {
                
                const mappedData = response.response.map(item => ({
                    id: item.id,
                    religionName: item.name, 
                    status: item.status,
                    lastChgBy: item.lastChgBy,
                    lastChgDate: item.lastChgDate
                }));
                setReligionData(mappedData);
            }
        } catch (err) {
            console.error("Error fetching religion data:", err);
            showPopup("Failed to load religion data", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        // FIXED: Page reset is now handled by useEffect
    };

    const filteredReligions = (religionData || []).filter(
        (religion) =>
            religion?.religionName?.toLowerCase().includes(searchQuery?.toLowerCase() || "")
    );
    

    // FIXED: Added check for empty filteredReligions
    const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
    const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
    const currentItems = filteredReligions.length > 0 ? 
        filteredReligions.slice(indexOfFirst, indexOfLast) : [];

    // FIXED: Removed handlePageNavigation function (handled by Pagination component)

    const handleEdit = (religion) => {
        setEditingReligion(religion);
        setFormData({
            religionName: religion.religionName,
        });
        setIsFormValid(true);
        setShowForm(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;
    
        try {
            setLoading(true);
    
            // FIXED: Check duplicate including editing case
            const isDuplicate = religionData.some(
                (religion) =>
                    religion.id !== (editingReligion ? editingReligion.id : null) &&
                    religion.religionName.toLowerCase() === formData.religionName.toLowerCase()
            );
    
            if (isDuplicate && !editingReligion) {
                showPopup("Religion with the same name already exists!", "error");
                setLoading(false);
                return;
            }
    
            if (editingReligion) {
                
                const response = await putRequest(`${MAS_RELIGION}/updateById/${editingReligion.id}`, {
                    name: formData.religionName,
                    status: editingReligion.status, 
                });
    
                if (response && response.status === 200) {
                   
                    fetchReligionData();
                    showPopup("Religion updated successfully!", "success");
                }
            } else {
                
                const response = await postRequest(`${MAS_RELIGION}/create`, {
                    name: formData.religionName,
                    status: "y", 
                });
    
                if (response && response.status === 200) {
                    
                    fetchReligionData();
                    showPopup("New religion added successfully!", "success");
                }
            }
    
           
            setEditingReligion(null);
            setFormData({ religionName: "" });
            setShowForm(false);
        } catch (err) {
            console.error("Error saving religion:", err);
            showPopup(`Failed to save changes: ${err.response?.data?.message || err.message}`, "error");
        } finally {
            setLoading(false);
        }
    };

    const showPopup = (message, type = "info") => {
        setPopupMessage({
            message,
            type,
            onClose: () => {
                setPopupMessage(null);
            },
        });
    };

    const handleSwitchChange = (id, newStatus) => {
        setConfirmDialog({ isOpen: true, religionId: id, newStatus });
    };

    const handleConfirm = async (confirmed) => {
        if (confirmed && confirmDialog.religionId !== null) {
            try {
                setLoading(true);
                const response = await putRequest(
                    `${MAS_RELIGION}/status/${confirmDialog.religionId}?status=${confirmDialog.newStatus}`
                );
                if (response && response.response) {
                    setReligionData((prevData) =>
                        prevData.map((religion) =>
                            religion.id === confirmDialog.religionId
                                ? { ...religion, status: confirmDialog.newStatus }
                                : religion
                        )
                    );
                    showPopup(
                        `Religion ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
                        "success"
                    );
                }
            } catch (err) {
                console.error("Error updating religion status:", err);
                showPopup(`Failed to update status: ${err.response?.data?.message || err.message}`, "error");
            } finally {
                setLoading(false);
            }
        }
        setConfirmDialog({ isOpen: false, religionId: null, newStatus: null });
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        const updatedFormData = { ...formData, [id]: value };
        setFormData(updatedFormData);
        // FIXED: Use updatedFormData for validation
        setIsFormValid(updatedFormData.religionName.trim() !== "");
    };

    const handleRefresh = () => {
        setSearchQuery("");
        // FIXED: Page reset is now handled by useEffect
        fetchReligionData();
    };

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title">Religion Master</h4>
                            <div className="d-flex justify-content-between align-items-center">
                                {!showForm ? (
                                    <form className="d-inline-block searchform me-4" role="search">
                                        <div className="input-group searchinput">
                                            <input
                                                type="search"
                                                className="form-control"
                                                placeholder="Search Religions"
                                                aria-label="Search"
                                                value={searchQuery}
                                                onChange={handleSearchChange}
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
                                            <button 
                                                type="button" 
                                                className="btn btn-success me-2" 
                                                onClick={() => {
                                                    setShowForm(true);
                                                    setEditingReligion(null);
                                                    setFormData({ religionName: "" });
                                                    setIsFormValid(false);
                                                }}
                                            >
                                                <i className="mdi mdi-plus"></i> Add
                                            </button>
                                            <button type="button" className="btn btn-success me-2 flex-shrink-0" onClick={handleRefresh}>
                                                <i className="mdi mdi-refresh"></i> Show All
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
                            {loading ? (
                                <LoadingScreen />
                            ) : !showForm ? (
                                <>
                                    <div className="table-responsive packagelist">
                                        <table className="table table-bordered table-hover align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Religion Name</th>
                                                    <th>Status</th>
                                                    <th>Edit</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentItems.length > 0 ? (
                                                    currentItems.map((religion) => (
                                                        <tr key={religion.id}>
                                                            <td>{religion.religionName}</td>
                                                            <td>
                                                                <div className="form-check form-switch">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        checked={religion.status === "y"}
                                                                        onChange={() => handleSwitchChange(religion.id, religion.status === "y" ? "n" : "y")}
                                                                        id={`switch-${religion.id}`}
                                                                    />
                                                                    <label
                                                                        className="form-check-label px-0"
                                                                        htmlFor={`switch-${religion.id}`}
                                                                    >
                                                                        {religion.status === "y" ? "Active" : "Deactivated"}
                                                                    </label>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <button
                                                                    className="btn btn-sm btn-success me-2"
                                                                    onClick={() => handleEdit(religion)}
                                                                    disabled={religion.status !== "y"}
                                                                >
                                                                    <i className="fa fa-pencil"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={3} className="text-center">
                                                            No religions found
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* FIXED: Only show pagination when there are multiple pages */}
                                    {filteredReligions.length > DEFAULT_ITEMS_PER_PAGE && (
                                        <Pagination
                                            totalItems={filteredReligions.length}
                                            itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                            currentPage={currentPage}
                                            onPageChange={setCurrentPage}
                                        />
                                    )}
                                </>
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="form-group col-md-4">
                                        <label>Religion Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control  mt-1"
                                            id="religionName"
                                            placeholder="Religion Name"
                                            value={formData.religionName}
                                            onChange={handleInputChange}
                                            maxLength={RELIGION_NAME_MAX_LENGTH}
                                            required
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
                                                <h1 className="modal-title fs-5" id="staticBackdropLabel">Modal title</h1>
                                                <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                                            </div>
                                            <div className="modal-body">
                                                {/* Your modal content goes here */}
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
                                                    Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                                                    <strong>{religionData.find((religion) => religion.id === confirmDialog.religionId)?.religionName}</strong>?
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

export default Religionmaster;