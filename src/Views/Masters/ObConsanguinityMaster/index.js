import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const ObConsanguinityMaster = () => {
  const [data, setData] = useState([]);
  const [loading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    valueName: "",
  });

  const [formData, setFormData] = useState({
    id: "",
    value: "",
    description: "",
  });

  // ================= PAGINATION =================
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");
  const itemsPerPage = 5;

  // ================= SAMPLE DATA =================
  useEffect(() => {
    setData([
      { id: 1, value: "First Cousin", description: "Consanguinity type", status: "Y" },
      { id: 2, value: "Second Cousin", description: "Consanguinity type", status: "Y" },
      { id: 3, value: "Uncle-Niece", description: "Consanguinity type", status: "N" },
      { id: 4, value: "Aunt-Nephew", description: "Consanguinity type", status: "Y" },
      { id: 5, value: "No Relation", description: "Consanguinity type", status: "Y" },
      { id: 6, value: "Others", description: "Consanguinity type", status: "Y" },
    ]);
  }, []);

  // ================= SEARCH =================
  const filteredData = data.filter((rec) =>
    rec.value.toLowerCase().includes(searchQuery.toLowerCase())
  );
const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast)

  

  // ================= FORM =================
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const updated = { ...formData, [id]: value };
    setFormData(updated);

    setIsFormValid(
      updated.id.toString().trim() !== "" &&
      updated.value.trim() !== ""
    );
  };

  const resetForm = () => {
    setFormData({ id: "", value: "", description: "" });
    setIsFormValid(false);
  };

  // ================= SAVE =================
  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    if (editingRecord) {
      setData(
        data.map((rec) =>
          rec.id === editingRecord.id ? { ...rec, ...formData } : rec
        )
      );
      showPopup("Record updated successfully", "success");
    } else {
      setData([...data, { ...formData, status: "Y" }]);
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
  const handleSwitchChange = (id, newStatus, valueName) => {
    setConfirmDialog({ isOpen: true, id, newStatus, valueName });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed) {
      setData(
        data.map((rec) =>
          rec.id === confirmDialog.id
            ? { ...rec, status: confirmDialog.newStatus }
            : rec
        )
      );
      showPopup("Status updated successfully", "success");
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "", valueName: "" });
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

        {/* HEADER */}
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Ob Consanguinity Master</h4>

          <div className="d-flex">
            {!showForm && (
              <input
                className="form-control me-2"
                style={{ width: "220px" }}
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
                <button
                  className="btn btn-success me-2"
                  onClick={() => {
                    resetForm();
                    setEditingRecord(null);
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
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Back
              </button>
            )}
          </div>
        </div>

        {/* BODY */}
        <div className="card-body">
          {loading ? (
            <LoadingScreen />
          ) : !showForm ? (
            <>
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Value</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((rec) => (
                    <tr key={rec.id}>
                      <td>{rec.id}</td>
                      <td>{rec.value}</td>
                      <td>{rec.description}</td>
                      <td>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={rec.status === "Y"}
                            onChange={() =>
                              handleSwitchChange(
                                rec.id,
                                rec.status === "Y" ? "N" : "Y",
                                rec.value
                              )
                            }
                          />
                          <label className="form-check-label">
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
          ) : (
            // FORM
            <form className="row g-3" onSubmit={handleSave}>
              <div className="col-md-4">
                <label>ID <span className="text-danger">*</span></label>
                <input id="id" className="form-control" value={formData.id} onChange={handleInputChange} />
              </div>

              <div className="col-md-4">
                <label>Value <span className="text-danger">*</span></label>
                <input id="value" className="form-control" value={formData.value} onChange={handleInputChange} />
              </div>

              <div className="col-md-4">
                <label>Description</label>
                <input id="description" className="form-control" value={formData.description} onChange={handleInputChange} />
              </div>

              <div className="col-md-12 text-end mt-4">
                <button className="btn btn-primary me-2" disabled={!isFormValid}>Save</button>
                <button type="button" className="btn btn-danger" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          )}

          {popupMessage && <Popup {...popupMessage} />}

          {/* CONFIRM MODAL */}
          {confirmDialog.isOpen && (
            <>
              <div className="modal-backdrop fade show"></div>
              <div className="modal d-block">
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-body">
                      Are you sure you want to{" "}
                      {confirmDialog.newStatus === "Y" ? "activate" : "deactivate"}{" "}
                      <strong>{confirmDialog.valueName}</strong>?
                    </div>
                    <div className="modal-footer">
                      <button className="btn btn-secondary" onClick={() => handleConfirm(false)}>No</button>
                      <button className="btn btn-primary" onClick={() => handleConfirm(true)}>Yes</button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default ObConsanguinityMaster;
