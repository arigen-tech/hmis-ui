import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from 'react-router-dom';
import Popup from "../../../Components/popup"
import ConfirmationPopup from "../../../Components/ConfirmationPopup";
import {  GET_INDENT_HEADERS_FOR_ISSUE, REQUEST_PARAM_DEPARTMENT_ID, GET_STOCK_BATCHES_ITEM_WISE, REQUEST_PARAM_HOSPITAL_ID, GET_INDENT_DETAILS_FOR_ISSUE, GET_ISSUE_M_ID_FROM_INDENT_M_ID, REQUERST_PARAM_INDENT_M_ID, ISSUE_REPORT_URL, REQUEST_PARAM_ISSUE_M_ID, GET_PREVIOUS_ISSUE_DETAILS, REQUEST_PARAM_ITEM_ID, ISSUE_INDENT } from "../../../config/apiConfig"
import { getRequest, postRequest } from "../../../service/apiService"
import LoadingScreen from "../../../Components/Loading"
import DatePicker from "../../../Components/DatePicker"
import Pagination, {DEFAULT_ITEMS_PER_PAGE} from "../../../Components/Pagination";
import {ERROR_MESSAGES,ERROR_FETCHING_INDENTS,CONFIRM_ISSUE_INDENT,CONFIRM_INDENT_ISSUED_PRINT,
  ERROR_ISSUING_INDENT,ERROR_ITEM_ID_MISSING,} from "../../../config/constants";

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
  return createPortal(<div style={style}>{children}</div>, document.body);
};

