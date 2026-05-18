import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
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
    record: null,
    newStatus: "",
  });

  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE;

  const formatDate = (dateString) => {
    if (!dateString?.trim()) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    return dateString.split("T")[0];
  };

  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const { response } = await getRequest(`${MAS_OPD_HOLIDAY}/getAll/${flag}`);
      setData(response || []);
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
      .includes((searchQuery || "").toLowerCase()) ||
    (rec.createdBy || "")
      .toLowerCase()
      .includes((searchQuery || "").toLowerCase())
  );

  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
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
    if (!isFormValid) return;

    if (isDuplicate()) {
      showPopup(DUPLICATE_HOLIDAY, "error");
      return;
    }

    setLoading(true);
    try {
      if (editingRecord) {
        const payload = {
          holidayDate: formData.holidayDate,
          holidayName: formData.holidayName,
          remarks: formData.remarks,
        };
        await putRequest(`${MAS_OPD_HOLIDAY}/update/${editingRecord.opdHolidayId}`, payload);
        showPopup(UPDATE_HOLIDAY_SUCCESS, "success");
      } else {
        const payload = {
          holidayDate: formData.holidayDate,
          holidayName: formData.holidayName,
          remarks: formData.remarks,
        };
        await postRequest(`${MAS_OPD_HOLIDAY}/create`, payload);
        showPopup(ADD_HOLIDAY_SUCCESS, "success");
      }
      await fetchData();
      handleCancel();
    } catch (error) {
      console.error("Save error:", error);
      showPopup(editingRecord ? UPDATE_HOLIDAY_FAIL : ADD_HOLIDAY_FAIL, "error");
    } finally {
      setLoading(false);
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

  const handleStatusChange = (rec) => {
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

    try {
      setLoading(true);
      await putRequest(
        `${MAS_OPD_HOLIDAY}/status/${confirmDialog.record.opdHolidayId}?status=${confirmDialog.newStatus}`
      );

      const successMsg =
        confirmDialog.newStatus === "y"
          ? "Holiday activated successfully!"
          : "Holiday deactivated successfully!";
      showPopup(successMsg, "success");

      fetchData();
    } catch (error) {
      console.error("Status update error:", error);
      const errorMsg =
        confirmDialog.newStatus === "y"
          ? "Failed to activate holiday"
          : "Failed to deactivate holiday";
      showPopup(errorMsg, "error");
    } finally {
      setLoading(false);
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
    }
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleCancel = () => {
    resetForm();
    setEditingRecord(null);
    setShowForm(false);
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchData(1);
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">OPD Holiday Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm ? (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search"
                        aria-label="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <span className="input-group-text" id="search-icon">
                        <i className="fa fa-search"></i>
                      </span>
                    </div>
                  </form>
                ) : (
                  <></>
                )}
                <div className="d-flex align-items-center ms-auto">
                  {!showForm ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={() => setShowForm(true)}
                        disabled={loading}
                      >
                        <i className="mdi mdi-plus"></i> Add
                      </button>
                      <button
                        type="button"
                        className="btn btn-success me-2 flex-shrink-0"
                        onClick={handleRefresh}
                        disabled={loading}
                      >
                        <i className="mdi mdi-refresh"></i> Show All
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      <i className="mdi mdi-arrow-left"></i> Back
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="card-body">
              {!showForm ? (
                <>
                  {loading && <div className="text-center">Loading...</div>}
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Holiday Date</th>
                          <th>Holiday Name</th>
                          <th>Remarks</th>
                          <th>Created By</th>
                          <th>Last Update</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.map((rec) => (
                          <tr key={rec.opdHolidayId}>
                            <td>{formatDate(rec.holidayDate)}</td>
                            <td>{rec.holidayName}</td>
                            <td>{rec.remarks || "N/A"}</td>
                            <td>{rec.createdBy || "N/A"}</td>
                            <td>{formatDate(rec.lastUpdatedDt)}</td>
                            <td>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={rec.status === "y"}
                                  onChange={() => handleStatusChange(rec)}
                                  id={`switch-${rec.opdHolidayId}`}
                                  disabled={loading}
                                />
                                <label className="form-check-label px-0" htmlFor={`switch-${rec.opdHolidayId}`}>
                                  {rec.status === "y" ? "Active" : "Inactive"}
                                </label>
                              </div>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleEdit(rec)}
                                disabled={rec.status !== "y" || loading}
                              >
                                <i className="fa fa-pencil"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredData.length > 0 && (
                    <Pagination
                      totalItems={filteredData.length}
                      itemsPerPage={itemsPerPage}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                  {filteredData.length === 0 && !loading && (
                    <div className="text-center mt-3">No records found</div>
                  )}
                </>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="row">
                    <div className="form-group col-md-4">
                      <label>Holiday Date *</label>
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
                      <label>Holiday Name *</label>
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
                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid || loading}
                    >
                      {loading ? "Saving..." : editingRecord ? "Update" : "Save"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {popupMessage && <Popup {...popupMessage} />}
            </div>
          </div>
        </div>
      </div>

      {confirmDialog.isOpen && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Status Change</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => handleConfirm(false)}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to{" "}
                  {confirmDialog.newStatus === "y" ? "activate" : "deactivate"} this record?
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleConfirm(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleConfirm(true)}
                  disabled={loading}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OPDHolidayMaster;