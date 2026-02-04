import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import axios from "axios";
import { API_HOST, ENT_MAS_TM_STATUS } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import {
  FETCH_DATA_ERR_MSG,
  DUPLICATE_TM_STATUS,
  UPDATE_TM_STATUS_SUCC_MSG,
  ADD_TM_STATUS_SUCC_MSG,
  FAIL_TO_SAVE_CHANGES
} from "../../../config/constants";

const EarTmStatusMaster = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, recordId: null, newStatus: null });

  const [formData, setFormData] = useState({
    tmStatus: "",
    status: "y",
  });

  const TM_STATUS_MAX_LENGTH = 50;

  useEffect(() => {
    fetchData(0);
  }, []);

  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const response = await getRequest(`${ENT_MAS_TM_STATUS}/getAll/${flag}`);
      if (response && response.response) {
        setData(response.response);
      }
    } catch (err) {
      console.error("Error fetching TM Status data:", err);
      showPopup(FETCH_DATA_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      },
    });
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const filteredData = data.filter((rec) =>
    rec.tmStatus.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchData();
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const updatedData = { ...formData, [id]: value };
    setFormData(updatedData);
    setIsFormValid(updatedData.tmStatus.trim() !== "");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setLoading(true);
    try {
      // Check for duplicate
      const isDuplicate = data.some(
        (record) =>
          record.id !== (editingRecord ? editingRecord.id : null) &&
          record.tmStatus === formData.tmStatus
      );

      if (isDuplicate) {
        showPopup(DUPLICATE_TM_STATUS, "error");
        setLoading(false);
        return;
      }

      if (editingRecord) {
        // Update existing record
        const response = await putRequest(`${ENT_MAS_TM_STATUS}/update/${editingRecord.id}`, {
          tmStatus: formData.tmStatus,
          status: editingRecord.status, // Keep existing status when editing
        });

        if (response && response.status === 200) {
          fetchData();
          showPopup(UPDATE_TM_STATUS_SUCC_MSG, "success");
        }
      } else {
        // Add new record
        const response = await postRequest(`${ENT_MAS_TM_STATUS}/create`, {
          tmStatus: formData.tmStatus,
          status: "y",
        });

        if (response && response.status === 200 || response && response.status === 201) {
          fetchData();
          showPopup(ADD_TM_STATUS_SUCC_MSG, "success");
        }
      }

      resetForm();
    } catch (err) {
      console.error("Error saving TM Status:", err);
      showPopup(FAIL_TO_SAVE_CHANGES, "error");
      setLoading(false);
    }
  };

  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({
      tmStatus: rec.tmStatus,
      status: rec.status,
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, recordId: id, newStatus });
  };

  const handleConfirmStatusChange = async (confirmed) => {
    if (confirmed && confirmDialog.recordId !== null) {
      setLoading(true);
      try {
        const response = await putRequest(
          `${ENT_MAS_TM_STATUS}/status/${confirmDialog.recordId}?status=${confirmDialog.newStatus}`
        );
        if (response && response.status === 200) {
          fetchData();
          showPopup(
            `TM Status ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
            "success"
          );
        }
      } catch (err) {
        console.error("Error updating status:", err);
        showPopup(`Failed to update status: ${err.response?.data?.message || err.message}`, "error");
        setLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, recordId: null, newStatus: null });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      // Format as YYYY-MM-DD
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid Date';
    }
  };

  const resetForm = () => {
    setFormData({
      tmStatus: "",
      status: "y",
    });
    setEditingRecord(null);
    setShowForm(false);
    setIsFormValid(false);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title">Ear Tympanic Membrane Status Master</h4>
          <div className="d-flex align-items-center">
            {!showForm ? (
              <form className="d-inline-block searchform me-4" role="search">
                <div className="input-group searchinput">
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search TM Status"
                    aria-label="Search"
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                  <span className="input-group-text" id="search-icon">
                    <i className="fa fa-search"></i>
                  </span>
                </div>
              </form>
            ) : (
              <></>
            )}
            <div className="d-flex align-items-center">
              {!showForm ? (
                <>
                  <button
                    type="button"
                    className="btn btn-success me-2"
                    onClick={() => {
                      setEditingRecord(null);
                      setFormData({ tmStatus: "", status: "y" });
                      setIsFormValid(false);
                      setShowForm(true);
                    }}
                  >
                    <i className="mdi mdi-plus"></i> Add
                  </button>
                  <button
                    type="button"
                    className="btn btn-success me-2 flex-shrink-0"
                    onClick={handleRefresh}
                  >
                    <i className="mdi mdi-refresh"></i> Show All
                  </button>
                </>
              ) : (
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  <i className="mdi mdi-arrow-left"></i> Back
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="card-body">
          {!showForm ? (
            <>
              <div className="table-responsive packagelist">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>TM Status</th>
                      <th>Last Update Date</th>
                      <th>Status</th>
                      <th>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length ? (
                      currentItems.map((rec) => (
                        <tr key={rec.id}>
                          <td>{rec.tmStatus}</td>
                          <td>{formatDate(rec.lastUpdateDate)}</td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={rec.status === "y"}
                                onChange={() => handleSwitchChange(rec.id, rec.status === "y" ? "n" : "y")}
                                id={`switch-${rec.id}`}
                              />
                              <label
                                className="form-check-label px-0"
                                htmlFor={`switch-${rec.id}`}
                              >
                                {rec.status === "y" ? "Active" : "Deactivated"}
                              </label>
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleEdit(rec)}
                              disabled={rec.status !== "y"}
                            >
                              <i className="fa fa-pencil"></i>
                            </button>
                          </td>
                        </tr>
                      ))) : (
                      <tr>
                        <td colSpan="4" className="text-center">
                          No record found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              {filteredData.length > 0 && (
                <Pagination
                  totalItems={filteredData.length}
                  itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          ) : (
            <form className="row" onSubmit={handleSave}>
              <div className="form-group col-md-4">
                <label>
                  TM Status <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  id="tmStatus"
                  className="form-control mt-1"
                  placeholder="Enter TM Status"
                  value={formData.tmStatus}
                  onChange={handleInputChange}
                  maxLength={TM_STATUS_MAX_LENGTH}
                  required
                />
              </div>

              <div className="form-group col-md-12 mt-3 d-flex justify-content-end">
                <button
                  className="btn btn-primary me-2"
                  type="submit"
                  disabled={!isFormValid}
                >
                  Save
                </button>
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {popupMessage && <Popup {...popupMessage} />}

          {confirmDialog.isOpen && (
            <div className="modal d-block" tabIndex="-1" role="dialog">
              <div className="modal-dialog" role="document">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Confirm Status Change</h5>
                    <button type="button" className="close" onClick={() => handleConfirmStatusChange(false)}>
                      <span>&times;</span>
                    </button>
                  </div>
                  <div className="modal-body">
                    <p>
                      Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                      <strong>
                        {data.find((rec) => rec.id === confirmDialog.recordId)?.tmStatus}
                      </strong>
                      ?
                    </p>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => handleConfirmStatusChange(false)}>
                      No
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => handleConfirmStatusChange(true)}>
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

export default EarTmStatusMaster;