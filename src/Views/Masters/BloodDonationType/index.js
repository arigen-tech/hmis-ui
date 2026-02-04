import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const BloodDonationType = () => {
  const [bloodDonationData, setBloodDonationData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    donationType: ""
  });

  const [popupMessage, setPopupMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const [formData, setFormData] = useState({
    donationType: ""
  });

  const [loading, setLoading] = useState(true);

  const MAX_LENGTH = 50;

  /* ---------------- MOCK DATA (5 RECORDS) ---------------- */
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setBloodDonationData([
        { id: 1, donationType: "Whole Blood", status: "y", lastUpdated: "10/01/2026" },
        { id: 2, donationType: "Plasma Donation", status: "y", lastUpdated: "12/01/2026" },
        { id: 3, donationType: "Platelet Donation", status: "n", lastUpdated: "14/01/2026" },
        { id: 4, donationType: "Double Red Cell", status: "y", lastUpdated: "16/01/2026" },
        { id: 5, donationType: "Autologous Donation", status: "n", lastUpdated: "18/01/2026" }
      ]);
      setLoading(false);
    }, 600);
  }, []);

  /* ---------------- SEARCH ---------------- */
  const filteredData = bloodDonationData.filter(item =>
    item.donationType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

  /* ---------------- HANDLERS ---------------- */
  const showPopup = (message, type = "success") => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({ donationType: record.donationType });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    if (editingRecord) {
      setBloodDonationData(prev =>
        prev.map(item =>
          item.id === editingRecord.id
            ? { ...item, donationType: formData.donationType }
            : item
        )
      );
      showPopup("Blood Donation Type updated successfully");
    } else {
      setBloodDonationData(prev => [
        ...prev,
        {
          id: Date.now(),
          donationType: formData.donationType,
          status: "y",
          lastUpdated: new Date().toLocaleDateString("en-GB")
        }
      ]);
      showPopup("Blood Donation Type added successfully");
    }

    setShowForm(false);
    setEditingRecord(null);
    setFormData({ donationType: "" });
    setIsFormValid(false);
  };

  const handleSwitchChange = (id, newStatus, donationType) => {
    setConfirmDialog({ isOpen: true, id, newStatus, donationType });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed) {
      setBloodDonationData(prev =>
        prev.map(item =>
          item.id === confirmDialog.id
            ? { ...item, status: confirmDialog.newStatus }
            : item
        )
      );
      showPopup(
        `Blood Donation Type ${
          confirmDialog.newStatus === "y" ? "activated" : "deactivated"
        }`
      );
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "", donationType: "" });
  };

  const handleInputChange = (e) => {
    setFormData({ donationType: e.target.value });
    setIsFormValid(e.target.value.trim() !== "");
  };

  const handleBack = () => {
    setShowForm(false);
    setEditingRecord(null);
    setFormData({ donationType: "" });
    setIsFormValid(false);
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title">Blood Donation Type Master</h4>

          <div className="d-flex align-items-center gap-2">
            {!showForm && (
              <form className="searchform" role="search">
                <div className="input-group">
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search Blood Donation Type"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: "220px" }}
                  />
                  <span className="input-group-text">
                    <i className="fa fa-search"></i>
                  </span>
                </div>
              </form>
            )}

            {!showForm ? (
              <>
                <button className="btn btn-success" onClick={() => setShowForm(true)}>
                  <i className="mdi mdi-plus"></i> Add
                </button>
                <button className="btn btn-success" onClick={() => setSearchQuery("")}>
                  <i className="mdi mdi-refresh"></i> Show All
                </button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={handleBack}>
                <i className="mdi mdi-arrow-left"></i> Back
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
                <thead>
                  <tr>
                    <th>Blood Donation Type</th>
                    <th>Last Updated</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length ? (
                    currentItems.map(item => (
                      <tr key={item.id}>
                        <td>{item.donationType}</td>
                        <td>{item.lastUpdated}</td>
                        <td>
  <div className="form-check form-switch">
    <input
      className="form-check-input"
      type="checkbox"
      role="switch"
      id={`switch-${item.id}`}
      checked={item.status === "y"}
      onChange={() =>
        handleSwitchChange(
          item.id,
          item.status === "y" ? "n" : "y",
          item.donationType
        )
      }
    />
    <label
      className="form-check-label ms-2"
      htmlFor={`switch-${item.id}`}
    >
      {item.status === "y" ? "Active" : "Inactive"}
    </label>
  </div>
</td>


                        <td>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleEdit(item)}
                            disabled={item.status !== "y"}
                          >
                            <i className="fa fa-pencil"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center">
                        No data found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <Pagination
                totalItems={filteredData.length}
                itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </>
          ) : (
            <form onSubmit={handleSave}>
               <div className="form-group col-md-6">
              <label>Blood Donation Type <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control"
                value={formData.donationType}
                maxLength={MAX_LENGTH}
                onChange={handleInputChange}
                required
              />
              </div>

               <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                <button className="btn btn-primary me-2" disabled={!isFormValid}>
                  Save
                </button>
                <button className="btn btn-danger" type="button" onClick={handleBack}>
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
                    <h5>Confirm Status</h5>
                  </div>
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
                          <strong>{confirmDialog.donationType}</strong>?
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
          )}
        </div>
      </div>
    </div>
  );
};

export default BloodDonationType;
