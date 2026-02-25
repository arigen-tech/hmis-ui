import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import LoadingScreen from "../../../Components/Loading"
import { LAB } from "../../../config/apiConfig"
import { getRequest } from "../../../service/apiService"
import Pagination, {DEFAULT_ITEMS_PER_PAGE} from "../../../Components/Pagination";

const PendingForBilling = () => {
  const navigate = useNavigate()
  const [patientList, setPatientList] = useState([])
  const [filteredPatientList, setFilteredPatientList] = useState([])
  const [searchData, setSearchData] = useState({
    patientName: "",
    mobileNo: ""
  })
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
        const mappedData = response.response.map((item) => {
          // Determine billing type and source
          const isConsultation = item.billinghdid !== null && item.billingType === "Consultation Services"
          const isLabRadiology = item.orderhdid !== null && item.billinghdid === null

          // Get first appointment data if available
          const firstAppointment = item.appointments?.[0] || {}

          // Normalize visit type
          const getVisitTypeLabel = (visitType) => {
            if (!visitType) return "New"
            if (visitType === "N") return "New"
            if (visitType === "F") return "Follow-up"
            return visitType
          }

          return {
            id: item.billinghdid || item.orderhdid,
            patientId: item.patientid,
            patientName: item.patientName || "N/A",
            mobileNo: item.mobileNo || "N/A",
            age: item.age || "N/A",
            sex: item.sex || "N/A",
            relation: item.relation || "N/A",
            address: item.address || "",

            // Billing type handling
            billingType: isLabRadiology
              ? "Laboratory Services"
              : (item.billingType || "N/A"),

            // Doctor and department - prioritize appointment data
            consultedDoctor: firstAppointment.consultedDoctor || item.consultedDoctor || "N/A",
            department: firstAppointment.department || item.department || "N/A",

            // Amount and status
            amount: item.amount || 0,
            billingStatus: item.billingStatus === "n" || item.orderhdPaymentStatus === "n"
              ? "Pending"
              : "Completed",

            // Visit information
            visitType: getVisitTypeLabel(firstAppointment.visitType || item.visitType),
            tokenNo: firstAppointment.tokenNo || item.tokenNo || null,
            visitDate: firstAppointment.visitDate || item.visitDate || null,
            sessionName: firstAppointment.sessionName || item.sessionName || null,

            // Registration cost - use top-level value
            registrationCost: Number(item.registrationCost || 0),

            // Original data
            appointments: item.appointments || [],
            details: item.details || [],
            flag: item.flag,
            source: item.source,
            billinghdid: item.billinghdid,
            orderhdid: item.orderhdid,

            // Store complete original data
            fullData: item
          }
        })

        setPatientList(mappedData)
        setFilteredPatientList(mappedData)
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

  const handleSearchChange = (e) => {
    const { id, value } = e.target
    setSearchData(prev => ({ ...prev, [id]: value }))
    setCurrentPage(1)
  }

  const handleSearch = () => {
    const filtered = patientList.filter((item) => {
      const patientNameMatch = searchData.patientName === "" || 
        item.patientName.toLowerCase().includes(searchData.patientName.toLowerCase())
      
      const mobileNoMatch = searchData.mobileNo === "" || 
        item.mobileNo.includes(searchData.mobileNo)
      
      return patientNameMatch && mobileNoMatch
    })
    setFilteredPatientList(filtered)
    setCurrentPage(1)
  }

  const handleReset = () => {
    setSearchData({
      patientName: "",
      mobileNo: ""
    })
    setFilteredPatientList(patientList)
    setCurrentPage(1)
  }

  const handlePendingClick = (patientData) => {
    const getNavigationRoute = (billingType) => {
      const type = billingType.toLowerCase()

      if (type.includes("laboratory") || type.includes("lab")) {
        return "/LabBillingDetails"
      }
      if (type.includes("opd") || type.includes("consultation services")) {
        return "/OPDBillingDetails"
      }
      if (type.includes("ipd")) {
        return "/IPDBillingDetails"
      }
      if (type.includes("pharmacy")) {
        return "/PharmacyBillingDetails"
      }
      if (type.includes("radiology")) {
        return "/RadiologyBillingDetails"
      }

      return "/LabBillingDetails"
    }

    const route = getNavigationRoute(patientData.billingType)

    navigate(route, {
      state: {
        billingData: patientData.fullData,
      },
    })
  }

  const handleRefresh = () => {
    fetchPendingBilling()
  }

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredPatientList.slice(indexOfFirst, indexOfLast);

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">Pending For Billing</h4>
            </div>

            <div className="card-body">
              {/* Search Section */}
              <div className="mb-4">
                <div className="card-body">
                  <div className="row g-4 align-items-end">
                    <div className="col-md-4">
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
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Mobile No.</label>
                      <input
                        type="text"
                        className="form-control"
                        id="mobileNo"
                        placeholder="Enter mobile number"
                        value={searchData.mobileNo}
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

              {error && (
                <div className="alert alert-danger" role="alert">
                  <strong>Error:</strong> {error}
                  <button type="button" className="btn btn-sm btn-outline-danger ms-2" onClick={handleRefresh}>
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
                        <tr
                          key={item.id}
                          onClick={() => handlePendingClick(item)}
                          role="button"
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handlePendingClick(item) }}
                          style={{ cursor: "pointer" }}
                        >
                          <td>{item.patientName}</td>
                          <td>{item.mobileNo}</td>
                          <td>{item.age}</td>
                          <td>{item.sex}</td>
                          <td>{item.relation}</td>
                          <td>
                            <span className="badge bg-info">{item.billingType}</span>
                          </td>
                          <td>{item.consultedDoctor}</td>
                          <td>{item.department}</td>
                          <td>₹{typeof item.amount === "number" ? item.amount.toFixed(2) : item.amount}</td>
                          <td>
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={(e) => { e.stopPropagation(); handlePendingClick(item); }}
                              style={{
                                cursor: "pointer",
                                border: "none",
                                background: "transparent",
                                color: "#ff6b35",
                                textDecoration: "underline",
                              }}
                              aria-label={`Open ${item.patientName} billing details`}
                            >
                              {item.billingStatus}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredPatientList.length > 0 && (
                <Pagination
                  totalItems={filteredPatientList.length}
                  itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PendingForBilling