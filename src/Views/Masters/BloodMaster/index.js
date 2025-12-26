import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import axios from "axios";
import { API_HOST, MAS_BLOODGROUP } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading";
import { postRequest, putRequest, getRequest } from "../../../service/apiService"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { FETCH_BLOOD_GROUP_ERR_MSG,DUPLICATE_BLOOD_GROUP,UPDATE_BLOOD_GROUP_SUCC_MSG,ADD_BLOOD_GROUP_SUCC_MSG,FAIL_TO_SAVE_CHANGES
  ,FAIL_TO_UPDATE_STS,INVALID_BLOOD_GROUP_ID
 } from "../../../config/constants";

const BloodGroupMaster = () => {
  const [bloodGroups, setBloodGroups] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, bloodGroupId: null, newStatus: false });
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    bloodGroupCode: "",
    bloodGroupName: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingBloodGroup, setEditingBloodGroup] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const BLOOD_NAME_MAX_LENGTH = 30;
  const BLOOD_CODE_MAX_LENGTH = 8;

  useEffect(() => {
    fetchBloodGroups(0);
  }, []);

  const fetchBloodGroups = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_BLOODGROUP}/getAll/${flag}`);

      if (response && response.response) {
        setBloodGroups(response.response);
      }
    } catch (err) {
      console.error("Error fetching blood groups data:", err);
      showPopup(FETCH_BLOOD_GROUP_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredBloodGroups = bloodGroups.filter(
    (bloodGroup) =>
      bloodGroup.bloodGroupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bloodGroup.bloodGroupCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredBloodGroups.slice(indexOfFirstItem, indexOfLastItem);

  const handleEdit = (bloodGroup) => {
    setEditingBloodGroup(bloodGroup);
    setFormData({
      bloodGroupCode: bloodGroup.bloodGroupCode,
      bloodGroupName: bloodGroup.bloodGroupName,
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);

      const isDuplicate = bloodGroups.some(
        (group) =>
          group.bloodGroupCode === formData.bloodGroupCode ||
          group.bloodGroupName === formData.bloodGroupName
      );

      if (isDuplicate) {
        showPopup(DUPLICATE_BLOOD_GROUP, "error");
        setLoading(false);
        return;
      }

      if (editingBloodGroup) {
        const response = await putRequest(`${MAS_BLOODGROUP}/updateById/${editingBloodGroup.bloodGroupId}`, {
          bloodGroupCode: formData.bloodGroupCode,
          bloodGroupName: formData.bloodGroupName,
          status: editingBloodGroup.status,
        });

        if (response && response.response) {
          setBloodGroups((prevData) =>
            prevData.map((group) =>
              group.bloodGroupId === editingBloodGroup.bloodGroupId ? response.response : group
            )
          );
          showPopup(UPDATE_BLOOD_GROUP_SUCC_MSG, "success");
        }
      } else {
        const response = await postRequest(`${MAS_BLOODGROUP}/create`, {
          bloodGroupCode: formData.bloodGroupCode,
          bloodGroupName: formData.bloodGroupName,
          status: "y",
        });

        if (response && response.response) {
          setBloodGroups([...bloodGroups, response.response]);
          showPopup(ADD_BLOOD_GROUP_SUCC_MSG, "success");
        }
      }

      setEditingBloodGroup(null);
      setFormData({ bloodGroupCode: "", bloodGroupName: "" });
      setShowForm(false);
      fetchBloodGroups();
    } catch (err) {
      console.error("Error saving blood group:", err);
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

  const handleSwitchChange = (bloodGroupId, newStatus) => {
    console.log("Switch change - ID:", bloodGroupId, "New status:", newStatus);
    if (bloodGroupId === undefined || bloodGroupId === null) {
      console.error("Invalid ID received in handleSwitchChange");
      showPopup(INVALID_BLOOD_GROUP_ID, "error");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      bloodGroupId: bloodGroupId,
      newStatus: newStatus,
    });
  };

  const handleConfirm = async (confirmed) => {
    console.log("Confirm dialog state:", confirmDialog);

    if (confirmed && confirmDialog.bloodGroupId !== null) {
      try {
        setLoading(true);
        console.log("Making API call with ID:", confirmDialog.bloodGroupId, "Status:", confirmDialog.newStatus);

        const response = await putRequest(
          `${MAS_BLOODGROUP}/status/${confirmDialog.bloodGroupId}?status=${confirmDialog.newStatus}`
        );

        console.log("API response:", response);

        if (response && response.response) {
          setBloodGroups((prevData) =>
            prevData.map((group) =>
              group.bloodGroupId === confirmDialog.bloodGroupId
                ? { ...group, status: confirmDialog.newStatus }
                : group
            )
          );

          showPopup(
            `Blood group ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
            "success"
          );
        } else {
          throw new Error("Invalid response structure");
        }
      } catch (err) {
        console.error("Error updating blood group status:", err);
        showPopup(FAIL_TO_UPDATE_STS, "error");
      } finally {
        setLoading(false);
      }
    }

    setConfirmDialog({ isOpen: false, bloodGroupId: null, newStatus: null });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
    setIsFormValid(formData.bloodGroupCode.trim() !== "" && formData.bloodGroupName.trim() !== "");
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchBloodGroups();
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Blood Group Master</h4>
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
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={() => {
                          setEditingBloodGroup(null);
                          setFormData({ bloodGroupCode: "", bloodGroupName: "" });
                          setIsFormValid(false);
                          setShowForm(true);
                        }}
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
              {loading ? (
                <LoadingScreen />
              ) : !showForm ? (
                <>
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Blood Code</th>
                          <th>Blood Name</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((bloodGroup) => (
                            <tr key={bloodGroup.bloodGroupId}>
                              <td>{bloodGroup.bloodGroupCode}</td>
                              <td>{bloodGroup.bloodGroupName}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={bloodGroup.status === "y"}
                                    onChange={() => handleSwitchChange(bloodGroup.bloodGroupId, bloodGroup.status === "y" ? "n" : "y")}
                                    id={`switch-${bloodGroup.bloodGroupId}`}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${bloodGroup.bloodGroupId}`}
                                  >
                                    {bloodGroup.status === "y" ? "Active" : "Deactivated"}
                                  </label>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(bloodGroup)}
                                  disabled={bloodGroup.status !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center">No blood group data found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* PAGINATION USING REUSABLE COMPONENT */}
                  {filteredBloodGroups.length > 0 && (
                    <Pagination
                      totalItems={filteredBloodGroups.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="form-group col-md-4">
                    <label>Blood Group Code <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control  mt-1"
                      id="bloodGroupCode"
                      name="bloodGroupCode"
                      placeholder="e.g., O+"
                      value={formData.bloodGroupCode}
                      onChange={handleInputChange}
                      maxLength={BLOOD_CODE_MAX_LENGTH}
                      required
                    />
                  </div>
                  <div className="form-group col-md-4">
                    <label>Blood Group Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control  mt-1"
                      id="bloodGroupName"
                      name="bloodGroupName"
                      placeholder="Blood Group Name"
                      value={formData.bloodGroupName}
                      onChange={handleInputChange}
                      maxLength={BLOOD_NAME_MAX_LENGTH}
                      required
                    />
                  </div>
                  <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                    <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                      Save
                    </button>
                    <button type="button" className="btn btn-danger" onClick={() => setShowForm(false)}>
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
                          <strong>{bloodGroups.find((group) => group.bloodGroupId === confirmDialog.bloodGroupId)?.bloodGroupName}</strong>?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>No</button>
                        <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>Yes</button>
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

export default BloodGroupMaster;