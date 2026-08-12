import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import LoadingScreen from "../../../Components/Loading/index";
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import { MAS_SURGERY_TYPE } from "../../../config/apiConfig";
import { ADD_SURGERY_TYPE_SUCC_MSG, UPDATE_SURGERY_TYPE_SUCC_MSG, FAIL_TO_SAVE_CHANGES, FAIL_TO_UPDATE_STS } from "../../../config/constants"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination"

const SurgeryTypeMaster = () => {
  const [formData, setFormData] = useState({
    surgeryTypeCode: "",
    surgeryTypeName: "",
    description: ""
  })

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    surgeryTypeId: null,
    newStatus: "",
    surgeryTypeName: ""
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [surgeryTypeData, setSurgeryTypeData] = useState([])
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)
  const [editingSurgeryType, setEditingSurgeryType] = useState(null)
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [process, setProcess] = useState(false);

  const SURGERY_TYPE_CODE_MAX_LENGTH = 10;
  const SURGERY_TYPE_NAME_MAX_LENGTH = 100;
  const DESCRIPTION_MAX_LENGTH = 500;

  useEffect(() => {
    fetchSurgeryTypeData();
  }, []);

  useEffect(() => {
    const { surgeryTypeCode, surgeryTypeName } = formData;
    setIsFormValid(
      surgeryTypeCode.trim() !== "" &&
      surgeryTypeName.trim() !== ""
    );
  }, [formData]);

  const filteredSurgeryTypeData = surgeryTypeData.filter(item =>
    item.surgeryTypeCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.surgeryTypeName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchSurgeryTypeData = async () => {
    setLoading(true);
    try {
      const data = await getRequest(`${MAS_SURGERY_TYPE}/getAll/0`);

      if (data.status === 200 && data.response) {
        setSurgeryTypeData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setSurgeryTypeData([]);
      }
    } catch (error) {
      console.error("Error fetching Surgery Type data:", error);
      setSurgeryTypeData([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleEdit = (item) => {
    setEditingSurgeryType(item);
    setFormData({
      surgeryTypeCode: item.surgeryTypeCode || "",
      surgeryTypeName: item.surgeryTypeName || "",
      description: item.description || ""
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
      surgeryTypeCode: formData.surgeryTypeCode,
      surgeryTypeName: formData.surgeryTypeName,
      description: formData.description
    };

    try {
      let response;
      if (editingSurgeryType) {
        response = await putRequest(
          `${MAS_SURGERY_TYPE}/update/${editingSurgeryType.surgeryTypeId}`,
          payload
        );
        if (response.status === 200) {
          setPopupMessage({
            message: UPDATE_SURGERY_TYPE_SUCC_MSG,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              setCurrentPage(1);
              fetchSurgeryTypeData();
            }
          });
        } else {
          throw new Error(response.message || "Update failed");
        }
      } else {
        response = await postRequest(`${MAS_SURGERY_TYPE}/create`, payload);
        if (response.status === 201 || response.status === 200) {
          setPopupMessage({
            message: ADD_SURGERY_TYPE_SUCC_MSG,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              setCurrentPage(1);
            }
          });
          fetchSurgeryTypeData();
        } else {
          throw new Error(response.message || "Save failed");
        }
      }
    } catch (error) {
      console.error("Error saving Surgery Type:", error);
      showPopup(FAIL_TO_SAVE_CHANGES, "error");
    } finally {
      setProcess(false);
    }
  };

  const resetForm = () => {
    setEditingSurgeryType(null);
    setShowForm(false);
    setFormData({
      surgeryTypeCode: "",
      surgeryTypeName: "",
      description: ""
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
      surgeryTypeId: id,
      newStatus,
      surgeryTypeName: name
    });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.surgeryTypeId !== null) {
      setProcess(true);
      try {
        const response = await putRequest(
          `${MAS_SURGERY_TYPE}/status/${confirmDialog.surgeryTypeId}?status=${confirmDialog.newStatus}`
        );

        if (response && response.status === 200) {
          setPopupMessage({
            message: `Surgery type ${confirmDialog.newStatus?.toLowerCase() === "y" ? "activated" : "deactivated"} successfully!`,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              fetchSurgeryTypeData();
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
      surgeryTypeId: null,
      newStatus: "",
      surgeryTypeName: ""
    });
  };

  const handleInputChange = (e) => {
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
    fetchSurgeryTypeData();
  };

  const handleActivate = async () => {
    if (editingSurgeryType && editingSurgeryType.status?.toLowerCase() === "n") {
      setProcess(true);
      try {
        const response = await putRequest(
          `${MAS_SURGERY_TYPE}/status/${editingSurgeryType.surgeryTypeId}?status=y`
        );

        if (response && response.status === 200) {
          showPopup("Surgery type activated successfully!", "success", () => {
            fetchSurgeryTypeData();
          });
          resetForm();
          await fetchSurgeryTypeData();
          setCurrentPage(1);
        } else {
          throw new Error(response.message || "Failed to activate");
        }
      } catch (error) {
        console.error("Error activating surgery type:", error);
        showPopup("Failed to activate surgery type", "error");
      } finally {
        setProcess(false);
      }
    }
  };

  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredSurgeryTypeData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="content-wrapper">
      <div className="row">
        {loading && <LoadingScreen />}
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">Surgery Type Master</h4>

              {/* Header buttons – Back button when form is shown, else search + action buttons */}
              <div className="d-flex align-items-center gap-2">
                {!showForm ? (
                  <>
                    <form className="d-inline-block searchform me-2" role="search">
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
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => {
                        setEditingSurgeryType(null);
                        setFormData({
                          surgeryTypeCode: "",
                          surgeryTypeName: "",
                          description: ""
                        });
                        setShowForm(true);
                      }}
                    >
                      <i className="mdi mdi-plus"></i> Add
                    </button>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={handleRefresh}
                    >
                      <i className="mdi mdi-refresh"></i> Show All
                    </button>
                    
                  </>
                ) : (
                  <button
                    className="btn btn-secondary"
                    onClick={resetForm}
                  >
                    <i className="mdi mdi-arrow-left"></i> Back
                  </button>
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
                          <th>Surgery Type Code</th>
                          <th>Surgery Type Name</th>
                          <th>Description</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((item) => (
                            <tr key={item.surgeryTypeId}>
                              <td>{item.surgeryTypeCode || '-'}</td>
                              <td style={{ textTransform: "capitalize" }}>{item.surgeryTypeName || '-'}</td>
                              <td>{item.description || '-'}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={item.status?.toLowerCase() === "y"}
                                    onChange={() => handleSwitchChange(
                                      item.surgeryTypeId,
                                      item.surgeryTypeName,
                                      item.status?.toLowerCase() === "y" ? "n" : "y"
                                    )}
                                    id={`switch-${item.surgeryTypeId}`}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${item.surgeryTypeId}`}
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
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center">No records found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {filteredSurgeryTypeData.length > 0 && (
                    <Pagination
                      totalItems={filteredSurgeryTypeData.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              ) : (
                <>
                  {/* Back button removed from here – now in header */}
                  <form className="forms row" onSubmit={handleSave}>
                    <div className="row">
                      <div className="form-group col-md-6 mt-3">
                        <label>
                          Surgery Type Code <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="surgeryTypeCode"
                          placeholder="Enter surgery type code"
                          onChange={handleInputChange}
                          value={formData.surgeryTypeCode}
                          maxLength={SURGERY_TYPE_CODE_MAX_LENGTH}
                          required
                          disabled={process}
                        />
                      </div>
                      <div className="form-group col-md-6 mt-3">
                        <label>
                          Surgery Type Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="surgeryTypeName"
                          placeholder="Enter surgery type name"
                          onChange={handleInputChange}
                          value={formData.surgeryTypeName}
                          maxLength={SURGERY_TYPE_NAME_MAX_LENGTH}
                          required
                          disabled={process}
                        />
                      </div>
                      <div className="form-group col-md-12 mt-3">
                        <label>Description</label>
                        <textarea
                          className="form-control"
                          id="description"
                          placeholder="Enter description"
                          onChange={handleInputChange}
                          value={formData.description}
                          maxLength={DESCRIPTION_MAX_LENGTH}
                          rows={3}
                          disabled={process}
                        />
                      </div>
                    </div>

                    <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                      <button
                        type="submit"
                        className="btn btn-primary me-2"
                        disabled={process || !isFormValid}
                      >
                        {process ? "Processing..." : (editingSurgeryType ? 'Update' : 'Save')}
                      </button>

                      {editingSurgeryType && editingSurgeryType.status?.toLowerCase() === "n" && (
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
                          <strong>{confirmDialog.surgeryTypeName}</strong>
                          {" "}surgery type?
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
  )
}

export default SurgeryTypeMaster