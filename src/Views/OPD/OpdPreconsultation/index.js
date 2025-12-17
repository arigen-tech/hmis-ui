import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Popup from "../../../Components/popup";
import { GET_PRECONSULTATION, SET_VITALS } from "../../../config/apiConfig";
import { getRequest, postRequest } from "../../../service/apiService";

const OpdPreconsultation = () => {

  const setLoading = (b) => {

  };

  async function fetchPendingPreconsultation() {
    try {

      const data = await getRequest(`${GET_PRECONSULTATION}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        console.log(data.response);
        setVisits(data.response);
      } else {
        console.error("Unexpected API response format:", data);
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Fetching gender data (simulated API response)
    fetchPendingPreconsultation();
  }, []);
  const [visits, setVisits] = useState([]);
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const itemsPerPage = 3
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [vitalFormData, setVitalFormData] = useState({
    height: "",
    weight: "",
    temperature: "",
    systolic: "",
    diastolic: "",
    pulse: "",
    bmi: "",
    rr: "",
    spo2: "",
  })
  const [popupMessage, setPopupMessage] = useState(null)

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
      },
    })
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }



  const filteredTotalPages = Math.ceil(visits.length / itemsPerPage)

  const currentItems = visits.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleRowClick = (patient) => {
    if (selectedPatient && selectedPatient.id === patient.id) {
      setSelectedPatient(null) // Unselect if clicking the same patient
      setVitalFormData({
        height: "",
        weight: "",
        temperature: "",
        systolic: "",
        diastolic: "",
        pulse: "",
        bmi: "",
        rr: "",
        spo2: "",
      })
    } else {
      setSelectedPatient(patient)
      setVitalFormData({
        height: "",
        weight: "",
        temperature: "",
        systolic: "",
        diastolic: "",
        pulse: "",
        bmi: "",
        rr: "",
        spo2: "",
      })
    }
  }

  const handleVitalInputChange = (e) => {
    const { name, value } = e.target
    setVitalFormData({
      ...vitalFormData,
      [name]: value,
    })

    if ((name === "height" || name === "weight") && vitalFormData.height && vitalFormData.weight) {
      const height = name === "height" ? Number.parseFloat(value) : Number.parseFloat(vitalFormData.height)
      const weight = name === "weight" ? Number.parseFloat(value) : Number.parseFloat(vitalFormData.weight)

      if (height && weight) {
        const heightInMeters = height / 100
        const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1)
        setVitalFormData((prev) => ({
          ...prev,
          bmi: bmi,
        }))
      }
    }
  }

  const handleSaveVitals = (e) => {
    e.preventDefault()

    const updatedPatients = visits.map((patient) => {
      if (patient.id === selectedPatient.id) {
        return {
          ...patient,
          vitals: vitalFormData,
        }
      }
      return patient
    })

    setVisits(updatedPatients)
    // showPopup(`Vital details for ${selectedPatient?.patientName} have been saved successfully!`, "success")
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

  async function submitvitals() {
    const requestData = {
      height: vitalFormData.height,
      weight: vitalFormData.weight,
      pulse: vitalFormData.pulse,
      temperature: vitalFormData.temperature,
      opdDate: selectedPatient.visitDate,
      rr: vitalFormData.rr,
      bmi: vitalFormData.bmi,
      spo2: vitalFormData.spo2,
      bpSystolic: vitalFormData.systolic,
      bpDiastolic: vitalFormData.diastolic,
      patientId: selectedPatient.patient.id,
      visitId: selectedPatient.id,
      departmentId: selectedPatient.department.id,
      hospitalId: sessionStorage.getItem('hospitalId'),
      doctorId: selectedPatient.doctor.userId,
      lastChgBy: sessionStorage.getItem('username')
    };
    try {
      // debugger;
      const data = await postRequest(`${SET_VITALS}`, requestData);
      if (data.status === 200) {
        fetchPendingPreconsultation();
        await Swal.fire("Vitals saved for appointment", "", "success");
        setSelectedPatient(null);
      } else {
        console.error("Unexpected API response format:", data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header ">
              <h4 className="card-title p-2">OPD Pre-consultation</h4>
              <div className="d-flex justify-content-end align-items-spacearound mt-3">
                <div className="d-flex align-items-center">
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
            </div>
            <div className="card-body">
              <div className="table-responsive packagelist">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Patient Name</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>Department</th>
                      <th>Mobile No</th>
                      <th>Type</th>
                      <th>Doctor Name</th>
                      <th>Time Slot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits && visits.length > 0 ? (
                      visits.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => handleRowClick(item)}
                          className={selectedPatient && selectedPatient.id === item.id ? "table-primary" : ""}
                          style={{ cursor: "pointer" }}
                        >
                          <td>{`${item.patient.patientFn} ${item.patient.patientMn ?? ""} ${item.patient.patientLn ?? ""}`}</td>
                          <td>{item.patient.patientAge}</td>
                          <td>{item.patient.patientGender.genderName}</td>
                          <td>{item.department.departmentName}</td>
                          <td>{item.patient.patientMobileNumber}</td>
                          <td>{item.typeOfPatient}</td>
                          <td>{`${item.doctor.employee.firstName} ${item.doctor.employee.middleName ?? ""} ${item.doctor.employee.lastName ?? ""}`}</td>
                          <td>{`${item.startTime.substring(11, 16)} - ${item.endTime.substring(11, 16)}`}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center text-muted">
                          No records found
                        </td>
                      </tr>
                    )}
                  </tbody>

                </table>
              </div>

              {selectedPatient && (
                <div className="row mb-3 mt-3">
                  <div className="col-sm-12">
                    <div className="card shadow mb-3">
                      <div className="card-header py-3 bg-light border-bottom-1 d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 fw-bold">Vital Details for {selectedPatient.patientName}</h6>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setSelectedPatient(null)}
                        >
                          <i className="fa fa-times"></i> Close
                        </button>
                      </div>
                      <div className="card-body">
                        <form className="vital" onSubmit={handleSaveVitals}>
                          <div className="row g-3 align-items-center">
                            {/* Patient Height */}
                            <div className="col-md-4 d-flex">
                              <label className="form-label me-2">
                                Patient Height<span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Height"
                                name="height"
                                value={vitalFormData.height}
                                onChange={handleVitalInputChange}
                                required
                              />
                              <span className="input-group-text">cm</span>
                            </div>

                            <div className="col-md-4 d-flex">
                              <label className="form-label me-2">
                                Weight<span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Weight"
                                name="weight"
                                value={vitalFormData.weight}
                                onChange={handleVitalInputChange}
                                required
                              />
                              <span className="input-group-text">kg</span>
                            </div>

                            <div className="col-md-4 d-flex">
                              <label className="form-label me-2">
                                Temperature<span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Temperature"
                                name="temperature"
                                value={vitalFormData.temperature}
                                onChange={handleVitalInputChange}
                                required
                              />
                              <span className="input-group-text">°F</span>
                            </div>

                            <div className="col-md-4 d-flex">
                              <label className="form-label me-2">
                                BP<span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Systolic"
                                name="systolic"
                                value={vitalFormData.systolic}
                                onChange={handleVitalInputChange}
                                required
                              />
                              <span className="input-group-text">/</span>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Diastolic"
                                name="diastolic"
                                value={vitalFormData.diastolic}
                                onChange={handleVitalInputChange}
                                required
                              />
                              <span className="input-group-text">mmHg</span>
                            </div>

                            <div className="col-md-4 d-flex">
                              <label className="form-label me-2">
                                Pulse<span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Pulse"
                                name="pulse"
                                value={vitalFormData.pulse}
                                onChange={handleVitalInputChange}
                                required
                              />
                              <span className="input-group-text">/min</span>
                            </div>

                            <div className="col-md-4 d-flex">
                              <label className="form-label me-2">BMI</label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="BMI"
                                name="bmi"
                                value={vitalFormData.bmi}
                                onChange={handleVitalInputChange}
                                readOnly
                              />
                              <span className="input-group-text">kg/m²</span>
                            </div>

                            <div className="col-md-4 d-flex">
                              <label className="form-label me-2">RR</label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="RR"
                                name="rr"
                                value={vitalFormData.rr}
                                onChange={handleVitalInputChange}
                              />
                              <span className="input-group-text">/min</span>
                            </div>

                            <div className="col-md-4 d-flex">
                              <label className="form-label me-2">SpO2</label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="SpO2"
                                name="spo2"
                                value={vitalFormData.spo2}
                                onChange={handleVitalInputChange}
                              />
                              <span className="input-group-text">%</span>
                            </div>

                            <div className="col-12 mt-3 d-flex justify-content-end">
                              <button type="submit" className="btn btn-primary" onClick={submitvitals}>
                                Save Vital Details
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <nav className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  <span>
                    Page {currentPage} of {filteredTotalPages} | Total Records: {visits.length}
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
      {popupMessage && (
        <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
      )}
    </div>
  )
}

export default OpdPreconsultation
