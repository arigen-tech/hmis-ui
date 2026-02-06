import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const USGInvestigation = () => {
  const [usgData, setUsgData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    investigationName: ""
  });

  const [popupMessage, setPopupMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const [formData, setFormData] = useState({
    accessionNo: "",
    uhid: "",
    patientName: "",
    age: "",
    gender: "",
    modality: "",
    investigationName: "",
    orderDate: "",
    orderTime: "",
    department: ""
  });

  const [loading, setLoading] = useState(true);
  const MAX_LENGTH = 100;

  /* -------- SAMPLE USG DATA -------- */
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setUsgData([
  {
    id: 1,
    accessionNo:"Acc-260112-001",
    uhid: "UHID1001",
    patientName: "Rohit Sharma",
    age: "35",
    gender: "Male",
    modality: "USG",
    investigationName: "USG Abdomen",
    orderDate: "15/01/2026",
    orderTime: "09:45 AM",
    department: "Radiology",
    status: "y"
  },
  {
    id: 2,
    accessionNo:"Acc-260112-002",
    uhid: "UHID1002",
    patientName: "Neha Verma",
    age: "28",
    gender: "Female",
    modality: "USG",
    investigationName: "USG Pelvis",
    orderDate: "16/01/2026",
    orderTime: "11:15 AM",
    department: "Radiology",
    status: "y"
  }


      ]);
      setLoading(false);
    }, 600);
  }, []);

  /* -------- SEARCH -------- */
  const filteredData = usgData.filter(item =>
    item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.uhid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

  /* -------- HANDLERS -------- */
  const showPopup = (message, type = "success") => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({ ...record });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    if (editingRecord) {
      setUsgData(prev =>
        prev.map(item =>
          item.id === editingRecord.id ? { ...formData } : item
        )
      );
      showPopup("USG Investigation updated successfully");
    } else {
      setUsgData(prev => [
        ...prev,
        { ...formData, id: Date.now(), status: "y" }
      ]);
      showPopup("USG Investigation added successfully");
    }

    handleBack();
  };

  const handleSwitchChange = (id, newStatus, investigationName) => {
    setConfirmDialog({ isOpen: true, id, newStatus, investigationName });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed) {
      setUsgData(prev =>
        prev.map(item =>
          item.id === confirmDialog.id
            ? { ...item, status: confirmDialog.newStatus }
            : item
        )
      );
      showPopup(
        `USG Investigation ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"}`
      );
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "", investigationName: "" });
  };

  /* ✅ SAFE VALIDATION (NO trim ERROR) */
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    const updatedForm = { ...formData, [name]: value };
    setFormData(updatedForm);

    setIsFormValid(
      Object.values(updatedForm).every(v => String(v).trim() !== "")
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
      modality: "",
      investigationName: "",
      orderDate: "",
      orderTime: "",
      department: ""
    });
    setIsFormValid(false);
  };

  /* -------- UI -------- */
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title">USG Investigation</h4>

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
                    <th>Accession NO</th>
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
                  {currentItems.map(item => (
                    <tr key={item.id}>
                    <td>{item.accessionNo}</td>
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
                          onClick={() => handleEdit(item)}
                          disabled={item.status !== "y"}
                        >
                          <i className="fa fa-pencil"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
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
 <div className="row g-3">
 <div className="form-group col-md-4">
  <label>
    Accession No <span className="text-danger">*</span>
  </label>
  <input
    type="text"
    className="form-control"
    name="accessionNo"
    value={formData.accessionNo}
    onChange={handleInputChange}
    maxLength={MAX_LENGTH}
    required
  />
</div>
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
      maxLength={MAX_LENGTH}
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
      maxLength={MAX_LENGTH}
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
    <input
      type="text"
      className="form-control"
      name="gender"
      value={formData.gender}
      onChange={handleInputChange}
      required
    />
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
        onChange={handleInputChange}
        required
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
      maxLength={MAX_LENGTH}
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
      maxLength={MAX_LENGTH}
      required
    />
  </div>

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

export default USGInvestigation;
