import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import axios from "axios";
import { API_HOST,ALL_COUNTRY,ALL_STATE,STATEAPI } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading"

const StateMaster = () => {
    const [states, setStates] = useState([]);
    const [countries, setCountries] = useState([]);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, stateId: null, newStatus: false });
    const [formData, setFormData] = useState({
        stateCode: "",
        stateName: "",
        country: "", 
        countryId: "", 
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [editingState, setEditingState] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageInput, setPageInput] = useState("");
    const [loading, setLoading] = useState(true);
    const itemsPerPage = 4;

    const STATE_CODE_MAX_LENGTH = 8;
    const STATE_NAME_MAX_LENGTH = 30;

    
    useEffect(() => {
        fetchStates(0);
        fetchCountries(1);
    }, []);

    const fetchStates = async (flag = 0) => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_HOST}${ALL_STATE}/${flag}`);
            if (response.data && response.data.response) {
                setStates(response.data.response);
            }
        } catch (err) {
            console.error("Error fetching states:", err);
            showPopup("Failed to load states", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchCountries = async (flag = 1) => {
        try {
            const response = await axios.get(`${API_HOST}${ALL_COUNTRY}/${flag}`);
            if (response.data && response.data.response) {
                setCountries(response.data.response);
            }
        } catch (err) {
            console.error("Error fetching countries:", err);
            showPopup("Failed to load countries", "error");
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); 
    };

    const filteredStates = states.filter(
        (state) =>
            state.stateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            state.stateCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredTotalPages = Math.ceil(filteredStates.length / itemsPerPage);
    const currentItems = filteredStates.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleEdit = (state) => {
        
        const countryObj = countries.find(c => c.id === state.countryId);
        const countryName = countryObj ? countryObj.countryName : "";

        setEditingState(state);
        setFormData({
            stateCode: state.stateCode,
            stateName: state.stateName,
            country: countryName,
            countryId: state.countryId,
        });
        setIsFormValid(true);
        setShowForm(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        try {
            setLoading(true);
            
            const isDuplicate = states.some(
                (state) =>
                    state.id !== (editingState ? editingState.id : null) &&
                    (state.stateCode === formData.stateCode ||
                     state.stateName === formData.stateName)
            );

            if (isDuplicate) {
                showPopup("State with the same code or name already exists!", "error");
                setLoading(false);
                return;
            }

            if (editingState) {
                
                const response = await axios.put(`${API_HOST}${STATEAPI}/edit/${editingState.id}`, {
                    stateCode: formData.stateCode,
                    stateName: formData.stateName,
                    countryId: formData.countryId, 
                    status: editingState.status,
                });

                if (response.data && response.data.status === 200) {
                    fetchStates(); 
                    showPopup("State updated successfully!", "success");
                }
            } else {
                
                const response = await axios.post(`${API_HOST}${STATEAPI}/create`, {
                    stateCode: formData.stateCode,
                    stateName: formData.stateName,
                    countryId: formData.countryId, 
                    status: "n",
                });

                if (response.data && response.data.status === 200) {
                    fetchStates(); 
                    showPopup("New state added successfully!", "success");
                }
            }

            
            setEditingState(null);
            setFormData({ stateCode: "", stateName: "", country: "", countryId: "" });
            setShowForm(false);
        } catch (err) {
            console.error("Error saving state:", err);
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
        setConfirmDialog({ isOpen: true, stateId: id, newStatus });
    };

    const handleConfirm = async (confirmed) => {
        if (confirmed && confirmDialog.stateId !== null) {
            try {
                setLoading(true);
                const response = await axios.put(
                    `${API_HOST}${STATEAPI}/status/${confirmDialog.stateId}?status=${confirmDialog.newStatus}`
                );
                if (response.data && response.data.status === 200) {
                    fetchStates(); 
                    showPopup(
                        `State ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
                        "success"
                    );
                }
            } catch (err) {
                console.error("Error updating state status:", err);
                showPopup(`Failed to update status: ${err.response?.data?.message || err.message}`, "error");
            } finally {
                setLoading(false);
            }
        }
        setConfirmDialog({ isOpen: false, stateId: null, newStatus: null });
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prevData) => {
            const updatedData = { ...prevData, [id]: value };
            
            
            if (id === "country") {
                
                const selectedIndex = e.target.selectedIndex;
                const selectedOption = e.target.options[selectedIndex];
                const countryId = parseInt(selectedOption.getAttribute('data-id'), 10);
                
                updatedData.countryId = isNaN(countryId) ? null : countryId;
            }
            
            setIsFormValid(
                updatedData.stateCode.trim() !== "" &&
                updatedData.stateName.trim() !== "" &&
                updatedData.countryId 
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
                            <h4 className="card-title p-2">State Master</h4>
                            <div className="d-flex justify-content-between align-items-center mt-3">
                                {!showForm && (
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
                                )}
                                <div className="d-flex align-items-center ms-auto">
                                    {!showForm ? (
                                        <>
                                            <button type="button" className="btn btn-success me-2" onClick={() => {
                                                setShowForm(true);
                                                setEditingState(null);
                                                setFormData({
                                                    stateCode: "",
                                                    stateName: "",
                                                    country: "",
                                                    countryId: ""
                                                });
                                                setIsFormValid(false);
                                            }}>
                                                <i className="mdi mdi-plus"></i> ADD
                                            </button>
                                            <button type="button" className="btn btn-success me-2">
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
                                                <th>State Code</th>
                                                <th>State Name</th>
                                                <th>Country</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.length > 0 ? (
                                                currentItems.map((state) => {
                                                    // Find the matching country for this state
                                                    const country = countries.find(c => c.id === state.countryId);
                                                    const countryName = country ? country.countryName : "N/A";
                                                    
                                                    return (
                                                        <tr key={state.id}>
                                                            <td>{state.stateCode}</td>
                                                            <td>{state.stateName}</td>
                                                            <td>{countryName}</td>
                                                            <td>
                                                                <div className="form-check form-switch">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        checked={state.status === "y"}
                                                                        onChange={() => handleSwitchChange(state.id, state.status === "y" ? "n" : "y")}
                                                                        id={`switch-${state.id}`}
                                                                    />
                                                                    <label
                                                                        className="form-check-label px-0"
                                                                        htmlFor={`switch-${state.id}`}
                                                                    >
                                                                        {state.status === "y" ? "Active" : "Deactivated"}
                                                                    </label>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <button
                                                                    className="btn btn-sm btn-success me-2"
                                                                    onClick={() => handleEdit(state)}
                                                                    disabled={state.status !== "y"}
                                                                >
                                                                    <i className="fa fa-pencil"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="text-center">
                                                        No states found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                    
                                    {filteredStates.length > 0 && (
                                        <nav className="d-flex justify-content-between align-items-center mt-3">
                                            <div>
                                                <span>
                                                    Page {currentPage} of {filteredTotalPages} | Total Records: {filteredStates.length}
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
                                    <div className="form-group col-md-4 mt-3">
                                        <label>State Code <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="stateCode"
                                            placeholder="State Code"
                                            value={formData.stateCode}
                                            onChange={handleInputChange}
                                            maxLength={STATE_CODE_MAX_LENGTH}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-4 mt-3">
                                        <label>State Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="stateName"
                                            placeholder="State Name"
                                            value={formData.stateName}
                                            onChange={handleInputChange}
                                            maxLength={STATE_NAME_MAX_LENGTH}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-4 mt-3">
                                        <label>Country <span className="text-danger">*</span></label>
                                        <select
                                            className="form-control"
                                            id="country"
                                            value={formData.country}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="" disabled>Select Country</option>
                                            {countries && countries.length > 0 ? (
                                                countries.map(country => (
                                                    <option key={country.id} value={country.countryName} data-id={country.id}>
                                                        {country.countryName}
                                                    </option>
                                                ))
                                            ) : (
                                                <option value="" disabled>No countries available</option>
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
                                                    <strong>{states.find((state) => state.id === confirmDialog.stateId)?.stateName}</strong>?
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

export default StateMaster;