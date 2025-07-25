import { useState } from "react"
import Popup from "../../../Components/popup"

const PendingForResultEntry = () => {
    const [results, setResults] = useState([
        {
            id: 1,
            orderDate: "17/07/2025",
            orderNo: "215334",
            collectionDate: "17/07/2025",
            collectionTime: "17:03",
            patientName: "SURAJ DAS",
            relation: "Husband",
            department: "GENERAL MEDICINE",
            doctorName: "Sandeep Dwivedi",
            modality: "BIO-CHEMISTRY",
            priority: "Priority-3",
            age: "51 Years",
            gender: "Male",
            clinicalNotes: "",
            enteredBy: "Sandeep",
            investigations: [
                {
                    id: 1,
                    siNo: 1,
                    diagNo: "215334",
                    investigation: "Lipid Profile",
                    sample: "",
                    result: "",
                    units: "",
                    normalRange: "",
                    remarks: "",
                    reject: false,
                    subTests: [
                        {
                            id: "1.a",
                            siNo: "1.a",
                            diagNo: "---",
                            investigation: "Total Cholestrol",
                            sample: "SERUM",
                            result: "",
                            units: "mg/dl",
                            normalRange: "Desirable < 200\nBorderline High 200-239\nHigh >= 240",
                            remarks: "",
                            reject: false,
                        },
                        {
                            id: "1.b",
                            siNo: "1.b",
                            diagNo: "---",
                            investigation: "Triglycerides",
                            sample: "SERUM",
                            result: "",
                            units: "mg/dl",
                            normalRange: "Optimal<100\nNear Optimal ->100 - 129\nBorderline High -> 130 - 159\nHigh -> 160 - 189",
                            remarks: "",
                            reject: false,
                        },
                        {
                            id: "1.c",
                            siNo: "1.c",
                            diagNo: "---",
                            investigation: "HDL Cholestrol",
                            sample: "SERUM",
                            result: "",
                            units: "mg/dl",
                            normalRange: "Low < 40\nHigh >= 60",
                            remarks: "",
                            reject: false,
                        },
                        {
                            id: "1.d",
                            siNo: "1.d",
                            diagNo: "---",
                            investigation: "LDL Cholestrol",
                            sample: "SERUM",
                            result: "",
                            units: "mg/dl",
                            normalRange: "Optimal<100\nNear Optimal ->100 - 129\nBorderline High -> 130 - 159\nHigh -> 160 - 189",
                            remarks: "",
                            reject: false,
                        },
                    ],
                },
                {
                    id: 2,
                    siNo: 2,
                    diagNo: "215334",
                    investigation: "Hb A1C",
                    sample: "Whole Blood",
                    result: "",
                    units: "%",
                    normalRange: "0 - 6.5",
                    remarks: "",
                    reject: false,
                    subTests: [],
                },
                {
                    id: 3,
                    siNo: 3,
                    diagNo: "215334",
                    investigation: "Blood Urea",
                    sample: "",
                    result: "",
                    units: "",
                    normalRange: "",
                    remarks: "",
                    reject: false,
                    subTests: [
                        {
                            id: "3.a",
                            siNo: "3.a",
                            diagNo: "---",
                            investigation: "Blood Urea",
                            sample: "SERUM",
                            result: "",
                            units: "mgs/dl",
                            normalRange: "15 - 39",
                            remarks: "",
                            reject: false,
                        },
                    ],
                },
                {
                    id: 4,
                    siNo: 4,
                    diagNo: "215334",
                    investigation: "S. Creatinine",
                    sample: "",
                    result: "",
                    units: "",
                    normalRange: "",
                    remarks: "",
                    reject: false,
                    subTests: [
                        {
                            id: "4.a",
                            siNo: "4.a",
                            diagNo: "---",
                            investigation: "S. CREATININE",
                            sample: "SERUM",
                            result: "",
                            units: "mgs/dl",
                            normalRange: "0.5 - 1.3",
                            remarks: "",
                            reject: false,
                        },
                    ],
                },
            ],
        },
        {
            id: 2,
            orderDate: "16/07/2025",
            orderNo: "215333",
            collectionDate: "16/07/2025",
            collectionTime: "14:30",
            patientName: "MEENA SHARMA",
            relation: "Self",
            department: "CARDIOLOGY",
            doctorName: "Dr. Patel",
            modality: "BIO-CHEMISTRY",
            priority: "Priority-2",
            age: "45 Years",
            gender: "Female",
            clinicalNotes: "Routine checkup",
            enteredBy: "Dr. Patel",
            investigations: [
                {
                    id: 1,
                    siNo: 1,
                    diagNo: "215333",
                    investigation: "Blood Glucose",
                    sample: "SERUM",
                    result: "",
                    units: "mg/dl",
                    normalRange: "70 - 110",
                    remarks: "",
                    reject: false,
                    subTests: [],
                },
            ],
        },
        {
            id: 3,
            orderDate: "15/07/2025",
            orderNo: "215332",
            collectionDate: "15/07/2025",
            collectionTime: "09:15",
            patientName: "RAJESH KUMAR",
            relation: "Father",
            department: "NEPHROLOGY",
            doctorName: "Dr. Singh",
            modality: "BIO-CHEMISTRY",
            priority: "Priority-1",
            age: "62 Years",
            gender: "Male",
            clinicalNotes: "Follow-up for kidney function",
            enteredBy: "Dr. Singh",
            investigations: [
                {
                    id: 1,
                    siNo: 1,
                    diagNo: "215332",
                    investigation: "Kidney Function Test",
                    sample: "SERUM",
                    result: "",
                    units: "",
                    normalRange: "",
                    remarks: "",
                    reject: false,
                    subTests: [],
                },
            ],
        },
    ])

    const [searchQuery, setSearchQuery] = useState("")
    const [patientNameQuery, setPatientNameQuery] = useState("")
    const [mobileNoQuery, setMobileNoQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [pageInput, setPageInput] = useState("")
    const [selectedResult, setSelectedResult] = useState(null)
    const [showDetailView, setShowDetailView] = useState(false)
    const [barCodeSearch, setBarCodeSearch] = useState("")
    const [popupMessage, setPopupMessage] = useState(null)

    const showPopup = (message, type = "info") => {
        setPopupMessage({
            message,
            type,
            onClose: () => {
                setPopupMessage(null)
            },
        })
    }

    const itemsPerPage = 10

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value)
        setCurrentPage(1)
    }

    const handlePatientNameSearchChange = (e) => {
        setPatientNameQuery(e.target.value)
        setCurrentPage(1)
    }
    const handleMobileNoSearchChange = (e) => {
        setMobileNoQuery(e.target.value)
        setCurrentPage(1)
    }

    const handleBarCodeSearchChange = (e) => {
        setBarCodeSearch(e.target.value)
        setCurrentPage(1)
    }

    const handleRowClick = (result) => {
        setSelectedResult(result)
        setShowDetailView(true)
    }

    const handleBackToList = () => {
        setShowDetailView(false)
        setSelectedResult(null)
    }

    const handleInvestigationChange = (investigationId, field, value) => {
        if (selectedResult) {
            const updatedInvestigations = selectedResult.investigations.map((inv) =>
                inv.id === investigationId ? { ...inv, [field]: value } : inv,
            )
            setSelectedResult({ ...selectedResult, investigations: updatedInvestigations })
        }
    }

    const handleSubTestChange = (investigationId, subTestId, field, value) => {
        if (selectedResult) {
            const updatedInvestigations = selectedResult.investigations.map((inv) => {
                if (inv.id === investigationId) {
                    const updatedSubTests = inv.subTests.map((subTest) =>
                        subTest.id === subTestId ? { ...subTest, [field]: value } : subTest,
                    )
                    return { ...inv, subTests: updatedSubTests }
                }
                return inv
            })
            setSelectedResult({ ...selectedResult, investigations: updatedInvestigations })
        }
    }

    const handleSubmit = () => {
        if (selectedResult) {
            const updatedResults = results.map((result) => (result.id === selectedResult.id ? selectedResult : result))
            setSelectedResult(null)
            setResults(updatedResults)
            showPopup("Result entry data saved successfully!", "success")
        }
    }

    const handleReset = () => {
        if (selectedResult) {
            const originalResult = results.find((r) => r.id === selectedResult.id)
            setSelectedResult({ ...originalResult })
        }
    }

    const filteredResults = results.filter(
        (item) =>
            (searchQuery === "" || item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.doctorName.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (patientNameQuery === "" || item.patientName.toLowerCase().includes(patientNameQuery.toLowerCase())) &&
            (mobileNoQuery === "" || (item.mobileNo && item.mobileNo.includes(mobileNoQuery)))
    )

    const filteredTotalPages = Math.ceil(filteredResults.length / itemsPerPage)
    const currentItems = filteredResults.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

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

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "Priority-1":
                return "bg-danger text-white"
            case "Priority-2":
                return "bg-warning text-dark"
            case "Priority-3":
                return "bg-success text-white"
            default:
                return "bg-secondary text-white"
        }
    }

    if (showDetailView && selectedResult) {
        return (
            <div className="content-wrapper">
                <div className="row">
                    <div className="col-12 grid-margin stretch-card">
                        <div className="card form-card">
                            <div className="card-header">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h4 className="card-title p-2">RESULT ENTRY</h4>
                                    <button className="btn btn-secondary" onClick={handleBackToList}>
                                        <i className="mdi mdi-arrow-left"></i> Back to List
                                    </button>
                                </div>
                            </div>
                            <div className="card-body">
                                {/* Collection Date */}
                                <div className="row mb-3">
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Collection Date</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={selectedResult.collectionDate}
                                            onChange={(e) => setSelectedResult({ ...selectedResult, collectionDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Patient Details */}
                                <div className="card mb-4">
                                    <div className="card-header bg-light">
                                        <h5 className="mb-0">PATIENT DETAILS</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="row">
                                            <div className="col-md-4">
                                                <label className="form-label fw-bold">Patient Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={selectedResult.patientName}
                                                    onChange={(e) => setSelectedResult({ ...selectedResult, patientName: e.target.value })}
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-bold">Relation</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={selectedResult.relation}
                                                    onChange={(e) => setSelectedResult({ ...selectedResult, relation: e.target.value })}
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-bold">Age</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={selectedResult.age}
                                                    onChange={(e) => setSelectedResult({ ...selectedResult, age: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="row mt-3">
                                            <div className="col-md-4">
                                                <label className="form-label fw-bold">Gender</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={selectedResult.gender}
                                                    onChange={(e) => setSelectedResult({ ...selectedResult, gender: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="row mt-3">
                                            <div className="col-12">
                                                <label className="form-label fw-bold">Clinical Notes</label>
                                                <textarea
                                                    className="form-control"
                                                    rows="2"
                                                    value={selectedResult.clinicalNotes}
                                                    onChange={(e) => setSelectedResult({ ...selectedResult, clinicalNotes: e.target.value })}
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Result Entry Details */}
                                <div className="card mb-4">
                                    <div className="card-header bg-light">
                                        <h5 className="mb-0">RESULT ENTRY DETAILS</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="row">
                                            <div className="col-md-3">
                                                <label className="form-label fw-bold">Date</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={selectedResult.collectionDate}
                                                    onChange={(e) => setSelectedResult({ ...selectedResult, collectionDate: e.target.value })}
                                                />
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label fw-bold">Time</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={selectedResult.collectionTime}
                                                    onChange={(e) => setSelectedResult({ ...selectedResult, collectionTime: e.target.value })}
                                                />
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label fw-bold">
                                                    Entered By <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={selectedResult.enteredBy}
                                                    onChange={(e) => setSelectedResult({ ...selectedResult, enteredBy: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Investigations Table */}
                                <div className="table-responsive">
                                    <table className="table table-bordered table-hover">
                                        <thead className="table-light">
                                            <tr>
                                                <th>SI No.</th>
                                                <th>Diag No.</th>
                                                <th>Investigation</th>
                                                <th>Sample</th>
                                                <th>Result</th>
                                                <th>Units</th>
                                                <th>Normal Range</th>
                                                <th>Remarks</th>
                                                <th>Reject</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedResult.investigations.map((investigation) => (
                                                <>
                                                    {investigation.subTests.length === 0 ? (
                                                        <tr key={investigation.id}>
                                                            <td>{investigation.siNo}</td>
                                                            <td>{investigation.diagNo}</td>
                                                            <td>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    value={investigation.investigation}
                                                                    style={{ border: '2px solid black' }}

                                                                    onChange={(e) =>
                                                                        handleInvestigationChange(investigation.id, "investigation", e.target.value)
                                                                    }
                                                                />
                                                            </td>
                                                            <td>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    value={investigation.sample}
                                                                    style={{ border: '2px solid black' }}

                                                                    onChange={(e) =>
                                                                        handleInvestigationChange(investigation.id, "sample", e.target.value)
                                                                    }
                                                                />
                                                            </td>
                                                            <td>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    value={investigation.result}
                                                                    style={{ border: '2px solid black' }}

                                                                    onChange={(e) =>
                                                                        handleInvestigationChange(investigation.id, "result", e.target.value)
                                                                    }
                                                                />
                                                            </td>
                                                            <td>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    value={investigation.units}
                                                                    style={{ border: '2px solid black' }}
                                                                    onChange={(e) => handleInvestigationChange(investigation.id, "units", e.target.value)}
                                                                />
                                                            </td>
                                                            <td>
                                                                <textarea
                                                                    className="form-control"
                                                                    rows="2"
                                                                    value={investigation.normalRange}
                                                                    style={{ border: '2px solid black' }}

                                                                    onChange={(e) =>
                                                                        handleInvestigationChange(investigation.id, "normalRange", e.target.value)
                                                                    }
                                                                ></textarea>
                                                            </td>
                                                            <td>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    value={investigation.remarks}
                                                                    style={{ border: '2px solid black' }}
                                                                    onChange={(e) =>
                                                                        handleInvestigationChange(investigation.id, "remarks", e.target.value)
                                                                    }
                                                                />
                                                            </td>
                                                            <td>
                                                                <div className="form-check d-flex justify-content-center">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        checked={investigation.reject}
                                                                        style={{ width: '20px', height: '20px', border: '2px solid black' }}
                                                                        onChange={(e) =>
                                                                            handleInvestigationChange(investigation.id, "reject", e.target.checked)
                                                                        }
                                                                    />
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        <>
                                                            <tr key={investigation.id}>
                                                                <td>{investigation.siNo}</td>
                                                                <td>{investigation.diagNo}</td>
                                                                <td colSpan="7">
                                                                    <strong>{investigation.investigation}</strong>
                                                                </td>
                                                            </tr>
                                                            {investigation.subTests.map((subTest) => (
                                                                <tr key={subTest.id}>
                                                                    <td>{subTest.siNo}</td>
                                                                    <td>{subTest.diagNo}</td>
                                                                    <td>
                                                                        <input
                                                                            type="text"
                                                                            className="form-control"
                                                                            value={subTest.investigation}
                                                                            style={{ border: '2px solid black' }}

                                                                            onChange={(e) =>
                                                                                handleSubTestChange(
                                                                                    investigation.id,
                                                                                    subTest.id,
                                                                                    "investigation",
                                                                                    e.target.value,
                                                                                )
                                                                            }
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="text"
                                                                            className="form-control"
                                                                            value={subTest.sample}
                                                                            style={{ border: '2px solid black' }}

                                                                            onChange={(e) =>
                                                                                handleSubTestChange(investigation.id, subTest.id, "sample", e.target.value)
                                                                            }
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="text"
                                                                            className="form-control"
                                                                            value={subTest.result}
                                                                            style={{ border: '2px solid black' }}

                                                                            onChange={(e) =>
                                                                                handleSubTestChange(investigation.id, subTest.id, "result", e.target.value)
                                                                            }
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="text"
                                                                            className="form-control"
                                                                            value={subTest.units}
                                                                            style={{ border: '2px solid black' }}
                                                                            onChange={(e) =>
                                                                                handleSubTestChange(investigation.id, subTest.id, "units", e.target.value)
                                                                            }
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <textarea
                                                                            className="form-control"
                                                                            rows="2"
                                                                            value={subTest.normalRange}
                                                                            style={{ border: '2px solid black' }}

                                                                            onChange={(e) =>
                                                                                handleSubTestChange(investigation.id, subTest.id, "normalRange", e.target.value)
                                                                            }
                                                                        ></textarea>
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="text"
                                                                            className="form-control"
                                                                            value={subTest.remarks}
                                                                            style={{ border: '2px solid black' }}
                                                                            onChange={(e) =>
                                                                                handleSubTestChange(investigation.id, subTest.id, "remarks", e.target.value)
                                                                            }
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <div className="form-check d-flex justify-content-center">
                                                                            <input
                                                                                className="form-check-input"
                                                                                type="checkbox"
                                                                                checked={subTest.reject}
                                                                                style={{ width: '20px', height: '20px', border: '2px solid black' }}
                                                                                onChange={(e) =>
                                                                                    handleSubTestChange(investigation.id, subTest.id, "reject", e.target.checked)
                                                                                }
                                                                            />
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </>
                                                    )}
                                                </>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Action Buttons */}
                                <div className="text-end mt-4">
                                    <button className="btn btn-primary me-3" onClick={handleSubmit}>
                                        <i className="mdi mdi-content-save"></i> SUBMIT
                                    </button>
                                    <button className="btn btn-secondary me-3" onClick={handleReset}>
                                        <i className="mdi mdi-refresh"></i> RESET
                                    </button>
                                    <button className="btn btn-danger" onClick={handleBackToList}>
                                        <i className="mdi mdi-close"></i> BACK
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header">
                            <h4 className="card-title p-2">PENDING FOR RESULT ENTRY</h4>
                        </div>
                        <div className="card-body">
                            {/* Patient Search Section */}
                            <div className="card mb-3">
                                <div className="card-header py-3 bg-light border-bottom-1">
                                    <h6 className="mb-0 fw-bold">PATIENT SEARCH</h6>
                                </div>
                                <div className="card-body">
                                    <form>
                                        <div className="row g-4 align-items-end">
                                            <div className="col-md-4">
                                                <label className="form-label">Bar Code Search</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Enter bar code"
                                                    value={barCodeSearch}
                                                    onChange={handleBarCodeSearchChange}
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">Patient Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Enter patient name"
                                                    value={patientNameQuery}
                                                    onChange={handlePatientNameSearchChange}
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">Mobile No.</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Enter mobile number"
                                                    value={mobileNoQuery}
                                                    onChange={handleMobileNoSearchChange}
                                                />
                                            </div>
                                            <div className="col-md-4 d-flex">
                                                <button type="button" className="btn btn-primary me-2">
                                                    <i className="fa fa-search"></i> SEARCH
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary"
                                                    onClick={() => {
                                                        setSearchQuery("")
                                                        setPatientNameQuery("")
                                                        setMobileNoQuery("")
                                                        setBarCodeSearch("")
                                                    }}
                                                >
                                                    <i className="mdi mdi-refresh"></i> Reset
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            {/* Priority Legend */}
                            <div className="d-flex mb-3">
                                <span className="badge bg-danger me-2">Priority-1</span>
                                <span className="badge bg-warning text-dark me-2">Priority-2</span>
                                <span className="badge bg-success">Priority-3</span>
                            </div>

                            <div className="table-responsive packagelist">
                                <table className="table table-bordered table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Order Date</th>
                                            <th>Order No.</th>
                                            <th>Collection Date</th>
                                            <th>Collection Time</th>
                                            <th>Patient Name</th>
                                            <th>Relation</th>
                                            <th>Department Name</th>
                                            <th>Doctor Name</th>
                                            <th>Modality</th>
                                            <th>Priority</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.map((item) => (
                                            <tr
                                                key={item.id}
                                                onClick={() => handleRowClick(item)}
                                                style={{ cursor: "pointer" }}
                                                className="table-row-hover"
                                            >
                                                <td>{item.orderDate}</td>
                                                <td>{item.orderNo}</td>
                                                <td>{item.collectionDate}</td>
                                                <td>{item.collectionTime}</td>
                                                <td>{item.patientName}</td>
                                                <td>{item.relation}</td>
                                                <td>{item.department}</td>
                                                <td>{item.doctorName}</td>
                                                <td>{item.modality}</td>
                                                <td>
                                                    <span className={`badge ${getPriorityColor(item.priority)}`}>{item.priority}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <nav className="d-flex justify-content-between align-items-center mt-3">
                                <div>
                                    <span>
                                        Page {currentPage} of {filteredTotalPages} | Total Records: {filteredResults.length}
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
                                        style={{ width: "120px" }}
                                    />
                                    <button className="btn btn-primary" onClick={handlePageNavigation}>
                                        GO
                                    </button>
                                </div>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
            {popupMessage && (
                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
            )}
        </div>
    )
}

export default PendingForResultEntry
