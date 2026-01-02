import { useState, useEffect } from "react"
import LoadingScreen from "../../../Components/Loading"
import { getRequest } from "../../../service/apiService"
import { LAB } from "../../../config/apiConfig"

const PatientwiseBilldatails = () => {
  const [patientList, setPatientList] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const itemsPerPage = 5

  const fetchPendingBilling = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await getRequest(`${LAB}/pending`)

      if (response && response.response) {
        const mappedData = response.response.map((item) => ({
          id: item.billinghdid,
          patientId: item.patientid,
          patientName: item.patientName || "N/A",
          mobileNo: item.mobileNo || "N/A",
          age: item.age || "N/A",
          sex: item.sex || "N/A",
          relation: item.relation || "N/A",
          billingType: item.billingType || "N/A",
          consultedDoctor: item.consultedDoctor || "N/A",
          department: item.department || "N/A",
          amount: item.amount || 0,
          billingStatus: item.billingStatus === "p" ? "Pending" : "Pending",
          fullData: item,
        }))

        setPatientList(mappedData)
      }
    } catch (error) {
      console.error("Error fetching pending billing data:", error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingBilling()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const filteredPatientList = patientList.filter(
    (item) =>
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mobileNo.includes(searchQuery)
  )

  const filteredTotalPages = Math.ceil(filteredPatientList.length / itemsPerPage)
  const currentItems = filteredPatientList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleViewClick = (patientData) => {
    console.log("View clicked for:", patientData)
    // Add view functionality here
  }

  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
      setCurrentPage(pageNumber)
      setPageInput("")
    } else {
      alert("Please enter a valid page number.")
    }
  }

  const handlePrintClick = (patientData) => {
    console.log("Print clicked for:", patientData)
    // Add print functionality here
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

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title m-0">Patient wise Bill Details</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!isLoading && (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search by name or mobile"
                        aria-label="Search"
                        value={searchQuery}
                        onChange={handleSearchChange}
                      />
                      <span className="input-group-text" id="search-icon">
                        <i className="fa fa-search"></i>
                      </span>
                    </div>
                  </form>
                )}
              </div>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  <strong>Error:</strong> {error}
                  <button type="button" className="btn btn-sm btn-outline-danger ms-2" onClick={fetchPendingBilling}>
                    Retry
                  </button>
                </div>
              )}

              {!error && filteredPatientList.length === 0 && (
                <div className="alert alert-info" role="alert">
                  <i className="mdi mdi-information"></i> No pending billing records found.
                </div>
              )}

              {filteredPatientList.length > 0 && (
                <div className="table-responsive packagelist">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Patient Name</th>
                        <th>Contact No.</th>
                        <th>Age</th>
                        <th>Sex</th>
                        <th>Relation</th>
                        <th>Department</th>
                        <th>Amount</th>
                        <th>Billing Type</th>
                        <th>Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.patientName}</td>
                          <td>{item.mobileNo}</td>
                          <td>{item.age}</td>
                          <td>{item.sex}</td>
                          <td>{item.relation}</td>
                          <td>{item.department}</td>
                          <td>₹{typeof item.amount === "number" ? item.amount.toFixed(2) : item.amount}</td>
                          <td>
                            <span className="badge bg-info">{item.billingType}</span>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleViewClick(item)}
                                title="View Details"
                              >
                                <i className="mdi mdi-eye me-1"></i> View
                              </button>
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handlePrintClick(item)}
                                title="Print Invoice"
                              >
                                <i className="mdi mdi-printer me-1"></i> Print
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredPatientList.length > 0 && (
                <nav className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    <span>
                      Page {currentPage} of {filteredTotalPages} | Total Records: {filteredPatientList.length}
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
                      Go
                    </button>
                  </div>
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientwiseBilldatails