import { useState } from "react";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import LoadingScreen from "../../../Components/Loading";

// -----------------------------------------------
// Dummy data – replace with real API later
// -----------------------------------------------
const DUMMY_PRESCRIPTIONS = [
  {
    id: 1,
    prescriptionDate: "2026-06-25",
    mobileNo: "9876543210",
    patientName: "John Doe",
    age: 46,
    gender: "M",
    relation: "Self",
    department: "General Medicine",
    doctor: "Dr. Smith",
    issueDate: "2026-06-26",
  },
  {
    id: 2,
    prescriptionDate: "2026-06-28",
    mobileNo: "9876543211",
    patientName: "Jane Roe",
    age: 32,
    gender: "F",
    relation: "Spouse",
    department: "Cardiology",
    doctor: "Dr. Lee",
    issueDate: "2026-06-29",
  },
  {
    id: 3,
    prescriptionDate: "2026-07-01",
    mobileNo: "9876543212",
    patientName: "Bob Brown",
    age: 58,
    gender: "O",
    relation: "Father",
    department: "Orthopedics",
    doctor: "Dr. Patel",
    issueDate: "2026-07-02",
  },
];

// Dummy prescription items for the detail table
const DUMMY_ITEMS = [
  {
    sNo: 1,
    matCode: "MAT001",
    nomenclature: "Paracetamol 500mg Tab",
    au: "Tab",
    batchNo: "B1234",
    doe: "2027-12-31",
    qtyPrescribed: 10,
    qtyIssued: 10,
    dosage: "1-0-1",
    frequency: "BD",
    noOfDays: 5,
    batchStock: 500,
    stockDispensary: 200,
    stockMedStore: 300,
    doctor: "Dr. Smith",
    instructions: "After food",
  },
  {
    sNo: 2,
    matCode: "MAT002",
    nomenclature: "Amoxicillin 250mg Cap",
    au: "Cap",
    batchNo: "B5678",
    doe: "2028-06-30",
    qtyPrescribed: 15,
    qtyIssued: 15,
    dosage: "1-1-1",
    frequency: "TDS",
    noOfDays: 5,
    batchStock: 1000,
    stockDispensary: 400,
    stockMedStore: 600,
    doctor: "Dr. Smith",
    instructions: "Before food",
  },
  {
    sNo: 3,
    matCode: "MAT003",
    nomenclature: "Ibuprofen 400mg Tab",
    au: "Tab",
    batchNo: "B9012",
    doe: "2027-09-15",
    qtyPrescribed: 20,
    qtyIssued: 20,
    dosage: "0-1-0",
    frequency: "OD",
    noOfDays: 10,
    batchStock: 750,
    stockDispensary: 300,
    stockMedStore: 450,
    doctor: "Dr. Smith",
    instructions: "With food",
  },
];

const PrescriptionList = () => {
  const [currentView, setCurrentView] = useState("list");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailItems, setDetailItems] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [mobileSearch, setMobileSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 2;
  const totalElements = 10;

  const handleSearch = () => {
    console.log("Search for:", mobileSearch);
  };

  const handleShowAll = () => {
    setMobileSearch("");
    console.log("Show all");
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRowClick = (record) => {
    setSelectedRecord(record);
    setLoadingDetails(true);
    // Simulate fetching header details + items
    setTimeout(() => {
      setDetailData({ ...record });
      // Deep copy items to keep dummy data untouched
      setDetailItems(DUMMY_ITEMS.map((item) => ({ ...item })));
      setLoadingDetails(false);
    }, 300);
    setCurrentView("detail");
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedRecord(null);
    setDetailData(null);
    setDetailItems([]);
  };

  // Handle changes to editable fields in the items table
  const handleItemChange = (index, field, value) => {
    setDetailItems((prevItems) => {
      const updated = [...prevItems];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Dummy save function – replace with real API call
  const handleSaveItems = () => {
    console.log("Saving items:", detailItems);
    alert("Changes logged (no real save in demo).");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-GB");
  };

  // ─────────────────────────────────────────────────
  // DETAIL VIEW (Read‑only header + editable items table)
  // ─────────────────────────────────────────────────
  if (currentView === "detail") {
    return (
      <div className="content-wrapper">
        {loadingDetails && <LoadingScreen />}

        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">Prescription Details</h4>
                <div>
                  
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleBackToList}
                  >
                    Back to List
                  </button>
                </div>
              </div>

              <div className="card-body">
                {detailData ? (
                  <>
                    {/* Non‑editable fields (3 per row) */}
                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-bold">Mobile No</label>
                        <input
                          type="text"
                          className="form-control"
                          value={detailData.mobileNo || ""}
                          readOnly
                          style={{ backgroundColor: "#e9ecef" }}
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-bold">Patient Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={detailData.patientName || ""}
                          readOnly
                          style={{ backgroundColor: "#e9ecef" }}
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-bold">Age</label>
                        <input
                          type="text"
                          className="form-control"
                          value={detailData.age || ""}
                          readOnly
                          style={{ backgroundColor: "#e9ecef" }}
                        />
                      </div>

                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-bold">Gender</label>
                        <select
                          className="form-select"
                          value={detailData.gender || ""}
                          disabled
                          style={{ backgroundColor: "#e9ecef" }}
                        >
                          <option value="M">M</option>
                          <option value="F">F</option>
                          <option value="O">Other</option>
                        </select>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-bold">Relation</label>
                        <input
                          type="text"
                          className="form-control"
                          value={detailData.relation || ""}
                          readOnly
                          style={{ backgroundColor: "#e9ecef" }}
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-bold">Department</label>
                        <input
                          type="text"
                          className="form-control"
                          value={detailData.department || ""}
                          readOnly
                          style={{ backgroundColor: "#e9ecef" }}
                        />
                      </div>

                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-bold">Doctor</label>
                        <input
                          type="text"
                          className="form-control"
                          value={detailData.doctor || ""}
                          readOnly
                          style={{ backgroundColor: "#e9ecef" }}
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-bold">Prescription Date</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formatDate(detailData.prescriptionDate)}
                          readOnly
                          style={{ backgroundColor: "#e9ecef" }}
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-bold">Issue Date</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formatDate(detailData.issueDate)}
                          readOnly
                          style={{ backgroundColor: "#e9ecef" }}
                        />
                      </div>
                    </div>

                    {/* Items Table – editable where appropriate */}
                    <h5 className="mt-4 mb-3">Prescription Items</h5>
                    <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto" }}>
                      <table className="table table-bordered table-sm align-middle">
                        <thead style={{ backgroundColor: "#6c7b7f", color: "white", position: "sticky", top: 0 }}>
                          <tr>
                            <th>S.No</th>
                            <th>Mat Code</th>
                            <th>Nomenclature</th>
                            <th>A/U</th>
                            <th>Batch No</th>
                            <th>DOE</th>
                            <th>Qty Prescribed</th>
                            <th>Qty Issued</th>
                            <th>Dosage</th>
                            <th>Frequency</th>
                            <th>No of Days</th>
                            <th>Batch Stock</th>
                            <th>Stock in Dispensary</th>
                            <th>Stock in Med Store</th>
                            <th>Doctor</th>
                            <th>Instructions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailItems.length === 0 ? (
                            <tr>
                              <td colSpan={16} className="text-center py-3 text-muted">
                                No items found.
                              </td>
                            </tr>
                          ) : (
                            detailItems.map((item, index) => (
                              <tr key={item.sNo}>
                                {/* Read-only fields */}
                                <td>{item.sNo}</td>
                                <td>{item.matCode}</td>
                                {/* Nomenclature column with increased width */}
                                <td style={{ minWidth: "200px" }}>
                                  {item.nomenclature}
                                </td>
                                <td>{item.au}</td>
                                <td>{item.batchNo}</td>
                                <td>{formatDate(item.doe)}</td>
                                <td>{item.qtyPrescribed}</td>

                                {/* Editable: Qty Issued */}
                                <td>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    value={item.qtyIssued}
                                    onChange={(e) => handleItemChange(index, "qtyIssued", e.target.value)}
                                    style={{ minWidth: "80px" }}
                                  />
                                </td>

                                {/* Editable: Dosage */}
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={item.dosage}
                                    onChange={(e) => handleItemChange(index, "dosage", e.target.value)}
                                    style={{ minWidth: "80px" }}
                                  />
                                </td>

                                {/* Editable: Frequency (dropdown) */}
                                <td>
                                  <select
                                    className="form-select form-select-sm"
                                    value={item.frequency}
                                    onChange={(e) => handleItemChange(index, "frequency", e.target.value)}
                                  >
                                    <option value="OD">OD</option>
                                    <option value="BD">BD</option>
                                    <option value="TDS">TDS</option>
                                    <option value="QID">QID</option>
                                    <option value="SOS">SOS</option>
                                    <option value="STAT">STAT</option>
                                  </select>
                                </td>

                                {/* Editable: No of Days */}
                                <td>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    value={item.noOfDays}
                                    onChange={(e) => handleItemChange(index, "noOfDays", e.target.value)}
                                    style={{ width: "70px" }}
                                  />
                                </td>

                                {/* Read-only fields */}
                                <td>{item.batchStock}</td>
                                <td>{item.stockDispensary}</td>
                                <td style={{ minWidth: "80px" }}>{item.stockMedStore}</td>
                                <td>{item.doctor}</td>

                                {/* Editable: Instructions */}
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={item.instructions}
                                    onChange={(e) => handleItemChange(index, "instructions", e.target.value)}
                                    style={{ minWidth: "120px" }}
                                  />
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-muted">No details found.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────
  // LIST VIEW (Row click, no Action column)
  // ─────────────────────────────────────────────────
  return (
    <div className="content-wrapper">
      {loading && <LoadingScreen />}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Prescription List</h4>
            </div>

            <div className="card-body">
              {/* Search Bar */}
              <div className="row mb-4">
                <div className="col-md-4">
                  <label className="form-label fw-bold">Search by Mobile No</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter mobile number"
                    value={mobileSearch}
                    onChange={(e) => setMobileSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearch();
                    }}
                  />
                </div>
                <div className="col-md-4 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-primary me-2"
                    onClick={handleSearch}
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleShowAll}
                  >
                    Show All
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead style={{ backgroundColor: "#95a5a6", color: "white" }}>
                    <tr>
                      <th>Prescription Date</th>
                      <th>Mobile No</th>
                      <th>Patient Name</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>Relation</th>
                      <th>Department</th>
                      <th>Doctor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DUMMY_PRESCRIPTIONS.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4 text-muted">
                          No prescription records found.
                        </td>
                      </tr>
                    ) : (
                      DUMMY_PRESCRIPTIONS.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => handleRowClick(item)}
                          style={{ cursor: "pointer" }}
                        >
                          <td>{formatDate(item.prescriptionDate)}</td>
                          <td>{item.mobileNo}</td>
                          <td>{item.patientName}</td>
                          <td>{item.age}</td>
                          <td>{item.gender}</td>
                          <td>{item.relation}</td>
                          <td>{item.department}</td>
                          <td>{item.doctor}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <Pagination
                totalItems={totalElements}
                itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                totalPages={totalPages}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionList;