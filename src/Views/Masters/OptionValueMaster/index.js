import { useState, useEffect, useMemo } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, {
  DEFAULT_ITEMS_PER_PAGE,
} from "../../../Components/Pagination";
import { MAS_QUESTION_OPTION_VALUE, MAS_OPD_QUESTION } from "../../../config/apiConfig";
import {
  getRequest,
  postRequest,
  putRequest,
} from "../../../service/apiService";

import {
  FETCH_OPTION_VALUE,
  CREATE_OPTION_VALUE,
  UPDATE_OPTION_VALUE,
  SAVE_OPTION_VALUE,
  DUPLICATE_OPTION_VALUE,
  STATUS_UPDATED,
  UPDATE_STATUS,
  STATUS,
} from "../../../config/constants";

const OptionValueMaster = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);          
  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({
    optionCode: "",
    optionValue: "",
    optionScore: "",
    questionId: ""
  });
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    record: null,
    newStatus: "",
  });
  const [questions, setQuestions] = useState([]);

  // Search dropdown states
  const [tempSelectedCode, setTempSelectedCode] = useState('');
  const [tempSelectedValue, setTempSelectedValue] = useState('');
  const [selectedCode, setSelectedCode] = useState('');
  const [selectedValue, setSelectedValue] = useState('');

  const MAX_LENGTH = 50;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return "N/A";
    }
  };

  // Show popup
  const showPopup = (message, type = "success") => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  // ========== Fetch all option values ==========
  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const { response } = await getRequest(
        `${MAS_QUESTION_OPTION_VALUE}/getAll/${flag}`
      );
      setData(response || []);
    } catch {
      showPopup(FETCH_OPTION_VALUE, "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // ========== Fetch questions for dropdown ==========
  const fetchQuestions = async (flag = 0) => {
    try {
      const res = await getRequest(`${MAS_OPD_QUESTION}/getAll/${flag}`);
      setQuestions(res?.response || res?.data?.response || []);
    } catch {
      setQuestions([]);
    }
  };

  useEffect(() => {
    fetchData();
    fetchQuestions();
  }, []);

  // ========== Unique options for search dropdowns (memoized) ==========
  const uniqueOptionCodes = useMemo(
    () => [...new Set(data.map(item => item.optionCode).filter(Boolean))],
    [data]
  );
  const uniqueOptionValues = useMemo(
    () => [...new Set(data.map(item => item.optionValue).filter(Boolean))],
    [data]
  );

  // ========== Filter data based on selected criteria ==========
  const filteredData = data.filter(rec => {
    if (selectedCode && rec.optionCode !== selectedCode) return false;
    if (selectedValue && rec.optionValue !== selectedValue) return false;
    return true;
  });

  // ========== Search / Reset handlers ==========
  const handleSearch = () => {
    setSelectedCode(tempSelectedCode);
    setSelectedValue(tempSelectedValue);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setTempSelectedCode('');
    setTempSelectedValue('');
    setSelectedCode('');
    setSelectedValue('');
    setCurrentPage(1);
  };

  const handleShowAll = () => {
    handleReset(); // reuse same logic
  };

  // ========== Pagination ==========
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

  // ========== Form input handling with validation ==========
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };

    // Stricter validation: optionCode, optionValue, questionId non‑empty,
    // and optionScore must be a non‑negative number.
    const scoreValid = value => {
      if (value === "") return false;
      const num = Number(value);
      return !isNaN(num) && num >= 0;
    };

    const isValid =
      updated.optionCode?.trim() !== "" &&
      updated.optionValue?.trim() !== "" &&
      updated.questionId !== "" &&
      scoreValid(updated.optionScore);

    setFormData(updated);
    setIsFormValid(isValid);
  };

  const resetForm = () => {
    setFormData({
      optionCode: "",
      optionValue: "",
      optionScore: "",
      questionId: "",
    });
    setIsFormValid(false);
    setEditingRecord(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  // ========== Save (Create or Update) ==========
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid || saving) return;

    setSaving(true);
    const newCode = formData.optionCode.trim().toLowerCase();

    // Check duplicate optionCode (case‑insensitive)
    const duplicate = data.find(
      (rec) =>
        rec.optionCode?.toLowerCase() === newCode &&
        (!editingRecord || rec.id !== editingRecord.id)
    );

    if (duplicate) {
      showPopup(DUPLICATE_OPTION_VALUE, "error");
      setSaving(false);
      return;
    }

    try {
      if (editingRecord) {
        await putRequest(
          `${MAS_QUESTION_OPTION_VALUE}/update/${editingRecord.id}`,
          formData
        );
        showPopup(UPDATE_OPTION_VALUE, "success");
      } else {
        await postRequest(`${MAS_QUESTION_OPTION_VALUE}/create`, {
          ...formData,
          status: "y",
        });
        showPopup(CREATE_OPTION_VALUE, "success");
      }
      fetchData();
      handleCancel();
    } catch {
      showPopup(SAVE_OPTION_VALUE, "error");
    } finally {
      setSaving(false);
    }
  };

  // ========== Edit ==========
  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({
      optionCode: rec.optionCode,
      optionValue: rec.optionValue,
      optionScore: rec.optionScore,
      questionId: rec.questionId,
    });
    setShowForm(true);
    setIsFormValid(true);
  };

  // ========== Status toggle with confirmation ==========
  const handleSwitchChange = (rec) => {
    setConfirmDialog({
      isOpen: true,
      record: rec,
      newStatus:
        rec.status === STATUS.ACTIVE ? STATUS.INACTIVE : STATUS.ACTIVE,
    });
  };

  const handleConfirm = async (confirmed) => {
    if (!confirmed) {
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
      return;
    }

    try {
      await putRequest(
        `${MAS_QUESTION_OPTION_VALUE}/status/${confirmDialog.record.id}?status=${confirmDialog.newStatus}`
      );
      showPopup(STATUS_UPDATED, "success");
      fetchData();
    } catch {
      showPopup(UPDATE_STATUS, "error");
    } finally {
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
    }
  };

  // ========== Render ==========
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        {/* HEADER */}
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Option Value Master</h4>
          <div className="d-flex">
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
                  type="button"
                  className="btn btn-success"
                  onClick={handleShowAll}
                >
                  <i className="mdi mdi-view-list"></i> Show All
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
          {loading && <LoadingScreen />}

          {/* ================= LIST VIEW ================= */}
          {!showForm && !loading && (
            <>
              {/* SEARCH UI */}
              <div className="row mb-3 p-2 bg-light border rounded align-items-end g-2">
                <div className="col-md-3">
                  <label className="fw-bold mb-1">Option Code</label>
                  <select
                    className="form-select"
                    value={tempSelectedCode}
                    onChange={(e) => setTempSelectedCode(e.target.value)}
                  >
                    <option value="">Select Code</option>
                    {uniqueOptionCodes.map(code => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="fw-bold mb-1">Option Value</label>
                  <select
                    className="form-select"
                    value={tempSelectedValue}
                    onChange={(e) => setTempSelectedValue(e.target.value)}
                  >
                    <option value="">Select Value</option>
                    {uniqueOptionValues.map(value => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </div>

                <div className="col-auto">
                  <button className="btn btn-primary" onClick={handleSearch}>
                    SEARCH
                  </button>
                </div>

                <div className="col-auto">
                  <button className="btn btn-secondary" onClick={handleReset}>
                    RESET
                  </button>
                </div>
              </div>

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
                      <td>{rec.optionCode}</td>
                      <td>{rec.optionValue}</td>
                      <td>{rec.optionScore}</td>
                      <td>{rec.questionName}</td>
                      <td>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={rec.status === STATUS.ACTIVE}
                            onChange={() => handleSwitchChange(rec)}
                          />
                          <label className="form-check-label ms-2">
                            {rec.status === STATUS.ACTIVE ? "Active" : "Inactive"}
                          </label>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-success btn-sm"
                          disabled={rec.status !== STATUS.ACTIVE}
                          onClick={() => handleEdit(rec)}
                        >
                          <i className="fa fa-pencil"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {currentItems.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center">No records found</td>
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
          )}

          {/* ================= FORM VIEW ================= */}
          {showForm && (
            <form onSubmit={handleSave} className="row g-3">
              <div className="col-md-4">
                <label>
                  Option Code <span className="text-danger">*</span>
                </label>
                <input
                  name="optionCode"
                  className="form-control"
                  value={formData.optionCode}
                  onChange={handleInputChange}
                  disabled={saving}
                />
              </div>

              <div className="col-md-4">
                <label>
                  Option Value <span className="text-danger">*</span>
                </label>
                <input
                  name="optionValue"
                  className="form-control"
                  value={formData.optionValue}
                  onChange={handleInputChange}
                  disabled={saving}
                />
              </div>

              <div className="col-md-4">
                <label>
                  Option Score <span className="text-danger">*</span>
                </label>
                <input
                  name="optionScore"
                  type="number"
                  step="any"
                  className="form-control"
                  value={formData.optionScore}
                  onChange={handleInputChange}
                  disabled={saving}
                />
              </div>

              <div className="col-md-4">
                <label>
                  Question Name <span className="text-danger">*</span>
                </label>
                <select
                  name="questionId"
                  className="form-select"
                  value={formData.questionId}
                  onChange={handleInputChange}
                  disabled={saving}
                >
                  <option value="">Select Question</option>
                  {questions.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.question}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 text-end">
                <button
                  type="submit"
                  className="btn btn-primary me-2"
                  disabled={!isFormValid || saving}
                >
                  {saving ? "Saving..." : (editingRecord ? "Update" : "Save")}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {popupMessage && <Popup {...popupMessage} />}

          {/* Custom confirmation dialog */}
          {confirmDialog.isOpen && (
            <div className="modal d-block">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-body">
                    Are you sure you want to{" "}
                    {confirmDialog.newStatus === STATUS.ACTIVE
                      ? "activate"
                      : "deactivate"}{" "}
                    <strong>{confirmDialog.record?.optionCode}</strong>?
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