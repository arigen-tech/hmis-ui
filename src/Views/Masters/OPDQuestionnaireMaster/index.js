import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination"

const OPDQuestionnaireMaster = () => {
  const [data, setData] = useState([]);
  const [loading] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    question: null,
    newStatus: "",
  });

  const [formData, setFormData] = useState({
    heading: "",
    question: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ================= PAGINATION =================
  const [currentPage, setCurrentPage] = useState(1);
  const [goPage, setGoPage] = useState("");
  const itemsPerPage = 5;

  // ================= SAMPLE DATA =================
  useEffect(() => {
    setData([
      {
        heading: "Edinburgh Postnatal Depression Scale",
        question: "I have been able to laugh and see the funny side of things",
        status: "Y",
      },
      {
        heading: "Edinburgh Postnatal Depression Scale",
        question: "I have looked forward with enjoyment to things",
        status: "Y",
      },
      {
        heading: "Edinburgh Postnatal Depression Scale",
        question: "I have blamed myself unnecessarily when things went wrong",
        status: "Y",
      },
      {
        heading: "Edinburgh Postnatal Depression Scale",
        question: "I have been anxious or worried for no good reason",
        status: "Y",
      },
      {
        heading: "Edinburgh Postnatal Depression Scale",
        question: "I have felt scared or panicky for no very good reason",
        status: "N",
      },
    ]);
  }, []);

  // ================= SEARCH =================
  const filteredData = data.filter((rec) =>
    rec.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast)

  // ================= FORM =================
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const updated = { ...formData, [id]: value };
    setFormData(updated);
    setIsFormValid(updated.heading && updated.question);
  };

  const resetForm = () => {
    setFormData({ heading: "", question: "" });
    setIsFormValid(false);
  };

  // ================= SAVE =================
  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    if (editingRecord) {
      setData(data.map((rec) =>
        rec.question === editingRecord.question ? { ...rec, ...formData } : rec
      ));
      showPopup("Record updated successfully", "success");
    } else {
      setData([...data, { ...formData, status: "N" }]);
      showPopup("Record added successfully", "success");
    }

    resetForm();
    setEditingRecord(null);
    setShowForm(false);
  };

  // ================= EDIT =================
  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData(rec);
    setShowForm(true);
    setIsFormValid(true);
  };

  // ================= STATUS =================
  const handleSwitchChange = (question, newStatus) => {
    setConfirmDialog({ isOpen: true, question, newStatus });
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleConfirm = (confirmed) => {
    if (confirmed) {
      setData(data.map((rec) =>
        rec.question === confirmDialog.question
          ? { ...rec, status: confirmDialog.newStatus }
          : rec
      ));
      showPopup("Status updated successfully", "success");
    }
    setConfirmDialog({ isOpen: false, question: null, newStatus: "" });
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };


  // ================= UI =================
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>OPD QuestionNaire Master</h4>
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
                <button className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                  Add
                </button>
                <button className="btn btn-success" onClick={handleRefresh}>
                  Show All
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
          {!showForm && (
            <>
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Heading</th>
                    <th>Question</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((rec, index) => (
                    <tr key={index}>
                      <td>{rec.heading}</td>
                      <td>{rec.question}</td>
                      <td>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={rec.status === "Y"}
                            onChange={() =>
                              handleSwitchChange(
                                rec.question,
                                rec.status === "Y" ? "N" : "Y"
                              )
                            }
                          />
                          <label className="form-check-label ms-2">
                            {rec.status === "Y" ? "Active" : "Inactive"}
                          </label>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-success btn-sm"
                          disabled={rec.status !== "Y"}
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
              <div className="col-md-6">
  <label>Heading <span className="text-danger">*</span></label>
  <select
    id="heading"
    className="form-select"
    value={formData.heading}
    onChange={handleInputChange}
  >
    <option value="">Select Heading</option>
    <option value="Edinburgh Postnatal Depression Scale">Edinburgh Postnatal Depression Scale</option>
    
  </select>
</div>

              <div className="col-md-6">
  <label>Question <span className="text-danger">*</span></label>
  <select
    id="question"
    className="form-select"
    value={formData.question}
    onChange={handleInputChange}
  >
    <option value="">Select Question</option>
    {(data
      .filter((rec) => rec.heading === formData.heading)
      .map((rec) => rec.question)
      .filter((q, idx, arr) => arr.indexOf(q) === idx) 
    ).map((q) => (
      <option key={q} value={q}>
        {q}
      </option>
    ))}
  </select>
</div>

              <div className="col-12 text-end">
                <button className="btn btn-primary me-2" disabled={!isFormValid}>Save</button>
                <button type="button" className="btn btn-danger" onClick={() => setShowForm(false)}>Cancel</button>
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
                    {confirmDialog.newStatus === "Y" ? "activate" : "deactivate"}{" "}
                    <strong>{confirmDialog.question}</strong>?
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => handleConfirm(false)}>No</button>
                    <button className="btn btn-primary" onClick={() => handleConfirm(true)}>Yes</button>
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
