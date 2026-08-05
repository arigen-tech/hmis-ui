import { useState, useMemo, useEffect } from "react";
import LoadingScreen from "../../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../../Components/Pagination";
import { getRequest } from "../../../../service/apiService";
import { MAS_WARD_GET_ALL_ACTIVE, MAS_IPD_BILLING_TYPE, GET_PENDING_TRACKING_IPD_BILL_LIST, GET_PREVIOUS_PAYMENT_HISTORY } from "../../../../config/apiConfig";

const PAYMENT_MODES = ["Cash", "UPI", "Card", "Cheque"];
const COLLECTION_TYPES = ["Advance", "Final"];
const amountOptions = [
  { value: "", label: "All Amounts" },
  { value: "0", label: "₹0" },
  { value: "5000", label: "₹5,000" },
  { value: "10000", label: "₹10,000" },
  { value: "other", label: "Other..." }
];

const PendingIpdBillList = () => {
  const [loading, setLoading] = useState(false);

  // Filter states
  const [wardFilter, setWardFilter] = useState("");
  const [billTypeFilter, setBillTypeFilter] = useState("");
  const [amountFilter, setAmountFilter] = useState("");
  const [customAmount, setCustomAmount] = useState("");

  // Button spinners
  const [isSearching, setIsSearching] = useState(false);
  const [isShowingAll, setIsShowingAll] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Dynamic Options
  const [wardOptions, setWardOptions] = useState([]);
  const [billTypeOptions, setBillTypeOptions] = useState([]);

  // Data State
  const [displayData, setDisplayData] = useState([]);

  useEffect(() => {
    getRequest(MAS_WARD_GET_ALL_ACTIVE).then(res => {
      if (res?.response) {
        setWardOptions(res.response.map(w => ({ id: w.wardId, name: w.wardName })));
      } else {
        setWardOptions([]);
      }
    });
    getRequest(`${MAS_IPD_BILLING_TYPE}/getAll/1`).then(res => {
      if (res?.response) {
        setBillTypeOptions(res.response.map(b => ({ value: b.billingTypeId, label: b.billingTypeName })));
      } else {
        setBillTypeOptions([]);
      }
    });
  }, []);

  const fetchBills = async (page = 0) => {
    setLoading(true);
    let url = `${GET_PENDING_TRACKING_IPD_BILL_LIST}?page=${page}&size=${DEFAULT_ITEMS_PER_PAGE}`;
    if (wardFilter) url += `&wardId=${wardFilter}`;
    if (billTypeFilter) url += `&billType=${billTypeFilter}`;
    if (amountFilter === "other" && customAmount) {
      url += `&outStandingAmount=${customAmount}`;
    } else if (amountFilter && amountFilter !== "other") {
      url += `&outStandingAmount=${amountFilter}`;
    }

    try {
      const res = await getRequest(url);
      if (res && res.response) {
        setDisplayData(res.response.content || []);
        setTotalPages(res.response.totalPages || 0);
        setTotalElements(res.response.totalElements || 0);
        setCurrentPage((res.response.number || 0) + 1);
      } else {
        setDisplayData([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      console.error("Error fetching bills:", error);
      setDisplayData([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
      setIsShowingAll(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBills(currentPage - 1);
  }, [currentPage]);

  // Details view states
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

  // Fetch payment history when admission is selected
  useEffect(() => {
    if (selectedAdmission && selectedAdmission.billingHeaderId) {
      setHistoryLoading(true);
      getRequest(`${GET_PREVIOUS_PAYMENT_HISTORY}/${selectedAdmission.billingHeaderId}`)
        .then(res => {
          if (res && res.response) {
            const mappedHistory = res.response.map((item, idx) => ({
              id: item.receiptId || idx,
              date: item.dateTime,
              paymentType: item.paymentType,
              paymentMode: item.paymentMode,
              amount: item.amount
            }));
            setPaymentHistory(mappedHistory);
          } else {
            setPaymentHistory([]);
          }
        })
        .catch(error => {
          console.error("Error fetching payment history:", error);
          setPaymentHistory([]);
        })
        .finally(() => {
          setHistoryLoading(false);
        });
    } else {
      setPaymentHistory([]);
    }
  }, [selectedAdmission]);

  const getOutstandingDotColor = (outstandingAmount) => {
    const value = parseFloat(String(outstandingAmount).replace(/,/g, "")) || 0;
    if (value === 0) return "#28a745";
    if (value <= 10000) return "#ffc107";
    return "#dc3545";
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle search with filters
  const handleSearch = () => {
    setIsSearching(true);
    setCurrentPage(1);
    fetchBills(0);
  };

  const handleShowAll = () => {
    setIsShowingAll(true);
    setWardFilter("");
    setBillTypeFilter("");
    setAmountFilter("");
    setCustomAmount("");
    setCurrentPage(1);
    
    setLoading(true);
    getRequest(`${GET_PENDING_TRACKING_IPD_BILL_LIST}?page=0&size=${DEFAULT_ITEMS_PER_PAGE}`)
      .then(res => {
        if (res?.response) {
          setDisplayData(res.response.content || []);
          setTotalPages(res.response.totalPages || 0);
          setTotalElements(res.response.totalElements || 0);
          setCurrentPage(1);
        }
      })
      .finally(() => {
        setLoading(false);
        setIsShowingAll(false);
      });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchBills(currentPage - 1);
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
                          <th>Patient Paid</th>
                          <th>Outstanding Amount</th>
                          <th>Bill Status</th>
                          <th className="text-center">View Bill (PDF)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={11} className="text-center py-4">
                              <LoadingScreen />
                            </td>
                          </tr>
                        ) : displayData.length === 0 ? (
                          <tr>
                            <td colSpan={11} className="text-center py-4 text-muted">
                              No pending IPD bills found.
                            </td>
                          </tr>
                        ) : (
                          displayData.map((item) => (
                            <tr
                              key={item.inpatientId}
                              onClick={() => handleRowClick(item)}
                              role="button"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") handleRowClick(item);
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              <td>{item.patientName}</td>
                              <td>{item.mobileNo}</td>
                              <td>{item.admissionNo}</td>
                              <td>{formatDate(item.admissionDateTime)}</td>
                              <td>{`${item.ward} / ${item.room || 'N/A'}`}</td>
                              <td>{item.billingType}</td>
                              <td>₹{item.totalAmount}</td>
                              <td>
                                <span
                                  className="d-inline-block rounded-circle me-2"
                                  style={{
                                    width: "10px",
                                    height: "10px",
                                    backgroundColor: getOutstandingDotColor(item.outStandingAmount),
                                  }}
                                ></span>
                                ₹{item.patientPaid}
                              </td>
                              <td>₹{item.outStandingAmount}</td>
                              <td>
                                <span
                                  className="badge"
                                  style={{
                                    backgroundColor: item.billStatus === "FINAL" ? "#28a745" : item.billStatus === "OPEN" ? "#ffc107" : "#6c757d",
                                    color: item.billStatus === "OPEN" ? "#000" : "#fff"
                                  }}
                                >
                                  {item.billStatus || "N/A"}
                                </span>
                              </td>
                              <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger"
                                  title="View Bill PDF"
                                  onClick={() => alert(`View PDF for ${item.admissionNo}`)}
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
                                value={formatDate(selectedAdmission.admissionDateTime) || ""}
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