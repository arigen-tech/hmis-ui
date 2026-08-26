import React, { useState, useEffect, useRef } from 'react';
import { getRequest, postRequest } from '../../../service/apiService';
import { GET_PREVIOUS_DIET_ORDER_HISTORY, GET_CURRENT_ACTIVE_DIET_SCHEDULE, SAVE_CURRENT_ACTIVE_DIET_SCHEDULE, GET_CURRENT_USER_PROFILE_BY_NAME, MAS_MEAL_TYPE, MAS_DIET_SCHEDULE } from '../../../config/apiConfig';
import Swal from 'sweetalert2';

// Helper to get current date in YYYY-MM-DD format
const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

// Helper to get current time in HH:MM format
const getCurrentTime = () => {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const formatTimeToString = (timeStr) => {
  if (!timeStr) return "00:00:00";
  // If time already contains seconds, return as is
  if (timeStr.split(':').length === 3) return timeStr;
  // Otherwise append seconds
  return `${timeStr}:00`;
};

// Get planned time based on meal type
const getPlannedTimeForMeal = (mealType) => {
  switch (mealType) {
    case 'Breakfast':
      return '08:00';
    case 'Lunch':
      return '13:00';
    case 'Evening Snack':
      return '16:00';
    case 'Dinner':
      return '19:00';
    default:
      return '08:00';
  }
};

// Auto Given By value
const AUTO_GIVEN_BY = sessionStorage.getItem("username") || "System";
const NEW_RECORD_ID = 'NEW_ROW';

// Empty meal entry row template
const emptyMealEntry = (givenBy = AUTO_GIVEN_BY) => ({
  id: NEW_RECORD_ID,
  date: getCurrentDate(),
  mealType: '',
  plannedTime: '',
  actualTime: getCurrentTime(),
  status: '',
  consumedPercent: '',
  remarks: '',
  givenBy: givenBy
});

const DietOrderHistory = ({ selectedPatient }) => {
  const [showModal, setShowModal] = useState(false);
  const [dietHistory, setDietHistory] = useState([]);
  const [loadingDietHistory, setLoadingDietHistory] = useState(false);
  
  const [currentUserName, setCurrentUserName] = useState(AUTO_GIVEN_BY);
  const userNameRef = useRef(AUTO_GIVEN_BY);
  const [mealTypeOptions, setMealTypeOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [mealRes, statusRes] = await Promise.all([
          getRequest(`${MAS_MEAL_TYPE}/getAll/1`),
          getRequest(`${MAS_DIET_SCHEDULE}/getAll/1`)
        ]);
        if (mealRes?.status === 200 && mealRes.response) {
          setMealTypeOptions(mealRes.response);
        }
        if (statusRes?.status === 200 && statusRes.response) {
          setStatusOptions(statusRes.response);
        }
      } catch (err) {
        console.error("Error fetching diet masters", err);
      }
    };
    fetchDropdowns();

    const fetchUser = async () => {
      const username = localStorage.getItem("username") || sessionStorage.getItem("username");
      if (!username) return;
      try {
        const res = await getRequest(`${GET_CURRENT_USER_PROFILE_BY_NAME}/${username}`);
        if (res?.status === 200 && res.response) {
          const docName = res.response.firstName
            ? [res.response.firstName, res.response.middleName, res.response.lastName].filter(Boolean).join(" ")
            : (res.response.name || res.response.userName || username);
          userNameRef.current = docName;
          setCurrentUserName(docName);
          
          // Update the empty row's givenBy if it's the last row
          setMealEntries(prev => {
            const lastRow = prev[prev.length - 1];
            if (lastRow && lastRow.id === NEW_RECORD_ID) {
              const updated = [...prev];
              updated[updated.length - 1] = { ...lastRow, givenBy: docName };
              return updated;
            }
            return prev;
          });
        }
      } catch (err) { }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (selectedPatient?.inpatientId) {
      fetchDietHistory(selectedPatient.inpatientId);
    }
  }, [selectedPatient]);

  const fetchDietHistory = async (inpatientId) => {
    setLoadingDietHistory(true);
    try {
      const res = await getRequest(`${GET_PREVIOUS_DIET_ORDER_HISTORY}?inpatientId=${inpatientId}`);
      if (res?.status === 200 && Array.isArray(res.response)) {
        setDietHistory(res.response);
      } else {
        setDietHistory([]);
      }
    } catch (err) {
      console.error("Error fetching diet history:", err);
      setDietHistory([]);
    } finally {
      setLoadingDietHistory(false);
    }
  };

  // Get the active diet order (the one with status 'A')
  const activeDietOrder = dietHistory.find(order => order.status === 'A') || dietHistory[0] || {};

  // State for meal entries
  const [mealEntries, setMealEntries] = useState([emptyMealEntry()]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  useEffect(() => {
    if (selectedPatient?.inpatientId && activeDietOrder?.dietOrderId) {
      fetchActiveDietSchedule(selectedPatient.inpatientId, activeDietOrder.dietOrderId);
    } else {
      setMealEntries([emptyMealEntry(userNameRef.current)]);
    }
  }, [selectedPatient?.inpatientId, activeDietOrder?.dietOrderId]);

  const fetchActiveDietSchedule = async (inpatientId, dietOrderId) => {
    setLoadingSchedule(true);
    try {
      const res = await getRequest(`${GET_CURRENT_ACTIVE_DIET_SCHEDULE}?inpatientId=${inpatientId}&dietOrderId=${dietOrderId}`);
      if (res?.status === 200 && Array.isArray(res.response)) {
        const formattedEntries = res.response.map(entry => ({
          id: entry.dietScheduleId,
          date: entry.date || '',
          mealType: entry.mealType || '',
          plannedTime: entry.planedTime || '',
          actualTime: entry.actualTime || '',
          status: entry.status || '',
          consumedPercent: entry.consumed !== null ? `${entry.consumed}%` : '',
          remarks: entry.remark || '',
          givenBy: entry.givenBy || AUTO_GIVEN_BY
        }));
        setMealEntries([...formattedEntries, emptyMealEntry(userNameRef.current)]);
      } else {
        setMealEntries([emptyMealEntry(userNameRef.current)]);
      }
    } catch (err) {
      console.error("Error fetching active diet schedule:", err);
      setMealEntries([emptyMealEntry()]);
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Helper to check if a row is the last (input) row
  const isLastRow = (index, array) => index === array.length - 1;

  // Handle cell change for meal entries
  const handleMealCellChange = (id, field, value) => {
    setMealEntries(prev => prev.map(entry => {
      if (entry.id === id) {
        const updated = { ...entry, [field]: value };
        if (field === 'mealType') {
          updated.plannedTime = getPlannedTimeForMeal(value);
        }
        return updated;
      }
      return entry;
    }));
  };

  // Save the current input row (last row)
  const handleSaveMealEntry = async () => {
    const lastRow = mealEntries[mealEntries.length - 1];
    if (!lastRow.mealType) {
      alert('Please select a meal type before saving.');
      return;
    }
    
    if (!activeDietOrder?.dietOrderId || !selectedPatient?.inpatientId) {
      alert('No active diet order or patient selected to attach this entry to.');
      return;
    }

    const savedEntry = { ...lastRow };
    if (savedEntry.consumedPercent && !isNaN(Number(savedEntry.consumedPercent)) && !savedEntry.consumedPercent.includes('%')) {
      savedEntry.consumedPercent = `${savedEntry.consumedPercent}%`;
    }
    
    const selectedMeal = mealTypeOptions.find(m => m.mealTypeName === savedEntry.mealType);
    const selectedStatus = statusOptions.find(s => s.statusName === savedEntry.status);

    const payload = {
      inpatientId: selectedPatient.inpatientId,
      dietOrderId: activeDietOrder.dietOrderId,
      dietDate: savedEntry.date,
      dietMealId: selectedMeal ? selectedMeal.mealTypeId : 0,
      planedTime: formatTimeToString(savedEntry.plannedTime),
      actualTime: formatTimeToString(savedEntry.actualTime),
      scheduleStatusId: selectedStatus ? selectedStatus.dietScheduleStatusId : 0,
      remark: savedEntry.remarks,
      givenBy: currentUserName,
      consumed: parseInt(savedEntry.consumedPercent) || 0
    };

    try {
      const res = await postRequest(SAVE_CURRENT_ACTIVE_DIET_SCHEDULE, payload);
      if (res?.status === 200) {
        await Swal.fire({
          icon: "success",
          title: "Success",
          text: "Diet schedule entry saved successfully!",
        });
        // Refresh the schedule list
        fetchActiveDietSchedule(selectedPatient.inpatientId, activeDietOrder.dietOrderId);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to save: " + (res?.message || "Unknown error"),
        });
      }
    } catch (error) {
      console.error("Error saving diet schedule:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error saving diet schedule entry.",
      });
    }
  };

  return (
    <>
      <div>
        <div className="card mb-3">
          <div className="card-header bg-primary text-white py-1 d-flex justify-content-between align-items-center">
            <strong>Current Active Diet Order</strong>
            <button
              className="btn btn-outline-light btn-sm"
              onClick={() => setShowModal(true)}
            >
              View past diet order history
            </button>
          </div>
          <div className="card-body py-1">
            <div className="row">
              <div className="col-12 col-md-6 d-flex justify-content-start align-items-center">
                <h6 className="mb-0 text-success fw-bold">Active Diet: {activeDietOrder.dietTypeName || '-'}</h6>
              </div>
              <div className="col-md-4">
                <strong>Special Instruction:</strong> {activeDietOrder.specialInstruction || '-'}
              </div>
              <div className="col-md-3">
                <strong>Effective From:</strong> {activeDietOrder.fromDate || '-'}
              </div>
              <div className="col-md-2">
                <strong>Ordered By:</strong> {activeDietOrder.orderedBy}
              </div>
            </div>
          </div>
        </div>

        {/* Diet History and New Entry Table - No big heading, just the table */}
        <div className="card shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-bordered table-hover mb-0 align-middle" style={{ fontSize: '0.8rem' }}>
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Meal</th>
                    <th>Planned Time</th>
                    <th>Actual Time</th>
                    <th>Status</th>
                    <th>Consumed %</th>
                    <th>Remarks</th>
                    <th>Given By</th>
                  </tr>
                </thead>
                <tbody>
                  {mealEntries.map((entry, index) => {
                    const editable = isLastRow(index, mealEntries);
                    return (
                      <tr key={entry.id} className={editable ? '' : 'table-secondary'}>
                        {/* Date */}
                        <td>
                          {editable ? (
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={entry.date}
                              onChange={(e) => handleMealCellChange(entry.id, 'date', e.target.value)}
                            />
                          ) : (
                            <span>{entry.date}</span>
                          )}
                        </td>
                        <td>
                            {editable ? (
                              <select
                                className="form-select form-select-sm"
                                value={entry.mealType}
                                onChange={(e) => handleMealCellChange(entry.id, 'mealType', e.target.value)}
                              >
                                <option value="">Select Meal</option>
                                {mealTypeOptions.map(meal => (
                                  <option key={meal.mealTypeId} value={meal.mealTypeName}>{meal.mealTypeName}</option>
                                ))}
                              </select>
                            ) : (
                            <span>{entry.mealType}</span>
                          )}
                        </td>
                        <td>
                          {editable ? (
                            <input
                              type="time"
                              className="form-control form-control-sm"
                              value={entry.plannedTime}
                              onChange={(e) => handleMealCellChange(entry.id, 'plannedTime', e.target.value)}
                            />
                          ) : (
                            <span>{entry.plannedTime}</span>
                          )}
                        </td>
                        <td>
                          {editable ? (
                            <input
                              type="time"
                              className="form-control form-control-sm"
                              value={entry.actualTime}
                              onChange={(e) => handleMealCellChange(entry.id, 'actualTime', e.target.value)}
                            />
                          ) : (
                            <span>{entry.actualTime}</span>
                          )}
                        </td>
                        <td>
                            {editable ? (
                              <select
                                className="form-select form-select-sm"
                                value={entry.status}
                                onChange={(e) => handleMealCellChange(entry.id, 'status', e.target.value)}
                              >
                                <option value="">Select Status</option>
                                {statusOptions.map(status => (
                                  <option key={status.dietScheduleStatusId} value={status.statusName}>{status.statusName}</option>
                                ))}
                              </select>
                            ) : (
                            <span>{entry.status}</span>
                          )}
                        </td>
                        <td>
                          {editable ? (
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={entry.consumedPercent}
                              onChange={(e) => handleMealCellChange(entry.id, 'consumedPercent', e.target.value)}
                              placeholder="e.g., 75%"
                            />
                          ) : (
                            <span>{entry.consumedPercent}</span>
                          )}
                        </td>
                        {/* Remarks */}
                        <td>
                          {editable ? (
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={entry.remarks}
                              onChange={(e) => handleMealCellChange(entry.id, 'remarks', e.target.value)}
                              placeholder="Optional"
                            />
                          ) : (
                            <span>{entry.remarks || '—'}</span>
                          )}
                        </td>
                        {/* Given By (Auto) */}
                        <td>
                          {editable ? (
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={entry.givenBy}
                              readOnly
                              style={{ backgroundColor: '#e9ecef' }}
                            />
                          ) : (
                            <span>{entry.givenBy}</span>
                          )}
                        </td>
                        {/* Delete button (only for non-last rows) */}
                        
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="d-flex gap-2 justify-content-end py-2 px-2">
            <button className="btn btn-success btn-sm" onClick={handleSaveMealEntry}>
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Modal with Backdrop – only Past Diet Orders History */}
      {showModal && (
        <>
          {/* Backdrop overlay */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1040
            }}
            onClick={() => setShowModal(false)}
          />
          
          {/* Modal container */}
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
              pointerEvents: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-dialog modal-dialog-centered modal-xl" role="document">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">Past Diet Orders History</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowModal(false)}
                  />
                </div>
                <div className="modal-body">
                  {/* Past Diet Orders Table only */}
                  <div className="card shadow-sm">
                    <div className="card-header bg-secondary text-white py-2">
                      <strong>Past Diet Orders</strong>
                    </div>
                    <div className="card-body p-0">
                      <div className="table-responsive">
                        <table className="table table-bordered table-hover mb-0 align-middle" style={{ fontSize: '0.8rem' }}>
                          <thead className="table-light">
                            <tr>
                              <th>Diet Category</th>
                              <th>From Date - Time</th>
                              <th>To Date - Time</th>
                              <th>Special Instruction</th>
                              <th>Ordered By</th>
                              <th>Status</th>
                              <th>Completed On</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loadingDietHistory ? (
                              <tr>
                                <td colSpan="7" className="text-center py-4">Loading diet history...</td>
                              </tr>
                            ) : dietHistory.length === 0 ? (
                              <tr>
                                <td colSpan="7" className="text-center py-4 text-muted">No past diet orders found.</td>
                              </tr>
                            ) : (
                              dietHistory.map(order => (
                                <tr key={order.dietOrderId} className={order.status === 'A' ? 'table-success' : ''}>
                                  <td>{order.dietTypeName || '-'}</td>
                                  <td>{order.fromDate || '-'}</td>
                                  <td>{order.toDate || '-'}</td>
                                  <td>{order.specialInstruction || '-'}</td>
                                  <td>{order.orderedBy || '-'}</td>
                                  <td>
                                    <span className={`badge ${order.status === 'A' ? 'bg-success' : 'bg-secondary'}`}>
                                      {order.status === 'A' ? 'Active' : 'Completed'}
                                    </span>
                                  </td>
                                  <td>{order.status !== 'A' ? (order.toDate || '-') : '-'}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default DietOrderHistory;