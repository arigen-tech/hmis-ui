import { useState } from "react"
import Popup from "../../../Components/popup";


const Gendermaster = () => {

  const [genderData, setGenderData] = useState([
    { id: 1, genderCode: "M", genderName: "MALE", status: "y" },
    { id: 2, genderCode: "F", genderName: "FEMALE", status: "y" },
    { id: 3, genderCode: "O", genderName: "TRANSGENDER", status: "y" },
  ])
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, mealPlanId: null, newStatus: false });

  const [formData, setFormData] = useState({
    genderCode: "",
    genderName: "",
  })
  const [searchQuery, setSearchQuery] = useState("");
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value); // Update search query state
  };
  const filteredGenderData = genderData.filter(gender =>
    gender.genderName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    gender.genderCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (gender) => {
    setEditingGender(gender);
    setShowForm(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
  
    const formElement = e.target;
    const updatedGenderName = formElement.genderName.value;
  
    if (editingGender) {
      // Editing existing gender
      setGenderData(genderData.map(gender =>
        gender.id === editingGender.id 
          ? { ...gender, genderName: updatedGenderName }
          : gender
      ));
    } else {
      // Adding new gender
      const newGender = {
        id: genderData.length + 1,
        genderCode: formData.genderCode,
        genderName: updatedGenderName,
        status: "y"
      };
      setGenderData([...genderData, newGender]);
    }
  
    setEditingGender(null);
    setShowForm(false);
    showPopup("Changes saved successfully!", "success");
  };
  const [showForm, setShowForm] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingGender, setEditingGender] = useState(null);
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
    setConfirmDialog({ isOpen: true, genderId: id, newStatus });

  };
  const handleConfirm = (confirmed) => {
    if (confirmed && confirmDialog.genderId !== null) {
      setGenderData((prevData) =>
        prevData.map((gender) =>
          gender.id === confirmDialog.genderId ? { ...gender, status: confirmDialog.newStatus } : gender
        )
      );
    }
    setConfirmDialog({ isOpen: false, genderId: null, newStatus: null }); // Close dialog
  };
  const [currentPage, setCurrentPage] = useState(1); // Initialize currentPage
  const [filteredTotalPages, setFilteredTotalPages] = useState(1); // Initialize filteredTotalPages
  const [totalFilteredProducts, setTotalFilteredProducts] = useState(0);

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData((prevData) => ({ ...prevData, [id]: value }))
  }

  const handleCreateFormSubmit = (e) => {
    e.preventDefault()
    if (formData.genderCode && formData.genderName) {
      setGenderData([...genderData, { ...formData, id: Date.now(), status: "y" }])
      setFormData({ genderCode: "", genderName: "" })
      setShowForm(false)
    } else {
      alert("Please fill out all required fields.")
    }
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Gender Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                <form className="d-inline-block searchform me-4" role="search">
                  <div className="input-group searchinput">
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search"
                      aria-label="Search"
                      value={searchQuery} // Bind search input to state
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
                        <th>Gender Code</th>
                        <th>Gender Name</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                    {filteredGenderData.map((gender) => ( // Use filtered data for rendering
                        <tr key={gender.id}>
                          <td>{gender.genderCode}</td>
                          <td>{gender.genderName}</td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={gender.status === "y"}
                                onChange={() => handleSwitchChange(gender.id, gender.status === "y" ? "n" : "y")}
                                id={`switch-${gender.id}`}
                              />
                              <label
                                className="form-check-label px-0"
                                htmlFor={`switch-${gender.id}`}
                                onClick={() => handleSwitchChange(gender.id, gender.status === "y" ? "n" : "y")}
                              >
                                {gender.status === "y" ? 'Active' : 'Deactivated'}
                              </label>
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleEdit(gender)} // Assuming handleEdit function exists
                              disabled={gender.status !== "y"} // Disable if not active
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
                  <label>Gender Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    id="genderName"
                    name="genderName"
                    placeholder="Name"
                    defaultValue={editingGender ? editingGender.genderName : ""}
                    onChange={(e) => setIsFormValid(e.target.value.trim() !== "")}
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
                          Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{genderData.find(gender => gender.id === confirmDialog.genderId)?.genderName}</strong>?
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

export default Gendermaster

