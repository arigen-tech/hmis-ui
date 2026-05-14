
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import { MAS_INSURANCE } from "../../../config/apiConfig";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest } from "../../../service/apiService";
import { FETCH_INSURANCE } from "../../../config/constants";

const InsuranceMaster = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    insuranceName: "",      
    insuranceCode: "",      
    contactPerson: "",
    contactNo: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, recordId: null, newStatus: false });
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
      const { response } = await getRequest(`${MAS_INSURANCE}/getAll/${flag}`);
      setData(response || []);
    } catch {
      showPopup(FETCH_INSURANCE, "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);



  const filteredData = (data || []).filter((rec) =>
    (rec?.insuranceName || "")
      .toLowerCase()
      .includes((searchQuery || "").toLowerCase())
  );

  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    const { insuranceName, insuranceCode, contactPerson, contactNo, email } = {
      ...formData,
      [name]: value,
    };
    setIsFormValid(
      (insuranceName?.trim() || "") !== "" ||
      (insuranceCode?.trim() || "") !== "" ||
      (contactPerson?.trim() || "") !== "" ||
      (contactNo?.trim() || "") !== "" ||
      (email?.trim() || "") !== ""
    );
  };

  const resetForm = () => {
    setFormData({
      insuranceName: "",
      insuranceCode: "",
      contactPerson: "",
      contactNo: "",
    });
    setIsFormValid(false);
  };

  const handleSave = (e) => {
    e.preventDefault();

    if (editingRecord) {
      const updated = data.map((item) =>
        item.id === editingRecord.id
          ? { ...editingRecord, ...formData, lastUpdateDate: new Date() }
          : item
      );
      setData(updated);
      showPopup("Updated Successfully", "success");
    } else {
      const newRecord = {
        ...formData,
        id: Date.now(),
        status: "y",
        lastUpdateDate: new Date(),
      };
      setData([...data, newRecord]);
      showPopup("Added Successfully", "success");
    }

    handleCancel();
  };

  const handleEdit = (rec) => {
    setEditingRecord(rec);
    // ✅ fixed: populate form with existing values
    setFormData({
      insuranceName: rec.insuranceName || "",
      insuranceCode: rec.insuranceCode || "",
      contactPerson: rec.contactPerson || "",
      contactNo: rec.contactNo || "",
    });
    setShowForm(true);
    setIsFormValid(true);
  };

  const handleStatusChange = (recordId, newStatus) => {
    setConfirmDialog({ isOpen: true, recordId, newStatus });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed && confirmDialog.recordId !== null) {
      const updated = data.map((item) =>
        item.id === confirmDialog.recordId
          ? { ...item, status: confirmDialog.newStatus }
          : item
      );
      setData(updated);
      showPopup(`Record ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`, "success");
    }
    setConfirmDialog({ isOpen: false, recordId: null, newStatus: false });
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
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Insurance Master</h4>
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
                      >
                        <i className="mdi mdi-plus"></i> Add
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-success me-2 flex-shrink-0" 
                        onClick={handleRefresh}
                      >
                        <i className="mdi mdi-refresh"></i> Show All
                      </button>
                    </>
                  ) : (
                    <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                      <i className="mdi mdi-arrow-left"></i> Back
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="card-body">
              {!showForm ? (
                <>
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
                          <tr key={rec.id}>
                            <td>{rec.insuranceName}</td>
                            <td>{rec.insuranceCode}</td>
                            <td>{rec.contactPerson}</td>
                            <td>{rec.contactNo}</td>
                            <td>{formatDate(rec.lastUpdateDate)}</td>
                            <td>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={rec.status === "y"}
                                  onChange={() => handleStatusChange(rec.id, rec.status === "y" ? "n" : "y")}
                                  id={`switch-${rec.id}`}
                                />
                                <label className="form-check-label px-0" htmlFor={`switch-${rec.id}`}>
                                  {rec.status === "y" ? "Active" : "Deactivated"}
                                </label>
                              </div>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleEdit(rec)}
                                disabled={rec.status !== "y"}
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
                </>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="row">
                    <div className="form-group col-md-4">
                      <label>Name</label>
                      <input
                        className="form-control mt-1"
                        name="insuranceName"
                        value={formData.insuranceName}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group col-md-4">
                      <label>Code</label>
                      <input
                        className="form-control"
                        name="insuranceCode"
                        value={formData.insuranceCode}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group col-md-4">
                      <label>Contact Person</label>
                      <input
                        className="form-control"
                        name="contactPerson"
                        value={formData.contactPerson}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group col-md-4">
                      <label>Contact No</label>
                      <input
                        className="form-control"
                        name="contactNo"
                        value={formData.contactNo}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                    <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                      {editingRecord ? "Update" : "Save"}
                    </button>
                    <button type="button" className="btn btn-danger" onClick={handleCancel}>
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
                  Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"} this record?
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleConfirm(true)}
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

export default InsuranceMaster;