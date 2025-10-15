import { useState, useEffect } from "react"
import { getRequest, postRequest } from "../../../service/apiService"
import { LAB } from "../../../config/apiConfig"
import LoadingScreen from "../../../Components/Loading"
import Popup from "../../../Components/popup"

const PendingForResultEntry = () => {
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
  const itemsPerPage = 5

  // Fetch pending result entry data
  useEffect(() => {
    fetchPendingResultEntries()
  }, [])

  const fetchPendingResultEntries = async () => {
    try {
      setLoading(true);
      const data = await getRequest(`${LAB}/resultStatus`);

      console.log("Raw API Response:", data); // Debugging

      if (data.status === 200 && data.response) {
        console.log("First result item:", data.response[0]); // Debugging
        const formattedData = formatResultEntryData(data.response);
        setResultList(formattedData);
      } else {
        console.error('Error fetching pending result entries:', data.message);
        showPopup('Failed to load pending result entries', 'error')
      }
    } catch (error) {
      console.error('Error fetching pending result entries:', error);
      showPopup('Error fetching pending result entries', 'error')
    } finally {
      setLoading(false);
    }
  };

  const formatResultEntryData = (apiData) => {
    return apiData.map((item, index) => ({
      id: index + 1,
      order_date: formatDate(item.orderDate),
      order_no: item.orderNo || '',
      collection_date: formatDate(item.collectedDate),
      collection_time: formatTime(item.collectedTime),
      patient_name: item.patientName || '',
      relation: item.relation || '',
      department: item.department || '',
      doctor_name:  /*item.doctorName */''|| '',
      modality: item.subChargeCodeName || '',
      priority: "Priority-3", // Default priority since not in API
      age: item.patientAge || '',
      gender: item.patientGender || '',
      clinical_notes: '',
      entered_by: item.enteredBy || '', // Added enteredBy from API
      patientId: item.patientId || 0,
      subChargeCodeId: item.subChargeCodeId || 0,
      mobile_no: item.patientPhoneNo || '', // Added mobile number for search filtering
      investigations: item.resultInvestigationResponseList ? item.resultInvestigationResponseList.map((inv, invIndex) => ({
        id: invIndex + 1,
        si_no: invIndex + 1,
        diag_no: inv.diagNo || '',
        investigation: inv.investigationName || '',
        sample: inv.resultSubInvestigationResponseList && inv.resultSubInvestigationResponseList.length > 0 
          ? inv.resultSubInvestigationResponseList[0].sampleName 
          : '',
        result: "",
        units: inv.resultSubInvestigationResponseList && inv.resultSubInvestigationResponseList.length > 0 
          ? inv.resultSubInvestigationResponseList[0].unit 
          : '',
        normal_range: inv.resultSubInvestigationResponseList && inv.resultSubInvestigationResponseList.length > 0 
          ? inv.resultSubInvestigationResponseList[0].normalRange 
          : '',
        remarks: "",
        reject: false,
        investigationId: inv.investigationId || 0,
        subTests: inv.resultSubInvestigationResponseList ? inv.resultSubInvestigationResponseList.map((subTest, subIndex) => ({
          id: `${invIndex + 1}.${subIndex + 1}`,
          si_no: `${invIndex + 1}.${getSubIndex(subIndex)}`, // Use a,b,c instead of numbers
          diag_no: "---",
          investigation: subTest.subInvestigationName || '',
          sample: subTest.sampleName || '',
          result: "",
          units: subTest.unit || '',
          normal_range: subTest.normalRange || '',
          remarks: "",
          reject: false,
          subInvestigationId: subTest.subInvestigationId || 0,
          sampleId: subTest.sampleId || 0
        })) : []
      })) : []
    }))
  }

  // Function to convert number to a,b,c format
  const getSubIndex = (index) => {
    return String.fromCharCode(97 + index); // 97 is 'a' in ASCII
  }

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString('en-GB')
    
    // Handle LocalDateTime object or string
    if (typeof dateString === 'string') {
      const date = new Date(dateString)
      return isNaN(date.getTime()) ? new Date().toLocaleDateString('en-GB') : date.toLocaleDateString('en-GB')
    } else if (dateString instanceof Date) {
      return dateString.toLocaleDateString('en-GB')
    } else {
      // If it's an object (LocalDateTime), try to parse it
      try {
        // Handle Java LocalDateTime/LocalTime objects that might come as strings or objects
        const dateStr = JSON.stringify(dateString);
        const parsedDate = new Date(dateStr.replace(/"/g, ''));
        return isNaN(parsedDate.getTime()) ? new Date().toLocaleDateString('en-GB') : parsedDate.toLocaleDateString('en-GB');
      } catch {
        return new Date().toLocaleDateString('en-GB')
      }
    }
  }

  const formatTime = (timeValue) => {
    if (!timeValue) return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    
    try {
      // Handle different time formats that might come from Java LocalTime
      if (typeof timeValue === 'string') {
        // If it's already a string time like "11:28:55.9"
        const timeParts = timeValue.split(':');
        if (timeParts.length >= 2) {
          return `${timeParts[0]}:${timeParts[1]}`; // Return just hours and minutes
        }
        const date = new Date(`1970-01-01T${timeValue}`);
        return isNaN(date.getTime()) ? 
          new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 
          date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      } else if (timeValue instanceof Date) {
        return timeValue.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      } else {
        // If it's an object (LocalTime), try to extract hours and minutes
        const timeStr = JSON.stringify(timeValue);
        // Try to parse hours and minutes from the object
        const match = timeStr.match(/"hour":(\d+).*?"minute":(\d+)/);
        if (match) {
          const hours = match[1].padStart(2, '0');
          const minutes = match[2].padStart(2, '0');
          return `${hours}:${minutes}`;
        }
        return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      }
    } catch (error) {
      console.error('Error formatting time:', error, timeValue);
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
        inv.id === investigationId ? { ...inv, [field]: value } : inv
      )
      setSelectedResult({ ...selectedResult, investigations: updatedInvestigations })
    }
  }

  const handleSubTestChange = (investigationId, subTestId, field, value) => {
    if (selectedResult) {
      const updatedInvestigations = selectedResult.investigations.map((inv) => {
        if (inv.id === investigationId) {
          const updatedSubTests = inv.subTests.map((subTest) =>
            subTest.id === subTestId ? { ...subTest, [field]: value } : subTest
          )
          return { ...inv, subTests: updatedSubTests }
        }
        return inv
      })
      setSelectedResult({ ...selectedResult, investigations: updatedInvestigations })
    }
  }

  const handleSubmit = async () => {
    if (selectedResult) {
      try {
        setLoading(true)

        // Prepare the request payload according to your API
        const requestPayload = {
          orderNo: selectedResult.order_no,
          patientId: selectedResult.patientId,
          resultEntries: selectedResult.investigations.flatMap(inv => {
            const mainTest = {
              investigationId: inv.investigationId,
              result: inv.result,
              remarks: inv.remarks,
              reject: inv.reject
            }

            const subTests = inv.subTests.map(subTest => ({
              subInvestigationId: subTest.subInvestigationId,
              result: subTest.result,
              remarks: subTest.remarks,
              reject: subTest.reject
            }))

            return [mainTest, ...subTests]
          })
        }

        console.log("Submitting result entry payload:", JSON.stringify(requestPayload, null, 2));

        // Make the API call to your result entry endpoint
        // Note: You'll need to create this endpoint or use the appropriate one
        const response = await postRequest(`${LAB}/submitResults`, requestPayload)

        if (response.status === 200 || response.ok) {
          showPopup("Results submitted successfully!", "success")
          await fetchPendingResultEntries()
          setShowDetailView(false)
          setSelectedResult(null)
        } else {
          throw new Error(response.message || "Failed to submit results")
        }
      } catch (error) {
        console.error('Error submitting results:', error)
        showPopup(error.message || "Error submitting results", "error")
      } finally {
        setLoading(false)
      }
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
                      value={selectedResult.collection_date}
                      readOnly
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
                          value={selectedResult.patient_name}
                          readOnly
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Relation</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedResult.relation}
                          readOnly
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Age</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedResult.age}
                          readOnly
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
                          value={selectedResult.collection_date}
                          readOnly
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Time</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedResult.collection_time}
                          readOnly
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">
                          Entered By <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedResult.entered_by}
                          onChange={(e) => setSelectedResult({ ...selectedResult, entered_by: e.target.value })}
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
                              <td>{investigation.si_no}</td>
                              <td>{investigation.diag_no}</td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={investigation.investigation}
                                  readOnly
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={investigation.sample}
                                  readOnly
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={investigation.result}
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
                                  readOnly
                                />
                              </td>
                              <td>
                                <textarea
                                  className="form-control"
                                  rows="2"
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
                                    onChange={(e) =>
                                      handleInvestigationChange(investigation.id, "reject", e.target.checked)
                                    }
                                    style={{ width: "20px", height: "20px", border: "2px solid black" }}
                                  />
                                </div>
                              </td>
                            </tr>
                          ) : (
                            <>
                              <tr key={investigation.id}>
                                <td>{investigation.si_no}</td>
                                <td>{investigation.diag_no}</td>
                                <td colSpan="7">
                                  <strong>{investigation.investigation}</strong>
                                </td>
                              </tr>
                              {investigation.subTests.map((subTest) => (
                                <tr key={subTest.id}>
                                  <td>{subTest.si_no}</td> {/* This will now show a, b, c, etc. */}
                                  <td>{subTest.diag_no}</td>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={subTest.investigation}
                                      readOnly
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={subTest.sample}
                                      readOnly
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={subTest.result}
                                      onChange={(e) =>
                                        handleSubTestChange(
                                          investigation.id,
                                          subTest.id,
                                          "result",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={subTest.units}
                                      readOnly
                                    />
                                  </td>
                                  <td>
                                    <textarea
                                      className="form-control"
                                      rows="2"
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
                                        onChange={(e) =>
                                          handleSubTestChange(investigation.id, subTest.id, "reject", e.target.checked)
                                        }
                                        style={{ width: "20px", height: "20px", border: "2px solid black" }}
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
                  <button className="btn btn-primary me-3" onClick={handleSubmit} disabled={loading}>
                    <i className="mdi mdi-content-save"></i> SUBMIT
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

  // List View
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
              <h4 className="card-title p-2">PENDING FOR RESULT ENTRY</h4>
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
                              No pending result entries found
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

export default PendingForResultEntry