
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import axios from "axios";
import { API_HOST, MAS_TONSIL_GRADE } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading";
import { getRequest, postRequest, putRequest } from "../../../service/apiService";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import {FETCH_ENTMAS,DUPLICATE_ENTMAS,UPDATE_ENTMAS,ADD_ENTMAS,FAIL_ENTMAS,UPDATE_FAIL_ENTMAS,} from "../../../config/constants";




const EntMasTonsilGradeMaster = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({ tonsilGrade: "", status: "Y" });
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, recordId: null, newStatus: null });
  const itemsPerPage = 4;

  const TONSILGRADE_CODE_MAX_LENGTH = 10;



  
  const fetchRecords = async (flag = 0) => {
    setLoading(true);
    try {
      const response = await getRequest(`${MAS_TONSIL_GRADE}/getAll/${flag}`);
      if (response && response.response) {
        const formatted = response.response.map((rec) => ({
          id: rec.id,
          tonsilGrade: rec.tonsilGrade,
          status: rec.status.toLowerCase(),
          lastUpdateDate: rec.lastUpdateDate ? rec.lastUpdateDate.replace("T", " ").split(".")[0] : "",
        }));
        formatted.sort((a, b) => (a.status === "y" && b.status === "n" ? -1 : 1));
        setRecords(formatted);
      }
    } catch (err) {
      console.error(err);
      showPopup(FETCH_ENTMAS, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const showPopup = (message, type = "info") => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // new

  const filteredRecords = records.filter((r) =>
    r.tonsilGrade.toLowerCase().includes(searchQuery.toLowerCase())
  );



  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredRecords.slice(indexOfFirst, indexOfLast);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const updated = { ...formData, [id]: value };
    setFormData(updated);
    setIsFormValid(updated.tonsilGrade.trim() !== "");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const newValue = formData.tonsilGrade.trim().toLowerCase();

    const duplicate = records.find((rec) =>
      rec.tonsilGrade.toLowerCase() === newValue &&
      (!editingRecord || rec.id !== editingRecord.id)
    );

    if (duplicate) {
      showPopup(DUPLICATE_ENTMAS, "error");
      return;
    }


    setLoading(true);

    try {
      if (editingRecord) {
        await putRequest(`${MAS_TONSIL_GRADE}/update/${editingRecord.id}`, {
          tonsilGrade: formData.tonsilGrade,
          status: formData.status,
        });
        showPopup(UPDATE_ENTMAS, "success");
      } else {
        await postRequest(`${MAS_TONSIL_GRADE}/create`, {
          tonsilGrade: formData.tonsilGrade,
          status: formData.status,
        });
        showPopup(ADD_ENTMAS, "success");
      }
      fetchRecords();
      resetForm();
    } catch (err) {
      console.error(err);
      showPopup(FAIL_ENTMAS, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({ tonsilGrade: record.tonsilGrade, status: record.status });
    setIsFormValid(true);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ tonsilGrade: "", status: "Y" });
    setEditingRecord(null);
    setShowForm(false);
    setIsFormValid(false);
  };

  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, recordId: id, newStatus });
  };

  const handleConfirmStatusChange = async (confirmed) => {
    if (!confirmed || !confirmDialog.recordId) {
      setConfirmDialog({ isOpen: false, recordId: null, newStatus: null });
      return;
    }
    try {
      await putRequest(`${MAS_TONSIL_GRADE}/status/${confirmDialog.recordId}?status=${confirmDialog.newStatus}`);
      showPopup(confirmDialog.newStatus === "y" ? "Activated successfully!" : "Deactivated successfully!", "success");
      fetchRecords();
    } catch (err) {
      console.error(err);
      showPopup(UPDATE_FAIL_ENTMAS, "error");
    } finally {
      setConfirmDialog({ isOpen: false, recordId: null, newStatus: null });
    }
  };



  if (loading) return <LoadingScreen />;

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Tonsil Grade Master</h4>
              <div className="d-flex align-items-center">
                {!showForm && (
                  <input
                    type="text"
                    className="form-control w-50 me-2"
                    placeholder="Search Tonsil Grade"
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                )}
                {!showForm ? (
                  <button className="btn btn-success" onClick={() => setShowForm(true)}>Add</button>
                ) : (
                  <button className="btn btn-secondary" onClick={resetForm}>Back</button>
                )}
              </div>
            </div>
            <div className="card-body">
              {!showForm ? (
                <>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Tonsil Grade</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length ? currentItems.map((rec, idx) => (
                          <tr key={rec.id} className={rec.status !== "y" ? "table-secondary" : ""}>
                            <td>{rec.tonsilGrade}</td>
                            <td>
                              <div className="form-check form-switch">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={rec.status === "y"}
                                  onChange={() => handleSwitchChange(rec.id, rec.status === "y" ? "n" : "y")}
                                />
                                <label className="form-check-label">
                                  {rec.status === "y" ? "Active" : "Deactivated"}
                                </label>
                              </div>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleEdit(rec)}
                                disabled={rec.status !== "y"}
                              >
                                <i className="fa fa-pencil"></i>
                              </button>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan="3" className="text-center">No records found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {filteredRecords.length > 0 && (
                    <Pagination
                      totalItems={filteredRecords.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}

                </>
              ) : (
                <form className="row" onSubmit={handleSave}>
                  <div className="form-group col-md-6 mt-3">
                    <label>Tonsil Grade <span className="text-danger">*</span></label>
                    <input type="text" id="tonsilGrade" className="form-control" value={formData.tonsilGrade} onChange={handleInputChange} maxLength={TONSILGRADE_CODE_MAX_LENGTH} required />
                  </div>
                  <div className="form-group col-md-12 mt-3 d-flex justify-content-end">
                    <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>Save</button>
                    <button type="button" className="btn btn-danger" onClick={resetForm}>Cancel</button>
                  </div>
                </form>
              )}

              {popupMessage && <Popup {...popupMessage} />}

              {confirmDialog.isOpen && (
                <div className="modal d-block">
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                      </div>
                      <div className="modal-body">
                        Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                        <strong>{records.find(r => r.id === confirmDialog.recordId)?.tonsilGrade}</strong>?
                      </div>
                      <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={() => handleConfirmStatusChange(false)}>No</button>
                        <button className="btn btn-primary" onClick={() => handleConfirmStatusChange(true)}>Yes</button>
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

export default EntMasTonsilGradeMaster;



