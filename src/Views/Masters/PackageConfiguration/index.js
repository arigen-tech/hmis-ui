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
  const [process, setProcess] = useState(false);

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE;

  // Dummy package names for dropdown
  const packageNameOptions = [
    "General Surgery Package",
    "Maternity Package",
    "Cardiac Care Package",
    "Orthopedic Package",
    "Pediatric Package",
  ];

  // Room category options
  const roomCategoryOptions = ["General Ward", "Semi-Private", "Private", "Deluxe", "Suite"];

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
        billingType: "Insurance",
        insurance: "ICICI Lombard",
        tpa: "MediAssist",
        corporate: "",
        roomCategory: "Private",
        amount: 25000,
        effFrom: new Date(),
        effTo: new Date(new Date().setMonth(new Date().getMonth() + 6)),
        preAuth: "Yes",
        coPay: 10,
        maxLimit: 50000,
        status: "y",
      },
      {
        id: 2,
        packageName: "Maternity Package",
        billingType: "Corporate",
        insurance: "",
        tpa: "",
        corporate: "ABC Corp Ltd",
        roomCategory: "Deluxe",
        amount: 45000,
        effFrom: new Date(),
        effTo: new Date(new Date().setMonth(new Date().getMonth() + 5)),
        preAuth: "Yes",
        coPay: 5,
        maxLimit: 75000,
        status: "y",
      },
      {
        id: 3,
        packageName: "Cardiac Care Package",
        billingType: "Cash",
        insurance: "",
        tpa: "",
        corporate: "",
        roomCategory: "Semi-Private",
        amount: 35000,
        effFrom: new Date(),
        effTo: new Date(new Date().setMonth(new Date().getMonth() + 4)),
        preAuth: "No",
        coPay: 0,
        maxLimit: 40000,
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
    let updatedForm = { ...formData, [name]: value };

    // Reset dependent fields when billing type changes
    if (name === "billingType") {
      updatedForm.insurance = "";
      updatedForm.tpa = "";
      updatedForm.corporate = "";
    }

    setFormData(updatedForm);

    // Basic validation: required fields
    const valid =
      updatedForm.packageName &&
      updatedForm.billingType &&
      updatedForm.roomCategory &&
      updatedForm.amount &&
      updatedForm.effFrom &&
      updatedForm.effTo &&
      updatedForm.preAuth !== "" &&
      updatedForm.coPay !== "" &&
      updatedForm.maxLimit !== "";
    setIsFormValid(!!valid);
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
  const handleSave = async (e) => {
    e.preventDefault();
    setProcess(true);

    if (!isFormValid) {
      showPopup("Please fill all required fields", "error");
      setProcess(false);
      return;
    }

    try {
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
    } catch (error) {
      console.error("Error saving record:", error);
      showPopup("Failed to save changes", "error");
    } finally {
      setProcess(false);
    }
  };

  // ================= EDIT =================
  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData(rec);
    setShowForm(true);
    setIsFormValid(true);
  };

  // ================= STATUS TOGGLE =================
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

  const handleShowAll = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Determine which fields to disable based on billingType
  const isInsuranceDisabled = formData.billingType !== "Insurance";
  const isTPADisabled = formData.billingType !== "Insurance";
  const isCorporateDisabled = formData.billingType !== "Corporate";

  // ================= UI =================
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Package Configuration</h4>

          {!showForm && (
            <div className="d-flex gap-2">
              <input
                className="form-control me-2"
                placeholder="Search by package name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "250px" }}
              />
              <button className="btn btn-success" onClick={() => setShowForm(true)}>
                <i className="mdi mdi-plus"></i> Add
              </button>
              <button className="btn btn-secondary" onClick={handleShowAll}>
                Show All
              </button>
            </div>
          )}
          {showForm && (
            <div className="d-flex justify-content-end">
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                <i className="mdi mdi-arrow-left"></i> Back
              </button>
            </div>
          )}
        </div>

        <div className="card-body">
          {!showForm ? (
            <>
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Package Name</th>
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
                    {currentItems.length > 0 ? (
                      currentItems.map((rec) => (
                        <tr key={rec.id}>
                          <td>{rec.packageName}</td>
                          <td>{rec.billingType}</td>
                          <td>{rec.insurance || "-"}</td>
                          <td>{rec.tpa || "-"}</td>
                          <td>{rec.corporate || "-"}</td>
                          <td>{rec.roomCategory}</td>
                          <td>{rec.amount}</td>
                          <td>{formatDate(rec.effFrom)}</td>
                          <td>{formatDate(rec.effTo)}</td>
                          <td>{rec.preAuth}</td>
                          <td>{rec.coPay}%</td>
                          <td>{rec.maxLimit}</td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={rec.status === "y"}
                                onChange={() => toggleStatus(rec)}
                                id={`switch-${rec.id}`}
                              />
                              <label className="form-check-label" htmlFor={`switch-${rec.id}`}>
                                {rec.status === "y" ? "Active" : "Inactive"}
                              </label>
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleEdit(rec)}
                              disabled={rec.status !== "y"}
                            >
                              <i className="fa fa-pencil"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="14" className="text-center py-4">
                          No records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                totalItems={filteredData.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </>
          ) : (
            <form onSubmit={handleSave}>
              <div className="row">
                {/* Package Name Dropdown */}
                <div className="form-group col-md-4 mt-3">
                  <label>
                    Package Name <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="packageName"
                    value={formData.packageName}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Package</option>
                    {packageNameOptions.map((pkg) => (
                      <option key={pkg} value={pkg}>
                        {pkg}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Billing Type Dropdown */}
                <div className="form-group col-md-4 mt-3">
                  <label>
                    Billing Type <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="billingType"
                    value={formData.billingType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Billing Type</option>
                    <option value="Cash">Cash</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Corporate">Corporate</option>
                  </select>
                </div>

                {/* Insurance (enabled only for Insurance) */}
                <div className="form-group col-md-4 mt-3">
                  <label>Insurance</label>
                  <input
                    className="form-control"
                    name="insurance"
                    value={formData.insurance}
                    onChange={handleInputChange}
                    disabled={isInsuranceDisabled}
                    placeholder="e.g., ICICI Lombard"
                  />
                </div>

                {/* TPA (enabled only for Insurance) */}
                <div className="form-group col-md-4 mt-3">
                  <label>TPA</label>
                  <input
                    className="form-control"
                    name="tpa"
                    value={formData.tpa}
                    onChange={handleInputChange}
                    disabled={isTPADisabled}
                    placeholder="e.g., MediAssist"
                  />
                </div>

                {/* Corporate (enabled only for Corporate) */}
                <div className="form-group col-md-4 mt-3">
                  <label>Corporate</label>
                  <input
                    className="form-control"
                    name="corporate"
                    value={formData.corporate}
                    onChange={handleInputChange}
                    disabled={isCorporateDisabled}
                    placeholder="e.g., ABC Corp"
                  />
                </div>

                {/* Room Category Dropdown */}
                <div className="form-group col-md-4 mt-3">
                  <label>
                    Room Category <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="roomCategory"
                    value={formData.roomCategory}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Room Category</option>
                    {roomCategoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div className="form-group col-md-4 mt-3">
                  <label>
                    Amount (₹) <span className="text-danger">*</span>
                  </label>
                  <input
                    className="form-control"
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="e.g., 25000"
                    required
                  />
                </div>

                {/* Effective From Date */}
                <div className="form-group col-md-4 mt-3">
                  <label>
                    Effective From <span className="text-danger">*</span>
                  </label>
                  <input
                    className="form-control"
                    type="date"
                    name="effFrom"
                    value={formData.effFrom ? formData.effFrom.toString().slice(0,10) : ""}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Effective To Date */}
                <div className="form-group col-md-4 mt-3">
                  <label>
                    Effective To <span className="text-danger">*</span>
                  </label>
                  <input
                    className="form-control"
                    type="date"
                    name="effTo"
                    value={formData.effTo ? formData.effTo.toString().slice(0,10) : ""}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* PreAuth Dropdown (Yes/No) */}
                <div className="form-group col-md-4 mt-3">
                  <label>
                    PreAuth Required <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="preAuth"
                    value={formData.preAuth}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                {/* Co-pay % */}
                <div className="form-group col-md-4 mt-3">
                  <label>
                    Co-pay (%) <span className="text-danger">*</span>
                  </label>
                  <input
                    className="form-control"
                    type="number"
                    name="coPay"
                    value={formData.coPay}
                    onChange={handleInputChange}
                    placeholder="e.g., 10"
                    required
                  />
                </div>

                {/* Max Limit */}
                <div className="form-group col-md-4 mt-3">
                  <label>
                    Max Limit (₹) <span className="text-danger">*</span>
                  </label>
                  <input
                    className="form-control"
                    type="number"
                    name="maxLimit"
                    value={formData.maxLimit}
                    onChange={handleInputChange}
                    placeholder="e.g., 50000"
                    required
                  />
                </div>
              </div>

              <div className="form-group d-flex justify-content-end mt-4">
                <button
                  type="submit"
                  className="btn btn-primary me-2"
                  disabled={process || !isFormValid}
                >
                  {process ? "Processing..." : editingRecord ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleCancel}
                  disabled={process}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {popupMessage && (
            <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
          )}
        </div>
      </div>
    </div>
  );
};

export default PackageConfiguration;