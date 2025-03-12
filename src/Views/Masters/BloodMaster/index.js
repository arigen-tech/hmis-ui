import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import axios from "axios";
import { API_HOST } from "../../../config/apiConfig";

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
  const [filteredTotalPages, setFilteredTotalPages] = useState(1);
  const [totalFilteredProducts, setTotalFilteredProducts] = useState(0);
  const [itemsPerPage] = useState(10);
  const BLOOD_NAME_MAX_LENGTH = 30;
  const BLOOD_CODE_MAX_LENGTH = 8;

  // Fetch blood groups from API
  useEffect(() => {
    fetchBloodGroups();
  }, []);

  const fetchBloodGroups = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_HOST}/blood-group/all`);

      console.log("API Response:", response.data);

      if (response.data && response.data.response) {
        console.log("First blood group in response:", response.data.response[0]);
        setBloodGroups(response.data.response);
        setTotalFilteredProducts(response.data.response.length);
        setFilteredTotalPages(Math.ceil(response.data.response.length / itemsPerPage));
      }
    } catch (err) {
      console.error("Error fetching blood groups:", err);
      showPopup("Failed to load blood groups", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const filteredBloodGroups = bloodGroups.filter(
    (bloodGroup) =>
      bloodGroup.bloodGroupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bloodGroup.bloodGroupCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
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

      // Check for duplicate blood group before saving
      const isDuplicate = bloodGroups.some(
        (group) =>
          group.bloodGroupCode.toLowerCase() === formData.bloodGroupCode.toLowerCase() ||
          group.bloodGroupName.toLowerCase() === formData.bloodGroupName.toLowerCase()
      );

      if (isDuplicate) {
        showPopup("Blood group with the same code or name already exists!", "error");
        setLoading(false);
        return;
      }

      if (editingBloodGroup) {
        // Update existing blood group
        const response = await axios.put(`${API_HOST}/blood-group/update/${editingBloodGroup.bloodGroupId}`, {
          bloodGroupCode: formData.bloodGroupCode,
          bloodGroupName: formData.bloodGroupName,
          status: editingBloodGroup.status,
        });

        if (response.data && response.data.response) {
          setBloodGroups((prevData) =>
            prevData.map((group) =>
              group.bloodGroupId === editingBloodGroup.bloodGroupId ? response.data.response : group
            )
          );
          showPopup("Blood group updated successfully!", "success");
        }
      } else {
        // Add new blood group
        const response = await axios.post(`${API_HOST}/blood-group/add`, {
          bloodGroupCode: formData.bloodGroupCode,
          bloodGroupName: formData.bloodGroupName,
          status: "y",
        });

        if (response.data && response.data.response) {
          setBloodGroups([...bloodGroups, response.data.response]);
          showPopup("New blood group added successfully!", "success");
        }
      }

      // Reset form and refresh data
      setEditingBloodGroup(null);
      setFormData({ bloodGroupCode: "", bloodGroupName: "" });
      setShowForm(false);
      fetchBloodGroups(); // Refresh data from backend
    } catch (err) {
      console.error("Error saving blood group:", err);
      showPopup(`Failed to save changes: ${err.response?.data?.message || err.message}`, "error");
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

  // Modified handler for switch change
  const handleSwitchChange = (bloodGroupId, newStatus) => {
    console.log("Switch change - ID:", bloodGroupId, "New status:", newStatus); // Debug log
    if (bloodGroupId === undefined || bloodGroupId === null) {
      console.error("Invalid ID received in handleSwitchChange");
      showPopup("Error: Invalid blood group ID", "error");
      return;
    }

    // Store the ID in a local variable to ensure it's not lost
    setConfirmDialog({
      isOpen: true,
      bloodGroupId: bloodGroupId,
      newStatus: newStatus,
    });
  };

  // Modified confirm handler
  const handleConfirm = async (confirmed) => {
    console.log("Confirm dialog state:", confirmDialog); // Debug log

    if (confirmed && confirmDialog.bloodGroupId) {
      try {
        setLoading(true);
        console.log("Making API call with ID:", confirmDialog.bloodGroupId, "Status:", confirmDialog.newStatus);

        // Make the API call with the ID as a path variable and status as a query parameter
        const response = await axios.put(
          `${API_HOST}/blood-group/status/${confirmDialog.bloodGroupId}`,
          {},
          { params: { status: confirmDialog.newStatus } }
        );

        if (response.data && response.data.response) {
          // Update local state
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
        }
      } catch (err) {
        console.error("Error updating blood group status:", err);
        showPopup(`Failed to update status: ${err.response?.data?.message || err.message}`, "error");
      } finally {
        setLoading(false);
      }
    }

    // Reset the confirm dialog
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
                <form className="d-inline-block searchform me-4" role="search">
                  <div className="input-group searchinput">
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search Blood Groups"
                      aria-label="Search"
                      value={searchQuery}
                      onChange={handleSearchChange}
                    />
                    <span className="input-group-text" id="search-icon">
                      <i className="fa fa-search"></i>
                    </span>
                  </div>
                </form>

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
                        className="btn btn-success me-2"
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
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : !showForm ? (
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
                  {filteredBloodGroups.length > 0 && (
                    <nav className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        <span>
                          Page {currentPage} of {filteredTotalPages} | Total Records: {totalFilteredProducts}
                        </span>
                      </div>
                      <ul className="pagination mb-0">
                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                            &laquo;
                          </button>
                        </li>
                        {[...Array(filteredTotalPages)].map((_, index) => (
                          <li
                            className={`page-item ${currentPage === index + 1 ? "active" : ""}`}
                            key={index}
                          >
                            <button className="page-link" onClick={() => setCurrentPage(index + 1)}>
                              {index + 1}
                            </button>
                          </li>
                        ))}
                        <li className={`page-item ${currentPage === filteredTotalPages ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => setCurrentPage((prev) => Math.min(prev + 1, filteredTotalPages))} disabled={currentPage === filteredTotalPages}>
                            &raquo;
                          </button>
                        </li>
                      </ul>
                    </nav>
                  )}
                </div>
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
                      maxLength = {BLOOD_CODE_MAX_LENGTH}

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
                      maxLength = {BLOOD_NAME_MAX_LENGTH}
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