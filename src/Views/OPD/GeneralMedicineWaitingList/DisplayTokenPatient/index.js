import React, { useState, useEffect } from "react";
import { getRequest, putRequest } from "../../../../service/apiService"

const PatientWaitingList = () => {
  const [filters, setFilters] = useState({
    doctorId: "",
    department: "",
    date: "",
    session: "",
    employeeNo: "",
    patientName: "",
  });

  const [list, setList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSearch = async () => {
    const query = new URLSearchParams(filters).toString();
    const response = await getRequest(`/opd/waitingList?${query}`);
    if (response?.status === 200) {
      setList(response.response);
    }
  };

  const handleReset = () => {
    setFilters({
      doctorId: "",
      department: "",
      date: "",
      session: "",
      employeeNo: "",
      patientName: "",
    });
    setList([]);
  };

  const handleCloseVisit = async (visitId) => {
    try {
      const response = await putRequest(`/opd/changeStatusForClose/${visitId}/x`);
      if (response?.status === 200) {
        // showPopup("Update successfully.", "success");
        handleSearch();
      } else {
        // showPopup("Failed to update. Please try again.", "error");
      }
    } catch (e) {
    //   showPopup("Failed to update. Please try again.", "error");
    }
  };

  return (
    <div className="container mt-4">

      {/* ====================== PAGE TITLE ======================== */}
      <h3 className="fw-bold mb-4">PATIENT WAITING LIST</h3>

      {/* ======================== SEARCH BOX ======================== */}
      <div className="card p-3 mb-4">
        <div className="row g-3">

          {/* Doctor List */}
          <div className="col-md-3">
            <label className="form-label fw-bold">Doctor List</label>
            <select
              className="form-select"
              value={filters.doctorId}
              onChange={(e) => handleFilterChange("doctorId", e.target.value)}
            >
              <option value="">Select</option>
            </select>
          </div>

          {/* Department */}
          <div className="col-md-3">
            <label className="form-label fw-bold">Department</label>
            <select
              className="form-select"
              value={filters.department}
              onChange={(e) =>
                handleFilterChange("department", e.target.value)
              }
            >
              <option value="">Select</option>
            </select>
          </div>

          {/* Date */}
          <div className="col-md-3">
            <label className="form-label fw-bold">Date</label>
            <input
              type="date"
              className="form-control"
              value={filters.date}
              onChange={(e) => handleFilterChange("date", e.target.value)}
            />
          </div>

          {/* Session */}
          <div className="col-md-3">
            <label className="form-label fw-bold">Session</label>
            <select
              className="form-select"
              value={filters.session}
              onChange={(e) => handleFilterChange("session", e.target.value)}
            >
              <option value="">Select</option>
            </select>
          </div>

          {/* Employee No */}
          <div className="col-md-3">
            <label className="form-label fw-bold">Employee No.</label>
            <input
              type="text"
              className="form-control"
              value={filters.employeeNo}
              onChange={(e) =>
                handleFilterChange("employeeNo", e.target.value)
              }
              placeholder="Employee Number"
            />
          </div>

          {/* Patient Name */}
          <div className="col-md-3">
            <label className="form-label fw-bold">Patient Name</label>
            <input
              type="text"
              className="form-control"
              value={filters.patientName}
              onChange={(e) =>
                handleFilterChange("patientName", e.target.value)
              }
              placeholder="Patient Name"
            />
          </div>

          {/* SEARCH & RESET */}
          <div className="col-md-3 d-flex align-items-end gap-2">
            <button className="btn btn-success w-100" onClick={handleSearch}>
              SEARCH
            </button>
            <button className="btn btn-secondary w-100" onClick={handleReset}>
              RESET
            </button>
          </div>

        </div>
      </div>

      {/* ======================= TABLE ======================== */}
      <div className="table-responsive">
        <table className="table table-bordered text-center">
          <thead>
            <tr>
              <th>S.N.</th>
              <th>TOKEN NO.</th>
              <th>EMPLOYEE NO.</th>
              <th>PATIENT NAME</th>
              <th>RELATION</th>
              <th>AGE</th>
              <th>GENDER</th>
              <th>OPD TYPE</th>
              <th>ACTION</th>
              <th>ACTION</th>
            </tr>
          </thead>

          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-muted fst-italic">
                  No records found
                </td>
              </tr>
            ) : (
              list.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>
                    <span className="badge bg-secondary">{item.tokenNo}</span>
                  </td>
                  <td>{item.employeeNo}</td>
                  <td>{item.patientName}</td>
                  <td>{item.relation}</td>
                  <td>{item.age}</td>
                  <td>{item.gender}</td>
                  <td>{item.opdType}</td>

                  <td>
                    <button className="btn btn-success btn-sm">RELEASE</button>
                  </td>

                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleCloseVisit(item.visitId)}
                    >
                      CLOSE
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default PatientWaitingList;
