import { useState, useMemo, useEffect } from "react";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../../Components/Pagination";
import LoadingScreen from "../../../../Components/Loading";
// No extra imports – all data is dummy

// ---------- DUMMY DATA (with dischargeDate added) ----------
const dummyAdmissions = [
  {
    admissionNo: "IPD-1001",
    patientName: "Ravi Kumar",
    uhid: "UH-12345",
    age: 45,
    gender: "Male",
    mobileNo: "9876543210",
    admissionDateTime: "2026-07-15T10:30:00",
    dischargeDate: "2026-07-20T10:00:00",
    ward: "Ward A",
    room: "101",
    bed: "1",
    attendingDoctor: "Dr. Sharma",
    billingType: "Insurance",
    dailyCaseSheet: "Patient vitals stable. Chest X-ray normal. Plan: discharge tomorrow.",
    billCoveringLetter: "This bill is for services rendered during IPD stay from 15-Jul-2026 to 20-Jul-2026.",
    billSummary: "Total: ₹1,50,000 | Insurance payable: ₹1,00,000 | Patient paid: ₹50,000",
    detailedBill: "Room charges: ₹20,000\nDoctor fees: ₹30,000\nMedicines: ₹50,000\nLab tests: ₹50,000",
    dischargeSummary: "Discharge on 20-Jul-2026. Advised follow-up in 2 weeks. Medications: Tab Paracetamol 500mg TID."
  },
  {
    admissionNo: "IPD-1002",
    patientName: "Amit Sharma",
    uhid: "UH-12346",
    age: 38,
    gender: "Male",
    mobileNo: "9123456780",
    admissionDateTime: "2026-07-14T14:15:00",
    dischargeDate: "2026-07-20T14:00:00",
    ward: "Ward B",
    room: "205",
    bed: "2",
    attendingDoctor: "Dr. Verma",
    billingType: "Corporate",
    dailyCaseSheet: "Post-op day 2. Wound healing well. Pain controlled.",
    billCoveringLetter: "Corporate billing for IPD admission. Total charges as per package.",
    billSummary: "Total: ₹2,00,000 | Corporate covered: ₹1,80,000 | Patient paid: ₹20,000",
    detailedBill: "Surgery charges: ₹80,000\nRoom rent: ₹40,000\nICU charges: ₹60,000\nMisc: ₹20,000",
    dischargeSummary: "Discharged on 20-Jul-2026. Advised physiotherapy. Follow-up in 1 week."
  },
  {
    admissionNo: "IPD-1003",
    patientName: "Sneha Verma",
    uhid: "UH-12347",
    age: 29,
    gender: "Female",
    mobileNo: "9988776655",
    admissionDateTime: "2026-07-13T09:00:00",
    dischargeDate: "2026-07-18T11:00:00",
    ward: "ICU",
    room: "12",
    bed: "3",
    attendingDoctor: "Dr. Gupta",
    billingType: "Cash",
    dailyCaseSheet: "Patient is extubated. Hemodynamic stable. Transfer to ward today.",
    billCoveringLetter: "Cash bill for IPD stay. Payment received in full.",
    billSummary: "Total: ₹60,000 | Paid: ₹60,000 | Outstanding: ₹0",
    detailedBill: "ICU charges: ₹40,000\nVentilator support: ₹10,000\nMedicines: ₹10,000",
    dischargeSummary: "Discharged on 18-Jul-2026. Advised rest and follow-up in 1 month."
  },
  {
    admissionNo: "IPD-1004",
    patientName: "Rajesh Singh",
    uhid: "UH-12348",
    age: 52,
    gender: "Male",
    mobileNo: "9811122233",
    admissionDateTime: "2026-07-12T11:45:00",
    dischargeDate: "2026-07-22T09:30:00",
    ward: "Ward C",
    room: "310",
    bed: "4",
    attendingDoctor: "Dr. Patel",
    billingType: "Insurance",
    dailyCaseSheet: "Blood pressure under control. Renal function improving.",
    billCoveringLetter: "Insurance claim bill. All approvals obtained.",
    billSummary: "Total: ₹3,00,000 | Insurance: ₹2,50,000 | Patient: ₹50,000",
    detailedBill: "Dialysis: ₹1,20,000\nMedications: ₹80,000\nRoom charges: ₹60,000\nLab: ₹40,000",
    dischargeSummary: "Discharged on 22-Jul-2026. Advised low-protein diet. Follow-up with nephrologist."
  },
  {
    admissionNo: "IPD-1005",
    patientName: "Pooja Gupta",
    uhid: "UH-12349",
    age: 34,
    gender: "Female",
    mobileNo: "9090909090",
    admissionDateTime: "2026-07-11T16:20:00",
    dischargeDate: "2026-07-18T16:00:00",
    ward: "Ward A",
    room: "115",
    bed: "5",
    attendingDoctor: "Dr. Mehta",
    billingType: "Corporate",
    dailyCaseSheet: "Post-surgery day 3. Ambulating with support.",
    billCoveringLetter: "Corporate billing for maternity package.",
    billSummary: "Total: ₹1,20,000 | Corporate: ₹1,00,000 | Patient: ₹20,000",
    detailedBill: "Delivery charges: ₹50,000\nRoom rent: ₹30,000\nMedicines: ₹20,000\nLab: ₹20,000",
    dischargeSummary: "Discharged on 18-Jul-2026. Mother and baby healthy. Follow-up in 1 week."
  },
];

