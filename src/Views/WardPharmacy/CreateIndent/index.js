import { useState, useRef, useEffect } from "react"
import Popup from "../../../Components/popup"
import { API_HOST, MAS_DEPARTMENT, MAS_BRAND, Store_Internal_Indent, MAS_DRUG_MAS } from "../../../config/apiConfig";
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
  const [loggedInDepartment, setLoggedInDepartment] = useState(""); // Will be auto-filled from department ID

  // Drug search state
  const [allDrugs, setAllDrugs] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0, width: 0 });
  const [selectedDrugs, setSelectedDrugs] = useState([]);

  const [indentEntries, setIndentEntries] = useState([
    { id: 1, drugCode: "", drugName: "", unit: "", requiredQty: "", storesStock: "", wardStock: "", reason: "" },
  ]);

  // Validation state
  const [errors, setErrors] = useState({});

  // ROL Popup State
  const [showROLPopup, setShowROLPopup] = useState(false);
  const [rolItems, setRolItems] = useState([]);
  const [selectedRolItems, setSelectedRolItems] = useState([]);

  // Fetch current department by ID
  const fetchCurrentDepartment = async () => {
    try {
      if (!departmentId) {
        console.warn("No department ID found in session storage");
        setLoggedInDepartment("Unknown Department");
        return;
      }

      const response = await getRequest(`${MAS_DEPARTMENT}/getById/${departmentId}`);
      console.log("Current Department API Response:", response);

      if (response && response.data) {
        // If response has data field with department info
        setLoggedInDepartment(response.data.departmentName || response.data.name || "Unknown Department");
      } else if (response && response.response) {
        // If response has response field with department info
        setLoggedInDepartment(response.response.departmentName || response.response.name || "Unknown Department");
      } else {
        console.warn("Unexpected department response structure:", response);
        setLoggedInDepartment("Unknown Department");
      }
    } catch (err) {
      console.error("Error fetching current department:", err);
      setLoggedInDepartment("Error loading department");
    }
  };

  // Fetch Departments using fixed-dropdown API
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await getRequest(`${Store_Internal_Indent}/fixed-dropdown`);
      console.log("Departments API Response:", response);

      if (response && response.response && Array.isArray(response.response)) {
        setDepartments(response.response);
      } else if (response && Array.isArray(response)) {
        setDepartments(response);
      } else {
        console.error("Unexpected departments response structure:", response);
        showPopup("Error: Unexpected departments response format", "error");
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
      showPopup("Error fetching departments", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all drugs
  const fetchAllDrugs = async () => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_DRUG_MAS}/getAll/1/${hospitalId}/${departmentId}`);
      console.log("Drugs API Response:", response);

      if (response && response.response && Array.isArray(response.response)) {
        setAllDrugs(response.response);
        console.log("Drugs loaded:", response.response.length);
      } else if (response && Array.isArray(response)) {
        setAllDrugs(response);
        console.log("Drugs loaded:", response.length);
      } else if (response && response.data && Array.isArray(response.data)) {
        setAllDrugs(response.data);
        console.log("Drugs loaded:", response.data.length);
      } else {
        console.error("Unexpected drugs response structure:", response);
        showPopup("Error: Unexpected drugs response format", "error");
      }
    } catch (err) {
      console.error("Error fetching drugs:", err);
      showPopup("Error fetching drugs", "error");
    } finally {
      setLoading(false);
    }
  };

  // Update the ROL items fetch and processing
  const fetchROLItems = async () => {
    try {
      setLoading(true);
      const response = await getRequest(`${Store_Internal_Indent}/rol-items`);
      console.log("ROL Items API Response:", response);
      
      if (response && response.response && Array.isArray(response.response)) {
        const rolItemsData = response.response.map(item => ({
          id: item.itemId, // Ensure this uses itemId from response
          itemId: item.itemId, // Add this explicit mapping
          itemName: item.itemName,
          availableQty: item.availableQty || 0,
          rolQty: item.rolQty || 0,
          selected: false,
          pvmsNo: item.pvmsNo,
          unit: item.unit,
          // Include stock data from ROL response
          storeStock: item.storeStock || 0,
          wardStock: item.wardStock || 0,
          dispStock: item.dispStock || 0,
          drugData: {
            itemId: item.itemId,
            nomenclature: item.itemName,
            pvmsNo: item.pvmsNo,
            unitAuName: item.unit,
            reOrderLevelStore: item.reOrderLevelStore,
            reOrderLevelDispensary: item.reOrderLevelDispensary,
            adispQty: item.adispQty,
            storeROL: item.storeROL,
            dispROL: item.dispROL,
            wardROL: item.wardROL,
            // Pass stock data to drugData as well for consistency
            storestocks: item.storeStock || 0,
            wardstocks: item.wardStock || 0,
            dispstocks: item.dispStock || 0
          }
        }));
        setRolItems(rolItemsData);
        console.log("Dynamic ROL Items loaded with stock data:", rolItemsData);
      } else {
        console.error("Unexpected ROL items response structure:", response);
        setRolItems([]);
        showPopup("No ROL items found or error fetching ROL data", "info");
      }
    } catch (err) {
      console.error("Error fetching ROL items:", err);
      setRolItems([]);
      showPopup("Error fetching ROL items from server", "error");
    } finally {
      setLoading(false);
    }
  };

  // Update the ROL import function to properly set drugId
  const handleImportROLItems = () => {
    const selectedItems = rolItems.filter(item => item.selected);

    if (selectedItems.length === 0) {
      showPopup("Please select at least one item to import", "warning");
      return;
    }

    // Create new entries for selected ROL items
    const newEntries = selectedItems.map((item, index) => {
      const newId = index + 1;

      // Use stock data directly from ROL response
      const storesStock = item.storeStock !== null && item.storeStock !== undefined ? item.storeStock : 0;
      const wardStock = item.wardStock !== null && item.wardStock !== undefined ? item.wardStock : 0;

      return {
        id: newId,
        drugCode: item.pvmsNo || "",
        drugName: item.itemName,
        unit: item.unit || "",
        requiredQty: item.rolQty,
        storesStock: storesStock,
        wardStock: wardStock,
        reason: "",
        drugId: item.itemId, // FIXED: Use item.itemId instead of item.id
        drugData: {
          itemId: item.itemId, // FIXED: Use item.itemId instead of item.id
          nomenclature: item.itemName,
          pvmsNo: item.pvmsNo,
          unitAuName: item.unit,
          storestocks: storesStock,
          wardstocks: wardStock
        }
      };
    });

    // Check if we have only the default empty row
    const hasOnlyDefaultRow = indentEntries.length === 1 && 
      (!indentEntries[0].drugName || indentEntries[0].drugName.trim() === "");

    if (hasOnlyDefaultRow) {
      // Replace the default row with imported items
      setIndentEntries(newEntries);
    } else {
      // Add to existing rows
      const nextId = Math.max(...indentEntries.map(e => e.id), 0) + 1;
      const entriesWithNewIds = newEntries.map((entry, index) => ({
        ...entry,
        id: nextId + index
      }));
      setIndentEntries([...indentEntries, ...entriesWithNewIds]);
    }

    // Update selected drugs tracking
    const newDrugIds = newEntries.map(entry => entry.drugId);
    setSelectedDrugs(prev => [...prev, ...newDrugIds]);

    setShowROLPopup(false);
    showPopup(`${selectedItems.length} items imported successfully from ROL`, "success");
  };

  useEffect(() => {
    fetchDepartments();
    fetchAllDrugs();
    fetchCurrentDepartment(); // Fetch current department separately
    // Don't fetch ROL items on initial load, only when Import from ROL is clicked
  }, []);

  // Helper function to get display value with drug code in unique format
  const getDrugDisplayValue = (drugName, drugCode) => {
    if (!drugName && !drugCode) return "";
    if (drugName && drugCode) {
      return `${drugName} [${drugCode}]`;
    }
    return drugName || drugCode;
  };

  // Helper function to extract drug name from display value (for search)
  const extractDrugName = (displayValue) => {
    if (!displayValue) return "";
    // Remove the code part in brackets for searching
    const bracketIndex = displayValue.lastIndexOf('[');
    if (bracketIndex > -1) {
      return displayValue.substring(0, bracketIndex).trim();
    }
    return displayValue;
  };

  // Filter drugs based on search input
  const filterDrugsBySearch = (searchTerm) => {
    if (!searchTerm) return [];

    return allDrugs.filter(drug =>
      drug.nomenclature?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drug.pvmsNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drug.itemId?.toString().includes(searchTerm)
    ).slice(0, 10);
  };

  // Handle drug input focus for dropdown positioning
  const handleDrugInputFocus = (event, index) => {
    const input = event.target;
    const rect = input.getBoundingClientRect();

    setDropdownPosition({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY,
      width: rect.width
    });

    setActiveRowIndex(index);
    setDropdownVisible(true);
  };

  // Debug payload function
  const debugPayload = (payload) => {
    console.log("=== DEBUG PAYLOAD ===");
    console.log("Department ID:", payload.toDeptId);
    console.log("Items count:", payload.items.length);
    payload.items.forEach((item, index) => {
      console.log(`Item ${index + 1}:`, {
        itemId: item.itemId,
        requestedQty: item.requestedQty,
        availableStock: item.availableStock,
        reason: item.reason
      });
    });
    console.log("=== END DEBUG ===");
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Department validation
    if (!department) {
      newErrors.department = "Please select a department";
    }

    // Date validation
    if (!indentDate) {
      newErrors.indentDate = "Indent date is required";
    }

    // Entries validation - check for drugId instead of drugName
    indentEntries.forEach((entry, index) => {
      if (!entry.drugId) { // Changed from drugName to drugId
        newErrors[`drug_${index}`] = "Please select a drug";
      }
      if (!entry.requiredQty || entry.requiredQty <= 0) {
        newErrors[`qty_${index}`] = "Required quantity must be greater than 0";
      }
      if (entry.requiredQty && entry.storesStock && parseFloat(entry.requiredQty) > parseFloat(entry.storesStock)) {
        newErrors[`stock_${index}`] = "Required quantity cannot exceed available stock";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check for duplicate drugs
  const hasDuplicateDrugs = () => {
    const drugIds = indentEntries
      .filter(entry => entry.drugId)
      .map(entry => entry.drugId);

    const uniqueDrugIds = [...new Set(drugIds)];
    return drugIds.length !== uniqueDrugIds.length;
  };

  // Handle drug selection from dropdown
  const handleDrugSelect = (index, drug) => {
    // Check if drug is already selected in another row
    const isDuplicate = selectedDrugs.some(id => id === drug.itemId && indentEntries[index]?.drugId !== drug.itemId);

    if (isDuplicate) {
      showPopup("This drug is already added in another row. Please select a different drug.", "warning");
      return;
    }

    const newEntries = [...indentEntries];

    // Use available stock fields from the API response
    const storesStock = drug.storestocks !== null && drug.storestocks !== undefined ? drug.storestocks : 0;
    const wardStock = drug.wardstocks !== null && drug.wardstocks !== undefined ? drug.wardstocks : 0;

    // Update the selected row with drug information
    newEntries[index] = {
      ...newEntries[index],
      drugId: drug.itemId,
      drugCode: drug.pvmsNo || "",
      drugName: drug.nomenclature || "",
      unit: drug.unitAuName || drug.dispUnitName || "",
      storesStock: storesStock,
      wardStock: wardStock,
      drugData: {
        reOrderLevelStore: drug.reOrderLevelStore,
        reOrderLevelDispensary: drug.reOrderLevelDispensary,
        adispQty: drug.adispQty,
        storestocks: drug.storestocks,
        wardstocks: drug.wardstocks,
        dispstocks: drug.dispstocks,
        sectionName: drug.sectionName,
        itemTypeName: drug.itemTypeName,
        groupName: drug.groupName,
        itemClassName: drug.itemClassName
      }
    };

    setIndentEntries(newEntries);

    // Update selected drugs tracking
    const newSelectedDrugs = selectedDrugs.filter(id => id !== newEntries[index].drugId);
    newSelectedDrugs.push(drug.itemId);
    setSelectedDrugs(newSelectedDrugs);

    // Clear errors for this row
    const newErrors = { ...errors };
    delete newErrors[`drug_${index}`];
    delete newErrors[`qty_${index}`];
    delete newErrors[`stock_${index}`];
    setErrors(newErrors);

    setDropdownVisible(false);
    setActiveRowIndex(null);
  };

  // Handle entry change
  const handleEntryChange = (id, field, value) => {
    setIndentEntries(prevEntries => {
      const updatedEntries = prevEntries.map(entry =>
        entry.id === id ? { ...entry, [field]: value } : entry
      );

      // If drug name is being cleared, remove from selected drugs
      if (field === "drugName" && value === "") {
        const entry = prevEntries.find(e => e.id === id);
        if (entry && entry.drugId) {
          setSelectedDrugs(prevSelected => prevSelected.filter(drugId => drugId !== entry.drugId));
        }
      }

      return updatedEntries;
    });

    // Clear errors when user starts typing
    const entryIndex = indentEntries.findIndex(entry => entry.id === id);
    if (entryIndex !== -1) {
      const newErrors = { ...errors };
      if (field === "requiredQty") {
        delete newErrors[`qty_${entryIndex}`];
        delete newErrors[`stock_${entryIndex}`];
      }
      setErrors(newErrors);
    }
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
      // Remove drug from selected drugs if it was selected
      const entryToDelete = indentEntries.find(entry => entry.id === id);
      if (entryToDelete && entryToDelete.drugId) {
        setSelectedDrugs(selectedDrugs.filter(drugId => drugId !== entryToDelete.drugId));
      }

      setIndentEntries(indentEntries.filter(entry => entry.id !== id));

      // Clear errors for deleted row
      const entryIndex = indentEntries.findIndex(entry => entry.id === id);
      if (entryIndex !== -1) {
        const newErrors = { ...errors };
        delete newErrors[`drug_${entryIndex}`];
        delete newErrors[`qty_${entryIndex}`];
        delete newErrors[`stock_${entryIndex}`];
        setErrors(newErrors);
      }
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

  // ROL Popup Functions
  const handleImportROL = async () => {
    console.log("Import from ROL triggered");
    try {
      setLoading(true);
      await fetchROLItems(); // Fetch fresh ROL data when popup is opened
      setShowROLPopup(true);
    } catch (err) {
      console.error("Error preparing ROL popup:", err);
      showPopup("Error loading ROL items", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleImportPreviousIndent = () => {
    console.log("Import from Previous Indent triggered");
    showPopup("Import from Previous Indent feature coming soon", "info");
  };

  // Handle select all checkbox in ROL popup
  const handleSelectAllROL = (e) => {
    const isChecked = e.target.checked;
    const updatedRolItems = rolItems.map(item => ({
      ...item,
      selected: isChecked
    }));
    setRolItems(updatedRolItems);

    if (isChecked) {
      setSelectedRolItems(updatedRolItems.map(item => item.id));
    } else {
      setSelectedRolItems([]);
    }
  };

  // Handle individual checkbox selection in ROL popup
  const handleROLItemSelect = (id, isSelected) => {
    const updatedRolItems = rolItems.map(item =>
      item.id === id ? { ...item, selected: isSelected } : item
    );
    setRolItems(updatedRolItems);

    const selectedIds = updatedRolItems.filter(item => item.selected).map(item => item.id);
    setSelectedRolItems(selectedIds);
  };

  const handleSave = async () => {
    // Validate form
    if (!validateForm()) {
      showPopup("Please fill the Mandatory field before saving", "warning");
      return;
    }

    // Check for duplicate drugs
    if (hasDuplicateDrugs()) {
      showPopup("Duplicate drugs found. Please remove duplicate entries before saving.", "warning");
      return;
    }

    // Build ISO datetime string (LocalDateTime-compatible)
    const now = new Date();
    const indentDateTime = now.toISOString().slice(0, 19);

    // Filter out entries without drugId and build payload
    const validEntries = indentEntries.filter(entry => entry.drugId);
    
    if (validEntries.length === 0) {
      showPopup("Please select valid drugs before saving", "warning");
      return;
    }

    const payload = {
      indentMId: null,
      indentDate: indentDateTime,
      toDeptId: department ? Number(department) : null,
      items: validEntries.map(entry => ({
        itemId: Number(entry.drugId), // This was missing - crucial fix!
        requestedQty: entry.requiredQty ? Number(entry.requiredQty) : 0,
        reason: entry.reason || "",
        availableStock: entry.wardStock ? Number(entry.wardStock) : 0,
      })),
    };

    debugPayload(payload); // Debug log

    try {
      setLoading(true);
      const response = await postRequest(`${Store_Internal_Indent}/save`, payload);
      showPopup("Indent saved successfully!", "success");
      
      // Reset form
      setIndentDate(new Date().toISOString().split("T")[0]);
      setDepartment("");
      setIndentEntries([
        { id: 1, drugCode: "", drugName: "", unit: "", requiredQty: "", storesStock: "", wardStock: "", reason: "" },
      ]);
      setSelectedDrugs([]);
      setErrors({});
    } catch (err) {
      console.error("Error saving indent:", err);
      showPopup("Error saving indent", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate form
    if (!validateForm()) {
      showPopup("Please fill the Mandatory field before submitting", "warning");
      return;
    }

    // Check for duplicate drugs
    if (hasDuplicateDrugs()) {
      showPopup("Duplicate drugs found. Please remove duplicate entries before submitting.", "warning");
      return;
    }

    // Build ISO datetime string (LocalDateTime-compatible)
    const now = new Date();
    const indentDateTime = now.toISOString().slice(0, 19);

    // Filter out entries without drugId and build payload
    const validEntries = indentEntries.filter(entry => entry.drugId);
    
    if (validEntries.length === 0) {
      showPopup("Please select valid drugs before submitting", "warning");
      return;
    }

    const payload = {
      indentMId: null,
      indentDate: indentDateTime,
      toDeptId: department ? Number(department) : null,
      items: validEntries.map(entry => ({
        itemId: Number(entry.drugId), // This was missing - crucial fix!
        requestedQty: entry.requiredQty ? Number(entry.requiredQty) : 0,
        reason: entry.reason || "",
        availableStock: entry.wardStock ? Number(entry.wardStock) : 0,
      })),
    };

    debugPayload(payload); // Debug log

    try {
      setLoading(true);
      console.log("Submitting indent payload:", payload);
      
      const response = await postRequest(`${Store_Internal_Indent}/submit`, payload);
      console.log("Submit response:", response);
      
      showPopup("Indent submitted successfully!", "success");

      // Reset form
      setIndentDate(new Date().toISOString().split("T")[0]);
      setDepartment("");
      setIndentEntries([
        { id: 1, drugCode: "", drugName: "", unit: "", requiredQty: "", storesStock: "", wardStock: "", reason: "" },
      ]);
      setSelectedDrugs([]);
      setErrors({});
    } catch (err) {
      console.error("Error submitting indent:", err);
      showPopup("Error submitting indent", "error");
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownVisible && !event.target.closest('.dropdown-search-container')) {
        setDropdownVisible(false);
        setActiveRowIndex(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownVisible]);

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
                    className={`form-control ${errors.indentDate ? 'is-invalid' : ''}`}
                    value={indentDate}
                    onChange={(e) => {
                      setIndentDate(e.target.value);
                      if (errors.indentDate) {
                        const newErrors = { ...errors };
                        delete newErrors.indentDate;
                        setErrors(newErrors);
                      }
                    }}
                  />
                  {errors.indentDate && <div className="invalid-feedback">{errors.indentDate}</div>}
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold">Department</label>
                  <select
                    className={`form-select ${errors.department ? 'is-invalid' : ''}`}
                    value={department}
                    onChange={(e) => {
                      setDepartment(e.target.value);
                      if (errors.department) {
                        const newErrors = { ...errors };
                        delete newErrors.department;
                        setErrors(newErrors);
                      }
                    }}
                  >
                    <option value="">Select</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.departmentName}
                      </option>
                    ))}
                  </select>
                  {errors.department && <div className="invalid-feedback">{errors.department}</div>}
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold">Current Department</label>
                  <input
                    type="text"
                    className="form-control"
                    value={loggedInDepartment}
                    readOnly
                    style={{ backgroundColor: "#f5f5f5" }}
                    placeholder={!loggedInDepartment ? "Loading..." : ""}
                  />
                </div>
              </div>

              {/* Table Section */}
              <div className="table-responsive" style={{ overflowX: "auto" }}>
                <table className="table table-bordered align-middle">
                  <thead style={{ backgroundColor: "#95a5a6", color: "white" }}>
                    <tr>
                      <th style={{ width: "300px", minWidth: "300px" }}>
                        Drug Name / Drug Code
                      </th>
                      <th style={{ width: "70px", minWidth: "70px" }}>
                        A/U
                      </th>
                      <th style={{ width: "110px", minWidth: "110px", whiteSpace: "normal", lineHeight: "1.2" }}>
                        <span>Required</span><br />
                        <span>Quantity</span>
                      </th>
                      <th style={{ width: "150px", minWidth: "150px" }}>
                        Stores Available Stock
                      </th>
                      <th style={{ width: "150px", minWidth: "150px" }}>
                        Ward Pharmacy Stock
                      </th>
                      <th style={{ width: "160px", minWidth: "160px" }}>
                        Reason for Indent
                      </th>
                      <th style={{ width: "80px", minWidth: "80px", textAlign: "center" }}>
                        Add
                      </th>
                      <th style={{ width: "80px", minWidth: "80px", textAlign: "center" }}>
                        Delete
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {indentEntries.map((entry, index) => (
                      <tr key={entry.id}>
                        <td style={{ position: 'relative' }}>
                          <div className="dropdown-search-container position-relative">
                            <input
                              type="text"
                              className={`form-control ${errors[`drug_${index}`] ? 'is-invalid' : ''}`}
                              value={getDrugDisplayValue(entry.drugName, entry.drugCode)}
                              autoComplete="off"
                              onChange={(e) => {
                                const displayValue = e.target.value;
                                const drugName = extractDrugName(displayValue);
                                handleEntryChange(entry.id, "drugName", drugName);
                                if (drugName.trim() !== "") {
                                  setActiveRowIndex(index);
                                  setDropdownVisible(true);
                                } else {
                                  setDropdownVisible(false);
                                }
                              }}
                              onFocus={(e) => handleDrugInputFocus(e, index)}
                              placeholder="Enter drug name or code"
                              style={{ borderRadius: "4px", minWidth: "280px" }}
                            />
                            {errors[`drug_${index}`] && (
                              <div className="invalid-feedback d-block">{errors[`drug_${index}`]}</div>
                            )}

                            {/* Search Dropdown */}
                            {dropdownVisible && activeRowIndex === index && 
                             extractDrugName(getDrugDisplayValue(entry.drugName, entry.drugCode)).trim() !== "" && (
                              <ul
                                className="list-group position-fixed dropdown-list"
                                style={{
                                  top: `${dropdownPosition.y}px`,
                                  left: `${dropdownPosition.x}px`,
                                  width: `${dropdownPosition.width}px`,
                                  zIndex: 99999,
                                  backgroundColor: "#fff",
                                  border: "1px solid #ccc",
                                  borderRadius: "4px",
                                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                  maxHeight: "250px",
                                  overflowY: "auto",
                                }}
                              >
                                {filterDrugsBySearch(extractDrugName(getDrugDisplayValue(entry.drugName, entry.drugCode))).length > 0 ? (
                                  filterDrugsBySearch(extractDrugName(getDrugDisplayValue(entry.drugName, entry.drugCode))).map((drug) => {
                                    const isSelectedInOtherRow = selectedDrugs.some(
                                      (id) => id === drug.itemId && indentEntries[index]?.drugId !== drug.itemId
                                    );
                                    return (
                                      <li
                                        key={drug.itemId}
                                        className="list-group-item list-group-item-action"
                                        style={{
                                          backgroundColor: isSelectedInOtherRow ? "#ffc107" : "#f8f9fa",
                                          cursor: isSelectedInOtherRow ? "not-allowed" : "pointer",
                                          padding: "8px 12px",
                                        }}
                                        onClick={() => {
                                          if (!isSelectedInOtherRow) handleDrugSelect(index, drug);
                                        }}
                                      >
                                        <div>
                                          <strong>{drug.nomenclature}</strong>
                                          <div
                                            style={{
                                              color: "#6c757d",
                                              fontSize: "0.8rem",
                                              marginTop: "2px",
                                              display: "flex",
                                              justifyContent: "space-between",
                                              alignItems: "center"
                                            }}
                                          >
                                            <div>
                                              <span className="badge bg-info me-1" style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                                                <i className="fas fa-hashtag me-1"></i>CODE:{drug.pvmsNo}
                                              </span>
                                              
                                            </div>
                                            {isSelectedInOtherRow && (
                                              <span className="text-success">
                                                <i className="fas fa-check-circle me-1"></i> Added
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </li>
                                    );
                                  })
                                ) : (
                                  <li className="list-group-item text-muted text-center">
                                    {allDrugs.length === 0 ? "No drugs available" : "No drugs found"}
                                  </li>
                                )}
                              </ul>
                            )}
                          </div>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Unit"
                            value={entry.unit}
                            onChange={(e) => handleEntryChange(entry.id, "unit", e.target.value)}
                            style={{ backgroundColor: "#f5f5f5" }}
                            readOnly
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className={`form-control ${errors[`qty_${index}`] || errors[`stock_${index}`] ? 'is-invalid' : ''}`}
                            placeholder="Qty"
                            value={entry.requiredQty}
                            onChange={(e) => handleEntryChange(entry.id, "requiredQty", e.target.value)}
                            min="1"
                          />
                          {errors[`qty_${index}`] && (
                            <div className="invalid-feedback d-block">{errors[`qty_${index}`]}</div>
                          )}
                          {errors[`stock_${index}`] && (
                            <div className="invalid-feedback d-block">{errors[`stock_${index}`]}</div>
                          )}
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Store Stock"
                            value={entry.storesStock}
                            onChange={(e) => handleEntryChange(entry.id, "storesStock", e.target.value)}
                            style={{ backgroundColor: "#f5f5f5" }}
                            readOnly
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Ward Stock"
                            value={entry.wardStock}
                            onChange={(e) => handleEntryChange(entry.id, "wardStock", e.target.value)}
                            style={{ backgroundColor: "#f5f5f5" }}
                            readOnly
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
                            disabled={indentEntries.length <= 1}
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
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Import from ROL"}
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
                  {loading ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROL Import Popup */}
      {showROLPopup && (
        <div
          className="modal fade show d-block"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 10000 }}
          tabIndex="-1"
          onClick={() => setShowROLPopup(false)}
        >
          <div
            className="modal-dialog modal-lg"
            style={{
              width: "calc(100vw - 310px)",
              left: "285px",
              maxWidth: "none",
              height: "90vh",
              margin: "5vh auto",
              position: "fixed",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Import from ROL (Reorder Level)</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowROLPopup(false)}
                ></button>
              </div>
              <div
                className="modal-body"
                style={{ overflowY: "auto", flex: "1 1 auto", maxHeight: "calc(90vh - 120px)" }}
              >
                {rolItems.length === 0 ? (
                  <div className="text-center p-4">
                    <p>No items found below reorder level.</p>
                    <p>All items have sufficient stock.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <thead style={{ backgroundColor: "#95a5a6", color: "white" }}>
                        <tr>
                          <th style={{ width: "60px" }}>S.no</th>
                          <th>Item ID</th>
                          <th>Item Name</th>
                          <th style={{ width: "120px" }}>Available Qty</th>
                          <th style={{ width: "120px" }}>ROL Qty</th>
                          <th style={{ width: "100px", textAlign: "center" }}>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                onChange={handleSelectAllROL}
                                checked={rolItems.length > 0 && rolItems.every(item => item.selected)}
                              />
                              <label className="form-check-label">Select</label>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rolItems.map((item, index) => (
                          <tr key={item.id}>
                            <td>{index + 1}</td>
                            <td>{item.itemId}</td>
                            <td>
                              <div>
                                <strong>{item.itemName}</strong>
                                <div className="mt-1">
                                  <span className="badge bg-info me-2" style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                                    <i className="fas fa-hashtag me-1"></i>{item.pvmsNo}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>{item.availableQty}</td>
                            <td>{item.rolQty}</td>
                            <td style={{ textAlign: "center" }}>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={item.selected || false}
                                  onChange={(e) => handleROLItemSelect(item.id, e.target.checked)}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowROLPopup(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleImportROLItems}
                  disabled={rolItems.length === 0}
                >
                  Import Selected Items
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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