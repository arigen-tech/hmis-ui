
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_OPTH_COLOR_VISION } from "../../../config/apiConfig";
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const OpthColorVisionMaster = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({ colorValue: "" });
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE;

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    record: null,
    newStatus: "",
  });

  const MAX_LENGTH = 20;

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
      const { response } = await getRequest(`${MAS_OPTH_COLOR_VISION}/getAll/${flag}`);
      setData(response || []);
    } catch {
      showPopup("Failed to fetch records", "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = data.filter((rec) =>
    (rec?.colorValue ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setFormData({ colorValue: value });
    setIsFormValid(value.trim() !== "");
  };

  const resetForm = () => {
    setFormData({ colorValue: "" });
    setIsFormValid(false);
  };

  const handleCancel = () => {
    resetForm();
    setEditingRecord(null);
    setShowForm(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const newValue = formData.colorValue.trim().toLowerCase();
    const duplicate = data.find(
      (rec) =>
        rec.colorValue?.trim().toLowerCase() === newValue &&
        (!editingRecord || rec.id !== editingRecord.id)
    );

    if (duplicate) {
      showPopup("Color value already exists!", "error");
      return;
    }

    try {
      if (editingRecord) {
        await putRequest(`${MAS_OPTH_COLOR_VISION}/update/${editingRecord.id}`, {
          ...editingRecord,
          colorValue: formData.colorValue.trim(),
        });
        showPopup("Record updated successfully", "success");
      } else {
        await postRequest(`${MAS_OPTH_COLOR_VISION}/create`, {
          colorValue: formData.colorValue.trim(),
          status: "Y",
        });
        showPopup("Record added successfully", "success");
      }
      fetchData();
      handleCancel();
    } catch {
      showPopup("Save failed", "error");
    }
  };

  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({ colorValue: rec.colorValue || "" });
    setShowForm(true);
    setIsFormValid(true);
  };

  const handleSwitchChange = (rec) => {
    setConfirmDialog({
      isOpen: true,
      record: rec,
      newStatus: rec.status === "y" ? "n" : "y",
    });
  };

  const handleConfirm = async (confirmed) => {
    if (!confirmed) {
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
      return;
    }
    const { record, newStatus } = confirmDialog;
    try {
      setLoading(true);
      await putRequest(`${MAS_OPTH_COLOR_VISION}/status/${confirmDialog.record.id}?status=${confirmDialog.newStatus}`);
      showPopup("Status updated successfully", "success");
      fetchData();
    } catch {
      showPopup("Status update failed", "error");
    } finally {
      setLoading(false);
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
    }
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
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Opth Color Vision Master</h4>
          <div className="d-flex">
            {!showForm && (
              <input
                className="form-control me-2"
                style={{ width: "220px" }}
                placeholder="Search Vision Test"
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
                    setEditingRecord(null);
                  }}
                >
                  Add
                </button>
                <button className="btn btn-success" onClick={handleRefresh}>
                  Show All
                </button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
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
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Color Value</th>
                      <th>Last Update Date</th>
                      <th>Status</th>
                      <th>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((rec) => (
                      <tr key={rec.id}>
                        <td>{rec.colorValue}</td>
                        <td>{formatDate(rec.lastUpdateDate)}</td>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={rec.status === "y"}
                              onChange={() => handleSwitchChange(rec)}
                            />
                            <label className="form-check-label px-0">
                              {rec.status  === "y"
                                ? "Active"
                                : "Inactive"}
                            </label>
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleEdit(rec)}
                            disabled={rec.status !== "y"}
                          >
                            <i className="fa fa-pencil"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredData.length > 0 && (
                <Pagination
                  totalItems={filteredData.length}
                  itemsPerPage={itemsPerPage}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          ) : (
            <form className="row" onSubmit={handleSave}>
              <div className="form-group col-md-4">
                <label>
                  Color Value <span className="text-danger">*</span>
                </label>
                <input
                  id="colorValue"
                  className="form-control"
                  value={formData.colorValue}
                  onChange={handleInputChange}
                  maxLength={MAX_LENGTH}
                />
              </div>

              <div className="form-group col-md-12 mt-4 d-flex justify-content-end">
                <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                  Save
                </button>
                <button type="button" className="btn btn-danger" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {popupMessage && <Popup {...popupMessage} />}

          {confirmDialog.isOpen && (
            <div className="modal d-block">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-body">
                    Are you sure you want to{" "}
                    {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                    <strong>{confirmDialog.record?.colorValue}</strong>?
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => handleConfirm(false)}>
                      No
                    </button>
                    <button className="btn btn-primary" onClick={() => handleConfirm(true)}>
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
  );
};

export default OpthColorVisionMaster;
