import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, {
  DEFAULT_ITEMS_PER_PAGE,
} from "../../../Components/Pagination";
import { MAS_BLOOD_INVENTORY_STATUS } from "../../../config/apiConfig";
import {
  getRequest,
  putRequest,
  postRequest,
} from "../../../service/apiService";
import {
  FETCH_BLOOD_INVENTORY_STATUS,
  STATUS,
  UPDATE_BLOOD_INVENTORY_STATUS_SUCCESS,
  ADD_BLOOD_INVENTORY_STATUS_SUCCESS,
  OPERATION_FAILED,
  UPDATE_STATUS_FAILED,
} from "../../../config/constants";

const BloodInventoryStatus = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    statusCode: "",
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

  const MAX_LENGTH = 50;

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const formatDate = (dateString) => {
    if (!dateString?.trim()) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const { response } = await getRequest(
        `${MAS_BLOOD_INVENTORY_STATUS}/getAll/${flag}`,
      );
      setData(response || []);
    } catch {
      showPopup(FETCH_BLOOD_INVENTORY_STATUS, "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = data.filter((rec) =>
    rec.statusCode?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const currentItems = filteredData.slice(
    (currentPage - 1) * DEFAULT_ITEMS_PER_PAGE,
    currentPage * DEFAULT_ITEMS_PER_PAGE,
  );

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const resetForm = () => {
    setFormData({ statusCode: "", description: "" });
    setIsFormValid(false);
    setEditingRecord(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    setIsFormValid(
      updated.statusCode.trim() !== "" && updated.description.trim() !== "",
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      if (editingRecord) {
        await putRequest(
          `${MAS_BLOOD_INVENTORY_STATUS}/update/${editingRecord.inventoryStatusId}`,
          {
            statusCode: formData.statusCode.trim(),
            description: formData.description.trim(),
          },
        );

        showPopup(UPDATE_BLOOD_INVENTORY_STATUS_SUCCESS, "success");
      } else {
        await postRequest(`${MAS_BLOOD_INVENTORY_STATUS}/create`, {
          statusCode: formData.statusCode.trim(),
          description: formData.description.trim(),
          status: "Y",
        });

        showPopup(ADD_BLOOD_INVENTORY_STATUS_SUCCESS, "success");
      }

      fetchData();
      handleCancel();
    } catch {
      showPopup(OPERATION_FAILED, "error");
    }
  };

  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({
      statusCode: rec.statusCode,
      description: rec.description || "",
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSwitchChange = (rec) => {
    setConfirmDialog({
      isOpen: true,
      record: rec,
      newStatus:
        rec.status?.toLowerCase() === STATUS.ACTIVE
          ? STATUS.INACTIVE
          : STATUS.ACTIVE,
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
        `${MAS_BLOOD_INVENTORY_STATUS}/status/${confirmDialog.record.inventoryStatusId}?status=${confirmDialog.newStatus}`,
      );

      showPopup(UPDATE_BLOOD_INVENTORY_STATUS_SUCCESS, "success");
      fetchData();
    } catch {
      showPopup(UPDATE_STATUS_FAILED, "error");
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
          <h4>Blood Inventory Status Master</h4>

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
                        type="button"
                        className="btn btn-success me-2"
                        onClick={() => {
                          setSearchQuery("");
                          fetchData(1);
                        }}
                      >
                        <i className="mdi mdi-view-list"></i> Show All
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
                    <th>Status Code</th>
                    <th>Description</th>
                    <th>Last Update Date</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>

                <tbody>
                  {currentItems.map((rec) => (
                    <tr key={rec.inventoryStatusId}>
                      <td>{rec.statusCode}</td>
                      <td>{rec.description}</td>
                      <td>{formatDate(rec.lastUpdateDate)}</td>

                      <td>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={
                              rec.status?.toLowerCase() === STATUS.ACTIVE
                            }
                            onChange={() => handleSwitchChange(rec)}
                          />

                          <label className="form-check-label ms-2">
                            {rec.status?.toLowerCase() === STATUS.ACTIVE
                              ? "Active"
                              : "Inactive"}
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
                <label>
                  Status Code <span className="text-danger">*</span>
                </label>

                <input
                  name="statusCode"
                  className="form-control"
                  value={formData.statusCode}
                  maxLength={MAX_LENGTH}
                  onChange={handleInputChange}
                  placeholder="status code"
                />
              </div>

              <div className="col-md-4">
                <label>
                  Description <span className="text-danger">*</span>
                </label>

                <textarea
                  name="description"
                  className="form-control"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Description"
                />
              </div>

              <div className="col-12 text-end">
                <button
                  type="submit"
                  className="btn btn-primary me-2"
                  disabled={!isFormValid}
                >
                  {editingRecord ? "Update" : "Save"}
                </button>

                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleCancel}
                >
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
                    {confirmDialog.newStatus === STATUS.ACTIVE
                      ? "activate"
                      : "deactivate"}{" "}
                    <strong>{confirmDialog.record?.statusCode}</strong>?
                  </div>

                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleConfirm(false)}
                    >
                      No
                    </button>

                    <button
                      className="btn btn-primary"
                      onClick={() => handleConfirm(true)}
                    >
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

export default BloodInventoryStatus;
