import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from 'react-router-dom';
import Popup from "../../../Components/popup"
import ConfirmationPopup from "../../../Components/ConfirmationPopup";
import {  SECTION_ID_FOR_DRUGS, GET_CURRENT_DEPARTMENT, GET_INDENT_APPLICABLE_DEPARTEMENTS, REQUEST_PARAM_SECTION_ID, REQUEST_PARAM_PAGE, REQUEST_PARAM_SIZE, GET_ALL_ITEMS_BY_NAME, GET_ITEM_DETAILS_BY_ID, REQUEST_PARAM_HOSPITAL_ID, REQUEST_PARAM_REQUESTED_DEPT_ID, REQUEST_PARAM_CURRENT_DEPT_ID, GET_ROL_ITEMS, SAVE_INDENT, SUBMIT_INDENT, INDENT_REPORT_URL, REQUERST_PARAM_INDENT_M_ID, REQUEST_PARAM_KEYWORD } from "../../../config/apiConfig";
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
  FETCH_ITEM_DETAILS_ERR_MSG,
  INDENT_TYPE_CHANGE_WARN_MSG,
  SELECT_INDENT_TYPE_WARN_MSG,
  SELECT_REQ_DEPARTMENT_TYPE_WARN_MSG,
  SELECT_BOTH_INDENT_TYPE_AND_REQ_DEPT_WARN_MSG
} from "../../../config/constants";
import { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const PortalDropdown = ({ anchorRef, show, children }) => {
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (!show || !anchorRef?.current) return;

    const updatePosition = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      setStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 99999,
        maxHeight: "250px",
        overflowY: "auto",
        background: "#fff",
        border: "1px solid #dee2e6",
        borderRadius: "4px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      });
    };

    updatePosition();

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [show, anchorRef]);

  if (!show) return null;
  return createPortal(
    <div style={style}>{children}</div>,
    document.body
  );
};

