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
      order_date: "17/07/2025",
      order_time: "09:48",
      department: "GENERAL MEDICINE",
      reg_no: "013350004",
      relation: "Husband",
      collected_by: "Sandeep",
      clinical_notes: "",
      investigations: [
        {
          id: 1,
          sr_no: 1,
          diag_no: "215334",
          test_code: "LI_NEW",
          test_name: "Lipid Profile",
          sample: "SERUM",
          quantity: "1",
          empanelled_lab: "n",
          date_time: "17/07/2025",
          accepted: true,
          rejected: false,
          reason: "",
          additional_remarks: "",
        },
        {
          id: 2,
          sr_no: 2,
          diag_no: "215334",
          test_code: "HB_NEW1",
          test_name: "Hb A1C",
          sample: "Whole Blood",
          quantity: "1",
          empanelled_lab: "n",
          date_time: "17/07/2025",
          accepted: true,
          rejected: false,
          reason: "",
          additional_remarks: "",
        },
        {
          id: 3,
          sr_no: 3,
          diag_no: "215334",
          test_code: "BLD_UR",
          test_name: "Blood Urea",
          sample: "SERUM",
          quantity: "1",
          empanelled_lab: "n",
          date_time: "17/07/2025",
          accepted: true,
          rejected: false,
          reason: "",
          additional_remarks: "",
        },
        {
          id: 4,
          sr_no: 4,
          diag_no: "215334",
          test_code: "Crea NEW",
          test_name: "S. CREATININE",
          sample: "SERUM",
          quantity: "1",
          empanelled_lab: "n",
          date_time: "17/07/2025",
          accepted: true,
          rejected: false,
          reason: "",
          additional_remarks: "",
        },
      ],
    },
    {
      id: 2,
      sample_date_time: "17/07/2025-17:03",
      order_no: "215335",
      patient_name: "AMIT SHARMA",
      mobile_no: "1234567890",
      age: 28,
      gender: "Male",
      modality: "MOLECULAR BIOLOGY",
      doctor_name: "Dr. Priya",
      order_date: "17/07/2025",
      order_time: "10:15",
      department: "CARDIOLOGY",
      reg_no: "013350005",
      relation: "Self",
      collected_by: "Dr. Priya",
      clinical_notes: "",
      investigations: [
        {
          id: 1,
          sr_no: 1,
          diag_no: "215335",
          test_code: "CBC_NEW",
          test_name: "Complete Blood Count",
          sample: "WHOLE BLOOD",
          quantity: "1",
          empanelled_lab: "n",
          date_time: "17/07/2025",
          accepted: false,
          rejected: true,
          reason: "Insufficient sample",
          additional_remarks: "",
        },
      ],
    },
    {
      id: 3,
      sample_date_time: "18/07/2025-09:15",
      order_no: "215445",
      patient_name: "RAVI PATEL",
      mobile_no: "0987654321",
      age: 40,
      gender: "Male",
      modality: "Clinical Pathology",
      doctor_name: "Dr. Anil",
      order_date: "18/07/2025",
      order_time: "09:15",
      department: "GENERAL MEDICINE",
      reg_no: "013350006",
      relation: "Father",
      collected_by: "Dr. Anil",
      clinical_notes: "Patient has diabetes",
      investigations: [
        {
          id: 1,
          sr_no: 1,
          diag_no: "215445",
          test_code: "GLU_NEW",
          test_name: "Glucose Fasting",
          sample: "SERUM",
          quantity: "1",
          empanelled_lab: "n",
          date_time: "18/07/2025",
          accepted: true,
          rejected: false,
          reason: "",
          additional_remarks: "",
        },
      ],
    },
  ])

  const [searchData, setSearchData] = useState({
    barCodeSearch: "",
    patientName: "",
    mobileNo: "",
  })
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const [selectedSample, setSelectedSample] = useState(null)
  const [showDetailView, setShowDetailView] = useState(false)
  const itemsPerPage = 5

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

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
      },
    })
  }

  const handleSubmit = () => {
    setShowDetailView(false)
    if (selectedSample) {
      const updatedSamples = sampleList.map((sample) => (sample.id === selectedSample.id ? selectedSample : sample))
      setSampleList(updatedSamples)
      showPopup("Sample validation data saved successfully!", "success")
    }
  }

  const handleReset = () => {
    if (selectedSample) {
      const originalSample = sampleList.find((s) => s.id === selectedSample.id)
      setSelectedSample({ ...originalSample })
    }
  }

  const filteredSampleList = sampleList.filter((item) => {
    const barCodeMatch =
      searchData.barCodeSearch === "" ||
      item.order_no.toLowerCase().includes(searchData.barCodeSearch.toLowerCase()) ||
      item.patient_name.toLowerCase().includes(searchData.barCodeSearch.toLowerCase())

    const patientNameMatch =
      searchData.patientName === "" || item.patient_name.toLowerCase().includes(searchData.patientName.toLowerCase())

    const mobileNoMatch = searchData.mobileNo === "" || (item.mobile_no && item.mobile_no.includes(searchData.mobileNo))

    return barCodeMatch && patientNameMatch && mobileNoMatch
  })

  const filteredTotalPages = Math.ceil(filteredSampleList.length / itemsPerPage) || 1
  const currentItems = filteredSampleList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

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

  // Detail View
  if (showDetailView && selectedSample) {
    return (
      <div className="content-wrapper">
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="card-title p-2">SAMPLE VALIDATION</h4>
                  <button className="btn btn-secondary" onClick={handleBackToList}>
                    <i className="mdi mdi-arrow-left"></i> Back to List
                  </button>
                </div>
              </div>

              <div className="card-body">
                {/* Order Information Header */}
                <div className="row mb-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Order Date</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedSample.order_date}
                      onChange={(e) => setSelectedSample({ ...selectedSample, order_date: e.target.value })}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Order Time</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedSample.order_time}
                      onChange={(e) => setSelectedSample({ ...selectedSample, order_time: e.target.value })}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Order No.</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedSample.order_no}
                      onChange={(e) => setSelectedSample({ ...selectedSample, order_no: e.target.value })}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Department</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedSample.department}
                      onChange={(e) => setSelectedSample({ ...selectedSample, department: e.target.value })}
                    />
                  </div>
                </div>

                {/* Patient Details */}
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">PATIENT DETAILS</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Reg No.</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedSample.reg_no}
                          onChange={(e) => setSelectedSample({ ...selectedSample, reg_no: e.target.value })}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Patient Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedSample.patient_name}
                          onChange={(e) => setSelectedSample({ ...selectedSample, patient_name: e.target.value })}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Sex</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedSample.gender}
                          onChange={(e) => setSelectedSample({ ...selectedSample, gender: e.target.value })}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Relation</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedSample.relation}
                          onChange={(e) => setSelectedSample({ ...selectedSample, relation: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sample Details */}
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">SAMPLE DETAILS</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Date</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedSample.order_date}
                          onChange={(e) => setSelectedSample({ ...selectedSample, order_date: e.target.value })}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Time</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedSample.order_time}
                          onChange={(e) => setSelectedSample({ ...selectedSample, order_time: e.target.value })}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">
                          Collected By <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedSample.collected_by}
                          onChange={(e) => setSelectedSample({ ...selectedSample, collected_by: e.target.value })}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Brief Clinical Notes</label>
                        <textarea
                          className="form-control"
                          rows="1"
                          value={selectedSample.clinical_notes}
                          onChange={(e) => setSelectedSample({ ...selectedSample, clinical_notes: e.target.value })}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Investigations Table */}
                <div className="table-responsive">
                  <table className="table table-bordered table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>S.No.</th>
                        {/* <th>Diag No.</th> */}
                        <th>Code</th>
                        <th>Name</th>
                        <th>Sample</th>
                        <th>Qty</th>
                        <th>Empanelled Lab</th>
                        <th>Accepted</th>
                        <th>Rejected</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSample.investigations.map((investigation) => (
                        <tr key={investigation.id}>
                          {/* <td>{investigation.sr_no}</td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={investigation.diag_no}

                              onChange={(e) => handleInvestigationChange(investigation.id, "diag_no", e.target.value)}
                            />
                          </td> */}
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={investigation.test_code}
                              onChange={(e) => handleInvestigationChange(investigation.id, "test_code", e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={investigation.test_name}
                              onChange={(e) => handleInvestigationChange(investigation.id, "test_name", e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={investigation.sample}
                              onChange={(e) => handleInvestigationChange(investigation.id, "sample", e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={investigation.quantity}
                              onChange={(e) => handleInvestigationChange(investigation.id, "quantity", e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={investigation.empanelled_lab}
                              onChange={(e) =>
                                handleInvestigationChange(investigation.id, "empanelled_lab", e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={investigation.accepted}
                                style={{ width: "20px", height: "20px", border: "2px solid black" }}
                                onChange={(e) =>
                                  handleInvestigationChange(investigation.id, "accepted", e.target.checked)
                                }
                              />
                            </div>
                          </td>
                          <td>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={investigation.rejected}
                                style={{ width: "20px", height: "20px", border: "2px solid black" }}
                                onChange={(e) =>
                                  handleInvestigationChange(investigation.id, "rejected", e.target.checked)
                                }
                              />
                            </div>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={investigation.reason}
                              onChange={(e) => handleInvestigationChange(investigation.id, "reason", e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Action Buttons */}
                <div className="text-end mt-4">
                  <button className="btn btn-primary me-3" onClick={handleSubmit}>
                    <i className="mdi mdi-content-save"></i> SUBMIT
                  </button>
                  <button className="btn btn-secondary me-3" onClick={handleReset}>
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

  // List View
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

            <div className="card-body">
              {/* Patient Search Section */}
              <div className="card mb-3">
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
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setSearchData({
                              barCodeSearch: "",
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

              {/* Table */}
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
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => handleRowClick(item)}
                        style={{ cursor: "pointer" }}
                        className="table-row-hover"
                      >
                        <td>{item.sample_date_time}</td>
                        <td>{item.order_no}</td>
                        <td>{item.patient_name}</td>
                        <td>{item.mobile_no}</td>
                        <td>{item.age}</td>
                        <td>{item.gender}</td>
                        <td>{item.modality}</td>
                        <td>{item.doctor_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {popupMessage && (
                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
              )}

              {/* Pagination */}
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
                    style={{ width: "120px" }}
                  />
                  <button className="btn btn-primary" onClick={handlePageNavigation}>
                    GO
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
