import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";

const SpecialityMaster = () => {
  const [data, setData] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    specialityName: ""
  });

  const [loading] = useState(false);

  const [formData, setFormData] = useState({
    speciality_code: "",
    speciality_name: "",
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
      { speciality_id: 1, speciality_code: "SP001", speciality_name: "Cardiology", description: "Heart related treatments", status: "Y" },
      { speciality_id: 2, speciality_code: "SP002", speciality_name: "Neurology", description: "Brain and nerve system", status: "Y" },
      { speciality_id: 3, speciality_code: "SP003", speciality_name: "Orthopedics", description: "Bone related treatments", status: "N" },
      { speciality_id: 4, speciality_code: "SP004", speciality_name: "Dermatology", description: "Skin treatments", status: "Y" },
      { speciality_id: 5, speciality_code: "SP005", speciality_name: "ENT", description: "Ear Nose Throat", status: "Y" },
      { speciality_id: 6, speciality_code: "SP006", speciality_name: "Pediatrics", description: "Child care", status: "Y" },
      { speciality_id: 7, speciality_code: "SP007", speciality_name: "Gynecology", description: "Women health", status: "Y" },
      { speciality_id: 8, speciality_code: "SP008", speciality_name: "Urology", description: "Urinary system", status: "N" },
      { speciality_id: 9, speciality_code: "SP009", speciality_name: "Psychiatry", description: "Mental health", status: "Y" },
      { speciality_id: 10, speciality_code: "SP010", speciality_name: "Oncology", description: "Cancer treatment", status: "Y" },
    ];
    setData(sample);
  }, []);

  // ================= SEARCH =================
  const filteredData = data.filter((rec) =>
    rec.speciality_name.toLowerCase().includes(searchQuery.toLowerCase())
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
    const { id, value } = e.target;
    const updated = { ...formData, [id]: value };
    setFormData(updated);
    setIsFormValid(
      updated.speciality_code.trim() !== "" &&
      updated.speciality_name.trim() !== ""
    );
  };

  const resetForm = () => {
    setFormData({
      speciality_code: "",
      speciality_name: "",
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
          rec.speciality_id === editingRecord.speciality_id
            ? { ...rec, ...formData }
            : rec
        )
      );
      showPopup("Record updated successfully", "success");
    } else {
      setData([
        ...data,
        {
          speciality_id: Date.now(),
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
  const handleSwitchChange = (id, newStatus, specialityName) => {
    setConfirmDialog({ isOpen: true, id, newStatus, specialityName });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed) {
      setData(
        data.map((rec) =>
          rec.speciality_id === confirmDialog.id
            ? { ...rec, status: confirmDialog.newStatus }
            : rec
        )
      );
      showPopup("Status updated successfully", "success");
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "", specialityName: "" });
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  // ================= GO TO PAGE =================
  const handlePageNavigation = () => {
    const page = Number(pageInput);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
    setPageInput("");
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // ================= UI =================
  return (
    <div className="content-wrapper">
      <div className="card form-card">

        {/* HEADER */}
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Speciality Master</h4>
          <div className="d-flex">
            {!showForm && (
              <input
                className="form-control me-2"
                style={{ width: "220px" }}
                placeholder="Search"
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
                      <th>Code</th>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((rec) => (
                      <tr key={rec.speciality_id}>
                        <td>{rec.speciality_code}</td>
                        <td>{rec.speciality_name}</td>
                        <td>{rec.description}</td>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={rec.status === "Y"}
                              onChange={() =>
                                handleSwitchChange(
                                  rec.speciality_id,
                                  rec.status === "Y" ? "N" : "Y",
                                  rec.speciality_name
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

              {/* PAGINATION */}
              <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap">
                {/* Total Records / Total Pages */}
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
            <button className="page-link" onClick={() => setCurrentPage(num + 1)}>{num + 1}</button>
          </li>
        ))}
        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
          <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
        </li>
      </ul>
    </nav>
  
                {/* Go to Page */}
                <div className="d-flex align-items-center">
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
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
            // FORM
            <form className="row" onSubmit={handleSave}>
              <div className="form-group col-md-4">
                <label>Speciality Code <span className="text-danger">*</span></label>
                <input id="speciality_code" className="form-control" value={formData.speciality_code} onChange={handleInputChange} />
              </div>

              <div className="form-group col-md-4">
                <label>Speciality Name <span className="text-danger">*</span></label>
                <input id="speciality_name" className="form-control" value={formData.speciality_name} onChange={handleInputChange} />
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
                    <strong>{confirmDialog.specialityName}</strong>?
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

export default SpecialityMaster;
