import { useState, useEffect } from "react"

const LabReports = () => {
  const [mobileNo, setMobileNo] = useState("")
  const [patientName, setPatientName] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const [labData, setLabData] = useState([])
  const [filteredLabData, setFilteredLabData] = useState([])
  const [loading, setLoading] = useState(false)

  // Mock data based on the image
 const mockLabData = [
  {
    id: 1,
    investigationDate: "22/12/2025",
    patientName: "Ramesh Patel",
    mobileNo: "9876543210",
    genderAge: "MALE / 45 years",
    mmuName: "Durg-MMJ02",
    investigationName: "FASTING BLOOD SUGAR (FBS)",
    unit: "mg/dl",
    result: "98",
    range: "60-100",
    enteredBy: "Anita Verma",
    validatedBy: "Dr. S.K. Sharma"
  },
  {
    id: 2,
    investigationDate: "22/12/2025",
    patientName: "Sunita Yadav",
    mobileNo: "9123456789",
    genderAge: "FEMALE / 38 years",
    mmuName: "Raipur-MMJ04",
    investigationName: "POST PRANDIAL BLOOD SUGAR (PPBS)",
    unit: "mg/dl",
    result: "145",
    range: "60-140",
    enteredBy: "Rahul Tiwari",
    validatedBy: "Dr. Meena Joshi"
  },
  {
    id: 3,
    investigationDate: "23/12/2025",
    patientName: "Mohit Singh",
    mobileNo: "9988776655",
    genderAge: "MALE / 29 years",
    mmuName: "Korba-MMJ01",
    investigationName: "RANDOM BLOOD SUGAR (RBS)",
    unit: "mg/dl",
    result: "110",
    range: "60-140",
    enteredBy: "Pooja Kulkarni",
    validatedBy: "Dr. A.K. Mishra"
  },
  {
    id: 4,
    investigationDate: "23/12/2025",
    patientName: "Kavita Deshmukh",
    mobileNo: "9090909090",
    genderAge: "FEMALE / 62 years",
    mmuName: "Balod-MMJ05",
    investigationName: "FASTING BLOOD SUGAR (FBS)",
    unit: "mg/dl",
    result: "118",
    range: "60-100",
    enteredBy: "Sandeep Rao",
    validatedBy: "Dr. N. Banerjee"
  },
  {
    id: 5,
    investigationDate: "24/12/2025",
    patientName: "Imran Ali",
    mobileNo: "9345678123",
    genderAge: "MALE / 51 years",
    mmuName: "Janjgir-MMJ06",
    investigationName: "RANDOM BLOOD SUGAR (RBS)",
    unit: "mg/dl",
    result: "190",
    range: "60-140",
    enteredBy: "Neha Choudhary",
    validatedBy: "Dr. R.P. Verma"
  }
];


  useEffect(() => {
    setLabData(mockLabData)
    setFilteredLabData(mockLabData)
  }, [])

  const handleSearch = () => {
    setLoading(true)
    
    // Filter logic based on search criteria
    const filtered = labData.filter((item) => {
      // Filter by mobile number (partial match)
      if (mobileNo && !item.mobileNo.includes(mobileNo)) return false
      
      // Filter by patient name (case-insensitive partial match)
      if (patientName && !item.patientName.toLowerCase().includes(patientName.toLowerCase())) return false
      
      // Filter by date range
      if (fromDate && toDate) {
        const itemDateParts = item.investigationDate.split('/')
        const itemDate = new Date(`${itemDateParts[2]}-${itemDateParts[1]}-${itemDateParts[0]}`)
        const from = new Date(fromDate)
        const to = new Date(toDate)
        
        if (itemDate < from || itemDate > to) return false
      }
      
      return true
    })
    
    setTimeout(() => {
      setFilteredLabData(filtered)
      setCurrentPage(1)
      setLoading(false)
    }, 300)
  }

  const handleShowAll = () => {
    setMobileNo("")
    setPatientName("")
    setFromDate("")
    setToDate("")
    setFilteredLabData(labData)
    setCurrentPage(1)
  }

  const handleViewReport = (record) => {
    console.log("View report for:", record)
  }

  const handlePrintReport = (record) => {
    console.log("Print report for:", record)
  }

  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    } else {
      alert("Please enter a valid page number.")
    }
  }

  const itemsPerPage = 5
  const currentItems = filteredLabData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(filteredLabData.length / itemsPerPage)

  const renderPagination = () => {
    const pageNumbers = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

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

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pageNumbers.push("...")
      pageNumbers.push(totalPages)
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

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">LAB REPORTS</h4>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-2">
                  <label className="form-label">Mobile No</label>
                  <input
                    type="text"
                    className="form-control"
                    value={mobileNo}
                    onChange={(e) => setMobileNo(e.target.value)}
                    placeholder="Enter mobile number"
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Patient Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter patient name"
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
                  />
                </div>
                <div className="col-md-4 d-flex align-items-end">
                  <button type="button" className="btn btn-primary me-2" onClick={handleSearch}>
                    Search
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleShowAll}>
                    Show All
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <span className="fw-bold">{filteredLabData.length} matches</span>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                    <tr>
                      <th>Investigation Date</th>
                      <th>Patient Name</th>
                      <th>Mobile No</th>
                      <th>Gender / Age</th>
                      <th>Name</th>
                      <th>Investigation Name</th>
                      <th>Unit</th>
                      <th>Result</th>
                      <th>Range</th>
                      <th>Entered By</th>
                      <th>Validated By</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="text-center">
                          No Record Found
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.investigationDate}</td>
                          <td>{item.patientName}</td>
                          <td>{item.mobileNo}</td>
                          <td>{item.genderAge}</td>
                          <td>{item.mmuName}</td>
                          <td>{item.investigationName}</td>
                          <td>{item.unit}</td>
                          <td>{item.result}</td>
                          <td>{item.range}</td>
                          <td>{item.enteredBy}</td>
                          <td>{item.validatedBy}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <button 
                                type="button" 
                                className="btn btn-sm btn-primary"
                                onClick={() => handleViewReport(item)}
                              >
                                View
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-sm btn-secondary"
                                onClick={() => handlePrintReport(item)}
                              >
                                Print
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <nav className="d-flex justify-content-between align-items-center mt-2">
                <div>
                  <span>
                    Page {currentPage} of {totalPages} | Total Records: {filteredLabData.length}
                  </span>
                </div>
                <ul className="pagination mb-0">{renderPagination()}</ul>
                <div className="d-flex align-items-center">
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LabReports