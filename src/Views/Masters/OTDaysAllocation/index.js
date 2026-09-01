import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, postRequest, putRequest } from "../../../service/apiService";
import { MAS_OT_DAY_ALLOCATION, MAS_OPERATION_THEATRE, ALL_DEPARTMENT } from "../../../config/apiConfig";
import {
  FETCH_OT_DAY_ALLOC,
  ADD_OT_DAY_ALLOC,
  UPDATE_OT_DAY_ALLOC,
  UPDATE_STATUS_OT_DAY_ALLOC,
  FAIL_OT_DAY_ALLOC,
  DUPLICATE_OT_DAY_ALLOC,
  UPDATE_FAIL_OT_DAY_ALLOC,
  FETCH_OT_DAY_ALLOC_DETAIL,
  FETCH_OT_MASTER_LIST,
  FETCH_DEPARTMENT_MASTER_LIST,
} from "../../../config/constants";

const OTDaysAllocation = () => {
  // ----- State -----
  const [formData, setFormData] = useState({
    otId: "",
    dayOfWeek: "",
    departmentId: "",
    startTime: "",
    endTime: ""
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

  // ----- FK master data -----
  const [otMasterList, setOtMasterList] = useState([]);
  const [departmentMasterList, setDepartmentMasterList] = useState([]);
  const [masterLoading, setMasterLoading] = useState(false);

  // UPPERCASE day options
  const dayOptions = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

  // ----- Helper: convert time string ("HH:mm" from <input type="time">) to
  // the "HH:mm:ss" string the API actually expects for LocalTime fields -----
  const timeStringToApiFormat = (timeStr) => {
    if (!timeStr) return null;
    // <input type="time"> normally gives "HH:mm"; append ":00" to make "HH:mm:ss"
    return timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  };

  // ----- Helper: convert whatever the API sends back for a LocalTime into "HH:mm" -----
  const timeObjectToString = (time) => {
    if (time === null || time === undefined || time === "") return "";

    // Case 1: plain string, e.g. "09:00:00" or "09:00"
    if (typeof time === "string") {
      const [hour, minute] = time.split(":");
      if (hour === undefined || minute === undefined) return "";
      return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
    }

    // Case 2: array, e.g. [9, 0, 0, 0]
    if (Array.isArray(time)) {
      const [hour = 0, minute = 0] = time;
      return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    }

    // Case 3: named object, e.g. { hour: 9, minute: 0, second: 0, nano: 0 }
    if (typeof time === "object" && time.hour !== undefined) {
      const hour = String(time.hour).padStart(2, "0");
      const minute = String(time.minute ?? 0).padStart(2, "0");
      return `${hour}:${minute}`;
    }

    return "";
  };

  // ----- Fetch OT Day Allocation data -----
  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const { response } = await getRequest(`${MAS_OT_DAY_ALLOCATION}/getAll/${flag}`);
      setData(response || []);
    } catch (error) {
      console.error("Fetch error:", error);
      showPopup(FETCH_OT_DAY_ALLOC, "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // ----- Fetch FK master lists -----
  const fetchMasterLists = async () => {
    setMasterLoading(true);
    const [otResult, deptResult] = await Promise.allSettled([
      getRequest(`${MAS_OPERATION_THEATRE}/getAll/0`),
      getRequest(`${ALL_DEPARTMENT}/1`),
    ]);

    if (otResult.status === "fulfilled") {
      setOtMasterList(otResult.value?.response || []);
    } else {
      console.error("OT master fetch error:", otResult.reason);
      showPopup(FETCH_OT_MASTER_LIST, "error");
    }

    if (deptResult.status === "fulfilled") {
      const normalized = (deptResult.value?.response || []).map((dept) => ({
        ...dept,
        departmentId: dept.departmentId ?? dept.id ?? dept.deptId,
        departmentName: dept.departmentName ?? dept.name ?? dept.deptName,
        status: dept.status ?? dept.departmentStatus ?? "Y",
      }));
      setDepartmentMasterList(normalized);
    } else {
      console.error("Department master fetch error:", deptResult.reason);
      showPopup(FETCH_DEPARTMENT_MASTER_LIST, "error");
    }

    setMasterLoading(false);
  };

  useEffect(() => {
    fetchData();
    fetchMasterLists();
  }, []);

  // Active OT options for the dropdown
  const otOptions = (() => {
    const active = otMasterList.filter((ot) => ot.status?.toLowerCase() === "y");
    if (editingItem && !active.some((ot) => ot.otId === parseInt(formData.otId))) {
      const current = otMasterList.find((ot) => ot.otId === parseInt(formData.otId));
      if (current) return [...active, current];
    }
    return active;
  })();

  // Active Department options for the dropdown
  const departmentOptions = (() => {
    const active = departmentMasterList.filter((dept) => dept.status?.toLowerCase() === "y");
    if (editingItem && !active.some((dept) => dept.departmentId === parseInt(formData.departmentId))) {
      const current = departmentMasterList.find((dept) => dept.departmentId === parseInt(formData.departmentId));
      if (current) return [...active, current];
    }
    return active;
  })();

  // ----- Form validation -----
  useEffect(() => {
    const { otId, dayOfWeek, departmentId, startTime, endTime } = formData;
    setIsFormValid(
      otId !== "" && dayOfWeek !== "" && departmentId !== "" && startTime !== "" && endTime !== ""
    );
  }, [formData]);

  // ----- Filtered data (search) -----
  const filteredData = data.filter(item =>
    (item.otName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     item.departmentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     item.dayOfWeek?.toLowerCase().includes(searchQuery.toLowerCase()))
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
    setFormData({ otId: "", dayOfWeek: "", departmentId: "", startTime: "", endTime: "" });
    setPopupMessage(null);
  };

  const handleCancel = () => resetForm();

  // ----- Edit -----
  const handleEdit = async (item) => {
    setProcess(true);
    try {
      const { response } = await getRequest(`${MAS_OT_DAY_ALLOCATION}/getById/${item.otDayAllocationId}`);
      const record = response || item;

      setEditingItem(record);
      setFormData({
        otId: record.otId?.toString() || "",
        dayOfWeek: record.dayOfWeek ? record.dayOfWeek.toUpperCase() : "", // ensure uppercase
        departmentId: record.departmentId?.toString() || "",
        startTime: timeObjectToString(record.startTime),
        endTime: timeObjectToString(record.endTime),
      });
      setShowForm(true);
    } catch (error) {
      console.error("Fetch by id error:", error);
      showPopup(FETCH_OT_DAY_ALLOC_DETAIL, "error");
    } finally {
      setProcess(false);
    }
  };

  // ----- Save (Add / Update) -----
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setProcess(true);

    // Parse and validate IDs
    const otId = parseInt(formData.otId, 10);
    const departmentId = parseInt(formData.departmentId, 10);
    if (isNaN(otId) || isNaN(departmentId)) {
      showPopup("Invalid OT or Department selection", "error");
      setProcess(false);
      return;
    }

    // Duplicate check (client-side)
    const duplicate = data.find(
      (rec) =>
        rec.otId === otId &&
        rec.departmentId === departmentId &&
        rec.dayOfWeek === formData.dayOfWeek &&
        (!editingItem || rec.otDayAllocationId !== editingItem.otDayAllocationId)
    );

    if (duplicate) {
      showPopup(DUPLICATE_OT_DAY_ALLOC, "error");
      setProcess(false);
      return;
    }

    const payload = {
      otId,
      departmentId,
      dayOfWeek: formData.dayOfWeek, // already uppercase
      startTime: timeStringToApiFormat(formData.startTime),
      endTime: timeStringToApiFormat(formData.endTime),
    };

    console.log("Sending payload:", payload); // Debugging – check the browser console

    try {
      if (editingItem) {
        await putRequest(`${MAS_OT_DAY_ALLOCATION}/update/${editingItem.otDayAllocationId}`, payload);
        showPopup(UPDATE_OT_DAY_ALLOC, "success", () => {
          fetchData();
          resetForm();
        });
      } else {
        await postRequest(`${MAS_OT_DAY_ALLOCATION}/create`, payload);
        showPopup(ADD_OT_DAY_ALLOC, "success", () => {
          fetchData();
          resetForm();
        });
      }
    } catch (error) {
      console.error("Save error details:", error);
      // Extract the actual server error message if available
      let serverMessage = FAIL_OT_DAY_ALLOC;
      if (error?.response?.data?.message) {
        serverMessage = error.response.data.message;
      } else if (error?.message) {
        serverMessage = error.message;
      }
      showPopup(serverMessage, "error");
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
      await putRequest(`${MAS_OT_DAY_ALLOCATION}/status/${confirmDialog.id}?status=${confirmDialog.newStatus}`);
      showPopup(UPDATE_STATUS_OT_DAY_ALLOC, "success", () => {
        fetchData();
      });
    } catch (error) {
      console.error("Status update error:", error);
      showPopup(UPDATE_FAIL_OT_DAY_ALLOC, "error");
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
      await putRequest(`${MAS_OT_DAY_ALLOCATION}/status/${editingItem.otDayAllocationId}?status=Y`);
      showPopup(UPDATE_STATUS_OT_DAY_ALLOC, "success", () => {
        fetchData();
        resetForm();
      });
    } catch (error) {
      console.error("Activation error:", error);
      showPopup(UPDATE_FAIL_OT_DAY_ALLOC, "error");
    } finally {
      setProcess(false);
    }
  };

  // ----- Refresh -----
  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchData();
    fetchMasterLists();
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
        {(loading || masterLoading) && <LoadingScreen />}
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">OT Day Allocation</h4>

              <div className="d-flex justify-content-between align-items-center gap-2">
                {!showForm ? (
                  <>
                    <form className="d-inline-block searchform me-2" role="search">
                      <div className="input-group searchinput">
                        <input
                          type="search"
                          className="form-control"
                          placeholder="Search by OT, Dept or Day"
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
                        setFormData({ otId: "", dayOfWeek: "", departmentId: "", startTime: "", endTime: "" });
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
                          <th>OT</th>
                          <th>Day</th>
                          <th>Department</th>
                          <th>Start Time</th>
                          <th>End Time</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((item) => (
                            <tr key={item.otDayAllocationId}>
                              <td>{item.otName || '-'}</td>
                              <td>{item.dayOfWeek || '-'}</td>
                              <td>{item.departmentName || '-'}</td>
                              <td>{timeObjectToString(item.startTime) || '-'}</td>
                              <td>{timeObjectToString(item.endTime) || '-'}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={item.status?.toLowerCase() === "y"}
                                    onChange={() => handleSwitchChange(
                                      item.otDayAllocationId,
                                      item.otName,
                                      item.status?.toLowerCase() === "y" ? "n" : "y"
                                    )}
                                    id={`switch-${item.otDayAllocationId}`}
                                  />
                                  <label className="form-check-label px-0" htmlFor={`switch-${item.otDayAllocationId}`}>
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
                            <td colSpan="7" className="text-center">No records found</td>
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
                    <div className="form-group col-md-4 mt-3">
                      <label>OT <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        id="otId"
                        value={formData.otId}
                        onChange={handleSelectChange}
                        required
                        disabled={process || masterLoading}
                      >
                        <option value="">Select OT</option>
                        {otOptions.map(opt => (
                          <option key={opt.otId} value={opt.otId}>{opt.otName}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>Day <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        id="dayOfWeek"
                        value={formData.dayOfWeek}
                        onChange={handleSelectChange}
                        required
                        disabled={process}
                      >
                        <option value="">Select Day</option>
                        {dayOptions.map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>Department <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        id="departmentId"
                        value={formData.departmentId}
                        onChange={handleSelectChange}
                        required
                        disabled={process || masterLoading}
                      >
                        <option value="">Select Department</option>
                        {departmentOptions.map(dept => (
                          <option key={dept.departmentId} value={dept.departmentId}>{dept.departmentName}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>Start Time <span className="text-danger">*</span></label>
                      <input
                        type="time"
                        className="form-control"
                        id="startTime"
                        value={formData.startTime}
                        onChange={handleInputChange}
                        required
                        disabled={process}
                      />
                    </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>End Time <span className="text-danger">*</span></label>
                      <input
                        type="time"
                        className="form-control"
                        id="endTime"
                        value={formData.endTime}
                        onChange={handleInputChange}
                        required
                        disabled={process}
                      />
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
                          <strong>{confirmDialog.name}</strong> allocation?
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

export default OTDaysAllocation;