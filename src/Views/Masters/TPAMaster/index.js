import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { MAS_TPA } from "../../../config/apiConfig";
import { getRequest, postRequest, putRequest } from "../../../service/apiService";
import {
  FETCH_TPA,
  ADD_TPA_SUCCESS,
  ADD_TPA_FAIL,
  UPDATE_TPA_SUCCESS,
  UPDATE_TPA_FAIL,
  DUPLICATE_TPA,
} from "../../../config/constants";

const TPAMaster = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tpaName: "",
    tpaCode: "",
    contactPerson: "",
    contactNo: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    reccord: null,
    newStatus: "",
  });

  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE;

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
      const { response } = await getRequest(`${MAS_TPA}/getAll/${flag}`);
      setData(response || []);
    } catch (error) {
      console.error("Fetch error:", error);
      showPopup(FETCH_TPA, "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = (data || []).filter((rec) =>
    (rec.tpaName || rec.name || "")
      .toLowerCase()
      .includes((searchQuery || "").toLowerCase())
  );

  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const validateForm = (values) => {
    return (
      values.tpaName?.trim() !== "" &&
      values.tpaCode?.trim() !== "" &&
      values.contactPerson?.trim() !== "" &&
      values.contactNo?.trim() !== ""
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...formData, [name]: value };
    setFormData(updatedForm);
    setIsFormValid(validateForm(updatedForm));
  };

  const resetForm = () => {
    setFormData({
      tpaName: "",
      tpaCode: "",
      contactPerson: "",
      contactNo: "",
    });
    setIsFormValid(false);
  };

  const isDuplicate = () => {
    const newName = formData.tpaName.trim().toLowerCase();
    return data.some((rec) => {
      if (editingRecord && rec.tpaId === editingRecord.tpaId) return false;
      return (rec.tpaName || "").trim().toLowerCase() === newName;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    if (isDuplicate()) {
      showPopup(DUPLICATE_TPA, "error");
      return;
    }

    setLoading(true);
    try {
      if (editingRecord) {
        const payload = {
          tpaId: editingRecord.tpaId,
          tpaName: formData.tpaName,
          tpaCode: formData.tpaCode,
          contactPerson: formData.contactPerson,
          contactNo: formData.contactNo,
        };
        await putRequest(`${MAS_TPA}/update/${editingRecord.tpaId}`, payload);
        showPopup(UPDATE_TPA_SUCCESS, "success");
      } else {
        const payload = {
          tpaName: formData.tpaName,
          tpaCode: formData.tpaCode,
          contactPerson: formData.contactPerson,
          contactNo: formData.contactNo,
          status: "y",
        };
        await postRequest(`${MAS_TPA}/create`, payload);
        showPopup(ADD_TPA_SUCCESS, "success");
      }
      await fetchData();
      handleCancel();
    } catch (error) {
      console.error("Save error:", error);
      showPopup(editingRecord ? UPDATE_TPA_FAIL : ADD_TPA_FAIL, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({
      tpaName: rec.tpaName || rec.name || "",
      tpaCode: rec.tpaCode || rec.code || "",
      contactPerson: rec.contactPerson || "",
      contactNo: rec.contactNo || "",
    });
    setShowForm(true);
    setIsFormValid(true);
  };

  const handleStatusChange = (rec) => {
    setConfirmDialog({
      isOpen: true,
      reccord: rec,
      newStatus: rec.status === "y" ? "n" : "y",
    });
  };

  const handleConfirm = async (confirmed) => {
    if (!confirmed) {
      setConfirmDialog({ isOpen: false, reccord: null, newStatus: "" });
      return;
    }

    try {
      setLoading(true);
      await putRequest(
        `${MAS_TPA}/status/${confirmDialog.reccord.tpaId}?status=${confirmDialog.newStatus}`
      );

      // Dynamic success message based on action
      const successMsg =
        confirmDialog.newStatus === "y"
          ? "TPA activated successfully!"
          : "TPA deactivated successfully!";
      showPopup(successMsg, "success");

      fetchData();
    } catch (error) {
      console.error("Status update error:", error);
      // Dynamic error message based on action
      const errorMsg =
        confirmDialog.newStatus === "y"
          ? "Failed to activate TPA"
          : "Failed to deactivate TPA";
      showPopup(errorMsg, "error");
    } finally {
      setLoading(false);
      setConfirmDialog({ isOpen: false, reccord: null, newStatus: "" });
    }
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleCancel = () => {
    resetForm();
    setEditingRecord(null);
    setShowForm(false);
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchData(1);
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">TPA Master</h4>
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
                        className="btn btn-success me-2 flex-shrink-0"
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
              {!showForm ? (
                <>
                  {loading && <div className="text-center">Loading...</div>}
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Name</th>
                          <th>Code</th>
                          <th>Contact Person</th>
                          <th>Contact No.</th>
                          <th>Last Update</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.map((rec) => (
                          <tr key={rec.tpaId}>
                            <td>{rec.tpaName || rec.name}</td>
                            <td>{rec.tpaCode || rec.code}</td>
                            <td>{rec.contactPerson}</td>
                            <td>{rec.contactNo}</td>
                            <td>{formatDate(rec.lastChgDate)}</td>
                            <td>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={rec.status === "y"}
                                  onChange={() => handleStatusChange(rec)}
                                  id={`switch-${rec.tpaId}`}
                                  disabled={loading}
                                />
                                <label className="form-check-label px-0" htmlFor={`switch-${rec.tpaId}`}>
                                  {rec.status === "y" ? "Active" : "Deactivated"}
                                </label>
                              </div>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleEdit(rec)}
                                disabled={rec.status !== "y" || loading}
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
                      <label>Name *</label>
                      <input
                        className="form-control mt-1"
                        name="tpaName"
                        value={formData.tpaName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group col-md-4">
                      <label>Code *</label>
                      <input
                        className="form-control mt-1"
                        name="tpaCode"
                        value={formData.tpaCode}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group col-md-4">
                      <label>Contact Person *</label>
                      <input
                        className="form-control mt-1"
                        name="contactPerson"
                        value={formData.contactPerson}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group col-md-4">
                      <label>Contact No *</label>
                      <input
                        className="form-control mt-1"
                        name="contactNo"
                        value={formData.contactNo}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-2">
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
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
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
                  {confirmDialog.newStatus === "y" ? "activate" : "deactivate"} this record?
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleConfirm(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleConfirm(true)}
                  disabled={loading}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TPAMaster;