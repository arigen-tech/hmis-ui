
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { MAS_OPTH_SPECTACLE_USE } from "../../../config/apiConfig";
import { getRequest, postRequest, putRequest } from "../../../service/apiService";
import {FETCH_SPECTACLE_USE_ERR_MSG, ADD_SPECTACLE_USE_SUCC_MSG,UPDATE_SPECTACLE_USE_SUCC_MSG,FAIL_SPECTACLE_USE,UPDATE_FAIL_SPECTACLE_USE,DUPLICATE_SPECTACLE_USE,} from "../../../config/constants";


const OpthMasSpectacleUse = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({ useName: "" });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    record: null,
    newStatus: "",
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
      const { response } = await getRequest(`${MAS_OPTH_SPECTACLE_USE}/getAll/${flag}`);
      setData(response || []);
    } catch {
      showPopup(FETCH_SPECTACLE_USE_ERR_MSG, "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    fetchData();
  }, []);



  const filteredData = data.filter((rec) =>
    (rec?.useName ?? "").toLowerCase().includes(searchQuery.toLowerCase())
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
    setFormData({ useName: "" });
    setEditingRecord(null);
    setIsFormValid(false);
  };


  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };



  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid || saving) return;

    const newName = formData.useName.trim().toLowerCase();
    const duplicate = data.find(
      (rec) =>
        rec.useName?.trim().toLowerCase() === newName &&
        (!editingRecord || rec.id !== editingRecord.id)
    );

    if (duplicate) {
      showPopup(DUPLICATE_SPECTACLE_USE, "error");
      return;
    }

    setSaving(true);
    try {
      if (editingRecord) {
        await putRequest(`${MAS_OPTH_SPECTACLE_USE}/update/${editingRecord.id}`, {
          useName: formData.useName.trim(),
        });
        showPopup(UPDATE_SPECTACLE_USE_SUCC_MSG, "success");
      } else {
        await postRequest(`${MAS_OPTH_SPECTACLE_USE}/create`, {
          useName: formData.useName.trim(),
          status: "y",
        });
        showPopup(ADD_SPECTACLE_USE_SUCC_MSG, "success");
      }
      fetchData();
      handleCancel();
    } catch (error) {
      console.error("Save error:", error);
      showPopup(FAIL_SPECTACLE_USE, "error");
    } finally {
      setSaving(false);
    }
  };


  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({ useName: rec.useName || "" });
    setIsFormValid(true);
    setShowForm(true);
  };


  const handleSwitchChange = (rec) => {
    setConfirmDialog({
      isOpen: true,
      record: rec,
      newStatus: rec.status?.toLowerCase() === "y" ? "n" : "y",
    });
  };


  const handleConfirm = async (confirmed) => {
    if (!confirmed) {
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
      return;
    }
    if (!confirmDialog.record) return;

    setSaving(true);
    try {
      await putRequest(
        `${MAS_OPTH_SPECTACLE_USE}/status/${confirmDialog.record.id}?status=${confirmDialog.newStatus}`
      );
      showPopup(UPDATE_SPECTACLE_USE_SUCC_MSG, "success");
      fetchData();
    } catch {
      showPopup(UPDATE_FAIL_SPECTACLE_USE, "error");
    } finally {
      setSaving(false);
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
          <h4>Spectacle Use Master</h4>
          <div className="d-flex align-items-center">
            {!showForm && (
              <input
                type="text"
                style={{ width: "220px" }}
                className="form-control me-2"
                placeholder="Search"
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
                    <th>Spectacle Use</th>
                    <th>Last Updated</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((rec) => (
                    <tr key={rec.id}>
                      <td>{rec.useName}</td>
                      <td>{formatDate(rec.lastUpdateDate)}</td>
                      <td>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={rec.status?.toLowerCase() === "y"}
                            onChange={() => handleSwitchChange(rec)}
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
                  ))}
                </tbody>
              </table>

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
            <form onSubmit={handleSave} className="row g-3">
              <div className="col-md-5">
                <label>
                  Spectacle Use <span className="text-danger"></span>
                </label>
                <input
                  id="useName"
                  className="form-control"
                  value={formData.useName}
                  onChange={handleInputChange}
                  autoFocus
                  disabled={saving}
                />
              </div>

              <div className="col-12 text-end">
                <button
                  type="submit"
                  className="btn btn-primary me-2"
                  disabled={!isFormValid || saving}
                >
                  {saving ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-1"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Saving...
                    </>
                  ) : editingRecord ? (
                    "Update"
                  ) : (
                    "Save"
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleCancel}
                  disabled={saving}
                >
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
                    <strong>{confirmDialog.record?.useName}</strong>?
                  </div>
                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleConfirm(false)}
                      disabled={saving}
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

export default OpthMasSpectacleUse;