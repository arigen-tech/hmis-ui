import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import LoadingScreen from "../../../Components/Loading";
import { MAS_IPD_SERVICE_CATEGORY } from "../../../config/apiConfig";
import {
  FETCH_IPD_CATEGORY_ERR_MSG,
  SAVE_IPD_CATEGORY_SUCC_MSG,
  UPDATE_IPD_CATEGORY_SUCC_MSG,
  DUPLICATE_IPD_CATEGORY_MSG,
  FAILED_SAVE_IPD_CATEGORY_MSG,
  FAILED_UPDATE_IPD_CATEGORY_STATUS_MSG,
} from "../../../config/constants";

const IPDServiceCategory = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    categoryCode: "",
    categoryName: "",
    displayOrder: "",
    isSubCategoryRequired: "",
    isGstApplicable: "",
    gstPercentage: "",
  });
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    record: null,
    newStatus: "",
  });

  // --------------------------------------------------------------
  // API Calls
  // --------------------------------------------------------------
  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const response = await getRequest(`${MAS_IPD_SERVICE_CATEGORY}/getAll/${flag}`);
      if (response?.response) {
        setData(response.response);
      } else {
        throw new Error("Invalid response structure");
      }
    } catch (err) {
      showPopup(FETCH_IPD_CATEGORY_ERR_MSG, "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(0); // 0 = all categories (active and inactive)
  }, []);

  // --------------------------------------------------------------
  // Form Validation
  // --------------------------------------------------------------
  const validateForm = (values) => {
    const baseValid =
      values.categoryCode &&
      values.categoryName &&
      values.displayOrder &&
      values.isSubCategoryRequired &&
      values.isGstApplicable;
    if (!baseValid) return false;
    if (values.isGstApplicable === "y") {
      const percent = parseFloat(values.gstPercentage);
      return !isNaN(percent) && percent >= 0;
    }
    return true;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...formData, [name]: value };
    if (name === "isGstApplicable" && value === "n") {
      updated.gstPercentage = "0";
    }
    setFormData(updated);
    setIsFormValid(validateForm(updated));
  };

  // --------------------------------------------------------------
  // CRUD Handlers
  // --------------------------------------------------------------
  const resetForm = () => {
    setFormData({
      categoryCode: "",
      categoryName: "",
      displayOrder: "",
      isSubCategoryRequired: "",
      isGstApplicable: "",
      gstPercentage: "",
    });
    setIsFormValid(false);
  };

  // Callback for successful save/update: refresh data then hide form
  const handleSuccessAndClose = () => {
    fetchData(0); // reload table in background
    resetForm();
    setEditingRecord(null);
    setShowForm(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    // Local duplicate check (optional)
    const duplicate = data.some(
      (rec) =>
        (rec.categoryCode.toLowerCase() === formData.categoryCode.trim().toLowerCase() ||
          rec.categoryName.toLowerCase() === formData.categoryName.trim().toLowerCase()) &&
        (!editingRecord || rec.id !== editingRecord.id)
    );
    if (duplicate) {
      showPopup(DUPLICATE_IPD_CATEGORY_MSG, "error");
      return;
    }

    setLoading(true);
    const payload = {
      categoryCode: formData.categoryCode.trim(),
      categoryName: formData.categoryName.trim(),
      displayOrder: parseInt(formData.displayOrder, 10),
      isSubCategoryRequired: formData.isSubCategoryRequired,
      isGstApplicable: formData.isGstApplicable,
      gstPercentage:
        formData.isGstApplicable === "y"
          ? parseFloat(formData.gstPercentage)
          : 0,
    };

    try {
      if (editingRecord) {
        const response = await putRequest(
          `${MAS_IPD_SERVICE_CATEGORY}/updateById/${editingRecord.id}`,
          payload
        );
        if (response?.status === 200) {
          showPopup(UPDATE_IPD_CATEGORY_SUCC_MSG, "success", handleSuccessAndClose);
        } else {
          throw new Error(response?.message || "Update failed");
        }
      } else {
        const response = await postRequest(`${MAS_IPD_SERVICE_CATEGORY}/create`, payload);
        if (response?.status === 201 || response?.status === 200) {
          showPopup(SAVE_IPD_CATEGORY_SUCC_MSG, "success", handleSuccessAndClose);
        } else {
          throw new Error(response?.message || "Save failed");
        }
      }
    } catch (err) {
      console.error("Save error:", err);
      showPopup(err.response?.data?.message || FAILED_SAVE_IPD_CATEGORY_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({
      categoryCode: rec.categoryCode,
      categoryName: rec.categoryName,
      displayOrder: rec.displayOrder.toString(),
      isSubCategoryRequired: rec.isSubCategoryRequired,
      isGstApplicable: rec.isGstApplicable,
      gstPercentage: rec.gstPercentage?.toString() || "0",
    });
    setShowForm(true);
    setIsFormValid(true);
  };

  const handleStatusChange = (rec) => {
    setConfirmDialog({
      isOpen: true,
      record: rec,
      newStatus: rec.status?.toLowerCase() === "y" ? "n" : "y",
    });
  };

  const handleConfirmStatus = async (confirmed) => {
    if (!confirmed || !confirmDialog.record) {
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
      return;
    }

    const record = confirmDialog.record;
    const newStatus = confirmDialog.newStatus;
    setLoading(true);
    try {
      const response = await putRequest(
        `${MAS_IPD_SERVICE_CATEGORY}/status/${record.id}?status=${newStatus}`
      );
      if (response?.status === 200) {
        showPopup(
          `Category "${record.categoryName}" ${newStatus === "y" ? "activated" : "deactivated"} successfully!`,
          "success",
          () => fetchData(0) // already refreshes after status change
        );
      } else {
        throw new Error(response?.message || "Status update failed");
      }
    } catch (err) {
      showPopup(FAILED_UPDATE_IPD_CATEGORY_STATUS_MSG, "error");
    } finally {
      setLoading(false);
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
    }
  };

  // --------------------------------------------------------------
  // UI Helpers
  // --------------------------------------------------------------
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

  const handleCancel = () => {
    resetForm();
    setEditingRecord(null);
    setShowForm(false);
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchData(0);
  };

  // Search & Pagination
  const filteredData = (data || []).filter(
    (rec) =>
      rec.categoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.categoryCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">IPD Service Category</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm ? (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search"
                        aria-label="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <span className="input-group-text" id="search-icon">
                        <i className="fa fa-search"></i>
                      </span>
                    </div>
                  </form>
                ) : null}
                <div className="d-flex align-items-center">
                  {!showForm ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={() => {
                          resetForm();
                          setEditingRecord(null);
                          setShowForm(true);
                        }}
                        disabled={loading}
                      >
                        <i className="mdi mdi-plus"></i> Add
                      </button>
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={handleRefresh}
                        disabled={loading}
                      >
                        <i className="mdi mdi-refresh"></i> Show All
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      <i className="mdi mdi-arrow-left"></i> Back
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="card-body">
              {loading && !showForm ? (
                <LoadingScreen />
              ) : !showForm ? (
                <>
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Code</th>
                          <th>Name</th>
                          <th>Display Order</th>
                          <th>Subcategory Required</th>
                          <th>GST Applicable</th>
                          <th>GST Percentage</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((rec) => (
                            <tr key={rec.id}>
                              <td>{rec.categoryCode}</td>
                              <td>{rec.categoryName}</td>
                              <td>{rec.displayOrder}</td>
                              <td>{rec.isSubCategoryRequired === "y" ? "Yes" : "No"}</td>
                              <td>{rec.isGstApplicable === "y" ? "Yes" : "No"}</td>
                              <td>{rec.isGstApplicable === "y" ? rec.gstPercentage : "-"}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={rec.status?.toLowerCase() === "y"}
                                    onChange={() => handleStatusChange(rec)}
                                    id={`switch-${rec.id}`}
                                    disabled={loading}
                                  />
                                  <label className="form-check-label px-0" htmlFor={`switch-${rec.id}`}>
                                    {rec.status?.toLowerCase() === "y" ? "Active" : "Deactivated"}
                                  </label>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(rec)}
                                  disabled={rec.status?.toLowerCase() !== "y" || loading}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="text-center">
                              No IPD service categories found
                            </td>
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
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="row">
                    <div className="form-group col-md-4 mb-2">
                      <label>
                        Code <span className="text-danger">*</span>
                      </label>
                      <input
                        className="form-control mt-1"
                        name="categoryCode"
                        type="text"
                        value={formData.categoryCode}
                        onChange={handleInputChange}
                        required
                        disabled={loading || editingRecord}
                        placeholder="Enter code"
                      />
                    </div>
                    <div className="form-group col-md-4 mb-2">
                      <label>
                        Name <span className="text-danger">*</span>
                      </label>
                      <input
                        className="form-control mt-1"
                        name="categoryName"
                        type="text"
                        value={formData.categoryName}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                        placeholder="Enter name"
                      />
                    </div>
                    <div className="form-group col-md-4 mb-2">
                      <label>
                        Display Order <span className="text-danger">*</span>
                      </label>
                      <input
                        className="form-control mt-1"
                        name="displayOrder"
                        type="number"
                        value={formData.displayOrder}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                        placeholder="Enter order"
                      />
                    </div>
                    <div className="form-group col-md-4 mb-2">
                      <label>
                        Subcategory Required <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select mt-1"
                        name="isSubCategoryRequired"
                        value={formData.isSubCategoryRequired}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      >
                        <option value="">Select</option>
                        <option value="y">Yes</option>
                        <option value="n">No</option>
                      </select>
                    </div>
                    <div className="form-group col-md-4 mb-2">
                      <label>
                        GST Applicable <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select mt-1"
                        name="isGstApplicable"
                        value={formData.isGstApplicable}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      >
                        <option value="">Select</option>
                        <option value="y">Yes</option>
                        <option value="n">No</option>
                      </select>
                    </div>
                    <div className="form-group col-md-4 mb-2">
                      <label>
                        GST Percentage{" "}
                        {formData.isGstApplicable === "y" && <span className="text-danger">*</span>}
                      </label>
                      <input
                        className="form-control mt-1"
                        name="gstPercentage"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.gstPercentage}
                        onChange={handleInputChange}
                        required={formData.isGstApplicable === "y"}
                        disabled={loading || formData.isGstApplicable !== "y"}
                        placeholder="Enter percentage"
                      />
                    </div>
                  </div>
                  <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid || loading}
                    >
                      {loading ? "Saving..." : editingRecord ? "Update" : "Save"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleCancel}
                      disabled={loading}
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
                <div className="modal d-block">
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button
                          type="button"
                          className="close"
                          onClick={() => handleConfirmStatus(false)}
                        >
                          <span>&times;</span>
                        </button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to{" "}
                          {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                          <strong>{confirmDialog.record?.categoryName}</strong>?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleConfirmStatus(false)}
                        >
                          No
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleConfirmStatus(true)}
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
      </div>
    </div>
  );
};

export default IPDServiceCategory;