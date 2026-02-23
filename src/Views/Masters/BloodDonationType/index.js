
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { MAS_BLOOD_DONATION_TYPE } from "../../../config/apiConfig";
import { getRequest, postRequest, putRequest } from "../../../service/apiService";
import {
  FETCH_BLOOD_DONATION,
  DUPLICATE_BLOOD_DONATION,
  UPDATE_BLOOD_DONATION,
  ADD_BLOOD_DONATION,
  FAIL_BLOOD_DONATION,
  UPDATE_FAIL_BLOOD_DONATION,
} from "../../../config/constants";


const BloodDonationType = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    donationTypeCode: "",
    donationTypeName: "",
    description: "",
  });
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


  const MAX_LENGTH = 10

  /* ---------------- FORMAT DATE ---------------- */
  const formatDate = (dateString) => {
    if (!dateString?.trim()) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  /* ---------------- FETCH ---------------- */
  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const { response } = await getRequest(`${MAS_BLOOD_DONATION_TYPE}/getAll/${flag}`);
      setData(response || []);
    } catch {
      showPopup(FETCH_BLOOD_DONATION, "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ---------------- SEARCH ---------------- */
  const filteredData = data.filter((rec) =>
    (rec?.donationTypeName ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentItems = filteredData.slice(
    (currentPage - 1) * DEFAULT_ITEMS_PER_PAGE,
    currentPage * DEFAULT_ITEMS_PER_PAGE
  );

  /* ---------------- HANDLERS ---------------- */
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    setIsFormValid(
      updated.donationTypeCode.trim() !== "" && updated.donationTypeName.trim() !== ""
    );
  };

  const resetForm = () => {
    setFormData({ donationTypeCode: "", donationTypeName: "", description: "" });
    setIsFormValid(false);
    setEditingRecord(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  /* ---------------- SAVE / ADD / EDIT ---------------- */
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    // Duplicate check (case-insensitive)
    const normalized = formData.donationTypeName.trim().toLowerCase();
    const duplicate = data.find(
      (rec) =>
        rec.donationTypeName?.trim().toLowerCase() === normalized &&
        (!editingRecord || rec.id !== editingRecord.id)
    );

    if (duplicate) {
      showPopup(DUPLICATE_BLOOD_DONATION, "error");
      return;
    }

    try {
      if (editingRecord) {
        await putRequest(
          `${MAS_BLOOD_DONATION_TYPE}/update/${editingRecord.donationTypeId}`,
          { ...editingRecord, ...formData }
        );
        showPopup(UPDATE_BLOOD_DONATION, "success");
      } else {
        await postRequest(`${MAS_BLOOD_DONATION_TYPE}/create`, {
          ...formData,
        });
        showPopup(ADD_BLOOD_DONATION, "success");
      }
      fetchData();
      handleCancel();
    } catch {
      showPopup(FAIL_BLOOD_DONATION, "error");
    }
  };

  /* ---------------- EDIT ---------------- */
  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({
      donationTypeCode: rec.donationTypeCode,
      donationTypeName: rec.donationTypeName,
      description: rec.description,
    });
    setShowForm(true);
    setIsFormValid(true);
  };

  /* ---------------- STATUS CHANGE ---------------- */
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
        `${MAS_BLOOD_DONATION_TYPE}/status/${confirmDialog.record.donationTypeId}?status=${confirmDialog.newStatus}`
      );
      showPopup(UPDATE_BLOOD_DONATION, "success");
      fetchData();
    } catch {
      showPopup(UPDATE_FAIL_BLOOD_DONATION, "error");
    } finally {
      setLoading(false);
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
    }
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Blood Donation Type Master</h4>

          <div className="d-flex">
            {!showForm && (
              <input
                style={{ width: "220px" }}
                className="form-control me-2"
                placeholder="Search Blood Donation Type"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            )}
            {!showForm ? (
              <>
                <button
                  className="btn btn-success me-2"
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                >
                  Add
                </button>
                <button
                  className="btn btn-success"
                  onClick={() => {
                    setSearchQuery("");
                    fetchData();
                  }}
                >
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
                    <th>Donation Code</th>
                    <th>Donation Type</th>
                    <th>Description</th>
                    <th>Last Update</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((rec) => (
                    <tr key={rec.id}>
                      <td>{rec.donationTypeCode}</td>
                      <td>{rec.donationTypeName}</td>
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
              <div className="col-md-4">
                <label>Donation Code *</label>
                <input
                  name="donationTypeCode"
                  className="form-control"
                  value={formData.donationTypeCode}
                  onChange={handleInputChange}
                  maxLength={MAX_LENGTH}
                />
              </div>
              <div className="col-md-4">
                <label>Donation Type *</label>
                <input
                  name="donationTypeName"
                  className="form-control"
                  value={formData.donationTypeName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-4">
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
                    <strong>{confirmDialog.record?.donationTypeName}</strong>?
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

export default BloodDonationType;