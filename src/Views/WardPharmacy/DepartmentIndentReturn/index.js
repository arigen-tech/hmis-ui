import { useEffect, useState } from "react"
import { useNavigate } from 'react-router-dom';
import LoadingScreen from "../../../Components/Loading"
import Popup from "../../../Components/popup"
import ConfirmationPopup from "../../../Components/ConfirmationPopup";
import DatePicker from "../../../Components/DatePicker"
import Pagination, {DEFAULT_ITEMS_PER_PAGE} from "../../../Components/Pagination";
import { formatDateForDisplay, formatDateTimeForDisplay } from "../../../utils/dateUtils";

// Inline text constants (no external constants file needed)
const ERROR_DEPARTMENT_ID_NOT_FOUND = "Department ID not found.";
const ERROR_FETCH_INDENTS = "Failed to fetch indents.";
const CONFIRM_SAVE_INDENT_RECEIVING = "Are you sure you want to save this receiving?";
const SUCCESS_RECEIVING_SAVED_PRINT = "Receiving saved successfully. Do you want to print the report?";
const ERROR_SAVE_RECEIVING_FAILED = "Failed to save receiving.";
const ERROR_SAVING_RECEIVING = "An error occurred while saving receiving.";
const ERROR_FETCH_INDENT_DETAILS = "Failed to fetch indent details.";
const RECEIVED_QUANTITY_EXCEEDS_ISSUED = "Received quantity cannot exceed issued quantity";
const REJECT_QUANTITY_EXCEEDS_ISSUED = "Reject quantity cannot exceed issued quantity";
const VALIDATION_ERROR_HEADER = "Please fix the following errors:";
const ITEM_RECEIVING_REPORT_TITLE = "Item Receiving Report";
const ITEM_RECEIVING_REPORT_FILENAME = "ItemReceivingReport";

// Sample mock data so the UI has something to render.
// Replace this with your real data source.
const MOCK_INDENT_HEADERS = [
  { indentMId: 1, indentNo: "IND-1001", indentDate: "2026-08-01T10:00:00", issueNo: "ISS-5001", issueDate: "2026-08-02T09:30:00" },
  { indentMId: 2, indentNo: "IND-1002", indentDate: "2026-08-03T11:15:00", issueNo: "ISS-5002", issueDate: "2026-08-04T14:00:00" },
  { indentMId: 3, indentNo: "IND-1003", indentDate: "2026-08-05T08:45:00", issueNo: "ISS-5003", issueDate: "2026-08-06T16:20:00" },
  { indentMId: 4, indentNo: "IND-1004", indentDate: "2026-08-07T13:00:00", issueNo: "ISS-5004", issueDate: "2026-08-08T10:10:00" },
  { indentMId: 5, indentNo: "IND-1005", indentDate: "2026-08-09T09:00:00", issueNo: "ISS-5005", issueDate: "2026-08-10T12:00:00" },
  { indentMId: 6, indentNo: "IND-1006", indentDate: "2026-08-11T15:30:00", issueNo: "ISS-5006", issueDate: "2026-08-12T09:00:00" },
];

const MOCK_INDENT_DETAILS = {
  1: [
    { indentTId: 101, itemId: 1, drugCode: "PVM-001", drugName: "Paracetamol 500mg", apu: "Strip", batchNo: "B2201", dom: "2026-01-01", doe: "2027-01-01", qtyDemanded: 100, qtyIssued: 90, previousReceivedQty: 0, manufacturerName: "ABC Pharma", brandName: "Crocin" },
    { indentTId: 102, itemId: 2, drugCode: "PVM-002", drugName: "Amoxicillin 250mg", apu: "Strip", batchNo: "B2202", dom: "2026-02-01", doe: "2027-02-01", qtyDemanded: 50, qtyIssued: 45, previousReceivedQty: 5, manufacturerName: "XYZ Pharma", brandName: "Amoxil" },
  ],
  2: [
    { indentTId: 201, itemId: 3, drugCode: "PVM-003", drugName: "Ibuprofen 400mg", apu: "Strip", batchNo: "B2301", dom: "2026-03-01", doe: "2027-03-01", qtyDemanded: 60, qtyIssued: 60, previousReceivedQty: 0, manufacturerName: "MedLife", brandName: "Brufen" },
  ],
  3: [
    { indentTId: 301, itemId: 4, drugCode: "PVM-004", drugName: "Cetirizine 10mg", apu: "Strip", batchNo: "B2401", dom: "2026-04-01", doe: "2027-04-01", qtyDemanded: 30, qtyIssued: 30, previousReceivedQty: 0, manufacturerName: "HealthCo", brandName: "Zyrtec" },
    { indentTId: 302, itemId: 5, drugCode: "PVM-005", drugName: "Metformin 500mg", apu: "Strip", batchNo: "B2402", dom: "2026-04-05", doe: "2027-04-05", qtyDemanded: 80, qtyIssued: 75, previousReceivedQty: 0, manufacturerName: "MedLife", brandName: "Glycomet" },
  ],
  4: [
    { indentTId: 401, itemId: 6, drugCode: "PVM-006", drugName: "Azithromycin 500mg", apu: "Strip", batchNo: "B2501", dom: "2026-05-01", doe: "2027-05-01", qtyDemanded: 40, qtyIssued: 40, previousReceivedQty: 0, manufacturerName: "ABC Pharma", brandName: "Zithromax" },
  ],
  5: [
    { indentTId: 501, itemId: 7, drugCode: "PVM-007", drugName: "Omeprazole 20mg", apu: "Strip", batchNo: "B2601", dom: "2026-06-01", doe: "2027-06-01", qtyDemanded: 70, qtyIssued: 65, previousReceivedQty: 0, manufacturerName: "HealthCo", brandName: "Prilosec" },
    { indentTId: 502, itemId: 8, drugCode: "PVM-008", drugName: "Losartan 50mg", apu: "Strip", batchNo: "B2602", dom: "2026-06-05", doe: "2027-06-05", qtyDemanded: 55, qtyIssued: 50, previousReceivedQty: 0, manufacturerName: "XYZ Pharma", brandName: "Cozaar" },
  ],
  6: [
    { indentTId: 601, itemId: 9, drugCode: "PVM-009", drugName: "Atorvastatin 10mg", apu: "Strip", batchNo: "B2701", dom: "2026-07-01", doe: "2027-07-01", qtyDemanded: 45, qtyIssued: 45, previousReceivedQty: 0, manufacturerName: "MedLife", brandName: "Lipitor" },
  ],
};

