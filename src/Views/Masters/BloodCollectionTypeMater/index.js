
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_BLOOD_COLLECTION } from "../../../config/apiConfig";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, postRequest, putRequest } from "../../../service/apiService";
import {
  FETCH_BLOOD_COLLECTION,
  ADD_BLOOD_COLLECTION,
  UPDATE_BLOOD_COLLECTION,
  DUPLICATE_BLOOD_COLLECTION,
  FAIL_BLOOD_COLLECTION,
  UPDATE_FAIL_BLOOD_COLLECTION,
} from "../../../config/constants";


const BloodCollectionTypeMaster = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    collectionTypeCode: "",
    collectionTypeName: "",
    description: "",
  });
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [popupMessage, setPopupMessage] = useState(null);
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





  // Fetch API data
  const fetchData = async () => {
    setLoading(true);
    try {
      const { response } = await getRequest(`${MAS_BLOOD_COLLECTION}/getAll/0`);
      setData(response || []);
    } catch {
      showPopup(FETCH_BLOOD_COLLECTION, "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Search filter
  const filteredData = data.filter(
    (rec) =>
      rec.collectionTypeCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.collectionTypeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentItems = filteredData.slice(
    (currentPage - 1) * DEFAULT_ITEMS_PER_PAGE,
    currentPage * DEFAULT_ITEMS_PER_PAGE
  );

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Popup
  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  // Form input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);

    setIsFormValid(
      updated.collectionTypeCode.trim() !== "" &&
      updated.collectionTypeName.trim() !== ""
    );
  };

  const resetForm = () => {
    setFormData({ collectionTypeCode: "", collectionTypeName: "", description: "" });
    setIsFormValid(false);
    setEditingRecord(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  // Save — Add or Update
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    // Duplicate check
    const newCode = formData.collectionTypeCode.trim().toLowerCase();
    const newName = formData.collectionTypeName.trim().toLowerCase();
    const duplicate = data.find(
      (rec) =>
        (rec.collectionTypeCode?.trim().toLowerCase() === newCode ||
          rec.collectionTypeName?.trim().toLowerCase() === newName) &&
        (!editingRecord ||
          rec.collectionTypeId !== editingRecord.collectionTypeId)
    );

    if (duplicate) {
      showPopup(DUPLICATE_BLOOD_COLLECTION, "error");
      return;
    }

    try {
      if (editingRecord) {
        await putRequest(
          `${MAS_BLOOD_COLLECTION}/update/${editingRecord.collectionTypeId}`,
          formData
        );
        showPopup(UPDATE_BLOOD_COLLECTION, "success");
      } else {
        await postRequest(`${MAS_BLOOD_COLLECTION}/create`, {
          ...formData,
          status: "Y",
        });
        showPopup(ADD_BLOOD_COLLECTION, "success");
      }
      fetchData();
      handleCancel();
    } catch {
      showPopup(FAIL_BLOOD_COLLECTION, "error");
    }
  };

  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({
      collectionTypeCode: rec.collectionTypeCode,
      collectionTypeName: rec.collectionTypeName,
      description: rec.description,
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  // Status change
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
        `${MAS_BLOOD_COLLECTION}/status/${confirmDialog.record.collectionTypeId}?status=${confirmDialog.newStatus}`
      );
      showPopup(UPDATE_BLOOD_COLLECTION, "success");
      fetchData();
    } catch {
      showPopup(UPDATE_FAIL_BLOOD_COLLECTION, "error");
    } finally {
      setLoading(false);
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
    }
  };

  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Blood Collection Type Master</h4>
          <div className="d-flex">
            {!showForm && (
              <input
                style={{ width: "220px" }}
                className="form-control me-2"
                placeholder="Search Types"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            )}
            {!showForm ? (
              <>
                <button
                  className="btn btn-success me-2"
                  onClick={() => { resetForm(); setShowForm(true); }}
                >
                  Add
                </button>
                <button className="btn btn-success" onClick={fetchData}>
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
                    <th>Code</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Last Update Date</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((rec) => (
                    <tr key={rec.collectionTypeId}>
                      <td>{rec.collectionTypeCode}</td>
                      <td>{rec.collectionTypeName}</td>
                      <td>{rec.description}</td>
                      <td>{formatDate(rec.lastUpdateDate)}</td>

                      <td>
                        <div className="form-check form-switch">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={rec.status?.toLowerCase() === "y"}
                            onChange={() => handleSwitchChange(rec)}
                          />
                          <label className="form-check-label ms-2">
                            {rec.status?.toLowerCase() === "y"
                              ? "Active"
                              : "Inactive"}
                          </label>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-success btn-sm"
                          disabled={rec.status?.toLowerCase() !== "y"}
                          onClick={() => handleEdit(rec)}
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
                <label>Collection Type Code *</label>
                <input
                  className="form-control"
                  name="collectionTypeCode"
                  value={formData.collectionTypeCode}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-4">
                <label>Collection Type Name *</label>
                <input
                  className="form-control"
                  name="collectionTypeName"
                  value={formData.collectionTypeName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-4">
                <label>Description</label>
                <input
                  className="form-control"
                  name="description"
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
                    <strong>{confirmDialog.record?.collectionTypeName}</strong>?
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

export default BloodCollectionTypeMaster;