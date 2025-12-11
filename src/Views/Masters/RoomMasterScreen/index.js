import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_ROOM, MAS_DEPARTMENT, MAS_ROOM_CATEGORY } from "../../../config/apiConfig";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";

const RoomMasterScreen = () => {
  const [roomData, setRoomData] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, id: null, newStatus: "" });
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({ 
    roomName: "", 
    deptId: "", 
    roomCategoryId: "", 
    noOfBeds: "" 
  });
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // dropdown options
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [roomCategoryOptions, setRoomCategoryOptions] = useState([]);

  const ROOM_NAME_MAX_LENGTH = 50;


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
      // Fetch departments
      const deptResponse = await getRequest(`${MAS_DEPARTMENT}/getAll/1`);
      if (deptResponse && deptResponse.response) {
        setDepartmentOptions(deptResponse.response.map(dept => ({
          id: dept.id,
          name: dept.departmentName
        })));
      }

      // Fetch room categories
      const categoryResponse = await getRequest(`${MAS_ROOM_CATEGORY}/getAll/1`);
      if (categoryResponse && categoryResponse.response) {
        setRoomCategoryOptions(categoryResponse.response.map(cat => ({
          id: cat.roomCategoryId,
          name: cat.roomCategoryName
        })));
      }
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
      showPopup("Failed to load dropdown data", "error");
    }
  };

  // Fetch room data
  const fetchRoomData = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_ROOM}/all/${flag}`);
      if (response && response.response) {
        const mappedData = response.response.map(item => ({
          id: item.roomId,
          roomName: item.roomName,
          department: item.wardName || "N/A",
          departmentId: item.departmentId,
          roomCategory: item.roomCategoryName || "N/A",
          roomCategoryId: item.roomCategoryId,
          beds: item.noOfBeds,
          status: item.status,
          lastUpdated: formatDate(item.lastUpdatedDate)
        }));
        setRoomData(mappedData);
      }
    } catch (err) {
      console.error("Error fetching room data:", err);
      showPopup("Failed to load room data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchRoomData(0);
    fetchDropdownData();
  }, []);

  // Search Filter
  const filteredRooms = roomData.filter(
    (room) =>
      room.roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.roomCategory.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredRooms.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);

  // Search
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Form Input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);

    // Validate form
    setIsFormValid(
      newFormData.roomName.trim() !== "" &&
      newFormData.deptId.trim() !== "" &&
      newFormData.roomCategoryId.trim() !== "" &&
      newFormData.noOfBeds.trim() !== ""
    );
  };

  // Save (Add / Update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);

      // Check for duplicates
      const isDuplicate = roomData.some(
        (room) =>
          room.roomName === formData.roomName &&
          (!editingRoom || editingRoom.id !== room.id)
      );

      if (isDuplicate) {
        showPopup("Room already exists!", "error");
        setLoading(false);
        return;
      }

      // Prepare request data
      const requestData = {
        roomName: formData.roomName,
        deptId: parseInt(formData.deptId),
        roomCategoryId: parseInt(formData.roomCategoryId),
        noOfBeds: parseInt(formData.noOfBeds)
      };

      if (editingRoom) {
        // Update room
        const response = await putRequest(`${MAS_ROOM}/update/${editingRoom.id}`, requestData);
        
        if (response && response.status === 200) {
          fetchRoomData();
          showPopup("Room updated successfully!", "success");
        }
      } else {
        // Add new room
        const response = await postRequest(`${MAS_ROOM}/create`, requestData);
        
        if (response && response.status === 200) {
          fetchRoomData();
          showPopup("New room added successfully!", "success");
        }
      }

      setEditingRoom(null);
      setFormData({ roomName: "", deptId: "", roomCategoryId: "", noOfBeds: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving room:", err);
      showPopup(`Failed to save changes: ${err.response?.data?.message || err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Edit
  const handleEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      roomName: room.roomName,
      deptId: room.departmentId?.toString() || "",
      roomCategoryId: room.roomCategoryId?.toString() || "",
      noOfBeds: room.beds?.toString() || ""
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  // Status Change
  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, id, newStatus });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed) {
      try {
        setLoading(true);
        const response = await putRequest(
          `${MAS_ROOM}/status/${confirmDialog.id}?status=${confirmDialog.newStatus}`
        );
        
        if (response && response.response) {
          // Update local state with formatted date
          setRoomData((prevData) =>
            prevData.map((room) =>
              room.id === confirmDialog.id
                ? { 
                    ...room, 
                    status: confirmDialog.newStatus,
                    lastUpdated: formatDate(new Date().toISOString())
                  }
                : room
            )
          );

          showPopup(
            `Room ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
            "success"
          );
        }
      } catch (err) {
        console.error("Error updating room status:", err);
        showPopup(`Failed to update status: ${err.response?.data?.message || err.message}`, "error");
      } finally {
        setLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "" });
  };

  // Popup
  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  // Page navigation handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageClick = (pageNum) => {
    setCurrentPage(pageNum);
  };

  // Render page numbers with ellipsis
  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page and ellipsis
    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) {
        pageNumbers.push("ellipsis-left");
      }
    }

    // Visible pages
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    // Last page and ellipsis
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
          onClick={() => handlePageClick(number)}
        >
          {number}
        </button>
      </li>
    );
  });
};

const handleRefresh = () => {
  setSearchQuery("");
  setCurrentPage(1);
  fetchRoomData();
  fetchDropdownData();
  // showPopup("Data refreshed!", "success");
};

return (
  <div className="content-wrapper">
    <div className="row">
      <div className="col-12 grid-margin stretch-card">
        <div className="card form-card">
          {/* HEADER */}
          <div className="card-header d-flex justify-content-between align-items-center">
            <h4 className="card-title">Room Master Screen</h4>
            
            <div className="d-flex justify-content-between align-items-center">
              {/* Search form */}
              <form className="d-inline-block searchform me-4" role="search">
                <div className="input-group searchinput">
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search room name, department, or category..."
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
                        setShowForm(true);
                        setEditingRoom(null);
                        setFormData({ roomName: "", deptId: "", roomCategoryId: "", noOfBeds: "" });
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
            {/* LOADING */}
            {loading ? (
              <LoadingScreen />
            ) : !showForm ? (
              <>
                {/* TABLE */}
                <div className="table-responsive packagelist">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Room Name</th>
                        <th>Department</th>
                        <th>Room Category</th>
                        <th>Beds</th>
                        <th>Status</th>
                        <th>Last Updated</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    
                    <tbody>
                      {currentItems.length > 0 ? (
                        currentItems.map((room) => (
                          <tr key={room.id}>
                            <td>{room.roomName}</td>
                            <td>{room.department}</td>
                            <td>{room.roomCategory}</td>
                            <td>{room.beds}</td>
                            
                            <td>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={room.status === "y"}
                                  onChange={() =>
                                    handleSwitchChange(room.id, room.status === "y" ? "n" : "y")
                                  }
                                  id={`switch-${room.id}`}
                                />
                                <label
                                  className="form-check-label px-0"
                                  htmlFor={`switch-${room.id}`}
                                >
                                  {room.status === "y" ? 'Active' : 'Inactive'}
                                </label>
                              </div>
                            </td>
                            
                            <td>{room.lastUpdated}</td>
                            
                            <td>
                              <button
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleEdit(room)}
                                disabled={room.status !== "y"}
                              >
                                <i className="fa fa-pencil"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center">
                            No room found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* PAGINATION */}
                {filteredRooms.length > 0 && (
                  <nav className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                      <span className="text-muted">
                        Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filteredRooms.length)} of {filteredRooms.length} entries
                      </span>
                    </div>
                    
                    <ul className="pagination mb-0">
                      <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                        <button
                          className="page-link"
                          onClick={handlePrevPage}
                          disabled={currentPage === 1}
                        >
                          &laquo; Previous
                        </button>
                      </li>
                      
                      {renderPageNumbers()}
                      
                      <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                        <button
                          className="page-link"
                          onClick={handleNextPage}
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
                        value={currentPage}
                        onChange={(e) => {
                          const page = parseInt(e.target.value);
                          if (!isNaN(page) && page >= 1 && page <= totalPages) {
                            setCurrentPage(page);
                          }
                        }}
                        className="form-control me-2"
                        style={{ width: "80px" }}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          // Already handled by onChange
                        }}
                      >
                        Go
                      </button>
                    </div>
                  </nav>
                )}
              </>
            ) : (
              // FORM
              <form className="forms row" onSubmit={handleSave}>
                <div className="form-group col-md-4">
                  <label>Room Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control mt-1"
                    name="roomName"
                    placeholder="Enter room name"
                    value={formData.roomName}
                    maxLength={ROOM_NAME_MAX_LENGTH}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group col-md-4">
                  <label>Department <span className="text-danger">*</span></label>
                  <select
                    className="form-select mt-1"
                    name="deptId"
                    value={formData.deptId}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Select Department</option>
                    {departmentOptions.map((department, index) => (
                      <option key={index} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group col-md-4">
                  <label>Room Category <span className="text-danger">*</span></label>
                  <select
                    className="form-select mt-1"
                    name="roomCategoryId"
                    value={formData.roomCategoryId}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Select Category</option>
                    {roomCategoryOptions.map((category, index) => (
                      <option key={index} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group col-md-4 mt-3">
                  <label>Beds <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    className="form-control mt-1"
                    name="noOfBeds"
                    placeholder="Enter number of beds"
                    value={formData.noOfBeds}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </div>
                
                <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                  <button 
                    type="submit" 
                    className="btn btn-primary me-2" 
                    disabled={!isFormValid || loading}
                  >
                    {loading ? "Saving..." : (editingRoom ? 'Update' : 'Save')}
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
            
            {/* POPUP */}
            {popupMessage && (
              <Popup
                message={popupMessage.message}
                type={popupMessage.type}
                onClose={popupMessage.onClose}
              />
            )}
            
            {/* CONFIRM DIALOG */}
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
                        <strong> {roomData.find(room => room.id === confirmDialog.id)?.roomName}</strong>?
                      </p>
                      {/* <p className="text-muted">
                        {confirmDialog.newStatus === "y" 
                          ? "This will make the room available for patient allocation." 
                          : "This will hide the room from patient allocation."}
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

export default RoomMasterScreen;