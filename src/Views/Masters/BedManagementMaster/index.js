import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_BED, MAS_ROOM, MAS_BED_TYPE, MAS_BED_STATUS, MAS_DEPARTMENT } from "../../../config/apiConfig";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import { ADD_BED_SUCC_MSG, DUPLICATE_BED_DATA, FAIL_TO_SAVE_CHANGES, FAIL_TO_UPDATE_STS, FETCH_BED_DATA_ERR_MSG, FETCH_DROP_DOWN_ERR_MSG, UPDATE_BED_SUCC_MSG } from "../../../config/constants";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";  

const BedManagement = () => {
  const [bedData, setBedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    bedId: null,
    newStatus: "",
    name: ""
  });

  const [formData, setFormData] = useState({
    bedNumber: "",
    roomId: "",
    bedTypeId: "",
    bedStatusId: "",
  });
  
  // New state for ward filter (not saved to DB)
  const [selectedWardId, setSelectedWardId] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingBed, setEditingBed] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Dropdown options
  const [wardOptions, setWardOptions] = useState([]); // For filtering only
  const [roomOptions, setRoomOptions] = useState([]);
  const [filteredRoomOptions, setFilteredRoomOptions] = useState([]); // Rooms filtered by selected ward
  const [bedTypeOptions, setBedTypeOptions] = useState([]);
  const [bedStatusOptions, setBedStatusOptions] = useState([]);

  const BED_NO_MAX_LENGTH = 20;

  // Function to format date as dd/MM/YYYY
  const normalizeStatus = (status) =>
    typeof status === "string" ? status.trim().toLowerCase() : status;

  const isStatusActive = (status) => normalizeStatus(status) === "y";

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

  // Fetch dropdown data
  const fetchDropdownData = async () => {
    try {
      // Fetch wards (departments) for filtering only
      const wardResponse = await getRequest(`${MAS_DEPARTMENT}/getAll/1`);
      if (wardResponse && wardResponse.response) {
        const filteredWards = wardResponse.response
          .filter(dept => dept.departmentTypeId === 10)
          .map(ward => ({
            id: ward.id,
            name: ward.departmentName
          }));
        setWardOptions(filteredWards);
      }

      // Fetch all rooms
      const roomResponse = await getRequest(`${MAS_ROOM}/all/1`);
      if (roomResponse && roomResponse.response) {
        const allRooms = roomResponse.response.map(room => ({
          id: room.roomId,
          name: room.roomName,
          departmentId: room.departmentId,
          departmentName: room.wardName || "N/A"
        }));
        setRoomOptions(allRooms);
        setFilteredRoomOptions(allRooms);
      }

      // Fetch bed types
      const bedTypeResponse = await getRequest(`${MAS_BED_TYPE}/getAll/1`);
      if (bedTypeResponse && bedTypeResponse.response) {
        setBedTypeOptions(bedTypeResponse.response.map(type => ({
          id: type.bedTypeId,
          name: type.bedTypeName
        })));
      }

      // Fetch bed statuses
      const bedStatusResponse = await getRequest(`${MAS_BED_STATUS}/getAll/1`);
      if (bedStatusResponse && bedStatusResponse.response) {
        setBedStatusOptions(bedStatusResponse.response.map(status => ({
          id: status.bedStatusId,
          name: status.bedStatusName
        })));
      }
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
      showPopup(FETCH_DROP_DOWN_ERR_MSG, "error");
    }
  };

  // Fetch bed data
  const fetchBedData = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_BED}/getAll/${flag}`);
      if (response && response.response) {
        const mappedData = response.response.map(item => ({
          id: item.bedId,
          bedNumber: item.bedNumber,
          room: item.roomName || "N/A",
          roomId: item.roomId,
          department: item.departmentName || "N/A",
          departmentId: item.departmentId,
          bedType: item.bedTypeName || "N/A",
          bedTypeId: item.bedTypeId,
          bedStatus: item.bedStatusName || "N/A",
          bedStatusId: item.bedStatusId,
          status: item.status,
          lastUpdated: formatDate(item.lastUpdateDate)
        }));
        setBedData(mappedData);
      }
    } catch (err) {
      console.error("Error fetching bed data:", err);
      showPopup(FETCH_BED_DATA_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchBedData(0);
    fetchDropdownData();
  }, []);

  // Filter room options when ward is selected
  useEffect(() => {
    if (selectedWardId) {
      const filteredRooms = roomOptions.filter(room => 
        room.departmentId === parseInt(selectedWardId)
      );
      setFilteredRoomOptions(filteredRooms);
      
      if (formData.roomId) {
        const selectedRoom = roomOptions.find(room => 
          room.id === parseInt(formData.roomId) && room.departmentId === parseInt(selectedWardId)
        );
        if (!selectedRoom) {
          setFormData(prev => ({ ...prev, roomId: "" }));
        }
      }
    } else {
      setFilteredRoomOptions(roomOptions);
    }
  }, [selectedWardId, roomOptions]);

  // Validate form whenever formData changes
  useEffect(() => {
    const validateForm = () => {
      const { bedNumber, roomId, bedTypeId, bedStatusId } = formData;
      return (
        bedNumber.trim() !== "" &&
        roomId.trim() !== "" &&
        bedTypeId.trim() !== "" &&
        bedStatusId.trim() !== ""
      );
    };
    setIsFormValid(validateForm());
  }, [formData]);

  // Filter data based on search query
  const filteredBedData = bedData
    .filter(bed =>
      bed.bedNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bed.room?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bed.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bed.bedType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bed.bedStatus?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (normalizeStatus(a.status) === normalizeStatus(b.status)) return 0;
      return isStatusActive(a.status) ? -1 : 1;
    });

  // Calculate pagination values
  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredBedData.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const resetForm = () => {
    setFormData({ bedNumber: "", roomId: "", bedTypeId: "", bedStatusId: "" });
    setIsFormValid(false);
    setEditingBed(null);
    setSelectedWardId("");
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleEdit = (bed) => {
    setEditingBed(bed);
    setFormData({
      bedNumber: bed.bedNumber || "",
      roomId: bed.roomId?.toString() || "",
      bedTypeId: bed.bedTypeId?.toString() || "",
      bedStatusId: bed.bedStatusId?.toString() || "",
    });
    
    if (bed.departmentId) {
      setSelectedWardId(bed.departmentId.toString());
    } else {
      setSelectedWardId("");
    }
    
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
      const isDuplicate = bedData.some(
        (bed) =>
          bed.bedNumber === formData.bedNumber &&
          (!editingBed || editingBed.id !== bed.id)
      );

      if (isDuplicate) {
        showPopup(DUPLICATE_BED_DATA, "error");
        return;
      }

      const requestData = {
        bedNumber: formData.bedNumber,
        roomId: parseInt(formData.roomId),
        bedTypeId: parseInt(formData.bedTypeId),
        bedStatusId: parseInt(formData.bedStatusId)
      };

      if (editingBed) {
        // Update existing bed
        const response = await putRequest(`${MAS_BED}/update/${editingBed.id}`, requestData);

        if (response && response.status === 200) {
          setPopupMessage({
            message: UPDATE_BED_SUCC_MSG,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              fetchBedData();
              setShowForm(false);
            }
          });
        } else {
          throw new Error(response.message || "Update failed");
        }
      } else {
        // Add new bed
        const response = await postRequest(`${MAS_BED}/create`, requestData);

        if (response.status === 201 || response.status === 200) {
          setPopupMessage({
            message: ADD_BED_SUCC_MSG,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              fetchBedData();
              setShowForm(false);
            }
          });
        } else {
          throw new Error(response.message || "Save failed");
        }
      }
    } catch (err) {
      console.error("Error saving bed data:", err);
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
    setConfirmDialog({ isOpen: true, bedId: id, newStatus, name });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.bedId !== null) {
      setSaving(true);

      try {
        const response = await putRequest(
          `${MAS_BED}/status/${confirmDialog.bedId}?status=${confirmDialog.newStatus}`
        );

        if (response && response.status === 200) {
          setPopupMessage({
            message: `Bed "${confirmDialog.name}" ${
              isStatusActive(confirmDialog.newStatus) ? "activated" : "deactivated"
            } successfully!`,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              fetchBedData();
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
      bedId: null,
      newStatus: "",
      name: "",
    });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleSelectChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleWardChange = (e) => {
    setSelectedWardId(e.target.value);
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    setSelectedWardId("");
    fetchBedData();
    fetchDropdownData();
  };

  // Get badge class based on bed status
  const getBedStatusBadgeClass = (status) => {
    switch (status) {
      case 'Available': return 'bg-success';
      case 'Occupied': return 'bg-danger';
      case 'Under Maintenance': return 'bg-warning';
      case 'Cleaning': return 'bg-warning';
      case 'Reserved': return 'bg-info';
      default: return 'bg-secondary';
    }
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Bed Management</h4>
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
                          <th>Bed No</th>
                          <th>Room</th>
                          <th>Ward</th>
                          <th>Bed Type</th>
                          <th>Bed Status</th>
                          <th>Last Updated</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((bed) => (
                            <tr key={bed.id}>
                              <td>{bed.bedNumber || "N/A"}</td>
                              <td>{bed.room}</td>
                              <td>{bed.department}</td>
                              <td>{bed.bedType}</td>
                              <td>
                                <span className={`badge ${getBedStatusBadgeClass(bed.bedStatus)}`}>
                                  {bed.bedStatus}
                                </span>
                              </td>
                              <td>{bed.lastUpdated}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={isStatusActive(bed.status)}
                                    onChange={() => handleSwitchChange(bed.id, bed.status, bed.bedNumber)}
                                    id={`switch-${bed.id}`}
                                  />
                                  <label
                                    className="form-check-label ms-2"
                                    htmlFor={`switch-${bed.id}`}
                                  >
                                    {isStatusActive(bed.status) ? 'Active' : 'Inactive'}
                                  </label>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleEdit(bed)}
                                  disabled={!isStatusActive(bed.status)}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="text-center">No Records Found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    totalItems={filteredBedData.length}
                    itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                  />
                </>
              )}

              {showForm && (
                <form className="row" onSubmit={handleSave}>
                  <div className="form-group col-md-4">
                    <label>Bed No <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="bedNumber"
                      name="bedNumber"
                      placeholder="Enter bed number (e.g., B-101)"
                      value={formData.bedNumber}
                      onChange={handleInputChange}
                      maxLength={BED_NO_MAX_LENGTH}
                      required
                    />
                  </div>
                  
                  {/* Ward Name Dropdown - For filtering only */}
                  <div className="form-group col-md-4">
                    <label>Ward Name</label>
                    <select
                      className="form-select mt-1"
                      id="wardFilter"
                      name="wardFilter"
                      value={selectedWardId}
                      onChange={handleWardChange}
                      disabled={wardOptions.length === 0}
                    >
                      <option value="">All Wards</option>
                      {wardOptions.map((ward) => (
                        <option key={ward.id} value={ward.id}>
                          {ward.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group col-md-4">
                    <label>Room <span className="text-danger">*</span></label>
                    <select
                      className="form-select mt-1"
                      id="roomId"
                      name="roomId"
                      value={formData.roomId}
                      onChange={handleSelectChange}
                      required
                      disabled={filteredRoomOptions.length === 0}
                    >
                      <option value="">Select Room</option>
                      {filteredRoomOptions.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name} ({room.departmentName})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group col-md-4 mt-3">
                    <label>Bed Type <span className="text-danger">*</span></label>
                    <select
                      className="form-select mt-1"
                      id="bedTypeId"
                      name="bedTypeId"
                      value={formData.bedTypeId}
                      onChange={handleSelectChange}
                      required
                      disabled={bedTypeOptions.length === 0}
                    >
                      <option value="">Select Bed Type</option>
                      {bedTypeOptions.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group col-md-4 mt-3">
                    <label>Bed Status <span className="text-danger">*</span></label>
                    <select
                      className="form-select mt-1"
                      id="bedStatusId"
                      name="bedStatusId"
                      value={formData.bedStatusId}
                      onChange={handleSelectChange}
                      required
                      disabled={bedStatusOptions.length === 0}
                    >
                      <option value="">Select Bed Status</option>
                      {bedStatusOptions.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group col-md-12 mt-3 d-flex justify-content-end">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid || saving}
                    >
                      {saving ? "Saving..." : editingBed ? 'Update' : 'Save'}
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

export default BedManagement;