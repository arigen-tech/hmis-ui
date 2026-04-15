import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

// Predefined categories matching the image
const DEFAULT_CATEGORIES = [
  { category: "Room Rent", defaultLimitAmount: "5000", defaultLimitQty: "3 days" },
  { category: "Consultation", defaultLimitAmount: "", defaultLimitQty: "" },
  { category: "Drugs", defaultLimitAmount: "3000", defaultLimitQty: "" },
  { category: "Investigations", defaultLimitAmount: "2000", defaultLimitQty: "" },
  { category: "Consumables", defaultLimitAmount: "1500", defaultLimitQty: "" },
  { category: "Procedures", defaultLimitAmount: "", defaultLimitQty: "" },
  { category: "Surgery", defaultLimitAmount: "", defaultLimitQty: "" },
  { category: "Other Charges", defaultLimitAmount: "", defaultLimitQty: "" },
];

// Helper to generate inclusion/exclusion text from categories config
const generateInclusionExclusionText = (categoriesConfig) => {
  let inclusions = [];
  let exclusions = [];

  categoriesConfig.forEach((item) => {
    const limitAmountText = item.limitAmount ? ` (Limit: ${item.limitAmount})` : "";
    const limitQtyText = item.limitQty ? `, Qty: ${item.limitQty}` : "";
    const detailText = limitAmountText || limitQtyText ? `${limitAmountText}${limitQtyText}` : "";
    
    if (item.include) {
      inclusions.push(`${item.category}`);
    } else {
      exclusions.push(`${item.category}`);
    }
  });

  return {
    inclusionsText: inclusions.join(", "),
    exclusionsText: exclusions.join(", ")
  };
};

// Create default categories config (all unchecked, empty limits)
const createDefaultCategoriesConfig = () => {
  return DEFAULT_CATEGORIES.map(cat => ({
    category: cat.category,
    include: false,
    limitAmount: cat.defaultLimitAmount || "",
    limitQty: cat.defaultLimitQty || "",
  }));
};

const IPDPackageMaster = () => {
  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({
    packageName: "",
    type: "",
    department: "",
    stay: "",
  });
  // New state for categories configuration (table data)
  const [categoriesConfig, setCategoriesConfig] = useState(createDefaultCategoriesConfig());

  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    recordId: null, 
    newStatus: false, 
    recordName: "" 
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

  // ================= DATE =================
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
  };

  // ================= DUMMY DATA with categoriesDetail =================
  useEffect(() => {
    // Helper to create categories detail for dummy packages
    const createDummyCategories = (includesList, excludesList) => {
      return DEFAULT_CATEGORIES.map(cat => {
        const include = includesList.includes(cat.category);
        return {
          category: cat.category,
          include: include,
          limitAmount: include ? (cat.defaultLimitAmount || "1000") : "",
          limitQty: include ? (cat.defaultLimitQty || "1") : "",
        };
      });
    };

    setData([
      {
        id: 1,
        packageName: "General Surgery Package",
        type: "Surgery",
        department: "Surgery",
        stay: "3 Days",
        status: "y",
        lastUpdateDate: new Date(),
        categoriesDetail: createDummyCategories(
          ["Room Rent", "Consultation", "Drugs", "Investigations", "Consumables", "Procedures"],
          ["Surgery", "Other Charges"]
        ),
        inclusions: "",
        exclusions: "",
      },
      {
        id: 2,
        packageName: "Maternity Package",
        type: "Maternity",
        department: "Gynecology",
        stay: "5 Days",
        status: "y",
        lastUpdateDate: new Date(),
        categoriesDetail: createDummyCategories(
          ["Room Rent", "Consultation", "Drugs", "Investigations", "Consumables"],
          ["Procedures", "Surgery", "Other Charges"]
        ),
        inclusions: "",
        exclusions: "",
      },
      {
        id: 3,
        packageName: "Cardiac Care Package",
        type: "Cardiology",
        department: "Cardiology",
        stay: "7 Days",
        status: "y",
        lastUpdateDate: new Date(),
        categoriesDetail: createDummyCategories(
          ["Room Rent", "Consultation", "Drugs", "Investigations", "Consumables", "Procedures"],
          ["Surgery", "Other Charges"]
        ),
        inclusions: "",
        exclusions: "",
      },
    ]);
  }, []);

  // After data loads or categoriesConfig changes, recompute inclusions/exclusions for display in list
  // For existing records, we update their inclusions/exclusions text based on categoriesDetail on load
  useEffect(() => {
    if (data.length > 0) {
      const updatedData = data.map(record => {
        if (record.categoriesDetail) {
          const { inclusionsText, exclusionsText } = generateInclusionExclusionText(record.categoriesDetail);
          return { ...record, inclusions: inclusionsText, exclusions: exclusionsText };
        }
        return record;
      });
      setData(updatedData);
    }
  }, []); // Run once to sync dummy data

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
      updatedForm.packageName &&
      updatedForm.type &&
      updatedForm.department &&
      updatedForm.stay;
    setIsFormValid(!!valid);
  };

  // Category table handlers
  const handleCategoryIncludeChange = (index, checked) => {
    const updated = [...categoriesConfig];
    updated[index].include = checked;
    setCategoriesConfig(updated);
  };

  const handleCategoryAmountChange = (index, value) => {
    const updated = [...categoriesConfig];
    updated[index].limitAmount = value;
    setCategoriesConfig(updated);
  };

  const handleCategoryQtyChange = (index, value) => {
    const updated = [...categoriesConfig];
    updated[index].limitQty = value;
    setCategoriesConfig(updated);
  };

  const resetForm = () => {
    setFormData({
      packageName: "",
      type: "",
      department: "",
      stay: "",
    });
    setCategoriesConfig(createDefaultCategoriesConfig());
    setIsFormValid(false);
  };

  // ================= SAVE =================
  const handleSave = async (e) => {
    e.preventDefault();
    setProcess(true);

    if (!isFormValid) {
      setProcess(false);
      showPopup("Please fill all required fields", "error");
      return;
    }

    try {
      // Generate inclusion/exclusion text from current categories config
      const { inclusionsText, exclusionsText } = generateInclusionExclusionText(categoriesConfig);
      
      if (editingRecord) {
        const updated = data.map((item) =>
          item.id === editingRecord.id
            ? { 
                ...editingRecord, 
                ...formData, 
                categoriesDetail: categoriesConfig,
                inclusions: inclusionsText,
                exclusions: exclusionsText,
                lastUpdateDate: new Date() 
              }
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
          categoriesDetail: categoriesConfig,
          inclusions: inclusionsText,
          exclusions: exclusionsText,
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
    setFormData({
      packageName: rec.packageName,
      type: rec.type,
      department: rec.department,
      stay: rec.stay,
    });
    // Load categories detail from record, or create default if missing
    if (rec.categoriesDetail && Array.isArray(rec.categoriesDetail)) {
      setCategoriesConfig(rec.categoriesDetail);
    } else {
      // Fallback: create default and try to map from existing inclusions/exclusions text
      const defaultConfig = createDefaultCategoriesConfig();
      setCategoriesConfig(defaultConfig);
    }
    setShowForm(true);
    setIsFormValid(true);
  };

  // ================= STATUS SWITCH =================
  const handleSwitchChange = (id, name, newStatus) => {
    setConfirmDialog({ 
      isOpen: true, 
      recordId: id, 
      newStatus, 
      recordName: name 
    });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.recordId !== null) {
      setProcess(true);
      try {
        const updated = data.map((item) =>
          item.id === confirmDialog.recordId 
            ? { ...item, status: confirmDialog.newStatus } 
            : item
        );
        setData(updated);
        showPopup(
          `Package ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
          "success"
        );
      } catch (error) {
        console.error("Error updating status:", error);
        showPopup("Failed to update status", "error");
      } finally {
        setProcess(false);
      }
    }
    setConfirmDialog({ isOpen: false, recordId: null, newStatus: false, recordName: "" });
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

  // Preview of generated inclusions/exclusions (live)
  const livePreview = generateInclusionExclusionText(categoriesConfig);

  // ================= UI =================
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>IPD Package Master</h4>

          {!showForm ? (
            <div className="d-flex gap-2">
              <input
                className="form-control me-2"
                placeholder="Search by package name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "250px" }}
              />

              <button
                className="btn btn-success"
                onClick={() => {
                  setEditingRecord(null);
                  setIsFormValid(false);
                  resetForm();
                  setShowForm(true);
                }}
              >
                <i className="mdi mdi-plus"></i> Add
              </button>

              <button
                className="btn btn-secondary"
                onClick={handleShowAll}
              >
                Show All
              </button>
            </div>
          ):  <div className="d-flex justify-content-end">
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  <i className="mdi mdi-arrow-left"></i> Back
                </button>
              </div>}
        </div>

        <div className="card-body">
          {!showForm ? (
            <>
              <div className="table-responsive packagelist">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
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
                    {currentItems.length > 0 ? (
                      currentItems.map((rec) => (
                        <tr key={rec.id}>
                          <td>{rec.packageName}</td>
                          <td>{rec.type}</td>
                          <td>{rec.department}</td>
                          <td>{rec.stay}</td>
                          <td>{rec.inclusions || "-"}</td>
                          <td>{rec.exclusions || "-"}</td>
                          <td>{formatDate(rec.lastUpdateDate)}</td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={rec.status === "y"}
                                onChange={() => handleSwitchChange(
                                  rec.id, 
                                  rec.packageName, 
                                  rec.status === "y" ? "n" : "y"
                                )}
                                id={`switch-${rec.id}`}
                              />
                              <label
                                className="form-check-label px-0"
                                htmlFor={`switch-${rec.id}`}
                              >
                                {rec.status === "y" ? "Active" : "Deactivated"}
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
                        <td colSpan="9" className="text-center py-4">
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
            <form className="forms row" onSubmit={handleSave}>
              <div className="row">
                <div className="form-group col-md-6 mt-3">
                  <label>
                    Package Name <span className="text-danger">*</span>
                  </label>
                  <input 
                    className="form-control" 
                    name="packageName" 
                    value={formData.packageName} 
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group col-md-6 mt-3">
                  <label>
                    Type <span className="text-danger">*</span>
                  </label>
                  <select 
                    className="form-select" 
                    name="type" 
                    value={formData.type} 
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Surgery">Surgery</option>
                    <option value="Maternity">Maternity</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="General">General</option>
                    <option value="Pediatrics">Pediatrics</option>
                  </select>
                </div>

                <div className="form-group col-md-6 mt-3">
                  <label>
                    Department <span className="text-danger">*</span>
                  </label>
                  <select 
                    className="form-select" 
                    name="department" 
                    value={formData.department} 
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Surgery">Surgery</option>
                    <option value="Gynecology">Gynecology</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Pediatrics">Pediatrics</option>
                  </select>
                </div>

                <div className="form-group col-md-6 mt-3">
                  <label>
                    Stay <span className="text-danger">*</span>
                  </label>
                  <input 
                    className="form-control" 
                    name="stay" 
                    value={formData.stay} 
                    onChange={handleInputChange}
                    placeholder="e.g., 3 Days"
                    required
                  />
                </div>
              </div>

              {/* Categories Table - replaces old inclusions/exclusions textareas */}
              <div className="row mt-4">
                <div className="col-12">
                  <label className="fw-bold mb-2">Package Components </label>
                  <div className="table-responsive">
                    <table className="table table-bordered align-middle">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "50px" }}>Include</th>
                          <th>Category</th>
                          <th>Limit Amount</th>
                          <th>Limit Days</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoriesConfig.map((item, idx) => (
                          <tr key={idx}>
                            <td className="text-center">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={item.include}
                                onChange={(e) => handleCategoryIncludeChange(idx, e.target.checked)}
                              />
                            </td>
                            <td>{item.category}</td>
                            <td>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="e.g: 5000"
                                value={item.limitAmount}
                                onChange={(e) => handleCategoryAmountChange(idx, e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="e.g: 3 days"
                                value={item.limitQty}
                                onChange={(e) => handleCategoryQtyChange(idx, e.target.value)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Live Preview of generated Inclusions/Exclusions */}
              <div className="row mt-3">
                <div className="col-md-6">
                  <div className="card p-1">
                    <strong>Generated Inclusions:</strong><br />
                    {livePreview.inclusionsText || "None"}
                    

                        

                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card p-1">
                    <strong>Generated Exclusions:</strong><br />
                    {livePreview.exclusionsText || "None"}
                  </div>
                </div>
              </div>

              <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                <button
                  type="submit"
                  className="btn btn-primary me-2"
                  disabled={process || !isFormValid}
                >
                  {process ? "Processing..." : (editingRecord ? "Update" : "Save")}
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

          {confirmDialog.isOpen && (
            <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
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
                      <strong>{confirmDialog.recordName}</strong>?
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

export default IPDPackageMaster;