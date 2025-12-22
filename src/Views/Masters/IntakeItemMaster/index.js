import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_INTAKE_ITEM, MAS_INTAKE_TYPE } from "../../../config/apiConfig";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import { ADD_INTAKE_ITEM_SUCC_MSG, DUPLICATE_INTAKE_ITEM, FAIL_TO_SAVE_CHANGES, FAIL_TO_UPDATE_STS, FETCH_INTAKE_ITEM_ERR_MSG, FETCH_INTAKE_TYPE_ERR_MSG, INVALID_PAGE_NO_WARN_MSG, UPDATE_INTAKE_ITEM_SUCC_MSG } from "../../../config/constants";

const IntakeItemMaster = () => {
  const [data, setData] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    id: null, 
    newStatus: "",
    intakeItemName: ""
  });
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    intakeTypeId: "",
    intakeItemName: ""
  });
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const itemsPerPage = 5;

  // dropdown options
  const [intakeTypeOptions, setIntakeTypeOptions] = useState([]);

  const INTAKE_ITEM_NAME_MAX_LENGTH = 100;

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

  // Fetch dropdown data (Intake Types)
  const fetchDropdownData = async () => {
    try {
      // Fetch intake types
      const response = await getRequest(`${MAS_INTAKE_TYPE}/getAll/1`);
      if (response && response.response) {
        setIntakeTypeOptions(response.response.map(type => ({
          id: type.intakeTypeId,
          name: type.intakeTypeName
        })));
      }
    } catch (err) {
      console.error("Error fetching intake type data:", err);
      showPopup(FETCH_INTAKE_TYPE_ERR_MSG, "error");
    }
  };

  // Fetch intake item data
  const fetchData = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_INTAKE_ITEM}/getAll/${flag}`);
      if (response && response.response) {
        const mappedData = response.response.map(item => ({
          id: item.intakeItemId,
          intakeType: item.intakeTypeName || "N/A",
          intakeTypeId: item.intakeTypeId,
          intakeItemName: item.intakeItemName,
          status: item.status,
          lastUpdated: formatDate(item.lastUpdateDate)
        }));
        setData(mappedData);
      }
    } catch (err) {
      console.error("Error fetching intake item data:", err);
      showPopup(FETCH_INTAKE_ITEM_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchData(0);
    fetchDropdownData();
  }, []);

  // Search Filter
  const filteredData = data.filter(
    (item) =>
      item.intakeItemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.intakeType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
    setPageInput("1");
  }, [searchQuery]);

  // Update page input when current page changes
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // Search
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Form Input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);

    // Validate form
    setIsFormValid(
      newFormData.intakeTypeId.trim() !== "" &&
      newFormData.intakeItemName.trim() !== ""
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
          item.intakeItemName.toLowerCase() === formData.intakeItemName.toLowerCase() &&
          (!editingRecord || editingRecord.id !== item.id)
      );

      if (isDuplicate) {
        showPopup(DUPLICATE_INTAKE_ITEM, "error");
        setLoading(false);
        return;
      }

      // Prepare request data
      const requestData = {
        intakeTypeId: parseInt(formData.intakeTypeId),
        intakeItemName: formData.intakeItemName
      };

      if (editingRecord) {
        // Update intake item
        const response = await putRequest(`${MAS_INTAKE_ITEM}/update/${editingRecord.id}`, requestData);

        if (response && response.status === 200) {
          fetchData();
          showPopup(UPDATE_INTAKE_ITEM_SUCC_MSG, "success");
        }
      } else {
        // Add new intake item
        const response = await postRequest(`${MAS_INTAKE_ITEM}/create`, requestData);

        if (response && response.status === 200 || response.status === 201) {
          fetchData();
          showPopup(ADD_INTAKE_ITEM_SUCC_MSG, "success");
        }
      }

      setEditingRecord(null);
      setFormData({ intakeTypeId: "", intakeItemName: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving intake item:", err);
      showPopup(FAIL_TO_SAVE_CHANGES, "error");
    } finally {
      setLoading(false);
    }
  };

  // Edit
  const handleEdit = (item) => {
    setEditingRecord(item);
    setFormData({
      intakeTypeId: item.intakeTypeId?.toString() || "",
      intakeItemName: item.intakeItemName || ""
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  // Status Change
  const handleSwitchChange = (id, newStatus, intakeItemName) => {
    setConfirmDialog({ 
      isOpen: true, 
      id, 
      newStatus,
      intakeItemName 
    });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed) {
      try {
        setLoading(true);
        const response = await putRequest(
          `${MAS_INTAKE_ITEM}/status/${confirmDialog.id}?status=${confirmDialog.newStatus}`
        );

        if (response && response.response) {
          // Update local state with formatted date
          setData((prevData) =>
            prevData.map((item) =>
              item.id === confirmDialog.id
                ? {
                  ...item,
                  status: confirmDialog.newStatus,
                  lastUpdated: formatDate(new Date().toISOString())
                }
                : item
            )
          );

          showPopup(
            `Intake item ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
            "success"
          );
        }
      } catch (err) {
        console.error("Error updating intake item status:", err);
        showPopup(FAIL_TO_UPDATE_STS, "error");
      } finally {
        setLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "", intakeItemName: "" });
  };

  // Popup
  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  // Page navigation handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Go to page functionality
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
    if (e.key === 'Enter') {
      handlePageNavigation();
    }
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    setPageInput("1");
    fetchData();
    fetchDropdownData();
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

    // First page and ellipsis
    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) {
        pageNumbers.push("ellipsis-left");
      }
    }

    // Visible pages
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    // Last page and ellipsis
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
            {/* HEADER */}
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Intake Item Master</h4>
              
              <div className="d-flex justify-content-between align-items-center">
                {/* Search form */}
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
                          setShowForm(true);
                          setEditingRecord(null);
                          setFormData({ intakeTypeId: "", intakeItemName: "" });
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
                          <th>Intake Item Name</th>
                          <th>Intake Type</th>
                          <th>Status</th>
                          <th>Last Updated</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((item) => (
                            <tr key={item.id}>
                              <td>{item.intakeItemName}</td>
                              <td>{item.intakeType}</td>
                              
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={item.status === "y"}
                                    onChange={() =>
                                      handleSwitchChange(
                                        item.id, 
                                        item.status === "y" ? "n" : "y",
                                        item.intakeItemName
                                      )
                                    }
                                    id={`switch-${item.id}`}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${item.id}`}
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
                            <td colSpan="5" className="text-center">
                              No intake item found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* PAGINATION - UPDATED WITH SAME FUNCTIONALITY AS ROOM MASTER */}
                  {filteredData.length > 0 && (
                    <nav className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        <span className="text-muted">
                          Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filteredData.length)} of {filteredData.length} entries
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
                // FORM
                <form className="forms row" onSubmit={handleSave}>
                   <div className="form-group col-md-4">
                    <label>Intake Item Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      name="intakeItemName"
                      placeholder="Enter intake item name"
                      value={formData.intakeItemName}
                      maxLength={INTAKE_ITEM_NAME_MAX_LENGTH}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group col-md-4">
                    <label>Intake Type <span className="text-danger">*</span></label>
                    <select
                      className="form-select mt-1"
                      name="intakeTypeId"
                      value={formData.intakeTypeId}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    >
                      <option value="">Select Intake Type</option>
                      {intakeTypeOptions.map((type, index) => (
                        <option key={index} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
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
                          <strong> {confirmDialog.intakeItemName}</strong>?
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

export default IntakeItemMaster;