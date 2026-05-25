import React, { useState } from 'react';

// Sample diet order history data - ALL VALUES CHANGED
const dietOrderHistoryData = [
  {
    id: 1,
    dietCategory: 'Low Sodium',
    fromDateTime: '05-Jan-2026 07:30',
    toDateTime: '07-Jan-2026 18:00',
    specialInstruction: 'Restrict salt, no processed food',
    orderedBy: 'Dietician – Mr. Amit Sharma',
    status: 'Completed',
    completedOn: '07-Jan-2026 18:00'
  },
  {
    id: 2,
    dietCategory: 'High Fiber',
    fromDateTime: '08-Jan-2026 08:00',
    toDateTime: '10-Jan-2026 20:00',
    specialInstruction: 'Whole grains, fruits, vegetables',
    orderedBy: 'Doctor – Dr. Priya Nair',
    status: 'Completed',
    completedOn: '10-Jan-2026 20:00'
  },
  {
    id: 3,
    dietCategory: 'Renal',
    fromDateTime: '11-Jan-2026 09:00',
    toDateTime: '14-Jan-2026 12:00',
    specialInstruction: 'Low protein, low potassium',
    orderedBy: 'Dietician – Ms. Sunita Reddy',
    status: 'Completed',
    completedOn: '14-Jan-2026 12:00'
  },
  {
    id: 4,
    dietCategory: 'Gluten Free',
    fromDateTime: '15-Jan-2026 13:00',
    toDateTime: null,
    specialInstruction: 'No wheat, barley, rye',
    orderedBy: 'Dietician – Mr. Amit Sharma',
    status: 'Active',
    completedOn: '—'
  }
];

// Get the active diet order (the one with status 'Active')
const activeDietOrder = dietOrderHistoryData.find(order => order.status === 'Active') || dietOrderHistoryData[0];

// Helper to get current date in YYYY-MM-DD format
const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

