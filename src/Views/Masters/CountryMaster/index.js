import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import axios from "axios";
import { API_HOST, MAS_COUNTRY } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading";
import { postRequest, putRequest, getRequest } from "../../../service/apiService"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { FETCH_COUNTRY_ERR_MSG, DUPLICATE_COUNTRY, UPDATE_COUNTRY_SUCC_MSG, ADD_COUNTRY_SUCC_MSG, FAIL_TO_SAVE_CHANGES } from "../../../config/constants";

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
    const [isLoading, setIsLoading] = useState(true);

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
            showPopup(FETCH_COUNTRY_ERR_MSG, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const filteredCountries = countries.filter(
        (country) =>
            country.countryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            country.countryCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
    const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
    const currentItems = filteredCountries.slice(indexOfFirst, indexOfLast);

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

    const resetForm = () => {
        setFormData({
            countryCode: "",
            countryName: "",
        });

        setEditingCountry(null);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        //setIsLoading(true);

        if (!isFormValid) {
            setIsLoading(false);
            return;
        }

        try {

            const payload = {
                countryCode: formData.countryCode.trim(),
                countryName: formData.countryName.trim(),
            };

            // Duplicate check
            const isDuplicate = countries.some(
                (country) =>
                    country.id !== (editingCountry ? editingCountry.id : null) &&
                    (
                        country.countryCode.trim().toLowerCase() ===
                        formData.countryCode.trim().toLowerCase() ||
                        country.countryName.trim().toLowerCase() ===
                        formData.countryName.trim().toLowerCase()
                    )
            );

            if (isDuplicate) {
                showPopup(DUPLICATE_COUNTRY, "error");
                setIsLoading(false);
                return;
            }

            let response;

            if (editingCountry) {

                payload.status = editingCountry.status;

                response = await putRequest(
                    `${MAS_COUNTRY}/updateById/${editingCountry.id}`,
                    payload
                );

                if (response.status === 200) {
                    setPopupMessage({
                        message: UPDATE_COUNTRY_SUCC_MSG,
                        type: "success",
                        onClose: () => {
                            setPopupMessage(null);
                            resetForm();
                            setShowForm(false);
                        },
                    });
                } else {
                    throw new Error(response.message || "Update failed");
                }

            } else {

                payload.status = "y";

                response = await postRequest(
                    `${MAS_COUNTRY}/create`,
                    payload
                );

                if (response.status === 201 || response.status === 200) {
                    setPopupMessage({
                        message: ADD_COUNTRY_SUCC_MSG,
                        type: "success",
                        onClose: () => {
                            setPopupMessage(null);
                            resetForm();
                            setShowForm(false);
                        },
                    });
                } else {
                    throw new Error(response.message || "Save failed");
                }
            }

        } catch (error) {
            console.error("Error saving country:", error);

            showPopup(
                error.response?.data?.message || FAIL_TO_SAVE_CHANGES,
                "error"
            );

        } finally {
            //setIsLoading(false);
        }
    };


    const showPopup = (message, type = "info", onCloseCallback = null) => {
        setPopupMessage({
            message,
            type,
            onClose: () => {
                setPopupMessage(null);
                if (onCloseCallback) onCloseCallback();
            },
        });
    };

    const handleSwitchChange = (id, newStatus) => {
        setConfirmDialog({ isOpen: true, countryId: id, newStatus });
    };

    const [saving, setSaving] = useState(false);
    
   const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.countryId !== null) {
        setSaving(true);

        try {
            const response = await putRequest(
                `${MAS_COUNTRY}/status/${confirmDialog.countryId}?status=${confirmDialog.newStatus}`
            );

            if (response && response.status === 200) {
                setPopupMessage({
                    message: `Country "${
                        confirmDialog.countryName
                    }" ${
                        confirmDialog.newStatus?.toLowerCase() === "y"
                            ? "activated"
                            : "deactivated"
                    } successfully!`,
                    type: "success",
                    onClose: () => {
                        setPopupMessage(null);
                        fetchCountries();
                        setCurrentPage(1);
                    },
                });
            } else {
                throw new Error(
                    response.message || "Failed to update status"
                );
            }
        } catch (error) {
            console.error("Error updating country status:", error);
            showPopup(
                `Failed to update status: ${
                    error.response?.data?.message || error.message
                }`,
                "error"
            );
        } finally {
            setSaving(false);
        }
    }

    setConfirmDialog({
        isOpen: false,
        countryId: null,
        newStatus: "",
        countryName: "",
    });
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

    const handleRefresh = () => {
        setSearchQuery("");
        setCurrentPage(1);
        fetchCountries();
    };

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title ">Country Master</h4>
                            <div className="d-flex justify-content-between align-items-center">
                                {!showForm ? (
                                    <form className="d-inline-block searchform me-4" role="search">
                                        <div className="input-group searchinput">
                                            <input
                                                type="search"
                                                className="form-control"
                                                placeholder="Search Country"
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
                                <div className="d-flex align-items-center ">
                                    {!showForm ? (
                                        <>
                                            <button
                                                type="button"
                                                className="btn btn-success me-2"
                                                onClick={() => {
                                                    setEditingCountry(null);
                                                    setFormData({ countryCode: "", countryName: "" });
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
                                <>
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
                                                                    checked={country.status?.toLowerCase() === "y"}
                                                                    onChange={() => handleSwitchChange(country.id, country.status?.toLowerCase() === "y" ? "n" : "y")}
                                                                    id={`switch-${country.id}`}
                                                                />
                                                                <label
                                                                    className="form-check-label px-0"
                                                                    htmlFor={`switch-${country.id}`}
                                                                >
                                                                    {country.status?.toLowerCase() === "y" ? "Active" : "Deactivated"}
                                                                </label>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="btn btn-sm btn-success me-2"
                                                                onClick={() => handleEdit(country)}
                                                                disabled={country.status?.toLowerCase() !== "y"}
                                                            >
                                                                <i className="fa fa-pencil"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* PAGINATION USING REUSABLE COMPONENT */}
                                    {filteredCountries.length > 0 && (
                                        <Pagination
                                            totalItems={filteredCountries.length}
                                            itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                            currentPage={currentPage}
                                            onPageChange={setCurrentPage}
                                        />
                                    )}
                                </>
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
                                            {editingCountry ? "Update" : "Save"}
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
                                                    Are you sure you want to {confirmDialog.newStatus?.toLowerCase() === "y" ? "activate" : "deactivate"}{" "}
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