import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, postRequest, putRequest } from "../../../service/apiService";
import { MAS_OT_SCHEDULE_CHANGE_REASON } from "../../../config/apiConfig";
import {
  FETCH_OT_SCHEDULE_CHANGE_REASON,
  ADD_OT_SCHEDULE_CHANGE_REASON,
  UPDATE_OT_SCHEDULE_CHANGE_REASON,
  UPDATE_STATUS_OT_SCHEDULE_CHANGE_REASON,
  FAIL_OT_SCHEDULE_CHANGE_REASON,
  DUPLICATE_OT_SCHEDULE_CHANGE_REASON,
  UPDATE_FAIL_OT_SCHEDULE_CHANGE_REASON,
  FETCH_OT_SCHEDULE_CHANGE_REASON_DETAIL,
} from "../../../config/constants";

const OTScheduleChangeReasonMaster = () => {
  // ----- State -----
  const [formData, setFormData] = useState({
    reason: "",
    applicableFor: ""
  });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    name: ""
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [process, setProcess] = useState(false);

  // ----- Constants for validation -----
  const REASON_MAX_LENGTH = 255;

  // ----- Fetch data (flag=0 = all) -----
  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const { response } = await getRequest(`${MAS_OT_SCHEDULE_CHANGE_REASON}/getAll/${flag}`);
      setData(response || []);
    } catch (error) {
      console.error("Fetch error:", error);
      showPopup(FETCH_OT_SCHEDULE_CHANGE_REASON, "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ----- Form validation -----
  useEffect(() => {
    const { reason, applicableFor } = formData;
    setIsFormValid(reason.trim() !== "" && applicableFor !== "");
  }, [formData]);

  // ----- Filtered data -----
  const filteredData = data.filter(item =>
    item.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.applicableFor?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ----- Pagination -----
  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page) => setCurrentPage(page);

  // ----- Handlers -----
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const resetForm = () => {
    setEditingItem(null);
    setShowForm(false);
    setFormData({ reason: "", applicableFor: "" });
    setPopupMessage(null);
  };

  const handleCancel = () => resetForm();

  // ----- Edit -----
  // Pulls the record fresh via GET /master/masOtScheduleChangeReason/getById/{id}
  // on the primary key (reasonId) rather than trusting the locally cached
  // row, so the form always reflects the latest server state.
  const handleEdit = async (item) => {
    setProcess(true);
    try {
      const { response } = await getRequest(`${MAS_OT_SCHEDULE_CHANGE_REASON}/getById/${item.reasonId}`);
      const record = response || item;

      setEditingItem(record);
      setFormData({
        reason: record.reason || "",
        applicableFor: record.applicableFor || "",
      });
      setShowForm(true);
    } catch (error) {
      console.error("Fetch by id error:", error);
      showPopup(FETCH_OT_SCHEDULE_CHANGE_REASON_DETAIL, "error");
    } finally {
      setProcess(false);
    }
  };

  // ----- Save (Add / Update) -----
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setProcess(true);

    // Check duplicate (same reason text + applicable-for combination)
    const duplicate = data.find(
      (rec) =>
        rec.reason?.trim().toLowerCase() === formData.reason.trim().toLowerCase() &&
        rec.applicableFor === formData.applicableFor &&
        (!editingItem || rec.reasonId !== editingItem.reasonId)
    );

    if (duplicate) {
      showPopup(DUPLICATE_OT_SCHEDULE_CHANGE_REASON, "error");
      setProcess(false);
      return;
    }

    // Matches the create/update request body exactly: { reason, applicableFor }
    const payload = {
      reason: formData.reason.trim(),
      applicableFor: formData.applicableFor,
    };

    try {
      if (editingItem) {
        await putRequest(`${MAS_OT_SCHEDULE_CHANGE_REASON}/update/${editingItem.reasonId}`, payload);
        showPopup(UPDATE_OT_SCHEDULE_CHANGE_REASON, "success", () => {
          fetchData();
          resetForm();
        });
      } else {
        await postRequest(`${MAS_OT_SCHEDULE_CHANGE_REASON}/create`, payload);
        showPopup(ADD_OT_SCHEDULE_CHANGE_REASON, "success", () => {
          fetchData();
          resetForm();
        });
      }
    } catch (error) {
      console.error("Save error:", error);
      showPopup(FAIL_OT_SCHEDULE_CHANGE_REASON, "error");
    } finally {
      setProcess(false);
    }
  };

  // ----- Status toggle -----
  const handleSwitchChange = (id, name, newStatus) => {
    setConfirmDialog({ isOpen: true, id, newStatus, name });
  };

  const handleConfirm = async (confirmed) => {
    if (!confirmed) {
      setConfirmDialog({ isOpen: false, id: null, newStatus: "", name: "" });
      return;
    }

    setProcess(true);
    try {
      await putRequest(`${MAS_OT_SCHEDULE_CHANGE_REASON}/status/${confirmDialog.id}?status=${confirmDialog.newStatus}`);
      showPopup(UPDATE_STATUS_OT_SCHEDULE_CHANGE_REASON, "success", () => {
        fetchData();
      });
    } catch (error) {
      console.error("Status update error:", error);
      showPopup(UPDATE_FAIL_OT_SCHEDULE_CHANGE_REASON, "error");
    } finally {
      setProcess(false);
      setConfirmDialog({ isOpen: false, id: null, newStatus: "", name: "" });
    }
  };

  // ----- Activate (from edit form) -----
  const handleActivate = async () => {
    if (!editingItem) return;
    setProcess(true);
    try {
      await putRequest(`${MAS_OT_SCHEDULE_CHANGE_REASON}/status/${editingItem.reasonId}?status=Y`);
      showPopup(UPDATE_STATUS_OT_SCHEDULE_CHANGE_REASON, "success", () => {
        fetchData();
        resetForm();
      });
    } catch (error) {
      console.error("Activation error:", error);
      showPopup(UPDATE_FAIL_OT_SCHEDULE_CHANGE_REASON, "error");
    } finally {
      setProcess(false);
    }
  };

  // ----- Refresh -----
  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchData();
  };

  // ----- Popup helper -----
  const showPopup = (message, type = "info", onCloseCallback = null) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
        if (onCloseCallback) onCloseCallback();
      },
    });
  };

  // ====================== RENDER ======================
  return (
    <div className="content-wrapper">
      <div className="row">
        {loading && <LoadingScreen />}
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">OT Schedule Change Reason Master</h4>

              {/* Toggle Add / Back buttons */}
              <div className="d-flex justify-content-between align-items-center gap-2">
                {!showForm ? (
                  <>
                    <form className="d-inline-block searchform me-2" role="search">
                      <div className="input-group searchinput">
                        <input
                          type="search"
                          className="form-control"
                          placeholder="Search by reason or applicable for"
                          aria-label="Search"
                          value={searchQuery}
                          onChange={handleSearchChange}
                        />
                        <span className="input-group-text" id="search-icon">
                          <i className="fa fa-search"></i>
                        </span>
                      </div>
                    </form>
                    <button type="button" className="btn btn-success" onClick={handleRefresh}>
                      <i className="mdi mdi-refresh"></i> Show All
                    </button>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => {
                        setEditingItem(null);
                        setFormData({ reason: "", applicableFor: "" });
                        setShowForm(true);
                      }}
                    >
                      <i className="mdi mdi-plus"></i> Add
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                    <i className="mdi mdi-arrow-left"></i> Back
                  </button>
                )}
              </div>
            </div>

            <div className="card-body">
              {!showForm ? (
                // ----- Table view -----
                <>
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Reason</th>
                          <th>Applicable For</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((item) => (
                            <tr key={item.reasonId}>
                              <td>{item.reason || '-'}</td>
                              <td>
                                  {item.applicableFor || '-'}
                              </td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={item.status?.toLowerCase() === "y"}
                                    onChange={() => handleSwitchChange(
                                      item.reasonId,
                                      item.reason,
                                      item.status?.toLowerCase() === "y" ? "n" : "y"
                                    )}
                                    id={`switch-${item.reasonId}`}
                                  />
                                  <label className="form-check-label px-0" htmlFor={`switch-${item.reasonId}`}>
                                    {item.status?.toLowerCase() === "y" ? "Active" : "Deactivated"}
                                  </label>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(item)}
                                  disabled={item.status?.toLowerCase() !== "y" || process}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center">No records found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {filteredData.length > 0 && (
                    <Pagination
                      totalItems={filteredData.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              ) : (
                // ----- Form view -----
                <form className="forms row" onSubmit={handleSave}>
                  <div className="row">
                    <div className="form-group col-md-6 mt-3">
                      <label>
                        Reason <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="reason"
                        placeholder="Enter reason"
                        onChange={handleInputChange}
                        value={formData.reason}
                        maxLength={REASON_MAX_LENGTH}
                        required
                        disabled={process}
                      />
                    </div>

                    <div className="form-group col-md-6 mt-3">
                      <label>
                        Applicable For <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        id="applicableFor"
                        value={formData.applicableFor}
                        onChange={handleSelectChange}
                        required
                        disabled={process}
                      >
                        <option value="">Select</option>
                        <option value="Cancel">Cancel</option>
                        <option value="Reschedule">Reschedule</option>
                        <option value="Both">Both</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={process || !isFormValid}
                    >
                      {process ? "Processing..." : (editingItem ? 'Update' : 'Save')}
                    </button>

                    {editingItem && editingItem.status?.toLowerCase() === "n" && (
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={handleActivate}
                        disabled={process}
                      >
                        Activate
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleCancel}
                      disabled={process}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {popupMessage && (
                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
              )}

              {confirmDialog.isOpen && (
                <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button type="button" className="btn-close" onClick={() => handleConfirm(false)} aria-label="Close"></button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to {confirmDialog.newStatus?.toLowerCase() === "y" ? "activate" : "deactivate"}{" "}
                          <strong>{confirmDialog.name}</strong> reason?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)} disabled={process}>
                          Cancel
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)} disabled={process}>
                          {process ? "Processing..." : "Confirm"}
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

export default OTScheduleChangeReasonMaster;
