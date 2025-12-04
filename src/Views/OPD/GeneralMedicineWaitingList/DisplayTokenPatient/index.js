import React, { useState, useEffect } from "react";
import { getRequest, postRequest } from "../../../../service/apiService";
import { DOCTOR, MAS_DEPARTMENT, FILTER_OPD_DEPT, OPD_PATIENT } from "../../../../config/apiConfig";
import LoadingScreen from "../../../../Components/Loading/index";

const PatientWaitingList = () => {
  const today = new Date().toISOString().split("T")[0];

  const [filters, setFilters] = useState({
    departmentId: "",
    doctorId: "",
    date: today,
  });

  const [list, setList] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [doctorData, setDoctorData] = useState([]);

  // -------------------- Fetch Department --------------------
  const fetchDepartmentData = async () => {
    try {
      const data = await getRequest(`${MAS_DEPARTMENT}/getAll/1`);

      if (data.status === 200 && Array.isArray(data.response)) {
        const filtered = data.response.filter(
          (dept) => dept.departmentTypeName === FILTER_OPD_DEPT
        );
        setDepartmentData(filtered);
      } else {
        console.error("Invalid dept response:", data);
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  // -------------------- Fetch Doctors ------------------------
  const fetchDoctorData = async (deptId) => {
    if (!deptId) return;

    try {
      const data = await getRequest(`${DOCTOR}/doctorBySpeciality/${deptId}`);

      if (data.status === 200 && Array.isArray(data.response)) {
        setDoctorData(data.response);
      } else {
        setDoctorData([]);
      }
    } catch (err) {
      console.error("Error fetching doctors:", err);
    }
  };

  // -------------------- Fetch Patient Waiting List -----------
  const handleSearch = async () => {

    if (!filters.doctorId) {
      setList([]);
      return;
    }

    setLoadingData(true);

    try {
      const payload = {
        doctorId: filters.doctorId || null,
        sessionId: filters.sessionId || null,
        employeeNo: filters.employeeNo || null,
        patientName: filters.patientName || null,
        date: filters.date
          ? filters.date + "T00:00:00Z"
          : new Date().toISOString().split("T")[0] + "T00:00:00Z"
      };

      const data = await postRequest(`${OPD_PATIENT}/activeVisit/search`, payload);

      if (data.status === 200 && Array.isArray(data.response)) {
        setList(data.response);
      } else {
        setList([]);
      }
    } catch (error) {
      console.error("Error fetching waiting list:", error);
    } finally {
      setLoadingData(false);
    }
  };


  // -------------------- Reset Filters ------------------------
  const handleReset = () => {
    setFilters({
      departmentId: "",
      doctorId: "",
      date: today,
    });
    setDoctorData([]);
    setList([]);
  };

  // -------------------- Auto Load Department at Mount -------
  useEffect(() => {
    fetchDepartmentData();
  }, []);

  // -------------------- Load Doctor when Department Changes --
  useEffect(() => {
    if (!filters.departmentId) {
      setDoctorData([]);
      setFilters((prev) => ({ ...prev, doctorId: "" }));
      return;
    }

    fetchDoctorData(filters.departmentId);
  }, [filters.departmentId]);

  // -------------------- Auto Fetch List when Doctor Changes --
  useEffect(() => {
    if (filters.departmentId && filters.doctorId) {
      handleSearch();
    }
  }, [filters.doctorId]);

  // -------- Auto Refresh if Other Page Updates Status -------
  useEffect(() => {
    handleSearch();

    const interval = setInterval(() => {
      handleSearch();
    }, 30000); // 30000 ms = 30 seconds

    return () => clearInterval(interval);
  }, []);



  return (
    <div className="container mt-4">
      <h3 className="fw-bold mb-4">PATIENT WAITING LIST</h3>

      {loadingData && <LoadingScreen />}

      {/* -------------------- SEARCH BOX -------------------- */}
      <div className="card p-3 mb-4">
        <div className="row g-3">

          {/* Department */}
          <div className="col-md-3">
            <label className="form-label fw-bold">
              Departments <span className="text-danger">*</span>
            </label>
            <select
              className="form-select"
              value={filters.departmentId}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  departmentId: e.target.value,
                  doctorId: "",
                }))
              }
            >
              <option value="">Select</option>
              {departmentData.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.departmentName}
                </option>
              ))}
            </select>
          </div>

          {/* Doctor */}
          <div className="col-md-3">
            <label className="form-label fw-bold">
              Doctors <span className="text-danger">*</span>
            </label>
            <select
              className="form-select"
              value={filters.doctorId}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  doctorId: e.target.value,
                }))
              }
              disabled={!filters.departmentId}
            >
              <option value="">All Doctors</option>
              {doctorData.map((doc) => (
                <option key={doc.userId} value={doc.userId}>
                  {doc.firstName} {doc.middleName} {doc.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="col-md-3">
            <label className="form-label fw-bold">Date</label>
            <input
              type="date"
              className="form-control"
              value={filters.date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, date: e.target.value }))
              }
            />
          </div>



          {/* SEARCH + RESET */}
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

      {/* ------------------ TABLE ---------------------- */}
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
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {list?.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-muted fst-italic">
                  No records found
                </td>
              </tr>
            ) : (
              list.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td><span className="badge bg-secondary">{item.tokenNo}</span></td>
                  <td>{item.employeeNo}</td>
                  <td>{item.patientName}</td>
                  <td>{item.relation}</td>
                  <td>{item.age}</td>
                  <td>{item.gender}</td>
                  <td>
                    {item.displayPatientStatus === "cp"
                      ? "Patient in consultation"
                      : item.displayPatientStatus === "rp"
                        ? "Ready for consultation"
                        : item.displayPatientStatus === "wp"
                          ? "Waiting For consultation"
                          : ""}
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
