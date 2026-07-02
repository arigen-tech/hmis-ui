import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_MEDICAL_ADVICE, MAS_DEPARTMENT, GET_ALL_ACT_MAS_DEPT_FOR_DROPDOWN_END_URL, REQUEST_PARAM_DEPARTMENT_TYPE_CODE, FILTER_OPD_DEPT } from "../../../config/apiConfig";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import { ADD_MED_ADV_SUCC_MSG, DUPLICATE_MED_ADV, FAIL_TO_SAVE_CHANGES, FAIL_TO_UPDATE_STS, FETCH_DEPARTMENT_ERR_MSG, FETCH_MED_ADV_ERR_MSG, INVALID_PAGE_NO_WARN_MSG, UPDATE_MED_ADV_SUCC_MSG } from "../../../config/constants";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination"


const MedicalAdviceMaster = () => {
  const [medicalData, setMedicalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    medicalAdviseId: null,
    newStatus: false
  });

  const [formData, setFormData] = useState({
    medicalAdviceName: "",
    departmentId: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingMedical, setEditingMedical] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");

  // Dropdown options
  const [departmentOptions, setDepartmentOptions] = useState([]);

  const MEDICAL_ADVICE_MAX_LENGTH = 500;

  // Function to format date as dd-MM-YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "N/A";
      }

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  // Fetch dropdown data
  const fetchDropdownData = async () => {
    try {
      // Fetch departments (OPD only)
      const departmentResponse = await getRequest(`${GET_ALL_ACT_MAS_DEPT_FOR_DROPDOWN_END_URL}?${REQUEST_PARAM_DEPARTMENT_TYPE_CODE}=${FILTER_OPD_DEPT}`);
      if (departmentResponse && departmentResponse.response) {
        setDepartmentOptions(departmentResponse.response.map(dept => ({
          id: dept.id,
          name: dept.departmentName,
          code: dept.departmentCode,
          deptType: dept.departmentTypeCode
        })));
      }
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
      showPopup(FETCH_DEPARTMENT_ERR_MSG, "error");
    }
  };

  // Fetch Clinical/Medical Advice data
  const fetchMedicalData = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_MEDICAL_ADVICE}/getAll/${flag}`);
      if (response && response.response) {
        const mappedData = response.response.map(item => ({
          id: item.medicalAdviseId,
          medicalAdviceName: item.medicalAdviseName,
          department: item.departmentName,
          departmentId: item.departmentId,
          status: item.status,
          lastUpdated: formatDate(item.lastUpdateDate),
          createdBy: item.createdBy || "",
          lastUpdatedBy: item.lastUpdatedBy || ""
        }));
        setMedicalData(mappedData);
      }
    } catch (err) {
      console.error("Error fetching Clinical/Medical Advice data:", err);
      showPopup(FETCH_MED_ADV_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchMedicalData(0);
    fetchDropdownData();
  }, []);

  // Filter data based on search query
  const filteredMedicalData = medicalData.filter(treatment =>
    treatment.medicalAdviceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    treatment.department?.toLowerCase().includes(searchQuery.toLowerCase())

  );



  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
    setPageInput("1");
  }, [searchQuery]);

  // Update page input when current page changes
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // Validate form whenever formData changes
  useEffect(() => {
    const validateForm = () => {
      const { medicalAdviceName } = formData;
      return (
        medicalAdviceName.trim() !== ""
      );
    };
    setIsFormValid(validateForm());
  }, [formData]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleEdit = (treatment) => {
    setEditingMedical(treatment);
    setFormData({
      medicalAdviceName: treatment.medicalAdviceName || "",
      departmentId: treatment.departmentId?.toString() || "",
    });
    setShowForm(true);
  };

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE
  const currentItems = filteredMedicalData.slice(indexOfFirst, indexOfLast)

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);

      // Check for duplicates (Clinical/Medical Advice should be unique within same department)
      const isDuplicate = medicalData.some(
        (treatment) =>
          treatment.medicalAdviceName.toLowerCase() === formData.medicalAdviceName.toLowerCase() &&
          (treatment.departmentId?.toString() || "") === formData.departmentId &&
          (!editingMedical || editingMedical.id !== treatment.id)
      );

      if (isDuplicate) {
        showPopup(DUPLICATE_MED_ADV, "error");
        setLoading(false);
        return;
      }

      // Prepare request data
      const requestData = {
        medicalAdviceName: formData.medicalAdviceName,
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : null
      };

      if (editingMedical) {
        // Update existing Clinical/Medical Advice
        const response = await putRequest(`${MAS_MEDICAL_ADVICE}/update/${editingMedical.id}`, requestData);

        if (response && response.status === 200) {
          showPopup(UPDATE_MED_ADV_SUCC_MSG, "success", () => {
            fetchMedicalData();
            fetchDropdownData();
          });
        }
      } else {
        // Add new Clinical/Medical Advice
        const response = await postRequest(`${MAS_MEDICAL_ADVICE}/create`, requestData);

        if (response && (response.status === 200 || response.status === 201)) {
          showPopup(ADD_MED_ADV_SUCC_MSG, "success", () => {
            fetchMedicalData();
            fetchDropdownData();
          });
        }
      }

      setEditingMedical(null);
      setFormData({ medicalAdviceName: "", departmentId: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving Clinical/Medical Advice data:", err);
      showPopup(FAIL_TO_SAVE_CHANGES, "error");
    } finally {
      setLoading(false);
    }
  };

  const showPopup = (message, type = 'info', onCloseCallback = null) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
        if (typeof onCloseCallback === 'function') {
          onCloseCallback();
        }
      }
    });
  };
  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, medicalAdviseId: id, newStatus });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.medicalAdviseId !== null) {
      try {
        setLoading(true);

        const response = await putRequest(
          `${MAS_MEDICAL_ADVICE}/status/${confirmDialog.medicalAdviseId}?status=${confirmDialog.newStatus}`
        );

        if (response && response.status === 200) {
          showPopup(
            `Clinical/Medical Advice ${confirmDialog.newStatus?.toLowerCase() === "y" ? "activated" : "deactivated"} successfully!`,
            "success",
            () => {
              fetchMedicalData();
            }
          );
        }
      } catch (err) {
        console.error("Error updating Clinical/Medical Advice status:", err);
        showPopup(FAIL_TO_UPDATE_STS, "error");
      } finally {
        setLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, medicalAdviseId: null, newStatus: null });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleSelectChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    setPageInput("1");
    fetchMedicalData(); // Refresh from API
    fetchDropdownData(); // Refresh dropdowns
  };

 


 
  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Clinical/Medical Advice Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm ? (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search"
                        aria-label="Search"
                        value={searchQuery}
                        onChange={handleSearchChange}
                      />
                      <span className="input-group-text" id="search-icon">
                        <i className="fa fa-search"></i>
                      </span>
                    </div>
                  </form>
                ) : (
                  <></>
                )}

                <div className="d-flex align-items-center">
                  {!showForm ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={() => {
                          setEditingMedical(null);
                          setFormData({ medicalAdviceName: "", departmentId: "" });
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
                          <th>Clinical/Medical Advice</th>
                          <th>Department</th>
                          <th>Status</th>
                          {/* <th>Last Updated By</th> */}
                          <th>Last Updated</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((treatment) => (
                            <tr key={treatment.id}>
                              <td>{treatment.medicalAdviceName || "N/A"}</td>
                              <td>{treatment.department}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={treatment.status.toLowerCase() === "y"}
                                    onChange={() => handleSwitchChange(treatment.id, treatment.status.toLowerCase() === "y" ? "n" : "y")}
                                    id={`switch-${treatment.id}`}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${treatment.id}`}
                                  >
                                    {treatment.status?.toLowerCase() === "y" ? 'Active' : 'Inactive'}
                                  </label>
                                </div>
                              </td>
                              {/* <td>{treatment.lastUpdatedBy}</td> */}
                              <td>{treatment.lastUpdated}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(treatment)}
                                  disabled={treatment.status?.toLowerCase() !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center">No Clinical/Medical Advice data found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    {filteredMedicalData.length > 0 && (
                    <Pagination
                      totalItems={filteredMedicalData.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                  </div>

                
                </>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="form-group col-md-6">
                    <label>Clinical/Medical Advice <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control mt-1"
                      id="medicalAdviceName"
                      name="medicalAdviceName"
                      placeholder="Enter Clinical/Medical Advice"
                      value={formData.medicalAdviceName}
                      onChange={handleInputChange}
                      maxLength={MEDICAL_ADVICE_MAX_LENGTH}
                      rows="3"
                      required
                      disabled={loading}
                    />
                    {/* <small className="text-muted">
                      {formData.medicalAdviceName.length}/{MEDICAL_ADVICE_MAX_LENGTH} characters
                    </small> */}
                  </div>

                  <div className="form-group col-md-6">
                    <label>Department</label>
                    <select
                      className="form-select mt-1"
                      id="departmentId"
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleSelectChange}
                      disabled={loading || departmentOptions.length === 0}
                    >
                      <option value="">Select Department</option>
                      {departmentOptions.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                    {/* <small className="text-muted">Select department for this Clinical/Medical Advice</small> */}
                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid || loading}
                    >
                      {loading ? "Saving..." : (editingMedical ? 'Update' : 'Save')}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => setShowForm(false)}
                      disabled={loading}
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
                        <button
                          type="button"
                          className="btn-close"
                          onClick={() => handleConfirm(false)}
                          aria-label="Close"
                          disabled={loading}
                        ></button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to {confirmDialog.newStatus?.toLowerCase() === "y" ? 'activate' : 'deactivate'}
                          <strong> {medicalData.find(treatment => treatment.id === confirmDialog.medicalAdviseId)?.medicalAdviceName}</strong> Clinical/Medical Advice?
                        </p>
                        {/* <p className="text-muted">
                          {confirmDialog.newStatus?.toLowerCase() === "y" 
                            ? "This will make the Clinical/Medical Advice available for selection." 
                            : "This will hide the Clinical/Medical Advice from selection."}
                        </p> */}
                      </div>
                      <div className="modal-footer">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleConfirm(false)}
                          disabled={loading}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleConfirm(true)}
                          disabled={loading}
                        >
                          {loading ? "Processing..." : "Confirm"}
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

export default MedicalAdviceMaster;

