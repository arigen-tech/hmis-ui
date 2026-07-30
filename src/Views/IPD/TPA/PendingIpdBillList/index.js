import { useState, useMemo } from "react"
import LoadingScreen from "../../../../Components/Loading"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../../Components/Pagination"

const PendingIpdBillList = () => {
  const [loading, setLoading] = useState(false)

  // Filter states
  const [wardFilter, setWardFilter] = useState("")
  const [billTypeFilter, setBillTypeFilter] = useState("")
  // New amount filter states
  const [amountFilter, setAmountFilter] = useState("") // '', 'gt50000', 'gt10000', 'other'
  const [customAmount, setCustomAmount] = useState("")

  // Button spinners
  const [isSearching, setIsSearching] = useState(false)
  const [isShowingAll, setIsShowingAll] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // Full static data (unchanged)
  const fullBillData = useMemo(() => [
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
  ], [])

  // Filtered and paginated data
  const [filteredData, setFilteredData] = useState(fullBillData)
  const [displayData, setDisplayData] = useState(fullBillData.slice(0, DEFAULT_ITEMS_PER_PAGE))

  // Ward dropdown options
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

  // Amount filter options
  const amountOptions = [
    { value: "", label: "Select Amount Filter" },
    { value: "gt50000", label: "> 50,000" },
    { value: "gt10000", label: "> 10,000" },
    { value: "other", label: "Other" },
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

  const getOutstandingDotColor = (outstandingAmount) => {
    const value = parseFloat(String(outstandingAmount).replace(/,/g, "")) || 0;
    if (value === 0) return "#28a745";
    if (value <= 10000) return "#ffc107";
    return "#dc3545";
  }

  // Apply filters and pagination
  const applyFiltersAndPaginate = (data, page) => {
    // Filter
    let filtered = data;

    // Ward filter
    if (wardFilter) {
      const ward = wardOptions.find(w => w.id === parseInt(wardFilter))
      if (ward) {
        filtered = filtered.filter(item => item.wardRoom.includes(ward.name))
      }
    }

    // Bill type filter
    if (billTypeFilter) {
      filtered = filtered.filter(item => item.billType === billTypeFilter)
    }

    // Amount filter
    if (amountFilter) {
      let threshold = 0
      if (amountFilter === "gt50000") threshold = 50000
      else if (amountFilter === "gt10000") threshold = 10000
      else if (amountFilter === "other" && customAmount) {
        threshold = parseFloat(customAmount.replace(/,/g, "")) || 0
      }
      if (threshold > 0) {
        filtered = filtered.filter(item => {
          const outstanding = parseFloat(String(item.outstandingAmount).replace(/,/g, "")) || 0
          return outstanding > threshold
        })
      }
    }

    // Pagination
    const total = filtered.length
    const perPage = DEFAULT_ITEMS_PER_PAGE
    const totalPages = Math.ceil(total / perPage) || 1
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * perPage
    const end = start + perPage
    const pageItems = filtered.slice(start, end)

    setFilteredData(filtered)
    setDisplayData(pageItems)
    setTotalElements(total)
    setTotalPages(totalPages)
    setCurrentPage(safePage)
  }

  // Handle page change
  const handlePageChange = (page) => {
    applyFiltersAndPaginate(filteredData.length > 0 ? filteredData : fullBillData, page)
  }

  // Handle search with filters
  const handleSearch = async () => {
    setIsSearching(true)
    setCurrentPage(1)
    // Simulate async delay
    await new Promise(resolve => setTimeout(resolve, 300))
    applyFiltersAndPaginate(fullBillData, 1)
    setIsSearching(false)
  }

  const handleShowAll = async () => {
    setIsShowingAll(true)

    setWardFilter("")
    setBillTypeFilter("")
    setAmountFilter("")
    setCustomAmount("")
    setCurrentPage(1)

    await new Promise(resolve => setTimeout(resolve, 300))
    setFilteredData(fullBillData)
    setDisplayData(fullBillData.slice(0, DEFAULT_ITEMS_PER_PAGE))
    setTotalElements(fullBillData.length)
    setTotalPages(Math.ceil(fullBillData.length / DEFAULT_ITEMS_PER_PAGE) || 1)
    setIsShowingAll(false)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 300))
    applyFiltersAndPaginate(filteredData.length > 0 ? filteredData : fullBillData, currentPage)
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
              {/* Refresh button (optional) */}
           
            </div>

            <div className="card-body">
              {/* ============ FILTERS ============ */}
              <div className="row mb-3">
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

                <div className="col-md-4">
                  <label className="form-label fw-bold">Outstanding Amount</label>
                  <div className="d-flex">
                    <select
                      className={`form-select ${amountFilter === "other" ? "flex-grow-1 me-1" : "w-100"}`}
                      value={amountFilter}
                      onChange={(e) => {
                        setAmountFilter(e.target.value)
                        if (e.target.value !== "other") {
                          setCustomAmount("")
                        }
                      }}
                    >
                      {amountOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {amountFilter === "other" && (
                      <input
                        type="text"
                        className="form-control"
                        style={{ width: "80px", flexShrink: 0 }}
                        placeholder="e.g. 25000"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-md-12 d-flex align-items-end">
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
                    ) : displayData.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="text-center py-4 text-muted">
                          No pending IPD bills found.
                        </td>
                      </tr>
                    ) : (
                      displayData.map((item) => (
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
                            <span
                              className="d-inline-block rounded-circle me-2"
                              style={{ width: "10px", height: "10px", backgroundColor: getOutstandingDotColor(item.outstandingAmount) }}
                            ></span>
                            ₹{item.patientPaid}
                          </td>
                          <td>₹{item.outstandingAmount}</td>
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
                              <i className="fa fa-file-pdf-o ms-1"></i>
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