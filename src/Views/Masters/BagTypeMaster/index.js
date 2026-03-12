
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import { MAS_BLOOD_BAG_TYPE } from "../../../config/apiConfig";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, postRequest, putRequest } from "../../../service/apiService";
import {
  FETCH_BAG_TYPE_MASTER,
  DUPLICATE_BAG_TYPE_MASTER,
  UPDATE_BAG_TYPE_MASTER,
  ADD_BAG_TYPE_MASTER,
  UPDATE_FAIL_BAG_TYPE_MASTER
} from "../../../config/constants";


const BagTypeMaster = () => {
  const [data, setData] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingBagType, setEditingBagType] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    bagTypeCode: "",
    bagTypeName: "",
    description: "",
    maxComponents: "",
  });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    bagTypeId: null,
    newStatus: "",
    bagTypeName: "",
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };


  // Fetch data from API
  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const { response } = await getRequest(`${MAS_BLOOD_BAG_TYPE}/getAll/${flag}`);
      setData(response || []);
    } catch {
      showPopup(FETCH_BAG_TYPE_MASTER, "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData(0);
  }, []);




  const filteredData = data.filter(
    (bagType) =>
      bagType.bagTypeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bagType.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bagType.bagTypeCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);


  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };



  const handleEdit = (bagType) => {
    setEditingBagType(bagType);
    setFormData({
      bagTypeCode: bagType.bagTypeCode || "",
      bagTypeName: bagType.bagTypeName || "",
      description: bagType.description || "",
      maxComponents: bagType.maxComponents || "",
    });
    setShowForm(true);
  };



  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);



  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));

    const bagTypeCode = id === "bagTypeCode" ? value : formData.bagTypeCode;
    const bagTypeName = id === "bagTypeName" ? value : formData.bagTypeName;
    setIsFormValid(bagTypeCode.trim() !== "" && bagTypeName.trim() !== "");
  };



  const resetForm = () => {
    setShowForm(false);
    setEditingBagType(null);
    setFormData({ bagTypeCode: "", bagTypeName: "", description: "", maxComponents: "" });
    setIsFormValid(false);
  };



  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const newCode = formData.bagTypeCode.trim().toLowerCase();
    const newName = formData.bagTypeName.trim().toLowerCase();

    const duplicate = data.find(
      (item) =>
        (item.bagTypeCode?.trim().toLowerCase() === newCode ||
          item.bagTypeName?.trim().toLowerCase() === newName) &&
        (!editingBagType || item.bagTypeId !== editingBagType.bagTypeId)
    );

    if (duplicate) {
      showPopup(DUPLICATE_BAG_TYPE_MASTER, "error");
      return;
    }

    setLoading(true);
    try {
      if (editingBagType) {
        await putRequest(`${MAS_BLOOD_BAG_TYPE}/update/${editingBagType.bagTypeId}`, formData);
        showPopup(UPDATE_BAG_TYPE_MASTER, "success");
      } else {
        await postRequest(`${MAS_BLOOD_BAG_TYPE}/create`, {
          ...formData,
          status: "y",
        });
        showPopup(ADD_BAG_TYPE_MASTER, "success");
      }
      await fetchData(0);
      resetForm();
    } catch (error) {
      showPopup(error.message || "Operation failed", "error");
    } finally {
      setLoading(false);
    }
  };


  const handleSwitchChange = (bagTypeId, currentStatus) => {
    const bagType = data.find((b) => b.bagTypeId === bagTypeId);
    const newStatus = currentStatus === "y" ? "n" : "y";
    setConfirmDialog({
      isOpen: true,
      bagTypeId,
      newStatus,
      bagTypeName: bagType?.bagTypeName || "",
    });
  };



  const handleConfirm = async (confirmed) => {
    const { bagTypeId, newStatus } = confirmDialog;
    setConfirmDialog({ isOpen: false, bagTypeId: null, newStatus: "", bagTypeName: "" });

    if (!confirmed || !bagTypeId) return;

    setLoading(true);
    try {
      await putRequest(
        `${MAS_BLOOD_BAG_TYPE}/status/${bagTypeId}?status=${newStatus}`
      );
      showPopup(
        `Bag type ${newStatus === "y" ? "activated" : "deactivated"} successfully!`,
        "success"
      );
      await fetchData(0);
    } catch (error) {
      showPopup(error.message || UPDATE_FAIL_BAG_TYPE_MASTER, "error");
    } finally {
      setLoading(false);
    }
  };


  const showPopup = (message, type = "info") => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Bag Type Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm && (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search Bag Types"
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
                          setFormData({ bagTypeCode: "", bagTypeName: "", description: "", maxComponents: "" });
                          setEditingBagType(null);
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
                        <th>Bag Type Code</th>
                        <th>Bag Type Name</th>
                        <th>Description</th>
                        <th>Max Components</th>
                        <th>Last Updated</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>

                    <tbody>
                      {currentItems.map((rec) => (
                        <tr key={rec.bagTypeId}>
                          <td>{rec.bagTypeCode}</td>
                          <td>{rec.bagTypeName}</td>
                          <td>{rec.description}</td>
                          <td>{rec.maxComponents}</td>
                          <td>{formatDate(rec.lastUpdateDate)}</td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={rec.status?.toLowerCase() === "y"}
                                onChange={() => handleSwitchChange(rec.bagTypeId, rec.status)}
                                id={`switch-${rec.bagTypeId}`}
                              />
                              <label className="form-check-label ms-2" htmlFor={`switch-${rec.bagTypeId}`}>
                                {rec.status?.toLowerCase() === "y" ? "Active" : "Inactive"}
                              </label>
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-success me-2"
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
                      Bag Type Code <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="bagTypeCode"
                      className="form-control"
                      value={formData.bagTypeCode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label>
                      Bag Type Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="bagTypeName"
                      className="form-control"
                      placeholder="Enter bag type name"
                      value={formData.bagTypeName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label>Description</label>
                    <textarea
                      id="description"
                      className="form-control"
                      placeholder="Enter description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                    />
                  </div>
                  <div className="col-md-4">
                    <label>Max Components</label>
                    <input
                      type="number"
                      id="maxComponents"
                      className="form-control"
                      placeholder="Enter max components"
                      value={formData.maxComponents}
                      onChange={handleInputChange}
                      min="1"
                    />
                  </div>

                  <div className="col-md-12 d-flex justify-content-end mt-3">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid || loading}
                    >
                      {editingBagType ? "Update" : "Save"}
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

              {/* Popup notification */}
              {popupMessage && (
                <Popup
                  message={popupMessage.message}
                  type={popupMessage.type}
                  onClose={popupMessage.onClose}
                />
              )}

              {/* Confirmation dialog for status change */}
              {confirmDialog.isOpen && (
                <div className="modal d-block" tabIndex="-1" role="dialog">
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
                          {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                          <strong>{confirmDialog.bagTypeName}</strong>?
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
                          disabled={loading}
                        >
                          {loading ? "Processing..." : "Yes"}
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

export default BagTypeMaster;