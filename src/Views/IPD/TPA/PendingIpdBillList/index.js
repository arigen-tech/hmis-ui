import { useState } from "react"
import LoadingScreen from "../../../../Components/Loading"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../../Components/Pagination"

const PendingIpdBillList = () => {
  const [loading, setLoading] = useState(false)

  // States for filter fields
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [wardFilter, setWardFilter] = useState("")
  const [billTypeFilter, setBillTypeFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [searchKeyword, setSearchKeyword] = useState("")

  // States for button spinners
  const [isSearching, setIsSearching] = useState(false)
  const [isShowingAll, setIsShowingAll] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Server-side pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // IPD bill list data - UI only placeholder rows matching the wireframe
  const [billData, setBillData] = useState([
    {
      admissionId: "ADM001",
      patientName: "Ravi Kumar",
      mobile: "9876543210",
      admissionDateTime: "05-Apr-2026 10:30 AM",
      wardRoom: "Ward A / 101",
      billType: "Insurance",
      totalAmount: "1,00,000",
      insurancePayable: "70,000",
      patientPaid: "20,000",
      outstandingAmount: "10,000",
      billStatus: "FINAL",
    },
    {
      admissionId: "ADM002",
      patientName: "Amit Sharma",
      mobile: "9123456780",
      admissionDateTime: "04-Apr-2026 02:15 PM",
      wardRoom: "Ward B / 205",
      billType: "Corporate",
      totalAmount: "80,000",
      insurancePayable: "50,000",
      patientPaid: "20,000",
      outstandingAmount: "10,000",
      billStatus: "OPEN",
    },
    {
      admissionId: "ADM003",
      patientName: "Sneha Verma",
      mobile: "9988776655",
      admissionDateTime: "03-Apr-2026 09:00 AM",
      wardRoom: "ICU / 12",
      billType: "Cash",
      totalAmount: "60,000",
      insurancePayable: "0",
      patientPaid: "60,000",
      outstandingAmount: "0",
      billStatus: "FINAL",
    },
    {
      admissionId: "ADM004",
      patientName: "Rajesh Singh",
      mobile: "9811122233",
      admissionDateTime: "02-Apr-2026 11:45 AM",
      wardRoom: "Ward C / 310",
      billType: "Insurance",
      totalAmount: "1,50,000",
      insurancePayable: "1,00,000",
      patientPaid: "30,000",
      outstandingAmount: "20,000",
      billStatus: "INTERIM",
    },
    {
      admissionId: "ADM005",
      patientName: "Pooja Gupta",
      mobile: "9090909090",
      admissionDateTime: "01-Apr-2026 04:20 PM",
      wardRoom: "Ward A / 115",
      billType: "Insurance",
      totalAmount: "90,000",
      insurancePayable: "60,000",
      patientPaid: "25,000",
      outstandingAmount: "5,000",
      billStatus: "FINAL",
    },
  ])

  // Ward dropdown options - UI only placeholders
  const wardOptions = [
    { id: 1, name: "Ward A" },
    { id: 2, name: "Ward B" },
    { id: 3, name: "Ward C" },
    { id: 4, name: "ICU" },
  ]

  // Bill Type dropdown options
  const billTypeOptions = [
    { value: "Insurance", label: "Insurance" },
    { value: "Corporate", label: "Corporate" },
    { value: "Cash", label: "Cash" },
  ]

  // Bill Status dropdown options
  const statusOptions = [
    { value: "OPEN", label: "Open" },
    { value: "INTERIM", label: "Interim" },
    { value: "FINAL", label: "Final" },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case "OPEN":
        return { backgroundColor: "#ffc107", color: "#000" }
      case "INTERIM":
        return { backgroundColor: "#fd7e14", color: "#fff" }
      case "FINAL":
        return { backgroundColor: "#28a745", color: "#fff" }
      default:
        return { backgroundColor: "#6c757d", color: "#fff" }
    }
  }

  // Outstanding indicator dot: green = fully settled, yellow = partially outstanding, red = high outstanding
  const getOutstandingDotColor = (outstandingAmount) => {
    const value = parseFloat(String(outstandingAmount).replace(/,/g, "")) || 0;
    if (value === 0) return "#28a745"; // green
    if (value <= 10000) return "#ffc107"; // yellow
    return "#dc3545"; // red
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page)
    // fetchIpdBillList(page - 1)
  }

  // Handle search with filters
  const handleSearch = async () => {
    setIsSearching(true)
    setCurrentPage(1)
    // await fetchIpdBillList(0)
    setIsSearching(false)
  }

  const handleShowAll = async () => {
    setIsShowingAll(true)

    setFromDate("")
    setToDate("")
    setWardFilter("")
    setBillTypeFilter("")
    setStatusFilter("")
    setSearchKeyword("")
    setCurrentPage(1)

    // await fetchIpdBillList(0)
    setIsShowingAll(false)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // await fetchIpdBillList(currentPage - 1)
    setIsRefreshing(false)
  }

  const handleViewPaidAmount = (item, e) => {
    e.stopPropagation()
    console.log("View patient paid amount details:", item)
  }

  const handleViewBillPdf = (item, e) => {
    e.stopPropagation()
    console.log("View bill PDF:", item)
  }

  return (
    <div className="content-wrapper">
      {loading && <LoadingScreen />}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2 mb-0">
                Pending Tracking - IPD Bill List
              </h4>
            
            </div>

            <div className="card-body">
              {/* ============ FILTERS ============ */}
              <div className="row mb-4">
                <div className="col-md-4">
                  <label className="form-label fw-bold">Admission From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value)
                    }}
                    max={toDate || undefined}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Admission To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value)
                    }}
                    min={fromDate || undefined}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Ward</label>
                  <select
                    className="form-select"
                    value={wardFilter}
                    onChange={(e) => setWardFilter(e.target.value)}
                  >
                    <option value="">All Wards</option>
                    {wardOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Bill Type</label>
                  <select
                    className="form-select"
                    value={billTypeFilter}
                    onChange={(e) => setBillTypeFilter(e.target.value)}
                  >
                    <option value="">All Bill Types</option>
                    {billTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* <div className="col-md-4 mt-3">
                  <label className="form-label fw-bold">Bill Status</label>
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div> */}
                {/* <div className="col-md-4 mt-3">
                  <label className="form-label fw-bold">
                    Patient Name / Mobile / Admission ID
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Patient Name, Mobile or Admission ID"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                </div> */}
                <div className="col-md-4 mt-3 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-primary me-2"
                    onClick={handleSearch}
                    disabled={loading || isSearching || isShowingAll}
                  >
                    {isSearching ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Searching...
                      </>
                    ) : (
                      "Search"
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleShowAll}
                    disabled={loading || isSearching || isShowingAll}
                  >
                    {isShowingAll ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Showing All...
                      </>
                    ) : (
                      "Show All"
                    )}
                  </button>
                </div>
              </div>

              {/* ============ IPD BILL TABLE ============ */}
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead style={{ backgroundColor: "#95a5a6", color: "white" }}>
                    <tr>
                      <th>Patient Name</th>
                      <th>Mobile</th>
                      <th>Admission ID</th>
                      <th>Admission DateTime</th>
                      <th>Ward / Room</th>
                      <th>Bill Type</th>
                      <th>Total Amount</th>
                      <th>Insurance Payable</th>
                      <th>Patient Paid</th>
                      <th>Outstanding Amount</th>
                      <th>Bill Status</th>
                      <th className="text-center">View Bill (PDF)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={12} className="text-center py-4">
                          <LoadingScreen />
                        </td>
                      </tr>
                    ) : billData.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="text-center py-4 text-muted">
                          No pending IPD bills found.
                        </td>
                      </tr>
                    ) : (
                      billData.map((item) => (
                        <tr key={item.admissionId}>
                          <td>{item.patientName}</td>
                          <td>{item.mobile}</td>
                          <td>{item.admissionId}</td>
                          <td>{item.admissionDateTime}</td>
                          <td>{item.wardRoom}</td>
                          <td>{item.billType}</td>
                          <td>₹{item.totalAmount}</td>
                          <td>₹{item.insurancePayable}</td>
                          <td>
                           
                              ₹{item.patientPaid}
                          </td>
                          <td>
                            <span
                              className="d-inline-block rounded-circle me-2"
                            
                            ></span>
                            ₹{item.outstandingAmount}
                          </td>
                          <td>
                            <span className="badge" style={getStatusColor(item.billStatus)}>
                              {item.billStatus}
                            </span>
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={(e) => handleViewBillPdf(item, e)}
                              title="View Bill PDF"
                            >
                              View 
                              <i className="fa fa-file-pdf-o"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                totalItems={totalElements}
                itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                totalPages={totalPages}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PendingIpdBillList