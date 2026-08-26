"use client";

import { useState, useEffect } from "react";

const OTDashboard = () => {
  // ----- State -----
  const [filters, setFilters] = useState({
    month: "August",
    year: "2026",
    otType: "All OT",
    department: "All Departments",
  });

  const [summary, setSummary] = useState({
    totalCases: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
  });

  const [weeksData, setWeeksData] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const getRandomTimeSlot = () => {
    const slots = [
      "08:00-10:00",
      "10:30-12:00",
      "12:30-14:00",
      "14:00-16:00",
      "16:30-18:00",
    ];
    return slots[Math.floor(Math.random() * slots.length)];
  };

  // ----- Dummy data generation with detailed surgeries -----
  const generateDummyData = (month, year, otFilter, deptFilter) => {
    const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const patientNames = [
      "Rajesh Kumar",
      "Amit Kumar",
      "Sunita Devi",
      "Ravi Shankar",
      "Priya Singh",
      "Vikram Patel",
      "Neha Gupta",
      "Suresh Reddy",
      "Anita Sharma",
      "Mohan Das",
    ];
    const surgeries = [
      "Knee Replacement",
      "Hernia Repair",
      "XXXXX",
      "Heart Bypass",
      "Spinal Fusion",
      "Cataract Surgery",
      "Appendectomy",
      "Gallbladder Removal",
      "Hip Replacement",
      "Tonsillectomy",
    ];
    const surgeons = [
      "Dr. Sharma",
      "Dr. Gupta",
      "Dr. Verma",
      "Dr. Patel",
      "Dr. Reddy",
      "Dr. Singh",
      "Dr. Kumar",
      "Dr. Das",
    ];
    const statuses = ["Scheduled", "Completed", "Cancelled"];

    const daysData = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, monthIndex, d);
      const dayOfWeek = dateObj.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const numSurgeries = Math.floor(Math.random() * 4) + 1;
        const surgeriesForDay = [];
        for (let i = 0; i < numSurgeries; i++) {
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          surgeriesForDay.push({
            time: getRandomTimeSlot(),
            ot: `OT-${String(Math.floor(Math.random() * 5) + 1).padStart(2, "0")}`,
            uhid: `IPD/26/${String(Math.floor(Math.random() * 10000) + 1000).padStart(5, "0")}`,
            patient: patientNames[Math.floor(Math.random() * patientNames.length)],
            surgery: surgeries[Math.floor(Math.random() * surgeries.length)],
            surgeon: surgeons[Math.floor(Math.random() * surgeons.length)],
            status: status,
          });
        }

        const scheduled = surgeriesForDay.filter(s => s.status === "Scheduled").length;
        const completed = surgeriesForDay.filter(s => s.status === "Completed").length;
        const cancelled = surgeriesForDay.filter(s => s.status === "Cancelled").length;
        const otList = [...new Set(surgeriesForDay.map(s => s.ot))];

        daysData.push({
          date: `${d}-${month.substring(0, 3)}-${year}`,
          scheduled,
          completed,
          cancelled,
          otList,
          surgeries: surgeriesForDay,
        });
      }
    }

    // Group into weeks (Mon-Fri)
    const weeks = [];
    let dayCounter = 0;
    while (dayCounter < daysData.length) {
      const weekDays = [];
      for (let i = 0; i < 5; i++) {
        if (dayCounter < daysData.length) {
          weekDays.push(daysData[dayCounter]);
          dayCounter++;
        } else {
          weekDays.push(null);
        }
      }
      weeks.push(weekDays);
    }

    let totalCases = 0,
      scheduled = 0,
      completed = 0,
      cancelled = 0;
    daysData.forEach((day) => {
      totalCases += day.scheduled;
      scheduled += day.scheduled;
      completed += day.completed;
      cancelled += day.cancelled;
    });

    return {
      weeks,
      summary: { totalCases, scheduled, completed, cancelled },
    };
  };

  // ----- Load data on filter change -----
  useEffect(() => {
    const { weeks, summary } = generateDummyData(
      filters.month,
      filters.year,
      filters.otType,
      filters.department
    );
    setWeeksData(weeks);
    setSummary(summary);
  }, [filters]);

  // ----- Handlers -----
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    console.log("Search clicked with filters:", filters);
  };

  const handleReset = () => {
    setFilters({
      month: "August",
      year: "2026",
      otType: "All OT",
      department: "All Departments",
    });
  };

  const handleDayClick = (dayData) => {
    if (dayData) {
      setSelectedDay(dayData);
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDay(null);
  };

  // ----- Options -----
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const years = ["2023", "2024", "2025", "2026", "2027"];
  const otOptions = ["All OT", "OT-01", "OT-02", "OT-03", "OT-04", "OT-05"];
  const departmentOptions = [
    "All Departments",
    "General Surgery",
    "Cardiology",
    "Orthopedics",
    "Neurology",
  ];

  // ----- Render -----
  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">OT BOOKING DASHBOARD</h4>
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
                          <option key={m} value={m}>
                            {m}
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
                    <div className="col-md-2">
                      <label className="form-label fw-bold">OT</label>
                      <select
                        className="form-select"
                        value={filters.otType}
                        onChange={(e) =>
                          handleFilterChange("otType", e.target.value)
                        }
                      >
                        {otOptions.map((ot) => (
                          <option key={ot} value={ot}>
                            {ot}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="form-label fw-bold">Department</label>
                      <select
                        className="form-select"
                        value={filters.department}
                        onChange={(e) =>
                          handleFilterChange("department", e.target.value)
                        }
                      >
                        {departmentOptions.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-2 d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSearch}
                      >
                        SEARCH
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleReset}
                      >
                        RESET
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Summary (colored) */}
              <div className="row mb-3">
                <div className="col-12">
                  <div className="d-flex flex-wrap gap-3">
                    <div className="card bg-primary text-white p-3 flex-fill" style={{ minWidth: "120px" }}>
                      <div className="small">Total Cases</div>
                      <div className="h4 mb-0">{summary.totalCases}</div>
                    </div>
                    <div className="card bg-info text-white p-3 flex-fill" style={{ minWidth: "120px" }}>
                      <div className="small">Scheduled</div>
                      <div className="h4 mb-0">{summary.scheduled}</div>
                    </div>
                    <div className="card bg-success text-white p-3 flex-fill" style={{ minWidth: "120px" }}>
                      <div className="small">Completed</div>
                      <div className="h4 mb-0">{summary.completed}</div>
                    </div>
                    <div className="card bg-danger text-white p-3 flex-fill" style={{ minWidth: "120px" }}>
                      <div className="small">Cancelled</div>
                      <div className="h4 mb-0">{summary.cancelled}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Calendar – day cards with yellow background and click handler */}
              <div className="calendar-container">
                {/* Weekday Headers */}
                <div className="row g-2 mb-2">
                  {["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"].map((day) => (
                    <div key={day} className="col text-center fw-bold">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Week Rows */}
                {weeksData.map((week, weekIndex) => (
                  <div key={weekIndex} className="row g-2 mb-3">
                    {week.map((day, dayIndex) => (
                      <div key={dayIndex} className="col">
                        <div
                          className="card p-2 h-100 border"
                          style={{
                            minHeight: "140px",
                            backgroundColor: "#fff9e6",
                            cursor: day ? "pointer" : "default",
                          }}
                          onClick={() => handleDayClick(day)}
                        >
                          {day ? (
                            <>
                              <div className="fw-bold small">{day.date}</div>
                              <div className="small">Scheduled: {day.scheduled}</div>
                              <div className="small text-success">Completed: {day.completed}</div>
                              <div className="small text-danger">Cancelled: {day.cancelled}</div>
                              {day.otList.length > 0 && (
                                <div className="small text-muted mt-1">
                                  {day.otList.join(", ")}
                                </div>
                              )}
                              <div className="small text-primary mt-1">
                                Click for details
                              </div>
                            </>
                          ) : (
                            <div className="text-muted small text-center">—</div>
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
                      <span className="text-danger me-1">●</span> Cancelled
                    </span>
                    <span className="badge bg-light text-dark border">
                      <span className="text-warning me-1">●</span> Scheduled
                    </span>
                    <span className="badge bg-light text-dark border">
                      <span className="text-info me-1">●</span> Working Not Booked
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MODAL – styled exactly like DentalSection popups ===== */}
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
          {/* Modal container – fixed width, offset left, 90vh height */}
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
            <div className="modal-dialog modal-dialog-centered modal-xl" role="document">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">OT Schedule – {selectedDay.date}</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={closeModal}
                    aria-label="Close"
                  />
                </div>
                <div className="modal-body">
                  {selectedDay.surgeries && selectedDay.surgeries.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-bordered table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Time</th>
                            <th>OT</th>
                            <th>UHID / IP No.</th>
                            <th>Patient</th>
                            <th>Surgery</th>
                            <th>Surgeon</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDay.surgeries.map((s, idx) => (
                            <tr key={idx}>
                              <td>{s.time}</td>
                              <td>{s.ot}</td>
                              <td>{s.uhid}</td>
                              <td>{s.patient}</td>
                              <td>{s.surgery}</td>
                              <td>{s.surgeon}</td>
                              <td>
                                <span
                                  className={`badge ${
                                    s.status === "Scheduled"
                                      ? "bg-warning"
                                      : s.status === "Completed"
                                      ? "bg-success"
                                      : "bg-danger"
                                  }`}
                                >
                                  {s.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted">No surgeries scheduled for this day.</p>
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