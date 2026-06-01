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
    question: null,
    newStatus: "",
    id: null,
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

  const itemsPerPage = 5;

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

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

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
        await putRequest(`${MAS_OPD_QUESTION}/update/${editingRecord.id}`, payload);
        showPopup(UPDATE_OPD_QUESTION, "success");
      } else {
        const payload = {
          questionHeadingId: formData.headingId,
          question: formData.question,
          status: "n",
        };
        await postRequest(`${MAS_OPD_QUESTION}/create`, payload);
        showPopup(ADD_OPD_QUESTION, "success");
      }

      await fetchData();
      resetForm();
      setShowForm(false);
    } catch (error) {
      showPopup(editingRecord ? "Update failed" : "Add failed", "error");
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

  const handleConfirm = async (confirmed) => {
    const { id, newStatus, question } = confirmDialog;
    setConfirmDialog({ isOpen: false, question: null, newStatus: "", id: null });

    if (!confirmed || !id) return;

    setSaving(true);
    try {
      await putRequest(`${MAS_OPD_QUESTION}/status/${id}?status=${newStatus}`);
      showPopup(
        `Question "${question}" ${newStatus === "y" ? "activated" : "deactivated"} successfully!`,
        "success"
      );
      await fetchData();
    } catch (error) {
      console.error("Status update error:", error);
      showPopup(STATUS_UPDATE_OPD_QUESTION, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setSelectedHeadingId("");
    setCurrentPage(1);
  };

  const handleSwitchChange = (id, question, newStatus) => {
    setConfirmDialog({ isOpen: true, question, newStatus, id });
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
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Questionnaire Question Master</h4>
          <div className="d-flex">
            {!showForm ? (
              <>
                <button className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                  Add
                </button>
                <button
                  type="button"
                  className="btn btn-success me-2"
                  onClick={handleRefresh}
                >
                  <i className="mdi mdi-view-list"></i> Show All
                </button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Back
              </button>
            )}
          </div>
        </div>

        <div className="card-body">
          {loading && <LoadingScreen />}

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
                    className="btn btn-primary h-100"
                    onClick={handleSearch}
                  >
                    SEARCH
                  </button>
                </div>

                <div className="col-auto">
                  <button
                    className="btn btn-secondary h-100"
                    onClick={handleReset}
                  >
                    RESET
                  </button>
                </div>
              </div>

              {/* Table with adjusted column widths and correct mapping */}
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
                  {currentItems.map((rec) => (
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
                              handleSwitchChange(rec.id, rec.question, rec.status === "y" ? "n" : "y")
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
          )}

          {showForm && (
            <form onSubmit={handleSave} className="row g-3">
              <div className="col-md-6">
                <label>
                  Question <span className="text-danger">*</span>
                </label>
                <input
                  id="question"
                  className="form-control"
                  value={formData.question}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label>
                  Heading <span className="text-danger">*</span>
                </label>
                <select
                  id="headingId"
                  className="form-select"
                  value={formData.headingId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Heading</option>
                  {headings.map((item) => (
                    <option key={item.questionHeadingId} value={item.questionHeadingId}>
                      {item.questionHeadingName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 text-end">
                <button
                  className="btn btn-primary me-2"
                  disabled={!isFormValid || saving}
                >
                  {editingRecord ? "Update" : "Save"}
                </button>
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
                    {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                    <strong>{confirmDialog.question}</strong>?
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

export default OPDQuestionnaireMaster;