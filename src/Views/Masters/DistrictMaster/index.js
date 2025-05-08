import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import axios from "axios";
import { API_HOST ,ALL_STATE,DISTRICTAPI, ALL_DISTRICT} from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading";

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
    const [pageInput, setPageInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [searchType, setSearchType] = useState("all");
    const itemsPerPage = 4;

    const DISTRICT_NAME_MAX_LENGTH = 50;

   
    useEffect(() => {
        fetchDistricts(0);
        fetchStates(1);
    }, []);

    const fetchDistricts = async (flag = 0) => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_HOST}${ALL_DISTRICT}/${flag}`);
            if (response.data && response.data.response) {
                setDistricts(response.data.response);
            }
        } catch (err) {
            console.error("Error fetching districts:", err);
            showPopup("Failed to load districts", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchStates = async (flag = 1) => {
        try {
            const response = await axios.get(`${API_HOST}${ALL_STATE}/${flag}`);
            if (response.data && response.data.response) {
                setStates(response.data.response);
            }
        } catch (err) {
            console.error("Error fetching states:", err);
            showPopup("Failed to load states", "error");
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); 
    };

    const handleSearchTypeChange = (e) => {
        setSearchType(e.target.value);
        setCurrentPage(1);
    };

    const filteredDistricts = districts.filter((district) => {
        if (searchQuery === "") return true;
        
        const query = searchQuery.toLowerCase();
        
        if (searchType === "name") {
            return district.districtName.toLowerCase().includes(query);
        } else {
            
            return district.districtName.toLowerCase().includes(query);
        }
    });

    const filteredTotalPages = Math.ceil(filteredDistricts.length / itemsPerPage);
    const currentItems = filteredDistricts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

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
                showPopup("District with the same name already exists!", "error");
                setLoading(false);
                return;
            }

            if (editingDistrict) {
                
                const response = await axios.put(`${API_HOST}${DISTRICTAPI}/edit/${editingDistrict.id}`, {
                    districtCode: editingDistrict.districtCode, 
                    districtName: formData.districtName,
                    stateId: formData.stateId, 
                    status: editingDistrict.status,
                });

                if (response.data && response.data.status === 200) {
                    fetchDistricts(); 
                    showPopup("District updated successfully!", "success");
                }
            } else {
                
                const response = await axios.post(`${API_HOST}${DISTRICTAPI}/create`, {
                    districtCode: Date.now().toString().slice(-8), 
                    districtName: formData.districtName,
                    stateId: formData.stateId, 
                    status: "y",
                });

                if (response.data && response.data.status === 200) {
                    fetchDistricts(); 
                    showPopup("New district added successfully!", "success");
                }
            }

           
            setEditingDistrict(null);
            setFormData({ districtName: "", state: "", stateId: "" });
            setShowForm(false);
        } catch (err) {
            console.error("Error saving district:", err);
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
        setConfirmDialog({ isOpen: true, districtId: id, newStatus });
    };

    const handleConfirm = async (confirmed) => {
        if (confirmed && confirmDialog.districtId !== null) {
            try {
                setLoading(true);
                const response = await axios.put(
                    `${API_HOST}${DISTRICTAPI}/status/${confirmDialog.districtId}?status=${confirmDialog.newStatus}`
                );
                if (response.data && response.data.status === 200) {
                    fetchDistricts();
                    showPopup(
                        `District ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
                        "success"
                    );
                }
            } catch (err) {
                console.error("Error updating district status:", err);
                showPopup(`Failed to update status: ${err.response?.data?.message || err.message}`, "error");
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
                        <div className="card-header">
                            <h4 className="card-title p-2">District Master</h4>
                            <div className="d-flex justify-content-between align-items-center mt-3">
                                {!showForm && (
                                    <div className="d-flex align-items-center">
                                        <div className="me-3">
                                            <label>
                                                <input type="radio" name="searchType" value="name" onChange={handleSearchTypeChange} checked={searchType === 'name'} />
                                                <span style={{ marginLeft: '5px' }}>District Name</span>
                                            </label>
                                        </div>
                                        <div className="me-3">
                                            <label>
                                                <input type="radio" name="searchType" value="all" onChange={handleSearchTypeChange} checked={searchType === 'all'} />
                                                <span style={{ marginLeft: '5px' }}>All</span>
                                            </label>
                                        </div>
                                    </div>
                                )}
                                <div className="d-flex align-items-center ms-auto">
                                    {!showForm ? (
                                        <>
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
                                            <button type="button" className="btn btn-success me-2" onClick={() => {
                                                setShowForm(true);
                                                setEditingDistrict(null);
                                                setFormData({
                                                    districtName: "",
                                                    state: "",
                                                    stateId: ""
                                                });
                                                setIsFormValid(false);
                                            }}>
                                                <i className="mdi mdi-plus"></i> ADD
                                            </button>
                                            <button type="button" className="btn btn-success me-2 flex-shrink-0">
                                                <i className="mdi mdi-file-export"></i> Generate Report
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
                                    
                                    {filteredDistricts.length > 0 && (
                                        <nav className="d-flex justify-content-between align-items-center mt-3">
                                            <div>
                                                <span>
                                                    Page {currentPage} of {filteredTotalPages} | Total Records: {filteredDistricts.length}
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
                                    )}
                                </div>
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="form-group col-md-6 mt-3">
                                        <label>District Name <span className="text-danger">*</span></label>
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
                                    <div className="form-group col-md-6 mt-3">
                                        <label>State <span className="text-danger">*</span></label>
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