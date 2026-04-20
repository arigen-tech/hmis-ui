import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import LoadingScreen from "../../../Components/Loading/index";
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import { MAS_OPD_SERVICE, MAS_SERVICE_CATEGORY, MAS_DEPARTMENT, FILTER_OPD_DEPT, DOCTOR } from "../../../config/apiConfig";
import { ADD_OPD_SERVICE_SUCC_MSG, UPDATE_OPD_SERVICE_SUCC_MSG, FAIL_TO_SAVE_CHANGES, FAIL_TO_UPDATE_STS } from "../../../config/constants"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination"

const OPDServiceMaster = () => {
  const [formData, setFormData] = useState({
    baseTariff: "",
    serviceCategory: "",
    departmentId: "",
    doctorId: "",
    fromDate: "",
    toDate: "",
  })

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, serviceId: null, newStatus: false, serviceName: "" })

  const [filterDepartment, setFilterDepartment] = useState("")
  const [filterDoctor, setFilterDoctor] = useState("")
  const [serviceOpdData, setServiceOpdData] = useState([])
  const [serviceCategoryData, setServiceCategoryData] = useState([])
  const [departmentData, setDepartmentData] = useState([]);
  const [doctorData, setDoctorData] = useState([]);
  const [rowDepartmentData, setRowDepartmentData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentItem, setCurrentItem] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [process, setProcess] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const hospitalId = sessionStorage.getItem("hospitalId");

  useEffect(() => {
    fetchServiceOpdData(0);
    fetchAllDepartmentsForFilter();
  }, []);

  useEffect(() => {
    if (showForm) {
      fetchServicecategoryData();
      fetchDepartmentData();
    }
  }, [showForm]);

  // Fetch doctors when departmentId changes
  useEffect(() => {
    if (showForm && formData.departmentId) {
      fetchDoctorData(formData.departmentId);
    }
  }, [showForm, formData.departmentId]);

  // Fetch all departments for filter dropdown
  const fetchAllDepartmentsForFilter = async () => {
    try {
      const data = await getRequest(`${MAS_DEPARTMENT}/getAll/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        const filteredDepartments = data.response.filter(
          (dept) => dept.departmentTypeName === `${FILTER_OPD_DEPT}`
        );
        setDepartmentData(filteredDepartments);
      }
    } catch (error) {
      console.error("Error fetching departments for filter:", error);
    }
  };

  // Fetch doctors based on selected department filter
  const fetchDoctorsForFilter = async (departmentId) => {
    if (!departmentId) {
      setDoctorData([]);
      return;
    }
    try {
      const data = await getRequest(`${DOCTOR}/doctorBySpeciality/${departmentId}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setDoctorData(data.response);
      } else {
        setDoctorData([]);
      }
    } catch (error) {
      console.error("Error fetching doctors for filter:", error);
      setDoctorData([]);
    }
  };

  // Search functionality - reloads data with filters
  const handleSearch = () => {
    setCurrentPage(1);
    fetchServiceOpdData(0);
  };

  const fetchServiceOpdData = async (page = 0) => {
    setLoading(true);
    try {
      // Build URL with query parameters
      let url = `${MAS_OPD_SERVICE}/getByHospitalId/${hospitalId}?page=${page}&size=${DEFAULT_ITEMS_PER_PAGE}`;
      
      if (filterDepartment) {
        url += `&departmentId=${filterDepartment}`;
      }
      if (filterDoctor) {
        url += `&doctorId=${filterDoctor}`;
      }
      
      const data = await getRequest(url);
      
      if (data.status === 200 && data.response) {
        // Keep the original data structure as it comes from the API
        setServiceOpdData(data.response.content);
        setTotalPages(data.response.totalPages || 0);
        setTotalItems(data.response.totalElements || 0);
        setCurrentPage(data.response.number + 1);
      } else {
        console.error("Unexpected API response format:", data);
        setServiceOpdData([]);
        setTotalPages(0);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching OPD Service data:", error);
      setServiceOpdData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchServicecategoryData = async () => {
    try {
      const data = await getRequest(`${MAS_SERVICE_CATEGORY}/getAll/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setServiceCategoryData(data.response);
        return data.response;
      } else {
        console.error("Unexpected API response format:", data);
        setServiceCategoryData([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching Service Category data:", error);
      return [];
    }
  };

  const fetchDepartmentData = async () => {
    try {
      const data = await getRequest(`${MAS_DEPARTMENT}/getAll/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        const filteredDepartments = data.response.filter(
          (dept) => dept.departmentTypeName === `${FILTER_OPD_DEPT}`
        );
        setRowDepartmentData(data.response);
        setDepartmentData(filteredDepartments);
        return filteredDepartments;
      } else {
        console.error("Unexpected API response format:", data);
        setRowDepartmentData([]);
        setDepartmentData([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
      return [];
    }
  };

  const fetchDoctorData = async (deptId) => {
    try {
      const data = await getRequest(`${DOCTOR}/doctorBySpeciality/${deptId}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setDoctorData(data.response);
        return data.response;
      } else {
        console.error("Unexpected API response format:", data);
        setDoctorData([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching Doctor data:", error);
      return [];
    }
  };

  const handleDepartmentFilterChange = (e) => {
    const deptId = e.target.value;
    setFilterDepartment(deptId);
    setFilterDoctor(""); // Reset doctor filter when department changes
    fetchDoctorsForFilter(deptId);
  };

  const handleDoctorFilterChange = (e) => {
    setFilterDoctor(e.target.value);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchServiceOpdData(page - 1);
  };

  const handleEdit = async (item) => {
    setFormLoading(true);
    setShowForm(true);
    
    try {
      // Fetch all required data first
      const [categories, departments] = await Promise.all([
        fetchServicecategoryData(),
        fetchDepartmentData()
      ]);
      
      // Find the service category ID by matching the name
      const serviceCategoryId = categories.find(
        cat => cat.serviceCatName === item.serviceCategory
      )?.id?.toString() || "";
      
      // Find the department ID by matching the name
      const departmentId = departments.find(
        dept => dept.departmentName === item.departmentName
      )?.id?.toString() || "";
      
      // Fetch doctors for the selected department
      let doctors = [];
      let doctorId = "";
      if (departmentId) {
        doctors = await fetchDoctorData(departmentId);
        
        // Find doctor ID by matching the name
        const fullName = `${item.doctorFirstName || ''} ${item.doctorMiddleName || ''} ${item.doctorLastName || ''}`.trim();
        const doctor = doctors.find(doc => {
          const docFullName = `${doc.firstName || ''} ${doc.middleName || ''} ${doc.lastName || ''}`.trim();
          return docFullName === fullName;
        });
        doctorId = doctor?.userId?.toString() || "";
      }
      
      // Now set the form data after all dropdown data is loaded
      const newFormData = {
        baseTariff: item.baseTariff?.toString() || "",
        serviceCategory: serviceCategoryId,
        departmentId: departmentId,
        doctorId: doctorId,
        fromDate: item.fromDate ? item.fromDate.split('T')[0] : "",
        toDate: item.toDate ? item.toDate.split('T')[0] : "",
      };
      
      setFormData(newFormData);
      setEditingService(item);
      
      // Validate form
      const isValid = !!(
        newFormData.baseTariff &&
        newFormData.serviceCategory &&
        newFormData.departmentId &&
        newFormData.doctorId &&
        newFormData.fromDate &&
        newFormData.toDate
      );
      setIsFormValid(isValid);
      
    } catch (error) {
      console.error("Error loading edit form:", error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setProcess(true);
    if (!isFormValid) return;

    const payload = {
      baseTariff: parseFloat(formData.baseTariff),
      serviceCategory: parseInt(formData.serviceCategory, 10),
      departmentId: parseInt(formData.departmentId, 10),
      doctorId: parseInt(formData.doctorId, 10),
      hospitalId: parseInt(hospitalId, 10),
      fromDate: new Date(formData.fromDate).toISOString(),
      toDate: new Date(formData.toDate).toISOString()
    };

    try {
      let response;
      if (editingService) {
        response = await putRequest(
          `${MAS_OPD_SERVICE}/update/${editingService.id}`,
          payload
        );
        if (response.status === 200) {
          showPopup(UPDATE_OPD_SERVICE_SUCC_MSG, "success");
          
          // Close the form first
          resetForm();
          
          // Reset to first page and refresh data
          setCurrentPage(1);
          await fetchServiceOpdData(0);
        } else {
          throw new Error(response.message || "Update failed");
        }
      } else {
        response = await postRequest(`${MAS_OPD_SERVICE}/save`, payload);
        if (response.status === 200) {
          showPopup(ADD_OPD_SERVICE_SUCC_MSG, "success");
          
          // Close the form first
          resetForm();
          
          // Reset to first page and refresh data
          setCurrentPage(1);
          await fetchServiceOpdData(0);
        } else {
          throw new Error(response.message || "Save failed");
        }
      }
    } catch (error) {
      console.error("Error saving OPD Service:", error);
      showPopup(FAIL_TO_SAVE_CHANGES, "error");
    } finally {
      setProcess(false);
    }
  };

  const resetForm = () => {
    setEditingService(null);
    setShowForm(false);
    setFormData({
      baseTariff: "",
      serviceCategory: "",
      departmentId: "",
      doctorId: "",
      fromDate: "",
      toDate: "",
    });
    setIsFormValid(false);
    setDoctorData([]);
    setFormLoading(false);
  };

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      },
    });
  };

  const handleSwitchChange = (id, name, newStatus) => {
    setCurrentItem(name);
    setConfirmDialog({ isOpen: true, serviceId: id, newStatus, serviceName: name });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.serviceId !== null) {
      setProcess(true);
      try {
        const response = await putRequest(
          `${MAS_OPD_SERVICE}/updateStatus/${confirmDialog.serviceId}?status=${confirmDialog.newStatus}`
        );

        if (response.status === 200) {
          showPopup(
            `Service ${confirmDialog.newStatus === 'y' ? 'activated' : 'deactivated'} successfully!`,
            "success"
          );
          await fetchServiceOpdData(currentPage - 1);
        } else {
          throw new Error(response.message || "Failed to update status");
        }
      } catch (error) {
        console.error("Error updating status:", error);
        showPopup(FAIL_TO_UPDATE_STS, "error");
      } finally {
        setProcess(false);
      }
    }
    setConfirmDialog({ isOpen: false, serviceId: null, newStatus: false, serviceName: "" });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => {
      const updatedFormData = { ...prevData, [id]: value };
      
      // Validate form after update
      setIsFormValid(
        !!updatedFormData.baseTariff &&
        !!updatedFormData.serviceCategory &&
        !!updatedFormData.departmentId &&
        !!updatedFormData.doctorId &&
        !!updatedFormData.fromDate &&
        !!updatedFormData.toDate
      );
      
      return updatedFormData;
    });
  };

  const handleSelectChange = (e) => {
    const { id, value } = e.target;

    const parsedValue = ["doctorId", "departmentId", "serviceCategory"].includes(id)
      ? parseInt(value, 10) || ""
      : value;

    setFormData((prevData) => {
      let updatedFormData = { ...prevData, [id]: parsedValue };
      
      // If department changes, reset doctor selection
      if (id === "departmentId") {
        updatedFormData = { ...updatedFormData, doctorId: "" };
        // Fetch doctors for new department
        if (parsedValue) {
          fetchDoctorData(parsedValue);
        } else {
          setDoctorData([]);
        }
      }
      
      // Validate form after update
      setIsFormValid(
        !!updatedFormData.baseTariff &&
        !!updatedFormData.serviceCategory &&
        !!updatedFormData.departmentId &&
        !!updatedFormData.doctorId &&
        !!updatedFormData.fromDate &&
        !!updatedFormData.toDate
      );
      
      return updatedFormData;
    });
  };

  const handleRefresh = () => {
    setFilterDepartment("");
    setFilterDoctor("");
    setCurrentPage(1);
    fetchServiceOpdData(0);
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        {loading && <LoadingScreen />}
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">OPD Service Master</h4>

              <div className="d-flex justify-content-between align-items-center gap-2">
                {!showForm && (
                  <>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={handleRefresh}
                    >
                      <i className="mdi mdi-refresh"></i> Show All
                    </button>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => {
                        setEditingService(null);
                        setIsFormValid(false);
                        setFormData({
                          baseTariff: "",
                          serviceCategory: "",
                          departmentId: "",
                          doctorId: "",
                          fromDate: "",
                          toDate: "",
                        });
                        setShowForm(true);
                      }}
                    >
                      <i className="mdi mdi-plus"></i> Add
                    </button>
                  </>
                )}
              </div>
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
                        value={filterDepartment}
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
                        value={filterDoctor}
                        onChange={handleDoctorFilterChange}
                        disabled={!filterDepartment}
                      >
                        <option value="">All Doctors</option>
                        {doctorData.map((doc) => (
                          <option key={doc.userId} value={doc.userId.toString()}>
                            {doc.firstName} {doc.middleName} {doc.lastName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-2">
                      <label className="form-label fw-bold">&nbsp;</label>
                      <button
                        className="btn btn-primary w-100"
                        onClick={handleSearch}
                        disabled={loading}
                      >
                        <i className="mdi mdi-magnify"></i> Search
                      </button>
                    </div>
                  </div>

                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Base Tariff</th>
                          <th>Service Category</th>
                          <th>Department</th>
                          <th>Doctor</th>
                          <th>From Date</th>
                          <th>To Date</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {serviceOpdData.length > 0 ? (
                          serviceOpdData.map((item) => (
                            <tr key={item.id}>
                              <td>
                                {item.baseTariff !== undefined && item.baseTariff !== null
                                  ? `₹${Number(item.baseTariff).toFixed(2)}`
                                  : '₹0.00'
                                }
                              </td>
                              <td style={{ textTransform: "capitalize" }}>{item.serviceCategory || '-'}</td>
                              <td>{item.departmentName || '-'}</td>
                              <td>
                                {[item.doctorFirstName, item.doctorMiddleName, item.doctorLastName]
                                  .filter(Boolean)
                                  .join(" ") || '-'}
                              </td>
                              <td>{item.fromDate ? new Date(item.fromDate).toLocaleDateString() : '-'}</td>
                              <td>{item.toDate ? new Date(item.toDate).toLocaleDateString() : '-'}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={item.status === "y"}
                                    onChange={() => handleSwitchChange(item.id, item.serviceName, item.status === "y" ? "n" : "y")}
                                    id={`switch-${item.id}`}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${item.id}`}
                                  >
                                    {item.status === "y" ? "Active" : "Deactivated"}
                                  </label>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(item)}
                                  disabled={item.status !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="text-center">No records found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 0 && (
                    <Pagination
                      totalItems={totalItems}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              ) : (
                <>
                  {formLoading && <LoadingScreen />}
                  <form className="forms row" onSubmit={handleSave}>
                    <div className="d-flex justify-content-end mb-3">
                      <button type="button" className="btn btn-secondary" onClick={resetForm}>
                        <i className="mdi mdi-arrow-left"></i> Back
                      </button>
                    </div>
                    <div className="row">
                      <div className="form-group col-md-4 mt-3">
                        <label>
                          Base Tariff <span className="text-danger">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          id="baseTariff"
                          placeholder="Base Tariff"
                          onChange={handleInputChange}
                          value={formData.baseTariff}
                          required
                        />
                      </div>
                      <div className="form-group col-md-4 mt-3">
                        <label>
                          Service Category <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          id="serviceCategory"
                          onChange={handleSelectChange}
                          value={formData.serviceCategory}
                          required
                        >
                          <option value="">Select Service Category</option>
                          {serviceCategoryData.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.serviceCatName}
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
                          id="departmentId"
                          onChange={handleSelectChange}
                          value={formData.departmentId}
                          required
                        >
                          <option value="">Select Department</option>
                          {departmentData.map((department) => (
                            <option key={department.id} value={department.id}>
                              {department.departmentName}
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
                          id="doctorId"
                          onChange={handleSelectChange}
                          value={formData.doctorId}
                          required
                          disabled={!formData.departmentId || formLoading}
                        >
                          <option value="">Select Doctor</option>
                          {doctorData.map((doctor) => (
                            <option key={doctor.userId} value={doctor.userId}>
                              {doctor.firstName} {doctor.middleName} {doctor.lastName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group col-md-4 mt-3">
                        <label>
                          From Date <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          id="fromDate"
                          onChange={handleInputChange}
                          value={formData.fromDate}
                          required
                        />
                      </div>
                      <div className="form-group col-md-4 mt-3">
                        <label>
                          To Date <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          id="toDate"
                          onChange={handleInputChange}
                          value={formData.toDate}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                      <button
                        type="submit"
                        className="btn btn-primary me-2"
                        disabled={process || !isFormValid}
                      >
                        {process ? "Processing..." : (editingService ? 'Update' : 'Save')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={resetForm}
                        disabled={process}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </>
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
                          <strong>
                            {confirmDialog.serviceName}
                          </strong>
                          ?
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
  )
}

export default OPDServiceMaster