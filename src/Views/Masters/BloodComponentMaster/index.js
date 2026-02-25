
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_BLOOD_COMPONENT } from "../../../config/apiConfig";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import { FETCH_BLOOD_COMPONENT, DUPLICATE_BLOOD_COMPONENT, UPDATE_BLOOD_COMPONENT, ADD_BLOOD_COMPONENT, FAIL_BLOOD_COMPONENT, UPDATE_FAIL_BLOOD_COMPONENT } from "../../../config/constants";


const BloodComponentMaster = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        componentCode: "",
        componentName: "",
        description: "",
        storageTemp: "",
        shelfLifeDays: ""
    });
    const [showForm, setShowForm] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [isFormValid, setIsFormValid] = useState(false);
    const [popupMessage, setPopupMessage] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        record: null,
        newStatus: ""
    });

    
  // Format date utility
  const formatDate = (dateString) => {
    if (!dateString?.trim()) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };


    const fetchData = async () => {
        setLoading(true);
        try {
            const { response } = await getRequest(`${MAS_BLOOD_COMPONENT}/getAll/0`);
            setData(response || []);
        } catch {
            showPopup(FETCH_BLOOD_COMPONENT, "error");
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredData = data.filter((item) =>
        item.componentCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.componentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const currentItems = filteredData.slice(
        (currentPage - 1) * DEFAULT_ITEMS_PER_PAGE,
        currentPage * DEFAULT_ITEMS_PER_PAGE
    );

    const showPopup = (message, type = "info") => {
        setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
    };

    const resetForm = () => {
        setFormData({
            componentCode: "",
            componentName: "",
            description: "",
            storageTemp: "",
            shelfLifeDays: ""
        });
        setIsFormValid(false);
        setEditingRecord(null);
    };


    const handleCancel = () => {
        resetForm();
        setShowForm(false);
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const updatedForm = { ...formData, [name]: value };
        setFormData(updatedForm);

        setIsFormValid(
            updatedForm.componentCode.trim() !== "" &&
            updatedForm.componentName.trim() !== ""
        );
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        const newCode = formData.componentCode.trim().toLowerCase();
        const newName = formData.componentName.trim().toLowerCase();

        const duplicate = data.find(
            (rec) =>
                (rec.componentCode?.trim().toLowerCase() === newCode ||
                    rec.componentName?.trim().toLowerCase() === newName) &&
                (!editingRecord || rec.componentId !== editingRecord.componentId)
        );

        if (duplicate) {
            showPopup(DUPLICATE_BLOOD_COMPONENT, "error");
            return;
        }

        try {
            if (editingRecord) {
                await putRequest(`${MAS_BLOOD_COMPONENT}/update/${editingRecord.componentId}`, { ...formData });
                showPopup(UPDATE_BLOOD_COMPONENT, "success");
            } else {
                await postRequest(`${MAS_BLOOD_COMPONENT}/create`, { ...formData, status: "Y" });
                showPopup(ADD_BLOOD_COMPONENT, "success");
            }
            fetchData();
            resetForm();
            setShowForm(false);
        } catch {
            showPopup(UPDATE_FAIL_BLOOD_COMPONENT, "error");
        }
    };

    const handleEdit = (rec) => {
        setEditingRecord(rec);
        setFormData({
            componentCode: rec.componentCode,
            componentName: rec.componentName,
            description: rec.description,
            storageTemp: rec.storageTemp,
            shelfLifeDays: rec.shelfLifeDays
        });
        setIsFormValid(true);
        setShowForm(true);
    };

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
            await putRequest(
                `${MAS_BLOOD_COMPONENT}/status/${confirmDialog.record.componentId}?status=${confirmDialog.newStatus}`
            );
            showPopup(UPDATE_BLOOD_COMPONENT, "success");
            fetchData();
        } catch {
            showPopup(FAIL_BLOOD_COMPONENT, "error");
        } finally {
            setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
        }
    };

    return (
        <div className="content-wrapper">
            <div className="card form-card">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h4 className="card-title">Blood Component Master</h4>

                    <div className="d-flex align-items-center">
                        {!showForm && (
                            <div className="input-group me-3" style={{ width: "250px" }}>
                                <input
                                    type="search"
                                    className="form-control"
                                    placeholder="Search Components"
                                    value={searchQuery}
                                    onChange={handleSearch}
                                />
                            </div>
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
                                    <i className="mdi mdi-plus"></i> Add
                                </button>

                                <button className="btn btn-success" onClick={() => {
                                    setSearchQuery("");
                                    fetchData();
                                }}>
                                    Show All
                                </button>
                            </>
                        ) : (
                            <button className="btn btn-secondary" onClick={() => {
                                resetForm();
                                setShowForm(false);
                            }}>
                                <i className="mdi mdi-arrow-left"></i> Back
                            </button>
                        )}
                    </div>
                </div>

                <div className="card-body">
                    {loading ? (
                        <LoadingScreen />
                    ) : !showForm ? (
                        <>
                            <div className="table-responsive">
                                <table className="table table-bordered table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Component Code</th>
                                            <th>Component Name</th>
                                            <th>Description</th>
                                            <th>Storage Temp</th>
                                            <th>Shelf Life Days</th>
                                            <th>Last Update Date</th>
                                            <th>Status</th>
                                            <th>Edit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.map((rec) => (
                                            <tr key={rec.componentId}>
                                                <td>{rec.componentCode}</td>
                                                <td>{rec.componentName}</td>
                                                <td>{rec.description}</td>
                                                <td>{rec.storageTemp}</td>
                                                <td>{rec.shelfLifeDays}</td>
                                                <td>{formatDate(rec.lastUpdateDate)}</td>

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
                                                    <button
                                                        className="btn btn-sm btn-success"
                                                        onClick={() => handleEdit(rec)}
                                                        disabled={rec.status?.toLowerCase() !== "y"}
                                                    >
                                                        <i className="fa fa-pencil"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {filteredData.length > 0 && (
                                <Pagination
                                    totalItems={filteredData.length}
                                    itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                    currentPage={currentPage}
                                    onPageChange={setCurrentPage}
                                />
                            )}
                        </>
                    ) : (
                        <form className="row g-3" onSubmit={handleSave}>
                            <div className="col-md-4">
                                <label className="form-label">Component Code *</label>
                                <input
                                    type="text"
                                    name="componentCode"
                                    className="form-control"
                                    value={formData.componentCode}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="col-md-4">
                                <label className="form-label">Component Name *</label>
                                <input
                                    type="text"
                                    name="componentName"
                                    className="form-control"
                                    value={formData.componentName}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="col-md-4">
                                <label className="form-label">Description</label>
                                <input
                                    type="text"
                                    name="description"
                                    className="form-control"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="col-md-4">
                                <label className="form-label">Storage Temp</label>
                                <input
                                    type="text"
                                    name="storageTemp"
                                    className="form-control"
                                    value={formData.storageTemp}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="col-md-4">
                                <label className="form-label">Shelf Life Days</label>
                                <input
                                    type="number"
                                    name="shelfLifeDays"
                                    className="form-control"
                                    value={formData.shelfLifeDays}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="col-12 text-end">
                                <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                                    Save
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
                                        the component <strong>{confirmDialog.record?.componentName}</strong>?
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

export default BloodComponentMaster;