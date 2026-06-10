import React, { useState } from "react";
import Popup from "../../../Components/popup";

const psychiatricCategories = [
  {
    id: 1,
    name: "Mood Disorder",
    questions: [
      { id: 1, text: "Do you feel sad or depressed most of the day?", options: ["None", "Mild", "Moderate", "Severe", "Very Severe"] },
      { id: 2, text: "Have you lost interest in activities you once enjoyed?", options: ["None", "Mild", "Moderate", "Severe", "Very Severe"] },
      { id: 3, text: "Do you cry frequently?", options: ["Never", "Sometimes", "Often", "Always"] },
      { id: 4, text: "Do you feel hopeless about the future?", options: ["Never", "Sometimes", "Often", "Always"] },
      { id: 5, text: "Have you had thoughts of self-harm?", options: ["Never", "Rarely", "Sometimes", "Often"] },
      { id: 6, text: "Do you experience mood swings?", options: ["Never", "Sometimes", "Often", "Very Often"] },
    ],
  },
  {
    id: 2,
    name: "Anxiety Disorder",
    questions: [
      { id: 1, text: "Do you feel nervous, anxious, or on edge?", options: ["None", "Mild", "Moderate", "Severe"] },
      { id: 2, text: "Do you overthink a lot?", options: ["Never", "Rarely", "Sometimes", "Always"] },
      { id: 3, text: "Do you get panic attacks?", options: ["No", "Occasionally", "Frequently", "Very Frequently"] },
      { id: 4, text: "Do you avoid social situations?", options: ["No", "Sometimes", "Mostly", "Always"] },
      { id: 5, text: "Do you have physical symptoms like palpitations?", options: ["Never", "Rarely", "Sometimes", "Often"] },
      { id: 6, text: "Do you feel restless or unable to relax?", options: ["Never", "Rarely", "Sometimes", "Often"] },
    ],
  },
  {
    id: 3,
    name: "Sleep Pattern",
    questions: [
      { id: 1, text: "Do you have trouble falling asleep?", options: ["No", "Mild", "Moderate", "Severe"] },
      { id: 2, text: "Do you wake up frequently during the night?", options: ["Never", "Sometimes", "Often", "Always"] },
      { id: 3, text: "Do you feel sleepy during the daytime?", options: ["No", "Sometimes", "Often", "Always"] },
      { id: 4, text: "Do you wake up too early and can't go back to sleep?", options: ["Never", "Rarely", "Sometimes", "Often"] },
      { id: 5, text: "Do you have nightmares or disturbing dreams?", options: ["Never", "Rarely", "Sometimes", "Often"] },
      { id: 6, text: "Do you feel tired even after a full night's sleep?", options: ["Never", "Rarely", "Sometimes", "Often"] },
    ],
  },
  {
    id: 4,
    name: "Substance Use",
    questions: [
      { id: 1, text: "Do you consume alcohol?", options: ["Never", "Occasionally", "Regularly", "Daily"] },
      { id: 2, text: "Do you smoke or use tobacco products?", options: ["Never", "Occasionally", "Daily", "Heavily"] },
      { id: 3, text: "Do you use any recreational drugs?", options: ["Never", "Rarely", "Sometimes", "Often"] },
      { id: 4, text: "Have you tried to quit but couldn't?", options: ["No", "Yes"] },
      { id: 5, text: "Does substance use affect your daily life?", options: ["No", "Mildly", "Moderately", "Severely"] },
    ],
  },
  {
    id: 5,
    name: "Social Behaviour",
    questions: [
      { id: 1, text: "Do you prefer to stay alone rather than with others?", options: ["No", "Sometimes", "Yes", "Always"] },
      { id: 2, text: "Do you avoid meeting new people?", options: ["No", "Sometimes", "Yes", "Always"] },
      { id: 3, text: "Do you have difficulty maintaining relationships?", options: ["Never", "Rarely", "Sometimes", "Often"] },
      { id: 4, text: "Do you feel uncomfortable in social gatherings?", options: ["Never", "Rarely", "Sometimes", "Often"] },
      { id: 5, text: "Do you feel lonely even when with others?", options: ["Never", "Rarely", "Sometimes", "Often"] },
    ],
  },
];

