import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import axios from "axios";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

// Constants - You'll need to update these with actual API endpoints and messages
const MAS_ITEM_FACILITY = "/api/item-facility"; // Update with your actual API endpoint
const FETCH_FACILITY_ERR_MSG = "Failed to fetch facility data";
const DUPLICATE_FACILITY = "Facility code or name already exists";
const UPDATE_FACILITY_SUCC_MSG = "Facility updated successfully";
const ADD_FACILITY_SUCC_MSG = "Facility added successfully";
const FAIL_TO_SAVE_CHANGES = "Failed to save changes";
const FAIL_TO_UPDATE_STS = "Failed to update status";
const DEPARTMENT_LIST = ["Cardiology", "Radiology", "Emergency", "ICU", "Oncology", "Orthopedics", "Pediatrics"];

const ItemFacility = () => {
  const [facilityData, setFacilityData] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, facilityId: null, newStatus: false });
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    facilityCode: "",
    facilityName: "",
    departmentName: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const FACILITY_NAME_MAX_LENGTH = 100;
  const FACILITY_CODE_MAX_LENGTH = 10;

  useEffect(() => {
    fetchFacilityData(0);
  }, []);

  const fetchFacilityData = async (flag = 0) => {
    try {
      setLoading(true);
      // Replace with your actual API call
      // const response = await getRequest(`${MAS_ITEM_FACILITY}/getAll/${flag}`);
      
      // For now, using mock data
      const mockData = [
        { id: 1, facilityCode: "FAC001", facilityName: "Main Operation Theater", departmentName: "Cardiology", status: "y" },
        { id: 2, facilityCode: "FAC002", facilityName: "MRI Room", departmentName: "Radiology", status: "y" },
        { id: 3, facilityCode: "FAC003", facilityName: "Emergency Ward", departmentName: "Emergency", status: "n" },
        { id: 4, facilityCode: "FAC004", facilityName: "ICU Unit", departmentName: "ICU", status: "y" },
        { id: 5, facilityCode: "FAC005", facilityName: "Chemotherapy Room", departmentName: "Oncology", status: "y" },
      ];
      
      const transformedData = mockData.map(facility => ({
        id: facility.id,
        facilityCode: facility.facilityCode,
        facilityName: facility.facilityName,
        departmentName: facility.departmentName,
        status: facility.status
      }));

      setFacilityData(transformedData);
    } catch (err) {
      console.error("Error fetching facility data:", err);
      showPopup(FETCH_FACILITY_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredFacilityData = facilityData.filter(facility =>
    facility.facilityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    facility.facilityCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    facility.departmentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredFacilityData.slice(indexOfFirstItem, indexOfLastItem);

  const handleEdit = (facility) => {
    setEditingFacility(facility);
    setFormData({
      facilityCode: facility.facilityCode,
      facilityName: facility.facilityName,
      departmentName: facility.departmentName
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);

      if (editingFacility) {
        // Update existing facility
        // const response = await axios.put(`${MAS_ITEM_FACILITY}/updateById/${editingFacility.id}`, {
        //   id: editingFacility.id,
        //   facilityCode: formData.facilityCode,
        //   facilityName: formData.facilityName,
        //   departmentName: formData.departmentName,
        //   status: editingFacility.status
        // });

        // Mock update
        const updatedFacility = {
          id: editingFacility.id,
          facilityCode: formData.facilityCode,
          facilityName: formData.facilityName,
          departmentName: formData.departmentName,
          status: editingFacility.status
        };

        setFacilityData(facilityData.map(facility =>
          facility.id === editingFacility.id ? updatedFacility : facility
        ));
        showPopup(UPDATE_FACILITY_SUCC_MSG, "success");
      } else {
        // Create new facility
        // const response = await postRequest(`${MAS_ITEM_FACILITY}/create`, {
        //   facilityCode: formData.facilityCode,
        //   facilityName: formData.facilityName,
        //   departmentName: formData.departmentName,
        //   status: "y"
        // });

        const isDuplicate = facilityData.some(
          (facility) =>
            facility.facilityCode === formData.facilityCode ||
            facility.facilityName === formData.facilityName
        );

        if (isDuplicate) {
          showPopup(DUPLICATE_FACILITY, "error");
          setLoading(false);
          return;
        }

        // Mock create
        const newFacility = {
          id: facilityData.length + 1,
          facilityCode: formData.facilityCode,
          facilityName: formData.facilityName,
          departmentName: formData.departmentName,
          status: "y"
        };

        setFacilityData([...facilityData, newFacility]);
        showPopup(ADD_FACILITY_SUCC_MSG, "success");
      }

      setEditingFacility(null);
      setFormData({ facilityCode: "", facilityName: "", departmentName: "" });
      setShowForm(false);
      fetchFacilityData();
    } catch (err) {
      console.error("Error saving facility data:", err);
      showPopup(FAIL_TO_SAVE_CHANGES, "error");
    } finally {
      setLoading(false);
    }
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
    setConfirmDialog({ isOpen: true, facilityId: id, newStatus });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.facilityId !== null) {
      try {
        setLoading(true);

        // const response = await putRequest(
        //   `${MAS_ITEM_FACILITY}/status/${confirmDialog.facilityId}?status=${confirmDialog.newStatus}`
        // );

        // Mock status update
        setFacilityData((prevData) =>
          prevData.map((facility) =>
            facility.id === confirmDialog.facilityId ?
              { ...facility, status: confirmDialog.newStatus } :
              facility
          )
        );
        showPopup(`Facility ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`, "success");
      } catch (err) {
        console.error("Error updating facility status:", err);
        showPopup(FAIL_TO_UPDATE_STS, "error");
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 2000);
      }
    }
    setConfirmDialog({ isOpen: false, facilityId: null, newStatus: null });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));

    // Validate form
    const isFacilityCodeValid = formData.facilityCode.trim() !== "";
    const isFacilityNameValid = formData.facilityName.trim() !== "";
    const isDepartmentValid = formData.departmentName.trim() !== "";

    if (id === "facilityCode") {
      setIsFormValid(isFacilityNameValid && isDepartmentValid);
    } else if (id === "facilityName") {
      setIsFormValid(isFacilityCodeValid && isDepartmentValid);
    } else if (id === "departmentName") {
      setIsFormValid(isFacilityCodeValid && isFacilityNameValid);
    }
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchFacilityData();
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Item Facility Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm ? (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search by Facility Code, Name or Department"
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
                          setEditingFacility(null);
                          setFormData({ facilityCode: "", facilityName: "", departmentName: "" });
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
              {loading ? (
                <LoadingScreen />
              ) : !showForm ? (
                <>
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Facility Code</th>
                          <th>Facility Name</th>
                          <th>Department Name</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((facility) => (
                            <tr key={facility.id}>
                              <td>{facility.facilityCode}</td>
                              <td>{facility.facilityName}</td>
                              <td>{facility.departmentName}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={facility.status === "y"}
                                    onChange={() => handleSwitchChange(facility.id, facility.status === "y" ? "n" : "y")}
                                    id={`switch-${facility.id}`}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${facility.id}`}
                                  >
                                    {facility.status === "y" ? 'Active' : 'Deactivated'}
                                  </label>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(facility)}
                                  disabled={facility.status !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center">No facility data found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* PAGINATION USING REUSABLE COMPONENT */}
                  {filteredFacilityData.length > 0 && (
                    <Pagination
                      totalItems={filteredFacilityData.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  {!editingFacility && (
                    <div className="form-group col-md-4">
                      <label>Facility Code <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control mt-1"
                        id="facilityCode"
                        name="facilityCode"
                        placeholder="Facility Code"
                        value={formData.facilityCode}
                        onChange={handleInputChange}
                        maxLength={FACILITY_CODE_MAX_LENGTH}
                        required
                      />
                    </div>
                  )}
                  <div className="form-group col-md-4">
                    <label>Facility Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="facilityName"
                      name="facilityName"
                      placeholder="Facility Name"
                      value={formData.facilityName}
                      onChange={handleInputChange}
                      maxLength={FACILITY_NAME_MAX_LENGTH}
                      required
                    />
                  </div>
                  <div className="form-group col-md-4">
                    <label>Department Name <span className="text-danger">*</span></label>
                    <select
                      className="form-select mt-1"
                      id="departmentName"
                      name="departmentName"
                      value={formData.departmentName}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENT_LIST.map((dept, index) => (
                        <option key={index} value={dept}>{dept}</option>
                      ))}
                    </select>
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
                          Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{facilityData.find(facility => facility.id === confirmDialog.facilityId)?.facilityName}</strong>?
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

export default ItemFacility;