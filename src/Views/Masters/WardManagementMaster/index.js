import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";

const WardManagement = () => {
  // Sample mock data
  const initialWardData = [
    {
      id: 1,
      wardName: "Ward A",
      category: "General Ward",
      careLevel: "Basic",
      status: "y",
      lastUpdated: "2024-01-15 10:30:00"
    },
    {
      id: 2,
      wardName: "Ward B - Private",
      category: "Private Ward",
      careLevel: "Standard",
      status: "y",
      lastUpdated: "2024-01-10 14:20:00"
    },
    {
      id: 3,
      wardName: "ICU - 1",
      category: "ICU - Intensive Care Unit",
      careLevel: "Critical",
      status: "y",
      lastUpdated: "2024-01-05 09:15:00"
    },
    {
      id: 4,
      wardName: "Cardiac Unit - 1",
      category: "CCU - Cardiac Care Unit",
      careLevel: "Specialized",
      status: "y",
      lastUpdated: "2024-01-20 16:45:00"
    },
    {
      id: 5,
      wardName: "Children's Ward",
      category: "Pediatric Ward",
      careLevel: "Standard",
      status: "y",
      lastUpdated: "2024-01-18 11:10:00"
    },
    {
      id: 6,
      wardName: "Maternity - 1",
      category: "Maternity Ward",
      careLevel: "Basic",
      status: "n",
      lastUpdated: "2024-01-12 13:25:00"
    },
    {
      id: 7,
      wardName: "Ortho Ward - 1",
      category: "Orthopedic Ward",
      careLevel: "Specialized",
      status: "y",
      lastUpdated: "2024-01-08 15:40:00"
    },
    {
      id: 8,
      wardName: "Neuro ICU",
      category: "Neuro Ward",
      careLevel: "Critical",
      status: "y",
      lastUpdated: "2024-01-22 08:55:00"
    },
    {
      id: 9,
      wardName: "Oncology - 1",
      category: "Oncology Ward",
      careLevel: "Specialized",
      status: "y",
      lastUpdated: "2024-01-16 12:30:00"
    },
    {
      id: 10,
      wardName: "Psych Ward",
      category: "Psychiatric Ward",
      careLevel: "Standard",
      status: "n",
      lastUpdated: "2024-01-14 10:05:00"
    },
    {
      id: 11,
      wardName: "Isolation - 1",
      category: "Isolation Ward",
      careLevel: "Specialized",
      status: "y",
      lastUpdated: "2024-01-19 14:50:00"
    },
    {
      id: 12,
      wardName: "VIP Suite - 1",
      category: "VIP Suite",
      careLevel: "Premium",
      status: "y",
      lastUpdated: "2024-01-21 09:25:00"
    }
  ];

  // Dropdown options
  const categoryOptions = [
    { value: "", label: "Select Category" },
    { value: "General Ward", label: "General Ward" },
    { value: "Private Ward", label: "Private Ward" },
    { value: "ICU - Intensive Care Unit", label: "ICU - Intensive Care Unit" },
    { value: "CCU - Cardiac Care Unit", label: "CCU - Cardiac Care Unit" },
    { value: "Pediatric Ward", label: "Pediatric Ward" },
    { value: "Maternity Ward", label: "Maternity Ward" },
    { value: "Orthopedic Ward", label: "Orthopedic Ward" },
    { value: "Neuro Ward", label: "Neuro Ward" },
    { value: "Oncology Ward", label: "Oncology Ward" },
    { value: "Psychiatric Ward", label: "Psychiatric Ward" },
    { value: "Isolation Ward", label: "Isolation Ward" },
    { value: "VIP Suite", label: "VIP Suite" }
  ];

  const careLevelOptions = [
    { value: "", label: "Select Care Level" },
    { value: "Basic", label: "Basic" },
    { value: "Standard", label: "Standard" },
    { value: "Specialized", label: "Specialized" },
    { value: "Critical", label: "Critical" },
    { value: "Premium", label: "Premium" }
  ];

  const [wardData, setWardData] = useState(initialWardData);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    wardId: null,
    newStatus: false
  });

  const [formData, setFormData] = useState({
    wardName: "",
    category: "",
    careLevel: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingWard, setEditingWard] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [pageInput, setPageInput] = useState("1");

  const WARD_NAME_MAX_LENGTH = 100;

  // Filter data based on search query
  const filteredWardData = wardData.filter(ward =>
    ward.wardName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ward.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ward.careLevel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination values
  const totalPages = Math.ceil(filteredWardData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredWardData.slice(indexOfFirstItem, indexOfLastItem);

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
      const { wardName, category, careLevel } = formData;
      return (
        wardName.trim() !== "" &&
        category.trim() !== "" &&
        careLevel.trim() !== ""
      );
    };
    setIsFormValid(validateForm());
  }, [formData]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleEdit = (ward) => {
    setEditingWard(ward);
    setFormData({
      wardName: ward.wardName,
      category: ward.category,
      careLevel: ward.careLevel,
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

      if (editingWard) {
        // Update existing ward
        const updatedData = wardData.map(item =>
          item.id === editingWard.id
            ? {
              ...item,
              wardName: formData.wardName,
              category: formData.category,
              careLevel: formData.careLevel,
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

        setWardData(updatedData);
        showPopup("Ward updated successfully!", "success");
      } else {
        // Add new ward
        const newWard = {
          id: wardData.length + 1,
          wardName: formData.wardName,
          category: formData.category,
          careLevel: formData.careLevel,
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

        setWardData([...wardData, newWard]);
        showPopup("New ward added successfully!", "success");
      }

      setEditingWard(null);
      setFormData({ wardName: "", category: "", careLevel: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving ward data:", err);
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
    setConfirmDialog({ isOpen: true, wardId: id, newStatus });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.wardId !== null) {
      try {
        setLoading(true);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const updatedData = wardData.map((ward) =>
          ward.id === confirmDialog.wardId
            ? {
              ...ward,
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
            : ward
        );

        setWardData(updatedData);
        showPopup(`Ward ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`, "success");
      } catch (err) {
        console.error("Error updating ward status:", err);
        showPopup(`Failed to update status: ${err.message}`, "error");
      } finally {
        setLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, wardId: null, newStatus: null });
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
              <h4 className="card-title">Ward Management</h4>
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
                          setEditingWard(null);
                          setFormData({ wardName: "", category: "", careLevel: "" });
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
                          <th>Ward Name</th>
                          <th>Category</th>
                          <th>Care Level</th>
                          <th>Status</th>
                          <th>Last Updated</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((ward) => (
                            <tr key={ward.id}>
                              <td>{ward.wardName}</td>
                              <td>{ward.category}</td>
                              <td>{ward.careLevel}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={ward.status === "y"}
                                    onChange={() => handleSwitchChange(ward.id, ward.status === "y" ? "n" : "y")}
                                    id={`switch-${ward.id}`}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${ward.id}`}
                                  >
                                    {ward.status === "y" ? 'Active' : 'Inactive'}
                                  </label>
                                </div>
                              </td>
                              <td>{ward.lastUpdated}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(ward)}
                                  disabled={ward.status !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center">No ward data found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {filteredWardData.length > 0 && (
                    <nav className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        <span className="text-muted">
                          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredWardData.length)} of {filteredWardData.length} entries
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
                    <label>Ward Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="wardName"
                      name="wardName"
                      placeholder="Enter ward name"
                      value={formData.wardName}
                      onChange={handleInputChange}
                      maxLength={WARD_NAME_MAX_LENGTH}
                      required
                    />
                    <small className="text-muted">
                      {formData.wardName.length}/{WARD_NAME_MAX_LENGTH} characters
                    </small>
                  </div>

                  <div className="form-group col-md-4">
                    <label>Category <span className="text-danger">*</span></label>
                    <select
                      className="form-select mt-1"
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleSelectChange}
                      required
                    >
                      {categoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <small className="text-muted">Select a ward category</small>
                  </div>

                  <div className="form-group col-md-4">
                    <label>Care Level <span className="text-danger">*</span></label>
                    <select
                      className="form-select mt-1"
                      id="careLevel"
                      name="careLevel"
                      value={formData.careLevel}
                      onChange={handleSelectChange}
                      required
                    >
                      {careLevelOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <small className="text-muted">Select care level for this ward</small>
                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid}
                    >
                      {editingWard ? 'Update' : 'Save'}
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
                          <strong> {wardData.find(ward => ward.id === confirmDialog.wardId)?.wardName}</strong>?
                        </p>
                        <p className="text-muted">
                          {confirmDialog.newStatus === "y"
                            ? "This will make the ward available for patient allocation."
                            : "This will hide the ward from patient allocation."}
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

export default WardManagement;