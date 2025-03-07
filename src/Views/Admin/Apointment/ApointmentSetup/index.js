import React, { useState, useEffect } from "react";
import { DEPARTMENT, DOCTOR, SESSION, APPOINTMENT } from "../../../../config/apiConfig";
import { getRequest, putRequest, postRequest } from "../../../../service/apiService";
import Popup from "../../../../Components/popup";

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
  const [doctorData, setDoctorData] = useState([]);
  const [sessionData, setSessionData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [appointmentData, setAppointmentData] = useState(null);

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
      const data = await getRequest(`${DEPARTMENT}/userDepartments/${department}`);
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
      const data = await getRequest(`${SESSION}/all`);
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

  console.log(doctorData);

  useEffect(() => {
    if (department && doctor && session) {
      handleFetchAppointment();
    }
  }, [department, doctor, session]);

  const handleDepartmentChange = (event) => {
    setDepartment(event.target.value);
  };

  const handleFetchAppointment = async () => {
    try {
      setLoading(true);

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
                startToken: dayConfig.startToken || "",
                totalInterval: dayConfig.totalInterval || "",
                totalToken: dayConfig.totalToken || "",
                totalOnlineToken: dayConfig.totalOnlineToken || "",
                maxNoOfDays: dayConfig.maxNoOfDays || "",
                minNoOfDays: dayConfig.minNoOfDays || ""
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requestData = {
      id: appointmentData ? appointmentData.id : null,
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
          tokenStartNo: daysConfig[day].startToken,
          tokenInterval: daysConfig[day].totalInterval,
          totalToken: daysConfig[day].totalToken,
          totalOnlineToken: daysConfig[day].totalOnlineToken,
          maxNoOfDay: daysConfig[day].maxNoOfDays,
          minNoOfday: daysConfig[day].minNoOfDays
        };
      })
    };

    console.log(requestData);

    try {
      setLoading(true);
      const response = appointmentData
        ? await postRequest(`${APPOINTMENT}/setup`, requestData)
        : await postRequest(`${APPOINTMENT}/setup`, requestData);

      if ((appointmentData && response.status === 200) || (!appointmentData && response.status === 201)) {
        showPopup(response.message || `Appointment ${appointmentData ? "updated" : "created"} successfully!`, "success");
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
                          {doctorData
                            .filter((doc) => doc.departmentId === parseInt(department))
                            .map((doc) => (
                              <option key={doc.userId} value={doc.userId}>
                                {doc.userName}
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
                                    value={daysConfig[day].startToken}
                                    onChange={(e) => handleDayConfigChange(day, "startToken", parseInt(e.target.value) || 0)}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={daysConfig[day].totalInterval}
                                    onChange={(e) => handleDayConfigChange(day, "totalInterval", parseInt(e.target.value) || 0)}
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
                                    value={daysConfig[day].maxNoOfDays}
                                    onChange={(e) => handleDayConfigChange(day, "maxNoOfDays", parseInt(e.target.value) || 0)}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={daysConfig[day].minNoOfDays}
                                    onChange={(e) => handleDayConfigChange(day, "minNoOfDays", parseInt(e.target.value) || 0)}
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