import { useState, useEffect } from "react"
import LoadingScreen from "../../../Components/Loading"
import { getRequest } from "../../../service/apiService"
import { BILLING, LAB_REPORT_API, OPD_REPORT_API } from "../../../config/apiConfig"
import Popup from "../../../Components/popup"
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer"

const PatientwiseBilldatails = () => {
  const [patientList, setPatientList] = useState([])
  const [searchData, setSearchData] = useState({
    patientName: "",
    mobileNo: ""
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const itemsPerPage = 5

  // Add state variables for PDF handling
  const [pdfUrl, setPdfUrl] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  
  // Track loading states for individual records
  const [generatingPdfIds, setGeneratingPdfIds] = useState(new Set());
  const [printingIds, setPrintingIds] = useState(new Set());

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      },
    });
  };

  const fetchBillingStatus = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await getRequest(`${BILLING}`)

      if (response && response.response) {
        const mappedData = response.response.map((item) => ({
          id: item.headerId,
          visitId: item.visitId,
          patientId: item.headerId,
          patientName: item.patientName || "",
          mobileNo: item.phoneNo || "",
          age: item.age || "",
          sex: item.sex || "",
          relation: item.relation || "",
          billingType: item.serviceCategoryName || "",
          department: item.department || "",
          amount: item.netAmount,
          billingStatus: item.paymentStatus,
          billNo: item.billNo,
          billDate: item.billDate || "",
          serviceCategoryId: item.serviceCategoryId || null,
          fullData: item,
        }))

        setPatientList(mappedData)
      }
    } catch (error) {
      console.error("Error fetching billing status data:", error)
      setError(error.message)
      showPopup("Failed to fetch billing data", "error");
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBillingStatus()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchData.patientName, searchData.mobileNo])

  // Helper function to check if a record is generating PDF
  const isGeneratingPdf = (recordId) => {
    return generatingPdfIds.has(recordId);
  };

  // Helper function to check if a record is printing
  const isPrinting = (recordId) => {
    return printingIds.has(recordId);
  };

  // Generate PDF report based on serviceCategoryId
  const generateReport = async (record, flag = "D") => {
    const recordId = record.id;
    
    // Add this record to generating set
    if (flag === "D") {
      setGeneratingPdfIds(prev => new Set(prev).add(recordId));
    } else {
      setPrintingIds(prev => new Set(prev).add(recordId));
    }
    
    setPdfUrl(null);
    setSelectedRecord(record);

    try {
      let apiUrl = "";
      
      // Determine API endpoint based on serviceCategoryId
      if (record.serviceCategoryId === 1) {
        // OPD Report
        apiUrl = `${OPD_REPORT_API}?visit=${record.visitId}&flag=${flag}`;
      } else if (record.serviceCategoryId === 2) {
        // Lab Report
        apiUrl = `${LAB_REPORT_API}?billNo=${record.billNo}&paymentStatus=${record.billingStatus}&flag=${flag}`;
      } else {
        showPopup("Report type not supported for this service category", "error");
        return;
      }

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      if (flag === "D") {
        // For download/view - create blob and URL
        const blob = await response.blob();
        const fileURL = window.URL.createObjectURL(blob);
        setPdfUrl(fileURL);
      } else {
        // For print - just send to printer, no need to display
        showPopup("Report sent to printer successfully!", "success");
      }

    } catch (error) {
      console.error("Error generating PDF", error);
      if (flag === "D") {
        showPopup("Failed to generate report", "error");
      } else {
        showPopup("Failed to print report", "error");
      }
    } finally {
      // Remove this record from loading sets
      if (flag === "D") {
        setGeneratingPdfIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(recordId);
          return newSet;
        });
      } else {
        setPrintingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(recordId);
          return newSet;
        });
      }
    }
  };

  // View report handler
  const handleViewReport = (record) => {
    console.log("View report for:", record);
    generateReport(record, "D");
  }

  // Print report handler
  const handlePrintReport = (record) => {
    console.log("Print report for:", record);
    generateReport(record, "P");
  }

  const handleSearchChange = (e) => {
    const { id, value } = e.target
    setSearchData((prevData) => ({ ...prevData, [id]: value }))
  }

  const handleSearchReset = () => {
    setSearchData({
      patientName: "",
      mobileNo: ""
    })
  }

  const filteredPatientList = patientList.filter(
    (item) =>
      (searchData.patientName === "" || 
        item.patientName.toLowerCase().includes(searchData.patientName.toLowerCase())) &&
      (searchData.mobileNo === "" || 
        (item.mobileNo && item.mobileNo.includes(searchData.mobileNo)))
  )

  const filteredTotalPages = Math.ceil(filteredPatientList.length / itemsPerPage)
  const currentItems = filteredPatientList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)



  // Format date for better display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-GB')
    } catch (error) {
      return dateString
    }
  }

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'paid':
        return 'bg-success'
      case 'pending':
        return 'bg-warning'
      case 'cancelled':
        return 'bg-danger'
      default:
        return 'bg-secondary'
    }
  }

  // Format billing type badge
  const getBillingTypeBadge = (type) => {
    switch(type?.toLowerCase()) {
      case 'op':
        return 'bg-info'
      case 'ip':
        return 'bg-primary'
      default:
        return 'bg-secondary'
    }
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="content-wrapper">
      {/* Popup Component */}
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}

      {/* PDF Viewer Component */}
      {pdfUrl && selectedRecord && (
        <PdfViewer
          pdfUrl={pdfUrl}
          onClose={() => {
            setPdfUrl(null);
            setSelectedRecord(null);
          }}
          name={`${selectedRecord?.serviceCategoryId === 1 ? 'OPD' : 'LAB'} Invoice - ${selectedRecord?.patientName || 'Patient'}`}
        />
      )}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">Patient wise Bill Details</h4>
            </div>

            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  <strong>Error:</strong> {error}
                  <button type="button" className="btn btn-sm btn-outline-danger ms-2" onClick={fetchBillingStatus}>
                    Retry
                  </button>
                </div>
              )}

              {/* Patient Search Section - Similar to SampleValidation */}
              <div className="card mb-3">
                <div className="card-header py-3 border-bottom-1">
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
                        <button 
                          type="button" 
                          className="btn btn-primary me-2"
                          onClick={() => {}}
                        >
                          <i className="fa fa-search"></i> Search
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={handleSearchReset}
                        >
                          <i className="mdi mdi-refresh"></i> Reset
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              {!error && filteredPatientList.length === 0 && (
                <div className="alert alert-info" role="alert">
                  <i className="mdi mdi-information"></i> No billing records found.
                </div>
              )}

              {filteredPatientList.length > 0 && (
                <div className="table-responsive packagelist">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Bill No</th>
                        <th>Patient Name</th>
                        <th>Contact No.</th>
                        <th>Age/Sex</th>
                        <th>Relation</th>
                        <th>Department</th>
                        <th>Bill Date</th>
                        <th>Amount</th>
                        <th>Billing Type</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.billNo}</td>
                          <td>{item.patientName}</td>
                          <td>{item.mobileNo}</td>
                          <td>{item.age}/{item.sex}</td>
                          <td>{item.relation}</td>
                          <td>{item.department}</td>
                          <td>{formatDate(item.billDate)}</td>
                          <td>₹{typeof item.amount === "number" ? item.amount.toFixed(2) : item.amount}</td>
                          <td>
                            <span className={`badge ${getBillingTypeBadge(item.billingType)}`}>
                              {item.billingType}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleViewReport(item)}
                                disabled={isGeneratingPdf(item.id) || isPrinting(item.id)}
                                title="View Report"
                              >
                                {isGeneratingPdf(item.id) ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <i className="mdi mdi-eye me-1"></i> View
                                  </>
                                )}
                              </button>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handlePrintReport(item)}
                                disabled={isGeneratingPdf(item.id) || isPrinting(item.id)}
                                title="Print Report"
                              >
                                {isPrinting(item.id) ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    Printing...
                                  </>
                                ) : (
                                  <>
                                    <i className="mdi mdi-printer me-1"></i> Print
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

             
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientwiseBilldatails