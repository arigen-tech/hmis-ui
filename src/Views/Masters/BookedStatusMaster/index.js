import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import { OB_BOOKED_STATUS } from "../../../config/apiConfig"; // You need to add this to your apiConfig
import LoadingScreen from "../../../Components/Loading";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import {
  ADD_BOOKED_STATUS_SUCC_MSG,
  DUPLICATE_BOOKED_STATUS,
  FAIL_TO_SAVE_CHANGES,
  FAIL_TO_UPDATE_STS,
  FETCH_BOOKED_STATUS_ERR_MSG,
  UPDATE_BOOKED_STATUS_SUCC_MSG
} from "../../../config/constants"; // You need to add these constants
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const BookedStatusMaster = () => {
  const [bookedStatusData, setBookedStatusData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    id: null, 
    newStatus: false, 
    bookedStatus: "" 
  });
  const [popupMessage, setPopupMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [formData, setFormData] = useState({
    bookedStatus: "",
  });
  const [loading, setLoading] = useState(true);

  const BOOKED_STATUS_MAX_LENGTH = 50;

  useEffect(() => {
    fetchBookedStatusData(0);
  }, []);

  // Function to format date as dd-MM-YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "N/A";
      }

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  const fetchBookedStatusData = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${OB_BOOKED_STATUS}/getAll/${flag}`);
      if (response && response.response) {
        const mappedData = response.response.map(item => ({
          id: item.id,
          bookedStatus: item.bookedStatus,
          status: item.status,
          lastUpdated: formatDate(item.lastUpdateDate)
        }));
        setBookedStatusData(mappedData);
      }
    } catch (err) {
      console.error("Error fetching booked status data:", err);
      showPopup(FETCH_BOOKED_STATUS_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredBookedStatus = (bookedStatusData || []).filter(
    (bookedStatus) =>
      bookedStatus?.bookedStatus?.toLowerCase().includes(searchQuery?.toLowerCase() || "")
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredBookedStatus.slice(indexOfFirst, indexOfLast);

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      bookedStatus: record.bookedStatus,
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);

      const isDuplicate = bookedStatusData.some(
        (bookedStatus) =>
          bookedStatus.bookedStatus.toLowerCase() === formData.bookedStatus.toLowerCase() &&
          (!editingRecord || editingRecord.id !== bookedStatus.id)
      );

      if (isDuplicate && !editingRecord) {
        showPopup(DUPLICATE_BOOKED_STATUS, "error");
        setLoading(false);
        return;
      }

      if (editingRecord) {
        const response = await putRequest(`${OB_BOOKED_STATUS}/update/${editingRecord.id}`, {
          bookedStatus: formData.bookedStatus,
        });

        if (response && response.status === 200) {
          fetchBookedStatusData();
          showPopup(UPDATE_BOOKED_STATUS_SUCC_MSG, "success");
        }
      } else {
        const response = await postRequest(`${OB_BOOKED_STATUS}/create`, {
          bookedStatus: formData.bookedStatus,
        });

        if (response && response.status === 200) {
          fetchBookedStatusData();
          showPopup(ADD_BOOKED_STATUS_SUCC_MSG, "success");
        }
      }

      setEditingRecord(null);
      setFormData({ bookedStatus: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving booked status:", err);
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

  const handleSwitchChange = (id, newStatus, bookedStatus) => {
    setConfirmDialog({ isOpen: true, id: id, newStatus, bookedStatus });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.id !== null) {
      try {
        setLoading(true);
        const response = await putRequest(
          `${OB_BOOKED_STATUS}/status/${confirmDialog.id}?status=${confirmDialog.newStatus}`
        );
        if (response && response.response) {
          setBookedStatusData((prevData) =>
            prevData.map((bookedStatus) =>
              bookedStatus.id === confirmDialog.id
                ? { ...bookedStatus, status: confirmDialog.newStatus }
                : bookedStatus
            )
          );
          showPopup(
            `Booked Status ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
            "success"
          );
        }
      } catch (err) {
        console.error("Error updating booked status:", err);
        showPopup(FAIL_TO_UPDATE_STS, "error");
      } finally {
        setLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: null, bookedStatus: "" });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
    setIsFormValid(formData.bookedStatus.trim() !== "");
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchBookedStatusData();
  };

  const handleBack = () => {
    setEditingRecord(null);
    setFormData({ bookedStatus: "" });
    setShowForm(false);
    setIsFormValid(false);
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Booked Status Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm ? (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search Booked Status"
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
                      <button type="button" className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                        <i className="mdi mdi-plus"></i> Add
                      </button>
                      <button type="button" className="btn btn-success me-2 flex-shrink-0" onClick={handleRefresh}>
                        <i className="mdi mdi-refresh"></i> Show All
                      </button>
                    </>
                  ) : (
                    <button type="button" className="btn btn-secondary" onClick={handleBack}>
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
                          <th>Booked Status</th>
                          <th>Last Updated</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((bookedStatus) => (
                            <tr key={bookedStatus.id}>
                              <td>{bookedStatus.bookedStatus}</td>
                              <td>{bookedStatus.lastUpdated}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={bookedStatus.status === "y"}
                                    onChange={() => handleSwitchChange(
                                      bookedStatus.id, 
                                      bookedStatus.status === "y" ? "n" : "y", 
                                      bookedStatus.bookedStatus
                                    )}
                                    id={`switch-${bookedStatus.id}`}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${bookedStatus.id}`}
                                  >
                                    {bookedStatus.status === "y" ? "Active" : "Deactivated"}
                                  </label>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(bookedStatus)}
                                  disabled={bookedStatus.status !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center">
                              No booked status data found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* PAGINATION USING REUSABLE COMPONENT */}
                  {filteredBookedStatus.length > 0 && (
                    <Pagination
                      totalItems={filteredBookedStatus.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="form-group col-md-6">
                    <label>Booked Status <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="bookedStatus"
                      placeholder="Enter Booked Status"
                      value={formData.bookedStatus}
                      onChange={handleInputChange}
                      maxLength={BOOKED_STATUS_MAX_LENGTH}
                      required
                    />
                  </div>
                  <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                    <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                      Save
                    </button>
                    <button type="button" className="btn btn-danger" onClick={handleBack}>
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
                          Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                          <strong>{confirmDialog.bookedStatus}</strong>?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>
                          No
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>
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

export default BookedStatusMaster;