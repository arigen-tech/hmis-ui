import { useState } from "react";
import Popup from "../../../Components/popup";

const ProcedureTypeMaster = () => {
  const [procedureTypeData, setProcedureTypeData] = useState([
    {
      "id": 1,
      "procedureTypeName": "Basic Care",
      "description": "Basic nursing procedures and care",
      "status": "y"
    },
    {
      "id": 2,
      "procedureTypeName": "Advanced Care",
      "description": "Advanced medical procedures requiring specialized skills",
      "status": "y"
    },
    {
      "id": 3,
      "procedureTypeName": "Therapeutic",
      "description": "Therapeutic procedures for treatment and rehabilitation",
      "status": "y"
    },
    {
      "id": 4,
      "procedureTypeName": "Diagnostic",
      "description": "Procedures for diagnosis and assessment",
      "status": "y"
    },
    {
      "id": 5,
      "procedureTypeName": "Preventive",
      "description": "Preventive care and screening procedures",
      "status": "y"
    },
    {
      "id": 6,
      "procedureTypeName": "Emergency",
      "description": "Emergency and critical care procedures",
      "status": "y"
    },
    {
      "id": 7,
      "procedureTypeName": "Post-operative",
      "description": "Post-surgical care and monitoring",
      "status": "y"
    },
    {
      "id": 8,
      "procedureTypeName": "Palliative",
      "description": "Palliative and end-of-life care procedures",
      "status": "y"
    },
    {
      "id": 9,
      "procedureTypeName": "Rehabilitative",
      "description": "Rehabilitation and recovery procedures",
      "status": "y"
    },
    {
      "id": 10,
      "procedureTypeName": "Surgical",
      "description": "Surgical and operative procedures",
      "status": "y"
    },
    {
      "id": 11,
      "procedureTypeName": "Medical",
      "description": "General medical procedures",
      "status": "y"
    },
    {
      "id": 12,
      "procedureTypeName": "Nursing",
      "description": "Nursing-specific care procedures",
      "status": "y"
    },
    {
      "id": 13,
      "procedureTypeName": "Laboratory",
      "description": "Laboratory testing and sample collection",
      "status": "y"
    },
    {
      "id": 14,
      "procedureTypeName": "Radiology",
      "description": "Radiological and imaging procedures",
      "status": "y"
    },
    {
      "id": 15,
      "procedureTypeName": "Pharmacy",
      "description": "Medication-related procedures",
      "status": "y"
    },
    {
      "id": 16,
      "procedureTypeName": "Dental",
      "description": "Dental and oral care procedures",
      "status": "y"
    },
    {
      "id": 17,
      "procedureTypeName": "Pediatric",
      "description": "Child-specific medical procedures",
      "status": "y"
    },
    {
      "id": 18,
      "procedureTypeName": "Geriatric",
      "description": "Elderly care procedures",
      "status": "y"
    },
    {
      "id": 19,
      "procedureTypeName": "Obstetric",
      "description": "Pregnancy and childbirth procedures",
      "status": "y"
    },
    {
      "id": 20,
      "procedureTypeName": "Psychiatric",
      "description": "Mental health care procedures",
      "status": "y"
    }
  ]);

  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    procedureTypeId: null, 
    newStatus: false 
  });
  
  const [formData, setFormData] = useState({
    procedureTypeName: "",
    description: ""
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingProcedureType, setEditingProcedureType] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");
  const itemsPerPage = 5;

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const filteredProcedureTypeData = procedureTypeData.filter(procedureType =>
    procedureType.procedureTypeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    procedureType.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (procedureType) => {
    setEditingProcedureType(procedureType);
    setShowForm(true);
    setFormData({
      procedureTypeName: procedureType.procedureTypeName,
      description: procedureType.description
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const formElement = e.target;
    const updatedProcedureTypeName = formElement.procedureTypeName.value;
    const updatedDescription = formElement.description.value;

    if (editingProcedureType) {
      setProcedureTypeData(procedureTypeData.map(procedureType =>
        procedureType.id === editingProcedureType.id
          ? { 
              ...procedureType, 
              procedureTypeName: updatedProcedureTypeName,
              description: updatedDescription
            }
          : procedureType
      ));
      showPopup("Procedure type updated successfully!", "success");
    } else {
      const newProcedureType = {
        id: procedureTypeData.length + 1,
        procedureTypeName: updatedProcedureTypeName,
        description: updatedDescription,
        status: "y"
      };
      setProcedureTypeData([...procedureTypeData, newProcedureType]);
      showPopup("Procedure type added successfully!", "success");
    }

    setEditingProcedureType(null);
    setShowForm(false);
    setFormData({ 
      procedureTypeName: "", 
      description: "" 
    });
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
    setConfirmDialog({ isOpen: true, procedureTypeId: id, newStatus });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed && confirmDialog.procedureTypeId !== null) {
      setProcedureTypeData((prevData) =>
        prevData.map((procedureType) =>
          procedureType.id === confirmDialog.procedureTypeId ? { ...procedureType, status: confirmDialog.newStatus } : procedureType
        )
      );
      showPopup(`Procedure type ${confirmDialog.newStatus === "y" ? 'activated' : 'deactivated'} successfully!`, "success");
    }
    setConfirmDialog({ isOpen: false, procedureTypeId: null, newStatus: null });
  };

  const handleActivate = () => {
    if (editingProcedureType) {
      setProcedureTypeData(procedureTypeData.map(procedureType =>
        procedureType.id === editingProcedureType.id
          ? { ...procedureType, status: "y" }
          : procedureType
      ));
      setEditingProcedureType(null);
      setShowForm(false);
      setFormData({ 
        procedureTypeName: "", 
        description: "" 
      });
      showPopup("Procedure type activated successfully!", "success");
    }
  };

  const currentItems = filteredProcedureTypeData.slice(
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

  const filteredTotalPages = Math.ceil(filteredProcedureTypeData.length / itemsPerPage);

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
    
    // Validate form
    const isValid = updatedFormData.procedureTypeName.trim() !== "" && 
                    updatedFormData.description.trim() !== "";
    setIsFormValid(isValid);
  };

  const handleCreateFormSubmit = (e) => {
    e.preventDefault();
    if (formData.procedureTypeName && formData.description) {
      const newProcedureType = {
        id: procedureTypeData.length + 1,
        procedureTypeName: formData.procedureTypeName,
        description: formData.description,
        status: "y"
      };
      setProcedureTypeData([...procedureTypeData, newProcedureType]);
      setFormData({ 
        procedureTypeName: "", 
        description: "" 
      });
      setShowForm(false);
      showPopup("Procedure type added successfully!", "success");
    } else {
      showPopup("Please fill out all required fields.", "error");
    }
  };

  const handleReset = () => {
    setFormData({ 
      procedureTypeName: "", 
      description: "" 
    });
    setEditingProcedureType(null);
    setIsFormValid(false);
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">PROCEDURE TYPE MASTER</h4>
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
                        <i className="mdi mdi-file-document-outline"></i> GENERATE REPORT
                      </button>
                      <button type="button" className="btn btn-success me-2" onClick={() => {
                        setShowForm(true);
                        setEditingProcedureType(null);
                        setFormData({ 
                          procedureTypeName: "", 
                          description: "" 
                        });
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
                        <th>Procedure Type Name</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((procedureType) => (
                        <tr key={procedureType.id}>
                          <td>{procedureType.procedureTypeName}</td>
                          <td>{procedureType.description}</td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={procedureType.status === "y"}
                                onChange={() => handleSwitchChange(procedureType.id, procedureType.status === "y" ? "n" : "y")}
                                id={`switch-${procedureType.id}`}
                              />
                              <label
                                className="form-check-label px-0"
                                htmlFor={`switch-${procedureType.id}`}
                                onClick={() => handleSwitchChange(procedureType.id, procedureType.status === "y" ? "n" : "y")}
                              >
                                {procedureType.status === "y" ? 'Active' : 'Inactive'}
                              </label>
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleEdit(procedureType)}
                              disabled={procedureType.status !== "y"}
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
                        Page {currentPage} of {filteredTotalPages} | Total Records: {filteredProcedureTypeData.length}
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
                <form className="forms row" onSubmit={editingProcedureType ? handleSave : handleCreateFormSubmit}>
                  <div className="form-group col-md-4">
                    <label>Procedure Type Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      id="procedureTypeName"
                      name="procedureTypeName"
                      placeholder="Enter procedure type name"
                      value={formData.procedureTypeName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group col-md-4">
                    <label>Description <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      id="description"
                      name="description"
                      placeholder="Enter description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                    <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                      {editingProcedureType ? "UPDATE" : "ADD"}
                    </button>
                    {editingProcedureType && editingProcedureType.status === "n" && (
                      <button 
                        type="button" 
                        className="btn btn-success me-2" 
                        onClick={handleActivate}
                      >
                        ACTIVATE
                      </button>
                    )}
                    <button type="button" className="btn btn-danger me-2" onClick={handleReset}>
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
                          Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{procedureTypeData.find(procedureType => procedureType.id === confirmDialog.procedureTypeId)?.procedureTypeName}</strong>?
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

export default ProcedureTypeMaster;