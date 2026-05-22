import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, postRequest, putRequest } from "../../../service/apiService";
import { MAS_CORPORATE } from "../../../config/apiConfig"; 
import {
  FETCH_CORPORATE,
  ADD_CORPORATE_SUCCESS,
  ADD_CORPORATE_FAIL,
  UPDATE_CORPORATE_SUCCESS,
  UPDATE_CORPORATE_FAIL,
  DUPLICATE_CORPORATE,
  STATUS_CORPORATE_SUCCESS,
  STATUS_CORPORATE_FAIL,
} from "../../../config/constants";

const CorporateMaster = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    corporateName: "",
    corporateCode: "",     
    contactPerson: "",
    contactNo: "",
    emailId: "",           
    address: "",
    creditAllowed: "y",    
    creditDays: 1,
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
      const response = await getRequest(`${MAS_CORPORATE}/getAll/${flag}`);
      if (response.status === 200 && response.response) {
        setData(response.response || []);
      } else {
        console.error("Unexpected API response format:", response);
        setData([]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      showPopup(FETCH_CORPORATE, "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = (data || []).filter((rec) =>
    (rec?.corporateName || "")
      .toLowerCase()
      .includes((searchQuery || "").toLowerCase())
  );

  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const validateForm = (values) => {
    return (
      values.corporateName?.trim() !== "" &&
      values.corporateCode?.trim() !== "" &&
      values.contactPerson?.trim() !== "" &&
      values.contactNo?.trim() !== "" &&
      values.emailId?.trim() !== "" &&
      values.address?.trim() !== "" &&
      values.creditDays > 0
    );
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    let parsedValue = value;
    if (type === "number") {
      parsedValue = parseInt(value, 10) || 0;
    }
    const updatedForm = { ...formData, [name]: parsedValue };
    setFormData(updatedForm);
    setIsFormValid(validateForm(updatedForm));
  };

  const resetForm = () => {
    setFormData({
      corporateName: "",
      corporateCode: "",
      contactPerson: "",
      contactNo: "",
      emailId: "",
      address: "",
      creditAllowed: "y",
      creditDays: 1,
    });
    setIsFormValid(false);
  };

  const isDuplicate = () => {
    const newName = formData.corporateName.trim().toLowerCase();
    return data.some((rec) => {
      if (editingRecord && rec.corporateId === editingRecord.corporateId) return false;
      return (rec.corporateName || "").trim().toLowerCase() === newName;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    if (isDuplicate()) {
      showPopup(DUPLICATE_CORPORATE, "error");
      return;
    }

    setLoading(true);
    try {
      if (editingRecord) {
        const payload = {
          corporateId: editingRecord.corporateId,
          corporateName: formData.corporateName,
          corporateCode: formData.corporateCode,
          contactPerson: formData.contactPerson,
          contactNo: formData.contactNo,
          emailId: formData.emailId,
          address: formData.address,
          creditAllowed: formData.creditAllowed,
          creditDays: formData.creditDays,
        };
        const response = await putRequest(`${MAS_CORPORATE}/update/${editingRecord.corporateId}`, payload);
        if (response.status === 200) {
          setPopupMessage({
            message: UPDATE_CORPORATE_SUCCESS,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              handleCancel();
              fetchData(0);
              setCurrentPage(1);
            }
          });
        }
      } else {
        const payload = {
          corporateName: formData.corporateName,
          corporateCode: formData.corporateCode,
          contactPerson: formData.contactPerson,
          contactNo: formData.contactNo,
          emailId: formData.emailId,
          address: formData.address,
          creditAllowed: formData.creditAllowed,
          creditDays: formData.creditDays,
          status: "y",
        };
        const response = await postRequest(`${MAS_CORPORATE}/create`, payload);
        if (response.status === 201 || response.status === 200) {
          setPopupMessage({
            message: ADD_CORPORATE_SUCCESS,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              handleCancel();
              fetchData(0);
              setCurrentPage(1);
            }
          });
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      showPopup(editingRecord ? UPDATE_CORPORATE_FAIL : ADD_CORPORATE_FAIL, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({
      corporateName: rec.corporateName || "",
      corporateCode: rec.corporateCode || rec.code || "",
      contactPerson: rec.contactPerson || "",
      contactNo: rec.contactNo || "",
      emailId: rec.emailId || rec.email || "",
      address: rec.address || "",
      creditAllowed: rec.creditAllowed || "y",
      creditDays: rec.creditDays || 1,
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
      const response = await putRequest(
        `${MAS_CORPORATE}/status/${confirmDialog.reccord.corporateId}?status=${confirmDialog.newStatus}`
      );
      if (response.status === 200) {
        setPopupMessage({
          message: STATUS_CORPORATE_SUCCESS,
          type: "success",
          onClose: () => {
            setPopupMessage(null);
            fetchData(0);
            setCurrentPage(1);
          }
        });
      }
    } catch (error) {
      console.error("Status update error:", error);
      showPopup(STATUS_CORPORATE_FAIL, "error");
    } finally {
      setLoading(false);
      setConfirmDialog({ isOpen: false, reccord: null, newStatus: "" });
    }
  };

  const showPopup = (message, type) => {
    setPopupMessage({
      message,
      type,
      onClose: () => setPopupMessage(null)
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

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Corporate Master</h4>
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
                          <th>Corporate Name</th>
                          <th>Code</th>
                          <th>Contact Person</th>
                          <th>Contact No.</th>
                          <th>Email</th>
                          <th>Address</th>
                          <th>Credit Allowed</th>
                          <th>Credit Days</th>
                          <th>Last Update</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.map((rec) => (
                          <tr key={rec.corporateId}>
                            <td>{rec.corporateName}</td>
                            <td>{rec.corporateCode || rec.code}</td>
                            <td>{rec.contactPerson}</td>
                            <td>{rec.contactNo}</td>
                            <td>{rec.emailId || rec.email}</td>
                            <td>{rec.address}</td>
                            <td>
                              {rec.creditAllowed === "y" ? "Yes" : "No"}
                            </td>
                            <td>{rec.creditDays}</td>
                            <td>{formatDate(rec.lastChgDate)}</td>
                            <td>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={rec.status === "y"}
                                  onChange={() => handleStatusChange(rec)}
                                  id={`switch-${rec.corporateId}`}
                                  disabled={loading}
                                />
                                <label className="form-check-label px-0" htmlFor={`switch-${rec.corporateId}`}>
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
                      <label>Corporate Name *</label>
                      <input
                        className="form-control mt-1"
                        name="corporateName"
                        value={formData.corporateName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group col-md-4">
                      <label>Code *</label>
                      <input
                        className="form-control mt-1"
                        name="corporateCode"
                        value={formData.corporateCode}
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

                    <div className="form-group col-md-4">
                      <label>Email *</label>
                      <input
                        className="form-control mt-1"
                        name="emailId"
                        type="email"
                        value={formData.emailId}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group col-md-4">
                      <label>Address *</label>
                      <input
                        className="form-control mt-1"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group col-md-4">
                      <label>Credit Allowed *</label>
                      <select
                        className="form-control mt-1"
                        name="creditAllowed"
                        value={formData.creditAllowed}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="y">Yes</option>
                        <option value="n">No</option>
                      </select>
                    </div>

                    <div className="form-group col-md-4">
                      <label>Credit Days *</label>
                      <input
                        className="form-control mt-1"
                        name="creditDays"
                        type="number"
                        min="0"
                        value={formData.creditDays}
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

      {/* Confirmation Modal */}
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

export default CorporateMaster;