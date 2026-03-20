import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, {
  DEFAULT_ITEMS_PER_PAGE,
} from "../../../Components/Pagination";

const CrossMatchType = () => {
  const [crossMatchData, setCrossMatchData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    name: "",
  });
  const [popupMessage, setPopupMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    turnaround: "",
    cost: "",
    emergencyAllowed: "",
    description:"",
  });

  const [loading, setLoading] = useState(true);
  const MAX_LENGTH = 50;

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setCrossMatchData([
        {
          id: 1,
          code: "CM001",
          name: "Immediate Spin Crossmatch",
          turnaround: "10",
          cost: "100",
          emergencyAllowed: "Yes",
          description: "Immediate spin crossmatch description",
          status: "y",
        },
        {
          id: 2,
          code: "CM002",
          name: "Electronic Crossmatch",
          turnaround: "15",
          cost: "150",
          emergencyAllowed: "Yes",
          description: "Electronic crossmatch description",
          status: "y",
        },
        {
          id: 3,
          code: "CM003",
          name: "Antiglobulin Crossmatch",
          turnaround: "20",
          cost: "200",
          emergencyAllowed: "No",
          description: "Antiglobulin crossmatch description",
          status: "y",
        },
        {
          id: 4,
          code: "CM004",
          name: "Full Crossmatch",
          turnaround: "30",
          cost: "300",
          emergencyAllowed: "No",
          description: "Full crossmatch description",
          status: "n",
        },
        {
          id: 5,
          code: "CM005",
          name: "Emergency Crossmatch",
          turnaround: "5",
          cost: "500",
          emergencyAllowed: "Yes",
          description: "Emergency crossmatch description",
          status: "y",
        },
      ]);
      setLoading(false);
    }, 600);
  }, []);

  const filteredData = crossMatchData.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.code &&
        item.code.toLowerCase().includes(searchQuery.toLowerCase())),
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
      name: record.name,
      turnaround: record.turnaround,
      cost: record.cost,
      emergencyAllowed: record.emergencyAllowed,
      description: record.description || "",
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    if (editingRecord) {
      setCrossMatchData((prev) =>
        prev.map((item) =>
          item.id === editingRecord.id
            ? {
                ...item,
                code: formData.code,
                name: formData.name,
                turnaround: formData.turnaround,
                cost: formData.cost,
                emergencyAllowed: formData.emergencyAllowed,
                description: formData.description,
              }
            : item,
        ),
      );
      showPopup("Cross Match Type updated successfully");
    } else {
      setCrossMatchData((prev) => [
        ...prev,
        {
          id: Date.now(),
          code: formData.code,
          name: formData.name,
          turnaround: formData.turnaround,
          cost: formData.cost,
          emergencyAllowed: formData.emergencyAllowed,
          description: formData.description,
          status: "y",
        },
      ]);
      showPopup("Cross Match Type added successfully");
    }

    handleBack();
  };

  const handleSwitchChange = (id, newStatus, name) => {
    setConfirmDialog({ isOpen: true, id, newStatus, name });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed) {
      setCrossMatchData((prev) =>
        prev.map((item) =>
          item.id === confirmDialog.id
            ? { ...item, status: confirmDialog.newStatus }
            : item,
        ),
      );
      showPopup(
        `Cross Match Type ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"}`,
      );
    }
    setConfirmDialog({
      isOpen: false,
      id: null,
      newStatus: "",
      name: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = {
      ...formData,
      [name]: value,
    };
    setFormData(updatedForm);
    setIsFormValid(
      updatedForm.code.trim() &&
        updatedForm.name.trim() &&
        updatedForm.turnaround.trim() &&
        updatedForm.cost.trim() &&
        updatedForm.emergencyAllowed &&
        updatedForm.description.trim(),
    );
  };

  const handleBack = () => {
    setShowForm(false);
    setEditingRecord(null);
    setFormData({
      code: "",
      name: "",
      turnaround: "",
      cost: "",
      emergencyAllowed: "",
      description:"",

    });
    setIsFormValid(false);
  };

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
                placeholder="Search Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "220px" }}
              />
            )}

            {!showForm ? (
              <>
                <button
                  className="btn btn-success"
                  onClick={() => setShowForm(true)}
                >
                  Add
                </button>
                <button
                  className="btn btn-success"
                  onClick={() => setSearchQuery("")}
                >
                  Show All
                </button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={handleBack}>
                Back
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
                    <th>Code</th>
                    <th>Name</th>
                    <th>Turnaround (min)</th>
                    <th>cost</th>
                    <th>Emergency Allowed</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.code}</td>
                      <td>{item.name}</td>
                      <td>{item.turnaround}</td>
                      <td>{item.cost}</td>
                      <td>{item.emergencyAllowed}</td>
                      <td>{item.description}</td>
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
                                item.name,
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
                <div className="form-group col-md-4">
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
                <div className="form-group col-md-4">
                  <label>
                    Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    maxLength={MAX_LENGTH}
                    onChange={handleInputChange}
                    placeholder="cross match type"
                    required
                  />
                </div>
                <div className="form-group col-md-4">
                  <label>Turnaround</label>
                  <input
                    type="text"
                    name="turnaround"
                    className="form-control"
                    value={formData.turnaround}
                    onChange={handleInputChange}
                    placeholder="turnaround"
                  />
                </div>
                <div className="form-group col-md-4 mt-3">
                  <label>Cost</label>
                  <input
                    type="text"
                    name="cost"
                    className="form-control"
                    value={formData.cost}
                    onChange={handleInputChange}
                    placeholder="cost"
                  />
                </div>
                <div className="form-group col-md-4 mt-3">
                  <label>Emergency Allowed</label>
                  <select
                    name="emergencyAllowed"
                    className="form-select"
                    value={formData.emergencyAllowed}
                    onChange={handleInputChange}
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div className="form-group col-md-4 mt-3">
                  <label>Description</label>
                  <textarea
                    name="description"
                    className="form-control"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="description"
                  />
                </div>
              </div>
              <div className="mt-3 text-end">
                <button
                  className="btn btn-primary me-2"
                  disabled={!isFormValid}
                >
                  Save
                </button>
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={handleBack}
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
                  <div className="modal-header">
                    <h5>Confirm Status Change</h5>
                  </div>
                  <div className="modal-body">
                    Are you sure you want to{" "}
                    {confirmDialog.newStatus === "y"
                      ? "activate"
                      : "deactivate"}{" "}
                    <strong>{confirmDialog.name}</strong>?
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

export default CrossMatchType;
