import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_DIET_TYPE } from "../../../config/apiConfig";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import { ADD_DIET_TYPE_SUCC_MSG, DUPLICATE_DIET_TYPE, FAIL_TO_SAVE_CHANGES, FAIL_TO_UPDATE_STS, FETCH_DIET_TYPE_ERR_MSG, INVALID_PAGE_NO_WARN_MSG, UPDATE_DIET_TYPE_SUCC_MSG } from "../../../config/constants";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const DietTypeMaster = () => {
  const [dietTypeData, setDietTypeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    dietTypeId: null,
    newStatus: false
  });

  const [formData, setFormData] = useState({
    dietTypeName: "",
    description: ""
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingDietType, setEditingDietType] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [pageInput, setPageInput] = useState("1");

  const DIET_TYPE_NAME_MAX_LENGTH = 100;
  const DESCRIPTION_MAX_LENGTH = 200;

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

  // Fetch diet type data
  const fetchDietTypeData = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_DIET_TYPE}/getAll/${flag}`);
      if (response && response.response) {
        const mappedData = response.response.map(item => ({
          id: item.dietTypeId,
          dietTypeName: item.dietTypeName || "",
          description: item.description || "",
          status: item.status,
          lastUpdatedDate: formatDate(item.lastUpdateDate)
        }));
        setDietTypeData(mappedData);
      }
    } catch (err) {
      console.error("Error fetching diet type data:", err);
      showPopup(FETCH_DIET_TYPE_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchDietTypeData(0);
  }, []);

  // Validate form whenever formData changes
  useEffect(() => {
    const validateForm = () => {
      const { dietTypeName, description } = formData;
      return dietTypeName.trim() !== "" && description.trim() !== "";
    };
    setIsFormValid(validateForm());
  }, [formData]);

  // Filter data based on search query
  const filteredDietTypeData = dietTypeData.filter(dietType =>
    dietType.dietTypeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dietType.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (dietType.status === "y" ? "active" : "inactive").includes(searchQuery.toLowerCase())
  );

  // Calculate pagination values
  const totalPages = Math.ceil(filteredDietTypeData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDietTypeData.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
    setPageInput("1");
  }, [searchQuery]);

  // Update page input when current page changes
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleEdit = (dietType) => {
    setEditingDietType(dietType);
    setFormData({
      dietTypeName: dietType.dietTypeName || "",
      description: dietType.description || ""
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);

      // Check for duplicates
      const isDuplicate = dietTypeData.some(
        (dietType) =>
          dietType.dietTypeName.toLowerCase() === formData.dietTypeName.toLowerCase() &&
          (!editingDietType || editingDietType.id !== dietType.id)
      );

      if (isDuplicate) {
        showPopup(DUPLICATE_DIET_TYPE, "error");
        setLoading(false);
        return;
      }

      // Prepare request data
      const requestData = {
        dietTypeName: formData.dietTypeName,
        description: formData.description
      };

      if (editingDietType) {
        // Update existing diet type
        const response = await putRequest(`${MAS_DIET_TYPE}/update/${editingDietType.id}`, requestData);

        if (response && response.status === 200) {
          fetchDietTypeData();
          showPopup(UPDATE_DIET_TYPE_SUCC_MSG, "success");
        }
      } else {
        // Add new diet type
        const response = await postRequest(`${MAS_DIET_TYPE}/create`, requestData);

        if (response && response.status === 200) {
          fetchDietTypeData();
          showPopup(ADD_DIET_TYPE_SUCC_MSG, "success");
        }
      }

      setEditingDietType(null);
      setFormData({ dietTypeName: "", description: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving diet type data:", err);
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
    setConfirmDialog({ isOpen: true, dietTypeId: id, newStatus });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.dietTypeId !== null) {
      try {
        setLoading(true);

        const response = await putRequest(
          `${MAS_DIET_TYPE}/status/${confirmDialog.dietTypeId}?status=${confirmDialog.newStatus}`
        );

        if (response && response.response) {
          // Update local state with formatted date
          setDietTypeData((prevData) =>
            prevData.map((dietType) =>
              dietType.id === confirmDialog.dietTypeId
                ? {
                  ...dietType,
                  status: confirmDialog.newStatus,
                  lastUpdatedDate: formatDate(new Date().toISOString())
                }
                : dietType
            )
          );
          showPopup(`Diet type ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`, "success");
        }
      } catch (err) {
        console.error("Error updating diet type status:", err);
        showPopup(FAIL_TO_UPDATE_STS, "error");
      } finally {
        setLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, dietTypeId: null, newStatus: null });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    setPageInput("1");
    fetchDietTypeData(); // Refresh from API
  };


  const handlePageInputChange = (e) => {
    setPageInput(e.target.value);
  };


  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Diet Type Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm ? (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search diet types..."
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
                          setEditingDietType(null);
                          setFormData({ dietTypeName: "", description: "" });
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
                          <th>Diet Type Name</th>
                          <th>Description</th>
                          <th>Last Updated Date</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((dietType) => (
                            <tr key={dietType.id}>
                              <td>{dietType.dietTypeName}</td>
                              <td>{dietType.description}</td>
                              <td>{dietType.lastUpdatedDate}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={dietType.status === "y"}
                                    onChange={() => handleSwitchChange(dietType.id, dietType.status === "y" ? "n" : "y")}
                                    id={`switch-${dietType.id}`}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${dietType.id}`}
                                  >
                                    {dietType.status === "y" ? 'Active' : 'Inactive'}
                                  </label>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(dietType)}
                                  disabled={dietType.status !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center">No diet type data found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <Pagination
                    totalItems={filteredDietTypeData.length}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                  />
                </>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="col-md-12">
                    <div className="row">
                      <div className="form-group col-md-4">
                        <label>Diet Type Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control mt-1"
                          id="dietTypeName"
                          name="dietTypeName"
                          placeholder="Enter diet type name"
                          value={formData.dietTypeName}
                          onChange={handleInputChange}
                          maxLength={DIET_TYPE_NAME_MAX_LENGTH}
                          required
                          disabled={loading}
                        />
                      </div>
                      <div className="form-group col-md-8">
                        <label>Description <span className="text-danger">*</span></label>
                        <textarea
                          className="form-control mt-1"
                          id="description"
                          name="description"
                          placeholder="Enter diet type description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows="4"
                          maxLength={DESCRIPTION_MAX_LENGTH}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid || loading}
                    >
                      {loading ? "Saving..." : (editingDietType ? "Update" : "Save")}
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
                          <strong> {dietTypeData.find(dietType => dietType.id === confirmDialog.dietTypeId)?.dietTypeName}</strong> diet type?
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

export default DietTypeMaster;