
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { MAS_BLOOD_DONATION_STATUS } from "../../../config/apiConfig";
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import {
    FETCH_BLOOD_DONATION_STATUS,
    DUPLICATE_BLOOD_DONATION_STATUS,
    UPDATE_BLOOD_DONATION_STATUS,
    ADD_BLOOD_DONATION_STATUS,
    FAIL_BLOOD_DONATION_STATUS,
    UPDATE_STATUS_BLOOD_DONATION_STATUS,
    FAIL_UPDATE_BLOOD_DONATION_STATUS
} from "../../../config/constants";

const BloodDonationStatusMaster = () => {
    const [donationStatusData, setDonationStatusData] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        statusCode: "",
        statusName: "",
        description: "",
        isFinal: "N",
    });

    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [showForm, setShowForm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [editingDonationStatus, setEditingDonationStatus] = useState(null);

    const [popupMessage, setPopupMessage] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, record: null, newStatus: "" });

    // Format date
    const formatDate = (dateString) => {
        if (!dateString?.trim()) return "N/A";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "N/A";
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Fetch list
    const fetchData = async (flag = 0) => {
        setLoading(true);
        try {
            const { response } = await getRequest(`${MAS_BLOOD_DONATION_STATUS}/getAll/${flag}`);
            setDonationStatusData(response || []);
        } catch {
            showPopup(FETCH_BLOOD_DONATION_STATUS, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter by search
    const filteredData = donationStatusData.filter(rec =>
        rec.donationStatusCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.donationStatusName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const currentItems = filteredData.slice(
        (currentPage - 1) * DEFAULT_ITEMS_PER_PAGE,
        currentPage * DEFAULT_ITEMS_PER_PAGE
    );

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleCancel = () => {
        resetForm();
        setShowForm(false);
    };

    const resetForm = () => {
        setFormData({
            statusCode: "",
            statusName: "",
            description: "",
            isFinal: "N",
        });
        setIsFormValid(false);
        setEditingDonationStatus(null);
    };

    // Form input
    const handleInputChange = (e) => {
        const { id, value, type, checked } = e.target;
        const newVal = type === "checkbox" ? (checked ? "Y" : "N") : value;

        setFormData(prev => {
            const updated = { ...prev, [id]: newVal };

            // validate
            setIsFormValid(
                updated.statusCode.trim() !== "" &&
                updated.statusName.trim() !== ""
            );

            return updated;
        });
    };

    // Save (Add / Update)
    const handleSave = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        const newCode = formData.statusCode.trim().toLowerCase();
        const newName = formData.statusName.trim().toLowerCase();

        const duplicate = donationStatusData.find(
            (rec) =>
                (rec.donationStatusCode?.trim().toLowerCase() === newCode ||
                    rec.donationStatusName?.trim().toLowerCase() === newName) &&
                (!editingDonationStatus || rec.donationStatusId !== editingDonationStatus.donationStatusId)
        );

        if (duplicate) {
            showPopup(DUPLICATE_BLOOD_DONATION_STATUS, "error");
            return;
        }

        try {
            if (editingDonationStatus) {
                await putRequest(
                    `${MAS_BLOOD_DONATION_STATUS}/update/${editingDonationStatus.donationStatusId}`, {
                        donationStatusCode: formData.statusCode.trim(),
                        donationStatusName: formData.statusName.trim(),
                        description: formData.description.trim(),
                        isFinal: formData.isFinal,
                    }
                );
                showPopup(UPDATE_BLOOD_DONATION_STATUS, "success");
            } else {
                await postRequest(`${MAS_BLOOD_DONATION_STATUS}/create`, {
                    donationStatusCode: formData.statusCode.trim(),
                    donationStatusName: formData.statusName.trim(),
                    description: formData.description.trim(),
                    isFinal: formData.isFinal,
                });
                showPopup(ADD_BLOOD_DONATION_STATUS, "success");
            }

            fetchData();
            handleCancel();
        } catch {
            showPopup(FAIL_BLOOD_DONATION_STATUS, "error");
        }
    };

    // Edit row
    const handleEdit = (rec) => {
        setEditingDonationStatus(rec);
        setFormData({
            statusCode: rec.donationStatusCode,
            statusName: rec.donationStatusName,
            description: rec.description,
            isFinal: rec.isFinal,
        });

        setIsFormValid(
            rec.donationStatusCode.trim() !== "" &&
            rec.donationStatusName.trim() !== ""
        );

        setShowForm(true);
    };

    // Toggle status
    const handleSwitchChange = (rec) => {
        setConfirmDialog({
            isOpen: true,
            record: rec,
            newStatus: rec.status?.toLowerCase() === "y" ? "n" : "y"
        });
    };

    const handleConfirm = async (confirmed) => {
        if (!confirmed) {
            setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
            return;
        }
        try {
            setLoading(true);
            await putRequest(`${MAS_BLOOD_DONATION_STATUS}/status/${confirmDialog.record.donationStatusId}?status=${confirmDialog.newStatus}`);
            showPopup(UPDATE_STATUS_BLOOD_DONATION_STATUS, "success");
            fetchData();
        } catch {
            showPopup(FAIL_UPDATE_BLOOD_DONATION_STATUS, "error");
        } finally {
            setLoading(false);
            setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
        }
    };

    const showPopup = (message, type) => {
        setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
    };

    return (
        <div className="content-wrapper">
            <div className="card form-card">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h4>Blood Donation Status Master</h4>
                    <div className="d-flex">
                        {!showForm && (
                            <input
                                style={{ width: "220px" }}
                                className="form-control me-2"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                        )}
                        {!showForm ? (
                            <>
                                <button className="btn btn-success me-2" onClick={() => {
                                    setShowForm(true);
                                    resetForm();
                                }}>
                                    Add
                                </button>
                                <button className="btn btn-success" onClick={fetchData}>
                                    Show All
                                </button>
                            </>
                        ) : (
                            <button className="btn btn-secondary" onClick={handleCancel}>
                                Back
                            </button>
                        )}
                    </div>
                </div>

                <div className="card-body">
                    {loading ? (
                        <LoadingScreen />
                    ) : !showForm ? (
                        <>
                            <table className="table table-bordered table-hover">
                                <thead>
                                    <tr>
                                        <th>Status Code</th>
                                        <th>Status Name</th>
                                        <th>Description</th>
                                        <th>Is Final</th>
                                        <th>Last Update Date</th>
                                        <th>Status</th>
                                        <th>Edit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((rec) => (
                                        <tr key={rec.donationStatusId}>
                                            <td>{rec.donationStatusCode}</td>
                                            <td>{rec.donationStatusName}</td>
                                            <td>{rec.description}</td>
                                            <td>{rec.isFinal === "Y" ? "Yes" : "No"}</td>
                                            <td>{formatDate(rec.createdDate)}</td>
                                            <td>
                                                <div className="form-check form-switch">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={rec.status?.toLowerCase() === "y"}
                                                        onChange={() => handleSwitchChange(rec)}
                                                    />
                                                    <label className="form-check-label ms-2">
                                                        {rec.status?.toLowerCase() === "y" ? "Active" : "Inactive"}
                                                    </label>
                                                </div>
                                            </td>
                                            <td>
                                                <button className="btn btn-success btn-sm" onClick={() => handleEdit(rec)}>
                                                    <i className="fa fa-pencil"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <Pagination
                                totalItems={filteredData.length}
                                itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    ) : (
                        <form className="row g-3" onSubmit={handleSave}>
                            <div className="col-md-3">
                                <label>Status Code *</label>
                                <input
                                    id="statusCode"
                                    className="form-control"
                                    value={formData.statusCode}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="col-md-3">
                                <label>Status Name *</label>
                                <input
                                    id="statusName"
                                    className="form-control"
                                    value={formData.statusName}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="col-md-3">
                                <label>Description</label>
                                <textarea
                                    id="description"
                                    className="form-control"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="col-md-3">
                                <label htmlFor="isFinal">Is Final</label>
                                <input
                                    type="checkbox"
                                    id="isFinal"
                                    checked={formData.isFinal === "Y"}
                                    onChange={handleInputChange}
                                    style={{ width: "20px", height: "24px", accentColor: "#6aab9c", display: "block" }}
                                />
                            </div>

                            <div className="col-12 text-end">
                                <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                                    {editingDonationStatus ? "Update" : "Save"}
                                </button>
                                <button type="button" className="btn btn-danger" onClick={handleCancel}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}

                    {popupMessage && <Popup {...popupMessage} />}

                    {confirmDialog.isOpen && (
                        <div className="modal d-block">
                            <div className="modal-dialog">
                                <div className="modal-content">
                                    <div className="modal-body">
                                        Are you sure you want to{" "}
                                        {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                                        <strong>{confirmDialog.record?.donationStatusName}</strong>?
                                    </div>
                                    <div className="modal-footer">
                                        <button className="btn btn-secondary" onClick={() => handleConfirm(false)}>
                                            No
                                        </button>
                                        <button className="btn btn-primary" onClick={() => handleConfirm(true)}>
                                            Yes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BloodDonationStatusMaster;