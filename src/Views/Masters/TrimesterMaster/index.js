import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_OB_TRIMESTER } from "../../../config/apiConfig";
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import {FETCH_TRIME_STER,DUPLICATE_TRIME_STER,UPDATE_TRIME_STER, ADD_TRIME_STER,FAIL_TRIME_STER,FAIL_UPDATE_TRIME_STER} from "../../../config/constants";


const TrimesterMaster = () => {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ trimesterValue: "" });
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ================= PAGINATION =================
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE;


  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    reccord: null,
    newStatus: "",
  });


  const MAX_LENGTH = 20;


  // Date
  const formatDate = (dateString) => {
    if (!dateString?.trim()) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };


  // fetchData
  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const { response } = await getRequest(`${MAS_OB_TRIMESTER}/getAll/${flag}`);
      setData(response || []);
    } catch {
      showPopup(FETCH_TRIME_STER, "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, []);


  // ================= SEARCH =================
  const filteredData = data.filter((rec) =>
    (rec?.trimesterValue ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );


  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };


  // ================= FORM =================

  const handleInputChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, trimesterValue: value }));
    setIsFormValid(value.trim() !== "");
  };


  const resetForm = () => {
    setFormData({ trimesterValue: "" });
    setIsFormValid(false);
  };

  const handleCancel = () => {
    resetForm();
    setEditingRecord(null);
    setShowForm(false);
  };


  // ================= SAVE =================
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const newValue = formData.trimesterValue.trim().toLowerCase();
    const duplicate = data.find(
      (rec) =>
        rec.trimesterValue?.trim().toLowerCase() === newValue &&
        (!editingRecord || rec.id !== editingRecord.id)
    );

    if (duplicate) {
      showPopup(DUPLICATE_TRIME_STER, "error");
      return;
    }

    try {
      if (editingRecord) {
        await putRequest(`${MAS_OB_TRIMESTER}/update/${editingRecord.id}`, {
          ...editingRecord,
          trimesterValue: formData.trimesterValue.trim(),
        });
        showPopup("UPDATE_TRIME_STER", "success");
      } else {
        await postRequest(`${MAS_OB_TRIMESTER}/create`, {
          trimesterValue: formData.trimesterValue.trim(),
          status: "y",
        });
        showPopup(ADD_TRIME_STER, "success");
      }
      fetchData();
      handleCancel();
    } catch {
      showPopup(FAIL_TRIME_STER, "error");
    }
  };

  // ================= EDIT =================
  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({ trimesterValue: rec.trimesterValue || "" });
    setShowForm(true);
    setIsFormValid(true);
  };


  // ================= STATUS =================
  const handleSwitchChange = (rec) => {
    setConfirmDialog({
      isOpen: true,
      reccord: rec,
      newStatus: rec.status === "y" ? "n" : "y",
    });
  };


  const handleConfirm = async (confirmed) => {
    if (!confirmed) {
      setConfirmDialog({ isOpen: false, reccord: null, newStatus: "" });
      return;
    }

    try {
      setLoading(true);
      await putRequest(`${MAS_OB_TRIMESTER}/status/${confirmDialog.reccord.id}?status=${confirmDialog.newStatus}`
      );
      showPopup(UPDATE_TRIME_STER, "success");
      fetchData();
    } catch {
      showPopup(FAIL_UPDATE_TRIME_STER, "error");
    } finally {
      setLoading(false);
      setConfirmDialog({ isOpen: false, reccord: null, newStatus: "" });
    }
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };


  // ================= UI =================
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Trimester Master</h4>
          <div className="d-flex">
            {!showForm && (
              <input
                type="text"
                style={{ width: "220px" }}
                className="form-control me-2"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            )}

            {!showForm ? (
              <>
                <button className="btn btn-success me-2" onClick={() => { resetForm(); setShowForm(true); setEditingRecord(null); }}>Add</button>
                <button className="btn btn-success" onClick={handleRefresh}>Show All</button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Back
              </button>
            )}
          </div>
        </div>

        <div className="card-body">
          {!showForm && (
            <>
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Trimester value</th>
                    <th>last Update Date</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((rec) => (
                    <tr key={rec.id}>
                      <td>{rec.trimesterValue}</td>
                      <td>{formatDate(rec.lastUpdateDate)}</td>
                      <td>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={rec.status === "y"}
                            onChange={() => handleSwitchChange(rec)}
                          />
                          <label className="form-check-label ms-2">
                            {rec.status === "y" ? "Active" : "Inactive"}
                          </label>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-success btn-sm"
                          disabled={rec.status !== "y"}
                          onClick={() => handleEdit(rec)}
                        >
                          <i className="fa fa-pencil"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* PAGINATION */}
              {filteredData.length > 0 && (
                <Pagination
                  totalItems={filteredData.length}
                  itemsPerPage={itemsPerPage}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              )}

            </>
          )}

          {/* ================= FORM ================= */}
          {showForm && (
            <form onSubmit={handleSave} className="row g-3">
              <div className="col-md-5">
                <label>Trimester value <span className="text-danger">*</span></label>
                <input
                  id="trimesterCode"
                  className="form-control"
                  value={formData.trimesterValue}
                  onChange={handleInputChange}
                  maxLength={MAX_LENGTH}
                />
              </div>

              <div className="col-12 text-end">
                <button className="btn btn-primary me-2" disabled={!isFormValid}>Save</button>
                <button type="button" className="btn btn-danger" onClick={() => setShowForm(false)}>Cancel</button>
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
                    <strong>{confirmDialog.reccord?.trimesterValue}</strong>

                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => handleConfirm(false)}>No</button>
                    <button className="btn btn-primary" onClick={() => handleConfirm(true)}>Yes</button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div >
  );
}
export default TrimesterMaster;
