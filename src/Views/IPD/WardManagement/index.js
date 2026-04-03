import { useState } from "react"
import DoctorVisitCaseNotes from "../DoctorVisitCaseNotes"
import ClinicalDashboard from "../ClinicalDashboard"
import BedTransfer from "../BedTransfer"
import VitalsandMonitoring from "../VitalsandMonitoring"

const WardManagement = () => {
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [activeTab, setActiveTab] = useState("Clinical Dashboard")
  const [showPatientList, setShowPatientList] = useState(true)
  const [isPatientListCollapsed, setIsPatientListCollapsed] = useState(false)

  const caseSheetTabs = [
    "Clinical Dashboard",
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

  // Patient data
  const patientData = [
    { id: 1, bedNo: "GW-03", patientName: "RAMESH KUMAR", ageGender: "54/M", admissionNo: "AD/101/01/2021-2022", admissionDate: "05/01/2021", doctorName: "Dr. ANITA SHARMA", from: "DR. ANITA SHARMA /OPD", days: 4, currentDay: 4, status: "NRW", ward: "General Ward I", diagnosis: "Hypertension", admissionTime: "09:30 AM" },
    { id: 2, bedNo: "GW-04", patientName: "SUNITA DEVI", ageGender: "48/F", admissionNo: "AD/102/01/2021-2022", admissionDate: "06/01/2021", doctorName: "Dr. RAHUL VERMA", from: "DR. RAHUL VERMA /OPD", days: 2, currentDay: 2, status: "RW", ward: "General Ward I", diagnosis: "Diabetes Type 2", admissionTime: "11:15 AM" },
    { id: 3, bedNo: "ICU-01", patientName: "MOHAN LAL", ageGender: "62/M", admissionNo: "AD/103/01/2021-2022", admissionDate: "02/01/2021", doctorName: "Dr. PRIYA MENON", from: "DR. PRIYA MENON /ICU/1", days: 7, currentDay: 7, status: "TP", ward: "ICU", diagnosis: "Pneumonia", admissionTime: "08:45 AM" },
    { id: 4, bedNo: "ISO-04", patientName: "ANJALI SINGH", ageGender: "35/F", admissionNo: "AD/104/01/2021-2022", admissionDate: "07/01/2021", doctorName: "Dr. KAVITA NAIR", from: "DR. KAVITA NAIR /ISOLATION/4", days: 1, currentDay: 1, status: "OT", ward: "Isolation Ward", diagnosis: "COVID-19", admissionTime: "02:20 PM" },
    { id: 5, bedNo: "GWII-02", patientName: "ARJUN PATEL", ageGender: "29/M", admissionNo: "AD/105/01/2021-2022", admissionDate: "03/01/2021", doctorName: "Dr. AMIT GUPTA", from: "DR. AMIT GUPTA /GWII/2", days: 5, currentDay: 5, status: "LR", ward: "General Ward II", diagnosis: "Fracture", admissionTime: "10:00 AM" },
    { id: 6, bedNo: "ICU-03", patientName: "MEENA RANI", ageGender: "58/F", admissionNo: "AD/106/01/2021-2022", admissionDate: "01/01/2021", doctorName: "Dr. PRIYA MENON", from: "DR. PRIYA MENON /ICU/3", days: 9, currentDay: 9, status: "RD", ward: "ICU", diagnosis: "Heart Disease", admissionTime: "07:30 AM" },
    { id: 7, bedNo: "GWII-05", patientName: "SURESH NAIDU", ageGender: "46/M", admissionNo: "AD/107/01/2021-2022", admissionDate: "08/01/2021", doctorName: "Dr. RAHUL VERMA", from: "DR. RAHUL VERMA /GWII/5", days: 1, currentDay: 1, status: "RW", ward: "General Ward II", diagnosis: "Asthma", admissionTime: "03:45 PM" },
    { id: 8, bedNo: "GWII-06", patientName: "KAVYA REDDY", ageGender: "32/F", admissionNo: "AD/108/01/2021-2022", admissionDate: "06/01/2021", doctorName: "Dr. KAVITA NAIR", from: "DR. KAVITA NAIR /GWII/6", days: 3, currentDay: 3, status: "NRW", ward: "General Ward II", diagnosis: "Typhoid", admissionTime: "12:00 PM" },
    { id: 9, bedNo: "GWI-10", patientName: "RAJENDRA PRASAD", ageGender: "44/M", admissionNo: "AD/109/01/2021-2022", admissionDate: "09/01/2021", doctorName: "Dr. ANITA SHARMA", from: "", days: 1, currentDay: 1, status: "TP", ward: "General Ward I", diagnosis: "Gastroenteritis", admissionTime: "09:15 AM" },
    { id: 10, bedNo: "GWII-08", patientName: "FAROOQ AHMED", ageGender: "51/M", admissionNo: "AD/110/01/2021-2022", admissionDate: "10/01/2021", doctorName: "Dr. AMIT GUPTA", from: "DR. AMIT GUPTA /GWII/8", days: 1, currentDay: 1, status: "OT", ward: "General Ward II", diagnosis: "Appendicitis", admissionTime: "04:30 PM" },
    { id: 11, bedNo: "GW-16", patientName: "Vacant", ageGender: "", admissionNo: "", admissionDate: "", doctorName: "", from: "", days: 0, currentDay: 0, status: "VACANT", ward: "General Ward I", diagnosis: "", admissionTime: "" },
    { id: 12, bedNo: "GW-17", patientName: "Vacant", ageGender: "", admissionNo: "", admissionDate: "", doctorName: "", from: "", days: 0, currentDay: 0, status: "VACANT", ward: "General Ward I", diagnosis: "", admissionTime: "" },
    { id: 13, bedNo: "GW-18", patientName: "Vacant", ageGender: "", admissionNo: "", admissionDate: "", doctorName: "", from: "", days: 0, currentDay: 0, status: "VACANT", ward: "General Ward I", diagnosis: "", admissionTime: "" },
    { id: 14, bedNo: "GW-19", patientName: "Vacant", ageGender: "", admissionNo: "", admissionDate: "", doctorName: "", from: "", days: 0, currentDay: 0, status: "VACANT", ward: "General Ward I", diagnosis: "", admissionTime: "" },
    { id: 15, bedNo: "GW-20", patientName: "VIPIN SHARMA", ageGender: "38/M", admissionNo: "AD/111/01/2021-2022", admissionDate: "04/01/2021", doctorName: "Dr. ANITA SHARMA", from: "DR. ANITA SHARMA /OPD", days: 6, currentDay: 6, status: "TP", ward: "General Ward I", diagnosis: "Kidney Stones", admissionTime: "01:45 PM" },
    { id: 16, bedNo: "GW-21", patientName: "PRIYANKA MEHTA", ageGender: "27/F", admissionNo: "AD/112/01/2021-2022", admissionDate: "11/01/2021", doctorName: "Dr. RAHUL VERMA", from: "DR. RAHUL VERMA /OPD", days: 1, currentDay: 1, status: "RW", ward: "General Ward I", diagnosis: "Migraine", admissionTime: "11:30 AM" },
    { id: 17, bedNo: "GW-22", patientName: "ANIL KAPOOR", ageGender: "60/M", admissionNo: "AD/113/01/2021-2022", admissionDate: "12/01/2021", doctorName: "Dr. PRIYA MENON", from: "DR. PRIYA MENON /ICU/1", days: 1, currentDay: 1, status: "RD", ward: "General Ward I", diagnosis: "COPD", admissionTime: "08:00 AM" },
    { id: 18, bedNo: "GW-23", patientName: "RITU VERMA", ageGender: "41/F", admissionNo: "AD/114/01/2021-2022", admissionDate: "10/01/2021", doctorName: "Dr. KAVITA NAIR", from: "DR. KAVITA NAIR /ISOLATION/4", days: 3, currentDay: 3, status: "LR", ward: "General Ward I", diagnosis: "Pregnancy", admissionTime: "06:15 AM" },
    { id: 19, bedNo: "GW-24", patientName: "Vacant", ageGender: "", admissionNo: "", admissionDate: "", doctorName: "", from: "", days: 0, currentDay: 0, status: "VACANT", ward: "General Ward I", diagnosis: "", admissionTime: "" },
    { id: 20, bedNo: "GW-25", patientName: "Vacant", ageGender: "", admissionNo: "", admissionDate: "", doctorName: "", from: "", days: 0, currentDay: 0, status: "VACANT", ward: "General Ward I", diagnosis: "", admissionTime: "" }
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
                <h4 className="card-title p-2 mb-0">WARD MANAGEMENT</h4>
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
                  <div className="row g-2">
                    {patientData.map((patient) => (
                      <div key={patient.id} className="col-xxl col-xl col-lg col-md col-sm-6 col-6">
                        <div
                          className="card p-1"
                          style={{
                            minHeight: "140px",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            backgroundColor: getBoxBackgroundColor(patient.status),
                            color: getTextColor(patient.status),
                            border: `2px solid ${getBorderColor(patient.status)}`,
                            borderRadius: "6px"
                          }}
                          onClick={() => handlePatientSelect(patient)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px)'
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = 'none'
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
                    ))}
                  </div>
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
                          <div className="list-group list-group-flush">
                            {patientData.map((patient) => (
                              <button
                                key={patient.id}
                                className={`list-group-item list-group-item-action ${selectedPatient?.id === patient.id ? 'active' : ''}`}
                                onClick={() => handlePatientSelect(patient)}
                                style={{ borderLeft: `2px solid ${getBorderColor(patient.status)}`, cursor: 'pointer', borderRadius: 0 }}
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
                            ))}
                          </div>
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

                      <div className="card-body">
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
                        <div className="card mt-1">
                          <div className="card-header bg-light">
                            <h6 className="mb-0">{activeTab}</h6>
                          </div>
                          <div className="card-body">
                            {activeTab === "Clinical Dashboard" && (
                              <ClinicalDashboard selectedPatient={selectedPatient} />
                            )}

                            {activeTab === "Doctor Visit / Case Notes" && (
                              <DoctorVisitCaseNotes selectedPatient={selectedPatient} />
                            )}

                            {activeTab === "Bed Transfer" && (
                              <BedTransfer selectedPatient={selectedPatient} />
)} 

{activeTab ==="Vitals & Monitoring" && (
  <VitalsandMonitoring selectedPatient={selectedPatient}/>
)}

                            {activeTab !== "Clinical Dashboard" && activeTab !== "Doctor Visit / Case Notes" && (
                              <div>
                               
                               
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