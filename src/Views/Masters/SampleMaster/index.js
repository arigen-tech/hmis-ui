import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_DG_SAMPLE } from "../../../config/apiConfig";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { ADD_SAMPLE_ERR_MSG, ADD_SAMPLE_SUCC_MSG, DUPLICATE_SAMPLE, FAIL_TO_SAVE_CHANGES, FAIL_TO_UPDATE_STS, FETCH_SAMPLE_ERR_MSG, UPDATE_SAMPLE_ERR_MSG, UPDATE_SAMPLE_SUCC_MSG } from "../../../config/constants";

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
      showPopup(FETCH_SAMPLE_ERR_MSG, "error");
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Filter data based on search query (keeps backend order for filtered items)
  const filteredSampleData = sampleData.filter(sample =>
    sample.sampleDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sample.sampleCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (sample.status === "y" ? "active" : "inactive").includes(searchQuery.toLowerCase())
  );

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredSampleData.slice(indexOfFirst, indexOfLast);

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
        showPopup(DUPLICATE_SAMPLE, "error");
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
          showPopup(UPDATE_SAMPLE_SUCC_MSG, "success");
        } else {
          showPopup(UPDATE_SAMPLE_ERR_MSG, "error");
        }
      } else {
        // Add new sample
        const response = await postRequest(`${MAS_DG_SAMPLE}/create`, requestData);

        if (response && response.status === 200 && response.response) {
          // Add new sample to state - will appear at the top after refresh
          setSampleData((prevData) => [...prevData, response.response]);
          showPopup(ADD_SAMPLE_SUCC_MSG, "success");
        } else {
          showPopup(ADD_SAMPLE_ERR_MSG, "error");
        }
      }

      setEditingSample(null);
      setFormData({ sampleCode: "", sampleDescription: "" });
      setShowForm(false);
      
      // Refresh data to get proper ordering from backend
      fetchSampleData(0);
    } catch (err) {
      console.error("Error saving sample data:", err);
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
        showPopup(FAIL_TO_UPDATE_STS, "error");
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
    fetchSampleData(0); // Refresh from API
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

                <div className="d-flex align-items-center ms-auto">
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

                  {/* PAGINATION USING REUSABLE COMPONENT */}
                  {filteredSampleData.length > 0 && (
                    <Pagination
                      totalItems={filteredSampleData.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
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