import { useState } from "react"
import Popup from "../../../Components/popup"

const SampleValidation = () => {
  const [sampleList, setSampleList] = useState([
    {
      id: 1,
      sample_date_time: "17/07/2025-17:03",
      order_no: "215334",
      patient_name: "SURAJ DAS",
      mobile_no: "9876543210",
      age: 35,
      gender: "Male",
      modality: "BIO-CHEMISTRY",
      doctor_name: "Sandeep",
      status: "y", // 'y' = Active, 'n' = Deactivated
    },
    {
      id: 2,
      sample_date_time: "17/07/2025-17:03",
      order_no: "215334",
      patient_name: "SURAJ DAS",
      mobile_no: "1234567890",
      age: 28,
      gender: "Male",
      modality: "MOLECULAR BIOLOGY",
      doctor_name: "Sandeep",
      status: "y",
    },
    {
      id: 3,
      sample_date_time: "17/07/2025-17:03",
      order_no: "215334",
      patient_name: "SURAJ DAS",
      mobile_no: "0987654321",
      age: 40,
      gender: "Male",
      modality: "Clinical Pathology",
      doctor_name: "Sandeep",
      status: "y",
    },
    {
      id: 4,
      sample_date_time: "18/07/2025-09:15",
      order_no: "215445",
      patient_name: "AMIT SHARMA",
      mobile_no: "1122334455",
      age: 50,
      gender: "Male",
      modality: "RADIOLOGY",
      doctor_name: "Dr. Priya",
      status: "n",
    },
    {
      id: 5,
      sample_date_time: "18/07/2025-10:30",
      order_no: "215556",
      patient_name: "RAVI PATEL",
      mobile_no: "6677889900",
      age: 22,
      gender: "Male",
      modality: "X-RAY",
      doctor_name: "Dr. Anil",
      status: "y",
    },
  ])

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, sampleId: null, newStatus: false })
  // Update searchData state to include patientName and mobileNo
  const [searchData, setSearchData] = useState({
    barCodeSearch: "",
    patientName: "",
    mobileNo: "",
  })
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const itemsPerPage = 5

  // Update handleSearchChange to handle new fields
  const handleSearchChange = (e) => {
    const { id, value } = e.target
    setSearchData((prevData) => ({ ...prevData, [id]: value }))
    setCurrentPage(1)
  }

  // Update filter logic to include patientName and mobileNo
  const filteredSampleList = sampleList.filter((item) => {
    const barCodeMatch =
      searchData.barCodeSearch === "" ||
      item.order_no.toLowerCase().includes(searchData.barCodeSearch.toLowerCase()) ||
      item.patient_name.toLowerCase().includes(searchData.barCodeSearch.toLowerCase())

    const patientNameMatch =
      searchData.patientName === "" ||
      item.patient_name.toLowerCase().includes(searchData.patientName.toLowerCase())

    const mobileNoMatch =
      searchData.mobileNo === "" ||
      (item.mobile_no && item.mobile_no.includes(searchData.mobileNo))

    return barCodeMatch && patientNameMatch && mobileNoMatch
  })

  const filteredTotalPages = Math.ceil(filteredSampleList.length / itemsPerPage)
  const currentItems = filteredSampleList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
      },
    })
  }

  // When toggling status, treat 'y' as Active and 'n' as Deactivated
  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, sampleId: id, newStatus })
  }

  const handleConfirm = (confirmed) => {
    if (confirmed && confirmDialog.sampleId !== null) {
      setSampleList((prevData) =>
        prevData.map((item) =>
          item.id === confirmDialog.sampleId ? { ...item, status: confirmDialog.newStatus } : item,
        ),
      )
      showPopup(
        `Sample status updated to ${confirmDialog.newStatus === "y" ? "Active" : "Deactivated"}!`,
        "success"
      )
    }
    setConfirmDialog({ isOpen: false, sampleId: null, newStatus: null })
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
              <h4 className="card-title p-2">PENDING FOR SAMPLE VALIDATION</h4>
 <button type="button" className="btn btn-success">
                          <i className="mdi mdi-plus"></i> Generate Report
                        </button>
            </div>
             {/* <div className="col-md-2 ms-auto d-flex justify-content-end">
                       
                      </div> */}
            <div className="card-body">
              {/* Patient Search Section */}
              <div className="card  mb-3">
                <div className="card-header py-3 bg-light border-bottom-1">
                  <h6 className="mb-0 fw-bold">PATIENT SEARCH</h6>
                </div>
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
                          value={searchData.mobileNo}
                          onChange={handleSearchChange}
                        />
                      </div>
                      <div className="col-md-3 d-flex">
                        <button type="button" className="btn btn-primary me-2">
                          <i className="fa fa-search"></i> Search
                        </button>
                      </div>
                     
                    </div>
                  </form>
                </div>
              </div>

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
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.sample_date_time}</td>
                        <td>{item.order_no}</td>
                        <td>{item.patient_name}</td>
                        <td>{item.mobile_no}</td>
                        <td>{item.age}</td>
                        <td>{item.gender}</td>
                        <td>{item.modality}</td>
                        <td>{item.doctor_name}</td>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={item.status === "y"}
                              onChange={() => handleSwitchChange(item.id, item.status === "y" ? "n" : "y")}
                              id={`switch-${item.id}`}
                            />
                            <label
                              className="form-check-label px-0"
                              htmlFor={`switch-${item.id}`}
                            >
                              {item.status === "y" ? "Active" : "Deactivated"}
                            </label>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {confirmDialog.isOpen && (
                <div className="modal d-block" tabIndex="-1" role="dialog">
                  <div className="modal-dialog" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button type="button" className="close" onClick={() => handleConfirm(false)}>
                          <span>&times;</span>
                        </button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"} <strong>{sampleList.find((item) => item.id === confirmDialog.sampleId)?.order_no}</strong>?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>
                          No
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>
                          Yes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {popupMessage && (
                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
              )}

              <nav className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  <span>
                    Page {currentPage} of {filteredTotalPages} | Total Records: {filteredSampleList.length}
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

export default SampleValidation
