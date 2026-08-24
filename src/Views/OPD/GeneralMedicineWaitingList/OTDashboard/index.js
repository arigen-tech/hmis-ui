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

  // ----- Dummy data generation -----
  const generateDummyData = (month, year, otFilter, deptFilter) => {
    const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const daysData = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, monthIndex, d);
      const dayOfWeek = dateObj.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const scheduled = Math.floor(Math.random() * 5) + 1;
        const completed = Math.floor(Math.random() * scheduled);
        const cancelled = Math.floor(Math.random() * (scheduled - completed + 1));
        const otList = [];
        const numOT = Math.floor(Math.random() * 3) + 1;
        for (let i = 1; i <= numOT; i++) {
          otList.push(`OT-0${i}`);
        }
        daysData.push({
          date: `${d}-${month.substring(0, 3)}-${year}`,
          scheduled,
          completed,
          cancelled,
          otList: [...new Set(otList)],
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

              {/* Weekly Calendar – all day cards now have a uniform light gray background */}
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
                            backgroundColor: "#e9ecef", // uniform slightly darker gray
                          }}
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
    </div>
  );
};

export default OTDashboard;