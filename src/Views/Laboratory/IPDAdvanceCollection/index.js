import { useState, useMemo } from "react";

// ---- Updated Mock data (UI demo only - replace with API integration later) ----
const MOCK_ADMISSIONS = [
  {
    admissionNo: "IPD/2026/000145",
    uhid: "UH000512",
    patientName: "Sneha Patel",
    age: 34,
    gender: "F",
    mobileNo: "9876543211",
    ward: "Maternity",
    room: "M-05",
    bed: "Bed-02",
    admissionDate: "28-Jul-2026",
    attendingDoctor: "Dr. Anjali Mehta",
    billingType: "Cash",
  },
  {
    admissionNo: "IPD/2026/000156",
    uhid: "UH000678",
    patientName: "Amit Singh",
    age: 58,
    gender: "M",
    mobileNo: "9876543212",
    ward: "Cardiology",
    room: "C-10",
    bed: "Bed-04",
    admissionDate: "29-Jul-2026",
    attendingDoctor: "Dr. Rajesh Kumar",
    billingType: "Insurance",
  },
  {
    admissionNo: "IPD/2026/000167",
    uhid: "UH000789",
    patientName: "Priya Sharma",
    age: 27,
    gender: "F",
    mobileNo: "9876543213",
    ward: "General",
    room: "G-08",
    bed: "Bed-01",
    admissionDate: "30-Jul-2026",
    attendingDoctor: "Dr. Mahesh Verma",
    billingType: "Cash",
  },
  {
    admissionNo: "IPD/2026/000178",
    uhid: "UH000890",
    patientName: "Ravi Desai",
    age: 72,
    gender: "M",
    mobileNo: "9876543214",
    ward: "ICU",
    room: "I-03",
    bed: "Bed-02",
    admissionDate: "31-Jul-2026",
    attendingDoctor: "Dr. Sunil Rao",
    billingType: "Insurance",
  },
];

const PAYMENT_MODES = ["Cash", "UPI", "Card", "Cheque"];

