import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const PatientDischargeReason = () => {
  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({
    dischargeReasonId: "",
    dischargeReasonCode: "",
    dischargeReasonName: "",
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

  const dummyData = [
    { dischargeReasonId: 1, dischargeReasonCode: "DR001", dischargeReasonName: "Treatment Completed", status: "y" },
    { dischargeReasonId: 2, dischargeReasonCode: "DR002", dischargeReasonName: "Patient Request", status: "y" },
    { dischargeReasonId: 3, dischargeReasonCode: "DR003", dischargeReasonName: "Transfer to Another Hospital", status: "n" },
    { dischargeReasonId: 4, dischargeReasonCode: "DR004", dischargeReasonName: "Against Medical Advice", status: "y" },
    { dischargeReasonId: 5, dischargeReasonCode: "DR005", dischargeReasonName: "Deceased", status: "n" },
  ];

  useEffect(() => {
    setData(dummyData);
  }, []);

  const filteredData = (data || []).filter((rec) =>
    (rec?.dischargeReasonName || "")
      .toLowerCase()
      .includes((searchQuery || "").toLowerCase()) ||
    (rec?.dischargeReasonCode || "")
      .toLowerCase()
      .includes((searchQuery || "").toLowerCase())
  );

  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const validateForm = (values) => {
    return values.dischargeReasonCode && values.dischargeReasonName;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...formData, [name]: value };
    setFormData(updatedForm);
    setIsFormValid(validateForm(updatedForm));
  };

  const resetForm = () => {
    setFormData({
      dischargeReasonId: "",
      dischargeReasonCode: "",
      dischargeReasonName: "",
    });
    setIsFormValid(false);
  };

  const isDuplicate = () => {
    return data.some((rec) => {
      if (editingRecord && rec.dischargeReasonId === editingRecord.dischargeReasonId)
        return false;
      return (
        rec.dischargeReasonCode.toLowerCase() === formData.dischargeReasonCode.toLowerCase() ||
        rec.dischargeReasonName.toLowerCase() === formData.dischargeReasonName.toLowerCase()
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
          item.dischargeReasonId === editingRecord.dischargeReasonId
            ? { ...item, ...formData }
            : item
        );
        setData(updated);
        showPopup("Record updated successfully!", "success", () => {
          handleCancel();
        });
      } else {
        const newRecord = {
          dischargeReasonId: Date.now(),
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
      dischargeReasonId: rec.dischargeReasonId,
      dischargeReasonCode: rec.dischargeReasonCode,
      dischargeReasonName: rec.dischargeReasonName,
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
          item.dischargeReasonId === confirmDialog.record.dischargeReasonId
            ? { ...item, status: confirmDialog.newStatus }
            : item
        );
        setData(updated);
        setPopupMessage({
          message: `Patient Discharge Reason ${
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
              <h4 className="card-title">Patient Discharge Reason</h4>
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
                          <th>Reason ID</th>
                          <th>Reason Code</th>
                          <th>Reason Name</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.map((rec) => (
                          <tr key={rec.dischargeReasonId}>
                            <td>{rec.dischargeReasonId}</td>
                            <td>{rec.dischargeReasonCode}</td>
                            <td>{rec.dischargeReasonName}</td>
                            <td>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={rec.status?.toLowerCase() === "y"}
                                  onChange={() => handleStatusChange(rec)}
                                  id={`switch-${rec.dischargeReasonId}`}
                                  disabled={loading}
                                />
                                <label className="form-check-label px-0" htmlFor={`switch-${rec.dischargeReasonId}`}>
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
                      <label>Reason Code <span className="text-danger">*</span></label>
                      <input
                        className="form-control mt-1"
                        name="dischargeReasonCode"
                        type="text"
                        value={formData.dischargeReasonCode}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                        placeholder="Enter code"
                      />
                    </div>

                    <div className="form-group col-md-4">
                      <label>Reason Name <span className="text-danger">*</span></label>
                      <input
                        className="form-control mt-1"
                        name="dischargeReasonName"
                        type="text"
                        value={formData.dischargeReasonName}
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
                  <strong>{confirmDialog.record?.dischargeReasonName}</strong>?
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

export default PatientDischargeReason;