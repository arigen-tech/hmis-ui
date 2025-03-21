import React, { useState, useEffect } from "react";
import { DEPARTMENT, DOCTOR, SESSION, APPOINTMENT } from "../../../../config/apiConfig";
import { getRequest, putRequest, postRequest } from "../../../../service/apiService";
import Popup from "../../../../Components/popup";
import LoadingScreen from "../../../../Components/Loading";

const AppointmentSetup = () => {
  const [popup, setPopup] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [department, setDepartment] = useState("");
  const [doctor, setDoctor] = useState("");
  const [session, setSession] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timeTaken, setTimeTaken] = useState("");
  const [departmentData, setDepartmentData] = useState([]);
  const [filterDepartment, setFilterDepartment] = useState([]);
  const [doctorData, setDoctorData] = useState([]);
  const [sessionData, setSessionData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [appointmentData, setAppointmentData] = useState(null);
  const [modifiedFields, setModifiedFields] = useState({});

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      },
    });
  };

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const initialDaysState = daysOfWeek.reduce((acc, day) => {
    acc[day] = {
      startToken: "",
      totalInterval: "",
      totalToken: "",
      totalOnlineToken: "",
      maxNoOfDays: "",
      minNoOfDays: ""
    };
    return acc;
  }, {});

  const [daysConfig, setDaysConfig] = useState(initialDaysState);
  const [originalDaysConfig, setOriginalDaysConfig] = useState(initialDaysState);

  useEffect(() => {
    fetchDepartmentData();
    fetchSessionData();
  }, []);

  useEffect(() => {
    if (department) {
      fetchDoctorData();
    }
  }, [department]);

  const fetchDepartmentData = async () => {
    setLoading(true);
    try {
      const data = await getRequest(`${DEPARTMENT}/getAllDepartments/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        const filteredDepartments = data.response.filter(
          (dept) => dept.departmentTypeName === "OPD"
        );
        setDepartmentData(data.response);
        setFilterDepartment(filteredDepartments); // Set filtered OPD departments
      } else {
        console.error("Unexpected API response format:", data);
        setDepartmentData([]);
        setFilterDepartment([]); // Reset filtered data in case of unexpected response
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
      const data = await getRequest(`${DOCTOR}/doctorBySpeciality/${department}`);
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
      const data = await getRequest(`${SESSION}/getAllOpdSessions/1`);
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
      setModifiedFields({});
      const url = `${APPOINTMENT}/find?deptId=${department}&doctorId=${doctor}&sessionId=${session}`;
      const data = await getRequest(url);
      if (data?.status === 200 && data?.response) {
        const { startTime, endTime, timeTaken, days } = data.response;
        setAppointmentData(data.response);
        setStartTime(startTime);
        setEndTime(endTime);
        setTimeTaken(timeTaken);
        if (Array.isArray(days)) {
          const updatedDaysConfig = { ...initialDaysState };
          days.forEach((dayConfig) => {
            const dayName = dayConfig.days || dayConfig.day;
            if (dayName && updatedDaysConfig[dayName]) {
              updatedDaysConfig[dayName] = {
                startToken: dayConfig.startToken !== null ? dayConfig.startToken : "",
                totalInterval: dayConfig.totalInterval !== null ? dayConfig.totalInterval : "",
                totalToken: dayConfig.totalToken !== null ? dayConfig.totalToken : "",
                totalOnlineToken: dayConfig.totalOnlineToken !== null ? dayConfig.totalOnlineToken : "",
                maxNoOfDays: dayConfig.maxNoOfDays !== null ? dayConfig.maxNoOfDays : "",
                minNoOfDays: dayConfig.minNoOfDays !== null ? dayConfig.minNoOfDays : ""
              };
            }
          });
          setDaysConfig(updatedDaysConfig);


          setOriginalDaysConfig(JSON.parse(JSON.stringify(updatedDaysConfig)));
        }
      } else {
        setAppointmentData(null);
        setDaysConfig(initialDaysState);
        setStartTime("");
        setEndTime("");
        setTimeTaken("");
        setOriginalDaysConfig(initialDaysState);
      }
    } catch (error) {
      console.error("Error fetching appointment data:", error);
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

    const originalValue = originalDaysConfig[day][field];
    const isModified = value !== originalValue;

    if (isModified) {
      setModifiedFields({
        ...modifiedFields,
        [`${day}-${field}`]: true
      });
    } else {
      const newModifiedFields = { ...modifiedFields };
      delete newModifiedFields[`${day}-${field}`];
      setModifiedFields(newModifiedFields);
    }
  };

  const isFieldModified = (day, field) => {
    return modifiedFields[`${day}-${field}`] === true;
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
      days: daysOfWeek.map(day => {
        const existingDay = appointmentData?.days?.find(d => (d.days || d.day) === day);
        return {
          id: appointmentData ? (existingDay?.id || null) : null,
          day: day,
          tokenStartNo: daysConfig[day].startToken !== "" ? parseInt(daysConfig[day].startToken) : null,
          tokenInterval: daysConfig[day].totalInterval !== "" ? parseInt(daysConfig[day].totalInterval) : null,
          totalToken: daysConfig[day].totalToken !== "" ? parseInt(daysConfig[day].totalToken) : null,
          totalOnlineToken: daysConfig[day].totalOnlineToken !== "" ? parseInt(daysConfig[day].totalOnlineToken) : null,
          maxNoOfDay: daysConfig[day].maxNoOfDays !== "" ? parseInt(daysConfig[day].maxNoOfDays) : null,
          minNoOfday: daysConfig[day].minNoOfDays !== "" ? parseInt(daysConfig[day].minNoOfDays) : null
        };
      })
    };

    try {
      setLoading(true);
      const response = await postRequest(`${APPOINTMENT}/setup`, requestData);

      if (response.status === 200) {
        showPopup(response.message || `Appointment ${appointmentData ? "updated" : "created"} successfully!`, "success");
        setOriginalDaysConfig(JSON.parse(JSON.stringify(daysConfig)));
        setModifiedFields({});
        handleReset();
      } else {
        showPopup(`Failed to ${appointmentData ? "update" : "create"} Appointment. Please try again.`, "error");
      }
    } catch (error) {
      showPopup(
        "An error occurred: " + (error.message || "Unknown error"),
        "error"
      );
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
    setModifiedFields({});
    setOriginalDaysConfig(initialDaysState);
  };

  return (
    <>
      <div className="body d-flex py-3">
        <div className="container-xxl">
          {popupMessage && (
            <Popup
              message={popupMessage.message}
              type={popupMessage.type}
              onClose={popupMessage.onClose}
            />

          )}
          {loading && (
            <LoadingScreen />

          )}

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
                          {filterDepartment.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.departmentName}
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
                          {doctorData.map((doc) => (
                            <option key={doc.userId} value={doc.userId}>
                              {doc.firstName} {doc.lastName}
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
                              {sess.sessionName}
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
                                    style={{ backgroundColor: isFieldModified(day, "startToken") ? "#d4edda" : "" }}
                                    value={daysConfig[day].startToken}
                                    onChange={(e) => handleDayConfigChange(day, "startToken", e.target.value === "" ? "" : parseInt(e.target.value))}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control"
                                    style={{ backgroundColor: isFieldModified(day, "totalInterval") ? "#d4edda" : "" }}
                                    value={daysConfig[day].totalInterval}
                                    onChange={(e) => handleDayConfigChange(day, "totalInterval", e.target.value === "" ? "" : parseInt(e.target.value))}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control"
                                    style={{ backgroundColor: isFieldModified(day, "totalToken") ? "#d4edda" : "" }}
                                    value={daysConfig[day].totalToken}
                                    onChange={(e) => handleDayConfigChange(day, "totalToken", e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control"
                                    style={{ backgroundColor: isFieldModified(day, "totalOnlineToken") ? "#d4edda" : "" }}
                                    value={daysConfig[day].totalOnlineToken}
                                    onChange={(e) =>
                                      handleDayConfigChange(day, "totalOnlineToken", e.target.value === "" ? "" : parseInt(e.target.value) || 0)
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control"
                                    style={{ backgroundColor: isFieldModified(day, "maxNoOfDays") ? "#d4edda" : "" }}
                                    value={daysConfig[day].maxNoOfDays}
                                    onChange={(e) => handleDayConfigChange(day, "maxNoOfDays", e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control"
                                    style={{ backgroundColor: isFieldModified(day, "minNoOfDays") ? "#d4edda" : "" }}
                                    value={daysConfig[day].minNoOfDays}
                                    onChange={(e) => handleDayConfigChange(day, "minNoOfDays", e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button type="submit" className="btn btn-primary me-2" disabled={loading}>
                        {loading ? "Processing..." : appointmentData ? "Update Appointment" : "Create Appointment"}
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