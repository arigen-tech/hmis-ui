"use client"

import { useState } from "react"

const OTDashboard = () => {
  const [filters, setFilters] = useState({
    month: "October",
    year: "2025",
    otType: "select",
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")

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
  ]
  const years = ["2023", "2024", "2025", "2026"]

  const otTypes = ["select", "OT-1", "OT-2", "OT-3", "OT-4", "OT-5"]

  // Sample calendar data for October 2025
  const calendarData = [
    { date: "01/10/2025", scheduled: 0, done: 0, status: "previous" },
    { date: "02/10/2025", scheduled: 0, done: 0, status: "previous" },
    { date: "03/10/2025", scheduled: 0, done: 0, status: "previous" },
    { date: "04/10/2025", scheduled: 0, done: 0, status: "previous" },
    { date: "05/10/2025", scheduled: 0, done: 0, status: "previous" },
    { date: "06/10/2025", scheduled: 0, done: 0, status: "previous" },
    { date: "07/10/2025", scheduled: 0, done: 0, status: "previous" },
    { date: "08/10/2025", scheduled: 0, done: 0, status: "previous" },
    { date: "09/10/2025", scheduled: 0, done: 0, status: "previous" },
    { date: "10/10/2025", scheduled: 0, done: 0, status: "previous" },
    { date: "11/10/2025", scheduled: 0, done: 0, status: "previous" },
    { date: "12/10/2025", scheduled: 0, done: 0, status: "previous" },
    { date: "13/10/2025", scheduled: 0, done: 0, status: "previous" },
    { date: "14/10/2025", scheduled: 0, done: 0, status: "previous" },
 
   
    { date: "30/10/2025", scheduled: 2, done: 1, status: "working-not-booked" },
    { date: "31/10/2025", scheduled: 1, done: 0, status: "working-not-booked" },
  ]

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }))
    setCurrentPage(1)
  }

  const handleSearch = () => {
    console.log("Searching with filters:", filters)
  }

  const handleReset = () => {
    setFilters({
      month: "October",
      year: "2025",
      otType: "select",
    })
    setCurrentPage(1)
  }

  const getDateCellClass = (status) => {
    switch (status) {
      case "previous":
        return "bg-danger"
      case "working-booked":
        return "bg-warning"
      case "working-not-booked":
        return "bg-success"
      default:
        return "bg-light"
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case "previous":
        return "Previous Date"
      case "working-booked":
        return "Working Booked"
      case "working-not-booked":
        return "Working Not Booked"
      default:
        return "Unknown"
    }
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">OT DASHBOARD</h4>
              </div>
            </div>
            <div className="card-body">
              {/* Filter Section */}
              <div className="card mb-3">
                <div className="card-body">
                  <div className="row g-3 align-items-end">
                    <div className="col-md-2">
                      <label className="form-label fw-bold">Month*</label>
                      <select
                        className="form-select"
                        value={filters.month}
                        onChange={(e) => handleFilterChange("month", e.target.value)}
                      >
                        {months.map((month) => (
                          <option key={month} value={month}>
                            {month}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="form-label fw-bold">Year*</label>
                      <select
                        className="form-select"
                        value={filters.year}
                        onChange={(e) => handleFilterChange("year", e.target.value)}
                      >
                        {years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="form-label fw-bold">OT*</label>
                      <select
                        className="form-select"
                        value={filters.otType}
                        onChange={(e) => handleFilterChange("otType", e.target.value)}
                      >
                        {otTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-2 d-flex gap-2">
                      <button type="button" className="btn btn-primary" onClick={handleSearch}>
                        SEARCH
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calendar Grid Section */}
              <div className="calendar-container">
                <div className="row g-2">
                  {calendarData.map((dateItem, index) => (
                    <div key={index} className="col-lg-3 col-md-4 col-sm-6 mb-2">
                      <div
                        className={`card p-3 ${getDateCellClass(dateItem.status)}`}
                        style={{ minHeight: "100px", cursor: "pointer" }}
                      >
                        <div className="fw-bold text-dark mb-2">{dateItem.date}</div>
                        <div className="text-dark">Scheduled: {dateItem.scheduled}</div>
                        <div className="text-dark">Done: {dateItem.done}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend Section */}
              <div className="row mt-4">
                <div className="col-12">
                  <div className="d-flex gap-4 flex-wrap">
                    <div className="d-flex align-items-center gap-2">
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          backgroundColor: "#dc3545",
                          border: "1px solid #999",
                        }}
                      ></div>
                      <span>Previous Date</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          backgroundColor: "#198754",
                          border: "1px solid #999",
                        }}
                      ></div>
                      <span>Working Not Booked</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          backgroundColor: "#ffc107",
                          border: "1px solid #999",
                        }}
                      ></div>
                      <span>Working Booked</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OTDashboard
