import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, {
  DEFAULT_ITEMS_PER_PAGE,
} from "../../../Components/Pagination";

const OptionValueMaster = () => {
  const [data, setData] = useState([]);
  const [loading] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    Code: "",
  });

  const [formData, setFormData] = useState({
    Code: "",
    Value: "",
    Name: "",
    Score: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ================= PAGINATION =================
  const [currentPage, setCurrentPage] = useState(1);
  const [goPage, setGoPage] = useState("");
  const itemsPerPage = 5;

  // ================= SAMPLE DATA =================
  useEffect(() => {
    setData([
  

      {
        id: 2,
        Code: "BN",
        Value: "Little interest or pleasure in doing things",
        Score: 2,
        Name: "depression Screener",

        status: "Y",
      },
      {
        id: 3,
        Code: "AN",
        Value: "Feeling nervous, anxious or on edge",
        Score: 3,
        Name: "Anxiety Screener",

        status: "Y",
      },
      {
        id: 4,
        Code: "AN3",
        Value: "Not being able to stop worrying",

        Score: 4,
        Name: "stress Assessment",
        status: "Y",
      },
      {
        id: 4,
        Code: "AN3",
        Value: "Not being able to stop worrying",
        Score: 5,
        Name: "Stress Assessment",
        status: "Y",
      },
      
    ]);
  }, []);

  // ================= SEARCH =================
  const filteredData = data.filter((rec) =>
  rec.Code?.toLowerCase().includes(searchQuery.toLowerCase())
);

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

  // ================= FORM =================
  const handleInputChange = (e) => {
    const { id, value } = e.target;

    let updated = { ...formData, [id]: value };

    if (id === "Code") {
      updated.Name = "";
    }

    setFormData(updated);

    setIsFormValid(
      updated.Code && updated.Value && updated.Name && updated.score !== "",
    );
  };

  const resetForm = () => {
    setFormData({
      Code: "",
      Value: "",
      Name: "",
      Score: "",
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
          rec.id === editingRecord.id ? { ...rec, ...formData } : rec,
        ),
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
  const handleSwitchChange = (id, newStatus, Code) => {
    setConfirmDialog({ isOpen: true, id, newStatus, Code });
  };
  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleConfirm = (confirmed) => {
    if (confirmed) {
      setData(
        data.map((rec) =>
          rec.id === confirmDialog.id
            ? { ...rec, status: confirmDialog.newStatus }
            : rec,
        ),
      );
      showPopup("Status updated successfully", "success");
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "", Code: "" });
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  // ================= UI =================
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        {/* HEADER */}
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Option Value Master</h4>
          <div className="d-flex">
            {!showForm && (
              <input
                type="text"
                style={{ width: "220px" }}
                className="form-control me-2"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
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
              <button
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Back
              </button>
            )}
          </div>
        </div>
        <div className="card-body">
          {/* ================= LIST ================= */}
          {!showForm && (
            <>
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Option Code</th>
                    <th>Option Value</th>
                    <th>Option Score</th>
                    <th>Question Name</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((rec) => (
                    <tr key={rec.id}>
                      <td>{rec.Code}</td>
                      <td>{rec.Value}</td>
                      <td>{rec.Score}</td>
                      <td>{rec.Name}</td>

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
                                rec.Code,
                              )
                            }
                          />
                          <label className="form-check-label ms-2">
                            {rec.status === "Y" ? "Active" : "Inactive"}
                          </label>
                        </div>
                      </td>

                      <td>
                        <button
                          className="btn btn-success btn-sm"
                          disabled={rec.status !== "Y"}
                          onClick={() => handleEdit(rec)}
                        >
                          <i className="fa fa-pencil"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* PAGINATION */}
              <Pagination
                totalItems={filteredData.length}
                itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </>
          )}

          {/* ================= FORM ================= */}
          {showForm && (
            <form onSubmit={handleSave} className="row g-3">
              <div className="col-md-4">
                <label>
                Option  Code <span className="text-danger">*</span>
                </label>
                <input
                  id="Code"
                  className="form-control"
                  value={formData.Code}
                  onChange={handleInputChange}
                />
              </div>

              <div className="col-md-4">
                <label>
                 Option Value<span className="text-danger">*</span>
                </label>
                <input
                  id="Value"
                  className="form-control"
                  value={formData.Value}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-4">
                <label>
                 Option Score <span className="text-danger">*</span>
                </label>
                <input
                  id="Score"
                  type="number"
                  className="form-control"
                  value={formData.Score}
                  onChange={handleInputChange}
                />
              </div>

              <div className="col-md-4">
  <label>
    Question Name <span className="text-danger">*</span>
  </label>

  <select
    id="Name"
    className="form-select"
    value={formData.Name}
    onChange={handleInputChange}
  >
    <option value="">Select Question</option>
    <option value="Depression Screener">Depression Screener</option>
    <option value="Anxiety Screener">Anxiety Screener</option>
    <option value="Stress Assessment">Stress Assessment</option>
  </select>
</div>

              <div className="col-12 text-end">
                               <button className="btn btn-primary me-2" disabled={!isFormValid}>Save</button>

                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => setShowForm(false)}
                >
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
                    {confirmDialog.newStatus === "Y"
                      ? "activate"
                      : "deactivate"}{" "}
                    <strong>{confirmDialog.Code}</strong>?
                  </div>
                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleConfirm(false)}
                    >
                      No
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleConfirm(true)}
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

export default OptionValueMaster;