const IPDAdvanceCollection = () => {
  const [searchBy, setSearchBy] = useState("mobileNo");
  const [searchValue, setSearchValue] = useState("");
  const [admissionList, setAdmissionList] = useState(MOCK_ADMISSIONS);

  const [showDetails, setShowDetails] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);

  const [collectionDate, setCollectionDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [paymentRows, setPaymentRows] = useState([
    { id: 1, mode: "Cash", amount: "" },
    { id: 2, mode: "UPI", amount: "" },
  ]);

  const handleSearch = () => {
    if (!searchValue.trim()) {
      setAdmissionList(MOCK_ADMISSIONS);
      return;
    }

    const filtered = MOCK_ADMISSIONS.filter((item) => {
      if (searchBy === "mobileNo") {
        return item.mobileNo.includes(searchValue.trim());
      }
      if (searchBy === "patientName") {
        return item.patientName
          .toLowerCase()
          .includes(searchValue.trim().toLowerCase());
      }
      if (searchBy === "admissionNo") {
        return item.admissionNo
          .toLowerCase()
          .includes(searchValue.trim().toLowerCase());
      }
      return true;
    });

    setAdmissionList(filtered);
  };

  const handleClear = () => {
    setSearchBy("mobileNo");
    setSearchValue("");
    setAdmissionList(MOCK_ADMISSIONS);
  };

  const handleRowClick = (admission) => {
    setSelectedAdmission(admission);
    setCollectionDate(new Date().toISOString().split("T")[0]);
    setPaymentRows([
      { id: 1, mode: "Cash", amount: "" },
      { id: 2, mode: "UPI", amount: "" },
    ]);
    setShowDetails(true);
  };

  const handleBackToList = () => {
    setShowDetails(false);
    setSelectedAdmission(null);
  };

  const handlePaymentRowChange = (id, field, value) => {
    setPaymentRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const addPaymentRow = () => {
    setPaymentRows((prev) => [
      ...prev,
      { id: Date.now(), mode: "Cash", amount: "" },
    ]);
  };

  const removePaymentRow = (id) => {
    setPaymentRows((prev) =>
      prev.length > 1 ? prev.filter((row) => row.id !== id) : prev,
    );
  };

  const totalAmount = useMemo(() => {
    return paymentRows
      .reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
      .toFixed(2);
  }, [paymentRows]);

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">IPD Advance Collection</h4>
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
              {/* Search Section - Only visible when not showing admission details */}
              {!showDetails && (
                <>
                  <div className="mb-4">
                    <div className="card-body">
                      <div className="row g-3 align-items-end">
                        <div className="col-md-5">
                          <label className="form-label fw-semibold">
                            Search
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search by mobile no, patient no, admission no..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                          />
                        </div>
                        <div className="col-md-6">
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

                  {/* Active Admission Search Result */}
                  {admissionList.length > 0 ? (
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
                            <th>Billing Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {admissionList.map((item) => (
                            <tr
                              key={item.admissionNo}
                              onClick={() => handleRowClick(item)}
                              role="button"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ")
                                  handleRowClick(item);
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              <td>{item.admissionNo}</td>
                              <td>{item.uhid}</td>
                              <td>{item.patientName}</td>
                              <td>
                                {item.age}/{item.gender}
                              </td>
                              <td>{item.mobileNo}</td>
                              <td>
                                {item.ward}/{item.room}/{item.bed}
                              </td>
                              <td>{item.admissionDate}</td>
                              <td>
                                <span className="badge bg-info">
                                  {item.billingType}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="alert alert-info" role="alert">
                      <i className="mdi mdi-information"></i> No active
                      admissions found.
                    </div>
                  )}
                </>
              )}

              {/* Admission Details Section - Shows only when an admission is selected */}
              {showDetails && selectedAdmission && (
                <>
                  {/* Admission / Patient Details */}
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
                                value={selectedAdmission.admissionNo}
                                readOnly
                              />
                            </div>

                            <div className="form-group col-md-4">
                              <label>Patient Name</label>
                              <input
                                type="text"
                                className="form-control"
                                value={selectedAdmission.patientName}
                                readOnly
                              />
                            </div>

                            <div className="form-group col-md-4">
                              <label>UHID</label>
                              <input
                                type="text"
                                className="form-control"
                                value={selectedAdmission.uhid}
                                readOnly
                              />
                            </div>

                            <div className="form-group col-md-4">
                              <label>Age / Gender</label>
                              <input
                                type="text"
                                className="form-control"
                                value={`${selectedAdmission.age} Years / ${
                                  selectedAdmission.gender === "M"
                                    ? "Male"
                                    : "Female"
                                }`}
                                readOnly
                              />
                            </div>

                            <div className="form-group col-md-4">
                              <label>Mobile No</label>
                              <input
                                type="text"
                                className="form-control"
                                value={selectedAdmission.mobileNo}
                                readOnly
                              />
                            </div>

                            <div className="form-group col-md-4">
                              <label>Admission Date</label>
                              <input
                                type="text"
                                className="form-control"
                                value={selectedAdmission.admissionDate}
                                readOnly
                              />
                            </div>

                            <div className="form-group col-md-4">
                              <label>Ward / Room / Bed</label>
                              <input
                                type="text"
                                className="form-control"
                                value={`${selectedAdmission.ward} / ${selectedAdmission.room} / ${selectedAdmission.bed}`}
                                readOnly
                              />
                            </div>

                            <div className="form-group col-md-4">
                              <label>Attending Doctor</label>
                              <input
                                type="text"
                                className="form-control"
                                value={selectedAdmission.attendingDoctor}
                                readOnly
                              />
                            </div>

                            <div className="form-group col-md-4">
                              <label>Billing Type</label>
                              <input
                                type="text"
                                className="form-control"
                                value={selectedAdmission.billingType}
                                readOnly
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Collection Details */}
                  <div className="row mb-3">
                    <div className="col-sm-12">
                      <div className="card shadow mb-3">
                        <div className="card-header border-bottom-1 py-3">
                          <h6 className="fw-bold mb-0">Collection Details</h6>
                        </div>
                        <div className="card-body">
                          <div className="row g-3 mb-3">
                            <div className="form-group col-md-4">
                              <label>Collection Date</label>
                              <input
                                type="date"
                                className="form-control"
                                value={collectionDate}
                                onChange={(e) =>
                                  setCollectionDate(e.target.value)
                                }
                              />
                            </div>
                          </div>

                          <table className="table table-bordered">
                            <thead>
                              <tr>
                                <th>Payment Mode</th>
                                <th>Amount</th>
                                <th style={{ width: "80px" }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paymentRows.map((row) => (
                                <tr key={row.id}>
                                  <td>
                                    <select
                                      className="form-select"
                                      value={row.mode}
                                      onChange={(e) =>
                                        handlePaymentRowChange(
                                          row.id,
                                          "mode",
                                          e.target.value,
                                        )
                                      }
                                    >
                                      {PAYMENT_MODES.map((mode) => (
                                        <option key={mode} value={mode}>
                                          {mode}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      className="form-control"
                                      placeholder="Enter amount"
                                      value={row.amount}
                                      min="0"
                                      step="0.01"
                                      onChange={(e) =>
                                        handlePaymentRowChange(
                                          row.id,
                                          "amount",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="text-center">
                                    <button
                                      type="button"
                                      className="btn btn-danger"
                                      onClick={() => removePaymentRow(row.id)}
                                      disabled={paymentRows.length === 1}
                                      title="Remove payment row"
                                    >
                                      <i className="icofont-close"></i>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {/* Add Row button placed below the table */}
                          <button
                            type="button"
                            className="btn btn-success mt-2"
                            onClick={addPaymentRow}
                          >
                            Add Row +
                          </button>

                          <div className="d-flex justify-content-end mt-3">
                            <h5 className="fw-bold">
                              Total Amount: ₹{totalAmount}
                            </h5>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit and Reset Buttons - Commented out as per original */}
                          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <button
                              type="button"
                              className="btn btn-warning"
                              disabled={Number(totalAmount) <= 0}
                            >
                             Submit
                            </button>

                    
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

export default IPDAdvanceCollection;