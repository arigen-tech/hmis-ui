"use client"

import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"

const DepartmentMaster = () => {
    const [departments, setDepartments] = useState([
        {
            id: 1,
            departmentCode: "OPD",
            department: "Outpatient Department",
            departmentType: "Clinic",
            departmentNumber: "0601",
            status: "y",
        },
        {
            id: 2,
            departmentCode: "RADIO",
            department: "Radiology",
            departmentType: "Diagnostics",
            departmentNumber: "0602",
            status: "y",
        },
        {
            id: 3,
            departmentCode: "PHARM",
            department: "Pharmacy",
            departmentType: "Dispensary",
            departmentNumber: "0603",
            status: "y",
        },
        {
            id: 4,
            departmentCode: "CSTR",
            department: "Central Store",
            departmentType: "Stores",
            departmentNumber: "0604",
            status: "y",
        },
        {
            id: 5,
            departmentCode: "CHILD",
            department: "Children Ward",
            departmentType: "Ward",
            departmentNumber: "0605",
            status: "y",
        },
        {
            id: 6,
            departmentCode: "CHILD2",
            department: "Children Ward 2",
            departmentType: "Ward",
            departmentNumber: "0606",
            status: "y",
        },
        {
            id: 7,
            departmentCode: "CHILD3",
            department: "Children Ward 3",
            departmentType: "Ward",
            departmentNumber: "0607",
            status: "y",
        },
        {
            id: 8,
            departmentCode: "CHILD4",
            department: "Children Ward 4",
            departmentType: "Ward",
            departmentNumber: "0608",
            status: "y",
        },
        {
            id: 9,
            departmentCode: "CHILD5",
            department: "Children Ward 5",
            departmentType: "Ward",
            departmentNumber: "0609",
            status: "y",
        },
        {
            id: 10,
            departmentCode: "CHILD6",
            department: "Children Ward 6",
            departmentType: "Ward",
            departmentNumber: "0610",
            status: "y",
        },
        {
            id: 11,
            departmentCode: "CHILD7",
            department: "Children Ward 7",
            departmentType: "Ward",
            departmentNumber: "0611",
            status: "y",
        },
        {
            id: 12,
            departmentCode: "CHILD8",
            department: "Children Ward 8",
            departmentType: "Ward",
            departmentNumber: "0612",
            status: "y",
        },
        {
            id: 13,
            departmentCode: "CHILD9",
            department: "Children Ward 9",
            departmentType: "Ward",
            departmentNumber: "0613",
            status: "y",
        },
        {
            id: 14,
            departmentCode: "CHILD10",
            department: "Children Ward 10",
            departmentType: "Ward",
            departmentNumber: "0614",
            status: "y",
        },
    ])

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, categoryId: null, newStatus: false })
    const [formData, setFormData] = useState({
        departmentCode: "",
        department: "",
        departmentType: "",
        departmentNumber: "",
    })
    const [searchQuery, setSearchQuery] = useState("")
    const [showForm, setShowForm] = useState(false)
    const [isFormValid, setIsFormValid] = useState(false)
    const [editingType, setEditingType] = useState(null)
    const [popupMessage, setPopupMessage] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [searchType, setSearchType] = useState("code")
    const [pageInput, setPageInput] = useState("")
    const itemsPerPage = 5

    // Get filtered departments based on search criteria
    const getFilteredDepartments = () => {
        if (!searchQuery) return departments

        return departments.filter((dept) => {
            if (searchType === "code") {
                return dept.departmentCode.toLowerCase().includes(searchQuery.toLowerCase())
            } else if (searchType === "description") {
                return dept.department.toLowerCase().includes(searchQuery.toLowerCase())
            }
            return true
        })
    }

    const filteredDepartments = getFilteredDepartments()
    const filteredTotalPages = Math.ceil(filteredDepartments.length / itemsPerPage)
    const totalFilteredItems = filteredDepartments.length

    // Calculate current items based on current page and filtered departments
    const getCurrentItems = () => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredDepartments.slice(startIndex, endIndex)
    }

    const currentItems = getCurrentItems()

    // Reset to page 1 if current page is out of bounds after filtering
    useEffect(() => {
        if (currentPage > filteredTotalPages && filteredTotalPages > 0) {
            setCurrentPage(1)
        }
    }, [filteredDepartments, currentPage, filteredTotalPages])

    // Handle search and filter changes
    const handleSearchChange = (value) => {
        setSearchQuery(value)
        setCurrentPage(1) // Reset to first page when search changes
    }

    const handleSearchTypeChange = (value) => {
        setSearchType(value)
        setCurrentPage(1) // Reset to first page when search type changes
    }

    const handlePageNavigation = () => {
        const pageNumber = Number.parseInt(pageInput, 10)
        if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
            setCurrentPage(pageNumber)
        } else {
            alert("Please enter a valid page number.")
        }
    }


const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));

    // Check if all required fields have values
    const updatedFormData = { ...formData, [id]: value };
    const isValid =
        updatedFormData.departmentCode.trim() !== "" &&
        updatedFormData.department.trim() !== "" &&
        updatedFormData.departmentType.trim() !== "" &&
        updatedFormData.departmentNumber.trim() !== "";

    setIsFormValid(isValid); // Update the form validity state
};

// In your form rendering
<button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
    Save
