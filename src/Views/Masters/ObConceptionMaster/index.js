import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import { MAS_OB_CONCEPTION } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading";
import { getRequest, postRequest, putRequest } from "../../../service/apiService";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";



const ObConceptionMaster = () => {
  const [data, setData] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    statusName: ""
  });
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // id: "",
    value: "",
    description: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ================= PAGINATION =================
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");
  const itemsPerPage = 5;

  const OB_CONCEPTION_CODE_MAX_LENGTH = 10;




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



  //  fetchData

  const fetchData = async (flag = 0) => {

    try {
      const response = await getRequest(`${MAS_OB_CONCEPTION}/getAll/0`);

      if (response && response.response) {
        setData(response.response);
      }
    } catch (error) {
      console.error(error);
      showPopup("Failed to fetch records", "error");
    }
  };


  useEffect(() => {
    fetchData();
  }, []);


  // ================= SEARCH =================

  const filteredData = data.filter((rec) =>
    (rec.conceptionType || "").toLowerCase().includes(searchQuery.toLowerCase())
  );




  // const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


  // ================= SEARCH =================

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };



  // ================= FORM =================
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const updated = { ...formData, [id]: value };
    setFormData(updated);
    setIsFormValid(updated.value.trim() != "");
  };


  const resetForm = () => {
    setFormData({ value: "", description: "", });
    setIsFormValid(false);
  };

  // ================= SAVE =================


  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const newValue = formData.value.trim().toLowerCase();

    const duplicate = data.find((rec) =>
      rec.conceptionType?.trim().toLowerCase() === newValue &&
      (!editingRecord || rec.id !== editingRecord.id)
    );

    if (duplicate) {
      showPopup("Conception with the same code or name  already exists!", "error");
      return;
    }

    try {
      if (editingRecord) {
        // UPDATE
        await putRequest(`${MAS_OB_CONCEPTION}/update/${editingRecord.id}`, {
          id: editingRecord.id,
          conceptionType: formData.value,
          description: formData.description || "",
          status: editingRecord.status,
        });
        showPopup("Record updated successfully", "success");
      } else {
        // CREATE
        await postRequest(`${MAS_OB_CONCEPTION}/create`, {
          conceptionType: formData.value,
          description: formData.description || "",
          status: "Y",
        });
        showPopup("Record added successfully", "success");
      }

      fetchData();
      resetForm();
      setEditingRecord(null);
      setShowForm(false);
    } catch (error) {
      showPopup("Something went wrong while saving the record", "error");
    }
  };



  // ================= EDIT =================

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      value: record.conceptionType,
      description: record.description || "",
    });
    setShowForm(true);
    setIsFormValid(true);
  };



  // ================= STATUS =================
  const handleSwitchChange = (id, newStatus, name) => {
    setConfirmDialog({ isOpen: true, id, newStatus, statusName: name });
  };

  const handleConfirm = async (confirmed) => {
    if (!confirmed) {
      setConfirmDialog({ isOpen: false, id: null, newStatus: "", statusName: "", });
      return;
    }
    try {
      await putRequest(
        `${MAS_OB_CONCEPTION}/status/${confirmDialog.id}?status=${confirmDialog.newStatus}`
      );

      showPopup("Status updated successfully", "success");
      fetchData();
    } catch (error) {
      showPopup("Failed to update status", "error");
    }
    setConfirmDialog({
      isOpen: false, id: null,  newStatus: "", statusName: "",});

  };


  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  
  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  // ================= UI =================
  return (
    <div className="content-wrapper">
      <div className="card form-card">

        {/* HEADER */}
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Ob Conception Master</h4>
          <div className="d-flex">
            {!showForm && (
              <input className="form-control me-2" style={{ width: "220px" }} placeholder="Search..." value={searchQuery} onChange={handleSearchChange}/>)}

            {!showForm ? (
              <>
                <button
                  className="btn btn-success me-2"
                  onClick={() => { resetForm(); setShowForm(true); setEditingRecord(null); }}
                >
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

        {/* BODY */}
        <div className="card-body">
          {loading ? (
            <LoadingScreen />
          ) : !showForm ? (
            <>
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Conception Type</th>
                    <th>Last Updated Date</th>
                    <th>status</th>
                    <th>Edit</th>
                  </tr>
                </thead>

                <tbody>
                  {currentItems.map((rec) => (
                    <tr key={rec.id}>
                      <td>{rec.conceptionType}</td>
                      <td>{formatDate(rec.lastUpdateDate)}</td>

                      <td>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={rec.status === "y"}
                            onChange={() =>
                              handleSwitchChange(
                                rec.id,
                                rec.status === "y" ? "n" : "y",
                                rec.conceptionType


                              )
                            }
                          />
                          <label className="form-check-label ms-2">
                            {rec.status === "y" ? "Active" : "Inactive"}
                          </label>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleEdit(rec)}
                          disabled={rec.status !== "y"}
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
            // FORM
            <form className="row" onSubmit={handleSave}>
              <div className="col-md-4">
                <label>Conception Type <span className="text-danger">*</span></label>
                <input id="value" className="form-control" value={formData.value} onChange={handleInputChange} maxLength={OB_CONCEPTION_CODE_MAX_LENGTH} required />

              </div>

              <div className="col-md-12 mt-4 text-end">
                <button className="btn btn-primary me-2" disabled={!isFormValid}>Save</button>
                <button className="btn btn-danger" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          )}

          {popupMessage && <Popup {...popupMessage} />}


          {/* ================= CONFIRM MODAL (UPPER LAYER) ================= */}
          {confirmDialog.isOpen && (
            <>
              <div
                className="modal-backdrop fade show" style={{ zIndex: 1040 }} ></div>
              <div
                className="modal fade show d-block"
                tabIndex="-1"
                style={{ zIndex: 1050 }}
              >
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-body">
                      Are you sure you want to{" "}

                      {confirmDialog.newStatus === "Y" ? "activate" : "deactivate"}
                      {" "}
                      <strong>{confirmDialog.statusName}</strong>?
                    </div>

                    <div className="modal-footer">
                      <button className="btn btn-secondary" onClick={() => handleConfirm(false)}> No </button>
                      <button className="btn btn-primary" onClick={() => handleConfirm(true)}> Yes </button>
                    </div>

                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default ObConceptionMaster;
