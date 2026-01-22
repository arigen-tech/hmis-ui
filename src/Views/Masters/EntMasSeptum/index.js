import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const EntMasSeptum = () => {
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
    septum_status: "",
    status: "Y",
  });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    recordId: null,
    newStatus: null,
  });

  /* ================= LOAD DATA ================= */
  const fetchData = async () => {
    try {
      setLoading(true);

      const dummyData = [
        {
          id: 1,
          septum_status: "Normal",
          status: "Y",
          last_update_date: "2025-12-01 08:30:00",
        },
        {
          id: 2,
          septum_status: "Deviated",
          status: "Y",
          last_update_date: "2025-12-02 09:15:00",
        },
        {
          id: 3,
          septum_status: "Perforated",
          status: "N",
          last_update_date: "2025-12-03 10:00:00",
        },
      ];
      setData(dummyData);
    } catch (err) {
      showPopup("Failed to fetch data!", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ================= FILTER + PAGINATION ================= */
  const filteredData = data.filter((rec) =>
    rec.septum_status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);


  /* ================= POPUP ================= */
  const showPopup = (message, type = "info") => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  /* ================= HANDLERS ================= */
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
    const updated = {
      ...formData,
      [id]: type === "checkbox" ? (checked ? "Y" : "N") : value,
    };
    setFormData(updated);
    setIsFormValid(updated.septum_status.trim() !== "");
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
    setFormData({ septum_status: rec.septum_status, status: rec.status });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, recordId: id, newStatus });
  };

  const handleConfirmStatusChange = (confirmed) => {
    if (confirmed) {
      setData(
        data.map((rec) =>
          rec.id === confirmDialog.recordId
            ? { ...rec, status: confirmDialog.newStatus }
            : rec
        )
      );
      showPopup("Status updated successfully!", "success");
    }
    setConfirmDialog({ isOpen: false, recordId: null, newStatus: null });
  };

  const resetForm = () => {
    setFormData({
      septum_status: "",
      status: "Y",
    });
    setEditingRecord(null);
    setShowForm(false);
    setIsFormValid(false);
  };

  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title"> Septum Master</h4>

          <div className="d-flex align-items-center">
            {!showForm && (
              <input
                type="text"
                className="form-control w-50 me-2"
                placeholder="Search Septum Status"
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
                <button className="btn btn-success" onClick={handleRefresh}>
                  Show All
                </button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={resetForm}>
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
                      <th>Septum Status</th>
                      <th>Last Update</th>
                      <th>Status</th>
                      <th>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length ? (
                      currentItems.map((rec) => (
                        <tr key={rec.id}>
                          <td>{rec.id}</td>
                          <td>{rec.septum_status}</td>
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
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleEdit(rec)}
                              disabled={rec.status !== "Y"}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : ( <tr><td colSpan="5" className="text-center">No record found</td></tr> )}
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
              <div className="form-group col-md-6">
                <label>Septum Status</label>
                <input
                  type="text"
                  id="septum_status"
                  className="form-control mt-1"
                  value={formData.septum_status}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group col-md-12 mt-3 text-end">
                <button className="btn btn-primary me-2" disabled={!isFormValid}>
                  Save
                </button>
                <button className="btn btn-danger" type="button" onClick={resetForm}>
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
                    Are you sure you want to{" "}
                    {confirmDialog.newStatus === "Y" ? "activate" : "deactivate"}?
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => handleConfirmStatusChange(false)}>No</button>
                    <button className="btn btn-primary" onClick={() => handleConfirmStatusChange(true)}>Yes</button>
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

export default EntMasSeptum;
