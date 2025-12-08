import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";

const RoomMasterScreen = () => {
  const [roomData, setRoomData] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, id: null, newStatus: "" });
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({ 
    roomName: "", 
    ward: "", 
    roomCategory: "", 
    beds: "" 
  });
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Ward options
  const wardOptions = [
    "General",
    "ICU",
    "Private",
    "Semi-Private",
    "Emergency",
    "Pediatric",
    "Maternity",
    "Orthopedic",
    "Cardiac",
    "Neurology",
    "Oncology",
    "Psychiatric"
  ];

  // Room Category options
  const roomCategoryOptions = [
    "Standard",
    "Deluxe",
    "Super Deluxe",
    "ICU Suite",
    "Emergency Room",
    "Operation Theater",
    "Recovery Room",
    "Isolation Room",
    "VIP Suite",
    "Pediatric Room",
    "Maternity Room"
  ];

  // Date Format
  const getFormattedDate = () => {
    const d = new Date();
    return (
      d.getDate().toString().padStart(2, "0") +
      "-" +
      (d.getMonth() + 1).toString().padStart(2, "0") +
      "-" +
      d.getFullYear() +
      " " +
      d.getHours().toString().padStart(2, "0") +
      ":" +
      d.getMinutes().toString().padStart(2, "0")
    );
  };

  // Dummy Data Load
  useEffect(() => {
    const dummy = [
      { id: 1, roomName: "Room 101", ward: "General", roomCategory: "Standard", beds: "3", status: "y", lastUpdated: "02-12-2025 10:00" },
      { id: 2, roomName: "Room 202", ward: "ICU", roomCategory: "ICU Suite", beds: "1", status: "y", lastUpdated: "02-12-2025 10:20" },
      { id: 3, roomName: "Room 303", ward: "Private", roomCategory: "Deluxe", beds: "2", status: "n", lastUpdated: "01-12-2025 18:00" },
      { id: 4, roomName: "Room 404", ward: "Pediatric", roomCategory: "Pediatric Room", beds: "4", status: "y", lastUpdated: "02-12-2025 11:30" },
    ];
    setRoomData(dummy);
  }, []);

  // Search Filter
  const filteredRooms = roomData.filter(
    (room) =>
      room.roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.ward.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
      newFormData.ward.trim() !== "" &&
      newFormData.roomCategory.trim() !== "" &&
      newFormData.beds.trim() !== ""
    );
  };

  // Save (Add / Update)
  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);

    // Duplicate check
    const duplicate = roomData.some(
      (room) =>
        room.roomName === formData.roomName &&
        (!editingRoom || editingRoom.id !== room.id)
    );

    if (duplicate) {
      showPopup("Room already exists!", "error");
      setLoading(false);
      return;
    }

    if (editingRoom) {
      // Update
      const updated = roomData.map((room) =>
        room.id === editingRoom.id
          ? { ...room, ...formData, lastUpdated: getFormattedDate() }
          : room
      );
      setRoomData(updated);
      showPopup("Room updated successfully!", "success");
    } else {
      // Add New
      const newRoom = {
        id: Date.now(),
        ...formData,
        status: "y",
        lastUpdated: getFormattedDate(),
      };
      setRoomData([...roomData, newRoom]);
      showPopup("New room added successfully!", "success");
    }

    setEditingRoom(null);
    setFormData({ roomName: "", ward: "", roomCategory: "", beds: "" });
    setShowForm(false);
    setLoading(false);
  };

  // Edit
  const handleEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      roomName: room.roomName,
      ward: room.ward,
      roomCategory: room.roomCategory,
      beds: room.beds,
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  // Status Change
  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, id, newStatus });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed) {
      const updated = roomData.map((room) =>
        room.id === confirmDialog.id
          ? { ...room, status: confirmDialog.newStatus, lastUpdated: getFormattedDate() }
          : room
      );
      setRoomData(updated);

      showPopup(
        `Room ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
        "success"
      );
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

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            {/* HEADER - Same design as Bed Management */}
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Room Master Screen</h4>
              
              <div className="d-flex justify-content-between align-items-center">
                {/* Search form - Same style as Bed Management */}
                <form className="d-inline-block searchform me-4" role="search">
                  <div className="input-group searchinput">
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search room name, ward, or category..."
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
                          setFormData({ roomName: "", ward: "", roomCategory: "", beds: "" });
                        }}
                      >
                        <i className="mdi mdi-plus"></i> Add 
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-success me-2 flex-shrink-0"
                        onClick={() => {
                          setSearchQuery("");
                          setCurrentPage(1);
                          showPopup("Data refreshed!", "success");
                        }}
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
                  {/* TABLE - Same table style */}
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Room Name</th>
                          <th>Ward</th>
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
                              <td>{room.ward}</td>
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
                  
                  {/* PAGINATION - Same pagination design as Bed Management */}
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
                // FORM - Same form layout as Bed Management
                <form className="forms row" onSubmit={handleSave}>
                  <div className="form-group col-md-4">
                    <label>Room Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      name="roomName"
                      placeholder="Enter room name"
                      value={formData.roomName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group col-md-4">
                    <label>Ward <span className="text-danger">*</span></label>
                    <select
                      className="form-select mt-1"
                      name="ward"
                      value={formData.ward}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Ward</option>
                      {wardOptions.map((ward, index) => (
                        <option key={index} value={ward}>
                          {ward}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group col-md-4">
                    <label>Room Category <span className="text-danger">*</span></label>
                    <select
                      className="form-select mt-1"
                      name="roomCategory"
                      value={formData.roomCategory}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Category</option>
                      {roomCategoryOptions.map((category, index) => (
                        <option key={index} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group col-md-4 mt-3">
                    <label>Beds <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      className="form-control mt-1"
                      name="beds"
                      placeholder="Enter number of beds"
                      value={formData.beds}
                      onChange={handleInputChange}
                      min="1"
                      required
                    />
                  </div>
                  
                  <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                    <button 
                      type="submit" 
                      className="btn btn-primary me-2" 
                      disabled={!isFormValid}
                    >
                      {editingRoom ? 'Update' : 'Save'}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger" 
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
              
              {/* POPUP - Same popup component */}
              {popupMessage && (
                <Popup
                  message={popupMessage.message}
                  type={popupMessage.type}
                  onClose={popupMessage.onClose}
                />
              )}
              
              {/* CONFIRM DIALOG - Same modal design as Bed Management */}
              {confirmDialog.isOpen && (
                <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button type="button" className="btn-close" onClick={() => handleConfirm(false)} aria-label="Close"></button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} 
                          <strong> {roomData.find(room => room.id === confirmDialog.id)?.roomName}</strong>?
                        </p>
                        <p className="text-muted">
                          {confirmDialog.newStatus === "y" 
                            ? "This will make the room available for patient allocation." 
                            : "This will hide the room from patient allocation."}
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>Cancel</button>
                        <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>Confirm</button>
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