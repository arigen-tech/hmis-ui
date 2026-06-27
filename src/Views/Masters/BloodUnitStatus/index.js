import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_BLOOD_UNIT } from "../../../config/apiConfig";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import {
  FETCH_BLOOD_UNIT,
  DUPLICATE_BLOOD_UNIT,
  UPDATE_BLOOD_UNIT,
  ADD_BLOOD_UNIT,
  FAIL_BLOOD_UNIT,
  UPDATE_FAIL_BLOOD_UNIT,
} from "../../../config/constants";

const BloodUnitStatus = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    statusCode: "",
    statusName: "",
    description: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    record: null,
    newStatus: "",
  });

  // Format date utility
  const formatDate = (dateString) => {
    if (!dateString?.trim()) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Fetch data
  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const { response } = await getRequest(`${MAS_BLOOD_UNIT}/getAll/${flag}`);
      setData(response || []);
    } catch {
      showPopup(FETCH_BLOOD_UNIT, "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Search & Pagination
  const filteredData = data.filter((rec) =>
    rec.statusName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentItems = filteredData.slice(
    (currentPage - 1) * DEFAULT_ITEMS_PER_PAGE,
    currentPage * DEFAULT_ITEMS_PER_PAGE
  );

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Popup helper
  const showPopup = (message, type, onCloseCallback = null) => {
    setPopupMessage({ message, type, onClose: () => {
                setPopupMessage(null);
                if (onCloseCallback) onCloseCallback();
            } });
  };

  // Form reset
  const resetForm = () => {
    setFormData({ statusCode: "", statusName: "", description: "" });
    setIsFormValid(false);
    setEditingRecord(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  // Form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    setIsFormValid(updated.statusCode.trim() !== "" && updated.statusName.trim() !== "");
  };

  // Save (Add or Update)
  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!isFormValid) return;
    
    setSaving(true);

    const newCode = formData.statusCode.trim().toLowerCase();
    const newName = formData.statusName.trim().toLowerCase();

    const duplicate = data.find(
      (rec) =>
        (rec.statusCode?.trim().toLowerCase() === newCode ||
          rec.statusName?.trim().toLowerCase() === newName) &&
        (!editingRecord || rec.statusId !== editingRecord.statusId)
    );

    if (duplicate) {
      showPopup(DUPLICATE_BLOOD_UNIT, "error");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        statusCode: formData.statusCode.trim(),
        statusName: formData.statusName.trim(),
        description: formData.description.trim(),
      };

      if (editingRecord) {
        const response = await putRequest(
          `${MAS_BLOOD_UNIT}/update/${editingRecord.statusId}`,
          payload
        );

        if (response.status === 200) {
          setPopupMessage({
            message: UPDATE_BLOOD_UNIT,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              setShowForm(false);
            }
          });
        } else {
          throw new Error(response.message || "Update failed");
        }
      } else {
        const response = await postRequest(
          `${MAS_BLOOD_UNIT}/create`,
          {
            ...payload,
            status: "y",
          }
        );

        if (response.status === 201 || response.status === 200) {
          setPopupMessage({
            message: ADD_BLOOD_UNIT,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              setShowForm(false);
            }
          });
        } else {
          throw new Error(response.message || "Save failed");
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      showPopup(FAIL_BLOOD_UNIT, "error");
    } finally {
      setSaving(false);
    }
  };

  // Edit button handler (always enabled)
  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({
      statusCode: rec.statusCode,
      statusName: rec.statusName,
      description: rec.description || "",
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  // Status toggle confirmation
  const handleSwitchChange = (rec) => {
    setConfirmDialog({
      isOpen: true,
      record: rec,
      newStatus: rec.status?.toLowerCase() === "y" ? "n" : "y",
    });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.record) {
      setSaving(true);

      try {
        const response = await putRequest(
          `${MAS_BLOOD_UNIT}/status/${confirmDialog.record.statusId}?status=${confirmDialog.newStatus}`
        );

        if (response && response.status === 200) {
          setPopupMessage({
            message: `Blood Unit Status "${
              confirmDialog.record.statusName
            }" ${
              confirmDialog.newStatus?.toLowerCase() === "y" ? "activated" : "deactivated"
            } successfully!`,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              fetchData();
              setCurrentPage(1);
            },
          });
        } else {
          throw new Error(response.message || "Failed to update status");
        }
      } catch (error) {
        console.error("Error updating status:", error);
        showPopup(UPDATE_FAIL_BLOOD_UNIT, "error");
      } finally {
        setSaving(false);
      }
    }

    setConfirmDialog({
      isOpen: false,
      record: null,
      newStatus: "",
    });
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchData();
  };

  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Blood Unit Status</h4>
          <div className="d-flex">
            {!showForm && (
              <input
                style={{ width: "220px" }}
                className="form-control me-2"
                placeholder="Search "
                value={searchQuery}
                onChange={handleSearchChange}
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
                <button className="btn btn-success" onClick={handleRefresh}>
                  Show All
                </button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={handleCancel}>
                Back
              </button>
            )}
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <LoadingScreen />
          ) : !showForm ? (
            <>
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Unit Code</th>
                    <th>Unit Status</th>
                    <th>Description</th>
                    <th>Last Update Date</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((rec) => (
                    <tr key={rec.statusId}>
                      <td>{rec.statusCode}</td>
                      <td>{rec.statusName}</td>
                      <td>{rec.description}</td>
                      <td>{formatDate(rec.lastUpdateDate)}</td>
                      <td>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={rec.status?.toLowerCase() === "y"}
                            onChange={() => handleSwitchChange(rec)}
                          />
                          <label className="form-check-label ms-2">
                            {rec.status?.toLowerCase() === "y" ? "Active" : "Inactive"}
                          </label>
                        </div>
                      </td>
                      <td>
                        {/* Edit button is always enabled */}
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleEdit(rec)}
                        >
                          <i className="fa fa-pencil"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Pagination
                totalItems={filteredData.length}
                itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </>
          ) : (
            <form onSubmit={handleSave} className="row g-3">
             
              <div className="col-md-3">
                <label>
                  Unit Code <span className="text-danger">*</span>
                </label>
                <input
                  name="statusCode"
                  className="form-control"
                  value={formData.statusCode}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-3">
                <label>
                  Unit Status <span className="text-danger">*</span>
                </label>
                <input
                  name="statusName"
                  className="form-control"
                  value={formData.statusName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-3">
                <label>Description</label>
                <textarea
                  name="description"
                  className="form-control"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              <div className="col-12 text-end">
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

          {popupMessage && <Popup {...popupMessage} />}

          {confirmDialog.isOpen && (
            <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-body">
                    Are you sure you want to{" "}
                    {confirmDialog.newStatus?.toLowerCase() === "y" ? "activate" : "deactivate"}{" "}
                    <strong>{confirmDialog.record?.statusName}</strong>?
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
                      disabled={saving}
                    >
                      {saving ? "Processing..." : "Yes"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BloodUnitStatus;