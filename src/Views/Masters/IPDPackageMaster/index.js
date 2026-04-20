import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, postRequest, putRequest } from "../../../service/apiService";
import { MAS_DEPARTMENT, FILTER_OPD_DEPT } from "../../../config/apiConfig";

const IPDPackageMaster = () => {
  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({
    packageName: "",
    packageTypeId: "",
    departmentId: "",
    stayDays: "",
  });
  
  // Categories configuration from API
  const [categoriesConfig, setCategoriesConfig] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  
  // Department data from API
  const [departmentData, setDepartmentData] = useState([]);
  
  // Admission Categories from API
  const [admissionCategories, setAdmissionCategories] = useState([]);
  
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
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE;
  
  const hospitalId = sessionStorage.getItem("hospitalId");

  // ================= API CALLS =================

  // Fetch Admission Categories
  const fetchAdmissionCategories = async () => {
    try {
      const response = await getRequest("/master/masAdmissionCategory/getAll/1");
      if (response.status === 200 && Array.isArray(response.response)) {
        const activeCategories = response.response.filter(
          (cat) => cat.status === "y"
        );
        setAdmissionCategories(activeCategories);
        return activeCategories;
      } else {
        setAdmissionCategories([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching Admission Categories:", error);
      setAdmissionCategories([]);
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
        setDepartmentData([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
      setDepartmentData([]);
      return [];
    }
  };

  // Fetch IPD Packages
  const fetchIPDPackages = async (page = 0) => {
    setLoading(true);
    try {
      const response = await getRequest(`/master/ipdPackage/getAll/1?page=${page}&size=${itemsPerPage}`);
      
      if (response.status === 200 && response.response) {
        let packages = [];
        if (Array.isArray(response.response)) {
          packages = response.response;
        } else if (response.response.content) {
          packages = response.response.content;
          setTotalPages(response.response.totalPages || 0);
          setTotalItems(response.response.totalElements || 0);
        } else {
          packages = [];
        }
        
        const transformedData = packages.map(pkg => ({
          id: pkg.packageId,
          packageName: pkg.packageName,
          type: pkg.type,
          departmentId: pkg.departmentId,
          departmentName: pkg.departmentName,
          stay: pkg.stay,
          inclusions: pkg.inclusions,
          exclusions: pkg.exclusions,
          lastUpdateDate: pkg.lastUpdate,
          status: pkg.status
        }));
        
        setData(transformedData);
        if (!response.response.content) {
          setTotalPages(Math.ceil(transformedData.length / itemsPerPage));
          setTotalItems(transformedData.length);
        }
      } else {
        setData([]);
        setTotalPages(0);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching IPD Packages:", error);
      setData([]);
      setTotalPages(0);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Service Categories for package components
  const fetchServiceCategories = async () => {
    try {
      const response = await getRequest("/master/ipdServiceCategory/getAll/1");
      if (response.status === 200 && Array.isArray(response.response)) {
        const categories = response.response
          .filter(cat => cat.status === "y")
          .map(cat => ({
            categoryId: cat.categoryId,
            categoryName: cat.categoryName,
            categoryCode: cat.categoryCode,
            displayOrder: cat.displayOrder
          }))
          .sort((a, b) => a.displayOrder - b.displayOrder);
        
        setServiceCategories(categories);
        
        // Initialize categories config with fetched categories
        const initialConfig = categories.map(cat => ({
          serviceCategoryId: cat.categoryId,
          categoryName: cat.categoryName,
          days: "",
          limitAmount: "",
          includedFlag: "n"
        }));
        setCategoriesConfig(initialConfig);
        return categories;
      } else {
        setServiceCategories([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching service categories:", error);
      setServiceCategories([]);
      return [];
    }
  };

  // Fetch single package by ID for editing
  const fetchPackageById = async (id) => {
    setFormLoading(true);
    try {
      const response = await getRequest(`/master/ipdPackage/getById/${id}`);
      if (response.status === 200 && response.response) {
        const packageData = response.response;
        
        // Find matching admission category ID based on package type name
        const matchedCategory = admissionCategories.find(
          cat => cat.admissionCategoryName === packageData.type
        );
        
        // Find matching department ID based on department name
        const matchedDepartment = departmentData.find(
          dept => dept.departmentName === packageData.departmentName
        );
        
        // Set form data
        setFormData({
          packageName: packageData.packageName || "",
          packageTypeId: matchedCategory?.admissionCategoryId?.toString() || "",
          departmentId: matchedDepartment?.id?.toString() || "",
          stayDays: packageData.stay?.toString() || "",
        });
        
        // If package has inclusion responses, populate categories config
        if (packageData.masIpdPackageInclusionResponses && Array.isArray(packageData.masIpdPackageInclusionResponses)) {
          // Create a map of serviceCategoryId to inclusion data for quick lookup
          const inclusionMap = {};
          packageData.masIpdPackageInclusionResponses.forEach(item => {
            inclusionMap[item.serviceCategoryId] = item;
          });
          
          const config = serviceCategories.map(cat => {
            const existing = inclusionMap[cat.categoryId];
            return {
              serviceCategoryId: cat.categoryId,
              categoryName: cat.categoryName,
              // Use limitQty for days (backend field name)
              days: existing?.limitQty?.toString() || "",
              limitAmount: existing?.limitAmount?.toString() || "",
              includedFlag: existing?.includedFlag || "n"
            };
          });
          setCategoriesConfig(config);
        } else {
          // Reset to default if no inclusions
          const resetConfig = serviceCategories.map(cat => ({
            serviceCategoryId: cat.categoryId,
            categoryName: cat.categoryName,
            days: "",
            limitAmount: "",
            includedFlag: "n"
          }));
          setCategoriesConfig(resetConfig);
        }
        
        setIsFormValid(true);
      }
    } catch (error) {
      console.error("Error fetching package details:", error);
      showPopup("Error loading package details", "error");
    } finally {
      setFormLoading(false);
    }
  };

  // ================= EFFECTS =================
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchAdmissionCategories(),
        fetchDepartments(),
        fetchServiceCategories(),
        fetchIPDPackages(0)
      ]);
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!showForm) {
      fetchIPDPackages(currentPage - 1);
    }
  }, [searchQuery, showForm]);

  // ================= SEARCH HANDLER =================
  const handleSearch = () => {
    setCurrentPage(1);
    fetchIPDPackages(0);
  };

  const handleShowAll = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchIPDPackages(0);
  };

  // ================= FORM HANDLERS =================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...formData, [name]: value };
    setFormData(updatedForm);
    
    validateForm(updatedForm);
  };
  
  const validateForm = (formDataToValidate) => {
    const isValid = formDataToValidate.packageName &&
      formDataToValidate.packageTypeId &&
      formDataToValidate.departmentId &&
      formDataToValidate.stayDays;
    setIsFormValid(!!isValid);
  };
  
  // Category table handlers
  const handleCategoryIncludeChange = (index, checked) => {
    const updated = [...categoriesConfig];
    updated[index].includedFlag = checked ? "y" : "n";
    setCategoriesConfig(updated);
  };
  
  const handleCategoryDaysChange = (index, value) => {
    const updated = [...categoriesConfig];
    updated[index].days = value;
    setCategoriesConfig(updated);
  };
  
  const handleCategoryAmountChange = (index, value) => {
    const updated = [...categoriesConfig];
    updated[index].limitAmount = value;
    setCategoriesConfig(updated);
  };
  
  // Generate inclusions/exclusions text from config
  const generateInclusionExclusionText = () => {
    const inclusions = [];
    const exclusions = [];
    
    categoriesConfig.forEach(item => {
      if (item.includedFlag === "y") {
        let inclusionText = item.categoryName;
        if (item.limitAmount && item.days) {
          inclusionText += ` (Limit: ${item.limitAmount}, Days: ${item.days})`;
        } else if (item.limitAmount) {
          inclusionText += ` (Limit: ${item.limitAmount})`;
        } else if (item.days) {
          inclusionText += ` (Days: ${item.days})`;
        }
        inclusions.push(inclusionText);
      } else if (item.includedFlag === "n" && item.categoryName) {
        exclusions.push(item.categoryName);
      }
    });
    
    return {
      inclusionsText: inclusions.join(", "),
      exclusionsText: exclusions.join(", ")
    };
  };
  
  const resetForm = () => {
    setFormData({
      packageName: "",
      packageTypeId: "",
      departmentId: "",
      stayDays: "",
    });
    
    // Reset categories config
    const resetConfig = serviceCategories.map(cat => ({
      serviceCategoryId: cat.categoryId,
      categoryName: cat.categoryName,
      days: "",
      limitAmount: "",
      includedFlag: "n"
    }));
    setCategoriesConfig(resetConfig);
    setIsFormValid(false);
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
    
    // Prepare inclusion list - send ALL categories with their includedFlag status
    const masIpdPackageInclusionRequestList = categoriesConfig.map(item => ({
      serviceCategoryId: parseInt(item.serviceCategoryId, 10),
      days: item.days ? parseInt(item.days, 10) : 0,
      limitAmount: item.limitAmount ? parseFloat(item.limitAmount) : 0,
      includedFlag: item.includedFlag
    }));
    
    const payload = {
      packageName: formData.packageName,
      packageTypeId: parseInt(formData.packageTypeId, 10),
      departmentId: parseInt(formData.departmentId, 10),
      stayDays: parseInt(formData.stayDays, 10),
      generatedInclusions: generateInclusionExclusionText().inclusionsText,
      generatedExclusions: generateInclusionExclusionText().exclusionsText,
      masIpdPackageInclusionRequestList: masIpdPackageInclusionRequestList
    };
    
    try {
      let response;
      if (editingRecord) {
        response = await putRequest(
          `/master/ipdPackage/update/${editingRecord.id}`,
          payload
        );
        if (response.status === 200) {
          showPopup("Updated Successfully", "success");
          await fetchIPDPackages(currentPage - 1);
          handleCancel();
        } else {
          showPopup(response.message || "Update failed", "error");
        }
      } else {
        response = await postRequest("/master/ipdPackage/create", payload);
        if (response.status === 200 || response.status === 201) {
          showPopup("Added Successfully", "success");
          await fetchIPDPackages(0);
          handleCancel();
        } else {
          showPopup(response.message || "Save failed", "error");
        }
      }
    } catch (error) {
      console.error("Error saving record:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to save changes";
      showPopup(errorMessage, "error");
    } finally {
      setProcess(false);
    }
  };
  
  // ================= EDIT =================
  const handleEdit = async (rec) => {
    setShowForm(true);
    setEditingRecord(rec);
    await fetchPackageById(rec.id);
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
          `/master/ipdPackage/status/${confirmDialog.recordId}?status=${confirmDialog.newStatus}`
        );
        
        if (response.status === 200) {
          showPopup(
            `Package ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
            "success"
          );
          await fetchIPDPackages(currentPage - 1);
        } else {
          showPopup(response.message || "Failed to update status", "error");
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
    fetchIPDPackages(page - 1);
  };
  
  // ================= DATE FORMATTING =================
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
  };
  
  // Live preview for form
  const livePreview = generateInclusionExclusionText();
  
  // Filter data for display
  const filteredData = data.filter((rec) =>
    rec.packageName?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // ================= UI =================
  return (
    <div className="content-wrapper">
      <div className="row">
        {loading && <LoadingScreen />}
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">IPD Package Master</h4>
              
              {!showForm ? (
                <div className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control me-2"
                    placeholder="Search by package name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    style={{ width: "250px" }}
                  />
                  
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
                  {/* Table Section */}
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Package Name</th>
                          <th>Type</th>
                          <th>Department</th>
                          <th>Stay (Days)</th>
                          <th>Inclusions</th>
                          <th>Exclusions</th>
                          <th>Last Update</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((rec) => (
                            <tr key={rec.id}>
                              <td style={{ textTransform: "capitalize" }}>{rec.packageName || '-'}</td>
                              <td>{rec.type || '-'}</td>
                              <td>{rec.departmentName || '-'}</td>
                              <td>{rec.stay || '-'}</td>
                              <td>{rec.inclusions || '-'}</td>
                              <td>{rec.exclusions || '-'}</td>
                              <td>{formatDate(rec.lastUpdateDate)}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={rec.status === "y"}
                                    onChange={() => handleSwitchChange(
                                      rec.id,
                                      rec.packageName,
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
                      <div className="form-group col-md-6 mt-3">
                        <label>
                          Package Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          name="packageName"
                          placeholder="Enter package name"
                          value={formData.packageName}
                          onChange={handleInputChange}
                          required
                          disabled={formLoading}
                        />
                      </div>
                      
                      <div className="form-group col-md-6 mt-3">
                        <label>
                          Package Type <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          name="packageTypeId"
                          value={formData.packageTypeId}
                          onChange={handleInputChange}
                          required
                          disabled={formLoading}
                        >
                          <option value="">Select Package Type</option>
                          {admissionCategories.map((category) => (
                            <option key={category.admissionCategoryId} value={category.admissionCategoryId}>
                              {category.admissionCategoryName}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group col-md-6 mt-3">
                        <label>
                          Department <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          name="departmentId"
                          value={formData.departmentId}
                          onChange={handleInputChange}
                          required
                          disabled={formLoading}
                        >
                          <option value="">Select Department</option>
                          {departmentData.map((dept) => (
                            <option key={dept.id} value={dept.id.toString()}>
                              {dept.departmentName}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group col-md-6 mt-3">
                        <label>
                          Stay (Days) <span className="text-danger">*</span>
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          name="stayDays"
                          placeholder="Enter number of days"
                          value={formData.stayDays}
                          onChange={handleInputChange}
                          required
                          disabled={formLoading}
                        />
                      </div>
                    </div>
                    
                    {/* Categories Table */}
                    <div className="row mt-4">
                      <div className="col-12">
                        <label className="fw-bold mb-2">Package Components</label>
                        <div className="table-responsive">
                          <table className="table table-bordered align-middle">
                            <thead className="table-light">
                              <tr>
                                <th style={{ width: "80px" }}>Include</th>
                                <th>Category</th>
                                <th>Limit Amount (₹)</th>
                                <th>Limit Days</th>
                              </tr>
                            </thead>
                            <tbody>
                              {categoriesConfig.map((item, idx) => (
                                <tr key={idx}>
                                  <td className="text-center">
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      checked={item.includedFlag === "y"}
                                      onChange={(e) => handleCategoryIncludeChange(idx, e.target.checked)}
                                      disabled={formLoading}
                                    />
                                  </td>
                                  <td>{item.categoryName}</td>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control"
                                      placeholder="Enter limit amount"
                                      value={item.limitAmount}
                                      onChange={(e) => handleCategoryAmountChange(idx, e.target.value)}
                                      disabled={formLoading}
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control"
                                      placeholder="Enter days limit"
                                      value={item.days}
                                      onChange={(e) => handleCategoryDaysChange(idx, e.target.value)}
                                      disabled={formLoading}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                    
                    {/* Live Preview */}
                    <div className="row mt-3">
                      <div className="col-md-6">
                        <div className="card p-3 bg-light">
                          <strong>Generated Inclusions:</strong>
                          <p className="mt-2 mb-0">{livePreview.inclusionsText || "None"}</p>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="card p-3 bg-light">
                          <strong>Generated Exclusions:</strong>
                          <p className="mt-2 mb-0">{livePreview.exclusionsText || "None"}</p>
                        </div>
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

export default IPDPackageMaster;