const DepartmentIndentReturn = () => {
  const [indentHeaders, setIndentHeaders] = useState([]) // Renamed from indentData
  const [filteredIndentHeaders, setFilteredIndentHeaders] = useState([]) // Renamed from filteredIndentData
  const [currentView, setCurrentView] = useState("list")
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [receivingItems, setReceivingItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false) // New state for details loading
  const [isSearching, setIsSearching] = useState(false) // New state for search
  const [popupMessage, setPopupMessage] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [confirmationPopup, setConfirmationPopup] = useState(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const itemsPerPage = 5

  // Date filters
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const navigate = useNavigate();

  const hospitalId = sessionStorage.getItem("hospitalId") || localStorage.getItem("hospitalId")
  const departmentId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId")

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

  // Fetch indents headers for receiving
  // Using mock data below — swap this out for your real data-fetching logic
  const fetchIndentHeaders = async () => {
    try {
      setLoading(true);

      const fromDeptId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId");

      if (!fromDeptId) {
        // Not blocking on missing department id since this is mock data
      }

      // TODO: replace MOCK_INDENT_HEADERS with your real fetched data
      const data = MOCK_INDENT_HEADERS;

      setIndentHeaders(data);
      setFilteredIndentHeaders(data);

    } catch (err) {
      showPopup(ERROR_FETCH_INDENTS, "error");
      setIndentHeaders([]);
      setFilteredIndentHeaders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch indent details when row is clicked
  // Using mock data below — swap this out for your real data-fetching logic
  const fetchIndentDetails = async (indentMId) => {
    try {
      setLoadingDetails(true); // Enable loading state for details

      // TODO: replace with your real fetched details, then transform below
      const items = MOCK_INDENT_DETAILS[indentMId] || [];

      const transformedItems = items.map((item, index) => ({
        id: `${item.indentTId}-${index}`,
        indentTId: item.indentTId,
        itemId: item.itemId,
        drugCode: item.drugCode,
        drugName: item.drugName,
        apu: item.apu,
        batchNo: item.batchNo || "N/A",
        dom: item.dom || "",
        doe: item.doe || "",
        qtyDemanded: item.qtyDemanded || 0,
        qtyIssued: item.qtyIssued || 0,
        qtyReceived: item.qtyIssued || 0, // Default to issued quantity
        qtyReject: 0,
        previousReceivedQty: item.previousReceivedQty || 0,
        batchstock: 0,
        manufacturerName: item.manufacturerName || "",
        brandName: item.brandName || ""
      }));

      setReceivingItems(transformedItems);

    } catch (err) {
      showPopup(ERROR_FETCH_INDENT_DETAILS, "error");
      setReceivingItems([]);
    } finally {
      setLoadingDetails(false); // Disable loading state for details
    }
  };

  // Fetch indents headers on component mount
  useEffect(() => {
    fetchIndentHeaders();
  }, []);

  // Show popup function using your Popup component
  const showPopup = (message, type = "default") => {
    setPopupMessage({
      message,
      type,
      onClose: () => setPopupMessage(null)
    });
  };

  const handleSearch = () => {
    if (!fromDate || !toDate) {
      setFilteredIndentHeaders(indentHeaders)
      setCurrentPage(1)
      return
    }

    setIsSearching(true); // Set searching state to true

    // Simulate a slight delay to show the searching state
    setTimeout(() => {
      const from = new Date(fromDate)
      const to = new Date(toDate)
      const filtered = indentHeaders.filter((item) => {
        const itemDate = new Date(item.indentDate)
        return itemDate >= from && itemDate <= to
      })
      setFilteredIndentHeaders(filtered)
      setCurrentPage(1)
      setIsSearching(false); // Set searching state to false
    }, 300); // Small delay to ensure spinner is visible
  }

  const handleShowAll = () => {
    setFromDate("")
    setToDate("")
    setFilteredIndentHeaders(indentHeaders)
    setCurrentPage(1)
  }

  const handleRowClick = async (record) => {
    setSelectedRecord(record);
    setCurrentView("detail");

    // Fetch details
    await fetchIndentDetails(record.indentMId);
  }

  const handleBack = () => {
    setCurrentView("list")
    setSelectedRecord(null)
    setReceivingItems([])
  }

  const handleQtyReceivedChange = (index, value) => {
    const updated = [...receivingItems]
    const qtyReceived = value === "" ? 0 : Number(value);
    const qtyIssued = updated[index].qtyIssued || 0;

    // Validate received quantity - cannot be less than 0
    if (qtyReceived < 0) {
      return;
    }

    // Ensure received quantity doesn't exceed issued quantity
    let validQtyReceived = qtyReceived;
    if (validQtyReceived > qtyIssued) {
      validQtyReceived = qtyIssued;
      showPopup(`${RECEIVED_QUANTITY_EXCEEDS_ISSUED} (${qtyIssued})`, "warning");
    }

    // Calculate reject quantity as issued - received
    const qtyReject = qtyIssued - validQtyReceived;

    updated[index] = {
      ...updated[index],
      qtyReceived: validQtyReceived,
      qtyReject: qtyReject >= 0 ? qtyReject : 0,
    }
    setReceivingItems(updated)
  }

  const handleQtyRejectChange = (index, value) => {
    const updated = [...receivingItems]
    const qtyReject = value === "" ? 0 : Number(value);
    const qtyIssued = updated[index].qtyIssued || 0;

    // Validate reject quantity - cannot be less than 0
    if (qtyReject < 0) {
      return;
    }

    // Ensure reject quantity doesn't exceed issued quantity
    let validQtyReject = qtyReject;
    if (validQtyReject > qtyIssued) {
      validQtyReject = qtyIssued;
      showPopup(`${REJECT_QUANTITY_EXCEEDS_ISSUED} (${qtyIssued})`, "warning");
    }

    // Calculate received quantity as issued - reject
    const qtyReceived = qtyIssued - validQtyReject;

    updated[index] = {
      ...updated[index],
      qtyReject: validQtyReject,
      qtyReceived: qtyReceived >= 0 ? qtyReceived : 0,
    }
    setReceivingItems(updated)
  }

  // Handle save receiving
  const handleSaveReceiving = async () => {
    if (isSaving) return;

    // Validate all items first
    let validationErrors = [];

    receivingItems.forEach((item) => {
      const qtyIssued = item.qtyIssued || 0;
      const qtyReceived = item.qtyReceived || 0;
      const qtyReject = item.qtyReject || 0;
      const total = qtyReceived + qtyReject;

      if (total !== qtyIssued) {
        validationErrors.push(
          `${item.drugName} - Batch ${item.batchNo}: Received + Rejected quantity must equal the issued quantity (${qtyIssued}).`
        );
      }
    });

    if (validationErrors.length > 0) {
      showPopup(
        `${VALIDATION_ERROR_HEADER}\n\n${validationErrors.join("\n\n")}`,
        "warning"
      );
      return;
    }

    showConfirmationPopup(
      CONFIRM_SAVE_INDENT_RECEIVING,
      "info",
      () => {
        handleConfirmSaveReceiving();
      },
      () => {
        console.log("Save receiving cancelled by user");
      },
      "Yes, Save",
      "Cancel"
    );
  };

  // Confirm save receiving function
  // Using mock response below — swap this out for your real save logic
  const handleConfirmSaveReceiving = async () => {
    setIsSaving(true);

    try {
      // Prepare payload
      const payload = {
        indentMId: selectedRecord?.indentMId,
        issueNo: selectedRecord?.issueNo,
        receivingDate: new Date().toISOString(),
        remarks: selectedRecord?.remark || "",
        items: receivingItems.map(item => ({
          indentTId: item.indentTId,
          itemId: item.itemId,
          batchNo: item.batchNo,
          qtyIssued: item.qtyIssued || 0,
          qtyReceived: item.qtyReceived || 0,
          qtyRejected: item.qtyReject || 0,
          previousReceivedQty: item.previousReceivedQty || 0,
        }))
      };

      // TODO: send payload here and handle response
      const response = { status: 200, response: { receiveMId: null } };

      if (response && response.status === 200) {
        const responseData = response.response || {};
        let message = responseData.message || "Receiving saved successfully!";

        if (responseData.returnCreated) {
          message += " " + (responseData.returnMessage || "Return created for rejected items.");
        }

        const receiveMId = response.response.receiveMId;

        showConfirmationPopup(
          SUCCESS_RECEIVING_SAVED_PRINT,
          "success",
          () => {
            navigate('/ViewDownloadReport', {
              state: {
                reportUrl: `?${receiveMId}`,
                title: ITEM_RECEIVING_REPORT_TITLE,
                fileName: ITEM_RECEIVING_REPORT_FILENAME,
                returnPath: window.location.pathname
              }
            });

            handleBack();
            fetchIndentHeaders(); // Refresh the headers list
          },
          () => {
            handleBack();
            fetchIndentHeaders(); // Refresh the headers list
          },
          "Yes",
          "No"
        );
      } else {
        showConfirmationPopup(
          response?.message || ERROR_SAVE_RECEIVING_FAILED,
          "error",
          () => {},
          null,
          "OK",
          "Close"
        );
        setIsSaving(false);
      }

    } catch (error) {
      showConfirmationPopup(
        ERROR_SAVING_RECEIVING,
        "error",
        () => {},
        null,
        "OK",
        "Close"
      );

    } finally {
      setIsSaving(false);
    }
  };

  // Pagination slice
  const totalPages = Math.ceil(filteredIndentHeaders.length / itemsPerPage) || 1
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredIndentHeaders.slice(indexOfFirst, indexOfLast);

  // Detail view
  if (currentView === "detail") {
    return (
      <div className="content-wrapper">
        {(loading) && <LoadingScreen />}

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
                <h4 className="card-title p-2 mb-0 fw-bold">Department Return</h4>
                <button type="button" className="btn btn-secondary" onClick={handleBack}>
                  Back
                </button>
              </div>
              <div className="card-body">
                {/* Header fields */}
                <div className="row mb-4">
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Indent No.</label>
                    <input type="text" className="form-control" value={selectedRecord?.indentNo || ""} readOnly style={{ backgroundColor: "#e9ecef" }} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Indent Date</label>
                    <input type="text" className="form-control" value={formatDateTimeForDisplay(selectedRecord?.indentDate)} readOnly style={{ backgroundColor: "#e9ecef" }} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Issue Date</label>
                    <input type="text" className="form-control" value={formatDateTimeForDisplay(selectedRecord?.issueDate)} readOnly style={{ backgroundColor: "#e9ecef" }} />
                  </div>
                  <div className="col-md-4 mt-2">
                    <label className="form-label fw-bold">Issue No.</label>
                    <input type="text" className="form-control" value={selectedRecord?.issueNo || ""} readOnly style={{ backgroundColor: "#e9ecef" }} />
                  </div>
                </div>

                {/* Items table with loading spinner */}
                <div className="table-responsive">
                  <table className="table table-bordered align-middle text-center">
                    <thead>
                      <tr>
                        <th style={{ width: "60px" }}>S.No.</th>
                        <th style={{ minWidth: "140px" }}>Item Code</th>
                        <th style={{ minWidth: "240px" }}>Item Name</th>
                        <th style={{ width: "80px" }}>A/U</th>
                        <th style={{ width: "140px" }}>Batch No.</th>
                        <th style={{ width: "120px" }}>DOM</th>
                        <th style={{ width: "120px" }}>DOE</th>
                        <th style={{ width: "120px" }}>Qty Demanded</th>
                        <th style={{ width: "120px" }}>Qty Issued</th>
                        <th style={{ width: "140px" }}>Qty Received</th>
                        <th style={{ width: "140px" }}>Qty Reject</th>
                        <th style={{ width: "160px" }}>Previous Received Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingDetails ? (
                        <tr>
                          <td colSpan={12} className="text-center py-5">
                            <div className="d-flex justify-content-center align-items-center">
                              <div className="spinner-border text-primary me-2" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                              <span className="text-muted">Loading indent details...</span>
                            </div>
                          </td>
                        </tr>
                      ) : receivingItems.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="text-center">
                            No items found for this indent.
                          </td>
                        </tr>
                      ) : (
                        receivingItems.map((item, idx) => {
                          const qtyIssued = item.qtyIssued || 0;
                          const qtyReceived = item.qtyReceived || 0;
                          const qtyReject = item.qtyReject || 0;
                          const isValid = (qtyReceived + qtyReject) === qtyIssued;

                          return (
                            <tr
                              key={item.id || idx}
                              className={item.qtyIssued === 0 ? "table-warning" : ""}
                            >
                              <td className="fw-bold">{idx + 1}</td>
                              <td>{item.drugCode}</td>
                              <td className="text-start">
                                {item.drugName}
                                <br />
                                <small className="text-muted">
                                  Mfg: {item.manufacturerName} | Brand: {item.brandName}
                                </small>
                              </td>
                              <td>{item.apu}</td>
                              <td>{item.batchNo}</td>
                              <td>{formatDateForDisplay(item.dom)}</td>
                              <td>{formatDateForDisplay(item.doe)}</td>
                              <td>{item.qtyDemanded}</td>
                              <td >{qtyIssued}</td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm text-center"
                                  value={qtyReceived}
                                  onChange={(e) => handleQtyReceivedChange(idx, e.target.value)}
                                  min="0"
                                  max={qtyIssued}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm text-center"
                                  value={qtyReject}
                                  onChange={(e) => handleQtyRejectChange(idx, e.target.value)}
                                  min="0"
                                  max={qtyIssued}
                                />
                              </td>
                              <td>
                                <span
                                  className="badge"
                                  style={{
                                    backgroundColor: item.previousReceivedQty > 0 ? "#d1ecf1" : "#f8f9fa",
                                    color: item.previousReceivedQty > 0 ? "#0c5460" : "#6c757d",
                                    padding: "6px 12px",
                                    borderRadius: "4px",
                                  }}
                                >
                                  {item.previousReceivedQty}
                                </span>
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
                    onClick={handleSaveReceiving}
                    disabled={loading || loadingDetails || isSaving || receivingItems.length === 0}
                  >
                    {isSaving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : "Receive"}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleBack} disabled={isSaving}>
                    Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Popup Component */}
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

  // List view
  return (
    <div className="content-wrapper">
      {(loading ) && <LoadingScreen />}

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
              <h4 className="card-title p-2 mb-0 fw-bold">Department Indent Return</h4>
              <div>
                <button type="button" className="btn btn-primary" onClick={handleShowAll}>
                  Show All
                </button>
              </div>
            </div>
            <div className="card-body">
              {/* Search Row */}
              <div className="row mb-3">
                <div className="col-md-3">
                  <DatePicker
                    label="From Date"
                    value={fromDate}
                    onChange={setFromDate}
                    compact={true}
                  />
                </div>
                <div className="col-md-3">
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
                    className="btn btn-primary"
                    onClick={handleSearch}
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Searching...
                      </>
                    ) : "Search"}
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="table-responsive">
                <table className="table table-bordered align-middle">
                  <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                    <tr>
                      <th>Indent No.</th>
                      <th>Indent Date</th>
                      <th>Issue No.</th>
                      <th>Issue Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center">
                          {loading ? <LoadingScreen /> : "No records found."}
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((item) => (
                        <tr
                          key={item.indentMId}
                          onClick={() => handleRowClick(item)}
                          style={{ cursor: "pointer" }}
                          className="hover-row"
                        >
                          <td>{item.indentNo}</td>
                          <td>{formatDateForDisplay(item.indentDate)}</td>
                          <td>{item.issueNo}</td>
                          <td>{formatDateForDisplay(item.issueDate)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                totalItems={filteredIndentHeaders.length}
                itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Popup Component for list view */}
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

export default DepartmentIndentReturn;
