import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_MEAL_TYPE } from "../../../config/apiConfig";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";

const MealTypeMaster = () => {
  const [mealTypeData, setMealTypeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    mealTypeId: null,
    newStatus: false
  });

  const [formData, setFormData] = useState({
    mealTypeName: "",
    sequenceNo: ""
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingMealType, setEditingMealType] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [pageInput, setPageInput] = useState("1");

  const MEAL_TYPE_NAME_MAX_LENGTH = 50;

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

  // Fetch meal type data
  const fetchMealTypeData = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_MEAL_TYPE}/getAll/${flag}`);
      if (response && response.response) {
        const mappedData = response.response.map(item => ({
          id: item.mealTypeId,
          mealTypeName: item.mealTypeName || "",
          sequenceNo: item.sequenceNo || "",
          status: item.status,
          lastUpdatedDate: formatDate(item.lastUpdateDate),
        }));
        setMealTypeData(mappedData);
      }
    } catch (err) {
      console.error("Error fetching meal type data:", err);
      showPopup("Failed to load meal type data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchMealTypeData(0);
  }, []);

  // Validate form whenever formData changes
  useEffect(() => {
    const validateForm = () => {
      const { mealTypeName, sequenceNo } = formData;

      // Validate meal type name - should not be empty
      const isMealTypeNameValid = mealTypeName.trim() !== "";

      // Validate sequence number - should be a valid positive integer greater than 0
      const isSequenceNoValid =
        sequenceNo.trim() !== "" &&
        !isNaN(sequenceNo) &&
        parseInt(sequenceNo) > 0;

      return isMealTypeNameValid && isSequenceNoValid;
    };

    setIsFormValid(validateForm());
  }, [formData]);

  // Filter data based on search query
  const filteredMealTypeData = mealTypeData.filter(mealType =>
    mealType.mealTypeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mealType.sequenceNo?.toString().includes(searchQuery) ||
    (mealType.status === "y" ? "active" : "inactive").includes(searchQuery.toLowerCase())
  );

  // Calculate pagination values
  const totalPages = Math.ceil(filteredMealTypeData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMealTypeData.slice(indexOfFirstItem, indexOfLastItem);

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

  const handleEdit = (mealType) => {
    setEditingMealType(mealType);
    setFormData({
      mealTypeName: mealType.mealTypeName || "",
      sequenceNo: mealType.sequenceNo?.toString() || ""
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);

      // Check for duplicates
      const isDuplicate = mealTypeData.some(
        (mealType) =>
          mealType.mealTypeName.toLowerCase() === formData.mealTypeName.toLowerCase() &&
          (!editingMealType || editingMealType.id !== mealType.id)
      );

      if (isDuplicate) {
        showPopup("Meal type already exists!", "error");
        setLoading(false);
        return;
      }

      // Prepare request data
      const requestData = {
        mealTypeName: formData.mealTypeName,
        sequenceNo: parseInt(formData.sequenceNo)
      };

      if (editingMealType) {
        // Update existing meal type
        const response = await putRequest(`${MAS_MEAL_TYPE}/update/${editingMealType.id}`, requestData);

        if (response && response.status === 200) {
          fetchMealTypeData();
          showPopup("Meal type updated successfully!", "success");
        }
      } else {
        // Add new meal type
        const response = await postRequest(`${MAS_MEAL_TYPE}/create`, requestData);

        if (response && response.status === 200) {
          fetchMealTypeData();
          showPopup("New meal type added successfully!", "success");
        }
      }

      setEditingMealType(null);
      setFormData({ mealTypeName: "", sequenceNo: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving meal type data:", err);
      showPopup(`Failed to save changes: ${err.response?.data?.message || err.message}`, "error");
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
    setConfirmDialog({ isOpen: true, mealTypeId: id, newStatus });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.mealTypeId !== null) {
      try {
        setLoading(true);

        const response = await putRequest(
          `${MAS_MEAL_TYPE}/status/${confirmDialog.mealTypeId}?status=${confirmDialog.newStatus}`
        );

        if (response && response.response) {
          // Update local state with formatted date
          setMealTypeData((prevData) =>
            prevData.map((mealType) =>
              mealType.id === confirmDialog.mealTypeId
                ? {
                  ...mealType,
                  status: confirmDialog.newStatus,
                  lastUpdatedDate: formatDate(new Date().toISOString())
                }
                : mealType
            )
          );
          showPopup(`Meal type ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`, "success");
        }
      } catch (err) {
        console.error("Error updating meal type status:", err);
        showPopup(`Failed to update status: ${err.response?.data?.message || err.message}`, "error");
      } finally {
        setLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, mealTypeId: null, newStatus: null });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    setPageInput("1");
    fetchMealTypeData(); // Refresh from API
  };

  const handlePageNavigation = () => {
    const pageNumber = parseInt(pageInput);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    } else {
      showPopup(`Please enter a valid page number between 1 and ${totalPages}`, "error");
      setPageInput(currentPage.toString());
    }
  };

  const handlePageInputChange = (e) => {
    setPageInput(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handlePageNavigation();
    }
  };

  const renderPagination = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) {
        pageNumbers.push("ellipsis-left");
      }
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    // Add last page and ellipsis if needed
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
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Meal Type Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm ? (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search meal types..."
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
                          setEditingMealType(null);
                          setFormData({ mealTypeName: "", sequenceNo: "" });
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
                          <th>Meal Type Name</th>
                          <th>Sequence No</th>
                          <th>Last Updated Date</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((mealType) => (
                            <tr key={mealType.id}>
                              <td>{mealType.mealTypeName}</td>
                              <td>{mealType.sequenceNo}</td>
                              <td>{mealType.lastUpdatedDate}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={mealType.status === "y"}
                                    onChange={() => handleSwitchChange(mealType.id, mealType.status === "y" ? "n" : "y")}
                                    id={`switch-${mealType.id}`}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${mealType.id}`}
                                  >
                                    {mealType.status === "y" ? 'Active' : 'Inactive'}
                                  </label>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(mealType)}
                                  disabled={mealType.status !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center">No meal type data found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {filteredMealTypeData.length > 0 && (
                    <nav className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        <span className="text-muted">
                          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredMealTypeData.length)} of {filteredMealTypeData.length} entries
                        </span>
                      </div>

                      <ul className="pagination mb-0">
                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                          <button
                            className="page-link"
                            onClick={() => {
                              if (currentPage > 1) {
                                setCurrentPage(currentPage - 1);
                              }
                            }}
                            disabled={currentPage === 1}
                          >
                            &laquo; Previous
                          </button>
                        </li>

                        {renderPagination()}

                        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                          <button
                            className="page-link"
                            onClick={() => {
                              if (currentPage < totalPages) {
                                setCurrentPage(currentPage + 1);
                              }
                            }}
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
                        <button
                          className="btn btn-primary"
                          onClick={handlePageNavigation}
                        >
                          Go
                        </button>
                      </div>
                    </nav>
                  )}
                </>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="col-md-12">
                    <div className="row">
                      <div className="form-group col-md-4">
                        <label>Meal Type Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control mt-1"
                          id="mealTypeName"
                          name="mealTypeName"
                          placeholder="Enter meal type name"
                          value={formData.mealTypeName}
                          onChange={handleInputChange}
                          maxLength={MEAL_TYPE_NAME_MAX_LENGTH}
                          required
                          disabled={loading}
                        />
                      </div>
                      <div className="form-group col-md-4">
                        <label>Sequence No <span className="text-danger">*</span></label>
                        <input
                          type="number"
                          className="form-control mt-1"
                          id="sequenceNo"
                          name="sequenceNo"
                          placeholder="Enter sequence number"
                          value={formData.sequenceNo}
                          onChange={handleInputChange}
                          min="1"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid || loading}
                    >
                      {loading ? "Saving..." : (editingMealType ? 'Update' : 'Save')}
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
                          <strong> {mealTypeData.find(mealType => mealType.id === confirmDialog.mealTypeId)?.mealTypeName}</strong> meal type?
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

export default MealTypeMaster;