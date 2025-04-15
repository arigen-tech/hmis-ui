import React, { useState, useEffect } from "react";
import placeholderImage from "../../../../assets/images/placeholder.jpg";
import { COUNTRYAPI, DISTRICTAPI, STATEAPI, DEPARTMENT, GENDERAPI, ALL_ROLE, IDENTITY_TYPE, API_HOST, EMPLOYMENT_TYPE, EMPLOYEE_TYPE, EMPLOYEE_REGISTRATION } from "../../../../config/apiConfig";
import { getRequest, putRequest, postRequestWithFormData } from "../../../../service/apiService";
import Popup from "../../../../Components/popup";
import LoadingScreen from "../../../../Components/Loading";

const ViewSearchEmployee = () => {
  const initialFormData = {
    profilePicName: null,
    idDocumentName: null,
    firstName: "",
    middleName: "",
    lastName: "",
    dob: "",
    genderId: "",
    address1: "",
    countryId: "",
    stateId: "",
    districtId: "",
    city: "",
    pincode: "",
    mobileNo: "",
    identificationType: "",
    registrationNo: "",
    employmentTypeId: "",
    employeeTypeId: "",
    roleId: "",
    fromDate: "",
    qualification: [{ employeeQualificationId: 1, institutionName: "", completionYear: "", qualificationName: "", filePath: null }],
    document: [{ employeeDocumentId: 1, documentName: "", filePath: null }],
  };

  const [formData, setFormData] = useState(initialFormData);
  const mlenght = 15;
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [popup, setPopup] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [empUpdateId, setEmpUpdateId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countryData, setCountryData] = useState([]);
  const [stateData, setStateData] = useState([]);
  const [districtData, setDistrictData] = useState([]);
  const [genderData, setGenderData] = useState([]);
  const [countryIds, setCountryIds] = useState("");
  const [stateIds, setStateIds] = useState("");
  const [idTypeData, setIdTypeData] = useState([]);
  const [roleData, setRoleData] = useState([]);
  const [employeeTypeData, setEmployeeTypeData] = useState([]);
  const [employmentTypeData, setEmploymentTypeData] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchMobile, setSearchMobile] = useState("");
  const [searchName, setSearchName] = useState("");
  const [pageInput, setPageInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const token = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhYmNAZ21haWwuY29tIiwiaG9zcGl0YWxJZCI6MSwiZW1wbG95ZWVJZCI6MSwiZXhwIjoxNzQ1MjI2Nzg3LCJ1c2VySWQiOjQsImlhdCI6MTc0NDYyMTk4N30.7Rf_Bzy5bbvdWMXIXC6yuFo9u48i9peUyGd4bS0D5nb4ib8vRWWIsk5Uie0dIM6pVyGt0awYymUlAEDv0OeiLw";

  useEffect(() => {
    fetchEmployeesData();
    fetchCountryData();
    fetchGenderData();
    fetchIdTypeData();
    fetchRoleData();
    fetchEmployeeTypeData();
    fetchEmploymentTypeData();
  }, []);

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      },
    });
  };

  const fetchEmployeesData = async () => {
    setLoading(true);
    try {
      const data = await getRequest(`${EMPLOYEE_REGISTRATION}/getAllEmployee`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setEmployees(data.response);
        setFilteredEmployees(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setEmployees([]);
        setFilteredEmployees([]);
      }
    } catch (error) {
      console.error("Error fetching Employees data:", error);
    } finally {
      setLoading(false);
    }
  };


  const fetchCountryData = async () => {
    setLoading(true);
    try {
      const data = await getRequest(`${COUNTRYAPI}/getAllCountries/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setCountryData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setCountryData([]);
      }
    } catch (error) {
      console.error("Error fetching country data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStateData = async (countryIds) => {
    setLoading(true);
    try {
      const GET_STATES = `${STATEAPI}/country/${countryIds}`;
      const data = await getRequest(GET_STATES);
      if (data.status === 200 && Array.isArray(data.response)) {
        setStateData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setStateData([]);
      }
    } catch (error) {
      console.error("Error fetching state data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistrictData = async (stateIds) => {
    setLoading(true);
    try {
      const GET_CITIES = `${DISTRICTAPI}/state/${stateIds}`;
      const data = await getRequest(GET_CITIES);
      if (data.status === 200 && Array.isArray(data.response)) {
        setDistrictData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setDistrictData([]);
      }
    } catch (error) {
      console.error("Error fetching city data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGenderData = async () => {
    setLoading(true);
    try {
      const data = await getRequest(`${GENDERAPI}/getAll/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setGenderData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setGenderData([]);
      }
    } catch (error) {
      console.error("Error fetching Gender data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIdTypeData = async () => {
    setLoading(true);
    try {
      const data = await getRequest(`${IDENTITY_TYPE}/getAllIdentificationTypes/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setIdTypeData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setIdTypeData([]);
      }
    } catch (error) {
      console.error("Error fetching IdType data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeTypeData = async () => {
    setLoading(true);
    try {
      const data = await getRequest(`${EMPLOYEE_TYPE}/getAllUserType/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setEmployeeTypeData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setEmployeeTypeData([]);
      }
    } catch (error) {
      console.error("Error fetching EmployeeType data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmploymentTypeData = async () => {
    setLoading(true);
    try {
      const data = await getRequest(`${EMPLOYMENT_TYPE}/getAllEmploymentType/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setEmploymentTypeData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setEmploymentTypeData([]);
      }
    } catch (error) {
      console.error("Error fetching EmploymentType data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleData = async () => {
    setLoading(true);
    try {
      const data = await getRequest(`${ALL_ROLE}/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setRoleData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setRoleData([]);
      }
    } catch (error) {
      console.error("Error fetching Role data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (id) => {
    setFormData((prevState) => ({
      ...prevState,
      countryId: id,
      stateId: "",
      districtId: "",
    }));
    fetchStateData(id);
  };

  const handleStateChange = (id) => {
    setFormData((prevState) => ({
      ...prevState,
      stateId: id,
      districtId: "",
    }));
    fetchDistrictData(id);
  };

  const handleDistrictChange = (districtId) => {
    setFormData((prevState) => ({
      ...prevState,
      districtId: districtId,
    }));
  };

  const handleGenderChange = (gendersId) => {
    setFormData((prevState) => ({
      ...prevState,
      genderId: gendersId,
    }));
  };

  const handleEmploymentTypeChange = (emptTypeId) => {
    setFormData((prevState) => ({
      ...prevState,
      employmentTypeId: emptTypeId,
    }));
  };

  const handleEmployeeTypeChange = (empTypeId) => {
    setFormData((prevState) => ({
      ...prevState,
      employeeTypeId: empTypeId,
    }));
  };

  const handleRoleChange = (role) => {
    setFormData((prevState) => ({
      ...prevState,
      roleId: role,
    }));
  };

  const handleIdTypeChange = (idTypeId) => {
    setFormData((prevState) => ({
      ...prevState,
      identificationType: idTypeId,
    }));
  };

  const handleQualificationChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      qualification: prev.qualification.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeEducationRow = (index) => {
    setFormData(prev => ({
      ...prev,
      qualification: prev.qualification.filter((_, i) => i !== index),
    }));
  };

  const addEducationRow = (e) => {
    e.preventDefault();
    setFormData(prev => ({
      ...prev,
      qualification: [
        ...prev.qualification,
        {
          employeeQualificationId: null,
          institutionName: "",
          completionYear: "",
          qualificationName: "",
          filePath: null,
        },
      ],
    }));
  };


  const handleDocumentChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      document: prev.document.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addDocumentRow = (e) => {
    e.preventDefault();
    setFormData(prev => ({
      ...prev,
      document: [
        ...prev.document,
        { employeeDocumentId: null, documentName: "", filePath: null },
      ],
    }));
  };

  const removeDocumentRow = (index) => {
    setFormData(prev => ({
      ...prev,
      document: prev.document.filter((_, i) => i !== index),
    }));
  };

  const handleAnotherAction = async (employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
    setEmpUpdateId(employee.employeeId);
    // Set basic form data
    const newFormData = {
      ...initialFormData,
      profilePicName: employee.profilePicName || null,
      idDocumentName: employee.idDocumentName || null,
      firstName: employee.firstName || "",
      middleName: employee.middleName || "",
      lastName: employee.lastName || "",
      dob: employee.dob || "",
      genderId: employee.genderId || "",
      address1: employee.address1 || "",
      countryId: employee.countryId || "",
      stateId: employee.stateId || "",
      districtId: employee.districtId || "",
      city: employee.city || "",
      pincode: employee.pincode || "",
      mobileNo: employee.mobileNo || "",
      identificationType: employee.identificationTypeId || "",
      registrationNo: employee.registrationNo || "",
      employmentTypeId: employee.employmentTypeId || "",
      employeeTypeId: employee.employeeTypeId || "",
      roleId: employee.roleId || "",
      fromDate: employee.fromDate ? employee.fromDate.slice(0, 10) : "",
    };

    // Set qualifications and documents
    if (employee.qualifications?.length) {
      newFormData.qualification = employee.qualifications.map((q) => ({
        employeeQualificationId: q.employeeQualificationId,
        institutionName: q.institutionName || "",
        completionYear: q.completionYear || "",
        qualificationName: q.qualificationName || "",
        filePath: q.filePath || null,
      }));
    }

    if (employee.documents?.length) {
      newFormData.document = employee.documents.map((d) => ({
        employeeDocumentId: d.employeeDocumentId,
        documentName: d.documentName || "",
        filePath: d.filePath || null,
      }));
    }

    setFormData(newFormData);

    if (employee.countryId) {

      await fetchStateData(employee.countryId);

      if (employee.stateId) {
        await fetchDistrictData(employee.stateId);

      }

    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleInputMobileChange = (e) => {
    const { id, value } = e.target;
    const numericValue = value.replace(/\D/g, '');
    setFormData((prevData) => ({ ...prevData, [id]: numericValue }));
  };

  const handleSearch = () => {
    const lowerName = searchName.toLowerCase();
    const filtered = employees.filter(emp => {
      const fullName = `${emp.firstName} ${emp.middleName} ${emp.lastName}`.toLowerCase();
      return (
        (searchMobile === "" || emp.mobileNo.includes(searchMobile)) &&
        (searchName === "" || fullName.includes(lowerName))
      );
    });
    setFilteredEmployees(filtered);
  };

  const handleShowAll = () => {
    setFilteredEmployees(employees);
    setSearchMobile("");
    setSearchName("");
  };

  const filteredTotalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  const renderPagination = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(filteredTotalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) pageNumbers.push("...");
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (endPage < filteredTotalPages) {
      if (endPage < filteredTotalPages - 1) pageNumbers.push("...");
      pageNumbers.push(filteredTotalPages);
    }

    return pageNumbers.map((number, index) => (
      <li key={index} className={`page-item ${number === currentPage ? "active" : ""}`}>
        {typeof number === "number" ? (
          <button className="page-link" onClick={() => setCurrentPage(number)}>
            {number}
          </button>
        ) : (
          <span className="page-link disabled">{number}</span>
        )}
      </li>
    ));
  };

  const handlePageNavigation = () => {
    const pageNumber = parseInt(pageInput, 10);
    if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
      setCurrentPage(pageNumber);
    } else {
      alert("Please enter a valid page number.");
    }
  };

  const currentItems = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


  const resetForm = () => {
    setFormData(initialFormData);
    setShowForm(false);
    setEditingEmployee(null);
  };

  const validateForm = () => {
    const requiredFields = [
      'firstName', 'lastName', 'dob', 'genderId', 'address1',
      'countryId', 'stateId', 'districtId', 'city', 'pincode',
      'mobileNo', 'identificationType', 'registrationNo'
    ];

    for (const field of requiredFields) {
      if (!formData[field]) {
        showPopup(`Please fill in the required field: ${field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}`, "error");
        return false;
      }
    }

    if (!formData.profilePicName && !editingEmployee?.profilePicName) {
      showPopup("Profile picture is required", "error");
      return false;
    }

    if (!formData.idDocumentName && !editingEmployee?.idDocumentName) {
      showPopup("ID document is required", "error");
      return false;
    }

    return true;
  };

  const prepareFormData = () => {
    if (!validateForm()) {
      return null;
    }

    const formDataToSend = new FormData();

    // Basic info fields
    formDataToSend.append('firstName', formData.firstName);
    formDataToSend.append('lastName', formData.lastName);
    if (formData.middleName) formDataToSend.append('middleName', formData.middleName);
    formDataToSend.append('dob', new Date(formData.dob).toISOString().split('T')[0]);
    formDataToSend.append('genderId', formData.genderId);
    formDataToSend.append('address1', formData.address1);
    formDataToSend.append('countryId', formData.countryId);
    formDataToSend.append('stateId', formData.stateId);
    formDataToSend.append('districtId', formData.districtId);
    formDataToSend.append('city', formData.city);
    formDataToSend.append('pincode', formData.pincode);
    formDataToSend.append('mobileNo', formData.mobileNo);
    formDataToSend.append('registrationNo', formData.registrationNo);
    formDataToSend.append('identificationType', formData.identificationType);
    formDataToSend.append('employeeTypeId', formData.employeeTypeId);
    formDataToSend.append('employmentTypeId', formData.employmentTypeId);
    formDataToSend.append('roleId', formData.roleId);
    formDataToSend.append('fromDate', new Date(formData.fromDate).toISOString());

    if (formData.deprtId) {
      formDataToSend.append('departmentId', formData.deprtId);
    }

    if (formData.profilePicName instanceof File) {
      formDataToSend.append('profilePicName', formData.profilePicName);
    }

    if (formData.idDocumentName instanceof File) {
      formDataToSend.append('idDocumentName', formData.idDocumentName);
    }

    formData.qualification.forEach((qual, index) => {
      formDataToSend.append(`qualification[${index}].institutionName`, qual.institutionName);
      formDataToSend.append(`qualification[${index}].completionYear`, qual.completionYear);
      formDataToSend.append(`qualification[${index}].qualificationName`, qual.qualificationName);

      if (qual.employeeQualificationId && qual.employeeQualificationId !== 1) {
        formDataToSend.append(`qualification[${index}].employeeQualificationId`, qual.employeeQualificationId);
      }

      if (qual.filePath instanceof File) {
        formDataToSend.append(`qualification[${index}].filePath`, qual.filePath);
      }
    });

    formData.document.forEach((doc, index) => {
      formDataToSend.append(`document[${index}].documentName`, doc.documentName);

      if (doc.employeeDocumentId && doc.employeeDocumentId !== 1) {
        formDataToSend.append(`document[${index}].employeeDocumentId`, doc.employeeDocumentId);
      }

      if (doc.filePath instanceof File) {
        formDataToSend.append(`document[${index}].filePath`, doc.filePath);
      }
    });

    return formDataToSend;
  };


  const handleSave = async () => {
    const formDataToSend = prepareFormData();
    if (!formDataToSend) return;
    console.log("Form data to send:", formDataToSend);
    setLoading(true);
    try {
      const response = await fetch(`${API_HOST}${EMPLOYEE_REGISTRATION}/employee/${empUpdateId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        showPopup("Employee updated successfully", "success");
        resetForm();
      } else {
        showPopup(`Error: ${data.message || 'Failed to update employee'}`, "error");
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      showPopup("Error submitting form. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="body d-flex py-3">
      <div className="container-xxl">
        <div className="row align-items-center">
          <div className="border-0 mb-4">
            {popupMessage && (
              <Popup
                message={popupMessage.message}
                type={popupMessage.type}
                onClose={popupMessage.onClose}
              />
            )}
            {loading && <LoadingScreen />}

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
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Mobile Number"
                        value={searchMobile}
                        onChange={(e) => setSearchMobile(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Employee Name"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                      />
                    </div>
                    <div className="col-md-2">
                      <button className="btn btn-primary w-100" onClick={handleSearch}>Search</button>
                    </div>
                    <div className="col-md-2">
                      <button className="btn btn-warning w-100" onClick={handleShowAll}>Show All</button>
                    </div>
                  </div>

                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>S.N.</th>
                        <th>Employee Name</th>
                        <th>Gender</th>
                        <th>Date Of Birth</th>
                        <th>Mobile No</th>
                        <th>Type Of Employee</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.length > 0 ? (
                        currentItems.map((employee, index) => (
                          <tr key={index}>
                            <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                            <td>{employee.firstName} {employee.middleName} {employee.lastName}</td>
                            <td>{employee.gender}</td>
                            <td>{employee.dob}</td>
                            <td>{employee.mobileNo}</td>
                            <td>{employee.employeeType}</td>
                            <td>{employee.role}</td>
                            <td>
                              {employee.status === "A" ? (
                                <i className="fa fa-check-circle text-success fa-2x"></i>
                              ) : (
                                <i className="fa fa-times-circle fa-2x text-danger"></i>
                              )}
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleAnotherAction(employee)}
                                disabled={employee.status !== "S"}
                              >
                                <i className="fa fa-pencil"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (<tr>
                        <td colSpan="7" className="text-center text-danger">
                          No Record Found
                        </td>
                      </tr>)}

                    </tbody>
                  </table>

                  <nav className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                      <span>
                        Page {currentPage} of {filteredTotalPages} | Total Records: {filteredEmployees.length}
                      </span>
                    </div>
                    <ul className="pagination mb-0">
                      <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          &laquo; Previous
                        </button>
                      </li>
                      {renderPagination()}
                      <li className={`page-item ${currentPage === filteredTotalPages ? "disabled" : ""}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === filteredTotalPages}
                        >
                          Next &raquo;
                        </button>
                      </li>
                    </ul>
                    <div className="d-flex align-items-center">
                      <input
                        type="number"
                        min="1"
                        max={filteredTotalPages}
                        value={pageInput}
                        onChange={(e) => setPageInput(e.target.value)}
                        placeholder="Go to page"
                        className="form-control me-2"
                      />
                      <button
                        className="btn btn-primary"
                        onClick={handlePageNavigation}
                      >
                        Go
                      </button>
                    </div>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }} className="forms row">
            <div className="g-3 row">
              <div className="col-md-4">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  id="firstName"
                  placeholder="First Name"
                  onChange={handleInputChange}
                  value={formData.firstName}
                  maxLength={mlenght}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Middle Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="middleName"
                  placeholder="Middle Name"
                  onChange={handleInputChange}
                  value={formData.middleName}
                  maxLength={mlenght}
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
                  onChange={handleInputChange}
                  value={formData.lastName}
                  maxLength={mlenght}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Date of Birth *</label>
                <input
                  type="date"
                  required
                  id="dob"
                  value={formData.dob}
                  className="form-control"
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Gender *</label>
                <select
                  className="form-select"
                  style={{ paddingRight: "40px" }}
                  value={formData.genderId}
                  onChange={(e) =>
                    handleGenderChange(parseInt(e.target.value, 10))
                  }
                  disabled={loading}
                >
                  <option value="">Select Gender</option>
                  {genderData.map((gender) => (
                    <option key={gender.id} value={gender.id}>
                      {gender.genderName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Address *</label>
                <textarea
                  required
                  id="address1"
                  value={formData.address1}
                  className="form-control"
                  onChange={handleInputChange}
                  placeholder="Address"
                ></textarea>
              </div>
              <div className="col-md-4">
                <label className="form-label">Country *</label>
                <select
                  className="form-select"
                  value={formData.countryId}
                  onChange={(e) => {
                    const selectedCountry = countryData.find(
                      (country) => country.id.toString() === e.target.value
                    );
                    if (selectedCountry) {
                      handleCountryChange(selectedCountry.id);
                      setCountryIds(selectedCountry.id);
                      fetchStateData(selectedCountry.id);
                    }
                  }}
                  disabled={loading}
                >
                  <option value="">Select Country</option>
                  {countryData.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.countryName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">State *</label>
                <select
                  className="form-select"
                  value={formData.stateId}
                  onChange={(e) => {
                    const selectedState = stateData.find(
                      (state) => state.id.toString() === e.target.value
                    );
                    if (selectedState) {
                      handleStateChange(selectedState.id);
                      setStateIds(selectedState.id);
                      fetchDistrictData(selectedState.id);
                    }
                  }}
                  disabled={loading || !formData.countryId}
                >
                  <option value="">Select State</option>
                  {stateData.map((state) => (
                    <option key={state.id} value={state.id}>
                      {state.stateName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">District *</label>
                <select
                  className="form-select"
                  value={formData.districtId}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  disabled={loading || !formData.stateId}
                >
                  <option value="">Select District</option>
                  {districtData.map((dist) => (
                    <option key={dist.id} value={dist.id}>
                      {dist.districtName}
                    </option>
                  ))}
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
                  onChange={handleInputChange}
                  value={formData.city}
                  maxLength={mlenght}
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
                  onChange={handleInputMobileChange}
                  value={formData.pincode}
                  maxLength={6}
                  minLength={6}
                  inputMode="numeric"
                  pattern="\d*"
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
                  onChange={handleInputMobileChange}
                  value={formData.mobileNo}
                  maxLength={10}
                  minLength={10}
                  inputMode="numeric"
                  pattern="\d*"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">ID Type *</label>
                <select
                  className="form-select"
                  style={{ paddingRight: "40px" }}
                  value={formData.identificationType}
                  onChange={(e) =>
                    handleIdTypeChange(parseInt(e.target.value, 10))
                  }
                  disabled={loading}
                >
                  <option value="">Select ID Type</option>
                  {idTypeData.map((idType) => (
                    <option key={idType.identificationTypeId} value={idType.identificationTypeId}>
                      {idType.identificationName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">ID Number *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  id="registrationNo"
                  placeholder="ID Number"
                  onChange={handleInputChange}
                  value={formData.registrationNo}
                  maxLength={mlenght}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">ID Upload (JPEG/PDF) *</label>
                <input
                  type="file"
                  id="idDocumentName"
                  className="form-control mt-2"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setFormData({ ...formData, idDocumentName: e.target.files[0] })}
                />
                {editingEmployee?.idDocumentName && formData.idDocumentName && (
                  <small className="text-muted">Current file: {editingEmployee.idDocumentName.split('/').pop().replace(/^\d+_/, '')}</small>
                )}
              </div>


              <div className="col-md-4">
                <label className="form-label">Role Name *</label>
                <select
                  className="form-select"
                  style={{ paddingRight: "40px" }}
                  value={formData.roleId}
                  onChange={(e) =>
                    handleRoleChange(parseInt(e.target.value, 10))
                  }
                  disabled={loading}
                >
                  <option value="">Select Role</option>
                  {roleData.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.roleDesc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Period of Employment From Date</label>
                <input
                  type="date"
                  id="fromDate"
                  value={formData.fromDate}
                  className="form-control"
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Type of Employee *</label>
                <select
                  className="form-select"
                  style={{ paddingRight: "40px" }}
                  value={formData.employeeTypeId}
                  onChange={(e) =>
                    handleEmployeeTypeChange(parseInt(e.target.value, 10))
                  }
                  disabled={loading}
                >
                  <option value="">Select Employee Type</option>
                  {employeeTypeData.map((empType) => (
                    <option key={empType.userTypeId} value={empType.userTypeId}>
                      {empType.userTypeName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Type of Employment *</label>
                <select
                  className="form-select"
                  style={{ paddingRight: "40px" }}
                  value={formData.employmentTypeId}
                  onChange={(e) =>
                    handleEmploymentTypeChange(parseInt(e.target.value, 10))
                  }
                  disabled={loading}
                >
                  <option value="">Select Employment Type</option>
                  {employmentTypeData.map((emptType) => (
                    <option key={emptType.id} value={emptType.id}>
                      {emptType.employmentType}
                    </option>
                  ))}
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
                        {formData.qualification.map((row, index) => (
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
                                <small className="text-muted">Current file: {row.filePath.split('/').pop().replace(/^\d+_/, '')}</small>
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
                        {formData.document.map((row, index) => (
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
                                <small className="text-muted">Current file: {row.filePath.split('/').pop().replace(/^\d+_/, '')}</small>
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
              <button
                type="submit" className="btn btn-primary me-2">
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
  );
};

export default ViewSearchEmployee;