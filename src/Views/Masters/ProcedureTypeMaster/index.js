import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_PROCEDURE_TYPE } from "../../../config/apiConfig";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import { ACTIVATE_PROCEDURE_TYPE_ERR_MSG, ACTIVATE_PROCEDURE_TYPE_SUCC_MSG, ADD_PROCEDURE_TYPE_SUCC_MSG, DUPLICATE_PROCEDURE_TYPE, FAIL_TO_SAVE_CHANGES, FAIL_TO_UPDATE_STS, FETCH_PROCEDURE_TYPE_ERR_MSG, UPDATE_PROCEDURE_TYPE_SUCC_MSG } from "../../../config/constants";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const ProcedureTypeMaster = () => {
  const [procedureTypeData, setProcedureTypeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    procedureTypeId: null,
    newStatus: "",
    name: ""
  });

  const [formData, setFormData] = useState({
    procedureTypeName: "",
    description: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingProcedureType, setEditingProcedureType] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const PROCEDURE_TYPE_NAME_MAX_LENGTH = 100;

  // Function to format date as dd/MM/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        return "N/A";
      }

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  // Fetch procedure type data
  const fetchProcedureTypeData = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_PROCEDURE_TYPE}/getAll/${flag}`);
      if (response && response.response) {
        const mappedData = response.response.map(item => ({
          id: item.procedureTypeId,
          procedureTypeName: item.procedureTypeName,
          description: item.description || "N/A",
          status: item.status,
          lastUpdated: formatDate(item.lastUpdateDate),
          createdBy: item.createdBy || "",
          lastUpdatedBy: item.lastUpdatedBy || ""
        }));
        setProcedureTypeData(mappedData);
      }
    } catch (err) {
      console.error("Error fetching procedure type data:", err);
      showPopup(FETCH_PROCEDURE_TYPE_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchProcedureTypeData(0);
  }, []);

  // Filter data based on search query
  const filteredProcedureTypeData = procedureTypeData.filter(procedureType =>
    procedureType.procedureTypeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    procedureType.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination values
  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredProcedureTypeData.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Validate form whenever formData changes
  useEffect(() => {
    const validateForm = () => {
      const { procedureTypeName, description } = formData;
      return (
        procedureTypeName.trim() !== "" &&
        description.trim() !== ""
      );
    };
    setIsFormValid(validateForm());
  }, [formData]);

  const resetForm = () => {
    setFormData({ procedureTypeName: "", description: "" });
    setIsFormValid(false);
    setEditingProcedureType(null);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleEdit = (procedureType) => {
    setEditingProcedureType(procedureType);
    setFormData({
      procedureTypeName: procedureType.procedureTypeName || "",
      description: procedureType.description || "",
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!isFormValid || saving) {
      return;
    }

    // Check for duplicates (case-insensitive)
    const isDuplicate = procedureTypeData.some(
      (procedureType) =>
        procedureType.procedureTypeName.toLowerCase() === formData.procedureTypeName.toLowerCase() &&
        (!editingProcedureType || editingProcedureType.id !== procedureType.id)
    );

    if (isDuplicate) {
      showPopup(DUPLICATE_PROCEDURE_TYPE, "error");
      return;
    }

    setSaving(true);

    try {
      const requestData = {
        procedureTypeName: formData.procedureTypeName,
        description: formData.description
      };

      if (editingProcedureType) {
        // Update existing procedure type
        const response = await putRequest(`${MAS_PROCEDURE_TYPE}/update/${editingProcedureType.id}`, requestData);

        if (response && response.status === 200) {
          setPopupMessage({
            message: UPDATE_PROCEDURE_TYPE_SUCC_MSG,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              fetchProcedureTypeData();
              setShowForm(false);
            }
          });
        } else {
          throw new Error(response.message || "Update failed");
        }
      } else {
        // Add new procedure type
        const response = await postRequest(`${MAS_PROCEDURE_TYPE}/create`, requestData);

        if (response.status === 201 || response.status === 200) {
          setPopupMessage({
            message: ADD_PROCEDURE_TYPE_SUCC_MSG,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              fetchProcedureTypeData();
              setShowForm(false);
            }
          });
        } else {
          throw new Error(response.message || "Save failed");
        }
      }
    } catch (err) {
      console.error("Error saving procedure type data:", err);
      showPopup(
        err.response?.data?.message || FAIL_TO_SAVE_CHANGES,
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const showPopup = (message, type = 'info') => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      }
    });
  };

  const handleSwitchChange = (id, currentStatus, name) => {
    const newStatus = currentStatus === "y" ? "n" : "y";
    setConfirmDialog({ isOpen: true, procedureTypeId: id, newStatus, name });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.procedureTypeId !== null) {
      setSaving(true);

      try {
        const response = await putRequest(
          `${MAS_PROCEDURE_TYPE}/status/${confirmDialog.procedureTypeId}?status=${confirmDialog.newStatus}`
        );

        if (response && response.status === 200) {
          setPopupMessage({
            message: `Procedure type "${confirmDialog.name}" ${
              confirmDialog.newStatus === "y" ? "activated" : "deactivated"
            } successfully!`,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              fetchProcedureTypeData();
              setCurrentPage(1);
            },
          });
        } else {
          throw new Error(response.message || "Failed to update status");
        }
      } catch (err) {
        console.error("Error updating procedure type status:", err);
        showPopup(FAIL_TO_UPDATE_STS, "error");
      } finally {
        setSaving(false);
      }
    }

    setConfirmDialog({
      isOpen: false,
      procedureTypeId: null,
      newStatus: "",
      name: "",
    });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchProcedureTypeData();
  };

  // Handle activate for deactive records in edit mode
  const handleActivate = async () => {
    if (editingProcedureType && editingProcedureType.status === "n") {
      setSaving(true);

      try {
        const response = await putRequest(
          `${MAS_PROCEDURE_TYPE}/status/${editingProcedureType.id}?status=y`
        );

        if (response && response.status === 200) {
          setPopupMessage({
            message: ACTIVATE_PROCEDURE_TYPE_SUCC_MSG,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              fetchProcedureTypeData();
              setShowForm(false);
            }
          });
        } else {
          throw new Error(response.message || "Activation failed");
        }
      } catch (err) {
        console.error("Error activating procedure type:", err);
        showPopup(ACTIVATE_PROCEDURE_TYPE_ERR_MSG, "error");
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Procedure Type Master</h4>
              <div className="d-flex align-items-center">
                {!showForm && (
                  <input
                    className="form-control w-50 me-2"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                )}

                {!showForm ? (
                  <>
                    <button
                      className="btn btn-success me-2"
                      onClick={() => {
                        resetForm();
                        setShowForm(true);
                      }}
                    >
                      Add
                    </button>
                    <button className="btn btn-success flex-shrink-0" onClick={handleRefresh}>
                      Show All
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                  >
                    Back
                  </button>
                )}
              </div>
            </div>

            <div className="card-body">
              {loading && !showForm && <LoadingScreen />}

              {!showForm && !loading && (
                <>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Procedure Type Name</th>
                          <th>Description</th>
                          <th>Last Updated</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((procedureType) => (
                            <tr key={procedureType.id}>
                              <td>{procedureType.procedureTypeName || "N/A"}</td>
                              <td>{procedureType.description}</td>
                              <td>{procedureType.lastUpdated}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={procedureType.status === "y"}
                                    onChange={() => handleSwitchChange(procedureType.id, procedureType.status, procedureType.procedureTypeName)}
                                    id={`switch-${procedureType.id}`}
                                  />
                                  <label
                                    className="form-check-label ms-2"
                                    htmlFor={`switch-${procedureType.id}`}
                                  >
                                    {procedureType.status === "y" ? 'Active' : 'Inactive'}
                                  </label>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleEdit(procedureType)}
                                  disabled={procedureType.status !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center">No Records Found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    totalItems={filteredProcedureTypeData.length}
                    itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                  />
                </>
              )}

              {showForm && (
                <form className="row" onSubmit={handleSave}>
                  <div className="form-group col-md-6">
                    <label>Procedure Type Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="procedureTypeName"
                      name="procedureTypeName"
                      placeholder="Enter procedure type name (e.g., Surgical)"
                      value={formData.procedureTypeName}
                      onChange={handleInputChange}
                      maxLength={PROCEDURE_TYPE_NAME_MAX_LENGTH}
                      required
                    />
                  </div>

                  <div className="form-group col-md-6">
                    <label>Description <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control mt-1"
                      id="description"
                      name="description"
                      placeholder="Enter description for this procedure type"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      required
                    />
                  </div>

                  <div className="form-group col-md-12 mt-3 d-flex justify-content-end">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid || saving}
                    >
                      {saving ? "Saving..." : editingProcedureType ? 'Update' : 'Save'}
                    </button>

                    {editingProcedureType && editingProcedureType.status === "n" && (
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={handleActivate}
                        disabled={saving}
                      >
                        {saving ? "Activating..." : "Activate"}
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => {
                        resetForm();
                        setShowForm(false);
                      }}
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
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-body">
                        Are you sure you want to{" "}
                        {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                        <strong>{confirmDialog.name}</strong>?
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcedureTypeMaster;