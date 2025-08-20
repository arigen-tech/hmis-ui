import { useState, useEffect } from "react"
import { getRequest, postRequest } from "../../../service/apiService"
import { LAB, DG_MAS_COLLECTION } from "../../../config/apiConfig"
import LoadingScreen from "../../../Components/Loading"
import Popup from "../../../Components/popup"

const PendingForSampleCollection = () => {
  const [samples, setSamples] = useState([])
  const [containerOptions, setContainerOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileQuery, setMobileQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const [selectedSample, setSelectedSample] = useState(null)
  const [showDetailView, setShowDetailView] = useState(false)
  const [popupMessage, setPopupMessage] = useState(null)

  const itemsPerPage = 10

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => setPopupMessage(null)
    })
  }

  // Fetch pending samples data
  useEffect(() => {
    fetchPendingSamples()
    fetchContainerOptions()
  }, [])

  const fetchPendingSamples = async () => {
    try {
      setLoading(true);
      const data = await getRequest(`${LAB}/pending-samples`);

      console.log("Raw API Response:", data); // Debugging - check if IDs exist here

      if (data.status === 200 && data.response) {
        console.log("First sample item:", data.response[0]); // Debugging
        const groupedData = groupInvestigationsByPatient(data.response);
        setSamples(groupedData);
      } else {
        console.error('Error fetching pending samples:', data.message);
        showPopup('Failed to load pending samples', 'error')
      }
    } catch (error) {
      console.error('Error fetching pending samples:', error);
      showPopup('Error fetching pending samples', 'error')
    } finally {
      setLoading(false);
    }
  };

  const fetchContainerOptions = async () => {
    try {
      const data = await getRequest(`${DG_MAS_COLLECTION}/getAll/1`);

      if (data.status === 200 && data.response) {
        setContainerOptions(data.response);
      } else {
        console.error('Error fetching container options:', data.message);
        showPopup('Failed to load container options', 'error')
      }
    } catch (error) {
      console.error('Error fetching container options:', error);
      showPopup('Error fetching container options', 'error')
    }
  };

  // Group investigations by patient
  const groupInvestigationsByPatient = (apiData) => {
    const grouped = {}
    let counter = 1

    apiData.forEach((item) => {
      const patientKey = `${item.patientName}_${item.mobile}_${item.reqDate}_${item.orderNo}`

      if (!grouped[patientKey]) {
        grouped[patientKey] = {
          id: counter++,
          reqDate: formatDate(item.reqDate),
          ReqNo: item.orderNo || '',
          patientName: item.patientName || '',
          relation: item.relation || '',
          name: item.name || '',
          age: item.age || '',
          gender: item.gender || '',
          mobile: item.mobile || '',
          department: item.department || '',
          doctorName: item.doctorName || '',
          priority: item.priority || '',
          investigations: [],
          clinicalNotes: '',
          acceptedBy: item.doctorName || '',
          vistId: item.vistId || 0,
          orderhdId: item.orderhdId || 0
        }
      }

      // Add investigation to the patient's investigations array
      grouped[patientKey].investigations.push({
        id: grouped[patientKey].investigations.length + 1,
        siNo: grouped[patientKey].investigations.length + 1,
        investigation: item.investigation || '',
        sample: item.sample || '',
        container: item.collection || '', // Changed from item.collection
        collected: true,
        empanelled: false,
        remarks: '',
        appointment: false,
        subChargeCodeId: item.subChargeCodeId || 0,
        investigationId: item.investigationId || 0,
        mainChargeCodeId: item.mainChargcodeId || 0, // Changed from mainChargeCodeId to mainChargcodeId
        sampleId: item.sampleId || 0,
        collectionId: item.collectionId || 0
      })
    })

    return Object.values(grouped)
  }

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString('en-GB')
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB')
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const handleMobileSearchChange = (e) => {
    setMobileQuery(e.target.value)
    setCurrentPage(1)
  }

  const handleRowClick = (sample) => {
    setSelectedSample(sample)
    setShowDetailView(true)
  }

  const handleBackToList = () => {
    setShowDetailView(false)
    setSelectedSample(null)
  }

  const handleInvestigationChange = (investigationId, field, value) => {
    if (selectedSample) {
      const updatedInvestigations = selectedSample.investigations.map((inv) =>
        inv.id === investigationId ? { ...inv, [field]: value } : inv,
      )
      setSelectedSample({ ...selectedSample, investigations: updatedInvestigations })
    }
  }

  const handleSubmit = async () => {
    if (selectedSample) {
      try {
        setLoading(true)

        // Prepare the request payload
        const requestPayload = {
          visitId: selectedSample.vistId,
          orderHdId: selectedSample.orderhdId,
          sampleCollectionReq: selectedSample.investigations
            .filter(inv => inv.collected)
            .map(inv => ({
              subChargeCodeId: inv.subChargeCodeId,
              investigationId: inv.investigationId,
              mainChargeCodeId: inv.mainChargeCodeId,
              empanelledStatus: inv.empanelled ? "y" : "n",
              sampleId: inv.sampleId,
              collectionId: inv.collectionId,
              collected: "y",
              remarks: inv.remarks || ""
            }))
        }

        console.log("Submitting payload:", JSON.stringify(requestPayload, null, 2));

        // Make the API call
        const response = await postRequest(`${LAB}/savesamplecollection`, requestPayload)

        if (response.status === 200) {
          const updatedSamples = samples.map((sample) =>
            sample.id === selectedSample.id ? selectedSample : sample
          )
          setSamples(updatedSamples)
          showPopup("Sample collection data saved successfully!", "success")
        } else {
          throw new Error(response.message || "Failed to save sample collection")
        }
      } catch (error) {
        console.error('Error saving sample collection:', error)
        showPopup(error.message || "Error saving sample collection data", "error")
      } finally {
        setLoading(false)
      }
    }
  }

  const handleReset = () => {
    if (selectedSample) {
      const originalSample = samples.find((s) => s.id === selectedSample.id)
      setSelectedSample({ ...originalSample })
    }
  }

  const filteredSamples = samples.filter(
    (item) =>
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mobile.includes(mobileQuery),
  )

  const filteredTotalPages = Math.ceil(filteredSamples.length / itemsPerPage)
  const currentItems = filteredSamples.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

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

  if (showDetailView && selectedSample) {
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
                  <h4 className="card-title p-2">SAMPLE COLLECTION</h4>
                  <button className="btn btn-secondary" onClick={handleBackToList}>
                    <i className="mdi mdi-arrow-left"></i> Back to List
                  </button>
                </div>
              </div>
              <div className="card-body">
                {/* Sample Collection Header */}
                <div className="row mb-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Req Date</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedSample.reqDate}
                      onChange={(e) => setSelectedSample({ ...selectedSample, reqDate: e.target.value })}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Req Time</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedSample.reqTime}
                      onChange={(e) => setSelectedSample({ ...selectedSample, reqTime: e.target.value })}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Req No.</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedSample.ReqNo || ''}
                      onChange={(e) => setSelectedSample({ ...selectedSample, ReqNo: e.target.value })}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Department</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedSample.department}
                      onChange={(e) => setSelectedSample({ ...selectedSample, department: e.target.value })}
                    />
                  </div>
                </div>

                {/* Patient Details */}
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">PATIENT DETAILS</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Patient Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedSample.patientName}
                          onChange={(e) => setSelectedSample({ ...selectedSample, patientName: e.target.value })}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Relation</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedSample.relation}
                          onChange={(e) => setSelectedSample({ ...selectedSample, relation: e.target.value })}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Mobile No.</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedSample.mobile}
                          onChange={(e) => setSelectedSample({ ...selectedSample, mobile: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="row mt-3">
                      {/* <div className="col-md-4">
                        <label className="form-label fw-bold">Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedSample.name}
                          onChange={(e) => setSelectedSample({ ...selectedSample, name: e.target.value })}
                        />
                      </div> */}
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Age</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedSample.age}
                          onChange={(e) => setSelectedSample({ ...selectedSample, age: e.target.value })}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Gender</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedSample.gender}
                          onChange={(e) => setSelectedSample({ ...selectedSample, gender: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sample Details */}
                {/* <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">SAMPLE DETAILS</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Date</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedSample.reqDate}
                          onChange={(e) => setSelectedSample({ ...selectedSample, reqDate: e.target.value })}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Time</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedSample.reqTime}
                          onChange={(e) => setSelectedSample({ ...selectedSample, reqTime: e.target.value })}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">
                          Accepted By <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedSample.acceptedBy}
                          onChange={(e) => setSelectedSample({ ...selectedSample, acceptedBy: e.target.value })}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Diagnostic No.</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedSample.reqNo}
                          onChange={(e) => setSelectedSample({ ...selectedSample, reqNo: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="row mt-3">
                      <div className="col-12">
                        <label className="form-label fw-bold">Clinical Notes</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={selectedSample.clinicalNotes}
                          onChange={(e) => setSelectedSample({ ...selectedSample, clinicalNotes: e.target.value })}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div> */}

                {/* Investigations Table */}
                <div className="table-responsive">
                  <table className="table table-bordered table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>SI No.</th>
                        <th>Investigation</th>
                        <th>Sample</th>
                        <th>Container</th>
                        <th>Collected</th>
                        <th>Empanelled</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSample.investigations.map((investigation) => (
                        <tr key={investigation.id}>
                          <td>{investigation.siNo}</td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={investigation.investigation}
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
                              onChange={(e) => handleInvestigationChange(investigation.id, "sample", e.target.value)}
                            />
                          </td>
                          <td>
                            <select
                              className="form-select"
                              value={investigation.container}
                              onChange={(e) => handleInvestigationChange(investigation.id, "container", e.target.value)}
                            >
                              <option value="">Select Container</option>
                              {containerOptions.map((container, index) => (
                                <option key={container.collectionId || index} value={container.collectionName}>
                                  {container.collectionName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={investigation.collected}
                                onChange={(e) =>
                                  handleInvestigationChange(investigation.id, "collected", e.target.checked)
                                }
                              />
                            </div>
                          </td>
                          <td>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={investigation.empanelled}
                                onChange={(e) =>
                                  handleInvestigationChange(investigation.id, "empanelled", e.target.checked)
                                }
                              />
                            </div>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={investigation.remarks}
                              onChange={(e) => handleInvestigationChange(investigation.id, "remarks", e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Action Buttons */}
                <div className="text-center mt-4">
                  <button className="btn btn-primary me-3" onClick={handleSubmit} disabled={loading}>
                    <i className="mdi mdi-content-save"></i> SUBMIT
                  </button>
                  <button className="btn btn-secondary" onClick={handleReset} disabled={loading}>
                    <i className="mdi mdi-refresh"></i> RESET
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
            <div className="card-header">
              <h4 className="card-title p-2">PENDING FOR SAMPLE COLLECTION</h4>
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
                      <div>
                        <div className="row g-4 align-items-end">
                          <div className="col-md-4">
                            <label className="form-label">Patient Name</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Enter patient name"
                              value={searchQuery}
                              onChange={handleSearchChange}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Mobile No.</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Enter mobile number"
                              value={mobileQuery}
                              onChange={handleMobileSearchChange}
                            />
                          </div>
                          <div className="col-md-4 d-flex">
                            <button type="button" className="btn btn-primary me-2">
                              <i className="fa fa-search"></i> Search
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => {
                                setSearchQuery("")
                                setMobileQuery("")
                              }}
                            >
                              <i className="mdi mdi-refresh"></i> Reset
                            </button>
                          </div>
                        </div>
                      </div>
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
                          <th>Req Date</th>
                          <th>Patient Name</th>
                          <th>Relation</th>
                          <th>Name</th>
                          <th>Age</th>
                          <th>Gender</th>
                          <th>Mobile No.</th>
                          <th>Department</th>
                          <th>Doctor Name</th>
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
                              <td>{item.reqDate}</td>
                              <td>{item.patientName}</td>
                              <td>{item.relation}</td>
                              <td>{item.name}</td>
                              <td>{item.age}</td>
                              <td>{item.gender}</td>
                              <td>{item.mobile}</td>
                              <td>{item.department}</td>
                              <td>{item.doctorName}</td>
                              <td>
                                <span className={`badge ${getPriorityColor(item.priority)}`}>{item.priority}</span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="10" className="text-center py-4">
                              No pending samples found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {filteredSamples.length > 0 && (
                    <nav className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        <span>
                          Page {currentPage} of {filteredTotalPages} | Total Records: {filteredSamples.length}
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

export default PendingForSampleCollection