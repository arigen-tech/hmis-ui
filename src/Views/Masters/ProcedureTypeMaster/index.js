import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_PROCEDURE_TYPE } from "../../../config/apiConfig";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";

const ProcedureTypeMaster = () => {
  const [procedureTypeData, setProcedureTypeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    procedureTypeId: null,
    newStatus: false
  });

  const [formData, setFormData] = useState({
    procedureTypeName: "",
    description: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingProcedureType, setEditingProcedureType] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [pageInput, setPageInput] = useState("1");

  const PROCEDURE_TYPE_NAME_MAX_LENGTH = 100;

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

  // Fetch procedure type data
  const fetchProcedureTypeData = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_PROCEDURE_TYPE}/getAll/${flag}`);
      if (response && response.response) {
        const mappedData = response.response.map(item => ({
          id: item.procedureTypeId,
          procedureTypeName: item.procedureTypeName,
          description: item.description || "N/A",
          status: item.status,
          lastUpdated: formatDate(item.lastUpdateDate),
          createdBy: item.createdBy || "",
          lastUpdatedBy: item.lastUpdatedBy || ""
        }));
        setProcedureTypeData(mappedData);
      }
    } catch (err) {
      console.error("Error fetching procedure type data:", err);
      showPopup("Failed to load procedure type data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchProcedureTypeData(0);
  }, []);

  // Filter data based on search query
  const filteredProcedureTypeData = procedureTypeData.filter(procedureType =>
    procedureType.procedureTypeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    procedureType.description?.toLowerCase().includes(searchQuery.toLowerCase())

  );

  // Calculate pagination values
  const totalPages = Math.ceil(filteredProcedureTypeData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProcedureTypeData.slice(indexOfFirstItem, indexOfLastItem);

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
      const { procedureTypeName, description } = formData;
      return (
        procedureTypeName.trim() !== "" &&
        description.trim() !== ""
      );
    };
    setIsFormValid(validateForm());
  }, [formData]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleEdit = (procedureType) => {
    setEditingProcedureType(procedureType);
    setFormData({
      procedureTypeName: procedureType.procedureTypeName || "",
      description: procedureType.description || "",
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);

      // Check for duplicates (case-insensitive)
      const isDuplicate = procedureTypeData.some(
        (procedureType) =>
          procedureType.procedureTypeName.toLowerCase() === formData.procedureTypeName.toLowerCase() &&
          (!editingProcedureType || editingProcedureType.id !== procedureType.id)
      );

      if (isDuplicate) {
        showPopup("Procedure type name already exists!", "error");
        setLoading(false);
        return;
      }

      // Prepare request data
      const requestData = {
        procedureTypeName: formData.procedureTypeName,
        description: formData.description
      };

      if (editingProcedureType) {
        // Update existing procedure type
        const response = await putRequest(`${MAS_PROCEDURE_TYPE}/update/${editingProcedureType.id}`, requestData);

        if (response && response.status === 200) {
          fetchProcedureTypeData();
          showPopup("Procedure type updated successfully!", "success");
        }
      } else {
        // Add new procedure type
        const response = await postRequest(`${MAS_PROCEDURE_TYPE}/create`, requestData);

        if ((response && response.status === 200) || (response && response.status === 201)) {
          fetchProcedureTypeData();
          showPopup("New procedure type added successfully!", "success");
        }
      }

      setEditingProcedureType(null);
      setFormData({ procedureTypeName: "", description: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving procedure type data:", err);
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
    setConfirmDialog({ isOpen: true, procedureTypeId: id, newStatus });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.procedureTypeId !== null) {
      try {
        setLoading(true);

        const response = await putRequest(
          `${MAS_PROCEDURE_TYPE}/status/${confirmDialog.procedureTypeId}?status=${confirmDialog.newStatus}`
        );

        if (response && response.response) {
          // Update local state with formatted date
          setProcedureTypeData((prevData) =>
            prevData.map((procedureType) =>
              procedureType.id === confirmDialog.procedureTypeId
                ? {
                  ...procedureType,
                  status: confirmDialog.newStatus,
                  lastUpdated: formatDate(new Date().toISOString())
                }
                : procedureType
            )
          );
          showPopup(`Procedure type ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`, "success");
        }
      } catch (err) {
        console.error("Error updating procedure type status:", err);
        showPopup(`Failed to update status: ${err.response?.data?.message || err.message}`, "error");
      } finally {
        setLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, procedureTypeId: null, newStatus: null });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    setPageInput("1");
    fetchProcedureTypeData(); // Refresh from API
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

  // Handle activate for inactive records in edit mode
  const handleActivate = async () => {
    if (editingProcedureType && editingProcedureType.status === "n") {
      try {
        setLoading(true);

        const response = await putRequest(
          `${MAS_PROCEDURE_TYPE}/status/${editingProcedureType.id}?status=y`
        );

        if (response && response.response) {
          fetchProcedureTypeData();
          showPopup("Procedure type activated successfully!", "success");
          setEditingProcedureType(null);
          setFormData({ procedureTypeName: "", description: "" });
          setShowForm(false);
        }
      } catch (err) {
        console.error("Error activating procedure type:", err);
        showPopup(`Failed to activate: ${err.response?.data?.message || err.message}`, "error");
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
              <h4 className="card-title">Procedure Type Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm ? (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search Religions"
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
                          setEditingProcedureType(null);
                          setFormData({ procedureTypeName: "", description: "" });
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
                          <th>Procedure Type Name</th>
                          <th>Description</th>
                          <th>Status</th>
                          {/* <th>Created By</th> */}
                          {/* <th>Last Updated By</th> */}
                          <th>Last Updated</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((procedureType) => (
                            <tr key={procedureType.id}>
                              <td>{procedureType.procedureTypeName || "N/A"}</td>
                              <td>{procedureType.description}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={procedureType.status === "y"}
                                    onChange={() => handleSwitchChange(procedureType.id, procedureType.status === "y" ? "n" : "y")}
                                    id={`switch-${procedureType.id}`}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${procedureType.id}`}
                                  >
                                    {procedureType.status === "y" ? 'Active' : 'Inactive'}
                                  </label>
                                </div>
                              </td>
                              {/* <td>{procedureType.createdBy}</td> */}
                              {/* <td>{procedureType.lastUpdatedBy}</td> */}
                              <td>{procedureType.lastUpdated}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(procedureType)}
                                  disabled={procedureType.status !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="text-center">No procedure type data found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {filteredProcedureTypeData.length > 0 && (
                    <nav className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        <span className="text-muted">
                          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredProcedureTypeData.length)} of {filteredProcedureTypeData.length} entries
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
                  <div className="form-group col-md-6">
                    <label>Procedure Type Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="procedureTypeName"
                      name="procedureTypeName"
                      placeholder="Enter procedure type name (e.g., Surgical)"
                      value={formData.procedureTypeName}
                      onChange={handleInputChange}
                      maxLength={PROCEDURE_TYPE_NAME_MAX_LENGTH}
                      required
                      disabled={loading}
                    />
                    {/* <small className="text-muted">
                      {formData.procedureTypeName.length}/{PROCEDURE_TYPE_NAME_MAX_LENGTH} characters
                    </small> */}
                  </div>

                  <div className="form-group col-md-6">
                    <label>Description <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control mt-1"
                      id="description"
                      name="description"
                      placeholder="Enter description for this procedure type"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      required
                      disabled={loading}
                    />
                    {/* <small className="text-muted">Enter detailed description of the procedure type</small> */}
                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid || loading}
                    >
                      {loading ? "Saving..." : (editingProcedureType ? 'Update' : 'Save')}
                    </button>

                    {editingProcedureType && editingProcedureType.status === "n" && (
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
                          <strong> {procedureTypeData.find(pt => pt.id === confirmDialog.procedureTypeId)?.procedureTypeName}</strong> procedure type?
                        </p>
                        {/* <p className="text-muted">
                          {confirmDialog.newStatus === "y" 
                            ? "This will make the procedure type available for use." 
                            : "This will hide the procedure type from selection."}
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

export default ProcedureTypeMaster;