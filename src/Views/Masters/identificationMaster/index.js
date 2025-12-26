import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_IDENTIFICATION_TYPE } from "../../../config/apiConfig";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import {
  FETCH_IDENTIFICATION_ERR_MSG,
  DUPLICATE_IDENTIFICATION,
  UPDATE_IDENTIFICATION_SUCC_MSG,
  ADD_IDENTIFICATION_SUCC_MSG,
  FAIL_TO_SAVE_CHANGES,
  FAIL_TO_UPDATE_STS
} from "../../../config/constants";

const Identificationmaster = () => {
  const [identificationTypes, setIdentificationTypes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, identificationId: null, newStatus: false });
  const [popupMessage, setPopupMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [formData, setFormData] = useState({
    identificationCode: "",
    identificationName: "",
  });
  const [loading, setLoading] = useState(true);

  const IDENTIFICATION_NAME_MAX_LENGTH = 30;
  const IDENTIFICATION_CODE_MAX_LENGTH = 8;
  const itemsPerPage = 5;

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
      showPopup(FETCH_IDENTIFICATION_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchIdentificationTypes();
  };

  const filteredIdentificationTypes = identificationTypes.filter((type) => {
    if (searchQuery === "") return true;
    
    const query = searchQuery.toLowerCase();
    return (
      type.identificationCode.toLowerCase().includes(query) ||
      type.identificationName.toLowerCase().includes(query)
    );
  });

  const filteredTotalPages = Math.ceil(filteredIdentificationTypes.length / itemsPerPage);
  const totalFilteredItems = filteredIdentificationTypes.length;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredIdentificationTypes.slice(indexOfFirstItem, indexOfLastItem);

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
          (type.identificationCode === formData.identificationCode ||
           type.identificationName === formData.identificationName) &&
          type.identificationTypeId !== (editingType ? editingType.identificationId : null)
      );

      if (isDuplicate) {
        showPopup(DUPLICATE_IDENTIFICATION, "error");
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
          showPopup(UPDATE_IDENTIFICATION_SUCC_MSG, "success");
        }
      } else {
        const response = await postRequest(`${MAS_IDENTIFICATION_TYPE}/create`, {
          identificationCode: formData.identificationCode,
          identificationName: formData.identificationName,
          status: "y",
        });

        if (response && response.response) {
          setIdentificationTypes([...identificationTypes, response.response]);
          showPopup(ADD_IDENTIFICATION_SUCC_MSG, "success");
        }
      }

      setEditingType(null);
      setFormData({ identificationCode: "", identificationName: "" });
      setShowForm(false);
      fetchIdentificationTypes();
    } catch (err) {
      console.error("Error saving identification type:", err);
      showPopup(FAIL_TO_SAVE_CHANGES, "error");
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
    setConfirmDialog({ isOpen: true, identificationId: id, newStatus });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.identificationId !== null) {
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
        showPopup(FAIL_TO_UPDATE_STS, "error");
      } finally {
        setLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, identificationId: null, newStatus: null });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const updatedFormData = { ...formData, [id]: value };
    setFormData(updatedFormData);
    
    const isValid = 
      updatedFormData.identificationCode.trim() !== "" && 
      updatedFormData.identificationName.trim() !== "";
    setIsFormValid(isValid);
  };

  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(currentPage, 10);
    if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
      setCurrentPage(pageNumber);
    } else {
      alert("Please enter a valid page number.");
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
              <h4 className="card-title">Identification Master</h4>
              <div className="d-flex justify-content-between align-items-center">
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
                          setEditingType(null);
                          setFormData({ identificationCode: "", identificationName: "" });
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
                      <button type="button" className="btn btn-success d-flex align-items-center">
                        <i className="mdi mdi-file-export d-sm-inlined-sm-inline ms-1"></i> Generate Report
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
                          <th>Identification Type Code</th>
                          <th>Identification Type Name</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((type) => (
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
                                  <label className="form-check-label px-0" htmlFor={`switch-${type.identificationTypeId}`}>
                                    {type.status === "y" ? "Active" : "Deactivated"}
                                  </label>
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
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center">No identification types found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {filteredIdentificationTypes.length > 0 && (
                    <nav className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        <span>
                          Page {currentPage} of {filteredTotalPages} | Total Records: {totalFilteredItems}
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
                          value={currentPage}
                          onChange={(e) => setCurrentPage(e.target.value)}
                          placeholder="Go to page"
                          className="form-control me-2"
                          style={{ width: '100px' }}
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
                  <div className="card-body">
                    <div className="row g-3 align-items-center">
                      <div className="col-md-6">
                        <label htmlFor="identificationCode" className="form-label">
                          Identification Type Code <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="identificationCode"
                          name="identificationCode"
                          placeholder="Code"
                          value={formData.identificationCode}
                          maxLength={IDENTIFICATION_CODE_MAX_LENGTH}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="identificationName" className="form-label">
                          Identification Type Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="identificationName"
                          name="identificationName"
                          placeholder="Name"
                          value={formData.identificationName}
                          onChange={handleInputChange}
                          maxLength={IDENTIFICATION_NAME_MAX_LENGTH}
                          required
                        />
                      </div>
                    </div>
                    <div className="d-flex justify-content-end mt-4">
                      <button type="button" className="btn btn-secondary me-2" onClick={() => setShowForm(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-success" disabled={!isFormValid}>
                        {editingType ? "Update" : "Save"}
                      </button>
                    </div>
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

export default Identificationmaster;