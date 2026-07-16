import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import LoadingScreen from "../../../Components/Loading";
import {
  MAS_IPD_SERVICE_SUBCATEGORY,
  MAS_IPD_SERVICE_CATEGORY,
} from "../../../config/apiConfig";
import {
  FETCH_IPD_SUBCATEGORY_ERR_MSG,
  SAVE_IPD_SUBCATEGORY_SUCC_MSG,
  UPDATE_IPD_SUBCATEGORY_SUCC_MSG,
  DUPLICATE_IPD_SUBCATEGORY_MSG,
  FAILED_SAVE_IPD_SUBCATEGORY_MSG,
  FAILED_UPDATE_IPD_SUBCATEGORY_STATUS_MSG,
  FETCH_IPD_CATEGORY_DROPDOWN_ERR_MSG,
} from "../../../config/constants";

const ServiceSubcategory = () => {
  const [data, setData] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    subcategoryId: "",
    categoryId: "",
    subcategoryCode: "",
    subcategoryName: "",
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

  // ---------------------------------------------------------------------
  // API Calls
  // ---------------------------------------------------------------------
  const fetchCategories = async () => {
    try {
      const response = await getRequest(`${MAS_IPD_SERVICE_CATEGORY}/getAll/1`); // flag=1 → active only
      if (response?.response) {
        const options = response.response.map((cat) => ({
          categoryId: cat.id,
          categoryName: cat.categoryName,
        }));
        setCategoryOptions(options);
      } else {
        throw new Error("Invalid response for categories");
      }
    } catch (err) {
      showPopup(FETCH_IPD_CATEGORY_DROPDOWN_ERR_MSG, "error");
      console.error("Fetch categories error:", err);
    }
  };

  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const response = await getRequest(`${MAS_IPD_SERVICE_SUBCATEGORY}/getAll/${flag}`);
      if (response?.response) {
        setData(response.response);
      } else {
        throw new Error("Invalid response structure");
      }
    } catch (err) {
      showPopup(FETCH_IPD_SUBCATEGORY_ERR_MSG, "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();   // load dropdown
    fetchData(0);        // 0 = all subcategories (active + inactive)
  }, []);

  // ---------------------------------------------------------------------
  // Form Validation
  // ---------------------------------------------------------------------
  const validateForm = (values) => {
    return values.categoryId && values.subcategoryCode && values.subcategoryName;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...formData, [name]: value };
    setFormData(updatedForm);
    setIsFormValid(validateForm(updatedForm));
  };

  const resetForm = () => {
    setFormData({
      subcategoryId: "",
      categoryId: "",
      subcategoryCode: "",
      subcategoryName: "",
    });
    setIsFormValid(false);
  };

  // ---------------------------------------------------------------------
  // CRUD Handlers
  // ---------------------------------------------------------------------
  const handleSuccessAndClose = () => {
    fetchData(0);           // refresh table
    resetForm();
    setEditingRecord(null);
    setShowForm(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    // Local duplicate check
    const duplicate = data.some(
      (rec) =>
        (rec.subcategoryCode.toLowerCase() === formData.subcategoryCode.trim().toLowerCase() ||
          rec.subcategoryName.toLowerCase() === formData.subcategoryName.trim().toLowerCase()) &&
        (!editingRecord || rec.id !== editingRecord.id)
    );
    if (duplicate) {
      showPopup(DUPLICATE_IPD_SUBCATEGORY_MSG, "error");
      return;
    }

    setLoading(true);
    const payload = {
      categoryId: parseInt(formData.categoryId, 10),
      subcategoryCode: formData.subcategoryCode.trim(),
      subcategoryName: formData.subcategoryName.trim(),
    };

    try {
      if (editingRecord) {
        const response = await putRequest(
          `${MAS_IPD_SERVICE_SUBCATEGORY}/updateById/${editingRecord.id}`,
          payload
        );
        if (response?.status === 200) {
          showPopup(UPDATE_IPD_SUBCATEGORY_SUCC_MSG, "success", handleSuccessAndClose);
        } else {
          throw new Error(response?.message || "Update failed");
        }
      } else {
        const response = await postRequest(`${MAS_IPD_SERVICE_SUBCATEGORY}/create`, payload);
        if (response?.status === 201 || response?.status === 200) {
          showPopup(SAVE_IPD_SUBCATEGORY_SUCC_MSG, "success", handleSuccessAndClose);
        } else {
          throw new Error(response?.message || "Save failed");
        }
      }
    } catch (err) {
      console.error("Save error:", err);
      showPopup(err.response?.data?.message || FAILED_SAVE_IPD_SUBCATEGORY_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({
      subcategoryId: rec.id,
      categoryId: rec.categoryId?.toString() || "",
      subcategoryCode: rec.subcategoryCode,
      subcategoryName: rec.subcategoryName,
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
        `${MAS_IPD_SERVICE_SUBCATEGORY}/status/${record.id}?status=${newStatus}`
      );
      if (response?.status === 200) {
        showPopup(
          `Subcategory "${record.subcategoryName}" ${
            newStatus === "y" ? "activated" : "deactivated"
          } successfully!`,
          "success",
          () => fetchData(0)
        );
      } else {
        throw new Error(response?.message || "Status update failed");
      }
    } catch (err) {
      showPopup(FAILED_UPDATE_IPD_SUBCATEGORY_STATUS_MSG, "error");
    } finally {
      setLoading(false);
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
    }
  };

  // ---------------------------------------------------------------------
  // UI Helpers
  // ---------------------------------------------------------------------
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
      rec.subcategoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.subcategoryCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

  const getCategoryName = (catId) => {
    const cat = categoryOptions.find((c) => c.categoryId === catId);
    return cat ? cat.categoryName : "";
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">IPD Service Subcategory</h4>
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
                <div className="d-flex align-items-center ms-auto">
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
                          <th>Subcategory Code</th>
                          <th>Subcategory Name</th>
                          <th>Category</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((rec) => (
                            <tr key={rec.id}>
                              <td>{rec.subcategoryCode}</td>
                              <td>{rec.subcategoryName}</td>
                              <td>{getCategoryName(rec.categoryId)}</td>
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
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${rec.id}`}
                                  >
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
                            <td colSpan="5" className="text-center">
                              No subcategories found
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
                        Category <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select mt-1"
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      >
                        <option value="">Select Category</option>
                        {categoryOptions.map((opt) => (
                          <option key={opt.categoryId} value={opt.categoryId}>
                            {opt.categoryName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group col-md-4 mb-2">
                      <label>
                        Subcategory Code <span className="text-danger">*</span>
                      </label>
                      <input
                        className="form-control mt-1"
                        name="subcategoryCode"
                        type="text"
                        value={formData.subcategoryCode}
                        onChange={handleInputChange}
                        required
                        disabled={loading || editingRecord}
                        placeholder="Enter code"
                      />
                    </div>
                    <div className="form-group col-md-4 mb-2">
                      <label>
                        Subcategory Name <span className="text-danger">*</span>
                      </label>
                      <input
                        className="form-control mt-1"
                        name="subcategoryName"
                        type="text"
                        value={formData.subcategoryName}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                        placeholder="Enter name"
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
                          <strong>{confirmDialog.record?.subcategoryName}</strong>?
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

export default ServiceSubcategory;