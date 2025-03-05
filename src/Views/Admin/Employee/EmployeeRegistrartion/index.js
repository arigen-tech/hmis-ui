import React, { useState } from "react";
import placeholderImage from "../../../../assets/images/placeholder.jpg";

const EmployeeRegistration = () => {
    const [profileImage, setProfileImage] = useState(null);

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setProfileImage(URL.createObjectURL(file));
        }
    };
    const [educationRows, setEducationRows] = useState([{ id: 1 }]);
    const [documentRows, setDocumentRows] = useState([{ id: 1 }]);
  
    const addEducationRow = () => {
      setEducationRows([...educationRows, { id: educationRows.length + 1 }]);
    };
  
    const removeEducationRow = (index) => {
      setEducationRows(educationRows.filter((_, i) => i !== index));
    };
  
    const addDocumentRow = () => {
      setDocumentRows([...documentRows, { id: documentRows.length + 1 }]);
    };
  
    const removeDocumentRow = (index) => {
      setDocumentRows(documentRows.filter((_, i) => i !== index));
    };
    return (
        <>
            <div className="body d-flex py-3">
                <div className="container-xxl">
                    <div className="row align-items-center">
                        <div className="border-0 mb-4">
                            <div className="card-header py-3 bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap">
                                <h3 className="fw-bold mb-0">Register of Employee</h3>
                            </div>
                        </div>
                    </div>
                    {/* employee Section */}
                    <div className="row mb-3">
                        <div className="col-sm-12">
                            <div className="card shadow mb-3">
                                <div className="card-header py-3 bg-light border-bottom-1">
                                    <h6 className="mb-0 fw-bold">Employee Registration</h6>
                                </div>
                                <div className="card-body">
                                    <form>
                                        <div className="row g-3">
                                            <div className="col-md-9">
                                                <div className="row g-3">
                                                    <div className="col-md-4">
                                                        <label className="form-label">First Name *</label>
                                                        <input type="text" className="form-control" required />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">Middle Name</label>
                                                        <input type="text" className="form-control" />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">Last Name *</label>
                                                        <input type="text" className="form-control" required />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">Date of Birth *</label>
                                                        <input type="date" className="form-control" required />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">Gender *</label>
                                                        <select className="form-select" required>
                                                            <option value="">Select</option>
                                                            <option value="Male">Male</option>
                                                            <option value="Female">Female</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">Address *</label>
                                                        <textarea className="form-control" required></textarea>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">Country *</label>
                                                        <select className="form-select" required>
                                                            <option value="">Select</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">State *</label>
                                                        <select className="form-select" required>
                                                            <option value="">Select</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">District *</label>
                                                        <select className="form-select" required>
                                                            <option value="">Select</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">City *</label>
                                                        <input type="text" className="form-control" required />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">Pincode *</label>
                                                        <input type="text" className="form-control" required />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">Mobile No. *</label>
                                                        <input type="text" className="form-control" required />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">ID Type *</label>
                                                        <select className="form-select" required>
                                                            <option value="">Select</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">ID Number *</label>
                                                        <input type="text" className="form-control" required />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">ID Upload (JPEG/PDF) *</label>
                                                        <input type="file" className="form-control" required />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">Department Name *</label>
                                                        <select className="form-select"  required>
                                                            <option value="HR">HR</option>
                                                            <option value="IT">IT</option>
                                                            <option value="Finance">Finance</option>
                                                            <option value="Operations">Operations</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">Period of Employment From Date</label>
                                                        <input type="date" className="form-control" required />
                                                    </div>
                                                    
                                                </div>
                                            </div>
                                            <div className="col-md-3 d-flex flex-column">
                                                <label className="form-label">Profile Image *</label>
                                                <div className="border p-2 d-flex flex-column align-items-center">
                                                    <img
                                                        src={profileImage ? profileImage : placeholderImage}
                                                        alt="Profile"
                                                        className="img-fluid"
                                                        style={{ objectFit: "cover" }}
                                                    />
                                                    <input
                                                        type="file"
                                                        className="form-control mt-2"
                                                        accept="image/*"
                                                        onChange={handleImageChange}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Educational Qualification */}
                    <div className="row mb-3">
                        <div className="col-sm-12">
                            <div className="card shadow mb-3">
                                <div className="card-header py-3 bg-light border-bottom-1">
                                    <h6 className="mb-0 fw-bold">Educational Qualification</h6>
                                </div>
                                <div className="card-body">
                                <h5 className="mt-4 text-danger"></h5>
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
                                        {educationRows.map((row, index) => (
                                            <tr key={row.id}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <input type="text" className="form-control" />
                                            </td>
                                            <td>
                                                <input type="text" className="form-control" />
                                            </td>
                                            <td>
                                                <input type="text" className="form-control" placeholder="YYYY" />
                                            </td>
                                            <td>
                                                <input type="file" className="form-control" />
                                            </td>
                                            <td>
                                                <button type="button" className="btn btn-danger" onClick={() => removeEducationRow(index)}><i className="icofont-close"></i> </button>
                                            </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                    <button type="button" className="btn btn-success" onClick={addEducationRow}> Add Row + </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Educational Qualification */}
                    <div className="row mb-3">
                        <div className="col-sm-12">
                            <div className="card shadow mb-3">
                                <div className="card-header py-3 bg-light border-bottom-1">
                                    <h6 className="mb-0 fw-bold">Required Documents</h6>
                                </div>
                                <div className="card-body">
                                <h5 className="mt-4 text-danger"></h5>
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
                                        {documentRows.map((row, index) => (
                                            <tr key={row.id}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <input type="text" className="form-control" />
                                            </td>
                                            <td>
                                                <input type="file" className="form-control" />
                                            </td>
                                            <td>
                                                <button type="button" className="btn btn-danger" onClick={() => removeDocumentRow(index)}><i className="icofont-close"></i> </button>
                                            </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                    <button type="button" className="btn btn-success" onClick={addDocumentRow}> Add Row + </button>
                                </div>
                            </div>
                        </div>

                    </div>
                    <div className="mt-4 d-flex justify-content-end">
                        <button type="reset" className="btn btn-secondary me-2">Save</button>
                        <button type="submit" className="btn btn-primary">Submit</button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default EmployeeRegistration;
