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

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, stateId: null, newStatus: false });
    const [formData, setFormData] = useState({ stateCode: "", stateName: "", currency: "" });
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [editingState, setEditingState] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [filteredTotalPages, setFilteredTotalPages] = useState(1);
    const [totalFilteredItems, setTotalFilteredItems] = useState(0);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const filteredCountries = countries.filter(state =>
        state.stateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        state.stateCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleEdit = (state) => {
        setEditingState(state);
        setShowForm(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        const formElement = e.target;
        const updatedStateName = formElement.stateName.value;

        if (editingState) {
            setCountries(countries.map(state =>
                state.id === editingState.id
                    ? { ...state, stateName: updatedStateName }
                    : state
            ));
        } else {
            const newState = {
                id: countries.length + 1,
                stateCode: formData.stateCode,
                stateName: updatedStateName,
                currency: formData.currency,
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

    const handleCreateFormSubmit = (e) => {
        e.preventDefault();
        if (formData.stateCode && formData.stateName && formData.currency) {
            setCountries([...countries, { ...formData, id: Date.now(), status: "y" }]);
            setFormData({ stateCode: "", stateName: "", currency: "" });
            setShowForm(false);
        } else {
            alert("Please fill out all required fields.");
        }
    };

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header">
                            <h4 className="card-title p-2">State Master</h4>
                            <div className="d-flex justify-content-between align-items-spacearound mt-3">
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
                                <div className="d-flex align-items-center">
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
                                    {!showForm ? (
                                        <button type="button" className="btn btn-success me-2">
                                            <i className="mdi mdi-plus"></i> Generate Report Based On Search
                                        </button>
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
                                                <th>State Code</th>
                                                <th>State Name</th>
                                                <th>Currency</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredCountries.map((state) => (
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
                                    <div className="row">
                                        <div className="form-group col-md-4 mt-3">
                                            <label>State Code <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="stateCode"
                                                placeholder="State Code"
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
                                                required
                                            />
                                        </div>
                                        <div className="form-group col-md-4 mt-3">
                                            <label>Country <span className="text-danger">*</span></label>
                                            <div className="col-md-4">
                                                <select
                                                    className="form-control"
                                                    id="country"
                                                    required
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
                                </div>
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="form-group col-md-6">
                                        <label>State Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="stateName"
                                            name="stateName"
                                            placeholder="Name"
                                            defaultValue={editingState ? editingState.stateName : ""}
                                            onChange={(e) => setIsFormValid(e.target.value.trim() !== "")}
                                            required
                                        />
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
                            {!showForm && (
                                <div className="d-flex justify-content-start mb-2 mt-3">
                                    <button type="button" className="btn btn-warning me-2" onClick={() => setShowForm(true)}>
                                        <i className="mdi mdi-plus"></i> Add
                                    </button>
                                    <button type="button" className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                                        <i className="mdi mdi-plus"></i> Update
                                    </button>
                                    <button type="button" className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                                        <i className="mdi mdi-plus"></i> Activate
                                    </button>
                                    <button type="button" className="btn btn-danger" onClick={() => {
                                        setFormData({ stateCode: "", stateName: "", currency: "" });
                                        setShowForm(false);
                                    }}>
                                        <i className="mdi mdi-refresh"></i> Reset
                                    </button>
                                </div>
                            )}
                            <div className="row mb-3">
                                <div className="col-md-4 d-flex align-items-center">
                                    <label htmlFor="changedBy" className="me-2 flex-shrink-0">Changed By</label>
                                    <input
                                        type="text"
                                        id="changedBy"
                                        className="form-control"
                                        placeholder="Enter Changed By"
                                        defaultValue="54321"
                                    />
                                </div>
                                <div className="col-md-4 d-flex align-items-center">
                                    <label htmlFor="changedDate" className="me-2 flex-shrink-0">Changed Date</label>
                                    <input
                                        type="date"
                                        id="changedDate"
                                        className="form-control"
                                        defaultValue="2025-02-28"
                                    />
                                </div>
                                <div className="col-md-4 d-flex align-items-center">
                                    <label htmlFor="changedTime" className="me-2 flex-shrink-0">Changed Time</label>
                                    <input
                                        type="time"
                                        id="changedTime"
                                        className="form-control"
                                        defaultValue="12:33"
                                    />
                                </div>
                            </div>
                            <nav className="d-flex justify-content-between align-items-center mt-3">
                                <div>
                                    <span>
                                        Page {currentPage} of {filteredTotalPages} | Total Records: {totalFilteredItems}
                                    </span>
                                </div>
                                <ul className="pagination mb-0">
                                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                        <button className="page-link" disabled>
                                            &laquo;
                                        </button>
                                    </li>
                                    {[...Array(filteredTotalPages)].map((_, index) => (
                                        <li
                                            className={`page-item ${currentPage === index + 1 ? "active" : ""}`}
                                            key={index}
                                        >
                                            <button className="page-link" disabled>
                                                {index + 1}
                                            </button>
                                        </li>
                                    ))}
                                    <li className={`page-item ${currentPage === filteredTotalPages ? "disabled" : ""}`}>
                                        <button className="page-link" disabled>
                                            &raquo;
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Statemaster;