const IndentCreation = () => {
  const [loading, setLoading] = useState(false);
  const[isSaving, setIsSaving] = useState(false);
  const[isSubmitting, setIsSubmitting] = useState(false);
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

  // Refs for debounce and per-row input anchoring
  const debounceItemRef = useRef(null);
  const inputRefs = useRef({});

  const [indentEntries, setIndentEntries] = useState([
    { id: 1, drugCode: "", drugName: "", unit: "", requiredQty: "", requestedDeptStock: "", currentDeptStock: "", reason: "", drugId: null, drugData: null },
  ]);

  // Validation state
  const [errors, setErrors] = useState({});

  // ROL Popup State
  const [showROLPopup, setShowROLPopup] = useState(false);
  const [rolItems, setRolItems] = useState([]);

  // Department Change Popup State
  const [showDepartmentPopup, setShowDepartmentPopup] = useState(false);
  const [pendingDepartment, setPendingDepartment] = useState(null);
  const [isRefreshingStock, setIsRefreshingStock] = useState(false);

  const navigate = useNavigate();

  // ── close dropdown when clicking outside any tracked input ──────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedInsideInput = Object.values(inputRefs.current).some(
        (ref) => ref && ref.contains(e.target)
      );
      if (!clickedInsideInput) {
        setShowItemDropdown(false);
        setActiveRowIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch current department by ID
  const fetchCurrentDepartment = async () => {
    try {
      if (!departmentId) {
        console.warn("No department ID found in session storage");
        setLoggedInDepartment("Unknown Department");
        return;
      }

      const response = await getRequest(`${GET_CURRENT_DEPARTMENT}/${departmentId}`);
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
      const response = await getRequest(`${GET_INDENT_APPLICABLE_DEPARTEMENTS}`);
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
      const params = new URLSearchParams();

      if (indentType === "drug") {
        params.append([REQUEST_PARAM_SECTION_ID], SECTION_ID_FOR_DRUGS);
      }

      params.append([REQUEST_PARAM_KEYWORD], searchText);
      params.append([REQUEST_PARAM_PAGE], page);
      params.append([REQUEST_PARAM_SIZE], DEFAULT_ITEMS_PER_PAGE);

      const url = `${GET_ALL_ITEMS_BY_NAME}?${params.toString()}`;
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

  // Fetch item details by ID with department parameters
  const fetchItemDetails = async (itemId, requestedDeptId, currentDeptId) => {
    try {
      const url = `${GET_ITEM_DETAILS_BY_ID}/${itemId}?${REQUEST_PARAM_HOSPITAL_ID}=${hospitalId}&${REQUEST_PARAM_REQUESTED_DEPT_ID}=${requestedDeptId}&${REQUEST_PARAM_CURRENT_DEPT_ID}=${currentDeptId}`;
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
    // Check if both indent type AND department are selected
    if (!indentType || !department) {
      showPopup(SELECT_BOTH_INDENT_TYPE_AND_REQ_DEPT_WARN_MSG, "warning");
      return;
    }

    setItemSearch(value);
    setActiveRowIndex(index);

    const newEntries = [...indentEntries];
    newEntries[index] = { ...newEntries[index], drugName: value };

    if (!value.trim() || (newEntries[index].drugId && !value.includes(newEntries[index].drugName))) {
      newEntries[index] = {
        ...newEntries[index],
        drugId: null,
        drugCode: "",
        unit: "",
        requestedDeptStock: "",
        currentDeptStock: "",
        drugData: null
      };
    }
    setIndentEntries(newEntries);

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
    if (!searchText.trim() || !indentType || !department) return;
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
    const isDuplicate = indentEntries.some((entry, i) =>
      i !== index && entry.drugId === item.itemId
    );

    if (isDuplicate) {
      showPopup(DUPLICATE_DRUG_WARNING, "warning");
      return;
    }

    // Get current department ID from session/local storage
    const currentDeptId = departmentId;
    
    // Get requested department ID from selected department
    const requestedDeptId = department;

    const itemDetails = await fetchItemDetails(item.itemId, requestedDeptId, currentDeptId);

    if (itemDetails) {
      const newEntries = [...indentEntries];

      // Use requestedDeptStocks for requested department stock
      const requestedDeptStock = itemDetails.requestedDeptStocks !== null && itemDetails.requestedDeptStocks !== undefined ? itemDetails.requestedDeptStocks : 0;
      
      // Use currentDeptStocks for current department stock
      const currentDeptStock = itemDetails.currentDeptStocks !== null && itemDetails.currentDeptStocks !== undefined ? itemDetails.currentDeptStocks : 0;

      newEntries[index] = {
        ...newEntries[index],
        drugId: itemDetails.itemId,
        drugCode: itemDetails.pvmsNo || "",
        drugName: itemDetails.nomenclature || "",
        unit: itemDetails.unitAuName || itemDetails.dispUnitName || "",
        requestedDeptStock: requestedDeptStock,
        currentDeptStock: currentDeptStock,
        drugData: {
          reOrderLevelStore: itemDetails.reOrderLevelStore,
          reOrderLevelDispensary: itemDetails.reOrderLevelDispensary,
          adispQty: itemDetails.adispQty,
          requestedDeptStocks: itemDetails.requestedDeptStocks,
          currentDeptStocks: itemDetails.currentDeptStocks,
          dispstocks: itemDetails.dispstocks,
          sectionName: itemDetails.sectionName,
          itemTypeName: itemDetails.itemTypeName,
          groupName: itemDetails.groupName,
          itemClassName: itemDetails.itemClassName
        }
      };

      setIndentEntries(newEntries);
      setItemSearch("");
      setShowItemDropdown(false);
      setActiveRowIndex(null);

      const newErrors = { ...errors };
      delete newErrors[`drug_${index}`];
      delete newErrors[`qty_${index}`];
      delete newErrors[`stock_${index}`];
      setErrors(newErrors);
    }
  };

  // Handle department change - refresh stock for all existing items with popup
  const handleDepartmentChange = (deptId) => {
    // Check if there are existing items with stock data
    const hasItemsWithStock = indentEntries.some(entry => entry.drugId && (entry.requestedDeptStock !== "" || entry.currentDeptStock !== ""));
    
    if (hasItemsWithStock && deptId !== department) {
      // Show confirmation popup before changing department
      setPendingDepartment(deptId);
      setShowDepartmentPopup(true);
    } else {
      // Directly change department if no items or no stock data
      performDepartmentChange(deptId);
    }
  };

  // Perform the actual department change and stock refresh
  const performDepartmentChange = async (deptId) => {
    setDepartment(deptId);
    
    if (errors.department) {
      const newErrors = { ...errors };
      delete newErrors.department;
      setErrors(newErrors);
    }

    // If there are existing items, refresh their department stock
    if (deptId && indentEntries.some(entry => entry.drugId)) {
      setIsRefreshingStock(true);
      const currentDeptId = departmentId;
      const updatedEntries = await Promise.all(
        indentEntries.map(async (entry) => {
          if (entry.drugId) {
            const itemDetails = await fetchItemDetails(entry.drugId, deptId, currentDeptId);
            if (itemDetails) {
              return { 
                ...entry, 
                requestedDeptStock: itemDetails.requestedDeptStocks || 0,
                currentDeptStock: itemDetails.currentDeptStocks || 0
              };
            }
          }
          return entry;
        })
      );
      setIndentEntries(updatedEntries);
      setIsRefreshingStock(false);
    }
  };

  // Handle indent type change with confirmation
  const handleIndentTypeChange = (e) => {
    const newIndentType = e.target.value;

    const hasData = indentEntries.some(entry =>
      entry.drugName?.trim() !== "" || entry.drugId !== null
    );

    if (hasData && newIndentType !== indentType) {
      setPendingIndentType(newIndentType);
      setConfirmationPopup({
        message: INDENT_TYPE_CHANGE_WARN_MSG,
        onConfirm: () => {
          setIndentType(newIndentType);

          if (errors.indentType) {
            const newErrors = { ...errors };
            delete newErrors.indentType;
            setErrors(newErrors);
          }

          setItemSearch("");
          setItemDropdown([]);
          setShowItemDropdown(false);
          setActiveRowIndex(null);

          setIndentEntries(prevEntries =>
            prevEntries.map(entry => ({
              ...entry,
              drugCode: "",
              drugName: "",
              unit: "",
              requiredQty: "",
              requestedDeptStock: "",
              currentDeptStock: "",
              drugId: null,
              drugData: null
            }))
          );

          setPendingIndentType(null);
          setConfirmationPopup(null);
        },
        onCancel: () => {
          setPendingIndentType(null);
          setConfirmationPopup(null);
        },
        confirmText: "Yes",
        cancelText: "No",
        type: "warning"
      });
    } else {
      setIndentType(newIndentType);

      if (errors.indentType) {
        const newErrors = { ...errors };
        delete newErrors.indentType;
        setErrors(newErrors);
      }

      setItemSearch("");
      setItemDropdown([]);
      setShowItemDropdown(false);
      setActiveRowIndex(null);

      if (newIndentType !== indentType) {
        setIndentEntries(prevEntries =>
          prevEntries.map(entry => ({
            ...entry,
            drugCode: "",
            drugName: "",
            unit: "",
            requiredQty: "",
            requestedDeptStock: "",
            currentDeptStock: "",
            drugId: null,
            drugData: null
          }))
        );
      }
    }
  };

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
    const lastRow = indentEntries[indentEntries.length - 1];

    if (!lastRow.drugName || lastRow.drugName.trim() === "") {
      showPopup(EMPTY_DRUG_NAME_WARNING, "warning");
      return;
    }

    const newId = Math.max(...indentEntries.map(e => e.id), 0) + 1;
    setIndentEntries([
      ...indentEntries,
      { id: newId, drugCode: "", drugName: "", unit: "", requiredQty: "", requestedDeptStock: "", currentDeptStock: "", reason: "", drugId: null, drugData: null }
    ]);
  };

  const handleDeleteRow = (id) => {
    if (indentEntries.length > 1) {
      setIndentEntries(indentEntries.filter(entry => entry.id !== id));

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

    if (!department) {
      newErrors.department = INVALID_DEPARTMENT_ERROR;
    }

    if (!indentDate) {
      newErrors.indentDate = INVALID_DATE_ERROR;
    }

    if (!indentType) {
      newErrors.indentType = "Please select Indent Type";
    }

    indentEntries.forEach((entry, index) => {
      if (!entry.drugId) {
        newErrors[`drug_${index}`] = SELECT_DRUG_ERROR;
      }
      if (!entry.requiredQty || entry.requiredQty <= 0) {
        newErrors[`qty_${index}`] = INVALID_QUANTITY_ERROR;
      }
      if (entry.requiredQty && entry.requestedDeptStock && parseFloat(entry.requiredQty) > parseFloat(entry.requestedDeptStock)) {
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

  const fetchROLItems = async () => {
    try {
      setLoading(true);
      const response = await getRequest(`${GET_ROL_ITEMS}`);
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
          requestedDeptStock: item.storeStock || 0,
          currentDeptStock: item.wardStock || 0,
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
            requestedDeptStocks: item.storeStock || 0,
            currentDeptStocks: item.wardStock || 0,
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

  const handleImportROLItems = () => {
    const selectedItems = rolItems.filter(item => item.selected);

    if (selectedItems.length === 0) {
      showPopup(NO_ROL_ITEMS_WARNING, "warning");
      return;
    }

    const newEntries = selectedItems.map((item, index) => {
      const newId = index + 1;
      const requestedDeptStock = item.requestedDeptStock !== null && item.requestedDeptStock !== undefined ? item.requestedDeptStock : 0;
      const currentDeptStock = item.currentDeptStock !== null && item.currentDeptStock !== undefined ? item.currentDeptStock : 0;

      return {
        id: newId,
        drugCode: item.pvmsNo || "",
        drugName: item.itemName,
        unit: item.unit || "",
        requiredQty: item.rolQty,
        requestedDeptStock: requestedDeptStock,
        currentDeptStock: currentDeptStock,
        reason: "",
        drugId: item.itemId,
        drugData: {
          itemId: item.itemId,
          nomenclature: item.itemName,
          pvmsNo: item.pvmsNo,
          unitAuName: item.unit,
          requestedDeptStocks: requestedDeptStock,
          currentDeptStocks: currentDeptStock
        }
      };
    });

    const hasOnlyDefaultRow = indentEntries.length === 1 &&
      (!indentEntries[0].drugName || indentEntries[0].drugName.trim() === "");

    if (hasOnlyDefaultRow) {
      setIndentEntries(newEntries);
    } else {
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

  const handleSelectAllROL = (e) => {
    const isChecked = e.target.checked;
    const updatedRolItems = rolItems.map(item => ({ ...item, selected: isChecked }));
    setRolItems(updatedRolItems);
  };

  const handleROLItemSelect = (id, isSelected) => {
    const updatedRolItems = rolItems.map(item =>
      item.id === id ? { ...item, selected: isSelected } : item
    );
    setRolItems(updatedRolItems);
  };

  const resetForm = () => {
    setIndentDate(new Date().toISOString().split("T")[0]);
    setDepartment("");
    setIndentType("");
    setIndentEntries([
      { id: 1, drugCode: "", drugName: "", unit: "", requiredQty: "", requestedDeptStock: "", currentDeptStock: "", reason: "", drugId: null, drugData: null },
    ]);
    setErrors({});
    setShowItemDropdown(false);
    setActiveRowIndex(null);
    setItemSearch("");
    setItemDropdown([]);
  };

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
    if (!validateForm()) {
      showPopup(`${MANDATORY_FIELD_WARNING}`, "warning");
      return;
    }

    if (hasDuplicateDrugs()) {
      showPopup(`${DUPLICATE_DRUGS_WARNING}`, "warning");
      return;
    }

    const now = new Date();
    const indentDateTime = now.toISOString().slice(0, 19);

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
        availableStock: entry.currentDeptStock ? Number(entry.currentDeptStock) : 0,
      })),
    };

    debugPayload(payload);

    try {
      setIsSaving(true);
      console.log("Saving indent payload:", payload);

      const response = await postRequest(`${SAVE_INDENT}`, payload);
      console.log("Save response:", response);

      setConfirmationPopup({
        message: INDENT_SAVE_SUCCESS,
        onConfirm: () => {
          navigate('/ViewDownloadReport', {
            state: {
              reportUrl: `${INDENT_REPORT_URL}?${REQUERST_PARAM_INDENT_M_ID}=${response.response?.indentMId}`,
              title: INDENT_SAVE_TITLE,
              fileName: INDENT_SAVE_FILE_NAME,
              returnPath: window.location.pathname
            }
          });
          resetForm();
          setConfirmationPopup(null);
        },
        onCancel: () => {
          resetForm();
          setConfirmationPopup(null);
        },
        confirmText: "Yes",
        cancelText: "No",
        type: "success"
      });

    } catch (err) {
      console.error("Error saving indent:", err);
      setConfirmationPopup({
        message: INDENT_SAVE_ERROR,
        onConfirm: () => { setConfirmationPopup(null); },
        onCancel: () => { setConfirmationPopup(null); },
        confirmText: "OK",
        cancelText: "Close",
        type: "error"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showPopup(`${MANDATORY_FIELD_WARNING}`, "warning");
      return;
    }

    if (hasDuplicateDrugs()) {
      showPopup(`${DUPLICATE_DRUGS_WARNING}`, "warning");
      return;
    }

    const now = new Date();
    const indentDateTime = now.toISOString().slice(0, 19);

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
        availableStock: entry.currentDeptStock ? Number(entry.currentDeptStock) : 0,
      })),
    };

    debugPayload(payload);

    try {
      setIsSubmitting(true);
      console.log("Submitting indent payload:", payload);

      const response = await postRequest(`${SUBMIT_INDENT}`, payload);
      console.log("Submit response:", response);

      setConfirmationPopup({
        message: INDENT_SUBMIT_SUCCESS,
        onConfirm: () => {
          navigate('/ViewDownloadReport', {
            state: {
              reportUrl: `${INDENT_REPORT_URL}?${REQUERST_PARAM_INDENT_M_ID}=${response.response?.indentMId}`,
              title: INDENT_SUBMIT_TITLE,
              fileName: INDENT_SUBMIT_FILE_NAME,
              returnPath: window.location.pathname
            }
          });
          resetForm();
          setConfirmationPopup(null);
        },
        onCancel: () => {
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
      setIsSubmitting(false);
    }
  };

  return (
    <div className="content-wrapper">
      {loading && <LoadingScreen />}
      
      {/* Stock refresh spinner overlay */}
      {isRefreshingStock && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 10001,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div className="mt-2">Updating stock data for selected items...</div>
          </div>
        </div>
      )}

      <ConfirmationPopup
        show={confirmationPopup !== null}
        message={confirmationPopup?.message || ''}
        type={confirmationPopup?.type || 'info'}
        onConfirm={confirmationPopup?.onConfirm || (() => {})}
        onCancel={confirmationPopup?.onCancel}
        confirmText={confirmationPopup?.confirmText || 'OK'}
        cancelText={confirmationPopup?.cancelText}
      />

      {/* Department Change Confirmation Popup */}
      <ConfirmationPopup
        show={showDepartmentPopup}
        message="Changing department will refresh stock data for all selected items. Do you want to continue?"
        type="info"
        onConfirm={() => {
          setShowDepartmentPopup(false);
          if (pendingDepartment !== null) {
            performDepartmentChange(pendingDepartment);
            setPendingDepartment(null);
          }
        }}
        onCancel={() => {
          setShowDepartmentPopup(false);
          setPendingDepartment(null);
        }}
        confirmText="Yes"
        cancelText="No"
      />

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            {/* Header Section */}
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">INDENT CREATION</h4>
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
                    onChange={(e) => handleDepartmentChange(e.target.value)}
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
              <div className="table-responsive">
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
                        {department ? `${departments.find(d => d.id == department)?.departmentName || 'Requested Dept'} Available Stock` : "Requested Dept Available Stock"}
                      </th>
                      <th style={{ width: "150px", minWidth: "150px" }}>
                        {loggedInDepartment ? `${loggedInDepartment} Available Stock` : "Current Dept Available Stock"}
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
                        {/* ── Item Name cell ── */}
                        <td>
                          <div className="dropdown-search-container">
                            <input
                              ref={(el) => { inputRefs.current[index] = el; }}
                              type="text"
                              className={`form-control ${errors[`drug_${index}`] ? 'is-invalid' : ''}`}
                              value={entry.drugName}
                              autoComplete="off"
                              onChange={(e) => handleItemSearch(e.target.value, index)}
                              onClick={() => {
                                if (entry.drugName?.trim() && indentType && department) {
                                  setActiveRowIndex(index);
                                  loadFirstItemPage(entry.drugName);
                                } else if (!indentType) {
                                  showPopup(SELECT_INDENT_TYPE_WARN_MSG, "warning");
                                } else if (!department) {
                                  showPopup(SELECT_REQ_DEPARTMENT_TYPE_WARN_MSG, "warning");
                                }
                              }}
                              onFocus={() => setActiveRowIndex(index)}
                              placeholder={!indentType ? "Select Indent Type first" : !department ? "Select Department first" : "Type item name or code..."}
                              style={{ borderRadius: "4px", minWidth: "280px" }}
                              disabled={!indentType || !department}
                            />
                            {errors[`drug_${index}`] && (
                              <div className="invalid-feedback d-block">{errors[`drug_${index}`]}</div>
                            )}

                            <PortalDropdown
                              anchorRef={{ current: inputRefs.current[index] }}
                              show={showItemDropdown && activeRowIndex === index && !!indentType && !!department}
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
                                        className="p-2"
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
                                        onMouseEnter={(e) => {
                                          if (!isSelectedInOtherRow) e.currentTarget.style.backgroundColor = '#f8f9fa';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = isSelectedInOtherRow ? '#fff3cd' : 'transparent';
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

                                  {/* Infinite scroll sentinel */}
                                  {!itemLastPage && (
                                    <div
                                      className="text-center p-2 text-primary small"
                                      onMouseEnter={loadMoreItems}
                                    >
                                      {isItemLoading ? 'Loading...' : 'Scroll to load more...'}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="p-2 text-muted text-center">No items found</div>
                              )}
                            </PortalDropdown>
                          </div>
                        </td>

                        {/* A/U cell */}
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

                        {/* Required Quantity cell */}
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

                        {/* Requested Dept Stock cell */}
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Requested Dept Stock"
                            value={entry.requestedDeptStock}
                            onChange={(e) => handleEntryChange(entry.id, "requestedDeptStock", e.target.value)}
                            style={{ backgroundColor: "#f5f5f5" }}
                            readOnly
                          />
                        </td>

                        {/* Current Dept Stock cell */}
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Current Dept Stock"
                            value={entry.currentDeptStock}
                            onChange={(e) => handleEntryChange(entry.id, "currentDeptStock", e.target.value)}
                            style={{ backgroundColor: "#f5f5f5" }}
                            readOnly
                          />
                        </td>

                        {/* Reason cell */}
                        <td>
                          <textarea
                            className="form-control"
                            placeholder="Reason"
                            value={entry.reason}
                            onChange={(e) => handleEntryChange(entry.id, "reason", e.target.value)}
                            style={{ height: "40px", resize: "none" }}
                          />
                        </td>

                        {/* Add button cell */}
                        <td style={{ textAlign: "center" }}>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={handleAddRow}
                          >
                            <i className="fa fa-plus"></i>
                          </button>
                        </td>

                        {/* Delete button cell */}
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
                  disabled={loading || isSaving || isSubmitting}
                >
                  {isSaving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleSubmit}
                  disabled={loading || isSaving || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Submitting...
                    </>
                  ) : (
                    "Submit"
                  )}
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