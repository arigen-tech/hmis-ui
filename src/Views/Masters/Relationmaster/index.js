import { useState } from "react"
import Popup from "../../../Components/popup";


const Relationmaster = () => {

  const [showForm, setShowForm] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingRelation, setEditingRelation] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [relationData, setRelationData] = useState([
    { id: 1, relationCode: "F", relationName: "Father", status: "y" },
    { id: 2, relationCode: "M", relationName: "Mother", status: "y" },
    { id: 3, relationCode: "S", relationName: "Wife", status: "y" },
    { id: 4, relationCode: "S", relationName: "Husband", status: "y" },
    { id: 5, relationCode: "S", relationName: "Self", status: "y" },
  ])
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, relationId: null, newStatus: false });




  const [formData, setFormData] = useState({
    relationCode: "",
    relationName: "",
  })


  const handleEdit = (relation) => {
    setEditingRelation(relation);
    setShowForm(true);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredRelations = relationData.filter(relation =>
    relation.relationName.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const formElement = e.target;
    const updatedRelationName = formElement.relationName.value;

    if (editingRelation) {
      // Editing existing relation
      setRelationData(relationData.map(relation =>
        relation.id === editingRelation.id
          ? { ...relation, relationName: updatedRelationName }
          : relation
      ));
    } else {
      // Adding new relation
      const newRelation = {
        id: relationData.length + 1,
        relationCode: formData.relationCode,
        relationName: updatedRelationName,
        status: "y"
      };
      setRelationData([...relationData, newRelation]);
    }

    setEditingRelation(null);
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


 
  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, relationId: id, newStatus });

  };
  const handleConfirm = (confirmed) => {
    if (confirmed && confirmDialog.relationId !== null) {
      setRelationData((prevData) =>
        prevData.map((relation) =>
          relation.id === confirmDialog.relationId ? { ...relation, status: confirmDialog.newStatus } : relation
        )
      );
    }
    setConfirmDialog({ isOpen: false, relationId: null, newStatus: null }); // Close dialog
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
    if (formData.relationCode && formData.relationName) {
      setRelationData([...relationData, { ...formData, id: Date.now(), status: "y" }])
      setFormData({ relationCode: "", relationName: "" })
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
              <h4 className="card-title">Relation Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                <form className="d-inline-block searchform me-4" role="search">
                  <div className="input-group searchinput">
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search"
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
                        <th>Relation Name</th>
                        <th>New Relation Name</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRelations.map((relation) => (
                        <tr key={relation.id}>
                          <td>{relation.relationName}</td>
                          <td>{relation.relationName}</td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={relation.status === "y"}
                                onChange={() => handleSwitchChange(relation.id, relation.status === "y" ? "n" : "y")}
                                id={`switch-${relation.id}`}
                              />
                              <label
                                className="form-check-label px-0"
                                htmlFor={`switch-${relation.id}`}
                                onClick={() => handleSwitchChange(relation.id, relation.status === "y" ? "n" : "y")}
                              >
                                {relation.status === "y" ? 'Active' : 'Deactivated'}
                              </label>
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleEdit(relation)} // Assuming handleEdit function exists
                              disabled={relation.status !== "y"} // Disable if not active
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
                    <label>Relation Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      id="relationName"
                      name="relationName" // Ensure this matches
                      placeholder="Name"
                      defaultValue={editingRelation ? editingRelation.relationName : ""}
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
                          Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{relationData.find(relation => relation.id === confirmDialog.relationId)?.relationName}</strong>?
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

export default Relationmaster;

