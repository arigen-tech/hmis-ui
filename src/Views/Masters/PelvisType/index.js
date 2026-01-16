import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_OP_PELVIS_TYPE } from "../../../config/apiConfig";
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";


const PelvisType = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);


  const [formData, setFormData] = useState({ pelvisType: "" });
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ================= PAGINATION =================
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    reccord: null,
    newStatus: "",
  });

  const MAX_LENGTH = 20;




  //  Date
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
      const { response } = await getRequest(`${MAS_OP_PELVIS_TYPE}/getAll/${flag}`);
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



  // ================= SEARCH =================


  const filteredData = data.filter((rec) =>
    (rec?.pelvisType ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );


  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

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
    const  value = e.target.value;
    setFormData({ pelvisType: value });
    setIsFormValid(value.trim() !== "");
  };




  const resetForm = () => {
    setFormData({ pelvisType: "" });
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


    const newValue = formData.pelvisType.trim().toLowerCase();
    const duplicate = data.find(
      (rec) =>
        rec.pelvisType?.trim().toLowerCase() === newValue &&
        (!editingRecord || rec.id !== editingRecord.id)
    );

    if (duplicate) {
      showPopup("Pelvis Type already exists!", "error");
      return;
    }


    try {
      if (editingRecord) {
        await putRequest(`${MAS_OP_PELVIS_TYPE}/update/${editingRecord.id}`, {
          ...editingRecord,
          pelvisType: formData.pelvisType.trim(),
        });
        showPopup("Record updated successfully", "success");
      } else {
        await postRequest(`${MAS_OP_PELVIS_TYPE}/create`, {
          pelvisType: formData.pelvisType.trim(),
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


  // ================= EDIT =================
  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({ pelvisType: rec.pelvisType || "" });
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

    const { record, newStatus } = confirmDialog;
    try {
      setLoading(true);
      await putRequest(`${MAS_OP_PELVIS_TYPE}/status/${confirmDialog.reccord.id}?status=${confirmDialog.newStatus}`);
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


  // ================= UI =================
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Pelvis Type Master</h4>
          <div className="d-flex">
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
                <button className="btn btn-success me-2"  onClick={() => { resetForm(); setShowForm(true); setEditingRecord(null);}}>Add</button>

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
          {loading ? (
            <LoadingScreen />
          ) : !showForm ? (
            <>
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Pelvis Type Code</th>
                    <th>Last Update Date</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((rec) => (
                    <tr key={rec.id}>
                      <td>{rec.pelvisType}</td>
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
          ) : (
            <form onSubmit={handleSave} className="row g-3">
              <div className="col-md-5">
                <label>Pelvis Type<span className="text-danger">*</span></label>
                <input
                  id="pelvisType"
                  className="form-control"
                  value={formData.pelvisType}
                  onChange={handleInputChange}
                  maxLength={MAX_LENGTH}
                />
              </div>

              <div className="col-12 text-end">
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
                    <strong>{confirmDialog.reccord?.pelvisType}</strong>?
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

export default PelvisType;
