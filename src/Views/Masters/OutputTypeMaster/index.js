import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_OUTPUT_TYPE } from "../../../config/apiConfig";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import { ADD_OUTPUT_TYPE_SUCC_MSG, DUPLICATE_OUTPUT_TYPE, FAIL_TO_SAVE_CHANGES, FAIL_TO_UPDATE_STS, FETCH_OUTPUT_TYPE_ERR_MSG, INVALID_PAGE_NO_WARN_MSG, UPDATE_OUTPUT_TYPE_SUCC_MSG } from "../../../config/constants";

const OutputTypeMaster = () => {
  const [data, setData] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    outputTypeName: ""
  });
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    outputTypeName: "",
    isMeasurable: "y",
    description: ""
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

  const OUTPUT_TYPE_NAME_MAX_LENGTH = 50;
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

  // Format measurable value
  const formatMeasurable = (isMeasurable) => {
    if (isMeasurable === "y") return "Yes";
    if (isMeasurable === "n") return "No";
    return "N/A";
  };

  // Fetch output type data
  const fetchData = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_OUTPUT_TYPE}/getAll/${flag}`);
      if (response && response.response) {
        const mappedData = response.response.map(item => ({
          id: item.outputTypeId,
          outputTypeName: item.outputTypeName || "",
          isMeasurable: item.isMeasurable,
          description: item.description || "",
          status: item.status,
          lastUpdated: formatDate(item.lastUpdateDate),
          createdBy: item.createdBy,
          lastUpdatedBy: item.lastUpdatedBy
        }));
        setData(mappedData);
      }
    } catch (err) {
      console.error("Error fetching output type data:", err);
      showPopup(FETCH_OUTPUT_TYPE_ERR_MSG, "error");
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
      item.outputTypeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formatMeasurable(item.isMeasurable).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
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
      newFormData.outputTypeName.trim() !== ""
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
          item.outputTypeName.toLowerCase() === formData.outputTypeName.toLowerCase() &&
          (!editingRecord || editingRecord.id !== item.id)
      );

      if (isDuplicate) {
        showPopup(DUPLICATE_OUTPUT_TYPE, "error");
        setLoading(false);
        return;
      }

      // Prepare request data
      const requestData = {
        outputTypeName: formData.outputTypeName,
        isMeasurable: formData.isMeasurable,
        description: formData.description || ""
      };

      if (editingRecord) {
        // Update output type
        const response = await putRequest(`${MAS_OUTPUT_TYPE}/update/${editingRecord.id}`, requestData);

        if (response && response.status === 200) {
          fetchData();
          showPopup(UPDATE_OUTPUT_TYPE_SUCC_MSG, "success");
        }
      } else {
        // Add new output type
        const response = await postRequest(`${MAS_OUTPUT_TYPE}/create`, requestData);

        if (response && (response.status === 200 || response.status === 201)) {
          fetchData();
          showPopup(ADD_OUTPUT_TYPE_SUCC_MSG, "success");
        }
      }

      setEditingRecord(null);
      setFormData({ outputTypeName: "", isMeasurable: "y", description: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving output type:", err);
      showPopup(FAIL_TO_SAVE_CHANGES, "error");
    } finally {
      setLoading(false);
    }
  };

  // Edit
  const handleEdit = (item) => {
    setEditingRecord(item);
    setFormData({
      outputTypeName: item.outputTypeName || "",
      isMeasurable: item.isMeasurable || "y",
      description: item.description || ""
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  // Status Change
  const handleSwitchChange = (id, newStatus, outputTypeName) => {
    setConfirmDialog({ 
      isOpen: true, 
      id, 
      newStatus,
      outputTypeName 
    });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed) {
      try {
        setLoading(true);
        const response = await putRequest(
          `${MAS_OUTPUT_TYPE}/status/${confirmDialog.id}?status=${confirmDialog.newStatus}`
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
            `Output type ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
            "success"
          );
        }
      } catch (err) {
        console.error("Error updating output type status:", err);
        showPopup(FAIL_TO_UPDATE_STS, "error");
      } finally {
        setLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "", outputTypeName: "" });
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
              <h4 className="card-title">Output Type Master</h4>
              
              <div className="d-flex justify-content-between align-items-center">
                {/* Search form */}
                {!showForm ? (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search output type name or measurable status"
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
                          setFormData({ outputTypeName: "", isMeasurable: "y", description: "" });
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
                          <th>Output Type Name</th>
                          <th>Measurable</th>
                          <th>Description</th>
                          <th>Status</th>
                          <th>Last Updated</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((item) => (
                            <tr key={item.id}>
                              <td>{item.outputTypeName}</td>
                              <td>{formatMeasurable(item.isMeasurable)}</td>
                              <td>{item.description || "N/A"}</td>
                              
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
                                        item.outputTypeName
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
                            <td colSpan="6" className="text-center">
                              No output type found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* PAGINATION */}
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
                    <label>Output Type Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      name="outputTypeName"
                      placeholder="Enter output type name"
                      value={formData.outputTypeName}
                      maxLength={OUTPUT_TYPE_NAME_MAX_LENGTH}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group col-md-4">
                    <label>Measurable</label>
                    <select
                      className="form-select mt-1"
                      name="isMeasurable"
                      value={formData.isMeasurable}
                      onChange={handleInputChange}
                      disabled={loading}
                    >
                      <option value="y">Yes</option>
                      <option value="n">No</option>
                    </select>
                  </div>
                  
                  <div className="form-group col-md-12 mt-3">
                    <label>Description</label>
                    <textarea
                      className="form-control mt-1"
                      name="description"
                      rows="2"
                      placeholder="Enter description"
                      value={formData.description}
                      maxLength={DESCRIPTION_MAX_LENGTH}
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
                          <strong> {confirmDialog.outputTypeName}</strong>?
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

export default OutputTypeMaster;