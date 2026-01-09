import { useState, useEffect } from "react"
import { getRequest, postRequest } from "../../../service/apiService"
import { LAB, DG_MAS_COLLECTION } from "../../../config/apiConfig"
import LoadingScreen from "../../../Components/Loading"
import Popup from "../../../Components/popup"
import { FETCH_CONTAINER_ERR_MSG, FETCH_PENDING_SAMPLE_ERR_MSG, INVALID_PAGE_NO_WARN_MSG, SAMPLE_COLLECTION_ERR_MSG, SAMPLE_COLLECTION_SUCC_MSG } from "../../../config/constants"
import Pagination, {DEFAULT_ITEMS_PER_PAGE} from "../../../Components/Pagination";

const PendingForSampleCollection = () => {
  const [samples, setSamples] = useState([])
  const [containerOptions, setContainerOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchData, setSearchData] = useState({
    patientName: "",
    mobileNo: "",
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const [selectedSample, setSelectedSample] = useState(null)
  const [showDetailView, setShowDetailView] = useState(false)
  const [popupMessage, setPopupMessage] = useState(null)

  const itemsPerPage = 5

  const showPopup = (message, type = "info", shouldRefreshData = false) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
        if (shouldRefreshData) {
          fetchPendingSamples()
        }
      }
    })
  }

  useEffect(() => {
    fetchPendingSamples()
    fetchContainerOptions()
  }, [])

  const fetchPendingSamples = async () => {
    try {
      setLoading(true);
      const data = await getRequest(`${LAB}/pending-samples`);

      console.log("Raw API Response:", data);

      if (data.status === 200 && data.response) {
        console.log("First sample item:", data.response[0]);
        const groupedData = groupInvestigationsByPatient(data.response);
        setSamples(groupedData);
      } else {
        console.error('Error fetching pending samples:', data.message);
        showPopup(FETCH_PENDING_SAMPLE_ERR_MSG, 'error')
      }
    } catch (error) {
      console.error('Error fetching pending samples:', error);
      showPopup(FETCH_PENDING_SAMPLE_ERR_MSG, 'error')
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
        showPopup(FETCH_CONTAINER_ERR_MSG, 'error')
      }
    } catch (error) {
      console.error('Error fetching container options:', error);
      showPopup(FETCH_CONTAINER_ERR_MSG, 'error')
    }
  };

  const groupInvestigationsByPatient = (apiData) => {
    const grouped = {}
    let counter = 1

    apiData.forEach((item) => {
      const patientKey = `${item.patientName}_${item.mobile}_${item.reqDate}_${item.orderNo}`

      if (!grouped[patientKey]) {
        grouped[patientKey] = {
          id: counter++,
          reqDate: formatDate(item.reqDate),
          reqTime: item.orderTime,
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

      grouped[patientKey].investigations.push({
        id: grouped[patientKey].investigations.length + 1,
        siNo: grouped[patientKey].investigations.length + 1,
        investigation: item.investigation || '',
        sample: item.sample || '',
        container: item.collection || '',
        collected: true,
        empanelled: false,
        remarks: '',
        appointment: false,
        subChargeCodeId: item.subChargeCodeId || 0,
        investigationId: item.investigationId || 0,
        mainChargeCodeId: item.mainChargcodeId || 0,
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
    const { id, value } = e.target
    setSearchData((prevData) => ({ ...prevData, [id]: value }))
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

        const response = await postRequest(`${LAB}/savesamplecollection`, requestPayload)

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

  const handleReset = () => {
    if (selectedSample) {
      const originalSample = samples.find((s) => s.id === selectedSample.id)
      setSelectedSample({ ...originalSample })
    }
  }

  const filteredSamples = samples.filter((item) => {
    const patientNameMatch =
      searchData.patientName === "" || 
      item.patientName.toLowerCase().includes(searchData.patientName.toLowerCase())

    const mobileNoMatch = 
      searchData.mobileNo === "" || 
      (item.mobile && item.mobile.includes(searchData.mobileNo))

    return patientNameMatch && mobileNoMatch
  })

  const filteredTotalPages = Math.ceil(filteredSamples.length / itemsPerPage) || 1
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredSamples.slice(indexOfFirst, indexOfLast);

  

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
                          value={selectedSample.priority}
                          style={{ 
                            backgroundColor: getPriorityColor(selectedSample.priority).includes('danger') ? '#dc3545' : 
                                           getPriorityColor(selectedSample.priority).includes('warning') ? '#ffc107' : 
                                           getPriorityColor(selectedSample.priority).includes('success') ? '#28a745' : '#6c757d',
                            color: getPriorityColor(selectedSample.priority).includes('warning') ? '#000' : '#fff',
                            fontWeight: 'bold'
                          }}
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
                  <div className="card mb-3">
                    <div className="card-header py-3   border-bottom-1">
                      <h6 className="mb-0 fw-bold">PATIENT SEARCH</h6>
                    </div>
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
                              value={searchData.mobileNo}
                              onChange={handleSearchChange}
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

                  {filteredSamples.length > 0 && (
                    <Pagination
                      totalItems={filteredSamples.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
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