import { useEffect, useMemo, useState } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import {
  MAS_QUESTION_OPTION_VALUE,
  MAS_OPD_QUESTION,
  MAS_QUESTION_HEADING,
} from "../../../config/apiConfig";
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

const OptionValueMaster = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState([]);
  const [headings, setHeadings] = useState([]);
  const [questions, setQuestions] = useState([]);
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
  const [formData, setFormData] = useState({
    optionCode: "",
    optionValue: "",
    optionScore: "",
    questionId: "",
  });

  const [tempSelectedTopic, setTempSelectedTopic] = useState("");
  const [tempSelectedQuestion, setTempSelectedQuestion] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [formSelectedTopic, setFormSelectedTopic] = useState("");

  const showPopup = (message, type = "success", onCloseCallback = null) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
        if (onCloseCallback) onCloseCallback();
      },
    });
  };

  const getRecordId = (item) => item?.id ?? item?.optionValueId ?? item?._id ?? null;
  const getQuestionId = (question) =>
    question?.id ?? question?.questionId ?? question?.question_id ?? null;
  const getQuestionText = (question) =>
    String(question?.question ?? question?.questionText ?? "").trim();
  const getQuestionHeadingId = (question) =>
    question?.questionHeadingId ?? question?.headingId ?? question?.topicId ?? null;

  const getHeadingNameById = (headingId) => {
    const match = headings.find(
      (item) =>
        String(item.questionHeadingId ?? item.id) === String(headingId),
    );
    return match?.questionHeadingName || match?.name || "";
  };

  const getTopicLabel = (headingId) => {
    const heading = headings.find(
      (item) => String(item.questionHeadingId ?? item.id) === String(headingId),
    );
    if (!heading) return "";
    const code = heading.questionHeadingCode || heading.code || "";
    return `${heading.questionHeadingName || heading.name || ""}${code ? ` (${code})` : ""}`;
  };

  const enrichWithHeading = (optionValues, questionsList) => {
    return (optionValues || []).map((option) => {
      const question = questionsList.find(
        (q) => String(getQuestionId(q)) === String(option.questionId),
      );
      const headingId = option.questionHeadingId ?? getQuestionHeadingId(question);
      return {
        ...option,
        headingId,
        headingName: option.questionHeadingName || getHeadingNameById(headingId) || "Uncategorized",
        questionText: option.questionName || getQuestionText(question) || "Uncategorized",
      };
    });
  };

  const fetchHeadings = async (flag = 1) => {
    try {
      const response = await getRequest(`${MAS_QUESTION_HEADING}/getAll/${flag}`);
      setHeadings(Array.isArray(response?.response) ? response.response : []);
    } catch (error) {
      console.error("Error fetching question topics:", error);
      setHeadings([]);
    }
  };

  const fetchQuestions = async (flag = 0) => {
    try {
      const response = await getRequest(`${MAS_OPD_QUESTION}/getAll/${flag}`);
      setQuestions(Array.isArray(response?.response) ? response.response : []);
    } catch (error) {
      console.error("Error fetching questions:", error);
      setQuestions([]);
    }
  };

  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const response = await getRequest(`${MAS_QUESTION_OPTION_VALUE}/getAll/${flag}`);
      const optionValues = Array.isArray(response?.response) ? response.response : [];
      setData(enrichWithHeading(optionValues, questions));
    } catch (error) {
      console.error("Error fetching option values:", error);
      showPopup(FETCH_OPTION_VALUE, "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchHeadings(), fetchQuestions()]);
        const optionResponse = await getRequest(`${MAS_QUESTION_OPTION_VALUE}/getAll/0`);
        const optionValues = Array.isArray(optionResponse?.response) ? optionResponse.response : [];
        const questionResponse = await getRequest(`${MAS_OPD_QUESTION}/getAll/0`);
        const questionList = Array.isArray(questionResponse?.response) ? questionResponse.response : [];
        setQuestions(questionList);
        setData(enrichWithHeading(optionValues, questionList));
      } catch (error) {
        console.error("Error loading option master data:", error);
        setData([]);
        setQuestions([]);
        setHeadings([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (data.length) {
      setData((prev) => enrichWithHeading(prev, questions));
    }
  }, [questions]);

  const topicOptions = useMemo(() => {
    return headings
      .map((item) => ({
        id: item.questionHeadingId ?? item.id,
        name: item.questionHeadingName ?? item.name ?? "",
        code: item.questionHeadingCode ?? item.code ?? "",
      }))
      .filter((item) => item.id !== null && item.id !== undefined && item.name);
  }, [headings]);

  const filteredQuestionsForForm = useMemo(() => {
    if (!formSelectedTopic) return [];
    return questions.filter(
      (q) => String(getQuestionHeadingId(q)) === String(formSelectedTopic),
    );
  }, [questions, formSelectedTopic]);

  const questionOptionsForFilter = useMemo(() => {
    if (!tempSelectedTopic) return [];
    return questions.filter(
      (q) => String(getQuestionHeadingId(q)) === String(tempSelectedTopic),
    );
  }, [questions, tempSelectedTopic]);

  const filteredData = useMemo(() => {
    return data.filter((rec) => {
      if (selectedTopic && String(rec.headingId) !== String(selectedTopic)) {
        return false;
      }
      if (selectedQuestion && String(rec.questionId) !== String(selectedQuestion)) {
        return false;
      }
      return true;
    });
  }, [data, selectedTopic, selectedQuestion]);

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

  const handleSearch = () => {
    setSelectedTopic(tempSelectedTopic);
    setSelectedQuestion(tempSelectedQuestion);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setTempSelectedTopic("");
    setTempSelectedQuestion("");
    setSelectedTopic("");
    setSelectedQuestion("");
    setCurrentPage(1);
  };

  const handleShowAll = () => {
    handleReset();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };

    const scoreValid = (val) => {
      if (val === "") return false;
      const num = Number(val);
      return !Number.isNaN(num) && num >= 0;
    };

    const isValid =
      updated.optionCode.trim() !== "" &&
      updated.optionValue.trim() !== "" &&
      updated.questionId !== "" &&
      formSelectedTopic !== "" &&
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
    setFormSelectedTopic("");
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

    const newCode = formData.optionCode.trim().toLowerCase();
    const duplicate = data.find(
      (rec) =>
        String(rec.optionCode || "").trim().toLowerCase() === newCode &&
        (!editingRecord || getRecordId(rec) !== getRecordId(editingRecord)),
    );

    if (duplicate) {
      showPopup(DUPLICATE_OPTION_VALUE, "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        optionCode: formData.optionCode.trim(),
        optionValue: formData.optionValue.trim(),
        optionScore: formData.optionScore,
        questionId: formData.questionId,
      };

      if (editingRecord) {
        await putRequest(
          `${MAS_QUESTION_OPTION_VALUE}/update/${getRecordId(editingRecord)}`,
          payload,
        );
        showPopup(UPDATE_OPTION_VALUE, "success");
      } else {
        await postRequest(`${MAS_QUESTION_OPTION_VALUE}/create`, {
          ...payload,
          status: "y",
        });
        showPopup(CREATE_OPTION_VALUE, "success");
      }

      resetForm();
      setShowForm(false);
      fetchData();
    } catch (error) {
      console.error("Save error:", error);
      showPopup(SAVE_OPTION_VALUE, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (rec) => {
    const question = questions.find(
      (q) => String(getQuestionId(q)) === String(rec.questionId),
    );

    setEditingRecord(rec);
    setFormData({
      optionCode: rec.optionCode || "",
      optionValue: rec.optionValue || "",
      optionScore: rec.optionScore ?? "",
      questionId: rec.questionId ?? "",
    });
    setFormSelectedTopic(String(getQuestionHeadingId(question) || rec.headingId || ""));
    setShowForm(true);
    setIsFormValid(true);
  };

  const handleSwitchChange = (id, currentStatus, name) => {
    const newStatus = currentStatus === STATUS.ACTIVE ? STATUS.INACTIVE : STATUS.ACTIVE;
    setConfirmDialog({
      isOpen: true,
      id,
      newStatus,
      name,
    });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.id !== null) {
      setSaving(true);
      try {
        await putRequest(
          `${MAS_QUESTION_OPTION_VALUE}/status/${confirmDialog.id}?status=${confirmDialog.newStatus}`,
        );
        showPopup(
          `Option value "${confirmDialog.name}" ${
            confirmDialog.newStatus === STATUS.ACTIVE ? "activated" : "deactivated"
          } successfully!`,
          "success",
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

  const displayTopicName = (rec) => rec.headingName || getHeadingNameById(rec.headingId) || "-";

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
                  <button className="btn btn-secondary" onClick={handleCancel}>
                    Back
                  </button>
                )}
              </div>
            </div>

            <div className="card-body">
              {loading && !showForm && <LoadingScreen />}

              {!showForm && !loading && (
                <>
                  <div className="row mb-3 p-2 bg-light border rounded align-items-end g-2">
                    <div className="col-md-4">
                      <label className="fw-bold mb-1">Question Topic</label>
                      <select
                        className="form-select"
                        value={tempSelectedTopic}
                        onChange={(e) => {
                          setTempSelectedTopic(e.target.value);
                          setTempSelectedQuestion("");
                        }}
                      >
                        <option value="">Select Topic</option>
                        {topicOptions.map((topic) => (
                          <option key={topic.id} value={topic.id}>
                            {topic.name}
                            {topic.code ? ` (${topic.code})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="fw-bold mb-1">Question</label>
                      <select
                        className="form-select"
                        value={tempSelectedQuestion}
                        onChange={(e) => setTempSelectedQuestion(e.target.value)}
                        disabled={!tempSelectedTopic}
                      >
                        <option value="">Select Question</option>
                        {questionOptionsForFilter.map((question) => (
                          <option key={getQuestionId(question)} value={getQuestionId(question)}>
                            {getQuestionText(question)}
                          </option>
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

                  <div className="table-responsive">
                    <table className="table table-bordered table-hover" style={{ minWidth: "800px" }}>
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "15%" }}>Topic</th>
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
                            <tr key={getRecordId(rec)}>
                              <td style={{ wordBreak: "break-word" }}>{displayTopicName(rec)}</td>
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
                                    onChange={() =>
                                      handleSwitchChange(
                                        getRecordId(rec),
                                        rec.status,
                                        rec.optionCode,
                                      )
                                    }
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
                            <td colSpan="7" className="text-center">
                              No Records Found
                            </td>
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

              {showForm && (
                <form onSubmit={handleSave} className="row g-3">
                  <div className="col-md-6">
                    <label>
                      Question Topic <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select mt-1"
                      value={formSelectedTopic}
                      onChange={(e) => {
                        setFormSelectedTopic(e.target.value);
                        setFormData((prev) => ({ ...prev, questionId: "" }));
                      }}
                      disabled={saving}
                    >
                      <option value="">Select Topic</option>
                      {topicOptions.map((topic) => (
                        <option key={topic.id} value={topic.id}>
                          {topic.name}
                          {topic.code ? ` (${topic.code})` : ""}
                        </option>
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
                      disabled={saving || !formSelectedTopic}
                    >
                      <option value="">Select Question</option>
                      {filteredQuestionsForForm.map((question) => (
                        <option key={getQuestionId(question)} value={getQuestionId(question)}>
                          {getQuestionText(question)}
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
                <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-body">
                        Are you sure you want to{" "}
                        {confirmDialog.newStatus === STATUS.ACTIVE ? "activate" : "deactivate"}{" "}
                        <strong>{confirmDialog.name}</strong>?
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
      </div>
    </div>
  );
};

export default OptionValueMaster;
