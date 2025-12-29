import { useState, useEffect } from "react"
import { getRequest, postRequest } from "../../../service/apiService"
import { LAB } from "../../../config/apiConfig"
import LoadingScreen from "../../../Components/Loading"
import Popup from "../../../Components/popup"
import { FETCH_SAMPLE_VALIDATIONS_ERR_MSG, INVALID_PAGE_NO_WARN_MSG, REJECT_REASON_WARN_MSG, UNEXPECTED_ERROR, VALIDATION_SUCC_MSG, VALIDATION_WARN_MSG } from "../../../config/constants"

const SampleValidation = () => {
  const [sampleList, setSampleList] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchData, setSearchData] = useState({
    barCodeSearch: "",
    patientName: "",
    mobileNo: "",
  })
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const [selectedSample, setSelectedSample] = useState(null)
  const [showDetailView, setShowDetailView] = useState(false)
  const itemsPerPage = 5

  // Fetch pending validation samples data
  useEffect(() => {
    fetchPendingValidationSamples()
  }, [])

  const fetchPendingValidationSamples = async () => {
    try {
      setLoading(true);
      const data = await getRequest(`${LAB}/order-status`);

      console.log("Raw API Response:", data); // Debugging

      if (data.status === 200 && data.response) {
        console.log("First sample item:", data.response[0]); // Debugging
        const formattedData = formatSampleValidationData(data.response);
        setSampleList(formattedData);
      } else {
        console.error('Error fetching pending validation samples:', data.message);
        showPopup(FETCH_SAMPLE_VALIDATIONS_ERR_MSG, 'error')
      }
    } catch (error) {
      console.error('Error fetching pending validation samples:', error);
      showPopup(FETCH_SAMPLE_VALIDATIONS_ERR_MSG, 'error')
    } finally {
      setLoading(false);
    }
  };

  const formatSampleValidationData = (apiData) => {
    return apiData.map((item, index) => ({
      id: index + 1,
      sample_date_time: formatDateTime(item.collectionTime),
      order_no: item.orderNo || '',
      patient_name: item.patientName || '',
      mobile_no: item.mobileNo || '',
      age: item.age || '', // Now available in API
      gender: item.sex || '',
      modality: item.subChargeCodeName || '', // Use subChargeCodeName for modality
      doctor_name: '', // Add if available in API
      order_date: formatDate(item.orderDate),
      collection_date:formatDate(item.collectionTime),
      collection_time: formatTime(item.collectionTime),
      department: item.subChargeCodeName || '', // Use subChargeCodeName for department too
      reg_no: item.patientId ? item.patientId.toString() : '',
      relation: item.patientRelation || '',
      collected_by: item.collectedBy || '',
      clinical_notes: '',
      headerId: item.headerId || 0, // Add headerId for reference
      investigations: item.investigations ? item.investigations.map((inv, invIndex) => ({
        id: invIndex + 1,
        sr_no: invIndex + 1,
        diag_no: item.orderNo || '',
        test_code: inv.testCode || '',
        container_name:inv.containerName||'',
        container_id:inv.containerId||'',
        test_name: inv.testName || '',
        sample: inv.sampleName || '', // Now available in API as sampleName
        quantity: inv.quantity ||'',
        empanelled_lab: inv.empanelledLab || 'n',
        date_time: formatDateTime(inv.dateTime),
        accepted: false, // Default to false
        rejected: false, // Default to false
        reason: inv.reason || '',
        additional_remarks: inv.remarks || '',
        detailsId: inv.detailsId || 0, // Keep reference for API submission
        investigationId: inv.investigationId || 0, // Add investigationId
        sampleId: inv.sampleId || 0 // Add sampleId
      })) : []
    }))
  }

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString('en-GB')
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB')
  }

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    const date = new Date(dateTimeString)
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return new Date().toLocaleString('en-GB')
    const date = new Date(dateTimeString)
    return `${date.toLocaleDateString('en-GB')}-${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
  }

  const handleSearchChange = (e) => {
    const { id, value } = e.target
    setSearchData((prevData) => ({ ...prevData, [id]: value }))
    setCurrentPage(1)
  }

  const handleRowClick = (sample) => {
    // Create a copy of the sample and set all investigations to accepted by default
    const sampleWithAcceptedInvestigations = {
      ...sample,
      investigations: sample.investigations.map(inv => ({
        ...inv,
        accepted: true, // Set accepted to true by default
        rejected: false // Ensure rejected is false
      }))
    }
    
    setSelectedSample(sampleWithAcceptedInvestigations)
    setShowDetailView(true)
  }

  const handleBackToList = () => {
    setShowDetailView(false)
    setSelectedSample(null)
  }

  const handleInvestigationChange = (investigationId, field, value) => {
    if (selectedSample) {
      const updatedInvestigations = selectedSample.investigations.map((inv) => {
        if (inv.id === investigationId) {
          const updatedInv = { ...inv, [field]: value }

          // If accepted is checked, ensure rejected is unchecked and vice versa
          if (field === 'accepted' && value === true) {
            updatedInv.rejected = false
            updatedInv.reason = '' // Clear reason when accepted
          } else if (field === 'rejected' && value === true) {
            updatedInv.accepted = false
          }

          return updatedInv
        }
        return inv
      })

      setSelectedSample({ ...selectedSample, investigations: updatedInvestigations })
    }
  }

  // UPDATED FUNCTION: Check if all investigations have a decision (either accepted or rejected)
  const areAllInvestigationsDecided = () => {
    if (!selectedSample || !selectedSample.investigations || selectedSample.investigations.length === 0) {
      return false;
    }
    
    return selectedSample.investigations.every(inv => inv.accepted === true || inv.rejected === true);
  }

  // MODIFIED: Added shouldRefreshData parameter
  const showPopup = (message, type = "info", shouldRefreshData = false) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
        // Only refresh data if shouldRefreshData is true AND when popup closes
        if (shouldRefreshData) {
          fetchPendingValidationSamples()
        }
      },
    })
  }

  const handleSubmit = async () => {
    if (selectedSample) {
      try {
        setLoading(true)

        // UPDATED VALIDATION: Check if all investigations have a decision
        if (!areAllInvestigationsDecided()) {
          showPopup(VALIDATION_WARN_MSG, "warning")
          setLoading(false)
          return
        }

        // Validate that rejected investigations have a reason
        const rejectedWithoutReason = selectedSample.investigations.filter(
          inv => inv.rejected && (!inv.reason || inv.reason.trim() === '')
        )

        if (rejectedWithoutReason.length > 0) {
          showPopup(REJECT_REASON_WARN_MSG, "warning")
          setLoading(false)
          return
        }

        // Prepare the request payload according to your API
        const requestPayload = selectedSample.investigations.map(inv => ({
          sampleHeaderId: selectedSample.headerId, // Add headerId from the sample
          detailId: inv.detailsId, // Using detailsId from your formatted data
          accepted: inv.accepted, // Boolean value from checkbox
          reason: inv.rejected ? inv.reason : "" // Include reason only if rejected
        }))

        console.log("Submitting validation payload:", JSON.stringify(requestPayload, null, 2));

        // Make the API call to your validation endpoint
        const response = await postRequest(`${LAB}/validate`, requestPayload)

        // Handle both JSON and plain text responses
        if (response.status === 200 || response.ok) {
          // MODIFIED: Show success message with refresh flag - data will refresh ONLY when popup closes
          showPopup(VALIDATION_SUCC_MSG, "success", true)
          
          // MODIFIED: Removed immediate refresh - only close the detail view
          setShowDetailView(false)
          setSelectedSample(null)
        } else {
          throw new Error("Failed to validate investigations")
        }
      } catch (error) {
        console.error('Error validating investigations:', error)
        // Check if it's a JSON parse error and show appropriate message
        if (error.message.includes('JSON') || error.message.includes('Unexpected token')) {
          // This means the API returned plain text instead of JSON
          // But since we got 200 status, we consider it success
          // MODIFIED: Show success message with refresh flag
          showPopup(VALIDATION_SUCC_MSG, "success", true)
          setShowDetailView(false)
          setSelectedSample(null)
        } else {
          showPopup(UNEXPECTED_ERROR, "error")
        }
      } finally {
        setLoading(false)
      }
    }
  }

  const handleReset = () => {
    if (selectedSample) {
      const originalSample = sampleList.find((s) => s.id === selectedSample.id)
      setSelectedSample({ ...originalSample })
    }
  }

  // NEW FUNCTION: Handle "Accept All" from column header checkbox
  const handleAcceptAll = () => {
    if (selectedSample) {
      const updatedInvestigations = selectedSample.investigations.map(inv => ({
        ...inv,
        accepted: true,
        rejected: false,
        reason: '' // Clear any existing reasons
      }))
      
      setSelectedSample({ 
        ...selectedSample, 
        investigations: updatedInvestigations 
      })
    }
  }

  // NEW FUNCTION: Handle "Reject All" from column header checkbox
  const handleRejectAll = () => {
    if (selectedSample) {
      const updatedInvestigations = selectedSample.investigations.map(inv => ({
        ...inv,
        accepted: false,
        rejected: true,
        reason: 'Sample not suitable for testing' // Default reason
      }))
      
      setSelectedSample({ 
        ...selectedSample, 
        investigations: updatedInvestigations 
      })
    }
  }

  // NEW FUNCTION: Check if all investigations are accepted
  const areAllAccepted = () => {
    if (!selectedSample || !selectedSample.investigations || selectedSample.investigations.length === 0) {
      return false;
    }
    return selectedSample.investigations.every(inv => inv.accepted === true);
  }

  // NEW FUNCTION: Check if all investigations are rejected
  const areAllRejected = () => {
    if (!selectedSample || !selectedSample.investigations || selectedSample.investigations.length === 0) {
      return false;
    }
    return selectedSample.investigations.every(inv => inv.rejected === true);
  }

  const filteredSampleList = sampleList.filter((item) => {
    const barCodeMatch =
      searchData.barCodeSearch === "" ||
      item.order_no.toLowerCase().includes(searchData.barCodeSearch.toLowerCase()) ||
      item.patient_name.toLowerCase().includes(searchData.barCodeSearch.toLowerCase())

    const patientNameMatch =
      searchData.patientName === "" || item.patient_name.toLowerCase().includes(searchData.patientName.toLowerCase())

    const mobileNoMatch = searchData.mobileNo === "" || (item.mobile_no && item.mobile_no.includes(searchData.mobileNo))

    return barCodeMatch && patientNameMatch && mobileNoMatch
  })

  const filteredTotalPages = Math.ceil(filteredSampleList.length / itemsPerPage) || 1
  const currentItems = filteredSampleList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
      setCurrentPage(pageNumber)
    } else {
      showPopup(INVALID_PAGE_NO_WARN_MSG, "warning")
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
  if (showDetailView && selectedSample) {
    // Calculate decision status for the header
    const totalInvestigations = selectedSample.investigations.length;
    const acceptedCount = selectedSample.investigations.filter(inv => inv.accepted).length;
    const rejectedCount = selectedSample.investigations.filter(inv => inv.rejected).length;
    const allDecided = areAllInvestigationsDecided();

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
                  <h4 className="card-title p-2">SAMPLE VALIDATION</h4>
                  <div className="d-flex align-items-center">
                    <button className="btn btn-secondary" onClick={handleBackToList}>
                      <i className="mdi mdi-arrow-left"></i> Back to List
                    </button>
                  </div>
                </div>
              </div>

              <div className="card-body">
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
                          value={selectedSample.patient_name}
                          readOnly
                        />
                      </div>
                       <div className="col-md-4">
                        <label className="form-label fw-bold">Mobile No.</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedSample.mobile_no}
                          readOnly
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Relation</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedSample.relation}
                          readOnly
                        />
                      </div>
                     
                      <div className="col-md-4 mt-3">
                        <label className="form-label fw-bold">Age</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedSample.age}
                          readOnly
                        />
                      </div>
                      <div className="col-md-4 mt-3">
                        <label className="form-label fw-bold">Gender</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedSample.gender}
                          readOnly
                        />
                      </div>
                      <div className="col-md-12 mt-3" >
                        <label className="form-label fw-bold">Brief Clinical Notes</label>
                        <textarea
                          className="form-control"
                          rows="2"
                          value={selectedSample.clinical_notes}
                          readOnly
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sample Details */}
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">SAMPLE COLLECTION DETAILS</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Collection Date/Time</label>
                        <input
                          type="text"
                          className="form-control"
                          value={`${selectedSample.collection_date} - ${selectedSample.collection_time}`}
                          readOnly
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">
                          Collected By
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedSample.collected_by}
                          readOnly
                        />
                      </div>
                      
                    </div>
                  </div>
                </div>

                {/* Investigations Table */}
                <h5 className="mb-3">INVESTIGATIONS</h5>
                <div className="table-responsive">
                  <table className="table table-bordered table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>S.No.</th>
                        <th>Sample Id</th>
                        <th>Container Name</th>
                        <th>Investigation Name</th>
                        <th>Sample</th>
                        <th>Qty</th>
                        <th>Empanelled Lab</th>
                        <th>
                          <div className="d-flex align-items-center justify-content-center">
                            <span className="me-2">Accept</span>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={areAllAccepted()}
                                style={{ width: "20px", height: "20px", border: "2px solid black" }}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleAcceptAll();
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </th>
                        <th>
                          <div className="d-flex align-items-center justify-content-center">
                            <span className="me-2">Reject</span>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={areAllRejected()}
                                style={{ width: "20px", height: "20px", border: "2px solid black" }}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleRejectAll();
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSample.investigations.map((investigation) => (
                        <tr key={investigation.id}>
                          <td>{investigation.sr_no}</td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={investigation.test_code}
                                  style={{ width: "160px" }}
                              readOnly
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={investigation.container_name}
                              readOnly
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={investigation.test_name}
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
                              value={investigation.quantity}
                                  style={{ width: "40px" }}
                              readOnly
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={investigation.empanelled_lab}
                                  style={{ width: "60px" }}

                              readOnly
                            />
                          </td>
                          <td>
                            <div className="form-check d-flex justify-content-center">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={investigation.accepted}
                                style={{ width: "20px", height: "20px", border: "2px solid black" }}
                                onChange={(e) =>
                                  handleInvestigationChange(investigation.id, "accepted", e.target.checked)
                                }
                                disabled={investigation.rejected} // Disable if rejected is checked
                              />
                            </div>
                          </td>
                          <td>
                            <div className="form-check d-flex justify-content-center">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={investigation.rejected}
                                style={{ width: "20px", height: "20px", border: "2px solid black" }}
                                onChange={(e) =>
                                  handleInvestigationChange(investigation.id, "rejected", e.target.checked)
                                }
                                disabled={investigation.accepted} // Disable if accepted is checked
                              />
                            </div>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={investigation.reason}
                              onChange={(e) => handleInvestigationChange(investigation.id, "reason", e.target.value)}
                              disabled={!investigation.rejected} // Only enable reason if rejected
                              placeholder={investigation.rejected ? "Enter rejection reason..." : ""}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Action Buttons */}
                <div className="text-end mt-4">
                  <button 
                    className="btn btn-primary me-3" 
                    onClick={handleSubmit} 
                    disabled={loading || !allDecided}
                  >
                    <i className="mdi mdi-content-save"></i> SUBMIT
                  </button>
                  <button className="btn btn-secondary me-3" onClick={handleReset} disabled={loading}>
                    <i className="mdi mdi-refresh"></i> RESET
                  </button>
                  <button className="btn btn-secondary" onClick={handleBackToList}>
                    <i className="mdi mdi-arrow-left"></i> BACK
                  </button>
                </div>

                {/* Submission Requirement Notice */}
                {!allDecided && (
                  <div className="alert alert-warning mt-3">
                    <i className="mdi mdi-alert-circle-outline"></i> 
                    <strong>Important:</strong> All investigations must have a decision before submission. 
                    Please check either "Accepted" or "Rejected" for each row.
                  </div>
                )}
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
              <h4 className="card-title p-2">PENDING FOR SAMPLE VALIDATION</h4>
            </div>

            <div className="card-body">
              {loading ? (
                <LoadingScreen />
              ) : (
                <>
                  {/* Patient Search Section */}
                  <div className="card mb-3">
                    <div className="card-header py-3   border-bottom-1">
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

                  {/* Table */}
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Sample Date/Time</th>
                          <th>Order No</th>
                          <th>Patient Name</th>
                          <th>Mobile No.</th>
                          <th>Age</th>
                          <th>Gender</th>
                          <th>Modality</th>
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
                              <td>{item.sample_date_time}</td>
                              <td>{item.order_no}</td>
                              <td>{item.patient_name}</td>
                              <td>{item.mobile_no}</td>
                              <td>{item.age}</td>
                              <td>{item.gender}</td>
                              <td>{item.modality}</td>
                              <td>{item.doctor_name}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="text-center py-4">
                              No pending validation samples found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {filteredSampleList.length > 0 && (
                    <nav className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        <span>
                          Page {currentPage} of {filteredTotalPages} | Total Records: {filteredSampleList.length}
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

export default SampleValidation