const Psychiatrist = ({ onSave, readOnly = false }) => {
  const [rows, setRows] = useState([
    { headingId: "", answers: {} }
  ]);
  const [popupMessage, setPopupMessage] = useState(null);

  const showPopup = (message, type) => {
    setPopupMessage({
      message,
      type,
      onClose: () => setPopupMessage(null),
    });
  };

  const handleHeadingChange = (index, value) => {
    const temp = [...rows];
    temp[index].headingId = value;
    temp[index].answers = {};
    setRows(temp);
  };

  const handleAnswerChange = (rowIndex, questionId, answer) => {
    const temp = [...rows];
    temp[rowIndex].answers[questionId] = answer;
    setRows(temp);
  };

  const addRow = () => {
    setRows([...rows, { headingId: "", answers: {} }]);
  };

  const deleteRow = (index) => {
    if (rows.length === 1) return;
    const temp = rows.filter((_, i) => i !== index);
    setRows(temp);
  };

  const handleSubmit = () => {
    const payload = rows.map((item) => ({
      headingId: item.headingId,
      headingName: psychiatricCategories.find(c => c.id === parseInt(item.headingId))?.name || "",
      answers: item.answers,
    }));

    const finalPayload = {
      assessmentDate: new Date().toISOString(),
      categories: payload.filter(p => p.headingId),
      completedBy: sessionStorage.getItem("userId") || localStorage.getItem("userId"),
    };

    console.log("Psychiatrist Assessment Payload:", finalPayload);

    if (onSave) {
      onSave(finalPayload);
    }

    showPopup("Psychiatrist Questionnaire saved successfully!", "success");
  };

  return (
    <div className="container-fluid p-0">
      <div className="card shadow-sm" style={{ border: "none" }}>
        <div className="card-header bg-primary text-white py-2" style={{ borderRadius: "8px 8px 0 0" }}>
          <h6 className="mb-0 fw-bold">
            <i className="mdi mdi-brain me-2"></i>
            PSYCHIATRIC
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
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: "8px", verticalAlign: "middle" }}>
                        </td>
                        <td style={{ padding: "8px", textAlign: "center", verticalAlign: "middle" }}>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={addRow}
                            disabled={readOnly}
                            style={{ padding: "4px 12px" }}
                          >+
                          </button>
                        </td>
                        <td style={{ padding: "8px", textAlign: "center", verticalAlign: "middle" }}>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteRow(rowIndex)}
                            disabled={rows.length === 1 || readOnly}
                            style={{ padding: "4px 12px" }}
                          >-
                          </button>
                        </td>
                      </tr>

                      {selectedCategory && selectedCategory.questions.map((question, qIndex) => (
                        <tr key={question.id} style={{ backgroundColor: "#fafafa" }}>
                         <td style={{ padding: "10px", verticalAlign: "middle", paddingLeft: "25px" }}>
  <div className="mt-1">{question.text}</div>
</td>
                          <td colSpan="3" style={{ padding: "10px", verticalAlign: "middle" }}>
                            <select
                              className="form-select form-select-sm"
                              value={row.answers[question.id] || ""}
                              onChange={(e) => handleAnswerChange(rowIndex, question.id, e.target.value)}
                              disabled={readOnly}
                              style={{ maxWidth: "280px" }}
                            >
                              <option value="">-- Select Answer --</option>
                              {question.options.map((opt, i) => (
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

          {/* Submit Button */}
          {!readOnly && (
            <div className="text-center mt-3">
              <button className="btn btn-success btn-sm px-4" onClick={handleSubmit}>
                <i className="mdi mdi-content-save me-1"></i>
                Save
              </button>
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
};

export default Psychiatrist;