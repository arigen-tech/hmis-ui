import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

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
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [process, setProcess] = useState(false);

  // ----- Constants for validation -----
  const REASON_MAX_LENGTH = 255;

  // ----- Dummy data -----
  const dummyData = [
    { id: 1, reason: "Patient not available", applicableFor: "Cancel", status: "Y" },
    { id: 2, reason: "Surgeon not available", applicableFor: "Reschedule", status: "Y" },
    { id: 3, reason: "Equipment malfunction", applicableFor: "Both", status: "Y" },
    { id: 4, reason: "Emergency case added", applicableFor: "Cancel", status: "N" }
  ];

  // ----- Effects -----
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setData(dummyData);
      setTotalItems(dummyData.length);
      setTotalPages(Math.ceil(dummyData.length / DEFAULT_ITEMS_PER_PAGE));
      setLoading(false);
    }, 300);
  }, []);

  useEffect(() => {
    const { reason, applicableFor } = formData;
    setIsFormValid(reason.trim() !== "" && applicableFor !== "");
  }, [formData]);

  // ----- Filtered data -----
  const filteredData = data.filter(item =>
    item.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.applicableFor?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ----- Handlers -----
  const handlePageChange = (page) => setCurrentPage(page);

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      reason: item.reason || "",
      applicableFor: item.applicableFor || ""
    });
    setShowForm(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setProcess(true);

    setTimeout(() => {
      setProcess(false);
      showPopup(editingItem ? "Updated successfully" : "Added successfully", "success", () => {
        resetForm();
        setData(dummyData);
      });
    }, 500);
  };

  const resetForm = () => {
    setEditingItem(null);
    setShowForm(false);
    setFormData({ reason: "", applicableFor: "" });
    setPopupMessage(null);
  };

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

  const handleSwitchChange = (id, name, newStatus) => {
    setConfirmDialog({ isOpen: true, id, newStatus, name });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed && confirmDialog.id !== null) {
      setProcess(true);
      setTimeout(() => {
        setProcess(false);
        showPopup(
          `Reason ${confirmDialog.newStatus?.toLowerCase() === "y" ? "activated" : "deactivated"} successfully!`,
          "success",
          () => {
            setData(dummyData);
            setCurrentPage(1);
          }
        );
      }, 500);
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "", name: "" });
  };

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

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    setData(dummyData);
  };

  const handleActivate = () => {
    if (editingItem && editingItem.status?.toLowerCase() === "n") {
      setProcess(true);
      setTimeout(() => {
        setProcess(false);
        showPopup("Reason activated successfully!", "success", () => {
          setData(dummyData);
          resetForm();
        });
      }, 500);
    }
  };

  // ----- Pagination slice -----
  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  // ----- Render -----
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
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>
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
                            <tr key={item.id}>
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
                                      item.id,
                                      item.reason,
                                      item.status?.toLowerCase() === "y" ? "n" : "y"
                                    )}
                                    id={`switch-${item.id}`}
                                  />
                                  <label className="form-check-label px-0" htmlFor={`switch-${item.id}`}>
                                    {item.status?.toLowerCase() === "y" ? "Active" : "Deactivated"}
                                  </label>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(item)}
                                  disabled={item.status?.toLowerCase() !== "y"}
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
                      onClick={resetForm}
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