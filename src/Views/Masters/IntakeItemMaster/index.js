import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";

const IntakeItemMaster = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    intake_type: "",
    intake_item_name: "",
    volume: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [gotoPage, setGotoPage] = useState("");

  /* ===== STATUS CONFIRM POPUP ===== */
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    intakeType: "",
  });

  // ================= DUMMY DATA =================
  useEffect(() => {
    setData([
      { id: 1, intake_type: "Oral Fluid", intake_item_name: "Water", volume: "200 ml", status: "Y" },
      { id: 2, intake_type: "IV Fluid", intake_item_name: "Normal Saline", volume: "500 ml", status: "Y" },
      { id: 3, intake_type: "Enteral Feed", intake_item_name: "Ensure Feed", volume: "200 ml", status: "N" },
      { id: 4, intake_type: "Blood Product", intake_item_name: "Packed RBC", volume: "350 ml", status: "Y" },
      { id: 5, intake_type: "Oral Fluid", intake_item_name: "Juice", volume: "150 ml", status: "Y" },
      { id: 6, intake_type: "IV Fluid", intake_item_name: "Dextrose", volume: "500 ml", status: "Y" },
    ]);
  }, []);

  // ================= FILTER =================
  const filteredData = data.filter(
    (rec) =>
      rec.intake_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.intake_item_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ================= PAGINATION =================
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handleGotoPage = () => {
    const page = Number(gotoPage);
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
    setGotoPage("");
  };

  // ================= FORM =================
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const updated = { ...formData, [id]: value };
    setFormData(updated);

    setIsFormValid(
      updated.intake_type.trim() &&
      updated.intake_item_name.trim() &&
      updated.volume.trim()
    );
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    if (editingRecord) {
      setData(data.map(rec =>
        rec.id === editingRecord.id ? { ...rec, ...formData } : rec
      ));
      showPopup("Record updated successfully!", "success");
    } else {
      setData([...data, { id: Date.now(), ...formData, status: "Y" }]);
      showPopup("Record added successfully!", "success");
    }

    setShowForm(false);
    setFormData({ intake_type: "", intake_item_name: "", volume: "" });
    setEditingRecord(null);
    setIsFormValid(false);
  };

  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData(rec);
    setShowForm(true);
    setIsFormValid(true);
  };

  // ================= STATUS TOGGLE (FIXED) =================
  const handleSwitchChange = (id, newStatus, intakeType) => {
    setConfirmDialog({
      isOpen: true,
      id,
      newStatus,
      intakeType,
    });
  };

  const handleConfirmStatus = (confirmed) => {
    if (confirmed) {
      setData(data.map(rec =>
        rec.id === confirmDialog.id
          ? { ...rec, status: confirmDialog.newStatus }
          : rec
      ));
      showPopup("Status updated successfully!", "success");
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "", intakeType: "" });
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleShowAll = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  // ================= UI =================
  return (
    <div className="content-wrapper">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Intake Item Master</h4>

          {!showForm ? (
            <div className="d-flex">
              <input
                type="text"
                className="form-control w-50 me-2"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <button className="btn btn-success me-2" onClick={() => setShowForm(true)}>Add</button>
              <button className="btn btn-success" onClick={handleShowAll}>Show All</button>
            </div>
          ) : (
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Back</button>
          )}
        </div>

        <div className="card-body">
          {loading ? <LoadingScreen /> : !showForm ? (
            <>
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Intake Type</th>
                    <th>Item Name</th>
                    <th>Volume</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length ? currentItems.map(rec => (
                    <tr key={rec.id}>
                      <td>{rec.id}</td>
                      <td>{rec.intake_type}</td>
                      <td>{rec.intake_item_name}</td>
                      <td>{rec.volume}</td>
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
                        <button className="btn btn-success btn-sm" onClick={() => handleEdit(rec)}>
                          <i className="fa fa-pencil"></i>
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="text-center">No record found</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* PAGINATION */}
              <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap">
                <div>
                  Page {currentPage} of {totalPages} | Total Records: {filteredData.length}
                </div>

                <div>
                  <button className="btn btn-sm btn-light me-1" disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}>Prev</button>

                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      className={`btn btn-sm me-1 ${currentPage === i + 1 ? "btn-primary" : "btn-light"}`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button className="btn btn-sm btn-light" disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
                </div>

                <div className="d-flex align-items-center">
                  <input
                    type="number"
                    placeholder="Go To"
                    value={gotoPage}
                    onChange={(e) => setGotoPage(e.target.value)}
                    className="form-control form-control-sm me-1"
                    style={{ width: "60px" }}
                  />
                  <button className="btn btn-sm btn-primary" onClick={handleGotoPage}>Go</button>
                </div>
              </div>
            </>
          ) : (
            <form onSubmit={handleSave} className="row">
              <div className="col-md-4">
                <label>Intake Type <span className="text-danger">*</span></label>
                <input id="intake_type" className="form-control" value={formData.intake_type} onChange={handleInputChange} />
              </div>
              <div className="col-md-4">
                <label>Item Name <span className="text-danger">*</span></label>
                <input id="intake_item_name" className="form-control" value={formData.intake_item_name} onChange={handleInputChange} />
              </div>
              <div className="col-md-4">
                <label>Volume <span className="text-danger">*</span></label>
                <input id="volume" className="form-control" value={formData.volume} onChange={handleInputChange} />
              </div>

              <div className="col-md-12 mt-3 text-end">
                <button className="btn btn-primary me-2" disabled={!isFormValid}>Save</button>
                <button type="button" className="btn btn-danger" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          )}

          {popupMessage && <Popup {...popupMessage} />}

          {/* CONFIRM STATUS MODAL */}
          {confirmDialog.isOpen && (
            <div className="modal d-block">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5>Confirm Status Change</h5>
                    <button className="btn-close" onClick={() => handleConfirmStatus(false)}></button>
                  </div>
                  <div className="modal-body">
                    Are you sure you want to
                    <strong> {confirmDialog.newStatus === "Y" ? "activate" : "deactivate"} </strong>
                    <strong>{confirmDialog.intakeType}</strong>?
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => handleConfirmStatus(false)}>No</button>
                    <button className="btn btn-primary" onClick={() => handleConfirmStatus(true)}>Yes</button>
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

export default IntakeItemMaster;
