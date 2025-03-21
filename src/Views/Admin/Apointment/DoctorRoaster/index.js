import React, { useState, useEffect } from "react";
import { DEPARTMENT, DOCTOR, DOCTOR_ROSTER, APPOINTMENT } from "../../../../config/apiConfig";
import { getRequest, putRequest, postRequest } from "../../../../service/apiService";
import LoadingScreen from "../../../../Components/Loading";
import Popup from "../../../../Components/popup";


const DoctorRoaster = () => {
  const [department, setDepartment] = useState("");
  const [doctor, setDoctor] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [departmentData, setDepartmentData] = useState([]);
  const [doctorData, setDoctorData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [doctorRoasterData, setDoctorRoasterData] = useState(null);
  const [rosterSchedule, setRosterSchedule] = useState([]);
  const [popup, setPopup] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [existingRosterFound, setExistingRosterFound] = useState(false);


  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      },
    });
  };

  useEffect(() => {
    fetchDepartmentData();
  }, []);

  useEffect(() => {
    if (department) {
      fetchDoctorData();
    }
  }, [department]);

  useEffect(() => {
    if (fromDate) {
      generateDatesFromSelectedDate();
    }
  }, [fromDate, doctorData]);

  useEffect(() => {
    if (department && fromDate) {
      handleFetchDoctorRoster();
    }
  }, [department, doctor, fromDate]);

  const fetchDepartmentData = async () => {
    setLoading(true);
    try {
      const data = await getRequest(`${DEPARTMENT}/getAllDepartments/1`);
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

  // Modified to correctly handle the date range (selected date to selected date + 6 days)
  const generateDatesFromSelectedDate = () => {
    if (!fromDate) return;

    const startDate = new Date(fromDate);
    const dates = [];

    // Generate 7 dates (from selected date to selected date + 6 days)
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      // Format date as DD/MM/YYYY
      const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;
      dates.push(formattedDate);
    }

    let doctorsToUse = [];

    if (doctor) {
      const selectedDoctor = doctorData.find(doc => doc.userId === parseInt(doctor));
      if (selectedDoctor) {
        doctorsToUse = [{
          name: `${selectedDoctor.firstName} ${selectedDoctor.lastName}`,
          id: selectedDoctor.userId
        }];
      }
    } else {
      doctorsToUse = doctorData.map(doc => ({
        name: `${doc.firstName} ${doc.lastName}`,
        id: doc.userId
      }));
    }

    const initialSchedule = doctorsToUse.map(doctorInfo => ({
      doctorName: doctorInfo.name,
      doctorId: doctorInfo.id,
      schedule: dates.map(date => ({
        date,
        morning: true, // Default to true as per requirement "YY"
        evening: true  // Default to true as per requirement "YY"
      }))
    }));

    setRosterSchedule(initialSchedule);
  };

  const handleFetchDoctorRoster = async () => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams({
        deptId: department,
        rosterDate: fromDate,
      });

      if (doctor) {
        queryParams.append("doctorId", doctor);
      }

      const apiUrl = `${DOCTOR_ROSTER}/rosterfind?${queryParams.toString()}`;
      const data = await getRequest(apiUrl);
      setDoctorRoasterData(data);
      
      // Check if data exists to determine if this is a create or update operation
      setExistingRosterFound(data && Array.isArray(data) && data.length > 0);

      if (data && Array.isArray(data) && data.length > 0) {
        const updatedSchedule = [...rosterSchedule];

        data.forEach(item => {
          const doctorIndex = updatedSchedule.findIndex(d => d.doctorName === item.doctorName);
          if (doctorIndex !== -1) {
            const dateIndex = updatedSchedule[doctorIndex].schedule.findIndex(s => s.date === item.date);
            if (dateIndex !== -1) {
              if (item.rosterValue === "YN") {
                updatedSchedule[doctorIndex].schedule[dateIndex].morning = true;
                updatedSchedule[doctorIndex].schedule[dateIndex].evening = false;
              } else if (item.rosterValue === "NY") {
                updatedSchedule[doctorIndex].schedule[dateIndex].morning = false;
                updatedSchedule[doctorIndex].schedule[dateIndex].evening = true;
              } else if (item.rosterValue === "YY") {
                updatedSchedule[doctorIndex].schedule[dateIndex].morning = true;
                updatedSchedule[doctorIndex].schedule[dateIndex].evening = true;
              } else if (item.rosterValue === "NN") {
                updatedSchedule[doctorIndex].schedule[dateIndex].morning = false;
                updatedSchedule[doctorIndex].schedule[dateIndex].evening = false;
              }
            }
          }
        });

        setRosterSchedule(updatedSchedule);
      }
    } catch (error) {
      console.error("Error fetching Doctor Roster data:", error);
      setExistingRosterFound(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (doctorIndex, dateIndex, session) => {
    const updatedSchedule = [...rosterSchedule];
    updatedSchedule[doctorIndex].schedule[dateIndex][session] =
      !updatedSchedule[doctorIndex].schedule[dateIndex][session];
    setRosterSchedule(updatedSchedule);
  };

  const formatDateToISO = (dateString) => {
    const [day, month, year] = dateString.split('/');
    return `${year}-${month}-${day}T00:00:00.000Z`;
  };

  const getRosterValue = (morning, evening) => {
    if (morning && evening) return "YY";
    if (morning && !evening) return "YN";
    if (!morning && evening) return "NY";
    return "NN";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!department || !fromDate) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const dates = [];

      rosterSchedule.forEach(doctorItem => {
        doctorItem.schedule.forEach(dateItem => {
          const rosterValue = getRosterValue(dateItem.morning, dateItem.evening);

          dates.push({
            dates: formatDateToISO(dateItem.date),
            rosterVale: rosterValue,  // Note: There's a typo here in the original code ("rosterVale" instead of "rosterValue")
            doctorId: doctorItem.doctorId,
            id: 0
          });
        });
      });

      const submitData = {
        departmentId: parseInt(department),
        fromDate: fromDate,
        dates: dates
      };

      // Use a single endpoint for both create and update
      const endpoint = `${DOCTOR_ROSTER}/roster`;
      // Select the appropriate method based on whether existing data was found
      const requestMethod = existingRosterFound ? putRequest : postRequest;

      const response = await requestMethod(endpoint, submitData);

      if (response.status === 200) {
        showPopup(`Roster ${existingRosterFound ? "updated" : "added"} successfully!`, "success");
        // After successful submission, fetch the roster again to ensure we have the latest data
        handleFetchDoctorRoster();
      } else {
        showPopup(`Error ${existingRosterFound ? "updating" : "adding"} roster: ${response.message || "Unknown error"}`, "error");
      }
    } catch (error) {
      console.error("Error saving/updating roster:", error);
      showPopup("An error occurred while saving the roster", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDepartment("");
    setDoctor("");
    setFromDate("");
    setDoctorRoasterData(null);
    setRosterSchedule([]);
    setExistingRosterFound(false);
  };

  // Helper function to display dates in a more readable format (e.g., "21 Mar 2025")
  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";
    const [day, month, year] = dateString.split('/');
    const date = new Date(`${year}-${month}-${day}`);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getDisplayDates = () => {
    if (!fromDate || rosterSchedule.length === 0 || rosterSchedule[0].schedule.length === 0) {
      return Array(7).fill(null).map((_, i) => `Date ${i + 1}`);
    }
    return rosterSchedule[0].schedule.map(s => formatDisplayDate(s.date));
  };

  return (
    <div className="body d-flex py-3">
      <div className="container-xxl">
        <div className="row align-items-center">
          <div className="border-0 mb-4">
            <div className="card-header py-3 bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap">
              <h3 className="fw-bold mb-0">Doctor Roster</h3>
            </div>
          </div>
        </div>
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
                      <label className="form-label">Doctor (Optional)</label>
                      <select
                        className="form-select"
                        value={doctor}
                        onChange={(e) => setDoctor(e.target.value)}
                        disabled={!department}
                      >
                        <option value="">All Doctors</option>
                        {doctorData.map((doc) => (
                          <option key={doc.userId} value={doc.userId}>
                            {doc.firstName} {doc.lastName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">From Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        required
                      />
                    </div>

                    {rosterSchedule.length > 0 && (
                      <div className="col-md-12 mt-4">
                        <div className="table-responsive">
                          <table className="table table-bordered">
                            <thead>
                              <tr>
                                <th>Doctor</th>
                                {getDisplayDates().map((date, i) => (
                                  <th key={i} className="text-center">
                                    {date}
                                    <div className="small text-muted">
                                      {rosterSchedule[0].schedule[i] ? 
                                        new Date(formatDateToISO(rosterSchedule[0].schedule[i].date))
                                          .toLocaleDateString('en-US', { weekday: 'short' }) : 
                                        ''}
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {rosterSchedule.map((doctorItem, doctorIndex) => (
                                <tr key={doctorIndex}>
                                  <td>{doctorItem.doctorName}</td>
                                  {doctorItem.schedule.map((dateItem, dateIndex) => (
                                    <td key={dateIndex} className="text-center">
                                      <div className="form-check form-check-inline">
                                        <input
                                          type="checkbox"
                                          className="form-check-input"
                                          id={`morning-${doctorIndex}-${dateIndex}`}
                                          checked={dateItem.morning}
                                          onChange={() => handleCheckboxChange(doctorIndex, dateIndex, 'morning')}
                                        />
                                        <label className="form-check-label" htmlFor={`morning-${doctorIndex}-${dateIndex}`}>M</label>
                                      </div>
                                      <div className="form-check form-check-inline">
                                        <input
                                          type="checkbox"
                                          className="form-check-input"
                                          id={`evening-${doctorIndex}-${dateIndex}`}
                                          checked={dateItem.evening}
                                          onChange={() => handleCheckboxChange(doctorIndex, dateIndex, 'evening')}
                                        />
                                        <label className="form-check-label" htmlFor={`evening-${doctorIndex}-${dateIndex}`}>E</label>
                                      </div>
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={loading || rosterSchedule.length === 0}
                    >
                      {loading ? 'Processing...' : (existingRosterFound ? 'Update Roster' : 'Save Roster')}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleReset}
                      disabled={loading}
                    >
                      Reset
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorRoaster;