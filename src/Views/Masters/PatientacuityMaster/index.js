import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_PATIENT_ACUITY } from "../../../config/apiConfig";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import { ADD_PATIENT_ACUITY_SUCC_MSG, DUPLICATE_PATIENT_ACUITY, FAIL_TO_SAVE_CHANGES, FAIL_TO_UPDATE_STS, FETCH_PATIENT_ACUITY_ERR_MSG, INVALID_PAGE_NO_WARN_MSG, UPDATE_PATIENT_ACUITY_SUCC_MSG } from "../../../config/constants";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const PatientacuityMaster = () => {
  const [data, setData] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    id: null, 
    newStatus: "",
    acuityName: ""
  });
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    acuityCode: "",
    acuityName: "",
    description: ""
  });
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");
  const itemsPerPage = 5;

  const ACUITY_CODE_MAX_LENGTH = 10;
  const ACUITY_NAME_MAX_LENGTH = 100;

  // Function to format date as dd/MM/YYYY
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

  // Fetch acuity data
  const fetchData = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_PATIENT_ACUITY}/getAll/${flag}`);
      if (response && response.response) {
        const mappedData = response.response.map(item => ({
          id: item.acuityCode,
          acuityCode: item.acuityCode,
          acuityName: item.acuityName,
          description: item.description,
          status: item.status,
          lastUpdated: formatDate(item.lastUpdateDate),
          createdBy: item.createdBy,
          lastUpdatedBy: item.lastUpdatedBy
        }));
        setData(mappedData);
      }
    } catch (err) {
      console.error("Error fetching patient acuity data:", err);
      showPopup(FETCH_PATIENT_ACUITY_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchData(0);
  }, []);

  // Search Filter
  const filteredData = data.filter(
    (item) =>
      item.acuityCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.acuityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

   const indexOfLastItem = currentPage * itemsPerPage;
   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
   const currentItems = filteredData.slice(
    indexOfFirstItem,
    indexOfLastItem
);

  // Search
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Form Input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);

    // Validate form
    setIsFormValid(
      newFormData.acuityCode.trim() !== "" &&
      newFormData.acuityName.trim() !== ""
    );
  };

  // Save (Add / Update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);

      // Check for duplicates
      const isDuplicate = data.some(
        (item) =>
          item.acuityCode.toLowerCase() === formData.acuityCode.toLowerCase() &&
          (!editingRecord || editingRecord.id !== item.id)
      );

      if (isDuplicate) {
        showPopup(DUPLICATE_PATIENT_ACUITY, "error");
        setLoading(false);
        return;
      }

      // Prepare request data
      const requestData = {
        acuityCode: formData.acuityCode,
        acuityName: formData.acuityName,
        description: formData.description || ""
      };

      if (editingRecord) {
        // Update acuity - note: using acuityCode as ID in the API
        const response = await putRequest(`${MAS_PATIENT_ACUITY}/update/${editingRecord.acuityCode}`, requestData);

        if (response && response.status === 200) {
          fetchData();
          showPopup(UPDATE_PATIENT_ACUITY_SUCC_MSG ,"success");
        }
      } else {
        // Add new acuity
        const response = await postRequest(`${MAS_PATIENT_ACUITY}/create`, requestData);

        if (response && (response.status === 200 || response.status === 201)) {
          fetchData();
          showPopup(ADD_PATIENT_ACUITY_SUCC_MSG, "success");
        }
      }

      setEditingRecord(null);
      setFormData({ acuityCode: "", acuityName: "", description: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving patient acuity:", err);
      showPopup(FAIL_TO_SAVE_CHANGES, "error");
    } finally {
      setLoading(false);
    }
  };

  // Edit
  const handleEdit = (item) => {
    setEditingRecord(item);
    setFormData({
      acuityCode: item.acuityCode || "",
      acuityName: item.acuityName || "",
      description: item.description || ""
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  // Status Change
  const handleSwitchChange = (id, newStatus, acuityName) => {
    setConfirmDialog({ 
      isOpen: true, 
      id, 
      newStatus,
      acuityName 
    });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed) {
      try {
        setLoading(true);
        // Note: API uses acuityCode as ID for status update
        const response = await putRequest(
          `${MAS_PATIENT_ACUITY}/status/${confirmDialog.id}?status=${confirmDialog.newStatus}`
        );

        if (response && response.response) {
          // Update local state with formatted date
          setData((prevData) =>
            prevData.map((item) =>
              item.acuityCode === confirmDialog.id
                ? {
                  ...item,
                  status: confirmDialog.newStatus,
                  lastUpdated: formatDate(new Date().toISOString())
                }
                : item
            )
          );

          showPopup(
            `Patient acuity ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
            "success"
          );
        }
      } catch (err) {
        console.error("Error updating patient acuity status:", err);
        showPopup(FAIL_TO_UPDATE_STS, "error");
      } finally {
        setLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "", acuityName: "" });
  };

  // Popup
  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

 
  

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    setPageInput("");
    fetchData();
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            {/* HEADER */}
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Patient Acuity Master</h4>
              
              <div className="d-flex justify-content-between align-items-center">
                {/* Search form */}
                {!showForm ? (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search acuity code or name"
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
                          setShowForm(true);
                          setEditingRecord(null);
                          setFormData({ acuityCode: "", acuityName: "", description: "" });
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
              {/* LOADING */}
              {loading ? (
                <LoadingScreen />
              ) : !showForm ? (
                <>
                  {/* TABLE */}
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Acuity Code</th>
                          <th>Acuity Name</th>
                          <th>Description</th>
                          <th>Status</th>
                          <th>Last Updated</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((item) => (
                            <tr key={item.acuityCode}>
                              <td>{item.acuityCode}</td>
                              <td>{item.acuityName}</td>
                              <td>{item.description || "N/A"}</td>
                              
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={item.status === "y"}
                                    onChange={() =>
                                      handleSwitchChange(
                                        item.acuityCode, 
                                        item.status === "y" ? "n" : "y",
                                        item.acuityName
                                      )
                                    }
                                    id={`switch-${item.acuityCode}`}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${item.acuityCode}`}
                                  >
                                    {item.status === "y" ? 'Active' : 'Inactive'}
                                  </label>
                                </div>
                              </td>
                              
                              <td>{item.lastUpdated}</td>
                              
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
                            <td colSpan="6" className="text-center">
                              No patient acuity found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* PAGINATION */}
          
                    <Pagination
                      totalItems={filteredData.length}
                      itemsPerPage={itemsPerPage}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                
                </>
              ) : (
                // FORM
                <form className="forms row" onSubmit={handleSave}>
                  <div className="form-group col-md-4">
                    <label>Acuity Code <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      name="acuityCode"
                      placeholder="Enter acuity code"
                      value={formData.acuityCode}
                      maxLength={ACUITY_CODE_MAX_LENGTH}
                      onChange={handleInputChange}
                      required
                      disabled={!!editingRecord}
                    />
                  </div>
                  
                  <div className="form-group col-md-4">
                    <label>Acuity Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      name="acuityName"
                      placeholder="Enter acuity name"
                      value={formData.acuityName}
                      maxLength={ACUITY_NAME_MAX_LENGTH}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group col-md-12 mt-3">
                    <label>Description</label>
                    <textarea
                      className="form-control mt-1"
                      name="description"
                      rows="2"
                      placeholder="Enter description"
                      value={formData.description}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                  
                  <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                    <button 
                      type="submit" 
                      className="btn btn-primary me-2" 
                      disabled={!isFormValid || loading}
                    >
                      {loading ? "Saving..." : (editingRecord ? 'Update' : 'Save')}
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
              
              {/* POPUP */}
              {popupMessage && (
                <Popup
                  message={popupMessage.message}
                  type={popupMessage.type}
                  onClose={popupMessage.onClose}
                />
              )}
              
              {/* CONFIRM DIALOG */}
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
                          <strong> {confirmDialog.acuityName}</strong>?
                        </p>
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

export default PatientacuityMaster;