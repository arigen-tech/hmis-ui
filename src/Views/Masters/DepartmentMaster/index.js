

import { useState } from "react"
import Popup from "../../../Components/popup"

const DepartmentMaster = () => {
    const [departments, setDepartments] = useState([
        {
            id: 1,
            departmentCode: "OPD",
            department: "Outpatient Department",
            departmentType: "Clinic",
            departmentNumber: "0601",
            division: "Medical",
            status: "y",
        },
        {
            id: 2,
            departmentCode: "RADIO",
            department: "Radiology",
            departmentType: "Diagnostics",
            departmentNumber: "0602",
            division: "Medical",
            status: "y",
        },
        {
            id: 3,
            departmentCode: "PHARM",
            department: "Pharmacy",
            departmentType: "Dispensary",
            departmentNumber: "0603",
            division: "Medical",
            status: "y",
        },
        {
            id: 4,
            departmentCode: "CSTR",
            department: "Central Store",
            departmentType: "Stores",
            departmentNumber: "0604",
            division: "Administration",
            status: "y",
        },
        {
            id: 5,
            departmentCode: "CHILD",
            department: "Children Ward",
            departmentType: "Ward",
            departmentNumber: "0605",
            division: "Medical",
            status: "y",
        },
        {
            id: 6,
            departmentCode: "CHILD2",
            department: "Children Ward 2",
            departmentType: "Ward",
            departmentNumber: "0606",
            division: "Medical",
            status: "y",
        },
        {
            id: 7,
            departmentCode: "CHILD3",
            department: "Children Ward 3",
            departmentType: "Ward",
            departmentNumber: "0607",
            division: "Medical",
            status: "y",
        },
        {
            id: 8,
            departmentCode: "CHILD4",
            department: "Children Ward 4",
            departmentType: "Ward",
            departmentNumber: "0608",
            division: "Medical",
            status: "y",
        },
        {
            id: 9,
            departmentCode: "CHILD5",
            department: "Children Ward 5",
            departmentType: "Ward",
            departmentNumber: "0609",
            division: "Medical",
            status: "y",
        },
        {
            id: 10,
            departmentCode: "CHILD6",
            department: "Children Ward 6",
            departmentType: "Ward",
            departmentNumber: "0610",
            division: "Medical",
            status: "y",
        },
        {
            id: 11,
            departmentCode: "CHILD7",
            department: "Children Ward 7",
            departmentType: "Ward",
            departmentNumber: "0611",
            division: "Medical",
            status: "y",
        },
        {
            id: 12,
            departmentCode: "CHILD8",
            department: "Children Ward 8",
            departmentType: "Ward",
            departmentNumber: "0612",
            division: "Medical",
            status: "y",
        },
        {
            id: 13,
            departmentCode: "CHILD9",
            department: "Children Ward 9",
            departmentType: "Ward",
            departmentNumber: "0613",
            division: "Medical",
            status: "y",
        },
        {
            id: 14,
            departmentCode: "CHILD10",
            department: "Children Ward 10",
            departmentType: "Ward",
            departmentNumber: "0614",
            division: "Medical",
            status: "y",
        },
    ])

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, categoryId: null, newStatus: false })
    const [formData, setFormData] = useState({
        departmentCode: "",
        department: "",
        departmentType: "",
        departmentNumber: "",
        division: "",
    })
    const [searchQuery, setSearchQuery] = useState("")
    const [showForm, setShowForm] = useState(false)
    const [isFormValid, setIsFormValid] = useState(false)
    const [editingType, setEditingType] = useState(null)
    const [popupMessage, setPopupMessage] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [searchType, setSearchType] = useState("code")
    const [selectedDivision, setSelectedDivision] = useState("")
    const [pageInput, setPageInput] = useState("")
    const itemsPerPage = 5

    // Calculate filtered departments directly in the render function instead of using useEffect
    const getFilteredDepartments = () => {
        return departments.filter((dept) => {
            const matchesSearchQuery = (searchType === "code" ? dept.departmentCode : dept.department)
                .toLowerCase()
                .includes(searchQuery.toLowerCase())
            const matchesDivision = selectedDivision ? dept.division === selectedDivision : true
            return matchesSearchQuery && matchesDivision
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

    // Handle search and filter changes
    const handleSearchChange = (value) => {
        setSearchQuery(value)
        setCurrentPage(1) // Reset to first page when search changes
    }

    const handleDivisionChange = (value) => {
        setSelectedDivision(value)
        setCurrentPage(1) // Reset to first page when division filter changes
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
            division: formElement.division.value,
        }

        if (editingType) {
            setDepartments(departments.map((dept) => (dept.id === editingType.id ? { ...dept, ...updatedDepartment } : dept)))
        } else {
            const newDept = {
                id: departments.length + 1,
                departmentCode: formData.departmentCode,
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

    const handleInputChange = (e) => {
        const { id, value } = e.target
        setFormData((prevData) => ({ ...prevData, [id]: value }))
    }

    const handleCreateFormSubmit = (e) => {
        e.preventDefault()
        if (
            formData.departmentCode &&
            formData.department &&
            formData.departmentType &&
            formData.departmentNumber &&
            formData.division
        ) {
            setDepartments([...departments, { ...formData, id: Date.now(), status: "y" }])
            setFormData({ departmentCode: "", department: "", departmentType: "", departmentNumber: "", division: "" })
            setShowForm(false)
        } else {
            alert("Please fill out all required fields.")
        }
    }

    // Get unique divisions for the dropdown
    const uniqueDivisions = [...new Set(departments.map((dept) => dept.division))]

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header">
                            <h4 className="card-title p-2">Department Master</h4>
                            <div className="d-flex justify-content-between align-items-spacearound mt-3">
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
                                        <label className="me-2">Division </label>
                                        <select
                                            className="form-control"
                                            id="divisionFilter"
                                            value={selectedDivision}
                                            onChange={(e) => handleDivisionChange(e.target.value)}
                                        >
                                            <option value="">All Divisions</option>
                                            {uniqueDivisions.map((division, index) => (
                                                <option key={index} value={division}>
                                                    {division}
                                                </option>
                                            ))}
                                        </select>
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
                                <div className="d-flex align-items-center">
                                    <button type="button" className="btn btn-success me-2" onClick={() => { }}>
                                        <i className="mdi mdi-plus"></i> Search
                                    </button>
                                    <button type="button" className="btn btn-success me-2" onClick={() => { setShowForm(true) }}>
                                        <i className="mdi mdi-plus"></i> Add
                                    </button>
                                    <div className="ms-3">
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
                                                <th>Division</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((dept) => (
                                                <tr key={dept.id}>
                                                    <td>{dept.departmentCode}</td>
                                                    <td>{dept.department}</td>
                                                    <td>{dept.departmentType}</td>
                                                    <td>{dept.departmentNumber}</td>
                                                    <td>{dept.division}</td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={dept.status === "y"}
                                                                onChange={() => handleSwitchChange(dept.id, dept.status === "y" ? "n" : "y")}
                                                                id={`switch-${dept.id}`}
                                                            />
                                                            <label
                                                                className="form-check-label px-0"
                                                                htmlFor={`switch-${dept.id}`}
                                                                onClick={() => handleSwitchChange(dept.id, dept.status === "y" ? "n" : "y")}
                                                            >
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
                                            ))}
                                        </tbody>
                                    </table>
                                   
                                </div>
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                     <div className="form-group col-md-6">
                                        <label>
                                            Department Code <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="departmentCode"
                                            name="Department Code"
                                            placeholder="Department Code"
                                            defaultValue={editingType ? editingType.departmentNumber : ""}
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
                                            defaultValue={editingType ? editingType.department : ""}
                                            onChange={(e) => setIsFormValid(e.target.value.trim() !== "")}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>
                                            Department Type <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="departmentType"
                                            name="departmentType"
                                            placeholder="Department Type"
                                            defaultValue={editingType ? editingType.departmentType : ""}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>
                                            Department Number <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="departmentNumber"
                                            name="departmentNumber"
                                            placeholder="Department Number"
                                            defaultValue={editingType ? editingType.departmentNumber : ""}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-6">
                                    <label>
                                                Division <span className="text-danger">*</span>
                                            </label>
                                            <div className="col-md-12">
                                                <select
                                                    className="form-control"
                                                    id="division"
                                                    value={formData.division}
                                                    onChange={handleInputChange}
                                                    required
                                                >
                                                    <option value="" disabled>
                                                        Select
                                                    </option>
                                                    <option value="Medical">Medical</option>
                                                    <option value="Administration">Administration</option>
                                                    <option value="Support">Support</option>
                                                </select>
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DepartmentMaster

