import React, { useState, useEffect } from "react";
import { DEPARTMENT, DOCTOR, SESSION, APPOINTMENT } from "../../../../config/apiConfig";
import { getRequest, putRequest, postRequest } from "../../../../service/apiService";

const AppointmentSetup = () => {
  const [department, setDepartment] = useState("");
  const [doctor, setDoctor] = useState("");
  const [session, setSession] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timeTaken, setTimeTaken] = useState("");
  const [departmentData, setDepartmentData] = useState([]);
  const [doctorData, setDoctorData] = useState([]);
  const [sessionData, setSessionData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [appointmentData, setAppointmentData] = useState(null);

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const initialDaysState = daysOfWeek.reduce((acc, day) => {
    acc[day] = {
      tokenStartNo: "",
      tokenInterval: "",
      totalToken: "",
      totalOnlineToken: "",
      maxDays: "",
      minDays: ""
    };
    return acc;
  }, {});

  const [daysConfig, setDaysConfig] = useState(initialDaysState);


  useEffect(() => {
    fetchDepartmentData();
    fetchDoctorData();
    fetchSessionData();
  }, []);

  const fetchDepartmentData = async () => {
    setLoading(true);

    try {
      const data = await getRequest(`${DEPARTMENT}/all`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setDepartmentData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setDepartmentData([]);
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorData = async () => {
    setLoading(true);

    try {
      const data = await getRequest(DOCTOR);
      if (data.status === 200 && Array.isArray(data.response)) {
        setDoctorData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setDoctorData([]);
      }
    } catch (error) {
      console.error("Error fetching Doctor data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionData = async () => {
    setLoading(true);

    try {
      const data = await getRequest(SESSION);
      if (data.status === 200 && Array.isArray(data.response)) {
        setSessionData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setSessionData([]);
      }
    } catch (error) {
      console.error("Error fetching Session data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (department && doctor && session) {
      handleFetchAppointment();
    }
  }, [department, doctor, session]);

  const handleFetchAppointment = async () => {
    try {
      setLoading(true);
      const data = await postRequest(APPOINTMENT, {
        department,
        doctor,
        session,
      });

      if (data.status === 200 && data.response) {
        setAppointmentData(data.response);
        setStartTime(data.response.startTime);
        setEndTime(data.response.endTime);
        setTimeTaken(data.response.timeTaken);

        if (data.response.days && Array.isArray(data.response.days)) {
          const updatedDaysConfig = { ...initialDaysState };

          data.response.days.forEach(dayConfig => {
            if (dayConfig.day && updatedDaysConfig[dayConfig.day]) {
              updatedDaysConfig[dayConfig.day] = {
                tokenStartNo: dayConfig.tokenStartNo || "",
                tokenInterval: dayConfig.tokenInterval || "",
                totalToken: dayConfig.totalToken || "",
                totalOnlineToken: dayConfig.totalOnlineToken || "",
                maxDays: dayConfig.maxNoOfDay || "",
                minDays: dayConfig.minNoOfday || ""
              };
            }
          });

          setDaysConfig(updatedDaysConfig);
        }
      } else {
        setAppointmentData(null);
        setDaysConfig(initialDaysState);
      }
    } catch (error) {
      console.error("Error fetching Appointment data:", error);
    } finally {
      setLoading(false);
    }
  };


  const handleDayConfigChange = (day, field, value) => {
    setDaysConfig({
      ...daysConfig,
      [day]: {
        ...daysConfig[day],
        [field]: value
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requestData = {
      departmentId: department,
      doctorId: doctor,
      sessionId: session,
      startTime,
      endTime,
      timeTaken,
      days: daysOfWeek.map(day => ({
        day,
        tokenStartNo: daysConfig[day].tokenStartNo,
        tokenInterval: daysConfig[day].tokenInterval,
        totalToken: daysConfig[day].totalToken,
        totalOnlineToken: daysConfig[day].totalOnlineToken,
        maxNoOfDay: daysConfig[day].maxDays,
        minNoOfday: daysConfig[day].minDays
      }))
    };


    console.log(requestData);

    try {
      setLoading(true);
      if (appointmentData) {
        const response = await putRequest(`${APPOINTMENT}/${appointmentData.id}`, requestData);
        if (response.status === 200) {
          alert("Appointment updated successfully!");
        } else {
          alert("Failed to update appointment.");
        }
      } else {
        const response = await postRequest(APPOINTMENT, requestData);
        if (response.status === 201) {
          alert("Appointment created successfully!");
        } else {
          alert("Failed to create appointment.");
        }
      }
    } catch (error) {
      console.error("Error submitting appointment:", error);
      alert("An error occurred: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDepartment("");
    setDoctor("");
    setSession("");
    setStartTime("");
    setEndTime("");
    setTimeTaken("");
    setDaysConfig(initialDaysState);
    setAppointmentData(null);
  };

  return (
    <>
      <div className="body d-flex py-3">
        <div className="container-xxl">
          <div className="row align-items-center">
            <div className="border-0 mb-4">
              <div className="card-header py-3 bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap">
                <h3 className="fw-bold mb-0">Appointment Setup</h3>
              </div>
            </div>
          </div>
          <div className="row mb-3">
            <div className="col-sm-12">
              <div className="card shadow mb-3">
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label">Department *</label>
                        <select
                          className="form-select"
                          value={department}
                          onChange={(e) => setDepartment(parseInt(e.target.value))}
                          required
                        >
                          <option value="" disabled>Select</option>
                          {departmentData.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Doctor List *</label>
                        <select
                          className="form-select"
                          value={doctor}
                          onChange={(e) => setDoctor(parseInt(e.target.value))}
                          required
                          disabled={!department}
                        >
                          <option value="">Select Doctor</option>
                          {department &&
                            doctorData[department]?.map((doc) => (
                              <option key={doc.id} value={doc.id}>
                                {doc.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Session *</label>
                        <select
                          className="form-select"
                          value={session}
                          onChange={(e) => setSession(parseInt(e.target.value))}
                          required
                        >
                          <option value="" disabled>Select</option>
                          {sessionData.map((sess) => (
                            <option key={sess.id} value={sess.id}>
                              {sess.name}
                            </option>
                          ))}
                        </select>
                      </div>


                      <div className="col-md-4">
                        <label className="form-label">Start Time *</label>
                        <input
                          type="time"
                          className="form-control"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">End Time *</label>
                        <input
                          type="time"
                          className="form-control"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Time Taken (minutes) *</label>
                        <input
                          type="number"
                          className="form-control"
                          value={timeTaken}
                          onChange={(e) => setTimeTaken(parseInt(e.target.value))}
                          required
                        />
                      </div>

                      <div className="col-md-12">
                        <table className="table table-bordered">
                          <thead>
                            <tr>
                              <th>Days</th>
                              <th>Token Start No.</th>
                              <th>Token Interval</th>
                              <th>Total Token</th>
                              <th>Total Online Token</th>
                              <th>Max No. of Days</th>
                              <th>Min No. of Days</th>
                            </tr>
                          </thead>
                          <tbody>
                            {daysOfWeek.map((day) => (
                              <tr key={day}>
                                <td>{day}</td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={daysConfig[day].tokenStartNo}
                                    onChange={(e) => handleDayConfigChange(day, "tokenStartNo", parseInt(e.target.value) || 0)}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={daysConfig[day].tokenInterval}
                                    onChange={(e) => handleDayConfigChange(day, "tokenInterval", parseInt(e.target.value) || 0)}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={daysConfig[day].totalToken}
                                    onChange={(e) => handleDayConfigChange(day, "totalToken", parseInt(e.target.value) || 0)}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={daysConfig[day].totalOnlineToken}
                                    onChange={(e) =>
                                      handleDayConfigChange(day, "totalOnlineToken", parseInt(e.target.value) || 0)
                                    }
                                  />
                                </td>

                                <td>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={daysConfig[day].maxDays}
                                    onChange={(e) => handleDayConfigChange(day, "maxDays", parseInt(e.target.value) || 0)}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={daysConfig[day].minDays}
                                    onChange={(e) => handleDayConfigChange(day, "minDays", parseInt(e.target.value) || 0)}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button type="submit" className="btn btn-primary me-2">
                        {appointmentData ? "Update Appointment" : "Create Appointment"}
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleReset}>Reset</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AppointmentSetup;