import { useState, useRef, useEffect } from "react"
import { useNavigate } from 'react-router-dom'
import Popup from "../../../Components/popup"
import ConfirmationPopup from "../../../Components/ConfirmationPopup"
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer"
import {GET_ALL_ITEMS_BY_NAME,REQUEST_PARAM_HOSPITAL_ID, GET_INDENT_DETAILS_FOR_VIEW_UPDATE, GET_INDENT_HEADERS_FOR_VIEW_UPDATE, GET_ITEM_DETAILS_BY_ID, INDENT_REPORT_URL, INVENTORY, REQUERST_PARAM_INDENT_M_ID, REQUEST_PARAM_CURRENT_DEPT_ID, REQUEST_PARAM_DEPARTMENT_ID, REQUEST_PARAM_FROM_DATE, REQUEST_PARAM_KEYWORD, REQUEST_PARAM_PAGE, REQUEST_PARAM_REQUESTED_DEPT_ID, REQUEST_PARAM_SECTION_ID, REQUEST_PARAM_SIZE, REQUEST_PARAM_STATUS, REQUEST_PARAM_TO_DATE, SAVE_INDENT, SECTION_ID_FOR_DRUGS, STATUS_D, SUBMIT_INDENT } from "../../../config/apiConfig"
import { getRequest, postRequest, fetchPdfReportForViewAndPrint } from "../../../service/apiService"
import LoadingScreen from "../../../Components/Loading"
import { createPortal } from "react-dom"
import DatePicker from "../../../Components/DatePicker"
import Pagination, {DEFAULT_ITEMS_PER_PAGE} from "../../../Components/Pagination"
import {ERROR_FETCH_INDENTS,WARNING_DRUG_ALREADY_ADDED,ERROR_AT_LEAST_ONE_ITEM_REQUIRED,SUCCESS_INDENT_SAVED_PRINT,
SUCCESS_INDENT_SUBMITTED_PRINT,ERROR_SAVE_SUBMIT_INDENT,
INVALID_DATE_PICK_WARN_MSG,
INDENT_ID_NOT_FOUND,
}  from  "../../../config/constants";

