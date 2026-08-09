import { useState, useEffect, useCallback, useRef } from "react"
import { getRequest } from "../../../service/apiService"
import LoadingScreen from "../../../Components/Loading"
import Popup from "../../../Components/popup"
import Pagination from "../../../Components/Pagination"
import { ALL_REPORTS } from "../../../config/apiConfig"
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer"

const OPDReports = () => {
  const [opdPatients, setOpdPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)
  const [popupMessage, setPopupMessage] = useState(null)
  const [downloadingOPDVisitId, setDownloadingOPDVisitId] = useState(null)
  const [downloadingPrescriptionVisitId, setDownloadingPrescriptionVisitId] = useState(null)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [pdfTitle, setPdfTitle] = useState("")
  const [pdfFileName, setPdfFileName] = useState("")
  
  // Search state
  const [searchData, setSearchData] = useState({
    mobileNo: "",
    patientName: ""
  })
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isSearchMode, setIsSearchMode] = useState(false)
  
  // Button loading states
  const [isSearching, setIsSearching] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  
  const itemsPerPage = 5

  // ============= API FETCH FUNCTIONS =============
  const fetchOPDPatients = useCallback(async (page = currentPage, showTableLoader = true, searchParams = null) => {
    try {
      if (showTableLoader) {
        setTableLoading(true)
      }

      const backendPage = page - 1

      let url = `/opd/getOpdReportsList?page=${backendPage}&size=${itemsPerPage}`
      
      // Use provided searchParams or fallback to state
      const mobileNo = searchParams?.mobileNo ?? searchData.mobileNo
      const patientName = searchParams?.patientName ?? searchData.patientName
      const shouldSearch = searchParams?.isSearchMode ?? isSearchMode
      
      // Add search params if in search mode
      if (shouldSearch && (mobileNo || patientName)) {
        if (mobileNo) {
          url += `&mobileNo=${encodeURIComponent(mobileNo)}`
        }
        if (patientName) {
          url += `&patientName=${encodeURIComponent(patientName)}`
        }
      }

      const response = await getRequest(url)

      if (response?.status === 200) {
        const pageData = response.response

        setOpdPatients(pageData?.content || [])
        setTotalItems(pageData?.totalElements || 0)
        setTotalPages(pageData?.totalPages || 0)
      } else {
        setOpdPatients([])
        setTotalItems(0)
        setTotalPages(0)
        showPopup("Failed to fetch OPD patients", "error")
      }
    } catch (error) {
      console.error("Error fetching OPD patients:", error)
      setOpdPatients([])
      setTotalItems(0)
      setTotalPages(0)
      showPopup("Failed to fetch OPD patients", "error")
    } finally {
      setTableLoading(false)
      setLoading(false)
      setIsSearching(false)
      setIsResetting(false)
    }
  }, [currentPage, isSearchMode, searchData.mobileNo, searchData.patientName])

  // ============= INITIAL LOAD =============
  useEffect(() => {
    fetchOPDPatients(currentPage, true)
  }, []) // Only run once on mount

  // ============= HANDLE PAGE CHANGE =============
  const handlePageChange = (page) => {
    setCurrentPage(page)
    // Fetch with table loader for page changes
    fetchOPDPatients(page, true)
  }

  // ============= HANDLER FUNCTIONS =============
  const handleSearchChange = (e) => {
    const { id, value } = e.target
    setSearchData(prev => ({ ...prev, [id]: value }))
  }

  const handleSearch = () => {
    // Check if any search field has value
    if (!searchData.mobileNo && !searchData.patientName) {
      showPopup("Please enter at least one search criteria", "info")
      return
    }
    
    setIsSearching(true)
    setIsSearchMode(true)
    setCurrentPage(1)
    // Pass search parameters directly
    fetchOPDPatients(1, true, {
      mobileNo: searchData.mobileNo,
      patientName: searchData.patientName,
      isSearchMode: true
    })
  }

  const handleReset = () => {
    setIsResetting(true)
    
    // Clear search data
    const emptySearchData = {
      mobileNo: "",
      patientName: ""
    }
    setSearchData(emptySearchData)
    setIsSearchMode(false)
    setCurrentPage(1)
    
    // Pass empty search parameters directly
    fetchOPDPatients(1, true, {
      mobileNo: "",
      patientName: "",
      isSearchMode: false
    })
  }

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
      }
    })
  }

  // ============= DOWNLOAD HELPER FUNCTIONS =============
  const fetchPdf = async (reportUrl, flag = "d") => {
    const response = await fetch(`${reportUrl}&flag=${flag}`, {
      method: "GET",
      headers: {
        "Accept": "application/pdf",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch report")
    }

    return await response.blob()
  }

  // ============= VIEW OPD CASE SHEET =============
  const handleViewCaseSheet = async (visitId, patientName) => {
    if (!visitId) {
      showPopup("Visit ID is required to view case sheet", "error")
      return
    }

    try {
      setDownloadingOPDVisitId(visitId)
      
      const reportUrl = `${ALL_REPORTS}/opdCaseSheetReport?visitId=${visitId}`
      const blob = await fetchPdf(reportUrl, "d")
      
      if (!blob.type || !blob.type.includes('pdf')) {
        throw new Error('Response is not a PDF file')
      }

      const fileURL = window.URL.createObjectURL(blob)
      setPdfUrl(fileURL)
      setPdfTitle(`OPD Case Sheet - ${patientName || 'Patient'}`)
      setPdfFileName(`OPD_CaseSheet_${patientName || 'patient'}_${visitId}`)
      
    } catch (error) {
      console.error("Error viewing case sheet:", error)
      showPopup(`Failed to view case sheet: ${error.message}`, "error")
    } finally {
      setDownloadingOPDVisitId(null)
    }
  }

  // ============= VIEW PRESCRIPTION SLIP =============
  const handleViewPrescription = async (prescriptionUrl, patientName, visitId) => {
    if (!prescriptionUrl) {
      showPopup("No prescription slip available", "info")
      return
    }

    try {
      setDownloadingPrescriptionVisitId(visitId)
      
      const blob = await fetchPdf(prescriptionUrl, "d")
      
      if (!blob.type || !blob.type.includes('pdf')) {
        throw new Error('Response is not a PDF file')
      }

      const fileURL = window.URL.createObjectURL(blob)
      setPdfUrl(fileURL)
      setPdfTitle(`Prescription Slip - ${patientName || 'Patient'}`)
      setPdfFileName(`Prescription_${patientName || 'patient'}_${visitId}`)
      
    } catch (error) {
      console.error("Error viewing prescription:", error)
      showPopup(`Failed to view prescription: ${error.message}`, "error")
    } finally {
      setDownloadingPrescriptionVisitId(null)
    }
  }

  // ============= CLOSE PDF VIEWER =============
  const handleClosePdfViewer = () => {
    setPdfUrl(null)
    setPdfTitle("")
    setPdfFileName("")
  }

  // ============= RENDER LOADING SKELETON ROWS =============
  const renderSkeletonRows = () => {
    return Array.from({ length: itemsPerPage }).map((_, index) => (
      <tr key={`skeleton-${index}`} className="skeleton-row">
        <td colSpan="11">
          <div className="d-flex justify-content-center align-items-center py-4">
            <div className="spinner-border text-primary me-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <span className="text-muted">Loading OPD records...</span>
          </div>
        </td>
      </tr>
    ))
  }

  // ============= RENDER =============
  return (
    <div className="content-wrapper">
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}

      {pdfUrl && (
        <PdfViewer
          pdfUrl={pdfUrl}
          name={pdfFileName}
          onClose={handleClosePdfViewer}
        />
      )}
      
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">
                OPD REPORTS
              </h4>
            </div>

            <div className="card-body">
              {loading ? (
                <LoadingScreen />
              ) : (
                <>
                  {/* Search Section */}
                  <div className="mb-4">
                    <div className="card-body">
                      <div className="row g-4 align-items-end">
                        <div className="col-md-5">
                          <label className="form-label fw-semibold">Patient Mobile No.</label>
                          <input
                            type="text"
                            className="form-control"
                            id="mobileNo"
                            placeholder="Enter mobile number"
                            value={searchData.mobileNo}
                            onChange={handleSearchChange}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleSearch()
                              }
                            }}
                            disabled={isSearching || isResetting}
                          />
                        </div>
                        <div className="col-md-5">
                          <label className="form-label fw-semibold">Patient Name</label>
                          <input
                            type="text"
                            className="form-control"
                            id="patientName"
                            placeholder="Enter patient name"
                            value={searchData.patientName}
                            onChange={handleSearchChange}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleSearch()
                              }
                            }}
                            disabled={isSearching || isResetting}
                          />
                        </div>
                        <div className="col-md-2">
                          <div className="d-flex gap-2">
                            <button 
                              type="button" 
                              className="btn btn-primary flex-fill"
                              onClick={handleSearch}
                              disabled={isSearching || isResetting}
                            >
                              {isSearching ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                  Searching...
                                </>
                              ) : (
                                <>
                                  <i className="mdi mdi-magnify"></i> Search
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary flex-fill"
                              onClick={handleReset}
                              disabled={isSearching || isResetting}
                            >
                              {isResetting ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                  Resetting...
                                </>
                              ) : (
                                'Reset'
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Patients Table */}
                  <div className="table-responsive">
                    <table className="table table-bordered align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Patient Name</th>
                          <th>Mobile No</th>
                          <th>UHID</th>
                          <th>Relation</th>
                          <th>Gender</th>
                          <th>Age</th>
                          <th>Specialty</th>
                          <th>Doctor Name</th>
                          <th>Visit Date/Time</th>
                          <th>OPD Slip</th>
                          <th>Prescription Slip</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableLoading ? (
                          // Show loading spinner in table body
                          <tr>
                            <td colSpan="11">
                              <div className="text-center py-5">
                                <div className="d-flex justify-content-center">
                                  <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                  </div>
                                </div>
                                <p className="mt-2 text-muted">Loading OPD records...</p>
                              </div>
                            </td>
                          </tr>
                        ) : opdPatients.length > 0 ? (
                          // Show actual data
                          opdPatients.map((patient) => {
                            const isOPDDownloading = downloadingOPDVisitId === patient.visitId
                            const isPrescriptionDownloading = downloadingPrescriptionVisitId === patient.visitId
                            return (
                              <tr key={patient.id}>
                                <td className="fw-bold">{patient.patientName}</td>
                                <td>{patient.mobileNumber}</td>
                                <td>{patient.uhid}</td>
                                <td>{patient.relation}</td>
                                <td>{patient.gender}</td>
                                <td>{patient.age}</td>
                                <td>{patient.specialty}</td>
                                <td>{patient.doctorName}</td>
                                <td>{patient.visitDateTime}</td>
                                <td className="text-center">
                                  <button 
                                    className="btn btn-primary btn-sm"
                                    onClick={() => {
                                      if (patient.visitId) {
                                        handleViewCaseSheet(patient.visitId, patient.patientName)
                                      } else {
                                        showPopup("No visit ID available for this patient", "info")
                                      }
                                    }}
                                    disabled={isOPDDownloading || tableLoading}
                                  >
                                    {isOPDDownloading ? (
                                      <>
                                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                        Loading...
                                      </>
                                    ) : (
                                      <>
                                        <i className="mdi mdi-eye me-1"></i>
                                        View
                                      </>
                                    )}
                                  </button>
                                </td>
                                <td className="text-center">
                                  {patient.prescriptionSlip === "Not Issued" ? (
                                    <button className="btn btn-sm btn-primary" disabled>
                                      Not Issued
                                    </button>
                                  ) : (
                                    <button 
                                      className="btn btn-primary btn-sm"
                                      onClick={() => {
                                        handleViewPrescription(
                                          patient.prescriptionSlip, 
                                          patient.patientName, 
                                          patient.visitId
                                        )
                                      }}
                                      disabled={isPrescriptionDownloading || tableLoading}
                                    >
                                      {isPrescriptionDownloading ? (
                                        <>
                                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                          Loading...
                                        </>
                                      ) : (
                                        <>
                                          <i className="mdi mdi-eye me-1"></i>
                                          View
                                        </>
                                      )}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            )
                          })
                        ) : (
                          // Show empty state
                          <tr>
                            <td colSpan="11">
                              <div className="text-center py-5">
                                <div className="text-muted">
                                  <i className="mdi mdi-file-document-outline" style={{ fontSize: '48px' }}></i>
                                  <h5 className="mt-3">No OPD Records Found</h5>
                                  <p className="mb-0">
                                    {isSearchMode ? "Try adjusting your search criteria" : "No OPD records available"}
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {!tableLoading && opdPatients.length > 0 && totalItems > itemsPerPage && (
                    <div className="mt-4">
                      <Pagination
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}

                  {/* Show total items count */}
                  {!tableLoading && !loading && opdPatients.length > 0 && (
                    <div className="mt-3 text-muted small">
                      Showing {opdPatients.length} of {totalItems} records
                      {isSearchMode && " (filtered results)"}
                    </div>
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

export default OPDReports