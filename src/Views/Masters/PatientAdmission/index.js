import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";

const PatientAdmission = () => {
  // Sample mock data for patient admissions
  const initialPatientData = [
    {
      id: 1,
      patientName: "John Doe",
      mobileNo: "9876543210",
      age: 65,
      gender: "Male",
      relation: "Self",
      doctor: "Dr. Smith",
      diagnosis: "Hypertension",
      admissionDate: "2024-01-15",
      fromDate: "2024-01-15",
      toDate: "2024-01-20",
      ward: "General Ward A",
      bedNo: "A101",
      status: "y",
      lastUpdated: "2024-01-15 10:30:00"
    },
    {
      id: 2,
      patientName: "Jane Smith",
      mobileNo: "8765432109",
      age: 42,
      gender: "Female",
      relation: "Self",
      doctor: "Dr. Johnson",
      diagnosis: "Diabetes Type 2",
      admissionDate: "2024-01-10",
      fromDate: "2024-01-10",
      toDate: "2024-01-17",
      ward: "Private Ward B",
      bedNo: "B205",
      status: "y",
      lastUpdated: "2024-01-10 14:20:00"
    },
    {
      id: 3,
      patientName: "Robert Brown",
      mobileNo: "7654321098",
      age: 78,
      gender: "Male",
      relation: "Father",
      doctor: "Dr. Williams",
      diagnosis: "Pneumonia",
      admissionDate: "2024-01-05",
      fromDate: "2024-01-05",
      toDate: "2024-01-12",
      ward: "ICU",
      bedNo: "ICU-03",
      status: "n",
      lastUpdated: "2024-01-05 09:15:00"
    },
    {
      id: 4,
      patientName: "Alice Johnson",
      mobileNo: "6543210987",
      age: 35,
      gender: "Female",
      relation: "Self",
      doctor: "Dr. Davis",
      diagnosis: "Appendicitis",
      admissionDate: "2024-01-20",
      fromDate: "2024-01-20",
      toDate: "2024-01-25",
      ward: "Surgical Ward",
      bedNo: "S301",
      status: "y",
      lastUpdated: "2024-01-20 16:45:00"
    },
    {
      id: 5,
      patientName: "Michael Chen",
      mobileNo: "5432109876",
      age: 55,
      gender: "Male",
      relation: "Self",
      doctor: "Dr. Patel",
      diagnosis: "Coronary Artery Disease",
      admissionDate: "2024-01-18",
      fromDate: "2024-01-18",
      toDate: "2024-01-25",
      ward: "Cardiac Care Unit",
      bedNo: "CCU-12",
      status: "y",
      lastUpdated: "2024-01-18 11:10:00"
    },
    {
      id: 6,
      patientName: "Sarah Wilson",
      mobileNo: "4321098765",
      age: 28,
      gender: "Female",
      relation: "Daughter",
      doctor: "Dr. Taylor",
      diagnosis: "Fractured Leg",
      admissionDate: "2024-01-12",
      fromDate: "2024-01-12",
      toDate: "2024-01-19",
      ward: "Orthopedic Ward",
      bedNo: "O402",
      status: "y",
      lastUpdated: "2024-01-12 13:25:00"
    },
    {
      id: 7,
      patientName: "David Miller",
      mobileNo: "3210987654",
      age: 70,
      gender: "Male",
      relation: "Self",
      doctor: "Dr. Anderson",
      diagnosis: "Stroke",
      admissionDate: "2024-01-08",
      fromDate: "2024-01-08",
      toDate: "2024-01-20",
      ward: "Neurology Ward",
      bedNo: "N101",
      status: "n",
      lastUpdated: "2024-01-08 15:40:00"
    },
    {
      id: 8,
      patientName: "Emily Davis",
      mobileNo: "2109876543",
      age: 45,
      gender: "Female",
      relation: "Self",
      doctor: "Dr. Thomas",
      diagnosis: "Asthma",
      admissionDate: "2024-01-22",
      fromDate: "2024-01-22",
      toDate: "2024-01-25",
      ward: "General Ward B",
      bedNo: "B102",
      status: "y",
      lastUpdated: "2024-01-22 08:55:00"
    },
    {
      id: 9,
      patientName: "Thomas White",
      mobileNo: "1098765432",
      age: 60,
      gender: "Male",
      relation: "Self",
      doctor: "Dr. Roberts",
      diagnosis: "Kidney Stones",
      admissionDate: "2024-01-16",
      fromDate: "2024-01-16",
      toDate: "2024-01-19",
      ward: "Urology Ward",
      bedNo: "U201",
      status: "y",
      lastUpdated: "2024-01-16 12:30:00"
    },
    {
      id: 10,
      patientName: "Lisa Brown",
      mobileNo: "0987654321",
      age: 32,
      gender: "Female",
      relation: "Wife",
      doctor: "Dr. Harris",
      diagnosis: "Pregnancy Care",
      admissionDate: "2024-01-14",
      fromDate: "2024-01-14",
      toDate: "2024-01-18",
      ward: "Maternity Ward",
      bedNo: "M105",
      status: "y",
      lastUpdated: "2024-01-14 10:05:00"
    }
  ];

  // Sample data for dropdowns
  const doctorsList = [
    { id: 1, name: "Dr. Smith" },
    { id: 2, name: "Dr. Johnson" },
    { id: 3, name: "Dr. Williams" },
    { id: 4, name: "Dr. Davis" },
    { id: 5, name: "Dr. Patel" },
    { id: 6, name: "Dr. Taylor" },
    { id: 7, name: "Dr. Anderson" },
    { id: 8, name: "Dr. Thomas" },
    { id: 9, name: "Dr. Roberts" },
    { id: 10, name: "Dr. Harris" }
  ];

  const wardsList = [
    { id: 1, name: "General Ward A", type: "General" },
    { id: 2, name: "General Ward B", type: "General" },
    { id: 3, name: "Private Ward A", type: "Private" },
    { id: 4, name: "Private Ward B", type: "Private" },
    { id: 5, name: "ICU", type: "Critical" },
    { id: 6, name: "Surgical Ward", type: "Surgical" },
    { id: 7, name: "Cardiac Care Unit", type: "Cardiac" },
    { id: 8, name: "Orthopedic Ward", type: "Orthopedic" },
    { id: 9, name: "Neurology Ward", type: "Neurology" },
    { id: 10, name: "Urology Ward", type: "Urology" },
    { id: 11, name: "Maternity Ward", type: "Maternity" },
    { id: 12, name: "Pediatric Ward", type: "Pediatric" }
  ];

  const relationsList = ["Self", "Father", "Mother", "Son", "Daughter", "Husband", "Wife", "Brother", "Sister", "Other"];

  const [patientData, setPatientData] = useState(initialPatientData);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    patientId: null, 
    newStatus: false 
  });
  
  const [formData, setFormData] = useState({
    patientName: "",
    mobileNo: "",
    age: "",
    gender: "Male",
    relation: "Self",
    doctor: "",
    diagnosis: "",
    admissionDate: new Date().toISOString().split('T')[0],
    fromDate: new Date().toISOString().split('T')[0],
    toDate: "",
    ward: "",
    bedNo: ""
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [pageInput, setPageInput] = useState("1");

  // Validation constants
  const PATIENT_NAME_MAX_LENGTH = 100;
  const MOBILE_MAX_LENGTH = 10;
  const DIAGNOSIS_MAX_LENGTH = 500;
  const BED_NO_MAX_LENGTH = 20;

  // Filter data based on search query
  const filteredPatientData = patientData.filter(patient =>
    patient.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    patient.mobileNo.includes(searchQuery) ||
    patient.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.ward.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination values
  const totalPages = Math.ceil(filteredPatientData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPatientData.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
    setPageInput("1");
  }, [searchQuery]);

  // Update page input when current page changes
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // Form validation
  useEffect(() => {
    const validateForm = () => {
      const requiredFields = [
        formData.patientName.trim(),
        formData.mobileNo.trim(),
        formData.age,
        formData.doctor.trim(),
        formData.diagnosis.trim(),
        formData.admissionDate,
        formData.fromDate,
        formData.toDate,
        formData.ward.trim(),
        formData.bedNo.trim()
      ];
      
      const allFilled = requiredFields.every(field => field !== "");
      const mobileValid = /^\d{10}$/.test(formData.mobileNo);
      const ageValid = parseInt(formData.age) > 0 && parseInt(formData.age) <= 120;
      const dateValid = new Date(formData.fromDate) <= new Date(formData.toDate);
      
      return allFilled && mobileValid && ageValid && dateValid;
    };
    
    setIsFormValid(validateForm());
  }, [formData]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleEdit = (patient) => {
    setEditingPatient(patient);
    setFormData({
      patientName: patient.patientName,
      mobileNo: patient.mobileNo,
      age: patient.age.toString(),
      gender: patient.gender,
      relation: patient.relation,
      doctor: patient.doctor,
      diagnosis: patient.diagnosis,
      admissionDate: patient.admissionDate,
      fromDate: patient.fromDate,
      toDate: patient.toDate,
      ward: patient.ward,
      bedNo: patient.bedNo
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    try {
      setLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (editingPatient) {
        // Update existing patient admission
        const updatedData = patientData.map(item =>
          item.id === editingPatient.id 
            ? { 
                ...item, 
                ...formData,
                age: parseInt(formData.age),
                lastUpdated: new Date().toLocaleString('en-IN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                }).replace(',', '')
              }
            : item
        );
        
        setPatientData(updatedData);
        showPopup("Patient admission updated successfully!", "success");
      } else {
        // Add new patient admission
        const newPatient = {
          id: patientData.length + 1,
          ...formData,
          age: parseInt(formData.age),
          status: "y",
          lastUpdated: new Date().toLocaleString('en-IN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }).replace(',', '')
        };
        
        setPatientData([...patientData, newPatient]);
        showPopup("New patient admission added successfully!", "success");
      }
      
      setEditingPatient(null);
      setFormData({
        patientName: "",
        mobileNo: "",
        age: "",
        gender: "Male",
        relation: "Self",
        doctor: "",
        diagnosis: "",
        admissionDate: new Date().toISOString().split('T')[0],
        fromDate: new Date().toISOString().split('T')[0],
        toDate: "",
        ward: "",
        bedNo: ""
      });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving patient admission data:", err);
      showPopup(`Failed to save changes: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const showPopup = (message, type = 'info') => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      }
    });
  };
  
  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, patientId: id, newStatus });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.patientId !== null) {
      try {
        setLoading(true);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const updatedData = patientData.map((patient) =>
          patient.id === confirmDialog.patientId 
            ? { 
                ...patient, 
                status: confirmDialog.newStatus,
                lastUpdated: new Date().toLocaleString('en-IN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                }).replace(',', '')
              } 
            : patient
        );
        
        setPatientData(updatedData);
        showPopup(`Patient admission ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`, "success");
      } catch (err) {
        console.error("Error updating patient admission status:", err);
        showPopup(`Failed to update status: ${err.message}`, "error");
      } finally {
        setLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, patientId: null, newStatus: null });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    setFormData((prevData) => ({ ...prevData, mobileNo: value.slice(0, MOBILE_MAX_LENGTH) }));
  };

  const handleAgeChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    setFormData((prevData) => ({ ...prevData, age: value.slice(0, 3) }));
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    setPageInput("1");
    showPopup("Data refreshed!", "success");
  };

  const handlePageNavigation = () => {
    const pageNumber = parseInt(pageInput);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    } else {
      showPopup(`Please enter a valid page number between 1 and ${totalPages}`, "error");
      setPageInput(currentPage.toString());
    }
  };

  const handlePageInputChange = (e) => {
    setPageInput(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handlePageNavigation();
    }
  };

  const renderPagination = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) {
        pageNumbers.push("ellipsis-left");
      }
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    // Add last page and ellipsis if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push("ellipsis-right");
      }
      pageNumbers.push(totalPages);
    }

    return pageNumbers.map((number, index) => {
      if (number === "ellipsis-left" || number === "ellipsis-right") {
        return (
          <li key={index} className="page-item disabled">
            <span className="page-link">...</span>
          </li>
        );
      }
      
      return (
        <li key={index} className={`page-item ${number === currentPage ? "active" : ""}`}>
          <button 
            className="page-link" 
            onClick={() => {
              setCurrentPage(number);
              setPageInput(number.toString());
            }}
          >
            {number}
          </button>
        </li>
      );
    });
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Patient Admission </h4>
              <div className="d-flex justify-content-between align-items-center">
                <form className="d-inline-block searchform me-4" role="search">
                  <div className="input-group searchinput">
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search patient, mobile, doctor..."
                      aria-label="Search"
                      value={searchQuery}
                      onChange={handleSearchChange}
                    />
                    <span className="input-group-text" id="search-icon">
                      <i className="fa fa-search"></i>
                    </span>
                  </div>
                </form>

                <div className="d-flex align-items-center">
                  {!showForm ? (
                    <>
                      <button 
                        type="button" 
                        className="btn btn-success me-2"
                        onClick={() => {
                          setEditingPatient(null);
                          setFormData({
                            patientName: "",
                            mobileNo: "",
                            age: "",
                            gender: "Male",
                            relation: "Self",
                            doctor: "",
                            diagnosis: "",
                            admissionDate: new Date().toISOString().split('T')[0],
                            fromDate: new Date().toISOString().split('T')[0],
                            toDate: "",
                            ward: "",
                            bedNo: ""
                          });
                          setShowForm(true);
                        }}
                      >
                        <i className="mdi mdi-plus"></i> Add 
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-success me-2 flex-shrink-0"
                        onClick={handleRefresh}
                      >
                        <i className="mdi mdi-refresh"></i> Show All
                      </button>
                    </>
                  ) : (
                    <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                      <i className="mdi mdi-arrow-left"></i> Back
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <LoadingScreen />
              ) : !showForm ? (
                <>
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Patient Name</th>
                          <th>Mobile No</th>
                          <th>Age/Gender</th>
                          <th>Relation</th>
                          <th>Doctor</th>
                          <th>Diagnosis</th>
                          <th>Admission Date</th>
                          <th>From - To</th>
                          <th>Ward/Bed</th>
                          <th>Status</th>
                          <th>Last Updated</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((patient) => (
                            <tr key={patient.id}>
                              <td>{patient.patientName}</td>
                              <td>{patient.mobileNo}</td>
                              <td>{patient.age}/{patient.gender}</td>
                              <td>{patient.relation}</td>
                              <td>{patient.doctor}</td>
                              <td className="text-truncate" style={{ maxWidth: "200px" }} title={patient.diagnosis}>
                                {patient.diagnosis}
                              </td>
                              <td>{patient.admissionDate}</td>
                              <td>{patient.fromDate} - {patient.toDate}</td>
                              <td>{patient.ward} ({patient.bedNo})</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={patient.status === "y"}
                                    onChange={() => handleSwitchChange(patient.id, patient.status === "y" ? "n" : "y")}
                                    id={`switch-${patient.id}`}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${patient.id}`}
                                  >
                                    {patient.status === "y" ? 'Active' : 'Inactive'}
                                  </label>
                                </div>
                              </td>
                              <td>{patient.lastUpdated}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(patient)}
                                  disabled={patient.status !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="12" className="text-center">No patient admission data found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {filteredPatientData.length > 0 && (
                    <nav className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        <span className="text-muted">
                          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPatientData.length)} of {filteredPatientData.length} entries
                        </span>
                      </div>
                      
                      <ul className="pagination mb-0">
                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                          <button
                            className="page-link"
                            onClick={() => {
                              if (currentPage > 1) {
                                setCurrentPage(currentPage - 1);
                              }
                            }}
                            disabled={currentPage === 1}
                          >
                            &laquo; Previous
                          </button>
                        </li>
                        
                        {renderPagination()}
                        
                        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                          <button
                            className="page-link"
                            onClick={() => {
                              if (currentPage < totalPages) {
                                setCurrentPage(currentPage + 1);
                              }
                            }}
                            disabled={currentPage === totalPages}
                          >
                            Next &raquo;
                          </button>
                        </li>
                      </ul>
                      
                      <div className="d-flex align-items-center">
                        <span className="me-2">Go to:</span>
                        <input
                          type="number"
                          min="1"
                          max={totalPages}
                          value={pageInput}
                          onChange={handlePageInputChange}
                          onKeyPress={handleKeyPress}
                          className="form-control me-2"
                          style={{ width: "80px" }}
                        />
                        <button
                          className="btn btn-primary"
                          onClick={handlePageNavigation}
                        >
                          Go
                        </button>
                      </div>
                    </nav>
                  )}
                </>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="form-group col-md-4">
                    <label>Patient Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="patientName"
                      name="patientName"
                      placeholder="Enter patient name"
                      value={formData.patientName}
                      onChange={handleInputChange}
                      maxLength={PATIENT_NAME_MAX_LENGTH}
                      required
                    />
                    <small className="text-muted">
                      {formData.patientName.length}/{PATIENT_NAME_MAX_LENGTH} characters
                    </small>
                  </div>
                  
                  <div className="form-group col-md-2">
                    <label>Mobile No <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="mobileNo"
                      name="mobileNo"
                      placeholder="10-digit mobile"
                      value={formData.mobileNo}
                      onChange={handleMobileChange}
                      maxLength={MOBILE_MAX_LENGTH}
                      required
                    />
                    <small className="text-muted">10 digits required</small>
                  </div>
                  
                  <div className="form-group col-md-2">
                    <label>Age <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="age"
                      name="age"
                      placeholder="Age"
                      value={formData.age}
                      onChange={handleAgeChange}
                      maxLength="3"
                      required
                    />
                  </div>
                  
                  <div className="form-group col-md-2">
                    <label>Gender</label>
                    <select
                      className="form-control mt-1"
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="form-group col-md-2">
                    <label>Relation</label>
                    <select
                      className="form-control mt-1"
                      id="relation"
                      name="relation"
                      value={formData.relation}
                      onChange={handleInputChange}
                    >
                      {relationsList.map((relation) => (
                        <option key={relation} value={relation}>{relation}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group col-md-4">
                    <label>Doctor <span className="text-danger">*</span></label>
                    <select
                      className="form-control mt-1"
                      id="doctor"
                      name="doctor"
                      value={formData.doctor}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Doctor</option>
                      {doctorsList.map((doctor) => (
                        <option key={doctor.id} value={doctor.name}>{doctor.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group col-md-8">
                    <label>Diagnosis <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control mt-1"
                      id="diagnosis"
                      name="diagnosis"
                      placeholder="Enter diagnosis"
                      value={formData.diagnosis}
                      onChange={handleInputChange}
                      rows="2"
                      maxLength={DIAGNOSIS_MAX_LENGTH}
                      required
                    />
                    <small className="text-muted">
                      {formData.diagnosis.length}/{DIAGNOSIS_MAX_LENGTH} characters
                    </small>
                  </div>
                  
                  <div className="form-group col-md-3">
                    <label>Admission Date <span className="text-danger">*</span></label>
                    <input
                      type="date"
                      className="form-control mt-1"
                      id="admissionDate"
                      name="admissionDate"
                      value={formData.admissionDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group col-md-3">
                    <label>From Date <span className="text-danger">*</span></label>
                    <input
                      type="date"
                      className="form-control mt-1"
                      id="fromDate"
                      name="fromDate"
                      value={formData.fromDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group col-md-3">
                    <label>To Date <span className="text-danger">*</span></label>
                    <input
                      type="date"
                      className="form-control mt-1"
                      id="toDate"
                      name="toDate"
                      value={formData.toDate}
                      onChange={handleInputChange}
                      min={formData.fromDate}
                      required
                    />
                  </div>
                  
                  <div className="form-group col-md-3">
                    <label>Ward <span className="text-danger">*</span></label>
                    <select
                      className="form-control mt-1"
                      id="ward"
                      name="ward"
                      value={formData.ward}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Ward</option>
                      {wardsList.map((ward) => (
                        <option key={ward.id} value={ward.name}>{ward.name} ({ward.type})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group col-md-12">
                    <label>Bed No <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="bedNo"
                      name="bedNo"
                      placeholder="Enter bed number"
                      value={formData.bedNo}
                      onChange={handleInputChange}
                      maxLength={BED_NO_MAX_LENGTH}
                      required
                    />
                  </div>
                  
                  <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                    <button 
                      type="submit" 
                      className="btn btn-primary me-2" 
                      disabled={!isFormValid}
                    >
                      {editingPatient ? 'Update' : 'Save'}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger" 
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
              
              {popupMessage && (
                <Popup
                  message={popupMessage.message}
                  type={popupMessage.type}
                  onClose={popupMessage.onClose}
                />
              )}
              
              {confirmDialog.isOpen && (
                <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button type="button" className="btn-close" onClick={() => handleConfirm(false)} aria-label="Close"></button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} 
                          <strong> {patientData.find(patient => patient.id === confirmDialog.patientId)?.patientName}</strong>?
                        </p>
                        <p className="text-muted">
                          {confirmDialog.newStatus === "y" 
                            ? "This will make the patient admission active." 
                            : "This will mark the patient admission as inactive."}
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>Cancel</button>
                        <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>Confirm</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientAdmission;