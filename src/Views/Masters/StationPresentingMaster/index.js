
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_STATION_PRESENTATION } from "../../../config/apiConfig";
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import {FETCH_STATION_PRESENTING,DUPLICATE_STATION_PRESENTING,UPDATE_STATION_PRESENTING,ADD_STATION_PRESENTING,FAIL_STATION_PRESENTING,FAIL_UPDATE_STATION_PRESENTING} from  "../../../config/constants";

const StationPresentingMaster = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    record: null, 
    newStatus: "",
  });

  const [formData, setFormData] = useState({
    stationValue: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ================= PAGINATION =================
  const [currentPage, setCurrentPage] = useState(1);

  const MAX_LENGTH = 8; 



  // Format date
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
      const { response } = await getRequest(`${MAS_STATION_PRESENTATION}/getAll/${flag}`);
      setData(response || []);
    } catch (error) {
      showPopup(FETCH_STATION_PRESENTING, "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= SEARCH =================
  const filteredData = data.filter((rec) =>
    (rec?.stationValue ?? "").toLowerCase().includes(searchQuery.toLowerCase()) 
  );

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

  // ================= FORM =================
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const updated = { ...formData, [id]: value };
    setFormData(updated);
    setIsFormValid(value.trim() !== ""); 
  };

  const resetForm = () => {
    setFormData({ stationValue: "" });
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

    const newValue = formData.stationValue.trim().toLowerCase();
    const duplicate = data.find(
      (rec) =>
        rec.stationValue?.trim().toLowerCase() === newValue &&
        (!editingRecord || rec.id !== editingRecord.id)
    );

    if (duplicate) {
      showPopup(DUPLICATE_STATION_PRESENTING, "error"); 
      return;
    }

    try {
      if (editingRecord) {
        await putRequest(`${MAS_STATION_PRESENTATION}/update/${editingRecord.id}`, {
          ...editingRecord,
          stationValue: formData.stationValue.trim(),
        });
        showPopup(UPDATE_STATION_PRESENTING, "success");
      } else {
        await postRequest(`${MAS_STATION_PRESENTATION}/create`, {
          stationValue: formData.stationValue.trim(),
        });
        showPopup(ADD_STATION_PRESENTING, "success");
      }
      fetchData();
      handleCancel();
    } catch (error) {
      showPopup(FAIL_STATION_PRESENTING, "error");
    }
  };

  // ================= EDIT =================
  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({ stationValue: rec.stationValue || "" }); 
    setShowForm(true);
    setIsFormValid(true);
  };

  // ================= STATUS =================
  const handleSwitchChange = (rec) => {
    setConfirmDialog({
      isOpen: true,
      record: rec, // Fixed: pass the entire record
      newStatus: rec.status?.toLowerCase() === "y" ? "n" : "y",
    });
  };

  const handleConfirm = async (confirmed) => {
    if (!confirmed) {
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
      return;
    }
    
    if (!confirmDialog.record) return;

    try {
      setLoading(true);
      await putRequest(
        `${MAS_STATION_PRESENTATION}/status/${confirmDialog.record.id}?status=${confirmDialog.newStatus}`
      );
      showPopup(UPDATE_STATION_PRESENTING, "success");
      fetchData();
    } catch (error) {
      showPopup(FAIL_UPDATE_STATION_PRESENTING, "error");
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
    fetchData(); // Added to refresh data
  };

  // ================= UI =================
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Station Presenting Master</h4>

          <div className="d-flex">
            {!showForm && (
              <input
                type="text"
                style={{ width: "220px" }}
                className="form-control me-2"
                placeholder="Search"
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
                  onClick={() => { resetForm(); setShowForm(true); }}
                >
                  Add
                </button>
                <button className="btn btn-success" onClick={handleRefresh}>
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
          {loading ? (
            <LoadingScreen />
          ) : !showForm ? (
            <>
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Station Value</th> 
                    <th>Last Update Date</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((rec) => (
                      <tr key={rec.id}>
                        <td>{rec.stationValue}</td>
                        <td>{formatDate(rec.lastUpdateDate)}</td>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={rec.status?.toLowerCase() === "y"}
                              onChange={() => handleSwitchChange(rec)}
                            />
                            <label className="form-check-label ms-2">
                              {rec.status?.toLowerCase() === "y" ? "Active" : "Inactive"}
                            </label>
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn btn-success btn-sm"
                            disabled={rec.status?.toLowerCase() !== "y"} 
                            onClick={() => handleEdit(rec)}
                          >
                            <i className="fa fa-pencil"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center">
                        No records found
                      </td>
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
          ) : (
            <form onSubmit={handleSave} className="row g-3">
              <div className="col-md-5">
                <label>
                  Station Presenting Name <span className="text-danger">*</span>
                </label>
                <input
                  id="stationValue" // Fixed: Changed to stationValue to match state
                  className="form-control"
                  value={formData.stationValue}
                  onChange={handleInputChange}
                  maxLength={MAX_LENGTH}
                  autoFocus
                />
              </div>

              <div className="col-12 text-end">
                <button
                  type="submit"
                  className="btn btn-primary me-2"
                  disabled={!isFormValid}
                >
                  Save
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
            <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Confirm Status Change</h5>
                  </div>
                  <div className="modal-body">
                    Are you sure you want to{" "}
                    {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                    <strong>{confirmDialog.record?.stationValue}</strong>? {/* Fixed */}
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

export default StationPresentingMaster;