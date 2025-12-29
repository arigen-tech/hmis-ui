import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_TREATMENT_ADVISE, MAS_DEPARTMENT } from "../../../config/apiConfig";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import { ADD_TREAT_ADV_SUCC_MSG, DUPLICATE_TREAT_ADV, FAIL_TO_SAVE_CHANGES, FAIL_TO_UPDATE_STS, FETCH_DEPARTMENT_ERR_MSG, FETCH_TREAT_ADV_ERR_MSG, INVALID_PAGE_NO_WARN_MSG, UPDATE_TREAT_ADV_SUCC_MSG } from "../../../config/constants";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination"


const TreatmentAdviceMaster = () => {
  const [treatmentData, setTreatmentData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    treatmentAdviseId: null,
    newStatus: false
  });

  const [formData, setFormData] = useState({
    treatmentAdvice: "",
    departmentId: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");

  // Dropdown options
  const [departmentOptions, setDepartmentOptions] = useState([]);

  const TREATMENT_ADVICE_MAX_LENGTH = 500;

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
      // Fetch departments (active only, flag=1)
      const departmentResponse = await getRequest(`${MAS_DEPARTMENT}/getAll/1`);
      if (departmentResponse && departmentResponse.response) {
        setDepartmentOptions(departmentResponse.response.map(dept => ({
          id: dept.id,
          name: dept.departmentName,
          code: dept.departmentCode,
          deptType: dept.departmentTypeName
        })));
      }
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
      showPopup(FETCH_DEPARTMENT_ERR_MSG, "error");
    }
  };

  // Fetch treatment advice data
  const fetchTreatmentData = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_TREATMENT_ADVISE}/getAll/${flag}`);
      if (response && response.response) {
        const mappedData = response.response.map(item => ({
          id: item.treatmentAdviseId,
          treatmentAdvice: item.treatmentAdvice,
          department: item.departmentName,
          departmentId: item.departmentId,
          status: item.status,
          lastUpdated: formatDate(item.lastUpdateDate),
          createdBy: item.createdBy || "",
          lastUpdatedBy: item.lastUpdatedBy || ""
        }));
        setTreatmentData(mappedData);
      }
    } catch (err) {
      console.error("Error fetching treatment advice data:", err);
      showPopup(FETCH_TREAT_ADV_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchTreatmentData(0);
    fetchDropdownData();
  }, []);

  // Filter data based on search query
  const filteredTreatmentData = treatmentData.filter(treatment =>
    treatment.treatmentAdvice?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
      const { treatmentAdvice, departmentId } = formData;
      return (
        treatmentAdvice.trim() !== "" &&
        departmentId.trim() !== ""
      );
    };
    setIsFormValid(validateForm());
  }, [formData]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleEdit = (treatment) => {
    setEditingTreatment(treatment);
    setFormData({
      treatmentAdvice: treatment.treatmentAdvice || "",
      departmentId: treatment.departmentId?.toString() || "",
    });
    setShowForm(true);
  };

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE
  const currentItems = filteredTreatmentData.slice(indexOfFirst, indexOfLast)

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);

      // Check for duplicates (treatment advice should be unique within same department)
      const isDuplicate = treatmentData.some(
        (treatment) =>
          treatment.treatmentAdvice.toLowerCase() === formData.treatmentAdvice.toLowerCase() &&
          treatment.departmentId?.toString() === formData.departmentId &&
          (!editingTreatment || editingTreatment.id !== treatment.id)
      );

      if (isDuplicate) {
        showPopup(DUPLICATE_TREAT_ADV, "error");
        setLoading(false);
        return;
      }

      // Prepare request data
      const requestData = {
        treatmentAdvice: formData.treatmentAdvice,
        departmentId: parseInt(formData.departmentId)
      };

      if (editingTreatment) {
        // Update existing treatment advice
        const response = await putRequest(`${MAS_TREATMENT_ADVISE}/update/${editingTreatment.id}`, requestData);

        if (response && response.status === 200) {
          fetchTreatmentData();
          showPopup(UPDATE_TREAT_ADV_SUCC_MSG, "success");
        }
      } else {
        // Add new treatment advice
        const response = await postRequest(`${MAS_TREATMENT_ADVISE}/create`, requestData);

        if (response && (response.status === 200 || response.status === 201)) {
          fetchTreatmentData();
          showPopup(ADD_TREAT_ADV_SUCC_MSG, "success");
        }
      }

      setEditingTreatment(null);
      setFormData({ treatmentAdvice: "", departmentId: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving treatment advice data:", err);
      showPopup(FAIL_TO_SAVE_CHANGES, "error");
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
    setConfirmDialog({ isOpen: true, treatmentAdviseId: id, newStatus });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.treatmentAdviseId !== null) {
      try {
        setLoading(true);

        const response = await putRequest(
          `${MAS_TREATMENT_ADVISE}/status/${confirmDialog.treatmentAdviseId}?status=${confirmDialog.newStatus}`
        );

        if (response && response.response) {
          // Update local state with formatted date
          setTreatmentData((prevData) =>
            prevData.map((treatment) =>
              treatment.id === confirmDialog.treatmentAdviseId
                ? {
                  ...treatment,
                  status: confirmDialog.newStatus,
                  lastUpdated: formatDate(new Date().toISOString())
                }
                : treatment
            )
          );
          showPopup(`Treatment advice ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`, "success");
        }
      } catch (err) {
        console.error("Error updating treatment advice status:", err);
        showPopup(FAIL_TO_UPDATE_STS, "error");
      } finally {
        setLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, treatmentAdviseId: null, newStatus: null });
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
    fetchTreatmentData(); // Refresh from API
    fetchDropdownData(); // Refresh dropdowns
  };

 


 
  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Treatment Advice Master</h4>
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
                          setEditingTreatment(null);
                          setFormData({ treatmentAdvice: "", departmentId: "" });
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
                          <th>Treatment Advice</th>
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
                              <td>{treatment.treatmentAdvice || "N/A"}</td>
                              <td>{treatment.department}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={treatment.status === "y"}
                                    onChange={() => handleSwitchChange(treatment.id, treatment.status === "y" ? "n" : "y")}
                                    id={`switch-${treatment.id}`}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${treatment.id}`}
                                  >
                                    {treatment.status === "y" ? 'Active' : 'Inactive'}
                                  </label>
                                </div>
                              </td>
                              {/* <td>{treatment.lastUpdatedBy}</td> */}
                              <td>{treatment.lastUpdated}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(treatment)}
                                  disabled={treatment.status !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center">No treatment advice data found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    {filteredTreatmentData.length > 0 && (
                    <Pagination
                      totalItems={filteredTreatmentData.length}
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
                    <label>Treatment Advice <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control mt-1"
                      id="treatmentAdvice"
                      name="treatmentAdvice"
                      placeholder="Enter treatment advice"
                      value={formData.treatmentAdvice}
                      onChange={handleInputChange}
                      maxLength={TREATMENT_ADVICE_MAX_LENGTH}
                      rows="3"
                      required
                      disabled={loading}
                    />
                    {/* <small className="text-muted">
                      {formData.treatmentAdvice.length}/{TREATMENT_ADVICE_MAX_LENGTH} characters
                    </small> */}
                  </div>

                  <div className="form-group col-md-6">
                    <label>Department <span className="text-danger">*</span></label>
                    <select
                      className="form-select mt-1"
                      id="departmentId"
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleSelectChange}
                      required
                      disabled={loading || departmentOptions.length === 0}
                    >
                      <option value="">Select Department</option>
                      {departmentOptions.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                    {/* <small className="text-muted">Select department for this treatment advice</small> */}
                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid || loading}
                    >
                      {loading ? "Saving..." : (editingTreatment ? 'Update' : 'Save')}
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
                          Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'}
                          <strong> {treatmentData.find(treatment => treatment.id === confirmDialog.treatmentAdviseId)?.treatmentAdvice}</strong> treatment advice?
                        </p>
                        {/* <p className="text-muted">
                          {confirmDialog.newStatus === "y" 
                            ? "This will make the treatment advice available for selection." 
                            : "This will hide the treatment advice from selection."}
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

export default TreatmentAdviceMaster;