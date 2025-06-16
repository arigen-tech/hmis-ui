"use client"

import { useState } from "react"
import Popup from "../../../Components/popup"

const ItemCategory = () => {
    const [itemCategories, setItemCategories] = useState([
        { id: 1, sectionType: "DRUGS", categoryCode: "CA1", categoryName: "ANAESTHETICS - LOCAL & GENERAL", status: "y" },
        {
            id: 2,
            sectionType: "DRUGS",
            categoryCode: "CA2",
            categoryName: "CNS DISEASES AND PSYCHOTHERAPEUTIC DRUGS",
            status: "y",
        },
        {
            id: 3,
            sectionType: "DRUGS",
            categoryCode: "CA3",
            categoryName: "PAIN FEVER GOUT RHEUMATOID ARTHRITIS AND MIGRAINE DRUGS",
            status: "y",
        },
        {
            id: 4,
            sectionType: "DRUGS",
            categoryCode: "CA4",
            categoryName: "ALLERGIC DISORDERS AND OTHER RESPIRATORY DISEASES DRUGS",
            status: "y",
        },
        {
            id: 5,
            sectionType: "DRUGS",
            categoryCode: "CA5",
            categoryName: "ANTI-INFECTIVE AGENTS",
            status: "y"
        },
    ])

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, categoryId: null, newStatus: false })
    const [formData, setFormData] = useState({
        sectionType: "",
        categoryCode: "",
        categoryName: "",
    })
    const [searchQuery, setSearchQuery] = useState("")
    const [showForm, setShowForm] = useState(false)
    const [isFormValid, setIsFormValid] = useState(false)
    const [editingCategory, setEditingCategory] = useState(null)
    const [popupMessage, setPopupMessage] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalFilteredItems, setTotalFilteredItems] = useState(0)
    const [pageInput, setPageInput] = useState("")
    const itemsPerPage = 3

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value)
        setCurrentPage(1)
    }

    const filteredItemCategories = itemCategories.filter(
        (category) =>
            category.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            category.categoryCode.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    const filteredTotalPages = Math.ceil(filteredItemCategories.length / itemsPerPage)

    const currentItems = filteredItemCategories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const handleEdit = (category) => {
        setEditingCategory(category.id)
        setShowForm(true)
        setFormData({
            categoryCode: category.categoryCode,
            categoryName: category.categoryName,
            sectionType: category.sectionType,
        })
        setIsFormValid(true)
    }

    const handleSave = (e) => {
        e.preventDefault()

        if (editingCategory) {
            setItemCategories(
                itemCategories.map((category) =>
                    category.id === editingCategory
                        ? {
                            ...category,
                            categoryName: formData.categoryName,
                            categoryCode: formData.categoryCode,
                            sectionType: formData.sectionType,
                        }
                        : category,
                ),
            )
            showPopup("Category updated successfully!", "success")
        } else {
            const newCategory = {
                id: Date.now(),
                sectionType: formData.sectionType,
                categoryCode: formData.categoryCode,
                categoryName: formData.categoryName,
                status: "y",
            }
            setItemCategories([...itemCategories, newCategory])
            showPopup("New category added successfully!", "success")
        }

        setEditingCategory(null)
        setShowForm(false)
        setFormData({ sectionType: "", categoryCode: "", categoryName: "" })
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
        setConfirmDialog({ isOpen: true, categoryId: id, newStatus })
    }

    const handleConfirm = (confirmed) => {
        if (confirmed && confirmDialog.categoryId !== null) {
            setItemCategories((prevData) =>
                prevData.map((category) =>
                    category.id === confirmDialog.categoryId ? { ...category, status: confirmDialog.newStatus } : category,
                ),
            )
        }
        setConfirmDialog({ isOpen: false, categoryId: null, newStatus: null })
    }

    const handleInputChange = (e) => {
        const { id, value } = e.target
        const fieldMapping = {
            itemcategorycode: "categoryCode",
            itemcategoryname: "categoryName",
            SectionType: "sectionType",
            templateSelect: "sectionType",
        }

        setFormData({
            ...formData,
            [fieldMapping[id] || id]: value,
        })

        // Check if all required fields have values
        const updatedFormData = { ...formData, [fieldMapping[id] || id]: value }
        setIsFormValid(!!updatedFormData.sectionType && !!updatedFormData.categoryCode && !!updatedFormData.categoryName)
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
                        <div className="card-header">
                            <h4 className="card-title p-2">Item Category</h4>
                            {!showForm && (
                                <div className="d-flex justify-content-between align-items-spacearound mt-3">
                                    <div className="d-flex align-items-center">
                                        <div className="me-3">
                                            <label>
                                                <input type="radio" name="searchType" value="code" />
                                                <span style={{ marginLeft: "5px" }}>Item Category Code</span>
                                            </label>
                                        </div>
                                        <div className="me-3">
                                            <label>
                                                <input type="radio" name="searchType" value="description" />
                                                <span style={{ marginLeft: "5px" }}>Item Category Name</span>
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
                                                <th>Section Type</th>
                                                <th>Item Category Code</th>
                                                <th>Item Category Name</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((category) => (
                                                <tr key={category.id}>
                                                    <td>{category.sectionType}</td>
                                                    <td>{category.categoryCode}</td>
                                                    <td>{category.categoryName}</td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={category.status === "y"}
                                                                onChange={() => handleSwitchChange(category.id, category.status === "y" ? "n" : "y")}
                                                                id={`switch-${category.id}`}
                                                            />
                                                            <label
                                                                className="form-check-label px-0"
                                                                htmlFor={`switch-${category.id}`}
                                                                onClick={() => handleSwitchChange(category.id, category.status === "y" ? "n" : "y")}
                                                            >
                                                                {category.status === "y" ? "Active" : "Deactivated"}
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-success me-2"
                                                            onClick={() => handleEdit(category)}
                                                            disabled={category.status !== "y"}
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
                                                Item Category Code <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="itemcategorycode"
                                                placeholder="Category Code"
                                                onChange={handleInputChange}
                                                value={formData.categoryCode}
                                                required
                                            />
                                        </div>
                                        <div className="form-group col-md-4 mt-3">
                                            <label>
                                                Item Class Name <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="itemcategoryname"
                                                placeholder="Item Class Name"
                                                onChange={handleInputChange}
                                                value={formData.categoryName}
                                                required
                                            />
                                        </div>
                                        <div className="form-group col-md-4 mt-3">
                                            <label>
                                                Section <span className="text-danger">*</span>
                                            </label>
                                                <select
                                                    className="form-select"
                                                    id="SectionType"
                                                    onChange={handleInputChange}
                                                    value={formData.sectionType}
                                                    required
                                                >
                                                    <option value="" disabled>
                                                        Select Template
                                                    </option>
                                                    <option value="DRUGS">DRUGS</option>
                                                    <option value="CONSUMABLES">CONSUMABLES</option>
                                                    <option value="EQUIPMENT">EQUIPMENT</option>
                                                </select>
                                        </div>
                                    </div>
                                    <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                                        <button type="submit" className="btn btn-primary me-2">
                                            Save
                                        </button>
                                        <button type="button" className="btn btn-danger" onClick={() => setShowForm(false)}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
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
                                                        {itemCategories.find((category) => category.id === confirmDialog.categoryId)?.categoryName}
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

                            <nav className="d-flex justify-content-between align-items-center mt-3">
                                <div>
                                    <span>
                                        Page {currentPage} of {filteredTotalPages} | Total Records: {filteredItemCategories.length}
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
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ItemCategory

