import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import { MAS_DEPARTMENT, REQUEST_PARAM_DEPARTMENT_TYPE_CODE, GET_ALL_ACT_MAS_DEPT_FOR_DROPDOWN_END_URL, FILTER_OPD_DEPT } from "../../../config/apiConfig";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { MAS_ITEM_FACILITY } from "../../../config/apiConfig";
import { ADD_FACILITY_SUCC_MSG, UPDATE_FACILITY_SUCC_MSG, FETCH_FACILITY_ERR_MSG, FAIL_TO_SAVE_CHANGES, FAIL_TO_UPDATE_STS } from "../../../config/constants";

const ItemFacility = () => {
  const [formData, setFormData] = useState({
    facilityCode: "",
    facilityName: "",
    departmentId: ""
  });

  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    facilityId: null, 
    newStatus: "", 
    facilityName: "" 
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [facilityData, setFacilityData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [process, setProcess] = useState(false);

  // Constants for validation
  const FACILITY_CODE_MAX_LENGTH = 10;
  const FACILITY_NAME_MAX_LENGTH = 100;

  useEffect(() => {
    fetchFacilityData(0);
    fetchDepartmentData();
  }, []);

  useEffect(() => {
    if (showForm) {
      fetchDepartmentData();
    }
  }, [showForm]);

  // Validate form
  useEffect(() => {
    const { facilityCode, facilityName, departmentId } = formData;
    if (editingFacility) {
      setIsFormValid(
        facilityName.trim() !== "" &&
        departmentId !== ""
      );
    } else {
      setIsFormValid(
        facilityCode.trim() !== "" &&
        facilityName.trim() !== "" &&
        departmentId !== ""
      );
    }
  }, [formData, editingFacility]);

  // Filter data based on search query
  const filteredFacilityData = facilityData.filter(facility =>
    facility.facilityCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    facility.facilityName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    facility.departmentName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchFacilityData = async (flag = 0) => {
    setLoading(true);
    try {
      const data = await getRequest(`${MAS_ITEM_FACILITY}/getAll/${flag}`);
      
      if (data.status === 200 && data.response) {
        setFacilityData(data.response);
        setTotalItems(data.response.length);
        setTotalPages(Math.ceil(data.response.length / DEFAULT_ITEMS_PER_PAGE));
      } else {
        console.error("Unexpected API response format:", data);
        setFacilityData([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error("Error fetching Facility data:", error);
      setFacilityData([]);
      showPopup(FETCH_FACILITY_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentData = async () => {
    try {
      const data = await getRequest(`${GET_ALL_ACT_MAS_DEPT_FOR_DROPDOWN_END_URL}?${REQUEST_PARAM_DEPARTMENT_TYPE_CODE}=${FILTER_OPD_DEPT}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setDepartmentData(data.response);
        return data.response;
      } else {
        console.error("Unexpected API response format:", data);
        setDepartmentData([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
      return [];
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleEdit = async (item) => {
    setEditingFacility(item);
    
    // Fetch departments first to ensure dropdown is populated
    await fetchDepartmentData();
    
    // Set form data from the selected item
    setFormData({
      facilityCode: item.facilityCode || "",
      facilityName: item.facilityName || "",
      departmentId: item.departmentId?.toString() || ""
    });
    
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setProcess(true);
    if (!isFormValid) {
      setProcess(false);
      return;
    }

    const payload = {
      facilityCode: formData.facilityCode,
      facilityName: formData.facilityName,
      departmentId: formData.departmentId ? parseInt(formData.departmentId, 10) : null
    };

    try {
      let response;
      if (editingFacility) {
        response = await putRequest(
          `${MAS_ITEM_FACILITY}/update/${editingFacility.facilityId}`,
          payload
        );
        if (response.status === 200) {
          setPopupMessage({
            message: UPDATE_FACILITY_SUCC_MSG,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              setCurrentPage(1);
            }
          });
        } else {
          throw new Error(response.message || "Update failed");
        }
      } else {
        response = await postRequest(`${MAS_ITEM_FACILITY}/create`, payload);
        if (response.status === 201 || response.status === 200) {
          setPopupMessage({
            message: ADD_FACILITY_SUCC_MSG,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              setCurrentPage(1);
            }
          });
        } else {
          throw new Error(response.message || "Save failed");
        }
      }
    } catch (error) {
      console.error("Error saving Facility:", error);
      showPopup(FAIL_TO_SAVE_CHANGES, "error");
    } finally {
      setProcess(false);
    }
  };

  const resetForm = () => {
    setEditingFacility(null);
    setShowForm(false);
    setFormData({
      facilityCode: "",
      facilityName: "",
      departmentId: ""
    });
  };

  const showPopup = (message, type = "info", onCloseCallback = null) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
                setPopupMessage(null);
                if (onCloseCallback) onCloseCallback();
            },
    });
  };

  const handleSwitchChange = (id, name, newStatus) => {
    setConfirmDialog({ 
      isOpen: true, 
      facilityId: id, 
      newStatus, 
      facilityName: name 
    });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.facilityId !== null) {
      setProcess(true);
      try {
        const response = await putRequest(
          `${MAS_ITEM_FACILITY}/status/${confirmDialog.facilityId}?status=${confirmDialog.newStatus}`
        );

        if (response && response.status === 200) {
          setPopupMessage({
            message: `Facility master ${confirmDialog.newStatus?.toLowerCase() === "y" ? "activated" : "deactivated"} successfully!`,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              fetchFacilityData();
              setCurrentPage(1);
            }
          });
        } else {
          throw new Error(response.message || "Failed to update status");
        }
      } catch (error) {
        console.error("Error updating status:", error);
        showPopup(FAIL_TO_UPDATE_STS, "error");
      } finally {
        setProcess(false);
      }
    }
    setConfirmDialog({ 
      isOpen: false, 
      facilityId: null, 
      newStatus: "", 
      facilityName: "" 
    });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value
    }));
  };

  const handleSelectChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value
    }));
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchFacilityData();
  };

  const handleActivate = async () => {
    if (editingFacility && editingFacility.status?.toLowerCase() === "n") {
      setProcess(true);
      try {
        const response = await putRequest(
          `${MAS_ITEM_FACILITY}/status/${editingFacility.facilityId}?status=y`
        );

        if (response && response.status === 200) {
          showPopup("Facility activated successfully!", "success", () => {
                        fetchFacilityData();
                    });
          resetForm();
          await fetchFacilityData();
          setCurrentPage(1);
        } else {
          throw new Error(response.message || "Failed to activate");
        }
      } catch (error) {
        console.error("Error activating facility:", error);
        showPopup("Failed to activate facility", "error");
      } finally {
        setProcess(false);
      }
    }
  };

  // Get current page items
  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredFacilityData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="content-wrapper">
      <div className="row">
        {loading && <LoadingScreen />}
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">Item Facility Master</h4>

              <div className="d-flex justify-content-between align-items-center gap-2">
                {!showForm && (
                  <>
                    <form className="d-inline-block searchform me-2" role="search">
                      <div className="input-group searchinput">
                        <input
                          type="search"
                          className="form-control"
                          placeholder="Search by code, name or department"
                          aria-label="Search"
                          value={searchQuery}
                          onChange={handleSearchChange}
                        />
                        <span className="input-group-text" id="search-icon">
                          <i className="fa fa-search"></i>
                        </span>
                      </div>
                    </form>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={handleRefresh}
                    >
                      <i className="mdi mdi-refresh"></i> Show All
                    </button>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => {
                        setEditingFacility(null);
                        setFormData({
                          facilityCode: "",
                          facilityName: "",
                          departmentId: ""
                        });
                        setShowForm(true);
                      }}
                    >
                      <i className="mdi mdi-plus"></i> Add
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="card-body">
              {!showForm ? (
                <>
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Facility Code</th>
                          <th>Facility Name</th>
                          <th>Department</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((item) => {
                            return (
                              <tr key={item.facilityId}>
                                <td>{item.facilityCode || '-'}</td>
                                <td style={{ textTransform: "capitalize" }}>{item.facilityName || '-'}</td>
                                <td>{item.departmentName || '-'}</td>
                                <td>
                                  <div className="form-check form-switch">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      checked={item.status?.toLowerCase() === "y"}
                                      onChange={() => handleSwitchChange(
                                        item.facilityId, 
                                        item.facilityName, 
                                        item.status?.toLowerCase() === "y" ? "n" : "y"
                                      )}
                                      id={`switch-${item.facilityId}`}
                                    />
                                    <label
                                      className="form-check-label px-0"
                                      htmlFor={`switch-${item.facilityId}`}
                                    >
                                      {item.status?.toLowerCase() === "y" ? "Active" : "Deactivated"}
                                    </label>
                                  </div>
                                </td>
                                <td>
                                  <button
                                    className="btn btn-sm btn-success me-2"
                                    onClick={() => handleEdit(item)}
                                    disabled={item.status?.toLowerCase() !== "y"}
                                  >
                                    <i className="fa fa-pencil"></i>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center">No records found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {filteredFacilityData.length > 0 && (
                    <Pagination
                      totalItems={filteredFacilityData.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              ) : (
                <>
                  <form className="forms row" onSubmit={handleSave}>
                    <div className="d-flex justify-content-end mb-3">
                      <button type="button" className="btn btn-secondary" onClick={resetForm}>
                        <i className="mdi mdi-arrow-left"></i> Back
                      </button>
                    </div>
                    <div className="row">
                      <div className="form-group col-md-4 mt-3">
                        <label>
                          Facility Code <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="facilityCode"
                          placeholder="Enter facility code"
                          onChange={handleInputChange}
                          value={formData.facilityCode}
                          maxLength={FACILITY_CODE_MAX_LENGTH}
                          required
                          disabled={process || editingFacility}
                        />
                      </div>
                      <div className="form-group col-md-4 mt-3">
                        <label>
                          Facility Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="facilityName"
                          placeholder="Enter facility name"
                          onChange={handleInputChange}
                          value={formData.facilityName}
                          maxLength={FACILITY_NAME_MAX_LENGTH}
                          required
                          disabled={process}
                        />
                      </div>
                      <div className="form-group col-md-4 mt-3">
                        <label>
                          Department <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          id="departmentId"
                          onChange={handleSelectChange}
                          value={formData.departmentId}
                          required
                          disabled={process}
                        >
                          <option value="">Select Department</option>
                          {departmentData.map((department) => (
                            <option key={department.id} value={department.id}>
                              {department.departmentName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                      <button
                        type="submit"
                        className="btn btn-primary me-2"
                        disabled={process || !isFormValid}
                      >
                        {process ? "Processing..." : (editingFacility ? 'Update' : 'Save')}
                      </button>
                      
                      {editingFacility && editingFacility.status?.toLowerCase() === "n" && (
                        <button
                          type="button"
                          className="btn btn-success me-2"
                          onClick={handleActivate}
                          disabled={process}
                        >
                          Activate
                        </button>
                      )}
                      
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={resetForm}
                        disabled={process}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </>
              )}
              {popupMessage && (
                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
              )}
              {confirmDialog.isOpen && (
                <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button type="button" className="btn-close" onClick={() => handleConfirm(false)} aria-label="Close"></button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to {confirmDialog.newStatus?.toLowerCase() === "y" ? "activate" : "deactivate"}{" "}
                          <strong>
                            {confirmDialog.facilityName}
                          </strong>
                          {" "}facility?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)} disabled={process}>
                          Cancel
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)} disabled={process}>
                          {process ? "Processing..." : "Confirm"}
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

export default ItemFacility;