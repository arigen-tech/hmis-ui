import { useEffect, useMemo, useState } from "react";
import Popup from "../../../Components/popup";
import Pagination, {
  DEFAULT_ITEMS_PER_PAGE,
} from "../../../Components/Pagination";
import { getRequest } from "../../../service/apiService";
import { GET_PROCEDURE_WORKLIST } from "../../../config/apiConfig";

const ProcedureWorklist = () => {
  const [tableLoading, setTableLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showAllLoading, setShowAllLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchMobile, setSearchMobile] = useState("");
  const [searchPatient, setSearchPatient] = useState("");
  const [popupMessage, setPopupMessage] = useState(null);

  const showPopup = (message, type = "info") => {
    setPopupMessage({ message, type });
  };

  const fetchWorklist = async (page = 0, options = {}) => {
    const { loadingType = "table" } = options;
    try {
      if (loadingType === "search") {
        setSearchLoading(true);
      } else if (loadingType === "showAll") {
        setShowAllLoading(true);
      } else {
        setTableLoading(true);
      }
      const queryParams = new URLSearchParams();
      queryParams.append("page", String(page));
      queryParams.append("size", DEFAULT_ITEMS_PER_PAGE);
      if (searchMobile.trim()) {
        queryParams.append("mobileNo", searchMobile.trim());
      }
      if (searchPatient.trim()) {
        queryParams.append("patientName", searchPatient.trim());
      }

      const response = await getRequest(
        `${GET_PROCEDURE_WORKLIST}?${queryParams.toString()}`,
      );

      const payload = response?.data || response?.response || {};
      const content = payload.content || [];
      if (response?.status === 200) {
        setRows(Array.isArray(content) ? content : []);
        setTotalItems(payload.totalElements || 0);
        setTotalPages(payload.totalPages || 0);
      } else {
        setRows([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error("Error fetching procedure worklist:", error);
      setRows([]);
      setTotalItems(0);
      setTotalPages(0);
      showPopup("Failed to fetch procedure worklist.", "error");
    } finally {
      setTableLoading(false);
      setSearchLoading(false);
      setShowAllLoading(false);
    }
  };

  useEffect(() => {
    fetchWorklist(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleReset = () => {
    setSearchMobile("");
    setSearchPatient("");
    setCurrentPage(0);
    fetchWorklist(0, { loadingType: "showAll" });
  };

  const handleSearch = () => {
    setCurrentPage(0);
    fetchWorklist(0, { loadingType: "search" });
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const pad = (num) => String(num).padStart(2, "0");
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(
      date.getHours(),
    )}:${pad(date.getMinutes())}`;
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">Procedure Worklist</h4>
            </div>

            <div className="card-body">
              {/* Search Section - Matches OPD Billing styling */}
              <div className="mb-4">
                <div className="card-body">
                  <div className="row g-4 align-items-end">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">
                        Mobile No.
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="mobileNo"
                        placeholder="Enter Mobile number"
                        value={searchMobile}
                        onChange={(e) => {
                          setSearchMobile(e.target.value);
                          setCurrentPage(0);
                        }}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">
                        Patient Name
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="patientName"
                        placeholder="Enter patient name"
                        value={searchPatient}
                        onChange={(e) => {
                          setSearchPatient(e.target.value);
                          setCurrentPage(0);
                        }}
                      />
                    </div>
                    <div className="col-md-4">
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-primary flex-fill"
                          onClick={handleSearch}
                          disabled={searchLoading || showAllLoading}
                        >
                          {searchLoading ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              />
                              Searching...
                            </>
                          ) : (
                            <>
                              <i className="mdi mdi-magnify"></i> Search
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary flex-fill"
                          onClick={handleReset}
                          disabled={searchLoading || showAllLoading}
                        >
                          {showAllLoading ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              />
                              Loading...
                            </>
                          ) : (
                            "Show All"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Section */}
              {tableLoading ? (
                <div className="text-center py-5">
                  <div
                    className="spinner-border text-primary"
                    role="status"
                    aria-hidden="true"
                  />
                  <div className="mt-3 text-muted">Loading procedure worklist...</div>
                </div>
              ) : rows.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>S.N.</th>
                        <th>Patient</th>
                        <th>Mobile</th>
                        <th>Age</th>
                        <th>Gender</th>
                        <th>Department</th>
                        <th>Procedure</th>
                        <th>Sessions</th>
                        <th>Scheduled At</th>
                        <th>Advised By</th>
                        <th>Billing Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((item, index) => (
                        <tr key={`${item.procedureHdId}-${item.procedureDtId}`}>
                          <td>
                            {currentPage * DEFAULT_ITEMS_PER_PAGE + index + 1}
                          </td>
                          <td>{item.patientName || "-"}</td>
                          <td>{item.mobileNo || "-"}</td>
                          <td>{item.age ?? "-"}</td>
                          <td>{item.gender || "-"}</td>
                          <td>{item.department || "-"}</td>
                          <td>{item.procedure || "-"}</td>
                          <td>
                            {item.completedSessions ?? 0}/
                            {item.totalSessions ?? 0}
                          </td>
                          <td>{formatDateTime(item.scheduledDateTime)}</td>
                          <td>{item.advisedBy || "-"}</td>
                          <td>
                            <span className="badge bg-warning text-dark">
                              {item.billingStatus || "-"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="alert alert-info" role="alert">
                  <i className="mdi mdi-information"></i> No procedure worklist
                  records found.
                </div>
              )}

              {rows.length > 0 && (
                <Pagination
                  totalItems={totalItems}
                  itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                  currentPage={currentPage + 1}
                  onPageChange={(page) => {
                    setCurrentPage(page - 1);
                    fetchWorklist(page - 1);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={() => setPopupMessage(null)}
        />
      )}
    </div>
  );
};

export default ProcedureWorklist;
