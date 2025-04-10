import { useState } from "react"

const ViewSearchEmployee = () => {
  const [showForm, setShowForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)

  const [employees, setEmployees] = useState([
    {
      id: 1,
      employeeName: "HULESH NATH YOGI",
      gender: "MALE",
      dateOfBirth: "16/02/1993",
      mobileNo: "7770000654",
      typeOfEmployee: "Doctor",
      lastStatus: "Approved By APM",
      status: "y",
    },
    {
      id: 2,
      employeeName: "Chitra Sahu",
      gender: "FEMALE",
      dateOfBirth: "07/03/1992",
      mobileNo: "9827157828",
      typeOfEmployee: "Doctor",
      lastStatus: "Approved By APM/Auditor",
      status: "n",
    },
    {
      id: 3,
      employeeName: "Vijay Laxmi Srivastav",
      gender: "FEMALE",
      dateOfBirth: "21/07/1994",
      mobileNo: "8827184834",
      typeOfEmployee: "Doctor",
      lastStatus: "Approved By APM",
      status: "y",
    },
    {
      id: 4,
      employeeName: "APURVA LONHARE",
      gender: "FEMALE",
      dateOfBirth: "20/08/1992",
      mobileNo: "9893146477",
      typeOfEmployee: "Doctor",
      lastStatus: "Approved By APM",
      status: "n",
    },
    {
      id: 5,
      employeeName: "Akash Chandrakar",
      gender: "MALE",
      dateOfBirth: "20/04/1991",
      mobileNo: "8058384085",
      typeOfEmployee: "Doctor",
      lastStatus: "Approved By APM",
      status: "y",
    },
  ])

  const [formData, setFormData] = useState({
    qualification: [
      { employeeQualificationId: 1, institutionName: "", completionYear: 0, qualificationName: "", filePath: null },
    ],
    document: [{ employeeDocumentId: 1, documentName: "", filePath: null }],
  })

  const [educationFormData, setEducationFormData] = useState({
    qualification: [
      { employeeQualificationId: 1, institutionName: "", completionYear: 0, qualificationName: "", filePath: null },
    ],
    document: [{ employeeDocumentId: 1, documentName: "", filePath: null }],
  })

  const handleQualificationChange = (index, field, value) => {
    setEducationFormData((prev) => ({
      ...prev,
      qualification: prev.qualification.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }))
  }

  const removeEducationRow = (index) => {
    setEducationFormData((prev) => ({
      ...prev,
      qualification: prev.qualification.filter((_, i) => i !== index),
    }))
  }

  const addEducationRow = (e) => {
    e.preventDefault()

    setEducationFormData((prev) => ({
      ...prev,
      qualification: [
        ...prev.qualification,
        {
          employeeQualificationId: prev.qualification.length + 1,
          institutionName: "",
          completionYear: "",
          qualificationName: "",
          filePath: null,
        },
      ],
    }))
  }

  // Document handlers
  const handleDocumentChange = (index, field, value) => {
    setEducationFormData((prev) => ({
      ...prev,
      document: prev.document.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }))
  }

  const addDocumentRow = () => {
    setEducationFormData((prev) => ({
      ...prev,
      document: [...prev.document, { employeeDocumentId: prev.document.length + 1, documentName: "", filePath: null }],
    }))
  }

  const removeDocumentRow = (index) => {
    setEducationFormData((prev) => ({
      ...prev,
      document: prev.document.filter((_, i) => i !== index),
    }))
  }

  const handleSwitchChange = (id, newStatus) => {
    setEmployees((prevEmployees) =>
      prevEmployees.map((employee) => (employee.id === id ? { ...employee, status: newStatus } : employee)),
    )
  }

  const handleAnotherAction = (employee) => {
    // Set the employee data to edit
    setEditingEmployee(employee)

    // Split the name into first, middle, and last
    const nameParts = employee.employeeName.split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ""
    const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : ""

    // Format date from DD/MM/YYYY to YYYY-MM-DD for input type="date"
    const dateParts = employee.dateOfBirth.split("/")
    const formattedDate = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : ""

    // Show the form
    setShowForm(true)
  }

  const resetForm = () => {
    setEditingEmployee(null)
    setShowForm(false)
    setEducationFormData({
      qualification: [
        { employeeQualificationId: 1, institutionName: "", completionYear: 0, qualificationName: "", filePath: null },
      ],
      document: [{ employeeDocumentId: 1, documentName: "", filePath: null }],
    })
  }

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

        {!showForm ? (
          <div className="row">
            <div className="col-sm-12">
              <div className="card shadow">
                <div className="card-body">
                  {/* Search Section */}
                  <div className="row mb-4">
                    <div className="col-md-3">
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
                        <th>Status</th>
                        <th>Edit</th>
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
                            <td>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={employee.status === "y"}
                                  onChange={() => handleSwitchChange(employee.id, employee.status === "y" ? "n" : "y")}
                                  id={`switch-${employee.id}`}
                                />
                                <label className="form-check-label px-0" htmlFor={`switch-${employee.id}`}>
                                  {employee.status === "y" ? "Active" : "Inactive"}
                                </label>
                              </div>
                            </td>
                            <td>
                              <button className="btn btn-sm btn-success" onClick={() => handleAnotherAction(employee)} disabled={employee.status === "n"} >
                                <i className="fa fa-pencil"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center text-danger">
                            No Record Found
                          </td>
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
                    <button className="btn btn-light" disabled>
                      &laquo;
                    </button>
                    <button className="btn btn-light" disabled>
                      &lsaquo;
                    </button>
                    <button className="btn btn-light">&rsaquo;</button>
                    <button className="btn btn-light">&raquo;</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form className="forms row">
            <div className="g-3 row">
              <div className="col-md-4">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  id="firstName"
                  placeholder="First Name"
                  defaultValue={editingEmployee ? editingEmployee.employeeName.split(" ")[0] : ""}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Middle Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="middleName"
                  placeholder="Middle Name"
                  defaultValue={
                    editingEmployee && editingEmployee.employeeName.split(" ").length > 2
                      ? editingEmployee.employeeName.split(" ").slice(1, -1).join(" ")
                      : ""
                  }
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  id="lastName"
                  placeholder="Last Name"
                  defaultValue={
                    editingEmployee && editingEmployee.employeeName.split(" ").length > 1
                      ? editingEmployee.employeeName.split(" ").pop()
                      : ""
                  }
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Date of Birth *</label>
                <input
                  type="date"
                  required
                  id="dob"
                  className="form-control"
                  defaultValue={
                    editingEmployee
                      ? `${editingEmployee.dateOfBirth.split("/")[2]}-${editingEmployee.dateOfBirth.split("/")[1]}-${editingEmployee.dateOfBirth.split("/")[0]}`
                      : ""
                  }
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Gender *</label>
                <select
                  className="form-select"
                  style={{ paddingRight: "40px" }}
                  defaultValue={editingEmployee ? editingEmployee.gender : ""}
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">MALE</option>
                  <option value="FEMALE">FEMALE</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Address *</label>
                <textarea
                  required
                  id="address1"
                  className="form-control"
                  defaultValue={editingEmployee ? editingEmployee.address : ""}
                ></textarea>
              </div>
              <div className="col-md-4">
                <label className="form-label">Country *</label>
                <select className="form-select" defaultValue={editingEmployee ? editingEmployee.country : ""}>
                  <option value="">Select Country</option>
                  <option value="1">Country 1</option>
                  <option value="2">Country 2</option>
                  <option value="3">Country 3</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">State *</label>
                <select className="form-select" defaultValue={editingEmployee ? editingEmployee.state : ""}>
                  <option value="">Select State</option>
                  <option value="1">State 1</option>
                  <option value="2">State 2</option>
                  <option value="3">State 3</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">District *</label>
                <select className="form-select" defaultValue={editingEmployee ? editingEmployee.district : ""}>
                  <option value="">Select District</option>
                  <option value="1">District 1</option>
                  <option value="2">District 2</option>
                  <option value="3">District 3</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">City *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  id="city"
                  placeholder="City"
                  defaultValue={editingEmployee ? editingEmployee.city : ""}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Pincode *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  id="pincode"
                  placeholder="Pincode"
                  defaultValue={editingEmployee ? editingEmployee.pincode : ""}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Mobile No. *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  id="mobileNo"
                  placeholder="Mobile No."
                  defaultValue={editingEmployee ? editingEmployee.mobileNo : ""}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">ID Type *</label>
                <select
                  className="form-select"
                  style={{ paddingRight: "40px" }}
                  defaultValue={editingEmployee ? editingEmployee.idType : ""}
                >
                  <option value="">Select ID</option>
                  <option value="1">ID 1 </option>
                  <option value="2">ID 2</option>
                  <option value="3">ID 3</option>
                  <option value="4">ID 4</option>
                  <option value="5">ID 5</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">ID Number *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  id="ID Number"
                  placeholder="ID Number"
                  defaultValue={editingEmployee ? editingEmployee.idNumber : ""}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">ID Upload (JPEG/PDF) *</label>
                <input type="file" id="idDocumentName" className="form-control mt-2" accept=".jpg,.jpeg,.png,.pdf" />
                {editingEmployee && editingEmployee.idDocument && (
                  <small className="text-muted">Current file: {editingEmployee.idDocument}</small>
                )}
              </div>
              <div className="col-md-4">
                <label className="form-label">Role Name *</label>
                <select
                  className="form-select"
                  style={{ paddingRight: "40px" }}
                  defaultValue={editingEmployee ? editingEmployee.Role : ""}
                >
                  <option value="">Select Role</option>
                  <option value="">Role 1</option>
                  <option value="1">Role 2</option>
                  <option value="2">Role 3</option>
                  <option value="3">Role 4</option>
                  <option value="4">Role 5</option>
                  <option value="5">Role 6</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Period of Employment From Date</label>
                <input
                  type="date"
                  id="fromDate"
                  className="form-control"
                  defaultValue={editingEmployee ? editingEmployee.fromDate : ""}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Type of Employee *</label>
                <select
                  className="form-select"
                  style={{ paddingRight: "40px" }}
                >
                  <option value="">Select type of employee</option>
                  <option value="option 1">Option 1</option>
                  <option value="option 2">Option 2</option>
                  <option value="option 3">Option 3</option>
                </select>
              </div> <div className="col-md-4">
                <label className="form-label">Type of Employment *</label>
                <select
                  className="form-select"
                  style={{ paddingRight: "40px" }}
                >
                  <option value="">Select type of Employment</option>
                  <option value="option 1">Option 1</option>
                  <option value="option 2">Option 2</option>
                  <option value="option 3">Option 3</option>
                </select>
              </div>
            </div>

            <div className="row mb-3 mt-4">
              <div className="col-sm-12">
                <div className="card shadow mb-3">
                  <div className="card-header bg-light border-bottom-1 py-3">
                    <h6 className="fw-bold mb-0">Educational Qualification</h6>
                  </div>
                  <div className="card-body">
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>S.No</th>
                          <th>Degree</th>
                          <th>Name of Institution</th>
                          <th>Year of Completion</th>
                          <th>File Upload</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {educationFormData.qualification.map((row, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>
                              <input
                                type="text"
                                className="form-control"
                                value={row.qualificationName}
                                onChange={(e) => handleQualificationChange(index, "qualificationName", e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control"
                                value={row.institutionName}
                                onChange={(e) => handleQualificationChange(index, "institutionName", e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="YYYY"
                                value={row.completionYear}
                                onChange={(e) => handleQualificationChange(index, "completionYear", e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="file"
                                className="form-control"
                                onChange={(e) => handleQualificationChange(index, "filePath", e.target.files[0])}
                                accept=".pdf,.jpg,.jpeg,.png"
                              />
                              {row.filePath && typeof row.filePath === "string" && (
                                <small className="text-muted">Current file: {row.filePath}</small>
                              )}
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => removeEducationRow(index)}
                              >
                                <i className="icofont-close"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button type="button" className="btn btn-success" onClick={addEducationRow}>
                      Add Row +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-sm-12">
                <div className="card shadow mb-3">
                  <div className="card-header bg-light border-bottom-1 py-3">
                    <h6 className="fw-bold mb-0">Required Documents</h6>
                  </div>
                  <div className="card-body">
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>S.No</th>
                          <th>Document Name</th>
                          <th>File Upload</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {educationFormData.document.map((row, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>
                              <input
                                type="text"
                                className="form-control"
                                value={row.documentName}
                                onChange={(e) => handleDocumentChange(index, "documentName", e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="file"
                                className="form-control"
                                onChange={(e) => handleDocumentChange(index, "filePath", e.target.files[0])}
                                accept=".pdf,.jpg,.jpeg,.png"
                              />
                              {row.filePath && typeof row.filePath === "string" && (
                                <small className="text-muted">Current file: {row.filePath}</small>
                              )}
                            </td>
                            <td>
                              <button type="button" className="btn btn-danger" onClick={() => removeDocumentRow(index)}>
                                <i className="icofont-close"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button type="button" className="btn btn-success" onClick={addDocumentRow}>
                      Add Row +
                    </button>
                  </div>
                </div>
              </div>
            </div>
            

            <div className="form-group col-md-12 d-flex justify-content-end mt-2">
              <button type="submit" className="btn btn-primary me-2">
                {editingEmployee ? "Update" : "Save"}
              </button>
              <button type="button" className="btn btn-danger" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ViewSearchEmployee
