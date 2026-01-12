import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import { OPTH_SPECTACLE_USE } from "../../../config/apiConfig"; 
import LoadingScreen from "../../../Components/Loading";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import {
  ADD_SPECTACLE_USE_SUCC_MSG,
  DUPLICATE_SPECTACLE_USE,
  FAIL_TO_SAVE_CHANGES,
  FAIL_TO_UPDATE_STS,
  FETCH_SPECTACLE_USE_ERR_MSG,
  UPDATE_SPECTACLE_USE_SUCC_MSG
} from "../../../config/constants"; 
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination"

const SpectacleUseMaster = () => {
  const [spectacleUseData, setSpectacleUseData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    id: null, 
    newStatus: false, 
    useName: "" 
  });
  const [popupMessage, setPopupMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [formData, setFormData] = useState({
    useName: "",
  });
  const [loading, setLoading] = useState(true);

  const USE_NAME_MAX_LENGTH = 100;

  useEffect(() => {
    fetchSpectacleUseData(0);
  }, []);

  // Function to format date as dd-MM-YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "";
      }

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  const fetchSpectacleUseData = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${OPTH_SPECTACLE_USE}/getAll/${flag}`);
      if (response && response.response) {
        const mappedData = response.response.map(item => ({
          id: item.id,
          useName: item.useName,
          status: item.status,
          lastUpdated: formatDate(item.lastUpdateDate)
        }));
        setSpectacleUseData(mappedData);
      }
    } catch (err) {
      console.error("Error fetching spectacle use data:", err);
      showPopup(FETCH_SPECTACLE_USE_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredSpectacleUse = (spectacleUseData || []).filter(
    (spectacleUse) =>
      spectacleUse?.useName?.toLowerCase().includes(searchQuery?.toLowerCase() || "")
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredSpectacleUse.slice(indexOfFirst, indexOfLast);

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      useName: record.useName,
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);

      const isDuplicate = spectacleUseData.some(
        (spectacleUse) =>
          spectacleUse.useName.toLowerCase() === formData.useName.toLowerCase() &&
          (!editingRecord || editingRecord.id !== spectacleUse.id)
      );

      if (isDuplicate && !editingRecord) {
        showPopup(DUPLICATE_SPECTACLE_USE, "error");
        setLoading(false);
        return;
      }

      if (editingRecord) {
        const response = await putRequest(`${OPTH_SPECTACLE_USE}/update/${editingRecord.id}`, {
          useName: formData.useName,
        });

        if (response && response.status === 200) {
          fetchSpectacleUseData();
          showPopup(UPDATE_SPECTACLE_USE_SUCC_MSG, "success");
        }
      } else {
        const response = await postRequest(`${OPTH_SPECTACLE_USE}/create`, {
          useName: formData.useName,
        });

        if (response && response.status === 200) {
          fetchSpectacleUseData();
          showPopup(ADD_SPECTACLE_USE_SUCC_MSG, "success");
        }
      }

      setEditingRecord(null);
      setFormData({ useName: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving spectacle use:", err);
      showPopup(FAIL_TO_SAVE_CHANGES, "error");
    } finally {
      setLoading(false);
    }
  };

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      },
    });
  };

  const handleSwitchChange = (id, newStatus, useName) => {
    setConfirmDialog({ isOpen: true, id: id, newStatus, useName });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.id !== null) {
      try {
        setLoading(true);
        const response = await putRequest(
          `${OPTH_SPECTACLE_USE}/status/${confirmDialog.id}?status=${confirmDialog.newStatus}`
        );
        if (response && response.response) {
          setSpectacleUseData((prevData) =>
            prevData.map((spectacleUse) =>
              spectacleUse.id === confirmDialog.id
                ? { ...spectacleUse, status: confirmDialog.newStatus }
                : spectacleUse
            )
          );
          showPopup(
            `Spectacle Use ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
            "success"
          );
        }
      } catch (err) {
        console.error("Error updating spectacle use status:", err);
        showPopup(FAIL_TO_UPDATE_STS, "error");
      } finally {
        setLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: null, useName: "" });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
    setIsFormValid(formData.useName.trim() !== "");
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchSpectacleUseData();
  };

  const handleBack = () => {
    setEditingRecord(null);
    setFormData({ useName: "" });
    setShowForm(false);
    setIsFormValid(false);
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Spectacle Use Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm ? (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search Spectacle Use"
                        aria-label="Search"
                        value={searchQuery}
                        onChange={handleSearchChange}
                      />
                      <span className="input-group-text" id="search-icon">
                        <i className="fa fa-search"></i>
                      </span>
                    </div>
                  </form>
                ) : (
                  <></>
                )}

                <div className="d-flex align-items-center">
                  {!showForm ? (
                    <>
                      <button type="button" className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                        <i className="mdi mdi-plus"></i> Add
                      </button>
                      <button type="button" className="btn btn-success me-2 flex-shrink-0" onClick={handleRefresh}>
                        <i className="mdi mdi-refresh"></i> Show All
                      </button>
                    </>
                  ) : (
                    <button type="button" className="btn btn-secondary" onClick={handleBack}>
                      <i className="mdi mdi-arrow-left"></i> Back
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <LoadingScreen />
              ) : !showForm ? (
                <>
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                        
                          <th>Spectacle Use</th>
                          <th>Last Updated</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((spectacleUse) => (
                            <tr key={spectacleUse.id}>
                            
                              <td>{spectacleUse.useName}</td>
                              <td>{spectacleUse.lastUpdated}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={spectacleUse.status === "y"}
                                    onChange={() => handleSwitchChange(
                                      spectacleUse.id, 
                                      spectacleUse.status === "y" ? "n" : "y", 
                                      spectacleUse.useName
                                    )}
                                    id={`switch-${spectacleUse.id}`}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${spectacleUse.id}`}
                                  >
                                    {spectacleUse.status === "y" ? "Active" : "Deactivated"}
                                  </label>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(spectacleUse)}
                                  disabled={spectacleUse.status !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center">
                              No spectacle use data found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* PAGINATION USING REUSABLE COMPONENT */}
                  {filteredSpectacleUse.length > 0 && (
                    <Pagination
                      totalItems={filteredSpectacleUse.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="form-group col-md-4">
                    <label>Spectacle Use Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="useName"
                      placeholder="Enter Spectacle Use Name"
                      value={formData.useName}
                      onChange={handleInputChange}
                      maxLength={USE_NAME_MAX_LENGTH}
                      required
                    />
                  </div>
                  <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                    <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                      Save
                    </button>
                    <button type="button" className="btn btn-danger" onClick={handleBack}>
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
                <div className="modal d-block" tabIndex="-1" role="dialog">
                  <div className="modal-dialog" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button type="button" className="close" onClick={() => handleConfirm(false)}>
                          <span>&times;</span>
                        </button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                          <strong>{confirmDialog.useName}</strong>?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>
                          No
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>
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

export default SpectacleUseMaster;