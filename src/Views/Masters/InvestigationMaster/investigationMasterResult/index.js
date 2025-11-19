"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { getRequest, putRequest } from "../../../../service/apiService"
import { MAS_INVESTIGATION, DG_UOM } from "../../../../config/apiConfig"
import Popup from "../../../../Components/popup"
import LoadingScreen from "../../../../Components/Loading"

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
    containerId,
    mainChargeCodeName,
    subChargeCodeName,
    collectionId,
    genderApplicable // Add genderApplicable from location state
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

  // Fetch UOM options from API same as the first file
  useEffect(() => {
    const fetchUomOptions = async () => {
      try {
        setLoading(true)
        // Fetch UOM data from backend API - same as first file
        const uomsRes = await getRequest(`${DG_UOM}/getAll/1`)
        
        if (uomsRes && uomsRes.response) {
          setUomOptions(
            uomsRes.response.map((uom) => ({
              id: uom.id,
              name: uom.name,
            }))
          )
        } else {
          // Fallback to empty array if API fails
          setUomOptions([])
        }
      } catch (error) {
        console.error("Error fetching UOM options:", error)
        setUomOptions([]) // Fallback to empty array
      } finally {
        setLoading(false)
      }
    }

    fetchUomOptions()
  }, [])

  // Initialize subTests from API data when component mounts
  useEffect(() => {
    if (subInvestigations && subInvestigations.length > 0) {
      // Map API subInvestigationResponseList to subTests format
      const mappedSubTests = subInvestigations.map((subInv, index) => ({
        id: subInv.subInvestigationId || index + 1,
        printOrder: subInv.orderNo || index + 1,
        autoComplete: subInv.subInvestigationCode || "",
        enterable: subInv.subInvestigationName || "",
        loinc: "",
        unit: getUnitName(subInv.uomId) || "mg/dl",
        resultType: mapResultType(subInv.resultType) || "Single Parameter",
        comparisonType: mapComparisonType(subInv.comparisonType) || "None",
        // Store original API data for reference
        originalData: subInv,
        // Store existing fixed and normal values
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
      // Default empty state if no sub-investigations
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
          fixedValues: [],
          normalValues: []
        }
      ])
    }
  }, [subInvestigations, uomOptions])

  // Helper function to map result type from API to UI
  const mapResultType = (apiResultType) => {
    const typeMap = {
      's': 'Single Parameter',
      'm': 'Multiple Parameter', 
      't': 'Text'
    }
    return typeMap[apiResultType] || "Single Parameter"
  }

  // Helper function to map comparison type from API to UI
  const mapComparisonType = (apiComparisonType) => {
    const typeMap = {
      'f': 'Fixed Value',
      'n': 'Normal Value',
      'v': 'None'
    }
    return typeMap[apiComparisonType] || "None"
  }

  // Helper function to get unit name from ID using fetched UOM options
  const getUnitName = (uomId) => {
    const uom = uomOptions.find(option => option.id === uomId)
    return uom ? uom.name : "mg/dl"
  }

  // Helper function to get UOM ID from name using fetched UOM options
  const getUomIdFromName = (unitName) => {
    const uom = uomOptions.find(option => option.name === unitName)
    return uom ? uom.id : uomOptions[0]?.id || 1
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
    try {
      setLoading(true);

      // Map gender to code before sending to API
      const genderCode = mapGenderToCode(genderApplicable)

      // Prepare the main investigation data for multiple update
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
        genderApplicable: genderCode, // Add gender applicable field
        masInvestReq: subTests.map(test => {
          // Prepare fixed values
          const fixedValues = test.fixedValues?.map(fv => ({
            fixedId: fv.fixedId || null,
            fixedValue: fv.fixedValue || ""
          })) || [];

          // Prepare normal values
          const normalValues = test.normalValues?.map(nv => ({
            normalId: nv.normalId || null,
            sex: nv.gender === "MALE" ? "M" : "F",
            fromAge: parseInt(nv.fromAge) || 0,
            toAge: parseInt(nv.toAge) || 100,
            minNormalValue: nv.minNormalValue || "",
            maxNormalValue: nv.maxNormalValue || "",
            normalValue: nv.normalValue || "",
            mainChargeCodeId: mainChargeCodeId
          })) || [];

          return {
            subInvestigationId: test.originalData?.subInvestigationId || null,
            subInvestigationCode: test.autoComplete || "",
            subInvestigationName: test.enterable || "",
            resultType: getApiResultType(test.resultType),
            comparisonType: getApiComparisonType(test.comparisonType),
            mainChargeCodeId: mainChargeCodeId,
            subChargeCodeId: subChargeCodeId,
            uomId: getUomIdFromName(test.unit),
            fixedValues: fixedValues,
            normalValues: normalValues,
            fixedValueIdsToDelete: test.fixedValueIdsToDelete || [],
            normalValueIdsToDelete: test.normalValueIdsToDelete || []
          };
        }),
        subInvestigationIdsToDelete: []
      };

      console.log("Update payload:", mainInvestigationData);

      // Make API call to update multiple investigation
      const response = await putRequest(
        `${MAS_INVESTIGATION}/update-multiple-investigation/${investigationId}`,
        mainInvestigationData
      );

      if (response && response.status === 200) {
        showPopup("Sub-investigations updated successfully!", "success");
      } else {
        throw new Error(response?.message || "Failed to update sub-investigations");
      }
    } catch (error) {
      console.error("Error updating sub-investigations:", error);
      showPopup("Failed to update sub-investigations", "error");
    } finally {
      setLoading(false);
    }
  }

  // Helper function to convert UI result type to API format
  const getApiResultType = (uiResultType) => {
    const typeMap = {
      'Single Parameter': 's',
      'Multiple Parameter': 'm',
      'Text': 't',
      'Range': 'r'
    }
    return typeMap[uiResultType] || 's'
  }

  // Helper function to convert UI comparison type to API format
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
      // Load existing normal values if available
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
      // Load existing fixed values if available
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
    // Update the selected test with normal values
    const updatedTests = subTests.map(test => {
      if (test.id === selectedTestId) {
        return {
          ...test,
          normalValues: normalValues,
          // Clear fixed values when switching to normal values
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
    // Update the selected test with fixed values
    const updatedTests = subTests.map(test => {
      if (test.id === selectedTestId) {
        return {
          ...test,
          fixedValues: fixedValues,
          // Clear normal values when switching to fixed values
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
                              className="form-control bg-light"
                              value={mainChargeCodeName || "Laboratory"}
                              readOnly
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Modality</label>
                            <input
                              type="text"
                              className="form-control bg-light"
                              value={subChargeCodeName || "BIO-CHEMISTRY"}
                              readOnly
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Investigation Name</label>
                            <input
                              type="text"
                              className="form-control bg-light"
                              value={investigationName || "No investigation selected"}
                              readOnly
                            />
                          </div>
                          {/* <div className="col-md-3">
                            <label className="form-label">Gender Applicable</label>
                            <input
                              type="text"
                              className="form-control bg-light"
                              value={mapGenderToDisplay(genderApplicable) || "Not specified"}
                              readOnly
                            />
                          </div> */}
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
                          <button className="btn btn-success me-2" onClick={handleUpdate} disabled={loading}>
                            {loading ? "Updating..." : "Update"}
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