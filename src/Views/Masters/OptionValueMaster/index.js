import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const OptionValueMaster = () => {
  const [data, setData] = useState([]);
  const [loading] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    optionCode: ""
  });

  const [formData, setFormData] = useState({
    heading: "",
    question: "",
    optionName: "",
    optionCode: "",
    score: ""
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

  // ================= DROPDOWN DATA =================
  const headingOptions = [
    "Depression Screener",
    "Anxiety Screener"
  ];

  const questionOptions = {
    "Depression Screener": [
      "Feeling down, depressed, or hopeless",
      "Little interest or pleasure in doing things"
    ],
    "Anxiety Screener": [
      "Feeling nervous, anxious or on edge",
      "Not being able to stop worrying"
    ]
  };

  // ================= SAMPLE DATA =================
  useEffect(() => {
    setData([
      {
        id: 1,
        heading: "Depression Screener",
        question: "Feeling down, depressed, or hopeless",
        optionName: "Not at all",
        optionCode: "BN",
        score: 0,
        status: "Y"
      },
      {
        id: 2,
        heading: "Depression Screener",
        question: "Feeling down, depressed, or hopeless",
        optionName: "Several days",
        optionCode: "BN1",
        score: 1,
        status: "Y"
      },
      {
        id: 3,
        heading: "Anxiety Screener",
        question: "Feeling nervous, anxious or on edge",
        optionName: "More than half the days",
        optionCode: "AN2",
        score: 2,
        status: "Y"
      },
      {
        id: 4,
        heading: "Anxiety Screener",
        question: "Not being able to stop worrying",
        optionName: "Nearly every day",
        optionCode: "AN3",
        score: 3,
        status: "Y"
      },
      {
        id: 4,
        heading: "Anxiety Screener",
        question: "Not being able to stop worrying",
        optionName: "Nearly every day",
        optionCode: "AN3",
        score: 3,
        status: "Y"
      },
      {
        id: 4,
        heading: "Anxiety Screener",
        question: "Not being able to stop worrying",
        optionName: "Nearly every day",
        optionCode: "AN3",
        score: 3,
        status: "Y"
      }
    ]);
  }, []);

  // ================= SEARCH =================
  const filteredData = data.filter((rec) =>
    rec.optionCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

 const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast)


  // ================= FORM =================
  const handleInputChange = (e) => {
    const { id, value } = e.target;

    let updated = { ...formData, [id]: value };

    if (id === "heading") {
      updated.question = "";
    }

    setFormData(updated);

    setIsFormValid(
      updated.heading &&
      updated.question &&
      updated.optionName &&
      updated.optionCode &&
      updated.score !== ""
    );
  };

  const resetForm = () => {
    setFormData({
      heading: "",
      question: "",
      optionName: "",
      optionCode: "",
      score: ""
    });
    setIsFormValid(false);
  };

  // ================= SAVE =================
  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    if (editingRecord) {
      setData(data.map((rec) =>
        rec.id === editingRecord.id ? { ...rec, ...formData } : rec
      ));
      showPopup("Record updated successfully", "success");
    } else {
      setData([
        ...data,
        {
          id: Date.now(),
          ...formData,
          status: "Y"
        }
      ]);
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
  const handleSwitchChange = (id, newStatus, optionCode) => {
    setConfirmDialog({ isOpen: true, id, newStatus, optionCode });
  };
const handleRefresh = () => {
  setSearchQuery("");
  setCurrentPage(1);
};

  const handleConfirm = (confirmed) => {
    if (confirmed) {
      setData(data.map((rec) =>
        rec.id === confirmDialog.id
          ? { ...rec, status: confirmDialog.newStatus }
          : rec
      ));
      showPopup("Status updated successfully", "success");
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "", optionCode: "" });
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
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

          {/* ================= LIST ================= */}
          {!showForm && (
            <>
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Heading</th>
                    <th>Question</th>
                    <th>Option</th>
                    <th>Code</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((rec) => (
                    <tr key={rec.id}>
                      <td>{rec.heading}</td>
                      <td>{rec.question}</td>
                      <td>{rec.optionName}</td>
                      <td>{rec.optionCode}</td>
                      <td>{rec.score}</td>
                       <td>
                <div className="form-check form-switch">
                <input
                className="form-check-input"
                type="checkbox"
                checked={rec.status === "Y"}
                onChange={() =>
                handleSwitchChange(
                rec.id,
                rec.status === "Y" ? "N" : "Y",
               rec.optionCode
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
              <div className="col-md-4">
                <label>Heading <span className="text-danger">*</span></label>
                <select id="heading" className="form-select" value={formData.heading} onChange={handleInputChange}>
                  <option value="">Select</option>
                  {headingOptions.map(h => <option key={h}>{h}</option>)}
                </select>
              </div>

              <div className="col-md-4">
                <label>Question <span className="text-danger">*</span></label>
                <select
                  id="question"
                  className="form-select"
                  value={formData.question}
                  onChange={handleInputChange}
                 
                >
                  <option value="">Select</option>
                  {(questionOptions[formData.heading] || []).map(q => (
                    <option key={q}>{q}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label>Option Name <span className="text-danger">*</span></label>
                <input id="optionName" className="form-control" value={formData.optionName} onChange={handleInputChange} />
              </div>

              <div className="col-md-4">
                <label>Option Code <span className="text-danger">*</span></label>
                <input id="optionCode" className="form-control" value={formData.optionCode} onChange={handleInputChange} />
              </div>

              <div className="col-md-4">
                <label>Score <span className="text-danger">*</span></label>
                <input id="score" type="number" className="form-control" value={formData.score} onChange={handleInputChange} />
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
                     <strong>{confirmDialog.optionCode}</strong>?
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

export default OptionValueMaster;
