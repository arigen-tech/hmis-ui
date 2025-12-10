 import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";

const DietPreferenceMaster = () => {
  const [data, setData] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, id: null, newStatus: "" });
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    preference_name: "",
    description: "",
    created_by: "",
    last_updated_by: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // First page 5 items, second page remaining

  const PREFERENCE_NAME_MAX_LENGTH = 50;
  const DESCRIPTION_MAX_LENGTH = 200;
  const USER_MAX_LENGTH = 200;

  // Load dummy data
  useEffect(() => {
    const dummyData = [
      { id: 1, preference_name: "VEGAN", description: "No animal products", status: "Y", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-12-10 10:00:00" },
      { id: 2, preference_name: "VEGETARIAN", description: "No meat", status: "Y", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-12-10 10:10:00" },
      { id: 3, preference_name: "GLUTEN_FREE", description: "No gluten", status: "N", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-12-10 10:15:00" },
      { id: 4, preference_name: "DIABETIC", description: "Sugar-free diet", status: "Y", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-12-10 10:20:00" },
      { id: 5, preference_name: "LOW_SODIUM", description: "Less salt", status: "Y", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-12-10 10:25:00" },
      { id: 6, preference_name: "KETO", description: "Low carb, high fat", status: "N", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-12-10 10:30:00" },
      { id: 7, preference_name: "PALEO", description: "Paleo diet", status: "Y", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-12-10 10:35:00" },
      { id: 8, preference_name: "FLEXITARIAN", description: "Occasional meat", status: "Y", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-12-10 10:40:00" },
    ];
    setData(dummyData);
  }, []);

  // Filtered search
  const filteredData = data.filter(
    (rec) =>
      rec.preference_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = 2;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Save or update record
  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const duplicate = data.some(
      (rec) =>
        rec.preference_name.toLowerCase() === formData.preference_name.toLowerCase() &&
        (!editingRecord || editingRecord.id !== rec.id)
    );

    if (duplicate) {
      showPopup("Preference name already exists!", "error");
      return;
    }

    const now = new Date().toISOString().replace("T", " ").split(".")[0];

    if (editingRecord) {
      const updated = data.map((rec) =>
        rec.id === editingRecord.id
          ? { ...rec, ...formData, last_updated_by: formData.last_updated_by || "Admin", last_update_date: now }
          : rec
      );
      setData(updated);
      showPopup("Record updated successfully!", "success");
    } else {
      const newRecord = {
        id: Date.now(),
        ...formData,
        status: "Y",
        created_by: formData.created_by || "Admin",
        last_updated_by: formData.last_updated_by || "Admin",
        last_update_date: now,
      };
      setData([...data, newRecord]);
      showPopup("New record added successfully!", "success");
    }

    setShowForm(false);
    setFormData({ preference_name: "", description: "", created_by: "", last_updated_by: "" });
    setEditingRecord(null);
    setIsFormValid(false);
  };

  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({
      preference_name: rec.preference_name,
      description: rec.description,
      created_by: rec.created_by,
      last_updated_by: rec.last_updated_by,
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    setIsFormValid(
      formData.preference_name.trim() !== "" &&
      formData.description.trim() !== "" &&
      value.trim() !== ""
    );
  };

  // Status switch handling
  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, id, newStatus });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed) {
      const now = new Date().toISOString().replace("T", " ").split(".")[0];
      const updated = data.map((rec) =>
        rec.id === confirmDialog.id
          ? { ...rec, status: confirmDialog.newStatus, last_update_date: now }
          : rec
      );
      setData(updated);
      showPopup(
        `Status ${confirmDialog.newStatus === "Y" ? "activated" : "deactivated"} successfully!`,
        "success"
      );
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "" });
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  const renderPagination = () => (
    <ul className="pagination mb-0">
      <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
        <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>Prev</button>
      </li>
      {[1, 2].map((page) => (
        <li key={page} className={`page-item ${currentPage === page ? "active" : ""}`}>
          <button className="page-link" onClick={() => setCurrentPage(page)}>{page}</button>
        </li>
      ))}
      <li className={`page-item ${currentPage === 2 ? "disabled" : ""}`}>
        <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
      </li>
    </ul>
  );

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            {/* HEADER */}
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Diet Preference Master</h4>
              <div className="d-flex align-items-center">
                {!showForm && (
                  <input type="text" className="form-control w-50 me-2" placeholder="Search" value={searchQuery} onChange={handleSearchChange} />
                )}
                {!showForm ? (
                  <>
                    <button className="btn btn-success me-2" onClick={() => { setShowForm(true); setEditingRecord(null); setFormData({ preference_name: "", description: "", created_by: "", last_updated_by: "" }); setIsFormValid(false); }}>
                      <i className="mdi mdi-plus"></i> Add
                    </button>
                    <button className="btn btn-success" onClick={handleRefresh}>
                      <i className="mdi mdi-refresh"></i> Show All
                    </button>
                  </>
                ) : (
                  <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                    <i className="mdi mdi-arrow-left"></i> Back
                  </button>
                )}
              </div>
            </div>

            {/* BODY */}
            <div className="card-body">
              {loading ? <LoadingScreen /> : !showForm ? (
                <>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>ID</th>
                          <th>Preference Name</th>
                          <th>Description</th>
                          <th>Status</th>
                          <th>Created By</th>
                          <th>Last Updated By</th>
                          <th>Last Update Date</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? currentItems.map(rec => (
                          <tr key={rec.id}>
                            <td>{rec.id}</td>
                            <td>{rec.preference_name}</td>
                            <td>{rec.description}</td>
                            <td>
                              <div className="form-check form-switch">
                                <input type="checkbox" className="form-check-input" checked={rec.status === "Y"} onChange={() => handleSwitchChange(rec.id, rec.status === "Y" ? "N" : "Y")} />
                                <label className="form-check-label">{rec.status === "Y" ? "Active" : "Inactive"}</label>
                              </div>
                            </td>
                            <td>{rec.created_by}</td>
                            <td>{rec.last_updated_by}</td>
                            <td>{rec.last_update_date}</td>
                            <td>
                              <button className="btn btn-success btn-sm" onClick={() => handleEdit(rec)} disabled={rec.status !== "Y"}>
                                <i className="fa fa-pencil"></i>
                              </button>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="8" className="text-center">No record found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="d-flex justify-content-center mt-3">{renderPagination()}</div>
                </>
              ) : (
                <form className="row" onSubmit={handleSave}>
                  <div className="form-group col-md-4">
                    <label>Preference Name <span className="text-danger">*</span></label>
                    <input type="text" id="preference_name" className="form-control mt-1" placeholder="Enter Preference Name" value={formData.preference_name} maxLength={PREFERENCE_NAME_MAX_LENGTH} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group col-md-4">
                    <label>Description</label>
                    <input type="text" id="description" className="form-control mt-1" placeholder="Enter Description" value={formData.description} maxLength={DESCRIPTION_MAX_LENGTH} onChange={handleInputChange} />
                  </div>
                  <div className="form-group col-md-4">
                    <label>Created By</label>
                    <input type="text" id="created_by" className="form-control mt-1" placeholder="Created By" value={formData.created_by} maxLength={USER_MAX_LENGTH} onChange={handleInputChange} />
                  </div>
                  <div className="form-group col-md-4 mt-2">
                    <label>Last Updated By</label>
                    <input type="text" id="last_updated_by" className="form-control mt-1" placeholder="Last Updated By" value={formData.last_updated_by} maxLength={USER_MAX_LENGTH} onChange={handleInputChange} />
                  </div>
                  <div className="form-group col-md-12 mt-3 d-flex justify-content-end">
                    <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>Save</button>
                    <button type="button" className="btn btn-danger" onClick={() => setShowForm(false)}>Cancel</button>
                  </div>
                </form>
              )}

              {popupMessage && <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />}

              {confirmDialog.isOpen && (
                <div className="modal d-block" tabIndex="-1">
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5>Confirm Status Change</h5>
                        <button className="btn-close" onClick={() => handleConfirm(false)}></button>
                      </div>
                      <div className="modal-body">
                        Are you sure you want to <strong>{confirmDialog.newStatus === "Y" ? "activate" : "deactivate"}</strong>?
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
      </div>
    </div>
  );
};

export default DietPreferenceMaster;
