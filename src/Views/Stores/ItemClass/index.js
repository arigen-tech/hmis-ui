import { useState } from "react"
import Popup from "../../../Components/popup";


const Itemclass = () => {

    const [itemClassData, setitemClassData] = useState([
        { id: 1, ClassCode: "CL1", ClassName: "TABLET", status: "y" },
        { id: 2, ClassCode: "CL2", ClassName: "CAPSULE", status: "n" },
        { id: 3, ClassCode: "CL3", ClassName: "INJECTION", status: "y" },
        { id: 4, ClassCode: "CL4", ClassName: "CREAM", status: "n" },
        { id: 5, ClassCode: "CL5", ClassName: "OINTMENT", status: "y" },
    ]);

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, ClassId: null, newStatus: false });

    const [formData, setFormData] = useState({
        ClassCode: "",
        ClassName: "",
    })
    const [searchQuery, setSearchQuery] = useState("");
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };
    const filtereditemClassData = itemClassData.filter(Class =>
        Class.ClassName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        Class.ClassCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleEdit = (Class) => {
        setEditingClass(Class);
        setShowForm(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        const formElement = e.target;
        const updatedClassName = formElement.ClassName.value;

        if (editingClass) {
            setitemClassData(itemClassData.map(Class =>
                Class.id === editingClass.id
                    ? { ...Class, ClassName: updatedClassName }
                    : Class
            ));
        } else {
            const newClass = {
                id: itemClassData.length + 1,
                ClassCode: formData.ClassCode,
                ClassName: updatedClassName,
                status: "y"
            };
            setitemClassData([...itemClassData, newClass]);
        }

        setEditingClass(null);
        setShowForm(false);
        showPopup("Changes saved successfully!", "success");
    };
    const [showForm, setShowForm] = useState(false)
    const [isFormValid, setIsFormValid] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);

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
        setConfirmDialog({ isOpen: true, ClassId: id, newStatus });

    };
    const handleConfirm = (confirmed) => {
        if (confirmed && confirmDialog.ClassId !== null) {
            setitemClassData((prevData) =>
                prevData.map((Class) =>
                    Class.id === confirmDialog.ClassId ? { ...Class, status: confirmDialog.newStatus } : Class
                )
            );
        }
        setConfirmDialog({ isOpen: false, ClassId: null, newStatus: null });
    };
    const [currentPage, setCurrentPage] = useState(1);
    const [filteredTotalPages, setFilteredTotalPages] = useState(1);
    const [totalFilteredProducts, setTotalFilteredProducts] = useState(0);

    const handleInputChange = (e) => {
        const { id, value } = e.target
        setFormData((prevData) => ({ ...prevData, [id]: value }))
    }

    const handleCreateFormSubmit = (e) => {
        e.preventDefault()
        if (formData.ClassCode && formData.ClassName) {
            setitemClassData([...itemClassData, { ...formData, id: Date.now(), status: "y" }])
            setFormData({ ClassCode: "", ClassName: "" })
            setShowForm(false)
        } else {
            alert("Please fill out all required fields.")
        }
    }

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header">
                            <h4 className="card-title p-2">Item Class Master</h4>
                            <div className="d-flex justify-content-between align-items-center mt-3">
                                <div className="d-flex align-items-center">
                                    <div className="me-3">
                                        <label>
                                            <input
                                                type="radio"
                                                name="searchType"
                                                value="code"
                                            />
                                            <span style={{ marginLeft: '5px' }}>Item Class Code</span>
                                        </label>
                                    </div>
                                    <div className="me-3">
                                        <label>
                                            <input
                                                type="radio"
                                                name="searchType"
                                                value="description"
                                            />
                                            <span style={{ marginLeft: '5px' }}>Item Class Description</span>
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
                                            <i className="mdi mdi-plus"></i> Generate Report
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
                                                <th>Item Class Category</th>
                                                <th>Item Class Description</th>
                                                <th>Section</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtereditemClassData.map((Class) => (
                                                <tr key={Class.id}>
                                                    <td>{Class.ClassCode}</td>
                                                    <td>{Class.ClassName}</td>
                                                    <td>DRUGS</td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={Class.status === "y"}
                                                                onChange={() => handleSwitchChange(Class.id, Class.status === "y" ? "n" : "y")}
                                                                id={`switch-${Class.id}`}
                                                            />
                                                            <label
                                                                className="form-check-label px-0"
                                                                htmlFor={`switch-${Class.id}`}
                                                            >
                                                                {Class.status === "y" ? 'Active' : 'Deactivated'}
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-success me-2"
                                                            onClick={() => handleEdit(Class)}
                                                            disabled={Class.status !== "y"}
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
                                            <label> Item Class Code
                                                <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="itemclasscode"
                                                placeholder="Class Code"
                                                required
                                            />
                                        </div>
                                        <div className="form-group col-md-4 mt-3">
                                            <label>Item Class Description <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="Item Class Description"
                                                placeholder="Item Class Description"
                                                required
                                            />
                                        </div>
                                        <div className="form-group col-md-4 mt-3">
                                            <label>Section <span className="text-danger">*</span></label>
                                            <div className="col-md-4">
                                                <select
                                                    className="form-control"
                                                    id="templateSelect"
                                                    required
                                                >
                                                    <option value="" disabled>Select Template</option>

                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="form-group col-md-6">
                                        <label>Class Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="ClassName"
                                            name="ClassName"
                                            placeholder="Name"
                                            defaultValue={editingClass ? editingClass.ClassName : ""}
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
                            {showModal && (
                                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                                    <div className="modal-dialog">
                                        <div className="modal-content">
                                            <div className="modal-header">
                                                <h1 className="modal-title fs-5" id="staticBackdropLabel">Modal title</h1>
                                                <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                                            </div>
                                            <div className="modal-body">

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
                                                    Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{itemClassData.find(Class => Class.id === confirmDialog.ClassId)?.ClassName}</strong>?
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
                                <div className="d-flex justify-content-start mt-3 mb-2">
                                    <button type="button" className="btn btn-warning me-2" onClick={() => setShowForm(true)}>
                                        <i className="mdi mdi-plus"></i> Add
                                    </button>
                                    <button type="button" className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                                        <i className="mdi mdi-plus"></i> Activate
                                    </button>
                                    <button type="button" className="btn btn-danger" onClick={() => {
                                        setFormData({ ClassCode: "", ClassName: "" });
                                        setShowForm(false);
                                    }}>
                                        <i className="mdi mdi-refresh"></i> Reset
                                    </button>
                                </div>
                            )

                            }

<div className="row mb-3"> {/* Added margin-bottom for spacing */}
    <div className="col-md-4 d-flex align-items-center"> {/* Flexbox for alignment */}
        <label htmlFor="changedBy" className="me-2 flex-shrink-0">Changed By</label> {/* Added margin-right for spacing */}
        <input
            type="text"
            id="changedBy"
            className="form-control"
            placeholder="Enter Changed By"
            defaultValue="54321" // Default value as per your request
        />
    </div>
    <div className="col-md-4 d-flex align-items-center"> {/* Flexbox for alignment */}
        <label htmlFor="changedDate" className="me-2 flex-shrink-0">Changed Date</label> {/* Added margin-right for spacing */}
        <input
            type="date"
            id="changedDate"
            className="form-control"
            defaultValue="2025-02-28" // Default value as per your request
        />
    </div>
    <div className="col-md-4 d-flex align-items-center"> {/* Flexbox for alignment */}
        <label htmlFor="changedTime" className="me-2 flex-shrink-0">Changed Time</label> {/* Added margin-right for spacing */}
        <input
            type="time"
            id="changedTime"
            className="form-control"
            defaultValue="12:33" // Default value as per your request
        />
    </div>
</div>
                            <nav className="d-flex justify-content-between align-items-center mt-3">
                                <div>
                                    <span>
                                        Page {currentPage} of {filteredTotalPages} | Total Records: {totalFilteredProducts}
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
    )
}

export default Itemclass;

