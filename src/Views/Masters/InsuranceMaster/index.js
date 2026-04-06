import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const InsuranceMaster = () => {

  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    contactPerson: "",
    contactNo: "",
    email: "",
    address: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE;

  const MAX_LENGTH = 50;

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
    // dummy initial data
    setData([
      {
        id: 1,
        name: "LIC",
        code: "LIC001",
        contactPerson: "Amit",
        contactNo: "9876543210",
        email: "lic@mail.com",
        address: "Delhi",
        status: "y",
        lastUpdateDate: new Date(),
      },
    ]);
  }, []);

  // ================= SEARCH =================
  const filteredData = data.filter((rec) =>
    rec.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ================= FORM =================
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    const valid =
      formData.name ||
      formData.code ||
      formData.contactPerson ||
      formData.contactNo ||
      formData.email;

    setIsFormValid(valid !== "");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      contactPerson: "",
      contactNo: "",
      email: "",
      address: "",
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
          <h4>Insurance Master</h4>

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
          {/* ================= TABLE ================= */}
          {!showForm && (
            <>
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Contact Person</th>
                    <th>Contact No.</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th>Last Update</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>

                <tbody>
                  {currentItems.map((rec) => (
                    <tr key={rec.id}>
                      <td>{rec.name}</td>
                      <td>{rec.code}</td>
                      <td>{rec.contactPerson}</td>
                      <td>{rec.contactNo}</td>
                      <td>{rec.email}</td>
                      <td>{rec.address}</td>
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

          {/* ================= FORM ================= */}
          {showForm && (
            <form onSubmit={handleSave}>
              <div className="row">
                <div className="col-md-4">
                  <label>Name</label>
                  <input
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-md-4">
                  <label>Code</label>
                  <input
                    className="form-control"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-md-4">
                  <label>Contact Person</label>
                  <input
                    className="form-control"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-md-4">
                  <label>Contact No</label>
                  <input
                    className="form-control"
                    name="contactNo"
                    value={formData.contactNo}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-md-4">
                  <label>Email</label>
                  <input
                    className="form-control"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-md-4">
                  <label>Address</label>
                  <input
                    className="form-control"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="mt-3 text-end">
                <button className="btn btn-primary me-2">
                  {editingRecord ? "Update" : "Save"}
                </button>

                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleCancel}
                >
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

export default InsuranceMaster;