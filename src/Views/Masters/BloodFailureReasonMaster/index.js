import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, {
  DEFAULT_ITEMS_PER_PAGE,
} from "../../../Components/Pagination";
import { MAS_COMPONENT_FAILURE_REASON } from "../../../config/apiConfig";
import {
  getRequest,
  putRequest,
  postRequest,
} from "../../../service/apiService";
import {
  FETCH_FAILURE_REASON,
  DUPLICATE_FAILURE_REASON,
  UPDATE_FAILURE_REASON,
  CREATE_FAILURE_REASON,
  SAVE_FAILURE_REASON,
  STATUS_UPDATED,
  UPDATE_STATUS,
} from "../../../config/constants";

const BloodFailureReasonMaster = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    failureReasonCode: "",
    failureReasonName: "",
    description: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [data, setData] = useState([]);
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

  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const { response } = await getRequest(
        `${MAS_COMPONENT_FAILURE_REASON}/getAll/${flag}`,
      );
      setData(response || []);
    } catch {
      showPopup(FETCH_FAILURE_REASON, "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = data.filter((rec) =>
    rec.failureReasonName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const currentItems = filteredData.slice(
    (currentPage - 1) * DEFAULT_ITEMS_PER_PAGE,
    currentPage * DEFAULT_ITEMS_PER_PAGE,
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
    setFormData({
      failureReasonCode: "",
      failureReasonName: "",
      description: "",
    });
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
      (updated.failureReasonCode || "").trim() !== "" &&
        (updated.failureReasonName || "").trim() !== "",
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const newCode = formData.failureReasonCode.trim().toLowerCase();
    const newName = formData.failureReasonName.trim().toLowerCase();

    const duplicate = data.find(
      (rec) =>
        (rec.failureReasonCode?.trim().toLowerCase() === newCode ||
          rec.failureReasonName?.trim().toLowerCase() === newName) &&
        (!editingRecord ||
          rec.failureReasonId !== editingRecord.failureReasonId),
    );

    if (duplicate) {
      showPopup(DUPLICATE_FAILURE_REASON, "error");
      return;
    }

    try {
      if (editingRecord) {
        await putRequest(
          `${MAS_COMPONENT_FAILURE_REASON}/update/${editingRecord.failureReasonId}`,
          {
            failureReasonCode: formData.failureReasonCode.trim(),
            failureReasonName: formData.failureReasonName.trim(),
            description: formData.description.trim(),
          },
        );

        showPopup(UPDATE_FAILURE_REASON, "success");
      } else {
        await postRequest(`${MAS_COMPONENT_FAILURE_REASON}/create`, {
          failureReasonCode: formData.failureReasonCode.trim(),
          failureReasonName: formData.failureReasonName.trim(),
          description: formData.description.trim(),
          status: "Y",
        });

        showPopup(CREATE_FAILURE_REASON, "success");
      }

      fetchData();
      handleCancel();
    } catch {
      showPopup(SAVE_FAILURE_REASON, "error");
    }
  };

  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({
      failureReasonCode: rec.failureReasonCode,
      failureReasonName: rec.failureReasonName,
      description: rec.description || "",
    });

    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSwitchChange = (rec) => {
    setConfirmDialog({
      isOpen: true,
      record: rec,
      newStatus: rec.status?.toLowerCase() === "y" ? "n" : "y",
    });
  };

  const handleConfirm = async (confirmed) => {
    if (!confirmed) {
      setConfirmDialog({
        isOpen: false,
        record: null,
        newStatus: "",
      });

      return;
    }

    try {
      await putRequest(
        `${MAS_COMPONENT_FAILURE_REASON}/status/${confirmDialog.record.failureReasonId}?status=${confirmDialog.newStatus}`,
      );

      showPopup(STATUS_UPDATED, "success");

      fetchData();
    } catch {
      showPopup(UPDATE_STATUS, "error");
    } finally {
      setConfirmDialog({
        isOpen: false,
        record: null,
        newStatus: "",
      });
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
          <h4>Blood Failure Reason Master</h4>

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
                    <th>Failure Reason Code</th>
                    <th>Failure Reason Name</th>
                    <th>Description</th>
                    <th>Last Update Date</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>

                <tbody>
                  {currentItems.map((rec) => (
                    <tr key={rec.failureReasonId}>
                      <td>{rec.failureReasonCode}</td>
                      <td>{rec.failureReasonName}</td>
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
                            {rec.status?.toLowerCase() === "y"
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
              <div className="col-md-3">
                <label>
                  Failure Reason Code <span className="text-danger">*</span>
                </label>

                <input
                  name="failureReasonCode"
                  className="form-control"
                  value={formData.failureReasonCode}
                  onChange={handleInputChange}
                  placeholder="failure reason code"
                />
              </div>

              <div className="col-md-3">
                <label>
                  Failure Reason Name <span className="text-danger">*</span>
                </label>

                <input
                  name="failureReasonName"
                  className="form-control"
                  value={formData.failureReasonName}
                  onChange={handleInputChange}
                  placeholder="failure reason name"
                />
              </div>

              <div className="col-md-5">
                <label>Description</label>

                <textarea
                  name="description"
                  className="form-control"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="description"
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
                    {confirmDialog.newStatus === "y"
                      ? "activate"
                      : "deactivate"}
                    <strong> {confirmDialog.record?.failureReasonName}</strong>?
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

export default BloodFailureReasonMaster;
