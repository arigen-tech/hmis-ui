import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import { DG_MAS_INVESTIGATION_CATEGORY } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";

const InvestigationCategory = () => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    categoryName: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 5;

  const CATEGORY_NAME_MAX_LENGTH = 30;

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await getRequest(`${DG_MAS_INVESTIGATION_CATEGORY}/findAll`);
      if (response && response.response) {
        setCategories(response.response);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      showPopup("Failed to load categories", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const filteredCategories = categories.filter(
    (category) =>
      category.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTotalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const currentItems = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      categoryName: category.categoryName,
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    try {
      // Check for duplicates
      const isDuplicate = categories.some(
        (category) =>
          category.categoryId !== (editingCategory ? editingCategory.categoryId : null) &&
          category.categoryName.toLowerCase() === formData.categoryName.toLowerCase()
      );

      if (isDuplicate) {
        showPopup("Category with the same name already exists!", "error");
        setIsLoading(false);
        return;
      }

      if (editingCategory) {
        // Update existing category
        const response = await putRequest(`${DG_MAS_INVESTIGATION_CATEGORY}/update/${editingCategory.categoryId}`, {
          categoryName: formData.categoryName,
        });

        if (response && response.status === 200) {
          fetchCategories();
          showPopup("Category updated successfully!", "success");
        }
      } else {
        // Create new category
        const response = await postRequest(`${DG_MAS_INVESTIGATION_CATEGORY}/create`, {
          categoryName: formData.categoryName,
        });

        if (response && response.status === 200) {
          fetchCategories();
          showPopup("New category added successfully!", "success");
        }
      }

      // Reset form
      setEditingCategory(null);
      setFormData({ categoryName: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving category:", err);
      showPopup(`Failed to save changes: ${err.response?.data?.message || err.message}`, "error");
      setIsLoading(false);
    }
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
      setIsFormValid(updatedData.categoryName.trim() !== "");
      
      return updatedData;
    });
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchCategories();
  };

  const handlePageNavigation = () => {
    const pageNumber = parseInt(pageInput, 10);
    if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
      setCurrentPage(pageNumber);
      setPageInput("");
    } else {
      showPopup("Please enter a valid page number.", "error");
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2">Investigation Category Master</h4>
              <div className="d-flex justify-content-between align-items-center mt-3">
                {!showForm && (
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
                )}
                <div className="d-flex align-items-center ms-auto">
                  {!showForm ? (
                    <>
                      <button 
                        type="button" 
                        className="btn btn-success me-2" 
                        onClick={() => {
                          setEditingCategory(null);
                          setFormData({ categoryName: "" });
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
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setShowForm(false)}
                    >
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
                        <th>Category Name</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.length > 0 ? (
                        currentItems.map((category) => (
                          <tr key={category.categoryId}>
                            <td>{category.categoryName}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleEdit(category)}
                              >
                                <i className="fa fa-pencil"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="2" className="text-center">
                            No category data found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  
                  {filteredCategories.length > 0 && (
                    <nav className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        <span>
                          Page {currentPage} of {filteredTotalPages} | Total Records: {filteredCategories.length}
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
                        
                        {[...Array(filteredTotalPages)].map((_, index) => (
                          <li
                            className={`page-item ${currentPage === index + 1 ? "active" : ""}`}
                            key={index}
                          >
                            <button 
                              className="page-link" 
                              onClick={() => setCurrentPage(index + 1)}
                            >
                              {index + 1}
                            </button>
                          </li>
                        ))}
                        
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
                  <div className="form-group col-md-4 mt-3">
                    <label>Category Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      id="categoryName"
                      placeholder="Category Name"
                      value={formData.categoryName}
                      onChange={handleInputChange}
                      maxLength={CATEGORY_NAME_MAX_LENGTH}
                      required
                    />
                  </div>
                  
                  <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                    <button 
                      type="submit" 
                      className="btn btn-primary me-2" 
                      disabled={!isFormValid || isLoading}
                    >
                      {isLoading ? "Saving..." : "Save"}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger" 
                      onClick={() => setShowForm(false)}
                      disabled={isLoading}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestigationCategory;