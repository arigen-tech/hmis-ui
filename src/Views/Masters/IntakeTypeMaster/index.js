import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";

const IntakeTypeMaster = () => {
  const [data, setData] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    intakeTypeName: "",
  });

  const [loading] = useState(false);

  const [formData, setFormData] = useState({ intake_type: "" });
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");
  const itemsPerPage = 5;

  // ================== LOAD DATA ==================
  useEffect(() => {
    setData([
      { id: 1, intake_type: "WATER", status: "Y" },
      { id: 2, intake_type: "JUICE", status: "Y" },
      { id: 3, intake_type: "MILK", status: "N" },
      { id: 4, intake_type: "SOUP", status: "Y" },
      { id: 5, intake_type: "COFFEE", status: "Y" },
      { id: 6, intake_type: "TEA", status: "N" },
      { id: 7, intake_type: "SMOOTHIE", status: "Y" },
    ]);
  }, []);

  // ================== FILTER ==================
  const filteredData = data.filter((rec) =>
    rec.intake_type.toLowerCase().includes(searchQuery.toLowerCase())
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

  // ================== SAVE ==================
  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const duplicate = data.some(
      (rec) =>
        rec.intake_type.toLowerCase() === formData.intake_type.toLowerCase() &&
        (!editingRecord || editingRecord.id !== rec.id)
    );

    if (duplicate) {
      showPopup("Intake Type already exists!", "error");
      return;
    }

    if (editingRecord) {
      setData(
        data.map((rec) =>
          rec.id === editingRecord.id
            ? { ...rec, intake_type: formData.intake_type }
            : rec
        )
      );
      showPopup("Record updated successfully!", "success");
    } else {
      setData([
        ...data,
        { id: Date.now(), intake_type: formData.intake_type, status: "Y" },
      ]);
      showPopup("Record added successfully!", "success");
    }

    setShowForm(false);
    setEditingRecord(null);
    setFormData({ intake_type: "" });
    setIsFormValid(false);
  };

  // ================== EDIT ==================
  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({ intake_type: rec.intake_type });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleInputChange = (e) => {
    setFormData({ intake_type: e.target.value });
    setIsFormValid(e.target.value.trim() !== "");
  };

  // ================== STATUS TOGGLE ==================
  const handleSwitchChange = (id, newStatus, intakeTypeName) => {
    setConfirmDialog({ isOpen: true, id, newStatus, intakeTypeName });
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
      showPopup("Status updated successfully!", "success");
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "", intakeTypeName: "" });
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handlePageNavigation = () => {
    const page = Number(pageInput);
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
    setPageInput("");
  };

  // ================== PAGINATION ==================
  const Pagination = () => (
    <ul className="pagination mb-0">
      <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
        <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>Prev</button>
      </li>
      {[...Array(totalPages).keys()].map((num) => (
        <li key={num} className={`page-item ${currentPage === num + 1 ? "active" : ""}`}>
          <button className="page-link" onClick={() => setCurrentPage(num + 1)}>{num + 1}</button>
        </li>
      ))}
      <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
        <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
      </li>
    </ul>
  );

  // ================== UI ==================
  return (
    <div className="content-wrapper">
      <div className="card">

        <div className="card-header d-flex justify-content-between">
          <h4>Intake Type Master</h4>
          <div>
            {!showForm && (
              <input
                type="text"
                className="form-control d-inline w-auto me-2"
                placeholder="Search"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            )}
            {!showForm ? (
              <>
                <button className="btn btn-success me-2" onClick={() => setShowForm(true)}>Add</button>
                <button className="btn btn-secondary" onClick={handleRefresh}>Show All</button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Back</button>
            )}
          </div>
        </div>

        <div className="card-body">
          {loading ? <LoadingScreen /> : !showForm ? (
            <>
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Intake Type</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((rec) => (
                    <tr key={rec.id}>
                      <td>{rec.id}</td>
                      <td>{rec.intake_type}</td>
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
                                rec.intake_type
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
                          onClick={() => handleEdit(rec)}
                          disabled={rec.status !== "Y"}
                        >
                          <i className="fa fa-pencil"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="d-flex align-items-center justify-content-between mt-3">
                <div>Page {currentPage} of {totalPages} | Total Records: {filteredData.length}</div>
                <Pagination />
                <div className="d-flex">
                  <input
                    type="number"
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    className="form-control form-control-sm me-2"
                    style={{ width: "70px" }}
                    placeholder="Go To Page"
                  />
                  <button className="btn btn-sm btn-primary" onClick={handlePageNavigation}>Go</button>
                </div>
              </div>
            </>
          ) : (
            <form onSubmit={handleSave}>
              <label>Intake Type <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control w-50 mb-2"
                value={formData.intake_type}
                onChange={handleInputChange}
              />
              <button className="btn btn-primary me-2" disabled={!isFormValid}>Save</button>
              <button className="btn btn-danger" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </form>
          )}

          {popupMessage && <Popup {...popupMessage} />}

          {confirmDialog.isOpen && (
            <div className="modal d-block">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5>Confirm Status Change</h5>
                    <button className="btn-close" onClick={() => handleConfirm(false)}></button>
                  </div>
                  <div className="modal-body">
                    Are you sure you want to{" "}
                    {confirmDialog.newStatus === "Y" ? "activate" : "deactivate"}{" "}
                    <strong>{confirmDialog.intakeTypeName}</strong>?
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

export default IntakeTypeMaster;
