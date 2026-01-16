
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const EarTmStatusMaster = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");
  const itemsPerPage = 5;

  const [formData, setFormData] = useState({
    use_name: "",
    created_by: "",
    last_updated_by: "",
    status: "Y",
  });

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, recordId: null, newStatus: null });

  const fetchData = async () => {
    try {
      setLoading(true);
      const dummyData = [
        { id: 1, use_name: "Intact", status: "Y", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-12-01 08:30:00" },
        { id: 2, use_name: "Perforated", status: "Y", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-12-02 09:15:00" },
        { id: 3, use_name: "Scarred", status: "N", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-12-03 10:00:00" },
        { id: 4, use_name: "Retracted", status: "Y", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-12-04 10:45:00" },
        { id: 5, use_name: "Bulging", status: "Y", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-12-05 11:30:00" },
        { id: 6, use_name: "Otoscopy Others", status: "Y", created_by: "Admin", last_updated_by: "Admin", last_update_date: "2025-12-06 12:00:00" },
      ];
      setData(dummyData);
    } catch (err) {
      console.error(err);
      showPopup("Failed to fetch data!", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredData = data.filter((rec) =>
    rec.use_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

 const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);


  const showPopup = (message, type = "info") => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchData();
  };

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    let updated = { ...formData };
    if (type === "checkbox") updated[id] = checked ? "Y" : "N";
    else updated[id] = value;
    setFormData(updated);
    setIsFormValid(updated.use_name.trim() !== "");
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    const now = new Date().toISOString().replace("T", " ").split(".")[0];

    if (editingRecord) {
      setData(
        data.map((rec) =>
          rec.id === editingRecord.id
            ? { ...rec, ...formData, last_update_date: now }
            : rec
        )
      );
      showPopup("Record updated successfully!", "success");
    } else {
      setData([
        ...data,
        { id: Date.now(), ...formData, last_update_date: now },
      ]);
      showPopup("New record added successfully!", "success");
    }
    resetForm();
  };

  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({ ...rec });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, recordId: id, newStatus });
  };

  const handleConfirmStatusChange = (confirmed) => {
    if (confirmed && confirmDialog.recordId !== null) {
      setData(
        data.map((rec) =>
          rec.id === confirmDialog.recordId
            ? { ...rec, status: confirmDialog.newStatus }
            : rec
        )
      );

      showPopup(
        confirmDialog.newStatus === "Y"
          ? "Activated successfully!"
          : "Deactivated successfully!",
        "success"
      );
    }
    setConfirmDialog({ isOpen: false, recordId: null, newStatus: null });
  };

  const resetForm = () => {
    setFormData({
      use_name: "",
      created_by: "",
      last_updated_by: "",
      status: "Y",
    });
    setEditingRecord(null);
    setShowForm(false);
    setIsFormValid(false);
  };

  const handleGoToPage = () => {
    const pageNumber = parseInt(pageInput, 10);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      setPageInput("");
    } else {
      alert("Invalid page number");
    }
  };

  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title">Ear Tympanic Membrane Status Master</h4>
          <div className="d-flex align-items-center">
            {!showForm && (
              <input
                type="text"
                className="form-control w-50 me-2"
                placeholder="Search by Name"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            )}
            {!showForm ? (
              <>
                <button
                  className="btn btn-success me-2"
                  onClick={() => setShowForm(true)}
                >
                  Add
                </button>
                <button
                  className="btn btn-success flex-shrink-0"
                  onClick={handleRefresh}
                >
                  Show All
                </button>
              </>
            ) : (
              <button
                className="btn btn-secondary"
                onClick={resetForm}
              >
                Back
              </button>
            )}
          </div>
        </div>

        <div className="card-body">
          {!showForm ? (
            <>
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Last Update Date</th>
                      <th>Status</th>
                      <th>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length ? (
                      currentItems.map((rec) => (
                        <tr key={rec.id}>
                          <td>{rec.id}</td>
                          <td>{rec.use_name}</td>
                          <td>{rec.last_update_date}</td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={rec.status === "Y"}
                                onChange={() =>
                                  handleSwitchChange(
                                    rec.id,
                                    rec.status === "Y" ? "N" : "Y"
                                  )
                                }
                              />
                              <label className="form-check-label">
                                {rec.status === "Y"
                                  ? "Active"
                                  : "Inactive"}
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
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="text-center"
                        >
                          No record found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

               {/* PAGINATION */}
                           <Pagination
                                             totalItems={filteredData.length}
                                             itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                             currentPage={currentPage}
                                             onPageChange={setCurrentPage}
                                       />    
            </>
          ) : (
            <form className="row" onSubmit={handleSave}>
              <div className="form-group col-md-4">
                <label>
                  Name <span className="text-danger"></span>
                </label>
                <input
                  type="text"
                  id="use_name"
                  className="form-control mt-1"
                  value={formData.use_name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group col-md-12 mt-3 d-flex justify-content-end">
                <button
                  className="btn btn-primary me-2"
                  disabled={!isFormValid}
                >
                  Save
                </button>
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {popupMessage && <Popup {...popupMessage} />}

          {confirmDialog.isOpen && (
            <div className="modal d-block" tabIndex="-1">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      Confirm Status Change
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() =>
                        handleConfirmStatusChange(false)
                      }
                    ></button>
                  </div>
                  <div className="modal-body">
                    <p>
                      Are you sure you want to{" "}
                      {confirmDialog.newStatus === "Y"
                        ? "activate"
                        : "deactivate"}{" "}
                      <strong>
                        {
                          data.find(
                            (rec) =>
                              rec.id === confirmDialog.recordId
                          )?.use_name
                        }
                      </strong>
                      ?
                    </p>
                  </div>
                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() =>
                        handleConfirmStatusChange(false)
                      }
                    >
                      No
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() =>
                        handleConfirmStatusChange(true)
                      }
                    >
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

export default EarTmStatusMaster;
