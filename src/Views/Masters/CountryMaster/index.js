import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import axios from "axios";
import { API_HOST, MAS_COUNTRY} from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading";
import { postRequest, putRequest, getRequest } from "../../../service/apiService"

const CountryMaster = () => {
    const [countries, setCountries] = useState([]);
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
    const [pageInput, setPageInput] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const itemsPerPage = 4;

    const COUNTRY_CODE_MAX_LENGTH = 8;
    const COUNTRY_NAME_MAX_LENGTH = 30;

    
    useEffect(() => {
        fetchCountries(0);
    }, []);

    const fetchCountries = async (flag = 0) => {
        setIsLoading(true);
        try {
            const response = await getRequest(`${MAS_COUNTRY}/getAll/${flag}`);
            if (response && response.response) {
                setCountries(response.response);
            }
        } catch (err) {
            console.error("Error fetching countries:", err);
            showPopup("Failed to load countries", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); 
    };

    const filteredCountries = countries.filter(
        (country) =>
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
        setFormData({
            countryCode: country.countryCode,
            countryName: country.countryName,
            currency: country.currency,
        });
        setIsFormValid(true);
        setShowForm(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;
        
        setIsLoading(true);
        try {
            
            const isDuplicate = countries.some(
                (country) =>
                    country.id !== (editingCountry ? editingCountry.id : null) &&
                    (country.countryCode === formData.countryCode ||
                     country.countryName === formData.countryName)
            );
    
            if (isDuplicate) {
                showPopup("Country with the same code or name already exists!", "error");
                setIsLoading(false);
                return;
            }
    
            if (editingCountry) {
                
                const response = await putRequest(`${MAS_COUNTRY}/updateById/${editingCountry.id}`, {
                    countryCode: formData.countryCode,
                    countryName: formData.countryName,
                    status: editingCountry.status,
                });
    
                if (response && response.status === 200) {
                    fetchCountries(); 
                    showPopup("Country updated successfully!", "success");
                }
            } else {
                // Add new country
                const response = await postRequest(`${MAS_COUNTRY}/create`, {
                    countryCode: formData.countryCode,
                    countryName: formData.countryName,
                    status: "y",
                });
    
                if (response && response.status === 200) {
                    fetchCountries(); 
                    showPopup("New country added successfully!", "success");
                }
            }
    
            
            setEditingCountry(null);
            setFormData({ countryCode: "", countryName: "" });
            setShowForm(false);
        } catch (err) {
            console.error("Error saving country:", err);
            showPopup(`Failed to save changes: ${err.response?.data?.message || err.message}`, "error");
            setIsLoading(false);
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
        setConfirmDialog({ isOpen: true, countryId: id, newStatus });
    };

    const handleConfirm = async (confirmed) => {
        if (confirmed && confirmDialog.countryId !== null) {
            setIsLoading(true);
            try {
                const response = await putRequest(
                    `${MAS_COUNTRY}/status/${confirmDialog.countryId}?status=${confirmDialog.newStatus}`
                );
                if (response && response.status === 200) {
                    fetchCountries(); 
                    showPopup(
                        `Country ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
                        "success"
                    );
                }
            } catch (err) {
                console.error("Error updating country status:", err);
                showPopup(`Failed to update status: ${err.response?.data?.message || err.message}`, "error");
                setIsLoading(false);
            }
        }
        setConfirmDialog({ isOpen: false, countryId: null, newStatus: null });
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prevData) => {
            const updatedData = { ...prevData, [id]: value };
            setIsFormValid(
                updatedData.countryCode.trim() !== "" &&
                updatedData.countryName.trim() !== ""
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

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header">
                            <h4 className="card-title p-2">Country Master</h4>
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
                                            <button type="button" className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                                                <i className="mdi mdi-plus"></i> ADD
                                            </button>
                                            <button type="button" className="btn btn-success me-2 flex-shrink-0">
                                                <i className="mdi mdi-plus"></i> Generate Report
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
                            {!showForm ? (
                                <div className="table-responsive packagelist">
                                    <table className="table table-bordered table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Country Code</th>
                                                <th>Country Name</th>
                                                {/* <th>Currency</th> */}
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((country) => (
                                                <tr key={country.id}>
                                                    <td>{country.countryCode}</td>
                                                    <td>{country.countryName}</td>
                                                    {/* <td>{country.currency}</td> */}
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
                                                            >
                                                                {country.status === "y" ? "Active" : "Deactivated"}
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
                                            {[...Array(filteredTotalPages)].map((_, index) => (
                                                <li
                                                    className={`page-item ${currentPage === index + 1 ? "active" : ""}`}
                                                    key={index}
                                                >
                                                    <button className="page-link" onClick={() => setCurrentPage(index + 1)}>
                                                        {index + 1}
                                                    </button>
                                                </li>
                                            ))}
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
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="form-group col-md-4 mt-3">
                                        <label>Country Code <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="countryCode"
                                            placeholder="Country Code"
                                            value={formData.countryCode}
                                            onChange={handleInputChange}
                                            maxLength={COUNTRY_CODE_MAX_LENGTH}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-4 mt-3">
                                        <label>Country Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="countryName"
                                            placeholder="Country Name"
                                            value={formData.countryName}
                                            onChange={handleInputChange}
                                            maxLength={COUNTRY_NAME_MAX_LENGTH}
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
                                                    <strong>{countries.find((country) => country.id === confirmDialog.countryId)?.countryName}</strong>?
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

export default CountryMaster;