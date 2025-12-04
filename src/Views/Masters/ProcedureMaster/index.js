import { useState } from "react";
import Popup from "../../../Components/popup";

const ProcedureMaster = () => {
  // Department options where dept type is OPD
  const departmentOptions = [
    { id: 1, name: "General Medicine", deptType: "OPD" },
    { id: 2, name: "Pediatrics", deptType: "OPD" },
    { id: 3, name: "Orthopedics", deptType: "OPD" },
    { id: 4, name: "Cardiology", deptType: "IPD" },
    { id: 5, name: "Neurology", deptType: "OPD" },
    { id: 6, name: "Dermatology", deptType: "OPD" },
    { id: 7, name: "ENT", deptType: "OPD" },
    { id: 8, name: "Ophthalmology", deptType: "OPD" },
    { id: 9, name: "Gynecology", deptType: "OPD" },
    { id: 10, name: "Urology", deptType: "OPD" }
  ];

  // MAS Procedure Type options
  const masProcedureTypeOptions = [
    { id: 1, name: "Basic Care" },
    { id: 2, name: "Advanced Care" },
    { id: 3, name: "Therapeutic" },
    { id: 4, name: "Diagnostic" },
    { id: 5, name: "Preventive" },
    { id: 6, name: "Emergency" },
    { id: 7, name: "Post-operative" },
    { id: 8, name: "Palliative" }
  ];

  const [procedureData, setProcedureData] = useState([
    {
      "id": 1,
      "procedureCode": "Back",
      "procedureName": "Back Care",
      "department": "General Medicine",
      "masProcedureType": "Basic Care",
      "status": "y"
    },
    {
      "id": 2,
      "procedureCode": "Stam",
      "procedureName": "Steam Inhalation",
      "department": "Pediatrics",
      "masProcedureType": "Therapeutic",
      "status": "y"
    },
    {
      "id": 3,
      "procedureCode": "FC",
      "procedureName": "Foot Care",
      "department": "General Medicine",
      "masProcedureType": "Basic Care",
      "status": "y"
    },
    {
      "id": 4,
      "procedureCode": "No",
      "procedureName": "Nebulization",
      "department": "Pediatrics",
      "masProcedureType": "Therapeutic",
      "status": "y"
    },
    {
      "id": 5,
      "procedureCode": "Ene",
      "procedureName": "Enema",
      "department": "General Medicine",
      "masProcedureType": "Basic Care",
      "status": "y"
    },
    {
      "id": 6,
      "procedureCode": "WC",
      "procedureName": "Wound Care",
      "department": "Orthopedics",
      "masProcedureType": "Advanced Care",
      "status": "y"
    },
    {
      "id": 7,
      "procedureCode": "CPR",
      "procedureName": "Cardiopulmonary Resuscitation",
      "department": "Cardiology",
      "masProcedureType": "Emergency",
      "status": "y"
    },
    {
      "id": 8,
      "procedureCode": "IVT",
      "procedureName": "IV Therapy",
      "department": "General Medicine",
      "masProcedureType": "Advanced Care",
      "status": "y"
    },
    {
      "id": 9,
      "procedureCode": "DSG",
      "procedureName": "Dressing Change",
      "department": "Orthopedics",
      "masProcedureType": "Basic Care",
      "status": "y"
    },
    {
      "id": 10,
      "procedureCode": "MON",
      "procedureName": "Vital Signs Monitoring",
      "department": "General Medicine",
      "masProcedureType": "Diagnostic",
      "status": "y"
    }
  ]);

  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    procedureId: null, 
    newStatus: false 
  });
  
  const [formData, setFormData] = useState({
    procedureCode: "",
    procedureName: "",
    department: "",
    masProcedureType: "",
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");
  const itemsPerPage = 5;

  // Filter OPD departments only
  const opdDepartments = departmentOptions.filter(dept => dept.deptType === "OPD");

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const filteredProcedureData = procedureData.filter(procedure =>
    procedure.procedureName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    procedure.procedureCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    procedure.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    procedure.masProcedureType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (procedure) => {
    setEditingProcedure(procedure);
    setShowForm(true);
    setFormData({
      procedureCode: procedure.procedureCode,
      procedureName: procedure.procedureName,
      department: procedure.department,
      masProcedureType: procedure.masProcedureType,
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const formElement = e.target;
    const updatedProcedureCode = formElement.procedureCode.value;
    const updatedProcedureName = formElement.procedureName.value;
    const updatedDepartment = formElement.department.value;
    const updatedMasProcedureType = formElement.masProcedureType.value;

    if (editingProcedure) {
      setProcedureData(procedureData.map(procedure =>
        procedure.id === editingProcedure.id
          ? { 
              ...procedure, 
              procedureCode: updatedProcedureCode,
              procedureName: updatedProcedureName,
              department: updatedDepartment,
              masProcedureType: updatedMasProcedureType,
            }
          : procedure
      ));
      showPopup("Procedure updated successfully!", "success");
    } else {
      const newProcedure = {
        id: procedureData.length + 1,
        procedureCode: updatedProcedureCode,
        procedureName: updatedProcedureName,
        department: updatedDepartment,
        masProcedureType: updatedMasProcedureType,
        status: "y"
      };
      setProcedureData([...procedureData, newProcedure]);
      showPopup("Procedure added successfully!", "success");
    }

    setEditingProcedure(null);
    setShowForm(false);
    setFormData({ 
      procedureCode: "", 
      procedureName: "", 
      department: "", 
      masProcedureType: "", 
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
    setConfirmDialog({ isOpen: true, procedureId: id, newStatus });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed && confirmDialog.procedureId !== null) {
      setProcedureData((prevData) =>
        prevData.map((procedure) =>
          procedure.id === confirmDialog.procedureId ? { ...procedure, status: confirmDialog.newStatus } : procedure
        )
      );
      showPopup(`Procedure ${confirmDialog.newStatus === "y" ? 'activated' : 'deactivated'} successfully!`, "success");
    }
    setConfirmDialog({ isOpen: false, procedureId: null, newStatus: null });
  };

  const handleActivate = () => {
    if (editingProcedure) {
      setProcedureData(procedureData.map(procedure =>
        procedure.id === editingProcedure.id
          ? { ...procedure, status: "y" }
          : procedure
      ));
      setEditingProcedure(null);
      setShowForm(false);
      setFormData({ 
        procedureCode: "", 
        procedureName: "", 
        department: "", 
        masProcedureType: "", 
      });
      showPopup("Procedure activated successfully!", "success");
    }
  };

  const currentItems = filteredProcedureData.slice(
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

  const filteredTotalPages = Math.ceil(filteredProcedureData.length / itemsPerPage);

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
    const isValid = updatedFormData.procedureCode.trim() !== "" && 
                    updatedFormData.procedureName.trim() !== "" && 
                    updatedFormData.department.trim() !== "" && 
                    updatedFormData.masProcedureType.trim() !== "";
    setIsFormValid(isValid);
  };

  const handleCreateFormSubmit = (e) => {
    e.preventDefault();
    if (formData.procedureCode && formData.procedureName && formData.department && formData.masProcedureType) {
      const newProcedure = {
        id: procedureData.length + 1,
        procedureCode: formData.procedureCode,
        procedureName: formData.procedureName,
        department: formData.department,
        masProcedureType: formData.masProcedureType,
        status: "y"
      };
      setProcedureData([...procedureData, newProcedure]);
      setFormData({ 
        procedureCode: "", 
        procedureName: "", 
        department: "", 
        masProcedureType: "", 
      });
      setShowForm(false);
      showPopup("Procedure added successfully!", "success");
    } else {
      showPopup("Please fill out all required fields.", "error");
    }
  };

  const handleReset = () => {
    setFormData({ 
      procedureCode: "", 
      procedureName: "", 
      department: "", 
      masProcedureType: "", 
    });
    setEditingProcedure(null);
    setIsFormValid(false);
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">PROCEDURE CARE MASTER</h4>
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
                        setEditingProcedure(null);
                        setFormData({ 
                          procedureCode: "", 
                          procedureName: "", 
                          department: "", 
                          masProcedureType: "", 
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
                        <th>Procedure Care Code</th>
                        <th>Procedure Care Name</th>
                        <th>Department</th>
                        <th> Procedure Type</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((procedure) => (
                        <tr key={procedure.id}>
                          <td>{procedure.procedureCode}</td>
                          <td>{procedure.procedureName}</td>
                          <td>{procedure.department}</td>
                          <td>{procedure.masProcedureType}</td>

                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={procedure.status === "y"}
                                onChange={() => handleSwitchChange(procedure.id, procedure.status === "y" ? "n" : "y")}
                                id={`switch-${procedure.id}`}
                              />
                              <label
                                className="form-check-label px-0"
                                htmlFor={`switch-${procedure.id}`}
                                onClick={() => handleSwitchChange(procedure.id, procedure.status === "y" ? "n" : "y")}
                              >
                                {procedure.status === "y" ? 'Active' : 'Inactive'}
                              </label>
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleEdit(procedure)}
                              disabled={procedure.status !== "y"}
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
                        Page {currentPage} of {filteredTotalPages} | Total Records: {filteredProcedureData.length}
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
                <form className="forms row " onSubmit={editingProcedure ? handleSave : handleCreateFormSubmit}>
                  <div className="form-group col-md-4 ">
                    <label>Procedure Code <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      id="procedureCode"
                      name="procedureCode"
                      placeholder="Enter procedure code"
                      value={formData.procedureCode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group col-md-4">
                    <label>Procedure Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      id="procedureName"
                      name="procedureName"
                      placeholder="Enter procedure name"
                      value={formData.procedureName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group col-md-4">
                    <label>Department <span className="text-danger">*</span></label>
                    <select
                      className="form-control"
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Department</option>
                      {opdDepartments.map(dept => (
                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group col-md-4 mt-2">
                    <label> Procedure Type <span className="text-danger">*</span></label>
                    <select
                      className="form-control"
                      id="masProcedureType"
                      name="masProcedureType"
                      value={formData.masProcedureType}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select MAS Procedure Type</option>
                      {masProcedureTypeOptions.map(type => (
                        <option key={type.id} value={type.name}>{type.name}</option>
                      ))}
                    </select>
                  </div>

                 

                  <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                    <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                      {editingProcedure ? "UPDATE" : "ADD"}
                    </button>
                    {editingProcedure && editingProcedure.status === "n" && (
                      <button 
                        type="button" 
                        className="btn btn-success me-2" 
                        onClick={handleActivate}
                      >
                        ACTIVATE
                      </button>
                    )}
                    <button type="button" className="btn btn-danger me-2">
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
                          Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{procedureData.find(procedure => procedure.id === confirmDialog.procedureId)?.procedureName}</strong>?
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

export default ProcedureMaster;