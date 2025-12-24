import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import { MAS_SPECIALTY } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading"
import { postRequest, putRequest, getRequest } from "../../../service/apiService"
import { 
  ADD_SPECIALTY_SUCC_MSG, 
  DUPLICATE_SPECIALTY, 
  FAIL_TO_SAVE_CHANGES, 
  FAIL_TO_UPDATE_STS, 
  FETCH_SPECIALTY_ERR_MSG, 
  UPDATE_SPECIALTY_SUCC_MSG 
} from "../../../config/constants";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const SpecialityMaster = () => {
    const [specialtyData, setSpecialtyData] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, centerId: null, newStatus: false, centerName: "" });
    const [popupMessage, setPopupMessage] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [isFormValid, setIsFormValid] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        centerName: "",
        description: "",
    });
    const [loading, setLoading] = useState(true);

    const CENTER_NAME_MAX_LENGTH = 150;
    const DESCRIPTION_MAX_LENGTH = 300;

    useEffect(() => {
        fetchSpecialtyData(0);
    }, []);

    // Function to format date as dd-MM-YYYY
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";

        try {
            const date = new Date(dateString);

            // Check if date is valid
            if (isNaN(date.getTime())) {
                return "N/A";
            }

            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
            const year = date.getFullYear();

            return `${day}/${month}/${year}`;
        } catch (error) {
            console.error("Error formatting date:", error);
            return "N/A";
        }
    };

    const fetchSpecialtyData = async (flag = 0) => {
        try {
            setLoading(true);
            const response = await getRequest(`${MAS_SPECIALTY}/getAll/${flag}`);
            if (response && response.response) {
                const mappedData = response.response.map(item => ({
                    id: item.centerId,
                    centerName: item.centerName,
                    description: item.description || "",
                    status: item.status,
                    lastUpdated: formatDate(item.lastUpdateDate)
                }));
                setSpecialtyData(mappedData);
            }
        } catch (err) {
            console.error("Error fetching specialty data:", err);
            showPopup(FETCH_SPECIALTY_ERR_MSG, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const filteredSpecialty = (specialtyData || []).filter(
        (specialty) =>
            specialty?.centerName?.toLowerCase().includes(searchQuery?.toLowerCase() || "")
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
    const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
    const currentItems = filteredSpecialty.slice(indexOfFirst, indexOfLast);

    const handleEdit = (record) => {
        setEditingRecord(record);
        setFormData({
            centerName: record.centerName,
            description: record.description,
        });
        setIsFormValid(true);
        setShowForm(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        try {
            setLoading(true);

            const isDuplicate = specialtyData.some(
                (specialty) =>
                    specialty.centerName.toLowerCase() === formData.centerName.toLowerCase() &&
                    (!editingRecord || editingRecord.id !== specialty.id)
            );

            if (isDuplicate && !editingRecord) {
                showPopup(DUPLICATE_SPECIALTY, "error");
                setLoading(false);
                return;
            }

            if (editingRecord) {
                const response = await putRequest(`${MAS_SPECIALTY}/update/${editingRecord.id}`, {
                    centerName: formData.centerName,
                    description: formData.description,
                });

                if (response && response.status === 200) {
                    fetchSpecialtyData();
                    showPopup(UPDATE_SPECIALTY_SUCC_MSG, "success");
                }
            } else {
                const response = await postRequest(`${MAS_SPECIALTY}/create`, {
                    centerName: formData.centerName,
                    description: formData.description,
                });

                if (response && response.status === 200) {
                    fetchSpecialtyData();
                    showPopup(ADD_SPECIALTY_SUCC_MSG, "success");
                }
            }

            setEditingRecord(null);
            setFormData({ centerName: "", description: "" });
            setShowForm(false);
        } catch (err) {
            console.error("Error saving specialty:", err);
            showPopup(FAIL_TO_SAVE_CHANGES, "error");
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

    const handleSwitchChange = (id, newStatus, centerName) => {
        setConfirmDialog({ isOpen: true, centerId: id, newStatus, centerName });
    };

    const handleConfirm = async (confirmed) => {
        if (confirmed && confirmDialog.centerId !== null) {
            try {
                setLoading(true);
                const response = await putRequest(
                    `${MAS_SPECIALTY}/status/${confirmDialog.centerId}?status=${confirmDialog.newStatus}`
                );
                if (response && response.response) {
                    setSpecialtyData((prevData) =>
                        prevData.map((specialty) =>
                            specialty.id === confirmDialog.centerId
                                ? { ...specialty, status: confirmDialog.newStatus }
                                : specialty
                        )
                    );
                    showPopup(
                        `Specialty Center ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
                        "success"
                    );
                }
            } catch (err) {
                console.error("Error updating specialty status:", err);
                showPopup(FAIL_TO_UPDATE_STS, "error");
            } finally {
                setLoading(false);
            }
        }
        setConfirmDialog({ isOpen: false, centerId: null, newStatus: null, centerName: "" });
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [id]: value }));
        setIsFormValid(formData.centerName.trim() !== "");
    };

    const handleRefresh = () => {
        setSearchQuery("");
        setCurrentPage(1);
        fetchSpecialtyData();
    };

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title">Specialty Center Master</h4>
                            <div className="d-flex justify-content-between align-items-center">
                                {!showForm ? (
                                    <form className="d-inline-block searchform me-4" role="search">
                                        <div className="input-group searchinput">
                                            <input
                                                type="search"
                                                className="form-control"
                                                placeholder="Search Specialty Center"
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
                                            <button type="button" className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                                                <i className="mdi mdi-plus"></i> Add
                                            </button>
                                            <button type="button" className="btn btn-success me-2 flex-shrink-0" onClick={handleRefresh}>
                                                <i className="mdi mdi-refresh"></i> Show All
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
                            {loading ? (
                                <LoadingScreen />
                            ) : !showForm ? (
                                <>
                                    <div className="table-responsive packagelist">
                                        <table className="table table-bordered table-hover align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Center Name</th>
                                                    <th>Description</th>
                                                    <th>Last Updated</th>
                                                    <th>Status</th>
                                                    <th>Edit</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentItems.length>0?
                                                (currentItems.map((specialty) => (
                                                    <tr key={specialty.id}>
                                                        <td>{specialty.centerName}</td>
                                                        <td>{specialty.description}</td>
                                                        <td>{specialty.lastUpdated}</td>
                                                        <td>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={specialty.status === "y"}
                                                                    onChange={() => handleSwitchChange(specialty.id, specialty.status === "y" ? "n" : "y", specialty.centerName)}
                                                                    id={`switch-${specialty.id}`}
                                                                />
                                                                <label
                                                                    className="form-check-label px-0"
                                                                    htmlFor={`switch-${specialty.id}`}
                                                                >
                                                                    {specialty.status === "y" ? "Active" : "Deactivated"}
                                                                </label>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="btn btn-sm btn-success me-2"
                                                                onClick={() => handleEdit(specialty)}
                                                                disabled={specialty.status !== "y"}
                                                            >
                                                                <i className="fa fa-pencil"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                                ): (
                                                    <tr>
                                                        <td colSpan={6} className="text-center">
                                                            No specialty data found
                                                        </td>
                                                    </tr>
                                                )
                                            }
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* PAGINATION USING REUSABLE COMPONENT */}
                                    {filteredSpecialty.length > 0 && (
                                        <Pagination
                                            totalItems={filteredSpecialty.length}
                                            itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                            currentPage={currentPage}
                                            onPageChange={setCurrentPage}
                                        />
                                    )}
                                </>
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="form-group col-md-4">
                                        <label>Center Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control  mt-1"
                                            id="centerName"
                                            placeholder="Enter Center Name"
                                            value={formData.centerName}
                                            onChange={handleInputChange}
                                            maxLength={CENTER_NAME_MAX_LENGTH}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-8">
                                        <label>Description <span className="text-danger">*</span></label>
                                        <textarea
                                            type="text"
                                            className="form-control  mt-1"
                                            id="description"
                                            placeholder="Enter Description"
                                            rows='4'
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            maxLength={DESCRIPTION_MAX_LENGTH}
                                        />
                                    </div>
                                    <div className="form-group col-md-12 d-flex justify-content-end mt-4">
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
                                                    <strong>{confirmDialog.centerName}</strong>?
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

export default SpecialityMaster;