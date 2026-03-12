import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, {
  DEFAULT_ITEMS_PER_PAGE,
} from "../../../Components/Pagination";
import {
  MAS_BLOOD_TEST,
  MAS_BLOOD_COLLECTION_TYPE,
} from "../../../config/apiConfig";
import {
  getRequest,
  putRequest,
  postRequest,
} from "../../../service/apiService";
import {
  FETCH_BLOOD_TEST,
  ADD_BLOOD_TEST,
  UPDATE_BLOOD_TEST,
  FAIL_BLOOD_TEST,
  DUPLICATE_BLOOD_TEST,
  UPDATE_FAIL_BLOOD_TEST,
  FETCH_COLLECTION_TYPE_ERROR,
  STATUS,
} from "../../../config/constants";

const BloodTestMaster = () => {
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    record: null,
    newStatus: "",
  });
  const [collectionTypes, setCollectionTypes] = useState([]);
  const [popupMessage, setPopupMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [formData, setFormData] = useState({
    bloodTestId: "",
    testName: "",
    testCode: "",
    isMandatory: "",
    collectionType: "",
  });
  const [loading, setLoading] = useState(false);
  const MAX_LENGTH = 50;

  // Date format function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return "N/A";
    }
  };

  // Show popup
  const showPopup = (message, type = "success") => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const { response } = await getRequest(`${MAS_BLOOD_TEST}/getAll/${flag}`);
      setData(response || []);
    } catch {
      showPopup(FETCH_BLOOD_TEST, "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectionTypes = async (flag = 0) => {
    try {
      const { response } = await getRequest(
        `${MAS_BLOOD_COLLECTION_TYPE}/getAll/${flag}`,
      );
      setCollectionTypes(response || []);
    } catch {
      showPopup(FETCH_COLLECTION_TYPE_ERROR, "error");
    }
  };

  useEffect(() => {
    fetchData();
    fetchCollectionTypes();
  }, []);

  // Search
  const filteredData = data.filter(
    (rec) =>
      (rec?.testName ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec?.testCode ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const currentItems = filteredData.slice(
    (currentPage - 1) * DEFAULT_ITEMS_PER_PAGE,
    currentPage * DEFAULT_ITEMS_PER_PAGE,
  );

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    setIsFormValid(
      updated.testName?.trim() !== "" && updated.testCode?.trim() !== "",
    );
  };

  const resetForm = () => {
    setFormData({
      bloodTestId: "",
      testName: "",
      testCode: "",
      isMandatory: "",
      collectionType: "",
    });
    setIsFormValid(false);
    setEditingRecord(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({
      bloodTestId: rec.bloodTestId,
      testCode: rec.testCode,
      testName: rec.testName,
      isMandatory: rec.isMandatory || "",
      collectionType: rec.applicableCollectionTypeId || "",
    });
    setShowForm(true);
    setIsFormValid(true);
  };

  // Save - POST/PUT
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    // Duplicate check (case-insensitive)
    const normalized = formData.testName.trim().toLowerCase();
    const duplicate = data.find(
      (rec) =>
        rec.testName?.trim().toLowerCase() === normalized &&
        (!editingRecord || rec.bloodTestId !== editingRecord.bloodTestId),
    );

    if (duplicate) {
      showPopup(DUPLICATE_BLOOD_TEST, "error");
      return;
    }

    try {
      if (editingRecord) {
        await putRequest(
          `${MAS_BLOOD_TEST}/update/${editingRecord.bloodTestId}`,
          {
            testCode: formData.testCode,
            testName: formData.testName,
            isMandatory: formData.isMandatory,
            applicableCollectionTypeId: formData.collectionType || null,
          },
        );

        showPopup(UPDATE_BLOOD_TEST, "success");
      } else {
        await postRequest(`${MAS_BLOOD_TEST}/create`, {
          testCode: formData.testCode,
          testName: formData.testName,
          isMandatory: formData.isMandatory,
          applicableCollectionTypeId: formData.collectionType || null,
        });
        showPopup(ADD_BLOOD_TEST, "success");
      }
      fetchData();
      handleCancel();
    } catch {
      showPopup(FAIL_BLOOD_TEST, "error");
    }
  };

  // Status switch
  const handleSwitchChange = (record) => {
    setConfirmDialog({
      isOpen: true,
      record: record,
      newStatus:
        record.status === STATUS.ACTIVE ? STATUS.INACTIVE : STATUS.ACTIVE,
    });
  };

  const handleConfirm = async (confirmed) => {
    if (!confirmed) {
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
      return;
    }

    const recordId =
      confirmDialog.record?.id || confirmDialog.record?.bloodTestId;
    const status = confirmDialog.newStatus;

    if (!recordId || !status) {
      showPopup(UPDATE_FAIL_BLOOD_TEST, "error");
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
      return;
    }

    setLoading(true);
    try {
      await putRequest(`${MAS_BLOOD_TEST}/status/${recordId}?status=${status}`);
      showPopup(UPDATE_BLOOD_TEST, "success");
      await fetchData();
    } catch (error) {
      showPopup(UPDATE_FAIL_BLOOD_TEST, "error");
    } finally {
      setLoading(false);
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
    }
  };

  // UI
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title">Blood Test Master</h4>

          <div className="d-flex align-items-center gap-2">
            {!showForm && (
              <input
                type="search"
                className="form-control"
                placeholder="Search Blood Test"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "220px" }}
              />
            )}

            {!showForm ? (
              <>
                <button
                  className="btn btn-success"
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                >
                  Add
                </button>
                <button
                  className="btn btn-success"
                  onClick={() => {
                    setSearchQuery("");
                    fetchData();
                  }}
                >
                  Show All
                </button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={handleCancel}>
                Back
              </button>
            )}
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <LoadingScreen />
          ) : !showForm ? (
            <>
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Test Code</th>
                    <th>Test Name</th>
                    <th>Collection Type</th>
                    <th>Mandatory</th>
                    <th>Created Date</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((item) => (
                      <tr key={item.id || item.bloodTestId}>
                        <td>{item.testCode}</td>
                        <td>{item.testName}</td>
                        <td>
                          {collectionTypes.find(
                            (type) =>
                              type.collectionTypeId ===
                              item.applicableCollectionTypeId,
                          )?.collectionTypeName || "N/A"}
                        </td>
                        <td>
                          {item.isMandatory === STATUS.ACTIVE ? "Yes" : "No"}
                        </td>
                        <td>{formatDate(item.createdDate)}</td>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={item.status === `${STATUS.ACTIVE}`}
                              onChange={() => handleSwitchChange(item)}
                            />
                            <label className="form-check-label ms-2">
                              {item.status === STATUS.ACTIVE
                                ? "Active"
                                : "Inactive"}
                            </label>
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleEdit(item)}
                            disabled={item.status !== STATUS.ACTIVE}
                          >
                            <i className="fa fa-pencil"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center">
                        No data found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {filteredData.length > 0 && (
                <Pagination
                  totalItems={filteredData.length}
                  itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          ) : (
            <form onSubmit={handleSave}>
              <div className="row">
                <div className="form-group col-md-4">
                  <label>
                    Test Code <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="testCode"
                    className="form-control"
                    value={formData.testCode}
                    maxLength={20}
                    onChange={handleInputChange}
                    placeholder="Enter test code"
                    required
                  />
                </div>

                <div className="form-group col-md-4">
                  <label>
                    Test Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="testName"
                    className="form-control"
                    value={formData.testName}
                    maxLength={MAX_LENGTH}
                    onChange={handleInputChange}
                    placeholder="Enter test name"
                    required
                  />
                </div>

                <div className="form-group col-md-4">
                  <label>Mandatory</label>
                  <select
                    name="isMandatory"
                    className="form-select"
                    value={formData.isMandatory}
                    onChange={handleInputChange}
                  >
                    <option value="">Select</option>
                    <option value="y">Yes</option>
                    <option value="n">No</option>
                  </select>
                </div>
                <div className="form-group col-md-4 mt-3">
                  <label>Collection Type</label>
                  <select
                    name="collectionType"
                    className="form-select"
                    value={formData.collectionType || ""}
                    onChange={handleInputChange}
                  >
                    {collectionTypes.map((type) => (
                      <option
                        key={type.collectionTypeId}
                        value={type.collectionTypeId}
                      >
                        {type.collectionTypeName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3 text-end">
                <button
                  type="submit"
                  className="btn btn-primary me-2"
                  disabled={!isFormValid || loading}
                >
                  {editingRecord ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {popupMessage && <Popup {...popupMessage} />}

          {confirmDialog.isOpen && (
            <div className="modal d-block">
              <div className="modal-dialog">
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
                      {confirmDialog.newStatus === STATUS.ACTIVE
                        ? "activate"
                        : "deactivate"}{" "}
                      <strong>{confirmDialog.record?.testName}</strong>?
                    </p>
                  </div>
                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleConfirm(false)}
                    >
                      No
                    </button>
                    <button
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
  );
};

export default BloodTestMaster;
