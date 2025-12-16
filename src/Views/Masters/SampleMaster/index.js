import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_DG_SAMPLE } from "../../../config/apiConfig";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";

const SampleMaster = () => {
  const [sampleData, setSampleData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    sampleId: null,
    newStatus: false
  });

  const [formData, setFormData] = useState({
    sampleCode: "",
    sampleDescription: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingSample, setEditingSample] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [pageInput, setPageInput] = useState("1");

  const SAMPLE_DESCRIPTION_MAX_LENGTH = 30;
  const SAMPLE_CODE_MAX_LENGTH = 30;

  // Fetch sample data
  const fetchSampleData = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_DG_SAMPLE}/getAll/${flag}`);

      if (response && response.response) {
        const transformedData = response.response.map((sample) => ({
          id: sample.id,
          sampleCode: sample.sampleCode || "",
          sampleDescription: sample.sampleDescription || "",
          status: sample.status,
        }));
        setSampleData(transformedData);
      }
    } catch (err) {
      console.error("Error fetching sample data:", err);
      showPopup("Failed to load sample data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchSampleData(0);
  }, []);

  // Validate form whenever formData changes
  useEffect(() => {
    const validateForm = () => {
      const { sampleCode, sampleDescription } = formData;

      // Validate sample code - should not be empty
      const isSampleCodeValid = sampleCode.trim() !== "";

      // Validate sample description - should not be empty
      const isSampleDescriptionValid = sampleDescription.trim() !== "";

      return isSampleCodeValid && isSampleDescriptionValid;
    };

    setIsFormValid(validateForm());
  }, [formData]);

  // Filter data based on search query (keeps backend order for filtered items)
  const filteredSampleData = sampleData.filter(sample =>
    sample.sampleDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sample.sampleCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (sample.status === "y" ? "active" : "inactive").includes(searchQuery.toLowerCase())
  );

  // Calculate pagination values - NO SORTING APPLIED
  const totalPages = Math.ceil(filteredSampleData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSampleData.slice(indexOfFirstItem, indexOfLastItem);

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

  const handleEdit = (sample) => {
    setEditingSample(sample);
    setFormData({
      sampleCode: sample.sampleCode || "",
      sampleDescription: sample.sampleDescription || ""
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);

      // Check for duplicates - check both sample code and description
      const isDuplicate = sampleData.some(
        (sample) =>
          (sample.sampleCode.toLowerCase() === formData.sampleCode.toLowerCase() ||
           sample.sampleDescription.toLowerCase() === formData.sampleDescription.toLowerCase()) &&
          (!editingSample || editingSample.id !== sample.id)
      );

      if (isDuplicate) {
        showPopup("Sample with same code or description already exists!", "error");
        setLoading(false);
        return;
      }

      // Prepare request data
      const requestData = {
        sampleCode: formData.sampleCode,
        sampleDescription: formData.sampleDescription
      };

      if (editingSample) {
        // Update existing sample
        const response = await putRequest(`${MAS_DG_SAMPLE}/updateById/${editingSample.id}`, requestData);

        if (response && response.status === 200 && response.response) {
          // Update local state
          setSampleData((prevData) =>
            prevData.map((sample) =>
              sample.id === editingSample.id ? response.response : sample
            )
          );
          showPopup("Sample updated successfully!", "success");
        } else {
          showPopup("Failed to update sample", "error");
        }
      } else {
        // Add new sample
        const response = await postRequest(`${MAS_DG_SAMPLE}/create`, requestData);

        if (response && response.status === 200 && response.response) {
          // Add new sample to state - will appear at the top after refresh
          setSampleData((prevData) => [...prevData, response.response]);
          showPopup("New sample added successfully!", "success");
        } else {
          showPopup("Failed to add sample", "error");
        }
      }

      setEditingSample(null);
      setFormData({ sampleCode: "", sampleDescription: "" });
      setShowForm(false);
      
      // Refresh data to get proper ordering from backend
      fetchSampleData(0);
    } catch (err) {
      console.error("Error saving sample data:", err);
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
    setConfirmDialog({ isOpen: true, sampleId: id, newStatus });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.sampleId !== null) {
      try {
        setLoading(true);

        const response = await putRequest(
          `${MAS_DG_SAMPLE}/status/${confirmDialog.sampleId}?status=${confirmDialog.newStatus}`
        );

        if (response && response.response) {
          // Refresh data to get proper ordering from backend
          fetchSampleData(0);
          showPopup(`Sample ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`, "success");
        }
      } catch (err) {
        console.error("Error updating sample status:", err);
        showPopup(`Failed to update status: ${err.response?.data?.message || err.message}`, "error");
      } finally {
        setLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, sampleId: null, newStatus: null });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    setPageInput("1");
    fetchSampleData(0); // Refresh from API
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
              <h4 className="card-title">Sample Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm ? (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search samples..."
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
                          setEditingSample(null);
                          setFormData({ sampleCode: "", sampleDescription: "" });
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
                          <th>Sample Code</th>
                          <th>Sample Description</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((sample) => (
                            <tr key={sample.id}>
                              <td>{sample.sampleCode}</td>
                              <td>{sample.sampleDescription}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={sample.status === "y"}
                                    onChange={() => handleSwitchChange(sample.id, sample.status === "y" ? "n" : "y")}
                                    id={`switch-${sample.id}`}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${sample.id}`}
                                  >
                                    {sample.status === "y" ? 'Active' : 'Inactive'}
                                  </label>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(sample)}
                                  disabled={sample.status !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center">No sample data found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {filteredSampleData.length > 0 && (
                    <nav className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        <span className="text-muted">
                          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredSampleData.length)} of {filteredSampleData.length} entries
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
                        <label>Sample Code <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control mt-1"
                          id="sampleCode"
                          name="sampleCode"
                          placeholder="Enter sample code"
                          value={formData.sampleCode}
                          onChange={handleInputChange}
                          maxLength={SAMPLE_CODE_MAX_LENGTH}
                          required
                          disabled={loading}
                        />
                      </div>
                      <div className="form-group col-md-4">
                        <label>Sample Description <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control mt-1"
                          id="sampleDescription"
                          name="sampleDescription"
                          placeholder="Enter sample description"
                          value={formData.sampleDescription}
                          onChange={handleInputChange}
                          maxLength={SAMPLE_DESCRIPTION_MAX_LENGTH}
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
                      {loading ? "Saving..." : (editingSample ? 'Update' : 'Save')}
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
                          <strong> {sampleData.find(sample => sample.id === confirmDialog.sampleId)?.sampleDescription}</strong> sample?
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

export default SampleMaster;