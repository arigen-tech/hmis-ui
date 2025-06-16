import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import LoadingScreen from "../../../Components/Loading/index";
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import { MAS_ITEM_CLASS, MAS_ITEM_SECTION } from "../../../config/apiConfig";

const Itemclass = () => {
    // const [itemClassData, setitemClassData] = useState([
    //     { id: 1, ClassCode: "CL1", ClassName: "TABLET", status: "y" },
    //     { id: 2, ClassCode: "CL2", ClassName: "CAPSULE", status: "n" },
    //     { id: 3, ClassCode: "CL3", ClassName: "INJECTION", status: "y" },
    //     { id: 4, ClassCode: "CL4", ClassName: "CREAM", status: "n" },
    //     { id: 5, ClassCode: "CL5", ClassName: "OINTMENT", status: "y" },
    // ])
    const [formData, setFormData] = useState({ ClassCode: "", ClassName: "", Section: "" })
    const [itemClassData, setItemClassData] = useState([])
    const [itemSectionData, setItemSectionData] = useState([])
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, ClassId: null, newStatus: false })
    const [searchQuery, setSearchQuery] = useState("")
    const [pageInput, setPageInput] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 3
    const [showForm, setShowForm] = useState(false)
    const [isFormValid, setIsFormValid] = useState(false)
    const [loading, setLoading] = useState(false);
    const [process, setProcess] = useState(false);
    const [showModal, setShowModal] = useState(false)
    const [editingClass, setEditingClass] = useState(null)
    const [currentItem, setCurrentItem] = useState(null)

    const [popupMessage, setPopupMessage] = useState(null)

    console.log("formData", confirmDialog);

    useEffect(() => {
        fetchItemClassData();
        fetchItemSectionData();
    }, []);

    const fetchItemClassData = async () => {
        setLoading(true);
        try {
            const data = await getRequest(`${MAS_ITEM_CLASS}/getAll/0`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setItemClassData(data.response);
            } else {
                console.error("Unexpected API response format:", data);
                setItemClassData([]);
            }
        } catch (error) {
            console.error("Error fetching Service Category data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchItemSectionData = async () => {
        setLoading(true);
        try {
            const data = await getRequest(`${MAS_ITEM_SECTION}/getAll/1`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setItemSectionData(data.response);
            } else {
                setItemSectionData([]);
                console.error("Unexpected API response format for sections:", data);
            }
        } catch (error) {
            console.error("Error fetching Item Section data:", error);
        } finally {
            setLoading(false);
        }
    }



    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value)
        setCurrentPage(1)
    }

    const handleInputChange = (e) => {
        const { id, value } = e.target
        setFormData({
            ...formData,
            [id === "itemclasscode" ? "ClassCode" : id === "itemclassdescription" ? "ClassName" : "Section"]: value,
        })
    }

    const filtereditemClassData = itemClassData.filter(
        (Class) =>
            Class.itemClassName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            Class.itemClassCode.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    const filteredTotalPages = Math.ceil(filtereditemClassData.length / itemsPerPage)
    const currentItems = filtereditemClassData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const handlePageNavigation = () => {
        const pageNumber = Number.parseInt(pageInput, 10)
        if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
            setCurrentPage(pageNumber)
        } else {
            alert("Please enter a valid page number.")
        }
    }

    const renderPagination = () => {
        const pageNumbers = []
        const maxVisiblePages = 5
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
        const endPage = Math.min(filteredTotalPages, startPage + maxVisiblePages - 1)

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1)
        }

        if (startPage > 1) {
            pageNumbers.push(1)
            if (startPage > 2) pageNumbers.push("...")
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i)
        }

        if (endPage < filteredTotalPages) {
            if (endPage < filteredTotalPages - 1) pageNumbers.push("...")
            pageNumbers.push(filteredTotalPages)
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
        ))
    }

    const handleEdit = (item) => {
        setEditingClass(item);
        setShowForm(true);
        setFormData({
            ClassName: item.itemClassName,
            ClassCode: item.itemClassCode,
            Section: item.sectionId,
        });
        setIsFormValid(true);
    };


    const handleSave = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        setProcess(true);
        try {
            let response;
            const payload = {
                itemClassCode: formData.ClassCode,
                itemClassName: formData.ClassName,
                sectionId: formData.Section,
            };

            if (editingClass) {
                response = await putRequest(`${MAS_ITEM_CLASS}/updateById/${editingClass.itemClassId}`, payload);
            } else {
                response = await postRequest(`${MAS_ITEM_CLASS}/create`, payload);
            }

            if (response.status === 200) {
                showPopup(
                    editingClass
                        ? "Item Class updated successfully!"
                        : "New Item Class added successfully!",
                    "success"
                );

                await fetchItemClassData();

                setEditingClass(null);
                setShowForm(false);
                setFormData({
                    serviceCatName: "",
                    sacCode: "",
                    gstApplicable: false,
                });
            } else {
                throw new Error(response.message || 'Failed to save item class');
            }
        } catch (error) {
            console.error("Error saving item class:", error);
            showPopup(error.message || "Error saving item class. Please try again.", "error");
        } finally {
            setProcess(false);
        }
    };




    const showPopup = (message, type = "info") => {
        setPopupMessage({
            message,
            type,
            onClose: () => {
                setPopupMessage(null)
            },
        })
    }



    const handleSwitchChange = (id, name, newStatus) => {
        setCurrentItem(name);
        setConfirmDialog({ isOpen: true, ClassId: id, newStatus });
    }

    const handleConfirm = async (confirmed) => {
        if (confirmed && confirmDialog.ClassId !== null) {
            setProcess(true);
            try {
                const response = await putRequest(
                    `${MAS_ITEM_CLASS}/status/${confirmDialog.ClassId}?status=${confirmDialog.newStatus}`
                );

                if (response.status === 200) {
                    showPopup(
                        `Service Category ${confirmDialog.newStatus === 'y' ? 'activated' : 'deactivated'} successfully!`,
                        "success"
                    );
                    await fetchItemClassData();
                } else {
                    throw new Error(response.message || "Failed to update status");
                }
            } catch (error) {
                console.error("Error updating status:", error);
                showPopup(error.message || "Error updating status. Please try again.", "error");
            } finally {
                setProcess(false);
            }
            setConfirmDialog({ isOpen: false, ClassId: null, newStatus: null });
        } else {
            setConfirmDialog({ isOpen: false, ClassId: null, newStatus: null });
        }
    }




    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header">
                            <h4 className="card-title p-2">Item Class Master</h4>
                            {!showForm && (
                                <div className="d-flex justify-content-between align-items-center mt-3">
                                    
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
                                        <button type="button" className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                                            <i className="mdi mdi-plus"></i> Add
                                        </button>
                                        <button type="button" className="btn btn-success me-2">
                                            <i className="mdi mdi-plus"></i> Generate Report
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="card-body">
                            {!showForm ? (
                                <div className="table-responsive packagelist">
                                    <table className="table table-bordered table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Item Class Code</th>
                                                <th>Item Class Name</th>
                                                <th>Section</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((Class) => (
                                                <tr key={Class.itemClassId}>
                                                    <td>{Class.itemClassCode}</td>
                                                    <td>{Class.itemClassName}</td>
                                                    <td>{Class.sectionName}</td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={Class.status === "y"}
                                                                onChange={() => handleSwitchChange(Class.itemClassId, Class.itemClassName, Class.status === "y" ? "n" : "y")}
                                                                id={`switch-${Class.id}`}
                                                            />
                                                            <label className="form-check-label px-0" htmlFor={`switch-${Class.id}`}>
                                                                {Class.status === "y" ? "Active" : "Deactivated"}
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
                                    <nav className="d-flex justify-content-between align-items-center mt-3">
                                        <div>
                                            <span>
                                                Page {currentPage} of {filteredTotalPages} | Total Records: {filtereditemClassData.length}
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
                                            <button className="btn btn-primary" onClick={handlePageNavigation}>
                                                Go
                                            </button>
                                        </div>
                                    </nav>
                                </div>
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="d-flex justify-content-end">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                            <i className="mdi mdi-arrow-left"></i> Back
                                        </button>
                                    </div>
                                    <div className="row">
                                        <div className="form-group col-md-4 mt-3">
                                            <label>
                                                {" "}
                                                Item Class Code
                                                <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="itemclasscode"
                                                placeholder="Class Code"
                                                value={formData.ClassCode}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="form-group col-md-4 mt-3">
                                            <label>
                                                Item Class Description <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="itemclassdescription"
                                                placeholder="Item Class Description"
                                                value={formData.ClassName}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="form-group col-md-4 mt-3">
                                            <label>
                                                Section <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className="form-select"
                                                id="section"
                                                value={formData.Section}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="">Select Item Section</option>
                                                {itemSectionData.map((sec) => (
                                                    <option key={sec.sectionId} value={sec.sectionId}>
                                                        {sec.sectionName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                                        <button
                                            type="submit"
                                            className="btn btn-primary me-2"
                                            disabled={process || !isFormValid}
                                        >
                                            {editingClass ? 'Update' : 'Save'}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={() => setShowForm(false)}
                                            disabled={process}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                            {showModal && (
                                <div
                                    className="modal fade show"
                                    style={{ display: "block" }}
                                    tabIndex="-1"
                                    aria-labelledby="staticBackdropLabel"
                                    aria-hidden="true"
                                >
                                    <div className="modal-dialog">
                                        <div className="modal-content">
                                            <div className="modal-header">
                                                <h1 className="modal-title fs-5" id="staticBackdropLabel">
                                                    Modal title
                                                </h1>
                                                <button
                                                    type="button"
                                                    className="btn-close"
                                                    onClick={() => setShowModal(false)}
                                                    aria-label="Close"
                                                ></button>
                                            </div>
                                            <div className="modal-body">...</div>
                                            <div className="modal-footer">
                                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                                    Close
                                                </button>
                                                <button type="button" className="btn btn-primary">
                                                    Understood
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {popupMessage && (
                                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
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
                                                    <strong>
                                                        {currentItem}
                                                    </strong>
                                                    ?
                                                </p>
                                            </div>
                                            <div className="modal-footer">
                                                <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>
                                                    No
                                                </button>
                                                <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>
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
    )
}

export default Itemclass