const IndentIssue = () => {
  const [currentView, setCurrentView] = useState("list")
  const [processing, setProcessing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [itemOptions, setItemOptions] = useState([])
  const [batchOptions, setBatchOptions] = useState({})
  const [dtRecord, setDtRecord] = useState([])
  const [indentEntries, setIndentEntries] = useState([])
  const [popupMessage, setPopupMessage] = useState(null)
  const [confirmationPopup, setConfirmationPopup] = useState(null)
  const dropdownClickedRef = useRef(false)
  const [activeItemDropdown, setActiveItemDropdown] = useState(null)
  const [activeBatchDropdown, setActiveBatchDropdown] = useState(null)
  const itemInputRefs = useRef({})
  const batchInputRefs = useRef({})
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [indentData, setIndentData] = useState([])
  const [filteredIndentData, setFilteredIndentData] = useState([])
  const [showPreviousIssues, setShowPreviousIssues] = useState(false)
  const [previousIssuesData, setPreviousIssuesData] = useState([])
  const [previousIssuesLoading, setPreviousIssuesLoading] = useState(false)
  const [previousIssuesError, setPreviousIssuesError] = useState(null)
  const [manuallyAddedRows, setManuallyAddedRows] = useState({})
  const [isIssuing, setIsIssuing] = useState(false) // Added state for issuing spinner

  const navigate = useNavigate();

  const departmentId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId")
  const hospitalId = sessionStorage.getItem("hospitalId") || localStorage.getItem("hospitalId")

  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedInsideItemInput = Object.values(itemInputRefs.current).some(
        (ref) => ref && ref.contains(e.target)
      );
      const clickedInsideBatchInput = Object.values(batchInputRefs.current).some(
        (ref) => ref && ref.contains(e.target)
      );
      if (!clickedInsideItemInput && !clickedInsideBatchInput) {
        setActiveItemDropdown(null);
        setActiveBatchDropdown(null);
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

  const fetchPendingIndentsForIssue = async (deptId) => {
    try {
      if (!deptId) {
        showPopup(ERROR_MESSAGES.DEPARTMENT_NOT_FOUND, "error");
        return;
      }
      setLoading(true);
      const url = `${GET_INDENT_HEADERS_FOR_ISSUE}?${REQUEST_PARAM_DEPARTMENT_ID}=${deptId}`;
      const response = await getRequest(url);
      let data = [];
      if (response && response.response && Array.isArray(response.response)) {
        data = response.response;
      } else if (response && Array.isArray(response)) {
        data = response;
      }
      setIndentData(data);
      setFilteredIndentData(data);
    } catch (err) {
      showPopup(ERROR_FETCHING_INDENTS, "error");
      setIndentData([]);
      setFilteredIndentData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingIndentsForIssue(departmentId);
  }, [departmentId]);

  const handleSearch = () => {
    if (!fromDate || !toDate) {
      setFilteredIndentData(indentData);
      return;
    }
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const filtered = indentData.filter((item) => {
      const itemDate = new Date(item.indentDate);
      return itemDate >= from && itemDate <= to;
    });
    setFilteredIndentData(filtered);
    setCurrentPage(1);
  };

  const calculateAutoQtyIssued = (batchStock, approvedQty, previousIssuedQty, availableStock) => {
    const batchStockNum = Number(batchStock) || 0;
    const approvedQtyNum = Number(approvedQty) || 0;
    const previousIssuedQtyNum = Number(previousIssuedQty) || 0;
    const availableStockNum = Number(availableStock) || 0;
    const remainingQty = Math.max(0, approvedQtyNum - previousIssuedQtyNum);
    if (remainingQty === 0) return "";
    if (batchStockNum === 0) return "";
    if (availableStockNum >= remainingQty) {
      return remainingQty.toString();
    } else {
      return Math.min(batchStockNum, availableStockNum).toString();
    }
  };

  const fetchBatchesForItem = async (itemId, itemCode) => {
    try {
      const url = `${GET_STOCK_BATCHES_ITEM_WISE}/${itemId}?${REQUEST_PARAM_HOSPITAL_ID}=${hospitalId}&${REQUEST_PARAM_DEPARTMENT_ID}=${departmentId}`;
      const response = await getRequest(url);
      let batches = [];
      if (response && response.response && Array.isArray(response.response)) {
        batches = response.response;
      } else if (response && Array.isArray(response)) {
        batches = response;
      }
      const mappedBatches = batches.map(b => ({
        batchNo: b.batchName,
        dom: b.dom,
        doe: b.doe,
        stock: b.batchStock,
        totalAvailableStock: b.availableStock,
        manufacturerId: b.manufacturerId ?? null 
      }));
      setBatchOptions(prev => ({
        ...prev,
        [itemCode]: mappedBatches
      }));
      return mappedBatches;
    } catch (error) {
      console.error("Error fetching batches for item:", error);
      return [];
    }
  };

  const getUsedBatchNos = (itemCode, currentIndex) => {
    return indentEntries
      .filter((e, i) => i !== currentIndex && e.itemCode === itemCode && e.batchNo)
      .map(e => e.batchNo);
  };

  const handleIndentEntryChange = (index, field, value) => {
    const updatedEntries = [...indentEntries];

    if (field === "itemName") {
      const selectedItem = itemOptions.find((opt) => opt.name === value);
      const itemCode = selectedItem ? selectedItem.code : "";
      const totalAvailableStock = selectedItem ? selectedItem.availableStock : 0;

      updatedEntries[index] = {
        ...updatedEntries[index],
        itemName: value,
        itemCode: itemCode,
        itemId: selectedItem ? selectedItem.id : "",
        apu: selectedItem ? selectedItem.unit : "",
        availableStock: totalAvailableStock,
        batchNo: "",
        dom: "",
        doe: "",
        expDate: "",
        batchStock: "",
        qtyIssued: "",
      };

      setIndentEntries(updatedEntries);

      if (selectedItem && manuallyAddedRows[index]) {
        fetchBatchesForItem(selectedItem.id, itemCode);
      }

    } else if (field === "batchNo") {
      const selectedBatch = batchOptions[updatedEntries[index].itemCode]?.find((b) => b.batchNo === value);

      if (selectedBatch) {
        const newBatchStock = selectedBatch.stock || 0;
        const approvedQty = Number(updatedEntries[index].approvedQty) || 0;
        const previousIssuedQty = Number(updatedEntries[index].previousIssuedQty) || 0;
        const availableStock = Number(updatedEntries[index].availableStock) || 0;

        if (manuallyAddedRows[index]) {
          // Find the original (non-manual) row for this item
          const originalRowIndex = updatedEntries.findIndex(
            (e, i) => i !== index && e.itemCode === updatedEntries[index].itemCode && !manuallyAddedRows[i]
          );

          const origBatchStock = originalRowIndex !== -1
            ? Number(updatedEntries[originalRowIndex].batchStock) || 0
            : 0;

          // Reconstruct full approved qty by summing both rows' current approvedQty
          // This is stable regardless of how many times batch is re-selected
          const currentOrigApproved = originalRowIndex !== -1
            ? Number(updatedEntries[originalRowIndex].approvedQty) || 0
            : 0;
          const currentManualApproved = Number(updatedEntries[index].approvedQty) || 0;
          const fullApprovedQty = currentOrigApproved + currentManualApproved;

          // Original row is capped to its own batchStock
          const origRowQty = Math.min(origBatchStock, fullApprovedQty);
          // New row gets whatever remains after original row's batchStock covers its share
          const newRowQty = Math.max(0, fullApprovedQty - origBatchStock);

          // Update the new (manual) row
          updatedEntries[index] = {
            ...updatedEntries[index],
            batchNo: value,
            dom: formatDateForDisplay(selectedBatch.dom),
            doe: formatDateForDisplay(selectedBatch.doe),
            expDate: selectedBatch.doe || "",
            manufacturerId: selectedBatch.manufacturerId ?? updatedEntries[index].manufacturerId ?? null,
            batchStock: newBatchStock,
            availableStock: selectedBatch.totalAvailableStock || availableStock,
            qtyDemanded: newRowQty,
            approvedQty: newRowQty,
            qtyIssued: newRowQty,
            balanceAfterIssue: 0,
          };

          // Update the original row
          if (originalRowIndex !== -1) {
            updatedEntries[originalRowIndex] = {
              ...updatedEntries[originalRowIndex],
              qtyDemanded: origRowQty,
              approvedQty: origRowQty,
              qtyIssued: origBatchStock > 0
                ? Math.min(origBatchStock, origRowQty)
                : origRowQty,
              balanceAfterIssue: origBatchStock > 0
                ? Math.max(0, origRowQty - Math.min(origBatchStock, origRowQty))
                : 0,
            };
          }

        } else {
          // Non-manual row: standard auto-fill logic
          const autoQtyIssued = calculateAutoQtyIssued(newBatchStock, approvedQty, previousIssuedQty, availableStock);
          updatedEntries[index] = {
            ...updatedEntries[index],
            batchNo: value,
            dom: formatDateForDisplay(selectedBatch.dom),
            doe: formatDateForDisplay(selectedBatch.doe),
            expDate: selectedBatch.doe || "",
            manufacturerId: selectedBatch.manufacturerId ?? updatedEntries[index].manufacturerId ?? null,
            batchStock: newBatchStock,
            qtyIssued: autoQtyIssued,
            balanceAfterIssue: Math.max(0, approvedQty - previousIssuedQty - Number(autoQtyIssued)),
          };
        }
      }
      setIndentEntries(updatedEntries);

    } else if (field === "qtyIssued") {
      const qtyIssued = value === "" ? "" : Number(value) || 0;
      const approvedQty = Number(updatedEntries[index].approvedQty) || 0;
      const batchStock = Number(updatedEntries[index].batchStock) || 0;
      const previousIssuedQty = Number(updatedEntries[index].previousIssuedQty) || 0;
      const remainingQty = Math.max(0, approvedQty - previousIssuedQty);

      if (value === "") {
        updatedEntries[index] = {
          ...updatedEntries[index],
          qtyIssued: "",
          balanceAfterIssue: remainingQty,
        };
      } else {
        let finalQtyIssued = qtyIssued;
        if (qtyIssued > batchStock) finalQtyIssued = batchStock;
        if (qtyIssued > remainingQty) finalQtyIssued = remainingQty;
        updatedEntries[index] = {
          ...updatedEntries[index],
          qtyIssued: finalQtyIssued.toString(),
          balanceAfterIssue: remainingQty - finalQtyIssued,
        };
      }
      setIndentEntries(updatedEntries);

    } else {
      updatedEntries[index] = {
        ...updatedEntries[index],
        [field]: value,
      };
      setIndentEntries(updatedEntries);
    }
  };

  const fetchIndentDetails = async (indentMId, deptId) => {
    try {
      setDetailsLoading(true);
      const url = `${GET_INDENT_DETAILS_FOR_ISSUE}/${indentMId}?${REQUEST_PARAM_DEPARTMENT_ID}=${deptId}`;
      const response = await getRequest(url);
      let items = [];
      if (response && response.response && Array.isArray(response.response)) {
        items = response.response;
      } else if (response && Array.isArray(response)) {
        items = response;
      }

      // ── CHANGED: added expDate and manufacturerId ──
      const entries = items.map((item) => ({
        id: item.indentTId || null,
        itemId: item.itemId || "",
        itemCode: item.pvmsNo || `ITEM_${item.itemId}`,
        itemName: item.itemName || "",
        apu: item.unitAuName || "",
        qtyDemanded: item.requestedQty || 0,
        approvedQty: item.approvedQty || 0,
        previousIssuedQty: 0,
        batchNo: item.batchNo || "",
        dom: formatDateForDisplay(item.mfgDate),
        doe: formatDateForDisplay(item.expDate),
        expDate: item.expDate || "",           // raw value for payload
        manufacturerId: item.manufacturerId ?? null,  // for payload
        qtyIssued: item.approvedQty,
        balanceAfterIssue: Math.max(0, item.approvedQty || 0),
        batchStock: item.batchAvailableStock || 0,
        availableStock: item.availableStock || 0,
      }));

      setIndentEntries(entries);
      setManuallyAddedRows({});

      const allItems = [];
      const batchMap = {};

      items.forEach(item => {
        const itemCode = item.pvmsNo || `ITEM_${item.itemId}`;
        if (!allItems.some(existing => existing.id === item.itemId)) {
          allItems.push({
            id: item.itemId,
            code: itemCode,
            name: item.itemName || "",
            unit: item.unitAuName || "",
            availableStock: item.availableStock || 0
          });
        }
        if (item.batchNo) {
          if (!batchMap[itemCode]) batchMap[itemCode] = [];
          batchMap[itemCode].push({
            batchNo: item.batchNo,
            dom: item.mfgDate || "",
            doe: item.expDate || "",
            stock: item.batchAvailableStock || 0,
            totalAvailableStock: item.availableStock || 0
          });
        }
      });

      setItemOptions(allItems);
      setBatchOptions(batchMap);
    } catch (error) {
      console.error("Error fetching indent details:", error);
      showPopup("Error fetching indent details. Please try again.", "error");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleEditClick = async (record, e) => {
    e.stopPropagation();
    try {
      setSelectedRecord(record);
      setLoading(true);
      await fetchIndentDetails(record.indentMId, departmentId);
      setCurrentView("detail");
    } catch (error) {
      console.error("Error in handleEditClick:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedRecord(null);
    setIndentEntries([]);
    setItemOptions([]);
    setBatchOptions({});
    setManuallyAddedRows({});
  };

  const handleShowAll = () => {
    setFromDate("");
    setToDate("");
    setFilteredIndentData(indentData);
  };

  const addNewRow = (sourceIndex) => {
    const sourceEntry = indentEntries[sourceIndex];
    const newEntry = {
      id: sourceEntry.id,
      itemId: sourceEntry.itemId,
      itemCode: sourceEntry.itemCode,
      itemName: sourceEntry.itemName,
      apu: sourceEntry.apu,
      qtyDemanded: "",
      approvedQty: "",
      batchNo: "",
      dom: "",
      doe: "",
      expDate: "",
      manufacturerId: sourceEntry.manufacturerId || null,
      qtyIssued: "",
      balanceAfterIssue: "",
      batchStock: "",
      availableStock: sourceEntry.availableStock,
      previousIssuedQty: 0,
    };

    const newEntries = [...indentEntries];
    const insertIndex = sourceIndex + 1;
    newEntries.splice(insertIndex, 0, newEntry);
    setIndentEntries(newEntries);

    setManuallyAddedRows(prev => {
      const updated = {};
      Object.keys(prev).forEach(k => {
        const ki = parseInt(k);
        if (ki >= insertIndex) {
          updated[ki + 1] = prev[k];
        } else {
          updated[ki] = prev[k];
        }
      });
      updated[insertIndex] = true;
      return updated;
    });

    if (sourceEntry.itemId && sourceEntry.itemCode) {
      fetchBatchesForItem(sourceEntry.itemId, sourceEntry.itemCode);
    }
  };

  const removeRow = (index) => {
    if (indentEntries.length > 1) {
      const entryToRemove = indentEntries[index];

      if (manuallyAddedRows[index]) {
        const removedQty = Number(entryToRemove.approvedQty) || 0;
        const originalRowIndex = indentEntries.findIndex(
          (e, i) => i !== index && e.itemCode === entryToRemove.itemCode && !manuallyAddedRows[i]
        );
        const updatedEntries = [...indentEntries];
        if (originalRowIndex !== -1) {
          const origApproved = Number(updatedEntries[originalRowIndex].approvedQty) || 0;
          const restoredApproved = origApproved + removedQty;
          const origBatchStock = Number(updatedEntries[originalRowIndex].batchStock) || 0;
          updatedEntries[originalRowIndex] = {
            ...updatedEntries[originalRowIndex],
            qtyDemanded: restoredApproved,
            approvedQty: restoredApproved,
            qtyIssued: origBatchStock > 0 ? Math.min(origBatchStock, restoredApproved) : restoredApproved,
            balanceAfterIssue: origBatchStock > 0
              ? Math.max(0, restoredApproved - Math.min(origBatchStock, restoredApproved))
              : 0,
          };
        }
        updatedEntries.splice(index, 1);
        setIndentEntries(updatedEntries);
      } else {
        if (entryToRemove.id) {
          setDtRecord((prev) => [...prev, entryToRemove.id]);
        }
        const filteredEntries = indentEntries.filter((_, i) => i !== index);
        setIndentEntries(filteredEntries);
      }

      setManuallyAddedRows(prev => {
        const updated = {};
        Object.keys(prev).forEach(k => {
          const ki = parseInt(k);
          if (ki === index) return;
          if (ki > index) {
            updated[ki - 1] = prev[k];
          } else {
            updated[ki] = prev[k];
          }
        });
        return updated;
      });
    }
  };

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => setPopupMessage(null),
    });
  };

  const hasValidEntries = () => {
    return indentEntries.some(entry => entry.itemCode && entry.itemName);
  };

  const checkSplitBatchWarning = () => {
    const warnings = [];
    indentEntries.forEach((entry, index) => {
      const qtyIssued = Number(entry.qtyIssued) || 0;
      const batchStock = Number(entry.batchStock) || 0;
      const availableStock = Number(entry.availableStock) || 0;
      if (qtyIssued > 0 && batchStock > 0 && qtyIssued > batchStock && qtyIssued <= availableStock) {
        warnings.push({ index, itemName: entry.itemName, qtyIssued, batchStock, availableStock });
      }
    });
    return warnings;
  };

  const validateSubmission = () => {
    const errors = [];

    if (!hasValidEntries()) {
      errors.push("At least one item must be selected");
      return errors;
    }

    const issuableItems = [];
    const insufficientItems = [];

    indentEntries.forEach((entry, index) => {
      if (entry.itemCode && entry.itemName) {
        const qtyIssued = Number(entry.qtyIssued) || 0;
        const approvedQty = Number(entry.approvedQty) || 0;
        const previousIssuedQty = Number(entry.previousIssuedQty) || 0;
        const availableStock = Number(entry.availableStock) || 0;
        const remainingQty = Math.max(0, approvedQty - previousIssuedQty);

        if (approvedQty > 0 && remainingQty > 0) {
          if (qtyIssued > 0) {
            if (!entry.batchNo) {
              errors.push(`Row ${index + 1}: Batch No is required`);
            }
            if (qtyIssued !== remainingQty) {
              errors.push(`Row ${index + 1}: Must issue full remaining quantity (${remainingQty})`);
            }
            if (qtyIssued > remainingQty) {
              errors.push(`Row ${index + 1}: Qty Issued (${qtyIssued}) cannot exceed Remaining Approved Qty (${remainingQty})`);
            }
            if (availableStock < qtyIssued) {
              insufficientItems.push({
                index: index + 1,
                itemName: entry.itemName,
                required: qtyIssued,
                available: availableStock
              });
            } else {
              issuableItems.push({ index: index + 1, itemName: entry.itemName, qtyIssued });
            }
          }
        }
      }
    });

    if (insufficientItems.length > 0) {
      const insufficientList = insufficientItems.map(item =>
        `Row ${item.index}: ${item.itemName} - Required: ${item.required}, Available: ${item.available}`
      ).join('\n');
      errors.push(`Cannot issue these items due to insufficient total stock:\n${insufficientList}\n\nPlease adjust Qty Issued or set to 0 for these items.`);
    }

    if (issuableItems.length === 0 && errors.length === 0) {
      errors.push("No items can be issued. Either insufficient stock or no quantity entered.");
    }

    return errors;
  };

  const handleIssueClick = () => {
    const errors = validateSubmission();
    if (errors.length > 0) {
      showPopup(errors.join("\n"), "error");
      return;
    }

    const splitWarnings = checkSplitBatchWarning();
    if (splitWarnings.length > 0) {
      const warnMsg = splitWarnings.map(w =>
        `Row ${w.index + 1} (${w.itemName}): Qty Issued (${w.qtyIssued}) exceeds selected Batch Stock (${w.batchStock}). ` +
        `Total Available Stock is ${w.availableStock}.\n` +
        `Please add another row for this item to split the issue across batches.`
      ).join('\n\n');

      showConfirmationPopup(
        `⚠️ Batch Stock Insufficient for Full Issue:\n\n${warnMsg}\n\nDo you want to proceed anyway or cancel to add a split row?`,
        "warning",
        () => {
          showConfirmationPopup(
            CONFIRM_ISSUE_INDENT,
            "info",
            () => handleConfirmSubmit(),
            () => console.log("Issue cancelled by user"),
            "Submit",
            "Cancel"
          );
        },
        () => console.log("User cancelled to add split row"),
        "Proceed Anyway",
        "Cancel & Add Split Row"
      );
      return;
    }

    showConfirmationPopup(
      CONFIRM_ISSUE_INDENT,
      "info",
      () => handleConfirmSubmit(),
      () => console.log("Issue cancelled by user"),
      "Submit",
      "Cancel"
    );
  };

  const handleConfirmSubmit = async () => {
    try {
      setProcessing(true);
      setIsIssuing(true); 

      const payload = {
        indentMId: selectedRecord?.indentMId,
        // ── CHANGED: added batchStock, itemId, batchNo, manufacturerId, expiryDate ──
        items: indentEntries
          .filter((entry) => entry.itemCode && entry.itemName && Number(entry.qtyIssued) > 0)
          .map((entry) => ({
            indentTId: entry.id,
            issuedQty: Number(entry.qtyIssued) || 0,
            availableStock: entry.availableStock ? Number(entry.availableStock) : 0,
            batchStock: entry.batchStock ? Number(entry.batchStock) : 0,
            itemId: entry.itemId || null,
            batchNo: entry.batchNo || "",
            manufacturerId: entry.manufacturerId || null,
            expiryDate: entry.expDate || null,
          })),
      };

      const response = await postRequest(`${ISSUE_INDENT}`, payload);

      if (response && response.status === 200) {
        const indentMId = selectedRecord?.indentMId;
        const issueResponse = await getRequest(`${GET_ISSUE_M_ID_FROM_INDENT_M_ID}?${REQUERST_PARAM_INDENT_M_ID}=${indentMId}`);
        showConfirmationPopup(
          CONFIRM_INDENT_ISSUED_PRINT,
          "success",
          () => {
            navigate('/ViewDownloadReport', {
              state: {
                reportUrl: `${ISSUE_REPORT_URL}?${REQUEST_PARAM_ISSUE_M_ID}=${issueResponse.response}`,
                title: 'Indent Issue Report',
                fileName: 'Indent Issue Report',
                returnPath: window.location.pathname
              }
            });
            const updatedIndentData = indentData.filter(item => item.indentMId !== selectedRecord?.indentMId);
            setIndentData(updatedIndentData);
            setFilteredIndentData(updatedIndentData);
            handleBackToList();
          },
          () => {
            const updatedIndentData = indentData.filter(item => item.indentMId !== selectedRecord?.indentMId);
            setIndentData(updatedIndentData);
            setFilteredIndentData(updatedIndentData);
            handleBackToList();
          },
          "Yes",
          "No"
        );
      } else {
        const errorMessage = response?.message || "Error issuing indent. Please try again.";
        showConfirmationPopup(errorMessage, "error", () => {}, null, "OK", "Close");
      }
    } catch (error) {
      console.error("Error submitting indent:", error);
      showConfirmationPopup(ERROR_ISSUING_INDENT, "error", () => {}, null, "OK", "Close");
    } finally {
      setProcessing(false);
      
      setIsIssuing(false); 
    }
  };

  const handleViewPreviousIssues = async (entry) => {
    try {
      if (!entry.itemId) {
        showPopup(ERROR_ITEM_ID_MISSING, "error");
        return;
      }
      setPreviousIssuesLoading(true);
      setPreviousIssuesError(null);
      setPreviousIssuesData([]);
      setShowPreviousIssues(true);

      const url = `${GET_PREVIOUS_ISSUE_DETAILS}?${REQUEST_PARAM_ITEM_ID}=${entry.itemId}&${REQUERST_PARAM_INDENT_M_ID}=${selectedRecord?.indentMId}`;
      const response = await getRequest(url);

      let data = [];
      if (response && response.response && Array.isArray(response.response)) {
        data = response.response;
      } else if (response && Array.isArray(response)) {
        data = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        data = response.data;
      }

      if (data.length === 0) {
        setPreviousIssuesError("No previous issues found for this item.");
      } else {
        setPreviousIssuesData(data);
      }
    } catch (error) {
      setPreviousIssuesError("Error fetching previous issues. Please try again.");
    } finally {
      setPreviousIssuesLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return "";
    }
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return "";
    const date = new Date(dateTimeStr);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredIndentData.slice(indexOfFirst, indexOfLast);

  const PreviousIssuesModal = () => {
    if (!showPreviousIssues) return null;
    return (
      <div
        style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10000 }}
        onClick={() => setShowPreviousIssues(false)}
      >
        <div
          style={{ width: "calc(100vw - 310px)", backgroundColor: "white", left: "285px", maxWidth: "90%", maxHeight: "80vh", margin: "5vh auto", position: "fixed", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.2)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h5 className="mb-0">Previous Issues History</h5>
            <button type="button" className="btn-close" onClick={() => setShowPreviousIssues(false)} aria-label="Close"></button>
          </div>

          {previousIssuesLoading ? (
            <div style={{ textAlign: "center", padding: "60px 40px" }}>
              <div className="spinner-border text-primary mb-3" role="status"><span className="visually-hidden">Loading...</span></div>
              <p className="text-muted">Loading previous issues...</p>
            </div>
          ) : previousIssuesError ? (
            <div style={{ textAlign: "center", padding: "60px 40px" }}>
              <div style={{ fontSize: "48px", marginBottom: "15px" }}>📭</div>
              <p className="text-muted" style={{ fontSize: "16px" }}>{previousIssuesError}</p>
              <p className="text-secondary" style={{ fontSize: "14px", marginTop: "10px" }}>This item has no previous issue records.</p>
            </div>
          ) : previousIssuesData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 40px" }}>
              <div style={{ fontSize: "48px", marginBottom: "15px" }}>📭</div>
              <p className="text-muted" style={{ fontSize: "16px" }}>No previous issues found for this item.</p>
            </div>
          ) : (
            <div className="table-responsive" style={{ maxHeight: "calc(80vh - 150px)", overflowY: "auto" }}>
              <table className="table table-bordered table-hover">
                <thead style={{ backgroundColor: "#9db4c0", position: "sticky", top: 0 }}>
                  <tr>
                    <th>Issue Date</th>
                    <th>Indent No</th>
                    <th>Issue No</th>
                    <th>Qty Issued</th>
                    <th>Batch No</th>
                  </tr>
                </thead>
                <tbody>
                  {previousIssuesData.map((issue, index) => (
                    <tr key={index}>
                      <td><strong>{formatDate(issue.issueDate)}</strong></td>
                      <td>{issue.indentNo}</td>
                      <td>{issue.issueNo || "N/A"}</td>
                      <td>
                        <span style={{ fontWeight: "bold", color: "#0c5460", backgroundColor: "#d1ecf1", padding: "4px 8px", borderRadius: "4px" }}>
                          {issue.qtyIssued}
                        </span>
                       </td>
                      <td>{issue.batchNo || "N/A"}</td>
                     </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: "15px", display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-secondary" onClick={() => setShowPreviousIssues(false)}>Close</button>
          </div>
        </div>
      </div>
    );
  };

  if (currentView === "detail") {
    return (
      <div className="content-wrapper">
        {loading && <LoadingScreen />}
        <ConfirmationPopup
          show={confirmationPopup !== null}
          message={confirmationPopup?.message || ''}
          type={confirmationPopup?.type || 'info'}
          onConfirm={confirmationPopup?.onConfirm || (() => {})}
          onCancel={confirmationPopup?.onCancel}
          confirmText={confirmationPopup?.confirmText || 'OK'}
          cancelText={confirmationPopup?.cancelText}
        />
        <PreviousIssuesModal />
        {popupMessage && (
          <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
        )}
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">Indent Issue ({selectedRecord?.toDeptName || "Store"})</h4>
                <button type="button" className="btn btn-secondary" onClick={handleBackToList}>Back</button>
              </div>
              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Indent No.</label>
                    <input type="text" className="form-control" value={selectedRecord?.indentNo || ""} style={{ backgroundColor: "#e9ecef" }} readOnly />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Indent Date</label>
                    <input type="text" className="form-control" value={formatDateTime(selectedRecord?.indentDate)} style={{ backgroundColor: "#e9ecef" }} readOnly />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Requested By</label>
                    <input type="text" className="form-control" value={selectedRecord?.createdBy || ""} style={{ backgroundColor: "#e9ecef" }} readOnly />
                  </div>
                </div>
                <div className="row mb-4">
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Submission Date/Time</label>
                    <input type="text" className="form-control" value={formatDateTime(selectedRecord?.indentDate)} style={{ backgroundColor: "#e9ecef" }} readOnly />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Approval Date/Time</label>
                    <input type="text" className="form-control" value={formatDateTime(selectedRecord?.approvedDate)} style={{ backgroundColor: "#e9ecef" }} readOnly />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Approved By</label>
                    <input type="text" className="form-control" value={selectedRecord?.approvedBy || ""} style={{ backgroundColor: "#e9ecef" }} readOnly />
                  </div>
                </div>
                <div className="row mb-4">
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Approved Date/Time ({selectedRecord?.toDeptName || "Store"})</label>
                    <input type="text" className="form-control" value={selectedRecord?.storeApprovedDate ? formatDateTime(selectedRecord.storeApprovedDate) : ""} style={{ backgroundColor: "#e9ecef" }} readOnly />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Approved By ({selectedRecord?.toDeptName || "Store"})</label>
                    <input type="text" className="form-control" value={selectedRecord?.storeApprovedBy || ""} style={{ backgroundColor: "#e9ecef" }} readOnly />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Indent Type</label>
                    <input type="text" className="form-control" value={selectedRecord?.indentType || ""} style={{ backgroundColor: "#e9ecef" }} readOnly />
                  </div>
                </div>

                <div className="table-responsive" style={{ overflowX: "auto", maxWidth: "100%", overflowY: "visible" }}>
                  <table className="table table-bordered table-hover align-middle text-center">
                    <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                      <tr>
                        <th className="text-center" style={{ width: "20px", padding: "0" }}>S.No.</th>
                        <th style={{ width: "400px", padding: "0", minWidth: "400px" }}>Item Name/<br />Code</th>
                        <th style={{ width: "60px", minWidth: "60px", padding: "0", textAlign: "center" }}>A/U</th>
                        <th style={{ width: "180px", minWidth: "100px", whiteSpace: "normal", padding: "0", lineHeight: "1.2" }}>Batch<br />No.</th>
                        <th style={{ width: "60px", whiteSpace: "normal", padding: "1", lineHeight: "1" }}>DOM</th>
                        <th style={{ width: "60px", whiteSpace: "normal", padding: "1", lineHeight: "1" }}>DOE</th>
                        <th style={{ width: "90px", whiteSpace: "normal", padding: "1", lineHeight: "1.2" }}>Qty<br />Demanded</th>
                        <th style={{ width: "90px", whiteSpace: "normal", padding: "1", lineHeight: "1.2" }}>Approved<br />Qty</th>
                        <th style={{ width: "120px", whiteSpace: "normal", padding: "1", lineHeight: "1.2" }}>Qty<br />Issued</th>
                        <th style={{ width: "110px", whiteSpace: "normal", padding: "1", lineHeight: "1.2" }}>Balance<br />After Issue</th>
                        <th style={{ width: "90px", whiteSpace: "normal", padding: "1", lineHeight: "1.2" }}>Batch Stock</th>
                        <th style={{ width: "100px", whiteSpace: "normal", padding: "1", lineHeight: "1.2" }}>Available<br />Stock</th>
                        <th style={{ width: "100px", whiteSpace: "normal", padding: "1", lineHeight: "1.2" }}>Previous<br />Issued Qty</th>
                        <th style={{ width: "40px", textAlign: "center" }}>Add</th>
                        <th style={{ width: "50px", textAlign: "center" }}>Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {indentEntries.length === 0 && detailsLoading ? (
                        <tr>
                          <td colSpan="15" className="text-center py-4">
                            <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                            <p className="mt-2">Loading indent details...</p>
                          </td>
                        </tr>
                      ) : (
                        indentEntries.map((entry, index) => {
                          const isManualRow = !!manuallyAddedRows[index];
                          const usedBatchNos = getUsedBatchNos(entry.itemCode, index);

                          return (
                            <tr key={entry.id ? `${entry.id}-${index}` : index}
                              style={isManualRow ? { backgroundColor: "#f0f8ff" } : {}}>

                              <td className="text-center fw-bold" style={{ padding: "0", width: "20px" }}>
                                {index + 1}
                                {isManualRow && (
                                  <span title="Split row" style={{ marginLeft: "2px", color: "#0d6efd", fontSize: "10px" }}>✦</span>
                                )}
                              </td>

                              <td style={{ position: "relative", overflow: "visible" }}>
                                <div className="dropdown-search-container">
                                  <input
                                    ref={(el) => { itemInputRefs.current[index] = el; }}
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={entry.itemName}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      handleIndentEntryChange(index, "itemName", value);
                                      setActiveItemDropdown(value.length > 0 ? index : null);
                                    }}
                                    placeholder="Item Name/Code"
                                    autoComplete="off"
                                    onFocus={() => setActiveItemDropdown(index)}
                                    readOnly={!isManualRow}
                                    style={!isManualRow ? { backgroundColor: "#e9ecef" } : {}}
                                  />
                                  {isManualRow && (
                                    <PortalDropdown
                                      anchorRef={{ current: itemInputRefs.current[index] }}
                                      show={activeItemDropdown === index}
                                    >
                                      {itemOptions
                                        .filter(opt =>
                                          entry.itemName === "" ||
                                          opt.name.toLowerCase().includes(entry.itemName.toLowerCase()) ||
                                          opt.code.toLowerCase().includes(entry.itemName.toLowerCase())
                                        )
                                        .map((opt) => (
                                          <div
                                            key={opt.id}
                                            className="p-2"
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              dropdownClickedRef.current = true;
                                              handleIndentEntryChange(index, "itemName", opt.name);
                                              setActiveItemDropdown(null);
                                              setTimeout(() => { dropdownClickedRef.current = false; }, 100);
                                            }}
                                            style={{ cursor: "pointer", borderBottom: "1px solid #f0f0f0" }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8f9fa'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                          >
                                            <div className="fw-bold">{opt.code}</div>
                                            <div className="d-flex justify-content-between align-items-center">
                                              <small>{opt.name}</small>
                                              <small className="text-muted">Stock: {opt.availableStock}</small>
                                            </div>
                                          </div>
                                        ))}
                                      {itemOptions.filter(opt =>
                                        entry.itemName === "" ||
                                        opt.name.toLowerCase().includes(entry.itemName.toLowerCase()) ||
                                        opt.code.toLowerCase().includes(entry.itemName.toLowerCase())
                                      ).length === 0 && entry.itemName !== "" && (
                                        <div className="p-2 text-muted text-center">No matches found</div>
                                      )}
                                    </PortalDropdown>
                                  )}
                                </div>
                              </td>

                              <td>
                                <input type="text" className="form-control form-control-sm" value={entry.apu} placeholder="Unit" disabled />
                              </td>

                              <td>
                                <div className="dropdown-search-container">
                                  <input
                                    ref={(el) => { batchInputRefs.current[index] = el; }}
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={entry.batchNo}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      handleIndentEntryChange(index, "batchNo", value);
                                      setActiveBatchDropdown(value.length > 0 ? index : null);
                                    }}
                                    placeholder="Batch"
                                    autoComplete="off"
                                    onFocus={() => entry.itemCode && setActiveBatchDropdown(index)}
                                  />
                                  <PortalDropdown
                                    anchorRef={{ current: batchInputRefs.current[index] }}
                                    show={activeBatchDropdown === index && !!entry.itemCode && !!batchOptions[entry.itemCode]}
                                  >
                                    {batchOptions[entry.itemCode]
                                      ?.filter(batch =>
                                        entry.batchNo === "" ||
                                        batch.batchNo.toLowerCase().includes(entry.batchNo.toLowerCase())
                                      )
                                      .map((batch, batchIndex) => {
                                        const isUsed = usedBatchNos.includes(batch.batchNo);
                                        return (
                                          <div
                                            key={`${batch.batchNo}-${batchIndex}`}
                                            className="p-2"
                                            onMouseDown={(e) => {
                                              if (isUsed) { e.preventDefault(); return; }
                                              e.preventDefault();
                                              dropdownClickedRef.current = true;
                                              handleIndentEntryChange(index, "batchNo", batch.batchNo);
                                              setActiveBatchDropdown(null);
                                              setTimeout(() => { dropdownClickedRef.current = false; }, 100);
                                            }}
                                            style={{
                                              cursor: isUsed ? "not-allowed" : "pointer",
                                              borderBottom: "1px solid #f0f0f0",
                                              opacity: isUsed ? 0.7 : 1,
                                              backgroundColor: isUsed ? "#fff8e1" : "transparent"
                                            }}
                                            onMouseEnter={(e) => { if (!isUsed) e.currentTarget.style.backgroundColor = '#f8f9fa'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isUsed ? "#fff8e1" : "transparent"; }}
                                          >
                                            <div className="d-flex justify-content-between align-items-center">
                                              <strong>{batch.batchNo}</strong>
                                              {isUsed && (
                                                <span style={{ fontSize: "11px", fontWeight: "600", backgroundColor: "#ffc107", color: "#000", padding: "2px 6px", borderRadius: "4px" }}>
                                                  Already Used
                                                </span>
                                              )}
                                            </div>
                                            <div>
                                              <small className="text-muted">
                                                DOM: {formatDate(batch.dom)} | DOE: {formatDate(batch.doe)}
                                              </small>
                                            </div>
                                            <div>
                                              <small className="text-muted">
                                                Batch Stock: {batch.stock} | Total Available: {batch.totalAvailableStock}
                                              </small>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    {batchOptions[entry.itemCode]?.filter(batch =>
                                      entry.batchNo === "" ||
                                      batch.batchNo.toLowerCase().includes(entry.batchNo.toLowerCase())
                                    ).length === 0 && entry.batchNo !== "" && (
                                      <div className="p-2 text-muted text-center">No matches found</div>
                                    )}
                                  </PortalDropdown>
                                </div>
                              </td>

                              <td>
                                <input type="text" className="form-control form-control-sm" style={{ width: "60px", padding: "0" }} value={entry.dom} readOnly />
                              </td>

                              <td>
                                <input type="text" className="form-control form-control-sm" style={{ width: "60px", padding: "0" }} value={entry.doe} readOnly />
                              </td>

                              <td>
                                <input type="number" className="form-control form-control-sm" value={entry.qtyDemanded} placeholder="0" readOnly min="0" />
                              </td>

                              <td>
                                <input type="number" className="form-control form-control-sm" value={entry.approvedQty} placeholder="0" readOnly min="0" />
                              </td>

                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={entry.qtyIssued}
                                  style={{ width: "60px" }}
                                  onChange={(e) => handleIndentEntryChange(index, "qtyIssued", e.target.value)}
                                  placeholder="0"
                                  min="0"
                                  max={Math.max(0, entry.approvedQty - entry.previousIssuedQty)}
                                  title={`Enter quantity to issue (max: ${Math.max(0, entry.approvedQty - entry.previousIssuedQty)})`}
                                />
                              </td>

                              <td>
                                <input type="number" className="form-control form-control-sm" value={entry.balanceAfterIssue} placeholder="0" style={{ backgroundColor: "#f8f9fa" }} readOnly />
                              </td>

                              <td>
                                <input type="number" className="form-control form-control-sm" style={{ width: "80px" }} value={entry.batchStock} placeholder="0" readOnly title="Stock for selected batch only" />
                              </td>

                              <td>
                                <input type="number" className="form-control form-control-sm" value={entry.availableStock} placeholder="0" readOnly title="Total stock across all batches for this item" />
                              </td>

                              <td>
                                <button type="button" className="btn btn-info btn-sm" onClick={() => handleViewPreviousIssues(entry)}>
                                  <i className="bi bi-info-circle"></i>
                                </button>
                              </td>

                              <td className="text-center">
                                <button
                                  type="button"
                                  className="btn btn-success btn-sm"
                                  onClick={() => addNewRow(index)}
                                  style={{ color: "white", border: "none", height: "35px" }}
                                  title="Add Split Row for Same Item"
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
                                  style={{ height: "35px" }}
                                >
                                  −
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleIssueClick}
                    disabled={processing || detailsLoading || isIssuing}
                  >
                    {isIssuing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Issuing...
                      </>
                    ) : (
                      "Issue"
                    )}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleBackToList}>Back</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-wrapper">
      <ConfirmationPopup
        show={confirmationPopup !== null}
        message={confirmationPopup?.message || ''}
        type={confirmationPopup?.type || 'info'}
        onConfirm={confirmationPopup?.onConfirm || (() => {})}
        onCancel={confirmationPopup?.onCancel}
        confirmText={confirmationPopup?.confirmText || 'OK'}
        cancelText={confirmationPopup?.cancelText}
      />
      <PreviousIssuesModal />
      {popupMessage && (
        <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
      )}
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2 mb-0">Indent Issue List</h4>
              <div>
                <button type="button" className="btn me-2 btn-primary" onClick={handleShowAll}>Show All</button>
              </div>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-3">
                  <DatePicker label="From Date" value={fromDate} onChange={setFromDate} compact={true} />
                </div>
                <div className="col-md-3">
                  <DatePicker label="To Date" value={toDate} onChange={setToDate} compact={true} />
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <button type="button" className="btn btn-primary" onClick={handleSearch}>Search</button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                    <tr>
                      <th>Department</th>
                      <th>Indent No.</th>
                      <th>Indent Date</th>
                      <th>Submission Date/Time</th>
                      <th>Approval Date/Time</th>
                      <th>Drug / Non Drug</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center">
                          {loading ? <LoadingScreen /> : "No records found."}
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((item) => (
                        <tr key={item.indentMId} onClick={(e) => handleEditClick(item, e)} style={{ cursor: "pointer" }}>
                          <td>{item.fromDeptName}</td>
                          <td>{item.indentNo}</td>
                          <td>{formatDateTime(item.indentDate)}</td>
                          <td>{formatDateTime(item.indentDate)}</td>
                          <td>{formatDateTime(item.approvedDate)}</td>
                          <td>{item.indentType}</td>
                          <td>
                            <span className="badge bg-warning text-dark">Pending for issue</span>
                          </td>
                        </tr>
                      ))
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
    </div>
  );
};

export default IndentIssue;