
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_BLOOD_COMPATIBILITY, MAS_BLOOD_COMPONENT, MAS_BLOODGROUP } from "../../../config/apiConfig";
import { getRequest, postRequest, putRequest } from "../../../service/apiService";
import { FETCH_BLOOD_COMPATIBILITY, UPDATE_BLOOD_COMPATIBILITY, ADD_BLOOD_COMPATIBILITY, FAIL_BLOOD_COMPATIBILITY, DUPLICATE_BLOOD_COMPATIBILITY, FAIL_TO_UPDATE_STS, INVALID_PAGE_NO_WARN_MSG,FAIL_LOAD_COMPONENTS,BLOOD_GROUP_DATA,FAIL_BLOOD_GROUP} from "../../../config/constants";



const BloodCompatibilityMaster = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [componentOptions, setComponentOptions] = useState([]);
  const [bloodGroupOptions, setBloodGroupOptions] = useState([]); 
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");


  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const itemsPerPage = 5;

  const [formData, setFormData] = useState({
    componentId: "",
    patientBloodGroupId: "",
    donorBloodGroupId: "",
    isPreferred: "N",
  });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date)) return "N/A";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };


  const showPopup = (message, type = "info") => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };



  const fetchData = async (flag = 0) => {
    try {
      setLoading(true);
      const { response } = await getRequest(`${MAS_BLOOD_COMPATIBILITY}/getAll/${flag}`);
      setData(response || []);
    } catch {
      showPopup(FETCH_BLOOD_COMPATIBILITY, "error");
    } finally {
      setLoading(false);
    }
  };

  

  const fetchComponentOptions = async (flag = 0) => {
    try {
      const response = await getRequest(`${MAS_BLOOD_COMPONENT}/getAll/${flag}`);
      if (response && response.response) {
        const options = response.response.map((item) => ({
          id: item.componentId || item.id,
          name: (item.componentName || item.name).trim(),
        }));
        setComponentOptions(options);
      }
    } catch (error) {
      console.error("Error fetching components:", error);
      showPopup(FAIL_LOAD_COMPONENTS, "error");
    }
  };



const fetchBloodGroupOptions = async (flag = 0) => {
  try {
    const response = await getRequest(`${MAS_BLOODGROUP}/getAll/${flag}`);
    console.log("API Response:", response); // Debug
    
    if (response && response.response && Array.isArray(response.response)) {
      const options = response.response.map((item) => ({
        bloodGroupId: item.bloodGroupId,                
        bloodName: item.bloodGroupName.trim(),           
      }));
      
      setBloodGroupOptions(options);
    } else {
      console.error("Unexpected response structure:", response);
      showPopup(BLOOD_GROUP_DATA, "error");
    }
  } catch (error) {
    console.error("Error fetching blood groups:", error);
    showPopup(FAIL_BLOOD_GROUP, "error");
  }
};



  useEffect(() => {
    fetchData();
    fetchComponentOptions(0);
    fetchBloodGroupOptions(0); 
  }, []);



  // Filtered data based on search
  const filteredData = data.filter(
    (rec) =>
      (rec.componentName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (rec.patientBloodGroup?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (rec.donorBloodGroup?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  // Pagination calculations
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
    setPageInput("1");
  }, [searchQuery]);

  // Sync page input with current page
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...formData, [name]: value };
    setFormData(updatedForm);
    setIsFormValid(
      updatedForm.componentId !== "" &&
      updatedForm.patientBloodGroupId !== "" &&
      updatedForm.donorBloodGroupId !== ""
    );
  };

  const resetForm = () => {
    setFormData({
      componentId: "",
      patientBloodGroupId: "",
      donorBloodGroupId: "",
      isPreferred: "N",
    });
    setEditingRecord(null);
    setIsFormValid(false);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const isDuplicate = (form, excludeId = null) => {
    return data.some(
      (item) =>
        item.componentId === Number(form.componentId) &&
        item.patientBloodGroupId === Number(form.patientBloodGroupId) &&
        item.donorBloodGroupId === Number(form.donorBloodGroupId) &&
        (excludeId === null || item.compatibilityId !== excludeId)
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    if (isDuplicate(formData, editingRecord?.compatibilityId)) {
      showPopup(DUPLICATE_BLOOD_COMPATIBILITY, "error");
      return;
    }

    const payload = {
      componentId: Number(formData.componentId),
      patientBloodGroupId: Number(formData.patientBloodGroupId),
      donorBloodGroupId: Number(formData.donorBloodGroupId),
      isPreferred: formData.isPreferred,
    };

    try {
      setLoading(true);
      if (editingRecord) {
        await putRequest(
          `${MAS_BLOOD_COMPATIBILITY}/update/${editingRecord.compatibilityId}`,
          payload
        );
        showPopup(UPDATE_BLOOD_COMPATIBILITY, "success");
      } else {
        await postRequest(`${MAS_BLOOD_COMPATIBILITY}/create`, payload);
        showPopup(ADD_BLOOD_COMPATIBILITY, "success");
      }
      await fetchData();
      handleCancel();
    } catch {
      showPopup(FAIL_BLOOD_COMPATIBILITY, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({
      componentId: rec.componentId || "",
      patientBloodGroupId: rec.patientBloodGroupId || "",
      donorBloodGroupId: rec.donorBloodGroupId || "",
      isPreferred: rec.isPreferred || "N",
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, id, newStatus });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed) {
      try {
        setLoading(true);
        await putRequest(
          `${MAS_BLOOD_COMPATIBILITY}/status/${confirmDialog.id}?status=${confirmDialog.newStatus}`
        );
        setData((prevData) =>
          prevData.map((item) =>
            item.compatibilityId === confirmDialog.id
              ? { ...item, status: confirmDialog.newStatus, lastUpdateDate: new Date().toISOString() }
              : item
          )
        );
        showPopup(
          `Record ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
          "success"
        );
      } catch {
        showPopup(FAIL_TO_UPDATE_STS, "error");
      } finally {
        setLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "" });
  };

  // Pagination handlers
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePageNavigation = () => {
    const pageNumber = parseInt(pageInput);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    } else {
      showPopup(INVALID_PAGE_NO_WARN_MSG, "error");
      setPageInput(currentPage.toString());
    }
  };

  const handlePageInputChange = (e) => {
    setPageInput(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handlePageNavigation();
    }
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    setPageInput("1");
    fetchData();
    fetchComponentOptions(0);
    fetchBloodGroupOptions(0); // <-- also refresh blood groups
  };

  // Render page numbers with ellipsis
  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) {
        pageNumbers.push("ellipsis-left");
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

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
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Blood Compatibility Master</h4>

          <div className="d-flex">
            {!showForm && (
              <input
                type="search"
                className="form-control me-2"
                style={{ width: "220px" }}
                placeholder="Search"
                value={searchQuery}
                onChange={handleSearch}
              />
            )}

            {!showForm ? (
              <>
                <button className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                  Add
                </button>
                <button className="btn btn-success" onClick={handleRefresh}>
                  Show All
                </button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={handleCancel}>
                Back
              </button>
            )}
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <LoadingScreen />
          ) : !showForm ? (
            <>
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Component</th>
                      <th>Patient Blood Group</th>
                      <th>Donor Blood Group</th>
                      <th>Preferred</th>
                      <th>Status</th>
                      <th>Last Update</th>
                      <th>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((rec) => (
                        <tr key={rec.compatibilityId}>
                          <td>{rec.componentName}</td>
                          <td>{rec.patientBloodGroup}</td>
                          <td>{rec.donorBloodGroup}</td>
                          <td>{rec.isPreferred === "Y" ? "Yes" : "No"}</td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={rec.status === "y"}
                                onChange={() =>
                                  handleSwitchChange(rec.compatibilityId, rec.status === "y" ? "n" : "y")
                                }
                                id={`switch-${rec.compatibilityId}`}
                              />
                              <label
                                className="form-check-label px-0"
                                htmlFor={`switch-${rec.compatibilityId}`}
                              >
                                {rec.status === "y" ? "Active" : "Inactive"}
                              </label>
                            </div>
                          </td>
                          <td>{formatDate(rec.lastUpdateDate)}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleEdit(rec)}
                              disabled={rec.status !== "y"}
                            >
                              <i className="fa fa-pencil"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">
                          No records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Custom Pagination */}
              {filteredData.length > 0 && (
                <nav className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    <span className="text-muted">
                      Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filteredData.length)} of{" "}
                      {filteredData.length} entries
                    </span>
                  </div>

                  <ul className="pagination mb-0">
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                      <button
                        className="page-link"
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                      >
                        &laquo; Previous
                      </button>
                    </li>

                    {renderPageNumbers()}

                    <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                      <button
                        className="page-link"
                        onClick={handleNextPage}
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
                    <button className="btn btn-primary" onClick={handlePageNavigation}>
                      Go
                    </button>
                  </div>
                </nav>
              )}
            </>
          ) : (
            <form onSubmit={handleSave} className="row g-3">
              {/* Component dropdown */}
              <div className="col-md-4">
                <label>
                  Component <span className="text-danger">*</span>
                </label>
                <select
                  name="componentId"
                  className="form-select"
                  value={formData.componentId}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Component</option>
                  {componentOptions.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group col-md-4">
                <label>Patient Blood Group <span className="text-danger">*</span></label>
                <select
                  className="form-select mt-1"
                  name="patientBloodGroupId"
                  value={formData.patientBloodGroupId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Blood Group</option>
                  {bloodGroupOptions.map((bg) => (
                    <option key={bg.bloodGroupId} value={bg.bloodGroupId}>
                      {bg.bloodName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Donor Blood Group */}
              <div className="form-group col-md-4">
                <label>Donor Blood Group <span className="text-danger">*</span></label>
                <select
                  className="form-select mt-1"
                  name="donorBloodGroupId"
                  value={formData.donorBloodGroupId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Blood Group</option>
                  {bloodGroupOptions.map((bg) => (
                    <option key={bg.bloodGroupId} value={bg.bloodGroupId}>
                      {bg.bloodName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preferred Dropdown */}
              <div className="col-md-4">
                <label>Preferred</label>
                <select
                  name="isPreferred"
                  className="form-select"
                  value={formData.isPreferred}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="N">No</option>
                  <option value="Y">Yes</option>
                </select>
              </div>

              <div className="col-12 text-end">
                <button
                  type="submit"
                  className="btn btn-primary me-2"
                  disabled={!isFormValid || loading}
                >
                  {editingRecord ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {popupMessage && <Popup {...popupMessage} />}

          {/* Confirm Dialog for Status Change */}
          {confirmDialog.isOpen && (
            <div
              className="modal d-block"
              tabIndex="-1"
              role="dialog"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            >
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
                      Are you sure you want to{" "}
                      {confirmDialog.newStatus === "y" ? "activate" : "deactivate"} this
                      compatibility record?
                    </p>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setConfirmDialog({ isOpen: false, id: null, newStatus: "" })}
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
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BloodCompatibilityMaster;