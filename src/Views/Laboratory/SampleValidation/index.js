import { useState, useEffect } from "react"
import { getRequest, postRequest } from "../../../service/apiService"
import { GET_PENDING_SAMPLE_DEATAILS_FOR_SAMPLE_VALIDATION_END_URL, GET_PENDING_SAMPLE_HEADERS_FOR_SAMPLE_VALIDATION_END_URL, REQUEST_PARAM_HOSPITAL_ID, REQUEST_PARAM_PAGE, REQUEST_PARAM_SAMPLE_COLLECTION_HD_ID, REQUEST_PARAM_SIZE, SAMPLE_VALIDATION_END_URL } from "../../../config/apiConfig"
import LoadingScreen from "../../../Components/Loading"
import Popup from "../../../Components/popup"
import { FETCH_SAMPLE_VALIDATIONS_ERR_MSG, REJECT_REASON_WARN_MSG, UNEXPECTED_ERROR, VALIDATION_SUCC_MSG, VALIDATION_WARN_MSG } from "../../../config/constants"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const SampleValidation = () => {
  const [sampleList, setSampleList] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [isShowingAll, setIsShowingAll] = useState(true)
  const [searchData, setSearchData] = useState({
    barCodeSearch: "",
    patientName: "",
    mobileNo: "",
  })
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedSample, setSelectedSample] = useState(null)
  const [showDetailView, setShowDetailView] = useState(false)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [masterAccept, setMasterAccept] = useState(false)

  const hospitalId = sessionStorage.getItem("hospitalId")
  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE

  useEffect(() => {
    fetchPendingValidationHeaders()
  }, [])

  useEffect(() => {
    if (!loading) {
      fetchPendingValidationHeadersForPageChange()
    }
  }, [currentPage])

  const fetchPendingValidationHeaders = async (isSearchAction = false) => {
    try {
      if (isSearchAction) {
        setIsSearching(true)
      } else {
        setLoading(true)
      }

      let url = `${GET_PENDING_SAMPLE_HEADERS_FOR_SAMPLE_VALIDATION_END_URL}?${REQUEST_PARAM_HOSPITAL_ID}=${hospitalId}&${REQUEST_PARAM_PAGE}=${currentPage - 1}&${REQUEST_PARAM_SIZE}=${itemsPerPage}`

      if (searchData.patientName) {
        url += `&patientName=${encodeURIComponent(searchData.patientName)}`
      }
      if (searchData.mobileNo) {
        url += `&patientMobileNumber=${encodeURIComponent(searchData.mobileNo)}`
      }

      const data = await getRequest(url);

      console.log("Headers API Response:", data);

      if (data.status === 200 && data.response) {
        const formattedData = formatHeaderData(data.response.content || []);
        setSampleList(formattedData);
        setTotalPages(data.response.totalPages || 0);
        setTotalElements(data.response.totalElements || 0);
        const hasFilters = searchData.patientName || searchData.mobileNo
        setIsShowingAll(!hasFilters)
      } else {
        console.error('Error fetching pending validation headers:', data.message);
        showPopup(FETCH_SAMPLE_VALIDATIONS_ERR_MSG, 'error')
      }
    } catch (error) {
      console.error('Error fetching pending validation headers:', error);
      showPopup(FETCH_SAMPLE_VALIDATIONS_ERR_MSG, 'error')
    } finally {
      if (isSearchAction) {
        setIsSearching(false)
      } else {
        setLoading(false)
      }
    }
  };

  const fetchPendingValidationHeadersForPageChange = async () => {
    try {
      let url = `${GET_PENDING_SAMPLE_HEADERS_FOR_SAMPLE_VALIDATION_END_URL}?${REQUEST_PARAM_HOSPITAL_ID}=${hospitalId}&${REQUEST_PARAM_PAGE}=${currentPage - 1}&${REQUEST_PARAM_SIZE}=${itemsPerPage}`

      if (searchData.patientName) {
        url += `&patientName=${encodeURIComponent(searchData.patientName)}`
      }
      if (searchData.mobileNo) {
        url += `&patientMobileNumber=${encodeURIComponent(searchData.mobileNo)}`
      }

      const data = await getRequest(url);

      console.log("Headers API Response:", data);

      if (data.status === 200 && data.response) {
        const formattedData = formatHeaderData(data.response.content || []);
        setSampleList(formattedData);
        setTotalPages(data.response.totalPages || 0);
        setTotalElements(data.response.totalElements || 0);
        const hasFilters = searchData.patientName || searchData.mobileNo
        setIsShowingAll(!hasFilters)
      } else {
        console.error('Error fetching pending validation headers:', data.message);
        showPopup(FETCH_SAMPLE_VALIDATIONS_ERR_MSG, 'error')
      }
    } catch (error) {
      console.error('Error fetching pending validation headers:', error);
      showPopup(FETCH_SAMPLE_VALIDATIONS_ERR_MSG, 'error')
    }
  };

  const fetchSampleDetails = async (sampleCollectionHeaderId) => {
    try {
      const data = await getRequest(`${GET_PENDING_SAMPLE_DEATAILS_FOR_SAMPLE_VALIDATION_END_URL}?${REQUEST_PARAM_SAMPLE_COLLECTION_HD_ID}=${sampleCollectionHeaderId}`);

      console.log("Details API Response:", data);

      if (data.status === 200 && data.response) {
        return data.response;
      } else {
        console.error('Error fetching sample details:', data.message);
        showPopup(FETCH_SAMPLE_VALIDATIONS_ERR_MSG, 'error')
        return [];
      }
    } catch (error) {
      console.error('Error fetching sample details:', error);
      showPopup(FETCH_SAMPLE_VALIDATIONS_ERR_MSG, 'error')
      return [];
    }
  };

  const formatHeaderData = (apiData) => {
    return apiData.map((item, index) => ({
      id: index + 1,
      sampleCollectionHeaderId: item.sampleCollectionHeaderId,
      sample_date_time: formatDateTime(item.collectionTime),
      order_no: item.orderNumber || '',
      patient_name: item.patientName || '',
      mobile_no: item.mobileNo || '',
      age: item.age || '',
      gender: item.gender || '',
      modality: item.subChargeCodeName || '',
      doctor_name: item.doctorName || '',
      order_date: formatDate(item.orderDate),
      collection_date: formatDate(item.collectionTime),
      collection_time: formatTime(item.collectionTime),
      department: item.subChargeCodeName || '',
      reg_no: '',
      relation: item.patientRelation || '',
      collected_by: item.collectedBy || '',
      clinical_notes: '',
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
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchPendingValidationHeaders(true)
  }

  const handleShowAll = async () => {
    setSearchData({
      barCodeSearch: "",
      patientName: "",
      mobileNo: "",
    })
    setCurrentPage(1)
    setIsShowingAll(true)

    try {
      setLoading(true)

      let url = `${GET_PENDING_SAMPLE_HEADERS_FOR_SAMPLE_VALIDATION_END_URL}?${REQUEST_PARAM_HOSPITAL_ID}=${hospitalId}&${REQUEST_PARAM_PAGE}=0&${REQUEST_PARAM_SIZE}=${itemsPerPage}`

      const data = await getRequest(url);

      console.log("All Headers API Response:", data);

      if (data.status === 200 && data.response) {
        const formattedData = formatHeaderData(data.response.content || []);
        setSampleList(formattedData);
        setTotalPages(data.response.totalPages || 0);
        setTotalElements(data.response.totalElements || 0);
      } else {
        console.error('Error fetching pending validation headers:', data.message);
        showPopup(FETCH_SAMPLE_VALIDATIONS_ERR_MSG, 'error')
      }
    } catch (error) {
      console.error('Error fetching pending validation headers:', error);
      showPopup(FETCH_SAMPLE_VALIDATIONS_ERR_MSG, 'error')
    } finally {
      setLoading(false);
    }
  }

  const handleRowClick = async (sample) => {
    try {
      const details = await fetchSampleDetails(sample.sampleCollectionHeaderId)

      const completeSampleData = {
        ...sample,
        investigations: details.map((detail, index) => ({
          id: index + 1,
          sr_no: index + 1,
          diag_no: sample.order_no || '',
          test_code: detail.generatedSampleId || '',
          container_name: detail.containerName || '',
          container_id: detail.containerId || '',
          test_name: detail.investigationName || '',
          sample: detail.sampleName || '',
          quantity: detail.quantity || '',
          empanelled_lab: detail.empanelledLab || 'n',
          date_time: formatDateTime(detail.sampleCollectedDatetime),
          accepted: true,
          rejected: false,
          reason: detail.rejectedReason || '',
          additional_remarks: detail.remarks || '',
          detailsId: detail.sampleDetailsId || 0,
          investigationId: detail.investigationId || 0,
          sampleId: detail.sampleId || 0
        }))
      }

      setSelectedSample(completeSampleData)
      setMasterAccept(true)
      setShowDetailView(true)
    } catch (error) {
      console.error('Error fetching sample details:', error)
      showPopup(FETCH_SAMPLE_VALIDATIONS_ERR_MSG, 'error')
    }
  }

  const handleBackToList = () => {
    setShowDetailView(false)
    setSelectedSample(null)
    setMasterAccept(false)
  }

  const handleInvestigationChange = (investigationId, field, value) => {
    if (selectedSample) {
      const updatedInvestigations = selectedSample.investigations.map((inv) => {
        if (inv.id === investigationId) {
          const updatedInv = { ...inv, [field]: value }

          // Clicking Accept ON → uncheck Reject, clear reason
          if (field === 'accepted' && value === true) {
            updatedInv.rejected = false
            updatedInv.reason = ''
          }

          // Clicking Reject ON → uncheck Accept
          if (field === 'rejected' && value === true) {
            updatedInv.accepted = false
          }

          // Clicking Accept OFF (unchecking) → just uncheck accept, leave reject as-is
          // Clicking Reject OFF (unchecking) → just uncheck reject, leave accept as-is

          return updatedInv
        }
        return inv
      })

      setSelectedSample({ ...selectedSample, investigations: updatedInvestigations })

      // masterAccept = true only when ALL rows are accepted
      const allAccepted = updatedInvestigations.every(inv => inv.accepted === true)
      setMasterAccept(allAccepted)
    }
  }

  const areAllInvestigationsDecided = () => {
    if (!selectedSample || !selectedSample.investigations || selectedSample.investigations.length === 0) {
      return false;
    }
    return selectedSample.investigations.every(inv => inv.accepted === true || inv.rejected === true);
  }

  const showPopup = (message, type = "info", shouldRefreshData = false) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
        if (shouldRefreshData) {
          fetchPendingValidationHeaders()
        }
      },
    })
  }

  const handleSubmit = async () => {
    if (selectedSample) {
      try {
        setLoading(true)

        if (!areAllInvestigationsDecided()) {
          showPopup(VALIDATION_WARN_MSG, "warning")
          setLoading(false)
          return
        }

        const rejectedWithoutReason = selectedSample.investigations.filter(
          inv => inv.rejected && (!inv.reason || inv.reason.trim() === '')
        )

        if (rejectedWithoutReason.length > 0) {
          showPopup(REJECT_REASON_WARN_MSG, "warning")
          setLoading(false)
          return
        }

        const requestPayload = selectedSample.investigations.map(inv => ({
          sampleHeaderId: selectedSample.sampleCollectionHeaderId,
          detailId: inv.detailsId,
          accepted: inv.accepted,
          reason: inv.rejected ? inv.reason : ""
        }))

        console.log("Submitting validation payload:", JSON.stringify(requestPayload, null, 2));

        const response = await postRequest(`${SAMPLE_VALIDATION_END_URL}`, requestPayload)

        if (response.status === 200 || response.ok) {
          showPopup(VALIDATION_SUCC_MSG, "success", true)
          setShowDetailView(false)
          setSelectedSample(null)
          setMasterAccept(false)
        } else {
          throw new Error("Failed to validate investigations")
        }
      } catch (error) {
        console.error('Error validating investigations:', error)
        if (error.message.includes('JSON') || error.message.includes('Unexpected token')) {
          showPopup(VALIDATION_SUCC_MSG, "success", true)
          setShowDetailView(false)
          setSelectedSample(null)
          setMasterAccept(false)
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
      fetchSampleDetails(selectedSample.sampleCollectionHeaderId).then(details => {
        const refreshedSampleData = {
          ...selectedSample,
          investigations: details.map((detail, index) => ({
            id: index + 1,
            sr_no: index + 1,
            diag_no: selectedSample.order_no || '',
            test_code: detail.generatedSampleId || '',
            container_name: detail.containerName || '',
            container_id: detail.containerId || '',
            test_name: detail.investigationName || '',
            sample: detail.sampleName || '',
            quantity: detail.quantity || '',
            empanelled_lab: detail.empanelledLab || 'n',
            date_time: formatDateTime(detail.sampleCollectedDatetime),
            accepted: true,
            rejected: false,
            reason: detail.rejectedReason || '',
            additional_remarks: detail.remarks || '',
            detailsId: detail.sampleDetailsId || 0,
            investigationId: detail.investigationId || 0,
            sampleId: detail.sampleId || 0
          }))
        }
        setSelectedSample(refreshedSampleData)
        setMasterAccept(true)
      })
    }
  }

  const handleAcceptAll = () => {
    if (selectedSample) {
      const updatedInvestigations = selectedSample.investigations.map(inv => ({
        ...inv,
        accepted: true,
        rejected: false,
        reason: ''
      }))
      setSelectedSample({ ...selectedSample, investigations: updatedInvestigations })
      setMasterAccept(true)
    }
  }

  const handleRejectAll = () => {
    if (selectedSample) {
      const updatedInvestigations = selectedSample.investigations.map(inv => ({
        ...inv,
        accepted: false,
        rejected: true,
        reason: 'Sample not suitable for testing'
      }))
      setSelectedSample({ ...selectedSample, investigations: updatedInvestigations })
      setMasterAccept(false)
    }
  }

  const areAllRejected = () => {
    if (!selectedSample || !selectedSample.investigations || selectedSample.investigations.length === 0) {
      return false;
    }
    return selectedSample.investigations.every(inv => inv.rejected === true);
  }

  const handlePageChange = (page) => {
    setCurrentPage(page);
  }

  // Detail View
  if (showDetailView && selectedSample) {
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
                        <input type="text" className="form-control" value={selectedSample.patient_name} readOnly />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Mobile No.</label>
                        <input type="text" className="form-control" value={selectedSample.mobile_no} readOnly />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Relation</label>
                        <input type="text" className="form-control" value={selectedSample.relation} readOnly />
                      </div>
                      <div className="col-md-4 mt-3">
                        <label className="form-label fw-bold">Age</label>
                        <input type="text" className="form-control" value={selectedSample.age} readOnly />
                      </div>
                      <div className="col-md-4 mt-3">
                        <label className="form-label fw-bold">Gender</label>
                        <input type="text" className="form-control" value={selectedSample.gender} readOnly />
                      </div>
                      <div className="col-md-12 mt-3">
                        <label className="form-label fw-bold">Brief Clinical Notes</label>
                        <textarea className="form-control" rows="2" value={selectedSample.clinical_notes} readOnly></textarea>
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
                        <label className="form-label fw-bold">Collected By</label>
                        <input type="text" className="form-control" value={selectedSample.collected_by} readOnly />
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
                                checked={masterAccept}
                                style={{ width: "20px", height: "20px", border: "2px solid black" }}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleAcceptAll();
                                  } else {
                                    // Uncheck all accepts but don't touch reject state
                                    const updatedInvestigations = selectedSample.investigations.map(inv => ({
                                      ...inv,
                                      accepted: false
                                    }));
                                    setSelectedSample({ ...selectedSample, investigations: updatedInvestigations });
                                    setMasterAccept(false);
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
                            <input type="text" className="form-control" value={investigation.container_name} readOnly />
                          </td>
                          <td>
                            <input type="text" className="form-control" value={investigation.test_name} readOnly />
                          </td>
                          <td>
                            <input type="text" className="form-control" value={investigation.sample} readOnly />
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

                          {/* ✅ FIX: Removed disabled prop — handleInvestigationChange handles mutual exclusion */}
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
                              />
                            </div>
                          </td>
                          {/* ✅ FIX: Reason field enabled when rejected, disabled otherwise */}
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={investigation.reason}
                              onChange={(e) => handleInvestigationChange(investigation.id, "reason", e.target.value)}
                              disabled={!investigation.rejected}
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
              <h4 className="card-title p-2">PENDING FOR SAMPLE VALIDATION</h4>
            </div>

            <div className="card-body">
              {loading ? (
                <LoadingScreen />
              ) : (
                <>
                  {/* Patient Search Section */}
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
                            maxLength={10}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={searchData.mobileNo}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "");
                              handleSearchChange({ target: { id: "mobileNo", value } });
                            }}
                          />
                        </div>
                        <div className="col-md-3 d-flex">
                          <button
                            type="button"
                            className="btn btn-primary me-2"
                            onClick={handleSearch}
                            disabled={isSearching}
                          >
                            {isSearching ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Searching...
                              </>
                            ) : (
                              <>Search</>
                            )}
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleShowAll}
                            disabled={isShowingAll}
                          >
                            <i className="mdi mdi-refresh"></i> Show All
                          </button>
                        </div>
                      </div>
                    </form>
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
                        {sampleList.length > 0 ? (
                          sampleList.map((item) => (
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
                  {totalPages > 0 && (
                    <Pagination
                      totalItems={totalElements}
                      itemsPerPage={itemsPerPage}
                      currentPage={currentPage}
                      onPageChange={handlePageChange}
                    />
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