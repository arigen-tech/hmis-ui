import React, { useState, useEffect } from "react";
import { MAS_DEPARTMENT, DOCTOR, DOCTOR_ROSTER, APPOINTMENT , FILTER_OPD_DEPT} from "../../../../config/apiConfig";
import { getRequest, putRequest, postRequest } from "../../../../service/apiService";
import LoadingScreen from "../../../../Components/Loading";
import Popup from "../../../../Components/popup";

const DoctorRoaster = () => {
  const [department, setDepartment] = useState("");
  const [doctor, setDoctor] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [rowDepartmentData, setRowDepartmentData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [doctorData, setDoctorData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rosterDoctorData, setRosterDoctorData] = useState(null);
  const [popup, setPopup] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [originalRosterData, setOriginalRosterData] = useState(null); 

  const jwtToken = sessionStorage.getItem("token") || localStorage.getItem("token");


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
    if (department && fromDate) {
      prepareRosterData();
    }
  }, [department, doctor, fromDate, doctorData]);



   const fetchDepartmentData = async () => {
      setLoading(true);
      try {
        const data = await getRequest(`${MAS_DEPARTMENT}/getAll/1`);
        if (data.status === 200 && Array.isArray(data.response)) {
          const filteredDepartments = data.response.filter(
            (dept) => dept.departmentTypeName === `${FILTER_OPD_DEPT}`
          );
          setRowDepartmentData(data.response);
          setDepartmentData(filteredDepartments);
        } else {
          console.error("Unexpected API response format:", data);
          setRowDepartmentData([]);
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

  const generateDatesFromSelectedDate = () => {
    if (!fromDate) return [];
  
    const startDate = new Date(fromDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
  
    const dates = [];
  
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      currentDate.setHours(0, 0, 0, 0); 
  
      if (currentDate > today) {
        const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;
        
        dates.push(formattedDate);
      }
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
  
    const generatedDates = doctorsToUse.flatMap(doctorInfo => 
      dates.map(date => ({
        dates: date,
        rosterVale: "YY", 
        doctorId: doctorInfo.id,
        id: null,
        fromDatabase: false,
        morningModified: false,
        eveningModified: false
      }))
    );
  
    return generatedDates;
  };

  const prepareRosterData = async () => {
    if (!department || !fromDate) return;

    try {
      setLoading(true);

      const queryParams = new URLSearchParams({
        deptId: department,
        rosterDate: fromDate,
      });

      if (doctor) {
        queryParams.append("doctorId", doctor);
      }

      const apiUrl = `${DOCTOR_ROSTER}/getDoctorRosterWeekly?${queryParams.toString()}`;
      const existingRosterResponse = await getRequest(apiUrl);

      const generatedDates = generateDatesFromSelectedDate();

      let mergedDates = [];
      if (existingRosterResponse.response && existingRosterResponse.response.dates) {
        const existingDates = existingRosterResponse.response.dates.map(date => ({
          ...date,
          fromDatabase: true,
          morningModified: false,
          eveningModified: false
        }));

        const existingDatesMap = new Map();
        existingDates.forEach(date => {
          const key = `${date.doctorId}-${date.dates}`;
          existingDatesMap.set(key, date);
        });

        mergedDates = generatedDates.map(genDate => {
          const key = `${genDate.doctorId}-${genDate.dates}`;
          const existingDate = existingDatesMap.get(key);
          
          return existingDate || genDate;
        });

        existingDates.forEach(existDate => {
          const key = `${existDate.doctorId}-${existDate.dates}`;
          if (!mergedDates.some(md => `${md.doctorId}-${md.dates}` === key)) {
            mergedDates.push(existDate);
          }
        });
      } else {
        mergedDates = generatedDates;
      }

      const rosterData = {
        departmentId: parseInt(department),
        fromDate: fromDate,
        dates: mergedDates
      };

      const originalData = JSON.parse(JSON.stringify(rosterData));
      setOriginalRosterData(originalData);
      
      setRosterDoctorData(rosterData);
    } catch (error) {
      console.error("Error preparing roster data:", error);
      showPopup("Error preparing roster data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (doctorId, date, session) => {
    const formattedDate = formatDateToLocal(date);
    if (formattedDate < currentDate) return;

    const updatedDates = rosterDoctorData.dates.map(item => {
      if (item.doctorId === doctorId && item.dates === date) {
        let newRosterValue;
        switch(item.rosterVale) {
          case "YY":
            newRosterValue = session === 'morning' ? "NY" : "YN";
            break;
          case "YN":
            newRosterValue = session === 'morning' ? "NN" : "YY";
            break;
          case "NY":
            newRosterValue = session === 'morning' ? "YY" : "NN";
            break;
          case "NN":
            newRosterValue = session === 'morning' ? "YN" : "NY";
            break;
          default:
            newRosterValue = "YY";
        }

        const originalItem = originalRosterData?.dates.find(orig => 
          orig.doctorId === doctorId && orig.dates === date
        );
        
        if (originalItem && item.fromDatabase) {
          const originalValue = originalItem.rosterVale;
          
          const morningModified = session === 'morning' ? 
            originalValue.charAt(0) !== newRosterValue.charAt(0) : 
            item.morningModified;
            
          const eveningModified = session === 'evening' ? 
            originalValue.charAt(1) !== newRosterValue.charAt(1) : 
            item.eveningModified;
          
          return { 
            ...item, 
            rosterVale: newRosterValue,
            morningModified,
            eveningModified
          };
        }
        
        return { ...item, rosterVale: newRosterValue };
      }
      return item;
    });

    setRosterDoctorData(prev => ({
      ...prev,
      dates: updatedDates
    }));
  };

  const formatDateToLocal = (dateString) => {
    const [day, month, year] = dateString.split('/');
    return new Date(`${year}-${month}-${day}`);
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";
    const [day, month, year] = dateString.split('/');
    const date = new Date(`${year}-${month}-${day}`);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const isDateDisabled = (dateString) => {
    const rosterDate = formatDateToLocal(dateString);
    return rosterDate < currentDate;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!department || !fromDate) {
      showPopup("Please select Department and From Date", "error");
      return;
    }

    setLoading(true);

    try {
      const endpoint = `${DOCTOR_ROSTER}/createDoctorRoster`;
      
      const dataToSend = {
        ...rosterDoctorData,
        dates: rosterDoctorData.dates.map(({ fromDatabase, morningModified, eveningModified, ...rest }) => rest)
      };
      
      const response = await postRequest(endpoint, dataToSend);

      if (response.status === 200) {
        showPopup("Roster saved successfully!", "success");
        handleReset();
        prepareRosterData(); 
      } else {
        showPopup(`Error saving roster: ${response.message || "Unknown error"}`, "error");
      }
    } catch (error) {
      console.error("Error saving roster:", error);
      showPopup("An error occurred while saving the roster", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDepartment("");
    setDoctor("");
    setFromDate("");
    setRosterDoctorData(null);
    setOriginalRosterData(null);
  };

  const getMorningCheckboxStyle = (dateItem) => {
    if (dateItem.fromDatabase && dateItem.morningModified) {
      return { backgroundColor: "#ffd24d", borderColor: "#ffd24d" };
    } 
    else if (dateItem.fromDatabase) {
      return { backgroundColor: "#55bf70", borderColor: "#55bf70" }; 
    }
    return {};
  };
  
  const getEveningCheckboxStyle = (dateItem) => {
    if (dateItem.fromDatabase && dateItem.eveningModified) {
      return { backgroundColor: "#ffd24d", borderColor: "#ffd24d" }; 
    } 
    else if (dateItem.fromDatabase) {
      return { backgroundColor: "#55bf70", borderColor: "#55bf70" }; 
    }
    return {};
  };

  const renderRosterTable = () => {
    if (!rosterDoctorData || !rosterDoctorData.dates || rosterDoctorData.dates.length === 0) return null;

    const doctorRosterMap = new Map();
    rosterDoctorData.dates.forEach(item => {
      if (!doctorRosterMap.has(item.doctorId)) {
        doctorRosterMap.set(item.doctorId, []);
      }
      doctorRosterMap.get(item.doctorId).push(item);
    });

    const allDates = [...new Set(rosterDoctorData.dates.map(item => item.dates))].sort((a, b) => {
      const dateA = formatDateToLocal(a);
      const dateB = formatDateToLocal(b);
      return dateA - dateB;
    });

    return (
      <div className="table-responsive">
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Doctor</th>
              {allDates.map(date => (
                <th key={date} className="text-center">
                  {formatDisplayDate(date)}
                  <div className="small text-muted">
                    {formatDateToLocal(date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...doctorRosterMap.entries()].map(([doctorId, doctorDates]) => {
              const doctor = doctorData.find(d => d.userId === doctorId);
              const doctorName = doctor ? `${doctor.firstName} ${doctor.lastName}` : 'Unknown Doctor';

              return (
                <tr key={doctorId}>
                  <td>{doctorName}</td>
                  {allDates.map(date => {
                    const dateItem = doctorDates.find(d => d.dates === date);
                    
                    if (!dateItem) {
                      return (
                        <td key={date} className="text-center text-muted">
                          N/A
                        </td>
                      );
                    }

                    const isDisabled = isDateDisabled(date);
                    const rosterValue = dateItem.rosterVale;

                    return (
                      <td key={date} className="text-center">
                        <div className="form-check form-check-inline">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={rosterValue === "YY" || rosterValue === "YN"}
                            onChange={() => handleCheckboxChange(doctorId, date, 'morning')}
                            disabled={isDisabled}
                            style={getMorningCheckboxStyle(dateItem)}
                          />
                          <label
                            className={`form-check-label ${isDisabled ? 'text-muted' : ''}`}
                          >
                            M
                          </label>
                        </div>
                        <div className="form-check form-check-inline">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={rosterValue === "YY" || rosterValue === "NY"}
                            onChange={() => handleCheckboxChange(doctorId, date, 'evening')}
                            disabled={isDisabled}
                            style={getEveningCheckboxStyle(dateItem)}
                          />
                          <label
                            className={`form-check-label ${isDisabled ? 'text-muted' : ''}`}
                          >
                            E
                          </label>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="mt-2">
          <div className="d-flex align-items-center mb-2">
            <div style={{width: '20px', height: '20px', backgroundColor: '#55bf70', marginRight: '10px'}}></div>
            <span>Data from database</span>
          </div>
          <div className="d-flex align-items-center mb-2">
            <div style={{width: '20px', height: '20px', backgroundColor: '#ffd24d', marginRight: '10px'}}></div>
            <span>Modified database data</span>
          </div>
          <div className="d-flex align-items-center">
            <div style={{width: '20px', height: '20px', backgroundColor: '#0d6efd', marginRight: '10px'}}></div>
            <span>New data</span>
          </div>
        </div>
      </div>
    );
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
                            {doc.firstName} {doc.middleName} {doc.lastName}
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

                    {rosterDoctorData && renderRosterTable()}
                  </div>

                  <div className="mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={loading || !rosterDoctorData}
                    >
                      {loading ? 'Processing...' : 'Save Roster'}
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