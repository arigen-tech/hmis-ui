import { useState, useMemo } from "react";
import Popup from "../../../Components/popup";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

/**
 * Mock refund data – updated to include new fields:
 * age, gender, registrationDate, billingType
 */
const MOCK_REFUNDS = [
  {
    id: 1,
    registrationNo: "REG-1001",
    patientName: "Ananya Sharma",
    mobileNo: "9876543210",
    age: 28,
    gender: "Female",
    billingType: "OPD Consultation",
    registrationDate: "05/07/2026",
    billingAmount: 500,
    cancelledDate: "10/07/2026",
    refundDate: "12/07/2026",
    refundStatus: "Completed",
    refundAmount: 500,
    refundMode: "UPI",
    transactionRefNo: "UPI123456",
    processedBy: "Dr. Rao",
  },
  {
    id: 2,
    registrationNo: "REG-1002",
    patientName: "Vikram Singh",
    mobileNo: "8765432109",
    age: 35,
    gender: "Male",
    billingType: "Laboratory",
    registrationDate: "01/07/2026",
    billingAmount: 800,
    cancelledDate: "11/07/2026",
    refundDate: "-",
    refundStatus: "Pending",
    refundAmount: 800,
    refundMode: "-",
    transactionRefNo: "-",
    processedBy: "-",
  },
  {
    id: 3,
    registrationNo: "REG-1003",
    patientName: "Meera Patel",
    mobileNo: "7654321098",
    age: 42,
    gender: "Female",
    billingType: "Radiology",
    registrationDate: "03/07/2026",
    billingAmount: 1200,
    cancelledDate: "09/07/2026",
    refundDate: "13/07/2026",
    refundStatus: "Completed",
    refundAmount: 1200,
    refundMode: "Card",
    transactionRefNo: "TXN98765",
    processedBy: "Admin",
  },
  {
    id: 4,
    registrationNo: "REG-1004",
    patientName: "Rahul Gupta",
    mobileNo: "9876543211",
    age: 31,
    gender: "Male",
    billingType: "OPD Consultation",
    registrationDate: "02/07/2026",
    billingAmount: 300,
    cancelledDate: "12/07/2026",
    refundDate: "-",
    refundStatus: "Pending",
    refundAmount: 300,
    refundMode: "-",
    transactionRefNo: "-",
    processedBy: "-",
  },
  {
    id: 5,
    registrationNo: "REG-1005",
    patientName: "Sneha Iyer",
    mobileNo: "9876543212",
    age: 26,
    gender: "Female",
    billingType: "Laboratory",
    registrationDate: "04/07/2026",
    billingAmount: 950,
    cancelledDate: "08/07/2026",
    refundDate: "14/07/2026",
    refundStatus: "Completed",
    refundAmount: 950,
    refundMode: "Cash",
    transactionRefNo: "CASH-0001",
    processedBy: "Reception",
  },
];

