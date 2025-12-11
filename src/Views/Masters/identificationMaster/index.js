import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import axios from "axios";
import { API_HOST, MAS_IDENTIFICATION_TYPE } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";


const Identificationmaster = () => {
  const [identificationTypes, setIdentificationTypes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");
  const itemsPerPage = 5;
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, identificationId: null, newStatus: false });
  const [popupMessage, setPopupMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [identificationId, setIdentificationId] = useState("");

  const [editingType, setEditingType] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [formData, setFormData] = useState({
    identificationCode: "",
    identificationName: "",
  });
  const [loading, setLoading] = useState(true);
  const [searchType, setSearchType] = useState("code");

  const IDENTIFICATION_NAME_MAX_LENGTH = 30;
  const IDENTIFICATION_CODE_MAX_LENGTH = 8;

  useEffect(() => {
    fetchIdentificationTypes(0);
  }, []);

  const fetchIdentificationTypes = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_IDENTIFICATION_TYPE}/getAll/${flag}`);
      if (response && response.response) {
        setIdentificationTypes(response.response);
      }
    } catch (err) {
      console.error("Error fetching identification types:", err);
      showPopup("Failed to load identification types", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchTypeChange = (e) => {
    setSearchType(e.target.value);
    setCurrentPage(1);
  };

  const filteredIdentificationTypes = identificationTypes.filter((type) => {
    if (searchType === "code") {
      return type.identificationCode.toLowerCase().includes(searchQuery.toLowerCase());
    } else {
      return type.identificationName.toLowerCase().includes(searchQuery.toLowerCase());
    }
  });

  const currentItems = filteredIdentificationTypes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const filteredTotalPages = Math.ceil(filteredIdentificationTypes.length / itemsPerPage);

  const handlePageNavigation = () => {
    const pageNumber = parseInt(pageInput, 10);
    if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
      setCurrentPage(pageNumber);
    } else {
      alert("Please enter a valid page number.");
    }
  };

  const handleEdit = (type) => {
    setEditingType({
      ...type,
      identificationId: type.identificationTypeId
    });
    setFormData({
      identificationCode: type.identificationCode,
      identificationName: type.identificationName,
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);

      const isDuplicate = identificationTypes.some(
        (type) =>
          type.identificationCode === formData.identificationCode ||
          type.identificationName === formData.identificationName
      );

      if (isDuplicate) {
        showPopup("Identification type with the same code or name already exists!", "error");
        setLoading(false);
        return;
      }

      if (editingType) {
        const response = await putRequest(`${MAS_IDENTIFICATION_TYPE}/updateById/${editingType.identificationId}`, {
          identificationCode: formData.identificationCode,
          identificationName: formData.identificationName,
          status: editingType.status,
        });

        if (response && response.response) {
          setIdentificationTypes((prevData) =>
            prevData.map((type) =>
              type.identificationTypeId === editingType.identificationId 
                ? response.response 
                : type
            )
          );
          showPopup("Identification type updated successfully!", "success");
        }
      } else {
        const response = await postRequest(`${MAS_IDENTIFICATION_TYPE}/create`, {
          identificationCode: formData.identificationCode,
          identificationName: formData.identificationName,
          status: "y",
        });

        if (response && response.response) {
          setIdentificationTypes([...identificationTypes, response.response]);
          showPopup("New identification type added successfully!", "success");
        }
      }

      setEditingType(null);
      setFormData({ identificationCode: "", identificationName: "" });
      setShowForm(false);
      fetchIdentificationTypes();
    } catch (err) {
      console.error("Error saving identification type:", err);
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
    setIdentificationId(id);
    setNewStatus(newStatus);
    setConfirmDialog({ isOpen: true, identificationId: id, newStatus });
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      
      const response = await putRequest(
        `${MAS_IDENTIFICATION_TYPE}/status/${confirmDialog.identificationId}?status=${confirmDialog.newStatus}`
      );
      
      if (response && response.response) {
        setIdentificationTypes((prevData) =>
          prevData.map((type) =>
            type.identificationTypeId === confirmDialog.identificationId
              ? { ...type, status: confirmDialog.newStatus }
              : type
          )
        );
        showPopup(
          `Identification type ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
          "success"
        );
      }
    } catch (err) {
      console.error("Error updating identification type status:", err);
      showPopup(`Failed to update status: ${err.response?.data?.message || err.message}`, "error");
    } finally {
      setLoading(false);
      setConfirmDialog({ isOpen: false, identificationId: null, newStatus: null });
    }
  };
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
    setIsFormValid(formData.identificationCode.trim() !== "" && formData.identificationName.trim() !== "");
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchIdentificationTypes();
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2">Identification Master</h4>
              {!showForm && (
                <div className="d-flex justify-content-between align-items-spacearound mt-3">
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <label>
                        <input
                          type="radio"
                          name="searchType"
                          value="code"
                          checked={searchType === "code"}
                          onChange={handleSearchTypeChange}
                        />
                        <span style={{ marginLeft: '5px' }}>Identification Type Code</span>
                      </label>
                    </div>
                    <div className="me-3">
                      <label>
                        <input
                          type="radio"
                          name="searchType"
                          value="description"
                          checked={searchType === "description"}
                          onChange={handleSearchTypeChange}
                        />
                        <span style={{ marginLeft: '5px' }}>Identification Type Name</span>
                      </label>
                    </div>
                  </div>
                  <div className="d-flex flex-wrap align-items-center gap-2">
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
                    <button type="button" className="btn btn-success me-1" onClick={() => setShowForm(true)}>
                      <i className="mdi mdi-plus"></i> ADD
                    </button>
                    {/* <button type="button" className="btn btn-success me-2 d-flex align-items-center">
                      <i className="mdi mdi-plus  d-sm-inlined-sm-inline ms-1"></i> Generate Report
                    </button> */}
                  </div>
                </div>
              )}
            </div>
            <div className="card-body">
              {loading ? (
                <LoadingScreen />
              ) : !showForm ? (
                <div className="table-responsive packagelist">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Identification Type Code</th>
                        <th>Identification Type Name</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((type) => (
                        <tr key={type.identificationTypeId}>
                          <td>{type.identificationCode}</td>
                          <td>{type.identificationName}</td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={type.status === "y"}
                                onChange={() => handleSwitchChange(type.identificationTypeId, type.status === "y" ? "n" : "y")}
                                id={`switch-${type.identificationTypeId}`}
                              />
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleEdit(type)}
                              disabled={type.status !== "y"}
                            >
                              <i className="fa fa-pencil"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="d-flex justify-content-end">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowForm(false)}
                    >
                      <i className="mdi mdi-arrow-left"></i> Back
                    </button>
                  </div>
                  <div className="form-group col-md-4">
                    <label>Identification Type Code <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="identificationCode"
                      name="identificationCode"
                      placeholder="Code"
                      value={formData.identificationCode}
                      maxLength={IDENTIFICATION_CODE_MAX_LENGTH}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group col-md-4">
                    <label>Identification Type Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="identificationName"
                      name="identificationName"
                      placeholder="Name"
                      value={formData.identificationName}
                      onChange={handleInputChange}
                      maxLength={IDENTIFICATION_NAME_MAX_LENGTH}
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
                        <button type="button" className="close" onClick={() => setConfirmDialog({ isOpen: false })}>
                          <span>&times;</span>
                        </button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                          <strong>{identificationTypes.find((type) => type.identificationTypeId === confirmDialog.identificationId)?.identificationName}</strong>?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setConfirmDialog({ isOpen: false })}>No</button>
                        <button type="button" className="btn btn-primary" onClick={handleConfirm}>Yes</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <nav className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  <span>
                    Page {currentPage} of {filteredTotalPages} | Total Records: {filteredIdentificationTypes.length}
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
                  {[...Array(filteredTotalPages)].map((_, index) => (
                    <li
                      className={`page-item ${currentPage === index + 1 ? "active" : ""}`}
                      key={index}
                    >
                      <button className="page-link" onClick={() => setCurrentPage(index + 1)}>
                        {index + 1}
                      </button>
                    </li>
                  ))}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Identificationmaster;