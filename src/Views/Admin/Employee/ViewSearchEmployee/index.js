import React, { useState } from "react";

const ViewSearchEmployee = () => {
  const [employees, setEmployees] = useState([
    {
      employeeName: "HULESH NATH YOGI",
      gender: "MALE",
      dateOfBirth: "16/02/1993",
      mobileNo: "7770000654",
      typeOfEmployee: "Doctor",
      lastStatus: "Approved By APM",
    },
    {
      employeeName: "Chitra Sahu",
      gender: "FEMALE",
      dateOfBirth: "07/03/1992",
      mobileNo: "9827157828",
      typeOfEmployee: "Doctor",
      lastStatus: "Approved By APM/Auditor",
    },
    {
      employeeName: "Vijay Laxmi Srivastav",
      gender: "FEMALE",
      dateOfBirth: "21/07/1994",
      mobileNo: "8827184834",
      typeOfEmployee: "Doctor",
      lastStatus: "Approved By APM",
    },
    {
      employeeName: "APURVA LONHARE",
      gender: "FEMALE",
      dateOfBirth: "20/08/1992",
      mobileNo: "9893146477",
      typeOfEmployee: "Doctor",
      lastStatus: "Approved By APM",
    },
    {
      employeeName: "Akash Chandrakar",
      gender: "MALE",
      dateOfBirth: "20/04/1991",
      mobileNo: "8058384085",
      typeOfEmployee: "Doctor",
      lastStatus: "Approved By APM",
    },
  ]);

  return (
    <div className="body d-flex py-3">
      <div className="container-xxl">
        <div className="row align-items-center">
          <div className="border-0 mb-4">
            <div className="card-header py-3 bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap">
              <h3 className="fw-bold mb-0">Employee List</h3>
            </div>
          </div>
        </div>

        {/* Employee List Table */}
        <div className="row">
          <div className="col-sm-12">
            <div className="card shadow">
              <div className="card-body">
                {/* Search Section */}
                <div className="row mb-3">
                <div className="col-md-4">
                    <input type="text" className="form-control" placeholder="Mobile Number" />
                </div>
                <div className="col-md-4">
                    <input type="text" className="form-control" placeholder="Employee Name" />
                </div>
                <div className="col-md-2">
                    <button className="btn btn-primary w-100">Search</button>
                </div>
                <div className="col-md-2">
                    <button className="btn btn-warning w-100">Show All</button>
                </div>
                </div>
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Employee Name</th>
                      <th>Gender</th>
                      <th>Date Of Birth</th>
                      <th>Mobile No</th>
                      <th>Type Of Employee</th>
                      <th>Last Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.length > 0 ? (
                      employees.map((employee, index) => (
                        <tr key={index}>
                          <td>{employee.employeeName}</td>
                          <td>{employee.gender}</td>
                          <td>{employee.dateOfBirth}</td>
                          <td>{employee.mobileNo}</td>
                          <td>{employee.typeOfEmployee}</td>
                          <td>{employee.lastStatus}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center text-danger">No Record Found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {/* Pagination */}
                <div className="d-flex align-items-center justify-content-end">
                    <span className="me-2">Go To Page</span>
                    <input type="text" className="form-control me-2" style={{ width: "60px" }} />
                    <button className="btn btn-warning">Go</button>
                    <span className="mx-3">Page 1 of 2</span>
                    <button className="btn btn-light" disabled>&laquo;</button>
                    <button className="btn btn-light" disabled>&lsaquo;</button>
                    <button className="btn btn-light">&rsaquo;</button>
                    <button className="btn btn-light">&raquo;</button>
                </div>

              </div>
               
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewSearchEmployee;