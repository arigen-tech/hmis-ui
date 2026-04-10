import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const OPDHolidayMaster = () => {
  const [holidayData, setHolidayData] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, holidayId: null, newStatus: false });
  const [formData, setFormData] = useState({
    holidayDate: "",
    holidayName: "",
    remarks: "",
    createdBy: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // ================= DUMMY DATA =================
  useEffect(() => {
    // Sample holidays matching the image
    const dummyHolidays = [
      {
        id: 1,
        holidayDate: "2026-01-26",
        holidayName: "Republic Day",
        remarks: "National Holiday",
        createdBy: "Admin",
        status: "y",
      },
      {
        id: 2,
        holidayDate: "2026-03-14",
        holidayName: "Holi",
        remarks: "Festival Holiday",
        createdBy: "Admin",
        status: "y",
      },
      {
        id: 3,
        holidayDate: "2026-03-31",
        holidayName: "Ram Navami",
        remarks: "Festival Holiday",
        createdBy: "Admin",
        status: "y",
      },
      {
        id: 4,
        holidayDate: "2026-08-15",
        holidayName: "Independence Day",
        remarks: "National Holiday",
        createdBy: "Admin",
        status: "y",
      },
      {
        id: 5,
        holidayDate: "2026-10-02",
        holidayName: "Gandhi Jayanti",
        remarks: "National Holiday",
        createdBy: "Admin",
        status: "y",
      },
      {
        id: 6,
        holidayDate: "2026-10-20",
        holidayName: "Diwali",
        remarks: "Festival Holiday",
        createdBy: "Admin",
        status: "y",
      },
      {
        id: 7,
        holidayDate: "2026-12-25",
        holidayName: "Christmas",
        remarks: "Public Holiday",
        createdBy: "Admin",
        status: "y",
      },
      {
        id: 8,
        holidayDate: "2026-05-01",
        holidayName: "Labour Day",
        remarks: "Public Holiday",
        createdBy: "Admin",
        status: "n",
      },
    ];
    setHolidayData(dummyHolidays);
  }, []);

  // ================= FORMAT DATE FOR DISPLAY =================
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, "0")}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}-${d.getFullYear()}`;
  };

  // ================= SEARCH =================
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredHolidayData = holidayData.filter(
    (hol) =>
      hol.holidayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hol.remarks.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hol.createdBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const currentItems = filteredHolidayData.slice(
    (currentPage - 1) * DEFAULT_ITEMS_PER_PAGE,
    currentPage * DEFAULT_ITEMS_PER_PAGE
  );

  // ================= FORM HANDLERS =================
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const resetForm = () => {
    setFormData({
      holidayDate: "",
      holidayName: "",
      remarks: "",
      createdBy: "",
    });
  };

  // ================= SAVE (LOCAL) =================
  const handleSave = (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.holidayDate || !formData.holidayName || !formData.createdBy) {
      showPopup("Please fill all required fields", "error");
      return;
    }

    if (editingHoliday) {
      // Update existing
      const updated = holidayData.map((hol) =>
        hol.id === editingHoliday.id
          ? { ...editingHoliday, ...formData, status: editingHoliday.status }
          : hol
      );
      setHolidayData(updated);
      showPopup("Holiday updated successfully!", "success");
    } else {
      // Add new
      const newHoliday = {
        id: Date.now(),
        ...formData,
        status: "y",
      };
      setHolidayData([...holidayData, newHoliday]);
      showPopup("Holiday added successfully!", "success");
    }
    handleCancel();
  };

  // ================= EDIT =================
  const handleEdit = (hol) => {
    setEditingHoliday(hol);
    setFormData({
      holidayDate: hol.holidayDate,
      holidayName: hol.holidayName,
      remarks: hol.remarks,
      createdBy: hol.createdBy,
    });
    setShowForm(true);
  };

  // ================= STATUS TOGGLE =================
  const handleSwitchChange = (holidayId, newStatus) => {
    const holiday = holidayData.find((h) => h.id === holidayId);
    setConfirmDialog({
      isOpen: true,
      holidayId,
      newStatus,
      holidayName: holiday?.holidayName,
    });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.holidayId !== null) {
      const updated = holidayData.map((hol) =>
        hol.id === confirmDialog.holidayId
          ? { ...hol, status: confirmDialog.newStatus }
          : hol
      );
      setHolidayData(updated);
      showPopup(
        `Holiday ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
        "success"
      );
    }
    setConfirmDialog({ isOpen: false, holidayId: null, newStatus: false, holidayName: "" });
  };

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => setPopupMessage(null),
    });
  };

  const handleCancel = () => {
    resetForm();
    setEditingHoliday(null);
    setShowForm(false);
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    // In a real scenario you might reset to original dummy data, but here we just clear search
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
                        placeholder="Search by name, remarks, created by"
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
                <div className="d-flex align-items-center ms-auto">
                  {!showForm ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={() => {
                          setEditingHoliday(null);
                          resetForm();
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
                    <button type="button" className="btn btn-secondary" onClick={handleCancel}>
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
                          <th>Holiday Date</th>
                          <th>Holiday Name</th>
                          <th>Remarks</th>
                          <th>Status</th>
                          <th>Created By</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((hol) => (
                            <tr key={hol.id}>
                              <td>{formatDate(hol.holidayDate)}</td>
                              <td>{hol.holidayName}</td>
                              <td>{hol.remarks}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={hol.status === "y"}
                                    onChange={() =>
                                      handleSwitchChange(hol.id, hol.status === "y" ? "n" : "y")
                                    }
                                    id={`switch-${hol.id}`}
                                  />
                                  <label className="form-check-label px-0" htmlFor={`switch-${hol.id}`}>
                                    {hol.status === "y" ? "Active" : "Inactive"}
                                  </label>
                                </div>
                              </td>
                              <td>{hol.createdBy}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(hol)}
                                  disabled={hol.status !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center">
                              No holiday data found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* PAGINATION */}
                  {filteredHolidayData.length > 0 && (
                    <Pagination
                      totalItems={filteredHolidayData.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="row">
                    <div className="form-group col-md-4">
                      <label>
                        Holiday Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control mt-1"
                        id="holidayDate"
                        value={formData.holidayDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4">
                      <label>
                        Holiday Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control mt-1"
                        id="holidayName"
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
                        id="remarks"
                        placeholder="Optional remarks"
                        rows="3"
                        value={formData.remarks}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group col-md-4">
                      <label>
                        Created By <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control mt-1"
                        id="createdBy"
                        placeholder="Admin or user name"
                        value={formData.createdBy}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                    <button type="submit" className="btn btn-primary me-2">
                      {editingHoliday ? "Update" : "Save"}
                    </button>
                    <button type="button" className="btn btn-danger" onClick={handleCancel}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {popupMessage && (
                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
              )}

              {confirmDialog.isOpen && (
                <div className="modal d-block" tabIndex="-1" role="dialog">
                  <div className="modal-dialog" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button type="button" className="close" onClick={() => handleConfirm(false)}>
                          <span>&times;</span>
                        </button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                          <strong>{confirmDialog.holidayName}</strong>?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>
                          No
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>
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