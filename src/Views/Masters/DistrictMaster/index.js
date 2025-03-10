import { useState } from "react";
import Popup from "../../../Components/popup";

const DistrictMaster = () => {
    const [districts, setDistricts] = useState([
        { id: 1, districtCode: "D001", districtName: "Central Delhi", state: "Delhi", status: "y" },
        { id: 2, districtCode: "D002", districtName: "North Delhi", state: "Delhi", status: "y" },
        { id: 3, districtCode: "D003", districtName: "South Delhi", state: "Delhi", status: "y" },
        { id: 4, districtCode: "D004", districtName: "East Delhi", state: "Delhi", status: "y" },
        { id: 5, districtCode: "D005", districtName: "West Delhi", state: "Delhi", status: "y" },
        { id: 6, districtCode: "D006", districtName: "New Delhi", state: "Delhi", status: "y" },
    ]);

    const [pageInput, setPageInput] = useState("");
    const itemsPerPage = 4;

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, districtId: null, newStatus: false });
    const [formData, setFormData] = useState({ districtCode: "", districtName: "", state: "" });
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [editingDistrict, setEditingDistrict] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalFilteredItems, setTotalFilteredItems] = useState(0);
    const DISTRICT_NAME_MAX_LENGTH = 50;

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const filteredDistricts = districts.filter(district =>
        district.districtName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        district.districtCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredTotalPages = Math.ceil(filteredDistricts.length / itemsPerPage);

    const handleEdit = (district) => {
        setEditingDistrict(district);
        setShowForm(true);
    };

    const currentItems = filteredDistricts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSave = (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        const formElement = e.target;
        const updatedDistrictName = formElement.districtName.value;
        const updatedDistrictCode = formElement.districtCode.value;
        const updatedState = formElement.state.value;

        if (editingDistrict) {
            setDistricts(districts.map(district =>
                district.id === editingDistrict.id
                    ? { ...district, districtName: updatedDistrictName, districtCode: updatedDistrictCode, state: updatedState }
                    : district
            ));
        } else {
            const newDistrict = {
                id: districts.length + 1,
                districtCode: updatedDistrictCode,
                districtName: updatedDistrictName,
                state: updatedState,
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
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        const endPage = Math.min(filteredTotalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            pageNumbers.push(1);
            if (startPage > 2) pageNumbers.push("...");
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        if (endPage < filteredTotalPages) {
            if (endPage < filteredTotalPages - 1) pageNumbers.push("...");
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
                            <h4 className="card-title p-2">District Master</h4>
                            <div className="d-flex justify-content-between align-items-spacearound mt-3">
                                {!showForm && (
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
                                                <span style={{ marginLeft: '5px' }}>District Name</span>
                                            </label>
                                        </div>
                                    </div>
                                )}
                                <div className="d-flex align-items-center ms-auto">
                                    {!showForm && (
                                        <>
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
                                            <button type="button" className="btn btn-success me-2" onClick={() => (setShowForm(true))}>
                                                <i className="mdi mdi-plus"></i> ADD
                                            </button>
                                            <button type="button" className="btn btn-success me-2">
                                                <i className="mdi mdi-plus"></i> Generate Report 
                                            </button>
                                        </>
                                    )}
                                    {showForm && (
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
                                                <th>State</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((district) => (
                                                <tr key={district.id}>
                                                    <td>{district.districtCode}</td>
                                                    <td>{district.districtName}</td>
                                                    <td>{district.state}</td>
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
                                </div>
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="row">
                                        <div className="form-group col-md-4 mt-3">
                                            <label>District Code <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="districtCode"
                                                placeholder="District Code"
                                                required
                                                defaultValue={editingDistrict ? editingDistrict.districtCode : ""}
                                                onChange={() => setIsFormValid(true)}
                                            />
                                        </div>
                                        <div className="form-group col-md-4 mt-3">
                                            <label>District Name <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="districtName"
                                                placeholder="District Name"
                                                maxLength={DISTRICT_NAME_MAX_LENGTH}
                                                required
                                                defaultValue={editingDistrict ? editingDistrict.districtName : ""}
                                                onChange={() => setIsFormValid(true)}
                                            />
                                        </div>
                                        <div className="form-group col-md-4 mt-3">
                                            <label>State <span className="text-danger">*</span></label>
                                            <div className="col-md-4">
                                                <select
                                                    className="form-control"
                                                    id="state"
                                                    required
                                                    value={formData.state}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="" disabled>Select</option>
                                                    <option value="Delhi">Delhi</option>
                                                    <option value="Maharashtra">Maharashtra</option>
                                                    <option value="Karnataka">Karnataka</option>
                                                    <option value="Tamil Nadu">Tamil Nadu</option>
                                                </select>
                                            </div>
                                        </div>
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
                            <nav className="d-flex justify-content-between align-items-center mt-3">
                                <div>
                                    <span>
                                        Page {currentPage} of {filteredTotalPages} | Total Records: {filteredDistricts.length}
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

export default DistrictMaster;