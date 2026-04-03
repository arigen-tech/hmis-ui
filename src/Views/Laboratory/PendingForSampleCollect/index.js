import { useState, useEffect } from "react"
import { getRequest, postRequest } from "../../../service/apiService"
import {  SAVE_PENDING_SAMPLES_FOR_COLLECTION_END_URL, REQUEST_PARAM_DEPARTMENT_ID, GET_PENDING_SAMPLE_HEADERS_FOR_COLLECTION_END_URL, REQUEST_PARAM_HOSPITAL_ID, GET_PENDING_SAMPLE_DETAILS_FOR_COLLECTION_END_URL, REQUEST_PARAM_ORDER_HD_ID, MAS_CONTAINER_DROPDOWN_END_URL, ACTIVE_STATUS_FOR_DROPDOWN, REQUEST_PARAM_SIZE, REQUEST_PARAM_PAGE } from "../../../config/apiConfig"
import LoadingScreen from "../../../Components/Loading"
import Popup from "../../../Components/popup"
import { FETCH_CONTAINER_ERR_MSG, FETCH_PENDING_SAMPLE_ERR_MSG, SAMPLE_COLLECTION_ERR_MSG, SAMPLE_COLLECTION_SUCC_MSG } from "../../../config/constants"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const PendingForSampleCollection = () => {
  const [samples, setSamples] = useState([])
  const [containerOptions, setContainerOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [isShowingAll, setIsShowingAll] = useState(true)
  const [searchData, setSearchData] = useState({
    patientName: "",
    mobileNo: "",
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedSample, setSelectedSample] = useState(null)
  const [showDetailView, setShowDetailView] = useState(false)
  const [popupMessage, setPopupMessage] = useState(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const hospitalId = sessionStorage.getItem("hospitalId")
  const departmentId = sessionStorage.getItem("departmentId")
  const showPopup = (message, type = "info", shouldRefreshData = false) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
        if (shouldRefreshData) {
          fetchPendingSamplesHeaders()
        }
      }
    })
  }

  useEffect(() => {
    fetchPendingSamplesHeaders()
    fetchContainerOptions()
  }, []) // Remove currentPage dependency - only run once on mount

  // Separate effect for page changes without loading screen
  useEffect(() => {
    if (!loading) { // Only fetch if initial load is complete
      fetchPendingSamplesHeadersForPageChange()
    }
  }, [currentPage])

  // API call for headers with search filters and pagination (with loading)
  const fetchPendingSamplesHeaders = async (isSearchAction = false) => {
    try {
      if (isSearchAction) {
        setIsSearching(true)
      } else {
        setLoading(true)
      }

      let url = `${GET_PENDING_SAMPLE_HEADERS_FOR_COLLECTION_END_URL}?${REQUEST_PARAM_HOSPITAL_ID}=${hospitalId}&${REQUEST_PARAM_PAGE}=${currentPage - 1}&${REQUEST_PARAM_SIZE}=${DEFAULT_ITEMS_PER_PAGE}`

      if (searchData.patientName) {
        url += `&patientName=${encodeURIComponent(searchData.patientName)}`
      }
      if (searchData.mobileNo) {
        url += `&patientMobileNumber=${encodeURIComponent(searchData.mobileNo)}`
      }

      const data = await getRequest(url);

      console.log("Headers API Response:", data);

      if (data.status === 200 && data.response) {
        setSamples(data.response.content || []);
        setTotalPages(data.response.totalPages || 0);
        setTotalElements(data.response.totalElements || 0);
        // Check if any search filters are applied
        const hasFilters = searchData.patientName || searchData.mobileNo
        setIsShowingAll(!hasFilters)
      } else {
        console.error('Error fetching pending samples headers:', data.message);
        showPopup(FETCH_PENDING_SAMPLE_ERR_MSG, 'error')
      }
    } catch (error) {
      console.error('Error fetching pending samples headers:', error);
      showPopup(FETCH_PENDING_SAMPLE_ERR_MSG, 'error')
    } finally {
      if (isSearchAction) {
        setIsSearching(false)
      } else {
        setLoading(false)
      }
    }
  };

  // New function for page changes without loading screen
  const fetchPendingSamplesHeadersForPageChange = async () => {
    try {
      let url = `${GET_PENDING_SAMPLE_HEADERS_FOR_COLLECTION_END_URL}?${REQUEST_PARAM_HOSPITAL_ID}=${hospitalId}&${REQUEST_PARAM_PAGE}=${currentPage - 1}&${REQUEST_PARAM_SIZE}=${DEFAULT_ITEMS_PER_PAGE}`

      if (searchData.patientName) {
        url += `&patientName=${encodeURIComponent(searchData.patientName)}`
      }
      if (searchData.mobileNo) {
        url += `&patientMobileNumber=${encodeURIComponent(searchData.mobileNo)}`
      }

      const data = await getRequest(url);

      console.log("Headers API Response:", data);

      if (data.status === 200 && data.response) {
        setSamples(data.response.content || []);
        setTotalPages(data.response.totalPages || 0);
        setTotalElements(data.response.totalElements || 0);
        // Check if any search filters are applied
        const hasFilters = searchData.patientName || searchData.mobileNo
        setIsShowingAll(!hasFilters)
      } else {
        console.error('Error fetching pending samples headers:', data.message);
        showPopup(FETCH_PENDING_SAMPLE_ERR_MSG, 'error')
      }
    } catch (error) {
      console.error('Error fetching pending samples headers:', error);
      showPopup(FETCH_PENDING_SAMPLE_ERR_MSG, 'error')
    }
  };

  // API call for details when row is clicked
  const fetchSampleDetails = async (orderHdId) => {
    try {
      setLoading(true);
      const data = await getRequest(`${GET_PENDING_SAMPLE_DETAILS_FOR_COLLECTION_END_URL}?${REQUEST_PARAM_ORDER_HD_ID}=${orderHdId}`);

      console.log("Details API Response:", data);

      if (data.status === 200 && data.response) {
        return data.response;
      } else {
        console.error('Error fetching sample details:', data.message);
        showPopup(FETCH_PENDING_SAMPLE_ERR_MSG, 'error')
        return [];
      }
    } catch (error) {
      console.error('Error fetching sample details:', error);
      showPopup(FETCH_PENDING_SAMPLE_ERR_MSG, 'error')
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchContainerOptions = async () => {
    try {
      const data = await getRequest(`${MAS_CONTAINER_DROPDOWN_END_URL}/${ACTIVE_STATUS_FOR_DROPDOWN}`);

      if (data.status === 200 && data.response) {
        setContainerOptions(data.response);
      } else {
        console.error('Error fetching container options:', data.message);
        showPopup(FETCH_CONTAINER_ERR_MSG, 'error')
      }
    } catch (error) {
      console.error('Error fetching container options:', error);
      showPopup(FETCH_CONTAINER_ERR_MSG, 'error')
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString('en-GB')
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB')
  }

  const handleSearchChange = (e) => {
    const { id, value } = e.target
    setSearchData((prevData) => ({ ...prevData, [id]: value }))
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchPendingSamplesHeaders(true)
  }

  const handleShowAll = async () => {
    setSearchData({
      patientName: "",
      mobileNo: "",
    })
    setCurrentPage(1)
    setIsShowingAll(true)

    try {
      setLoading(true)

      // Build URL with only hospitalId, no search parameters, and pagination
      let url = `${GET_PENDING_SAMPLE_HEADERS_FOR_COLLECTION_END_URL}?${REQUEST_PARAM_HOSPITAL_ID}=${hospitalId}&${REQUEST_PARAM_PAGE}=0&${REQUEST_PARAM_SIZE}=${DEFAULT_ITEMS_PER_PAGE}`

      const data = await getRequest(url);

      console.log("All Headers API Response:", data);

      if (data.status === 200 && data.response) {
        setSamples(data.response.content || []);
        setTotalPages(data.response.totalPages || 0);
        setTotalElements(data.response.totalElements || 0);
      } else {
        console.error('Error fetching pending samples headers:', data.message);
        showPopup(FETCH_PENDING_SAMPLE_ERR_MSG, 'error')
      }
    } catch (error) {
      console.error('Error fetching pending samples headers:', error);
      showPopup(FETCH_PENDING_SAMPLE_ERR_MSG, 'error')
    } finally {
      setLoading(false);
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page);
  }

  const handleRowClick = async (sample) => {
    try {
      setLoading(true)
      // Fetch details for the selected orderHdId
      const details = await fetchSampleDetails(sample.orderHdId)

      // Combine header data with details
      const completeSampleData = {
        ...sample,
        investigations: details.map((detail, index) => ({
          id: index + 1,
          siNo: index + 1,
          investigation: detail.investigationName,
          sample: detail.sampleName,
          container: detail.collectionName,
          collected: true,
          empanelled: false,
          remarks: '',
          orderDtId: detail.orderDtId,
          investigationId: detail.investigationId,
          sampleId: detail.sampleId,
          collectionId: detail.collectionId,
          mainChargeCodeId: detail.mainChargeCodeId,
          subChargeCodeId: detail.subChargeCodeId
        }))
      }

      setSelectedSample(completeSampleData)
      setShowDetailView(true)
    } catch (error) {
      console.error('Error fetching sample details:', error)
      showPopup(FETCH_PENDING_SAMPLE_ERR_MSG, 'error')
    } finally {
      setLoading(false)
    }
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

        const requestPayload = {
          visitId: selectedSample.visitId,
          orderHdId: selectedSample.orderHdId,
          sampleCollectionReq: selectedSample.investigations
            .filter(inv => inv.collected)
            .map(inv => ({
              orderDtId: inv.orderDtId,
              investigationId: inv.investigationId,
              empanelledStatus: inv.empanelled ? "y" : "n",
              sampleId: inv.sampleId,
              collectionId: inv.collectionId,
              collected: "y",
              remarks: inv.remarks || "",
              mainChargeCodeId: inv.mainChargeCodeId,
              subChargeCodeId: inv.subChargeCodeId
            }))
        }

        console.log("Submitting payload:", JSON.stringify(requestPayload, null, 2));

        const response = await postRequest(`${SAVE_PENDING_SAMPLES_FOR_COLLECTION_END_URL}?${REQUEST_PARAM_DEPARTMENT_ID}=${departmentId}`, requestPayload)

        if (response.status === 200) {
          showPopup(SAMPLE_COLLECTION_SUCC_MSG, "success", true)
          setShowDetailView(false)
          setSelectedSample(null)
        } else {
          throw new Error(response.message || "Failed to save sample collection")
        }
      } catch (error) {
        console.error('Error saving sample collection:', error)
        showPopup(SAMPLE_COLLECTION_ERR_MSG, "error")
      } finally {
        setLoading(false)
      }
    }
  }

  const handleResetForm = () => {
    if (selectedSample) {
      // Since we can't easily get the original details without refetching,
      // we'll fetch the details again
      fetchSampleDetails(selectedSample.orderHdId).then(details => {
        const refreshedSampleData = {
          ...selectedSample,
          investigations: details.map((detail, index) => ({
            id: index + 1,
            siNo: index + 1,
            investigation: detail.investigationName,
            sample: detail.sampleName,
            container: detail.collectionName,
            collected: true,
            empanelled: false,
            remarks: '',
            orderDtId: detail.orderDtId,
            investigationId: detail.investigationId,
            sampleId: detail.sampleId,
            collectionId: detail.collectionId
          }))
        }
        setSelectedSample(refreshedSampleData)
      })
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

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "p":
        return "Priority-1"
      case "h":
        return "Priority-2"
      case "n":
        return "Priority-3"
      default:
        return "Priority-3"
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
                          readOnly
                          value={selectedSample.patientName}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Mobile No.</label>
                        <input
                          type="text"
                          className="form-control"
                          readOnly
                          value={selectedSample.mobile}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Relation</label>
                        <input
                          type="text"
                          className="form-control"
                          readOnly
                          value={selectedSample.relation}
                        />
                      </div>
                    </div>
                    <div className="row mt-3">
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Age</label>
                        <input
                          type="text"
                          className="form-control"
                          readOnly
                          value={selectedSample.age}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Gender</label>
                        <input
                          type="text"
                          className="form-control"
                          readOnly
                          value={selectedSample.gender}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Priority</label>
                        <input
                          type="text"
                          className="form-control"
                          readOnly
                        // value={getPriorityBadge(selectedSample.priority)}
                        // style={{ 
                        //   backgroundColor: selectedSample.priority === 'p' ? '#dc3545' : 
                        //                  selectedSample.priority === 'h' ? '#ffc107' : 
                        //                  selectedSample.priority === 'n' ? '#28a745' : '#6c757d',
                        //   color: selectedSample.priority === 'h' ? '#000' : '#fff',
                        //   fontWeight: 'bold'
                        // }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

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
                            <div className="form-check d-flex justify-content-center">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={investigation.collected}
                                onChange={(e) =>
                                  handleInvestigationChange(investigation.id, "collected", e.target.checked)
                                }
                                style={{ width: "20px", height: "20px" }}
                              />
                            </div>
                          </td>
                          <td>
                            <div className="form-check d-flex justify-content-center">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={investigation.empanelled}
                                onChange={(e) =>
                                  handleInvestigationChange(investigation.id, "empanelled", e.target.checked)
                                }
                                style={{ width: "20px", height: "20px" }}
                              />
                            </div>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={investigation.remarks}
                              onChange={(e) => handleInvestigationChange(investigation.id, "remarks", e.target.value)}
                              placeholder="Enter remarks"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-center mt-4">
                  <button className="btn btn-primary me-3" onClick={handleSubmit} disabled={loading}>
                    <i className="mdi mdi-content-save"></i> SUBMIT
                  </button>
                  <button className="btn btn-secondary me-3" onClick={handleResetForm} disabled={loading}>
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
              <h4 className="card-title p-2">PENDING FOR SAMPLE COLLECTION</h4>
            </div>

            <div className="card-body">
              {loading ? (
                <LoadingScreen />
              ) : (
                <>
                  <div className="card-body">
                    <form>
                      <div className="row g-4 align-items-end">
                        <div className="col-md-4">
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
                        <div className="col-md-4">
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
                              const value = e.target.value.replace(/\D/g, ""); // only digits
                              handleSearchChange({
                                target: {
                                  id: "mobileNo",
                                  value
                                }
                              });
                            }}
                          />
                        </div>
                        <div className="col-md-4 d-flex">
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
                              'Search'
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
                          <th>Age</th>
                          <th>Gender</th>
                          <th>Mobile No.</th>
                          <th>Department</th>
                          <th>Doctor Name</th>
                          <th>Priority</th>
                        </tr>
                      </thead>
                      <tbody>
                        {samples.length > 0 ? (
                          samples.map((item) => (
                            <tr
                              key={item.orderHdId}
                              onClick={() => handleRowClick(item)}
                              style={{ cursor: "pointer" }}
                              className="table-row-hover"
                            >
                              <td>{formatDate(item.reqDate)}</td>
                              <td>{item.patientName}</td>
                              <td>{item.relation}</td>
                              <td>{item.age}</td>
                              <td>{item.gender}</td>
                              <td>{item.mobile}</td>
                              <td>{item.department}</td>
                              <td>{item.doctorName}</td>
                              <td>
                                {/* <span className={`badge ${getPriorityColor(getPriorityBadge(item.priority))}`}>
                                  {getPriorityBadge(item.priority)}
                                </span> */}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="9" className="text-center py-4">
                              No pending samples found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 0 && (
                    <Pagination
                      totalItems={totalElements}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
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

export default PendingForSampleCollection