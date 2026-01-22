import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_PROCEDURE, MAS_DEPARTMENT, MAS_PROCEDURE_TYPE } from "../../../config/apiConfig";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import { ACTIVATE_PROCEDURE_ERR_MSG, ACTIVATE_PROCEDURE_SUCC_MSG, ADD_PROCEDURE_SUCC_MSG, DUPLICATE_PROCEDURE, FAIL_TO_SAVE_CHANGES, FAIL_TO_UPDATE_STS, FETCH_PROCEDURE_ERR_MSG, FETCH_PROCEDURE_TYPE_ERR_MSG, INVALID_PAGE_NO_WARN_MSG, UPDATE_PROCEDURE_SUCC_MSG } from "../../../config/constants";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const ProcedureMaster = () => {
  const [procedureData, setProcedureData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    procedureId: null,
    newStatus: false
  });

  const [formData, setFormData] = useState({
    procedureCode: "",
    procedureName: "",
    departmentId: "",
    procedureTypeId: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [pageInput, setPageInput] = useState("1");

  // Dropdown options
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [procedureTypeOptions, setProcedureTypeOptions] = useState([]);

  const PROCEDURE_CODE_MAX_LENGTH = 8;
  const PROCEDURE_NAME_MAX_LENGTH = 30;

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
      // Fetch departments (OPD only, flag=1 for active)
      const departmentResponse = await getRequest(`${MAS_DEPARTMENT}/getAll/1`);
      if (departmentResponse && departmentResponse.response) {
        // Filter for OPD departments only
        const opdDepartments = departmentResponse.response.filter(dept =>
          dept.departmentTypeName && dept.departmentTypeName.toUpperCase() === "OPD"
        );
        setDepartmentOptions(opdDepartments.map(dept => ({
          id: dept.id,
          name: dept.departmentName,
          deptType: dept.departmentTypeName
        })));
      }

      // Fetch procedure types (active only, flag=1)
      const procedureTypeResponse = await getRequest(`${MAS_PROCEDURE_TYPE}/getAll/1`);
      if (procedureTypeResponse && procedureTypeResponse.response) {
        setProcedureTypeOptions(procedureTypeResponse.response.map(type => ({
          id: type.procedureTypeId,
          name: type.procedureTypeName
        })));
      }
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
      showPopup(FETCH_PROCEDURE_TYPE_ERR_MSG, "error");
    }
  };

  // Fetch procedure data
  const fetchProcedureData = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_PROCEDURE}/getAll/${flag}`);
      if (response && response.response) {
        const mappedData = response.response.map(item => ({
          id: item.procedureId,
          procedureCode: item.procedureCode,
          procedureName: item.procedureName,
          department: item.departmentName || "",
          departmentId: item.departmentId,
          procedureType: item.procedureTypeName || "",
          procedureTypeId: item.procedureTypeId,
          status: item.status,
          lastUpdated: formatDate(item.lastChangedDate)
        }));
        setProcedureData(mappedData);
      }
    } catch (err) {
      console.error("Error fetching procedure data:", err);
      showPopup(FETCH_PROCEDURE_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchProcedureData(0);
    fetchDropdownData();
  }, []);

  // Filter data based on search query
  const filteredProcedureData = procedureData.filter(procedure =>
    procedure.procedureCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    procedure.procedureName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    procedure.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    procedure.procedureType?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination values
  const totalPages = Math.ceil(filteredProcedureData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProcedureData.slice(indexOfFirstItem, indexOfLastItem);

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
      const { procedureCode, procedureName, departmentId, procedureTypeId } = formData;
      return (
        procedureCode.trim() !== "" &&
        procedureName.trim() !== "" &&
        departmentId.trim() !== "" &&
        procedureTypeId.trim() !== ""
      );
    };
    setIsFormValid(validateForm());
  }, [formData]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleEdit = (procedure) => {
    setEditingProcedure(procedure);
    setFormData({
      procedureCode: procedure.procedureCode || "",
      procedureName: procedure.procedureName || "",
      departmentId: procedure.departmentId?.toString() || "",
      procedureTypeId: procedure.procedureTypeId?.toString() || "",
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);

      // Check for duplicates (procedure code should be unique)
      const isDuplicate = procedureData.some(
        (procedure) =>
          procedure.procedureCode.toLowerCase() === formData.procedureCode.toLowerCase() &&
          (!editingProcedure || editingProcedure.id !== procedure.id)
      );

      if (isDuplicate) {
        showPopup(DUPLICATE_PROCEDURE, "error");
        setLoading(false);
        return;
      }

      // Prepare request data
      const requestData = {
        procedureCode: formData.procedureCode,
        procedureName: formData.procedureName,
        departmentId: parseInt(formData.departmentId),
        procedureTypeId: parseInt(formData.procedureTypeId)
      };

      if (editingProcedure) {
        // Update existing procedure
        const response = await putRequest(`${MAS_PROCEDURE}/update/${editingProcedure.id}`, requestData);

        if (response && response.status === 200) {
          fetchProcedureData();
          showPopup(UPDATE_PROCEDURE_SUCC_MSG, "success");
        }
      } else {
        // Add new procedure
        const response = await postRequest(`${MAS_PROCEDURE}/create`, requestData);

        if (response && (response.status === 200 || response.status === 201)) {
          fetchProcedureData();
          showPopup(ADD_PROCEDURE_SUCC_MSG, "success");
        }
      }

      setEditingProcedure(null);
      setFormData({ procedureCode: "", procedureName: "", departmentId: "", procedureTypeId: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving procedure data:", err);
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
    setConfirmDialog({ isOpen: true, procedureId: id, newStatus });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.procedureId !== null) {
      try {
        setLoading(true);

        const response = await putRequest(
          `${MAS_PROCEDURE}/status/${confirmDialog.procedureId}?status=${confirmDialog.newStatus}`
        );

        if (response && response.response) {
          // Update local state with formatted date
          setProcedureData((prevData) =>
            prevData.map((procedure) =>
              procedure.id === confirmDialog.procedureId
                ? {
                  ...procedure,
                  status: confirmDialog.newStatus,
                  lastUpdated: formatDate(new Date().toISOString())
                }
                : procedure
            )
          );
          showPopup(`Procedure ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`, "success");
        }
      } catch (err) {
        console.error("Error updating procedure status:", err);
        showPopup(FAIL_TO_UPDATE_STS, "error");
      } finally {
        setLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, procedureId: null, newStatus: null });
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
    fetchProcedureData(); // Refresh from API
    fetchDropdownData(); // Refresh dropdowns
  };

  

  const handlePageInputChange = (e) => {
    setPageInput(e.target.value);
  };

  
  // Handle activate for inactive records in edit mode
  const handleActivate = async () => {
    if (editingProcedure && editingProcedure.status === "n") {
      try {
        setLoading(true);

        const response = await putRequest(
          `${MAS_PROCEDURE}/status/${editingProcedure.id}?status=y`
        );

        if (response && response.response) {
          fetchProcedureData();
          showPopup(ACTIVATE_PROCEDURE_SUCC_MSG, "success");
          setEditingProcedure(null);
          setFormData({ procedureCode: "", procedureName: "", departmentId: "", procedureTypeId: "" });
          setShowForm(false);
        }
      } catch (err) {
        console.error("Error activating procedure:", err);
        showPopup(ACTIVATE_PROCEDURE_ERR_MSG, "error");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Procedure Care Master</h4>
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
                          setEditingProcedure(null);
                          setFormData({ procedureCode: "", procedureName: "", departmentId: "", procedureTypeId: "" });
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
                      {/* <button type="button" className="btn btn-success me-2">
                        <i className="mdi mdi-file-document-outline"></i> Generate Report
                      </button> */}
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
                          <th>Procedure Code</th>
                          <th>Procedure Name</th>
                          <th>Department</th>
                          <th>Procedure Type</th>
                          <th>Status</th>
                          <th>Last Updated</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((procedure) => (
                            <tr key={procedure.id}>
                              <td>{procedure.procedureCode || "N/A"}</td>
                              <td>{procedure.procedureName}</td>
                              <td>{procedure.department}</td>
                              <td>{procedure.procedureType}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={procedure.status === "y"}
                                    onChange={() => handleSwitchChange(procedure.id, procedure.status === "y" ? "n" : "y")}
                                    id={`switch-${procedure.id}`}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${procedure.id}`}
                                  >
                                    {procedure.status === "y" ? 'Active' : 'Inactive'}
                                  </label>
                                </div>
                              </td>
                              <td>{procedure.lastUpdated}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(procedure)}
                                  disabled={procedure.status !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="text-center">No procedure data found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                   {/* Pagination */}
                  <div>
                        <Pagination
                          totalItems={filteredProcedureData.length}
                          itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                          currentPage={currentPage}
                          onPageChange={setCurrentPage}
                        />
                      </div>     
                </>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="form-group col-md-4">
                    <label>Procedure Code <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="procedureCode"
                      name="procedureCode"
                      placeholder="Enter procedure code"
                      value={formData.procedureCode}
                      onChange={handleInputChange}
                      maxLength={PROCEDURE_CODE_MAX_LENGTH}
                      required
                      disabled={loading}
                    />
                    {/* <small className="text-muted">
                      {formData.procedureCode.length}/{PROCEDURE_CODE_MAX_LENGTH} characters (max)
                    </small> */}
                  </div>

                  <div className="form-group col-md-4">
                    <label>Procedure Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="procedureName"
                      name="procedureName"
                      placeholder="Enter procedure name"
                      value={formData.procedureName}
                      onChange={handleInputChange}
                      maxLength={PROCEDURE_NAME_MAX_LENGTH}
                      required
                      disabled={loading}
                    />
                    {/* <small className="text-muted">
                      {formData.procedureName.length}/{PROCEDURE_NAME_MAX_LENGTH} characters (max)
                    </small> */}
                  </div>

                  <div className="form-group col-md-4">
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
                          {dept.name} ({dept.deptType})
                        </option>
                      ))}
                    </select>
                    {/* <small className="text-muted">Select OPD department only</small> */}
                  </div>

                  <div className="form-group col-md-4 mt-3">
                    <label>Procedure Type <span className="text-danger">*</span></label>
                    <select
                      className="form-select mt-1"
                      id="procedureTypeId"
                      name="procedureTypeId"
                      value={formData.procedureTypeId}
                      onChange={handleSelectChange}
                      required
                      disabled={loading || procedureTypeOptions.length === 0}
                    >
                      <option value="">Select Procedure Type</option>
                      {procedureTypeOptions.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    {/* <small className="text-muted">Select type of procedure</small> */}
                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid || loading}
                    >
                      {loading ? "Saving..." : (editingProcedure ? 'Update' : 'Save')}
                    </button>

                    {editingProcedure && editingProcedure.status === "n" && (
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={handleActivate}
                        disabled={loading}
                      >
                        Activate
                      </button>
                    )}

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
                          <strong> {procedureData.find(procedure => procedure.id === confirmDialog.procedureId)?.procedureName}</strong> procedure?
                        </p>
                        {/* <p className="text-muted">
                          {confirmDialog.newStatus === "y" 
                            ? "This will make the procedure available for use." 
                            : "This will hide the procedure from selection."}
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

export default ProcedureMaster;