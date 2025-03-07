import { useState, useEffect } from "react"
import Popup from "../../../Components/popup";

const BloodGroupMaster = () => {
  const [formData, setFormData] = useState({
    bloodGroupName: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBloodGroup, setEditingBloodGroup] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageInput, setPageInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [bloodGroupData, setBloodGroupData] = useState([
    { id: 1, bloodGroupName: "O+", bloodGroupCode: "BG001", status: "y" },
    { id: 2, bloodGroupName: "B+", bloodGroupCode: "BG002", status: "y" },
    { id: 4, bloodGroupName: "A+", bloodGroupCode: "BG003", status: "y" },
    { id: 5, bloodGroupName: "A+", bloodGroupCode: "BG004", status: "y" },
    { id: 6, bloodGroupName: "A+", bloodGroupCode: "BG005", status: "y" },
    { id: 7, bloodGroupName: "A+", bloodGroupCode: "BG006", status: "y" },
    { id: 8, bloodGroupName: "A+", bloodGroupCode: "BG007", status: "y" },
    { id: 9, bloodGroupName: "A+", bloodGroupCode: "BG008", status: "y" },
    { id: 10, bloodGroupName: "A+", bloodGroupCode: "BG009", status: "y" },
    { id: 11, bloodGroupName: "A+", bloodGroupCode: "BG010", status: "y" },
    { id: 12, bloodGroupName: "A+", bloodGroupCode: "BG011", status: "y" },
    { id: 13, bloodGroupName: "A+", bloodGroupCode: "BG012", status: "y" },
    { id: 14, bloodGroupName: "A+", bloodGroupCode: "BG013", status: "y" },
    { id: 15, bloodGroupName: "A+", bloodGroupCode: "BG014", status: "y" },
    { id: 16, bloodGroupName: "A+", bloodGroupCode: "BG015", status: "y" },
    { id: 17, bloodGroupName: "A+", bloodGroupCode: "BG016", status: "y" },
    { id: 18, bloodGroupName: "A+", bloodGroupCode: "BG017", status: "y" },
    { id: 19, bloodGroupName: "A+", bloodGroupCode: "BG018", status: "y" },
    { id: 20, bloodGroupName: "A+", bloodGroupCode: "BG019", status: "y" },
    { id: 21, bloodGroupName: "A+", bloodGroupCode: "BG020", status: "y" },
    { id: 22, bloodGroupName: "A+", bloodGroupCode: "BG021", status: "y" },
  ]);

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, bloodGroupId: null, newStatus: false });
  const [totalFilteredProducts, setTotalFilteredProducts] = useState(0);

  const filteredBloodGroups = bloodGroupData.filter(bloodGroup =>
    bloodGroup.bloodGroupName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleEdit = (bloodGroup) => {
    setEditingBloodGroup(bloodGroup);
    setShowForm(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    // Get form data directly from the form elements
    const formData = e.target.elements;
    const updatedBloodName = formData.bloodGroupName.value;
    const updatedBloodCode = formData.bloodGroupCode.value;

    if (editingBloodGroup) {
      setBloodGroupData(bloodGroupData.map(bloodGroup =>
        bloodGroup.id === editingBloodGroup.id
          ? { ...bloodGroup, bloodGroupName: updatedBloodName, bloodGroupCode: updatedBloodCode }
          : bloodGroup
      ));
    } else {
      const newBloodGroup = {
        id: bloodGroupData.length + 1,
        bloodGroupName: updatedBloodName,
        bloodGroupCode: updatedBloodCode,
        status: "y"
      };
      setBloodGroupData([...bloodGroupData, newBloodGroup]);
    }

    setEditingBloodGroup(null);
    setShowForm(false);
    showPopup("Changes saved successfully!", "success");
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

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData((prevData) => ({ ...prevData, [id]: value }))
  }

  const handleCreateFormSubmit = (e) => {
    e.preventDefault()
    if (formData.bloodGroupName) {
      setBloodGroupData([...bloodGroupData, { ...formData, id: Date.now(), status: "y" }])
      setFormData({ bloodGroupName: "" })
      setShowForm(false)
    } else {
      alert("Please fill out all required fields.")
    }
  }

  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, bloodGroupId: id, newStatus });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed && confirmDialog.bloodGroupId !== null) {
      setBloodGroupData((prevData) =>
        prevData.map((bloodGroup) =>
          bloodGroup.id === confirmDialog.bloodGroupId ? { ...bloodGroup, status: confirmDialog.newStatus } : bloodGroup
        )
      );
    }
    setConfirmDialog({ isOpen: false, bloodGroupId: null, newStatus: null });
  };

  const filteredTotalPages = Math.ceil(filteredBloodGroups.length / itemsPerPage);

  const currentItems = filteredBloodGroups.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageNavigation = () => {
    const pageNumber = parseInt(pageInput, 10);
    if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
      setCurrentPage(pageNumber);
    } else {
      alert("Please enter a valid page number.");
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
              <h4 className="card-title">Blood Group Master</h4>
              <div className="d-flex justify-content-between align-items-center">

                {!showForm ? (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search Blood Groups"
                        aria-label="Search"
                        value={searchQuery}
                        onChange={handleSearch}

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
                      <button type="button" className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                        <i className="mdi mdi-plus"></i> Add
                      </button>
                      <button type="button" className="btn btn-success me-2">
                        <i className="mdi mdi-plus"></i> Show All
                      </button>
                      <button type="button" className="btn btn-success me-2" onClick={() => setShowModal(true)}>
                        <i className="mdi mdi-plus"></i> Reports
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
                        <th>Blood Code</th>
                        <th>Blood Name</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((bloodGroup) => (
                        <tr key={bloodGroup.id}>
                          <td>{bloodGroup.bloodGroupCode}</td>
                          <td>{bloodGroup.bloodGroupName}</td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={bloodGroup.status === "y"}
                                onChange={() => handleSwitchChange(bloodGroup.id, bloodGroup.status === "y" ? "n" : "y")}
                                id={`switch-${bloodGroup.id}`}
                              />
                              <label
                                className="form-check-label px-0"
                                htmlFor={`switch-${bloodGroup.id}`}
                              >
                                {bloodGroup.status === "y" ? 'Active' : 'Deactive'}
                              </label>
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleEdit(bloodGroup)}
                              disabled={bloodGroup.status !== "y"}
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
                        Page {currentPage} of {filteredTotalPages} | Total Records: {filteredBloodGroups.length}
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
                <form className="forms row" onSubmit={handleSave}>
                  <div className="form-group col-md-6">
                    <label>Blood Group Code <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      id="bloodGroupCode"
                      name="bloodGroupCode"
                      placeholder="e.g., O+"
                      defaultValue={editingBloodGroup ? editingBloodGroup.bloodGroupCode : ""}
                      onChange={() => setIsFormValid(true)}
                      required
                    />
                  </div>
                  <div className="form-group col-md-4">
                    <label>Blood Group Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      id="bloodGroupName"
                      placeholder="Blood Group Name"
                      defaultValue={editingBloodGroup ? editingBloodGroup.bloodGroupName : ""}
                      onChange={() => setIsFormValid(true)}
                      required
                    />
                  </div>
                  <div className="form-group col-md-12 d-flex justify-content-end">
                    <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                      Save
                    </button>
                    <button type="button" className="btn btn-danger" onClick={() => setShowForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
              {showModal && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h1 className="modal-title fs-5" id="staticBackdropLabel">Modal title</h1>
                        <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                      </div>
                      <div className="modal-body">
                        {/* Your modal content goes here */}
                        ...
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                        <button type="button" className="btn btn-primary">Understood</button>
                      </div>
                    </div>
                  </div>
                </div>
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
                          Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{bloodGroupData.find(bloodGroup => bloodGroup.id === confirmDialog.bloodGroupId)?.bloodGroupName}</strong>?
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
  )
}

export default BloodGroupMaster;

