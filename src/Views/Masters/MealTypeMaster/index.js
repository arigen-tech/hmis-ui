import { useState } from "react";
import Popup from "../../../Components/popup";

const MealTypeMaster = () => {
  const [mealTypeData, setMealTypeData] = useState([
    {
      id: 1,
      mealTypeName: "Breakfast",
      sequenceNo: 1,
      status: true, // true = Active, false = Inactive
      lastUpdatedDate: "2024-01-15",
      createdBy: "Admin",
      lastUpdatedBy: "Admin"
    },
    {
      id: 2,
      mealTypeName: "Lunch",
      sequenceNo: 2,
      status: true,
      lastUpdatedDate: "2024-01-10",
      createdBy: "Admin",
      lastUpdatedBy: "Admin"
    },
    {
      id: 3,
      mealTypeName: "Dinner",
      sequenceNo: 3,
      status: true,
      lastUpdatedDate: "2024-01-05",
      createdBy: "Admin",
      lastUpdatedBy: "Admin"
    },
    {
      id: 4,
      mealTypeName: "Snacks",
      sequenceNo: 4,
      status: false,
      lastUpdatedDate: "2024-01-02",
      createdBy: "Manager",
      lastUpdatedBy: "Admin"
    },
    {
      id: 5,
      mealTypeName: "Brunch",
      sequenceNo: 5,
      status: true,
      lastUpdatedDate: "2024-01-01",
      createdBy: "Admin",
      lastUpdatedBy: "Manager"
    },
  ]);

  const [formData, setFormData] = useState({
    mealTypeName: "",
    sequenceNo: ""
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingMealType, setEditingMealType] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4);
  const [pageInput, setPageInput] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  const MEAL_TYPE_NAME_MAX_LENGTH = 50;

  // Filtered data based on search
  const filteredMealTypeData = mealTypeData.filter(
    (mealType) =>
      mealType.mealTypeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (mealType.status ? "active" : "inactive").includes(searchQuery.toLowerCase())
  );

  // Calculate pagination totals
  const filteredTotalPages = Math.ceil(filteredMealTypeData.length / itemsPerPage);
  const totalFilteredRecords = filteredMealTypeData.length;

  // Sorting function
  const sortedMealTypeData = [...filteredMealTypeData].sort((a, b) => {
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
  const currentItems = sortedMealTypeData.slice(indexOfFirstItem, indexOfLastItem);

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

  const handleEdit = (mealType) => {
    setEditingMealType(mealType);
    setFormData({
      mealTypeName: mealType.mealTypeName,
      sequenceNo: mealType.sequenceNo.toString()
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    // Check for duplicates (excluding the current editing meal type)
    const isDuplicate = mealTypeData.some(
      (mealType) =>
        mealType.mealTypeName.toLowerCase() === formData.mealTypeName.toLowerCase() &&
        mealType.id !== editingMealType?.id
    );

    if (isDuplicate) {
      showPopup("Meal type already exists!", "error");
      return;
    }

    // Check for sequence number duplicate
    const isSequenceDuplicate = mealTypeData.some(
      (mealType) =>
        mealType.sequenceNo === parseInt(formData.sequenceNo) &&
        mealType.id !== editingMealType?.id
    );

    if (isSequenceDuplicate) {
      showPopup("Sequence number already exists!", "error");
      return;
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const currentUser = "Admin"; // In real app, get from auth context

    if (editingMealType) {
      // Update existing meal type
      setMealTypeData((prevData) =>
        prevData.map((mealType) =>
          mealType.id === editingMealType.id
            ? {
              ...mealType,
              mealTypeName: formData.mealTypeName,
              sequenceNo: parseInt(formData.sequenceNo),
              lastUpdatedDate: currentDate,
              lastUpdatedBy: currentUser
            }
            : mealType
        )
      );
      showPopup("Meal type updated successfully!", "success");
    } else {
      // Create new meal type
      const newId = mealTypeData.length > 0 ? Math.max(...mealTypeData.map(item => item.id)) + 1 : 1;
      const newMealType = {
        id: newId,
        mealTypeName: formData.mealTypeName,
        sequenceNo: parseInt(formData.sequenceNo),
        status: true, // Default to Active when creating new
        lastUpdatedDate: currentDate,
        createdBy: currentUser,
        lastUpdatedBy: currentUser
      };

      setMealTypeData((prevData) => [...prevData, newMealType]);
      showPopup("New meal type added successfully!", "success");
    }

    setEditingMealType(null);
    setFormData({
      mealTypeName: "",
      sequenceNo: ""
    });
    setShowForm(false);
  };

  // Toggle status function
  const toggleStatus = (id) => {
    const currentDate = new Date().toISOString().split('T')[0];
    const currentUser = "Admin";

    setMealTypeData((prevData) =>
      prevData.map((mealType) =>
        mealType.id === id
          ? {
            ...mealType,
            status: !mealType.status,
            lastUpdatedDate: currentDate,
            lastUpdatedBy: currentUser
          }
          : mealType
      )
    );

    const updatedMealType = mealTypeData.find(m => m.id === id);
    const newStatus = !updatedMealType.status;
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

      // Validate form - only meal type name and sequence no are required
      const isMealTypeNameValid = (updatedData.mealTypeName?.trim() || "") !== "";
      const isSequenceNoValid = (updatedData.sequenceNo?.trim() || "") !== "" &&
        !isNaN(updatedData.sequenceNo) &&
        parseInt(updatedData.sequenceNo) > 0;

      setIsFormValid(isMealTypeNameValid && isSequenceNoValid);

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
              <h4 className="card-title">Meal Type Master</h4>
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
                          setEditingMealType(null);
                          setFormData({
                            mealTypeName: "",
                            sequenceNo: ""
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
                          onClick={() => handleSort('mealTypeName')}
                        >
                          Meal Type Name {getSortIcon('mealTypeName')}
                        </th>
                        <th
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleSort('sequenceNo')}
                        >
                          Sequence No {getSortIcon('sequenceNo')}
                        </th>
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
                        currentItems.map((mealType) => (
                          <tr key={mealType.id}>
                            <td>{mealType.mealTypeName}</td>
                            <td>{mealType.sequenceNo}</td>
                            <td>{mealType.lastUpdatedDate}</td>
                            <td>{mealType.createdBy}</td>
                            <td>{mealType.lastUpdatedBy}</td>
                            <td>
                              <div className="form-check form-switch d-flex justify-content-center">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  role="switch"
                                  id={`status-switch-${mealType.id}`}
                                  checked={mealType.status}
                                  onChange={() => toggleStatus(mealType.id)}
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
                                onClick={() => handleEdit(mealType)}
                              >
                                <i className="fa fa-pencil"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center">No meal type data found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {filteredMealTypeData.length > 0 && (
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
                      <div className="form-group col-md-4">
                        <label>Meal Type Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control mt-1"
                          id="mealTypeName"
                          name="mealTypeName"
                          placeholder="Enter meal type name"
                          value={formData.mealTypeName}
                          onChange={handleInputChange}
                          maxLength={MEAL_TYPE_NAME_MAX_LENGTH}
                          required
                        />
                      </div>
                      <div className="form-group col-md-4">
                        <label>Sequence No <span className="text-danger">*</span></label>
                        <input
                          type="number"
                          className="form-control mt-1"
                          id="sequenceNo"
                          name="sequenceNo"
                          placeholder="Enter sequence number"
                          value={formData.sequenceNo}
                          onChange={handleInputChange}
                          min="1"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                    <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                      {editingMealType ? "Update" : "Save"}
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

export default MealTypeMaster;