import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from 'react-router-dom';
import Popup from "../../../Components/popup"
import ConfirmationPopup from "../../../Components/ConfirmationPopup";
import { SECTION_ID_FOR_DRUGS, REQUEST_PARAM_PAGE, REQUEST_PARAM_SIZE, REQUEST_PARAM_FROM_DATE, REQUEST_PARAM_TO_DATE, GET_OPENING_BALANCE_ENTRY_HEADERS, GET_OPENING_BALANCE_ENTRY_DETAILS, REQUEST_PARAM_SECTION_ID, REQUEST_PARAM_KEYWORD, GET_ALL_ITEMS_BY_NAME, GET_ITEM_DETAILS_BY_ID, REQUEST_PARAM_HOSPITAL_ID, GET_ALL_BRANDS_FOR_DROPDOWN, GET_ALL_MANUFACTURER_FOR_DROPDOWN, GET_DRUG_CODE_FOR_DROPDOWN, GET_CURRENT_USER_PROFILE_BY_NAME, GET_DEPARTMENT_BY_ID, UPDATE_OPENING_BALANCE_ENTRY_BY_ID, OPENING_BALANCE_REPORT_URL, REQUEST_PARAM_BALANCE_M_ID, STATUS_D } from "../../../config/apiConfig";
import { getRequest, putRequest } from "../../../service/apiService"
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import {
  WARNING_DUPLICATE_BATCH_ENTRY, CONFIRM_OPENING_BALANCE_ACTION, ERROR_UPDATE_ENTRIES_FAILED,
  CONFIRM_OPENING_BALANCE_SUBMIT_UPDATE_PRINT, WARNING_DOM_DOE_VALIDATION,
  OPENING_BALANCE_ENTRY_SUBMIT_REPORT_TITLE,
  OPENING_BALANCE_ENTRY_UPDATE_REPORT_TITLE,
  OPENING_BALANCE_ENTRY_UPDATE_REPORT_FILE_NAME,
  OPENING_BALANCE_ENTRY_SUBMIT_REPORT_FILE_NAME,
  OPENING_BALANCE_NOT_FOUND,
} from "../../../config/constants";

import PdfViewer from "../../../Components/PdfViewModel/PdfViewer"
import { fetchPdfReportForViewAndPrint } from "../../../service/apiService"

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

