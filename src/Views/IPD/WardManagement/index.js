"use client"

import { useState } from "react"

const WardManagement = () => {
  const [filters, setFilters] = useState({
    month: "December",
    year: "2020",
    ward: "select",
  })

  const [selectedPatient, setSelectedPatient] = useState(null)
  const [activeTab, setActiveTab] = useState("CASE SHEET")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 14 // 7 boxes per row × 2 rows

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  const years = ["2019", "2020", "2021", "2022", "2023", "2024"]
  const wardTypes = ["select", "ICU", "General Ward I", "General Ward II", "Isolation Ward", "All Wards"]

  // Case Sheet Tabs
  const caseSheetTabs = [
    "CASE SHEET",
    "LINEN MANAGEMENT",
    "MEDICINE ISSUE",
    "NURSING CARE SETUP",
    "NURSING ENTRY",
    "DIET ENTRY",
    "CLINICAL ENTRY",
    "INTAKE OUTPUT",
    "BED/CARE TRANSFER",
    "SIL/DIL",
    "DISCHARGE SLIP"
  ]

  // Patient data with the exact format from your images
  const patientData = [
  {
    id: 1,
    bedNo: "GW-03",
    patientName: "RAMESH KUMAR",
    ageGender: "54/M",
    admissionNo: "AD/101/01/2021-2022",
    admissionDate: "05/01/2021",
    doctorName: "Dr. ANITA SHARMA",
    from: "DR. ANITA SHARMA /OPD",
    days: 4,
    status: "NRW", // Changed to NRW for red color
    ward: "General Ward I",
  },
  {
    id: 2,
    bedNo: "GW-04",
    patientName: "SUNITA DEVI",
    ageGender: "48/F",
    admissionNo: "AD/102/01/2021-2022",
    admissionDate: "06/01/2021",
    doctorName: "Dr. RAHUL VERMA",
    from: "DR. RAHUL VERMA /OPD",
    days: 2,
    status: "RW", // Orange
    ward: "General Ward I",
  },
  {
    id: 3,
    bedNo: "ICU-01",
    patientName: "MOHAN LAL",
    ageGender: "62/M",
    admissionNo: "AD/103/01/2021-2022",
    admissionDate: "02/01/2021",
    doctorName: "Dr. PRIYA MENON",
    from: "DR. PRIYA MENON /ICU/1",
    days: 7,
    status: "TP", // Sky Blue
    ward: "ICU",
  },
  {
    id: 4,
    bedNo: "ISO-04",
    patientName: "ANJALI SINGH",
    ageGender: "35/F",
    admissionNo: "AD/104/01/2021-2022",
    admissionDate: "07/01/2021",
    doctorName: "Dr. KAVITA NAIR",
    from: "DR. KAVITA NAIR /ISOLATION/4",
    days: 1,
    status: "OT", // Blue
    ward: "Isolation Ward",
  },
  {
    id: 5,
    bedNo: "GWII-02",
    patientName: "ARJUN PATEL",
    ageGender: "29/M",
    admissionNo: "AD/105/01/2021-2022",
    admissionDate: "03/01/2021",
    doctorName: "Dr. AMIT GUPTA",
    from: "DR. AMIT GUPTA /GWII/2",
    days: 5,
    status: "LR", // Pink
    ward: "General Ward II",
  },
  {
    id: 6,
    bedNo: "ICU-03",
    patientName: "MEENA RANI",
    ageGender: "58/F",
    admissionNo: "AD/106/01/2021-2022",
    admissionDate: "01/01/2021",
    doctorName: "Dr. PRIYA MENON",
    from: "DR. PRIYA MENON /ICU/3",
    days: 9,
    status: "RD", // Yellow
    ward: "ICU",
  },
  {
    id: 7,
    bedNo: "GWII-05",
    patientName: "SURESH NAIDU",
    ageGender: "46/M",
    admissionNo: "AD/107/01/2021-2022",
    admissionDate: "08/01/2021",
    doctorName: "Dr. RAHUL VERMA",
    from: "DR. RAHUL VERMA /GWII/5",
    days: 1,
    status: "RW", // Orange
    ward: "General Ward II",
  },
  {
    id: 8,
    bedNo: "GWII-06",
    patientName: "KAVYA REDDY",
    ageGender: "32/F",
    admissionNo: "AD/108/01/2021-2022",
    admissionDate: "06/01/2021",
    doctorName: "Dr. KAVITA NAIR",
    from: "DR. KAVITA NAIR /GWII/6",
    days: 3,
    status: "NRW", // Red
    ward: "General Ward II",
  },
  {
    id: 9,
    bedNo: "GWI-10",
    patientName: "RAJENDRA PRASAD",
    ageGender: "44/M",
    admissionNo: "AD/109/01/2021-2022",
    admissionDate: "09/01/2021",
    doctorName: "Dr. ANITA SHARMA",
    from: "",
    days: 1,
    status: "TP", // Sky Blue
    ward: "General Ward I",
  },
  {
    id: 10,
    bedNo: "GWII-08",
    patientName: "FAROOQ AHMED",
    ageGender: "51/M",
    admissionNo: "AD/110/01/2021-2022",
    admissionDate: "10/01/2021",
    doctorName: "Dr. AMIT GUPTA",
    from: "DR. AMIT GUPTA /GWII/8",
    days: 1,
    status: "OT", // Blue
    ward: "General Ward II",
  },
  {
    id: 11,
    bedNo: "GW-16",
    patientName: "Vacant",
    ageGender: "",
    admissionNo: "",
    admissionDate: "",
    doctorName: "",
    from: "",
    days: 0,
    status: "VACANT", // Green
    ward: "General Ward I",
  },
  {
    id: 12,
    bedNo: "GW-17",
    patientName: "Vacant",
    ageGender: "",
    admissionNo: "",
    admissionDate: "",
    doctorName: "",
    from: "",
    days: 0,
    status: "VACANT", // Green
    ward: "General Ward I",
  },
  {
    id: 13,
    bedNo: "GW-18",
    patientName: "Vacant",
    ageGender: "",
    admissionNo: "",
    admissionDate: "",
    doctorName: "",
    from: "",
    days: 0,
    status: "VACANT", // Green
    ward: "General Ward I",
  },
  {
    id: 14,
    bedNo: "GW-19",
    patientName: "Vacant",
    ageGender: "",
    admissionNo: "",
    admissionDate: "",
    doctorName: "",
    from: "",
    days: 0,
    status: "VACANT", // Green
    ward: "General Ward I",
  }
];


  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }))
    setCurrentPage(1)
  }

  const handleSearch = () => {
    console.log("Searching with filters:", filters)
  }

  const handleReset = () => {
    setFilters({
      month: "December",
      year: "2020",
      ward: "select",
    })
    setCurrentPage(1)
  }

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient)
    setActiveTab("CASE SHEET")
  }

  // NEW: Get complete box background color based on status
  const getBoxBackgroundColor = (status) => {
    switch (status) {
      case "VACANT":
        return "#d4edda" // Light Green
      case "NRW":
        return "#f8d7da" // Light Red
      case "RW":
        return "#fff3cd" // Light Orange
      case "TP":
        return "#d1ecf1" // Light Sky Blue
      case "OT":
        return "#cce5ff" // Light Blue
      case "LR":
        return "#f8d7e6" // Light Pink
      case "RD":
        return "#fff3cd" // Light Yellow (same as RW)
      default:
        return "#f8f9fa" // Default Light Gray
    }
  }

  // NEW: Get text color based on status (for better contrast)
  const getTextColor = (status) => {
    return "#212529" // Dark color for all for better readability
  }

  // NEW: Get border color based on status
  const getBorderColor = (status) => {
    switch (status) {
      case "VACANT":
        return "#28a745" // Green
      case "NRW":
        return "#dc3545" // Red
      case "RW":
        return "#fd7e14" // Orange
      case "TP":
        return "#17a2b8" // Sky Blue
      case "OT":
        return "#007bff" // Blue
      case "LR":
        return "#e83e8c" // Pink
      case "RD":
        return "#ffc107" // Yellow
      default:
        return "#6c757d" // Gray
    }
  }

  // NEW: Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "VACANT":
        return "success" // Green
      case "NRW":
        return "danger" // Red
      case "RW":
        return "warning" // Orange
      case "TP":
        return "info" // Sky Blue
      case "OT":
        return "primary" // Blue
      case "LR":
        return "pink" // Will use custom class
      case "RD":
        return "warning" // Yellow (same as RW)
      default:
        return "secondary"
    }
  }

  // NEW: Get status label text
  const getStatusLabel = (status) => {
    switch (status) {
      case "VACANT":
        return "Vacant"
      case "NRW":
        return "Not Reported to Ward"
      case "RW":
        return "Reported to Ward"
      case "TP":
        return "Transferred Patient"
      case "OT":
        return "In Operation Theater"
      case "LR":
        return "In Labor Room"
      case "RD":
        return "Ready for Discharge"
      default:
        return status
    }
  }

  // Generate day indicators
  const renderDayIndicators = (days) => {
    const dayIndicators = []
    for (let i = 1; i <= Math.min(days, 3); i++) {
      dayIndicators.push(
        <span key={i} className={`badge ${i === days ? 'bg-dark' : 'bg-light text-dark border'} me-1`}>
          DAY-{i}
        </span>
      )
    }
    return dayIndicators
  }

  // Pagination logic
  const totalPages = Math.ceil(patientData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = patientData.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const exportToExcel = () => {
    console.log("Exporting to Excel...")
  }

  const exportToPDF = () => {
    console.log("Exporting to PDF...")
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">WARD MANAGEMENT</h4>
                <div className="d-flex gap-2">
                  <button className="btn btn-success btn-sm" onClick={exportToExcel}>
                    <i className="fa fa-file-excel me-1"></i> Excel
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={exportToPDF}>
                    <i className="fa fa-file-pdf me-1"></i> PDF
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              {/* Filter Section */}
              <div className="card mb-3">
                <div className="card-body">
                  <div className="row g-3 align-items-end">
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Month*</label>
                      <select
                        className="form-select"
                        value={filters.month}
                        onChange={(e) => handleFilterChange("month", e.target.value)}
                      >
                        {months.map((month) => (
                          <option key={month} value={month}>
                            {month}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Year*</label>
                      <select
                        className="form-select"
                        value={filters.year}
                        onChange={(e) => handleFilterChange("year", e.target.value)}
                      >
                        {years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Ward*</label>
                      <select
                        className="form-select"
                        value={filters.ward}
                        onChange={(e) => handleFilterChange("ward", e.target.value)}
                      >
                        {wardTypes.map((ward) => (
                          <option key={ward} value={ward}>
                            {ward}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="row mt-3">
                    <div className="col-12 d-flex justify-content-center gap-3">
                      <button type="button" className="btn btn-primary px-4" onClick={handleSearch}>
                        <i className="fa fa-search me-1"></i> SEARCH
                      </button>
                      <button type="button" className="btn btn-secondary px-4" onClick={handleReset}>
                        <i className="fa fa-redo me-1"></i> RESET
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Case Sheet Tabs Bar */}
              {selectedPatient && (
                <div className="card mb-3">
                  <div className="card-body p-2">
                    <div className="d-flex flex-wrap gap-1">
                      {caseSheetTabs.map((tab) => (
                        <button
                          key={tab}
                          className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-outline-primary'} px-3 py-2`}
                          onClick={() => setActiveTab(tab)}
                          style={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Selected Patient Details */}
              {selectedPatient && (
                <div className="card mb-3">
                  <div className="card-header bg-primary text-white">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Patient Details - {selectedPatient.patientName}</h5>
                      <div>
                        <span className={`badge bg-${getStatusBadgeColor(selectedPatient.status)}`}>
                          {selectedPatient.status} - {getStatusLabel(selectedPatient.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="row mb-3">
                          <div className="col-4 fw-bold">Bed No:</div>
                          <div className="col-8">{selectedPatient.bedNo}</div>
                        </div>
                        <div className="row mb-3">
                          <div className="col-4 fw-bold">Patient:</div>
                          <div className="col-8">{selectedPatient.patientName} ({selectedPatient.ageGender})</div>
                        </div>
                        <div className="row mb-3">
                          <div className="col-4 fw-bold">Admission:</div>
                          <div className="col-8">{selectedPatient.admissionNo} - {selectedPatient.admissionDate}</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="row mb-3">
                          <div className="col-4 fw-bold">Doctor:</div>
                          <div className="col-8">{selectedPatient.doctorName}</div>
                        </div>
                        <div className="row mb-3">
                          <div className="col-4 fw-bold">Ward:</div>
                          <div className="col-8">{selectedPatient.ward}</div>
                        </div>
                        <div className="row mb-3">
                          <div className="col-4 fw-bold">From:</div>
                          <div className="col-8">{selectedPatient.from || "Direct Admission"}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Tab Content */}
                    <div className="card mt-3">
                      <div className="card-header bg-light">
                        <h6 className="mb-0">{activeTab}</h6>
                      </div>
                      <div className="card-body">
                        {activeTab === "CASE SHEET" && (
                          <div>
                            <p>Case sheet details for <strong>{selectedPatient.patientName}</strong></p>
                            <p>Admission: {selectedPatient.admissionNo} on {selectedPatient.admissionDate}</p>
                            <p>Doctor: {selectedPatient.doctorName}</p>
                            <p>Bed: {selectedPatient.bedNo}</p>
                          </div>
                        )}
                        {activeTab === "MEDICINE ISSUE" && (
                          <div>
                            <h6>Medicine Issue for {selectedPatient.patientName}</h6>
                            <p>Medicine records and prescriptions will be displayed here.</p>
                          </div>
                        )}
                        {activeTab === "LINEN MANAGEMENT" && (
                          <div>
                            <h6>Linen Management for {selectedPatient.patientName}</h6>
                            <p>Linen usage and requirements will be displayed here.</p>
                          </div>
                        )}
                        {activeTab === "NURSING CARE SETUP" && (
                          <div>
                            <h6>Nursing Care Setup for {selectedPatient.patientName}</h6>
                            <p>Nursing care plans and schedules will be displayed here.</p>
                          </div>
                        )}
                        {/* Add other tab contents as needed */}
                        <div className="mt-3">
                          <button className="btn btn-primary me-2">Save Changes</button>
                          <button className="btn btn-secondary">Cancel</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Patient Cards Grid - 7 boxes per row */}
              <div className="cards-grid-container">
                <div className="row g-2">
                  {currentData.map((patient) => (
                    <div key={patient.id} className="col-xxl-3 col-xl-3 col-lg-3 col-md-3 col-sm-4 col-6">
                      <div 
                        className={`card p-2 ${selectedPatient?.id === patient.id ? 'border border-dark border-2' : ''}`}
                        style={{ 
                          minHeight: "180px",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          backgroundColor: getBoxBackgroundColor(patient.status),
                          color: getTextColor(patient.status),
                          border: `2px solid ${getBorderColor(patient.status)}`,
                          borderRadius: "8px"
                        }}
                        onClick={() => handlePatientSelect(patient)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-5px)'
                          e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        {/* 1. Bed Number */}
                        <div className="text-center mb-1">
                          <span className="badge bg-dark w-100" style={{ opacity: 0.9 }}>
                            {patient.bedNo}
                          </span>
                        </div>
                        
                        {/* 2. Patient Name + Age/Gender */}
                        <div className="text-center mb-2">
                          <div className="fw-bold" style={{ fontSize: "0.9rem" }}>
                            {patient.patientName}
                          </div>
                          {patient.ageGender && (
                            <div className="small" style={{ opacity: 0.8 }}>
                              {patient.ageGender}
                            </div>
                          )}
                        </div>
                        
                        {/* 3. Admission No + Date */}
                        {patient.admissionNo ? (
                          <div className="text-center mb-2">
                            <div className="small fw-bold">
                              {patient.admissionNo}
                            </div>
                            {patient.admissionDate && (
                              <div className="small" style={{ opacity: 0.8 }}>
                                {patient.admissionDate}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center mb-2">
                            <div className="small fw-bold">
                              -
                            </div>
                          </div>
                        )}
                        
                        {/* 4. Doctor Name */}
                        {patient.doctorName && (
                          <div className="text-center mb-2">
                            <div className="small text-truncate" style={{ fontSize: "0.75rem", opacity: 0.9 }}>
                              {patient.doctorName}
                            </div>
                          </div>
                        )}
                        
                        {/* 5. DAY Indicators */}
                        {patient.days > 0 && (
                          <div className="text-center">
                            {renderDayIndicators(patient.days)}
                          </div>
                        )}
                        
                        {/* Status Badge at bottom */}
                        <div className="text-center mt-2">
                          <span 
                            className={`badge ${patient.status === 'LR' ? 'bg-pink' : `bg-${getStatusBadgeColor(patient.status)}`} text-white`}
                            style={{ 
                              backgroundColor: patient.status === 'LR' ? '#e83e8c' : '',
                              fontSize: '0.75rem',
                              padding: '0.25em 0.6em'
                            }}
                          >
                            {patient.status === 'VACANT' ? 'VACANT' : patient.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination Controls */}
              <div className="d-flex justify-content-center mt-4">
                <nav aria-label="Page navigation">
                  <ul className="pagination">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(currentPage - 1)}
                      >
                        <i className="fa fa-chevron-left"></i>
                      </button>
                    </li>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </button>
                        </li>
                      );
                    })}
                    
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(currentPage + 1)}
                      >
                        <i className="fa fa-chevron-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>

              {/* Status Legend */}
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
                            <div 
                              style={{
                                width: "20px",
                                height: "20px",
                                backgroundColor: "#d4edda",
                                border: "2px solid #28a745",
                                borderRadius: "4px"
                              }}
                            ></div>
                            <span><strong>VACANT</strong> - Green</span>
                          </div>
                          <div className="d-flex align-items-center gap-3 mb-2">
                            <div 
                              style={{
                                width: "20px",
                                height: "20px",
                                backgroundColor: "#f8d7da",
                                border: "2px solid #dc3545",
                                borderRadius: "4px"
                              }}
                            ></div>
                            <span><strong>NRW</strong> - Not Reported to Ward (Red)</span>
                          </div>
                          <div className="d-flex align-items-center gap-3 mb-2">
                            <div 
                              style={{
                                width: "20px",
                                height: "20px",
                                backgroundColor: "#fff3cd",
                                border: "2px solid #fd7e14",
                                borderRadius: "4px"
                              }}
                            ></div>
                            <span><strong>RW</strong> - Reported to Ward (Orange)</span>
                          </div>
                          <div className="d-flex align-items-center gap-3 mb-2">
                            <div 
                              style={{
                                width: "20px",
                                height: "20px",
                                backgroundColor: "#d1ecf1",
                                border: "2px solid #17a2b8",
                                borderRadius: "4px"
                              }}
                            ></div>
                            <span><strong>TP</strong> - Transferred Patient (Sky Blue)</span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex align-items-center gap-3 mb-2">
                            <div 
                              style={{
                                width: "20px",
                                height: "20px",
                                backgroundColor: "#cce5ff",
                                border: "2px solid #007bff",
                                borderRadius: "4px"
                              }}
                            ></div>
                            <span><strong>OT</strong> - In Operation Theater (Blue)</span>
                          </div>
                          <div className="d-flex align-items-center gap-3 mb-2">
                            <div 
                              style={{
                                width: "20px",
                                height: "20px",
                                backgroundColor: "#f8d7e6",
                                border: "2px solid #e83e8c",
                                borderRadius: "4px"
                              }}
                            ></div>
                            <span><strong>LR</strong> - In Labor Room (Pink)</span>
                          </div>
                          <div className="d-flex align-items-center gap-3 mb-2">
                            <div 
                              style={{
                                width: "20px",
                                height: "20px",
                                backgroundColor: "#fff3cd",
                                border: "2px solid #ffc107",
                                borderRadius: "4px"
                              }}
                            ></div>
                            <span><strong>RD</strong> - Ready for Discharge (Yellow)</span>
                          </div>
                          <div className="d-flex align-items-center gap-3 mb-2">
                            <div 
                              style={{
                                width: "20px",
                                height: "20px",
                                backgroundColor: "#f8f9fa",
                                border: "2px solid #6c757d",
                                borderRadius: "4px"
                              }}
                            ></div>
                            <span><strong>SELECTED</strong> - Dark Border</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="row mt-3">
                <div className="col-12">
                  <div className="alert alert-info p-3">
                    <div className="d-flex justify-content-around flex-wrap">
                      <div className="text-center px-3">
                        <div className="fw-bold fs-4">{patientData.filter(p => p.status === 'VACANT').length}</div>
                        <div className="small">Vacant Beds</div>
                      </div>
                      <div className="text-center px-3">
                        <div className="fw-bold fs-4">{patientData.filter(p => p.status === 'RW').length}</div>
                        <div className="small">Reported to Ward</div>
                      </div>
                      <div className="text-center px-3">
                        <div className="fw-bold fs-4">{patientData.filter(p => p.status === 'TP').length}</div>
                        <div className="small">Transfer Pending</div>
                      </div>
                      <div className="text-center px-3">
                        <div className="fw-bold fs-4">{patientData.filter(p => p.status === 'OT').length}</div>
                        <div className="small">In Operation Theater</div>
                      </div>
                      <div className="text-center px-3">
                        <div className="fw-bold fs-4">{patientData.filter(p => p.status === 'LR').length}</div>
                        <div className="small">In Labor Room</div>
                      </div>
                      <div className="text-center px-3">
                        <div className="fw-bold fs-4">{patientData.filter(p => p.status === 'RD').length}</div>
                        <div className="small">Ready for Discharge</div>
                      </div>
                      <div className="text-center px-3">
                        <div className="fw-bold fs-4">{patientData.filter(p => p.status === 'NRW').length}</div>
                        <div className="small">Not Reported</div>
                      </div>
                      <div className="text-center px-3">
                        <div className="fw-bold fs-4">{patientData.length}</div>
                        <div className="small">Total Beds</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add custom CSS for pink badge */}
      <style jsx>{`
        .bg-pink {
          background-color: #e83e8c !important;
        }
      `}</style>
    </div>
  )
}

export default WardManagement