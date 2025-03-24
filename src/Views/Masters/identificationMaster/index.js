import { useState } from "react"
import Popup from "../../../Components/popup";


const Identificationmaster = () => {

  const [identificationData, setidentificationData] = useState([
    {
        "id": 1,
        "identificationCode": "ID001",
        "identificationName": "Linda",
        "status": "y"
    },
    {
        "id": 2,
        "identificationCode": "ID002",
        "identificationName": "Jimmy",
        "status": "y"
    },
    {
        "id": 3,
        "identificationCode": "ID003",
        "identificationName": "Samantha",
        "status": "y"
    },
    {
        "id": 4,
        "identificationCode": "ID004",
        "identificationName": "Michael",
        "status": "y"
    },
    {
        "id": 5,
        "identificationCode": "ID005",
        "identificationName": "Jessica",
        "status": "y"
    },
    {
        "id": 6,
        "identificationCode": "ID006",
        "identificationName": "David",
        "status": "y"
    },
    {
        "id": 7,
        "identificationCode": "ID007",
        "identificationName": "Emily",
        "status": "y"
    },
    {
        "id": 8,
        "identificationCode": "ID008",
        "identificationName": "Daniel",
        "status": "y"
    },
    {
        "id": 9,
        "identificationCode": "ID009",
        "identificationName": "Sophia",
        "status": "y"
    },
    {
        "id": 10,
        "identificationCode": "ID010",
        "identificationName": "James",
        "status": "y"
    },
    {
        "id": 11,
        "identificationCode": "ID011",
        "identificationName": "Olivia",
        "status": "y"
    },
    {
        "id": 12,
        "identificationCode": "ID012",
        "identificationName": "William",
        "status": "y"
    },
    {
        "id": 13,
        "identificationCode": "ID013",
        "identificationName": "Ava",
        "status": "y"
    },
    {
        "id": 14,
        "identificationCode": "ID014",
        "identificationName": "Ethan",
        "status": "y"
    },
    {
        "id": 15,
        "identificationCode": "ID015",
        "identificationName": "Mia",
        "status": "y"
    },
    {
        "id": 16,
        "identificationCode": "ID016",
        "identificationName": "Alexander",
        "status": "y"
    },
    {
        "id": 17,
        "identificationCode": "ID017",
        "identificationName": "Isabella",
        "status": "y"
    },
    {
        "id": 18,
        "identificationCode": "ID018",
        "identificationName": "Lucas",
        "status": "y"
    },
    {
        "id": 19,
        "identificationCode": "ID019",
        "identificationName": "Charlotte",
        "status": "y"
    },
    {
        "id": 20,
        "identificationCode": "ID020",
        "identificationName": "Henry",
        "status": "y"
    }
]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, mealPlanId: null, newStatus: false });

  const [formData, setFormData] = useState({
    identificationCode: "",
    identificationName: "",
  })
  const [searchQuery, setSearchQuery] = useState("");
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const filteredidentificationData = identificationData.filter(identification =>
    identification.identificationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    identification.identificationCode.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const handleEdit = (identification) => {
    setEditingidentification(identification);
    setShowForm(true);
  };



  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const formElement = e.target;
    const updatedidentificationName = formElement.identificationName.value;
    const updatedidentificationCode = formElement.identificationCode.value;

    if (editingidentification) {
      setidentificationData(identificationData.map(identification =>
        identification.id === editingidentification.id
          ? { ...identification, identificationName: updatedidentificationName, identificationCode: updatedidentificationCode }
          : identification
      ));
    } else {
      const newidentification = {
        id: identificationData.length + 1,
        identificationCode: updatedidentificationCode,
        identificationName: updatedidentificationName,
        status: "y"
      };
      setidentificationData([...identificationData, newidentification]);
    }

    setEditingidentification(null);
    setShowForm(false);
    showPopup("Changes saved successfully!", "success");
  };
  const [showForm, setShowForm] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingidentification, setEditingidentification] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);

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
    setConfirmDialog({ isOpen: true, identificationId: id, newStatus });

  };
  const handleConfirm = (confirmed) => {
    if (confirmed && confirmDialog.identificationId !== null) {
      setidentificationData((prevData) =>
        prevData.map((identification) =>
          identification.id === confirmDialog.identificationId ? { ...identification, status: confirmDialog.newStatus } : identification
        )
      );
    }
    setConfirmDialog({ isOpen: false, identificationId: null, newStatus: null }); 
  };
  const [currentPage, setCurrentPage] = useState(1); 
  const [totalFilteredProducts, setTotalFilteredProducts] = useState(0);
  const [pageInput, setPageInput] = useState("");
  const itemsPerPage = 5;

  const currentItems = filteredidentificationData.slice(
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

  const filteredTotalPages = Math.ceil(filteredidentificationData.length / itemsPerPage);


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
    const { id, value } = e.target
    setFormData((prevData) => ({ ...prevData, [id]: value }))
  }

  const handleCreateFormSubmit = (e) => {
    e.preventDefault();
    if (formData.identificationCode && formData.identificationName) {
      setidentificationData([...identificationData, { ...formData, id: Date.now(), status: "y" }]);
      setFormData({ identificationCode: "", identificationName: "" });
      setShowForm(false);
    } else {
      alert("Please fill out all required fields.");
    }
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Identification Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm && <form className="d-inline-block searchform me-4" role="search">
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
                }
                <div className="d-flex align-items-center">
                  {!showForm ? (
                    <>
                      <button type="button" className="btn btn-success me-2">
                        <i className="mdi mdi-plus"></i> Show All
                      </button>
                      <button type="button" className="btn btn-success me-2" onClick={() => {
                        setShowForm(true);
                        setEditingidentification(null);
                        setFormData({ identificationCode: "", identificationName: "" });
                      }}>
                        <i className="mdi mdi-plus"></i> ADD
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
                        <th>Identification Code</th>
                        <th>Identification Name</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((identification) => (
                        <tr key={identification.id}>
                          <td>{identification.identificationCode}</td>
                          <td>{identification.identificationName}</td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={identification.status === "y"}
                                onChange={() => handleSwitchChange(identification.id, identification.status === "y" ? "n" : "y")}
                                id={`switch-${identification.id}`}
                              />
                              <label
                                className="form-check-label px-0"
                                htmlFor={`switch-${identification.id}`}
                                onClick={() => handleSwitchChange(identification.id, identification.status === "y" ? "n" : "y")}
                              >
                                {identification.status === "y" ? 'Active' : 'Deactivated'}
                              </label>
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleEdit(identification)}
                              disabled={identification.status !== "y"}
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
                        Page {currentPage} of {filteredTotalPages} | Total Records: {filteredidentificationData.length}
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
                  <div className="form-group col-md-4">
                    <label>Identification Code
                      <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      id="identificationCode"
                      name="identificationCode"
                      placeholder="Code"
                      defaultValue={editingidentification ? editingidentification.identificationCode : ""}
                      onChange={(e) => setIsFormValid(e.target.value.trim() !== "")}
                      required
                    />
                  </div>

                  <div className="form-group col-md-4">
                    <label>Identification Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      id="identificationName"
                      name="identificationName"
                      placeholder="Name"
                      defaultValue={editingidentification ? editingidentification.identificationName : ""}
                      onChange={(e) => setIsFormValid(e.target.value.trim() !== "")}
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
              {showModal && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h1 className="modal-title fs-5" id="staticBackdropLabel">Modal title</h1>
                        <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                      </div>
                      <div className="modal-body">
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
                          Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{identificationData.find(identification => identification.id === confirmDialog.identificationId)?.identificationName}</strong>?
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

export default Identificationmaster





