import { useState } from "react"
import { useNavigate } from "react-router-dom"

const PendingForBilling = () => {
  const navigate = useNavigate()

  const [patientList, setPatientList] = useState([
    {
      id: 1,
      patientName: "Rahul Sharma",
      mobileNo: "9876543210",
      age: 35,
      sex: "Male",
      relation: "Self",
      billingType: "OPD",
      consultedDoctor: "Dr. A. Verma",
      department: "General Medicine",
      amount: 500,
      billingStatus: "Pending",
      patientId: "P123456",
      address: "Delhi, India",
      visitDate: "2025-07-03",
      visitType: "New",
      visitId: "V789654",
      room: "Room 101",
      opdSession: "Morning (9-1 PM)",
      tariffPlan: "General Tariff",
      basePrice: 500,
      discount: 10,
      netAmount: 450,
      gst: 81,
      totalAmount: 531,
      status: "y",
    },
    {
      id: 2,
      patientName: "Anita Gupta",
      mobileNo: "9123456789",
      age: 28,
      sex: "Female",
      relation: "Wife",
      billingType: "Lab",
      consultedDoctor: "Dr. P. Nair",
      department: "Pathology",
      amount: 1200,
      billingStatus: "Pending",
      patientId: "P123457",
      address: "Mumbai, India",
      visitDate: "2025-07-03",
      visitType: "Follow-up",
      visitId: "V789655",
      room: "Lab 201",
      opdSession: "Evening (2-6 PM)",
      tariffPlan: "Premium Tariff",
      basePrice: 1200,
      discount: 5,
      netAmount: 1140,
      gst: 205,
      totalAmount: 1345,
      status: "y",
    },
    {
      id: 3,
      patientName: "Suresh Kumar",
      mobileNo: "9090909090",
      age: 45,
      sex: "Male",
      relation: "Father",
      billingType: "OPD",
      consultedDoctor: "Dr. R. Mehta",
      department: "Cardiology",
      amount: 800,
      billingStatus: "Pending",
      patientId: "P123458",
      address: "Bangalore, India",
      visitDate: "2025-07-03",
      visitType: "New",
      visitId: "V789656",
      room: "Room 301",
      opdSession: "Morning (9-1 PM)",
      tariffPlan: "General Tariff",
      basePrice: 800,
      discount: 15,
      netAmount: 680,
      gst: 122,
      totalAmount: 802,
      status: "y",
    },
  ])

  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const itemsPerPage = 5

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const filteredPatientList = patientList.filter(
    (item) =>
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mobileNo.includes(searchQuery) ||
      item.consultedDoctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredTotalPages = Math.ceil(filteredPatientList.length / itemsPerPage)
  const currentItems = filteredPatientList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handlePendingClick = (patientId) => {
    // Navigate to OPD Billing Details page with patient ID
    navigate(`/OPDBillingDetails?patientId=${patientId}`)
  }

  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
      setCurrentPage(pageNumber)
    } else {
      alert("Please enter a valid page number.")
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

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">Pending For Billing</h4>
              <div className="d-flex justify-content-between align-items-center">
                <form className="d-inline-block searchform me-4" role="search">
                  <div className="input-group searchinput">
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search"
                      aria-label="Search"
                      value={searchQuery}
                      onChange={handleSearchChange}
                    />
                    <span className="input-group-text" id="search-icon">
                      <i className="fa fa-search"></i>
                    </span>
                  </div>
                </form>
                <button type="button" className="btn btn-success me-2">
                  <i className="mdi mdi-plus"></i> Generate Report
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive packagelist">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Patient Name</th>
                      <th>Mobile No.</th>
                      <th>Age</th>
                      <th>Sex</th>
                      <th>Relation</th>
                      <th>Billing Type</th>
                      <th>Consulted Doctor</th>
                      <th>Department</th>
                      <th>Amount</th>
                      <th>Billing Status</th>
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
                        <td>{item.billingType}</td>
                        <td>{item.consultedDoctor}</td>
                        <td>{item.department}</td>
                        <td>₹{item.amount}</td>
                        <td>
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={() => handlePendingClick(item.id)}
                            style={{
                              cursor: "pointer",
                              border: "none",
                              background: "transparent",
                              color: "#ff6b35",
                              textDecoration: "underline",
                            }}
                          >
                            {item.billingStatus}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

export default PendingForBilling
