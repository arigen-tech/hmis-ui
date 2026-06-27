import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_BED_STATUS } from "../../../config/apiConfig";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import { ADD_BED_STATUS_SUCC_MSG, DUPLICATE_BED_STATUS, FAIL_TO_SAVE_CHANGES, FAIL_TO_UPDATE_STS, FETCH_BED_STATUS_ERR_MSG, UPDATE_BED_STATUS_SUCC_MSG } from "../../../config/constants";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";  

const BedStatusMaster = () => {
  const [bedStatusData, setBedStatusData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    statusId: null,
    newStatus: "",
    name: ""
  });

  const [formData, setFormData] = useState({
    statusName: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const STATUS_NAME_MAX_LENGTH = 50;

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

  // Fetch bed status data
  const fetchBedStatusData = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_BED_STATUS}/getAll/${flag}`);
      if (response && response.response) {
        const mappedData = response.response.map(item => ({
          id: item.bedStatusId,
          statusName: item.bedStatusName,
          status: item.status,
          lastUpdated: formatDate(item.lastUpdateDate)
        }));
        setBedStatusData(mappedData);
      }
    } catch (err) {
      console.error("Error fetching bed status data:", err);
      showPopup(FETCH_BED_STATUS_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBedStatusData(0);
  }, []);

  // Filter data based on search query
  const filteredBedStatusData = bedStatusData.filter(status =>
    status.statusName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination values
  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredBedStatusData.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Validate form whenever formData changes
  useEffect(() => {
    const validateForm = () => {
      return formData.statusName.trim() !== "";
    };
    setIsFormValid(validateForm());
  }, [formData]);

  const resetForm = () => {
    setFormData({ statusName: "" });
    setIsFormValid(false);
    setEditingStatus(null);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleEdit = (status) => {
    setEditingStatus(status);
    setFormData({
      statusName: status.statusName,
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
      const payload = {
        bedStatusName: formData.statusName,
      };

      let response;

      if (editingStatus) {
        response = await putRequest(
          `${MAS_BED_STATUS}/update/${editingStatus.id}`,
          payload
        );

        if (response && response.status === 200) {
          setPopupMessage({
            message: UPDATE_BED_STATUS_SUCC_MSG,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              setShowForm(false);
            }
          });
        } else {
          throw new Error(response.message || "Update failed");
        }
      } else {
        response = await postRequest(
          `${MAS_BED_STATUS}/create`,
          payload
        );

        if (response.status === 201 || response.status === 200) {
          setPopupMessage({
            message: ADD_BED_STATUS_SUCC_MSG,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              setShowForm(false);
            }
          });
        } else {
          throw new Error(response.message || "Save failed");
        }
      }
    } catch (err) {
      console.error("Error saving bed status data:", err);
      showPopup(
        err.response?.data?.message || FAIL_TO_SAVE_CHANGES,
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const showPopup = (message, type = 'info', onCloseCallback = null) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
                setPopupMessage(null);
                if (onCloseCallback) onCloseCallback();
            }
    });
  };

  const handleSwitchChange = (id, currentStatus, name) => {
    const newStatus = isStatusActive(currentStatus) ? "n" : "y";
    setConfirmDialog({ isOpen: true, statusId: id, newStatus, name });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.statusId !== null) {
      setSaving(true);

      try {
        const response = await putRequest(
          `${MAS_BED_STATUS}/status/${confirmDialog.statusId}?status=${confirmDialog.newStatus}`
        );

        if (response && response.status === 200) {
          setPopupMessage({
            message: `Bed status "${confirmDialog.name}" ${
              isStatusActive(confirmDialog.newStatus) ? "activated" : "deactivated"
            } successfully!`,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              fetchBedStatusData();
              setCurrentPage(1);
            },
          });
        } else {
          throw new Error(response.message || "Failed to update status");
        }
      } catch (err) {
        console.error("Error updating bed status:", err);
        showPopup(FAIL_TO_UPDATE_STS, "error");
      } finally {
        setSaving(false);
      }
    }

    setConfirmDialog({
      isOpen: false,
      statusId: null,
      newStatus: "",
      name: "",
    });
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchBedStatusData();
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Bed Status Master</h4>
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
                          <th>Bed Status Name</th>
                          <th>Last Updated</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((status) => (
                            <tr key={status.id}>
                              <td>{status.statusName}</td>
                              <td>{status.lastUpdated}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={isStatusActive(status.status)}
                                    onChange={() => handleSwitchChange(status.id, status.status, status.statusName)}
                                    id={`switch-${status.id}`}
                                  />
                                  <label
                                    className="form-check-label ms-2"
                                    htmlFor={`switch-${status.id}`}
                                  >
                                    {isStatusActive(status.status) ? 'Active' : 'Inactive'}
                                  </label>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleEdit(status)}
                                  disabled={!isStatusActive(status.status)}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center">No Records Found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    totalItems={filteredBedStatusData.length}
                    itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                  />
                </>
              )}

              {showForm && (
                <form className="row" onSubmit={handleSave}>
                  <div className="form-group col-md-6">
                    <label>Bed Status Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="statusName"
                      name="statusName"
                      value={formData.statusName}
                      onChange={(e) =>
                        setFormData({ ...formData, statusName: e.target.value })
                      }
                      maxLength={STATUS_NAME_MAX_LENGTH}
                      required
                    />
                  </div>

                  <div className="form-group col-md-12 mt-3 d-flex justify-content-end">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid || saving}
                    >
                      {saving ? "Saving..." : editingStatus ? 'Update' : 'Save'}
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

export default BedStatusMaster;