import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import LoadingScreen from "../../../Components/Loading";
import { MAS_DESIGNATION, MAS_USER_TYPE } from "../../../config/apiConfig";
import { getRequest, postRequest, putRequest } from "../../../service/apiService";
import {
    FETCH_DESIGNATION,
    ADD_DESIGNATION,
    UPDATE_DESIGNATION,
    STATUS_UPDATE_DESIGNATION,
} from "../../../config/constants";

const DesignationMaster = () => {
    const [data, setData] = useState([]);
    const [userTypes, setUserTypes] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [popupMessage, setPopupMessage] = useState(null);
    const [isFormValid, setIsFormValid] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [formData, setFormData] = useState({
        designation_name: "",
        userTypeId: "",
    });
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        id: null,
        newStatus: "",
        name: "",
    });

    const formatDate = (dateString) => {
        if (!dateString?.trim()) return "N/A";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "N/A";
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const fetchData = async (flag = 0) => {
        setLoading(true);
        try {
            const { response } = await getRequest(`${MAS_DESIGNATION}/getAll/${flag}`);
            console.log("Designations raw:", response);
            const list = Array.isArray(response) ? response : [];
            const normalized = list.map(item => ({
                ...item,
                id: item.designationId,
                designation_name: item.designationName, // use camelCase from API
                userTypeName: item.userTypeName,
                status: item.status,
                lastUpdateDate: item.lastUpdateDate,
            }));
            console.log("Normalized:", normalized);
            setData(normalized);
        } catch (error) {
            console.error("Fetch designations error:", error);
            showPopup(FETCH_DESIGNATION, "error");
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserTypes = async (flag = 1) => {
        try {
            const { response } = await getRequest(`${MAS_USER_TYPE}/getAll/${flag}`);
            console.log("User types raw:", response);
            const list = Array.isArray(response) ? response : [];
            setUserTypes(list);
        } catch (error) {
            console.error("Fetch user types error:", error);
            showPopup(FETCH_DESIGNATION, "error");
            setUserTypes([]);
        }
    };

    useEffect(() => {
        fetchData();
        fetchUserTypes();
    }, []);

    const showPopup = (msg, type) => {
        setPopupMessage({ message: msg, type, onClose: () => setPopupMessage(null) });
    };

    const filteredData = data.filter(rec =>
        rec.designation_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
    const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
    const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

    const resetForm = () => {
        setFormData({ designation_name: "", userTypeId: "" });
        setIsFormValid(false);
        setEditingRecord(null);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        setSaving(true);
        try {
            // ✅ Use designationName (camelCase) as expected by backend
            const payload = {
                designationName: formData.designation_name.trim(),
                userTypeId: formData.userTypeId,
            };
            console.log("Saving payload:", payload);

            let url, method;
            if (editingRecord) {
                url = `${MAS_DESIGNATION}/update/${editingRecord.id}`;
                method = putRequest;
            } else {
                url = `${MAS_DESIGNATION}/create`;
                method = postRequest;
                // For new records, we add status: "n" as per original
                payload.status = "n";
            }

            const response = await method(url, payload);
            console.log("Save response:", response);

            showPopup(editingRecord ? UPDATE_DESIGNATION : ADD_DESIGNATION, "success");
            await fetchData(); // refresh the list
            resetForm();
            setShowForm(false);
        } catch (error) {
            console.error("Save error:", error);
            const errorMsg = error.response?.data?.message || (editingRecord ? "Update failed" : "Add failed");
            showPopup(errorMsg, "error");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (rec) => {
        setEditingRecord(rec);
        setFormData({
            designation_name: rec.designation_name || "",
            userTypeId: rec.userTypeId || "",
        });
        setIsFormValid(!!rec.designation_name && !!rec.userTypeId);
        setShowForm(true);
    };

    const handleSwitchChange = (id, currentStatus, name) => {
        const newStatus = currentStatus === "y" ? "n" : "y";
        setConfirmDialog({ isOpen: true, id, newStatus, name });
    };

    const handleConfirm = async (confirmed) => {
        const { id, newStatus, name } = confirmDialog;
        setConfirmDialog({ isOpen: false, id: null, newStatus: "", name: "" });

        if (!confirmed || !id) return;

        setSaving(true);
        try {
            await putRequest(`${MAS_DESIGNATION}/status/${id}?status=${newStatus}`);
            showPopup(
                `Designation "${name}" ${newStatus === "y" ? "activated" : "deactivated"} successfully!`,
                "success"
            );
            await fetchData();
        } catch (error) {
            console.error(error);
            showPopup(STATUS_UPDATE_DESIGNATION, "error");
        } finally {
            setSaving(false);
        }
    };

    const handleRefresh = () => {
        setSearchQuery("");
        setCurrentPage(1);
        fetchData();
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        const updated = { ...formData, [id]: value };
        setFormData(updated);
        setIsFormValid(updated.designation_name.trim() !== "" && updated.userTypeId !== "");
    };

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title">Designation Master</h4>
                            <div className="d-flex align-items-center">
                                {!showForm && (
                                    <input
                                        className="form-control w-50 me-2"
                                        placeholder="Search by Name"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    />
                                )}

                                {!showForm ? (
                                    <>
                                        <button
                                            className="btn btn-success me-2"
                                            onClick={() => {
                                                resetForm();
                                                setShowForm(true);
                                            }}
                                        >
                                            Add
                                        </button>
                                        <button className="btn btn-success flex-shrink-0" onClick={handleRefresh}>
                                            Show All
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            resetForm();
                                            setShowForm(false);
                                        }}
                                    >
                                        Back
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="card-body">
                            {loading && !showForm && <LoadingScreen />}

                            {!showForm && !loading && (
                                <>
                                    <table className="table table-bordered table-hover">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Designation Name</th>
                                                <th>User Type Name</th>
                                                <th>Last Update Date</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.length > 0 ? (
                                                currentItems.map((rec) => (
                                                    <tr key={rec.id}>
                                                        <td>{rec.designation_name}</td>
                                                        <td>{rec.userTypeName}</td>
                                                        <td>{formatDate(rec.lastUpdateDate)}</td>
                                                        <td>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={rec.status === "y"}
                                                                    onChange={() =>
                                                                        handleSwitchChange(rec.id, rec.status, rec.designation_name)
                                                                    }
                                                                />
                                                                <label className="form-check-label ms-2">
                                                                    {rec.status === "y" ? "Active" : "Inactive"}
                                                                </label>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="btn btn-success btn-sm"
                                                                onClick={() => handleEdit(rec)}
                                                                disabled={rec.status !== "y"}
                                                            >
                                                                <i className="fa fa-pencil"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="text-center">
                                                        No Records Found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>

                                    <Pagination
                                        totalItems={filteredData.length}
                                        itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                        currentPage={currentPage}
                                        onPageChange={setCurrentPage}
                                    />
                                </>
                            )}

                            {showForm && (
                                <form className="row" onSubmit={handleSave}>
                                    <div className="form-group col-md-6">
                                        <label>Designation Name *</label>
                                        <input
                                            type="text"
                                            id="designation_name"
                                            className="form-control mt-1"
                                            value={formData.designation_name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group col-md-6">
                                        <label>User Type *</label>
                                        <select
                                            id="userTypeId"
                                            className="form-control mt-1"
                                            value={formData.userTypeId}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">Select User Type</option>
                                            {userTypes.map((item) => (
                                                <option key={item.userTypeId} value={item.userTypeId}>
                                                    {item.userTypeName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group col-md-12 mt-3 d-flex justify-content-end">
                                        <button
                                            type="submit"
                                            className="btn btn-primary me-2"
                                            disabled={!isFormValid || saving}
                                        >
                                            {saving ? "Saving..." : editingRecord ? "Update" : "Save"}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={() => {
                                                resetForm();
                                                setShowForm(false);
                                            }}
                                        >
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
                                <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                                    <div className="modal-dialog">
                                        <div className="modal-content">
                                            <div className="modal-body">
                                                Are you sure you want to{" "}
                                                {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                                                <strong>{confirmDialog.name}</strong>?
                                            </div>
                                            <div className="modal-footer">
                                                <button
                                                    className="btn btn-secondary"
                                                    onClick={() => handleConfirm(false)}
                                                >
                                                    No
                                                </button>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => handleConfirm(true)}
                                                >
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
            </div>
        </div>
    );
};

export default DesignationMaster;