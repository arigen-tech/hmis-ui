import { useState, useEffect } from "react"
import { getRequest } from "../../../service/apiService"
import LoadingScreen from "../../../Components/Loading"
import Popup from "../../../Components/popup"
import Pagination from "../../../Components/Pagination"

const OPDReports = () => {
  const [opdPatients, setOpdPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [popupMessage, setPopupMessage] = useState(null)
  
  // Search state
  const [searchData, setSearchData] = useState({
    mobileNo: "",
    patientName: ""
  })
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // ============= API FETCH FUNCTIONS =============
  const fetchOPDPatients = async () => {
    try {
      setLoading(true)
      // Mock data based on the image provided
      const mockData = [
        {
          id: 1,
          uhid: "UHID10234",
          patientName: "Rahul Yadav",
          mobileNo: "8349407641",
          relation: "Self",
          gender: "Male",
          age: "34 Y 2 M 15 D",
          specialty: "Neurology",
          doctorName: "Dr Amit Sharma",
          visitDateTime: "23-Feb-2026 10:34 AM",
          opdSlip: "View",
          prescriptionSlip: ""
        },
        {
          id: 2,
          uhid: "UHID10235",
          patientName: "Santoshi Yadav",
          mobileNo: "8349407641",
          relation: "Wife",
          gender: "Female",
          age: "45 Y 1 M 5 D",
          specialty: "Neurology",
          doctorName: "Dr Amit Sharma",
          visitDateTime: "23-Feb-2026 11:10 AM",
          opdSlip: "View",
          prescriptionSlip: "Not Issued"
        },
        {
          id: 3,
          uhid: "UHID10236",
          patientName: "Baby Aarav",
          mobileNo: "9009955562",
          relation: "Son",
          gender: "Male",
          age: "2 Y 3 M 5 D",
          specialty: "Pediatrics",
          doctorName: "Dr Neha Singh",
          visitDateTime: "23-Feb-2026 12:05 PM",
          opdSlip: "View",
          prescriptionSlip: ""
        }
      ]
      
      setOpdPatients(mockData)
    } catch (error) {
      console.error("Error fetching OPD patients:", error)
      showPopup("Failed to fetch OPD patients", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOPDPatients()
  }, [])

  // ============= HANDLER FUNCTIONS =============
  const handleSearchChange = (e) => {
    const { id, value } = e.target
    setSearchData(prev => ({ ...prev, [id]: value }))
    setCurrentPage(1)
  }

  const handleSearch = () => {
    setCurrentPage(1)
    console.log("Searching with:", searchData)
  }

  const handleReset = () => {
    setSearchData({
      mobileNo: "",
      patientName: ""
    })
    setCurrentPage(1)
    fetchOPDPatients()
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

  // ============= FILTERED & PAGINATED DATA =============
  const filteredPatients = opdPatients.filter((patient) => {
    const patientNameMatch = searchData.patientName === "" || 
      patient.patientName?.toLowerCase().includes(searchData.patientName.toLowerCase())
    
    const mobileNoMatch = searchData.mobileNo === "" || 
      patient.mobileNo?.includes(searchData.mobileNo)
    
    return patientNameMatch && mobileNoMatch
  })

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredPatients.slice(indexOfFirstItem, indexOfLastItem)

  // ============= OPD REPORTS LIST VIEW =============
  return (
    <div className="content-wrapper">
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
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
                          />
                        </div>
                        <div className="col-md-2">
                          <div className="d-flex gap-2">
                            <button 
                              type="button" 
                              className="btn btn-primary flex-fill"
                              onClick={handleSearch}
                            >
                              Search
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary flex-fill"
                              onClick={handleReset}
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Patients Table */}
                  <div className="table-responsive">
                    <table className="table table-bordered align-middle">
                      <thead className="table">
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
                        {currentItems.length > 0 ? (
                          currentItems.map((patient) => (
                            <tr key={patient.id}>
                              <td className="fw-bold">{patient.patientName}</td>
                              <td>{patient.mobileNo}</td>
                              <td>{patient.uhid}</td>
                              <td>{patient.relation}</td>
                              <td>{patient.gender}</td>
                              <td>{patient.age}</td>
                              <td>{patient.specialty}</td>
                              <td>{patient.doctorName}</td>
                              <td>{patient.visitDateTime}</td>
                              <td className="text-center">
                                <button className="btn btn-sm btn-success">
                                  {patient.opdSlip}
                                </button>
                              </td>
                              <td className="text-center">
                                {patient.prescriptionSlip === "Not Issued" ? (
                                  <button className="btn btn-sm btn-success" disabled>
                                    Not Issued
                                  </button>
                                ) : (
                                  <button className="btn btn-sm btn-success">
                                    View
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="11" className="text-center py-5">
                              <div className="text-muted">
                                <h5 className="mt-3">No OPD Records Found</h5>
                                <p className="mb-0">Try adjusting your search criteria</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {filteredPatients.length > 0 && (
                    <div className="mt-4">
                      <Pagination
                        totalItems={filteredPatients.length}
                        itemsPerPage={itemsPerPage}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                      />
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