
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_MENSTRUal_PATTERN } from "../../../config/apiConfig";
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
    menstrualPatternCode: "",
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

  const formatDate = (dateString) => {
    if (!dateString?.trim()) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { response } = await getRequest(`${MAS_MENSTRUal_PATTERN}/getAll/0`);
      setData(response || []);
    } catch {
      showPopup(FETCH_MENSTRUAL_PATTERN, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = data.filter(
    (rec) =>
      rec.patternValue?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.menstrualPatternName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentItems = filteredData.slice(
    (currentPage - 1) * DEFAULT_ITEMS_PER_PAGE,
    currentPage * DEFAULT_ITEMS_PER_PAGE
  );

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);

    setIsFormValid(
      updated.menstrualPatternCode.trim() !== "" &&
      updated.menstrualPatternName.trim() !== ""
    );
  };

  const resetForm = () => {
    setFormData({ menstrualPatternCode: "" });
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

    const newCode = formData.menstrualPatternCode.trim().toLowerCase();
    const newName = formData.menstrualPatternName.trim().toLowerCase();

    const duplicate = data.find(
      (rec) =>
        (rec.patternValue?.trim().toLowerCase() === newCode ||
          rec.menstrualPatternName?.trim().toLowerCase() === newName) &&
        (!editingRecord || rec.id !== editingRecord.id)
    );

    if (duplicate) {
      showPopup(DUPLICATE_MENSTRUAL_PATTERN, "error");
      return;
    }

    try {
      const payload = {
        patternValue: formData.menstrualPatternCode,
      };

      if (editingRecord) {
        await putRequest(
          `${MAS_MENSTRUal_PATTERN}/update/${editingRecord.id}`,
          payload
        );
        showPopup(UPDATE_MENSTRUAL_PATTERN, "success");
      } else {
        await postRequest(`${MAS_MENSTRUal_PATTERN}/create`, {
          ...payload,
          status: "Y",
        });
        showPopup(ADD_MENSTRUAL_PATTERN, "success");
      }
      fetchData();
      handleCancel();
    } catch {
      showPopup(FAIL_MENSTRUAL_PATTERN, "error");
    }
  };

  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({
      menstrualPatternCode: rec.menstrualPatternName || "",
    });
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
    if (!confirmed) {
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
      return;
    }

    try {
      setLoading(true);
      await putRequest(
        `${MAS_MENSTRUal_PATTERN}/status/${confirmDialog.record.id}?status=${confirmDialog.newStatus}`
      );
      showPopup(UPDATE_MENSTRUAL_PATTERN, "success");
      fetchData();
    } catch {
      showPopup(UPDATE_FAIL_MENSTRUAL_PATTERN, "error");
    } finally {
      setLoading(false);
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
    }
  };


  const showPopup = (message, type) => {
    setPopupMessage({
      message,
      type,
      onClose: () => setPopupMessage(null),
    });
  };

  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Menstrual Pattern Master</h4>
          <div className="d-flex">
            {!showForm && (
              <input
                style={{ width: "220px" }}
                className="form-control me-2"
                placeholder="Search Patterns"
                value={searchQuery}
                onChange={handleSearchChange}

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
                <button className="btn btn-success" onClick={fetchData}>
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
                    <th>Pattern Code</th>
                    <th>Last Update Date</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((rec) => (
                    <tr key={rec.id}>
                      <td>{rec.patternValue}</td>
                      <td>{formatDate(rec.lastUpdateDate)}</td>
                      <td>
                        <div className="form-check form-switch">
                          <input
                            type="checkbox"
                            className="form-check-input"
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
                          disabled={rec.status?.toLowerCase() !== "y"}
                          onClick={() => handleEdit(rec)}
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
            <form onSubmit={handleSave} className="row g-3">
              <div className="col-md-5">
                <label>Pattern Code *</label>
                <input
                  className="form-control"
                  name="menstrualPatternCode"
                  value={formData.menstrualPatternCode}
                  onChange={handleInputChange}
                />
              </div>


              <div className="col-12 text-end">
                <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                  Save
                </button>
                <button type="button" className="btn btn-danger" onClick={handleCancel}>
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
                    <strong>{confirmDialog.record?.menstrualPatternName}</strong>?
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

export default MenstrualPatternMaster;