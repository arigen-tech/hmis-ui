import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";


const RoomCategoryMaster = () => {
  const [categoryData, setCategoryData] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, id: null, newStatus: "" });
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({ categoryName: "" });
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [pageInput, setPageInput] = useState("");
  const [filteredTotalPages, setFilteredTotalPages] = useState(1);
  const [totalFilteredProducts, setTotalFilteredProducts] = useState(0);

  const CATEGORY_NAME_MAX_LENGTH = 40;

  // Format current date
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

  // Initial Dummy Data (ADDED lastUpdated)
  useEffect(() => {
    const dummyData = [
      { id: 1, categoryName: "Deluxe Room", status: "y", lastUpdated: "02-12-2025 14:00" },
      { id: 2, categoryName: "Single Room", status: "y", lastUpdated: "02-12-2025 14:05" },
      { id: 3, categoryName: "Family Room", status: "n", lastUpdated: "01-12-2025 13:40" },
    ];
    setCategoryData(dummyData);
    setTotalFilteredProducts(dummyData.length);
    setFilteredTotalPages(Math.ceil(dummyData.length / itemsPerPage));
  }, []);

  // Search Filter
  const filteredCategories = categoryData.filter((cat) =>
    cat.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // SAVE (Add + Update)
  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);

    const duplicate = categoryData.some(
      (cat) =>
        cat.categoryName.toLowerCase() === formData.categoryName.toLowerCase() &&
        (!editingCategory || editingCategory.id !== cat.id)
    );

    if (duplicate) {
      showPopup("Room Category already exists!", "error");
      setLoading(false);
      return;
    }

    if (editingCategory) {
      const updated = categoryData.map((cat) =>
        cat.id === editingCategory.id
          ? { ...cat, categoryName: formData.categoryName, lastUpdated: getFormattedDate() }
          : cat
      );
      setCategoryData(updated);
      showPopup("Category updated successfully!", "success");
    } else {
      const newCategory = {
        id: Date.now(),
        categoryName: formData.categoryName,
        status: "y",
        lastUpdated: getFormattedDate(),
      };
      setCategoryData([...categoryData, newCategory]);
      showPopup("New category added successfully!", "success");
    }

    setEditingCategory(null);
    setFormData({ categoryName: "" });
    setShowForm(false);
    setLoading(false);
  };

  // Edit Load
  const handleEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({ categoryName: cat.categoryName });
    setIsFormValid(true);
    setShowForm(true);
  };

  // Validation
  const handleInputChange = (e) => {
    const value = e.target.value;
    setFormData({ categoryName: value });
    setIsFormValid(value.trim() !== "");
  };

  // Toggle Status
  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, id, newStatus });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed) {
      const updated = categoryData.map((cat) =>
        cat.id === confirmDialog.id
          ? { ...cat, status: confirmDialog.newStatus, lastUpdated: getFormattedDate() }
          : cat
      );
      setCategoryData(updated);

      showPopup(
        `Category ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
        "success"
      );
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "" });
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handlePageNavigation = () => {
    const pageNumber = Number(pageInput);
    if (pageNumber >= 1 && pageNumber <= filteredTotalPages) {
      setCurrentPage(pageNumber); 
    }
  };

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= filteredTotalPages; i++) pages.push(i);

    return pages.map((num) => (
      <li key={num} className={`page-item ${num === currentPage ? "active" : ""}`}>
        <button className="page-link" onClick={() => setCurrentPage(num)}>
          {num}
        </button>
      </li>
    ));
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Room Category Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                <form className="d-inline-block searchform me-4" role="search">
                  <div className="input-group searchinput">
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search ward name, category, or care level..."
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
                      className="btn btn-success me-2"
                      onClick={() => {
                        setShowForm(true);
                        setEditingCategory(null);
                        setFormData({ categoryName: "" });
                        setIsFormValid(false);
                      }}
                    >
                      <i className="mdi mdi-plus"></i> Add
                    </button>

                    <button className="btn btn-success" onClick={handleRefresh}>
                      <i className="mdi mdi-refresh"></i> Show All
                    </button>
                  </>
                ) : (
                  <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
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
                  {/* Search */}
                 

                  {/* Table */}
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Room Category Name</th>
                          <th>Status</th>
                          <th>Last Updated</th>
                          <th>Edit</th>
                        </tr>
                      </thead>

                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((cat) => (
                            <tr key={cat.id}>
                              <td>{cat.categoryName}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={cat.status === "y"}
                                    onChange={() =>
                                      handleSwitchChange(cat.id, cat.status === "y" ? "n" : "y")
                                    }
                                  />
                                  <label className="form-check-label">
                                    {cat.status === "y" ? "Active" : "Deactivated"}
                                  </label>
                                </div>
                              </td>

                              <td>{cat.lastUpdated}</td>

                              <td>
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleEdit(cat)}
                                  disabled={cat.status !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center">
                              No category found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <nav className="d-flex justify-content-between align-items-center mt-3">
                    <span>
                      Page {currentPage} of {filteredTotalPages} | Total Records: {totalFilteredProducts}
                    </span>

                    <ul className="pagination mb-0">{renderPagination()}</ul>

                    <div className="d-flex">
                      <input
                        type="number"
                        className="form-control me-2"
                        placeholder="Go to page"
                        value={pageInput}
                        onChange={(e) => setPageInput(e.target.value)}
                      />
                      <button className="btn btn-primary" onClick={handlePageNavigation}>
                        Go
                      </button>
                    </div>
                  </nav>
                </>
              ) : (
                // FORM
                <form className="row" onSubmit={handleSave}>
                  <div className="form-group col-md-4">
                    <label>
                      Room Category Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      placeholder="Enter Category Name"
                      value={formData.categoryName}
                      maxLength={CATEGORY_NAME_MAX_LENGTH}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group col-md-12 mt-3 d-flex justify-content-end">
                    <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                      Save
                    </button>
                    <button className="btn btn-danger" onClick={() => setShowForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Popup */}
              {popupMessage && (
                <Popup
                  message={popupMessage.message}
                  type={popupMessage.type}
                  onClose={popupMessage.onClose}
                />
              )}

              {/* Confirm Modal */}
              {confirmDialog.isOpen && (
                <div className="modal d-block" tabIndex="-1">
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5>Confirm Status Change</h5>
                        <button className="btn-close" onClick={() => handleConfirm(false)}></button>
                      </div>

                      <div className="modal-body">
                        Are you sure you want to{" "}
                        <strong>
                          {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}
                        </strong>
                        ?
                      </div>

                      <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={() => handleConfirm(false)}>
                          No
                        </button>
                        <button className="btn btn-primary" onClick={() => handleConfirm(true)}>
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

export default RoomCategoryMaster;
