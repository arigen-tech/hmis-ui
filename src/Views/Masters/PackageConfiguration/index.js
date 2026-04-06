import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const PackageConfiguration = () => {
  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({
    packageName: "",
    billingType: "",
    insurance: "",
    tpa: "",
    corporate: "",
    roomCategory: "",
    amount: "",
    effFrom: "",
    effTo: "",
    preAuth: "",
    coPay: "",
    maxLimit: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE;

  // ================= DATE FORMAT =================
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
        billingType: "Self-Pay",
        insurance: "ICICI",
        tpa: "TPA1",
        corporate: "ABC Corp",
        roomCategory: "Deluxe",
        amount: 15000,
        effFrom: new Date(),
        effTo: new Date(new Date().setMonth(new Date().getMonth() + 6)),
        preAuth: "Yes",
        coPay: 10,
        maxLimit: 50000,
        status: "y",
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

  // ================= FORM HANDLERS =================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...formData, [name]: value };
    setFormData(updatedForm);

    const valid =
      updatedForm.packageName ||
      updatedForm.billingType ||
      updatedForm.insurance ||
      updatedForm.roomCategory;
    setIsFormValid(valid !== "");
  };

  const resetForm = () => {
    setFormData({
      packageName: "",
      billingType: "",
      insurance: "",
      tpa: "",
      corporate: "",
      roomCategory: "",
      amount: "",
      effFrom: "",
      effTo: "",
      preAuth: "",
      coPay: "",
      maxLimit: "",
    });
    setIsFormValid(false);
  };

  // ================= SAVE =================
  const handleSave = (e) => {
    e.preventDefault();

    if (editingRecord) {
      const updated = data.map((item) =>
        item.id === editingRecord.id ? { ...editingRecord, ...formData } : item
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
      item.id === rec.id ? { ...item, status: item.status === "y" ? "n" : "y" } : item
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
          <h4>Package Configuration</h4>

          {!showForm && (
            <div className="d-flex">
              <input
                className="form-control me-2"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn btn-success me-2" onClick={() => setShowForm(true)}>Add</button>
              <button className="btn btn-secondary" onClick={() => setSearchQuery("")}>Show All</button>
            </div>
          )}
        </div>

        <div className="card-body">
          {!showForm && (
            <>
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Package</th>
                    <th>Billing Type</th>
                    <th>Insurance</th>
                    <th>TPA</th>
                    <th>Corporate</th>
                    <th>Room Category</th>
                    <th>Amount</th>
                    <th>Eff. From</th>
                    <th>Eff. To</th>
                    <th>PreAuth</th>
                    <th>Co-Pay %</th>
                    <th>Max Limit</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((rec) => (
                    <tr key={rec.id}>
                      <td>{rec.packageName}</td>
                      <td>{rec.billingType}</td>
                      <td>{rec.insurance}</td>
                      <td>{rec.tpa}</td>
                      <td>{rec.corporate}</td>
                      <td>{rec.roomCategory}</td>
                      <td>{rec.amount}</td>
                      <td>{formatDate(rec.effFrom)}</td>
                      <td>{formatDate(rec.effTo)}</td>
                      <td>{rec.preAuth}</td>
                      <td>{rec.coPay}</td>
                      <td>{rec.maxLimit}</td>
                      <td>
                        <input type="checkbox" checked={rec.status === "y"} onChange={() => toggleStatus(rec)} />
                      </td>
                      <td>
                        <button className="btn btn-success btn-sm" onClick={() => handleEdit(rec)}>Edit</button>
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
                {Object.entries(formData).map(([key, value]) => (
                  <div className="col-md-4 mb-2" key={key}>
                    <label>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                    <input
                      className="form-control"
                      name={key}
                      value={value}
                      onChange={handleInputChange}
                      type={["amount","coPay","maxLimit"].includes(key) ? "number" : key.includes("From") || key.includes("To") ? "date" : "text"}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-3 text-end">
                <button className="btn btn-primary me-2">{editingRecord ? "Update" : "Save"}</button>
                <button type="button" className="btn btn-danger" onClick={handleCancel}>Cancel</button>
              </div>
            </form>
          )}

          {popupMessage && <Popup {...popupMessage} />}
        </div>
      </div>
    </div>
  );
};

export default PackageConfiguration;