const IPDDischargeRecords = () => {
  // ---------- STATE ----------
  const [searchMobileNo, setSearchMobileNo] = useState("");
  const [admissionList, setAdmissionList] = useState(dummyAdmissions);
  const [filteredList, setFilteredList] = useState(dummyAdmissions);
  const [displayData, setDisplayData] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Detail view state
  const [showDetails, setShowDetails] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);

  // Report tab state
  const [activeReportTab, setActiveReportTab] = useState("dailyCaseSheet"); // "dailyCaseSheet" | "bill" | "dischargeSummary"
  // For bill sub-tabs
  const [billSubTab, setBillSubTab] = useState("coveringLetter"); // "coveringLetter" | "billSummary" | "detailedBill"

  // ---------- FORMATTING HELPERS ----------
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ---------- SEARCH & FILTER ----------
  const handleSearch = () => {
    setIsLoading(true);
    // Simulate API delay
    setTimeout(() => {
      let filtered = dummyAdmissions;
      if (searchMobileNo.trim()) {
        filtered = dummyAdmissions.filter((item) =>
          item.mobileNo.includes(searchMobileNo.trim())
        );
      }
      setFilteredList(filtered);
      setTotalElements(filtered.length);
      setTotalPages(Math.ceil(filtered.length / DEFAULT_ITEMS_PER_PAGE) || 1);
      setCurrentPage(1);
      // Paginate
      const start = 0;
      const end = DEFAULT_ITEMS_PER_PAGE;
      setDisplayData(filtered.slice(start, end));
      setIsLoading(false);
    }, 300);
  };

  const handleClear = () => {
    setSearchMobileNo("");
    setFilteredList(dummyAdmissions);
    setTotalElements(dummyAdmissions.length);
    setTotalPages(Math.ceil(dummyAdmissions.length / DEFAULT_ITEMS_PER_PAGE) || 1);
    setCurrentPage(1);
    setDisplayData(dummyAdmissions.slice(0, DEFAULT_ITEMS_PER_PAGE));
  };

  // Initial load
  useEffect(() => {
    setFilteredList(dummyAdmissions);
    setTotalElements(dummyAdmissions.length);
    setTotalPages(Math.ceil(dummyAdmissions.length / DEFAULT_ITEMS_PER_PAGE) || 1);
    setDisplayData(dummyAdmissions.slice(0, DEFAULT_ITEMS_PER_PAGE));
  }, []);

  // Pagination change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    const start = (page - 1) * DEFAULT_ITEMS_PER_PAGE;
    const end = start + DEFAULT_ITEMS_PER_PAGE;
    setDisplayData(filteredList.slice(start, end));
  };

  // ---------- ROW CLICK (open details) ----------
  const handleRowClick = (admission) => {
    setSelectedAdmission(admission);
    setShowDetails(true);
    // Reset report tabs to first
    setActiveReportTab("dailyCaseSheet");
    setBillSubTab("coveringLetter");
  };

  // ---------- BACK TO LIST ----------
  const handleBackToList = () => {
    setShowDetails(false);
    setSelectedAdmission(null);
  };

  // ---------- RENDER ----------
  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">
                {showDetails ? "Discharge Records Details" : "Patient Discharge Records"}
              </h4>
              {showDetails && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleBackToList}
                >
                  Back to list
                </button>
              )}
            </div>

            <div className="card-body">
              {/* ---------- LIST VIEW ---------- */}
              {!showDetails && (
                <>
                  {/* Search Section - only mobile no */}
                  <div className="mb-4">
                    <div className="card-body">
                      <div className="row g-3 align-items-end">
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Mobile No</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter mobile number"
                            value={searchMobileNo}
                            onChange={(e) => setSearchMobileNo(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                          />
                        </div>
                        <div className="col-md-4">
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={handleSearch}
                            >
                              <i className="mdi mdi-magnify"></i> Search
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={handleClear}
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Admission No</th>
                          <th>UHID</th>
                          <th>Patient Name</th>
                          <th>Age/Gender</th>
                          <th>Mobile</th>
                          <th>Ward/Room/Bed</th>
                          <th>Admission Date</th>
                          <th>Discharge Date</th> {/* NEW COLUMN */}
                          <th>Billing Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr>
                            <td colSpan="9" className="text-center py-4">
                              <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            </td>
                          </tr>
                        ) : displayData.length === 0 ? (
                          <tr>
                            <td colSpan="9" className="text-center py-3 text-muted">
                              No records found.
                            </td>
                          </tr>
                        ) : (
                          displayData.map((item) => (
                            <tr
                              key={item.admissionNo}
                              onClick={() => handleRowClick(item)}
                              role="button"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") handleRowClick(item);
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              <td>{item.admissionNo}</td>
                              <td>{item.uhid}</td>
                              <td>{item.patientName}</td>
                              <td>{item.age} / {item.gender}</td>
                              <td>{item.mobileNo}</td>
                              <td>{item.ward}/{item.room}/{item.bed}</td>
                              <td>{formatDate(item.admissionDateTime)}</td>
                              <td>{formatDate(item.dischargeDate)}</td> {/* NEW DATA */}
                              <td>
                                <span className="badge bg-info">{item.billingType}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalElements > 0 && !isLoading && (
                    <Pagination
                      totalItems={totalElements}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={handlePageChange}
                      totalPages={totalPages}
                    />
                  )}
                </>
              )}

              {/* ---------- DETAILS VIEW ---------- */}
              {showDetails && selectedAdmission && (
                <>
                  {/* Admission Details */}
                  <div className="row mb-3">
                    <div className="col-sm-12">
                      <div className="card shadow mb-3">
                        <div className="card-header py-3 border-bottom-1">
                          <h6 className="mb-0 fw-bold">Admission Details</h6>
                        </div>
                        <div className="card-body">
                          <div className="row g-3">
                            <div className="form-group col-md-4">
                              <label>Admission No</label>
                              <input
                                type="text"
                                className="form-control"
                                value={selectedAdmission.admissionNo || ""}
                                readOnly
                              />
                            </div>
                            <div className="form-group col-md-4">
                              <label>Patient Name</label>
                              <input
                                type="text"
                                className="form-control"
                                value={selectedAdmission.patientName || ""}
                                readOnly
                              />
                            </div>
                            <div className="form-group col-md-4">
                              <label>UHID</label>
                              <input
                                type="text"
                                className="form-control"
                                value={selectedAdmission.uhid || ""}
                                readOnly
                              />
                            </div>
                            <div className="form-group col-md-4">
                              <label>Age / Gender</label>
                              <input
                                type="text"
                                className="form-control"
                                value={`${selectedAdmission.age || ""} / ${selectedAdmission.gender || ""}`}
                                readOnly
                              />
                            </div>
                            <div className="form-group col-md-4">
                              <label>Mobile No</label>
                              <input
                                type="text"
                                className="form-control"
                                value={selectedAdmission.mobileNo || ""}
                                readOnly
                              />
                            </div>
                            <div className="form-group col-md-4">
                              <label>Admission Date</label>
                              <input
                                type="text"
                                className="form-control"
                                value={formatDate(selectedAdmission.admissionDateTime)}
                                readOnly
                              />
                            </div>
                            <div className="form-group col-md-4">
                              <label>Discharge Date</label>
                              <input
                                type="text"
                                className="form-control"
                                value={formatDate(selectedAdmission.dischargeDate)}
                                readOnly
                              />
                            </div>
                            <div className="form-group col-md-4">
                              <label>Ward / Room / Bed</label>
                              <input
                                type="text"
                                className="form-control"
                                value={`${selectedAdmission.ward || "N/A"} / ${selectedAdmission.room || "N/A"} / ${selectedAdmission.bed || "N/A"}`}
                                readOnly
                              />
                            </div>
                            <div className="form-group col-md-4">
                              <label>Attending Doctor</label>
                              <input
                                type="text"
                                className="form-control"
                                value={selectedAdmission.attendingDoctor || "N/A"}
                                readOnly
                              />
                            </div>
                            <div className="form-group col-md-4">
                              <label>Billing Type</label>
                              <input
                                type="text"
                                className="form-control"
                                value={selectedAdmission.billingType || ""}
                                readOnly
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reports Section */}
                  <div className="row mb-3">
                    <div className="col-sm-12">
                      <div className="card shadow">
                        <div className="card-header py-3 border-bottom-1">
                          <h6 className="mb-0 fw-bold">Reports</h6>
                        </div>
                        <div className="card-body">
                          {/* Tab buttons */}
                          <ul className="nav nav-tabs mb-3">
                            <li className="nav-item">
                              <button
                                className={`nav-link ${activeReportTab === "dailyCaseSheet" ? "active" : ""}`}
                                onClick={() => setActiveReportTab("dailyCaseSheet")}
                              >
                                Daily Case Sheet
                              </button>
                            </li>
                            <li className="nav-item">
                              <button
                                className={`nav-link ${activeReportTab === "bill" ? "active" : ""}`}
                                onClick={() => setActiveReportTab("bill")}
                              >
                                Bill
                              </button>
                            </li>
                            <li className="nav-item">
                              <button
                                className={`nav-link ${activeReportTab === "dischargeSummary" ? "active" : ""}`}
                                onClick={() => setActiveReportTab("dischargeSummary")}
                              >
                                Discharge Summary
                              </button>
                            </li>
                          </ul>

                          {/* Tab content - intentionally left as provided */}
                          <div className="tab-content">
                            {/* Daily Case Sheet */}


                            {/* Bill */}
                            {activeReportTab === "bill" && (
                              <div>
                                <ul className="nav nav-pills mb-3">
                                  <li className="nav-item">
                                    <button
                                      className={`nav-link ${billSubTab === "coveringLetter" ? "active" : ""}`}
                                      onClick={() => setBillSubTab("coveringLetter")}
                                    >
                                      Covering Letter
                                    </button>
                                  </li>
                                  <li className="nav-item">
                                    <button
                                      className={`nav-link ${billSubTab === "billSummary" ? "active" : ""}`}
                                      onClick={() => setBillSubTab("billSummary")}
                                    >
                                      Bill Summary
                                    </button>
                                  </li>
                                  <li className="nav-item">
                                    <button
                                      className={`nav-link ${billSubTab === "detailedBill" ? "active" : ""}`}
                                      onClick={() => setBillSubTab("detailedBill")}
                                    >
                                      Detailed Bill
                                    </button>
                                  </li>
                                </ul>
                              
                              </div>
                            )}

                            {/* Discharge Summary */}
                         
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IPDDischargeRecords;