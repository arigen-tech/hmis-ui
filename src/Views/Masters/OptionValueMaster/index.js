import { useState, useEffect, useMemo } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { MAS_QUESTION_OPTION_VALUE, MAS_OPD_QUESTION } from "../../../config/apiConfig";
import { getRequest, postRequest, putRequest } from "../../../service/apiService";

import {
  FETCH_OPTION_VALUE,
  CREATE_OPTION_VALUE,
  UPDATE_OPTION_VALUE,
  SAVE_OPTION_VALUE,
  DUPLICATE_OPTION_VALUE,
  UPDATE_STATUS,
  STATUS,
} from "../../../config/constants";

// ========== CONFIGURATION ==========
// Set this to the actual field name in your question API that stores the heading/topic.
// Common names: "topic", "scaleName", "category", "headingName", "section", "group"
const HEADING_FIELD = "heading";   // CHANGE THIS TO MATCH YOUR API FIELD
// ==================================

const OptionValueMaster = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState([]);
  const [rawData, setRawData] = useState([]);
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
    id: null,
    newStatus: "",
    name: "",
  });
  const [questions, setQuestions] = useState([]);
  const [debugInfo, setDebugInfo] = useState(null);

  // Filter states
  const [tempSelectedHeading, setTempSelectedHeading] = useState('');
  const [tempSelectedQuestion, setTempSelectedQuestion] = useState('');
  const [selectedHeading, setSelectedHeading] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState('');

  // Form dependent heading state
  const [formSelectedHeading, setFormSelectedHeading] = useState('');

  // ---------- Helper: extract heading from question (flexible & robust) ----------
  const getHeading = (q) => {
    if (!q) return "";
    
    // Try the configured field first
    if (q[HEADING_FIELD] && String(q[HEADING_FIELD]).trim()) {
      return String(q[HEADING_FIELD]).trim();
    }
    
    // Fallback: try common alternative names
    const alternatives = ["topic", "scaleName", "category", "headingName", "questionHeading", "section", "group", "title"];
    for (let alt of alternatives) {
      if (q[alt] && String(q[alt]).trim()) {
        return String(q[alt]).trim();
      }
    }
    
    // Last resort: use first few words of the question text as heading
    if (q.question) {
      const short = q.question.substring(0, 40);
      return short + (q.question.length > 40 ? "…" : "");
    }
    
    return "Uncategorized";
  };

  // Enrich option values with heading & question text
  const enrichWithHeading = (optionValues, questionsList) => {
    return optionValues.map(option => {
      const question = questionsList.find(q => q.id === option.questionId);
      return {
        ...option,
        headingName: getHeading(question) || "—",
        questionText: option.questionName || question?.question || "—"
      };
    });
  };

  // Fetch option values
  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const { response } = await getRequest(
        `${MAS_QUESTION_OPTION_VALUE}/getAll/${flag}`
      );
      setRawData(response || []);
      if (questions.length) {
        setData(enrichWithHeading(response || [], questions));
      } else {
        setData(response || []);
      }
    } catch {
      showPopup(FETCH_OPTION_VALUE, "error");
      setRawData([]);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch questions with debugging (optional)
  const fetchQuestions = async (flag = 0) => {
    try {
      const res = await getRequest(`${MAS_OPD_QUESTION}/getAll/${flag}`);
      const qs = res?.response || res?.data?.response || [];
      console.log("Questions API response:", qs);
      
      if (qs.length > 0) {
        const sample = qs[0];
        console.log("Sample question object:", sample);
        console.log("Available fields in question:", Object.keys(sample));
        console.log(`Value of configured heading field "${HEADING_FIELD}":`, sample[HEADING_FIELD]);
        
        // Optional debug info (can be shown in UI if needed)
        setDebugInfo({
          totalQuestions: qs.length,
          sampleFields: Object.keys(sample),
          headingValue: sample[HEADING_FIELD] || "NOT FOUND",
          firstQuestion: sample.question?.substring(0, 50)
        });
      } else {
        setDebugInfo({ totalQuestions: 0, error: "No questions found" });
      }
      
      setQuestions(qs);
      if (rawData.length) {
        setData(enrichWithHeading(rawData, qs));
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      setDebugInfo({ error: error.message });
      setQuestions([]);
    }
  };

  useEffect(() => {
    fetchData();
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (rawData.length && questions.length) {
      setData(enrichWithHeading(rawData, questions));
    }
  }, [rawData, questions]);

  // Unique headings for dropdowns
  const uniqueHeadings = useMemo(() => {
    const headings = questions.map(q => getHeading(q)).filter(h => h && h.trim() !== "");
    return [...new Set(headings)];
  }, [questions]);

  // Filter data based on selected heading & question
  const filteredData = data.filter(rec => {
    if (selectedHeading && rec.headingName !== selectedHeading) return false;
    if (selectedQuestion) {
      const question = questions.find(q => q.id === rec.questionId);
      const questionText = question?.question || rec.questionText;
      if (questionText !== selectedQuestion) return false;
    }
    return true;
  });

  // Pagination
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

  // Search handlers
  const handleSearch = () => {
    setSelectedHeading(tempSelectedHeading);
    setSelectedQuestion(tempSelectedQuestion);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setTempSelectedHeading('');
    setTempSelectedQuestion('');
    setSelectedHeading('');
    setSelectedQuestion('');
    setCurrentPage(1);
  };

  const handleShowAll = () => {
    handleReset();
  };

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };

    const scoreValid = val => {
      if (val === "") return false;
      const num = Number(val);
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
    setFormSelectedHeading('');
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  // Save (create/update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid || saving) return;

    const newCode = formData.optionCode.trim().toLowerCase();
    const duplicate = data.find(
      (rec) =>
        rec.optionCode?.toLowerCase() === newCode &&
        (!editingRecord || rec.id !== editingRecord.id)
    );

    if (duplicate) {
      showPopup(DUPLICATE_OPTION_VALUE, "error");
      return;
    }

    setSaving(true);
    try {
      if (editingRecord) {
        await putRequest(
          `${MAS_QUESTION_OPTION_VALUE}/update/${editingRecord.id}`,
          formData
        );
        showPopup(UPDATE_OPTION_VALUE, "success");
        resetForm();
        fetchData();
        setShowForm(false);
      } else {
        await postRequest(`${MAS_QUESTION_OPTION_VALUE}/create`, {
          ...formData,
          status: "y",
        });
        showPopup(CREATE_OPTION_VALUE, "success");
        resetForm();
        fetchData();
        setShowForm(false);
      }
    } catch (error) {
      console.error("Save error:", error);
      showPopup(SAVE_OPTION_VALUE, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({
      optionCode: rec.optionCode,
      optionValue: rec.optionValue,
      optionScore: rec.optionScore,
      questionId: rec.questionId,
    });
    const questionObj = questions.find(q => q.id === rec.questionId);
    if (questionObj) {
      setFormSelectedHeading(getHeading(questionObj));
    }
    setShowForm(true);
    setIsFormValid(true);
  };

  // Status toggle
  const handleSwitchChange = (id, currentStatus, name) => {
    const newStatus = currentStatus === STATUS.ACTIVE ? STATUS.INACTIVE : STATUS.ACTIVE;
    setConfirmDialog({
      isOpen: true,
      id: id,
      newStatus,
      name: name,
    });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.id !== null) {
      setSaving(true);
      try {
        await putRequest(
          `${MAS_QUESTION_OPTION_VALUE}/status/${confirmDialog.id}?status=${confirmDialog.newStatus}`
        );
        showPopup(
          `Option value "${confirmDialog.name}" ${
            confirmDialog.newStatus === STATUS.ACTIVE ? "activated" : "deactivated"
          } successfully!`,
          "success"
        );
        fetchData();
        setCurrentPage(1);
      } catch (error) {
        console.error("Status update error:", error);
        showPopup(UPDATE_STATUS, "error");
      } finally {
        setSaving(false);
      }
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "", name: "" });
  };

  const showPopup = (message, type = "success") => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  // Questions for form (dependent on formSelectedHeading)
  const filteredQuestionsForForm = useMemo(() => {
    if (!formSelectedHeading) return [];
    return questions.filter(q => getHeading(q) === formSelectedHeading);
  }, [questions, formSelectedHeading]);

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Option Value Master</h4>
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
                      onClick={handleShowAll}
                    >
                      Show All
                    </button>
                  </>
                ) : (
                  <button className="btn btn-secondary" onClick={handleCancel}>                    Back
                  </button>
                )}
              </div>
            </div>

            <div className="card-body">
              {loading && !showForm && <LoadingScreen />}

              {/* LIST VIEW */}
              {!showForm && !loading && (
                <>
                  {/* FILTER SECTION */}
                  <div className="row mb-3 p-2 bg-light border rounded align-items-end g-2">
                    <div className="col-md-4">
                      <label className="fw-bold mb-1">Question Heading</label>
                      <select
                        className="form-select"
                        value={tempSelectedHeading}
                        onChange={(e) => {
                          setTempSelectedHeading(e.target.value);
                          setTempSelectedQuestion('');
                        }}
                      >
                        <option value="">Select Heading</option>
                        {uniqueHeadings.map(heading => (
                          <option key={heading} value={heading}>{heading}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="fw-bold mb-1">Question</label>
                      <select
                        className="form-select"
                        value={tempSelectedQuestion}
                        onChange={(e) => setTempSelectedQuestion(e.target.value)}
                        disabled={!tempSelectedHeading}
                      >
                        <option value="">Select Question</option>
                        {questions
                          .filter(q => getHeading(q) === tempSelectedHeading)
                          .map(q => (
                            <option key={q.id} value={q.question}>{q.question}</option>
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

                  {/* TABLE with fixed column widths */}
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover" style={{ minWidth: "800px" }}>
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "15%" }}>Heading</th>
                          <th style={{ width: "25%" }}>Question</th>
                          <th style={{ width: "20%" }}>Option Value Name</th>
                          <th style={{ width: "15%" }}>Option Value Code</th>
                          <th style={{ width: "10%" }}>Score</th>
                          <th style={{ width: "10%" }}>Status</th>
                          <th style={{ width: "5%" }}>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((rec) => (
                            <tr key={rec.id}>
                              <td style={{ wordBreak: "break-word" }}>{rec.headingName}</td>
                              <td style={{ wordBreak: "break-word" }}>{rec.questionText}</td>
                              <td style={{ wordBreak: "break-word" }}>{rec.optionValue}</td>
                              <td>{rec.optionCode}</td>
                              <td>{rec.optionScore}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={rec.status === STATUS.ACTIVE}
                                    onChange={() => handleSwitchChange(rec.id, rec.status, rec.optionCode)}
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
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="text-center">No Records Found</td>
                          </tr>
                        )}
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
              )}

              {/* FORM VIEW */}
              {showForm && (
                <form onSubmit={handleSave} className="row g-3">
                  <div className="col-md-6">
                    <label>
                      Question Heading <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select mt-1"
                      value={formSelectedHeading}
                      onChange={(e) => {
                        setFormSelectedHeading(e.target.value);
                        setFormData(prev => ({ ...prev, questionId: "" }));
                      }}
                      disabled={saving}
                    >
                      <option value="">Select Heading</option>
                      {uniqueHeadings.map(heading => (
                        <option key={heading} value={heading}>{heading}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label>
                      Question <span className="text-danger">*</span>
                    </label>
                    <select
                      name="questionId"
                      className="form-select mt-1"
                      value={formData.questionId}
                      onChange={handleInputChange}
                      disabled={saving || !formSelectedHeading}
                    >
                      <option value="">Select Question</option>
                      {filteredQuestionsForForm.map(q => (
                        <option key={q.id} value={q.id}>
                          {q.question}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label>
                      Option Value Code <span className="text-danger">*</span>
                    </label>
                    <input
                      name="optionCode"
                      className="form-control mt-1"
                      value={formData.optionCode}
                      onChange={handleInputChange}
                      disabled={saving}
                    />
                  </div>

                  <div className="col-md-4">
                    <label>
                      Option Value Name <span className="text-danger">*</span>
                    </label>
                    <input
                      name="optionValue"
                      className="form-control mt-1"
                      value={formData.optionValue}
                      onChange={handleInputChange}
                      disabled={saving}
                    />
                  </div>

                  <div className="col-md-4">
                    <label>
                      Score <span className="text-danger">*</span>
                    </label>
                    <input
                      name="optionScore"
                      type="number"
                      step="any"
                      className="form-control mt-1"
                      value={formData.optionScore}
                      onChange={handleInputChange}
                      disabled={saving}
                    />
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

              {/* Confirmation Dialog */}
              {confirmDialog.isOpen && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-body">
                        Are you sure you want to{" "}
                        {confirmDialog.newStatus === STATUS.ACTIVE
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
      </div>
    </div>
  );
};

export default OptionValueMaster;