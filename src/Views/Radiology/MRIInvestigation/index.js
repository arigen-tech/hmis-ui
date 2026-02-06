import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const MRIInvestigation = () => {
  /* ---------------- STATES ---------------- */
  const [mriData, setMriData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    investigationName: ""
  });

  const [formData, setFormData] = useState({
    uhid: "",
    patientName: "",
    age: "",
    gender: "",
    modality: "MRI",
    investigationName: "",
    orderDate: "",
    orderTime: "",
    department: ""
  });

  /* ---------------- SAMPLE DATA ---------------- */
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setMriData([
        {
          id: 1,
          uhid: "UHID3001",
          patientName: "Amit Kumar",
          age: "42",
          gender: "Male",
          modality: "MRI",
          investigationName: "MRI Brain",
          orderDate: "18/01/2026",
          orderTime: "10:00 AM",
          department: "Radiology",
          status: "y"
        },
        {
          id: 2,
          uhid: "UHID3002",
          patientName: "Neha Sharma",
          age: "30",
          gender: "Female",
          modality: "MRI",
          investigationName: "MRI Spine",
          orderDate: "19/01/2026",
          orderTime: "12:30 PM",
          department: "Radiology",
          status: "y"
        }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  /* ---------------- SEARCH ---------------- */
  const filteredData = mriData.filter(item =>
    item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.uhid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

  /* ---------------- HELPERS ---------------- */
  const showPopup = (message, type = "success") => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData(record);
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    if (editingRecord) {
      setMriData(prev =>
        prev.map(item =>
          item.id === editingRecord.id ? { ...formData } : item
        )
      );
      showPopup("MRI Investigation updated successfully");
    } else {
      setMriData(prev => [
        ...prev,
        { ...formData, id: Date.now(), status: "y" }
      ]);
      showPopup("MRI Investigation added successfully");
    }
    handleBack();
  };

  const handleSwitchChange = (id, newStatus, investigationName) => {
    setConfirmDialog({ isOpen: true, id, newStatus, investigationName });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed) {
      setMriData(prev =>
        prev.map(item =>
          item.id === confirmDialog.id
            ? { ...item, status: confirmDialog.newStatus }
            : item
        )
      );
      showPopup(
        `MRI Investigation ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"}`
      );
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "", investigationName: "" });
  };

  /* ✅ SAFE INPUT HANDLER (NO trim ERROR) */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    setIsFormValid(
      Object.values(updated).every(v => String(v).trim() !== "")
    );
  };

  const handleBack = () => {
    setShowForm(false);
    setEditingRecord(null);
    setFormData({
      uhid: "",
      patientName: "",
      age: "",
      gender: "",
      modality: "MRI",
      investigationName: "",
      orderDate: "",
      orderTime: "",
      department: ""
    });
    setIsFormValid(false);
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title">MRI Investigation</h4>

          <div className="d-flex gap-2">
            {!showForm && (
              <input
                type="search"
                className="form-control"
                placeholder="Search by UHID or Patient Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "250px" }}
              />
            )}

            {!showForm ? (
              <>
                <button className="btn btn-success" onClick={() => setShowForm(true)}>Add</button>
                <button className="btn btn-success" onClick={() => setSearchQuery("")}>Show All</button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={handleBack}>Back</button>
            )}
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <LoadingScreen />
          ) : !showForm ? (
            <>
              <table className="table table-bordered table-hover">
                <thead>
                  <tr>
                    <th>UHID</th>
                    <th>Patient Name</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Modality</th>
                    <th>Investigation Name</th>
                    <th>Order Date</th>
                    <th>Order Time</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? currentItems.map(item => (
                    <tr key={item.id}>
                      <td>{item.uhid}</td>
                      <td>{item.patientName}</td>
                      <td>{item.age}</td>
                      <td>{item.gender}</td>
                      <td>{item.modality}</td>
                      <td>{item.investigationName}</td>
                      <td>{item.orderDate}</td>
                      <td>{item.orderTime}</td>
                      <td>{item.department}</td>
                       <td>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={item.status === "y"}
                            onChange={() =>
                              handleSwitchChange(
                                item.id,
                                item.status === "y" ? "n" : "y",
                                item.investigationName
                              )
                            }
                          />
                          <label className="form-check-label ms-2">
                            {item.status === "y" ? "Active" : "Inactive"}
                          </label>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-success"
                          disabled={item.status !== "y"}
                          onClick={() => handleEdit(item)}
                        >
                          <i className="fa fa-pencil" />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="11" className="text-center">No Records Found</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <Pagination
                totalItems={filteredData.length}
                itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </>
          ) : (
            <form onSubmit={handleSave}>
  {/* UHID */}
  <div className="form-group col-md-4">
    <label>
      UHID <span className="text-danger">*</span>
    </label>
    <input
      type="text"
      className="form-control"
      name="uhid"
      value={formData.uhid}
      onChange={handleInputChange}
      required
    />
  </div>

  {/* Patient Name */}
  <div className="form-group col-md-4">
    <label>
      Patient Name <span className="text-danger">*</span>
    </label>
    <input
      type="text"
      className="form-control"
      name="patientName"
      value={formData.patientName}
      onChange={handleInputChange}
      required
    />
  </div>

  {/* Age */}
  <div className="form-group col-md-4">
    <label>
      Age <span className="text-danger">*</span>
    </label>
    <input
      type="number"
      className="form-control"
      name="age"
      value={formData.age}
      onChange={handleInputChange}
      required
    />
  </div>

  {/* Gender */}
  <div className="form-group col-md-4">
    <label>
      Gender <span className="text-danger">*</span>
    </label>
    <select
      className="form-control"
      name="gender"
      value={formData.gender}
      onChange={handleInputChange}
      required
    >
      <option value="">Select</option>
      <option value="Male">Male</option>
      <option value="Female">Female</option>
      <option value="Other">Other</option>
    </select>
  </div>

  {/* Modality */}
  <div className="form-group col-md-4">
    <label>
      Modality <span className="text-danger">*</span>
    </label>
    <input
      type="text"
      className="form-control"
      name="modality"
      value={formData.modality}
      disabled
    />
  </div>

  {/* Investigation Name */}
  <div className="form-group col-md-4">
    <label>
      Investigation Name <span className="text-danger">*</span>
    </label>
    <input
      type="text"
      className="form-control"
      name="investigationName"
      value={formData.investigationName}
      onChange={handleInputChange}
      required
    />
  </div>

  {/* Order Date */}
  <div className="form-group col-md-4">
    <label>
      Order Date <span className="text-danger">*</span>
    </label>
    <input
      type="date"
      className="form-control"
      name="orderDate"
      value={formData.orderDate}
      onChange={handleInputChange}
      required
    />
  </div>

  {/* Order Time */}
  <div className="form-group col-md-4">
    <label>
      Order Time <span className="text-danger">*</span>
    </label>
    <input
      type="time"
      className="form-control"
      name="orderTime"
      value={formData.orderTime}
      onChange={handleInputChange}
      required
    />
  </div>

  {/* Department */}
  <div className="form-group col-md-4">
    <label>
      Department <span className="text-danger">*</span>
    </label>
    <input
      type="text"
      className="form-control"
      name="department"
      value={formData.department}
      onChange={handleInputChange}
      required
    />
  </div>
              <div className="mt-3 text-end">
                <button className="btn btn-primary me-2" disabled={!isFormValid}>Save</button>
                <button className="btn btn-danger" type="button" onClick={handleBack}>Cancel</button>
              </div>
            </form>
          )}

          {popupMessage && <Popup {...popupMessage} />}

          {confirmDialog.isOpen && (
            <div className="modal d-block">
              <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                    <h5>Confirm Status Change</h5>
                  </div>
                   <div className="modal-body">
                    Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                    <strong>{confirmDialog.investigationName}</strong>?
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => handleConfirm(false)}>No</button>
                    <button className="btn btn-primary" onClick={() => handleConfirm(true)}>Yes</button>
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

export default MRIInvestigation;
