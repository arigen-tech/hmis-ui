import { useState, useRef, useEffect } from "react"
import { useNavigate } from 'react-router-dom'
import Popup from "../../../Components/popup"
import ConfirmationPopup from "../../../Components/ConfirmationPopup"
import { Store_Internal_Indent, MAS_DRUG_MAS, ALL_REPORTS, INVENTORY, SECTION_ID_FOR_DRUGS } from "../../../config/apiConfig"
import { getRequest, postRequest } from "../../../service/apiService"
import LoadingScreen from "../../../Components/Loading"
import DatePicker from "../../../Components/DatePicker"
import Pagination, {DEFAULT_ITEMS_PER_PAGE} from "../../../Components/Pagination"
import {ERROR_FETCH_INDENTS,WARNING_DRUG_ALREADY_ADDED,ERROR_AT_LEAST_ONE_ITEM_REQUIRED,SUCCESS_INDENT_SAVED_PRINT,
SUCCESS_INDENT_SUBMITTED_PRINT,ERROR_SAVE_SUBMIT_INDENT,
}  from  "../../../config/constants";


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
  const dropdownItemRef = useRef(null);

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

  // Format date for API (YYYY-MM-DD)
  const formatDateForAPI = (dateStr) => {
    if (!dateStr) return null;
    return dateStr; // Assuming dateStr is already in YYYY-MM-DD format from DatePicker
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

  // Fetch item details by ID - UPDATED to map all fields correctly
  const fetchItemDetails = async (itemId) => {
    try {
      const hospitalId = sessionStorage.getItem("hospitalId");
      const url = `${INVENTORY}/item/${itemId}?hospitalId=${hospitalId}`;
      const response = await getRequest(url);
      
      if (response.status === 200 && response.response) {
        const itemData = response.response;
        return {
          itemId: itemData.itemId,
          pvmsNo: itemData.pvmsNo || "",
          nomenclature: itemData.nomenclature || "",
          unitAuName: itemData.unitAuName || itemData.dispUnitName || "",
          storestocks: itemData.storestocks || 0,
          wardstocks: itemData.wardstocks || 0,
          dispstocks: itemData.dispstocks || 0,
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
        storeAvailableStock: itemDetails.storestocks || 0, // Store available stock from API
        currentDeptAvailableStock: itemDetails.wardstocks || 0, // Current department available stock from API
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
      let url = `${INVENTORY}/indents/viewUpdate?deptId=${deptId}&page=${page}&size=${DEFAULT_ITEMS_PER_PAGE}`
      
      // Add date filters if in search mode
      if (isSearchMode) {
        if (fromDate) {
          url += `&fromDate=${formatDateForAPI(fromDate)}`
        }
        if (toDate) {
          url += `&toDate=${formatDateForAPI(toDate)}`
        }
        // Add status filter if selected
        if (statusFilter) {
          const apiStatus = getStatusForAPI(statusFilter)
          url += `&status=${apiStatus}`
        }
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
      } else {
        setLoading(false)
      }
    }
  }

  // Fetch all drugs for dropdown (keeping as fallback)
  // const fetchAllDrugs = async () => {
  //   try {
  //     setLoading(true)
  //     const response = await getRequest(`${MAS_DRUG_MAS}/getAll/1`)
  //     console.log("Drugs API Response:", response)

  //     if (response && response.response && Array.isArray(response.response)) {
  //       const drugs = response.response.map(drug => ({
  //         id: drug.itemId,
  //         code: drug.pvmsNo || "",
  //         name: drug.nomenclature || "",
  //         unit: drug.unitAuName || drug.dispUnitName || "",
  //         availableStock: drug.wardstocks || 0,
  //         storesStock: drug.storestocks || 0
  //       }))
  //       setItemOptions(drugs)
  //     } else if (response && Array.isArray(response)) {
  //       const drugs = response.map(drug => ({
  //         id: drug.itemId,
  //         code: drug.pvmsNo || "",
  //         name: drug.nomenclature || "",
  //         unit: drug.unitAuName || drug.dispUnitName || "",
  //         availableStock: drug.wardstocks || 0,
  //         storesStock: drug.storestocks || 0
  //       }))
  //       setItemOptions(drugs)
  //     }
  //   } catch (err) {
  //     console.error("Error fetching drugs:", err)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  // Filter drugs based on search input (keeping as fallback)
  const filterDrugsBySearch = (searchTerm) => {
    if (!searchTerm) return [];

    return itemOptions.filter(drug =>
      drug.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drug.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drug.id?.toString().includes(searchTerm)
    ).slice(0, 10);
  }

  // Handle drug input focus for dropdown positioning (keeping as fallback)
  const handleDrugInputFocus = (event, index) => {
    const input = event.target;
    const rect = input.getBoundingClientRect();

    setDropdownPosition({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY,
      width: rect.width
    });

    setActiveItemDropdown(index);
  }

  // Handle drug selection from dropdown (keeping as fallback)
  const handleDrugSelect = (index, drug) => {
    // Check if drug is already selected in another row
    const isDuplicate = selectedDrugs.some(id => id === drug.id && indentEntries[index]?.itemId !== drug.id);

    if (isDuplicate) {
      showPopup(WARNING_DRUG_ALREADY_ADDED, "warning");
      return;
    }

    const newEntries = [...indentEntries];

    // Update the selected row with drug information
    newEntries[index] = {
      ...newEntries[index],
      itemId: drug.id,
      itemCode: drug.code || "",
      itemName: drug.name || "",
      apu: drug.unit || "",
      storeAvailableStock: drug.storesStock || 0,
      currentDeptAvailableStock: drug.availableStock || 0
    };

    setIndentEntries(newEntries);

    // Update selected drugs tracking
    const newSelectedDrugs = selectedDrugs.filter(id => id !== newEntries[index].itemId);
    newSelectedDrugs.push(drug.id);
    setSelectedDrugs(newSelectedDrugs);

    setActiveItemDropdown(null);
  };

  // Handle search by date range and status
  const handleSearch = () => {
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
        showPopup("From Date cannot be greater than To Date", "error")
        return
      }
    }

    setIsSearchMode(true)
    setCurrentPage(0)
    fetchIndents(0, true) // Pass true to show search loading
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
  const fetchIndentDetails = async (indentMId) => {
    try {
      setLoading(true)
      const response = await getRequest(`${INVENTORY}/indents/viewUpdate/details/${indentMId}?currentDeptId=${userSessionData?.departmentId}`)
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
    const items = await fetchIndentDetails(record.indentMId)

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
  }

  // Handle show all - resets filters and fetches initial data
  const handleShowAll = () => {
    // Reset all filter states
    setFromDate("")
    setToDate("")
    setStatusFilter("")
    
    // Reset to normal mode (not search mode)
    setIsSearchMode(false)
    
    // Reset to first page
    setCurrentPage(0)
    
    // Fetch data without any filters (this will get the same data as initial load)
    fetchIndents(0, false)
  }

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
      setProcessing(true)

      const endpoint = backendStatus === "S" ? "save" : "submit"
      const response = await postRequest(`${INVENTORY}/indent/${endpoint}`, payload)
      
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
                reportUrl: `${ALL_REPORTS}/indentReport?indentMId=${indentMId}`,
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
                reportUrl: `${ALL_REPORTS}/indentReport?indentMId=${indentMId}`,
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
      setProcessing(false)
    }
  }

  // Handle Report button click - Navigate to report page
  const handleReportClick = () => {
    const indentMId = selectedRecord?.indentMId;
    if (indentMId) {
      navigate('/ViewDownloadReport', {
        state: {
          reportUrl: `${ALL_REPORTS}/indentReport?indentMId=${indentMId}`,
          title: 'Indent Report',
          fileName: 'Indent Report',
          returnPath: window.location.pathname
        }
      });
    } else {
      showPopup("Indent ID not found", "error");
    }
  };

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
                         Store<br/> Avl <br /> Stk
                        </th>

                        <th
                          style={{
                            width: "20px",
                            whiteSpace: "normal",
                            lineHeight: "1.1",
                            textAlign: "center"
                          }}
                        >
                         {departmentName}<br/> Avl Stk
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

                            <td style={{ position: "relative" }} ref={dropdownItemRef}>
                              <div className="dropdown-search-container position-relative">
                                <input
                                  ref={(el) => (itemInputRefs.current[index] = el)}
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

                                {/* Search Dropdown - Only show for active row */}
                                {showItemDropdown && activeRowIndex === index && isRecordEditable && (
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
                                          const isSelectedInOtherRow = selectedDrugs.some(
                                            id => id === item.itemId && indentEntries[index]?.itemId !== item.itemId
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
                    {/* Report Button added before Save */}
                    <button
                      type="button"
                      className="btn btn-info"
                      onClick={handleReportClick}
                      disabled={processing}
                    >
                      Report
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleSubmit("s")}
                      disabled={processing}
                    >
                      {processing ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-warning"
                      onClick={() => handleSubmit("y")}
                      disabled={processing}
                    >
                      {processing ? "Submitting..." : "Submit"}
                    </button>
                    <button type="button" className="btn btn-danger" onClick={handleBackToList}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                      Print
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
                    disabled={searchLoading || loading || !isSearchEnabled()}
                  >
                    {searchLoading ? "Searching..." : "Search"}
                  </button>
                </div>
                <div className="col-md-4 d-flex justify-content-end align-items-end">
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleShowAll}
                    disabled={loading || searchLoading}
                  >
                    Show All
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                    <tr>
                      <th>Indent Date</th>
                      <th>Indent No</th>
                      <th>Created By</th>
                      <th>Status</th>
                      <th>Drug/Non Drug</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indentData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center">
                          {loading || searchLoading ? <LoadingScreen/> : "No records found."}
                        </td>
                      </tr>
                    ) : (
                      indentData.map((item) => {
                        const statusInfo = getStatusInfo(item.statusName);
                        return (
                          <tr key={item.indentMId} onClick={(e) => handleEditClick(item, e)} style={{ cursor: "pointer" }}>
                            <td>{formatDate(item.indentDate)}</td>
                            <td>{item.indentNo}</td>
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