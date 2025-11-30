import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import axios from "axios";
import { API_HOST, MAS_DG_SAMPLE } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";

const SampleMaster = () => {
  const [sampleData, setSampleData] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, sampleId: null, newStatus: false });
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    sampleCode: "",
    sampleDescription: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSample, setEditingSample] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredTotalPages, setFilteredTotalPages] = useState(1);
  const [totalFilteredProducts, setTotalFilteredProducts] = useState(0);
  const [itemsPerPage] = useState(4);
  const [pageInput, setPageInput] = useState("");

  const SAMPLE_DESCRIPTION_MAX_LENGTH = 30;
  const SAMPLE_CODE_MAX_LENGTH = 30;

  useEffect(() => {
    fetchSampleData(0);
  }, []);

  const fetchSampleData = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_DG_SAMPLE}/getAll/${flag}`);

      if (response && response.response) {
        const transformedData = response.response.map((sample) => ({
          id: sample.id,
          sampleCode: sample.sampleCode,
          sampleDescription: sample.sampleDescription,
          status: sample.status,
        }));

        setSampleData(transformedData);
        setTotalFilteredProducts(transformedData.length);
        setFilteredTotalPages(Math.ceil(transformedData.length / itemsPerPage));
      }
    } catch (err) {
      console.error("Error fetching sample data:", err);
      showPopup("Failed to load sample data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const filteredSampleData = sampleData.filter(
    (sample) =>
      sample.sampleDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.sampleCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSampleData.slice(indexOfFirstItem, indexOfLastItem);

  const handleEdit = (sample) => {
    setEditingSample(sample);
    setFormData({
      sampleCode: sample.sampleCode,
      sampleDescription: sample.sampleDescription,
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);

      // Check for duplicates (excluding the current editing sample)
      const isDuplicate = sampleData.some(
        (sample) =>
          (sample.sampleCode === formData.sampleCode || 
           sample.sampleDescription === formData.sampleDescription) &&
          sample.id !== editingSample?.id
      );

      if (isDuplicate) {
        showPopup("Sample already exists!", "error");
        setLoading(false);
        return;
      }

      if (editingSample) {
        // Update existing sample
        const response = await putRequest(`${MAS_DG_SAMPLE}/updateById/${editingSample.id}`, {
          sampleCode: formData.sampleCode,
          sampleDescription: formData.sampleDescription,
        });

        if (response && response.response) {
          setSampleData((prevData) =>
            prevData.map((sample) =>
              sample.id === editingSample.id ? response.response : sample
            )
          );
          showPopup("Sample updated successfully!", "success");
        }
      } else {
        // Create new sample
        const response = await postRequest(`${MAS_DG_SAMPLE}/create`, {
          sampleCode: formData.sampleCode,
          sampleDescription: formData.sampleDescription,
        });

        if (response && response.response) {
          setSampleData((prevData) => [...prevData, response.response]);
          showPopup("New sample added successfully!", "success");
        }
      }

      setEditingSample(null);
      setFormData({ sampleCode: "", sampleDescription: "" });
      setShowForm(false);
      fetchSampleData();
    } catch (err) {
      console.error("Error saving sample data:", err);
      showPopup(
        `Failed to save changes: ${err.response?.data?.message || err.message}`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      },
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
          setSampleData((prevData) =>
            prevData.map((sample) =>
              sample.id === confirmDialog.sampleId
                ? { ...sample, status: confirmDialog.newStatus }
                : sample
            )
          );
          showPopup(
            `Sample ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
            "success"
          );
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

    setFormData((prevData) => {
      const updatedData = { ...prevData, [id]: value };

      // Validate form
      if (id === "sampleDescription" || id === "sampleCode") {
        setIsFormValid(
          (updatedData.sampleDescription?.trim() || "") !== "" &&
          (updatedData.sampleCode?.trim() || "") !== ""
        );
      }

      return updatedData;
    });
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchSampleData();
  };

  const handlePageNavigation = () => {
    const pageNumber = Number(pageInput);
    if (pageNumber >= 1 && pageNumber <= filteredTotalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const renderPagination = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(filteredTotalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) pageNumbers.push("...");
    }
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    if (endPage < filteredTotalPages) {
      if (endPage < filteredTotalPages - 1) pageNumbers.push("...");
      pageNumbers.push(filteredTotalPages);
    }
    return pageNumbers.map((number, index) => (
      <li key={index} className={`page-item ${number === currentPage ? "active" : ""}`}>
        {typeof number === "number" ? (
          <button className="page-link" onClick={() => setCurrentPage(number)}>
            {number}
          </button>
        ) : (
          <span className="page-link disabled">{number}</span>
        )}
      </li>
    ));
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Sample Master</h4>
              <div className="d-flex justify-content-between align-items-center">
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

                <div className="d-flex align-items-center">
                  {!showForm ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={() => {
                          setEditingSample(null);
                          setFormData({ sampleCode: "", sampleDescription: "" });
                          setIsFormValid(false);
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
                                  {sample.status === "y" ? "Active" : "Deactivated"}
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
                  {filteredSampleData.length > 0 && (
                    <nav className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        <span>
                          Page {currentPage} of {filteredTotalPages} | Total Records: {totalFilteredProducts}
                        </span>
                      </div>
                      <ul className="pagination mb-0">
                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            &laquo; Previous
                          </button>
                        </li>
                        {renderPagination()}
                        <li className={`page-item ${currentPage === filteredTotalPages ? "disabled" : ""}`}>
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === filteredTotalPages}
                          >
                            Next &raquo;
                          </button>
                        </li>
                      </ul>
                      <div className="d-flex align-items-center">
                        <input
                          type="number"
                          min="1"
                          max={filteredTotalPages}
                          value={pageInput}
                          onChange={(e) => setPageInput(e.target.value)}
                          placeholder="Go to page"
                          className="form-control me-2"
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
                </div>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="form-group col-md-4">
                    <label>Sample Code <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="sampleCode"
                      name="sampleCode"
                      placeholder="Sample Code"
                      value={formData.sampleCode}
                      onChange={handleInputChange}
                      maxLength={SAMPLE_CODE_MAX_LENGTH}
                      required
                    />
                  </div>
                  <div className="form-group col-md-4">
                    <label>Sample Description <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="sampleDescription"
                      name="sampleDescription"
                      placeholder="Sample Description"
                      value={formData.sampleDescription}
                      onChange={handleInputChange}
                      maxLength={SAMPLE_DESCRIPTION_MAX_LENGTH}
                      required
                    />
                  </div>
                  <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                    <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                      Save
                    </button>
                    <button type="button" className="btn btn-danger" onClick={() => setShowForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
              {showModal && (
                <div className="modal fade show" style={{ display: "block" }} tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h1 className="modal-title fs-5" id="staticBackdropLabel">Sample Reports</h1>
                        <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                      </div>
                      <div className="modal-body">
                        <p>Generate reports for sample data:</p>
                        <div className="list-group">
                          <button type="button" className="list-group-item list-group-item-action">Sample Distribution Report</button>
                          <button type="button" className="list-group-item list-group-item-action">Active/Inactive Sample Status Report</button>
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                        <button type="button" className="btn btn-primary">Generate Report</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {popupMessage && (
                <Popup
                  message={popupMessage.message}
                  type={popupMessage.type}
                  onClose={popupMessage.onClose}
                />
              )}
              {confirmDialog.isOpen && (
                <div className="modal d-block" tabIndex="-1" role="dialog">
                  <div className="modal-dialog" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button type="button" className="close" onClick={() => handleConfirm(false)}>
                          <span>&times;</span>
                        </button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                          <strong>{sampleData.find((sample) => sample.id === confirmDialog.sampleId)?.sampleDescription}</strong>?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>No</button>
                        <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>Yes</button>
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