// Helper to get current time in HH:MM format
const getCurrentTime = () => {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
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

// Meal type options
const mealOptions = ['Breakfast', 'Lunch', 'Evening Snack', 'Dinner'];

// Status options
const statusOptions = ['Given', 'Not Taken', 'Partial', 'Refused'];

// Auto Given By value (can be from context/state)
const AUTO_GIVEN_BY = 'Nurse Station';

// Empty meal entry row template
const emptyMealEntry = () => ({
  id: Date.now(),
  date: getCurrentDate(),
  mealType: '',
  plannedTime: '',
  actualTime: getCurrentTime(),
  status: '',
  consumedPercent: '',
  remarks: '',
  givenBy: AUTO_GIVEN_BY
});

const DietOrderHistory = () => {
  const [showModal, setShowModal] = useState(false);

  // State for meal entries (Diet history and new entry table) - ALL VALUES CHANGED
  const [mealEntries, setMealEntries] = useState([
    {
      id: 1,
      date: '15-Jan-2026',
      mealType: 'Breakfast',
      plannedTime: '08:00',
      actualTime: '08:15',
      status: 'Given',
      consumedPercent: '100%',
      remarks: 'Finished completely',
      givenBy: 'Nurse C'
    },
    {
      id: 2,
      date: '15-Jan-2026',
      mealType: 'Lunch',
      plannedTime: '13:00',
      actualTime: '13:30',
      status: 'Partial',
      consumedPercent: '50%',
      remarks: 'Ate half portion',
      givenBy: 'Nurse D'
    },
    {
      id: 3,
      date: '15-Jan-2026',
      mealType: 'Evening Snack',
      plannedTime: '16:00',
      actualTime: '16:20',
      status: 'Given',
      consumedPercent: '90%',
      remarks: 'Enjoyed snack',
      givenBy: 'Nurse E'
    },
    emptyMealEntry()
  ]);

  // Helper to check if a row is the last (input) row
  const isLastRow = (index, array) => index === array.length - 1;

  // Handle cell change for meal entries
  const handleMealCellChange = (id, field, value) => {
    setMealEntries(prev => prev.map(entry => {
      if (entry.id === id) {
        const updated = { ...entry, [field]: value };
        // Auto-set planned time when meal type changes
        if (field === 'mealType') {
          updated.plannedTime = getPlannedTimeForMeal(value);
        }
        return updated;
      }
      return entry;
    }));
  };

  // Save the current input row (last row)
  const handleSaveMealEntry = () => {
    const lastRow = mealEntries[mealEntries.length - 1];
    // Validation: at least mealType should be selected
    if (!lastRow.mealType) {
      alert('Please select a meal type before saving.');
      return;
    }
    // Create a new row with the current values (without modifying the last row directly)
    const savedEntry = { ...lastRow };
    // Ensure consumedPercent has % sign if number
    if (savedEntry.consumedPercent && !isNaN(Number(savedEntry.consumedPercent)) && !savedEntry.consumedPercent.includes('%')) {
      savedEntry.consumedPercent = `${savedEntry.consumedPercent}%`;
    }
    // Replace the last row with the saved entry and add a new empty row
    const newEmpty = emptyMealEntry();
    setMealEntries(prev => [
      ...prev.slice(0, -1),
      savedEntry,
      newEmpty
    ]);
  };

  // Delete a meal entry (non-last rows only)
  const handleDeleteMealEntry = (id) => {
    const isLast = mealEntries[mealEntries.length - 1].id === id;
    if (isLast) return;
    if (window.confirm('Are you sure you want to delete this meal entry?')) {
      setMealEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  return (
    <>
      {/* Main Page Content */}
      <div>
        {/* Current Active Diet Order Details with Button inside */}
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
              <div className="col-md-3">
                <strong>Diet Category:</strong> {activeDietOrder.dietCategory}
              </div>
              <div className="col-md-4">
                <strong>Special Instruction:</strong> {activeDietOrder.specialInstruction}
              </div>
              <div className="col-md-3">
                <strong>Effective From:</strong> {activeDietOrder.fromDateTime}
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
                        {/* Meal Type Dropdown */}
                        <td>
                          {editable ? (
                            <select
                              className="form-select form-select-sm"
                              value={entry.mealType}
                              onChange={(e) => handleMealCellChange(entry.id, 'mealType', e.target.value)}
                            >
                              <option value="">Select Meal</option>
                              {mealOptions.map(meal => (
                                <option key={meal} value={meal}>{meal}</option>
                              ))}
                            </select>
                          ) : (
                            <span>{entry.mealType}</span>
                          )}
                        </td>
                        {/* Planned Time (Auto) */}
                        <td>
                          {editable ? (
                            <input
                              type="time"
                              className="form-control form-control-sm"
                              value={entry.plannedTime}
                              readOnly
                              style={{ backgroundColor: '#e9ecef' }}
                            />
                          ) : (
                            <span>{entry.plannedTime}</span>
                          )}
                        </td>
                        {/* Actual Time (Auto but editable) */}
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
                        {/* Status Dropdown */}
                        <td>
                          {editable ? (
                            <select
                              className="form-select form-select-sm"
                              value={entry.status}
                              onChange={(e) => handleMealCellChange(entry.id, 'status', e.target.value)}
                            >
                              <option value="">Select Status</option>
                              {statusOptions.map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          ) : (
                            <span>{entry.status}</span>
                          )}
                        </td>
                        {/* Consumed % */}
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
                            {dietOrderHistoryData.map(order => (
                              <tr key={order.id} className={order.status === 'Active' ? 'table-success' : ''}>
                                <td>{order.dietCategory}</td>
                                <td>{order.fromDateTime}</td>
                                <td>{order.toDateTime || 'Present'}</td>
                                <td>{order.specialInstruction}</td>
                                <td>{order.orderedBy}</td>
                                <td>
                                  <span className={`badge ${order.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                                    {order.status}
                                  </span>
                                </td>
                                <td>{order.completedOn}</td>
                              </tr>
                            ))}
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