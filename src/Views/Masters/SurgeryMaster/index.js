import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const SurgeryMaster = () => {
  // ---------- Mock Data State ----------
  const [surgeryData, setSurgeryData] = useState([
    {
      id: 1,
      surgeryCode: "SURG001",
      surgeryName: "Appendectomy",
      departmentId: "1",
      departmentName: "General Surgery",
      surgeryLevel: "Minor",
      anesthesiaRequired: "Yes",
      status: "y"
    },
    {
      id: 2,
      surgeryCode: "SURG002",
      surgeryName: "Knee Replacement",
      departmentId: "2",
      departmentName: "Orthopedics",
      surgeryLevel: "Major",
      anesthesiaRequired: "Yes",
      status: "y"
    },
    {
      id: 3,
      surgeryCode: "SURG003",
      surgeryName: "Cardiac Bypass",
      departmentId: "3",
      departmentName: "Cardiology",
      surgeryLevel: "Super Major",
      anesthesiaRequired: "Yes",
      status: "n"
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    surgeryId: null,
    newStatus: false
  });

  const [formData, setFormData] = useState({
    surgeryCode: "",
    surgeryName: "",
    departmentId: "",
    surgeryLevel: "Minor",
    anesthesiaRequired: "No"
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingSurgery, setEditingSurgery] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [pageInput, setPageInput] = useState("1");

  // Dropdown options (mock)
  const departmentOptions = [
    { id: "1", name: "General Surgery" },
    { id: "2", name: "Orthopedics" },
    { id: "3", name: "Cardiology" },
    { id: "4", name: "Neurology" },
    { id: "5", name: "Pediatrics" }
  ];

  const surgeryLevelOptions = ["Minor", "Major", "Super Major"];
  const anesthesiaOptions = ["Yes", "No"];

  const SURGERY_CODE_MAX_LENGTH = 8;
  const SURGERY_NAME_MAX_LENGTH = 30;

  // Filter data based on search query
  const filteredSurgeryData = surgeryData.filter(surgery =>
    surgery.surgeryCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    surgery.surgeryName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredSurgeryData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSurgeryData.slice(indexOfFirstItem, indexOfLastItem);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
    setPageInput("1");
  }, [searchQuery]);

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // Validate form
  useEffect(() => {
    const { surgeryCode, surgeryName, departmentId } = formData;
    setIsFormValid(
      surgeryCode.trim() !== "" &&
      surgeryName.trim() !== "" &&
      departmentId.trim() !== ""
    );
  }, [formData]);

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  const handleEdit = (surgery) => {
    setEditingSurgery(surgery);
    setFormData({
      surgeryCode: surgery.surgeryCode,
      surgeryName: surgery.surgeryName,
      departmentId: surgery.departmentId,
      surgeryLevel: surgery.surgeryLevel,
      anesthesiaRequired: surgery.anesthesiaRequired
    });
    setShowForm(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      const departmentName = departmentOptions.find(d => d.id === formData.departmentId)?.name || "";

      if (editingSurgery) {
        // Update existing
        setSurgeryData(prev =>
          prev.map(item =>
            item.id === editingSurgery.id
              ? {
                  ...item,
                  surgeryCode: formData.surgeryCode,
                  surgeryName: formData.surgeryName,
                  departmentId: formData.departmentId,
                  departmentName: departmentName,
                  surgeryLevel: formData.surgeryLevel,
                  anesthesiaRequired: formData.anesthesiaRequired
                }
              : item
          )
        );
        showPopup("Surgery updated successfully!", "success");
      } else {
        // Add new
        const newId = Math.max(...surgeryData.map(s => s.id), 0) + 1;
        const newSurgery = {
          id: newId,
          surgeryCode: formData.surgeryCode,
          surgeryName: formData.surgeryName,
          departmentId: formData.departmentId,
          departmentName: departmentName,
          surgeryLevel: formData.surgeryLevel,
          anesthesiaRequired: formData.anesthesiaRequired,
          status: "y"
        };
        setSurgeryData(prev => [...prev, newSurgery]);
        showPopup("Surgery added successfully!", "success");
      }

      setEditingSurgery(null);
      setFormData({
        surgeryCode: "",
        surgeryName: "",
        departmentId: "",
        surgeryLevel: "Minor",
        anesthesiaRequired: "No"
      });
      setShowForm(false);
      setLoading(false);
    }, 500);
  };

  const showPopup = (message, type = "info") => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, surgeryId: id, newStatus });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed && confirmDialog.surgeryId !== null) {
      setSurgeryData(prev =>
        prev.map(surgery =>
          surgery.id === confirmDialog.surgeryId
            ? { ...surgery, status: confirmDialog.newStatus }
            : surgery
        )
      );
      showPopup(
        `Surgery ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
        "success"
      );
    }
    setConfirmDialog({ isOpen: false, surgeryId: null, newStatus: null });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    setPageInput("1");
    // In a real app you would refetch, here we just reset search
  };

  const handleActivate = () => {
    if (editingSurgery && editingSurgery.status === "n") {
      setLoading(true);
      setTimeout(() => {
        setSurgeryData(prev =>
          prev.map(item =>
            item.id === editingSurgery.id ? { ...item, status: "y" } : item
          )
        );
        showPopup("Surgery activated successfully!", "success");
        setEditingSurgery(null);
        setFormData({
          surgeryCode: "",
          surgeryName: "",
          departmentId: "",
          surgeryLevel: "Minor",
          anesthesiaRequired: "No"
        });
        setShowForm(false);
        setLoading(false);
      }, 500);
    }
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Surgery Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm ? (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search by code or name"
                        aria-label="Search"
                        value={searchQuery}
                        onChange={handleSearchChange}
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
                          setEditingSurgery(null);
                          setFormData({
                            surgeryCode: "",
                            surgeryName: "",
                            departmentId: "",
                            surgeryLevel: "Minor",
                            anesthesiaRequired: "No"
                          });
                          setShowForm(true);
                        }}
                      >
                        <i className="mdi mdi-plus"></i> Add
                      </button>
                      <button
                        type="button"
                        className="btn btn-success me-2 flex-shrink-0"
                        onClick={handleRefresh}
                      >
                        <i className="mdi mdi-refresh"></i> Show All
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowForm(false)}
                    >
                      <i className="mdi mdi-arrow-left"></i> Back
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <LoadingScreen />
              ) : !showForm ? (
                <>
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Surgery Code</th>
                          <th>Surgery Name</th>
                          <th>Department</th>
                          <th>Level</th>
                          <th>Anesthesia Required</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((surgery) => (
                            <tr key={surgery.id}>
                              <td>{surgery.surgeryCode}</td>
                              <td>{surgery.surgeryName}</td>
                              <td>{surgery.departmentName}</td>
                              <td>{surgery.surgeryLevel}</td>
                              <td>{surgery.anesthesiaRequired}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={surgery.status === "y"}
                                    onChange={() =>
                                      handleSwitchChange(
                                        surgery.id,
                                        surgery.status === "y" ? "n" : "y"
                                      )
                                    }
                                    id={`switch-${surgery.id}`}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${surgery.id}`}
                                  >
                                    {surgery.status === "y" ? "Active" : "Inactive"}
                                  </label>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(surgery)}
                                  disabled={surgery.status !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="text-center">
                              No surgery data found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div>
                    <Pagination
                      totalItems={filteredSurgeryData.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                </>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="form-group col-md-4">
                    <label>
                      Surgery Code <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="surgeryCode"
                      placeholder="Enter surgery code"
                      value={formData.surgeryCode}
                      onChange={handleInputChange}
                      maxLength={SURGERY_CODE_MAX_LENGTH}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group col-md-4">
                    <label>
                      Surgery Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="surgeryName"
                      placeholder="Enter surgery name"
                      value={formData.surgeryName}
                      onChange={handleInputChange}
                      maxLength={SURGERY_NAME_MAX_LENGTH}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group col-md-4">
                    <label>
                      Department <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select mt-1"
                      id="departmentId"
                      value={formData.departmentId}
                      onChange={handleSelectChange}
                      required
                      disabled={loading}
                    >
                      <option value="">Select Department</option>
                      {departmentOptions.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group col-md-4 mt-3">
                    <label>Surgery Level</label>
                    <select
                      className="form-select mt-1"
                      id="surgeryLevel"
                      value={formData.surgeryLevel}
                      onChange={handleSelectChange}
                      disabled={loading}
                    >
                      {surgeryLevelOptions.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group col-md-4 mt-3">
                    <label>Anesthesia Required</label>
                    <select
                      className="form-select mt-1"
                      id="anesthesiaRequired"
                      value={formData.anesthesiaRequired}
                      onChange={handleSelectChange}
                      disabled={loading}
                    >
                      {anesthesiaOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid || loading}
                    >
                      {loading ? "Saving..." : editingSurgery ? "Update" : "Save"}
                    </button>

                    {editingSurgery && editingSurgery.status === "n" && (
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={handleActivate}
                        disabled={loading}
                      >
                        Activate
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => setShowForm(false)}
                      disabled={loading}
                    >
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
                <div
                  className="modal d-block"
                  tabIndex="-1"
                  role="dialog"
                  style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                >
                  <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button
                          type="button"
                          className="btn-close"
                          onClick={() => handleConfirm(false)}
                          aria-label="Close"
                          disabled={loading}
                        ></button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to{" "}
                          {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                          <strong>
                            {
                              surgeryData.find(
                                (s) => s.id === confirmDialog.surgeryId
                              )?.surgeryName
                            }
                          </strong>{" "}
                          surgery?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleConfirm(false)}
                          disabled={loading}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleConfirm(true)}
                          disabled={loading}
                        >
                          {loading ? "Processing..." : "Confirm"}
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

export default SurgeryMaster;