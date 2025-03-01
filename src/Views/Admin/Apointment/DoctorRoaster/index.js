import React, { useState } from "react";

const DoctorRoaster = () => {
  return (
    <div className="body d-flex py-3">
      <div className="container-xxl">
        <div className="row align-items-center">
          <div className="border-0 mb-4">
            <div className="card-header py-3 bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap">
              <h3 className="fw-bold mb-0">Doctor Roaster</h3>
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
                        <option value="DENTAL">DENTAL</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Doctor *</label>
                      <select className="form-select" required>
                        <option value="">Select</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">From Date *</label>
                      <input type="date" className="form-control" required />
                    </div>
                    <div className="col-md-12">
                      <table className="table table-bordered">
                        <thead>
                          <tr>
                            <th>Doctor</th>
                            {[...Array(7)].map((_, i) => (
                              <th key={i}>{`Date ${i + 19}/02/2025`}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {["DR. VARGHESE CHANDY", "Dr. Kamaleshwar Dayal Sahu", "DR. J UMESH", "DR. S NANDITA"].map((doctor) => (
                            <tr key={doctor}>
                              <td>{doctor}</td>
                              {[...Array(7)].map((_, i) => (
                                <td key={i} className="text-center">
                                  <input type="checkbox" className="me-1" /> M
                                  <input type="checkbox" className="me-1 ms-3" /> E
                                </td>
                              ))}
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
                      <input type="time" className="form-control" value="22:58" readOnly />
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
  );
};

export default DoctorRoaster;
