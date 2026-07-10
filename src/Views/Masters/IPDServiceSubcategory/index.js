import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const ServiceSubcategory = () => {
  const [data, setData] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [formData, setFormData] = useState({
    subcategoryId: "",
    categoryId: "",
    subcategoryCode: "",
    subcategoryName: "",
  });
  const [loading, setLoading] = useState(false);
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
  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE;

  const dummyCategories = [
    { categoryId: 1, categoryName: "Consultation" },
    { categoryId: 2, categoryName: "Procedures" },
    { categoryId: 3, categoryName: "Tests" },
    { categoryId: 4, categoryName: "Medicines" },
    { categoryId: 5, categoryName: "Accommodation" },
  ];

  const dummyData = [
    { subcategoryId: 1, categoryId: 1, subcategoryCode: "SC001", subcategoryName: "General Consultation", status: "y" },
    { subcategoryId: 2, categoryId: 2, subcategoryCode: "SC002", subcategoryName: "Surgical Procedure", status: "y" },
    { subcategoryId: 3, categoryId: 3, subcategoryCode: "SC003", subcategoryName: "Blood Test", status: "n" },
    { subcategoryId: 4, categoryId: 4, subcategoryCode: "SC004", subcategoryName: "Antibiotics", status: "y" },
    { subcategoryId: 5, categoryId: 5, subcategoryCode: "SC005", subcategoryName: "Private Room", status: "n" },
  ];

  useEffect(() => {
    setData(dummyData);
    setCategoryOptions(dummyCategories);
  }, []);

  const getCategoryName = (categoryId) => {
    const cat = categoryOptions.find(c => c.categoryId === categoryId);
    return cat ? cat.categoryName : "";
  };

  const filteredData = (data || []).filter((rec) =>
    (rec?.subcategoryName || "")
      .toLowerCase()
      .includes((searchQuery || "").toLowerCase()) ||
    (rec?.subcategoryCode || "")
      .toLowerCase()
      .includes((searchQuery || "").toLowerCase())
  );

  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

  const isDuplicate = () => {
    return data.some((rec) => {
      if (editingRecord && rec.subcategoryId === editingRecord.subcategoryId)
        return false;
      return (
        rec.subcategoryCode.toLowerCase() === formData.subcategoryCode.toLowerCase() ||
        rec.subcategoryName.toLowerCase() === formData.subcategoryName.toLowerCase()
      );
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    if (isDuplicate()) {
      showPopup("Duplicate entry: Code or Name already exists.", "error");
      return;
    }

    setLoading(true);
    try {
      if (editingRecord) {
        const updated = data.map((item) =>
          item.subcategoryId === editingRecord.subcategoryId
            ? { ...item, ...formData }
            : item
        );
        setData(updated);
        showPopup("Record updated successfully!", "success", () => {
          handleCancel();
        });
      } else {
        const newRecord = {
          subcategoryId: Date.now(),
          ...formData,
          status: "y",
        };
        setData([newRecord, ...data]);
        showPopup("Record added successfully!", "success", () => {
          handleCancel();
        });
      }
    } catch (error) {
      showPopup("Save Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({
      subcategoryId: rec.subcategoryId,
      categoryId: rec.categoryId,
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

  const showPopup = (message, type, onClose) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
        if (onClose) onClose();
      },
    });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.record) {
      setLoading(true);
      try {
        const updated = data.map((item) =>
          item.subcategoryId === confirmDialog.record.subcategoryId
            ? { ...item, status: confirmDialog.newStatus }
            : item
        );
        setData(updated);
        setPopupMessage({
          message: `Service Subcategory ${
            confirmDialog.newStatus?.toLowerCase() === "y"
              ? "activated"
              : "deactivated"
          } successfully!`,
          type: "success",
          onClose: () => {
            setPopupMessage(null);
            setCurrentPage(1);
          },
        });
      } catch (error) {
        showPopup("Failed to update status", "error");
      } finally {
        setLoading(false);
      }
    }
    setConfirmDialog({
      isOpen: false,
      record: null,
      newStatus: "",
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
    setData(dummyData);
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Service Subcategory</h4>
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
                ) : (
                  <></>
                )}
                <div className="d-flex align-items-center ms-auto">
                  {!showForm ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={() => setShowForm(true)}
                        disabled={loading}
                      >
                        <i className="mdi mdi-plus"></i> Add
                      </button>
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={handleRefresh}
                      >
                        <i className="mdi mdi-view-list"></i> Show All
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
              {!showForm ? (
                <>
                  {loading && <div className="text-center">Loading...</div>}
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Subcategory ID</th>
                          <th>Category</th>
                          <th>Subcategory Code</th>
                          <th>Subcategory Name</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.map((rec) => (
                          <tr key={rec.subcategoryId}>
                            <td>{rec.subcategoryId}</td>
                            <td>{getCategoryName(rec.categoryId)}</td>
                            <td>{rec.subcategoryCode}</td>
                            <td>{rec.subcategoryName}</td>
                            <td>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={rec.status?.toLowerCase() === "y"}
                                  onChange={() => handleStatusChange(rec)}
                                  id={`switch-${rec.subcategoryId}`}
                                  disabled={loading}
                                />
                                <label className="form-check-label px-0" htmlFor={`switch-${rec.subcategoryId}`}>
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
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredData.length > 0 && (
                    <Pagination
                      totalItems={filteredData.length}
                      itemsPerPage={itemsPerPage}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                  {filteredData.length === 0 && !loading && (
                    <div className="text-center mt-3">No records found</div>
                  )}
                </>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="row">
                    <div className="form-group col-md-4">
                      <label>Category <span className="text-danger">*</span></label>
                      <select
                        className="form-select mt-1"
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      >
                        <option value="">Select Category</option>
                        {categoryOptions.map((option) => (
                          <option key={option.categoryId} value={option.categoryId}>
                            {option.categoryName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group col-md-4">
                      <label>Subcategory Code <span className="text-danger">*</span></label>
                      <input
                        className="form-control mt-1"
                        name="subcategoryCode"
                        type="text"
                        value={formData.subcategoryCode}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                        placeholder="Enter code"
                      />
                    </div>

                    <div className="form-group col-md-4">
                      <label>Subcategory Name <span className="text-danger">*</span></label>
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

              {popupMessage && <Popup {...popupMessage} />}
            </div>
          </div>
        </div>
      </div>

      {confirmDialog.isOpen && (
        <div className="modal d-block">
          <div className="modal-dialog">
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
                  {confirmDialog.newStatus?.toLowerCase() === "y"
                    ? "activate"
                    : "deactivate"}{" "}
                  <strong>{confirmDialog.record?.subcategoryName}</strong>?
                </p>
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
  );
};

export default ServiceSubcategory;