import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_CERVIX_POSITION } from "../../../config/apiConfig";
import { getRequest, postRequest, putRequest } from "../../../service/apiService";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";



const CervixPosition = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    cervixPosition: null,
    newStatus: "",
  });

  const [formData, setFormData] = useState({
    cervixPosition: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ================= PAGINATION =================
  const [currentPage, setCurrentPage] = useState(1);
  const [goPage, setGoPage] = useState("");
  const itemsPerPage = 5;


  const MAS_CERVIX_POSITION_CODE_MAX_LENGTH = 10


  //  dateTime
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        return "N/A";
      }

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };




  // fetchData

  const fetchData = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_CERVIX_POSITION}/getAll/${flag}`);
      console.log(response);

      if (response?.response) {
        setData(response.response);
      } else {
        setData([]);
      }
    } catch (error) {
      console.log(error);
      showPopup("Failed to fetch records", "error");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, []);

  // ================= SEARCH =================
  const filteredData = data.filter((rec) =>
    rec.cervixPosition.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ================= FORM =================
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const updated = { ...formData, [id]: value };
    setFormData(updated);
    setIsFormValid(updated.cervixPosition.trim() !== "");
  };

  const resetForm = () => {
    setFormData({ cervixPosition: "" });
    setIsFormValid(false);
  };

  // ================= SAVE =================
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const newValue = formData.cervixPosition.trim().toLowerCase();


    const duplicate = data.find((rec) =>
      rec.cervixPosition?.trim().toLowerCase() === newValue &&
      (!editingRecord || rec.id !== editingRecord.id)
    );

    if (duplicate) {
      showPopup("cervix Position with the same code or name  already exists!", "error");
      return;
    }

    try {
      if (editingRecord) {
        await putRequest(`${MAS_CERVIX_POSITION}/update/${editingRecord.id}`, {
          id: editingRecord.id,
          cervixPosition: formData.cervixPosition,
          status: editingRecord.status,
        });

        showPopup("Record updated successfully", "success");
      } else {
        await postRequest(`${MAS_CERVIX_POSITION}/create`, {
          cervixPosition: formData.cervixPosition,
          status: "Y",
        });

        showPopup("Record added successfully", "success");
      }
      fetchData();
      resetForm();
      setEditingRecord(null);
      setShowForm(false);
    } catch (error) {
      console.log(error);

    }
  };


  // ================= EDIT =================
  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData(rec);
    setShowForm(true);
    setIsFormValid(true);
  };

  // ================= STATUS =================
  const handleSwitchChange = (cervixPosition, newStatus) => {
    setConfirmDialog({ isOpen: true, cervixPosition, newStatus });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed) {
      setData(
        data.map((rec) =>
          rec.cervixPosition === confirmDialog.cervixPosition
            ? { ...rec, status: confirmDialog.newStatus }
            : rec
        )
      );
      showPopup("Status updated successfully", "success");
    }
    setConfirmDialog({
      isOpen: false,
      cervixPosition: null,
      newStatus: "",
    });
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchData();
  };

  const handleGoPage = () => {
    const page = Number(goPage);
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
    setGoPage("");
  };

  // ================= UI =================
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Cervix Position Master</h4>

          <div className="d-flex">
            {!showForm && (
              <input
                type="text"
                style={{ width: "220px" }}
                className="form-control me-2"
                placeholder="Search "
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            )}

            {!showForm ? (
              <>
                <button className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                  Add
                </button>
                <button className="btn btn-success" onClick={handleRefresh}>
                  Show All
                </button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
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
                    <th>Cervix Position</th>
                    <th>lastUpdateDate</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>

                <tbody>
                  {currentItems.map((rec) => (
                    <tr key={rec.id}>
                      <td>{rec.cervixPosition}</td>
                      <td>{formatDate(rec.lastUpdateDate)}</td>
                      <td>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={rec.status.toUpperCase() === "Y"}
                            onChange={() =>
                              handleSwitchChange(
                                rec.cervixPosition,
                                rec.status.toUpperCase() === "Y" ? "N" : "Y"
                              )
                            }
                          />
                          <label className="form-check-label ms-2">
                            {rec.status.toUpperCase() === "Y" ? "Active" : "Inactive"}
                          </label>
                        </div>
                      </td>
                      <td>

                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleEdit(rec)}
                          disabled={rec.status.toUpperCase() !== "Y"}
                        >
                          <i className="fa fa-pencil"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>

              {/* PAGINATION */}
              {filteredData.length > 0 && (
                <Pagination
                  totalItems={filteredData.length}
                  itemsPerPage={itemsPerPage}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              )}

            </>
          ) : (
            <form onSubmit={handleSave} className="row g-3">
              <div className="col-md-5">
                <label>Cervix Position Code <span className="text-danger">*</span></label>
                <input
                  id="cervixPosition"
                  className="form-control"
                  value={formData.cervixPosition}
                  onChange={handleInputChange}
                  // maxLength={MAS_CERVIX_POSITION_CODE_MAX_LENGTH}
                />
              </div>

              <div className="col-12 text-end">
                <button className="btn btn-primary me-2" disabled={!isFormValid}>Save</button>
                <button type="button" className="btn btn-danger" onClick={() => setShowForm(false)}>Cancel</button>
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
                    {confirmDialog.newStatus === "Y" ? "activate" : "deactivate"}{" "}
                    <strong>{confirmDialog.cervixPosition}</strong>?
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

export default CervixPosition;
