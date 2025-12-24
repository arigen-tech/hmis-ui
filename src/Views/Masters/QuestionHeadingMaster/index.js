import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";

const QuestionHeadingMaster = () => {
  const [data, setData] = useState([]);
  const [loading] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    code: null,
    newStatus: "",
  });

  const [formData, setFormData] = useState({
    code: "",
    name: "",
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
      { code: "Q1", name: "Question Heading 1", status: "N" },
      { code: "Q2", name: "Question Heading 2", status: "N" },
      { code: "MADRS", name: "Montgomery-Asberg Depression Rating Scale (MADRS)", status: "Y" },
      { code: "HAM-D", name: "HAMILTON DEPRESSION RATING SCALE (HAM-D)", status: "Y" },
      { code: "HADS", name: "Hospital Anxiety and Depression Scale (HADS)", status: "Y" },
    ]);
  }, []);

  // ================= SEARCH =================
  const filteredData = data.filter((rec) =>
    rec.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ================= FORM =================
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const updated = { ...formData, [id]: value };
    setFormData(updated);
    setIsFormValid(updated.code && updated.name);
  };

  const resetForm = () => {
    setFormData({ code: "", name: "" });
    setIsFormValid(false);
  };

  // ================= SAVE =================
  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    if (editingRecord) {
      setData(data.map((rec) =>
        rec.code === editingRecord.code ? { ...rec, ...formData } : rec
      ));
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
  const handleSwitchChange = (code, newStatus) => {
    setConfirmDialog({ isOpen: true, code, newStatus });
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleConfirm = (confirmed) => {
    if (confirmed) {
      setData(data.map((rec) =>
        rec.code === confirmDialog.code
          ? { ...rec, status: confirmDialog.newStatus }
          : rec
      ));
      showPopup("Status updated successfully", "success");
    }
    setConfirmDialog({ isOpen: false, code: null, newStatus: "" });
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleGoPage = () => {
    const page = Number(goPage);
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
    setGoPage("");
  };

  // ================= UI =================
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Question Heading Master</h4>
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
                    <th>Code</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((rec) => (
                    <tr key={rec.code}>
                      <td>{rec.code}</td>
                      <td>{rec.name}</td>
                      <td>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={rec.status === "Y"}
                            onChange={() =>
                              handleSwitchChange(
                                rec.code,
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
              <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap">
                <div>
                  Total Records: {filteredData.length} | Page {currentPage} of {totalPages}
                </div>

                <nav>
                  <ul className="pagination mb-0">
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>Prev</button>
                    </li>

                    {[...Array(totalPages).keys()].map((num) => (
                      <li key={num} className={`page-item ${currentPage === num + 1 ? "active" : ""}`}>
                        <button className="page-link" onClick={() => setCurrentPage(num + 1)}>
                          {num + 1}
                        </button>
                      </li>
                    ))}

                    <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
                    </li>
                  </ul>
                </nav>

                <div className="d-flex">
                  <input
                    type="number"
                    placeholder="Go To page"
                    className="form-control form-control-sm me-2"
                    style={{ width: 70 }}
                    value={goPage}
                    onChange={(e) => setGoPage(e.target.value)}
                  />
                  <button className="btn btn-sm btn-primary" onClick={handleGoPage}>
                    Go
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ================= FORM ================= */}
          {showForm && (
            <form onSubmit={handleSave} className="row g-3">
              <div className="col-md-4">
                <label>Code <span className="text-danger">*</span></label>
                <input id="code" className="form-control" value={formData.code} onChange={handleInputChange} />
              </div>

              <div className="col-md-8">
                <label>Name <span className="text-danger">*</span></label>
                <input id="name" className="form-control" value={formData.name} onChange={handleInputChange} />
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
                    <strong>{confirmDialog.code}</strong>?
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

export default QuestionHeadingMaster;
