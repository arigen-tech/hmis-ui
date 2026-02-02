import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_OPTH_LENSTYPE } from "../../../config/apiConfig";
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import {FETCH_LENSTYPE,DUPLICATE_LENSTYPE,UPDATE_LENSTYPE,ADD_LENSTYPE,FAIL_LENSTYPE,UPDATE_FAIL_LENSTYPE,} from "../../../config/constants";

const LensTypeMaster = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({ lensType: "" });
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  /* ---------- Pagination ---------- */
  const [currentPage, setCurrentPage] = useState(1);

    const MAX_LENGTH = 8; 

  const itemsPerPage = 5;


  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    record: null,
    newStatus: "",
  });


  //formdate
  const formatDate = (dateString) => {
    if (!dateString?.trim()) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Fetch data
  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const { response } = await getRequest(`${MAS_OPTH_LENSTYPE}/getAll/${flag}`);
      setData(response || []);
    } catch {
      showPopup(FETCH_LENSTYPE, "error");
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
    (rec?.lensType ?? "").toLowerCase().includes(searchQuery.toLowerCase())
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


  // ================= FORM =================
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const updated = { ...formData, [id]: value };
    setFormData(updated);
    setIsFormValid(value.trim() !== "");
  };

  const resetForm = () => {
    setFormData({ lensType: "" });
    setEditingRecord(null);
    setIsFormValid(false);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };


  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const newValue = formData.lensType.trim().toLowerCase();
    const duplicate = data.find(
      (rec) =>
        rec.lensType?.trim().toLowerCase() === newValue &&
        (!editingRecord || rec.id !== editingRecord.id)
    );

    if (duplicate) {
      showPopup(DUPLICATE_LENSTYPE, "error");
      return;
    }

    try {
      if (editingRecord) {
        await putRequest(`${MAS_OPTH_LENSTYPE}/update/${editingRecord.id}`, {
          ...editingRecord,
          lensType: formData.lensType.trim(),
        });
        showPopup(UPDATE_LENSTYPE, "success");
      } else {
        await postRequest(`${MAS_OPTH_LENSTYPE}/create`, {
          lensType: formData.lensType.trim(),
        });
        showPopup(ADD_LENSTYPE, "success");
      }
      fetchData();
      handleCancel();
    } catch {
      showPopup(FAIL_LENSTYPE, "error");
    }
  };


  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({ lensType: rec.lensType || "" });
    setIsFormValid(true);
    setShowForm(true);
  };

  /* ---------- Status Change ---------- */
  const handleSwitchChange = (rec) => {
    setConfirmDialog({
      isOpen: true,
      record: rec,
      newStatus: rec.status?.toLowerCase() === "y" ? "n" : "y",
    });
  };


  const handleConfirm = async (confirmed) => {
    if (!confirmed) {
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
      return;
    }
    if (!confirmDialog.record) return;

    try {
      setLoading(true);
      await putRequest(`${MAS_OPTH_LENSTYPE}/status/${confirmDialog.record.id}?status=${confirmDialog.newStatus}`);
      showPopup("Status updated successfully", "success");
      fetchData();
    } catch {
      showPopup(UPDATE_FAIL_LENSTYPE, "error");
    } finally {
      setLoading(false);
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
    }
  };



  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };


  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchData();
  };


  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Lens Type Master</h4>
          <div className="d-flex align-items-center">
            {!showForm && (
              <input
                type="text"
                style={{ width: "220px" }}
                className="form-control w-50 me-2"
                placeholder="Search"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            )}

            {!showForm ? (
              <>
                <button
                  className="btn btn-success me-2"
                  onClick={() => { resetForm(); setShowForm(true); }}
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
          {loading ? (
            <LoadingScreen />
          ) : !showForm ? (
            <>
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Lens Type</th>
                    <th>Last Update Date</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((rec) => (
                    <tr key={rec.id}>
                      <td>{rec.lensType}</td>
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
                            {rec.status?.toLowerCase() === "y" ? "Active" : "Inactive"}
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

              {filteredData.length > 0 && (
                <Pagination
                  totalItems={filteredData.length}
                  itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          ) : (
            <form onSubmit={handleSave} className="row g-3">
              <div className="col-md-5">
                <label>lensType<span className="text-danger">*</span></label>
                <input
                  id="lensType"
                  className="form-control"
                  value={formData.presentationValue}
                  onChange={handleInputChange}
                  maxLength={MAX_LENGTH}
                  autoFocus
                />
              </div>

              <div className="col-12 text-end">
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
            <div className="modal d-block">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-body">
                    Are you sure you want to{" "}
                    {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                    <strong>{confirmDialog.record?.lensType}</strong>?
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
export default LensTypeMaster;