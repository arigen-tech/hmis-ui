import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";

const OutputTypeMaster = () => {
  const [data, setData] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    outputTypeName: ""
  });

  const [loading] = useState(false);

  const [formData, setFormData] = useState({
    output_type_name: "",
    is_measurable: "Y",
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

  // ================== LOAD SAMPLE DATA ==================
  useEffect(() => {
    const sample = [
      { id: 1, output_type_name: "Urine", is_measurable: "Y", description: "Measured in ml", status: "Y", last_update_date: "2025-01-10" },
      { id: 2, output_type_name: "Stool", is_measurable: "Y", description: "Measured in gm or episodes", status: "Y", last_update_date: "2025-01-09" },
      { id: 3, output_type_name: "Vomit", is_measurable: "N", description: "Episode count", status: "Y", last_update_date: "2025-01-08" },
      { id: 4, output_type_name: "Sweat", is_measurable: "N", description: "Not measurable", status: "Y", last_update_date: "2025-01-07" },
      { id: 5, output_type_name: "Drain Output", is_measurable: "Y", description: "Measured in ml", status: "Y", last_update_date: "2025-01-07" },
      { id: 6, output_type_name: "Blood Loss", is_measurable: "Y", description: "Measured in ml", status: "N", last_update_date: "2025-01-06" },
      { id: 7, output_type_name: "Saliva", is_measurable: "N", description: "Not measured", status: "Y", last_update_date: "2025-01-05" },
      { id: 8, output_type_name: "Mucus", is_measurable: "N", description: "Episode count", status: "Y", last_update_date: "2025-01-04" },
      { id: 9, output_type_name: "Tears", is_measurable: "N", description: "Not measurable", status: "Y", last_update_date: "2025-01-03" },
      { id: 10, output_type_name: "Fluid from Wound", is_measurable: "Y", description: "Measured in ml", status: "Y", last_update_date: "2025-01-02" },
    ];
    setData(sample);
  }, []);

  // ================== SEARCH FILTER ==================
  const filteredData = data.filter((rec) =>
    rec.output_type_name.toLowerCase().includes(searchQuery.toLowerCase())
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

  // ================== SAVE / UPDATE ==================
  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const duplicate = data.some(
      (rec) =>
        rec.output_type_name.toLowerCase() === formData.output_type_name.toLowerCase() &&
        (!editingRecord || editingRecord.id !== rec.id)
    );

    if (duplicate) {
      showPopup("Output Type Name already exists!", "error");
      return;
    }

    const currentTimestamp = new Date().toLocaleString();

    if (editingRecord) {
      const updated = data.map((rec) =>
        rec.id === editingRecord.id
          ? { ...rec, ...formData, last_update_date: currentTimestamp }
          : rec
      );
      setData(updated);
      showPopup("Record updated successfully!", "success");
    } else {
      const newData = {
        id: Date.now(),
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

  const resetForm = () => {
    setFormData({
      output_type_name: "",
      is_measurable: "Y",
      description: "",
    });
    setIsFormValid(false);
  };

  // ================== EDIT ==================
  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({
      output_type_name: rec.output_type_name,
      is_measurable: rec.is_measurable,
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
    setIsFormValid(updated.output_type_name.trim() !== "");
  };

  // ================== STATUS CHANGE ==================
  const handleSwitchChange = (id, newStatus, outputTypeName) => {
    setConfirmDialog({ isOpen: true, id, newStatus, outputTypeName });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed) {
      const updated = data.map((rec) =>
        rec.id === confirmDialog.id
          ? { ...rec, status: confirmDialog.newStatus }
          : rec
      );
      setData(updated);
      showPopup("Status updated!", "success");
    }

    setConfirmDialog({ isOpen: false, id: null, newStatus: "", outputTypeName: "" });
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  // ================== HANDLE GO PAGE ==================
  const handlePageNavigation = () => {
    const page = Number(pageInput);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
    setPageInput("");
  };

  // ================== PAGINATION COMPONENT ==================
  const Pagination = () => (
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
  );

  // ================== UI ==================
  return (
    <div className="content-wrapper">
      <div className="card form-card">

        {/* HEADER SECTION */}
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Output Type Master</h4>
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
                  onClick={() => { resetForm(); setShowForm(true); setEditingRecord(null); }}
                >
                  Add
                </button>
                <button className="btn btn-success" onClick={handleRefresh}>Show All</button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Back</button>
            )}
          </div>
        </div>

        {/* BODY SECTION */}
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
                      <th>ID</th>
                      <th>Output Type Name</th>
                      <th>Is Measurable</th>
                      <th>Description</th>
                      <th>Last Update Date</th>
                      <th>Status</th>
                      <th>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((rec) => (
                      <tr key={rec.id}>
                        <td>{rec.id}</td>
                        <td>{rec.output_type_name}</td>
                        <td>{rec.is_measurable === "Y" ? "Yes" : "No"}</td>
                        <td>{rec.description}</td>
                        <td>{rec.last_update_date}</td>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={rec.status === "Y"}
                              onChange={() => handleSwitchChange(rec.id, rec.status === "Y" ? "N" : "Y", rec.output_type_name)}
                            />
                            <label className="form-check-label">{rec.status === "Y" ? "Active" : "Inactive"}</label>
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
              <div className="d-flex align-items-center justify-content-between mt-3 flex-wrap">
                <div>Page {currentPage} of {totalPages} | Total Records: {filteredData.length}</div>
                <div className="d-flex justify-content-center"><Pagination /></div>
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
            // ================== FORM ==================
            <form className="row" onSubmit={handleSave}>
              <div className="form-group col-md-4">
                <label>Output Type Name <span className="text-danger">*</span></label>
                <input
                  type="text"
                  id="output_type_name"
                  className="form-control mt-1"
                  placeholder="Enter Output Type"
                  value={formData.output_type_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group col-md-4">
                <label>Is Measurable<span className="text-danger">*</span></label>
                <select
                  id="is_measurable"
                  className="form-control mt-1"
                  value={formData.is_measurable}
                  onChange={handleInputChange}
                >
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </select>
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
                <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>Save</button>
                <button className="btn btn-danger" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          )}

          {/* POPUP */}
          {popupMessage && (
            <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
          )}

          {/* CONFIRM POPUP */}
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
                     <strong>{confirmDialog.outputTypeName}</strong>?
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

export default OutputTypeMaster;
