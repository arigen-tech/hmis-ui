import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import axios from "axios";
import { MAS_MARITAL_STATUS } from "../../../config/apiConfig";
import { postRequest, putRequest, getRequest } from "../../../service/apiService"
const MaritalStatusMaster = () => {
  const [maritalStatusData, setMaritalStatusData] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, maritalStatusId: null, newStatus: false });
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredTotalPages, setFilteredTotalPages] = useState(1);
  const [totalFilteredProducts, setTotalFilteredProducts] = useState(0);
  const [itemsPerPage] = useState(10);
  const Status_NAME_MAX_LENGTH = 30;
  const [pageInput, setPageInput] = useState(1);



  // Fetch marital status data from API
  useEffect(() => {
    fetchMaritalStatusData();
  }, [0]);

  const fetchMaritalStatusData = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_MARITAL_STATUS}/getAll/${flag}`);

      if (response && response.response) {
        setMaritalStatusData(response.response);
      }
    } catch (err) {
      console.error("Error fetching marital status data:", err);
      showPopup("Failed to load marital status data", "error");
    } finally {
      setLoading(false);
    }
  };


  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Add null check when filtering
  const filteredMaritalStatusData = maritalStatusData.filter(
    (status) => (status.name?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMaritalStatusData.slice(indexOfFirstItem, indexOfLastItem);

  const handleEdit = (status) => {
    setEditingStatus(status);
    setFormData({
      name: status.name || "",
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);

      // Check for duplicates before making the API call
      const isDuplicate = maritalStatusData.some(
        (status) =>
          (status.name || "") === formData.name &&
          (!editingStatus || status.id !== editingStatus.id)
      );

      if (isDuplicate) {
        showPopup("Marital status already exists!", "error");
        setLoading(false);
        return;
      }

      if (editingStatus) {
        // Update existing marital status
        const response = await putRequest(`${MAS_MARITAL_STATUS}/updateById/${editingStatus.id}`, {
          id: editingStatus.id,
          name: formData.name,
          status: editingStatus.status,
        });

        if (response && response.response) {
          setMaritalStatusData((prevData) =>
            prevData.map((status) =>
              status.id === editingStatus.id ? response.response : status
            )
          );
          showPopup("Marital status updated successfully!", "success");
        }
      } else {
        // Add new marital status
        const response = await postRequest(`${MAS_MARITAL_STATUS}/create`, {
          name: formData.name,
          status: "y",
        });

        if (response && response.response) {
          setMaritalStatusData((prevData) => [...prevData, response.response]);
          showPopup("New marital status added successfully!", "success");
        }
      }

      setEditingStatus(null);
      setFormData({ name: "" });
      setShowForm(false);
      fetchMaritalStatusData();
    } catch (err) {
      console.error("Error saving marital status data:", err);
      showPopup(`Failed to save changes: ${err.response?.data?.message || err.message}`, "error");
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
    setConfirmDialog({ isOpen: true, maritalStatusId: id, newStatus });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.maritalStatusId !== null) {
      try {
        setLoading(true);
        const response = await putRequest(
          `${MAS_MARITAL_STATUS}/status/${confirmDialog.maritalStatusId}?status=${confirmDialog.newStatus}`
        );

        if (response && response.response) {
          setMaritalStatusData((prevData) =>
            prevData.map((status) =>
              status.id === confirmDialog.maritalStatusId
                ? { ...status, status: confirmDialog.newStatus }
                : status
            )
          );
          showPopup(
            `Marital status ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
            "success"
          );
        }
      } catch (err) {
        console.error("Error updating marital status status:", err);
        showPopup(`Failed to update status: ${err.response?.data?.message || err.message}`, "error");
      } finally {
        setLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, maritalStatusId: null, newStatus: null });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));

    // Validate the form
    const updatedFormData = { ...formData, [id]: value };
    setIsFormValid(updatedFormData.name.trim() !== "");
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchMaritalStatusData();
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
              <h4 className="card-title">Marital Status Master</h4>
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
                          setEditingStatus(null);
                          setFormData({ name: "" });
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
                        <th>Status Name</th>
                        <th>Status</th>
                        {/* <th>Last Changed By</th>
                        <th>Last Changed Date</th> */}
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.length > 0 ? (
                        currentItems.map((status) => (
                          <tr key={status.id}>
                            <td>{status.name}</td>
                            <td>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={status.status === "y"}
                                  onChange={() => handleSwitchChange(status.id, status.status === "y" ? "n" : "y")}
                                  id={`switch-${status.id}`}
                                />
                                <label className="form-check-label px-0" htmlFor={`switch-${status.id}`}>
                                  {status.status === "y" ? "Active" : "Deactivated"}
                                </label>
                              </div>
                            </td>
                            {/* <td>{status.lastChgBy || '-'}</td>
                            <td>{status.lastChgDate ? new Date(status.lastChgDate).toLocaleString() : '-'}</td> */}
                            <td>
                              <button
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleEdit(status)}
                                disabled={status.status !== "y"}
                              >
                                <i className="fa fa-pencil"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center">
                            No marital status data found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {filteredMaritalStatusData.length > 0 && (
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
                  <div className="form-group col-md-6">
                    <label>
                      Status Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      name="name"
                      placeholder="Status Name"
                      value={formData.name}
                      onChange={handleInputChange}
                      maxLength={Status_NAME_MAX_LENGTH}
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
                          Are you sure you want to{" "}
                          {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                          <strong>
                            {maritalStatusData.find((status) => status.id === confirmDialog.maritalStatusId)?.name || "this status"}
                          </strong>
                          ?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>
                          No
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>
                          Yes
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

export default MaritalStatusMaster;