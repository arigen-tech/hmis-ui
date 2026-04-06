import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const IPDConsultationTariff = () => {
  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({
    serviceCategory: "",
    visitType: "",
    doctor: "",
    department: "",
    charge: "",
    validFrom: "",
    validTo: "",
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
        serviceCategory: "General Consultation",
        visitType: "First Visit",
        doctor: "Dr. Anjali Tiwari",
        department: "Medicine",
        charge: 500,
        validFrom: new Date(),
        validTo: new Date(new Date().setMonth(new Date().getMonth() + 6)),
        status: "y",
      },
    ]);
  }, []);

  // ================= SEARCH =================
  const filteredData = data.filter((rec) =>
    rec.serviceCategory.toLowerCase().includes(searchQuery.toLowerCase())
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

    // simple validation
    const valid =
      updatedForm.serviceCategory ||
      updatedForm.visitType ||
      updatedForm.doctor ||
      updatedForm.department;
    setIsFormValid(valid !== "");
  };

  const resetForm = () => {
    setFormData({
      serviceCategory: "",
      visitType: "",
      doctor: "",
      department: "",
      charge: "",
      validFrom: "",
      validTo: "",
    });
    setIsFormValid(false);
  };

  // ================= SAVE =================
  const handleSave = (e) => {
    e.preventDefault();

    if (editingRecord) {
      const updated = data.map((item) =>
        item.id === editingRecord.id
          ? { ...editingRecord, ...formData }
          : item
      );
      setData(updated);
      showPopup("Updated Successfully", "success");
    } else {
      const newRecord = {
        ...formData,
        id: Date.now(),
        status: "y",
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
          <h4>IPD Consultation Tariff</h4>

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
                    <th>Service Category</th>
                    <th>Visit Type</th>
                    <th>Doctor</th>
                    <th>Department</th>
                    <th>Charge</th>
                    <th>Valid From</th>
                    <th>Valid To</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>

                <tbody>
                  {currentItems.map((rec) => (
                    <tr key={rec.id}>
                      <td>{rec.serviceCategory}</td>
                      <td>{rec.visitType}</td>
                      <td>{rec.doctor}</td>
                      <td>{rec.department}</td>
                      <td>{rec.charge}</td>
                      <td>{formatDate(rec.validFrom)}</td>
                      <td>{formatDate(rec.validTo)}</td>

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
                  <label>Service Category</label>
                  <input className="form-control" name="serviceCategory" value={formData.serviceCategory} onChange={handleInputChange} />
                </div>

                <div className="col-md-4">
                  <label>Visit Type</label>
                  <input className="form-control" name="visitType" value={formData.visitType} onChange={handleInputChange} />
                </div>

                <div className="col-md-4">
                  <label>Doctor</label>
                  <input className="form-control" name="doctor" value={formData.doctor} onChange={handleInputChange} />
                </div>

                <div className="col-md-4">
                  <label>Department</label>
                  <input className="form-control" name="department" value={formData.department} onChange={handleInputChange} />
                </div>

                <div className="col-md-4">
                  <label>Charge</label>
                  <input className="form-control" name="charge" value={formData.charge} onChange={handleInputChange} type="number" />
                </div>

                <div className="col-md-4">
                  <label>Valid From</label>
                  <input className="form-control" name="validFrom" value={formData.validFrom} onChange={handleInputChange} type="date" />
                </div>

                <div className="col-md-4">
                  <label>Valid To</label>
                  <input className="form-control" name="validTo" value={formData.validTo} onChange={handleInputChange} type="date" />
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

export default IPDConsultationTariff;