</button>

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

    const handleEdit = (dept) => {
        setEditingType(dept)
        setFormData({
            departmentCode: dept.departmentCode,
            department: dept.department,
            departmentType: dept.departmentType,
            departmentNumber: dept.departmentNumber,
        })
        setIsFormValid(true)
        setShowForm(true)
    }

    const handleSave = (e) => {
        e.preventDefault()
        if (!isFormValid) return

        const formElement = e.target
        const updatedDepartment = {
            departmentCode: formElement.departmentCode.value,
            department: formElement.department.value,
            departmentType: formElement.departmentType.value,
            departmentNumber: formElement.departmentNumber.value,
        }

        if (editingType) {
            setDepartments(departments.map((dept) => (dept.id === editingType.id ? { ...dept, ...updatedDepartment } : dept)))
        } else {
            const newDept = {
                id: departments.length + 1,
                ...updatedDepartment,
                status: "y",
            }
            setDepartments([...departments, newDept])
        }

        setEditingType(null)
        setShowForm(false)
        showPopup("Changes saved successfully!", "success")
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
            setDepartments((prevData) =>
                prevData.map((dept) =>
                    dept.id === confirmDialog.categoryId ? { ...dept, status: confirmDialog.newStatus } : dept,
                ),
            )
        }
        setConfirmDialog({ isOpen: false, categoryId: null, newStatus: null })
    }




    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header">
                            <h4 className="card-title p-2">Department Master</h4>
                            <div className="d-flex justify-content-between align-items-spacearound mt-3">
                                {!showForm && (
                                    <div className="d-flex align-items-center">
                                        <div className="me-3">
                                            <label>
                                                <input
                                                    type="radio"
                                                    name="searchType"
                                                    value="code"
                                                    checked={searchType === "code"}
                                                    onChange={() => handleSearchTypeChange("code")}
                                                />
                                                <span style={{ marginLeft: "5px" }}>Department Code</span>
                                            </label>
                                        </div>
                                        <div className="me-3">
                                            <label>
                                                <input
                                                    type="radio"
                                                    name="searchType"
                                                    value="description"
                                                    checked={searchType === "description"}
                                                    onChange={() => handleSearchTypeChange("description")}
                                                />
                                                <span style={{ marginLeft: "5px" }}>Department Name</span>
                                            </label>
                                        </div>

                                        <div className="d-flex align-items-center me-3">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Search..."
                                                value={searchQuery}
                                                onChange={(e) => handleSearchChange(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                                {!showForm && (
                                    <div className="d-flex align-items-center">
                                        <button
                                            type="button"
                                            className="btn btn-success me-2"
                                            onClick={() => handleSearchChange(searchQuery)}
                                        >
                                            <i className="mdi mdi-magnify"></i> Search
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-success me-2"
                                            onClick={() => {
                                                setShowForm(true)
                                                setEditingType(null)
                                                setFormData({
                                                    departmentCode: "",
                                                    department: "",
                                                    departmentType: "",
                                                    departmentNumber: "",
                                                })
                                                setIsFormValid(false)
                                            }}
                                        >
                                            <i className="mdi mdi-plus"></i> Add
                                        </button>
                                        <div className="ms-3">
                                            {!showForm ? (
                                                <button type="button" className="btn btn-success me-2">
                                                    <i className="mdi mdi-file-export"></i> Generate Report
                                                </button>
                                            ) : (
                                                <></>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="card-body">
                            {!showForm ? (
                                <div className="table-responsive packagelist">
                                    <table className="table table-bordered table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Department Code</th>
                                                <th>Department</th>
                                                <th>Department Type</th>
                                                <th>Department Number</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.length > 0 ? (
                                                currentItems.map((dept) => (
                                                    <tr key={dept.id}>
                                                        <td>{dept.departmentCode}</td>
                                                        <td>{dept.department}</td>
                                                        <td>{dept.departmentType}</td>
                                                        <td>{dept.departmentNumber}</td>
                                                        <td>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={dept.status === "y"}
                                                                    onChange={() => handleSwitchChange(dept.id, dept.status === "y" ? "n" : "y")}
                                                                    id={`switch-${dept.id}`}
                                                                />
                                                                <label className="form-check-label px-0" htmlFor={`switch-${dept.id}`}>
                                                                    {dept.status === "y" ? "Active" : "Deactivated"}
                                                                </label>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="btn btn-sm btn-success me-2"
                                                                onClick={() => handleEdit(dept)}
                                                                disabled={dept.status !== "y"}
                                                            >
                                                                <i className="fa fa-pencil"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={7} className="text-center">
                                                        No departments found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                <div className="d-flex justify-content-end">
                                    <button
                                        type="button"
                                        className="btn btn-secondary" // Use btn-sm for a smaller button and float-end to align it to the right
                                        onClick={() => setShowForm(false)} // Set showForm to false to close the form
                                    >
                                        <i className="mdi mdi-arrow-left"></i> Back
                                    </button>
                                </div>

                                    <div className="form-group col-md-6 ">
                                        <label>
                                            Department Code <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="departmentCode"
                                            name="departmentCode"
                                            placeholder="Department Code"
                                            value={formData.departmentCode}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>
                                            Department <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="department"
                                            name="department"
                                            placeholder="Department Name"
                                            value={formData.department}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-6 mt-2">
                                        <label>
                                            Department Type <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="departmentType"
                                            name="departmentType"
                                            placeholder="Department Type"
                                            value={formData.departmentType}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-6 mt-2">
                                        <label>
                                            Department Number <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="departmentNumber"
                                            name="departmentNumber"
                                            placeholder="Department Number"
                                            value={formData.departmentNumber}
                                            onChange={handleInputChange}
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
                                                        {departments.find((dept) => dept.id === confirmDialog.categoryId)?.department}
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

                            {!showForm && filteredDepartments.length > 0 && (
                                <nav className="d-flex justify-content-between align-items-center mt-3">
                                    <div>
                                        <span>
                                            Page {currentPage} of {filteredTotalPages} | Total Records: {totalFilteredItems}
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

export default DepartmentMaster

