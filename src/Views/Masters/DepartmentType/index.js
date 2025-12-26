import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import axios from "axios";
import { API_HOST, MAS_DEPARTMENT_TYPE } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading";
import { postRequest, putRequest, getRequest } from "../../../service/apiService"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import {FETCH_DEPARTMENT_TYPE_ERR_MSG,UPDATE_DEPARTMENT_TYPE_SUCC_MSG,DUPLICATE_DEPARTMENT_TYPE,ADD_DEPARTMENT_TYPE_SUCC_MSG,
FAIL_TO_SAVE_CHANGES,FAIL_TO_UPDATE_STS
} from "../../../config/constants";

const Departmenttype = () => {
    const [departmentTypes, setDepartmentTypes] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, categoryId: null, newStatus: false });
    const [popupMessage, setPopupMessage] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [isFormValid, setIsFormValid] = useState(false);
    const [formData, setFormData] = useState({
        departmentTypeCode: "",
        departmentTypeName: "",
    });
    const [loading, setLoading] = useState(true);

    const DepartmentType__NAME_MAX_LENGTH = 30;
    const DepartmentType_CODE_MAX_LENGTH = 8;

    useEffect(() => {
        fetchDepartmentTypes(0);
    }, []);

    const fetchDepartmentTypes = async (flag = 0) => {
        try {
            setLoading(true);
            const response = await getRequest(`${MAS_DEPARTMENT_TYPE}/getAll/${flag}`);
            if (response && response.response) {
                setDepartmentTypes(response.response);
            }
        } catch (err) {
            console.error("Error fetching department types:", err);
            showPopup(FETCH_DEPARTMENT_TYPE_ERR_MSG, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const filteredDepartmentTypes = departmentTypes.filter((type) => {
        const query = searchQuery.toLowerCase();
        return (
            type.departmentTypeCode?.toLowerCase().includes(query) ||
            type.departmentTypeName?.toLowerCase().includes(query)
        );
    });

    const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
    const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
    const currentItems = filteredDepartmentTypes.slice(indexOfFirst, indexOfLast);

    const handleEdit = (type) => {
        setEditingType(type);
        setFormData({
            departmentTypeCode: type.departmentTypeCode,
            departmentTypeName: type.departmentTypeName,
        });
        setIsFormValid(true);
        setShowForm(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        try {
            setLoading(true);

            const isDuplicate = departmentTypes.some(
                (type) =>
                    type.departmentTypeCode === formData.departmentTypeCode ||
                    type.departmentTypeName === formData.departmentTypeName
            );

            if (editingType) {
                const response = await putRequest(`${MAS_DEPARTMENT_TYPE}/updateById/${editingType.id}`, {
                    departmentTypeCode: formData.departmentTypeCode,
                    departmentTypeName: formData.departmentTypeName,
                    status: editingType.status,
                });

                if (response && response.response) {
                    setDepartmentTypes((prevData) =>
                        prevData.map((type) =>
                            type.id === editingType.id ? response.response : type
                        )
                    );
                    showPopup(UPDATE_DEPARTMENT_TYPE_SUCC_MSG, "success");
                }
            } else {
                if (isDuplicate) {
                    showPopup(DUPLICATE_DEPARTMENT_TYPE, "error");
                    setLoading(false);
                    return;
                }

                const response = await postRequest(`${MAS_DEPARTMENT_TYPE}/create`, {
                    departmentTypeCode: formData.departmentTypeCode,
                    departmentTypeName: formData.departmentTypeName,
                    status: "y",
                });

                if (response && response.response) {
                    setDepartmentTypes([...departmentTypes, response.response]);
                    showPopup(ADD_DEPARTMENT_TYPE_SUCC_MSG, "success");
                }
            }

            setEditingType(null);
            setFormData({ departmentTypeCode: "", departmentTypeName: "" });
            setShowForm(false);
            fetchDepartmentTypes();
        } catch (err) {
            console.error("Error saving department type:", err);
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
        setConfirmDialog({ isOpen: true, categoryId: id, newStatus });
    };

    const handleConfirm = async (confirmed) => {
        if (confirmed && confirmDialog.categoryId !== null) {
            try {
                setLoading(true);
                const response = await putRequest(
                    `${MAS_DEPARTMENT_TYPE}/status/${confirmDialog.categoryId}?status=${confirmDialog.newStatus}`
                );
                if (response && response.response) {
                    setDepartmentTypes((prevData) =>
                        prevData.map((type) =>
                            type.id === confirmDialog.categoryId
                                ? { ...type, status: confirmDialog.newStatus }
                                : type
                        )
                    );
                    showPopup(
                        `Department type ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
                        "success"
                    );
                }
            } catch (err) {
                console.error("Error updating department type status:", err);
                showPopup(FAIL_TO_UPDATE_STS, "error");
            } finally {
                setLoading(false);
            }
        }
        setConfirmDialog({ isOpen: false, categoryId: null, newStatus: null });
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [id]: value }));
        setIsFormValid(formData.departmentTypeCode.trim() !== "" && formData.departmentTypeName.trim() !== "");
    };

    const handleRefresh = () => {
        setSearchQuery("");
        setCurrentPage(1);
        fetchDepartmentTypes();
    };

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title">Department Type Master</h4>
                            <div className="d-flex justify-content-between align-items-center">
                                {!showForm ? (
                                    <form className="d-inline-block searchform me-4" role="search">
                                        <div className="input-group searchinput">
                                            <input
                                                type="search"
                                                className="form-control"
                                                placeholder="Search Department Type"
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
                                            <button
                                                type="button"
                                                className="btn btn-success me-2"
                                                onClick={() => setShowForm(true)}
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
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => setShowForm(false)}
                                        >
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
                                                    <th>Department Type Name</th>
                                                    <th>Department Type Code</th>
                                                    <th>Status</th>
                                                    <th>Edit</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentItems.map((type) => (
                                                    <tr key={type.id}>
                                                        <td>{type.departmentTypeName}</td>
                                                        <td>{type.departmentTypeCode}</td>
                                                        <td>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={type.status === "y"}
                                                                    onChange={() => handleSwitchChange(type.id, type.status === "y" ? "n" : "y")}
                                                                    id={`switch-${type.id}`}
                                                                />
                                                                <label
                                                                    className="form-check-label px-0"
                                                                    htmlFor={`switch-${type.id}`}
                                                                >
                                                                    {type.status === "y" ? "Active" : "Deactivated"}
                                                                </label>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="btn btn-sm btn-success me-2"
                                                                onClick={() => handleEdit(type)}
                                                                disabled={type.status !== "y"}
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
                                    {filteredDepartmentTypes.length > 0 && (
                                        <Pagination
                                            totalItems={filteredDepartmentTypes.length}
                                            itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                            currentPage={currentPage}
                                            onPageChange={setCurrentPage}
                                        />
                                    )}
                                </>
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="form-group col-md-4">
                                        <label>Department Type Code <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control  mt-1"
                                            id="departmentTypeCode"
                                            name="departmentTypeCode"
                                            placeholder="Code"
                                            value={formData.departmentTypeCode}
                                            maxLength={DepartmentType_CODE_MAX_LENGTH}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-4">
                                        <label>Department Type Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control  mt-1"
                                            id="departmentTypeName"
                                            name="departmentTypeName"
                                            placeholder="Name"
                                            value={formData.departmentTypeName}
                                            onChange={handleInputChange}
                                            maxLength={DepartmentType__NAME_MAX_LENGTH}
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
                                                    <strong>{departmentTypes.find((type) => type.id === confirmDialog.categoryId)?.departmentTypeName}</strong>?
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

export default Departmenttype;