import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import Popup from "../../../Components/popup";
import ConfirmationPopup from "../../../Components/ConfirmationPopup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, putRequest } from "../../../service/apiService";
import { ALL_REPORTS,
DISPENSARY_DEPARTMENT_ID,
GET_PENDING_PRESCRIPTION_HEADERS,
OPD_PRESCRIPTION_SLIP_REPORT ,
GET_PRESCRIPTION_DETAILS ,   
GET_ITEM_BATCHES,                             
APPROVE_PRESCRIPTION_URL, 
PRESCRIPTION_INVOICE_REPORT} from "../../../config/apiConfig";
import ViewDownloadWithUnlimitedButtons from "../../../Components/ViewDownloadWithUnlimitedButtons"; // adjust path as needed

// ---------- API endpoints ----------
                

// ---------- Portal dropdown (identical to IndentIssue) ----------
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

const PrescriptionIssue = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState("list");

  // Loading states
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);

  // Data
  const [prescriptionList, setPrescriptionList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailEntries, setDetailEntries] = useState([]);
  const [batchOptions, setBatchOptions] = useState({});   // keyed by itemId

  // Search / filter
  const [patientName, setPatientName] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Batch dropdown management
  const [activeBatchDropdown, setActiveBatchDropdown] = useState(null);
  const batchInputRefs = useRef({});
  const dropdownClickedRef = useRef(false);

  // Popups
  const [popupMessage, setPopupMessage] = useState(null);
  const [confirmationPopup, setConfirmationPopup] = useState(null);

  // Session values
  const departmentId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId");
  const hospitalId = sessionStorage.getItem("hospitalId") || localStorage.getItem("hospitalId");

  // ---------- Fetch pending prescription headers ----------
  const fetchPendingPrescriptions = async () => {
    if (!departmentId) {
      showPopup("Department ID is missing.", "error");
      return;
    }
    setLoading(true);
    try {
      const url = `${GET_PENDING_PRESCRIPTION_HEADERS}/${hospitalId}?page=0&size=5`;
      const response = await getRequest(url);
      let data = [];
      if (response?.response?.content && Array.isArray(response.response.content)) {
        data = response.response.content;
      } else if (response?.response && Array.isArray(response.response)) {
        data = response.response; // fallback
      }
      setPrescriptionList(data);
      setFilteredList(data);
    } catch (error) {
      showPopup("Error fetching pending prescriptions", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPrescriptions();
  }, [departmentId]);

  // ---------- Fetch medicine details for a prescription ----------
  const fetchPrescriptionDetails = async (headerId) => {
    setDetailsLoading(true);
    try {
      const url = `${GET_PRESCRIPTION_DETAILS}/${headerId}`;
      const response = await getRequest(url);
      let items = [];
      if (response?.response && Array.isArray(response.response)) {
        items = response.response;
      }

      const entries = items.map((item) => ({
        id: item.prescriptionDetailsId,
        itemId: item.itemId,
        itemName: item.itemName,
        dosage: item.dosage,
        frequency: item.frequency,
        days: item.days,
        prescribedQty: Number(item.prescribedQty) || 0,
        issueQty: Number(item.issueQty) || Number(item.prescribedQty) || 0,
        batchNo: "",
        stockId: null,
        dom: "",
        doe: "",
        expDate: "",
        batchStock: "",
        availableStock: "",
      }));

      setDetailEntries(entries);

      // Pre‑fetch batch lists for each item
      items.forEach(async (itm) => {
        if (itm.itemId) await fetchBatchesForItem(itm.itemId);
      });
    } catch (error) {
      showPopup("Error fetching prescription details", "error");
    } finally {
      setDetailsLoading(false);
    }
  };

  // ---------- Fetch batches for one item ----------
  const fetchBatchesForItem = async (itemId) => {
    try {
      const url = `${GET_ITEM_BATCHES}/${itemId}?hospitalId=${hospitalId}&departmentId=${DISPENSARY_DEPARTMENT_ID}&minimumClosingStock=0`;
      const response = await getRequest(url);
      let batches = [];
      if (response?.response && Array.isArray(response.response)) {
        batches = response.response;
      }

      const mapped = batches.map((b) => ({
        stockId: b.stockId || null,
        batchNo: b.batchName,
        dom: b.dom,
        doe: b.doe,
        batchStock: Number(b.batchStock) || 0,
        totalAvailableStock: Number(b.availableStock) || 0,
      }));

      setBatchOptions((prev) => ({
        ...prev,
        [itemId]: mapped,
      }));
      return mapped;
    } catch (error) {
      console.error("Error fetching batches for item", itemId, error);
      return [];
    }
  };

  // ---------- Helper: get batch numbers already used by the same item in other rows ----------
  const getUsedBatchNos = (itemId, currentIndex) => {
    return detailEntries
      .filter((e, idx) => idx !== currentIndex && e.itemId === itemId && e.batchNo)
      .map((e) => e.batchNo);
  };

  // ---------- Handle changes in a detail row (only batchNo and issueQty) ----------
  const handleEntryChange = (index, field, value) => {
    const updatedEntries = [...detailEntries];

    if (field === "batchNo") {
      const selectedBatch = batchOptions[updatedEntries[index].itemId]?.find(
        (b) => b.batchNo === value
      );
      const currentEntry = updatedEntries[index];

      if (!selectedBatch) {
        // Clear batch info
        updatedEntries[index] = {
          ...currentEntry,
          batchNo: "",
          stockId: null,
          dom: "",
          doe: "",
          expDate: "",
          batchStock: "",
        };
        setDetailEntries(updatedEntries);
        return;
      }

      const batchStock = selectedBatch.batchStock;
      const prescribedQty = currentEntry.prescribedQty;
      const totalAvailStock = selectedBatch.totalAvailableStock;
      const stockId = selectedBatch.stockId;

      // Auto‑split logic: if batch stock < prescribed qty, split the row
      if (batchStock < prescribedQty) {
        // Cap current row to batch stock
        updatedEntries[index] = {
          ...currentEntry,
          batchNo: value,
          stockId: stockId,
          dom: formatDate(selectedBatch.dom),
          doe: formatDate(selectedBatch.doe),
          expDate: selectedBatch.doe,
          batchStock: batchStock,
          availableStock: totalAvailStock,
          prescribedQty: batchStock,
          issueQty: batchStock,
        };

        // Create a new row with the remaining quantity
        const remainder = prescribedQty - batchStock;
        const newRow = {
          id: null,
          itemId: currentEntry.itemId,
          itemName: currentEntry.itemName,
          dosage: currentEntry.dosage,
          frequency: currentEntry.frequency,
          days: currentEntry.days,
          prescribedQty: remainder,
          issueQty: remainder,
          batchNo: "",
          dom: "",
          doe: "",
          expDate: "",
          batchStock: "",
          availableStock: totalAvailStock,
        };
        updatedEntries.splice(index + 1, 0, newRow);

        if (!batchOptions[currentEntry.itemId]) {
          fetchBatchesForItem(currentEntry.itemId);
        }
      } else {
        // Batch stock is enough – no split needed
        updatedEntries[index] = {
          ...currentEntry,
          batchNo: value,
          stockId: stockId,
          dom: formatDate(selectedBatch.dom),
          doe: formatDate(selectedBatch.doe),
          expDate: selectedBatch.doe,
          batchStock: batchStock,
          availableStock: totalAvailStock,
        };
      }

      setDetailEntries(updatedEntries);
    } else if (field === "issueQty") {
      // issueQty cannot exceed prescribedQty or batchStock
      const qty = value === "" ? "" : Number(value) || 0;
      const prescribed = Number(updatedEntries[index].prescribedQty) || 0;
      const batchStock = Number(updatedEntries[index].batchStock) || 0;

      let finalQty = qty;
      if (qty > prescribed) finalQty = prescribed;
      if (batchStock && qty > batchStock) finalQty = batchStock;

      updatedEntries[index] = {
        ...updatedEntries[index],
        issueQty: finalQty.toString(),
      };
      setDetailEntries(updatedEntries);
    }
  };

  // ---------- Validation before issuing ----------
  const validateSubmission = () => {
    const errors = [];
    if (detailEntries.length === 0) {
      errors.push("No medicines to issue.");
      return errors;
    }

    detailEntries.forEach((entry, idx) => {
      const qtyIssued = Number(entry.issueQty) || 0;
      const prescribedQty = Number(entry.prescribedQty) || 0;

      if (qtyIssued > 0 && !entry.batchNo) {
        errors.push(`Row ${idx + 1}: Please select a batch.`);
      }
      // if (qtyIssued !== prescribedQty) {
      //   errors.push(
      //     `Row ${idx + 1}: Issue Qty (${qtyIssued}) must equal Prescribed Qty (${prescribedQty}).`
      //   );
      // }
    });
    return errors;
  };

  const handleIssueSubmit = () => {
    const errors = validateSubmission();
    if (errors.length > 0) {
      showPopup(errors.join("\n"), "error");
      return;
    }

    showConfirmationPopup(
      `Issue all prescribed medicines for prescription?`,
      "info",
      () => confirmIssue(),
      null,
      "Yes",
      "No"
    );
  };

  // ---------- Confirm and call approve API ----------
  const confirmIssue = async () => {
  setIsIssuing(true);
  try {
    const payload = {
      prescriptionHeaderId: selectedRecord.prescriptionHeaderId,
      prescriptionDetails: detailEntries.map((entry) => ({
        prescriptionDetailsId: entry.id,
        itemId: entry.itemId,
        stockId: entry.stockId,
        batchName: entry.batchNo || "",
        dosage: entry.dosage,
        frequency: entry.frequency,
        days: Number(entry.days) || 0,
        total: Number(entry.prescribedQty) || 0,
        issuedQty: Number(entry.issueQty) || 0,
        instruction: "",
      })),
    };

    const response = await putRequest(APPROVE_PRESCRIPTION_URL, payload);
debugger;
    // The response is the direct JSON object from backend
    const apiStatus = response?.status;
    const apiData = response?.data; // this is PrescriptionApproveHeaderResponse

    // Extract fields with fallbacks
    const prescriptionHdId = apiData?.prescriptionHdId ?? selectedRecord?.prescriptionHeaderId;
    const nisNo = apiData?.response.nisno;

    if (apiStatus === 200 || apiStatus === "200") {
      // Remove issued prescription from lists
      setPrescriptionList((prev) =>
        prev.filter(
          (p) => p.prescriptionHeaderId !== selectedRecord.prescriptionHeaderId
        )
      );
      setFilteredList((prev) =>
        prev.filter(
          (p) => p.prescriptionHeaderId !== selectedRecord.prescriptionHeaderId
        )
      );

      // Show confirmation for printing
      showConfirmationPopup(
        "Prescription Issued Successfully. Do you want to print the report?",
        "success",
        () => {
          const buttons = [
            {
              key: "prescription",
              label: "Prescription Report",
              type: "view",
              url: `${OPD_PRESCRIPTION_SLIP_REPORT}?prescriptionId=${prescriptionHdId}`,
              className: "btn btn-primary",
              icon: "fa fa-file-pdf-o",
              loadingText: "Generating...",
              style: { backgroundColor: "#6aab9c", border: "none" },
            },
            {
              key: "invoice",
              label: "Invoice Report",
              type: "view",
              url: `${PRESCRIPTION_INVOICE_REPORT}?prescriptionId=${prescriptionHdId}`,
              className: "btn btn-warning",
              icon: "fa fa-file-invoice",
              loadingText: "Generating...",
              style: { backgroundColor: "#ffc107", border: "none", color: "#000" },
            },
          ];

          // Add NIS button only if nisNo is present
          if (nisNo && nisNo.trim() !== "") {
            buttons.push({
              key: "nis",
              label: "NIS Report",
              type: "view",
              url: `${ALL_REPORTS}/precriptionNis?prescriptionId=${prescriptionHdId}`,
              className: "btn btn-success",
              icon: "fa fa-file-medical",
              loadingText: "Generating...",
            });
          }

          navigate("/ViewDownloadReportWithDynamicButton", {
            state: {
              title: "Prescription Reports",
              fileName: `Prescription_${prescriptionHdId}.pdf`,
              returnPath: window.location.pathname,
              showBack: true,
              buttons: buttons,
            },
          });
        },
        () => {
          // No: go back to list
          handleBackToList();
        },
        "Yes",
        "No"
      );
    } else {
      const errorMsg = response?.message || "Failed to issue prescription. Please try again.";
      showPopup(errorMsg, "error");
    }
  } catch (error) {
    console.error("Error issuing prescription:", error);
    showPopup("Error issuing prescription.", "error");
  } finally {
    setIsIssuing(false);
  }
};

  // ---------- Close prescription (list view) – NOW READS BODY STATUS ----------
  const handleClosePrescription = (record, e) => {
    e.stopPropagation();
    showConfirmationPopup(
      `Close prescription for ${record.patientName}?`,
      "warning",
      async () => {
        try {
          const url = `/dispensary/closePrescription/${record.prescriptionHeaderId}`;
          const response = await putRequest(url, {});

          // The response may be either the full axios object (response.data) or the body directly.
          // We safely extract the body data and its `status` field.
          const responseData = response?.data || response;
          const bodyStatus = responseData?.status;

          if (bodyStatus === 200) {
            setPrescriptionList((prev) =>
              prev.filter((p) => p.prescriptionHeaderId !== record.prescriptionHeaderId)
            );
            setFilteredList((prev) =>
              prev.filter((p) => p.prescriptionHeaderId !== record.prescriptionHeaderId)
            );
            showPopup("Prescription closed successfully.", "success");
          } else {
            const errorMsg = responseData?.message || "Failed to close prescription.";
            showPopup(errorMsg, "error");
          }
        } catch (error) {
          console.error("Error closing prescription:", error);
          showPopup("Error closing prescription.", "error");
        }
      },
      null,
      "Close",
      "Cancel"
    );
  };

  // ---------- Navigation ----------
  const handleIssueClick = (record) => {
    setSelectedRecord(record);
    fetchPrescriptionDetails(record.prescriptionHeaderId);
    setCurrentView("detail");
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedRecord(null);
    setDetailEntries([]);
  };

  // ---------- Search / Reset ----------
  const handleSearch = () => {
    const filtered = prescriptionList.filter(
      (item) =>
        item.patientName?.toLowerCase().includes(patientName.toLowerCase()) &&
        item.mobileNumber?.includes(mobileNo)
    );
    setFilteredList(filtered);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setPatientName("");
    setMobileNo("");
    setFilteredList(prescriptionList);
    setCurrentPage(1);
  };

  // ---------- Pagination ----------
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredList.slice(indexOfFirst, indexOfLast);

  // ---------- Date formatting helpers ----------
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("en-GB");
  };

  // ---------- Popup helpers ----------
  const showPopup = (msg, type = "info", cb) => {
    setPopupMessage({
      message: msg,
      type,
      onClose: () => {
        setPopupMessage(null);
        if (cb) cb();
      },
    });
  };

  const showConfirmationPopup = (
    msg,
    type,
    onConfirm,
    onCancel,
    confirmText = "Yes",
    cancelText = "No"
  ) => {
    setConfirmationPopup({
      message: msg,
      type,
      onConfirm: () => {
        onConfirm();
        setConfirmationPopup(null);
      },
      onCancel: onCancel
        ? () => {
            onCancel();
            setConfirmationPopup(null);
          }
        : () => setConfirmationPopup(null),
      confirmText,
      cancelText,
    });
  };

  // ---------- Click‑outside to close batch dropdown ----------
  useEffect(() => {
    const handleClick = (e) => {
      const clickedInside = Object.values(batchInputRefs.current).some((ref) =>
        ref?.contains(e.target)
      );
      if (!clickedInside) setActiveBatchDropdown(null);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ==================== DETAIL / ISSUE VIEW ====================
  if (currentView === "detail") {
    return (
      <div className="content-wrapper">
        {loading && <LoadingScreen />}
        <ConfirmationPopup
          show={!!confirmationPopup}
          message={confirmationPopup?.message || ""}
          type={confirmationPopup?.type || "info"}
          onConfirm={confirmationPopup?.onConfirm || (() => {})}
          onCancel={confirmationPopup?.onCancel}
          confirmText={confirmationPopup?.confirmText || "OK"}
          cancelText={confirmationPopup?.cancelText}
        />
        {popupMessage && (
          <Popup
            message={popupMessage.message}
            type={popupMessage.type}
            onClose={popupMessage.onClose}
          />
        )}

        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">
                  Issue Prescription – {selectedRecord?.patientName} (
                  {selectedRecord?.uhidNo})
                </h4>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleBackToList}
                >
                  Back
                </button>
              </div>

              <div className="card-body">
                {/* Prescription & Patient Info */}
                <div className="row mb-4">
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Prescription No.</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.prescriptionHeaderId || ""}
                      readOnly
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Prescription Date</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formatDateTime(selectedRecord?.prescriptionDate)}
                      readOnly
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Department</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.departmentName || ""}
                      readOnly
                    />
                  </div>
                  <div className="col-md-4 mt-2">
                    <label className="form-label fw-bold">Doctor</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.doctorName || ""}
                      readOnly
                    />
                  </div>
                  <div className="col-md-4 mt-2">
                    <label className="form-label fw-bold">Patient Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.patientName || ""}
                      readOnly
                    />
                  </div>
                  <div className="col-md-4 mt-2">
                    <label className="form-label fw-bold">UHID</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.uhidNo || ""}
                      readOnly
                    />
                  </div>
                  <div className="col-md-4 mt-2">
                    <label className="form-label fw-bold">Age / Gender</label>
                    <input
                      type="text"
                      className="form-control"
                      value={`${selectedRecord?.age || ""} / ${
                        selectedRecord?.gender || ""
                      }`}
                      readOnly
                    />
                  </div>
                  <div className="col-md-4 mt-2">
                    <label className="form-label fw-bold">Mobile</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.mobileNumber || ""}
                      readOnly
                    />
                  </div>
                </div>

                {/* Medicine Grid */}
                <div className="table-responsive">
                  <table className="table table-bordered table-hover align-middle text-center">
                    <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                      <tr>
                        <th>S.No.</th>
                        <th>Item Name</th>
                        <th>Dosage</th>
                        <th>Frequency</th>
                        <th>Days</th>
                        <th>Prescribed Qty</th>
                        <th>Batch No.</th>
                        <th>Expiry</th>
                        <th>Issue Qty</th>
                        <th>Batch Stock</th>
                        <th>Available Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailEntries.length === 0 && detailsLoading ? (
                        <tr>
                          <td colSpan="11" className="text-center py-4">
                            <div
                              className="spinner-border text-primary"
                              role="status"
                            />
                            <p className="mt-2">Loading medicine details...</p>
                          </td>
                        </tr>
                      ) : (
                        detailEntries.map((entry, idx) => {
                          const usedBatchNos = getUsedBatchNos(
                            entry.itemId,
                            idx
                          );
                          return (
                            <tr key={entry.id}>
                              <td>{idx + 1}</td>
                              <td>{entry.itemName}</td>
                              <td>{entry.dosage}</td>
                              <td>{entry.frequency}</td>
                              <td>{entry.days}</td>
                              <td>{entry.prescribedQty}</td>
                              {/* Batch dropdown */}
                              <td
                                style={{
                                  position: "relative",
                                  overflow: "visible",
                                }}
                              >
                                <div>
                                  <input
                                    ref={(el) =>
                                      (batchInputRefs.current[idx] = el)
                                    }
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={entry.batchNo}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      handleEntryChange(idx, "batchNo", val);
                                      if (val.length > 0)
                                        setActiveBatchDropdown(idx);
                                    }}
                                    placeholder="Batch"
                                    autoComplete="off"
                                    onFocus={() =>
                                      entry.itemId &&
                                      setActiveBatchDropdown(idx)
                                    }
                                  />
                                  <PortalDropdown
                                    anchorRef={{
                                      current: batchInputRefs.current[idx],
                                    }}
                                    show={
                                      activeBatchDropdown === idx &&
                                      !!entry.itemId &&
                                      !!batchOptions[entry.itemId]
                                    }
                                  >
                                    {batchOptions[entry.itemId]
                                      ?.filter((b) =>
                                        b.batchNo
                                          .toLowerCase()
                                          .includes(entry.batchNo.toLowerCase())
                                      )
                                      .map((batch, bi) => {
                                        const isUsed = usedBatchNos.includes(
                                          batch.batchNo
                                        );
                                        return (
                                          <div
                                            key={`${batch.batchNo}-${bi}`}
                                            className="p-2"
                                            onMouseDown={(e) => {
                                              if (isUsed) {
                                                e.preventDefault();
                                                return;
                                              }
                                              e.preventDefault();
                                              handleEntryChange(
                                                idx,
                                                "batchNo",
                                                batch.batchNo
                                              );
                                              setActiveBatchDropdown(null);
                                            }}
                                            style={{
                                              cursor: isUsed
                                                ? "not-allowed"
                                                : "pointer",
                                              borderBottom:
                                                "1px solid #f0f0f0",
                                              opacity: isUsed ? 0.7 : 1,
                                              backgroundColor: isUsed
                                                ? "#fff8e1"
                                                : "transparent",
                                            }}
                                          >
                                            <div className="d-flex justify-content-between">
                                              <strong>{batch.batchNo}</strong>
                                              {isUsed && (
                                                <span
                                                  style={{
                                                    fontSize: 11,
                                                    background: "#ffc107",
                                                    padding: "2px 6px",
                                                    borderRadius: 4,
                                                  }}
                                                >
                                                  Used
                                                </span>
                                              )}
                                            </div>
                                            <small>
                                              DOM: {formatDate(batch.dom)} |
                                              DOE: {formatDate(batch.doe)}
                                              <br />
                                              Stock: {batch.batchStock} | Total:{" "}
                                              {batch.totalAvailableStock}
                                            </small>
                                          </div>
                                        );
                                      })}
                                    {batchOptions[entry.itemId]?.length ===
                                      0 && (
                                      <div className="p-2 text-muted">
                                        No stock available
                                      </div>
                                    )}
                                  </PortalDropdown>
                                </div>
                              </td>
                              <td>{formatDate(entry.expDate)}</td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={entry.issueQty}
                                  onChange={(e) =>
                                    handleEntryChange(
                                      idx,
                                      "issueQty",
                                      e.target.value
                                    )
                                  }
                                  min="0"
                                  max={entry.prescribedQty}
                                  style={{ width: "80px" }}
                                />
                              </td>
                              <td>{entry.batchStock}</td>
                              <td>{entry.availableStock}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-end mt-4">
                  <button
                    className="btn btn-success me-2"
                    onClick={handleIssueSubmit}
                    disabled={isIssuing || detailsLoading}
                  >
                    {isIssuing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Issuing...
                      </>
                    ) : (
                      "Issue"
                    )}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleBackToList}
                    disabled={isIssuing}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== LIST VIEW ====================
  return (
    <div className="content-wrapper">
      {loading && <LoadingScreen />}
      <ConfirmationPopup
        show={!!confirmationPopup}
        message={confirmationPopup?.message || ""}
        type={confirmationPopup?.type || "info"}
        onConfirm={confirmationPopup?.onConfirm || (() => {})}
        onCancel={confirmationPopup?.onCancel}
        confirmText={confirmationPopup?.confirmText || "OK"}
        cancelText={confirmationPopup?.cancelText}
      />
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">
                Pending Prescription List
              </h4>
            </div>
            <div className="card-body">
              {/* Search filters */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <label className="form-label fw-bold">Patient Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Mobile No.</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter mobile"
                    value={mobileNo}
                    onChange={(e) => setMobileNo(e.target.value)}
                  />
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <button
                    className="btn btn-primary me-2"
                    onClick={handleSearch}
                  >
                    Search
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleReset}
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead
                    style={{ backgroundColor: "#9db4c0", color: "black" }}
                  >
                    <tr>
                      <th>Prescription No.</th>
                      <th>Prescription Date</th>
                      <th>Patient Name</th>
                      <th>Mobile No.</th>
                      <th>Age/Gender</th>
                      <th>Department</th>
                      <th>Doctor</th>
                      <th className="text-center">Close</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((item) => (
                        <tr
                          key={item.prescriptionHeaderId}
                          onClick={() => handleIssueClick(item)}
                          style={{ cursor: "pointer" }}
                        >
                          <td>{item.prescriptionNo}</td>
                          <td>{formatDateTime(item.prescriptionDate)}</td>
                          <td>{item.patientName}</td>
                          <td>{item.mobileNumber}</td>
                          <td>
                            {item.age} / {item.gender}
                          </td>
                          <td>{item.departmentName}</td>
                          <td>{item.doctorName}</td>
                          <td className="text-center">
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={(e) =>
                                handleClosePrescription(item, e)
                              }
                              title="Close Prescription"
                            >
                              Close
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center">
                          No pending prescriptions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                totalItems={filteredList.length}
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

export default PrescriptionIssue;