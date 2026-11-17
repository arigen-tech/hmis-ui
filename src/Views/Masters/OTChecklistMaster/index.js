import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, postRequest, putRequest } from "../../../service/apiService";
import { MAS_OT_CHECKLIST } from "../../../config/apiConfig";

const OTChecklistMaster = () => {
  // ----- State -----
  const initialForm = {
    checklistStage: "",
    checklistCode: "",
    checklistName: "",
    isMandatory: "Y",
    allowNa: "Y",
    displayOrder: "",
  };

  const [formData, setFormData] = useState(initialForm);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    name: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [appliedFilters, setAppliedFilters] = useState({ name: "", stage: "ALL" });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [process, setProcess] = useState(false);

  // ----- Constants for validation -----
  const CODE_MAX_LENGTH = 50;
  const NAME_MAX_LENGTH = 255;

  // ----- Fetch Checklist Data -----
  const fetchData = async (
    page = 0,
    name = appliedFilters.name,
    stage = appliedFilters.stage
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page,
        size: DEFAULT_ITEMS_PER_PAGE,
      });

      if (stage && stage !== "ALL") {
        params.append("checklistStage", stage.trim());
      }

      if (name && name.trim()) {
        params.append("checklistName", name.trim());
      }

      const res = await getRequest(`${MAS_OT_CHECKLIST}/getAll/0?${params.toString()}`);

      if (res?.response) {
        const content = Array.isArray(res.response.content)
          ? res.response.content
          : Array.isArray(res.response)
            ? res.response
            : [];
        setData(content);
        setTotalElements(res.response.totalElements ?? content.length);
        setTotalPages(res.response.totalPages ?? (content.length > 0 ? 1 : 0));
        setCurrentPage((res.response.pageable?.pageNumber ?? page) + 1);
      } else {
        setData([]);
        setTotalElements(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error("Fetch checklist error:", error);
      showPopup(error?.message || "Failed to fetch checklist items.", "error");
      setData([]);
      setTotalElements(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(0, "", "ALL");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- Form validation -----
  useEffect(() => {
    const { checklistStage, checklistCode, checklistName, isMandatory, allowNa, displayOrder } =
      formData;
    setIsFormValid(
      Boolean(
        checklistStage?.trim() &&
          checklistCode?.trim() &&
          checklistName?.trim() &&
          isMandatory &&
          allowNa &&
          displayOrder !== "" &&
          !isNaN(Number(displayOrder))
      )
    );
  }, [formData]);

  // ----- Handlers -----
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchData(page - 1, appliedFilters.name, appliedFilters.stage);
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const newFilters = { name: searchQuery.trim(), stage: stageFilter };
    setAppliedFilters(newFilters);
    setCurrentPage(1);
    fetchData(0, newFilters.name, newFilters.stage);
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setStageFilter("ALL");
    setAppliedFilters({ name: "", stage: "ALL" });
    setCurrentPage(1);
    fetchData(0, "", "ALL");
  };

  // ----- Edit Handler (Fetches fresh data via GET /master/otChecklist/getById/{id}) -----
  const handleEdit = async (item) => {
    setProcess(true);
    try {
      const res = await getRequest(`${MAS_OT_CHECKLIST}/getById/${item.checklistId}`);
      const record = res?.response || res || item;
      setEditingItem(record);
      setFormData({
        checklistStage: record.checklistStage || "",
        checklistCode: record.checklistCode || "",
        checklistName: record.checklistName || "",
        isMandatory: record.isMandatory || "Y",
        allowNa: record.allowNa || "Y",
        displayOrder:
          record.displayOrder !== null && record.displayOrder !== undefined
            ? String(record.displayOrder)
            : "0",
      });
      setShowForm(true);
    } catch (error) {
      console.error("Fetch by id error:", error);
      showPopup(error?.message || "Failed to fetch checklist item details.", "error");
    } finally {
      setProcess(false);
    }
  };

  // ----- Save (Add / Update via POST /master/otChecklist/save) -----
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setProcess(true);

    const payload = {
      checklistStage: formData.checklistStage,
      checklistCode: formData.checklistCode.trim(),
      checklistName: formData.checklistName.trim(),
      isMandatory: formData.isMandatory || "Y",
      allowNa: formData.allowNa || "Y",
      displayOrder: parseInt(formData.displayOrder, 10) || 0,
    };

    // When updating, include checklistId; when creating, omit checklistId
    if (editingItem && editingItem.checklistId) {
      payload.checklistId = editingItem.checklistId;
    }

    try {
      const res = await postRequest(`${MAS_OT_CHECKLIST}/save`, payload);
      const message =
        res?.message ||
        (editingItem
          ? "Checklist item updated successfully!"
          : "Checklist item added successfully!");
      showPopup(message, "success", () => {
        resetForm();
        fetchData(currentPage - 1, appliedFilters.name, appliedFilters.stage);
      });
    } catch (error) {
      console.error("Save error:", error);
      showPopup(error?.message || "Failed to save checklist item.", "error");
    } finally {
      setProcess(false);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setShowForm(false);
    setFormData(initialForm);
    setPopupMessage(null);
  };

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

  // ----- Status Toggle (PUT /master/otChecklist/status/{id}?status={Y|N}) -----
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
      await putRequest(
        `${MAS_OT_CHECKLIST}/status/${confirmDialog.id}?status=${confirmDialog.newStatus}`
      );
      showPopup(
        `Checklist item ${confirmDialog.newStatus?.toUpperCase() === "Y" ? "activated" : "deactivated"} successfully!`,
        "success",
        () => {
          fetchData(currentPage - 1, appliedFilters.name, appliedFilters.stage);
        }
      );
    } catch (error) {
      console.error("Status update error:", error);
      showPopup(error?.message || "Failed to update checklist item status.", "error");
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
      await putRequest(`${MAS_OT_CHECKLIST}/status/${editingItem.checklistId}?status=Y`);
      showPopup("Checklist item activated successfully!", "success", () => {
        resetForm();
        fetchData(currentPage - 1, appliedFilters.name, appliedFilters.stage);
      });
    } catch (error) {
      console.error("Activation error:", error);
      showPopup(error?.message || "Failed to activate checklist item.", "error");
    } finally {
      setProcess(false);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  // ----- Render -----
  return (
    <div className="content-wrapper">
      <div className="row">
        {loading && <LoadingScreen />}
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2 mb-0">OT Checklist Master</h4>

              {/* Toggle Add / Back buttons */}
              <div className="d-flex justify-content-between align-items-center gap-2">
                {!showForm ? (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => {
                      setEditingItem(null);
                      setFormData(initialForm);
                      setShowForm(true);
                    }}
                  >
                    <i className="mdi mdi-plus"></i> Add Checklist Item
                  </button>
                ) : (
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>
                    <i className="mdi mdi-arrow-left"></i> Back to List
                  </button>
                )}
              </div>
            </div>

            <div className="card-body">
              {!showForm ? (
                // ----- Table view -----
                <>
                  {/* Filters bar */}
                  <form className="row g-2 mb-3 align-items-center" onSubmit={handleSearch}>
                    <div className="col-md-3">
                      <select
                        className="form-select"
                        value={stageFilter}
                        onChange={(e) => setStageFilter(e.target.value)}
                      >
                        <option value="ALL">All Stages</option>
                        <option value="PRE_OP">PRE_OP</option>
                        <option value="INTRA_OP">INTRA_OP</option>
                        <option value="POST_OP">POST_OP</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <div className="input-group">
                        <input
                          type="search"
                          className="form-control"
                          placeholder="Search by checklist name..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary">
                          <i className="fa fa-search me-1"></i> Search
                        </button>
                      </div>
                    </div>

                    <div className="col-md-3 d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleRefresh}
                        disabled={loading}
                      >
                        <i className="mdi mdi-refresh me-1"></i> Show All
                      </button>
                    </div>
                  </form>

                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "70px" }} className="text-center">
                            Order
                          </th>
                          <th style={{ width: "160px" }}>Stage</th>
                          <th style={{ width: "200px" }}>Checklist Code</th>
                          <th>Checklist Name</th>
                          <th style={{ width: "110px" }} className="text-center">
                            Mandatory
                          </th>
                          <th style={{ width: "100px" }} className="text-center">
                            Allow N/A
                          </th>
                          <th style={{ width: "140px" }}>Status</th>
                          <th style={{ width: "80px" }} className="text-center">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.length > 0 ? (
                          data.map((item) => (
                            <tr key={item.checklistId}>
                              <td className="text-center fw-bold">
                                {item.displayOrder ?? "-"}
                              </td>
                              <td>
                                <span className="badge bg-info text-dark">
                                  {item.checklistStage || "-"}
                                </span>
                              </td>
                              <td>
                                <code className="text-dark fw-semibold">
                                  {item.checklistCode || "-"}
                                </code>
                              </td>
                              <td className="fw-semibold">{item.checklistName || "-"}</td>
                              <td className="text-center">
                                <span
                                  className={`badge ${
                                    item.isMandatory === "Y"
                                      ? "bg-danger"
                                      : "bg-secondary"
                                  }`}
                                >
                                  {item.isMandatory === "Y" ? "Yes" : "No"}
                                </span>
                              </td>
                              <td className="text-center">
                                <span
                                  className={`badge ${
                                    item.allowNa === "Y"
                                      ? "bg-success"
                                      : "bg-secondary"
                                  }`}
                                >
                                  {item.allowNa === "Y" ? "Yes" : "No"}
                                </span>
                              </td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={item.status?.toUpperCase() === "Y"}
                                    onChange={() =>
                                      handleSwitchChange(
                                        item.checklistId,
                                        item.checklistName,
                                        item.status?.toUpperCase() === "Y" ? "N" : "Y"
                                      )
                                    }
                                    id={`switch-${item.checklistId}`}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${item.checklistId}`}
                                  >
                                    {item.status?.toUpperCase() === "Y"
                                      ? "Active"
                                      : "Deactivated"}
                                  </label>
                                </div>
                              </td>
                              <td className="text-center">
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleEdit(item)}
                                  title="Edit Checklist Item"
                                  disabled={process}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="text-center py-4 text-muted">
                              {loading
                                ? "Loading checklist items..."
                                : "No checklist items found."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {totalElements > 0 && (
                    <Pagination
                      totalItems={totalElements}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={handlePageChange}
                      totalPages={totalPages}
                    />
                  )}
                </>
              ) : (
                // ----- Form view -----
                <form className="forms" onSubmit={handleSave}>
                  <div className="row g-3">
                    <div className="form-group col-md-4">
                      <label htmlFor="checklistStage" className="form-label fw-bold">
                        Checklist Stage <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        id="checklistStage"
                        value={formData.checklistStage}
                        onChange={handleInputChange}
                        required
                        disabled={process}
                      >
                        <option value="">Select Stage</option>
                        <option value="PRE_OP">PRE_OP</option>
                        <option value="INTRA_OP">INTRA_OP</option>
                        <option value="POST_OP">POST_OP</option>
                        {formData.checklistStage &&
                          !["PRE_OP", "INTRA_OP", "POST_OP"].includes(
                            formData.checklistStage
                          ) && (
                            <option value={formData.checklistStage}>
                              {formData.checklistStage}
                            </option>
                          )}
                      </select>
                    </div>

                    <div className="form-group col-md-4">
                      <label htmlFor="checklistCode" className="form-label fw-bold">
                        Checklist Code <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="checklistCode"
                        placeholder="Enter code (e.g., IDENTITY_RECONFIRMED)"
                        onChange={handleInputChange}
                        value={formData.checklistCode}
                        maxLength={CODE_MAX_LENGTH}
                        required
                        disabled={process}
                      />
                    </div>

                    <div className="form-group col-md-4">
                      <label htmlFor="displayOrder" className="form-label fw-bold">
                        Display Order <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        id="displayOrder"
                        placeholder="Enter order (e.g., 1)"
                        onChange={handleInputChange}
                        value={formData.displayOrder}
                        min="0"
                        required
                        disabled={process}
                      />
                    </div>

                    <div className="form-group col-md-8">
                      <label htmlFor="checklistName" className="form-label fw-bold">
                        Checklist Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="checklistName"
                        placeholder="Enter checklist name (e.g., Patient Identity Reconfirmed)"
                        onChange={handleInputChange}
                        value={formData.checklistName}
                        maxLength={NAME_MAX_LENGTH}
                        required
                        disabled={process}
                      />
                    </div>

                    <div className="form-group col-md-2">
                      <label htmlFor="isMandatory" className="form-label fw-bold">
                        Is Mandatory <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        id="isMandatory"
                        value={formData.isMandatory}
                        onChange={handleInputChange}
                        required
                        disabled={process}
                      >
                        <option value="Y">Yes</option>
                        <option value="N">No</option>
                      </select>
                    </div>

                    <div className="form-group col-md-2">
                      <label htmlFor="allowNa" className="form-label fw-bold">
                        Allow N/A <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        id="allowNa"
                        value={formData.allowNa}
                        onChange={handleInputChange}
                        required
                        disabled={process}
                      >
                        <option value="Y">Yes</option>
                        <option value="N">No</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={process || !isFormValid}
                    >
                      {process ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" />
                          Processing...
                        </>
                      ) : editingItem ? (
                        "Update"
                      ) : (
                        "Save"
                      )}
                    </button>

                    {editingItem && editingItem.status?.toUpperCase() === "N" && (
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
                      onClick={resetForm}
                      disabled={process}
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
                <div
                  className="modal d-block"
                  tabIndex="-1"
                  role="dialog"
                  style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                >
                  <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button
                          type="button"
                          className="btn-close"
                          onClick={() => handleConfirm(false)}
                          aria-label="Close"
                        ></button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to{" "}
                          {confirmDialog.newStatus?.toUpperCase() === "Y"
                            ? "activate"
                            : "deactivate"}{" "}
                          <strong>{confirmDialog.name}</strong> checklist item?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleConfirm(false)}
                          disabled={process}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleConfirm(true)}
                          disabled={process}
                        >
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

export default OTChecklistMaster;
