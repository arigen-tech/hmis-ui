
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";

const SpectacleUseMaster = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  /* ---------- Pagination ---------- */
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");
  const itemsPerPage = 5;

  const [formData, setFormData] = useState({
    lens_type: "",
  });

  /* ---------- Confirm Status Dialog ---------- */
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    recordId: null,
    newStatus: null,
  });

  /* ---------- Fetch Data ---------- */
  const fetchData = async () => {
    try {
      setLoading(true);
      const dummyData = [
        { id: 1, lens_type: "Single Vision", status: "Y", last_updated_date: "2025-12-01 08:30:00" },
        { id: 2, lens_type: "Bifocal", status: "Y", last_updated_date: "2025-12-02 09:15:00" },
        { id: 3, lens_type: "Progressive", status: "N", last_updated_date: "2025-12-03 10:00:00" },
        { id: 4, lens_type: "Reading", status: "Y", last_updated_date: "2025-12-04 10:45:00" },
        { id: 5, lens_type: "Computer Lens", status: "Y", last_updated_date: "2025-12-05 11:30:00" },
        { id: 6, lens_type: "Photochromic", status: "Y", last_updated_date: "2025-12-06 12:00:00" },
      ];
      setData(dummyData);
    } catch (err) {
      console.error(err);
      showPopup("Failed to fetch data!", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ---------- Filter + Pagination ---------- */
  const filteredData = data.filter((rec) =>
    rec.lens_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  /* ---------- Popup ---------- */
  const showPopup = (message, type) =>
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });

  /* ---------- Handlers ---------- */
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchData();
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const updated = { ...formData, [id]: value };
    setFormData(updated);
    setIsFormValid(updated.lens_type.trim() !== "");
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const now = new Date().toISOString().replace("T", " ").split(".")[0];

    if (editingRecord) {
      setData(
        data.map((rec) =>
          rec.id === editingRecord.id
            ? { ...rec, lens_type: formData.lens_type, last_updated_date: now }
            : rec
        )
      );
      showPopup("Record updated successfully!", "success");
    } else {
      setData([
        ...data,
        {
          id: Date.now(),
          lens_type: formData.lens_type,
          status: "Y",
          last_updated_date: now,
        },
      ]);
      showPopup("New record added successfully!", "success");
    }

    resetForm();
  };

  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({ lens_type: rec.lens_type });
    setIsFormValid(true);
    setShowForm(true);
  };

  /* ---------- Status Change with Confirmation ---------- */
  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, recordId: id, newStatus });
  };

  const handleConfirmStatusChange = (confirmed) => {
    if (confirmed && confirmDialog.recordId !== null) {
      setData(
        data.map((rec) =>
          rec.id === confirmDialog.recordId
            ? { ...rec, status: confirmDialog.newStatus }
            : rec
        )
      );

      const recordName =
        data.find((rec) => rec.id === confirmDialog.recordId)?.lens_type || "";
      showPopup(
        `${recordName} ${confirmDialog.newStatus === "Y" ? "Activated" : "Deactivated"
        } successfully!`,
        "success"
      );
    }
    setConfirmDialog({ isOpen: false, recordId: null, newStatus: null });
  };

  const resetForm = () => {
    setFormData({ lens_type: "" });
    setEditingRecord(null);
    setShowForm(false);
    setIsFormValid(false);
  };

  const handleGoToPage = () => {
    const pageNumber = parseInt(pageInput, 10);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      setPageInput("");
    } else {
      alert("Invalid page number");
    }
  };

  const renderPagination = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1)
      startPage = Math.max(1, endPage - maxVisiblePages + 1);

    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) pageNumbers.push("...");
    }
    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pageNumbers.push("...");
      pageNumbers.push(totalPages);
    }

    return (
      <>
        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
          <button
            className="page-link"
            onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
          >
            Prev
          </button>
        </li>

        {pageNumbers.map((num, idx) => (
          <li key={idx} className={`page-item ${num === currentPage ? "active" : ""}`}>
            {typeof num === "number" ? (
              <button className="page-link" onClick={() => setCurrentPage(num)}>
                {num}
              </button>
            ) : (
              <span className="page-link disabled">{num}</span>
            )}
          </li>
        ))}

        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
          <button
            className="page-link"
            onClick={() =>
              currentPage < totalPages && setCurrentPage(currentPage + 1)
            }
          >
            Next
          </button>
        </li>
      </>
    );
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title">Spectacle Use Master</h4>
          <div className="d-flex align-items-center">
            {!showForm && (
              <input
                type="text"
                className="form-control w-50 me-2"
                placeholder="Search"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            )}
            {!showForm ? (
              <>
                <button
                  className="btn btn-success me-2"
                  onClick={() => setShowForm(true)}
                >
                  Add
                </button>
                <button className="btn btn-success flex-shrink-0" onClick={handleRefresh}>
                  Show All
                </button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={resetForm}>
                Back
              </button>
            )}
          </div>
        </div>

        <div className="card-body">
          {!showForm ? (
            <>
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Lens Type</th>
                      <th>Last Update Date</th>
                      <th>Status</th>
                      <th>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length ? (
                      currentItems.map((rec) => (
                        <tr key={rec.id}>
                          <td>{rec.id}</td>
                          <td>{rec.lens_type}</td>
                          <td>{rec.last_updated_date}</td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={rec.status === "Y"}
                                onChange={() =>
                                  handleSwitchChange(rec.id, rec.status === "Y" ? "N" : "Y")
                                }
                              />
                              <label className="form-check-label">
                                {rec.status === "Y" ? "Active" : "Inactive"}
                              </label>
                            </div>
                          </td>


                          <td>
                            <button
                              className="btn btn-success btn-sm d-flex align-items-center justify-content-center"
                              onClick={() => handleEdit(rec)}
                              disabled={rec.status !== "Y"}
                            >
                              <i className="fa fa-pencil"></i>
                            </button>
                          </td>

                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center">
                          No record found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  Page {currentPage} of {totalPages} | Total Records: {filteredData.length}
                </div>
                <ul className="pagination mb-0 d-flex justify-content-center">
                  {renderPagination()}
                </ul>
                <div className="d-flex align-items-center">
                  <input
                    type="number"
                    className="form-control ms-2"
                    placeholder="Go to page"
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                  />
                  <button className="btn btn-primary ms-2" onClick={handleGoToPage}>
                    Go
                  </button>
                </div>
              </div>
            </>
          ) : (
            <form className="row" onSubmit={handleSave}>
              <div className="form-group col-md-6">
                <label>
                  Lens Type <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  id="lens_type"
                  className="form-control mt-1"
                  value={formData.lens_type}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group col-md-12 mt-3 d-flex justify-content-end">
                <button className="btn btn-primary me-2" disabled={!isFormValid}>
                  Save
                </button>
                <button className="btn btn-danger" type="button" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {popupMessage && <Popup {...popupMessage} />}

          {confirmDialog.isOpen && (
            <div className="modal d-block" tabIndex="-1">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Confirm Status Change</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => handleConfirmStatusChange(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <p>
                      Are you sure you want to{" "}
                      {confirmDialog.newStatus === "Y" ? "activate" : "deactivate"}{" "}
                      <strong>
                        {data.find((rec) => rec.id === confirmDialog.recordId)?.lens_type}
                      </strong>?
                    </p>
                  </div>
                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleConfirmStatusChange(false)}
                    >
                      No
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleConfirmStatusChange(true)}
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

export default SpectacleUseMaster;
