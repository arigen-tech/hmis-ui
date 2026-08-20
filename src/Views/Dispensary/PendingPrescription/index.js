import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Popup from "../../../Components/popup";
import ConfirmationPopup from "../../../Components/ConfirmationPopup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, putRequest } from "../../../service/apiService";
import {
  ALL_REPORTS,
  DISPENSARY_DEPARTMENT_ID,
  GET_PENDING_PRESCRIPTION_HEADERS,
  OPD_PRESCRIPTION_SLIP_REPORT,
  GET_PRESCRIPTION_DETAILS,
  APPROVE_PRESCRIPTION_URL,
  PRESCRIPTION_INVOICE_REPORT,
  GET_ITEM_BATCHES_EXCEPT_STOCK,
} from "../../../config/apiConfig";
import ViewDownloadWithUnlimitedButtons from "../../../Components/ViewDownloadWithUnlimitedButtons";



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

  // Search / filter
  const [patientName, setPatientName] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Popups
  const [popupMessage, setPopupMessage] = useState(null);
  const [confirmationPopup, setConfirmationPopup] = useState(null);

  // Session values
  const departmentId =
    sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId");
  const hospitalId =
    sessionStorage.getItem("hospitalId") || localStorage.getItem("hospitalId");

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
        data = response.response;
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

  // ---------- Fetch a single batch for an item (auto-fill) ----------
  const fetchBatchForItem = async (itemId, excludeStockIds = []) => {
    try {
      const params = new URLSearchParams();
      params.append("hospitalId", hospitalId);
      params.append("departmentId", DISPENSARY_DEPARTMENT_ID);
      params.append("minimumClosingStock", "0");
      excludeStockIds.forEach((id) => params.append("excludeStockIds", id));

      const url = `${GET_ITEM_BATCHES_EXCEPT_STOCK}/${itemId}?${params.toString()}`;
      const response = await getRequest(url);

      const apiStatus = response?.status;
      if (apiStatus === 200) {
        const batch = response?.response;
        return {
          stockId: batch.stockId,
          batchName: batch.batchName,
          dom: batch.dom,
          doe: batch.doe,
          batchStock: Number(batch.batchStock) || 0,
          availableStock: Number(batch.availableStock) || 0,
        };
      } else if (apiStatus === 404) {
        return null; // No batch available
      } else {
        // Internal server error or other error
        showPopup(response?.message || "Error fetching batch", "error");
        return null;
      }
    } catch (error) {
      console.error("Error fetching batch for item", itemId, error);
      showPopup("Error fetching batch", "error");
      return null;
    }
  };

  // ---------- Process one entry: auto-fill batch, split if needed ----------
  const processEntry = async (entry) => {
    const initialBatch = await fetchBatchForItem(entry.itemId, []);

    if (!initialBatch) {
      // No batch available – mark as "Batch Not Found", issueQty = 0
      return [
        {
          ...entry,
          batchNo: "Batch Not Found",
          stockId: null,
          dom: "",
          doe: "",
          expDate: "",
          batchStock: 0,
          availableStock: 0,
          issueQty: 0,
        },
      ];
    }

    const batchStock = initialBatch.batchStock;
    const prescribedQty = Number(entry.prescribedQty) || 0;
    const availableStock = initialBatch.availableStock;

    const baseEntry = {
      ...entry,
      batchNo: initialBatch.batchName,
      stockId: initialBatch.stockId,
      dom: initialBatch.dom,
      doe: initialBatch.doe,
      expDate: initialBatch.doe,
      batchStock: batchStock,
      availableStock: availableStock,
    };

    if (batchStock < prescribedQty && prescribedQty <= availableStock) {
      // Split: first row gets batchStock, second row gets remainder from another batch
      const firstRow = {
        ...baseEntry,
        prescribedQty: batchStock,
        issueQty: batchStock,
      };

      const remainder = prescribedQty - batchStock;
      const secondBatch = await fetchBatchForItem(entry.itemId, [initialBatch.stockId]);

      let secondRow;
      if (secondBatch) {
        secondRow = {
          ...entry,
          id: null, // new row
          prescribedQty: remainder,
          issueQty: Math.min(remainder, secondBatch.batchStock),
          batchNo: secondBatch.batchName,
          stockId: secondBatch.stockId,
          dom: secondBatch.dom,
          doe: secondBatch.doe,
          expDate: secondBatch.doe,
          batchStock: secondBatch.batchStock,
          availableStock: secondBatch.availableStock,
        };
      } else {
        // No second batch available
        secondRow = {
          ...entry,
          id: null,
          prescribedQty: remainder,
          issueQty: 0,
          batchNo: "Batch Not Found",
          stockId: null,
          dom: "",
          doe: "",
          expDate: "",
          batchStock: 0,
          availableStock: 0,
        };
      }

      return [firstRow, secondRow];
    } else {
      // No split – issue full prescribed quantity (or whatever is available)
      baseEntry.issueQty = Math.min(prescribedQty, batchStock);
      return [baseEntry];
    }
  };

  // ---------- Fetch medicine details and auto-fill batches ----------
  const fetchPrescriptionDetails = async (headerId) => {
    setDetailsLoading(true);
    try {
      const url = `${GET_PRESCRIPTION_DETAILS}/${headerId}`;
      const response = await getRequest(url);
      let items = [];
      if (response?.response && Array.isArray(response.response)) {
        items = response.response;
      }

      // Build initial entries from prescription details (no batch info yet)
      const initialEntries = items.map((item) => ({
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

      // Process each entry (auto-fill batch, split if necessary)
      const processedArrays = await Promise.all(initialEntries.map((entry) => processEntry(entry)));
      const flatEntries = processedArrays.flat();
      setDetailEntries(flatEntries);
    } catch (error) {
      showPopup("Error fetching prescription details", "error");
    } finally {
      setDetailsLoading(false);
    }
  };

  // ---------- Handle changes in a detail row (only issueQty) ----------
  const handleEntryChange = (index, field, value) => {
    const updatedEntries = [...detailEntries];

    if (field === "issueQty") {
      const qty = value === "" ? "" : Number(value) || 0;
      const prescribed = Number(updatedEntries[index].prescribedQty) || 0;
      const batchStock = Number(updatedEntries[index].batchStock) || 0;

      let finalQty = qty;
      if (qty > prescribed) finalQty = prescribed;
      if (batchStock > 0) {
        if (qty > batchStock) finalQty = batchStock;
      } else {
        // If no batch stock, issue qty must be 0 (input is disabled anyway)
        finalQty = 0;
      }

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

    let totalIssued = 0;
    detailEntries.forEach((entry, idx) => {
      const qtyIssued = Number(entry.issueQty) || 0;
      totalIssued += qtyIssued;
      if (qtyIssued > 0 && !entry.stockId) {
        errors.push(`Row ${idx + 1}: Batch not available for issued quantity.`);
      }
    });

    if (totalIssued === 0) {
      errors.push("Please issue at least one medicine.");
    }
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
          batchName: entry.stockId ? entry.batchNo : null,
          dosage: entry.dosage,
          frequency: entry.frequency,
          days: Number(entry.days) || 0,
          total: Number(entry.prescribedQty) || 0,
          issuedQty: Number(entry.issueQty) || 0,
          instruction: "",
        })),
      };

      const response = await putRequest(APPROVE_PRESCRIPTION_URL, payload);
      const apiStatus = response?.status;
      const apiData = response?.data;

      const prescriptionHdId = apiData?.prescriptionHdId ?? selectedRecord?.prescriptionHeaderId;
      const prescriptionNumber=selectedRecord.prescriptionNo;
      const nisNo = apiData?.response?.nisno;

      if (apiStatus === 200 || apiStatus === "200") {
        setPrescriptionList((prev) =>
          prev.filter((p) => p.prescriptionHeaderId !== selectedRecord.prescriptionHeaderId)
        );
        setFilteredList((prev) =>
          prev.filter((p) => p.prescriptionHeaderId !== selectedRecord.prescriptionHeaderId)
        );

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
                fileName: `Prescription_${prescriptionNumber}.pdf`,
                returnPath: window.location.pathname,
                showBack: true,
                buttons: buttons,
              },
            });
          },
          () => {
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

  // ---------- Close prescription (list view) ----------
  const handleClosePrescription = (record, e) => {
    e.stopPropagation();
    showConfirmationPopup(
      `Close prescription for ${record.patientName}?`,
      "warning",
      async () => {
        try {
          const url = `/dispensary/closePrescription/${record.prescriptionHeaderId}`;
          const response = await putRequest(url, {});

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
                  Issue Prescription – {selectedRecord?.patientName} ({selectedRecord?.uhidNo})
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
                      value={selectedRecord?.prescriptionNo || ""}
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
                      value={`${selectedRecord?.age || ""} / ${selectedRecord?.gender || ""}`}
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
                            <div className="spinner-border text-primary" role="status" />
                            <p className="mt-2">Loading medicine details...</p>
                          </td>
                        </tr>
                      ) : (
                        detailEntries.map((entry, idx) => (
                          <tr key={entry.id || `new-${idx}`}>
                            <td>{idx + 1}</td>
                            <td>{entry.itemName}</td>
                            <td>{entry.dosage}</td>
                            <td>{entry.frequency}</td>
                            <td>{entry.days}</td>
                            <td>{entry.prescribedQty}</td>
                            {/* Batch No: read-only, shows details on hover */}
                            <td>
                              <span
                                title={
                                  entry.batchNo && entry.batchNo !== "Batch Not Found"
                                    ? `DOM: ${formatDate(entry.dom)}\nDOE: ${formatDate(entry.doe)}\nBatch Stock: ${entry.batchStock}\nAvailable Stock: ${entry.availableStock}`
                                    : "No batch available"
                                }
                                style={{
                                  color: entry.batchNo === "Batch Not Found" ? "red" : "inherit",
                                  fontWeight: entry.batchNo === "Batch Not Found" ? "bold" : "normal",
                                  cursor:
                                    entry.batchNo && entry.batchNo !== "Batch Not Found"
                                      ? "help"
                                      : "default",
                                }}
                              >
                                {entry.batchNo || "N/A"}
                              </span>
                            </td>
                            <td>{formatDate(entry.expDate) || "N/A"}</td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={entry.issueQty}
                                onChange={(e) => handleEntryChange(idx, "issueQty", e.target.value)}
                                min="0"
                                max={entry.batchStock > 0 ? entry.batchStock : 0}
                                style={{ width: "80px" }}
                                disabled={!entry.stockId}
                              />
                            </td>
                            <td>{entry.batchStock}</td>
                            <td>{entry.availableStock}</td>
                          </tr>
                        ))
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
              <h4 className="card-title p-2 mb-0">Pending Prescription List</h4>
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
                  <button className="btn btn-primary me-2" onClick={handleSearch}>
                    Search
                  </button>
                  <button className="btn btn-secondary" onClick={handleReset}>
                    Reset
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
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
                              onClick={(e) => handleClosePrescription(item, e)}
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