
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, {
  DEFAULT_ITEMS_PER_PAGE,
} from "../../../Components/Pagination";
 import { MAS_QUESTION_OPTION_VALUE, MAS_OPD_QUESTION,} from "../../../config/apiConfig";
import {
    getRequest,
   postRequest,
  putRequest,
 } from "../../../service/apiService";

 import {
  FETCH_OPTION_VALUE,
  CREATE_OPTION_VALUE,
  UPDATE_OPTION_VALUE ,
  SAVE_OPTION_VALUE,
  DUPLICATE_OPTION_VALUE ,
  STATUS_UPDATED,
  UPDATE_STATUS,
   STATUS,
} from "../../../config/constants";


const OptionValueMaster = () => {
  const [loading, setLoading] = useState(false);
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
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    record: null,
    newStatus: "",
  });
const [questions, setQuestions] = useState([]);

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


  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const { response } = await getRequest(
        `${MAS_QUESTION_OPTION_VALUE}/getAll/${flag}`
      );
      setData(response || []);
    } catch {
      showPopup(FETCH_OPTION_VALUE , "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

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



  // ================= SEARCH =================
  const filteredData = data.filter((rec) =>
  rec.optionCode?.toLowerCase().includes(searchQuery.toLowerCase())
);
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

   const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    setIsFormValid(
  updated.optionCode?.trim() !== "" &&
  updated.optionValue?.trim() !== "" &&
  updated.questionId !== "" &&
  updated.optionScore !== "" &&
  !isNaN(updated.optionScore)
);
     
    };

  const resetForm = () => {
    setFormData({
      optionCode: "",
      optionValue: "",
      optionScore: "",
      questionId:"",
    });
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
    if (!isFormValid) return;
    const newCode = formData.optionCode.trim().toLowerCase();
   const duplicate = data.find(
  (rec) =>
    rec.optionCode?.toLowerCase() === newCode &&
    (!editingRecord || rec.id !== editingRecord.id)
);

    if (duplicate) {
      showPopup(DUPLICATE_OPTION_VALUE , "error");
      return;
    }

    try {
      if (editingRecord) {
        await putRequest(
          `${MAS_QUESTION_OPTION_VALUE}/update/${editingRecord.id}`,
          formData
        );

        showPopup(UPDATE_OPTION_VALUE , "success");
      } else {
        await postRequest(`${MAS_QUESTION_OPTION_VALUE}/create`, {
          ...formData,
          status: "y",
        });

        showPopup(CREATE_OPTION_VALUE , "success");
      }

      fetchData();
      handleCancel();
    } catch {
      showPopup(SAVE_OPTION_VALUE, "error");
    }
  };

  // ================= EDIT =================
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

  // ================= STATUS =================
    const handleSwitchChange = (rec) => {
    setConfirmDialog({
      isOpen: true,
      record: rec,
 newStatus:
        rec.status === STATUS.ACTIVE ? STATUS.INACTIVE : STATUS.ACTIVE,    });
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
  // ================= UI =================
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        {/* HEADER */}
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Option Value Master</h4>
          <div className="d-flex">
            {!showForm && (
              <input
                type="text"
                style={{ width: "220px" }}
                className="form-control me-2"
                placeholder="Search..."
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
                        type="button"
                        className="btn btn-success me-2"
                        onClick={() => {
                          setSearchQuery("");
                          fetchData(1);
                        }}
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
          {/* ================= LIST ================= */}
          {!showForm && (
            <>
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
                            {rec.status === STATUS.ACTIVE
                            ? "Active" : "Inactive"}
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

          {/* ================= FORM ================= */}
          {showForm && (
            <form onSubmit={handleSave} className="row g-3">
              <div className="col-md-4">
                <label>
                Option  Code <span className="text-danger">*</span>
                </label>
                <input
                  name="optionCode"
                  className="form-control"
                  value={formData.optionCode}
                  onChange={handleInputChange}
                />
              </div>

              <div className="col-md-4">
                <label>
                 Option Value<span className="text-danger">*</span>
                </label>
                <input
                  name="optionValue"
                  className="form-control"
                  value={formData.optionValue}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-4">
                <label>
                 Option Score <span className="text-danger">*</span>
                </label>
                <input
                  name="optionScore"
                  type="number"
                  className="form-control"
                  value={formData.optionScore}
                  onChange={handleInputChange}
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
                  disabled={!isFormValid || loading}
                >
                  {editingRecord ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                 onClick={handleCancel}
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
                    {confirmDialog.newStatus === STATUS.ACTIVE
                      ? "activate"
                      : "deactivate"}{" "}
                    <strong>{confirmDialog.record?.optionCode}</strong></div>
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
