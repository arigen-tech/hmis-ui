import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";

const AdmissionStatusMaster = () => {
  const [data, setData] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, id: null, newStatus: "" });
  const [loading] = useState(false);
  const [formData, setFormData] = useState({ status_code: "", created_by: "", last_updated_by: "" });
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // ================= SAMPLE DATA =================
  useEffect(() => {
    const sample = [
      { id: 1, status_code: "ACTIVE", status: "Y", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-01-10" },
      { id: 2, status_code: "DISCHARGED_HOME", status: "Y", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-01-09" },
      { id: 3, status_code: "DISCHARGED_OTHER", status: "Y", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-01-08" },
      { id: 4, status_code: "DECEASED", status: "N", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-01-07" },
      { id: 5, status_code: "CANCELLED", status: "Y", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-01-06" },
      { id: 6, status_code: "REFERRED", status: "Y", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-01-05" },
      { id: 7, status_code: "TRANSFERRED", status: "Y", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-01-04" },
      { id: 8, status_code: "WAITING", status: "N", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-01-03" },
      { id: 9, status_code: "UNDER_OBSERVATION", status: "Y", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-01-02" },
      { id: 10, status_code: "RE_ADMITTED", status: "Y", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-01-01" },
    ];
    setData(sample);
  }, []);

  // ================= SEARCH =================
  const filteredData = data.filter((rec) =>
    rec.status_code.toLowerCase().includes(searchQuery.toLowerCase())
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

  // ================= SAVE / UPDATE =================
  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const duplicate = data.some(
      (rec) =>
        rec.status_code.toLowerCase() === formData.status_code.toLowerCase() &&
        (!editingRecord || editingRecord.id !== rec.id)
    );

    if (duplicate) {
      showPopup("Status Code already exists!", "error");
      return;
    }

    const now = new Date().toLocaleString();

    if (editingRecord) {
      const updated = data.map((rec) =>
        rec.id === editingRecord.id ? { ...rec, ...formData, last_update_date: now } : rec
      );
      setData(updated);
      showPopup("Record updated successfully!", "success");
    } else {
      const newRecord = { id: Date.now(), ...formData, status: "Y", last_update_date: now };
      setData([...data, newRecord]);
      showPopup("Record added successfully!", "success");
    }

    setShowForm(false);
    setEditingRecord(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ status_code: "", created_by: "", last_updated_by: "" });
    setIsFormValid(false);
  };

  // ================= EDIT =================
  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({ status_code: rec.status_code, created_by: rec.created_by, last_updated_by: rec.last_updated_by });
    setShowForm(true);
    setIsFormValid(true);
  };

  // ================= INPUT CHANGE =================
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const updated = { ...formData, [id]: value };
    setFormData(updated);
    setIsFormValid(updated.status_code.trim() !== "");
  };

  // ================= STATUS CHANGE =================
  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, id, newStatus });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed) {
      const updated = data.map((rec) =>
        rec.id === confirmDialog.id ? { ...rec, status: confirmDialog.newStatus } : rec
      );
      setData(updated);
      showPopup("Status updated!", "success");
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "" });
  };

  // ================= POPUP =================
  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  // ================= PAGINATION =================
  const Pagination = () => (
    <nav>
      <ul className="pagination">
        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
          <button className="page-link" onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}>Prev</button>
        </li>

        {[...Array(totalPages).keys()].map((num) => (
          <li key={num} className={`page-item ${currentPage === num + 1 ? "active" : ""}`}>
            <button className="page-link" onClick={() => setCurrentPage(num + 1)}>{num + 1}</button>
          </li>
        ))}

        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
          <button className="page-link" onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}>Next</button>
        </li>
      </ul>
    </nav>
  );

  // ================= UI =================
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Admission Status Master</h4>

          <div className="d-flex">
            {!showForm && (
              <input
                type="text"
                className="form-control me-2"
                style={{ width: "220px" }}
                placeholder="Search by Status Code"
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
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Back</button>
            )}
          </div>
        </div>

        <div className="card-body">
          {loading ? <LoadingScreen /> : !showForm ? (
            <>
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Status Code</th>
                      <th>Created By</th>
                      <th>Last Updated By</th>
                      <th>Last Update Date</th>
                      <th>Status</th>
                      <th>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((rec) => (
                      <tr key={rec.id}>
                        <td>{rec.id}</td>
                        <td>{rec.status_code}</td>
                        <td>{rec.created_by}</td>
                        <td>{rec.last_updated_by}</td>
                        <td>{rec.last_update_date}</td>
                        <td>
                          <div className="form-check form-switch">
                            <input className="form-check-input" type="checkbox" checked={rec.status === "Y"} onChange={() => handleSwitchChange(rec.id, rec.status === "Y" ? "N" : "Y")} />
                            <label className="form-check-label">{rec.status === "Y" ? "Active" : "Inactive"}</label>
                          </div>
                        </td>
                        <td>
                          <button className="btn btn-success btn-sm" onClick={() => handleEdit(rec)} disabled={rec.status !== "Y"}>
                             <i className="fa fa-pencil"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="d-flex justify-content-center mt-3">
                <Pagination />
              </div>
            </>
          ) : (
            <form className="row" onSubmit={handleSave}>
              <div className="form-group col-md-6">
                <label>Status Code *</label>
                <input type="text" id="status_code" className="form-control mt-1" placeholder="Enter Status Code" value={formData.status_code} onChange={handleInputChange} required />
              </div>

              <div className="form-group col-md-6 mt-3">
                <label>Created By</label>
                <input type="text" id="created_by" className="form-control mt-1" value={formData.created_by} onChange={handleInputChange} />
              </div>

              <div className="form-group col-md-6 mt-3">
                <label>Last Updated By</label>
                <input type="text" id="last_updated_by" className="form-control mt-1" value={formData.last_updated_by} onChange={handleInputChange} />
              </div>

              <div className="form-group col-md-12 mt-4 d-flex justify-content-end">
                <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>Save</button>
                <button className="btn btn-danger" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          )}

          {popupMessage && <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />}

          {confirmDialog.isOpen && (
            <div className="modal d-block">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5>Confirm Status Change</h5>
                    <button className="btn-close" onClick={() => handleConfirm(false)}></button>
                  </div>
                  <div className="modal-body">
                    Are you sure you want to <strong>{confirmDialog.newStatus === "Y" ? "activate" : "deactivate"}</strong> this item?
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
    </div>
  );
};

export default AdmissionStatusMaster;
