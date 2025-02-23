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

  const [bloodGroupData, setBloodGroupData] = useState([
    { id: 1, bloodGroupName: "O+", status: "y" },
    { id: 2, bloodGroupName: "B+", status: "y" },
    { id: 3, bloodGroupName: "A+", status: "y" },
    { id: 4, bloodGroupName: "AB+", status: "y" },
    { id: 5, bloodGroupName: "O-", status: "y" },
  ]);

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, bloodGroupId: null, newStatus: false });
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredTotalPages, setFilteredTotalPages] = useState(1);
  const [totalFilteredProducts, setTotalFilteredProducts] = useState(0);

  const filteredBloodGroups = bloodGroupData.filter(bloodGroup =>
    bloodGroup.bloodGroupName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleEdit = (bloodGroup) => { 
    setEditingBloodGroup(bloodGroup);
    setShowForm(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
  
    const updatedBloodName = e.target.bloodGroupName.value;
  
    if (editingBloodGroup) {
      setBloodGroupData(bloodGroupData.map(bloodGroup =>
        bloodGroup.id === editingBloodGroup.id 
          ? { ...bloodGroup, bloodGroupName: updatedBloodName } 
          : bloodGroup
      ));
    } else {
      const newBloodGroup = {
        id: bloodGroupData.length + 1,
        bloodGroupName: updatedBloodName,
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

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Blood Group Master</h4>
              <div className="d-flex justify-content-between align-items-center">
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

                <div className="d-flex align-items-center">
                  {!showForm ? (
                    <>
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
                        <th>S.No</th>
                        <th>Blood Group</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBloodGroups.map((bloodGroup) => (
                        <tr key={bloodGroup.id}>
                          <td>{bloodGroup.id}</td>
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
                        Page {currentPage} of {filteredTotalPages} | Total Records: {totalFilteredProducts}
                      </span>
                    </div>
                    <ul className="pagination mb-0">
                      <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                        <button className="page-link" disabled>
                          &laquo;
                        </button>
                      </li>
                      {[...Array(filteredTotalPages)].map((_, index) => (
                        <li
                          className={`page-item ${currentPage === index + 1 ? "active" : ""}`}
                          key={index}
                        >
                          <button className="page-link" disabled>
                            {index + 1}
                          </button>
                        </li>
                      ))}
                      <li className={`page-item ${currentPage === filteredTotalPages ? "disabled" : ""}`}>
                        <button className="page-link" disabled>
                          &raquo;
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="form-group col-md-6">
                    <label>Blood Group Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      id="bloodGroupName"
                      name="bloodGroupName"
                      placeholder="e.g., O+"
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

