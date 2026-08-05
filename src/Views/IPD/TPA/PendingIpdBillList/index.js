import { useState, useMemo, useEffect } from "react";
import LoadingScreen from "../../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../../Components/Pagination";

const PAYMENT_MODES = ["Cash", "UPI", "Card", "Cheque"];
const COLLECTION_TYPES = ["Advance", "Final"];

const PendingIpdBillList = () => {
  const [loading, setLoading] = useState(false);

  // Filter states
  const [wardFilter, setWardFilter] = useState("");
  const [billTypeFilter, setBillTypeFilter] = useState("");
  const [amountFilter, setAmountFilter] = useState(""); // '', 'gt50000', 'gt10000', 'other'
  const [customAmount, setCustomAmount] = useState("");

  // Button spinners
  const [isSearching, setIsSearching] = useState(false);
  const [isShowingAll, setIsShowingAll] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Full static data (unchanged)
  const fullBillData = useMemo(
    () => [
      {
        admissionId: "ADM001",
        patientName: "Ravi Kumar",
        mobile: "9876543210",
        admissionDateTime: "05-Apr-2026 10:30 AM",
        wardRoom: "Ward A / 101",
        billType: "Insurance",
        totalAmount: "1,00,000",
        insurancePayable: "70,000",
        patientPaid: "20,000",
        outstandingAmount: "10,000",
        billStatus: "FINAL",
        uhid: "UH12345",
        age: "45",
        gender: "Male",
        attendingDoctor: "Dr. Sharma",
        ward: "Ward A",
        room: "101",
        bed: "1",
        admissionNo: "ADM001",
      },
      {
        admissionId: "ADM002",
        patientName: "Amit Sharma",
        mobile: "9123456780",
        admissionDateTime: "04-Apr-2026 02:15 PM",
        wardRoom: "Ward B / 205",
        billType: "Corporate",
        totalAmount: "80,000",
        insurancePayable: "50,000",
        patientPaid: "20,000",
        outstandingAmount: "10,000",
        billStatus: "OPEN",
        uhid: "UH12346",
        age: "38",
        gender: "Male",
        attendingDoctor: "Dr. Verma",
        ward: "Ward B",
        room: "205",
        bed: "2",
        admissionNo: "ADM002",
      },
      {
        admissionId: "ADM003",
        patientName: "Sneha Verma",
        mobile: "9988776655",
        admissionDateTime: "03-Apr-2026 09:00 AM",
        wardRoom: "ICU / 12",
        billType: "Cash",
        totalAmount: "60,000",
        insurancePayable: "0",
        patientPaid: "60,000",
        outstandingAmount: "0",
        billStatus: "FINAL",
        uhid: "UH12347",
        age: "29",
        gender: "Female",
        attendingDoctor: "Dr. Gupta",
        ward: "ICU",
        room: "12",
        bed: "3",
        admissionNo: "ADM003",
      },
      {
        admissionId: "ADM004",
        patientName: "Rajesh Singh",
        mobile: "9811122233",
        admissionDateTime: "02-Apr-2026 11:45 AM",
        wardRoom: "Ward C / 310",
        billType: "Insurance",
        totalAmount: "1,50,000",
        insurancePayable: "1,00,000",
        patientPaid: "30,000",
        outstandingAmount: "20,000",
        billStatus: "INTERIM",
        uhid: "UH12348",
        age: "52",
        gender: "Male",
        attendingDoctor: "Dr. Patel",
        ward: "Ward C",
        room: "310",
        bed: "4",
        admissionNo: "ADM004",
      },
      {
        admissionId: "ADM005",
        patientName: "Pooja Gupta",
        mobile: "9090909090",
        admissionDateTime: "01-Apr-2026 04:20 PM",
        wardRoom: "Ward A / 115",
        billType: "Insurance",
        totalAmount: "90,000",
        insurancePayable: "60,000",
        patientPaid: "25,000",
        outstandingAmount: "5,000",
        billStatus: "FINAL",
        uhid: "UH12349",
        age: "34",
        gender: "Female",
        attendingDoctor: "Dr. Mehta",
        ward: "Ward A",
        room: "115",
        bed: "5",
        admissionNo: "ADM005",
      },
    ],
    []
  );

  // Details view states (copied from IPDAdvanceCollection)
  const [showDetails, setShowDetails] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);

  const [collectionDate, setCollectionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [collectionType, setCollectionType] = useState("Advance");
  const [paymentRows, setPaymentRows] = useState([
    { id: 1, mode: "Cash", amount: "" },
    { id: 2, mode: "UPI", amount: "" },
  ]);

  // Payment History state
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch payment history when admission is selected (mock)
  useEffect(() => {
    if (selectedAdmission) {
      setHistoryLoading(true);
      // Simulate API call
      setTimeout(() => {
        setPaymentHistory([
          { id: 1, date: "2026-08-01", paymentType: "Advance", paymentMode: "Cash", amount: 5000 },
          { id: 2, date: "2026-08-02", paymentType: "Final", paymentMode: "UPI", amount: 2500 },
          { id: 3, date: "2026-08-03", paymentType: "Advance", paymentMode: "Card", amount: 1000 },
        ]);
        setHistoryLoading(false);
      }, 300);
    } else {
      setPaymentHistory([]);
    }
  }, [selectedAdmission]);

  // Filtered and paginated data
  const [filteredData, setFilteredData] = useState(fullBillData);
  const [displayData, setDisplayData] = useState(
    fullBillData.slice(0, DEFAULT_ITEMS_PER_PAGE)
  );

  // Ward dropdown options
  const wardOptions = [
    { id: 1, name: "Ward A" },
    { id: 2, name: "Ward B" },
    { id: 3, name: "Ward C" },
    { id: 4, name: "ICU" },
  ];

  // Bill Type dropdown options
  const billTypeOptions = [
    { value: "Insurance", label: "Insurance" },
    { value: "Corporate", label: "Corporate" },
    { value: "Cash", label: "Cash" },
  ];

  // Amount filter options
  const amountOptions = [
    { value: "", label: "Select Amount Filter" },
    { value: "gt50000", label: "> 50,000" },
    { value: "gt10000", label: "> 10,000" },
    { value: "other", label: "Other" },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "OPEN":
        return { backgroundColor: "#ffc107", color: "#000" };
      case "INTERIM":
        return { backgroundColor: "#fd7e14", color: "#fff" };
      case "FINAL":
        return { backgroundColor: "#28a745", color: "#fff" };
      default:
        return { backgroundColor: "#6c757d", color: "#fff" };
    }
  };

  const getOutstandingDotColor = (outstandingAmount) => {
    const value = parseFloat(String(outstandingAmount).replace(/,/g, "")) || 0;
    if (value === 0) return "#28a745";
    if (value <= 10000) return "#ffc107";
    return "#dc3545";
  };

  // Apply filters and pagination
  const applyFiltersAndPaginate = (data, page) => {
    let filtered = data;

    if (wardFilter) {
      const ward = wardOptions.find((w) => w.id === parseInt(wardFilter));
      if (ward) {
        filtered = filtered.filter((item) => item.wardRoom.includes(ward.name));
      }
    }

    if (billTypeFilter) {
      filtered = filtered.filter((item) => item.billType === billTypeFilter);
    }

    if (amountFilter) {
      let threshold = 0;
      if (amountFilter === "gt50000") threshold = 50000;
      else if (amountFilter === "gt10000") threshold = 10000;
      else if (amountFilter === "other" && customAmount) {
        threshold = parseFloat(customAmount.replace(/,/g, "")) || 0;
      }
      if (threshold > 0) {
        filtered = filtered.filter((item) => {
          const outstanding = parseFloat(String(item.outstandingAmount).replace(/,/g, "")) || 0;
          return outstanding > threshold;
        });
      }
    }

    const total = filtered.length;
    const perPage = DEFAULT_ITEMS_PER_PAGE;
    const totalPages = Math.ceil(total / perPage) || 1;
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * perPage;
    const end = start + perPage;
    const pageItems = filtered.slice(start, end);

    setFilteredData(filtered);
    setDisplayData(pageItems);
    setTotalElements(total);
    setTotalPages(totalPages);
    setCurrentPage(safePage);
  };

  // Handle page change
  const handlePageChange = (page) => {
    applyFiltersAndPaginate(filteredData.length > 0 ? filteredData : fullBillData, page);
  };

  // Handle search with filters
  const handleSearch = async () => {
    setIsSearching(true);
    setCurrentPage(1);
    await new Promise((resolve) => setTimeout(resolve, 300));
    applyFiltersAndPaginate(fullBillData, 1);
    setIsSearching(false);
  };

  const handleShowAll = async () => {
    setIsShowingAll(true);
    setWardFilter("");
    setBillTypeFilter("");
    setAmountFilter("");
    setCustomAmount("");
    setCurrentPage(1);
    await new Promise((resolve) => setTimeout(resolve, 300));
    setFilteredData(fullBillData);
    setDisplayData(fullBillData.slice(0, DEFAULT_ITEMS_PER_PAGE));
    setTotalElements(fullBillData.length);
    setTotalPages(Math.ceil(fullBillData.length / DEFAULT_ITEMS_PER_PAGE) || 1);
    setIsShowingAll(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    applyFiltersAndPaginate(
      filteredData.length > 0 ? filteredData : fullBillData,
      currentPage
    );
    setIsRefreshing(false);
  };

  // Row click handler – opens details view
  const handleRowClick = (item) => {
    setSelectedAdmission(item);
    setCollectionDate(new Date().toISOString().split("T")[0]);
    setCollectionType("Advance");
    setPaymentRows([
      { id: 1, mode: "Cash", amount: "" },
      { id: 2, mode: "UPI", amount: "" },
    ]);
    setShowDetails(true);
  };

  // Back to list
  const handleBackToList = () => {
    setShowDetails(false);
    setSelectedAdmission(null);
  };

  // Payment row handlers (copied from IPDAdvanceCollection)
  const handlePaymentRowChange = (id, field, value) => {
    setPaymentRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
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
      prev.length > 1 ? prev.filter((row) => row.id !== id) : prev
    );
  };

  const totalAmount = useMemo(() => {
    return paymentRows
      .reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
      .toFixed(2);
  }, [paymentRows]);

  // Report handler (placeholder)
  const handleReport = (historyItem) => {
    alert(`Report for payment ID: ${historyItem.id}\nYou can implement print or download logic here.`);
  };

  // Submit collection (placeholder)
  const handleSubmitCollection = () => {
    if (Number(totalAmount) <= 0) return;
    alert(`Collection submitted: Total ₹${totalAmount}`);
    // Reset form or call API
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="content-wrapper">
      {loading && <LoadingScreen />}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2 mb-0">
                {showDetails ? "Pending IPD Bill Details" : "Pending Tracking - IPD Bill List"}
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
              {/* ====== TABLE VIEW ====== */}
              {!showDetails && (
                <>
                  {/* Filters */}
                  <div className="row mb-3">
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Ward</label>
                      <select
                        className="form-select"
                        value={wardFilter}
                        onChange={(e) => setWardFilter(e.target.value)}
                      >
                        <option value="">All Wards</option>
                        {wardOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold">Bill Type</label>
                      <select
                        className="form-select"
                        value={billTypeFilter}
                        onChange={(e) => setBillTypeFilter(e.target.value)}
                      >
                        <option value="">All Bill Types</option>
                        {billTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold">Outstanding Amount</label>
                      <div className="d-flex">
                        <select
                          className={`form-select ${
                            amountFilter === "other" ? "flex-grow-1 me-1" : "w-100"
                          }`}
                          value={amountFilter}
                          onChange={(e) => {
                            setAmountFilter(e.target.value);
                            if (e.target.value !== "other") {
                              setCustomAmount("");
                            }
                          }}
                        >
                          {amountOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {amountFilter === "other" && (
                          <input
                            type="text"
                            className="form-control"
                            style={{ width: "80px", flexShrink: 0 }}
                            placeholder="e.g. 25000"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="row mb-4">
                    <div className="col-md-12 d-flex align-items-end">
                      <button
                        type="button"
                        className="btn btn-primary me-2"
                        onClick={handleSearch}
                        disabled={loading || isSearching || isShowingAll}
                      >
                        {isSearching ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Searching...
                          </>
                        ) : (
                          "Search"
                        )}
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleShowAll}
                        disabled={loading || isSearching || isShowingAll}
                      >
                        {isShowingAll ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Showing All...
                          </>
                        ) : (
                          "Show All"
                        )}
                      </button>

                     
                    </div>
                  </div>

                  {/* Table */}
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle">
                      <thead style={{ backgroundColor: "#95a5a6", color: "white" }}>
                        <tr>
                          <th>Patient Name</th>
                          <th>Mobile</th>
                          <th>Admission ID</th>
                          <th>Admission DateTime</th>
                          <th>Ward / Room</th>
                          <th>Bill Type</th>
                          <th>Total Amount</th>
                          <th>Insurance Payable</th>
                          <th>Patient Paid</th>
                          <th>Outstanding Amount</th>
                          <th>Bill Status</th>
                          <th className="text-center">View Bill (PDF)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={12} className="text-center py-4">
                              <LoadingScreen />
                            </td>
                          </tr>
                        ) : displayData.length === 0 ? (
                          <tr>
                            <td colSpan={12} className="text-center py-4 text-muted">
                              No pending IPD bills found.
                            </td>
                          </tr>
                        ) : (
                          displayData.map((item) => (
                            <tr
                              key={item.admissionId}
                              onClick={() => handleRowClick(item)}
                              role="button"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") handleRowClick(item);
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              <td>{item.patientName}</td>
                              <td>{item.mobile}</td>
                              <td>{item.admissionId}</td>
                              <td>{item.admissionDateTime}</td>
                              <td>{item.wardRoom}</td>
                              <td>{item.billType}</td>
                              <td>₹{item.totalAmount}</td>
                              <td>₹{item.insurancePayable}</td>
                              <td>
                                <span
                                  className="d-inline-block rounded-circle me-2"
                                  style={{
                                    width: "10px",
                                    height: "10px",
                                    backgroundColor: getOutstandingDotColor(
                                      item.outstandingAmount
                                    ),
                                  }}
                                ></span>
                                ₹{item.patientPaid}
                              </td>
                              <td>₹{item.outstandingAmount}</td>
                              <td>
                                <span className="badge" style={getStatusColor(item.billStatus)}>
                                  {item.billStatus}
                                </span>
                              </td>
                              <td className="text-center">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    alert("View Bill PDF for " + item.admissionId);
                                  }}
                                  title="View Bill PDF"
                                >
                                  View
                                  <i className="fa fa-file-pdf-o ms-1"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    totalItems={totalElements}
                    itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                    totalPages={totalPages}
                  />
                </>
              )}

              {/* ====== DETAILS VIEW ====== */}
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
                                value={selectedAdmission.admissionNo || selectedAdmission.admissionId || ""}
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
                                value={selectedAdmission.mobile || ""}
                                readOnly
                              />
                            </div>
                            <div className="form-group col-md-4">
                              <label>Admission Date</label>
                              <input
                                type="text"
                                className="form-control"
                                value={selectedAdmission.admissionDateTime || ""}
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
                                value={selectedAdmission.billType || ""}
                                readOnly
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment History Section */}
                  <div className="row mb-3">
                    <div className="col-sm-12">
                      <div className="card shadow mb-3">
                        <div className="card-header py-3 border-bottom-1 d-flex justify-content-between align-items-center">
                          <h6 className="mb-0 fw-bold">Payment History</h6>
                          {paymentHistory.length > 0 && (
                            <span className="badge bg-primary">{paymentHistory.length} entries</span>
                          )}
                        </div>
                        <div className="card-body">
                          {historyLoading ? (
                            <div className="text-center py-3">
                              <div
                                className="spinner-border spinner-border-sm text-primary"
                                role="status"
                              >
                                <span className="visually-hidden">Loading...</span>
                              </div>
                              <span className="ms-2">Loading payment history...</span>
                            </div>
                          ) : paymentHistory.length === 0 ? (
                            <div className="text-muted text-center py-3">
                              No payment history found for this admission.
                            </div>
                          ) : (
                            <div className="table-responsive">
                              <table className="table table-bordered table-hover align-middle">
                                <thead className="table-light">
                                  <tr>
                                    <th>Date</th>
                                    <th>Payment Type</th>
                                    <th>Payment Mode</th>
                                    <th className="text-end">Amount</th>
                                    <th style={{ width: "100px" }}>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {paymentHistory.map((item) => (
                                    <tr key={item.id}>
                                      <td>{formatDate(item.date)}</td>
                                      <td>{item.paymentType}</td>
                                      <td>{item.paymentMode}</td>
                                      <td className="text-end">₹{Number(item.amount).toFixed(2)}</td>
                                      <td className="text-center">
                                        <button
                                          className="btn btn-sm btn-outline-info"
                                          onClick={() => handleReport(item)}
                                          title="View Report"
                                        >
                                          <i className="mdi mdi-file-document"></i> Report
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Collection Details Section */}
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
                                onChange={(e) => setCollectionDate(e.target.value)}
                              />
                            </div>
                            <div className="form-group col-md-4">
                              <label>Collection Type</label>
                              <select
                                className="form-select"
                                value={collectionType}
                                onChange={(e) => setCollectionType(e.target.value)}
                              >
                                {COLLECTION_TYPES.map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="d-flex justify-content-end mb-2">
                            <button
                              type="button"
                              className="btn btn-success"
                              onClick={addPaymentRow}
                            >
                              Add Row +
                            </button>
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
                                        handlePaymentRowChange(row.id, "mode", e.target.value)
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
                                        handlePaymentRowChange(row.id, "amount", e.target.value)
                                      }
                                    />
                                  </td>
                                  <td className="text-center">
                                    <button
                                      type="button"
                                      className="btn btn-danger btn-sm"
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

                          <div className="d-flex justify-content-between align-items-center mt-3">
                            <h5 className="fw-bold mb-0">
                              Total Amount: ₹{totalAmount}
                            </h5>
                            <button
                              type="button"
                              className="btn btn-warning"
                              disabled={Number(totalAmount) <= 0}
                              onClick={handleSubmitCollection}
                            >
                              Submit
                            </button>
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

export default PendingIpdBillList;