import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import Popup from "../../../Components/popup";
import {MAS_QUESTION_HEADING, QUESTION_WISE_ANSWER_VALUE} from "../../../config/apiConfig";
import { getRequest } from "../../../service/apiService";

const createEmptyRow = () => ({ headingId: "", answers: {} });

const Psychiatrist = forwardRef(
  ({ onSave, onChange, value, readOnly = false, hideSaveButton = false }, ref) => {
  const [rows, setRows] = useState([createEmptyRow()]);
  const [popupMessage, setPopupMessage] = useState(null);
  const [psychiatricCategories, setPsychiatricCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryQuestions, setCategoryQuestions] = useState({}); // Cache for questions

  const normalizeRowsFromValue = (incomingValue) => {
    if (!incomingValue) {
      return [createEmptyRow()];
    }

    if (Array.isArray(incomingValue.assessments) && incomingValue.assessments.length > 0) {
      return incomingValue.assessments.map((assessment, assessmentIndex) => ({
        headingId: assessment.assessmentHeaderId
          ? String(assessment.assessmentHeaderId)
          : `assessment-${assessmentIndex}`,
        headingName: assessment.topicName || `Topic ${assessmentIndex + 1}`,
        headingCode: "",
        answers: Array.isArray(assessment.questionsResponses)
          ? assessment.questionsResponses.reduce((acc, item, questionIndex) => {
              const fallbackQuestionId =
                item.questionId ??
                item.id ??
                item.questionName ??
                `${assessment.topicName || "topic"}-${questionIndex}`;
              acc[String(fallbackQuestionId)] = {
                questionId: fallbackQuestionId,
                value:
                  item.questionsAns ??
                  item.answerValue ??
                  item.answer ??
                  "",
                questionsAns:
                  item.questionsAns ??
                  item.answerValue ??
                  item.answer ??
                  "",
                answerId: item.answerOptionId ?? null,
                answerCode: item.answerCode ?? null,
                answerScore: item.answerScore ?? null,
                questionText: item.questionName ?? item.questionText ?? "",
              };
              return acc;
            }, {})
          : {},
      }));
    }

    if (Array.isArray(incomingValue.rows) && incomingValue.rows.length > 0) {
      return incomingValue.rows.map((row, rowIndex) => ({
        headingId: row.headingId ? String(row.headingId) : "",
        answers: Array.isArray(row.questions)
          ? row.questions.reduce((acc, item, questionIndex) => {
              const fallbackQuestionId =
                item.questionId ??
                item.id ??
                item.questionName ??
                `${row.headingId || "row"}-${questionIndex}`;
              acc[String(fallbackQuestionId)] = {
                questionId: fallbackQuestionId,
                value:
                  item.questionsAns ??
                  item.answerValue ??
                  item.answer ??
                  "",
                questionsAns:
                  item.questionsAns ??
                  item.answerValue ??
                  item.answer ??
                  "",
                answerId:
                  item.answerOptionId !== undefined &&
                  item.answerOptionId !== null
                    ? Number(item.answerOptionId)
                    : null,
                answerCode: item.answerCode ?? null,
                answerScore: item.answerScore ?? null,
                questionText: item.questionText ?? item.questionName ?? "",
              };
              return acc;
            }, {})
          : {},
      }));
    }

    if (incomingValue.topicId && Array.isArray(incomingValue.details)) {
      return [
        {
          headingId: String(incomingValue.topicId),
          answers: incomingValue.details.reduce((acc, detail, questionIndex) => {
            const fallbackQuestionId =
              detail.questionId ??
              detail.id ??
              detail.questionName ??
              `${incomingValue.topicId}-${questionIndex}`;
            acc[String(fallbackQuestionId)] = {
              questionId: fallbackQuestionId,
              value:
                detail.questionsAns ??
                detail.answerValue ??
                detail.answer ??
                "",
              questionsAns:
                detail.questionsAns ??
                detail.answerValue ??
                detail.answer ??
                "",
              answerId:
                detail.answerOptionId !== undefined &&
                detail.answerOptionId !== null
                  ? Number(detail.answerOptionId)
                  : null,
              answerCode: detail.answerCode ?? null,
              answerScore: detail.answerScore ?? null,
              questionText: detail.questionText ?? detail.questionName ?? "",
            };
            return acc;
          }, {}),
        },
      ];
    }

    return [createEmptyRow()];
  };

  const buildPayload = (nextRows = rows) => {
    const selectedRows = nextRows.filter(
      (item) => item.headingId && Object.keys(item.answers).length > 0,
    );

    const rowPayloads = selectedRows.map((item) => {
      const category = psychiatricCategories.find(
        (x) => String(x.id) === String(item.headingId),
      );
      const questions = categoryQuestions[item.headingId] || [];

      const questionsAndAnswers = Object.entries(item.answers)
        .map(([questionId, answerData]) => {
          const question = questions.find(
            (q) => String(q.id) === String(questionId),
          );

          return {
            questionId: Number(questionId),
            questionText: answerData?.questionText || question?.text || answerData.questionName|| "",
            answerOptionId:
              answerData?.answerId !== undefined && answerData?.answerId !== null
                ? Number(answerData.answerId)
                : null,
            answerValue: answerData?.value ?? "",
            answerCode: answerData?.answerCode ?? null,
            answerScore: answerData?.answerScore ?? null,
          };
        })
        .filter(
          (detail) =>
            detail.questionId &&
            (detail.answerOptionId !== null ||
              detail.answerValue ||
              detail.questionText),
        );

      return {
        headingId: Number(item.headingId),
        headingName: category?.name || "",
        headingCode: category?.code || "",
        questions: questionsAndAnswers,
      };
    });

    const primaryTopic = rowPayloads[0] || null;
    const details = rowPayloads.flatMap((row) =>
      row.questions.map(({ questionId, answerOptionId, answerCode, answerScore }) => ({
        questionId,
        answerOptionId,
        answerCode,
        answerScore,
      })),
    );

    return {
      topicId: primaryTopic?.headingId ?? null,
      topicName: primaryTopic?.headingName || "",
      topicCode: primaryTopic?.headingCode || "",
      rows: rowPayloads,
      details,
    };
  };

  const buildHistoryRows = () =>
    Array.isArray(value?.assessments)
      ? value.assessments.map((assessment, assessmentIndex) => ({
          headingId: String(
            assessment.assessmentHeaderId ?? `assessment-${assessmentIndex}`,
          ),
          headingName: assessment.topicName || `Topic ${assessmentIndex + 1}`,
          headingCode: "",
          questions: Array.isArray(assessment.questionsResponses)
            ? assessment.questionsResponses.map((item, questionIndex) => ({
                questionId:
                  item.questionId ??
                  item.id ??
                  `${assessmentIndex}-${questionIndex}`,
                questionText: item.questionName ?? item.questionText ?? "",
                answerValue:
                  item.questionsAns ??
                  item.answerValue ??
                  item.answer ??
                  "",
                answerCode: item.answerCode ?? null,
                answerScore: item.answerScore ?? null,
                answerOptionId: item.answerOptionId ?? null,
              }))
            : [],
        }))
      : [];

  useEffect(() => {
    setRows(normalizeRowsFromValue(value));
  }, [value]);

  useEffect(() => {
    if (readOnly) return;
    const headingIds = [...new Set(rows.map((row) => row.headingId).filter(Boolean))];
    headingIds.forEach((headingId) => {
      if (!categoryQuestions[headingId]) {
        fetchQuestionsForCategory(headingId);
      }
    });
  }, [rows, categoryQuestions, readOnly]);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getRequest(`${MAS_QUESTION_HEADING}/getAll/1`);

        if (data.status === 200 && Array.isArray(data.response)) {
          const transformedCategories = data.response.map(item => ({
            id: item.questionHeadingId,
            name: item.questionHeadingName,
            code: item.questionHeadingCode,
            status: item.status
          }));
          setPsychiatricCategories(transformedCategories);
        }
      } catch (error) {
        console.error("Error fetching psychiatric categories:", error);
        showPopup("Failed to load categories", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const showPopup = (message, type) => {
    setPopupMessage({
      message,
      type,
      onClose: () => setPopupMessage(null),
    });
  };

  // Fetch questions for a specific category
  const fetchQuestionsForCategory = async (headingId) => {
    try {
      // Check if questions are already cached
      if (categoryQuestions[headingId]) {
        return categoryQuestions[headingId];
      }

      const data = await getRequest(`${QUESTION_WISE_ANSWER_VALUE}/${headingId}`);

      if (data.status === 200 && Array.isArray(data.response)) {
        // Transform questions to match the expected format
        const questions = data.response.map(item => ({
          id: item.questionId,
          text: item.question,
          options: item.answerResponse.map(answer => answer.answerValue),
          // Store full answer data for later use
          answers: item.answerResponse
        }));
        
        // Cache the questions
        setCategoryQuestions(prev => ({
          ...prev,
          [headingId]: questions
        }));
        
        return questions;
      }
      return [];
    } catch (error) {
      console.error("Error fetching questions:", error);
      showPopup("Failed to load questions", "error");
      return [];
    }
  };

  const handleHeadingChange = async (index, value) => {
    const temp = [...rows];
    temp[index].headingId = value;
    temp[index].answers = {};
    setRows(temp);

    // Fetch questions when a category is selected
    if (value) {
      await fetchQuestionsForCategory(value);
    }
  };

  const handleAnswerChange = (rowIndex, questionId, answerValue) => {
    const temp = [...rows];
    const questions = categoryQuestions[temp[rowIndex].headingId] || [];
    const question = questions.find(q => q.id === questionId);
    
    // Find the full answer object
    const selectedAnswer = question?.answers?.find(a => a.answerValue === answerValue);
    
    // Store both the value and the full answer data
    temp[rowIndex].answers[questionId] = {
      value: answerValue,
      answerId: selectedAnswer?.answerId,
      answerCode: selectedAnswer?.answerCode,
      answerScore: selectedAnswer?.answerScore
    };
    
    setRows(temp);
  };

  const handleSubmit = () => {
    const payload = buildPayload(rows);

    if (!payload.rows.length || !payload.details.length) {
      showPopup("Please select at least one question and answer before saving.", "error");
      return;
    }

    if (onSave) {
      onSave(payload);
    } else if (onChange) {
      onChange(payload);
    }

    showPopup("Psychiatric assessment saved successfully.", "success");
  };

  useImperativeHandle(ref, () => ({
    save: handleSubmit,
  }));

  const addRow = () => {
    const nextRows = [...rows, createEmptyRow()];
    setRows(nextRows);
  };

  const deleteRow = (index) => {
    if (rows.length === 1) return;
    const temp = rows.filter((_, i) => i !== index);
    setRows(temp);
  };

  if (loading) {
    return (
      <div className="container-fluid p-0">
        <div className="card shadow-sm" style={{ border: "none" }}>
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading psychiatric categories...</p>
          </div>
        </div>
      </div>
    );
  }

  const currentPayload = readOnly ? { rows: buildHistoryRows() } : buildPayload(rows);
  const historyAssessments = Array.isArray(value?.assessments)
    ? value.assessments
    : [];
  

  return (
    <div className="container-fluid p-0">
      <div className="card shadow-sm" style={{ border: "none" }}>
        <div className="card-header bg-primary text-white py-2" style={{ borderRadius: "8px 8px 0 0" }}>
          <h6 className="mb-0 fw-bold">
            <i className="mdi mdi-brain me-2"></i>
            Assessment
          </h6>
        </div>

        <div 
          className="card-body p-3" 
          style={{ 
            maxHeight: "500px",
            overflowY: "auto",
            overflowX: "hidden"
          }}
        >
          {/* Main Table */}
          {readOnly ? (
            <div className="table-responsive">
              <table className="table table-bordered table-sm">
                <thead style={{ backgroundColor: "#e9ecef", position: "sticky", top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={{ width: "65%", padding: "8px" }}>Question</th>
                    <th style={{ width: "35%", padding: "8px" }}>Answer</th>
                  </tr>
                </thead>
                <tbody>
                  {historyAssessments.length > 0 ? (
                    historyAssessments.map((assessment, assessmentIndex) => (
                      <React.Fragment key={`${assessment.assessmentHeaderId || "assessment"}-${assessmentIndex}`}>
                        <tr className="table-light">
                          <td colSpan="2" style={{ padding: "8px", fontWeight: 700 }}>
                            {assessment.topicName || `Topic ${assessmentIndex + 1}`}
                          </td>
                        </tr>
                        {Array.isArray(assessment.questionsResponses) &&
                          assessment.questionsResponses.map((qa, idx) => (
                            <tr key={`${assessment.assessmentHeaderId || "assessment"}-${idx}`}>
                              <td style={{ padding: "8px", verticalAlign: "middle" }}>
                                {qa.questionName || qa.questionText || `Question ${idx + 1}`}
                              </td>
                          <td style={{ padding: "8px", verticalAlign: "middle" }}>
                                {qa.questionsAns ?? qa.answerValue ?? qa.answerCode ?? qa.value ?? "-"}
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="text-center text-muted py-4">
                        No psychiatrist history details available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-sm">
                <thead style={{ backgroundColor: "#e9ecef", position: "sticky", top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={{ width: "30%", padding: "8px" }}>Question Heading</th>
                    <th style={{ width: "55%", padding: "8px" }}>Questions & Answers</th>
                    <th style={{ width: "7%", padding: "8px", textAlign: "center" }}>Add</th>
                    <th style={{ width: "8%", padding: "8px", textAlign: "center" }}>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => {
                    const selectedCategory = psychiatricCategories.find(x => x.id == row.headingId);
                    const questions = categoryQuestions[row.headingId] || [];

                    return (
                      <React.Fragment key={rowIndex}>
                        <tr>
                          <td style={{ padding: "8px", verticalAlign: "middle" }}>
                            <select
                              className="form-select form-select-sm"
                              value={row.headingId}
                              onChange={(e) => handleHeadingChange(rowIndex, e.target.value)}
                              disabled={readOnly}
                            >
                              <option value="">-- Select Category --</option>
                              {psychiatricCategories.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.name} {item.code && `(${item.code})`}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: "8px", verticalAlign: "middle" }}>
                            {selectedCategory && (
                              <small className="text-muted">
                                {questions.length} question{questions.length !== 1 ? 's' : ''} available
                              </small>
                            )}
                          </td>
                          <td style={{ padding: "8px", textAlign: "center", verticalAlign: "middle" }}>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={addRow}
                              disabled={readOnly}
                              style={{ padding: "4px 12px" }}
                            >
                              +
                            </button>
                          </td>
                          <td style={{ padding: "8px", textAlign: "center", verticalAlign: "middle" }}>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => deleteRow(rowIndex)}
                              disabled={rows.length === 1 || readOnly}
                              style={{ padding: "4px 12px" }}
                            >
                              -
                            </button>
                          </td>
                        </tr>

                        {selectedCategory && questions.map((question) => (
                          <tr key={question.id} style={{ backgroundColor: "#fafafa" }}>
                            <td style={{ padding: "10px", verticalAlign: "middle", paddingLeft: "25px" }}>
                              <div className="mt-1">{question.text}</div>
                            </td>
                            <td colSpan="3" style={{ padding: "10px", verticalAlign: "middle" }}>
                              <select
                                className="form-select form-select-sm"
                                value={row.answers[question.id]?.value || ""}
                                onChange={(e) => handleAnswerChange(rowIndex, question.id, e.target.value)}
                                disabled={readOnly}
                                style={{ maxWidth: "280px" }}
                              >
                                <option value="">-- Select Answer --</option>
                                {question.options && question.options.map((opt, i) => (
                                  <option key={i} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Submit Button */}
          {!readOnly && !hideSaveButton && (
            <div className="text-center mt-3">
              <button className="btn btn-success btn-sm px-4" onClick={handleSubmit}>
                <i className="mdi mdi-content-save me-1"></i>
                Save
              </button>
            </div>
          )}

          {!readOnly && currentPayload.rows.length > 0 && (
            <div className="mt-3 border rounded p-3 bg-light">
              <div className="fw-bold mb-2">Selected Answers</div>
              {currentPayload.rows.map((row) => (
                <div key={`${row.headingId}-${row.headingCode}`} className="mb-3">
                  <div className="small text-muted fw-bold">
                    {row.headingName || `Category ${row.headingId}`}
                    {row.headingCode ? ` (${row.headingCode})` : ""}
                  </div>
                  <ul className="mb-0 ps-3">
                    {row.questions.map((qa) => (
                      <li key={`${qa.questionId}-${qa.answerOptionId}`}>
                        <strong>{qa.questionText || `Question ${qa.questionId}`}</strong>
                                : {qa.answerValue ?? qa.answerCode ?? "-"}
                              </li>
                            ))}
                          </ul>
                        </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Popup Message */}
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}
    </div>
  );
});

export default Psychiatrist;
