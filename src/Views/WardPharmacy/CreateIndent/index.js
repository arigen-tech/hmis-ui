import { useState, useEffect, useRef } from "react"
import { useNavigate } from 'react-router-dom';
import Popup from "../../../Components/popup"
import ConfirmationPopup from "../../../Components/ConfirmationPopup";
import { Store_Internal_Indent, ALL_REPORTS, INVENTORY, SECTION_ID_FOR_DRUGS } from "../../../config/apiConfig";
import { getRequest, postRequest } from "../../../service/apiService"
import LoadingScreen from "../../../Components/Loading";
import DatePicker from "../../../Components/DatePicker";

import {
  SELECT_DRUG_ERROR,
  DUPLICATE_DRUG_WARNING,
  MINIMUM_ROWS_WARNING,
  EMPTY_DRUG_NAME_WARNING,
  INVALID_DEPARTMENT_ERROR,
  INVALID_DATE_ERROR,
  INVALID_QUANTITY_ERROR,
  EXCEED_STOCK_ERROR,
  MANDATORY_FIELD_WARNING,
  DUPLICATE_DRUGS_WARNING,
  NO_VALID_DRUGS_WARNING,
  INDENT_SAVE_SUCCESS,
  INDENT_SUBMIT_SUCCESS,
  INDENT_SAVE_ERROR,
  INDENT_SUBMIT_ERROR,
  NO_ROL_ITEMS_WARNING,
  ROL_IMPORT_SUCCESS,
  ROL_LOAD_ERROR,
  NO_ROL_DATA,
  IMPORT_FROM_PREVIOUS,
  INDENT_SAVE_TITLE,
  INDENT_SAVE_FILE_NAME,
  INDENT_SUBMIT_TITLE,
  INDENT_SUBMIT_FILE_NAME,
  FETCH_DEPARTMENT_ERR_MSG,
  FETCH_ITEM_ERR_MSG,
  FETCH_ITEM_DETAILS_ERR_MSG,
  INDENT_TYPE_CHANGE_WARN_MSG,
  INDENT_TYPE_MANDARORY_WARN_MSG
} from "../../../config/constants";
import { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const IndentCreation = () => {
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null)
  const [confirmationPopup, setConfirmationPopup] = useState(null);
  const departmentId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId");
  const hospitalId = sessionStorage.getItem("hospitalId");

  // Form State
  const [indentDate, setIndentDate] = useState(new Date().toISOString().split("T")[0]);
  const [department, setDepartment] = useState("");
  const [departments, setDepartments] = useState([]);
  const [loggedInDepartment, setLoggedInDepartment] = useState("");

  const [indentType, setIndentType] = useState(""); 
  const [pendingIndentType, setPendingIndentType] = useState(null);

  // Drug search state with debounce - Now per row
  const [itemDropdown, setItemDropdown] = useState([]);
  const [itemSearch, setItemSearch] = useState("");
  const [itemPage, setItemPage] = useState(0);
  const [itemLastPage, setItemLastPage] = useState(true);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [isItemLoading, setIsItemLoading] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState(null);
  
  // Refs for debounce and dropdown
  const debounceItemRef = useRef(null);
  const dropdownItemRef = useRef(null);

  const [indentEntries, setIndentEntries] = useState([
    { id: 1, drugCode: "", drugName: "", unit: "", requiredQty: "", storesStock: "", wardStock: "", reason: "", drugId: null, drugData: null },
  ]);

  // Validation state
  const [errors, setErrors] = useState({});

  // ROL Popup State
  const [showROLPopup, setShowROLPopup] = useState(false);
  const [rolItems, setRolItems] = useState([]);

  const navigate = useNavigate();

  // Fetch current department by ID
  const fetchCurrentDepartment = async () => {
    try {
      if (!departmentId) {
        console.warn("No department ID found in session storage");
        setLoggedInDepartment("Unknown Department");
        return;
      }

      const response = await getRequest(`${INVENTORY}/currentDepartment/${departmentId}`);
      console.log("Current Department API Response:", response);

      if (response && response.data) {
        setLoggedInDepartment(response.data.departmentName || response.data.name || "Unknown Department");
      } else if (response && response.response) {
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
      const response = await getRequest(`${INVENTORY}/indentApplicable/departments`);
      console.log("Departments API Response:", response);

      if (response && response.response && Array.isArray(response.response)) {
        setDepartments(response.response);
      } else if (response && Array.isArray(response)) {
        setDepartments(response);
      } else {
        console.error("Unexpected departments response structure:", response);
        showPopup(FETCH_DEPARTMENT_ERR_MSG, "error");
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
      showPopup(FETCH_DEPARTMENT_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch items from API with debounce - Modified to use sectionId based on indent type
  const fetchItems = async (page, searchText = "") => {
    try {
      setIsItemLoading(true);
      // Determine section ID based on indent type
      const params = new URLSearchParams();

if (indentType === "drug") {
  params.append("sectionId", SECTION_ID_FOR_DRUGS);
}

params.append("keyword", searchText);
params.append("page", page);
params.append("size", DEFAULT_ITEMS_PER_PAGE);

const url = `${INVENTORY}/item/search?${params.toString()}`;
      const data = await getRequest(url);

      if (data.status === 200 && data.response?.content) {
        return {
          list: data.response.content,
          last: data.response.last,
          totalPages: data.response.totalPages,
          totalElements: data.response.totalElements
        };
      }
      return { list: [], last: true, totalPages: 0, totalElements: 0 };
    } catch (error) {
      console.error("Error fetching items:", error);
      return { list: [], last: true, totalPages: 0, totalElements: 0 };
    } finally {
      setIsItemLoading(false);
    }
  };

  // Fetch item details by ID
  const fetchItemDetails = async (itemId) => {
    try {
      const url = `${INVENTORY}/item/${itemId}?hospitalId=${hospitalId}`;
      const response = await getRequest(url);
      
      if (response.status === 200 && response.response) {
        return response.response;
      }
      return null;
    } catch (error) {
      console.error("Error fetching item details:", error);
      showPopup(FETCH_ITEM_DETAILS_ERR_MSG, "error");
      return null;
    } 
  };

  // Handle item search with debounce - Now per row
  const handleItemSearch = (value, index) => {
    // Check if indent type is selected
    if (!indentType) {
      showPopup("Please select Indent Type first", "warning");
      return;
    }

    setItemSearch(value);
    setActiveRowIndex(index);
    
    // Update the drugName in the entry
    const newEntries = [...indentEntries];
    newEntries[index] = {
      ...newEntries[index],
      drugName: value
    };
    setIndentEntries(newEntries);
    
    // Clear selections when user types
    if (!value.trim() || (newEntries[index].drugId && !value.includes(newEntries[index].drugName))) {
      newEntries[index] = {
        ...newEntries[index],
        drugId: null,
        drugCode: "",
        unit: "",
        storesStock: "",
        wardStock: "",
        drugData: null
      };
      setIndentEntries(newEntries);
    }

    // Debounce API call
    if (debounceItemRef.current) clearTimeout(debounceItemRef.current);
    debounceItemRef.current = setTimeout(async () => {
      if (!value.trim()) {
        setItemDropdown([]);
        setShowItemDropdown(false);
        return;
      }
      const result = await fetchItems(0, value);
      setItemDropdown(result.list);
      setItemLastPage(result.last);
      setItemPage(0);
      setShowItemDropdown(true);
    }, 700);
  };

  // Load first page of items for dropdown - Now per row
  const loadFirstItemPage = (searchText) => {
    if (!searchText.trim() || !indentType) return;
    setItemSearch(searchText);
    fetchItems(0, searchText).then(result => {
      setItemDropdown(result.list);
      setItemLastPage(result.last);
      setItemPage(0);
      setShowItemDropdown(true);
    });
  };

  // Load more items for infinite scroll
  const loadMoreItems = async () => {
    if (itemLastPage) return;
    const nextPage = itemPage + 1;
    const result = await fetchItems(nextPage, itemSearch);
    setItemDropdown(prev => [...prev, ...result.list]);
    setItemLastPage(result.last);
    setItemPage(nextPage);
  };

  // Handle item selection from dropdown
  const handleItemSelect = async (index, item) => {
    // Check if drug is already selected in another row
    const isDuplicate = indentEntries.some((entry, i) => 
      i !== index && entry.drugId === item.itemId
    );

    if (isDuplicate) {
      showPopup(DUPLICATE_DRUG_WARNING, "warning");
      return;
    }

    // Fetch complete item details
    const itemDetails = await fetchItemDetails(item.itemId);
    
    if (itemDetails) {
      const newEntries = [...indentEntries];
      
      // Use available stock fields from the API response
      const storesStock = itemDetails.storestocks !== null && itemDetails.storestocks !== undefined ? itemDetails.storestocks : 0;
      const wardStock = itemDetails.wardstocks !== null && itemDetails.wardstocks !== undefined ? itemDetails.wardstocks : 0;

      // Update the selected row with complete item information
      newEntries[index] = {
        ...newEntries[index],
        drugId: itemDetails.itemId,
        drugCode: itemDetails.pvmsNo || "",
        drugName: itemDetails.nomenclature || "",
        unit: itemDetails.unitAuName || itemDetails.dispUnitName || "",
        storesStock: storesStock,
        wardStock: wardStock,
        drugData: {
          reOrderLevelStore: itemDetails.reOrderLevelStore,
          reOrderLevelDispensary: itemDetails.reOrderLevelDispensary,
          adispQty: itemDetails.adispQty,
          storestocks: itemDetails.storestocks,
          wardstocks: itemDetails.wardstocks,
          dispstocks: itemDetails.dispstocks,
          sectionName: itemDetails.sectionName,
          itemTypeName: itemDetails.itemTypeName,
          groupName: itemDetails.groupName,
          itemClassName: itemDetails.itemClassName
        }
      };

      setIndentEntries(newEntries);
      setItemSearch(""); // Clear the search after selection
      setShowItemDropdown(false); // Hide dropdown
      setActiveRowIndex(null);

      // Clear errors for this row
      const newErrors = { ...errors };
      delete newErrors[`drug_${index}`];
      delete newErrors[`qty_${index}`];
      delete newErrors[`stock_${index}`];
      setErrors(newErrors);
    }
  };

  // Handle indent type change with confirmation
  const handleIndentTypeChange = (e) => {
    const newIndentType = e.target.value;
    
    // Check if there are any non-empty entries (with drug name or drugId)
    const hasData = indentEntries.some(entry => 
      entry.drugName?.trim() !== "" || entry.drugId !== null
    );

    if (hasData && newIndentType !== indentType) {
      // Store the pending indent type and show confirmation
      setPendingIndentType(newIndentType);
      setConfirmationPopup({
        message: INDENT_TYPE_CHANGE_WARN_MSG,
        onConfirm: () => {
          // User confirmed - change indent type and clear data
          setIndentType(newIndentType);
          
          // Clear indent type error if exists
          if (errors.indentType) {
            const newErrors = { ...errors };
            delete newErrors.indentType;
            setErrors(newErrors);
          }
          
          // Reset item search and dropdown
          setItemSearch("");
          setItemDropdown([]);
          setShowItemDropdown(false);
          setActiveRowIndex(null);
          
          // Clear drug selections from all rows
          setIndentEntries(prevEntries => 
            prevEntries.map(entry => ({
              ...entry,
              drugCode: "",
              drugName: "",
              unit: "",
              requiredQty: "",
              storesStock: "",
              wardStock: "",
              drugId: null,
              drugData: null
            }))
          );
          
          setPendingIndentType(null);
          setConfirmationPopup(null);
        },
        onCancel: () => {
          // User cancelled - revert to previous indent type
          setPendingIndentType(null);
          setConfirmationPopup(null);
        },
        confirmText: "Yes",
        cancelText: "No",
        type: "warning"
      });
    } else {
      // No data or same indent type - change directly
      setIndentType(newIndentType);
      
      // Clear indent type error if exists
      if (errors.indentType) {
        const newErrors = { ...errors };
        delete newErrors.indentType;
        setErrors(newErrors);
      }
      
      // Reset item search and dropdown
      setItemSearch("");
      setItemDropdown([]);
      setShowItemDropdown(false);
      setActiveRowIndex(null);
      
      // If switching to a different indent type with no data, still clear the rows
      if (newIndentType !== indentType) {
        setIndentEntries(prevEntries => 
          prevEntries.map(entry => ({
            ...entry,
            drugCode: "",
            drugName: "",
            unit: "",
            requiredQty: "",
            storesStock: "",
            wardStock: "",
            drugId: null,
            drugData: null
          }))
        );
      }
    }
  };

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownItemRef.current && !dropdownItemRef.current.contains(e.target)) {
        setShowItemDropdown(false);
        setActiveRowIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchDepartments();
    fetchCurrentDepartment();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle entry change
  const handleEntryChange = (id, field, value) => {
    setIndentEntries(prevEntries => {
      const updatedEntries = prevEntries.map(entry =>
        entry.id === id ? { ...entry, [field]: value } : entry
      );
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
    // Check if current row has drug name
    const lastRow = indentEntries[indentEntries.length - 1];

    if (!lastRow.drugName || lastRow.drugName.trim() === "") {
      showPopup(EMPTY_DRUG_NAME_WARNING, "warning");
      return;
    }

    const newId = Math.max(...indentEntries.map(e => e.id), 0) + 1;
    setIndentEntries([
      ...indentEntries,
      { id: newId, drugCode: "", drugName: "", unit: "", requiredQty: "", storesStock: "", wardStock: "", reason: "", drugId: null, drugData: null }
    ]);
  };

  const handleDeleteRow = (id) => {
    if (indentEntries.length > 1) {
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
      showPopup(MINIMUM_ROWS_WARNING, "warning");
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

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Department validation
    if (!department) {
      newErrors.department = INVALID_DEPARTMENT_ERROR;
    }

    // Date validation
    if (!indentDate) {
      newErrors.indentDate = INVALID_DATE_ERROR;
    }

    // Indent Type validation
    if (!indentType) {
      newErrors.indentType = "Please select Indent Type";
    }

    // Entries validation - check for drugId
    indentEntries.forEach((entry, index) => {
      if (!entry.drugId) {
        newErrors[`drug_${index}`] = SELECT_DRUG_ERROR;
      }
      if (!entry.requiredQty || entry.requiredQty <= 0) {
        newErrors[`qty_${index}`] = INVALID_QUANTITY_ERROR;
      }
      if (entry.requiredQty && entry.storesStock && parseFloat(entry.requiredQty) > parseFloat(entry.storesStock)) {
        newErrors[`stock_${index}`] = EXCEED_STOCK_ERROR;
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

  // ROL Popup Functions
  const handleImportROL = async () => {
    console.log("Import from ROL triggered");
    try {
      setLoading(true);
      await fetchROLItems();
      setShowROLPopup(true);
    } catch (err) {
      console.error("Error preparing ROL popup:", err);
      showPopup(ROL_LOAD_ERROR, "error");
    } finally {
      setLoading(false);
    }
  };

  // Update the ROL items fetch
  const fetchROLItems = async () => {
    try {
      setLoading(true);
      const response = await getRequest(`${Store_Internal_Indent}/rol-items`);
      console.log("ROL Items API Response:", response);

      if (response && response.response && Array.isArray(response.response)) {
        const rolItemsData = response.response.map(item => ({
          id: item.itemId,
          itemId: item.itemId,
          itemName: item.itemName,
          availableQty: item.availableQty || 0,
          rolQty: item.rolQty || 0,
          selected: false,
          pvmsNo: item.pvmsNo,
          unit: item.unit,
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
        showPopup(NO_ROL_DATA, "info");
      }
    } catch (err) {
      console.error("Error fetching ROL items:", err);
      setRolItems([]);
      showPopup(ROL_LOAD_ERROR, "error");
    } finally {
      setLoading(false);
    }
  };

  // Update ROL import function
  const handleImportROLItems = () => {
    const selectedItems = rolItems.filter(item => item.selected);

    if (selectedItems.length === 0) {
      showPopup(NO_ROL_ITEMS_WARNING, "warning");
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
        drugId: item.itemId,
        drugData: {
          itemId: item.itemId,
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

    setShowROLPopup(false);
    showPopup(`${selectedItems.length} ${ROL_IMPORT_SUCCESS}`, "success");
  };

  const handleImportPreviousIndent = () => {
    console.log("Import from Previous Indent triggered");
    showPopup(IMPORT_FROM_PREVIOUS, "info");
  };

  // Handle select all checkbox in ROL popup
  const handleSelectAllROL = (e) => {
    const isChecked = e.target.checked;
    const updatedRolItems = rolItems.map(item => ({
      ...item,
      selected: isChecked
    }));
    setRolItems(updatedRolItems);
  };

  // Handle individual checkbox selection in ROL popup
  const handleROLItemSelect = (id, isSelected) => {
    const updatedRolItems = rolItems.map(item =>
      item.id === id ? { ...item, selected: isSelected } : item
    );
    setRolItems(updatedRolItems);
  };

  // Function to reset form
  const resetForm = () => {
    setIndentDate(new Date().toISOString().split("T")[0]);
    setDepartment("");
    setIndentType(""); // Reset indent type
    setIndentEntries([
      { id: 1, drugCode: "", drugName: "", unit: "", requiredQty: "", storesStock: "", wardStock: "", reason: "", drugId: null, drugData: null },
    ]);
    setErrors({});
    setShowItemDropdown(false);
    setActiveRowIndex(null);
    setItemSearch("");
    setItemDropdown([]);
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

  const handleSave = async () => {
    // Validate form
    if (!validateForm()) {
      showPopup(`${MANDATORY_FIELD_WARNING}`, "warning");
      return;
    }

    // Check for duplicate drugs
    if (hasDuplicateDrugs()) {
      showPopup(`${DUPLICATE_DRUGS_WARNING}`, "warning");
      return;
    }

    // Build ISO datetime string
    const now = new Date();
    const indentDateTime = now.toISOString().slice(0, 19);

    // Filter out entries without drugId
    const validEntries = indentEntries.filter(entry => entry.drugId);

    if (validEntries.length === 0) {
      showPopup(`${NO_VALID_DRUGS_WARNING}`, "warning");
      return;
    }

    const payload = {
      indentMId: null,
      indentDate: indentDateTime,
      toDeptId: department ? Number(department) : null,
      items: validEntries.map(entry => ({
        itemId: Number(entry.drugId),
        requestedQty: entry.requiredQty ? Number(entry.requiredQty) : 0,
        reason: entry.reason || "",
        availableStock: entry.wardStock ? Number(entry.wardStock) : 0,
      })),
    };

    debugPayload(payload);

    try {
      setLoading(true);
      console.log("Saving indent payload:", payload);

      const response = await postRequest(`${INVENTORY}/indent/save`, payload);
      console.log("Save response:", response);

      // Show confirmation popup instead of regular popup
      setConfirmationPopup({
        message: INDENT_SAVE_SUCCESS,
        onConfirm: () => {
          // If you have a view page for indents, navigate to it
          navigate('/ViewDownloadReport', {
            state: {
              reportUrl: `${ALL_REPORTS}/indentReport?indentMId=${response.response?.indentMId}`,
              title: INDENT_SAVE_TITLE,
              fileName: INDENT_SAVE_FILE_NAME,
              returnPath: window.location.pathname
            }
          });

          // Reset form after navigation
          resetForm();
          setConfirmationPopup(null);
        },
        onCancel: () => {
          // Reset form and stay on same page
          resetForm();
          setConfirmationPopup(null);
        },
        confirmText: "Yes",
        cancelText: "No",
        type: "success"
      });

    } catch (err) {
      console.error("Error saving indent:", err);
      // Show error popup without navigation
      setConfirmationPopup({
        message: INDENT_SAVE_ERROR,
        onConfirm: () => {
          setConfirmationPopup(null);
        },
        onCancel: () => {
          setConfirmationPopup(null);
        },
        confirmText: "OK",
        cancelText: "Close",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate form
    if (!validateForm()) {
      showPopup(`${MANDATORY_FIELD_WARNING}`, "warning");
      return;
    }

    // Check for duplicate drugs
    if (hasDuplicateDrugs()) {
      showPopup(`${DUPLICATE_DRUGS_WARNING}`, "warning");
      return;
    }

    // Build ISO datetime string (LocalDateTime-compatible)
    const now = new Date();
    const indentDateTime = now.toISOString().slice(0, 19);

    // Filter out entries without drugId and build payload
    const validEntries = indentEntries.filter(entry => entry.drugId);

    if (validEntries.length === 0) {
      showPopup(`${NO_VALID_DRUGS_WARNING}`, "warning");
      return;
    }

    const payload = {
      indentMId: null,
      indentDate: indentDateTime,
      toDeptId: department ? Number(department) : null,
      items: validEntries.map(entry => ({
        itemId: Number(entry.drugId),
        requestedQty: entry.requiredQty ? Number(entry.requiredQty) : 0,
        reason: entry.reason || "",
        availableStock: entry.wardStock ? Number(entry.wardStock) : 0,
      })),
    };

    debugPayload(payload);

    try {
      setLoading(true);
      console.log("Submitting indent payload:", payload);

      const response = await postRequest(`${INVENTORY}/indent/submit`, payload);
      console.log("Submit response:", response);

      // Show confirmation popup instead of regular popup
      setConfirmationPopup({
        message: INDENT_SUBMIT_SUCCESS,
        onConfirm: () => {
          // If you have a view page for indents, navigate to it
          navigate('/ViewDownloadReport', {
            state: {
              reportUrl: `${ALL_REPORTS}/indentReport?indentMId=${response.response?.indentMId}`,
              title: INDENT_SUBMIT_TITLE,
              fileName: INDENT_SUBMIT_FILE_NAME,
              returnPath: window.location.pathname
            }
          });

          // For now, just reset the form
          resetForm();
          setConfirmationPopup(null);
        },
        onCancel: () => {
          // Reset form and stay on same page
          resetForm();
          setConfirmationPopup(null);
        },
        confirmText: "Yes",
        cancelText: "No",
        type: "success"
      });

    } catch (err) {
      console.error("Error submitting indent:", err);
      showPopup(INDENT_SUBMIT_ERROR, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-wrapper">
      {loading && <LoadingScreen />}
      
      {/* Use the independent ConfirmationPopup component */}
      <ConfirmationPopup
        show={confirmationPopup !== null}
        message={confirmationPopup?.message || ''}
        type={confirmationPopup?.type || 'info'}
        onConfirm={confirmationPopup?.onConfirm || (() => {})}
        onCancel={confirmationPopup?.onCancel}
        confirmText={confirmationPopup?.confirmText || 'OK'}
        cancelText={confirmationPopup?.cancelText}
      />

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
                  <DatePicker
                    label="Indent Date"
                    value={indentDate}
                    onChange={(date) => {
                      setIndentDate(date);
                      if (errors.indentDate) {
                        const newErrors = { ...errors };
                        delete newErrors.indentDate;
                        setErrors(newErrors);
                      }
                    }}
                    error={errors.indentDate}
                    required={true}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold">Indent Type <span className="text-danger">*</span></label>
                  <select
                    className={`form-select ${errors.indentType ? 'is-invalid' : ''}`}
                    value={indentType}
                    onChange={handleIndentTypeChange}
                  >
                    <option value="">Select Indent Type</option>
                    <option value="drug">Drug</option>
                    <option value="nondrug">Non Drug</option>
                  </select>
                  {errors.indentType && <div className="invalid-feedback">{errors.indentType}</div>}
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold">Department <span className="text-danger">*</span></label>
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
                        Item Name / Item Code
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
                        <td style={{ position: 'relative' }} ref={dropdownItemRef}>
                          <div className="dropdown-search-container position-relative">
                            <input
                              type="text"
                              className={`form-control ${errors[`drug_${index}`] ? 'is-invalid' : ''}`}
                              value={entry.drugName} // Bind to entry.drugName for this specific row
                              autoComplete="off"
                              onChange={(e) => handleItemSearch(e.target.value, index)}
                              onClick={() => {
                                if (entry.drugName?.trim() && indentType) {
                                  loadFirstItemPage(entry.drugName);
                                } else if (!indentType) {
                                  showPopup(INDENT_TYPE_MANDARORY_WARN_MSG, "warning");
                                }
                              }}
                              placeholder={indentType ? "Type item name or code..." : "Select Indent Type first"}
                              style={{ borderRadius: "4px", minWidth: "280px" }}
                              disabled={!indentType}
                            />
                            {errors[`drug_${index}`] && (
                              <div className="invalid-feedback d-block">{errors[`drug_${index}`]}</div>
                            )}

                            {/* Search Dropdown - Only show for active row */}
                            {showItemDropdown && activeRowIndex === index && indentType && (
                              <div 
                                className="border rounded mt-1 bg-white position-absolute w-100"
                                style={{ maxHeight: "250px", zIndex: 1000, overflowY: "auto" }}
                                onScroll={(e) => {
                                  const target = e.target;
                                  if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50) {
                                    loadMoreItems();
                                  }
                                }}
                              >
                                {isItemLoading && itemDropdown.length === 0 ? (
                                  <div className="text-center p-3">
                                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                                      <span className="visually-hidden">Loading...</span>
                                    </div>
                                  </div>
                                ) : itemDropdown.length > 0 ? (
                                  <>
                                    {itemDropdown.map((item) => {
                                      const isSelectedInOtherRow = indentEntries.some(
                                        (e, i) => i !== index && e.drugId === item.itemId
                                      );
                                      return (
                                        <div
                                          key={item.itemId}
                                          className="p-2 cursor-pointer hover-bg-light"
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            if (!isSelectedInOtherRow) {
                                              handleItemSelect(index, item);
                                            }
                                          }}
                                          style={{ 
                                            cursor: isSelectedInOtherRow ? 'not-allowed' : 'pointer',
                                            backgroundColor: isSelectedInOtherRow ? '#fff3cd' : 'transparent',
                                            borderBottom: '1px solid #f0f0f0'
                                          }}
                                        >
                                          <div className="fw-bold">{item.nomenclature}</div>
                                          <div className="d-flex justify-content-between align-items-center">
                                            <small className="text-muted">PVMS: {item.pvmsNo}</small>
                                            {isSelectedInOtherRow && (
                                              <span className="badge bg-warning text-dark">Already Added</span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                    
                                    {!itemLastPage && (
                                      <div className="text-center p-2 text-primary small">
                                        {isItemLoading ? 'Loading...' : 'Scroll to load more...'}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="p-2 text-muted text-center">No items found</div>
                                )}
                              </div>
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
                    <p>{NO_ROL_DATA}</p>
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

      {/* Regular Popup for other messages */}
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

export default IndentCreation;