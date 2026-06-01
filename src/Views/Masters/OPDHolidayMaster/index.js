import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { MAS_OPD_HOLIDAY } from "../../../config/apiConfig";
import { getRequest, postRequest, putRequest } from "../../../service/apiService";
import {
  FETCH_HOLIDAY,
  ADD_HOLIDAY_SUCCESS,
  ADD_HOLIDAY_FAIL,
  UPDATE_HOLIDAY_SUCCESS,
  UPDATE_HOLIDAY_FAIL,
  DUPLICATE_HOLIDAY,
} from "../../../config/constants";

const OPDHolidayMaster = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    holidayDate: "",
    holidayName: "",
    remarks: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    name: "",
  });

  const formatDate = (dateString) => {
    if (!dateString?.trim()) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    return dateString.split("T")[0];
  };

  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const response = await getRequest(`${MAS_OPD_HOLIDAY}/getAll/${flag}`);
      if (response.status === 200 && response.response) {
        setData(response.response || []);
      } else {
        console.error("Unexpected API response format:", response);
        setData([]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      showPopup(FETCH_HOLIDAY, "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = (data || []).filter((rec) =>
    (rec.holidayName || "")
      .toLowerCase()
      .includes((searchQuery || "").toLowerCase()) ||
    (rec.remarks || "")
      .toLowerCase()
      .includes((searchQuery || "").toLowerCase())
  );

  const currentItems = filteredData.slice(
    (currentPage - 1) * DEFAULT_ITEMS_PER_PAGE,
    currentPage * DEFAULT_ITEMS_PER_PAGE
  );

  const validateForm = (values) => {
    return (
      values.holidayDate?.trim() !== "" &&
      values.holidayName?.trim() !== ""
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...formData, [name]: value };
    setFormData(updatedForm);
    setIsFormValid(validateForm(updatedForm));
  };

  const resetForm = () => {
    setFormData({
      holidayDate: "",
      holidayName: "",
      remarks: "",
    });
    setIsFormValid(false);
    setEditingRecord(null);
  };

  const isDuplicate = () => {
    const newName = formData.holidayName.trim().toLowerCase();
    const newDate = formData.holidayDate;
    return data.some((rec) => {
      if (editingRecord && rec.opdHolidayId === editingRecord.opdHolidayId) return false;
      return (
        (rec.holidayName || "").trim().toLowerCase() === newName &&
        rec.holidayDate === newDate
      );
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!isFormValid || saving) {
      return;
    }

    if (isDuplicate()) {
      showPopup(DUPLICATE_HOLIDAY, "error");
      return;
    }

    setSaving(true);
    
    try {
      if (editingRecord) {
        const payload = {
          holidayDate: formData.holidayDate,
          holidayName: formData.holidayName,
          remarks: formData.remarks,
        };
        const response = await putRequest(`${MAS_OPD_HOLIDAY}/update/${editingRecord.opdHolidayId}`, payload);
        
        if (response.status === 200) {
          setPopupMessage({
            message: UPDATE_HOLIDAY_SUCCESS,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              fetchData();
              setShowForm(false);
            }
          });
        } else {
          throw new Error(response.message || "Update failed");
        }
      } else {
        const payload = {
          holidayDate: formData.holidayDate,
          holidayName: formData.holidayName,
          remarks: formData.remarks,
        };
        const response = await postRequest(`${MAS_OPD_HOLIDAY}/create`, payload);
        
        if (response.status === 201 || response.status === 200) {
          setPopupMessage({
            message: ADD_HOLIDAY_SUCCESS,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              fetchData();
              setShowForm(false);
            }
          });
        } else {
          throw new Error(response.message || "Save failed");
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      showPopup(
        error.response?.data?.message || (editingRecord ? UPDATE_HOLIDAY_FAIL : ADD_HOLIDAY_FAIL),
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({
      holidayDate: formatDateForInput(rec.holidayDate),
      holidayName: rec.holidayName || "",
      remarks: rec.remarks || "",
    });
    setShowForm(true);
    setIsFormValid(true);
  };

  const handleSwitchChange = (id, currentStatus, name) => {
    const newStatus = currentStatus === "y" ? "n" : "y";
    setConfirmDialog({ isOpen: true, id, newStatus, name });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.id !== null) {
      setSaving(true);

      try {
        const response = await putRequest(
          `${MAS_OPD_HOLIDAY}/status/${confirmDialog.id}?status=${confirmDialog.newStatus}`
        );
        
        if (response.status === 200) {
          setPopupMessage({
            message: `Holiday "${confirmDialog.name}" ${
              confirmDialog.newStatus === "y" ? "activated" : "deactivated"
            } successfully!`,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              fetchData();
              setCurrentPage(1);
            },
          });
        } else {
          throw new Error(response.message || "Failed to update status");
        }
      } catch (error) {
        console.error("Status update error:", error);
        showPopup(
          confirmDialog.newStatus === "y" 
            ? "Failed to activate holiday" 
            : "Failed to deactivate holiday",
          "error"
        );
      } finally {
        setSaving(false);
      }
    }

    setConfirmDialog({
      isOpen: false,
      id: null,
      newStatus: "",
      name: "",
    });
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchData();
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">OPD Holiday Master</h4>
              <div className="d-flex align-items-center">
                {!showForm && (
                  <input
                    className="form-control w-50 me-2"
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
                      onClick={() => {
                        resetForm();
                        setShowForm(true);
                      }}
                    >
                      Add
                    </button>
                    <button className="btn btn-success flex-shrink-0" onClick={handleRefresh}>
                      Show All
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-secondary"
                    onClick={handleCancel}
                  >
                    Back
                  </button>
                )}
              </div>
            </div>

            <div className="card-body">
              {loading && !showForm && <LoadingScreen />}

              {!showForm && !loading && (
                <>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Holiday Date</th>
                          <th>Holiday Name</th>
                          <th>Remarks</th>
                          <th>Last Updated</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((rec) => (
                            <tr key={rec.opdHolidayId}>
                              <td>{formatDate(rec.holidayDate)}</td>
                              <td>{rec.holidayName}</td>
                              <td>{rec.remarks || "N/A"}</td>
                              <td>{formatDate(rec.lastUpdatedDt)}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={rec.status === "y"}
                                    onChange={() =>
                                      handleSwitchChange(rec.opdHolidayId, rec.status, rec.holidayName)
                                    }
                                    id={`switch-${rec.opdHolidayId}`}
                                  />
                                  <label
                                    className="form-check-label ms-2"
                                    htmlFor={`switch-${rec.opdHolidayId}`}
                                  >
                                    {rec.status === "y" ? "Active" : "Inactive"}
                                  </label>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleEdit(rec)}
                                  disabled={rec.status !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center">
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
                <form className="row" onSubmit={handleSave}>
                  <div className="form-group col-md-4">
                    <label>Holiday Date <span className="text-danger">*</span></label>
                    <input
                      type="date"
                      className="form-control mt-1"
                      name="holidayDate"
                      value={formData.holidayDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group col-md-4">
                    <label>Holiday Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      name="holidayName"
                      placeholder="e.g., Republic Day"
                      value={formData.holidayName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group col-md-4">
                    <label>Remarks</label>
                    <textarea
                      className="form-control mt-1"
                      name="remarks"
                      placeholder="Optional remarks"
                      rows="3"
                      value={formData.remarks}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group col-md-12 mt-3 d-flex justify-content-end">
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
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {popupMessage && (
                <Popup
                  message={popupMessage.message}
                  type={popupMessage.type}
                  onClose={popupMessage.onClose}
                />
              )}

              {confirmDialog.isOpen && (
                <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-body">
                        Are you sure you want to{" "}
                        {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                        <strong>{confirmDialog.name}</strong>?
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
      </div>
    </div>
  );
};

export default OPDHolidayMaster;