const OpeningBalanceApproval = () => {
  const [currentView, setCurrentView] = useState("list")
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [approvalData, setApprovalData] = useState([])
  const [brandOptions, setBrandOptions] = useState([])
  const [dtRecord, setDtRecord] = useState([])
  const [manufacturerOptions, setManufacturerOptions] = useState([])
  const [drugCodeOptions, setDrugCodeOptions] = useState([])
  const crUser = localStorage.getItem("username") || sessionStorage.getItem("username");
  const deptId = localStorage.getItem("departmentId") || sessionStorage.getItem("departmentId");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [confirmationPopup, setConfirmationPopup] = useState(null);
  const hospitalId = sessionStorage.getItem("hospitalId") || localStorage.getItem("hospitalId");
  const departmentId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId");

  // States for button spinners
  const [isSearching, setIsSearching] = useState(false);
  const [isShowingAll, setIsShowingAll] = useState(false);

  // Server-side pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // Drug search state with debounce - Per row
  const [itemDropdown, setItemDropdown] = useState([]);
  const [itemSearch, setItemSearch] = useState("");
  const [itemPage, setItemPage] = useState(0);
  const [itemLastPage, setItemLastPage] = useState(true);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [isItemLoading, setIsItemLoading] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState(null);

  // For drug code dropdown
  const dropdownClickedRef = useRef(false);
  const [activeDrugCodeDropdown, setActiveDrugCodeDropdown] = useState(null);
  const drugCodeInputRefs = useRef({});

  // Refs for debounce and dropdown
  const debounceItemRef = useRef(null);
  const itemInputRefs = useRef({});

  const navigate = useNavigate();

  const getCurrentDateTime = () => new Date().toISOString();

  const [formData, setFormData] = useState({
    balanceEntryDate: getCurrentDateTime(),
    enteredBy: "",
    department: "",
  });

  const [reportPdfUrl, setReportPdfUrl] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // ── close dropdown when clicking outside any tracked input ──────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if click is inside any of the row inputs
      const clickedInsideItemInput = Object.values(itemInputRefs.current).some(
        (ref) => ref && ref.contains(e.target)
      );
      const clickedInsideDrugCodeInput = Object.values(drugCodeInputRefs.current).some(
        (ref) => ref && ref.contains(e.target)
      );

      if (!clickedInsideItemInput && !clickedInsideDrugCodeInput) {
        setShowItemDropdown(false);
        setActiveRowIndex(null);
        setActiveDrugCodeDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Updated fetchOpenBalance with server-side pagination
  const fetchOpenBalance = async (page = 0, showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      // Build URL with query parameters
      let url = `${GET_OPENING_BALANCE_ENTRY_HEADERS}/${hospitalId}/${departmentId}?${REQUEST_PARAM_PAGE}=${page}&${REQUEST_PARAM_SIZE}=${DEFAULT_ITEMS_PER_PAGE}`;

      // Add date filters if they exist
      if (fromDate) {
        url += `&${REQUEST_PARAM_FROM_DATE}=${fromDate}`;
      }
      if (toDate) {
        url += `&${REQUEST_PARAM_TO_DATE}=${toDate}`;
      }

      const response = await getRequest(url);

      if (response && response.response) {
        setApprovalData(response.response.content || []);
        setTotalPages(response.response.totalPages || 0);
        setTotalElements(response.response.totalElements || 0);
        console.log("Transformed approval data:", response.response.content);
      } else {
        setApprovalData([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (err) {
      console.error("Error fetching opening balance headers:", err);
      setApprovalData([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Function to fetch details by balanceMId
  const fetchOpeningBalanceDetails = async (balanceMId) => {
    try {
      setLoadingDetails(true);
      const response = await getRequest(`${GET_OPENING_BALANCE_ENTRY_DETAILS}/${balanceMId}`);

      if (response && response.response && Array.isArray(response.response)) {
        // Transform the API response to match the detailEntries format
        const entriesWithId = response.response.map((entry, idx) => ({
          ...entry,
          id: entry.balanceTId || `row-${idx + 1}`,
          sNo: idx + 1,
          dom: entry.manufactureDate,
          doe: entry.expiryDate,
          totalCost: entry.totalPurchaseCost,
          itemCode: entry.itemCode,
          itemName: entry.itemName,
          unit: entry.itemUnit,
          brandId: entry.brandId,
          manufacturerId: entry.manufacturerId,
          drugData: entry, // Store complete item data
        }));

        setDetailEntries(entriesWithId);
      } else {
        setDetailEntries([]);
      }
    } catch (err) {
      console.error("Error fetching opening balance details:", err);
      showPopup("Failed to fetch opening balance details", "error");
      setDetailEntries([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Fetch items from API with debounce - Uses balanceType from selectedRecord
  const fetchItems = async (page, searchText = "") => {
    try {
      setIsItemLoading(true);

      const params = new URLSearchParams();

      // Use balanceType from selectedRecord to determine sectionId
      if (selectedRecord?.balanceType === "Drug") {
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

  // Fetch item details by ID
  const fetchItemDetails = async (itemId) => {
    try {
      const hospitalId = localStorage.getItem("hospitalId") || sessionStorage.getItem("hospitalId");
      const url = `${GET_ITEM_DETAILS_BY_ID}/${itemId}?${REQUEST_PARAM_HOSPITAL_ID}=${hospitalId}`;
      const response = await getRequest(url);

      if (response.status === 200 && response.response) {
        return response.response;
      }
      return null;
    } catch (error) {
      console.error("Error fetching item details:", error);
      return null;
    }
  };

  // Handle item search with debounce - Per row
  const handleItemSearch = (value, index) => {
    // Check if balance type is available
    if (!selectedRecord?.balanceType) {
      showPopup("Balance type not available", "warning");
      return;
    }

    setItemSearch(value);
    setActiveRowIndex(index);

    // Update the itemName in the entry
    const newEntries = [...detailEntries];
    newEntries[index] = {
      ...newEntries[index],
      itemName: value
    };
    setDetailEntries(newEntries);

    // Clear selections when user types
    if (!value.trim() || (newEntries[index].itemId && !value.includes(newEntries[index].itemName))) {
      newEntries[index] = {
        ...newEntries[index],
        itemId: null,
        itemCode: "",
        unit: "",
        gstPercent: "",
        drugData: null
      };
      setDetailEntries(newEntries);
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

  // Load first page of items for dropdown
  const loadFirstItemPage = (searchText) => {
    if (!searchText.trim() || !selectedRecord?.balanceType) return;
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
    // Check if item is already selected in another row
    const isDuplicate = detailEntries.some((entry, i) =>
      i !== index && entry.itemId === item.itemId
    );

    if (isDuplicate) {
      showPopup("This item is already added in another row", "warning");
      return;
    }

    // Fetch complete item details
    const itemDetails = await fetchItemDetails(item.itemId);

    if (itemDetails) {
      const newEntries = [...detailEntries];

      // Update the selected row with complete item information
      newEntries[index] = {
        ...newEntries[index],
        itemId: itemDetails.itemId,
        itemCode: itemDetails.pvmsNo || "",
        itemName: itemDetails.nomenclature || "",
        unit: itemDetails.unitAuName || itemDetails.dispUnitName || "",
        gstPercent: itemDetails.hsnGstPercent || 0,
        drugData: {
          itemId: itemDetails.itemId,
          nomenclature: itemDetails.nomenclature,
          pvmsNo: itemDetails.pvmsNo,
          unitAuName: itemDetails.unitAuName,
          dispUnitName: itemDetails.dispUnitName,
          gstPercent: itemDetails.gstPercent,
          sectionName: itemDetails.sectionName,
          itemTypeName: itemDetails.itemTypeName,
          groupName: itemDetails.groupName,
          itemClassName: itemDetails.itemClassName
        }
      };

      setDetailEntries(newEntries);
      setItemSearch(""); // Clear the search after selection
      setShowItemDropdown(false); // Hide dropdown
      setActiveRowIndex(null);
    }
  };

  const fetchBrand = async () => {
    try {
      setLoading(true);
      const response = await getRequest(`${GET_ALL_BRANDS_FOR_DROPDOWN}`);
      if (response && response.response) {
        setBrandOptions(response.response);
      }
    } catch (err) {
      console.error("Error fetching brand:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchManufacturer = async () => {
    try {
      setLoading(true);
      const response = await getRequest(`${GET_ALL_MANUFACTURER_FOR_DROPDOWN}`);
      if (response && response.response) {
        setManufacturerOptions(response.response);
      }
    } catch (err) {
      console.error("Error fetching manufacturer:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrugCodeOptions = async () => {
    try {
      setLoading(true);
      const response = await getRequest(`${GET_DRUG_CODE_FOR_DROPDOWN}`);
      if (response && response.response) {
        setDrugCodeOptions(response.response);
      }
    } catch (err) {
      console.error("Error fetching drug options:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const response = await getRequest(`${GET_CURRENT_USER_PROFILE_BY_NAME}/${crUser}`);

      if (response && response.response) {
        const { firstName = "", middleName = "", lastName = "" } = response.response;
        const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
        setFormData((prev) => ({
          ...prev,
          enteredBy: fullName,
        }));
      }
    } catch (err) {
      console.error("Error fetching current user:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartment = async () => {
    try {
      setLoading(true);
      const response = await getRequest(`${GET_DEPARTMENT_BY_ID}/${deptId}`);
      if (response && response.response) {
        setFormData((prev) => ({
          ...prev,
          department: deptId,
        }));
      }
    } catch (err) {
      console.error("Error fetching department:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchOpenBalance(0);
    fetchDrugCodeOptions();
    fetchBrand();
    fetchManufacturer();
    fetchCurrentUser();
    fetchDepartment();
  }, []);

  // Handle page change
  const handlePageChange = (page) => {
    const newPage = page - 1;
    setCurrentPage(page);
    fetchOpenBalance(newPage);
  };

  // Handle search with date filters
  const handleSearch = async () => {
    setIsSearching(true);
    setCurrentPage(1);
    await fetchOpenBalance(0, false); // Pass false to not show main loading
    setIsSearching(false);
  };

  const handleShowAll = async () => {
    setIsShowingAll(true);

    // Clear date filters in state
    setFromDate("");
    setToDate("");
    setCurrentPage(1);

    // Fetch initial unfiltered data from page 0
    try {
      // Build URL without any date filters
      let url = `${GET_OPENING_BALANCE_ENTRY_HEADERS}/${hospitalId}/${departmentId}?${REQUEST_PARAM_PAGE}=0&${REQUEST_PARAM_SIZE}=${DEFAULT_ITEMS_PER_PAGE}`;

      const response = await getRequest(url);

      if (response && response.response) {
        setApprovalData(response.response.content || []);
        setTotalPages(response.response.totalPages || 0);
        setTotalElements(response.response.totalElements || 0);
      } else {
        setApprovalData([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (err) {
      console.error("Error fetching opening balance headers:", err);
      setApprovalData([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setIsShowingAll(false);
    }
  };

  const [popupMessage, setPopupMessage] = useState(null)
  const [detailEntries, setDetailEntries] = useState([])

  const handleEditClick = async (record, e) => {
    e.stopPropagation();
    setSelectedRecord(record);

    // Fetch details when a row is clicked
    await fetchOpeningBalanceDetails(record.balanceMId);

    setCurrentView("detail");
  }

  const handleBackToList = () => {
    setCurrentView("list")
    setSelectedRecord(null)
    setDetailEntries([])
    setDtRecord([])
    setShowItemDropdown(false);
    setActiveRowIndex(null);
    setActiveDrugCodeDropdown(null);
    setItemSearch("");
    setItemDropdown([]);
  }

  const addNewEntry = () => {
    const newId = Date.now() + Math.random();
    const newEntry = {
      id: newId,
      sNo: detailEntries.length + 1,
      itemCode: "",
      itemName: "",
      unit: "",
      batchNo: "",
      dom: "",
      doe: "",
      qty: "",
      unitsPerPack: "",
      purchaseRatePerUnit: "",
      gstPercent: "",
      mrpPerUnit: "",
      totalCost: "",
      brandId: "",
      manufacturerId: "",
      itemId: null,
      drugData: null,
    };
    setDetailEntries([...detailEntries, newEntry]);
  }

  const deleteEntry = (id) => {
    setDetailEntries(detailEntries.filter((entry) => entry.id !== id));
    setDtRecord((prev) => {
      const updated = [...prev, id];
      return updated;
    });
  };

  const updateEntry = (id, field, value) => {
    const updatedEntries = detailEntries.map((entry) => {
      if (entry.id === id) {
        if (entry[field] === value) return entry;

        const updatedEntry = { ...entry, [field]: value };

        const dom = field === "dom" ? value : entry.dom;
        const doe = field === "doe" ? value : entry.doe;
        if (dom && doe && new Date(dom) > new Date(doe)) {
          showPopup(WARNING_DOM_DOE_VALIDATION, "warning");
          return entry;
        }

        const qty = parseFloat(field === "qty" ? value : entry.qty) || 0;
        const rate = parseFloat(field === "mrpPerUnit" ? value : entry.mrpPerUnit) || 0;
        if (field === "qty" || field === "mrpPerUnit") {
          updatedEntry.totalCost = (qty * rate).toFixed(2);
        }

        return updatedEntry;
      }
      return entry;
    });

    setDetailEntries(updatedEntries);
  };

  const formatToDate = (dateStr) => {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date.toISOString().split("T")[0];
  };

  const hasDuplicateDetailEntries = (entries) => {
    const seen = new Map();
    for (const entry of entries) {
      const key = `${entry.batchNo}|${entry.dom || entry.manufactureDate}|${entry.doe || entry.expiryDate}`;
      if (seen.has(key)) {
        const prev = seen.get(key);
        if (
          (prev.balanceId && entry.balanceId && prev.balanceId !== entry.balanceId) ||
          (!prev.balanceId || !entry.balanceId)
        ) {
          return true;
        }
      } else {
        seen.set(key, entry);
      }
    }
    return false;
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

  const parseNumber = (value) => (value ? parseFloat(value) : null);

  const handleUpdateLogic = async (status) => {
    if (hasDuplicateDetailEntries(detailEntries)) {
      showPopup(WARNING_DUPLICATE_BATCH_ENTRY, "warning");
      return { success: false, message: "Duplicate entry found for Batch No/Serial No, DOM, and DOE." };
    }

    const storeBalanceDtList = detailEntries.map(entry => ({
      balanceId: entry.balanceTId ?? null,
      itemId: entry.itemId ?? entry.id ?? null,
      batchNo: entry.batchNo ?? "",
      manufactureDate: formatToDate(entry.dom ?? entry.manufactureDate),
      expiryDate: formatToDate(entry.doe ?? entry.expiryDate),
      unitsPerPack: parseNumber(entry.unitsPerPack),
      purchaseRatePerUnit: parseNumber(entry.purchaseRatePerUnit),
      gstPercent: parseNumber(entry.gstPercent),
      mrpPerUnit: parseNumber(entry.mrpPerUnit),
      qty: parseNumber(entry.qty),
      totalPurchaseCost: parseFloat(entry.totalPurchaseCost ?? entry.totalCost ?? 0),
      brandId: parseNumber(entry.brandId),
      manufacturerId: parseNumber(entry.manufacturerId),
    }));

    const requestPayload = {
      id: selectedRecord.balanceMId,
      departmentId: formData.department,
      enteredBy: formData.enteredBy,
      enteredDt: new Date(formData.balanceEntryDate).toISOString(),
      status: status,
      deletedDt: Array.isArray(dtRecord) && dtRecord.length > 0 ? dtRecord : null,
      storeBalanceDtList,
    };

    try {
      if (status === "s") {
        setIsUpdating(true);
      } else if (status === "p") {
        setIsSubmitting(true);
      }

      const response = await putRequest(
        `${UPDATE_OPENING_BALANCE_ENTRY_BY_ID}/${selectedRecord.balanceMId}`,
        requestPayload
      );

      console.log("Payload to submit:", requestPayload);

      return { success: true, response, balanceMId: selectedRecord.balanceMId };

    } catch (error) {
      console.error("Error submitting data:", error);
      return { success: false, message: "Failed to update entries!" };
    } finally {
      setIsUpdating(false);
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (status) => {
    const actionText = status === "p" ? "submit" : "update";

    showConfirmationPopup(
      CONFIRM_OPENING_BALANCE_ACTION(actionText),
      "info",
      async () => {
        const result = await handleUpdateLogic(status);

        if (result?.success) {
          const balanceMId = result.balanceMId;

          showConfirmationPopup(
            CONFIRM_OPENING_BALANCE_SUBMIT_UPDATE_PRINT(status),
            "success",
            () => {
              if (balanceMId) {
                navigate('/ViewDownloadReport', {
                  state: {
                    reportUrl: `${OPENING_BALANCE_REPORT_URL}?${REQUEST_PARAM_BALANCE_M_ID}=${balanceMId}`,
                    title: status === "p" ? OPENING_BALANCE_ENTRY_SUBMIT_REPORT_TITLE : OPENING_BALANCE_ENTRY_UPDATE_REPORT_TITLE,
                    fileName: status === "p" ? OPENING_BALANCE_ENTRY_SUBMIT_REPORT_FILE_NAME : OPENING_BALANCE_ENTRY_UPDATE_REPORT_FILE_NAME,
                    returnPath: window.location.pathname
                  }
                });
              }

              fetchOpenBalance(0);
              setSelectedRecord(null);
              setDetailEntries([]);
              setDtRecord([]);
              setCurrentView("list");
            },
            () => {
              fetchOpenBalance(0);
              setSelectedRecord(null);
              setDetailEntries([]);
              setDtRecord([]);
              setCurrentView("list");
            },
            "Yes",
            "No"
          );
        } else {
          showConfirmationPopup(
            result?.message || ERROR_UPDATE_ENTRIES_FAILED,
            "error",
            () => { },
            null,
            "OK",
            "Close"
          );
        }
      },
      () => {
        console.log(`${actionText} cancelled by user`);
      },
      `${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
      "Cancel"
    );
  };

  const handleReset = () => {
    setDetailEntries([
      {
        id: 1,
        sNo: 1,
        drugCode: "",
        drugName: "",
        unit: "",
        batchNo: "",
        dom: "",
        doe: "",
        qty: "",
        unitRate: "",
        amount: "",
        medicineSource: "",
        manufacturer: "",
      },
    ])
  }

  const handleReportClick = async () => {
    const balanceMId = selectedRecord?.balanceMId;
    if (balanceMId) {
      try {
        setIsGeneratingReport(true);
        const reportUrl = `${OPENING_BALANCE_REPORT_URL}?${REQUEST_PARAM_BALANCE_M_ID}=${balanceMId}`;
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
      showPopup(OPENING_BALANCE_NOT_FOUND, "error");
    }
  };
  if (currentView === "detail") {
    return (
      <div className="content-wrapper">
        {(loading || loadingDetails) && <LoadingScreen />}

        {reportPdfUrl && (
          <PdfViewer
            pdfUrl={reportPdfUrl}
            name="Opening Balance Report"
            onClose={() => setReportPdfUrl(null)}
          />
        )}
        <ConfirmationPopup
          show={confirmationPopup !== null}
          message={confirmationPopup?.message || ''}
          type={confirmationPopup?.type || 'info'}
          onConfirm={confirmationPopup?.onConfirm || (() => { })}
          onCancel={confirmationPopup?.onCancel}
          confirmText={confirmationPopup?.confirmText || 'OK'}
          cancelText={confirmationPopup?.cancelText}
        />

        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">View And Edit Opening Balance Entry</h4>
                <button type="button" className="btn btn-secondary" onClick={handleBackToList}>
                  Back to List
                </button>
              </div>
              {popupMessage && (
                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
              )}

              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Balance Entry Date</label>
                    <input
                      type="text"
                      className="form-control"
                      value={
                        selectedRecord?.enteredDt
                          ? new Date(selectedRecord.enteredDt).toLocaleDateString("en-GB")
                          : ""
                      }
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Balance Entry Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.balanceNo || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Entered By</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.enteredBy || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Department</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.departmentName || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3 mt-3">
                    <label className="form-label fw-bold">Balance Type</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.balanceType || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                </div>

                <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "auto" }}>
                  <table className="table table-bordered align-middle">
                    <thead style={{ backgroundColor: "#6c7b7f", color: "white" }}>
                      <tr>
                        <th className="text-center" style={{ width: "60px", minWidth: "60px" }}>
                          S.No.
                        </th>
                        <th style={{ width: "120px", minWidth: "120px" }}>Item Code</th>
                        <th style={{ width: "200px", minWidth: "200px" }}>Item Name</th>
                        <th style={{ width: "80px", minWidth: "80px" }}>Unit</th>
                        <th style={{ width: "150px", minWidth: "150px" }}>Batch No/ Serial No</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>DOM</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>DOE</th>
                        <th style={{ width: "80px", minWidth: "80px" }}>Qty</th>
                        <th style={{ width: "100px", minWidth: "100px" }}>Units Per Pack</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>Purchase Rate/Unit</th>
                        <th style={{ width: "100px", minWidth: "100px" }}>GST Percent</th>
                        <th style={{ width: "100px", minWidth: "100px" }}>MRP/Unit</th>
                        <th style={{ width: "100px", minWidth: "100px" }}>Total Cost</th>
                        <th style={{ width: "150px", minWidth: "150px" }}>Brand Name</th>
                        <th style={{ width: "150px", minWidth: "150px" }}>Manufacturer</th>
                        {(selectedRecord?.status === "s" || selectedRecord?.status === "r") && (
                          <>
                            <th style={{ width: "60px", minWidth: "60px" }}>Add</th>
                            <th style={{ width: "70px", minWidth: "70px" }}>Delete</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {loadingDetails ? (
                        <tr>
                          <td colSpan={17} className="text-center py-4">
                            <LoadingScreen />
                          </td>
                        </tr>
                      ) : detailEntries.length === 0 ? (
                        <tr>
                          <td colSpan={17} className="text-center py-4 text-muted">
                            No details found for this opening balance entry.
                          </td>
                        </tr>
                      ) : (
                        detailEntries.map((entry, index) => (
                          <tr key={entry.id}>
                            <td className="text-center">
                              <input
                                type="text"
                                className="form-control text-center"
                                value={index + 1}
                                style={{ width: "50px" }}
                                readOnly
                              />
                            </td>

                            <td>
                              <div className="dropdown-search-container">
                                <input
                                  ref={(el) => { drugCodeInputRefs.current[index] = el; }}
                                  type="text"
                                  className="form-control"
                                  value={entry.itemCode}
                                  onChange={(e) => {
                                    updateEntry(entry.id, "itemCode", e.target.value);
                                    if (e.target.value.length > 0) {
                                      setActiveDrugCodeDropdown(index);
                                    } else {
                                      setActiveDrugCodeDropdown(null);
                                    }
                                  }}
                                  style={{ width: "110px" }}
                                  autoComplete="off"
                                  onFocus={() => setActiveDrugCodeDropdown(index)}
                                  readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                                />

                                {/* PortalDropdown for drug code search */}
                                <PortalDropdown
                                  anchorRef={{ current: drugCodeInputRefs.current[index] }}
                                  show={activeDrugCodeDropdown === index && (selectedRecord?.status === "s" || selectedRecord?.status === "r")}
                                >
                                  {drugCodeOptions
                                    .filter((opt) => {
                                      const search = entry.itemCode?.toLowerCase() || "";
                                      return (
                                        (opt.code && opt.code.toLowerCase().includes(search)) ||
                                        (opt.name && opt.name.toLowerCase().includes(search)) ||
                                        (opt.unit && opt.unit.toLowerCase().includes(search)) ||
                                        (opt.hsnCode && opt.hsnCode.toLowerCase().includes(search))
                                      );
                                    })
                                    .map((opt) => (
                                      <div
                                        key={opt.id}
                                        className="p-2"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          dropdownClickedRef.current = true;
                                          setDetailEntries(
                                            detailEntries.map((row, i) =>
                                              i === index
                                                ? {
                                                  ...row,
                                                  itemCode: opt.code,
                                                  itemName: opt.name,
                                                  unit: opt.unit,
                                                  itemId: opt.id,
                                                  gstPercent: opt.hsnGstPercentage,
                                                }
                                                : row
                                            )
                                          );
                                          setActiveDrugCodeDropdown(null);
                                          setTimeout(() => {
                                            dropdownClickedRef.current = false;
                                          }, 100);
                                        }}
                                        style={{
                                          cursor: "pointer",
                                          borderBottom: "1px solid #f0f0f0"
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                      >
                                        <div className="fw-bold">{opt.code}</div>
                                        <div>
                                          <small>{opt.name}</small>
                                        </div>
                                      </div>
                                    ))}
                                  {drugCodeOptions.filter((opt) => {
                                    const search = entry.itemCode?.toLowerCase() || "";
                                    return (
                                      (opt.code && opt.code.toLowerCase().includes(search)) ||
                                      (opt.name && opt.name.toLowerCase().includes(search)) ||
                                      (opt.unit && opt.unit.toLowerCase().includes(search)) ||
                                      (opt.hsnCode && opt.hsnCode.toLowerCase().includes(search))
                                    );
                                  }).length === 0 &&
                                    entry.itemCode && (
                                      <div className="p-2 text-muted text-center">No matches found</div>
                                    )}
                                </PortalDropdown>
                              </div>
                            </td>

                            {/* Item Name with debounce dropdown - Fixed with PortalDropdown */}
                            <td>
                              <div className="dropdown-search-container">
                                <input
                                  ref={(el) => { itemInputRefs.current[index] = el; }}
                                  type="text"
                                  className="form-control"
                                  value={entry.itemName || ""}
                                  onChange={(e) => {
                                    handleItemSearch(e.target.value, index);
                                  }}
                                  onClick={() => {
                                    if (entry.itemName?.trim() && selectedRecord?.balanceType) {
                                      loadFirstItemPage(entry.itemName);
                                    }
                                  }}
                                  placeholder={selectedRecord?.balanceType ? "Type item name..." : "Balance type not available"}
                                  style={{ minWidth: "190px" }}
                                  autoComplete="off"
                                  readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                                />

                                {/* PortalDropdown for item search */}
                                <PortalDropdown
                                  anchorRef={{ current: itemInputRefs.current[index] }}
                                  show={showItemDropdown && activeRowIndex === index && selectedRecord?.balanceType}
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
                                        const isSelectedInOtherRow = detailEntries.some(
                                          (e, i) => i !== index && e.itemId === item.itemId
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
                                className="form-control"
                                value={entry.unit || entry.itemUnit || ""}
                                onChange={(e) => updateEntry(entry.id, "unit", e.target.value)}
                                style={{ width: "70px" }}
                                readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control"
                                value={entry.batchNo}
                                onChange={(e) => updateEntry(entry.id, "batchNo", e.target.value)}
                                style={{ width: "140px" }}
                                readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                              />
                            </td>
                            <td>
                              <input
                                type="date"
                                className="form-control form-control-sm"
                                value={entry.dom || entry.manufactureDate}
                                max={entry.doe ? new Date(new Date(entry.doe).getTime() - 86400000).toISOString().split("T")[0] : undefined}
                                onChange={(e) => updateEntry(entry.id, "dom", e.target.value)}
                                style={{ minWidth: "120px" }}
                                readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                              />
                            </td>
                            <td>
                              <input
                                type="date"
                                className="form-control form-control-sm"
                                value={entry.doe || entry.expiryDate}
                                min={entry.dom ? new Date(new Date(entry.dom).getTime() + 86400000).toISOString().split("T")[0] : undefined}
                                onChange={(e) => updateEntry(entry.id, "doe", e.target.value)}
                                style={{ minWidth: "120px" }}
                                readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control"
                                value={entry.qty}
                                onChange={(e) => updateEntry(entry.id, "qty", e.target.value)}
                                style={{ width: "70px" }}
                                readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control"
                                value={entry.unitsPerPack || ""}
                                onChange={(e) => updateEntry(entry.id, "unitsPerPack", e.target.value)}
                                style={{ width: "90px" }}
                                readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control"
                                value={entry.purchaseRatePerUnit || ""}
                                onChange={(e) => updateEntry(entry.id, "purchaseRatePerUnit", e.target.value)}
                                style={{ width: "110px" }}
                                readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control"
                                value={entry.gstPercent || ""}
                                onChange={(e) => updateEntry(entry.id, "gstPercent", e.target.value)}
                                style={{ width: "90px" }}
                                readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control"
                                value={entry.mrpPerUnit || ""}
                                onChange={(e) => updateEntry(entry.id, "mrpPerUnit", e.target.value)}
                                style={{ width: "90px" }}
                                readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control"
                                value={entry.totalCost || entry.totalMrpValue || ""}
                                readOnly
                                style={{ backgroundColor: "#f8f9fa", minWidth: "90px" }}
                              />
                            </td>
                            <td>
                              <select
                                className="form-select"
                                value={entry.brandId || ""}
                                onChange={(e) => updateEntry(entry.id, "brandId", e.target.value)}
                                style={{ minWidth: "130px" }}
                                disabled={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                              >
                                <option value="">Select Brand</option>
                                {brandOptions.map((option) => (
                                  <option key={option.brandId} value={option.brandId}>
                                    {option.brandName}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td>
                              <select
                                className="form-select"
                                value={entry.manufacturerId || ""}
                                onChange={(e) => updateEntry(entry.id, "manufacturerId", e.target.value)}
                                style={{ minWidth: "170px" }}
                                disabled={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                              >
                                <option value="">Select</option>
                                {manufacturerOptions.map((option) => (
                                  <option key={option.manufacturerId} value={option.manufacturerId}>
                                    {option.manufacturerName}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {(selectedRecord?.status === "s" || selectedRecord?.status === "r") && (
                              <>
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-success"
                                    onClick={addNewEntry}
                                  >
                                    +
                                  </button>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-danger"
                                    onClick={() => deleteEntry(entry.id)}
                                    disabled={detailEntries.length === 1}
                                  >
                                    -
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

                {(selectedRecord?.status === "s" || selectedRecord?.status === "r") ? (
                  // Editable mode buttons (for Saved/Rejected status)
                  <div className="d-flex justify-content-end mt-4">
                    <button
                      type="button"
                      className="btn btn-info me-2"
                      onClick={handleReportClick}
                      disabled={isUpdating || isSubmitting || loadingDetails || isGeneratingReport}
                      style={{ color: "white" }}
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
                      className="btn me-2 btn-warning"
                      onClick={() => handleUpdate("s")}
                      disabled={isUpdating || isSubmitting || loadingDetails}
                    >
                      {isUpdating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Updating...
                        </>
                      ) : (
                        "Update"
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn btn-success me-2"
                      onClick={() => handleUpdate("p")}
                      disabled={isUpdating || isSubmitting || loadingDetails}
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

                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleReset}
                      disabled={isUpdating || isSubmitting || loadingDetails}
                    >
                      Reset
                    </button>
                  </div>
                ) : (
                  // View-only mode buttons (for Approved/Pending status)
                  <div className="d-flex justify-content-end mt-4">
                    <button
                      type="button"
                      className="btn btn-info me-2"
                      onClick={handleReportClick}
                      disabled={isUpdating || isSubmitting || loadingDetails || isGeneratingReport}
                      style={{ color: "white" }}
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

                    <button type="button" className="btn btn-secondary" onClick={handleBackToList}>
                      Back
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="content-wrapper">
      {loading && <LoadingScreen />}
      <ConfirmationPopup
        show={confirmationPopup !== null}
        message={confirmationPopup?.message || ''}
        type={confirmationPopup?.type || 'info'}
        onConfirm={confirmationPopup?.onConfirm || (() => { })}
        onCancel={confirmationPopup?.onCancel}
        confirmText={confirmationPopup?.confirmText || 'OK'}
        cancelText={confirmationPopup?.cancelText}
      />

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">View And Update Opening Balance Entry</h4>
            </div>

            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-3">
                  <label className="form-label fw-bold">From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                    }}
                    max={toDate || undefined}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value);
                    }}
                    min={fromDate || undefined}
                  />
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-primary me-2"
                    onClick={handleSearch}
                    disabled={loading || isSearching || isShowingAll}
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
                    className="btn btn-secondary"
                    onClick={handleShowAll}
                    disabled={loading || isSearching || isShowingAll}
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
                  <thead style={{ backgroundColor: "#95a5a6", color: "white" }}>
                    <tr>
                      <th>Balance No.</th>
                      <th>Opening Balance Date</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Submitted By</th>
                      <th>Drug / Non Drug</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4">
                          <LoadingScreen />
                        </td>
                      </tr>
                    ) : approvalData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-muted">
                          No opening balance entries found.
                        </td>
                      </tr>
                    ) : (
                      approvalData.map((item) => (
                        <tr key={item.balanceMId}>
                          <td>{item.balanceNo}</td>
                          <td>{new Date(item.enteredDt).toLocaleDateString("en-GB")}</td>
                          <td>{item.departmentName}</td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                backgroundColor:
                                  item.status === "p"
                                    ? "#ffc107"
                                    : item.status === "a"
                                      ? "#28a745"
                                      : item.status === "r"
                                        ? "#dc3545"
                                        : "#6c757d",
                                color: item.status === "p" ? "#000" : "#fff",
                              }}
                            >
                              {item.status === "s"
                                ? "Saved"
                                : item.status === "p"
                                  ? "Waiting for Approval"
                                  : item.status === "a"
                                    ? "Approved"
                                    : item.status === "r"
                                      ? "Rejected"
                                      : item.status}
                            </span>
                          </td>

                          <td>{item.enteredBy}</td>
                          <td>{item.balanceType}</td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={(e) => handleEditClick(item, e)}
                              title={item.status === "s" || item.status === "r" ? "Edit Entry" : "View Entry"}
                              disabled={loading}
                            >
                              <i
                                className={
                                  item.status === "s" || item.status === "r"
                                    ? "fa fa-pencil"
                                    : "fa fa-eye"
                                }
                              ></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                totalItems={totalElements}
                itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                totalPages={totalPages}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OpeningBalanceApproval