import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, postRequest, putRequest } from "../../../service/apiService";
import { MAS_OT_BOOKING_STATUS } from "../../../config/apiConfig";
import {
  FETCH_OT_BOOKING_STATUS,
  ADD_OT_BOOKING_STATUS,
  UPDATE_OT_BOOKING_STATUS,
  UPDATE_STATUS_OT_BOOKING_STATUS,
  FAIL_OT_BOOKING_STATUS,
  DUPLICATE_OT_BOOKING_STATUS,
  UPDATE_FAIL_OT_BOOKING_STATUS,
  FETCH_OT_BOOKING_STATUS_DETAIL,
} from "../../../config/constants";

const OTBookingStatusMaster = () => {
  // ----- State -----
  const [formData, setFormData] = useState({
    statusCode: "",
    statusName: "",
    description: ""
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
  const STATUS_CODE_MAX_LENGTH = 30;
  const STATUS_NAME_MAX_LENGTH = 100;
  const DESCRIPTION_MAX_LENGTH = 500;

  // ----- Fetch data (flag=0 = all) -----
  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const { response } = await getRequest(`${MAS_OT_BOOKING_STATUS}/getAll/${flag}`);
      setData(response || []);
    } catch (error) {
      console.error("Fetch error:", error);
      showPopup(FETCH_OT_BOOKING_STATUS, "error");
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
    const { statusCode, statusName, description } = formData;
    setIsFormValid(
      statusCode.trim() !== "" && statusName.trim() !== "" && description.trim() !== ""
    );
  }, [formData]);

  // ----- Filtered data (search) -----
  const filteredData = data.filter(item =>
    item.statusCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.statusName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const resetForm = () => {
    setEditingItem(null);
    setShowForm(false);
    setFormData({ statusCode: "", statusName: "", description: "" });
    setPopupMessage(null);
  };

  const handleCancel = () => resetForm();

  // ----- Edit -----
  // Pulls the record fresh via GET /master/otBookingStatus/getById/{id} on
  // the primary key (bookingStatusId) rather than trusting the locally
  // cached row, so the form always reflects the latest server state.
  const handleEdit = async (item) => {
    setProcess(true);
    try {
      const { response } = await getRequest(`${MAS_OT_BOOKING_STATUS}/getById/${item.bookingStatusId}`);
      const record = response || item;

      setEditingItem(record);
      setFormData({
        statusCode: record.statusCode || "",
        statusName: record.statusName || "",
        description: record.description || "",
      });
      setShowForm(true);
    } catch (error) {
      console.error("Fetch by id error:", error);
      showPopup(FETCH_OT_BOOKING_STATUS_DETAIL, "error");
    } finally {
      setProcess(false);
    }
  };

  // ----- Save (Add / Update) -----
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setProcess(true);

    // Check duplicate (same status code) - statusCode is the business key
    // (e.g. REQUESTED, SCHEDULED, IN_PROGRESS) so it must stay unique.
    const duplicate = data.find(
      (rec) =>
        rec.statusCode?.trim().toLowerCase() === formData.statusCode.trim().toLowerCase() &&
        (!editingItem || rec.bookingStatusId !== editingItem.bookingStatusId)
    );

    if (duplicate) {
      showPopup(DUPLICATE_OT_BOOKING_STATUS, "error");
      setProcess(false);
      return;
    }

    // Matches the create/update request body exactly:
    // { statusCode, statusName, description }
    const payload = {
      statusCode: formData.statusCode.trim(),
      statusName: formData.statusName.trim(),
      description: formData.description.trim(),
    };

    try {
      if (editingItem) {
        await putRequest(`${MAS_OT_BOOKING_STATUS}/update/${editingItem.bookingStatusId}`, payload);
        showPopup(UPDATE_OT_BOOKING_STATUS, "success", () => {
          fetchData();
          resetForm();
        });
      } else {
        await postRequest(`${MAS_OT_BOOKING_STATUS}/create`, payload);
        showPopup(ADD_OT_BOOKING_STATUS, "success", () => {
          fetchData();
          resetForm();
        });
      }
    } catch (error) {
      console.error("Save error:", error);
      showPopup(FAIL_OT_BOOKING_STATUS, "error");
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
      await putRequest(`${MAS_OT_BOOKING_STATUS}/status/${confirmDialog.id}?status=${confirmDialog.newStatus}`);
      showPopup(UPDATE_STATUS_OT_BOOKING_STATUS, "success", () => {
        fetchData();
      });
    } catch (error) {
      console.error("Status update error:", error);
      showPopup(UPDATE_FAIL_OT_BOOKING_STATUS, "error");
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
      await putRequest(`${MAS_OT_BOOKING_STATUS}/status/${editingItem.bookingStatusId}?status=Y`);
      showPopup(UPDATE_STATUS_OT_BOOKING_STATUS, "success", () => {
        fetchData();
        resetForm();
      });
    } catch (error) {
      console.error("Activation error:", error);
      showPopup(UPDATE_FAIL_OT_BOOKING_STATUS, "error");
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
              <h4 className="card-title p-2">OT Booking Status Master</h4>

              <div className="d-flex justify-content-between align-items-center gap-2">
                {!showForm ? (
                  <>
                    <form className="d-inline-block searchform me-2" role="search">
                      <div className="input-group searchinput">
                        <input
                          type="search"
                          className="form-control"
                          placeholder="Search by code, name or description"
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
                        setFormData({ statusCode: "", statusName: "", description: "" });
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
                          <th>Status Code</th>
                          <th>Status Name</th>
                          <th>Description</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((item) => (
                            <tr key={item.bookingStatusId}>
                              <td>{item.statusCode || '-'}</td>
                              <td>{item.statusName || '-'}</td>
                              <td>{item.description || '-'}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={item.status?.toLowerCase() === "y"}
                                    onChange={() => handleSwitchChange(
                                      item.bookingStatusId,
                                      item.statusName,
                                      item.status?.toLowerCase() === "y" ? "n" : "y"
                                    )}
                                    id={`switch-${item.bookingStatusId}`}
                                  />
                                  <label className="form-check-label px-0" htmlFor={`switch-${item.bookingStatusId}`}>
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
                            <td colSpan="5" className="text-center">No records found</td>
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
                      <label>
                        Status Code <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="statusCode"
                        placeholder="e.g. REQUESTED"
                        onChange={handleInputChange}
                        value={formData.statusCode}
                        maxLength={STATUS_CODE_MAX_LENGTH}
                        required
                        disabled={process || !!editingItem}
                        style={{ textTransform: "uppercase" }}
                      />
                    </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Status Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="statusName"
                        placeholder="e.g. Requested"
                        onChange={handleInputChange}
                        value={formData.statusName}
                        maxLength={STATUS_NAME_MAX_LENGTH}
                        required
                        disabled={process}
                      />
                    </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Description <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="description"
                        placeholder="Enter description"
                        onChange={handleInputChange}
                        value={formData.description}
                        maxLength={DESCRIPTION_MAX_LENGTH}
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
                          <strong>{confirmDialog.name}</strong> booking status?
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

export default OTBookingStatusMaster;