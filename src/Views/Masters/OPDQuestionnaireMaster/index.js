import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_OPD_QUESTION, MAS_QUESTION_HEADING } from "../../../config/apiConfig";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, postRequest, putRequest } from "../../../service/apiService";
import { FETCH_OPD_QUESTION, DUPLICATE_OPD_QUESTION, FETCH_QUESTION_HEADING, UPDATE_OPD_QUESTION, ADD_OPD_QUESTION, STATUS_UPDATE_OPD_QUESTION } from "../../../config/constants";

const OPDQuestionnaireMaster = () => {
  const [data, setData] = useState([]);
  const [headings, setHeadings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    name: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHeadingId, setSelectedHeadingId] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    headingId: "",
    question: "",
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

  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const { response } = await getRequest(`${MAS_OPD_QUESTION}/getAll/${flag}`);
      setData(response || []);
    } catch (error) {
      showPopup(FETCH_OPD_QUESTION, "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHeadings = async (flag = 1) => {
    try {
      const { response } = await getRequest(`${MAS_QUESTION_HEADING}/getAll/${flag}`);
      setHeadings(response || []);
    } catch (error) {
      showPopup(FETCH_QUESTION_HEADING, "error");
      setHeadings([]);
    }
  };

  useEffect(() => {
    fetchData();
    fetchHeadings();
  }, []);

  // Filter data by heading and question text
  const filteredData = data.filter((rec) => {
    const matchesText = rec.question?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesHeading = selectedHeadingId ? rec.questionHeadingId?.toString() === selectedHeadingId : true;
    return matchesText && matchesHeading;
  });

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const updated = { ...formData, [id]: value };
    setFormData(updated);
    setIsFormValid(updated.headingId && updated.question);
  };

  const resetForm = () => {
    setFormData({ headingId: "", question: "" });
    setIsFormValid(false);
    setEditingRecord(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!isFormValid || saving) return;

    const newQuestion = formData.question.trim().toLowerCase();
    const newHeadingId = formData.headingId;

    const isDuplicate = data.some((item) => {
      const match =
        item.question?.trim().toLowerCase() === newQuestion &&
        item.questionHeadingId?.toString() === newHeadingId;
      if (editingRecord) {
        return match && item.id !== editingRecord.id;
      }
      return match;
    });

    if (isDuplicate) {
      showPopup(DUPLICATE_OPD_QUESTION, "error");
      return;
    }

    setSaving(true);
    
    try {
      if (editingRecord) {
        const payload = {
          questionHeadingId: formData.headingId,
          question: formData.question,
        };
        const response = await putRequest(`${MAS_OPD_QUESTION}/update/${editingRecord.id}`, payload);
        
        if (response.status === 200) {
          setPopupMessage({
            message: UPDATE_OPD_QUESTION,
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
        const payload = {
          questionHeadingId: formData.headingId,
          question: formData.question,
          status: "n",
        };
        const response = await postRequest(`${MAS_OPD_QUESTION}/create`, payload);
        
        if (response.status === 201 || response.status === 200) {
          setPopupMessage({
            message: ADD_OPD_QUESTION,
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
    } catch (error) {
      console.error("Save error:", error);
      showPopup(
        editingRecord ? "Update failed" : "Add failed",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({
      headingId: rec.questionHeadingId || "",
      question: rec.question || "",
    });
    setShowForm(true);
    setIsFormValid(true);
  };

  const handleSwitchChange = (id, currentStatus, name) => {
    const newStatus = currentStatus === "y" ? "n" : "y";
    setConfirmDialog({ isOpen: true, id, newStatus, name });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.id !== null) {
      setSaving(true);

      try {
        const response = await putRequest(
          `${MAS_OPD_QUESTION}/status/${confirmDialog.id}?status=${confirmDialog.newStatus}`
        );

        if (response.status === 200) {
          setPopupMessage({
            message: `Question "${confirmDialog.name}" ${
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
        showPopup(STATUS_UPDATE_OPD_QUESTION, "error");
      } finally {
        setSaving(false);
      }
    }

    setConfirmDialog({ isOpen: false, id: null, newStatus: "", name: "" });
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setSelectedHeadingId("");
    setCurrentPage(1);
    fetchData();
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchQuery("");
    setSelectedHeadingId("");
    setCurrentPage(1);
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Questionnaire Question Master</h4>
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
                      type="button"
                      className="btn btn-success flex-shrink-0"
                      onClick={handleRefresh}
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
                  {/* Filter row */}
                  <div className="row mb-3 p-2 bg-light border rounded align-items-end g-2">
                    <div className="col-md-3">
                      <label className="fw-bold mb-1">Topic</label>
                      <select
                        className="form-select"
                        value={selectedHeadingId}
                        onChange={(e) => setSelectedHeadingId(e.target.value)}
                      >
                        <option value="">Select Name</option>
                        {headings.map((item) => (
                          <option key={item.questionHeadingId} value={item.questionHeadingId}>
                            {item.questionHeadingName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="fw-bold mb-1">Question</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search Question text..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
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

                  {/* Table */}
                  <table className="table table-bordered table-hover">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "20%" }}>TOPIC</th>
                        <th style={{ width: "50%" }}>QUESTION</th>
                        <th style={{ width: "15%" }}>STATUS</th>
                        <th style={{ width: "15%" }}>EDIT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.length > 0 ? (
                        currentItems.map((rec) => (
                          <tr key={rec.id}>
                            <td>{rec.questionHeadingName}</td>
                            <td>{rec.question}</td>
                            <td>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={rec.status === "y"}
                                  onChange={() =>
                                    handleSwitchChange(rec.id, rec.status, rec.question)
                                  }
                                />
                                <label className="form-check-label ms-2">
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
                          <td colSpan="4" className="text-center">No Records Found</td>
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

              {showForm && (
                <form onSubmit={handleSave} className="row g-3">
                  <div className="col-md-6">
                    <label>
                      Topic <span className="text-danger">*</span>
                    </label>
                    <select
                      id="headingId"
                      className="form-select mt-1"
                      value={formData.headingId}
                      onChange={handleInputChange}
                      required
                      disabled={saving}
                    >
                      <option value="">Select Heading</option>
                      {headings.map((item) => (
                        <option key={item.questionHeadingId} value={item.questionHeadingId}>
                          {item.questionHeadingName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label>
                      Question <span className="text-danger">*</span>
                    </label>
                    <input
                      id="question"
                      className="form-control mt-1"
                      value={formData.question}
                      onChange={handleInputChange}
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

              {popupMessage && <Popup {...popupMessage} />}

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

export default OPDQuestionnaireMaster;