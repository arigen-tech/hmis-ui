import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import axios from "axios";
import { API_HOST, MAS_PATIENT_PREPARATION } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import { 
  ADD_PREPARATION_SUCC_MSG, 
  DUPLICATE_PREPARATION_CODE, 
  FAIL_TO_SAVE_CHANGES, 
  FAIL_TO_UPDATE_STS, 
  FETCH_PREPARATION_ERR_MSG, 
  UPDATE_PREPARATION_SUCC_MSG 
} from "../../../config/constants";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const PatientPreparationMaster = () => {
  const [preparationData, setPreparationData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, preparationId: null, newStatus: false });
  const [popupMessage, setPopupMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPreparation, setEditingPreparation] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    preparationCode: "",
    preparationName: "",
    instructions: "",
    applicableTo: "LAB"
  });
  const [loading, setLoading] = useState(true);

  const applicableToOptions = ["LAB", "RADIOLOGY", "PROCEDURE"];

  useEffect(() => {
    fetchPreparationData(0);
  }, []);

  // Function to format date as dd-MM-YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "";
      }

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  const fetchPreparationData = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_PATIENT_PREPARATION}/all?flag=${flag}`);
      
      if (response && response.response) {
        const mappedData = response.response.map(item => ({
          id: item.preparationId,
          preparationCode: item.preparationCode,
          preparationName: item.preparationName,
          instructions: item.instructions,
          applicableTo: item.applicableTo,
          status: item.status,
          lastUpdated: formatDate(item.lastUpdateDate)
        }));
        setPreparationData(mappedData);
      }
    } catch (err) {
      console.error("Error fetching preparation data:", err);
      showPopup(FETCH_PREPARATION_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredPreparations = (preparationData || []).filter(
    (preparation) =>
      preparation?.preparationName?.toLowerCase().includes(searchQuery?.toLowerCase() || "") ||
      preparation?.preparationCode?.toLowerCase().includes(searchQuery?.toLowerCase() || "") ||
      preparation?.applicableTo?.toLowerCase().includes(searchQuery?.toLowerCase() || "")
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredPreparations.slice(indexOfFirst, indexOfLast);

  const handleEdit = (preparation) => {
    setEditingPreparation(preparation);
    setFormData({
      preparationCode: preparation.preparationCode,
      preparationName: preparation.preparationName,
      instructions: preparation.instructions,
      applicableTo: preparation.applicableTo
    });
    validateForm({
      preparationCode: preparation.preparationCode,
      preparationName: preparation.preparationName,
      instructions: preparation.instructions,
      applicableTo: preparation.applicableTo
    });
    setShowForm(true);
  };

  const validateForm = (data) => {
    const isValid = 
      data.preparationCode.trim() !== "" && 
      data.preparationName.trim() !== "" && 
      data.applicableTo.trim() !== "" &&
      data.instructions.trim() !== "";
    setIsFormValid(isValid);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);

      // Check for duplicate code only when creating new record
      if (!editingPreparation) {
        const isDuplicate = preparationData.some(
          (preparation) => preparation.preparationCode === formData.preparationCode
        );

        if (isDuplicate) {
          showPopup(DUPLICATE_PREPARATION_CODE, "error");
          setLoading(false);
          return;
        }
      }

      if (editingPreparation) {
        // Update existing preparation
        const response = await putRequest(
          `${MAS_PATIENT_PREPARATION}/update/${editingPreparation.id}`,
          {
            preparationCode: formData.preparationCode,
            preparationName: formData.preparationName,
            instructions: formData.instructions,
            applicableTo: formData.applicableTo
          }
        );

        if (response && response.status === 200) {
          fetchPreparationData();
          showPopup(UPDATE_PREPARATION_SUCC_MSG, "success");
        }
      } else {
        // Create new preparation
        const response = await postRequest(
          `${MAS_PATIENT_PREPARATION}/create`,
          {
            preparationCode: formData.preparationCode,
            preparationName: formData.preparationName,
            instructions: formData.instructions,
            applicableTo: formData.applicableTo
          }
        );

        if (response && response.status === 200) {
          fetchPreparationData();
          showPopup(ADD_PREPARATION_SUCC_MSG, "success");
        }
      }

      // Reset form
      setEditingPreparation(null);
      setFormData({
        preparationCode: "",
        preparationName: "",
        instructions: "",
        applicableTo: "LAB"
      });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving patient preparation:", err);
      showPopup(FAIL_TO_SAVE_CHANGES, "error");
    } finally {
      setLoading(false);
    }
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

  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, preparationId: id, newStatus });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.preparationId !== null) {
      try {
        setLoading(true);
        const response = await putRequest(
          `${MAS_PATIENT_PREPARATION}/${confirmDialog.preparationId}/status/${confirmDialog.newStatus}`
        );
        if (response && response.response) {
          setPreparationData((prevData) =>
            prevData.map((preparation) =>
              preparation.id === confirmDialog.preparationId
                ? { ...preparation, status: confirmDialog.newStatus }
                : preparation
            )
          );
          showPopup(
            `Patient Preparation ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
            "success"
          );
        }
      } catch (err) {
        console.error("Error updating patient preparation status:", err);
        showPopup(FAIL_TO_UPDATE_STS, "error");
      } finally {
        setLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, preparationId: null, newStatus: null });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const updatedFormData = { ...formData, [id]: value };
    setFormData(updatedFormData);
    validateForm(updatedFormData);
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchPreparationData();
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Patient Preparation Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm ? (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search Patient Preparation"
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
                          setEditingPreparation(null);
                          setFormData({
                            preparationCode: "",
                            preparationName: "",
                            instructions: "",
                            applicableTo: "LAB"
                          });
                          setIsFormValid(false);
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
                      <button 
                        type="button" 
                        className="btn btn-success me-2" 
                        onClick={() => setShowModal(true)}
                      >
                        <i className="mdi mdi-plus"></i> Reports
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
                          <th>Code</th>
                          <th>Name</th>
                          <th>Instructions</th>
                          <th>Applicable To</th>
                          <th>Status</th>
                          <th>Last Updated</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.map((preparation) => (
                          <tr key={preparation.id}>
                            <td>{preparation.preparationCode}</td>
                            <td>{preparation.preparationName}</td>
                            <td>{preparation.instructions}</td>
                            <td>{preparation.applicableTo}</td>
                            <td>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={preparation.status === "y"}
                                  onChange={() => handleSwitchChange(preparation.id, preparation.status === "y" ? "n" : "y")}
                                  id={`switch-${preparation.id}`}
                                />
                                <label
                                  className="form-check-label px-0"
                                  htmlFor={`switch-${preparation.id}`}
                                >
                                  {preparation.status === "y" ? "Active" : "Deactivated"}
                                </label>
                              </div>
                            </td>
                            <td>{preparation.lastUpdated || "N/A"}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleEdit(preparation)}
                                disabled={preparation.status !== "y"}
                              >
                                <i className="fa fa-pencil"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* PAGINATION USING REUSABLE COMPONENT */}
                  {filteredPreparations.length > 0 && (
                    <Pagination
                      totalItems={filteredPreparations.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="form-group col-md-4">
                    <label>Preparation Code <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="preparationCode"
                      placeholder="Enter Preparation Code"
                      value={formData.preparationCode}
                      onChange={handleInputChange}
                      maxLength={30}
                      required
                    />
                  </div>
                  <div className="form-group col-md-4">
                    <label>Preparation Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="preparationName"
                      placeholder="Enter Preparation Name"
                      value={formData.preparationName}
                      onChange={handleInputChange}
                      maxLength={150}
                      required
                    />
                  </div>
                  <div className="form-group col-md-4">
                    <label>Applicable To <span className="text-danger">*</span></label>
                    <select
                      className="form-select mt-1"
                      id="applicableTo"
                      value={formData.applicableTo}
                      onChange={handleInputChange}
                      required
                    >
                      {applicableToOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group col-md-12">
                    <label>Instructions <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control mt-1"
                      id="instructions"
                      placeholder="Enter Instructions"
                      value={formData.instructions}
                      onChange={handleInputChange}
                      rows="3"
                      required
                    />
                  </div>
                  <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                    <button 
                      type="submit" 
                      className="btn btn-primary me-2" 
                      disabled={!isFormValid}
                    >
                      Save
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger" 
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
              {showModal && (
                <div 
                  className="modal fade show" 
                  style={{ display: 'block' }} 
                  tabIndex="-1" 
                  aria-labelledby="staticBackdropLabel" 
                  aria-hidden="true"
                >
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h1 className="modal-title fs-5" id="staticBackdropLabel">Reports</h1>
                        <button 
                          type="button" 
                          className="btn-close" 
                          onClick={() => setShowModal(false)} 
                          aria-label="Close"
                        ></button>
                      </div>
                      <div className="modal-body">
                        {/* Your modal content goes here */}
                        ...
                      </div>
                      <div className="modal-footer">
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          onClick={() => setShowModal(false)}
                        >
                          Close
                        </button>
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
                          Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                          <strong>
                            {preparationData.find((preparation) => preparation.id === confirmDialog.preparationId)?.preparationName}
                          </strong>?
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

export default PatientPreparationMaster;