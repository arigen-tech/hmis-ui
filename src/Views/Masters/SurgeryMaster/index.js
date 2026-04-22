import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import LoadingScreen from "../../../Components/Loading/index";
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import { MAS_SURGERY, MAS_DEPARTMENT, REQUEST_PARAM_DEPARTMENT_TYPE_CODE, GET_ALL_ACT_MAS_DEPT_FOR_DROPDOWN_END_URL, FILTER_OPD_DEPT } from "../../../config/apiConfig";
import { ADD_SURGERY_SUCC_MSG, UPDATE_SURGERY_SUCC_MSG, FAIL_TO_SAVE_CHANGES, FAIL_TO_UPDATE_STS } from "../../../config/constants"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination"

const SurgeryMaster = () => {
  const [formData, setFormData] = useState({
    surgeryCode: "",
    surgeryName: "",
    departmentId: "",
    surgeryLevel: "",
    isAnesthesiaRequired: ""
  })

  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    surgeryId: null, 
    newStatus: "", 
    surgeryName: "" 
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [surgeryData, setSurgeryData] = useState([])
  const [departmentData, setDepartmentData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)
  const [editingSurgery, setEditingSurgery] = useState(null)
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [process, setProcess] = useState(false);

  // Constants for validation
  const SURGERY_CODE_MAX_LENGTH = 8;
  const SURGERY_NAME_MAX_LENGTH = 30;
  
  // Surgery level options
  const surgeryLevelOptions = [
    { value: "MIN", label: "Minor" },
    { value: "MAJ", label: "Major" },
    { value: "SUP", label: "Super Major" }
  ];

  // Anesthesia options
  const anesthesiaOptions = [
    { value: "Y", label: "Yes" },
    { value: "N", label: "No" }
  ];

  useEffect(() => {
    fetchSurgeryData(0);
    fetchDepartmentData();
  }, []);

  useEffect(() => {
    if (showForm) {
      fetchDepartmentData();
    }
  }, [showForm]);

  // Validate form
  useEffect(() => {
    const { surgeryCode, surgeryName, departmentId, surgeryLevel, isAnesthesiaRequired } = formData;
    setIsFormValid(
      surgeryCode.trim() !== "" &&
      surgeryName.trim() !== "" &&
      departmentId !== "" &&
      surgeryLevel !== "" &&
      isAnesthesiaRequired !== ""
    );
  }, [formData]);

  // Filter data based on search query
  const filteredSurgeryData = surgeryData.filter(surgery =>
    surgery.surgeryCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    surgery.surgeryName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchSurgeryData = async (page = 0) => {
    setLoading(true);
    try {
      // Get all active records (flag=1)
      const data = await getRequest(`${MAS_SURGERY}/getAll/0`);
      
      if (data.status === 200 && data.response) {
        setSurgeryData(data.response);
        setTotalItems(data.response.length);
        setTotalPages(Math.ceil(data.response.length / DEFAULT_ITEMS_PER_PAGE));
      } else {
        console.error("Unexpected API response format:", data);
        setSurgeryData([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error("Error fetching Surgery data:", error);
      setSurgeryData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentData = async () => {
    try {
      const data = await getRequest(`${GET_ALL_ACT_MAS_DEPT_FOR_DROPDOWN_END_URL}?${REQUEST_PARAM_DEPARTMENT_TYPE_CODE}=${FILTER_OPD_DEPT}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        // No filter - include all departments for Surgery
        setDepartmentData(data.response);
        return data.response;
      } else {
        console.error("Unexpected API response format:", data);
        setDepartmentData([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
      return [];
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleEdit = async (item) => {
    setEditingSurgery(item);
    
    // Fetch departments first to ensure dropdown is populated
    await fetchDepartmentData();
    
    // Set form data from the selected item
    setFormData({
      surgeryCode: item.surgeryCode || "",
      surgeryName: item.surgeryName || "",
      departmentId: item.departmentId?.toString() || "",
      surgeryLevel: item.surgeryLevel || "",
      isAnesthesiaRequired: item.isAnesthesiaRequired || ""
    });
    
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setProcess(true);
    if (!isFormValid) {
      setProcess(false);
      return;
    }

    const payload = {
      surgeryCode: formData.surgeryCode,
      surgeryName: formData.surgeryName,
      departmentId: parseInt(formData.departmentId, 10),
      surgeryLevel: formData.surgeryLevel,
      isAnesthesiaRequired: formData.isAnesthesiaRequired
    };

    try {
      let response;
      if (editingSurgery) {
        response = await putRequest(
          `${MAS_SURGERY}/update/${editingSurgery.surgeryId}`,
          payload
        );
        if (response.status === 200) {
          //showPopup(UPDATE_SURGERY_SUCC_MSG || "Surgery updated successfully!", "success");
          setPopupMessage({
            message:  "Surgery updated successfully!",
            type: "success",
            onClose: () => {
              setPopupMessage(null);
                  resetForm();
           fetchSurgeryData();
          setCurrentPage(1);
            }
          });
        
        } else {
          throw new Error(response.message || "Update failed");
        }
      } else {
        response = await postRequest(`${MAS_SURGERY}/create`, payload);
        if (response.status === 201 || response.status === 200) {
          // showPopup(ADD_SURGERY_SUCC_MSG || "Surgery added successfully!", "success");
          setPopupMessage({
            message:  "Surgery added successfully!",
            type: "success",
            onClose: () => {
              setPopupMessage(null);
                  resetForm();
           fetchSurgeryData();
          setCurrentPage(1);
            }
          });
          
        } else {
          throw new Error(response.message || "Save failed");
        }
      }
    } catch (error) {
      console.error("Error saving Surgery:", error);
      showPopup(FAIL_TO_SAVE_CHANGES, "error");
    } finally {
      setProcess(false);
    }
  };

  const resetForm = () => {
    setEditingSurgery(null);
    setShowForm(false);
    setFormData({
      surgeryCode: "",
      surgeryName: "",
      departmentId: "",
      surgeryLevel: "",
      isAnesthesiaRequired: ""
    });
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
    setConfirmDialog({ 
      isOpen: true, 
      surgeryId: id, 
      newStatus, 
      surgeryName: name 
    });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.surgeryId !== null) {
      setProcess(true);
      try {
        const response = await putRequest(
          `${MAS_SURGERY}/status/${confirmDialog.surgeryId}?status=${confirmDialog.newStatus}`
        );

        if (response.status === 200) {
          setPopupMessage({
            message:  "Surgery added successfully!",
            type: "success",
            onClose: () => {
              setPopupMessage(null);
                  resetForm();
           fetchSurgeryData();
          setCurrentPage(1);
            }
          });
          
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
    setConfirmDialog({ 
      isOpen: false, 
      surgeryId: null, 
      newStatus: "", 
      surgeryName: "" 
    });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value
    }));
  };

  const handleSelectChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value
    }));
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchSurgeryData();
  };

  const handleActivate = async () => {
    if (editingSurgery && editingSurgery.status === "n") {
      setProcess(true);
      try {
        const response = await putRequest(
          `${MAS_SURGERY}/status/${editingSurgery.surgeryId}?status=y`
        );

        if (response.status === 200) {
          showPopup("Surgery activated successfully!", "success");
          resetForm();
          await fetchSurgeryData();
          setCurrentPage(1);
        } else {
          throw new Error(response.message || "Failed to activate");
        }
      } catch (error) {
        console.error("Error activating surgery:", error);
        showPopup("Failed to activate surgery", "error");
      } finally {
        setProcess(false);
      }
    }
  };

  // Get current page items
  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredSurgeryData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="content-wrapper">
      <div className="row">
        {loading && <LoadingScreen />}
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">Surgery Master</h4>

              <div className="d-flex justify-content-between align-items-center gap-2">
                {!showForm && (
                  <>
                    <form className="d-inline-block searchform me-2" role="search">
                      <div className="input-group searchinput">
                        <input
                          type="search"
                          className="form-control"
                          placeholder="Search by code or name"
                          aria-label="Search"
                          value={searchQuery}
                          onChange={handleSearchChange}
                        />
                        <span className="input-group-text" id="search-icon">
                          <i className="fa fa-search"></i>
                        </span>
                      </div>
                    </form>
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
                        setEditingSurgery(null);
                        setFormData({
                          surgeryCode: "",
                          surgeryName: "",
                          departmentId: "",
                          surgeryLevel: "",
                          isAnesthesiaRequired: ""
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
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Surgery Code</th>
                          <th>Surgery Name</th>
                          <th>Department</th>
                          <th>Level</th>
                          <th>Anesthesia Required</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((item) => {
                            const levelLabel = surgeryLevelOptions.find(
                              opt => opt.value === item.surgeryLevel
                            )?.label || item.surgeryLevel;
                            
                            const anesthesiaLabel = item.isAnesthesiaRequired === "Y" ? "Yes" : "No";
                            
                            return (
                              <tr key={item.surgeryId}>
                                <td>{item.surgeryCode || '-'}</td>
                                <td style={{ textTransform: "capitalize" }}>{item.surgeryName || '-'}</td>
                                <td>{item.departmentName || '-'}</td>
                                <td>{levelLabel}</td>
                                <td>{anesthesiaLabel}</td>
                                <td>
                                  <div className="form-check form-switch">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      checked={item.status === "y"}
                                      onChange={() => handleSwitchChange(
                                        item.surgeryId, 
                                        item.surgeryName, 
                                        item.status === "y" ? "n" : "y"
                                      )}
                                      id={`switch-${item.surgeryId}`}
                                    />
                                    <label
                                      className="form-check-label px-0"
                                      htmlFor={`switch-${item.surgeryId}`}
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
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="7" className="text-center">No records found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {filteredSurgeryData.length > 0 && (
                    <Pagination
                      totalItems={filteredSurgeryData.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              ) : (
                <>
                  <form className="forms row" onSubmit={handleSave}>
                    <div className="d-flex justify-content-end mb-3">
                      <button type="button" className="btn btn-secondary" onClick={resetForm}>
                        <i className="mdi mdi-arrow-left"></i> Back
                      </button>
                    </div>
                    <div className="row">
                      <div className="form-group col-md-4 mt-3">
                        <label>
                          Surgery Code <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="surgeryCode"
                          placeholder="Enter surgery code"
                          onChange={handleInputChange}
                          value={formData.surgeryCode}
                          maxLength={SURGERY_CODE_MAX_LENGTH}
                          required
                          disabled={process}
                        />
                      </div>
                      <div className="form-group col-md-4 mt-3">
                        <label>
                          Surgery Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="surgeryName"
                          placeholder="Enter surgery name"
                          onChange={handleInputChange}
                          value={formData.surgeryName}
                          maxLength={SURGERY_NAME_MAX_LENGTH}
                          required
                          disabled={process}
                        />
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
                          disabled={process}
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
                          Surgery Level <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          id="surgeryLevel"
                          onChange={handleSelectChange}
                          value={formData.surgeryLevel}
                          required
                          disabled={process}
                        >
                          <option value="">Select Surgery Level</option>
                          {surgeryLevelOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group col-md-4 mt-3">
                        <label>
                          Anesthesia Required <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          id="isAnesthesiaRequired"
                          onChange={handleSelectChange}
                          value={formData.isAnesthesiaRequired}
                          required
                          disabled={process}
                        >
                          <option value="">Select Option</option>
                          {anesthesiaOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                      <button
                        type="submit"
                        className="btn btn-primary me-2"
                        disabled={process || !isFormValid}
                      >
                        {process ? "Processing..." : (editingSurgery ? 'Update' : 'Save')}
                      </button>
                      
                      {editingSurgery && editingSurgery.status === "n" && (
                        <button
                          type="button"
                          className="btn btn-success me-2"
                          onClick={handleActivate}
                          disabled={process}
                        >
                          Activate
                        </button>
                      )}
                      
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
                  <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button type="button" className="btn-close" onClick={() => handleConfirm(false)} aria-label="Close"></button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                          <strong>
                            {confirmDialog.surgeryName}
                          </strong>
                          {" "}surgery?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)} disabled={process}>
                          Cancel
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)} disabled={process}>
                          {process ? "Processing..." : "Confirm"}
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

export default SurgeryMaster