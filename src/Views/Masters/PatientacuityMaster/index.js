import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";

const PatientacuityMaster = () => {
  const [data, setData] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    acuityName: "",
  });

  const [loading] = useState(false);

  const [formData, setFormData] = useState({
    acuity_code: "",
    acuity_name: "",
    description: "",
    
  });

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");
  const itemsPerPage = 5;

  // ================== SAMPLE DATA ==================
  useEffect(() => {
    const sample = [
      { acuity_code: "AC01", acuity_name: "Critical", description: "Immediate care required", status: "Y",  last_update_date: "2025-01-10" },
      { acuity_code: "AC02", acuity_name: "High", description: "Urgent priority", status: "Y", last_update_date: "2025-01-09" },
      { acuity_code: "AC03", acuity_name: "Moderate", description: "Observation required", status: "Y",last_update_date: "2025-01-08" },
      { acuity_code: "AC04", acuity_name: "Low", description: "Non-urgent", status: "N", last_update_date: "2025-01-07" },
      { acuity_code: "AC05", acuity_name: "Stable", description: "Routine monitoring", status: "Y",last_update_date: "2025-01-07" },
      { acuity_code: "AC06", acuity_name: "Observation", description: "Mild symptoms", status: "Y",last_update_date: "2025-01-06" },
    ];
    setData(sample);
  }, []);

  // ================== SEARCH FILTER ==================
  const filteredData = data.filter((rec) =>
    rec.acuity_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTotalPages = Math.ceil(filteredData.length / itemsPerPage);

  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // ================== GO TO PAGE ==================
  const handlePageNavigation = () => {
    const page = parseInt(pageInput);
    if (!page || page < 1 || page > filteredTotalPages) return;
    setCurrentPage(page);
    setPageInput("");
  };

  // ================== SAVE / UPDATE ==================
  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const duplicate = data.some(
      (rec) =>
        rec.acuity_code.toLowerCase() === formData.acuity_code.toLowerCase() &&
        (!editingRecord || editingRecord.acuity_code !== rec.acuity_code)
    );

    if (duplicate) {
      showPopup("Acuity Code already exists!", "error");
      return;
    }

    const currentTimestamp = new Date().toLocaleString();

    if (editingRecord) {
      const updated = data.map((rec) =>
        rec.acuity_code === editingRecord.acuity_code
          ? { ...rec, ...formData, last_update_date: currentTimestamp }
          : rec
      );
      setData(updated);
      showPopup("Record updated successfully!", "success");
    } else {
      const newData = {
        ...formData,
        status: "Y",
        last_update_date: currentTimestamp,
      };
      setData([...data, newData]);
      showPopup("Record added successfully!", "success");
    }

    setShowForm(false);
    setEditingRecord(null);
    resetForm();
  };

  // ================== RESET FORM ==================
  const resetForm = () => {
    setFormData({
      acuity_code: "",
      acuity_name: "",
      description: "",
      
    });
    setIsFormValid(false);
  };

  // ================== EDIT ==================
  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({
      acuity_code: rec.acuity_code,
      acuity_name: rec.acuity_name,
      description: rec.description,
     
    });
    setShowForm(true);
    setIsFormValid(true);
  };

  // ================== INPUT CHANGE ==================
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const updated = { ...formData, [id]: value };
    setFormData(updated);
    setIsFormValid(
      updated.acuity_code.trim() !== "" && updated.acuity_name.trim() !== ""
    );
  };

  // ================== STATUS CHANGE ==================
  const handleSwitchChange = (code, newStatus, name) => {
    setConfirmDialog({
      isOpen: true,
      id: code,
      newStatus,
      acuityName: name,
    });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed) {
      const updated = data.map((rec) =>
        rec.acuity_code === confirmDialog.id
          ? { ...rec, status: confirmDialog.newStatus }
          : rec
      );
      setData(updated);
      showPopup("Status updated!", "success");
    }

    setConfirmDialog({ isOpen: false, id: null, newStatus: "", acuityName: "" });
  };

  // ================== POPUP ==================
  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  // ================== PAGINATION ==================
  const Pagination = () => (
    <nav>
      <ul className="pagination">
        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
          <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>
            Prev
          </button>
        </li>

        {[...Array(filteredTotalPages).keys()].map((num) => (
          <li
            key={num}
            className={`page-item ${currentPage === num + 1 ? "active" : ""}`}
          >
            <button className="page-link" onClick={() => setCurrentPage(num + 1)}>
              {num + 1}
            </button>
          </li>
        ))}

        <li className={`page-item ${currentPage === filteredTotalPages ? "disabled" : ""}`}>
          <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>
            Next
          </button>
        </li>
      </ul>
    </nav>
  );

  // ================== UI RENDER ==================
  return (
    <div className="content-wrapper">
      <div className="card form-card">

        {/* HEADER */}
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Patient Acuity Master</h4>

          <div className="d-flex">
            {!showForm && (
              <input
                type="text"
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
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                    setEditingRecord(null);
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
              {/* TABLE */}
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Acuity Code</th>
                      <th>Acuity Name</th>
                      <th>Description</th>      
                      <th>Last Update Date</th>
                      <th>Status</th>
                      <th>Edit</th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentItems.map((rec) => (
                      <tr key={rec.acuity_code}>
                        <td>{rec.acuity_code}</td>
                        <td>{rec.acuity_name}</td>
                        <td>{rec.description}</td>
                       
                        <td>{rec.last_update_date}</td>

                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={rec.status === "Y"}
                              onChange={() =>
                                handleSwitchChange(
                                  rec.acuity_code,
                                  rec.status === "Y" ? "N" : "Y",
                                  rec.acuity_name
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
<div className="d-flex align-items-center mt-3 flex-wrap">

  {/* LEFT : PAGE INFO */}
  <div className="me-auto">
    Page {currentPage} of {filteredTotalPages} | Total Records: {filteredData.length}
  </div>

  {/* CENTER : PAGINATION */}
  <div className="mx-auto">
    <Pagination />
  </div>

  {/* RIGHT : GO TO PAGE */}
  <div className="d-flex align-items-center ms-auto">
    <input
      type="number"
      min="1"
      max={filteredTotalPages}
      value={pageInput}
      onChange={(e) => setPageInput(e.target.value)}
      placeholder="Go To Page"
      className="form-control form-control-sm me-2"
      style={{ width: "70px" }}
    />
    <button
      className="btn btn-sm btn-primary"
      onClick={handlePageNavigation}
    >
      Go
    </button>
  </div>

</div>
            </>
              
          ) : (
            // FORM
            <form className="row" onSubmit={handleSave}>
              <div className="form-group col-md-4">
                <label>Acuity Code <span className="text-danger">*</span></label>
                <input
                  type="text"
                  id="acuity_code"
                  className="form-control mt-1"
                  placeholder="Enter Acuity Code"
                  value={formData.acuity_code}
                  onChange={handleInputChange}
                  required
                  disabled={!!editingRecord}
                />
              </div>

              <div className="form-group col-md-4">
                <label>Acuity Name <span className="text-danger">*</span></label>
                <input
                  type="text"
                  id="acuity_name"
                  className="form-control mt-1"
                  placeholder="Enter Acuity Name"
                  value={formData.acuity_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group col-md-12 mt-3">
                <label>Description<span className="text-danger">*</span></label>
                <textarea
                  id="description"
                  className="form-control mt-1"
                  rows="2"
                  placeholder="Enter description"
                  value={formData.description}
                  onChange={handleInputChange}
                ></textarea>
              </div>
              <div className="form-group col-md-12 mt-4 d-flex justify-content-end">
                <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                  Save
                </button>
                <button className="btn btn-danger" type="button" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* POPUP */}
          {popupMessage && (
            <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
          )}

          {/* CONFIRM STATUS POPUP */}
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
                
                      {confirmDialog.newStatus === "Y" ? "activate" : "deactivate"}
                    {" "}
                    <strong style={{ color: "black" }}>
                      {confirmDialog.acuityName}
                    </strong>
                       ?
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

export default PatientacuityMaster;
