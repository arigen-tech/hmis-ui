import { useState } from "react";
import Popup from "../../../Components/popup";

const FamilyHistoryMaster = () => {
  const [familyHistoryData, setFamilyHistoryData] = useState([
    {
      "id": 1,
      "familyHistoryCode": "ARTH",
      "familyHistoryName": "Arthritis",
      "status": "y"
    },
    {
      "id": 2,
      "familyHistoryCode": "DIB",
      "familyHistoryName": "DIABETES",
      "status": "y"
    },
    {
      "id": 3,
      "familyHistoryCode": "DM",
      "familyHistoryName": "DM",
      "status": "y"
    },
    {
      "id": 4,
      "familyHistoryCode": "EPIL",
      "familyHistoryName": "Epilepsy",
      "status": "y"
    },
    {
      "id": 5,
      "familyHistoryCode": "HTN",
      "familyHistoryName": "Hypertension",
      "status": "y"
    },
    {
      "id": 6,
      "familyHistoryCode": "ASTH",
      "familyHistoryName": "Asthma",
      "status": "y"
    },
    {
      "id": 7,
      "familyHistoryCode": "CANC",
      "familyHistoryName": "Cancer",
      "status": "y"
    },
    {
      "id": 8,
      "familyHistoryCode": "HD",
      "familyHistoryName": "Heart Disease",
      "status": "y"
    },
    {
      "id": 9,
      "familyHistoryCode": "STRO",
      "familyHistoryName": "Stroke",
      "status": "y"
    },
    {
      "id": 10,
      "familyHistoryCode": "ALZ",
      "familyHistoryName": "Alzheimer's",
      "status": "y"
    },
    {
      "id": 11,
      "familyHistoryCode": "MIG",
      "familyHistoryName": "Migraine",
      "status": "y"
    },
    {
      "id": 12,
      "familyHistoryCode": "THYR",
      "familyHistoryName": "Thyroid",
      "status": "y"
    },
    {
      "id": 13,
      "familyHistoryCode": "ARTHR",
      "familyHistoryName": "Rheumatoid Arthritis",
      "status": "y"
    },
    {
      "id": 14,
      "familyHistoryCode": "GOU",
      "familyHistoryName": "Gout",
      "status": "y"
    },
    {
      "id": 15,
      "familyHistoryCode": "ANX",
      "familyHistoryName": "Anxiety Disorder",
      "status": "y"
    },
    {
      "id": 16,
      "familyHistoryCode": "DEP",
      "familyHistoryName": "Depression",
      "status": "y"
    },
    {
      "id": 17,
      "familyHistoryCode": "BIP",
      "familyHistoryName": "Bipolar Disorder",
      "status": "y"
    },
    {
      "id": 18,
      "familyHistoryCode": "SCH",
      "familyHistoryName": "Schizophrenia",
      "status": "y"
    },
    {
      "id": 19,
      "familyHistoryCode": "OCD",
      "familyHistoryName": "OCD",
      "status": "y"
    },
    {
      "id": 20,
      "familyHistoryCode": "PTSD",
      "familyHistoryName": "PTSD",
      "status": "y"
    }
  ]);

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, familyHistoryId: null, newStatus: false });
  const [formData, setFormData] = useState({
    familyHistoryCode: "",
    familyHistoryName: "",
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingFamilyHistory, setEditingFamilyHistory] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");
  const itemsPerPage = 5;

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const filteredFamilyHistoryData = familyHistoryData.filter(familyHistory =>
    familyHistory.familyHistoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    familyHistory.familyHistoryCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (familyHistory) => {
    setEditingFamilyHistory(familyHistory);
    setShowForm(true);
    setFormData({
      familyHistoryCode: familyHistory.familyHistoryCode,
      familyHistoryName: familyHistory.familyHistoryName,
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const formElement = e.target;
    const updatedFamilyHistoryName = formElement.familyHistoryName.value;
    const updatedFamilyHistoryCode = formElement.familyHistoryCode.value;

    if (editingFamilyHistory) {
      setFamilyHistoryData(familyHistoryData.map(familyHistory =>
        familyHistory.id === editingFamilyHistory.id
          ? { ...familyHistory, familyHistoryName: updatedFamilyHistoryName, familyHistoryCode: updatedFamilyHistoryCode }
          : familyHistory
      ));
      showPopup("Family history updated successfully!", "success");
    } else {
      const newFamilyHistory = {
        id: familyHistoryData.length + 1,
        familyHistoryCode: updatedFamilyHistoryCode,
        familyHistoryName: updatedFamilyHistoryName,
        status: "y"
      };
      setFamilyHistoryData([...familyHistoryData, newFamilyHistory]);
      showPopup("Family history added successfully!", "success");
    }

    setEditingFamilyHistory(null);
    setShowForm(false);
    setFormData({ familyHistoryCode: "", familyHistoryName: "" });
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
    setConfirmDialog({ isOpen: true, familyHistoryId: id, newStatus });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed && confirmDialog.familyHistoryId !== null) {
      setFamilyHistoryData((prevData) =>
        prevData.map((familyHistory) =>
          familyHistory.id === confirmDialog.familyHistoryId ? { ...familyHistory, status: confirmDialog.newStatus } : familyHistory
        )
      );
      showPopup(`Family history ${confirmDialog.newStatus === "y" ? 'activated' : 'deactivated'} successfully!`, "success");
    }
    setConfirmDialog({ isOpen: false, familyHistoryId: null, newStatus: null });
  };

  const currentItems = filteredFamilyHistoryData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageNavigation = () => {
    const pageNumber = parseInt(pageInput, 10);
    if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
      setCurrentPage(pageNumber);
    } else {
      showPopup("Please enter a valid page number.", "error");
    }
  };

  const filteredTotalPages = Math.ceil(filteredFamilyHistoryData.length / itemsPerPage);

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

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const updatedFormData = { ...formData, [id]: value };
    setFormData(updatedFormData);
    setIsFormValid(updatedFormData.familyHistoryCode.trim() !== "" && updatedFormData.familyHistoryName.trim() !== "");
  };

  const handleCreateFormSubmit = (e) => {
    e.preventDefault();
    if (formData.familyHistoryCode && formData.familyHistoryName) {
      const newFamilyHistory = {
        id: familyHistoryData.length + 1,
        familyHistoryCode: formData.familyHistoryCode,
        familyHistoryName: formData.familyHistoryName,
        status: "y"
      };
      setFamilyHistoryData([...familyHistoryData, newFamilyHistory]);
      setFormData({ familyHistoryCode: "", familyHistoryName: "" });
      setShowForm(false);
      showPopup("Family history added successfully!", "success");
    } else {
      showPopup("Please fill out all required fields.", "error");
    }
  };

  const handleReset = () => {
    setFormData({ familyHistoryCode: "", familyHistoryName: "" });
    setEditingFamilyHistory(null);
    setIsFormValid(false);
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">FAMILY HISTORY MASTER</h4>
              <div className="d-flex justify-content-between align-items-center">
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
                <div className="d-flex align-items-center">
                  {!showForm ? (
                    <>
                      <button type="button" className="btn btn-success me-2">
                        <i className="mdi mdi-plus"></i> SEARCH GENERATE REPORT
                      </button>
                      <button type="button" className="btn btn-success me-2" onClick={() => {
                        setShowForm(true);
                        setEditingFamilyHistory(null);
                        setFormData({ familyHistoryCode: "", familyHistoryName: "" });
                      }}>
                        <i className="mdi mdi-plus"></i> ADD
                      </button>
                    </>
                  ) : (
                    <button type="button" className="btn btn-secondary" onClick={() => {
                      setShowForm(false);
                      handleReset();
                    }}>
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
                        <th>Family History Code</th>
                        <th>Family History Name</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((familyHistory) => (
                        <tr key={familyHistory.id}>
                          <td>{familyHistory.familyHistoryCode}</td>
                          <td>{familyHistory.familyHistoryName}</td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={familyHistory.status === "y"}
                                onChange={() => handleSwitchChange(familyHistory.id, familyHistory.status === "y" ? "n" : "y")}
                                id={`switch-${familyHistory.id}`}
                              />
                              <label
                                className="form-check-label px-0"
                                htmlFor={`switch-${familyHistory.id}`}
                                onClick={() => handleSwitchChange(familyHistory.id, familyHistory.status === "y" ? "n" : "y")}
                              >
                                {familyHistory.status === "y" ? 'Active' : 'Inactive'}
                              </label>
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleEdit(familyHistory)}
                              disabled={familyHistory.status !== "y"}
                            >
                              <i className="fa fa-pencil"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <nav className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                      <span>
                        Page {currentPage} of {filteredTotalPages} | Total Records: {filteredFamilyHistoryData.length}
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
                </div>
              ) : (
                <form className="forms row" onSubmit={editingFamilyHistory ? handleSave : handleCreateFormSubmit}>
                  <div className="form-group col-md-4">
                    <label>Family History Code
                      <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      id="familyHistoryCode"
                      name="familyHistoryCode"
                      placeholder="Code"
                      value={formData.familyHistoryCode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group col-md-4">
                    <label>Family History Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      id="familyHistoryName"
                      name="familyHistoryName"
                      placeholder="Name"
                      value={formData.familyHistoryName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                    <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                      {editingFamilyHistory ? "UPDATE" : "ADD"}
                    </button>
                    <button type="button" className="btn btn-danger" onClick={handleReset}>
                      RESET
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
                <div className="modal d-block" tabIndex="-1" role="dialog">
                  <div className="modal-dialog" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button type="button" className="close" onClick={() => handleConfirm(false)}>
                          <span>&times;</span>
                        </button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{familyHistoryData.find(familyHistory => familyHistory.id === confirmDialog.familyHistoryId)?.familyHistoryName}</strong>?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>No</button>
                        <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>Yes</button>
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

export default FamilyHistoryMaster;