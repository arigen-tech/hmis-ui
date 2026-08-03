import { useState, useMemo, useEffect } from "react";
import Pagination from "../../../Components/Pagination";
import { getRequest } from "../../../service/apiService";
import { GET_IPD_ADVANCE_COLLECTION } from "../../../config/apiConfig";

const PAYMENT_MODES = ["Cash", "UPI", "Card", "Cheque"];
const COLLECTION_TYPES = ["Advance", "Final"];

const IPDAdvanceCollection = () => {
  // Search parameters
  const [searchPatientName, setSearchPatientName] = useState("");
  const [searchMobileNo, setSearchMobileNo] = useState("");
  const [searchAdmissionNo, setSearchAdmissionNo] = useState("");
  
  // Pagination and data state
  const [admissionList, setAdmissionList] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // UI state
  const [showDetails, setShowDetails] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);

  const [collectionDate, setCollectionDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [collectionType, setCollectionType] = useState("Advance");
  const [paymentRows, setPaymentRows] = useState([
    { id: 1, mode: "Cash", amount: "" },
    { id: 2, mode: "UPI", amount: "" },
  ]);

  const fetchAdmissions = async (currentPage = page) => {
    setIsLoading(true);
    try {
      let url = `${GET_IPD_ADVANCE_COLLECTION}?page=${currentPage}&size=${size}`;
      if (searchPatientName.trim()) url += `&patientName=${searchPatientName.trim()}`;
      if (searchMobileNo.trim()) url += `&mobileNo=${searchMobileNo.trim()}`;
      if (searchAdmissionNo.trim()) url += `&admissionNo=${searchAdmissionNo.trim()}`;

      const res = await getRequest(url);
      if (res && res.response) {
        setAdmissionList(res.response.content || []);
        setTotalPages(res.response.totalPages || 0);
        setTotalElements(res.response.totalElements || 0);
        setPage(res.response.number || 0);
      } else {
        setAdmissionList([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      console.error("Error fetching IPD Advance Collection:", error);
      setAdmissionList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, [page]);

  const handleSearch = () => {
    setPage(0);
    fetchAdmissions(0);
  };

  const handleClear = () => {
    setSearchPatientName("");
    setSearchMobileNo("");
    setSearchAdmissionNo("");
    setPage(0);
    setIsLoading(true);
    getRequest(`${GET_IPD_ADVANCE_COLLECTION}?page=0&size=${size}`)
      .then(res => {
        if (res && res.response) {
          setAdmissionList(res.response.content || []);
          setTotalPages(res.response.totalPages || 0);
          setTotalElements(res.response.totalElements || 0);
          setPage(res.response.number || 0);
        } else {
          setAdmissionList([]);
          setTotalPages(0);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  const handleRowClick = (admission) => {
    setSelectedAdmission(admission);
    setCollectionDate(new Date().toISOString().split("T")[0]);
    setCollectionType("Advance");
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

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

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
                        <div className="col-md-3">
                          <label className="form-label fw-semibold">Patient Name</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter patient name"
                            value={searchPatientName}
                            onChange={(e) => setSearchPatientName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-semibold">Mobile No</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter mobile no"
                            value={searchMobileNo}
                            onChange={(e) => setSearchMobileNo(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-semibold">Admission No</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter admission no"
                            value={searchAdmissionNo}
                            onChange={(e) => setSearchAdmissionNo(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                          />
                        </div>
                        <div className="col-md-3">
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
                        {isLoading ? (
                          <tr>
                            <td colSpan="8" className="text-center py-4">
                              <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            </td>
                          </tr>
                        ) : admissionList.length > 0 ? (
                          admissionList.map((item) => (
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
                              <td>
                                {item.age} / {item.gender}
                              </td>
                              <td>{item.mobileNo}</td>
                              <td>
                                {item.ward || "N/A"}/{item.room || "N/A"}/{item.bed || "N/A"}
                              </td>
                              <td>{formatDate(item.admissionDateTime)}</td>
                              <td>
                                <span className="badge bg-info">
                                  {item.billingType || "N/A"}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="text-center py-3 text-muted">
                              No active admissions found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {admissionList.length > 0 && !isLoading && (
                    <Pagination
                      totalItems={totalElements}
                      itemsPerPage={size}
                      currentPage={page + 1}
                      onPageChange={(p) => setPage(p - 1)}
                    />
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

                          {/* Add Row button - Positioned above the table */}
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

                          {/* Footer: Total Amount + Submit button */}
                          <div className="d-flex justify-content-between align-items-center mt-3">
                            <h5 className="fw-bold mb-0">
                              Total Amount: ₹{totalAmount}
                            </h5>
                            <button
                              type="button"
                              className="btn btn-warning"
                              disabled={Number(totalAmount) <= 0}
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

export default IPDAdvanceCollection;