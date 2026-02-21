
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_OB_PVMEMBRANE } from "../../../config/apiConfig";
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import {
  FETCH_MEMBRANE,
  DUPLICATE_MEMBRANE,
  UPDATE_MEMBRANE,
  ADD_MEMBRANE,
  FAIL_MEMBRANE,
  UPDATE_FAIL_MEMBRANE,
} from "../../../config/constants";


const MembraneStatusMaster = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ membraneStatus: "" });
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    record: null,
    newStatus: "",
  });

  const MAX_LENGTH = 8;


  /* ---------- Format Date ---------- */
  const formatDate = (dateString) => {
    if (!dateString?.trim()) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()}`;
  };


  
  /* ---------- Fetch Data ---------- */
  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const { response } = await getRequest(
        `${MAS_OB_PVMEMBRANE}/getAll/${flag}`
      );
      setData(response || []);
    } catch {
      showPopup(FETCH_MEMBRANE, "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ---------- Filter + Pagination ---------- */
  const filteredData = data.filter((rec) =>
    (rec?.membraneStatus ?? "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const currentItems = filteredData.slice(
    (currentPage - 1) * DEFAULT_ITEMS_PER_PAGE,
    currentPage * DEFAULT_ITEMS_PER_PAGE
  );

  /* ---------- Handlers ---------- */
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const updated = { ...formData, [id]: value };
    setFormData(updated);
    setIsFormValid(updated.membraneStatus.trim() !== "");
  };

  const resetForm = () => {
    setFormData({ membraneStatus: "" });
    setIsFormValid(false);
    setEditingRecord(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const newValue = formData.membraneStatus.trim().toLowerCase();
    const duplicate = data.find(
      (rec) =>
        rec.membraneStatus?.trim().toLowerCase() === newValue &&
        (!editingRecord || rec.id !== editingRecord.id)
    );

    if (duplicate) {
      showPopup(DUPLICATE_MEMBRANE, "error");
      return;
    }

    try {
      if (editingRecord) {
        await putRequest(
          `${MAS_OB_PVMEMBRANE}/update/${editingRecord.id}`,
          { membraneStatus: formData.membraneStatus.trim() }
        );
        showPopup(UPDATE_MEMBRANE, "success");
      } else {
        await postRequest(`${MAS_OB_PVMEMBRANE}/create`, {
          membraneStatus: formData.membraneStatus.trim(),
        });
        showPopup(ADD_MEMBRANE, "success");
      }
      fetchData();
      handleCancel();
    } catch {
      showPopup(FAIL_MEMBRANE, "error");
    }
  };

  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({ membraneStatus: rec.membraneStatus || "" });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSwitchChange = (rec) => {
    setConfirmDialog({
      isOpen: true,
      record: rec,
      newStatus: rec.status?.toLowerCase() === "y" ? "n" : "y",
    });
  };

  const handleConfirm = async (confirmed) => {
    if (!confirmed || !confirmDialog.record) {
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
      return;
    }

    try {
      setLoading(true);
      await putRequest(
        `${MAS_OB_PVMEMBRANE}/status/${confirmDialog.record.id}?status=${confirmDialog.newStatus}`
      );
      showPopup(UPDATE_MEMBRANE, "success");
      fetchData();
    } catch {
      showPopup(UPDATE_FAIL_MEMBRANE, "error");
    } finally {
      setLoading(false);
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
    }
  };

  /* ---------- Popup ---------- */
  const showPopup = (message, type) =>
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchData();
  };

  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title">Membrane Status Master</h4>

          <div className="d-flex align-items-center">
            {!showForm && (
              <input
                type="text"
                style={{ width: "220px" }}
                className="form-control me-1"
                placeholder="Search"
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
              <button className="btn btn-secondary" onClick={handleCancel}>
                Back
              </button>
            )}
          </div>
        </div>

        <div className="card-body">
          {loading && <LoadingScreen />}

          {!showForm ? (
            <>
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Membrane Status</th>
                      <th>Last Update Date</th>
                      <th>Status</th>
                      <th>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((rec) => (
                      <tr key={rec.id}>
                        <td>{rec.membraneStatus}</td>
                        <td>{formatDate(rec.lastUpdateDate)}</td>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={rec.status?.toLowerCase() === "y"}
                              onChange={() => handleSwitchChange(rec)}
                            />
                            <label className="form-check-label ms-2">
                              {rec.status?.toLowerCase() === "y"
                                ? "Active"
                                : "Inactive"}
                            </label>
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleEdit(rec)}
                            disabled={rec.status?.toLowerCase() !== "y"}
                          >
                            <i className="fa fa-pencil"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                totalItems={filteredData.length}
                itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </>
          ) : (
            <form className="row" onSubmit={handleSave}>
              <div className="form-group col-md-5">
                <label>Membrane Status <span className="text-danger">*</span></label>
                <input
                  type="text"
                  id="membraneStatus"
                  className="form-control mt-1"
                  value={formData.membraneStatus}
                  onChange={handleInputChange}
                  maxLength={MAX_LENGTH}
                />
              </div>

              <div className="form-group col-md-12 mt-3 d-flex justify-content-end">
                <button
                  type="submit"
                  className="btn btn-primary me-2"
                  disabled={!isFormValid}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleCancel}
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
                    <h5 className="modal-title">Confirm Status Change</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => handleConfirm(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    Are you sure you want to{" "}
                    {confirmDialog.newStatus === "y"
                      ? "activate"
                      : "deactivate"}{" "}
                    <strong>
                      {confirmDialog.record?.membraneStatus}
                    </strong>
                    ?
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

export default MembraneStatusMaster;
