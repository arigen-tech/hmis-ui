import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from 'react-router-dom'
import Popup from "../../../Components/popup"
import ConfirmationPopup from "../../../Components/ConfirmationPopup"
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer"
import {  REQUEST_PARAM_CURRENT_DEPT_ID,REQUEST_PARAM_HOSPITAL_ID,REQUEST_PARAM_PAGE,REQUEST_PARAM_SIZE,REQUEST_PARAM_REQUESTED_DEPT_ID,REQUEST_PARAM_KEYWORD,REQUEST_PARAM_SECTION_ID,APPROVE_INDENT, GET_ALL_ITEMS_BY_NAME, GET_INDENT_DETAILS_FOR_APPROVAL, GET_INDENT_HEADERS_FOR_APPROVAL, GET_ITEM_DETAILS_BY_ID, INDENT_REPORT_URL, INVENTORY, REQUERST_PARAM_INDENT_M_ID, REQUEST_PARAM_DEPARTMENT_ID, SECTION_ID_FOR_DRUGS, STATUS_D } from "../../../config/apiConfig"
import { getRequest, postRequest, fetchPdfReportForViewAndPrint } from "../../../service/apiService"
import LoadingScreen from "../../../Components/Loading"
import DatePicker from "../../../Components/DatePicker"
import Pagination, {DEFAULT_ITEMS_PER_PAGE} from "../../../Components/Pagination";
import {ERROR_FETCH_PENDING_INDENTS,WARNING_SELECT_ACTION,WARNING_REMARKS_MANDATORY,SUCCESS_INDENT_REJECTED_PRINT,
SUCCESS_INDENT_APPROVED_PRINT,ERROR_PROCESS_INDENT,
INDENT_ID_NOT_FOUND,
REPORT_GENERATION_ERR_MSG,} from  "../../../config/constants";

