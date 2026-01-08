import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import { MAS_TOOTH_CONDITION } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import {
  ADD_TOOTH_CONDITION_SUCC_MSG,
  DUPLICATE_TOOTH_CONDITION,
  FAIL_TO_SAVE_CHANGES,
  FAIL_TO_UPDATE_STS,
  FETCH_TOOTH_CONDITION_ERR_MSG,
  UPDATE_TOOTH_CONDITION_SUCC_MSG
} from "../../../config/constants";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const ToothConditionMaster = () => {
  const [toothConditionData, setToothConditionData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    conditionId: null, 
    newStatus: false, 
    conditionName: "" 
  });
  const [popupMessage, setPopupMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [formData, setFormData] = useState({
    conditionName: "",
    isExclusive: "n", // Changed to "N" as default
    points: "",
  });
  const [loading, setLoading] = useState(true);

  const CONDITION_NAME_MAX_LENGTH = 50;

  useEffect(() => {
    fetchToothConditionData(0);
  }, []);

  // Function to format date as dd-MM-YYYY
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

  const fetchToothConditionData = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_TOOTH_CONDITION}/getAll/${flag}`);
      if (response && response.response) {
        const mappedData = response.response.map(item => ({
          id: item.conditionId,
          conditionName: item.conditionName,
          isExclusive: item.isExclusive,
          points: item.points,
          status: item.status,
          lastUpdated: formatDate(item.lastUpdateDate)
        }));
        setToothConditionData(mappedData);
      }
    } catch (err) {
      console.error("Error fetching tooth condition data:", err);
      showPopup(FETCH_TOOTH_CONDITION_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredToothCondition = (toothConditionData || []).filter(
    (toothCondition) =>
      toothCondition?.conditionName?.toLowerCase().includes(searchQuery?.toLowerCase() || "")
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredToothCondition.slice(indexOfFirst, indexOfLast);

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      conditionName: record.conditionName,
      isExclusive: record.isExclusive || "n", // Ensure we get the value from record
      points: record.points || "",
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);

      const isDuplicate = toothConditionData.some(
        (toothCondition) =>
          toothCondition.conditionName.toLowerCase() === formData.conditionName.toLowerCase() &&
          (!editingRecord || editingRecord.id !== toothCondition.id)
      );

      if (isDuplicate && !editingRecord) {
        showPopup(DUPLICATE_TOOTH_CONDITION, "error");
        setLoading(false);
        return;
      }

      // Prepare data for API
      const requestData = {
        conditionName: formData.conditionName,
        isExclusive: formData.isExclusive, // Already in correct format
        points: formData.points ? parseInt(formData.points) : null
      };

      if (editingRecord) {
        const response = await putRequest(`${MAS_TOOTH_CONDITION}/update/${editingRecord.id}`, requestData);

        if (response && response.status === 200) {
          fetchToothConditionData();
          showPopup(UPDATE_TOOTH_CONDITION_SUCC_MSG, "success");
        }
      } else {
        const response = await postRequest(`${MAS_TOOTH_CONDITION}/create`, requestData);

        if (response && response.status === 200) {
          fetchToothConditionData();
          showPopup(ADD_TOOTH_CONDITION_SUCC_MSG, "success");
        }
      }

      setEditingRecord(null);
      setFormData({ conditionName: "", isExclusive: "N", points: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving tooth condition:", err);
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

  const handleSwitchChange = (id, newStatus, conditionName) => {
    setConfirmDialog({ isOpen: true, conditionId: id, newStatus, conditionName });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.conditionId !== null) {
      try {
        setLoading(true);
        const response = await putRequest(
          `${MAS_TOOTH_CONDITION}/status/${confirmDialog.conditionId}?status=${confirmDialog.newStatus}`
        );
        if (response && response.response) {
          setToothConditionData((prevData) =>
            prevData.map((toothCondition) =>
              toothCondition.id === confirmDialog.conditionId
                ? { ...toothCondition, status: confirmDialog.newStatus }
                : toothCondition
            )
          );
          showPopup(
            `Tooth Condition ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
            "success"
          );
        }
      } catch (err) {
        console.error("Error updating tooth condition status:", err);
        showPopup(FAIL_TO_UPDATE_STS, "error");
      } finally {
        setLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, conditionId: null, newStatus: null, conditionName: "" });
  };

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    
    if (type === "checkbox" && id === "isExclusive") {
      setFormData((prevData) => ({ 
        ...prevData, 
        [id]: checked ? "y" : "n" 
      }));
    } else {
      setFormData((prevData) => ({ ...prevData, [id]: value }));
    }
    
    // Validate form - check condition name only
    if (id === "conditionName") {
      setIsFormValid(value.trim() !== "");
    }
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchToothConditionData();
  };

  const handleBack = () => {
    setEditingRecord(null);
    setFormData({ conditionName: "", isExclusive: "n", points: "" });
    setShowForm(false);
    setIsFormValid(false);
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Tooth Condition Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm ? (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search Tooth Condition"
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
                          <th>Condition Name</th>
                          <th>Exclusive</th>
                          <th>Points</th>
                          <th>Last Updated</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((toothCondition) => (
                            <tr key={toothCondition.id}>
                              <td>{toothCondition.conditionName}</td>
                              <td>
                                <span className={`badge ${toothCondition.isExclusive === "y" ? "bg-success" : "bg-danger"}`}>
                                  {toothCondition.isExclusive === "y" ? "Yes" : "No"}
                                </span>
                              </td>
                              <td>{toothCondition.points || ""}</td>
                              <td>{toothCondition.lastUpdated}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={toothCondition.status === "y"}
                                    onChange={() => handleSwitchChange(
                                      toothCondition.id, 
                                      toothCondition.status === "y" ? "n" : "y", 
                                      toothCondition.conditionName
                                    )}
                                    id={`switch-${toothCondition.id}`}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${toothCondition.id}`}
                                  >
                                    {toothCondition.status === "y" ? "Active" : "Deactivated"}
                                  </label>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(toothCondition)}
                                  disabled={toothCondition.status !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="text-center">
                              No tooth condition data found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* PAGINATION USING REUSABLE COMPONENT */}
                  {filteredToothCondition.length > 0 && (
                    <Pagination
                      totalItems={filteredToothCondition.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="form-group col-md-4">
                    <label>Condition Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="conditionName"
                      placeholder="Enter Condition Name"
                      value={formData.conditionName}
                      onChange={handleInputChange}
                      maxLength={CONDITION_NAME_MAX_LENGTH}
                      required
                    />
                  </div>
                  
                  <div className="form-group col-md-3">
                    <label>Points</label>
                    <input
                      type="number"
                      className="form-control mt-1"
                      id="points"
                      placeholder="Enter Points"
                      value={formData.points}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="form-group col-md-3">
                    <div className="form-check mt-4 pt-3">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="isExclusive"
                        checked={formData.isExclusive === "y"} // Check if value is "Y"
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label" htmlFor="isExclusive">
                        Exclusive
                      </label>
                    </div>
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
                          <strong>{confirmDialog.conditionName}</strong>?
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

export default ToothConditionMaster;