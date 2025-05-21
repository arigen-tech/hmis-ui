
import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

const InvestigationMasterResult = () => {
    const location = useLocation()
    const navigate = useNavigate()

    // Get data from navigation state
    const { investigationName, department, modality, investigationId, sample, container, uom } = location.state || {}

    // Initial test data
    const [subTests, setSubTests] = useState([
        {
            id: 1,
            printOrder: 4,
            autoComplete: "",
            enterable: "HDL Cholesterol",
            loinc: "",
            unit: "mg/dl",
            resultType: "Single Parameter",
            comparisonType: "Normal Value",
        },
        {
            id: 2,
            printOrder: 1,
            autoComplete: "",
            enterable: "Total Cholesterol",
            loinc: "",
            unit: "mg/dl",
            resultType: "Single Parameter",
            comparisonType: "Normal Value",
        },
        {
            id: 3,
            printOrder: 2,
            autoComplete: "",
            enterable: "Triglycerides",
            loinc: "",
            unit: "mg/dl",
            resultType: "Single Parameter",
            comparisonType: "Normal Value",
        },
        {
            id: 4,
            printOrder: 3,
            autoComplete: "",
            enterable: "VLDL",
            loinc: "",
            unit: "mg/dl",
            resultType: "Single Parameter",
            comparisonType: "Normal Value",
        },
    ])

    // Handle adding a new row
    const handleAddRow = () => {
        const newId = subTests.length > 0 ? Math.max(...subTests.map((test) => test.id)) + 1 : 1
        const newPrintOrder = subTests.length > 0 ? Math.max(...subTests.map((test) => test.printOrder)) + 1 : 1

        setSubTests([
            ...subTests,
            {
                id: newId,
                printOrder: newPrintOrder,
                autoComplete: "",
                enterable: "",
                loinc: "",
                unit: "mg/dl",
                resultType: "Single Parameter",
                comparisonType: "Normal Value",
            },
        ])
    }

    // Handle deleting a row
    const handleDeleteRow = (id) => {
        setSubTests(subTests.filter((test) => test.id !== id))
    }

    // Handle going back
    const handleBack = () => {
        navigate(-1)
    }

    // Handle update
    const handleUpdate = () => {
        // Implement your update logic here
        alert("Update functionality would be implemented here")
    }

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-sm-12">
                    <div className="card shadow mb-3">
                        <div className="card-body">
                            <div className="row g-3 align-items-center"></div>
                            <div className="row">
                                <div className="col-12 grid-margin stretch-card">
                                    <div className="card">
                                        <div className="card-header" style={{ backgroundColor: "#198754", color: "white", padding: "15px" }}>
                                            <h4 className="card-title mb-0">Sub Investigation Master</h4>
                                        </div>
                                        <div className="card-body">
                                            <div className="row mb-4">
                                                <div className="col-md-4">
                                                    <label className="form-label">Department Name</label>
                                                    <input type="text" className="form-control bg-light" value={department || "laboratory 3"} readOnly />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label">Modality</label>
                                                    <input type="text" className="form-control bg-light" value={modality || "BIO-CHEMISTRY"} readOnly />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label">Investigation Name</label>
                                                    <input
                                                        type="text"
                                                        className="form-control bg-light"
                                                        value={investigationName || "ACID PHOSPHATE"}
                                                        readOnly
                                                    />
                                                </div>
                                            </div>

                                            <div className="table-responsive">
                                                <table className="table table-bordered">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>Print Order</th>
                                                            <th>Sub Test Name(Auto Complete)</th>
                                                            <th>Sub Test Name(Enterable)</th>
                                                            <th>LOINC Code</th>
                                                            <th>Unit</th>
                                                            <th>Result Type</th>
                                                            <th>Comparison Type</th>
                                                            <th>Add</th>
                                                            <th>Delete</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {subTests.map((test) => (
                                                            <tr key={test.id}>
                                                                <td>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control"
                                                                        value={test.printOrder}
                                                                        onChange={(e) => {
                                                                            const updatedTests = subTests.map((t) =>
                                                                                t.id === test.id ? { ...t, printOrder: e.target.value } : t,
                                                                            )
                                                                            setSubTests(updatedTests)
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control"
                                                                        value={test.autoComplete}
                                                                        onChange={(e) => {
                                                                            const updatedTests = subTests.map((t) =>
                                                                                t.id === test.id ? { ...t, autoComplete: e.target.value } : t,
                                                                            )
                                                                            setSubTests(updatedTests)
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control"
                                                                        value={test.enterable}
                                                                        onChange={(e) => {
                                                                            const updatedTests = subTests.map((t) =>
                                                                                t.id === test.id ? { ...t, enterable: e.target.value } : t,
                                                                            )
                                                                            setSubTests(updatedTests)
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control"
                                                                        value={test.loinc}
                                                                        onChange={(e) => {
                                                                            const updatedTests = subTests.map((t) =>
                                                                                t.id === test.id ? { ...t, loinc: e.target.value } : t,
                                                                            )
                                                                            setSubTests(updatedTests)
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <select
                                                                        className="form-select"
                                                                        value={test.unit}
                                                                        onChange={(e) => {
                                                                            const updatedTests = subTests.map((t) =>
                                                                                t.id === test.id ? { ...t, unit: e.target.value } : t,
                                                                            )
                                                                            setSubTests(updatedTests)
                                                                        }}
                                                                    >
                                                                        <option value="mg/dl">mg/dl</option>
                                                                        <option value="%">%</option>
                                                                        <option value="g/dl">g/dl</option>
                                                                        <option value="mmol/L">mmol/L</option>
                                                                    </select>
                                                                </td>
                                                                <td>
                                                                    <select
                                                                        className="form-select"
                                                                        value={test.resultType}
                                                                        onChange={(e) => {
                                                                            const updatedTests = subTests.map((t) =>
                                                                                t.id === test.id ? { ...t, resultType: e.target.value } : t,
                                                                            )
                                                                            setSubTests(updatedTests)
                                                                        }}
                                                                    >
                                                                        <option value="Single Parameter">Single Parameter</option>
                                                                        <option value="Multiple Parameter">Multiple Parameter</option>
                                                                        <option value="Text">Text</option>
                                                                    </select>
                                                                </td>
                                                                <td className="d-flex">
                                                                    <select
                                                                        className="form-select"
                                                                        value={test.comparisonType}
                                                                        onChange={(e) => {
                                                                            const updatedTests = subTests.map((t) =>
                                                                                t.id === test.id ? { ...t, comparisonType: e.target.value } : t,
                                                                            )
                                                                            setSubTests(updatedTests)
                                                                        }}
                                                                    >
                                                                        <option value="Normal Value">Normal Value</option>
                                                                        <option value="Range">Range</option>
                                                                        <option value="None">None</option>
                                                                    </select>

                                                                    <button
                                                                        className="btn btn-success ms-1"
                                                                    >
                                                                        Go
                                                                    </button>

                                                                </td>
                                                                <td>
                                                                    <button
                                                                        className="btn btn-success"
                                                                        onClick={handleAddRow}
                                                                    >
                                                                        <i className="fa fa-plus"></i>
                                                                    </button>
                                                                </td>
                                                                <td>
                                                                    <button className="btn btn-danger" onClick={() => handleDeleteRow(test.id)}>
                                                                        <i className="fa fa-minus"></i>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div className="d-flex justify-content-end mt-4">
                                                <button
                                                    className="btn btn-success me-2"
                                                    onClick={handleUpdate}
                                                >
                                                    Update
                                                </button>
                                                <button className="btn btn-secondary" onClick={handleBack}>
                                                    Back
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </div>
                        </div>
                        </div>
                        </div>
                        )
}

                        export default InvestigationMasterResult
