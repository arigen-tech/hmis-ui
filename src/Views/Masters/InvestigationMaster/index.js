"use client"

import { useState } from "react"

const InvestigationMaster = () => {
    const [investigations, setInvestigations] = useState([
        {
            id: 1,
            name: "17 OHP",
            modality: "ENDOCRINOLOGY",
            sample: "SERUM",
            uom: "ng/ml",
            status: "n",
            department: "Laboratory1",
            container: "Sterile Bottle/Red",
            resultType: "Multiple",
            minimumValue: "",
            maximumValue: "",
            loincCode: "",
            flag: "Select",
            confidential: false,
            pandemic: false,
            pandemicCases: "",
        },
        {
            id: 2,
            name: "AB COVID",
            modality: "MICRO BIOLOGY",
            sample: "SERUM",
            uom: "U/L",
            status: "n",
            department: "Laboratory2",
            container: "Sterile Bottle/Blue",
            resultType: "Single",
            minimumValue: "",
            maximumValue: "",
            loincCode: "",
            flag: "Normal",
            confidential: false,
            pandemic: true,
            pandemicCases: "10",
        },
        {
            id: 3,
            name: "ac covid",
            modality: "MOLECULAR BIOLOGY",
            sample: "SERUM",
            uom: "IU/ml",
            status: "n",
            department: "Laboratory1",
            container: "Sterile Bottle/Red",
            resultType: "Multiple",
            minimumValue: "",
            maximumValue: "",
            loincCode: "",
            flag: "Critical",
            confidential: false,
            pandemic: true,
            pandemicCases: "15",
        },
        {
            id: 4,
            name: "ACID PHOSPHATASE",
            modality: "BIO-CHEMISTRY",
            sample: "SERUM",
            uom: "U/L",
            status: "n",
            department: "Laboratory3",
            container: "Sterile Bottle/Green",
            resultType: "Range",
            minimumValue: "10",
            maximumValue: "50",
            loincCode: "LOINC123",
            flag: "Normal",
            confidential: true,
            pandemic: false,
            pandemicCases: "",
        },
        {
            id: 5,
            name: "AD cv",
            modality: "ENDOCRINOLOGY",
            sample: "Endocervical with Scarppings",
            uom: "G/100ml",
            status: "n",
            department: "Laboratory2",
            container: "Sterile Bottle/Blue",
            resultType: "Single",
            minimumValue: "",
            maximumValue: "",
            loincCode: "LOINC456",
            flag: "Normal",
            confidential: false,
            pandemic: false,
            pandemicCases: "",
        },
    ])

    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [pageInput, setPageInput] = useState("")
    const itemsPerPage = 3
    const [selectedInvestigation, setSelectedInvestigation] = useState(null)
    const [formData, setFormData] = useState({
        investigationName: "",
        department: "Laboratory1",
        modality: "ENDOCRINOLOGY",
        sample: "SERUM",
        container: "Sterile Bottle/Red",
        uom: "ng/ml",
        resultType: "Multiple",
        minimumValue: "",
        maximumValue: "",
        loincCode: "",
        flag: "Select",
        confidential: false,
        pandemic: false,
        pandemicCases: "",
        status: "n",
    })
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, investigationId: null, newStatus: null })

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value)
        setCurrentPage(1)
    }

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        })
    }

    const handleReset = () => {
        setFormData({
            investigationName: "",
            department: "Laboratory1",
            modality: "ENDOCRINOLOGY",
            sample: "SERUM",
            container: "Sterile Bottle/Red",
            uom: "ng/ml",
            resultType: "Multiple",
            minimumValue: "",
            maximumValue: "",
            loincCode: "",
            flag: "Select",
            confidential: false,
            pandemic: false,
            pandemicCases: "",
            status: "n",
        })
        setSelectedInvestigation(null)
    }

    const handleStatusToggle = (id) => {
        const investigation = investigations.find((item) => item.id === id)
        if (investigation) {
            const newStatus = investigation.status === "y" ? "n" : "y"
            setConfirmDialog({ isOpen: true, investigationId: id, newStatus })
        }
    }

    const handleConfirm = (confirmed) => {
        if (confirmed && confirmDialog.investigationId !== null) {
            // Update the investigation in the list
            const updatedInvestigations = investigations.map((item) => {
                if (item.id === confirmDialog.investigationId) {
                    return { ...item, status: confirmDialog.newStatus }
                }
                return item
            })

            setInvestigations(updatedInvestigations)

            // Update the selected investigation and form data if it's currently selected
            if (selectedInvestigation && selectedInvestigation.id === confirmDialog.investigationId) {
                setSelectedInvestigation({ ...selectedInvestigation, status: confirmDialog.newStatus })
                setFormData({ ...formData, status: confirmDialog.newStatus })
            }
        }
        setConfirmDialog({ isOpen: false, investigationId: null, newStatus: null })
    }


    const filteredInvestigations = investigations.filter(
        (item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.modality.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.sample.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.uom.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    const filteredTotalPages = Math.ceil(filteredInvestigations.length / itemsPerPage)

    const currentItems = filteredInvestigations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const handleRowClick = (investigation) => {
        setSelectedInvestigation(investigation)
        setFormData({
            investigationName: investigation.name,
            department: investigation.department,
            modality: investigation.modality,
            sample: investigation.sample,
            container: investigation.container,
            uom: investigation.uom,
            resultType: investigation.resultType,
            minimumValue: investigation.minimumValue,
            maximumValue: investigation.maximumValue,
            loincCode: investigation.loincCode,
            flag: investigation.flag,
            confidential: investigation.confidential,
            pandemic: investigation.pandemic,
            pandemicCases: investigation.pandemicCases,
            status: investigation.status,
        })
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
            <li key={index} className={`page-item ${number === currentPage ? "y" : ""}`}>
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
                        <div className="card-header ">
                            <h4 className="card-title p-2">Investigation Master</h4>
                            <div className="d-flex flex-wrap mt-3 mx-0">
                                <div className="d-flex align-items-center col-md-7">
                                    <div className="d-flex align-items-center col-md-7">
                                        <label className="flex-shrink-0 me-2 ms-3">
                                            Investigation Name<span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Investigation Name"
                                            value={searchQuery}
                                            onChange={handleSearchChange}
                                        />
                                    </div>

                                    <div className="col-md-2 d-flex me-2">
                                        <button type="button" className="btn btn-primary ms-2" onClick={() => setSearchQuery("")}>
                                            <i className="mdi mdi-magnify"></i> Search
                                        </button>
                                    </div>

                                </div>
                                <div className="col-md-4 d-flex justify-content-end">
                                    <button type="button" className="btn btn-primary ms-2" onClick={() => setSearchQuery("")}>
                                        <i className="mdi mdi-magnify"></i> Show All
                                    </button>
                                </div>


                            </div>


                            <div className="card-body">

                                <div className="table-responsive packagelist">
                                    <table className="table table-bordered table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Investigation Name</th>
                                                <th>Modality</th>
                                                <th>Sample</th>
                                                <th>UOM</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((item) => (
                                                <tr
                                                    key={item.id}
                                                    onClick={() => handleRowClick(item)}
                                                    className={selectedInvestigation && selectedInvestigation.id === item.id ? "table-primary" : ""}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    <td>{item.name}</td>
                                                    <td>{item.modality}</td>
                                                    <td>{item.sample}</td>
                                                    <td>{item.uom}</td>
                                                    <td onClick={(e) => e.stopPropagation()}>
                                                        <div className="form-check form-switch">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={item.status === "y"}
                                                                onChange={() => handleStatusToggle(item.id)}
                                                                id={`switch-${item.id}`}
                                                            />
                                                            <label className="form-check-label" htmlFor={`switch-${item.id}`}>
                                                                {item.status === "y" ? "Active" : "Deactivated"}
                                                            </label>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Form Section - 3 items per row */}
                                <div className="row mb-3 mt-3">
                                    <div className="col-sm-12">
                                        <div className="card shadow mb-3">
                                            <div className="card-body">
                                                <div className="row g-3 align-items-center">




                                                    <div className="col-md-4">
                                                        <div className="mb-2">
                                                            <label className="form-label fw-bold mb-1">
                                                                Investigation Name<span className="text-danger">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                name="investigationName"
                                                                value={formData.investigationName}
                                                                onChange={handleInputChange}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="mb-2">
                                                            <label className="form-label fw-bold mb-1">
                                                                Department<span className="text-danger">*</span>
                                                            </label>
                                                            <select className="form-select" name="department" value={formData.department} onChange={handleInputChange}>
                                                                <option value="Laboratory1">Laboratory1</option>
                                                                <option value="Laboratory2">Laboratory2</option>
                                                                <option value="Laboratory3">Laboratory3</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="mb-2">
                                                            <label className="form-label fw-bold mb-1">
                                                                Modality<span className="text-danger">*</span>
                                                            </label>
                                                            <select className="form-select" name="modality" value={formData.modality} onChange={handleInputChange}>
                                                                <option value="ENDOCRINOLOGY">ENDOCRINOLOGY</option>
                                                                <option value="MICRO BIOLOGY">MICRO BIOLOGY</option>
                                                                <option value="MOLECULAR BIOLOGY">MOLECULAR BIOLOGY</option>
                                                                <option value="BIO-CHEMISTRY">BIO-CHEMISTRY</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="col-md-4">
                                                        <div className="mb-2">
                                                            <label className="form-label fw-bold mb-1">
                                                                Sample<span className="text-danger">*</span>
                                                            </label>
                                                            <select className="form-select" name="sample" value={formData.sample} onChange={handleInputChange}>
                                                                <option value="SERUM">SERUM</option>
                                                                <option value="PLASMA">PLASMA</option>
                                                                <option value="WHOLE BLOOD">WHOLE BLOOD</option>
                                                                <option value="Endocervical with Scarppings">Endocervical with Scarppings</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="mb-2">
                                                            <label className="form-label fw-bold mb-1">
                                                                Container<span className="text-danger">*</span>
                                                            </label>
                                                            <select className="form-select" name="container" value={formData.container} onChange={handleInputChange}>
                                                                <option value="Sterile Bottle/Red">Sterile Bottle/Red</option>
                                                                <option value="Sterile Bottle/Blue">Sterile Bottle/Blue</option>
                                                                <option value="Sterile Bottle/Green">Sterile Bottle/Green</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="mb-2">
                                                            <label className="form-label fw-bold mb-1">
                                                                UOM<span className="text-danger">*</span>
                                                            </label>
                                                            <select className="form-select" name="uom" value={formData.uom} onChange={handleInputChange}>
                                                                <option value="ng/ml">ng/ml</option>
                                                                <option value="U/L">U/L</option>
                                                                <option value="IU/ml">IU/ml</option>
                                                                <option value="G/100ml">G/100ml</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="col-md-4">
                                                        <div className="mb-2">
                                                            <label className="form-label fw-bold mb-1">
                                                                Result Type<span className="text-danger">*</span>
                                                            </label>
                                                            <select className="form-select" name="resultType" value={formData.resultType} onChange={handleInputChange}>
                                                                <option value="Multiple">Multiple</option>
                                                                <option value="Single">Single</option>
                                                                <option value="Range">Range</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="mb-2">
                                                            <label className="form-label mb-1">Minimum Value</label>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                placeholder="Minimum Value"
                                                                name="minimumValue"
                                                                value={formData.minimumValue}
                                                                onChange={handleInputChange}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="mb-2">
                                                            <label className="form-label mb-1">Maximum Value</label>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                placeholder="Maximum Value"
                                                                name="maximumValue"
                                                                value={formData.maximumValue}
                                                                onChange={handleInputChange}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-4">
                                                        <div className="mb-2">
                                                            <label className="form-label mb-1">LOINC Code</label>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                placeholder="LOINC Code"
                                                                name="loincCode"
                                                                value={formData.loincCode}
                                                                onChange={handleInputChange}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="mb-2">
                                                            <label className="form-label fw-bold mb-1">
                                                                Flag<span className="text-danger">*</span>
                                                            </label>
                                                            <select className="form-select" name="flag" value={formData.flag} onChange={handleInputChange}>
                                                                <option value="Select">Select</option>
                                                                <option value="Normal">Normal</option>
                                                                <option value="Critical">Critical</option>
                                                            </select>
                                                        </div>
                                                    </div>



                                                    <div className="col-md-4">
                                                        <div className="mb-2">
                                                            <label className="form-label mb-1">Options</label>
                                                            <div className="form-control d-flex align-items-center">
                                                                <div className="form-check me-4">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        id="confidential"
                                                                        name="confidential"
                                                                        checked={formData.confidential}
                                                                        onChange={handleInputChange}
                                                                    />
                                                                    <label className="form-check-label" htmlFor="confidential">
                                                                        Confidential
                                                                    </label>
                                                                </div>
                                                                <div className="form-check">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        id="pandemic"
                                                                        name="pandemic"
                                                                        checked={formData.pandemic}
                                                                        onChange={handleInputChange}
                                                                    />
                                                                    <label className="form-check-label" htmlFor="pandemic">
                                                                        Pandemic
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="mb-2">
                                                            <label className="form-label mb-1">Pandemic Cases</label>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                placeholder="Pandemic Cases"
                                                                name="pandemicCases"
                                                                value={formData.pandemicCases}
                                                                onChange={handleInputChange}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-12 text-end mt-2 mb-3">
                                                        <button className="btn btn-success me-2" disabled={!selectedInvestigation}>
                                                           Save
                                                        </button>
                                                        <button className="btn btn-secondary" onClick={handleReset}>
                                                            Reset
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                        </div >
                                    </div>
                                </div>

                                {/* Confirmation Modal */}
                                {
                                    confirmDialog.isOpen && (
                                        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                                            <div className="modal-dialog" role="document">
                                                <div className="modal-content">
                                                    <div className="modal-header">
                                                        <h5 className="modal-title">Confirm Status Change</h5>
                                                        <button type="button" className="btn-close" onClick={() => handleConfirm(false)}></button>
                                                    </div>
                                                    <div className="modal-body">
                                                        <p>
                                                            Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                                                            <strong>{investigations.find((item) => item.id === confirmDialog.investigationId)?.name}</strong>?
                                                        </p>
                                                    </div>
                                                    <div className="modal-footer">
                                                        <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>
                                                            Cancel
                                                        </button>
                                                        <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>
                                                            Confirm
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }

                                {/* Pagination */}
                                <nav className="d-flex justify-content-between align-items-center mt-2">
                                    <div>
                                        <span>
                                            Page {currentPage} of {filteredTotalPages} | Total Records: {filteredInvestigations.length}
                                        </span>
                                    </div>
                                    <ul className="pagination mb-0">
                                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                            <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
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
                        </div >
                    </div>
                </div>
            </div>
        </div>

    )
}


export default InvestigationMaster
