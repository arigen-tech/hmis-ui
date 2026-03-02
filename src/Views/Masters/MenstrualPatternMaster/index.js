
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_MENSTRUAl_PATTERN } from "../../../config/apiConfig";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, postRequest, putRequest } from "../../../service/apiService";
import {
  FETCH_MENSTRUAL_PATTERN,
  ADD_MENSTRUAL_PATTERN,
  UPDATE_MENSTRUAL_PATTERN,
  DUPLICATE_MENSTRUAL_PATTERN,
  FAIL_MENSTRUAL_PATTERN,
  UPDATE_FAIL_MENSTRUAL_PATTERN,
} from "../../../config/constants";

const MenstrualPatternMaster = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    patternValue: "",
  });

  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [popupMessage, setPopupMessage] = useState(null);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    record: null,
    newStatus: "",
  });

  const MAX_LENGTH = 10;

  // ---------- Utils ----------
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()}`;
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  // ---------- Fetch ----------
  const fetchData = async (flag = 0) => {
    try {
      setLoading(true);
      const { response } = await getRequest(
        `${MAS_MENSTRUAl_PATTERN}/getAll/${flag}`
      );
      setData(response || []);
    } catch (error) {
      console.error(error);
      showPopup(FETCH_MENSTRUAL_PATTERN, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ---------- Search & Pagination ----------
  const filteredData = data.filter((rec) =>
    String(rec.patternValue ?? "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const currentItems = filteredData.slice(
    (currentPage - 1) * DEFAULT_ITEMS_PER_PAGE,
    currentPage * DEFAULT_ITEMS_PER_PAGE
  );

  // ---------- Form ----------
  const handleInputChange = (e) => {
    const { value } = e.target;
    setFormData({ patternValue: value });
    setIsFormValid(value.trim() !== "");
  };

  const resetForm = () => {
    setFormData({ patternValue: "" });
    setIsFormValid(false);
    setEditingRecord(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({ patternValue: rec.patternValue || "" });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const duplicate = data.some(
      (rec) =>
        rec.patternValue?.toLowerCase() ===
          formData.patternValue.trim().toLowerCase() &&
        (!editingRecord || rec.id !== editingRecord.id)
    );

    if (duplicate) {
      showPopup(DUPLICATE_MENSTRUAL_PATTERN, "error");
      return;
    }

    try {
      setLoading(true);
      const payload = { patternValue: formData.patternValue.trim() };

      if (editingRecord) {
        await putRequest(
          `${MAS_MENSTRUAl_PATTERN}/update/${editingRecord.id}`,
          payload
        );
        showPopup(UPDATE_MENSTRUAL_PATTERN, "success");
      } else {
        await postRequest(`${MAS_MENSTRUAl_PATTERN}/create`, {
          ...payload,
          status: "Y",
        });
        showPopup(ADD_MENSTRUAL_PATTERN, "success");
      }

      fetchData();
      handleCancel();
    } catch (error) {
      console.error(error);
      showPopup(FAIL_MENSTRUAL_PATTERN, "error");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Status ----------
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

    try {
      setLoading(true);
      await putRequest(
        `${MAS_MENSTRUAl_PATTERN}/status/${confirmDialog.record.id}?status=${confirmDialog.newStatus}`
      );
      showPopup(UPDATE_MENSTRUAL_PATTERN, "success");
      fetchData();
    } catch (error) {
      console.error(error);
      showPopup(UPDATE_FAIL_MENSTRUAL_PATTERN, "error");
    } finally {
      setLoading(false);
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
    }
  };

  // ---------- UI ----------
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        {/* HEADER */}
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Menstrual Pattern Master</h4>

          <div className="d-flex">
            {!showForm && (
              <input
                className="form-control me-2"
                style={{ width: 220 }}
                placeholder="Search Pattern"
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
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                >
                  Add
                </button>
                <button
                  className="btn btn-success"
                  onClick={() => fetchData(0)}
                >
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

        {/* BODY */}
        <div className="card-body">
          {loading ? (
            <LoadingScreen />
          ) : !showForm ? (
            <>
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Pattern Code</th>
                    <th>Last Updated</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length ? (
                    currentItems.map((rec) => (
                      <tr key={rec.id}>
                        <td>{rec.patternValue}</td>
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
                            disabled={rec.status?.toLowerCase() !== "y"}
                            onClick={() => handleEdit(rec)}
                          >
                            <i className="fa fa-pencil"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center">
                        No record found
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
            <form className="row g-3" onSubmit={handleSave}>
              <h5>
                {editingRecord
                  ? "Update Menstrual Pattern"
                  : "Add Menstrual Pattern"}
              </h5>

              <div className="col-md-5">
                <label>Pattern Code *</label>
                <input
                  className="form-control"
                  value={formData.patternValue}
                  onChange={handleInputChange}
                  maxLength={MAX_LENGTH}
                />
              </div>

              <div className="col-12 text-end">
                <button
                  type="submit"
                  className="btn btn-primary me-2"
                  disabled={!isFormValid || loading}
                >
                  {loading
                    ? "Saving..."
                    : editingRecord
                    ? "Update"
                    : "Save"}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {popupMessage && <Popup {...popupMessage} />}

          {confirmDialog.isOpen && (
            <div className="modal d-block">
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-body">
                    Are you sure you want to{" "}
                    {confirmDialog.newStatus === "y"
                      ? "activate"
                      : "deactivate"}{" "}
                    <strong>
                      {confirmDialog.record?.patternValue}
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

export default MenstrualPatternMaster;