// PortalDropdown Component
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
  const [selectedDrugs, setSelectedDrugs] = useState([])

  const [reportPdfUrl, setReportPdfUrl] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [itemSearch, setItemSearch] = useState("");
  const [itemPage, setItemPage] = useState(0);
  const [itemLastPage, setItemLastPage] = useState(true);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [isItemLoading, setIsItemLoading] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState(null);
  const [itemDropdown, setItemDropdown] = useState([]);

  const debounceItemRef = useRef(null);
  const itemInputRefs = useRef({});

  const navigate = useNavigate();

  const departmentId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId")
  const departmentName = sessionStorage.getItem('departmentName') || "Current Dept"

  useEffect(() => {
    const handleClickOutside = (e) => {
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

  const statusMap = {
    'Submitted': { label: "Pending for Approval", badge: "bg-warning", textColor: "text-dark" }
  }

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

  const fetchPendingIndents = async (deptId) => {
    try {
      setLoading(true)
      const url = `${GET_INDENT_HEADERS_FOR_APPROVAL}?${REQUEST_PARAM_DEPARTMENT_ID}=${deptId}`
      const response = await getRequest(url)

      let data = []
      if (response && response.response && Array.isArray(response.response)) {
        data = response.response
      } else if (response && Array.isArray(response)) {
        data = response
      } else {
        data = []
      }

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

  const fetchIndentDetails = async (indentMId, requestedDeptId) => {
    try {
      setLoadingDetails(true)
      const url = `${GET_INDENT_DETAILS_FOR_APPROVAL}/${indentMId}?${REQUEST_PARAM_CURRENT_DEPT_ID}=${departmentId}&${REQUEST_PARAM_REQUESTED_DEPT_ID}=${requestedDeptId}`
      const response = await getRequest(url)

      let items = []
      if (response && response.response && Array.isArray(response.response)) {
        items = response.response
      } else if (response && Array.isArray(response)) {
        items = response
      } else {
        items = []
      }

      if (items.length > 0) {
        console.log("Raw indent detail item from API (check field names):", items[0]);
      }

      const entries = items.map((item) => ({
        // id = indentTId (PK for existing rows). Non-null means this row exists in DB.
        id: item.indentTId ?? item.indentTid ?? item.IndentTId ?? null,
        // itemId is not returned by the details API — remains null for existing rows.
        // The backend update path uses indentTId to locate the record, so itemId is not
        // required for updates. It will only be set when the user changes the item via dropdown.
        itemId: item.itemId ?? null,
        itemCode: item.pvmsNo || "",
        itemName: item.itemName || "",
        apu: item.itemUnitName || "",
        requestedQty: item.qtyRequested || "",
        storeAvailableStock: item.storeAvailableStock || 0,
        currentDeptAvailableStock: item.currentDeptAvailableStock || 0,
        reasonForIndent: item.reasonForIndent || "",
      }))

      setIndentEntries(entries)

      // Only push non-null itemIds into selectedDrugs
      const drugIds = entries
        .filter(entry => entry.itemId !== null && entry.itemId !== undefined)
        .map(entry => entry.itemId)
      setSelectedDrugs(drugIds)

    } catch (err) {
      console.error("Error fetching indent details:", err)
      showPopup("Error fetching indent details. Please try again.", "error")
      setIndentEntries([])
    } finally {
      setLoadingDetails(false)
    }
  }

  const fetchItems = async (page, searchText = "") => {
    try {
      setIsItemLoading(true);
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

  const fetchItemDetails = async (itemId) => {
    try {
      const hospitalId = sessionStorage.getItem("hospitalId");
      const requestedDeptId = selectedRecord?.toDepartmentId;
      const currentDeptId = selectedRecord?.departmentId;

      let url = `${GET_ITEM_DETAILS_BY_ID}/${itemId}?${REQUEST_PARAM_HOSPITAL_ID}=${hospitalId}`;
      if (requestedDeptId) url += `&${REQUEST_PARAM_REQUESTED_DEPT_ID}=${requestedDeptId}`;
      if (currentDeptId) url += `&${REQUEST_PARAM_CURRENT_DEPT_ID}=${currentDeptId}`;

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
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching item details:", error);
      showPopup("Error fetching item details", "error");
      return null;
    }
  };

  const handleItemSearch = (value, index) => {
    setItemSearch(value);
    setActiveRowIndex(index);

    const newEntries = [...indentEntries];
    newEntries[index] = { ...newEntries[index], itemName: value };

    // If user clears/changes the text after a drug was selected, reset that row's item fields
    if (!value.trim()) {
      const oldItemId = newEntries[index].itemId;
      newEntries[index] = {
        ...newEntries[index],
        itemId: null,
        itemCode: "",
        apu: "",
        storeAvailableStock: "",
        currentDeptAvailableStock: "",
      };
      if (oldItemId) {
        setSelectedDrugs(prev => prev.filter(id => id !== oldItemId));
      }
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

  const loadMoreItems = async () => {
    if (itemLastPage) return;
    const nextPage = itemPage + 1;
    const result = await fetchItems(nextPage, itemSearch);
    setItemDropdown(prev => [...prev, ...result.list]);
    setItemLastPage(result.last);
    setItemPage(nextPage);
  };

  const handleItemSelect = async (index, item) => {
    const isDuplicate = selectedDrugs.some(
      id => id === item.itemId && indentEntries[index]?.itemId !== item.itemId
    );

    if (isDuplicate) {
      showPopup("Drug already added in another row", "warning");
      return;
    }

    const itemDetails = await fetchItemDetails(item.itemId);

    if (itemDetails) {
      const newEntries = [...indentEntries];
      const oldItemId = newEntries[index].itemId;

      newEntries[index] = {
        ...newEntries[index],
        itemId: itemDetails.itemId,
        itemCode: itemDetails.pvmsNo || "",
        itemName: itemDetails.nomenclature || "",
        apu: itemDetails.unitAuName || "",
        storeAvailableStock: itemDetails.requestedDeptStocks || 0,
        currentDeptAvailableStock: itemDetails.currentDeptStocks || 0,
      };

      setIndentEntries(newEntries);

      // Replace old itemId with new one in selectedDrugs
      setSelectedDrugs(prev => {
        const without = prev.filter(id => id !== oldItemId);
        return [...without, itemDetails.itemId];
      });

      setItemSearch("");
      setShowItemDropdown(false);
      setActiveRowIndex(null);
    }
  };

  const handleIndentEntryChange = (index, field, value) => {
    const updatedEntries = [...indentEntries];
    updatedEntries[index] = { ...updatedEntries[index], [field]: value };
    setIndentEntries(updatedEntries);
  };

  useEffect(() => {
    fetchPendingIndents(departmentId)
  }, [departmentId])

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

  const handleEditClick = async (record, e) => {
    e.stopPropagation()
    setSelectedRecord(record)
    await fetchIndentDetails(record.indentMId,record.toDepartmentId)
    setAction("")
    setRemarks("")
    setCurrentView("detail")
  }

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
    setReportPdfUrl(null)
  }

  const addNewRow = () => {
    const newEntry = {
      id: null,           // indentTId = null → backend treats this as INSERT
      itemId: null,       // null until user selects a drug from the dropdown
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

  const removeRow = (index) => {
    if (indentEntries.length > 1) {
      const entryToRemove = indentEntries[index]

      if (entryToRemove.itemId) {
        setSelectedDrugs(prev => prev.filter(id => id !== entryToRemove.itemId))
      }

      // Only track deletedT for rows that actually exist in the DB (id is not null)
      if (entryToRemove.id !== null && entryToRemove.id !== undefined) {
        setDtRecord(prev => [...prev, entryToRemove.id])
      }

      setIndentEntries(indentEntries.filter((_, i) => i !== index))
    }
  }

  const handleShowAll = () => {
    setFromDate("")
    setToDate("")
    setFilteredIndentData(indentData)
  }

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => setPopupMessage(null),
    })
  }

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
        showPopup(REPORT_GENERATION_ERR_MSG, "error");
      } finally {
        setIsGeneratingReport(false);
      }
    } else {
      showPopup(INDENT_ID_NOT_FOUND, "error");
    }
  };

  const handleSubmit = async () => {
    if (!action) {
      showPopup(WARNING_SELECT_ACTION, "error")
      return
    }

    if (!remarks.trim()) {
      showPopup(WARNING_REMARKS_MANDATORY, "error")
      return
    }

    const newStatus = action === "approved" ? "Approved" : "Rejected"

    // FIX: Include a row if it has a valid indentTId (existing row being updated)
    // OR a valid itemId (new row being inserted).
    // This ensures:
    //   - Existing rows (loaded from DB) are sent with their indentTId so the backend
    //     can UPDATE requestedQty / reason on the correct record.
    //   - New rows (user-added) with a selected drug are sent with itemId for INSERT.
    //   - New rows where the user never picked a drug (itemId still null) are excluded.
    const validEntries = indentEntries.filter(
      entry =>
        // Existing row: has a DB primary key → always include so backend can update it
        (entry.id !== null && entry.id !== undefined) ||
        // New row: user has selected a drug → include for backend INSERT
        (entry.itemId !== null && entry.itemId !== undefined && Number(entry.itemId) > 0)
    );

    const payload = {
      indentMId: selectedRecord?.indentMId,
      action: action,
      remarks: remarks,
      status: newStatus,
      deletedT: dtRecord.length > 0 ? dtRecord : [],
      items: validEntries.map((entry) => ({
        indentTId: entry.id ?? null,          // non-null → backend UPDATEs existing row
                                              // null     → backend INSERTs new row
        itemId: entry.itemId ? Number(entry.itemId) : null,
        requestedQty: entry.requestedQty ? Number(entry.requestedQty) : 0,
        reason: entry.reasonForIndent || "",
        availableStock: entry.storeAvailableStock || 0,
      })),
    }

    console.log("Submitting approval payload:", JSON.stringify(payload, null, 2))

    try {
      setIsSubmitting(true);
      setProcessing(true)

      await postRequest(`${APPROVE_INDENT}`, payload)

      const indentMId = selectedRecord?.indentMId

      if (action === "approved") {
        showConfirmationPopup(
          SUCCESS_INDENT_APPROVED_PRINT,
          "success",
          () => {
            navigate('/ViewDownloadReport', {
              state: {
                reportUrl: `${INDENT_REPORT_URL}?${REQUERST_PARAM_INDENT_M_ID}=${indentMId}`,
                title: 'Indent Approval Report',
                fileName: 'Indent Approval Report',
                returnPath: window.location.pathname
              }
            });
            handleBackToList();
            fetchPendingIndents(departmentId);
          },
          () => {
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
            navigate('/ViewDownloadReport', {
              state: {
                reportUrl: `${INDENT_REPORT_URL}?${REQUERST_PARAM_INDENT_M_ID}=${indentMId}`,
                title: 'Indent Rejection Report',
                fileName: 'Indent Rejection Report',
                returnPath: window.location.pathname
              }
            });
            handleBackToList();
            fetchPendingIndents(departmentId);
          },
          () => {
            handleBackToList();
            fetchPendingIndents(departmentId);
          },
          "Yes",
          "No"
        );
      }

    } catch (error) {
      console.error("Error processing indent:", error)
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
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString("en-GB")
  }

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return ""
    return new Date(dateTimeStr).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredIndentData.slice(indexOfFirst, indexOfLast);

  // ─── Detail View ─────────────────────────────────────────────────────────────
  if (currentView === "detail") {
    const toDepartmentName = selectedRecord?.toDepartmentName || "Store";
    const fromDepartmentName = selectedRecord?.deptName || departmentName;

    return (
      <div className="content-wrapper">
        {loadingDetails && <LoadingScreen />}

        {reportPdfUrl && (
          <PdfViewer
            pdfUrl={reportPdfUrl}
            name="Indent Report"
            onClose={() => setReportPdfUrl(null)}
          />
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

        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">Pending for Indent Approval - Request Department</h4>
                <button type="button" className="btn btn-secondary" onClick={handleBackToList}>
                  Back to List
                </button>
              </div>
              <div className="card-body">
                {/* Header fields */}
                <div className="row mb-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Indent Date</label>
                    <input type="text" className="form-control"
                      value={selectedRecord?.indentDate ? formatDate(selectedRecord.indentDate) : ""}
                      style={{ backgroundColor: "#e9ecef" }} readOnly />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Indent Number</label>
                    <input type="text" className="form-control"
                      value={selectedRecord?.indentNo || ""}
                      style={{ backgroundColor: "#e9ecef" }} readOnly />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Created By</label>
                    <input type="text" className="form-control"
                      value={selectedRecord?.createdBy || ""}
                      style={{ backgroundColor: "#e9ecef" }} readOnly />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Submission Date/Time</label>
                    <input type="text" className="form-control"
                      value={formatDateTime(selectedRecord?.approvedDate || selectedRecord?.indentDate)}
                      style={{ backgroundColor: "#e9ecef" }} readOnly />
                  </div>
                  <div className="col-md-3 mt-3">
                    <label className="form-label fw-bold">Indent Type</label>
                    <input type="text" className="form-control"
                      value={selectedRecord?.indentType}
                      style={{ backgroundColor: "#e9ecef" }} readOnly />
                  </div>
                </div>

                {/* Items table */}
                <div className="table-responsive" style={{ overflowX: "auto", maxWidth: "100%", overflowY: "visible" }}>
                  <table className="table table-bordered table-hover align-middle">
                    <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                      <tr>
                        <th className="text-center" style={{ width: "50px", minWidth: "50px" }}>S.No.</th>
                        <th style={{ width: "350px", minWidth: "300px" }}>Item Name/Code</th>
                        <th style={{ width: "80px", minWidth: "80px", textAlign: "center" }}>A/U</th>
                        <th style={{ width: "80px", minWidth: "80px", whiteSpace: "normal", lineHeight: "1.1", textAlign: "center" }}>Req<br />Qty</th>
                        <th style={{ width: "70px", minWidth: "70px", whiteSpace: "normal", lineHeight: "1.1", textAlign: "center" }}>{toDepartmentName}<br/>Avl Stk</th>
                        <th style={{ width: "70px", minWidth: "70px", whiteSpace: "normal", lineHeight: "1.1", textAlign: "center" }}>{fromDepartmentName}<br/>Avl Stk</th>
                        <th style={{ width: "250px", minWidth: "200px" }}>Reason for Indent</th>
                        <th style={{ width: "50px", textAlign: "center" }}>Add</th>
                        <th style={{ width: "50px", textAlign: "center" }}>Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingDetails ? (
                        <tr>
                          <td colSpan={9} className="text-center"><LoadingScreen /></td>
                        </tr>
                      ) : indentEntries.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center text-muted">No items found.</td>
                        </tr>
                      ) : (
                        indentEntries.map((entry, index) => (
                          <tr key={entry.id !== null ? entry.id : `new-${index}`}>
                            <td className="text-center fw-bold">{index + 1}</td>

                            <td>
                              <div className="dropdown-search-container">
                                <input
                                  ref={(el) => { itemInputRefs.current[index] = el; }}
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={entry.itemName || ""}
                                  onChange={(e) => handleItemSearch(e.target.value, index)}
                                  onClick={() => {
                                    if (entry.itemName?.trim()) {
                                      loadFirstItemPage(entry.itemName, index);
                                    }
                                  }}
                                  placeholder="Item Name/Code"
                                  style={{ minWidth: "320px" }}
                                  autoComplete="off"
                                />

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
                              <input type="text" className="form-control form-control-sm"
                                value={entry.apu} style={{ backgroundColor: "#f5f5f5" }} readOnly />
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
                                style={{ textAlign: "center" }}
                              />
                            </td>

                            <td>
                              <input type="number" className="form-control form-control-sm"
                                value={entry.storeAvailableStock || 0}
                                style={{ backgroundColor: "#f5f5f5", color: entry.storeAvailableStock === 0 ? "#dc3545" : "inherit" }}
                                readOnly />
                            </td>

                            <td>
                              <input type="number" className="form-control form-control-sm"
                                value={entry.currentDeptAvailableStock || 0}
                                style={{ backgroundColor: "#f5f5f5", color: entry.currentDeptAvailableStock === 0 ? "#dc3545" : "inherit" }}
                                readOnly />
                            </td>

                            <td>
                              <textarea
                                className="form-control form-control-sm"
                                value={entry.reasonForIndent}
                                onChange={(e) => handleIndentEntryChange(index, "reasonForIndent", e.target.value)}
                                placeholder="Enter reason"
                                rows="2"
                                style={{ resize: "vertical" }}
                              />
                            </td>

                            <td className="text-center">
                              <button type="button" className="btn btn-success btn-sm"
                                onClick={addNewRow}
                                style={{ color: "white", border: "none", height: "35px" }}
                                title="Add Row">+</button>
                            </td>
                            <td className="text-center">
                              <button type="button" onClick={() => removeRow(index)}
                                className="btn btn-danger btn-sm"
                                style={{ height: "35px" }}
                                title="Delete Row">−</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Action / Remarks */}
                <div className="row mt-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">
                      Action<span className="text-danger">*</span>
                    </label>
                    <select className="form-select" value={action}
                      onChange={(e) => setAction(e.target.value)} disabled={loadingDetails}>
                      <option value="">Select</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="col-md-9">
                    <label className="form-label fw-bold">
                      Remarks<span className="text-danger">*</span>
                    </label>
                    <textarea className="form-control" value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter remarks" rows="3" disabled={loadingDetails} />
                  </div>
                </div>

                {/* Buttons */}
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button type="button" className="btn btn-info" onClick={handleReportClick}
                    disabled={!selectedRecord?.indentMId || loadingDetails || isGeneratingReport}>
                    {isGeneratingReport ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Generating...</>
                    ) : "Report"}
                  </button>
                  <button type="button" className="btn btn-success" onClick={handleSubmit}
                    disabled={processing || !action || !remarks.trim() || loadingDetails || isGeneratingReport}>
                    {isSubmitting ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Submitting...</>
                    ) : "Submit"}
                  </button>
                  <button type="button" className="btn btn-danger" onClick={handleBackToList}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {popupMessage && (
          <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
        )}
      </div>
    )
  }

  // ─── List View ────────────────────────────────────────────────────────────────
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
                  <DatePicker label="From Date" value={fromDate} onChange={setFromDate} compact={true} />
                </div>
                <div className="col-md-2">
                  <DatePicker label="To Date" value={toDate} onChange={setToDate} compact={true} />
                </div>
                <div className="col-md-2 d-flex align-items-end">
                  <button type="button" className="btn btn-primary me-2" onClick={handleSearch} disabled={loading}>
                    {loading ? <LoadingScreen/> : "Search"}
                  </button>
                </div>
                <div className="col-md-6 d-flex justify-content-end align-items-end">
                  <button type="button" className="btn btn-primary" onClick={handleShowAll}>Show All</button>
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
                        const statusInfo = statusMap[item.statusName] || {
                          label: item.statusName || "Unknown",
                          badge: "bg-secondary",
                          textColor: "text-white"
                        };
                        return (
                          <tr key={item.indentMId} onClick={(e) => handleEditClick(item, e)} style={{ cursor: "pointer" }}>
                            <td>{formatDate(item.indentDate)}</td>
                            <td>{item.indentNo}</td>
                            <td>{item.deptName}</td>
                            <td>{item.toDepartmentName}</td>
                            <td>{item.createdBy}</td>
                            <td>{item.indentType}</td>
                            <td>
                              <span className={`badge ${statusInfo.badge} ${statusInfo.textColor}`}>
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
        <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
      )}
    </div>
  )
}

export default PendingIndentApproval