import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const TrimesterMaster = () => {
  const [data, setData] = useState([]);
  const [loading] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    trimesterName: null,
    newStatus: "",
  });

  const [formData, setFormData] = useState({
    trimesterCode: "",
    trimesterName: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ================= PAGINATION =================
  const [currentPage, setCurrentPage] = useState(1);
  const [goPage, setGoPage] = useState("");
  const itemsPerPage = 5;

  // ================= SAMPLE DATA =================
  useEffect(() => {
    setData([
      { trimesterCode: "T1", trimesterName: "First Trimester", status: "Y" },
      { trimesterCode: "T2", trimesterName: "Second Trimester", status: "Y" },
      { trimesterCode: "T3", trimesterName: "Third Trimester", status: "N" },
    ]);
  }, []);

  // ================= SEARCH =================
  const filteredData = data.filter((rec) =>
    rec.trimesterName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast)

  
  // ================= FORM =================
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const updated = { ...formData, [id]: value };
    setFormData(updated);
    setIsFormValid(updated.trimesterCode && updated.trimesterName);
  };

  const resetForm = () => {
    setFormData({ trimesterCode: "", trimesterName: "" });
    setIsFormValid(false);
  };

  // ================= SAVE =================
  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    if (editingRecord) {
      setData(
        data.map((rec) =>
          rec.trimesterCode === editingRecord.trimesterCode
            ? { ...rec, ...formData }
            : rec
        )
      );
      showPopup("Record updated successfully", "success");
    } else {
      setData([...data, { ...formData, status: "N" }]);
      showPopup("Record added successfully", "success");
    }

    resetForm();
    setEditingRecord(null);
    setShowForm(false);
  };

  // ================= EDIT =================
  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData(rec);
    setShowForm(true);
    setIsFormValid(true);
  };

  // ================= STATUS =================
  const handleSwitchChange = (trimesterName, newStatus) => {
    setConfirmDialog({ isOpen: true, trimesterName, newStatus });
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleConfirm = (confirmed) => {
    if (confirmed) {
      setData(
        data.map((rec) =>
          rec.trimesterName === confirmDialog.trimesterName
            ? { ...rec, status: confirmDialog.newStatus }
            : rec
        )
      );
      showPopup("Status updated successfully", "success");
    }
    setConfirmDialog({ isOpen: false, trimesterName: null, newStatus: "" });
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            )}

            {!showForm ? (
              <>
                <button className="btn btn-success me-2" onClick={() => setShowForm(true)}>
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
          {!showForm && (
            <>
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Trimester Code</th>
                    <th>Trimester Name</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((rec, index) => (
                    <tr key={index}>
                      <td>{rec.trimesterCode}</td>
                      <td>{rec.trimesterName}</td>
                      <td>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={rec.status === "Y"}
                            onChange={() =>
                              handleSwitchChange(
                                rec.trimesterName,
                                rec.status === "Y" ? "N" : "Y"
                              )
                            }
                          />
                          <label className="form-check-label ms-2">
                            {rec.status === "Y" ? "Active" : "Inactive"}
                          </label>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-success btn-sm"
                          disabled={rec.status !== "Y"}
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
               <Pagination
               totalItems={filteredData.length}
               itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
               currentPage={currentPage}
               onPageChange={setCurrentPage}
             /> 
            </>
          )}

          {/* ================= FORM ================= */}
          {showForm && (
            <form onSubmit={handleSave} className="row g-3">
              <div className="col-md-5">
                <label>Trimester Code <span className="text-danger">*</span></label>
                <input
                  id="trimesterCode"
                  className="form-control"
                  value={formData.trimesterCode}
                  onChange={handleInputChange}
                />
              </div>

              <div className="col-md-5">
                <label>Trimester Name <span className="text-danger">*</span></label>
                <input
                  id="trimesterName"
                  className="form-control"
                  value={formData.trimesterName}
                  onChange={handleInputChange}
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
                    {confirmDialog.newStatus === "Y" ? "activate" : "deactivate"}{" "}
                    <strong>{confirmDialog.trimesterName}</strong>?
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

export default TrimesterMaster;
