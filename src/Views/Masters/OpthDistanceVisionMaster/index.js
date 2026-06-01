import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, postRequest, putRequest } from "../../../service/apiService";
import { MAS_OPTH_DISTANCE } from "../../../config/apiConfig";
import {
  FETC_OPTH_DISTANCE,
  ADD_OPTH_DISTANCE_SUCC_MSG,
  UPDATE_OPTH_DISTANCE_SUCC_MSG,
  FAIL_OPTH_DISTANCE,
  UPDATE_FAIL_OPTH_DISTANCE,
  DUPLICATE_OPTH_DISTANCE,
} from "../../../config/constants";

const OpthDistanceVisionMaster = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({ visionValue: "" });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    name: "",
  });

  const formatDate = (dateString) => {
    if (!dateString?.trim()) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const { response } = await getRequest(`${MAS_OPTH_DISTANCE}/getAll/${flag}`);
      setData(response || []);
    } catch {
      showPopup(FETC_OPTH_DISTANCE, "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = data.filter((rec) =>
    (rec?.visionValue ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentItems = filteredData.slice(
    (currentPage - 1) * DEFAULT_ITEMS_PER_PAGE,
    currentPage * DEFAULT_ITEMS_PER_PAGE
  );

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setIsFormValid(value.trim() !== "");
  };

  const resetForm = () => {
    setFormData({ visionValue: "" });
    setEditingRecord(null);
    setIsFormValid(false);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!isFormValid || saving) {
      return;
    }

    const newValue = formData.visionValue.trim().toLowerCase();
    const duplicate = data.find(
      (rec) =>
        rec.visionValue?.trim().toLowerCase() === newValue &&
        (!editingRecord || rec.id !== editingRecord.id)
    );

    if (duplicate) {
      showPopup(DUPLICATE_OPTH_DISTANCE, "error");
      return;
    }

    setSaving(true);
    
    try {
      if (editingRecord) {
        const response = await putRequest(`${MAS_OPTH_DISTANCE}/update/${editingRecord.id}`, {
          visionValue: formData.visionValue.trim(),
        });

        if (response.status === 200) {
          setPopupMessage({
            message: UPDATE_OPTH_DISTANCE_SUCC_MSG,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              fetchData();
              setShowForm(false);
            }
          });
        } else {
          throw new Error(response.message || "Update failed");
        }
      } else {
        const response = await postRequest(`${MAS_OPTH_DISTANCE}/create`, {
          visionValue: formData.visionValue.trim(),
          status: "y",
        });

        if (response.status === 201 || response.status === 200) {
          setPopupMessage({
            message: ADD_OPTH_DISTANCE_SUCC_MSG,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              fetchData();
              setShowForm(false);
            }
          });
        } else {
          throw new Error(response.message || "Save failed");
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      showPopup(
        error.response?.data?.message || FAIL_OPTH_DISTANCE,
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({ visionValue: rec.visionValue || "" });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSwitchChange = (id, currentStatus, name) => {
    const newStatus = currentStatus === "y" ? "n" : "y";
    setConfirmDialog({ isOpen: true, id, newStatus, name });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.id !== null) {
      setSaving(true);

      try {
        const response = await putRequest(
          `${MAS_OPTH_DISTANCE}/status/${confirmDialog.id}?status=${confirmDialog.newStatus}`
        );

        if (response.status === 200) {
          setPopupMessage({
            message: `Vision value "${confirmDialog.name}" ${
              confirmDialog.newStatus === "y" ? "activated" : "deactivated"
            } successfully!`,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              fetchData();
              setCurrentPage(1);
            },
          });
        } else {
          throw new Error(response.message || "Failed to update status");
        }
      } catch (error) {
        console.error("Error updating status:", error);
        showPopup(UPDATE_FAIL_OPTH_DISTANCE, "error");
      } finally {
        setSaving(false);
      }
    }

    setConfirmDialog({
      isOpen: false,
      id: null,
      newStatus: "",
      name: "",
    });
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchData();
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Opth Distance Vision Master</h4>
              <div className="d-flex align-items-center">
                {!showForm && (
                  <input
                    className="form-control w-50 me-2"
                    placeholder="Search Vision Value"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                )}

                {!showForm ? (
                  <>
                    <button
                      className="btn btn-success me-2"
                      onClick={() => {
                        resetForm();
                        setShowForm(true);
                      }}
                    >
                      Add
                    </button>
                    <button className="btn btn-success flex-shrink-0" onClick={handleRefresh}>
                      Show All
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-secondary"
                    onClick={handleCancel}
                  >
                    Back
                  </button>
                )}
              </div>
            </div>

            <div className="card-body">
              {loading && !showForm && <LoadingScreen />}

              {!showForm && !loading && (
                <>
                  <table className="table table-bordered table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Vision Value</th>
                        <th>Last Updated Date</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.length > 0 ? (
                        currentItems.map((rec) => (
                          <tr key={rec.id}>
                            <td>{rec.visionValue}</td>
                            <td>{formatDate(rec.lastUpdateDate)}</td>
                            <td>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={rec.status?.toLowerCase() === "y"}
                                  onChange={() =>
                                    handleSwitchChange(rec.id, rec.status?.toLowerCase(), rec.visionValue)
                                  }
                                  id={`switch-${rec.id}`}
                                />
                                <label
                                  className="form-check-label ms-2"
                                  htmlFor={`switch-${rec.id}`}
                                >
                                  {rec.status?.toLowerCase() === "y" ? "Active" : "Inactive"}
                                </label>
                              </div>
                            </td>
                            <td>
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleEdit(rec)}
                                disabled={rec.status?.toLowerCase() !== "y"}
                              >
                                <i className="fa fa-pencil"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center">
                            No Records Found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <Pagination
                    totalItems={filteredData.length}
                    itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                  />
                </>
              )}

              {showForm && (
                <form className="row" onSubmit={handleSave}>
                  <div className="form-group col-md-6">
                    <label>
                      Vision Value <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="visionValue"
                      className="form-control mt-1"
                      value={formData.visionValue}
                      onChange={handleInputChange}
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="form-group col-md-12 mt-3 d-flex justify-content-end">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid || saving}
                    >
                      {saving ? "Saving..." : editingRecord ? "Update" : "Save"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleCancel}
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
                <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-body">
                        Are you sure you want to{" "}
                        {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                        <strong>{confirmDialog.name}</strong>?
                      </div>
                      <div className="modal-footer">
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleConfirm(false)}
                        >
                          No
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleConfirm(true)}
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

export default OpthDistanceVisionMaster;