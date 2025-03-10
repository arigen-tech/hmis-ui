// hmis-ui/src/Views/Masters/StateMaster/index.js
import { useState } from "react";
import Popup from "../../../Components/popup";

const Statemaster = () => {
    const [countries, setCountries] = useState([
        { id: 1, stateCode: "AL", stateName: "Alabama", currency: "USD", status: "y" },
        { id: 2, stateCode: "AK", stateName: "Alaska", currency: "USD", status: "y" },
        { id: 3, stateCode: "AZ", stateName: "Arizona", currency: "USD", status: "y" },
        { id: 4, stateCode: "AR", stateName: "Arkansas", currency: "USD", status: "y" },
        { id: 5, stateCode: "CA", stateName: "California", currency: "USD", status: "y" },
        { id: 6, stateCode: "CO", stateName: "Colorado", currency: "USD", status: "y" },

        // Add more states as needed
    ]);

    const [pageInput, setPageInput] = useState("");
    const itemsPerPage = 4; // You can adjust this number as needed

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, stateId: null, newStatus: false });
    const [formData, setFormData] = useState({ stateCode: "", stateName: "", currency: "" });
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [editingState, setEditingState] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalFilteredItems, setTotalFilteredItems] = useState(0);
    const STATE_NAME_MAX_LENGTH = 5;


    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to first page when search changes
    };

    const filteredCountries = countries.filter(state =>
        state.stateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        state.stateCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredTotalPages = Math.ceil(filteredCountries.length / itemsPerPage);


    const handleEdit = (state) => {
        setEditingState(state);
        setShowForm(true);
    };

    const currentItems = filteredCountries.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSave = (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        const formElement = e.target;
        const updatedStateName = formElement.stateName.value;
        const updatedStateCode = formElement.stateCode.value;
        const updatedCurrency = formElement.country.value;

        if (editingState) {
            setCountries(countries.map(state =>
                state.id === editingState.id
                    ? { ...state, stateName: updatedStateName, stateCode: updatedStateCode, currency: updatedCurrency }
                    : state
            ));
        } else {
            const newState = {
                id: countries.length + 1,
                stateCode: updatedStateCode,
                stateName: updatedStateName,
                currency: updatedCurrency,
                status: "y"
            };
            setCountries([...countries, newState]);
        }

        setEditingState(null);
        setShowForm(false);
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

    const handleSwitchChange = (id, newStatus) => {
        setConfirmDialog({ isOpen: true, stateId: id, newStatus });
    };

    const handleConfirm = (confirmed) => {
        if (confirmed && confirmDialog.stateId !== null) {
            setCountries((prevData) =>
                prevData.map((state) =>
                    state.id === confirmDialog.stateId ? { ...state, status: confirmDialog.newStatus } : state
                )
            );
        }
        setConfirmDialog({ isOpen: false, stateId: null, newStatus: null });
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [id]: value }));
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
        const maxVisiblePages = 5; // Maximum number of visible page links
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        const endPage = Math.min(filteredTotalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            pageNumbers.push(1);
            if (startPage > 2) pageNumbers.push("..."); // Add ellipsis
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        if (endPage < filteredTotalPages) {
            if (endPage < filteredTotalPages - 1) pageNumbers.push("..."); // Add ellipsis
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
                            <div className="d-flex justify-content-between align-items-spacearound mt-3">
                                {!showForm && (
                                    <div className="d-flex align-items-center">
                                        <div className="me-3">
                                            <label>
                                                <input type="radio" name="searchType" value="code" />
                                                <span style={{ marginLeft: '5px' }}>State Code</span>
                                            </label>
                                        </div>
                                        <div className="me-3">
                                            <label>
                                                <input type="radio" name="searchType" value="description" />
                                                <span style={{ marginLeft: '5px' }}>State Description</span>
                                            </label>
                                        </div>
                                    </div>
                                )}
                                <div className="d-flex align-items-center ms-auto">
                                    {!showForm && (
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
                                            <button type="button" className="btn btn-success me-2" onClick={() => (setShowForm(true))}>
                                                <i className="mdi mdi-plus"></i> ADD
                                            </button>
                                            <button type="button" className="btn btn-success me-2">
                                                <i className="mdi mdi-plus"></i> Generate Report 
                                            </button>
                                        </>
                                    )}
                                    {showForm && (
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
                                                <th>State Code</th>
                                                <th>State Name</th>
                                                <th>Currency</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                        {currentItems.map((state) => (
                    <tr key={state.id}>
                        <td>{state.stateCode}</td>
                        <td>{state.stateName}</td>
                        <td>{state.currency}</td>
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
                                    onClick={() => handleSwitchChange(state.id, state.status === "y" ? "n" : "y")}
                                >
                                    {state.status === "y" ? 'Active' : 'Deactivated'}
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
                ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="row">
                                        <div className="form-group col-md-4 mt-3">
                                            <label>State Code <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="stateCode"
                                                placeholder="State Code"
                                                required
                                                defaultValue={editingState ? editingState.stateCode : ""}
                                                onChange={() => setIsFormValid(true)}

                                            />
                                        </div>
                                        <div className="form-group col-md-4 mt-3">
                                            <label>State Name <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="stateName"
                                                placeholder="State Name"
                                                maxLength={STATE_NAME_MAX_LENGTH}
                                                required
                                                defaultValue={editingState ? editingState.stateName : ""}
                                                onChange={() => setIsFormValid(true)}
                                            // Bind to formData
                                            />
                                        </div>
                                        <div className="form-group col-md-4 mt-3">
                                            <label>Country <span className="text-danger">*</span></label>
                                            <div className="col-md-4">
                                                <select
                                                    className="form-control"
                                                    id="country"
                                                    required
                                                    value={formData.country} // Bind to formData
                                                    onChange={handleInputChange} // Handle input change
                                                >
                                                    <option value="" disabled>Select</option>
                                                    <option value="IND">India</option>
                                                    <option value="AUS">Australia</option>
                                                    <option value="RSA">Russia</option>
                                                    <option value="CHI">China</option>
                                                </select>
                                            </div>
                                        </div>
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
                                                    Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{countries.find(state => state.id === confirmDialog.stateId)?.stateName}</strong>?
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


<nav className="d-flex justify-content-between align-items-center mt-3">
                <div>
                    <span>
                        Page {currentPage} of {filteredTotalPages} | Total Records: {filteredCountries.length}
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Statemaster;