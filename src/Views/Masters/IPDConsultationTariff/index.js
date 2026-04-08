import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const IPDConsultationTariff = () => {
  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({
    serviceCategory: "",
    visitType: "",
    doctor: "",
    department: "",
    charge: "",
    validFrom: "",
    validTo: "",
  });

  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    recordId: null, 
    newStatus: false, 
    recordName: "" 
  });

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [process, setProcess] = useState(false);

  // Filter states
  const [doctorFilter, setDoctorFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE;

  // Static JSON data for departments and doctors
  const departmentData = [
    { id: 1, departmentName: "Medicine" },
    { id: 2, departmentName: "Surgery" },
    { id: 3, departmentName: "Pediatrics" },
    { id: 4, departmentName: "Cardiology" },
    { id: 5, departmentName: "Orthopedics" },
    { id: 6, departmentName: "Neurology" },
    { id: 7, departmentName: "Gynecology" },
  ];

  const doctorData = [
    { userId: 1, firstName: "Anjali", middleName: "", lastName: "Tiwari", departmentId: 1 },
    { userId: 2, firstName: "Rajesh", middleName: "", lastName: "Kumar", departmentId: 4 },
    { userId: 3, firstName: "Priya", middleName: "", lastName: "Singh", departmentId: 3 },
    { userId: 4, firstName: "Amit", middleName: "", lastName: "Sharma", departmentId: 2 },
    { userId: 5, firstName: "Neha", middleName: "", lastName: "Verma", departmentId: 5 },
    { userId: 6, firstName: "Sanjay", middleName: "", lastName: "Gupta", departmentId: 1 },
    { userId: 7, firstName: "Meera", middleName: "", lastName: "Joshi", departmentId: 6 },
  ];

  // Filter doctors based on selected department
  const getFilteredDoctors = () => {
    if (!departmentFilter) return [];
    return doctorData.filter(doc => doc.departmentId === parseInt(departmentFilter));
  };

  // ================= DATE =================
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
  };

  // ================= DUMMY DATA =================
  useEffect(() => {
    setData([
      {
        id: 1,
        serviceCategory: "General Consultation",
        visitType: "First Visit",
        doctor: "Dr. Anjali Tiwari",
        doctorId: 1,
        department: "Medicine",
        departmentId: 1,
        charge: 500,
        validFrom: new Date(),
        validTo: new Date(new Date().setMonth(new Date().getMonth() + 6)),
        status: "y",
      },
      {
        id: 2,
        serviceCategory: "Specialist Consultation",
        visitType: "Follow-up",
        doctor: "Dr. Rajesh Kumar",
        doctorId: 2,
        department: "Cardiology",
        departmentId: 4,
        charge: 800,
        validFrom: new Date(),
        validTo: new Date(new Date().setMonth(new Date().getMonth() + 3)),
        status: "y",
      },
      {
        id: 3,
        serviceCategory: "Pediatric Checkup",
        visitType: "First Visit",
        doctor: "Dr. Priya Singh",
        doctorId: 3,
        department: "Pediatrics",
        departmentId: 3,
        charge: 450,
        validFrom: new Date(),
        validTo: new Date(new Date().setMonth(new Date().getMonth() + 4)),
        status: "y",
      },
    ]);
  }, []);

  // ================= FILTERING =================
  const filteredData = data.filter((rec) => {
    const matchDepartment = departmentFilter ? rec.departmentId === parseInt(departmentFilter) : true;
    const matchDoctor = doctorFilter ? rec.doctorId === parseInt(doctorFilter) : true;
    return matchDepartment && matchDoctor;
  });

  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [departmentFilter, doctorFilter]);

  // Reset doctor filter when department changes
  const handleDepartmentFilterChange = (e) => {
    const deptId = e.target.value;
    setDepartmentFilter(deptId);
    setDoctorFilter(""); // Reset doctor filter when department changes
  };

  const handleDoctorFilterChange = (e) => {
    setDoctorFilter(e.target.value);
  };

  // ================= FORM =================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle select changes for doctor and department to store both id and name
    if (name === "department") {
      const selectedDept = departmentData.find(dept => dept.id === parseInt(value));
      const updatedForm = { 
        ...formData, 
        department: selectedDept?.departmentName || "",
        departmentId: value 
      };
      setFormData(updatedForm);
      // Reset doctor when department changes in form
      setFormData(prev => ({ ...prev, doctor: "", doctorId: "" }));
      const valid = updatedForm.serviceCategory &&
        updatedForm.visitType &&
        updatedForm.department &&
        updatedForm.charge &&
        updatedForm.validFrom &&
        updatedForm.validTo;
      setIsFormValid(!!valid);
    } 
    else if (name === "doctor") {
      const selectedDoc = doctorData.find(doc => doc.userId === parseInt(value));
      const updatedForm = { 
        ...formData, 
        doctor: selectedDoc ? `Dr. ${selectedDoc.firstName} ${selectedDoc.lastName}` : "",
        doctorId: value 
      };
      setFormData(updatedForm);
      const valid = updatedForm.serviceCategory &&
        updatedForm.visitType &&
        updatedForm.doctor &&
        updatedForm.department &&
        updatedForm.charge &&
        updatedForm.validFrom &&
        updatedForm.validTo;
      setIsFormValid(!!valid);
    }
    else {
      const updatedForm = { ...formData, [name]: value };
      setFormData(updatedForm);
      const valid = updatedForm.serviceCategory &&
        updatedForm.visitType &&
        updatedForm.doctor &&
        updatedForm.department &&
        updatedForm.charge &&
        updatedForm.validFrom &&
        updatedForm.validTo;
      setIsFormValid(!!valid);
    }
  };

  const resetForm = () => {
    setFormData({
      serviceCategory: "",
      visitType: "",
      doctor: "",
      doctorId: "",
      department: "",
      departmentId: "",
      charge: "",
      validFrom: "",
      validTo: "",
    });
    setIsFormValid(false);
  };

  // ================= SAVE =================
  const handleSave = async (e) => {
    e.preventDefault();
    setProcess(true);
    
    if (!isFormValid) {
      setProcess(false);
      return;
    }

    try {
      if (editingRecord) {
        // Update existing record
        const updated = data.map((item) =>
          item.id === editingRecord.id 
            ? { 
                ...editingRecord, 
                ...formData,
                doctor: formData.doctor,
                doctorId: parseInt(formData.doctorId),
                department: formData.department,
                departmentId: parseInt(formData.departmentId)
              } 
            : item
        );
        setData(updated);
        showPopup("Updated Successfully", "success");
      } else {
        // Add new record
        const newRecord = {
          ...formData,
          id: Date.now(),
          doctorId: parseInt(formData.doctorId),
          departmentId: parseInt(formData.departmentId),
          status: "y",
        };
        setData([...data, newRecord]);
        showPopup("Added Successfully", "success");
      }
      
      handleCancel();
    } catch (error) {
      console.error("Error saving record:", error);
      showPopup("Failed to save changes", "error");
    } finally {
      setProcess(false);
    }
  };

  // ================= EDIT =================
  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({
      serviceCategory: rec.serviceCategory,
      visitType: rec.visitType,
      doctor: rec.doctor,
      doctorId: rec.doctorId,
      department: rec.department,
      departmentId: rec.departmentId,
      charge: rec.charge,
      validFrom: rec.validFrom ? new Date(rec.validFrom).toISOString().split('T')[0] : "",
      validTo: rec.validTo ? new Date(rec.validTo).toISOString().split('T')[0] : "",
    });
    setShowForm(true);
    setIsFormValid(true);
  };

  // ================= STATUS SWITCH =================
  const handleSwitchChange = (id, name, newStatus) => {
    setConfirmDialog({ 
      isOpen: true, 
      recordId: id, 
      newStatus, 
      recordName: name 
    });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.recordId !== null) {
      setProcess(true);
      try {
        const updated = data.map((item) =>
          item.id === confirmDialog.recordId 
            ? { ...item, status: confirmDialog.newStatus } 
            : item
        );
        setData(updated);
        showPopup(
          `Record ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
          "success"
        );
      } catch (error) {
        console.error("Error updating status:", error);
        showPopup("Failed to update status", "error");
      } finally {
        setProcess(false);
      }
    }
    setConfirmDialog({ isOpen: false, recordId: null, newStatus: false, recordName: "" });
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleCancel = () => {
    resetForm();
    setEditingRecord(null);
    setShowForm(false);
  };

  // Clear all filters (Show All)
  const handleShowAll = () => {
    setDepartmentFilter("");
    setDoctorFilter("");
    setCurrentPage(1);
  };

  // ================= UI =================
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>IPD Consultation Tariff</h4>

          {!showForm ? (
            <div className="d-flex gap-2">
              <button 
                className="btn btn-success" 
                onClick={() => {
                  setEditingRecord(null);
                  setIsFormValid(false);
                  resetForm();
                  setShowForm(true);
                }}
              >
                <i className="mdi mdi-plus"></i> Add
              </button>

              <button className="btn btn-secondary" onClick={handleShowAll}>
                Show All
              </button>
            </div>
          ): <div className="d-flex justify-content-end ">
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  <i className="mdi mdi-arrow-left"></i> Back
                </button>
              </div>}
        </div>

        <div className="card-body">
          {!showForm ? (
            <>
              <div className="row mb-3 align-items-end">
                <div className="col-md-4">
                  <label className="form-label fw-bold">Department</label>
                  <select
                    className="form-select"
                    value={departmentFilter}
                    onChange={handleDepartmentFilterChange}
                  >
                    <option value="">All Departments</option>
                    {departmentData.map((dept) => (
                      <option key={dept.id} value={dept.id.toString()}>
                        {dept.departmentName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold">Doctor</label>
                  <select
                    className="form-select"
                    value={doctorFilter}
                    onChange={handleDoctorFilterChange}
                    disabled={!departmentFilter}
                  >
                    <option value="">All Doctors</option>
                    {getFilteredDoctors().map((doc) => (
                      <option key={doc.userId} value={doc.userId.toString()}>
                        Dr. {doc.firstName} {doc.middleName} {doc.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="table-responsive packagelist">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Service Category</th>
                      <th>Visit Type</th>
                      <th>Doctor</th>
                      <th>Department</th>
                      <th>Charge</th>
                      <th>Valid From</th>
                      <th>Valid To</th>
                      <th>Status</th>
                      <th>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((rec) => (
                        <tr key={rec.id}>
                          <td style={{ textTransform: "capitalize" }}>{rec.serviceCategory}</td>
                          <td>{rec.visitType}</td>
                          <td>{rec.doctor}</td>
                          <td>{rec.department}</td>
                          <td>₹{rec.charge}</td>
                          <td>{formatDate(rec.validFrom)}</td>
                          <td>{formatDate(rec.validTo)}</td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={rec.status === "y"}
                                onChange={() => handleSwitchChange(
                                  rec.id, 
                                  rec.serviceCategory, 
                                  rec.status === "y" ? "n" : "y"
                                )}
                                id={`switch-${rec.id}`}
                              />
                              <label
                                className="form-check-label px-0"
                                htmlFor={`switch-${rec.id}`}
                              >
                                {rec.status === "y" ? "Active" : "Deactivated"}
                              </label>
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleEdit(rec)}
                              disabled={rec.status !== "y"}
                            >
                              <i className="fa fa-pencil"></i> 
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="text-center">No records found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                totalItems={filteredData.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </>
          ) : (
            <form className="forms row" onSubmit={handleSave}>
              
              <div className="row">
                <div className="form-group col-md-4 mt-3">
                  <label>
                    Service Category <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="serviceCategory"
                    value={formData.serviceCategory}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group col-md-4 mt-3">
                  <label>
                    Visit Type <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="visitType"
                    value={formData.visitType}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group col-md-4 mt-3">
                  <label>
                    Department <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="department"
                    value={formData.departmentId || ""}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Department</option>
                    {departmentData.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.departmentName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group col-md-4 mt-3">
                  <label>
                    Doctor <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="doctor"
                    value={formData.doctorId || ""}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.departmentId}
                  >
                    <option value="">Select Doctor</option>
                    {doctorData
                      .filter(doc => doc.departmentId === parseInt(formData.departmentId))
                      .map((doc) => (
                        <option key={doc.userId} value={doc.userId}>
                          Dr. {doc.firstName} {doc.middleName} {doc.lastName}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group col-md-4 mt-3">
                  <label>
                    Charge <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    name="charge"
                    value={formData.charge}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group col-md-4 mt-3">
                  <label>
                    Valid From <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    name="validFrom"
                    value={formData.validFrom}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group col-md-4 mt-3">
                  <label>
                    Valid To <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    name="validTo"
                    value={formData.validTo}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                <button
                  type="submit"
                  className="btn btn-primary me-2"
                  disabled={process || !isFormValid}
                >
                  {process ? "Processing..." : (editingRecord ? "Update" : "Save")}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleCancel}
                  disabled={process}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {popupMessage && (
            <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
          )}

          {confirmDialog.isOpen && (
            <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog" role="document">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Confirm Status Change</h5>
                    <button type="button" className="close" onClick={() => handleConfirm(false)}>
                      <span>&times;</span>
                    </button>
                  </div>
                  <div className="modal-body">
                    <p>
                      Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                      <strong>{confirmDialog.recordName}</strong>?
                    </p>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>
                      No
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>
                      Yes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IPDConsultationTariff;