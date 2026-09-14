import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import Pagination, {
  DEFAULT_ITEMS_PER_PAGE,
} from "../../../Components/Pagination";
import { getRequest } from "../../../service/apiService";
import { GET_BLOOD_REQUEST_TRACKING } from "../../../config/apiConfig";

const displayValue = (value) =>
  value === null || value === undefined ? "" : value;

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (number) => String(number).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const BloodRequestTracking = () => {
  const [requestData, setRequestData] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [inpatientNo, setInpatientNo] = useState("");
  const [patientName, setPatientName] = useState("");
  const [requestNumber, setRequestNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchRequests = useCallback(async (page = 0, filters = {}) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        size: String(DEFAULT_ITEMS_PER_PAGE),
      });
      if (filters.inpatientNo?.trim())
        params.set("inpatientNo", filters.inpatientNo.trim());
      if (filters.patientName?.trim())
        params.set("patientName", filters.patientName.trim());
      const response = await getRequest(
        `${GET_BLOOD_REQUEST_TRACKING}?${params.toString()}`,
      );
      const responsePage = response?.response;
      setRequestData(
        Array.isArray(responsePage?.content) ? responsePage.content : [],
      );
      setTotalItems(responsePage?.totalElements || 0);
    } catch (error) {
      console.error("Error fetching blood request tracking data:", error);
      setRequestData([]);
      setTotalItems(0);
      Swal.fire(
        "Unable to Load Data",
        error?.message || "Blood request tracking data could not be loaded.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests(0);
  }, [fetchRequests]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchRequests(0, { inpatientNo, patientName });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchRequests(page - 1, { inpatientNo, patientName });
  };

  const getUrgencyBadge = (urgency) => {
    const badgeClasses = {
      Emergency: "bg-danger",
      Urgent: "bg-warning text-dark",
      Routine: "bg-info",
    };
    return urgency ? (
      <span className={`badge ${badgeClasses[urgency] || "bg-secondary"}`}>
        {urgency}
      </span>
    ) : (
      ""
    );
  };

  const getTrackingStatusBadge = (status) => {
    const badgeClasses = {
      Pending: "bg-secondary",
      "Cross Matching": "bg-warning text-dark",
      "Compatibility Testing": "bg-info",
      Issued: "bg-success",
      Rejected: "bg-danger",
    };
    return status ? (
      <span className={`badge ${badgeClasses[status] || "bg-secondary"}`}>
        {status}
      </span>
    ) : (
      ""
    );
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title">Blood Request Tracking</h4>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-sm-12">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3">
                        <label className="form-label fw-semibold">
                          Inpatient Number
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter inpatient number"
                          value={inpatientNo}
                          onChange={(event) =>
                            setInpatientNo(event.target.value)
                          }
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-semibold">
                          Patient Name
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter patient name"
                          value={patientName}
                          onChange={(event) =>
                            setPatientName(event.target.value)
                          }
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-semibold">
                          Request Number
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter request number"
                          value={requestNumber}
                          onChange={(event) =>
                            setRequestNumber(event.target.value)
                          }
                        />
                      </div>
                      <div className="col-md-2 d-flex align-items-end">
                        <button
                          type="button"
                          className="btn btn-success"
                          onClick={handleSearch}
                          disabled={isLoading}
                        >
                          {isLoading ? "Searching..." : "Search"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Request No</th>
                      <th>Inpatient No</th>
                      <th>Patient Name</th>
                      <th>Blood Group</th>
                      <th>Component</th>
                      <th>Units</th>
                      <th>Urgency</th>
                      <th>Requested Date &amp; Time</th>
                      <th>Required By</th>
                      <th>Tracking Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan="10" className="text-center py-4">
                          Loading...
                        </td>
                      </tr>
                    ) : requestData.length > 0 ? (
                      requestData.map((request, index) => (
                        <tr
                          key={`${request.inpatientId}-${request.component}-${request.requestedDateTime}-${index}`}
                        >
                          <td>{displayValue(request.requestNo)}</td>
                          <td>{displayValue(request.inpatientNo)}</td>
                          <td>{displayValue(request.patientName)}</td>
                          <td>{displayValue(request.bloodGroup)}</td>
                          <td>{displayValue(request.component)}</td>
                          <td className="text-center fw-bold">
                            {displayValue(request.units)}
                          </td>
                          <td>{getUrgencyBadge(request.urgency)}</td>
                          <td>{formatDateTime(request.requestedDateTime)}</td>
                          <td>{formatDateTime(request.requiredByDateTime)}</td>
                          <td>
                            {getTrackingStatusBadge(request.trackingStatus)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10" className="text-center py-4">
                          <div className="text-muted">
                            <h6 className="mt-2">No blood requests found</h6>
                            <p className="mb-0">
                              Try adjusting your search criteria
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalItems > 0 && (
                <Pagination
                  totalItems={totalItems}
                  itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodRequestTracking;
