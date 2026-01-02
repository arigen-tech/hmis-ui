import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_STATE, MAS_DISTRICT } from "../../../config/apiConfig";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import {
    FETCH_DISTRICT_ERR_MSG,
    DUPLICATE_DISTRICT,
    UPDATE_DISTRICT_SUCC_MSG,
    ADD_DISTRICT_SUCC_MSG,
    FAIL_TO_SAVE_CHANGES,
    FAIL_TO_UPDATE_STS
} from "../../../config/constants";

const DistrictMaster = () => {
    const [districts, setDistricts] = useState([]);
    const [states, setStates] = useState([]);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, districtId: null, newStatus: false });
    const [formData, setFormData] = useState({
        districtName: "",
        state: "",
        stateId: "",
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [editingDistrict, setEditingDistrict] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const DISTRICT_NAME_MAX_LENGTH = 50;

    useEffect(() => {
        fetchDistricts(0);
        fetchStates(1);
    }, []);

    const fetchDistricts = async (flag = 0) => {
        try {
            setLoading(true);
            const response = await getRequest(`${MAS_DISTRICT}/getAll/${flag}`);
            if (response && response.response) {
                setDistricts(response.response);
            }
        } catch (err) {
            console.error("Error fetching districts:", err);
            showPopup(FETCH_DISTRICT_ERR_MSG, "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchStates = async (flag = 1) => {
        try {
            const response = await getRequest(`${MAS_STATE}/getAll/${flag}`);
            if (response && response.response) {
                setStates(response.response);
            }
        } catch (err) {
            console.error("Error fetching states:", err);
            showPopup(FETCH_DISTRICT_ERR_MSG, "error");
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const handleRefresh = () => {
        setSearchQuery("");
        setCurrentPage(1);
        fetchDistricts();
    };

    const filteredDistricts = districts.filter((district) => {
        if (searchQuery === "") return true;
        
        const query = searchQuery.toLowerCase();
        
        const stateObj = states.find(s => s.id === district.stateId);
        const stateName = stateObj ? stateObj.stateName.toLowerCase() : "";
        
        return (
            district.districtName.toLowerCase().includes(query) ||
            stateName.includes(query)
        );
    });

    const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
    const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
    const currentItems = filteredDistricts.slice(indexOfFirst, indexOfLast);

    const handleEdit = (district) => {
        const stateObj = states.find(s => s.id === district.stateId);
        const stateName = stateObj ? stateObj.stateName : "";

        setEditingDistrict(district);
        setFormData({
            districtName: district.districtName,
            state: stateName,
            stateId: district.stateId,
        });
        setIsFormValid(true);
        setShowForm(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        try {
            setLoading(true);
            
            const isDuplicate = districts.some(
                (district) =>
                    district.id !== (editingDistrict ? editingDistrict.id : null) &&
                    district.districtName === formData.districtName
            );

            if (isDuplicate) {
                showPopup(DUPLICATE_DISTRICT, "error");
                setLoading(false);
                return;
            }

            if (editingDistrict) {
                const response = await putRequest(`${MAS_DISTRICT}/updateById/${editingDistrict.id}`, {
                    districtCode: editingDistrict.districtCode,
                    districtName: formData.districtName,
                    stateId: formData.stateId,
                    status: editingDistrict.status,
                });

                if (response && response.status === 200) {
                    fetchDistricts();
                    showPopup(UPDATE_DISTRICT_SUCC_MSG, "success");
                }
            } else {
                const response = await postRequest(`${MAS_DISTRICT}/create`, {
                    districtCode: Date.now().toString().slice(-8),
                    districtName: formData.districtName,
                    stateId: formData.stateId,
                    status: "y",
                });

                if (response && response.status === 200) {
                    fetchDistricts();
                    showPopup(ADD_DISTRICT_SUCC_MSG, "success");
                }
            }

            setEditingDistrict(null);
            setFormData({ districtName: "", state: "", stateId: "" });
            setShowForm(false);
        } catch (err) {
            console.error("Error saving district:", err);
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

    const handleSwitchChange = (id, newStatus) => {
        setConfirmDialog({ isOpen: true, districtId: id, newStatus });
    };

    const handleConfirm = async (confirmed) => {
        if (confirmed && confirmDialog.districtId !== null) {
            try {
                setLoading(true);
                const response = await putRequest(
                    `${MAS_DISTRICT}/status/${confirmDialog.districtId}?status=${confirmDialog.newStatus}`
                );
                if (response && response.status === 200) {
                    fetchDistricts();
                    showPopup(
                        `District ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
                        "success"
                    );
                }
            } catch (err) {
                console.error("Error updating district status:", err);
                showPopup(FAIL_TO_UPDATE_STS, "error");
            } finally {
                setLoading(false);
            }
        }
        setConfirmDialog({ isOpen: false, districtId: null, newStatus: null });
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prevData) => {
            const updatedData = { ...prevData, [id]: value };
            
            if (id === "state") {
                const selectedIndex = e.target.selectedIndex;
                const selectedOption = e.target.options[selectedIndex];
                const stateId = parseInt(selectedOption.getAttribute('data-id'), 10);
                
                updatedData.stateId = isNaN(stateId) ? null : stateId;
            }
            
            setIsFormValid(
                updatedData.districtName.trim() !== "" &&
                updatedData.stateId
            );
            
            return updatedData;
        });
    };

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title">District Master</h4>
                            <div className="d-flex justify-content-between align-items-center">
                                {!showForm ? (
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
                                                    setEditingDistrict(null);
                                                    setFormData({
                                                        districtName: "",
                                                        state: "",
                                                        stateId: ""
                                                    });
                                                    setIsFormValid(false);
                                                    setShowForm(true);
                                                }}
                                            >
                                                <i className="mdi mdi-plus"></i> Add
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-success me-2 flex-shrink-0"
                                                onClick={handleRefresh}
                                            >
                                                <i className="mdi mdi-refresh"></i> Show All
                                            </button>
                                            <button type="button" className="btn btn-success d-flex align-items-center">
                                                <i className="mdi mdi-file-export d-sm-inlined-sm-inline ms-1"></i> Generate Report
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
                                                    <th>District Name</th>
                                                    <th>State</th>
                                                    <th>Status</th>
                                                    <th>Edit</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentItems.length > 0 ? (
                                                    currentItems.map((district) => {
                                                        const state = states.find(s => s.id === district.stateId);
                                                        const stateName = state ? state.stateName : "N/A";
                                                        
                                                        return (
                                                            <tr key={district.id}>
                                                                <td>{district.districtName}</td>
                                                                <td>{stateName}</td>
                                                                <td>
                                                                    <div className="form-check form-switch">
                                                                        <input
                                                                            className="form-check-input"
                                                                            type="checkbox"
                                                                            checked={district.status === "y"}
                                                                            onChange={() => handleSwitchChange(district.id, district.status === "y" ? "n" : "y")}
                                                                            id={`switch-${district.id}`}
                                                                        />
                                                                        <label
                                                                            className="form-check-label px-0"
                                                                            htmlFor={`switch-${district.id}`}
                                                                        >
                                                                            {district.status === "y" ? "Active" : "Deactivated"}
                                                                        </label>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <button
                                                                        className="btn btn-sm btn-success me-2"
                                                                        onClick={() => handleEdit(district)}
                                                                        disabled={district.status !== "y"}
                                                                    >
                                                                        <i className="fa fa-pencil"></i>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className="text-center">
                                                            No districts found
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    {filteredDistricts.length > 0 && (
                                        <Pagination
                                            totalItems={filteredDistricts.length}
                                            itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                            currentPage={currentPage}
                                            onPageChange={setCurrentPage}
                                        />
                                    )}
                                </>
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="card-body">
                                        <div className="row g-3 align-items-center">
                                            <div className="col-md-6">
                                                <label htmlFor="districtName" className="form-label">
                                                    District Name <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="districtName"
                                                    placeholder="District Name"
                                                    value={formData.districtName}
                                                    onChange={handleInputChange}
                                                    maxLength={DISTRICT_NAME_MAX_LENGTH}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label htmlFor="state" className="form-label">
                                                    State <span className="text-danger">*</span>
                                                </label>
                                                <select
                                                    className="form-control"
                                                    id="state"
                                                    value={formData.state}
                                                    onChange={handleInputChange}
                                                    required
                                                >
                                                    <option value="" disabled>Select State</option>
                                                    {states && states.length > 0 ? (
                                                        states.map(state => (
                                                            <option key={state.id} value={state.stateName} data-id={state.id}>
                                                                {state.stateName}
                                                            </option>
                                                        ))
                                                    ) : (
                                                        <option value="" disabled>No states available</option>
                                                    )}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-end mt-4">
                                            <button type="button" className="btn btn-secondary me-2" onClick={() => setShowForm(false)}>
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn btn-success" disabled={!isFormValid}>
                                                {editingDistrict ? "Update" : "Save"}
                                            </button>
                                        </div>
                                    </div>
                                </form>
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
                                                    <strong>{districts.find((district) => district.id === confirmDialog.districtId)?.districtName}</strong>?
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

export default DistrictMaster;