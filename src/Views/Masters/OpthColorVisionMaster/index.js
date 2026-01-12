import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const OpthColorVisionMaster = () => {
  const [data, setData] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    visionTestName: ""
  });

  const [loading] = useState(false);

  const [formData, setFormData] = useState({
    vision_code: "",
    vision_name: "",
    description: "",
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
    const sample = [
      { vision_code:"1",vision_name: "Red-Green Test", description: "Color blindness test", status: "Y" },
      {  vision_code: "2", vision_name: "Blue-Yellow Test", description: "Detects blue-yellow deficiency", status: "Y" },
      {  vision_code: "3", vision_name: "Total Color Vision", description: "Full spectrum test", status: "N" },
      { vision_code: "4", vision_name: "Contrast Sensitivity", description: "Contrast test", status: "Y" },
      {  vision_code: "5", vision_name: "Ishihara Plate Test", description: "Color vision plate test", status: "Y" },
      {  vision_code: "6", vision_name: "Anomaloscope", description: "Advanced color test", status: "Y" },
    ];
    setData(sample);
  }, []);

  // ================= SEARCH =================
  const filteredData = data.filter((rec) =>
    rec.vision_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

 const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast)


  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // ================= FORM =================
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const updated = { ...formData, [id]: value };
    setFormData(updated);
    setIsFormValid(
      updated.vision_code.trim() !== "" &&
      updated.vision_name.trim() !== ""
    );
  };

  const resetForm = () => {
    setFormData({
      vision_code: "",
      vision_name: "",
      description: "",
    });
    setIsFormValid(false);
  };

  // ================= SAVE =================
  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    if (editingRecord) {
      setData(
        data.map((rec) =>
          rec.id === editingRecord.id
            ? { ...rec, ...formData }
            : rec
        )
      );
      showPopup("Record updated successfully", "success");
    } else {
      setData([
        ...data,
        {
          id: Date.now(),
          ...formData,
          status: "Y",
        },
      ]);
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
  const handleSwitchChange = (id, newStatus, visionTestName) => {
    setConfirmDialog({ isOpen: true, id, newStatus, visionTestName });
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
    setConfirmDialog({ isOpen: false, id: null, newStatus: "", visionTestName: "" });
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  // ================= GO TO PAGE =================
  

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
          <h4>Opth Color Vision Master</h4>
          <div className="d-flex">
            {!showForm && (
              <input
                className="form-control me-2"
                style={{ width: "220px" }}
                placeholder="Search Vision Test"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            )}

            {!showForm ? (
              <>
                <button
                  className="btn btn-success me-2"
                  onClick={() => { resetForm(); setShowForm(true); setEditingRecord(null); }}
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
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Id</th>
                      <th>Value</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((rec) => (
                      <tr key={rec.id}>
                        <td>{rec.vision_code}</td>
                        <td>{rec.vision_name}</td>
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
                                  rec.vision_name
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
              </div>

              {/* PAGINATION + PAGE INFO + GO BUTTON */}
             <Pagination
               totalItems={filteredData.length}
               itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
               currentPage={currentPage}
               onPageChange={setCurrentPage}
             />
              </>
          ) : (
            // FORM
            <form className="row" onSubmit={handleSave}>
              <div className="form-group col-md-4">
                <label>Vision Code <span className="text-danger">*</span></label>
                <input id="vision_code" className="form-control" value={formData.vision_code} onChange={handleInputChange} />
              </div>

              <div className="form-group col-md-4">
                <label>Vision Name <span className="text-danger">*</span></label>
                <input id="vision_name" className="form-control" value={formData.vision_name} onChange={handleInputChange} />
              </div>

              <div className="form-group col-md-4">
                <label>Description</label>
                <input id="description" className="form-control" value={formData.description} onChange={handleInputChange} />
              </div>

              <div className="form-group col-md-12 mt-4 d-flex justify-content-end">
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
                    Are you sure you want to {confirmDialog.newStatus === "Y" ? "activate" : "deactivate"}{" "}
                    <strong>{confirmDialog.visionTestName}</strong>?
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

export default OpthColorVisionMaster;
