import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_BED, MAS_ROOM, MAS_BED_TYPE, MAS_BED_STATUS } from "../../../config/apiConfig";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";

const BedManagement = () => {
  const [bedData, setBedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    bedId: null, 
    newStatus: false 
  });
  
  const [formData, setFormData] = useState({
    bedNumber: "",
    roomId: "",
    bedTypeId: "",
    bedStatusId: "",
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingBed, setEditingBed] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [pageInput, setPageInput] = useState("1");

  // Dropdown options
  const [roomOptions, setRoomOptions] = useState([]);
  const [bedTypeOptions, setBedTypeOptions] = useState([]);
  const [bedStatusOptions, setBedStatusOptions] = useState([]);

  const BED_NO_MAX_LENGTH = 20;

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
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
      const year = date.getFullYear();
      
      return `${day}-${month}-${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  // Fetch dropdown data
  const fetchDropdownData = async () => {
    try {
      // Fetch rooms
      const roomResponse = await getRequest(`${MAS_ROOM}/all/1`);
      if (roomResponse && roomResponse.response) {
        setRoomOptions(roomResponse.response.map(room => ({
          id: room.roomId,
          name: room.roomName,
          departmentName: room.wardName || "N/A"
        })));
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
      showPopup("Failed to load dropdown data", "error");
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
      showPopup("Failed to load bed data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchBedData(0);
    fetchDropdownData();
  }, []);

  // Filter data based on search query
  const filteredBedData = bedData.filter(bed =>
    bed.bedNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    bed.room?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bed.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bed.bedType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bed.bedStatus?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination values
  const totalPages = Math.ceil(filteredBedData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBedData.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
    setPageInput("1");
  }, [searchQuery]);

  // Update page input when current page changes
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

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
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    try {
      setLoading(true);
      
      // Check for duplicates
      const isDuplicate = bedData.some(
        (bed) =>
          bed.bedNumber === formData.bedNumber &&
          (!editingBed || editingBed.id !== bed.id)
      );

      if (isDuplicate) {
        showPopup("Bed number already exists!", "error");
        setLoading(false);
        return;
      }

      // Prepare request data
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
          fetchBedData();
          showPopup("Bed updated successfully!", "success");
        }
      } else {
        // Add new bed
        const response = await postRequest(`${MAS_BED}/create`, requestData);
        
        if (response && response.status === 200) {
          fetchBedData();
          showPopup("New bed added successfully!", "success");
        }
      }
      
      setEditingBed(null);
      setFormData({ bedNumber: "", roomId: "", bedTypeId: "", bedStatusId: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving bed data:", err);
      showPopup(`Failed to save changes: ${err.response?.data?.message || err.message}`, "error");
    } finally {
      setLoading(false);
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
  
  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, bedId: id, newStatus });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.bedId !== null) {
      try {
        setLoading(true);
        
        const response = await putRequest(
          `${MAS_BED}/status/${confirmDialog.bedId}?status=${confirmDialog.newStatus}`
        );

        if (response && response.response) {
          // Update local state with formatted date
          setBedData((prevData) =>
            prevData.map((bed) =>
              bed.id === confirmDialog.bedId 
                ? { 
                    ...bed, 
                    status: confirmDialog.newStatus,
                    lastUpdated: formatDate(new Date().toISOString())
                  } 
                : bed
            )
          );
          showPopup(`Bed ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`, "success");
        }
      } catch (err) {
        console.error("Error updating bed status:", err);
        showPopup(`Failed to update status: ${err.response?.data?.message || err.message}`, "error");
      } finally {
        setLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, bedId: null, newStatus: null });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleSelectChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    setPageInput("1");
    fetchBedData(); // Refresh from API
    fetchDropdownData(); // Refresh dropdowns
  };

  const handlePageNavigation = () => {
    const pageNumber = parseInt(pageInput);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    } else {
      showPopup(`Please enter a valid page number between 1 and ${totalPages}`, "error");
      setPageInput(currentPage.toString());
    }
  };

  const handlePageInputChange = (e) => {
    setPageInput(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handlePageNavigation();
    }
  };

  const renderPagination = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) {
        pageNumbers.push("ellipsis-left");
      }
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    // Add last page and ellipsis if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push("ellipsis-right");
      }
      pageNumbers.push(totalPages);
    }

    return pageNumbers.map((number, index) => {
      if (number === "ellipsis-left" || number === "ellipsis-right") {
        return (
          <li key={index} className="page-item disabled">
            <span className="page-link">...</span>
          </li>
        );
      }
      
      return (
        <li key={index} className={`page-item ${number === currentPage ? "active" : ""}`}>
          <button 
            className="page-link" 
            onClick={() => {
              setCurrentPage(number);
              setPageInput(number.toString());
            }}
          >
            {number}
          </button>
        </li>
      );
    });
  };

  // Get badge class based on bed status
  const getBedStatusBadgeClass = (status) => {
    switch(status) {
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
              <div className="d-flex justify-content-between align-items-center">
                <form className="d-inline-block searchform me-4" role="search">
                  <div className="input-group searchinput">
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search bed no, room, department, bed type, or status..."
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
                          setEditingBed(null);
                          setFormData({ bedNumber: "", roomId: "", bedTypeId: "", bedStatusId: "" });
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
                          <th>Bed No</th>
                          <th>Room</th>
                          <th>Department</th>
                          <th>Bed Type</th>
                          <th>Bed Status</th>
                          <th>Status</th>
                          <th>Last Updated</th>
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
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={bed.status === "y"}
                                    onChange={() => handleSwitchChange(bed.id, bed.status === "y" ? "n" : "y")}
                                    id={`switch-${bed.id}`}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${bed.id}`}
                                  >
                                    {bed.status === "y" ? 'Active' : 'Inactive'}
                                  </label>
                                </div>
                              </td>
                              <td>{bed.lastUpdated}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(bed)}
                                  disabled={bed.status !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="text-center">No bed data found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {filteredBedData.length > 0 && (
                    <nav className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        <span className="text-muted">
                          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredBedData.length)} of {filteredBedData.length} entries
                        </span>
                      </div>
                      
                      <ul className="pagination mb-0">
                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                          <button
                            className="page-link"
                            onClick={() => {
                              if (currentPage > 1) {
                                setCurrentPage(currentPage - 1);
                              }
                            }}
                            disabled={currentPage === 1}
                          >
                            &laquo; Previous
                          </button>
                        </li>
                        
                        {renderPagination()}
                        
                        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                          <button
                            className="page-link"
                            onClick={() => {
                              if (currentPage < totalPages) {
                                setCurrentPage(currentPage + 1);
                              }
                            }}
                            disabled={currentPage === totalPages}
                          >
                            Next &raquo;
                          </button>
                        </li>
                      </ul>
                      
                      <div className="d-flex align-items-center">
                        <span className="me-2">Go to:</span>
                        <input
                          type="number"
                          min="1"
                          max={totalPages}
                          value={pageInput}
                          onChange={handlePageInputChange}
                          onKeyPress={handleKeyPress}
                          className="form-control me-2"
                          style={{ width: "80px" }}
                        />
                        <button
                          className="btn btn-primary"
                          onClick={handlePageNavigation}
                        >
                          Go
                        </button>
                      </div>
                    </nav>
                  )}
                </>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
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
                      disabled={loading}
                    />
                    {/* <small className="text-muted">
                      {formData.bedNumber.length}/{BED_NO_MAX_LENGTH} characters
                    </small> */}
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
                      disabled={loading || roomOptions.length === 0}
                    >
                      <option value="">Select Room</option>
                      {roomOptions.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name} ({room.departmentName})
                        </option>
                      ))}
                    </select>
                    {/* <small className="text-muted">Select room for this bed</small> */}
                  </div>
                  
                  <div className="form-group col-md-4">
                    <label>Bed Type <span className="text-danger">*</span></label>
                    <select
                      className="form-select mt-1"
                      id="bedTypeId"
                      name="bedTypeId"
                      value={formData.bedTypeId}
                      onChange={handleSelectChange}
                      required
                      disabled={loading || bedTypeOptions.length === 0}
                    >
                      <option value="">Select Bed Type</option>
                      {bedTypeOptions.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    {/* <small className="text-muted">Select type of bed</small> */}
                  </div>
                  
                  <div className="form-group col-md-4">
                    <label>Bed Status <span className="text-danger">*</span></label>
                    <select
                      className="form-select mt-1"
                      id="bedStatusId"
                      name="bedStatusId"
                      value={formData.bedStatusId}
                      onChange={handleSelectChange}
                      required
                      disabled={loading || bedStatusOptions.length === 0}
                    >
                      <option value="">Select Bed Status</option>
                      {bedStatusOptions.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.name}
                        </option>
                      ))}
                    </select>
                    {/* <small className="text-muted">Select current status of bed</small> */}
                  </div>
                  
                  <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                    <button 
                      type="submit" 
                      className="btn btn-primary me-2" 
                      disabled={!isFormValid || loading}
                    >
                      {loading ? "Saving..." : (editingBed ? 'Update' : 'Save')}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger" 
                      onClick={() => setShowForm(false)}
                      disabled={loading}
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
                <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button 
                          type="button" 
                          className="btn-close" 
                          onClick={() => handleConfirm(false)} 
                          aria-label="Close"
                          disabled={loading}
                        ></button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} 
                          <strong> {bedData.find(bed => bed.id === confirmDialog.bedId)?.bedNumber}</strong> bed?
                        </p>
                        {/* <p className="text-muted">
                          {confirmDialog.newStatus === "y" 
                            ? "This will make the bed available for patient allocation." 
                            : "This will hide the bed from patient allocation."}
                        </p> */}
                      </div>
                      <div className="modal-footer">
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          onClick={() => handleConfirm(false)}
                          disabled={loading}
                        >
                          Cancel
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-primary" 
                          onClick={() => handleConfirm(true)}
                          disabled={loading}
                        >
                          {loading ? "Processing..." : "Confirm"}
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