import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, postRequest, putRequest } from "../../../service/apiService";
import { MAS_SERVICE_CATEGORY, MAS_DEPARTMENT, DOCTOR, FILTER_OPD_DEPT } from "../../../config/apiConfig";

const IPDConsultationTariff = () => {
  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({
    serviceCategory: "",
    serviceCategoryId: "",
    visitType: "",
    visitTypeId: "",
    department: "",
    departmentId: "",
    doctor: "",
    doctorId: "",
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

  const [serviceCategoryOptions, setServiceCategoryOptions] = useState([]);
  const [visitTypeOptions, setVisitTypeOptions] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [doctorData, setDoctorData] = useState([]);
  const [filterDoctorData, setFilterDoctorData] = useState([]);
  
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [process, setProcess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [fetchingDoctors, setFetchingDoctors] = useState(false);

  // Filter states
  const [doctorFilter, setDoctorFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE;

  const hospitalId = sessionStorage.getItem("hospitalId");

  // ================= API CALLS =================
  
  // Fetch IPD Consultation Tariff data
  const fetchIPDTariffData = async (page = 0) => {
    setLoading(true);
    try {
      let url = `/master/ipdConsultationTariff/getAll?page=${page}&size=${itemsPerPage}`;
      
      if (departmentFilter) {
        url += `&departmentId=${departmentFilter}`;
      }
      if (doctorFilter) {
        url += `&doctorId=${doctorFilter}`;
      }
      
      const response = await getRequest(url);
      
      if (response.status === 200 && response.response) {
        const paginatedData = response.response;
        
        // Handle empty response
        if (!paginatedData.content || paginatedData.content.length === 0) {
          setData([]);
          setTotalPages(0);
          setTotalItems(0);
          setCurrentPage(1);
          return;
        }
        
        // Transform data for display
        const transformedData = paginatedData.content.map(item => ({
          id: item.tariffId || item.id,
          serviceCategory: item.serviceCategoryName || item.serviceCategory,
          serviceCategoryId: item.serviceCategoryId,
          visitType: item.visitTypeName || item.visitType,
          visitTypeId: item.visitTypeId,
          department: item.departmentName || item.department,
          departmentId: item.departmentId,
          doctor: item.doctorName || item.doctor,
          doctorId: item.doctorId,
          charge: item.baseTariff || item.charge,
          validFrom: item.fromDate || item.validFrom,
          validTo: item.toDate || item.validTo,
          status: item.status
        }));
        
        setData(transformedData);
        setTotalPages(paginatedData.totalPages || 0);
        setTotalItems(paginatedData.totalElements || 0);
        setCurrentPage((paginatedData.number || 0) + 1);
      } else {
        console.error("Unexpected API response format:", response);
        setData([]);
        setTotalPages(0);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching IPD Tariff data:", error);
      setData([]);
      setTotalPages(0);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Service Categories
  const fetchServiceCategories = async () => {
    try {
      const response = await getRequest(`${MAS_SERVICE_CATEGORY}/getAll/1`);
      if (response.status === 200) {
        let categories = [];
        if (Array.isArray(response.response)) {
          categories = response.response;
        } else if (response.response && Array.isArray(response.response.content)) {
          categories = response.response.content;
        }
        
        const categoryOptions = categories
          .filter(cat => cat.status === "y")
          .map(cat => ({
            id: cat.id,
            name: cat.serviceCatName
          }));
        setServiceCategoryOptions(categoryOptions);
        return categoryOptions;
      } else {
        console.error("Unexpected API response format:", response);
        setServiceCategoryOptions([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching Service Category data:", error);
      setServiceCategoryOptions([]);
      return [];
    }
  };

  // Fetch Visit Types
  const fetchVisitTypes = async () => {
    try {
      const response = await getRequest("/masVisitType/getAll/1");
      if (response.status === 200) {
        let visitTypes = [];
        if (Array.isArray(response.response)) {
          visitTypes = response.response;
        } else if (response.response && Array.isArray(response.response.content)) {
          visitTypes = response.response.content;
        }
        
        const visitTypeOptions = visitTypes
          .filter(type => type.status === "y")
          .map(type => ({
            id: type.id,
            name: type.visitTypeName
          }));
        setVisitTypeOptions(visitTypeOptions);
        return visitTypeOptions;
      } else {
        console.error("Unexpected API response format:", response);
        setVisitTypeOptions([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching Visit Type data:", error);
      setVisitTypeOptions([]);
      return [];
    }
  };

  // Fetch Departments (OPD type)
  const fetchDepartments = async () => {
    try {
      const response = await getRequest(`${MAS_DEPARTMENT}/getAll/1`);
      if (response.status === 200 && Array.isArray(response.response)) {
        const filteredDepartments = response.response.filter(
          (dept) => dept.departmentTypeName === FILTER_OPD_DEPT && dept.status === "y"
        );
        setDepartmentData(filteredDepartments);
        return filteredDepartments;
      } else {
        console.error("Unexpected API response format:", response);
        setDepartmentData([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
      setDepartmentData([]);
      return [];
    }
  };

  // Fetch doctors based on department for filter
  const fetchDoctorsForFilter = async (departmentId) => {
    if (!departmentId) {
      setFilterDoctorData([]);
      return;
    }
    try {
      const response = await getRequest(`${DOCTOR}/doctorBySpeciality/${departmentId}`);
      console.log("Filter Doctors Response:", response);
      if (response.status === 200 && Array.isArray(response.response)) {
        // Don't filter by status since it's null in the response
        setFilterDoctorData(response.response);
      } else {
        setFilterDoctorData([]);
      }
    } catch (error) {
      console.error("Error fetching doctors for filter:", error);
      setFilterDoctorData([]);
    }
  };

  // Fetch doctors for form
  const fetchDoctorsForForm = async (departmentId) => {
    if (!departmentId) {
      setDoctorData([]);
      return [];
    }
    setFetchingDoctors(true);
    try {
      const response = await getRequest(`${DOCTOR}/doctorBySpeciality/${departmentId}`);
      console.log("Form Doctors Response:", response);
      if (response.status === 200 && Array.isArray(response.response)) {
        // Don't filter by status since it's null in the response
        setDoctorData(response.response);
        return response.response;
      } else {
        setDoctorData([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching doctors for form:", error);
      setDoctorData([]);
      return [];
    } finally {
      setFetchingDoctors(false);
    }
  };

  // ================= EFFECTS =================
  useEffect(() => {
    fetchServiceCategories();
    fetchVisitTypes();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (!showForm) {
      fetchIPDTariffData(0);
    }
  }, [departmentFilter, doctorFilter, showForm]);

  // ================= FILTER HANDLERS =================
  const handleDepartmentFilterChange = (e) => {
    const deptId = e.target.value;
    setDepartmentFilter(deptId);
    setDoctorFilter("");
    if (deptId) {
      fetchDoctorsForFilter(deptId);
    } else {
      setFilterDoctorData([]);
    }
    setCurrentPage(1);
  };

  const handleDoctorFilterChange = (e) => {
    setDoctorFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleShowAll = () => {
    setDepartmentFilter("");
    setDoctorFilter("");
    setFilterDoctorData([]);
    setCurrentPage(1);
  };

  // ================= FORM HANDLERS =================
  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    
    if (name === "department") {
      const selectedDept = departmentData.find(dept => dept.id === parseInt(value));
      
      // Update form data first
      setFormData(prev => ({
        ...prev,
        department: selectedDept?.departmentName || "",
        departmentId: value,
        doctor: "",
        doctorId: ""
      }));
      
      // Fetch doctors for the selected department
      if (value) {
        await fetchDoctorsForForm(parseInt(value));
      } else {
        setDoctorData([]);
      }
      
      // Validate form after state updates
      setTimeout(() => {
        setFormData(prev => {
          validateForm(prev);
          return prev;
        });
      }, 100);
      
    } else if (name === "doctor") {
      const selectedDoc = doctorData.find(doc => doc.userId === parseInt(value));
      
      setFormData(prev => {
        const updatedForm = {
          ...prev,
          doctor: selectedDoc ? `Dr. ${selectedDoc.firstName} ${selectedDoc.middleName || ''} ${selectedDoc.lastName}`.trim().replace(/\s+/g, ' ') : "",
          doctorId: value
        };
        validateForm(updatedForm);
        return updatedForm;
      });
      
    } else if (name === "serviceCategory") {
      const selectedCategory = serviceCategoryOptions.find(cat => cat.id === parseInt(value));
      
      setFormData(prev => {
        const updatedForm = {
          ...prev,
          serviceCategory: selectedCategory?.name || "",
          serviceCategoryId: value
        };
        validateForm(updatedForm);
        return updatedForm;
      });
      
    } else if (name === "visitType") {
      const selectedVisitType = visitTypeOptions.find(type => type.id === parseInt(value));
      
      setFormData(prev => {
        const updatedForm = {
          ...prev,
          visitType: selectedVisitType?.name || "",
          visitTypeId: value
        };
        validateForm(updatedForm);
        return updatedForm;
      });
      
    } else {
      setFormData(prev => {
        const updatedForm = { ...prev, [name]: value };
        validateForm(updatedForm);
        return updatedForm;
      });
    }
  };

  const validateForm = (formDataToValidate) => {
    const isValid = formDataToValidate.serviceCategoryId &&
      formDataToValidate.visitTypeId &&
      formDataToValidate.departmentId &&
      formDataToValidate.doctorId &&
      formDataToValidate.charge &&
      formDataToValidate.validFrom &&
      formDataToValidate.validTo;
    
    setIsFormValid(!!isValid);
  };

  const resetForm = () => {
    setFormData({
      serviceCategory: "",
      serviceCategoryId: "",
      visitType: "",
      visitTypeId: "",
      department: "",
      departmentId: "",
      doctor: "",
      doctorId: "",
      charge: "",
      validFrom: "",
      validTo: "",
    });
    setDoctorData([]);
    setIsFormValid(false);
    setFormLoading(false);
  };

  // ================= SAVE =================
  const handleSave = async (e) => {
    e.preventDefault();
    setProcess(true);
    
    if (!isFormValid) {
      setProcess(false);
      showPopup("Please fill all required fields", "error");
      return;
    }

    const payload = {
      serviceCategoryId: parseInt(formData.serviceCategoryId, 10),
      visitTypeId: parseInt(formData.visitTypeId, 10),
      departmentId: parseInt(formData.departmentId, 10),
      doctorId: parseInt(formData.doctorId, 10),
      hospitalId: parseInt(hospitalId, 10),
      baseTariff: parseFloat(formData.charge),
      fromDate: new Date(formData.validFrom).toISOString(),
      toDate: new Date(formData.validTo).toISOString()
    };

    try {
      let response;
      if (editingRecord) {
        response = await putRequest(
          `/master/ipdConsultationTariff/update/${editingRecord.id}`,
          payload
        );
        if (response.status === 200) {
          showPopup("Updated Successfully", "success");
          await fetchIPDTariffData(currentPage - 1);
          handleCancel();
        } else {
          throw new Error(response.message || "Update failed");
        }
      } else {
        response = await postRequest("/master/ipdConsultationTariff/create", payload);
        if (response.status === 200 || response.status === 201) {
          showPopup("Added Successfully", "success");
          await fetchIPDTariffData(0);
          handleCancel();
        } else {
          throw new Error(response.message || "Save failed");
        }
      }
    } catch (error) {
      console.error("Error saving record:", error);
      showPopup(error.message || "Failed to save changes", "error");
    } finally {
      setProcess(false);
    }
  };

  // ================= EDIT =================
  const handleEdit = async (rec) => {
    setFormLoading(true);
    setShowForm(true);
    setEditingRecord(rec);
    
    try {
      // Ensure all dropdown data is loaded first
      await Promise.all([
        fetchServiceCategories(),
        fetchVisitTypes(),
        fetchDepartments()
      ]);
      
      // Fetch doctors for the department if departmentId exists
      if (rec.departmentId) {
        await fetchDoctorsForForm(rec.departmentId);
      }
      
      // Now set the form data after all dropdown data is loaded
      const newFormData = {
        serviceCategory: rec.serviceCategory || "",
        serviceCategoryId: rec.serviceCategoryId?.toString() || "",
        visitType: rec.visitType || "",
        visitTypeId: rec.visitTypeId?.toString() || "",
        department: rec.department || "",
        departmentId: rec.departmentId?.toString() || "",
        doctor: rec.doctor || "",
        doctorId: rec.doctorId?.toString() || "",
        charge: rec.charge?.toString() || "",
        validFrom: rec.validFrom ? new Date(rec.validFrom).toISOString().split('T')[0] : "",
        validTo: rec.validTo ? new Date(rec.validTo).toISOString().split('T')[0] : "",
      };
      
      setFormData(newFormData);
      setIsFormValid(true);
      
    } catch (error) {
      console.error("Error loading edit form:", error);
      showPopup("Error loading form data", "error");
    } finally {
      setFormLoading(false);
    }
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
        const response = await putRequest(
          `/master/ipdConsultationTariff/status/${confirmDialog.recordId}?status=${confirmDialog.newStatus}`
        );

        if (response.status === 200) {
          showPopup(
            `Record ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
            "success"
          );
          await fetchIPDTariffData(currentPage - 1);
        } else {
          throw new Error(response.message || "Failed to update status");
        }
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

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchIPDTariffData(page - 1);
  };

  // ================= DATE FORMATTING =================
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
  };

  // ================= UI =================
  return (
    <div className="content-wrapper">
      <div className="row">
        {loading && <LoadingScreen />}
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">IPD Consultation Tariff</h4>

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

                  <button className="btn btn-success" onClick={handleShowAll}>
                    <i className="mdi mdi-refresh"></i> Show All
                  </button>
                </div>
              ) : (
                <div className="d-flex justify-content-end">
                  <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                    <i className="mdi mdi-arrow-left"></i> Back
                  </button>
                </div>
              )}
            </div>

            <div className="card-body">
              {!showForm ? (
                <>
                  {/* Filter Section */}
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
                        {filterDoctorData.map((doc) => (
                          <option key={doc.userId} value={doc.userId.toString()}>
                            Dr. {doc.firstName} {doc.middleName || ''} {doc.lastName || ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Table Section */}
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Service Category</th>
                          <th>Visit Type</th>
                          <th>Department</th>
                          <th>Doctor</th>
                          <th>Charge</th>
                          <th>Valid From</th>
                          <th>Valid To</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.length > 0 ? (
                          data.map((rec) => (
                            <tr key={rec.id}>
                              <td style={{ textTransform: "capitalize" }}>{rec.serviceCategory || '-'}</td>
                              <td>{rec.visitType || '-'}</td>
                              <td>{rec.department || '-'}</td>
                              <td>{rec.doctor || '-'}</td>
                              <td>{rec.charge ? `₹${Number(rec.charge).toFixed(2)}` : '₹0.00'}</td>
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
                                  <i className="fa fa-pencil"></i> Edit
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

                  {/* Pagination */}
                  {totalPages > 0 && (
                    <Pagination
                      totalItems={totalItems}
                      itemsPerPage={itemsPerPage}
                      currentPage={currentPage}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              ) : (
                /* Form Section */
                <>
                  {formLoading && <LoadingScreen />}
                  <form className="forms row" onSubmit={handleSave}>
                    <div className="row">
                      <div className="form-group col-md-4 mt-3">
                        <label>
                          Service Category <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          name="serviceCategory"
                          value={formData.serviceCategoryId}
                          onChange={handleInputChange}
                          required
                          disabled={formLoading}
                        >
                          <option value="">Select Service Category</option>
                          {serviceCategoryOptions.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group col-md-4 mt-3">
                        <label>
                          Visit Type <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          name="visitType"
                          value={formData.visitTypeId}
                          onChange={handleInputChange}
                          required
                          disabled={formLoading}
                        >
                          <option value="">Select Visit Type</option>
                          {visitTypeOptions.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group col-md-4 mt-3">
                        <label>
                          Department <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          name="department"
                          value={formData.departmentId}
                          onChange={handleInputChange}
                          required
                          disabled={formLoading}
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
                          value={formData.doctorId}
                          onChange={handleInputChange}
                          required
                          disabled={!formData.departmentId || formLoading || fetchingDoctors}
                        >
                          <option value="">
                            {fetchingDoctors ? "Loading doctors..." : "Select Doctor"}
                          </option>
                          {doctorData.map((doc) => (
                            <option key={doc.userId} value={doc.userId}>
                              Dr. {doc.firstName} {doc.middleName || ''} {doc.lastName || ''}
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
                          placeholder="Enter charge amount"
                          value={formData.charge}
                          onChange={handleInputChange}
                          required
                          disabled={formLoading}
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
                          disabled={formLoading}
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
                          disabled={formLoading}
                        />
                      </div>
                    </div>

                    <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                      <button
                        type="submit"
                        className="btn btn-primary me-2"
                        disabled={process || !isFormValid || formLoading}
                      >
                        {process ? "Processing..." : (editingRecord ? "Update" : "Save")}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={handleCancel}
                        disabled={process || formLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* Popup Message */}
              {popupMessage && (
                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
              )}

              {/* Confirmation Dialog */}
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
      </div>
    </div>
  );
};

export default IPDConsultationTariff;