import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, postRequest, putRequest } from "../../../service/apiService";
import { MAS_ANAESTHESIA_TYPE } from "../../../config/apiConfig";
import {
  FETCH_ANAESTHESIA_TYPE,
  ADD_ANAESTHESIA_TYPE,
  UPDATE_ANAESTHESIA_TYPE,
  UPDATE_STATUS_ANAESTHESIA_TYPE,
  FAIL_ANAESTHESIA_TYPE,
  DUPLICATE_ANAESTHESIA_TYPE,
  UPDATE_FAIL_ANAESTHESIA_TYPE,
  FETCH_ANAESTHESIA_TYPE_DETAIL,
} from "../../../config/constants";

const AnaesthesiaTypeMaster = () => {
  // ----- State -----
  const [formData, setFormData] = useState({
    anaesthesiaTypeCode: "",
    anaesthesiaTypeName: ""
  });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    name: ""
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [process, setProcess] = useState(false);

  // ----- Constants for validation -----
  const CODE_MAX_LENGTH = 10;
  const NAME_MAX_LENGTH = 100;

  // ----- Fetch all anaesthesia types -----
  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const { response } = await getRequest(`${MAS_ANAESTHESIA_TYPE}/getAll/${flag}`);
      setData(response || []);
    } catch (error) {
      console.error("Fetch error:", error);
      showPopup(FETCH_ANAESTHESIA_TYPE, "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ----- Form validation -----
  useEffect(() => {
    const { anaesthesiaTypeCode, anaesthesiaTypeName } = formData;
    setIsFormValid(
      anaesthesiaTypeCode.trim() !== "" && anaesthesiaTypeName.trim() !== ""
    );
  }, [formData]);

  // ----- Filtered data (search) -----
  const filteredData = data.filter(item =>
    (item.anaesthesiaTypeCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     item.anaesthesiaTypeName?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // ----- Pagination -----
  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page) => setCurrentPage(page);

  // ----- Handlers -----
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const resetForm = () => {
    setEditingItem(null);
    setShowForm(false);
    setFormData({ anaesthesiaTypeCode: "", anaesthesiaTypeName: "" });
    setPopupMessage(null);
  };

  const handleCancel = () => resetForm();

  // ----- Edit -----
  const handleEdit = async (item) => {
    setProcess(true);
    try {
      const { response } = await getRequest(`${MAS_ANAESTHESIA_TYPE}/getById/${item.anaesthesiaTypeId}`);
      const record = response || item;

      setEditingItem(record);
      setFormData({
        anaesthesiaTypeCode: record.anaesthesiaTypeCode || "",
        anaesthesiaTypeName: record.anaesthesiaTypeName || "",
      });
      setShowForm(true);
    } catch (error) {
      console.error("Fetch by id error:", error);
      showPopup(FETCH_ANAESTHESIA_TYPE_DETAIL, "error");
    } finally {
      setProcess(false);
    }
  };

  // ----- Save (Add / Update) -----
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setProcess(true);

    // Duplicate check (client‑side) – code should be unique
    const duplicate = data.find(
      (rec) =>
        rec.anaesthesiaTypeCode?.toLowerCase() === formData.anaesthesiaTypeCode.toLowerCase() &&
        (!editingItem || rec.anaesthesiaTypeId !== editingItem.anaesthesiaTypeId)
    );

    if (duplicate) {
      showPopup(DUPLICATE_ANAESTHESIA_TYPE, "error");
      setProcess(false);
      return;
    }

    const payload = {
      anaesthesiaTypeCode: formData.anaesthesiaTypeCode.trim(),
      anaesthesiaTypeName: formData.anaesthesiaTypeName.trim(),
    };

    console.log("Sending payload:", payload);

    try {
      if (editingItem) {
        await putRequest(`${MAS_ANAESTHESIA_TYPE}/update/${editingItem.anaesthesiaTypeId}`, payload);
        showPopup(UPDATE_ANAESTHESIA_TYPE, "success", () => {
          fetchData();
          resetForm();
        });
      } else {
        await postRequest(`${MAS_ANAESTHESIA_TYPE}/create`, payload);
        showPopup(ADD_ANAESTHESIA_TYPE, "success", () => {
          fetchData();
          resetForm();
        });
      }
    } catch (error) {
      console.error("Save error details:", error);
      let serverMessage = FAIL_ANAESTHESIA_TYPE;
      if (error?.response?.data?.message) {
        serverMessage = error.response.data.message;
      } else if (error?.message) {
        serverMessage = error.message;
      }
      showPopup(serverMessage, "error");
    } finally {
      setProcess(false);
    }
  };

  // ----- Status toggle -----
  const handleSwitchChange = (id, name, newStatus) => {
    setConfirmDialog({ isOpen: true, id, newStatus, name });
  };

  const handleConfirm = async (confirmed) => {
    if (!confirmed) {
      setConfirmDialog({ isOpen: false, id: null, newStatus: "", name: "" });
      return;
    }

    setProcess(true);
    try {
      await putRequest(`${MAS_ANAESTHESIA_TYPE}/status/${confirmDialog.id}?status=${confirmDialog.newStatus}`);
      showPopup(UPDATE_STATUS_ANAESTHESIA_TYPE, "success", () => {
        fetchData();
      });
    } catch (error) {
      console.error("Status update error:", error);
      showPopup(UPDATE_FAIL_ANAESTHESIA_TYPE, "error");
    } finally {
      setProcess(false);
      setConfirmDialog({ isOpen: false, id: null, newStatus: "", name: "" });
    }
  };

  // ----- Activate (from edit form) -----
  const handleActivate = async () => {
    if (!editingItem) return;
    setProcess(true);
    try {
      await putRequest(`${MAS_ANAESTHESIA_TYPE}/status/${editingItem.anaesthesiaTypeId}?status=Y`);
      showPopup(UPDATE_STATUS_ANAESTHESIA_TYPE, "success", () => {
        fetchData();
        resetForm();
      });
    } catch (error) {
      console.error("Activation error:", error);
      showPopup(UPDATE_FAIL_ANAESTHESIA_TYPE, "error");
    } finally {
      setProcess(false);
    }
  };

  // ----- Refresh -----
  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchData();
  };

  // ----- Popup helper -----
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

  // ====================== RENDER ======================
  return (
    <div className="content-wrapper">
      <div className="row">
        {loading && <LoadingScreen />}
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">Anaesthesia Type Master</h4>

              <div className="d-flex justify-content-between align-items-center gap-2">
                {!showForm ? (
                  <>
                    <form className="d-inline-block searchform me-2" role="search">
                      <div className="input-group searchinput">
                        <input
                          type="search"
                          className="form-control"
                          placeholder="Search by code or name"
                          aria-label="Search"
                          value={searchQuery}
                          onChange={handleSearchChange}
                        />
                        <span className="input-group-text" id="search-icon">
                          <i className="fa fa-search"></i>
                        </span>
                      </div>
                    </form>
                    <button type="button" className="btn btn-success" onClick={handleRefresh}>
                      <i className="mdi mdi-refresh"></i> Show All
                    </button>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => {
                        setEditingItem(null);
                        setFormData({ anaesthesiaTypeCode: "", anaesthesiaTypeName: "" });
                        setShowForm(true);
                      }}
                    >
                      <i className="mdi mdi-plus"></i> Add
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                    <i className="mdi mdi-arrow-left"></i> Back
                  </button>
                )}
              </div>
            </div>

            <div className="card-body">
              {!showForm ? (
                // ----- Table view -----
                <>
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Code</th>
                          <th>Name</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((item) => (
                            <tr key={item.anaesthesiaTypeId}>
                              <td>{item.anaesthesiaTypeCode || '-'}</td>
                              <td style={{ textTransform: "capitalize" }}>{item.anaesthesiaTypeName || '-'}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={item.status?.toLowerCase() === "y"}
                                    onChange={() => handleSwitchChange(
                                      item.anaesthesiaTypeId,
                                      item.anaesthesiaTypeName,
                                      item.status?.toLowerCase() === "y" ? "n" : "y"
                                    )}
                                    id={`switch-${item.anaesthesiaTypeId}`}
                                  />
                                  <label className="form-check-label px-0" htmlFor={`switch-${item.anaesthesiaTypeId}`}>
                                    {item.status?.toLowerCase() === "y" ? "Active" : "Deactivated"}
                                  </label>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(item)}
                                  disabled={item.status?.toLowerCase() !== "y" || process}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center">No records found</td>
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
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              ) : (
                // ----- Form view -----
                <form className="forms row" onSubmit={handleSave}>
                  <div className="row">
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Code <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="anaesthesiaTypeCode"
                        placeholder="Enter code"
                        onChange={handleInputChange}
                        value={formData.anaesthesiaTypeCode}
                        maxLength={CODE_MAX_LENGTH}
                        required
                        disabled={process || editingItem}
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="anaesthesiaTypeName"
                        placeholder="Enter name"
                        onChange={handleInputChange}
                        value={formData.anaesthesiaTypeName}
                        maxLength={NAME_MAX_LENGTH}
                        required
                        disabled={process}
                      />
                    </div>
                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={process || !isFormValid}
                    >
                      {process ? "Processing..." : (editingItem ? 'Update' : 'Save')}
                    </button>

                    {editingItem && editingItem.status?.toLowerCase() === "n" && (
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={handleActivate}
                        disabled={process}
                      >
                        Activate
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleCancel}
                      disabled={process}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {popupMessage && (
                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
              )}

              {confirmDialog.isOpen && (
                <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button type="button" className="btn-close" onClick={() => handleConfirm(false)} aria-label="Close"></button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to {confirmDialog.newStatus?.toLowerCase() === "y" ? "activate" : "deactivate"}{" "}
                          <strong>{confirmDialog.name}</strong> anaesthesia type?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)} disabled={process}>
                          Cancel
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)} disabled={process}>
                          {process ? "Processing..." : "Confirm"}
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

export default AnaesthesiaTypeMaster;