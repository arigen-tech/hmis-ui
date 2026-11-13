import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, postRequest, putRequest } from "../../../service/apiService";
import { MAS_OPERATION_THEATRE, MAS_OT_TYPE } from "../../../config/apiConfig";
import {
  FETCH_OT,
  ADD_OT,
  UPDATE_OT,
  UPDATE_STATUS_OT,
  FAIL_OT,
  DUPLICATE_OT,
  UPDATE_FAIL_OT,
} from "../../../config/constants";

const OperationTheatre = () => {
  // ----- State -----
  const [formData, setFormData] = useState({
    otCode: "",
    otName: "",
    otTypeId: "",
    otType: "",
    location: ""
  });
  const [otTypeList, setOtTypeList] = useState([]);

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
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [process, setProcess] = useState(false);

  // ----- Constants for validation -----
  const OT_CODE_MAX_LENGTH = 10;
  const OT_NAME_MAX_LENGTH = 100;
  const LOCATION_MAX_LENGTH = 100;

  // ----- Fetch data (all records, flag=0) -----
  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const { response } = await getRequest(`${MAS_OPERATION_THEATRE}/getAll/${flag}`);
      setData(response || []);
      setTotalItems((response || []).length);
      setTotalPages(Math.ceil((response || []).length / DEFAULT_ITEMS_PER_PAGE));
    } catch (error) {
      console.error("Fetch error:", error);
      showPopup(FETCH_OT, "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // ----- Fetch OT Type Master data (active records, flag=1) -----
  const fetchOtTypes = async () => {
    try {
      const { response } = await getRequest(`${MAS_OT_TYPE}/getAll/1`);
      setOtTypeList(response || []);
    } catch (error) {
      console.error("Fetch OT Type error:", error);
      setOtTypeList([]);
    }
  };

  useEffect(() => {
    fetchData();
    fetchOtTypes();
  }, []);

  // ----- Form validation -----
  useEffect(() => {
    const { otCode, otName, otTypeId, location } = formData;
    const hasOtType = Boolean(otTypeId) && String(otTypeId).trim() !== "";
    if (editingItem) {
      setIsFormValid(otName.trim() !== "" && hasOtType && location.trim() !== "");
    } else {
      setIsFormValid(
        otCode.trim() !== "" &&
        otName.trim() !== "" &&
        hasOtType &&
        location.trim() !== ""
      );
    }
  }, [formData, editingItem]);

  // Options for OT Type dropdown (preserves inactive/current type on edit)
  const otTypeOptions = (() => {
    if (!editingItem || !formData.otTypeId) return otTypeList;
    const exists = otTypeList.some((t) => String(t.otTypeId) === String(formData.otTypeId));
    if (!exists && formData.otType) {
      return [...otTypeList, { otTypeId: formData.otTypeId, otTypeName: formData.otType }];
    }
    return otTypeList;
  })();

  // ----- Filtered data (search) -----
  const filteredData = data.filter(item =>
    item.otCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.otName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.otType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location?.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleOtTypeChange = (e) => {
    const selectedId = e.target.value;
    const selected = otTypeList.find((item) => String(item.otTypeId) === String(selectedId));
    setFormData((prev) => ({
      ...prev,
      otTypeId: selectedId ? Number(selectedId) : "",
      otType: selected ? (selected.otTypeName || "") : ""
    }));
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const resetForm = () => {
    setEditingItem(null);
    setShowForm(false);
    setFormData({ otCode: "", otName: "", otTypeId: "", otType: "", location: "" });
    setPopupMessage(null);
  };

  const handleCancel = () => {
    resetForm();
  };

  // ----- Edit -----
  const handleEdit = (item) => {
    setEditingItem(item);
    let matchedId = item.otTypeId ? String(item.otTypeId) : "";
    let matchedName = item.otType || "";
    if (!matchedId && matchedName) {
      const found = otTypeList.find(
        (t) => t.otTypeName?.toLowerCase() === matchedName.toLowerCase() ||
               t.otTypeCode?.toLowerCase() === matchedName.toLowerCase()
      );
      if (found) {
        matchedId = String(found.otTypeId);
        matchedName = found.otTypeName;
      }
    } else if (matchedId && !matchedName) {
      const found = otTypeList.find((t) => String(t.otTypeId) === String(matchedId));
      if (found) {
        matchedName = found.otTypeName;
      }
    }
    setFormData({
      otCode: item.otCode || "",
      otName: item.otName || "",
      otTypeId: matchedId ? Number(matchedId) : "",
      otType: matchedName,
      location: item.location || ""
    });
    setShowForm(true);
  };

  // ----- Save (Add / Update) -----
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setProcess(true);

    // Check duplicate (based on code + name)
    const duplicate = data.find(
      (rec) =>
        (rec.otCode?.toLowerCase() === formData.otCode.trim().toLowerCase() ||
         rec.otName?.toLowerCase() === formData.otName.trim().toLowerCase()) &&
        (!editingItem || rec.otId !== editingItem.otId)
    );

    if (duplicate) {
      showPopup(DUPLICATE_OT, "error");
      setProcess(false);
      return;
    }

    try {
      if (editingItem) {
        await putRequest(`${MAS_OPERATION_THEATRE}/update/${editingItem.otId}`, {
          otCode: formData.otCode.trim(),
          otName: formData.otName.trim(),
          otTypeId: Number(formData.otTypeId) || 0,
          otType: formData.otType ? formData.otType.trim() : "",
          location: formData.location.trim(),
        });
        showPopup(UPDATE_OT, "success", () => {
          fetchData();
          resetForm();
        });
      } else {
        await postRequest(`${MAS_OPERATION_THEATRE}/create`, {
          otCode: formData.otCode.trim(),
          otName: formData.otName.trim(),
          otTypeId: Number(formData.otTypeId) || 0,
          otType: formData.otType ? formData.otType.trim() : "",
          location: formData.location.trim(),
        });
        showPopup(ADD_OT, "success", () => {
          fetchData();
          resetForm();
        });
      }
    } catch (error) {
      console.error("Save error:", error);
      showPopup(FAIL_OT, "error");
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
      await putRequest(`${MAS_OPERATION_THEATRE}/status/${confirmDialog.id}?status=${confirmDialog.newStatus}`);
      showPopup(UPDATE_STATUS_OT, "success", () => {
        fetchData();
      });
    } catch (error) {
      console.error("Status update error:", error);
      showPopup(UPDATE_FAIL_OT, "error");
    } finally {
      setProcess(false);
      setConfirmDialog({ isOpen: false, id: null, newStatus: "", name: "" });
    }
  };

  // ----- Activate (for inactive editing) -----
  const handleActivate = async () => {
    if (!editingItem) return;
    setProcess(true);
    try {
      await putRequest(`${MAS_OPERATION_THEATRE}/status/${editingItem.otId}?status=Y`);
      showPopup(UPDATE_STATUS_OT, "success", () => {
        fetchData();
        resetForm();
      });
    } catch (error) {
      console.error("Activation error:", error);
      showPopup(UPDATE_FAIL_OT, "error");
    } finally {
      setProcess(false);
    }
  };

  // ----- Refresh / Show All -----
  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchData();
    fetchOtTypes();
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
              <h4 className="card-title p-2">Operation Theatre Master</h4>

              <div className="d-flex justify-content-between align-items-center gap-2">
                {!showForm ? (
                  <>
                    <form className="d-inline-block searchform me-2" role="search">
                      <div className="input-group searchinput">
                        <input
                          type="search"
                          className="form-control"
                          placeholder="Search by code, name, type or location"
                          aria-label="Search"
                          value={searchQuery}
                          onChange={handleSearchChange}
                        />
                        <span className="input-group-text" id="search-icon">
                          <i className="fa fa-search"></i>
                        </span>
                      </div>
                    </form>
                  
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => {
                        setEditingItem(null);
                        setFormData({ otCode: "", otName: "", otTypeId: "", otType: "", location: "" });
                        setShowForm(true);
                      }}
                    >
                      <i className="mdi mdi-plus"></i> Add
                    </button>
                      <button type="button" className="btn btn-success" onClick={handleRefresh}>
                      <i className="mdi mdi-refresh"></i> Show All
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
                          <th>OT Code</th>
                          <th>OT Name</th>
                          <th>OT Type</th>
                          <th>Location</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((item) => (
                            <tr key={item.otId}>
                              <td>{item.otCode || '-'}</td>
                              <td style={{ textTransform: "capitalize" }}>{item.otName || '-'}</td>
                              <td>{item.otType || '-'}</td>
                              <td>{item.location || '-'}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={item.status?.toLowerCase() === "y"}
                                    onChange={() => handleSwitchChange(
                                      item.otId,
                                      item.otName,
                                      item.status?.toLowerCase() === "y" ? "n" : "y"
                                    )}
                                    id={`switch-${item.otId}`}
                                  />
                                  <label className="form-check-label px-0" htmlFor={`switch-${item.otId}`}>
                                    {item.status?.toLowerCase() === "y" ? "Active" : "Deactivated"}
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
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center">No records found</td>
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
                        OT Code <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="otCode"
                        placeholder="Enter OT code"
                        onChange={handleInputChange}
                        value={formData.otCode}
                        maxLength={OT_CODE_MAX_LENGTH}
                        required
                        disabled={process || !!editingItem}
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        OT Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="otName"
                        placeholder="Enter OT name"
                        onChange={handleInputChange}
                        value={formData.otName}
                        maxLength={OT_NAME_MAX_LENGTH}
                        required
                        disabled={process}
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        OT Type <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        id="otTypeId"
                        value={formData.otTypeId}
                        onChange={handleOtTypeChange}
                        required
                        disabled={process}
                      >
                        <option value="">Select OT Type</option>
                        {otTypeOptions.map((item) => (
                          <option key={item.otTypeId} value={item.otTypeId}>
                            {item.otTypeName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Location <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="location"
                        placeholder="Enter location"
                        onChange={handleInputChange}
                        value={formData.location}
                        maxLength={LOCATION_MAX_LENGTH}
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
                          <strong>{confirmDialog.name}</strong> OT?
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

export default OperationTheatre;