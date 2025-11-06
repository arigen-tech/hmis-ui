import { useState } from "react"
import LoadingScreen from "../../../Components/Loading"
import Popup from "../../../Components/popup"

const ResultValidation = () => {
  const [resultList, setResultList] = useState([
    {
      id: 1,
      order_date: "15/12/2023",
      order_no: "ORD001",
      collection_date: "15/12/2023",
      collection_time: "10:30",
      patient_name: "John Doe",
      relation: "Self",
      department: "Pathology",
      doctor_name: "Dr. Smith",
      modality: "Blood Test",
      priority: "Priority-3",
      age: "35",
      gender: "Male",
      clinical_notes: "Routine checkup",
      validated_by: "",
      patientId: 101,
      mobile_no: "9876543210",
      investigations: [
        {
          id: 1,
          si_no: 1,
          diag_no: "D001",
          investigation: "Complete Blood Count",
          sample: "Blood",
          result: "Normal",
          units: "10^3/µL",
          normal_range: "4.5-11.0",
          remarks: "",
          reject: false,
          validate: false,
          subTests: []
        },
        {
          id: 2,
          si_no: 2,
          diag_no: "D002",
          investigation: "Liver Function Test",
          sample: "Blood",
          result: "",
          units: "",
          normal_range: "",
          remarks: "",
          reject: false,
          validate: false,
          subTests: [
            {
              id: "2.1",
              si_no: "2.a",
              diag_no: "---",
              investigation: "ALT",
              sample: "Blood",
              result: "25",
              units: "U/L",
              normal_range: "7-56",
              remarks: "",
              reject: false,
              validate: false,
            },
            {
              id: "2.2",
              si_no: "2.b",
              diag_no: "---",
              investigation: "AST",
              sample: "Blood",
              result: "30",
              units: "U/L",
              normal_range: "5-40",
              remarks: "",
              reject: false,
              validate: false,
            }
          ]
        }
      ]
    },
    {
      id: 2,
      order_date: "16/12/2023",
      order_no: "ORD002",
      collection_date: "16/12/2023",
      collection_time: "11:15",
      patient_name: "Jane Smith",
      relation: "Self",
      department: "Biochemistry",
      doctor_name: "Dr. Johnson",
      modality: "Urine Test",
      priority: "Priority-2",
      age: "28",
      gender: "Female",
      clinical_notes: "Follow up",
      validated_by: "",
      patientId: 102,
      mobile_no: "9876543211",
      investigations: [
        {
          id: 1,
          si_no: 1,
          diag_no: "D003",
          investigation: "Urine Analysis",
          sample: "Urine",
          result: "Negative",
          units: "",
          normal_range: "Negative",
          remarks: "",
          reject: false,
          validate: false,
          subTests: []
        }
      ]
    }
  ])

  const [loading, setLoading] = useState(false)
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

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
      },
    })
  }

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
      item.order_no.toLowerCase().includes(searchData.barCodeSearch.toLowerCase()) ||
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

  // Detail View
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
                      value={selectedResult.collection_date}
                      readOnly
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Time</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedResult.collection_time}
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
                          value={selectedResult.order_no}
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
                            <div className="form-check mt-1  border-2 ">
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
                                  className="form-control border-0 bg-transparent"
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
                                <input
                                  type="text"
                                  className="form-control border-0 bg-transparent"
                                  value={investigation.result}
                                  readOnly
                                />
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
                              <tr key={investigation.id} className="table-primary">
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
                                      className="form-control border-0 bg-transparent"
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
                                    <input
                                      type="text"
                                      className="form-control border-0 bg-transparent"
                                      value={subTest.result}
                                      readOnly
                                    />
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
                        {currentItems.length > 0 ? (
                          currentItems.map((item) => (
                            <tr
                              key={item.id}
                              onClick={() => handleRowClick(item)}
                              style={{ cursor: "pointer" }}
                              className="table-row-hover"
                            >
                              <td>{item.order_date}</td>
                              <td>{item.order_no}</td>
                              <td>{item.collection_date}</td>
                              <td>{item.collection_time}</td>
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