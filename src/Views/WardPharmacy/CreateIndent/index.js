import { useState, useRef, useEffect } from "react"
import Popup from "../../../Components/popup"
import { API_HOST, MAS_DEPARTMENT, MAS_BRAND, MAS_MANUFACTURE, MAS_DRUG_MAS } from "../../../config/apiConfig";
import { getRequest, postRequest } from "../../../service/apiService"

const IndentCreation = () => {
  const [currentView, setCurrentView] = useState("form") // "form" or "detail"
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null)
  const hospitalId = sessionStorage.getItem("hospitalId") || localStorage.getItem("hospitalId");
  const departmentId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId");

  // Form State
  const [indentDate, setIndentDate] = useState(new Date().toISOString().split("T")[0]);
  const [department, setDepartment] = useState("");
  const [departments, setDepartments] = useState([]);
  const [loggedInDepartment, setLoggedInDepartment] = useState("Store"); // Fixed value for logged-in department

  // Dummy data for different department lists
  const storeDepartments = [
    { id: 101, name: "Store Dept A" },
    { id: 102, name: "Store Dept B" },
  ];
  const dispensaryDepartments = [
    { id: 201, name: "Dispensary Dept X" },
    { id: 202, name: "Dispensary Dept Y" },
  ];

  const [indentEntries, setIndentEntries] = useState([
    { id: 1, drugCode: "", drugName: "", unit: "", requiredQty: "", storesStock: "", wardStock: "", reason: "" }, // Initialize with one empty row
  ]);

  // Fetch Departments (modified to fetch all initially)
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_DEPARTMENT}/${hospitalId}`);
      if (response && Array.isArray(response)) {
        setDepartments(response); // Store all fetched departments
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Filter departments based on loggedInDepartment
  const getFilteredDepartments = () => {
    if (loggedInDepartment === "Store") {
      return storeDepartments;
    } else if (loggedInDepartment === "Dispensary") {
      return dispensaryDepartments;
    } else {
      return departments; // Fallback to all fetched departments if loggedInDepartment is neither Store nor Dispensary
    }
  };

  const handleEntryChange = (id, field, value) => {
    setIndentEntries(entries =>
      entries.map(entry =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  const handleAddRow = () => {
    const newId = Math.max(...indentEntries.map(e => e.id), 0) + 1;
    setIndentEntries([
      ...indentEntries,
      { id: newId, drugCode: "", drugName: "", unit: "", requiredQty: "", storesStock: "", wardStock: "", reason: "" }
    ]);
  };

  const handleDeleteRow = (id) => {
    if (indentEntries.length > 1) {
      setIndentEntries(indentEntries.filter(entry => entry.id !== id));
    } else {
      showPopup("At least one row is required", "warning");
    }
  };

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
      },
    })
  }

  const handleImportROL = () => {
    console.log("Import from ROL triggered");
    showPopup("Import from ROL feature coming soon", "info");
  };

  const handleImportPreviousIndent = () => {
    console.log("Import from Previous Indent triggered");
    showPopup("Import from Previous Indent feature coming soon", "info");
  };

  const handleSave = async () => {
    if (!department) {
      showPopup("Please select a department", "warning");
      return;
    }

    const hasEmptyRows = indentEntries.some(entry =>
      !entry.drugCode || !entry.drugName || !entry.requiredQty
    );

    if (hasEmptyRows) {
      showPopup("Please fill all required fields", "warning");
      return;
    }

    const payload = {
      indentDate: indentDate,
      departmentId: department,
      entries: indentEntries,
    };

    try {
      setLoading(true);
      const response = await postRequest(`${API_HOST}/indent/create`, payload);
      showPopup("Indent saved successfully!", "success");
      // Reset form
      setIndentDate(new Date().toISOString().split("T")[0]);
      setDepartment("");
      setIndentEntries([
        { id: 1, drugCode: "", drugName: "", unit: "", requiredQty: "", storesStock: "", wardStock: "", reason: "" }, // Reset to one empty row
      ]);
    } catch (err) {
      console.error("Error saving indent:", err);
      showPopup("Error saving indent", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!department) {
      showPopup("Please select a department", "warning");
      return;
    }

    const hasEmptyRows = indentEntries.some(entry =>
      !entry.drugCode || !entry.drugName || !entry.requiredQty
    );

    if (hasEmptyRows) {
      showPopup("Please fill all required fields", "warning");
      return;
    }

    const payload = {
      indentDate: indentDate,
      departmentId: department,
      entries: indentEntries,
      status: "submitted",
    };

    try {
      setLoading(true);
      const response = await postRequest(`${API_HOST}/indent/submit`, payload);
      showPopup("Indent submitted successfully!", "success");
      // Reset form
      setIndentDate(new Date().toISOString().split("T")[0]);
      setDepartment("");
      setIndentEntries([
        { id: 1, drugCode: "", drugName: "", unit: "", requiredQty: "", storesStock: "", wardStock: "", reason: "" }, // Reset to one empty row
      ]);
    } catch (err) {
      console.error("Error submitting indent:", err);
      showPopup("Error submitting indent", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            {/* Header Section */}
            <div className="card-header" >
              <h4 className="card-title p-2 mb-0">Indent Creation</h4>
            </div>

            <div className="card-body">
              {/* Form Header Section */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <label className="form-label fw-bold">Indent Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={indentDate}
                    onChange={(e) => setIndentDate(e.target.value)}
                  />
                </div>


                <div className="col-md-3">
                  <label className="form-label fw-bold">Department</label>
                  <select
                    className="form-select"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={!loggedInDepartment} // Disable until a logged-in department is selected
                  >
                    <option value="">Select</option>
                    {getFilteredDepartments().map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                 
                <div className="col-md-3">
                  <label className="form-label fw-bold">Current Department</label>
                  <input
                    type="text"
                    className="form-control"
                    value={loggedInDepartment}
                    readOnly
                    style={{ backgroundColor: "#f5f5f5" }}
                  />
                </div>
              </div>

            
              {/* Table Section */}
              <div className="table-responsive" style={{ overflowX: "auto" }}>
                <table className="table table-bordered align-middle">
                  <thead style={{ backgroundColor: "#95a5a6", color: "white" }}>
                    <tr>
                      <th style={{ width: "200px", minWidth: "200px" }}>Drug Name / Drug Code</th>
                      <th style={{ width: "100px", minWidth: "100px" }}>A/U</th>
                      <th style={{ width: "150px", minWidth: "150px" }}>Required Quantity</th>
                      <th style={{ width: "150px", minWidth: "150px" }}>Stores Available Stock</th>
                      <th style={{ width: "150px", minWidth: "150px" }}>Ward Pharmacy Stock</th>
                      <th style={{ width: "200px", minWidth: "200px" }}>Reason for Indent</th>
                      <th style={{ width: "80px", minWidth: "80px", textAlign: "center" }}>Add</th>
                      <th style={{ width: "80px", minWidth: "80px", textAlign: "center" }}>Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indentEntries.map((entry, index) => (
                      <tr key={entry.id}>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Drug Name / Code"
                            value={entry.drugName}
                            onChange={(e) => handleEntryChange(entry.id, "drugName", e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Unit"
                            value={entry.unit}
                            onChange={(e) => handleEntryChange(entry.id, "unit", e.target.value)}
                            style={{ backgroundColor: "#f5f5f5" }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Qty"
                            value={entry.requiredQty}
                            onChange={(e) => handleEntryChange(entry.id, "requiredQty", e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Stock"
                            value={entry.storesStock}
                            onChange={(e) => handleEntryChange(entry.id, "storesStock", e.target.value)}
                            style={{ backgroundColor: "#f5f5f5" }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Stock"
                            value={entry.wardStock}
                            onChange={(e) => handleEntryChange(entry.id, "wardStock", e.target.value)}
                            style={{ backgroundColor: "#f5f5f5" }}
                          />
                        </td>
                        <td>
                          <textarea
                            className="form-control"
                            placeholder="Reason"
                            value={entry.reason}
                            onChange={(e) => handleEntryChange(entry.id, "reason", e.target.value)}
                            style={{ height: "40px", resize: "none" }}
                          />
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={handleAddRow}
                          >
                            <i className="fa fa-plus"></i>
                          </button>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteRow(entry.id)}
                          >
                            <i className="fa fa-minus"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Import Buttons */}
              <div className="d-flex justify-content-end gap-2 mt-3 mb-4">
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleImportROL}
                >
                  Import from ROL
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleImportPreviousIndent}
                >
                  Import from Previous Indent
                </button>
              </div>

              {/* Action Buttons */}
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={loading}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}
    </div>
  )
}

export default IndentCreation
