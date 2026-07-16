import { useState, useEffect } from "react"
import Swal from "sweetalert2"
import { getRequest, putRequest } from "../../../service/apiService"
import { GET_WARD_BY_DEPARTMENT, GET_WARD_WISE_DETAILS, UPDATE_ADMISSION_INTERNAL_STATUS, IPD_INTERNAL_STATUS_RWD } from "../../../config/apiConfig"
import LoadingScreen from "../../../Components/Loading"
import DoctorVisitCaseNotes from "../DoctorVisitCaseNotes"
import ClinicalDashboard from "../ClinicalDashboard"
import BedTransfer from "../BedTransfer"
import VitalsandMonitoring from "../VitalsandMonitoring"
import InvestigationOrderandTracking from "../Investigations"
import DietOrderHistory from "../Diet"
import MedicationModule from "./../MAR"
import DischargeFromWard from "../DischargeFromWard"
import NursingCareModule from "../NursingProcedure/Care"
import IPDInitialAssessment from "../IPDInitialAssessment"

const WardManagement = () => {
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [activeTab, setActiveTab] = useState("Clinical Dashboard")
  const [showPatientList, setShowPatientList] = useState(true)
  const [isPatientListCollapsed, setIsPatientListCollapsed] = useState(false)
  const [wards, setWards] = useState([])
  const [selectedWard, setSelectedWard] = useState(null)
  const [patientData, setPatientData] = useState([])
  const [loadingBeds, setLoadingBeds] = useState(false)

  useEffect(() => {
    const fetchWards = async () => {
      try {
        const deptId = localStorage.getItem("departmentId") || sessionStorage.getItem("departmentId") || 1
        const response = await getRequest(`${GET_WARD_BY_DEPARTMENT}?departmentId=${deptId}`)
        if (response && response.response) {
          setWards(response.response)
          if (response.response.length > 0) {
            setSelectedWard(response.response[0])
          }
        }
      } catch (error) {
        console.error("Error fetching wards by department:", error)
      }
    }
    fetchWards()
  }, [])

  const fetchBeds = async () => {
    if (!selectedWard) return
    try {
      setLoadingBeds(true)
      const response = await getRequest(`${GET_WARD_WISE_DETAILS}/${selectedWard.wardId}`)
      if (response && response.response) {
        const mappedBeds = response.response.map((bed) => ({
          id: bed.bedId,
          bedNo: bed.bedNumber || `Bed-${bed.bedId}`,
          patientName: bed.patientName || "Vacant",
          ageGender: [bed.age, bed.gender].filter(Boolean).join("/") || "",
          admissionNo: bed.admissionNo || "",
          admissionDate: bed.admitDate || "",
          doctorName: bed.doctorName || "",
          from: "",
          days: bed.days || 0,
          currentDay: bed.days || 0,
          status: !bed.ipdInternalStatus || String(bed.ipdInternalStatus).trim().toUpperCase() === "VACANT"
            ? "VACANT"
            : (String(bed.ipdInternalStatus).trim().toUpperCase() === "RWD" ? "RW" : String(bed.ipdInternalStatus).trim().toUpperCase()),
          ward: selectedWard.wardName,
          diagnosis: "",
          admissionTime: "",
          patientId: bed.patientId,
          inpatientId: bed.ipdPatientId
        }))
        setPatientData(mappedBeds)
      } else {
        setPatientData([])
      }
    } catch (error) {
      console.error("Error fetching bed data:", error)
      setPatientData([])
    } finally {
      setLoadingBeds(false)
    }
  }

  useEffect(() => {
    fetchBeds()
  }, [selectedWard])

  // Added "IPD Initial Assessment" right after Clinical Dashboard
  const caseSheetTabs = [
    "Clinical Dashboard",
    "IPD Initial Assessment",          // <-- new tab
    "Doctor Visit / Case Notes",
    "Investigations / Orders",
    "Medication & Treatment (MAR)",
    "Vitals & Monitoring",
    "Nursing Care / Procedures",
    "Diet",
    "Bed Transfer",
    "Shift Handover",
    "Discharge"
  ]



  const stats = {
    vacantBeds: patientData.filter(p => p.status === 'VACANT').length,
    reportedToWard: patientData.filter(p => p.status === 'RW').length,
    transferPending: patientData.filter(p => p.status === 'TP').length,
    inOperationTheater: patientData.filter(p => p.status === 'OT').length,
    inLaborRoom: patientData.filter(p => p.status === 'LR').length,
    readyForDischarge: patientData.filter(p => p.status === 'RD').length,
    notReported: patientData.filter(p => p.status === 'NRW').length,
    totalBeds: patientData.length
  }

  const handlePatientSelect = (patient) => {
    if (patient.status === "VACANT") {
      return
    }
    if (patient.status === "NRW") {
      Swal.fire({
        title: "This patient not reported in ward",
        text: "Do you want to admit this patient?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Patient reported",
        cancelButtonText: "Cancel"
      }).then(async (result) => {
        if (result.isConfirmed) {
          if (!patient.inpatientId) {
            Swal.fire({
              title: "Error",
              text: "Inpatient Admission ID not found for this patient.",
              icon: "error"
            })
            return
          }
          try {
            const res = await putRequest(`${UPDATE_ADMISSION_INTERNAL_STATUS}/${patient.inpatientId}/${IPD_INTERNAL_STATUS_RWD}`, {})
            if (res && (res.status === 200 || res.status === 201)) {
              Swal.fire({
                title: "Success",
                text: "Patient reported to ward successfully.",
                icon: "success"
              })
              fetchBeds()
            } else {
              Swal.fire({
                title: "Error",
                text: res?.data?.message || "Failed to update patient status.",
                icon: "error"
              })
            }
          } catch (error) {
            console.error("Error updating patient status:", error)
            Swal.fire({
              title: "Error",
              text: "Something went wrong while reporting the patient.",
              icon: "error"
            })
          }
        }
      })
      return
    }
    setSelectedPatient(patient)
    setActiveTab("Clinical Dashboard")
  }

  const handleBackToCards = () => {
    setSelectedPatient(null)
  }

  const getBoxBackgroundColor = (status) => {
    switch (status) {
      case "VACANT": return "#d4edda"
      case "NRW": return "#f8d7da"
      case "RW": return "#cce5ff"
      case "TP": return "#fff3cd"
      case "OT": return "#d1ecf1"
      case "LR": return "#f8d7da"
      case "RD": return "#fff3cd"
      default: return "#f8f9fa"
    }
  }

  const getTextColor = () => "#212529"

  const getBorderColor = (status) => {
    switch (status) {
      case "VACANT": return "#28a745"
      case "NRW": return "#dc3545"
      case "RW": return "#007bff"
      case "TP": return "#fd7e14"
      case "OT": return "#17a2b8"
      case "LR": return "#e83e8c"
      case "RD": return "#ffc107"
      default: return "#6c757d"
    }
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "VACANT": return "success"
      case "NRW": return "danger"
      case "RW": return "primary"
      case "TP": return "warning"
      case "OT": return "info"
      case "LR": return "danger"
      case "RD": return "warning"
      default: return "secondary"
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case "VACANT": return "Vacant"
      case "NRW": return "Not Reported to Ward"
      case "RW": return "Reported to Ward"
      case "TP": return "Transferred Patient"
      case "OT": return "In Operation Theater"
      case "LR": return "In Labor Room"
      case "RD": return "Ready for Discharge"
      default: return status
    }
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <h4 className="card-title p-2 mb-0 me-3">WARD MANAGEMENT</h4>
                  {wards.length > 1 ? (
                    <select
                      className="form-select form-select-sm fw-bold text-dark"
                      style={{ width: "auto", minWidth: "200px", fontWeight: "700", borderColor: "#adb5bd" }}
                      value={selectedWard?.wardId || ""}
                      onChange={(e) => {
                        const ward = wards.find(w => w.wardId === Number(e.target.value))
                        setSelectedWard(ward)
                      }}
                    >
                      {wards.map((ward) => (
                        <option key={ward.wardId} value={ward.wardId} style={{ fontWeight: "normal" }}>
                          {ward.wardName ? ward.wardName.trim() : ""}
                        </option>
                      ))}
                    </select>
                  ) : wards.length === 1 ? (
                    <span className="badge bg-info text-dark fs-6 px-3 py-2 fw-bold" style={{ fontWeight: "700" }}>
                      {wards[0].wardName ? wards[0].wardName.trim() : ""}
                    </span>
                  ) : null}
                </div>
                {selectedPatient && (
                  <div className="flex-grow-1 d-flex justify-content-end">
                    <button className="btn btn-light btn-sm" onClick={handleBackToCards}>
                      <i className="fa fa-arrow-left me-1"></i> Nursing Home
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-2">
              {/* Summary Stats at Top */}
              {!selectedPatient && (
                <div className="row ">
                  <div className="col-12">
                    <div className="alert-primary p-1 rounded">
                      <div className="d-flex justify-content-around flex-wrap">
                        <div className="text-center px-3 py-1">
                          <div className="fw-bold fs-4 text-success">{stats.vacantBeds}</div>
                          <div className="small">Vacant Beds</div>
                        </div>
                        <div className="text-center px-3 py-1">
                          <div className="fw-bold fs-4 text-danger">{stats.notReported}</div>
                          <div className="small">Not Reported</div>
                        </div>
                        <div className="text-center px-3 py-1">
                          <div className="fw-bold fs-4 text-primary">{stats.reportedToWard}</div>
                          <div className="small">Reported to Ward</div>
                        </div>
                        <div className="text-center px-3 py-1">
                          <div className="fw-bold fs-4 text-warning">{stats.transferPending}</div>
                          <div className="small">Transfer Pending</div>
                        </div>
                        <div className="text-center px-3 py-1">
                          <div className="fw-bold fs-4 text-info">{stats.inOperationTheater}</div>
                          <div className="small">In Operation Theater</div>
                        </div>
                        <div className="text-center px-3 py-1">
                          <div className="fw-bold fs-4 text-danger">{stats.inLaborRoom}</div>
                          <div className="small">In Labor Room</div>
                        </div>
                        <div className="text-center px-3 py-1">
                          <div className="fw-bold fs-4 text-warning">{stats.readyForDischarge}</div>
                          <div className="small">Ready for Discharge</div>
                        </div>
                        <div className="text-center px-3 py-1">
                          <div className="fw-bold fs-4">{stats.totalBeds}</div>
                          <div className="small">Total Beds</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Content Area */}
              {!selectedPatient ? (
                <div className="cards-grid-container mt-2">
                  {loadingBeds ? (
                    <div className="d-flex justify-content-center align-items-center py-5 w-100" style={{ minHeight: "200px" }}>
                      <div className="text-center">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <div className="mt-2 text-muted fw-bold">Loading Beds...</div>
                      </div>
                    </div>
                  ) : (
                    <div className="row g-2">
                      {patientData.map((patient) => {
                        const isVacant = patient.status === "VACANT";
                        return (
                          <div key={patient.id} className="col-xxl col-xl col-lg col-md col-sm-6 col-6">
                            <div
                              className="card p-1"
                              style={{
                                minHeight: "140px",
                                cursor: isVacant ? "default" : "pointer",
                                transition: "all 0.3s ease",
                                backgroundColor: getBoxBackgroundColor(patient.status),
                                color: getTextColor(patient.status),
                                border: `2px solid ${getBorderColor(patient.status)}`,
                                borderRadius: "6px"
                              }}
                              onClick={() => !isVacant && handlePatientSelect(patient)}
                              onMouseEnter={(e) => {
                                if (!isVacant) {
                                  e.currentTarget.style.transform = 'translateY(-3px)'
                                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isVacant) {
                                  e.currentTarget.style.transform = 'translateY(0)'
                                  e.currentTarget.style.boxShadow = 'none'
                                }
                              }}
                            >
                              <div className="text-center mb-1">
                                <span className="badge bg-dark w-100" style={{ opacity: 0.9, fontSize: "0.7rem", padding: "0.2em 0.4em" }}>
                                  {patient.bedNo}
                                </span>
                              </div>
                              <div className="text-center mb-1">
                                <div className="fw-bold" style={{ fontSize: "0.8rem" }}>
                                  {patient.patientName}
                                  {patient.ageGender && (
                                    <span className="ms-1" style={{ fontSize: "0.7rem", opacity: 0.8 }}>
                                      ({patient.ageGender})
                                    </span>
                                  )}
                                </div>
                              </div>
                              {patient.admissionNo ? (
                                <div className="text-center mb-1">
                                  <div className="small fw-bold" style={{ fontSize: "0.65rem" }}>{patient.admissionNo}</div>
                                  {patient.admissionDate && (
                                    <div className="small" style={{ fontSize: "0.6rem", opacity: 0.8 }}>{patient.admissionDate}</div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center mb-1">
                                  <div className="small fw-bold" style={{ fontSize: "0.65rem" }}>-</div>
                                </div>
                              )}
                              {patient.doctorName && (
                                <div className="text-center mb-1">
                                  <div className="small text-truncate" style={{ fontSize: "0.6rem", opacity: 0.9 }}>{patient.doctorName}</div>
                                </div>
                              )}
                              {patient.currentDay > 0 && (
                                <div className="text-center">
                                  <span className="badge bg-dark" style={{ fontSize: "0.6rem", padding: "0.2em 0.5em" }}>
                                    DAY-{patient.currentDay}
                                  </span>
                                </div>
                              )}
                              <div className="text-center mt-1">
                                <span className={`badge bg-${getStatusBadgeColor(patient.status)} text-white`} style={{ fontSize: '0.6rem', padding: '0.2em 0.5em' }}>
                                  {patient.status === 'VACANT' ? 'VACANT' : patient.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Patient Details with Patient List Sidebar */
                <div className="row mt-0" style={{ marginLeft: 0, marginRight: 0 }}>
                  {/* Patient List Sidebar */}
                  {!isPatientListCollapsed ? (
                    <div className="col-md-1" style={{ paddingLeft: 0, paddingRight: 0 }}>
                      <div className="card mb-3 h-100" style={{ borderRadius: 0 }}>
                        <div className="card-header bg-light d-flex justify-content-between align-items-center py-2">
                          <h6 className="mb-0" style={{ fontSize: "0.9rem" }}>Patient list </h6>
                          <button
                            className="arrow icofont-rounded-down ms-auto text-end fs-6 collapse-arrow border-0 bg-transparent"
                            type="button"
                            aria-expanded={!isPatientListCollapsed}
                            onClick={() => setIsPatientListCollapsed(true)}
                            style={{ transform: 'rotate(0deg)', transition: 'transform 0.3s ease', padding: '0.1rem' }}
                          ></button>
                        </div>
                        <div className="card-body p-0" style={{ maxHeight: "500px", overflowY: "auto" }}>
                          {loadingBeds ? (
                            <div className="d-flex justify-content-center align-items-center py-4">
                              <div className="spinner-border spinner-border-sm text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            </div>
                          ) : (
                            <div className="list-group list-group-flush">
                              {patientData.map((patient) => {
                                const isVacant = patient.status === "VACANT";
                                return (
                                  <button
                                    key={patient.id}
                                    className={`list-group-item list-group-item-action ${selectedPatient?.id === patient.id ? 'active' : ''}`}
                                    onClick={() => !isVacant && handlePatientSelect(patient)}
                                    style={{ borderLeft: `2px solid ${getBorderColor(patient.status)}`, cursor: isVacant ? 'default' : 'pointer', borderRadius: 0 }}
                                    disabled={isVacant}
                                  >
                                    <div className="d-flex justify-content-between align-items-start">
                                      <div className="flex-grow-1">
                                        <div className="fw-bold" style={{ fontSize: "0.75rem", lineHeight: "1.2" }}>
                                          {patient.patientName}
                                        </div>
                                        {patient.doctorName && patient.status !== "VACANT" && (
                                          <div className="text-muted mt-1" style={{ fontSize: "0.6rem" }}>
                                            <i className="fa fa-stethoscope me-1"></i>
                                            {patient.doctorName.split(' ')[1] || patient.doctorName}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="col-auto d-flex align-items-start" style={{ paddingLeft: 0 }}>
                      <div className="d-flex align-items-center bg-light border mb-1">
                        <span className="me-2 fw-bold" style={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}>Patient List</span>
                        <button
                          className="collapse-toggle-collapsed arrow icofont-rounded-down ms-0 fs-6 border-0 bg-transparent"
                          type="button"
                          aria-expanded={false}
                          onClick={() => setIsPatientListCollapsed(false)}
                          style={{ transform: 'rotate(90deg)', transition: 'transform 0.3s ease' }}
                          title="Show Patient List"
                        ></button>
                      </div>
                    </div>
                  )}

                  {/* Patient Details */}
                  <div className={isPatientListCollapsed ? "col-md-12" : "col-md-11"} style={!isPatientListCollapsed ? { paddingLeft: 0, paddingRight: 0 } : {}}>
                    <div className="card" style={!isPatientListCollapsed ? { borderRadius: 0 } : {}}>
                      <div className="card-header bg-primary text-white">
                        <div className="d-flex justify-content-start align-items-center">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center gap-2 flex-shrink-0">
                              <h5 className="mb-0">{selectedPatient.patientName}</h5>
                              <div className="d-flex gap-3 align-items-center">
                                <div>
                                  <i className="fa fa-user-circle me-1" style={{ fontSize: '0.85rem' }}></i>
                                  <span style={{ fontSize: '0.8rem' }}>{selectedPatient.ageGender}</span>
                                </div>
                                <div>
                                  <i className="fa fa-clipboard me-1" style={{ fontSize: '0.85rem' }}></i>
                                  <span style={{ fontSize: '0.8rem' }}>{selectedPatient.admissionNo}</span>
                                </div>
                                <div>
                                  <i className="fa fa-calendar me-1" style={{ fontSize: '0.85rem' }}></i>
                                  <span style={{ fontSize: '0.8rem' }}>{selectedPatient.admissionDate} {selectedPatient.admissionTime}</span>
                                </div>
                                <div>
                                  <i className="fa fa-clock me-1" style={{ fontSize: '0.85rem' }}></i>
                                  <span style={{ fontSize: '0.8rem' }}>DAY {selectedPatient.currentDay}</span>
                                </div>
                                <div>
                                  <i className="fa fa-bed me-1" style={{ fontSize: '0.85rem' }}></i>
                                  <span style={{ fontSize: '0.8rem' }}>{selectedPatient.bedNo}</span>
                                </div>
                                <div>
                                  <i className="fa fa-stethoscope me-1" style={{ fontSize: '0.85rem' }}></i>
                                  <span style={{ fontSize: '0.8rem' }}>Dr: {selectedPatient.doctorName.split(' ')[1] || selectedPatient.doctorName}</span>
                                </div>
                                <div>
                                  <i className="fa fa-flask me-1" style={{ fontSize: '0.85rem' }}></i>
                                  <span style={{ fontSize: '0.8rem' }}>Dx: {selectedPatient.diagnosis || "Not specified"}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="">
                        {/* Case Sheet Tabs Bar */}
                        <div className="card mb-1">
                          <div className="card-body p-2">
                            <div className="d-flex flex-wrap gap-1">
                              {caseSheetTabs.map((tab) => (
                                <button
                                  key={tab}
                                  className={`btn btn-sm text-dark ${activeTab === tab ? 'btn-primary' : 'btn-outline-warning'}`}
                                  onClick={() => setActiveTab(tab)}
                                  style={{ fontSize: "0.55rem", whiteSpace: "nowrap" }}
                                >
                                  {tab}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Tab Content */}
                        <div className="">
                          <div className="card-header bg-light">
                            <h6 className="mb-0">{activeTab}</h6>
                          </div>
                          <div className="card-body">
                            {activeTab === "Clinical Dashboard" && (
                              <ClinicalDashboard selectedPatient={selectedPatient} />
                            )}

                            {/* New IPD Initial Assessment Tab */}
                            {activeTab === "IPD Initial Assessment" && (
                              <IPDInitialAssessment selectedPatient={selectedPatient} />
                            )}

                            {activeTab === "Medication & Treatment (MAR)" && (
                              < MedicationModule selectedPatient={selectedPatient} />
                            )}

                            {activeTab === "Doctor Visit / Case Notes" && (
                              <DoctorVisitCaseNotes selectedPatient={selectedPatient} />
                            )}

                            {activeTab === "Bed Transfer" && (
                              <BedTransfer selectedPatient={selectedPatient} />
                            )}

                            {activeTab === "Vitals & Monitoring" && (
                              <VitalsandMonitoring selectedPatient={selectedPatient} />
                            )}

                            {activeTab === "Investigations / Orders" && (
                              <InvestigationOrderandTracking selectedPatient={selectedPatient} />
                            )}

                            {activeTab === "Diet" && (
                              <DietOrderHistory selectedPatient={selectedPatient} />
                            )}

                            {activeTab === "Discharge" && (
                              <DischargeFromWard selectedPatient={selectedPatient} />
                            )}

                            {activeTab === "Nursing Care / Procedures" && (
                              <NursingCareModule selectedPatient={selectedPatient} />
                            )}

                            {/* Fallback for any undefined tabs (optional) */}
                            {activeTab !== "Clinical Dashboard" &&
                              activeTab !== "IPD Initial Assessment" &&
                              activeTab !== "Doctor Visit / Case Notes" &&
                              activeTab !== "Medication & Treatment (MAR)" &&
                              activeTab !== "Bed Transfer" &&
                              activeTab !== "Vitals & Monitoring" &&
                              activeTab !== "Investigations / Orders" &&
                              activeTab !== "Diet" &&
                              activeTab !== "Discharge" &&
                              activeTab !== "Nursing Care / Procedures" && (
                              <div>
                                <p>Content for {activeTab} will be displayed here.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Legend */}
              {!selectedPatient && (
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header bg-light">
                        <h6 className="mb-0">Ward Status Color Codes</h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="d-flex align-items-center gap-3 mb-2">
                              <div style={{ width: "20px", height: "20px", backgroundColor: "#d4edda", border: "2px solid #28a745", borderRadius: "4px" }}></div>
                              <span><strong>VACANT</strong> - Light Green with Green Border</span>
                            </div>
                            <div className="d-flex align-items-center gap-3 mb-2">
                              <div style={{ width: "20px", height: "20px", backgroundColor: "#f8d7da", border: "2px solid #dc3545", borderRadius: "4px" }}></div>
                              <span><strong>NRW</strong> - Not Reported to Ward</span>
                            </div>
                            <div className="d-flex align-items-center gap-3 mb-2">
                              <div style={{ width: "20px", height: "20px", backgroundColor: "#cce5ff", border: "2px solid #007bff", borderRadius: "4px" }}></div>
                              <span><strong>RW</strong> - Reported to Ward</span>
                            </div>
                            <div className="d-flex align-items-center gap-3 mb-2">
                              <div style={{ width: "20px", height: "20px", backgroundColor: "#fff3cd", border: "2px solid #fd7e14", borderRadius: "4px" }}></div>
                              <span><strong>TP</strong> - Transferred Patient</span>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="d-flex align-items-center gap-3 mb-2">
                              <div style={{ width: "20px", height: "20px", backgroundColor: "#d1ecf1", border: "2px solid #17a2b8", borderRadius: "4px" }}></div>
                              <span><strong>OT</strong> - In Operation Theater</span>
                            </div>
                            <div className="d-flex align-items-center gap-3 mb-2">
                              <div style={{ width: "20px", height: "20px", backgroundColor: "#f8d7da", border: "2px solid #e83e8c", borderRadius: "4px" }}></div>
                              <span><strong>LR</strong> - In Labor Room</span>
                            </div>
                            <div className="d-flex align-items-center gap-3 mb-2">
                              <div style={{ width: "20px", height: "20px", backgroundColor: "#fff3cd", border: "2px solid #ffc107", borderRadius: "4px" }}></div>
                              <span><strong>RD</strong> - Ready for Discharge</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          .col-xxl, .col-xl, .col-lg, .col-md {
            flex: 0 0 20%;
            max-width: 20%;
          }
        }
        @media (max-width: 767px) {
          .col-sm-6 {
            flex: 0 0 50%;
            max-width: 50%;
          }
        }
        .list-group-item.active {
          background-color: #e7f1ff;
          color: #0d6efd;
          border-color: #0d6efd;
        }
        .collapse-toggle-collapsed {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 4px;
          cursor: pointer;
        }
        .icofont-rounded-down::before {
          content: "▼";
          font-family: Arial, sans-serif;
          font-size: 12px;
        }
      `}</style>
    </div>
  )
}

export default WardManagement