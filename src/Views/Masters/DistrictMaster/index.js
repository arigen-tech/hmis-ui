import { useState } from "react";
import Popup from "../../../Components/popup";

const DistrictMaster = () => {
    const [districts, setDistricts] = useState([
        { id: 1, districtCode: "AG", districtName: "Agra", currency: "INR", status: "y" },
        { id: 2, districtCode: "AL", districtName: "Aligarh", currency: "INR", status: "y" },
        { id: 3, districtCode: "BN", districtName: "Bijnor", currency: "INR", status: "y" },
        { id: 4, districtCode: "BR", districtName: "Bareilly", currency: "INR", status: "y" },
        { id: 5, districtCode: "FD", districtName: "Firozabad", currency: "INR", status: "y" },
        { id: 6, districtCode: "GH", districtName: "Ghazipur", currency: "INR", status: "y" },
    ]);

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, districtId: null, newStatus: false });
    const [formData, setFormData] = useState({ districtCode: "", districtName: "", currency: "" });
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [editingDistrict, setEditingDistrict] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [filteredTotalPages, setFilteredTotalPages] = useState(1);
    const [totalFilteredItems, setTotalFilteredItems] = useState(0);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleReset = () => {
        setFormData({ districtCode: "", districtName: "", currency: "" });
        setShowForm(false);
        setEditingDistrict(null); // Reset editing state
    };

    const filteredDistricts = districts.filter(district =>
        district.districtName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        district.districtCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleEdit = (district) => {
        setEditingDistrict(district);
        setShowForm(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        const formElement = e.target;
        const updatedDistrictName = formElement.districtName.value;

        if (editingDistrict) {
            setDistricts(districts.map(district =>
                district.id === editingDistrict.id
                    ? { ...district, districtName: updatedDistrictName }
                    : district
            ));
        } else {
            const newDistrict = {
                id: districts.length + 1,
                districtCode: formData.districtCode,
                districtName: updatedDistrictName,
                currency: formData.currency,
                status: "y"
            };
            setDistricts([...districts, newDistrict]);
        }

        setEditingDistrict(null);
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
        setConfirmDialog({ isOpen: true, districtId: id, newStatus });
    };

    const handleConfirm = (confirmed) => {
        if (confirmed && confirmDialog.districtId !== null) {
            setDistricts((prevData) =>
                prevData.map((district) =>
                    district.id === confirmDialog.districtId ? { ...district, status: confirmDialog.newStatus } : district
                )
            );
        }
        setConfirmDialog({ isOpen: false, districtId: null, newStatus: null });
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [id]: value }));
    };

    const handleCreateFormSubmit = (e) => {
        e.preventDefault();
        if (formData.districtCode && formData.districtName && formData.currency) {
            setDistricts([...districts, { ...formData, id: Date.now(), status: "y" }]);
            setFormData({ districtCode: "", districtName: "", currency: "" });
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
                            <h4 className="card-title p-2">District Master</h4>
                            <div className="d-flex justify-content-between align-items-spacearound mt-3">
                                <div className="d-flex align-items-center">
                                    <div className="me-3">
                                        <label>
                                            <input type="radio" name="searchType" value="code" />
                                            <span style={{ marginLeft: '5px' }}>District Code</span>
                                        </label>
                                    </div>
                                    <div className="me-3">
                                        <label>
                                            <input type="radio" name="searchType" value="description" />
                                            <span style={{ marginLeft: '5px' }}>District Description</span>
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
                                                <th>District Code</th>
                                                <th>District Name</th>
                                                <th>Currency</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredDistricts.map((district) => (
                                                <tr key={district.id}>
                                                    <td>{district.districtCode}</td>
                                                    <td>{district.districtName}</td>
                                                    <td>{district.currency}</td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={district.status === "y"}
                                                                onChange={() => handleSwitchChange(district.id, district.status === "y" ? "n" : "y")}
                                                                id={`switch-${district.id}`}
                                                            />
                                                            <label
                                                                className="form-check-label px-0"
                                                                htmlFor={`switch-${district.id}`}
                                                                onClick={() => handleSwitchChange(district.id, district.status === "y" ? "n" : "y")}
                                                            >
                                                                {district.status === "y" ? 'Active' : 'Deactivated'}
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-success me-2"
                                                            onClick={() => handleEdit(district)}
                                                            disabled={district.status !== "y"}
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
                                            <label>District Code <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="districtCode"
                                                placeholder="District Code"
                                                required
                                            />
                                        </div>
                                        <div className="form-group col-md-4 mt-3">
                                            <label>District Name <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="districtName"
                                                placeholder="District Name"
                                                required
                                            />
                                        </div>
                                        <div className="form-group col-md-4 mt-3">
                                            <label>State <span className="text-danger">*</span></label>
                                            <div className="col-md-4">
                                                <select
                                                    className="form-control"
                                                    id="country"
                                                    required
                                                >
                                                    <option value="" disabled>Select</option>
                                                    <option value="UP">Uttar Pradesh</option>
                                                    <option value="MP">Madhya Pradesh</option>
                                                    <option value="DL">Delhi</option>
                                                    <option value="GJ">Gujrat</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="form-group col-md-6">
                                        <label>District Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="districtName"
                                            name="districtName"
                                            placeholder="Name"
                                            defaultValue={editingDistrict ? editingDistrict.districtName : ""}
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
                                                    Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{districts.find(district => district.id === confirmDialog.districtId)?.districtName}</strong>?
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
                                    <button type="button" className="btn btn-danger" onClick={handleReset}>
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

export default DistrictMaster;