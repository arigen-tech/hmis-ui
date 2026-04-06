import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const IPDPackageMaster = () => {

  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({
    packageName: "",
    type: "",
    department: "",
    stay: "",
    inclusions: "",
    exclusions: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE;

  // ================= DATE =================
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
  };

  // ================= DUMMY DATA =================
  useEffect(() => {
    setData([
      {
        id: 1,
        packageName: "General Surgery Package",
        type: "Surgery",
        department: "Surgery",
        stay: "3 Days",
        inclusions: "Room, Medicines",
        exclusions: "Implants",
        status: "y",
        lastUpdateDate: new Date(),
      },
    ]);
  }, []);

  // ================= SEARCH =================
  const filteredData = data.filter((rec) =>
    rec.packageName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ================= FORM =================
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    const updatedForm = { ...formData, [name]: value };
    setFormData(updatedForm);

    const valid =
      updatedForm.packageName ||
      updatedForm.type ||
      updatedForm.department ||
      updatedForm.stay;

    setIsFormValid(valid !== "");
  };

  const resetForm = () => {
    setFormData({
      packageName: "",
      type: "",
      department: "",
      stay: "",
      inclusions: "",
      exclusions: "",
    });
    setIsFormValid(false);
  };

  // ================= SAVE =================
  const handleSave = (e) => {
    e.preventDefault();

    if (editingRecord) {
      const updated = data.map((item) =>
        item.id === editingRecord.id
          ? { ...editingRecord, ...formData, lastUpdateDate: new Date() }
          : item
      );
      setData(updated);
      showPopup("Updated Successfully", "success");
    } else {
      const newRecord = {
        ...formData,
        id: Date.now(),
        status: "y",
        lastUpdateDate: new Date(),
      };
      setData([...data, newRecord]);
      showPopup("Added Successfully", "success");
    }

    handleCancel();
  };

  // ================= EDIT =================
  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData(rec);
    setShowForm(true);
    setIsFormValid(true);
  };

  // ================= STATUS =================
  const toggleStatus = (rec) => {
    const updated = data.map((item) =>
      item.id === rec.id
        ? { ...item, status: item.status === "y" ? "n" : "y" }
        : item
    );
    setData(updated);
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleCancel = () => {
    resetForm();
    setEditingRecord(null);
    setShowForm(false);
  };

  // ================= UI =================
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between">
          <h4>IPD Package Master</h4>

          {!showForm && (
            <div className="d-flex">
              <input
                className="form-control me-2"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <button
                className="btn btn-success me-2"
                onClick={() => setShowForm(true)}
              >
                Add
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => setSearchQuery("")}
              >
                Show All
              </button>
            </div>
          )}
        </div>

        <div className="card-body">
          {!showForm && (
            <>
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Package Name</th>
                    <th>Type</th>
                    <th>Department</th>
                    <th>Stay</th>
                    <th>Inclusions</th>
                    <th>Exclusions</th>
                    <th>Last Update</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>

                <tbody>
                  {currentItems.map((rec) => (
                    <tr key={rec.id}>
                      <td>{rec.packageName}</td>
                      <td>{rec.type}</td>
                      <td>{rec.department}</td>
                      <td>{rec.stay}</td>
                      <td>{rec.inclusions}</td>
                      <td>{rec.exclusions}</td>
                      <td>{formatDate(rec.lastUpdateDate)}</td>

                      <td>
                        <input
                          type="checkbox"
                          checked={rec.status === "y"}
                          onChange={() => toggleStatus(rec)}
                        />
                      </td>

                      <td>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleEdit(rec)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Pagination
                totalItems={filteredData.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </>
          )}

          {showForm && (
            <form onSubmit={handleSave}>
              <div className="row">
                <div className="col-md-4">
                  <label>Package Name</label>
                  <input className="form-control" name="packageName" value={formData.packageName} onChange={handleInputChange} />
                </div>

                <div className="col-md-4">
                  <label>Type</label>
                  <input className="form-control" name="type" value={formData.type} onChange={handleInputChange} />
                </div>

                <div className="col-md-4">
                  <label>Department</label>
                  <input className="form-control" name="department" value={formData.department} onChange={handleInputChange} />
                </div>

                <div className="col-md-4">
                  <label>Stay</label>
                  <input className="form-control" name="stay" value={formData.stay} onChange={handleInputChange} />
                </div>

                <div className="col-md-4">
                  <label>Inclusions</label>
                  <input className="form-control" name="inclusions" value={formData.inclusions} onChange={handleInputChange} />
                </div>

                <div className="col-md-4">
                  <label>Exclusions</label>
                  <input className="form-control" name="exclusions" value={formData.exclusions} onChange={handleInputChange} />
                </div>
              </div>

              <div className="mt-3 text-end">
                <button className="btn btn-primary me-2">
                  {editingRecord ? "Update" : "Save"}
                </button>

                <button type="button" className="btn btn-danger" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {popupMessage && <Popup {...popupMessage} />}
        </div>
      </div>
    </div>
  );
};

export default IPDPackageMaster;