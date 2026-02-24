import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import Pagination, {
  DEFAULT_ITEMS_PER_PAGE,
} from "../../../Components/Pagination";

const BagTypeMaster = () => {
  const [formData, setFormData] = useState({
    bagTypeCode: "",
    bagTypeName: "",
    description: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBagType, setEditingBagType] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageInput, setPageInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [bagTypeData, setBagTypeData] = useState([
    {
      id: 1,
      bagTypeCode: "BT-PLA-001",
      bagTypeName: "Paper Bag",
      description: "Eco-friendly paper bags",
      status: "y",
    },
    {
      id: 2,
      bagTypeCode: "BT-CLO-002",
      bagTypeName: "Plastic Bag",
      description: "Regular plastic bags",
      status: "y",
    },
    {
      id: 3,
      bagTypeCode: "BT-JUT-003",
      bagTypeName: "Cloth Bag",
      description: "Reusable cloth bags",
      status: "y",
    },
    {
      id: 4,
      bagTypeCode: "BT-NWB-004",
      bagTypeName: "Jute Bag",
      description: "Natural jute bags",
      status: "y",
    },
    {
      id: 5,
      bagTypeCode: "BT-ZIP-005",
      bagTypeName: "Non-Woven Bag",
      description: "PP non-woven bags",
      status: "y",
    },
  ]);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    bagTypeId: null,
    newStatus: false,
  });

  const filteredBagTypes = bagTypeData.filter(
    (bagType) =>
      bagType.bagTypeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bagType.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleEdit = (bagType) => {
    setEditingBagType(bagType);
    setFormData({
      bagTypeCode: bagType.bagTypeCode,
      bagTypeName: bagType.bagTypeName,
      description: bagType.description || "",
    });
    setShowForm(true);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    const updateBagTypeCode = e.target.elements.bagTypeCode.value;
    const updatedBagTypeName = e.target.elements.bagTypeName.value;
    const updatedDescription = e.target.elements.description.value;

    if (editingBagType) {
      setBagTypeData(
        bagTypeData.map((bagType) =>
          bagType.id === editingBagType.id
            ? {
                ...bagType,
                bagTypeCode: updateBagTypeCode,
                bagTypeName: updatedBagTypeName,
                description: updatedDescription,
              }
            : bagType,
        ),
      );
    } else {
      const newBagType = {
        id: bagTypeData.length + 1,
        bagTypeCode: updateBagTypeCode,
        bagTypeName: updatedBagTypeName,
        description: updatedDescription,
        status: "y",
      };
      setBagTypeData([...bagTypeData, newBagType]);
    }

    setEditingBagType(null);
    setShowForm(false);
    setFormData({ bagTypeName: "", description: "" });
    setIsFormValid(false);
    showPopup("Changes saved successfully!", "success");
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

    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));

    const bagTypeCode = id === "bagTypeCode" ? value : formData.bagTypeCode;

    const bagTypeName = id === "bagTypeName" ? value : formData.bagTypeName;

    const isBagTypeCodeValid = bagTypeCode.trim() !== "";
    const isBagTypeNameValid = bagTypeName.trim() !== "";

    setIsFormValid(isBagTypeCodeValid && isBagTypeNameValid);
  };

  const handleCreateFormSubmit = (e) => {
    e.preventDefault();
    if (formData.bagTypeName) {
      setBagTypeData([
        ...bagTypeData,
        { ...formData, id: Date.now(), status: "y" },
      ]);
      setFormData({ bagTypeName: "", description: "" });
      setShowForm(false);
    } else {
      alert("Please fill out all required fields.");
    }
  };

  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, bagTypeId: id, newStatus });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed && confirmDialog.bagTypeId !== null) {
      setBagTypeData((prevData) =>
        prevData.map((bagType) =>
          bagType.id === confirmDialog.bagTypeId
            ? { ...bagType, status: confirmDialog.newStatus }
            : bagType,
        ),
      );
    }
    setConfirmDialog({ isOpen: false, bagTypeId: null, newStatus: null });
  };

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredBagTypes.slice(indexOfFirst, indexOfLast);

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Bag Type Master</h4>
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
                        placeholder="Search Bag Types"
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
                          setFormData({ bagTypeName: "", description: "" });
                          setEditingBagType(null);
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
                        setEditingBagType(null);
                        setFormData({ bagTypeName: "", description: "" });
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
                        <th>Bag Type Code</th>
                        <th>Bag Type Name</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((bagType) => (
                        <tr key={bagType.id}>
                          <td>{bagType.bagTypeCode}</td>
                          <td>{bagType.bagTypeName}</td>
                          <td>{bagType.description}</td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={bagType.status === "y"}
                                onChange={() =>
                                  handleSwitchChange(
                                    bagType.id,
                                    bagType.status === "y" ? "n" : "y",
                                  )
                                }
                                id={`switch-${bagType.id}`}
                              />
                              <label
                                className="form-check-label px-0"
                                htmlFor={`switch-${bagType.id}`}
                              >
                                {bagType.status === "y" ? "Active" : "Inactive"}
                              </label>
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleEdit(bagType)}
                              disabled={bagType.status !== "y"}
                            >
                              <i className="fa fa-pencil"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredBagTypes.length > 0 && (
                    <Pagination
                      totalItems={filteredBagTypes.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </div>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="col-md-4">
                    <label>
                      Bag Type Code <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="bagTypeCode"
                      className="form-control"
                      value={formData.bagTypeCode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group col-md-4">
                    <label>
                      Bag Type Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="bagTypeName"
                      placeholder="Enter bag type name"
                      value={formData.bagTypeName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
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
                  <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid}
                    >
                      {editingBagType ? "Update" : "Save"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => {
                        setShowForm(false);
                        setEditingBagType(null);
                        setFormData({
                          bagTypeCode: "",
                          bagTypeName: "",
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
                              bagTypeData.find(
                                (bagType) =>
                                  bagType.id === confirmDialog.bagTypeId,
                              )?.bagTypeName
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

export default BagTypeMaster;
