import { useState, useEffect, useCallback, useRef } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, postRequest, putRequest } from "../../../service/apiService";
import { 
  ADD_PACKAGE_CONFIG_SUCC_MSG, 
  UPDATE_PACKAGE_CONFIG_SUCC_MSG, 
  FAIL_TO_SAVE_CHANGES, 
  FAIL_TO_UPDATE_STS 
} from "../../../config/constants";
import { 
  MAS_IPD_BILLING_TYPE,
  PACKAGE_RATE_CONFIG,
  MAS_TPA,
  MAS_CORPORATE,
  IPD_PACKAGE,
  MAS_INSURANCE,
  MAS_ROOM_CATEGORY
} from "../../../config/apiConfig";

const PackageConfiguration = () => {
  const [packageConfigData, setPackageConfigData] = useState([]);
  const [billingTypeData, setBillingTypeData] = useState([]);
  const [insuranceData, setInsuranceData] = useState([]);
  const [tpaData, setTpaData] = useState([]);
  const [corporateData, setCorporateData] = useState([]);
  const [roomCategoryData, setRoomCategoryData] = useState([]);
  const [packageData, setPackageData] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    configId: null, 
    newStatus: "", 
    name: "" 
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  
  // Search filters
  const [searchFilters, setSearchFilters] = useState({
    billingTypeId: "",
    corporateId: "",
    insuranceId: "",
    search: ""
  });

  // Temporary search input state (for debouncing)
  const [searchInput, setSearchInput] = useState("");
  
  // Debounce timer ref
  const debounceTimerRef = useRef(null);
  
  // Form data
  const [formData, setFormData] = useState({
    packageId: "",
    billingTypeId: "",
    insuranceId: "",
    tpaId: "",
    corporateId: "",
    roomCategoryId: "",
    amount: "",
    effectiveFrom: "",
    effectiveTo: "",
    preAuthRequired: "",
    copayPercent: "",
    maxClaimAmount: ""
  });
  
  const [isFormValid, setIsFormValid] = useState(false);
  
  // Fetch all master data on component mount
  useEffect(() => {
    fetchMasterData();
  }, []);
  
  // Fetch package config data when filters or page changes
  useEffect(() => {
    if (!showForm) {
      fetchPackageConfigData(currentPage - 1);
    }
  }, [searchFilters, currentPage, showForm]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  const fetchMasterData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBillingTypes(),
        fetchInsurance(),
        fetchTpa(),
        fetchCorporate(),
        fetchRoomCategories(),
        fetchPackages()
      ]);
    } catch (error) {
      console.error("Error fetching master data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchBillingTypes = async () => {
    try {
      const data = await getRequest(`${MAS_IPD_BILLING_TYPE}/getAll/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setBillingTypeData(data.response);
      }
    } catch (error) {
      console.error("Error fetching billing types:", error);
    }
  };
  
  const fetchInsurance = async () => {
    try {
      const data = await getRequest(`${MAS_INSURANCE}/getAll/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setInsuranceData(data.response);
      }
    } catch (error) {
      console.error("Error fetching insurance:", error);
    }
  };
  
  const fetchTpa = async () => {
    try {
      const data = await getRequest(`${MAS_TPA}/getAll/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setTpaData(data.response);
      }
    } catch (error) {
      console.error("Error fetching TPA:", error);
    }
  };
  
  const fetchCorporate = async () => {
    try {
      const data = await getRequest(`${MAS_CORPORATE}/getAll/1`);
      
      if (data.status === 200) {
        if (Array.isArray(data.response) && data.response.length > 0) {
          setCorporateData(data.response);
        } else {
          setCorporateData([]);
        }
      } else {
        setCorporateData([]);
      }
    } catch (error) {
      console.error("Error fetching corporate:", error);
      setCorporateData([]);
    }
  };
  
  const fetchRoomCategories = async () => {
    try {
      const data = await getRequest(`${MAS_ROOM_CATEGORY}/getAll/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setRoomCategoryData(data.response);
      }
    } catch (error) {
      console.error("Error fetching room categories:", error);
    }
  };
  
  const fetchPackages = async () => {
    try {
      const data = await getRequest(`${IPD_PACKAGE}/getAll/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setPackageData(data.response);
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
    }
  };
  
  const fetchPackageConfigData = async (page = 0) => {
    setSearchLoading(true);
    try {
      let url = `${PACKAGE_RATE_CONFIG}/getAll?page=${page}&size=${DEFAULT_ITEMS_PER_PAGE}`;
      
      if (searchFilters.billingTypeId) {
        url += `&billingTypeId=${searchFilters.billingTypeId}`;
      }
      if (searchFilters.corporateId) {
        url += `&corporateId=${searchFilters.corporateId}`;
      }
      if (searchFilters.insuranceId) {
        url += `&insuranceId=${searchFilters.insuranceId}`;
      }
      if (searchFilters.search && searchFilters.search.trim()) {
        url += `&search=${encodeURIComponent(searchFilters.search.trim())}`;
      }
      
      const data = await getRequest(url);
      
      if (data.status === 200 && data.response) {
        const responseData = data.response;
        setPackageConfigData(responseData.content || []);
        setTotalPages(responseData.totalPages || 0);
        setTotalItems(responseData.totalElements || 0);
        setCurrentPage((responseData.number || 0) + 1);
      } else {
        setPackageConfigData([]);
        setTotalPages(0);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching package config data:", error);
      setPackageConfigData([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle search input with debounce
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setSearchFilters(prev => ({ ...prev, search: value }));
      setCurrentPage(1);
    }, 500);
  };

  // Handle immediate search (for Enter key or search button)
  const handleImmediateSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearchFilters(prev => ({ ...prev, search: searchInput }));
    setCurrentPage(1);
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };
  
  const handleClearFilters = () => {
    setSearchFilters({
      billingTypeId: "",
      corporateId: "",
      insuranceId: "",
      search: ""
    });
    setSearchInput("");
    setCurrentPage(1);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      if (name === "billingTypeId") {
        updated.insuranceId = "";
        updated.tpaId = "";
        updated.corporateId = "";
      }
      
      const allFieldsFilled = 
        updated.packageId &&
        updated.billingTypeId &&
        updated.roomCategoryId &&
        updated.amount &&
        updated.effectiveFrom &&
        updated.effectiveTo &&
        updated.preAuthRequired !== "" &&
        updated.copayPercent !== "" &&
        updated.maxClaimAmount !== "";
      
      let isValid = !!allFieldsFilled;
      
      if (isValid && updated.effectiveFrom && updated.effectiveTo) {
        const fromDate = new Date(updated.effectiveFrom);
        const toDate = new Date(updated.effectiveTo);
        
        if (fromDate >= toDate) {
          isValid = false;
        }
      }
      
      setIsFormValid(isValid);
      
      return updated;
    });
  };
  
  const handleEdit = async (item) => {
    setFormLoading(true);
    setShowForm(true);
    
    try {
      await fetchMasterData();
      
      setFormData({
        packageId: item.packageId?.toString() || "",
        billingTypeId: item.billingTypeId?.toString() || "",
        insuranceId: item.insuranceId?.toString() || "",
        tpaId: item.tpaId?.toString() || "",
        corporateId: item.corporateId?.toString() || "",
        roomCategoryId: item.roomCategoryId?.toString() || "",
        amount: item.amount?.toString() || "",
        effectiveFrom: item.effectiveFrom || "",
        effectiveTo: item.effectiveTo || "",
        preAuthRequired: item.preAuthRequired || "",
        copayPercent: item.copayPercent?.toString() || "",
        maxClaimAmount: item.maxClaimAmount?.toString() || ""
      });
      
      setEditingConfig(item);
      setIsFormValid(true);
    } catch (error) {
      console.error("Error loading edit form:", error);
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!isFormValid || saving) {
      return;
    }

    const fromDate = new Date(formData.effectiveFrom);
    const toDate = new Date(formData.effectiveTo);
    
    if (fromDate >= toDate) {
      showPopup("Effective From date must be before Effective To date", "error");
      return;
    }

    setSaving(true);
    
    const payload = {
      packageId: parseInt(formData.packageId, 10),
      billingTypeId: parseInt(formData.billingTypeId, 10),
      insuranceId: formData.insuranceId ? parseInt(formData.insuranceId, 10) : 0,
      tpaId: formData.tpaId ? parseInt(formData.tpaId, 10) : 0,
      corporateId: formData.corporateId ? parseInt(formData.corporateId, 10) : 0,
      roomCategoryId: parseInt(formData.roomCategoryId, 10),
      amount: parseFloat(formData.amount),
      effectiveFrom: formData.effectiveFrom,
      effectiveTo: formData.effectiveTo,
      preAuthRequired: formData.preAuthRequired,
      copayPercent: parseFloat(formData.copayPercent),
      maxClaimAmount: parseFloat(formData.maxClaimAmount)
    };
    
    try {
      if (editingConfig) {
        const response = await putRequest(
          `${PACKAGE_RATE_CONFIG}/update/${editingConfig.configId}`,
          payload
        );
        if (response.status === 200) {
          setPopupMessage({
            message: UPDATE_PACKAGE_CONFIG_SUCC_MSG || "Package configuration updated successfully!",
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              fetchPackageConfigData(0);
              setShowForm(false);
            }
          });
        } else {
          throw new Error(response.message || "Update failed");
        }
      } else {
        const response = await postRequest(`${PACKAGE_RATE_CONFIG}/create`, payload);
        if (response.status === 201 || response.status === 200) {
          setPopupMessage({
            message: ADD_PACKAGE_CONFIG_SUCC_MSG || "Package configuration added successfully!",
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              fetchPackageConfigData(0);
              setShowForm(false);
            }
          });
        } else {
          throw new Error(response.message || "Save failed");
        }
      }
    } catch (error) {
      console.error("Error saving package configuration:", error);
      showPopup(
        error.response?.data?.message || FAIL_TO_SAVE_CHANGES,
        "error"
      );
    } finally {
      setSaving(false);
    }
  };
  
  const handleSwitchChange = (configId, currentStatus, name) => {
    const newStatus = currentStatus === "y" ? "n" : "y";
    setConfirmDialog({
      isOpen: true,
      configId: configId,
      newStatus,
      name: name
    });
  };
  
  const handleConfirmStatus = async (confirmed) => {
    if (confirmed && confirmDialog.configId !== null) {
      setSaving(true);
      
      try {
        const response = await putRequest(
          `${PACKAGE_RATE_CONFIG}/status/${confirmDialog.configId}?status=${confirmDialog.newStatus}`
        );
        
        if (response.status === 200) {
          setPopupMessage({
            message: `Package configuration "${confirmDialog.name}" ${
              confirmDialog.newStatus === 'y' ? 'activated' : 'deactivated'
            } successfully!`,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              fetchPackageConfigData(currentPage - 1);
              setCurrentPage(1);
            },
          });
        } else {
          throw new Error(response.message || "Failed to update status");
        }
      } catch (error) {
        console.error("Error updating status:", error);
        showPopup(FAIL_TO_UPDATE_STS, "error");
      } finally {
        setSaving(false);
      }
    }
    
    setConfirmDialog({ 
      isOpen: false, 
      configId: null, 
      newStatus: "", 
      name: "" 
    });
  };
  
  const resetForm = () => {
    setEditingConfig(null);
    setShowForm(false);
    setFormData({
      packageId: "",
      billingTypeId: "",
      insuranceId: "",
      tpaId: "",
      corporateId: "",
      roomCategoryId: "",
      amount: "",
      effectiveFrom: "",
      effectiveTo: "",
      preAuthRequired: "",
      copayPercent: "",
      maxClaimAmount: ""
    });
    setIsFormValid(false);
    setFormLoading(false);
  };
  
  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => setPopupMessage(null)
    });
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return dateString;
  };
  
  // Determine if Insurance/TPA/Corporate fields should be disabled
  const getBillingTypeName = () => {
    const billingType = billingTypeData.find(bt => bt.billingTypeId === parseInt(formData.billingTypeId));
    return billingType?.billingTypeName || "";
  };
  
  const billingTypeName = getBillingTypeName();
  const isInsuranceEnabled = billingTypeName === "INSURANCE";
  const isCorporateEnabled = billingTypeName === "CORPORATE";
  
  return (
    <div className="content-wrapper">
      <div className="row">
        {loading && <LoadingScreen />}
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Package Configuration</h4>
              
              <div className="d-flex align-items-center">
                {!showForm && (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => {
                      resetForm();
                      setShowForm(true);
                    }}
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
            
            <div className="card-body">
              {!showForm ? (
                <>
                  {/* Filter Section */}
                  <div className="row mb-3 align-items-end">
                    <div className="col-md-3">
                      <label className="form-label fw-bold">Package Name</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          name="search"
                          placeholder="Search by package name"
                          value={searchInput}
                          onChange={handleSearchInputChange}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleImmediateSearch();
                            }
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="col-md-2">
                      <label className="form-label fw-bold">Billing Type</label>
                      <select
                        className="form-select"
                        name="billingTypeId"
                        value={searchFilters.billingTypeId}
                        onChange={handleFilterChange}
                      >
                        <option value="">All</option>
                        {billingTypeData.map(type => (
                          <option key={type.billingTypeId} value={type.billingTypeId}>
                            {type.billingTypeName}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-md-2">
                      <label className="form-label fw-bold">Insurance</label>
                      <select
                        className="form-select"
                        name="insuranceId"
                        value={searchFilters.insuranceId}
                        onChange={handleFilterChange}
                      >
                        <option value="">All</option>
                        {insuranceData.map(ins => (
                          <option key={ins.insuranceId} value={ins.insuranceId}>
                            {ins.insuranceName}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-md-2">
                      <label className="form-label fw-bold">Corporate</label>
                      <select
                        className="form-select"
                        name="corporateId"
                        value={searchFilters.corporateId}
                        onChange={handleFilterChange}
                      >
                        <option value="">All</option>
                        {corporateData.length > 0 ? (
                          corporateData.map(corp => (
                            <option key={corp.corporateId} value={corp.corporateId}>
                              {corp.corporateName}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>No corporate data available</option>
                        )}
                      </select>
                    </div>
                    
                    <div className="col-md-3 d-flex gap-2 align-items-end">
                      <button className="btn btn-primary" onClick={() => fetchPackageConfigData(0)}>
                        <i className="mdi mdi-magnify"></i> Search
                      </button>
                      <button className="btn btn-secondary" onClick={handleClearFilters}>
                        <i className="mdi mdi-refresh"></i> Reset
                      </button>
                      {searchLoading && (
                        <div className="spinner-border spinner-border-sm text-primary ms-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Package Name</th>
                          <th>Billing Type</th>
                          <th>Insurance</th>
                          <th>TPA</th>
                          <th>Corporate</th>
                          <th>Room Category</th>
                          <th>Amount (₹)</th>
                          <th>Effective From</th>
                          <th>Effective To</th>
                          <th>PreAuth</th>
                          <th>Co-Pay (%)</th>
                          <th>Max Limit (₹)</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchLoading ? (
                          <tr>
                            <td colSpan="14" className="text-center">
                              <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            </td>
                          </tr>
                        ) : packageConfigData.length > 0 ? (
                          packageConfigData.map((item) => (
                            <tr key={item.configId}>
                              <td>{item.packageName || '-'}</td>
                              <td>{item.billingTypeName || '-'}</td>
                              <td>{item.insuranceName || '-'}</td>
                              <td>{item.tpaName || '-'}</td>
                              <td>{item.corporateName || '-'}</td>
                              <td>{item.roomCategoryName || '-'}</td>
                              <td>₹{Number(item.amount).toFixed(2)}</td>
                              <td>{formatDate(item.effectiveFrom)}</td>
                              <td>{formatDate(item.effectiveTo)}</td>
                              <td>{item.preAuthRequired === 'y' ? 'Yes' : 'No'}</td>
                              <td>{item.copayPercent}%</td>
                              <td>₹{Number(item.maxClaimAmount).toFixed(2)}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={item.status === "y"}
                                    onChange={() => handleSwitchChange(item.configId, item.status, item.packageName)}
                                    id={`switch-${item.configId}`}
                                  />
                                  <label className="form-check-label ms-2" htmlFor={`switch-${item.configId}`}>
                                    {item.status === "y" ? "Active" : "Inactive"}
                                  </label>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-success btn-sm"
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
                            <td colSpan="14" className="text-center">No Records Found</td>
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
                      onPageChange={(page) => setCurrentPage(page)}
                    />
                  )}
                </>
              ) : (
                <>
                  {formLoading && <LoadingScreen />}
                  <form className="row" onSubmit={handleSave}>
                    <div className="d-flex justify-content-end mb-3">
                      <button type="button" className="btn btn-secondary" onClick={resetForm}>
                        Back
                      </button>
                    </div>
                    
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Package Name <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select mt-1"
                        name="packageId"
                        value={formData.packageId}
                        onChange={handleInputChange}
                        required
                        disabled={formLoading}
                      >
                        <option value="">Select Package</option>
                        {packageData.map(pkg => (
                          <option key={pkg.packageId} value={pkg.packageId}>
                            {pkg.packageName}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Billing Type <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select mt-1"
                        name="billingTypeId"
                        value={formData.billingTypeId}
                        onChange={handleInputChange}
                        required
                        disabled={formLoading}
                      >
                        <option value="">Select Billing Type</option>
                        {billingTypeData.map(type => (
                          <option key={type.billingTypeId} value={type.billingTypeId}>
                            {type.billingTypeName}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group col-md-4 mt-3">
                      <label>Insurance</label>
                      <select
                        className="form-select mt-1"
                        name="insuranceId"
                        value={formData.insuranceId}
                        onChange={handleInputChange}
                        disabled={!isInsuranceEnabled || formLoading}
                      >
                        <option value="">Select Insurance</option>
                        {insuranceData.map(ins => (
                          <option key={ins.insuranceId} value={ins.insuranceId}>
                            {ins.insuranceName}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group col-md-4 mt-3">
                      <label>TPA</label>
                      <select
                        className="form-select mt-1"
                        name="tpaId"
                        value={formData.tpaId}
                        onChange={handleInputChange}
                        disabled={!isInsuranceEnabled || formLoading}
                      >
                        <option value="">Select TPA</option>
                        {tpaData.map(tpa => (
                          <option key={tpa.tpaId} value={tpa.tpaId}>
                            {tpa.tpaName}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group col-md-4 mt-3">
                      <label>Corporate</label>
                      <select
                        className="form-select mt-1"
                        name="corporateId"
                        value={formData.corporateId}
                        onChange={handleInputChange}
                        disabled={!isCorporateEnabled || formLoading}
                      >
                        <option value="">Select Corporate</option>
                        {corporateData.length > 0 ? (
                          corporateData.map(corp => (
                            <option key={corp.corporateId} value={corp.corporateId}>
                              {corp.corporateName}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>No corporate data available</option>
                        )}
                      </select>
                    </div>
                    
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Room Category <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select mt-1"
                        name="roomCategoryId"
                        value={formData.roomCategoryId}
                        onChange={handleInputChange}
                        required
                        disabled={formLoading}
                      >
                        <option value="">Select Room Category</option>
                        {roomCategoryData.map(cat => (
                          <option key={cat.roomCategoryId} value={cat.roomCategoryId}>
                            {cat.roomCategoryName}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Amount (₹) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control mt-1"
                        name="amount"
                        placeholder="Enter amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        required
                        disabled={formLoading}
                      />
                    </div>
                    
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Effective From <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control mt-1"
                        name="effectiveFrom"
                        value={formData.effectiveFrom}
                        onChange={handleInputChange}
                        required
                        disabled={formLoading}
                        max={formData.effectiveTo || undefined}
                      />
                      {formData.effectiveFrom && formData.effectiveTo && new Date(formData.effectiveFrom) >= new Date(formData.effectiveTo) && (
                        <small className="text-danger">Effective From must be before Effective To</small>
                      )}
                    </div>
                    
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Effective To <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control mt-1"
                        name="effectiveTo"
                        value={formData.effectiveTo}
                        onChange={handleInputChange}
                        required
                        disabled={formLoading}
                        min={formData.effectiveFrom || undefined}
                      />
                      {formData.effectiveFrom && formData.effectiveTo && new Date(formData.effectiveFrom) >= new Date(formData.effectiveTo) && (
                        <small className="text-danger">Effective To must be after Effective From</small>
                      )}
                    </div>
                    
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        PreAuth Required <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select mt-1"
                        name="preAuthRequired"
                        value={formData.preAuthRequired}
                        onChange={handleInputChange}
                        required
                        disabled={formLoading}
                      >
                        <option value="">Select</option>
                        <option value="y">Yes</option>
                        <option value="n">No</option>
                      </select>
                    </div>
                    
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Co-pay (%) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control mt-1"
                        name="copayPercent"
                        placeholder="Enter co-pay percentage"
                        value={formData.copayPercent}
                        onChange={handleInputChange}
                        required
                        disabled={formLoading}
                      />
                    </div>
                    
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Max Claim Amount (₹) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control mt-1"
                        name="maxClaimAmount"
                        placeholder="Enter max claim amount"
                        value={formData.maxClaimAmount}
                        onChange={handleInputChange}
                        required
                        disabled={formLoading}
                      />
                    </div>

                    <div className="form-group col-md-12 mt-3 d-flex justify-content-end">
                      <button
                        type="submit"
                        className="btn btn-primary me-2"
                        disabled={!isFormValid || saving || formLoading}
                      >
                        {saving ? "Saving..." : editingConfig ? 'Update' : 'Save'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={resetForm}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </>
              )}
              
              {popupMessage && (
                <Popup 
                  message={popupMessage.message} 
                  type={popupMessage.type} 
                  onClose={popupMessage.onClose} 
                />
              )}
              
              {confirmDialog.isOpen && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-body">
                        Are you sure you want to{" "}
                        {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                        <strong>{confirmDialog.name}</strong>?
                      </div>
                      <div className="modal-footer">
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleConfirmStatus(false)}
                        >
                          No
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleConfirmStatus(true)}
                        >
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

export default PackageConfiguration;