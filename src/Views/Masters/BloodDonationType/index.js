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
    donationCode: "",
    donationType: "",
    description: ""
  });

  const [loading, setLoading] = useState(true);

  /* ---------------- MOCK DATA ---------------- */
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setBloodDonationData([
        { id: 1, donationCode: "WB", donationType: "Whole Blood", description: "Standard whole blood donation", status: "y", lastUpdated: "10/01/2026" },
        { id: 2, donationCode: "PL", donationType: "Plasma Donation", description: "Plasma component donation", status: "y", lastUpdated: "12/01/2026" },
        { id: 3, donationCode: "PT", donationType: "Platelet Donation", description: "Platelets collected via apheresis", status: "n", lastUpdated: "14/01/2026" },
        { id: 4, donationCode: "DRC", donationType: "Double Red Cell", description: "Two units of red blood cells donation", status: "y", lastUpdated: "16/01/2026" },
        { id: 5, donationCode: "AD", donationType: "Autologous Donation", description: "Self-donation for future personal use", status: "n", lastUpdated: "18/01/2026" }
      ]);
      setLoading(false);
    }, 600);
  }, []);

  /* ---------------- SEARCH ---------------- */
  const filteredData = bloodDonationData.filter(item =>
    item.donationType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => setCurrentPage(1), [searchQuery]);

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

  /* ---------------- HANDLERS ---------------- */
  const showPopup = (message, type = "success") => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      donationCode: record.donationCode,
      donationType: record.donationType,
      description: record.description
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    if (editingRecord) {
      setBloodDonationData(prev =>
        prev.map(item =>
          item.id === editingRecord.id ? { ...item, ...formData } : item
        )
      );
      showPopup("Blood Donation Type updated successfully");
    } else {
      setBloodDonationData(prev => [
        ...prev,
        { id: Date.now(), ...formData, status: "y", lastUpdated: new Date().toLocaleDateString("en-GB") }
      ]);
      showPopup("Blood Donation Type added successfully");
    }

    handleBack();
  };

  const handleSwitchChange = (id, newStatus, donationType) => {
    setConfirmDialog({ isOpen: true, id, newStatus, donationType });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed) {
      setBloodDonationData(prev =>
        prev.map(item =>
          item.id === confirmDialog.id ? { ...item, status: confirmDialog.newStatus } : item
        )
      );
      showPopup(
        `Blood Donation Type ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"}`
      );
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "", donationType: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...formData, [name]: value };
    setFormData(updatedForm);
    setIsFormValid(updatedForm.donationCode.trim() !== "" && updatedForm.donationType.trim() !== "");
  };

  const handleBack = () => {
    setShowForm(false);
    setEditingRecord(null);
    setFormData({ donationCode: "", donationType: "", description: "" });
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
                    <th>Blood Donation Code</th>
                    <th>Blood Donation Type</th>
                    <th>Description</th>
                    <th>Last Updated</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length ? (
                    currentItems.map(item => (
                      <tr key={item.id}>
                        <td>{item.donationCode}</td>
                        <td>{item.donationType}</td>
                        <td>{item.description}</td>
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
                            <label className="form-check-label ms-2" htmlFor={`switch-${item.id}`}>
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
              <div className="row">
                <div className="form-group col-md-4">
                  <label>Donation Code <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="donationCode"
                    value={formData.donationCode}
                    onChange={handleInputChange}
                    maxLength={10}
                    required
                  />
                </div>

                <div className="form-group col-md-4">
                  <label>Blood Donation Type <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="donationType"
                    value={formData.donationType}
                    onChange={handleInputChange}
                    maxLength={50}
                    required
                  />
                </div>

                <div className="form-group col-md-4">
                  <label>Description</label>
                  <input
                    type="text"
                    className="form-control"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end mt-3">
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
            <div className="modal d-block" tabIndex="-1">
              <div className="modal-dialog">
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
  );
};

export default BloodDonationType;