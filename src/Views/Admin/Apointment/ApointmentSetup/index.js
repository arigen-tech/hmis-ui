import React, { useEffect, useState } from "react";

const ApointmentSetup = () => {

return(
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
      {/* Form Section */}
      <div className="row mb-3">
        <div className="col-sm-12">
          <div className="card shadow mb-3">
            <div className="card-body">
              <form>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Department *</label>
                    <select className="form-select" required>
                      <option value="">Select</option>
                      <option value="Cardiology">Cardiology</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Doctor List *</label>
                    <select className="form-select" required>
                      <option value="">Select</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Session *</label>
                    <select className="form-select" required>
                      <option value="">Select</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Start Time *</label>
                    <input type="time" className="form-control" required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">End Time *</label>
                    <input type="time" className="form-control" required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Time Taken *</label>
                    <input type="number" className="form-control" required />
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
                        {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                          <tr key={day}>
                            <td>{day}</td>
                            <td><input type="text" className="form-control" /></td>
                            <td><input type="text" className="form-control" /></td>
                            <td><input type="text" className="form-control" /></td>
                            <td><input type="text" className="form-control" /></td>
                            <td><input type="text" className="form-control" /></td>
                            <td><input type="text" className="form-control" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Changed By</label>
                    <input type="text" className="form-control" value="54321" readOnly />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Changed Date</label>
                    <input type="date" className="form-control" value="2025-02-21" readOnly />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Changed Time</label>
                    <input type="time" className="form-control" value="22:55" readOnly />
                  </div>
                </div>
                <div className="mt-4">
                  <button type="submit" className="btn btn-primary me-2">Submit</button>
                  <button type="reset" className="btn btn-secondary">Reset</button>
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

export default ApointmentSetup;