import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const OperationTheatre = () => {
  // ----- State -----
  const [formData, setFormData] = useState({
    otCode: "",
    otName: "",
    otType: "",
    location: ""
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
  const OT_CODE_MAX_LENGTH = 10;
  const OT_NAME_MAX_LENGTH = 100;
  const OT_TYPE_MAX_LENGTH = 50;
  const LOCATION_MAX_LENGTH = 100;

  // ----- Dummy data for demo (replace with API fetch) -----
  const dummyData = [
    { otId: 1, otCode: "OT001", otName: "Main OT", otType: "General", location: "Block A", status: "Y" },
    { otId: 2, otCode: "OT002", otName: "Cardio OT", otType: "Specialized", location: "Block B", status: "N" },
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
    const { otCode, otName, otType, location } = formData;
    if (editingItem) {
      setIsFormValid(otName.trim() !== "" && otType.trim() !== "" && location.trim() !== "");
    } else {
      setIsFormValid(
        otCode.trim() !== "" &&
        otName.trim() !== "" &&
        otType.trim() !== "" &&
        location.trim() !== ""
      );
    }
  }, [formData, editingItem]);

  // ----- Filtered data -----
  const filteredData = data.filter(item =>
    item.otCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.otName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.otType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ----- Handlers -----
  const handlePageChange = (page) => setCurrentPage(page);

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      otCode: item.otCode || "",
      otName: item.otName || "",
      otType: item.otType || "",
      location: item.location || ""
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
    setFormData({ otCode: "", otName: "", otType: "", location: "" });
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
          `OT ${confirmDialog.newStatus?.toLowerCase() === "y" ? "activated" : "deactivated"} successfully!`,
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
        showPopup("OT activated successfully!", "success", () => {
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
              <h4 className="card-title p-2">Operation Theatre Master</h4>

              {/* Toggle Add / Back buttons */}
              <div className="d-flex justify-content-between align-items-center gap-2">
                {!showForm ? (
                  <>
                    <form className="d-inline-block searchform me-2" role="search">
                      <div className="input-group searchinput">
                        <input
                          type="search"
                          className="form-control"
                          placeholder="Search by code, name, type or location"
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
                        setFormData({ otCode: "", otName: "", otType: "", location: "" });
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
                          <th>OT Code</th>
                          <th>OT Name</th>
                          <th>OT Type</th>
                          <th>Location</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((item) => (
                            <tr key={item.otId}>
                              <td>{item.otCode || '-'}</td>
                              <td style={{ textTransform: "capitalize" }}>{item.otName || '-'}</td>
                              <td>{item.otType || '-'}</td>
                              <td>{item.location || '-'}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={item.status?.toLowerCase() === "y"}
                                    onChange={() => handleSwitchChange(
                                      item.otId,
                                      item.otName,
                                      item.status?.toLowerCase() === "y" ? "n" : "y"
                                    )}
                                    id={`switch-${item.otId}`}
                                  />
                                  <label className="form-check-label px-0" htmlFor={`switch-${item.otId}`}>
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
                            <td colSpan="6" className="text-center">No records found</td>
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
                // ----- Form view (Back button is now in header) -----
                <form className="forms row" onSubmit={handleSave}>
                  <div className="row">
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        OT Code <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="otCode"
                        placeholder="Enter OT code"
                        onChange={handleInputChange}
                        value={formData.otCode}
                        maxLength={OT_CODE_MAX_LENGTH}
                        required
                        disabled={process || editingItem}
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        OT Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="otName"
                        placeholder="Enter OT name"
                        onChange={handleInputChange}
                        value={formData.otName}
                        maxLength={OT_NAME_MAX_LENGTH}
                        required
                        disabled={process}
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        OT Type <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="otType"
                        placeholder="Enter OT type"
                        onChange={handleInputChange}
                        value={formData.otType}
                        maxLength={OT_TYPE_MAX_LENGTH}
                        required
                        disabled={process}
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Location <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="location"
                        placeholder="Enter location"
                        onChange={handleInputChange}
                        value={formData.location}
                        maxLength={LOCATION_MAX_LENGTH}
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
                          <strong>{confirmDialog.name}</strong> OT?
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

export default OperationTheatre;