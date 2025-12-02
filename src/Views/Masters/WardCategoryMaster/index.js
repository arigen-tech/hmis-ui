import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";

const WardCategoryMaster = () => {
  // Sample mock data
  const initialWardCategoryData = [
    {
      id: 1,
      categoryName: "General Ward",
      description: "Standard ward with basic facilities",
      status: "y",
      lastUpdated: "2024-01-15 10:30:00"
    },
    {
      id: 2,
      categoryName: "Private Ward",
      description: "Private room with attached bathroom",
      status: "y",
      lastUpdated: "2024-01-10 14:20:00"
    },
    {
      id: 3,
      categoryName: "ICU - Intensive Care Unit",
      description: "Critical care unit with life support systems",
      status: "y",
      lastUpdated: "2024-01-05 09:15:00"
    },
    {
      id: 4,
      categoryName: "CCU - Cardiac Care Unit",
      description: "Specialized care for cardiac patients",
      status: "y",
      lastUpdated: "2024-01-20 16:45:00"
    },
    {
      id: 5,
      categoryName: "Pediatric Ward",
      description: "Special ward for children",
      status: "y",
      lastUpdated: "2024-01-18 11:10:00"
    },
    {
      id: 6,
      categoryName: "Maternity Ward",
      description: "For expectant and new mothers",
      status: "n",
      lastUpdated: "2024-01-12 13:25:00"
    },
    {
      id: 7,
      categoryName: "Orthopedic Ward",
      description: "Special care for bone and joint patients",
      status: "y",
      lastUpdated: "2024-01-08 15:40:00"
    },
    {
      id: 8,
      categoryName: "Neuro Ward",
      description: "Neurological care unit",
      status: "y",
      lastUpdated: "2024-01-22 08:55:00"
    },
    {
      id: 9,
      categoryName: "Oncology Ward",
      description: "Cancer treatment and care",
      status: "y",
      lastUpdated: "2024-01-16 12:30:00"
    },
    {
      id: 10,
      categoryName: "Psychiatric Ward",
      description: "Mental health care facility",
      status: "n",
      lastUpdated: "2024-01-14 10:05:00"
    },
    {
      id: 11,
      categoryName: "Isolation Ward",
      description: "For contagious disease patients",
      status: "y",
      lastUpdated: "2024-01-19 14:50:00"
    },
    {
      id: 12,
      categoryName: "VIP Suite",
      description: "Luxury suite with premium amenities",
      status: "y",
      lastUpdated: "2024-01-21 09:25:00"
    }
  ];

  const [wardCategoryData, setWardCategoryData] = useState(initialWardCategoryData);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    categoryId: null, 
    newStatus: false 
  });
  
  const [formData, setFormData] = useState({
    categoryName: "",
    description: "",
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [pageInput, setPageInput] = useState("1");

  const CATEGORY_NAME_MAX_LENGTH = 100;
  const DESCRIPTION_MAX_LENGTH = 500;

  // Filter data based on search query
  const filteredWardCategoryData = wardCategoryData.filter(category =>
    category.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination values
  const totalPages = Math.ceil(filteredWardCategoryData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredWardCategoryData.slice(indexOfFirstItem, indexOfLastItem);

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
      const { categoryName, description } = formData;
      return (
        categoryName.trim() !== "" &&
        description.trim() !== ""
      );
    };
    setIsFormValid(validateForm());
  }, [formData]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      categoryName: category.categoryName,
      description: category.description,
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
      
      if (editingCategory) {
        // Update existing ward category
        const updatedData = wardCategoryData.map(item =>
          item.id === editingCategory.id 
            ? { 
                ...item, 
                categoryName: formData.categoryName,
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
        
        setWardCategoryData(updatedData);
        showPopup("Ward category updated successfully!", "success");
      } else {
        // Add new ward category
        const newCategory = {
          id: wardCategoryData.length + 1,
          categoryName: formData.categoryName,
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
        
        setWardCategoryData([...wardCategoryData, newCategory]);
        showPopup("New ward category added successfully!", "success");
      }
      
      setEditingCategory(null);
      setFormData({ categoryName: "", description: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving ward category data:", err);
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
    setConfirmDialog({ isOpen: true, categoryId: id, newStatus });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.categoryId !== null) {
      try {
        setLoading(true);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const updatedData = wardCategoryData.map((category) =>
          category.id === confirmDialog.categoryId 
            ? { 
                ...category, 
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
            : category
        );
        
        setWardCategoryData(updatedData);
        showPopup(`Ward category ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`, "success");
      } catch (err) {
        console.error("Error updating ward category status:", err);
        showPopup(`Failed to update status: ${err.message}`, "error");
      } finally {
        setLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, categoryId: null, newStatus: null });
  };

  const handleInputChange = (e) => {
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
              <h4 className="card-title">Ward Category Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                <form className="d-inline-block searchform me-4" role="search">
                  <div className="input-group searchinput">
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search ward category..."
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
                          setEditingCategory(null);
                          setFormData({ categoryName: "", description: "" });
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
                          <th>Ward Category Name</th>
                          <th>Description</th>
                          <th>Status</th>
                          <th>Last Updated</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((category) => (
                            <tr key={category.id}>
                              <td>{category.categoryName}</td>
                              <td className="text-truncate" style={{ maxWidth: "300px" }} title={category.description}>
                                {category.description}
                              </td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={category.status === "y"}
                                    onChange={() => handleSwitchChange(category.id, category.status === "y" ? "n" : "y")}
                                    id={`switch-${category.id}`}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${category.id}`}
                                  >
                                    {category.status === "y" ? 'Active' : 'Inactive'}
                                  </label>
                                </div>
                              </td>
                              <td>{category.lastUpdated}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(category)}
                                  disabled={category.status !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center">No ward category data found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {filteredWardCategoryData.length > 0 && (
                    <nav className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        <span className="text-muted">
                          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredWardCategoryData.length)} of {filteredWardCategoryData.length} entries
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
                    <label>Ward Category Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="categoryName"
                      name="categoryName"
                      placeholder="Enter ward category name"
                      value={formData.categoryName}
                      onChange={handleInputChange}
                      maxLength={CATEGORY_NAME_MAX_LENGTH}
                      required
                    />
                    <small className="text-muted">
                      {formData.categoryName.length}/{CATEGORY_NAME_MAX_LENGTH} characters
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
                      {editingCategory ? 'Update' : 'Save'}
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
                          <strong> {wardCategoryData.find(category => category.id === confirmDialog.categoryId)?.categoryName}</strong>?
                        </p>
                        <p className="text-muted">
                          {confirmDialog.newStatus === "y" 
                            ? "This will make the ward category available for selection." 
                            : "This will hide the ward category from selection."}
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

export default WardCategoryMaster;