const BillingRefundDetails = () => {
  // ---------- Search state ----------
  const [mobileNo, setMobileNo] = useState("");
  const [billingService, setBillingService] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [refundStatus, setRefundStatus] = useState("All"); // "Pending", "Completed", "All"

  // ---------- Pagination state ----------
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE;

  // ---------- View popup state ----------
  const [viewData, setViewData] = useState(null);
  const [showViewPopup, setShowViewPopup] = useState(false);

  // ---------- Popup messages ----------
  const [popupMessage, setPopupMessage] = useState(null);

  // ---------- Helper for date comparisons ----------
  const parseDate = (dateStr) => {
    if (!dateStr || dateStr === "-") return null;
    const [day, month, year] = dateStr.split("/");
    return new Date(year, month - 1, day);
  };

  // ---------- Filter logic (client side) ----------
  const filteredData = useMemo(() => {
    let data = [...MOCK_REFUNDS];

    // Apply search filters
    if (mobileNo.trim()) {
      data = data.filter((item) => item.mobileNo.includes(mobileNo.trim()));
    }

    if (billingService !== "All") {
      data = data.filter((item) => item.billingType === billingService);
    }

    // Date range filter – depends on refundStatus
    if (fromDate || toDate) {
      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;

      data = data.filter((item) => {
        let targetDate = null;

        if (refundStatus === "Pending") {
          targetDate = parseDate(item.cancelledDate);
        } else if (refundStatus === "Completed") {
          targetDate = parseDate(item.refundDate);
        } else {
          // "All": use cancelledDate for pending, refundDate for completed
          if (item.refundStatus === "Pending") {
            targetDate = parseDate(item.cancelledDate);
          } else {
            targetDate = parseDate(item.refundDate);
          }
        }

        if (!targetDate) return false;

        if (from && targetDate < from) return false;
        if (to && targetDate > to) return false;
        return true;
      });
    }

    // Filter by status (radio button)
    if (refundStatus !== "All") {
      data = data.filter((item) => item.refundStatus === refundStatus);
    }

    return data;
  }, [mobileNo, billingService, fromDate, toDate, refundStatus]);

  // ---------- Pagination slice ----------
  const totalElements = filteredData.length;
  const totalPages = Math.ceil(totalElements / itemsPerPage);
  const startIdx = currentPage * itemsPerPage;
  const currentPageData = filteredData.slice(startIdx, startIdx + itemsPerPage);

  // ---------- Handlers ----------
  const handleSearch = () => {
    setCurrentPage(0);
  };

  const handleReset = () => {
    setMobileNo("");
    setBillingService("All");
    setFromDate("");
    setToDate("");
    setRefundStatus("All");
    setCurrentPage(0);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page - 1);
  };

  const handleView = (item) => {
    setViewData(item);
    setShowViewPopup(true);
  };

  const handleExport = () => {
    setPopupMessage({
      message: "Export Refund Register (Completed refunds only) triggered. (Mock action)",
      type: "info",
      onClose: () => setPopupMessage(null),
    });
  };

  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title">Billing Refund Details</h4>
        </div>

        <div className="card-body">
          {/* Search Panel */}
          <div className="mb-3">
            <div className="row g-3 align-items-end">
              {/* Mobile No */}
              <div className="col-md-2">
                <div className="form-group mb-0">
                  <label className="form-label fw-bold mb-1">Patient Mobile No.</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter mobile number"
                    value={mobileNo}
                    onChange={(e) => setMobileNo(e.target.value)}
                  />
                </div>
              </div>

              {/* Billing Service */}
              <div className="col-md-2">
                <div className="form-group mb-0">
                  <label className="form-label fw-bold mb-1">Billing Service</label>
                  <select
                    className="form-select"
                    value={billingService}
                    onChange={(e) => setBillingService(e.target.value)}
                  >
                    <option value="All">All</option>
                    <option value="OPD Consultation">OPD Consultation</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Radiology">Radiology</option>
                  </select>
                </div>
              </div>

              {/* From Date */}
              <div className="col-md-2">
                <div className="form-group mb-0">
                  <label className="form-label fw-bold mb-1">From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
              </div>

              {/* To Date */}
              <div className="col-md-2">
                <div className="form-group mb-0">
                  <label className="form-label fw-bold mb-1">To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Refund Status Radio */}
              <div className="col-md-4">
                <div className="form-group mb-0">
                  <label className="form-label fw-bold mb-1">Refund Status</label>
                  <div className="d-flex gap-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="refundStatus"
                        id="statusPending"
                        value="Pending"
                        checked={refundStatus === "Pending"}
                        onChange={(e) => setRefundStatus(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="statusPending">
                        Pending
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="refundStatus"
                        id="statusCompleted"
                        value="Completed"
                        checked={refundStatus === "Completed"}
                        onChange={(e) => setRefundStatus(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="statusCompleted">
                        Completed
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="refundStatus"
                        id="statusAll"
                        value="All"
                        checked={refundStatus === "All"}
                        onChange={(e) => setRefundStatus(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="statusAll">
                        All
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="row mt-3">
              <div className="col-md-12 d-flex justify-content-end gap-2">
                <button className="btn btn-primary" onClick={handleSearch}>
                  Search
                </button>
                <button className="btn btn-secondary" onClick={handleReset}>
                  <i className="fas fa-redo-alt me-1"></i> Reset
                </button>
                <button className="btn btn-info" onClick={handleExport}>
                  <i className=" me-1"></i> Export Refund Register
                </button>
              </div>
            </div>
          </div>

          {/* Data Table – NEW COLUMNS */}
          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Registration No.</th>
                  <th>Patient Name</th>
                  <th>Mobile No.</th>
                  <th>Age/Gender</th>
                  <th>Billing Type</th>
                  <th>Registration Date</th>
                  <th>Billing Amount</th>
                  <th>Cancelled Date</th>
                  <th>Refund Date</th>
                  <th>Refund Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentPageData.length > 0 ? (
                  currentPageData.map((item) => (
                    <tr key={item.id}>
                      <td>{item.registrationNo}</td>
                      <td>{item.patientName}</td>
                      <td>{item.mobileNo}</td>
                      <td>{item.age}Y / {item.gender}</td>
                      <td>{item.billingType}</td>
                      <td>{item.registrationDate}</td>
                      <td>₹{item.billingAmount}</td>
                      <td>{item.cancelledDate}</td>
                      <td>{item.refundDate}</td>
                      <td>
                        <span
                          className={`badge ${
                            item.refundStatus === "Completed" ? "bg-success" : "bg-warning text-dark"
                          }`}
                        >
                          {item.refundStatus}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleView(item)}
                        >
                          <i className=" me-1"></i> View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" className="text-center text-muted py-4">
                      <i className="fas fa-search fa-2x mb-3"></i>
                      <p>No refund records found</p>
                      {(mobileNo ||
                        billingService !== "All" ||
                        fromDate ||
                        toDate ||
                        refundStatus !== "All") && (
                        <button
                          className="btn btn-sm btn-outline-secondary mt-2"
                          onClick={handleReset}
                        >
                          Reset Search
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {currentPageData.length > 0 && totalPages > 0 && (
            <Pagination
              totalItems={totalElements}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage + 1}
              onPageChange={handlePageChange}
              totalPages={totalPages}
            />
          )}
        </div>
      </div>

      {/* Popup message (for export simulation) */}
      {popupMessage && <Popup {...popupMessage} />}

      {/* View Refund Details Modal – CONTENT REDUCED */}
      {showViewPopup && viewData && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div
            className="modal-dialog modal-dialog-centered"
            style={{
              margin: "0 auto",
              position: "fixed",
              top: "50%",
              left: "55%",
              transform: "translate(-50%, -50%)",
              width: "50%",
              maxWidth: "500px",
              height: "auto",
              maxHeight: "80vh",
            }}
          >
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Refund Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowViewPopup(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="fw-bold">Refund Status</label>
                    <p>
                      <span
                        className={`badge ${
                          viewData.refundStatus === "Completed" ? "bg-success" : "bg-warning text-dark"
                        }`}
                      >
                        {viewData.refundStatus}
                      </span>
                    </p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="fw-bold">Refund Amount</label>
                    <p>₹{viewData.refundAmount}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="fw-bold">Refund Mode</label>
                    <p>{viewData.refundMode}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="fw-bold">Transaction / Ref. No.</label>
                    <p>{viewData.transactionRefNo}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="fw-bold">Refund Date</label>
                    <p>{viewData.refundDate}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="fw-bold">Processed By</label>
                    <p>{viewData.processedBy}</p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowViewPopup(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingRefundDetails;