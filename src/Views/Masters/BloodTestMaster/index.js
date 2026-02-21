import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const BloodTestMaster = () => {
  const [bloodTestData, setBloodTestData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    testName: ""
  });

  const [popupMessage, setPopupMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);

 const [formData, setFormData] = useState({
  testName: "",
  testCode: "",
  mandatory: ""
});

  const [loading, setLoading] = useState(true);
  const MAX_LENGTH = 50;

  /* ---------------- ORIGINAL BLOOD TEST MASTER DATA ---------------- */
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setBloodTestData([
    { id: 1,testCode: "BT-CBC-001", testName: "Complete Blood Count (CBC)", status: "y", mandatory: true, lastUpdated: "10/01/2026" },
    { id: 2, testCode: "BT-FBS-002", testName: "Blood Sugar (Fasting)", status: "y", mandatory: true, lastUpdated: "12/01/2026" },
    { id: 3, testCode: "BT-PPBS-003", testName: "Blood Sugar (PP)", status: "y", mandatory: false, lastUpdated: "14/01/2026" },
    { id: 4, testCode: "BT-LIPID-004",testName: "Lipid Profile", status: "n", mandatory: false, lastUpdated: "16/01/2026" },
    { id: 5, testCode: "BT-HB-005", testName: "Hemoglobin (Hb)", status: "n", mandatory: true, lastUpdated: "18/01/2026" }
  ]);
      setLoading(false);
    }, 600);
  }, []);

  /* ---------------- SEARCH ---------------- */
  const filteredData = bloodTestData.filter(item =>
    item.testName.toLowerCase().includes(searchQuery.toLowerCase())
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
    setFormData({ testName: record.testName });
    setIsFormValid(true);
    setShowForm(true);
  };

 const handleSave = (e) => {
  e.preventDefault();

  // safety check
  if (!formData.testName || !formData.testCode) return;

  if (editingRecord) {
    setBloodTestData(prev =>
      prev.map(item =>
        item.id === editingRecord.id
          ? {
              ...item,
              testName: formData.testName,
              testCode: formData.testCode,
              mandatory: formData.mandatory,
              lastUpdated: new Date().toLocaleDateString("en-GB")
            }
          : item
      )
    );
    showPopup("Blood Test updated successfully");
  } else {
    setBloodTestData(prev => [
      ...prev,
      {
        id: Date.now(),
        testName: formData.testName,
        testCode: formData.testCode,
        mandatory: formData.mandatory,
        status: "y",
        lastUpdated: new Date().toLocaleDateString("en-GB")
      }
    ]);
    showPopup("Blood Test added successfully");
  };

  setShowForm(false);
  setEditingRecord(null);
  setFormData({
    testName: "",
    testCode: "",
    mandatory: false
 });
 setIsFormValid(false);
}; 
 
  const handleSwitchChange = (id, newStatus, testName) => {
    setConfirmDialog({ isOpen: true, id, newStatus, testName });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed) {
      setBloodTestData(prev =>
        prev.map(item =>
          item.id === confirmDialog.id
            ? { ...item, status: confirmDialog.newStatus }
            : item
        )
      );
      showPopup(
        `Blood Test ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"}`
      );
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "", testName: "" });
  };


  const handleBack = () => {
    setShowForm(false);
    setEditingRecord(null);
    setFormData({ testName: "" });
    setIsFormValid(false);
  };

const handleInputChange = (e) => {
  const { name, value, type, checked } = e.target;

  setFormData(prev => {
    const updated = {
      ...prev,
      [name]: type === "checkbox" ? checked : value
    };

    setIsFormValid(
      updated.testName.trim() !== "" &&
      updated.testCode.trim() !== ""
    );

    return updated; 
  });
};
  /* ---------------- UI ---------------- */
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
                    <th>Blood Test Code</th>
                    <th>Blood Test Name</th>
                    <th>Mandatory</th>
                    <th>Last Updated</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map(item => (
                    <tr key={item.id}>
                      <td>{item.testCode}</td>
                      <td>{item.testName}</td>
                     <td>{item.mandatory ? "Yes" : "No"}</td>
                      <td>{item.lastUpdated}</td>
                      <td>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={item.status === "y"}
                            onChange={() =>
                              handleSwitchChange(
                                item.id,
                                item.status === "y" ? "n" : "y",
                                item.testName
                              )
                            }
                          />
                          <label className="form-check-label ms-2">
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
              <div className="row">
  {/* Blood Test Name */}
  <div className="form-group col-md-4">
    <label>
      Blood Test Name <span className="text-danger">*</span>
    </label>
    <input
      type="text"
      name="testName"
      className="form-control"
      value={formData.testName}
      maxLength={MAX_LENGTH}
      onChange={handleInputChange}
     placeholder="Blood Test Name"
      required
    />
  </div>

  {/* Test Code */}
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
      placeholder="BT-CBC-001"
      required
    />
  </div>

  {/* Mandatory Checkbox */}
  <div className="form-group col-md-4">
     <label>
      Mandatory <span className="text-danger">*</span>
    </label>
      <input
        type="text"
        name="mandatory"
        className="form-control"
        checked={formData.mandatory}
        onChange={handleInputChange}
        placeholder="Mandatory"
      />
      
  </div>
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
                    <h5 className="modal-title">Confirm Status Change</h5>
                  </div>
                  <div className="modal-body">
                    Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                    <strong>{confirmDialog.testName}</strong>?
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => handleConfirm(false)}>No</button>
                    <button className="btn btn-primary" onClick={() => handleConfirm(true)}>Yes</button>
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
