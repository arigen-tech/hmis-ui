import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const CrossMatchType = () => {
  const [crossMatchData, setCrossMatchData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    crossMatchType: ""
  });

  const [popupMessage, setPopupMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    crossMatchType: ""
  });

  const [loading, setLoading] = useState(true);
  const MAX_LENGTH = 50;

  /* -------- ORIGINAL CROSS MATCH TYPE DATA -------- */
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setCrossMatchData([
        { id: 1, code: "CMT001", crossMatchType: "Immediate Spin Crossmatch", status: "y", lastUpdated: "10/01/2026" },
        { id: 2, code: "CMT002", crossMatchType: "Electronic Crossmatch", status: "y", lastUpdated: "12/01/2026" },
        { id: 3, code: "CMT003", crossMatchType: "Antiglobulin Crossmatch", status: "y", lastUpdated: "14/01/2026" },
        { id: 4, code: "CMT004", crossMatchType: "Full Crossmatch", status: "n", lastUpdated: "16/01/2026" },
        { id: 5, code: "CMT005", crossMatchType: "Emergency Crossmatch", status: "n", lastUpdated: "18/01/2026" }
      ]);
      setLoading(false);
    }, 600);
  }, []);

  /* -------- SEARCH -------- */
  const filteredData = crossMatchData.filter(item =>
  item.crossMatchType.toLowerCase().includes(searchQuery.toLowerCase()) ||
  (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase()))
);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

  /* -------- HANDLERS -------- */
  const showPopup = (message, type = "success") => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

 const handleEdit = (record) => {
  setEditingRecord(record);
  setFormData({
    code: record.code,
    crossMatchType: record.crossMatchType
  });
  setIsFormValid(true);
  setShowForm(true);
};

  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    if (editingRecord) {
      setCrossMatchData(prev =>
        prev.map(item =>
          item.id === editingRecord.id
            ? { ...item, code: formData.code, crossMatchType: formData.crossMatchType }
            : item
        )
      );
      showPopup("Cross Match Type updated successfully");
    } else {
      setCrossMatchData(prev => [
        ...prev,
        {
          id: Date.now(),
          code: formData.code,
          crossMatchType: formData.crossMatchType,
          status: "y",
          lastUpdated: new Date().toLocaleDateString("en-GB")
        }
      ]);
      showPopup("Cross Match Type added successfully");
    }

    handleBack();
  };

  const handleSwitchChange = (id, newStatus, crossMatchType) => {
    setConfirmDialog({ isOpen: true, id, newStatus, crossMatchType });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed) {
      setCrossMatchData(prev =>
        prev.map(item =>
          item.id === confirmDialog.id
            ? { ...item, status: confirmDialog.newStatus }
            : item
        )
      );
      showPopup(
        `Cross Match Type ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"}`
      );
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "", crossMatchType: "" });
  };

  const handleInputChange = (e) => {
  const { name, value } = e.target;
  const updatedForm = {
    ...formData,
    [name]: value
  };
  setFormData(updatedForm);
  setIsFormValid(
    updatedForm.code.trim() !== "" &&
    updatedForm.crossMatchType.trim() !== ""
  );
};

 const handleBack = () => {
  setShowForm(false);
  setEditingRecord(null);
  setFormData({
    code: "",
    crossMatchType: ""
  });
  setIsFormValid(false);
};
  /* -------- UI -------- */
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title">Cross Match Type Master</h4>

          <div className="d-flex gap-2">
            {!showForm && (
              <input
                type="search"
                className="form-control"
                placeholder="Search Cross Match Type"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "220px" }}
              />
            )}

            {!showForm ? (
              <>
                <button className="btn btn-success" onClick={() => setShowForm(true)}>Add</button>
                <button className="btn btn-success" onClick={() => setSearchQuery("")}>Show All</button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={handleBack}>Back</button>
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
                    <th>Code</th>
                    <th>Cross Match Type</th>
                    <th>Last Updated</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map(item => (
                    <tr key={item.id}>
                      <td>{item.code}</td>
                      <td>{item.crossMatchType}</td>
                      <td>{item.lastUpdated}</td>
                      <td>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={item.status === "y"}
                            onChange={() =>
                              handleSwitchChange(
                                item.id,
                                item.status === "y" ? "n" : "y",
                                item.crossMatchType
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
                  ))}
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
              <div className="row">
                <div className="form-group col-md-6">
                  <label> Code </label>
                  <input
                    type="text"
                    name="code"
                    className="form-control"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="code"
                    required
                  />
                </div>
              <div className="form-group col-md-6">
                <label>Cross Match Type <span className="text-danger">*</span></label>
                <input
                  type="text"
                  name="crossMatchType"
                  className="form-control"
                  value={formData.crossMatchType}
                  maxLength={MAX_LENGTH}
                  onChange={handleInputChange}
                  placeholder="cross match type"
                  required
                />
              </div>
</div>
              <div className="mt-3 text-end">
                <button className="btn btn-primary me-2" disabled={!isFormValid}>Save</button>
                <button className="btn btn-danger" type="button" onClick={handleBack}>Cancel</button>
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
                    Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                    <strong>{confirmDialog.crossMatchType}</strong>?
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

export default CrossMatchType;
