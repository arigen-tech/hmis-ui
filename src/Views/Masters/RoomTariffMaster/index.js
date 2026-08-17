import { useState, useEffect, useMemo } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import {
  MAS_ROOM,
  MAS_WARD_GET_ALL_ACTIVE,
  MAS_WARD_ROOM_TARIFF,
} from "../../../config/apiConfig";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import {
  ADD_TARIFF_SUCC_MSG,
  UPDATE_TARIFF_SUCC_MSG,
  FAIL_TO_SAVE_CHANGES,
  FAIL_TO_UPDATE_STS,
  FETCH_TARIFF_DATA_ERR_MSG,
  FETCH_DROP_DOWN_ERR_MSG,
} from "../../../config/constants";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const RoomTariffMaster = () => {
  const [tariffData, setTariffData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    tariffId: null,
    newStatus: "",
    name: "",
  });

  const [formData, setFormData] = useState({
    wardId: "",
    roomId: "",
    tariff: "",
    effectiveFrom: "",
    effectiveTo: "",
  });

  const [filterWardId, setFilterWardId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [dateError, setDateError] = useState("");
  const [editingTariff, setEditingTariff] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Dropdown options
  const [wardOptions, setWardOptions] = useState([]);
  const [roomOptions, setRoomOptions] = useState([]);
  const [formRoomOptions, setFormRoomOptions] = useState([]);

  const normalizeStatus = (status) =>
    typeof status === "string" ? status.trim().toLowerCase() : status;

  const isStatusActive = (status) => normalizeStatus(status) === "y";

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  // Convert a date string (any format returned by API) into yyyy-MM-dd for <input type="date">
  const toInputDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  // ---------------- Fetch dropdown data (Ward + Room) ----------------
  const fetchDropdownData = async () => {
    try {
      // Wards
      const wardResponse = await getRequest(MAS_WARD_GET_ALL_ACTIVE);
      if (wardResponse && wardResponse.response) {
        setWardOptions(
          wardResponse.response.map((ward) => ({
            id: ward.wardId,
            name: ward.wardName,
          }))
        );
      }

      // Rooms
      const roomResponse = await getRequest(`${MAS_ROOM}/all/1`);
      if (roomResponse && roomResponse.response) {
        setRoomOptions(
          roomResponse.response.map((room) => ({
            id: room.roomId,
            name: room.roomName,
            wardId: room.departmentId, // room master ties to ward via departmentId
            wardName: room.wardName || "N/A",
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
      showPopup(FETCH_DROP_DOWN_ERR_MSG, "error");
    }
  };

  // ---------------- Fetch tariff data ----------------
  const fetchTariffData = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_WARD_ROOM_TARIFF}/getAll/${flag}`);
      if (response && response.response) {
        // ADJUST FIELD NAMES HERE if your backend response differs
        const mappedData = response.response.map((item) => ({
          id: item.id ?? item.tariffId,
          wardId: item.wardId,
          wardName: item.wardName || "N/A",
          roomId: item.roomId,
          roomNo: item.roomNo || item.roomName || "N/A",
          tariff: item.tariff,
          effectiveFrom: item.effectiveFrom,
          effectiveTo: item.effectiveTo,
          status: item.status,
          lastUpdated: formatDate(item.lastUpdateDate),
        }));
        setTariffData(mappedData);
      }
    } catch (err) {
      console.error("Error fetching room tariff data:", err);
      showPopup(FETCH_TARIFF_DATA_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Initial load ----------------
  useEffect(() => {
    fetchTariffData(0);
    fetchDropdownData();
  }, []);

  // ---------------- Filter rooms for the FORM based on selected ward ----------------
  useEffect(() => {
    if (formData.wardId) {
      const filtered = roomOptions.filter(
        (room) => room.wardId === parseInt(formData.wardId)
      );
      setFormRoomOptions(filtered);

      if (formData.roomId) {
        const stillValid = filtered.find(
          (room) => room.id === parseInt(formData.roomId)
        );
        if (!stillValid) {
          setFormData((prev) => ({ ...prev, roomId: "" }));
        }
      }
    } else {
      setFormRoomOptions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.wardId, roomOptions]);

  // ---------------- Validate form ----------------
  const isDateRangeValid = (fromDate, toDate) => {
    if (!fromDate || !toDate) return true;
    return new Date(fromDate) <= new Date(toDate);
  };

  useEffect(() => {
    const { wardId, roomId, tariff, effectiveFrom, effectiveTo } = formData;
    const hasRequired =
      wardId.toString().trim() !== "" &&
      roomId.toString().trim() !== "" &&
      tariff.toString().trim() !== "" &&
      effectiveFrom !== "" &&
      effectiveTo !== "";

    if (!hasRequired) {
      setDateError("");
      setIsFormValid(false);
      return;
    }

    if (!isDateRangeValid(effectiveFrom, effectiveTo)) {
      setDateError("From Date date must be before or equal to To date date.");
      setIsFormValid(false);
      return;
    }

    setDateError("");
    setIsFormValid(true);
  }, [formData]);

  // ---------------- Filter (search) + sort ----------------
  const filteredTariffData = tariffData
    .filter((item) => {
      const matchesWard = filterWardId
        ? item.wardId === parseInt(filterWardId)
        : true;
      const matchesSearch =
        item.wardName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.roomNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tariff?.toString().includes(searchQuery);
      return matchesWard && matchesSearch;
    })
    .sort((a, b) => {
      if (normalizeStatus(a.status) === normalizeStatus(b.status)) return 0;
      return isStatusActive(a.status) ? -1 : 1;
    });

  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredTariffData.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterWardId]);

  // ---------------- Form helpers ----------------
  const resetForm = () => {
    setFormData({
      wardId: "",
      roomId: "",
      tariff: "",
      effectiveFrom: "",
      effectiveTo: "",
    });
    setIsFormValid(false);
    setDateError("");
    setEditingTariff(null);
  };

  const handleEdit = (item) => {
    setEditingTariff(item);
    setFormData({
      wardId: item.wardId?.toString() || "",
      roomId: item.roomId?.toString() || "",
      tariff: item.tariff?.toString() || "",
      effectiveFrom: toInputDate(item.effectiveFrom),
      effectiveTo: toInputDate(item.effectiveTo),
    });
    setShowForm(true);
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

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setSaving(true);

    try {
      const requestData = {
        wardId: parseInt(formData.wardId),
        roomId: parseInt(formData.roomId),
        tariff: parseFloat(formData.tariff),
        effectiveFrom: formData.effectiveFrom,
        effectiveTo: formData.effectiveTo,
      };

      if (editingTariff) {
        const response = await putRequest(
          `${MAS_WARD_ROOM_TARIFF}/update/${editingTariff.id}`,
          requestData
        );

        if (response && response.status === 200) {
          setPopupMessage({
            message: UPDATE_TARIFF_SUCC_MSG,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              fetchTariffData();
              setShowForm(false);
            },
          });
        } else {
          throw new Error(response.message || "Update failed");
        }
      } else {
        const response = await postRequest(
          `${MAS_WARD_ROOM_TARIFF}/create`,
          requestData
        );

        if (response.status === 201 || response.status === 200) {
          setPopupMessage({
            message: ADD_TARIFF_SUCC_MSG,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              resetForm();
              fetchTariffData();
              setShowForm(false);
            },
          });
        } else {
          throw new Error(response.message || "Save failed");
        }
      }
    } catch (err) {
      console.error("Error saving room tariff data:", err);
      showPopup(err.response?.data?.message || FAIL_TO_SAVE_CHANGES, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchChange = (id, currentStatus, name) => {
    const newStatus = isStatusActive(currentStatus) ? "n" : "y";
    setConfirmDialog({ isOpen: true, tariffId: id, newStatus, name });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.tariffId !== null) {
      setSaving(true);
      try {
        const response = await putRequest(
          `${MAS_WARD_ROOM_TARIFF}/status/${confirmDialog.tariffId}?status=${confirmDialog.newStatus}`
        );

        if (response && response.status === 200) {
          setPopupMessage({
            message: `Tariff for "${confirmDialog.name}" ${
              isStatusActive(confirmDialog.newStatus) ? "activated" : "deactivated"
            } successfully!`,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              fetchTariffData();
            },
          });
        } else {
          throw new Error(response.message || "Failed to update status");
        }
      } catch (err) {
        console.error("Error updating tariff status:", err);
        showPopup(FAIL_TO_UPDATE_STS, "error");
      } finally {
        setSaving(false);
      }
    }

    setConfirmDialog({ isOpen: false, tariffId: null, newStatus: "", name: "" });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFilterWardChange = (e) => {
    setFilterWardId(e.target.value);
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setFilterWardId("");
    setCurrentPage(1);
    fetchTariffData();
    fetchDropdownData();
  };

  // Rooms shown in the list-view ward filter don't need a separate list; wardOptions is enough.

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Room Tariff Master</h4>
              <div className="d-flex align-items-center">
                {!showForm && (
                  <>
                  
                    <input
                      className="form-control w-50 me-2"
                      placeholder="Search"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </>
                )}

                {!showForm ? (
                  <>
                    <button
                      className="btn btn-success me-2"
                      onClick={() => {
                        resetForm();
                        setShowForm(true);
                      }}
                    >
                      Add
                    </button>
                    <button className="btn btn-success flex-shrink-0" onClick={handleRefresh}>
                      Show All
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                  >
                    Back
                  </button>
                )}
              </div>
            </div>

            <div className="card-body">
              {loading && !showForm && <LoadingScreen />}

              {!showForm && !loading && (
                <>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Ward</th>
                          <th>Room No</th>
                          <th>Tariff (₹)</th>
                          <th>From Date</th>
                          <th>To date</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((item) => (
                            <tr key={item.id}>
                              <td>{item.wardName}</td>
                              <td>{item.roomNo}</td>
                              <td>₹{Number(item.tariff).toFixed(2)}</td>
                              <td>{formatDate(item.effectiveFrom)}</td>
                              <td>{formatDate(item.effectiveTo)}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={isStatusActive(item.status)}
                                    onChange={() =>
                                      handleSwitchChange(item.id, item.status, item.roomNo)
                                    }
                                    id={`switch-${item.id}`}
                                  />
                                  <label
                                    className="form-check-label ms-2"
                                    htmlFor={`switch-${item.id}`}
                                  >
                                    {isStatusActive(item.status) ? "Active" : "Inactive"}
                                  </label>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleEdit(item)}
                                  disabled={!isStatusActive(item.status)}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="text-center">
                              No Records Found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    totalItems={filteredTariffData.length}
                    itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                  />
                </>
              )}

              {showForm && (
                <form className="row" onSubmit={handleSave}>
                  <div className="form-group col-md-4">
                    <label>
                      Ward <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select mt-1"
                      id="wardId"
                      name="wardId"
                      value={formData.wardId}
                      onChange={handleSelectChange}
                      required
                      disabled={wardOptions.length === 0}
                    >
                      <option value="">Select Ward</option>
                      {wardOptions.map((ward) => (
                        <option key={ward.id} value={ward.id}>
                          {ward.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group col-md-4">
                    <label>
                      Room <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select mt-1"
                      id="roomId"
                      name="roomId"
                      value={formData.roomId}
                      onChange={handleSelectChange}
                      required
                      disabled={!formData.wardId || formRoomOptions.length === 0}
                    >
                      <option value="">Select Room</option>
                      {formRoomOptions.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group col-md-4">
                    <label>
                      Tariff (₹) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control mt-1"
                      id="tariff"
                      name="tariff"
                      placeholder="Enter tariff amount"
                      value={formData.tariff}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group col-md-4 mt-3">
                    <label>
                      From Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control mt-1"
                      id="effectiveFrom"
                      name="effectiveFrom"
                      value={formData.effectiveFrom}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group col-md-4 mt-3">
                    <label>
                      To date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control mt-1"
                      id="effectiveTo"
                      name="effectiveTo"
                      value={formData.effectiveTo}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {dateError && (
                    <div className="col-md-12 mt-2">
                      <p className="text-danger mb-0">{dateError}</p>
                    </div>
                  )}

                  <div className="form-group col-md-12 mt-3 d-flex justify-content-end">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid || saving}
                    >
                      {saving ? "Saving..." : editingTariff ? "Update" : "Save"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => {
                        resetForm();
                        setShowForm(false);
                      }}
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
                <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-body">
                        Are you sure you want to{" "}
                        {isStatusActive(confirmDialog.newStatus) ? "activate" : "deactivate"}{" "}
                        the tariff for <strong>{confirmDialog.name}</strong>?
                      </div>
                      <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={() => handleConfirm(false)}>
                          No
                        </button>
                        <button className="btn btn-primary" onClick={() => handleConfirm(true)}>
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

export default RoomTariffMaster;
