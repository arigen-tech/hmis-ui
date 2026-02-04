import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const BloodDonationHDR = () => {
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

  /* ---------------- ORIGINAL HDR DATA ---------------- */
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setBloodDonationData([
        { id: 1, donationType: "Whole Blood Donation", status: "y", lastUpdated: "10/01/2026" },
        { id: 2, donationType: "Plasma Donation", status: "y", lastUpdated: "12/01/2026" },
        { id: 3, donationType: "Platelet Donation", status: "y", lastUpdated: "14/01/2026" },
        { id: 4, donationType: "Double Red Cell Donation", status: "n", lastUpdated: "16/01/2026" },
        { id: 5, donationType: "Autologous Blood Donation", status: "n", lastUpdated: "18/01/2026" }
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
      showPopup("Blood Donation HDR updated successfully");
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
      showPopup("Blood Donation HDR added successfully");
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
        `Blood Donation HDR ${
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
          <h4 className="card-title">Blood Donation HDR Master</h4>

          <div className="d-flex align-items-center gap-2">
            {!showForm && (
              <input
                type="search"
                className="form-control"
                placeholder="Search Blood Donation HDR"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "220px" }}
              />
            )}

            {!showForm ? (
              <>
                <button className="btn btn-success" onClick={() => setShowForm(true)}>
                   Add
                </button>
                <button className="btn btn-success" onClick={() => setSearchQuery("")}>
                  Show All
                </button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={handleBack}>
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
                <thead>
                  <tr>
                    <th>Blood Donation HDR</th>
                    <th>Last Updated</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map(item => (
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
                  ))}
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

              <label>Blood Donation HDR <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control"
                value={formData.donationType}
                maxLength={MAX_LENGTH}
                onChange={handleInputChange}
                required
              />
</div>
              <div className="mt-3 text-end">
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

export default BloodDonationHDR;
