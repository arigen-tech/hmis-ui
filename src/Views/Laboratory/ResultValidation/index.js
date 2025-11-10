import { useState, useEffect } from "react"
import { getRequest } from "../../../service/apiService"
import { LAB } from "../../../config/apiConfig"
import LoadingScreen from "../../../Components/Loading"
import Popup from "../../../Components/popup"

const ResultValidation = () => {
  const [resultList, setResultList] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchData, setSearchData] = useState({
    barCodeSearch: "",
    patientName: "",
    mobileNo: "",
  })
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const [selectedResult, setSelectedResult] = useState(null)
  const [showDetailView, setShowDetailView] = useState(false)
  const [masterValidate, setMasterValidate] = useState(false)
  const [masterReject, setMasterReject] = useState(false)
  const itemsPerPage = 5

  // Fetch unvalidated results data
  useEffect(() => {
    fetchUnvalidatedResults()
  }, [])

  const fetchUnvalidatedResults = async () => {
    try {
      setLoading(true);
      const data = await getRequest(`${LAB}/unvalidated`);

      if (data.status === 200 && data.response) {
        const formattedData = formatValidationData(data.response);
        setResultList(formattedData);
      } else {
        console.error('Error fetching unvalidated results:', data.message);
        showPopup('Failed to load unvalidated results', 'error')
      }
    } catch (error) {
      console.error('Error fetching unvalidated results:', error);
      showPopup('Error fetching unvalidated results', 'error')
    } finally {
      setLoading(false);
    }
  };

  const formatValidationData = (apiData) => {
    return apiData.map((item, index) => ({
      id: index + 1,
      result_date: formatDate(item.resultDate),
      result_time: formatTime(item.resultTime),
      patient_name: item.patientName || '',
      relation: item.relation || '',
      department: item.subChargeCodeName || '',
      doctor_name: "Doctor",
      modality: item.subChargeCodeName || '',
      priority: "Priority-3",
      age: item.patientAge || '',
      gender: item.patientGender || '',
      clinical_notes: "",
      validated_by: item.validatedBy || '',
      patientId: item.patientId || 0,
      mobile_no: item.patientPhnNum || '',
      
      investigations: item.resultEntryInvestigationResponses ? item.resultEntryInvestigationResponses.map((inv, invIndex) => {
        const hasSubTests = inv.resultEntrySubInvestigationRes && inv.resultEntrySubInvestigationRes.length > 0;
        
        if (hasSubTests) {
          return {
            id: invIndex + 1,
            si_no: invIndex + 1,
            diag_no: inv.diagNo || '',
            investigation: inv.investigationName || '',
            sample: inv.sampleName || '',
            result: inv.result || "",
            units: inv.unit || '',
            normal_range: inv.normalValue || '',
            remarks: inv.remarks || "",
            reject: false,
            validate: false,
            comparisonType: inv.comparisonType,
            fixedId: inv.fixedId,
            fixedDropdownValues: inv.fixedDropdownValues || [],
            subTests: inv.resultEntrySubInvestigationRes.map((subTest, subIndex) => ({
              id: `${invIndex + 1}.${subIndex + 1}`,
              si_no: getSubTestNumber(invIndex + 1, subIndex, inv.resultEntrySubInvestigationRes.length),
              diag_no: "---",
              investigation: subTest.subInvestigationName || '',
              sample: subTest.sampleName || '',
              result: subTest.result || "",
              units: subTest.unit || '',
              normal_range: subTest.normalValue || '',
              remarks: subTest.remarks || "",
              reject: false,
              validate: false,
              comparisonType: subTest.comparisonType,
              fixedId: subTest.fixedId,
              fixedDropdownValues: subTest.fixedDropdownValues || [],
            }))
          };
        } else {
          return {
            id: invIndex + 1,
            si_no: invIndex + 1,
            diag_no: inv.diagNo || '',
            investigation: inv.investigationName || '',
            sample: inv.sampleName || '',
            result: inv.result || "",
            units: inv.unit || '',
            normal_range: inv.normalValue || '',
            remarks: inv.remarks || "",
            reject: false,
            validate: false,
            comparisonType: inv.comparisonType,
            fixedId: inv.fixedId,
            fixedDropdownValues: inv.fixedDropdownValues || [],
            subTests: []
          };
        }
      }) : []
    }))
  }

  // Helper functions for formatting
  const getSubTestNumber = (mainIndex, subIndex, totalSubTests) => {
    if (totalSubTests === 1) {
      return "";
    } else {
      return `${mainIndex}.${String.fromCharCode(97 + subIndex)}`;
    } 
  }

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString('en-GB');
    try {
      if (typeof dateString === 'string') {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? new Date().toLocaleDateString('en-GB') : date.toLocaleDateString('en-GB');
      }
      return new Date().toLocaleDateString('en-GB');
    } catch (error) {
      return new Date().toLocaleDateString('en-GB');
    }
  }

  const formatTime = (timeValue) => {
    if (!timeValue) return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    try {
      if (typeof timeValue === 'string') {
        const timeParts = timeValue.split(':');
        if (timeParts.length >= 2) {
          return `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`;
        }
      }
      return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }
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

  // NEW FUNCTION: Handle result change for main investigations
  const handleResultChange = (investigationId, value) => {
    if (selectedResult) {
      const updatedInvestigations = selectedResult.investigations.map((inv) => {
        if (inv.id === investigationId) {
          return { ...inv, result: value }
        }
        return inv
      })
      setSelectedResult({ ...selectedResult, investigations: updatedInvestigations })
    }
  }

  // NEW FUNCTION: Handle result change for sub-tests
  const handleSubTestResultChange = (investigationId, subTestId, value) => {
    if (selectedResult) {
      const updatedInvestigations = selectedResult.investigations.map((inv) => {
        if (inv.id === investigationId) {
          const updatedSubTests = inv.subTests.map((subTest) => {
            if (subTest.id === subTestId) {
              return { ...subTest, result: value }
            }
            return subTest
          })
          return { ...inv, subTests: updatedSubTests }
        }
        return inv
      })
      setSelectedResult({ ...selectedResult, investigations: updatedInvestigations })
    }
  }

  // NEW FUNCTION: Render result input field
  const renderResultInput = (test, isSubTest = false, investigationId = null) => {
    if (test.comparisonType === 'f' && test.fixedDropdownValues && test.fixedDropdownValues.length > 0) {
      return (
        <select
          className="form-select"
          value={test.result}
          onChange={(e) => {
            if (isSubTest && investigationId) {
              handleSubTestResultChange(investigationId, test.id, e.target.value)
            } else {
              handleResultChange(test.id, e.target.value)
            }
          }}
        >
          <option value="">Select Result</option>
          {test.fixedDropdownValues.map((option) => (
            <option 
              key={option.fixedId} 
              value={option.fixedValue}
              selected={test.fixedId === option.fixedId}
            >
              {option.fixedValue}
            </option>
          ))}
        </select>
      )
    } else {
      return (
        <input
          type="text"
          className="form-control"
          value={test.result}
          onChange={(e) => {
            if (isSubTest && investigationId) {
              handleSubTestResultChange(investigationId, test.id, e.target.value)
            } else {
              handleResultChange(test.id, e.target.value)
            }
          }}
          placeholder="Enter result"
        />
      )
    }
  }

  // ALL YOUR EXISTING CODE BELOW - with modifications to the table structure
  const handleSearchChange = (e) => {
    const { id, value } = e.target
    setSearchData((prevData) => ({ ...prevData, [id]: value }))
    setCurrentPage(1)
  }

  const handleRowClick = (result) => {
    setSelectedResult(JSON.parse(JSON.stringify(result))) // Deep copy
    setShowDetailView(true)
    // Reset master checkboxes when opening detail view
    setMasterValidate(false)
    setMasterReject(false)
  }

  const handleBackToList = () => {
    setShowDetailView(false)
    setSelectedResult(null)
    setMasterValidate(false)
    setMasterReject(false)
  }

  const handleValidationChange = (investigationId, field, value) => {
    if (selectedResult) {
      const updatedInvestigations = selectedResult.investigations.map((inv) => {
        if (inv.id === investigationId) {
          const updatedInv = { ...inv, [field]: value }
          
          // Ensure validate and reject are mutually exclusive
          if (field === 'validate' && value === true) {
            updatedInv.reject = false
          } else if (field === 'reject' && value === true) {
            updatedInv.validate = false
          }
          
          return updatedInv
        }
        return inv
      })
      setSelectedResult({ ...selectedResult, investigations: updatedInvestigations })
      updateMasterCheckboxes(updatedInvestigations)
    }
  }

  const handleSubTestValidationChange = (investigationId, subTestId, field, value) => {
    if (selectedResult) {
      const updatedInvestigations = selectedResult.investigations.map((inv) => {
        if (inv.id === investigationId) {
          const updatedSubTests = inv.subTests.map((subTest) => {
            if (subTest.id === subTestId) {
              const updatedSubTest = { ...subTest, [field]: value }
              
              // Ensure validate and reject are mutually exclusive
              if (field === 'validate' && value === true) {
                updatedSubTest.reject = false
              } else if (field === 'reject' && value === true) {
                updatedSubTest.validate = false
              }
              
              return updatedSubTest
            }
            return subTest
          })
          return { ...inv, subTests: updatedSubTests }
        }
        return inv
      })
      setSelectedResult({ ...selectedResult, investigations: updatedInvestigations })
      updateMasterCheckboxes(updatedInvestigations)
    }
  }

  const updateMasterCheckboxes = (investigations) => {
    if (!investigations || investigations.length === 0) {
      setMasterValidate(false)
      setMasterReject(false)
      return
    }

    // Get all test items (main investigations + sub-tests)
    const allTests = []
    investigations.forEach(inv => {
      if (inv.subTests.length === 0) {
        allTests.push(inv)
      } else {
        allTests.push(...inv.subTests)
      }
    })

    if (allTests.length === 0) {
      setMasterValidate(false)
      setMasterReject(false)
      return
    }

    const allValidated = allTests.every(test => test.validate === true)
    const allRejected = allTests.every(test => test.reject === true)

    setMasterValidate(allValidated)
    setMasterReject(allRejected)
  }

  const handleMasterValidateChange = (checked) => {
    if (selectedResult) {
      setMasterValidate(checked)
      setMasterReject(!checked) // Uncheck reject if validate is checked
      
      const updatedInvestigations = selectedResult.investigations.map(inv => ({
        ...inv,
        validate: checked,
        reject: !checked,
        subTests: inv.subTests.map(subTest => ({
          ...subTest,
          validate: checked,
          reject: !checked
        }))
      }))
      
      setSelectedResult({ ...selectedResult, investigations: updatedInvestigations })
    }
  }

  const handleMasterRejectChange = (checked) => {
    if (selectedResult) {
      setMasterReject(checked)
      setMasterValidate(!checked) // Uncheck validate if reject is checked
      
      const updatedInvestigations = selectedResult.investigations.map(inv => ({
        ...inv,
        validate: !checked,
        reject: checked,
        subTests: inv.subTests.map(subTest => ({
          ...subTest,
          validate: !checked,
          reject: checked
        }))
      }))
      
      setSelectedResult({ ...selectedResult, investigations: updatedInvestigations })
    }
  }

  const handleSubmit = () => {
    if (selectedResult) {
      setLoading(true)

      // Validate that at least one investigation is processed
      const hasProcessedInvestigation = selectedResult.investigations.some(inv => 
        inv.validate || inv.reject || inv.subTests.some(subTest => subTest.validate || subTest.reject)
      )

      if (!hasProcessedInvestigation) {
        showPopup("Please validate or reject at least one investigation before submitting.", "warning")
        setLoading(false)
        return
      }

      // Simulate processing
      setTimeout(() => {
        // Update the main list with processed result
        const updatedList = resultList.map(item =>
          item.id === selectedResult.id ? { 
            ...selectedResult, 
            validated_by: selectedResult.validated_by || "Validator"
          } : item
        )
        setResultList(updatedList)

        showPopup("Results submitted successfully!", "success")
        setShowDetailView(false)
        setSelectedResult(null)
        setMasterValidate(false)
        setMasterReject(false)
        setLoading(false)
      }, 1000)
    }
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

  const filteredResultList = resultList.filter((item) => {
    const barCodeMatch =
      searchData.barCodeSearch === "" ||
      item.id.toString().includes(searchData.barCodeSearch.toLowerCase()) ||
      item.patient_name.toLowerCase().includes(searchData.barCodeSearch.toLowerCase())

    const patientNameMatch =
      searchData.patientName === "" || item.patient_name.toLowerCase().includes(searchData.patientName.toLowerCase())

    const mobileNoMatch =
      searchData.mobileNo === "" ||
      (item.mobile_no && item.mobile_no.includes(searchData.mobileNo))

    return barCodeMatch && patientNameMatch && mobileNoMatch
  })

  const filteredTotalPages = Math.ceil(filteredResultList.length / itemsPerPage) || 1
  const currentItems = filteredResultList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
      setCurrentPage(pageNumber)
    } else {
      showPopup("Please enter a valid page number.", "warning")
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

  // Detail View - UPDATED TABLE STRUCTURE
  if (showDetailView && selectedResult) {
    return (
      <div className="content-wrapper">
        {popupMessage && (
          <Popup
            message={popupMessage.message}
            type={popupMessage.type}
            onClose={popupMessage.onClose}
          />
        )}
        {loading && <LoadingScreen />}
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="card-title p-2">RESULT VALIDATION</h4>
                  <button className="btn btn-secondary" onClick={handleBackToList}>
                    <i className="mdi mdi-arrow-left"></i> Back to List
                  </button>
                </div>
              </div>

              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Result Date</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedResult.result_date}
                      readOnly
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Time</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedResult.result_time}
                      readOnly
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Result Entered By</label>
                    <input
                      type="text"
                      className="form-control"
                      value="Lab Technician"
                      readOnly
                    />
                  </div>
                </div>

                <div className="card mb-4">
                  <div className="card-header bg-light">
                    <h5 className="mb-0">PATIENT DETAILS</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Patient Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedResult.patient_name}
                          readOnly
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Relation</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedResult.relation}
                          readOnly
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Age</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedResult.age}
                          readOnly
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Gender</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedResult.gender}
                          readOnly
                        />
                      </div>
                    </div>
                    <div className="row mt-3">
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Mobile No.</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedResult.mobile_no}
                          readOnly
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Patient ID</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedResult.patientId}
                          readOnly
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Order No.</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedResult.id}
                          readOnly
                        />
                      </div>
                    </div>
                    <div className="row mt-3">
                      <div className="col-12">
                        <label className="form-label fw-bold">Clinical Notes</label>
                        <textarea
                          className="form-control"
                          rows="2"
                          value={selectedResult.clinical_notes}
                          readOnly
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card mb-4">
                  <div className="card-header bg-light">
                    <h5 className="mb-0">VALIDATION DETAILS</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Validation Date</label>
                        <input
                          type="text"
                          className="form-control"
                          value={new Date().toLocaleDateString()}
                          readOnly
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Time</label>
                        <input
                          type="text"
                          className="form-control"
                          value={new Date().toLocaleTimeString()}
                          readOnly
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Validated By</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedResult.validated_by}
                          onChange={(e) => setSelectedResult({ ...selectedResult, validated_by: e.target.value })}
                          placeholder="Enter validator name"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <h5 className="mb-3">INVESTIGATIONS</h5>

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
                        <th className="text-center">
                          <div className="d-flex  align-items-center">
                            <span className="me-2">Validate</span>
                            <div className="form-check mt-1 ">
                              <input
                                className="form-check-input border-primary"
                                type="checkbox"
                                checked={masterValidate}
                                onChange={(e) => handleMasterValidateChange(e.target.checked)}
                                style={{ width: "18px", height: "18px", cursor: "pointer" }}
                              />
                            </div>
                          </div>
                        </th>
                        <th className="text-center">
                          <div className="d-flex  align-items-center">
                            <span className="me-2">Reject</span>
                            <div className="form-check mt-1">
                              <input
                                className="form-check-input border-primary"
                                type="checkbox"
                                checked={masterReject}
                                onChange={(e) => handleMasterRejectChange(e.target.checked)}
                                style={{ width: "18px", height: "18px", cursor: "pointer" }}
                              />
                            </div>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedResult.investigations.map((investigation) => (
                        <>
                          {investigation.subTests.length === 0 ? (
                            // Main investigation without sub-tests
                            <tr key={investigation.id}>
                              <td>{investigation.si_no}</td>
                              <td>{investigation.diag_no}</td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control  bg-transparent"
                                  value={investigation.investigation}
                                  readOnly
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control border-0 bg-transparent"
                                  value={investigation.sample}
                                  readOnly
                                />
                              </td>
                              <td>
                                {renderResultInput(investigation)}
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control border-0 bg-transparent"
                                  value={investigation.units}
                                  readOnly
                                />
                              </td>
                              <td>
                                <textarea
                                  className="form-control border-0 bg-transparent"
                                  rows="1"
                                  value={investigation.normal_range}
                                  readOnly
                                ></textarea>
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={investigation.remarks}
                                  onChange={(e) =>
                                    handleValidationChange(investigation.id, "remarks", e.target.value)
                                  }
                                  placeholder="Enter remarks"
                                />
                              </td>
                              <td className="text-center">
                                <div className="form-check d-flex justify-content-center">
                                  <input
                                    className="form-check-input border-primary"
                                    type="checkbox"
                                    checked={investigation.validate}
                                    onChange={(e) => handleValidationChange(investigation.id, "validate", e.target.checked)}
                                    style={{ width: "20px", height: "20px", cursor: "pointer" }}
                                  />
                                </div>
                              </td>
                              <td className="text-center">
                                <div className="form-check d-flex justify-content-center">
                                  <input
                                    className="form-check-input border-primary"
                                    type="checkbox"
                                    checked={investigation.reject}
                                    onChange={(e) => handleValidationChange(investigation.id, "reject", e.target.checked)}
                                    style={{ width: "20px", height: "20px", cursor: "pointer" }}
                                  />
                                </div>
                              </td>
                            </tr>
                          ) : (
                            // Investigation with sub-tests
                            <>
                              <tr key={investigation.id}>
                                <td>{investigation.si_no}</td>
                                <td>{investigation.diag_no}</td>
                                <td colSpan="8">
                                  <strong>{investigation.investigation}</strong>
                                </td>
                              </tr>
                              {investigation.subTests.map((subTest) => (
                                <tr key={subTest.id}>
                                  <td>{subTest.si_no}</td>
                                  <td>{subTest.diag_no}</td>
                                  <td className="ps-4">
                                    <input
                                      type="text"
                                      className="form-control  bg-transparent"
                                      value={subTest.investigation}
                                      readOnly
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control border-0 bg-transparent"
                                      value={subTest.sample}
                                      readOnly
                                    />
                                  </td>
                                  <td>
                                    {renderResultInput(subTest, true, investigation.id)}
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control border-0 bg-transparent"
                                      value={subTest.units}
                                      readOnly
                                    />
                                  </td>
                                  <td>
                                    <textarea
                                      className="form-control border-0 bg-transparent"
                                      rows="1"
                                      value={subTest.normal_range}
                                      readOnly
                                    ></textarea>
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={subTest.remarks}
                                      onChange={(e) =>
                                        handleSubTestValidationChange(investigation.id, subTest.id, "remarks", e.target.value)
                                      }
                                      placeholder="Enter remarks"
                                    />
                                  </td>
                                  <td className="text-center">
                                    <div className="form-check d-flex justify-content-center">
                                      <input
                                        className="form-check-input border-primary"
                                        type="checkbox"
                                        checked={subTest.validate}
                                        onChange={(e) => handleSubTestValidationChange(investigation.id, subTest.id, "validate", e.target.checked)}
                                        style={{ width: "20px", height: "20px", cursor: "pointer" }}
                                      />
                                    </div>
                                  </td>
                                  <td className="text-center">
                                    <div className="form-check d-flex justify-content-center">
                                      <input
                                        className="form-check-input border-primary"
                                        type="checkbox"
                                        checked={subTest.reject}
                                        onChange={(e) => handleSubTestValidationChange(investigation.id, subTest.id, "reject", e.target.checked)}
                                        style={{ width: "20px", height: "20px", cursor: "pointer" }}
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

                <div className="text-end mt-4">
                  <button className="btn btn-success me-3" onClick={handleSubmit} disabled={loading}>
                    <i className="mdi mdi-check-circle"></i> SUBMIT VALIDATION
                  </button>
                  <button className="btn btn-secondary" onClick={handleBackToList}>
                    <i className="mdi mdi-arrow-left"></i> BACK TO LIST
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // List View (unchanged)
  return (
    <div className="content-wrapper">
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">RESULT VALIDATION</h4>
              <button type="button" className="btn btn-success">
                <i className="mdi mdi-file-document"></i> Generate Report
              </button>
            </div>

            <div className="card-body">
              {loading ? (
                <LoadingScreen />
              ) : (
                <>
                  <div className="card mb-3">
                    <div className="card-header py-3 bg-light border-bottom-1">
                      <h6 className="mb-0 fw-bold">PATIENT SEARCH</h6>
                    </div>
                    <div className="card-body">
                      <form>
                        <div className="row g-4 align-items-end">
                          <div className="col-md-3">
                            <label className="form-label">Bar Code Search</label>
                            <input
                              type="text"
                              className="form-control"
                              id="barCodeSearch"
                              placeholder="Enter bar code"
                              value={searchData.barCodeSearch}
                              onChange={handleSearchChange}
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">Patient Name</label>
                            <input
                              type="text"
                              className="form-control"
                              id="patientName"
                              placeholder="Enter patient name"
                              value={searchData.patientName}
                              onChange={handleSearchChange}
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">Mobile No.</label>
                            <input
                              type="text"
                              className="form-control"
                              id="mobileNo"
                              placeholder="Enter mobile number"
                              value={searchData.mobileNo}
                              onChange={handleSearchChange}
                            />
                          </div>
                          <div className="col-md-3 d-flex">
                            <button type="button" className="btn btn-primary me-2">
                              <i className="fa fa-search"></i> Search
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => {
                                setSearchData({
                                  barCodeSearch: "",
                                  patientName: "",
                                  mobileNo: "",
                                })
                              }}
                            >
                              <i className="mdi mdi-refresh"></i> Reset
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>

                  <div className="d-flex mb-3">
                    <span className="badge bg-danger me-2">Priority-1</span>
                    <span className="badge bg-warning text-dark me-2">Priority-2</span>
                    <span className="badge bg-success">Priority-3</span>
                  </div>

                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Diag No.</th>
                          <th>Result Date</th>
                          <th>Result Time</th>
                          <th>Patient Name</th>
                          <th>Relation</th>
                          <th>Department Name</th>
                          <th>Doctor Name</th>
                          <th>Modality</th>
                          <th>Priority</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((item) => (
                            <tr
                              key={item.id}
                              onClick={() => handleRowClick(item)}
                              style={{ cursor: "pointer" }}
                              className="table-row-hover"
                            >
                              <td>{item.id}</td>
                              <td>{item.result_date}</td>
                              <td>{item.result_time}</td>
                              <td>{item.patient_name}</td>
                              <td>{item.relation}</td>
                              <td>{item.department}</td>
                              <td>{item.doctor_name}</td>
                              <td>{item.modality}</td>
                              <td>
                                <span className={`badge ${getPriorityColor(item.priority)}`}>{item.priority}</span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="10" className="text-center py-4">
                              No results pending validation found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {filteredResultList.length > 0 && (
                    <nav className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        <span>
                          Page {currentPage} of {filteredTotalPages} | Total Records: {filteredResultList.length}
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
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResultValidation