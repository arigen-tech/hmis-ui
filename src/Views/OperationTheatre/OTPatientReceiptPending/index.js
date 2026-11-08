import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, putRequest } from "../../../service/apiService";
import {
  GET_ALL_ACT_MAS_DEPT_FOR_DROPDOWN_END_URL,
  OT_PATIENT_RECEIPT_LIST,
  SENT_TO_OT,
} from "../../../config/apiConfig";

// Helper to format scheduled date and start/end time
const formatScheduleDateTime = (item) => {
  const date = item.preferredDate || item.date || "";
  const startTime = item.preferredStartTime || item.time || "";
  const endTime = item.preferredEndTime || item.endTime || "";
  if (!date && !startTime) return "-";
  if (startTime && endTime) {
    return `${date} (${startTime} - ${endTime})`.trim();
  }
  return `${date} ${startTime}`.trim();
};

// Helper to format sent to OT timestamp
const formatSentToOTTime = (item) => {
  if (item.sentToOTTime) return item.sentToOTTime;
  if (item.bookedDate) {
    return item.bookedDate.replace("T", " ").split(".")[0];
  }
  return "-";
};

const OTPatientReceiptPending = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [department, setDepartment] = useState("");
  const [departmentList, setDepartmentList] = useState([]);
  const [appliedFilters, setAppliedFilters] = useState({ search: "", departmentId: "" });

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [receivedBy, setReceivedBy] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // ----- Fetch Department Dropdown -----
  const fetchDepartments = async () => {
    try {
      const res = await getRequest(
        `${GET_ALL_ACT_MAS_DEPT_FOR_DROPDOWN_END_URL}?departmentTypeCode=OPD`
      );
      if (res?.response && Array.isArray(res.response)) {
        setDepartmentList(res.response);
      } else {
        setDepartmentList([]);
      }
    } catch (error) {
      console.error("Error fetching department dropdown:", error);
      setDepartmentList([]);
    }
  };

  // ----- Fetch Patient Receipt List -----
  const fetchPatientReceiptList = async (
    page = 0,
    search = appliedFilters.search,
    departmentId = appliedFilters.departmentId
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page,
        size: DEFAULT_ITEMS_PER_PAGE,
      });

      if (search && search.trim()) {
        params.append("search", search.trim());
      }
      if (departmentId !== "" && departmentId !== undefined && departmentId !== null) {
        params.append("departmentId", departmentId);
      }

      const res = await getRequest(`${OT_PATIENT_RECEIPT_LIST}?${params.toString()}`);

      if (res?.response?.content) {
        const normalized = res.response.content.map((item, idx) => {
          const surgeryNames =
            Array.isArray(item.surgeries) && item.surgeries.length > 0
              ? item.surgeries.map((s) => s.surgeryName).filter(Boolean)
              : item.surgeryName
              ? [item.surgeryName]
              : [];
          const surgeryString =
            surgeryNames.length > 0 ? surgeryNames.join(", ") : (item.surgery || "-");

          return {
            ...item,
            id: item.otBookingId ?? item.id ?? (page * DEFAULT_ITEMS_PER_PAGE + idx + 1),
            otBookingId: item.otBookingId,
            uhidOrIp: item.uhidNo || item.uhid || item.ipNo || "-",
            patientName: item.patientName || "-",
            ageGender:
              item.ageGender ||
              (item.age || item.gender
                ? `${item.age ? item.age + " Y" : ""} ${item.gender ? "/ " + item.gender : ""}`.trim()
                : "-"),
            department: item.departmentName || item.department || "-",
            wardBed:
              item.wardBed ||
              (item.wardName
                ? `${item.wardName}${item.bedName ? " / " + item.bedName : ""}`
                : "-"),
            surgery: surgeryString,
            surgeon: item.surgeonName || item.primarySurgeon || item.surgeon || "-",
            ot: item.otName || item.ot || "-",
            scheduledDateTime: formatScheduleDateTime(item),
            sentToOTTime: formatSentToOTTime(item),
            sentBy:
              item.sentBy || item.bookedBy || item.primarySurgeonName || item.surgeonName || "-",
          };
        });

        setData(normalized);
        setTotalPages(res.response.totalPages || 0);
        setTotalItems(res.response.totalElements || 0);
      } else {
        setData([]);
        setTotalPages(0);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching OT patient receipt list:", error);
      showPopup("Failed to fetch pending patient receipt list.", "error");
      setData([]);
      setTotalPages(0);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchPatientReceiptList(0, "", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchPatientReceiptList(page - 1, appliedFilters.search, appliedFilters.departmentId);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    const newFilters = { search: searchQuery, departmentId: department };
    setAppliedFilters(newFilters);
    fetchPatientReceiptList(0, searchQuery, department);
  };

  const handleReset = () => {
    setSearchQuery("");
    setDepartment("");
    setCurrentPage(1);
    const resetFilters = { search: "", departmentId: "" };
    setAppliedFilters(resetFilters);
    fetchPatientReceiptList(0, "", "");
  };

  const openModal = (record) => {
    setSelectedRecord(record);
    setReceivedBy("");
    setRemarks("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRecord(null);
    setReceivedBy("");
    setRemarks("");
  };

  const handleConfirm = async () => {
    if (!receivedBy.trim()) {
      showPopup("Please enter the Received By name.", "error");
      return;
    }

    const otBookingId = selectedRecord?.otBookingId || selectedRecord?.id;
    if (!otBookingId) {
      showPopup("OT Booking ID not found.", "error");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await putRequest(
        `${SENT_TO_OT}?otBookingId=${encodeURIComponent(otBookingId)}&status=RECEIVED_IN_OT`
      );

      if (
        res?.status === 200 ||
        res?.status === 201 ||
        res?.statuss === "success" ||
        res?.message === "success" ||
        res?.response
      ) {
        closeModal();
        showPopup("Patient received in OT successfully!", "success");
        fetchPatientReceiptList(currentPage - 1, appliedFilters.search, appliedFilters.departmentId);
      } else {
        showPopup(res?.message || "Failed to receive patient in OT.", "error");
      }
    } catch (error) {
      console.error("Error receiving patient in OT:", error);
      showPopup(error?.message || "Failed to confirm receipt.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const showPopup = (message, type, onCloseCallback = null) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
        if (onCloseCallback) onCloseCallback();
      },
    });
  };

  return (
    <div className="content-wrapper">
      {loading && <LoadingScreen />}
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">OT Patient Receipt</h4>
            </div>
            <div className="card-body">
              {/* Search / Filter Section */}
              <div className="mb-4">
                <div className="row g-3 align-items-end">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Search</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="UHID, Patient, Surgery, Surgeon..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSearch();
                        }
                      }}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Department</label>
                    <select
                      className="form-select"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    >
                      <option value="">All</option>
                      {departmentList.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.departmentName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3 d-flex gap-2">
                    <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
                      <i className="fa fa-search me-1"></i> Search
                    </button>
                    <button className="btn btn-secondary" onClick={handleReset} disabled={loading}>
                      <i className="fa fa-refresh me-1"></i> Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>UHID / IP No.</th>
                      <th>Patient Name</th>
                      <th>Age / Gender</th>
                      <th>Department</th>
                      <th>Ward / Bed</th>
                      <th>Surgery</th>
                      <th>Surgeon</th>
                      <th>OT</th>
                      <th>Scheduled Date / Time</th>
                      <th>Sent to OT Time</th>
                      <th>Sent By</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.length > 0 ? (
                      data.map((item) => (
                        <tr key={item.id}>
                          <td>{item.uhidOrIp}</td>
                          <td>{item.patientName}</td>
                          <td>{item.ageGender}</td>
                          <td>{item.department}</td>
                          <td>{item.wardBed}</td>
                          <td>{item.surgery}</td>
                          <td>{item.surgeon}</td>
                          <td>{item.ot}</td>
                          <td>{item.scheduledDateTime}</td>
                          <td>{item.sentToOTTime}</td>
                          <td>{item.sentBy}</td>
                          <td className="text-center">
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => openModal(item)}
                              title="Receive Patient"
                            >
                              Receive
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="12" className="text-center py-4 text-muted">
                          <i className="fa fa-info-circle me-1"></i> No patients pending receipt.
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
                  totalPages={totalPages}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== RECEIVE PATIENT MODAL ===== */}
      {showModal && selectedRecord && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Receive Patient in OT</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                  disabled={isProcessing}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>Patient:</strong> {selectedRecord.patientName} ({selectedRecord.uhidOrIp})
                </p>
                <p>
                  <strong>Surgery:</strong> {selectedRecord.surgery}
                </p>
                <p>
                  <strong>Surgeon:</strong> {selectedRecord.surgeon}
                </p>
                <p>
                  <strong>OT:</strong> {selectedRecord.ot}
                </p>
                <p>
                  <strong>Ward / Bed:</strong> {selectedRecord.wardBed}
                </p>
                <p>
                  <strong>Scheduled Date/Time:</strong> {selectedRecord.scheduledDateTime}
                </p>
                <p>
                  <strong>Sent to OT Time:</strong> {selectedRecord.sentToOTTime}{" "}
                  {selectedRecord.sentBy && selectedRecord.sentBy !== "-"
                    ? `by ${selectedRecord.sentBy}`
                    : ""}
                </p>

                <div className="mb-3">
                  <label className="form-label fw-bold">
                    Received By <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                    placeholder="Enter receiving nurse/staff name"
                    disabled={isProcessing}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Remarks (Optional)</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Any additional notes..."
                    disabled={isProcessing}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleConfirm}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Processing...
                    </>
                  ) : (
                    "Confirm Receipt"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}
    </div>
  );
};

export default OTPatientReceiptPending;
