import { useState, useEffect } from "react"
import { getRequest, postRequest } from "../../../service/apiService"
import { LAB } from "../../../config/apiConfig"
import LoadingScreen from "../../../Components/Loading"
import Popup from "../../../Components/popup"

const UpdateResultValidation = () => {
  const [resultList, setResultList] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchData, setSearchData] = useState({
    patientName: "",
    mobileNo: "",
  })
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const [selectedResult, setSelectedResult] = useState(null)
  const [showDetailView, setShowDetailView] = useState(false)
  const itemsPerPage = 5

  // Mock data for demonstration
  const mockValidationData = [
    {
      id: 1,
      order_date: "15/01/2024",
      order_no: "ORD-001",
      order_time: "09:15 AM",
      patient_name: "John Doe",
      relation: "Self",
      doctor_name: "Dr. Smith",
      age: "35",
      gender: "Male",
      clinical_notes: "Routine checkup",
      mobile_no: "9876543210",
      investigations: [
        {
          id: 1,
          si_no: 1,
          diag_no: "D001",
          investigation: "Complete Blood Count",
          sample: "Blood",
          result: "Normal",
          units: "-",
          normal_range: "Normal",
          remarks: "",
          reject: false,
          subTests: [
            {
              id: "1.1",
              si_no: "",
              diag_no: "---",
              investigation: "Hemoglobin",
              sample: "Blood",
              result: "14.2",
              units: "g/dL",
              normal_range: "13.5-17.5",
              remarks: "",
              reject: false,
            },
            {
              id: "1.2",
              si_no: "1.b",
              diag_no: "---",
              investigation: "WBC Count",
              sample: "Blood",
              result: "7,500",
              units: "cells/μL",
              normal_range: "4,500-11,000",
              remarks: "",
              reject: false,
            },
          ],
        },
        {
          id: 2,
          si_no: 2,
          diag_no: "D002",
          investigation: "Blood Glucose",
          sample: "Blood",
          result: "95",
          units: "mg/dL",
          normal_range: "70-110",
          remarks: "",
          reject: false,
          subTests: [],
        },
      ],
    },
    {
      id: 2,
      order_date: "16/01/2024",
      order_no: "ORD-002",
      order_time: "10:45 AM",
      patient_name: "Jane Smith",
      relation: "Self",
      doctor_name: "Dr. Johnson",
      age: "28",
      gender: "Female",
      clinical_notes: "Follow-up test",
      mobile_no: "9876543211",
      investigations: [
        {
          id: 1,
          si_no: 1,
          diag_no: "D003",
          investigation: "Urine Analysis",
          sample: "Urine",
          result: "Clear",
          units: "-",
          normal_range: "Clear",
          remarks: "",
          reject: false,
          subTests: [],
        },
      ],
    },
  ]

  useEffect(() => {
    // Simulate API call with mock data
    setLoading(true)
    setTimeout(() => {
      setResultList(mockValidationData)
      setLoading(false)
    }, 1000)
  }, [])

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

  const handleValidate = async () => {
    try {
      setLoading(true)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      showPopup("Results validated successfully!", "success")
      setShowDetailView(false)
      setSelectedResult(null)
    } catch (error) {
      showPopup("Error validating results", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    if (selectedResult) {
      const originalResult = resultList.find((r) => r.id === selectedResult.id)
      setSelectedResult({ ...originalResult })
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
   
    const patientNameMatch =
      searchData.patientName === "" || item.patient_name.toLowerCase().includes(searchData.patientName.toLowerCase())

    const mobileNoMatch = searchData.mobileNo === "" || (item.mobile_no && item.mobile_no.includes(searchData.mobileNo))

    return  patientNameMatch && mobileNoMatch
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
          <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
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
                {/* Collection Date */}
                

                {/* Patient Details */}
                <div className="card mb-4">
                  <div className="card-header bg-light">
                    <h5 className="mb-0">PATIENT DETAILS</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Patient Name</label>
                        <input type="text" className="form-control" value={selectedResult.patient_name} readOnly />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Relation</label>
                        <input type="text" className="form-control" value={selectedResult.relation} readOnly />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Age</label>
                        <input type="text" className="form-control" value={selectedResult.age} readOnly />
                      </div>
                    </div>
                    <div className="row mt-3">
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Gender</label>
                        <input type="text" className="form-control" value={selectedResult.gender} readOnly />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Mobile No.</label>
                        <input type="text" className="form-control" value={selectedResult.mobile_no} readOnly />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Department</label>
                        <input type="text" className="form-control" value={selectedResult.department} readOnly />
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

                {/* Order Details Section - ONLY THREE FIELDS */}
                <div className="card mb-4">
                  <div className="card-header bg-light">
                    <h5 className="mb-0">ORDER DETAILS</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Order Date</label>
                        <input type="text" className="form-control" value={selectedResult.order_date} readOnly />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Order Number</label>
                        <input type="text" className="form-control" value={selectedResult.order_no} readOnly />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Order Time</label>
                        <input type="text" className="form-control" value={selectedResult.order_time} readOnly />
                      </div>
                    </div>
                  </div>
                </div>

            

                {/* Investigations Table */}
                <div className="table-responsive" style={{ overflowX: "auto" }}>
                  <table 
                    className="table table-bordered table-hover" 
                    style={{ 
                      marginBottom: "0",
                      tableLayout: "fixed",
                      width: "100%",
                      minWidth: "800px"
                    }}
                  >
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "60px" }}>SI No.</th>
                        <th style={{ width: "80px" }}>Diag No.</th>
                        <th style={{ width: "200px" }}>Investigation</th>
                        <th style={{ width: "80px" }}>Sample</th>
                        <th style={{ width: "80px" }}>Result</th>
                        <th style={{ width: "60px" }}>Units</th>
                        <th style={{ width: "120px" }}>Normal Range</th>
                        <th style={{ width: "100px" }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedResult.investigations.map((investigation) => (
                        <>
                          {investigation.subTests.length === 0 ? (
                            // Main investigation without sub-tests
                            <tr key={investigation.id}>
                              <td style={{ padding: "4px", textAlign: "center", width: "60px" }}>
                                {investigation.si_no}
                              </td>
                              <td style={{ padding: "4px", textAlign: "center", width: "80px" }}>
                                {investigation.diag_no}
                              </td>
                              <td style={{ padding: "4px", width: "200px" }}>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={investigation.investigation}
                                  readOnly
                                  style={{ border: "none", backgroundColor: "transparent", padding: "2px 4px" }}
                                />
                              </td>
                              <td style={{ padding: "4px", width: "80px" }}>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={investigation.sample}
                                  readOnly
                                  style={{ border: "none", backgroundColor: "transparent", padding: "2px 4px" }}
                                />
                              </td>
                              <td style={{ padding: "4px", width: "80px" }}>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={investigation.result}
                                  readOnly
                                  style={{ border: "none", backgroundColor: "transparent", padding: "2px 4px" }}
                                />
                              </td>
                              <td style={{ padding: "4px", width: "60px" }}>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={investigation.units}
                                  readOnly
                                  style={{ border: "none", backgroundColor: "transparent", padding: "2px 4px" }}
                                />
                              </td>
                              <td style={{ padding: "4px", width: "120px" }}>
                                <textarea
                                  className="form-control"
                                  rows="1"
                                  value={investigation.normal_range}
                                  readOnly
                                  style={{ 
                                    border: "none", 
                                    backgroundColor: "transparent", 
                                    padding: "2px 4px",
                                    resize: "none",
                                    height: "auto",
                                    minHeight: "34px"
                                  }}
                                ></textarea>
                              </td>
                              <td style={{ padding: "4px", width: "100px" }}>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={investigation.remarks}
                                  onChange={(e) =>
                                    handleInvestigationChange(investigation.id, "remarks", e.target.value)
                                  }
                                  style={{ padding: "2px 4px", fontSize: "0.875rem" }}
                                />
                              </td>
                            </tr>
                          ) : (
                            // Investigation with sub-tests
                            <>
                              {/* Main investigation row (header) */}
                              <tr key={investigation.id}>
                                <td style={{ padding: "4px", textAlign: "center", width: "60px" }}>
                                  {investigation.si_no}
                                </td>
                                <td style={{ padding: "4px", textAlign: "center", width: "80px" }}>
                                  {investigation.diag_no}
                                </td>
                                <td colSpan="6" style={{ padding: "4px" }}>
                                  <strong>{investigation.investigation}</strong>
                                </td>
                              </tr>
                              {/* Sub-test rows */}
                              {investigation.subTests.map((subTest) => (
                                <tr key={subTest.id}>
                                  <td style={{ padding: "4px", textAlign: "center", width: "60px" }}>
                                    {subTest.si_no}
                                  </td>
                                  <td style={{ padding: "4px", textAlign: "center", width: "80px" }}>
                                    {subTest.diag_no}
                                  </td>
                                  <td style={{ padding: "4px", width: "200px" }}>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={subTest.investigation}
                                      readOnly
                                      style={{ border: "none", backgroundColor: "transparent", padding: "2px 4px" }}
                                    />
                                  </td>
                                  <td style={{ padding: "4px", width: "80px" }}>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={subTest.sample}
                                      readOnly
                                      style={{ border: "none", backgroundColor: "transparent", padding: "2px 4px" }}
                                    />
                                  </td>
                                  <td style={{ padding: "4px", width: "80px" }}>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={subTest.result}
                                      readOnly
                                      style={{ border: "none", backgroundColor: "transparent", padding: "2px 4px" }}
                                    />
                                  </td>
                                  <td style={{ padding: "4px", width: "60px" }}>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={subTest.units}
                                      readOnly
                                      style={{ border: "none", backgroundColor: "transparent", padding: "2px 4px" }}
                                    />
                                  </td>
                                  <td style={{ padding: "4px", width: "120px" }}>
                                    <textarea
                                      className="form-control"
                                      rows="1"
                                      value={subTest.normal_range}
                                      readOnly
                                      style={{ 
                                        border: "none", 
                                        backgroundColor: "transparent", 
                                        padding: "2px 4px",
                                        resize: "none",
                                        height: "auto",
                                        minHeight: "34px"
                                      }}
                                    ></textarea>
                                  </td>
                                  <td style={{ padding: "4px", width: "100px" }}>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={subTest.remarks}
                                      onChange={(e) =>
                                        handleSubTestChange(investigation.id, subTest.id, "remarks", e.target.value)
                                      }
                                      style={{ padding: "2px 4px", fontSize: "0.875rem" }}
                                    />
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
                  <button className="btn btn-success me-3" onClick={handleValidate} disabled={loading}>
                    <i className="mdi mdi-check-all"></i> UPDATE
                  </button>
                  <button className="btn btn-secondary me-3" onClick={handleReset} disabled={loading}>
                    <i className="mdi mdi-refresh"></i> RESET
                  </button>
                  <button className="btn btn-secondary" onClick={handleBackToList}>
                    <i className="mdi mdi-arrow-left"></i> BACK
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
      {popupMessage && <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />}
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">PENDING FOR RESULT VALIDATION</h4>
              <button type="button" className="btn btn-success">
                <i className="mdi mdi-plus"></i> Generate Report
              </button>
            </div>

            <div className="card-body">
              {loading ? (
                <LoadingScreen />
              ) : (
                <>
                  {/* Patient Search Section */}
                  <div className="card mb-3">
                    <div className="card-header py-3 bg-light border-bottom-1">
                      <h6 className="mb-0 fw-bold">PATIENT SEARCH</h6>
                    </div>
                    <div className="card-body">
                      <form>
                        <div className="row g-4 align-items-end">
                          
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

                  {/* Priority Legend */}
                  <div className="d-flex mb-3">
                    <span className="badge bg-danger me-2">Priority-1</span>
                    <span className="badge bg-warning text-dark me-2">Priority-2</span>
                    <span className="badge bg-success">Priority-3</span>
                  </div>

                  {/* Table */}
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Order Date</th>
                          <th>Order No.</th>
                          <th>Patient Name</th>
                          <th>Mobile No</th>
                          <th>Relation</th>
                          <th>Doctor Name</th>
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
                              <td>{item.patient_name}</td>
                            <td>{item.mobile_no}</td>
                              <td>{item.relation}</td>
                              <td>{item.doctor_name}</td>
                             
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="10" className="text-center py-4">
                              No pending validation entries found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
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

export default UpdateResultValidation