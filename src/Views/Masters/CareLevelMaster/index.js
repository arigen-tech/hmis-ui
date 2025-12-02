import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";

const CareLevelMaster = () => {
  // Sample mock data
  const initialCareLevelData = [
    {
      id: 1,
      careLevelName: "Level 1 - Basic Care",
      description: "Basic assistance with daily activities",
      status: "y",
      lastUpdated: "2024-01-15 10:30:00"
    },
    {
      id: 2,
      careLevelName: "Level 2 - Intermediate Care",
      description: "Moderate assistance with medical supervision",
      status: "y",
      lastUpdated: "2024-01-10 14:20:00"
    },
    {
      id: 3,
      careLevelName: "Level 3 - Advanced Care",
      description: "Complex medical care with 24/7 monitoring",
      status: "n",
      lastUpdated: "2024-01-05 09:15:00"
    },
    {
      id: 4,
      careLevelName: "Palliative Care",
      description: "End-of-life care and comfort measures",
      status: "y",
      lastUpdated: "2024-01-20 16:45:00"
    },
    {
      id: 5,
      careLevelName: "Respite Care",
      description: "Temporary care for primary caregivers",
      status: "y",
      lastUpdated: "2024-01-18 11:10:00"
    },
    {
      id: 6,
      careLevelName: "Rehabilitation Care",
      description: "Therapy and recovery-focused care",
      status: "y",
      lastUpdated: "2024-01-12 13:25:00"
    },
    {
      id: 7,
      careLevelName: "Memory Care",
      description: "Specialized care for dementia patients",
      status: "n",
      lastUpdated: "2024-01-08 15:40:00"
    },
    {
      id: 8,
      careLevelName: "Post-Operative Care",
      description: "Care after surgical procedures",
      status: "y",
      lastUpdated: "2024-01-22 08:55:00"
    },
    {
      id: 9,
      careLevelName: "Chronic Disease Management",
      description: "Long-term management of chronic conditions",
      status: "y",
      lastUpdated: "2024-01-16 12:30:00"
    },
    {
      id: 10,
      careLevelName: "Pediatric Care",
      description: "Specialized care for children",
      status: "y",
      lastUpdated: "2024-01-14 10:05:00"
    },
    {
      id: 11,
      careLevelName: "Geriatric Care",
      description: "Elderly-specific care services",
      status: "y",
      lastUpdated: "2024-01-19 14:50:00"
    },
    {
      id: 12,
      careLevelName: "Home Health Care",
      description: "Medical care provided at patient's home",
      status: "y",
      lastUpdated: "2024-01-21 09:25:00"
    }
  ];

  const [careLevelData, setCareLevelData] = useState(initialCareLevelData);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    careLevelId: null, 
    newStatus: false 
  });
  
  const [formData, setFormData] = useState({
    careLevelName: "",
    description: "",
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingCareLevel, setEditingCareLevel] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [pageInput, setPageInput] = useState("1");

  const CARE_LEVEL_NAME_MAX_LENGTH = 100;
  const DESCRIPTION_MAX_LENGTH = 500;

  // Filter data based on search query
  const filteredCareLevelData = careLevelData.filter(careLevel =>
    careLevel.careLevelName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    careLevel.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination values
  const totalPages = Math.ceil(filteredCareLevelData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCareLevelData.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
    setPageInput("1");
  }, [searchQuery]);

  // Update page input when current page changes
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleEdit = (careLevel) => {
    setEditingCareLevel(careLevel);
    setFormData({
      careLevelName: careLevel.careLevelName,
      description: careLevel.description
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    try {
      setLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (editingCareLevel) {
        // Update existing care level
        const updatedData = careLevelData.map(item =>
          item.id === editingCareLevel.id 
            ? { 
                ...item, 
                careLevelName: formData.careLevelName,
                description: formData.description,
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
        
        setCareLevelData(updatedData);
        showPopup("Care level updated successfully!", "success");
      } else {
        // Add new care level
        const newCareLevel = {
          id: careLevelData.length + 1,
          careLevelName: formData.careLevelName,
          description: formData.description,
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
        
        setCareLevelData([...careLevelData, newCareLevel]);
        showPopup("New care level added successfully!", "success");
      }
      
      setEditingCareLevel(null);
      setFormData({ careLevelName: "", description: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving care level data:", err);
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
    setConfirmDialog({ isOpen: true, careLevelId: id, newStatus });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.careLevelId !== null) {
      try {
        setLoading(true);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const updatedData = careLevelData.map((careLevel) =>
          careLevel.id === confirmDialog.careLevelId 
            ? { 
                ...careLevel, 
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
            : careLevel
        );
        
        setCareLevelData(updatedData);
        showPopup(`Care level ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`, "success");
      } catch (err) {
        console.error("Error updating care level status:", err);
        showPopup(`Failed to update status: ${err.message}`, "error");
      } finally {
        setLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, careLevelId: null, newStatus: null });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
    
    // Validate form
    if (id === "careLevelName") {
      setIsFormValid(value.trim() !== "" && formData.description.trim() !== "");
    } else if (id === "description") {
      setIsFormValid(value.trim() !== "" && formData.careLevelName.trim() !== "");
    }
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
              <h4 className="card-title">Care Level Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                <form className="d-inline-block searchform me-4" role="search">
                  <div className="input-group searchinput">
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search care level..."
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
                          setEditingCareLevel(null);
                          setFormData({ careLevelName: "", description: "" });
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
                          <th>Care Level Name</th>
                          <th>Description</th>
                          <th>Status</th>
                          <th>Last Updated</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((careLevel) => (
                            <tr key={careLevel.id}>
                              <td>{careLevel.careLevelName}</td>
                              <td className="text-truncate" style={{ maxWidth: "300px" }} title={careLevel.description}>
                                {careLevel.description}
                              </td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={careLevel.status === "y"}
                                    onChange={() => handleSwitchChange(careLevel.id, careLevel.status === "y" ? "n" : "y")}
                                    id={`switch-${careLevel.id}`}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${careLevel.id}`}
                                  >
                                    {careLevel.status === "y" ? 'Active' : 'Inactive'}
                                  </label>
                                </div>
                              </td>
                              <td>{careLevel.lastUpdated}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(careLevel)}
                                  disabled={careLevel.status !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center">No care level data found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {filteredCareLevelData.length > 0 && (
                    <nav className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        <span className="text-muted">
                          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCareLevelData.length)} of {filteredCareLevelData.length} entries
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
                  <div className="form-group col-md-6">
                    <label>Care Level Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="careLevelName"
                      name="careLevelName"
                      placeholder="Enter care level name"
                      value={formData.careLevelName}
                      onChange={handleInputChange}
                      maxLength={CARE_LEVEL_NAME_MAX_LENGTH}
                      required
                    />
                    <small className="text-muted">
                      {formData.careLevelName.length}/{CARE_LEVEL_NAME_MAX_LENGTH} characters
                    </small>
                  </div>
                  <div className="form-group col-md-6">
                    <label>Description <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control mt-1"
                      id="description"
                      name="description"
                      placeholder="Enter description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      maxLength={DESCRIPTION_MAX_LENGTH}
                      required
                    />
                    <small className="text-muted">
                      {formData.description.length}/{DESCRIPTION_MAX_LENGTH} characters
                    </small>
                  </div>
                  <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                    <button 
                      type="submit" 
                      className="btn btn-primary me-2" 
                      disabled={!isFormValid}
                    >
                      {editingCareLevel ? 'Update' : 'Save'}
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
                          <strong> {careLevelData.find(careLevel => careLevel.id === confirmDialog.careLevelId)?.careLevelName}</strong>?
                        </p>
                        <p className="text-muted">
                          {confirmDialog.newStatus === "y" 
                            ? "This will make the care level available for selection." 
                            : "This will hide the care level from selection."}
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

export default CareLevelMaster;