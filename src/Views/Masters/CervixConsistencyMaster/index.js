
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { MAS_CERVIX_CONSISTENCY } from "../../../config/apiConfig";
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import {
  FETCH_CERVIX_CONSISTENCY,
  DUPLICATE_CERVIX_CONSISTENCY,
  UPDATE_CERVIX_CONSISTENCY,
  ADD_CERVIX_CONSISTENCY,
  FAIL_CERVIX_CONSISTENCY,
  UPDATE_FAIL_CERVIX_CONSISTENCY,
  INVALID_PAGE_NO_WARN_MSG
} from "../../../config/constants";

const CervixConsistencyMaster = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ cervixConsistency: "" });
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    record: null,
    newStatus: "",
  });

  const MAX_LENGTH = 50;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString?.trim()) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  // Fetch
  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const { response } = await getRequest(`${MAS_CERVIX_CONSISTENCY}/getAll/${flag}`);
      setData(response || []);
    } catch {
      showPopup(FETCH_CERVIX_CONSISTENCY, "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Search + Pagination
  const filteredData = data.filter((rec) =>
    (rec.cervixConsistency || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
    setPageInput("1");
  }, [searchQuery]);

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredData.length / DEFAULT_ITEMS_PER_PAGE);

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePageNavigation = () => {
    const pageNumber = parseInt(pageInput);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    } else {
      showPopup(INVALID_PAGE_NO_WARN_MSG, "error");
      setPageInput(currentPage.toString());
    }
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) pageNumbers.push("ellipsis-left");
    }

    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pageNumbers.push("ellipsis-right");
      pageNumbers.push(totalPages);
    }

    return pageNumbers.map((number, index) => {
      if (number === "ellipsis-left" || number === "ellipsis-right") {
        return (
          <li key={index} className="page-item disabled">
            <span className="page-link">...</span>
          </li>
        );
      }
      return (
        <li key={index} className={`page-item ${number === currentPage ? "active" : ""}`}>
          <button
            className="page-link"
            onClick={() => {
              setCurrentPage(number);
              setPageInput(number.toString());
            }}
          >
            {number}
          </button>
        </li>
      );
    });
  };

  // Form Input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedValue = value.slice(0, MAX_LENGTH);
    const updated = { ...formData, [name]: updatedValue };
    setFormData(updated);

    const valid = updated.cervixConsistency.trim().length > 0;
    setIsFormValid(valid);
  };

  const resetForm = () => {
    setFormData({ cervixConsistency: "" });
    setIsFormValid(false);
    setEditingRecord(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  // Save / Update
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const inputValue = formData.cervixConsistency.trim().toLowerCase();

    const duplicate = data.find(
      (rec) =>
        rec.cervixConsistency?.trim().toLowerCase() === inputValue &&
        rec.id !== editingRecord?.id
    );

    if (duplicate) {
      showPopup(DUPLICATE_CERVIX_CONSISTENCY, "error");
      return;
    }

    try {
      if (editingRecord) {
        await putRequest(
          `${MAS_CERVIX_CONSISTENCY}/update/${editingRecord.id}`,
          { cervixConsistency: formData.cervixConsistency.trim() }
        );
        showPopup(UPDATE_CERVIX_CONSISTENCY, "success");
      } else {
        await postRequest(`${MAS_CERVIX_CONSISTENCY}/create`, {
          cervixConsistency: formData.cervixConsistency.trim(),
          status: "Y",
        });
        showPopup(ADD_CERVIX_CONSISTENCY, "success");
      }

      fetchData();
      handleCancel();
    } catch {
      showPopup(FAIL_CERVIX_CONSISTENCY, "error");
    }
  };

  // Edit
  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({ cervixConsistency: rec.cervixConsistency || "" });
    setIsFormValid(true);
    setShowForm(true);
  };

  // Status
  const handleSwitchChange = (rec) => {
    setConfirmDialog({
      isOpen: true,
      record: rec,
      newStatus: rec.status?.toLowerCase() === "y" ? "n" : "y",
    });
  };

  const handleConfirm = async (confirmed) => {
    if (!confirmed) {
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
      return;
    }

    try {
      await putRequest(
        `${MAS_CERVIX_CONSISTENCY}/status/${confirmDialog.record.id}?status=${confirmDialog.newStatus}`
      );
      showPopup(UPDATE_CERVIX_CONSISTENCY, "success");
      fetchData();
    } catch {
      showPopup(UPDATE_FAIL_CERVIX_CONSISTENCY, "error");
    } finally {
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
    }
  };

  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Cervix Consistency Master</h4>

          <div className="d-flex">
            {!showForm && (
              <input
                style={{ width: "220px" }}
                className="form-control me-2"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
                <button className="btn btn-success" onClick={() => fetchData()}>
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
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Cervix Consistency</th>
                      <th>Last Update</th>
                      <th>Status</th>
                      <th>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((rec) => (
                      <tr key={rec.id}>
                        <td>{rec.cervixConsistency}</td>
                        <td>{formatDate(rec.lastUpdateDate)}</td>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={rec.status?.toLowerCase() === "y"}
                              onChange={() => handleSwitchChange(rec)}
                            />
                            <label className="form-check-label ms-2">
                              {rec.status?.toLowerCase() === "y" ? "Active" : "Inactive"}
                            </label>
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn btn-success btn-sm"
                            disabled={rec.status?.toLowerCase() !== "y"}
                            onClick={() => handleEdit(rec)}
                          >
                            <i className="fa fa-pencil"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <nav className="d-flex justify-content-between align-items-center mt-3">
                <span className="text-muted">
                  Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filteredData.length)} of {filteredData.length} entries
                </span>

                <ul className="pagination mb-0">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={handlePrevPage}>
                      &laquo; Previous
                    </button>
                  </li>

                  {renderPageNumbers()}

                  <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button className="page-link" onClick={handleNextPage}>
                      Next &raquo;
                    </button>
                  </li>
                </ul>

                <div className="d-flex align-items-center">
                  <span className="me-2">Go to:</span>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    className="form-control me-2"
                    style={{ width: "80px" }}
                  />
                  <button className="btn btn-primary" onClick={handlePageNavigation}>
                    Go
                  </button>
                </div>
              </nav>
            </>
          ) : (
            <form onSubmit={handleSave} className="row g-3">
              <div className="col-md-5">
                <label>Cervix Consistency <span className="text-danger">*</span></label>
                <input
                  name="cervixConsistency"
                  className="form-control"
                  value={formData.cervixConsistency}
                  onChange={handleInputChange}
                  maxLength={MAX_LENGTH}
                />
              </div>

              <div className="col-12 text-end">
                <button
                  type="submit"
                  className="btn btn-primary me-2"
                  disabled={!isFormValid}
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
                  <div className="modal-body">
                    Are you sure you want to{" "}
                    {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                    <strong>{confirmDialog.record?.cervixConsistency}</strong>?
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
  );
};

export default CervixConsistencyMaster;