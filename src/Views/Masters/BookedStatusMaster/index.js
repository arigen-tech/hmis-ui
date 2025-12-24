import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";

const BookedStatusMaster = () => {
  const [data, setData] = useState([]);
  const [loading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    statusName: ""
  });

  const [formData, setFormData] = useState({
    id: "",
    value: "",
    description: "",
    status: "Y",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ================= PAGINATION =================
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");
  const itemsPerPage = 5;

  // ================= SAMPLE DATA =================
  useEffect(() => {
    const sampleData = [
      { id: 1, value: "Booked", description: "Appointment booked", status: "Y", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-12-01 08:30:00" },
      { id: 2, value: "Cancelled", description: "Appointment cancelled", status: "Y", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-12-02 09:15:00" },
      { id: 3, value: "Completed", description: "Appointment completed", status: "Y", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-12-03 10:00:00" },
      { id: 4, value: "Rescheduled", description: "Appointment rescheduled", status: "N", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-12-04 10:45:00" },
      { id: 5, value: "No Show", description: "Patient not arrived", status: "Y", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-12-05 11:30:00" },
      { id: 6, value: "Confirmed", description: "Appointment confirmed", status: "Y", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-12-06 12:00:00" },
    ];
    setData(sampleData);
  }, []);

  // ================= SEARCH =================
  const filteredData = data.filter((rec) =>
    rec.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rec.description.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  // ================= FORM HANDLING =================
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const updated = { ...formData, [id]: value };
    setFormData(updated);
    setIsFormValid(updated.value.trim() !== "");
  };

  const resetForm = () => {
    setFormData({
      id: "",
      value: "",
      description: "",
      status: "Y",
    });
    setEditingRecord(null);
    setShowForm(false);
    setIsFormValid(false);
  };

  // ================= SAVE =================
  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const now = new Date().toISOString().replace("T", " ").split(".")[0];

    if (editingRecord) {
      setData(data.map(rec => 
        rec.id === editingRecord.id 
          ? { ...rec, ...formData, last_update_date: now }
          : rec
      ));
      showPopup("Record updated successfully!", "success");
    } else {
      const newId = data.length > 0 ? Math.max(...data.map(d => d.id)) + 1 : 1;
      setData([...data, { 
        ...formData, 
        id: newId,
        created_by: "Admin",
        last_updated_by: "Admin",
        last_update_date: now 
      }]);
      showPopup("New record added successfully!", "success");
    }
    resetForm();
  };

  // ================= EDIT =================
  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({ 
      id: rec.id,
      value: rec.value, 
      description: rec.description,
      status: rec.status 
    });
    setShowForm(true);
    setIsFormValid(true);
  };

  // ================= STATUS CHANGE =================
  const handleSwitchChange = (id, newStatus, name) => {
    setConfirmDialog({ isOpen: true, id, newStatus, statusName: name });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed) {
      setData(data.map(rec =>
        rec.id === confirmDialog.id
          ? { ...rec, status: confirmDialog.newStatus }
          : rec
      ));
      showPopup(
        confirmDialog.newStatus === "Y" 
          ? "Activated successfully!" 
          : "Deactivated successfully!", 
        "success"
      );
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "", statusName: "" });
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  // ================= PAGINATION HANDLING =================
  const handlePageNavigation = () => {
    const page = Number(pageInput);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setPageInput("");
    } else {
      showPopup(`Invalid page number! Please enter between 1 and ${totalPages}`, "error");
    }
  };

  const renderPagination = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
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
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pageNumbers.push("...");
      pageNumbers.push(totalPages);
    }

    return (
      <>
        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
          <button 
            className="page-link" 
            onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
          >
            Prev
          </button>
        </li>
        {pageNumbers.map((num, idx) => (
          <li key={idx} className={`page-item ${num === currentPage ? "active" : ""}`}>
            {typeof num === "number" ? (
              <button className="page-link" onClick={() => setCurrentPage(num)}>
                {num}
              </button>
            ) : (
              <span className="page-link disabled">{num}</span>
            )}
          </li>
        ))}
        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
          <button 
            className="page-link" 
            onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
          >
            Next
          </button>
        </li>
      </>
    );
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="content-wrapper">
      <div className="card form-card">
        {/* HEADER */}
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title">Booked Status Master</h4>
          <div className="d-flex align-items-center">
            {!showForm && (
              <input
                type="text"
                className="form-control w-50 me-2"
                placeholder="Search by Status or Description"
                value={searchQuery}
                onChange={handleSearchChange}
                style={{ minWidth: "220px" }}
              />
            )}
            {!showForm ? (
              <>
                <button 
                  className="btn btn-success me-2" 
                  onClick={() => { resetForm(); setShowForm(true); }}
                >
                  Add
                </button>
                <button className="btn btn-success flex-shrink-0" onClick={handleRefresh}>
                  Show All
                </button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={resetForm}>
                Back
              </button>
            )}
          </div>
        </div>

        {/* BODY */}
        <div className="card-body">
          {!showForm ? (
            <>
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Status</th>
                      <th>Description</th>
                      <th>Last Update Date</th>
                      <th>Status</th>
                      <th>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length ? currentItems.map((rec) => (
                      <tr key={rec.id}>
                        <td>{rec.id}</td>
                        <td>{rec.value}</td>
                        <td>{rec.description}</td>
                        <td>{rec.last_update_date}</td>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={rec.status === "Y"}
                              onChange={() => handleSwitchChange(rec.id, rec.status === "Y" ? "N" : "Y", rec.value)}
                            />
                            <label className="form-check-label">
                              {rec.status === "Y" ? "Active" : "Inactive"}
                            </label>
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn btn-success btn-sm d-flex align-items-center justify-content-center"
                            onClick={() => handleEdit(rec)}
                            disabled={rec.status !== "Y"}
                            style={{ width: "32px", height: "32px" }}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="6" className="text-center">
                          No record found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap">
                <div>
                  Page {currentPage} of {totalPages} | Total Records: {filteredData.length}
                </div>
                <nav>
                  <ul className="pagination mb-0 d-flex justify-content-center">
                    {renderPagination()}
                  </ul>
                </nav>
                <div className="d-flex align-items-center mt-2 mt-md-0">
                  <input
                    type="number"
                    className="form-control ms-2"
                    style={{ width: "100px" }}
                    placeholder="Go to page"
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                  />
                  <button className="btn btn-primary ms-2" onClick={handlePageNavigation}>
                    Go
                  </button>
                </div>
              </div>
            </>
          ) : (
            // FORM
            <form className="row" onSubmit={handleSave}>
              <div className="form-group col-md-4">
                <label>Status <span className="text-danger">*</span></label>
                <input
                  type="text"
                  id="value"
                  className="form-control mt-1"
                  value={formData.value}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group col-md-4">
                <label>Description</label>
                <input
                  type="text"
                  id="description"
                  className="form-control mt-1"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group col-md-12 mt-3 d-flex justify-content-end">
                <button className="btn btn-primary me-2" disabled={!isFormValid}>
                  Save
                </button>
                <button className="btn btn-danger" type="button" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* POPUP */}
          {popupMessage && <Popup {...popupMessage} />}

          {/* CONFIRMATION DIALOG */}
          {confirmDialog.isOpen && (
            <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Confirm Status Change</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => handleConfirm(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <p>
                      Are you sure you want to {confirmDialog.newStatus === "Y" ? "activate" : "deactivate"}{" "}
                      <strong>{confirmDialog.statusName}</strong>?
                    </p>
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

export default BookedStatusMaster;