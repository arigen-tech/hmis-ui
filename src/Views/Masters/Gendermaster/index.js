import { useState, useEffect } from "react"
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading"
import axios from "axios";
import { API_HOST, MAS_GENDER } from "../../../config/apiConfig";
import { postRequest, putRequest, getRequest } from "../../../service/apiService"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import {
  FETCH_GENDER_ERR_MSG,
  UPDATE_GENDER_SUCC_MSG,
  ADD_GENDER_SUCC_MSG,
  FAIL_TO_SAVE_CHANGES,
  FAIL_TO_UPDATE_STS,
  DUPLICATE_GENDER_MSG,
} from "../../../config/constants";


const Gendermaster = () => {
  const [genderData, setGenderData] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, genderId: null, newStatus: false });
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    genderCode: "",
    genderName: "",
  })
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingGender, setEditingGender] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const Gender_NAME_MAX_LENGTH = 30;
  const Gender_Code_MAX_LENGTH = 1;




  useEffect(() => {
    fetchGenderData(0);
  }, []);

  const fetchGenderData = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_GENDER}/getAll/${flag}`);

      if (response && response.response) {

        const transformedData = response.response.map(gender => ({
          id: gender.id,
          genderCode: gender.genderCode,
          genderName: gender.genderName,
          status: gender.status
        }));

        setGenderData(transformedData);
      }
    } catch (err) {
      console.error("Error fetching gender data:", err);
      showPopup(FETCH_GENDER_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  };


  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredGenderData = genderData.filter(gender =>
    gender.genderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gender.genderCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredGenderData.slice(indexOfFirstItem, indexOfLastItem);

  const handleEdit = (gender) => {
    setEditingGender(gender);
    setFormData({
      genderCode: gender.genderCode,
      genderName: gender.genderName
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  const resetForm = () => {
  setFormData({
    genderCode: "",
    genderName: "",
  });

  setEditingGender(null);
};

 const handleSave = async (e) => {
  e.preventDefault();
  //setLoading(true);

  if (!isFormValid) {
    setLoading(false);
    return;
  }

  try {
    const payload = {
      genderCode: formData.genderCode.trim(),
      genderName: formData.genderName.trim(),
      code: null,
    };

    // For new record only
    if (!editingGender) {
      payload.status = "y";
    } else {
      payload.status = editingGender.status;
      payload.id = editingGender.id;
    }

    let response;

    if (editingGender) {
      response = await putRequest(
        `${MAS_GENDER}/updateById/${editingGender.id}`,
        payload
      );

      if (response.status === 200) {
        setPopupMessage({
          message: UPDATE_GENDER_SUCC_MSG,
          type: "success",
          onClose: () => {
            setPopupMessage(null);
            resetForm();
            setShowForm(false);
          },
        });
      } else {
        throw new Error(response.message || "Update failed");
      }

    } else {

      const isDuplicate = genderData.some(
        (gender) =>
          gender.genderCode.toLowerCase() ===
            formData.genderCode.toLowerCase() ||
          gender.genderName.toLowerCase() ===
            formData.genderName.toLowerCase()
      );

      if (isDuplicate) {
        showPopup(DUPLICATE_GENDER_MSG, "error");
        setLoading(false);
        return;
      }

      response = await postRequest(
        `${MAS_GENDER}/create`,
        payload
      );

      if (response.status === 201 || response.status === 200) {
        setPopupMessage({
          message: ADD_GENDER_SUCC_MSG,
          type: "success",
          onClose: () => {
            setPopupMessage(null);
            resetForm();
            setShowForm(false);
          },
        });
      } else {
        throw new Error(response.message || "Save failed");
      }
    }

  } catch (error) {
    console.error("Save error:", error);

    showPopup(
      error.response?.data?.message || FAIL_TO_SAVE_CHANGES,
      "error"
    );

  } finally {
    //setLoading(false);
  }
};
  const showPopup = (message, type = 'info', onCloseCallback = null) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
                setPopupMessage(null);
                if (onCloseCallback) onCloseCallback();
            }
    });
  };

  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, genderId: id, newStatus });
  };

  const [saving, setSaving] = useState(false);
  
 const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.genderId !== null) {
        setSaving(true);

        try {
            const response = await putRequest(
                `${MAS_GENDER}/status/${confirmDialog.genderId}?status=${confirmDialog.newStatus}`
            );

            if (response && response.status === 200) {
                setPopupMessage({
                    message: `Gender "${
                        confirmDialog.name
                    }" ${
                        confirmDialog.newStatus?.toLowerCase() === "y"
                            ? "activated"
                            : "deactivated"
                    } successfully!`,
                    type: "success",
                    onClose: () => {
                        setPopupMessage(null);
                        resetForm();
                        fetchGenderData();
                        setCurrentPage(1);
                    },
                });
            } else {
                throw new Error(
                    response.message || "Failed to update gender status"
                );
            }
        } catch (err) {
            console.error("Error updating gender status:", err);
            showPopup(FAIL_TO_UPDATE_STS, "error");
        } finally {
            setSaving(false);
        }
    }

    setConfirmDialog({
        isOpen: false,
        genderId: null,
        newStatus: "",
        name: "",
    });
};

 
  
const handleInputChange = (e) => {
  const { id, value } = e.target;

  const updated = {
    ...formData,
    [id]: value
  };

  setFormData(updated);

  setIsFormValid(
    updated.genderCode.trim() !== "" &&
    updated.genderName.trim() !== ""
  );
};

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchGenderData();
  };


  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Gender Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm ? (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search"
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
                          setEditingGender(null);
                          setFormData({ genderCode: "", genderName: "" });
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
                          <th>Gender Code</th>
                          <th>Gender Name</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((gender) => (
                            <tr key={gender.id}>
                              <td>{gender.genderCode}</td>
                              <td>{gender.genderName}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={gender.status?.toLowerCase() === "y"}
                                    onChange={() => handleSwitchChange(gender.id, gender.status?.toLowerCase() === "y" ? "n" : "y")}
                                    id={`switch-${gender.id}`}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${gender.id}`}
                                  >
                                    {gender.status?.toLowerCase() === "y" ? 'Active' : 'Deactivated'}
                                  </label>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(gender)}
                                  disabled={gender.status?.toLowerCase() !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center">No gender data found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* PAGINATION USING REUSABLE COMPONENT */}
                  {filteredGenderData.length > 0 && (
                    <Pagination
                      totalItems={filteredGenderData.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  
                    <div className="form-group col-md-4">
                      <label>Gender Code <span className="text-danger">*</span></label>
                     <input
  type="text"
  className="form-control mt-1"
  id="genderCode"
  name="genderCode"
  value={formData.genderCode}
  onChange={handleInputChange}
  maxLength={Gender_Code_MAX_LENGTH}
  required
  disabled={!!editingGender}
/>
                    </div>
      
                  <div className="form-group col-md-4">
                    <label>Gender Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control  mt-1"
                      id="genderName"
                      name="genderName"
                      placeholder="Gender Name"
                      value={formData.genderName}
                      onChange={handleInputChange}
                      maxLength={Gender_NAME_MAX_LENGTH}
                      required
                    />
                  </div>
                  <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                    <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                      {editingGender ? "Update" : "Save"}
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
                        <h1 className="modal-title fs-5" id="staticBackdropLabel">Gender Reports</h1>
                        <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                      </div>
                      <div className="modal-body">
                        <p>Generate reports for gender data:</p>
                        <div className="list-group">
                          <button type="button" className="list-group-item list-group-item-action">Gender Distribution Report</button>
                          <button type="button" className="list-group-item list-group-item-action">Active/Inactive Gender Status Report</button>
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                        <button type="button" className="btn btn-primary">Generate Report</button>
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
                          Are you sure you want to {confirmDialog.newStatus?.toLowerCase() === "y" ? 'activate' : 'deactivate'} <strong>{genderData.find(gender => gender.id === confirmDialog.genderId)?.genderName}</strong>?
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