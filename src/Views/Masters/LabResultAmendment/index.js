import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import { LAB_AMENDMENT_TYPE_API } from "../../../config/apiConfig"; // You'll need to add this to your apiConfig
import LoadingScreen from "../../../Components/Loading";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import {
  ADD_LAB_AMENDMENT_TYPE_SUCC_MSG,
  DUPLICATE_LAB_AMENDMENT_TYPE,
  FAIL_TO_SAVE_CHANGES,
  FAIL_TO_UPDATE_STS,
  FETCH_LAB_AMENDMENT_TYPE_ERR_MSG,
  UPDATE_LAB_AMENDMENT_TYPE_SUCC_MSG
} from "../../../config/constants"; 
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const LabResultAmendment = () => {
  const [amendmentTypeData, setAmendmentTypeData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    id: null, 
    newStatus: false, 
    amendmentTypeName: "" 
  });
  const [popupMessage, setPopupMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [formData, setFormData] = useState({
    amendmentTypeCode: "",
    amendmentTypeName: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const AMENDMENT_TYPE_CODE_MAX_LENGTH = 30;
  const AMENDMENT_TYPE_NAME_MAX_LENGTH = 100;
  const DESCRIPTION_MAX_LENGTH = 500;

  useEffect(() => {
    fetchAmendmentTypeData(0);
  }, []);

  // Function to format date as dd-MM-YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "";
      }

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  const fetchAmendmentTypeData = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${LAB_AMENDMENT_TYPE_API}/all?flag=${flag}`);
      if (response && response.response) {
        const mappedData = response.response.map(item => ({
          id: item.amendmentTypeId,
          code: item.amendmentTypeCode,
          name: item.amendmentTypeName,
          description: item.description,
          status: item.status,
          lastUpdated: formatDate(item.lastUpdateDate)
        }));
        setAmendmentTypeData(mappedData);
      }
    } catch (err) {
      console.error("Error fetching amendment type data:", err);
      showPopup(FETCH_LAB_AMENDMENT_TYPE_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredAmendmentTypes = (amendmentTypeData || []).filter(
    (amendmentType) =>
      amendmentType?.name?.toLowerCase().includes(searchQuery?.toLowerCase() || "") ||
      amendmentType?.code?.toLowerCase().includes(searchQuery?.toLowerCase() || "") ||
      amendmentType?.description?.toLowerCase().includes(searchQuery?.toLowerCase() || "")
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredAmendmentTypes.slice(indexOfFirst, indexOfLast);

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      amendmentTypeCode: record.code,
      amendmentTypeName: record.name,
      description: record.description || "",
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);

      // Check for duplicate name (excluding current record if editing)
      const isDuplicateName = amendmentTypeData.some(
        (amendmentType) =>
          amendmentType.name.toLowerCase() === formData.amendmentTypeName.toLowerCase() &&
          (!editingRecord || editingRecord.id !== amendmentType.id)
      );

      // Check for duplicate code (excluding current record if editing)
      const isDuplicateCode = amendmentTypeData.some(
        (amendmentType) =>
          amendmentType.code.toLowerCase() === formData.amendmentTypeCode.toLowerCase() &&
          (!editingRecord || editingRecord.id !== amendmentType.id)
      );

      if (isDuplicateName && !editingRecord) {
        showPopup(DUPLICATE_LAB_AMENDMENT_TYPE, "error");
        setLoading(false);
        return;
      }

      if (isDuplicateCode && !editingRecord) {
        showPopup(DUPLICATE_LAB_AMENDMENT_TYPE, "error");
        setLoading(false);
        return;
      }

      if (editingRecord) {
        const response = await putRequest(`${LAB_AMENDMENT_TYPE_API}/update/${editingRecord.id}`, {
          amendmentTypeCode: formData.amendmentTypeCode,
          amendmentTypeName: formData.amendmentTypeName,
          description: formData.description,
        });

        if (response && response.status === 200) {
          fetchAmendmentTypeData();
          showPopup(UPDATE_LAB_AMENDMENT_TYPE_SUCC_MSG, "success");
        }
      } else {
        const response = await postRequest(`${LAB_AMENDMENT_TYPE_API}/create`, {
          amendmentTypeCode: formData.amendmentTypeCode,
          amendmentTypeName: formData.amendmentTypeName,
          description: formData.description,
        });

        if (response && response.status === 200 || response.status === 201) {
          fetchAmendmentTypeData();
          showPopup(ADD_LAB_AMENDMENT_TYPE_SUCC_MSG, "success");
        }
      }

      setEditingRecord(null);
      setFormData({ 
        amendmentTypeCode: "", 
        amendmentTypeName: "", 
        description: "" 
      });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving amendment type:", err);
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

  const handleSwitchChange = (id, newStatus, amendmentTypeName) => {
    setConfirmDialog({ isOpen: true, id: id, newStatus, amendmentTypeName });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.id !== null) {
      try {
        setLoading(true);
        const response = await putRequest(
          `${LAB_AMENDMENT_TYPE_API}/${confirmDialog.id}/status/${confirmDialog.newStatus}`
        );
        if (response && response.response) {
          setAmendmentTypeData((prevData) =>
            prevData.map((amendmentType) =>
              amendmentType.id === confirmDialog.id
                ? { ...amendmentType, status: confirmDialog.newStatus }
                : amendmentType
            )
          );
          showPopup(
            `Amendment Type ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
            "success"
          );
        }
      } catch (err) {
        console.error("Error updating amendment type status:", err);
        showPopup(FAIL_TO_UPDATE_STS, "error");
      } finally {
        setLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: null, amendmentTypeName: "" });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
    
    // Check if all required fields are filled
    const isValid = formData.amendmentTypeCode.trim() !== "" && 
                   formData.amendmentTypeName.trim() !== "";
    setIsFormValid(isValid);
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchAmendmentTypeData();
  };

  const handleBack = () => {
    setEditingRecord(null);
    setFormData({ 
      amendmentTypeCode: "", 
      amendmentTypeName: "", 
      description: "" 
    });
    setShowForm(false);
    setIsFormValid(false);
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Lab Result Amendment Type Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm ? (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search Amendment Types"
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
                      <button type="button" className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                        <i className="mdi mdi-plus"></i> Add
                      </button>
                      <button type="button" className="btn btn-success me-2 flex-shrink-0" onClick={handleRefresh}>
                        <i className="mdi mdi-refresh"></i> Show All
                      </button>
                      <button type="button" className="btn btn-success me-2" onClick={() => setShowModal(true)}>
                        <i className="mdi mdi-file-document"></i> Reports
                      </button>
                    </>
                  ) : (
                    <button type="button" className="btn btn-secondary" onClick={handleBack}>
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
                          <th>Code</th>
                          <th>Name</th>
                          <th>Description</th>
                          <th>Last Updated</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((amendmentType) => (
                            <tr key={amendmentType.id}>
                              <td>{amendmentType.code}</td>
                              <td>{amendmentType.name}</td>
                              <td>{amendmentType.description}</td>
                              <td>{amendmentType.lastUpdated}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={amendmentType.status === "y"}
                                    onChange={() => handleSwitchChange(
                                      amendmentType.id, 
                                      amendmentType.status === "y" ? "n" : "y", 
                                      amendmentType.name
                                    )}
                                    id={`switch-${amendmentType.id}`}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${amendmentType.id}`}
                                  >
                                    {amendmentType.status === "y" ? "Active" : "Deactivated"}
                                  </label>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(amendmentType)}
                                  disabled={amendmentType.status !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="text-center">
                              No amendment type data found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* PAGINATION USING REUSABLE COMPONENT */}
                  {filteredAmendmentTypes.length > 0 && (
                    <Pagination
                      totalItems={filteredAmendmentTypes.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="form-group col-md-4">
                    <label>Code <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="amendmentTypeCode"
                      placeholder="Amendment Type Code"
                      value={formData.amendmentTypeCode}
                      onChange={handleInputChange}
                      maxLength={AMENDMENT_TYPE_CODE_MAX_LENGTH}
                      required
                    />
                  </div>
                  <div className="form-group col-md-4">
                    <label>Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="amendmentTypeName"
                      placeholder="Amendment Type Name"
                      value={formData.amendmentTypeName}
                      onChange={handleInputChange}
                      maxLength={AMENDMENT_TYPE_NAME_MAX_LENGTH}
                      required
                    />
                  </div>
                  <div className="form-group col-md-12 mt-3">
                    <label>Description</label>
                    <textarea
                      className="form-control mt-1"
                      id="description"
                      placeholder="Amendment Type Description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      maxLength={DESCRIPTION_MAX_LENGTH}
                    />
                  </div>
                  <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                    <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                      Save
                    </button>
                    <button type="button" className="btn btn-danger" onClick={handleBack}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {showModal && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h1 className="modal-title fs-5" id="staticBackdropLabel">Reports</h1>
                        <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                      </div>
                      <div className="modal-body">
                        <p>Reports functionality would go here.</p>
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
                          <strong>{confirmDialog.amendmentTypeName}</strong>?
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

export default LabResultAmendment;