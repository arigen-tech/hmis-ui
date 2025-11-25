import { useState } from "react";
import Popup from "../../../Components/popup";

const InvestigationMethodology = () => {
  const [methodologyData, setMethodologyData] = useState([
    { id: 1, methodName: "Field Observation", notes: "Direct observation in natural environment" },
    { id: 2, methodName: "Interview", notes: "Structured or unstructured interviews" },
    { id: 3, methodName: "Survey", notes: "Questionnaire-based data collection" },
    { id: 4, methodName: "Case Study", notes: "In-depth analysis of specific cases" },
    { id: 5, methodName: "Document Analysis", notes: "Review of existing documents and records" },
  ]);

  const [formData, setFormData] = useState({
    methodName: "",
    notes: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingMethodology, setEditingMethodology] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredTotalPages, setFilteredTotalPages] = useState(1);
  const [totalFilteredRecords, setTotalFilteredRecords] = useState(0);
  const [itemsPerPage] = useState(4);
  const [pageInput, setPageInput] = useState("");

  const METHOD_NAME_MAX_LENGTH = 30;
  const NOTES_MAX_LENGTH = 30;

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const filteredMethodologyData = methodologyData.filter(
    (methodology) =>
      methodology.methodName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      methodology.notes.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMethodologyData.slice(indexOfFirstItem, indexOfLastItem);

  const handleEdit = (methodology) => {
    setEditingMethodology(methodology);
    setFormData({
      methodName: methodology.methodName,
      notes: methodology.notes,
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    // Check for duplicates (excluding the current editing methodology)
    const isDuplicate = methodologyData.some(
      (methodology) =>
        (methodology.methodName === formData.methodName || 
         methodology.notes === formData.notes) &&
        methodology.id !== editingMethodology?.id
    );

    if (isDuplicate) {
      showPopup("Methodology already exists!", "error");
      return;
    }

    if (editingMethodology) {
      // Update existing methodology
      setMethodologyData((prevData) =>
        prevData.map((methodology) =>
          methodology.id === editingMethodology.id 
            ? { ...methodology, methodName: formData.methodName, notes: formData.notes }
            : methodology
        )
      );
      showPopup("Methodology updated successfully!", "success");
    } else {
      // Create new methodology
      const newId = Math.max(...methodologyData.map(item => item.id)) + 1;
      const newMethodology = {
        id: newId,
        methodName: formData.methodName,
        notes: formData.notes,
      };
      
      setMethodologyData((prevData) => [...prevData, newMethodology]);
      showPopup("New methodology added successfully!", "success");
    }

    setEditingMethodology(null);
    setFormData({ methodName: "", notes: "" });
    setShowForm(false);
    
    // Update pagination info
    setTotalFilteredRecords(methodologyData.length);
    setFilteredTotalPages(Math.ceil(methodologyData.length / itemsPerPage));
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
      if (id === "methodName" || id === "notes") {
        setIsFormValid(
          (updatedData.methodName?.trim() || "") !== "" &&
          (updatedData.notes?.trim() || "") !== ""
        );
      }

      return updatedData;
    });
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

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Investigation Methodology Master</h4>
              <div className="d-flex justify-content-between align-items-center">
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

                <div className="d-flex align-items-center">
                  {!showForm ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={() => {
                          setEditingMethodology(null);
                          setFormData({ methodName: "", notes: "" });
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
                        <th>Method Name</th>
                        <th>Notes</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.length > 0 ? (
                        currentItems.map((methodology) => (
                          <tr key={methodology.id}>
                            <td>{methodology.methodName}</td>
                            <td>{methodology.notes}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleEdit(methodology)}
                              >
                                <i className="fa fa-pencil"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center">No methodology data found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {filteredMethodologyData.length > 0 && (
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
                  <div className="form-group col-md-4">
                    <label>Method Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="methodName"
                      name="methodName"
                      placeholder="Method Name"
                      value={formData.methodName}
                      onChange={handleInputChange}
                      maxLength={METHOD_NAME_MAX_LENGTH}
                      required
                    />
                  </div>
                  <div className="form-group col-md-4">
                    <label>Notes <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="notes"
                      name="notes"
                      placeholder="Notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      maxLength={NOTES_MAX_LENGTH}
                      required
                    />
                  </div>
                  <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                    <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                      Save
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

export default InvestigationMethodology;