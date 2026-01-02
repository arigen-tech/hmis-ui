"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { getRequest, putRequest } from "../../../../service/apiService"
import { MAS_INVESTIGATION, DG_UOM } from "../../../../config/apiConfig"
import Popup from "../../../../Components/popup"
import LoadingScreen from "../../../../Components/Loading"
import { UPDATE_SUB_INV_ERR_MSG, UPDATE_SUB_INV_SUCC_MSG, UPDATE_TWICE_SUB_INV_ERR_MSG } from "../../../../config/constants"

const InvestigationMasterResult = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const { 
    investigationId, 
    investigationName, 
    subInvestigations = [],
    mainChargeCodeId,
    subChargeCodeId,
    sampleId,
    uomId,
    methodId,
    categoryId,
    containerId,
    mainChargeCodeName,
    subChargeCodeName,
    collectionId,
    interpretation,
    genderApplicable,
    preparationRequired,
    estimatedDays,
    turnaroundTime,
  } = location.state || {}

  const [subTests, setSubTests] = useState([])
  const [showNormalValueModal, setShowNormalValueModal] = useState(false)
  const [showFixedValueModal, setShowFixedValueModal] = useState(false)
  const [selectedTestId, setSelectedTestId] = useState(null)
  const [normalValues, setNormalValues] = useState([])
  const [fixedValues, setFixedValues] = useState([])
  const [uomOptions, setUomOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [popupMessage, setPopupMessage] = useState(null)
  const [hasUpdated, setHasUpdated] = useState(false) // Track if update has been performed in current session

  // Gender mapping functions
  const mapGenderToDisplay = (genderCode) => {
    const genderMap = {
      'm': 'Male',
      'f': 'Female', 
      'c': 'Common'
    }
    return genderMap[genderCode?.toLowerCase()] || "Select"
  }

  const mapGenderToCode = (genderDisplay) => {
    const genderMap = {
      'Male': 'm',
      'Female': 'f',
      'Common': 'c'
    }
    return genderMap[genderDisplay] || null
  }

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => setPopupMessage(null),
    })
  }

  // Fetch UOM options from API
  useEffect(() => {
    const fetchUomOptions = async () => {
      try {
        setLoading(true)
        const uomsRes = await getRequest(`${DG_UOM}/getAll/1`)
        
        if (uomsRes && uomsRes.response) {
          setUomOptions(
            uomsRes.response.map((uom) => ({
              id: uom.id,
              name: uom.name,
            }))
          )
        } else {
          setUomOptions([])
        }
      } catch (error) {
        console.error("Error fetching UOM options:", error)
        setUomOptions([])
      } finally {
        setLoading(false)
      }
    }

    fetchUomOptions()
  }, [])

  // Initialize subTests from API data when component mounts
  useEffect(() => {
    if (subInvestigations && subInvestigations.length > 0) {
      const mappedSubTests = subInvestigations.map((subInv, index) => ({
        id: subInv.subInvestigationId || index + 1,
        printOrder: subInv.orderNo || index + 1,
        autoComplete: subInv.subInvestigationCode || "",
        enterable: subInv.subInvestigationName || '',
        loinc: "",
        unit: getUnitName(subInv.uomId) || '',
        resultType: mapResultType(subInv.resultType) || '',
        comparisonType: mapComparisonType(subInv.comparisonType) ||'',
        fixedValueExpectedResult:subInv.fixedValueExpectedResult || '',
        originalData: subInv,
        fixedValues: subInv.fixedValueResponseList?.map(fv => ({
          fixedId: fv.fixedId,
          fixedValue: fv.fixedValue
        })) || [],
        normalValues: subInv.normalValueResponseList?.map(nv => ({
          normalId: nv.normalId,
          gender: nv.sex === 'M' ? 'MALE' : 'FEMALE',
          fromAge: nv.fromAge || 0,
          toAge: nv.toAge || 100,
          minNormalValue: nv.minNormalValue || "",
          maxNormalValue: nv.maxNormalValue || "",
          normalValue: nv.normalValue || ""
        })) || []
      }))
      setSubTests(mappedSubTests)
    } else {
      setSubTests([
        {
          id: 1,
          printOrder: 1,
          autoComplete: "",
          enterable: "",
          loinc: "",
          unit: uomOptions[0]?.name || "mg/dl",
          resultType: "Single Parameter",
          comparisonType: "None",
          fixedValueExpectedResult:'',
          fixedValues: [],
          normalValues: []
        }
      ])
    }
  }, [subInvestigations, uomOptions])

  const mapResultType = (apiResultType) => {
    const typeMap = {
      's': 'Single Parameter',
      'm': 'Multiple Parameter', 
      't': 'Text'
    }
    return typeMap[apiResultType] || "Single Parameter"
  }

  const mapComparisonType = (apiComparisonType) => {
    const typeMap = {
      'f': 'Fixed Value',
      'n': 'Normal Value',
      'v': 'None'
    }
    return typeMap[apiComparisonType] || "None"
  }

  const getUnitName = (uomId) => {
    const uom = uomOptions.find(option => option.id === uomId)
    return uom ? uom.name : "mg/dl"
  }

  const getUomIdFromName = (unitName) => {
    const uom = uomOptions.find(option => option.name === unitName)
    return uom ? uom.id : uomOptions[0]?.id || 1
  }

  const isFixedValueExpectedResultEnabled = (comparisonType) => {
    return comparisonType === "Fixed Value";
  }

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
        unit: uomOptions[0]?.name || "mg/dl",
        resultType: "Single Parameter",
        comparisonType: "None",
        fixedValueExpectedResult:'',
        fixedValues: [],
        normalValues: []
      },
    ])
  }

  const handleDeleteRow = (id) => {
    setSubTests(subTests.filter((test) => test.id !== id))
  }

  const handleBack = () => {
    navigate(-1)
  }

  const handleUpdate = async () => {
    // Prevent multiple updates in current session
    if (hasUpdated) {
      showPopup(UPDATE_TWICE_SUB_INV_ERR_MSG, "error")
      return
    }

    try {
      setLoading(true)

      const genderCode = mapGenderToCode(genderApplicable)

      const mainInvestigationData = {
        investigationId: investigationId,
        investigationName: investigationName,
        confidential: "n",
        investigationType: "m",
        maxNormalValue: "",
        minNormalValue: "",
        mainChargeCodeId: mainChargeCodeId,
        uomId: uomId,
        subChargeCodeId: subChargeCodeId,
        sampleId: sampleId,
        collectionId: collectionId,
        methodId: methodId,
        categoryId: categoryId,
        interpretation: interpretation,
        genderApplicable: genderCode,
        preparationRequired:preparationRequired,
        estimatedDays:estimatedDays,
        tatHours:turnaroundTime,
        masInvestReq: subTests.map(test => {
          const fixedValues = test.fixedValues?.map(fv => ({
            fixedId: fv.fixedId || null,
            fixedValue: fv.fixedValue || ""
          })) || []

          const normalValues = test.normalValues?.map(nv => ({
            normalId: nv.normalId || null,
            sex: nv.gender === "MALE" ? "M" : "F",
            fromAge: parseInt(nv.fromAge) || 0,
            toAge: parseInt(nv.toAge) || 100,
            minNormalValue: nv.minNormalValue || "",
            maxNormalValue: nv.maxNormalValue || "",
            normalValue: nv.normalValue || "",
            mainChargeCodeId: mainChargeCodeId
          })) || []

          return {
            subInvestigationId: test.originalData?.subInvestigationId || null,
            subInvestigationCode: test.autoComplete || "",
            subInvestigationName: test.enterable || "",
            resultType: getApiResultType(test.resultType),
            comparisonType: getApiComparisonType(test.comparisonType),
            fixedValueExpectedResult: test.fixedValueExpectedResult || '',
            mainChargeCodeId: mainChargeCodeId,
            subChargeCodeId: subChargeCodeId,
            uomId: getUomIdFromName(test.unit),
            fixedValues: fixedValues,
            normalValues: normalValues,
            fixedValueIdsToDelete: test.fixedValueIdsToDelete || [],
            normalValueIdsToDelete: test.normalValueIdsToDelete || []
          }
        }),
        subInvestigationIdsToDelete: []
      }

      console.log("Update payload:", mainInvestigationData)

      const response = await putRequest(
        `${MAS_INVESTIGATION}/update-multiple-investigation/${investigationId}`,
        mainInvestigationData
      )

      if (response && response.status === 200) {
        // Set the flag to true after successful update (current session only)
        setHasUpdated(true)
        showPopup(UPDATE_SUB_INV_SUCC_MSG, "success")
      } else {
        throw new Error(response?.message || "Failed to update sub-investigations")
      }
    } catch (error) {
      console.error("Error updating sub-investigations:", error)
      showPopup(UPDATE_SUB_INV_ERR_MSG, "error")
    } finally {
      setLoading(false)
    }
  }

  const getApiResultType = (uiResultType) => {
    const typeMap = {
      'Single Parameter': 's',
      'Multiple Parameter': 'm',
      'Text': 't',
      'Range': 'r'
    }
    return typeMap[uiResultType] || 's'
  }

  const getApiComparisonType = (uiComparisonType) => {
    const typeMap = {
      'Fixed Value': 'f',
      'Normal Value': 'n',
      'None': 'v',
      'Select': null
    }
    return typeMap[uiComparisonType] || 'v'
  }

  const handleGoClick = (testId) => {
    const test = subTests.find((t) => t.id === testId)
    setSelectedTestId(testId)

    if (test.comparisonType === "Normal Value") {
      const existingNormalValues = test.normalValues || []
      if (existingNormalValues.length > 0) {
        setNormalValues(existingNormalValues)
      } else {
        setNormalValues([
          { gender: "MALE", fromAge: 0, toAge: 100, minNormalValue: "", maxNormalValue: "", normalValue: "" },
        ])
      }
      setShowNormalValueModal(true)
    } else if (test.comparisonType === "Fixed Value") {
      const existingFixedValues = test.fixedValues || []
      if (existingFixedValues.length > 0) {
        setFixedValues(existingFixedValues)
      } else {
        setFixedValues([{ fixedValue: "" }])
      }
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
        minNormalValue: "",
        maxNormalValue: "",
        normalValue: "",
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

  const handleNormalValueSubmit = () => {
    const updatedTests = subTests.map(test => {
      if (test.id === selectedTestId) {
        return {
          ...test,
          normalValues: normalValues,
          fixedValues: [],
          fixedValueIdsToDelete: test.fixedValues?.map(fv => fv.fixedId).filter(id => id) || []
        }
      }
      return test
    })
    setSubTests(updatedTests)
    setShowNormalValueModal(false)
  }

  const handleFixedValueSubmit = () => {
    const updatedTests = subTests.map(test => {
      if (test.id === selectedTestId) {
        return {
          ...test,
          fixedValues: fixedValues,
          normalValues: [],
          normalValueIdsToDelete: test.normalValues?.map(nv => nv.normalId).filter(id => id) || []
        }
      }
      return test
    })
    setSubTests(updatedTests)
    setShowFixedValueModal(false)
  }

  return (
    <div className="content-wrapper">
      {popupMessage && <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />}
      {loading && <LoadingScreen overlay />}
      
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
                              className="form-control"
                              value={mainChargeCodeName || "Laboratory"}
                              readOnly
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Modality</label>
                            <input
                              type="text"
                              className="form-control"
                              value={subChargeCodeName || "BIO-CHEMISTRY"}
                              readOnly
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Investigation Name</label>
                            <input
                              type="text"
                              className="form-control"
                              value={investigationName || "No investigation selected"}
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
                                <th>Fixed Value Expected Result</th>
                                <th>Add</th>
                                <th>Delete</th>
                              </tr>
                            </thead>
                            <tbody>
                              {subTests.map((test) => (
                                <tr key={test.id}>
                                  <td style={{ width: "80px" }}>
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
                                  <td style={{ width: "140px" }}>
                                    <select
                                      className="form-select"
                                      value={test.unit}
                                      onChange={(e) => {
                                        const updatedTests = subTests.map((t) =>
                                          t.id === test.id ? { ...t, unit: e.target.value } : t,
                                        )
                                        setSubTests(updatedTests)
                                      }}
                                      disabled={loading}
                                    >
                                      <option value="">Select Unit</option>
                                      {uomOptions.map((uom) => (
                                        <option key={uom.id} value={uom.name}>
                                          {uom.name}
                                        </option>
                                      ))}
                                    </select>
                                    {loading && <div className="text-muted small">Loading units...</div>}
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
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={test.fixedValueExpectedResult}
                                      onChange={(e) => {
                                        const updatedTests = subTests.map((t) =>
                                          t.id === test.id ? { ...t, fixedValueExpectedResult: e.target.value } : t,
                                        )
                                        setSubTests(updatedTests)
                                      }}
                                      disabled={!isFixedValueExpectedResultEnabled(test.comparisonType)}
                                      style={{
                                        backgroundColor: isFixedValueExpectedResultEnabled(test.comparisonType) 
                                          ? 'white' 
                                          : '#e9ecef',
                                        cursor: isFixedValueExpectedResultEnabled(test.comparisonType) 
                                          ? 'text' 
                                          : 'not-allowed'
                                      }}
                                    />
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
                          <button 
                            className="btn btn-success me-2" 
                            onClick={handleUpdate} 
                            disabled={loading || hasUpdated}
                            style={{
                              opacity: hasUpdated ? 0.6 : 1,
                              cursor: hasUpdated ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {loading ? "Updating..." : hasUpdated ? "Updated" : "Update"}
                          </button>
                          <button className="btn btn-secondary" onClick={handleBack} disabled={loading}>
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
                  <button className="btn btn-success me-2" onClick={handleNormalValueSubmit}>
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
                  <button className="btn btn-success me-2" onClick={handleFixedValueSubmit}>
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