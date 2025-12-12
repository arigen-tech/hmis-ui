import { useState } from "react";
import Popup from "../../../Components/popup";

const DietTypeMaster = () => {
  const [dietTypeData, setDietTypeData] = useState([
    {
      id: 1,
      dietTypeName: "Vegetarian",
      description: "Plant-based diet with no meat products",
      sequenceNo: 1,
      status: true, // true = Active, false = Inactive
      lastUpdatedDate: "2024-01-15",
      createdBy: "Admin",
      lastUpdatedBy: "Admin"
    },
    {
      id: 2,
      dietTypeName: "Vegan",
      description: "No animal products including dairy, eggs, and honey",
      sequenceNo: 2,
      status: true,
      lastUpdatedDate: "2024-01-10",
      createdBy: "Admin",
      lastUpdatedBy: "Admin"
    },
    {
      id: 3,
      dietTypeName: "Keto",
      description: "High-fat, low-carbohydrate diet",
      sequenceNo: 3,
      status: true,
      lastUpdatedDate: "2024-01-05",
      createdBy: "Admin",
      lastUpdatedBy: "Admin"
    },
    {
      id: 4,
      dietTypeName: "Gluten-Free",
      description: "Diet without gluten-containing grains",
      sequenceNo: 4,
      status: false,
      lastUpdatedDate: "2024-01-02",
      createdBy: "Manager",
      lastUpdatedBy: "Admin"
    },
    {
      id: 5,
      dietTypeName: "Paleo",
      description: "Focuses on whole foods, lean meats, fruits and vegetables",
      sequenceNo: 5,
      status: true,
      lastUpdatedDate: "2024-01-01",
      createdBy: "Admin",
      lastUpdatedBy: "Manager"
    },
  ]);

  const [formData, setFormData] = useState({
    dietTypeName: "",
    description: ""
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingDietType, setEditingDietType] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4);
  const [pageInput, setPageInput] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  const DIET_TYPE_NAME_MAX_LENGTH = 50;
  const DESCRIPTION_MAX_LENGTH = 200;

  // Filtered data based on search
  const filteredDietTypeData = dietTypeData.filter(
    (dietType) =>
      dietType.dietTypeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dietType.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dietType.status ? "active" : "inactive").includes(searchQuery.toLowerCase())
  );

  // Calculate pagination totals
  const filteredTotalPages = Math.ceil(filteredDietTypeData.length / itemsPerPage);
  const totalFilteredRecords = filteredDietTypeData.length;

  // Sorting function
  const sortedDietTypeData = [...filteredDietTypeData].sort((a, b) => {
    if (sortConfig.key) {
      if (sortConfig.key === 'status') {
        // For status, compare boolean values
        if (a.status === b.status) return 0;
        if (sortConfig.direction === 'ascending') {
          return a.status ? -1 : 1;
        } else {
          return a.status ? 1 : -1;
        }
      }

      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
    }
    return 0;
  });

  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedDietTypeData.slice(indexOfFirstItem, indexOfLastItem);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleEdit = (dietType) => {
    setEditingDietType(dietType);
    setFormData({
      dietTypeName: dietType.dietTypeName,
      description: dietType.description
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    console.log("Save button clicked, isFormValid:", isFormValid);

    if (!isFormValid) {
      console.log("Form is not valid");
      return;
    }

    // Check for duplicates (excluding the current editing diet type)
    const isDuplicate = dietTypeData.some(
      (dietType) =>
        dietType.dietTypeName.toLowerCase() === formData.dietTypeName.toLowerCase() &&
        dietType.id !== editingDietType?.id
    );

    if (isDuplicate) {
      showPopup("Diet type already exists!", "error");
      return;
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const currentUser = "Admin"; // In real app, get from auth context

    if (editingDietType) {
      // Update existing diet type
      setDietTypeData((prevData) =>
        prevData.map((dietType) =>
          dietType.id === editingDietType.id
            ? {
              ...dietType,
              dietTypeName: formData.dietTypeName,
              description: formData.description,
              lastUpdatedDate: currentDate,
              lastUpdatedBy: currentUser
            }
            : dietType
        )
      );
      showPopup("Diet type updated successfully!", "success");
    } else {
      // Create new diet type - auto generate sequence number
      const newId = dietTypeData.length > 0 ? Math.max(...dietTypeData.map(item => item.id)) + 1 : 1;
      const newSequenceNo = dietTypeData.length > 0
        ? Math.max(...dietTypeData.map(item => item.sequenceNo)) + 1
        : 1;

      console.log("Creating new diet type with ID:", newId, "Sequence:", newSequenceNo);

      const newDietType = {
        id: newId,
        dietTypeName: formData.dietTypeName,
        description: formData.description,
        sequenceNo: newSequenceNo,
        status: true, // Default to Active when creating new
        lastUpdatedDate: currentDate,
        createdBy: currentUser,
        lastUpdatedBy: currentUser
      };

      setDietTypeData((prevData) => [...prevData, newDietType]);
      showPopup("New diet type added successfully!", "success");
    }

    setEditingDietType(null);
    setFormData({
      dietTypeName: "",
      description: ""
    });
    setShowForm(false);
  };

  // Toggle status function
  const toggleStatus = (id) => {
    const currentDate = new Date().toISOString().split('T')[0];
    const currentUser = "Admin";

    setDietTypeData((prevData) =>
      prevData.map((dietType) =>
        dietType.id === id
          ? {
            ...dietType,
            status: !dietType.status,
            lastUpdatedDate: currentDate,
            lastUpdatedBy: currentUser
          }
          : dietType
      )
    );

    const updatedDietType = dietTypeData.find(m => m.id === id);
    const newStatus = !updatedDietType.status;
    showPopup(`Status changed to ${newStatus ? "Active" : "Inactive"} successfully!`, "success");
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

  const handleInputChange = (e) => {
    const { id, value } = e.target;

    setFormData((prevData) => {
      const updatedData = { ...prevData, [id]: value };

      // Validate form
      const isDietTypeNameValid = (updatedData.dietTypeName?.trim() || "") !== "";
      const isDescriptionValid = (updatedData.description?.trim() || "") !== "";

      const formValid = isDietTypeNameValid && isDescriptionValid;
      console.log("Form validation:", {
        dietTypeName: updatedData.dietTypeName,
        description: updatedData.description,
        isDietTypeNameValid,
        isDescriptionValid,
        formValid
      });

      setIsFormValid(formValid);

      return updatedData;
    });
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    setSortConfig({ key: null, direction: 'ascending' });
  };

  const handlePageNavigation = () => {
    const pageNumber = Number(pageInput);
    if (pageNumber >= 1 && pageNumber <= filteredTotalPages) {
      setCurrentPage(pageNumber);
      setPageInput("");
    }
  };

  const renderPagination = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(filteredTotalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) pageNumbers.push("...");
    }
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    if (endPage < filteredTotalPages) {
      if (endPage < filteredTotalPages - 1) pageNumbers.push("...");
      pageNumbers.push(filteredTotalPages);
    }
    return pageNumbers.map((number, index) => (
      <li key={index} className={`page-item ${number === currentPage ? "active" : ""}`}>
        {typeof number === "number" ? (
          <button className="page-link" onClick={() => setCurrentPage(number)}>
            {number}
          </button>
        ) : (
          <span className="page-link disabled">{number}</span>
        )}
      </li>
    ));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? '↑' : '↓';
    }
    return '';
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Diet Type Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm ? (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search Religions"
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
                          setEditingDietType(null);
                          setFormData({
                            dietTypeName: "",
                            description: ""
                          });
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
              {!showForm ? (
                <div className="table-responsive packagelist">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleSort('dietTypeName')}
                        >
                          Diet Type Name {getSortIcon('dietTypeName')}
                        </th>
                        <th>Description</th>
                        <th
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleSort('lastUpdatedDate')}
                        >
                          Last Updated Date {getSortIcon('lastUpdatedDate')}
                        </th>
                        <th>Created By</th>
                        <th>Last Updated By</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.length > 0 ? (
                        currentItems.map((dietType) => (
                          <tr key={dietType.id}>
                            <td>{dietType.dietTypeName}</td>
                            <td>{dietType.description}</td>
                            <td>{dietType.lastUpdatedDate}</td>
                            <td>{dietType.createdBy}</td>
                            <td>{dietType.lastUpdatedBy}</td>
                            <td>
                              <div className="form-check form-switch d-flex justify-content-center">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  role="switch"
                                  id={`status-switch-${dietType.id}`}
                                  checked={dietType.status}
                                  onChange={() => toggleStatus(dietType.id)}
                                  style={{
                                    width: '2.5em',
                                    height: '1.3em',
                                    cursor: 'pointer'
                                  }}
                                />
                              </div>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleEdit(dietType)}
                              >
                                <i className="fa fa-pencil"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center">No diet type data found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {filteredDietTypeData.length > 0 && (
                    <nav className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        <span>
                          Page {currentPage} of {filteredTotalPages} | Total Records: {totalFilteredRecords}
                        </span>
                      </div>
                      <ul className="pagination mb-0">
                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            &laquo; Previous
                          </button>
                        </li>
                        {renderPagination()}
                        <li className={`page-item ${currentPage === filteredTotalPages ? "disabled" : ""}`}>
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === filteredTotalPages}
                          >
                            Next &raquo;
                          </button>
                        </li>
                      </ul>
                      <div className="d-flex align-items-center">
                        <input
                          type="number"
                          min="1"
                          max={filteredTotalPages}
                          value={pageInput}
                          onChange={(e) => setPageInput(e.target.value)}
                          placeholder="Go to page"
                          className="form-control me-2"
                          style={{ width: "120px" }}
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
                </div>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="col-md-12">
                    <div className="row">
                      <div className="form-group col-md-6">
                        <label>Diet Type Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control mt-1"
                          id="dietTypeName"
                          name="dietTypeName"
                          placeholder="Enter diet type name"
                          value={formData.dietTypeName}
                          onChange={handleInputChange}
                          maxLength={DIET_TYPE_NAME_MAX_LENGTH}
                          required
                        />
                        <small className="text-muted">
                          Maximum {DIET_TYPE_NAME_MAX_LENGTH} characters
                        </small>
                      </div>
                    </div>
                    <div className="row mt-3">
                      <div className="form-group col-md-8">
                        <label>Description <span className="text-danger">*</span></label>
                        <textarea
                          className="form-control mt-1"
                          id="description"
                          name="description"
                          placeholder="Enter diet type description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows="4"
                          maxLength={DESCRIPTION_MAX_LENGTH}
                          required
                        />
                        <small className="text-muted">
                          {formData.description.length}/{DESCRIPTION_MAX_LENGTH} characters
                        </small>
                      </div>
                    </div>
                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid}
                    >
                      {editingDietType ? "Update" : "Save"}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DietTypeMaster;