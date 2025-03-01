import { useState } from "react";
import Popup from "../../../Components/popup";

const Itemunit = () => {
    const [itemType, setItemType] = useState([
        { id: 1, itemType: "%", status: "y" },
        { id: 2, itemType: "%", status: "y" },
        { id: 3, itemType: "/", status: "y" },
        { id: 4, itemType: "/", status: "y" },
        { id: 5, itemType: "Bottle", status: "y" },
    ]);

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, itemTypeId: null, newStatus: false });
    const [formData, setFormData] = useState({
        itemType: "",
        itemTypeCode: "",
        itemTypeName: "",
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [editingitemType, setEditingitemType] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [filteredTotalPages, setFilteredTotalPages] = useState(1);
    const [totalFilteredItems, setTotalFilteredItems] = useState(0);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const filteredItemType = itemType.filter(item =>
        item.itemType.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleEdit = (itemType) => {
        setEditingitemType(itemType);
        setShowForm(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        const formElement = e.target;
        const updateditemTypeName = formElement.itemTypeName.value;

        if (editingitemType) {
            setItemType(itemType.map(itemType =>
                itemType.id === editingitemType.id
                    ? { ...itemType, itemTypeName: updateditemTypeName }
                    : itemType
            ));
        } else {
            const newitemType = {
                id: itemType.length + 1,
                itemType: formData.itemType,
                itemTypeCode: formData.itemTypeCode,
                itemTypeName: updateditemTypeName,
                status: "y"
            };
            setItemType([...itemType, newitemType]);
        }

        setEditingitemType(null);
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
        setConfirmDialog({ isOpen: true, itemTypeId: id, newStatus });
    };

    const handleConfirm = (confirmed) => {
        if (confirmed && confirmDialog.itemTypeId !== null) {
            setItemType((prevData) =>
                prevData.map((itemType) =>
                    itemType.id === confirmDialog.itemTypeId ? { ...itemType, status: confirmDialog.newStatus } : itemType
                )
            );
        }
        setConfirmDialog({ isOpen: false, itemTypeId: null, newStatus: null });
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [id]: value }));
    };

    const handleCreateFormSubmit = (e) => {
        e.preventDefault();
        if (formData.itemType && formData.itemTypeCode && formData.itemTypeName) {
            setItemType([...itemType, { ...formData, id: Date.now(), status: "y" }]);
            setFormData({ itemType: "", itemTypeCode: "", itemTypeName: "" });
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
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title p-2">Item Unit Master</h4>
                            <div className="d-flex justify-content-between align-items-center mt-3">

                                <form className="d-inline-block searchform me-4" role="search">
                                    <div className="input-group searchinput">
                                        <input
                                            type="search"
                                            className="form-control"
                                            placeholder="Search Unit Master"
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
                                        <i className="mdi mdi-plus"></i> Generate Report
                                    </button>
                                ) : (
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                        <i className="mdi mdi-arrow-left"></i> Back
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="card-body">
                            {!showForm ? (
                                <div className="table-responsive packagelist">
                                    <table className="table table-bordered table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Unit Name</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredItemType.map((itemType) => (
                                                <tr key={itemType.id}>
                                                    <td>{itemType.itemType}</td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={itemType.status === "y"}
                                                                onChange={() => handleSwitchChange(itemType.id, itemType.status === "y" ? "n" : "y")}
                                                                id={`switch-${itemType.id}`}
                                                            />
                                                            <label
                                                                className="form-check-label px-0"
                                                                htmlFor={`switch-${itemType.id}`}
                                                                onClick={() => handleSwitchChange(itemType.id, itemType.status === "y" ? "n" : "y")}
                                                            >
                                                                {itemType.status === "y" ? 'Active' : 'Deactivated'}
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-success me-2"
                                                            onClick={() => handleEdit(itemType)}
                                                            disabled={itemType.status !== "y"}
                                                        >
                                                            <i className="fa fa-pencil"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="row ">
                                        <div className="col-md-4 d-flex align-items-center">
                                            <label htmlFor="unitname" className="me-2  flex-shrink-0">Unit Name</label>
                                            <input
                                                type="text"
                                                id="unitname"
                                                className="form-control"
                                                placeholder="Unit Name"
                                                defaultValue=""
                                            />
                                        </div>
                                    </div>
                                    
                                
                                </div>
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="form-group col-md-6">
                                        <label>Item itemType Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="itemTypeName"
                                            name="itemTypeName"
                                            placeholder="Name"
                                            defaultValue={editingitemType ? editingitemType.itemTypeName : ""}
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
                                                    Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{itemType.find(itemType => itemType.id === confirmDialog.itemTypeId)?.itemTypeName}</strong>?
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

                                    <button type="button" className="btn btn-danger" onClick={() => {
                                        setFormData({ itemType: "", itemTypeCode: "", itemTypeName: "" });
                                        setShowForm(false);
                                    }}>
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
                                        className="form-control "
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

export default Itemunit;