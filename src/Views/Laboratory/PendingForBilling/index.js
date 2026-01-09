import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import LoadingScreen from "../../../Components/Loading"
import { LAB } from "../../../config/apiConfig"
import { getRequest } from "../../../service/apiService"
import Pagination, {DEFAULT_ITEMS_PER_PAGE} from "../../../Components/Pagination";


const PendingForBilling = () => {
  const navigate = useNavigate()
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
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredPatientList.slice(indexOfFirst, indexOfLast);

 

  const  handlePendingClick = (patientData) => {
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

      // Default fallback
      return "/LabBillingDetails"
    }

    const route = getNavigationRoute(patientData.billingType)

    // Pass the complete data structure
    navigate(route, {
      state: {
        billingData: patientData.fullData,
        // billingData: {
        //   ...patientData.fullData,
        //   // Add normalized fields for easier access
        //   normalizedVisitType: patientData.visitType,
        //   normalizedDoctor: patientData.consultedDoctor,
        //   normalizedDepartment: patientData.department,
        //   billingHeaderIds:
        //     patientData.appointments?.map(a => a.billingHdId).filter(id => id) || []
        // },
      },
    })
  }

  
  const handleRefresh = () => {
    fetchPendingBilling()
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
                <button type="button" className="btn btn-primary me-2" onClick={handleRefresh} title="Refresh Data">
                  <i className="mdi mdi-refresh"></i> Refresh
                </button>
              </div>
            </div>
            <div className="card-body">
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