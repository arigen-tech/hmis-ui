import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import LoadingScreen from "../../../Components/Loading";
import { MAS_DISCHARGE_REASON } from "../../../config/apiConfig";
import {
  FETCH_DISCHARGE_REASON_ERR_MSG,
  SAVE_DISCHARGE_REASON_SUCC_MSG,
  UPDATE_DISCHARGE_REASON_SUCC_MSG,
  DUPLICATE_DISCHARGE_REASON_MSG,
  FAILED_SAVE_DISCHARGE_REASON_MSG,
  FAILED_UPDATE_DISCHARGE_REASON_STATUS_MSG,
} from "../../../config/constants";

const PatientDischargeReason = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    reasonCode: "",
    reasonName: "",
  });
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    record: null,
    newStatus: "",
  });

  // --------------------------------------------------------------
  // API Calls
  // --------------------------------------------------------------
  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const response = await getRequest(`${MAS_DISCHARGE_REASON}/getAll/${flag}`);
      if (response?.response) {
        setData(response.response);
      } else {
        throw new Error("Invalid response structure");
      }
    } catch (err) {
      showPopup(FETCH_DISCHARGE_REASON_ERR_MSG, "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(0); // 0 = all reasons (active & inactive)
  }, []);

  // --------------------------------------------------------------
  // Form Validation
  // --------------------------------------------------------------
  const validateForm = (values) => {
    return values.reasonCode && values.reasonName;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    setIsFormValid(validateForm(updated));
  };

  const resetForm = () => {
    setFormData({
      reasonCode: "",
      reasonName: "",
    });
    setIsFormValid(false);
  };

  // --------------------------------------------------------------
  // CRUD Handlers
  // --------------------------------------------------------------
  const handleSuccessAndClose = () => {
    fetchData(0);           // refresh table
    resetForm();
    setEditingRecord(null);
    setShowForm(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    // Local duplicate check
    const duplicate = data.some(
      (rec) =>
        (rec.reasonCode.toLowerCase() === formData.reasonCode.trim().toLowerCase() ||
          rec.reasonName.toLowerCase() === formData.reasonName.trim().toLowerCase()) &&
        (!editingRecord || rec.id !== editingRecord.id)
    );
    if (duplicate) {
      showPopup(DUPLICATE_DISCHARGE_REASON_MSG, "error");
      return;
    }

    setLoading(true);
    const payload = {
      reasonCode: formData.reasonCode.trim(),
      reasonName: formData.reasonName.trim(),
    };

    try {
      if (editingRecord) {
        const response = await putRequest(
          `${MAS_DISCHARGE_REASON}/update/${editingRecord.id}`,
          payload
        );
        if (response?.status === 200) {
          showPopup(UPDATE_DISCHARGE_REASON_SUCC_MSG, "success", handleSuccessAndClose);
        } else {
          throw new Error(response?.message || "Update failed");
        }
      } else {
        const response = await postRequest(`${MAS_DISCHARGE_REASON}/create`, payload);
        if (response?.status === 201 || response?.status === 200) {
          showPopup(SAVE_DISCHARGE_REASON_SUCC_MSG, "success", handleSuccessAndClose);
        } else {
          throw new Error(response?.message || "Save failed");
        }
      }
    } catch (err) {
      console.error("Save error:", err);
      showPopup(err.response?.data?.message || FAILED_SAVE_DISCHARGE_REASON_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({
      reasonCode: rec.reasonCode,
      reasonName: rec.reasonName,
    });
    setShowForm(true);
    setIsFormValid(true);
  };

  const handleStatusChange = (rec) => {
    setConfirmDialog({
      isOpen: true,
      record: rec,
      newStatus: rec.status?.toUpperCase() === "Y" ? "N" : "Y",
    });
  };

  const handleConfirmStatus = async (confirmed) => {
    if (!confirmed || !confirmDialog.record) {
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
      return;
    }

    const record = confirmDialog.record;
    const newStatus = confirmDialog.newStatus;
    setLoading(true);
    try {
      const response = await putRequest(
        `${MAS_DISCHARGE_REASON}/status/${record.id}?status=${newStatus}`
      );
      if (response?.status === 200) {
        showPopup(
          `Discharge Reason "${record.reasonName}" ${
            newStatus === "Y" ? "activated" : "deactivated"
          } successfully!`,
          "success",
          () => fetchData(0)
        );
      } else {
        throw new Error(response?.message || "Status update failed");
      }
    } catch (err) {
      showPopup(FAILED_UPDATE_DISCHARGE_REASON_STATUS_MSG, "error");
    } finally {
      setLoading(false);
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
    }
  };

  // --------------------------------------------------------------
  // UI Helpers
  // --------------------------------------------------------------
  const showPopup = (message, type = "info", onCloseCallback = null) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
        if (onCloseCallback) onCloseCallback();
      },
    });
  };

  const handleCancel = () => {
    resetForm();
    setEditingRecord(null);
    setShowForm(false);
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchData(0);
  };

  // Search & Pagination
  const filteredData = (data || []).filter(
    (rec) =>
      rec.reasonName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.reasonCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Patient Discharge Reason</h4>
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
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <span className="input-group-text" id="search-icon">
                        <i className="fa fa-search"></i>
                      </span>
                    </div>
                  </form>
                ) : null}
                <div className="d-flex align-items-center ms-auto">
                  {!showForm ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={() => {
                          resetForm();
                          setEditingRecord(null);
                          setShowForm(true);
                        }}
                        disabled={loading}
                      >
                        <i className="mdi mdi-plus"></i> Add
                      </button>
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={handleRefresh}
                        disabled={loading}
                      >
                        <i className="mdi mdi-refresh"></i> Show All
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      <i className="mdi mdi-arrow-left"></i> Back
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="card-body">
              {loading && !showForm ? (
                <LoadingScreen />
              ) : !showForm ? (
                <>
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Reason Code</th>
                          <th>Reason Name</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((rec) => (
                            <tr key={rec.id}>
                              <td>{rec.reasonCode}</td>
                              <td>{rec.reasonName}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={rec.status?.toUpperCase() === "Y"}
                                    onChange={() => handleStatusChange(rec)}
                                    id={`switch-${rec.id}`}
                                    disabled={loading}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${rec.id}`}
                                  >
                                    {rec.status?.toUpperCase() === "Y" ? "Active" : "Deactivated"}
                                  </label>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(rec)}
                                  disabled={rec.status?.toUpperCase() !== "Y" || loading}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center">
                              No discharge reasons found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {filteredData.length > 0 && (
                    <Pagination
                      totalItems={filteredData.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="row">
                    <div className="form-group col-md-4 mb-2">
                      <label>
                        Reason Code <span className="text-danger">*</span>
                      </label>
                      <input
                        className="form-control mt-1"
                        name="reasonCode"
                        type="text"
                        value={formData.reasonCode}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                        placeholder="Enter code"
                      />
                    </div>
                    <div className="form-group col-md-4 mb-2">
                      <label>
                        Reason Name <span className="text-danger">*</span>
                      </label>
                      <input
                        className="form-control mt-1"
                        name="reasonName"
                        type="text"
                        value={formData.reasonName}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                        placeholder="Enter name"
                      />
                    </div>
                  </div>
                  <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid || loading}
                    >
                      {loading ? "Saving..." : editingRecord ? "Update" : "Save"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleCancel}
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
                <div className="modal d-block">
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button
                          type="button"
                          className="close"
                          onClick={() => handleConfirmStatus(false)}
                        >
                          <span>&times;</span>
                        </button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to{" "}
                          {confirmDialog.newStatus === "Y" ? "activate" : "deactivate"}{" "}
                          <strong>{confirmDialog.record?.reasonName}</strong>?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleConfirmStatus(false)}
                        >
                          No
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleConfirmStatus(true)}
                        >
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

export default PatientDischargeReason;