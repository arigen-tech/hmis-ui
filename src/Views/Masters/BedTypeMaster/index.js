import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_BED_TYPE } from "../../../config/apiConfig";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import { ADD_BED_TYPE_SUCC_MSG, DUPLICATE_BED_TYPE, FAIL_TO_SAVE_CHANGES, FAIL_TO_UPDATE_STS, FETCH_BED_TYPE_ERR_MSG, UPDATE_BED_TYPE_SUCC_MSG } from "../../../config/constants";
import Pagination, {DEFAULT_ITEMS_PER_PAGE} from "../../../Components/Pagination";

const BedTypeMaster = () => {
  const [bedTypeData, setBedTypeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    typeId: null,
    newStatus: "",
    name: ""
  });

  const [formData, setFormData] = useState({
    bedTypeName: "",
    description: ""
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const BED_TYPE_NAME_MAX_LENGTH = 50;
  const DESCRIPTION_MAX_LENGTH = 200;

  // Function to format date as dd/MM/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);

      // Check if date is valid
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

  const normalizeStatus = (status) =>
    typeof status === "string" ? status.trim().toLowerCase() : status;

  const isStatusActive = (status) => normalizeStatus(status) === "y";

  // Fetch bed type data
  const fetchBedTypeData = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_BED_TYPE}/getAll/${flag}`);
      if (response && response.response) {
        const mappedData = response.response.map(item => ({
          id: item.bedTypeId,
          bedTypeName: item.bedTypeName,
          description: item.description,
          status: item.status,
          lastUpdated: formatDate(item.lastUpdateDate),
          createdBy: item.createdBy,
          lastUpdatedBy: item.lastUpdatedBy
        }));
        setBedTypeData(mappedData);
      }
    } catch (err) {
      console.error("Error fetching bed type data:", err);
      showPopup(FETCH_BED_TYPE_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBedTypeData(0);
  }, []);

  // Filter data based on search query
  const filteredBedTypeData = bedTypeData.filter(type =>
    type.bedTypeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (type.description && type.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calculate pagination values
  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredBedTypeData.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Validate form whenever formData changes
  useEffect(() => {
    const validateForm = () => {
      const { bedTypeName, description } = formData;
      return (
        bedTypeName.trim() !== "" &&
        description.trim() !== ""
      );
    };
    setIsFormValid(validateForm());
  }, [formData]);

  const resetForm = () => {
    setFormData({ bedTypeName: "", description: "" });
    setIsFormValid(false);
    setEditingType(null);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setFormData({
      bedTypeName: type.bedTypeName,
      description: type.description || ""
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!isFormValid) {
      return;
    }

    setSaving(true);

    try {
      // Check for duplicates
      const isDuplicate = bedTypeData.some(
        (type) =>
          type.bedTypeName.toLowerCase() === formData.bedTypeName.toLowerCase() &&
          (!editingType || editingType.id !== type.id)
      );

      if (isDuplicate) {
        showPopup(DUPLICATE_BED_TYPE, "error");
        return;
      }

      if (editingType) {
        // Update existing bed type
        const response = await putRequest(`${MAS_BED_TYPE}/update/${editingType.id}`, {
          bedTypeName: formData.bedTypeName,
          description: formData.description,
        });

        if (response && response.status === 200) {
          setPopupMessage({
            message: UPDATE_BED_TYPE_SUCC_MSG,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              fetchBedTypeData();
              setShowForm(false);
            }
          });
        } else {
          throw new Error(response.message || "Update failed");
        }
      } else {
        // Add new bed type
        const response = await postRequest(`${MAS_BED_TYPE}/create`, {
          bedTypeName: formData.bedTypeName,
          description: formData.description,
        });

        if (response.status === 201 || response.status === 200) {
          setPopupMessage({
            message: ADD_BED_TYPE_SUCC_MSG,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              fetchBedTypeData();
              setShowForm(false);
            }
          });
        } else {
          throw new Error(response.message || "Save failed");
        }
      }
    } catch (err) {
      console.error("Error saving bed type data:", err);
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
    const newStatus = isStatusActive(currentStatus) ? "n" : "y";
    setConfirmDialog({ isOpen: true, typeId: id, newStatus, name });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.typeId !== null) {
      setSaving(true);

      try {
        const response = await putRequest(
          `${MAS_BED_TYPE}/status/${confirmDialog.typeId}?status=${confirmDialog.newStatus}`
        );

        if (response && response.status === 200) {
          setPopupMessage({
            message: `Bed type "${confirmDialog.name}" ${
              isStatusActive(confirmDialog.newStatus) ? "activated" : "deactivated"
            } successfully!`,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              fetchBedTypeData();
              setCurrentPage(1);
            },
          });
        } else {
          throw new Error(response.message || "Failed to update status");
        }
      } catch (err) {
        console.error("Error updating bed type status:", err);
        showPopup(FAIL_TO_UPDATE_STS, "error");
      } finally {
        setSaving(false);
      }
    }

    setConfirmDialog({
      isOpen: false,
      typeId: null,
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
    fetchBedTypeData();
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Bed Type Master</h4>
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
                          <th>Bed Type Name</th>
                          <th>Description</th>
                          <th>Last Updated</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((type) => (
                            <tr key={type.id}>
                              <td>{type.bedTypeName}</td>
                              <td>{type.description || "N/A"}</td>
                              <td>{type.lastUpdated}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={isStatusActive(type.status)}
                                    onChange={() => handleSwitchChange(type.id, type.status, type.bedTypeName)}
                                    id={`switch-${type.id}`}
                                  />
                                  <label
                                    className="form-check-label ms-2"
                                    htmlFor={`switch-${type.id}`}
                                  >
                                    {isStatusActive(type.status) ? 'Active' : 'Inactive'}
                                  </label>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleEdit(type)}
                                  disabled={!isStatusActive(type.status)}
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
                    totalItems={filteredBedTypeData.length}
                    itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                  />
                </>
              )}

              {showForm && (
                <form className="row" onSubmit={handleSave}>
                  <div className="form-group col-md-6">
                    <label>Bed Type Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="bedTypeName"
                      name="bedTypeName"
                      placeholder="Enter bed type name"
                      value={formData.bedTypeName}
                      onChange={handleInputChange}
                      maxLength={BED_TYPE_NAME_MAX_LENGTH}
                      required
                    />
                  </div>

                  <div className="form-group col-md-6">
                    <label>Description <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control mt-1"
                      id="description"
                      name="description"
                      placeholder="Enter description for bed type"
                      value={formData.description}
                      onChange={handleInputChange}
                      maxLength={DESCRIPTION_MAX_LENGTH}
                      rows="2"
                      required
                    />
                  </div>

                  <div className="form-group col-md-12 mt-3 d-flex justify-content-end">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid || saving}
                    >
                      {saving ? "Saving..." : editingType ? 'Update' : 'Save'}
                    </button>
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
                        {isStatusActive(confirmDialog.newStatus) ? "activate" : "deactivate"}{" "}
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

export default BedTypeMaster;