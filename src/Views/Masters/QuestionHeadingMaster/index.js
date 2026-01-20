
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_QUESTION_HEADING } from "../../../config/apiConfig";
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";


const QuestionHeadingMaster = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ questionHeadingCode: "", questionHeadingName: "" });
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ================= PAGINATION =================
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE;

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    record: null,
    newStatus: ""
  });

  const MAX_CODE_LENGTH = 8;

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
      showPopup("Failed to fetch records", "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= SEARCH =================
  const filteredData = data.filter(rec =>
    (rec?.questionHeadingCode ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (rec?.questionHeadingName ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );
    const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast)

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
  };

  const handleCancel = () => {
    resetForm();
    setEditingRecord(null);
    setShowForm(false);
  };

  // ================= SAVE =================
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

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
      showPopup("Question Heading Code already exists!", "error");
      return;
    }

    try {
      if (editingRecord) {
        const recordId = editingRecord.id || editingRecord.questionHeadingId || editingRecord._id;

        if (!recordId) {
          showPopup("Invalid record ID", "error");
          return;
        }

        const updateData = {
          questionHeadingCode: trimmedCode,
          questionHeadingName: trimmedName,
        };

        await putRequest(`${MAS_QUESTION_HEADING}/update/${recordId}`, updateData);
        showPopup("Record updated successfully", "success");
      } else {
        const response =await postRequest(`${MAS_QUESTION_HEADING}/create`, {
          questionHeadingCode: trimmedCode,
          questionHeadingName: trimmedName,
          status: "y",
        });
        if(response && response.response&&response.status===200 ){
          console.log(response);
          
          showPopup("Record added successfully", "success");
        }else{
          showPopup("Save failed. Please try again.", "error");
        }
        
      }

      fetchData();
      handleCancel();

    } catch (err) {
      console.error("Save error:", err);
      showPopup("Save failed. Please try again.", "error");
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

  const handleSwitchChange = (rec) => {
    setConfirmDialog({
      isOpen: true,
      record: rec,
      newStatus: rec.status === "y" ? "n" : "y",
    });
  };

  const handleConfirm = async (confirmed) => {
    if (!confirmed) {
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
      return;
    }

    const { record, newStatus } = confirmDialog;
    
    const recordId = record?.id || record?.questionHeadingId || record?._id;
    
    if (!recordId) {
      showPopup("Invalid record ID", "error");
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
      return;
    }

    try {
      setLoading(true);
      
      await putRequest(`${MAS_QUESTION_HEADING}/status/${recordId}?status=${newStatus}`);
      
      showPopup(`Status ${newStatus === "y" ? "activated" : "deactivated"} successfully`, "success");
      
      fetchData();
      
    } catch (error) {
      console.error("Status update error:", error);
      showPopup("Status update failed", "error");
    } finally {
      setLoading(false);
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
    }
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchData();
  };

  // ================= UI =================
  return (
    <div className="content-wrapper">
      {loading && <LoadingScreen />}
      
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Question Heading Master</h4>
          <div className="d-flex">
            {!showForm && (
              <input
                type="text"
                style={{ width: "220px" }}
                className="form-control me-2"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            )}

            {!showForm ? (
              <>
                <button className="btn btn-success me-2" onClick={() => { resetForm(); setShowForm(true); setEditingRecord(null); }}>Add</button>
                <button className="btn btn-success" onClick={handleRefresh}>Show All</button>
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
                              onChange={() => handleSwitchChange(rec)}
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
                      <td colSpan="5" className="text-center">No records found</td>
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
                  className="form-control"
                  value={formData.questionHeadingCode}
                  onChange={handleInputChange}
                  maxLength={MAX_CODE_LENGTH}
                  required
                />
              </div>

              <div className="col-md-4">
                <label>Name <span className="text-danger">*</span></label>
                <input
                  name="questionHeadingName"
                  className="form-control"
                  value={formData.questionHeadingName}
                  onChange={handleInputChange}
                  maxLength={MAX_CODE_LENGTH}
                  required
                />
              </div>

              <div className="col-12 text-end">
                <button className="btn btn-primary me-2" disabled={!isFormValid}>
                  Save
                </button>
                <button type="button" className="btn btn-danger" onClick={handleCancel}>Cancel</button>
              </div>
            </form>
          )}

          {/* Popup for messages */}
          {popupMessage && <Popup {...popupMessage} />}

          {/* Confirmation Modal for Status Change */}
          {confirmDialog.isOpen && (
            <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Confirm Status Change</h5>
                  </div>
                  <div className="modal-body">
                    Are you sure you want to{" "}
                    {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                    <strong>{confirmDialog.record?.questionHeadingCode}</strong>?
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

export default QuestionHeadingMaster;