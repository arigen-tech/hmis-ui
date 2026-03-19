import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from 'react-router-dom'
import Popup from "../../../Components/popup"
import ConfirmationPopup from "../../../Components/ConfirmationPopup"
import { Store_Internal_Indent, MAS_DRUG_MAS, ALL_REPORTS, INVENTORY, SECTION_ID_FOR_DRUGS } from "../../../config/apiConfig"
import { getRequest, postRequest } from "../../../service/apiService"
import LoadingScreen from "../../../Components/Loading"
import DatePicker from "../../../Components/DatePicker"
import Pagination, {DEFAULT_ITEMS_PER_PAGE} from "../../../Components/Pagination";
import {ERROR_FETCH_PENDING_INDENTS,WARNING_SELECT_ACTION,WARNING_REMARKS_MANDATORY,SUCCESS_INDENT_REJECTED_PRINT,
SUCCESS_INDENT_APPROVED_PRINT,ERROR_PROCESS_INDENT,} from  "../../../config/constants";

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

const PendingIndentApproval = () => {
  const [currentView, setCurrentView] = useState("list")
  const [processing, setProcessing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [itemOptions, setItemOptions] = useState([])
  const [dtRecord, setDtRecord] = useState([])
  const [indentEntries, setIndentEntries] = useState([])
  const [popupMessage, setPopupMessage] = useState(null)
  const [confirmationPopup, setConfirmationPopup] = useState(null)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [indentData, setIndentData] = useState([])
  const [filteredIndentData, setFilteredIndentData] = useState([])
  const [action, setAction] = useState("")
  const [remarks, setRemarks] = useState("")
  const [selectedDrugs, setSelectedDrugs] = useState([]) // Added for drug selection tracking

  // New state for item search similar to IndentViewUpdate
  const [itemSearch, setItemSearch] = useState("");
  const [itemPage, setItemPage] = useState(0);
  const [itemLastPage, setItemLastPage] = useState(true);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [isItemLoading, setIsItemLoading] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState(null);
  const [itemDropdown, setItemDropdown] = useState([]);
  
  // Refs for debounce and dropdown
  const debounceItemRef = useRef(null);
  const itemInputRefs = useRef({});

  // Add navigate hook
  const navigate = useNavigate();

  const departmentId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId")
  const departmentName = sessionStorage.getItem('departmentName') || "Current Dept"

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

  // Status mapping based on statusName from the new API response
  const statusMap = {
    'Submitted': { label: "Pending for Approval", badge: "bg-warning", textColor: "text-dark" }
  }

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

  // Fetch pending indents (list view) - UPDATED to use new endpoint
  const fetchPendingIndents = async (deptId) => {
    try {
      setLoading(true)
      // Updated URL to use the new endpoint
      const url = `${INVENTORY}/indents/approval/pending?deptId=${deptId}`

      console.log("Fetching pending indents from URL:", url)

      const response = await getRequest(url)
      console.log("Pending Indents API Full Response:", response)

      let data = []
      if (response && response.response && Array.isArray(response.response)) {
        data = response.response
      } else if (response && Array.isArray(response)) {
        data = response
      } else {
        console.warn("Unexpected response structure, using empty array:", response)
        data = []
      }

      console.log("Processed pending indents data:", data)
      setIndentData(data)
      setFilteredIndentData(data)

    } catch (err) {
      console.error("Error fetching pending indents:", err)
      showPopup(ERROR_FETCH_PENDING_INDENTS, "error")
      setIndentData([])
      setFilteredIndentData([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch indent details by indentMId - UPDATED to use new endpoint with available stock
  const fetchIndentDetails = async (indentMId) => {
    try {
      setLoadingDetails(true)
      // Updated URL to use the new endpoint with indentMId and departmentId
      const url = `${INVENTORY}/indents/viewUpdate/details/${indentMId}?currentDeptId=${departmentId}`

      console.log("Fetching indent details from URL:", url)

      const response = await getRequest(url)
      console.log("Indent Details API Full Response:", response)

      let items = []
      if (response && response.response && Array.isArray(response.response)) {
        items = response.response
      } else if (response && Array.isArray(response)) {
        items = response
      } else {
        console.warn("Unexpected response structure, using empty array:", response)
        items = []
      }

      // Transform the API response to match the indentEntries format with new stock fields
      const entries = items.map((item) => ({
        id: item.indentTId || null,
        itemId: item.itemId || "",
        itemCode: item.pvmsNo || "",
        itemName: item.itemName || "",
        apu: item.itemUnitName || "",
        requestedQty: item.qtyRequested || "",
        storeAvailableStock: item.storeAvailableStock || 0, // Store available stock
        currentDeptAvailableStock: item.currentDeptAvailableStock || 0, // Current department available stock
        reasonForIndent: item.reasonForIndent || "",
      }))

      console.log("Setting indent entries from details:", entries)
      setIndentEntries(entries)
      
      // Update selected drugs tracking
      const drugIds = entries.filter(entry => entry.itemId).map(entry => entry.itemId)
      setSelectedDrugs(drugIds)

    } catch (err) {
      console.error("Error fetching indent details:", err)
      showPopup("Error fetching indent details. Please try again.", "error")
      setIndentEntries([])
    } finally {
      setLoadingDetails(false)
    }
  }

  // Fetch items from API with debounce
  const fetchItems = async (page, searchText = "") => {
    try {
      setIsItemLoading(true);
      
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

  // Fetch item details by ID
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
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching item details:", error);
      showPopup("Error fetching item details", "error");
      return null;
    } 
  };

  // Handle item search with debounce
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

  // Load first page of items for dropdown
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

  // Handle item selection from dropdown
  const handleItemSelect = async (index, item) => {
    // Check if drug is already selected in another row
    const isDuplicate = selectedDrugs.some(id => id === item.itemId && indentEntries[index]?.itemId !== item.itemId);

    if (isDuplicate) {
      showPopup("Drug already added in another row", "warning");
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

  // Fetch all drugs for dropdown with current stock
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
  //         storeAvailableStock: drug.storestocks || 0,
  //         currentDeptAvailableStock: drug.wardstocks || 0
  //       }))
  //       setItemOptions(drugs)
  //       console.log("Loaded drugs with stock:", drugs)
  //     } else if (response && Array.isArray(response)) {
  //       const drugs = response.map(drug => ({
  //         id: drug.itemId,
  //         code: drug.pvmsNo || "",
  //         name: drug.nomenclature || "",
  //         unit: drug.unitAuName || drug.dispUnitName || "",
  //         storeAvailableStock: drug.storestocks || 0,
  //         currentDeptAvailableStock: drug.wardstocks || 0
  //       }))
  //       setItemOptions(drugs)
  //       console.log("Loaded drugs with stock:", drugs)
  //     }
  //   } catch (err) {
  //     console.error("Error fetching drugs:", err)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  useEffect(() => {
    fetchPendingIndents(departmentId)
    // fetchAllDrugs()
  }, [departmentId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle search by date range
  const handleSearch = () => {
    if (!fromDate || !toDate) {
      setFilteredIndentData(indentData)
      return
    }
    const from = new Date(fromDate)
    const to = new Date(toDate)

    const filtered = indentData.filter((item) => {
      const itemDate = new Date(item.indentDate)
      return itemDate >= from && itemDate <= to
    })
    setFilteredIndentData(filtered)
    setCurrentPage(1)
  }

  // Handle edit click - UPDATED to fetch indent details using indentMId
  const handleEditClick = async (record, e) => {
    e.stopPropagation()

    console.log("Viewing record:", record)
    setSelectedRecord(record)

    // Fetch the detailed items for this indent using indentMId
    await fetchIndentDetails(record.indentMId)

    setAction("")
    setRemarks("")
    setCurrentView("detail")
  }

  // Handle back to list
  const handleBackToList = () => {
    setCurrentView("list")
    setSelectedRecord(null)
    setIndentEntries([])
    setSelectedDrugs([])
    setAction("")
    setRemarks("")
    setDtRecord([])
    setItemSearch("")
    setItemDropdown([])
    setShowItemDropdown(false)
    setActiveRowIndex(null)
  }

  // Add new row - UPDATED to include new stock fields
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
        setSelectedDrugs(selectedDrugs.filter(id => id !== entryToRemove.itemId))
      }
      
      if (entryToRemove.id) {
        setDtRecord((prev) => [...prev, entryToRemove.id])
      }
      const filteredEntries = indentEntries.filter((_, i) => i !== index)
      setIndentEntries(filteredEntries)
    }
  }

  // Handle show all
  const handleShowAll = () => {
    setFromDate("")
    setToDate("")
    setFilteredIndentData(indentData)
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

  // Handle approval/rejection - UPDATED WITH CONFIRMATION POPUP
  const handleSubmit = async () => {
    // Validate action selection
    if (!action) {
      showPopup(WARNING_SELECT_ACTION, "error")
      return
    }

    // Validate remarks
    if (!remarks.trim()) {
      showPopup(WARNING_REMARKS_MANDATORY, "error")
      return
    }

    // Determine the new status based on action
    const newStatus = action === "approved" ? "Approved" : "Rejected"

    const payload = {
      indentMId: selectedRecord?.indentMId,
      action: action,
      remarks: remarks,
      status: newStatus,
      deletedT: dtRecord.length > 0 ? dtRecord : [],
      items: indentEntries
        .filter(entry => entry.itemId && entry.itemName)
        .map((entry) => {
          const itemPayload = {
            itemId: Number(entry.itemId),
            requestedQty: entry.requestedQty ? Number(entry.requestedQty) : 0,
            reason: entry.reasonForIndent || "",
            storeAvailableStock: entry.storeAvailableStock ? Number(entry.storeAvailableStock) : 0,
          }

          // Only send indentTId if it exists and is a number
          if (entry.id && typeof entry.id === 'number') {
            itemPayload.indentTId = entry.id
          }

          return itemPayload
        }),
    }

    console.log("Submitting approval payload:", JSON.stringify(payload, null, 2))

    try {
      setProcessing(true)

      // Call approval API endpoint
      await postRequest(`${INVENTORY}/indent/approve`, payload)
      
      const indentMId = selectedRecord?.indentMId
      
      // Show confirmation popup based on action
      if (action === "approved") {
        showConfirmationPopup(
          SUCCESS_INDENT_APPROVED_PRINT,
          "success",
          () => {
            // Navigate to report page for approved indent
            navigate('/ViewDownloadReport', {
              state: {
                reportUrl: `${ALL_REPORTS}/indentReport?indentMId=${indentMId}`,
                title: 'Indent Approval Report',
                fileName: 'Indent Approval Report',
                returnPath: window.location.pathname
              }
            });
            handleBackToList();
            fetchPendingIndents(departmentId);
          },
          () => {
            // Just reset and stay on same page
            handleBackToList();
            fetchPendingIndents(departmentId);
          },
          "Yes",
          "No"
        );
      } else if (action === "rejected") {
        showConfirmationPopup(
          SUCCESS_INDENT_REJECTED_PRINT,
          "success",
          () => {
            // Navigate to report page for rejected indent
            navigate('/ViewDownloadReport', {
              state: {
                reportUrl: `${ALL_REPORTS}/indentReport?indentMId=${indentMId}`,
                title: 'Indent Rejection Report',
                fileName: 'Indent Rejection Report',
                returnPath: window.location.pathname
              }
            });
            handleBackToList();
            fetchPendingIndents(departmentId);
          },
          () => {
            // Just reset and stay on same page
            handleBackToList();
            fetchPendingIndents(departmentId);
          },
          "Yes",
          "No"
        );
      }

    } catch (error) {
      console.error("Error processing indent:", error)
      
      // Show error popup
      showConfirmationPopup(
        ERROR_PROCESS_INDENT,
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

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-GB")
  }

  // Format date time for display
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return ""
    const date = new Date(dateTimeStr)
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  // Pagination
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredIndentData.slice(indexOfFirst, indexOfLast);

  // Detail View
  if (currentView === "detail") {
    return (
      <div className="content-wrapper">
        {loadingDetails && <LoadingScreen />}
        
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
                <h4 className="card-title p-2 mb-0">Pending for Indent Approval -Request Department</h4>
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
                    <label className="form-label fw-bold">Submission Date/Time</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formatDateTime(selectedRecord?.approvedDate || selectedRecord?.indentDate)}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>

                  <div className="col-md-3 mt-3">
                    <label className="form-label fw-bold">Indent Type</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.indentType }
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                </div>

                <div className="table-responsive" style={{ overflowX: "auto", maxWidth: "100%", overflowY: "visible" }}>
                  <table className="table table-bordered table-hover align-middle" >
                    <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                      <tr>
                        <th className="text-center" style={{ width: "50px", minWidth: "50px" }}>
                          S.No.
                        </th>

                        <th style={{ width: "350px", minWidth: "300px" }}>
                          Item Name/Code
                        </th>

                        <th style={{ width: "80px", minWidth: "80px", textAlign: "center" }}>
                          A/U
                        </th>

                        <th
                          style={{
                            width: "60px",
                            minWidth: "60px",
                            whiteSpace: "normal",
                            lineHeight: "1.1",
                            textAlign: "center"
                          }}
                        >
                          Req<br />Qty
                        </th>

                        <th
                          style={{
                            width: "70px",
                            minWidth: "70px",
                            whiteSpace: "normal",
                            lineHeight: "1.1",
                            textAlign: "center"
                          }}
                        >
                          Store<br/>Avl Stk
                        </th>

                        <th
                          style={{
                            width: "70px",
                            minWidth: "70px",
                            whiteSpace: "normal",
                            lineHeight: "1.1",
                            textAlign: "center"
                          }}
                        >
                          {departmentName}<br/>Avl Stk
                        </th>

                        <th style={{ width: "200px", minWidth: "180px" }}>
                          Reason for Indent
                        </th>

                        <th style={{ width: "50px", textAlign: "center" }}>
                          Add
                        </th>

                        <th style={{ width: "50px", textAlign: "center" }}>
                          Remove
                        </th>
                      </tr>

                    </thead>
                    <tbody>
                      {loadingDetails ? (
                        <tr>
                          <td colSpan={9} className="text-center">
                            <LoadingScreen />
                          </td>
                        </tr>
                      ) : indentEntries.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center text-muted">
                            No items found.
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
                                    handleItemSearch(e.target.value, index);
                                  }}
                                  onClick={() => {
                                    if (entry.itemName?.trim()) {
                                      loadFirstItemPage(entry.itemName, index);
                                    }
                                  }}
                                  placeholder="Item Name/Code"
                                  style={{ minWidth: "320px" }}
                                  autoComplete="off"
                                />

                                {/* PortalDropdown for item search */}
                                <PortalDropdown
                                  anchorRef={{ current: itemInputRefs.current[index] }}
                                  show={showItemDropdown && activeRowIndex === index}
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
                                style={{ backgroundColor: "#f5f5f5" }}
                                readOnly
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={entry.requestedQty}
                                style={{ backgroundColor: "#f5f5f5" }}
                                readOnly
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={entry.storeAvailableStock || 0}
                                style={{
                                  backgroundColor: "#f5f5f5",
                                  color: entry.storeAvailableStock === 0 ? "#dc3545" : "inherit"
                                }}
                                readOnly
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={entry.currentDeptAvailableStock || 0}
                                style={{
                                  backgroundColor: "#f5f5f5",
                                  color: entry.currentDeptAvailableStock === 0 ? "#dc3545" : "inherit"
                                }}
                                readOnly
                              />
                            </td>
                            <td>
                              <textarea
                                className="form-control form-control-sm"
                                value={entry.reasonForIndent}
                                style={{ minHeight: "40px", backgroundColor: "#f5f5f5" }}
                                readOnly
                              />
                            </td>
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
                                onClick={() => removeRow(index)}
                                className="btn btn-danger btn-sm"
                                style={{
                                  height: "35px",
                                }}
                                title="Delete Row"
                              >
                                −
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="row mt-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">
                      Action<span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={action}
                      onChange={(e) => setAction(e.target.value)}
                      disabled={loadingDetails}
                    >
                      <option value="">Select</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="col-md-9">
                    <label className="form-label fw-bold">
                      Remarks<span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter remarks"
                      rows="3"
                      disabled={loadingDetails}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button
    type="button"
    className="btn btn-info"
    onClick={() => {
      const indentMId = selectedRecord?.indentMId;
      navigate('/ViewDownloadReport', {
        state: {
          reportUrl: `${ALL_REPORTS}/indentReport?indentMId=${indentMId}`,
          title: 'Indent Report',
          fileName: 'Indent Report',
          returnPath: window.location.pathname
        }
      });
    }}
    disabled={!selectedRecord?.indentMId || loadingDetails}
  >
    Report
  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleSubmit}
                    disabled={processing || !action || !remarks.trim() || loadingDetails}
                  >
                    {processing ? "Processing..." : "Submit"}
                  </button>
                  <button type="button" className="btn btn-danger" onClick={handleBackToList}>
                    Close
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

  // List View
  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Pending For Indent Approval - Request Department</h4>
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
                <div className="col-md-2 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-primary me-2"
                    onClick={handleSearch}
                    disabled={loading}
                  >
                    {loading ? <LoadingScreen/> : "Search"}
                  </button>
                </div>
                <div className="col-md-6 d-flex justify-content-end align-items-end">
                  <button type="button" className="btn btn-primary" onClick={handleShowAll}>
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
                      <th>From Department</th>
                      <th>To Department</th>
                      <th>Created By</th>
                      <th>Drug / Non Drug</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center">
                          {loading ? <LoadingScreen/> : "No pending indents found."}
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((item) => {
                        // Use statusName from the new API response
                        const statusInfo = statusMap[item.statusName] || { label: item.statusName || "Unknown", badge: "bg-secondary", textColor: "text-white" };
                        return (
                          <tr key={item.indentMId} onClick={(e) => handleEditClick(item, e)} style={{ cursor: "pointer" }}>
                            <td>{formatDate(item.indentDate)}</td>
                            <td>{item.indentNo}</td>
                            <td>{item.deptName}</td>
                            <td>{item.toDepartmentName}</td>
                            <td>{item.createdBy}</td>
                            <td>{item.indentType}</td>
                            <td>
                              <span
                                className={`badge ${statusInfo.badge} ${statusInfo.textColor}`}
                              >
                                {statusInfo.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                totalItems={filteredIndentData.length}
                itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
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

export default PendingIndentApproval