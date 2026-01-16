import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const StationPresentingMaster = () => {
  const [data, setData] = useState([]);
  const [loading] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    stationPresentingName: null,
    newStatus: "",
  });

  const [formData, setFormData] = useState({
    stationPresentingCode: "",
    stationPresentingName: "",
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

  // ================= SAMPLE DATA =================
 useEffect(() => {
  setData([
    { stationPresentingCode: "SP1", stationPresentingName: "High Station", status: "Y" },
    { stationPresentingCode: "SP2", stationPresentingName: "Mid Station", status: "Y" },
    { stationPresentingCode: "SP3", stationPresentingName: "Low Station", status: "N" },
    { stationPresentingCode: "SP4", stationPresentingName: "Engaged Station", status: "Y" },
    { stationPresentingCode: "SP5", stationPresentingName: "Floating Station", status: "N" },
  ]);
}, []);

  // ================= SEARCH =================
  const filteredData = data.filter((rec) =>
    rec.stationPresentingName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast)


  // ================= FORM =================
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const updated = { ...formData, [id]: value };
    setFormData(updated);
    setIsFormValid(
      updated.stationPresentingCode && updated.stationPresentingName
    );
  };

  const resetForm = () => {
    setFormData({ stationPresentingCode: "", stationPresentingName: "" });
    setIsFormValid(false);
  };

  // ================= SAVE =================
  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    if (editingRecord) {
      setData(
        data.map((rec) =>
          rec.stationPresentingCode === editingRecord.stationPresentingCode
            ? { ...rec, ...formData }
            : rec
        )
      );
      showPopup("Record updated successfully", "success");
    } else {
      setData([...data, { ...formData, status: "N" }]);
      showPopup("Record added successfully", "success");
    }

    resetForm();
    setEditingRecord(null);
    setShowForm(false);
  };

  // ================= EDIT =================
  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData(rec);
    setShowForm(true);
    setIsFormValid(true);
  };

  // ================= STATUS =================
  const handleSwitchChange = (stationPresentingName, newStatus) => {
    setConfirmDialog({ isOpen: true, stationPresentingName, newStatus });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed) {
      setData(
        data.map((rec) =>
          rec.stationPresentingName === confirmDialog.stationPresentingName
            ? { ...rec, status: confirmDialog.newStatus }
            : rec
        )
      );
      showPopup("Status updated successfully", "success");
    }
    setConfirmDialog({
      isOpen: false,
      stationPresentingName: null,
      newStatus: "",
    });
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
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Station Presenting Master</h4>

          <div className="d-flex">
            {!showForm && (
              <input
                type="text"
                style={{ width: "220px" }}
                className="form-control me-2"
                placeholder="Search"
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
                    <th>Station Presenting Code</th>
                    <th>Station Presenting Name</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((rec, index) => (
                    <tr key={index}>
                      <td>{rec.stationPresentingCode}</td>
                      <td>{rec.stationPresentingName}</td>
                      <td>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={rec.status === "Y"}
                            onChange={() =>
                              handleSwitchChange(
                                rec.stationPresentingName,
                                rec.status === "Y" ? "N" : "Y"
                              )
                            }
                          />
                          <label className="form-check-label ms-2">
                            {rec.status === "Y" ? "Active" : "Inactive"}
                          </label>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-success btn-sm"
                          disabled={rec.status !== "Y"}
                          onClick={() => handleEdit(rec)}
                        >
                          <i className="fa fa-pencil"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* PAGINATION */}
               <Pagination
               totalItems={filteredData.length}
               itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
               currentPage={currentPage}
               onPageChange={setCurrentPage}
             /> 
            </>
          ) : (
            <form onSubmit={handleSave} className="row g-3">

              <div className="col-md-5">
                <label>Station Presenting Name <span className="text-danger">*</span></label>
                <input
                  id="stationPresentingName"
                  className="form-control"
                  value={formData.stationPresentingName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="col-12 text-end">
                <button className="btn btn-primary me-2" disabled={!isFormValid}>
                  Save
                </button>
                <button type="button" className="btn btn-danger" onClick={() => setShowForm(false)}>
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
                    {confirmDialog.newStatus === "Y" ? "activate" : "deactivate"}{" "}
                    <strong>{confirmDialog.stationPresentingName}</strong>?
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

export default StationPresentingMaster;
