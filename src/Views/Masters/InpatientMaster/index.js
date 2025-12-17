import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";

const InpatientMaster = () => {
  const [data, setData] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
  });

  const [loading] = useState(false);
  

  const [formData, setFormData] = useState({
    patient: "",
    visit_id: "",
    admission_no: "",
    admission_date: "",
    admission_time: "",
    admission_type_id: "",
    care_level_id: "",
    ward_category_id: "",
    admitting_ward_id: "",
    admission_priority: "",
    admission_source: "",
    mlc_flag: "N",
    vip_flag: "N",
    created_by: "",
    last_updated_by: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  // PAGINATION
  const [pageInput, setPageInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // ================== SAMPLE DATA ==================
  useEffect(() => {
    const sample = [
      {
        inpatient_id: 1,
        patient: "101",
        visit_id: "501",
        admission_no: "ADM001",
        admission_date: "2025-01-11",
        admission_time: "10:30",
        admission_type_id: "1",
        care_level_id: "2",
        ward_category_id: "3",
        admitting_ward_id: "5",
        admission_priority: "Normal",
        admission_source: "OPD",
        mlc_flag: "N",
        vip_flag: "N",
        status: "Y",
        created_by: "Admin",
        last_updated_by: "Admin",
        last_update_date: "2025-01-11",
      },
      {
        inpatient_id: 2,
        patient: "102",
        visit_id: "502",
        admission_no: "ADM002",
        admission_date: "2025-01-12",
        admission_time: "12:15",
        admission_type_id: "2",
        care_level_id: "3",
        ward_category_id: "1",
        admitting_ward_id: "4",
        admission_priority: "Urgent",
        admission_source: "ER",
        mlc_flag: "Y",
        vip_flag: "N",
        status: "Y",
        created_by: "Admin",
        last_updated_by: "Admin",
        last_update_date: "2025-01-12",
      },
      {
        inpatient_id: 3,
        patient: "103",
        visit_id: "503",
        admission_no: "ADM003",
        admission_date: "2025-01-05",
        admission_time: "09:45",
        admission_type_id: "1",
        care_level_id: "1",
        ward_category_id: "2",
        admitting_ward_id: "3",
        admission_priority: "Critical",
        admission_source: "Transfer",
        mlc_flag: "N",
        vip_flag: "Y",
        status: "Y",
        created_by: "Admin",
        last_updated_by: "Admin",
        last_update_date: "2025-01-05",
      },
      {
        inpatient_id: 4,
        patient: "104",
        visit_id: "504",
        admission_no: "ADM004",
        admission_date: "2025-01-07",
        admission_time: "11:10",
        admission_type_id: "1",
        care_level_id: "1",
        ward_category_id: "1",
        admitting_ward_id: "2",
        admission_priority: "Normal",
        admission_source: "Direct",
        mlc_flag: "N",
        vip_flag: "N",
        status: "N",
        created_by: "Admin",
        last_updated_by: "Admin",
        last_update_date: "2025-01-07",
      },
      {
        inpatient_id: 5,
        patient: "105",
        visit_id: "505",
        admission_no: "ADM005",
        admission_date: "2025-01-08",
        admission_time: "08:00",
        admission_type_id: "3",
        care_level_id: "3",
        ward_category_id: "3",
        admitting_ward_id: "1",
        admission_priority: "Urgent",
        admission_source: "ER",
        mlc_flag: "Y",
        vip_flag: "N",
        status: "Y",
        created_by: "Admin",
        last_updated_by: "Admin",
        last_update_date: "2025-01-08",
      },
      {
        inpatient_id: 6,
        patient: "106",
        visit_id: "506",
        admission_no: "ADM006",
        admission_date: "2025-01-09",
        admission_time: "15:20",
        admission_type_id: "2",
        care_level_id: "2",
        ward_category_id: "2",
        admitting_ward_id: "3",
        admission_priority: "Normal",
        admission_source: "OPD",
        mlc_flag: "N",
        vip_flag: "N",
        status: "Y",
        created_by: "Admin",
        last_updated_by: "Admin",
        last_update_date: "2025-01-09",
      },
      {
        inpatient_id: 7,
        patient: "107",
        visit_id: "507",
        admission_no: "ADM007",
        admission_date: "2025-01-10",
        admission_time: "14:40",
        admission_type_id: "1",
        care_level_id: "1",
        ward_category_id: "1",
        admitting_ward_id: "4",
        admission_priority: "Critical",
        admission_source: "Transfer",
        mlc_flag: "N",
        vip_flag: "Y",
        status: "N",
        created_by: "Admin",
        last_updated_by: "Admin",
        last_update_date: "2025-01-10",
      },
    ];
    setData(sample);
  }, []);

  // ================== SEARCH ==================
  const filteredData = data.filter((rec) =>
    showAll ? true : rec.admission_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleShowAll = () => {
    setShowAll(!showAll);
    setCurrentPage(1);
  };

  // ================== SAVE / UPDATE ==================
  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const timestamp = new Date().toISOString();

    if (editingRecord) {
      const updated = data.map((rec) =>
        rec.inpatient_id === editingRecord.inpatient_id
          ? { ...rec, ...formData, last_update_date: timestamp }
          : rec
      );
      setData(updated);
      showPopup("Record updated!", "success");
    } else {
      const newRec = {
        inpatient_id: data.length + 1,
        ...formData,
        status: "Y",
        last_update_date: timestamp,
      };
      setData([...data, newRec]);
      showPopup("Record added!", "success");
    }

    setShowForm(false);
    setEditingRecord(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      patient: "",
      visit_id: "",
      admission_no: "",
      admission_date: "",
      admission_time: "",
      admission_type_id: "",
      care_level_id: "",
      ward_category_id: "",
      admitting_ward_id: "",
      admission_priority: "",
      admission_source: "",
      mlc_flag: "N",
      vip_flag: "N",
      created_by: "",
      last_updated_by: "",
    });
    setIsFormValid(false);
  };

  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData(rec);
    setShowForm(true);
    setIsFormValid(true);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const updated = { ...formData, [id]: value };
    setFormData(updated);

    setIsFormValid(
      updated.admission_no.trim() !== "" &&
      updated.patient.trim() !== "" &&
      updated.admission_date.trim() !== "" &&
      updated.admission_time.trim() !== ""
    );
  };

  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, id, newStatus });
  };

  const handleConfirm = (isYes) => {
    if (isYes) {
      const updated = data.map((rec) =>
        rec.inpatient_id === confirmDialog.id
          ? { ...rec, status: confirmDialog.newStatus }
          : rec
      );
      setData(updated);
      showPopup("Status updated!", "success");
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "" });
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };
   //================== HANDLE GO PAGE ==================
  const handlePageNavigation = () => {
    const page = Number(pageInput);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
    setPageInput("");
  };

  // ================== PAGINATION COMPONENT (YOUR CODE) ==================
  const Pagination = () => (
    <nav>
      <ul className="pagination">

        {/* PREVIOUS */}
        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
          <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>
            Prev
          </button>
        </li>

        {/* PAGE NUMBERS */}
        {[...Array(totalPages).keys()].map((num) => (
          <li
            key={num}
            className={`page-item ${currentPage === num + 1 ? "active" : ""}`}
          >
            <button className="page-link" onClick={() => setCurrentPage(num + 1)}>
              {num + 1}
            </button>
          </li>
        ))}

        {/* NEXT */}
        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
          <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>
            Next
          </button>
        </li>
      </ul>
    </nav>
  );

  // ================== RENDER ==================
  return (
    <div className="content-wrapper">
      <div className="card form-card">

        {/* HEADER */}
        <div className="card-header d-flex justify-content-between">
          <h4>Inpatient Admission Master</h4>

          <div className="d-flex">
            {!showForm && (
              <>
                <input
                  type="text"
                  placeholder="Search Admission No"
                  className="form-control me-2"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  style={{ width: "220px" }}
                />
              </>
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
                  onClick={handleShowAll}
                  style={{ marginLeft: "10px" }}
                >
                  Show All
                </button>
              </>
            ) : (
              <button
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Back
              </button>
            )}
          </div>
        </div>

        {/* BODY */}
        <div className="card-body">
          {!showForm ? (
            <>
              {/* TABLE */}
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Admission No</th>
                      <th>Patient ID</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Priority</th>
                      <th>Source</th>
                      <th>MLC</th>
                      <th>VIP</th>
                      <th>Status</th>
                      <th>Edit</th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentItems.map((rec) => (
                      <tr key={rec.inpatient_id}>
                        <td>{rec.admission_no}</td>
                        <td>{rec.patient}</td>
                        <td>{rec.admission_date}</td>
                        <td>{rec.admission_time}</td>
                        <td>{rec.admission_priority}</td>
                        <td>{rec.admission_source}</td>
                        <td>{rec.mlc_flag}</td>
                        <td>{rec.vip_flag}</td>

                        {/* STATUS SWITCH */}
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={rec.status === "Y"}
                              onChange={() =>
                                handleSwitchChange(
                                  rec.inpatient_id,
                                  rec.status === "Y" ? "N" : "Y"
                                )
                              }
                            />
                            <label className="form-check-label">
                              {rec.status === "Y" ? "Active" : "Inactive"}
                            </label>
                          </div>
                        </td>

                        {/* EDIT */}
                        <td>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleEdit(rec)}
                            disabled={rec.status !== "Y"}
                          >
                            <i className="fa fa-pencil"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* UPDATED PAGINATION */}
              <div className="d-flex align-items-center justify-content-between mt-3">
                <div>Page {currentPage} of {totalPages} | Total Records: {filteredData.length}</div>
                <Pagination />
                <div className="d-flex">
                  <input
                    type="number"
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    className="form-control form-control-sm me-2"
                    style={{ width: "70px" }}
                    placeholder="Go To Page"
                  />
                  <button className="btn btn-sm btn-primary" onClick={handlePageNavigation}>Go</button>
                </div>
              </div>
              
            </>
          ) : (
            <>
              {/* FORM */}
              <form className="row" onSubmit={handleSave}>
                <div className="form-group col-md-3">
                  <label>Admission No <span className="text">*</span></label>
                  <input
                    id="admission_no"
                    className="form-control"
                    value={formData.admission_no}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group col-md-3">
                  <label>Patient <span className="text-danger">*</span></label>
                  <input
                    id="patient"
                    className="form-control"
                    value={formData.patient}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group col-md-3">
                  <label>Visit ID<span className="text-danger">*</span></label>
                  <input
                    id="visit_id"
                    className="form-control"
                    value={formData.visit_id}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group col-md-3">
                  <label>Date <span className="text-danger">*</span></label>
                  <input
                    id="admission_date"
                    type="date"
                    className="form-control"
                    value={formData.admission_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group col-md-3 mt-3">
                  <label>Time <span className="text-danger">*</span></label>
                  <input
                    id="admission_time"
                    type="time"
                    className="form-control"
                    value={formData.admission_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* SUBMIT BUTTON */}
                <div className="form-group col-md-12 mt-4 d-flex justify-content-end">
                  <button
                    className="btn btn-primary me-2"
                    disabled={!isFormValid}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </>
          )}

          {/* POPUP */}
          {popupMessage && (
            <Popup
              message={popupMessage.message}
              type={popupMessage.type}
              onClose={popupMessage.onClose}
            />
          )}

          {/* STATUS CONFIRM */}
          {confirmDialog.isOpen && (
            <div className="modal d-block">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5>Confirm Status Change</h5>
                    <button
                      className="btn-close"
                      onClick={() => handleConfirm(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    Change status to{" "}
                    <strong>
                      {confirmDialog.newStatus === "Y" ? "Active" : "Inactive"}
                    </strong>
                    ?
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

export default InpatientMaster;
