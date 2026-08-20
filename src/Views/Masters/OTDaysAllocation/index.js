import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const OTDaysAllocation = () => {
  // ----- State -----
  const [formData, setFormData] = useState({
    otId: "",
    day: "",
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
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [process, setProcess] = useState(false);

  // ----- Dummy data for dropdowns -----
  const otOptions = [
    { id: 1, name: "Main OT" },
    { id: 2, name: "Cardio OT" },
    { id: 3, name: "Neuro OT" }
  ];
  const dayOptions = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const departmentOptions = [
    { id: 1, name: "Surgery" },
    { id: 2, name: "Cardiology" },
    { id: 3, name: "Neurology" }
  ];

  // ----- Dummy data for table -----
  const dummyData = [
    { allocationId: 1, otId: 1, otName: "Main OT", day: "Monday", departmentId: 1, departmentName: "Surgery", startTime: "09:00", endTime: "17:00", status: "Y" },
    { allocationId: 2, otId: 2, otName: "Cardio OT", day: "Wednesday", departmentId: 2, departmentName: "Cardiology", startTime: "08:00", endTime: "16:00", status: "Y" },
    { allocationId: 3, otId: 3, otName: "Neuro OT", day: "Friday", departmentId: 3, departmentName: "Neurology", startTime: "10:00", endTime: "18:00", status: "N" }
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
    const { otId, day, departmentId, startTime, endTime } = formData;
    setIsFormValid(
      otId !== "" && day !== "" && departmentId !== "" && startTime !== "" && endTime !== ""
    );
  }, [formData]);

  // ----- Filtered data -----
  const filteredData = data.filter(item =>
    (item.otName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     item.departmentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     item.day?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // ----- Handlers -----
  const handlePageChange = (page) => setCurrentPage(page);

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      otId: item.otId?.toString() || "",
      day: item.day || "",
      departmentId: item.departmentId?.toString() || "",
      startTime: item.startTime || "",
      endTime: item.endTime || ""
    });
    setShowForm(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setProcess(true);

    // Simulate save/update
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
    setFormData({ otId: "", day: "", departmentId: "", startTime: "", endTime: "" });
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
          `Allocation ${confirmDialog.newStatus?.toLowerCase() === "y" ? "activated" : "deactivated"} successfully!`,
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
        showPopup("OT Day Allocation activated successfully!", "success", () => {
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
              <h4 className="card-title p-2">OT Day Allocation</h4>

              {/* Toggle Add / Back buttons */}
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
                        setFormData({ otId: "", day: "", departmentId: "", startTime: "", endTime: "" });
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
                            <tr key={item.allocationId}>
                              <td>{item.otName || '-'}</td>
                              <td>{item.day || '-'}</td>
                              <td>{item.departmentName || '-'}</td>
                              <td>{item.startTime || '-'}</td>
                              <td>{item.endTime || '-'}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={item.status?.toLowerCase() === "y"}
                                    onChange={() => handleSwitchChange(
                                      item.allocationId,
                                      item.otName,
                                      item.status?.toLowerCase() === "y" ? "n" : "y"
                                    )}
                                    id={`switch-${item.allocationId}`}
                                  />
                                  <label className="form-check-label px-0" htmlFor={`switch-${item.allocationId}`}>
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
                // ----- Form view (Back button is in header) -----
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
                        disabled={process}
                      >
                        <option value="">Select OT</option>
                        {otOptions.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>Day <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        id="day"
                        value={formData.day}
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
                        disabled={process}
                      >
                        <option value="">Select Department</option>
                        {departmentOptions.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
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