import { useState, useEffect, useCallback } from "react";
import { getRequest } from "../../../../service/apiService";
import {
  GET_OT_DASHBOARD,
  GET_OT_DEPARTMENTS,
  MAS_OPERATION_THEATRE_GET_ALL,
  OT_BOOKING_HISTORY,
} from "../../../../config/apiConfig";

const months = [
  { label: "January", value: "1" },
  { label: "February", value: "2" },
  { label: "March", value: "3" },
  { label: "April", value: "4" },
  { label: "May", value: "5" },
  { label: "June", value: "6" },
  { label: "July", value: "7" },
  { label: "August", value: "8" },
  { label: "September", value: "9" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

const now = new Date();
const currentMonth = String(now.getMonth() + 1);
const currentYear = String(now.getFullYear());

// Generate dynamic year options around current year (e.g. currentYear - 3 to currentYear + 3)
const years = Array.from({ length: 7 }, (_, i) =>
  String(now.getFullYear() - 3 + i)
);

const OTDashboard = () => {
  // ----- Filters State (auto-selected to current month and year) -----
  const [filters, setFilters] = useState({
    month: currentMonth,
    year: currentYear,
    otId: "",
    departmentId: "",
  });

  // Dropdown options
  const [otOptions, setOtOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Summary State
  const [summary, setSummary] = useState({
    totalCases: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
  });

  // Calendar Weeks Data
  const [weeksData, setWeeksData] = useState([]);

  // Modal State
  const [selectedDay, setSelectedDay] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalBookings, setModalBookings] = useState([]);
  const [loadingModalBookings, setLoadingModalBookings] = useState(false);

  // Helper for hospitalId
  const getHospitalId = () => {
    return (
      sessionStorage.getItem("hospitalId") ||
      localStorage.getItem("hospitalId") ||
      sessionStorage.getItem("hospital_id") ||
      localStorage.getItem("hospital_id") ||
      12
    );
  };

  // ----- Fetch OT & Department Dropdowns on Mount -----
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        setLoadingDropdowns(true);

        // Fetch OT List
        try {
          const otRes = await getRequest(`${MAS_OPERATION_THEATRE_GET_ALL}/1`);
          if (otRes?.response && Array.isArray(otRes.response)) {
            const activeOts = otRes.response.filter(
              (o) => !o.status || o.status.toLowerCase() === "y"
            );
            setOtOptions(activeOts);
          } else {
            setOtOptions([]);
          }
        } catch (otErr) {
          console.error("Error fetching OT list:", otErr);
          setOtOptions([]);
        }

        // Fetch Departments List
        try {
          const hospitalId = getHospitalId();
          const deptRes = await getRequest(
            `${GET_OT_DEPARTMENTS}?hospitalId=${encodeURIComponent(hospitalId)}`
          );
          if (deptRes?.response && Array.isArray(deptRes.response)) {
            setDepartmentOptions(deptRes.response);
          } else {
            setDepartmentOptions([]);
          }
        } catch (deptErr) {
          console.error("Error fetching OT departments:", deptErr);
          setDepartmentOptions([]);
        }
      } finally {
        setLoadingDropdowns(false);
      }
    };

    fetchDropdowns();
  }, []);

  // ----- Fetch Dashboard Data -----
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoadingDashboard(true);
      let url = `${GET_OT_DASHBOARD}?month=${encodeURIComponent(
        filters.month
      )}&year=${encodeURIComponent(filters.year)}`;

      if (filters.otId) {
        url += `&otId=${encodeURIComponent(filters.otId)}`;
      }
      if (filters.departmentId) {
        url += `&departmentId=${encodeURIComponent(filters.departmentId)}`;
      }

      const res = await getRequest(url);
      const data = Array.isArray(res?.response) ? res.response : [];
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching OT dashboard data:", error);
      setDashboardData([]);
    } finally {
      setLoadingDashboard(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ----- Build Calendar and Summary from Dashboard Data -----
  useEffect(() => {
    const monthNum = parseInt(filters.month, 10) || 8;
    const yearNum = parseInt(filters.year, 10) || 2026;
    const monthIndex = monthNum - 1;
    const daysInMonth = new Date(yearNum, monthIndex + 1, 0).getDate();

    // Map API data by scheduledDate (e.g. "2026-08-24")
    const dataMap = {};
    let totalCases = 0;
    let scheduled = 0;
    let completed = 0;
    let cancelled = 0;

    if (Array.isArray(dashboardData)) {
      dashboardData.forEach((item) => {
        if (item.scheduledDate) {
          dataMap[item.scheduledDate] = item;
        }
        if (Array.isArray(item.statuses)) {
          item.statuses.forEach((st) => {
            const cnt = Number(st.count || 0);
            totalCases += cnt;
            const sName = (st.statusName || "").toLowerCase();
            if (sName.includes("schedule")) {
              scheduled += cnt;
            } else if (sName.includes("complete")) {
              completed += cnt;
            } else if (sName.includes("cancel") || sName.includes("reject")) {
              cancelled += cnt;
            }
          });
        }
      });
    }

    setSummary({ totalCases, scheduled, completed, cancelled });

    // Build days array
    const monthObj = months.find((m) => m.value === String(monthNum));
    const monthLabel = monthObj ? monthObj.label : "August";
    const daysData = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(yearNum, monthIndex, d);
      const dayOfWeek = dateObj.getDay();
      const dateStr = `${yearNum}-${String(monthNum).padStart(2, "0")}-${String(
        d
      ).padStart(2, "0")}`;
      const displayDate = `${d}-${monthLabel.substring(0, 3)}-${yearNum}`;

      const apiDay = dataMap[dateStr];

      let dayScheduled = 0;
      let dayCompleted = 0;
      let dayCancelled = 0;
      let dayStatuses = [];
      let dayOtNames = "";

      if (apiDay) {
        dayStatuses = apiDay.statuses || [];
        dayOtNames = apiDay.otNames || "";
        dayStatuses.forEach((st) => {
          const cnt = Number(st.count || 0);
          const sName = (st.statusName || "").toLowerCase();
          if (sName.includes("schedule")) {
            dayScheduled += cnt;
          } else if (sName.includes("complete")) {
            dayCompleted += cnt;
          } else if (sName.includes("cancel") || sName.includes("reject")) {
            dayCancelled += cnt;
          }
        });
      }

      daysData.push({
        date: displayDate,
        dateStr: dateStr,
        scheduled: dayScheduled,
        completed: dayCompleted,
        cancelled: dayCancelled,
        statuses: dayStatuses,
        otNames: dayOtNames,
        otList: dayOtNames ? [dayOtNames] : [],
        dayOfWeek,
        hasData: !!apiDay,
      });
    }

    // Build weeks array (Monday to Sunday)
    const firstDay = new Date(yearNum, monthIndex, 1).getDay(); // 0=Sun, 1=Mon
    const firstMondayOffset = firstDay === 0 ? 6 : firstDay - 1;

    const weeks = [];
    let currentWeek = [];
    for (let i = 0; i < firstMondayOffset; i++) {
      currentWeek.push(null);
    }
    for (let i = 0; i < daysData.length; i++) {
      currentWeek.push(daysData[i]);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    setWeeksData(weeks);
  }, [dashboardData, filters.month, filters.year]);

  // ----- Handlers -----
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    fetchDashboardData();
  };

  const handleReset = () => {
    const today = new Date();
    setFilters({
      month: String(today.getMonth() + 1),
      year: String(today.getFullYear()),
      otId: "",
      departmentId: "",
    });
  };

  const handleDayClick = async (dayData) => {
    if (!dayData) return;
    setSelectedDay(dayData);
    setShowModal(true);

    // Fetch matching bookings for that scheduled date from API
    try {
      setLoadingModalBookings(true);
      const url = `${OT_BOOKING_HISTORY}?scheduledDate=${encodeURIComponent(
        dayData.dateStr
      )}&page=0&size=50`;
      const res = await getRequest(url);
      const list =
        res?.response?.content ||
        (Array.isArray(res?.response) ? res.response : []);
      setModalBookings(list);
    } catch (err) {
      console.error("Error fetching day booking history:", err);
      setModalBookings([]);
    } finally {
      setLoadingModalBookings(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDay(null);
    setModalBookings([]);
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2 mb-0">OT BOOKING DASHBOARD</h4>
              {loadingDashboard && (
                <span className="text-muted small">
                  <span className="spinner-border spinner-border-sm me-1" />
                  Updating dashboard...
                </span>
              )}
            </div>
            <div className="card-body">
              {/* Filter Section */}
              <div className="card mb-3">
                <div className="card-body">
                  <div className="row g-3 align-items-end">
                    <div className="col-md-2">
                      <label className="form-label fw-bold">Month *</label>
                      <select
                        className="form-select"
                        value={filters.month}
                        onChange={(e) =>
                          handleFilterChange("month", e.target.value)
                        }
                      >
                        {months.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-2">
                      <label className="form-label fw-bold">Year *</label>
                      <select
                        className="form-select"
                        value={filters.year}
                        onChange={(e) =>
                          handleFilterChange("year", e.target.value)
                        }
                      >
                        {years.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label fw-bold">OT</label>
                      <select
                        className="form-select"
                        value={filters.otId}
                        onChange={(e) =>
                          handleFilterChange("otId", e.target.value)
                        }
                        disabled={loadingDropdowns}
                      >
                        <option value="">All OT</option>
                        {otOptions.map((ot) => (
                          <option key={ot.otId} value={ot.otId}>
                            {ot.otName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label fw-bold">Department</label>
                      <select
                        className="form-select"
                        value={filters.departmentId}
                        onChange={(e) =>
                          handleFilterChange("departmentId", e.target.value)
                        }
                        disabled={loadingDropdowns}
                      >
                        <option value="">All Departments</option>
                        {departmentOptions.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-2 d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSearch}
                        disabled={loadingDashboard}
                      >
                        {loadingDashboard ? "SEARCHING..." : "SEARCH"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleReset}
                        disabled={loadingDashboard}
                      >
                        RESET
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Summary (colored cards) */}
              <div className="row mb-3">
                <div className="col-12">
                  <div className="d-flex flex-wrap gap-3">
                    <div
                      className="card bg-primary text-white p-3 flex-fill"
                      style={{ minWidth: "120px" }}
                    >
                      <div className="small">Total Cases</div>
                      <div className="h4 mb-0">{summary.totalCases}</div>
                    </div>
                    <div
                      className="card bg-info text-white p-3 flex-fill"
                      style={{ minWidth: "120px" }}
                    >
                      <div className="small">Scheduled</div>
                      <div className="h4 mb-0">{summary.scheduled}</div>
                    </div>
                    <div
                      className="card bg-success text-white p-3 flex-fill"
                      style={{ minWidth: "120px" }}
                    >
                      <div className="small">Completed</div>
                      <div className="h4 mb-0">{summary.completed}</div>
                    </div>
                    <div
                      className="card bg-danger text-white p-3 flex-fill"
                      style={{ minWidth: "120px" }}
                    >
                      <div className="small">Cancelled / Rejected</div>
                      <div className="h4 mb-0">{summary.cancelled}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="calendar-container">
                <div className="row g-2 mb-2">
                  {[
                    "MONDAY",
                    "TUESDAY",
                    "WEDNESDAY",
                    "THURSDAY",
                    "FRIDAY",
                    "SATURDAY",
                    "SUNDAY",
                  ].map((day) => (
                    <div key={day} className="col text-center fw-bold">
                      {day}
                    </div>
                  ))}
                </div>

                {weeksData.map((week, weekIndex) => (
                  <div key={weekIndex} className="row g-2 mb-3">
                    {week.map((day, dayIndex) => (
                      <div key={dayIndex} className="col">
                        <div
                          className="card p-2 h-100 border"
                          style={{
                            minHeight: "140px",
                            backgroundColor: day?.hasData
                              ? "#fff9e6"
                              : "#ffffff",
                            cursor: day ? "pointer" : "default",
                            transition: "background-color 0.2s, box-shadow 0.2s",
                          }}
                          onClick={() => handleDayClick(day)}
                        >
                          {day ? (
                            <>
                              <div className="fw-bold small">{day.date}</div>

                              {day.statuses && day.statuses.length > 0 ? (
                                <div className="mt-1">
                                  {day.statuses.map((st, i) => {
                                    const sNameLower = (
                                      st.statusName || ""
                                    ).toLowerCase();
                                    const isDone =
                                      sNameLower.includes("complete");
                                    const isReject =
                                      sNameLower.includes("cancel") ||
                                      sNameLower.includes("reject");
                                    return (
                                      <div
                                        key={i}
                                        className={`small fw-semibold ${
                                          isDone
                                            ? "text-success"
                                            : isReject
                                            ? "text-danger"
                                            : "text-dark"
                                        }`}
                                      >
                                        {st.statusName}: {st.count}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="small text-muted mt-2">
                                  No Bookings
                                </div>
                              )}

                              {day.otNames && (
                                <div
                                  className="small text-muted mt-1 fw-bold text-truncate"
                                  title={day.otNames}
                                  style={{ fontSize: "0.72rem" }}
                                >
                                  {day.otNames}
                                </div>
                              )}

                              {day.hasData && (
                                <div
                                  className="small text-primary mt-auto pt-1"
                                  style={{ fontSize: "0.72rem" }}
                                >
                                  Click for details
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-muted small text-center my-auto">
                              —
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="row mt-3">
                <div className="col-12">
                  <div className="d-flex gap-3 flex-wrap">
                    <span className="badge bg-light text-dark border">
                      <span className="text-danger me-1">●</span> Cancelled / Rejected
                    </span>
                    <span className="badge bg-light text-dark border">
                      <span className="text-warning me-1">●</span> Scheduled
                    </span>
                    <span className="badge bg-light text-dark border">
                      <span className="text-success me-1">●</span> Completed
                    </span>
                    <span className="badge bg-light text-dark border">
                      <span className="text-info me-1">●</span> Bookings Available
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MODAL ===== */}
      {showModal && selectedDay && (
        <>
          {/* Backdrop overlay */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 1040,
            }}
            onClick={closeModal}
          />
          {/* Modal container */}
          <div
            className="modal show d-block"
            tabIndex={-1}
            role="dialog"
            style={{
              width: "calc(100vw - 310px)",
              left: "285px",
              maxWidth: "none",
              height: "90vh",
              margin: "5vh auto",
              position: "fixed",
              zIndex: 1050,
              pointerEvents: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-dialog modal-dialog-centered modal-xl"
              role="document"
            >
              <div className="modal-content">
                <div className="modal-header bg-primary text-white d-flex justify-content-between align-items-center">
                  <h5 className="modal-title mb-0">
                    OT Schedule – {selectedDay.date}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={closeModal}
                    aria-label="Close"
                  />
                </div>
                <div className="modal-body">
                  {/* Status Badges */}
                  <div className="mb-3 d-flex flex-wrap gap-2 align-items-center">
                    <span className="fw-bold me-2">Overview:</span>
                    {selectedDay.statuses && selectedDay.statuses.length > 0 ? (
                      selectedDay.statuses.map((st, idx) => {
                        const sNameLower = (st.statusName || "").toLowerCase();
                        const badgeColor = sNameLower.includes("complete")
                          ? "bg-success"
                          : sNameLower.includes("cancel") ||
                            sNameLower.includes("reject")
                          ? "bg-danger"
                          : "bg-warning text-dark";
                        return (
                          <span key={idx} className={`badge ${badgeColor}`}>
                            {st.statusName}: {st.count}
                          </span>
                        );
                      })
                    ) : (
                      <span className="badge bg-secondary">
                        No bookings recorded
                      </span>
                    )}

                    {selectedDay.otNames && (
                      <span className="badge bg-info text-dark ms-auto">
                        OT: {selectedDay.otNames}
                      </span>
                    )}
                  </div>

                  {/* Detailed Bookings Table */}
                  {loadingModalBookings ? (
                    <div className="text-center py-4">
                      <span className="spinner-border spinner-border-sm me-2" />
                      Loading bookings...
                    </div>
                  ) : modalBookings && modalBookings.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-bordered table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Time</th>
                            <th>OT</th>
                            <th>UHID / IP No.</th>
                            <th>Patient</th>
                            <th>Surgery</th>
                            <th>Surgeon</th>
                            <th>Priority</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modalBookings.map((b, idx) => {
                            const surgName =
                              b.surgeries
                                ?.map((s) => s.surgeryName)
                                .filter(Boolean)
                                .join(", ") ||
                              b.surgeryName ||
                              b.surgery ||
                              "-";
                            const timeStr =
                              b.preferredStartTime && b.preferredEndTime
                                ? `${b.preferredStartTime} - ${b.preferredEndTime}`
                                : b.preferredStartTime || b.time || "-";
                            const sName =
                              b.statusName || b.status || "Scheduled";
                            const sLower = sName.toLowerCase();
                            const badgeClass = sLower.includes("complete")
                              ? "bg-success"
                              : sLower.includes("reject") ||
                                sLower.includes("cancel")
                              ? "bg-danger"
                              : "bg-warning text-dark";

                            return (
                              <tr key={b.otBookingId || idx}>
                                <td>{timeStr}</td>
                                <td>{b.otName || "-"}</td>
                                <td>{b.uhidNo || b.uhid || "-"}</td>
                                <td className="fw-semibold">
                                  {b.patientName || "-"}
                                </td>
                                <td>{surgName}</td>
                                <td>
                                  {b.surgeonName || b.primarySurgeon || "-"}
                                </td>
                                <td>
                                  <span className="badge bg-secondary">
                                    {b.priority || "ELECTIVE"}
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge ${badgeClass}`}>
                                    {sName}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div>
                      {selectedDay.statuses &&
                      selectedDay.statuses.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-bordered table-hover align-middle mb-0">
                            <thead className="table-light">
                              <tr>
                                <th style={{ width: "60px" }}>#</th>
                                <th>Operation Theatre</th>
                                <th>Booking Status</th>
                                <th style={{ width: "120px" }}>Count</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedDay.statuses.map((st, idx) => {
                                const sNameLower = (
                                  st.statusName || ""
                                ).toLowerCase();
                                const badgeClass = sNameLower.includes(
                                  "complete"
                                )
                                  ? "bg-success"
                                  : sNameLower.includes("reject") ||
                                    sNameLower.includes("cancel")
                                  ? "bg-danger"
                                  : "bg-warning text-dark";
                                return (
                                  <tr key={idx}>
                                    <td>{idx + 1}</td>
                                    <td>{selectedDay.otNames || "-"}</td>
                                    <td>
                                      <span className={`badge ${badgeClass}`}>
                                        {st.statusName}
                                      </span>
                                    </td>
                                    <td className="fw-bold">{st.count}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-muted mb-0">
                          No surgeries scheduled for this day.
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={closeModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OTDashboard;
