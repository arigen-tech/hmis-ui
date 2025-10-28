"use client"

import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

const InvestigationMasterResult = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const { investigationName, department, modality, investigationId, sample, container, uom } = location.state || {}

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

  const [showNormalValueModal, setShowNormalValueModal] = useState(false)
  const [showFixedValueModal, setShowFixedValueModal] = useState(false)
  const [selectedTestId, setSelectedTestId] = useState(null)
  const [normalValues, setNormalValues] = useState([
    { gender: "MALE", fromAge: 0, toAge: 100, minNormalValue: 40, maxNormalValue: 60, normalValue: 0 },
    { gender: "FEMALE", fromAge: 0, toAge: 100, minNormalValue: 40, maxNormalValue: 60, normalValue: 0 },
  ])

  const [fixedValues, setFixedValues] = useState([{ fixedValue: "" }])

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
        comparisonType: "Select",
      },
    ])
  }

  const handleDeleteRow = (id) => {
    setSubTests(subTests.filter((test) => test.id !== id))
  }

  const handleBack = () => {
    navigate(-1)
  }

  const handleUpdate = () => {
    alert("Update functionality would be implemented here")
  }

  const handleGoClick = (testId) => {
    const test = subTests.find((t) => t.id === testId)
    setSelectedTestId(testId)

    if (test.comparisonType === "Normal Value") {
      setShowNormalValueModal(true)
    } else if (test.comparisonType === "Fixed Value") {
      setShowFixedValueModal(true)
    }
  }

  const handleAddNormalValueRow = () => {
    setNormalValues([
      ...normalValues,
      {
        gender: "MALE",
        fromAge: 0,
        toAge: 100,
        minNormalValue: 40,
        maxNormalValue: 60,
        normalValue: 0,
      },
    ])
  }

  const handleDeleteNormalValueRow = (index) => {
    if (normalValues.length > 1) {
      const updatedValues = normalValues.filter((_, i) => i !== index)
      setNormalValues(updatedValues)
    }
  }

  const handleAddFixedValueRow = () => {
    setFixedValues([...fixedValues, { fixedValue: "" }])
  }

  const handleDeleteFixedValueRow = (index) => {
    if (fixedValues.length > 1) {
      const updatedValues = fixedValues.filter((_, i) => i !== index)
      setFixedValues(updatedValues)
    }
  }

  return (
    <div className="content-wrapper">
      {!showNormalValueModal && !showFixedValueModal ? (
        <div className="row">
          <div className="col-sm-12">
            <div className="card shadow mb-3">
              <div className="card-body">
                <div className="row g-3 align-items-center"></div>
                <div className="row">
                  <div className="col-12 grid-margin stretch-card">
                    <div className="card">
                      <div
                        className="card-header"
                        style={{ backgroundColor: "#198754", color: "white", padding: "15px" }}
                      >
                        <h4 className="card-title mb-0">Sub Investigation Master</h4>
                      </div>
                      <div className="card-body">
                        <div className="row mb-4">
                          <div className="col-md-4">
                            <label className="form-label">Department Name</label>
                            <input
                              type="text"
                              className="form-control bg-light"
                              value={department || "laboratory 3"}
                              readOnly
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Modality</label>
                            <input
                              type="text"
                              className="form-control bg-light"
                              value={modality || "BIO-CHEMISTRY"}
                              readOnly
                            />
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
                                      <option value="Select">Select</option>
                                      <option value="None">None</option>
                                      <option value="Fixed Value">Fixed Value</option>
                                      <option value="Normal Value">Normal Value</option>
                                    </select>

                                    <button className="btn btn-success ms-1" onClick={() => handleGoClick(test.id)}>
                                      Go
                                    </button>
                                  </td>
                                  <td>
                                    <button className="btn btn-success" onClick={handleAddRow}>
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
                          <button className="btn btn-success me-2" onClick={handleUpdate}>
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
      ) : showNormalValueModal ? (
        <div className="row">
          <div className="col-sm-12">
            <div className="card shadow mb-3">
              <div className="card-header" style={{ backgroundColor: "#198754", color: "white" }}>
                <h4 className="card-title mb-0">Normal Value</h4>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="table-secondary">
                      <tr>
                        <th>Gender</th>
                        <th>From Age</th>
                        <th>To Age</th>
                        <th>Min Normal Value</th>
                        <th>Max Normal Value</th>
                        <th>Normal Value</th>
                        <th>Add</th>
                        <th>Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {normalValues.map((value, index) => (
                        <tr key={index}>
                          <td>
                            <select
                              className="form-select"
                              value={value.gender}
                              onChange={(e) => {
                                const updatedValues = [...normalValues]
                                updatedValues[index].gender = e.target.value
                                setNormalValues(updatedValues)
                              }}
                            >
                              <option value="MALE">MALE</option>
                              <option value="FEMALE">FEMALE</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={value.fromAge}
                              onChange={(e) => {
                                const updatedValues = [...normalValues]
                                updatedValues[index].fromAge = e.target.value
                                setNormalValues(updatedValues)
                              }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={value.toAge}
                              onChange={(e) => {
                                const updatedValues = [...normalValues]
                                updatedValues[index].toAge = e.target.value
                                setNormalValues(updatedValues)
                              }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={value.minNormalValue}
                              onChange={(e) => {
                                const updatedValues = [...normalValues]
                                updatedValues[index].minNormalValue = e.target.value
                                setNormalValues(updatedValues)
                              }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={value.maxNormalValue}
                              onChange={(e) => {
                                const updatedValues = [...normalValues]
                                updatedValues[index].maxNormalValue = e.target.value
                                setNormalValues(updatedValues)
                              }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={value.normalValue}
                              onChange={(e) => {
                                const updatedValues = [...normalValues]
                                updatedValues[index].normalValue = e.target.value
                                setNormalValues(updatedValues)
                              }}
                            />
                          </td>
                          <td>
                            <button className="btn btn-success" onClick={handleAddNormalValueRow}>
                              +
                            </button>
                          </td>
                          <td>
                            <button className="btn btn-danger" onClick={() => handleDeleteNormalValueRow(index)}>
                              -
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="d-flex justify-content-end mt-3">
                  <button className="btn btn-success me-2" onClick={() => setShowNormalValueModal(false)}>
                    Submit
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowNormalValueModal(false)}>
                    Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="row">
          <div className="col-sm-12">
            <div className="card shadow mb-3">
              <div className="card-header" style={{ backgroundColor: "#198754", color: "white" }}>
                <h4 className="card-title mb-0">Fixed Value</h4>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="table-secondary">
                      <tr>
                        <th>Fixed Value</th>
                        <th>Add</th>
                        <th>Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fixedValues.map((value, index) => (
                        <tr key={index}>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={value.fixedValue}
                              onChange={(e) => {
                                const updatedValues = [...fixedValues]
                                updatedValues[index].fixedValue = e.target.value
                                setFixedValues(updatedValues)
                              }}
                            />
                          </td>
                          <td>
                            <button className="btn btn-success" onClick={handleAddFixedValueRow}>
                              +
                            </button>
                          </td>
                          <td>
                            <button className="btn btn-danger" onClick={() => handleDeleteFixedValueRow(index)}>
                              -
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="d-flex justify-content-end mt-3">
                  <button className="btn btn-success me-2" onClick={() => setShowFixedValueModal(false)}>
                    Submit
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowFixedValueModal(false)}>
                    Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InvestigationMasterResult
