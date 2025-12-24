import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import axios from "axios";
import {  MAS_ADMISSION_STATUS } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading"
import { postRequest, putRequest, getRequest } from "../../../service/apiService"
import { 
  ADD_ADMISSION_STATUS_SUCC_MSG, 
  DUPLICATE_ADMISSION_STATUS, 
  FAIL_TO_SAVE_CHANGES, 
  FAIL_TO_UPDATE_STS, 
  FETCH_ADMISSION_STATUS_ERR_MSG, 
  UPDATE_ADMISSION_STATUS_SUCC_MSG 
} from "../../../config/constants";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const AdmissionStatusMaster = () => {
    const [admissionStatusData, setAdmissionStatusData] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, admissionStatusId: null, newStatus: false });
    const [popupMessage, setPopupMessage] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [isFormValid, setIsFormValid] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        statusCode: "",
    });
    const [loading, setLoading] = useState(true);

    const STATUS_CODE_MAX_LENGTH = 50;

    useEffect(() => {
        fetchAdmissionStatusData(0);
    }, []);

    // Function to format date as dd-MM-YYYY
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";

        try {
            const date = new Date(dateString);

            // Check if date is valid
            if (isNaN(date.getTime())) {
                return "N/A";
            }

            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
            const year = date.getFullYear();

            return `${day}/${month}/${year}`;
        } catch (error) {
            console.error("Error formatting date:", error);
            return "N/A";
        }
    };

    const fetchAdmissionStatusData = async (flag = 0) => {
        try {
            setLoading(true);
            const response = await getRequest(`${MAS_ADMISSION_STATUS}/getAll/${flag}`);
            if (response && response.response) {
                const mappedData = response.response.map(item => ({
                    id: item.admissionStatusId,
                    statusCode: item.statusCode,
                    status: item.status,
                    lastUpdated: formatDate(item.lastUpdateDate)
                }));
                setAdmissionStatusData(mappedData);
            }
        } catch (err) {
            console.error("Error fetching admission status data:", err);
            showPopup(FETCH_ADMISSION_STATUS_ERR_MSG, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const filteredAdmissionStatus = (admissionStatusData || []).filter(
        (status) =>
            status?.statusCode?.toLowerCase().includes(searchQuery?.toLowerCase() || "")
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
    const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
    const currentItems = filteredAdmissionStatus.slice(indexOfFirst, indexOfLast);

    const handleEdit = (record) => {
        setEditingRecord(record);
        setFormData({
            statusCode: record.statusCode,
        });
        setIsFormValid(true);
        setShowForm(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        try {
            setLoading(true);

            const isDuplicate = admissionStatusData.some(
                (status) =>
                    status.statusCode.toLowerCase() === formData.statusCode.toLowerCase() &&
                    (!editingRecord || editingRecord.id !== status.id)
            );

            if (isDuplicate && !editingRecord) {
                showPopup(DUPLICATE_ADMISSION_STATUS, "error");
                setLoading(false);
                return;
            }

            if (editingRecord) {
                const response = await putRequest(`${MAS_ADMISSION_STATUS}/update/${editingRecord.id}`, {
                    statusCode: formData.statusCode,
                });

                if (response && response.status === 200) {
                    fetchAdmissionStatusData();
                    showPopup(UPDATE_ADMISSION_STATUS_SUCC_MSG, "success");
                }
            } else {
                const response = await postRequest(`${MAS_ADMISSION_STATUS}/create`, {
                    statusCode: formData.statusCode,
                });

                if (response && response.status === 200) {
                    fetchAdmissionStatusData();
                    showPopup(ADD_ADMISSION_STATUS_SUCC_MSG, "success");
                }
            }

            setEditingRecord(null);
            setFormData({ statusCode: "" });
            setShowForm(false);
        } catch (err) {
            console.error("Error saving admission status:", err);
            showPopup(FAIL_TO_SAVE_CHANGES, "error");
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
        setConfirmDialog({ isOpen: true, admissionStatusId: id, newStatus });
    };

    const handleConfirm = async (confirmed) => {
        if (confirmed && confirmDialog.admissionStatusId !== null) {
            try {
                setLoading(true);
                const response = await putRequest(
                    `${MAS_ADMISSION_STATUS}/status/${confirmDialog.admissionStatusId}?status=${confirmDialog.newStatus}`
                );
                if (response && response.response) {
                    setAdmissionStatusData((prevData) =>
                        prevData.map((status) =>
                            status.id === confirmDialog.admissionStatusId
                                ? { ...status, status: confirmDialog.newStatus }
                                : status
                        )
                    );
                    showPopup(
                        `Admission Status ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
                        "success"
                    );
                }
            } catch (err) {
                console.error("Error updating admission status:", err);
                showPopup(FAIL_TO_UPDATE_STS, "error");
            } finally {
                setLoading(false);
            }
        }
        setConfirmDialog({ isOpen: false, admissionStatusId: null, newStatus: null });
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [id]: value }));
        setIsFormValid(formData.statusCode.trim() !== "");
    };

    const handleRefresh = () => {
        setSearchQuery("");
        setCurrentPage(1);
        fetchAdmissionStatusData();
    };

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title">Admission Status Master</h4>
                            <div className="d-flex justify-content-between align-items-center">
                                {!showForm ? (
                                    <form className="d-inline-block searchform me-4" role="search">
                                        <div className="input-group searchinput">
                                            <input
                                                type="search"
                                                className="form-control"
                                                placeholder="Search Admission Status"
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

                                <div className="d-flex align-items-center">
                                    {!showForm ? (
                                        <>
                                            <button type="button" className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                                                <i className="mdi mdi-plus"></i> Add
                                            </button>
                                            <button type="button" className="btn btn-success me-2 flex-shrink-0" onClick={handleRefresh}>
                                                <i className="mdi mdi-refresh"></i> Show All
                                            </button>
                                            <button type="button" className="btn btn-success me-2" onClick={() => setShowModal(true)}>
                                                <i className="mdi mdi-plus"></i> Reports
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
                                <>
                                    <div className="table-responsive packagelist">
                                        <table className="table table-bordered table-hover align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Admission Status Name</th>
                                                    <th>Last Updated</th>
                                                    <th>Status</th>
                                                    <th>Edit</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentItems.length > 0 ?
                                                (
                                                currentItems.map((status) => (
                                                    <tr key={status.id}>
                                                        <td>{status.statusCode}</td>
                                                        <td>{status.lastUpdated}</td>
                                                        <td>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={status.status === "y"}
                                                                    onChange={() => handleSwitchChange(status.id, status.status === "y" ? "n" : "y")}
                                                                    id={`switch-${status.id}`}
                                                                />
                                                                <label
                                                                    className="form-check-label px-0"
                                                                    htmlFor={`switch-${status.id}`}
                                                                >
                                                                    {status.status === "y" ? "Active" : "Deactivated"}
                                                                </label>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="btn btn-sm btn-success me-2"
                                                                onClick={() => handleEdit(status)}
                                                                disabled={status.status !== "y"}
                                                            >
                                                                <i className="fa fa-pencil"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ): (
                                                    <tr>
                                                        <td colSpan={4} className="text-center">
                                                            No admission status found
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* PAGINATION USING REUSABLE COMPONENT */}
                                    {filteredAdmissionStatus.length > 0 && (
                                        <Pagination
                                            totalItems={filteredAdmissionStatus.length}
                                            itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                            currentPage={currentPage}
                                            onPageChange={setCurrentPage}
                                        />
                                    )}
                                </>
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="form-group col-md-4">
                                        <label>Admission Status Name<span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control mt-1"
                                            id="statusCode"
                                            placeholder="Enter aadmission status name"
                                            value={formData.statusCode}
                                            onChange={handleInputChange}
                                            maxLength={STATUS_CODE_MAX_LENGTH}
                                            required
                                        />
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
                            {showModal && (
                                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                                    <div className="modal-dialog">
                                        <div className="modal-content">
                                            <div className="modal-header">
                                                <h1 className="modal-title fs-5" id="staticBackdropLabel">Reports</h1>
                                                <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                                            </div>
                                            <div className="modal-body">
                                                {/* Your modal content goes here */}
                                                ...
                                            </div>
                                            <div className="modal-footer">
                                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                                                <button type="button" className="btn btn-primary">Understood</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
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
                                                    <strong>{admissionStatusData.find((status) => status.id === confirmDialog.admissionStatusId)?.statusCode}</strong>?
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

export default AdmissionStatusMaster;