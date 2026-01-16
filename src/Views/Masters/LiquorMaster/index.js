import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const LiquorMaster = () => {
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
    liquor_value: "",
  });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    recordId: null,
    newStatus: null,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const dummyData = [
        { id: 1, liquor_value: "Clear", status: "Y", last_updated_date: "2025-12-01 08:30:00" },
        { id: 2, liquor_value: "Bloody", status: "Y", last_updated_date: "2025-12-02 09:15:00" },
        { id: 3, liquor_value: "Turbid", status: "N", last_updated_date: "2025-12-03 10:00:00" },
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

  const filteredData = data.filter((rec) =>
    rec.liquor_value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE
    const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE
    const currentItems = filteredData.slice(indexOfFirst, indexOfLast)

  const showPopup = (message, type) =>
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });

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
    const { id, value } = e.target;
    const updated = { ...formData, [id]: value };
    setFormData(updated);
    setIsFormValid(updated.liquor_value.trim() !== "");
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const now = new Date().toISOString().replace("T", " ").split(".")[0];

    if (editingRecord) {
      setData(
        data.map((rec) =>
          rec.id === editingRecord.id
            ? { ...rec, liquor_value: formData.liquor_value, last_updated_date: now }
            : rec
        )
      );
      showPopup("Record updated successfully!", "success");
    } else {
      setData([
        ...data,
        { id: Date.now(), liquor_value: formData.liquor_value, status: "Y", last_updated_date: now },
      ]);
      showPopup("New record added successfully!", "success");
    }

    resetForm();
  };

  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({ liquor_value: rec.liquor_value });
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
          rec.id === confirmDialog.recordId ? { ...rec, status: confirmDialog.newStatus } : rec
        )
      );

      const recordName = data.find((rec) => rec.id === confirmDialog.recordId)?.liquor_value;

      showPopup(
        `${recordName} ${confirmDialog.newStatus === "Y" ? "Activated" : "Deactivated"} successfully!`,
        "success"
      );
    }
    setConfirmDialog({ isOpen: false, recordId: null, newStatus: null });
  };

  const resetForm = () => {
    setFormData({ liquor_value: "" });
    setEditingRecord(null);
    setShowForm(false);
    setIsFormValid(false);
  };
  if (loading) return <LoadingScreen />;

  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title">Liquor Master</h4>

          <div className="d-flex align-items-center">
            {!showForm && (
              <input
                type="text"
                className="form-control me-2"
                placeholder="Search"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            )}

            {!showForm ? (
              <>
                <button className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                  Add
                </button>
                <button className="btn btn-success me-2" onClick={handleRefresh}>
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
                      <th>Liquor Value</th>
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
                          <td>{rec.liquor_value}</td>
                          <td>{rec.last_updated_date}</td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={rec.status === "Y"}
                                onChange={() =>
                                  handleSwitchChange(rec.id, rec.status === "Y" ? "N" : "Y")
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
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center">
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
              <div className="form-group col-md-6">
                <label>
                  Liquor Value <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  id="liquor_value"
                  className="form-control mt-1"
                  value={formData.liquor_value}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group col-md-12 mt-3 d-flex justify-content-end">
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
            <div className="modal d-block" tabIndex="-1">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Confirm Status Change</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => handleConfirmStatusChange(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    Are you sure you want to{" "}
                    {confirmDialog.newStatus === "Y" ? "activate" : "deactivate"}{" "}
                    <strong>
                      {data.find((rec) => rec.id === confirmDialog.recordId)?.liquor_value}
                    </strong>
                    ?
                  </div>
                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleConfirmStatusChange(false)}
                    >
                      No
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleConfirmStatusChange(true)}
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

export default LiquorMaster;