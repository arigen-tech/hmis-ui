import { useState } from "react";
import Popup from "../../../Components/popup";

const CountryMaster = () => {
    const [countries, setCountries] = useState([
        { id: 1, countryCode: "US", countryName: "United States", currency: "USD", status: "y" },
        { id: 2, countryCode: "CA", countryName: "Canada", currency: "CAD", status: "y" },
        { id: 3, countryCode: "GB", countryName: "United Kingdom", currency: "GBP", status: "y" },
        { id: 4, countryCode: "AU", countryName: "Australia", currency: "AUD", status: "y" },
        { id: 5, countryCode: "IN", countryName: "India", currency: "INR", status: "y" },
    ]);

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, countryId: null, newStatus: false });
    const [formData, setFormData] = useState({
        countryCode: "",
        countryName: "",
        currency: "",
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [editingCountry, setEditingCountry] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalFilteredItems, setTotalFilteredItems] = useState(0);
    const [pageInput, setPageInput] = useState("");
    const itemsPerPage = 4;

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to first page when search changes
    };

    const filteredCountries = countries.filter(country =>
        country.countryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.countryCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredTotalPages = Math.ceil(filteredCountries.length / itemsPerPage);
    const currentItems = filteredCountries.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );


    const handleEdit = (country) => {
        setEditingCountry(country);
        setShowForm(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        const formElement = e.target;
        const updatedCountryName = formElement.countryName.value;
        const updatedCountryCode = formElement.countryCode.value;
        const updatedCurrency = formElement.currency.value;

        if (editingCountry) {
            setCountries(countries.map(country =>
                country.id === editingCountry.id
                    ? { ...country, countryName: updatedCountryName, countryCode: updatedCountryCode, currency: updatedCurrency }
                    : country
            ));
        } else {
            const newCountry = {
                id: countries.length + 1,
                countryCode: updatedCountryCode,
                countryName: updatedCountryName,
                currency: updatedCurrency,
                status: "y"
            };
            setCountries([...countries, newCountry]);
        }

        setEditingCountry(null);
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
        setConfirmDialog({ isOpen: true, countryId: id, newStatus });
    };

    const handleConfirm = (confirmed) => {
        if (confirmed && confirmDialog.countryId !== null) {
            setCountries((prevData) =>
                prevData.map((country) =>
                    country.id === confirmDialog.countryId ? { ...country, status: confirmDialog.newStatus } : country
                )
            );
        }
        setConfirmDialog({ isOpen: false, countryId: null, newStatus: null });
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [id]: value }));
    };

    const handleCreateFormSubmit = (e) => {
        e.preventDefault();
        if (formData.countryCode && formData.countryName && formData.currency) {
            setCountries([...countries, { ...formData, id: Date.now(), status: "y" }]);
            setFormData({ countryCode: "", countryName: "", currency: "" });
            setShowForm(false);
        } else {
            alert("Please fill out all required fields.");
        }
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
                            <h4 className="card-title p-2">Country Master</h4>
                            <div className="d-flex justify-content-between align-items-center mt-3">


                                {!showForm && (
                                    <div className="d-flex align-items-center">
                                        <div className="me-3">
                                            <label>
                                                <input type="radio" name="searchType" value="code" />
                                                <span style={{ marginLeft: '5px' }}>Country Code</span>
                                            </label>
                                        </div>
                                        <div className="me-3">
                                            <label>
                                                <input type="radio" name="searchType" value="description" />
                                                <span style={{ marginLeft: '5px' }}>Country Name</span>
                                            </label>
                                        </div>
                                    </div>
                                )}
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
                                            <button type="button" className="btn btn-success me-2" onClick={() => (setShowForm(true))}>
                                                <i className="mdi mdi-plus"></i> ADD
                                            </button>
                                            <button type="button" className="btn btn-success me-2">
                                                <i className="mdi mdi-plus"></i> Generate Report 
                                            </button>
                                        </>

                                    ) : (
                                        <div className="ms-auto"> {/* Added this div to push the button to the right */}
                                            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                                <i className="mdi mdi-arrow-left"></i> Back
                                            </button>
                                        </div>
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
                                                <th>Country Code</th>
                                                <th>Country Name</th>
                                                <th>Currency</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((country) => (
                                                <tr key={country.id}>
                                                    <td>{country.countryCode}</td>
                                                    <td>{country.countryName}</td>
                                                    <td>{country.currency}</td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={country.status === "y"}
                                                                onChange={() => handleSwitchChange(country.id, country.status === "y" ? "n" : "y")}
                                                                id={`switch-${country.id}`}
                                                            />
                                                            <label
                                                                className="form-check-label px-0"
                                                                htmlFor={`switch-${country.id}`}
                                                                onClick={() => handleSwitchChange(country.id, country.status === "y" ? "n" : "y")}
                                                            >
                                                                {country.status === "y" ? 'Active' : 'Deactivated'}
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-success me-2"
                                                            onClick={() => handleEdit(country)}
                                                            disabled={country.status !== "y"}
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
                                    <div className="form-group col-md-4 mt-3">
                                        <label>Country Code <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control  mt-1"
                                            id="countryCode"
                                            placeholder="Country Code"
                                            defaultValue={editingCountry ? editingCountry.countryCode : ""}
                                            onChange={() => setIsFormValid(true)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-4 mt-3">
                                        <label>Country Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control  mt-1"
                                            id="countryName"
                                            placeholder="Country Name"
                                            defaultValue={editingCountry ? editingCountry.countryName : ""}
                                            onChange={() => setIsFormValid(true)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-4 mt-3">
                                        <label>Currency <span className="text-danger">*</span></label>
                                        <div className="col-md-4  mt-1">
                                            <select
                                                className="form-control"
                                                id="currency"
                                                defaultValue={editingCountry ? editingCountry.currency : ""} // Set default value for editing
                                                required
                                            >
                                                <option value="" disabled>Select</option>
                                                <option value="USD">United States Dollar (USD)</option>
                                                <option value="CAD">Canadian Dollar (CAD)</option>
                                                <option value="GBP">British Pound (GBP)</option>
                                                <option value="AUD">Australian Dollar (AUD)</option>
                                                <option value="INR">Indian Rupee (INR)</option>
                                                <option value="EUR">Euro (EUR)</option>
                                            </select>
                                        </div>
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
                                                    Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{countries.find(country => country.id === confirmDialog.countryId)?.countryName}</strong>?
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

export default CountryMaster;