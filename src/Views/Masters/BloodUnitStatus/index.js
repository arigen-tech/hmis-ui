import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const BloodUnitStatus = () => {
  const [bloodUnitData, setBloodUnitData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    unitStatus: ""
  });

  const [popupMessage, setPopupMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const [formData, setFormData] = useState({
    unitStatus: ""
  });

  const [loading, setLoading] = useState(true);

  const MAX_LENGTH = 50;

  /* ---------------- ORIGINAL DUMMY DATA (5) ---------------- */
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setBloodUnitData([
        { id: 1, unitStatus: "Available", status: "y", lastUpdated: "10/01/2026" },
        { id: 2, unitStatus: "Reserved", status: "y", lastUpdated: "12/01/2026" },
        { id: 3, unitStatus: "Issued", status: "n", lastUpdated: "14/01/2026" },
        { id: 4, unitStatus: "Expired", status: "y", lastUpdated: "16/01/2026" },
        { id: 5, unitStatus: "Discarded", status: "n", lastUpdated: "18/01/2026" }
      ]);
      setLoading(false);
    }, 600);
  }, []);

  /* ---------------- SEARCH ---------------- */
  const filteredData = bloodUnitData.filter(item =>
    item.unitStatus.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

  /* ---------------- HANDLERS ---------------- */
  const showPopup = (message, type = "success") => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({ unitStatus: record.unitStatus });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    if (editingRecord) {
      setBloodUnitData(prev =>
        prev.map(item =>
          item.id === editingRecord.id
            ? { ...item, unitStatus: formData.unitStatus }
            : item
        )
      );
      showPopup("Blood Unit Status updated successfully");
    } else {
      setBloodUnitData(prev => [
        ...prev,
        {
          id: Date.now(),
          unitStatus: formData.unitStatus,
          status: "y",
          lastUpdated: new Date().toLocaleDateString("en-GB")
        }
      ]);
      showPopup("Blood Unit Status added successfully");
    }

    setShowForm(false);
    setEditingRecord(null);
    setFormData({ unitStatus: "" });
    setIsFormValid(false);
  };

  const handleSwitchChange = (id, newStatus, unitStatus) => {
    setConfirmDialog({ isOpen: true, id, newStatus, unitStatus });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed) {
      setBloodUnitData(prev =>
        prev.map(item =>
          item.id === confirmDialog.id
            ? { ...item, status: confirmDialog.newStatus }
            : item
        )
      );
      showPopup(
        `Blood Unit Status ${
          confirmDialog.newStatus === "y" ? "activated" : "deactivated"
        }`
      );
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "", unitStatus: "" });
  };

  const handleInputChange = (e) => {
    setFormData({ unitStatus: e.target.value });
    setIsFormValid(e.target.value.trim() !== "");
  };

  const handleBack = () => {
    setShowForm(false);
    setEditingRecord(null);
    setFormData({ unitStatus: "" });
    setIsFormValid(false);
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title">Blood Unit Status</h4>

          <div className="d-flex align-items-center gap-2">
            {!showForm && (
              <form className="searchform">
                <div className="input-group">
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search Blood Unit Status"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: "220px" }}
                  />
                  <span className="input-group-text">
                    <i className="fa fa-search"></i>
                  </span>
                </div>
              </form>
            )}

            {!showForm ? (
              <>
                <button className="btn btn-success" onClick={() => setShowForm(true)}>
                  <i className="mdi mdi-plus"></i> Add
                </button>
                <button className="btn btn-success" onClick={() => setSearchQuery("")}>
                  <i className="mdi mdi-refresh"></i> Show All
                </button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={handleBack}>
                <i className="mdi mdi-arrow-left"></i> Back
              </button>
            )}
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <LoadingScreen />
          ) : !showForm ? (
            <>
              <table className="table table-bordered table-hover">
                <thead>
                  <tr>
                    <th>Blood Unit Status</th>
                    <th>Last Updated</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length ? (
                    currentItems.map(item => (
                      <tr key={item.id}>
                        <td>{item.unitStatus}</td>
                        <td>{item.lastUpdated}</td>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                              checked={item.status === "y"}
                              onChange={() =>
                                handleSwitchChange(
                                  item.id,
                                  item.status === "y" ? "n" : "y",
                                  item.unitStatus
                                )
                              }
                            />
                            <label className="form-check-label ms-2">
                              {item.status === "y" ? "Active" : "Inactive"}
                            </label>
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleEdit(item)}
                            disabled={item.status !== "y"}
                          >
                            <i className="fa fa-pencil"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center">
                        No data found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <Pagination
                totalItems={filteredData.length}
                itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </>
          ) : (
            <form onSubmit={handleSave}>
              <div className="form-group col-md-6">
                <label>Blood Unit Status <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.unitStatus}
                  maxLength={MAX_LENGTH}
                  onChange={handleInputChange}
                  required
                />
</div>
                 <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                  <button className="btn btn-primary me-2" disabled={!isFormValid}>
                    Save
                  </button>
                  <button className="btn btn-danger" type="button" onClick={handleBack}>
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
                  <div className="modal-header">
                    <h5>Confirm Status Change</h5>
                  </div>
                  <div className="modal-body">
                    Are you sure you want to{" "}
                    {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                    <strong>{confirmDialog.unitStatus}</strong>?
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

export default BloodUnitStatus;