// PortalDropdown Component - Fixed positioning like in IndentCreation
const PortalDropdown = ({ anchorRef, show, children }) => {
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (!show || !anchorRef?.current) return;

    const updatePosition = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      setStyle({
        position: "fixed",
        top: rect.bottom + 4,           // 4 px gap below the input
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

    // Re-position on scroll or resize
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

const IndentViewUpdate = () => {
  const [currentView, setCurrentView] = useState("list")
  const [processing, setProcessing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [itemOptions, setItemOptions] = useState([])
  const [dtRecord, setDtRecord] = useState([])
  const [indentEntries, setIndentEntries] = useState([])
  const [popupMessage, setPopupMessage] = useState(null)
  const [confirmationPopup, setConfirmationPopup] = useState(null)
  const [activeItemDropdown, setActiveItemDropdown] = useState(null)
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0, width: 0 })
  const itemInputRefs = useRef({})
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [currentPage, setCurrentPage] = useState(0) // Changed to 0-based for server
  const [indentData, setIndentData] = useState([])
  const [statusFilter, setStatusFilter] = useState("")
  const [selectedDrugs, setSelectedDrugs] = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [userSessionData, setUserSessionData] = useState(null)
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false)
  
  // New state for button spinners
  const [isSearching, setIsSearching] = useState(false);
  const [isShowingAll, setIsShowingAll] = useState(false);
  
  // New state for Save/Submit spinners
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New state for Report PDF
  const [reportPdfUrl, setReportPdfUrl] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // New state for item search similar to IndentCreation
  const [itemSearch, setItemSearch] = useState("");
  const [itemPage, setItemPage] = useState(0);
  const [itemLastPage, setItemLastPage] = useState(true);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [isItemLoading, setIsItemLoading] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState(null);
  const [itemDropdown, setItemDropdown] = useState([]);
  
  // Refs for debounce and dropdown
  const debounceItemRef = useRef(null);

  // Add navigate hook
  const navigate = useNavigate();
   const departmentName = sessionStorage.getItem('departmentName')

  // Get user data from session storage
  const getUserDataFromSession = () => {
    try {
      const departmentId = sessionStorage.getItem('departmentId')
     

      if (departmentId && departmentName) {
        return {
          departmentId: parseInt(departmentId),
          departmentName: departmentName
        }
      }

      const userDataStr = sessionStorage.getItem('userData')
      if (userDataStr) {
        const userData = JSON.parse(userDataStr)
        return {
          departmentId: userData.departmentId || null,
          departmentName: userData.departmentName || ''
        }
      }

      return null
    } catch (error) {
      console.error("Error getting user data from session:", error)
      return null
    }
  }

  // ── close dropdown when clicking outside any tracked input ──────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if click is inside any of the row inputs
      const clickedInsideInput = Object.values(itemInputRefs.current).some(
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

  // Dynamic status mapping
  const getStatusInfo = (status) => {
    const statusMap = {
      's': { label: "Draft", badge: "bg-info", textColor: "text-white", editable: true },
      'S': { label: "Draft", badge: "bg-info", textColor: "text-white", editable: true },
      'y': { label: "Pending for Approval", badge: "bg-warning", textColor: "text-dark", editable: false },
      'Y': { label: "Pending for Approval", badge: "bg-warning", textColor: "text-dark", editable: false },
    };

    // Handle the actual status names from API
    if (status === "Saved(Draft)") {
      return { label: "Draft", badge: "bg-info", textColor: "text-white", editable: true };
    }

    return statusMap[status] || { label: status, badge: "bg-secondary", textColor: "text-white", editable: false };
  }

  // Check if record is editable based on status
  const isEditable = (record) => {
    return getStatusInfo(record?.statusName).editable;
  }

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

  // Convert status for API (S for Draft, Y for Pending)
  const getStatusForAPI = (status) => {
    if (!status) return null;
    // Convert to uppercase as per backend requirements
    return status.toUpperCase();
  };

  // Check if search button should be enabled
  const isSearchEnabled = () => {
    const hasFromDate = fromDate !== "";
    const hasToDate = toDate !== "";
    const hasStatus = statusFilter !== "";
    
    // At least one filter should be selected
    return hasFromDate || hasToDate || hasStatus;
  };

  // Confirmation Popup Helper Function
  const showConfirmationPopup = (message, type, onConfirm, onCancel = null, confirmText = "Yes", cancelText = "No") => {
    setConfirmationPopup({
      message,
      type,
      onConfirm: () => {
        onConfirm();
        setConfirmationPopup(null);
      },
      onCancel: onCancel ? () => {
        onCancel();
        setConfirmationPopup(null);
      } : () => setConfirmationPopup(null),
      confirmText,
      cancelText
    });
  };

  // Fetch items from API with debounce - Modified to use sectionId based on indent type
  const fetchItems = async (page, searchText = "") => {
    try {
      setIsItemLoading(true);
      
      // Determine section ID based on indent type from selectedRecord
      const params = new URLSearchParams();

      if (selectedRecord?.indentType === "Drug") {
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

  // Fetch item details by ID - UPDATED to map all fields correctly
  const fetchItemDetails = async (itemId) => {
    try {
      const hospitalId = sessionStorage.getItem("hospitalId");
      const requestedDeptId = selectedRecord?.toDepartmentId || "";
      const currentDeptId = userSessionData?.departmentId || "";
      const url = `${GET_ITEM_DETAILS_BY_ID}/${itemId}?${REQUEST_PARAM_HOSPITAL_ID}=${hospitalId}&${REQUEST_PARAM_REQUESTED_DEPT_ID}=${requestedDeptId}&${REQUEST_PARAM_CURRENT_DEPT_ID}=${currentDeptId}`;
      const response = await getRequest(url);
      
      if (response.status === 200 && response.response) {
        const itemData = response.response;
        return {
          itemId: itemData.itemId,
          pvmsNo: itemData.pvmsNo || "",
          nomenclature: itemData.nomenclature || "",
          unitAuName: itemData.unitAuName || itemData.dispUnitName || "",
          requestedDeptStocks: itemData.requestedDeptStocks || 0,
          currentDeptStocks: itemData.currentDeptStocks || 0,
          reOrderLevelStore: itemData.reOrderLevelStore,
          reOrderLevelDispensary: itemData.reOrderLevelDispensary,
          adispQty: itemData.adispQty,
          sectionName: itemData.sectionName,
          itemTypeName: itemData.itemTypeName,
          groupName: itemData.groupName,
          itemClassName: itemData.itemClassName
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching item details:", error);
      showPopup("Error fetching item details", "error");
      return null;
    } 
  };

  // Handle item search with debounce - Now per row
  const handleItemSearch = (value, index) => {
    setItemSearch(value);
    setActiveRowIndex(index);
    
    // Update the itemName in the entry
    const newEntries = [...indentEntries];
    newEntries[index] = {
      ...newEntries[index],
      itemName: value
    };
    setIndentEntries(newEntries);
    
    // Clear selections when user types
    if (!value.trim() || (newEntries[index].itemId && !value.includes(newEntries[index].itemName))) {
      newEntries[index] = {
        ...newEntries[index],
        itemId: null,
        itemCode: "",
        apu: "",
        storeAvailableStock: "",
        currentDeptAvailableStock: "",
        drugData: null
      };
      setIndentEntries(newEntries);
      
      // Update selected drugs tracking
      if (newEntries[index].itemId) {
        setSelectedDrugs(selectedDrugs.filter(id => id !== newEntries[index].itemId));
      }
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
  const loadFirstItemPage = (searchText, index) => {
    if (!searchText.trim()) return;
    setItemSearch(searchText);
    setActiveRowIndex(index);
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

  // Handle item selection from dropdown - UPDATED to map all fields correctly
  const handleItemSelect = async (index, item) => {
    // Check if drug is already selected in another row
    const isDuplicate = selectedDrugs.some(id => id === item.itemId && indentEntries[index]?.itemId !== item.itemId);

    if (isDuplicate) {
      showPopup(WARNING_DRUG_ALREADY_ADDED, "warning");
      return;
    }

    // Fetch complete item details
    const itemDetails = await fetchItemDetails(item.itemId);
    
    if (itemDetails) {
      const newEntries = [...indentEntries];
      
      // Update the selected row with complete item information from API response
      newEntries[index] = {
        ...newEntries[index],
        itemId: itemDetails.itemId,
        itemCode: itemDetails.pvmsNo || "",
        itemName: itemDetails.nomenclature || "",
        apu: itemDetails.unitAuName || "",
        storeAvailableStock: itemDetails.requestedDeptStocks || 0,
        currentDeptAvailableStock: itemDetails.currentDeptStocks || 0,
        drugData: {
          reOrderLevelStore: itemDetails.reOrderLevelStore,
          reOrderLevelDispensary: itemDetails.reOrderLevelDispensary,
          adispQty: itemDetails.adispQty,
          requestedDeptStocks: itemDetails.requestedDeptStocks,
          currentDeptStocks: itemDetails.currentDeptStocks,
          sectionName: itemDetails.sectionName,
          itemTypeName: itemDetails.itemTypeName,
          groupName: itemDetails.groupName,
          itemClassName: itemDetails.itemClassName
        }
      };

      setIndentEntries(newEntries);
      
      // Update selected drugs tracking
      const newSelectedDrugs = selectedDrugs.filter(id => id !== newEntries[index].itemId);
      newSelectedDrugs.push(itemDetails.itemId);
      setSelectedDrugs(newSelectedDrugs);
      
      setItemSearch(""); // Clear the search after selection
      setShowItemDropdown(false); // Hide dropdown
      setActiveRowIndex(null);
    }
  };

  useEffect(() => {
    // Get user data from session
    const userData = getUserDataFromSession()
    setUserSessionData(userData)
    
    // Fetch drugs for dropdown (keeping this as fallback)
    // fetchAllDrugs()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Initial data fetch when userSessionData is available
  useEffect(() => {
    if (userSessionData?.departmentId && !isInitialLoadDone) {
      fetchIndents(0, false)
      setIsInitialLoadDone(true)
    }
  }, [userSessionData])

  // Fetch indents when page changes (only in non-search mode)
  useEffect(() => {
    if (userSessionData?.departmentId && !isSearchMode && isInitialLoadDone) {
      fetchIndents(currentPage, false)
    }
  }, [currentPage, userSessionData, isSearchMode, isInitialLoadDone])

  // Fetch all indents with server-side pagination
  const fetchIndents = async (page = 0, showSearchLoading = false) => {
    try {
      if (showSearchLoading) {
        setSearchLoading(true)
      } else {
        setLoading(true)
      }
      
      // Get department ID from session
      const deptId = userSessionData?.departmentId
      
      if (!deptId) {
        console.error("No department ID found")
        setIndentData([])
        setTotalPages(0)
        setTotalElements(0)
        return
      }

      // Build URL with query parameters
      let url = `${GET_INDENT_HEADERS_FOR_VIEW_UPDATE}?${REQUEST_PARAM_DEPARTMENT_ID}=${deptId}&${REQUEST_PARAM_PAGE}=${page}&${REQUEST_PARAM_SIZE}=${DEFAULT_ITEMS_PER_PAGE}`
      
      // Add date filters if they exist
      if (fromDate) {
        url += `&${REQUEST_PARAM_FROM_DATE}=${fromDate}`
      }
      if (toDate) {
        url += `&${REQUEST_PARAM_TO_DATE}=${toDate}`
      }
      // Add status filter if selected
      if (statusFilter) {
        const apiStatus = getStatusForAPI(statusFilter)
        url += `&${REQUEST_PARAM_STATUS}=${apiStatus}`
      }

      console.log("Fetching indents from URL:", url)

      const response = await getRequest(url)
      console.log("Indents API Full Response:", response)

      if (response && response.response) {
        const content = response.response.content || []
        setIndentData(content)
        setTotalPages(response.response.totalPages || 0)
        setTotalElements(response.response.totalElements || 0)
      } else {
        setIndentData([])
        setTotalPages(0)
        setTotalElements(0)
      }

    } catch (err) {
      console.error("Error fetching indents:", err)
      showPopup(ERROR_FETCH_INDENTS, "error")
      setIndentData([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      if (showSearchLoading) {
        setSearchLoading(false)
        setIsSearching(false)
      } else {
        setLoading(false)
        setIsShowingAll(false)
      }
    }
  }

  // Handle search by date range and status
  const handleSearch = async () => {
    // Validate at least one search criteria is provided
    if (!isSearchEnabled()) {
      showPopup("Please select at least one search criteria (Date or Status)", "error");
      return;
    }

    // Validate date range if both dates are provided
    if (fromDate && toDate) {
      const from = new Date(fromDate)
      const to = new Date(toDate)
      
      if (from > to) {
        showPopup(INVALID_DATE_PICK_WARN_MSG, "error")
        return
      }
    }

    setIsSearching(true);
    setCurrentPage(0);
    await fetchIndents(0, true);
  }

  // Handle status filter change - ONLY updates state, NO API call
  const handleStatusFilterChange = (e) => {
    const status = e.target.value
    setStatusFilter(status)
    // NO API call here - wait for Search button
  }

  // Handle indent entry change
  const handleIndentEntryChange = (index, field, value) => {
    const updatedEntries = [...indentEntries]

    if (field === "itemName") {
      const displayValue = value;
      const drugName = extractDrugName(displayValue);

      const selectedItem = itemOptions.find((opt) =>
        opt.name.toLowerCase().includes(drugName.toLowerCase()) ||
        opt.code.toLowerCase().includes(drugName.toLowerCase())
      );

      updatedEntries[index] = {
        ...updatedEntries[index],
        itemId: selectedItem ? selectedItem.id : "",
        itemName: selectedItem ? selectedItem.name : drugName,
        itemCode: selectedItem ? selectedItem.code : "",
        apu: selectedItem ? selectedItem.unit : "",
        storeAvailableStock: selectedItem ? selectedItem.storesStock : "",
        currentDeptAvailableStock: selectedItem ? selectedItem.availableStock : ""
      }
    } else {
      updatedEntries[index] = {
        ...updatedEntries[index],
        [field]: value,
      }
    }

    setIndentEntries(updatedEntries)
  }

  // Fetch indent details by indentMId - UPDATED to include new stock fields
  const fetchIndentDetails = async (indentMId, requestedDeptId) => {
    try {
      setLoading(true)
      const response = await getRequest(`${GET_INDENT_DETAILS_FOR_VIEW_UPDATE}/${indentMId}?${REQUEST_PARAM_CURRENT_DEPT_ID}=${userSessionData?.departmentId}&${REQUEST_PARAM_REQUESTED_DEPT_ID}=${requestedDeptId}`)
      if (response && response.response && Array.isArray(response.response)) {
        return response.response.map(item => ({
          indentTId: item.indentTId,
          itemId: item.itemId,
          itemName: item.itemName,
          pvmsNo: item.pvmsNo || "",
          unitAuName: item.itemUnitName,
          requestedQty: item.qtyRequested,
          approvedQty: item.qtyApproved,
          receivedQty: item.qtyReceived || 0,
          reason: item.reasonForIndent,
          storeAvailableStock: item.storeAvailableStock || 0, // New field from API
          currentDeptAvailableStock: item.currentDeptAvailableStock || 0 // New field from API
        }))
      }
      return []
    } catch (error) {
      console.error("Error fetching indent details:", error)
      return []
    } finally {
      setLoading(false)
    }
  }

  // Handle edit click - UPDATED to use new stock fields from API
  const handleEditClick = async (record, e) => {
    e.stopPropagation()

    console.log("Editing record:", record)
    setSelectedRecord(record)

    // Fetch indent details using indentMId
    const items = await fetchIndentDetails(record.indentMId,record.toDepartmentId)

    // Initialize entries from the fetched items
    let entries = []

    if (items && items.length > 0) {
      console.log("Items found:", items)
      entries = items.map((item) => ({
        id: item.indentTId || null,
        itemId: item.itemId || "",
        itemCode: item.pvmsNo || "",
        itemName: item.itemName || "",
        apu: item.unitAuName || "",
        requestedQty: item.requestedQty || "",
        storeAvailableStock: item.storeAvailableStock || "", // New field from API
        currentDeptAvailableStock: item.currentDeptAvailableStock || "", // New field from API
        reasonForIndent: item.reason || "",
      }))

      // Update selected drugs tracking
      const drugIds = entries.filter(entry => entry.itemId).map(entry => entry.itemId)
      setSelectedDrugs(drugIds)
    } else {
      console.log("No items found, creating empty entry")
      // Create empty entry for new items WITHOUT any ID
      entries = [{
        id: null,
        itemId: "",
        itemCode: "",
        itemName: "",
        apu: "",
        requestedQty: "",
        storeAvailableStock: "",
        currentDeptAvailableStock: "",
        reasonForIndent: "",
      }]
      setSelectedDrugs([])
    }

    console.log("Setting indent entries:", entries)
    setIndentEntries(entries)
    setDtRecord([])
    setCurrentView("detail")
  }

  // Handle back to list
  const handleBackToList = () => {
    setCurrentView("list")
    setSelectedRecord(null)
    setIndentEntries([])
    setSelectedDrugs([])
    setDtRecord([])
    setItemSearch("")
    setItemDropdown([])
    setShowItemDropdown(false)
    setActiveRowIndex(null)
    setReportPdfUrl(null) // Close PDF viewer if open
  }

 
const handleShowAll = async () => {
  setIsShowingAll(true);
  
  // Clear date filters in state
  setFromDate("");
  setToDate("");
  setStatusFilter("");
  setCurrentPage(0);
  
  // Fetch initial unfiltered data from page 0
  try {
    // Get department ID from session
    const deptId = userSessionData?.departmentId;
    
    if (!deptId) {
      console.error("No department ID found");
      setIndentData([]);
      setTotalPages(0);
      setTotalElements(0);
      return;
    }

    // Build URL without any date filters
    let url = `${GET_INDENT_HEADERS_FOR_VIEW_UPDATE}?${REQUEST_PARAM_DEPARTMENT_ID}=${deptId}&${REQUEST_PARAM_PAGE}=0&${REQUEST_PARAM_SIZE}=${DEFAULT_ITEMS_PER_PAGE}`;
    
    console.log("Fetching all indents from URL:", url);

    const response = await getRequest(url);

    if (response && response.response) {
      setIndentData(response.response.content || []);
      setTotalPages(response.response.totalPages || 0);
      setTotalElements(response.response.totalElements || 0);
    } else {
      setIndentData([]);
      setTotalPages(0);
      setTotalElements(0);
    }
  } catch (err) {
    console.error("Error fetching indents:", err);
    showPopup(ERROR_FETCH_INDENTS, "error");
    setIndentData([]);
    setTotalPages(0);
    setTotalElements(0);
  } finally {
    setIsShowingAll(false);
  }
};

  // Handle page change
  const handlePageChange = (page) => {
    const newPage = page - 1 // Convert to 0-based for server
    setCurrentPage(newPage)
    // fetchIndents will be called by useEffect
  }

  // Add new row - UPDATED to include new stock fields with empty values
  const addNewRow = () => {
    const newEntry = {
      id: null,
      itemId: "",
      itemCode: "",
      itemName: "",
      apu: "",
      requestedQty: "",
      storeAvailableStock: "",
      currentDeptAvailableStock: "",
      reasonForIndent: "",
    }
    setIndentEntries([...indentEntries, newEntry])
  }

  // Remove row
  const removeRow = (index) => {
    if (indentEntries.length > 1) {
      const entryToRemove = indentEntries[index]

      // Remove from selected drugs if it has an itemId
      if (entryToRemove.itemId) {
        setSelectedDrugs(selectedDrugs.filter(drugId => drugId !== entryToRemove.itemId))
      }

      // Only add to deletion list if it's an existing record with numeric ID
      if (entryToRemove.id && typeof entryToRemove.id === 'number') {
        setDtRecord((prev) => [...prev, entryToRemove.id])
      }

      const filteredEntries = indentEntries.filter((_, i) => i !== index)
      setIndentEntries(filteredEntries)
    }
  }

  // Show popup
  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
      },
    })
  }

  // Handle Report button click - Generate PDF and show in viewer
  const handleReportClick = async () => {
    const indentMId = selectedRecord?.indentMId;
    if (indentMId) {
      try {
        setIsGeneratingReport(true);
        const reportUrl = `${INDENT_REPORT_URL}?${REQUERST_PARAM_INDENT_M_ID}=${indentMId}`;
        const blob = await fetchPdfReportForViewAndPrint(reportUrl, STATUS_D);
        const fileURL = window.URL.createObjectURL(blob);
        setReportPdfUrl(fileURL);
      } catch (error) {
        console.error("Error generating report:", error);
        showPopup("Unable to generate report", "error");
      } finally {
        setIsGeneratingReport(false);
      }
    } else {
      showPopup(INDENT_ID_NOT_FOUND, "error");
    }
  };

  // Handle save/submit - UPDATED to include storeAvailableStock in payload
  const handleSubmit = async (status) => {
    console.log("Submitting with status:", status);
    console.log("Current indent entries:", indentEntries);
    // Check if we have at least one valid item
    const validItems = indentEntries.filter(entry =>
     entry.itemName && entry.requestedQty && entry.requestedQty > 0
    )

    if (validItems.length === 0) {
      showPopup(ERROR_AT_LEAST_ONE_ITEM_REQUIRED, "error")
      return
    }

    // Convert status to uppercase for backend
    const backendStatus = status.toUpperCase()
    
    // Set appropriate spinner
    if (backendStatus === "S") {
      setIsSaving(true);
    } else if (backendStatus === "Y") {
      setIsSubmitting(true);
    }
    setProcessing(true);

    const payload = {
      indentMId: selectedRecord?.indentMId || null,
      indentDate: selectedRecord?.indentDate || new Date().toISOString().slice(0, 19),
      toDeptId: selectedRecord?.toDepartmentId || null,
      status: backendStatus,
      deletedT: dtRecord.length > 0 ? dtRecord : [],
      items: validItems.map((entry) => {
        const itemPayload = {
          itemId: Number(entry.itemId),
          requestedQty: entry.requestedQty ? Number(entry.requestedQty) : 0,
          reason: entry.reasonForIndent || "",
          storeAvailableStock: entry.storeAvailableStock ? Number(entry.storeAvailableStock) : 0, // Include in payload
        }

        // ONLY send indentTId if it exists and is a number (existing backend record)
        if (entry.id && typeof entry.id === 'number') {
          itemPayload.indentTId = entry.id
        }

        return itemPayload
      }),
    }

    console.log("Submitting payload:", JSON.stringify(payload, null, 2))

    try {
      const url = backendStatus === "S" ? SAVE_INDENT :SUBMIT_INDENT;
      const response = await postRequest(url, payload)
      
      const indentMId = response.response?.indentMId
      
      // Show confirmation popup instead of regular popup
      if (backendStatus === "S") {
        showConfirmationPopup(
          SUCCESS_INDENT_SAVED_PRINT,
          "success",
          () => {
            // Navigate to report page for save
            navigate('/ViewDownloadReport', {
              state: {
                reportUrl: `${INDENT_REPORT_URL}?${REQUERST_PARAM_INDENT_M_ID}=${indentMId}`,
                title: 'Indent Save Report',
                fileName: 'Indent Save Report',
                returnPath: window.location.pathname
              }
            });
            handleBackToList();
            fetchIndents(0, false);
          },
          () => {
            // Just reset and stay on same page
            handleBackToList();
            fetchIndents(0, false);
          },
          "Yes",
          "No"
        );
      } else if (backendStatus === "Y") {
        showConfirmationPopup(
          SUCCESS_INDENT_SUBMITTED_PRINT,
          "success",
          () => {
            // Navigate to report page for submit
            navigate('/ViewDownloadReport', {
              state: {
                reportUrl: `${INDENT_REPORT_URL}?${REQUERST_PARAM_INDENT_M_ID}=${indentMId}`,
                title: 'Indent Submit Report',
                fileName: 'Indent Submit Report',
                returnPath: window.location.pathname
              }
            });
            handleBackToList();
            fetchIndents(0, false);
          },
          () => {
            // Just reset and stay on same page
            handleBackToList();
            fetchIndents(0, false);
          },
          "Yes",
          "No"
        );
      }

    } catch (error) {
      console.error("Error submitting indent:", error)
      
      // Show error popup
      showConfirmationPopup(
        ERROR_SAVE_SUBMIT_INDENT(backendStatus),
        "error",
        () => {},
        null,
        "OK",
        "Close"
      );
      
    } finally {
      setProcessing(false);
      if (backendStatus === "S") {
        setIsSaving(false);
      } else if (backendStatus === "Y") {
        setIsSubmitting(false);
      }
    }
  }

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return ""
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString("en-GB")
    } catch (error) {
      return dateStr
    }
  }

  // Detail View
  if (currentView === "detail") {
    const statusInfo = getStatusInfo(selectedRecord?.statusName);
    const isRecordEditable = isEditable(selectedRecord);

    return (
      <div className="content-wrapper">
        {loading && <LoadingScreen />}
        
        {/* PDF Viewer Modal */}
        {reportPdfUrl && (
          <PdfViewer
            pdfUrl={reportPdfUrl}
            name="Indent Report"
            onClose={() => setReportPdfUrl(null)}
          />
        )}
        
        {/* Add ConfirmationPopup component */}
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
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">INDENT VIEW / UPDATE</h4>
                <button type="button" className="btn btn-secondary" onClick={handleBackToList}>
                  Back to List
                </button>
              </div>
              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Indent Date</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.indentDate ? formatDate(selectedRecord.indentDate) : ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Indent Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.indentNo || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Created By</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.createdBy || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Status</label>
                    <input
                      type="text"
                      className="form-control"
                      value={statusInfo.label}
                      style={{
                        backgroundColor: "#e9ecef",
                        fontWeight: "bold"
                      }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3 mt-3">
                    <label className="form-label fw-bold">Indent Type</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.indentType || ""}
                      style={{
                        backgroundColor: "#e9ecef",
                      }}
                      readOnly
                    />
                  </div>
                </div>

                <div className="table-responsive" style={{ overflowX: "auto", maxWidth: "100%", overflowY: "visible" }}>
                  <table className="table table-bordered table-hover align-middle" >
                    <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                      <tr>
                        <th
                          className="text-center"
                          style={{ width: "20px" }}
                        >
                          S.No.
                        </th>

                        <th style={{ width: "350px" }}>
                          Item Name/Code
                        </th>

                        <th style={{ width: "35px" }}>
                          A/U
                        </th>

                        <th
                          style={{
                            width: "60px",
                            whiteSpace: "normal",
                            lineHeight: "1.1",
                            textAlign: "center"
                          }}
                        >
                          Req <br /> Qty
                        </th>

                        <th
                          style={{
                            width: "20px",
                            whiteSpace: "normal",
                            lineHeight: "1.1",
                            textAlign: "center"
                          }}
                        >
                         {selectedRecord?.toDepartmentName }<br/> Avl Stk
                        </th>

                        <th
                          style={{
                            width: "20px",
                            whiteSpace: "normal",
                            lineHeight: "1.1",
                            textAlign: "center"
                          }}
                        >
                         {selectedRecord?.deptName }<br/> Avl Stk
                        </th>
                        <th style={{ width: "100px" }}>
                          Reason for Indent
                        </th>

                        {isRecordEditable && (
                          <>
                            <th style={{ width: "40px" }}>Add</th>
                            <th style={{ width: "40px" }}>Delete</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {indentEntries.length === 0 ? (
                        <tr>
                          <td colSpan={isRecordEditable ? 9 : 7} className="text-center text-muted">
                            No items found. {isRecordEditable && "Click 'Add' to add items."}
                           </td>
                         </tr>
                      ) : (
                        indentEntries.map((entry, index) => (
                          <tr key={entry.id || index}>
                            <td className="text-center fw-bold">{index + 1}</td>

                            <td>
                              <div className="dropdown-search-container">
                                <input
                                  ref={(el) => { itemInputRefs.current[index] = el; }}
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={entry.itemName || ""}
                                  onChange={(e) => {
                                    if (isRecordEditable) {
                                      handleItemSearch(e.target.value, index);
                                    }
                                  }}
                                  onClick={() => {
                                    if (isRecordEditable && entry.itemName?.trim()) {
                                      loadFirstItemPage(entry.itemName, index);
                                    }
                                  }}
                                  placeholder="Item Name/Code"
                                  style={{ minWidth: "320px" }}
                                  autoComplete="off"
                                  readOnly={!isRecordEditable}
                                />

                                {/* PortalDropdown for item search */}
                                <PortalDropdown
                                  anchorRef={{ current: itemInputRefs.current[index] }}
                                  show={showItemDropdown && activeRowIndex === index && isRecordEditable}
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
                                        const isSelectedInOtherRow = selectedDrugs.some(
                                          id => id === item.itemId && indentEntries[index]?.itemId !== item.itemId
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

                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={entry.apu}
                                onChange={(e) => handleIndentEntryChange(index, "apu", e.target.value)}
                                placeholder="Unit"
                                readOnly
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={entry.requestedQty}
                                onChange={(e) => handleIndentEntryChange(index, "requestedQty", e.target.value)}
                                placeholder="0"
                                min="0"
                                step="1"
                                readOnly={!isRecordEditable}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={entry.storeAvailableStock}
                                placeholder="0"
                                min="0"
                                step="1"
                                style={{ backgroundColor: "#f5f5f5" }}
                                readOnly
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={entry.currentDeptAvailableStock}
                                placeholder="0"
                                min="0"
                                step="1"
                                style={{ backgroundColor: "#f5f5f5" }}
                                readOnly
                              />
                            </td>
                            <td>
                              <textarea
                                className="form-control form-control-sm"
                                value={entry.reasonForIndent}
                                onChange={(e) => handleIndentEntryChange(index, "reasonForIndent", e.target.value)}
                                placeholder="Reason"
                                readOnly={!isRecordEditable}
                              />
                            </td>
                            {/* Show Add/Delete only for editable records */}
                            {isRecordEditable && (
                              <>
                                <td className="text-center">
                                  <button
                                    type="button"
                                    className="btn btn-success btn-sm"
                                    onClick={addNewRow}
                                    style={{
                                      color: "white",
                                      border: "none",
                                      height: "35px",
                                    }}
                                    title="Add Row"
                                  >
                                    +
                                  </button>
                                </td>
                                <td className="text-center">
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() => removeRow(index)}
                                    disabled={indentEntries.length === 1}
                                    title="Delete Row"
                                    style={{
                                      height: "35px",
                                    }}
                                  >
                                    −
                                  </button>
                                </td>
                              </>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Action buttons based on editability */}
                {isRecordEditable ? (
                  <div className="d-flex justify-content-end gap-2 mt-4">
                    {/* Report Button with spinner */}
                    <button
                      type="button"
                      className="btn btn-info"
                      onClick={handleReportClick}
                      disabled={processing || isGeneratingReport}
                    >
                      {isGeneratingReport ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Generating...
                        </>
                      ) : (
                        "Report"
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleSubmit("s")}
                      disabled={processing || isGeneratingReport}
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
                      className="btn btn-warning"
                      onClick={() => handleSubmit("y")}
                      disabled={processing || isGeneratingReport}
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
                    <button type="button" className="btn btn-danger" onClick={handleBackToList}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button
                      type="button"
                      className="btn btn-info"
                      onClick={handleReportClick}
                      disabled={processing || isGeneratingReport}
                    >
                      {isGeneratingReport ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Generating...
                        </>
                      ) : (
                        "Report"
                      )}
                    </button>
                    <button type="button" className="btn btn-danger" onClick={handleBackToList}>
                      Close
                    </button>
                  </div>
                )}
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

  // List View
  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Indent List</h4>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-2">
                  <DatePicker
                    label="From Date"
                    value={fromDate}
                    onChange={setFromDate}  
                    compact={true}
                  />
                </div>
                <div className="col-md-2">
                  <DatePicker
                    label="To Date"
                    value={toDate}
                    onChange={setToDate}
                    compact={true}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-bold">Status</label>
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={handleStatusFilterChange}
                  >
                    <option value="">All Status</option>
                    <option value="s">Draft</option>
                    <option value="y">Pending for Approval</option>
                  </select>
                </div>
                <div className="col-md-2 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-primary me-2"
                    onClick={handleSearch}
                    disabled={searchLoading || loading || !isSearchEnabled() || isSearching || isShowingAll}
                  >
                    {isSearching ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Searching...
                      </>
                    ) : (
                      "Search"
                    )}
                  </button>
                   <button 
                    type="button" 
                    className="btn btn-secondary flex-shrink-0" 
                    onClick={handleShowAll}
                    disabled={loading || searchLoading || isSearching || isShowingAll}
                  >
                    {isShowingAll ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Showing All...
                      </>
                    ) : (
                      "Show All"
                    )}
                  </button>
                </div>
                 
              </div>

              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                    <tr>
  <th>Indent Date</th>
  <th>Indent No</th>
  <th>From Dept</th>
  <th>To Dept</th>
  <th>Created By</th>
  <th>Status</th>
  <th>Drug/Non Drug</th>
</tr>
                  </thead>
                  <tbody>
                    {indentData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center">
                          {loading || searchLoading || isSearching || isShowingAll ? <LoadingScreen/> : "No records found."}
                        </td>
                      </tr>
                    ) : (
                      indentData.map((item) => {
                        const statusInfo = getStatusInfo(item.statusName);
                        return (
                          <tr key={item.indentMId} onClick={(e) => handleEditClick(item, e)} style={{ cursor: "pointer" }}>
  <td>{formatDate(item.indentDate)}</td>
  <td>{item.indentNo}</td>
  <td>{item.deptName}</td>
  <td>{item.toDepartmentName}</td>
  <td>{item.createdBy}</td>
                            <td>
                              <span
                                className={`badge ${statusInfo.badge} ${statusInfo.textColor}`}
                              >
                                {statusInfo.label}
                              </span>
                            </td>
                            <td>{item.indentType}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                totalItems={totalElements}
                itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                currentPage={currentPage + 1} // Convert to 1-based for component
                onPageChange={handlePageChange}
                totalPages={totalPages}
              />
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

export default IndentViewUpdate