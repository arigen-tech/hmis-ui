import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import { MAS_CROSS_MATCH_TYPE } from "../../../config/apiConfig";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, postRequest, putRequest } from "../../../service/apiService";
import { FETCH_CROSS_MATCH, DUPLICATE_CROSS_MATCH_TYPE, UPDATE_CROSS_MATCH_TYPE, ADD_CROSS_MATCH_TYPE, OPERATION_FAIL, FAIL_UPDATE_STATUS } from "../../../config/constants"

const CrossMatchType = () => {
  const [data, setData] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    turnaround: "",
    cost: "",
    emergencyAllowed: "",
    description: "",
  });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    name: "",
  });

  const MAX_LENGTH = 50;

  // Helper to format emergency allowed for display
  const formatEmergencyAllowed = (value) => {
    if (value === "Y") return "Yes";
    if (value === "N") return "No";
    return value || ""; // fallback for empty/unknown
  };

  // Fetch data from API
  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const { response } = await getRequest(`${MAS_CROSS_MATCH_TYPE}/getAll/${flag}`);
      const normalizedData = (response || []).map(item => ({
        ...item,
        status: item.status?.toLowerCase(),
      }));
      setData(normalizedData);
    } catch {
      showPopup(FETCH_CROSS_MATCH, "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(0);
  }, []);

  // Filtering
  const filteredData = data.filter(
    (item) =>
      item.crossMatchName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.crossMatchCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      code: record.crossMatchCode || "",
      name: record.crossMatchName || "",
      turnaround: record.turnaroundTimeMin?.toString() || "",
      cost: record.chargeAmount?.toString() || "",
      emergencyAllowed: record.isEmergencyAllowed?.toUpperCase() || "",
      description: record.description || "",
    });
    setShowForm(true);
    setIsFormValid(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    const updatedForm = {
      ...formData,
      [name]: value,
    };

    setFormData(updatedForm);

    setIsFormValid(
      updatedForm.code.trim() !== "" &&
      updatedForm.name.trim() !== "" &&
      updatedForm.description.trim() !== ""
    );
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingRecord(null);
    setFormData({
      code: "",
      name: "",
      turnaround: "",
      cost: "",
      emergencyAllowed: "",
      description: "",
    });
    setIsFormValid(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!isFormValid) return;
    
    setSaving(true);

    const newCode = formData.code.trim().toLowerCase();
    const newName = formData.name.trim().toLowerCase();

    const duplicate = data.find(
      (item) =>
        (item.crossMatchCode?.trim().toLowerCase() === newCode ||
          item.crossMatchName?.trim().toLowerCase() === newName) &&
        (!editingRecord || item.id !== editingRecord.id)
    );

    if (duplicate) {
      showPopup(DUPLICATE_CROSS_MATCH_TYPE, "error");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        crossMatchCode: formData.code.trim(),
        crossMatchName: formData.name.trim(),
        turnaroundTimeMin: parseInt(formData.turnaround, 10) || 0,
        chargeAmount: parseFloat(formData.cost) || 0,
        isEmergencyAllowed: formData.emergencyAllowed,
        description: formData.description.trim(),
      };

      if (editingRecord) {
        const response = await putRequest(
          `${MAS_CROSS_MATCH_TYPE}/update/${editingRecord.id}`,
          payload
        );

        if (response.status === 200) {
          setPopupMessage({
            message: UPDATE_CROSS_MATCH_TYPE,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              }
          });
        } else {
          throw new Error(response.message || "Update failed");
        }
      } else {
        const response = await postRequest(
          `${MAS_CROSS_MATCH_TYPE}/create`,
          {
            ...payload,
            status: "y",
          }
        );

        if (response.status === 201 || response.status === 200) {
          setPopupMessage({
            message: ADD_CROSS_MATCH_TYPE,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              }
          });
        } else {
          throw new Error(response.message || "Save failed");
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      showPopup(error.message || OPERATION_FAIL, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchChange = (id, currentStatus, name) => {
    const newStatus = currentStatus?.toLowerCase() === "y" ? "n" : "y";
    setConfirmDialog({
      isOpen: true,
      id,
      newStatus,
      name,
    });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.id) {
      setSaving(true);

      try {
        const response = await putRequest(
          `${MAS_CROSS_MATCH_TYPE}/status/${confirmDialog.id}?status=${confirmDialog.newStatus}`
        );

        if (response && response.status === 200) {
          setPopupMessage({
            message: `Cross match type "${confirmDialog.name}" ${
              confirmDialog.newStatus?.toLowerCase() === "y" ? "activated" : "deactivated"
            } successfully!`,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              fetchData(0);
              setCurrentPage(1);
            },
          });
        } else {
          throw new Error(response.message || "Failed to update status");
        }
      } catch (error) {
        console.error("Error updating status:", error);
        showPopup(error.message || FAIL_UPDATE_STATUS, "error");
      } finally {
        setSaving(false);
      }
    }

    setConfirmDialog({
      isOpen: false,
      id: null,
      newStatus: "",
      name: "",
    });
  };

  const showPopup = (message, type = "info", onCloseCallback = null) => {
    setPopupMessage({ message, type, onClose: () => {
                setPopupMessage(null);
                if (onCloseCallback) onCloseCallback();
            } });
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Cross Match Type Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm && (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search by Code / Name"
                        aria-label="Search"
                        value={searchQuery}
                        onChange={handleSearch}
                      />
                      <span className="input-group-text" id="search-icon">
                        <i className="fa fa-search"></i>
                      </span>
                    </div>
                  </form>
                )}

                <div className="d-flex align-items-center">
                  {!showForm ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={() => {
                          setShowForm(true);
                          setFormData({
                            code: "",
                            name: "",
                            turnaround: "",
                            cost: "",
                            emergencyAllowed: "",
                            description: "",
                          });
                          setEditingRecord(null);
                        }}
                      >
                        <i className="mdi mdi-plus"></i> Add
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
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={resetForm}
                    >
                      <i className="mdi mdi-arrow-left"></i> Back
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="card-body">
              {loading && !showForm && (
                <div className="text-center py-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}

              {!showForm ? (
                <div className="table-responsive packagelist">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Turnaround (min)</th>
                        <th>Cost</th>
                        <th>Emergency Allowed</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.crossMatchCode}</td>
                          <td>{item.crossMatchName}</td>
                          <td>{item.turnaroundTimeMin}</td>
                          <td>{item.chargeAmount}</td>
                          <td>{item.isEmergencyAllowed === "Y" ? "Yes" : "No"}</td>
                          <td>{item.description}</td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={item.status?.toLowerCase() === "y"}
                                onChange={() =>
                                  handleSwitchChange(
                                    item.id,
                                    item.status,
                                    item.crossMatchName
                                  )
                                }
                                id={`switch-${item.id}`}
                              />
                              <label
                                className="form-check-label ms-2"
                                htmlFor={`switch-${item.id}`}
                              >
                                {item.status?.toLowerCase() === "y" ? "Active" : "Inactive"}
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
                      ))}
                    </tbody>
                  </table>

                  {filteredData.length > 0 && (
                    <Pagination
                      totalItems={filteredData.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </div>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="col-md-4">
                    <label>
                      Code <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="code"
                      className="form-control"
                      value={formData.code}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label>
                      Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      placeholder="Enter cross match type name"
                      value={formData.name}
                      maxLength={MAX_LENGTH}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label>Turnaround (min)</label>
                    <input
                      type="text"
                      name="turnaround"
                      className="form-control"
                      placeholder="Enter turnaround time"
                      value={formData.turnaround}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-4">
                    <label>Cost</label>
                    <input
                      type="text"
                      name="cost"
                      className="form-control"
                      placeholder="Enter cost"
                      value={formData.cost}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-4">
                    <label>Emergency Allowed</label>
                    <select
                      name="emergencyAllowed"
                      className="form-select"
                      value={formData.emergencyAllowed}
                      onChange={handleInputChange}
                    >
                      <option value="">Select</option>
                      <option value="Y">Yes</option>
                      <option value="N">No</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label>
                      Description <span className="text-danger">*</span>
                    </label>
                    <textarea
                      name="description"
                      className="form-control"
                      placeholder="Enter description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                    />
                  </div>

                  <div className="col-md-12 d-flex justify-content-end mt-3">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid || saving}
                    >
                      {saving ? "Saving..." : editingRecord ? "Update" : "Save"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {popupMessage && (
                <Popup
                  message={popupMessage.message}
                  type={popupMessage.type}
                  onClose={popupMessage.onClose}
                />
              )}

              {confirmDialog.isOpen && (
                <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                  <div className="modal-dialog" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button
                          type="button"
                          className="close"
                          onClick={() => handleConfirm(false)}
                        >
                          <span>&times;</span>
                        </button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to{" "}
                          {confirmDialog.newStatus?.toLowerCase() === "y" ? "activate" : "deactivate"}{" "}
                          <strong>{confirmDialog.name}</strong>?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleConfirm(false)}
                        >
                          No
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleConfirm(true)}
                          disabled={saving}
                        >
                          {saving ? "Processing..." : "Yes"}
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

export default CrossMatchType;