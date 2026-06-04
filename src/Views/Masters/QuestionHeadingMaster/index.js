import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_QUESTION_HEADING } from "../../../config/apiConfig";
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { FETCH_QUESTION_HEADING, DUPLICATE_QUESTION_HEADING, INVALID_QUESTION_HEADING, UPDATE_QUESTION_HEADING, ADD_QUESTION_HEADING, FAIL_QUESTION_HEADING } from "../../../config/constants";

const QuestionHeadingMaster = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ questionHeadingCode: "", questionHeadingName: "" });
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);

  // ================= DROPDOWN SEARCH STATES =================
  const [tempSelectedCode, setTempSelectedCode] = useState('');
  const [tempSelectedName, setTempSelectedName] = useState('');
  const [selectedCode, setSelectedCode] = useState('');
  const [selectedName, setSelectedName] = useState('');

  // ================= PAGINATION =================
  const [currentPage, setCurrentPage] = useState(1);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    name: ""
  });

  const MAX_CODE_LENGTH = 50;

  // Date formatter
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
      const { response } = await getRequest(`${MAS_QUESTION_HEADING}/getAll/${flag}`);
      setData(response || []);
    } catch {
      showPopup(FETCH_QUESTION_HEADING, "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Get all unique codes and names for dropdowns
  const uniqueCodes = [...new Set(data.map(item => item.questionHeadingCode))];
  const uniqueNames = [...new Set(data.map(item => item.questionHeadingName))];

  // ================= FILTER LOGIC =================
  const filteredData = data.filter(rec => {
    if (selectedCode && rec.questionHeadingCode !== selectedCode) return false;
    if (selectedName && rec.questionHeadingName !== selectedName) return false;
    return true;
  });

  const handleSearch = () => {
    setSelectedCode(tempSelectedCode);
    setSelectedName(tempSelectedName);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setTempSelectedCode('');
    setTempSelectedName('');
    setSelectedCode('');
    setSelectedName('');
    setCurrentPage(1);
  };

  const handleShowAll = () => {
    handleReset();
  };

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

  // ================= FORM =================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    const codeValid = name === "questionHeadingCode"
      ? value.trim() !== ""
      : formData.questionHeadingCode.trim() !== "";

    const nameValid = name === "questionHeadingName"
      ? value.trim() !== ""
      : formData.questionHeadingName.trim() !== "";

    setIsFormValid(codeValid && nameValid);
  };

  const resetForm = () => {
    setFormData({ questionHeadingCode: "", questionHeadingName: "" });
    setIsFormValid(false);
    setEditingRecord(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  // ================= SAVE =================
  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!isFormValid || saving) return;

    const trimmedCode = formData.questionHeadingCode.trim();
    const trimmedName = formData.questionHeadingName.trim();

    const duplicate = data.find((rec) => {
      const existingCode = rec.questionHeadingCode?.trim().toLowerCase();
      const newCode = trimmedCode.toLowerCase();

      if (editingRecord && rec.id === editingRecord.id) {
        return false;
      }

      return existingCode === newCode;
    });

    if (duplicate) {
      showPopup(DUPLICATE_QUESTION_HEADING, "error");
      return;
    }

    setSaving(true);

    try {
      if (editingRecord) {
        const recordId = editingRecord.id || editingRecord.questionHeadingId || editingRecord._id;

        if (!recordId) {
          showPopup(INVALID_QUESTION_HEADING, "error");
          return;
        }

        const updateData = {
          questionHeadingCode: trimmedCode,
          questionHeadingName: trimmedName,
        };

        const response = await putRequest(`${MAS_QUESTION_HEADING}/update/${recordId}`, updateData);
        
        if (response.status === 200) {
          setPopupMessage({
            message: UPDATE_QUESTION_HEADING,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              fetchData();
              setShowForm(false);
            }
          });
        } else {
          throw new Error(response.message || "Update failed");
        }
      } else {
        const response = await postRequest(`${MAS_QUESTION_HEADING}/create`, {
          questionHeadingCode: trimmedCode,
          questionHeadingName: trimmedName,
          status: "y",
        });
        
        if (response.status === 201 || response.status === 200) {
          setPopupMessage({
            message: ADD_QUESTION_HEADING,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              fetchData();
              setShowForm(false);
            }
          });
        } else {
          throw new Error(response.message || "Save failed");
        }
      }
    } catch (err) {
      console.error("Save error:", err);
      showPopup(FAIL_QUESTION_HEADING, "error");
    } finally {
      setSaving(false);
    }
  };

  // ================= EDIT =================
  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({
      questionHeadingCode: rec.questionHeadingCode,
      questionHeadingName: rec.questionHeadingName
    });
    setShowForm(true);
    setIsFormValid(true);
  };

  const handleSwitchChange = (id, currentStatus, name) => {
    const newStatus = currentStatus === "y" ? "n" : "y";
    setConfirmDialog({
      isOpen: true,
      id: id || '',
      newStatus,
      name: name,
    });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.id) {
      setSaving(true);

      try {
        const response = await putRequest(
          `${MAS_QUESTION_HEADING}/status/${confirmDialog.id}?status=${confirmDialog.newStatus}`
        );

        if (response.status === 200) {
          setPopupMessage({
            message: `Question heading "${confirmDialog.name}" ${
              confirmDialog.newStatus === "y" ? "activated" : "deactivated"
            } successfully!`,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              fetchData();
              setCurrentPage(1);
            },
          });
        } else {
          throw new Error(response.message || "Failed to update status");
        }
      } catch (error) {
        console.error("Status update error:", error);
        showPopup(UPDATE_QUESTION_HEADING, "error");
      } finally {
        setSaving(false);
      }
    }

    setConfirmDialog({ isOpen: false, id: null, newStatus: "", name: "" });
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  // ================= UI =================
  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Questionnaire Topic Master</h4>
              <div className="d-flex align-items-center">
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
                      className="btn btn-success flex-shrink-0" 
                      onClick={handleShowAll}
                    >
                      Show All
                    </button>
                  </>
                ) : (
                  <button 
                    className="btn btn-secondary" 
                    onClick={handleCancel}
                  >
                    Back
                  </button>
                )}
              </div>
            </div>

            <div className="card-body">
              {loading && !showForm && <LoadingScreen />}

              {!showForm && !loading && (
                <>
                  {/* SEARCH UI */}
                  <div className="row mb-3 p-2 bg-light border rounded align-items-end g-2">
                    <div className="col-md-3">
                      <label className="fw-bold mb-1">Question Topic Code</label>
                      <select
                        className="form-select"
                        value={tempSelectedCode}
                        onChange={(e) => setTempSelectedCode(e.target.value)}
                      >
                        <option value="">Select Code</option>
                        {uniqueCodes.map(code => (
                          <option key={code} value={code}>{code}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-md-3">
                      <label className="fw-bold mb-1">Question Topic Name</label>
                      <select
                        className="form-select"
                        value={tempSelectedName}
                        onChange={(e) => setTempSelectedName(e.target.value)}
                      >
                        <option value="">Select Name</option>
                        {uniqueNames.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-auto">
                      <button
                        className="btn btn-primary"
                        onClick={handleSearch}
                      >
                        SEARCH
                      </button>
                    </div>
                    <div className="col-auto">
                      <button
                        className="btn btn-secondary"
                        onClick={handleReset}
                      >
                        RESET
                      </button>
                    </div>
                  </div>

                  <table className="table table-bordered table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Last Update Date</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.length > 0 ? (
                        currentItems.map((rec) => (
                          <tr key={rec.id || rec.questionHeadingId || rec._id}>
                            <td>{rec.questionHeadingCode}</td>
                            <td>{rec.questionHeadingName}</td>
                            <td>{formatDate(rec.lastUpdateDate)}</td>
                            <td>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={rec.status === "y"}
                                  onChange={() => handleSwitchChange(
                                    rec.id || rec.questionHeadingId || rec._id,
                                    rec.status,
                                    rec.questionHeadingCode
                                  )}
                                  id={`switch-${rec.id || rec.questionHeadingId}`}
                                />
                                <label
                                  className="form-check-label ms-2"
                                  htmlFor={`switch-${rec.id || rec.questionHeadingId}`}
                                >
                                  {rec.status === "y" ? "Active" : "Inactive"}
                                </label>
                              </div>
                            </td>
                            <td>
                              <button
                                className="btn btn-success btn-sm"
                                disabled={rec.status !== "y"}
                                onClick={() => handleEdit(rec)}
                              >
                                <i className="fa fa-pencil"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center">No Records Found</td>
                        </tr>
                      )}
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

              {showForm && (
                <form onSubmit={handleSave} className="row g-3">
                  <div className="col-md-4">
                    <label>Code <span className="text-danger">*</span></label>
                    <input
                      name="questionHeadingCode"
                      className="form-control mt-1"
                      value={formData.questionHeadingCode}
                      onChange={handleInputChange}
                      maxLength={MAX_CODE_LENGTH}
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="col-md-4">
                    <label>Name <span className="text-danger">*</span></label>
                    <input
                      name="questionHeadingName"
                      className="form-control mt-1"
                      value={formData.questionHeadingName}
                      onChange={handleInputChange}
                      maxLength={MAX_CODE_LENGTH}
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="col-12 text-end">
                    <button 
                      type="submit"
                      className="btn btn-primary me-2" 
                      disabled={!isFormValid || saving}
                    >
                      {saving ? "Saving..." : editingRecord ? "Update" : "Save"}
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

              {/* Popup for messages */}
              {popupMessage && <Popup {...popupMessage} />}

              {/* Confirmation Modal for Status Change */}
              {confirmDialog.isOpen && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-body">
                        Are you sure you want to{" "}
                        {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
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
      </div>
    </div>
  );
};

export default QuestionHeadingMaster;