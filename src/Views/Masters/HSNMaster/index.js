import { useState } from "react"
import Popup from "../../../Components/popup"


const HSNMaster = () => {
    const [hsnList, setHsnList] = useState([
        {
            id: 1,
            hsn_code: "30049011",
            gst_rate: 5.0,
            is_medicine: true,
            hsn_category: "Pharmaceutical Products",
            hsn_subcategory: "Medicine",
            effective_from: "2020-07-01",
            effective_to: "2021-09-02",
            status: "y",
        },
        {
            id: 2,
            hsn_code: "30029030",
            gst_rate: 5.0,
            is_medicine: true,
            hsn_category: "Pharmaceutical Products",
            hsn_subcategory: "Vaccine",
            effective_from: "2021-01-01",
            effective_to: "2021-09-02",
            status: "y",
        },
        {
            id: 3,
            hsn_code: "21069020",
            gst_rate: 18.0,
            is_medicine: false,
            hsn_category: "Health & Nutrition",
            hsn_subcategory: "Supplement",
            effective_from: "2021-09-02",
            effective_to: "2021-09-02",
            status: "y",
        },
        {
            id: 4,
            hsn_code: "30045010",
            gst_rate: 12.0,
            is_medicine: true,
            hsn_category: "Pharmaceutical Products",
            hsn_subcategory: "Medicine",
            effective_from: "2018-07-01",
            effective_to: "2021-09-02",
            status: "y",
        },
        {
            id: 5,
            hsn_code: "30063000",
            gst_rate: 12.0,
            is_medicine: true,
            hsn_category: "Pharmaceutical Products",
            hsn_subcategory: "Medicine",
            effective_from: "2018-07-01",
            effective_to: "2021-09-02",
            status: "n",
        },
    ])


    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, hsnId: null, newStatus: false })
    const [formData, setFormData] = useState({
        hsnCode: "",
        gstRate: "",
        isMedicine: false,
        hsnCategory: "",
        hsnSubcategory: "",
        effectiveFrom: "",
        effectiveTo: "",
    })
    const [searchQuery, setSearchQuery] = useState("")
    const [showForm, setShowForm] = useState(false)
    const [isFormValid, setIsFormValid] = useState(false)
    const [editingHsn, setEditingHsn] = useState(null)
    const [popupMessage, setPopupMessage] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageInput, setPageInput] = useState("")
    const itemsPerPage = 5

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value)
        setCurrentPage(1)
    }

    const filteredHsnList = hsnList.filter(
        (item) =>
            item.hsn_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.hsn_category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.hsn_subcategory.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    const filteredTotalPages = Math.ceil(filteredHsnList.length / itemsPerPage)

    const currentItems = filteredHsnList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const handleEdit = (item) => {
        setEditingHsn(item)
        setShowForm(true)
        setFormData({
            hsnCode: item.hsn_code,
            gstRate: item.gst_rate.toString(),
            isMedicine: item.is_medicine,
            hsnCategory: item.hsn_category,
            hsnSubcategory: item.hsn_subcategory,
            effectiveFrom: item.effective_from,
            effectiveTo: item.effective_to || "",
        })
        setIsFormValid(true)
    }

    const handleSave = (e) => {
        e.preventDefault()
        if (!isFormValid) return

        if (editingHsn) {
            setHsnList(
                hsnList.map((item) =>
                    item.id === editingHsn.id
                        ? {
                            ...item,
                            hsn_code: formData.hsnCode,
                            gst_rate: Number.parseFloat(formData.gstRate),
                            is_medicine: formData.isMedicine,
                            hsn_category: formData.hsnCategory,
                            hsn_subcategory: formData.hsnSubcategory,
                            effective_from: formData.effectiveFrom,
                            effective_to: formData.effectiveTo || null,
                        }
                        : item,
                ),
            )
            showPopup("HSN Code updated successfully!", "success")
        } else {
            const newHsn = {
                id: Date.now(),
                hsn_code: formData.hsnCode,
                gst_rate: Number.parseFloat(formData.gstRate),
                is_medicine: formData.isMedicine,
                hsn_category: formData.hsnCategory,
                hsn_subcategory: formData.hsnSubcategory,
                effective_from: formData.effectiveFrom,
                effective_to: formData.effectiveTo || null,
                status: "y",
            }
            setHsnList([...hsnList, newHsn])
            showPopup("New HSN Code added successfully!", "success")
        }

        setEditingHsn(null)
        setShowForm(false)
        setFormData({
            hsnCode: "",
            gstRate: "",
            isMedicine: false,
            hsnCategory: "",
            hsnSubcategory: "",
            effectiveFrom: "",
            effectiveTo: "",
        })
    }

    const showPopup = (message, type = "info") => {
        setPopupMessage({
            message,
            type,
            onClose: () => {
                setPopupMessage(null)
            },
        })
    }

    const handleSwitchChange = (id, newStatus) => {
        setConfirmDialog({ isOpen: true, hsnId: id, newStatus })
    }

    const handleConfirm = (confirmed) => {
        if (confirmed && confirmDialog.hsnId !== null) {
            setHsnList((prevData) =>
                prevData.map((item) => (item.id === confirmDialog.hsnId ? { ...item, status: confirmDialog.newStatus } : item)),
            )
        }
        setConfirmDialog({ isOpen: false, hsnId: null, newStatus: null })
    }

    const handleInputChange = (e) => {
        const { id, value } = e.target
        setFormData((prevData) => ({ ...prevData, [id]: value }))

        const updatedFormData = { ...formData, [id]: value }
        setIsFormValid(
            !!updatedFormData.hsnCode &&
            !!updatedFormData.gstRate &&
            !!updatedFormData.hsnCategory &&
            !!updatedFormData.hsnSubcategory &&
            !!updatedFormData.effectiveFrom,
        )
    }

    const handleSelectChange = (e) => {
        const { id, value } = e.target
        setFormData((prevData) => ({ ...prevData, [id]: value }))

        const updatedFormData = { ...formData, [id]: value }
        setIsFormValid(
            !!updatedFormData.hsnCode &&
            !!updatedFormData.gstRate &&
            !!updatedFormData.hsnCategory &&
            !!updatedFormData.hsnSubcategory &&
            !!updatedFormData.effectiveFrom,
        )
    }

    

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

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title p-2">HSN Master</h4>

                            <div className="d-flex justify-content-between align-items-center">
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
                                        <button type="button" className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                                            <i className="mdi mdi-plus"></i> Add
                                        </button>
                                        <button type="button" className="btn btn-success me-2">
                                            <i className="mdi mdi-plus"></i> Generate Report
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="card-body">
                            {!showForm ? (
                                <div className="table-responsive packagelist">
                                    <table className="table table-bordered table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>HSN Code</th>
                                                <th>GST Rate (%)</th>
                                                <th>Is Medicine</th>
                                                <th>HSN Category</th>
                                                <th>HSN Subcategory</th>
                                                <th>Effective From</th>
                                                <th>Effective To</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((item) => (
                                                <tr key={item.id}>
                                                    <td>{item.hsn_code}</td>
                                                    <td>{item.gst_rate.toFixed(2)}</td>
                                                    <td style={{ textTransform: "uppercase" }}>{item.is_medicine ? "TRUE" : "FALSE"}</td>
                                                    <td>{item.hsn_category}</td>
                                                    <td>{item.hsn_subcategory}</td>
                                                    <td>{item.effective_from}</td>
                                                    <td>{item.effective_to || "NULL"}</td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={item.status === "y"}
                                                                onChange={() => handleSwitchChange(item.id, item.status === "y" ? "n" : "y")}
                                                                id={`switch-${item.id}`}
                                                            />
                                                            <label
                                                                className="form-check-label px-0"
                                                                htmlFor={`switch-${item.id}`}
                                                                onClick={() => handleSwitchChange(item.id, item.status === "y" ? "n" : "y")}
                                                            >
                                                                {item.status === "y" ? "Active" : "Deactivated"}
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-success me-2"
                                                            onClick={() => handleEdit(item)}
                                                            disabled={item.status !== "y"}
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
                                    <div className="d-flex justify-content-end">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                            <i className="mdi mdi-arrow-left"></i> Back
                                        </button>
                                    </div>
                                    <div className="row">
                                        <div className="form-group col-md-4 mt-3">
                                            <label>
                                                HSN Code <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="hsnCode"
                                                placeholder="HSN Code"
                                                onChange={handleInputChange}
                                                value={formData.hsnCode}
                                                required
                                            />
                                        </div>
                                        <div className="form-group col-md-4 mt-3">
                                            <label>
                                                GST Rate (%) <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="form-control"
                                                id="gstRate"
                                                placeholder="GST Rate"
                                                onChange={handleInputChange}
                                                value={formData.gstRate}
                                                required
                                            />
                                        </div>
                                        <div className="form-group col-md-4 mt-3">
                                            <label>
                                                Is Medicine <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className="form-select"
                                                id="isMedicine"
                                                value={formData.isMedicine ? "true" : "false"}
                                                onChange={(e) => setFormData({ ...formData, isMedicine: e.target.value === "true" })}
                                                required
                                            >
                                                <option value="">Select</option>
                                                <option value="true">Yes</option>
                                                <option value="false">No</option>
                                            </select>
                                        </div>
                                        <div className="form-group col-md-4 mt-3">
                                            <label>
                                                HSN Category <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="hsnCategory"
                                                placeholder="Enter HSN Category"
                                                onChange={handleInputChange}
                                                value={formData.hsnCategory}
                                                required
                                            />
                                        </div>
                                        <div className="form-group col-md-4 mt-3">
                                            <label>
                                                HSN Subcategory <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="hsnSubcategory"
                                                placeholder="Enter HSN Subcategory"
                                                onChange={handleInputChange}
                                                value={formData.hsnSubcategory}
                                                required
                                            />
                                        </div>
                                        <div className="form-group col-md-4 mt-3">
                                            <label>
                                                Effective From <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                id="effectiveFrom"
                                                onChange={handleInputChange}
                                                value={formData.effectiveFrom}
                                                required
                                            />
                                        </div>
                                        <div className="form-group col-md-4 mt-3">
                                            <label>Effective To</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                id="effectiveTo"
                                                onChange={handleInputChange}
                                                value={formData.effectiveTo}
                                            />
                                        </div>
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
                                                    <strong>{hsnList.find((item) => item.id === confirmDialog.hsnId)?.hsn_code}</strong>?
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
                            {popupMessage && (
                                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
                            )}
                            {!showForm && (
                                <nav className="d-flex justify-content-between align-items-center mt-3">
                                    <div>
                                        <span>
                                            Page {currentPage} of {filteredTotalPages} | Total Records: {filteredHsnList.length}
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
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HSNMaster
