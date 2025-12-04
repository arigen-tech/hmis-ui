import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";

const BedManagement = () => {
  // Sample mock data
  const initialBedData = [
    {
      id: 1,
      bedNo: "B-101",
      room: "Room 101",
      ward: "Ward A",
      bedType: "Normal",
      bedStatus: "Available",
      status: "y",
      lastUpdated: "2024-01-15 10:30:00"
    },
    {
      id: 2,
      bedNo: "B-102",
      room: "Room 101",
      ward: "Ward A",
      bedType: "ICU",
      bedStatus: "Occupied",
      status: "y",
      lastUpdated: "2024-01-10 14:20:00"
    },
    {
      id: 3,
      bedNo: "B-201",
      room: "Room 201",
      ward: "ICU - 1",
      bedType: "ICU",
      bedStatus: "Under Maintenance",
      status: "y",
      lastUpdated: "2024-01-05 09:15:00"
    },
    {
      id: 4,
      bedNo: "B-202",
      room: "Room 202",
      ward: "Cardiac Unit - 1",
      bedType: "CCU",
      bedStatus: "Available",
      status: "y",
      lastUpdated: "2024-01-20 16:45:00"
    },
    {
      id: 5,
      bedNo: "B-301",
      room: "Room 301",
      ward: "Children's Ward",
      bedType: "Pediatric",
      bedStatus: "Occupied",
      status: "y",
      lastUpdated: "2024-01-18 11:10:00"
    },
    {
      id: 6,
      bedNo: "B-302",
      room: "Room 302",
      ward: "Maternity - 1",
      bedType: "Maternity",
      bedStatus: "Available",
      status: "n",
      lastUpdated: "2024-01-12 13:25:00"
    },
    {
      id: 7,
      bedNo: "B-401",
      room: "Room 401",
      ward: "Ortho Ward - 1",
      bedType: "Orthopedic",
      bedStatus: "Occupied",
      status: "y",
      lastUpdated: "2024-01-08 15:40:00"
    },
    {
      id: 8,
      bedNo: "B-501",
      room: "Room 501",
      ward: "Neuro ICU",
      bedType: "Neuro ICU",
      bedStatus: "Available",
      status: "y",
      lastUpdated: "2024-01-22 08:55:00"
    },
    {
      id: 9,
      bedNo: "B-601",
      room: "Room 601",
      ward: "Oncology - 1",
      bedType: "Oncology",
      bedStatus: "Under Maintenance",
      status: "y",
      lastUpdated: "2024-01-16 12:30:00"
    },
    {
      id: 10,
      bedNo: "B-701",
      room: "Room 701",
      ward: "Psych Ward",
      bedType: "Psychiatric",
      bedStatus: "Available",
      status: "n",
      lastUpdated: "2024-01-14 10:05:00"
    }
  ];

  // Sample ward data (could come from API or props)
  const wardOptions = [
    { value: "", label: "Select Ward" },
    { value: "Ward A", label: "Ward A" },
    { value: "Ward B - Private", label: "Ward B - Private" },
    { value: "ICU - 1", label: "ICU - 1" },
    { value: "Cardiac Unit - 1", label: "Cardiac Unit - 1" },
    { value: "Children's Ward", label: "Children's Ward" },
    { value: "Maternity - 1", label: "Maternity - 1" },
    { value: "Ortho Ward - 1", label: "Ortho Ward - 1" },
    { value: "Neuro ICU", label: "Neuro ICU" },
    { value: "Oncology - 1", label: "Oncology - 1" },
    { value: "Psych Ward", label: "Psych Ward" }
  ];

  const roomOptions = [
    { value: "", label: "Select Room" },
    { value: "Room 101", label: "Room 101" },
    { value: "Room 102", label: "Room 102" },
    { value: "Room 201", label: "Room 201" },
    { value: "Room 202", label: "Room 202" },
    { value: "Room 301", label: "Room 301" },
    { value: "Room 302", label: "Room 302" },
    { value: "Room 401", label: "Room 401" },
    { value: "Room 501", label: "Room 501" },
    { value: "Room 601", label: "Room 601" },
    { value: "Room 701", label: "Room 701" }
  ];

  const bedTypeOptions = [
    { value: "", label: "Select Bed Type" },
    { value: "Normal", label: "Normal" },
    { value: "ICU", label: "ICU" },
    { value: "CCU", label: "CCU" },
    { value: "Pediatric", label: "Pediatric" },
    { value: "Maternity", label: "Maternity" },
    { value: "Orthopedic", label: "Orthopedic" },
    { value: "Neuro ICU", label: "Neuro ICU" },
    { value: "Oncology", label: "Oncology" },
    { value: "Psychiatric", label: "Psychiatric" },
    { value: "VIP", label: "VIP" },
    { value: "Isolation", label: "Isolation" }
  ];

  const bedStatusOptions = [
    { value: "", label: "Select Bed Status" },
    { value: "Available", label: "Available" },
    { value: "Occupied", label: "Occupied" },
    { value: "Under Maintenance", label: "Under Maintenance" },
    { value: "Reserved", label: "Reserved" },
    { value: "Cleaning", label: "Cleaning" }
  ];

  const [bedData, setBedData] = useState(initialBedData);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    bedId: null, 
    newStatus: false 
  });
  
  const [formData, setFormData] = useState({
    bedNo: "",
    room: "",
    ward: "",
    bedType: "",
    bedStatus: "",
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingBed, setEditingBed] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [pageInput, setPageInput] = useState("1");

  const BED_NO_MAX_LENGTH = 20;

  // Filter data based on search query
  const filteredBedData = bedData.filter(bed =>
    bed.bedNo.toLowerCase().includes(searchQuery.toLowerCase()) || 
    bed.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bed.ward.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bed.bedType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bed.bedStatus.toLowerCase().includes(searchQuery.toLowerCase())
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
      const { bedNo, room, ward, bedType, bedStatus } = formData;
      return (
        bedNo.trim() !== "" &&
        room.trim() !== "" &&
        ward.trim() !== "" &&
        bedType.trim() !== "" &&
        bedStatus.trim() !== ""
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
      bedNo: bed.bedNo,
      room: bed.room,
      ward: bed.ward,
      bedType: bed.bedType,
      bedStatus: bed.bedStatus,
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    try {
      setLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (editingBed) {
        // Update existing bed
        const updatedData = bedData.map(item =>
          item.id === editingBed.id 
            ? { 
                ...item, 
                bedNo: formData.bedNo,
                room: formData.room,
                ward: formData.ward,
                bedType: formData.bedType,
                bedStatus: formData.bedStatus,
                lastUpdated: new Date().toLocaleString('en-IN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                }).replace(',', '')
              }
            : item
        );
        
        setBedData(updatedData);
        showPopup("Bed updated successfully!", "success");
      } else {
        // Add new bed
        const newBed = {
          id: bedData.length + 1,
          bedNo: formData.bedNo,
          room: formData.room,
          ward: formData.ward,
          bedType: formData.bedType,
          bedStatus: formData.bedStatus,
          status: "y",
          lastUpdated: new Date().toLocaleString('en-IN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }).replace(',', '')
        };
        
        setBedData([...bedData, newBed]);
        showPopup("New bed added successfully!", "success");
      }
      
      setEditingBed(null);
      setFormData({ bedNo: "", room: "", ward: "", bedType: "", bedStatus: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving bed data:", err);
      showPopup(`Failed to save changes: ${err.message}`, "error");
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
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const updatedData = bedData.map((bed) =>
          bed.id === confirmDialog.bedId 
            ? { 
                ...bed, 
                status: confirmDialog.newStatus,
                lastUpdated: new Date().toLocaleString('en-IN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                }).replace(',', '')
              } 
            : bed
        );
        
        setBedData(updatedData);
        showPopup(`Bed ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`, "success");
      } catch (err) {
        console.error("Error updating bed status:", err);
        showPopup(`Failed to update status: ${err.message}`, "error");
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
    showPopup("Data refreshed!", "success");
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
                      placeholder="Search bed no, room, ward, bed type, or status..."
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
                          setFormData({ bedNo: "", room: "", ward: "", bedType: "", bedStatus: "" });
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
                          <th>Ward</th>
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
                              <td>{bed.bedNo}</td>
                              <td>{bed.room}</td>
                              <td>{bed.ward}</td>
                              <td>{bed.bedType}</td>
                              <td>
                                <span className={`badge ${
                                  bed.bedStatus === 'Available' ? 'bg-success' :
                                  bed.bedStatus === 'Occupied' ? 'bg-danger' :
                                  bed.bedStatus === 'Under Maintenance' ? 'bg-warning' :
                                  bed.bedStatus === 'Reserved' ? 'bg-info' :
                                  'bg-secondary'
                                }`}>
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
                      id="bedNo"
                      name="bedNo"
                      placeholder="Enter bed number (e.g., B-101)"
                      value={formData.bedNo}
                      onChange={handleInputChange}
                      maxLength={BED_NO_MAX_LENGTH}
                      required
                    />
                    <small className="text-muted">
                      {formData.bedNo.length}/{BED_NO_MAX_LENGTH} characters
                    </small>
                  </div>
                  
                  <div className="form-group col-md-4">
                    <label>Room <span className="text-danger">*</span></label>
                    <select
                      className="form-select mt-1"
                      id="room"
                      name="room"
                      value={formData.room}
                      onChange={handleSelectChange}
                      required
                    >
                      {roomOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <small className="text-muted">Select room for this bed</small>
                  </div>
                  
                  <div className="form-group col-md-4">
                    <label>Ward <span className="text-danger">*</span></label>
                    <select
                      className="form-select mt-1"
                      id="ward"
                      name="ward"
                      value={formData.ward}
                      onChange={handleSelectChange}
                      required
                    >
                      {wardOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <small className="text-muted">Select ward for this bed</small>
                  </div>
                  
                  <div className="form-group col-md-4">
                    <label>Bed Type <span className="text-danger">*</span></label>
                    <select
                      className="form-select mt-1"
                      id="bedType"
                      name="bedType"
                      value={formData.bedType}
                      onChange={handleSelectChange}
                      required
                    >
                      {bedTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <small className="text-muted">Select type of bed</small>
                  </div>
                  
                  <div className="form-group col-md-4">
                    <label>Bed Status <span className="text-danger">*</span></label>
                    <select
                      className="form-select mt-1"
                      id="bedStatus"
                      name="bedStatus"
                      value={formData.bedStatus}
                      onChange={handleSelectChange}
                      required
                    >
                      {bedStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <small className="text-muted">Select current status of bed</small>
                  </div>
                  
                  <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                    <button 
                      type="submit" 
                      className="btn btn-primary me-2" 
                      disabled={!isFormValid}
                    >
                      {editingBed ? 'Update' : 'Save'}
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
                        <button type="button" className="btn-close" onClick={() => handleConfirm(false)} aria-label="Close"></button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} 
                          <strong> {bedData.find(bed => bed.id === confirmDialog.bedId)?.bedNo}</strong> bed?
                        </p>
                        <p className="text-muted">
                          {confirmDialog.newStatus === "y" 
                            ? "This will make the bed available for patient allocation." 
                            : "This will hide the bed from patient allocation."}
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

export default BedManagement;