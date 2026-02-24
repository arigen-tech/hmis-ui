import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import Pagination, {
  DEFAULT_ITEMS_PER_PAGE,
} from "../../../Components/Pagination";

const BloodCollectionTypeMaster = () => {
 const [formData, setFormData] = useState({
  collectionTypeCode: "",
  collectionTypeName: "",
  description: ""
});

  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCollectionType, setEditingCollectionType] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageInput, setPageInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [collectionTypeData, setCollectionTypeData] = useState([
    {
      id: 1,
      collectionTypeCode: "CT-VEN-001",
      collectionTypeName: "Venipuncture",
      description: "Blood drawn from vein",
      status: "y",
    },
    {
      id: 2,
      collectionTypeCode: "CT-FS-002",
      collectionTypeName: "Fingerstick",
      description: "Capillary blood collection",
      status: "y",
    },
    {
      id: 3,
      collectionTypeCode: "CT-ART-003",
      collectionTypeName: "Arterial Puncture",
      description: "Arterial blood gas collection",
      status: "y",
    },
    {
      id: 4,
      collectionTypeCode: "CT-HEEL-004",
      collectionTypeName: "Heelstick",
      description: "Infant blood collection",
      status: "y",
    },
    {
      id: 5,
      collectionTypeCode: "CT-SAL-005",
      collectionTypeName: "Saliva Collection",
      description: "Oral fluid sample",
      status: "y",
    },
    {
      id: 6,
      collectionTypeCode: "CT-URI-006",
      collectionTypeName: "Urine Collection",
      description: "Urine sample collection",
      status: "y",
    },
  ]);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    collectionTypeId: null,
    newStatus: false,
  });

  const filteredCollectionTypes = collectionTypeData.filter(
    (collectionType) =>
      collectionType.collectionTypeName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (collectionType.description &&
        collectionType.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase())),
  );

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

 const handleEdit = (collectionType) => {
  setEditingCollectionType(collectionType);
  setFormData({
    collectionTypeCode: collectionType.collectionTypeCode,
    collectionTypeName: collectionType.collectionTypeName,
    description: collectionType.description || "",
  });
  setIsFormValid(true);
  setShowForm(true);
};

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleSave = (e) => {
  e.preventDefault();
  if (!isFormValid) return;

  if (editingCollectionType) {
    setCollectionTypeData(prev =>
      prev.map(item =>
        item.id === editingCollectionType.id
          ? { ...item, ...formData }
          : item
      )
    );
    showPopup("Collection Type updated successfully", "success");
  } else {
    setCollectionTypeData(prev => [
      ...prev,
      {
        ...formData,
        id: Date.now(),
        status: "y"
      }
    ]);
    showPopup("Collection Type added successfully", "success");
  }

  setShowForm(false);
  setEditingCollectionType(null);
  setFormData({
    collectionTypeCode: "",
    collectionTypeName: "",
    description: ""
  });
  setIsFormValid(false);
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

  const updatedFormData = {
    ...formData,
    [id]: value
  };

  setFormData(updatedFormData);

  const isCollectionTypeNameValid =
    (updatedFormData.collectionTypeName || "").trim() !== "";

  const isCollectionTypeCodeValid =
    (updatedFormData.collectionTypeCode || "").trim() !== "";

  setIsFormValid(isCollectionTypeNameValid && isCollectionTypeCodeValid);
};
    
  const handleCreateFormSubmit = (e) => {
    e.preventDefault();
    if (formData.collectionTypeName) {
      setCollectionTypeData([
        ...collectionTypeData,
        { ...formData, id: Date.now(), status: "y" },
      ]);
      setFormData({ collectionTypeName: "", description: "" });
      setShowForm(false);
    } else {
      alert("Please fill out all required fields.");
    }
  };

  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, collectionTypeId: id, newStatus });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed && confirmDialog.collectionTypeId !== null) {
      setCollectionTypeData((prevData) =>
        prevData.map((collectionType) =>
          collectionType.id === confirmDialog.collectionTypeId
            ? { ...collectionType, status: confirmDialog.newStatus }
            : collectionType,
        ),
      );
    }
    setConfirmDialog({
      isOpen: false,
      collectionTypeId: null,
      newStatus: null,
    });
  };

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredCollectionTypes.slice(indexOfFirst, indexOfLast);

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Blood Collection Type Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm ? (
                  <form
                    className="d-inline-block searchform me-4"
                    role="search"
                  >
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search Collection Types"
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
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={() => {
                          setShowForm(true);
                          setFormData({
                            collectionTypeName: "",
                            description: "",
                          });
                          setEditingCollectionType(null);
                        }}
                      >
                        <i className="mdi mdi-plus"></i> Add
                      </button>
                      <button
                        type="button"
                        className="btn btn-success me-2 flex-shrink-0"
                      >
                        <i className="mdi mdi-plus"></i> Show All
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowForm(false);
                        setEditingCollectionType(null);
                        setFormData({
                          collectionTypeName: "",
                          description: "",
                        });
                      }}
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
                        <th>Collection Type Code</th>
                        <th>Collection Type Name</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((collectionType) => (
                        <tr key={collectionType.id}>
                          <td>{collectionType.collectionTypeCode}</td>
                          <td>{collectionType.collectionTypeName}</td>
                          <td>{collectionType.description}</td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={collectionType.status === "y"}
                                onChange={() =>
                                  handleSwitchChange(
                                    collectionType.id,
                                    collectionType.status === "y" ? "n" : "y",
                                  )
                                }
                                id={`switch-${collectionType.id}`}
                              />
                              <label
                                className="form-check-label px-0"
                                htmlFor={`switch-${collectionType.id}`}
                              >
                                {collectionType.status === "y"
                                  ? "Active"
                                  : "Inactive"}
                              </label>
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleEdit(collectionType)}
                              disabled={collectionType.status !== "y"}
                            >
                              <i className="fa fa-pencil"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredCollectionTypes.length > 0 && (
                    <Pagination
                      totalItems={filteredCollectionTypes.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </div>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                 <form className="forms row" onSubmit={handleSave}>

  {/* Collection Type Code */}
  <div className="form-group col-md-4">
    <label>
      Collection Type Code <span className="text-danger">*</span>
    </label>
    <input
      type="text"
      className="form-control"
      id="collectionTypeCode"
      placeholder="CT-VEN-001"
      value={formData.collectionTypeCode}
      onChange={handleInputChange}
      required
    />
  </div>

  {/* Collection Type Name */}
  <div className="form-group col-md-4">
    <label>
      Collection Type Name <span className="text-danger">*</span>
    </label>
    <input
      type="text"
      className="form-control"
      id="collectionTypeName"
      placeholder="Venipuncture"
      value={formData.collectionTypeName}
      onChange={handleInputChange}
      required
    />
  </div>

  {/* Description */}
  <div className="form-group col-md-4">
    <label>Description</label>
    <input
      type="text"
      className="form-control"
      id="description"
      placeholder="Enter description"
      value={formData.description}
      onChange={handleInputChange}
    />
  </div>

</form>
                  <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid}
                    >
                      {editingCollectionType ? "Update" : "Save"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => {
                        setShowForm(false);
                        setEditingCollectionType(null);
                        setFormData({
                          collectionTypeName: "",
                          description: "",
                        });
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
              {showModal && (
                <div
                  className="modal fade show"
                  style={{ display: "block" }}
                  tabIndex="-1"
                  aria-labelledby="staticBackdropLabel"
                  aria-hidden="true"
                >
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h1
                          className="modal-title fs-5"
                          id="staticBackdropLabel"
                        >
                          Reports
                        </h1>
                        <button
                          type="button"
                          className="btn-close"
                          onClick={() => setShowModal(false)}
                          aria-label="Close"
                        ></button>
                      </div>
                      <div className="modal-body">...</div>
                      <div className="modal-footer">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setShowModal(false)}
                        >
                          Close
                        </button>
                        <button type="button" className="btn btn-primary">
                          Generate
                        </button>
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
                        <button
                          type="button"
                          className="close"
                          onClick={() => handleConfirm(false)}
                        >
                          <span>&times;</span>
                        </button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to{" "}
                          {confirmDialog.newStatus === "y"
                            ? "activate"
                            : "deactivate"}{" "}
                          <strong>
                            {
                              collectionTypeData.find(
                                (collectionType) =>
                                  collectionType.id ===
                                  confirmDialog.collectionTypeId,
                              )?.collectionTypeName
                            }
                          </strong>
                          ?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleConfirm(false)}
                        >
                          No
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleConfirm(true)}
                        >
                          Yes
                        </button>
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

export default BloodCollectionTypeMaster;
