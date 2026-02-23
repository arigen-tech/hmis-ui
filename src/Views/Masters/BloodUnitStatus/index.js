
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_BLOOD_UNIT } from "../../../config/apiConfig";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import {FETCH_BLOOD_UNIT,DUPLICATE_BLOOD_UNIT,UPDATE_BLOOD_UNIT,ADD_BLOOD_UNIT,FAIL_BLOOD_UNIT,UPDATE_FAIL_BLOOD_UNIT, } from "../../../config/constants";



const BloodUnitStatus = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    statusCode: "",
    statusName: "",
    description: "",
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

  // Format date utility
  const formatDate = (dateString) => {
    if (!dateString?.trim()) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Fetch data
  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const { response } = await getRequest(`${MAS_BLOOD_UNIT}/getAll/${flag}`);
      setData(response || []);
    } catch {
      showPopup(FETCH_BLOOD_UNIT, "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Search & Pagination
  const filteredData = data.filter((rec) =>
    rec.statusName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentItems = filteredData.slice(
    (currentPage - 1) * DEFAULT_ITEMS_PER_PAGE,
    currentPage * DEFAULT_ITEMS_PER_PAGE
  );

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Popup helper
  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  // Form reset
  const resetForm = () => {
    setFormData({ statusCode: "", statusName: "", description: "" });
    setIsFormValid(false);
    setEditingRecord(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  // Form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    setIsFormValid(updated.statusCode.trim() !== "" && updated.statusName.trim() !== "");
  };

  // Save (Add or Update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const newCode = formData.statusCode.trim().toLowerCase();
    const newName = formData.statusName.trim().toLowerCase();

    const duplicate = data.find(
      (rec) =>
        (rec.statusCode?.trim().toLowerCase() === newCode ||
          rec.statusName?.trim().toLowerCase() === newName) &&
        (!editingRecord || rec.statusId !== editingRecord.statusId)
    );

    if (duplicate) {
      showPopup(DUPLICATE_BLOOD_UNIT, "error");
      return;
    }

    try {
      if (editingRecord) {
        await putRequest(
          `${MAS_BLOOD_UNIT}/update/${editingRecord.statusId}`,
          {
            statusCode: formData.statusCode.trim(),
            statusName: formData.statusName.trim(),
            description: formData.description.trim(),
          }
        );
        showPopup(UPDATE_BLOOD_UNIT, "success");
      } else {
        await postRequest(`${MAS_BLOOD_UNIT}/create`, {
          statusCode: formData.statusCode.trim(),
          statusName: formData.statusName.trim(),
          description: formData.description.trim(),
          status: "Y",
        });
        showPopup(ADD_BLOOD_UNIT, "success");
      }
      fetchData();
      handleCancel();
    } catch {
      showPopup(FAIL_BLOOD_UNIT, "error");
    }
  };

  // Edit button handler
  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({
      statusCode: rec.statusCode,
      statusName: rec.statusName,
      description: rec.description || "",
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  // Status toggle confirmation
  const handleSwitchChange = (rec) => {
    setConfirmDialog({
      isOpen: true,
      record: rec,
      newStatus: rec.status?.toLowerCase() === "y" ? "n" : "y",
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
        `${MAS_BLOOD_UNIT}/status/${confirmDialog.record.statusId}?status=${confirmDialog.newStatus}`
      );
      showPopup(UPDATE_BLOOD_UNIT, "success");
      fetchData();
    } catch {
      showPopup(UPDATE_FAIL_BLOOD_UNIT, "error");
    } finally {
      setLoading(false);
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
    }
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchData();
  };

  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Blood Unit Status</h4>
          <div className="d-flex">
            {!showForm && (
              <input
                style={{ width: "220px" }}
                className="form-control me-2"
                placeholder="Search"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            )}
            {!showForm ? (
              <>
                <button className="btn btn-success me-2" onClick={() => { resetForm(); setShowForm(true); }}>
                  Add
                </button>
                <button className="btn btn-success" onClick={handleRefresh}>
                  Show All
                </button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={handleCancel}>
                Back
              </button>
            )}
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <LoadingScreen />
          ) : !showForm ? (
            <>
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Unit Code</th>
                    <th>Unit Status</th>
                    <th>Description</th>
                    <th>Last Update Date</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((rec) => (
                    <tr key={rec.statusId}>
                      <td>{rec.statusCode}</td>
                      <td>{rec.statusName}</td>
                      <td>{rec.description}</td>
                      <td>{formatDate(rec.lastUpdateDate)}</td>
                      <td>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={rec.status?.toLowerCase() === "y"}
                            onChange={() => handleSwitchChange(rec)}
                          />
                          <label className="form-check-label ms-2">
                            {rec.status?.toLowerCase() === "y" ? "Active" : "Inactive"}
                          </label>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleEdit(rec)}
                          disabled={rec.status?.toLowerCase() !== "y"}
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
            <form onSubmit={handleSave} className="row g-3">
              <div className="col-md-3">
                <label>Unit Code <span className="text-danger">*</span></label>
                <input
                  name="statusCode"
                  className="form-control"
                  value={formData.statusCode}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-3">
                <label>Unit Status <span className="text-danger">*</span></label>
                <input
                  name="statusName"
                  className="form-control"
                  value={formData.statusName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-3">
                <label>Description</label>
                <input
                  name="description"
                  className="form-control"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              <div className="col-12 text-end">
                <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                  Save
                </button>
                <button type="button" className="btn btn-danger" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {popupMessage && <Popup {...popupMessage} />}

          {confirmDialog.isOpen && (
            <div className="modal d-block">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-body">
                    Are you sure you want to{" "}
                    {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                    <strong>{confirmDialog.record?.statusName}</strong>?
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => handleConfirm(false)}>
                      No
                    </button>
                    <button className="btn btn-primary" onClick={() => handleConfirm(true)}>
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
  );
};

export default BloodUnitStatus;